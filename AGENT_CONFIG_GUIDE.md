# OpenClaw Agent Configuration Guide

## LinkedIn Bot Agent Structure

### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `name` | string | Agent display name | "LinkedIn Daily Poster" |
| `description` | string | What the agent does | "Posts LinkedIn content daily" |
| `schedule` | string | When to run | "daily", "hourly", "weekly" |
| `command` | string | Executable to run | "node" |
| `args` | array | Command arguments | `["path/to/script.js", "arg1"]` |

### Optional Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `schedule_time` | string | "09:00" | Time for daily agents (HH:MM) |
| `enabled` | boolean | true | Whether agent is active |
| `working_directory` | string | cwd | Where to run command |
| `timeout` | number | 300000 | Max runtime in ms (5 min default) |
| `retry_on_failure` | boolean | false | Retry if fails |
| `notifications` | object | {} | Success/failure alerts |
| `metadata` | object | {} | Custom data |

---

## Example 1: Basic LinkedIn Agent

```json
{
  "name": "LinkedIn Morning Post",
  "description": "Post motivational content at 9 AM daily",
  "schedule": "daily",
  "schedule_time": "09:00",
  "command": "node",
  "args": [
    "C:\\Users\\manoh\\personaliz-desktop\\linkedin_bot.js",
    "Good morning! Starting the day with some coding insights. 🚀 #DevLife"
  ]
}
```

---

## Example 2: AI-Generated Content Agent

```json
{
  "name": "AI Content Creator",
  "description": "Generate and post AI content daily",
  "schedule": "daily",
  "schedule_time": "14:00",
  "enabled": true,
  "command": "node",
  "args": [
    "C:\\Users\\manoh\\personaliz-desktop\\linkedin_bot.js",
    "📊 Weekly AI insights: The intersection of automation and productivity continues to evolve. Building tools that empower developers to work smarter, not harder. #ArtificialIntelligence #Productivity #TechInnovation"
  ],
  "working_directory": "C:\\Users\\manoh\\personaliz-desktop",
  "timeout": 300000,
  "retry_on_failure": false,
  "notifications": {
    "on_success": true,
    "on_failure": true
  }
}
```

---

## Example 3: Weekly Summary Agent

```json
{
  "name": "Weekly Tech Roundup",
  "description": "Post weekly summary every Monday",
  "schedule": "weekly",
  "schedule_day": "monday",
  "schedule_time": "10:00",
  "command": "node",
  "args": [
    "C:\\Users\\manoh\\personaliz-desktop\\linkedin_bot.js",
    "📅 Week in Review:\n\n✅ Shipped new automation features\n✅ Improved AI agent orchestration\n✅ Enhanced Tauri desktop integration\n\nExcited for what's coming next! #WeeklyReview #BuildInPublic"
  ],
  "timeout": 600000
}
```

---

## How OpenClaw Uses This

1. **File Location**: Agents are stored in `.agents/` folder
2. **Loading**: OpenClaw scans `.agents/*.json` on startup
3. **Scheduling**: Uses `schedule` + `schedule_time` for cron jobs
4. **Execution**: Runs `command` with `args` in `working_directory`
5. **Monitoring**: Tracks success/failure, respects `timeout`

---

## Integration with Tauri App

### When user approves AI-generated post:

```typescript
const agentConfig = {
  name: "LinkedIn AI Post",
  description: "User-approved AI post",
  schedule: "daily",
  schedule_time: "09:00",
  command: "node",
  args: [
    "C:\\Users\\manoh\\personaliz-desktop\\linkedin_bot.js",
    aiGeneratedPostText // Dynamic from AI
  ],
  working_directory: "C:\\Users\\manoh\\personaliz-desktop",
  timeout: 300000
};

// Write to OpenClaw
await invoke("create_agent_file", {
  content: JSON.stringify(agentConfig, null, 2)
});
```

---

## Important Notes

### ⚠️ Manual Approval Required

The LinkedIn bot **does not auto-post**. It:
1. Opens browser (headless: false)
2. Waits for manual login (15 min timeout)
3. Types the post content
4. **Waits for user to click "Post" button**

This is intentional for safety!

### 🔧 Customization

Modify `args` array to pass different content:

```json
"args": [
  "linkedin_bot.js",
  "Your custom post text with emojis 🚀 #hashtags"
]
```

### 📂 File Paths

Use **absolute paths** on Windows:
- ✅ `C:\\Users\\manoh\\path\\script.js`
- ❌ `./relative/path.js`

Double backslashes in JSON!

---

## Testing

Test your agent manually first:

```powershell
node linkedin_bot.js "Test post content"
```

Then deploy to OpenClaw:
1. Save JSON to `.agents/linkedin_agent.json`
2. Restart OpenClaw
3. Check logs for scheduling confirmation
