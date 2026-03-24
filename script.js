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

  content.style.display = 'block';

  const targetH = panel.id === 'info-panel'
    ? window.innerHeight * (window.innerWidth <= 768 ? 0.5 : 0.4)
    : panel.scrollHeight;

  panel.style.width  = startW + 'px';
  panel.style.height = startH + 'px';
  void panel.offsetWidth;

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


/* ── Load JSON data ──────────────────────────────────────── */

async function loadData() {
  try {
    const [worksRes, infoRes] = await Promise.all([
      fetch('works.json'),
      fetch('info.json')
    ]);
    const worksData = await worksRes.json();
    const infoData  = await infoRes.json();

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

    const infoContent = document.getElementById('info-content');
    infoData.sections.forEach(section => {
      const div   = document.createElement('div');
      div.className = 'info-section';
      const label = document.createElement('span');
      label.className = 'info-label h2';
      label.textContent = section.label;
      const value = document.createElement('span');
      value.className = 'info-value h2';
      value.textContent = section.content;
      div.appendChild(label);
      div.appendChild(value);
      infoContent.appendChild(div);
    });
  } catch (err) {
    console.warn('Could not load data. Serve via a local HTTP server.', err);
  }
}

loadData();


/* ── Project overlay ─────────────────────────────────────── */

const overlay      = document.getElementById('project-overlay');
const overlayClose = document.getElementById('overlay-close');
const overlayBody  = document.getElementById('overlay-body');
let currentSlug    = null;

async function openOverlay(title, slug) {
  if (!slug) return;
  if (slug === currentSlug && overlay.classList.contains('is-open')) return;

  currentSlug = slug;
  overlayBody.innerHTML = '';

  if (window.innerWidth <= 768 && infoPanel.classList.contains('is-open')) {
    closePanel(infoPanel);
  }

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
        if (item.type !== 'gallery') {
          el.classList.add('media-item');
          mediaElements.push(el);
        }
        overlayBody.appendChild(el);
      }
    });

    setTimeout(() => {
      mediaElements.forEach((el, i) => {
        setTimeout(() => el.classList.add('visible'), i * 80);
      });
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
