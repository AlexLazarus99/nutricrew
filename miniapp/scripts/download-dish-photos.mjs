/**
 * Fetch dish JPG photos into public/dishes/.
 * Tries Unsplash first, then Pollinations AI fallback from English dish names.
 * Re-run: npm run fetch-dish-photos -w miniapp
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EXTRA_DISH_PHOTO_COPY_FROM } from "./extra-diet-dishes.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const forceRegenerate = args.includes("--force");
const extraOnly = args.includes("--extra");
const aiOnly = args.includes("--ai");
const onlyArg = args.find((a) => a.startsWith("--only="));
const onlyIds = onlyArg ? onlyArg.slice("--only=".length).split(",").filter(Boolean) : null;
const outDir = path.join(__dirname, "../public/dishes");
const dishNames = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../src/locales/dishNames.en.json"), "utf8"),
);

/** dishId → Unsplash URL */
const UNSplash_SOURCES = {
  greekYogurtHoney: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=280&fit=crop&q=80",
  mediterraneanOmelette: "https://images.unsplash.com/photo-1525351484153-7539d54a3312?w=400&h=280&fit=crop&q=80",
  overnightOatsBerries: "https://images.unsplash.com/photo-1517673401475-65b7690e7620?w=400&h=280&fit=crop&q=80",
  grilledSalmonVeg: "https://images.unsplash.com/photo-1467003909585-b0860a7f4452?w=400&h=280&fit=crop&q=80",
  quinoaTabbouleh: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=280&fit=crop&q=80",
  lentilSoup: "https://images.unsplash.com/photo-1547592166-23ac457042cd?w=400&h=280&fit=crop&q=80",
  chickenSouvlaki: "https://images.unsplash.com/photo-1598103441407-217c74035593?w=400&h=280&fit=crop&q=80",
  wholeWheatPastaTomato: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9e9?w=400&h=280&fit=crop&q=80",
  capreseSalad: "https://images.unsplash.com/photo-1592417779058-417bc9d3869a?w=400&h=280&fit=crop&q=80",
  bakedCodHerbs: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b1a8?w=400&h=280&fit=crop&q=80",
  hummusPita: "https://images.unsplash.com/photo-1577805944478-26a8d7ebb960?w=400&h=280&fit=crop&q=80",
  stuffedPeppers: "https://images.unsplash.com/photo-1606755962773-d3247170b345?w=400&h=280&fit=crop&q=80",
  tunaNicoise: "https://images.unsplash.com/photo-1551248429-4096920f9946?w=400&h=280&fit=crop&q=80",
  oliveTapenadeToast: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=280&fit=crop&q=80",
  fruitNuts: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=400&h=280&fit=crop&q=80",
  oatmealBanana: "https://images.unsplash.com/photo-1517673401475-65b7690e7620?w=400&h=280&fit=crop&q=80",
  eggWhiteVeggieScramble: "https://images.unsplash.com/photo-1525351484153-7539d54a3312?w=400&h=280&fit=crop&q=80",
  lowFatYogurtBerries: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=280&fit=crop&q=80",
  grilledChickenBrownRice: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&h=280&fit=crop&q=80",
  turkeyVegetableSoup: "https://images.unsplash.com/photo-1547592166-23ac457042cd?w=400&h=280&fit=crop&q=80",
  bakedSalmonAsparagus: "https://images.unsplash.com/photo-1467003909585-b0860a7f4452?w=400&h=280&fit=crop&q=80",
  beanBurritoBowl: "https://images.unsplash.com/photo-1546069901-ba9599a1e138?w=400&h=280&fit=crop&q=80",
  cottageCheeseMelon: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=280&fit=crop&q=80",
  leanBeefSweetPotato: "https://images.unsplash.com/photo-1606755962773-d3247170b345?w=400&h=280&fit=crop&q=80",
  wholeGrainTurkeySandwich: "https://images.unsplash.com/photo-1528735602780-2552fd466c7d?w=400&h=280&fit=crop&q=80",
  stirFryTofuBroccoli: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=280&fit=crop&q=80",
  lentilStew: "https://images.unsplash.com/photo-1547592166-23ac457042cd?w=400&h=280&fit=crop&q=80",
  unsaltedNutsApple: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=400&h=280&fit=crop&q=80",
  wholeWheatPastaMarinara: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9e9?w=400&h=280&fit=crop&q=80",
  grilledFishQuinoa: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b1a8?w=400&h=280&fit=crop&q=80",
  smoothieBowl: "https://images.unsplash.com/photo-1597305877032-0668ab155b52?w=400&h=280&fit=crop&q=80",
  buddhaBowl: "https://images.unsplash.com/photo-1546069901-ba9599a1e138?w=400&h=280&fit=crop&q=80",
  chickpeaCurry: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400&h=280&fit=crop&q=80",
  trailMixFruit: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=400&h=280&fit=crop&q=80",
  overnightChiaPudding: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=280&fit=crop&q=80",
  falafelPlate: "https://images.unsplash.com/photo-1577805944478-26a8d7ebb960?w=400&h=280&fit=crop&q=80",
  blackBeanTacos: "https://images.unsplash.com/photo-1565299585323-38ed6d0a2840?w=400&h=280&fit=crop&q=80",
  tofuScramble: "https://images.unsplash.com/photo-1525351484153-7539d54a3312?w=400&h=280&fit=crop&q=80",
  minestrone: "https://images.unsplash.com/photo-1547592166-23ac457042cd?w=400&h=280&fit=crop&q=80",
  tempehStirFry: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=280&fit=crop&q=80",
  appleAlmondButter: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=280&fit=crop&q=80",
  avocadoToast: "https://images.unsplash.com/photo-1541519227358-95fa349ade58?w=400&h=280&fit=crop&q=80",
  peanutNoodleSalad: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=280&fit=crop&q=80",
  mushroomRisotto: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&h=280&fit=crop&q=80",
  lentilBolognese: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9e9?w=400&h=280&fit=crop&q=80",
  stuffedSweetPotato: "https://images.unsplash.com/photo-1606755962773-d3247170b345?w=400&h=280&fit=crop&q=80",
  proteinPancakes: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=280&fit=crop&q=80",
  grilledChickenBreastRice: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&h=280&fit=crop&q=80",
  salmonBowl: "https://images.unsplash.com/photo-1467003909585-b0860a7f4452?w=400&h=280&fit=crop&q=80",
  cottageCheeseBerries: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=280&fit=crop&q=80",
  eggWhiteOmeletteCheese: "https://images.unsplash.com/photo-1525351484153-7539d54a3312?w=400&h=280&fit=crop&q=80",
  turkeyMeatballsZucchini: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&h=280&fit=crop&q=80",
  leanSteakSalad: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=280&fit=crop&q=80",
  proteinShakeBanana: "https://images.unsplash.com/photo-1597305877032-0668ab155b52?w=400&h=280&fit=crop&q=80",
  greekYogurtGranola: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=280&fit=crop&q=80",
  tunaSaladWholeGrain: "https://images.unsplash.com/photo-1551248429-4096920f9946?w=400&h=280&fit=crop&q=80",
  beefStirFry: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=280&fit=crop&q=80",
  jerkyApple: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=400&h=280&fit=crop&q=80",
  shrimpQuinoa: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=280&fit=crop&q=80",
  turkeyChili: "https://images.unsplash.com/photo-1547592166-23ac457042cd?w=400&h=280&fit=crop&q=80",
  codSweetPotato: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b1a8?w=400&h=280&fit=crop&q=80",
  wholeGrainCerealMilk: "https://images.unsplash.com/photo-1517673401475-65b7690e7620?w=400&h=280&fit=crop&q=80",
  chickenWrap: "https://images.unsplash.com/photo-1528735602780-2552fd466c7d?w=400&h=280&fit=crop&q=80",
  fishTacos: "https://images.unsplash.com/photo-1565299585323-38ed6d0a2840?w=400&h=280&fit=crop&q=80",
  cheeseCrackersGrapes: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=400&h=280&fit=crop&q=80",
  veggieEggMuffins: "https://images.unsplash.com/photo-1525351484153-7539d54a3312?w=400&h=280&fit=crop&q=80",
  turkeyVeggiePlate: "https://images.unsplash.com/photo-1546069901-ba9599a1e138?w=400&h=280&fit=crop&q=80",
  pastaPrimavera: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9e9?w=400&h=280&fit=crop&q=80",
  peanutButterToastBanana: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=280&fit=crop&q=80",
  chefSalad: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=280&fit=crop&q=80",
  riceBeansCheese: "https://images.unsplash.com/photo-1546069901-ba9599a1e138?w=400&h=280&fit=crop&q=80",
  hamSandwich: "https://images.unsplash.com/photo-1528735602780-2552fd466c7d?w=400&h=280&fit=crop&q=80",
  beefVeggieSkewers: "https://images.unsplash.com/photo-1606755962773-d3247170b345?w=400&h=280&fit=crop&q=80",
  pizzaWholeWheat: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=280&fit=crop&q=80",
  breakfastBurrito: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=280&fit=crop&q=80",
  porkTenderloinGreens: "https://images.unsplash.com/photo-1606755962773-d3247170b345?w=400&h=280&fit=crop&q=80",
};

