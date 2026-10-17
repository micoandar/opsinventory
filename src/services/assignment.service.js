const assignmentRepo = require('../repositories/assignment.repository');
const assetRepo = require('../repositories/asset.repository');
const userRepo = require('../repositories/user.repository');

async function assignAsset({ assetId, userId, assignedBy, notes }) {
  const asset = await assetRepo.findById(assetId);
  if (!asset) {
    const err = new Error('Asset not found'); err.statusCode = 404; err.code = 'ASSET_NOT_FOUND'; throw err;
  }
  if (asset.status !== 'AVAILABLE') {
    const err = new Error('Asset is already in use or under maintenance'); err.statusCode = 400; err.code = 'ASSET_NOT_AVAILABLE'; throw err;
  }

  const user = await userRepo.findById(userId);
  if (!user || !user.is_active) {
    const err = new Error('Target user not found or inactive'); err.statusCode = 400; err.code = 'INVALID_USER'; throw err;
  }

  try {
    return await assignmentRepo.createWithTransaction({ assetId, userId, assignedBy, notes });
  } catch (err) {
    if (err.message === 'Asset is not available for assignment') {
      const e = new Error(err.message); e.statusCode = 409; e.code = 'ASSET_NOT_AVAILABLE'; throw e;
    }
    throw err;
  }
}

async function returnAsset(assignmentId) {
  try {
    return await assignmentRepo.returnWithTransaction({ assignmentId });
  } catch (err) {
    if (err.message === 'Assignment not found or already returned') {
      const e = new Error(err.message); e.statusCode = 404; e.code = 'ASSIGNMENT_NOT_FOUND'; throw e;
    }
    throw err;
  }
}

module.exports = { assignAsset, returnAsset };