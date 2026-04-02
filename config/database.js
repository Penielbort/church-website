/**
 * Database layer using lowdb v1 — pure JavaScript JSON file database.
 * Zero native dependencies. Works on Windows, Mac, Linux without build tools.
 */
const path = require('path');
const fs   = require('fs');
const bcrypt = require('bcryptjs');

const DB_DIR  = path.join(__dirname, '../database');
const DB_FILE = path.join(DB_DIR, 'church.json');

let _db = null;

function getDb() {
  if (_db) return _db;
  fs.mkdirSync(DB_DIR, { recursive: true });

  const low    = require('lowdb');
  const FileSync = require('lowdb/adapters/FileSync');
  const adapter = new FileSync(DB_FILE);
  _db = low(adapter);

  // Default structure
  _db.defaults({
    admins:      [],
    members:     [],
    events:      [],
    sermons:     [],
    media_posts: [],
    comments:    [],
    likes:       [],
    gallery:     [],
    hero_slides: [],
    submissions: [],
    settings:    [],
    _seq:        {}
  }).write();

  return _db;
}

// ── Auto-increment helper ────────────────────────────────
function nextId(table) {
  const db = getDb();
  const seq = db.get('_seq').value();
  const next = (seq[table] || 0) + 1;
  db.get('_seq').assign({ [table]: next }).write();
  return next;
}

// ── now() helper ─────────────────────────────────────────
function now() { return new Date().toISOString(); }
function expiry() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString();
}

