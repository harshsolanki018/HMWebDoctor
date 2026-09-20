const app = require('./app');
const config = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');
const logger = require('./utils/logger');

let server;
let isShuttingDown = false;

const startServer = async () => {
  // Attempt DB connection
  await connectDB();

  // Start HTTP listener
  server = app.listen(config.PORT, () => {
    logger.info('server_started', `HMWebDoctor Server running on port ${config.PORT}`, {
      environment: config.NODE_ENV,
      port: config.PORT,
    });
  });
};

const handleGracefulShutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info('server_shutdown_initiated', `Received ${signal}. Shutting down gracefully...`);

  const forceTimeout = setTimeout(() => {
    logger.error('server_forced_shutdown', 'Forced shutdown due to timeout');
    process.exit(1);
  }, 10000);

  if (server) {
    server.close(async () => {
      logger.info('http_server_closed', 'HTTP server closed');
      clearTimeout(forceTimeout);
      await disconnectDB();
      logger.info('server_stopped', 'HMWebDoctor Server stopped cleanly');
      process.exit(signal === 'UNCAUGHT_EXCEPTION' ? 1 : 0);
    });
  } else {
    clearTimeout(forceTimeout);
    await disconnectDB();
    process.exit(signal === 'UNCAUGHT_EXCEPTION' ? 1 : 0);
  }
};

process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  logger.error('unhandled_rejection', 'Unhandled Promise Rejection caught at process level', {
    reason: reason instanceof Error ? reason.message : String(reason),
  });
});

process.on('uncaughtException', (err) => {
  logger.error('uncaught_exception', 'Uncaught Exception caught at process level', {
    error: err instanceof Error ? err.message : String(err),
  });
  handleGracefulShutdown('UNCAUGHT_EXCEPTION');
});

startServer();

module.exports = { startServer, handleGracefulShutdown };
