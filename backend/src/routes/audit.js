const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 200, 1000);
  const entries = db.prepare(
    'SELECT id, username, action, details, success, ip, created_at FROM audit_log ORDER BY id DESC LIMIT ?'
  ).all(limit);
  res.json(entries);
});

module.exports = router;
