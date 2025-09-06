import { Router } from 'express';
import { prisma } from '../utils/prisma';

const router = Router();

// Get courses
router.get('/', async (req, res) => {
  res.json({ message: 'Courses endpoint - implementation needed' });
});

// Create course
router.post('/', async (req, res) => {
  res.json({ message: 'Create course endpoint - implementation needed' });
});

// Get videos for a course
router.get('/:courseId/videos', async (req, res) => {
  try {
    const { courseId } = req.params;
    const currentUserId = (req as any).user?.userId;

    console.log(`[DEBUG] User ${currentUserId} requesting videos for course ${courseId}`);

    // Verify user has access to this course (either enrolled as student or teacher)
    const studentEnrollment = await prisma.enrollment.findFirst({
      where: {
        user_id: currentUserId,
        section: {
          course_id: courseId
        },
        role: 'STUDENT'
      }
    });

    console.log(`[DEBUG] Student enrollment found:`, studentEnrollment ? 'Yes' : 'No');

    // If not enrolled as student, check if user is a teacher for this course
    if (!studentEnrollment) {
      const teacherEnrollment = await prisma.enrollment.findFirst({
        where: {
          user_id: currentUserId,
          section: {
            course_id: courseId
          },
          role: 'TEACHER'
        }
      });

      console.log(`[DEBUG] Teacher enrollment found:`, teacherEnrollment ? 'Yes' : 'No');

      if (!teacherEnrollment) {
        console.log(`[DEBUG] No access found for user ${currentUserId} to course ${courseId}`);
        return res.status(403).json({ error: 'You do not have access to this course' });
      }
    }

    const videos = await prisma.video.findMany({
      where: {
        course_id: courseId,
        status: 'APPROVED' // Only show approved videos
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    console.log(`[DEBUG] Found ${videos.length} videos for course ${courseId}`);
    res.json(videos);
  } catch (error) {
    console.error('Get course videos error:', error);
    res.status(500).json({ error: 'Failed to fetch course videos' });
  }
});

export default router;
