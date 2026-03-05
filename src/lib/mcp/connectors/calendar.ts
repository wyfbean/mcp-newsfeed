/**
 * Google Calendar MCP connector.
 *
 * Fetches upcoming events from the primary calendar via the Google Calendar
 * REST API.  Requires a valid OAuth 2 access token.
 *
 * Configuration options:
 *   token           – OAuth 2.0 access token (required)
 *   calendarId      – calendar ID, defaults to "primary"
 *   lookAheadDays   – how many days ahead to fetch (default: 7)
 */

import type { MCPConnector } from "../client";
import type { RawEvent } from "../../types";

interface CalendarEventItem {
  id: string;
  summary?: string;
  description?: string;
  htmlLink?: string;
  organizer?: { email?: string; displayName?: string };
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  updated: string;
  created: string;
}

export class GoogleCalendarConnector implements MCPConnector {
  readonly source = "google_calendar" as const;

  constructor(
    private readonly token: string,
    private readonly calendarId: string = "primary",
    private readonly lookAheadDays: number = 7
  ) {}

  async fetchEvents(_since?: string): Promise<RawEvent[]> {
    const now = new Date();
    const max = new Date(now.getTime() + this.lookAheadDays * 86_400_000);
    const url =
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(this.calendarId)}/events` +
      `?timeMin=${now.toISOString()}&timeMax=${max.toISOString()}&singleEvents=true&orderBy=startTime&maxResults=50`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (!res.ok) {
      console.error("[Calendar] API error:", res.status);
      return [];
    }

    const data: { items: CalendarEventItem[] } = await res.json();
    return data.items.map((item) => {
      const start = item.start.dateTime ?? item.start.date ?? now.toISOString();
      return {
        id: `calendar-${item.id}`,
        source: "google_calendar" as const,
        title: item.summary ?? "(No title)",
        body: item.description,
        url: item.htmlLink,
        author: item.organizer?.displayName ?? item.organizer?.email,
        createdAt: item.created,
        updatedAt: item.updated,
        metadata: { type: "calendar_event", start, end: item.end.dateTime ?? item.end.date },
      };
    });
  }
}

export function createGoogleCalendarConnector(
  token: string,
  options?: { calendarId?: string; lookAheadDays?: number }
): GoogleCalendarConnector {
  return new GoogleCalendarConnector(
    token,
    options?.calendarId,
    options?.lookAheadDays
  );
}
