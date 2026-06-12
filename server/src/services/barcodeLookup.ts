import ruCatalogSeed from "../data/russianBarcodes.json" with { type: "json" };
import {
  buildNutritionInsight,
  extractMicronutrients,
  type MicronutrientSnapshot,
  type NutritionInsight,
} from "./nutritionRemarks.js";

export type BarcodeProduct = {
  barcode: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingGrams: number;
  brand?: string;
  source: "ru_catalog" | "off_ru" | "off_world";
  nutritionRemarks?: string[];
  encyclopediaNote?: string;
};

type RussianBarcodeSeed = {
  barcode: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingGrams: number;
  brand?: string;
  source?: string;
};

type OffNutriments = {
  "energy-kcal_100g"?: number;
  "energy-kcal"?: number;
  proteins_100g?: number;
  proteins?: number;
  carbohydrates_100g?: number;
  carbohydrates?: number;
  fat_100g?: number;
  fat?: number;
  potassium_100g?: number;
  potassium?: number;
  magnesium_100g?: number;
  magnesium?: number;
  calcium_100g?: number;
  calcium?: number;
  iron_100g?: number;
  iron?: number;
  fiber_100g?: number;
  fiber?: number;
  sodium_100g?: number;
  sodium?: number;
  "vitamin-c_100g"?: number;
  "vitamin-c"?: number;
};

type OffProduct = {
  product_name?: string;
  product_name_ru?: string;
  product_name_en?: string;
  brands?: string;
  serving_size?: string;
  nutriments?: OffNutriments;
};

type OffResponse = {
  status: number;
  product?: OffProduct;
};

const UA = "NutriCrew/1.0 (https://nutricrew.app)";

let ruCatalogByBarcode: Map<string, BarcodeProduct> | null = null;

function loadRuCatalog(): Map<string, BarcodeProduct> {
  if (ruCatalogByBarcode) return ruCatalogByBarcode;

  const list = ruCatalogSeed as RussianBarcodeSeed[];
  ruCatalogByBarcode = new Map();

  for (const item of list) {
    const code = item.barcode.replace(/\D/g, "");
    if (code.length < 8) continue;
    ruCatalogByBarcode.set(code, {
      barcode: code,
      name: item.name,
      brand: item.brand,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      servingGrams: item.servingGrams || 100,
      source: "ru_catalog",
    });
  }

  return ruCatalogByBarcode;
}

export function getRuCatalogSize(): number {
  return loadRuCatalog().size;
}

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function parseServingGrams(servingSize?: string): number {
  if (!servingSize) return 100;
  const match = servingSize.match(/([\d.,]+)\s*(g|ml|грам|гр|г)/i);
  if (match) {
    return Math.max(1, Math.round(Number(match[1]!.replace(",", "."))));
  }
  const digits = servingSize.match(/([\d.,]+)/);
  if (digits) {
    return Math.max(1, Math.round(Number(digits[1]!.replace(",", "."))));
  }
  return 100;
}

function pickName(product: OffProduct, locale: string): string {
  if (locale.startsWith("ru") && product.product_name_ru?.trim()) {
    return product.product_name_ru.trim();
  }
  if (product.product_name?.trim()) return product.product_name.trim();
  if (product.product_name_en?.trim()) return product.product_name_en.trim();
  return "Product";
}

function withNutritionInsight(
  product: Omit<BarcodeProduct, "nutritionRemarks" | "encyclopediaNote">,
  locale: string,
  micro?: MicronutrientSnapshot,
): BarcodeProduct {
  const insight: NutritionInsight = buildNutritionInsight({
    name: product.name,
    locale,
    micro,
    proteinG: product.protein,
  });
  return {
    ...product,
    nutritionRemarks: insight.remarks,
    encyclopediaNote: insight.encyclopedia,
  };
}

function parseOffProduct(
  code: string,
  product: OffProduct,
  locale: string,
  source: "off_ru" | "off_world",
): BarcodeProduct | null {
  const n = product.nutriments ?? {};
  const calories = num(n["energy-kcal_100g"] ?? n["energy-kcal"]);
  const protein = num(n.proteins_100g ?? n.proteins);
  const carbs = num(n.carbohydrates_100g ?? n.carbohydrates);
  const fat = num(n.fat_100g ?? n.fat);

  if (calories <= 0 && protein <= 0 && carbs <= 0 && fat <= 0) return null;

  const base = {
    barcode: code,
    name: pickName(product, locale),
    brand: product.brands?.split(",")[0]?.trim(),
    calories: calories > 0 ? Math.round(calories) : Math.round(protein * 4 + carbs * 4 + fat * 9),
    protein: Math.round(protein * 10) / 10,
    carbs: Math.round(carbs * 10) / 10,
    fat: Math.round(fat * 10) / 10,
    servingGrams: parseServingGrams(product.serving_size),
    source,
  };

  const micro = extractMicronutrients(product.nutriments as Record<string, unknown>);
  micro.proteinG = base.protein;

  return withNutritionInsight(base, locale, micro);
}

