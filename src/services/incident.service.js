const incidentRepo = require('../repositories/incident.repository');
const logger = require('../config/logger');

function generateIncidentCode() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `INC-${dateStr}-${random}`;
}

async function createManualIncident({ title, description, severity, createdBy }) {
  const incidentCode = generateIncidentCode();
  const id = await incidentRepo.create({
    incidentCode, title, description, severity, status: 'OPEN', createdBy
  });
  await incidentRepo.addUpdate(id, createdBy, 'NOTE', 'Insiden dibuat secara manual.');
  return id;
}

// Dipanggil otomatis oleh monitor.service.js saat layanan DOWN
async function autoCreateIncident({ serviceId, serviceName, errorMessage }) {
  const existing = await incidentRepo.findActiveByServiceId(serviceId);
  if (existing) return; // Jangan buat duplikat jika sudah ada yang aktif

  const incidentCode = generateIncidentCode();
  const title = `Service DOWN: ${serviceName}`;
  const description = `Sistem mendeteksi layanan ${serviceName} tidak merespons. Error: ${errorMessage || 'Unknown'}`;

  const id = await incidentRepo.create({
    incidentCode, title, description, severity: 'CRITICAL', status: 'OPEN', serviceId
  });
  
  await incidentRepo.addUpdate(id, null, 'STATUS_CHANGE', 'Sistem otomatis membuat insiden karena layanan DOWN.', null, 'OPEN');
  logger.warn(`[Incident] Auto-created incident ${incidentCode} for ${serviceName}`);
}

// Dipanggil otomatis saat layanan kembali UP
async function autoResolveIncident({ serviceId, serviceName }) {
  const existing = await incidentRepo.findActiveByServiceId(serviceId);
  if (!existing) return;

  await incidentRepo.update(existing.id, {
    status: 'RESOLVED',
    severity: 'CRITICAL',
    resolution: 'Sistem mendeteksi layanan kembali UP secara otomatis.',
    assignedTo: null, rootCause: null
  });
  
  await incidentRepo.addUpdate(existing.id, null, 'STATUS_CHANGE', 'Sistem otomatis me-resolve insiden karena layanan pulih.', 'OPEN', 'RESOLVED');
  logger.info(`[Incident] Auto-resolved incident for ${serviceName}`);
}

module.exports = { createManualIncident, autoCreateIncident, autoResolveIncident };