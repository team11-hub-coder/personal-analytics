// Object detection — MediaPipe Face Detection + YOLOv8-small via ONNX Runtime Web
// Face: MediaPipe FaceDetector (accurate, fast, cross-browser)
// Phone/Person: YOLOv8-small ONNX model with WebGL backend

import * as ort from "onnxruntime-web";
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";

export interface DetectionResult {
  faceDetected: boolean;
  phoneDetected: boolean;
  faceCount: number;
  confidence: number;
  personDetected: boolean;
}

// ─── Constants ────────────────────────────────────────────────

const YOLO_INPUT_SIZE = 640;
const CONFIDENCE_THRESHOLD = 0.65;
const NMS_IOU_THRESHOLD = 0.45;
const DETECTION_INTERVAL_MS = 1000;
const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 480;

// YOLO class indices
const PERSON_CLASS = 0;
const CELL_PHONE_CLASS = 67;

// Temporal smoothing
const SLIDING_WINDOW_SIZE = 5;
const MIN_POSITIVE_FRAMES = 3;
const CONSECUTIVE_FRAMES_REQUIRED = 2;

// ─── State ────────────────────────────────────────────────────

let yoloSession: ort.InferenceSession | null = null;
let faceDetector: FaceDetector | null = null;
let modelsReady = false;
let previousFrame: ImageData | null = null;
let frameCanvas: HTMLCanvasElement | null = null;
let frameCtx: CanvasRenderingContext2D | null = null;

// Temporal smoothing buffers
const faceDetectionWindow: boolean[] = [];
const phoneDetectionWindow: boolean[] = [];

// ─── Model Loading ────────────────────────────────────────────

export async function loadModels(): Promise<void> {
  // Load MediaPipe Face Detector
  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    faceDetector = await FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      minDetectionConfidence: 0.6,
      minSuppressionThreshold: 0.3,
    });
    console.log("MediaPipe FaceDetector loaded successfully");
  } catch (err) {
    console.error("Failed to load MediaPipe FaceDetector:", err);
    faceDetector = null;
  }

  // Load YOLOv8-nano ONNX model for phone/person detection
  try {
    ort.env.wasm.numThreads = 1;

    const modelPath = "/models/yolov8n.onnx";
    yoloSession = await ort.InferenceSession.create(modelPath, {
      executionProviders: ["wasm"],
    });
    console.log("YOLOv8-nano model loaded successfully");
  } catch (err) {
    console.warn("YOLO model failed to load (face detection still works):", err);
    yoloSession = null;
  }

  // Mark ready if at least one model loaded
  modelsReady = faceDetector !== null || yoloSession !== null;
}

// ─── Frame Preprocessing for YOLO ─────────────────────────────

function preprocessFrame(imageData: ImageData): ort.Tensor {
  const { data, width, height } = imageData;

  // Create RGB tensor [1, 3, 640, 640]
  const input = new Float32Array(1 * 3 * YOLO_INPUT_SIZE * YOLO_INPUT_SIZE);

  // Resize and normalize
  const ratio = Math.min(YOLO_INPUT_SIZE / width, YOLO_INPUT_SIZE / height);
  const newWidth = Math.round(width * ratio);
  const newHeight = Math.round(height * ratio);
  const offsetX = Math.round((YOLO_INPUT_SIZE - newWidth) / 2);
  const offsetY = Math.round((YOLO_INPUT_SIZE - newHeight) / 2);

  for (let y = 0; y < YOLO_INPUT_SIZE; y++) {
    for (let x = 0; x < YOLO_INPUT_SIZE; x++) {
      const srcX = Math.floor((x - offsetX) / ratio);
      const srcY = Math.floor((y - offsetY) / ratio);

      if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
        const srcIdx = (srcY * width + srcX) * 4;
        const r = data[srcIdx] / 255.0;
        const g = data[srcIdx + 1] / 255.0;
        const b = data[srcIdx + 2] / 255.0;

        // CHW format
        const pixelIdx = y * YOLO_INPUT_SIZE + x;
        input[pixelIdx] = r;                        // R
        input[YOLO_INPUT_SIZE * YOLO_INPUT_SIZE + pixelIdx] = g;  // G
        input[2 * YOLO_INPUT_SIZE * YOLO_INPUT_SIZE + pixelIdx] = b; // B
      }
    }
  }

  return new ort.Tensor("float32", input, [1, 3, YOLO_INPUT_SIZE, YOLO_INPUT_SIZE]);
}

