// ═══════════════════════════════════════════════════════
//  St. Peter Anglican Church — main.js
// ═══════════════════════════════════════════════════════

// ── STATE ──────────────────────────────────────────────
let allPosts = [];
let allSermons = [];
let allEvents = [];
let userName = sessionStorage.getItem('stp_user') || null;

const PAGES = ['home','about','worship','guilds','sermons','events','media','gallery','bcp','giving','contact','register'];

// ── BOOT ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  if (!userName) {
    try {
      const r = await fetch('/api/random-name');
      if (r.ok) { const d = await r.json(); userName = d.name; }
    } catch (_) {}
    if (!userName) userName = 'Guest_' + Math.floor(Math.random() * 9999);
    sessionStorage.setItem('stp_user', userName);
  }
  await Promise.all([loadPosts(), loadSermons(), loadEvents()]);
  loadBCP();
  loadSettings();
  triggerFadeIns();
});

// ── NAVIGATION ─────────────────────────────────────────
function go(id) {
  PAGES.forEach(p => {
    const el = document.getElementById('pg-' + p);
    if (el) el.classList.remove('on');
  });
  const target = document.getElementById('pg-' + id);
  if (target) target.classList.add('on');

  document.querySelectorAll('.nl, .mob-link').forEach(n => {
    n.classList.remove('on');
    const oc = n.getAttribute('onclick') || '';
    if (oc.includes("'" + id + "'") || oc.includes('"' + id + '"')) n.classList.add('on');
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(triggerFadeIns, 100);

  if (id === 'guilds') renderGuildsPage();
  if (id === 'sermons') renderSermonsPage();
  if (id === 'events') renderEventsPage();
  if (id === 'media') renderMediaPage();
}

// ── DARK MODE ──────────────────────────────────────────
function toggleDark() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
  localStorage.setItem('stp_theme', isDark ? 'light' : 'dark');
}
// Restore saved theme
(function () {
  const saved = localStorage.getItem('stp_theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);
})();

// ── MOBILE MENU ────────────────────────────────────────
function toggleMob() { document.getElementById('mob-menu').classList.toggle('open'); }
function closeMob() { document.getElementById('mob-menu').classList.remove('open'); }
document.addEventListener('click', e => {
  const menu = document.getElementById('mob-menu');
  const ham = document.getElementById('ham-btn');
  if (menu && ham && !ham.contains(e.target) && !menu.contains(e.target)) closeMob();
});

// ── TOAST ──────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

// ── MODAL ──────────────────────────────────────────────
function openModal(html) {
  document.getElementById('modal-inner').innerHTML = html;
  document.getElementById('modal-bg').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  document.getElementById('modal-bg').classList.remove('open');
  document.body.style.overflow = '';
}

// ── LIGHTBOX ───────────────────────────────────────────
function lightbox(src) {
  const lb = document.getElementById('lightbox');
  document.getElementById('lb-img').src = src;
  lb.style.display = 'flex';
}

// ── FADE IN OBSERVER ───────────────────────────────────
function triggerFadeIns() {
  const els = document.querySelectorAll('.fade-in:not(.visible)');
  if (!els.length) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
    });
  }, { threshold: 0.08 });
  els.forEach(el => observer.observe(el));
}

// ── HTML ESCAPE ────────────────────────────────────────
function esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── TIME AGO ───────────────────────────────────────────
function timeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  const d = Math.floor(h / 24);
  if (d < 7) return d + 'd ago';
  return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ══════════════════════════════════════════════════════
//  DATA LOADING
// ══════════════════════════════════════════════════════

async function loadPosts() {
  try {
    const r = await fetch('/api/posts');
    if (!r.ok) return;
    allPosts = await r.json();
    updateWeeklyWord();
  } catch (_) {}
}

async function loadSermons() {
  try {
    const r = await fetch('/api/sermons');
    if (!r.ok) return;
    allSermons = await r.json();
    renderHomeSermons();
    if (document.getElementById('pg-sermons')?.classList.contains('on')) renderSermonsPage();
  } catch (_) {}
}

async function loadEvents() {
  try {
    const r = await fetch('/api/events');
    if (!r.ok) return;
    allEvents = await r.json();
    renderHomeEvents();
    if (document.getElementById('pg-events')?.classList.contains('on')) renderEventsPage();
  } catch (_) {}
}

async function loadSettings() {
  try {
    const r = await fetch('/api/settings');
    if (!r.ok) return;
    const s = await r.json();
    if (s.weekly_word) {
      const parts = s.weekly_word.split(' — ');
      const verseEl = document.getElementById('ww-verse');
      const refEl = document.getElementById('ww-ref');
      if (verseEl) verseEl.textContent = parts[0] || s.weekly_word;
      if (refEl && parts[1]) refEl.textContent = '— ' + parts[1];
    }
  } catch (_) {}
}

function updateWeeklyWord() {
  const ww = allPosts.find(p => p.is_weekly_word);
  if (!ww) return;
  const verseEl = document.getElementById('ww-verse');
  const refEl = document.getElementById('ww-ref');
  if (verseEl) verseEl.textContent = '"' + (ww.caption || '').slice(0, 150) + (ww.caption?.length > 150 ? '…' : '') + '"';
  if (refEl) refEl.textContent = '— ' + ww.author;
}

// ══════════════════════════════════════════════════════
//  RENDER FUNCTIONS
// ══════════════════════════════════════════════════════

// HOME — Sermons preview
function renderHomeSermons() {
  const el = document.getElementById('home-sermons-list');
  if (!el) return;
  if (!allSermons.length) {
    el.innerHTML = '<div class="loading-msg">No sermons published yet.</div>';
    return;
  }
  el.innerHTML = allSermons.slice(0, 3).map(sermonRowHTML).join('');
}

