import type { SignOptions } from 'jsonwebtoken';

export const jwtConfig = {
  accessSecret: process.env.JWT_ACCESS_SECRET ?? 'CHANGE_ME_ACCESS_SECRET',
  refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'CHANGE_ME_REFRESH_SECRET',
  accessExpiresIn: '15m' as SignOptions['expiresIn'],
  refreshExpiresIn: '7d' as SignOptions['expiresIn'],
};
