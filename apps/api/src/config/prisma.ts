import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Strip BOM that PowerShell on Windows can prepend to env vars set via stdin pipe
const rawUrl = process.env.DATABASE_URL ?? '';
const dbUrl = rawUrl.charCodeAt(0) === 0xfeff ? rawUrl.slice(1) : rawUrl;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: dbUrl } },
    log: ['warn', 'error'],
  });

if (process.env.NODE_ENV === 'development') {
  logger.info('Prisma client initialisé en mode développement');
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
