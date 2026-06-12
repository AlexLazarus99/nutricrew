/**
 * Expands short dish recipes into detailed cooking instructions (EN/RU).
 */

const COMMON = {
  en: {
    gather: "Gather all ingredients, measuring cups, and the pans you will need before you start.",
    wash: "Wash fresh produce under cold water and pat proteins dry with paper towels.",
    season: "Salt and black pepper to taste",
    oil: "1–2 tsp olive oil (or cooking spray)",
    taste: "Taste and adjust seasoning with salt, pepper, or acid (lemon/vinegar) if needed.",
    serve: "Serve immediately while hot and fresh for the best texture and flavor.",
    serveCold: "Serve chilled or at room temperature. Store leftovers in a sealed container up to 2 days.",
    rest: "Let the dish rest 2–3 minutes off the heat so juices redistribute before serving.",
  },
  ru: {
    gather: "Подготовьте все ингредиенты, мерную посуду и сковороду/форму до начала готовки.",
    wash: "Промойте овощи и зелень под холодной водой; мясо и рыбу обсушите бумажным полотенцем.",
    season: "Соль и чёрный перец по вкусу",
    oil: "1–2 ч. л. оливкового масла (или антипригарный спрей)",
    taste: "Попробуйте и при необходимости досолите, поперчите или добавьте кислоту (лимон/уксус).",
    serve: "Подавайте сразу, пока блюдо горячее — так сохраняется лучшая текстура и вкус.",
    serveCold: "Подавайте охлаждённым или при комнатной температуре. Остатки храните в контейнере до 2 суток.",
    rest: "Дайте блюду постоять 2–3 мин без огня, чтобы соки распределились, затем подавайте.",
  },
};

const TIPS = {
  breakfast: {
    en: ["Use thick Greek yogurt for more protein and creaminess.", "Prep overnight oats in a jar with a lid for grab-and-go mornings."],
    ru: ["Для большей плотности берите густой греческий йогурт.", "Овсянку на ночь удобно готовить в банке с крышкой."],
  },
  eggs: {
    en: ["Keep heat medium-low for creamy eggs; high heat makes them rubbery.", "Whisk eggs just before cooking — not much earlier."],
    ru: ["Яйца готовьте на средне-слабом огне — так они остаются нежными.", "Взбивайте яйца непосредственно перед жаркой."],
  },
  salad: {
    en: ["Dress salads right before eating so greens stay crisp.", "Dry lettuce well — dressing slides off wet leaves."],
    ru: ["Заправляйте салат перед подачей, чтобы зелень не полегла.", "Хорошо обсушите листья — на мокрой зелени заправка стекает."],
  },
  soup: {
    en: ["Skim foam from the surface in the first 5 minutes for a clearer broth.", "Cool soup quickly before refrigerating in shallow containers."],
    ru: ["Снимайте пену в первые 5 минут — бульон будет прозрачнее.", "Остужайте суп в мелкой посуде перед холодильником."],
  },
  grill: {
    en: ["Preheat the grill or pan until hot; oil the grates to prevent sticking.", "Do not press meat — juices escape and the surface dries out."],
    ru: ["Разогрейте гриль/сковороду; смажьте решётку маслом от прилипания.", "Не прижимайте мясо шпателем — так сохраняются соки."],
  },
  bake: {
    en: ["Preheat the oven fully before baking — uneven heat causes dry edges.", "Use a thermometer for poultry and fish if unsure about doneness."],
    ru: ["Полностью разогрейте духовку — иначе края пересохнут.", "Для курицы и рыбы удобен кулинарный термометр."],
  },
  pasta: {
    en: ["Salt pasta water generously — it should taste like mild seawater.", "Save pasta water: starch helps sauce cling to noodles."],
    ru: ["Солите воду для пасты щедро — на вкус как слабый океан.", "Сохраняйте воду от пасты: крахмал связывает соус с макаронами."],
  },
  snack: {
    en: ["Portion snacks into small bowls to avoid mindless overeating.", "Pair fruit with protein (nuts, yogurt) for longer satiety."],
    ru: ["Выкладывайте перекус в маленькую миску — так проще контролировать порцию.", "Сочетайте фрукт с белком (орехи, йогурт) для сытости."],
  },
  default: {
    en: ["Taste as you cook and adjust seasoning gradually.", "Leftovers reheat best gently with a splash of water or broth."],
    ru: ["Пробуйте блюдо в процессе и подстраивайте вкус постепенно.", "Остатки лучше разогревать на слабом огне с ложкой воды или бульона."],
  },
};

