export type MicronutrientSnapshot = {
  potassiumMg?: number;
  magnesiumMg?: number;
  calciumMg?: number;
  ironMg?: number;
  fiberG?: number;
  vitaminCMg?: number;
  sodiumMg?: number;
  proteinG?: number;
};

export type NutritionInsight = {
  /** Localized bullet remarks (2–4 items). */
  remarks: string[];
  /** Optional encyclopedic fact. */
  encyclopedia?: string;
};

type OffNutrimentsLike = Record<string, unknown>;

function num(value: unknown): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export function extractMicronutrients(n?: OffNutrimentsLike): MicronutrientSnapshot {
  if (!n) return {};
  return {
    potassiumMg: num(n.potassium_100g ?? n.potassium),
    magnesiumMg: num(n.magnesium_100g ?? n.magnesium),
    calciumMg: num(n.calcium_100g ?? n.calcium),
    ironMg: num(n.iron_100g ?? n.iron),
    fiberG: num(n.fiber_100g ?? n.fiber),
    vitaminCMg: num(n["vitamin-c_100g"] ?? n["vitamin-c"]),
    sodiumMg: num(n.sodium_100g ?? n.sodium),
    proteinG: num(n.proteins_100g ?? n.proteins),
  };
}

function loc(locale: string, ru: string, en: string): string {
  return locale.startsWith("ru") ? ru : en;
}

type ScoredRemark = { score: number; text: string };

function remarkPotassium(v: number, locale: string): ScoredRemark {
  const text =
    v >= 500
      ? loc(
          locale,
          `Богат калием (${Math.round(v)} мг/100 г) — поддерживает давление и работу мышц.`,
          `Rich in potassium (${Math.round(v)} mg/100 g) — supports blood pressure and muscle function.`,
        )
      : loc(
          locale,
          `Содержит калий (${Math.round(v)} мг/100 г) — полезен для водного баланса.`,
          `Contains potassium (${Math.round(v)} mg/100 g) — helps fluid balance.`,
        );
  return { score: v, text };
}

function remarkMagnesium(v: number, locale: string): ScoredRemark {
  const text =
    v >= 80
      ? loc(
          locale,
          `Хороший источник магния (${Math.round(v)} мг/100 г) — важен для нервной системы и сна.`,
          `Good magnesium source (${Math.round(v)} mg/100 g) — supports nerves and sleep.`,
        )
      : loc(
          locale,
          `Содержит магний (${Math.round(v)} мг/100 г) — участвует в энергетическом обмене.`,
          `Contains magnesium (${Math.round(v)} mg/100 g) — involved in energy metabolism.`,
        );
  return { score: v, text };
}

function remarkCalcium(v: number, locale: string): ScoredRemark {
  const text =
    v >= 150
      ? loc(
          locale,
          `Богат кальцием (${Math.round(v)} мг/100 г) — строительный материал для костей и зубов.`,
          `Rich in calcium (${Math.round(v)} mg/100 g) — essential for bones and teeth.`,
        )
      : loc(
          locale,
          `Содержит кальций (${Math.round(v)} мг/100 г) — поддерживает костную ткань.`,
          `Contains calcium (${Math.round(v)} mg/100 g) — supports bone health.`,
        );
  return { score: v, text };
}

function remarkIron(v: number, locale: string): ScoredRemark {
  const text =
    v >= 3.5
      ? loc(
          locale,
          `Источник железа (${v.toFixed(1)} мг/100 г) — помогает переносу кислорода в крови.`,
          `Iron source (${v.toFixed(1)} mg/100 g) — helps oxygen transport in blood.`,
        )
      : loc(
          locale,
          `Содержит железо (${v.toFixed(1)} мг/100 г) — участвует в синтезе гемоглобина.`,
          `Contains iron (${v.toFixed(1)} mg/100 g) — supports hemoglobin production.`,
        );
  return { score: v * 10, text };
}

