/**
 * Writes miniapp/vercel.json before build (routes: API proxy + static files + SPA).
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readAppBuild() {
  const src = readFileSync(path.join(root, "src/lib/apiBase.ts"), "utf8");
  const m = src.match(/APP_BUILD\s*=\s*"([^"]+)"/);
  return m?.[1] ?? "unknown";
}

const DEFAULT_API_URL = "https://nutricrew-dddi.onrender.com/api";
const apiUrl = (process.env.VITE_API_URL ?? process.env.API_PROXY_TARGET ?? DEFAULT_API_URL).trim();

const normalized = apiUrl.replace(/\/$/, "");
const base = normalized.endsWith("/api") ? normalized.slice(0, -4) : normalized;

const appBuild = readAppBuild();
writeFileSync(
  path.join(root, "public", "runtime-config.json"),
  `${JSON.stringify({ apiUrl: normalized, build: appBuild, builtAt: new Date().toISOString() }, null, 2)}\n`,
);
console.log(`[prepare-vercel] build ${appBuild}`);

const vercelJson = {
  headers: [
    {
      source: "/index.html",
      headers: [
        { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
      ],
    },
    {
      source: "/assets/(.*)",
      headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
    },
  ],
  routes: [
    { src: "/api/(.*)", dest: `${base}/api/$1` },
    { handle: "filesystem" },
    { src: "/(.*)", dest: "/index.html" },
  ],
};

writeFileSync(path.join(root, "vercel.json"), `${JSON.stringify(vercelJson, null, 2)}\n`);
console.log(`[prepare-vercel] /api → ${base}/api/*`);
