'use strict';

const $ = (selector) => document.querySelector(selector);
const ui = {
  experience: $('#experience'), book: $('#book'), stage: $('#stage'),
  left: $('#left-page'), right: $('#right-page'), leaf: $('#turning-leaf'),
  front: $('#leaf-front'), back: $('#leaf-back'), toolbar: $('#reader-toolbar'),
  navigation: $('#reader-navigation'), indicator: $('#page-indicator'), range: $('#page-range'),
  prev: $('#prev-page'), next: $('#next-page'), announcement: $('#announcement'),
};
const mobile = matchMedia('(max-width: 700px)');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const state = { data: null, cursor: 0, mode: 'original', opened: false, busy: false, zoomIndex: 0, zoom: 1, turn: null };
const step = () => mobile.matches ? 1 : 2;
const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const normalize = (text) => text.toLocaleLowerCase('ru').replace(/ё/g, 'е');
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const lastCursor = () => Math.floor((state.data.pages.length - 1) / step()) * step();

function saveReading() {
  try { localStorage.setItem('rodnik-reading-v1', JSON.stringify({ id: state.data.pages[state.cursor]?.id, mode: state.mode })); } catch { /* Reading also works with storage disabled. */ }
}

function makePage(page, mode = state.mode) {
  if (!page) return '<div class="blank-page" aria-label="Конец книги">✳</div>';
  const grain = '<div class="paper-grain" aria-hidden="true"></div>';
  let content;
  if (page.kind === 'title') {
    content = '<div class="page-title-design"><span class="title-ornament">✳</span><p class="eyebrow">РУКОПИСНАЯ КНИГА СТИХОВ</p><h2>Родник</h2><h3>Валентин Лаврищев</h3><blockquote>Я мысли те лишь излагал,<br>Что из души фонтаном били.</blockquote><small>СОХРАНЕНО С ЛЮБОВЬЮ</small></div>';
  } else if (page.kind === 'back') {
    content = '<div class="page-title-design"><span class="title-ornament">р.</span><p class="eyebrow">КНИГА СТИХОВ МОЕГО ДЕДА</p><h2 style="font-size:32px;letter-spacing:-1px">Валентин<br>Лаврищев</h2><blockquote>Его слова. Его почерк.<br>Наша память.</blockquote><small>СЕМЕЙНЫЙ АРХИВ</small></div>';
  } else if (page.kind === 'missing') {
    content = `<div class="missing-page"><span class="missing-number">${page.number}</span><p>Эта страница<br>ещё не найдена.</p><small>Оставили для неё место в книге.</small></div>`;
  } else {
    const inside = mode === 'original' && page.image
      ? `<img class="ink-image" src="${page.image}" alt="${escapeHtml(page.text || 'Пустая страница')}" decoding="async" draggable="false">`
      : `<pre class="page-text">${escapeHtml(page.text)}</pre>`;
    content = `<div class="page-inner">${inside}</div>`;
  }
  if (page.number) content += `<span class="page-number">${page.number}</span>`;
  return grain + content;
}

function fitPage(container) {
  const text = container.querySelector('.page-text');
  if (!text) return;
  if (container.classList.contains('flow-text')) {
    text.style.fontSize = `${22 * state.zoom}px`;
    return;
  }
  const inner = text.parentElement;
  text.style.fontSize = '24px';
  // Preserve every original line. Fit the actual glyph widths and all stanzas to the sheet.
  const width = Math.max(1, text.scrollWidth);
  const height = Math.max(1, text.scrollHeight);
  const scale = Math.min(inner.clientWidth / width, inner.clientHeight / height, container.id === 'zoom-paper' ? 1.5 : 1);
  let fontSize = Math.max(6, 24 * scale * .985);
  text.style.fontSize = `${fontSize}px`;
  // Letter spacing stays constant as the font shrinks, so measure again rather than clipping long lines.
  for (let i = 0; i < 5; i++) {
    const correction = Math.min(inner.clientWidth / Math.max(1, text.scrollWidth), inner.clientHeight / Math.max(1, text.scrollHeight));
    if (correction >= 1) break;
    fontSize = Math.max(6, fontSize * correction * .99);
    text.style.fontSize = `${fontSize}px`;
  }
}

function renderPage(container, page, index) {
  container.innerHTML = makePage(page);
  container.dataset.index = index;
  container.setAttribute('aria-label', page?.number ? `Страница ${page.number}` : page?.kind === 'contents' ? 'Рукописное содержание' : page?.kind === 'back' ? 'Задняя обложка' : 'Титульная страница');
  const image = container.querySelector('.ink-image');
  image?.addEventListener('error', () => {
    const pre = document.createElement('pre');
    pre.className = 'page-text';
    pre.textContent = page.text;
    image.replaceWith(pre);
    fitPage(container);
  }, { once: true });
  fitPage(container);
}

