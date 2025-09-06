

import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../utils/prisma';
import { AuthUtils } from '../utils/auth';
import { createError } from '../middlewares/errorHandler';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// Login endpoint
router.post('/login', [
  body('login').notEmpty().withMessage('Email or UID is required'),
  body('password').notEmpty().withMessage('Password is required'),
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { login, password } = req.body;

    // Check for SuperAdmin hardcoded credentials
    if (login === process.env.SUPERADMIN_UID && password === process.env.SUPERADMIN_PASSWORD) {
      const superAdminPayload = {
        userId: 'superadmin',
        email: 'superadmin@university.edu',
        roles: ['SUPERADMIN'] as any,
        defaultDashboard: 'SUPERADMIN' as any
      };

      const tokens = AuthUtils.generateTokens(superAdminPayload);
      
      return res.json({
        user: {
          id: 'superadmin',
          email: 'superadmin@university.edu',
          name: 'Super Administrator',
          roles: ['SUPERADMIN'],
          defaultDashboard: 'SUPERADMIN'
        },
        ...tokens
      });
    }

    // Find user by email or UID
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: login },
          { uid: login }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is active
    if (user.is_active !== 'ACTIVE') {
      return res.status(403).json({ 
        error: 'Your account is inactive. Please contact the SuperAdmin.' 
      });
    }

    // Verify password
    const isValidPassword = await AuthUtils.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT tokens
    const payload = {
      userId: user.id,
      email: user.email,
      roles: user.roles,
      defaultDashboard: user.default_dashboard
    };

    const tokens = AuthUtils.generateTokens(payload);

    // Log successful login
    await prisma.log.create({
      data: {
        user_id: user.id,
        action: 'USER_LOGIN',
        context: { ip: req.ip, userAgent: req.get('User-Agent') }
      }
    });

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        uid: user.uid,
        roles: user.roles,
        defaultDashboard: user.default_dashboard
      },
      ...tokens
    });

  } catch (error) {
    return next(error);
  }
});

// Refresh token endpoint
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const payload = AuthUtils.verifyRefreshToken(refreshToken);
    
    // If SuperAdmin, return new tokens without DB check
    if (payload.userId === 'superadmin') {
      const tokens = AuthUtils.generateTokens(payload);
      return res.json(tokens);
    }

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });

    if (!user || user.is_active !== 'ACTIVE') {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    // Generate new tokens with fresh user data
    const newPayload = {
      userId: user.id,
      email: user.email,
      roles: user.roles,
      defaultDashboard: user.default_dashboard
    };

    const tokens = AuthUtils.generateTokens(newPayload);
    return res.json(tokens);

  } catch (error) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// Logout endpoint
router.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // In a real implementation, you might want to blacklist the token
    // For now, we'll just log the logout action if user is authenticated
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const payload = AuthUtils.verifyAccessToken(token);
        
        if (payload.userId !== 'superadmin') {
          await prisma.log.create({
            data: {
              user_id: payload.userId,
              action: 'USER_LOGOUT',
              context: { ip: req.ip, userAgent: req.get('User-Agent') }
            }
          });
        }
      } catch (error) {
        // Token invalid, but that's okay for logout
      }
    }

    return res.json({ message: 'Logged out successfully' });
  } catch (error) {
    return next(error);
  }
});

// Get current user info endpoint
router.get('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Handle SuperAdmin
    if (req.user.userId === 'superadmin') {
      return res.json({
        id: 'superadmin',
        email: 'superadmin@university.edu',
        name: 'Super Administrator',
        uid: process.env.SUPERADMIN_UID,
        roles: ['SUPERADMIN'],
        is_active: 'ACTIVE',
        default_dashboard: 'SUPERADMIN'
      });
    }

    // Get fresh user data from database
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        uid: true,
        roles: true,
        is_active: true,
        default_dashboard: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      uid: user.uid,
      roles: user.roles,
      is_active: user.is_active,
      default_dashboard: user.default_dashboard
    });

  } catch (error) {
    return next(error);
  }
});

// Forgot password endpoint
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Valid email is required')
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal if email exists or not
      return res.json({ message: 'If the email exists, an OTP has been sent.' });
    }

    const otp = AuthUtils.generateOTP();
    
    // Store OTP in a temporary table or cache (simplified here)
    // In production, you'd want to use Redis or a similar cache
    // For now, we'll store it in the database with an expiry
    
    // TODO: Implement email sending service
    // await EmailService.sendOTP(email, otp);

    console.log(`OTP for ${email}: ${otp}`); // For development

    return res.json({ message: 'If the email exists, an OTP has been sent.' });

  } catch (error) {
    return next(error);
  }
});

// Reset password endpoint
router.post('/reset-password', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, otp, newPassword } = req.body;

    // Verify OTP (simplified - in production use Redis or temporary table)
    // For now, accept any 6-digit OTP for demo purposes
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash new password
    const hashedPassword = await AuthUtils.hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password_hash: hashedPassword }
    });

    // Log password reset
    await prisma.log.create({
      data: {
        user_id: user.id,
        action: 'PASSWORD_RESET',
        context: { ip: req.ip, userAgent: req.get('User-Agent') }
      }
    });

    return res.json({ message: 'Password reset successfully' });

  } catch (error) {
    return next(error);
  }
});

export default router;
