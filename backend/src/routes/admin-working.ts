import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { AuthUtils } from '../utils/auth';

const router = Router();
const prisma = new PrismaClient();

// Middleware to check if user is SuperAdmin
const requireSuperAdmin = (req: any, res: Response, next: any) => {
  console.log('requireSuperAdmin middleware - user:', req.user);
  console.log('requireSuperAdmin middleware - userId:', req.user?.userId);
  console.log('requireSuperAdmin middleware - roles:', req.user?.roles);
  
  if (req.user?.userId === 'superadmin' || req.user?.roles?.includes('SUPERADMIN')) {
    console.log('SuperAdmin check passed');
    next();
  } else {
    console.log('SuperAdmin check failed');
    res.status(403).json({ error: 'Access denied. SuperAdmin only.' });
  }
};

// Get all users
router.get('/users', requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        uid: true,
        roles: true,
        is_active: true,
        created_at: true
      },
      orderBy: { created_at: 'desc' }
    });

    const formattedUsers = users.map((user: any) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      uid: user.uid,
      roles: user.roles,
      status: user.is_active === 'ACTIVE' ? 'Active' : 'Inactive',
      createdAt: user.created_at.toISOString()
    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create user
router.post('/users', [
  requireSuperAdmin,
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('uid').notEmpty().withMessage('UID is required'),
  body('role').isIn(['ADMIN', 'HOD', 'CC', 'TEACHER', 'STUDENT']).withMessage('Valid role is required'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, uid, role, password } = req.body;

    // Check if email or UID already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { uid }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email or UID already exists' });
    }

    // Use provided password or default to UID
    const finalPassword = password && password.trim() ? password : uid;
    const hashedPassword = await bcrypt.hash(finalPassword, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        uid,
        password_hash: hashedPassword,
        roles: [role as any],
        is_active: 'ACTIVE',
        default_dashboard: role as any
      },
      select: {
        id: true,
        name: true,
        email: true,
        uid: true,
        roles: true,
        is_active: true,
        created_at: true
      }
    });

    // Log the action (optional, skip if logging fails)
    try {
      // Only log if we have a valid user_id that exists in the database
      const logUserId = (req as any).user?.userId;
      if (logUserId && logUserId !== 'superadmin') {
        await prisma.log.create({
          data: {
            user_id: logUserId,
            action: 'USER_CREATED',
            context: { 
              createdUserId: user.id, 
              createdUserUid: uid,
              createdUserRole: role,
              passwordType: password && password.trim() ? 'custom' : 'default',
              createdBy: logUserId
            }
          }
        });
      }
      // Skip logging for superadmin to avoid foreign key constraint
    } catch (logError) {
      console.log('Failed to log action:', logError);
      // Continue without logging
    }

    const formattedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      uid: user.uid,
      roles: user.roles,
      status: user.is_active === 'ACTIVE' ? 'Active' : 'Inactive',
      createdAt: user.created_at.toISOString(),
      defaultPassword: !password || !password.trim(),
      passwordMessage: password && password.trim() ? 
        'Custom password has been set' : 
        `Default password is the UID: ${uid}`
    };

    res.status(201).json(formattedUser);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Get departments
