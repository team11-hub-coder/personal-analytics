"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useUser } from "@/hooks/useAuth";
import { addFocusSession, getLocalISOString } from "@/lib/focus";
import { pageHeader, card } from "@/lib/theme";
import FocusTimer from "@/components/focus/FocusTimer";
import FocusHistory from "@/components/focus/FocusHistory";
import CameraMonitor from "@/components/focus/CameraMonitor";
import { ToastContainer, useToasts } from "@/components/focus/Toast";
import { playAlertSound, playSongAlert, requestNotificationPermission, sendNotification } from "@/lib/alerts";
import { sendAbsenceNotification } from "@/lib/email";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FocusPhase, FocusSession, DistractionEvent } from "@/types";
import type { DetectionResult } from "@/lib/detection";
import { Skeleton } from "@/components/ui/skeleton";
import { Timer, Camera, Eye, EyeOff, X, Play, Pause, RotateCcw, SkipForward, Clock, Tag } from "lucide-react";

const DEFAULT_FOCUS = 25;
const DEFAULT_BREAK = 5;
const POMODORO_LONG_BREAK = 15 * 60;
const POMODORO_SESSIONS = 4;

// Alert thresholds (hardcoded for demo)
const ABSENT_THRESHOLD_MS = 20_000;  // 20 seconds (faster detection)
const EMAIL_THRESHOLD_MS = 90_000;   // 90 seconds (faster email alert)
const ALERT_COOLDOWN_MS = 15_000;    // 15 seconds between alerts

// Preset tags
const PRESET_TAGS = ["Study", "Work", "Reading", "Coding", "Writing", "Creative", "Other"];