function labelFor(page) {
  if (!page) return '';
  return page.number ? String(page.number) : ({ title: 'Начало', contents: 'Содержание', back: 'Конец' }[page.kind] || '');
}

function updateNavigation() {
  const pages = state.data.pages;
  const visible = pages.slice(state.cursor, state.cursor + step());
  const labels = visible.map(labelFor);
  ui.indicator.textContent = labels.join(' — ');
  ui.range.max = lastCursor() / step();
  ui.range.value = state.cursor / step();
  ui.prev.disabled = state.busy || state.cursor <= 0;
  ui.next.disabled = state.busy || state.cursor >= lastCursor();
  ui.range.disabled = state.busy;
  $('#close-book').disabled = state.busy;
  $('#zoom-button').disabled = state.busy;
  $('#mode-original').disabled = state.busy;
  $('#mode-text').disabled = state.busy;
  ui.announcement.textContent = `Открыто: ${visible.map((p) => p.number ? `страница ${p.number}` : labelFor(p)).join(', ')}. ${state.mode === 'original' ? 'Оригинальный почерк' : 'Расшифрованный текст'}.`;
  const preload = pages.slice(Math.max(0, state.cursor - 2), state.cursor + 5);
  preload.forEach((p) => { if (p.image) { const img = new Image(); img.src = p.image; } });
}

function renderSpread() {
  if (!state.data) return;
  const pages = state.data.pages;
  ui.left.setAttribute('aria-hidden', String(!state.opened || mobile.matches));
  ui.right.setAttribute('aria-hidden', String(!state.opened));
  if (mobile.matches) {
    renderPage(ui.right, pages[state.cursor], state.cursor);
    ui.left.innerHTML = '';
  } else {
    renderPage(ui.left, pages[state.cursor], state.cursor);
    renderPage(ui.right, pages[state.cursor + 1], state.cursor + 1);
  }
  updateNavigation();
  saveReading();
}

function bendLeaf(duration, direction) {
  const width = ui.leaf.clientWidth;
  const height = ui.leaf.clientHeight;
  const count = mobile.matches ? 12 : 18;
  const segment = width / count;
  const skin = document.createElement('div');
  skin.className = 'curve-skin';
  const animations = [];
  for (let i = 0; i < count; i++) {
    const strip = document.createElement('div');
    strip.className = 'curve-strip';
    strip.style.width = `${segment + .8}px`;
    for (const side of ['front', 'back']) {
      const face = document.createElement('div');
      face.className = `curve-face curve-${side}`;
      const surface = document.createElement('div');
      surface.className = 'curve-content page';
      surface.style.width = `${width}px`;
      surface.style.height = `${height}px`;
      surface.style.left = `${-(side === 'front' ? i : count - 1 - i) * segment}px`;
      surface.innerHTML = (side === 'front' ? ui.front : ui.back).innerHTML;
      surface.querySelectorAll('.leaf-fold').forEach((fold) => fold.remove());
      face.append(surface);
      strip.append(face);
    }
    skin.append(strip);
    const x = i * segment;
    const angle = .5 * direction;
    const theta = i / count * angle;
    const radius = width / angle;
    const curvedX = Math.sin(theta) * radius;
    const curvedZ = (1 - Math.cos(theta)) * radius;
    const flat = `translate3d(${x}px,0,0) rotateY(0deg)`;
    animations.push(strip.animate([
      { transform: flat },
      { transform: `translate3d(${curvedX}px,0,${curvedZ}px) rotateY(${-theta * 180 / Math.PI}deg)`, offset: .5 },
      { transform: flat },
    ], { duration, easing: 'cubic-bezier(.25,.65,.25,1)', fill: 'both' }));
  }
  ui.leaf.append(skin);
  ui.leaf.classList.add('curving');
  return () => {
    animations.forEach((animation) => animation.cancel());
    skin.remove();
    ui.leaf.classList.remove('curving');
  };
}

async function openBook() {
  if (!state.data || state.opened || state.busy) return;
  if (ui.book.classList.contains('show-back')) {
    ui.book.classList.remove('show-back');
    await pause(reducedMotion.matches ? 1 : 650);
  }
  state.opened = true;
  state.busy = true;
  document.body.classList.add('reading');
  $('#front-cover').setAttribute('aria-hidden', 'true');
  $('#front-cover').tabIndex = -1;
  ui.experience.classList.add('open');
  ui.toolbar.hidden = false;
  ui.navigation.hidden = false;
  renderSpread();
  await pause(reducedMotion.matches ? 1 : 1250);
  state.busy = false;
  renderSpread();
  if (mobile.matches) ui.experience.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
}