// HOME — Events preview
function renderHomeEvents() {
  const el = document.getElementById('home-events-grid');
  if (!el) return;
  if (!allEvents.length) {
    el.innerHTML = '<div class="loading-msg" style="grid-column:1/-1">No upcoming events.</div>';
    return;
  }
  el.innerHTML = allEvents.slice(0, 2).map(eventCardHTML).join('');
}

// SERMONS PAGE
function renderSermonsPage() {
  const list = document.getElementById('sermons-list');
  const empty = document.getElementById('sermon-empty');
  if (!list) return;
  const q = (document.getElementById('sermon-search')?.value || '').toLowerCase().trim();
  const filtered = q
    ? allSermons.filter(s => ((s.title || '') + (s.preacher || '') + (s.scripture_ref || '')).toLowerCase().includes(q))
    : allSermons;
  list.innerHTML = filtered.map(sermonRowHTML).join('');
  if (empty) empty.style.display = filtered.length ? 'none' : 'block';
}
function filterSermons() { renderSermonsPage(); }

// EVENTS PAGE
function renderEventsPage() {
  const el = document.getElementById('events-grid');
  if (!el) return;
  if (!allEvents.length) {
    el.innerHTML = '<div class="loading-msg" style="grid-column:1/-1">No events at this time.</div>';
    return;
  }
  el.innerHTML = allEvents.map(eventCardHTML).join('');
}

// MEDIA PAGE
function renderMediaPage() {
  const grid = document.getElementById('media-grid');
  if (!grid) return;
  if (!allPosts.length) {
    grid.innerHTML = '<div class="loading-msg" style="grid-column:1/-1">No posts yet.</div>';
    return;
  }
  grid.innerHTML = allPosts.map(postCardHTML).join('');
}

// GUILDS PAGE
const GUILD_PHOTOS = {
  bsa:'/images/guild-bsa.jpg', aypa:'/images/guild-aypa.webp',
  mu:'/images/guild-mu.webp',  ss:'/images/guild-ss.webp',
  sh:'/images/guild-sh.webp',  gs:'/images/guild-gs.png',
  mf:'/images/guild-mf.png',   wf:'/images/guild-wf.webp',
  cs:'/images/guild-cs.jpg'
};
function renderGuildsPage() {
  const grid = document.getElementById('guilds-full-grid');
  if (!grid || grid.querySelector('.guild-card')) return;
  grid.innerHTML = Object.entries(GUILDS_DATA).map(([id, g]) => `
    <div class="guild-card fade-in" onclick="openGuildModal('${id}')">
      <div class="g-icon"><img src="${GUILD_PHOTOS[id]||'/images/logo.png'}" alt="" style="width:52px;height:52px;object-fit:cover;border-radius:50%"></div>
      <div class="g-name">${esc(g.name)}</div>
      <div class="g-desc">${esc(g.desc.slice(0, 100))}…</div>
      <div class="g-meta">${esc(g.meeting)}</div>
    </div>
  `).join('');
  setTimeout(triggerFadeIns, 50);
}

// ══════════════════════════════════════════════════════
//  HTML BUILDERS
// ══════════════════════════════════════════════════════

function sermonRowHTML(s) {
  return `
    <div class="sermon-row" onclick="openSermonModal('${esc(s.id)}')">
      <div>
        <div class="s-day">${esc(s.day || '--')}</div>
        <div class="s-mon">${esc(s.month_year || '')}</div>
      </div>
      <div>
        <div class="s-title">${esc(s.title)}</div>
        <div class="s-meta">${esc(s.preacher)} · ${esc(s.service || '')}</div>
        <div class="s-ref">${esc(s.scripture_ref || '')}</div>
      </div>
      <button class="s-play" onclick="event.stopPropagation();playSermon('${esc(s.id)}','${esc(s.audio_path || '')}')" title="Play sermon">
        <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M3 2l10 6-10 6z"/></svg>
      </button>
    </div>
  `;
}

function eventCardHTML(e) {
  return `
    <div class="event-card" onclick="openEventModal('${esc(e.id)}')">
      <div class="ev-season">${esc(e.season || '')}</div>
      <div class="ev-badge">
        <div class="day">${esc(e.day || '')}</div>
        <div class="mon">${esc(e.month_year || '')}</div>
      </div>
      <div class="ev-title">${esc(e.title)}</div>
      <div class="ev-desc">${esc((e.description || '').slice(0, 120))}…</div>
      <div class="ev-time">⏰ ${esc(e.times || '')}</div>
      <button class="ev-reg" onclick="event.stopPropagation();openRegEventModal('${esc(e.title)}')">Register →</button>
    </div>
  `;
}

