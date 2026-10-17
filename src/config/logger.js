const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

const logDirectory = path.join(__dirname, '../../logs');

// Format log: [waktu] [level] [requestId] pesan
const logFormat = winston.format.printf(({ level, message, timestamp, requestId, stack }) => {
  const reqId = requestId ? `[${requestId}]` : '[system]';
  return `[${timestamp}] [${level.toUpperCase()}] ${reqId} ${message} ${stack ? '\n' + stack : ''}`;
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }), // Menangkap error stack
    logFormat
  ),
  transports: [
    // 1. Simpan semua log ke file harian
    new DailyRotateFile({
      dirname: logDirectory,
      filename: 'application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d', // Simpan log maksimal 14 hari
      level: 'info'
    }),
    // 2. Simpan error saja ke file terpisah
    new DailyRotateFile({
      dirname: logDirectory,
      filename: 'error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error'
    })
  ]
});

// Jika bukan production, tampilkan juga di console terminal
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      logFormat
    )
  }));
}

// Stream untuk Morgan (HTTP Request Logger)
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

module.exports = logger;