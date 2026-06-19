import type { Request, Response, NextFunction } from "express";
import { getUserAccessStatus } from "../../services/userAccess.js";

export async function requireAppAccess(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const user = req.dbUser;
  if (!user) {
    res.status(401).json({ error: "UNAUTHORIZED" });
    return;
  }

  const access = await getUserAccessStatus(user.id);
  if (!access.hasAccess) {
    res.status(403).json({
      error: "ACCESS_REQUIRED",
      access,
    });
    return;
  }

  next();
}
