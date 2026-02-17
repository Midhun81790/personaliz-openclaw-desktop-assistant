# LLM Integration Guide - Personaliz Desktop

## Overview

Personaliz Desktop supports **dual LLM integration**: local models for offline use and cloud APIs for enhanced capabilities. The system intelligently routes requests based on user configuration.

---

## Architecture

```
┌─────────────────────────────────────────────┐
│         User Request (Chat Input)           │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │   LLM Router Logic   │
        │  (App.tsx/callLLM)   │
        └──────────┬───────────┘
                   │
         ┌─────────┴──────────┐
         │                    │
         ▼                    ▼
┌────────────────┐   ┌────────────────┐
│  Local Model   │   │  Cloud APIs    │
│  (Ollama/Phi3) │   │ (OpenAI/Claude)│
└────────────────┘   └────────────────┘
         │                    │
         └─────────┬──────────┘
                   │
                   ▼
           ┌──────────────┐
           │   Response   │
           └──────────────┘
```

---

## How It Works

### 1. Default Behavior (No API Key)

**On First Install:**
- System uses **local Ollama** with **Phi3** model
- Works **100% offline**
- No API key required
- No internet dependency for LLM calls

**Configuration:**
```typescript
{
  llm_provider: "local",
  llm_model: "phi3",
  llm_endpoint: "http://localhost:11434/api/generate",
  llm_api_key: ""
}
```

---

### 2. After User Provides API Key

**When user enters API key via Settings:**
- System **automatically switches** to cloud provider
- All LLM calls route to external API
- Better quality responses
- Costs API usage

**Configuration Example (OpenAI):**
```typescript
{
  llm_provider: "openai",
  llm_model: "gpt-4",
  llm_endpoint: "https://api.openai.com/v1/chat/completions",
  llm_api_key: "sk-..." // User's key
}
```

---

## Supported Providers

### Local (Default)

| Feature | Details |
|---------|---------|
| **Provider** | Ollama |
| **Default Model** | phi3 |
| **Endpoint** | http://localhost:11434/api/generate |
| **API Key** | Not required |
| **Internet** | Not required |
| **Cost** | Free |
| **Setup** | `ollama serve` + `ollama pull phi3` |

**Advantages:**
- ✅ 100% offline
- ✅ Zero cost
- ✅ Privacy (data stays local)
- ✅ Fast for small models

**Limitations:**
- ⚠️ Smaller context window
- ⚠️ Less capable than GPT-4
- ⚠️ Requires local resources

---

### OpenAI

| Feature | Details |
|---------|---------|
| **Provider** | OpenAI |
| **Default Model** | gpt-4 |
| **Endpoint** | https://api.openai.com/v1/chat/completions |
| **API Key** | Required (user provides) |
| **Internet** | Required |
| **Cost** | Pay per token |

**Models:**
- `gpt-4` - Most capable
- `gpt-4-turbo` - Faster, cheaper
- `gpt-3.5-turbo` - Budget option

**Advantages:**
- ✅ Superior quality
- ✅ Larger context window
- ✅ Better reasoning

**How to Get API Key:**
1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Copy and paste into Settings

---

### Claude (Anthropic)

| Feature | Details |
|---------|---------|
| **Provider** | Anthropic |
| **Default Model** | claude-3-opus-20240229 |
| **Endpoint** | https://api.anthropic.com/v1/messages |
| **API Key** | Required (user provides) |
| **Internet** | Required |
| **Cost** | Pay per token |

**Models:**
- `claude-3-opus-20240229` - Most capable
- `claude-3-sonnet-20240229` - Balanced
- `claude-3-haiku-20240307` - Fast & cheap

**Advantages:**
- ✅ Excellent for complex tasks
- ✅ Strong safety features
- ✅ Good for structured output

**How to Get API Key:**
1. Go to https://console.anthropic.com/
2. Create API key
3. Copy and paste into Settings

---

