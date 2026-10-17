require('dotenv').config();
const argon2 = require('argon2');
const pool = require('../src/config/database');

async function reset() {
  const newPassword = 'AdminBaru123!'; // <-- Anda bisa ganti dengan password baru
  try {
    const hash = await argon2.hash(newPassword);
    await pool.query("UPDATE users SET password_hash = ? WHERE username = 'admin'", [hash]);
    console.log(`✔ Password admin berhasil di-reset menjadi: ${newPassword}`);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit(0);
  }
}

reset();