// src-tauri/src/mcp/mod.rs
//! MCP connector trait and registry.
//!
//! Each connector is responsible for fetching events from one data source.
//! Connectors are registered at startup and polled by the scheduler.

use std::collections::HashMap;
use std::sync::{Arc, Mutex};

use crate::data::RawEvent;

/// Error type for MCP connector failures.
#[derive(Debug, thiserror::Error)]
pub enum ConnectorError {
    #[error("HTTP error: {0}")]
    Http(#[from] reqwest::Error),
    #[error("JSON parsing error: {0}")]
    Json(#[from] serde_json::Error),
    #[error("Configuration error: {0}")]
    Config(String),
}

/// Async connector trait implemented by each data source.
#[async_trait::async_trait]
pub trait Connector: Send + Sync {
    fn source_id(&self) -> &str;
    async fn fetch_events(&self, since: Option<&str>) -> Result<Vec<RawEvent>, ConnectorError>;
}

/// Thread-safe registry of connectors keyed by `source_id`.
#[derive(Default, Clone)]
pub struct ConnectorRegistry {
    inner: Arc<Mutex<HashMap<String, Arc<dyn Connector>>>>,
}

impl ConnectorRegistry {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn register(&self, connector: Arc<dyn Connector>) {
        let mut map = self.inner.lock().unwrap();
        map.insert(connector.source_id().to_owned(), connector);
    }

    pub fn connectors(&self) -> Vec<Arc<dyn Connector>> {
        let map = self.inner.lock().unwrap();
        map.values().cloned().collect()
    }
}
