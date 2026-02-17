use rusqlite::{Connection, Result};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize)]
pub struct Agent {
    pub id: Option<i64>,
    pub name: String,
    pub description: Option<String>,
    pub role: Option<String>,
    pub goal: Option<String>,
    pub tools: Option<String>, // JSON array of tools
    pub schedule: String,
    pub schedule_time: Option<String>,
    pub command: String,
    pub args: String, // JSON array of args
    pub timeout: i64,
    pub config_json: String,
    pub created_at: String,
    pub updated_at: String,
    pub is_active: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AgentLog {
    pub id: Option<i64>,
    pub agent_id: i64,
    pub agent_name: String,
    pub event_type: String, // "created", "executed", "success", "error"
    pub message: String,
    pub details: Option<String>, // JSON for additional data
    pub timestamp: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EventHandler {
    pub id: Option<i64>,
    pub name: String,
    pub event_type: String, // "polling", "web", "periodic"
    pub url: Option<String>,
    pub interval_seconds: i64,
    pub last_check: Option<String>,
    pub is_active: bool,
    pub config_json: String,
}

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new() -> Result<Self> {
        let db_path = Self::get_db_path();
        
        // Create directory if it doesn't exist
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;
        }

        let conn = Connection::open(&db_path)?;
        
        let db = Database { conn };
        db.init_tables()?;
        Ok(db)
    }

    fn get_db_path() -> PathBuf {
        let home = std::env::var("USERPROFILE")
            .unwrap_or_else(|_| ".".to_string());
        PathBuf::from(home)
            .join(".personaliz")
            .join("personaliz.db")
    }

