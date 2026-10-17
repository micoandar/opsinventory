const maintenanceRepo = require('../repositories/maintenance.repository');
const assetRepo = require('../repositories/asset.repository');

async function createMaintenance({ assetId, performedBy, description, cost }) {
  const asset = await assetRepo.findById(assetId);
  if (!asset) {
    const err = new Error('Asset not found'); err.statusCode = 404; err.code = 'ASSET_NOT_FOUND'; throw err;
  }
  return await maintenanceRepo.createWithTransaction({ assetId, performedBy, description, cost });
}

async function completeMaintenance(id) {
  try {
    return await maintenanceRepo.completeWithTransaction({ id });
  } catch (err) {
    if (err.message === 'Record not found or already completed') {
      const e = new Error(err.message); e.statusCode = 400; e.code = 'INVALID_MAINTENANCE_STATUS'; throw e;
    }
    throw err;
  }
}

module.exports = { createMaintenance, completeMaintenance };