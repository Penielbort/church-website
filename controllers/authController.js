const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/database');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const COOKIE_OPTS = { httpOnly: true, sameSite: 'lax', maxAge: 30 * 60 * 1000 }; // 30 min

exports.login = (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.json({ success: false, error: 'Please enter username and password.' });
  const admin = db.admins.findByUsername(username);
  if (!admin || !bcrypt.compareSync(password, admin.password))
    return res.json({ success: false, error: 'Invalid username or password.' });
  const token = jwt.sign(
    { id: admin.id, username: admin.username, display_name: admin.display_name, role: admin.role, loginAt: Date.now() },
    JWT_SECRET, { expiresIn: '30m' } // 30 min absolute
  );
  res.cookie('admin_token', token, COOKIE_OPTS);
  return res.json({ success: true, redirect: '/admin', token });
};

exports.logout = (req, res) => { res.clearCookie('admin_token'); res.redirect('/login'); };
exports.me = (req, res) => res.json({ admin: req.admin });