## LLM Router Implementation

### Code Structure

**Location:** `src/App.tsx`

**Key Function:**
```typescript
const callLLM = async (prompt: string): Promise<string> => {
  addLog(`[LLM] Using ${llmProvider} model: ${llmModel}`);

  if (llmProvider === "local") {
    // Route to Ollama
    const response = await fetch(llmEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: llmModel,
        prompt: prompt,
        stream: false
      })
    });
    const data = await response.json();
    return data.response.trim();
  } 
  else if (llmProvider === "openai") {
    // Route to OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${llmApiKey}`
      },
      body: JSON.stringify({
        model: llmModel,
        messages: [{ role: "user", content: prompt }]
      })
    });
    const data = await response.json();
    return data.choices[0].message.content.trim();
  }
  else if (llmProvider === "claude") {
    // Route to Claude
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": llmApiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: llmModel,
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }]
      })
    });
    const data = await response.json();
    return data.content[0].text.trim();
  }

  throw new Error("Unknown LLM provider");
};
```

---

## Settings Storage

### Backend (Rust)

**Location:** `src-tauri/src/main.rs`

**Storage Path:** `%USERPROFILE%/.personaliz/settings.json`

**Structure:**
```json
{
  "llm_provider": "local",
  "llm_api_key": "",
  "llm_model": "phi3",
  "llm_endpoint": "http://localhost:11434/api/generate"
}
```

**Rust Commands:**
- `save_settings()` - Saves settings to file
- `load_settings()` - Loads settings from file

**Security:**
- Settings file stored in user's home directory
- File permissions restrict to current user
- API keys stored as plain text (consider encryption for production)

---

## User Interface

### Settings Panel

**Access:** Click ⚙️ gear icon (bottom-right, next to chat)

**Fields:**

1. **LLM Provider** (Dropdown)
   - Local (Ollama/Phi3)
   - OpenAI
   - Claude (Anthropic)

2. **API Key** (Password field)
   - Only shown for cloud providers
   - Masked input
   - Required for OpenAI/Claude

3. **Model** (Text input)
   - Defaults vary by provider
   - User can customize

4. **Endpoint** (Text input)
   - Only shown for local provider
   - Default: http://localhost:11434/api/generate

5. **Current Status** (Read-only)
   - Shows active configuration
   - Indicates if API key is set

6. **System Info** (Read-only)
   - OS, Node version, dependencies

**Actions:**
- **Save Settings** - Persists configuration
- **Cancel** - Closes without saving

---

## Usage Examples

### Example 1: Default Local Setup

```bash
# Terminal 1: Start Ollama
ollama serve

# Terminal 2: Pull model
ollama pull phi3

# Terminal 3: Start app
cd C:\Users\manoh\personaliz-desktop
npm run tauri dev

# In app:
> create linkedin agent about AI trends
# Uses local Phi3 model
```

---

### Example 2: Switch to OpenAI

```bash
# Start app
npm run tauri dev

# In app:
> settings
# (Settings panel opens)

1. Select Provider: OpenAI
2. Enter API Key: sk-proj-...
3. Set Model: gpt-4
4. Click "Save Settings"

> create linkedin agent about AI trends
# Now uses OpenAI GPT-4
```

---

### Example 3: Switch to Claude

```bash
# In app:
> settings

1. Select Provider: Claude (Anthropic)
2. Enter API Key: sk-ant-...
3. Set Model: claude-3-opus-20240229
4. Click "Save Settings"

> create linkedin agent about automation
# Now uses Claude
```

---

## Visual Indicators

### Chat Header

**Local Mode:**
```
Personaliz Assistant
```

**OpenAI Mode:**
```
Personaliz Assistant 🌐 OPENAI
```

**Claude Mode:**
```
Personaliz Assistant 🌐 CLAUDE
```

**With Sandbox:**
```
Personaliz Assistant 🔒 SANDBOX 🌐 OPENAI
```

### Log Messages

**All LLM calls show provider:**
```
[LLM] Using local model: phi3
[LLM] Using openai model: gpt-4
[LLM] Using claude model: claude-3-opus-20240229
```

---

## Troubleshooting

### Local Model Not Working

**Check:**
```bash
# Is Ollama running?
ollama list

