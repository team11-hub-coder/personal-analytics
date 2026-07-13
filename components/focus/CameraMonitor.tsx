"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { loadModels, detectFrame, type DetectionResult } from "@/lib/detection";
import { GripVertical, Phone, UserX } from "lucide-react";

interface CameraMonitorProps {
  enabled: boolean;
  showPreview: boolean;
  onDetection?: (result: DetectionResult) => void;
  onAlert?: (type: AlertType, duration: number) => void;
}

export type AlertType = "absent" | "phone" | null;

export default function CameraMonitor({
  enabled,
  showPreview,
  onDetection,
  onAlert,
}: CameraMonitorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [activeAlert, setActiveAlert] = useState<AlertType>(null);
  const [alertDuration, setAlertDuration] = useState(0);
  const [hasStream, setHasStream] = useState(false);
  const alertStartRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Draggable preview state — default top-right
  const [previewPos, setPreviewPos] = useState(() => {
    if (typeof window !== "undefined") {
      return { x: window.innerWidth - 240, y: 20 };
    }
    return { x: 20, y: 20 };
  });
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, px: 0, py: 0 });

  // Load ML models on mount
  useEffect(() => {
    loadModels().then(() => setModelsLoaded(true));
  }, []);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 320, height: 240 },
        audio: false,
      });

      streamRef.current = stream;
      setHasStream(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      setError("Camera access denied");
      console.error("Camera error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setHasStream(false);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Start/stop detection loop
  useEffect(() => {
    if (!enabled || !modelsLoaded) {
      stopCamera();
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    startCamera();

    return () => {
      stopCamera();
    };
  }, [enabled, modelsLoaded, startCamera, stopCamera]);

  // Sync stream to preview video (only when stream changes)
  useEffect(() => {
    if (previewVideoRef.current && streamRef.current) {
      previewVideoRef.current.srcObject = streamRef.current;
      previewVideoRef.current.play().catch(() => {});
    }
  }, [showPreview]);

  // Detection interval
  useEffect(() => {
    if (!enabled || !modelsLoaded) return;

    intervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;

      const result = await detectFrame(videoRef.current);
      onDetection?.(result);

      // Track alert state
      if (!result.faceDetected) {
        if (activeAlert !== "absent") {
          alertStartRef.current = Date.now();
          setActiveAlert("absent");
          setAlertDuration(0);
          onAlert?.("absent", 0);
        }
      } else if (result.phoneDetected) {
        if (activeAlert !== "phone") {
          alertStartRef.current = Date.now();
          setActiveAlert("phone");
          setAlertDuration(0);
          onAlert?.("phone", 0);
        }
      } else {
        // User is focused — clear alert
        setActiveAlert(null);
        alertStartRef.current = null;
        setAlertDuration(0);
        onAlert?.(null, 0);
      }
    }, 2500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, modelsLoaded, onDetection, activeAlert, onAlert]);

  // Duration counter
  useEffect(() => {
    if (activeAlert && alertStartRef.current) {
      durationIntervalRef.current = setInterval(() => {
        if (alertStartRef.current) {
          const dur = Math.floor((Date.now() - alertStartRef.current) / 1000);
          setAlertDuration(dur);
          onAlert?.(activeAlert, dur);
        }
      }, 1000);
    }

    return () => {
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    };
  }, [activeAlert, onAlert]);

  // Format seconds to MM:SS
  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Drag handlers
  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      px: previewPos.x,
      py: previewPos.y,
    };
  };

  const handleDragMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setPreviewPos({
        x: dragStartRef.current.px + dx,
        y: dragStartRef.current.py + dy,
      });
    },
    [dragging]
  );

  const handleDragEnd = useCallback(() => {
    setDragging(false);
  }, []);

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

  return (
    <>
      {/* Hidden video element (always present when camera is on) */}
      <video
        ref={videoRef}
        playsInline
        muted
        className="absolute"
        style={{
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: "none",
        }}
      />

      {/* Draggable video preview pop-up */}
      {showPreview && hasStream && (
        <div
          className="fixed z-50 rounded-lg overflow-hidden shadow-2xl border-2 border-[#8b6914]"
          style={{
            left: previewPos.x,
            top: previewPos.y,
            width: 220,
            cursor: dragging ? "grabbing" : "grab",
          }}
        >
          {/* Drag handle */}
          <div
            onMouseDown={handleDragStart}
            className="flex items-center justify-between px-2 py-1"
            style={{
              backgroundColor: activeAlert === "phone" ? "#dc2626" : activeAlert === "absent" ? "#d97706" : "#8b6914",
            }}
          >
            <div className="flex items-center gap-1">
              <GripVertical size={12} className="text-white" />
              <span className="text-xs text-white font-medium">Camera</span>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          {/* Video */}
          <video
            ref={previewVideoRef}
            playsInline
            muted
            className="w-full h-auto block"
            style={{ transform: "scaleX(-1)", backgroundColor: "#000" }}
          />

          {/* Alert timer badge on video */}
          {activeAlert && alertDuration > 0 && (
            <div
              className="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-2 px-3 py-2 rounded-lg"
              style={{
                backgroundColor: activeAlert === "phone" ? "rgba(220,38,38,0.9)" : "rgba(217,119,6,0.9)",
              }}
            >
              {activeAlert === "phone" ? (
                <Phone size={14} className="text-white" />
              ) : (
                <UserX size={14} className="text-white" />
              )}
              <span className="text-white text-sm font-mono font-bold">
                {formatDuration(alertDuration)}
              </span>
              <span className="text-white/80 text-xs">
                {activeAlert === "phone" ? "Phone" : "Absent"}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Warning bar shown in page topbar via onAlert callback */}
    </>
  );
}