function remarkFiber(v: number, locale: string): ScoredRemark {
  const text =
    v >= 5
      ? loc(
          locale,
          `Много клетчатки (${v.toFixed(1)} г/100 г) — поддерживает пищеварение и сытость.`,
          `High fiber (${v.toFixed(1)} g/100 g) — supports digestion and fullness.`,
        )
      : loc(
          locale,
          `Содержит клетчатку (${v.toFixed(1)} г/100 г) — полезна для микробиома кишечника.`,
          `Contains fiber (${v.toFixed(1)} g/100 g) — feeds a healthy gut microbiome.`,
        );
  return { score: v * 10, text };
}

function remarkVitaminC(v: number, locale: string): ScoredRemark {
  const text =
    v >= 18
      ? loc(
          locale,
          `Богат витамином C (${Math.round(v)} мг/100 г) — антиоксидант и поддержка иммунитета.`,
          `Rich in vitamin C (${Math.round(v)} mg/100 g) — antioxidant and immune support.`,
        )
      : loc(
          locale,
          `Содержит витамин C (${Math.round(v)} мг/100 g) — участвует в усвоении железа.`,
          `Contains vitamin C (${Math.round(v)} mg/100 g) — helps iron absorption.`,
        );
  return { score: v, text };
}

function remarkProtein(v: number, locale: string): ScoredRemark {
  const text =
    v >= 15
      ? loc(
          locale,
          `Хороший источник белка (${v.toFixed(1)} г/100 г) — важен для мышц и восстановления.`,
          `Good protein source (${v.toFixed(1)} g/100 g) — supports muscle and recovery.`,
        )
      : loc(
          locale,
          `Содержит белок (${v.toFixed(1)} г/100 g) — базовый макронутриент для организма.`,
          `Contains protein (${v.toFixed(1)} g/100 g) — a core macronutrient.`,
        );
  return { score: v, text };
}

function remarkSodiumHigh(v: number, locale: string): ScoredRemark {
  return {
    score: v,
    text: loc(
      locale,
      `Много натрия (${Math.round(v)} мг/100 г) — учитывай при контроле соли и давления.`,
      `High sodium (${Math.round(v)} mg/100 g) — worth noting if you watch salt intake.`,
    ),
  };
}

const ENCYCLOPEDIA: Record<string, { ru: string; en: string }> = {
  potassium: {
    ru: "Калий — ключевой электролит: помогает контролировать давление и работу сердца. Много его в бананах, картофеле и бобовых.",
    en: "Potassium is a key electrolyte for blood pressure and heart rhythm. Bananas, potatoes, and legumes are classic sources.",
  },
  magnesium: {
    ru: "Магний участвует в более чем 300 ферментных реакциях — от энергии до расслабления мышц. Орехи, какао и зелёные овощи — хорошие источники.",
    en: "Magnesium supports 300+ enzyme reactions, from energy to muscle relaxation. Nuts, cocoa, and leafy greens are rich sources.",
  },
  calcium: {
    ru: "Кальций нужен не только костям: он важен для сокращения мышц и передачи нервных импульсов. Молочные продукты — самый известный источник.",
    en: "Calcium supports bones, muscle contraction, and nerve signals. Dairy is the best-known source.",
  },
  iron: {
    ru: "Железо входит в гемоглобин и помогает переносить кислород. Сочетай растительные источники с витамином C для лучшего усвоения.",
    en: "Iron is part of hemoglobin and carries oxygen. Pair plant sources with vitamin C to improve absorption.",
  },
  fiber: {
    ru: "Клетчатка кормит полезные бактерии кишечника и замедляет подъём сахара после еды. Цельные злаки и овощи — база рациона.",
    en: "Fiber feeds gut bacteria and slows blood-sugar spikes after meals. Whole grains and vegetables are foundational.",
  },
  vitaminC: {
    ru: "Витамин C — антиоксидант и «помощник» усвоения железа из растительной пищи. Свежие ягоды и овощи лучше долго не хранить — витамин разрушается.",
    en: "Vitamin C is an antioxidant and helps absorb plant iron. Fresh berries and veggies lose vitamin C over long storage.",
  },
  protein: {
    ru: "Белок ISSN рекомендует распределять равномерно в течение дня — 0,25–0,4 г на кг веса за приём пищи для роста и восстановления мышц.",
    en: "ISSN suggests spreading protein across meals — about 0.25–0.4 g/kg per sitting for muscle repair and growth.",
  },
  omega: {
    ru: "Жирная рыба даёт EPA и DHA — жирные кислоты, связанные с работой мозга и снижением воспаления. 2 порции в неделю — ориентир ВОЗ.",
    en: "Fatty fish provides EPA/DHA omega-3s linked to brain health and lower inflammation. Two servings per week is a common guideline.",
  },
  dairy: {
    ru: "Кисломолочные продукты часто содержат пробиотики и легкоусвояемый белок — удобный перекус после тренировки.",
    en: "Fermented dairy often combines probiotics with easy-to-digest protein — a handy post-workout snack.",
  },
};

