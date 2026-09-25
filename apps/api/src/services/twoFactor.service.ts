import { prisma } from '../config/prisma';
import { AppError } from '../middlewares/errorHandler';

// Dynamic import to handle optional package until installed
async function getAuthenticator() {
  try {
    const { authenticator } = await import('otplib');
    authenticator.options = { step: 30, digits: 6 };
    return authenticator;
  } catch {
    throw new AppError('Module TOTP non disponible', 500);
  }
}

async function getQrcode() {
  try {
    const qrcode = await import('qrcode');
    return qrcode.default;
  } catch {
    throw new AppError('Module QRCode non disponible', 500);
  }
}

export class TwoFactorService {
  async generateSecret(email: string): Promise<{ secret: string; otpAuthUrl: string }> {
    const auth = await getAuthenticator();
    const secret = auth.generateSecret();
    const otpAuthUrl = auth.keyuri(email, 'MatériauxPro Admin', secret);
    return { secret, otpAuthUrl };
  }

  async generateQrCode(otpAuthUrl: string): Promise<string> {
    const qrcode = await getQrcode();
    return qrcode.toDataURL(otpAuthUrl);
  }

  async verifyToken(secret: string, token: string): Promise<boolean> {
    const auth = await getAuthenticator();
    return auth.verify({ token, secret });
  }

  async enable(userId: string, secret: string, token: string): Promise<void> {
    if (!(await this.verifyToken(secret, token))) {
      throw new AppError('Code TOTP invalide', 400);
    }
    await prisma.$executeRawUnsafe(
      `UPDATE users SET "twoFactorSecret" = $1, "twoFactorEnabled" = true WHERE id = $2`,
      secret,
      userId
    );
  }

  async disable(userId: string, token: string): Promise<void> {
    const rows = await prisma.$queryRawUnsafe<
      { twoFactorEnabled: boolean; twoFactorSecret: string | null }[]
    >(`SELECT "twoFactorEnabled", "twoFactorSecret" FROM users WHERE id = $1`, userId);
    const user = rows[0];
    if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
      throw new AppError("La 2FA n'est pas activée", 400);
    }
    if (!(await this.verifyToken(user.twoFactorSecret, token))) {
      throw new AppError('Code TOTP invalide', 400);
    }
    await prisma.$executeRawUnsafe(
      `UPDATE users SET "twoFactorSecret" = NULL, "twoFactorEnabled" = false WHERE id = $1`,
      userId
    );
  }

  async validateLogin(userId: string, token: string): Promise<void> {
    const rows = await prisma.$queryRawUnsafe<{ twoFactorSecret: string | null }[]>(
      `SELECT "twoFactorSecret" FROM users WHERE id = $1`,
      userId
    );
    const secret = rows[0]?.twoFactorSecret;
    if (!secret) throw new AppError('2FA non configurée', 400);
    if (!(await this.verifyToken(secret, token))) {
      throw new AppError('Code TOTP invalide. Réessayez.', 401);
    }
  }
}

export const twoFactorService = new TwoFactorService();