function postCardHTML(p) {
  const bg = p.author_color || '#4B0082';
  const imgHTML = p.image_path
    ? `<img src="${esc(p.image_path)}" alt="" onerror="this.parentElement.innerHTML='<div class=med-img-ph style=font-size:52px>📸</div>'">`
    : `<div class="med-img-ph" style="background:linear-gradient(145deg,${bg},#4B0082)">📸</div>`;

  return `
    <div class="med-card" data-cat="${esc(p.category || 'photo')} ${p.is_pinned ? 'pinned' : ''} ${p.is_weekly_word ? 'ww' : ''}">
      <div class="med-img">
        ${imgHTML}
        ${p.is_pinned ? '<div class="med-pin">📌 Pinned</div>' : ''}
        ${p.is_weekly_word ? '<div class="med-ww">Weekly Word</div>' : ''}
      </div>
      <div class="med-body">
        <div class="med-auth">
          <div class="med-av" style="background:${bg}">${esc((p.author_initial || p.author || '?').charAt(0).toUpperCase())}</div>
          <div>
            <div class="med-aname">${esc(p.author)}</div>
            <div class="med-atime">${timeAgo(p.created_at)}</div>
          </div>
        </div>
        <div class="med-cap">${esc(p.caption)}</div>
        <div class="med-acts">
          <button class="med-btn ${hasLiked(p.id) ? 'liked' : ''}" id="like-${p.id}" onclick="toggleLike('${p.id}')">
            <svg viewBox="0 0 24 24" fill="${hasLiked(p.id) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" width="13" height="13">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            &nbsp;<span id="lc-${p.id}">${p.like_count || 0}</span>
          </button>
          <button class="med-btn" onclick="toggleComments('cdr-${p.id}','${p.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            &nbsp;<span id="cc-${p.id}">${p.comment_count || 0}</span>
          </button>
        </div>
      </div>
      <div class="comment-drawer" id="cdr-${p.id}">
        <div id="cl-${p.id}"></div>
        <div class="comment-input-row">
          <input class="comment-input" placeholder="Add a comment as ${esc(userName)}…" id="ci-${p.id}">
          <button class="comment-send" onclick="postComment('${p.id}')">Post</button>
        </div>
      </div>
      <div class="share-row">
        <button class="sh-btn sh-wa" onclick="sharePost('wa','${esc((p.caption || '').slice(0, 60))}')">WhatsApp</button>
        <button class="sh-btn sh-fb" onclick="sharePost('fb')">Facebook</button>
        <button class="sh-btn sh-cp" onclick="copyLink()">Copy Link</button>
      </div>
    </div>
  `;
}

// ── MEDIA FILTER ───────────────────────────────────────
function filterMedia(btn, cat) {
  document.querySelectorAll('.med-tab').forEach(t => t.classList.remove('on'));
  btn.classList.add('on');
  document.querySelectorAll('#media-grid .med-card').forEach(card => {
    if (cat === 'all') { card.style.display = ''; return; }
    const cats = card.getAttribute('data-cat') || '';
    card.style.display = cats.includes(cat) ? '' : 'none';
  });
}

// ── LIKES ──────────────────────────────────────────────
function hasLiked(postId) { return !!sessionStorage.getItem('liked_' + postId); }

async function toggleLike(postId) {
  try {
    const r = await fetch(`/api/posts/${postId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userName })
    });
    if (!r.ok) return;
    const d = await r.json();
    const btn = document.getElementById('like-' + postId);
    const cnt = document.getElementById('lc-' + postId);
    if (btn) btn.classList.toggle('liked', d.liked);
    if (cnt) cnt.textContent = d.count;
    const svg = btn?.querySelector('svg');
    if (svg) svg.setAttribute('fill', d.liked ? 'currentColor' : 'none');
    if (d.liked) sessionStorage.setItem('liked_' + postId, '1');
    else sessionStorage.removeItem('liked_' + postId);
  } catch (_) {}
}

// ── COMMENTS ───────────────────────────────────────────
function toggleComments(drawerId, postId) {
  const drawer = document.getElementById(drawerId);
  if (!drawer) return;
  const isOpen = drawer.classList.contains('open');
  if (!isOpen) loadComments(postId);
  drawer.classList.toggle('open');
}

async function loadComments(postId) {
  try {
    const r = await fetch(`/api/posts/${postId}/comments`);
    const comments = await r.json();
    const list = document.getElementById('cl-' + postId);
    if (!list) return;
    if (!comments.length) {
      list.innerHTML = '<div style="font-family:var(--fa);font-style:italic;color:var(--textm);padding:6px 0;font-size:.9rem">No comments yet. Be the first!</div>';
      return;
    }
    list.innerHTML = comments.map(c => `
      <div class="comment-item">
        <strong>${esc(c.user_name)}</strong>${esc(c.text)}
      </div>
    `).join('');
    // Update comment count
    const cc = document.getElementById('cc-' + postId);
    if (cc) cc.textContent = comments.length;
  } catch (_) {}
}

async function postComment(postId) {
  const input = document.getElementById('ci-' + postId);
  const text = input?.value?.trim();
  if (!text) return;
  try {
    const r = await fetch(`/api/posts/${postId}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author: userName, content: text, user_name: userName, text })
    });
    if (!r.ok) return;
    input.value = '';
    await loadComments(postId);
    showToast('✓ Comment posted');
  } catch (_) {
    showToast('⚠ Failed to post comment');
  }
}

// ── SHARING ────────────────────────────────────────────
function sharePost(platform, text) {
  const url = encodeURIComponent(window.location.href);
  const msg = encodeURIComponent('St. Peter Anglican Church, Nungua: ' + (text || ''));
  if (platform === 'wa') window.open('https://wa.me/?text=' + msg + '%20' + url, '_blank');
  else if (platform === 'fb') window.open('https://www.facebook.com/sharer/sharer.php?u=' + url, '_blank');
}
function copyLink() {
  navigator.clipboard.writeText(window.location.href).then(() => showToast('✓ Link copied to clipboard'));
}

