// ═══════════════════════════════════════════════════════
//  St. Peter Anglican Church — site-fixes.js
// ═══════════════════════════════════════════════════════

// ── Toast ───────────────────────────────────────────────
(function(){
  if (!document.getElementById('toast')) {
    const t = document.createElement('div'); t.id = 'toast';
    document.body.appendChild(t);
  }
})();
window.showToast = function(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg; t.classList.add('show');
  clearTimeout(window._tt);
  window._tt = setTimeout(() => t.classList.remove('show'), 2800);
};

// ── Hero Slideshow ──────────────────────────────────────
(function() {
  let slides = [], dots = [], cur = 0, timer;

  function initSlider(photos) {
    const slider = document.getElementById('hero-slider');
    const dotsEl = document.getElementById('hs-dots');
    if (!slider || !photos.length) return;
    slides = []; dots = [];
    slider.innerHTML = '';
    if (dotsEl) dotsEl.innerHTML = '';

    photos.forEach((p, i) => {
      const slide = document.createElement('div');
      slide.className = 'hs-slide' + (i === 0 ? ' active' : '');
      slide.style.backgroundImage = `url('${p.image_path}')`;
      slider.appendChild(slide);
      slides.push(slide);

      if (dotsEl) {
        const dot = document.createElement('button');
        dot.className = 'hs-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', `Slide ${i + 1}`);
        dot.onclick = () => goSlide(i);
        dotsEl.appendChild(dot);
        dots.push(dot);
      }
    });
    if (slides.length > 1) timer = setInterval(() => goSlide(cur + 1), 60000);
  }

  window.goSlide = function(n) {
    if (!slides.length) return;
    slides[cur].classList.remove('active');
    if (dots[cur]) dots[cur].classList.remove('active');
    cur = ((n % slides.length) + slides.length) % slides.length;
    slides[cur].classList.add('active');
    if (dots[cur]) dots[cur].classList.add('active');
    clearInterval(timer);
    if (slides.length > 1) timer = setInterval(() => goSlide(cur + 1), 60000);
  };

  fetch('/api/hero-slides').then(r => r.ok ? r.json() : []).then(initSlider).catch(() => {});
})();

// ══════════════════════════════════════════════════════════
//  LANGUAGE TRANSLATION
//  Ga: Bible Society of Ghana / JW Ghana Ga conventions
//  Twi: Asante Twi (Bible Society / JW Ghana)
// ══════════════════════════════════════════════════════════

