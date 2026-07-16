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
    $('passive').textContent = income > 0 ? '+' + fmt(income) + t('perSecSuffix') : '';
    $('levelBadge').textContent = t('levelShort', { n: state.level });
    var need = xpNeed(state.level);
    var pct = Math.min(100, state.xp / need * 100);
    $('xpFill').style.width = pct + '%';
    $('xpText').textContent = fmt(state.xp) + ' / ' + fmt(need) + ' XP';
    $('lifeBadge').textContent = '🌟 ' + fmt(lifeScore());

    // экран «Тапать»
    $('perTap').textContent = t('perTap', { n: fmt(tapValue()) });
    $('avatarEmoji').textContent = lifeTier().emoji;
    var cost = upgradeCost();
    $('upgradeDesc').textContent = t('upgradeDesc', { n: upgradeGain() });
    var ub = $('upgradeBtn');
    ub.textContent = fmt(cost) + ' ₽';
    ub.disabled = state.money < cost;

    // бустер
    var chip = $('boostChip');
    if (state.boost && state.boost.until > Date.now()) {
      chip.classList.remove('hidden');
      var left = Math.ceil((state.boost.until - Date.now()) / 1000);
      chip.textContent = t('boostChip', { mult: state.boost.mult, sec: left });
    } else {
      chip.classList.add('hidden');
    }

    // подсказка с текущим заданием
    var task = currentTask();
    var p = taskProgress(task);
    $('tapTaskHint').innerHTML = p.done
      ? t('taskDoneHint')
      : t('taskHint', { text: trTaskText(task, state.taskIndex), cur: fmt(p.cur), goal: fmt(p.goal) });
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
    if (buyUpgrade()) { soundBuy(); UI.toast(t('upgradeSuccessToast')); }
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
          '<span class="b-name"></span><br>' +
          '<span class="b-lock"></span>';
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
      el.querySelector('.b-name').textContent = trBuildingName(b);
      el.querySelector('.b-lock').textContent = t('buildingLock', { n: b.level });
      el.querySelector('.b-lock').style.display = locked ? 'inline-block' : 'none';
    });
    var h = currentHome();
    $('homeMarker').innerHTML = '<span class="b-emoji">' + h.emoji + '</span>' +
      '<span class="b-name">' + t('homeMarker', { name: trHomeName(h) }) + '</span>';
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
      UI.toast(t('lockedToast', { name: trBuildingName(b), n: b.level }));
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
      '<div><div class="m-title">' + trBuildingName(b) + '</div><div class="m-sub">' + trBuildingDesc(b) + '</div></div>' +
      '<button class="modal-close" id="modalCloseBtn">✕</button></div>';

    b.items.forEach(function (it) {
      var tags = '';
      if (it.life) tags += '<span class="tag life">' + t('tagLife', { n: fmt(it.life) }) + '</span>';
      if (it.tap) tags += '<span class="tag tap">' + t('tagTap', { n: fmt(it.tap) }) + '</span>';
      if (it.income) tags += '<span class="tag income">' + t('tagIncome', { n: fmt(it.income) }) + '</span>';
      if (it.boost) tags += '<span class="tag boost">' + t('tagBoost', { mult: it.boost.mult, sec: it.boost.sec }) + '</span>';
      if (it.xp) tags += '<span class="tag xp">' + t('tagXp', { n: fmt(it.xp) }) + '</span>';
      html += '<div class="shop-item">' +
        '<span class="i-emoji">' + it.emoji + '</span>' +
        '<div class="i-body"><div class="i-name">' + trItemName(it) + '</div><div class="i-tags">' + tags + '</div></div>' +
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
      if (it.kind === 'item' && state.owned[it.id]) ownedMark = t('ownedItem');
      if (it.kind === 'home') {
        if (state.home === it.id) ownedMark = t('ownedHome');
        else {
          var hr = state.home === 'home0' ? 0 : ITEM_INDEX[state.home].item.rank;
          if (it.rank <= hr) ownedMark = t('ownedLower');
        }
      }
      if (it.kind === 'transport') {
        if (state.transport === it.id) ownedMark = t('ownedTransport');
        else {
          var tr = state.transport ? ITEM_INDEX[state.transport].item.rank : 0;
          if (it.rank <= tr) ownedMark = t('ownedLower');
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
          UI.toast(t('buySuccessToast', { emoji: it.emoji, name: trItemName(it) }));
          UI.renderCity();
        } else if (res === 'noMoney') {
          soundError();
          UI.toast(t('buyFailToast'));
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
    var html = '<div class="section-title">' + t('tasksTitle') + '</div>';
    if (state.taskIndex >= TASKS.length) {
      html += '<div class="tasks-done-note">' + t('tasksAllDone') + '</div>';
    }
    var task = currentTask();
    var p = taskProgress(task);
    var pct = Math.min(100, p.cur / p.goal * 100);
    html += '<div class="task-card current">' +
      '<div class="task-top"><div class="task-name">' + trTaskText(task, state.taskIndex) + '</div>' +
      '<div class="task-reward">' + (task.money ? '+' + fmt(task.money) + ' ₽' : '') + (task.xp ? ' +' + fmt(task.xp) + ' XP' : '') + '</div></div>' +
      '<div class="task-progress"><div class="task-progress-fill" style="width:' + pct + '%"></div>' +
      '<div class="task-progress-text">' + fmt(p.cur) + ' / ' + fmt(p.goal) + '</div></div>' +
      '<button class="btn task-claim" id="claimBtn" ' + (p.done ? '' : 'disabled') + '>' +
      (p.done ? t('taskClaimBtn') : t('taskNotDoneBtn')) + '</button></div>';

    // следующие два задания — превью
    for (var i = 1; i <= 2; i++) {
      var future = getTask(state.taskIndex + i);
      html += '<div class="task-card future"><div class="task-top">' +
        '<div class="task-name">' + t('previewPrefix') + trTaskText(future, state.taskIndex + i) + '</div>' +
        '<div class="task-reward">' + (future.money ? '+' + fmt(future.money) + ' ₽' : '') + '</div></div></div>';
    }
    html += '<div class="tasks-done-note">' + t('tasksCompletedCount', { n: state.taskIndex }) + '</div>';
    box.innerHTML = html;
    var claim = $('claimBtn');
    if (claim) claim.addEventListener('click', function () {
      var tsk = currentTask();
      if (claimTask()) {
        soundTask();
        UI.toast(t('claimToast', { money: fmt(tsk.money), xp: fmt(tsk.xp) }));
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

    var tierName = trLifeTierName(tier.idx);
    var tierPct = next ? Math.min(100, (tier.score - tier.min) / (next.min - tier.min) * 100) : 100;
    var html = '<div class="profile-head">' +
      '<div class="profile-avatar">' + tier.emoji + '</div>' +
      '<div class="profile-tier">' + tierName + '</div>' +
      '<div class="profile-life">' + t('profileLifeLevel', { n: fmt(tier.score) }) + '</div>' +
      '<div class="tier-bar"><div class="tier-fill" style="width:' + tierPct + '%"></div></div>' +
      (next ? '<div class="tier-next">' + t('tierNext', { name: trLifeTierName(next.idx), n: fmt(next.min - tier.score) }) + '</div>'
            : '<div class="tier-next">' + t('tierMax') + '</div>') +
      '</div>';

    html += '<div class="mystuff"><div class="section-title">' + t('howYouLive') + '</div><div class="stuff-row">' +
      '<div class="stuff-slot"><div class="s-emoji">' + home.emoji + '</div><div class="s-label">' + t('labelHome') + '</div><div class="s-name">' + trHomeName(home) + '</div></div>' +
      '<div class="stuff-slot"><div class="s-emoji">' + (tr ? tr.emoji : '🚶') + '</div><div class="s-label">' + t('labelTransport') + '</div><div class="s-name">' + (tr ? trItemName(tr) : t('onFoot')) + '</div></div>' +
      '</div>';

    var chips = '';
    for (var id in state.owned) {
      var e = ITEM_INDEX[id];
      if (e) chips += '<span class="owned-chip">' + e.item.emoji + ' ' + trItemName(e.item) + '</span>';
    }
    html += '<div class="section-title" style="margin-top:10px">' + t('yourStuff') + '</div>' +
      '<div class="owned-grid">' + (chips || '<span class="owned-chip">' + t('emptyStuff') + '</span>') + '</div></div>';

    html += '<div class="mystuff"><div class="section-title">' + t('statsTitle') + '</div><div class="stats-list">' +
      t('statTaps', { n: fmt(state.totalTaps) }) + '<br>' +
      t('statEarned', { n: fmt(state.totalEarned) }) + '<br>' +
      t('statSpent', { n: fmt(state.totalSpent) }) + '<br>' +
      t('statPurchases', { n: state.purchases }) + '<br>' +
      t('statTasks', { n: state.taskIndex }) + '</div></div>';

    html += '<div class="mystuff"><div class="section-title">' + t('languageTitle') + '</div><div class="lang-row">' +
      LANGS.map(function (l) {
        return '<button class="btn lang-btn' + (curLang() === l ? ' active' : '') + '" data-lang="' + l + '">' + LANG_LABELS[l] + '</button>';
      }).join('') + '</div></div>';

    html += '<div class="profile-actions">' +
      '<button class="btn gray" id="muteBtn">' + (state.muted ? t('soundOff') : t('soundOn')) + '</button>' +
      '<button class="btn danger" id="resetBtn">' + t('resetBtn') + '</button></div>';

    box.innerHTML = html;
    $('muteBtn').addEventListener('click', function () {
      state.muted = !state.muted;
      saveGame();
      UI.renderProfile();
    });
    $('resetBtn').addEventListener('click', function () {
      if (confirm(t('resetConfirm'))) {
        resetGame();
        location.reload();
      }
    });
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { setLang(btn.dataset.lang); });
    });
  };

  // ---------- События игры ----------
  UI.onLevelUp = function (newLevel, unlockedBuildings) {
    soundLevelUp();
    UI.confetti();
    var text = t('levelUpDefaultText');
    if (unlockedBuildings.length > 0) {
      var list = unlockedBuildings.map(function (b) { return b.emoji + ' <b>' + trBuildingName(b) + '</b>'; }).join(', ');
      text = t('levelUpUnlocked', { list: list });
      $('cityDot').classList.remove('hidden');
    }
    UI.centerModal('🎉', t('levelUpTitle', { n: newLevel }), text, t('levelUpBtn'));
  };

  UI.onVictory = function () {
    soundLevelUp();
    UI.confetti();
    setTimeout(UI.confetti, 600);
    UI.centerModal('👑', t('victoryTitle'), t('victoryText'), t('victoryBtn'));
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

  // ---------- Язык ----------
  UI.applyLanguage = function () {
    document.documentElement.lang = curLang() === 'ua' ? 'uk' : curLang();
    document.title = t('appTitle');
    document.querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-title]').forEach(function (el) { el.title = t(el.dataset.i18nTitle); });
    document.querySelectorAll('[data-i18n-arialabel]').forEach(function (el) { el.setAttribute('aria-label', t(el.dataset.i18nArialabel)); });
    UI.refreshHUD();
    UI.renderCity();
    UI.renderTasks();
    UI.renderProfile();
    if (openBuildingId && !$('modalWrap').classList.contains('hidden')) UI.openShop(openBuildingId);
  };

  // ---------- Запуск ----------
  loadGame();
  var offline = computeOfflineGain();
  prevUnlockedCount = BUILDINGS.filter(function (b) { return b.level <= state.level; }).length;
  UI.applyLanguage();
  if (offline) {
    UI.centerModal('💤', t('offlineTitle'),
      t('offlineText', { time: fmtTime(offline.seconds), gain: fmt(offline.gain) }),
      t('offlineBtn'));
  }
  saveGame();
})();
