const mongoose = require('mongoose');
const config = require('./env');
const logger = require('../utils/logger');

const getDBStatus = () => {
  // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (mongoose.connection.readyState === 1) {
    return 'healthy';
  }
  return 'unavailable';
};

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  try {
    mongoose.connection.on('connected', () => {
      logger.info('database_connected', 'MongoDB connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('database_error', 'MongoDB connection error', { error: err.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('database_disconnected', 'MongoDB connection disconnected');
    });

    await mongoose.connect(config.MONGODB_URI, {
      serverSelectionTimeoutMS: config.MONGODB_CONNECT_TIMEOUT_MS,
    });

    return true;
  } catch (error) {
    logger.error('database_connection_failed', 'Failed to connect to MongoDB', {
      error: error.message,
    });
    // Do not rethrow in order to allow API server to start degraded if DB is unavailable
    return false;
  }
};

const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    try {
      await mongoose.disconnect();
      logger.info('database_disconnected', 'MongoDB connection closed gracefully');
    } catch (error) {
      logger.error('database_disconnect_error', 'Error closing MongoDB connection', {
        error: error.message,
      });
    }
  }
};

module.exports = {
  connectDB,
  disconnectDB,
  getDBStatus,
};
