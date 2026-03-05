"use client";

import { useState } from "react";
import type { RankedEvent } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatRelativeTime, scoreToColor, scoreToLabel } from "@/lib/utils";
import {
  GitPullRequest,
  Bug,
  Video,
  Mail,
  FileText,
  CheckCircle,
  GitMerge,
  BellOff,
  Clock,
  ExternalLink,
  Github,
  Calendar,
  BookOpen,
} from "lucide-react";

const SOURCE_ICONS: Record<string, React.ElementType> = {
  github: Github,
  google_calendar: Calendar,
  notion: BookOpen,
};

const ACTION_ICONS: Record<string, React.ElementType> = {
  review_pr: GitPullRequest,
  fix_bug: Bug,
  join_meeting: Video,
  reply_email: Mail,
  read_document: FileText,
  approve: CheckCircle,
  merge_pr: GitMerge,
  ignore: BellOff,
  snooze: Clock,
};

const ACTION_LABELS: Record<string, string> = {
  review_pr: "Review PR",
  fix_bug: "Fix Bug",
  join_meeting: "Join Meeting",
  reply_email: "Reply",
  read_document: "Read",
  approve: "Approve",
  merge_pr: "Merge PR",
  ignore: "Ignore",
  snooze: "Snooze",
  none: "View",
};

interface BentoCardProps {
  event: RankedEvent;
  /** Large card (score ≥ 8) vs compact card */
  size?: "large" | "medium" | "compact";
  onAction?: (event: RankedEvent) => Promise<void>;
  className?: string;
}

export function BentoCard({ event, size = "medium", onAction, className }: BentoCardProps) {
  const [acting, setActing] = useState(false);
  const [actedOn, setActedOn] = useState(event.isActedOn ?? false);

  const SourceIcon = SOURCE_ICONS[event.source] ?? FileText;
  const ActionIcon = ACTION_ICONS[event.actionType] ?? FileText;
  const actionLabel = ACTION_LABELS[event.actionType] ?? "View";

  const scoreColor = scoreToColor(event.score);
  const scoreLabel = scoreToLabel(event.score);

  async function handleAction() {
    if (!onAction || acting) return;
    setActing(true);
    try {
      await onAction(event);
      setActedOn(true);
    } finally {
      setActing(false);
    }
  }

  return (
    <Card
      className={cn(
        "flex flex-col h-full transition-all",
        actedOn && "opacity-60",
        event.score >= 8 && "ring-2 ring-red-500/30",
        event.score >= 6 && event.score < 8 && "ring-1 ring-orange-500/20",
        className
      )}
    >
      <CardHeader className={cn("pb-2", size === "compact" ? "p-3" : "p-4")}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <SourceIcon size={16} className="shrink-0 text-muted-foreground" />
            <CardTitle
              className={cn(
                "truncate",
                size === "large" ? "text-base" : "text-sm"
              )}
              title={event.title}
            >
              {event.title}
            </CardTitle>
          </div>
          <span className={cn("shrink-0 font-bold text-sm", scoreColor)}>
            {event.score}/10
          </span>
        </div>

        {/* Score badge + tags */}
        <div className="flex flex-wrap gap-1 mt-1">
          <Badge
            variant={
              event.score >= 8
                ? "critical"
                : event.score >= 6
                ? "warning"
                : "secondary"
            }
            className="text-xs"
          >
            {scoreLabel}
          </Badge>
          {event.tags.slice(0, size === "compact" ? 1 : 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent className={cn("flex-1", size === "compact" ? "px-3 pb-2" : "px-4 pb-2")}>
        <p className={cn("text-muted-foreground", size === "large" ? "text-sm" : "text-xs")}>
          {event.summary}
        </p>
        {size !== "compact" && event.author && (
          <p className="text-xs text-muted-foreground mt-1">by {event.author}</p>
        )}
      </CardContent>

      <CardFooter
        className={cn(
          "flex items-center justify-between gap-2",
          size === "compact" ? "px-3 pb-3" : "px-4 pb-4"
        )}
      >
        <span className="text-xs text-muted-foreground">
          {formatRelativeTime(event.updatedAt)}
        </span>
        <div className="flex gap-1">
          {event.url && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => window.open(event.url, "_blank")}
            >
              <ExternalLink size={12} className="mr-1" />
              Open
            </Button>
          )}
          {event.actionType !== "none" && !actedOn && (
            <Button
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleAction}
              disabled={acting}
            >
              <ActionIcon size={12} className="mr-1" />
              {acting ? "…" : actionLabel}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
