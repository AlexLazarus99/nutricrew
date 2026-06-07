export type OffPer100g = {
  barcode: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingGrams: number;
  brand?: string;
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
  code?: string;
  product?: OffProduct;
};

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
  if (locale === "ru" && product.product_name_ru?.trim()) {
    return product.product_name_ru.trim();
  }
  if (product.product_name?.trim()) return product.product_name.trim();
  if (product.product_name_en?.trim()) return product.product_name_en.trim();
  return "Product";
}

const OFF_HOSTS = [
  "https://world.openfoodfacts.org",
  "https://ru.openfoodfacts.org",
] as const;

async function fetchOffProduct(barcode: string, host: string): Promise<OffResponse | null> {
  const res = await fetch(`${host}/api/v2/product/${encodeURIComponent(barcode)}.json`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;
  return (await res.json()) as OffResponse;
}

export async function lookupBarcode(
  barcode: string,
  locale: string,
): Promise<OffPer100g | null> {
  const code = barcode.replace(/\D/g, "");
  if (code.length < 8) return null;

  for (const host of OFF_HOSTS) {
    const data = await fetchOffProduct(code, host);
    if (!data || data.status !== 1 || !data.product) continue;

    const n = data.product.nutriments ?? {};
    const calories = num(n["energy-kcal_100g"] ?? n["energy-kcal"]);
    const protein = num(n.proteins_100g ?? n.proteins);
    const carbs = num(n.carbohydrates_100g ?? n.carbohydrates);
    const fat = num(n.fat_100g ?? n.fat);

    if (calories <= 0 && protein <= 0 && carbs <= 0 && fat <= 0) continue;

    return {
      barcode: code,
      name: pickName(data.product, locale),
      calories: calories > 0 ? calories : Math.round(protein * 4 + carbs * 4 + fat * 9),
      protein,
      carbs,
      fat,
      servingGrams: parseServingGrams(data.product.serving_size),
      brand: data.product.brands?.split(",")[0]?.trim(),
    };
  }

  return null;
}
