# Telegram Bot Setup Guide

**Personal Analytics Dashboard — Telegram Integration**

Log workouts, expenses, tasks, and reminders directly from Telegram. Data syncs instantly to your dashboard.

---

## Quick Start (5 minutes)

### Step 1: Create Your Bot with BotFather

1. Open Telegram and search for **[@BotFather](https://t.me/BotFather)**
2. Start a chat and send: `/newbot`
3. BotFather will ask for a **name** — enter anything (e.g., "My Analytics Bot")
4. BotFather will ask for a **username** — must end with `bot` (e.g., `my_analytics_bot`)
5. BotFather will send you a **bot token** — copy it

> ⚠️ Keep your bot token secret! Anyone with it can control your bot.

### Step 2: Connect Bot to Dashboard

1. Open the Personal Analytics Dashboard
2. Go to **Settings** page
3. Find the **Telegram Bot** section
4. Paste your bot token and click **Connect Bot**
5. You'll see a green "Connected" badge

### Step 3: Start Using Your Bot

1. Open your new bot on Telegram (search for the username you created)
2. Send `/start`
3. You're ready to log data!

---

## Supported Commands

### 🏋️ Workouts

**Command format:**
```
/workout <exercise> <reps> <optional details>
```

**Examples:**
```
/workout push-up 30 reps
/workout bench-press 10 reps 5 sets 60kg
/workout run 30 min
/workout squat 20 reps 3 sets
```

**Natural language:**
```
I did 30 push-ups today
Did 5 sets of bench press
Ran 5km this morning
30 minutes of yoga
```

**Fields explained:**
- Exercise name: any text (e.g., "push-up", "bench press", "run")
- Reps: number of repetitions
- Sets: number of sets (optional)
- Weight: weight in kg (optional)
- Duration: time in minutes (for cardio activities)

---

### 💰 Finance

**Command format:**
```
/expense <category> <amount> <description>
/income <category> <amount> <description>
```

**Examples:**
```
/expense food 1500 lunch at cafe
/expense transport 500 taxi
/income salary 50000 monthly salary
/expense groceries 2300 weekly groceries
```

**Natural language:**
```
Spent 1500 on lunch
Earned 50000 salary
Bought groceries for 2300
Paid 500 for taxi
```

**Auto-detected categories:**
- Food (lunch, dinner, breakfast, meal, restaurant, cafe, coffee)
- Transport (taxi, uber, bus, gas, fuel)
- Bills (rent, electric, water, internet, phone)
- Groceries (grocery, market, shop)
- Entertainment (movie, game, fun)
- Health (medicine, doctor, pharmacy)
- Salary (salary, wage, income)

---

### ✅ Tasks

**Command format:**
```
/task <title> <priority>
```

**Examples:**
```
/task buy groceries high
/task finish homework medium
/task call dentist low
/task review PR urgent
```

**Natural language:**
```
Buy groceries high priority
Finish homework
Call dentist
Need to review PR asap
```

**Priority levels:**
- `high` / `urgent` / `important` / `asap` / `critical` → 🔴 High
- `medium` (default) → 🟡 Medium
- `low` / `minor` / `whenever` / `eventually` → 🟢 Low

---

### ⏰ Reminders

**Command format:**
```
/remind <title> <date> <time>
```

**Examples:**
```
/remind meeting tomorrow 10am
/remind call dentist 2024-01-15 14:30
/remind workout daily 7am
/remind stand-up weekly 9am
```

**Natural language:**
```
Remind me about meeting tomorrow at 10am
Don't forget to call dentist
Remind me about workout at 7am daily
Remember to check email every Monday
```

**Date shortcuts:**
- `today` → today's date
- `yesterday` → yesterday's date
- `tomorrow` → tomorrow's date
- `YYYY-MM-DD` → specific date

**Repeat options:**
- `daily` / `every day` → repeats daily
- `weekly` / `every week` → repeats weekly
- `monthly` / `every month` → repeats monthly
- (none) → one-time reminder

---

### 📋 Other Commands

```
/start    → Welcome message
/help     → Show all commands
```

---

## Tips & Best Practices

### 💡 Natural Language Works!

You don't need to memorize commands. Just describe what you did:

| What you type | What gets logged |
|---------------|------------------|
| "Did 20 push-ups" | Workout: push-up, 20 reps |
| "Spent 500 on coffee" | Expense: Food, 500 |
| "Buy groceries tomorrow" | Task: Buy groceries |
| "Remind me about dentist at 3pm" | Reminder: Dentist, 3:00 PM |

### 🔢 Number Detection

The bot automatically detects what numbers mean based on context:

- **Workouts**: First number = reps, second = sets, third = weight (kg)
- **Finance**: First number = amount
- **Tasks**: Numbers are ignored (title text is used)
- **Reminders**: Numbers in time format (10am, 2:30pm) are used

### 📅 Date & Time

- Say "today", "tomorrow", or "yesterday" for quick dates
- Use `10am`, `2:30pm`, `14:00` for times
- Or use `YYYY-MM-DD` format for specific dates

### 🏷️ Priority Keywords

For tasks, include these words anywhere:
- High: `high`, `urgent`, `important`, `asap`, `critical`
- Low: `low`, `minor`, `whenever`, `eventually`
- Medium: everything else

---

## Troubleshooting

### ❌ "I didn't understand that"

The bot couldn't parse your message. Try:
1. Use a command format: `/workout push-up 30`
2. Include a number: "Did 30 push-ups"
3. Be specific: "Spent 1500 on lunch" not just "lunch"

### ❌ "Invalid bot token"

1. Make sure you copied the full token (looks like `123456789:ABCdef...`)
2. Check you got it from @BotFather
3. Try creating a new bot with `/newbot`

### ❌ Bot doesn't respond

1. Make sure you sent `/start` to your bot first
2. Check the dashboard Settings page — bot should show "Connected"
3. Try disconnecting and reconnecting

### ❌ Data not showing on dashboard

1. Check if the bot confirmation message appeared
2. Refresh the dashboard page
3. Check the Supabase table directly to verify data was inserted

---

## Security Notes

- Your bot token is stored encrypted in the database
- Each user has their own isolated bot
- The webhook uses a secret token to verify requests come from Telegram
- You can disconnect your bot at any time from Settings

---

## Advanced: BotFather Commands

After creating your bot, you can customize it:

```
/setname      → Change bot name
/setabout     → Set about text (shown in profile)
/setdescription → Set bot description
/setuserpic   → Set bot profile picture
/setcommands  → Set command list (help menu)
```

Example command list for BotFather:
```
/start - Welcome message
/help - Show all commands
/workout - Log a workout
/expense - Log an expense
/income - Log income
/task - Create a task
/reminder - Set a reminder
```

---

## API Reference

If you're building custom integrations:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/telegram` | POST | Webhook receiver (used by Telegram) |
| `/api/telegram/validate` | POST | Validate a bot token |

### Webhook Payload

Telegram sends updates in this format:
```json
{
  "message": {
    "chat": { "id": 123456 },
    "from": { "id": 789 },
    "text": "/workout push-up 30"
  }
}
```

---

## Support

If you need help:
1. Check this guide first
2. Look at the troubleshooting section
3. Ask in the team chat
