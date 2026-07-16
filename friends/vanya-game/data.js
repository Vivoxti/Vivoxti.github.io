// ===== Мой Город — данные игры =====
// Виды товаров (kind):
//   consumable — можно покупать много раз (еда, бустеры)
//   item       — покупается один раз (вещи, бизнесы)
//   home       — жильё (заменяет текущее, только вперёд по рангу)
//   transport  — транспорт (заменяет текущий, только вперёд по рангу)
// Поля: price — цена, life — очки уровня жизни, tap — бонус к тапу,
//        income — пассивный доход ₽/сек, xp — опыт, boost — {mult, sec}

const BUILDINGS = [
  {
    id: 'kiosk', name: 'Ларёк «У Ашота»', emoji: '🏪', level: 1, x: 110, y: 130,
    desc: 'Перекус даёт опыт и ускоряет заработок!',
    items: [
      { id: 'gum',    name: 'Жвачка',    emoji: '🍬', kind: 'consumable', price: 20,  xp: 2 },
      { id: 'soda',   name: 'Газировка', emoji: '🥤', kind: 'consumable', price: 60,  xp: 5,  boost: { mult: 2, sec: 30 } },
      { id: 'shawa',  name: 'Шаурма',    emoji: '🌯', kind: 'consumable', price: 150, xp: 12, boost: { mult: 2, sec: 60 } },
      { id: 'energy', name: 'Энергетик', emoji: '⚡', kind: 'consumable', price: 350, xp: 20, boost: { mult: 3, sec: 45 } },
    ],
  },
  {
    id: 'market', name: 'Супермаркет «Корзинка»', emoji: '🛒', level: 2, x: 480, y: 110,
    desc: 'Продукты и полезные вещи для дома.',
    items: [
      { id: 'coffee2go', name: 'Кофе с собой',      emoji: '☕', kind: 'consumable', price: 120,  xp: 8,  boost: { mult: 2, sec: 45 } },
      { id: 'cake',      name: 'Торт',              emoji: '🎂', kind: 'consumable', price: 300,  xp: 18, boost: { mult: 2, sec: 90 } },
      { id: 'cooker',    name: 'Мультиварка',       emoji: '🍲', kind: 'item', price: 2000,  life: 12, xp: 30 },
      { id: 'tv',        name: 'Телевизор',         emoji: '📺', kind: 'item', price: 6000,  life: 25, xp: 60 },
      { id: 'robot',     name: 'Робот-пылесос',     emoji: '🤖', kind: 'item', price: 12000, life: 40, xp: 100 },
    ],
  },
  {
    id: 'cafe', name: 'Кафе «Плюшка»', emoji: '🧁', level: 3, x: 1090, y: 115,
    desc: 'Вкусно поесть — и тапается веселее!',
    items: [
      { id: 'cappu',  name: 'Капучино',    emoji: '☕', kind: 'consumable', price: 250,  xp: 14, boost: { mult: 2, sec: 60 } },
      { id: 'lunch',  name: 'Бизнес-ланч', emoji: '🍝', kind: 'consumable', price: 600,  xp: 35, boost: { mult: 2, sec: 120 } },
      { id: 'desert', name: 'Чизкейк',     emoji: '🍰', kind: 'consumable', price: 450,  xp: 25, boost: { mult: 3, sec: 40 } },
      { id: 'pizza',  name: 'Пицца на компанию', emoji: '🍕', kind: 'consumable', price: 1500, xp: 70, boost: { mult: 3, sec: 90 } },
    ],
  },
  {
    id: 'clothes', name: 'Магазин «Стиль»', emoji: '👗', level: 4, x: 1350, y: 120,
    desc: 'Одевайся круче — живи лучше.',
    items: [
      { id: 'tshirt',   name: 'Футболка',        emoji: '👕', kind: 'item', price: 800,   life: 8,  xp: 20 },
      { id: 'jeans',    name: 'Джинсы',          emoji: '👖', kind: 'item', price: 1500,  life: 12, xp: 30 },
      { id: 'sneakers', name: 'Кроссовки',       emoji: '👟', kind: 'item', price: 2500,  life: 16, tap: 2,  xp: 40 },
      { id: 'jacket',   name: 'Крутая куртка',   emoji: '🧥', kind: 'item', price: 5000,  life: 25, xp: 70 },
      { id: 'suit',     name: 'Деловой костюм',  emoji: '🤵', kind: 'item', price: 15000, life: 50, tap: 5,  xp: 150 },
    ],
  },
  {
    id: 'tech', name: 'Техника «Гигабайт»', emoji: '💻', level: 5, x: 110, y: 420,
    desc: 'Гаджеты дают бонус к заработку за тап!',
    items: [
      { id: 'buds',   name: 'Наушники',    emoji: '🎧', kind: 'item', price: 3500,   life: 15,  tap: 2,  xp: 50 },
      { id: 'watch',  name: 'Смарт-часы',  emoji: '⌚', kind: 'item', price: 9000,   life: 25,  tap: 4,  xp: 90 },
      { id: 'phone',  name: 'Смартфон',    emoji: '📱', kind: 'item', price: 20000,  life: 45,  tap: 8,  xp: 170 },
      { id: 'laptop', name: 'Ноутбук',     emoji: '💻', kind: 'item', price: 50000,  life: 75,  tap: 15, xp: 320 },
      { id: 'gampc',  name: 'Игровой ПК',  emoji: '🖥️', kind: 'item', price: 120000, life: 120, tap: 30, xp: 600 },
    ],
  },
  {
    id: 'gym', name: 'Фитнес «Качалка»', emoji: '🏋️', level: 6, x: 620, y: 420,
    desc: 'Здоровье — тоже уровень жизни!',
    items: [
      { id: 'workout', name: 'Тренировка',        emoji: '💪', kind: 'consumable', price: 500,  xp: 30, boost: { mult: 2, sec: 90 } },
      { id: 'abon',    name: 'Абонемент на год',  emoji: '📅', kind: 'item', price: 8000,  life: 30, xp: 90 },
      { id: 'trainer', name: 'Личный тренер',     emoji: '🧑‍🏫', kind: 'item', price: 30000, life: 60, tap: 6, xp: 220 },
      { id: 'pool',    name: 'Бассейн VIP',       emoji: '🏊', kind: 'item', price: 60000, life: 90, xp: 350 },
    ],
  },
  {
    id: 'cars', name: 'Автосалон «Колесо»', emoji: '🚗', level: 8, x: 1120, y: 420,
    desc: 'От самоката до лимузина — вся дорога твоя.',
    items: [
      { id: 'scooter', name: 'Самокат',        emoji: '🛴', kind: 'transport', rank: 1, price: 8000,     life: 20,  xp: 80 },
      { id: 'bike',    name: 'Велосипед',      emoji: '🚲', kind: 'transport', rank: 2, price: 25000,    life: 45,  xp: 160 },
      { id: 'lada',    name: '«Жигули»',       emoji: '🚙', kind: 'transport', rank: 3, price: 90000,    life: 90,  tap: 10,  xp: 400 },
      { id: 'sedan',   name: 'Крутой седан',   emoji: '🚗', kind: 'transport', rank: 4, price: 350000,   life: 170, tap: 25,  xp: 900 },
      { id: 'sport',   name: 'Спорткар',       emoji: '🏎️', kind: 'transport', rank: 5, price: 1600000,  life: 320, tap: 60,  xp: 2200 },
      { id: 'limo',    name: 'Лимузин',        emoji: '🚘', kind: 'transport', rank: 6, price: 6000000,  life: 550, tap: 120, xp: 5000 },
    ],
  },
  {
    id: 'restaurant', name: 'Ресторан «Люкс»', emoji: '🍽️', level: 10, x: 1370, y: 430,
    desc: 'Дорогая еда — мощные бустеры и куча опыта.',
    items: [
      { id: 'steak',   name: 'Стейк-ужин',      emoji: '🥩', kind: 'consumable', price: 3500,  xp: 80,  boost: { mult: 3, sec: 120 } },
      { id: 'tasting', name: 'Дегустация шефа', emoji: '🍱', kind: 'consumable', price: 12000, xp: 200, boost: { mult: 4, sec: 120 } },
      { id: 'banquet', name: 'Банкет с друзьями', emoji: '🎉', kind: 'consumable', price: 60000, xp: 700, boost: { mult: 5, sec: 180 } },
    ],
  },
  {
    id: 'realty', name: 'Недвижимость «Уют»', emoji: '🏠', level: 12, x: 115, y: 780,
    desc: 'Своё жильё — главный шаг к крутой жизни!',
    items: [
      { id: 'studio',   name: 'Студия',            emoji: '🚪', kind: 'home', rank: 1, price: 180000,   life: 120,  xp: 500 },
      { id: 'flat1',    name: 'Однушка в центре',  emoji: '🏢', kind: 'home', rank: 2, price: 600000,   life: 240,  xp: 1100 },
      { id: 'flat2',    name: 'Двушка с ремонтом', emoji: '🏬', kind: 'home', rank: 3, price: 1500000,  life: 420,  xp: 2200 },
      { id: 'cottage',  name: 'Коттедж',           emoji: '🏡', kind: 'home', rank: 4, price: 5000000,  life: 750,  xp: 4500 },
      { id: 'penthouse',name: 'Пентхаус',          emoji: '🌆', kind: 'home', rank: 5, price: 18000000, life: 1400, xp: 9000 },
    ],
  },
  {
    id: 'jewelry', name: 'Ювелирный «Блеск»', emoji: '💍', level: 14, x: 520, y: 790,
    desc: 'Блести, как настоящий богач.',
    items: [
      { id: 'chain',   name: 'Серебряная цепочка', emoji: '⛓️', kind: 'item', price: 120000,  life: 90,  xp: 400 },
      { id: 'goldwatch', name: 'Золотые часы',     emoji: '🕰️', kind: 'item', price: 600000,  life: 220, tap: 50, xp: 1300 },
      { id: 'ring',    name: 'Перстень с рубином', emoji: '💍', kind: 'item', price: 1500000, life: 350, xp: 2500 },
      { id: 'diamond', name: 'Бриллиант',          emoji: '💎', kind: 'item', price: 4000000, life: 600, xp: 4500 },
    ],
  },
  {
    id: 'business', name: 'Бизнес-центр «Империя»', emoji: '🏦', level: 15, x: 810, y: 770,
    desc: 'Бизнесы приносят деньги сами — даже когда ты не тапаешь!',
    items: [
      { id: 'coffeeshop', name: 'Своя кофейня',   emoji: '☕', kind: 'item', price: 300000,   income: 350,   life: 100, xp: 700 },
      { id: 'carwash',    name: 'Автомойка',      emoji: '🚿', kind: 'item', price: 1200000,  income: 1500,  life: 180, xp: 1600 },
      { id: 'shopbiz',    name: 'Сеть магазинов', emoji: '🏬', kind: 'item', price: 6000000,  income: 8000,  life: 350, xp: 3800 },
      { id: 'startup',    name: 'IT-стартап',     emoji: '🚀', kind: 'item', price: 25000000, income: 40000, life: 700, xp: 8000 },
    ],
  },
  {
    id: 'airport', name: 'Аэропорт «Взлёт»', emoji: '✈️', level: 18, x: 1180, y: 800,
    desc: 'Путешествия — море впечатлений, опыта и уровня жизни!',
    items: [
      { id: 'sochi',    name: 'Поездка в Сочи',   emoji: '🏖️', kind: 'item', price: 600000,    life: 180,  xp: 1200 },
      { id: 'turkey',   name: 'Отдых в Турции',   emoji: '🐚', kind: 'item', price: 1800000,   life: 300,  xp: 2500 },
      { id: 'paris',    name: 'Уикенд в Париже',  emoji: '🗼', kind: 'item', price: 6000000,   life: 550,  xp: 5000 },
      { id: 'maldives', name: 'Мальдивы',         emoji: '🏝️', kind: 'item', price: 18000000,  life: 1000, xp: 9000 },
      { id: 'space',    name: 'Полёт в космос',   emoji: '🚀', kind: 'item', price: 120000000, life: 3500, xp: 25000 },
    ],
  },
  {
    id: 'tower', name: 'Небоскрёб «Корона города»', emoji: '🏙️', level: 20, x: 690, y: 55,
    desc: 'Вершина города. Стань его легендой!',
    items: [
      { id: 'office50', name: 'Офис на 50 этаже',      emoji: '🏢', kind: 'item', price: 60000000,   income: 90000, life: 2000, xp: 15000 },
      { id: 'heli',     name: 'Вертолётная площадка',  emoji: '🚁', kind: 'item', price: 250000000,  life: 5000, xp: 30000 },
      { id: 'city',     name: 'Купить весь город',     emoji: '👑', kind: 'item', price: 1000000000, life: 99999, xp: 100000 },
    ],
  },
];