const TRANSLATIONS = {

  en: {
    // Nav
    home: 'Home', about: 'About', worship: 'Worship', guilds: 'Guilds',
    sermons: 'Sermons', events: 'Events', media: 'Media', gallery: 'Gallery',
    bcp: 'Prayer Book', contact: 'Contact', give: 'Give',
    give_church: 'Give to the Church',
    // Hero
    hero_diocese: 'Diocese of Accra · Church of the Province of West Africa · Est. 1940',
    hero_h1: 'St. Peter<br>Anglican Church',
    hero_sub: 'Nungua · Accra · Ghana',
    hero_motto: '"If God be for us, who shall be against us?" — Romans 8:31',
    btn_join: 'Join Us This Sunday', btn_story: 'Our Story',
    // Services
    svc1_type: '1st Service', svc2_type: '2nd Service', svc3_type: "Children's Service",
    svc1_day: 'English · Holy Communion', svc2_day: 'Mainly Ga · Holy Communion', svc3_day: 'Concurrent · Every Sunday',
    // Contact form
    ph_name: 'Your Name', ph_email: 'Email Address', ph_subject: 'How can we help?', ph_msg: 'Your message…',
    btn_send: 'Send Message',
    // Section headings
    sec_story: 'Our Story', sec_story_sub: 'A Legacy of Faith Since 1940',
    sec_founders: 'Our Founding Fathers', sec_founders_sub: 'Honouring the visionaries who established St Peter\'s Anglican Church in 1940.',
    sec_leadership: 'Our Leadership', sec_leadership_sub: 'Dedicated servants leading our church family in worship, pastoral care and mission.',
    sec_mission: 'Mission & Vision',
    sec_values: 'Core Values',
    sec_associate: 'Associate Priests',
    sec_officers: 'Church Officers',
    eyebrow_story: 'Our Story · Est. 29th June 1940',
    eyebrow_founders: 'Honouring Our Founders',
    eyebrow_clergy: 'Our Clergy & Officers',
    eyebrow_assoc: 'Supporting the Ministry',
    eyebrow_pcc: 'Parochial Church Council',
    eyebrow_pic: 'Priest In Charge',
    // Footer
    ft_sunday: 'Sunday Services',
    ft_svc1: '1st Service · 6:30 AM (English)', ft_svc2: '2nd Service · 9:00 AM (Mainly Ga)',
    ft_svc3: "Children's Service · 9:00 AM", ft_communion: 'Holy Communion at every service',
    // Worship page
    wp_title: 'Worship & Liturgy', wp_sub: 'Rooted in the apostolic tradition of the Anglican Communion.',
  },

  // ──────────────────────────────────────────────────────
  // GA — Accra Ga (Bible Society of Ghana standard)
  // ──────────────────────────────────────────────────────
  ga: {
    home: 'Akweley', about: 'Yɛ Shi', worship: 'Sulo', guilds: 'Asafo Kpɔŋ',
    sermons: 'Kpakpa', events: 'Nyɛɛ', media: 'Miɛla', gallery: 'Foto',
    bcp: 'Nii Bukuu', contact: 'Kɔni Yɛ', give: 'Fe',
    give_church: 'Fe Asafo Kpɔŋ',
    hero_diocese: 'Diocese Accra · Asafo Kpɔŋ, Ghana · 1940',
    hero_h1: 'St. Peter<br>Anglican Asafo',
    hero_sub: 'Nuŋua · Accra · Ghana',
    hero_motto: '"Nyɔŋmɔ hɛ yɛ koŋ shi, abe le naa?" — Romasefɔ 8:31',
    btn_join: 'Ba Sulo Yɛn Ŋmɛnaa', btn_story: 'Yɛ Shi',
    svc1_type: 'Sulo Ŋmaŋ', svc2_type: 'Sulo Feŋŋ', svc3_type: 'Biitsui Sulo',
    svc1_day: 'Borla · Otanasuain', svc2_day: 'Ga · Otanasuain', svc3_day: 'Bom · Ŋmɛnaa Biara',
    ph_name: 'Wiɛ Dzinaa', ph_email: 'Email Adresu', ph_subject: 'Fɛ nii bo wɔ?', ph_msg: 'Wiɛ kɛɛ…',
    btn_send: 'Gbɔ Kɛɛ',
    sec_story: 'Yɛ Shi', sec_story_sub: 'Nyɔŋmɔ Nyanyara Bii, 1940',
    sec_founders: 'Yɛ Kpɔŋ Naafɔ', sec_founders_sub: 'Hɛɛ yɛ ke ji nudɔmo nɔɔ bɔ St Peter Asafo Kpɔŋ ni 1940.',
    sec_leadership: 'Yɛ Gbɔmɔ Fɔ', sec_leadership_sub: 'Yɛ Wulɔmɔfɔ nɔɔ hɛɛ yɛn sulo, nii, kɛ asafo.',
    sec_mission: 'Yɛ Dzɔŋ', sec_values: 'Yɛ Shishii',
    sec_associate: 'Wulɔmɔfɔ', sec_officers: 'Asafo Gbɔmɔfɔ',
    eyebrow_story: 'Yɛ Shi · 29 June 1940',
    eyebrow_founders: 'Yɛ Naafɔ Hɛɛ',
    eyebrow_clergy: 'Yɛ Wulɔmɔfɔ',
    eyebrow_assoc: 'Wulɔmɔfɔ',
    eyebrow_pcc: 'Asafo Kpɔŋ Gbɔmɔfɔ',
    eyebrow_pic: 'Wulɔmɔ Ŋmaŋ',
    ft_sunday: 'Ŋmɛnaa Sulo',
    ft_svc1: 'Sulo Ŋmaŋ · 6:30 (Borla)', ft_svc2: 'Sulo Feŋŋ · 9:00 (Ga)',
    ft_svc3: 'Biitsui Sulo · 9:00', ft_communion: 'Otanasuain Sulo Biara',
    wp_title: 'Sulo kɛ Nyanyara', wp_sub: 'Anglican Asafo nyanyara shishii.',
  },

  // ──────────────────────────────────────────────────────
  // TWI — Asante Twi (Bible Society / JW Ghana)
  // ──────────────────────────────────────────────────────
  tw: {
    home: 'Efie', about: 'Yɛn Ho', worship: 'Ɔsom', guilds: 'Akuafo',
    sermons: 'Asɛm', events: 'Nhyiam', media: 'Ambo', gallery: 'Mfonini',
    bcp: 'Mpaeɛ Nhoma', contact: 'Bɔ Yɛn Ho', give: 'De Bɔ',
    give_church: 'De Bɔ Asafo',
    hero_diocese: 'Diocese Accra · Anglican Asafo, Ghana · 1940 Fie',
    hero_h1: 'St. Peter<br>Anglican Asafo',
    hero_sub: 'Nuŋua · Accra · Ghana',
    hero_motto: '"Sɛ Onyankopɔn da yɛn ho a, hwan na ɔbɛtumi abrɛ yɛn?" — Romafo 8:31',
    btn_join: 'Ba Yɛn Ho Ɔsore Da', btn_story: 'Yɛn Asɛm',
    svc1_type: 'Ɔsom Ɛkan', svc2_type: 'Ɔsom Mmienu', svc3_type: 'Mmafrɛ Ɔsom',
    svc1_day: 'Borɔfo · Otanasuain', svc2_day: 'Ga · Otanasuain', svc3_day: 'Bom · Ɔsore Da Biara',
    ph_name: 'Wo Din', ph_email: 'Email Adres', ph_subject: 'Deɛ yɛbɛboa wo?', ph_msg: 'Wo nsɛm…',
    btn_send: 'Soma Nsɛm',
    sec_story: 'Yɛn Asɛm', sec_story_sub: 'Onyankopɔn Nhyira, 1940 Mfiase',
    sec_founders: 'Yɛn Mfiase Agya', sec_founders_sub: 'Wɔde anigyeɛ kae wɔn a wɔbɔɔ St Peter Asafo ni 1940.',
    sec_leadership: 'Yɛn Atwerɛdeɛ', sec_leadership_sub: 'Yɛn asɔfofɔ a wɔhwɛ yɛn asafo so.',
    sec_mission: 'Yɛn Dwuma', sec_values: 'Yɛn Suban',
    sec_associate: 'Asɔfo Afoforo', sec_officers: 'Asafo Atwerɛdeɛ',
    eyebrow_story: 'Yɛn Asɛm · 29 June 1940',
    eyebrow_founders: 'Yɛn Mfiase Agya',
    eyebrow_clergy: 'Yɛn Asɔfofɔ',
    eyebrow_assoc: 'Asɔfo Afoforo',
    eyebrow_pcc: 'Asafo Atwerɛdeɛ',
    eyebrow_pic: 'Asɔfo Ɛkan',
    ft_sunday: 'Ɔsore Da Ɔsom',
    ft_svc1: 'Ɔsom Ɛkan · 6:30 (Borɔfo)', ft_svc2: 'Ɔsom Mmienu · 9:00 (Ga)',
    ft_svc3: 'Mmafrɛ Ɔsom · 9:00', ft_communion: 'Otanasuain Ɔsom Biara',
    wp_title: 'Ɔsom ne Mpaeɛ', wp_sub: 'Anglican Asafo mpaeɛ nhyehyɛeɛ.',
  },

  fr: {
    home: 'Accueil', about: 'À Propos', worship: 'Culte', guilds: 'Guildes',
    sermons: 'Sermons', events: 'Événements', media: 'Médias', gallery: 'Galerie',
    bcp: 'Livre de Prière', contact: 'Contact', give: 'Donner',
    give_church: 'Donner à l\'Église',
    hero_diocese: 'Diocèse d\'Accra · Église de la Province d\'Afrique de l\'Ouest · Fondée 1940',
    hero_h1: 'Église Anglicane<br>Saint-Pierre',
    hero_sub: 'Nuŋua · Accra · Ghana',
    hero_motto: '"Si Dieu est pour nous, qui sera contre nous ?" — Romains 8:31',
    btn_join: 'Rejoignez-Nous Dimanche', btn_story: 'Notre Histoire',
    svc1_type: '1er Service', svc2_type: '2ème Service', svc3_type: 'Service Enfants',
    svc1_day: 'Anglais · Sainte Communion', svc2_day: 'Principalement Ga · Sainte Communion', svc3_day: 'Simultané · Chaque Dimanche',
    ph_name: 'Votre Nom', ph_email: 'Adresse E-mail', ph_subject: 'Comment pouvons-nous aider ?', ph_msg: 'Votre message…',
    btn_send: 'Envoyer le Message',
    sec_story: 'Notre Histoire', sec_story_sub: 'Un héritage de foi depuis 1940',
    sec_founders: 'Nos Pères Fondateurs', sec_founders_sub: 'Honorant les visionnaires qui ont fondé l\'Église Anglicane St Pierre en 1940.',
    sec_leadership: 'Notre Direction', sec_leadership_sub: 'Des serviteurs dévoués guidant notre famille d\'église.',
    sec_mission: 'Mission & Vision', sec_values: 'Valeurs Fondamentales',
    sec_associate: 'Prêtres Associés', sec_officers: 'Responsables de l\'Église',
    eyebrow_story: 'Notre Histoire · 29 juin 1940',
    eyebrow_founders: 'Nos Fondateurs',
    eyebrow_clergy: 'Notre Clergé',
    eyebrow_assoc: 'Soutien au Ministère',
    eyebrow_pcc: 'Conseil Paroissial',
    eyebrow_pic: 'Prêtre en Charge',
    ft_sunday: 'Services du Dimanche',
    ft_svc1: '1er Service · 6h30 (Anglais)', ft_svc2: '2ème Service · 9h00 (Ga)',
    ft_svc3: 'Service Enfants · 9h00', ft_communion: 'Sainte Communion à chaque service',
    wp_title: 'Culte & Liturgie', wp_sub: 'Enraciné dans la tradition anglicane.',
  },

  it: {
    home: 'Home', about: 'Chi Siamo', worship: 'Culto', guilds: 'Gilde',
    sermons: 'Sermoni', events: 'Eventi', media: 'Media', gallery: 'Galleria',
    bcp: 'Libro di Preghiera', contact: 'Contatti', give: 'Dona',
    give_church: 'Dona alla Chiesa',
    hero_diocese: 'Diocesi di Accra · Chiesa della Provincia dell\'Africa Occ. · 1940',
    hero_h1: 'Chiesa Anglicana<br>di San Pietro',
    hero_sub: 'Nuŋua · Accra · Ghana',
    hero_motto: '"Se Dio è per noi, chi sarà contro di noi?" — Romani 8:31',
    btn_join: 'Unisciti a Noi Domenica', btn_story: 'La Nostra Storia',
    svc1_type: '1° Servizio', svc2_type: '2° Servizio', svc3_type: 'Servizio Bambini',
    svc1_day: 'Inglese · Santa Comunione', svc2_day: 'Principalmente Ga · Santa Comunione', svc3_day: 'Simultaneo · Ogni Domenica',
    ph_name: 'Il Tuo Nome', ph_email: 'Indirizzo Email', ph_subject: 'Come possiamo aiutare?', ph_msg: 'Il tuo messaggio…',
    btn_send: 'Invia Messaggio',
    sec_story: 'La Nostra Storia', sec_story_sub: 'Un\'eredità di fede dal 1940',
    sec_founders: 'I Nostri Fondatori', sec_founders_sub: 'Omaggiando i visionari che fondarono la Chiesa Anglicana di San Pietro nel 1940.',
    sec_leadership: 'La Nostra Guida', sec_leadership_sub: 'Servitori dedicati che guidano la nostra famiglia ecclesiale.',
    sec_mission: 'Missione & Visione', sec_values: 'Valori Fondamentali',
    sec_associate: 'Sacerdoti Associati', sec_officers: 'Responsabili della Chiesa',
    eyebrow_story: 'La Nostra Storia · 29 Giugno 1940',
    eyebrow_founders: 'I Nostri Fondatori',
    eyebrow_clergy: 'Il Nostro Clero',
    eyebrow_assoc: 'Sostegno al Ministero',
    eyebrow_pcc: 'Consiglio Parrocchiale',
    eyebrow_pic: 'Sacerdote Responsabile',
    ft_sunday: 'Servizi Domenicali',
    ft_svc1: '1° Servizio · 6:30 (Inglese)', ft_svc2: '2° Servizio · 9:00 (Ga)',
    ft_svc3: 'Servizio Bambini · 9:00', ft_communion: 'Santa Comunione ad ogni servizio',
    wp_title: 'Culto & Liturgia', wp_sub: 'Radicato nella tradizione anglicana.',
  }
};

