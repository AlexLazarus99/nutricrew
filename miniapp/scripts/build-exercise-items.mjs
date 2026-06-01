import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const en = JSON.parse(fs.readFileSync(path.join(root, "src/locales/exercises.en.json"), "utf8"));
const ru = JSON.parse(fs.readFileSync(path.join(root, "src/locales/exercises.ru.json"), "utf8"));

const nameToId = {
  "Barbell bench press": "benchPress",
  "Incline dumbbell press": "inclineDbPress",
  "Cable fly (low-to-high)": "cableFly",
  "Overhead press (barbell or dumbbell)": "overheadPress",
  "Dumbbell lateral raise": "lateralRaise",
  "Face pull (rear delt)": "facePull",
  "Close-grip bench or dips": "closeGripBench",
  "Rope pushdown": "ropePushdown",
  "Overhead dumbbell extension": "overheadExtension",
  "Pull-ups or lat pulldown": "pullUp",
  "Barbell row (chest supported)": "barbellRow",
  "Single-arm dumbbell row": "dbRow",
  "Straight-arm pulldown": "straightArmPulldown",
  "Barbell curl": "barbellCurl",
  "Incline dumbbell curl": "inclineCurl",
  "Hammer curl": "hammerCurl",
  "Back squat": "backSquat",
  "Leg press": "legPress",
  "Walking lunges": "walkingLunge",
  "Romanian deadlift": "romanianDeadlift",
  "Lying leg curl": "legCurl",
  "Hip thrust (barbell)": "hipThrust",
  "Cable kickback": "cableKickback",
  "Standing calf raise": "standingCalfRaise",
  "Seated calf raise": "seatedCalfRaise",
  "Hanging leg raise": "hangingLegRaise",
  "Pallof press": "pallofPress",
  Plank: "plank",
  "Stationary bike": "stationaryBike",
  "Incline treadmill 8–12%": "inclineWalk",
  "Step-ups (low box)": "stepUps",
  "Elliptical with active heel push": "elliptical",
  "Light kettlebell swing": "kbSwing",
  "Kettlebell swing": "kbSwing",
  "Stair climber": "stairClimber",
  "Glute bridge march": "gluteBridgeMarch",
  "Jump rope": "jumpRope",
  "Calf raise holds on step": "calfHold",
  "Dead bug": "deadBug",
  "Side plank": "sidePlank",
  "Dumbbell bench press": "dbBenchPress",
  "Incline machine press": "inclineMachinePress",
  "Push-up weighted or feet elevated": "pushUp",
  "Weighted pull-up": "weightedPullUp",
  "Chest-supported T-bar row": "tbarRow",
  "Wide-grip lat pulldown": "latPulldown",
  "Reverse pec deck (rear delt)": "reversePecDeck",
  "Arnold press": "arnoldPress",
  "Cable lateral raise": "cableLateralRaise",
  "Upright row (wide grip, light)": "uprightRow",
  "Skull crusher": "skullCrusher",
  "Diamond push-up": "diamondPushUp",
  "Preacher curl": "preacherCurl",
  "Cable hammer curl": "cableHammerCurl",
  "Front squat": "frontSquat",
  "Bulgarian split squat": "bulgarianSplitSquat",
  "Leg extension": "legExtension",
  "Conventional deadlift": "conventionalDeadlift",
  "Nordic curl (assisted) or leg curl": "nordicCurl",
  "Good morning (light)": "goodMorning",
  "Barbell hip thrust": "hipThrust",
  "Step-up (knee height)": "stepUp",
  "Frog pump": "frogPump",
  "Leg press calf raise": "legPressCalfRaise",
  "Single-leg calf raise": "singleLegCalfRaise",
  "Ab wheel rollout": "abWheel",
  "Russian twist (weighted)": "russianTwist",
  "Farmer carry": "farmerCarry",
  "Box jump": "boxJump",
  "Broad jump": "broadJump",
  "Split squat jump": "splitSquatJump",
  "Nordic hamstring (eccentric)": "nordicCurl",
  "Single-leg RDL (bodyweight)": "singleLegRdl",
  "Sprint build-ups": "sprintBuildUp",
  "Band-resisted lateral walk": "bandWalk",
  "Medicine ball rotational throw": "medBallRotation",
  "Pogo hops": "pogoHop",
  "Calf jump rope": "calfJumpRope",
  "Pallof press (explosive)": "pallofPress",
  "Mountain climbers": "mountainClimber",
  "V-up": "vUp",
  "Medicine ball slam": "medBallSlam",
  "Push press (light)": "pushPress",
  "Band Y-T-W raises": "bandYtw",
  "TRX row (explosive)": "trxRow",
  "Chin-up (fast concentric)": "chinUp",
  "Recumbent or upright bike": "recumbentBike",
  "Incline treadmill 6–10%": "inclineWalk",
  "Water walking (pool)": "waterWalk",
  "Elliptical backward stride": "ellipticalBack",
  "Rowing machine": "rowingMachine",
  "Slider leg curl (if available)": "sliderLegCurl",
  "Hill repeats walk": "hillRepeat",
  "Glute activation: clamshells": "clamshell",
  "Brisk flat walk": "briskWalk",
  "Calf stretch 30 s/side post-session": "calfStretch",
  "Bird dog": "birdDog",
  "Standing anti-rotation band press": "antiRotationBand",
  "Deep breathing 5 min (parasympathetic recovery)": "deepBreathing",
  "Goblet squat": "gobletSquat",
  "Walking dumbbell lunge": "dbLunge",
  "Dumbbell hip thrust": "dbHipThrust",
  "Sumo deadlift (light)": "sumoDeadlift",
  "Cable pull-through": "cablePullThrough",
  "Push-up (incline if needed)": "pushUp",
  "Cable chest press": "cableChestPress",
  "Lat pulldown": "latPulldown",
  "Seated cable row": "seatedCableRow",
  "Dumbbell single-arm row": "dbRow",
  "Dumbbell shoulder press": "dbShoulderPress",
  "Lateral raise": "lateralRaise",
  "Band face pull": "bandFacePull",
  "Cable woodchop": "cableWoodchop",
  "Dumbbell curl": "dbCurl",
  "Concentration curl": "concentrationCurl",
  "Bench dip (bent knees)": "benchDip",
  "Triceps kickback": "tricepsKickback",
  "Romanian dumbbell deadlift": "dbRdl",
  "Stability ball leg curl": "ballLegCurl",
  "Hold top stretch 2 s each rep": "calfHold",
  "Couch stretch (rear foot elevated)": "couchStretch",
  "Standing quad pull": "quadStretch",
  "Foam roll quads": "foamRollQuads",
  "Seated forward fold": "forwardFold",
  "Lying hamstring strap stretch": "hamstringStrap",
  "Downward dog": "downwardDog",
  "Figure-4 stretch (supine)": "figure4",
  "Pigeon pose (modified)": "pigeonPose",
  "Foam roll glutes": "foamRollGlutes",
  "Cat-cow": "catCow",
  "Child's pose": "childPose",
  "Open book (thoracic rotation)": "openBook",
  "Foam roll thoracic spine": "foamRollThoracic",
  "Lat stretch (doorframe)": "latStretch",
  "Prone press-up (cobra)": "cobraStretch",
  "Cross-body shoulder stretch": "crossBodyShoulder",
  "Wall slide": "wallSlide",
  "Band dislocates": "bandDislocate",
  "Doorway pec stretch": "doorwayPecStretch",
  "Foam roll chest (ball)": "foamRollChest",
};

