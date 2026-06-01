import { pathToFileURL } from "node:url";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pdfDir = path.resolve(__dirname, "..", "pdf");
const outDir = path.resolve(__dirname, "..", "output");

const pages = [
  { html: "pitch-en.html", pdf: "NutriCrew-Pitch-EN.pdf" },
  { html: "pitch-ru.html", pdf: "NutriCrew-Pitch-RU.pdf" },
];

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

  const browser = await puppeteer.default.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  for (const { html, pdf } of pages) {
    const htmlPath = path.join(pdfDir, html);
    const pdfPath = path.join(outDir, pdf);
    const page = await browser.newPage();
    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle0" });
    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", right: "12mm", bottom: "10mm", left: "12mm" },
    });
    await page.close();
    console.log(`Created: ${pdfPath}`);
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
