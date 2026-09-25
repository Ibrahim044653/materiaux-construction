// jest.mock() calls MUST be at the top — Jest hoists them before imports
jest.mock('../../config/prisma', () => ({
  prisma: require('../helpers/prismaMock').prismaMock,
}));
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

import { prismaMock } from '../helpers/prismaMock';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthService } from '../../services/auth.service';

const mockBcryptCompare = bcrypt.compare as jest.Mock;
const mockJwtSign = jwt.sign as jest.Mock;

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'CASHIER',
  tenantId: 'tenant-abc',
  storeId: null,
  passwordHash: '$2a$12$hashedpassword',
  isActive: true,
  twoFactorEnabled: false,
  tenantStatus: 'ACTIVE',
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService();
    mockJwtSign.mockReturnValue('mocked.jwt.token');
  });

  describe('login()', () => {
    it('retourne les tokens pour des identifiants valides', async () => {
      prismaMock.$queryRawUnsafe.mockResolvedValueOnce([mockUser]);
      prismaMock.user.update.mockResolvedValueOnce(mockUser);
      prismaMock.refreshToken.create.mockResolvedValueOnce({ id: 'rt-1' });
      mockBcryptCompare.mockResolvedValueOnce(true);

      const result = await service.login('test@example.com', 'password123');

      expect(result.requiresTwoFactor).toBeFalsy();
      expect(result.accessToken).toBeDefined();
      expect(result.user).toBeDefined();
    });

    it("lève une erreur si l'email est inconnu", async () => {
      prismaMock.$queryRawUnsafe.mockResolvedValueOnce([]);

      await expect(service.login('inexistant@example.com', 'password123')).rejects.toMatchObject({
        statusCode: 401,
      });
    });

    it('lève une erreur si le mot de passe est incorrect', async () => {
      prismaMock.$queryRawUnsafe.mockResolvedValueOnce([mockUser]);
      mockBcryptCompare.mockResolvedValueOnce(false);

      await expect(service.login('test@example.com', 'mauvais')).rejects.toMatchObject({
        statusCode: 401,
      });
    });

    it('lève une erreur si le compte est inactif', async () => {
      prismaMock.$queryRawUnsafe.mockResolvedValueOnce([{ ...mockUser, isActive: false }]);

      await expect(service.login('test@example.com', 'password123')).rejects.toMatchObject({
        statusCode: 401,
      });
    });

    it('lève une erreur si le tenant est suspendu', async () => {
      prismaMock.$queryRawUnsafe.mockResolvedValueOnce([
        { ...mockUser, tenantStatus: 'SUSPENDED' },
      ]);

      await expect(service.login('test@example.com', 'password123')).rejects.toMatchObject({
        statusCode: 403,
      });
    });

    it('retourne requiresTwoFactor si 2FA est activée', async () => {
      prismaMock.$queryRawUnsafe.mockResolvedValueOnce([{ ...mockUser, twoFactorEnabled: true }]);
      mockBcryptCompare.mockResolvedValueOnce(true);

      const result = (await service.login('test@example.com', 'password123')) as any;

      expect(result.requiresTwoFactor).toBe(true);
      expect(result.userId).toBe('user-123');
      expect(result.accessToken).toBeNull();
    });
  });
});
