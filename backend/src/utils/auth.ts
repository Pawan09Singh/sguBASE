import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

export interface JWTPayload {
  userId: string;
  email: string;
  roles: Role[];
  defaultDashboard: Role;
}

export class AuthUtils {
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  static generateTokens(payload: JWTPayload) {
    const accessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      payload,
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }

  static verifyAccessToken(token: string): JWTPayload {
    return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
  }

  static verifyRefreshToken(token: string): JWTPayload {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as JWTPayload;
  }

  static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static hasRole(userRoles: Role[], requiredRole: Role): boolean {
    return userRoles.includes(requiredRole);
  }

  static hasHigherOrEqualRole(userRoles: Role[], requiredRole: Role): boolean {
    const roleHierarchy: Record<Role, number> = {
      STUDENT: 1,
      TEACHER: 2,
      CC: 3,
      HOD: 4,
      ADMIN: 5,
      SUPERADMIN: 6,
    };

    const userHighestRole = Math.max(...userRoles.map(role => roleHierarchy[role]));
    return userHighestRole >= roleHierarchy[requiredRole];
  }

  static getHighestRole(roles: Role[]): Role {
    const roleHierarchy: Record<Role, number> = {
      STUDENT: 1,
      TEACHER: 2,
      CC: 3,
      HOD: 4,
      ADMIN: 5,
      SUPERADMIN: 6,
    };

    return roles.reduce((highest, current) => 
      roleHierarchy[current] > roleHierarchy[highest] ? current : highest
    );
  }
}
