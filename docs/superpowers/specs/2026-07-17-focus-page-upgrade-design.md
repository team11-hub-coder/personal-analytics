# Focus Page Upgrade Design

**Date:** 2026-07-17
**Scope:** 4 features — Timer UI, Ambient Sounds, Daily Focus Target, Achievements/Badges
**Approach:** Modular components (each feature independent)

---

## 1. Better Timer UI

### Goal
Replace the plain circular timer with a polished, animated glass-morphism design.

### Design

**Visual:**
- SVG circular progress ring with animated `stroke-dashoffset`
- Glass morphism card: `backdrop-blur-xl`, semi-transparent background, subtle border
- Phase color coding: blue (focus), green (break), gold (longBreak)
- Pulse animation on timer completion
- Session counter dots below timer: `● ● ○ ○` (filled = completed focus blocks)

**Layout:**
```
┌─────────────────────────────┐
│  ╭─────────────────────╮    │
│  │    ╭───────────╮    │    │
│  │    │           │    │    │
│  │    │   24:35   │    │    │
│  │    │  FOCUS    │    │    │
│  │    ╰───────────╯    │    │
│  │     ● ● ○ ○        │    │
│  ╰─────────────────────╯    │
│     [▶ Start]  [↺ Reset]   │
└─────────────────────────────┘
```

**Components:**
- `components/focus/TimerDisplay.tsx` — SVG ring + time display + phase label
- `components/focus/SessionDots.tsx` — completion indicator dots

**Implementation notes:**
- SVG `<circle>` with `stroke-dasharray` and `stroke-dashoffset` for progress
- CSS `transition` on `stroke-dashoffset` for smooth animation
- `backdrop-filter: blur(16px)` for glass effect
- Use existing `lib/theme.ts` colors, add phase colors there

---

## 2. Ambient Sounds

### Goal
Let users play background sounds during focus sessions.

### Features
- 5 built-in sounds: Rain, Coffee Shop, Fire Crackling, Ocean Waves, Forest Birds
- User upload: MP3/WAV files stored in Supabase Storage
- Volume slider
- Play/pause toggle
- Sound persists across phase changes (focus → break)
- Sound stops when session ends

### UI
```
┌─────────────────────────────────┐
│  🔊 Rain  ━━━━━━━●━━━━  80%   │
│  [▶] [Rain] [☕] [🔥] [🌊] [+] │
└─────────────────────────────────┘
```

### Data Model

**New table: `user_sounds`**
```sql
CREATE TABLE user_sounds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_sounds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own sounds" ON user_sounds
  FOR ALL USING (auth.uid() = user_id);
```

### Storage
- Bucket: `focus-sounds`
- Max file size: 5MB
- Max sounds per user: 10
- Accepted formats: audio/mp3, audio/wav, audio/ogg

### Components
- `components/focus/AmbientSounds.tsx` — sound player bar
- `components/focus/SoundUploader.tsx` — upload modal
- `hooks/useAmbientSounds.ts` — sound playback + Supabase queries

### Built-in Sounds
- Store in `public/sounds/` directory
- Files: `rain.mp3`, `coffee-shop.mp3`, `fire-crackling.mp3`, `ocean-waves.mp3`, `forest-birds.mp3`
- Each ~2-3MB, looped during playback

---

## 3. Daily Focus Target

### Goal
Let users set a daily focus minutes goal and track progress.

### Features
- Configurable daily goal (default: 60 min)
- Progress bar on focus page
- Streak counter: consecutive days meeting goal
- Dashboard widget integration

### UI (Focus Page)
```
┌─────────────────────────────┐
│  🎯 Daily Goal: 45/60 min  │
│  ████████████░░░░░ 75%     │
│  🔥 5 day streak           │
└─────────────────────────────┘
```

### Data Model

**Modified table: `profiles`**
```sql
ALTER TABLE profiles ADD COLUMN daily_focus_goal INTEGER DEFAULT 60;
```

### Logic
- Progress = `sum(completed focus minutes today) / daily_focus_goal`
- Streak = consecutive days where progress ≥ 100%
- Calculate from existing `focus_sessions` table (no new table needed)

### Components
- `components/focus/DailyGoal.tsx` — progress bar + streak display
- `components/focus/GoalSettings.tsx` — goal configuration modal
- `hooks/useDailyGoal.ts` — progress calculation + goal CRUD

### Integration
- Appears above timer on focus page
- Goal settings accessible via gear icon
- Also shown on dashboard as a stat card

---

## 4. Achievements/Badges

### Goal
Gamify focus sessions with unlockable achievements.

### Badge Definitions

| Badge | Condition | Icon | Category |
|-------|-----------|------|----------|
| First Step | Complete 1st session | 🌱 | Milestone |
| Early Bird | 3 day streak | 🌅 | Streak |
| Week Warrior | 7 day streak | ⚔️ | Streak |
| Monthly Master | 30 day streak | 👑 | Streak |
| Focus 10h | 10 hours total focus | ⏰ | Time |
| Focus 50h | 50 hours total focus | 🔥 | Time |
| Century Club | 100 sessions completed | 💯 | Sessions |
| Deep Diver | 10+ hour sessions total | 🧘 | Depth |
| Distraction Free | 5 sessions with 0 distractions | 🎯 | Quality |
| Night Owl | Complete session after 10pm | 🦉 | Special |

### UI
- Badge shelf on focus page (horizontal scrollable row)
- Unlocked: full color + name below
- Locked: grayed out + "???" text
- Toast notification on unlock

### Data Model

**New table: `user_achievements`**
```sql
CREATE TABLE user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert achievements" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Components
- `components/focus/BadgeShelf.tsx` — badge display row
- `components/focus/BadgeToast.tsx` — unlock notification
- `lib/achievements.ts` — badge definitions + check logic
- `hooks/useAchievements.ts` — achievement queries + unlock checks

### Logic
- After each session completes, check all badge conditions
- Insert new achievements to DB
- Show toast for newly unlocked badges
- Badge check runs in `handleReset` after saveSession

---

## Database Changes Summary

| Change | Type | Table |
|--------|------|-------|
| Add `daily_focus_goal` column | ALTER | `profiles` |
| Create `user_sounds` table | CREATE | new |
| Create `user_achievements` table | CREATE | new |
| Create `focus-sounds` storage bucket | CREATE | Supabase Storage |

## Files to Create/Modify

| File | Action | Feature |
|------|--------|---------|
| `components/focus/TimerDisplay.tsx` | Create | Timer UI |
| `components/focus/SessionDots.tsx` | Create | Timer UI |
| `components/focus/AmbientSounds.tsx` | Create | Sounds |
| `components/focus/SoundUploader.tsx` | Create | Sounds |
| `hooks/useAmbientSounds.ts` | Create | Sounds |
| `components/focus/DailyGoal.tsx` | Create | Goals |
| `components/focus/GoalSettings.tsx` | Create | Goals |
| `hooks/useDailyGoal.ts` | Create | Goals |
| `components/focus/BadgeShelf.tsx` | Create | Badges |
| `components/focus/BadgeToast.tsx` | Create | Badges |
| `lib/achievements.ts` | Create | Badges |
| `hooks/useAchievements.ts` | Create | Badges |
| `app/(app)/focus/page.tsx` | Modify | All |
| `types/index.ts` | Modify | All |
| `lib/theme.ts` | Modify | Timer UI |
| `public/sounds/` | Add | Sounds |

## Out of Scope

- Spotify integration (future)
- Website/app blocker (future)
- AI focus tips (future)
- Keyboard shortcuts (future)
- Session presets (future)
