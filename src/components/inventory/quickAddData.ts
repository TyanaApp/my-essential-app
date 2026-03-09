// Quick Add product data organized by storage location with i18n

export interface QuickProduct {
  emoji: string;
  key: string;
  names: { en: string; ru: string; uk: string; lv: string };
  naturalLocation: 'fridge' | 'pantry' | 'freezer';
  defaultUnit: string;
  defaultQty: number;
}

export interface QuickCategory {
  emoji: string;
  key: string;
  labels: { en: string; ru: string; uk: string; lv: string };
  items: QuickProduct[];
}

const p = (emoji: string, key: string, en: string, ru: string, uk: string, lv: string, loc: 'fridge' | 'pantry' | 'freezer', unit = 'pcs', qty = 1): QuickProduct => ({
  emoji, key, names: { en, ru, uk, lv }, naturalLocation: loc, defaultUnit: unit, defaultQty: qty,
});

// ============ FRIDGE ============
export const FRIDGE_CATEGORIES: QuickCategory[] = [
  {
    emoji: '🥛', key: 'dairy',
    labels: { en: 'Dairy', ru: 'Молочное', uk: 'Молочне', lv: 'Piena produkti' },
    items: [
      p('🥛', 'milk', 'Milk', 'Молоко', 'Молоко', 'Piens', 'fridge', 'l', 1),
      p('🥛', 'kefir', 'Kefir', 'Кефир', 'Кефір', 'Kefīrs', 'fridge', 'l', 1),
      p('🫙', 'yogurt', 'Yogurt', 'Йогурт', 'Йогурт', 'Jogurts', 'fridge', 'pcs', 1),
      p('🥗', 'sourCream', 'Sour cream', 'Сметана', 'Сметана', 'Krējums', 'fridge', 'pcs', 1),
      p('🧀', 'cottageCheese', 'Cottage cheese', 'Творог', 'Сир кисломолочний', 'Biezpiens', 'fridge', 'pcs', 1),
      p('🥛', 'ryazhenka', 'Ryazhenka', 'Ряженка', 'Ряжанка', 'Rjaženka', 'fridge', 'l', 0.5),
      p('🥛', 'prostokvasha', 'Soured milk', 'Простокваша', 'Простокваша', 'Rūgušpiens', 'fridge', 'l', 0.5),
      p('🥛', 'varenets', 'Varenets', 'Варенец', 'Варенець', 'Varenecs', 'fridge', 'l', 0.5),
      p('🧀', 'hardCheese', 'Hard cheese', 'Сыр твёрдый', 'Сир твердий', 'Cietais siers', 'fridge', 'g', 200),
      p('🧀', 'softCheese', 'Soft cheese', 'Сыр мягкий', 'Сир м\'який', 'Mīkstais siers', 'fridge', 'g', 200),
      p('🧀', 'brynza', 'Brynza', 'Брынза', 'Бринза', 'Brīnza', 'fridge', 'g', 200),
      p('🧀', 'feta', 'Feta', 'Фета', 'Фета', 'Feta', 'fridge', 'g', 200),
      p('🧈', 'butter', 'Butter', 'Масло сливочное', 'Масло вершкове', 'Sviests', 'fridge', 'g', 200),
      p('🥛', 'cream', 'Cream', 'Сливки', 'Вершки', 'Krējums', 'fridge', 'ml', 200),
      p('🥛', 'matsoni', 'Matsoni', 'Мацони', 'Мацоні', 'Maconi', 'fridge', 'ml', 500),
    ],
  },
  {
    emoji: '🥚', key: 'eggs',
    labels: { en: 'Eggs', ru: 'Яйца', uk: 'Яйця', lv: 'Olas' },
    items: [
      p('🥚', 'chickenEggs', 'Chicken eggs', 'Яйца куриные', 'Яйця курячі', 'Vistu olas', 'fridge', 'pcs', 10),
      p('🥚', 'quailEggs', 'Quail eggs', 'Яйца перепелиные', 'Яйця перепелині', 'Paipalu olas', 'fridge', 'pcs', 20),
    ],
  },
  {
    emoji: '🥩', key: 'freshMeat',
    labels: { en: 'Meat & poultry (fresh)', ru: 'Мясо и птица (свежее)', uk: 'М\'ясо та птиця (свіже)', lv: 'Gaļa un mājputni (svaigi)' },
    items: [
      p('🍗', 'chickenBreast', 'Chicken breast', 'Куриная грудка', 'Куряча грудка', 'Vistas krūtiņa', 'fridge', 'g', 500),
      p('🍗', 'chickenThighs', 'Chicken thighs', 'Куриные бёдра', 'Курячі стегна', 'Vistas šķiņķi', 'fridge', 'g', 500),
      p('🍗', 'chickenWings', 'Chicken wings', 'Куриные крылья', 'Курячі крильця', 'Vistas spārni', 'fridge', 'g', 500),
      p('🍗', 'chickenMince', 'Chicken mince', 'Фарш куриный', 'Фарш курячий', 'Vistas maltā gaļa', 'fridge', 'g', 500),
      p('🥩', 'beef', 'Beef', 'Говядина', 'Яловичина', 'Liellopu gaļa', 'fridge', 'g', 500),
      p('🥓', 'pork', 'Pork', 'Свинина', 'Свинина', 'Cūkgaļa', 'fridge', 'g', 500),
      p('🥩', 'lamb', 'Lamb', 'Баранина', 'Баранина', 'Jēra gaļa', 'fridge', 'g', 500),
      p('🥩', 'beefMince', 'Beef mince', 'Фарш говяжий', 'Фарш яловичий', 'Liellopu maltā gaļa', 'fridge', 'g', 500),
      p('🥩', 'porkMince', 'Pork mince', 'Фарш свиной', 'Фарш свинячий', 'Cūkgaļas maltā gaļa', 'fridge', 'g', 500),
      p('🥩', 'mixedMince', 'Mixed mince', 'Фарш смешанный', 'Фарш мішаний', 'Jaukta maltā gaļa', 'fridge', 'g', 500),
      p('🍗', 'turkey', 'Turkey', 'Индейка', 'Індичка', 'Tītara gaļa', 'fridge', 'g', 500),
      p('🐇', 'rabbit', 'Rabbit', 'Кролик', 'Кролик', 'Truša gaļa', 'fridge', 'g', 500),
      p('🦆', 'duck', 'Duck', 'Утка', 'Качка', 'Pīle', 'fridge', 'g', 500),
      p('img:liver', 'liver', 'Liver', 'Печень', 'Печінка', 'Aknas', 'fridge', 'g', 500),
      p('🫀', 'heart', 'Heart', 'Сердце', 'Серце', 'Sirds', 'fridge', 'g', 500),
    ],
  },
  {
    emoji: '🐟', key: 'freshFish',
    labels: { en: 'Fish & seafood (fresh)', ru: 'Рыба и морепродукты (свежие)', uk: 'Риба та морепродукти (свіжі)', lv: 'Zivis un jūras veltes (svaigas)' },
    items: [
      p('🐟', 'salmon', 'Salmon', 'Лосось', 'Лосось', 'Lasis', 'fridge', 'g', 500),
      p('🐟', 'trout', 'Trout', 'Форель', 'Форель', 'Forele', 'fridge', 'g', 500),
      p('🐟', 'cod', 'Cod', 'Треска', 'Тріска', 'Menca', 'fridge', 'g', 500),
      p('🐟', 'tuna', 'Tuna', 'Тунец', 'Тунець', 'Tunzivs', 'fridge', 'g', 500),
      p('🐟', 'pollock', 'Pollock', 'Минтай', 'Мінтай', 'Mintajs', 'fridge', 'g', 500),
      p('🐟', 'hake', 'Hake', 'Хек', 'Хек', 'Heks', 'fridge', 'g', 500),
      p('🐟', 'mackerel', 'Mackerel', 'Скумбрия', 'Скумбрія', 'Skumbrija', 'fridge', 'g', 500),
      p('🐟', 'herring', 'Herring', 'Сельдь', 'Оселедець', 'Siļķe', 'fridge', 'g', 500),
      p('🐟', 'carp', 'Carp', 'Карп', 'Короп', 'Karpa', 'fridge', 'g', 500),
      p('🐟', 'pikeperch', 'Pike-perch', 'Судак', 'Судак', 'Zandarts', 'fridge', 'g', 500),
      p('🦐', 'shrimp', 'Shrimp', 'Креветки', 'Креветки', 'Garneles', 'fridge', 'g', 300),
      p('🦑', 'squid', 'Squid', 'Кальмар', 'Кальмар', 'Kalmārs', 'fridge', 'g', 300),
      p('🦪', 'mussels', 'Mussels', 'Мидии', 'Мідії', 'Mīdijas', 'fridge', 'g', 300),
      p('🐙', 'octopus', 'Octopus', 'Осьминог', 'Восьминіг', 'Astoņkājis', 'fridge', 'g', 300),
      p('🟠', 'redCaviar', 'Red caviar', 'Икра красная', 'Ікра червона', 'Sarkanais ikrs', 'fridge', 'g', 100),
      p('⚫', 'blackCaviar', 'Black caviar', 'Икра чёрная', 'Ікра чорна', 'Melnais ikrs', 'fridge', 'g', 50),
    ],
  },
  {
    emoji: '🥬', key: 'coldVegetables',
    labels: { en: 'Vegetables (need cold)', ru: 'Овощи (требуют холода)', uk: 'Овочі (потребують холоду)', lv: 'Dārzeņi (jāglabā aukstumā)' },
    items: [
      p('🥬', 'lettuce', 'Lettuce', 'Листья салата', 'Листя салату', 'Salāti', 'fridge', 'pcs', 1),
      p('🥬', 'spinach', 'Spinach', 'Шпинат', 'Шпинат', 'Spināti', 'fridge', 'pcs', 1),
      p('🥬', 'arugula', 'Arugula', 'Руккола', 'Рукола', 'Rukola', 'fridge', 'pcs', 1),
      p('🥬', 'napaCabbage', 'Napa cabbage', 'Пекинская капуста', 'Пекінська капуста', 'Ķīnas kāposts', 'fridge', 'pcs', 1),
      p('🥦', 'broccoli', 'Broccoli', 'Брокколи', 'Броколі', 'Brokoļi', 'fridge', 'pcs', 1),
      p('🥦', 'cauliflower', 'Cauliflower', 'Цветная капуста', 'Цвітна капуста', 'Ziedkāposts', 'fridge', 'pcs', 1),
      p('🟢', 'greenPeas', 'Green peas', 'Зелёный горошек', 'Зелений горошок', 'Zaļie zirņi', 'fridge', 'g', 200),
      p('🫛', 'greenBeans', 'Green beans', 'Стручковая фасоль', 'Стручкова квасоля', 'Zaļās pupiņas', 'fridge', 'g', 200),
      p('🌱', 'asparagus', 'Asparagus', 'Спаржа', 'Спаржа', 'Sparģeļi', 'fridge', 'pcs', 1),
      p('🌿', 'celery', 'Celery', 'Сельдерей', 'Селера', 'Selerija', 'fridge', 'pcs', 1),
      p('🍅', 'tomatoes', 'Tomatoes', 'Помидоры', 'Помідори', 'Tomāti', 'fridge', 'kg', 1),
      p('🥒', 'cucumbers', 'Cucumbers', 'Огурцы', 'Огірки', 'Gurķi', 'fridge', 'kg', 1),
      p('🫑', 'bellPepper', 'Bell pepper', 'Перец болгарский', 'Перець болгарський', 'Paprika', 'fridge', 'pcs', 3),
      p('🥕', 'carrots', 'Carrots', 'Морковь', 'Морква', 'Burkāni', 'fridge', 'kg', 1),
      p('🟣', 'beets', 'Beets', 'Свёкла', 'Буряк', 'Bietes', 'fridge', 'kg', 1),
      p('🔴', 'radish', 'Radish', 'Редис', 'Редиска', 'Redīsi', 'fridge', 'pcs', 1),
      p('🧅', 'greenOnion', 'Green onion', 'Зелёный лук', 'Зелена цибуля', 'Zaļie lociņi', 'fridge', 'pcs', 1),
      p('🌿', 'parsley', 'Parsley', 'Петрушка', 'Петрушка', 'Pētersīļi', 'fridge', 'pcs', 1),
      p('🌿', 'dill', 'Dill', 'Укроп', 'Кріп', 'Dilles', 'fridge', 'pcs', 1),
      p('🌿', 'cilantro', 'Cilantro', 'Кинза', 'Кінза', 'Koriandrs', 'fridge', 'pcs', 1),
      p('🌿', 'basil', 'Basil', 'Базилик', 'Базилік', 'Baziliks', 'fridge', 'pcs', 1),
      p('🌿', 'mint', 'Mint', 'Мята', 'М\'ята', 'Piparmētra', 'fridge', 'pcs', 1),
    ],
  },
  {
    emoji: '🍎', key: 'coldFruits',
    labels: { en: 'Fruits (need cold)', ru: 'Фрукты (требуют холода)', uk: 'Фрукти (потребують холоду)', lv: 'Augļi (jāglabā aukstumā)' },
    items: [
      p('🍎', 'apples', 'Apples', 'Яблоки', 'Яблука', 'Āboli', 'fridge', 'kg', 1),
      p('🍐', 'pears', 'Pears', 'Груши', 'Груші', 'Bumbieri', 'fridge', 'kg', 1),
      p('🍇', 'grapes', 'Grapes', 'Виноград', 'Виноград', 'Vīnogas', 'fridge', 'g', 500),
      p('🍓', 'strawberries', 'Strawberries', 'Клубника', 'Полуниця', 'Zemenes', 'fridge', 'g', 300),
      p('🫐', 'raspberries', 'Raspberries', 'Малина', 'Малина', 'Avenes', 'fridge', 'g', 200),
      p('🫐', 'blueberries', 'Blueberries', 'Черника', 'Чорниця', 'Mellenes', 'fridge', 'g', 200),
      p('🫐', 'blackberries', 'Blackberries', 'Ежевика', 'Ожина', 'Kazenes', 'fridge', 'g', 200),
      p('🫐', 'currants', 'Currants', 'Смородина', 'Смородина', 'Jāņogas', 'fridge', 'g', 200),
      p('🍒', 'cherries', 'Cherries', 'Вишня', 'Вишня', 'Ķirši', 'fridge', 'g', 300),
      p('🍒', 'sweetCherry', 'Sweet cherry', 'Черешня', 'Черешня', 'Saldie ķirši', 'fridge', 'g', 300),
      p('🍑', 'peaches', 'Peaches', 'Персики', 'Персики', 'Persiki', 'fridge', 'pcs', 3),
      p('🍑', 'apricots', 'Apricots', 'Абрикосы', 'Абрикоси', 'Aprikozes', 'fridge', 'pcs', 5),
      p('🍑', 'plums', 'Plums', 'Сливы', 'Сливи', 'Plūmes', 'fridge', 'pcs', 5),
      p('🍉', 'watermelonCut', 'Watermelon (cut)', 'Арбуз (разрезанный)', 'Кавун (розрізаний)', 'Arbūzs (griezts)', 'fridge', 'pcs', 1),
      p('🍈', 'melonCut', 'Melon (cut)', 'Дыня (разрезанная)', 'Диня (розрізана)', 'Melone (griezta)', 'fridge', 'pcs', 1),
    ],
  },
  {
    emoji: '🧃', key: 'drinksSauces',
    labels: { en: 'Drinks & sauces', ru: 'Напитки и соусы', uk: 'Напої та соуси', lv: 'Dzērieni un mērces' },
    items: [
      p('🧃', 'freshJuice', 'Fresh juice', 'Сок свежевыжатый', 'Сік свіжовичавлений', 'Svaigi spiesta sula', 'fridge', 'l', 1),
      p('🥛', 'drinkingKefir', 'Drinking kefir', 'Кефир питьевой', 'Кефір питний', 'Dzeramais kefīrs', 'fridge', 'l', 0.5),
      p('🫙', 'mayo', 'Mayonnaise', 'Майонез', 'Майонез', 'Majonēze', 'fridge', 'pcs', 1),
      p('🫙', 'ketchupOpen', 'Ketchup (opened)', 'Кетчуп (открытый)', 'Кетчуп (відкритий)', 'Kečups (atvērts)', 'fridge', 'pcs', 1),
      p('🫙', 'mustard', 'Mustard', 'Горчица', 'Гірчиця', 'Sinepju mērce', 'fridge', 'pcs', 1),
      p('🫙', 'soySauceOpen', 'Soy sauce (opened)', 'Соевый соус (открытый)', 'Соєвий соус (відкритий)', 'Sojas mērce (atvērta)', 'fridge', 'pcs', 1),
      p('🫙', 'adjika', 'Adjika', 'Аджика', 'Аджика', 'Adžika', 'fridge', 'pcs', 1),
      p('🫙', 'tomatoPasteOpen', 'Tomato paste (opened)', 'Томатная паста (открытая)', 'Томатна паста (відкрита)', 'Tomātu pasta (atvērta)', 'fridge', 'pcs', 1),
    ],
  },
  {
    emoji: '🍱', key: 'readyFood',
    labels: { en: 'Ready food', ru: 'Готовая еда', uk: 'Готова їжа', lv: 'Gatavs ēdiens' },
    items: [
      p('🍲', 'leftoverSoup', 'Leftover soup', 'Остатки супа', 'Залишки супу', 'Zupas atlikums', 'fridge', 'pcs', 1),
      p('🍛', 'leftoverMain', 'Leftover main dish', 'Остатки второго блюда', 'Залишки другої страви', 'Otrā ēdiena atlikums', 'fridge', 'pcs', 1),
      p('🥘', 'readyCutlets', 'Ready cutlets', 'Готовые котлеты', 'Готові котлети', 'Gatavas kotletes', 'fridge', 'pcs', 3),
      p('🥚', 'boiledEggs', 'Boiled eggs', 'Варёные яйца', 'Варені яйця', 'Vārītas olas', 'fridge', 'pcs', 3),
      p('🥓', 'sausageSlice', 'Sausage slices', 'Нарезка колбасная', 'Нарізка ковбасна', 'Desu šķēlītes', 'fridge', 'pcs', 1),
      p('🧀', 'cheeseSlice', 'Cheese slices', 'Нарезка сырная', 'Нарізка сирна', 'Siera šķēlītes', 'fridge', 'pcs', 1),
    ],
  },
];

