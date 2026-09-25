import app from './app';
import { logger } from './utils/logger';

const PORT = parseInt(process.env.PORT ?? '3001', 10);

const server = app.listen(PORT, () => {
  logger.info(`🚀 API démarrée sur le port ${PORT} [${process.env.NODE_ENV}]`);
});

// Graceful shutdown
const shutdown = (signal: string) => {
  logger.info(`Signal ${signal} reçu. Arrêt gracieux...`);
  server.close(() => {
    logger.info('Serveur HTTP fermé.');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Promesse non gérée');
  process.exit(1);
});
