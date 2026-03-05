"use client";

import { useState, useEffect } from "react";
import type { AppSettings, MCPConnectorConfig, EventSource } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Save, Plus, Trash2, RefreshCw } from "lucide-react";

const DEFAULT_CONNECTORS: MCPConnectorConfig[] = [
  { id: "github", source: "github", label: "GitHub", enabled: false, pollIntervalMinutes: 15 },
  { id: "notion", source: "notion", label: "Notion", enabled: false, pollIntervalMinutes: 30 },
  { id: "google_calendar", source: "google_calendar", label: "Google Calendar", enabled: false, pollIntervalMinutes: 15 },
];

function loadSettings(): AppSettings {
  if (typeof window === "undefined") {
    return { activeModel: "gemini", connectors: DEFAULT_CONNECTORS, theme: "system" };
  }
  try {
    const raw = localStorage.getItem("mcp_settings");
    if (raw) return { ...JSON.parse(raw), connectors: JSON.parse(raw).connectors ?? DEFAULT_CONNECTORS };
  } catch { /* ignore */ }
  return { activeModel: "gemini", connectors: DEFAULT_CONNECTORS, theme: "system" };
}

export function SettingsPanel() {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  function saveSettings() {
    localStorage.setItem("mcp_settings", JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function updateConnector(id: string, patch: Partial<MCPConnectorConfig>) {
    setSettings((s) => ({
      ...s,
      connectors: s.connectors.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  }

  function addCustomConnector() {
    const id = `custom-${Date.now()}`;
    setSettings((s) => ({
      ...s,
      connectors: [
        ...s.connectors,
        { id, source: "custom" as EventSource, label: "Custom Connector", enabled: false, pollIntervalMinutes: 30 },
      ],
    }));
  }

  function removeConnector(id: string) {
    setSettings((s) => ({
      ...s,
      connectors: s.connectors.filter((c) => c.id !== id),
    }));
  }

  return (
    <div className="flex flex-col gap-6">
      {/* AI Model */}
      <Card>
        <CardHeader>
          <CardTitle>AI Model Configuration</CardTitle>
          <CardDescription>
            Configure your LLM API key. Events are ranked and summarised using this model.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Button
              variant={settings.activeModel === "gemini" ? "default" : "outline"}
              size="sm"
              onClick={() => setSettings((s) => ({ ...s, activeModel: "gemini" }))}
            >
              Gemini
            </Button>
            <Button
              variant={settings.activeModel === "claude" ? "default" : "outline"}
              size="sm"
              onClick={() => setSettings((s) => ({ ...s, activeModel: "claude" }))}
            >
              Claude
            </Button>
          </div>

          {settings.activeModel === "gemini" ? (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Gemini API Key</label>
              <Input
                type="password"
                placeholder="AIza..."
                value={settings.geminiApiKey ?? ""}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, geminiApiKey: e.target.value }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Get your key from{" "}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  Google AI Studio
                </a>
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Claude API Key</label>
              <Input
                type="password"
                placeholder="sk-ant-..."
                value={settings.claudeApiKey ?? ""}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, claudeApiKey: e.target.value }))
                }
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Personal Preferences (optional)</label>
            <Textarea
              placeholder="E.g. I care most about production incidents, security alerts, and meetings with my team. Deprioritise documentation tasks."
              value={settings.userPreferences ?? ""}
              onChange={(e) =>
                setSettings((s) => ({ ...s, userPreferences: e.target.value }))
              }
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              This text is included in the AI ranking prompt to personalise scores.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Connectors */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>MCP Connectors</CardTitle>
              <CardDescription>
                Enable data sources and supply their access tokens.
              </CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={addCustomConnector}>
              <Plus size={14} className="mr-1" /> Add Connector
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {settings.connectors.map((connector) => (
            <div
              key={connector.id}
              className="flex flex-col gap-3 rounded-lg border p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={connector.enabled}
                    onCheckedChange={(v) => updateConnector(connector.id, { enabled: v })}
                  />
                  <span className="font-medium text-sm">{connector.label}</span>
                  <Badge variant="outline" className="text-xs">
                    {connector.source}
                  </Badge>
                </div>
                {connector.source === "custom" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => removeConnector(connector.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>

              {connector.enabled && (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">Access Token</label>
                    <Input
                      type="password"
                      placeholder="Paste token here"
                      value={connector.token ?? ""}
                      onChange={(e) =>
                        updateConnector(connector.id, { token: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground">
                      Poll every
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={1440}
                      className="w-20 h-7 text-xs"
                      value={connector.pollIntervalMinutes}
                      onChange={(e) =>
                        updateConnector(connector.id, {
                          pollIntervalMinutes: Number(e.target.value),
                        })
                      }
                    />
                    <label className="text-xs text-muted-foreground">minutes</label>
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex gap-2">
        <Button onClick={saveSettings} className="gap-2">
          {saved ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              Saved!
            </>
          ) : (
            <>
              <Save size={14} />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
