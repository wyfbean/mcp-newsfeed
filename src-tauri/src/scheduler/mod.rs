// src-tauri/src/scheduler/mod.rs
//! Background scheduler that periodically polls all registered MCP connectors
//! and emits `events_updated` Tauri events to the frontend WebView.

use std::time::Duration;

use tauri::{AppHandle, Emitter};

use crate::mcp::ConnectorRegistry;

/// Start the polling loop.  Runs in a detached Tokio task.
///
/// * `registry`   – shared connector registry
/// * `app`        – Tauri app handle used to emit events to the frontend
/// * `interval`   – polling interval
pub fn start_scheduler(
    registry: ConnectorRegistry,
    app: AppHandle,
    interval: Duration,
) {
    tokio::spawn(async move {
        // Small initial delay to let the UI finish loading.
        tokio::time::sleep(Duration::from_secs(5)).await;

        loop {
            tracing::info!("[scheduler] polling {} connector(s)…", registry.connectors().len());

            let mut all_events = Vec::new();
            for connector in registry.connectors() {
                match connector.fetch_events(None).await {
                    Ok(events) => {
                        tracing::info!(
                            "[scheduler] {} → {} event(s)",
                            connector.source_id(),
                            events.len()
                        );
                        all_events.extend(events);
                    }
                    Err(err) => {
                        tracing::error!(
                            "[scheduler] {} error: {}",
                            connector.source_id(),
                            err
                        );
                    }
                }
            }

            if !all_events.is_empty() {
                if let Err(e) = app.emit("events_updated", &all_events) {
                    tracing::error!("[scheduler] emit error: {e}");
                }
            }

            tokio::time::sleep(interval).await;
        }
    });
}