// ── SERMON PLAY ────────────────────────────────────────
function playSermon(id, audioPath) {
  if (audioPath) {
    openModal(`
      <div style="background:linear-gradient(145deg,#2D0050,#4B0082);padding:24px 28px;color:#fff">
        <button class="modal-close" onclick="closeModal()">✕</button>
        <span style="font-family:var(--fd);font-size:8.5px;letter-spacing:.28em;color:var(--gold);display:block;margin-bottom:6px">NOW PLAYING</span>
        <h3 style="font-family:var(--fdec);font-size:1.3rem;color:#fff">${esc((allSermons.find(s => s.id === id) || {}).title || 'Sermon')}</h3>
      </div>
      <div style="padding:24px 28px">
        <audio controls autoplay style="width:100%"><source src="${esc(audioPath)}">Your browser does not support audio playback.</audio>
        <button class="btn-o" style="margin-top:16px" onclick="closeModal()">Close</button>
      </div>
    `);
  } else {
    openSermonModal(id);
  }
}

// ── SERMON MODAL ───────────────────────────────────────
function openSermonModal(id) {
  const s = allSermons.find(x => x.id === id);
  if (!s) return;
  openModal(`
    <div style="background:linear-gradient(145deg,#2D0050,#4B0082);padding:32px 28px 24px;color:#fff;position:relative">
      <button class="modal-close" onclick="closeModal()">✕</button>
      <span style="font-family:var(--fd);font-size:8.5px;letter-spacing:.28em;text-transform:uppercase;color:var(--gold);display:block;margin-bottom:6px">${esc(s.service || '')}</span>
      <h2 style="font-family:var(--fdec);font-size:1.7rem;color:#fff;line-height:1.15;margin-bottom:8px">${esc(s.title)}</h2>
      <p style="font-family:var(--fa);font-style:italic;color:rgba(255,255,255,.55)">${esc(s.preacher)} · ${esc(s.day || '')} ${esc(s.month_year || '')}</p>
    </div>
    <div style="padding:24px 28px">
      ${s.scripture_ref ? `<div style="background:var(--gold-pale);padding:10px 16px;margin-bottom:18px;font-family:var(--fd);font-size:11px;color:var(--purple)">${esc(s.scripture_ref)}</div>` : ''}
      ${s.summary ? `<div style="font-family:var(--fa);font-size:1.05rem;font-style:italic;color:var(--text2);padding:14px 18px;background:var(--stone-dark);border-left:3px solid var(--gold);margin-bottom:18px;line-height:1.75">${esc(s.summary)}</div>` : ''}
      <div style="font-family:var(--fb);font-size:1rem;color:var(--text2);line-height:1.95">${s.content || ''}</div>
      ${s.audio_path ? `<div style="margin-top:18px"><audio controls style="width:100%"><source src="${esc(s.audio_path)}">Audio not supported.</audio></div>` : ''}
      <button class="btn-o" style="margin-top:20px" onclick="closeModal()">Close</button>
    </div>
  `);
}

// ── EVENT MODAL ────────────────────────────────────────
function openEventModal(id) {
  const e = allEvents.find(x => x.id === id);
  if (!e) return;
  openModal(`
    <div style="background:linear-gradient(145deg,#2D0050,#4B0082);padding:32px 28px 24px;color:#fff;position:relative">
      <button class="modal-close" onclick="closeModal()">✕</button>
      <div style="position:absolute;top:0;right:0;background:rgba(201,162,39,.2);color:var(--gold);font-family:var(--fd);font-size:8px;letter-spacing:.18em;text-transform:uppercase;padding:6px 14px">${esc(e.season || '')}</div>
      <span style="font-family:var(--fd);font-size:8.5px;letter-spacing:.28em;text-transform:uppercase;color:var(--gold);display:block;margin-bottom:6px">${esc(e.month_year || '')}</span>
      <h2 style="font-family:var(--fdec);font-size:1.7rem;color:#fff;line-height:1.15;margin-bottom:8px">${esc(e.title)}</h2>
      <p style="font-family:var(--fa);font-style:italic;color:rgba(255,255,255,.55)">⏰ ${esc(e.times || '')}</p>
    </div>
    <div style="padding:24px 28px">
      <div style="font-family:var(--fb);font-size:1.05rem;color:var(--text2);line-height:1.9;margin-bottom:18px">${esc(e.description || '')}</div>
      ${e.details ? `<div style="background:var(--stone-dark);border:1px solid var(--border);padding:14px 18px;margin-bottom:18px"><div style="font-family:var(--fd);font-size:8px;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);margin-bottom:6px">Details</div><div style="font-family:var(--fb);font-size:.93rem;color:var(--text2);line-height:1.75">${esc(e.details)}</div></div>` : ''}
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn-p" onclick="openRegEventModal('${esc(e.title)}');closeModal()">Register to Attend</button>
        <button class="btn-o" onclick="closeModal()">Close</button>
      </div>
    </div>
  `);
}

// ── EVENT REGISTRATION MODAL ───────────────────────────
function openRegEventModal(eventTitle) {
  openModal(`
    <div style="background:linear-gradient(135deg,#2D0050,#4B0082);padding:28px 28px 22px;color:#fff;position:relative">
      <button class="modal-close" onclick="closeModal()">✕</button>
      <span style="font-family:var(--fd);font-size:8.5px;letter-spacing:.28em;text-transform:uppercase;color:var(--gold);display:block;margin-bottom:6px">Event Registration</span>
      <h2 style="font-family:var(--fdec);font-size:1.5rem;color:#fff">${esc(eventTitle)}</h2>
    </div>
    <div style="padding:24px 28px" id="evt-reg-form">
      <label class="cf-label">Full Name *</label>
      <input class="cf-input" id="er-name" placeholder="Your full name">
      <label class="cf-label">Phone *</label>
      <input class="cf-input" id="er-phone" type="tel" placeholder="+233 XX XXX XXXX">
      <label class="cf-label">Email</label>
      <input class="cf-input" id="er-email" type="email" placeholder="your@email.com">
      <label class="cf-label">Number of Attendees</label>
      <select class="cf-input" id="er-attendees">
        <option>1</option><option>2</option><option>3</option><option>4</option><option>5+</option>
      </select>
      <label class="cf-label">Special Requirements</label>
      <textarea class="cf-input" id="er-notes" rows="2" placeholder="Wheelchair access, dietary needs, etc."></textarea>
      <button class="btn-p" style="width:100%;margin-top:4px" onclick="submitEventReg('${esc(eventTitle)}')">✦ Complete Registration</button>
    </div>
    <div style="display:none;padding:32px;text-align:center" id="evt-reg-success">
      <div style="font-size:48px;margin-bottom:14px">✝</div>
      <h3 style="font-family:var(--fdec);font-size:1.4rem;color:var(--purple);margin-bottom:8px">Registration Confirmed!</h3>
      <p style="font-family:var(--fa);font-style:italic;color:var(--text2)">We look forward to welcoming you.</p>
      <button class="btn-o" style="margin-top:20px" onclick="closeModal()">Close</button>
    </div>
  `);
}