function parseItem(s, lang) {
  const idx = s.indexOf(" — ");
  const name = idx >= 0 ? s.slice(0, idx).trim() : s;
  const rx = idx >= 0 ? s.slice(idx + 3).trim() : "";
  const id = nameToId[name];
  if (!id && lang === "en") console.error("MISSING EN:", JSON.stringify(name));
  return { id, name, rx };
}

const itemsOut = {};
const namesEn = {};
const namesRu = {};

for (const [prog, v] of Object.entries(en)) {
  if (!v.groups) continue;
  itemsOut[prog] = {};
  const ruGroups = ru[prog]?.groups ?? {};
  for (const [g, gv] of Object.entries(v.groups)) {
    const ruItems = ruGroups[g]?.items ?? [];
    itemsOut[prog][g] = gv.items.map((s, i) => {
      const enP = parseItem(s, "en");
      const ruP = ruItems[i] ? parseItem(ruItems[i], "ru") : null;
      if (enP.id) namesEn[enP.id] = enP.name;
      if (ruP?.id && ruP.name) namesRu[ruP.id] = ruP.name;
      return { id: enP.id ?? enP.name.replace(/\W+/g, ""), rx: enP.rx };
    });
  }
}

fs.writeFileSync(
  path.join(root, "src/data/wellness/programExerciseItems.json"),
  JSON.stringify(itemsOut, null, 2),
);
fs.writeFileSync(path.join(root, "src/locales/exerciseNames.en.json"), JSON.stringify(namesEn, null, 2));
fs.writeFileSync(path.join(root, "src/locales/exerciseNames.ru.json"), JSON.stringify(namesRu, null, 2));
console.log("exercises:", Object.keys(namesEn).length);
