require('dotenv').config();
const argon2 = require('argon2');
const readline = require('node:readline/promises');
const { stdin, stdout } = require('node:process');
const pool = require('../src/config/database');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Buang prefix prompt yang mungkin ikut ter-paste. Aman untuk field identifier.
function stripPromptPrefix(value, kind) {
  if (typeof value !== 'string') return '';
  let v = value.trim();
  if (kind === 'username') v = v.replace(/^username(\s*\[[^\]]*\])?\s*:\s*/i, '');
  if (kind === 'email')    v = v.replace(/^email\s*:\s*/i, '');
  if (kind === 'fullname') v = v.replace(/^full\s*name(\s*\[[^\]]*\])?\s*:\s*/i, '');
  return v.trim();
}

async function main() {
  const envU = process.env.ADMIN_USERNAME;
  const envE = process.env.ADMIN_EMAIL;
  const envF = process.env.ADMIN_FULLNAME;
  const envP = process.env.ADMIN_PASSWORD;

  const defaultUsername = 'admin';
  const defaultFullName = 'System Administrator';

  const rl = readline.createInterface({ input: stdin, output: stdout });
  let username, email, fullName, password;

  if (envU !== undefined) { username = stripPromptPrefix(envU, 'username') || defaultUsername; console.log(`Username : ${username} (env)`); }
  else { username = stripPromptPrefix(await rl.question(`Username [${defaultUsername}]: `), 'username') || defaultUsername; }

  if (envE !== undefined) { email = stripPromptPrefix(envE, 'email'); console.log(`Email    : ${email} (env)`); }
  else { email = stripPromptPrefix(await rl.question('Email: '), 'email'); }

  if (envF !== undefined) { fullName = stripPromptPrefix(envF, 'fullname') || defaultFullName; console.log(`Full name: ${fullName} (env)`); }
  else { fullName = stripPromptPrefix(await rl.question(`Full name [${defaultFullName}]: `), 'fullname') || defaultFullName; }

  if (envP !== undefined) { password = envP; console.log('Password : ******** (env)'); }
  else {
    console.log('(ADMIN_PASSWORD tidak di-set; password akan terlihat saat diketik)');
    password = (await rl.question('Password (min 8 chars): ')).trim();
  }

  rl.close();

  if (!EMAIL_REGEX.test(email)) {
    console.error(`Error: email tidak valid: "${email}"`);
    console.error('Format yang diharapkan: nama@domain.tld — tanpa spasi, tanpa prefix "Email:"');
    process.exit(1);
  }
  if (!password || password.length < 8) {
    console.error(`Error: password minimal 8 karakter (panjang sekarang: ${password ? password.length : 0}).`);
    process.exit(1);
  }

  console.log('--- Konfirmasi ---');
  console.log(`Username : ${username}`);
  console.log(`Email    : ${email}`);
  console.log(`Full name: ${fullName}`);
  console.log(`Role     : ADMIN`);
  console.log('------------------');

  let hash;
  try { hash = await argon2.hash(password); }
  catch (err) { console.error('Error hashing password:', err.message); process.exit(1); }

  try {
    const [result] = await pool.query(
      `INSERT INTO users (username, email, password_hash, full_name, role, is_active)
       VALUES (?, ?, ?, ?, 'ADMIN', 1)`,
      [username, email, hash, fullName]
    );
    console.log(`✔ Admin dibuat. id=${result.insertId}, username=${username}, email=${email}`);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') console.error('Error: username atau email sudah dipakai.');
    else console.error('Error:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main().catch((err) => { console.error('Fatal:', err); process.exit(1); });