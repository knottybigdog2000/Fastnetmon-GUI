const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const axios = require('axios');
const { encrypt, decrypt } = require('../lib/encrypt');
const audit = require('../lib/audit');
const requireAdmin = require('../middleware/requireAdmin');

router.use(authMiddleware);


router.get('/', (req, res) => {
  const servers = db.prepare('SELECT id, name, host, api_port, api_login, is_active FROM servers').all();
  res.json(servers);
});


router.get('/health', async (req, res) => {
  const servers = db.prepare('SELECT * FROM servers WHERE is_active = 1').all();

  const results = await Promise.all(servers.map(async (server) => {
    let apiPassword;
    try {
      apiPassword = decrypt(server.api_password);
    } catch (e) {
      return { id: server.id, ok: false, error: 'credential error' };
    }

    const started = Date.now();
    try {
      await axios.get(`http://${server.host}:${server.api_port}/`, {
        auth: { username: server.api_login, password: apiPassword },
        timeout: 4000,
        // Any HTTP response means the API is up; auth problems are reported separately
        validateStatus: () => true,
      }).then((response) => {
        if (response.status === 401 || response.status === 403) {
          throw Object.assign(new Error('auth failed'), { authFailed: true });
        }
      });
      return { id: server.id, ok: true, latency_ms: Date.now() - started };
    } catch (e) {
      return {
        id: server.id,
        ok: false,
        error: e.authFailed ? 'auth failed' : 'unreachable',
      };
    }
  }));

  res.json(results);
});


router.post('/', requireAdmin, (req, res) => {
  const { name, host, api_port, api_login, api_password } = req.body;
  if (!name || !host || !api_login || !api_password) {
    return res.status(400).json({ error: 'name, host, api_login and api_password are required' });
  }
  const encryptedPassword = encrypt(api_password);
  const result = db.prepare(
    'INSERT INTO servers (name, host, api_port, api_login, api_password) VALUES (?, ?, ?, ?, ?)'
  ).run(name, host, api_port || 10007, api_login, encryptedPassword);
  audit(req, 'server:create', `Added server "${name}" (${host})`);
  res.json({ id: result.lastInsertRowid });
});


router.put('/:id', requireAdmin, (req, res) => {
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
  audit(req, 'server:update', `Updated server "${name}" (${host})`);
  res.json({ success: true });
});


router.delete('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const target = db.prepare('SELECT name, host FROM servers WHERE id = ?').get(id);
  db.prepare('DELETE FROM servers WHERE id = ?').run(id);
  if (target) {
    audit(req, 'server:delete', `Removed server "${target.name}" (${target.host})`);
  }
  res.json({ success: true });
});

module.exports = router;
