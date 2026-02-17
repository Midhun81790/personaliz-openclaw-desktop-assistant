# LinkedIn Automation Architecture

## System Overview

This is a multi-layered automation system that combines AI content generation, user approval workflows, task scheduling, and browser automation.

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER INTERACTION LAYER                       │
│                    (Tauri React Frontend)                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AI CONTENT GENERATION                         │
│              (Ollama Phi3 via HTTP API)                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    APPROVAL WORKFLOW                             │
│              (Preview → User Approves)                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AGENT PERSISTENCE                             │
│            (Tauri Backend → JSON Files)                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TASK SCHEDULER                                │
│                 (OpenClaw Agent System)                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BROWSER AUTOMATION                            │
│              (Node.js + Playwright)                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. **Tauri React Frontend** (`src/App.tsx`)
**Technology:** React + TypeScript  
**Purpose:** User interface and orchestration

**Key Responsibilities:**
- Chat interface for natural language commands
- Display AI-generated content previews
- Manage approval workflows
- Show logs and status updates
- Invoke Tauri backend commands

**State Management:**
```typescript
const [pendingLinkedInPost, setPendingLinkedInPost] = useState<string|null>(null);
const [messages, setMessages] = useState<string[]>([]);
const [logs, setLogs] = useState<string[]>([]);
```

---

### 2. **Ollama AI Engine** (External Service)
**Technology:** Ollama with Phi3 model  
**Endpoint:** `http://localhost:11434/api/generate`  
**Purpose:** Generate professional LinkedIn content

**Request Format:**
```json
{
  "model": "phi3",
  "prompt": "Generate a professional LinkedIn post about AI trends...",
  "stream": false
}
```

**Response:**
```json
{
  "response": "🚀 The future of AI is here! Key trends to watch..."
}
```

---

### 3. **Tauri Rust Backend** (`src-tauri/src/main.rs`)
**Technology:** Rust + Tauri  
**Purpose:** System integration and file operations

**Commands:**

#### `run_command(cmd: String) -> Result<String, String>`
- Executes Windows shell commands
- Returns stdout or detailed errors
- Used for: OpenClaw restart, script execution

#### `create_agent_file(name: String, content: String) -> Result<String, String>`
- Creates `.agents` directory if missing
- Writes JSON agent configuration
- Returns file path on success
- Sanitizes filename from agent name

---

### 4. **OpenClaw Agent System** (External Service)
**Technology:** Node.js task scheduler  
**Purpose:** Schedule and execute recurring tasks

**Agent Configuration Structure:**
```json
{
  "name": "LinkedIn AI Poster",
  "schedule": "daily",
  "schedule_time": "09:00",
  "command": "node",
  "args": [
    "C:\\Users\\manoh\\personaliz-desktop\\linkedin_bot.js",
    "AI generated post content here..."
  ],
  "working_directory": "C:\\Users\\manoh\\personaliz-desktop",
  "timeout": 300000
}
```

**Behavior:**
- Scans `.agents/*.json` on startup
- Creates cron jobs based on schedule
- Executes command with args at specified time
- Monitors execution and respects timeout

---

### 5. **Playwright Browser Automation** (`linkedin_bot.js`)
**Technology:** Node.js + Playwright  
**Purpose:** Automate LinkedIn posting workflow

**Flow:**
1. Launch Chromium (visible mode)
2. Navigate to LinkedIn login
3. Wait for manual login (15 min timeout)
4. Navigate to feed
5. Click "Start a post"
6. Type content from command line args
7. Wait for manual "Post" button click (10 min)

**Safety Features:**
- Never auto-submits posts
- Always requires manual login
- User must manually click "Post"
- Visible browser for transparency

---

## Complete User Flow

### Step-by-Step Execution

