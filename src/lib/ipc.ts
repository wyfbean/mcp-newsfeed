/**
 * Tauri IPC wrapper with graceful browser fallback.
 *
 * In a real Tauri desktop build the @tauri-apps/api invoke function is used.
 * When running in a plain browser (dev / web deploy) we fall back to the REST
 * API layer exposed by Next.js route handlers.
 */

import type { ActionPayload, ActionResult } from "./types";

/** Returns true when running inside a Tauri WebView. */
export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI__" in window;
}

/** Dynamically-imported Tauri invoke – only available at runtime in desktop. */
async function tauriInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<T>(cmd, args);
}

/** Generic IPC command invocation. Falls back to REST in the browser. */
export async function invokeCommand<T>(
  cmd: string,
  args?: Record<string, unknown>
): Promise<T> {
  if (isTauri()) {
    return tauriInvoke<T>(cmd, args);
  }
  // Browser fallback – call the internal API route
  const res = await fetch(`/api/ipc/${cmd}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args ?? {}),
  });
  if (!res.ok) {
    throw new Error(`IPC fallback failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

/** Greet command – smoke test for IPC connectivity. */
export async function greet(name: string): Promise<string> {
  if (isTauri()) {
    return tauriInvoke<string>("greet", { name });
  }
  return `Hello, ${name}! (browser mode)`;
}

/** Trigger a MCP action (merge PR, reply email, …). */
export async function dispatchAction(
  payload: ActionPayload
): Promise<ActionResult> {
  return invokeCommand<ActionResult>("dispatch_action", payload as unknown as Record<string, unknown>);
}

/** Ask Rust to force-refresh data from all enabled MCP connectors. */
export async function triggerRefresh(): Promise<void> {
  if (isTauri()) {
    await tauriInvoke<void>("trigger_refresh");
  }
  // In browser mode: no-op (data comes from API routes)
}

/** Subscribe to Tauri events emitted by the Rust backend. */
export async function listenToEvents(
  event: string,
  callback: (payload: unknown) => void
): Promise<() => void> {
  if (!isTauri()) {
    // Return a no-op unsubscribe in browser mode
    return () => {};
  }
  const { listen } = await import("@tauri-apps/api/event");
  const unlisten = await listen(event, (evt) => callback(evt.payload));
  return unlisten;
}
