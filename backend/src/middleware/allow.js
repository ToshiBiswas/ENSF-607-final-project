// Requires req.user from JWT middleware (payload: { id, email, username, role })
function selfOrAdmin(req, res, next) {
  try {
    const user = req.user;
    const targetId = Number(req.params.id);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    if (user.role === 'admin' || user.id === targetId) return next();
    return res.status(403).json({ message: 'Forbidden' });
  } catch (e) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

module.exports = { selfOrAdmin };