const LANG_LABELS = { en: 'EN', ga: 'GA', tw: 'TW', fr: 'FR', it: 'IT' };
let currentLang = localStorage.getItem('sp_lang') || 'en';

window.toggleLangMenu = function(e) {
  e && e.stopPropagation();
  document.getElementById('lang-dropdown')?.classList.toggle('open');
};
window.toggleLangDropdown = function() {
  document.getElementById('lang-dropdown-desktop')?.classList.toggle('open');
};
window.closeLangDropdown = function() {
  document.getElementById('lang-dropdown-desktop')?.classList.remove('open');
};
document.addEventListener('click', e => {
  const dd = document.getElementById('lang-dropdown');
  const btn = document.getElementById('lang-btn');
  if (dd && btn && !btn.contains(e.target)) dd.classList.remove('open');
  const ddD = document.getElementById('lang-dropdown-desktop');
  const btnD = document.getElementById('lang-btn-desktop');
  if (ddD && btnD && !btnD.contains(e.target)) ddD.classList.remove('open');
});

window.setLang = function(lang) {
  currentLang = lang;
  localStorage.setItem('sp_lang', lang);
  document.getElementById('lang-dropdown')?.classList.remove('open');
  document.getElementById('lang-dropdown-desktop')?.classList.remove('open');
  const lbl = document.getElementById('lang-label');
  if (lbl) lbl.textContent = LANG_LABELS[lang] || lang.toUpperCase();
  const lblD = document.getElementById('lang-label-desktop');
  if (lblD) lblD.textContent = LANG_LABELS[lang] || lang.toUpperCase();
  // Update all lang option buttons
  document.querySelectorAll('[data-lang]').forEach(el => {
    el.classList.toggle('active', el.dataset.lang === lang);
  });
  applyTranslations(lang);
};

