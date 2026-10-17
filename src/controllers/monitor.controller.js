const monitorRepo = require('../repositories/monitor.repository');
const monitorService = require('../services/monitor.service');
const { success, failure } = require('../utils/apiResponse');

async function list(req, res, next) {
  try {
    const data = await monitorRepo.findAll();
    return success(res, { message: 'Monitors retrieved', data, requestId: req.id });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const id = await monitorService.createService({
      name: req.body.name,
      url: req.body.url,
      method: req.body.method || 'GET',
      expectedStatusCode: req.body.expectedStatusCode || 200,
      checkIntervalSeconds: req.body.checkIntervalSeconds || 60,
      timeoutMs: req.body.timeoutMs || 5000,
      failureThreshold: req.body.failureThreshold || 3,
      recoveryThreshold: req.body.recoveryThreshold || 2
    });
    return success(res, { statusCode: 201, message: 'Monitor created', data: { id }, requestId: req.id });
  } catch (err) { next(err); }
}

async function getLogs(req, res, next) {
  try {
    const data = await monitorRepo.getHealthLogs(req.params.id, 50);
    return success(res, { message: 'Health logs retrieved', data, requestId: req.id });
  } catch (err) { next(err); }
}

module.exports = { list, create, getLogs };