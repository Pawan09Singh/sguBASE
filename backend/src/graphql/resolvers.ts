import { prisma } from '../utils/prisma';
import { AuthUtils } from '../utils/auth';

export const resolvers = {
  Query: {
    me: async (parent: any, args: any, context: any) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      if (context.user.userId === 'superadmin') {
        return {
          id: 'superadmin',
          uid: '12345',
          name: 'Super Administrator',
          email: 'superadmin@university.edu',
          roles: ['SUPERADMIN'],
          is_active: 'ACTIVE',
          default_dashboard: 'SUPERADMIN',
          created_at: new Date(),
          updated_at: new Date()
        };
      }

      return await prisma.user.findUnique({
        where: { id: context.user.userId }
      });
    },

    users: async (parent: any, args: any, context: any) => {
      if (!context.user || !AuthUtils.hasHigherOrEqualRole(context.user.roles, 'ADMIN' as any)) {
        throw new Error('Insufficient permissions');
      }

      const where = args.role ? { roles: { has: args.role } } : {};
      
      return await prisma.user.findMany({
        where,
        orderBy: { name: 'asc' }
      });
    },

    departments: async (parent: any, args: any, context: any) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      return await prisma.department.findMany({
        include: {
          dean: true,
          creator: true,
          courses: true
        },
        orderBy: { dept_name: 'asc' }
      });
    },

    courses: async (parent: any, args: any, context: any) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const where = args.dept_id ? { dept_id: args.dept_id } : {};

      return await prisma.course.findMany({
        where,
        include: {
          department: true,
          creator: true,
          sections: true
        },
        orderBy: { course_name: 'asc' }
      });
    },

    myCourses: async (parent: any, args: any, context: any) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      // Get courses based on user's enrollments
      const enrollments = await prisma.enrollment.findMany({
        where: { user_id: context.user.userId },
        include: {
          section: {
            include: {
              course: {
                include: {
                  department: true,
                  creator: true
                }
              }
            }
          }
        }
      });

      return enrollments.map(enrollment => enrollment.section.course);
    },

    courseAnalytics: async (parent: any, args: any, context: any) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const { course_id } = args;

      // Get course sections
      const sections = await prisma.section.findMany({
        where: { course_id },
        include: {
          enrollments: true
        }
      });

      const totalStudents = sections.reduce((acc: number, section: any) => 
        acc + section.enrollments.filter((e: any) => e.role === 'STUDENT').length, 0
      );

      // Get videos for the course
      const videos = await prisma.video.findMany({
        where: { course_id: course_id }
      });

      const totalVideos = videos.length;

      return {
        course_id,
        total_students: totalStudents,
        total_videos: totalVideos,
        average_completion: 0, // Calculate based on watch history
        total_quiz_attempts: 0, // Calculate from quiz attempts
        average_quiz_score: 0 // Calculate from quiz attempts
      };
    },

    dashboardStats: async (parent: any, args: any, context: any) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      // Return role-specific dashboard statistics as JSON
      const stats = {
        totalUsers: await prisma.user.count(),
        totalCourses: await prisma.course.count(),
        totalDepartments: await prisma.department.count(),
        recentActivity: []
      };

      return JSON.stringify(stats);
    }
  },

  Mutation: {
    createUser: async (parent: any, args: any, context: any) => {
      if (!context.user || !AuthUtils.hasHigherOrEqualRole(context.user.roles, 'ADMIN' as any)) {
        throw new Error('Insufficient permissions');
      }

      const { input } = args;
      const hashedPassword = await AuthUtils.hashPassword(input.password);

      return await prisma.user.create({
        data: {
          ...input,
          password_hash: hashedPassword,
          default_dashboard: AuthUtils.getHighestRole(input.roles)
        }
      });
    },

    createDepartment: async (parent: any, args: any, context: any) => {
      if (!context.user || !AuthUtils.hasHigherOrEqualRole(context.user.roles, 'SUPERADMIN' as any)) {
        throw new Error('Insufficient permissions');
      }

      const { input } = args;

      return await prisma.department.create({
        data: {
          ...input,
          created_by: context.user.userId
        },
        include: {
          dean: true,
          creator: true,
          courses: true
        }
      });
    },

    createCourse: async (parent: any, args: any, context: any) => {
      if (!context.user || !AuthUtils.hasHigherOrEqualRole(context.user.roles, 'ADMIN' as any)) {
        throw new Error('Insufficient permissions');
      }

      const { input } = args;

      return await prisma.course.create({
        data: {
          ...input,
          created_by: context.user.userId
        },
        include: {
          department: true,
          creator: true,
          sections: true
        }
      });
    },

    createSection: async (parent: any, args: any, context: any) => {
      if (!context.user || !AuthUtils.hasHigherOrEqualRole(context.user.roles, 'HOD' as any)) {
        throw new Error('Insufficient permissions');
      }

      const { input } = args;

      return await prisma.section.create({
        data: input,
        include: {
          course: true,
          enrollments: true
        }
      });
    }
  }
};
