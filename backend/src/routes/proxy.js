const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Proxy request to a specific server using regex to capture serverId and the remaining path
// This matches /1/some/path and captures "1" and "some/path"
router.all(/^\/(\d+)\/?(.*)/, async (req, res) => {
  const serverId = req.params[0];
  const targetPath = req.params[1] || '';
  const query = req.query;

  const server = db.prepare('SELECT * FROM servers WHERE id = ?').get(serverId);
  if (!server) {
    return res.status(404).json({ error: 'Server not found' });
  }

  const baseUrl = `http://${server.host}:${server.api_port}`;
  const url = `${baseUrl}/${targetPath}`;

  console.log(`--- PROXY DEBUG: ${req.method} ${url} ---`);
  if (req.method !== 'GET') {
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
  }

  try {
    const response = await axios({
      method: req.method,
      url: url,
      params: query,
      data: req.body,
      auth: {
        username: server.api_login,
        password: server.api_password
      },
      timeout: 5000
    });

    if (targetPath.includes('host_counters')) {
      // console.log('--- DEBUG: host_counters raw response ---');
      // console.log(JSON.stringify(response.data).substring(0, 1000));
    }
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      console.error(`FastNetMon API Error (${error.response.status}):`, JSON.stringify(error.response.data));
      res.status(error.response.status).json(error.response.data);
    } else {
      console.error(`Proxy Connection Error for server ${serverId}:`, error.message);
      res.status(500).json({ error: 'Failed to reach FastNetMon API', message: error.message });
    }
  }
});

module.exports = router;