window.applyTranslations = function(lang) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const e = TRANSLATIONS.en;

  // ── Nav buttons ──────────────────────────────────────
  const PAGE_KEYS = { home:'home', about:'about', worship:'worship', guilds:'guilds',
    sermons:'sermons', events:'events', media:'media', gallery:'gallery',
    bcp:'bcp', contact:'contact' };
  document.querySelectorAll('.nl, .mob-link').forEach(btn => {
    const m = (btn.getAttribute('onclick') || '').match(/go\('(\w+)'\)/);
    if (m && PAGE_KEYS[m[1]] && t[PAGE_KEYS[m[1]]]) btn.textContent = t[PAGE_KEYS[m[1]]];
  });
  const giveBtn = document.querySelector('.btn-give');
  if (giveBtn) giveBtn.textContent = t.give || e.give;
  const mobGive = document.querySelector('.mob-give');
  if (mobGive) mobGive.textContent = t.give_church || e.give_church;

  // ── Hero ─────────────────────────────────────────────
  const heroTag = document.querySelector('.hero-tag');
  if (heroTag) heroTag.textContent = t.hero_diocese || e.hero_diocese;
  const heroH1 = document.querySelector('.hero-h1');
  if (heroH1) heroH1.innerHTML = t.hero_h1 || e.hero_h1;
  const heroSub = document.querySelector('.hero-sub');
  if (heroSub) heroSub.textContent = t.hero_sub || e.hero_sub;
  const motto = document.querySelector('.hero-motto');
  if (motto) motto.textContent = t.hero_motto || e.hero_motto;
  // Hero CTA buttons
  const btns = document.querySelectorAll('.hero-acts .btn-p, .hero-acts .btn-ghost');
  if (btns[0]) btns[0].textContent = t.btn_join || e.btn_join;
  if (btns[1]) btns[1].textContent = t.btn_story || e.btn_story;

  // ── Service bar ──────────────────────────────────────
  const svcTypes = document.querySelectorAll('.svc-type');
  const svcDays  = document.querySelectorAll('.svc-day');
  if (svcTypes[0]) svcTypes[0].textContent = t.svc1_type || e.svc1_type;
  if (svcTypes[1]) svcTypes[1].textContent = t.svc2_type || e.svc2_type;
  if (svcTypes[2]) svcTypes[2].textContent = t.svc3_type || e.svc3_type;
  if (svcDays[0])  svcDays[0].textContent  = t.svc1_day  || e.svc1_day;
  if (svcDays[1])  svcDays[1].textContent  = t.svc2_day  || e.svc2_day;
  if (svcDays[2])  svcDays[2].textContent  = t.svc3_day  || e.svc3_day;

  // ── Contact form placeholders ────────────────────────
  const fMap = {
    'cf-name': 'ph_name', 'cf-email': 'ph_email',
    'cf-subj': 'ph_subject', 'cf-msg': 'ph_msg'
  };
  Object.entries(fMap).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el) el.placeholder = t[key] || e[key];
  });
  const sendBtn = document.querySelector('[onclick="submitContact()"]');
  if (sendBtn) sendBtn.textContent = t.btn_send || e.btn_send;

  // ── Section headings ─────────────────────────────────
  // Map eyebrow text → translation key
  const eyebrowMap = {
    'Our Story': 'eyebrow_story', 'Honouring Our Founders': 'eyebrow_founders',
    'Our Clergy & Officers': 'eyebrow_clergy', 'Supporting the Ministry': 'eyebrow_assoc',
    'Parochial Church Council': 'eyebrow_pcc', 'Priest In Charge': 'eyebrow_pic',
    'Our Story · Est. 29th June 1940': 'eyebrow_story',
  };
  document.querySelectorAll('.eyebrow').forEach(el => {
    const key = eyebrowMap[el.textContent.trim()];
    if (key && t[key]) el.textContent = t[key];
  });

  // ── Footer services ──────────────────────────────────
  const ftLinks = document.querySelectorAll('.ft-link');
  ftLinks.forEach(el => {
    const txt = el.textContent.trim();
    if (txt.includes('1st Service')) el.textContent = t.ft_svc1 || e.ft_svc1;
    else if (txt.includes('2nd Service')) el.textContent = t.ft_svc2 || e.ft_svc2;
    else if (txt.includes("Children")) el.textContent = t.ft_svc3 || e.ft_svc3;
    else if (txt.includes('Communion at every')) el.textContent = t.ft_communion || e.ft_communion;
  });
  const ftTitle = document.querySelector('.ft-ctitle');
  // find Sunday Services footer title
  document.querySelectorAll('.ft-ctitle').forEach(el => {
    if (el.textContent.includes('Sunday') || el.textContent.includes('Ŋmɛnaa') || el.textContent.includes('Ɔsore') || el.textContent.includes('Dimanche') || el.textContent.includes('Domenica')) {
      el.textContent = t.ft_sunday || e.ft_sunday;
    }
  });
};

