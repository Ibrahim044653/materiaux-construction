// jest.mock() calls MUST be at the top — Jest hoists them before imports
jest.mock('../../config/prisma', () => ({
  prisma: require('../helpers/prismaMock').prismaMock,
}));
jest.mock('web-push', () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn().mockResolvedValue({ statusCode: 201 }),
}));

import { prismaMock } from '../helpers/prismaMock';
import { PushService } from '../../services/push.service';

describe('PushService', () => {
  let service: PushService;

  beforeEach(() => {
    service = new PushService();
    delete process.env.VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;
    delete process.env.VAPID_EMAIL;
  });

  describe('getVapidPublicKey()', () => {
    it('retourne null si VAPID non configuré', () => {
      expect(service.getVapidPublicKey()).toBeNull();
    });

    it('retourne la clé si VAPID_PUBLIC_KEY est définie', () => {
      process.env.VAPID_PUBLIC_KEY = 'test-public-key';
      expect(service.getVapidPublicKey()).toBe('test-public-key');
    });
  });

  describe('save()', () => {
    it('insère la subscription en base sans erreur', async () => {
      prismaMock.$executeRawUnsafe.mockResolvedValueOnce(1);
      const sub = {
        endpoint: 'https://fcm.googleapis.com/test',
        keys: { p256dh: 'key1', auth: 'auth1' },
      };
      await expect(
        service.save('user-1', 'tenant-1', sub as unknown as import('web-push').PushSubscription)
      ).resolves.toBeUndefined();
      expect(prismaMock.$executeRawUnsafe).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove()', () => {
    it('supprime la subscription en base', async () => {
      prismaMock.$executeRawUnsafe.mockResolvedValueOnce(1);
      await expect(
        service.remove('user-1', 'https://fcm.googleapis.com/test')
      ).resolves.toBeUndefined();
      expect(prismaMock.$executeRawUnsafe).toHaveBeenCalledTimes(1);
    });
  });

  describe('sendToTenant()', () => {
    it('ne lance pas si VAPID non configuré', async () => {
      prismaMock.$queryRawUnsafe.mockResolvedValueOnce([]);
      await expect(
        service.sendToTenant('tenant-1', { title: 'Test', body: 'Hello' })
      ).resolves.toBeUndefined();
    });
  });
});
