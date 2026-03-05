/**
 * POST /api/action
 *
 * Dispatches a user action (merge PR, reply email, etc.) through the
 * appropriate MCP connector.
 *
 * Body: ActionPayload
 */
import { NextRequest, NextResponse } from "next/server";
import type { ActionPayload, ActionResult } from "@/lib/types";

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

  // In a full implementation each source would delegate to the appropriate
  // MCP connector.  For now we log and return a success stub so the UI
  // interaction chain is fully exercisable.
  console.log(`[action] ${actionType} on ${source}:${eventId}`, payload.args);

  // TODO: route to real MCP connector based on `source`
  // e.g. if (source === "github") { await githubConnector.performAction(payload); }

  return NextResponse.json({
    success: true,
    message: `Action "${actionType}" dispatched for event ${eventId}`,
  });
}
