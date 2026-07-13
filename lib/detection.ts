// Object detection — lightweight fallback (TensorFlow removed for Vercel build size)
// Uses browser FaceDetection API where available, canvas-based skin-tone tracking as fallback.

export interface DetectionResult {
  faceDetected: boolean;
  phoneDetected: boolean;
  faceCount: number;
}

let modelsReady = false;
let useNativeDetection = false;
let previousFrame: ImageData | null = null;
let frameCanvas: HTMLCanvasElement | null = null;
let frameCtx: CanvasRenderingContext2D | null = null;

// Adaptive skin color detection range in HSV
const SKIN_LOWER = { h: 0, s: 15, v: 35 };
const SKIN_UPPER = { h: 50, s: 255, v: 255 };

function rgbToHsv(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max, v = max;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: h * 360, s: s * 255, v: v * 255 };
}

function isSkinColor(r: number, g: number, b: number): boolean {
  // 1. RGB skin color rule (Peer et al. / Kovac et al. - highly adaptive for skin tones)
  const isSkinRGB = 
    r > 80 && g > 30 && b > 15 && 
    Math.max(r, g, b) - Math.min(r, g, b) > 10 && 
    Math.abs(r - g) > 10 && r > g && r > b;

  // 2. HSV skin color rule (broadened for dim indoor lighting)
  const hsv = rgbToHsv(r, g, b);
  const isSkinHSV = 
    hsv.h >= SKIN_LOWER.h && hsv.h <= SKIN_UPPER.h &&
    hsv.s >= SKIN_LOWER.s && hsv.s <= SKIN_UPPER.s &&
    hsv.v >= SKIN_LOWER.v && hsv.v <= SKIN_UPPER.v;

  return isSkinRGB || isSkinHSV;
}

function detectPhoneHeuristic(
  video: HTMLVideoElement,
  faceDetected: boolean,
  skinBoundingBox: { minX: number; maxX: number; minY: number; maxY: number } | null,
  data: Uint8ClampedArray,
  w: number,
  h: number
): boolean {
  if (!faceDetected || !skinBoundingBox) return false;

  const { minX, maxX, minY, maxY } = skinBoundingBox;
  const boxW = maxX - minX;
  const boxH = maxY - minY;

  if (boxW < 20 || boxH < 20) return false;

  // Heuristic 1: Wide aspect ratio of the skin region
  // Usually, a face/head bounding box is vertical (ratio around 0.6 - 1.1).
  // If the user is holding a phone near the head/ear, or holding a hand/arm up, the skin bounding box gets wider (aspect ratio > 1.25).
  const aspectRatio = boxW / boxH;

  // Heuristic 2: Count high-contrast edges and dark non-skin pixels within the skin bounding box.
  // Phones are typically dark/rectangular (low brightness casing) or display high-contrast edges.
  let darkNonSkinPixels = 0;
  let totalBoxPixels = 0;
  let horizontalEdges = 0;
  let verticalEdges = 0;

  for (let y = minY; y < maxY; y++) {
    for (let x = minX; x < maxX; x++) {
      const i = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const isSkin = isSkinColor(r, g, b);
      totalBoxPixels++;

      if (!isSkin) {
        // Phone body: usually dark (low brightness casing)
        const brightness = (r + g + b) / 3;
        if (brightness < 60) {
          darkNonSkinPixels++;
        }

        // Edge detection: difference between neighboring pixels
        if (x < maxX - 1) {
          const nextIdx = (y * w + (x + 1)) * 4;
          const diff = Math.abs(r - data[nextIdx]) + Math.abs(g - data[nextIdx + 1]) + Math.abs(b - data[nextIdx + 2]);
          if (diff > 50) horizontalEdges++;
        }
        if (y < maxY - 1) {
          const nextIdx = ((y + 1) * w + x) * 4;
          const diff = Math.abs(r - data[nextIdx]) + Math.abs(g - data[nextIdx + 1]) + Math.abs(b - data[nextIdx + 2]);
          if (diff > 50) verticalEdges++;
        }
      }
    }
  }

  const darkRatio = darkNonSkinPixels / totalBoxPixels;
  const edgeDensity = (horizontalEdges + verticalEdges) / totalBoxPixels;

  // Conditions indicating phone use:
  // - A wide skin box with dark casing pixels and clean edge transitions (e.g. hand holding phone next to ear).
  // - A phone held in front of the body/chest (face is still visible, but phone box is visible in lower portion).
  const isPhoneHeldSide = aspectRatio > 1.25 && darkRatio > 0.15 && edgeDensity > 0.08;
  const isPhoneHeldFront = darkRatio > 0.3 && edgeDensity > 0.12;

  return isPhoneHeldSide || isPhoneHeldFront;
}

