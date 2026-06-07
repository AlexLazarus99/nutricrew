/**
 * Refresh Russian barcode catalog from Open Food Facts (Russia-tagged products).
 * Run: node scripts/build-russian-barcodes.mjs
 */
import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "../src/data/russianBarcodes.json");
const UA = "NutriCrew/1.0 (https://nutricrew.app; barcode-seed)";
const TARGET = 280;

const SEARCH_TERMS = [
  "молоко",
  "кефир",
  "творог",
  "йогурт",
  "сыр",
  "хлеб",
  "колбаса",
  "сосиски",
  "гречка",
  "макароны",
  "рис",
  "овсянка",
  "шоколад",
  "печенье",
  "сок",
  "вода",
  "масло",
  "сметана",
  "сгущенка",
  "простоквашино",
  "домик в деревне",
  "активия",
  "danone",
  "bonduelle",
  "макфа",
  "мистраль",
  "vkusvill",
  "перекресток",
  "coca-cola",
  "snickers",
  "lays",
  "nutella",
  "bounty",
  "milka",
  "kinder",
  "doshirak",
  "роллтон",
];

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function parseServingGrams(servingSize) {
  if (!servingSize) return 100;
  const match = String(servingSize).match(/([\d.,]+)\s*(g|ml|грам|гр|г)/i);
  if (match) return Math.max(1, Math.round(Number(match[1].replace(",", "."))));
  const digits = String(servingSize).match(/([\d.,]+)/);
  if (digits) return Math.max(1, Math.round(Number(digits[1].replace(",", "."))));
  return 100;
}

function pickName(p) {
  return (p.product_name_ru || p.product_name || p.product_name_en || "Продукт").trim();
}

function toEntry(p) {
  const n = p.nutriments ?? {};
  const calories = num(n["energy-kcal_100g"] ?? n["energy-kcal"]);
  const protein = num(n.proteins_100g ?? n.proteins);
  const carbs = num(n.carbohydrates_100g ?? n.carbohydrates);
  const fat = num(n.fat_100g ?? n.fat);
  if (calories <= 0 && protein <= 0 && carbs <= 0 && fat <= 0) return null;

  const code = String(p.code ?? p._id ?? "").replace(/\D/g, "");
  if (code.length < 8) return null;

  return {
    barcode: code,
    name: pickName(p),
    brand: p.brands?.split(",")[0]?.trim() || undefined,
    calories: calories > 0 ? Math.round(calories) : Math.round(protein * 4 + carbs * 4 + fat * 9),
    protein: Math.round(protein * 10) / 10,
    carbs: Math.round(carbs * 10) / 10,
    fat: Math.round(fat * 10) / 10,
    servingGrams: parseServingGrams(p.serving_size),
    source: "ru_catalog",
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchTerm(term, attempt = 1) {
  const url = new URL("https://world.openfoodfacts.org/cgi/search.pl");
  url.searchParams.set("search_terms", term);
  url.searchParams.set("tagtype_0", "countries");
  url.searchParams.set("tag_contains_0", "contains");
  url.searchParams.set("tag_0", "en:russia");
  url.searchParams.set("json", "1");
  url.searchParams.set("page_size", "20");
  url.searchParams.set(
    "fields",
    "code,_id,product_name,product_name_ru,product_name_en,brands,nutriments,serving_size",
  );

  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (res.status === 503 && attempt < 4) {
    await sleep(4000 * attempt);
    return fetchTerm(term, attempt + 1);
  }
  if (!res.ok) throw new Error(`OFF "${term}": HTTP ${res.status}`);
  return res.json();
}

const byCode = new Map();

for (const term of SEARCH_TERMS) {
  if (byCode.size >= TARGET) break;
  try {
    const data = await fetchTerm(term);
    let added = 0;
    for (const p of data.products ?? []) {
      const entry = toEntry(p);
      if (entry && !byCode.has(entry.barcode)) {
        byCode.set(entry.barcode, entry);
        added += 1;
      }
    }
    console.log(`${term}: +${added} (total ${byCode.size})`);
  } catch (err) {
    console.warn(`${term}: ${(err).message}`);
  }
  await sleep(2500);
}

const list = [...byCode.values()].sort((a, b) => a.name.localeCompare(b.name, "ru"));
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(list, null, 2) + "\n", "utf8");
console.log(`Wrote ${list.length} entries → ${OUT}`);
