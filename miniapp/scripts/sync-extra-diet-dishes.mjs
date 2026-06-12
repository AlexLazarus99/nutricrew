/**
 * Merge extra diet dishes into locales + copy photo JPGs.
 * Run: node scripts/sync-extra-diet-dishes.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EXTRA_DISH_NAMES, EXTRA_DISH_RECIPES, EXTRA_DISH_PHOTO_COPY_FROM } from "./extra-diet-dishes.mjs";
import { enrichRecipe } from "./recipe-enricher.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dishesDir = path.join(root, "public/dishes");

function mergeJson(relPath, patch) {
  const full = path.join(root, relPath);
  const base = JSON.parse(fs.readFileSync(full, "utf8"));
  Object.assign(base, patch);
  const sorted = Object.fromEntries(Object.keys(base).sort().map((k) => [k, base[k]]));
  fs.writeFileSync(full, JSON.stringify(sorted, null, 2) + "\n");
}

mergeJson("src/locales/dishNames.en.json", EXTRA_DISH_NAMES.en);
mergeJson("src/locales/dishNames.ru.json", EXTRA_DISH_NAMES.ru);

const recipesEn = {};
const recipesRu = {};
for (const [id, data] of Object.entries(EXTRA_DISH_RECIPES)) {
  const rich = enrichRecipe(id, data);
  recipesEn[id] = rich.en;
  recipesRu[id] = rich.ru;
}
mergeJson("src/locales/dishRecipes.en.json", recipesEn);
mergeJson("src/locales/dishRecipes.ru.json", recipesRu);

let copied = 0;
for (const [id, sourceId] of Object.entries(EXTRA_DISH_PHOTO_COPY_FROM)) {
  const dest = path.join(dishesDir, `${id}.jpg`);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 2000) continue;
  const source = path.join(dishesDir, `${sourceId}.jpg`);
  if (!fs.existsSync(source)) {
    console.warn(`Missing source photo for ${id}: ${sourceId}.jpg`);
    continue;
  }
  fs.copyFileSync(source, dest);
  copied++;
}

console.log(`Merged ${Object.keys(EXTRA_DISH_RECIPES).length} extra dishes; copied ${copied} photos.`);
