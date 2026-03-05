/**
 * Core data types for MCP Newsfeed.
 *
 * RawEvent   – normalised event captured from any MCP data source.
 * RankedEvent – RawEvent enriched with AI-generated metadata.
 */

export type EventSource =
  | "github"
  | "notion"
  | "google_calendar"
  | "email"
  | "slack"
  | "jira"
  | "custom";

export type EventCategory =
  | "code_review"
  | "issue"
  | "meeting"
  | "notification"
  | "task"
  | "email"
  | "document"
  | "other";

export type ActionType =
  | "review_pr"
  | "fix_bug"
  | "join_meeting"
  | "reply_email"
  | "read_document"
  | "approve"
  | "merge_pr"
  | "ignore"
  | "snooze"
  | "none";

/** Raw event as collected from a MCP data source. */
export interface RawEvent {
  id: string;
  source: EventSource;
  title: string;
  body?: string;
  url?: string;
  author?: string;
  /** ISO 8601 string */
  createdAt: string;
  /** ISO 8601 string */
  updatedAt: string;
  /** Source-specific metadata */
  metadata?: Record<string, unknown>;
}

/** AI-ranked event returned from the LLM pipeline. */
export interface RankedEvent extends RawEvent {
  /** Importance score from 1 (least) to 10 (most important) */
  score: number;
  /** One-sentence AI-generated summary */
  summary: string;
  /** Recommended action the user should take */
  actionType: ActionType;
  /** Classification labels */
  tags: string[];
  /** Category grouping */
  category: EventCategory;
  /** Whether the user has acted on this event */
  isActedOn?: boolean;
  /** When the AI ranking was produced (ISO 8601) */
  rankedAt: string;
}

/** MCP connector configuration stored per user. */
export interface MCPConnectorConfig {
  id: string;
  source: EventSource;
  label: string;
  enabled: boolean;
  /** Auth token / API key (stored securely, never logged) */
  token?: string;
  /** Polling interval in minutes */
  pollIntervalMinutes: number;
  /** Extra connector-specific options */
  options?: Record<string, unknown>;
}

/** Application settings persisted to local storage / Tauri store. */
export interface AppSettings {
  geminiApiKey?: string;
  claudeApiKey?: string;
  activeModel: "gemini" | "claude";
  connectors: MCPConnectorConfig[];
  userPreferences?: string;
  theme: "light" | "dark" | "system";
}

/** Payload sent to the IPC action handler. */
export interface ActionPayload {
  eventId: string;
  source: EventSource;
  actionType: ActionType;
  /** Extra arguments (e.g. branch name, comment text) */
  args?: Record<string, unknown>;
}

/** Response from the IPC action handler. */
export interface ActionResult {
  success: boolean;
  message?: string;
}