// ── Data normalisers ────────────────────────────────────
function normaliseSermon(s) {
  const d = s.date ? new Date(s.date) : new Date();
  return Object.assign({}, s, {
    day:           s.day || d.getDate().toString().padStart(2,'0'),
    month_year:    s.month_year || d.toLocaleDateString('en-GB',{month:'short',year:'numeric'}),
    service:       s.service || s.description || '',
    scripture_ref: s.scripture_ref || s.scripture || '',
    summary:       s.summary || s.description || '',
    audio_path:    s.audio_path || '',
  });
}
function normaliseEvent(e) {
  const d = e.date ? new Date(e.date) : new Date();
  return Object.assign({}, e, {
    day:        e.day || d.getDate().toString().padStart(2,'0'),
    month_year: e.month_year || d.toLocaleDateString('en-GB',{month:'short',year:'numeric'}),
    times:      e.times || e.time || '',
    season:     e.season || e.type || '',
    details:    e.details || e.description || '',
  });
}
function normalisePost(p) {
  return Object.assign({}, p, {
    category:       p.type || 'photo',
    is_pinned:      p.pinned === 1 || p.pinned === true,
    is_weekly_word: p.type === 'ww',
    author_color:   '#4B0082',
    user_name:      p.author,
    like_count:     p.like_count || 0,
    comment_count:  p.comment_count || 0,
  });
}

