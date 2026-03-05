// src-tauri/src/lib.rs
//! Tauri application library.
//!
//! Exposes IPC commands and initialises the background scheduler.

mod data;
mod mcp;
mod scheduler;

use std::time::Duration;

use tauri::Manager;

use data::{ActionPayload, ActionResult, RankedEvent};
use mcp::ConnectorRegistry;

// ── IPC Commands ────────────────────────────────────────────────────────────

/// Smoke-test IPC command – returns a greeting string.
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {name}! MCP Newsfeed is running 🚀")
}

/// Trigger an immediate refresh of all connectors.
///
/// In production this would wake the scheduler or run a one-shot poll.
/// Here we return immediately and let the scheduler handle it on its
/// next tick.
#[tauri::command]
async fn trigger_refresh() -> Result<(), String> {
    tracing::info!("[ipc] trigger_refresh requested");
    Ok(())
}

/// Dispatch a user action through the appropriate MCP connector.
///
/// Currently returns a stub success response.  A full implementation
/// would delegate to the matching connector's `perform_action` method.
#[tauri::command]
async fn dispatch_action(payload: ActionPayload) -> Result<ActionResult, String> {
    tracing::info!(
        "[ipc] dispatch_action: {:?} on {:?}:{}",
        payload.action_type,
        payload.source,
        payload.event_id
    );
    Ok(ActionResult {
        success: true,
        message: Some(format!(
            "Action dispatched for event {}",
            payload.event_id
        )),
    })
}

/// Fetch the latest cached ranked events from the Rust side.
///
/// Returns an empty array until the scheduler populates the cache
/// (or in demo mode).
#[tauri::command]
fn get_ranked_events() -> Vec<RankedEvent> {
    vec![]
}

// ── App Builder ─────────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let registry = ConnectorRegistry::new();

            // TODO: read connector configuration from Tauri store and register
            // real connectors here.  Example:
            //
            //   if let Ok(token) = std::env::var("GITHUB_TOKEN") {
            //       registry.register(Arc::new(GitHubConnector::new(token)));
            //   }

            let poll_interval =
                std::env::var("MCP_POLL_INTERVAL_SECS")
                    .ok()
                    .and_then(|v| v.parse().ok())
                    .map(Duration::from_secs)
                    .unwrap_or(Duration::from_secs(15 * 60));

            scheduler::start_scheduler(registry, app.handle().clone(), poll_interval);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            trigger_refresh,
            dispatch_action,
            get_ranked_events,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}
