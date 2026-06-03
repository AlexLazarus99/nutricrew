import { Router, type Request, type Response } from "express";
import { authInitData } from "../middleware/authInitData.js";
import { ensureUser } from "../middleware/ensureUser.js";
import { requireProfile } from "../middleware/requireProfile.js";
import { getTeamChat, postTeamMessage, reactToMessage } from "../../services/chat.js";

export const chatRouter = Router();

const authedProfile = [authInitData, ensureUser, requireProfile] as const;

function requireTeam(req: Request, res: Response): string | null {
  const teamId = req.dbUser?.team_id;
  if (!teamId) {
    res.status(400).json({ error: "NO_TEAM", message: "Join a team to use chat" });
    return null;
  }
  return teamId;
}

chatRouter.get("/messages", ...authedProfile, async (req, res) => {
  const teamId = requireTeam(req, res);
  if (!teamId) return;
  const chat = await getTeamChat(req.dbUser!, teamId);
  res.json(chat);
});

chatRouter.post("/messages", ...authedProfile, async (req, res) => {
  const teamId = requireTeam(req, res);
  if (!teamId) return;

  const { body } = req.body as { body?: string };
  if (!body?.trim()) {
    res.status(400).json({ error: "body required" });
    return;
  }

  const result = await postTeamMessage(req.dbUser!, teamId, body);
  const chat = await getTeamChat(req.dbUser!, teamId);
  res.json({
    message: result.message,
    moderationNotice: result.moderationNotice,
    messages: chat.messages,
    reactions: chat.reactions,
  });
});

chatRouter.post("/messages/:messageId/reactions", ...authedProfile, async (req, res) => {
  const teamId = requireTeam(req, res);
  if (!teamId) return;

  const messageId = String(req.params.messageId ?? "");
  const { emoji } = req.body as { emoji?: string };
  if (!emoji) {
    res.status(400).json({ error: "emoji required" });
    return;
  }

  const updated = await reactToMessage(req.dbUser!, teamId, messageId, emoji);
  if (!updated) {
    res.status(404).json({ error: "MESSAGE_NOT_FOUND" });
    return;
  }

  res.json({ message: updated });
});
