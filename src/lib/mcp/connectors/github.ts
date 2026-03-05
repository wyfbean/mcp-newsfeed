/**
 * GitHub MCP connector.
 *
 * Uses the GitHub REST API to surface pull requests, issues, and review
 * requests for the authenticated user.
 *
 * Configuration options:
 *   token   – GitHub personal access token (required)
 *   owner   – default repository owner/org (optional)
 *   repo    – default repository name (optional)
 */

import type { MCPConnector } from "../client";
import type { RawEvent } from "../../types";

interface GitHubPR {
  id: number;
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  user: { login: string };
  created_at: string;
  updated_at: string;
  state: string;
}

interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  user: { login: string };
  created_at: string;
  updated_at: string;
  pull_request?: unknown;
}

export class GitHubConnector implements MCPConnector {
  readonly source = "github" as const;

  constructor(
    private readonly token: string,
    private readonly owner?: string,
    private readonly repo?: string
  ) {}

  private get headers() {
    return {
      Authorization: `token ${this.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
  }

  private repoPath(): string | null {
    return this.owner && this.repo ? `${this.owner}/${this.repo}` : null;
  }

  async fetchEvents(since?: string): Promise<RawEvent[]> {
    const events: RawEvent[] = [];
    const sinceParam = since ? `&since=${encodeURIComponent(since)}` : "";

    // Fetch pull requests
    try {
      const path = this.repoPath();
      const url = path
        ? `https://api.github.com/repos/${path}/pulls?state=open&sort=updated&per_page=20${sinceParam}`
        : `https://api.github.com/search/issues?q=is:pr+is:open+reviewed-by:@me+updated:>${since ?? "2020-01-01"}&per_page=20`;

      const res = await fetch(url, { headers: this.headers });
      if (res.ok) {
        const prs: GitHubPR[] = path
          ? await res.json()
          : (await res.json()).items;
        for (const pr of prs) {
          events.push({
            id: `github-pr-${pr.id}`,
            source: "github",
            title: `PR #${pr.number}: ${pr.title}`,
            body: pr.body ?? undefined,
            url: pr.html_url,
            author: pr.user.login,
            createdAt: pr.created_at,
            updatedAt: pr.updated_at,
            metadata: { type: "pull_request", state: pr.state, number: pr.number },
          });
        }
      }
    } catch (err) {
      console.error("[GitHub] PR fetch error:", err);
    }

    // Fetch issues assigned to authenticated user
    try {
      const issuesUrl = `https://api.github.com/issues?filter=assigned&state=open&sort=updated&per_page=20${sinceParam}`;
      const res = await fetch(issuesUrl, { headers: this.headers });
      if (res.ok) {
        const issues: GitHubIssue[] = await res.json();
        for (const issue of issues) {
          if (issue.pull_request) continue; // skip PRs returned by issues endpoint
          events.push({
            id: `github-issue-${issue.id}`,
            source: "github",
            title: `Issue #${issue.number}: ${issue.title}`,
            body: issue.body ?? undefined,
            url: issue.html_url,
            author: issue.user.login,
            createdAt: issue.created_at,
            updatedAt: issue.updated_at,
            metadata: { type: "issue", number: issue.number },
          });
        }
      }
    } catch (err) {
      console.error("[GitHub] Issues fetch error:", err);
    }

    return events;
  }
}

/** Factory: build a GitHubConnector from connector config. */
export function createGitHubConnector(
  token: string,
  options?: { owner?: string; repo?: string }
): GitHubConnector {
  return new GitHubConnector(token, options?.owner, options?.repo);
}