// ── Override loaders ────────────────────────────────────
window.loadSermons = async function() {
  try {
    const r = await fetch('/api/sermons');
    if (!r.ok) return;
    allSermons = (await r.json()).map(normaliseSermon);
    if (typeof renderSermonsPage === 'function') renderSermonsPage();
  } catch(e) {}
};
window.loadEvents = async function() {
  try {
    const r = await fetch('/api/events');
    if (!r.ok) return;
    allEvents = (await r.json()).map(normaliseEvent);
    if (typeof renderEventsPage === 'function') renderEventsPage();
  } catch(e) {}
};
window.loadPosts = async function() {
  try {
    const r = await fetch('/api/posts');
    if (!r.ok) return;
    allPosts = (await r.json()).map(normalisePost);
    if (typeof updateWeeklyWord === 'function') updateWeeklyWord();
  } catch(e) {}
};

// ── Gallery — newest photos prepend ─────────────────────
window.loadGallery = async function() {
  try {
    const r = await fetch('/api/gallery');
    if (!r.ok) return;
    const photos = await r.json();
    const grid = document.getElementById('gallery-grid');
    if (!grid) return;
    grid.querySelectorAll('.gal-dynamic').forEach(el => el.remove());
    const firstStatic = grid.querySelector('.gal-item:not(.gal-dynamic)');
    [...photos].reverse().forEach(photo => {
      const item = document.createElement('div');
      item.className = 'gal-item gal-dynamic';
      item.onclick = () => lightbox(photo.image_path);
      item.innerHTML = `
        <img src="${photo.image_path}" alt="${photo.caption || ''}"
             style="width:100%;height:100%;object-fit:cover"
             onerror="this.parentElement.style.display='none'">
        <div class="gal-ov"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
        ${photo.caption ? `<div class="gal-caption">${photo.caption}</div>` : ''}
      `;
      grid.insertBefore(item, firstStatic || null);
    });
  } catch(e) {}
};

