import { PoseLandmarker, FilesetResolver, type PoseLandmarkerResult } from "@mediapipe/tasks-vision";

let poseLandmarker: PoseLandmarker | null = null;
let loading = false;

export async function loadPoseModel(): Promise<void> {
  if (poseLandmarker || loading) return;
  loading = true;

  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numPoses: 1,
    });
  } catch (err) {
    console.error("Failed to load pose model:", err);
  } finally {
    loading = false;
  }
}

export function isPoseModelLoaded(): boolean {
  return poseLandmarker !== null;
}

// ─── Types ──────────────────────────────────────────────────

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

// ─── Skeleton Drawing ───────────────────────────────────────

export const SKELETON_CONNECTIONS: [number, number][] = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], // Arms
  [11, 23], [12, 24], // Torso
  [23, 24], [23, 25], [24, 26], // Hips
  [25, 27], [26, 28], // Legs
  [27, 29], [28, 30], [29, 31], [30, 32], // Feet
];

export function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  width: number,
  height: number
) {
  // Draw connections
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

  // Draw landmarks
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

// ─── Angle Calculation ──────────────────────────────────────

function calculateAngle(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number }
): number {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let degrees = Math.abs((radians * 180) / Math.PI);
  if (degrees > 180) degrees = 360 - degrees;
  return degrees;
}

// ─── Form Quality Scoring ───────────────────────────────────

function scoreFormQuality(
  exerciseType: ExerciseType,
  angle: number,
  phase: "up" | "down" | "waiting",
  speed: number
): FormQuality {
  let score = 100;

  if (exerciseType === "squats") {
    // Depth check
    if (phase === "down" && angle > 110) score -= 30; // Not deep enough
    if (phase === "down" && angle < 70) score -= 10; // Too deep (knee stress)
    // Speed check (too fast = bad form)
    if (speed > 3) score -= 20;
    if (speed < 0.3 && phase === "down") score -= 10; // Too slow at bottom
  } else if (exerciseType === "pushups") {
    if (phase === "down" && angle > 110) score -= 30; // Not low enough
    if (phase === "down" && angle < 50) score -= 15; // Too low
    if (speed > 4) score -= 20;
  }

  if (score >= 80) return "good";
  if (score >= 50) return "fair";
  return "poor";
}

// ─── Exercise State ─────────────────────────────────────────

interface ExerciseState {
  phase: "up" | "down" | "waiting";
  repCount: number;
  lastAngle: number;
  lastTime: number;
  angleHistory: number[];
}

const states: Record<string, ExerciseState> = {};

function getState(key: string): ExerciseState {
  if (!states[key]) {
    states[key] = { phase: "waiting", repCount: 0, lastAngle: 0, lastTime: Date.now(), angleHistory: [] };
  }
  return states[key];
}

export function resetRepCount(exerciseKey?: string): void {
  if (exerciseKey) {
    delete states[exerciseKey];
  } else {
    Object.keys(states).forEach((k) => delete states[k]);
  }
}

// ─── Squat Detection ────────────────────────────────────────

function detectSquat(landmarks: Landmark[]): PoseResult {
  const key = "squats";
  const state = getState(key);

  const hip = landmarks[23];
  const knee = landmarks[25];
  const ankle = landmarks[27];

  if (!hip || !knee || !ankle) {
    return { repCount: state.repCount, angle: 0, phase: state.phase, feedback: "Position yourself in frame", formQuality: "poor", landmarks, skeletonAngles: [] };
  }

  const angle = calculateAngle(hip, knee, ankle);
  const now = Date.now();
  const dt = (now - state.lastTime) / 1000;
  const speed = dt > 0 ? Math.abs(angle - state.lastAngle) / dt : 0;

  let feedback = "";
  let phase = state.phase;

  // Phase detection
  if (phase === "waiting" || phase === "up") {
    if (angle < 100) {
      phase = "down";
      feedback = "Going down";
    } else {
      feedback = "Standing";
    }
  } else if (phase === "down") {
    if (angle > 160) {
      phase = "up";
      state.repCount++;
      feedback = "Good rep! ✓";
    } else if (angle < 90) {
      feedback = "Deep squat!";
    } else {
      feedback = "Going down";
    }
  }

  const formQuality = scoreFormQuality("squats", angle, phase, speed);

  // Track angle history for smoothness
  state.angleHistory.push(angle);
  if (state.angleHistory.length > 10) state.angleHistory.shift();

  state.lastAngle = angle;
  state.lastTime = now;
  state.phase = phase;

  return {
    repCount: state.repCount,
    angle,
    phase,
    feedback,
    formQuality,
    landmarks,
    skeletonAngles: [
      { joint: "Knee", angle: Math.round(angle) },
      { joint: "Hip", angle: Math.round(calculateAngle(landmarks[11] || hip, hip, knee)) },
    ],
  };
}

// ─── Push-up Detection ──────────────────────────────────────

function detectPushup(landmarks: Landmark[]): PoseResult {
  const key = "pushups";
  const state = getState(key);

  const shoulder = landmarks[11];
  const elbow = landmarks[13];
  const wrist = landmarks[15];

  if (!shoulder || !elbow || !wrist) {
    return { repCount: state.repCount, angle: 0, phase: state.phase, feedback: "Position yourself in frame", formQuality: "poor", landmarks, skeletonAngles: [] };
  }

  const angle = calculateAngle(shoulder, elbow, wrist);
  const now = Date.now();
  const dt = (now - state.lastTime) / 1000;
  const speed = dt > 0 ? Math.abs(angle - state.lastAngle) / dt : 0;

  let feedback = "";
  let phase = state.phase;

  if (phase === "waiting" || phase === "up") {
    if (angle < 100) {
      phase = "down";
      feedback = "Going down";
    } else {
      feedback = "Arms extended";
    }
  } else if (phase === "down") {
    if (angle > 160) {
      phase = "up";
      state.repCount++;
      feedback = "Good rep! ✓";
    } else if (angle < 70) {
      feedback = "Deep push-up!";
    } else {
      feedback = "Going down";
    }
  }

  const formQuality = scoreFormQuality("pushups", angle, phase, speed);

  state.angleHistory.push(angle);
  if (state.angleHistory.length > 10) state.angleHistory.shift();

  state.lastAngle = angle;
  state.lastTime = now;
  state.phase = phase;

  return {
    repCount: state.repCount,
    angle,
    phase,
    feedback,
    formQuality,
    landmarks,
    skeletonAngles: [
      { joint: "Elbow", angle: Math.round(angle) },
      { joint: "Shoulder", angle: Math.round(calculateAngle(landmarks[12] || shoulder, shoulder, elbow)) },
    ],
  };
}

// ─── Main Detection ─────────────────────────────────────────

export function detectExercise(
  video: HTMLVideoElement,
  exerciseType: ExerciseType
): PoseResult | null {
  if (!poseLandmarker) return null;

  try {
    const result = poseLandmarker.detectForVideo(video, performance.now());
    if (!result.landmarks || result.landmarks.length === 0) {
      return {
        repCount: 0,
        angle: 0,
        phase: "waiting",
        feedback: "No person detected",
        formQuality: "poor",
        landmarks: [],
        skeletonAngles: [],
      };
    }

    const landmarks = result.landmarks[0];

    switch (exerciseType) {
      case "squats":
        return detectSquat(landmarks);
      case "pushups":
        return detectPushup(landmarks);
      default:
        return null;
    }
  } catch {
    return null;
  }
}
