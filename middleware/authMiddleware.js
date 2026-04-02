const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'stpeter_nungua_secret_2025';

function getToken(req) {
  return req.cookies?.admin_token
    || req.headers.authorization?.replace('Bearer ','')
    || null;
}

function requireAuth(req, res, next) {
  const token = getToken(req);
  if (!token) return res.status(401).json({ error: 'Unauthorised' });
  try { req.admin = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.clearCookie('admin_token'); return res.status(401).json({ error: 'Invalid or expired token' }); }
}

function requireAuthPage(req, res, next) {
  const token = getToken(req);
  if (!token) return res.redirect('/login');
  try { req.admin = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.clearCookie('admin_token'); return res.redirect('/login'); }
}

module.exports = { requireAuth, requireAuthPage, JWT_SECRET };
