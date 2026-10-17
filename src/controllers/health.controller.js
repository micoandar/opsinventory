const pool = require('../config/database');

async function getHealth(req, res) {
  const startedAt = Date.now();
  let dbStatus = 'DOWN';
  let dbLatencyMs = null;
  let dbError = null;

  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query('SELECT 1 AS ok');
      if (rows && rows[0] && rows[0].ok === 1) {
        dbStatus = 'UP';
        dbLatencyMs = Date.now() - startedAt;
      }
    } finally {
      connection.release();
    }
  } catch (err) {
    dbError = err.code || 'DB_ERROR';
  }

  const healthy = dbStatus === 'UP';
  const httpStatus = healthy ? 200 : 503;

  res.status(httpStatus).json({
    success: healthy,
    message: healthy ? 'Service healthy' : 'Service degraded',
    data: {
      status: healthy ? 'UP' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        ...(dbError && { error: dbError })
      }
    },
    requestId: req.id
  });
}

module.exports = { getHealth };