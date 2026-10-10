// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  ROUTE TEMPORAIRE — A SUPPRIMER APRES USAGE                              ║
// ║                                                                          ║
// ║  Applique les migrations Prisma en attente depuis le runtime de l'API,   ║
// ║  seul endroit qui dispose de la connexion a la base de production :      ║
// ║  DATABASE_URL y est marquee « Sensitive » cote Vercel, donc illisible    ║
// ║  depuis le tableau de bord comme depuis le CLI.                          ║
// ║                                                                          ║
// ║  Reservee au SUPER_ADMIN, idempotente (relit _prisma_migrations avant    ║
// ║  d'agir). Elle doit etre retiree des que la base est a jour.             ║
// ╚══════════════════════════════════════════════════════════════════════════╝
import { createHash } from 'crypto';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../middlewares/authenticate';
import { prisma } from '../config/prisma';
import { AppError } from '../middlewares/errorHandler';
import { apiResponse } from '../utils/apiResponse';

const router: Router = Router();

// Le bundle serverless embarque apps/api/prisma/** (includeFiles du vercel.json),
// mais la racine d'execution differe du poste de developpement.
function migrationsDir(): string {
  const candidats = [
    resolve(__dirname, '../../prisma/migrations'),
    resolve(__dirname, '../../../prisma/migrations'),
    resolve(process.cwd(), 'apps/api/prisma/migrations'),
    resolve(process.cwd(), 'prisma/migrations'),
  ];
  const trouve = candidats.find((c) => existsSync(c));
  if (!trouve) {
    throw new AppError(
      `Dossier des migrations introuvable. Chemins testés : ${candidats.join(', ')}`,
      500
    );
  }
  return trouve;
}

function migrationsLocales(): { name: string; sql: string; checksum: string }[] {
  const dir = migrationsDir();
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && existsSync(join(dir, e.name, 'migration.sql')))
    .map((e) => e.name)
    .sort()
    .map((name) => {
      const sql = readFileSync(join(dir, name, 'migration.sql'), 'utf8');
      return { name, sql, checksum: createHash('sha256').update(sql).digest('hex') };
    });
}

async function migrationsAppliquees(): Promise<string[]> {
  const rows = await prisma.$queryRawUnsafe<{ migration_name: string }[]>(
    `SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`
  );
  return rows.map((r) => r.migration_name);
}

// Prisma refuse plusieurs instructions dans un meme appel : on decoupe le
// fichier. Les migrations du projet ne contiennent ni bloc $$ ni point-virgule
// dans une chaine, ce decoupage simple est donc sur ici.
function decouper(sql: string): string[] {
  return sql
    .split('\n')
    .filter((l) => !l.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// GET /admin/db/migrations — etat, sans rien modifier
router.get(
  '/db/migrations',
  authenticate,
  authorize('SUPER_ADMIN'),
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appliquees = await migrationsAppliquees();
      const locales = migrationsLocales();
      apiResponse.success(res, {
        appliquees,
        enAttente: locales.filter((m) => !appliquees.includes(m.name)).map((m) => m.name),
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /admin/db/migrations — applique ce qui manque
router.post(
  '/db/migrations',
  authenticate,
  authorize('SUPER_ADMIN'),
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appliquees = await migrationsAppliquees();
      const enAttente = migrationsLocales().filter((m) => !appliquees.includes(m.name));

      if (enAttente.length === 0) {
        apiResponse.success(res, { message: 'Base déjà à jour', appliquees: [] });
        return;
      }

      const resultats: { name: string; instructions: number }[] = [];

      for (const migration of enAttente) {
        const instructions = decouper(migration.sql);

        // Postgres rend le DDL transactionnel : en cas d'echec sur une
        // instruction, la migration entiere est annulee, pas a moitie posee.
        await prisma.$transaction(
          async (tx) => {
            for (const instruction of instructions) {
              await tx.$executeRawUnsafe(instruction);
            }
            await tx.$executeRawUnsafe(
              `INSERT INTO "_prisma_migrations"
                 ("id", "checksum", "finished_at", "migration_name", "started_at", "applied_steps_count")
               VALUES (gen_random_uuid()::text, $1, NOW(), $2, NOW(), $3)`,
              migration.checksum,
              migration.name,
              instructions.length
            );
          },
          { timeout: 120_000, maxWait: 20_000 }
        );

        resultats.push({ name: migration.name, instructions: instructions.length });
      }

      apiResponse.success(res, { message: 'Migrations appliquées', appliquees: resultats });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
