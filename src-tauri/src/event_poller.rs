use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use crate::database::{Database, EventHandler};

pub struct EventPoller {
    db: Arc<Mutex<Database>>,
    running: Arc<Mutex<bool>>,
}

impl EventPoller {
    pub fn new(db: Arc<Mutex<Database>>) -> Self {
        EventPoller {
            db,
            running: Arc::new(Mutex::new(false)),
        }
    }

    pub fn start(&self) {
        let running = Arc::clone(&self.running);
        let db = Arc::clone(&self.db);

        // Set running flag
        {
            let mut r = running.lock().unwrap();
            *r = true;
        }

        // Spawn polling thread
        thread::spawn(move || {
            loop {
                // Check if we should stop
                {
                    let r = running.lock().unwrap();
                    if !*r {
                        break;
                    }
                }

                // Get all active event handlers
                let handlers = {
                    let db_lock = db.lock().unwrap();
                    match db_lock.get_all_event_handlers() {
                        Ok(h) => h,
                        Err(e) => {
                            eprintln!("Error getting event handlers: {}", e);
                            vec![]
                        }
                    }
                };

                // Process each handler
                for handler in handlers {
                    Self::process_event_handler(&db, &handler);
                }

                // Sleep for 10 seconds before next poll
                thread::sleep(Duration::from_secs(10));
            }
        });
    }

    pub fn stop(&self) {
        let mut running = self.running.lock().unwrap();
        *running = false;
    }

    fn process_event_handler(db: &Arc<Mutex<Database>>, handler: &EventHandler) {
        // Check if enough time has passed since last check
        let should_check = if let Some(ref last_check) = handler.last_check {
            // Parse last check time
            if let Ok(last_time) = chrono::DateTime::parse_from_rfc3339(last_check) {
                let now = chrono::Utc::now();
                let elapsed = now.signed_duration_since(last_time.with_timezone(&chrono::Utc));
                elapsed.num_seconds() >= handler.interval_seconds
            } else {
                true // If we can't parse, check anyway
            }
        } else {
            true // First check
        };

        if !should_check {
            return;
        }

        println!("[EventPoller] Checking event handler: {}", handler.name);

        // Process based on event type
        match handler.event_type.as_str() {
            "polling" => {
                if let Some(ref url) = handler.url {
                    Self::check_url(url);
                }
            }
            "web" => {
                if let Some(ref url) = handler.url {
                    Self::check_web_event(url);
                }
            }
            "periodic" => {
                println!("[EventPoller] Periodic check for: {}", handler.name);
                // Trigger periodic action
            }
            _ => {
                eprintln!("Unknown event type: {}", handler.event_type);
            }
        }

        // Update last check time
        if let Some(id) = handler.id {
            let db_lock = db.lock().unwrap();
            if let Err(e) = db_lock.update_event_handler_last_check(id) {
                eprintln!("Error updating last check: {}", e);
            }
        }
    }

    fn check_url(url: &str) {
        // Simple HTTP check (could be enhanced with reqwest crate)
        println!("[EventPoller] Polling URL: {}", url);
        // For now, just log. In production, use reqwest to make HTTP request
    }

    fn check_web_event(url: &str) {
        // Check for web events
        println!("[EventPoller] Checking web event at: {}", url);
        // Could fetch and parse HTML/JSON for events
    }
}

impl Drop for EventPoller {
    fn drop(&mut self) {
        self.stop();
    }
}
