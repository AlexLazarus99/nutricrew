/**
 * Writes miniapp/vercel.json before build.
 * Set VITE_API_URL on Vercel (e.g. https://your-app.onrender.com/api) to proxy /api → backend.
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Default Render API — override with VITE_API_URL on Vercel if needed. */
const DEFAULT_API_URL = "https://nutricrew-dddi.onrender.com/api";
const apiUrl = (process.env.VITE_API_URL ?? process.env.API_PROXY_TARGET ?? DEFAULT_API_URL).trim();

const rewrites = [];

if (apiUrl) {
  const normalized = apiUrl.replace(/\/$/, "");
  const base = normalized.endsWith("/api") ? normalized.slice(0, -4) : normalized;
  rewrites.push({
    source: "/api/:path*",
    destination: `${base}/api/:path*`,
  });
  writeFileSync(
    path.join(root, "public", "runtime-config.json"),
    `${JSON.stringify({ apiUrl: normalized }, null, 2)}\n`,
  );
  console.log(`[prepare-vercel] API proxy: /api/* → ${base}/api/*`);
  console.log(`[prepare-vercel] wrote public/runtime-config.json → ${normalized}`);
} else {
  console.warn("[prepare-vercel] No API URL — using existing vercel.json / runtime-config.json");
}

rewrites.push({ source: "/(.*)", destination: "/index.html" });

const vercelJson = { rewrites };
writeFileSync(path.join(root, "vercel.json"), `${JSON.stringify(vercelJson, null, 2)}\n`);
console.log("[prepare-vercel] wrote vercel.json");
