function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin')
    return res.status(403).json({ error: 'Forbidden: admin only' });
  next();
}

function requireUser(req, res, next) {
  if (!req.user || req.user.role !== 'user')
    return res.status(403).json({ error: 'Forbidden: user only' });
  next();
}

module.exports = { requireAuth, requireAdmin, requireUser };