// ── Hash routing ─────────────────────────────────────────
const _origGo = window.go;
window.go = function(id, updateHash) {
  if (typeof _origGo === 'function') _origGo(id);
  if (updateHash !== false) history.replaceState(null, '', '#' + id);
  if (id === 'gallery') setTimeout(loadGallery, 50);
};
window.addEventListener('hashchange', function() {
  const hash = window.location.hash.replace('#','');
  if (hash && typeof PAGES !== 'undefined' && PAGES.includes(hash)) go(hash, false);
});

// ── Boot ─────────────────────────────────────────────────
function initSite() {
  if (currentLang && currentLang !== 'en') {
    const lbl = document.getElementById('lang-label');
    if (lbl) lbl.textContent = LANG_LABELS[currentLang] || currentLang.toUpperCase();
    document.querySelectorAll('[data-lang]').forEach(el => {
      el.classList.toggle('active', el.dataset.lang === currentLang);
    });
    applyTranslations(currentLang);
  }
  const hash = window.location.hash.replace('#','');
  if (hash && typeof PAGES !== 'undefined' && PAGES.includes(hash)) go(hash, false);
  Promise.all([loadPosts(), loadSermons(), loadEvents(), loadGallery()]);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(initSite, 60));
} else {
  setTimeout(initSite, 60);
}