router.get('/departments', requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        dean: {
          select: { name: true }
        },
        _count: {
          select: {
            courses: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    const formattedDepartments = departments.map((dept: any) => ({
      id: dept.id,
      name: dept.dept_name,
      deanName: dept.dean?.name || 'Not assigned',
      totalCourses: dept._count.courses,
      createdAt: dept.created_at.toISOString(),
      status: 'Active'
    }));

    res.json(formattedDepartments);
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// Create department
router.post('/departments', [
  requireSuperAdmin,
  body('dept_name').notEmpty().withMessage('Department name is required'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { dept_name } = req.body;

    // Check if department name already exists
    const existingDept = await prisma.department.findUnique({
      where: { dept_name }
    });

    if (existingDept) {
      return res.status(400).json({ error: 'Department name already exists' });
    }

    // Ensure SuperAdmin user exists
    const currentUserId = (req as any).user?.userId;
    let createdBy = currentUserId;

    if (currentUserId === 'superadmin') {
      // Check if SuperAdmin user exists, create if not
      let superAdmin = await prisma.user.findUnique({
        where: { id: 'superadmin' }
      });

      if (!superAdmin) {
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('12345', 12);
        
        superAdmin = await prisma.user.create({
          data: {
            id: 'superadmin',
            uid: '12345',
            name: 'Super Administrator',
            email: 'superadmin@university.edu',
            password_hash: hashedPassword,
            roles: ['SUPERADMIN'],
            default_dashboard: 'SUPERADMIN',
          }
        });
      }
      createdBy = 'superadmin';
    }

    const department = await prisma.department.create({
      data: {
        dept_name,
        created_by: createdBy
      }
    });

    // Log the action (optional, skip if logging fails)
    try {
      const logUserId = (req as any).user?.userId;
      if (logUserId && logUserId !== 'superadmin') {
        await prisma.log.create({
          data: {
            user_id: logUserId,
            action: 'DEPARTMENT_CREATED',
            context: { 
              departmentId: department.id, 
              departmentName: dept_name,
              createdBy: logUserId
            }
          }
        });
      }
      // Skip logging for superadmin to avoid foreign key constraint
    } catch (logError) {
      console.log('Failed to log action:', logError);
      // Continue without logging
    }

    res.status(201).json({
      id: department.id,
      name: department.dept_name,
      createdAt: department.created_at.toISOString(),
      status: 'Active'
    });
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({ error: 'Failed to create department' });
  }
});

// Get logs
router.get('/logs', requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const logs = await prisma.log.findMany({
      include: {
        user: {
          select: { name: true, uid: true }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 100
    });

    const formattedLogs = logs.map((log: any) => ({
      id: log.id,
      timestamp: log.timestamp.toISOString(),
      level: 'INFO',
      category: log.action.split('_')[0],
      message: log.action.replace(/_/g, ' ').toLowerCase(),
      userId: log.user_id,
      userName: log.user?.name || 'Unknown',
      metadata: log.context
    }));

    res.json(formattedLogs);
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Get stats
router.get('/stats', requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const [userCount, departmentCount, courseCount] = await Promise.all([
      prisma.user.count(),
      prisma.department.count(),
      prisma.course.count()
    ]);

    res.json({
      totalUsers: userCount,
      totalDepartments: departmentCount,
      totalCourses: courseCount,
      activeUsers: userCount // Simplified for now
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get deans and departments for assignment
router.get('/deans-departments', requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const [deans, departments] = await Promise.all([
      prisma.user.findMany({
        where: {
          roles: {
            has: 'ADMIN'
          },
          is_active: 'ACTIVE'
        },
        select: {
          id: true,
          name: true,
          email: true,
          uid: true,
          dean_departments: {
            select: {
              id: true,
              dept_name: true
            }
          }
        }
      }),
      prisma.department.findMany({
        select: {
          id: true,
          dept_name: true,
          dean_id: true,
          dean: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })
    ]);

    // Format the response to match frontend expectations
    const formattedDeans = deans.map((dean: any) => ({
      id: dean.id,
      name: dean.name,
      email: dean.email,
      uid: dean.uid,
      DepartmentHead: dean.dean_departments.length > 0 ? {
        id: dean.dean_departments[0].id,
        name: dean.dean_departments[0].dept_name
      } : null
    }));

    const formattedDepartments = departments.map((dept: any) => ({
      id: dept.id,
      name: dept.dept_name,
      head_id: dept.dean_id,
      Head: dept.dean ? {
        id: dept.dean.id,
        name: dept.dean.name,
        email: dept.dean.email
      } : null
    }));

    res.json({
      deans: formattedDeans,
      departments: formattedDepartments
    });
  } catch (error) {
    console.error('Get deans-departments error:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Assign dean to department
router.post('/assign-dean', [
  requireSuperAdmin,
  body('deanId').notEmpty().withMessage('Dean ID is required'),
  body('departmentId').notEmpty().withMessage('Department ID is required'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { deanId, departmentId } = req.body;

    // Verify dean exists and has ADMIN role
    const dean = await prisma.user.findUnique({
      where: { id: deanId },
      select: { id: true, name: true, roles: true, is_active: true }
    });

    if (!dean) {
      return res.status(404).json({ error: 'Dean not found' });
    }

    if (!dean.roles.includes('ADMIN')) {
      return res.status(400).json({ error: 'User is not a dean (ADMIN role required)' });
    }

    if (dean.is_active !== 'ACTIVE') {
      return res.status(400).json({ error: 'Dean account is not active' });
    }

    // Verify department exists
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      select: { id: true, dept_name: true, dean_id: true }
    });

    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    // Update department with new dean
    const updatedDepartment = await prisma.department.update({
      where: { id: departmentId },
      data: { dean_id: deanId },
      include: {
        dean: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json({
      message: 'Dean assigned successfully',
      department: updatedDepartment
    });
  } catch (error) {
    console.error('Assign dean error:', error);
    res.status(500).json({ error: 'Failed to assign dean' });
  }
});

// Remove dean from department
router.post('/remove-dean', [
  requireSuperAdmin,
  body('departmentId').notEmpty().withMessage('Department ID is required'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { departmentId } = req.body;

    // Verify department exists and has a dean
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      select: { id: true, dept_name: true, dean_id: true }
    });

    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    if (!department.dean_id) {
      return res.status(400).json({ error: 'Department does not have an assigned dean' });
    }

    // Remove dean from department
    const updatedDepartment = await prisma.department.update({
      where: { id: departmentId },
      data: { dean_id: null }
    });

    res.json({
      message: 'Dean removed successfully',
      department: updatedDepartment
    });
  } catch (error) {
    console.error('Remove dean error:', error);
    res.status(500).json({ error: 'Failed to remove dean' });
  }
});

// Direct login as another user
router.post('/direct-login', [
  requireSuperAdmin,
  body('uid').notEmpty().withMessage('UID is required'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { uid } = req.body;

    // Find user by UID
    const user = await prisma.user.findUnique({
      where: { uid },
      select: {
        id: true,
        email: true,
        name: true,
        uid: true,
        roles: true,
        default_dashboard: true,
        is_active: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.is_active !== 'ACTIVE') {
      return res.status(400).json({ error: 'User is not active' });
    }

    // Generate tokens for the target user
    const payload = {
      userId: user.id,
      email: user.email,
      roles: user.roles,
      defaultDashboard: user.default_dashboard
    };

    const tokens = AuthUtils.generateTokens(payload);

    // Log the direct login action
    await prisma.log.create({
      data: {
        user_id: (req as any).user?.userId || 'superadmin',
        action: 'DIRECT_LOGIN',
        context: { 
          targetUserId: user.id,
          targetUserUid: user.uid,
          ip: req.ip, 
          userAgent: req.get('User-Agent') 
        }
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
    console.error('Direct login error:', error);
    res.status(500).json({ error: 'Failed to perform direct login' });
  }
});

// Update user endpoint
router.put('/users/:userId', [
  requireSuperAdmin,
  body('status').optional().isIn(['ACTIVE', 'INACTIVE']).withMessage('Invalid status'),
  body('roles').optional().isArray().withMessage('Roles must be an array'),
  body('roles.*').optional().isIn(['STUDENT', 'TEACHER', 'CC', 'HOD', 'ADMIN', 'SUPERADMIN']).withMessage('Invalid role')
], async (req: Request, res: Response) => {
  console.log('PUT /users/:userId endpoint hit!');
  console.log('Params:', req.params);
  console.log('Body:', req.body);
  console.log('User:', req.user);
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const { status, roles } = req.body;

    console.log('Update user request:', { userId, status, roles });

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      console.log('User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent modification of SuperAdmin user from database
    if (existingUser.uid === process.env.SUPERADMIN_UID) {
      return res.status(403).json({ error: 'Cannot modify SuperAdmin user' });
    }

    // Prepare update data
    const updateData: any = {};
    
    if (status !== undefined) {
      updateData.is_active = status;
    }
    
    if (roles !== undefined) {
      // Ensure STUDENT role is always included unless it's explicitly a SUPERADMIN
      const roleSet = new Set(roles);
      if (!roleSet.has('SUPERADMIN') && !roleSet.has('STUDENT')) {
        roleSet.add('STUDENT');
      }
      updateData.roles = Array.from(roleSet);
      
      // Update default dashboard to highest role
      const roleHierarchy: Record<string, number> = {
        STUDENT: 1,
        TEACHER: 2,
        CC: 3,
        HOD: 4,
        ADMIN: 5,
        SUPERADMIN: 6,
      };
      
      const highestRole = Array.from(roleSet).reduce((highest, current) => 
        roleHierarchy[current] > roleHierarchy[highest] ? current : highest
      );
      
      updateData.default_dashboard = highestRole;
    }

    console.log('Update data:', updateData);

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        uid: true,
        name: true,
        email: true,
        roles: true,
        is_active: true,
        default_dashboard: true,
        created_at: true,
        updated_at: true
      }
    });

    console.log('User updated successfully:', updatedUser);

    return res.json({
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        uid: updatedUser.uid,
        roles: updatedUser.roles,
        status: updatedUser.is_active,
        createdAt: updatedUser.created_at.toISOString()
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

export default router;
