const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const fs = require('fs');

// Init DB first
const { initDb } = require('./config/database');
initDb();

const app = express();
const PORT = process.env.PORT || 3000;

// ── MIDDLEWARE ──────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── STATIC FILES ────────────────────────────────────────
app.use('/css',     express.static(path.join(__dirname, 'public/css')));
app.use('/js',      express.static(path.join(__dirname, 'public/js')));
app.use('/images',  express.static(path.join(__dirname, 'public/images')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Ensure upload directories exist at startup
const { mkdirSync } = require('fs');
['members','gallery','events','sermons','hero'].forEach(d =>
  mkdirSync(path.join(__dirname, 'uploads', d), { recursive: true })
);
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// ── ROUTES ──────────────────────────────────────────────
app.use('/auth', require('./routes/authRoutes'));
app.use('/api', require('./routes/publicRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/admin/api', require('./routes/adminRoutes')); // alias used by admin.html

// Legacy direct paths used by main.js (alias /api/*)
const { uploadMember } = require('./middleware/uploadMiddleware');
const memberCtrl = require('./controllers/memberController');
const { getDb } = require('./config/database');
app.post('/register', uploadMember.single('photo'), memberCtrl.register);
// ── Legacy form routes — use lowdb ──────────────────────
const { db: lowdb } = require('./config/database');
app.post('/contact', (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !message) return res.status(400).json({ error: 'Name and message required' });
  lowdb.submissions.insert({ name, email: email||'', subject: subject||'', message, type: 'contact' });
  res.json({ success: true });
});
app.post('/donation', (req, res) => {
  lowdb.submissions.insert({ ...req.body, type: 'donation' });
  res.json({ success: true });
});
app.post('/event-register', (req, res) => {
  lowdb.submissions.insert({ ...req.body, type: 'registration' });
  res.json({ success: true });
});
app.post('/register', require('./middleware/uploadMiddleware').uploadMember.single('photo'), require('./controllers/memberController').register);

// ── PAGE ROUTES ─────────────────────────────────────────
const { requireAuthPage } = require('./middleware/authMiddleware');

// Serve login page
app.get('/login', (req, res) => {
  const loginHtml = path.join(__dirname, 'public/login.html');
  if (fs.existsSync(loginHtml)) return res.sendFile(loginHtml);
  res.status(404).send('Login page not found');
});

// Serve admin panel (protected)
app.get('/admin', (req, res) => {
  const adminHtml = path.join(__dirname, 'public/admin.html');
  if (fs.existsSync(adminHtml)) return res.sendFile(adminHtml);
  res.status(404).send('Admin page not found');
});

// Serve main site
app.get('/', (req, res) => {
  const indexHtml = path.join(__dirname, 'public/index.html');
  if (fs.existsSync(indexHtml)) return res.sendFile(indexHtml);
  res.status(404).send('Index page not found');
});

// Catch-all for SPA routing
app.get('*', (req, res) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/auth') || req.path.startsWith('/uploads')) {
    return res.status(404).json({ error: 'Not found' });
  }
  const indexHtml = path.join(__dirname, 'public/index.html');
  if (fs.existsSync(indexHtml)) return res.sendFile(indexHtml);
  res.status(404).send('Not found');
});

// ── BACKGROUND JOBS ─────────────────────────────────────
const { purgeExpired } = require('./controllers/mediaController');
setInterval(purgeExpired, 60 * 60 * 1000); // Every hour
purgeExpired(); // Run once on startup

// ── START ───────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✝  St. Peter Anglican Church — Parish Website`);
  console.log(`   Server running at http://localhost:${PORT}`);
  console.log(`   Admin panel:  http://localhost:${PORT}/admin`);
  console.log(`   Login:        http://localhost:${PORT}/login`);
  console.log(`   Default login: admin / admin123\n`);
});

module.exports = app;
