const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Get all servers
router.get('/', (req, res) => {
  const servers = db.prepare('SELECT id, name, host, api_port, api_login, is_active FROM servers').all();
  res.json(servers);
});

// Add a server
router.post('/', (req, res) => {
  const { name, host, api_port, api_login, api_password } = req.body;
  const result = db.prepare(
    'INSERT INTO servers (name, host, api_port, api_login, api_password) VALUES (?, ?, ?, ?, ?)'
  ).run(name, host, api_port || 10007, api_login, api_password);
  res.json({ id: result.lastInsertRowid });
});

// Update a server
router.put('/:id', (req, res) => {
  const { name, host, api_port, api_login, api_password, is_active } = req.body;
  const { id } = req.params;
  
  if (api_password) {
    db.prepare(
      'UPDATE servers SET name = ?, host = ?, api_port = ?, api_login = ?, api_password = ?, is_active = ? WHERE id = ?'
    ).run(name, host, api_port, api_login, api_password, is_active, id);
  } else {
    db.prepare(
      'UPDATE servers SET name = ?, host = ?, api_port = ?, api_login = ?, is_active = ? WHERE id = ?'
    ).run(name, host, api_port, api_login, is_active, id);
  }
  res.json({ success: true });
});

// Delete a server
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM servers WHERE id = ?').run(id);
  res.json({ success: true });
});

module.exports = router;