async function closeBook() {
  if (state.busy) return;
  state.opened = false;
  document.body.classList.remove('reading');
  $('#front-cover').setAttribute('aria-hidden', 'false');
  $('#front-cover').tabIndex = 0;
  ui.experience.classList.remove('open');
  ui.toolbar.hidden = true;
  ui.navigation.hidden = true;
  renderSpread();
  history.replaceState(null, '', location.pathname + location.search);
  $('#open-button').focus({ preventScroll: true });
}

async function turnPage(direction) {
  if (!state.opened || state.busy) return;
  const target = Math.max(0, Math.min(lastCursor(), state.cursor + direction * step()));
  if (target === state.cursor) return;
  state.busy = true;
  updateNavigation();
  const pages = state.data.pages;
  const old = state.cursor;
  const compact = mobile.matches;
  if (direction > 0) {
    renderPage(ui.front, pages[old + (compact ? 0 : 1)], old + (compact ? 0 : 1));
    renderPage(ui.back, compact ? null : pages[target], target);
    renderPage(ui.right, pages[target + (compact ? 0 : 1)], target + (compact ? 0 : 1));
  } else {
    renderPage(ui.front, pages[target + (compact ? 0 : 1)], target + (compact ? 0 : 1));
    renderPage(ui.back, compact ? null : pages[old], old);
    if (!compact) renderPage(ui.left, pages[target], target);
    else renderPage(ui.right, pages[target], target);
  }
  [ui.front, ui.back].forEach((surface) => {
    const fold = document.createElement('div');
    fold.className = 'leaf-fold';
    surface.append(fold);
  });
  ui.leaf.classList.add('is-turning');
  fitPage(ui.front);
  fitPage(ui.back);
  const duration = reducedMotion.matches ? 1 : 950;
  const clearBend = reducedMotion.matches ? () => {} : bendLeaf(duration, direction);
  const start = direction > 0 ? 0 : -180;
  const end = direction > 0 ? -180 : 0;
  const animation = ui.leaf.animate([
    { transform: `translateZ(35px) rotateY(${start}deg) rotateX(0deg)`, offset: 0 },
    { transform: `translateZ(55px) rotateY(${(start + end) / 2}deg) rotateX(${direction * -3}deg)`, offset: .5 },
    { transform: `translateZ(35px) rotateY(${end}deg) rotateX(0deg)`, offset: 1 },
  ], { duration, easing: 'cubic-bezier(.25,.65,.25,1)', fill: 'forwards' });
  state.turn = animation;
  try { await animation.finished; } catch { /* Layout changes may finish a turn early. */ }
  state.cursor = Math.floor(target / step()) * step();
  ui.leaf.classList.remove('is-turning');
  clearBend();
  animation.cancel();
  state.turn = null;
  state.busy = false;
  renderSpread();
  updateHash();
}

function updateHash(id) {
  const page = state.data.pages[state.cursor];
  history.replaceState(null, '', `${location.pathname}${location.search}#page=${encodeURIComponent(id || page.id)}`);
}

async function goToId(id) {
  const index = state.data.pages.findIndex((p) => p.id === id);
  if (index < 0) return;
  if (state.busy) { await pause(100); return goToId(id); }
  state.cursor = Math.floor(index / step()) * step();
  await openBook();
  renderSpread();
  updateHash(id);
}

function setMode(mode) {
  if (state.busy) return;
  state.mode = mode;
  for (const name of ['original', 'text']) {
    const button = $(`#mode-${name}`);
    button.classList.toggle('active', name === mode);
    button.setAttribute('aria-pressed', String(name === mode));
  }
  renderSpread();
  if ($('#zoom-dialog').open) renderZoom();
}

function showDialog(dialog) {
  if (!dialog.open) dialog.showModal();
  document.body.style.overflow = 'hidden';
}

