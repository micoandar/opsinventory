const pool = require('../config/database');

const BASE_SELECT = `
  SELECT a.id, a.asset_code, a.name, a.category_id, c.name AS category_name,
         a.brand, a.model, a.serial_number, a.location, a.purchase_date,
         a.status, a.notes, a.created_at, a.updated_at
  FROM assets a
  JOIN asset_categories c ON a.category_id = c.id
`;

async function findAll({ page = 1, limit = 10, search, categoryId, status, sortBy = 'created_at', sortOrder = 'DESC' }) {
  const offset = (page - 1) * limit;
  const params = [];
  let whereClause = 'WHERE 1=1';

  if (search) {
    whereClause += ` AND (
      a.name LIKE ? OR a.asset_code LIKE ? OR a.serial_number LIKE ? OR a.brand LIKE ? OR a.model LIKE ?
    )`;
    const term = `%${search}%`;
    params.push(term, term, term, term, term);
  }
  if (categoryId) {
    whereClause += ' AND a.category_id = ?';
    params.push(categoryId);
  }
  if (status) {
    whereClause += ' AND a.status = ?';
    params.push(status);
  }

  const allowedSortBy = ['created_at', 'name', 'asset_code', 'purchase_date', 'status'];
  const safeSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'created_at';
  const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM assets a ${whereClause}`,
    params
  );
  const total = countRows[0].total;

  params.push(limit, offset);
  const [rows] = await pool.query(
    `${BASE_SELECT} ${whereClause} ORDER BY a.${safeSortBy} ${safeSortOrder} LIMIT ? OFFSET ?`,
    params
  );

  return { rows, total };
}

async function findById(id) {
  const [rows] = await pool.query(`${BASE_SELECT} WHERE a.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function findByCodeOrSerial({ assetCode, serialNumber }) {
  const query = `
    SELECT id FROM assets 
    WHERE asset_code = ? ${serialNumber ? 'OR serial_number = ?' : ''}
    LIMIT 1
  `;
  const params = [assetCode];
  if (serialNumber) params.push(serialNumber);
  const [rows] = await pool.query(query, params);
  return rows[0] || null;
}

async function create(data) {
  const [result] = await pool.query(
    `INSERT INTO assets 
     (asset_code, name, category_id, brand, model, serial_number, location, purchase_date, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.assetCode, data.name, data.categoryId, data.brand || null,
      data.model || null, data.serialNumber || null, data.location || null,
      data.purchaseDate || null, data.status || 'AVAILABLE', data.notes || null
    ]
  );
  return result.insertId;
}

async function update(id, data) {
  await pool.query(
    `UPDATE assets SET 
      asset_code = ?, name = ?, category_id = ?, brand = ?, model = ?, 
      serial_number = ?, location = ?, purchase_date = ?, status = ?, notes = ?
     WHERE id = ?`,
    [
      data.assetCode, data.name, data.categoryId, data.brand || null,
      data.model || null, data.serialNumber || null, data.location || null,
      data.purchaseDate || null, data.status, data.notes || null, id
    ]
  );
}

async function remove(id) {
  await pool.query('DELETE FROM assets WHERE id = ?', [id]);
}

module.exports = { findAll, findById, findByCodeOrSerial, create, update, remove };