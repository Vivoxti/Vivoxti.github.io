// ===== Мой Город — переводы (RU / EN / UA) =====
// RU — язык по умолчанию, тексты RU берутся прямо из data.js (name/desc/text).
// Здесь хранятся только переводы для EN и UA плюс общие UI-строки для всех трёх.

var LANGS = ['ru', 'en', 'ua'];
var LANG_LABELS = { ru: 'RU', en: 'EN', ua: 'UA' };

var UI_TEXT = {
  ru: {
    appTitle: 'Мой Город — тапай и живи!',
    tapAriaLabel: 'Тапни, чтобы заработать',
    lifeBadgeTitle: 'Уровень жизни',
    tabTap: 'Тапать',
    tabCity: 'Город',
    tabTasks: 'Задания',
    tabProfile: 'Профиль',
    levelShort: 'Ур. {n}',
    perSecSuffix: ' ₽/сек',
    perTap: '+{n} ₽ за тап',
    upgradeTitle: '💪 Прокачать тап',
    upgradeDesc: '+{n} ₽ к тапу',
    boostChip: '🔥 x{mult} — {sec} сек',
    taskDoneHint: '✅ Задание готово! <b>Забери награду во вкладке «Задания»</b>',
    taskHint: '🎯 {text} <b>({cur}/{goal})</b>',
    cityHint: '🖐️ Тяни карту, тапай по зданиям',
    buildingLock: '🔒 Ур. {n}',
    homeMarker: '🏠 Твой дом: {name}',
    lockedToast: '🔒 «{name}» откроется на {n} уровне!',
    tagLife: '+{n} 🌟 жизнь',
    tagTap: '+{n} ₽/тап',
    tagIncome: '+{n} ₽/сек',
    tagBoost: '🔥 x{mult} на {sec} сек',
    tagXp: '+{n} XP',
    ownedItem: '✅ Куплено',
    ownedHome: '🏠 Живёшь тут',
    ownedLower: '⬇️ Уже было',
    ownedTransport: '🚗 Твой',
    buySuccessToast: '{emoji} {name} — куплено!',
    buyFailToast: '😕 Не хватает денег — иди тапай!',
    upgradeSuccessToast: '💪 Тап прокачан!',
    tasksTitle: '📋 Задания',
    tasksAllDone: '🏆 Основные задания выполнены! Дальше — бонусные.',
    taskClaimBtn: '🎁 Забрать награду!',
    taskNotDoneBtn: 'Выполни задание',
    tasksCompletedCount: 'Выполнено заданий: <b>{n}</b>',
    claimToast: '🎉 Награда: +{money} ₽, +{xp} XP',
    previewPrefix: '🔜 ',
    profileLifeLevel: '🌟 Уровень жизни: {n}',
    tierNext: 'До «{name}»: ещё {n} 🌟',
    tierMax: '👑 Ты достиг вершины!',
    howYouLive: '🏠 Как ты живёшь',
    labelHome: 'ЖИЛЬЁ',
    labelTransport: 'ТРАНСПОРТ',
    onFoot: 'Пешком',
    yourStuff: '🎒 Твои вещи',
    emptyStuff: 'Пока пусто — иди по магазинам!',
    statsTitle: '📊 Статистика',
    statTaps: '👆 Тапов сделано: <b>{n}</b>',
    statEarned: '💰 Всего заработано: <b>{n} ₽</b>',
    statSpent: '🛍️ Всего потрачено: <b>{n} ₽</b>',
    statPurchases: '📦 Покупок: <b>{n}</b>',
    statTasks: '✅ Заданий выполнено: <b>{n}</b>',
    soundOff: '🔇 Звук выкл',
    soundOn: '🔊 Звук вкл',
    resetBtn: '🗑️ Начать заново',
    resetConfirm: 'Точно начать игру заново? Весь прогресс удалится!',
    languageTitle: '🌐 Язык',
    levelUpDefaultText: 'Ты стал круче!',
    levelUpUnlocked: 'Открылось: {list}. Загляни в город!',
    levelUpTitle: 'Уровень {n}!',
    levelUpBtn: 'Ура!',
    victoryTitle: 'ТЫ — ЛЕГЕНДА ГОРОДА!',
    victoryText: 'Весь город теперь твой! Ты прошёл путь от комнаты в коммуналке до хозяина города. Игра пройдена, но можно продолжать играть!',
    victoryBtn: 'Я — легенда! 👑',
    offlineTitle: 'Пока тебя не было...',
    offlineText: 'Твои бизнесы работали <b>{time}</b> и заработали <b>{gain} ₽</b>!',
    offlineBtn: 'Забрать деньги 💰',
    bonusTask: 'Бонус-задание: сделай ещё {n} тапов',
  },
  en: {
    appTitle: 'My City — tap and live!',
    tapAriaLabel: 'Tap to earn',
    lifeBadgeTitle: 'Life level',
    tabTap: 'Tap',
    tabCity: 'City',
    tabTasks: 'Tasks',
    tabProfile: 'Profile',
    levelShort: 'Lv. {n}',
    perSecSuffix: ' ₽/sec',
    perTap: '+{n} ₽ per tap',
    upgradeTitle: '💪 Upgrade tap',
    upgradeDesc: '+{n} ₽ per tap',
    boostChip: '🔥 x{mult} — {sec} sec',
    taskDoneHint: '✅ Task complete! <b>Claim your reward on the "Tasks" tab</b>',
    taskHint: '🎯 {text} <b>({cur}/{goal})</b>',
    cityHint: '🖐️ Drag the map, tap the buildings',
    buildingLock: '🔒 Lv. {n}',
    homeMarker: '🏠 Your home: {name}',
    lockedToast: '🔒 "{name}" unlocks at level {n}!',
    tagLife: '+{n} 🌟 life',
    tagTap: '+{n} ₽/tap',
    tagIncome: '+{n} ₽/sec',
    tagBoost: '🔥 x{mult} for {sec} sec',
    tagXp: '+{n} XP',
    ownedItem: '✅ Bought',
    ownedHome: '🏠 You live here',
    ownedLower: '⬇️ Already had better',
    ownedTransport: '🚗 Yours',
    buySuccessToast: '{emoji} {name} — bought!',
    buyFailToast: '😕 Not enough money — go tap!',
    upgradeSuccessToast: '💪 Tap upgraded!',
    tasksTitle: '📋 Tasks',
    tasksAllDone: '🏆 Main tasks complete! Bonus tasks ahead.',
    taskClaimBtn: '🎁 Claim reward!',
    taskNotDoneBtn: 'Complete the task',
    tasksCompletedCount: 'Tasks completed: <b>{n}</b>',
    claimToast: '🎉 Reward: +{money} ₽, +{xp} XP',
    previewPrefix: '🔜 ',
    profileLifeLevel: '🌟 Life level: {n}',
    tierNext: 'To "{name}": {n} 🌟 to go',
    tierMax: '👑 You reached the top!',
    howYouLive: '🏠 How you live',
    labelHome: 'HOME',
    labelTransport: 'TRANSPORT',
    onFoot: 'On foot',
    yourStuff: '🎒 Your stuff',
    emptyStuff: 'Still empty — go shopping!',
    statsTitle: '📊 Stats',
    statTaps: '👆 Taps made: <b>{n}</b>',
    statEarned: '💰 Total earned: <b>{n} ₽</b>',
    statSpent: '🛍️ Total spent: <b>{n} ₽</b>',
    statPurchases: '📦 Purchases: <b>{n}</b>',
    statTasks: '✅ Tasks completed: <b>{n}</b>',
    soundOff: '🔇 Sound off',
    soundOn: '🔊 Sound on',
    resetBtn: '🗑️ Start over',
    resetConfirm: 'Really start over? All progress will be lost!',
    languageTitle: '🌐 Language',
    levelUpDefaultText: 'You leveled up!',
    levelUpUnlocked: 'Unlocked: {list}. Check out the city!',
    levelUpTitle: 'Level {n}!',
    levelUpBtn: 'Yeah!',
    victoryTitle: 'YOU ARE THE CITY LEGEND!',
    victoryText: 'The whole city is yours now! You went from a room in a shared flat to owning the city. The game is complete, but you can keep playing!',
    victoryBtn: "I'm a legend! 👑",
    offlineTitle: 'While you were away...',
    offlineText: 'Your businesses worked for <b>{time}</b> and earned <b>{gain} ₽</b>!',
    offlineBtn: 'Collect money 💰',
    bonusTask: 'Bonus task: make {n} more taps',
  },
  ua: {
    appTitle: 'Моє Місто — тапай і живи!',
    tapAriaLabel: 'Тапни, щоб заробити',
    lifeBadgeTitle: 'Рівень життя',
    tabTap: 'Тапати',
    tabCity: 'Місто',
    tabTasks: 'Завдання',
    tabProfile: 'Профіль',
    levelShort: 'Рів. {n}',
    perSecSuffix: ' ₽/сек',
    perTap: '+{n} ₽ за тап',
    upgradeTitle: '💪 Прокачати тап',
    upgradeDesc: '+{n} ₽ до тапу',
    boostChip: '🔥 x{mult} — {sec} сек',
    taskDoneHint: '✅ Завдання готове! <b>Забери нагороду на вкладці «Завдання»</b>',
    taskHint: '🎯 {text} <b>({cur}/{goal})</b>',
    cityHint: '🖐️ Тягни карту, тапай по будівлях',
    buildingLock: '🔒 Рів. {n}',
    homeMarker: '🏠 Твій дім: {name}',
    lockedToast: '🔒 «{name}» відкриється на {n} рівні!',
    tagLife: '+{n} 🌟 життя',
    tagTap: '+{n} ₽/тап',
    tagIncome: '+{n} ₽/сек',
    tagBoost: '🔥 x{mult} на {sec} сек',
    tagXp: '+{n} XP',
    ownedItem: '✅ Куплено',
    ownedHome: '🏠 Живеш тут',
    ownedLower: '⬇️ Вже було',
    ownedTransport: '🚗 Твій',
    buySuccessToast: '{emoji} {name} — куплено!',
    buyFailToast: '😕 Не вистачає грошей — іди тапай!',
    upgradeSuccessToast: '💪 Тап прокачано!',
    tasksTitle: '📋 Завдання',
    tasksAllDone: '🏆 Основні завдання виконано! Далі — бонусні.',
    taskClaimBtn: '🎁 Забрати нагороду!',
    taskNotDoneBtn: 'Виконай завдання',
    tasksCompletedCount: 'Виконано завдань: <b>{n}</b>',
    claimToast: '🎉 Нагорода: +{money} ₽, +{xp} XP',
    previewPrefix: '🔜 ',
    profileLifeLevel: '🌟 Рівень життя: {n}',
    tierNext: 'До «{name}»: ще {n} 🌟',
    tierMax: '👑 Ти досяг вершини!',
    howYouLive: '🏠 Як ти живеш',
    labelHome: 'ЖИТЛО',
    labelTransport: 'ТРАНСПОРТ',
    onFoot: 'Пішки',
    yourStuff: '🎒 Твої речі',
    emptyStuff: 'Поки що порожньо — іди по магазинах!',
    statsTitle: '📊 Статистика',
    statTaps: '👆 Тапів зроблено: <b>{n}</b>',
    statEarned: '💰 Всього зароблено: <b>{n} ₽</b>',
    statSpent: '🛍️ Всього витрачено: <b>{n} ₽</b>',
    statPurchases: '📦 Покупок: <b>{n}</b>',
    statTasks: '✅ Завдань виконано: <b>{n}</b>',
    soundOff: '🔇 Звук вимк.',
    soundOn: '🔊 Звук увімк.',
    resetBtn: '🗑️ Почати заново',
    resetConfirm: 'Точно почати гру заново? Весь прогрес видалиться!',
    languageTitle: '🌐 Мова',
    levelUpDefaultText: 'Ти став крутішим!',
    levelUpUnlocked: 'Відкрилось: {list}. Загляни в місто!',
    levelUpTitle: 'Рівень {n}!',
    levelUpBtn: 'Ура!',
    victoryTitle: 'ТИ — ЛЕГЕНДА МІСТА!',
    victoryText: 'Все місто тепер твоє! Ти пройшов шлях від кімнати в комуналці до господаря міста. Гру пройдено, але можна продовжувати грати!',
    victoryBtn: 'Я — легенда! 👑',
    offlineTitle: 'Поки тебе не було...',
    offlineText: 'Твої бізнеси працювали <b>{time}</b> і заробили <b>{gain} ₽</b>!',
    offlineBtn: 'Забрати гроші 💰',
    bonusTask: 'Бонусне завдання: зроби ще {n} тапів',
  },
};

