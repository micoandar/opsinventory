const axios = require('axios');
const monitorRepo = require('../repositories/monitor.repository');
const incidentService = require('./incident.service');
const logger = require('../config/logger');

async function checkService(service) {
  const start = Date.now();
  let result = 'DOWN';
  let statusCode = null;
  let errorMessage = null;
  
  // Ambil nilai awal dari service
  let newStatus = service.current_status;
  let failures = service.consecutive_failures;
  let successes = service.consecutive_successes;

  try {
    // Lakukan HTTP Request dengan timeout
    const response = await axios({
      method: service.method || 'GET',
      url: service.url,
      timeout: service.timeout_ms,
      validateStatus: () => true // Agar axios tidak throw error untuk status 4xx/5xx
    });

    statusCode = response.status;
    const responseTime = Date.now() - start;

    // Tentukan hasil
    if (statusCode === service.expected_status_code) {
      result = 'UP';
    } else {
      result = 'DEGRADED'; // Status beda dari yang diharapkan
      errorMessage = `Expected HTTP ${service.expected_status_code}, got ${statusCode}`;
    }

    // Simpan ke health_check_logs
    await monitorRepo.insertHealthLog({
      serviceId: service.id,
      statusCode: statusCode,
      responseTimeMs: responseTime,
      result: result,
      errorMessage: errorMessage
    });

    // ==========================================
    // Logika Threshold (Status: UP atau DEGRADED)
    // ==========================================
    if (result === 'UP') {
      successes += 1;
      failures = 0;
      
      // Jika sebelumnya bukan UP, butuh N kali sukses berturut-turut untuk kembali UP
      if (service.current_status !== 'UP' && successes >= service.recovery_threshold) {
        newStatus = 'UP';
        logger.info(`Service ${service.name} RECOVERED to UP`);
        // TRIGGER AUTO RESOLVE INSIDEN
        await incidentService.autoResolveIncident({ serviceId: service.id, serviceName: service.name });
      }
    } else {
      failures += 1;
      successes = 0;
      
      // PERBAIKAN: Gunakan !== 'DOWN' agar status UNKNOWN juga bisa memicu insiden
      if (service.current_status !== 'DOWN' && failures >= service.failure_threshold) {
        newStatus = 'DOWN';
        logger.warn(`Service ${service.name} is DOWN`);
        // TRIGGER AUTO CREATE INSIDEN
        await incidentService.autoCreateIncident({ 
          serviceId: service.id, 
          serviceName: service.name, 
          errorMessage: errorMessage 
        });
      }
    }

    await monitorRepo.updateStatus(service.id, newStatus, failures, successes);

  } catch (error) {
    // ==========================================
    // Logika Threshold (Status: ERROR / Koneksi Gagal)
    // ==========================================
    const responseTime = Date.now() - start;
    errorMessage = error.code || error.message;

    await monitorRepo.insertHealthLog({
      serviceId: service.id,
      statusCode: null,
      responseTimeMs: responseTime,
      result: 'ERROR',
      errorMessage: errorMessage.substring(0, 250)
    });

    failures += 1;
    successes = 0;
    
    // PERBAIKAN: Gunakan !== 'DOWN' agar status UNKNOWN juga bisa memicu insiden
    if (service.current_status !== 'DOWN' && failures >= service.failure_threshold) {
       newStatus = 'DOWN';
       logger.warn(`Service ${service.name} is DOWN (Connection Error)`);
       // TRIGGER AUTO CREATE INSIDEN
       await incidentService.autoCreateIncident({ 
         serviceId: service.id, 
         serviceName: service.name, 
         errorMessage: errorMessage 
       });
    }
    
    await monitorRepo.updateStatus(service.id, newStatus, failures, successes);
  }
}

async function createService(data) {
  const existing = await monitorRepo.findByUrl(data.url);
  if (existing) {
    const err = new Error('URL sudah terdaftar dalam monitoring');
    err.statusCode = 409; 
    err.code = 'DUPLICATE_URL'; 
    throw err;
  }
  return await monitorRepo.create(data);
}

module.exports = { checkService, createService };