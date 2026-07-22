const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const audit = require('../lib/audit');

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (!user) {
    audit(req, 'auth:login', `Failed login for unknown user "${username}"`, false);
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (bcrypt.compareSync(password, user.password)) {
    audit({ user, ip: req.ip }, 'auth:login', 'Logged in', true);
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } else {
    audit({ user, ip: req.ip }, 'auth:login', 'Failed login (wrong password)', false);
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

module.exports = router;
