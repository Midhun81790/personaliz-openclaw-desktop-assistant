# Personaliz Desktop - Quick Reference

## Commands

| Command | Purpose |
|---------|---------|
| `sandbox on` | Enable safe testing mode |
| `sandbox off` | Disable safe testing mode |
| `setup openclaw` | Initialize task scheduler |
| `create linkedin agent about [topic]` | Create automated posting agent |
| `create linkedin post about [topic]` | One-time post generation |
| `create agent that [description]` | Custom agent creation |
| `yes` | Approve current operation |
| `no` | Cancel current operation |

## Workflow

```
┌─────────────────────────────────────┐
│ 1. Enable Sandbox                  │
│    > sandbox on                    │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 2. Create LinkedIn Agent           │
│    > create linkedin agent about   │
│      [your topic]                  │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 3. Review Generated Content        │
│    - Post text                     │
│    - Agent configuration           │
│    - Schedule details              │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 4. Approve                         │
│    > yes                           │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 5. Test (Simulated)                │
│    > yes                           │
│    - View simulation steps         │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 6. Switch to Real Mode             │
│    > sandbox off                   │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 7. Run for Real                    │
│    > create linkedin agent...      │
│    > yes                           │
│    > yes                           │
│    - Browser opens                 │
│    - Manual login                  │
│    - Review & post                 │
└─────────────────────────────────────┘
```

## Log Prefixes

| Prefix | Meaning |
|--------|---------|
| `[SYSTEM]` | App state changes |
| `[LINKEDIN]` | LinkedIn workflow |
| `[LLM]` | AI model calls |
| `[AGENT]` | Agent operations |
| `[APPROVAL]` | User approvals |
| `[OPENCLAW]` | Task scheduler |
| `[AUTOMATION]` | Browser automation |
| `[ERROR]` | Error conditions |

## UI Indicators

| Indicator | Meaning |
|-----------|---------|
| 🔒 SANDBOX | Sandbox mode active |
| ✅ | Success/Completed |
| ❌ | Error occurred |
| 💡 | Troubleshooting tip |
| 📝 | Post content |
| ⚙️ | Configuration |
| ─────── | Section divider |

## File Locations

```
personaliz-desktop/
├── linkedin_bot.js          ← Browser automation script
├── src/App.tsx              ← Main React component
├── src-tauri/src/main.rs    ← Rust backend
└── docs/
    ├── README.md
    ├── USAGE_GUIDE.md
    ├── ARCHITECTURE.md
    └── AGENT_CONFIG_GUIDE.md

C:\Users\manoh\openclaw\
└── .agents/                 ← Agent configuration files
```

## Troubleshooting

### Error: LLM Not Responding
```bash
# Check Ollama service
ollama serve

# Verify model installed
ollama pull phi3

# Test manually
ollama run phi3 "Hello"
```

### Error: Browser Won't Open
```bash
# Install Playwright browsers
npx playwright install chromium

# Check sandbox mode
# Type in app: sandbox off
```

### Error: OpenClaw Not Found
1. Install OpenClaw at: `C:\Users\manoh\openclaw`
2. Or update path in App.tsx
3. Run: `setup openclaw`

## Quick Test

```bash
# Terminal 1: Start Ollama
ollama serve

# Terminal 2: Start App
cd C:\Users\manoh\personaliz-desktop
npm run tauri dev

# In App:
> sandbox on
> create linkedin agent about productivity
> yes
> yes
# Observe simulation

> sandbox off
# Ready for real execution
```

## Configuration

Edit `src/App.tsx`:

```typescript
const OPENCLAW_PATH = "C:\\Users\\manoh\\openclaw";
const PROJECT_PATH = "C:\\Users\\manoh\\personaliz-desktop";
const LLM_ENDPOINT = "http://localhost:11434/api/generate";
const LLM_MODEL = "phi3";
```

## Safety Features

✅ Sandbox mode for testing  
✅ Manual login required  
✅ Content review before posting  
✅ No auto-click on "Post" button  
✅ User approval at multiple stages  
✅ Visible content highlighting  
✅ Cancel by closing browser

## Advanced

### Custom Schedule
Edit agent JSON in `.agents` folder:

```json
{
  "schedule": "hourly",    // or "daily"
  "schedule_time": "*"     // or "09:00"
}
```

### Multiple Agents
Create agents with different schedules and topics. Each runs independently via OpenClaw.

---

For detailed documentation, see USAGE_GUIDE.md
