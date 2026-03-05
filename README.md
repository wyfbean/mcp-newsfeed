# MCP Newsfeed

> **AI-powered information hub** — Aggregate, rank, and act on your daily feed of GitHub PRs, meetings, tasks and more, powered by the [Model Context Protocol](https://modelcontextprotocol.io/) and Google Gemini.

![Dashboard screenshot](https://github.com/user-attachments/assets/7850b119-8cf7-4394-b778-c4cb8a176af4)

---

## ✨ Features

| Feature | Description |
|---|---|
| **Bento Box Dashboard** | `react-grid-layout` drag-and-resize tiles ranked by AI score |
| **Smart Feed** | Filterable list view with source, category, and minimum-score filters |
| **AI Ranking** | Gemini 2.0 Flash assigns a 1–10 importance score, one-sentence summary, action type and tags to every event |
| **MCP Connectors** | Pluggable data-source adapters for GitHub, Notion, Google Calendar (extendable) |
| **Tauri Desktop** | Optional Rust backend for cross-platform packaging and background polling |
| **Dark / Light mode** | System-aware theme with manual override |
| **One-click Actions** | "Review PR", "Fix Bug", "Join Meeting" buttons that route back through the IPC layer |

---

## 🗂 Project Structure

```
mcp-newsfeed/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── page.tsx              # Dashboard (Bento Box + Action Queue)
│   │   ├── feed/page.tsx         # Smart Feed with filters
│   │   ├── settings/page.tsx     # API keys & connector config
│   │   └── api/
│   │       ├── ranked-events/    # GET  – fetch & rank events
│   │       └── action/           # POST – dispatch MCP actions
│   ├── components/
│   │   ├── ui/                   # shadcn/ui primitives (Button, Card, Badge…)
│   │   ├── layout/Header.tsx     # Sticky header + nav + theme toggle
│   │   ├── dashboard/
│   │   │   ├── BentoDashboard.tsx # react-grid-layout grid
│   │   │   └── BentoCard.tsx     # Individual event card
│   │   ├── feed/
│   │   │   ├── FeedFilterBar.tsx # Source / category / score filters
│   │   │   └── FeedList.tsx      # Paginated event list
│   │   └── settings/SettingsPanel.tsx
│   ├── hooks/
│   │   ├── useEvents.ts          # Data fetching with polling
│   │   └── useTheme.ts           # Dark/light mode
│   └── lib/
│       ├── types.ts              # RawEvent, RankedEvent, ActionPayload…
│       ├── utils.ts              # cn(), formatRelativeTime(), scoreToColor()
│       ├── ipc.ts                # Tauri IPC wrapper (browser fallback)
│       ├── mock-data.ts          # Sample events for demo/dev mode
│       ├── mcp/
│       │   ├── client.ts         # Connector registry & fetchAllEvents()
│       │   └── connectors/
│       │       ├── github.ts     # GitHub REST API connector
│       │       ├── notion.ts     # Notion API connector
│       │       └── calendar.ts   # Google Calendar API connector
│       └── llm/
│           └── gemini.ts         # Gemini API ranking pipeline
└── src-tauri/                    # Tauri 2.0 Rust backend
    ├── src/
    │   ├── main.rs               # Entry point
    │   ├── lib.rs                # IPC commands + app builder
    │   ├── data/mod.rs           # Rust mirror of TypeScript types
    │   ├── mcp/mod.rs            # Connector trait + registry
    │   └── scheduler/mod.rs     # Tokio background polling loop
    ├── Cargo.toml
    └── tauri.conf.json
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 18 and **npm**
- **Rust** + `cargo` (only needed for the Tauri desktop build)

### Web (Next.js only)

```bash
npm install
npm run dev        # → http://localhost:3000
```

The app runs in **demo mode** by default — it displays realistic mock data without any API keys.

### With real data

Create a `.env.local` file:

```env
# Google Gemini (required for AI ranking)
GEMINI_API_KEY=AIza...

# GitHub connector (optional)
GITHUB_TOKEN=ghp_...
GITHUB_OWNER=your-org          # optional, defaults to authenticated user
GITHUB_REPO=your-repo          # optional

# Personalisation
USER_PREFERENCES="I care most about production incidents and security issues."
```

### Desktop (Tauri)

```bash
# Install Tauri CLI
cargo install tauri-cli --version "^2"

# Development
cargo tauri dev

# Production build
NEXT_EXPORT=true cargo tauri build
```

---

## 🔌 Adding a New MCP Connector

1. Create `src/lib/mcp/connectors/my-source.ts` implementing the `MCPConnector` interface:

```typescript
import type { MCPConnector } from "../client";
import type { RawEvent } from "../../types";

export class MySourceConnector implements MCPConnector {
  readonly source = "custom" as const;

  constructor(private readonly token: string) {}

  async fetchEvents(since?: string): Promise<RawEvent[]> {
    // fetch from your API and map to RawEvent[]
    return [];
  }
}
```

2. Register it in `src/app/api/ranked-events/route.ts`:

```typescript
const { registerConnector } = await import("@/lib/mcp/client");
registerConnector(new MySourceConnector(process.env.MY_TOKEN!));
```

3. For the Tauri desktop backend, implement the `Connector` trait in `src-tauri/src/mcp/mod.rs` and register it in `src-tauri/src/lib.rs`.

---

## 📐 Tech Stack

| Layer | Technology |
|---|---|
| Host / Desktop | Tauri 2.0 (Rust + Tokio) |
| Frontend | Next.js 16 (App Router) + React |
| UI | Tailwind CSS + shadcn/ui |
| Grid layout | react-grid-layout |
| AI ranking | Google Gemini 2.0 Flash |
| Connectivity | Model Context Protocol (MCP) |
