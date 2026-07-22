// 403 (not 401) so the frontend treats it as "not allowed", not "session expired"
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

module.exports = requireAdmin;
