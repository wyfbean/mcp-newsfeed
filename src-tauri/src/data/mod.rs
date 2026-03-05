// src-tauri/src/data/mod.rs
//! Shared data structures mirroring the TypeScript types.

use serde::{Deserialize, Serialize};

/// Source of a raw event (mirrors TypeScript `EventSource`).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "snake_case")]
pub enum EventSource {
    Github,
    Notion,
    GoogleCalendar,
    Email,
    Slack,
    Jira,
    Custom,
}

/// Category of an event (mirrors TypeScript `EventCategory`).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum EventCategory {
    CodeReview,
    Issue,
    Meeting,
    Notification,
    Task,
    Email,
    Document,
    Other,
}

/// Recommended action for a ranked event.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ActionType {
    ReviewPr,
    FixBug,
    JoinMeeting,
    ReplyEmail,
    ReadDocument,
    Approve,
    MergePr,
    Ignore,
    Snooze,
    None,
}

/// Normalised event collected from a data source.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawEvent {
    pub id: String,
    pub source: EventSource,
    pub title: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub body: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub author: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

/// AI-enriched event.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RankedEvent {
    #[serde(flatten)]
    pub raw: RawEvent,
    /// Importance score 1-10.
    pub score: u8,
    /// One-sentence AI summary.
    pub summary: String,
    pub action_type: ActionType,
    pub tags: Vec<String>,
    pub category: EventCategory,
    pub ranked_at: String,
}

/// Payload sent from the frontend when a user triggers an action.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ActionPayload {
    pub event_id: String,
    pub source: EventSource,
    pub action_type: ActionType,
}

/// Result returned to the frontend after an action is dispatched.
#[derive(Debug, Serialize)]
pub struct ActionResult {
    pub success: bool,
    pub message: Option<String>,
}
