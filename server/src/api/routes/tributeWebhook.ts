import type { Request, Response } from "express";
import { config } from "../../config.js";
import { verifyTributeSignature } from "../../lib/tributeSignature.js";
import { handleTributeWebhook } from "../../services/tributeWebhooks.js";

export async function tributeWebhookHandler(req: Request, res: Response): Promise<void> {
  if (!config.tribute.apiKey) {
    res.status(503).json({ error: "Tribute not configured" });
    return;
  }

  const rawBody = req.body as Buffer;
  if (!Buffer.isBuffer(rawBody) || rawBody.length === 0) {
    res.status(400).json({ error: "Empty body" });
    return;
  }

  const signature = req.headers["trbt-signature"]?.toString();
  if (!verifyTributeSignature(rawBody, signature, config.tribute.apiKey)) {
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  let event: unknown;
  try {
    event = JSON.parse(rawBody.toString("utf8"));
  } catch {
    res.status(400).json({ error: "Invalid JSON" });
    return;
  }

  try {
    const result = await handleTributeWebhook(event as Parameters<typeof handleTributeWebhook>[0]);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error("[tribute] webhook handler error:", err);
    res.status(500).json({ error: "Handler failed" });
  }
}
