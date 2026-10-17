const argon2 = require('argon2');
const userRepo = require('../repositories/user.repository');

function toPublicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    isActive: Boolean(user.is_active),
    lastLoginAt: user.last_login_at,
    createdAt: user.created_at
  };
}

async function createUser({ username, email, password, fullName, role }) {
  const existing = await userRepo.findByUsernameOrEmail(username) || await userRepo.findByUsernameOrEmail(email);
  if (existing) {
    const err = new Error('Username or email already exists');
    err.statusCode = 409;
    err.code = 'DUPLICATE_USER';
    throw err;
  }

  const passwordHash = await argon2.hash(password);
  const id = await userRepo.create({ username, email, passwordHash, fullName, role, isActive: true });
  return id;
}

async function updateUser(id, { email, fullName, role }) {
  const target = await userRepo.findById(id);
  if (!target) {
    const err = new Error('User not found');
    err.statusCode = 404;
    err.code = 'USER_NOT_FOUND';
    throw err;
  }

  if (target.email !== email) {
    const emailCheck = await userRepo.findByUsernameOrEmail(email);
    if (emailCheck) {
      const err = new Error('Email already exists');
      err.statusCode = 409;
      err.code = 'DUPLICATE_EMAIL';
      throw err;
    }
  }

  await userRepo.update(id, { email, fullName, role });
}

async function changePassword(id, password) {
  const target = await userRepo.findById(id);
  if (!target) {
    const err = new Error('User not found');
    err.statusCode = 404;
    err.code = 'USER_NOT_FOUND';
    throw err;
  }

  const hash = await argon2.hash(password);
  await userRepo.updatePassword(id, hash);
}

async function setStatus(id, isActive) {
  if (id === 1) {
    const err = new Error('Cannot deactivate primary admin');
    err.statusCode = 400;
    err.code = 'CANNOT_DEACTIVATE_ADMIN';
    throw err;
  }

  await userRepo.updateStatus(id, isActive);
}

module.exports = { toPublicUser, createUser, updateUser, changePassword, setStatus };