function populateContents(query = '') {
  const list = $('#contents-list');
  list.innerHTML = '';
  let rows = state.data.contents;
  const q = normalize(query.trim());
  if (q) {
    const numeric = /^\d+$/.test(q) ? Number(q) : null;
    const matched = state.data.pages.filter((p) => p.number && (p.number === numeric || normalize(p.text).includes(q)));
    const seen = new Set();
    rows = rows.filter((row) => row.number === numeric || normalize(row.title).includes(q));
    rows.forEach((row) => seen.add(row.number));
    for (const page of matched) {
      if (seen.has(page.number)) continue;
      const lines = page.text.split('\n').filter(Boolean);
      const excerpt = lines.find((line) => normalize(line).includes(q)) || lines[0] || `Страница ${page.number}`;
      rows.push({ title: excerpt, number: page.number, section: 'Найдено в тексте' });
      seen.add(page.number);
    }
    rows.sort((a, b) => a.number - b.number);
  }
  let section = null;
  for (const row of rows) {
    if (row.section && row.section !== section) {
      const label = document.createElement('p');
      label.className = 'contents-section';
      label.textContent = row.section;
      list.append(label);
      section = row.section;
    }
    const button = document.createElement('button');
    button.className = 'contents-link';
    button.innerHTML = `<span>${escapeHtml(row.title)}</span><span class="toc-number">${row.number}</span>`;
    button.addEventListener('click', () => {
      $('#contents-dialog').close();
      goToId(String(row.number).padStart(3, '0'));
    });
    list.append(button);
  }
  if (!rows.length) list.innerHTML = '<p class="contents-empty">Ничего не найдено. Попробуйте другую строку.</p>';
}

function renderZoom() {
  const page = state.data.pages[state.zoomIndex];
  const paper = $('#zoom-paper');
  const availableWidth = $('#zoom-scroll').clientWidth - 40;
  const base = Math.max(580, Math.min(700, availableWidth));
  const flow = mobile.matches && state.mode === 'text' && page.kind === 'page';
  paper.classList.toggle('flow-text', flow);
  paper.style.width = `${flow ? availableWidth + 20 : base * state.zoom}px`;
  paper.style.height = flow ? 'auto' : `${base * state.zoom * 1.5}px`;
  paper.style.minHeight = flow ? `${(availableWidth + 20) * 1.5}px` : '0';
  renderPage(paper, page, state.zoomIndex);
  $('#zoom-title').textContent = page.number ? `Страница ${page.number} · ${state.mode === 'original' ? 'почерк' : 'текст'}` : labelFor(page);
  $('#zoom-minus').disabled = state.zoom <= .7;
  $('#zoom-plus').disabled = state.zoom >= 2;
  $('#zoom-prev').disabled = state.zoomIndex === 0;
  $('#zoom-next').disabled = state.zoomIndex >= state.data.pages.length - 1;
}

function openZoom(index) {
  if (state.busy || !state.opened) return;
  state.zoomIndex = index ?? state.cursor + (mobile.matches ? 0 : 1);
  state.zoomIndex = Math.min(state.data.pages.length - 1, state.zoomIndex);
  state.zoom = 1;
  showDialog($('#zoom-dialog'));
  renderZoom();
  $('#zoom-scroll').scrollTo(0, 0);
}

