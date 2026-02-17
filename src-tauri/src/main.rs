// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod database;
mod event_poller;

use std::process::Command;
use std::fs;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use serde::{Deserialize, Serialize};
use database::{Database, Agent, AgentLog, EventHandler};
use event_poller::EventPoller;

#[derive(Serialize, Deserialize, Default)]
struct AppSettings {
    llm_provider: String,     // "local" or "openai" or "claude"
    llm_api_key: String,
    llm_model: String,        // e.g., "gpt-4", "claude-3", "phi3"
    llm_endpoint: String,
}

fn get_settings_path() -> PathBuf {
    let home = std::env::var("USERPROFILE").unwrap_or_else(|_| ".".to_string());
    PathBuf::from(home).join(".personaliz").join("settings.json")
}

#[tauri::command]
fn run_command(cmd: String) -> Result<String, String> {

    let output = Command::new("cmd")
        .args(["/C", &cmd])
        .output()
        .map_err(|e| format!("Failed to execute command: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Command failed: {}", stderr));
    }

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    Ok(stdout)
}

#[tauri::command]
fn create_agent_file(name: String, content: String, db: tauri::State<Arc<Mutex<Database>>>) -> Result<String, String> {

    // Create .agents directory if it doesn't exist
    let agents_dir = "C:\\Users\\manoh\\openclaw\\.agents";
    fs::create_dir_all(agents_dir)
        .map_err(|e| format!("Failed to create .agents directory: {}", e))?;

    // Generate filename from agent name
    let filename = name.replace(" ", "_").to_lowercase();
    let path = format!("{}\\{}.json", agents_dir, filename);

    fs::write(&path, &content)
        .map_err(|e| format!("Failed to write agent file: {}", e))?;

    // Also store in database
    if let Ok(config_data) = serde_json::from_str::<serde_json::Value>(&content) {
        let agent = Agent {
            id: None,
            name: name.clone(),
            description: config_data.get("metadata").and_then(|m| m.get("description")).and_then(|d| d.as_str()).map(String::from),
            role: config_data.get("metadata").and_then(|m| m.get("role")).and_then(|r| r.as_str()).map(String::from),
            goal: config_data.get("metadata").and_then(|m| m.get("goal")).and_then(|g| g.as_str()).map(String::from),
            tools: None,
            schedule: config_data.get("schedule").and_then(|s| s.as_str()).unwrap_or("daily").to_string(),
            schedule_time: config_data.get("schedule_time").and_then(|t| t.as_str()).map(String::from),
            command: config_data.get("command").and_then(|c| c.as_str()).unwrap_or("node").to_string(),
            args: config_data.get("args").map(|a| a.to_string()).unwrap_or_else(|| "[]".to_string()),
            timeout: config_data.get("timeout").and_then(|t| t.as_i64()).unwrap_or(300000),
            config_json: content,
            created_at: String::new(),
            updated_at: String::new(),
            is_active: true,
        };

        let db_lock = db.lock().unwrap();
        let _ = db_lock.create_agent(&agent); // Ignore errors if agent already exists
    }

    Ok(format!("Agent file created: {}", path))
}

#[tauri::command]
fn save_settings(
    llm_provider: String,
    llm_api_key: String,
    llm_model: String,
    llm_endpoint: String,
) -> Result<String, String> {
    let settings = AppSettings {
        llm_provider,
        llm_api_key,
        llm_model,
        llm_endpoint,
    };

    let settings_path = get_settings_path();
    
    // Create directory if needed
    if let Some(parent) = settings_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create settings directory: {}", e))?;
    }

    let json = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;

    fs::write(&settings_path, json)
        .map_err(|e| format!("Failed to write settings: {}", e))?;

    Ok("Settings saved successfully".to_string())
}

