const assetRepo = require('../repositories/asset.repository');
const categoryRepo = require('../repositories/category.repository');

async function createAsset(data) {
  const category = await categoryRepo.findById(data.categoryId);
  if (!category) {
    const err = new Error('Category not found');
    err.statusCode = 400;
    err.code = 'INVALID_CATEGORY';
    throw err;
  }

  const existing = await assetRepo.findByCodeOrSerial({
    assetCode: data.assetCode,
    serialNumber: data.serialNumber
  });
  if (existing) {
    const err = new Error('Asset code or serial number already exists');
    err.statusCode = 409;
    err.code = 'DUPLICATE_ASSET';
    throw err;
  }

  return await assetRepo.create(data);
}

async function updateAsset(id, data) {
  const target = await assetRepo.findById(id);
  if (!target) {
    const err = new Error('Asset not found');
    err.statusCode = 404;
    err.code = 'ASSET_NOT_FOUND';
    throw err;
  }

  const category = await categoryRepo.findById(data.categoryId);
  if (!category) {
    const err = new Error('Category not found');
    err.statusCode = 400;
    err.code = 'INVALID_CATEGORY';
    throw err;
  }

  if (target.asset_code !== data.assetCode || target.serial_number !== data.serialNumber) {
    const existing = await assetRepo.findByCodeOrSerial({
      assetCode: data.assetCode,
      serialNumber: data.serialNumber
    });
    if (existing && existing.id !== id) {
      const err = new Error('Asset code or serial number already exists');
      err.statusCode = 409;
      err.code = 'DUPLICATE_ASSET';
      throw err;
    }
  }

  await assetRepo.update(id, data);
}

async function deleteAsset(id) {
  const target = await assetRepo.findById(id);
  if (!target) {
    const err = new Error('Asset not found');
    err.statusCode = 404;
    err.code = 'ASSET_NOT_FOUND';
    throw err;
  }
  await assetRepo.remove(id);
}

module.exports = { createAsset, updateAsset, deleteAsset };