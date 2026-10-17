const pool = require('../config/database');

// Data publik (tanpa password_hash)
const SAFE_COLUMNS = 'id, username, email, full_name, role, is_active, last_login_at, created_at, updated_at';

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
    `SELECT ${SAFE_COLUMNS} FROM users WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function findAll({ page = 1, limit = 10, search, role, isActive }) {
  const offset = (page - 1) * limit;
  const params = [];
  let whereClause = 'WHERE 1=1';

  if (search) {
    whereClause += ' AND (username LIKE ? OR email LIKE ? OR full_name LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term);
  }
  if (role) {
    whereClause += ' AND role = ?';
    params.push(role);
  }
  if (isActive !== undefined && isActive !== null && isActive !== '') {
    whereClause += ' AND is_active = ?';
    params.push(Number(isActive));
  }

  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM users ${whereClause}`, params);
  const total = countRows[0].total;

  params.push(limit, offset);
  const [rows] = await pool.query(
    `SELECT ${SAFE_COLUMNS} FROM users ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    params
  );

  return { rows, total };
}

async function create({ username, email, passwordHash, fullName, role, isActive }) {
  const [result] = await pool.query(
    `INSERT INTO users (username, email, password_hash, full_name, role, is_active)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [username, email, passwordHash, fullName, role, isActive ? 1 : 0]
  );
  return result.insertId;
}

async function update(id, { email, fullName, role }) {
  await pool.query(
    `UPDATE users SET email = ?, full_name = ?, role = ? WHERE id = ?`,
    [email, fullName, role, id]
  );
}

async function updatePassword(id, passwordHash) {
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, id]);
}

async function updateStatus(id, isActive) {
  await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, id]);
}

async function updateLastLogin(id) {
  await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [id]);
}

module.exports = {
  findByUsernameOrEmail,
  findById,
  findAll,
  create,
  update,
  updatePassword,
  updateStatus,
  updateLastLogin
};