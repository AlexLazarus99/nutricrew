/**
 * Generates local SVG dish illustrations in public/dishes/ (no network).
 * Re-run: npm run generate-dish-photos -w miniapp
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "../public/dishes");

const DISH_IDS = [
  "greekYogurtHoney", "mediterraneanOmelette", "overnightOatsBerries", "grilledSalmonVeg",
  "quinoaTabbouleh", "lentilSoup", "chickenSouvlaki", "wholeWheatPastaTomato", "capreseSalad",
  "bakedCodHerbs", "hummusPita", "stuffedPeppers", "tunaNicoise", "oliveTapenadeToast", "fruitNuts",
  "oatmealBanana", "eggWhiteVeggieScramble", "lowFatYogurtBerries", "grilledChickenBrownRice",
  "turkeyVegetableSoup", "bakedSalmonAsparagus", "beanBurritoBowl", "cottageCheeseMelon",
  "leanBeefSweetPotato", "wholeGrainTurkeySandwich", "stirFryTofuBroccoli", "lentilStew",
  "unsaltedNutsApple", "wholeWheatPastaMarinara", "grilledFishQuinoa", "smoothieBowl", "buddhaBowl",
  "chickpeaCurry", "trailMixFruit", "overnightChiaPudding", "falafelPlate", "blackBeanTacos",
  "tofuScramble", "minestrone", "tempehStirFry", "appleAlmondButter", "avocadoToast",
  "peanutNoodleSalad", "mushroomRisotto", "lentilBolognese", "stuffedSweetPotato",
  "proteinPancakes", "grilledChickenBreastRice", "salmonBowl", "cottageCheeseBerries",
  "eggWhiteOmeletteCheese", "turkeyMeatballsZucchini", "leanSteakSalad", "proteinShakeBanana",
  "greekYogurtGranola", "tunaSaladWholeGrain", "beefStirFry", "jerkyApple", "shrimpQuinoa",
  "turkeyChili", "codSweetPotato", "wholeGrainCerealMilk", "chickenWrap", "fishTacos",
  "cheeseCrackersGrapes", "veggieEggMuffins", "turkeyVeggiePlate", "pastaPrimavera",
  "peanutButterToastBanana", "chefSalad", "riceBeansCheese", "hamSandwich", "beefVeggieSkewers",
  "pizzaWholeWheat", "breakfastBurrito", "porkTenderloinGreens",
];

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function pickStyle(dishId) {
  const h = hash(dishId);
  const palettes = [
    { bg: "#fef3c7", plate: "#fffbeb", accent: "#f59e0b", accent2: "#84cc16" },
    { bg: "#dcfce7", plate: "#f0fdf4", accent: "#22c55e", accent2: "#f97316" },
    { bg: "#dbeafe", plate: "#eff6ff", accent: "#3b82f6", accent2: "#eab308" },
    { bg: "#fce7f3", plate: "#fdf2f8", accent: "#ec4899", accent2: "#8b5cf6" },
    { bg: "#ffedd5", plate: "#fff7ed", accent: "#ea580c", accent2: "#16a34a" },
    { bg: "#e0e7ff", plate: "#eef2ff", accent: "#6366f1", accent2: "#14b8a6" },
  ];
  const p = palettes[h % palettes.length];

  let kind = "plate";
  const lower = dishId.toLowerCase();
  if (/soup|stew|chili|minestrone|curry|risotto|bowl|oat|chia|smoothie|yogurt|cereal|pudding|burrito|tacos|wrap|sandwich|pizza|pita|toast|hummus|falafel/.test(lower)) {
    if (/soup|stew|chili|minestrone|curry/.test(lower)) kind = "soup";
    else if (/wrap|tacos|sandwich|pita|toast|burrito|pizza/.test(lower)) kind = "wrap";
    else if (/nuts|fruit|jerky|crackers|apple|melon|trail|cheesecrackers/.test(lower)) kind = "snack";
    else kind = "bowl";
  } else if (/nuts|fruit|jerky|crackers|apple|melon|trail/.test(lower)) {
    kind = "snack";
  }

  return { ...p, kind };
}

function svgBowl(x, y, accent, accent2) {
  return `
    <ellipse cx="${x}" cy="${y + 38}" rx="72" ry="14" fill="#000" opacity="0.08"/>
    <path d="M${x - 70} ${y + 10} Q${x - 72} ${y + 55} ${x} ${y + 58} Q${x + 72} ${y + 55} ${x + 70} ${y + 10} Z" fill="#fff" stroke="#cbd5e1" stroke-width="2"/>
    <ellipse cx="${x}" cy="${y + 18}" rx="58" ry="22" fill="${accent}" opacity="0.85"/>
    <circle cx="${x - 22}" cy="${y + 12}" r="10" fill="${accent2}"/>
    <circle cx="${x + 18}" cy="${y + 20}" r="8" fill="#fff" opacity="0.7"/>
    <circle cx="${x + 5}" cy="${y + 8}" r="6" fill="${accent2}" opacity="0.8"/>`;
}

function svgPlate(x, y, accent, accent2) {
  return `
    <ellipse cx="${x}" cy="${y + 42}" rx="78" ry="12" fill="#000" opacity="0.08"/>
    <circle cx="${x}" cy="${y + 22}" r="68" fill="#fff" stroke="#cbd5e1" stroke-width="2"/>
    <ellipse cx="${x - 8}" cy="${y + 18}" rx="38" ry="28" fill="${accent}" opacity="0.9"/>
    <circle cx="${x + 28}" cy="${y + 26}" r="14" fill="${accent2}"/>
    <rect x="${x - 42}" y="${y + 30}" width="28" height="10" rx="5" fill="${accent2}" opacity="0.75"/>
    <circle cx="${x - 18}" cy="${y + 8}" r="7" fill="#fff" opacity="0.6"/>`;
}

function svgSoup(x, y, accent, accent2) {
  return `
    <ellipse cx="${x}" cy="${y + 40}" rx="70" ry="12" fill="#000" opacity="0.08"/>
    <path d="M${x - 62} ${y + 8} L${x - 48} ${y + 52} Q${x} ${y + 58} ${x + 48} ${y + 52} L${x + 62} ${y + 8} Z" fill="#fff" stroke="#cbd5e1" stroke-width="2"/>
    <ellipse cx="${x}" cy="${y + 16}" rx="48" ry="18" fill="${accent}" opacity="0.88"/>
    <circle cx="${x - 16}" cy="${y + 12}" r="6" fill="${accent2}"/>
    <circle cx="${x + 12}" cy="${y + 18}" r="5" fill="#fff" opacity="0.65"/>
    <rect x="${x - 4}" y="${y - 6}" width="8" height="18" rx="3" fill="#94a3b8"/>`;
}

function svgWrap(x, y, accent, accent2) {
  return `
    <ellipse cx="${x}" cy="${y + 40}" rx="74" ry="12" fill="#000" opacity="0.08"/>
    <ellipse cx="${x}" cy="${y + 24}" rx="62" ry="28" fill="${accent}" opacity="0.35"/>
    <path d="M${x - 58} ${y + 28} Q${x - 20} ${y + 4} ${x + 10} ${y + 18} Q${x + 40} ${y + 32} ${x + 56} ${y + 24} L${x + 48} ${y + 38} Q${x + 10} ${y + 48} ${x - 50} ${y + 36} Z" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
    <circle cx="${x - 10}" cy="${y + 22}" r="9" fill="${accent2}"/>
    <circle cx="${x + 20}" cy="${y + 26}" r="7" fill="${accent}"/>`;
}

function svgSnack(x, y, accent, accent2) {
  return `
    <ellipse cx="${x}" cy="${y + 38}" rx="68" ry="11" fill="#000" opacity="0.08"/>
    <rect x="${x - 56}" y="${y + 12}" width="112" height="28" rx="10" fill="#fff" stroke="#cbd5e1" stroke-width="2"/>
    <circle cx="${x - 28}" cy="${y + 26}" r="10" fill="${accent}"/>
    <circle cx="${x + 4}" cy="${y + 24}" r="9" fill="${accent2}"/>
    <circle cx="${x + 32}" cy="${y + 26}" r="8" fill="${accent}" opacity="0.8"/>`;
}

function dishSvg(id) {
  const s = pickStyle(id);
  const cx = 200;
  const cy = 118;
  let food = "";
  switch (s.kind) {
    case "bowl":
      food = svgBowl(cx, cy, s.accent, s.accent2);
      break;
    case "soup":
      food = svgSoup(cx, cy, s.accent, s.accent2);
      break;
    case "wrap":
      food = svgWrap(cx, cy, s.accent, s.accent2);
      break;
    case "snack":
      food = svgSnack(cx, cy, s.accent, s.accent2);
      break;
    default:
      food = svgPlate(cx, cy, s.accent, s.accent2);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 280" width="400" height="280" role="img" aria-label="${id}">
  <defs>
    <linearGradient id="bg-${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${s.bg}"/>
      <stop offset="100%" stop-color="${s.plate}"/>
    </linearGradient>
  </defs>
  <rect width="400" height="280" fill="url(#bg-${id})"/>
  ${food}
</svg>`;
}

fs.mkdirSync(outDir, { recursive: true });

let written = 0;
for (const id of DISH_IDS) {
  fs.writeFileSync(path.join(outDir, `${id}.svg`), dishSvg(id), "utf8");
  written++;
}

console.log(`Generated ${written} SVG dish photos in public/dishes/`);