function bindEvents() {
  $('#open-button').addEventListener('click', openBook);
  $('#front-cover').addEventListener('click', openBook);
  $('#rotate-cover').addEventListener('click', () => {
    ui.book.classList.toggle('show-back');
    $('#rotate-cover').innerHTML = ui.book.classList.contains('show-back') ? 'Лицевая обложка <span>↻</span>' : 'Оборот обложки <span>↻</span>';
  });
  $('#close-book').addEventListener('click', closeBook);
  ui.prev.addEventListener('click', () => turnPage(-1));
  ui.next.addEventListener('click', () => turnPage(1));
  $('#mode-original').addEventListener('click', () => setMode('original'));
  $('#mode-text').addEventListener('click', () => setMode('text'));
  $('#contents-button').addEventListener('click', () => {
    if (!state.data) return;
    populateContents($('#search-input').value);
    showDialog($('#contents-dialog'));
  });
  $('#about-button').addEventListener('click', () => showDialog($('#about-dialog')));
  $('#search-input').addEventListener('input', (event) => populateContents(event.target.value));
  $('#zoom-button').addEventListener('click', () => openZoom());
  $('#zoom-minus').addEventListener('click', () => { state.zoom = Math.max(.7, state.zoom - .2); renderZoom(); });
  $('#zoom-plus').addEventListener('click', () => { state.zoom = Math.min(2, state.zoom + .2); renderZoom(); });
  for (const direction of [-1, 1]) {
    $(`#zoom-${direction < 0 ? 'prev' : 'next'}`).addEventListener('click', () => {
      state.zoomIndex += direction;
      state.cursor = Math.floor(state.zoomIndex / step()) * step();
      renderSpread();
      renderZoom();
      $('#zoom-scroll').scrollTo(0, 0);
      updateHash(state.data.pages[state.zoomIndex].id);
    });
  }
  document.querySelectorAll('dialog').forEach((dialog) => {
    dialog.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => dialog.close()));
    dialog.addEventListener('close', () => {
      if (!document.querySelector('dialog[open]')) document.body.style.overflow = '';
    });
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
  });
  ui.indicator.addEventListener('click', () => {
    $('#jump-input').value = state.data.pages[state.cursor]?.number || 3;
    showDialog($('#jump-dialog'));
    $('#jump-input').focus();
    $('#jump-input').select();
  });
  $('#jump-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const number = Number($('#jump-input').value);
    if (!Number.isInteger(number) || number < 3 || number > 164) return;
    $('#jump-dialog').close();
    goToId(String(number).padStart(3, '0'));
  });
  ui.range.addEventListener('input', () => {
    if (state.busy) return;
    state.cursor = Number(ui.range.value) * step();
    renderSpread();
    updateHash();
  });
  document.addEventListener('keydown', (event) => {
    if (['INPUT', 'TEXTAREA'].includes(event.target.tagName) || document.querySelector('dialog[open]')) return;
    if (state.opened && ['ArrowRight', 'ArrowLeft'].includes(event.key)) {
      event.preventDefault();
      turnPage(event.key === 'ArrowRight' ? 1 : -1);
    } else if (event.key === 'Escape' && state.opened) closeBook();
  });
  let pointer = null;
  let dragged = false;
  ui.stage.addEventListener('pointerdown', (event) => {
    if (!state.opened || state.busy || event.button !== 0 || event.target.closest('button')) return;
    pointer = { x: event.clientX, y: event.clientY, id: event.pointerId };
    dragged = false;
  });
  ui.stage.addEventListener('pointermove', (event) => {
    if (!pointer || event.pointerId !== pointer.id) return;
    if (Math.abs(event.clientX - pointer.x) > 15) dragged = true;
  });
  ui.stage.addEventListener('pointerup', (event) => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;
    pointer = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.25) {
      dragged = true;
      turnPage(dx < 0 ? 1 : -1);
    }
  });
  ui.stage.addEventListener('pointercancel', () => { pointer = null; dragged = true; });
  [ui.left, ui.right].forEach((page) => page.addEventListener('click', () => {
    if (!dragged) openZoom(Number(page.dataset.index));
    dragged = false;
  }));
  let resizeTimer;
  const resize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      state.turn?.finish();
      state.cursor = Math.floor(state.cursor / step()) * step();
      renderSpread();
      if ($('#zoom-dialog').open) renderZoom();
    }, 80);
  };
  window.addEventListener('resize', resize);
  mobile.addEventListener('change', resize);
  window.addEventListener('hashchange', () => {
    const match = location.hash.match(/^#page=(.+)$/);
    if (match && state.data) goToId(decodeURIComponent(match[1]));
  });
  document.fonts.ready.then(() => { renderSpread(); if ($('#zoom-dialog').open) renderZoom(); });
}

async function init() {
  bindEvents();
  document.body.classList.add('loading');
  $('#open-button').disabled = true;
  $('#front-cover').disabled = true;
  try {
    const response = await fetch('assets/book.json');
    if (!response.ok) throw new Error(`Archive response: ${response.status}`);
    state.data = await response.json();
    try {
      const saved = JSON.parse(localStorage.getItem('rodnik-reading-v1'));
      if (saved?.id) {
        const index = state.data.pages.findIndex((p) => p.id === saved.id);
        if (index >= 0) state.cursor = Math.floor(index / step()) * step();
      }
      if (saved?.mode === 'text') state.mode = 'text';
    } catch { /* Storage is optional. */ }
    setMode(state.mode);
    $('#footer-detail').textContent = `${state.data.available + 1} сохранённых страниц · семейный архив`;
    $('#archive-note').textContent = `Сохранены обложка, ${state.data.available - 5} страниц стихов и пять листов содержания. Страницы 1 и 2 не существуют; ${state.data.missing.join(', ')} пока не найдены.`;
    renderSpread();
    document.body.classList.remove('loading');
    $('#open-button').disabled = false;
    $('#front-cover').disabled = false;
    const match = location.hash.match(/^#page=(.+)$/);
    if (match) await goToId(decodeURIComponent(match[1]));
  } catch (error) {
    console.error(error);
    $('#open-button').textContent = 'Обновить страницу';
    $('#open-button').disabled = false;
    $('#open-button').addEventListener('click', () => location.reload(), { once: true });
    $('#gesture-hint').textContent = 'Не удалось загрузить книгу. Попробуйте обновить страницу.';
    document.body.classList.remove('loading');
  }
}

init();
