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
  if (window.innerWidth <= 768 && infoPanel.classList.contains('is-open')) closePanel(infoPanel);

  const resumeData = [
    {
      section: 'Education',
      type: 'detailed',
      entries: [
        { date: 'Sept 2020 \u2013 April 2026', title: 'ArtCenter College of Design', location: 'Pasadena, CA', desc: 'Bachelor of Fine Arts in Graphic Design' },
        { date: 'Sept 2019 \u2013 May 2020', title: 'Woodbury University', location: 'Burbank, CA', desc: 'Bachelor of Interdisciplinary Study' }
      ]
    },
    {
      section: 'Experience',
      type: 'detailed',
      entries: [
        { date: 'Sept 2020 \u2013 Ongoing', title: 'Freelance Graphic & Motion Designer', location: 'Independent', desc: 'Design print, motion, interaction, and brand systems for startups and agencies in gaming, tech, fine art, and entertainment.' },
        { date: 'Jan 2020 \u2013 April 2026', title: 'Teaching Assistant', location: 'ArtCenter College of Design, Los Angeles, CA', desc: 'Assisted faculty across undergraduate and graduate design courses, leading critiques and supporting concept and system development across print, motion, and transmedia. Provided technical and conceptual guidance during reviews and production.' },
        { date: 'Jan 2026 \u2013 Feb 2026 / Feb 2024 \u2013 Mar 2024', title: 'Freelance Graphic Designer', location: 'Massive Assembly, Los Angeles, CA', desc: 'Developed brand identity systems for Riot Games\u2019 2024 VALORANT World Championship Tour and League of Legends MSI 26, producing scalable assets for global event branding.' },
        { date: 'Oct 2025 \u2013 Dec 2025', title: 'Design Residency', location: 'Fork, Seoul, Korea', desc: 'Developed original work with guidance from designer Moonsick Gang from research and experimentation through production and public exhibition.' },
        { date: 'May 2025 \u2013 Aug 2025', title: 'Berlin Study Away', location: 'ArtCenter College of Design, Berlin, Germany', desc: 'Developed a body of design work informed by direct engagement with research on Berlin\u2019s cultural, social, and urban infrastructures during a three-month study-away semester.' },
        { date: 'Jan 2025 \u2013 May 2025', title: 'Freelance Junior Motion Designer', location: 'Hornet, New York, NY', desc: 'Designed and animated motion graphics for internal and external projects in collaboration with the studio team. Contributed to client-facing work for brands including Apple, Sonic, and Buffalo Wild Wings.' },
        { date: 'Jan 2025 \u2013 May 2025', title: 'Freelance Graphic & Motion Designer', location: '10 Summers/DJ Mustard, Los Angeles, CA', desc: 'Designed brand and identity system for DJ Mustard, including logo, typography, 2D and 3D animation, vinyl album artwork, title cards, and supporting visual assets.' },
        { date: 'May 2021 \u2013 April 2025', title: 'Graphic Design Department Events Team Lead', location: 'ArtCenter College of Design, Los Angeles, CA', desc: 'Designed and managed the ArtCenter Designer Speaker Series, coordinating outreach to international designers and producing promotional assets for department events and communications.' },
        { date: 'April 2024 \u2013 Aug 2024', title: 'Sponsored Studio', location: 'Samsung x ArtCenter, Los Angeles, CA', desc: 'Collaborated cross-disciplinarily on a hypothetical Samsung Galaxy campaign, designing a complete brand identity system to support product concepts and visuals.' },
        { date: 'May 2023 \u2013 Sept 2023', title: 'Graphic Design Intern', location: 'Massive Assembly', desc: 'Designed a 250-page process book documenting four cinematic projects from concept to final render. Created internal motion assets for presentations and communications.' },
        { date: 'Jan 2022 \u2013 May 2022', title: 'Orientation Leader', location: 'ArtCenter College of Design, Los Angeles, CA', desc: 'Assisted incoming students in navigating the academic, social, and cultural environment of ArtCenter. Designed digital assets to support orientation programming and communications.' },
        { date: 'Jan 2021 \u2013 Jan 2022', title: 'Graphic Design Representative', location: 'ArtCenter College of Design, Los Angeles, CA', desc: 'Organized events and workshops, addressed student feedback with strategic solutions, and collaborated with other department representatives and chairs to enhance the ArtCenter experience.' }
      ]
    },
    {
      section: 'Awards &\nRecognition',
      type: 'awards',
      entries: [
        { text: 'Communication Arts, Typography Annual', date: '2025' },
        { text: 'Communication Arts, Design Annual x2', date: '2024' },
        { text: 'World\u2019s Best Typography 45, Judge\u2019s Choice', date: '2024' },
        { text: 'TDC Young Ones, Top 3 + Winner Brand & Identity + Winner Motion', date: '2024' },
        { text: 'ADC Young Ones, Merit', date: '2024' },
        { text: 'C2A, Best of Best in Animation + Winner Brand Identity', date: '2024' },
        { text: 'Kyoto Global Design Awards, Visual Winner x3', date: '2024' },
        { text: 'Core77, Brand and Identity Student Winner + Communication Design Student Notable', date: '2024\u201323' },
        { text: 'Graphis New Talent, Platinum + Gold x2 + Silver', date: '2024\u201323' },
        { text: 'DNA Paris, Communication + Branding Communication + Typography x2', date: '2024' },
        { text: 'Design MasterPrize, Best of Best Brand Identity', date: '2024' },
        { text: 'IDA, Bronze', date: '2024' },
        { text: 'Indigo Design Award, Gold Computer Animation + Silver Branding x2', date: '2024' },
        { text: 'Cidea Design Award, NewStar Award + Design Award', date: '2024' },
        { text: 'World Brand Design Society, Bronze', date: '2024' }
      ]
    },
    {
      section: 'Exhibition',
      type: 'simple',
      entries: [
        { date: '2026', text: 'Fork Unfolding #3, Seoul Korea' },
        { date: '2024\u201325', text: 'TDC70 Traveling Exhibition, ENCO' },
        { date: '2024', text: 'HMCT Gallery, Another Specimen Poster, LA' },
        { date: '2021\u201322', text: 'ArtCenter Student Gallery, SU21 Poster, LA' }
      ]
    },
    {
      section: 'Press',
      type: 'simple',
      entries: [
        { date: '2025', text: 'Bold Journey, Meet Alan Xu' },
        { date: '2025\u201326', text: 'ArtCenter View Book' },
        { date: '2024', text: 'Graphic Design USA, Student to Watch' },
        { date: '2024', text: 'Graphis Blog, ArtCenter Student\u2019s Platinum Brand Play' },
        { date: '2024', text: 'Indigo Design Award Interview with Alan Xu' },
        { date: '2024', text: 'Graphis Blog, New Talent Elevates Their Design Game' }
      ]
    }
  ];

  resumeData.forEach(section => {
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'resume-section';

    section.entries.forEach((entry, i) => {
      const row = document.createElement('div');
      row.className = 'resume-row' + (section.type !== 'detailed' ? ' resume-row-compact' : '');

      const col1 = document.createElement('div');
      col1.className = 'h2';
      if (i === 0) col1.textContent = section.section;
      row.appendChild(col1);

      const col2 = document.createElement('div');

      if (section.type === 'detailed') {
        const d = document.createElement('div');
        d.className = 'h2';
        d.textContent = entry.date;
        col2.appendChild(d);
        const t = document.createElement('div');
        t.className = 'h2';
        t.textContent = entry.title;
        col2.appendChild(t);
        const l = document.createElement('div');
        l.className = 'h2';
        l.textContent = entry.location;
        col2.appendChild(l);
        const desc = document.createElement('div');
        desc.className = 'caption';
        desc.textContent = entry.desc;
        col2.appendChild(desc);
      } else if (section.type === 'awards') {
        const t = document.createElement('span');
        t.className = 'h2';
        t.textContent = entry.text + ' ';
        col2.appendChild(t);
        const d = document.createElement('span');
        d.className = 'caption';
        d.textContent = entry.date;
        col2.appendChild(d);
      } else {
        const d = document.createElement('span');
        d.className = 'h2';
        d.textContent = entry.date + ' ';
        col2.appendChild(d);
        const t = document.createElement('span');
        t.className = 'h2';
        t.textContent = entry.text;
        col2.appendChild(t);
      }

      row.appendChild(col2);
      sectionDiv.appendChild(row);
    });

    overlayBody.appendChild(sectionDiv);
  });

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
