// ===== Мой Город — игровая логика =====

var SAVE_KEY = 'moy-gorod-save-v1';

var state = null;

function defaultState() {
  return {
    money: 0,
    level: 1,
    xp: 0,
    tapUpgrades: 0,
    totalTaps: 0,
    totalEarned: 0,
    totalSpent: 0,
    purchases: 0,
    owned: {},              // itemId -> true (вещи и бизнесы)
    home: 'home0',
    transport: null,
    buildingBuys: {},       // buildingId -> сколько покупок сделано
    taskIndex: 0,
    taskStart: null,        // снимок счётчиков на момент начала задания
    boost: null,            // { mult, until }
    muted: false,
    lastSeen: Date.now(),
    won: false,
    lang: 'ua',
  };
}

// ---------- Язык ----------
function setLang(lang) {
  if (LANGS.indexOf(lang) === -1 || lang === state.lang) return;
  state.lang = lang;
  saveGame();
  UI.applyLanguage();
}

// ---------- Сохранение ----------
function saveGame() {
  state.lastSeen = Date.now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) {}
}

function loadGame() {
  var raw = null;
  try { raw = localStorage.getItem(SAVE_KEY); } catch (e) {}
  if (raw) {
    try {
      var loaded = JSON.parse(raw);
      state = Object.assign(defaultState(), loaded);
    } catch (e) { state = defaultState(); }
  } else {
    state = defaultState();
  }
  if (!state.taskStart) state.taskStart = takeSnapshot();
}

function resetGame() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
  state = defaultState();
  state.taskStart = takeSnapshot();
  saveGame();
}

// ---------- Формулы ----------
function xpNeed(level) {
  return Math.floor(80 * Math.pow(level, 1.55));
}

function upgradeCost() {
  return Math.floor(100 * Math.pow(1.8, state.tapUpgrades));
}

function upgradeGain() {
  // сколько ₽ к тапу даст следующая прокачка
  return state.tapUpgrades + 1;
}

function itemsTapBonus() {
  var sum = 0;
  for (var id in state.owned) {
    var e = ITEM_INDEX[id];
    if (e && e.item.tap) sum += e.item.tap;
  }
  var tr = state.transport && ITEM_INDEX[state.transport];
  if (tr && tr.item.tap) sum += tr.item.tap;
  var hm = state.home !== 'home0' && ITEM_INDEX[state.home];
  if (hm && hm.item.tap) sum += hm.item.tap;
  return sum;
}

function upgradesTapBonus() {
  // прокачка №1 даёт +1, №2 ещё +2, №3 ещё +3 ...
  var n = state.tapUpgrades;
  return n * (n + 1) / 2;
}

function tapPower() {
  return 1 + (state.level - 1) + upgradesTapBonus() + itemsTapBonus();
}

function boostMult() {
  if (state.boost && state.boost.until > Date.now()) return state.boost.mult;
  return 1;
}

function tapValue() {
  return Math.floor(tapPower() * boostMult());
}

function passiveIncome() {
  var sum = 0;
  for (var id in state.owned) {
    var e = ITEM_INDEX[id];
    if (e && e.item.income) sum += e.item.income;
  }
  return sum;
}

function lifeScore() {
  var sum = 10;
  for (var id in state.owned) {
    var e = ITEM_INDEX[id];
    if (e && e.item.life) sum += e.item.life;
  }
  var hm = state.home !== 'home0' && ITEM_INDEX[state.home];
  if (hm) sum += hm.item.life;
  var tr = state.transport && ITEM_INDEX[state.transport];
  if (tr) sum += tr.item.life;
  return sum;
}

function lifeTier() {
  var score = lifeScore();
  var tier = LIFE_TIERS[0];
  var idx = 0;
  for (var i = 0; i < LIFE_TIERS.length; i++) {
    if (score >= LIFE_TIERS[i][0]) { tier = LIFE_TIERS[i]; idx = i; }
  }
  return { min: tier[0], name: tier[1], emoji: tier[2], score: score, idx: idx };
}

function nextLifeTier() {
  var score = lifeScore();
  for (var i = 0; i < LIFE_TIERS.length; i++) {
    if (score < LIFE_TIERS[i][0]) return { min: LIFE_TIERS[i][0], name: LIFE_TIERS[i][1], idx: i };
  }
  return null;
}

function currentHome() {
  if (state.home === 'home0') return START_HOME;
  var e = ITEM_INDEX[state.home];
  return e ? e.item : START_HOME;
}

