"use client";

/**
 * BentoDashboard – react-grid-layout powered Bento Box layout.
 *
 * High-priority events (score ≥ 8) are displayed in large hero tiles.
 * Medium events (score 5-7) get regular tiles.
 * Low-priority events are shown as compact tiles.
 *
 * The layout is responsive and user-draggable/resizable.
 */

import { useMemo } from "react";
import dynamic from "next/dynamic";
import type { RankedEvent, ActionPayload } from "@/lib/types";
import { BentoCard } from "./BentoCard";

// react-grid-layout must be dynamically imported to avoid SSR issues
const GridLayout = dynamic(
  () => import("react-grid-layout").then((m) => m.GridLayout),
  { ssr: false }
);

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

interface BentoDashboardProps {
  events: RankedEvent[];
  onAction?: (payload: ActionPayload) => Promise<void>;
  cols?: number;
}

interface GridItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

function buildLayout(events: RankedEvent[], cols: number): GridItem[] {
  const layout: GridItem[] = [];
  let x = 0;
  let y = 0;

  for (const event of events) {
    const isLarge = event.score >= 8;
    const isMedium = event.score >= 5 && event.score < 8;

    const w = isLarge ? Math.min(4, cols) : isMedium ? 2 : 2;
    const h = isLarge ? 3 : isMedium ? 2 : 2;

    if (x + w > cols) {
      x = 0;
      y += isLarge ? 3 : 2;
    }

    layout.push({ i: event.id, x, y, w, h, minW: 2, minH: 2 });
    x += w;
  }

  return layout;
}

export function BentoDashboard({
  events,
  onAction,
  cols = 8,
}: BentoDashboardProps) {
  // Show only top 12 events in the bento dashboard
  const topEvents = useMemo(
    () =>
      [...events]
        .sort((a, b) => b.score - a.score)
        .slice(0, 12),
    [events]
  );

  const layout = useMemo(
    () => buildLayout(topEvents, cols),
    [topEvents, cols]
  );

  async function handleAction(event: RankedEvent) {
    if (!onAction) return;
    await onAction({
      eventId: event.id,
      source: event.source,
      actionType: event.actionType,
    });
  }

  if (topEvents.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        No events to display
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <GridLayout
        className="layout"
        layout={layout}
        gridConfig={{
          cols,
          rowHeight: 80,
          margin: [8, 8],
          containerPadding: [0, 0],
          maxRows: Infinity,
        }}
        width={cols * 120}
      >
        {topEvents.map((event) => (
          <div key={event.id} className="h-full">
            <BentoCard
              event={event}
              size={event.score >= 8 ? "large" : event.score >= 5 ? "medium" : "compact"}
              onAction={onAction ? () => handleAction(event) : undefined}
              className="cursor-default h-full"
            />
          </div>
        ))}
      </GridLayout>
    </div>
  );
}
