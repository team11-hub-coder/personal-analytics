// Pose detection — stub (MediaPipe removed for Vercel build size)
// Camera-based pose detection requires MediaPipe which is 34MB+ and exceeds Vercel limits.

export type ExerciseType = "squats" | "pushups";
export type FormQuality = "good" | "fair" | "poor";

export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface PoseResult {
  repCount: number;
  angle: number;
  phase: "up" | "down" | "waiting";
  feedback: string;
  formQuality: FormQuality;
  landmarks: Landmark[];
  skeletonAngles: { joint: string; angle: number }[];
}

export const SKELETON_CONNECTIONS: [number, number][] = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24],
  [23, 24], [23, 25], [24, 26],
  [25, 27], [26, 28],
  [27, 29], [28, 30], [29, 31], [30, 32],
];

export async function loadPoseModel(): Promise<void> {
  console.warn("Pose detection unavailable — MediaPipe not installed (Vercel build size limit)");
}

export function isPoseModelLoaded(): boolean {
  return false;
}

export function resetRepCount(_exerciseKey?: string): void {}

export function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  width: number,
  height: number
) {
  ctx.strokeStyle = "#10b981";
  ctx.lineWidth = 2;
  for (const [i, j] of SKELETON_CONNECTIONS) {
    const a = landmarks[i];
    const b = landmarks[j];
    if (a && b && (a.visibility ?? 0) > 0.5 && (b.visibility ?? 0) > 0.5) {
      ctx.beginPath();
      ctx.moveTo(a.x * width, a.y * height);
      ctx.lineTo(b.x * width, b.y * height);
      ctx.stroke();
    }
  }

  for (let i = 0; i < landmarks.length; i++) {
    const lm = landmarks[i];
    if (!lm || (lm.visibility ?? 0) > 0.5) {
      ctx.fillStyle = "#10b981";
      ctx.beginPath();
      ctx.arc(lm.x * width, lm.y * height, 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
}

export function detectExercise(
  _video: HTMLVideoElement,
  _exerciseType: ExerciseType
): PoseResult | null {
  return null;
}