```
USER: "Create LinkedIn agent about AI trends"
  │
  ├─▶ [1] React detects "linkedin" keyword
  │
  ├─▶ [2] Fetch request to Ollama API
  │      POST http://localhost:11434/api/generate
  │      Payload: { model: "phi3", prompt: "...about AI trends" }
  │
  ├─▶ [3] Ollama generates professional post
  │      Returns: "🚀 AI Trends 2026: Key insights on..."
  │
  ├─▶ [4] React stores in pendingLinkedInPost state
  │      Shows preview to user
  │      Asks: "Approve to post? (yes/no)"
  │
  ├─▶ USER: "yes"
  │
  ├─▶ [5] React creates agent config JSON
  │      {
  │        name: "LinkedIn AI Poster",
  │        schedule: "daily",
  │        args: ["linkedin_bot.js", "AI generated text"]
  │      }
  │
  ├─▶ [6] invoke("create_agent_file")
  │      Rust writes: .agents/linkedin_ai_poster.json
  │
  ├─▶ [7] invoke("run_command") - Kill OpenClaw
  │      taskkill /F /IM node.exe /FI "WINDOWTITLE eq OpenClaw*"
  │
  ├─▶ [8] Wait 1 second
  │
  ├─▶ [9] invoke("run_command") - Start OpenClaw
  │      cd C:\Users\manoh\openclaw && start /B npm start
  │
  ├─▶ [10] OpenClaw loads new agent
  │      Schedules: Run daily at 09:00
  │
  ├─▶ [11] React asks: "Test it now? (yes/no)"
  │
  ├─▶ USER: "yes"
  │
  ├─▶ [12] invoke("run_command") - Run Playwright immediately
  │      node linkedin_bot.js "AI generated text"
  │
  ├─▶ [13] Playwright opens browser
  │      • Navigates to LinkedIn login
  │      • Waits for manual login
  │      • Navigates to feed
  │      • Clicks "Start a post"
  │      • Types AI-generated content
  │      • Waits for manual "Post" click
  │
  └─▶ [14] User manually reviews and posts
         (or closes browser to cancel)
```

---

## Data Flow Diagram

```
┌──────────────┐
│   User Input │  "Create LinkedIn agent about AI trends"
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│  Natural Language    │  Extract intent: "linkedin agent"
│  Processing (React)  │  Extract topic: "AI trends"
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│   Ollama Phi3 LLM    │  Generate professional content
│  (Local AI Model)    │  with emojis, hashtags, structure
└──────┬───────────────┘
       │
       │  Generated Text
       ▼
┌──────────────────────┐
│  Approval Interface  │  Show preview
│      (React UI)      │  Wait for "yes" or "no"
└──────┬───────────────┘
       │
       │  User: "yes"
       ▼
┌──────────────────────┐
│   Agent Config Gen   │  Build JSON:
│      (React)         │  { name, schedule, args: [script, text] }
└──────┬───────────────┘
       │
       │  JSON Payload
       ▼
┌──────────────────────┐
│  Tauri Backend       │  invoke("create_agent_file")
│  (Rust)              │  Write to: .agents/linkedin_ai_poster.json
└──────┬───────────────┘
       │
       │  Success Response
       ▼
┌──────────────────────┐
│  OpenClaw Restart    │  Kill process → Start process
│  (Tauri Command)     │  Load new agent configs
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  OpenClaw Scheduler  │  Create cron job: daily @ 09:00
│  (External Process)  │  Store command: node linkedin_bot.js "..."
└──────┬───────────────┘
       │
       │  (At scheduled time OR immediate test)
       ▼
┌──────────────────────┐
│  Playwright Script   │  1. Launch browser
│  (Node.js Process)   │  2. Wait for login
│                      │  3. Navigate to feed
│                      │  4. Click "Start post"
│                      │  5. Type content
│                      │  6. Wait for manual click
└──────────────────────┘
```

---

## Security & Safety Features

### 🔒 **Multi-Layer Approval System**

1. **AI Generation Review**
   - User sees AI-generated content BEFORE agent creation
   - Must explicitly approve with "yes"

2. **Manual Login Requirement**
   - Script NEVER stores credentials
   - User must log in each session
   - 15-minute timeout for login

3. **Manual Posting Requirement**
   - Script types content but DOESN'T click "Post"
   - User has 10 minutes to review and manually post
   - Can close browser to cancel

4. **Visible Browser**
   - `headless: false` - user sees all actions
   - Transparency over automation

### 🛡️ **Error Handling**

- **Rust Backend:** Returns `Result<String, String>` with descriptive errors
- **React Frontend:** Try-catch blocks with user-friendly messages
- **Playwright:** Graceful timeout handling and error logs
- **OpenClaw:** Timeout limits prevent runaway processes

---

## Implementation Checklist

### ✅ **Already Implemented**