// Стартовое жильё (не продаётся, ранг 0)
const START_HOME = { id: 'home0', name: 'Комната в коммуналке', emoji: '🏚️', rank: 0, life: 0 };

// Декорации на карте: [emoji, x, y, big?]
const DECOR = [
  ['🌳', 300, 480, 1], ['🌳', 360, 560, 0], ['🌲', 260, 590, 0],
  ['🌳', 860, 120, 0], ['🌲', 940, 200, 0],
  ['⛲', 780, 500, 1], ['🌷', 730, 590, 0], ['🌷', 880, 590, 0],
  ['🌳', 1550, 300, 0], ['🌲', 1600, 560, 0],
  ['🌳', 100, 1050, 1], ['🌲', 220, 1120, 0], ['🌳', 420, 1080, 0],
  ['🎡', 640, 1020, 1], ['🎠', 830, 1080, 1],
  ['🌲', 1020, 1120, 0], ['🌳', 1500, 1020, 1], ['🚏', 470, 380, 0],
  ['🚌', 620, 300, 1], ['🚕', 1200, 660, 1], ['🚓', 200, 690, 1],
];

// Позиция маркера «Твой дом» на карте
const HOME_POS = { x: 330, y: 900 };

// Уровни жизни: [минимум очков, название, эмодзи-аватар]
const LIFE_TIERS = [
  [0,     'Начало пути',        '🧒'],
  [100,   'Скромный житель',    '🙂'],
  [350,   'Уверенный горожанин','😎'],
  [800,   'Успешный человек',   '🕶️'],
  [1800,  'Настоящий богач',    '🤑'],
  [4000,  'Магнат',             '🎩'],
  [10000, 'ЛЕГЕНДА ГОРОДА',     '👑'],
];

