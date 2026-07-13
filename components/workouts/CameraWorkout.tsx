"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import {
  loadPoseModel,
  detectExercise,
  resetRepCount,
  drawSkeleton,
  type ExerciseType,
  type PoseResult,
} from "@/lib/poseDetection";
import { GripVertical, Repeat, X, Check, Activity } from "lucide-react";

interface CameraWorkoutProps {
  enabled: boolean;
  exerciseType?: ExerciseType;
  onClose?: () => void;
  onRepCount?: (count: number) => void;
  onSave?: (reps: number, exerciseType: ExerciseType, duration: number) => void;
}

// Audio context for rep beep
let audioCtx: AudioContext | null = null;
function playBeep() {
  if (!audioCtx) audioCtx = new AudioContext();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.frequency.value = 880;
  gain.gain.value = 0.3;
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
  osc.stop(audioCtx.currentTime + 0.15);
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

const formColors: Record<string, string> = {
  good: "#10b981",
  fair: "#f59e0b",
  poor: "#ef4444",
};

export default function CameraWorkout({
  enabled,
  exerciseType = "squats",
  onClose,
  onRepCount,
  onSave,
}: CameraWorkoutProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [result, setResult] = useState<PoseResult | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTimeRef = useRef<number>(0);

  // Drag state
  const [previewPos, setPreviewPos] = useState(() => {
    if (typeof window !== "undefined") {
      return { x: window.innerWidth - 280, y: 20 };
    }
    return { x: 20, y: 20 };
  });
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, px: 0, py: 0 });

  // Load model
  useEffect(() => {
    loadPoseModel().then(() => setModelsLoaded(true));
  }, []);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      if (previewRef.current) {
        previewRef.current.srcObject = stream;
        previewRef.current.play().catch(() => {});
      }
    } catch {
      setError("Camera access denied");
    } finally {
      setLoading(false);
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    if (previewRef.current) previewRef.current.srcObject = null;
  }, []);

  useEffect(() => {
    if (!enabled || !modelsLoaded) { stopCamera(); return; }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    startCamera();
    startTimeRef.current = Date.now();
    return () => stopCamera();
  }, [enabled, modelsLoaded, startCamera, stopCamera]);

  // Reset on mount
  useEffect(() => {
    resetRepCount();
  }, []);

  // Timer
  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [enabled]);

  // Previous rep count for beep
  const prevRepRef = useRef(0);

  // Pose detection loop
  useEffect(() => {
    if (!enabled || !modelsLoaded) return;

    const detect = () => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        rafRef.current = requestAnimationFrame(detect);
        return;
      }

      const res = detectExercise(videoRef.current, exerciseType);
      if (res) {
        // Beep on new rep
        if (res.repCount > prevRepRef.current) {
          playBeep();
        }
        prevRepRef.current = res.repCount;

        setResult(res);
        onRepCount?.(res.repCount);

        // Draw skeleton on canvas
        if (canvasRef.current && videoRef.current) {
          const ctx = canvasRef.current.getContext("2d");
          if (ctx) {
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.height;
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            if (res.landmarks.length > 0) {
              drawSkeleton(ctx, res.landmarks, canvasRef.current.width, canvasRef.current.height);
            }
          }
        }
      }

      rafRef.current = requestAnimationFrame(detect);
    };

    rafRef.current = requestAnimationFrame(detect);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [enabled, modelsLoaded, exerciseType, onRepCount]);

  // Drag handlers
  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY, px: previewPos.x, py: previewPos.y };
  };

  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!dragging) return;
    setPreviewPos({
      x: dragStartRef.current.px + (e.clientX - dragStartRef.current.x),
      y: dragStartRef.current.py + (e.clientY - dragStartRef.current.y),
    });
  }, [dragging]);

  const handleDragEnd = useCallback(() => setDragging(false), []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handleDragMove);
      window.addEventListener("mouseup", handleDragEnd);
      return () => {
        window.removeEventListener("mousemove", handleDragMove);
        window.removeEventListener("mouseup", handleDragEnd);
      };
    }
  }, [dragging, handleDragMove, handleDragEnd]);

  if (!enabled) return null;

  const exerciseLabel = exerciseType === "squats" ? "Squats" : "Push-ups";
  const repCount = result?.repCount ?? 0;
  const angle = result?.angle ?? 0;
  const phase = result?.phase ?? "waiting";
  const feedback = result?.feedback ?? "Loading...";
  const formQuality = result?.formQuality ?? "poor";
  const skeletonAngles = result?.skeletonAngles ?? [];
  const phaseColor = phase === "down" ? "#f59e0b" : phase === "up" && repCount > 0 ? "#10b981" : "#6b7280";

  return (
    <>
      {/* Hidden video for detection */}
      <video ref={videoRef} playsInline muted className="absolute" style={{ width: 1, height: 1, opacity: 0, pointerEvents: "none" }} />

      {/* Draggable video pop-up */}
      <div
        className="fixed z-50 rounded-lg overflow-hidden shadow-2xl border-2 border-[#10b981]"
        style={{ left: previewPos.x, top: previewPos.y, width: 280, cursor: dragging ? "grabbing" : "grab" }}
      >
        {/* Header */}
        <div onMouseDown={handleDragStart} className="flex items-center justify-between px-2 py-1.5 bg-[#10b981]">
          <div className="flex items-center gap-1">
            <GripVertical size={12} className="text-white" />
            <span className="text-xs text-white font-medium">{exerciseLabel}</span>
          </div>
          <div className="flex items-center gap-1">
            {/* Timer */}
            <span className="text-xs text-white font-mono mr-1">{formatTime(elapsedTime)}</span>
            {repCount > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); onSave?.(repCount, exerciseType, elapsedTime); }}
                className="p-1 rounded hover:bg-white/20 transition-colors"
                title="Save & Stop"
              >
                <Check size={14} className="text-white" />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onClose?.(); }}
              className="p-1 rounded hover:bg-white/20 transition-colors"
            >
              <X size={14} className="text-white" />
            </button>
          </div>
        </div>

        {/* Video + Skeleton overlay */}
        <div className="relative">
          <video
            ref={previewRef}
            playsInline
            muted
            className="w-full h-auto block"
            style={{ transform: "scaleX(-1)", backgroundColor: "#000" }}
          />
          {/* Skeleton canvas overlay */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ transform: "scaleX(-1)" }}
          />

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <span className="text-white text-sm">Starting camera...</span>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}
        </div>

        {/* Stats panel */}
        <div className="px-3 py-2 bg-gray-900 space-y-2">
          {/* Rep counter + Form quality */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Repeat size={14} className="text-white" />
              <span className="text-xl font-bold text-white font-mono">{repCount}</span>
              <span className="text-xs text-gray-400">reps</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Activity size={12} style={{ color: formColors[formQuality] }} />
              <span className="text-xs font-medium capitalize" style={{ color: formColors[formQuality] }}>
                {formQuality}
              </span>
            </div>
          </div>

          {/* Phase + feedback */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: phaseColor }} />
            <span className="text-xs" style={{ color: phaseColor }}>{feedback}</span>
          </div>

          {/* Angle bar */}
          <div className="h-1.5 rounded-full bg-gray-700 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{
                width: `${Math.min(100, (angle / 180) * 100)}%`,
                backgroundColor: phaseColor,
              }}
            />
          </div>

          {/* Skeleton joint angles */}
          {skeletonAngles.length > 0 && (
            <div className="flex gap-3">
              {skeletonAngles.map((s) => (
                <div key={s.joint} className="flex items-center gap-1">
                  <span className="text-[10px] text-gray-500">{s.joint}:</span>
                  <span className="text-[10px] text-white font-mono">{s.angle}°</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
