# Personaliz Desktop - Usage Guide

## Quick Start

### Launch the Application
```bash
npm run tauri dev
```

The floating AI assistant appears in the bottom-right corner.

---

## Core Features

### 1. **Create LinkedIn Agent (Recommended Flow)**

This is the primary feature - creates an automated LinkedIn posting agent with AI-generated content.

**Command:**
```
create linkedin agent about [topic]
```

**Examples:**
```
create linkedin agent about AI trends
create linkedin agent about productivity tips
create linkedin agent about software engineering
```

**What Happens:**
1. ✅ Ollama (phi3) generates professional LinkedIn post content
2. ✅ Agent configuration is created with scheduling
3. ✅ Preview shows post content and settings
4. ✅ You approve (yes/no)
5. ✅ Agent file saved to `C:\Users\manoh\openclaw\.agents`
6. ✅ OpenClaw restarts to load new agent
7. ✅ Optional: Test immediately

**Structured Logs:**
- `[LINKEDIN]` - LinkedIn flow steps
- `[LLM]` - AI content generation
- `[AGENT]` - Agent configuration
- `[APPROVAL]` - User approval status
- `[OPENCLAW]` - OpenClaw integration
- `[AUTOMATION]` - Playwright execution

---

### 2. **Sandbox Mode (Safety Feature)**

Test automation workflows without actually executing Playwright scripts.

**Enable:**
```
sandbox on
```
or
```
enable sandbox
```

**Disable:**
```
sandbox off
```
or
```
disable sandbox
```

**When Enabled:**
- ✅ All automation steps are simulated
- ✅ Logs show what *would* happen
- ✅ No browser opens
- ✅ No real LinkedIn interaction
- ✅ UI shows 🔒 SANDBOX indicator

**Use Cases:**
- Testing agent configurations safely
- Debugging workflow without side effects
- Demonstrating system capabilities
- Validating content generation

---

### 3. **LinkedIn Post (One-Time)**

Generate and post content once, without creating a scheduled agent.

**Command:**
```
create linkedin post about [topic]
```

or

```
post to linkedin about [topic]
```

**What Happens:**
1. ✅ AI generates post content
2. ✅ Preview shown
3. ✅ Approve (yes/no)
4. ✅ Browser opens with content filled in
5. ✅ You manually review and click "Post"

---

### 4. **Generic Agent Creation**

Create custom OpenClaw agents for any task.

**Command:**
```
create agent that [description]
```

**Examples:**
```
create agent that monitors GitHub issues daily
create agent that sends morning reminders
```

**What Happens:**
1. ✅ AI generates agent JSON config
2. ✅ Preview shown
3. ✅ Approve (yes/no)
4. ✅ Agent saved and loaded by OpenClaw

---

### 5. **OpenClaw Setup**

Initialize OpenClaw task scheduler.

**Command:**
```
setup openclaw
```

**What Happens:**
- ✅ Checks if OpenClaw exists at `C:\Users\manoh\openclaw`
- ✅ Starts OpenClaw in background
- ✅ Shows status logs

---

## UI Elements

### Main Interface

```
┌─────────────────────────────────────┐
│ Personaliz Assistant 🔒 SANDBOX    │  ← Sandbox indicator
├─────────────────────────────────────┤
│ Chat Messages                       │
│ User: create linkedin agent...      │
│ Assistant: Generating content...    │
│                                     │
├─────────────────────────────────────┤
│ Logs                               │
│ [LINKEDIN] Starting flow...        │  ← Structured logs
│ [LLM] Sending request...           │
│ [AGENT] Config created...          │
│                                     │
├─────────────────────────────────────┤
│ [Input Field]          [Send]      │
└─────────────────────────────────────┘
```

### Floating Button
- Click to toggle chat window
- Always visible in bottom-right corner

---

## Approval Workflows

### LinkedIn Agent Approval

After requesting "create linkedin agent about X":

```
Assistant: LinkedIn Agent Preview:
──────────────────────────────────────────────────
📝 Post Content:
[AI-generated professional post with emojis and hashtags]

⚙️ Agent Configuration:
• Schedule: daily @ 09:00
• Command: node
• Sandbox: ON (simulation only)
──────────────────────────────────────────────────
Assistant: Approve and deploy? (yes/no)
```

**Type "yes":**
- Agent file created
- OpenClaw restarted (unless sandbox mode)
- Prompted for immediate test

**Type "no":**
- Cancelled, nothing saved

### Immediate Test Approval

After agent deployment:

```
Assistant: ✅ LinkedIn agent deployed successfully!
Assistant: Agent scheduled for daily execution @ 09:00
Assistant: Would you like to test it now? (yes/no)
```

**Type "yes" (sandbox OFF):**
- Opens browser
- Navigates to LinkedIn
- Waits for manual login
- Fills post content with blue highlight
- Waits for you to click "Post"

**Type "yes" (sandbox ON):**
- Shows simulation steps
- No browser opens
- Safe testing

---

## Error Handling

All errors include:
1. ❌ User-friendly message in chat
2. 📋 Detailed error in console logs
3. 💡 Troubleshooting tips

### Common Errors

**Ollama Not Running:**
```
❌ LinkedIn Agent Generation failed: fetch failed

💡 Troubleshooting tips:
   • Make sure Ollama is running: ollama serve
   • Verify phi3 model is installed: ollama pull phi3
   • Check LLM endpoint: http://localhost:11434/api/generate
```

**Playwright Not Installed:**
```
❌ LinkedIn Bot Test failed: ...

💡 Troubleshooting:
   • Make sure Playwright is installed: npx playwright install chromium
   • Verify linkedin_bot.js exists in project folder
```

