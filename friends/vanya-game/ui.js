// ===== Мой Город — интерфейс =====

var UI = {};

(function () {
  var $ = function (id) { return document.getElementById(id); };
  var openBuildingId = null;   // какое здание открыто в модалке
  var prevUnlockedCount = 0;   // для точки-уведомления на вкладке «Город»
  var modalShownAt = 0;        // защита от «хвостового» клика после открытия

  function modalJustShown() { return Date.now() - modalShownAt < 350; }

  // ---------- Верхняя панель ----------
  UI.refreshHUD = function () {
    $('money').textContent = fmt(state.money);
    var income = passiveIncome();
    $('passive').textContent = income > 0 ? '+' + fmt(income) + ' ₽/сек' : '';
    $('levelBadge').textContent = 'Ур. ' + state.level;
    var need = xpNeed(state.level);
    var pct = Math.min(100, state.xp / need * 100);
    $('xpFill').style.width = pct + '%';
    $('xpText').textContent = fmt(state.xp) + ' / ' + fmt(need) + ' XP';
    $('lifeBadge').textContent = '🌟 ' + fmt(lifeScore());

    // экран «Тапать»
    $('perTap').textContent = '+' + fmt(tapValue()) + ' ₽ за тап';
    $('avatarEmoji').textContent = lifeTier().emoji;
    var cost = upgradeCost();
    $('upgradeDesc').textContent = '+' + upgradeGain() + ' ₽ к тапу';
    var ub = $('upgradeBtn');
    ub.textContent = fmt(cost) + ' ₽';
    ub.disabled = state.money < cost;

    // бустер
    var chip = $('boostChip');
    if (state.boost && state.boost.until > Date.now()) {
      chip.classList.remove('hidden');
      var left = Math.ceil((state.boost.until - Date.now()) / 1000);
      chip.textContent = '🔥 x' + state.boost.mult + ' — ' + left + ' сек';
    } else {
      chip.classList.add('hidden');
    }

    // подсказка с текущим заданием
    var task = currentTask();
    var p = taskProgress(task);
    $('tapTaskHint').innerHTML = p.done
      ? '✅ Задание готово! <b>Забери награду во вкладке «Задания»</b>'
      : '🎯 ' + task.text + ' <b>(' + fmt(p.cur) + '/' + fmt(p.goal) + ')</b>';
    $('taskDot').classList.toggle('hidden', !p.done);

    // точка на «Город», если открылись новые здания
    var unlockedNow = BUILDINGS.filter(function (b) { return b.level <= state.level; }).length;
    if (unlockedNow > prevUnlockedCount) $('cityDot').classList.remove('hidden');
    prevUnlockedCount = unlockedNow;

    // обновить открытую модалку магазина и активные экраны
    if (openBuildingId && !$('modalWrap').classList.contains('hidden')) refreshShopButtons();
    if ($('screen-tasks').classList.contains('active')) UI.renderTasks();
  };

  // ---------- Переключение вкладок ----------
  function showScreen(name) {
    document.querySelectorAll('.screen').forEach(function (s) { s.classList.remove('active'); });
    document.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('active'); });
    $('screen-' + name).classList.add('active');
    document.querySelector('.tab[data-screen="' + name + '"]').classList.add('active');
    if (name === 'city') { UI.renderCity(); $('cityDot').classList.add('hidden'); }
    if (name === 'tasks') UI.renderTasks();
    if (name === 'profile') UI.renderProfile();
  }

  document.querySelectorAll('.tab').forEach(function (t) {
    t.addEventListener('click', function () { showScreen(t.dataset.screen); });
  });

  // ---------- Тап ----------
  var tapBtn = $('tapBtn');
  function handleTap(x, y) {
    var v = doTap();
    soundTap();
    var zone = $('tapZone');
    var rect = zone.getBoundingClientRect();
    var f = document.createElement('div');
    f.className = 'floater';
    f.textContent = '+' + fmt(v) + ' ₽';
    f.style.left = (x - rect.left - 20 + (Math.random() * 40 - 20)) + 'px';
    f.style.top = (y - rect.top - 30) + 'px';
    zone.appendChild(f);
    setTimeout(function () { f.remove(); }, 900);
    UI.refreshHUD();
  }
  // мультитач: каждый палец — отдельный тап
  tapBtn.addEventListener('touchstart', function (e) {
    e.preventDefault();
    for (var i = 0; i < e.changedTouches.length; i++) {
      handleTap(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
    }
  }, { passive: false });
  tapBtn.addEventListener('mousedown', function (e) {
    handleTap(e.clientX, e.clientY);
  });

  $('upgradeBtn').addEventListener('click', function () {
    if (buyUpgrade()) { soundBuy(); UI.toast('💪 Тап прокачан!'); }
    else soundError();
    UI.refreshHUD();
  });

  // ---------- Город ----------
  var cityBuilt = false;
  UI.renderCity = function () {
    var map = $('cityMap');
    if (!cityBuilt) {
      cityBuilt = true;
      DECOR.forEach(function (d) {
        var el = document.createElement('div');
        el.className = 'decor' + (d[3] ? ' big' : '');
        el.textContent = d[0];
        el.style.left = d[1] + 'px';
        el.style.top = d[2] + 'px';
        map.appendChild(el);
      });
      BUILDINGS.forEach(function (b) {
        var el = document.createElement('div');
        el.className = 'building';
        el.id = 'b-' + b.id;
        el.style.left = b.x + 'px';
        el.style.top = b.y + 'px';
        el.innerHTML = '<span class="b-emoji">' + b.emoji + '</span>' +
          '<span class="b-name">' + b.name + '</span><br>' +
          '<span class="b-lock">🔒 Ур. ' + b.level + '</span>';
        map.appendChild(el);
      });
      var home = document.createElement('div');
      home.className = 'home-marker';
      home.id = 'homeMarker';
      home.style.left = HOME_POS.x + 'px';
      home.style.top = HOME_POS.y + 'px';
      map.appendChild(home);
      initDrag();
    }
    // состояние зданий
    BUILDINGS.forEach(function (b) {
      var el = $('b-' + b.id);
      var locked = b.level > state.level;
      el.classList.toggle('locked', locked);
      el.classList.toggle('fresh', b.level === state.level && !locked);
      el.querySelector('.b-lock').style.display = locked ? 'inline-block' : 'none';
    });
    var h = currentHome();
    $('homeMarker').innerHTML = '<span class="b-emoji">' + h.emoji + '</span>' +
      '<span class="b-name">🏠 Твой дом: ' + h.name + '</span>';
  };

  // Перетаскивание карты и тапы по зданиям.
  // Здание открываем на pointerup, а не на click: из-за setPointerCapture
  // click уходит на viewport и до зданий не доходит.
  var dragMoved = false;

  function activateBuilding(id) {
    var b = null;
    for (var i = 0; i < BUILDINGS.length; i++) if (BUILDINGS[i].id === id) b = BUILDINGS[i];
    if (!b) return;
    if (b.level > state.level) {
      soundError();
      UI.toast('🔒 «' + b.name + '» откроется на ' + b.level + ' уровне!');
    } else {
      UI.openShop(b.id);
    }
  }

  function initDrag() {
    var vp = $('cityViewport');
    var map = $('cityMap');
    var pos = { x: -80, y: -40 };
    var start = null;
    var pressed = null; // здание, на котором началось нажатие

    function clamp() {
      var minX = vp.clientWidth - map.offsetWidth;
      var minY = vp.clientHeight - map.offsetHeight;
      pos.x = Math.min(0, Math.max(minX, pos.x));
      pos.y = Math.min(0, Math.max(minY, pos.y));
    }
    function apply() {
      clamp();
      map.style.transform = 'translate(' + pos.x + 'px,' + pos.y + 'px)';
    }
    apply();

    vp.addEventListener('pointerdown', function (e) {
      if (!e.isPrimary || e.button > 0) return;
      start = { px: e.clientX, py: e.clientY, x: pos.x, y: pos.y };
      dragMoved = false;
      pressed = e.target && e.target.closest ? e.target.closest('.building') : null;
      try { vp.setPointerCapture(e.pointerId); } catch (err) {}
    });
    vp.addEventListener('pointermove', function (e) {
      if (!start || !e.isPrimary) return;
      var dx = e.clientX - start.px;
      var dy = e.clientY - start.py;
      if (Math.abs(dx) + Math.abs(dy) > 8) dragMoved = true;
      pos.x = start.x + dx;
      pos.y = start.y + dy;
      apply();
    });
    vp.addEventListener('pointerup', function (e) {
      if (!e.isPrimary) return;
      start = null;
      var hit = pressed;
      pressed = null;
      if (!dragMoved && hit) activateBuilding(hit.id.slice(2));
      dragMoved = false;
    });
    vp.addEventListener('pointercancel', function () { start = null; pressed = null; });
  }

  // ---------- Магазин здания ----------
  UI.openShop = function (buildingId) {
    var b = null;
    for (var i = 0; i < BUILDINGS.length; i++) if (BUILDINGS[i].id === buildingId) b = BUILDINGS[i];
    if (!b) return;
    openBuildingId = buildingId;

    var html = '<div class="modal-head">' +
      '<span class="m-emoji">' + b.emoji + '</span>' +
      '<div><div class="m-title">' + b.name + '</div><div class="m-sub">' + b.desc + '</div></div>' +
      '<button class="modal-close" id="modalCloseBtn">✕</button></div>';

    b.items.forEach(function (it) {
      var tags = '';
      if (it.life) tags += '<span class="tag life">+' + fmt(it.life) + ' 🌟 жизнь</span>';
      if (it.tap) tags += '<span class="tag tap">+' + fmt(it.tap) + ' ₽/тап</span>';
      if (it.income) tags += '<span class="tag income">+' + fmt(it.income) + ' ₽/сек</span>';
      if (it.boost) tags += '<span class="tag boost">🔥 x' + it.boost.mult + ' на ' + it.boost.sec + ' сек</span>';
      if (it.xp) tags += '<span class="tag xp">+' + fmt(it.xp) + ' XP</span>';
      html += '<div class="shop-item">' +
        '<span class="i-emoji">' + it.emoji + '</span>' +
        '<div class="i-body"><div class="i-name">' + it.name + '</div><div class="i-tags">' + tags + '</div></div>' +
        '<span class="i-action" data-item="' + it.id + '"></span></div>';
    });

    var modal = $('modal');
    modal.className = '';
    modal.innerHTML = html;
    $('modalWrap').classList.remove('hidden');
    modalShownAt = Date.now();
    $('modalCloseBtn').addEventListener('click', function () {
      if (modalJustShown()) return;
      UI.closeModal();
    });
    refreshShopButtons();
  };

  function refreshShopButtons() {
    var b = null;
    for (var i = 0; i < BUILDINGS.length; i++) if (BUILDINGS[i].id === openBuildingId) b = BUILDINGS[i];
    if (!b) return;
    document.querySelectorAll('.i-action').forEach(function (slot) {
      var it = ITEM_INDEX[slot.dataset.item].item;
      var ownedMark = null;
      if (it.kind === 'item' && state.owned[it.id]) ownedMark = '✅ Куплено';
      if (it.kind === 'home') {
        if (state.home === it.id) ownedMark = '🏠 Живёшь тут';
        else {
          var hr = state.home === 'home0' ? 0 : ITEM_INDEX[state.home].item.rank;
          if (it.rank <= hr) ownedMark = '⬇️ Уже было';
        }
      }
      if (it.kind === 'transport') {
        if (state.transport === it.id) ownedMark = '🚗 Твой';
        else {
          var tr = state.transport ? ITEM_INDEX[state.transport].item.rank : 0;
          if (it.rank <= tr) ownedMark = '⬇️ Уже было';
        }
      }
      if (ownedMark) {
        slot.innerHTML = '<span class="owned-mark">' + ownedMark + '</span>';
      } else {
        var can = state.money >= it.price;
        slot.innerHTML = '<button class="btn" data-buy="' + it.id + '" ' + (can ? '' : 'disabled') + '>' + fmt(it.price) + ' ₽</button>';
      }
    });
    document.querySelectorAll('[data-buy]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (modalJustShown()) return;
        var res = buyItem(btn.dataset.buy);
        if (res === 'ok') {
          var it = ITEM_INDEX[btn.dataset.buy].item;
          soundBuy();
          UI.toast(it.emoji + ' ' + it.name + ' — куплено!');
          UI.renderCity();
        } else if (res === 'noMoney') {
          soundError();
          UI.toast('😕 Не хватает денег — иди тапай!');
        }
        UI.refreshHUD();
        refreshShopButtons();
      });
    });
  }

  UI.closeModal = function () {
    $('modalWrap').classList.add('hidden');
    openBuildingId = null;
  };
  $('modalBackdrop').addEventListener('click', function () {
    if (modalJustShown()) return;
    UI.closeModal();
  });

  // ---------- Задания ----------
  UI.renderTasks = function () {
    var box = $('tasksList');
    var html = '<div class="section-title">📋 Задания</div>';
    if (state.taskIndex >= TASKS.length) {
      html += '<div class="tasks-done-note">🏆 Основные задания выполнены! Дальше — бонусные.</div>';
    }
    var task = currentTask();
    var p = taskProgress(task);
    var pct = Math.min(100, p.cur / p.goal * 100);
    html += '<div class="task-card current">' +
      '<div class="task-top"><div class="task-name">' + task.text + '</div>' +
      '<div class="task-reward">' + (task.money ? '+' + fmt(task.money) + ' ₽' : '') + (task.xp ? ' +' + fmt(task.xp) + ' XP' : '') + '</div></div>' +
      '<div class="task-progress"><div class="task-progress-fill" style="width:' + pct + '%"></div>' +
      '<div class="task-progress-text">' + fmt(p.cur) + ' / ' + fmt(p.goal) + '</div></div>' +
      '<button class="btn task-claim" id="claimBtn" ' + (p.done ? '' : 'disabled') + '>' +
      (p.done ? '🎁 Забрать награду!' : 'Выполни задание') + '</button></div>';

    // следующие два задания — превью
    for (var i = 1; i <= 2; i++) {
      var t = getTask(state.taskIndex + i);
      html += '<div class="task-card future"><div class="task-top">' +
        '<div class="task-name">🔜 ' + t.text + '</div>' +
        '<div class="task-reward">' + (t.money ? '+' + fmt(t.money) + ' ₽' : '') + '</div></div></div>';
    }
    html += '<div class="tasks-done-note">Выполнено заданий: <b>' + state.taskIndex + '</b></div>';
    box.innerHTML = html;
    var claim = $('claimBtn');
    if (claim) claim.addEventListener('click', function () {
      var t = currentTask();
      if (claimTask()) {
        soundTask();
        UI.toast('🎉 Награда: +' + fmt(t.money) + ' ₽, +' + fmt(t.xp) + ' XP');
        UI.renderTasks();
        UI.refreshHUD();
      }
    });
  };

  // ---------- Профиль ----------
  UI.renderProfile = function () {
    var tier = lifeTier();
    var next = nextLifeTier();
    var home = currentHome();
    var tr = currentTransport();
    var box = $('profileBox');

    var tierPct = next ? Math.min(100, (tier.score - tier.min) / (next.min - tier.min) * 100) : 100;
    var html = '<div class="profile-head">' +
      '<div class="profile-avatar">' + tier.emoji + '</div>' +
      '<div class="profile-tier">' + tier.name + '</div>' +
      '<div class="profile-life">🌟 Уровень жизни: ' + fmt(tier.score) + '</div>' +
      '<div class="tier-bar"><div class="tier-fill" style="width:' + tierPct + '%"></div></div>' +
      (next ? '<div class="tier-next">До «' + next.name + '»: ещё ' + fmt(next.min - tier.score) + ' 🌟</div>'
            : '<div class="tier-next">👑 Ты достиг вершины!</div>') +
      '</div>';

    html += '<div class="mystuff"><div class="section-title">🏠 Как ты живёшь</div><div class="stuff-row">' +
      '<div class="stuff-slot"><div class="s-emoji">' + home.emoji + '</div><div class="s-label">ЖИЛЬЁ</div><div class="s-name">' + home.name + '</div></div>' +
      '<div class="stuff-slot"><div class="s-emoji">' + (tr ? tr.emoji : '🚶') + '</div><div class="s-label">ТРАНСПОРТ</div><div class="s-name">' + (tr ? tr.name : 'Пешком') + '</div></div>' +
      '</div>';

    var chips = '';
    for (var id in state.owned) {
      var e = ITEM_INDEX[id];
      if (e) chips += '<span class="owned-chip">' + e.item.emoji + ' ' + e.item.name + '</span>';
    }
    html += '<div class="section-title" style="margin-top:10px">🎒 Твои вещи</div>' +
      '<div class="owned-grid">' + (chips || '<span class="owned-chip">Пока пусто — иди по магазинам!</span>') + '</div></div>';

    html += '<div class="mystuff"><div class="section-title">📊 Статистика</div><div class="stats-list">' +
      '👆 Тапов сделано: <b>' + fmt(state.totalTaps) + '</b><br>' +
      '💰 Всего заработано: <b>' + fmt(state.totalEarned) + ' ₽</b><br>' +
      '🛍️ Всего потрачено: <b>' + fmt(state.totalSpent) + ' ₽</b><br>' +
      '📦 Покупок: <b>' + state.purchases + '</b><br>' +
      '✅ Заданий выполнено: <b>' + state.taskIndex + '</b></div></div>';

    html += '<div class="profile-actions">' +
      '<button class="btn gray" id="muteBtn">' + (state.muted ? '🔇 Звук выкл' : '🔊 Звук вкл') + '</button>' +
      '<button class="btn danger" id="resetBtn">🗑️ Начать заново</button></div>';

    box.innerHTML = html;
    $('muteBtn').addEventListener('click', function () {
      state.muted = !state.muted;
      saveGame();
      UI.renderProfile();
    });
    $('resetBtn').addEventListener('click', function () {
      if (confirm('Точно начать игру заново? Весь прогресс удалится!')) {
        resetGame();
        location.reload();
      }
    });
  };

  // ---------- События игры ----------
  UI.onLevelUp = function (newLevel, unlockedBuildings) {
    soundLevelUp();
    UI.confetti();
    var text = 'Ты стал круче!';
    if (unlockedBuildings.length > 0) {
      text = 'Открылось: ' + unlockedBuildings.map(function (b) { return b.emoji + ' <b>' + b.name + '</b>'; }).join(', ') + '. Загляни в город!';
      $('cityDot').classList.remove('hidden');
    }
    UI.centerModal('🎉', 'Уровень ' + newLevel + '!', text, 'Ура!');
  };

  UI.onVictory = function () {
    soundLevelUp();
    UI.confetti();
    setTimeout(UI.confetti, 600);
    UI.centerModal('👑', 'ТЫ — ЛЕГЕНДА ГОРОДА!', 'Весь город теперь твой! Ты прошёл путь от комнаты в коммуналке до хозяина города. Игра пройдена, но можно продолжать играть!', 'Я — легенда! 👑');
  };

  UI.centerModal = function (emoji, title, text, btnText) {
    var modal = $('modal');
    modal.className = 'center-modal';
    modal.innerHTML = '<div class="big-emoji">' + emoji + '</div>' +
      '<div class="center-title">' + title + '</div>' +
      '<div class="center-text">' + text + '</div>' +
      '<button class="btn center-btn" id="centerOk">' + btnText + '</button>';
    $('modalWrap').classList.remove('hidden');
    modalShownAt = Date.now();
    $('centerOk').addEventListener('click', function () {
      if (modalJustShown()) return;
      UI.closeModal();
    });
  };

  // ---------- Тосты и конфетти ----------
  var toastTimer = null;
  UI.toast = function (text) {
    var wrap = $('toastWrap');
    var t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = text;
    wrap.appendChild(t);
    while (wrap.children.length > 3) wrap.removeChild(wrap.firstChild);
    setTimeout(function () { t.classList.add('fade'); }, 1700);
    setTimeout(function () { t.remove(); }, 2200);
  };

  UI.confetti = function () {
    var box = $('confettiBox');
    var colors = ['#ff5d5d', '#ffd94a', '#5bde6c', '#5b8cff', '#ff5db1', '#a45bff'];
    for (var i = 0; i < 60; i++) {
      var c = document.createElement('div');
      c.className = 'confetti';
      c.style.left = Math.random() * 100 + '%';
      c.style.background = colors[Math.floor(Math.random() * colors.length)];
      c.style.animationDuration = (1.2 + Math.random() * 1.6) + 's';
      c.style.animationDelay = Math.random() * 0.4 + 's';
      c.style.transform = 'rotate(' + Math.random() * 360 + 'deg)';
      box.appendChild(c);
      (function (el) { setTimeout(function () { el.remove(); }, 3500); })(c);
    }
  };

  // ---------- Запуск ----------
  loadGame();
  var offline = computeOfflineGain();
  prevUnlockedCount = BUILDINGS.filter(function (b) { return b.level <= state.level; }).length;
  UI.refreshHUD();
  if (offline) {
    UI.centerModal('💤', 'Пока тебя не было...',
      'Твои бизнесы работали <b>' + fmtTime(offline.seconds) + '</b> и заработали <b>' + fmt(offline.gain) + ' ₽</b>!',
      'Забрать деньги 💰');
  }
  saveGame();
})();
