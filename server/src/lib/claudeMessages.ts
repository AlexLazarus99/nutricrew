import { parseApiError } from "./mealLlmShared.js";

type ClaudeContentBlock =
  | { type: "text"; text: string }
  | {
      type: "image";
      source: { type: "base64"; media_type: string; data: string };
    };

type ClaudeMessageResult =
  | { ok: true; raw: string; model: string }
  | { ok: false; status: number; hint: string; notFound: boolean };

export async function requestClaudeMessage(
  apiKey: string,
  model: string,
  content: ClaudeContentBlock[],
  maxTokens = 400,
): Promise<ClaudeMessageResult> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{ role: "user", content }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    const hint = parseApiError(errText, `HTTP ${res.status}`);
    return {
      ok: false,
      status: res.status,
      hint: `${model}: ${hint}`,
      notFound: res.status === 404,
    };
  }

  const data = (await res.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };
  const raw = data.content?.find((c) => c.type === "text")?.text?.trim() ?? "";
  if (!raw) {
    return { ok: false, status: res.status, hint: `${model}: empty response`, notFound: false };
  }

  return { ok: true, raw, model };
}
