const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  console.log(`Login attempt for: ${username}`);
  
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (!user) {
    console.log('Login failed: User not found in database');
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (bcrypt.compareSync(password, user.password)) {
    console.log('Login successful');
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } else {
    console.log('Login failed: Password mismatch');
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

module.exports = router;
