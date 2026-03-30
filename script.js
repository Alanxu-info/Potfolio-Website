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
  addSection('Short Bio:', bioImg);

  const linksDiv = document.createElement('div');
  linksDiv.className = 'info-section';
  [
    linkEl('Resume', null, openResumeOverlay),
    linkEl('LinkedIn', 'https://www.linkedin.com/in/alan-xu-3093541b7/'),
    linkEl('Instagram', 'https://www.instagram.com/alanxu.info/')
  ].forEach(el => linksDiv.appendChild(el));
  infoContent.appendChild(linksDiv);
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
  overlayBody.style.overflowY = '';
  overlayBody.style.padding = '';
  if (window.innerWidth <= 768 && infoPanel.classList.contains('is-open')) closePanel(infoPanel);

  function makeEntry(lines) {
    const div = document.createElement('div');
    div.className = 'resume-entry';
    lines.forEach(({ text, cls }) => {
      const p = document.createElement('div');
      p.className = cls;
      p.textContent = text;
      div.appendChild(p);
    });
    return div;
  }

  function makeSection(title, entries) {
    const div = document.createElement('div');
    div.className = 'resume-col-section';
    const h = document.createElement('div');
    h.className = 'h2 resume-col-section-title';
    h.textContent = title;
    div.appendChild(h);
    entries.forEach(e => div.appendChild(e));
    return div;
  }

  function makeCompactEntry(text, date) {
    const div = document.createElement('div');
    div.className = 'resume-entry resume-entry-compact';
    const t = document.createElement('span');
    t.className = 'h2';
    t.textContent = text + ' ';
    div.appendChild(t);
    const d = document.createElement('span');
    d.className = 'caption';
    d.textContent = date;
    div.appendChild(d);
    return div;
  }

  const grid = document.createElement('div');
  grid.className = 'resume-columns';

  // Column 1: Education
  const col1 = document.createElement('div');
  col1.appendChild(makeSection('Education', [
    makeEntry([
      { text: 'Sept 2020 \u2013 April 2026', cls: 'h2' },
      { text: 'ArtCenter College of Design', cls: 'h2' },
      { text: 'Pasadena, CA', cls: 'h2' },
      { text: 'Bachelor of Fine Arts in Graphic Design', cls: 'caption' }
    ]),
    makeEntry([
      { text: 'Sept 2019 \u2013 May 2020', cls: 'h2' },
      { text: 'Woodbury University', cls: 'h2' },
      { text: 'Burbank, CA', cls: 'h2' },
      { text: 'Bachelor of Interdisciplinary Study', cls: 'caption' }
    ])
  ]));
  grid.appendChild(col1);

  // Column 2: Experience
  const col2 = document.createElement('div');
  col2.appendChild(makeSection('Experience', [
    makeEntry([
      { text: 'Sept 2020 \u2013 Ongoing', cls: 'h2' },
      { text: 'Freelance Graphic & Motion Designer', cls: 'h2' },
      { text: 'Independent', cls: 'h2' },
      { text: 'Design print, motion, interaction, and brand systems for startups and agencies in gaming, tech, fine art, and entertainment.', cls: 'caption' }
    ]),
    makeEntry([
      { text: 'Jan 2020 \u2013 April 2026', cls: 'h2' },
      { text: 'Teaching Assistant', cls: 'h2' },
      { text: 'ArtCenter College of Design, Los Angeles, CA', cls: 'h2' },
      { text: 'Assisted faculty across undergraduate and graduate design courses, leading critiques and supporting concept and system development across print, motion, and transmedia. Provided technical and conceptual guidance during reviews and production.', cls: 'caption' }
    ]),
    makeEntry([
      { text: 'Jan 2026 \u2013 Feb 2026 / Feb 2024 \u2013 Mar 2024', cls: 'h2' },
      { text: 'Freelance Graphic Designer', cls: 'h2' },
      { text: 'Massive Assembly, Los Angeles, CA', cls: 'h2' },
      { text: 'Developed brand identity systems for Riot Games\u2019 2024 VALORANT World Championship Tour and League of Legends MSI 26, producing scalable assets for global event branding.', cls: 'caption' }
    ]),
    makeEntry([
      { text: 'May 2023 \u2013 Sept 2023', cls: 'h2' },
      { text: 'Graphic Design Intern', cls: 'h2' },
      { text: 'Massive Assembly', cls: 'h2' },
      { text: 'Designed a 250-page process book documenting four cinematic projects from concept to final render. Created internal motion assets for presentations and communications.', cls: 'caption' }
    ]),
    makeEntry([
      { text: 'Oct 2025 \u2013 Dec 2025', cls: 'h2' },
      { text: 'Design Residency', cls: 'h2' },
      { text: 'Fork, Seoul, Korea', cls: 'h2' },
      { text: 'Developed original work with guidance from designer Moonsick Gang from research and experimentation through production and public exhibition.', cls: 'caption' }
    ]),
    makeEntry([
      { text: 'May 2025 \u2013 Aug 2025', cls: 'h2' },
      { text: 'Berlin Study Away', cls: 'h2' },
      { text: 'ArtCenter College of Design, Berlin, Germany', cls: 'h2' },
      { text: 'Developed a body of design work informed by direct engagement with research on Berlin\u2019s cultural, social, and urban infrastructures during a three-month study-away semester.', cls: 'caption' }
    ]),
    makeEntry([
      { text: 'Jan 2025 \u2013 May 2025', cls: 'h2' },
      { text: 'Freelance Junior Motion Designer', cls: 'h2' },
      { text: 'Hornet, New York, NY', cls: 'h2' },
      { text: 'Designed and animated motion graphics for internal and external projects in collaboration with the studio team. Contributed to client-facing work for brands including Apple, Sonic, and Buffalo Wild Wings.', cls: 'caption' }
    ]),
    makeEntry([
      { text: 'Jan 2025 \u2013 May 2025', cls: 'h2' },
      { text: 'Freelance Graphic & Motion Designer', cls: 'h2' },
      { text: '10 Summers/DJ Mustard, Los Angeles, CA', cls: 'h2' },
      { text: 'Designed brand and identity system for DJ Mustard, including logo, typography, 2D and 3D animation, vinyl album artwork, title cards, and supporting visual assets.', cls: 'caption' }
    ]),
    makeEntry([
      { text: 'April 2024 \u2013 Aug 2024', cls: 'h2' },
      { text: 'Sponsored Studio', cls: 'h2' },
      { text: 'Samsung x ArtCenter, Los Angeles, CA', cls: 'h2' },
      { text: 'Collaborated cross-disciplinarily on a hypothetical Samsung Galaxy campaign, designing a complete brand identity system to support product concepts and visuals.', cls: 'caption' }
    ]),
    makeEntry([
      { text: 'May 2021 \u2013 April 2025', cls: 'h2' },
      { text: 'Graphic Design Department Events Team Lead', cls: 'h2' },
      { text: 'ArtCenter College of Design, Los Angeles, CA', cls: 'h2' },
      { text: 'Designed and managed the ArtCenter Designer Speaker Series, coordinating outreach to international designers and producing promotional assets for department events and communications.', cls: 'caption' }
    ]),
    makeEntry([
      { text: 'Jan 2022 \u2013 May 2022', cls: 'h2' },
      { text: 'Orientation Leader', cls: 'h2' },
      { text: 'ArtCenter College of Design, Los Angeles, CA', cls: 'h2' },
      { text: 'Assisted incoming students in navigating the academic, social, and cultural environment of ArtCenter. Designed digital assets to support orientation programming and communications.', cls: 'caption' }
    ]),
    makeEntry([
      { text: 'Jan 2021 \u2013 Jan 2022', cls: 'h2' },
      { text: 'Graphic Design Representative', cls: 'h2' },
      { text: 'ArtCenter College of Design, Los Angeles, CA', cls: 'h2' },
      { text: 'Organized events and workshops, addressed student feedback with strategic solutions, and collaborated with other department representatives and chairs to enhance the ArtCenter experience.', cls: 'caption' }
    ])
  ]));
  grid.appendChild(col2);

  // Column 3: Awards, Exhibition, Press
  const col3 = document.createElement('div');

  col3.appendChild(makeSection('Awards & Recognition', [
    makeCompactEntry('Communication Arts, Typography Annual + Design Annual x2', '2025\u201324'),
    makeCompactEntry('World\u2019s Best Typography 45, Judge\u2019s Choice', '2024'),
    makeCompactEntry('TDC Young Ones, Top 3 + Winner Brand & Identity + Winner Motion', '2024'),
    makeCompactEntry('ADC Young Ones, Merit', '2024'),
    makeCompactEntry('C2A, Best of Best in Animation + Winner Brand Identity', '2024'),
    makeCompactEntry('Kyoto Global Design Awards, Visual Winner x3', '2024'),
    makeCompactEntry('Core77, Brand and Identity Student Winner + Communication Design Student Notable', '2024\u201323'),
    makeCompactEntry('Graphis New Talent, Platinum + Gold x2 + Silver', '2024\u201323'),
    makeCompactEntry('DNA Paris, Communication + Branding Communication + Typography x2', '2024'),
    makeCompactEntry('Design MasterPrize, Best of Best Brand Identity', '2024'),
    makeCompactEntry('IDA, Bronze', '2024'),
    makeCompactEntry('Indigo Design Award, Gold Computer Animation + Silver Branding x2', '2024'),
    makeCompactEntry('Cidea Design Award, NewStar Award + Design Award', '2024'),
    makeCompactEntry('World Brand Design Society, Bronze', '2024')
  ]));

  col3.appendChild(makeSection('Exhibition', [
    makeCompactEntry('Fork Unfolding #3, Seoul Korea', '2026'),
    makeCompactEntry('TDC70 Traveling Exhibition', '2024\u201325'),
    makeCompactEntry('HMCT Gallery, LA', '2024'),
    makeCompactEntry('ArtCenter Student Gallery, LA', '2021\u201322')
  ]));

  col3.appendChild(makeSection('Press', [
    makeCompactEntry('Bold Journey, Meet Alan Xu', '2025'),
    makeCompactEntry('ArtCenter View Book', '2025\u201326'),
    makeCompactEntry('Graphic Design USA, Student to Watch', '2024'),
    makeCompactEntry('Graphis Blog, ArtCenter Student\u2019s Platinum Brand Play', '2024'),
    makeCompactEntry('Indigo Design Award, Interview with Alan Xu', '2024'),
    makeCompactEntry('Graphis Blog, New Talent Elevates Their Design Game', '2024')
  ]));

  grid.appendChild(col3);
  overlayBody.appendChild(grid);

  const pdfLink = document.createElement('a');
  pdfLink.className = 'h2 info-link';
  pdfLink.textContent = 'PDF copy here :D';
  pdfLink.href = 'Other Assets/AX_Resume_26.pdf';
  pdfLink.target = '_blank';
  pdfLink.rel = 'noopener';
  overlayBody.appendChild(pdfLink);

  overlay.classList.add('is-open');
  document.getElementById('bg-grid').classList.add('blurred');
}

