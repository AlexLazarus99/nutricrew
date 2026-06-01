import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { apiRouter } from "./routes/index.js";
import { config } from "../config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApiApp(): express.Application {
  const app = express();

  app.use(
    cors({
      origin: [config.webappUrl, "http://localhost:5173"],
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "12mb" }));

  app.use("/api", apiRouter);

  if (process.env.NODE_ENV === "production") {
    const miniappDist = path.resolve(__dirname, "../../../miniapp/dist");
    app.use(express.static(miniappDist));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) return next();
      res.sendFile(path.join(miniappDist, "index.html"), (err) => {
        if (err) next();
      });
    });
  }

  return app;
}
