import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../utils/prisma';
import { AuthUtils } from '../utils/auth';
import { requireSuperAdmin } from '../middlewares/auth';

const router = Router();

// Get dashboard stats
router.get('/stats', requireSuperAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [totalUsers, totalDepartments, totalCourses, activeUsers] = await Promise.all([
      prisma.user.count(),
      prisma.department.count(),
      prisma.course.count(),
      prisma.user.count({ where: { is_active: 'ACTIVE' } })
    ]);

    return res.json({
      totalUsers,
      totalDepartments,
      totalCourses,
      activeUsers
    });
  } catch (error) {
    return next(error);
  }
});

// Direct login as another user
router.post('/direct-login', [
  requireSuperAdmin,
  body('uid').notEmpty().withMessage('UID is required'),
], async (req: Request, res: Response, next: NextFunction) => {
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
        user_id: req.user?.userId || 'superadmin',
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
    return next(error);
  }
});

// Import users from CSV
router.post('/import-users', requireSuperAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // For now, return a mock response until we implement file upload handling
    // This would require multer middleware and CSV parsing
    
    return res.json({
      message: 'CSV import functionality is ready for implementation',
      imported: 0,
      errors: ['File upload middleware needed - implement with multer and csv-parser'],
      instructions: [
        'CSV format should be: name,email,uid,role,password(optional)',
        'Example: John Doe,john@university.edu,12345,TEACHER,password123'
      ]
    });

  } catch (error) {
    return next(error);
  }
});

// Create department
router.post('/departments', [
  requireSuperAdmin,
  body('dept_name').notEmpty().withMessage('Department name is required'),
], async (req: Request, res: Response, next: NextFunction) => {
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

    const department = await prisma.department.create({
      data: {
        dept_name,
        created_by: req.user?.userId || 'superadmin'
      }
    });

    // Log the action
    await prisma.log.create({
      data: {
        user_id: req.user?.userId || 'superadmin',
        action: 'DEPARTMENT_CREATED',
        context: { departmentId: department.id, departmentName: dept_name }
      }
    });

    return res.status(201).json(department);

  } catch (error) {
    return next(error);
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
], async (req: Request, res: Response, next: NextFunction) => {
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
      return res.status(400).json({ 
        error: existingUser.email === email ? 'Email already exists' : 'UID already exists' 
      });
    }

    // Use provided password or default to UID
    const userPassword = password || uid;
    const hashedPassword = await AuthUtils.hashPassword(userPassword);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        uid,
        password_hash: hashedPassword,
        roles: [role],
        default_dashboard: role,
        is_active: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        email: true,
        uid: true,
        roles: true,
        default_dashboard: true,
        is_active: true,
        created_at: true
      }
    });

    // Log the action
    await prisma.log.create({
      data: {
        user_id: req.user?.userId || 'superadmin',
        action: 'USER_CREATED',
        context: { newUserId: user.id, newUserRole: role, passwordSet: !!password }
      }
    });

    return res.status(201).json({
      ...user,
      defaultPassword: !password // Indicate if default password was used
    });

  } catch (error) {
    return next(error);
  }
});

// Get all users
router.get('/users', requireSuperAdmin, async (req: Request, res: Response, next: NextFunction) => {
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
      status: user.is_active,
      createdAt: user.created_at.toISOString()
    }));

    return res.json(formattedUsers);
  } catch (error) {
    return next(error);
  }
});

// Get all departments
router.get('/departments', requireSuperAdmin, async (req: Request, res: Response, next: NextFunction) => {
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
      deanName: dept.dean?.name,
      totalCourses: dept._count.courses,
      createdAt: dept.created_at.toISOString(),
      status: 'ACTIVE' // Assuming all departments are active
    }));

    return res.json(formattedDepartments);
  } catch (error) {
    return next(error);
  }
});