async function fetchOffProduct(
  barcode: string,
  host: "ru" | "world",
): Promise<BarcodeProduct | null> {
  const base =
    host === "ru" ? "https://ru.openfoodfacts.org" : "https://world.openfoodfacts.org";
  const res = await fetch(`${base}/api/v2/product/${encodeURIComponent(barcode)}.json`, {
    headers: { Accept: "application/json", "User-Agent": UA },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as OffResponse;
  if (data.status !== 1 || !data.product) return null;

  return parseOffProduct(barcode, data.product, "ru", host === "ru" ? "off_ru" : "off_world");
}

export async function lookupBarcodeProduct(
  barcode: string,
  locale = "ru",
): Promise<BarcodeProduct | null> {
  const code = barcode.replace(/\D/g, "");
  if (code.length < 8) return null;

  const local = loadRuCatalog().get(code);
  if (local) {
    return withNutritionInsight(local, locale, { proteinG: local.protein });
  }

  const preferRu = locale.startsWith("ru");
  const hosts: Array<"ru" | "world"> = preferRu ? ["ru", "world"] : ["world", "ru"];

  for (const host of hosts) {
    const off = await fetchOffProduct(code, host);
    if (off) return off;
  }

  return null;
}

export type SearchProduct = {
  id: string;
  name: string;
  brand?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingGrams: number;
  source: string;
  nutritionRemarks?: string[];
  encyclopediaNote?: string;
};

type OffSearchHit = {
  code?: string;
  product_name?: string;
  product_name_ru?: string;
  brands?: string;
  nutriments?: OffNutriments;
  serving_size?: string;
};

type OffSearchResponse = {
  products?: OffSearchHit[];
};

function searchLocalCatalog(query: string, limit: number, locale: string): SearchProduct[] {
  const q = query.toLowerCase().trim();
  if (q.length < 2) return [];
  const out: SearchProduct[] = [];
  for (const p of loadRuCatalog().values()) {
    if (p.name.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q)) {
      const insight = buildNutritionInsight({
        name: p.name,
        locale,
        proteinG: p.protein,
      });
      out.push({
        id: p.barcode,
        name: p.name,
        brand: p.brand,
        calories: p.calories,
        protein: p.protein,
        carbs: p.carbs,
        fat: p.fat,
        servingGrams: p.servingGrams,
        source: p.source,
        nutritionRemarks: insight.remarks,
        encyclopediaNote: insight.encyclopedia,
      });
      if (out.length >= limit) break;
    }
  }
  return out;
}

function hitToSearchProduct(hit: OffSearchHit, locale: string): SearchProduct | null {
  if (!hit.code) return null;
  const fake: OffProduct = {
    product_name: hit.product_name,
    product_name_ru: hit.product_name_ru,
    brands: hit.brands,
    nutriments: hit.nutriments,
    serving_size: hit.serving_size,
  };
  const parsed = parseOffProduct(hit.code, fake, locale, "off_world");
  if (!parsed) return null;
  return {
    id: parsed.barcode,
    name: parsed.name,
    brand: parsed.brand,
    calories: parsed.calories,
    protein: parsed.protein,
    carbs: parsed.carbs,
    fat: parsed.fat,
    servingGrams: parsed.servingGrams,
    source: parsed.source,
    nutritionRemarks: parsed.nutritionRemarks,
    encyclopediaNote: parsed.encyclopediaNote,
  };
}

export async function searchProducts(
  query: string,
  locale = "ru",
  limit = 12,
): Promise<SearchProduct[]> {
  const q = query.trim();
  if (q.length < 3) return searchLocalCatalog(q, limit, locale);

  const local = searchLocalCatalog(q, limit, locale);
  const host = locale.startsWith("ru") ? "ru.openfoodfacts.org" : "world.openfoodfacts.org";
  try {
    const url = `https://${host}/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=${limit}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": UA },
    });
    if (!res.ok) return local;
    const data = (await res.json()) as OffSearchResponse;
    const remote = (data.products ?? [])
      .map((h) => hitToSearchProduct(h, locale))
      .filter((p): p is SearchProduct => p != null);
    const seen = new Set<string>();
    const merged: SearchProduct[] = [];
    for (const p of [...local, ...remote]) {
      const key = p.id || p.name;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(p);
      if (merged.length >= limit) break;
    }
    return merged;
  } catch {
    return local;
  }
}
