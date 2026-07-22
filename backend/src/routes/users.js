const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');


router.get('/', (req, res) => {
  try {
    const users = db.prepare('SELECT id, username, role FROM users').all();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


const MIN_PASSWORD_LENGTH = 8;

router.post('/', (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
  }

  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run(
      username,
      hashedPassword,
      role || 'admin' 
    );
    
    res.json({ id: result.lastInsertRowid, username, role: role || 'admin' });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});


router.put('/:id/password', (req, res) => {
  const id = parseInt(req.params.id);
  const { current_password, new_password } = req.body;

  if (!new_password || new_password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters` });
  }

  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!target) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Changing your own password requires proving you know the current one;
  // changing another user's is an admin reset.
  if (id === req.user.id) {
    if (!current_password) {
      return res.status(400).json({ error: 'Current password is required' });
    }
    if (!bcrypt.compareSync(current_password, target.password)) {
      // 400, not 401 — the frontend treats 401 as an expired session and logs out
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
  }

  const hashedPassword = bcrypt.hashSync(new_password, 10);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, id);
  res.json({ success: true });
});


router.delete('/:id', (req, res) => {
  const id = req.params.id;
  
  
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  try {
    const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
