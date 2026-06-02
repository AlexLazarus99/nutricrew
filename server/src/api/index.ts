import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { apiRouter } from "./routes/index.js";
import { config } from "../config.js";
import { isAllowedCorsOrigin } from "../lib/corsOrigins.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApiApp(): express.Application {
  const app = express();

  app.use(
    cors({
      origin: (origin, callback) => {
        callback(null, isAllowedCorsOrigin(origin));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "12mb" }));

  app.get("/", (_req, res) => {
    res.json({
      service: "nutricrew-api",
      ok: true,
      health: "/api/health",
      webapp: config.webappUrl,
    });
  });

  app.use("/api", apiRouter);

  if (process.env.NODE_ENV === "production") {
    const miniappDist = path.resolve(__dirname, "../../../miniapp/dist");
    const miniappIndex = path.join(miniappDist, "index.html");
    if (fs.existsSync(miniappIndex)) {
      app.use(express.static(miniappDist));
      app.get("*", (req, res, next) => {
        if (req.path.startsWith("/api")) return next();
        res.sendFile(miniappIndex, (err) => {
          if (err) next();
        });
      });
    }
  }

  return app;
}