async function submitEventReg(eventTitle) {
  const name = document.getElementById('er-name')?.value?.trim();
  const phone = document.getElementById('er-phone')?.value?.trim();
  if (!name || !phone) { showToast('⚠ Name and phone are required.'); return; }
  try {
    await fetch('/event-register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventTitle, name, phone,
        email: document.getElementById('er-email')?.value,
        attendees: document.getElementById('er-attendees')?.value,
        notes: document.getElementById('er-notes')?.value
      })
    });
    document.getElementById('evt-reg-form').style.display = 'none';
    document.getElementById('evt-reg-success').style.display = 'block';
  } catch (_) { showToast('⚠ Registration failed. Please try again.'); }
}

// ── GUILD MODAL ────────────────────────────────────────
const GUILDS_DATA = {
  bsa:  { name: 'Brotherhood of Saint Andrew', icon: '⚓', meeting: 'Every Saturday · 5:00 PM', patron: 'Saint Andrew the Apostle', desc: 'A fellowship of men united in prayer, mutual accountability, and selfless service to the poor and vulnerable. Named after Saint Andrew — the first Apostle called by Christ.' },
  aypa: { name: "Anglican Young People's Association", icon: '✝', meeting: 'Every Sunday after Evensong', patron: 'Saint Timothy', desc: 'AYPA nurtures the faith, leadership, and missionary vision of young Anglicans aged 15–35. Regular retreats, Bible study, and community outreach.' },
  mu:   { name: "Mothers' Union", icon: '🕊', meeting: 'Every Tuesday · 4:00 PM', patron: 'The Blessed Virgin Mary', desc: 'A worldwide Anglican fellowship strengthening Christian family life through prayer, advocacy, and support for families facing hardship.' },
  ss:   { name: 'Servers of the Sanctuary', icon: '🕯', meeting: 'Every Sunday · Training Fridays 6:00 PM', patron: 'Saint Stephen', desc: 'Trained acolytes and lay ministers serving at the altar with precision and reverence during the Holy Eucharist and all liturgical services.' },
  sh:   { name: 'Sacred Heart of Jesus', icon: '❤️', meeting: 'Every Wednesday · 5:30 PM', patron: 'The Sacred Heart of Jesus', desc: "A devotional society dedicated to contemplative prayer and works of mercy, centred on the mystery of Christ's boundless love for humanity." },
  gs:   { name: 'Good Shepherd', icon: '🌿', meeting: 'Every Thursday · 3:00 PM', patron: 'Jesus Christ, the Good Shepherd', desc: "The parish's primary pastoral arm — seeking out the lost, visiting the sick, and welcoming newcomers into the family of St. Peter's." },
  mf:   { name: "Men's Fellowship", icon: '🤝', meeting: 'Last Saturday of Month', patron: 'Saint Joseph', desc: 'Promoting Christian manhood, responsible fatherhood, and active participation in parish and community life throughout Greater Accra.' },
  wf:   { name: "Women's Fellowship", icon: '👩‍👧', meeting: '2nd Wednesday of Month', patron: 'Saint Mary Magdalene', desc: 'A pillar of hospitality, prayer, and service. The Fellowship supports members in faith, family, and daily life with love and solidarity.' },
  cs:   { name: "Children's Service", icon: '🧒', meeting: 'Every Sunday · 9:30 AM', patron: 'Jesus: "Let the children come to me"', desc: 'Providing engaging, age-appropriate Christian education to children ages 3–14 every Sunday, covering Bible, Catechism, prayer, and Anglican liturgy.' },
};

