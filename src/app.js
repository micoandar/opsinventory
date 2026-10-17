require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const requestId = require('./middleware/requestId');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const { buildSessionMiddleware } = require('./config/session');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');

const app = express();

app.use(helmet());
app.use(requestId);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Session harus dipasang sebelum routes yang butuh req.session
app.use(buildSessionMiddleware());

// Rate limit global /api — batas lebar; endpoint login punya limit tersendiri
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    error: { code: 'RATE_LIMITED' }
  }
});
app.use('/api', apiLimiter);

// Routes
app.use('/api/v1', healthRoutes);
app.use('/api/v1/auth', authRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;