// Переводы данных, привязанные к id из data.js (RU берётся из самих объектов).
var BUILDING_TEXT = {
  en: {
    kiosk: { name: "Ashot's Kiosk", desc: 'A snack gives XP and speeds up earning!' },
    market: { name: 'Basket Supermarket', desc: 'Groceries and handy stuff for home.' },
    cafe: { name: '"Bun" Café', desc: 'Eat well — tap happier!' },
    clothes: { name: '"Style" Shop', desc: 'Dress cooler — live better.' },
    tech: { name: '"Gigabyte" Tech Store', desc: 'Gadgets boost your earnings per tap!' },
    gym: { name: '"Gym" Fitness Club', desc: 'Health is a life level too!' },
    cars: { name: '"Wheel" Car Dealership', desc: 'From a scooter to a limo — the whole road is yours.' },
    restaurant: { name: '"Lux" Restaurant', desc: 'Expensive food — powerful boosts and tons of XP.' },
    realty: { name: '"Cozy" Real Estate', desc: 'Your own home — the main step to a cool life!' },
    jewelry: { name: '"Shine" Jewelry', desc: 'Sparkle like a real tycoon.' },
    business: { name: '"Empire" Business Center', desc: "Businesses make money on their own — even while you're not tapping!" },
    airport: { name: '"Takeoff" Airport', desc: 'Travel — a sea of memories, XP and life level!' },
    tower: { name: '"City Crown" Tower', desc: 'The peak of the city. Become its legend!' },
  },
  ua: {
    kiosk: { name: 'Кіоск «У Ашота»', desc: 'Перекус дає досвід і прискорює заробіток!' },
    market: { name: 'Супермаркет «Кошик»', desc: 'Продукти та корисні речі для дому.' },
    cafe: { name: 'Кафе «Плюшка»', desc: 'Смачно поїсти — і тапається веселіше!' },
    clothes: { name: 'Магазин «Стиль»', desc: 'Одягайся крутіше — живи краще.' },
    tech: { name: 'Техніка «Гігабайт»', desc: 'Гаджети дають бонус до заробітку за тап!' },
    gym: { name: 'Фітнес «Качалка»', desc: "Здоров'я — теж рівень життя!" },
    cars: { name: 'Автосалон «Колесо»', desc: 'Від самоката до лімузина — вся дорога твоя.' },
    restaurant: { name: 'Ресторан «Люкс»', desc: 'Дорога їжа — потужні бустери і купа досвіду.' },
    realty: { name: 'Нерухомість «Затишок»', desc: 'Своє житло — головний крок до крутого життя!' },
    jewelry: { name: 'Ювелірний «Блиск»', desc: 'Сяй, як справжній багатій.' },
    business: { name: 'Бізнес-центр «Імперія»', desc: 'Бізнеси приносять гроші самі — навіть коли ти не тапаєш!' },
    airport: { name: 'Аеропорт «Зліт»', desc: 'Подорожі — море вражень, досвіду і рівня життя!' },
    tower: { name: 'Хмарочос «Корона міста»', desc: 'Вершина міста. Стань його легендою!' },
  },
};

