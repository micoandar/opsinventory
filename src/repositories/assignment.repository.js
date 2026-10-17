const pool = require('../config/database');

async function findByAssetId(assetId) {
  const [rows] = await pool.query(
    `SELECT a.id, a.asset_id, a.user_id, u.full_name AS user_name, 
            a.assigned_by, ab.full_name AS assigned_by_name,
            a.assigned_at, a.returned_at, a.notes
     FROM asset_assignments a
     JOIN users u ON a.user_id = u.id
     JOIN users ab ON a.assigned_by = ab.id
     WHERE a.asset_id = ?
     ORDER BY a.assigned_at DESC`,
    [assetId]
  );
  return rows;
}

async function findActiveByAssetId(assetId) {
  const [rows] = await pool.query(
    `SELECT id FROM asset_assignments WHERE asset_id = ? AND returned_at IS NULL LIMIT 1`,
    [assetId]
  );
  return rows[0] || null;
}

async function createWithTransaction({ assetId, userId, assignedBy, notes }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Ubah status aset menjadi IN_USE
    const [updateResult] = await connection.query(
      `UPDATE assets SET status = 'IN_USE' WHERE id = ? AND status = 'AVAILABLE'`,
      [assetId]
    );
    if (updateResult.affectedRows === 0) {
      throw new Error('Asset is not available for assignment');
    }

    // 2. Catat penugasan
    const [insertResult] = await connection.query(
      `INSERT INTO asset_assignments (asset_id, user_id, assigned_by, assigned_at, notes)
       VALUES (?, ?, ?, NOW(), ?)`,
      [assetId, userId, assignedBy, notes || null]
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

async function returnWithTransaction({ assignmentId }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Cari aset_id dari penugasan ini
    const [assignments] = await connection.query(
      `SELECT asset_id FROM asset_assignments WHERE id = ? AND returned_at IS NULL FOR UPDATE`,
      [assignmentId]
    );
    if (assignments.length === 0) {
      throw new Error('Assignment not found or already returned');
    }
    const assetId = assignments[0].asset_id;

    // 2. Tandai assignment sebagai dikembalikan
    await connection.query(
      `UPDATE asset_assignments SET returned_at = NOW() WHERE id = ?`,
      [assignmentId]
    );

    // 3. Ubah status aset menjadi AVAILABLE kembali
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

module.exports = { findByAssetId, findActiveByAssetId, createWithTransaction, returnWithTransaction };