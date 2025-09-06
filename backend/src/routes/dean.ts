import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';

const router = Router();
const prisma = new PrismaClient();

// Middleware to check if user is Admin/Dean or higher
const requireAdminOrHigher = (req: any, res: Response, next: any) => {
  const userRoles = req.user?.roles || [];
  const allowedRoles = ['SUPERADMIN', 'ADMIN'];
  
  if (req.user?.userId === 'superadmin' || userRoles.some((role: string) => allowedRoles.includes(role))) {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
};

// Get dashboard statistics for Dean (only for their assigned departments)
router.get('/stats', requireAdminOrHigher, async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user?.userId;
    
    let courseFilter = {};
    
    // SuperAdmin can see all statistics
    if (currentUserId === 'superadmin') {
      courseFilter = {};
    } else {
      // Regular dean can only see statistics from departments they are assigned to
      courseFilter = {
        department: {
          dean_id: currentUserId
        }
      };
    }

    const stats = await Promise.all([
      // Total courses (filtered by dean's departments)
      prisma.course.count({
        where: courseFilter
      }),
      
      // Total teachers (users with TEACHER role) - global count for now
      prisma.user.count({
        where: {
          roles: { has: 'TEACHER' }
        }
      }),
      
      // Total students (users with STUDENT role) - global count for now
      prisma.user.count({
        where: {
          roles: { has: 'STUDENT' }
        }
      }),
      
      // Pending approvals (courses with INACTIVE status from dean's departments)
      prisma.course.count({
        where: {
          ...courseFilter,
          status: 'INACTIVE'
        }
      })
    ]);

    res.json({
      totalCourses: stats[0],
      totalTeachers: stats[1],
      totalStudents: stats[2],
      pendingApprovals: stats[3]
    });
  } catch (error) {
    console.error('Get dean stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get courses for Dean dashboard (only from departments they are dean of)
router.get('/courses', requireAdminOrHigher, async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user?.userId;
    
    let courseFilter = {};
    
    // SuperAdmin can see all courses
    if (currentUserId === 'superadmin') {
      courseFilter = {};
    } else {
      // Regular dean can only see courses from departments they are assigned to
      courseFilter = {
        department: {
          dean_id: currentUserId
        }
      };
    }

    const courses = await prisma.course.findMany({
      where: courseFilter,
      include: {
        department: true,
        creator: true,
        sections: {
          include: {
            enrollments: {
              where: { role: 'STUDENT' }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    const formattedCourses = courses.map(course => ({
      id: course.id,
      name: course.course_name,
      department: course.department.dept_name,
      sections: course.sections.length,
      students: course.sections.reduce((total, section) => total + section.enrollments.length, 0),
      teachers: course.sections.length, // Assuming one teacher per section for now
      status: course.status || 'Active',
      createdAt: course.created_at
    }));

    res.json(formattedCourses);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Get teachers for Dean
router.get('/teachers', requireAdminOrHigher, async (req: Request, res: Response) => {
  try {
    const teachers = await prisma.user.findMany({
      where: {
        roles: { has: 'TEACHER' },
        is_active: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        email: true,
        uid: true,
        roles: true,
        is_active: true,
        created_at: true
      },
      orderBy: { name: 'asc' }
    });

    const formattedTeachers = teachers.map(teacher => ({
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      department: 'General' // You might want to add department info to user model
    }));

    res.json(formattedTeachers);
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({ error: 'Failed to fetch teachers' });
  }
});

// Create a new course
router.post('/courses', [
  requireAdminOrHigher,
  body('course_name').notEmpty().withMessage('Course name is required'),
  body('dept_id').notEmpty().withMessage('Department ID is required'),
  body('course_code').notEmpty().withMessage('Course code is required')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { course_name, dept_id, course_code, description } = req.body;
    const currentUserId = (req as any).user?.userId;

    // Check if course code already exists
    const existingCourse = await prisma.course.findUnique({
      where: { course_code }
    });

    if (existingCourse) {
      return res.status(400).json({ error: 'Course code already exists' });
    }

    // Validate that the dean can create courses in this department
    if (currentUserId !== 'superadmin') {
      const department = await prisma.department.findFirst({
        where: {
          id: dept_id,
          dean_id: currentUserId
        }
      });

      if (!department) {
        return res.status(403).json({ 
          error: 'You can only create courses in departments you are assigned to as dean' 
        });
      }
    }

    // Ensure creator exists (same logic as department creation)
    let createdBy = currentUserId;

    if (currentUserId === 'superadmin') {
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

    const course = await prisma.course.create({
      data: {
        course_name,
        course_code,
        description,
        dept_id,
        created_by: createdBy,
        status: 'ACTIVE'
      },
      include: {
        department: true,
        creator: true
      }
    });

    res.status(201).json(course);
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

// Add a new teacher
router.post('/teachers', [
  requireAdminOrHigher,
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('uid').notEmpty().withMessage('UID is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, uid, password, phone } = req.body;

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
      return res.status(400).json({ error: 'Email or UID already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const teacher = await prisma.user.create({
      data: {
        name,
        email,
        uid,
        password_hash: hashedPassword,
        phone,
        roles: ['TEACHER'],
        default_dashboard: 'TEACHER',
        is_active: 'ACTIVE'
      }
    });

    // Remove password from response
    const { password_hash, ...teacherResponse } = teacher;

    res.status(201).json(teacherResponse);
  } catch (error) {
    console.error('Create teacher error:', error);
    res.status(500).json({ error: 'Failed to create teacher' });
  }
});

// Get departments for dropdown (only departments where current user is dean)
router.get('/departments', requireAdminOrHigher, async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user?.userId;
    
    // SuperAdmin can see all departments
    if (currentUserId === 'superadmin') {
      const departments = await prisma.department.findMany({
        select: {
          id: true,
          dept_name: true
        },
        orderBy: { dept_name: 'asc' }
      });
      return res.json(departments);
    }

    // Regular dean can only see departments they are assigned to
    const departments = await prisma.department.findMany({
      where: {
        dean_id: currentUserId
      },
      select: {
        id: true,
        dept_name: true
      },
      orderBy: { dept_name: 'asc' }
    });

    res.json(departments);
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// Get recent activity/logs
router.get('/activity', requireAdminOrHigher, async (req: Request, res: Response) => {
  try {
    const logs = await prisma.log.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 20
    });

    res.json(logs);
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

// Get announcements for Dean
router.get('/announcements', requireAdminOrHigher, async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user?.userId;
    
    let announcementFilter = {};
    
    // SuperAdmin can see all announcements
    if (currentUserId === 'superadmin') {
      announcementFilter = {};
    } else {
      // Regular dean can see announcements they created or general ones
      announcementFilter = {
        OR: [
          { sender_id: currentUserId },
          { target_role: 'BOTH' }
        ]
      };
    }

    const announcements = await prisma.announcement.findMany({
      where: announcementFilter,
      include: {
        sender: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    // Transform to match frontend expectations
    const formattedAnnouncements = announcements.map(announcement => ({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      type: announcement.target_role === 'BOTH' ? 'INFO' : 'WARNING', // Map target_role to type
      target_audience: announcement.target_role === 'STUDENT' ? 'STUDENTS' : 
                      announcement.target_role === 'TEACHER' ? 'TEACHERS' : 'ALL',
      created_at: announcement.created_at,
      created_by: announcement.sender.name
    }));

    res.json(formattedAnnouncements);
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// Create announcement
router.post('/announcements', requireAdminOrHigher, async (req: Request, res: Response) => {
  try {
    const { title, content, type, target_audience } = req.body;
    const currentUserId = (req as any).user?.userId;

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    // Map frontend values to database values
    let target_role = 'BOTH';
    if (target_audience === 'STUDENTS') {
      target_role = 'STUDENT';
    } else if (target_audience === 'TEACHERS') {
      target_role = 'TEACHER';
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        target_role: target_role as any,
        sender_id: currentUserId || 'system'
      },
      include: {
        sender: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    // Log the activity
    await prisma.log.create({
      data: {
        action: 'CREATE_ANNOUNCEMENT',
        context: { announcement_id: announcement.id, title },
        user_id: currentUserId || 'system'
      }
    });

    res.status(201).json({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      type: type,
      target_audience: target_audience,
      created_at: announcement.created_at,
      created_by: announcement.sender.name
    });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

// Get sections for a specific course
router.get('/courses/:courseId/sections', requireAdminOrHigher, async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const currentUserId = (req as any).user?.userId;
    
    // Verify dean has access to this course
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        ...(currentUserId !== 'superadmin' ? {
          department: {
            dean_id: currentUserId
          }
        } : {})
      }
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found or access denied' });
    }

    const sections = await prisma.section.findMany({
      where: { course_id: courseId },
      include: {
        enrollments: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    const formattedSections = sections.map(section => {
      const teacher = section.enrollments.find(e => e.role === 'TEACHER')?.user || null;
      const studentCount = section.enrollments.filter(e => e.role === 'STUDENT').length;
      
      return {
        id: section.id,
        name: section.section_name,
        capacity: 50, // Default capacity since not in schema
        enrolled: studentCount,
        teacher
      };
    });

    res.json(formattedSections);
  } catch (error) {
    console.error('Get sections error:', error);
    res.status(500).json({ error: 'Failed to fetch sections' });
  }
});

// Create a new section for a course
router.post('/courses/:courseId/sections', requireAdminOrHigher, [
  body('name').trim().isLength({ min: 1 }).withMessage('Section name is required')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { courseId } = req.params;
    const { name } = req.body;
    const currentUserId = (req as any).user?.userId;
    
    // Verify dean has access to this course
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        ...(currentUserId !== 'superadmin' ? {
          department: {
            dean_id: currentUserId
          }
        } : {})
      }
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found or access denied' });
    }

    const section = await prisma.section.create({
      data: {
        section_name: name,
        course_id: courseId
      }
    });

    res.status(201).json({
      id: section.id,
      name: section.section_name,
      capacity: 50,
      enrolled: 0,
      teacher: null
    });
  } catch (error) {
    console.error('Create section error:', error);
    res.status(500).json({ error: 'Failed to create section' });
  }
});

// Get section details with students and teacher
router.get('/sections/:sectionId', requireAdminOrHigher, async (req: Request, res: Response) => {
  try {
    const { sectionId } = req.params;
    const currentUserId = (req as any).user?.userId;
    
    const section = await prisma.section.findFirst({
      where: {
        id: sectionId,
        ...(currentUserId !== 'superadmin' ? {
          course: {
            department: {
              dean_id: currentUserId
            }
          }
        } : {})
      },
      include: {
        enrollments: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    if (!section) {
      return res.status(404).json({ error: 'Section not found or access denied' });
    }

    const teacher = section.enrollments.find(e => e.role === 'TEACHER')?.user || null;
    const students = section.enrollments
      .filter(e => e.role === 'STUDENT')
      .map(e => e.user);

    res.json({
      id: section.id,
      name: section.section_name,
      capacity: 50, // Default capacity
      enrolled: students.length,
      teacher,
      students
    });
  } catch (error) {
    console.error('Get section details error:', error);
    res.status(500).json({ error: 'Failed to fetch section details' });
  }
});

// Assign teacher to section
router.post('/sections/:sectionId/assign-teacher', requireAdminOrHigher, [
  body('teacherId').isUUID().withMessage('Valid teacher ID is required')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { sectionId } = req.params;
    const { teacherId } = req.body;
    const currentUserId = (req as any).user?.userId;
    
    // Verify section access
    const section = await prisma.section.findFirst({
      where: {
        id: sectionId,
        ...(currentUserId !== 'superadmin' ? {
          course: {
            department: {
              dean_id: currentUserId
            }
          }
        } : {})
      }
    });

    if (!section) {
      return res.status(404).json({ error: 'Section not found or access denied' });
    }

    // Verify teacher exists and has TEACHER role
    const teacher = await prisma.user.findFirst({
      where: {
        id: teacherId,
        roles: { has: 'TEACHER' }
      }
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Remove existing teacher assignment
    await prisma.enrollment.deleteMany({
      where: {
        section_id: sectionId,
        role: 'TEACHER'
      }
    });

    // Assign new teacher
    await prisma.enrollment.create({
      data: {
        user_id: teacherId,
        section_id: sectionId,
        role: 'TEACHER'
      }
    });

    res.json({ message: 'Teacher assigned successfully' });
  } catch (error) {
    console.error('Assign teacher error:', error);
    res.status(500).json({ error: 'Failed to assign teacher' });
  }
});

// Add student to section
router.post('/sections/:sectionId/add-student', requireAdminOrHigher, [
  body('studentId').isUUID().withMessage('Valid student ID is required')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { sectionId } = req.params;
    const { studentId } = req.body;
    const currentUserId = (req as any).user?.userId;
    
    // Verify section access
    const section = await prisma.section.findFirst({
      where: {
        id: sectionId,
        ...(currentUserId !== 'superadmin' ? {
          course: {
            department: {
              dean_id: currentUserId
            }
          }
        } : {})
      },
      include: {
        enrollments: {
          where: { role: 'STUDENT' }
        }
      }
    });

    if (!section) {
      return res.status(404).json({ error: 'Section not found or access denied' });
    }

    // Check capacity (using default of 50)
    const capacity = 50;
    if (section.enrollments.length >= capacity) {
      return res.status(400).json({ error: 'Section is at full capacity' });
    }

    // Verify student exists and has STUDENT role
    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        roles: { has: 'STUDENT' }
      }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Check if student is already enrolled
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        user_id: studentId,
        section_id: sectionId,
        role: 'STUDENT'
      }
    });

    if (existingEnrollment) {
      return res.status(400).json({ error: 'Student is already enrolled in this section' });
    }

    // Enroll student
    await prisma.enrollment.create({
      data: {
        user_id: studentId,
        section_id: sectionId,
        role: 'STUDENT'
      }
    });

    res.json({ message: 'Student added successfully' });
  } catch (error) {
    console.error('Add student error:', error);
    res.status(500).json({ error: 'Failed to add student' });
  }
});

// Remove student from section
router.delete('/sections/:sectionId/remove-student', requireAdminOrHigher, [
  body('studentId').isUUID().withMessage('Valid student ID is required')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { sectionId } = req.params;
    const { studentId } = req.body;
    const currentUserId = (req as any).user?.userId;
    
    // Verify section access
    const section = await prisma.section.findFirst({
      where: {
        id: sectionId,
        ...(currentUserId !== 'superadmin' ? {
          course: {
            department: {
              dean_id: currentUserId
            }
          }
        } : {})
      }
    });

    if (!section) {
      return res.status(404).json({ error: 'Section not found or access denied' });
    }

    // Remove enrollment
    const deleted = await prisma.enrollment.deleteMany({
      where: {
        user_id: studentId,
        section_id: sectionId,
        role: 'STUDENT'
      }
    });

    if (deleted.count === 0) {
      return res.status(404).json({ error: 'Student enrollment not found' });
    }

    res.json({ message: 'Student removed successfully' });
  } catch (error) {
    console.error('Remove student error:', error);
    res.status(500).json({ error: 'Failed to remove student' });
  }
});

// Get available students for dean (from their departments)
router.get('/students', requireAdminOrHigher, async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user?.userId;
    
    const students = await prisma.user.findMany({
      where: {
        roles: { has: 'STUDENT' },
        is_active: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        email: true,
        uid: true
      },
      orderBy: { name: 'asc' }
    });

    const formattedStudents = students.map(student => ({
      id: student.id,
      name: student.name,
      email: student.email,
      department: 'General' // You might want to add department info to user model
    }));

    res.json(formattedStudents);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

export default router;