// ─── Post-processing (NMS) ────────────────────────────────────

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  classId: number;
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function postprocessOutput(output: ort.Tensor, origWidth: number, origHeight: number): BoundingBox[] {
  const outputData = output.data as Float32Array;
  const numClasses = 80; // YOLOv8 trained on COCO (80 classes)

  // YOLOv8 output shape: [1, 84, 8400] (4 bbox + 80 classes)
  const numDetections = 8400;
  const detections: BoundingBox[] = [];

  for (let i = 0; i < numDetections; i++) {
    // Extract bbox (cx, cy, w, h)
    const cx = outputData[i];
    const cy = outputData[numDetections + i];
    const w = outputData[2 * numDetections + i];
    const h = outputData[3 * numDetections + i];

    // Extract class scores
    let maxScore = 0;
    let maxClassId = 0;
    for (let c = 0; c < numClasses; c++) {
      const score = sigmoid(outputData[(4 + c) * numDetections + i]);
      if (score > maxScore) {
        maxScore = score;
        maxClassId = c;
      }
    }

    // Filter: only person (0) and cell phone (67)
    if (maxClassId !== PERSON_CLASS && maxClassId !== CELL_PHONE_CLASS) continue;
    if (maxScore < CONFIDENCE_THRESHOLD) continue;

    // Convert to xywh format and scale to original image
    const scale = YOLO_INPUT_SIZE / Math.min(origWidth, origHeight);
    detections.push({
      x: (cx - w / 2) / scale,
      y: (cy - h / 2) / scale,
      width: w / scale,
      height: h / scale,
      confidence: maxScore,
      classId: maxClassId,
    });
  }

  // Apply NMS
  return nms(detections, NMS_IOU_THRESHOLD);
}

function nms(detections: BoundingBox[], iouThreshold: number): BoundingBox[] {
  // Sort by confidence descending
  detections.sort((a, b) => b.confidence - a.confidence);

  const keep: BoundingBox[] = [];
  const suppressed = new Set<number>();

  for (let i = 0; i < detections.length; i++) {
    if (suppressed.has(i)) continue;
    keep.push(detections[i]);

    for (let j = i + 1; j < detections.length; j++) {
      if (suppressed.has(j)) continue;
      if (detections[i].classId !== detections[j].classId) continue;

      const iou = calculateIoU(detections[i], detections[j]);
      if (iou > iouThreshold) {
        suppressed.add(j);
      }
    }
  }

  return keep;
}

function calculateIoU(a: BoundingBox, b: BoundingBox): number {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);

  const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const areaA = a.width * a.height;
  const areaB = b.width * b.height;
  const union = areaA + areaB - intersection;

  return union > 0 ? intersection / union : 0;
}

// ─── Temporal Smoothing ───────────────────────────────────────

function updateTemporalSmoothing(
  faceDetected: boolean,
  phoneDetected: boolean
): { smoothedFace: boolean; smoothedPhone: boolean } {
  // Update face window
  faceDetectionWindow.push(faceDetected);
  if (faceDetectionWindow.length > SLIDING_WINDOW_SIZE) {
    faceDetectionWindow.shift();
  }

  // Update phone window
  phoneDetectionWindow.push(phoneDetected);
  if (phoneDetectionWindow.length > SLIDING_WINDOW_SIZE) {
    phoneDetectionWindow.shift();
  }

  // Check if enough frames agree (≥3 of last 5)
  const facePositiveCount = faceDetectionWindow.filter(Boolean).length;
  const phonePositiveCount = phoneDetectionWindow.filter(Boolean).length;

  const smoothedFace = facePositiveCount >= MIN_POSITIVE_FRAMES;
  const smoothedPhone = phonePositiveCount >= MIN_POSITIVE_FRAMES;

  return { smoothedFace, smoothedPhone };
}

