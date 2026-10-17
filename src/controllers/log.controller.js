const logRepo = require('../repositories/log.repository');
const { success } = require('../utils/apiResponse');

async function list(req, res, next) {
  try {
    const { page = 1, limit = 20, level, search } = req.query;
    const { rows, total } = await logRepo.findAll({ page: Number(page), limit: Number(limit), level, search });

    return success(res, {
      message: 'Logs retrieved',
      data: rows,
      pagination: {
        page: Number(page), limit: Number(limit), total,
        totalPages: Math.ceil(total / limit)
      },
      requestId: req.id
    });
  } catch (err) { next(err); }
}

module.exports = { list };