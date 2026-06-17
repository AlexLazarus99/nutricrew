import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LOCALE_UI_PATCHES } from "./locale-ui-patches.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.resolve(__dirname, "../src/locales");
const enPath = path.join(localesDir, "en.json");

function deepMerge(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      target[key] = deepMerge({ ...(target[key] ?? {}) }, value);
    } else {
      target[key] = value;
    }
  }
  return target;
}

const en = JSON.parse(fs.readFileSync(enPath, "utf8"));

for (const [locale, patch] of Object.entries(LOCALE_UI_PATCHES)) {
  const merged = deepMerge(structuredClone(en), patch);
  const out = path.join(localesDir, `${locale}.json`);
  fs.writeFileSync(out, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
  console.log(`Wrote ${locale}.json`);
}

console.log("Done.");