function hashSeed(value) {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0;
  return h;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hasValidJpg(id) {
  const dest = path.join(outDir, `${id}.jpg`);
  return fs.existsSync(dest) && fs.statSync(dest).size > 2000;
}

function pollinationsUrl(id, label) {
  const prompt = `professional food photography, ${label}, appetizing healthy meal on a plate, natural daylight, 45 degree angle, realistic photo, no text, no logo, no watermark`;
  const seed = hashSeed(id);
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=400&height=280&nologo=true&seed=${seed}`;
}

async function downloadToFile(url, dest, timeoutMs = 180_000) {
  const res = await fetch(url, {
    redirect: "follow",
    headers: { "User-Agent": "NutriCrew/1.0 (local asset fetch)" },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 2000) throw new Error("file too small");
  fs.writeFileSync(dest, buf);
}

async function downloadWithRetries(label, url, dest, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await downloadToFile(url, dest);
      return;
    } catch (err) {
      lastError = err;
      if (attempt < attempts) await sleep(2000 * attempt);
    }
  }
  throw lastError;
}

fs.mkdirSync(outDir, { recursive: true });

let ids = Object.keys(dishNames);
if (extraOnly) {
  ids = Object.keys(EXTRA_DISH_PHOTO_COPY_FROM);
} else if (onlyIds?.length) {
  ids = onlyIds.filter((id) => dishNames[id]);
}

let unsplashOk = 0;
let aiOk = 0;
let skipped = 0;
let failed = 0;

for (const id of ids) {
  const dest = path.join(outDir, `${id}.jpg`);
  if (!forceRegenerate && hasValidJpg(id)) {
    skipped++;
    continue;
  }

  const unsplash = aiOnly ? undefined : UNSplash_SOURCES[id];
  if (unsplash) {
    try {
      await downloadWithRetries(id, unsplash, dest, 2);
      unsplashOk++;
      process.stdout.write(`✓ ${id} (unsplash)\n`);
      await sleep(300);
      continue;
    } catch {
      /* try fallback */
    }
  }

  try {
    const label = dishNames[id] ?? id;
    await downloadWithRetries(label, pollinationsUrl(id, label), dest, 3);
    aiOk++;
    process.stdout.write(`✓ ${id} (ai)\n`);
    await sleep(800);
  } catch (err) {
    failed++;
    process.stderr.write(`✗ ${id}: ${err.message}\n`);
  }
}

console.log(`Done: ${unsplashOk} unsplash, ${aiOk} ai, ${skipped} skipped, ${failed} failed, ${ids.length} total.`);
