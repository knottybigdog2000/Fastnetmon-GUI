const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const { decrypt } = require('../lib/encrypt');
const audit = require('../lib/audit');
const requireAdmin = require('../middleware/requireAdmin');

router.use(authMiddleware);

// Reads are open to all authenticated users; mutations require admin
router.use((req, res, next) => {
  if (req.method === 'GET') return next();
  requireAdmin(req, res, next);
});



router.all(/^\/(\d+)\/?(.*)/, async (req, res) => {
  const serverId = req.params[0];
  const targetPath = req.params[1] || '';
  const query = req.query;

  const server = db.prepare('SELECT * FROM servers WHERE id = ?').get(serverId);
  if (!server) {
    return res.status(404).json({ error: 'Server not found' });
  }
  if (!server.is_active) {
    return res.status(400).json({ error: 'Server is inactive' });
  }

  const baseUrl = `http://${server.host}:${server.api_port}`;
  const url = `${baseUrl}/${targetPath}`;

  let apiPassword;
  try {
    apiPassword = decrypt(server.api_password);
  } catch (e) {
    console.error(`Credential error for server ${serverId}:`, e.message);
    return res.status(500).json({ error: e.message });
  }

  // Mutations against FNM are the operationally sensitive actions — audit them
  const logMutation = (success, note) => {
    if (req.method === 'GET') return;
    audit(req, `fnm:${req.method.toLowerCase()}`, `${server.name}: /${targetPath}${note ? ` (${note})` : ''}`, success);
  };

  try {
    const response = await axios({
      method: req.method,
      url: url,
      params: query,
      data: req.body,
      auth: {
        username: server.api_login,
        password: apiPassword
      },
      timeout: 5000
    });

    logMutation(true);
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      console.error(`FastNetMon API Error (${error.response.status}):`, JSON.stringify(error.response.data));
      logMutation(false, `HTTP ${error.response.status}`);
      res.status(error.response.status).json(error.response.data);
    } else {
      console.error(`Proxy Connection Error for server ${serverId}:`, error.message);
      logMutation(false, error.message);
      res.status(500).json({ error: 'Failed to reach FastNetMon API', message: error.message });
    }
  }
});

module.exports = router;
