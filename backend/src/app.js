const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const db = require('./db');
const authRoutes = require('./routes/auth');
const serverRoutes = require('./routes/servers');
const proxyRoutes = require('./routes/proxy');
const usersRoutes = require('./routes/users');
const authMiddleware = require('./middleware/auth');

const app = express();

app.use(helmet({
  contentSecurityPolicy: false, // Disable for easier local development with proxying
}));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api/proxy', proxyRoutes);
app.use('/api/users', authMiddleware, usersRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = app;
