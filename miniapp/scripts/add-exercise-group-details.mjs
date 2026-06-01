/**
 * Add program-specific detail lines to each muscle group in exercises locales.
 * Run: node scripts/add-exercise-group-details.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const GROUP_DETAIL = {
  en: {
    chest: "Order: compound press first, then incline, finish with fly/isolation. Rest as noted between heavy sets.",
    back: "Pair vertical and horizontal pulls. Squeeze shoulder blades; avoid swinging or using momentum.",
    shoulders: "Press for strength, raises for volume, rear-delt work for shoulder health. Keep wrists neutral.",
    biceps: "Full range of motion, elbows fixed. Two to three exercises per session is enough.",
    triceps: "Mix pressing and extension patterns. Lock out under control without flaring elbows.",
    core: "Brace before each rep; breathe steadily. Prioritize form over speed or extra reps.",
    quads: "Track knees over toes. Depth depends on mobility — keep a neutral spine.",
    hamstrings: "Hinge at the hips on RDL/deadlift patterns. Feel stretch, then drive hips forward.",
    glutes: "Pause and squeeze at lockout. Avoid hyperextending the lower back.",
    calves: "Full stretch at the bottom, peak contraction at the top. Use a slow tempo.",
  },
  ru: {
    chest: "Порядок: сначала базовый жим, затем наклон, в конце — изоляция. Отдых между тяжёлыми подходами — как указано.",
    back: "Чередуйте вертикальную и горизонтальную тягу. Сводите лопатки, без рывков и читинга.",
    shoulders: "Жим — сила, махи — объём, задняя дельта — здоровье сустава. Запястья нейтрально.",
    biceps: "Полная амплитуда, локти неподвижны. 2–3 упражнения за сессию достаточно.",
    triceps: "Чередуйте жимовые и разгибания. Контролируйте локти, без рывков в локте.",
    core: "Напрягайте кор перед каждым повтором, дышите ровно. Форма важнее скорости.",
    quads: "Колени следуют за носками. Глубина — по мобильности, без округления поясницы.",
    hamstrings: "В тягах — hinge в тазобедренном. Чувствуйте растяжение, затем разгибайте бёдра.",
    glutes: "Пауза и сжатие вверху. Не переразгибайте поясницу.",
    calves: "Полное растяжение внизу, пик сокращения вверху. Медленный темп.",
  },
};

const PROGRAM_DETAIL = {
  en: {
    ectoStrength: "Mass-gain split: log loads and add weight or reps weekly on compounds.",
    ectoCardio: "Keep intensity submaximal to protect muscle; stay in Zone 2 for most minutes.",
    mesoMixed: "Upper/lower rotation: push carbs on lower days, prioritize sleep for recovery.",
    mesoSport: "Power work needs full rest between sets. Stop if landing gets loud or knees cave.",
    endoCardio: "Consistency beats intensity. Add minutes before adding speed or incline.",
    endoStrength: "Full-body circuits: move with control, rest 45–60 s between rounds.",
    mobilityAll: "Hold stretches 30–45 s, breathe into tension. Never force painful range.",
  },
  ru: {
    ectoStrength: "Сплит на массу: записывайте веса, каждую неделю +2,5 кг или +1 повтор в базовых.",
    ectoCardio: "Субмаксимальная интенсивность — сохраняем мышцы. Большую часть времени — Zone 2.",
    mesoMixed: "Upper/lower: больше углеводов в дни ног, сон — ключ к восстановлению.",
    mesoSport: "Power-подходы — полное восстановление. Остановитесь при громком приземлении или «завале» колен.",
    endoCardio: "Регулярность важнее скорости. Сначала добавляйте минуты, потом интенсивность.",
    endoStrength: "Full-body круги: контроль техники, отдых 45–60 с между кругами.",
    mobilityAll: "Удержание 30–45 с, дышите в растяжку. Не форсируйте боль.",
  },
};

function enrich(filePath, lang) {
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  let count = 0;
  for (const [progId, prog] of Object.entries(data)) {
    if (!prog.groups) continue;
    const progLine = PROGRAM_DETAIL[lang][progId] ?? "";
    for (const [groupId, group] of Object.entries(prog.groups)) {
      const groupLine = GROUP_DETAIL[lang][groupId] ?? "";
      group.detail = [progLine, groupLine].filter(Boolean).join(" ");
      count++;
    }
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
  console.log(`${path.basename(filePath)}: ${count} group details`);
}

enrich(path.join(root, "src/locales/exercises.en.json"), "en");
enrich(path.join(root, "src/locales/exercises.ru.json"), "ru");
