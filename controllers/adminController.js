const { db } = require('../config/database');
const bcrypt = require('bcryptjs');

// Stats — field names the admin HTML expects
exports.getStats = (req, res) => {
  const s = db.stats();
  res.json({
    activePosts:    s.posts,
    totalLikes:     s.likes,
    totalMembers:   s.members,
    unreadMessages: s.msgs,
    totalSermons:   s.sermons,
    totalEvents:    s.events,
    totalGallery:   s.gallery,
    totalDonations: s.donations,
    admin: req.admin ? { name: req.admin.display_name, role: req.admin.role } : null
  });
};

// ── POSTS ────────────────────────────────────────────────
exports.getPosts = (req, res) => {
  const { db } = require('../config/database');
  const posts = db.posts.all().map(p => ({
    ...p,
    active:        1,
    is_pinned:     p.pinned === 1,
    is_weekly_word: p.type === 'ww',
    category:      p.type || 'photo',
    like_count:    db.likes.count(p.id),
    comment_count: db.comments.countForPost(p.id),
  }));
  res.json(posts);
};

// ── SERMONS ─────────────────────────────────────────────
exports.getSermons = (req, res) => {
  const sermons = db.sermons.all().map(s => ({
    ...s,
    // Normalise for both admin table and public site
    day:          s.day || (s.date ? new Date(s.date).getDate().toString().padStart(2,'0') : ''),
    month_year:   s.month_year || (s.date ? new Date(s.date).toLocaleDateString('en-GB',{month:'short',year:'numeric'}) : ''),
    scripture_ref: s.scripture_ref || s.scripture || '',
    service:      s.service || s.description || '',
    summary:      s.summary || s.description || '',
    audio_path:   s.audio_path || '',
  }));
  res.json(sermons);
};

exports.createSermon = (req, res) => {
  // Accept both admin-form fields (day/month_year) and API fields (date)
  const { title, preacher, day, month_year, service, scripture_ref, summary, content, date, scripture, description, video_url } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  // Build a real date string from day + month_year if no date given
  let dateStr = date || '';
  if (!dateStr && day && month_year) {
    try { dateStr = new Date(`${day} ${month_year}`).toISOString().split('T')[0]; } catch { dateStr = new Date().toISOString().split('T')[0]; }
  }
  if (!dateStr) dateStr = new Date().toISOString().split('T')[0];
  const id = db.sermons.insert({
    title,
    preacher:     preacher || 'The Venerable Vicar',
    date:         dateStr,
    day:          day || new Date(dateStr).getDate().toString().padStart(2,'0'),
    month_year:   month_year || new Date(dateStr).toLocaleDateString('en-GB',{month:'short',year:'numeric'}),
    service:      service || description || '',
    scripture_ref: scripture_ref || scripture || '',
    summary:      summary || description || '',
    content:      content || '',
    audio_path:   req.file ? `/uploads/sermons/${req.file.filename}` : '',
    video_url:    video_url || '',
    description:  description || summary || service || '',
    scripture:    scripture_ref || scripture || '',
  });
  res.json({ success: true, id });
};

exports.deleteSermon = (req, res) => { db.sermons.delete(req.params.id); res.json({ success: true }); };

// ── EVENTS ──────────────────────────────────────────────
exports.getEvents = (req, res) => {
  const events = db.events.all().map(e => ({
    ...e,
    day:        e.day || (e.date ? new Date(e.date).getDate().toString().padStart(2,'0') : ''),
    month_year: e.month_year || (e.date ? new Date(e.date).toLocaleDateString('en-GB',{month:'short',year:'numeric'}) : ''),
    times:      e.times || e.time || '',
    season:     e.season || e.type || '',
    details:    e.details || e.description || '',
  }));
  res.json(events);
};

exports.createEvent = (req, res) => {
  const { title, day, month_year, season, times, description, details, date, time, type } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  let dateStr = date || '';
  if (!dateStr && day && month_year) {
    try { dateStr = new Date(`${day} ${month_year}`).toISOString().split('T')[0]; } catch { dateStr = new Date().toISOString().split('T')[0]; }
  }
  if (!dateStr) dateStr = new Date().toISOString().split('T')[0];
  const id = db.events.insert({
    title,
    date:       dateStr,
    day:        day || new Date(dateStr).getDate().toString().padStart(2,'0'),
    month_year: month_year || new Date(dateStr).toLocaleDateString('en-GB',{month:'short',year:'numeric'}),
    time:       times || time || '',
    times:      times || time || '',
    type:       season || type || 'general',
    season:     season || type || '',
    description: description || details || '',
    details:    details || description || '',
    image_path: req.file ? `/uploads/events/${req.file.filename}` : null,
  });
  res.json({ success: true, id });
};

exports.updateEvent = (req, res) => {
  db.events.update(req.params.id, req.body);
  res.json({ success: true });
};

exports.deleteEvent = (req, res) => { db.events.delete(req.params.id); res.json({ success: true }); };

// ── GALLERY ─────────────────────────────────────────────
exports.getGallery = (req, res) => res.json(db.gallery.all());

exports.addGalleryPhoto = (req, res) => {
  // Support both single (image) and multiple (images) uploads
  const files = req.files || (req.file ? [req.file] : []);
  if (!files.length) return res.status(400).json({ error: 'No file uploaded' });
  const ids = files.map(f => {
    const image_path = `/uploads/gallery/${f.filename}`;
    return db.gallery.insert({ caption: req.body.caption || '', image_path, uploaded_by: req.admin.display_name });
  });
  res.json({ success: true, count: ids.length, id: ids[0] });
};

exports.deleteGalleryPhoto = (req, res) => { db.gallery.delete(req.params.id); res.json({ success: true }); };

// ── SUBMISSIONS ──────────────────────────────────────────
exports.getSubmissions = (req, res) => {
  const subs = db.submissions.all().map(s => ({
    ...s,
    type:         s.type || 'contact',
    read:         s.read_status === 1,
    submitted_at: s.created_at || s.submitted_at,
  }));
  res.json(subs);
};
exports.deleteSubmission = (req, res) => { db.submissions.delete(req.params.id); res.json({ success: true }); };

// ── SETTINGS ────────────────────────────────────────────
exports.getSettings    = (req, res) => res.json(db.settings.all());
exports.updateSetting  = (req, res) => { db.settings.set(req.body.key, req.body.value); res.json({ success: true }); };
exports.updateSettings = (req, res) => { db.settings.setMany(req.body); res.json({ success: true }); };

// ── ADMINS ──────────────────────────────────────────────
exports.getAdmins   = (req, res) => res.json(db.admins.all());
exports.createAdmin = (req, res) => {
  const { username, password, display_name, name, role } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  if (db.admins.findByUsername(username)) return res.status(400).json({ error: 'Username already exists' });
  const id = db.admins.insert({ username, password: bcrypt.hashSync(password, 10), display_name: display_name || name || username, role: role || 'admin' });
  res.json({ success: true, id });
};
exports.deleteAdmin = (req, res) => {
  if (parseInt(req.params.id) === req.admin.id) return res.status(400).json({ error: 'Cannot delete yourself' });
  db.admins.delete(parseInt(req.params.id));
  res.json({ success: true });
};
exports.changePassword = (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required' });
  db.admins.updatePassword(parseInt(req.params.id), bcrypt.hashSync(password, 10));
  res.json({ success: true });
};
