const pool = require('../config/database');
const { success, failure } = require('../utils/apiResponse');

// Endpoint untuk mengunduh CSV Aset
async function exportAssetsCSV(req, res, next) {
  try {
    const [rows] = await pool.query(`
      SELECT 
        a.asset_code AS 'Asset Code', 
        a.name AS 'Name', 
        c.name AS 'Category', 
        a.brand AS 'Brand', 
        a.model AS 'Model', 
        a.serial_number AS 'Serial Number', 
        a.location AS 'Location', 
        a.purchase_date AS 'Purchase Date', 
        a.status AS 'Status'
      FROM assets a
      JOIN asset_categories c ON a.category_id = c.id
      ORDER BY a.created_at DESC
    `);

    if (rows.length === 0) {
      return failure(res, { statusCode: 404, message: 'Tidak ada data aset untuk diekspor', code: 'NO_DATA', requestId: req.id });
    }

    // Header CSV
    const headers = Object.keys(rows[0]).join(',');
    
    // Baris Data CSV
    const csvRows = rows.map(row => {
      return Object.values(row).map(value => {
        // Jika value null, kosongkan. Jika ada koma, bungkus dengan tanda kutip.
        if (value === null) return '';
        const str = String(value);
        return str.includes(',') ? `"${str}"` : str;
      }).join(',');
    });

    const csvString = [headers, ...csvRows].join('\n');

    // Set header response agar browser mengunduh file
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="opsinventory_assets.csv"');
    
    return res.status(200).send(csvString);

  } catch (err) {
    next(err);
  }
}

// Endpoint untuk ringkasan laporan (Summary)
async function getSummary(req, res, next) {
  try {
    const [assets] = await pool.query(`SELECT status, COUNT(*) as count FROM assets GROUP BY status`);
    const [incidents] = await pool.query(`SELECT status, COUNT(*) as count FROM incidents GROUP BY status`);
    
    return success(res, {
      message: 'Report summary retrieved',
      data: {
        assets: assets.reduce((acc, curr) => ({ ...acc, [curr.status]: curr.count }), {}),
        incidents: incidents.reduce((acc, curr) => ({ ...acc, [curr.status]: curr.count }), {})
      },
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { exportAssetsCSV, getSummary };