// ============ PANTRY ============
export const PANTRY_CATEGORIES: QuickCategory[] = [
  {
    emoji: '🫙', key: 'grainsLegumes',
    labels: { en: 'Grains & legumes', ru: 'Крупы и бобовые', uk: 'Крупи та бобові', lv: 'Graudi un pākšaugi' },
    items: [
      p('🍚', 'rice', 'Rice', 'Рис', 'Рис', 'Rīsi', 'pantry', 'kg', 1),
      p('🌾', 'buckwheat', 'Buckwheat', 'Гречка', 'Гречка', 'Griķi', 'pantry', 'kg', 1),
      p('🥣', 'oatmeal', 'Oatmeal', 'Овсянка', 'Вівсянка', 'Auzu pārslas', 'pantry', 'kg', 0.5),
      p('🌾', 'millet', 'Millet', 'Пшено', 'Пшоно', 'Prosa', 'pantry', 'kg', 0.5),
      p('🌾', 'barley', 'Pearl barley', 'Перловка', 'Перловка', 'Grūbas', 'pantry', 'kg', 0.5),
      p('🌾', 'semolina', 'Semolina', 'Манная крупа', 'Манна крупа', 'Manna putraimi', 'pantry', 'kg', 0.5),
      p('🌾', 'bulgur', 'Bulgur', 'Булгур', 'Булгур', 'Bulgurs', 'pantry', 'kg', 0.5),
      p('🌾', 'couscous', 'Couscous', 'Кускус', 'Кускус', 'Kuskuss', 'pantry', 'kg', 0.5),
      p('🌾', 'spelt', 'Spelt', 'Полба', 'Полба', 'Plēkšņu kvieši', 'pantry', 'kg', 0.5),
      p('🫘', 'redLentils', 'Red lentils', 'Чечевица красная', 'Сочевиця червона', 'Sarkanās lēcas', 'pantry', 'kg', 0.5),
      p('🫘', 'greenLentils', 'Green lentils', 'Чечевица зелёная', 'Сочевиця зелена', 'Zaļās lēcas', 'pantry', 'kg', 0.5),
      p('🫘', 'whiteBeans', 'White beans', 'Фасоль белая', 'Квасоля біла', 'Baltās pupiņas', 'pantry', 'kg', 0.5),
      p('🫘', 'redBeans', 'Red beans', 'Фасоль красная', 'Квасоля червона', 'Sarkanās pupiņas', 'pantry', 'kg', 0.5),
      p('🫘', 'chickpeas', 'Chickpeas', 'Нут', 'Нут', 'Aunazirņi', 'pantry', 'kg', 0.5),
      p('🫘', 'peas', 'Peas', 'Горох', 'Горох', 'Zirņi', 'pantry', 'kg', 0.5),
      p('🫘', 'mungBeans', 'Mung beans', 'Маш', 'Маш', 'Mungo pupiņas', 'pantry', 'kg', 0.5),
      p('🌾', 'quinoa', 'Quinoa', 'Киноа', 'Кіноа', 'Kvinoja', 'pantry', 'kg', 0.5),
    ],
  },
  {
    emoji: '🍝', key: 'pastaFlour',
    labels: { en: 'Pasta & flour', ru: 'Макароны и мука', uk: 'Макарони та борошно', lv: 'Makaroni un milti' },
    items: [
      p('🍝', 'spaghetti', 'Spaghetti', 'Спагетти', 'Спагетті', 'Spageti', 'pantry', 'g', 500),
      p('🍝', 'penne', 'Penne', 'Пенне', 'Пенне', 'Penne', 'pantry', 'g', 500),
      p('🍝', 'fusilli', 'Fusilli', 'Фузилли', 'Фузіллі', 'Fusilli', 'pantry', 'g', 500),
      p('🍝', 'tagliatelle', 'Tagliatelle', 'Тальятелле', 'Тальятелле', 'Tagliatelle', 'pantry', 'g', 500),
      p('🍝', 'noodles', 'Noodles', 'Лапша', 'Локшина', 'Nūdeles', 'pantry', 'g', 500),
      p('🍝', 'vermicelli', 'Vermicelli', 'Вермишель', 'Вермішель', 'Vermicellas', 'pantry', 'g', 500),
      p('🍝', 'macaroni', 'Macaroni', 'Макароны', 'Макарони', 'Makaroni', 'pantry', 'g', 500),
      p('🍝', 'elbow', 'Elbow pasta', 'Рожки', 'Ріжки', 'Radzīši', 'pantry', 'g', 500),
      p('🌾', 'wheatFlour', 'Wheat flour', 'Мука пшеничная', 'Борошно пшеничне', 'Kviešu milti', 'pantry', 'kg', 1),
      p('🌾', 'ryeFlour', 'Rye flour', 'Мука ржаная', 'Борошно житнє', 'Rudzu milti', 'pantry', 'kg', 1),
      p('🌽', 'cornFlour', 'Corn flour', 'Мука кукурузная', 'Борошно кукурудзяне', 'Kukurūzas milti', 'pantry', 'kg', 0.5),
      p('🌾', 'oatFlour', 'Oat flour', 'Мука овсяная', 'Борошно вівсяне', 'Auzu milti', 'pantry', 'kg', 0.5),
      p('🌽', 'cornStarch', 'Corn starch', 'Крахмал кукурузный', 'Крохмаль кукурудзяний', 'Kukurūzas ciete', 'pantry', 'g', 200),
      p('🥔', 'potatoStarch', 'Potato starch', 'Крахмал картофельный', 'Крохмаль картопляний', 'Kartupeļu ciete', 'pantry', 'g', 200),
    ],
  },
  {
    emoji: '🥫', key: 'canned',
    labels: { en: 'Canned goods', ru: 'Консервы', uk: 'Консерви', lv: 'Konservi' },
    items: [
      p('🥫', 'tunaCannedOil', 'Tuna in oil', 'Тунец в масле', 'Тунець в олії', 'Tunzivs eļļā', 'pantry', 'pcs', 1),
      p('🥫', 'tunaCannedJuice', 'Tuna in own juice', 'Тунец в своём соку', 'Тунець у власному соку', 'Tunzivs savā sulā', 'pantry', 'pcs', 1),
      p('🥫', 'sardines', 'Sardines', 'Сардины', 'Сардини', 'Sardīnes', 'pantry', 'pcs', 1),
      p('🥫', 'sprats', 'Sprats', 'Шпроты', 'Шпроти', 'Šprotes', 'pantry', 'pcs', 1),
      p('🥫', 'mackerelCanned', 'Canned mackerel', 'Скумбрия консервированная', 'Скумбрія консервована', 'Konservēta skumbrija', 'pantry', 'pcs', 1),
      p('🥫', 'greenPeasCan', 'Green peas (canned)', 'Горошек зелёный', 'Горошок зелений', 'Zaļie zirņi (konserv.)', 'pantry', 'pcs', 1),
      p('🌽', 'cornCanned', 'Corn (canned)', 'Кукуруза', 'Кукурудза', 'Kukurūza (konserv.)', 'pantry', 'pcs', 1),
      p('🫘', 'beansCanned', 'Beans (canned)', 'Фасоль консервированная', 'Квасоля консервована', 'Pupiņas (konserv.)', 'pantry', 'pcs', 1),
      p('🍅', 'tomatoesCanned', 'Canned tomatoes', 'Томаты в собственном соку', 'Томати у власному соку', 'Tomāti savā sulā', 'pantry', 'pcs', 1),
      p('🍅', 'tomatoPaste', 'Tomato paste', 'Томатная паста', 'Томатна паста', 'Tomātu pasta', 'pantry', 'pcs', 1),
      p('🫒', 'olives', 'Olives', 'Оливки', 'Оливки', 'Olīvas', 'pantry', 'pcs', 1),
      p('⚫', 'blackOlives', 'Black olives', 'Маслины', 'Маслини', 'Melnās olīvas', 'pantry', 'pcs', 1),
      p('🟢', 'capers', 'Capers', 'Каперсы', 'Каперси', 'Kaperi', 'pantry', 'pcs', 1),
      p('🍄', 'mushroomsCanned', 'Pickled mushrooms', 'Грибы маринованные', 'Гриби мариновані', 'Marinētas sēnes', 'pantry', 'pcs', 1),
      p('🥒', 'pickledCucumbers', 'Pickled cucumbers', 'Огурцы маринованные', 'Огірки мариновані', 'Marinēti gurķi', 'pantry', 'pcs', 1),
    ],
  },
  {
    emoji: '🧂', key: 'spices',
    labels: { en: 'Spices & seasonings', ru: 'Специи и приправы', uk: 'Спеції та приправи', lv: 'Garšvielas un piedevas' },
    items: [
      p('🧂', 'salt', 'Salt', 'Соль', 'Сіль', 'Sāls', 'pantry', 'pcs', 1),
      p('🌶', 'blackPepper', 'Black pepper', 'Перец чёрный', 'Перець чорний', 'Melnie pipari', 'pantry', 'pcs', 1),
      p('🌶', 'redPepper', 'Red pepper', 'Перец красный', 'Перець червоний', 'Sarkanie pipari', 'pantry', 'pcs', 1),
      p('🟡', 'paprika', 'Paprika', 'Паприка', 'Паприка', 'Paprika', 'pantry', 'pcs', 1),
      p('🟡', 'turmeric', 'Turmeric', 'Куркума', 'Куркума', 'Kurkuma', 'pantry', 'pcs', 1),
      p('🟡', 'curry', 'Curry', 'Карри', 'Карі', 'Karijs', 'pantry', 'pcs', 1),
      p('🟡', 'cumin', 'Cumin', 'Зира', 'Зіра', 'Ķimenes', 'pantry', 'pcs', 1),
      p('🟤', 'coriander', 'Coriander', 'Кориандр', 'Коріандр', 'Koriandrs', 'pantry', 'pcs', 1),
      p('🌿', 'oregano', 'Oregano', 'Орегано', 'Орегано', 'Oregano', 'pantry', 'pcs', 1),
      p('🌿', 'driedBasil', 'Dried basil', 'Базилик сушёный', 'Базилік сушений', 'Žāvēts baziliks', 'pantry', 'pcs', 1),
      p('🌿', 'rosemary', 'Rosemary', 'Розмарин', 'Розмарин', 'Rozmarīns', 'pantry', 'pcs', 1),
      p('🌿', 'thyme', 'Thyme', 'Тимьян', 'Чебрець', 'Timiāns', 'pantry', 'pcs', 1),
      p('🍃', 'bayLeaf', 'Bay leaf', 'Лавровый лист', 'Лавровий лист', 'Lauru lapa', 'pantry', 'pcs', 1),
      p('🟤', 'cinnamon', 'Cinnamon', 'Корица', 'Кориця', 'Kanēlis', 'pantry', 'pcs', 1),
      p('🟤', 'vanilla', 'Vanilla', 'Ваниль', 'Ваніль', 'Vaniļa', 'pantry', 'pcs', 1),
      p('🟤', 'nutmeg', 'Nutmeg', 'Мускатный орех', 'Мускатний горіх', 'Muskatrieksts', 'pantry', 'pcs', 1),
      p('🟡', 'driedGinger', 'Dried ginger', 'Имбирь сушёный', 'Імбир сушений', 'Žāvēts ingvers', 'pantry', 'pcs', 1),
      p('🧄', 'garlicPowder', 'Garlic powder', 'Чесночный порошок', 'Часниковий порошок', 'Ķiploku pulveris', 'pantry', 'pcs', 1),
    ],
  },
  {
    emoji: '🍯', key: 'oilsSauces',
    labels: { en: 'Oils & sauces', ru: 'Масла и соусы', uk: 'Олії та соуси', lv: 'Eļļas un mērces' },
    items: [
      p('🫒', 'sunflowerOil', 'Sunflower oil', 'Масло подсолнечное', 'Олія соняшникова', 'Saulespuķu eļļa', 'pantry', 'l', 1),
      p('🫒', 'oliveOil', 'Olive oil', 'Масло оливковое', 'Олія оливкова', 'Olīveļļa', 'pantry', 'l', 0.5),
      p('🥥', 'coconutOil', 'Coconut oil', 'Масло кокосовое', 'Олія кокосова', 'Kokosriekstu eļļa', 'pantry', 'ml', 500),
      p('🫒', 'sesameOil', 'Sesame oil', 'Масло кунжутное', 'Олія кунжутна', 'Sezama eļļa', 'pantry', 'ml', 250),
      p('🍎', 'appleVinegar', 'Apple vinegar', 'Уксус яблочный', 'Оцет яблучний', 'Ābolu etiķis', 'pantry', 'ml', 500),
      p('🍇', 'balsamicVinegar', 'Balsamic vinegar', 'Уксус бальзамический', 'Оцет бальзамічний', 'Balzamiko etiķis', 'pantry', 'ml', 250),
      p('🫙', 'soySauce', 'Soy sauce', 'Соевый соус', 'Соєвий соус', 'Sojas mērce', 'pantry', 'ml', 250),
      p('🫙', 'worcestershire', 'Worcestershire sauce', 'Вустерширский соус', 'Вустерширський соус', 'Vusteras mērce', 'pantry', 'ml', 250),
      p('🫙', 'fishSauce', 'Fish sauce', 'Рыбный соус', 'Рибний соус', 'Zivju mērce', 'pantry', 'ml', 250),
      p('🫙', 'teriyaki', 'Teriyaki sauce', 'Соус терияки', 'Соус теріякі', 'Terijakī mērce', 'pantry', 'ml', 250),
    ],
  },
  {
    emoji: '🍫', key: 'sweetsBaking',
    labels: { en: 'Sweets & baking', ru: 'Сладкое и выпечка', uk: 'Солодощі та випічка', lv: 'Saldumi un cepšana' },
    items: [
      p('🍬', 'whiteSugar', 'White sugar', 'Сахар белый', 'Цукор білий', 'Baltais cukurs', 'pantry', 'kg', 1),
      p('🍬', 'brownSugar', 'Brown sugar', 'Сахар коричневый', 'Цукор коричневий', 'Brūnais cukurs', 'pantry', 'kg', 0.5),
      p('🍯', 'honey', 'Honey', 'Мёд', 'Мед', 'Medus', 'pantry', 'pcs', 1),
      p('🫙', 'jam', 'Jam', 'Варенье', 'Варення', 'Ievārījums', 'pantry', 'pcs', 1),
      p('🫙', 'jellyJam', 'Jelly jam', 'Джем', 'Джем', 'Džems', 'pantry', 'pcs', 1),
      p('🟤', 'nutella', 'Nutella', 'Нутелла', 'Нутелла', 'Nutella', 'pantry', 'pcs', 1),
      p('🍫', 'darkChocolate', 'Dark chocolate', 'Шоколад тёмный', 'Шоколад темний', 'Tumšā šokolāde', 'pantry', 'pcs', 1),
      p('🍫', 'milkChocolate', 'Milk chocolate', 'Шоколад молочный', 'Шоколад молочний', 'Piena šokolāde', 'pantry', 'pcs', 1),
      p('🟤', 'cocoaPowder', 'Cocoa powder', 'Какао-порошок', 'Какао-порошок', 'Kakao pulveris', 'pantry', 'pcs', 1),
      p('🟤', 'bakingPowder', 'Baking powder', 'Разрыхлитель', 'Розпушувач', 'Cepamais pulveris', 'pantry', 'pcs', 1),
      p('🟤', 'bakingSoda', 'Baking soda', 'Сода', 'Сода', 'Soda', 'pantry', 'pcs', 1),
      p('🟤', 'dryYeast', 'Dry yeast', 'Дрожжи сухие', 'Дріжджі сухі', 'Sausais raugs', 'pantry', 'pcs', 1),
      p('🟤', 'vanillaSugar', 'Vanilla sugar', 'Ванильный сахар', 'Ванільний цукор', 'Vaniļas cukurs', 'pantry', 'pcs', 1),
      p('🥫', 'condensedMilk', 'Condensed milk', 'Сгущённое молоко', 'Згущене молоко', 'Kondensētais piens', 'pantry', 'pcs', 1),
      p('🍪', 'cookies', 'Cookies', 'Печенье', 'Печиво', 'Cepumi', 'pantry', 'pcs', 1),
      p('🍘', 'crackers', 'Crackers', 'Крекеры', 'Крекери', 'Krekeri', 'pantry', 'pcs', 1),
    ],
  },
  {
    emoji: '☕', key: 'teaCoffee',
    labels: { en: 'Tea & coffee', ru: 'Чай и кофе', uk: 'Чай та кава', lv: 'Tēja un kafija' },
    items: [
      p('☕', 'groundCoffee', 'Ground coffee', 'Кофе молотый', 'Кава мелена', 'Maltā kafija', 'pantry', 'pcs', 1),
      p('☕', 'coffeeBeans', 'Coffee beans', 'Кофе в зёрнах', 'Кава в зернах', 'Kafijas pupiņas', 'pantry', 'pcs', 1),
      p('☕', 'instantCoffee', 'Instant coffee', 'Кофе растворимый', 'Кава розчинна', 'Šķīstošā kafija', 'pantry', 'pcs', 1),
      p('🍵', 'blackTea', 'Black tea', 'Чай чёрный', 'Чай чорний', 'Melnā tēja', 'pantry', 'pcs', 1),
      p('🍵', 'greenTea', 'Green tea', 'Чай зелёный', 'Чай зелений', 'Zaļā tēja', 'pantry', 'pcs', 1),
      p('🍵', 'herbalTea', 'Herbal tea', 'Чай травяной', 'Чай трав\'яний', 'Zāļu tēja', 'pantry', 'pcs', 1),
      p('🟤', 'cocoa', 'Cocoa', 'Какао', 'Какао', 'Kakao', 'pantry', 'pcs', 1),
      p('🟤', 'chicory', 'Chicory', 'Цикорий', 'Цикорій', 'Cigoriņš', 'pantry', 'pcs', 1),
    ],
  },
  {
    emoji: '🥜', key: 'nutsDried',
    labels: { en: 'Nuts & dried fruits', ru: 'Орехи и сухофрукты', uk: 'Горіхи та сухофрукти', lv: 'Rieksti un žāvēti augļi' },
    items: [
      p('🥜', 'walnuts', 'Walnuts', 'Грецкие орехи', 'Волоські горіхи', 'Valrieksti', 'pantry', 'g', 200),
      p('🥜', 'almonds', 'Almonds', 'Миндаль', 'Мигдаль', 'Mandeles', 'pantry', 'g', 200),
      p('🥜', 'hazelnuts', 'Hazelnuts', 'Фундук', 'Фундук', 'Lazdu rieksti', 'pantry', 'g', 200),
      p('🥜', 'cashews', 'Cashews', 'Кешью', 'Кешʼю', 'Indijas rieksti', 'pantry', 'g', 200),
      p('🥜', 'peanuts', 'Peanuts', 'Арахис', 'Арахіс', 'Zemesrieksti', 'pantry', 'g', 200),
      p('🥜', 'pistachios', 'Pistachios', 'Фисташки', 'Фісташки', 'Pistācijas', 'pantry', 'g', 200),
      p('🥜', 'pineNuts', 'Pine nuts', 'Кедровые орехи', 'Кедрові горіхи', 'Ciedru rieksti', 'pantry', 'g', 100),
      p('🍇', 'raisins', 'Raisins', 'Изюм', 'Родзинки', 'Rozīnes', 'pantry', 'g', 200),
      p('🟣', 'prunes', 'Prunes', 'Чернослив', 'Чорнослив', 'Žāvētas plūmes', 'pantry', 'g', 200),
      p('🟠', 'driedApricots', 'Dried apricots', 'Курага', 'Курага', 'Žāvētas aprikozes', 'pantry', 'g', 200),
      p('🟤', 'dates', 'Dates', 'Финики', 'Фініки', 'Dateles', 'pantry', 'g', 200),
      p('🟤', 'driedFigs', 'Dried figs', 'Инжир', 'Інжир', 'Žāvētas vīģes', 'pantry', 'g', 200),
      p('🔴', 'driedCranberries', 'Dried cranberries', 'Клюква сушёная', 'Журавлина сушена', 'Žāvētas dzērvenes', 'pantry', 'g', 100),
      p('🟤', 'flaxSeeds', 'Flax seeds', 'Семена льна', 'Насіння льону', 'Linsēklas', 'pantry', 'g', 200),
      p('🟤', 'chiaSeeds', 'Chia seeds', 'Семена чиа', 'Насіння чіа', 'Čia sēklas', 'pantry', 'g', 200),
      p('🟤', 'sesame', 'Sesame seeds', 'Кунжут', 'Кунжут', 'Sezama sēklas', 'pantry', 'g', 200),
      p('🌻', 'sunflowerSeeds', 'Sunflower seeds', 'Семена подсолнуха', 'Насіння соняшнику', 'Saulespuķu sēklas', 'pantry', 'g', 200),
    ],
  },
  {
    emoji: '🥔', key: 'roomTempVeg',
    labels: { en: 'Vegetables (room temp)', ru: 'Овощи (не требуют холода)', uk: 'Овочі (без холоду)', lv: 'Dārzeņi (istabas temp.)' },
    items: [
      p('🥔', 'potatoes', 'Potatoes', 'Картошка', 'Картопля', 'Kartupeļi', 'pantry', 'kg', 2),
      p('🧅', 'onion', 'Onion', 'Лук репчатый', 'Цибуля ріпчаста', 'Sīpoli', 'pantry', 'kg', 1),
      p('🧄', 'garlic', 'Garlic', 'Чеснок', 'Часник', 'Ķiploki', 'pantry', 'pcs', 1),
      p('🎃', 'pumpkin', 'Pumpkin', 'Тыква', 'Гарбуз', 'Ķirbis', 'pantry', 'pcs', 1),
      p('🥒', 'zucchini', 'Zucchini', 'Кабачок', 'Кабачок', 'Cukini', 'pantry', 'pcs', 1),
      p('🍆', 'eggplant', 'Eggplant', 'Баклажан', 'Баклажан', 'Baklažāns', 'pantry', 'pcs', 1),
      p('🧅', 'redOnion', 'Red onion', 'Лук красный', 'Цибуля червона', 'Sarkanie sīpoli', 'pantry', 'pcs', 2),
      p('🧅', 'leek', 'Leek', 'Лук порей', 'Цибуля порей', 'Puravi', 'pantry', 'pcs', 1),
      p('🧅', 'shallot', 'Shallot', 'Шалот', 'Шалот', 'Šalotes sīpoli', 'pantry', 'pcs', 3),
    ],
  },
  {
    emoji: '🍌', key: 'roomTempFruits',
    labels: { en: 'Fruits (room temp)', ru: 'Фрукты (не требуют холода)', uk: 'Фрукти (без холоду)', lv: 'Augļi (istabas temp.)' },
    items: [
      p('🍌', 'bananas', 'Bananas', 'Бананы', 'Банани', 'Banāni', 'pantry', 'pcs', 5),
      p('🍊', 'oranges', 'Oranges', 'Апельсины', 'Апельсини', 'Apelsīni', 'pantry', 'pcs', 3),
      p('🍊', 'tangerines', 'Tangerines', 'Мандарины', 'Мандарини', 'Mandarīni', 'pantry', 'pcs', 5),
      p('🍋', 'lemons', 'Lemons', 'Лимоны', 'Лимони', 'Citroni', 'pantry', 'pcs', 2),
      p('🍋', 'limes', 'Limes', 'Лаймы', 'Лайми', 'Laimi', 'pantry', 'pcs', 2),
      p('🍊', 'grapefruit', 'Grapefruit', 'Грейпфрут', 'Грейпфрут', 'Greipfrūts', 'pantry', 'pcs', 1),
      p('🥭', 'mango', 'Mango', 'Манго', 'Манго', 'Mango', 'pantry', 'pcs', 1),
      p('🟡', 'papaya', 'Papaya', 'Папайя', 'Папайя', 'Papaija', 'pantry', 'pcs', 1),
      p('🥑', 'avocadoHard', 'Avocado (hard)', 'Авокадо (твёрдый)', 'Авокадо (твердий)', 'Avokado (ciets)', 'pantry', 'pcs', 1),
      p('🍍', 'pineapple', 'Pineapple', 'Ананас', 'Ананас', 'Ananass', 'pantry', 'pcs', 1),
      p('🥥', 'coconut', 'Coconut', 'Кокос', 'Кокос', 'Kokosrieksts', 'pantry', 'pcs', 1),
      p('🟠', 'persimmon', 'Persimmon', 'Хурма', 'Хурма', 'Hurma', 'pantry', 'pcs', 2),
    ],
  },
  {
    emoji: '🍞', key: 'breadBakery',
    labels: { en: 'Bread & bakery', ru: 'Хлеб и выпечка', uk: 'Хліб та випічка', lv: 'Maize un konditorejas izstrādājumi' },
    items: [
      p('🍞', 'whiteBread', 'White bread', 'Хлеб белый', 'Хліб білий', 'Baltmaize', 'pantry', 'pcs', 1),
      p('🍞', 'blackBread', 'Black bread', 'Хлеб чёрный', 'Хліб чорний', 'Rupjmaize', 'pantry', 'pcs', 1),
      p('🍞', 'grainBread', 'Grain bread', 'Хлеб зерновой', 'Хліб зерновий', 'Graudu maize', 'pantry', 'pcs', 1),
      p('🥖', 'baguette', 'Baguette', 'Багет', 'Багет', 'Bagete', 'pantry', 'pcs', 1),
      p('🫓', 'lavash', 'Lavash', 'Лаваш', 'Лаваш', 'Lavašs', 'pantry', 'pcs', 1),
      p('🫓', 'pita', 'Pita', 'Питта', 'Піта', 'Pita', 'pantry', 'pcs', 1),
      p('🫓', 'flatbread', 'Flatbread', 'Лепёшки', 'Коржі', 'Plāceņi', 'pantry', 'pcs', 2),
      p('🍘', 'crispbread', 'Crispbread', 'Хлебцы', 'Хлібці', 'Hrustīkļi', 'pantry', 'pcs', 1),
      p('🍘', 'croutons', 'Croutons', 'Сухари', 'Сухарі', 'Grauzdiņi', 'pantry', 'pcs', 1),
      p('🥣', 'oatFlakes', 'Oat flakes', 'Хлопья овсяные', 'Пластівці вівсяні', 'Auzu pārslas', 'pantry', 'kg', 0.5),
    ],
  },
];

