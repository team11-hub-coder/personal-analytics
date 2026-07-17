# Focus Page Upgrade — Phase 1 Design

**Date:** 2026-07-14
**Branch:** `feature/workout-exercise-tracker`
**Scope:** Improved detection, session tags & notes, distraction log
**Status:** ✅ Implemented

---

## 1. Goal

Upgrade the focus page for a camp project demonstration. The main priority is **precise face and phone detection** with a clear alert timeline. Secondary features: session tags & notes, and a distraction log that records every alert event.

## 2. Detection System

### 2.1 Architecture

Replace the current skin-color heuristic (`lib/detection.ts`) with a two-layer system:

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Face detection | Native `FaceDetection` API (Chrome 89+) | Detect if user is present |
| Object detection | YOLOv8-nano via ONNX Runtime Web (WebGL) | Detect `cell phone` and `person` classes |

**Fallback:** On browsers without native `FaceDetection` (Firefox, Safari), use the existing skin-color heuristic for face detection. YOLO-nano still handles phone detection.

### 2.2 Model Loading

- YOLOv8-nano ONNX model (~5MB) loaded via `onnxruntime-web`
- Model hosted on a CDN or bundled as a static asset in `public/models/yolov8n.onnx`
- Loaded lazily when camera is enabled (not on page load)
- WebGL backend preferred, WASM fallback

### 2.3 Detection Loop

- Frame analysis interval: **2 seconds** (down from 2.5s — more responsive)
- Canvas resolution: 320x240 (up from 160x120 — better accuracy for small objects like phones)
- Confidence threshold: **0.5** for YOLO detections

### 2.4 Temporal Smoothing

To reduce false positives:

- Require **3 consecutive positive frames** (~6 seconds) before triggering an alert
- Maintain a sliding window of last 6 detection results
- Only fire alert if ≥4 of last 6 frames agree on the detection
- Reset the counter immediately when detection clears

### 2.5 DetectionResult Interface

```typescript
interface DetectionResult {
  faceDetected: boolean;
  phoneDetected: boolean;
  faceCount: number;
  confidence: number;       // NEW: YOLO confidence score
  personDetected: boolean;  // NEW: YOLO person class
}
```

## 3. Alert Timeline

### 3.1 Timeline

```
0s ──────────── 30-40s ──────────── 2min ──────────
│  monitoring    │  alarm + warning   │  email sent
│                │  message on screen  │  + alarm
```

### 3.2 Thresholds

| Threshold | Trigger | Action |
|-----------|---------|--------|
| 30-40 seconds | Continuous absence OR phone usage | Alarm sound + on-screen warning message |
| 2 minutes | Continuous absence | Send email warning + persistent alarm |

- The absence/phone threshold is hardcoded at **35 seconds** for the demo (simple constant in `focus/page.tsx`, easy to adjust)
- The 2-minute email threshold is hardcoded at **120 seconds**
- Alert cooldown: 20 seconds between repeated alerts of the same type

### 3.3 Escalating Alerts

Existing escalating alert system is preserved:

1. **Warning #1** — gentle sound, toast notification
2. **Warning #2** — louder sound, toast with "focus!" message
3. **Critical #3+** — critical sound, screen flash (red overlay), persistent alarm

### 3.4 Absence Notification

- **Service:** In-app browser notification + console log
- **Trigger:** User absent from camera for 2+ continuous minutes
- **Notification content:** Session title, absence duration, timestamp
- **Setup required:** None — works automatically
- **Graceful degradation:** If browser notifications are blocked, logs to console only

### 3.5 On-Screen Warning Message

When an alert fires, the camera preview shows:

```
┌─────────────────────────────┐
│  ⚠️ Warning: Face away      │
│  00:35 elapsed              │
│  Return to your desk!       │
└─────────────────────────────┘
```

This replaces the current minimal timer badge with a more prominent, descriptive warning.

## 4. Session Tags & Notes

### 4.1 Database Changes

