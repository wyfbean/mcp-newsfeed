/**
 * GET /api/ranked-events
 *
 * Returns AI-ranked events.  In demo/development mode (no API keys configured)
 * returns mock ranked events.  When GEMINI_API_KEY is set in the environment,
 * fetches raw events from enabled MCP connectors and runs them through the
 * Gemini ranking pipeline.
 */
import { NextResponse } from "next/server";
import { mockRankedEvents } from "@/lib/mock-data";
import type { RankedEvent } from "@/lib/types";

export async function GET(): Promise<NextResponse<RankedEvent[]>> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const githubToken = process.env.GITHUB_TOKEN;

  // If no credentials are configured, return mock data for demo mode
  if (!geminiKey) {
    return NextResponse.json(mockRankedEvents);
  }

  try {
    // Dynamically import heavy dependencies only when needed
    const { fetchAllEvents } = await import("@/lib/mcp/client");
    const { rankEvents } = await import("@/lib/llm/gemini");

    // Register connectors based on available env vars
    if (githubToken) {
      const { createGitHubConnector } = await import(
        "@/lib/mcp/connectors/github"
      );
      const { registerConnector } = await import("@/lib/mcp/client");
      registerConnector(
        createGitHubConnector(githubToken, {
          owner: process.env.GITHUB_OWNER,
          repo: process.env.GITHUB_REPO,
        })
      );
    }

    const raw = await fetchAllEvents();
    if (raw.length === 0) {
      return NextResponse.json(mockRankedEvents);
    }

    const ranked = await rankEvents(raw, geminiKey, process.env.USER_PREFERENCES);
    return NextResponse.json(ranked);
  } catch (err) {
    console.error("[ranked-events] pipeline error:", err);
    // Degrade gracefully to mock data on errors
    return NextResponse.json(mockRankedEvents);
  }
}
