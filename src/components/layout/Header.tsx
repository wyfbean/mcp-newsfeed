"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Monitor, RefreshCw, Settings, Rss, LayoutDashboard } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/feed", label: "Feed", icon: Rss },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface HeaderProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
  lastRefreshed?: Date | null;
}

export function Header({ onRefresh, isRefreshing, lastRefreshed }: HeaderProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    const order: ["light", "dark", "system"] = ["light", "dark", "system"];
    const idx = order.indexOf(theme as "light" | "dark" | "system");
    setTheme(order[(idx + 1) % order.length]);
  };

  const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">📡</span>
            <span className="font-bold text-lg">MCP Newsfeed</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden sm:flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <Button
                  variant={pathname === href ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-2"
                >
                  <Icon size={16} />
                  {label}
                </Button>
              </Link>
            ))}
          </nav>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {lastRefreshed && (
            <span className="hidden md:block text-xs text-muted-foreground">
              Updated {lastRefreshed.toLocaleTimeString()}
            </span>
          )}
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Refresh data"
            >
              <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={cycleTheme} title="Toggle theme">
            <ThemeIcon size={16} />
          </Button>
        </div>
      </div>
    </header>
  );
}