- [x] React chat interface
- [x] Ollama API integration
- [x] AI content generation
- [x] Approval workflow UI
- [x] Tauri backend commands
- [x] Agent file creation
- [x] OpenClaw integration
- [x] Playwright automation script
- [x] Command line argument support
- [x] Error handling in Rust
- [x] Error handling in React
- [x] Logging system
- [x] Automatic OpenClaw restart

### 🔄 **Current State**

All components are **fully functional** and integrated!

---

## Testing the Complete Flow

### Prerequisites
```powershell
# 1. Ollama is running with Phi3
ollama run phi3

# 2. OpenClaw is installed
cd C:\Users\manoh\openclaw

# 3. Playwright browsers installed
npx playwright install chromium
```

### Test Steps

1. **Start Tauri App:**
   ```powershell
   npm run tauri dev
   ```

2. **In Chat UI, Type:**
   ```
   Create LinkedIn agent about AI trends
   ```

3. **Review AI-Generated Post:**
   - See preview in chat
   - Contains emojis, hashtags, professional tone

4. **Approve:**
   ```
   yes
   ```

5. **Observe Logs:**
   ```
   Step 1: Creating agent configuration
   Step 2: Agent file created successfully
   Step 3: Restarting OpenClaw
   ✅ Setup complete!
   Would you like to test it now? (yes/no)
   ```

6. **Test Immediately:**
   ```
   yes
   ```

7. **Browser Opens:**
   - LinkedIn login page appears
   - Log in manually
   - Script navigates to feed
   - Clicks "Start a post"
   - Types AI-generated content
   - Waits for your manual "Post" click

8. **Review and Post:**
   - Check content in browser
   - Click "Post" when satisfied
   - Or close browser to cancel

---

## File Structure

```
personaliz-desktop/
│
├── src/
│   ├── App.tsx                    # React UI + orchestration
│   ├── main.tsx                   # React entry point
│   └── App.css                    # Styling
│
├── src-tauri/
│   └── src/
│       └── main.rs                # Rust backend (file ops, commands)
│
├── linkedin_bot.js                # Playwright automation
├── linkedin_agent_example.json    # Sample agent config
├── AGENT_CONFIG_GUIDE.md          # Agent documentation
├── ARCHITECTURE.md                # This file
│
└── package.json                   # Dependencies (Playwright, etc)
```

### External Dependencies

```
C:\Users\manoh\openclaw\
└── .agents/                       # OpenClaw agent configs
    ├── linkedin_ai_poster.json    # Created by Tauri app
    └── *.json                     # Other agents
```

---

## Key Technologies

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Desktop UI | Tauri + React | User interface |
| Backend | Rust | System integration |
| AI Engine | Ollama (Phi3) | Content generation |
| Scheduler | OpenClaw (Node.js) | Task scheduling |
| Automation | Playwright | Browser control |
| Language | TypeScript/JavaScript | Frontend logic |
| Build | Vite | React bundling |

---

## Extending the System

### Add New Automation Types

1. **Create new script** (e.g., `twitter_bot.js`)
2. **Add React handler** for keyword detection
3. **Generate agent config** with new command
4. **Reuse approval workflow**

### Add New AI Models

```typescript
// In App.tsx, change model:
body: JSON.stringify({
  model: "llama2",  // or "codellama", "mistral"
  prompt: "...",
  stream: false
})
```

### Add Scheduled Variations

```json
{
  "schedule": "weekly",
  "schedule_day": "monday",
  "schedule_time": "10:00"
}
```

---

## Troubleshooting

### Ollama Not Responding
```powershell
# Check if running
ollama list

# Start if needed
ollama run phi3
```

### OpenClaw Not Loading Agents
```powershell
# Check .agents folder exists
dir C:\Users\manoh\openclaw\.agents

# Restart OpenClaw manually
cd C:\Users\manoh\openclaw
npm start
```

### Playwright Browser Not Opening
```powershell
# Reinstall browsers
npx playwright install chromium

# Test manually
node linkedin_bot.js "Test post"
```

### Tauri Command Errors
- Check Rust console for detailed errors
- Verify file paths are absolute with double backslashes
- Ensure `.agents` directory has write permissions

---

## Summary

This architecture combines:
- **AI-powered content generation** (no manual writing)
- **Human-in-the-loop approval** (safety & control)
- **Automated scheduling** (hands-free execution)
- **Transparent automation** (visible browser actions)

The result is a **safe, powerful, and extensible** automation system that respects user control while eliminating repetitive work! 🚀
