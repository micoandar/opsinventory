const pool = require('../config/database');

async function findAll({ page = 1, limit = 20, level, search }) {
  const offset = (page - 1) * limit;
  const params = [];
  let whereClause = 'WHERE 1=1';

  if (level) {
    whereClause += ' AND l.level = ?';
    params.push(level);
  }
  if (search) {
    whereClause += ' AND (l.message LIKE ? OR l.endpoint LIKE ? OR l.request_id LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM application_logs l ${whereClause}`, params);
  const total = countRows[0].total;

  params.push(limit, offset);
  const [rows] = await pool.query(
    `SELECT l.id, l.level, l.message, l.method, l.endpoint, l.status_code, l.request_id, l.created_at, u.username
     FROM application_logs l
     LEFT JOIN users u ON l.user_id = u.id
     ${whereClause} ORDER BY l.created_at DESC LIMIT ? OFFSET ?`,
    params
  );

  return { rows, total };
}

module.exports = { findAll };