#[tauri::command]
fn load_settings() -> Result<String, String> {
    let settings_path = get_settings_path();

    if !settings_path.exists() {
        // Return default settings
        let default_settings = AppSettings {
            llm_provider: "local".to_string(),
            llm_api_key: "".to_string(),
            llm_model: "phi3".to_string(),
            llm_endpoint: "http://localhost:11434/api/generate".to_string(),
        };
        
        let json = serde_json::to_string(&default_settings)
            .map_err(|e| format!("Failed to serialize default settings: {}", e))?;
        
        return Ok(json);
    }

    let content = fs::read_to_string(&settings_path)
        .map_err(|e| format!("Failed to read settings: {}", e))?;

    Ok(content)
}

#[tauri::command]
fn check_dependencies() -> Result<String, String> {
    use serde_json::json;

    let mut checks = json!({
        "os": std::env::consts::OS,
        "node": false,
        "npm": false,
        "playwright": false,
        "ollama": false,
        "openclaw": false,
        "node_version": "",
        "npm_version": "",
    });

    // Check Node.js
    if let Ok(output) = Command::new("node").arg("--version").output() {
        if output.status.success() {
            checks["node"] = json!(true);
            checks["node_version"] = json!(String::from_utf8_lossy(&output.stdout).trim());
        }
    }

    // Check npm
    if let Ok(output) = Command::new("npm").arg("--version").output() {
        if output.status.success() {
            checks["npm"] = json!(true);
            checks["npm_version"] = json!(String::from_utf8_lossy(&output.stdout).trim());
        }
    }

    // Check Playwright
    let home = std::env::var("USERPROFILE").unwrap_or_else(|_| ".".to_string());
    let playwright_path = PathBuf::from(&home)
        .join("AppData")
        .join("Local")
        .join("ms-playwright");
    checks["playwright"] = json!(playwright_path.exists());

    // Check Ollama
    if let Ok(output) = Command::new("ollama").arg("list").output() {
        checks["ollama"] = json!(output.status.success());
    }

    // Check OpenClaw
    let openclaw_path = PathBuf::from("C:\\Users\\manoh\\openclaw");
    checks["openclaw"] = json!(openclaw_path.exists());

    serde_json::to_string(&checks)
        .map_err(|e| format!("Failed to serialize dependency checks: {}", e))
}

// Database commands
#[tauri::command]
fn db_create_agent(
    name: String,
    description: Option<String>,
    role: Option<String>,
    goal: Option<String>,
    tools: Option<String>,
    schedule: String,
    schedule_time: Option<String>,
    command: String,
    args: String,
    timeout: i64,
    config_json: String,
    db: tauri::State<Arc<Mutex<Database>>>,
) -> Result<String, String> {
    let agent = Agent {
        id: None,
        name,
        description,
        role,
        goal,
        tools,
        schedule,
        schedule_time,
        command,
        args,
        timeout,
        config_json,
        created_at: String::new(),
        updated_at: String::new(),
        is_active: true,
    };

    let db_lock = db.lock().unwrap();
    let id = db_lock.create_agent(&agent)
        .map_err(|e| format!("Failed to create agent: {}", e))?;

    Ok(serde_json::json!({"id": id, "message": "Agent created successfully"}).to_string())
}

#[tauri::command]
fn db_get_all_agents(db: tauri::State<Arc<Mutex<Database>>>) -> Result<String, String> {
    let db_lock = db.lock().unwrap();
    let agents = db_lock.get_all_agents()
        .map_err(|e| format!("Failed to get agents: {}", e))?;

    serde_json::to_string(&agents)
        .map_err(|e| format!("Failed to serialize agents: {}", e))
}

#[tauri::command]
fn db_get_agent_by_name(name: String, db: tauri::State<Arc<Mutex<Database>>>) -> Result<String, String> {
    let db_lock = db.lock().unwrap();
    let agent = db_lock.get_agent_by_name(&name)
        .map_err(|e| format!("Failed to get agent: {}", e))?;

    serde_json::to_string(&agent)
        .map_err(|e| format!("Failed to serialize agent: {}", e))
}

#[tauri::command]
fn db_log_agent_event(
    agent_id: i64,
    agent_name: String,
    event_type: String,
    message: String,
    details: Option<String>,
    db: tauri::State<Arc<Mutex<Database>>>,
) -> Result<String, String> {
    let log = AgentLog {
        id: None,
        agent_id,
        agent_name,
        event_type,
        message,
        details,
        timestamp: String::new(),
    };

    let db_lock = db.lock().unwrap();
    let id = db_lock.log_agent_event(&log)
        .map_err(|e| format!("Failed to log event: {}", e))?;

    Ok(serde_json::json!({"id": id, "message": "Event logged"}).to_string())
}

