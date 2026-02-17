# Complete Demo Testing Guide

## 🎯 Overview
This guide walks you through testing ALL features of Personaliz Desktop.

---

## ✅ Demo 1: In-App Agent Creation

**Test in the app chat:**

```
create linkedin agent about AI automation
```

**Expected:**
- ✅ LLM generates post content
- ✅ Shows preview with configuration
- ✅ Prompts for approval

**Then approve:**
```
yes
```

**Expected:**
- ✅ Success message
- ✅ Agent file created: `C:\Users\manoh\openclaw\.agents\linkedin_ai_automation_poster.json`
- ✅ Agent stored in database

**Verify:**
```
view agents
```

**Expected:**
- ✅ Modal opens
- ✅ Shows agent with role, goal, tools
- ✅ Status: ACTIVE

---

## 📝 Demo 2: LinkedIn Posting Bot (Manual Script)

**Command:**
```powershell
node linkedin_bot.js "This is a test post about AI trends! #AI #Tech"
```

**What happens:**
1. ✅ Browser opens (visible mode)
2. ⏳ **YOU MUST LOG IN MANUALLY** (15-minute window)
3. ✅ Script navigates to LinkedIn feed
4. ✅ Clicks "Start a post"
5. ✅ Fills content into editor
6. ✅ Editor highlighted in BLUE
7. ⏳ **YOU MUST CLICK "Post" MANUALLY** (10-minute window)

**Safety Features:**
- Manual login required
- Manual posting required
- Visible browser (no secrets)
- Can cancel anytime

**To cancel:** Just close the browser window

---

## 💬 Demo 3: Auto-Comment Bot

**Command:**
```powershell
node linkedin_comment_bot.js
```

**What happens:**
1. ✅ Browser opens
2. ⏳ **LOG IN MANUALLY**
3. ✅ Script searches for `#javascript` posts
4. ✅ Finds recent posts (last 24 hours)
5. ✅ Shows preview of 5 posts
6. ✅ Generates AI comments for each
7. ⏳ **YOU APPROVE EACH COMMENT** (type 'yes' in terminal)
8. ✅ Script fills comment
9. ⏳ **YOU CLICK "Post" MANUALLY**

**Example interaction:**
```
Found post: "10 JavaScript Tips for Beginners"

Generated comment:
"Great tips! I especially love #3 about async/await. 
Have you considered adding examples for error handling? 🚀"

Approve this comment? (yes/no): yes
→ Comment filled in browser
→ YOU click "Post" button
```

---

## 📊 Demo 4: Hashtag Monitor

**Command:**
```powershell
node linkedin_hashtag_monitor.js "#AI"
```

**What happens:**
1. ✅ Browser opens
2. ⏳ **LOG IN MANUALLY**
3. ✅ Navigates to hashtag feed
4. ✅ Scrolls and counts posts
5. ✅ Shows statistics:
   - Total posts found
   - Top authors
   - Engagement metrics
6. ✅ Browser stays open for review

**Use cases:**
- Research trending topics
- Find influencers in your niche
- Track hashtag popularity

---

## 🔥 Demo 5: Trending Topics Scraper

**Command:**
```powershell
node linkedin_trending_scraper.js
```

**What happens:**
1. ✅ Browser opens
2. ⏳ **LOG IN MANUALLY** (15-minute window)
3. ✅ Script scrolls through feed
4. ✅ Scrapes all hashtags
5. ✅ Counts frequency
6. ✅ Extracts keywords from popular posts
7. ✅ Saves to `trending_topics.json`

**Output file:**
```json
{
  "trending_hashtags": [
    { "tag": "#AI", "count": 15 },
    { "tag": "#MachineLearning", "count": 12 },
    { "tag": "#TechNews", "count": 10 }
  ],
  "popular_topics": ["artificial", "intelligence", "automation"],
  "post_samples": ["Excited to announce...", "5 trends..."],
  "scraped_at": "2026-02-17T10:30:00.000Z"
}
```

**Then use trending data:**
```
create linkedin agent using trending topics
```
(Manually read trending_topics.json and include keywords in your prompt)

---

## 💾 Demo 6: Database Features

**In app chat:**

### View All Agents
```
view agents
```

**Shows:**
- Agent name
- Role (e.g., "Content Creator")
- Goal (e.g., "Post engaging LinkedIn content")
- Tools (e.g., ["playwright", "linkedin", "llm"])
- Schedule (daily @ 09:00)
- Status (ACTIVE/INACTIVE)

