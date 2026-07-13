// Object detection — stub (TensorFlow removed for Vercel build size)
// Camera-based detection requires TensorFlow which is 270MB+ and exceeds Vercel limits.

export interface DetectionResult {
  faceDetected: boolean;
  phoneDetected: boolean;
  faceCount: number;
}

export async function loadModels(): Promise<void> {
  console.warn("Object detection unavailable — TensorFlow not installed (Vercel build size limit)");
}

export async function detectFrame(
  _video: HTMLVideoElement
): Promise<DetectionResult> {
  return { faceDetected: false, phoneDetected: false, faceCount: 0 };
}

export function isModelsLoaded(): boolean {
  return false;
}

export function isModelsLoading(): boolean {
  return false;
}