async function openOverlay(title, slug) {
  if (!slug) return;
  if (slug === currentSlug && overlay.classList.contains('is-open')) return;

  currentSlug = slug;
  overlayBody.innerHTML = '';
  overlayBody.style.padding = '';
  overlayBody.style.overflowY = '';

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

    const desc = document.createElement('div');
    desc.className = 'h2 overlay-description';
    data.description.split('\n\n').forEach((para, i, arr) => {
      const p = document.createElement('p');
      p.textContent = para;
      if (i < arr.length - 1) p.style.marginBottom = '10px';
      desc.appendChild(p);
    });
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
        el.muted = true;
        el.loop = true;
        el.autoplay = true;
        el.playsInline = true;
        el.setAttribute('muted', '');
        el.setAttribute('playsinline', '');
        el.style.width = '100%';
        el.style.display = 'block';
      } else if (item.type === 'duo' || item.type === 'trio' || item.type === 'quad' || item.type === 'gallery' || item.type === 'gallery-5') {
        el = document.createElement('div');
        if (item.type === 'duo') el.className = 'media-duo';
        else if (item.type === 'trio') el.className = 'media-trio';
        else if (item.type === 'quad') el.className = 'media-quad';
        else if (item.type === 'gallery-5') el.className = 'media-gallery-5';
        else el.className = 'media-gallery';
        item.items.forEach(src => {
          let child;
          if (/\.(mp4|webm|mov)$/i.test(src)) {
            child = document.createElement('video');
            child.src = `projects/${slug}/${src}`;
            child.muted = true;
            child.loop = true;
            child.autoplay = true;
            child.playsInline = true;
            child.setAttribute('muted', '');
            child.setAttribute('playsinline', '');
            child.style.width = '100%';
            child.style.display = 'block';
          } else {
            child = document.createElement('img');
            child.src = `projects/${slug}/${src}`;
            child.style.width = '100%';
            child.style.display = 'block';
          }
          child.classList.add('media-item');
          el.appendChild(child);
          mediaElements.push(child);
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
  overlayBody.style.padding = '';
  overlayBody.style.overflowY = '';
  document.getElementById('bg-grid').classList.remove('blurred');
  currentSlug = null;
}

overlayClose.addEventListener('click', closeOverlay);

document.getElementById('bg-grid').addEventListener('click', () => {
  if (overlay.classList.contains('is-open')) closeOverlay();
});
