const app = require('./app');
const { pool, runMigrations } = require('./config/database');
const redis = require('./config/redis');
const env = require('./config/env');
const logger = require('./utils/logger');
const { initChatSocket } = require('./modules/chat/chat.socket');
const { initOrgChatSocket } = require('./modules/orgChat/orgChat.socket');
async function bootstrap() {
  try {
    // Verify PostgreSQL connectivity
    await pool.query('SELECT 1');
    logger.info('PostgreSQL connected successfully');

    // Run migrations on startup
    await runMigrations();

    // Start HTTP server
    const server = app.listen(env.port, '0.0.0.0', () => {
      logger.info(`JOB NEST CRM Backend listening on port ${env.port} [${env.nodeEnv}]`);
    });

    // Initialize Chat WebSockets
    initChatSocket(server);
    initOrgChatSocket(server);

    // Graceful shutdown handler
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received — starting graceful shutdown`);

      server.close(async () => {
        try {
          await pool.end();
          logger.info('PostgreSQL pool closed');
          await redis.quit();
          logger.info('Redis connection closed');
          logger.info('Server shutdown complete');
          process.exit(0);
        } catch (err) {
          logger.error('Error during shutdown', { message: err.message });
          process.exit(1);
        }
      });

      // Force exit if graceful shutdown takes too long
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Promise Rejection', { reason: String(reason) });
    });

    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception', { message: err.message, stack: err.stack });
      process.exit(1);
    });

  } catch (err) {
    logger.error('Failed to start server', { message: err.message, stack: err.stack });
    process.exit(1);
  }
}

bootstrap();
