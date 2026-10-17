const pool = require('../config/database');

async function findAll({ page = 1, limit = 10, status, severity, search }) {
  const offset = (page - 1) * limit;
  const params = [];
  let whereClause = 'WHERE 1=1';

  if (status) { whereClause += ' AND i.status = ?'; params.push(status); }
  if (severity) { whereClause += ' AND i.severity = ?'; params.push(severity); }
  if (search) {
    whereClause += ' AND (i.title LIKE ? OR i.incident_code LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM incidents i ${whereClause}`, params);
  const total = countRows[0].total;

  params.push(limit, offset);
  const [rows] = await pool.query(
    `SELECT i.*, s.name AS service_name, u.full_name AS assigned_to_name
     FROM incidents i
     LEFT JOIN monitored_services s ON i.service_id = s.id
     LEFT JOIN users u ON i.assigned_to = u.id
     ${whereClause} ORDER BY i.opened_at DESC LIMIT ? OFFSET ?`,
    params
  );

  return { rows, total };
}

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT i.*, s.name AS service_name, u.full_name AS assigned_to_name
     FROM incidents i
     LEFT JOIN monitored_services s ON i.service_id = s.id
     LEFT JOIN users u ON i.assigned_to = u.id
     WHERE i.id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function findActiveByServiceId(serviceId) {
  const [rows] = await pool.query(
    `SELECT id FROM incidents WHERE service_id = ? AND status IN ('OPEN', 'IN_PROGRESS') LIMIT 1`,
    [serviceId]
  );
  return rows[0] || null;
}

async function create(data) {
  const [result] = await pool.query(
    `INSERT INTO incidents (incident_code, title, description, severity, status, service_id, created_by, opened_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
    [data.incidentCode, data.title, data.description, data.severity, data.status, data.serviceId || null, data.createdBy || null]
  );
  return result.insertId;
}

async function update(id, data) {
  await pool.query(
    `UPDATE incidents 
     SET status = ?, severity = ?, assigned_to = ?, root_cause = ?, resolution = ?, 
         resolved_at = IF(? = 'RESOLVED' AND resolved_at IS NULL, NOW(), resolved_at),
         closed_at = IF(? = 'CLOSED' AND closed_at IS NULL, NOW(), closed_at)
     WHERE id = ?`,
    [data.status, data.severity, data.assignedTo, data.rootCause, data.resolution, data.status, data.status, id]
  );
}

async function addUpdate(incidentId, userId, updateType, message, oldStatus = null, newStatus = null) {
  await pool.query(
    `INSERT INTO incident_updates (incident_id, user_id, update_type, message, old_status, new_status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [incidentId, userId, updateType, message, oldStatus, newStatus]
  );
}

async function getUpdates(incidentId) {
  const [rows] = await pool.query(
    `SELECT iu.*, u.full_name AS user_name
     FROM incident_updates iu
     LEFT JOIN users u ON iu.user_id = u.id
     WHERE iu.incident_id = ? ORDER BY iu.created_at DESC`,
    [incidentId]
  );
  return rows;
}

module.exports = { findAll, findById, findActiveByServiceId, create, update, addUpdate, getUpdates };