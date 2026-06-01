import type { Request, Response, NextFunction } from "express";
import { config } from "../../config.js";
import {
  isInitDataFresh,
  parseInitData,
  validateInitData,
  type ParsedInitData,
} from "../../lib/telegramAuth.js";

declare global {
  namespace Express {
    interface Request {
      telegram?: ParsedInitData;
    }
  }
}

const DEV_MOCK_USER: ParsedInitData = {
  user: {
    id: 999_001,
    first_name: "Alex",
    username: "alex_dev",
    language_code: "en",
  },
  authDate: Math.floor(Date.now() / 1000),
};

export function authInitData(req: Request, res: Response, next: NextFunction): void {
  const initData =
    req.headers["x-telegram-init-data"]?.toString() ??
    req.query.initData?.toString();

  if (!initData) {
    if (config.devBypassAuth && config.isDev) {
      req.telegram = { ...DEV_MOCK_USER, authDate: Math.floor(Date.now() / 1000) };
      next();
      return;
    }
    res.status(401).json({ error: "Missing Telegram init data" });
    return;
  }

  if (config.devBypassAuth && config.isDev && initData === "dev") {
    req.telegram = { ...DEV_MOCK_USER, authDate: Math.floor(Date.now() / 1000) };
    next();
    return;
  }

  if (!config.botToken) {
    res.status(503).json({ error: "Bot token not configured" });
    return;
  }

  if (!validateInitData(initData, config.botToken)) {
    res.status(401).json({ error: "Invalid init data" });
    return;
  }

  const parsed = parseInitData(initData);
  if (!parsed || !isInitDataFresh(parsed.authDate)) {
    res.status(401).json({ error: "Expired or malformed init data" });
    return;
  }

  req.telegram = parsed;
  next();
}