type NameHint = { pattern: RegExp; tags: Array<keyof typeof ENCYCLOPEDIA> };

const NAME_HINTS: NameHint[] = [
  { pattern: /творог|сыр|молок|йогурт|кефир|ряжен|простокваш|curd|cheese|milk|yogurt/i, tags: ["dairy", "calcium", "protein"] },
  { pattern: /банан|banana/i, tags: ["potassium"] },
  { pattern: /шпинат|брокколи|капуст|салат|зелен|spinach|broccoli|kale/i, tags: ["iron", "fiber", "vitaminC", "magnesium"] },
  { pattern: /орех|миндал|фундук|кешью|nut|almond|cashew|walnut/i, tags: ["magnesium", "protein"] },
  { pattern: /лосос|семг|рыб|тунец|скумбр|salmon|tuna|fish|sardine/i, tags: ["omega", "protein"] },
  { pattern: /овсян|греч|цельн|булгур|quinoa|oat|buckwheat|whole.?grain/i, tags: ["fiber", "magnesium"] },
  { pattern: /черник|смород|клубник|апельс|лимон|киви|berry|orange|lemon|kiwi/i, tags: ["vitaminC", "fiber"] },
  { pattern: /фасол|чечев|нут|горох|bean|lentil|chickpea|pea/i, tags: ["fiber", "iron", "potassium"] },
  { pattern: /авокад|avocado/i, tags: ["potassium", "magnesium"] },
  { pattern: /яйц|egg/i, tags: ["protein"] },
];

function inferTagsFromName(name: string): Array<keyof typeof ENCYCLOPEDIA> {
  const tags = new Set<keyof typeof ENCYCLOPEDIA>();
  for (const hint of NAME_HINTS) {
    if (hint.pattern.test(name)) {
      for (const tag of hint.tags) tags.add(tag);
    }
  }
  return [...tags];
}

function nameBasedRemarks(name: string, locale: string, proteinG?: number): string[] {
  const tags = inferTagsFromName(name);
  const remarks: string[] = [];

  if (tags.includes("dairy")) {
    remarks.push(
      loc(
        locale,
        "Молочный продукт — классический источник кальция и белка.",
        "Dairy product — a classic source of calcium and protein.",
      ),
    );
  }
  if (tags.includes("potassium")) {
    remarks.push(
      loc(locale, "По типу продукта богат калием.", "Typically rich in potassium for this food type."),
    );
  }
  if (tags.includes("magnesium")) {
    remarks.push(
      loc(locale, "Часто содержит магний — полезен для нервной системы.", "Often provides magnesium — good for nerve function."),
    );
  }
  if (tags.includes("omega")) {
    remarks.push(
      loc(locale, "Рыба — источник белка и омега-3 жирных кислот.", "Fish delivers protein and omega-3 fats."),
    );
  }
  if (tags.includes("fiber")) {
    remarks.push(
      loc(locale, "Продукт с клетчаткой — поддерживает пищеварение.", "A fiber-containing food — supports digestion."),
    );
  }
  if (tags.includes("vitaminC")) {
    remarks.push(
      loc(locale, "Ягоды/фрукты — типичный источник витамина C.", "Berries and fruit — typical vitamin C sources."),
    );
  }
  if (proteinG != null && proteinG >= 10 && !remarks.some((r) => r.includes("белк") || r.toLowerCase().includes("protein"))) {
    remarks.push(
      loc(
        locale,
        `Заметное содержание белка (${proteinG.toFixed(1)} г/100 г).`,
        `Notable protein content (${proteinG.toFixed(1)} g/100 g).`,
      ),
    );
  }

  return remarks.slice(0, 3);
}

