const db = require('./db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
require('dotenv').config();

const username = process.env.ADMIN_USERNAME || 'admin';

const existingUser = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

if (!existingUser) {
  const password = process.env.ADMIN_PASSWORD || crypto.randomBytes(9).toString('base64url');
  const hashedPassword = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, hashedPassword);

  if (process.env.ADMIN_PASSWORD) {
    console.log(`Default admin user "${username}" created with password from ADMIN_PASSWORD.`);
  } else {
    console.log('='.repeat(60));
    console.log('Default admin user created:');
    console.log(`  Username: ${username}`);
    console.log(`  Password: ${password}`);
    console.log('This password is shown ONCE. Save it now.');
    console.log('(Set ADMIN_PASSWORD in .env to choose your own instead.)');
    console.log('='.repeat(60));
  }
} else {
  console.log('Admin user already exists.');
}
