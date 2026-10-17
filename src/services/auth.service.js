const argon2 = require('argon2');
const userRepo = require('../repositories/user.repository');

function toPublicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    lastLoginAt: user.last_login_at
  };
}

/**
 * Verifikasi kredensial. Mengembalikan { ok, user } atau { ok: false }.
 * Semua kegagalan dikembalikan sebagai `ok: false` dengan alasan yang seragam
 * agar tidak membocorkan user mana yang ada / aktif.
 */
async function authenticate({ identifier, password }) {
  if (!identifier || !password) return { ok: false };

  const user = await userRepo.findByUsernameOrEmail(identifier);
  if (!user) return { ok: false };
  if (!user.is_active) return { ok: false };

  let matches = false;
  try {
    matches = await argon2.verify(user.password_hash, password);
  } catch {
    matches = false;
  }
  if (!matches) return { ok: false };

  return { ok: true, user };
}

module.exports = { authenticate, toPublicUser };