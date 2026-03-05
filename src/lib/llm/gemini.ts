/**
 * Gemini (Google AI) LLM integration for ranking and summarising events.
 *
 * System prompt asks Gemini to assign importance scores, generate one-sentence
 * summaries, recommend action types, and apply classification tags to each
 * RawEvent in the batch.
 */

import type { RawEvent, RankedEvent, ActionType, EventCategory } from "../types";

const SYSTEM_PROMPT = `You are a private information-feed recommendation engine.
Your job is to help a busy software engineer triage their incoming events.

Given a JSON array of RawEvent objects you must:
1. Assign an importance score from 1 (not important) to 10 (extremely urgent) based on urgency, impact, and the user's stated preferences.
2. Write a concise one-sentence summary (≤ 20 words) of the event.
3. Recommend the most appropriate action_type from: review_pr | fix_bug | join_meeting | reply_email | read_document | approve | merge_pr | ignore | snooze | none.
4. Assign up to 4 classification tags (lowercase, hyphenated).
5. Assign a category from: code_review | issue | meeting | notification | task | email | document | other.

Return ONLY a valid JSON array (no markdown fences) where each element has:
{ "id": string, "score": number, "summary": string, "action_type": string, "tags": string[], "category": string }`;

interface GeminiCandidate {
  content: { parts: { text: string }[] };
}

interface GeminiResponse {
  candidates: GeminiCandidate[];
}

interface LLMRanking {
  id: string;
  score: number;
  summary: string;
  action_type: string;
  tags: string[];
  category: string;
}

export async function rankEvents(
  events: RawEvent[],
  apiKey: string,
  userPreferences?: string
): Promise<RankedEvent[]> {
  if (events.length === 0) return [];

  const userContext = userPreferences
    ? `\n\nUser preferences: ${userPreferences}`
    : "";

  const prompt = `${SYSTEM_PROMPT}${userContext}\n\nEvents:\n${JSON.stringify(events, null, 2)}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }

  const data: GeminiResponse = await res.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";

  let rankings: LLMRanking[] = [];
  try {
    rankings = JSON.parse(rawText);
  } catch {
    // If the model returned markdown fences, strip them and retry
    const cleaned = rawText.replace(/```json\n?|\n?```/g, "").trim();
    rankings = JSON.parse(cleaned);
  }

  const rankingMap = new Map<string, LLMRanking>(
    rankings.map((r) => [r.id, r])
  );

  const now = new Date().toISOString();
  return events.map((event): RankedEvent => {
    const ranking = rankingMap.get(event.id);
    return {
      ...event,
      score: ranking?.score ?? 5,
      summary: ranking?.summary ?? event.title,
      actionType: (ranking?.action_type as ActionType) ?? "none",
      tags: ranking?.tags ?? [],
      category: (ranking?.category as EventCategory) ?? "other",
      rankedAt: now,
    };
  });
}