// ─── Main Detection Function ──────────────────────────────────

export async function detectFrame(
  video: HTMLVideoElement
): Promise<DetectionResult> {
  if (!modelsReady) {
    return {
      faceDetected: false,
      phoneDetected: false,
      faceCount: 0,
      confidence: 0,
      personDetected: false,
    };
  }

  // Initialize canvas
  if (!frameCanvas) {
    frameCanvas = document.createElement("canvas");
    frameCtx = frameCanvas.getContext("2d", { willReadFrequently: true });
  }
  if (!frameCtx) {
    return {
      faceDetected: false,
      phoneDetected: false,
      faceCount: 0,
      confidence: 0,
      personDetected: false,
    };
  }

  frameCanvas.width = CANVAS_WIDTH;
  frameCanvas.height = CANVAS_HEIGHT;
  frameCtx.drawImage(video, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  const imageData = frameCtx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  const data = imageData.data;

  let faceDetected = false;
  let faceCount = 0;
  let phoneDetected = false;
  let personDetected = false;
  let confidence = 0;

  // ─── Face Detection (MediaPipe) ────
  if (faceDetector) {
    try {
      const now = performance.now();
      const result = faceDetector.detectForVideo(video, now);
      faceCount = result.detections.length;
      faceDetected = result.detections.length > 0;
    } catch {
      faceDetected = false;
    }
  }

  // ─── YOLO Object Detection (phone, person) ────
  if (yoloSession) {
    try {
      const inputTensor = preprocessFrame(imageData);
      const results = await yoloSession.run({ images: inputTensor });
      const output = results[Object.keys(results)[0]];
      const detections = postprocessOutput(output, CANVAS_WIDTH, CANVAS_HEIGHT);

      for (const det of detections) {
        if (det.classId === CELL_PHONE_CLASS && det.confidence > confidence) {
          phoneDetected = true;
          confidence = det.confidence;
        }
        if (det.classId === PERSON_CLASS) {
          personDetected = true;
        }
      }
    } catch (err) {
      console.warn("YOLO inference error:", err);
    }
  } else {
    // Fallback: motion-based distraction detection
    // Detect sudden movement in lower half of frame (phone usage zone)
    if (previousFrame) {
      const lowerHalfStart = Math.floor(CANVAS_HEIGHT * 0.5) * CANVAS_WIDTH * 4;
      const totalPixels = CANVAS_WIDTH * Math.floor(CANVAS_HEIGHT * 0.5);
      let motionPixels = 0;

      for (let i = lowerHalfStart; i < data.length; i += 4) {
        const diff = Math.abs(data[i] - previousFrame.data[i]) +
                     Math.abs(data[i + 1] - previousFrame.data[i + 1]) +
                     Math.abs(data[i + 2] - previousFrame.data[i + 2]);
        if (diff > 40) motionPixels++;
      }

      // High motion in lower frame = likely phone usage
      if (motionPixels / totalPixels > 0.25) {
        phoneDetected = true;
        confidence = 0.5;
      }
    }
    previousFrame = imageData;
  }

  // ─── Temporal Smoothing ────
  const { smoothedFace, smoothedPhone } = updateTemporalSmoothing(faceDetected, phoneDetected);

  return {
    faceDetected: smoothedFace,
    phoneDetected: smoothedPhone,
    faceCount,
    confidence,
    personDetected,
  };
}

export function isModelsLoaded(): boolean {
  return modelsReady;
}

export function isModelsLoading(): boolean {
  return false;
}

export { DETECTION_INTERVAL_MS, CONSECUTIVE_FRAMES_REQUIRED };
