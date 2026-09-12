const app = require('./app');
const config = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');
const logger = require('./utils/logger');

let server;

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
  logger.info('server_shutdown_initiated', `Received ${signal}. Shutting down gracefully...`);

  if (server) {
    server.close(async () => {
      logger.info('http_server_closed', 'HTTP server closed');
      await disconnectDB();
      logger.info('server_stopped', 'HMWebDoctor Server stopped cleanly');
      process.exit(0);
    });

    // Force shutdown after timeout if connections remain
    setTimeout(() => {
      logger.error('server_forced_shutdown', 'Forced shutdown due to timeout');
      process.exit(1);
    }, 10000);
  } else {
    await disconnectDB();
    process.exit(0);
  }
};

process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));

startServer();

module.exports = { startServer, handleGracefulShutdown };