// ── Public DB API (used by all controllers) ──────────────
const db = {

  // ── ADMINS ──────────────────────────────────────────────
  admins: {
    findByUsername(username) {
      return getDb().get('admins').find({ username }).value();
    },
    findById(id) {
      return getDb().get('admins').find({ id }).value();
    },
    count() {
      return getDb().get('admins').size().value();
    },
    all() {
      return getDb().get('admins').map(a => ({
        id: a.id, username: a.username,
        display_name: a.display_name, role: a.role, created_at: a.created_at
      })).value();
    },
    insert(data) {
      const id = nextId('admins');
      const rec = { id, created_at: now(), ...data };
      getDb().get('admins').push(rec).write();
      return id;
    },
    updatePassword(id, password) {
      getDb().get('admins').find({ id }).assign({ password }).write();
    },
    delete(id) {
      getDb().get('admins').remove({ id }).write();
    }
  },

  // ── MEMBERS ─────────────────────────────────────────────
  members: {
    insert(data) {
      const id = nextId('members');
      const rec = { id, created_at: now(), ...data };
      getDb().get('members').push(rec).write();
      return id;
    },
    findById(id) {
      return getDb().get('members').find({ id: Number(id) }).value();
    },
    all() {
      return getDb().get('members')
        .map(m => ({ id:m.id, full_name:m.full_name, phone:m.phone,
          email:m.email, gender:m.gender, created_at:m.created_at,
          pdf_path:m.pdf_path, photo_path:m.photo_path,
          status: m.status || 'pending', registered_at: m.created_at }))
        .orderBy(['created_at'],['desc']).value();
    },
    updatePdf(id, pdf_path) {
      getDb().get('members').find({ id }).assign({ pdf_path }).write();
    },
    update(id, data) {
      getDb().get('members').find({ id: Number(id) }).assign(data).write();
    },
    delete(id) {
      getDb().get('members').remove({ id: Number(id) }).write();
    }
  },

  // ── EVENTS ──────────────────────────────────────────────
  events: {
    all() {
      return getDb().get('events').orderBy(['date'],['asc']).value();
    },
    insert(data) {
      const id = nextId('events');
      getDb().get('events').push({ id, created_at: now(), ...data }).write();
      return id;
    },
    update(id, data) {
      getDb().get('events').find({ id: Number(id) }).assign(data).write();
    },
    delete(id) {
      getDb().get('events').remove({ id: Number(id) }).write();
    }
  },

  // ── SERMONS ─────────────────────────────────────────────
  sermons: {
    all() {
      return getDb().get('sermons').orderBy(['date'],['desc']).value();
    },
    insert(data) {
      const id = nextId('sermons');
      getDb().get('sermons').push({ id, created_at: now(), ...data }).write();
      return id;
    },
    delete(id) {
      getDb().get('sermons').remove({ id: Number(id) }).write();
    }
  },

  // ── MEDIA POSTS ─────────────────────────────────────────
  posts: {
    active() {
      const nowStr = now();
      return getDb().get('media_posts')
        .filter(p => p.pinned || p.expires_at > nowStr)
        .orderBy(['pinned','created_at'],['desc','desc'])
        .map(p => {
          const likes    = getDb().get('likes').filter({ post_id: p.id }).size().value();
          const comments = getDb().get('comments').filter({ post_id: p.id }).size().value();
          return { ...p, like_count: likes, comment_count: comments };
        }).value();
    },
    all() {
      return getDb().get('media_posts')
        .orderBy(['pinned','created_at'],['desc','desc'])
        .map(p => {
          const likes    = getDb().get('likes').filter({ post_id: p.id }).size().value();
          const comments = getDb().get('comments').filter({ post_id: p.id }).size().value();
          return { ...p, like_count: likes, comment_count: comments };
        }).value();
    },
    insert(data) {
      const id = nextId('media_posts');
      const expireDays = parseInt(data.expireDays) || 7;
      const exp = new Date();
      exp.setDate(exp.getDate() + expireDays);
      getDb().get('media_posts').push({
        id, created_at: now(), expires_at: exp.toISOString(), ...data
      }).write();
      return getDb().get('media_posts').find({ id }).value();
    },
    delete(id) {
      getDb().get('media_posts').remove({ id: Number(id) }).write();
      getDb().get('comments').remove({ post_id: Number(id) }).write();
      getDb().get('likes').remove({ post_id: Number(id) }).write();
    },
    update(id, data) {
      getDb().get('media_posts').find({ id: Number(id) }).assign(data).write();
    },
    purgeExpired() {
      const nowStr = now();
      const before = getDb().get('media_posts').size().value();
      getDb().get('media_posts').remove(p => !p.pinned && p.expires_at <= nowStr).write();
      const after = getDb().get('media_posts').size().value();
      const removed = before - after;
      if (removed > 0) console.log(`[Purge] Removed ${removed} expired posts`);
    }
  },

  // ── LIKES ───────────────────────────────────────────────
  likes: {
    toggle(post_id, token) {
      const existing = getDb().get('likes').find({ post_id: Number(post_id), user_token: token }).value();
      if (existing) {
        getDb().get('likes').remove({ post_id: Number(post_id), user_token: token }).write();
        return { liked: false };
      } else {
        getDb().get('likes').push({ id: nextId('likes'), post_id: Number(post_id), user_token: token, created_at: now() }).write();
        return { liked: true };
      }
    },
    count(post_id) {
      return getDb().get('likes').filter({ post_id: Number(post_id) }).size().value();
    }
  },

  // ── COMMENTS ────────────────────────────────────────────
  comments: {
    forPost(post_id) {
      return getDb().get('comments').filter({ post_id: Number(post_id) })
        .orderBy(['created_at'],['asc']).value();
    },
    countForPost(post_id) {
      return getDb().get('comments').filter({ post_id: Number(post_id) }).size().value();
    },
    insert(post_id, author, content) {
      const id = nextId('comments');
      const rec = { id, post_id: Number(post_id), author, content, created_at: now() };
      getDb().get('comments').push(rec).write();
      return rec;
    },
    delete(id) {
      getDb().get('comments').remove({ id: Number(id) }).write();
    }
  },

  // ── GALLERY ─────────────────────────────────────────────
  gallery: {
    all() {
      return getDb().get('gallery').orderBy(['created_at'],['desc']).value();
    },
    insert(data) {
      const id = nextId('gallery');
      getDb().get('gallery').push({ id, created_at: now(), ...data }).write();
      return id;
    },
    delete(id) {
      getDb().get('gallery').remove({ id: Number(id) }).write();
    }
  },

  // ── SUBMISSIONS ─────────────────────────────────────────
  submissions: {
    all() {
      return getDb().get('submissions').orderBy(['created_at'],['desc']).value();
    },
    insert(data) {
      const id = nextId('submissions');
      getDb().get('submissions').push({ id, read_status: 0, created_at: now(), ...data }).write();
      return id;
    },
    markRead(id) {
      getDb().get('submissions').find({ id: Number(id) }).assign({ read_status: 1 }).write();
    },
    markAllRead() {
      getDb().get('submissions').filter({ read_status: 0 }).each(s => { s.read_status = 1; }).write();
    },
    unreadCount() {
      return getDb().get('submissions').filter({ read_status: 0 }).size().value();
    },
    delete(id) {
      getDb().get('submissions').remove({ id: Number(id) }).write();
    }
  },

  // ── HERO SLIDES ─────────────────────────────────────────
  hero_slides: {
    all()  { return getDb().get('hero_slides').orderBy(['created_at'],['asc']).value(); },
    insert(data) {
      const id = nextId('hero_slides');
      getDb().get('hero_slides').push({ id, created_at: now(), ...data }).write();
      return id;
    },
    delete(id) { getDb().get('hero_slides').remove({ id: Number(id) }).write(); }
  },

  // ── SETTINGS ────────────────────────────────────────────
  settings: {
    all() {
      const rows = getDb().get('settings').value();
      const obj = {};
      rows.forEach(r => { obj[r.key] = r.value; });
      return obj;
    },
    set(key, value) {
      const existing = getDb().get('settings').find({ key }).value();
      if (existing) {
        getDb().get('settings').find({ key }).assign({ value }).write();
      } else {
        getDb().get('settings').push({ key, value }).write();
      }
    },
    setMany(obj) {
      Object.entries(obj).forEach(([k, v]) => this.set(k, v));
    }
  },

  // ── STATS ───────────────────────────────────────────────
  stats() {
    const nowStr = now();
    return {
      posts:     getDb().get('media_posts').filter(p => p.pinned || p.expires_at > nowStr).size().value(),
      likes:     getDb().get('likes').size().value(),
      members:   getDb().get('members').size().value(),
      msgs:      getDb().get('submissions').filter({ read_status: 0, type: 'contact' }).size().value(),
      sermons:   getDb().get('sermons').size().value(),
      events:    getDb().get('events').size().value(),
      gallery:   getDb().get('gallery').size().value(),
      donations: getDb().get('submissions').filter({ type: 'donation' }).size().value(),
    };
  }
};

// ── Seed & Init ──────────────────────────────────────────
function initDb() {
  getDb(); // ensure file + defaults created

  if (db.admins.count() === 0) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.admins.insert({ username: 'admin', password: hash, display_name: 'Parish Admin', role: 'superadmin' });
    console.log('[DB] Default admin created  →  admin / admin123');
  }

  const defaults = {
    site_title:    'St. Peter Anglican Church',
    tagline:       'Nungua · Accra · Ghana',
    weekly_word:   '"I can do all things through Christ who strengthens me." — Philippians 4:13',
    vicar_name:    'The Venerable Vicar',
    vicar_message: 'Welcome to St. Peter Anglican Church.',
  };
  const existing = db.settings.all();
  for (const [k, v] of Object.entries(defaults)) {
    if (!existing[k]) db.settings.set(k, v);
  }

  console.log('[DB] Ready →', DB_FILE);
}

module.exports = { getDb, initDb, db };
