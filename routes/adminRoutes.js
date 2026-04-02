const router  = require('express').Router();
const admin   = require('../controllers/adminController');
const media   = require('../controllers/mediaController');
const member  = require('../controllers/memberController');
const { requireAuth } = require('../middleware/authMiddleware');
const { uploadGallery, uploadEvent, uploadPost, uploadSermon, uploadHero } = require('../middleware/uploadMiddleware');
const { db }  = require('../config/database');
const path    = require('path');
const fs      = require('fs');

router.use(requireAuth);

// ── RBAC helpers ─────────────────────────────────────────
const ROLES = { superadmin: 4, editor: 3, media: 2, viewer: 1 };
function requireRole(...allowed) {
  return (req, res, next) => {
    if (allowed.includes(req.admin.role)) return next();
    return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
  };
}
// Expose current user role to admin panel
router.get('/me', (req, res) => res.json({ admin: req.admin }));

router.get('/stats', admin.getStats);

// Sermons — editor+ can create/delete
router.get('/sermons',        admin.getSermons);
router.post('/sermons',       requireRole('superadmin','editor'), uploadSermon.single('audio'), admin.createSermon);
router.delete('/sermons/:id', requireRole('superadmin','editor'), admin.deleteSermon);

// Events
router.get('/events',        admin.getEvents);
router.post('/events',       requireRole('superadmin','editor'), uploadEvent.single('image'), admin.createEvent);
router.put('/events/:id',    requireRole('superadmin','editor'), admin.updateEvent);
router.delete('/events/:id', requireRole('superadmin','editor'), admin.deleteEvent);

// Gallery — media+ can upload, superadmin/editor can delete
router.get('/gallery',        admin.getGallery);
router.post('/gallery',       requireRole('superadmin','editor','media'), uploadGallery.array('images', 20), admin.addGalleryPhoto);
router.delete('/gallery/:id', requireRole('superadmin','editor'), admin.deleteGalleryPhoto);

// Media posts — editor+ only
router.get('/posts',             admin.getPosts);
router.post('/posts',            requireRole('superadmin','editor'), uploadPost.single('image'), media.createPost);
router.put('/posts/:id',         requireRole('superadmin','editor'), media.togglePost);
router.delete('/posts/:id',      requireRole('superadmin','editor'), media.deletePost);
router.get('/posts/:id/comments', media.getComments);
router.delete('/comments/:id',   requireRole('superadmin','editor'), media.deleteComment);

// Members — all roles can view; superadmin/editor can approve/reject/delete
router.get('/members',       member.getAll);
router.get('/members/:id',   member.getOne);
router.delete('/members/:id', requireRole('superadmin'), member.delete);
router.put('/members/:id/status', requireRole('superadmin','editor'), (req, res) => {
  const { db } = require('../config/database');
  db.members.update(req.params.id, { status: req.body.status });
  res.json({ success: true });
});
router.get('/members/:id/pdf', async (req, res) => {
  const m = db.members.findById(req.params.id);
  if (!m) return res.status(404).json({ error: 'Not found' });
  if (m.pdf_path) {
    const filename = m.pdf_path.split('/').pop();
    const fp = path.join(__dirname, '../uploads/pdfs', filename);
    if (fs.existsSync(fp)) return res.download(fp);
  }
  const { generateMemberPDF } = require('../services/pdfService');
  try { const pdf = await generateMemberPDF(m); db.members.updatePdf(m.id, pdf.url); res.download(pdf.filepath); }
  catch (e) { res.status(500).json({ error: 'PDF failed' }); }
});

// Submissions — all roles can view; superadmin/editor can delete
router.get('/submissions',        admin.getSubmissions);
router.put('/submissions/read',   (req, res) => { db.submissions.markRead(req.body.id); res.json({ success: true }); });
router.delete('/submissions/:id', requireRole('superadmin','editor'), admin.deleteSubmission);

// Settings — superadmin only
router.get('/settings',  admin.getSettings);
router.post('/settings', requireRole('superadmin'), admin.updateSetting);
router.put('/settings',  requireRole('superadmin'), admin.updateSettings);

// Admins — superadmin only
router.get('/admins',              requireRole('superadmin'), admin.getAdmins);
router.post('/admins',             requireRole('superadmin'), admin.createAdmin);
router.delete('/admins/:id',       requireRole('superadmin'), admin.deleteAdmin);
router.put('/admins/:id/password', requireRole('superadmin'), admin.changePassword);

// Hero slides — editor+ can manage
router.get('/hero-slides',        (req, res) => res.json(db.hero_slides.all()));
router.post('/hero-slides',       requireRole('superadmin','editor','media'), uploadHero.array('images', 10), (req, res) => {
  const files = req.files || [];
  if (!files.length) return res.status(400).json({ error: 'No file' });
  files.forEach(f => db.hero_slides.insert({ image_path: '/uploads/hero/' + f.filename }));
  res.json({ success: true, count: files.length });
});
router.delete('/hero-slides/:id', requireRole('superadmin','editor'), (req, res) => { db.hero_slides.delete(req.params.id); res.json({ success: true }); });

// Export — superadmin only
router.get('/export', requireRole('superadmin'), (req, res) => {
  res.setHeader('Content-Disposition','attachment; filename="church-export.json"');
  res.json({ members: db.members.all(), events: db.events.all(), sermons: db.sermons.all(), submissions: db.submissions.all(), exported_at: new Date().toISOString() });
});

module.exports = router;