function pickEncyclopedia(
  tags: Array<keyof typeof ENCYCLOPEDIA>,
  locale: string,
): string | undefined {
  if (!tags.length) return undefined;
  const key = tags[0]!;
  const entry = ENCYCLOPEDIA[key];
  return entry ? loc(locale, entry.ru, entry.en) : undefined;
}

export function buildNutritionInsight(input: {
  name: string;
  locale?: string;
  micro?: MicronutrientSnapshot;
  proteinG?: number;
}): NutritionInsight {
  const locale = input.locale ?? "ru";
  const micro = input.micro ?? {};
  const proteinG = micro.proteinG ?? input.proteinG;
  const scored: ScoredRemark[] = [];

  if (micro.potassiumMg != null && micro.potassiumMg >= 300) {
    scored.push(remarkPotassium(micro.potassiumMg, locale));
  }
  if (micro.magnesiumMg != null && micro.magnesiumMg >= 50) {
    scored.push(remarkMagnesium(micro.magnesiumMg, locale));
  }
  if (micro.calciumMg != null && micro.calciumMg >= 120) {
    scored.push(remarkCalcium(micro.calciumMg, locale));
  }
  if (micro.ironMg != null && micro.ironMg >= 2) {
    scored.push(remarkIron(micro.ironMg, locale));
  }
  if (micro.fiberG != null && micro.fiberG >= 3.5) {
    scored.push(remarkFiber(micro.fiberG, locale));
  }
  if (micro.vitaminCMg != null && micro.vitaminCMg >= 10) {
    scored.push(remarkVitaminC(micro.vitaminCMg, locale));
  }
  if (proteinG != null && proteinG >= 10) {
    scored.push(remarkProtein(proteinG, locale));
  }
  if (micro.sodiumMg != null && micro.sodiumMg >= 600) {
    scored.push(remarkSodiumHigh(micro.sodiumMg, locale));
  }

  scored.sort((a, b) => b.score - a.score);
  let remarks = scored.slice(0, 3).map((r) => r.text);

  const nameTags = inferTagsFromName(input.name);
  if (remarks.length === 0) {
    remarks = nameBasedRemarks(input.name, locale, proteinG);
  } else if (remarks.length < 2 && nameTags.length) {
    const extra = nameBasedRemarks(input.name, locale, proteinG).filter((r) => !remarks.includes(r));
    remarks = [...remarks, ...extra].slice(0, 3);
  }

  const encyclopedia =
    pickEncyclopedia(
      nameTags.length
        ? nameTags
        : scored.length
          ? (["potassium", "magnesium", "calcium", "iron", "fiber", "vitaminC", "protein"] as const).filter(
              (k) => remarks.some((r) => r.toLowerCase().includes(k === "vitaminC" ? "vitamin c" : k)),
            )
          : [],
      locale,
    ) ?? pickEncyclopedia(nameTags, locale);

  return { remarks, encyclopedia };
}

export function attachNutritionInsight<T extends { description: string; protein: number }>(
  item: T,
  locale: string,
  micro?: MicronutrientSnapshot,
): T & { nutritionRemarks: string[]; encyclopediaNote?: string } {
  const insight = buildNutritionInsight({
    name: item.description,
    locale,
    micro,
    proteinG: micro?.proteinG ?? item.protein,
  });
  return {
    ...item,
    nutritionRemarks: insight.remarks,
    encyclopediaNote: insight.encyclopedia,
  };
}
