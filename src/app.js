require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');

// Config & Middleware
const logger = require('./config/logger');
const requestId = require('./middleware/requestId');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const { buildSessionMiddleware } = require('./config/session');

// Routes
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const categoryRoutes = require('./routes/category.routes');
const assetRoutes = require('./routes/asset.routes');
const assignmentRoutes = require('./routes/assignment.routes');
const maintenanceRoutes = require('./routes/maintenance.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const logRoutes = require('./routes/log.routes');
const monitorRoutes = require('./routes/monitor.routes');
const incidentRoutes = require('./routes/incident.routes');

const app = express();

// ==========================================
// 1. Global Middleware
// ==========================================
// Security Headers (Updated for Chart.js CDN)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"]
      },
    },
  })
);

app.use(requestId);

// Setup Morgan (HTTP Request Logger)
morgan.token('req-id', (req) => req.id);
morgan.token('user-id', (req) => req.session?.userId || 'anon');
const morganFormat = ':method :url :status :response-time ms - req-id::req-id - user::user-id';
app.use(morgan(morganFormat, { stream: logger.stream }));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use(express.static(path.join(__dirname, '../public')));
app.use(buildSessionMiddleware());

// Global Rate Limiter
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

// ==========================================
// 2. Routes
// ==========================================
app.use('/api/v1', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/assets', assetRoutes);
app.use('/api/v1/assignments', assignmentRoutes);
app.use('/api/v1/maintenance', maintenanceRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/logs', logRoutes);
app.use('/api/v1/monitors', monitorRoutes);
app.use('/api/v1/incidents', incidentRoutes);

// ==========================================
// 3. Error Handling (Harus paling bawah)
// ==========================================
app.use(notFound);
app.use(errorHandler);

module.exports = app;