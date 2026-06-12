import { pathToFileURL } from "node:url";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, "creatives.html");
const outDir = path.join(__dirname, "output");

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

  const chromePaths = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ].filter(Boolean);

  const executablePath = chromePaths.find((p) => fs.existsSync(p));

  const browser = await puppeteer.default.launch({
    headless: true,
    executablePath,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--font-render-hinting=none"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle0", timeout: 60000 });
  await page.evaluateHandle("document.fonts.ready");

  const creatives = await page.$$eval(".creative[data-export]", (els) =>
    els.map((el) => ({
      selector: `[data-export="${el.getAttribute("data-export")}"]`,
      filename: el.getAttribute("data-export"),
      width: Number(el.getAttribute("data-w")),
      height: Number(el.getAttribute("data-h")),
    }))
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

  await browser.close();
  console.log(`\nDone — ${creatives.length} images in ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