export default function FocusPage() {
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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [notes, setNotes] = useState("");

  // Stopwatch state
  const [stopwatchElapsed, setStopwatchElapsed] = useState(0);

  // Camera state
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraPreview, setCameraPreview] = useState(true);
  const lastAlertRef = useRef<number>(0);
  const absentStartRef = useRef<number | null>(null);
  const phoneStartRef = useRef<number | null>(null);
  const distractionLogRef = useRef<DistractionEvent[]>([]);
  const emailSentRef = useRef(false);

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

  // Save session to DB (called on complete/reset only)
  const saveSession = useCallback(
    async (sessionTitle: string, durationMin: number, completed: boolean, completedCount: number) => {
      if (!user) return;
      const result = await addFocusSession({
        user_id: user.id,
        title: sessionTitle,
        mode,
        duration_minutes: durationMin,
        break_minutes: mode === "stopwatch" ? 0 : breakMinutes,
        completed,
        completed_count: completedCount,
        started_at: sessionStartRef.current ?? getLocalISOString(),
        ended_at: getLocalISOString(),
        tags: selectedTags,
        notes,
        distraction_log: distractionLogRef.current,
      });
      if (result.data) {
        currentSessionIdRef.current = result.data.id;
      }
      triggerHistoryRefresh();
    },
    [user, mode, breakMinutes, selectedTags, notes, triggerHistoryRefresh]
  );

  // Transition phase — handles focus→break→focus cycles (local only, no DB)
  const transitionPhase = useCallback(
    async (currentPhase: FocusPhase) => {
      if (mode === "pomodoro") {
        if (currentPhase === "focus") {
          // Focus block done — play alert with song
          playSongAlert("focus");
          sendNotification("Focus Complete", "Time for a break!", "focus-complete");

          const nextCount = sessionCount + 1;
          setSessionCount(nextCount);
          if (nextCount % POMODORO_SESSIONS === 0) {
            // All 4 focus blocks done — session complete
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

          const dur = getPhaseDuration("focus");
          setPhase("focus");
          setTimeRemaining(dur);
          setTotalTime(dur);
          sessionStartRef.current = getLocalISOString();
          currentDurationRef.current = dur;
        }
      }
    },
    [mode, sessionCount, getPhaseDuration]
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

  // Start — local timer only, no DB save
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

  // Reset — save to DB only if session completed
  const handleReset = async () => {
    setIsRunning(false);
    if (mode === "stopwatch") {
      // Stopwatch: save if ran for more than 1 minute
      if (stopwatchElapsed > 60) {
        await saveSession(title || "Stopwatch", Math.floor(stopwatchElapsed / 60), true, 1);
      }
      setStopwatchElapsed(0);
    } else {
      // Pomodoro: save if completed at least one focus block
      const completedAny = sessionCount > 0 || phase !== "focus";
      if (completedAny) {
        await saveSession(title || "Focus Session", focusMinutes, true, sessionCount);
      }
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
    setSelectedTags([]);
    setCustomTag("");
    setNotes("");
    distractionLogRef.current = [];
    emailSentRef.current = false;
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

  // Start session from overlay — local timer only
  const handleStartFromOverlay = () => {
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
    distractionLogRef.current = [];
    emailSentRef.current = false;
    setIsRunning(true);
  };

  // Reuse session — creates new session based on the reused one
  const handleReuseSession = async (session: FocusSession) => {
    if (isRunning) return;
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
      if (now - lastAlertRef.current < ALERT_COOLDOWN_MS) return;

      // Track face absence
      if (!result.faceDetected) {
        if (!absentStartRef.current) absentStartRef.current = now;
        else if (now - absentStartRef.current > ABSENT_THRESHOLD_MS) {
          lastAlertRef.current = now;
          const durationSec = Math.floor((now - absentStartRef.current) / 1000);
          absentStartRef.current = null;
          triggerEscalatingAlert("Face away");

          // Log distraction event
          distractionLogRef.current.push({
            type: "absent",
            timestamp: getLocalISOString(),
            durationSec,
            action: "warning",
          });
        }

        // Check for absence threshold (2 minutes)
        if (absentStartRef.current && now - absentStartRef.current > EMAIL_THRESHOLD_MS && !emailSentRef.current) {
          emailSentRef.current = true;
          const durationMinutes = Math.floor((now - absentStartRef.current) / 60000);

          // Send absence notification
          if (user?.email) {
            sendAbsenceNotification({
              userEmail: user.email,
              sessionTitle: title || "Focus Session",
              durationMinutes,
              timestamp: getLocalISOString(),
            });
          }

          // Log absence event
          distractionLogRef.current.push({
            type: "absent",
            timestamp: getLocalISOString(),
            durationSec: Math.floor((now - absentStartRef.current) / 1000),
            action: "email",
          });
        }
      } else {
        absentStartRef.current = null;
      }

      // Track phone usage
      if (result.phoneDetected) {
        if (!phoneStartRef.current) phoneStartRef.current = now;
        else if (now - phoneStartRef.current > ABSENT_THRESHOLD_MS) {
          lastAlertRef.current = now;
          const durationSec = Math.floor((now - phoneStartRef.current) / 1000);
          phoneStartRef.current = null;
          triggerEscalatingAlert("Phone detected");

          // Log distraction event
          distractionLogRef.current.push({
            type: "phone",
            timestamp: getLocalISOString(),
            durationSec,
            action: "warning",
          });
        }
      } else {
        phoneStartRef.current = null;
      }

      // Reset distraction count when fully focused (face + no phone)
      if (result.faceDetected && !result.phoneDetected && distractionCountRef.current > 0) {
        distractionCountRef.current = 0;
      }
    },
    [isRunning, triggerEscalatingAlert, user, title]
  );

  const handleToggleCamera = async () => {
    if (!cameraEnabled) await requestNotificationPermission();
    setCameraEnabled(!cameraEnabled);
  };

  const handleCameraAlert = useCallback(() => {}, []);

  // Tag toggle
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Add custom tag
  const addCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      setSelectedTags((prev) => [...prev, customTag.trim()]);
      setCustomTag("");
    }
  };

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
        <Timer size={24} className="text-(--color-text-secondary)" />
      </div>

      {/* Mode selector */}
      <div className="flex gap-2 max-w-sm mx-auto">
        <button
          onClick={() => handleModeChange("pomodoro")}
          disabled={isRunning}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
            mode === "pomodoro"
              ? "bg-(--color-primary) text-white"
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
              ? "bg-(--color-primary) text-white"
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
                ? "bg-(--color-primary) text-white"
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
            className="h-16 w-16 rounded-full bg-(--color-primary) hover:bg-(--color-primary-hover) text-white"
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
            className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto shadow-2xl bg-(--color-bg)"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-(--color-border) bg-(--color-bg)">
              <h2 className="text-base font-bold text-(--color-text)">New Focus Session</h2>
              <button onClick={() => setNewSessionOverlayOpen(false)} className="p-2 rounded-lg hover:bg-(--color-surface-hover)">
                <X size={20} className="text-(--color-text-secondary)" />
              </button>
            </div>

            {/* Form */}
            <div className="p-4 space-y-4">
              <div className="space-y-1">
                <Label className="text-xs text-(--color-text-secondary)">Session Title</Label>
                <Input
                  type="text"
                  placeholder="e.g. Deep work, Reading, Study..."
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); setFormErrors((p) => ({ ...p, title: undefined })); }}
                />
                {formErrors.title && <p className="text-xs text-red-500">{formErrors.title}</p>}
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1.5 text-(--color-text-secondary)">
                  <Tag size={12} />
                  Tags
                </Label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        selectedTags.includes(tag)
                          ? "bg-(--color-primary) text-white"
                          : "bg-(--color-surface-hover) text-(--color-text-secondary) hover:bg-(--color-border)"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Custom tag..."
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCustomTag()}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addCustomTag}
                    disabled={!customTag.trim()}
                  >
                    Add
                  </Button>
                </div>
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-(--color-primary)/10 text-(--color-primary)"
                      >
                        {tag}
                        <button onClick={() => toggleTag(tag)} className="hover:text-(--color-primary-hover)">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <Label className="text-xs text-(--color-text-secondary)">Notes</Label>
                <textarea
                  placeholder="What are you working on?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-(--color-primary) bg-(--color-surface) border-(--color-border) text-(--color-text)"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs text-(--color-text-secondary)">Focus (min)</Label>
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
                  <Label className="text-xs text-(--color-text-secondary)">Break (min)</Label>
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
              <div className="p-4 rounded-lg bg-(--color-surface-hover)">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-(--color-text-secondary)">Total time</span>
                  <span className="text-sm font-medium text-(--color-text)">
                    {focusMinutes + breakMinutes} min
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-(--color-text-secondary)">Focus / Break</span>
                  <span className="text-sm font-medium text-(--color-text)">
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
                  className="flex-1 bg-(--color-primary) hover:bg-(--color-primary-hover) text-white"
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
          className="fixed inset-0 z-[200] pointer-events-none animate-pulse bg-red-500/15"
        />
      )}
    </div>
  );
}
