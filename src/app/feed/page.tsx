"use client";

import { Header } from "@/components/layout/Header";
import { FeedFilterBar } from "@/components/feed/FeedFilterBar";
import { useEvents } from "@/hooks/useEvents";
import type { ActionPayload } from "@/lib/types";

export default function FeedPage() {
  const { events, isLoading, error, refresh, lastRefreshed } = useEvents({
    pollIntervalMs: 15 * 60 * 1000,
    autoRefresh: true,
  });

  async function handleAction(payload: ActionPayload) {
    await fetch("/api/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        onRefresh={refresh}
        isRefreshing={isLoading}
        lastRefreshed={lastRefreshed}
      />

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">📰 Smart Feed</h1>

        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400 mb-4">
            {error}
          </div>
        )}

        {isLoading && events.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
              <span className="text-sm">Loading feed…</span>
            </div>
          </div>
        ) : (
          <FeedFilterBar events={events} onAction={handleAction} />
        )}
      </main>
    </div>
  );
}
