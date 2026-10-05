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
const backIndex = () => state.data.pages.findIndex((page) => page.kind === 'back');
const lastReadingCursor = () => Math.floor((backIndex() - 1) / step()) * step();
const placement = ([x, y, width, height]) => `left:${x}%;top:${y}%;width:${width}%;height:${height}%`;

function makeContents(text) {
  let pending = '';
  const rows = text.split('\n').map((line) => {
    line = line.trim();
    if (!line) return '';
    const entry = line.match(/^(.*?)\.{2,}\s*(\d+)\s*$/);
    if (entry) {
      const title = `${pending}${entry[1]}`.trim();
      pending = '';
      return `<a class="book-toc-row" href="#page=${entry[2].padStart(3, '0')}"><span class="toc-label">${escapeHtml(title)}</span><span class="toc-leader" aria-hidden="true"></span><span class="toc-number">${entry[2]}</span></a>`;
    }
    if (pending || (line.startsWith('«') && !line.includes('»'))) { pending += `${line} `; return ''; }
    return `<h4 class="book-toc-heading">${escapeHtml(line)}</h4>`;
  });
  if (pending) rows.push(`<p>${escapeHtml(pending.trim())}</p>`);
  return `<div class="book-contents">${rows.join('')}</div>`;
}

function makeTranscript(page) {
  const [x, y, width, height] = page.layout || page.textLayout || [8, 8, 84, 84];
  const content = page.kind === 'contents' ? makeContents(page.text) : `<pre class="page-text">${escapeHtml(page.text)}</pre>`;
  return `<div class="page-inner transcript-scroll" tabindex="0" aria-label="${page.kind === 'contents' ? 'Содержание' : 'Текст стихотворения'}" data-center-x="${x + width / 2}" data-center-y="${y + height / 2}">${content}</div>`;
}

function saveReading() {
  try { localStorage.setItem('rodnik-reading-v1', JSON.stringify({ id: state.data.pages[state.cursor]?.id, mode: state.mode })); } catch { /* Reading also works with storage disabled. */ }
}

function makePage(page, mode = state.mode) {
  if (!page) return '<div class="blank-page" aria-label="Пустой лист"></div>';
  const grain = '<div class="paper-grain" aria-hidden="true"></div>';
  let content;
  if (page.kind === 'title') {
    content = '<div class="page-title-design"><p class="eyebrow">РУКОПИСНАЯ КНИГА СТИХОВ</p><h2>Родник</h2><h3>Валентин Лаврищев</h3><blockquote>Я мысли те лишь излагал,<br>Что из души фонтаном били.</blockquote></div>';
  } else if (page.kind === 'back') {
    content = '';
  } else if (page.kind === 'missing') {
    content = `<div class="missing-page"><span class="missing-number">${page.number}</span><p>Эта страница<br>ещё не найдена.</p><small>Оставили для неё место в книге.</small></div>`;
  } else {
    content = mode === 'original' && page.image
      ? `<img class="ink-image positioned-ink" style="${placement(page.layout)}" src="${page.image}" alt="${escapeHtml(page.text || 'Пустая страница')}" decoding="async" draggable="false">`
      : makeTranscript(page);
  }
  if (page.number) content += mode === 'original' && page.numberImage
    ? `<img class="page-number-image" src="${page.numberImage}" style="width:${page.numberLayout[0]}%;height:${page.numberLayout[1]}%" alt="${page.number}" draggable="false">`
    : `<span class="page-number">${page.number}</span>`;
  return grain + content;
}

