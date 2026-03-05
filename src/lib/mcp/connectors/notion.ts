/**
 * Notion MCP connector.
 *
 * Fetches recently updated pages and database entries from a Notion workspace.
 * Requires a Notion integration token.
 *
 * Configuration options:
 *   token         – Notion integration secret (required)
 *   databaseIds   – list of database IDs to poll (optional; if omitted, uses
 *                   the search API to find recently updated pages)
 */

import type { MCPConnector } from "../client";
import type { RawEvent } from "../../types";

interface NotionPage {
  id: string;
  url: string;
  created_time: string;
  last_edited_time: string;
  properties?: Record<
    string,
    {
      type: string;
      title?: { plain_text: string }[];
      rich_text?: { plain_text: string }[];
    }
  >;
}

function extractTitle(page: NotionPage): string {
  if (!page.properties) return page.id;
  for (const prop of Object.values(page.properties)) {
    if (prop.type === "title" && prop.title?.length) {
      return prop.title.map((t) => t.plain_text).join("");
    }
  }
  return page.id;
}

export class NotionConnector implements MCPConnector {
  readonly source = "notion" as const;

  constructor(
    private readonly token: string,
    private readonly databaseIds: string[] = []
  ) {}

  private get headers() {
    return {
      Authorization: `Bearer ${this.token}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    };
  }

  async fetchEvents(since?: string): Promise<RawEvent[]> {
    const events: RawEvent[] = [];

    if (this.databaseIds.length > 0) {
      for (const dbId of this.databaseIds) {
        const filter = since
          ? {
              filter: {
                property: "last_edited_time",
                date: { after: since },
              },
            }
          : {};
        try {
          const res = await fetch(
            `https://api.notion.com/v1/databases/${dbId}/query`,
            { method: "POST", headers: this.headers, body: JSON.stringify(filter) }
          );
          if (res.ok) {
            const data: { results: NotionPage[] } = await res.json();
            for (const page of data.results) {
              events.push({
                id: `notion-${page.id}`,
                source: "notion",
                title: extractTitle(page),
                url: page.url,
                createdAt: page.created_time,
                updatedAt: page.last_edited_time,
                metadata: { type: "notion_page", databaseId: dbId },
              });
            }
          }
        } catch (err) {
          console.error("[Notion] DB query error:", err);
        }
      }
    } else {
      // Fall back to search for recently edited pages
      try {
        const body = since
          ? { filter: { value: "page", property: "object" }, sort: { direction: "descending", timestamp: "last_edited_time" } }
          : { sort: { direction: "descending", timestamp: "last_edited_time" }, page_size: 30 };
        const res = await fetch("https://api.notion.com/v1/search", {
          method: "POST",
          headers: this.headers,
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const data: { results: NotionPage[] } = await res.json();
          for (const page of data.results) {
            if (since && page.last_edited_time < since) continue;
            events.push({
              id: `notion-${page.id}`,
              source: "notion",
              title: extractTitle(page),
              url: page.url,
              createdAt: page.created_time,
              updatedAt: page.last_edited_time,
              metadata: { type: "notion_page" },
            });
          }
        }
      } catch (err) {
        console.error("[Notion] search error:", err);
      }
    }

    return events;
  }
}

export function createNotionConnector(
  token: string,
  options?: { databaseIds?: string[] }
): NotionConnector {
  return new NotionConnector(token, options?.databaseIds);
}
