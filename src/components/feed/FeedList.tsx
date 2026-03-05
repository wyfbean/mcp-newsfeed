"use client";

import { useState } from "react";
import type { RankedEvent } from "@/lib/types";
import { BentoCard } from "@/components/dashboard/BentoCard";
import { Button } from "@/components/ui/button";
import type { ActionPayload } from "@/lib/types";

const PAGE_SIZE = 10;

interface FeedListProps {
  events: RankedEvent[];
  onAction?: (payload: ActionPayload) => Promise<void>;
}

export function FeedList({ events, onAction }: FeedListProps) {
  const [page, setPage] = useState(1);

  const visible = events.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < events.length;

  async function handleAction(event: RankedEvent) {
    if (!onAction) return;
    await onAction({
      eventId: event.id,
      source: event.source,
      actionType: event.actionType,
    });
  }

  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        No events in feed
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {visible.map((event) => (
        <BentoCard
          key={event.id}
          event={event}
          size="medium"
          onAction={onAction ? () => handleAction(event) : undefined}
        />
      ))}
      {hasMore && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setPage((p) => p + 1)}
        >
          Load more ({events.length - visible.length} remaining)
        </Button>
      )}
    </div>
  );
}
