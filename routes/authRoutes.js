const router = require('express').Router();
const auth = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/login', auth.login);
router.get('/logout', auth.logout);
router.get('/me', requireAuth, auth.me);

module.exports = router;
