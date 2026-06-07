import { Router } from "express";
import { authInitData } from "../middleware/authInitData.js";
import { ensureUser } from "../middleware/ensureUser.js";
import { requireProfile } from "../middleware/requireProfile.js";
import { exportUserData, deleteUserAccount } from "../../services/accountPrivacy.js";
import { trackEvents } from "../../services/analytics.js";

export const privacyRouter = Router();
const authedProfile = [authInitData, ensureUser, requireProfile] as const;

privacyRouter.get("/export", ...authedProfile, async (req, res) => {
  await trackEvents(req.dbUser!.id, [{ name: "settings_export" }]);
  const data = await exportUserData(req.dbUser!);
  res.json(data);
});

privacyRouter.delete("/account", ...authedProfile, async (req, res) => {
  const userId = req.dbUser!.id;
  await trackEvents(userId, [{ name: "settings_delete" }]);
  await deleteUserAccount(userId);
  res.json({ ok: true });
});