function openGuildModal(id) {
  const g = GUILDS_DATA[id];
  if (!g) return;
  openModal(`
    <div style="background:linear-gradient(145deg,#2D0050,#4B0082);padding:32px 28px 24px;color:#fff;position:relative">
      <button class="modal-close" onclick="closeModal()">✕</button>
      <div style="width:80px;height:80px;border-radius:50%;overflow:hidden;border:3px solid var(--gold);margin-bottom:12px;flex-shrink:0">${GUILD_PHOTOS[id] ? `<img src="${GUILD_PHOTOS[id]}" style="width:100%;height:100%;object-fit:cover">` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:rgba(201,162,39,.2);font-size:32px">${g.icon}</div>`}</div>
      <span style="font-family:var(--fd);font-size:8.5px;letter-spacing:.28em;text-transform:uppercase;color:var(--gold);display:block;margin-bottom:8px">Guild & Ministry</span>
      <h2 style="font-family:var(--fdec);font-size:1.7rem;color:#fff;line-height:1.15">${esc(g.name)}</h2>
    </div>
    <div style="padding:24px 28px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
        <div style="background:var(--stone-dark);padding:12px 14px;border:1px solid var(--border)">
          <div style="font-family:var(--fd);font-size:8px;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);margin-bottom:4px">Meeting Time</div>
          <div style="font-family:var(--fb);font-size:.9rem;color:var(--text2)">${esc(g.meeting)}</div>
        </div>
        <div style="background:var(--stone-dark);padding:12px 14px;border:1px solid var(--border)">
          <div style="font-family:var(--fd);font-size:8px;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);margin-bottom:4px">Patron</div>
          <div style="font-family:var(--fb);font-size:.9rem;color:var(--text2)">${esc(g.patron)}</div>
        </div>
      </div>
      <div style="font-family:var(--fb);font-size:1rem;color:var(--text2);line-height:1.9;margin-bottom:20px">${esc(g.desc)}</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn-p" onclick="closeModal();go('register')">Join This Guild</button>
        <button class="btn-o" onclick="closeModal();go('contact')">Contact the Leader</button>
      </div>
    </div>
  `);
}

// ── BOOK OF COMMON PRAYER ──────────────────────────────
const BCP_SECTIONS = [
  {
    id: 'mp', title: 'Morning Prayer', sub: "The Order for Morning Prayer · Daily throughout the year",
    content: `
      <h3>The General Confession</h3>
      <blockquote>Almighty and most merciful Father; We have erred, and strayed from thy ways like lost sheep. We have followed too much the devices and desires of our own hearts. We have offended against thy holy laws. We have left undone those things which we ought to have done; And we have done those things which we ought not to have done; And there is no health in us. But thou, O Lord, have mercy upon us, miserable offenders. Spare thou them, O God, which confess their faults. Restore thou them that are penitent; According to thy promises declared unto mankind in Christ Jesu our Lord. And grant, O most merciful Father, for his sake; That we may hereafter live a godly, righteous, and sober life, To the glory of thy holy Name. <strong>Amen.</strong></blockquote>
      <h3>The Lord's Prayer</h3>
      <blockquote>Our Father, which art in heaven, Hallowed be thy Name. Thy kingdom come. Thy will be done, in earth as it is in heaven. Give us this day our daily bread. And forgive us our trespasses, As we forgive them that trespass against us. And lead us not into temptation; But deliver us from evil. For thine is the kingdom, the power, and the glory, For ever and ever. <strong>Amen.</strong></blockquote>
      <h3>The Collect for Grace</h3>
      <blockquote>O Lord, our heavenly Father, Almighty and everlasting God, who hast safely brought us to the beginning of this day; Defend us in the same with thy mighty power; and grant that this day we fall into no sin, neither run into any kind of danger; but that all our doings may be ordered by thy governance, to do always that is righteous in thy sight; through Jesus Christ our Lord. <strong>Amen.</strong></blockquote>`
  },
  {
    id: 'ep', title: 'Evening Prayer (Evensong)', sub: "The Order for Evening Prayer · Daily throughout the year",
    content: `
      <h3>The Magnificat</h3>
      <em>The Song of the Blessed Virgin Mary — Luke 1:46–55</em>
      <blockquote>My soul doth magnify the Lord: and my spirit hath rejoiced in God my Saviour. For he hath regarded the lowliness of his handmaiden: for behold, from henceforth all generations shall call me blessed. For he that is mighty hath magnified me: and holy is his Name...</blockquote>
      <h3>The Collect for Aid against Perils</h3>
      <blockquote>Lighten our darkness, we beseech thee, O Lord; and by thy great mercy defend us from all perils and dangers of this night; for the love of thy only Son, our Saviour, Jesus Christ. <strong>Amen.</strong></blockquote>
      <h3>The Collect for Peace</h3>
      <blockquote>O God, from whom all holy desires, all good counsels, and all just works do proceed; Give unto thy servants that peace which the world cannot give; that both our hearts may be set to obey thy commandments, and also that by thee we being defended from the fear of our enemies may pass our time in rest and quietness; through the merits of Jesus Christ our Saviour. <strong>Amen.</strong></blockquote>`
  },
  {
    id: 'hc', title: 'The Order of Holy Communion', sub: "The Lord's Supper · Celebrated every Sunday at 7:00 AM",
    content: `
      <h3>The Collect for Purity</h3>
      <blockquote>Almighty God, unto whom all hearts be open, all desires known, and from whom no secrets are hid: Cleanse the thoughts of our hearts by the inspiration of thy Holy Spirit, that we may perfectly love thee, and worthily magnify thy holy Name; through Christ our Lord. <strong>Amen.</strong></blockquote>
      <h3>The Comfortable Words</h3>
      <blockquote>"Come unto me all that travail and are heavy laden, and I will refresh you." — St. Matthew 11:28</blockquote>
      <blockquote>"God so loved the world, that he gave his only-begotten Son, to the end that all that believe in him should not perish, but have everlasting life." — St. John 3:16</blockquote>
      <h3>The Prayer of Humble Access</h3>
      <blockquote>We do not presume to come to this thy Table, O merciful Lord, trusting in our own righteousness, but in thy manifold and great mercies. We are not worthy so much as to gather up the crumbs under thy Table. But thou art the same Lord, whose property is always to have mercy: Grant us therefore, gracious Lord, so to eat the flesh of thy dear Son Jesus Christ, and to drink his blood, that our sinful bodies may be made clean by his body, and our souls washed through his most precious blood, and that we may evermore dwell in him, and he in us. <strong>Amen.</strong></blockquote>
      <h3>The Blessing</h3>
      <blockquote>The peace of God, which passeth all understanding, keep your hearts and minds in the knowledge and love of God, and of his Son Jesus Christ our Lord: and the blessing of God Almighty, the Father, the Son, and the Holy Ghost, be amongst you and remain with you always. <strong>Amen.</strong></blockquote>`
  },
  {
    id: 'bap', title: 'The Order of Baptism', sub: "Public Baptism of Infants and Adults",
    content: `
      <h3>The Act of Baptism</h3>
      <blockquote>N., I baptize thee In the Name of the Father, and of the Son, and of the Holy Ghost. <strong>Amen.</strong></blockquote>
      <h3>The Signing with the Cross</h3>
      <blockquote>We receive this Child into the congregation of Christ's flock; and do sign him with the sign of the Cross, in token that hereafter he shall not be ashamed to confess the faith of Christ crucified, and manfully to fight under his banner, against sin, the world, and the devil; and to continue Christ's faithful soldier and servant unto his life's end. <strong>Amen.</strong></blockquote>
      <h3>The Welcome</h3>
      <blockquote>Seeing now, dearly beloved brethren, that this Child is regenerate, and grafted into the body of Christ's Church, let us give thanks unto Almighty God for these benefits; and with one accord make our prayers unto him, that this Child may lead the rest of his life according to this beginning.</blockquote>`
  },
  {
    id: 'cat', title: 'The Catechism', sub: "An Instruction for those preparing for Confirmation",
    content: `
      <h3>The Two Sacraments Ordained by Christ</h3>
      <p><strong>Q.</strong> How many Sacraments hath Christ ordained in his Church?<br><strong>A.</strong> Two only, as generally necessary to salvation, that is to say, Baptism, and the Supper of the Lord.</p>
      <p><strong>Q.</strong> What meanest thou by this word Sacrament?<br><strong>A.</strong> I mean an outward and visible sign of an inward and spiritual grace given unto us, ordained by Christ himself, as a means whereby we receive the same, and a pledge to assure us thereof.</p>
      <h3>The Apostles' Creed</h3>
      <blockquote>I believe in God the Father Almighty, Maker of heaven and earth: And in Jesus Christ his only Son our Lord, Who was conceived by the Holy Ghost, Born of the Virgin Mary, Suffered under Pontius Pilate, Was crucified, dead, and buried: He descended into hell; The third day he rose again from the dead; He ascended into heaven, And sitteth on the right hand of God the Father Almighty; From thence he shall come to judge the quick and the dead. I believe in the Holy Ghost; The holy Catholick Church; The Communion of Saints; The Forgiveness of sins; The Resurrection of the body, And the life everlasting. <strong>Amen.</strong></blockquote>`
  },
  {
    id: 'col', title: 'Collects for Principal Feasts', sub: "Proper Prayers for Sundays and Holy Days throughout the year",
    content: `
      <h3>Christmas Day</h3>
      <blockquote>Almighty God, who hast given us thy only-begotten Son to take our nature upon him, and as at this time to be born of a pure Virgin; Grant that we being regenerate, and made thy children by adoption and grace, may daily be renewed by thy Holy Spirit; through the same our Lord Jesus Christ, who liveth and reigneth with thee and the same Spirit, ever one God, world without end. <strong>Amen.</strong></blockquote>
      <h3>Easter Day</h3>
      <blockquote>Almighty God, who through thine only-begotten Son Jesus Christ hast overcome death, and opened unto us the gate of everlasting life; We humbly beseech thee, that, as by thy special grace preventing us thou dost put into our minds good desires, so by thy continual help we may bring the same to good effect; through Jesus Christ our Lord, who liveth and reigneth with thee and the Holy Ghost, ever one God, world without end. <strong>Amen.</strong></blockquote>
      <h3>Whit Sunday (Pentecost)</h3>
      <blockquote>God, who as at this time didst teach the hearts of thy faithful people, by the sending to them the light of thy Holy Spirit; Grant us by the same Spirit to have a right judgement in all things, and evermore to rejoice in his holy comfort; through the merits of Christ Jesus our Saviour, who liveth and reigneth with thee, in the unity of the same Spirit, one God, world without end. <strong>Amen.</strong></blockquote>
      <h3>All Saints' Day</h3>
      <blockquote>O Almighty God, who hast knit together thine elect in one communion and fellowship, in the mystical body of thy Son Christ our Lord; Grant us grace so to follow thy blessed Saints in all virtuous and godly living, that we may come to those unspeakable joys, which thou hast prepared for them that unfeignedly love thee; through Jesus Christ our Lord. <strong>Amen.</strong></blockquote>`
  },
  {
    id: 'psa', title: 'Selected Psalms', sub: "From the Psalter as used in Anglican Daily Prayer",
    content: `
      <h3>Psalm 23 — The Lord's my Shepherd</h3>
      <blockquote>The Lord is my shepherd: therefore can I lack nothing. He shall feed me in a green pasture: and lead me forth beside the waters of comfort. He shall convert my soul: and bring me forth in the paths of righteousness, for his Name's sake. Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff comfort me...</blockquote>
      <h3>Psalm 121 — I will lift up mine eyes</h3>
      <blockquote>I will lift up mine eyes unto the hills: from whence cometh my help. My help cometh even from the Lord: who hath made heaven and earth. He will not suffer thy foot to be moved: and he that keepeth thee will not sleep. Behold, he that keepeth Israel: shall neither slumber nor sleep.</blockquote>
      <h3>Psalm 100 — O be joyful</h3>
      <blockquote>O be joyful in the Lord, all ye lands: serve the Lord with gladness, and come before his presence with a song. Be ye sure that the Lord he is God; it is he that hath made us, and not we ourselves: we are his people, and the sheep of his pasture. O go your way into his gates with thanksgiving, and into his courts with praise: be thankful unto him, and speak good of his Name.</blockquote>`
  },
];

