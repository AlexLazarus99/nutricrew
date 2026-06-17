import { pathToFileURL } from "node:url";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "output");

const HTML_FILES = [
  "creatives.html",
  "creatives-en.html",
  "creatives-streak-en.html",
  "creatives-viral-en.html",
];

function resolveChromeExecutable() {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
  ].filter(Boolean);
  return candidates.find((p) => fs.existsSync(p));
}

async function exportCreativesFromPage(page, outDir) {
  const creatives = await page.$$eval(".creative[data-export], .poster[data-export]", (els) =>
    els.map((el) => ({
      selector: `[data-export="${el.getAttribute("data-export")}"]`,
      filename: el.getAttribute("data-export"),
      width: Number(el.getAttribute("data-w")),
      height: Number(el.getAttribute("data-h")),
    })),
  );

  for (const { selector, filename, width, height } of creatives) {
    const el = await page.$(selector);
    if (!el) {
      console.warn(`Skip: ${filename} (element not found)`);
      continue;
    }
    const outPath = path.join(outDir, filename);
    await el.screenshot({ path: outPath, type: "png" });
    console.log(`Created: ${outPath} (${width}×${height})`);
  }

  return creatives.length;
}

async function main() {
  let puppeteer;
  try {
    puppeteer = await import("puppeteer");
  } catch {
    console.error("Install puppeteer first: npm install (in docs/ folder)");
    process.exit(1);
  }

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const executablePath = resolveChromeExecutable();

  const browser = await puppeteer.default.launch({
    headless: true,
    executablePath,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--font-render-hinting=none"],
  });

  let total = 0;

  for (const htmlFile of HTML_FILES) {
    const htmlPath = path.join(__dirname, htmlFile);
    if (!fs.existsSync(htmlPath)) {
      console.warn(`Skip missing: ${htmlFile}`);
      continue;
    }

    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900, deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle0", timeout: 60000 });
    await page.evaluateHandle("document.fonts.ready");

    console.log(`\nRendering ${htmlFile}…`);
    total += await exportCreativesFromPage(page, outDir);
    await page.close();
  }

  await browser.close();
  console.log(`\nDone — ${total} images in ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
