import { createLogger } from '@hydra/core';
import { env } from './config/index.js';
import { buildApp } from './app.js';

const logger = createLogger({ name: 'api', level: env.LOG_LEVEL });

/**
 * Starts the HYDRA API server and registers graceful shutdown handlers.
 */
async function main(): Promise<void> {
  const app = await buildApp();

  // ── Graceful shutdown ───────────────────────────────────────────
  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Received shutdown signal, closing server');
    try {
      await app.close();
      logger.info('Server closed gracefully');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  // ── Start listening ─────────────────────────────────────────────
  try {
    const address = await app.listen({
      port: env.PORT,
      host: '0.0.0.0',
    });

    logger.info(
      { port: env.PORT, env: env.NODE_ENV, address },
      `HYDRA API server listening on ${address}`,
    );
  } catch (err) {
    logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
  }
}

void main();