function fitPage(container) {
  const width = container.clientWidth;
  const layout = state.data?.layout || { columns: 28, textFontCells: .8, textLineCells: 1 };
  const cell = width / layout.columns;
  container.style.setProperty('--grid-size', `${cell}px`);
  const number = container.querySelector('.page-number');
  if (number) number.style.fontSize = `${cell * .85}px`;
  const text = container.querySelector('.page-text, .book-contents');
  if (!text) return;
  if (container.classList.contains('flow-text')) {
    text.style.fontSize = `${28 * state.zoom}px`;
    return;
  }
  // Keep a generous uniform font; longer poems scroll rather than shrink.
  const fontSize = Math.max(18, cell * 1.5);
  text.style.fontSize = `${fontSize}px`;
  text.style.lineHeight = '1.4';
  if (text.classList.contains('book-contents')) return;
  const inner = text.parentElement;
  text.style.margin = '0';
  const desiredX = width * Number(inner.dataset.centerX) / 100 - inner.offsetLeft - text.offsetWidth / 2;
  const desiredY = container.clientHeight * Number(inner.dataset.centerY) / 100 - inner.offsetTop - text.offsetHeight / 2;
  text.style.marginLeft = `${Math.max(0, Math.min(inner.clientWidth - text.offsetWidth, desiredX))}px`;
  text.style.marginTop = `${Math.max(0, Math.min(inner.clientHeight - text.offsetHeight, desiredY))}px`;
}

function renderPage(container, page, index) {
  container.innerHTML = makePage(page);
  container.dataset.index = index;
  container.setAttribute('aria-label', page?.number ? `Страница ${page.number}` : page?.kind === 'contents' ? 'Рукописное содержание' : page?.kind === 'back' ? 'Задняя обложка' : 'Титульная страница');
  const image = container.querySelector('.ink-image');
  image?.addEventListener('error', () => {
    const template = document.createElement('template');
    template.innerHTML = makeTranscript(page);
    const inner = template.content.firstElementChild;
    image.replaceWith(inner);
    fitPage(container);
  }, { once: true });
  fitPage(container);
}

function labelFor(page) {
  if (!page) return '';
  return page.number ? String(page.number) : ({ title: 'Начало', contents: 'Содержание', back: 'Задняя обложка' }[page.kind] || '');
}

