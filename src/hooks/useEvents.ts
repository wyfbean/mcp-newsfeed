/**
 * useEvents – fetches and caches RankedEvents from the /api/ranked-events
 * endpoint (or mock data), with optional polling.
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import type { RankedEvent } from "@/lib/types";

interface UseEventsOptions {
  pollIntervalMs?: number;
  autoRefresh?: boolean;
}

interface UseEventsReturn {
  events: RankedEvent[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastRefreshed: Date | null;
}

export function useEvents({
  pollIntervalMs = 15 * 60 * 1000, // 15 minutes default
  autoRefresh = true,
}: UseEventsOptions = {}): UseEventsReturn {
  const [events, setEvents] = useState<RankedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ranked-events");
      if (!res.ok) {
        throw new Error(`Failed to fetch events: ${res.statusText}`);
      }
      const data: RankedEvent[] = await res.json();
      setEvents(data);
      setLastRefreshed(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Polling
  useEffect(() => {
    if (!autoRefresh || pollIntervalMs <= 0) return;
    const timer = setInterval(() => void refresh(), pollIntervalMs);
    return () => clearInterval(timer);
  }, [autoRefresh, pollIntervalMs, refresh]);

  return { events, isLoading, error, refresh, lastRefreshed };
}
