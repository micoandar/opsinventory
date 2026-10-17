const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

const SESSION_MAX_AGE_MS = Number(process.env.SESSION_MAX_AGE_MS) || 24 * 60 * 60 * 1000;

const secret = process.env.SESSION_SECRET;
if (!secret || secret.length < 32) {
  throw new Error(
    'SESSION_SECRET is missing or too short (min 32 chars). ' +
    'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))" ' +
    'and add it to .env as SESSION_SECRET=...'
  );
}

const store = new MySQLStore({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'opsinventory_db',
  createDatabaseTable: true,
  clearExpired: true,
  checkExpirationInterval: 15 * 60 * 1000,
  expiration: SESSION_MAX_AGE_MS,
  schema: {
    tableName: 'sessions',
    columnNames: {
      session_id: 'session_id',
      expires: 'expires',
      data: 'data'
    }
  }
});

function buildSessionMiddleware() {
  return session({
    name: process.env.SESSION_NAME || 'opsinv.sid',
    secret,
    store,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: SESSION_MAX_AGE_MS
    }
  });
}

module.exports = { buildSessionMiddleware, store };