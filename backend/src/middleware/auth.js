const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        // 401: the token is bad/expired — the client should re-login.
        // 403 is reserved for valid sessions lacking permission.
        return res.status(401).json({ error: 'Unauthorized' });
      }
      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

module.exports = authMiddleware;