// ============ FREEZER ============
export const FREEZER_CATEGORIES: QuickCategory[] = [
  {
    emoji: '🧊', key: 'frozenMeat',
    labels: { en: 'Meat & poultry (frozen)', ru: 'Мясо и птица (замороженные)', uk: 'М\'ясо та птиця (заморожені)', lv: 'Gaļa un mājputni (saldēti)' },
    items: [
      p('🍗', 'frozenChickenBreast', 'Frozen chicken breast', 'Куриная грудка замор.', 'Куряча грудка замор.', 'Sald. vistas krūtiņa', 'freezer', 'g', 500),
      p('🍗', 'frozenChickenThighs', 'Frozen chicken thighs', 'Куриные бёдра замор.', 'Курячі стегна замор.', 'Sald. vistas šķiņķi', 'freezer', 'g', 500),
      p('🥩', 'frozenBeefMince', 'Frozen beef mince', 'Фарш говяжий замор.', 'Фарш яловичий замор.', 'Sald. liellopu maltā gaļa', 'freezer', 'g', 500),
      p('🥩', 'frozenPorkMince', 'Frozen pork mince', 'Фарш свиной замор.', 'Фарш свинячий замор.', 'Sald. cūkgaļas maltā gaļa', 'freezer', 'g', 500),
      p('🥩', 'frozenSteak', 'Frozen steak', 'Стейк замор.', 'Стейк замор.', 'Saldēts steiks', 'freezer', 'g', 500),
      p('🥘', 'frozenCutlets', 'Frozen cutlets', 'Котлеты замор. (п/ф)', 'Котлети замор. (н/ф)', 'Sald. kotletes', 'freezer', 'pcs', 5),
      p('🍗', 'frozenDrumstick', 'Frozen drumstick', 'Голень куриная замор.', 'Гомілка куряча замор.', 'Sald. vistas kājiņas', 'freezer', 'g', 500),
      p('🍗', 'frozenTurkey', 'Frozen turkey', 'Индейка замор.', 'Індичка замор.', 'Saldēta tītara gaļa', 'freezer', 'g', 500),
    ],
  },
  {
    emoji: '🐟', key: 'frozenFish',
    labels: { en: 'Fish (frozen)', ru: 'Рыба (замороженная)', uk: 'Риба (заморожена)', lv: 'Zivis (saldētas)' },
    items: [
      p('🐟', 'frozenSalmon', 'Frozen salmon', 'Лосось замор.', 'Лосось замор.', 'Saldēts lasis', 'freezer', 'g', 500),
      p('🐟', 'frozenCod', 'Frozen cod', 'Треска замор.', 'Тріска замор.', 'Saldēta menca', 'freezer', 'g', 500),
      p('🐟', 'frozenPollock', 'Frozen pollock', 'Минтай замор.', 'Мінтай замор.', 'Saldēts mintajs', 'freezer', 'g', 500),
      p('🐟', 'frozenHake', 'Frozen hake', 'Хек замор.', 'Хек замор.', 'Saldēts heks', 'freezer', 'g', 500),
      p('🐟', 'frozenMackerel', 'Frozen mackerel', 'Скумбрия замор.', 'Скумбрія замор.', 'Saldēta skumbrija', 'freezer', 'g', 500),
      p('🐟', 'frozenTrout', 'Frozen trout', 'Форель замор.', 'Форель замор.', 'Saldēta forele', 'freezer', 'g', 500),
      p('🦐', 'seafoodMix', 'Seafood mix', 'Морской коктейль', 'Морський коктейль', 'Jūras velšu maisījums', 'freezer', 'g', 400),
      p('🦐', 'frozenShrimp', 'Frozen shrimp', 'Креветки замор.', 'Креветки замор.', 'Saldētas garneles', 'freezer', 'g', 400),
      p('🦑', 'frozenSquid', 'Frozen squid', 'Кальмар замор.', 'Кальмар замор.', 'Saldēts kalmārs', 'freezer', 'g', 400),
      p('🦪', 'frozenMussels', 'Frozen mussels', 'Мидии замор.', 'Мідії замор.', 'Saldētas mīdijas', 'freezer', 'g', 400),
    ],
  },
  {
    emoji: '🥟', key: 'semiFinished',
    labels: { en: 'Semi-finished products', ru: 'Полуфабрикаты', uk: 'Напівфабрикати', lv: 'Pusfabrikāti' },
    items: [
      p('🥟', 'pelmeni', 'Pelmeni', 'Пельмени', 'Пельмені', 'Pelmeņi', 'freezer', 'g', 500),
      p('🥟', 'varenykyPotato', 'Vareniki (potato)', 'Вареники с картошкой', 'Вареники з картоплею', 'Vareņiki ar kartupeļiem', 'freezer', 'g', 500),
      p('🥟', 'varenykyCheese', 'Vareniki (cottage cheese)', 'Вареники с творогом', 'Вареники з сиром', 'Vareņiki ar biezpienu', 'freezer', 'g', 500),
      p('🥟', 'varenykyCherry', 'Vareniki (cherry)', 'Вареники с вишней', 'Вареники з вишнею', 'Vareņiki ar ķiršiem', 'freezer', 'g', 500),
      p('🥟', 'manti', 'Manti', 'Манты', 'Манти', 'Manti', 'freezer', 'g', 500),
      p('🥟', 'khinkali', 'Khinkali', 'Хинкали', 'Хінкалі', 'Hinkali', 'freezer', 'g', 500),
      p('🥡', 'blinchikyMeat', 'Crepes (meat)', 'Блинчики с мясом', 'Млинці з м\'ясом', 'Pankūkas ar gaļu', 'freezer', 'pcs', 5),
      p('🥡', 'blinchikyCheese', 'Crepes (cottage cheese)', 'Блинчики с творогом', 'Млинці з сиром', 'Pankūkas ar biezpienu', 'freezer', 'pcs', 5),
      p('🥟', 'samsa', 'Samsa', 'Самса', 'Самса', 'Samsa', 'freezer', 'pcs', 3),
      p('🥬', 'frozenCabbage', 'Frozen cabbage rolls', 'Голубцы замор.', 'Голубці замор.', 'Saldēti kāpostu tīteņi', 'freezer', 'pcs', 5),
      p('🥘', 'homeCutlets', 'Homemade cutlets (frozen)', 'Котлеты домашние замор.', 'Котлети домашні замор.', 'Mājas kotletes (sald.)', 'freezer', 'pcs', 5),
      p('🥘', 'meatballs', 'Meatballs', 'Фрикадельки', 'Фрикадельки', 'Gaļas bumbiņas', 'freezer', 'pcs', 10),
      p('🍗', 'nuggets', 'Nuggets', 'Наггетсы', 'Нагетси', 'Nageti', 'freezer', 'g', 400),
      p('🌭', 'frozenSausages', 'Frozen sausages', 'Сосиски замор.', 'Сосиски замор.', 'Saldētas cīsiņi', 'freezer', 'pcs', 6),
      p('🍕', 'frozenPizza', 'Frozen pizza', 'Пицца замороженная', 'Піца заморожена', 'Saldēta pica', 'freezer', 'pcs', 1),
      p('🥞', 'frozenPancakes', 'Frozen pancakes', 'Блины замор.', 'Млинці замор.', 'Saldētas pankūkas', 'freezer', 'pcs', 5),
    ],
  },
  {
    emoji: '🥦', key: 'frozenVegetables',
    labels: { en: 'Frozen vegetables', ru: 'Овощи замороженные', uk: 'Овочі заморожені', lv: 'Saldēti dārzeņi' },
    items: [
      p('🟢', 'frozenPeas', 'Frozen peas', 'Горошек замор.', 'Горошок замор.', 'Saldēti zirņi', 'freezer', 'g', 400),
      p('🌽', 'frozenCorn', 'Frozen corn', 'Кукуруза замор.', 'Кукурудза замор.', 'Saldēta kukurūza', 'freezer', 'g', 400),
      p('🥦', 'frozenBroccoli', 'Frozen broccoli', 'Брокколи замор.', 'Броколі замор.', 'Saldēti brokoļi', 'freezer', 'g', 400),
      p('🥦', 'frozenCauliflower', 'Frozen cauliflower', 'Цветная капуста замор.', 'Цвітна капуста замор.', 'Saldēts ziedkāposts', 'freezer', 'g', 400),
      p('🫛', 'frozenGreenBeans', 'Frozen green beans', 'Стручковая фасоль замор.', 'Стручкова квасоля замор.', 'Saldētas zaļās pupiņas', 'freezer', 'g', 400),
      p('🥬', 'frozenSpinach', 'Frozen spinach', 'Шпинат замор.', 'Шпинат замор.', 'Saldēti spināti', 'freezer', 'g', 400),
      p('🥗', 'vegMix', 'Vegetable mix', 'Смесь овощная', 'Суміш овочева', 'Dārzeņu maisījums', 'freezer', 'g', 400),
      p('🫑', 'frozenPaprika', 'Frozen paprika', 'Паприка замор.', 'Паприка замор.', 'Saldēta paprika', 'freezer', 'g', 400),
      p('🥕', 'frozenCarrots', 'Frozen carrots', 'Морковь замор.', 'Морква замор.', 'Saldēti burkāni', 'freezer', 'g', 400),
      p('🍟', 'frenchFries', 'French fries', 'Картофель фри', 'Картопля фрі', 'Frī kartupeļi', 'freezer', 'g', 500),
      p('🥔', 'frozenPotatoWedges', 'Frozen potato wedges', 'Картофель дольками замор.', 'Картопля часточками замор.', 'Saldēti kartupeļu daiviņas', 'freezer', 'g', 500),
    ],
  },
  {
    emoji: '🍓', key: 'frozenBerries',
    labels: { en: 'Frozen berries & fruits', ru: 'Ягоды и фрукты замороженные', uk: 'Ягоди та фрукти заморожені', lv: 'Saldētas ogas un augļi' },
    items: [
      p('🍓', 'frozenStrawberry', 'Frozen strawberries', 'Клубника замор.', 'Полуниця замор.', 'Saldētas zemenes', 'freezer', 'g', 300),
      p('🫐', 'frozenRaspberry', 'Frozen raspberries', 'Малина замор.', 'Малина замор.', 'Saldētas avenes', 'freezer', 'g', 300),
      p('🫐', 'frozenBlueberry', 'Frozen blueberries', 'Черника замор.', 'Чорниця замор.', 'Saldētas mellenes', 'freezer', 'g', 300),
      p('🍒', 'frozenCherry', 'Frozen cherries', 'Вишня замор.', 'Вишня замор.', 'Saldēti ķirši', 'freezer', 'g', 300),
      p('🫐', 'frozenCurrant', 'Frozen currants', 'Смородина замор.', 'Смородина замор.', 'Saldētas jāņogas', 'freezer', 'g', 300),
      p('🫐', 'frozenBlackberry', 'Frozen blackberries', 'Ежевика замор.', 'Ожина замор.', 'Saldētas kazenes', 'freezer', 'g', 300),
      p('🫐', 'forestBerryMix', 'Forest berry mix', 'Смесь лесных ягод', 'Суміш лісових ягід', 'Meža ogu maisījums', 'freezer', 'g', 300),
      p('🥭', 'frozenMango', 'Frozen mango', 'Манго замор.', 'Манго замор.', 'Saldēts mango', 'freezer', 'g', 300),
      p('🍌', 'frozenBanana', 'Frozen bananas', 'Бананы замор.', 'Банани замор.', 'Saldēti banāni', 'freezer', 'g', 300),
    ],
  },
  {
    emoji: '🍦', key: 'frozenReady',
    labels: { en: 'Frozen ready food', ru: 'Готовая еда замороженная', uk: 'Готова їжа заморожена', lv: 'Saldēts gatavs ēdiens' },
    items: [
      p('🍲', 'frozenSoup', 'Frozen soup (homemade)', 'Суп замороженный (домашний)', 'Суп заморожений (домашній)', 'Saldēta zupa (mājas)', 'freezer', 'pcs', 1),
      p('🍲', 'frozenBorscht', 'Frozen borscht', 'Борщ замороженный', 'Борщ заморожений', 'Saldēts borščs', 'freezer', 'pcs', 1),
      p('🍝', 'frozenBolognese', 'Frozen bolognese sauce', 'Соус болоньезе замор.', 'Соус болоньєзе замор.', 'Saldēta boloņezes mērce', 'freezer', 'pcs', 1),
      p('🫙', 'homePreserves', 'Home preserves', 'Домашние заготовки', 'Домашні заготівки', 'Mājas sagataves', 'freezer', 'pcs', 1),
      p('🍲', 'frozenBroth', 'Frozen broth', 'Бульон замор.', 'Бульйон замор.', 'Saldēts buljons', 'freezer', 'pcs', 1),
    ],
  },
  {
    emoji: '🧁', key: 'frozenBakery',
    labels: { en: 'Frozen bakery', ru: 'Выпечка замороженная', uk: 'Випічка заморожена', lv: 'Saldēta maize un konditorejas' },
    items: [
      p('🧁', 'puffPastry', 'Puff pastry', 'Слоёное тесто', 'Листкове тісто', 'Kārtainā mīkla', 'freezer', 'pcs', 1),
      p('🧁', 'yeastDough', 'Yeast dough', 'Дрожжевое тесто', 'Дріжджове тісто', 'Rauga mīkla', 'freezer', 'pcs', 1),
      p('🥐', 'frozenCroissants', 'Frozen croissants', 'Круассаны замор.', 'Круасани замор.', 'Saldēti kruasāni', 'freezer', 'pcs', 3),
      p('🥧', 'frozenPies', 'Frozen pies', 'Пирожки замор.', 'Пиріжки замор.', 'Saldēti pīrādziņi', 'freezer', 'pcs', 5),
    ],
  },
];

