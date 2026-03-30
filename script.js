const infoPanel  = document.getElementById('info-panel');
const worksPanel = document.getElementById('works-panel');
const allPanels  = [infoPanel, worksPanel];
const collapsedSize = new Map();


/* ── Panel open / close ──────────────────────────────────── */

function openPanel(panel) {
  const content = panel.querySelector('.panel-content');
  const startW  = panel.offsetWidth;
  const startH  = panel.offsetHeight;
  collapsedSize.set(panel.id, { w: startW, h: startH });

  // Measure target height at final width (off-screen)
  panel.style.transition = 'none';
  panel.style.width = '300px';
  content.style.display = 'block';
  panel.classList.add('is-open');
  const targetH = panel.scrollHeight;

  // Reset to collapsed size
  panel.style.width  = startW + 'px';
  panel.style.height = startH + 'px';
  panel.classList.remove('is-open');
  void panel.offsetWidth;

  // Animate to target
  panel.style.transition = '';
  panel.classList.add('is-open');
  panel.style.width  = '300px';
  panel.style.height = targetH + 'px';

  setTimeout(() => { panel.style.width = ''; }, 350);
}

function closePanel(panel) {
  const content = panel.querySelector('.panel-content');
  const saved   = collapsedSize.get(panel.id);

  panel.style.width  = panel.offsetWidth  + 'px';
  panel.style.height = panel.offsetHeight + 'px';
  void panel.offsetWidth;

  panel.classList.remove('is-open');
  panel.style.width  = saved ? saved.w + 'px' : '';
  panel.style.height = saved ? saved.h + 'px' : '';

  setTimeout(() => {
    content.style.display = 'none';
    panel.style.width  = '';
    panel.style.height = '';
    collapsedSize.delete(panel.id);
  }, 350);
}

function closeAll() {
  allPanels.forEach(p => { if (p.classList.contains('is-open')) closePanel(p); });
}

function togglePanel(panel) {
  if (panel.classList.contains('is-open')) {
    closePanel(panel);
  } else {
    if (window.innerWidth <= 768 && panel === infoPanel && overlay.classList.contains('is-open')) {
      closeOverlay();
    }
    openPanel(panel);
  }
}

document.getElementById('alan-xu-btn').addEventListener('click', () => { closeAll(); closeOverlay(); });
document.getElementById('info-btn').addEventListener('click',   () => togglePanel(infoPanel));
document.getElementById('works-btn').addEventListener('click',  () => togglePanel(worksPanel));


/* ── Info panel ──────────────────────────────────────────── */

function buildInfoPanel() {
  const infoContent = document.getElementById('info-content');

  function addSection(label, valueEl) {
    const div = document.createElement('div');
    div.className = 'info-section';
    if (label) {
      const lbl = document.createElement('span');
      lbl.className = 'info-label h2';
      lbl.textContent = label;
      div.appendChild(lbl);
    }
    div.appendChild(valueEl);
    infoContent.appendChild(div);
  }

  function textEl(content) {
    const el = document.createElement('span');
    el.className = 'info-value h2';
    el.textContent = content;
    return el;
  }

  function linkEl(text, href, onClick) {
    const el = document.createElement('a');
    el.className = 'info-value h2 info-link';
    el.textContent = text;
    if (onClick) {
      el.href = '#';
      el.addEventListener('click', e => { e.preventDefault(); onClick(); });
    } else {
      el.href = href;
      if (!href.startsWith('mailto:')) { el.target = '_blank'; el.rel = 'noopener'; }
    }
    return el;
  }

  // Live clock
  const clock = document.createElement('span');
  clock.className = 'info-value h2';
  function updateClock() {
    clock.textContent = new Date().toLocaleTimeString('en-US', {
      timeZone: 'America/Los_Angeles',
      hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
    }) + ' Los Angeles';
  }
  updateClock();
  setInterval(updateClock, 1000);
  addSection('Current Time & Location:', clock);

  addSection("What I'm doing right now:", textEl('Stressing about graduation'));
  addSection('Specialization:', textEl('Branding, Motion, Typography'));
  addSection('Email:', linkEl('hello@alanxu.info', 'mailto:hello@alanxu.info'));
  const linksDiv = document.createElement('div');
  linksDiv.className = 'info-section';
  [
    linkEl('Resume', null, openResumeOverlay),
    linkEl('LinkedIn', 'https://www.linkedin.com/in/alan-xu-3093541b7/'),
    linkEl('Instagram', 'https://www.instagram.com/alanxu.info/')
  ].forEach(el => linksDiv.appendChild(el));
  infoContent.appendChild(linksDiv);

  // Bio image — preload so scrollHeight is accurate when panel opens
  const bioImg = document.createElement('img');
  bioImg.className = 'info-value info-bio-img';
  bioImg.src = 'Other Assets/graphic design is my passion.png';
  const infoBtn = document.getElementById('info-btn');
  if (!bioImg.complete) {
    infoBtn.style.pointerEvents = 'none';
    bioImg.addEventListener('load',  () => { infoBtn.style.pointerEvents = ''; }, { once: true });
    bioImg.addEventListener('error', () => { infoBtn.style.pointerEvents = ''; }, { once: true });
  }
  addSection(null, bioImg);
}