**OpenClaw Not Found:**
```
❌ OpenClaw not found at C:\Users\manoh\openclaw
Please install OpenClaw first or update the path in App.tsx
```

---

## Configuration

### Paths (in App.tsx)

```typescript
const OPENCLAW_PATH = "C:\\Users\\manoh\\openclaw";
const PROJECT_PATH = "C:\\Users\\manoh\\personaliz-desktop";
const LLM_ENDPOINT = "http://localhost:11434/api/generate";
const LLM_MODEL = "phi3";
```

**To Modify:**
1. Open `src/App.tsx`
2. Update constants at top of App component
3. Save and restart app

---

## Log Prefixes Reference

| Prefix | Meaning |
|--------|---------|
| `[SYSTEM]` | Application state changes |
| `[LINKEDIN]` | LinkedIn automation workflow |
| `[LLM]` | AI model interactions |
| `[AGENT]` | Agent config operations |
| `[APPROVAL]` | User approval actions |
| `[OPENCLAW]` | OpenClaw integration |
| `[AUTOMATION]` | Playwright script execution |
| `[ERROR]` | Error conditions |

---

## Best Practices

### 1. **Always Start with Sandbox Mode**
```
sandbox on
create linkedin agent about [topic]
```
- Review what *would* happen
- Validate content quality
- Then disable sandbox for real execution

### 2. **Review Generated Content**
- AI content is a starting point
- Always preview before approving
- Edit directly in browser if needed

### 3. **Manual Safety Checkpoints**
- Script never auto-clicks "Post"
- You review highlighted content
- You click "Post" when ready
- Close browser to cancel

### 4. **Monitor Logs**
- Watch structured logs during execution
- Identify issues quickly with prefixes
- Console has detailed errors

### 5. **Test Incrementally**
- Setup OpenClaw first
- Test sandbox mode
- Try one-time post
- Then create scheduled agents

---

## Example Workflows

### Workflow 1: First-Time Setup

```bash
# 1. Start app
npm run tauri dev

# 2. Enable sandbox for safety
sandbox on

# 3. Setup OpenClaw
setup openclaw

# 4. Test LinkedIn agent creation (simulated)
create linkedin agent about AI automation

# 5. Review preview, approve
yes

# 6. Test simulation
yes

# 7. Disable sandbox for real execution
sandbox off
```

### Workflow 2: Daily Content Posting

```bash
# 1. Start app
npm run tauri dev

# 2. Create agent (real execution)
create linkedin agent about today's tech news

# 3. Review and approve
yes

# 4. Test immediately
yes

# 5. Log in manually
# 6. Review highlighted post
# 7. Click "Post" button
```

### Workflow 3: Safe Testing

```bash
# Always in sandbox mode for development
sandbox on

# Create multiple agents
create linkedin agent about productivity
create linkedin agent about software tips
create linkedin agent about career growth

# Review configurations without side effects
```

---

## Troubleshooting

### Browser Doesn't Open

**Check:**
1. Is sandbox mode enabled? (`sandbox off` to disable)
2. Is Playwright installed? (`npx playwright install chromium`)
3. Check logs for `[AUTOMATION]` errors

### No AI Response

**Check:**
1. Is Ollama running? (`ollama serve` in terminal)
2. Is phi3 installed? (`ollama pull phi3`)
3. Check LLM endpoint in configuration

### OpenClaw Won't Start

**Check:**
1. Does directory exist? (`C:\Users\manoh\openclaw`)
2. Is npm installed? (`npm --version`)
3. Check OpenClaw logs in new terminal window

### Post Content Not Appearing

**Check:**
1. Did you wait for login detection (up to 15 min)?
2. Are you on LinkedIn feed page?
3. Check browser console for errors

---

## Advanced Usage

### Custom Agent Configs

Manually edit JSON files in `C:\Users\manoh\openclaw\.agents`:

```json
{
  "name": "Custom LinkedIn Agent",
  "schedule": "hourly",
  "schedule_time": "*",
  "command": "node",
  "args": [
    "C:\\Users\\manoh\\personaliz-desktop\\linkedin_bot.js",
    "Your custom post content here"
  ],
  "timeout": 300000
}
```

### Multiple Agents

Create multiple agents for different times:

```
create linkedin agent about morning motivation
create linkedin agent about afternoon tips  
create linkedin agent about evening reflection
```

Edit schedule times in `.agents` folder.

---

## Security & Privacy

### What Gets Stored

- ✅ Agent configurations (`.agents` folder)
- ✅ Generated post content (in metadata)
- ✅ Application logs (in memory only)

### What Doesn't Get Stored

- ❌ LinkedIn credentials
- ❌ Browser session data
- ❌ Personal information

### Sandbox Mode Benefits

- No network requests to LinkedIn
- No browser automation executed
- Safe for testing with sensitive data

---

## Support

### Get Help

1. Check logs in UI
2. Open browser console (F12)
3. Review structured log prefixes
4. Check error messages for troubleshooting tips

### Report Issues

Include:
- Command you ran
- Error message
- Logs from `[ERROR]` prefix
- Sandbox mode status

---

## Quick Reference Card

```
COMMANDS
├─ sandbox on/off           → Toggle safe testing mode
├─ setup openclaw           → Initialize task scheduler
├─ create linkedin agent    → Create scheduled AI post agent
├─ create linkedin post     → One-time post generation
└─ create agent that...     → Custom agent creation

APPROVALS
├─ yes                      → Approve and proceed
└─ no                       → Cancel operation

WORKFLOW
1. sandbox on               → Enable safe mode
2. create linkedin agent... → Generate content
3. yes                      → Approve preview
4. yes                      → Test immediately
5. sandbox off              → Switch to real mode
```

---

Made with ❤️ by Personaliz Desktop Team