function detectCategory(dishId, steps) {
  const id = dishId.toLowerCase();
  const text = steps.join(" ").toLowerCase();
  if (/oats|yogurt|parfait|porridge|granola|smoothie|breakfast|toast|honey|fig|overnight/.test(id)) return "breakfast";
  if (/omelette|scramble|frittata|shakshuka|egg|burrito/.test(id) || /egg|scramble|omelette/.test(text)) return "eggs";
  if (/salad|tabbouleh|nicoise|caprese|greens|arugula/.test(id) || /salad|toss|lettuce/.test(text)) return "salad";
  if (/soup|stew|chili|lentil|broth|barley.*soup/.test(id) || /simmer|broth|soup/.test(text)) return "soup";
  if (/grill|skewer|souvlaki|halloumi/.test(id) || /grill/.test(text)) return "grill";
  if (/bake|baked|roast|pizza|lasagna|meatloaf|frittata/.test(id) || /bake|roast|oven|°c/.test(text)) return "bake";
  if (/pasta|orzo|spaghetti|noodle|soba/.test(id) || /pasta|orzo|al dente/.test(text)) return "pasta";
  if (/snack|nuts|hummus|cracker|melon|cottage|edamame|dates|popcorn|celery/.test(id)) return "snack";
  if (/sandwich|wrap|pita|toast/.test(id)) return "breakfast";
  return "default";
}

function hasItem(ingredients, pattern) {
  return ingredients.some((i) => pattern.test(i));
}

function enrichIngredients(ingredients, locale) {
  const c = COMMON[locale];
  const out = [...ingredients];
  if (!hasItem(out, /salt|соль/i)) out.push(c.season);
  if (!hasItem(out, /oil|масл|spray|спрей/i) && !hasItem(out, /yogurt|йогурт|hummus|хумус/i)) {
    out.push(c.oil);
  }
  return out;
}

function expandStep(step, locale, category, index, total) {
  const s = step.trim();
  const low = s.toLowerCase();
  const out = [];

  if (/^spoon|^выложите йогурт|^place cottage|^выложите творог/i.test(s)) {
    out.push(
      locale === "en"
        ? "Choose a bowl or plate slightly larger than your portion so toppings fit comfortably."
        : "Возьмите миску или тарелку чуть больше порции, чтобы сверху поместились добавки.",
      s,
      locale === "en"
        ? "Level the base with the back of a spoon for an even presentation."
        : "Разровняйте основу ложкой для аккуратной подачи.",
    );
    return out;
  }

  if (/toast|подсушите|тостер/i.test(low)) {
    out.push(
      locale === "en"
        ? "Preheat a toaster or dry skillet over medium heat."
        : "Разогрейте тостер или сухую сковороду на среднем огне.",
      locale === "en"
        ? "Toast bread until golden and crisp on both sides, 2–3 minutes per side if using a pan."
        : "Подсушите хлеб до золотистой корочки, 2–3 мин с каждой стороны в сковороде.",
    );
    return out;
  }

  if (/sauté|обжарьте|sauté|pan-fry|жарьте/i.test(low)) {
    out.push(
      locale === "en"
        ? "Heat oil in a non-stick pan over medium heat until shimmering (about 1 minute)."
        : "Разогрейте масло на антипригарной сковороде на среднем огне до лёгкого дымка (~1 мин).",
      s,
      locale === "en"
        ? "Stir or flip occasionally so nothing burns on the bottom."
        : "Периодически помешивайте или переворачивайте, чтобы не пригорело.",
    );
    return out;
  }

  if (/simmer|тушите|варите|cook.*min|готовьте.*мин/i.test(low)) {
    out.push(
      locale === "en"
        ? "Reduce heat to low or medium-low once liquid is bubbling gently."
        : "Убавьте огонь до слабого/средне-слабого, когда жидкость начнёт тихо бурлить.",
      s,
      locale === "en"
        ? "Partially cover the pot if liquid reduces too quickly; stir every few minutes."
        : "Накройте крышкой наполовину, если жидкость уходит слишком быстро; помешивайте.",
    );
    return out;
  }

  if (/bake|запек|roast|°c|духовк/i.test(low)) {
    out.push(
      locale === "en"
        ? "Preheat the oven to the temperature in the recipe while you prep ingredients."
        : "Разогрейте духовку до нужной температуры, пока готовите ингредиенты.",
      locale === "en"
        ? "Place food in a single layer on a lined baking sheet or oven-safe dish for even cooking."
        : "Выложите продукты одним слоем на противень с бумагой или в форму для равномерного запекания.",
      s,
      locale === "en"
        ? "Rotate the tray halfway through if your oven heats unevenly."
        : "Переставьте противень на другой уровень в середине времени, если духовка греет неравномерно.",
    );
    return out;
  }

  if (/grill|гриль/i.test(low)) {
    out.push(
      locale === "en"
        ? "Preheat grill or grill pan on medium-high for 5 minutes; lightly oil the surface."
        : "Разогрейте гриль или сковороду-гриль 5 мин на средне-сильном огне; смажьте поверхность.",
      s,
      locale === "en"
        ? "Flip only once halfway through unless the recipe says otherwise."
        : "Переворачивайте один раз в середине, если рецепт не требует иного.",
    );
    return out;
  }

  if (/mix|смешайте|toss|смешайте|combine|выложите слоями/i.test(low) && index === total - 1) {
    out.push(
      locale === "en"
        ? "Combine components gently so textures stay distinct (do not over-stir delicate greens)."
        : "Соединяйте ингредиенты аккуратно, чтобы сохранить текстуру (зелень не перемешивайте долго).",
      s,
    );
    return out;
  }

  if (/marinate|замаринуйте/i.test(low)) {
    out.push(
      s,
      locale === "en"
        ? "Turn the protein once during marinating so flavor coats evenly."
        : "Переверните белок один раз при мариновании для равномерного вкуса.",
    );
    return out;
  }

  if (/refrigerate|холодильник|overnight|на ночь/i.test(low)) {
    out.push(
      s,
      locale === "en"
        ? "Seal the container tightly to prevent odors and keep the texture fresh."
        : "Плотно закройте ёмкость, чтобы не впитались запахи и сохранилась текстура.",
    );
    return out;
  }

  // Default: prefix with technique hint for first step, echo step with detail
  if (index === 0) {
    out.push(
      locale === "en"
        ? "Prepare ingredients as listed: chop, measure, and set near the stove."
        : "Подготовьте ингредиенты по списку: нарежьте, отмерьте и поставьте рядом с плитой.",
    );
  }
  out.push(s);
  if (index < total - 1) {
    out.push(
      locale === "en"
        ? "Continue to the next step while timing overlaps when possible."
        : "Переходите к следующему шагу; при возможности совмещайте по времени.",
    );
  }
  return out;
}

