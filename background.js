const TILE_SIZE  = 200;
const GAP        = 75;
const STEP       = TILE_SIZE + GAP;
const DEFAULT_VX = -0.3;
const DEFAULT_VY =  0.3;
const LERP_DRAG  = 0.06;
const POLL_MS    = 4000;

let media = [];
let tiles = [];
let numCols, numRows;

let offsetX = 0, offsetY = 0;
let targetX  = 0, targetY  = 0;
let vx = DEFAULT_VX, vy = DEFAULT_VY;

let isDragging  = false;
let lastClientX, lastClientY;
let dragVX = 0, dragVY = 0;

const knownSrcs = new Set();
const container  = document.getElementById('bg-grid');

/* ── Autoplay unlock for Safari ─────────────────────────── */

const blockedVideos = new Set();
let   unlocked = false;

function unlockVideos() {
  if (unlocked) return;
  unlocked = true;
  blockedVideos.forEach(v => v.play().catch(() => {}));
  blockedVideos.clear();
  ['click', 'touchstart', 'wheel', 'keydown'].forEach(evt =>
    document.removeEventListener(evt, unlockVideos, { capture: true })
  );
}

['click', 'touchstart', 'wheel', 'keydown'].forEach(evt =>
  document.addEventListener(evt, unlockVideos, { capture: true, once: false })
);

/* ── Directory listing ───────────────────────────────────── */

const MEDIA_EXT = /\.(mp4|webm|mov|jpg|jpeg|png|gif|webp|avif)$/i;
const VIDEO_EXT = /\.(mp4|webm|mov)$/i;

async function fetchMediaList() {
  try {
    const res  = await fetch('background/');
    if (!res.ok) throw new Error();
    const html = await res.text();
    const doc  = new DOMParser().parseFromString(html, 'text/html');
    return [...doc.querySelectorAll('a[href]')]
      .map(a => a.getAttribute('href'))
      .filter(href => MEDIA_EXT.test(href))
      .map(filename => ({
        type: VIDEO_EXT.test(filename) ? 'video' : 'image',
        src:  'background/' + filename
      }));
  } catch {
    const res  = await fetch('background.json');
    const data = await res.json();
    return data.media;
  }
}

/* ── Concurrency queue: max 3 loads at once ─────────────── */

function makeQueue(limit) {
  let active = 0;
  const pending = [];
  function next() {
    while (active < limit && pending.length) {
      active++;
      const { fn, resolve } = pending.shift();
      fn().then(v => { active--; resolve(v); next(); });
    }
  }
  return fn => new Promise(resolve => { pending.push({ fn, resolve }); next(); });
}
const loadQueue = makeQueue(3);

/* ── Tooltip ─────────────────────────────────────────────── */

const tooltip = document.createElement('div');
tooltip.id = 'bg-tooltip';
document.body.appendChild(tooltip);

function clampTooltip(x, y) {
  let left = x + 12, top = y + 12;
  const tw = tooltip.offsetWidth, th = tooltip.offsetHeight;
  if (left + tw > window.innerWidth)  left = x - tw - 4;
  if (top + th > window.innerHeight)  top  = y - th - 4;
  if (left < 0) left = 4;
  if (top  < 0) top  = 4;
  tooltip.style.left = left + 'px';
  tooltip.style.top  = top  + 'px';
}

function showTooltip(name, x, y) {
  tooltip.textContent = name;
  tooltip.style.display = 'block';
  clampTooltip(x, y);
}

function moveTooltip(x, y) { clampTooltip(x, y); }
function hideTooltip()      { tooltip.style.display = 'none'; }

/* ── Media element creation ──────────────────────────────── */

function createMedia(tile, item) {
  return new Promise(resolve => {
    if (item.type === 'video') {
      const video = document.createElement('video');
      video.muted    = true;
      video.loop     = true;
      video.autoplay = true;
      video.playsInline = true;
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      video.setAttribute('autoplay', '');
      video.preload = 'auto';
      video.src = item.src;
      tile.appendChild(video);
      video.play().then(() => {
        blockedVideos.delete(video);
      }).catch(() => {
        blockedVideos.add(video);
      });
      video.addEventListener('playing', resolve, { once: true });
      setTimeout(resolve, 3000);
    } else {
      const img = document.createElement('img');
      img.addEventListener('load',  resolve, { once: true });
      img.addEventListener('error', resolve, { once: true });
      img.src = item.src;
      tile.appendChild(img);
    }
  });
}

/* ── Swap a tile's media (fade out → swap → fade in) ─────── */

function swapTile(tile, item) {
  tile.classList.remove('visible');
  setTimeout(() => {
    tile.innerHTML = '';
    loadQueue(() => createMedia(tile, item)).then(() => tile.classList.add('visible'));
  }, 400);
}

/* ── Build initial grid ──────────────────────────────────── */

