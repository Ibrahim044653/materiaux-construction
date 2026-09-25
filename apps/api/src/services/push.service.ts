import webpush, { PushSubscription } from 'web-push';
import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';

// VAPID keys must be set in .env:
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL
// Generate with: npx web-push generate-vapid-keys

let initialized = false;

function ensureInit(): void {
  if (initialized) return;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL;
  if (!pub || !priv || !email) {
    logger.warn('Web Push VAPID keys not configured — push notifications disabled');
    return;
  }
  webpush.setVapidDetails(`mailto:${email}`, pub, priv);
  initialized = true;
}

export class PushService {
  getVapidPublicKey(): string | null {
    return process.env.VAPID_PUBLIC_KEY ?? null;
  }

  async save(userId: string, tenantId: string, sub: PushSubscription): Promise<void> {
    await prisma.$executeRawUnsafe(
      `INSERT INTO push_subscriptions (id, user_id, tenant_id, endpoint, p256dh, auth)
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5)
       ON CONFLICT (user_id, endpoint) DO NOTHING`,
      userId,
      tenantId,
      sub.endpoint,
      (sub.keys as { p256dh: string; auth: string }).p256dh,
      (sub.keys as { p256dh: string; auth: string }).auth
    );
  }

  async remove(userId: string, endpoint: string): Promise<void> {
    await prisma.$executeRawUnsafe(
      `DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2`,
      userId,
      endpoint
    );
  }

  async sendToUser(userId: string, payload: object): Promise<void> {
    ensureInit();
    if (!initialized) return;

    const subs = await prisma.$queryRawUnsafe<
      Array<{ endpoint: string; p256dh: string; auth: string }>
    >(`SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1`, userId);

    await Promise.allSettled(
      subs.map((s) =>
        webpush
          .sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            JSON.stringify(payload)
          )
          .catch((err: Error) => logger.warn(`Push failed for user ${userId}: ${err.message}`))
      )
    );
  }

  async sendToTenant(tenantId: string, payload: object): Promise<void> {
    ensureInit();
    if (!initialized) return;

    const subs = await prisma.$queryRawUnsafe<
      Array<{ endpoint: string; p256dh: string; auth: string }>
    >(`SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE tenant_id = $1`, tenantId);

    await Promise.allSettled(
      subs.map((s) =>
        webpush
          .sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            JSON.stringify(payload)
          )
          .catch((err: Error) => logger.warn(`Push failed for tenant ${tenantId}: ${err.message}`))
      )
    );
  }

  async sendStockAlert(
    tenantId: string,
    productName: string,
    storeName: string,
    qty: number
  ): Promise<void> {
    await this.sendToTenant(tenantId, {
      title: '⚠️ Alerte stock bas',
      body: `${productName} — ${storeName}: ${qty} unité(s) restante(s)`,
      url: '/stock',
      tag: `stock-alert-${productName}`,
    });
  }
}

export const pushService = new PushService();