function loadBCP() {
  const container = document.getElementById('bcp-container');
  if (!container) return;
  container.innerHTML = `
    <div class="sec-head">
      <span class="eyebrow">Liturgical Texts</span>
      <h2 class="sec-title">Book of Common Prayer</h2>
      <div class="sec-rule"><span class="rule-line"></span><span class="rule-gem"></span><span class="rule-line"></span></div>
      <p class="sec-sub">The historic liturgy of the Anglican Communion — ordered prayer for every occasion of life, from the 1662 Book of Common Prayer as used in the Province of West Africa.</p>
    </div>
    ${BCP_SECTIONS.map(s => `
      <div class="bcp-section" id="bcp-${s.id}">
        <div class="bcp-sec-hdr" onclick="toggleBCP('${s.id}')">
          <div>
            <div class="bcp-sec-title">${esc(s.title)}</div>
            <div class="bcp-sec-sub">${esc(s.sub)}</div>
          </div>
          <span class="bcp-chevron">▼</span>
        </div>
        <div class="bcp-content">${s.content}</div>
      </div>
    `).join('')}
  `;
}

function toggleBCP(id) {
  document.getElementById('bcp-' + id)?.classList.toggle('open');
}

// ── MEMBER REGISTRATION ────────────────────────────────
let currentStep = 1;

