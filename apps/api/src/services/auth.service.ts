import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { jwtConfig } from '../config/jwt';
import { AppError } from '../middlewares/errorHandler';
import { AuthPayload } from '../middlewares/authenticate';
import { Role } from '@materiaux/shared';

export class AuthService {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { tenant: { select: { id: true, status: true } } },
    });

    if (!user || !user.isActive) {
      throw new AppError('Email ou mot de passe incorrect', 401);
    }

    if (user.tenant && user.tenant.status === 'SUSPENDED') {
      throw new AppError("Ce compte a été suspendu. Contactez l'administrateur.", 403);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new AppError('Email ou mot de passe incorrect', 401);
    }

    // Réinitialiser le compteur de tentatives après succès
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const payload: AuthPayload = {
      sub: user.id,
      tenantId: user.tenantId ?? '',
      role: user.role as Role,
      storeId: user.storeId ?? undefined,
    };

    const accessToken = jwt.sign(payload, jwtConfig.accessSecret, {
      expiresIn: jwtConfig.accessExpiresIn,
    });

    const refreshToken = jwt.sign({ sub: user.id }, jwtConfig.refreshSecret, {
      expiresIn: jwtConfig.refreshExpiresIn,
    });

    // Stocker le refresh token hashé en base
    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashedRefresh,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        storeId: user.storeId,
      },
    };
  }

  async refresh(refreshToken: string) {
    let decoded: { sub: string };
    try {
      decoded = jwt.verify(refreshToken, jwtConfig.refreshSecret) as { sub: string };
    } catch {
      throw new AppError('Refresh token invalide ou expiré', 401);
    }

    const stored = await prisma.refreshToken.findMany({
      where: { userId: decoded.sub, expiresAt: { gt: new Date() }, revokedAt: null },
    });

    let validRecord = null;
    for (const record of stored) {
      if (await bcrypt.compare(refreshToken, record.tokenHash)) {
        validRecord = record;
        break;
      }
    }

    if (!validRecord) throw new AppError('Refresh token révoqué ou inconnu', 401);

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      include: { tenant: { select: { status: true } } },
    });

    if (!user || !user.isActive) throw new AppError('Utilisateur inactif', 401);

    const payload: AuthPayload = {
      sub: user.id,
      tenantId: user.tenantId ?? '',
      role: user.role as Role,
      storeId: user.storeId ?? undefined,
    };

    const newAccessToken = jwt.sign(payload, jwtConfig.accessSecret, {
      expiresIn: jwtConfig.accessExpiresIn,
    });

    return { accessToken: newAccessToken };
  }

  async logout(refreshToken: string) {
    // Révoquer le refresh token sans lever d'erreur si introuvable
    try {
      const decoded = jwt.decode(refreshToken) as { sub?: string };
      if (!decoded?.sub) return;

      const stored = await prisma.refreshToken.findMany({
        where: { userId: decoded.sub, revokedAt: null },
      });

      for (const record of stored) {
        if (await bcrypt.compare(refreshToken, record.tokenHash)) {
          await prisma.refreshToken.update({
            where: { id: record.id },
            data: { revokedAt: new Date() },
          });
          break;
        }
      }
    } catch {
      // Ignorer les erreurs de logout
    }
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        avatar: true,
        tenantId: true,
        storeId: true,
        lastLoginAt: true,
        createdAt: true,
        store: { select: { id: true, name: true } },
        tenant: { select: { id: true, name: true, plan: true } },
      },
    });

    if (!user) throw new AppError('Utilisateur introuvable', 404);
    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('Utilisateur introuvable', 404);

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new AppError('Mot de passe actuel incorrect', 400);

    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return; // Ne pas révéler si l'email existe

    const token = jwt.sign({ sub: user.id, type: 'reset' }, jwtConfig.accessSecret, {
      expiresIn: '1h',
    });

    await prisma.passwordReset.create({
      data: { userId: user.id, token, expiresAt: new Date(Date.now() + 3600_000) },
    });

    // TODO: envoyer l'email avec le lien de réinitialisation
  }

  async resetPassword(token: string, newPassword: string) {
    let decoded: { sub: string };
    try {
      decoded = jwt.verify(token, jwtConfig.accessSecret) as { sub: string; type: string };
    } catch {
      throw new AppError('Token invalide ou expiré', 400);
    }

    const record = await prisma.passwordReset.findFirst({
      where: { token, usedAt: null, expiresAt: { gt: new Date() } },
    });

    if (!record) throw new AppError('Lien de réinitialisation invalide ou déjà utilisé', 400);

    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.$transaction([
      prisma.user.update({ where: { id: decoded.sub }, data: { passwordHash: hash } }),
      prisma.passwordReset.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      // Révoquer tous les refresh tokens existants
      prisma.refreshToken.updateMany({
        where: { userId: decoded.sub, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }
}