var ITEM_TEXT = {
  en: {
    gum: 'Gum', soda: 'Soda', shawa: 'Shawarma', energy: 'Energy Drink',
    coffee2go: 'Coffee to Go', cake: 'Cake', cooker: 'Multicooker', tv: 'TV', robot: 'Robot Vacuum',
    cappu: 'Cappuccino', lunch: 'Business Lunch', desert: 'Cheesecake', pizza: 'Party Pizza',
    tshirt: 'T-Shirt', jeans: 'Jeans', sneakers: 'Sneakers', jacket: 'Cool Jacket', suit: 'Business Suit',
    buds: 'Earbuds', watch: 'Smart Watch', phone: 'Smartphone', laptop: 'Laptop', gampc: 'Gaming PC',
    workout: 'Workout', abon: 'Yearly Pass', trainer: 'Personal Trainer', pool: 'VIP Pool',
    scooter: 'Kick Scooter', bike: 'Bicycle', lada: '"Lada"', sedan: 'Cool Sedan', sport: 'Sports Car', limo: 'Limousine',
    steak: 'Steak Dinner', tasting: "Chef's Tasting", banquet: 'Banquet with Friends',
    studio: 'Studio', flat1: 'Downtown One-Bedroom', flat2: 'Renovated Two-Bedroom', cottage: 'Cottage', penthouse: 'Penthouse',
    chain: 'Silver Chain', goldwatch: 'Gold Watch', ring: 'Ruby Ring', diamond: 'Diamond',
    coffeeshop: 'Own Coffee Shop', carwash: 'Car Wash', shopbiz: 'Store Chain', startup: 'IT Startup',
    sochi: 'Trip to Sochi', turkey: 'Vacation in Turkey', paris: 'Weekend in Paris', maldives: 'Maldives', space: 'Space Flight',
    office50: '50th Floor Office', heli: 'Helipad', city: 'Buy the Whole City',
  },
  ua: {
    gum: 'Жуйка', soda: 'Газована вода', shawa: 'Шаурма', energy: 'Енергетик',
    coffee2go: 'Кава з собою', cake: 'Торт', cooker: 'Мультиварка', tv: 'Телевізор', robot: 'Робот-пилосос',
    cappu: 'Капучино', lunch: 'Бізнес-ланч', desert: 'Чізкейк', pizza: 'Піца на компанію',
    tshirt: 'Футболка', jeans: 'Джинси', sneakers: 'Кросівки', jacket: 'Крута куртка', suit: 'Діловий костюм',
    buds: 'Навушники', watch: 'Смарт-годинник', phone: 'Смартфон', laptop: 'Ноутбук', gampc: 'Ігровий ПК',
    workout: 'Тренування', abon: 'Абонемент на рік', trainer: 'Особистий тренер', pool: 'Басейн VIP',
    scooter: 'Самокат', bike: 'Велосипед', lada: '«Жигулі»', sedan: 'Крутий седан', sport: 'Спорткар', limo: 'Лімузин',
    steak: 'Стейк-вечеря', tasting: 'Дегустація шефа', banquet: 'Банкет з друзями',
    studio: 'Студія', flat1: 'Однушка в центрі', flat2: 'Двушка з ремонтом', cottage: 'Котедж', penthouse: 'Пентхаус',
    chain: 'Срібний ланцюжок', goldwatch: 'Золотий годинник', ring: 'Перстень з рубіном', diamond: 'Діамант',
    coffeeshop: "Своя кав'ярня", carwash: 'Автомийка', shopbiz: 'Мережа магазинів', startup: 'IT-стартап',
    sochi: 'Поїздка в Сочі', turkey: 'Відпочинок в Туреччині', paris: 'Вікенд у Парижі', maldives: 'Мальдіви', space: 'Політ у космос',
    office50: 'Офіс на 50 поверсі', heli: 'Вертолітний майданчик', city: 'Купити все місто',
  },
};