#[tauri::command]
fn db_get_agent_logs(
    agent_id: Option<i64>,
    limit: i64,
    db: tauri::State<Arc<Mutex<Database>>>,
) -> Result<String, String> {
    let db_lock = db.lock().unwrap();
    let logs = db_lock.get_agent_logs(agent_id, limit)
        .map_err(|e| format!("Failed to get logs: {}", e))?;

    serde_json::to_string(&logs)
        .map_err(|e| format!("Failed to serialize logs: {}", e))
}

#[tauri::command]
fn db_create_event_handler(
    name: String,
    event_type: String,
    url: Option<String>,
    interval_seconds: i64,
    config_json: String,
    db: tauri::State<Arc<Mutex<Database>>>,
) -> Result<String, String> {
    let handler = EventHandler {
        id: None,
        name,
        event_type,
        url,
        interval_seconds,
        last_check: None,
        is_active: true,
        config_json,
    };

    let db_lock = db.lock().unwrap();
    let id = db_lock.create_event_handler(&handler)
        .map_err(|e| format!("Failed to create event handler: {}", e))?;

    Ok(serde_json::json!({"id": id, "message": "Event handler created"}).to_string())
}

#[tauri::command]
fn db_get_all_event_handlers(db: tauri::State<Arc<Mutex<Database>>>) -> Result<String, String> {
    let db_lock = db.lock().unwrap();
    let handlers = db_lock.get_all_event_handlers()
        .map_err(|e| format!("Failed to get event handlers: {}", e))?;

    serde_json::to_string(&handlers)
        .map_err(|e| format!("Failed to serialize event handlers: {}", e))
}

#[tauri::command]
fn start_event_poller(poller: tauri::State<Arc<EventPoller>>) -> Result<String, String> {
    poller.start();
    Ok("Event poller started".to_string())
}

#[tauri::command]
fn stop_event_poller(poller: tauri::State<Arc<EventPoller>>) -> Result<String, String> {
    poller.stop();
    Ok("Event poller stopped".to_string())
}

#[tauri::command]
fn run_browser_script(script_name: String, args: Vec<String>) -> Result<String, String> {
    // Get project root (parent of src-tauri)
    let project_dir = std::env::current_dir()
        .map_err(|e| format!("Failed to get current directory: {}", e))?
        .parent()
        .ok_or("Failed to get project root")?
        .to_path_buf();
    
    let script_path = project_dir.join(&script_name);
    
    if !script_path.exists() {
        return Err(format!("Script not found: {}", script_name));
    }

    // Build command arguments
    let mut cmd_args = vec![script_path.to_str().unwrap().to_string()];
    cmd_args.extend(args);

    // Run in detached mode so it doesn't block
    let _ = Command::new("node")
        .args(&cmd_args)
        .spawn()
        .map_err(|e| format!("Failed to start script: {}", e))?;

    Ok(format!("Started {} in background", script_name))
}

fn main() {
    // Initialize database
    let db = Database::new().expect("Failed to initialize database");
    let db_arc = Arc::new(Mutex::new(db));

    // Initialize event poller (don't start automatically to avoid blocking)
    let event_poller = Arc::new(EventPoller::new(Arc::clone(&db_arc)));

    // Event poller can be started manually with start_event_poller command
    // event_poller.start();

    tauri::Builder::default()
        .manage(db_arc)
        .manage(event_poller)
        .invoke_handler(tauri::generate_handler![
            run_command,
            create_agent_file,
            save_settings,
            load_settings,
            check_dependencies,
            db_create_agent,
            db_get_all_agents,
            db_get_agent_by_name,
            db_log_agent_event,
            db_get_agent_logs,
            db_create_event_handler,
            db_get_all_event_handlers,
            start_event_poller,
            stop_event_poller,
            run_browser_script
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
