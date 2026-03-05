/**
 * POST /api/action
 *
 * Dispatches a user action (merge PR, reply email, etc.) through the
 * appropriate MCP connector.
 *
 * Body: ActionPayload
 */
import { NextRequest, NextResponse } from "next/server";
import type { ActionPayload, ActionResult, ActionType, EventSource } from "@/lib/types";

const VALID_SOURCES: EventSource[] = [
  "github", "notion", "google_calendar", "email", "slack", "jira", "custom",
];
const VALID_ACTION_TYPES: ActionType[] = [
  "review_pr", "fix_bug", "join_meeting", "reply_email", "read_document",
  "approve", "merge_pr", "ignore", "snooze", "none",
];

export async function POST(
  req: NextRequest
): Promise<NextResponse<ActionResult>> {
  let payload: ActionPayload;
  try {
    payload = (await req.json()) as ActionPayload;
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { eventId, source, actionType } = payload;

  if (!eventId || !source || !actionType) {
    return NextResponse.json(
      { success: false, message: "Missing required fields: eventId, source, actionType" },
      { status: 400 }
    );
  }

  // Validate enum values to prevent injection of arbitrary strings
  if (!VALID_SOURCES.includes(source)) {
    return NextResponse.json(
      { success: false, message: `Invalid source: ${source}` },
      { status: 400 }
    );
  }
  if (!VALID_ACTION_TYPES.includes(actionType)) {
    return NextResponse.json(
      { success: false, message: `Invalid actionType: ${actionType}` },
      { status: 400 }
    );
  }

  // In a full implementation each source would delegate to the appropriate
  // MCP connector.  For now we log and return a success stub so the UI
  // interaction chain is fully exercisable.
  console.log(`[action] ${actionType} on ${source}:${eventId}`);

  // TODO: route to real MCP connector based on `source`
  // e.g. if (source === "github") { await githubConnector.performAction(payload); }

  return NextResponse.json({
    success: true,
    message: `Action "${actionType}" dispatched for event ${eventId}`,
  });
}
