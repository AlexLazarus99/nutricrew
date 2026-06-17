import { pathToFileURL } from "node:url";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pdfDir = path.resolve(__dirname, "..", "pdf");
const outDir = path.resolve(__dirname, "..", "marketing", "output");

const pages = [
  {
    html: "7-day-deficit-guide-ru.html",
    pdf: "NutriCrew-7-Day-Deficit-RU.pdf",
  },
];

function resolveChromeExecutable() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    path.join(process.env.LOCALAPPDATA ?? "", "Google", "Chrome", "Application", "chrome.exe"),
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
  ];
  return candidates.find((p) => p && fs.existsSync(p));
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

  const chromePath = resolveChromeExecutable();
  const launchOpts = {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  };
  if (chromePath) {
    launchOpts.executablePath = chromePath;
    console.log("Using Chrome:", chromePath);
  }

  const browser = await puppeteer.default.launch(launchOpts);

  for (const { html, pdf } of pages) {
    const htmlPath = path.join(pdfDir, html);
    const pdfPath = path.join(outDir, pdf);
    const page = await browser.newPage();
    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle0" });
    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    await page.close();
    console.log("Wrote", pdfPath);
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
