/**
 * MCP Client abstraction layer.
 *
 * Each connector implements the MCPConnector interface.  At runtime the
 * registry is keyed by EventSource so callers can iterate all enabled
 * connectors generically.
 */

import type { RawEvent, MCPConnectorConfig } from "../types";

export interface MCPConnector {
  readonly source: MCPConnectorConfig["source"];
  /** Fetch new / updated events since the given ISO timestamp (or all if undefined). */
  fetchEvents(since?: string): Promise<RawEvent[]>;
}

/** Registry of all registered connectors. */
const connectorRegistry = new Map<string, MCPConnector>();

export function registerConnector(connector: MCPConnector): void {
  connectorRegistry.set(connector.source, connector);
}

export function getConnector(source: string): MCPConnector | undefined {
  return connectorRegistry.get(source);
}

export function getAllConnectors(): MCPConnector[] {
  return Array.from(connectorRegistry.values());
}

/**
 * Fetch events from ALL registered connectors and return a merged,
 * time-sorted array.
 */
export async function fetchAllEvents(since?: string): Promise<RawEvent[]> {
  const results = await Promise.allSettled(
    getAllConnectors().map((c) => c.fetchEvents(since))
  );

  const events: RawEvent[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      events.push(...result.value);
    } else {
      console.error("[MCP] Connector error:", result.reason);
    }
  }

  return events.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}
