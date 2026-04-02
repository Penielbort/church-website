const router  = require('express').Router();
const media   = require('../controllers/mediaController');
const admin   = require('../controllers/adminController');
const member  = require('../controllers/memberController');
const { uploadMember } = require('../middleware/uploadMiddleware');
const { db }  = require('../config/database');

router.get('/random-name', media.randomName);
router.get('/hero-slides', (req,res) => res.json(require('../config/database').db.hero_slides.all()));
router.get('/posts',       media.getPosts);
router.post('/posts/:post_id/like',      media.likePost);
router.get('/posts/:post_id/comments',  media.getComments);
router.post('/posts/:post_id/comments', media.addComment);
router.post('/posts/:post_id/comment',  media.addComment);
router.get('/events',   admin.getEvents);
router.get('/sermons',  admin.getSermons);
router.get('/gallery',  admin.getGallery);
router.get('/settings', admin.getSettings);
router.post('/register', uploadMember.single('photo'), member.register);
router.post('/contact', (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !message) return res.status(400).json({ error: 'Name and message required' });
  db.submissions.insert({ name, email, subject, message, type: 'contact' });
  res.json({ success: true });
});
router.post('/donation',       (req, res) => { db.submissions.insert({ ...req.body, type: 'donation' }); res.json({ success: true }); });
router.post('/event-register', (req, res) => { db.submissions.insert({ ...req.body, type: 'registration' }); res.json({ success: true }); });

module.exports = router;