function estimateTimes(category, steps) {
  const text = steps.join(" ").toLowerCase();
  let prep = 10;
  let cook = 15;
  switch (category) {
    case "breakfast":
      prep = 8;
      cook = /overnight|refrigerate|на ночь/i.test(text) ? 0 : 12;
      break;
    case "eggs":
      prep = 8;
      cook = 10;
      break;
    case "salad":
      prep = 15;
      cook = 0;
      break;
    case "soup":
      prep = 15;
      cook = 30;
      break;
    case "grill":
      prep = 12;
      cook = 18;
      break;
    case "bake":
      prep = 15;
      cook = 25;
      break;
    case "pasta":
      prep = 10;
      cook = 20;
      break;
    case "snack":
      prep = 5;
      cook = 0;
      break;
    default:
      prep = 12;
      cook = 20;
  }
  if (/marinate|замаринуйте/i.test(text)) prep += 15;
  return { prepMinutes: prep, cookMinutes: cook };
}

/**
 * @param {string} dishId
 * @param {{ en: { ingredients: string[], steps: string[] }, ru: { ingredients: string[], steps: string[] } }} recipe
 */
export function enrichRecipe(dishId, recipe) {
  const category = detectCategory(dishId, recipe.en.steps);
  const tips = TIPS[category] ?? TIPS.default;

  function enrichLocale(data, locale) {
    const c = COMMON[locale];
    const ingredients = enrichIngredients(data.ingredients, locale);
    const steps = [c.gather, c.wash];
    const expanded = data.steps.flatMap((step, i) =>
      expandStep(step, locale, category, i, data.steps.length),
    );
    steps.push(...expanded);
    steps.push(c.taste);
    if (category === "salad" || category === "snack") {
      steps.push(c.serveCold);
    } else if (category === "grill" || category === "bake") {
      steps.push(c.rest);
      steps.push(c.serve);
    } else {
      steps.push(c.serve);
    }
    const { prepMinutes, cookMinutes } = estimateTimes(category, data.steps);
    return { ingredients, steps, prepMinutes, cookMinutes, tips: tips[locale] };
  }

  return {
    en: enrichLocale(recipe.en, "en"),
    ru: enrichLocale(recipe.ru, "ru"),
  };
}

/**
 * @param {Record<string, { en: object, ru: object }>} recipes
 */
export function enrichAllRecipes(recipes) {
  const out = {};
  for (const [id, recipe] of Object.entries(recipes)) {
    out[id] = enrichRecipe(id, recipe);
  }
  return out;
}