// Индексы совпадают с порядком элементов в TASKS (data.js).
var TASK_TEXT = {
  en: [
    'Warm up your finger: make 30 taps',
    'Earn a total of 300 ₽',
    "Buy a snack at Ashot's Kiosk",
    'Make 100 taps',
    'Upgrade your tap 2 times',
    'Reach level 3',
    'Buy something at the supermarket',
    'Buy sneakers at "Style"',
    'Earn a total of 5,000 ₽',
    'Grab a bite at "Bun" Café',
    'Reach level 5',
    'Buy a smartphone',
    'Make 500 taps',
    'Visit the gym',
    'Reach level 8',
    'Buy your first vehicle',
    'Spend a total of 50,000 ₽',
    'Have dinner at "Lux" Restaurant',
    'Reach level 12',
    'Buy your first apartment (studio)',
    'Raise your life level to 500 🌟',
    'Buy jewelry at the jewelry store',
    'Reach level 15',
    'Open your first business',
    'Earn a total of 5,000,000 ₽',
    'Reach level 18',
    'Take a trip from the airport',
    'Reach level 20',
    'Raise your life level to 5,000 🌟',
    'Become the owner of the whole city!',
  ],
  ua: [
    'Розімни палець: зроби 30 тапів',
    'Заробити всього 300 ₽',
    'Купи перекус у кіоску «У Ашота»',
    'Зроби 100 тапів',
    'Прокачай тап 2 рази',
    'Досягни 3 рівня',
    'Купи щось у супермаркеті',
    'Купи кросівки в «Стилі»',
    'Заробити всього 5 000 ₽',
    'Перекуси в кафе «Плюшка»',
    'Досягни 5 рівня',
    'Купи смартфон',
    'Зроби 500 тапів',
    'Сходи у фітнес-клуб',
    'Досягни 8 рівня',
    'Купи свій перший транспорт',
    'Витрать всього 50 000 ₽',
    'Повечеряй у ресторані «Люкс»',
    'Досягни 12 рівня',
    'Купи свою першу квартиру (студію)',
    'Підніми рівень життя до 500 🌟',
    'Купи прикрасу в ювелірному',
    'Досягни 15 рівня',
    'Відкрий свій перший бізнес',
    'Заробити всього 5 000 000 ₽',
    'Досягни 18 рівня',
    'Злітай у подорож з аеропорту',
    'Досягни 20 рівня',
    'Підніми рівень життя до 5 000 🌟',
    'Стань господарем всього міста!',
  ],
};