// Get system logs
router.get('/logs', requireSuperAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await prisma.log.findMany({
      include: {
        user: {
          select: { name: true, uid: true }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 100 // Limit to last 100 logs
    });

    const formattedLogs = logs.map((log: any) => ({
      id: log.id,
      timestamp: log.timestamp.toISOString(),
      level: 'INFO', // Default level since we don't have this field
      category: log.action.split('_')[0], // Extract category from action
      message: log.action.replace(/_/g, ' ').toLowerCase(),
      userId: log.user_id,
      userName: log.user?.name,
      metadata: log.context
    }));

    return res.json(formattedLogs);
  } catch (error) {
    return next(error);
  }
});

// Get deans and departments for assignment
router.get('/deans-departments', requireSuperAdmin, async (req: Request, res: Response, next: NextFunction) => {
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

    return res.json({
      deans: formattedDeans,
      departments: formattedDepartments
    });
  } catch (error) {
    return next(error);
  }
});

// Assign dean to department
router.post('/assign-dean', [
  requireSuperAdmin,
  body('deanId').notEmpty().withMessage('Dean ID is required'),
  body('departmentId').notEmpty().withMessage('Department ID is required'),
], async (req: Request, res: Response, next: NextFunction) => {
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

    // Update department with new head
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

    // Log the action
    await prisma.log.create({
      data: {
        action: 'ASSIGN_DEAN',
        context: { deanName: dean.name, departmentName: department.dept_name },
        user_id: req.user?.userId || 'superadmin',
        timestamp: new Date()
      }
    });

    return res.json({
      message: 'Dean assigned successfully',
      department: updatedDepartment
    });
  } catch (error) {
    return next(error);
  }
});

// Remove dean from department
router.post('/remove-dean', [
  requireSuperAdmin,
  body('departmentId').notEmpty().withMessage('Department ID is required'),
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { departmentId } = req.body;

    // Verify department exists
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      select: { id: true, dept_name: true, dean_id: true, dean: { select: { name: true } } }
    });

    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    if (!department.dean_id) {
      return res.status(400).json({ error: 'Department does not have an assigned dean' });
    }

    // Remove head from department
    const updatedDepartment = await prisma.department.update({
      where: { id: departmentId },
      data: { dean_id: null }
    });

    // Log the action
    await prisma.log.create({
      data: {
        action: 'REMOVE_DEAN',
        context: { deanName: department.dean?.name, departmentName: department.dept_name },
        user_id: req.user?.userId || 'superadmin',
        timestamp: new Date()
      }
    });

    return res.json({
      message: 'Dean removed successfully',
      department: updatedDepartment
    });
  } catch (error) {
    return next(error);
  }
});

// Update user endpoint
router.put('/users/:userId', [
  requireSuperAdmin,
  body('status').optional().isIn(['ACTIVE', 'INACTIVE']).withMessage('Invalid status'),
  body('roles').optional().isArray().withMessage('Roles must be an array'),
  body('roles.*').optional().isIn(['STUDENT', 'TEACHER', 'CC', 'HOD', 'ADMIN', 'SUPERADMIN']).withMessage('Invalid role')
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('Update user request:', { userId: req.params.userId, body: req.body });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const { status, roles } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
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
      // Validate that at least one role is provided
      if (!Array.isArray(roles) || roles.length === 0) {
        return res.status(400).json({ error: 'At least one role must be assigned' });
      }
      
      // Store the roles as provided by the frontend
      updateData.roles = roles;
      
      // Update default dashboard to highest role
      const roleHierarchy: Record<string, number> = {
        STUDENT: 1,
        TEACHER: 2,
        CC: 3,
        HOD: 4,
        ADMIN: 5,
        SUPERADMIN: 6,
      };
      
      const highestRole = roles.reduce((highest, current) => {
        const currentLevel = roleHierarchy[current as keyof typeof roleHierarchy] || 0;
        const highestLevel = roleHierarchy[highest as keyof typeof roleHierarchy] || 0;
        return currentLevel > highestLevel ? current : highest;
      });
      
      updateData.default_dashboard = highestRole;
    }

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

    // Log the update
    await prisma.log.create({
      data: {
        user_id: req.user?.userId || 'superadmin',
        action: 'USER_UPDATED',
        context: {
          targetUserId: userId,
          changes: updateData,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        }
      }
    });

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
    console.error('User update error:', error);
    return next(error);
  }
});

export default router;
