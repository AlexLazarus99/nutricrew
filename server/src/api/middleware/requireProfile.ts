import type { Request, Response, NextFunction } from "express";
import { isProfileComplete } from "../../lib/profileValidation.js";

export function requireProfile(req: Request, res: Response, next: NextFunction): void {
  const user = req.dbUser;
  if (!user || !isProfileComplete(user)) {
    res.status(403).json({
      error: "PROFILE_INCOMPLETE",
      message: "Weight, height and age are required to continue",
    });
    return;
  }
  next();
}
