/**
 * Generates dishRecipes.en.json / dishRecipes.ru.json
 * Run: node scripts/build-dish-recipes.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { enrichRecipe } from "./recipe-enricher.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

/** @type {Record<string, { en: { ingredients: string[], steps: string[] }, ru: { ingredients: string[], steps: string[] } }>} */
const RECIPES = {
  greekYogurtHoney: {
    en: { ingredients: ["150 g Greek yogurt", "1 tsp honey", "15 g walnuts, chopped"], steps: ["Spoon yogurt into a bowl.", "Drizzle with honey and top with walnuts."] },
    ru: { ingredients: ["150 г греческого йогурта", "1 ч. л. мёда", "15 г грецких орехов"], steps: ["Выложите йогурт в миску.", "Полейте мёдом и посыпьте орехами."] },
  },
  mediterraneanOmelette: {
    en: { ingredients: ["2 eggs", "50 g spinach", "30 g feta", "1 tsp olive oil", "Cherry tomatoes"], steps: ["Sauté spinach in oil 1 min.", "Pour beaten eggs, add feta and tomatoes.", "Cook 3–4 min per side until set."] },
    ru: { ingredients: ["2 яйца", "50 г шпината", "30 г феты", "1 ч. л. оливкового масла", "Помидоры черри"], steps: ["Обжарьте шпинат на масле 1 мин.", "Влейте яйца, добавьте фету и томаты.", "Жарьте 3–4 мин с каждой стороны."] },
  },
  overnightOatsBerries: {
    en: { ingredients: ["50 g rolled oats", "120 ml milk", "80 g mixed berries", "1 tsp chia seeds"], steps: ["Mix oats, milk and chia in a jar.", "Refrigerate overnight.", "Top with berries before serving."] },
    ru: { ingredients: ["50 г овсянки", "120 мл молока", "80 г ягод", "1 ч. л. семян чиа"], steps: ["Смешайте овсянку, молоко и чиа в банке.", "Оставьте на ночь в холодильнике.", "Утром добавьте ягоды."] },
  },
  grilledSalmonVeg: {
    en: { ingredients: ["150 g salmon fillet", "200 g mixed vegetables", "1 tbsp olive oil", "Lemon, herbs"], steps: ["Season salmon and veggies with oil, salt, pepper.", "Grill salmon 4 min/side, veggies 8–10 min.", "Serve with lemon and herbs."] },
    ru: { ingredients: ["150 г филе лосося", "200 г овощей", "1 ст. л. оливкового масла", "Лимон, травы"], steps: ["Смажьте лосось и овощи маслом, посолите.", "Гриль: лосось 4 мин с стороны, овощи 8–10 мин.", "Подавайте с лимоном и травами."] },
  },
  quinoaTabbouleh: {
    en: { ingredients: ["80 g cooked quinoa", "1 tomato", "Cucumber, parsley", "1 tbsp olive oil", "Lemon juice"], steps: ["Dice tomato and cucumber; chop parsley.", "Toss with quinoa, oil and lemon.", "Chill 15 min before serving."] },
    ru: { ingredients: ["80 г варёной киноа", "1 помидор", "Огурец, петрушка", "1 ст. л. оливкового масла", "Лимонный сок"], steps: ["Нарежьте овощи и зелень.", "Смешайте с киноа, маслом и лимоном.", "Охладите 15 мин."] },
  },
  lentilSoup: {
    en: { ingredients: ["80 g red lentils", "1 carrot, 1 onion", "500 ml vegetable broth", "1 tsp cumin"], steps: ["Sauté onion and carrot 5 min.", "Add lentils, broth and cumin; simmer 20 min.", "Blend lightly or serve chunky."] },
    ru: { ingredients: ["80 г красной чечевицы", "1 морковь, 1 лук", "500 мл овощного бульона", "1 ч. л. тмина"], steps: ["Обжарьте лук и морковь 5 мин.", "Добавьте чечевицу, бульон и тмин; варите 20 мин.", "Подавайте цельной или слегка пробейте блендером."] },
  },
  chickenSouvlaki: {
    en: { ingredients: ["150 g chicken breast", "1 tbsp olive oil", "Oregano, garlic", "Tzatziki, whole-grain pita"], steps: ["Cube chicken; marinate with oil, oregano, garlic 20 min.", "Thread on skewers; grill 8–10 min.", "Serve with tzatziki and warmed pita."] },
    ru: { ingredients: ["150 г куриной грудки", "1 ст. л. оливкового масла", "Орегано, чеснок", "Цацики, цельнозерновая пита"], steps: ["Нарежьте курицу; замаринуйте 20 мин.", "Нанизайте на шампуры; гриль 8–10 мин.", "Подавайте с цацики и питой."] },
  },
  wholeWheatPastaTomato: {
    en: { ingredients: ["80 g whole-wheat pasta", "200 g canned tomatoes", "Garlic, basil", "1 tsp olive oil"], steps: ["Cook pasta al dente.", "Simmer tomatoes with garlic and basil 10 min.", "Toss pasta with sauce and a drizzle of oil."] },
    ru: { ingredients: ["80 г цельнозерновой пасты", "200 г томатов", "Чеснок, базилик", "1 ч. л. оливкового масла"], steps: ["Отварите пасту al dente.", "Тушите томаты с чесноком и базиликом 10 мин.", "Смешайте с пастой и маслом."] },
  },
  capreseSalad: {
    en: { ingredients: ["1 tomato", "80 g mozzarella", "Fresh basil", "1 tbsp olive oil", "Balsamic (optional)"], steps: ["Slice tomato and mozzarella.", "Layer with basil on a plate.", "Drizzle with olive oil and balsamic."] },
    ru: { ingredients: ["1 помидор", "80 г моцареллы", "Свежий базилик", "1 ст. л. оливкового масла", "Бalsamic (по желанию)"], steps: ["Нарежьте помидор и моцареллу.", "Выложите слоями с базиликом.", "Полейте маслом и бalsamic."] },
  },
  bakedCodHerbs: {
    en: { ingredients: ["150 g cod fillet", "1 tbsp olive oil", "Lemon, dill, garlic"], steps: ["Place cod in a baking dish.", "Top with oil, lemon, dill and garlic.", "Bake at 200 °C for 12–15 min."] },
    ru: { ingredients: ["150 г филе трески", "1 ст. л. оливкового масла", "Лимон, укроп, чеснок"], steps: ["Выложите треску в форму.", "Смажьте маслом, добавьте лимон и травы.", "Запекайте при 200 °C 12–15 мин."] },
  },
  hummusPita: {
    en: { ingredients: ["80 g hummus", "1 whole-grain pita", "Paprika, olive oil"], steps: ["Warm pita in oven or pan.", "Spread hummus on a plate.", "Serve with pita; drizzle oil and paprika."] },
    ru: { ingredients: ["80 г хумуса", "1 цельнозерновая пита", "Паприка, оливковое масло"], steps: ["Подогрейте питу.", "Выложите хумус на тарелку.", "Подавайте с питой, маслом и паприкой."] },
  },
  stuffedPeppers: {
    en: { ingredients: ["2 bell peppers", "80 g cooked rice", "100 g lean ground meat or beans", "Tomato sauce"], steps: ["Hollow peppers; mix rice with filling.", "Stuff peppers and top with sauce.", "Bake at 190 °C for 25–30 min."] },
    ru: { ingredients: ["2 перца", "80 г варёного риса", "100 г фарша или фасоли", "Томатный соус"], steps: ["Очистите перцы от семян.", "Начините рисом и начинкой, залейте соусом.", "Запекайте при 190 °C 25–30 мин."] },
  },
  tunaNicoise: {
    en: { ingredients: ["1 can tuna in water", "Boiled egg, green beans", "Lettuce, olives", "1 tsp olive oil"], steps: ["Arrange lettuce on a plate.", "Add tuna, egg halves, beans and olives.", "Dress with olive oil and lemon."] },
    ru: { ingredients: ["1 банка тунца", "Яйцо, стручковая фасоль", "Салат, оливки", "1 ч. л. оливкового масла"], steps: ["Выложите салат на тарелку.", "Добавьте тунец, яйцо, фасоль и оливки.", "Заправьте маслом и лимоном."] },
  },
  oliveTapenadeToast: {
    en: { ingredients: ["1 slice whole-grain bread", "2 tbsp olive tapenade", "Cherry tomatoes (optional)"], steps: ["Toast bread until crisp.", "Spread tapenade evenly.", "Top with halved tomatoes if desired."] },
    ru: { ingredients: ["1 ломтик цельнозернового хлеба", "2 ст. л. тапенада", "Помидоры черри (по желанию)"], steps: ["Подсушите хлеб в тостере.", "Намажьте тапенад.", "Добавьте помидоры при желании."] },
  },
  fruitNuts: {
    en: { ingredients: ["1 apple or pear", "20 g mixed nuts", "Cinnamon (optional)"], steps: ["Wash and slice fruit.", "Serve with nuts on the side.", "Sprinkle cinnamon if desired."] },
    ru: { ingredients: ["1 яблоко или груша", "20 г орехов", "Корица (по желанию)"], steps: ["Вымойте и нарежьте фрукт.", "Подавайте с орехами.", "Посыпьте корицей при желании."] },
  },
  oatmealBanana: {
    en: { ingredients: ["50 g oats", "200 ml water or milk", "1 banana", "Pinch of cinnamon"], steps: ["Cook oats with liquid 5 min.", "Slice banana on top.", "Add cinnamon and serve warm."] },
    ru: { ingredients: ["50 г овсянки", "200 мл воды или молока", "1 банан", "Щепотка корицы"], steps: ["Варите овсянку 5 мин.", "Сверху добавьте банан.", "Посыпьте корицей."] },
  },
  eggWhiteVeggieScramble: {
    en: { ingredients: ["3 egg whites", "50 g bell pepper", "50 g mushrooms", "1 tsp olive oil"], steps: ["Sauté vegetables 3 min.", "Add egg whites; scramble until set.", "Season with pepper; serve immediately."] },
    ru: { ingredients: ["3 белка", "50 г перца", "50 г грибов", "1 ч. л. масла"], steps: ["Обжарьте овощи 3 мин.", "Добавьте белки, перемешивайте до готовности.", "Посолите, подавайте сразу."] },
  },
  lowFatYogurtBerries: {
    en: { ingredients: ["150 g low-fat yogurt", "80 g mixed berries"], steps: ["Spoon yogurt into a bowl.", "Top with fresh or thawed berries."] },
    ru: { ingredients: ["150 г обезжиренного йогурта", "80 г ягод"], steps: ["Выложите йогурт в миску.", "Добавьте свежие или размороженные ягоды."] },
  },
  grilledChickenBrownRice: {
    en: { ingredients: ["150 g chicken breast", "80 g cooked brown rice", "1 tsp olive oil", "Steamed broccoli"], steps: ["Season chicken; grill 6 min per side.", "Serve over brown rice with broccoli.", "Drizzle with olive oil."] },
    ru: { ingredients: ["150 г куриной грудки", "80 г бурого риса", "1 ч. л. масла", "Брокколи на пару"], steps: ["Посолите курицу; гриль 6 мин с стороны.", "Подавайте с рисом и брокколи.", "Полейте оливковым маслом."] },
  },
  turkeyVegetableSoup: {
    en: { ingredients: ["100 g turkey breast", "1 carrot, celery, onion", "500 ml low-sodium broth", "Herbs"], steps: ["Dice vegetables; simmer in broth 10 min.", "Add diced turkey; cook 10 min more.", "Season with herbs; serve hot."] },
    ru: { ingredients: ["100 г индейки", "Морковь, сельдерей, лук", "500 мл бульона без соли", "Травы"], steps: ["Нарежьте овощи; варите в бульоне 10 мин.", "Добавьте индейку; ещё 10 мин.", "Приправьте травами."] },
  },
  bakedSalmonAsparagus: {
    en: { ingredients: ["150 g salmon", "150 g asparagus", "1 tbsp olive oil", "Lemon"], steps: ["Arrange salmon and asparagus on a tray.", "Drizzle with oil, salt and pepper.", "Bake at 200 °C for 15 min; finish with lemon."] },
    ru: { ingredients: ["150 г лосося", "150 г спаржи", "1 ст. л. масла", "Лимон"], steps: ["Выложите лосось и спаржу на противень.", "Смажьте маслом, посолите.", "Запекайте при 200 °C 15 мин; добавьте лимон."] },
  },
  beanBurritoBowl: {
    en: { ingredients: ["80 g black beans", "80 g brown rice", "Corn, salsa, lettuce", "1 tbsp Greek yogurt"], steps: ["Warm beans and rice.", "Layer rice, beans, corn and lettuce in a bowl.", "Top with salsa and yogurt."] },
    ru: { ingredients: ["80 г чёрной фасоли", "80 г бурого риса", "Кукуруза, salsa, салат", "1 ст. л. йогурта"], steps: ["Подогрейте фасоль и рис.", "Сложите слоями в боул.", "Добавьте salsa и йогурт."] },
  },
  cottageCheeseMelon: {
    en: { ingredients: ["150 g cottage cheese", "150 g melon cubes"], steps: ["Place cottage cheese in a bowl.", "Add chilled melon cubes and serve."] },
    ru: { ingredients: ["150 г творога", "150 г дыни"], steps: ["Выложите творог в миску.", "Добавьте охлаждённую дыню."] },
  },
  leanBeefSweetPotato: {
    en: { ingredients: ["120 g lean beef", "1 medium sweet potato", "1 tsp olive oil", "Rosemary"], steps: ["Bake sweet potato at 200 °C for 40 min.", "Pan-sear beef 3 min per side.", "Serve beef with split potato and rosemary."] },
    ru: { ingredients: ["120 г постной говядины", "1 батат", "1 ч. л. масла", "Розмарин"], steps: ["Запеките батат при 200 °C 40 мин.", "Обжарьте говядину 3 мин с стороны.", "Подавайте с бататом и розмарином."] },
  },
  wholeGrainTurkeySandwich: {
    en: { ingredients: ["2 slices whole-grain bread", "80 g sliced turkey", "Lettuce, tomato", "1 tsp mustard"], steps: ["Toast bread lightly.", "Layer turkey, lettuce and tomato.", "Spread mustard; cut in half."] },
    ru: { ingredients: ["2 ломтика цельнозернового хлеба", "80 г индейки", "Салат, помидор", "1 ч. л. горчицы"], steps: ["Слегка подсушите хлеб.", "Выложите индейку, салат и помидор.", "Намажьте горчицу."] },
  },
  stirFryTofuBroccoli: {
    en: { ingredients: ["120 g firm tofu", "150 g broccoli", "1 tbsp low-sodium soy sauce", "1 tsp sesame oil"], steps: ["Cube tofu; pan-fry until golden.", "Add broccoli and splash of water; cover 4 min.", "Stir in soy sauce and sesame oil."] },
    ru: { ingredients: ["120 г тофу", "150 г брокколи", "1 ст. л. соевого соуса", "1 ч. л. кунжутного масла"], steps: ["Нарежьте тофу; обжарьте до золотистого.", "Добавьте брокколи и воду; тушите 4 мин.", "Влейте соевый и кунжутное масло."] },
  },
  lentilStew: {
    en: { ingredients: ["80 g green lentils", "1 onion, carrot", "400 ml broth", "Bay leaf"], steps: ["Sauté onion and carrot.", "Add lentils and broth; simmer 25 min.", "Remove bay leaf; season and serve."] },
    ru: { ingredients: ["80 г чечевицы", "Лук, морковь", "400 мл бульона", "Лавровый лист"], steps: ["Обжарьте лук и морковь.", "Добавьте чечевицу и бульон; варите 25 мин.", "Достаньте лавровый лист."] },
  },
  unsaltedNutsApple: {
    en: { ingredients: ["1 apple", "20 g unsalted mixed nuts"], steps: ["Slice apple.", "Serve with nuts as a snack."] },
    ru: { ingredients: ["1 яблоко", "20 г несолёных орехов"], steps: ["Нарежьте яблоко.", "Подавайте с орехами."] },
  },
  wholeWheatPastaMarinara: {
    en: { ingredients: ["80 g whole-wheat pasta", "150 g marinara sauce", "Garlic, basil"], steps: ["Cook pasta al dente.", "Heat marinara with garlic.", "Toss pasta with sauce and basil."] },
    ru: { ingredients: ["80 г цельнозерновой пасты", "150 г соуса маринара", "Чеснок, базилик"], steps: ["Отварите пасту.", "Подогрейте соус с чесноком.", "Смешайте с пастой и базиликом."] },
  },
  grilledFishQuinoa: {
    en: { ingredients: ["150 g white fish", "80 g cooked quinoa", "1 tsp olive oil", "Lemon, parsley"], steps: ["Season fish; grill 4 min per side.", "Serve over quinoa with lemon and parsley.", "Drizzle with olive oil."] },
    ru: { ingredients: ["150 г белой рыбы", "80 г киноа", "1 ч. л. масла", "Лимон, петрушка"], steps: ["Посолите рыбу; гриль 4 мин с стороны.", "Подавайте на киноа с лимоном.", "Полейте маслом."] },
  },
  smoothieBowl: {
    en: { ingredients: ["1 banana", "80 g spinach", "100 ml milk", "Toppings: granola, berries"], steps: ["Blend banana, spinach and milk until thick.", "Pour into a bowl.", "Top with granola and berries."] },
    ru: { ingredients: ["1 банан", "80 г шпината", "100 мл молока", "Гранола, ягоды"], steps: ["Смешайте банан, шпинат и молоко.", "Вылейте в миску.", "Украсьте гранолой и ягодами."] },
  },
  buddhaBowl: {
    en: { ingredients: ["80 g quinoa", "Chickpeas, roasted veggies", "Greens, tahini dressing"], steps: ["Cook quinoa; roast vegetables.", "Arrange quinoa, chickpeas and greens in a bowl.", "Drizzle with tahini dressing."] },
    ru: { ingredients: ["80 г киноа", "Нут, запечённые овощи", "Зелень, соус tahini"], steps: ["Сварите киноа; запеките овощи.", "Выложите слоями в боул.", "Полейте соусом tahini."] },
  },
  chickpeaCurry: {
    en: { ingredients: ["1 can chickpeas", "100 g spinach", "200 ml coconut milk", "Curry powder, onion"], steps: ["Sauté onion; add curry powder.", "Add chickpeas and coconut milk; simmer 10 min.", "Stir in spinach until wilted."] },
    ru: { ingredients: ["1 банка нута", "100 г шпината", "200 мл кокосового молока", "Карри, лук"], steps: ["Обжарьте лук с карри.", "Добавьте нут и молоко; тушите 10 мин.", "Вмешайте шпинат до увядания."] },
  },
  trailMixFruit: {
    en: { ingredients: ["25 g trail mix", "1 seasonal fruit"], steps: ["Portion trail mix.", "Serve with washed fresh fruit."] },
    ru: { ingredients: ["25 г trail mix", "1 сезонный фрукт"], steps: ["Отмерьте порцию орехов.", "Подавайте со свежим фруктом."] },
  },
  overnightChiaPudding: {
    en: { ingredients: ["30 g chia seeds", "150 ml milk", "1 tsp maple syrup", "Berries"], steps: ["Mix chia, milk and syrup in a jar.", "Refrigerate 4 hours or overnight.", "Top with berries before serving."] },
    ru: { ingredients: ["30 г чиа", "150 мл молока", "1 ч. л. сиропа", "Ягоды"], steps: ["Смешайте чиа, молоко и сироп.", "Охладите 4 ч или на ночь.", "Добавьте ягоды перед подачей."] },
  },
  falafelPlate: {
    en: { ingredients: ["4 falafel balls", "Salad greens", "2 tbsp tahini", "Whole-grain pita"], steps: ["Bake or pan-fry falafel until crisp.", "Serve with salad and warmed pita.", "Drizzle tahini over everything."] },
    ru: { ingredients: ["4 фалафеля", "Салат", "2 ст. л. тахини", "Цельнозерновая пита"], steps: ["Запеките или обжарьте фалафель.", "Подавайте с салатом и питой.", "Полейте тахини."] },
  },
  blackBeanTacos: {
    en: { ingredients: ["2 corn tortillas", "80 g black beans", "Salsa, lettuce, avocado"], steps: ["Warm tortillas.", "Fill with heated beans and toppings.", "Fold and serve immediately."] },
    ru: { ingredients: ["2 кукурузные тортильи", "80 г чёрной фасоли", "Сальса, салат, авокадо"], steps: ["Подогрейте тортильи.", "Начините фасолью и овощами.", "Подавайте сразу."] },
  },
  tofuScramble: {
    en: { ingredients: ["150 g firm tofu", "Turmeric, onion, peppers", "1 tsp olive oil"], steps: ["Crumble tofu with hands.", "Sauté onion and peppers; add tofu and turmeric.", "Cook 5 min until heated through."] },
    ru: { ingredients: ["150 г тофу", "Куркума, лук, перец", "1 ч. л. масла"], steps: ["Разомните тофу руками.", "Обжарьте лук и перец; добавьте тофу и куркуму.", "Жарьте 5 мин."] },
  },
  minestrone: {
    en: { ingredients: ["80 g pasta", "Beans, zucchini, carrots", "500 ml vegetable broth", "Tomato paste"], steps: ["Simmer vegetables in broth 15 min.", "Add pasta and beans; cook 10 min.", "Season with herbs and serve."] },
    ru: { ingredients: ["80 г pasta", "Фасоль, кабачок, морковь", "500 мл бульона", "Томатная паста"], steps: ["Варите овощи в бульоне 15 мин.", "Добавьте pasta и фасоль; 10 мин.", "Приправьте травами."] },
  },
  tempehStirFry: {
    en: { ingredients: ["120 g tempeh", "Mixed greens", "1 tbsp soy sauce", "Ginger, garlic"], steps: ["Slice tempeh; pan-fry until golden.", "Add greens, ginger and garlic; stir-fry 3 min.", "Finish with soy sauce."] },
    ru: { ingredients: ["120 г темпе", "Зелень", "1 ст. л. соевого соуса", "Имбирь, чеснок"], steps: ["Нарежьте темпе; обжарьте.", "Добавьте зелень, имбирь и чеснок; 3 мин.", "Влейте соевый соус."] },
  },
  appleAlmondButter: {
    en: { ingredients: ["1 apple", "1 tbsp almond butter"], steps: ["Slice apple into wedges.", "Serve with almond butter for dipping."] },
    ru: { ingredients: ["1 яблоко", "1 ст. л. миндального масла"], steps: ["Нарежьте яблоко дольками.", "Подавайте с маслом для макания."] },
  },
  avocadoToast: {
    en: { ingredients: ["1 slice whole-grain bread", "1/2 avocado", "Lemon, chili flakes"], steps: ["Toast bread.", "Mash avocado with lemon; spread on toast.", "Season with salt and chili flakes."] },
    ru: { ingredients: ["1 ломтик хлеба", "1/2 авокадо", "Лимон, хлопья чили"], steps: ["Подсушите хлеб.", "Разомните авокадо с лимоном; намажьте.", "Посолите, добавьте чili."] },
  },
  peanutNoodleSalad: {
    en: { ingredients: ["80 g whole-wheat noodles", "2 tbsp peanut sauce", "Shredded cabbage, carrot"], steps: ["Cook and cool noodles.", "Toss with vegetables and peanut sauce.", "Serve chilled or at room temp."] },
    ru: { ingredients: ["80 г лапши", "2 ст. л. арахисового соуса", "Капуста, морковь"], steps: ["Отварите и остудите лапшу.", "Смешайте с овощами и соусом.", "Подавайте охлаждённым."] },
  },
  mushroomRisotto: {
    en: { ingredients: ["80 g arborio rice", "100 g mushrooms", "250 ml vegetable broth", "Nutritional yeast (optional)"], steps: ["Sauté mushrooms; add rice and toast 1 min.", "Add broth gradually, stirring 18–20 min.", "Finish with nutritional yeast."] },
    ru: { ingredients: ["80 г риса arborio", "100 г грибов", "250 мл бульона", "Пищевые дрожжи (по желанию)"], steps: ["Обжарьте грибы; добавьте рис.", "Вливайте бульон, помешивая 18–20 мин.", "Добавьте дрожжи при желании."] },
  },
  lentilBolognese: {
    en: { ingredients: ["80 g cooked lentils", "80 g whole-wheat pasta", "Tomato sauce, garlic, oregano"], steps: ["Simmer lentils in tomato sauce 10 min.", "Cook pasta al dente.", "Toss pasta with lentil bolognese."] },
    ru: { ingredients: ["80 г чечевицы", "80 г пасты", "Томатный соус, чеснок, oregano"], steps: ["Тушите чечевицу в соусе 10 мин.", "Отварите пасту.", "Смешайте с соусом."] },
  },
  stuffedSweetPotato: {
    en: { ingredients: ["1 sweet potato", "80 g black beans", "Corn, salsa, cilantro"], steps: ["Bake potato at 200 °C for 45 min.", "Split and fluff inside.", "Top with beans, corn, salsa and cilantro."] },
    ru: { ingredients: ["1 батат", "80 г фасоли", "Кукуруза, salsa, cilantro"], steps: ["Запеките батат при 200 °C 45 мин.", "Разрежьте и разомните мякоть.", "Добавьте фасоль, кукурузу и salsa."] },
  },
  proteinPancakes: {
    en: { ingredients: ["1 scoop protein powder", "1 egg, 50 ml milk", "50 g oats", "Berries"], steps: ["Blend oats, protein, egg and milk.", "Cook pancakes in a non-stick pan 2 min/side.", "Serve with berries."] },
    ru: { ingredients: ["1 мерная ложка протеина", "1 яйцо, 50 мл молока", "50 г овсянки", "Ягоды"], steps: ["Смешайте овсянку, протеин, яйцо и молоко.", "Жарьте панкейки 2 мин с стороны.", "Подавайте с ягодами."] },
  },
  grilledChickenBreastRice: {
    en: { ingredients: ["150 g chicken breast", "80 g white or brown rice", "1 tsp olive oil"], steps: ["Grill seasoned chicken 6 min per side.", "Serve sliced over cooked rice.", "Drizzle with olive oil."] },
    ru: { ingredients: ["150 г куриной грудки", "80 г риса", "1 ч. л. масла"], steps: ["Гриль курицы 6 мин с стороны.", "Подавайте нарезанной с рисом.", "Полейте маслом."] },
  },
  salmonBowl: {
    en: { ingredients: ["120 g salmon", "80 g rice", "Edamame, cucumber", "Soy-ginger dressing"], steps: ["Cook rice; grill or bake salmon.", "Arrange rice, salmon and vegetables in a bowl.", "Drizzle with dressing."] },
    ru: { ingredients: ["120 г лосося", "80 г риса", "Edamame, огурец", "Соево-имбирная заправка"], steps: ["Сварите рис; приготовьте лосось.", "Выложите слоями в боул.", "Полейте заправкой."] },
  },
  cottageCheeseBerries: {
    en: { ingredients: ["150 g cottage cheese", "80 g mixed berries"], steps: ["Place cottage cheese in a bowl.", "Top with fresh berries."] },
    ru: { ingredients: ["150 г творога", "80 г ягод"], steps: ["Выложите творог в миску.", "Добавьте свежие ягоды."] },
  },
  eggWhiteOmeletteCheese: {
    en: { ingredients: ["4 egg whites", "30 g low-fat cheese", "Spinach", "1 tsp olive oil"], steps: ["Whisk egg whites.", "Cook in oiled pan; add spinach and cheese.", "Fold and cook until cheese melts."] },
    ru: { ingredients: ["4 белка", "30 г сыра", "Шпинат", "1 ч. л. масла"], steps: ["Взбейте белки.", "Жарьте на масле; добавьте шпинат и сыр.", "Сложите пополам до плавления сыра."] },
  },
  turkeyMeatballsZucchini: {
    en: { ingredients: ["150 g ground turkey", "1 zucchini (spiralized)", "Tomato sauce", "Italian herbs"], steps: ["Form and bake turkey meatballs 15 min.", "Sauté zucchini noodles 2 min.", "Serve meatballs and sauce over zoodles."] },
    ru: { ingredients: ["150 г фарша индейки", "1 цукини (спираль)", "Томатный соус", "Итальянские травы"], steps: ["Сформируйте и запеките теftели 15 мин.", "Обжарьте «лапшу» из цукини 2 мин.", "Подавайте с соусом."] },
  },
  leanSteakSalad: {
    en: { ingredients: ["120 g lean steak", "Mixed greens", "Cherry tomatoes", "Balsamic vinaigrette"], steps: ["Grill steak to desired doneness; rest 5 min.", "Slice over greens and tomatoes.", "Dress with vinaigrette."] },
    ru: { ingredients: ["120 г стейка", "Салатная зелень", "Помидоры черри", "Balsamic заправка"], steps: ["Гриль стейка; дайте отдохнуть 5 мин.", "Нарежьте поверх салата.", "Заправьте vinaigrette."] },
  },
  proteinShakeBanana: {
    en: { ingredients: ["1 scoop protein powder", "1 banana", "200 ml milk or water"], steps: ["Add all ingredients to a blender.", "Blend 30 sec until smooth.", "Drink immediately."] },
    ru: { ingredients: ["1 мерная ложка протеина", "1 банан", "200 мл молока или воды"], steps: ["Сложите всё в блендер.", "Взбейте 30 сек.", "Пейте сразу."] },
  },
  greekYogurtGranola: {
    en: { ingredients: ["150 g Greek yogurt", "30 g granola", "Honey (optional)"], steps: ["Spoon yogurt into a bowl.", "Top with granola.", "Drizzle honey if desired."] },
    ru: { ingredients: ["150 г греческого йогурта", "30 г гранолы", "Мёд (по желанию)"], steps: ["Выложите йогурт.", "Добавьте гранолу.", "Полейте мёдом при желании."] },
  },
  tunaSaladWholeGrain: {
    en: { ingredients: ["1 can tuna", "1 tbsp Greek yogurt", "Celery, onion", "2 slices whole-grain bread"], steps: ["Mix tuna with yogurt, celery and onion.", "Season with pepper.", "Serve on bread or as open sandwich."] },
    ru: { ingredients: ["1 банка тунца", "1 ст. л. йогурта", "Сельдерей, лук", "2 ломтика хлеба"], steps: ["Смешайте тунец с йогуртом и овощами.", "Посолите, поперчите.", "Подавайте на хлебе."] },
  },
  beefStirFry: {
    en: { ingredients: ["120 g lean beef strips", "Mixed stir-fry vegetables", "1 tbsp soy sauce", "1 tsp sesame oil"], steps: ["Stir-fry beef on high heat 2 min; set aside.", "Cook vegetables 4 min.", "Return beef; add soy and sesame oil."] },
    ru: { ingredients: ["120 г говядины", "Овощи для wok", "1 ст. л. соевого соуса", "1 ч. л. кунжутного масла"], steps: ["Обжарьте говядину 2 мин; отложите.", "Жарьте овощи 4 мин.", "Верните мясо; добавьте соусы."] },
  },
  jerkyApple: {
    en: { ingredients: ["20 g lean beef jerky", "1 apple"], steps: ["Slice apple.", "Serve with jerky for a protein snack."] },
    ru: { ingredients: ["20 г вяленого мяса", "1 яблоко"], steps: ["Нарежьте яблоко.", "Подавайте с вяленым мясом."] },
  },
  shrimpQuinoa: {
    en: { ingredients: ["120 g shrimp", "80 g cooked quinoa", "Garlic, lemon, parsley"], steps: ["Sauté shrimp with garlic 3 min.", "Serve over quinoa.", "Finish with lemon and parsley."] },
    ru: { ingredients: ["120 г креветок", "80 г киноа", "Чеснок, лимон, петрушка"], steps: ["Обжарьте креветки с чесноком 3 мин.", "Подавайте на киноа.", "Добавьте лимон и петрушку."] },
  },
  turkeyChili: {
    en: { ingredients: ["150 g ground turkey", "1 can kidney beans", "Tomatoes, chili powder", "Onion, bell pepper"], steps: ["Brown turkey with onion and pepper.", "Add beans, tomatoes and chili powder.", "Simmer 20 min."] },
    ru: { ingredients: ["150 г фарша индейки", "1 банка фасоли", "Томаты, chili powder", "Лук, перец"], steps: ["Обжарьте индейку с луком и перцем.", "Добавьте фасоль, томаты и специи.", "Тушите 20 мин."] },
  },
  codSweetPotato: {
    en: { ingredients: ["150 g cod", "1 small sweet potato", "Olive oil, paprika"], steps: ["Bake sweet potato 40 min at 200 °C.", "Bake cod alongside last 15 min.", "Season with paprika and serve."] },
    ru: { ingredients: ["150 г трески", "1 батат", "Масло, пaprika"], steps: ["Запеките батат 40 мин при 200 °C.", "Треску добавьте на последние 15 мин.", "Посыпьте paprika."] },
  },
  wholeGrainCerealMilk: {
    en: { ingredients: ["40 g whole-grain cereal", "150 ml milk"], steps: ["Pour cereal into a bowl.", "Add cold milk and serve."] },
    ru: { ingredients: ["40 г цельнозерновых хлопьев", "150 мл молока"], steps: ["Насыпьте хлопья в миску.", "Залейте холодным молоком."] },
  },
  chickenWrap: {
    en: { ingredients: ["1 whole-wheat tortilla", "100 g grilled chicken", "Lettuce, tomato, yogurt sauce"], steps: ["Warm tortilla.", "Layer chicken and vegetables.", "Roll tightly and cut in half."] },
    ru: { ingredients: ["1 tortillа", "100 г курицы", "Салат, помидор, йогуртовый соус"], steps: ["Подогрейте tortillу.", "Выложите курицу и овощи.", "Сверните и разрежьте."] },
  },
  fishTacos: {
    en: { ingredients: ["120 g white fish", "2 corn tortillas", "Slaw, lime, cilantro"], steps: ["Grill or bake fish; flake.", "Warm tortillas.", "Fill with fish, slaw and lime."] },
    ru: { ingredients: ["120 г рыбы", "2 tortillы", "Coleslaw, лайм, cilantro"], steps: ["Приготовьте рыбу; разомните вилкой.", "Подогрейте tortillы.", "Начините рыбой и slaw."] },
  },
  cheeseCrackersGrapes: {
    en: { ingredients: ["30 g cheese", "4 whole-grain crackers", "80 g grapes"], steps: ["Slice cheese.", "Serve with crackers and washed grapes."] },
    ru: { ingredients: ["30 г сыра", "4 крекера", "80 г винограда"], steps: ["Нарежьте сыр.", "Подавайте с крекерами и виноградом."] },
  },
  veggieEggMuffins: {
    en: { ingredients: ["3 eggs", "Bell pepper, spinach", "30 g cheese", "Muffin tin"], steps: ["Whisk eggs with diced vegetables.", "Pour into greased muffin cups.", "Bake at 180 °C for 18–20 min."] },
    ru: { ingredients: ["3 яйца", "Перец, шпинат", "30 г сыра", "Форма для маффинов"], steps: ["Взбейте яйца с нарезанными овощами.", "Разлейте по формам.", "Запекайте при 180 °C 18–20 мин."] },
  },
  turkeyVeggiePlate: {
    en: { ingredients: ["120 g turkey breast", "200 g mixed vegetables", "1 tsp olive oil"], steps: ["Grill or roast turkey.", "Steam or roast half a plate of vegetables.", "Serve together with a drizzle of oil."] },
    ru: { ingredients: ["120 г индейки", "200 г овощей", "1 ч. л. масла"], steps: ["Приготовьте индейку на гриле.", "Запеките или приготовьте на пару овощи.", "Подавайте с маслом."] },
  },
  pastaPrimavera: {
    en: { ingredients: ["80 g whole-wheat pasta", "Zucchini, peas, carrot", "1 tbsp olive oil", "Garlic, parmesan (optional)"], steps: ["Cook pasta al dente.", "Sauté vegetables with garlic.", "Toss pasta with veggies and oil."] },
    ru: { ingredients: ["80 г пасты", "Кабачок, горох, морковь", "1 ст. л. масла", "Чеснок, parmesan"], steps: ["Отварите пасту.", "Обжарьте овощи с чесноком.", "Смешайте с пастой и маслом."] },
  },
  peanutButterToastBanana: {
    en: { ingredients: ["1 slice whole-grain bread", "1 tbsp peanut butter", "1/2 banana"], steps: ["Toast bread.", "Spread peanut butter.", "Top with banana slices."] },
    ru: { ingredients: ["1 ломтик хлеба", "1 ст. л. арахисовой пасты", "1/2 банана"], steps: ["Подсушите хлеб.", "Намажьте пастой.", "Добавьте банан."] },
  },
  chefSalad: {
    en: { ingredients: ["Mixed greens", "Ham, turkey, cheese", "Boiled egg", "Light vinaigrette"], steps: ["Arrange greens on a large plate.", "Top with meats, cheese and egg.", "Dress with vinaigrette."] },
    ru: { ingredients: ["Салатная зелень", "Ветчина, индейка, сыр", "Яйцо", "Лёгкая заправка"], steps: ["Выложите зелень.", "Добавьте мясо, сыр и яйцо.", "Заправьте vinaigrette."] },
  },
  riceBeansCheese: {
    en: { ingredients: ["80 g brown rice", "80 g black beans", "30 g shredded cheese"], steps: ["Cook rice; heat beans.", "Combine in a bowl.", "Sprinkle cheese on top."] },
    ru: { ingredients: ["80 г риса", "80 г фасоли", "30 г сыра"], steps: ["Сварите рис; подогрейте фасоль.", "Смешайте в миске.", "Посыпьте сыром."] },
  },
  hamSandwich: {
    en: { ingredients: ["2 slices whole-grain bread", "60 g lean ham", "Lettuce, mustard"], steps: ["Layer ham and lettuce on bread.", "Add mustard.", "Cut and serve."] },
    ru: { ingredients: ["2 ломтика хлеба", "60 г ветчины", "Салат, горчица"], steps: ["Выложите ветчину и салат.", "Намажьте горчицу.", "Разрежьте и подавайте."] },
  },
  beefVeggieSkewers: {
    en: { ingredients: ["120 g lean beef cubes", "Bell pepper, onion, zucchini", "1 tbsp olive oil"], steps: ["Thread beef and vegetables on skewers.", "Brush with oil; season.", "Grill 8–10 min, turning often."] },
    ru: { ingredients: ["120 г говядины", "Перец, лук, кабачок", "1 ст. л. масла"], steps: ["Нанизайте мясо и овощи.", "Смажьте маслом.", "Гриль 8–10 мин, переворачивая."] },
  },
  pizzaWholeWheat: {
    en: { ingredients: ["1 whole-wheat pita or base", "3 tbsp tomato sauce", "Vegetables, 40 g mozzarella"], steps: ["Spread sauce on base.", "Top with vegetables and cheese.", "Bake at 220 °C for 8–10 min."] },
    ru: { ingredients: ["1 цельнозерновая основа", "3 ст. л. томатного соуса", "Овощи, 40 г моцареллы"], steps: ["Намажьте соус.", "Добавьте овощи и сыр.", "Запекайте при 220 °C 8–10 мин."] },
  },
  breakfastBurrito: {
    en: { ingredients: ["1 large tortilla", "2 eggs", "Black beans, salsa", "30 g cheese"], steps: ["Scramble eggs with beans.", "Fill tortilla; add salsa and cheese.", "Roll and optionally toast seam-side down."] },
    ru: { ingredients: ["1 tortillа", "2 яйца", "Фасоль, salsa", "30 г сыра"], steps: ["Сделайте скрембл с фасолью.", "Начините tortillу, добавьте salsa и сыр.", "Сверните; можно поджарить шов."] },
  },
  porkTenderloinGreens: {
    en: { ingredients: ["120 g pork tenderloin", "200 g leafy greens", "1 tsp olive oil", "Garlic"], steps: ["Season pork; roast at 200 °C for 18–20 min.", "Sauté greens with garlic.", "Slice pork and serve with greens."] },
    ru: { ingredients: ["120 г свиной вырезки", "200 г зелени", "1 ч. л. масла", "Чеснок"], steps: ["Запеките вырезку при 200 °C 18–20 мин.", "Обжарьте зелень с чесноком.", "Нарежьте мясо и подавайте."] },
  },
};

const en = {};
const ru = {};
for (const [id, data] of Object.entries(RECIPES)) {
  const rich = enrichRecipe(id, data);
  en[id] = rich.en;
  ru[id] = rich.ru;
}

fs.writeFileSync(path.join(root, "src/locales/dishRecipes.en.json"), JSON.stringify(en, null, 2) + "\n");
fs.writeFileSync(path.join(root, "src/locales/dishRecipes.ru.json"), JSON.stringify(ru, null, 2) + "\n");
console.log(`Wrote ${Object.keys(en).length} dish recipes (EN/RU).`);