export async function loadModels(): Promise<void> {
  // Try native FaceDetection API (Chrome 89+)
  const win = window as unknown as Record<string, unknown>;
  if (typeof win.FaceDetection !== "undefined") {
    useNativeDetection = true;
    modelsReady = true;
    return;
  }

  // Use canvas-based fallback
  useNativeDetection = false;
  modelsReady = true;
}

export async function detectFrame(
  video: HTMLVideoElement
): Promise<DetectionResult> {
  if (!modelsReady) {
    return { faceDetected: false, phoneDetected: false, faceCount: 0 };
  }

  // Always draw to canvas to get pixel data for phone detection and fallback face detection
  if (!frameCanvas) {
    frameCanvas = document.createElement("canvas");
    frameCtx = frameCanvas.getContext("2d", { willReadFrequently: true });
  }
  if (!frameCtx) {
    return { faceDetected: false, phoneDetected: false, faceCount: 0 };
  }

  const w = 160, h = 120;
  frameCanvas.width = w;
  frameCanvas.height = h;
  frameCtx.drawImage(video, 0, 0, w, h);
  const imageData = frameCtx.getImageData(0, 0, w, h);
  const data = imageData.data;

  let faceDetected = false;
  let faceCount = 0;
  let skinBoundingBox: { minX: number; maxX: number; minY: number; maxY: number } | null = null;

  // Find skin pixels and bounding box coordinates
  let skinPixels = 0;
  let minX = w;
  let maxX = 0;
  let minY = h;
  let maxY = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (isSkinColor(data[i], data[i + 1], data[i + 2])) {
        skinPixels++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const totalPixels = w * h;
  const skinRatio = skinPixels / totalPixels;

  if (useNativeDetection) {
    try {
      const FaceDetectionClass = (window as unknown as Record<string, unknown>).FaceDetection as new (opts: { fastMode: boolean; maxDetectedFaces: number }) => { detect: (el: HTMLVideoElement) => Promise<Array<{ boundingBox: { x: number; width: number; y: number; height: number } }> > };
      const detector = new FaceDetectionClass({ fastMode: true, maxDetectedFaces: 3 });
      const faces = await detector.detect(video);
      faceCount = faces.length;
      faceDetected = faces.length > 0;

      if (faceDetected) {
        // Map native bounding box back to our canvas scale
        if (skinPixels > 0 && skinRatio > 0.02) {
          skinBoundingBox = { minX, maxX, minY, maxY };
        } else {
          const face = faces[0].boundingBox;
          const scaleX = w / video.videoWidth;
          const scaleY = h / video.videoHeight;
          skinBoundingBox = {
            minX: Math.max(0, Math.floor(face.x * scaleX)),
            maxX: Math.min(w - 1, Math.floor((face.x + face.width) * scaleX)),
            minY: Math.max(0, Math.floor(face.y * scaleY)),
            maxY: Math.min(h - 1, Math.floor((face.y + face.height) * scaleY)),
          };
        }
      }
    } catch {
      faceDetected = false;
    }
  }

  // Fallback to skin-based detection if native failed or is disabled
  if (!useNativeDetection) {
    faceDetected = skinRatio > 0.03;

    // Check large movement / look-away
    if (previousFrame) {
      let diffPixels = 0;
      for (let i = 0; i < data.length; i += 4) {
        const diff = Math.abs(data[i] - previousFrame.data[i]) +
                     Math.abs(data[i + 1] - previousFrame.data[i + 1]) +
                     Math.abs(data[i + 2] - previousFrame.data[i + 2]);
        if (diff > 60) diffPixels++;
      }
      if (diffPixels / totalPixels > 0.4) {
        faceDetected = false;
      }
    }
    previousFrame = imageData;
    faceCount = faceDetected ? 1 : 0;

    if (faceDetected) {
      skinBoundingBox = { minX, maxX, minY, maxY };
    }
  }

  // Calculate phone detection using our custom heuristic
  const phoneDetected = detectPhoneHeuristic(video, faceDetected, skinBoundingBox, data, w, h);

  return { faceDetected, phoneDetected, faceCount };
}

export function isModelsLoaded(): boolean {
  return modelsReady;
}

export function isModelsLoading(): boolean {
  return false;
}
