const db = require('./db');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const username = 'admin';
const password = 'password'; // Change this on first login

const existingUser = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

if (!existingUser) {
  const hashedPassword = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, hashedPassword);
  console.log('Default admin user created.');
} else {
  console.log('Admin user already exists.');
}