function updateNavigation() {
  const pages = state.data.pages;
  const visible = pages.slice(state.cursor, state.cursor + step());
  const labels = visible.map(labelFor);
  ui.indicator.textContent = labels.join(' · ');
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
  state.cursor = Math.min(state.cursor, lastReadingCursor());
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

let coverAlignmentFrame;
let coverAlignmentTimer;
function alignCoverButton({ afterTurn = false } = {}) {
  cancelAnimationFrame(coverAlignmentFrame);
  clearTimeout(coverAlignmentTimer);
  if (afterTurn && !reducedMotion.matches) {
    // Keep the control still while perspective temporarily stretches the lower edge.
    coverAlignmentTimer = setTimeout(alignCoverButton, 1320);
    return;
  }
  const until = performance.now() + (reducedMotion.matches ? 50 : 1450);
  const align = () => {
    if (state.opened) return;
    const cover = ui.book.classList.contains('show-back') ? $('.cover-rear') : $('#front-cover');
    const left = cover.querySelector('.anchor-left').getBoundingClientRect();
    const right = cover.querySelector('.anchor-right').getBoundingClientRect();
    const float = $('#book-float').getBoundingClientRect();
    const button = $('#rotate-cover');
    button.style.setProperty('--cover-center', `${(left.left + right.left) / 2 - float.left}px`);
    button.style.setProperty('--cover-control-top', `${Math.max(left.top, right.top) - float.top + 22}px`);
    if (performance.now() < until) coverAlignmentFrame = requestAnimationFrame(align);
  };
  coverAlignmentFrame = requestAnimationFrame(align);
}

const ribbonLinks = [...document.querySelectorAll('.ribbon-segment')].map((element) => ({ element, angle: 0, velocity: 0 }));
let ribbonFrame;
let ribbonVisible = false;
let ribbonLastTime;
function nudgeRibbon(strength) {
  if (reducedMotion.matches) return;
  ribbonLinks.forEach((link, index) => {
    link.velocity = Math.max(-60, Math.min(60, link.velocity + strength * (1 + index * .16)));
  });
}
function animateRibbon(time) {
  if (!ribbonVisible || document.hidden || reducedMotion.matches) { ribbonFrame = null; return; }
  const dt = Math.min((time - (ribbonLastTime || time)) / 1000, .033);
  ribbonLastTime = time;
  const breeze = Math.sin(time / 1000 * Math.PI * 2 / 7) * .45;
  ribbonLinks.forEach((link, index) => {
    const parentAngle = index ? ribbonLinks[index - 1].angle : breeze;
    const target = parentAngle * .32 + Math.sin(time / 2100 - index * .55) * .25;
    link.velocity += ((target - link.angle) * (58 - index * 5) - link.velocity * (8 - index * .45)) * dt;
    link.angle += link.velocity * dt;
    link.element.style.transform = `rotateZ(${link.angle.toFixed(3)}deg) rotateX(${(link.angle * .22).toFixed(3)}deg) rotateY(${(link.angle * .35).toFixed(3)}deg)`;
    link.element.style.setProperty('--fold-shadow', Math.min(.2, .04 + Math.abs(link.angle) * .012).toFixed(3));
  });
  ribbonFrame = requestAnimationFrame(animateRibbon);
}
function updateRibbonMotion() {
  cancelAnimationFrame(ribbonFrame);
  ribbonLastTime = null;
  ribbonFrame = null;
  if (reducedMotion.matches) {
    ribbonLinks.forEach((link) => {
      link.angle = link.velocity = 0;
      link.element.style.transform = '';
      link.element.style.removeProperty('--fold-shadow');
    });
  } else if (ribbonVisible && !document.hidden) ribbonFrame = requestAnimationFrame(animateRibbon);
}

async function openBook() {
  if (!state.data || state.opened || state.busy) return;
  state.busy = true;
  if (ui.book.classList.contains('show-back')) {
    ui.book.classList.remove('show-back');
    await pause(reducedMotion.matches ? 1 : 650);
  }
  state.opened = true;
  nudgeRibbon(12);
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
  nudgeRibbon(-12);
  document.body.classList.remove('reading');
  $('#front-cover').setAttribute('aria-hidden', 'false');
  $('#front-cover').tabIndex = 0;
  ui.experience.classList.remove('open');
  ui.book.classList.remove('show-back');
  ui.toolbar.hidden = true;
  ui.navigation.hidden = true;
  renderSpread();
  history.replaceState(null, '', location.pathname + location.search);
  $('#open-button').focus({ preventScroll: true });
  $('#rotate-cover').innerHTML = 'Оборот обложки <span>↻</span>';
  alignCoverButton();
}

async function showBackCover() {
  if (state.busy) return;
  state.cursor = lastReadingCursor();
  await closeBook();
  state.busy = true;
  ui.book.classList.add('show-back');
  $('#rotate-cover').innerHTML = 'Лицевая обложка <span>↻</span>';
  history.replaceState(null, '', `${location.pathname}${location.search}#page=back`);
  alignCoverButton({ afterTurn: true });
  await pause(reducedMotion.matches ? 1 : 1320);
  state.busy = false;
  updateNavigation();
  ui.announcement.textContent = 'Задняя обложка книги.';
}

async function turnPage(direction) {
  if (!state.opened || state.busy) return;
  const target = Math.max(0, Math.min(lastCursor(), state.cursor + direction * step()));
  if (target === state.cursor) return;
  if (target >= backIndex()) return showBackCover();
  state.busy = true;
  nudgeRibbon(direction * 7);
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
  if (id === 'back') return showBackCover();
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

const closingDialogs = new WeakMap();
function showDialog(dialog) {
  if (closingDialogs.has(dialog)) return;
  if (!dialog.open) dialog.showModal();
  document.body.style.overflow = 'hidden';
}

function closeDialog(dialog) {
  if (closingDialogs.has(dialog)) return closingDialogs.get(dialog);
  if (!dialog.open) return Promise.resolve();
  if (reducedMotion.matches || !dialog.matches('#about-dialog, #contents-dialog')) {
    dialog.close();
    return Promise.resolve();
  }
  dialog.classList.add('is-closing');
  const finished = new Promise((resolve) => {
    setTimeout(() => {
      dialog.close();
      dialog.classList.remove('is-closing');
      closingDialogs.delete(dialog);
      resolve();
    }, 280);
  });
  closingDialogs.set(dialog, finished);
  return finished;
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
    button.addEventListener('click', async () => {
      await closeDialog($('#contents-dialog'));
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
    if (state.busy) return;
    ui.book.classList.toggle('show-back');
    nudgeRibbon(ui.book.classList.contains('show-back') ? 24 : -24);
    $('#rotate-cover').innerHTML = ui.book.classList.contains('show-back') ? 'Лицевая обложка <span>↻</span>' : 'Оборот обложки <span>↻</span>';
    alignCoverButton({ afterTurn: true });
  });
  $('#close-book').addEventListener('click', closeBook);
  let wheelTotal = 0;
  let lastWheelAt = 0;
  let wheelLocked = false;
  ui.experience.addEventListener('wheel', (event) => {
    if (!state.data || event.ctrlKey || document.querySelector('dialog[open]') || Math.abs(event.deltaX) > Math.abs(event.deltaY) || !event.deltaY) return;
    const now = performance.now();
    if (now - lastWheelAt > 220) { wheelTotal = 0; wheelLocked = false; }
    lastWheelAt = now;
    const transcript = event.target.closest('.transcript-scroll');
    if (state.opened && transcript && transcript.scrollHeight > transcript.clientHeight + 1) {
      const canScroll = event.deltaY > 0
        ? transcript.scrollTop + transcript.clientHeight < transcript.scrollHeight - 1
        : transcript.scrollTop > 1;
      if (canScroll) { wheelLocked = true; return; }
    }
    event.preventDefault();
    if (state.busy || wheelLocked) return;
    wheelTotal += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? ui.stage.clientHeight : 1);
    if (Math.abs(wheelTotal) < 45) return;
    wheelLocked = true;
    const direction = Math.sign(wheelTotal);
    wheelTotal = 0;
    if (!state.opened) {
      state.cursor = ui.book.classList.contains('show-back') ? lastReadingCursor() : 0;
      openBook().then(() => { if (state.opened) updateHash(); });
    } else if (direction < 0 && state.cursor === 0) {
      closeBook();
    } else {
      turnPage(direction);
    }
  }, { passive: false });
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
    $(`#zoom-${direction < 0 ? 'prev' : 'next'}`).addEventListener('click', async () => {
      if (state.zoomIndex + direction >= backIndex()) {
        await closeDialog($('#zoom-dialog'));
        return showBackCover();
      }
      state.zoomIndex += direction;
      state.cursor = Math.floor(state.zoomIndex / step()) * step();
      renderSpread();
      renderZoom();
      $('#zoom-scroll').scrollTo(0, 0);
      updateHash(state.data.pages[state.zoomIndex].id);
    });
  }
  document.querySelectorAll('dialog').forEach((dialog) => {
    dialog.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => closeDialog(dialog)));
    dialog.addEventListener('cancel', (event) => {
      if (!dialog.matches('#about-dialog, #contents-dialog')) return;
      event.preventDefault();
      closeDialog(dialog);
    });
    dialog.addEventListener('close', () => {
      if (!document.querySelector('dialog[open]')) document.body.style.overflow = '';
    });
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog(dialog);
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
    if (Number(ui.range.value) * step() >= backIndex()) return showBackCover();
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
  ui.stage.addEventListener('pointerdown', (event) => {
    if (!state.opened || state.busy || event.button !== 0 || event.target.closest('button')) return;
    pointer = { x: event.clientX, y: event.clientY, id: event.pointerId };
  });
  ui.stage.addEventListener('pointerup', (event) => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;
    pointer = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.25) {
      turnPage(dx < 0 ? 1 : -1);
    }
  });
  ui.stage.addEventListener('pointercancel', () => { pointer = null; });
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
  new ResizeObserver(alignCoverButton).observe(ui.stage);
  new IntersectionObserver(([entry]) => {
    ribbonVisible = entry.isIntersecting;
    updateRibbonMotion();
  }).observe($('#book-float'));
  document.addEventListener('visibilitychange', updateRibbonMotion);
  reducedMotion.addEventListener('change', updateRibbonMotion);
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
    const response = await fetch('assets/book.json?v=2');
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
    const message = document.createElement('p');
    message.className = 'intro-description';
    message.textContent = 'Не удалось загрузить книгу. Попробуйте обновить страницу.';
    $('#open-button').before(message);
    document.body.classList.remove('loading');
  }
}

init();
