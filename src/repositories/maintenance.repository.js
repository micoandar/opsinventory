const pool = require('../config/database');

async function findByAssetId(assetId) {
  const [rows] = await pool.query(
    `SELECT m.id, m.asset_id, m.performed_by, u.full_name AS performed_by_name,
            m.description, m.cost, m.status, m.started_at, m.completed_at
     FROM maintenance_records m
     JOIN users u ON m.performed_by = u.id
     WHERE m.asset_id = ?
     ORDER BY m.started_at DESC`,
    [assetId]
  );
  return rows;
}

async function createWithTransaction({ assetId, performedBy, description, cost, status }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Ubah status aset jadi MAINTENANCE
    await connection.query(
      `UPDATE assets SET status = 'MAINTENANCE' WHERE id = ?`,
      [assetId]
    );

    // Catat perawatan
    const [insertResult] = await connection.query(
      `INSERT INTO maintenance_records (asset_id, performed_by, description, cost, status, started_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [assetId, performedBy, description, cost || null, status || 'IN_PROGRESS']
    );

    await connection.commit();
    return insertResult.insertId;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

async function completeWithTransaction({ id }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [records] = await connection.query(
      `SELECT asset_id FROM maintenance_records WHERE id = ? AND status = 'IN_PROGRESS' FOR UPDATE`,
      [id]
    );
    if (records.length === 0) throw new Error('Record not found or already completed');
    const assetId = records[0].asset_id;

    await connection.query(
      `UPDATE maintenance_records SET status = 'COMPLETED', completed_at = NOW() WHERE id = ?`,
      [id]
    );
    await connection.query(
      `UPDATE assets SET status = 'AVAILABLE' WHERE id = ?`,
      [assetId]
    );

    await connection.commit();
    return assetId;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

module.exports = { findByAssetId, createWithTransaction, completeWithTransaction };