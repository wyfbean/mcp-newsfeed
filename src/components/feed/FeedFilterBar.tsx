"use client";

import { useState } from "react";
import type { RankedEvent } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FeedList } from "./FeedList";
import type { ActionPayload, EventSource, EventCategory } from "@/lib/types";

const SOURCE_LABELS: Record<EventSource, string> = {
  github: "GitHub",
  notion: "Notion",
  google_calendar: "Calendar",
  email: "Email",
  slack: "Slack",
  jira: "Jira",
  custom: "Custom",
};

interface FeedFilterBarProps {
  events: RankedEvent[];
  onAction?: (payload: ActionPayload) => Promise<void>;
}

export function FeedFilterBar({ events, onAction }: FeedFilterBarProps) {
  const [sourceFilter, setSourceFilter] = useState<EventSource | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<EventCategory | "all">("all");
  const [minScore, setMinScore] = useState(1);

  // Derive available sources and categories from events
  const availableSources = Array.from(new Set(events.map((e) => e.source)));
  const availableCategories = Array.from(new Set(events.map((e) => e.category)));

  const filtered = events.filter((e) => {
    if (sourceFilter !== "all" && e.source !== sourceFilter) return false;
    if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
    if (e.score < minScore) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Source filter */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-muted-foreground font-medium">Source:</span>
        <Button
          size="sm"
          variant={sourceFilter === "all" ? "secondary" : "ghost"}
          className="h-7 text-xs"
          onClick={() => setSourceFilter("all")}
        >
          All
        </Button>
        {availableSources.map((src) => (
          <Button
            key={src}
            size="sm"
            variant={sourceFilter === src ? "secondary" : "ghost"}
            className="h-7 text-xs"
            onClick={() => setSourceFilter(src)}
          >
            {SOURCE_LABELS[src] ?? src}
          </Button>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-muted-foreground font-medium">Category:</span>
        <Button
          size="sm"
          variant={categoryFilter === "all" ? "secondary" : "ghost"}
          className="h-7 text-xs"
          onClick={() => setCategoryFilter("all")}
        >
          All
        </Button>
        {availableCategories.map((cat) => (
          <Button
            key={cat}
            size="sm"
            variant={categoryFilter === cat ? "secondary" : "ghost"}
            className="h-7 text-xs capitalize"
            onClick={() => setCategoryFilter(cat)}
          >
            {cat.replace(/_/g, " ")}
          </Button>
        ))}
      </div>

      {/* Min score */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground font-medium">Min score:</span>
        {[1, 4, 6, 8].map((s) => (
          <Badge
            key={s}
            variant={minScore === s ? "default" : "outline"}
            className="cursor-pointer text-xs"
            onClick={() => setMinScore(s)}
          >
            {s}+
          </Badge>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {events.length} events
      </p>

      <FeedList events={filtered} onAction={onAction} />
    </div>
  );
}