// Helper to get categories for a specific location
export const getCategoriesForLocation = (location: string): QuickCategory[] => {
  switch (location) {
    case 'fridge': return FRIDGE_CATEGORIES;
    case 'pantry': return PANTRY_CATEGORIES;
    case 'freezer': return FREEZER_CATEGORIES;
    default: return FRIDGE_CATEGORIES;
  }
};

// Get ALL products across all locations (for search)
export const getAllProducts = (): (QuickProduct & { categoryKey: string; categoryLabels: Record<string, string> })[] => {
  const result: (QuickProduct & { categoryKey: string; categoryLabels: Record<string, string> })[] = [];
  const allCats = [...FRIDGE_CATEGORIES, ...PANTRY_CATEGORIES, ...FREEZER_CATEGORIES];
  for (const cat of allCats) {
    for (const item of cat.items) {
      result.push({ ...item, categoryKey: cat.key, categoryLabels: cat.labels });
    }
  }
  return result;
};

// Location labels for i18n
export const LOCATION_LABELS: Record<string, Record<string, string>> = {
  fridge: { en: 'Fridge', ru: 'Холодильник', uk: 'Холодильник', lv: 'Ledusskapis' },
  pantry: { en: 'Pantry', ru: 'Кладовая', uk: 'Комора', lv: 'Pieliekamais' },
  freezer: { en: 'Freezer', ru: 'Морозилка', uk: 'Морозилка', lv: 'Saldētava' },
};

export const LOCATION_EMOJIS: Record<string, string> = {
  fridge: '🧊',
  pantry: '🏠',
  freezer: '❄️',
};

// Smart suggestion i18n
export const SMART_SUGGESTION_TEXTS: Record<string, {
  message: (itemName: string, suggestedLocation: string) => string;
  yes: string;
  no: string;
}> = {
  en: {
    message: (name, loc) => `${name} is usually stored in the ${loc}. Move it there?`,
    yes: `Yes, move`,
    no: `Keep here`,
  },
  ru: {
    message: (name, loc) => `${name} обычно хранится в: ${loc}. Переложить туда?`,
    yes: `Да, переложить`,
    no: `Оставить здесь`,
  },
  uk: {
    message: (name, loc) => `${name} зазвичай зберігається в: ${loc}. Перемістити туди?`,
    yes: `Так, перемістити`,
    no: `Залишити тут`,
  },
  lv: {
    message: (name, loc) => `${name} parasti glabā: ${loc}. Pārvietot tur?`,
    yes: `Jā, pārvietot`,
    no: `Atstāt šeit`,
  },
};
