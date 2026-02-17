import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

export default function App() {

  // ===================================
  // STATE MANAGEMENT
  // ===================================
  const [messages,setMessages] = useState<string[]>([]);
  const [logs,setLogs] = useState<string[]>([]);
  const [input,setInput] = useState("");

  const [pendingAgent,setPendingAgent] = useState<any>(null);
  const [pendingLinkedInPost,setPendingLinkedInPost] = useState<string|null>(null);
  const [pendingAutoComment, setPendingAutoComment] = useState<{step: string, githubLink?: string, commentText?: string} | null>(null);
  const [pendingHashtagMonitor, setPendingHashtagMonitor] = useState<{step: string, hashtag?: string} | null>(null);
  const [pendingAgentBuilder, setPendingAgentBuilder] = useState<{
    step: string,
    name?: string,
    description?: string,
    role?: string,
    goal?: string,
    tools?: string,
    schedule?: string,
    scheduleTime?: string,
    scriptType?: string,
    githubLink?: string,
    spec?: string,
    askedQuestion?: string,
  } | null>(null);

  const [chatOpen,setChatOpen] = useState(true);
  const [sandboxMode,setSandboxMode] = useState(false); // Sandbox flag for safe testing
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dependencies, setDependencies] = useState<any>(null);
  const [agentsView, setAgentsView] = useState(false); // View all agents from database
  const [eventHandlersView, setEventHandlersView] = useState(false); // View event handlers
  const [dbAgents, setDbAgents] = useState<any[]>([]);
  const [eventHandlers, setEventHandlers] = useState<any[]>([]);

  // LLM Settings
  const [llmProvider, setLlmProvider] = useState("local"); // "local", "openai", "claude"
  const [llmApiKey, setLlmApiKey] = useState("");
  const [llmModel, setLlmModel] = useState("phi3");
  const [llmEndpoint, setLlmEndpoint] = useState("http://localhost:11434/api/generate");

  // ===================================
  // CONFIGURATION
  // ===================================
  const OPENCLAW_PATH = "C:/Users/manoh/openclaw";
  const PROJECT_PATH = "C:/Users/manoh/personaliz-desktop";

  // Load settings on mount
  useEffect(() => {
    loadSettings();
    checkDeps();
  }, []);

  const loadSettings = async () => {
    try {
      const settingsJson = await invoke("load_settings") as string;
      const settings = JSON.parse(settingsJson);
      setLlmProvider(settings.llm_provider || "local");
      setLlmApiKey(settings.llm_api_key || "");
      setLlmModel(settings.llm_model || "phi3");
      setLlmEndpoint(settings.llm_endpoint || "http://localhost:11434/api/generate");
      addLog("[SYSTEM] Settings loaded");
    } catch (err) {
      console.error("Failed to load settings:", err);
      addLog("[SYSTEM] Using default settings");
    }
  };

  const saveSettings = async () => {
    try {
      await invoke("save_settings", {
        llmProvider,
        llmApiKey,
        llmModel,
        llmEndpoint
      });
      addMessage("Assistant: ✅ Settings saved successfully!");
      addLog("[SYSTEM] Settings saved");
      setSettingsOpen(false);
    } catch (err) {
      handleError("Save Settings", err);
    }
  };

  const checkDeps = async () => {
    try {
      const depsJson = await invoke("check_dependencies") as string;
      const deps = JSON.parse(depsJson);
      setDependencies(deps);
      addLog(`[SYSTEM] Running on ${deps.os}`);
    } catch (err) {
      console.error("Failed to check dependencies:", err);
    }
  };

  // Load agents from database
  const loadDbAgents = async () => {
    try {
      const result = await invoke("db_get_all_agents") as string;
      const agents = JSON.parse(result);
      setDbAgents(agents);
      addLog(`[DB] Loaded ${agents.length} agents from database`);
    } catch (err) {
      console.error("Failed to load agents:", err);
      addLog("[DB] Error loading agents");
    }
  };

  // Load event handlers from database
  const loadEventHandlers = async () => {
    try {
      const result = await invoke("db_get_all_event_handlers") as string;
      const handlers = JSON.parse(result);
      setEventHandlers(handlers);
      addLog(`[DB] Loaded ${handlers.length} event handlers`);
    } catch (err) {
      console.error("Failed to load event handlers:", err);
      addLog("[DB] Error loading event handlers");
    }
  };

  // Create event handler
  const createEventHandler = async (name: string, eventType: string, url: string, intervalSeconds: number) => {
    try {
      const config = { url, intervalSeconds };
      await invoke("db_create_event_handler", {
        name,
        eventType,
        url: url || null,
        intervalSeconds,
        configJson: JSON.stringify(config)
      });
      addMessage(`Assistant: ✅ Event handler "${name}" created successfully`);
      addLog(`[DB] Created event handler: ${name}`);
      await loadEventHandlers();
    } catch (err) {
      handleError("Create Event Handler", err);
    }
  };

  // Get current LLM endpoint based on provider
  const getCurrentLLMEndpoint = () => {
    if (llmProvider === "openai") {
      return "https://api.openai.com/v1/chat/completions";
    } else if (llmProvider === "claude") {
      return "https://api.anthropic.com/v1/messages";
    } else {
      return llmEndpoint; // local Ollama
    }
  };

  // Universal LLM call function that routes based on provider
  const callLLM = async (prompt: string): Promise<string> => {
    addLog(`[LLM] Using ${llmProvider} model: ${llmModel}`);

    if (llmProvider === "local") {
      // Local Ollama
      const response = await fetch(llmEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: llmModel,
          prompt: prompt,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.response.trim();
    } else if (llmProvider === "openai") {
      // OpenAI API
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${llmApiKey}`
        },
        body: JSON.stringify({
          model: llmModel,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();
    } else if (llmProvider === "claude") {
      // Claude API
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

      if (!response.ok) {
        throw new Error(`Claude returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.content[0].text.trim();
    }

    throw new Error("Unknown LLM provider");
  };

  // ===================================
  // UTILITY FUNCTIONS
  // ===================================
  const addLog = (t: string) => setLogs(p => [...p, t]);
  
  const addMessage = (msg: string) => setMessages(p => [...p, msg]);
  
  const handleError = (context: string, error: any) => {
    console.error(`[${context}] Error:`, error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    addMessage(`Assistant: ❌ ${context} failed: ${errorMsg}`);
    addLog(`[ERROR] ${context}: ${errorMsg}`);
  };

  const sendMessage=async()=>{

    if(!input.trim()) return;

    const userInput=input;
    const lower=input.toLowerCase();

    setMessages(p=>[...p,"User: "+userInput]);
    setInput("");

    // ===================================
    // OPEN SETTINGS
    // ===================================
    if(lower === "settings" || lower === "open settings" || lower === "configure"){
      setSettingsOpen(true);
      addMessage("Assistant: ⚙️ Opening settings...");
      return;
    }

    // ===================================
    // CHECK DEPENDENCIES
    // ===================================
    if(lower === "check dependencies" || lower === "check setup" || lower === "system check"){
      addMessage("Assistant: Checking system dependencies...");
      try {
        await checkDeps();
        if (dependencies) {
          addMessage("Assistant: 📋 System Status:");
          addMessage(`  • OS: ${dependencies.os}`);
          addMessage(`  • Node.js: ${dependencies.node ? '✅ ' + dependencies.node_version : '❌ Not found'}`);
          addMessage(`  • npm: ${dependencies.npm ? '✅ ' + dependencies.npm_version : '❌ Not found'}`);
          addMessage(`  • Playwright: ${dependencies.playwright ? '✅ Installed' : '❌ Not installed'}`);
          addMessage(`  • Ollama: ${dependencies.ollama ? '✅ Running' : '❌ Not running'}`);
          addMessage(`  • OpenClaw: ${dependencies.openclaw ? '✅ Found' : '❌ Not found'}`);
          addMessage("");
          
          const issues = [];
          if (!dependencies.node) issues.push("Install Node.js from nodejs.org");
          if (!dependencies.npm) issues.push("npm should come with Node.js");
          if (!dependencies.playwright) issues.push("Run: npx playwright install chromium");
          if (!dependencies.ollama) issues.push("Install Ollama from ollama.ai and run: ollama serve");
          if (!dependencies.openclaw) issues.push("Run: setup openclaw");

          if (issues.length > 0) {
            addMessage("Assistant: 💡 Setup Required:");
            issues.forEach(issue => addMessage(`  • ${issue}`));
          } else {
            addMessage("Assistant: ✅ All dependencies are ready!");
          }
        }
      } catch (err) {
        handleError("Dependency Check", err);
      }
      return;
    }

    // ===================================
    // VIEW AGENTS
    // ===================================
    if(lower === "view agents" || lower === "list agents" || lower === "show agents"){
      addMessage("Assistant: Loading agents from database...");
      await loadDbAgents();
      setAgentsView(true);
      return;
    }

    // ===================================
    // VIEW EVENT HANDLERS
    // ===================================
    if(lower === "view events" || lower === "list events" || lower === "show event handlers"){
      addMessage("Assistant: Loading event handlers from database...");
      await loadEventHandlers();
      setEventHandlersView(true);
      return;
    }

    // ===================================
    // CREATE EVENT HANDLER
    // ===================================
    if(lower.startsWith("create event") || lower.startsWith("add event handler")){
      addMessage("Assistant: Creating periodic event handler...");
      const eventName = userInput.includes("for") ? userInput.split("for")[1].trim() : "New Event Handler";
      await createEventHandler(
        eventName,
        "periodic",
        "",
        300 // 5 minutes default
      );
      return;
    }

    // ===================================
    // RUN BROWSER AUTOMATION SCRIPTS (AI-POWERED INTENT DETECTION)
    // ===================================
    
    // Auto-Comment Bot - Detect comment-related intents
    if(lower.includes("comment") && (lower.includes("linkedin") || lower.includes("post"))){
      addMessage("Assistant: 🤖 I'll help you comment on LinkedIn posts!");
      addMessage("Please provide your GitHub repository link:");
      addMessage("💡 Example: https://github.com/yourusername/yourproject");
      setPendingAutoComment({ step: 'github_link' });
      addLog("[BROWSER] Auto-comment setup initiated");
      return;
    }
    
    if(lower.includes("reply") && (lower.includes("linkedin") || lower.includes("post"))){
      addMessage("Assistant: 🤖 I'll help you reply to LinkedIn posts!");
      addMessage("Please provide your GitHub repository link:");
      addMessage("💡 Example: https://github.com/yourusername/yourproject");
      setPendingAutoComment({ step: 'github_link' });
      addLog("[BROWSER] Auto-comment setup initiated");
      return;
    }

    // Hashtag Monitor - Detect monitoring/tracking intents
    if((lower.includes("monitor") || lower.includes("track") || lower.includes("watch") || lower.includes("find")) && 
       (lower.includes("hashtag") || lower.includes("post") || lower.includes("#"))){
      addMessage("Assistant: 📊 I'll monitor LinkedIn for you!");
      addMessage("Please enter the hashtag you want to monitor:");
      addMessage("💡 Example: #AI or #TechNews");
      setPendingHashtagMonitor({ step: 'hashtag' });
      addLog("[BROWSER] Hashtag monitor setup initiated");
      return;
    }

    // Trending Topics - Detect trending/analysis intents
    if((lower.includes("trending") || lower.includes("trend") || lower.includes("popular") || 
        lower.includes("what is") || lower.includes("find") || lower.includes("search")) && 
       (lower.includes("topic") || lower.includes("hashtag") || lower.includes("linkedin") || lower.includes("#"))){
      addMessage("Assistant: 🔥 Analyzing LinkedIn trends...");
      addMessage("A browser window will open - log into LinkedIn manually.");
      addLog("[BROWSER] Launching linkedin_trending_scraper.js");
      try {
        const result = await invoke("run_browser_script", {
          scriptName: "linkedin_trending_scraper.js",
          args: []
        }) as string;
        addMessage(`Assistant: ✅ ${result}`);
        addMessage("📌 Scraping trending hashtags and topics - results saved to trending_topics.json");
        addLog("[BROWSER] Trending scraper started");
      } catch (err) {
        handleError("Trending Scraper", err);
      }
      return;
    }

    // ===================================
    // TOGGLE SANDBOX MODE
    // ===================================
    if(lower === "sandbox on" || lower === "enable sandbox"){
      setSandboxMode(true);
      addMessage("Assistant: 🔒 Sandbox mode ENABLED. Automation scripts will be simulated.");
      addLog("[SYSTEM] Sandbox mode enabled");
      return;
    }

    if(lower === "sandbox off" || lower === "disable sandbox"){
      setSandboxMode(false);
      addMessage("Assistant: 🔓 Sandbox mode DISABLED. Automation scripts will run normally.");
      addLog("[SYSTEM] Sandbox mode disabled");
      return;
    }

    // ===================================
    // CREATE AGENT (CONVERSATIONAL BUILDER)
    // ===================================
    // Detects any intent to create/build/make an agent
    
    if((lower.includes("create") || lower.includes("creat") || lower.includes("craete") || lower.includes("build") || lower.includes("make") || lower.includes("new") || lower.includes("setup") || lower.includes("set up")) && 
       (lower.includes("agent") || lower.includes("bot") || lower.includes("automation"))){
      
      addLog("[AGENT] Starting conversational agent builder...");
      addMessage("Assistant: 🤖 Got it. No predefined form.");
      addMessage("Tell me what this agent should do, what it should post (if posting), and when it should run.");
      addMessage("💡 Example: Create an agent to post daily LinkedIn updates about AI hiring and include my GitHub repo link");
      
      setPendingAgentBuilder({ step: 'ai_spec' });
      return;
    }

    // ===================================
    // START OPENCLAW
    // ===================================

    if(lower.includes("setup openclaw")){

      try{

        addLog("[OPENCLAW] Checking directory...");

        // Check if OpenClaw directory exists
        const checkDir = await invoke("run_command",{
          cmd:"if exist " + OPENCLAW_PATH + " (echo EXISTS) else (echo NOT_FOUND)"
        }) as string;

        if(checkDir.includes("NOT_FOUND")){
          setMessages(p=>[
            ...p,
            "Assistant: ❌ OpenClaw not found at " + OPENCLAW_PATH,
            "Assistant: Please install OpenClaw first or update the path in App.tsx"
          ]);
          addLog("[OPENCLAW] ❌ Directory not found");
          return;
        }

        addLog("[OPENCLAW] ✅ Directory found");
        setMessages(p=>[...p,"Assistant: Starting OpenClaw..."]);

        // Start OpenClaw in background
        await invoke("run_command",{
          cmd:"cd " + OPENCLAW_PATH + " && start /B cmd /c npm start"
        });

        setMessages(p=>[
          ...p,
          "Assistant: ✅ OpenClaw started in background!",
          "Assistant: Check the new terminal window for OpenClaw logs."
        ]);
        addLog("[OPENCLAW] ✅ Process started successfully");

      }catch(err){

        console.error("OpenClaw error:",err);
        const errorMsg = err instanceof Error ? err.message : String(err);
        setMessages(p=>[
          ...p,
          `Assistant: ❌ Failed starting OpenClaw: ${errorMsg}`,
          "Assistant: Make sure npm is installed and OpenClaw exists at the path."
        ]);
        addLog(`❌ Error: ${errorMsg}`);

      }

      return;
    }

    // ===================================
    // CREATE AGENT
    // ===================================

    if(lower.includes("create agent")){

      addLog("[AGENT] Starting creation flow...");
      setMessages(p=>[...p,"Assistant: Generating agent..."]);

      try{

        addLog("[LLM] Sending request to Ollama (phi3)...");

        const response = await fetch("http://localhost:11434/api/generate",{
          method:"POST",
          headers:{ "Content-Type":"application/json" },
          body:JSON.stringify({
            model:"phi3",
            prompt:`Return ONLY JSON agent config like:
{
"name":"agent name",
"schedule":"daily",
"task":"description"
}

User request:
${userInput}
`,
            stream:false
          })
        });

        const data = await response.json();
        addLog("[LLM] ✅ Response received");

        console.log("RAW LLM RESPONSE:",data);

        const raw=data.response;

        // SAFE JSON extraction
        const start=raw.indexOf("{");
        const end=raw.lastIndexOf("}");

        if(start===-1 || end===-1){
          throw new Error("JSON not found in LLM response");
        }

        const jsonText=raw.substring(start,end+1);

        const agentConfig=JSON.parse(jsonText);
        addLog("[AGENT] ✅ Config parsed successfully");

        setPendingAgent(agentConfig);
        addLog("[AGENT] Preview ready - awaiting approval");

        setMessages(p=>[
          ...p,
          "Assistant Preview:",
          JSON.stringify(agentConfig,null,2),
          "Assistant: approve? yes/no"
        ]);

      }catch(err){

        console.error("AGENT ERROR:",err);

        setMessages(p=>[
          ...p,
          "Assistant: Agent generation failed (check console)"
        ]);

      }

      return;
    }

    // ===================================
    // CONVERSATIONAL AGENT BUILDER FLOW
    // ===================================
    if(pendingAgentBuilder){
      const builder = pendingAgentBuilder;

      if(builder.step === 'ai_spec' || builder.step === 'ai_followup'){
        const incoming = userInput.trim();
        const mergedSpec = builder.spec ? `${builder.spec}\n${incoming}` : incoming;

        const specLower = mergedSpec.toLowerCase();
        const githubMatch = mergedSpec.match(/https?:\/\/github\.com\/\S+/i);
        const githubLink = githubMatch ? githubMatch[0] : '';
        const inferredHashtag = mergedSpec.match(/#\w+/)?.[0] || '#AI';

        let needsMoreInfo = false;
        let followupQuestion = '';
        let inferredName = '';
        let inferredRole = '';
        let inferredGoal = mergedSpec;
        let inferredTools: string[] = [];
        let inferredSchedule = 'daily';
        let inferredTime = '09:00';
        let scriptFile = '';
        let scriptArgs: string[] = [];
        let planningReason = 'AI requirement analysis';

        // If request is too short/ambiguous, AI asks what it needs (single dynamic question)
        if (mergedSpec.split(' ').length < 6) {
          needsMoreInfo = true;
          followupQuestion = 'What exactly should it post or do, and how often should it run?';
        }

        if (!needsMoreInfo) {
          try {
            const plannerPrompt = `You are planning an automation agent from user intent.
User request:\n${mergedSpec}

Available scripts:
- linkedin_bot.js (posting)
- linkedin_comment_bot.js (commenting)
- linkedin_hashtag_monitor.js (monitoring hashtags)
- linkedin_trending_scraper.js (trending analysis)

Return ONLY JSON with this shape:
{
  "needs_more_info": boolean,
  "question": "only if needed",
  "name": "agent name",
  "role": "role",
  "goal": "goal",
  "tools": ["playwright","linkedin","llm"],
  "schedule": "daily|hourly|weekly|every X minutes",
  "schedule_time": "HH:MM",
  "script_file": "linkedin_bot.js|linkedin_comment_bot.js|linkedin_hashtag_monitor.js|linkedin_trending_scraper.js|none",
  "reason": "short reason"
}`;

            const raw = await callLLM(plannerPrompt);
            const start = raw.indexOf('{');
            const end = raw.lastIndexOf('}');
            if (start !== -1 && end !== -1) {
              const parsed = JSON.parse(raw.substring(start, end + 1));
              needsMoreInfo = !!parsed.needs_more_info;
              followupQuestion = parsed.question || '';
              inferredName = parsed.name || '';
              inferredRole = parsed.role || '';
              inferredGoal = parsed.goal || mergedSpec;
              inferredTools = Array.isArray(parsed.tools) ? parsed.tools : [];
              inferredSchedule = parsed.schedule || inferredSchedule;
              inferredTime = parsed.schedule_time || inferredTime;
              scriptFile = parsed.script_file === 'none' ? '' : (parsed.script_file || '');
              planningReason = parsed.reason || planningReason;
            }
          } catch {
            planningReason = 'LLM planner unavailable, used heuristic planning';
          }
        }

        if (needsMoreInfo) {
          const q = followupQuestion || 'What should it post/do, and what schedule do you want?';
          addMessage(`Assistant: ${q}`);
          setPendingAgentBuilder({ step: 'ai_followup', spec: mergedSpec, askedQuestion: q });
          return;
        }

        // Heuristic completion if planner omitted fields
        if (!scriptFile) {
          const isLinkedInIntent = specLower.includes('linkedin') || specLower.includes('hashtag') || specLower.includes('post') || specLower.includes('comment') || specLower.includes('trend');

          if (isLinkedInIntent) {
            if (specLower.includes('comment') || specLower.includes('reply')) scriptFile = 'linkedin_comment_bot.js';
            else if (specLower.includes('trend') || specLower.includes('popular')) scriptFile = 'linkedin_trending_scraper.js';
            else if (specLower.includes('monitor') || specLower.includes('track') || specLower.includes('hashtag') || specLower.includes('#')) scriptFile = 'linkedin_hashtag_monitor.js';
            else scriptFile = 'linkedin_bot.js';
          } else {
            // Generic agent intent (example: amazon shopping) -> create agent without forcing LinkedIn script
            scriptFile = '';
            planningReason = 'No predefined automation script matched; created generic AI agent';
          }
        }

        if (!inferredName) {
          inferredName = scriptFile === 'linkedin_comment_bot.js' ? 'LinkedIn Comment Agent'
            : scriptFile === 'linkedin_hashtag_monitor.js' ? 'LinkedIn Hashtag Monitor'
            : scriptFile === 'linkedin_trending_scraper.js' ? 'LinkedIn Trend Agent'
            : scriptFile === 'linkedin_bot.js' ? 'LinkedIn Content Agent'
            : 'AI Custom Agent';
        }

        if (!inferredRole) {
          inferredRole = scriptFile === 'linkedin_comment_bot.js' ? 'Comment Assistant'
            : scriptFile === 'linkedin_hashtag_monitor.js' ? 'Social Monitor'
            : scriptFile === 'linkedin_trending_scraper.js' ? 'Trend Analyst'
            : scriptFile === 'linkedin_bot.js' ? 'Content Creator'
            : 'Task Agent';
        }

        if (!inferredTools.length) {
          inferredTools = scriptFile === 'linkedin_hashtag_monitor.js'
            ? ['playwright', 'linkedin', 'scraper']
            : scriptFile
              ? ['playwright', 'linkedin', 'llm']
              : ['llm', 'openclaw'];
        }

        if (!mergedSpec.match(/\b([01]?\d|2[0-3]):[0-5]\d\b/) && inferredTime === '09:00') {
          const timeMatch = mergedSpec.match(/\b([01]?\d|2[0-3]):[0-5]\d\b/);
          if (timeMatch) inferredTime = timeMatch[0];
        }

        if (inferredSchedule === 'daily') {
          if (specLower.includes('hour')) inferredSchedule = 'hourly';
          else if (specLower.includes('week')) inferredSchedule = 'weekly';
          else {
            const everyMin = specLower.match(/every\s+\d+\s*min/);
            if (everyMin) inferredSchedule = everyMin[0];
          }
        }

        // Generate dynamic content only when required
        try {
          if (scriptFile === 'linkedin_bot.js') {
            const postText = await callLLM(`Write a concise professional LinkedIn post for this request:\n${mergedSpec}\n${githubLink ? `Include this GitHub link naturally: ${githubLink}` : ''}\nReturn only post text.`);
            scriptArgs = [postText.trim()];
          } else if (scriptFile === 'linkedin_comment_bot.js') {
            const commentText = await callLLM(`Write a concise professional LinkedIn comment for this request:\n${mergedSpec}\n${githubLink ? `Include this GitHub link naturally: ${githubLink}` : ''}\nReturn only comment text.`);
            scriptArgs = [commentText.trim()];
          } else if (scriptFile === 'linkedin_hashtag_monitor.js') {
            scriptArgs = [inferredHashtag];
          }
        } catch {
          if (scriptFile === 'linkedin_bot.js') {
            scriptArgs = [`Sharing an update on ${mergedSpec}. ${githubLink ? `Project: ${githubLink}` : ''} #automation #ai`];
          } else if (scriptFile === 'linkedin_comment_bot.js') {
            scriptArgs = [`Great perspective — thanks for sharing. ${githubLink ? `Related project: ${githubLink}` : ''}`];
          } else if (scriptFile === 'linkedin_hashtag_monitor.js') {
            scriptArgs = [inferredHashtag];
          }
        }

        const genericRunnerMessage = `AI Custom Agent invoked: ${mergedSpec.replace(/"/g, '\\"')}`;

        const agentConfig = {
          name: inferredName,
          description: mergedSpec,
          role: inferredRole,
          goal: inferredGoal,
          tools: inferredTools,
          schedule: inferredSchedule,
          schedule_time: inferredTime,
          enabled: true,
          command: scriptFile ? "node" : "cmd",
          args: scriptFile
            ? [PROJECT_PATH + '/' + scriptFile, ...scriptArgs]
            : ["/C", `echo ${genericRunnerMessage}`],
          working_directory: PROJECT_PATH,
          timeout: 300000,
          retry_on_failure: false,
          script_type: 'auto',
          github_link: githubLink,
          metadata: {
            created_at: new Date().toISOString(),
            created_by: "Personaliz Assistant",
            sandbox_mode: sandboxMode,
            role: inferredRole,
            goal: inferredGoal,
            ai_planned_script: scriptFile,
            planner_reason: planningReason,
            build_mode: 'ai_requirements',
          }
        };

        addMessage("Assistant: 🎉 Agent Preview:");
        addMessage("═".repeat(50));
        addMessage(`📛 Name: ${agentConfig.name}`);
        addMessage(`📝 Description: ${agentConfig.description}`);
        addMessage(`🎭 Role: ${agentConfig.role}`);
        addMessage(`📜 Script: ${scriptFile}`);
        addMessage(`⏰ Schedule: ${agentConfig.schedule} at ${agentConfig.schedule_time}`);
        addMessage(`🧠 Planner: ${planningReason}`);
        addMessage("═".repeat(50));
        addMessage("Assistant: Create this agent? (yes/no)");

        setPendingAgent(agentConfig);
        setPendingAgentBuilder(null);
        addLog(`[AGENT] AI-built agent preview ready: ${agentConfig.name}`);
        return;
      }
    }

    // ===================================
    // MULTI-STEP AUTO-COMMENT FLOW
    // ===================================
    if(pendingAutoComment){
      if(pendingAutoComment.step === 'github_link'){
        // User just provided GitHub link
        const githubLink = userInput.trim();
        if(!githubLink.startsWith('http')){
          addMessage("Assistant: ❌ Please provide a valid URL starting with http:// or https://");
          return;
        }
        
        addMessage(`Assistant: ✅ GitHub link saved: ${githubLink}`);
        addMessage("Now, would you like to customize the comment text?");
        addMessage("💡 Type your custom comment, or type 'skip' to use default");
        setPendingAutoComment({ step: 'comment_text', githubLink });
        addLog(`[BROWSER] GitHub link: ${githubLink}`);
        return;
      }
      
      if(pendingAutoComment.step === 'comment_text'){
        // User provided comment text or skipped
        const commentText = lower === 'skip' ? null : userInput.trim();
        const { githubLink } = pendingAutoComment;
        
        if(commentText){
          addMessage(`Assistant: ✅ Custom comment saved`);
        } else {
          addMessage("Assistant: ✅ Using default comment template");
        }
        
        // Build the comment with GitHub link
        const finalComment = commentText || 
          `Great insights! Thanks for sharing this with the #openclaw community. 🚀\n\nThis aligns perfectly with what we're working on. Check out our project: ${githubLink}\n\n#automation #productivity #tech`;
        
        addMessage("Assistant: 🤖 Launching browser...");
        addMessage("Log into LinkedIn manually when the browser opens.");
        addLog("[BROWSER] Launching linkedin_comment_bot.js");
        
        try {
          const result = await invoke("run_browser_script", {
            scriptName: "linkedin_comment_bot.js",
            args: [finalComment]
          }) as string;
          addMessage(`Assistant: ✅ ${result}`);
          addMessage("📌 The bot will auto-comment on #openclaw posts once you log in.");
          addLog("[BROWSER] Auto-comment bot started with custom text");
        } catch (err) {
          handleError("Auto-Comment Bot", err);
        }
        
        setPendingAutoComment(null);
        return;
      }
    }

    // ===================================
    // MULTI-STEP HASHTAG MONITOR FLOW
    // ===================================
    if(pendingHashtagMonitor && pendingHashtagMonitor.step === 'hashtag'){
      let hashtag = userInput.trim();
      
      // Add # if missing
      if(!hashtag.startsWith('#')){
        hashtag = '#' + hashtag;
      }
      
      addMessage(`Assistant: ✅ Monitoring hashtag: ${hashtag}`);
      addMessage("Assistant: 🤖 Launching browser...");
      addMessage("Log into LinkedIn manually when the browser opens.");
      addLog(`[BROWSER] Launching hashtag monitor for ${hashtag}`);
      
      try {
        const result = await invoke("run_browser_script", {
          scriptName: "linkedin_hashtag_monitor.js",
          args: [hashtag]
        }) as string;
        addMessage(`Assistant: ✅ ${result}`);
        addMessage(`📌 Monitoring ${hashtag} posts - results will save to hashtag_${hashtag.replace('#', '')}_posts.json`);
        addLog(`[BROWSER] Hashtag monitor started for ${hashtag}`);
      } catch (err) {
        handleError("Hashtag Monitor", err);
      }
      
      setPendingHashtagMonitor(null);
      return;
    }

    // ===================================
    // APPROVAL FLOW (REAL INTEGRATION)
    // ===================================

    if(pendingAgent && lower==="yes"){

      try{

        addLog("[APPROVAL] ✅ User confirmed agent creation");
        setMessages(p=>[...p,"Assistant: Creating agent..."]);
        addLog("[AGENT] Writing configuration file...");

        const result = await invoke("create_agent_file",{
          name: pendingAgent.name || "custom_agent",
          content: JSON.stringify(pendingAgent, null, 2)
        }) as string;

        setMessages(p=>[...p,`Assistant: ✅ ${result}`]);
        addLog("[OPENCLAW] ✅ Agent file written");

        // Restart OpenClaw to load agent
        setMessages(p=>[...p,"Assistant: Restarting OpenClaw..."]);
        addLog("[OPENCLAW] Terminating existing process...");

        try {
          await invoke("run_command",{
            cmd: "taskkill /F /IM node.exe /FI \"WINDOWTITLE eq OpenClaw*\""
          });
          addLog("[OPENCLAW] Process terminated");
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch {
          addLog("[OPENCLAW] No existing process found");
        }

        addLog("[OPENCLAW] Starting new process...");
        await invoke("run_command",{
          cmd: "cd " + OPENCLAW_PATH + " && start /B npm start"
        });

        setMessages(p=>[...p,"Assistant: ✅ OpenClaw restarted! Agent is now active."]);
        addLog("[OPENCLAW] ✅ Restarted successfully - agent loaded");

      }catch(err){

        console.error("Agent creation error:", err);
        const errorMsg = err instanceof Error ? err.message : String(err);
        setMessages(p=>[...p,`Assistant: ❌ Agent deploy failed: ${errorMsg}`]);
        addLog(`❌ Error: ${errorMsg}`);

      }

      setPendingAgent(null);
      return;
    }

    if(pendingAgent && lower === "no"){
      addLog("[APPROVAL] ❌ User cancelled agent creation");
      addMessage("Assistant: Agent creation cancelled.");
      setPendingAgent(null);
      return;
    }

    if(pendingAgent && lower !== "yes" && lower !== "no"){
      addMessage("Assistant: Please reply with only 'yes' or 'no' for the current agent preview.");
      addMessage("Assistant: Type 'yes' to create it, or 'no' to cancel.");
      return;
    }

    // ===================================
    // LINKEDIN POST APPROVAL
    // ===================================

    // ===================================
    // LINKEDIN POST APPROVAL - YES
    // ===================================
    if(pendingLinkedInPost && lower === "yes"){

      try{

        addLog("[APPROVAL] ✅ User confirmed LinkedIn post");
        addMessage("Assistant: Creating LinkedIn agent...");
        addLog("[AGENT] Building agent configuration...");

        // Create agent configuration
        const agentConfig = {
          name: "LinkedIn AI Poster",
          description: "AI-generated LinkedIn content",
          schedule: "daily",
          schedule_time: "09:00",
          enabled: true,
          command: "node",
          args: [
            PROJECT_PATH + "/linkedin_bot.js",
            pendingLinkedInPost
          ],
          working_directory: PROJECT_PATH,
          timeout: 300000,
          metadata: {
            created_at: new Date().toISOString(),
            created_by: "Personaliz Assistant"
          }
        };

        // Step 1: Create agent file
        addLog("[OPENCLAW] Writing agent file...");
        
        const createResult = await invoke("create_agent_file", {
          name: agentConfig.name,
          content: JSON.stringify(agentConfig, null, 2)
        }) as string;

        addMessage(`Assistant: ✅ ${createResult}`);
        addLog("[OPENCLAW] ✅ Agent file created");

        // Step 2: Restart OpenClaw to load new agent
        if (sandboxMode) {
          addMessage("Assistant: 🔒 SANDBOX MODE - Skipping OpenClaw restart");
          addLog("[OPENCLAW] (simulated) Would restart OpenClaw");
        } else {
          addMessage("Assistant: Restarting OpenClaw...");
          addLog("[OPENCLAW] Restarting to load new agent...");

          try {
            await invoke("run_command", {
              cmd: "taskkill /F /IM node.exe /FI \"WINDOWTITLE eq OpenClaw*\""
            });
            addLog("[OPENCLAW] Process terminated");
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch {
            // Ignore if no OpenClaw process found
            addLog("[OPENCLAW] No existing process found");
          }

          // Start OpenClaw
          addLog("[OPENCLAW] Starting new process...");
          await invoke("run_command", {
            cmd: "cd " + OPENCLAW_PATH + " && start /B npm start"
          });
          
          addLog("[OPENCLAW] ✅ Restart complete");
        }

        // Step 3: Prompt for immediate test
        addMessage("Assistant: ✅ LinkedIn agent deployed successfully!");
        addMessage(`Assistant: ${sandboxMode ? '🔒 Sandbox mode active' : 'Agent scheduled for daily execution @ 09:00'}`);
        addMessage("Assistant: Would you like to test it now? (yes/no)");
        addLog("[OPENCLAW] ✅ Setup complete - agent ready");

        // Store intent to test immediately if user says yes
        (window as any).testNow = pendingLinkedInPost;

      }catch(err){

        console.error("LinkedIn agent error:", err);
        const errorMsg = err instanceof Error ? err.message : String(err);
        setMessages(p=>[
          ...p,
          `Assistant: ❌ Error: ${errorMsg}`,
          "Assistant: Please check logs for details."
        ]);
        addLog(`❌ Error: ${errorMsg}`);

      }

      setPendingLinkedInPost(null);
      return;
    }

    if(pendingLinkedInPost && lower==="no"){
      addLog("[APPROVAL] ❌ User cancelled LinkedIn post");
      setMessages(p=>[...p,"Assistant: LinkedIn post cancelled."]);
      setPendingLinkedInPost(null);
      return;
    }

    // ===================================
    // TEST LINKEDIN BOT IMMEDIATELY
    // ===================================
    if(lower === "yes" && (window as any).testNow){
      
      const testContent = (window as any).testNow;
      delete (window as any).testNow;

      try{

        addLog("[AUTOMATION] Starting immediate test...");
        addMessage("Assistant: Starting LinkedIn bot for immediate test...");

        if (sandboxMode) {
          // Sandbox simulation - don't actually run Playwright
          addLog("[AUTOMATION] 🔒 SANDBOX MODE - Simulating execution");
          addMessage("Assistant: 🔒 SANDBOX MODE - Simulated execution:");
          addMessage("   ✓ Would open browser");
          addMessage("   ✓ Would navigate to LinkedIn");
          addMessage("   ✓ Would wait for manual login");
          addMessage("   ✓ Would fill post content");
          addMessage("   ✓ Would wait for manual approval");
          addMessage("");
          addMessage("Assistant: To run for real, disable sandbox mode:");
          addMessage("   Type: sandbox off");
          addLog("[AUTOMATION] ✅ Simulation complete");
        } else {
          // Real execution - launch Playwright
          addLog("[AUTOMATION] Launching Playwright script...");

          // Escape quotes for command line
          const escapedText = testContent.replace(/"/g, '\\"');

          await invoke("run_command", {
            cmd: "cd " + PROJECT_PATH + " && start cmd /k node linkedin_bot.js \"" + escapedText + "\""
          });

          addMessage("Assistant: ✅ Browser opened!");
          addMessage("Assistant: Next steps:");
          addMessage("   1. Log in to LinkedIn manually");
          addMessage("   2. Review the highlighted post content");
          addMessage("   3. Click 'Post' button when ready");
          addMessage("   4. Or close browser to cancel");
          addLog("[AUTOMATION] ✅ Playwright running - browser launched");
        }

      } catch (err) {
        handleError("LinkedIn Bot Test", err);
        addMessage("Assistant: 💡 Troubleshooting:");
        addMessage("   • Make sure Playwright is installed: npx playwright install chromium");
        addMessage("   • Verify linkedin_bot.js exists in project folder");
      }

      return;
    }

    // ===================================
    // CREATE LINKEDIN POST
    // ===================================

    if(lower.includes("linkedin post") || lower.includes("post to linkedin")){

      addLog("[LINKEDIN] Starting post generation flow...");
      setMessages(p=>[...p,"Assistant: Generating LinkedIn post..."]);

      try{

        addLog("[LLM] Sending request to Ollama (phi3)...");

        const response = await fetch("http://localhost:11434/api/generate",{
          method:"POST",
          headers:{ "Content-Type":"application/json" },
          body:JSON.stringify({
            model:"phi3",
            prompt:`Generate a professional LinkedIn post based on this request:
${userInput}

Requirements:
- Professional tone
- Include relevant emojis
- Add 3-5 hashtags
- Keep it under 200 words
- Make it engaging

Return ONLY the post text, no explanations.`,
            stream:false
          })
        });

        const data = await response.json();
        addLog("[LLM] ✅ Post content generated");
        
        const generatedPost = data.response.trim();

        setPendingLinkedInPost(generatedPost);
        addLog("[LINKEDIN] Preview ready - awaiting approval");

        setMessages(p=>[
          ...p,
          "Assistant: LinkedIn Post Preview:",
          "─".repeat(50),
          generatedPost,
          "─".repeat(50),
          "Assistant: Approve to post? (yes/no)"
        ]);

      }catch(err){

        console.error("LINKEDIN POST ERROR:",err);
        setMessages(p=>[...p,"Assistant: Failed to generate LinkedIn post"]);

      }

      return;
    }

    // ===================================
    // NORMAL CHAT (LOCAL AI)
    // ===================================

    try{

      const response = await fetch("http://localhost:11434/api/generate",{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({
          model:"phi3",
          prompt:`You are Personaliz Desktop Assistant.\n${userInput}`,
          stream:false
        })
      });

      const data = await response.json();

      setMessages(p=>[...p,"Assistant: "+data.response]);

    }catch(err){

      console.error(err);
      setMessages(p=>[...p,"Assistant: AI error"]);

    }

  };

  return(

    <div>

      {/* Floating Button */}
      <button
        onClick={()=>setChatOpen(!chatOpen)}
        style={{
          position:"fixed",
          bottom:20,
          right:20,
          width:60,
          height:60,
          borderRadius:"50%",
          background:"#0066cc",
          color:"white",
          border:"none",
          cursor:"pointer",
          fontSize:24
        }}
      >
        🤖
      </button>

      {/* Settings Button */}
      <button
        onClick={()=>setSettingsOpen(!settingsOpen)}
        style={{
          position:"fixed",
          bottom:20,
          right:100,
          width:60,
          height:60,
          borderRadius:"50%",
          background:"#666",
          color:"white",
          border:"none",
          cursor:"pointer",
          fontSize:24
        }}
      >
        ⚙️
      </button>

      {/* Settings Panel */}
      {settingsOpen && (
        <div style={{
          position:"fixed",
          top:"50%",
          left:"50%",
          transform:"translate(-50%, -50%)",
          width:500,
          background:"white",
          border:"2px solid black",
          padding:20,
          zIndex:1000,
          boxShadow:"0 4px 20px rgba(0,0,0,0.3)"
        }}>
          <h2>⚙️ Settings</h2>
          
          <div style={{marginBottom:15}}>
            <label><b>LLM Provider:</b></label><br/>
            <select 
              value={llmProvider} 
              onChange={(e)=>setLlmProvider(e.target.value)}
              style={{width:"100%", padding:5}}
            >
              <option value="local">Local (Ollama/Phi3)</option>
              <option value="openai">OpenAI</option>
              <option value="claude">Claude (Anthropic)</option>
            </select>
          </div>

          {llmProvider !== "local" && (
            <div style={{marginBottom:15}}>
              <label><b>API Key:</b></label><br/>
              <input 
                type="password"
                value={llmApiKey}
                onChange={(e)=>setLlmApiKey(e.target.value)}
                placeholder="Enter your API key"
                style={{width:"100%", padding:5}}
              />
            </div>
          )}

          <div style={{marginBottom:15}}>
            <label><b>Model:</b></label><br/>
            <input 
              value={llmModel}
              onChange={(e)=>setLlmModel(e.target.value)}
              placeholder={llmProvider === "local" ? "phi3" : llmProvider === "openai" ? "gpt-4" : "claude-3-opus-20240229"}
              style={{width:"100%", padding:5}}
            />
            <small style={{color:"#666"}}>
              {llmProvider === "local" && "Example: phi3, llama2"}
              {llmProvider === "openai" && "Example: gpt-4, gpt-3.5-turbo"}
              {llmProvider === "claude" && "Example: claude-3-opus-20240229"}
            </small>
          </div>

          {llmProvider === "local" && (
            <div style={{marginBottom:15}}>
              <label><b>Endpoint:</b></label><br/>
              <input 
                value={llmEndpoint}
                onChange={(e)=>setLlmEndpoint(e.target.value)}
                style={{width:"100%", padding:5}}
              />
            </div>
          )}

          <div style={{marginBottom:15, padding:10, background:"#f0f0f0", borderRadius:5}}>
            <b>Current Status:</b><br/>
            Provider: {llmProvider}<br/>
            Model: {llmModel}<br/>
            {llmProvider !== "local" && `API Key: ${llmApiKey ? "✅ Set" : "❌ Not set"}`}
          </div>

          {dependencies && (
            <div style={{marginBottom:15, padding:10, background:"#e8f4f8", borderRadius:5}}>
              <b>System:</b><br/>
              OS: {dependencies.os} | Node: {dependencies.node ? dependencies.node_version : "❌"} | Ollama: {dependencies.ollama ? "✅" : "❌"}
            </div>
          )}

          <button onClick={saveSettings} style={{marginRight:10, padding:"10px 20px", background:"#0066cc", color:"white", border:"none", borderRadius:5, cursor:"pointer"}}>
            Save Settings
          </button>
          <button onClick={()=>setSettingsOpen(false)} style={{padding:"10px 20px", background:"#ccc", border:"none", borderRadius:5, cursor:"pointer"}}>
            Cancel
          </button>
        </div>
      )}

      {chatOpen &&(

        <div style={{
          position:"fixed",
          bottom:90,
          right:20,
          width:400,
          background:"white",
          border:"1px solid black",
          padding:20
        }}>

          <h3>
            Personaliz Assistant 
            {sandboxMode && <span style={{color:"orange",fontSize:14}}> 🔒 SANDBOX</span>}
            {llmProvider !== "local" && <span style={{color:"green",fontSize:12}}> 🌐 {llmProvider.toUpperCase()}</span>}
          </h3>

          {/* Chat Messages */}
          <div style={{height:200,overflowY:"auto",border:"1px solid gray", padding:5}}>
            {messages.map((m,i)=><p key={i} style={{margin:"5px 0", fontSize:13}}>{m}</p>)}
          </div>

          {/* Logs */}
          <div style={{height:100,overflowY:"auto",border:"1px solid black", padding:5}}>
            <b>Logs</b>
            {logs.map((l,i)=><p key={i} style={{margin:"2px 0", fontSize:11, fontFamily:"monospace"}}>{l}</p>)}
          </div>

          <input
            value={input}
            onChange={e=>setInput(e.target.value)}
            onKeyPress={e=>e.key==="Enter"&&sendMessage()}
            placeholder="Type a command..."
            style={{width:"70%", padding:5, marginTop:5}}
          />

          <button onClick={sendMessage} style={{padding:5, marginLeft:5}}>Send</button>

        </div>

      )}

      {/* Agents View Panel */}
      {agentsView && (
        <div style={{
          position:"fixed",
          top:"50%",
          left:"50%",
          transform:"translate(-50%, -50%)",
          width:700,
          maxHeight:"80vh",
          background:"white",
          border:"2px solid black",
          padding:20,
          zIndex:1000,
          boxShadow:"0 4px 20px rgba(0,0,0,0.3)",
          overflowY:"auto"
        }}>
          <h2>📋 Agent Database</h2>
          <p style={{color:"#666"}}>All agents stored in SQLite database</p>
          
          {dbAgents.length === 0 ? (
            <p>No agents found in database.</p>
          ) : (
            <div style={{marginTop:20}}>
              {dbAgents.map((agent: any) => (
                <div key={agent.id} style={{
                  border:"1px solid #ddd",
                  padding:15,
                  marginBottom:10,
                  borderRadius:5,
                  background:"#f9f9f9"
                }}>
                  <h3 style={{margin:"0 0 10px 0"}}>{agent.name}</h3>
                  {agent.description && <p style={{margin:"5px 0"}}><b>Description:</b> {agent.description}</p>}
                  {agent.role && <p style={{margin:"5px 0"}}><b>Role:</b> {agent.role}</p>}
                  {agent.goal && <p style={{margin:"5px 0"}}><b>Goal:</b> {agent.goal}</p>}
                  <p style={{margin:"5px 0"}}><b>Schedule:</b> {agent.schedule} {agent.schedule_time && `at ${agent.schedule_time}`}</p>
                  <p style={{margin:"5px 0"}}><b>Command:</b> {agent.command}</p>
                  <p style={{margin:"5px 0", fontSize:11, color:"#666"}}>
                    Created: {new Date(agent.created_at).toLocaleString()}
                  </p>
                  <p style={{margin:"5px 0"}}>
                    <span style={{
                      background: agent.is_active ? "#4CAF50" : "#999",
                      color:"white",
                      padding:"2px 8px",
                      borderRadius:3,
                      fontSize:11
                    }}>
                      {agent.is_active ? "✓ ACTIVE" : "INACTIVE"}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          )}
          
          <button onClick={()=>setAgentsView(false)} style={{marginTop:20, padding:"10px 20px"}}>
            Close
          </button>
        </div>
      )}

      {/* Event Handlers View Panel */}
      {eventHandlersView && (
        <div style={{
          position:"fixed",
          top:"50%",
          left:"50%",
          transform:"translate(-50%, -50%)",
          width:700,
          maxHeight:"80vh",
          background:"white",
          border:"2px solid black",
          padding:20,
          zIndex:1000,
          boxShadow:"0 4px 20px rgba(0,0,0,0.3)",
          overflowY:"auto"
        }}>
          <h2>⚡ Event Handlers</h2>
          <p style={{color:"#666"}}>Periodic polling and event detection</p>
          
          {eventHandlers.length === 0 ? (
            <p>No event handlers configured. Type: "create event for [name]"</p>
          ) : (
            <div style={{marginTop:20}}>
              {eventHandlers.map((handler: any) => (
                <div key={handler.id} style={{
                  border:"1px solid #ddd",
                  padding:15,
                  marginBottom:10,
                  borderRadius:5,
                  background:"#f0f8ff"
                }}>
                  <h3 style={{margin:"0 0 10px 0"}}>{handler.name}</h3>
                  <p style={{margin:"5px 0"}}><b>Type:</b> {handler.event_type}</p>
                  {handler.url && <p style={{margin:"5px 0"}}><b>URL:</b> {handler.url}</p>}
                  <p style={{margin:"5px 0"}}><b>Interval:</b> Every {handler.interval_seconds} seconds</p>
                  {handler.last_check && (
                    <p style={{margin:"5px 0", fontSize:11, color:"#666"}}>
                      Last checked: {new Date(handler.last_check).toLocaleString()}
                    </p>
                  )}
                  <p style={{margin:"5px 0"}}>
                    <span style={{
                      background: handler.is_active ? "#2196F3" : "#999",
                      color:"white",
                      padding:"2px 8px",
                      borderRadius:3,
                      fontSize:11
                    }}>
                      {handler.is_active ? "✓ POLLING" : "STOPPED"}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          )}
          
          <button onClick={()=>setEventHandlersView(false)} style={{marginTop:20, padding:"10px 20px"}}>
            Close
          </button>
        </div>
      )}

    </div>
  );
}