```sql
ALTER TABLE focus_sessions ADD COLUMN tags TEXT[] DEFAULT '{}';
ALTER TABLE focus_sessions ADD COLUMN notes TEXT DEFAULT '';
```

### 4.2 Types

```typescript
// Updated FocusSession in types/index.ts
interface FocusSession {
  // ... existing fields ...
  tags: string[];
  notes: string;
  distraction_log: DistractionEvent[];
}
```

### 4.3 UI — New Session Overlay

Add below the existing title field:

- **Tags:** Multi-select chip group. Preset options: `Study`, `Work`, `Reading`, `Coding`, `Writing`, `Creative`, `Other`. User can type custom tags. Selected chips highlighted with `#8b6914`.
- **Notes:** Optional textarea. Placeholder: "What are you working on?"

### 4.4 UI — History Display

- Tags shown as small colored chips next to session title in `FocusHistory`
- Notes shown as muted subtitle text (truncated to 1 line, expandable on click)
- Clicking a session row expands to show notes + distraction log

## 5. Distraction Log

### 5.1 Data Structure

```typescript
interface DistractionEvent {
  type: "absent" | "phone";
  timestamp: string;       // ISO timestamp
  durationSec: number;     // how long the distraction lasted
  action: "warning" | "email";  // what action was taken
}
```

### 5.2 Database Changes

```sql
ALTER TABLE focus_sessions ADD COLUMN distraction_log JSONB DEFAULT '[]';
```

### 5.3 Logging Logic

In `focus/page.tsx`, the existing `handleDetection` callback already tracks `absentStartRef` and `phoneStartRef`. Changes:

1. Add a `distractionLogRef = useRef<DistractionEvent[]>([])` to accumulate events
2. When an alert fires (at 30-40s or 2min), push a `DistractionEvent` into the array
3. On session end (`updateSession`), include `distraction_log: distractionLogRef.current` in the update payload
4. Reset the log array on session start

### 5.4 Display

- Each session row in `FocusHistory` shows a `⚠️ N distractions` badge if log is non-empty
- Click to expand: shows a timeline list with type icon (👤 absent / 📱 phone), timestamp, and duration
- Color coding: amber for warnings, red for email triggers

## 6. File Changes

| File | Change |
|------|--------|
| `lib/detection.ts` | Rewrite: Native FaceDetection + YOLO-nano ONNX. New `loadYoloModel()`, `detectWithYolo()` functions. |
| `lib/email.ts` | **New file:** Absence notification service. `sendAbsenceNotification(userEmail, sessionTitle, duration)`. |
| `components/focus/CameraMonitor.tsx` | Update detection loop interval to 2s. Update canvas to 320x240. Wire temporal smoothing. Enhanced warning UI on preview. |
| `app/(app)/focus/page.tsx` | Add tags/notes state + UI in overlay. Add `distractionLogRef`. Wire absence trigger at 2min. Pass log to session update. |
| `components/focus/FocusHistory.tsx` | Show tags chips, notes subtitle, distraction log expandable section. |
| `types/index.ts` | Update `FocusSession` interface with `tags`, `notes`, `distraction_log`. |
| `lib/focus.ts` | No changes needed — already handles `Partial<FocusSession>`. |

## 7. Environment Variables

No additional environment variables required. Absence notifications use browser notifications and console logging.

## 8. Dependencies

| Package | Purpose | Size |
|---------|---------|------|
| `onnxruntime-web` | Run YOLO-nano in browser | ~2MB |

## 9. Out of Scope (Phase 2)

- Focus statistics dashboard
- Ambient sounds / white noise
- Music player widget

## 10. Success Criteria

- [x] Face detection works reliably across lighting conditions and skin tones
- [x] Phone detection correctly identifies phones held in hand (not false positives on dark objects)
- [x] Alert fires within 30-40 seconds of continuous absence/phone use
- [x] Absence notification triggers at 2-minute threshold
- [x] Tags and notes save correctly to database
- [x] Distraction log records all events with correct timestamps
- [x] Demo-ready: no crashes, smooth UX, clear visual feedback