# Pull the model
ollama pull phi3

# Test manually
ollama run phi3 "Hello"
```

**Fix:**
```bash
# Start Ollama service
ollama serve

# Or in app:
> check dependencies
```

---

### OpenAI API Key Not Working

**Common Issues:**
1. Invalid API key format
2. Insufficient credits
3. Rate limits exceeded

**Check:**
```bash
# Test API key with curl
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Fix:**
- Verify key at https://platform.openai.com/api-keys
- Check usage limits
- Ensure billing is set up

---

### Claude API Key Not Working

**Common Issues:**
1. Wrong API key format
2. No API access granted
3. Model name incorrect

**Check:**
- Key starts with `sk-ant-`
- Access granted in Anthropic console
- Model name matches exactly

---

## Best Practices

### For Development
✅ Use **local model** (Phi3)
- Free
- Fast iteration
- No API costs

### For Production/Demos
✅ Use **OpenAI/Claude**
- Better quality
- More reliable
- Professional output

### For Privacy-Sensitive Tasks
✅ Use **local model**
- Data stays on device
- No external API calls
- GDPR compliant

---

## Cost Comparison

| Provider | Setup Cost | Running Cost | Quality |
|----------|-----------|--------------|---------|
| **Local (Phi3)** | $0 | $0/request | Good |
| **OpenAI GPT-3.5** | $0 | ~$0.002/request | Better |
| **OpenAI GPT-4** | $0 | ~$0.03/request | Best |
| **Claude Opus** | $0 | ~$0.015/request | Best |

*Costs are approximate and vary by usage*

---

## Migration Path

**Recommended Workflow:**

1. **Day 1**: Use local Phi3
   - No setup friction
   - Test all features
   - Verify automation works

2. **Day 2+**: Add API key
   - Better content quality
   - More consistent results
   - Professional demos

3. **Production**: Cloud API
   - OpenAI for general use
   - Claude for complex tasks
   - Local as fallback

---

## Security Considerations

### API Key Storage

**Current:** Plain text in `~/.personaliz/settings.json`

**Production Recommendations:**
1. Encrypt API keys at rest
2. Use OS keychain (Windows Credential Manager)
3. Implement key rotation
4. Add rate limiting
5. Monitor API usage

### Network Security

**Local Model:**
- ✅ No external calls
- ✅ No data leakage
- ✅ Firewall friendly

**Cloud APIs:**
- ⚠️ Data sent to external services
- ⚠️ Subject to provider ToS
- ⚠️ Requires HTTPS

---

## Future Enhancements

### Planned Features

1. **Model Auto-Selection**
   - Detect task complexity
   - Route simple tasks to local
   - Route complex tasks to cloud

2. **Hybrid Mode**
   - Try local first
   - Fallback to cloud if needed
   - Cost optimization

3. **Model Benchmarking**
   - Compare response quality
   - Track API costs
   - Performance metrics

4. **Additional Providers**
   - Google Gemini
   - Cohere
   - Hugging Face Inference API

---

## Summary

✅ **Default:** Local Phi3 (offline, free)  
✅ **Upgrade:** OpenAI/Claude (quality, cost)  
✅ **Switch:** Automatic routing based on settings  
✅ **Storage:** Persistent configuration file  
✅ **UI:** Simple settings panel  
✅ **Logs:** Clear provider indication  

**The system works out-of-the-box with local LLM and scales to cloud APIs when needed.**

---

For more information:
- [Main README](README.md)
- [Architecture Guide](ARCHITECTURE.md)
- [Usage Guide](USAGE_GUIDE.md)