    fn init_tables(&self) -> Result<()> {
        // Agents table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS agents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                description TEXT,
                role TEXT,
                goal TEXT,
                tools TEXT,
                schedule TEXT NOT NULL,
                schedule_time TEXT,
                command TEXT NOT NULL,
                args TEXT NOT NULL,
                timeout INTEGER NOT NULL,
                config_json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                is_active INTEGER NOT NULL DEFAULT 1
            )",
            [],
        )?;

        // Agent logs table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS agent_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                agent_id INTEGER NOT NULL,
                agent_name TEXT NOT NULL,
                event_type TEXT NOT NULL,
                message TEXT NOT NULL,
                details TEXT,
                timestamp TEXT NOT NULL,
                FOREIGN KEY (agent_id) REFERENCES agents(id)
            )",
            [],
        )?;

        // Event handlers table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS event_handlers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                event_type TEXT NOT NULL,
                url TEXT,
                interval_seconds INTEGER NOT NULL,
                last_check TEXT,
                is_active INTEGER NOT NULL DEFAULT 1,
                config_json TEXT NOT NULL
            )",
            [],
        )?;

        // Settings table (for future use)
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )",
            [],
        )?;

        Ok(())
    }

    // Agent operations
    pub fn create_agent(&self, agent: &Agent) -> Result<i64> {
        let now = chrono::Utc::now().to_rfc3339();
        
        self.conn.execute(
            "INSERT INTO agents (name, description, role, goal, tools, schedule, schedule_time, 
             command, args, timeout, config_json, created_at, updated_at, is_active)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
            rusqlite::params![
                &agent.name,
                &agent.description,
                &agent.role,
                &agent.goal,
                &agent.tools,
                &agent.schedule,
                &agent.schedule_time,
                &agent.command,
                &agent.args,
                &agent.timeout,
                &agent.config_json,
                &now,
                &now,
                agent.is_active as i64,
            ],
        )?;

        Ok(self.conn.last_insert_rowid())
    }

    pub fn get_all_agents(&self) -> Result<Vec<Agent>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, description, role, goal, tools, schedule, schedule_time, 
             command, args, timeout, config_json, created_at, updated_at, is_active 
             FROM agents ORDER BY created_at DESC"
        )?;

        let agents = stmt.query_map([], |row| {
            Ok(Agent {
                id: Some(row.get(0)?),
                name: row.get(1)?,
                description: row.get(2)?,
                role: row.get(3)?,
                goal: row.get(4)?,
                tools: row.get(5)?,
                schedule: row.get(6)?,
                schedule_time: row.get(7)?,
                command: row.get(8)?,
                args: row.get(9)?,
                timeout: row.get(10)?,
                config_json: row.get(11)?,
                created_at: row.get(12)?,
                updated_at: row.get(13)?,
                is_active: row.get(14)?,
            })
        })?;

        agents.collect()
    }

    pub fn get_agent_by_name(&self, name: &str) -> Result<Option<Agent>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, description, role, goal, tools, schedule, schedule_time, 
             command, args, timeout, config_json, created_at, updated_at, is_active 
             FROM agents WHERE name = ?1"
        )?;

        let mut agents = stmt.query_map([name], |row| {
            Ok(Agent {
                id: Some(row.get(0)?),
                name: row.get(1)?,
                description: row.get(2)?,
                role: row.get(3)?,
                goal: row.get(4)?,
                tools: row.get(5)?,
                schedule: row.get(6)?,
                schedule_time: row.get(7)?,
                command: row.get(8)?,
                args: row.get(9)?,
                timeout: row.get(10)?,
                config_json: row.get(11)?,
                created_at: row.get(12)?,
                updated_at: row.get(13)?,
                is_active: row.get(14)?,
            })
        })?;

        agents.next().transpose()
    }

    #[allow(dead_code)]
    pub fn update_agent(&self, id: i64, agent: &Agent) -> Result<()> {
        let now = chrono::Utc::now().to_rfc3339();
        
        self.conn.execute(
            "UPDATE agents SET name=?1, description=?2, role=?3, goal=?4, tools=?5, 
             schedule=?6, schedule_time=?7, command=?8, args=?9, timeout=?10, 
             config_json=?11, updated_at=?12, is_active=?13 WHERE id=?14",
            rusqlite::params![
                &agent.name,
                &agent.description,
                &agent.role,
                &agent.goal,
                &agent.tools,
                &agent.schedule,
                &agent.schedule_time,
                &agent.command,
                &agent.args,
                &agent.timeout,
                &agent.config_json,
                &now,
                agent.is_active as i64,
                &id,
            ],
        )?;

        Ok(())
    }

    #[allow(dead_code)]
    pub fn delete_agent(&self, id: i64) -> Result<()> {
        self.conn.execute("DELETE FROM agents WHERE id = ?1", [id])?;
        Ok(())
    }

    // Agent log operations
    pub fn log_agent_event(&self, log: &AgentLog) -> Result<i64> {
        let now = chrono::Utc::now().to_rfc3339();
        
        self.conn.execute(
            "INSERT INTO agent_logs (agent_id, agent_name, event_type, message, details, timestamp)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            rusqlite::params![
                &log.agent_id,
                &log.agent_name,
                &log.event_type,
                &log.message,
                &log.details,
                &now,
            ],
        )?;

        Ok(self.conn.last_insert_rowid())
    }

    pub fn get_agent_logs(&self, agent_id: Option<i64>, limit: i64) -> Result<Vec<AgentLog>> {
        let query = if let Some(id) = agent_id {
            format!(
                "SELECT id, agent_id, agent_name, event_type, message, details, timestamp FROM agent_logs WHERE agent_id = {} ORDER BY timestamp DESC LIMIT {}",
                id, limit
            )
        } else {
            format!(
                "SELECT id, agent_id, agent_name, event_type, message, details, timestamp FROM agent_logs ORDER BY timestamp DESC LIMIT {}",
                limit
            )
        };

        let mut stmt = self.conn.prepare(&query)?;

        let logs = stmt.query_map([], |row| {
            Ok(AgentLog {
                id: Some(row.get(0)?),
                agent_id: row.get(1)?,
                agent_name: row.get(2)?,
                event_type: row.get(3)?,
                message: row.get(4)?,
                details: row.get(5)?,
                timestamp: row.get(6)?,
            })
        })?;

        logs.collect()
    }

    // Event handler operations
    pub fn create_event_handler(&self, handler: &EventHandler) -> Result<i64> {
        self.conn.execute(
            "INSERT INTO event_handlers (name, event_type, url, interval_seconds, 
             last_check, is_active, config_json)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            rusqlite::params![
                &handler.name,
                &handler.event_type,
                &handler.url,
                &handler.interval_seconds,
                &handler.last_check,
                handler.is_active as i64,
                &handler.config_json,
            ],
        )?;

        Ok(self.conn.last_insert_rowid())
    }

    pub fn get_all_event_handlers(&self) -> Result<Vec<EventHandler>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, event_type, url, interval_seconds, last_check, is_active, config_json 
             FROM event_handlers WHERE is_active = 1"
        )?;

        let handlers = stmt.query_map([], |row| {
            Ok(EventHandler {
                id: Some(row.get(0)?),
                name: row.get(1)?,
                event_type: row.get(2)?,
                url: row.get(3)?,
                interval_seconds: row.get(4)?,
                last_check: row.get(5)?,
                is_active: row.get(6)?,
                config_json: row.get(7)?,
            })
        })?;

        handlers.collect()
    }

    pub fn update_event_handler_last_check(&self, id: i64) -> Result<()> {
        let now = chrono::Utc::now().to_rfc3339();
        self.conn.execute(
            "UPDATE event_handlers SET last_check = ?1 WHERE id = ?2",
            rusqlite::params![&now, &id],
        )?;
        Ok(())
    }

    #[allow(dead_code)]
    pub fn delete_event_handler(&self, id: i64) -> Result<()> {
        self.conn.execute("DELETE FROM event_handlers WHERE id = ?1", [id])?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_database_creation() {
        let db = Database::new().unwrap();
        assert!(db.get_all_agents().is_ok());
    }
}