function currentTransport() {
  if (!state.transport) return null;
  var e = ITEM_INDEX[state.transport];
  return e ? e.item : null;
}

// ---------- Опыт и уровни ----------
function addXp(amount) {
  if (amount <= 0) return;
  state.xp += amount;
  var leveled = [];
  while (state.xp >= xpNeed(state.level)) {
    state.xp -= xpNeed(state.level);
    state.level++;
    leveled.push(state.level);
  }
  if (leveled.length > 0) {
    var newLevel = leveled[leveled.length - 1];
    var unlocked = [];
    for (var i = 0; i < BUILDINGS.length; i++) {
      var b = BUILDINGS[i];
      if (leveled.indexOf(b.level) !== -1) unlocked.push(b);
    }
    UI.onLevelUp(newLevel, unlocked);
  }
}

// ---------- Тап ----------
function doTap() {
  var v = tapValue();
  state.money += v;
  state.totalEarned += v;
  state.totalTaps++;
  addXp(1);
  return v;
}

// ---------- Прокачка тапа ----------
function buyUpgrade() {
  var cost = upgradeCost();
  if (state.money < cost) return false;
  state.money -= cost;
  state.totalSpent += cost;
  state.tapUpgrades++;
  saveGame();
  return true;
}

// ---------- Покупки в зданиях ----------
// Возвращает: 'ok' | 'noMoney' | 'owned' | 'lowRank'
function buyItem(itemId) {
  var entry = ITEM_INDEX[itemId];
  if (!entry) return 'owned';
  var it = entry.item;
  var b = entry.building;

  if (it.kind === 'item' && state.owned[it.id]) return 'owned';
  if (it.kind === 'home') {
    var curHomeRank = state.home === 'home0' ? 0 : (ITEM_INDEX[state.home] ? ITEM_INDEX[state.home].item.rank : 0);
    if (it.rank <= curHomeRank) return 'lowRank';
  }
  if (it.kind === 'transport') {
    var curTrRank = state.transport && ITEM_INDEX[state.transport] ? ITEM_INDEX[state.transport].item.rank : 0;
    if (it.rank <= curTrRank) return 'lowRank';
  }
  if (state.money < it.price) return 'noMoney';

  state.money -= it.price;
  state.totalSpent += it.price;
  state.purchases++;
  state.buildingBuys[b.id] = (state.buildingBuys[b.id] || 0) + 1;

  if (it.kind === 'item') state.owned[it.id] = true;
  if (it.kind === 'home') state.home = it.id;
  if (it.kind === 'transport') state.transport = it.id;
  if (it.boost) {
    state.boost = { mult: it.boost.mult, until: Date.now() + it.boost.sec * 1000 };
  }
  if (it.xp) addXp(it.xp);

  if (it.id === 'city' && !state.won) {
    state.won = true;
    UI.onVictory();
  }

  saveGame();
  return 'ok';
}

// ---------- Задания ----------
function takeSnapshot() {
  return {
    taps: state ? state.totalTaps : 0,
    earned: state ? state.totalEarned : 0,
    spent: state ? state.totalSpent : 0,
  };
}

// Бесконечные задания после основной цепочки
function generatedTask(index) {
  var k = index - TASKS.length + 1; // 1, 2, 3...
  return {
    text: 'Бонус-задание: сделай ещё ' + (1000 * k) + ' тапов',
    type: 'taps',
    n: 1000 * k,
    money: 200000 * k,
    xp: 2000 * k,
    generated: true,
  };
}

function getTask(index) {
  if (index < TASKS.length) return TASKS[index];
  return generatedTask(index);
}

function currentTask() {
  return getTask(state.taskIndex);
}

// Прогресс задания: { cur, goal, done }
function taskProgress(task) {
  var s = state.taskStart || takeSnapshot();
  var cur = 0, goal = 1;
  switch (task.type) {
    case 'taps':    cur = state.totalTaps - s.taps; goal = task.n; break;
    case 'earn':    cur = state.totalEarned;        goal = task.n; break;
    case 'spend':   cur = state.totalSpent;         goal = task.n; break;
    case 'level':   cur = state.level;              goal = task.n; break;
    case 'life':    cur = lifeScore();              goal = task.n; break;
    case 'upgrades':cur = state.tapUpgrades;        goal = task.n; break;
    case 'buyFrom': cur = (state.buildingBuys[task.b] || 0) > 0 ? 1 : 0; goal = 1; break;
    case 'buyItem': cur = (state.owned[task.item] || state.home === task.item || state.transport === task.item) ? 1 : 0; goal = 1; break;
    case 'transport': cur = state.transport ? 1 : 0; goal = 1; break;
    case 'income':  cur = passiveIncome() > 0 ? 1 : 0; goal = 1; break;
  }
  if (cur > goal) cur = goal;
  if (cur < 0) cur = 0;
  return { cur: cur, goal: goal, done: cur >= goal };
}

