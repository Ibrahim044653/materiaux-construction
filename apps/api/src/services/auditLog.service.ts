import { Request } from 'express';
import { prisma } from '../config/prisma';

interface LogParams {
  tenantId?: string | null;
  userId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  details?: Record<string, unknown>;
  req?: Request;
}

export class AuditLogService {
  async log(params: LogParams): Promise<void> {
    try {
      // Use raw SQL to avoid Prisma client type issues until prisma generate runs
      await prisma.$executeRawUnsafe(
        `INSERT INTO audit_logs (id, "tenantId", "userId", action, resource, "resourceId", details, "ipAddress", "userAgent", "createdAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        params.tenantId ?? null,
        params.userId ?? null,
        params.action,
        params.resource,
        params.resourceId ?? null,
        params.details ? JSON.stringify(params.details) : null,
        params.req
          ? ((params.req.headers['x-forwarded-for'] as string) ??
              params.req.socket.remoteAddress ??
              null)
          : null,
        params.req?.headers['user-agent'] ?? null
      );
    } catch {
      // Audit log failures must never break business logic
    }
  }

  async find(opts: {
    tenantId?: string;
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    perPage?: number;
  }) {
    const { page = 1, perPage = 50 } = opts;

    // Use raw query for flexibility
    const conditions: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    if (opts.tenantId) {
      conditions.push(`"tenantId" = $${i++}`);
      values.push(opts.tenantId);
    }
    if (opts.userId) {
      conditions.push(`"userId" = $${i++}`);
      values.push(opts.userId);
    }
    if (opts.action) {
      conditions.push(`action = $${i++}`);
      values.push(opts.action);
    }
    if (opts.resource) {
      conditions.push(`resource = $${i++}`);
      values.push(opts.resource);
    }
    if (opts.startDate) {
      conditions.push(`"createdAt" >= $${i++}`);
      values.push(opts.startDate);
    }
    if (opts.endDate) {
      conditions.push(`"createdAt" <= $${i++}`);
      values.push(opts.endDate);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * perPage;

    const [countResult, rows] = await Promise.all([
      prisma.$queryRawUnsafe<[{ count: bigint }]>(
        `SELECT COUNT(*) as count FROM audit_logs ${where}`,
        ...values
      ),
      prisma.$queryRawUnsafe<unknown[]>(
        `SELECT al.*, row_to_json(u.*) as "user"
         FROM audit_logs al
         LEFT JOIN users u ON u.id = al."userId"
         ${where}
         ORDER BY al."createdAt" DESC
         LIMIT $${i} OFFSET $${i + 1}`,
        ...values,
        perPage,
        offset
      ),
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    return {
      data: rows,
      meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
    };
  }
}

export const auditLogService = new AuditLogService();
