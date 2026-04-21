const crypto = require('crypto');

const ALGO = 'aes-256-cbc';

const KEY = crypto.createHash('sha256').update(process.env.SSN_SECRET).digest();

function encryptSsn(plainSnn) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);

  const enc = Buffer.concat([cipher.update(plainSnn, 'utf-8'), cipher.final()]);

  return {
    ssn: enc.toString('hex'),
    ssn_iv: iv.toString('hex'),
  };
}

function decryptSsn(data) {
  const iv = Buffer.from(data.ssn_iv, 'hex');
  const encrypted = Buffer.from(data.ssn, 'hex');

  const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
  const dec = Buffer.concat([decipher.update(encrypted), decipher.final()]);

  return dec.toString('utf-8');
}

module.exports = { encryptSsn, decryptSsn };
