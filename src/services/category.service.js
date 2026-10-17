const categoryRepo = require('../repositories/category.repository');

async function createCategory({ name, description }) {
  const existing = await categoryRepo.findByName(name);
  if (existing) {
    const err = new Error('Category name already exists');
    err.statusCode = 409;
    err.code = 'DUPLICATE_CATEGORY';
    throw err;
  }
  return await categoryRepo.create({ name, description });
}

async function updateCategory(id, { name, description }) {
  const target = await categoryRepo.findById(id);
  if (!target) {
    const err = new Error('Category not found');
    err.statusCode = 404;
    err.code = 'CATEGORY_NOT_FOUND';
    throw err;
  }

  if (target.name !== name) {
    const existing = await categoryRepo.findByName(name);
    if (existing) {
      const err = new Error('Category name already exists');
      err.statusCode = 409;
      err.code = 'DUPLICATE_CATEGORY';
      throw err;
    }
  }
  await categoryRepo.update(id, { name, description });
}

async function deleteCategory(id) {
  const target = await categoryRepo.findById(id);
  if (!target) {
    const err = new Error('Category not found');
    err.statusCode = 404;
    err.code = 'CATEGORY_NOT_FOUND';
    throw err;
  }
  await categoryRepo.remove(id);
}

module.exports = { createCategory, updateCategory, deleteCategory };