// Индексы совпадают с порядком в LIFE_TIERS (data.js).
var LIFE_TIER_TEXT = {
  en: ['Start of the journey', 'Modest resident', 'Confident city dweller', 'Successful person', 'Real rich guy', 'Tycoon', 'CITY LEGEND'],
  ua: ['Початок шляху', 'Скромний мешканець', 'Впевнений містянин', 'Успішна людина', 'Справжній багатій', 'Магнат', 'ЛЕГЕНДА МІСТА'],
};

var HOME0_TEXT = { en: 'Room in a Shared Flat', ua: 'Кімната в комуналці' };

var UNIT_TEXT = {
  ru: { thousand: 'тыс', million: 'млн', billion: 'млрд', hour: 'ч', minute: 'мин', second: 'сек' },
  en: { thousand: 'K', million: 'M', billion: 'B', hour: 'h', minute: 'min', second: 'sec' },
  ua: { thousand: 'тис', million: 'млн', billion: 'млрд', hour: 'год', minute: 'хв', second: 'сек' },
};

function curLang() {
  return (state && state.lang) || 'ru';
}

// t('key') — статичная UI-строка; t('key', {a:1}) — с подстановкой {a} внутри.
function t(key, vars) {
  var lang = curLang();
  var s = (UI_TEXT[lang] && UI_TEXT[lang][key]) || UI_TEXT.ru[key] || key;
  if (vars) {
    for (var k in vars) s = s.split('{' + k + '}').join(vars[k]);
  }
  return s;
}

