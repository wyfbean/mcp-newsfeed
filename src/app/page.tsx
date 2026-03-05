"use client";

import { useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { BentoDashboard } from "@/components/dashboard/BentoDashboard";
import { BentoCard } from "@/components/dashboard/BentoCard";
import { useEvents } from "@/hooks/useEvents";
import { Badge } from "@/components/ui/badge";
import type { ActionPayload } from "@/lib/types";
import { scoreToColor } from "@/lib/utils";

export default function DashboardPage() {
  const { events, isLoading, error, refresh, lastRefreshed } = useEvents({
    pollIntervalMs: 15 * 60 * 1000,
    autoRefresh: true,
  });

  const criticalEvents = useMemo(
    () => events.filter((e) => e.score >= 8),
    [events]
  );
  const moderateEvents = useMemo(
    () => events.filter((e) => e.score >= 4 && e.score < 8),
    [events]
  );

  async function handleAction(payload: ActionPayload) {
    const res = await fetch("/api/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`Action failed: ${res.statusText}`);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        onRefresh={refresh}
        isRefreshing={isLoading}
        lastRefreshed={lastRefreshed}
      />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 flex flex-col gap-8">
        {/* Summary bar */}
        {!isLoading && events.length > 0 && (
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-sm font-medium">Today&apos;s overview:</span>
            <Badge variant="critical" className="gap-1">
              🔴 {criticalEvents.length} Critical
            </Badge>
            <Badge variant="warning" className="gap-1">
              🟡 {moderateEvents.length} High / Medium
            </Badge>
            <Badge variant="secondary" className="gap-1">
              📋 {events.length} Total
            </Badge>
            {events.length > 0 && (
              <span className={`text-sm font-semibold ${scoreToColor(events[0].score)}`}>
                Top priority: {events[0].score}/10
              </span>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {isLoading && events.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
              <span className="text-sm">Loading events…</span>
            </div>
          </div>
        ) : (
          <>
            {/* Bento dashboard – top ranked events */}
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                🎯 Priority Dashboard
                <Badge variant="secondary" className="text-xs font-normal">
                  Top {Math.min(events.length, 12)}
                </Badge>
              </h2>
              <BentoDashboard
                events={events}
                onAction={handleAction}
                cols={8}
              />
            </section>

            {/* Mid-priority feed */}
            {moderateEvents.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-3">
                  📋 Action Queue
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {moderateEvents.slice(0, 6).map((event) => (
                    <BentoCard
                      key={event.id}
                      event={event}
                      size="medium"
                      onAction={async () =>
                        handleAction({
                          eventId: event.id,
                          source: event.source,
                          actionType: event.actionType,
                        })
                      }
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