### Create Event Handler
```
create event for LinkedIn monitoring
```

**Creates:**
- Periodic event handler
- Interval: 300 seconds (5 minutes)
- Stored in database

### View Event Handlers
```
view events
```

**Shows:**
- Handler name
- Type (periodic/polling/web)
- Interval seconds
- Last check timestamp
- Status (POLLING/STOPPED)

### Start Event Poller
```
start event poller
```

**Starts:**
- Background polling service
- Checks every 10 seconds
- Processes all active handlers

---

## 🔧 Demo 7: Dependency Checking

**In app chat:**
```
check dependencies
```

**Shows:**
- ✅ Operating System: Windows
- ✅ Node.js: v22.x.x
- ✅ npm: 10.x.x
- ✅ Playwright: Installed
- ✅ Ollama: Running
- ✅ OpenClaw: Found

**Missing dependencies:**
- ❌ Shows installation instructions
- ❌ Provides download links

---

## 🎨 Demo 8: LLM Switching

**In app chat, open settings:**
```
settings
```

**Change LLM provider:**

### Option 1: Local (Free, No API Key)
- Provider: Local (Ollama)
- Model: phi3
- Endpoint: http://localhost:11434/api/generate

### Option 2: OpenAI (Paid, Best Quality)
- Provider: OpenAI
- API Key: sk-...
- Model: gpt-4

### Option 3: Claude (Paid, Excellent)
- Provider: Claude
- API Key: sk-ant-...
- Model: claude-3-opus-20240229

**Save settings, then test:**
```
create linkedin agent about quantum computing
```

---

## 🧪 Testing Checklist

### In-App Features
- [ ] Create agent (Demo 1)
- [ ] View agents database (Demo 6)
- [ ] Create event handler (Demo 6)
- [ ] View event handlers (Demo 6)
- [ ] Start event poller (Demo 6)
- [ ] Check dependencies (Demo 7)
- [ ] Switch LLM provider (Demo 8)
- [ ] Open settings panel

### Manual Scripts (Require Browser Login)
- [ ] LinkedIn posting bot (Demo 2)
- [ ] Auto-comment bot (Demo 3)
- [ ] Hashtag monitor (Demo 4)
- [ ] Trending topics scraper (Demo 5)

### Verify Files Created
- [ ] Agent JSON in `C:\Users\manoh\openclaw\.agents\`
- [ ] Database at `%USERPROFILE%\.personaliz\personaliz.db`
- [ ] Settings at `%USERPROFILE%\.personaliz\settings.json`
- [ ] Trending topics at `trending_topics.json`

---

## 🚨 Common Issues & Fixes

### App Won't Start
```powershell
# Kill stuck processes
Get-Process | Where-Object {$_.ProcessName -like "*node*" -or $_.ProcessName -like "*personaliz*"} | Stop-Process -Force

# Clear cache
Remove-Item -Recurse -Force "node_modules\.vite"

# Restart
npm run tauri dev
```

### Browser Scripts Timeout
- **Login timeout:** You have 15 minutes to log in
- **Post timeout:** You have 10 minutes to review and post
- **Solution:** Just close browser and try again

### "Agent not found in database"
- **Cause:** You didn't approve with "yes"
- **Solution:** Create agent again and type "yes"

### LLM Not Responding
```powershell
# Check if Ollama is running
ollama serve

# Pull model if missing
ollama pull phi3
```

---

## 📊 Success Criteria

After testing all demos, you should have:

✅ **3+ agents** in OpenClaw `.agents` folder  
✅ **3+ agents** visible in "view agents" command  
✅ **1+ event handlers** in database  
✅ **LinkedIn posts** created (if you approved manual posting)  
✅ **Comments posted** (if you used auto-comment bot)  
✅ **trending_topics.json** file with real data  
✅ **All dependencies** showing green checkmarks  

---

## 🎉 Next Steps

Once all demos pass:

1. **Schedule agents with OpenClaw**
   - Agents auto-load from `.agents` folder
   - Run daily/hourly based on schedule
   - No manual intervention needed

2. **Integrate trending topics**
   - Run scraper weekly
   - Use trending data in agent prompts
   - Data-driven content strategy

3. **Monitor with event handlers**
   - Track agent execution
   - Alert on errors
   - Log all activities

4. **Scale up production**
   - Add more agents
   - Vary posting times
   - A/B test content styles

---

**Ready to test?** Start the app and work through each demo! 🚀

```powershell
npm run tauri dev
```
