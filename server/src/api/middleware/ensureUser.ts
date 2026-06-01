import type { Request, Response, NextFunction } from "express";
import * as usersRepo from "../../repositories/users.js";
import type { DbUser } from "../../types.js";

declare global {
  namespace Express {
    interface Request {
      dbUser?: DbUser;
    }
  }
}

export async function ensureUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const tg = req.telegram!.user;
    req.dbUser = await usersRepo.upsertFromTelegram(tg);
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load user" });
  }
}