function buildGrid() {
  numCols = Math.ceil(window.innerWidth  / STEP) + 3;
  numRows = Math.ceil(window.innerHeight / STEP) + 3;

  const entries = [];

  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      const tile = document.createElement('div');
      tile.className = 'bg-tile';
      tile._col = c;
      tile._row = r;
      positionTile(tile);
      container.appendChild(tile);
      tiles.push(tile);

      const item = media[Math.floor(Math.random() * media.length)];
      const name = item.src.split('/').pop();

      tile.addEventListener('mouseenter', e => { if (!isOverlayOpen()) showTooltip(name, e.clientX, e.clientY); });
      tile.addEventListener('mousemove',  e => { if (isOverlayOpen()) hideTooltip(); else moveTooltip(e.clientX, e.clientY); });
      tile.addEventListener('mouseleave', hideTooltip);

      const promise = loadQueue(() => createMedia(tile, item));
      entries.push({ tile, promise });
    }
  }

  entries.sort(() => Math.random() - 0.5).forEach(({ tile, promise }, i) => {
    promise.then(() => setTimeout(() => tile.classList.add('visible'), i * 40));
  });
}

/* ── Poll for new media ──────────────────────────────────── */

async function checkForNewMedia() {
  try {
    const list     = await fetchMediaList();
    const newItems = list.filter(item => !knownSrcs.has(item.src));
    if (!newItems.length) return;

    newItems.forEach(item => { knownSrcs.add(item.src); media.push(item); });

    newItems.forEach(item => {
      [...tiles].sort(() => Math.random() - 0.5)
        .slice(0, Math.min(3, tiles.length))
        .forEach(tile => swapTile(tile, item));
    });
  } catch (e) {
    console.warn('Media poll failed:', e);
  }
}

/* ── Init ─────────────────────────────────────────────────── */

async function initBackground() {
  try {
    const list = await fetchMediaList();
    if (!list.length) return;
    list.forEach(item => { knownSrcs.add(item.src); media.push(item); });
  } catch (e) {
    console.error('Could not load background media:', e);
    return;
  }

  buildGrid();
  requestAnimationFrame(tick);
  bindDrag();
  setInterval(checkForNewMedia, POLL_MS);
}

/* ── Animation tick ──────────────────────────────────────── */

function tick() {
  if (!isDragging) {
    vx += (DEFAULT_VX - vx) * 0.015;
    vy += (DEFAULT_VY - vy) * 0.015;
    targetX += vx;
    targetY += vy;
  }
  offsetX += (targetX - offsetX) * LERP_DRAG;
  offsetY += (targetY - offsetY) * LERP_DRAG;
  tiles.forEach(positionTile);
  requestAnimationFrame(tick);
}

function positionTile(tile) {
  const totalW = numCols * STEP;
  const totalH = numRows * STEP;
  const x = ((tile._col * STEP + offsetX) % totalW + totalW) % totalW - STEP;
  const y = ((tile._row * STEP + offsetY) % totalH + totalH) % totalH - STEP;
  tile.style.transform = `translate(${x}px, ${y}px)`;
}

/* ── Drag & scroll ───────────────────────────────────────── */

function isOverlayOpen() {
  return document.getElementById('project-overlay').classList.contains('is-open');
}

const isTouchDevice = 'ontouchstart' in window;

function bindDrag() {
  /* ── Mouse (desktop) ── */

  container.addEventListener('mousedown', e => {
    if (isOverlayOpen()) return;
    isDragging = true;
    lastClientX = e.clientX; lastClientY = e.clientY;
    dragVX = dragVY = 0;
    container.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const dx = e.clientX - lastClientX;
    const dy = e.clientY - lastClientY;
    targetX += dx; targetY += dy;
    dragVX = dx; dragVY = dy;
    lastClientX = e.clientX; lastClientY = e.clientY;
  });

  window.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    container.style.cursor = 'grab';
    vx = dragVX; vy = dragVY;
  });

  /* ── Click to collapse panels (desktop only) ── */

  container.addEventListener('click', e => {
    if (isTouchDevice || isOverlayOpen()) return;
    if (typeof closeAll === 'function') closeAll();
  });

  /* ── Wheel ── */

  container.addEventListener('wheel', e => {
    if (isOverlayOpen()) return;
    e.preventDefault();
    targetX -= e.deltaX;
    targetY -= e.deltaY;
    vx = -e.deltaX * 0.1;
    vy = -e.deltaY * 0.1;
  }, { passive: false });

  /* ── Touch (mobile) ── */

  container.addEventListener('touchstart', e => {
    if (isOverlayOpen()) return;
    const t = e.touches[0];
    isDragging = true;
    lastClientX = t.clientX; lastClientY = t.clientY;
    dragVX = dragVY = 0;
    // Collapse panels on any touch (tap or drag)
    if (typeof closeAll === 'function') closeAll();
  }, { passive: true });

  window.addEventListener('touchmove', e => {
    if (!isDragging) return;
    const t = e.touches[0];
    const dx = t.clientX - lastClientX;
    const dy = t.clientY - lastClientY;
    targetX += dx; targetY += dy;
    dragVX = dx; dragVY = dy;
    lastClientX = t.clientX; lastClientY = t.clientY;
  }, { passive: true });

  window.addEventListener('touchend', () => {
    if (!isDragging) return;
    isDragging = false;
    vx = dragVX; vy = dragVY;
  });
}

initBackground();
