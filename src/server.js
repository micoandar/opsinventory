require('dotenv').config();
const app = require('./app');
const pool = require('./config/database');
const { store } = require('./config/session');

const PORT = Number(process.env.PORT) || 3000;

const server = app.listen(PORT, () => {
  console.log(`[server] OpsInventory listening on http://localhost:${PORT}`);
  console.log(`[server] Health check: http://localhost:${PORT}/api/v1/health`);
  console.log(`[server] Environment: ${process.env.NODE_ENV || 'development'}`);
});

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[server] ${signal} received. Shutting down gracefully...`);

  const forceTimer = setTimeout(() => {
    console.error('[server] Forced shutdown after 10s timeout');
    process.exit(1);
  }, 10000);
  forceTimer.unref();

  server.close(async () => {
    console.log('[server] HTTP server closed');

    if (store && typeof store.close === 'function') {
      await new Promise((resolve) => {
        try { store.close(() => resolve()); }
        catch { resolve(); }
      });
      console.log('[server] Session store closed');
    }

    try {
      await pool.end();
      console.log('[server] MySQL pool closed');
    } catch (err) {
      console.error('[server] Error closing MySQL pool:', err.message);
    } finally {
      clearTimeout(forceTimer);
      process.exit(0);
    }
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  console.error('[server] Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[server] Uncaught exception:', err);
  shutdown('uncaughtException');
});