function claimTask() {
  var task = currentTask();
  var p = taskProgress(task);
  if (!p.done) return false;
  state.money += task.money;
  if (task.money > 0) state.totalEarned += task.money;
  state.taskIndex++;
  state.taskStart = takeSnapshot();
  if (task.xp) addXp(task.xp);
  saveGame();
  return true;
}

// ---------- Офлайн-доход ----------
// Возвращает { seconds, gain } или null
function computeOfflineGain() {
  var income = passiveIncome();
  var delta = Math.floor((Date.now() - (state.lastSeen || Date.now())) / 1000);
  if (income <= 0 || delta < 120) return null;
  var capped = Math.min(delta, 4 * 3600); // максимум 4 часа
  var gain = Math.floor(income * capped * 0.5); // 50% от обычной скорости
  if (gain <= 0) return null;
  state.money += gain;
  state.totalEarned += gain;
  return { seconds: capped, gain: gain };
}

// ---------- Звук ----------
var audioCtx = null;
function beep(freq, dur, type, gain) {
  if (state.muted) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    var o = audioCtx.createOscillator();
    var g = audioCtx.createGain();
    o.type = type || 'square';
    o.frequency.value = freq;
    g.gain.value = gain || 0.04;
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    o.connect(g); g.connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + dur);
  } catch (e) {}
}

var lastTapSound = 0;
function soundTap() {
  var now = Date.now();
  if (now - lastTapSound < 45) return;
  lastTapSound = now;
  beep(520 + Math.random() * 240, 0.07, 'square', 0.035);
}
function soundBuy() { beep(660, 0.09, 'triangle', 0.06); setTimeout(function () { beep(990, 0.12, 'triangle', 0.06); }, 90); }
function soundTask() { beep(523, 0.1, 'triangle', 0.06); setTimeout(function () { beep(659, 0.1, 'triangle', 0.06); }, 100); setTimeout(function () { beep(784, 0.16, 'triangle', 0.06); }, 200); }
function soundLevelUp() {
  [523, 659, 784, 1047].forEach(function (f, i) {
    setTimeout(function () { beep(f, 0.18, 'triangle', 0.07); }, i * 130);
  });
}
function soundError() { beep(180, 0.15, 'sawtooth', 0.05); }

// ---------- Форматирование чисел ----------
function fmt(n) {
  n = Math.floor(n);
  var glue = curLang() === 'en';
  if (n >= 1e9) return trim1(n / 1e9) + (glue ? '' : ' ') + trUnit('billion');
  if (n >= 1e6) return trim1(n / 1e6) + (glue ? '' : ' ') + trUnit('million');
  if (n >= 1e4) return trim1(n / 1e3) + (glue ? '' : ' ') + trUnit('thousand');
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, glue ? ',' : ' ');
}
function trim1(x) {
  var v = Math.floor(x * 10) / 10;
  return (v % 1 === 0 ? String(Math.floor(v)) : String(v).replace('.', ','));
}
function fmtTime(sec) {
  if (sec >= 3600) return Math.floor(sec / 3600) + ' ' + trUnit('hour') + ' ' + Math.floor((sec % 3600) / 60) + ' ' + trUnit('minute');
  if (sec >= 60) return Math.floor(sec / 60) + ' ' + trUnit('minute');
  return sec + ' ' + trUnit('second');
}

// ---------- Игровой цикл ----------
var lastTick = Date.now();
function tick() {
  var now = Date.now();
  var dt = (now - lastTick) / 1000;
  lastTick = now;
  if (dt > 0 && dt < 30) {
    var income = passiveIncome();
    if (income > 0) {
      var gain = income * dt;
      state.money += gain;
      state.totalEarned += gain;
    }
  }
  if (state.boost && state.boost.until <= now) state.boost = null;
  UI.refreshHUD();
}

setInterval(tick, 1000);
setInterval(saveGame, 5000);
window.addEventListener('beforeunload', saveGame);