function regNext(step) {
  // Validate before moving forward
  if (step > currentStep) {
    if (currentStep === 1 && !document.getElementById('r-fullName')?.value?.trim()) {
      showToast('⚠ Please enter your full name.'); return;
    }
    if (currentStep === 2 && !document.getElementById('r-phone')?.value?.trim()) {
      showToast('⚠ Please enter your phone number.'); return;
    }
  }
  document.getElementById('rs-' + currentStep)?.classList.remove('on');
  document.getElementById('rs-' + step)?.classList.add('on');
  currentStep = step;
  document.querySelectorAll('.reg-dot').forEach((d, i) => d.classList.toggle('on', i < step));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function previewPhoto(input) {
  if (!input.files?.[0]) return;
  const reader = new FileReader();
  reader.onload = e => {
    const area = document.getElementById('photo-area');
    let img = area.querySelector('img.preview');
    if (!img) {
      img = document.createElement('img');
      img.className = 'preview';
      img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;';
      area.appendChild(img);
    }
    img.src = e.target.result;
  };
  reader.readAsDataURL(input.files[0]);
}

async function submitRegistration() {
  const btn = document.getElementById('reg-submit-btn');
  btn.innerHTML = '<span class="spinner"></span>Submitting…';
  btn.disabled = true;

  const fd = new FormData();
  const fields = [
    'fullName','dob','gender','maritalStatus','nationality','hometown','occupation',
    'phone','email','address','emergencyContact','emergencyPhone',
    'baptized','baptismDate','baptismChurch','confirmed','confirmedBy','confirmationDate','prevParish'
  ];
  fields.forEach(f => {
    const el = document.getElementById('r-' + f);
    if (el) fd.append(f, el.value || '');
  });
  document.querySelectorAll('input[name="guilds"]:checked').forEach(cb => fd.append('guilds', cb.value));
  const photo = document.getElementById('r-photo-input');
  if (photo?.files?.[0]) fd.append('photo', photo.files[0]);

  try {
    const r = await fetch('/register', { method: 'POST', body: fd });
    const d = await r.json();
    if (d.success) {
      document.getElementById('rs-4').classList.remove('on');
      document.getElementById('rs-success').classList.add('on');
      if (d.pdfUrl) {
        document.getElementById('pdf-download-link').innerHTML = `<a href="${esc(d.pdfUrl)}" download class="btn-p">📄 Download Registration PDF</a>`;
      }
    } else {
      showToast('⚠ ' + (d.error || 'Submission failed. Please try again.'));
      btn.innerHTML = '✦ Submit Registration';
      btn.disabled = false;
    }
  } catch (_) {
    showToast('⚠ Network error. Please try again.');
    btn.innerHTML = '✦ Submit Registration';
    btn.disabled = false;
  }
}

// ── CONTACT FORM ───────────────────────────────────────
async function submitContact() {
  const name = document.getElementById('cf-name')?.value?.trim();
  const email = document.getElementById('cf-email')?.value?.trim();
  const message = document.getElementById('cf-msg')?.value?.trim();
  if (!name || !email || !message) { showToast('⚠ Please fill in name, email, and message.'); return; }
  try {
    const r = await fetch('/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, subject: document.getElementById('cf-subj')?.value, message, type: 'contact' })
    });
    if (r.ok) {
      showToast('✓ Message sent. We will be in touch.');
      ['cf-name','cf-email','cf-subj','cf-msg'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
      });
    }
  } catch (_) { showToast('⚠ Failed to send. Please try again.'); }
}

// ── DONATION FORM ──────────────────────────────────────
async function submitDonation() {
  const name = document.getElementById('g-name')?.value?.trim();
  if (!name) { showToast('⚠ Please enter your name.'); return; }
  try {
    await fetch('/donation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        type: 'donation',
        amount: document.getElementById('g-amt')?.value,
        purpose: document.getElementById('g-purp')?.value,
        method: document.getElementById('g-meth')?.value,
        note: document.getElementById('g-note')?.value
      })
    });
    showToast('✓ Donation recorded. God bless you!');
    ['g-name','g-amt','g-note'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  } catch (_) { showToast('⚠ Failed to record donation.'); }
}