// Задания. type: taps | earn | spend | level | life | buyFrom | buyItem | upgrades | transport | income
const TASKS = [
  { text: 'Разомни палец: сделай 30 тапов',       type: 'taps',    n: 30,      money: 150,     xp: 40 },
  { text: 'Заработай всего 300 ₽',                type: 'earn',    n: 300,     money: 200,     xp: 50 },
  { text: 'Купи перекус в ларьке «У Ашота»',      type: 'buyFrom', b: 'kiosk', money: 300,     xp: 60 },
  { text: 'Сделай 100 тапов',                     type: 'taps',    n: 100,     money: 400,     xp: 80 },
  { text: 'Прокачай тап 2 раза',                  type: 'upgrades', n: 2,      money: 500,     xp: 90 },
  { text: 'Достигни 3 уровня',                    type: 'level',   n: 3,       money: 700,     xp: 100 },
  { text: 'Купи что-нибудь в супермаркете',       type: 'buyFrom', b: 'market', money: 600,    xp: 100 },
  { text: 'Купи кроссовки в «Стиле»',             type: 'buyItem', item: 'sneakers', money: 900, xp: 130 },
  { text: 'Заработай всего 5 000 ₽',              type: 'earn',    n: 5000,    money: 1200,    xp: 150 },
  { text: 'Перекуси в кафе «Плюшка»',             type: 'buyFrom', b: 'cafe',  money: 1000,    xp: 140 },
  { text: 'Достигни 5 уровня',                    type: 'level',   n: 5,       money: 2000,    xp: 200 },
  { text: 'Купи смартфон',                        type: 'buyItem', item: 'phone', money: 3000, xp: 300 },
  { text: 'Сделай 500 тапов',                     type: 'taps',    n: 500,     money: 2500,    xp: 250 },
  { text: 'Сходи в фитнес-клуб',                  type: 'buyFrom', b: 'gym',   money: 2500,    xp: 250 },
  { text: 'Достигни 8 уровня',                    type: 'level',   n: 8,       money: 5000,    xp: 400 },
  { text: 'Купи свой первый транспорт',           type: 'transport', money: 6000, xp: 450 },
  { text: 'Потрать всего 50 000 ₽',               type: 'spend',   n: 50000,   money: 8000,    xp: 500 },
  { text: 'Поужинай в ресторане «Люкс»',          type: 'buyFrom', b: 'restaurant', money: 9000, xp: 550 },
  { text: 'Достигни 12 уровня',                   type: 'level',   n: 12,      money: 15000,   xp: 800 },
  { text: 'Купи свою первую квартиру (студию)',   type: 'buyItem', item: 'studio', money: 25000, xp: 1200 },
  { text: 'Подними уровень жизни до 500 🌟',      type: 'life',    n: 500,     money: 20000,   xp: 1000 },
  { text: 'Купи украшение в ювелирном',           type: 'buyFrom', b: 'jewelry', money: 30000, xp: 1300 },
  { text: 'Достигни 15 уровня',                   type: 'level',   n: 15,      money: 50000,   xp: 1800 },
  { text: 'Открой свой первый бизнес',            type: 'income',  money: 80000,  xp: 2500 },
  { text: 'Заработай всего 5 000 000 ₽',          type: 'earn',    n: 5000000, money: 150000,  xp: 3500 },
  { text: 'Достигни 18 уровня',                   type: 'level',   n: 18,      money: 300000,  xp: 5000 },
  { text: 'Слетай в путешествие из аэропорта',    type: 'buyFrom', b: 'airport', money: 600000, xp: 6000 },
  { text: 'Достигни 20 уровня',                   type: 'level',   n: 20,      money: 1500000, xp: 8000 },
  { text: 'Подними уровень жизни до 5 000 🌟',    type: 'life',    n: 5000,    money: 3000000, xp: 12000 },
  { text: 'Стань хозяином всего города!',         type: 'buyItem', item: 'city', money: 0, xp: 0 },
];

// Быстрый поиск товара по id
const ITEM_INDEX = {};
BUILDINGS.forEach(function (b) {
  b.items.forEach(function (it) {
    ITEM_INDEX[it.id] = { item: it, building: b };
  });
});
