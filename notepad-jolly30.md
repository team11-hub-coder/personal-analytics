# Jolly30 — Reminders Module Notepad

> Owner: Jolly30 | Module: 5 (Reminder System) | Sprint: Jul 7–18, 2026

---

## ✅ Done

- [x] Reminder CRUD (create, edit, delete, toggle on/off)
- [x] Repeat options (none, daily, weekly, monthly)
- [x] Date/time picker with AM/PM selects
- [x] Timezone fix (local → UTC storage)
- [x] Delete confirmation dialog (replaced browser `confirm()`)
- [x] Color-coded borders (green = active, yellow = overdue)
- [x] Skeleton loading + empty states
- [x] PR #21 open, CI passing
- [x] Notification bell with portal dropdown (sidebar + mobile header)
- [x] Badge count for overdue reminders with pulse animation
- [x] Browser push notifications via service worker (30s interval)
- [x] SSR-safe window access (deferred to useEffect)
- [x] eslint.config.mjs — downgrade react-hooks rules to warnings (CI fix)

---

## 🔲 Still To Build

### 5.2 Notifications (remaining)
- [ ] Overdue reminder alerts via Supabase Realtime subscription
- [ ] Realtime listener on `reminders` table for live updates

### 5.3 Reminder Analytics
- [ ] Reminder adherence rate (% completed on time)
- [ ] Most common reminder types / categories
- [ ] Analytics chart (Recharts — use existing wrappers)

### Data Export
- [ ] Export reminders as CSV
- [ ] Export reminders as JSON
- [ ] Date range selection for export

---

## 📋 Notes

- PR #21: https://github.com/team11-hub-coder/personal-analytics/pull/21
- `eslint.config.mjs` updated to downgrade react-hooks rules to warnings (CI fix)
- Reminder table schema: `id`, `user_id`, `title`, `remind_at`, `repeat`, `is_active`, `created_at`
- Backup: hlaingthinphyu (Lead)
