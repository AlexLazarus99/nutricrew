/**
 * Writes miniapp/vercel.json before build (routes: API proxy + static files + SPA).
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const DEFAULT_API_URL = "https://nutricrew-dddi.onrender.com/api";
const apiUrl = (process.env.VITE_API_URL ?? process.env.API_PROXY_TARGET ?? DEFAULT_API_URL).trim();

const normalized = apiUrl.replace(/\/$/, "");
const base = normalized.endsWith("/api") ? normalized.slice(0, -4) : normalized;

writeFileSync(
  path.join(root, "public", "runtime-config.json"),
  `${JSON.stringify({ apiUrl: normalized }, null, 2)}\n`,
);

const vercelJson = {
  routes: [
    { src: "/api/(.*)", dest: `${base}/api/$1` },
    { handle: "filesystem" },
    { src: "/(.*)", dest: "/index.html" },
  ],
};

writeFileSync(path.join(root, "vercel.json"), `${JSON.stringify(vercelJson, null, 2)}\n`);
console.log(`[prepare-vercel] /api → ${base}/api/*`);
