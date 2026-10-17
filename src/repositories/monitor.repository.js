const pool = require('../config/database');

async function findAll() {
  const [rows] = await pool.query(`
    SELECT m.*, 
    (SELECT COUNT(*) FROM health_check_logs h WHERE h.service_id = m.id) as total_checks
    FROM monitored_services m ORDER BY m.created_at DESC
  `);
  return rows;
}

async function findById(id) {
  const [rows] = await pool.query(`SELECT * FROM monitored_services WHERE id = ?`, [id]);
  return rows[0] || null;
}

async function findByUrl(url) {
  const [rows] = await pool.query(`SELECT id FROM monitored_services WHERE url = ?`, [url]);
  return rows[0] || null;
}

async function create(data) {
  const [result] = await pool.query(
    `INSERT INTO monitored_services (name, url, method, expected_status_code, check_interval_seconds, timeout_ms, failure_threshold, recovery_threshold)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.name, data.url, data.method, data.expectedStatusCode, data.checkIntervalSeconds, data.timeoutMs, data.failureThreshold, data.recoveryThreshold]
  );
  return result.insertId;
}

async function updateStatus(id, newStatus, currentFailures, currentSuccesses) {
  await pool.query(
    `UPDATE monitored_services 
     SET current_status = ?, consecutive_failures = ?, consecutive_successes = ?, last_checked_at = NOW(), last_status_change_at = IF(current_status != ?, NOW(), last_status_change_at)
     WHERE id = ?`,
    [newStatus, currentFailures, currentSuccesses, newStatus, id]
  );
}

async function insertHealthLog(data) {
  await pool.query(
    `INSERT INTO health_check_logs (service_id, status_code, response_time_ms, result, error_message, checked_at) 
     VALUES (?, ?, ?, ?, ?, NOW())`,
    [data.serviceId, data.statusCode, data.responseTimeMs, data.result, data.errorMessage]
  );
}

async function getHealthLogs(serviceId, limit = 50) {
  const [rows] = await pool.query(
    `SELECT * FROM health_check_logs WHERE service_id = ? ORDER BY checked_at DESC LIMIT ?`,
    [serviceId, limit]
  );
  return rows;
}

module.exports = { findAll, findById, findByUrl, create, updateStatus, insertHealthLog, getHealthLogs };