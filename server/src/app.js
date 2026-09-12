const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const config = require('./config/env');
const healthRouter = require('./routes/health');
const scansRouter = require('./routes/scans');
const notFoundHandler = require('./middleware/notFoundHandler');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Trust proxy configuration
app.set('trust proxy', config.TRUST_PROXY === 'true' ? true : config.TRUST_PROXY === 'false' ? false : config.TRUST_PROXY);

// Security headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: config.CLIENT_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parser limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Mount API Routes
app.use('/api/health', healthRouter);
app.use('/api/scans', scansRouter);

// 404 & Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
