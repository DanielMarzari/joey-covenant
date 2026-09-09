#!/usr/bin/env node
// Generate an ADMIN_PASSWORD_HASH value for `wrangler secret put`.
//   npm run hash -- 'the-password'
import { webcrypto as crypto } from 'node:crypto';

const password = process.argv[2];
if (!password) {
  console.error("usage: npm run hash -- 'the-password'");
  process.exit(1);
}
if (password.length < 12) {
  console.error('Refusing: use at least 12 characters.');
  process.exit(1);
}

const ITERATIONS = 210000; // OWASP 2023 floor for PBKDF2-HMAC-SHA256
const salt = crypto.getRandomValues(new Uint8Array(16));
const key = await crypto.subtle.importKey(
  'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']
);
const bits = await crypto.subtle.deriveBits(
  { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' }, key, 256
);

const b64 = (b) => Buffer.from(b).toString('base64');
console.log(`pbkdf2$${ITERATIONS}$${b64(salt)}$${b64(new Uint8Array(bits))}`);
console.log('\nSet it with:\n  npx wrangler secret put ADMIN_PASSWORD_HASH');
console.log('For local dev, put it in api/.dev.vars as ADMIN_PASSWORD_HASH=...');
