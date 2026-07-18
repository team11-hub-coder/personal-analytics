"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useUser } from "@/hooks/useAuth";
import { addFocusSession, updateFocusSession, incrementCompletedCount, getLocalISOString } from "@/lib/focus";
import { pageHeader, card } from "@/lib/theme";
import FocusTimer from "@/components/focus/FocusTimer";
import FocusHistory from "@/components/focus/FocusHistory";
import CameraMonitor from "@/components/focus/CameraMonitor";
import { ToastContainer, useToasts } from "@/components/focus/Toast";
import { playAlertSound, playSongAlert, requestNotificationPermission, sendNotification } from "@/lib/alerts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FocusPhase, FocusSession } from "@/types";
import type { DetectionResult } from "@/lib/detection";
import { Skeleton } from "@/components/ui/skeleton";
import { Timer, Camera, Eye, EyeOff, X, Play, Pause, RotateCcw, SkipForward, Clock } from "lucide-react";

const DEFAULT_FOCUS = 25;
const DEFAULT_BREAK = 5;
const POMODORO_LONG_BREAK = 15 * 60;
const POMODORO_SESSIONS = 4;

export default function FocusClient() {
  const { data: user, isLoading: userLoading } = useUser();
  const { toasts, addToast } = useToasts();

  // Timer state
  const [phase, setPhase] = useState<FocusPhase>("idle");
  const [timeRemaining, setTimeRemaining] = useState(DEFAULT_FOCUS * 60);
  const [totalTime, setTotalTime] = useState(DEFAULT_FOCUS * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<"pomodoro" | "stopwatch">("pomodoro");
  const [sessionCount, setSessionCount] = useState(0);

  // Session config
  const [title, setTitle] = useState("");
  const [focusMinutes, setFocusMinutes] = useState(DEFAULT_FOCUS);
  const [breakMinutes, setBreakMinutes] = useState(DEFAULT_BREAK);

  // Stopwatch state
  const [stopwatchElapsed, setStopwatchElapsed] = useState(0);

  // Camera state
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraPreview, setCameraPreview] = useState(true);
  const lastAlertRef = useRef<number>(0);
  const absentStartRef = useRef<number | null>(null);
  const phoneStartRef = useRef<number | null>(null);

  // Serious Focus: fixed 15s warning threshold (user cannot change)
  const SERIOUS_FOCUS_THRESHOLD = 15_000;

  // Escalating alerts
  const distractionCountRef = useRef(0);
  const [screenFlash, setScreenFlash] = useState(false);
  const flashTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartRef = useRef<string | null>(null);
  const currentDurationRef = useRef(0);
  const currentSessionIdRef = useRef<string | null>(null);
  const reusedSessionIdRef = useRef<string | null>(null);

  // Overlay state
  const [newSessionOverlayOpen, setNewSessionOverlayOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<{ title?: string; focus?: string; brk?: string }>({});

  // Refresh history
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const triggerHistoryRefresh = useCallback(() => setHistoryRefreshKey((k) => k + 1), []);

  // Get phase duration
  const getPhaseDuration = useCallback(
    (p: FocusPhase): number => {
      if (p === "focus") return focusMinutes * 60;
      if (p === "break") return breakMinutes * 60;
      if (p === "longBreak") return POMODORO_LONG_BREAK;
      return focusMinutes * 60;
    },
    [focusMinutes, breakMinutes]
  );

  // Create session in DB immediately
  const createSession = useCallback(
    async (sessionTitle: string, durationMin: number) => {
      if (!user) return;
      const result = await addFocusSession({
        user_id: user.id,
        title: sessionTitle,
        mode,
        duration_minutes: durationMin,
        break_minutes: mode === "stopwatch" ? 0 : breakMinutes,
        completed: false,
        completed_count: 0,
        started_at: sessionStartRef.current ?? getLocalISOString(),
        ended_at: null,
      });
      if (result.data) {
        currentSessionIdRef.current = result.data.id;
      }
      triggerHistoryRefresh();
    },
    [user, mode, breakMinutes, triggerHistoryRefresh]
  );

  // Update existing session
  const updateSession = useCallback(
    async (completed: boolean) => {
      if (!currentSessionIdRef.current) return;
      await updateFocusSession(currentSessionIdRef.current, {
        completed,
        ended_at: getLocalISOString(),
      });
      // Clear the reused session template reference once completed
      if (completed) {
        reusedSessionIdRef.current = null;
      }
      currentSessionIdRef.current = null;
      triggerHistoryRefresh();
    },
    [triggerHistoryRefresh]
  );

  // Transition phase — handles focus→break→focus cycles (single DB record)
  const transitionPhase = useCallback(
    async (currentPhase: FocusPhase) => {
      if (mode === "pomodoro") {
        if (currentPhase === "focus") {
          // Focus block done — play alert with song
          playSongAlert("focus");
          sendNotification("Focus Complete", "Time for a break!", "focus-complete");

          // Increment completed_count if using recent Session data
          if (reusedSessionIdRef.current) {
            await incrementCompletedCount(reusedSessionIdRef.current);
            await updateFocusSession(reusedSessionIdRef.current, { completed: true });
            triggerHistoryRefresh();
          }

          if (currentSessionIdRef.current) {
            await updateFocusSession(currentSessionIdRef.current, { completed: true });
            triggerHistoryRefresh();
          }

          const nextCount = sessionCount + 1;
          setSessionCount(nextCount);
          if (nextCount % POMODORO_SESSIONS === 0) {
            // All 4 focus blocks done — session complete
            await updateSession(true);
            triggerHistoryRefresh();
            const dur = getPhaseDuration("longBreak");
            setPhase("longBreak");
            setTimeRemaining(dur);
            setTotalTime(dur);
          } else {
            const dur = getPhaseDuration("break");
            setPhase("break");
            setTimeRemaining(dur);
            setTotalTime(dur);
          }
        } else {
          // Break/longBreak done — play alert with song, start next focus block
          playSongAlert("break");
          sendNotification("Break Over", "Time to focus!", "break-over");

          // Increment completed_count if using recent Session data
          if (reusedSessionIdRef.current) {
            await incrementCompletedCount(reusedSessionIdRef.current);
            await updateFocusSession(reusedSessionIdRef.current, { completed: true });
            triggerHistoryRefresh();
          }

          if (currentSessionIdRef.current) {
            await updateFocusSession(currentSessionIdRef.current, { completed: true });
            triggerHistoryRefresh();
          }

          const dur = getPhaseDuration("focus");
          setPhase("focus");
          setTimeRemaining(dur);
          setTotalTime(dur);
          sessionStartRef.current = getLocalISOString();
          currentDurationRef.current = dur;
        }
      }
    },
    [mode, sessionCount, getPhaseDuration, updateSession, triggerHistoryRefresh]
  );

  // Timer tick — countdown
  useEffect(() => {
    if (!isRunning || phase === "idle" || mode === "stopwatch") return;
    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          transitionPhase(phase);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, phase, transitionPhase, mode]);

  // Timer tick — stopwatch
  useEffect(() => {
    if (!isRunning || mode !== "stopwatch") return;
    intervalRef.current = setInterval(() => {
      setStopwatchElapsed((prev) => prev + 1);
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, mode]);

  // Cleanup
  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
  }, []);

  // Start — only starts the timer, does NOT store in DB
  const handleStart = () => {
    if (mode === "stopwatch") {
      if (phase === "idle") {
        setPhase("focus");
        sessionStartRef.current = getLocalISOString();
      }
    } else {
      if (phase === "idle") {
        const dur = getPhaseDuration("focus");
        setPhase("focus");
        setTimeRemaining(dur);
        setTotalTime(dur);
        setSessionCount(0);
        sessionStartRef.current = getLocalISOString();
        currentDurationRef.current = dur;
      }
    }
    setIsRunning(true);
  };

  // Pause
  const handlePause = () => setIsRunning(false);

  // Reset
  const handleReset = async () => {
    setIsRunning(false);
    if (mode === "stopwatch") {
      // Stopwatch: only save to DB if ran for more than 1 minute
      if (stopwatchElapsed > 60) {
        await createSession(title || "Stopwatch", Math.floor(stopwatchElapsed / 60));
      }
      setStopwatchElapsed(0);
    } else {
      // Pomodoro: count if completed at least one focus block
      const completedAny = sessionCount > 0 || phase !== "focus";
      await updateSession(completedAny);
      const dur = focusMinutes * 60;
      setTimeRemaining(dur);
      setTotalTime(dur);
      setSessionCount(0);
      currentDurationRef.current = 0;
    }
    setPhase("idle");
    sessionStartRef.current = null;
    currentSessionIdRef.current = null;
    reusedSessionIdRef.current = null;
    setTitle("");
  };

  // Skip
  const handleSkip = () => {
    if (phase === "idle" || mode === "stopwatch") return;
    transitionPhase(phase);
  };

  // Mode change
  const handleModeChange = (newMode: "pomodoro" | "stopwatch") => {
    if (isRunning) return;
    setMode(newMode);
    setPhase("idle");
    setSessionCount(0);
    setTitle("");
    setStopwatchElapsed(0);

    if (newMode === "stopwatch") {
      setTimeRemaining(0);
      setTotalTime(0);
    } else {
      const dur = focusMinutes * 60;
      setTimeRemaining(dur);
      setTotalTime(dur);
    }
  };

  // Start session from overlay
  const handleStartFromOverlay = async () => {
    const errors: { title?: string; focus?: string; brk?: string } = {};
    if (!title.trim()) errors.title = "Title is required";
    if (focusMinutes < 1 || focusMinutes > 120) errors.focus = "Must be 1–120 min";
    if (breakMinutes < 1 || breakMinutes > 60) errors.brk = "Must be 1–60 min";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setNewSessionOverlayOpen(false);
    const dur = focusMinutes * 60;
    setPhase("focus");
    setTimeRemaining(dur);
    setTotalTime(dur);
    setSessionCount(0);
    sessionStartRef.current = getLocalISOString();
    currentDurationRef.current = dur;
    setIsRunning(true);
    await createSession(title, focusMinutes);
  };

  // Reuse session — stores original ID to track completion count
  const handleReuseSession = (session: FocusSession) => {
    if (isRunning) return;
    reusedSessionIdRef.current = session.id;
    if (session.mode === "stopwatch") {
      setMode("stopwatch");
      setTitle(session.title);
      setTimeRemaining(0);
      setTotalTime(0);
    } else {
      setMode("pomodoro");
      setTitle(session.title);
      setFocusMinutes(session.duration_minutes);
      setBreakMinutes(session.break_minutes);
      setTimeRemaining(session.duration_minutes * 60);
      setTotalTime(session.duration_minutes * 60);
    }
    setPhase("idle");
    setSessionCount(0);
    setStopwatchElapsed(0);
  };

  // Escalating alert: 1st=gentle, 2nd=louder, 3rd+=critical + screen flash
  const triggerEscalatingAlert = useCallback(
    (reason: string) => {
      distractionCountRef.current += 1;
      const count = distractionCountRef.current;

      let soundType: "warning" | "danger" | "critical";
      let label: string;

      if (count === 1) {
        soundType = "warning";
        label = `⚠️ Warning #1: ${reason}`;
      } else if (count === 2) {
        soundType = "danger";
        label = `🔴 Warning #2: ${reason} — focus!`;
      } else {
        soundType = "critical";
        label = `🚨 Critical #${count}: ${reason} — STOP what you're doing!`;
        // Screen flash for critical
        setScreenFlash(true);
        if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
        flashTimeoutRef.current = setTimeout(() => setScreenFlash(false), 1500);
      }

      playAlertSound(soundType);
      if (!cameraPreview) addToast(count >= 3 ? "danger" : "warning", label);
      sendNotification("Serious Focus", label, `focus-alert-${count}`);
    },
    [cameraPreview, addToast]
  );

  // Camera detection — Serious Focus mode (escalating alerts)
  const handleDetection = useCallback(
    (result: DetectionResult) => {
      if (!isRunning) return;
      const now = Date.now();
      if (now - lastAlertRef.current < 20000) return;

      // Track face absence
      if (!result.faceDetected) {
        if (!absentStartRef.current) absentStartRef.current = now;
        else if (now - absentStartRef.current > SERIOUS_FOCUS_THRESHOLD) {
          lastAlertRef.current = now;
          absentStartRef.current = null;
          triggerEscalatingAlert("Face away");
        }
      } else {
        absentStartRef.current = null;
      }

      // Track phone usage
      if (result.phoneDetected) {
        if (!phoneStartRef.current) phoneStartRef.current = now;
        else if (now - phoneStartRef.current > SERIOUS_FOCUS_THRESHOLD) {
          lastAlertRef.current = now;
          phoneStartRef.current = null;
          triggerEscalatingAlert("Phone detected");
        }
      } else {
        phoneStartRef.current = null;
      }

      // Reset distraction count when fully focused (face + no phone)
      if (result.faceDetected && !result.phoneDetected && distractionCountRef.current > 0) {
        distractionCountRef.current = 0;
      }
    },
    [isRunning, triggerEscalatingAlert]
  );

  const handleToggleCamera = async () => {
    if (!cameraEnabled) await requestNotificationPermission();
    setCameraEnabled(!cameraEnabled);
  };

  const handleCameraAlert = useCallback(() => {}, []);
  const isIdle = phase === "idle";

  if (userLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-6 w-6 rounded" />
        </div>

        {/* Mode selector skeleton */}
        <div className="flex gap-2 max-w-sm mx-auto">
          <Skeleton className="h-11 flex-1 rounded-lg" />
          <Skeleton className="h-11 flex-1 rounded-lg" />
        </div>

        {/* Timer card skeleton */}
        <div className="flex flex-col items-center gap-6">
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] w-full max-w-md flex flex-col items-center py-12">
            <Skeleton className="h-32 w-32 rounded-full" />
            <Skeleton className="h-4 w-24 mt-4" />
            <Skeleton className="h-3 w-16 mt-2" />
          </div>

          {/* Camera controls skeleton */}
          <div className="flex gap-3">
            <Skeleton className="h-10 w-36 rounded-lg" />
          </div>

          {/* Control buttons skeleton */}
          <div className="flex gap-3 items-center">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="h-12 w-12 rounded-full" />
          </div>
        </div>

        {/* History skeleton */}
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
          <Skeleton className="h-5 w-40 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={pageHeader.container}>
        <div>
          <h1 className={pageHeader.title}>Focus</h1>
          <p className={pageHeader.subtitle}>Stay focused with timed sessions</p>
        </div>
        <Timer size={24} style={{ color: "var(--color-text-secondary)" }} />
      </div>

      {/* Mode selector */}
      <div className="flex gap-2 max-w-sm mx-auto">
        <button
          onClick={() => handleModeChange("pomodoro")}
          disabled={isRunning}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
            mode === "pomodoro"
              ? "bg-[#8b6914] text-white"
              : "bg-(--color-surface-hover) text-(--color-text-secondary) hover:bg-(--color-border)"
          } ${isRunning ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <Timer size={16} />
          Pomodoro
        </button>
        <button
          onClick={() => handleModeChange("stopwatch")}
          disabled={isRunning}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
            mode === "stopwatch"
              ? "bg-[#8b6914] text-white"
              : "bg-(--color-surface-hover) text-(--color-text-secondary) hover:bg-(--color-border)"
          } ${isRunning ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <Clock size={16} />
          Stopwatch
        </button>
      </div>

      {/* Timer + Controls */}
      <div className="flex flex-col items-center gap-6">
        <div className={card.base + " w-full max-w-md flex flex-col items-center py-12"}>
          <FocusTimer
            timeRemaining={timeRemaining}
            totalTime={totalTime}
            phase={phase}
            isStopwatch={mode === "stopwatch"}
            stopwatchElapsed={stopwatchElapsed}
          />
        </div>

        {/* Camera controls */}
        <div className="flex gap-3">
          <button
            onClick={handleToggleCamera}
            disabled={isIdle}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              cameraEnabled
                ? "bg-[#8b6914] text-white"
                : isIdle
                  ? "bg-(--color-surface-hover) text-(--color-text-muted) cursor-not-allowed opacity-50"
                  : "bg-(--color-surface-hover) text-(--color-text-secondary) hover:bg-(--color-border)"
            }`}
          >
            <Camera size={16} />
            {cameraEnabled ? "Serious Focus ON" : "Serious Focus"}
          </button>

          {cameraEnabled && (
            <button
              onClick={() => setCameraPreview(!cameraPreview)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-(--color-surface-hover) text-(--color-text-secondary) hover:bg-(--color-border) transition-colors"
            >
              {cameraPreview ? <Eye size={16} /> : <EyeOff size={16} />}
              {cameraPreview ? "Hide Preview" : "Show Preview"}
            </button>
          )}
        </div>

        {/* Control buttons */}
        <div className="flex gap-3">
          <Button variant="outline" size="icon" onClick={handleReset} className="h-12 w-12 rounded-full">
            <RotateCcw size={18} />
          </Button>
          <Button
            size="icon"
            onClick={isRunning ? handlePause : handleStart}
            className="h-16 w-16 rounded-full bg-[#8b6914] hover:bg-[#a07d1a] text-white"
          >
            {isRunning ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleSkip}
            disabled={isIdle || mode === "stopwatch"}
            className="h-12 w-12 rounded-full"
          >
            <SkipForward size={18} />
          </Button>
        </div>
      </div>

      {/* Camera Monitor */}
      <div className="max-w-md">
        <CameraMonitor
          enabled={cameraEnabled}
          showPreview={cameraPreview}
          onDetection={handleDetection}
          onAlert={handleCameraAlert}
        />
      </div>

      {/* History — pomodoro mode */}
      {mode === "pomodoro" && (
        <FocusHistory
          onReuseSession={handleReuseSession}
          onNewSession={() => setNewSessionOverlayOpen(true)}
          refreshKey={historyRefreshKey}
        />
      )}

      {/* Toast */}
      <ToastContainer toasts={toasts} />

      {/* New Session Overlay */}
      {newSessionOverlayOpen && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/60" onClick={() => setNewSessionOverlayOpen(false)} />
          <div
            className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto shadow-2xl"
            style={{ backgroundColor: "var(--color-bg)" }}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}>
              <h2 className="text-base font-bold" style={{ color: "var(--color-text)" }}>New Focus Session</h2>
              <button onClick={() => setNewSessionOverlayOpen(false)} className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)]">
                <X size={20} style={{ color: "var(--color-text-secondary)" }} />
              </button>
            </div>

            {/* Form */}
            <div className="p-4 space-y-4">
              <div className="space-y-1">
                <Label className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Session Title</Label>
                <Input
                  type="text"
                  placeholder="e.g. Deep work, Reading, Study..."
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); setFormErrors((p) => ({ ...p, title: undefined })); }}
                />
                {formErrors.title && <p className="text-xs text-red-500">{formErrors.title}</p>}
              </div>

              <div className="flex gap-4">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Focus (min)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={120}
                    value={focusMinutes}
                    onChange={(e) => { setFocusMinutes(Number(e.target.value) || 1); setFormErrors((p) => ({ ...p, focus: undefined })); }}
                    className="text-center"
                  />
                  {formErrors.focus && <p className="text-xs text-red-500">{formErrors.focus}</p>}
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Break (min)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={60}
                    value={breakMinutes}
                    onChange={(e) => { setBreakMinutes(Number(e.target.value) || 1); setFormErrors((p) => ({ ...p, brk: undefined })); }}
                    className="text-center"
                  />
                  {formErrors.brk && <p className="text-xs text-red-500">{formErrors.brk}</p>}
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 rounded-lg" style={{ backgroundColor: "var(--color-surface-hover)" }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Total time</span>
                  <span className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                    {focusMinutes + breakMinutes} min
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Focus / Break</span>
                  <span className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                    {focusMinutes}m / {breakMinutes}m
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setNewSessionOverlayOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleStartFromOverlay}
                  className="flex-1 bg-[#8b6914] hover:bg-[#a07d1a] text-white"
                >
                  Start Session
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Screen flash for critical alerts */}
      {screenFlash && (
        <div
          className="fixed inset-0 z-[200] pointer-events-none animate-pulse"
          style={{ backgroundColor: "rgba(239, 68, 68, 0.15)" }}
        />
      )}
    </div>
  );
}
