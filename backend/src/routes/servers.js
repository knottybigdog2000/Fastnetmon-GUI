const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const { encrypt } = require('../lib/encrypt');

router.use(authMiddleware);


router.get('/', (req, res) => {
  const servers = db.prepare('SELECT id, name, host, api_port, api_login, is_active FROM servers').all();
  res.json(servers);
});


router.post('/', (req, res) => {
  const { name, host, api_port, api_login, api_password } = req.body;
  if (!name || !host || !api_login || !api_password) {
    return res.status(400).json({ error: 'name, host, api_login and api_password are required' });
  }
  const encryptedPassword = encrypt(api_password);
  const result = db.prepare(
    'INSERT INTO servers (name, host, api_port, api_login, api_password) VALUES (?, ?, ?, ?, ?)'
  ).run(name, host, api_port || 10007, api_login, encryptedPassword);
  res.json({ id: result.lastInsertRowid });
});


router.put('/:id', (req, res) => {
  const { name, host, api_port, api_login, api_password, is_active } = req.body;
  const { id } = req.params;
  if (!name || !host || !api_login) {
    return res.status(400).json({ error: 'name, host and api_login are required' });
  }

  const existing = db.prepare('SELECT * FROM servers WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Server not found' });
  }
  const active = is_active === undefined ? existing.is_active : (is_active ? 1 : 0);

  if (api_password) {
    const encryptedPassword = encrypt(api_password);
    db.prepare(
      'UPDATE servers SET name = ?, host = ?, api_port = ?, api_login = ?, api_password = ?, is_active = ? WHERE id = ?'
    ).run(name, host, api_port || 10007, api_login, encryptedPassword, active, id);
  } else {
    db.prepare(
      'UPDATE servers SET name = ?, host = ?, api_port = ?, api_login = ?, is_active = ? WHERE id = ?'
    ).run(name, host, api_port || 10007, api_login, active, id);
  }
  res.json({ success: true });
});


router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM servers WHERE id = ?').run(id);
  res.json({ success: true });
});

module.exports = router;
