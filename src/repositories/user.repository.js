const pool = require('../config/database');

async function findByUsernameOrEmail(identifier) {
  const [rows] = await pool.query(
    `SELECT id, username, email, password_hash, full_name, role, is_active, last_login_at
       FROM users
      WHERE username = ? OR email = ?
      LIMIT 1`,
    [identifier, identifier]
  );
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT id, username, email, full_name, role, is_active, last_login_at
       FROM users
      WHERE id = ?
      LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function updateLastLogin(id) {
  await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [id]);
}

module.exports = { findByUsernameOrEmail, findById, updateLastLogin };