const cron = require('node-cron');
const pool = require('../config/database');
const monitorService = require('../services/monitor.service');
const logger = require('../config/logger');

// Berjalan setiap 1 menit
const startMonitorJob = () => {
  cron.schedule('* * * * *', async () => {
    logger.info('[Cron] Memulai pengecekan service...');
    
    try {
      // Ambil semua service yang aktif
      const [services] = await pool.query(`SELECT * FROM monitored_services WHERE is_active = 1`);
      
      const now = new Date();
      
      for (const service of services) {
        // Cek apakah sudah waktunya di-ping berdasarkan interval
        const lastChecked = service.last_checked_at ? new Date(service.last_checked_at) : new Date(0);
        const secondsSinceLastCheck = (now - lastChecked) / 1000;
        
        if (secondsSinceLastCheck >= service.check_interval_seconds) {
          // Jalankan pengecekan (tidak perlu await agar paralel, tapi kita await agar aman)
          await monitorService.checkService(service);
        }
      }
    } catch (err) {
      logger.error('[Cron] Gagal menjalankan monitoring job', { stack: err.stack });
    }
  });
  logger.info('[Cron] Monitoring job dijadwalkan setiap 1 menit.');
};

module.exports = { startMonitorJob };