const pool = require('../config/database');
const { success } = require('../utils/apiResponse');

async function getStats(req, res, next) {
  try {
    // 1. Ambil data aset per status
    const [assetStats] = await pool.query(
      `SELECT status, COUNT(*) as count FROM assets GROUP BY status`
    );
    
    // 2. Ambil total user aktif
    const [userStats] = await pool.query(
      `SELECT COUNT(*) as count FROM users WHERE is_active = 1`
    );
    
    // 3. Format data aset
    const totalAssets = assetStats.reduce((sum, item) => sum + item.count, 0);
    const assetsByStatus = { AVAILABLE: 0, IN_USE: 0, MAINTENANCE: 0, RETIRED: 0 };
    assetStats.forEach(item => {
      if (assetsByStatus[item.status] !== undefined) {
        assetsByStatus[item.status] = item.count;
      }
    });

    return success(res, {
      message: 'Dashboard stats retrieved',
      data: {
        totalAssets,
        assetsByStatus,
        totalActiveUsers: userStats[0].count,
        // Nilai placeholder untuk fase monitoring/incident
        totalIncidentsOpen: 0,
        servicesDown: 0
      },
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getStats };