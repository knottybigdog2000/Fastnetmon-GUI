const crypto = require('crypto');

const ALGO = 'aes-256-gcm';
const KEY  = Buffer.from(process.env.ENCRYPTION_KEY || '', 'hex');

if (!process.env.ENCRYPTION_KEY || KEY.length !== 32) {
  console.error('FATAL: ENCRYPTION_KEY must be a 64-character hex string (32 bytes).');
  process.exit(1);
}

function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  const enc = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`;
}

// iv:tag:data, all hex — anything else is a legacy plaintext value
const ENCRYPTED_FORMAT = /^[0-9a-f]{24}:[0-9a-f]{32}:[0-9a-f]*$/i;

function decrypt(stored) {
  if (!stored || !ENCRYPTED_FORMAT.test(stored)) return stored;
  const [ivHex, tagHex, dataHex] = stored.split(':');
  const iv   = Buffer.from(ivHex, 'hex');
  const tag  = Buffer.from(tagHex, 'hex');
  const data = Buffer.from(dataHex, 'hex');
  try {
    const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  } catch (e) {
    throw new Error('Failed to decrypt stored credentials — has ENCRYPTION_KEY changed?');
  }
}

module.exports = { encrypt, decrypt };
