const pool = require('../config/database');

async function findAll() {
  const [rows] = await pool.query(
    `SELECT id, name, description, created_at, updated_at FROM asset_categories ORDER BY name ASC`
  );
  return rows;
}

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT id, name, description, created_at, updated_at FROM asset_categories WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function findByName(name) {
  const [rows] = await pool.query(
    `SELECT id FROM asset_categories WHERE name = ? LIMIT 1`,
    [name]
  );
  return rows[0] || null;
}

async function create({ name, description }) {
  const [result] = await pool.query(
    `INSERT INTO asset_categories (name, description) VALUES (?, ?)`,
    [name, description]
  );
  return result.insertId;
}

async function update(id, { name, description }) {
  await pool.query(
    `UPDATE asset_categories SET name = ?, description = ? WHERE id = ?`,
    [name, description, id]
  );
}

async function remove(id) {
  await pool.query(`DELETE FROM asset_categories WHERE id = ?`, [id]);
}

module.exports = { findAll, findById, findByName, create, update, remove };