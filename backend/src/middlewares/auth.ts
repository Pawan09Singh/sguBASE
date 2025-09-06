import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AuthUtils, JWTPayload } from '../utils/auth';
import { logger } from '../utils/logger';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      const payload = AuthUtils.verifyAccessToken(token);
      
      // Handle SuperAdmin specially
      if (payload.userId === 'superadmin') {
        req.user = {
          userId: 'superadmin',
          email: 'superadmin@university.edu',
          roles: ['SUPERADMIN'],
          defaultDashboard: 'SUPERADMIN'
        };
        return next();
      }
      
      // Verify user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { 
          id: true, 
          email: true, 
          roles: true, 
          is_active: true,
          default_dashboard: true 
        }
      });

      if (!user || user.is_active !== 'ACTIVE') {
        return res.status(401).json({ error: 'User not found or inactive' });
      }

      // Update payload with fresh user data
      req.user = {
        userId: user.id,
        email: user.email,
        roles: user.roles,
        defaultDashboard: user.default_dashboard
      };

      return next();
    } catch (jwtError) {
      logger.warn('Invalid JWT token:', jwtError);
      return res.status(401).json({ error: 'Invalid access token' });
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const requireRole = (requiredRole: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!AuthUtils.hasHigherOrEqualRole(req.user.roles, requiredRole as any)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    return next();
  };
};

export const requireSuperAdmin = requireRole('SUPERADMIN');
export const requireAdmin = requireRole('ADMIN');
export const requireHOD = requireRole('HOD');
export const requireCC = requireRole('CC');
export const requireTeacher = requireRole('TEACHER');
export const requireStudent = requireRole('STUDENT');

// Convenience functions for "or higher" access
export const requireTeacherOrHigher = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const hasAccess = req.user.roles.some((role: string) => 
    ['SUPERADMIN', 'ADMIN', 'HOD', 'CC', 'TEACHER'].includes(role)
  );

  if (!hasAccess) {
    return res.status(403).json({ error: 'Teacher access or higher required' });
  }

  return next();
};

export const requireStudentOrHigher = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const hasAccess = req.user.roles.some((role: string) => 
    ['SUPERADMIN', 'ADMIN', 'HOD', 'CC', 'TEACHER', 'STUDENT'].includes(role)
  );

  if (!hasAccess) {
    return res.status(403).json({ error: 'Student access or higher required' });
  }

  return next();
};