buildInfoPanel();


/* ── Works list ──────────────────────────────────────────── */

async function loadWorks() {
  try {
    const res       = await fetch('works.json');
    const worksData = await res.json();

    const ul = document.createElement('ul');
    ul.className = 'project-list';
    worksData.projects.forEach(({ title, slug }) => {
      const li = document.createElement('li');
      const a  = document.createElement('a');
      a.textContent = title;
      a.className = 'h2';
      if (slug) {
        a.href = '#';
        a.addEventListener('click', e => { e.preventDefault(); openOverlay(title, slug); });
      } else {
        a.style.cursor = 'default';
      }
      li.appendChild(a);
      ul.appendChild(li);
    });
    document.getElementById('works-content').appendChild(ul);
  } catch (err) {
    console.warn('Could not load works. Serve via a local HTTP server.', err);
  }
}

loadWorks();


/* ── Project overlay ─────────────────────────────────────── */

const overlay      = document.getElementById('project-overlay');
const overlayClose = document.getElementById('overlay-close');
const overlayBody  = document.getElementById('overlay-body');
let currentSlug    = null;

function openResumeOverlay() {
  currentSlug = '__resume__';
  overlayBody.innerHTML = '';
  if (window.innerWidth <= 768 && infoPanel.classList.contains('is-open')) closePanel(infoPanel);

  const titleEl = document.createElement('p');
  titleEl.className = 'h1';
  titleEl.textContent = 'Resume';
  overlayBody.appendChild(titleEl);

  const iframe = document.createElement('iframe');
  iframe.src = 'Other Assets/AX_Resume_26.pdf';
  iframe.style.cssText = 'width:100%;height:calc(100% - 60px);border:none;';
  overlayBody.appendChild(iframe);

  overlay.classList.add('is-open');
  document.getElementById('bg-grid').classList.add('blurred');
}

async function openOverlay(title, slug) {
  if (!slug) return;
  if (slug === currentSlug && overlay.classList.contains('is-open')) return;

  currentSlug = slug;
  overlayBody.innerHTML = '';

  if (window.innerWidth <= 768 && infoPanel.classList.contains('is-open')) closePanel(infoPanel);

  overlay.classList.add('is-open');
  document.getElementById('bg-grid').classList.add('blurred');

  try {
    const res  = await fetch(`projects/${slug}/data.json`);
    const data = await res.json();
    if (slug !== currentSlug) return;

    const mediaElements = [];

    const titleEl = document.createElement('p');
    titleEl.className = 'h1';
    titleEl.textContent = data.title;
    overlayBody.appendChild(titleEl);

    const cats = document.createElement('p');
    cats.className = 'caption';
    cats.textContent = data.categories.join(', ');
    overlayBody.appendChild(cats);

    const desc = document.createElement('p');
    desc.className = 'h2 overlay-description';
    desc.textContent = data.description;
    overlayBody.appendChild(desc);

    data.media.forEach(item => {
      let el;
      if (item.type === 'image') {
        el = document.createElement('img');
        el.src = `projects/${slug}/${item.src}`;
        el.style.width = '100%';
        el.style.display = 'block';
      } else if (item.type === 'video') {
        el = document.createElement('video');
        el.src = `projects/${slug}/${item.src}`;
        el.controls = true;
        el.style.width = '100%';
        el.style.display = 'block';
      } else if (item.type === 'gallery') {
        el = document.createElement('div');
        el.className = 'media-gallery';
        item.items.forEach(src => {
          const img = document.createElement('img');
          img.src = `projects/${slug}/${src}`;
          img.style.width = '100%';
          img.style.display = 'block';
          img.classList.add('media-item');
          el.appendChild(img);
          mediaElements.push(img);
        });
      } else if (item.type === 'youtube') {
        el = document.createElement('div');
        el.style.cssText = 'position:relative;width:100%;aspect-ratio:16/9;';
        const iframe = document.createElement('iframe');
        iframe.src = item.src + '?autoplay=0';
        iframe.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;border:none;';
        iframe.allow = 'accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        el.appendChild(iframe);
      }
      if (el) {
        if (item.type !== 'gallery') { el.classList.add('media-item'); mediaElements.push(el); }
        overlayBody.appendChild(el);
      }
    });

    setTimeout(() => {
      mediaElements.forEach((el, i) => setTimeout(() => el.classList.add('visible'), i * 80));
    }, 400);
  } catch (err) {
    console.warn('Could not load project data:', err);
  }
}

function closeOverlay() {
  overlay.classList.remove('is-open');
  document.getElementById('bg-grid').classList.remove('blurred');
  currentSlug = null;
}

overlayClose.addEventListener('click', closeOverlay);