function trBuildingName(b) {
  var lang = curLang();
  var d = lang !== 'ru' && BUILDING_TEXT[lang] && BUILDING_TEXT[lang][b.id];
  return (d && d.name) || b.name;
}
function trBuildingDesc(b) {
  var lang = curLang();
  var d = lang !== 'ru' && BUILDING_TEXT[lang] && BUILDING_TEXT[lang][b.id];
  return (d && d.desc) || b.desc;
}
function trItemName(it) {
  var lang = curLang();
  var name = lang !== 'ru' && ITEM_TEXT[lang] && ITEM_TEXT[lang][it.id];
  return name || it.name;
}
function trTaskText(task, index) {
  var lang = curLang();
  if (task.generated) return t('bonusTask', { n: task.n });
  if (lang === 'ru') return task.text;
  var arr = TASK_TEXT[lang];
  return (arr && arr[index]) || task.text;
}
function trLifeTierName(index) {
  var lang = curLang();
  if (lang === 'ru') return LIFE_TIERS[index][1];
  var arr = LIFE_TIER_TEXT[lang];
  return (arr && arr[index]) || LIFE_TIERS[index][1];
}
function trHomeName(home) {
  var lang = curLang();
  if (home.id === 'home0') return (lang !== 'ru' && HOME0_TEXT[lang]) || home.name;
  return trItemName(home);
}
function trUnit(key) {
  var lang = curLang();
  return (UNIT_TEXT[lang] && UNIT_TEXT[lang][key]) || UNIT_TEXT.ru[key];
}
