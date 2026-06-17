const crypto = require('crypto');

// Default fallback key (32 bytes) for local testing/development
const fallbackKey = 'payment_encryption_key_default_32';
const rawKey = process.env.PAYMENT_ENCRYPTION_KEY || fallbackKey;
// Ensure key is exactly 32 bytes by hashing it if necessary
const ENCRYPTION_KEY = crypto.createHash('sha256').update(rawKey).digest();

function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  return iv.toString('hex') + ':' + cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
}

function decrypt(hash) {
  if (!hash) return null;
  try {
    const [iv, encrypted] = hash.split(':');
    if (!iv || !encrypted) return null;
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, Buffer.from(iv, 'hex'));
    return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
  } catch (err) {
    console.error('Decryption failed:', err.message);
    return null;
  }
}

module.exports = { encrypt, decrypt };
