import { Router } from "express";
import { authInitData } from "../middleware/authInitData.js";
import { ensureUser } from "../middleware/ensureUser.js";
import { trackEvents } from "../../services/analytics.js";

export const analyticsRouter = Router();
const authed = [authInitData, ensureUser] as const;

analyticsRouter.post("/events", ...authed, async (req, res) => {
  const { events } = req.body as {
    events?: Array<{ name: string; props?: Record<string, unknown> }>;
  };
  if (!Array.isArray(events) || events.length === 0) {
    res.status(400).json({ error: "events array required" });
    return;
  }
  await trackEvents(req.dbUser!.id, events.slice(0, 20));
  res.json({ ok: true });
});
