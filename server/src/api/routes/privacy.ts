import { Router } from "express";
import { authInitData } from "../middleware/authInitData.js";
import { ensureUser } from "../middleware/ensureUser.js";
import { requireProfile } from "../middleware/requireProfile.js";
import { exportUserData, deleteUserAccount } from "../../services/accountPrivacy.js";
import { trackEvents } from "../../services/analytics.js";

export const privacyRouter = Router();
const authed = [authInitData, ensureUser] as const;
const authedProfile = [...authed, requireProfile] as const;

privacyRouter.get("/export", ...authed, async (req, res) => {
  try {
    await trackEvents(req.dbUser!.id, [{ name: "settings_export" }]);
    const data = await exportUserData(req.dbUser!);
    res.json(data);
  } catch (err) {
    console.error("[privacy/export]", err);
    res.status(500).json({ error: "EXPORT_FAILED", message: "Could not export user data" });
  }
});

privacyRouter.delete("/account", ...authedProfile, async (req, res) => {
  const userId = req.dbUser!.id;
  await trackEvents(userId, [{ name: "settings_delete" }]);
  await deleteUserAccount(userId);
  res.json({ ok: true });
});
