const pool = require('../config/database');
const logger = require('../config/logger');

async function logToDb({ level = 'INFO', message, context = null, requestId = null, method = null, endpoint = null, statusCode = null, userId = null }) {
  try {
    await pool.query(
      `INSERT INTO application_logs (level, message, context, request_id, method, endpoint, status_code, user_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [level, message, context ? JSON.stringify(context) : null, requestId, method, endpoint, statusCode, userId]
    );
  } catch (err) {
    // Jangan sampai error DB logger membuat aplikasi crash
    logger.error('Gagal menyimpan log ke database', { requestId, stack: err.stack });
  }
}

module.exports = { logToDb };