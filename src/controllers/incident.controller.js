const incidentRepo = require('../repositories/incident.repository');
const incidentService = require('../services/incident.service');
const { success, failure } = require('../utils/apiResponse');

async function list(req, res, next) {
  try {
    const { page = 1, limit = 10, status, severity, search } = req.query;
    const { rows, total } = await incidentRepo.findAll({ page: Number(page), limit: Number(limit), status, severity, search });
    return success(res, {
      message: 'Incidents retrieved',
      data: rows,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) },
      requestId: req.id
    });
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const incident = await incidentRepo.findById(req.params.id);
    if (!incident) return failure(res, { statusCode: 404, message: 'Incident not found', code: 'INCIDENT_NOT_FOUND', requestId: req.id });
    
    const updates = await incidentRepo.getUpdates(req.params.id);
    return success(res, { message: 'Incident retrieved', data: { ...incident, updates }, requestId: req.id });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const id = await incidentService.createManualIncident({
      title: req.body.title, description: req.body.description, severity: req.body.severity, createdBy: req.user.id
    });
    return success(res, { statusCode: 201, message: 'Incident created', data: { id }, requestId: req.id });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const { status, severity, assignedTo, rootCause, resolution } = req.body;
    const incident = await incidentRepo.findById(req.params.id);
    if (!incident) return failure(res, { statusCode: 404, message: 'Incident not found', code: 'INCIDENT_NOT_FOUND', requestId: req.id });

    await incidentRepo.update(req.params.id, { status, severity, assignedTo, rootCause, resolution });
    
    if (status && status !== incident.status) {
      await incidentRepo.addUpdate(req.params.id, req.user.id, 'STATUS_CHANGE', `Status diubah oleh ${req.user.username}`, incident.status, status);
    }
    
    return success(res, { message: 'Incident updated', data: null, requestId: req.id });
  } catch (err) { next(err); }
}

async function addNote(req, res, next) {
  try {
    await incidentRepo.addUpdate(req.params.id, req.user.id, 'NOTE', req.body.message);
    return success(res, { statusCode: 201, message: 'Note added', data: null, requestId: req.id });
  } catch (err) { next(err); }
}

module.exports = { list, getById, create, update, addNote };