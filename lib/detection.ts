import * as tf from "@tensorflow/tfjs";

let objectModel: Awaited<ReturnType<typeof import("@tensorflow-models/coco-ssd").load>> | null = null;
let modelsLoading = false;

export async function loadModels(): Promise<void> {
  if (objectModel) return;
  if (modelsLoading) return;
  modelsLoading = true;

  try {
    await tf.ready();
    const cocoSsd = await import("@tensorflow-models/coco-ssd");
    objectModel = await cocoSsd.load({ base: "lite_mobilenet_v2" });
  } catch (err) {
    console.error("Failed to load detection model:", err);
  } finally {
    modelsLoading = false;
  }
}

export interface DetectionResult {
  faceDetected: boolean;
  phoneDetected: boolean;
  faceCount: number;
}

export async function detectFrame(
  video: HTMLVideoElement
): Promise<DetectionResult> {
  const result: DetectionResult = {
    faceDetected: false,
    phoneDetected: false,
    faceCount: 0,
  };

  if (!objectModel) return result;

  try {
    const objects = await objectModel.detect(video);

    // Count persons (face approximation)
    const persons = objects.filter(
      (obj) => obj.class === "person" && obj.score > 0.4
    );
    result.faceCount = persons.length;
    result.faceDetected = persons.length > 0;

    // Detect phone
    result.phoneDetected = objects.some(
      (obj) => obj.class === "cell phone" && obj.score > 0.4
    );
  } catch {
    // Detection failed silently
  }

  return result;
}

export function isModelsLoaded(): boolean {
  return objectModel !== null;
}

export function isModelsLoading(): boolean {
  return modelsLoading;
}
