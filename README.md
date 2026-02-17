# Personaliz Desktop Assistant

> An AI-powered desktop assistant that combines local LLM intelligence with browser automation to streamline your LinkedIn workflow.

![Tauri](https://img.shields.io/badge/Tauri-2.0-blue)
![React](https://img.shields.io/badge/React-19.1-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)
![Playwright](https://img.shields.io/badge/Playwright-1.58-45ba4b)

---

## 🚀 Overview

Personaliz is a **desktop automation assistant** that helps you create, schedule, and post LinkedIn content using AI-generated text and safe browser automation. It combines the power of local AI models with intelligent task scheduling and transparent browser automation.

### Key Features

✅ **Multi-Provider LLM Support** - Use local Phi3, OpenAI GPT-4, or Claude  
✅ **Flexible API Integration** - Start with local LLM, upgrade to cloud when needed  
✅ **AI Content Generation** - Generate professional LinkedIn posts with AI  
✅ **Auto-Commenting Bot** - Automated hashtag monitoring and engagement  
✅ **SQLite Database** - Structured agent/log storage with full CRUD operations  
✅ **Event Polling System** - Background event handlers (polling/web/periodic)  
✅ **Role/Goal/Tools Config** - Enhanced agent metadata with semantic fields  
✅ **Trending Topics Scraper** - Data-driven content from LinkedIn hashtag analysis  
✅ **Approval Workflows** - Human-in-the-loop for all critical actions  
✅ **Task Scheduling** - Automated daily/hourly posting via OpenClaw agents  
✅ **Browser Automation** - Safe Playwright scripts with visual feedback  
✅ **Desktop UI** - Clean React interface with database panels  
✅ **Dependency Detection** - Automatic system compatibility checking  
✅ **Privacy First** - Local AI processing by default, cloud optional  

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    TAURI DESKTOP APP                         │
│                  (React + TypeScript UI)                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ├─► Local LLM (Ollama + Phi3)
                       │   • Generate LinkedIn posts
                       │   • Create agent configurations
                       │   • 100% offline AI processing
                       │
                       ├─► Tauri Backend (Rust)
                       │   • File system operations
                       │   • Process management
                       │   • Command execution
                       │
                       ├─► OpenClaw (Task Scheduler)
                       │   • Load agent configs from .agents/
                       │   • Schedule daily/hourly tasks
                       │   • Execute Node.js scripts
                       │
                       └─► Playwright Scripts (Browser Automation)
                           • linkedin_bot.js - Post automation
                           • linkedin_hashtag_monitor.js - Monitoring
                           • Visible browser (transparency)
                           • Manual approval required
```

### Data Flow

```
User Input → Local LLM → AI Content → Approval UI → Agent Config
    ↓
OpenClaw Loads Agent → Scheduled Execution → Playwright Script
    ↓
Browser Opens → Manual Login → Content Filled → Manual Post Click
```

---

## 🛠️ Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Desktop Framework** | Tauri 2.0 | Cross-platform desktop app |
| **Frontend** | React 19 + TypeScript | User interface |
| **Backend** | Rust | System integration |
| **AI Engine** | Ollama (Phi3 model) | Local LLM for content generation |
| **Task Scheduler** | OpenClaw | Agent orchestration |
| **Browser Automation** | Playwright | LinkedIn automation |
| **Build Tool** | Vite | Fast development & bundling |

---

## 📦 Prerequisites

Before you begin, ensure you have installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Rust** (latest stable) - [Install](https://www.rust-lang.org/tools/install)
- **Ollama** - [Download](https://ollama.ai/)
- **Git** - [Download](https://git-scm.com/)

---

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/personaliz-desktop.git
cd personaliz-desktop
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Playwright browsers
npx playwright install chromium
```

### 3. Install and Configure Ollama

```bash
# Install Ollama (if not already installed)
# Visit: https://ollama.ai/download

# Pull the Phi3 model
ollama pull phi3

# Verify it's running
ollama run phi3
# Type a test message, then exit with /bye
```

### 4. Install OpenClaw (Optional)

If you want scheduled agent execution:

```bash
# Navigate to parent directory
cd ..

# Clone OpenClaw
git clone https://github.com/openclaw/openclaw.git
cd openclaw

# Install dependencies
npm install

# Create .agents directory
mkdir .agents

# Return to project
cd ../personaliz-desktop
```

### 5. Configure Paths

Update paths in `src/App.tsx` if your OpenClaw is in a different location:

```typescript
// Line ~30 - Update to your OpenClaw path
cmd: "cd C:\\Users\\YOUR_USERNAME\\openclaw && start /B npm start"
```

### 6. Run the Application

```bash
# Development mode
npm run tauri dev

# Build for production
npm run tauri build
```

---

## 🎯 Usage & Demo Scenarios

### Scenario 1: Generate LinkedIn Post

1. Open the app
2. Type in chat: `create linkedin agent about AI trends`
3. Wait for AI to generate post content (~5-10 seconds)
4. Review the preview
5. Type: `yes` to approve
6. Agent is created and OpenClaw is restarted
7. Type: `yes` again to test immediately
8. Browser opens → Log in manually → Review post → Click "Post"

### Scenario 2: Manual LinkedIn Post (No Scheduling)

```bash
# Run directly from terminal
node linkedin_bot.js "Your custom post content here"
```

1. Browser opens
2. Log in to LinkedIn manually
3. Script fills post editor with your content
4. Editor is highlighted in blue
5. Review and click "Post" manually

### Scenario 3: Monitor LinkedIn Hashtag

```bash
# Monitor a specific hashtag
node linkedin_hashtag_monitor.js "#javascript"
```

1. Browser opens
2. Log in manually
3. Script navigates to hashtag feed
4. Scrolls and counts posts
5. Keeps browser open for manual review

### Scenario 4: Scrape Trending Topics

```bash
# Discover trending LinkedIn hashtags
node linkedin_trending_scraper.js
```

1. Browser opens (visible mode)
2. Log in manually within 15 minutes
3. Script scrapes hashtags from feed
4. Counts hashtag frequency
5. Extracts popular keywords
6. Saves results to `trending_topics.json`

**Output Example:**
```json
{
  "trending_hashtags": [
    { "tag": "#AI", "count": 15 },
    { "tag": "#MachineLearning", "count": 12 }
  ],
  "popular_topics": ["artificial", "intelligence", "automation"],
  "post_samples": ["Excited to announce...", "5 trends shaping..."],
  "scraped_at": "2026-02-17T10:30:00.000Z"
}
```

### Scenario 5: View Agent Database

**In app chat:**
```
> view agents

📋 Agent Database
1. LinkedIn AI Poster
   Role: Content Creator
   Goal: Post engaging LinkedIn content to grow professional network
   Tools: playwright, linkedin, llm
   Schedule: daily at 09:00
   Status: ✓ ACTIVE

> view events

⚡ Event Handlers
1. LinkedIn monitoring
   Type: periodic
   Interval: Every 300 seconds
   Last checked: 2 minutes ago
   Status: ✓ POLLING
```

### Scenario 6: Setup OpenClaw

1. In app chat, type: `setup openclaw`
2. App checks if OpenClaw exists
3. Starts OpenClaw in background
4. Ready to schedule agents!

---

## 🤖 Agent Workflow

### Creating an Agent

```
User: "create linkedin agent"
  ↓
LLM generates professional content
  ↓
Shows preview (content + config JSON)
  ↓
User approves ("yes")
  ↓
Agent file saved to OpenClaw/.agents/
  ↓
OpenClaw restarts and loads agent
  ↓
Agent scheduled (daily @ 9 AM)
```

### Agent Execution

```
Scheduled time arrives (e.g., 9:00 AM)
  ↓
OpenClaw runs: node linkedin_bot.js "content"
  ↓
Playwright opens browser
  ↓
Waits for manual login (15 min timeout)
  ↓
Navigates to feed
  ↓
Clicks "Start a post"
  ↓
Fills content & highlights editor
  ↓
Waits for manual "Post" click (10 min)
```

### Example Agent Configuration

```json
{
  "name": "LinkedIn AI Poster",
  "schedule": "daily",
  "schedule_time": "09:00",
  "command": "node",
  "args": [
    "C:\\path\\to\\linkedin_bot.js",
    "AI-generated post content here"
  ],
  "timeout": 300000
}
```

---

## 🧠 LLM Configuration

### Multi-Provider Support

Personaliz supports **three LLM providers** out of the box:

| Provider | API Key Required | Internet | Cost | Quality |
|----------|-----------------|----------|------|---------|
| **Local (Phi3)** | ❌ No | ❌ No | Free | Good |
| **OpenAI** | ✅ Yes | ✅ Yes | Paid | Excellent |
| **Claude** | ✅ Yes | ✅ Yes | Paid | Excellent |

### Quick Start

**Default (No Setup):**
```bash
# Works out of the box
ollama serve
ollama pull phi3
npm run tauri dev
```

**Upgrade to Cloud API:**
1. Click ⚙️ Settings in app
2. Select provider (OpenAI or Claude)
3. Enter API key
4. Choose model
5. Click Save

**Settings Panel:**
- **LLM Provider:** Local / OpenAI / Claude
- **API Key:** Your cloud API key (password protected)
- **Model:** phi3 / gpt-4 / claude-3-opus-20240229
- **Endpoint:** http://localhost:11434/api/generate (local only)

### How It Works

The app automatically routes LLM requests based on your settings:

```
User Input
    ↓
callLLM() Router
    ↓
┌───────┼───────┐
│       │       │
Local  OpenAI Claude
(Phi3) (GPT-4) (Opus)
│       │       │
└───────┴───────┘
    ↓
Response
```

**Configuration Stored:** `%USERPROFILE%/.personaliz/settings.json`

**Visual Indicator:** Chat header shows current provider:
- `Personaliz Assistant` (local)
- `Personaliz Assistant 🌐 OPENAI`
- `Personaliz Assistant 🌐 CLAUDE`

📖 **Full Guide:** See [LLM_INTEGRATION_GUIDE.md](LLM_INTEGRATION_GUIDE.md)

---

## 🔀 Local vs API Model Comparison

### Local Model (Phi3 - Default)

```typescript
// Automatic when no API key set
const response = await callLLM("Generate a LinkedIn post about AI");
// Routes to: http://localhost:11434/api/generate
```

**Pros:**
- ✅ 100% private & offline
- ✅ No API costs
- ✅ Fast for small models
- ✅ No rate limits

**Cons:**
- ⚠️ Limited capabilities vs GPT-4
- ⚠️ Requires local resources
- ⚠️ Smaller context window

### Cloud APIs (OpenAI/Claude)

```typescript
// Automatic when API key provided in settings
const response = await callLLM("Generate a LinkedIn post about AI");
// Routes to: api.openai.com or api.anthropic.com
```

**Pros:**
- ✅ Superior quality (GPT-4/Claude Opus)
- ✅ Larger context windows
- ✅ Faster inference
- ✅ No local GPU needed

**Cons:**
- ❌ Costs money per request
- ❌ Requires internet
- ❌ Data sent to external services

### When to Use Each

**Use Local (Phi3):**
- 🔒 Privacy-sensitive tasks
- 💰 Zero budget / testing
- 🌐 Offline environments
- 🧪 Development & experimentation

**Use OpenAI/Claude:**
- 🎯 Production deployments
- 📊 Complex content generation
- 🚀 Live demos & presentations
- ✨ Maximum quality output

---

## 🛡️ Sandbox Mode & Safety

### Built-in Safety Features

1. **Manual Login Required**
   - Script NEVER stores credentials
   - User must log in each session
   - 15-minute timeout for login

2. **Manual Posting Required**
   - Script fills content but DOESN'T click "Post"
   - User has 10 minutes to review
   - Can edit content before posting

3. **Visible Browser**
   - `headless: false` - all actions are visible
   - Visual highlighting of editor
   - Transparent automation

4. **Approval Workflows**
   - AI content shown BEFORE agent creation
   - User must type "yes" to proceed
   - Can type "no" to cancel

### Testing Safely

```bash
# Test without scheduling
node linkedin_bot.js "TEST - This is a test post"

# Close browser before posting to cancel
# The script will timeout gracefully
```

---

## 📁 Project Structure

```
personaliz-desktop/
│
├── src/
│   ├── App.tsx                    # React UI & orchestration
│   ├── App.css                    # Styling
│   └── main.tsx                   # React entry point
│
├── src-tauri/
│   └── src/
│       ├── main.rs                # Rust backend (Tauri commands)
│       ├── database.rs            # SQLite database module (NEW)
│       └── event_poller.rs        # Event polling service (NEW)
│
├── linkedin_bot.js                # Playwright: LinkedIn posting
├── linkedin_hashtag_monitor.js    # Playwright: Hashtag monitoring
├── linkedin_comment_bot.js        # Playwright: Auto-commenting
├── linkedin_trending_scraper.js   # Trending topics scraper (NEW)
├── agent_example_daily_trending.json
├── agent_example_hourly_hashtag.json
├── ARCHITECTURE.md                # Detailed architecture docs
├── AGENT_CONFIG_GUIDE.md          # Agent configuration guide
├── ALL_FEATURES_COMPLETE_SUMMARY.md  # Complete implementation docs (NEW)
│
├── package.json                   # Node.js dependencies
├── tauri.conf.json               # Tauri configuration
└── README.md                      # This file
```

---

## 💾 Database Features

### SQLite Integration

Personaliz now includes a complete SQLite database for structured data storage.

**Database Location:** `%USERPROFILE%/.personaliz/personaliz.db`

**Tables:**
- `agents` - Agent configurations with role/goal/tools
- `agent_logs` - Execution history and events
- `event_handlers` - Polling configurations
- `settings` - Application settings

**Chat Commands:**
```
> view agents          # Show all agents from database
> list agents          # Same as above
> view events          # Show event handlers
> create event for [name]  # Create periodic event handler
```

**UI Panels:**
- **Agents View** - Shows all agents with metadata (role, goal, tools, schedule)
- **Event Handlers View** - Shows polling configuration and status

### Event Polling System

Background service that runs continuously:
- Checks every 10 seconds
- Supports polling, web, and periodic event types
- Auto-starts with application
- Database-backed configuration

### Enhanced Agent Metadata

Agents now include semantic fields:
- **Role** - What the agent does (e.g., "Content Creator")
- **Goal** - Agent's objective (e.g., "Post engaging LinkedIn content")
- **Tools** - Technologies used (e.g., ["playwright", "linkedin", "llm"])

**Example:**
```json
{
  "name": "LinkedIn AI Poster",
  "role": "Content Creator",
  "goal": "Post engaging LinkedIn content to grow professional network",
  "tools": ["playwright", "linkedin", "llm"],
  "schedule": "daily",
  "schedule_time": "09:00"
}
```

---

## ⚙️ Configuration

### Ollama Model Selection

```bash
# Switch to different models
ollama pull llama2       # Faster, simpler
ollama pull mistral      # Balanced
ollama pull codellama    # Code-focused

# Update App.tsx
model: "llama2"  // Change from "phi3"
```

### OpenClaw Agent Schedule

```json
"schedule": "daily",        // Options: daily, hourly, weekly
"schedule_time": "09:00",   // 24-hour format
"schedule_interval": 1,     // For hourly (every N hours)
"schedule_day": "monday"    // For weekly
```

### Playwright Timeouts

```javascript
// In linkedin_bot.js
timeout: 900000,    // 15 min login timeout
await page.waitForTimeout(600000);  // 10 min review timeout
```

---

## 🐛 Troubleshooting

### Issue: Ollama not responding

```bash
# Check if Ollama is running
ollama list

# Restart Ollama
# Close existing Ollama processes, then:
ollama serve

# In new terminal:
ollama run phi3
```

### Issue: Browser doesn't open

```bash
# Reinstall Playwright browsers
npx playwright install chromium --with-deps

# Test manually
node linkedin_bot.js "test"
```

### Issue: OpenClaw not found

1. Verify OpenClaw is installed at the correct path
2. Update path in `src/App.tsx` (line ~30)
3. Ensure `.agents` directory exists:
   ```bash
   mkdir C:\Users\YOUR_USERNAME\openclaw\.agents
   ```

### Issue: Tauri build fails

```bash
# Update Rust
rustup update

# Clean and rebuild
npm run tauri build -- --debug
```

### Issue: LinkedIn automation fails

**Common causes:**
- LinkedIn changed their UI (selectors outdated)
- Not logged in / session expired
- Rate limiting (too many requests)

**Solutions:**
- Update selectors in `linkedin_bot.js`
- Log in manually when prompted
- Space out agent executions

### Issue: LLM not responding

**Check which provider you're using:**

```bash
# In app, type:
> settings
# Check "Current Configuration"
```

**Local (Phi3) troubleshooting:**
```bash
ollama list              # Verify phi3 is installed
ollama serve             # Start Ollama service
ollama run phi3 "test"  # Test manually
```

**OpenAI troubleshooting:**
- Verify API key is valid at https://platform.openai.com/api-keys
- Check account has credits/billing enabled
- Test with curl:
  ```bash
  curl https://api.openai.com/v1/models \
    -H "Authorization: Bearer YOUR_API_KEY"
  ```

**Claude troubleshooting:**
- Verify API key format starts with `sk-ant-`
- Check access at https://console.anthropic.com/
- Ensure model name is exact: `claude-3-opus-20240229`

### Issue: Settings not saving

```bash
# Check settings file exists:
# Windows: %USERPROFILE%\.personaliz\settings.json
# Linux/Mac: ~/.personaliz/settings.json

# File permissions may be wrong - recreate:
> settings
# Re-enter configuration and click Save
```

---

## 🔐 Privacy & Security

### Data Privacy

**Default (Local Mode):**
✅ **All AI processing is local** - Phi3 runs on your machine  
✅ **No data sent externally** - 100% offline LLM inference  
✅ **No credentials stored** - Manual login required  
✅ **No telemetry** - Tauri doesn't track usage  
✅ **No cloud dependencies** - Works 100% offline  

**Cloud API Mode (Optional):**
⚠️ **Data sent to LLM provider** - OpenAI/Anthropic process prompts  
⚠️ **Subject to provider ToS** - Follow OpenAI/Claude terms  
✅ **API keys stored locally** - In `~/.personaliz/settings.json`  
✅ **HTTPS encryption** - All API calls secured  
✅ **No credential storage** - LinkedIn login still manual  

### Security Best Practices

1. **Protect API keys** - Never commit to version control
2. **Review AI content** - Always approve before posting
3. **Use sandbox mode** - Test with "TEST" prefix in posts
4. **Monitor agent behavior** - Check OpenClaw logs regularly
5. **Keep dependencies updated** - Run `npm audit` periodically
6. **Encrypt settings file** - Consider OS keychain for production
7. **Rotate API keys** - Change keys periodically
8. **Check dependencies** - Use `check dependencies` command in app

---

## 🚦 Roadmap

### Completed ✅
- ✅ Multi-provider LLM support (Local/OpenAI/Claude)
- ✅ Auto-commenting bot for hashtag engagement
- ✅ OS and dependency detection
- ✅ SQLite database with structured storage
- ✅ Event polling system (background handlers)
- ✅ Role/Goal/Tools agent configuration
- ✅ Trending topics scraper for data-driven content

### In Progress 🚧
- 🚧 Analytics dashboard (post performance)
- 🚧 Browser session persistence (stay logged in)

### Future Features 🔮
- [ ] Support for Twitter/X automation
- [ ] Multi-account management
- [ ] Mobile companion app
- [ ] Plugin system for custom agents
- [ ] Cloud sync for agents (optional)
- [ ] Advanced event triggers (webhooks, RSS)
- [ ] Content calendar visualization

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Tauri** - Amazing desktop framework
- **Ollama** - Local LLM runtime
- **Playwright** - Reliable browser automation
- **OpenClaw** - Task scheduling engine
- **Meta** - Phi3 AI model

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/personaliz-desktop/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/personaliz-desktop/discussions)
- **Email**: your.email@example.com

---

## ⚡ Quick Start Checklist

**Required:**
- [ ] Node.js installed (v18+)
- [ ] Rust installed (latest stable)
- [ ] Dependencies installed (`npm install`)
- [ ] Playwright browsers installed (`npx playwright install chromium`)

**For Local LLM (Recommended for First Run):**
- [ ] Ollama installed and running (`ollama serve`)
- [ ] Phi3 model downloaded (`ollama pull phi3`)

**For Cloud API (Optional):**
- [ ] OpenAI or Claude API key obtained
- [ ] API key entered in Settings panel
- [ ] Model selected (gpt-4 / claude-3-opus-20240229)

**For Task Scheduling (Optional):**
- [ ] OpenClaw installed (parent directory)
- [ ] `.agents` directory created

**Run the App:**
- [ ] App running (`npm run tauri dev`)
- [ ] Check dependencies (`check dependencies` command in chat)
- [ ] Test LLM (`create linkedin agent about testing`)

**Test Automation:**
- [ ] Test LinkedIn bot (`node linkedin_bot.js "test"`)
- [ ] Test comment bot (`node linkedin_comment_bot.js`)
- [ ] Test trending scraper (`node linkedin_trending_scraper.js`)

**Test Database Features:**
- [ ] Create an agent in app (`create linkedin agent`)
- [ ] View agents database (`view agents` command in chat)
- [ ] View event handlers (`view events` command in chat)
- [ ] Create event handler (`create event for monitoring`)

**Ready to automate!** 🚀

---

## 📚 Documentation

- **[All Features Complete Summary](ALL_FEATURES_COMPLETE_SUMMARY.md)** - NEW! Complete implementation guide
- **[LLM Integration Guide](LLM_INTEGRATION_GUIDE.md)** - Multi-provider LLM setup
- **[Architecture Guide](ARCHITECTURE.md)** - Technical architecture details
- **[Usage Guide](USAGE_GUIDE.md)** - Step-by-step usage instructions
- **[Quick Reference](QUICK_REFERENCE.md)** - Command cheatsheet
- **[Requirements Checklist](REQUIREMENTS_CHECKLIST.md)** - Feature compliance tracking

---

Made with ❤️ by [Your Name]
