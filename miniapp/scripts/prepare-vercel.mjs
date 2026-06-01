/**
 * Writes miniapp/vercel.json before build.
 * Set VITE_API_URL on Vercel (e.g. https://your-app.onrender.com/api) to proxy /api → backend.
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apiUrl = (process.env.VITE_API_URL ?? process.env.API_PROXY_TARGET ?? "").trim();

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
  console.log(`[prepare-vercel] wrote public/runtime-config.json`);
} else {
  console.warn(
    "[prepare-vercel] VITE_API_URL not set — add it on Vercel (e.g. https://your-app.onrender.com/api) and redeploy.",
  );
}

rewrites.push({ source: "/(.*)", destination: "/index.html" });

const vercelJson = { rewrites };
writeFileSync(path.join(root, "vercel.json"), `${JSON.stringify(vercelJson, null, 2)}\n`);
console.log("[prepare-vercel] wrote vercel.json");
