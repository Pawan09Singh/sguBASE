import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { requireStudentOrHigher } from '../middlewares/auth';

const router = Router();

// Get student's enrolled courses
router.get('/courses', requireStudentOrHigher, async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user?.userId;
    
    const studentEnrollments = await prisma.enrollment.findMany({
      where: {
        user_id: currentUserId,
        role: 'STUDENT'
      },
      include: {
        section: {
          include: {
            course: true
          }
        }
      }
    });

    // Get course details with videos separately to avoid complex nested queries
    const courseIds = studentEnrollments.map(enrollment => enrollment.section.course_id);
    
    const coursesWithVideos = await prisma.course.findMany({
      where: {
        id: {
          in: courseIds
        }
      },
      include: {
        videos: {
          where: {
            status: 'APPROVED'
          }
        }
      }
    });

    // Get teacher information for each section
    const teacherEnrollments = await prisma.enrollment.findMany({
      where: {
        section_id: {
          in: studentEnrollments.map(e => e.section_id)
        },
        role: 'TEACHER'
      },
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    });

    const courses = studentEnrollments.map(enrollment => {
      const course = enrollment.section.course;
      const courseWithVideos = coursesWithVideos.find(c => c.id === course.id);
      const teacher = teacherEnrollments.find(te => te.section_id === enrollment.section_id)?.user;
      const totalVideos = courseWithVideos?.videos?.length || 0;
      
      // Mock data for video watch progress - in real app, track this in watch_history table
      const watchedVideos = Math.floor(Math.random() * totalVideos);
      const progress = totalVideos > 0 ? Math.round((watchedVideos / totalVideos) * 100) : 0;
      
      return {
        id: course.id,
        name: course.course_name,
        section: enrollment.section.section_name,
        instructor: teacher?.name || 'Instructor',
        progress,
        totalVideos,
        watchedVideos,
        status: progress === 100 ? 'completed' : progress > 0 ? 'in-progress' : 'not-started',
        lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        score: Math.floor(Math.random() * 30) + 70 // Mock score 70-100%
      };
    });

    res.json(courses);
  } catch (error) {
    console.error('Get student courses error:', error);
    res.status(500).json({ error: 'Failed to fetch student courses' });
  }
});

// Get student statistics
router.get('/stats', requireStudentOrHigher, async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user?.userId;
    
    const enrollmentCount = await prisma.enrollment.count({
      where: {
        user_id: currentUserId,
        role: 'STUDENT'
      }
    });

    // Mock statistics - in real app, calculate from actual progress data
    const completedCourses = Math.floor(enrollmentCount * 0.6);
    const overallProgress = Math.floor(Math.random() * 40) + 60; // 60-100%
    
    res.json({
      enrolledCourses: enrollmentCount,
      completedCourses,
      overallProgress,
      certificates: completedCourses
    });
  } catch (error) {
    console.error('Get student stats error:', error);
    res.status(500).json({ error: 'Failed to fetch student statistics' });
  }
});

// Get course content (videos and quizzes) for student
router.get('/courses/:courseId/content', requireStudentOrHigher, async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const currentUserId = (req as any).user?.userId;

    // Verify student is enrolled in this course
    const studentEnrollment = await prisma.enrollment.findFirst({
      where: {
        user_id: currentUserId,
        section: {
          course_id: courseId
        },
        role: 'STUDENT'
      }
    });

    if (!studentEnrollment) {
      return res.status(403).json({ error: 'You are not enrolled in this course' });
    }

    // Get all approved videos and quizzes for this course
    const content = await prisma.video.findMany({
      where: {
        course_id: courseId,
        status: 'APPROVED'
      },
      include: {
        quizzes: true
      },
      orderBy: {
        created_at: 'asc'
      }
    });

    // Format content to distinguish between videos and quizzes
    const formattedContent = content.map(item => {
      const isQuiz = item.video_url.startsWith('quiz://');
      
      if (isQuiz) {
        const quizData = item.quizzes[0]; // Get the first (and should be only) quiz
        const questionsData = quizData?.questions as any;
        return {
          id: item.id,
          quiz_id: quizData?.id,
          type: 'quiz',
          title: item.title,
          description: item.description,
          questions: questionsData || [],
          course_id: item.course_id,
          created_at: item.created_at,
          unit_id: questionsData?.unit_id || null,
          unit_name: questionsData?.unit_name || null
        };
      } else {
        return {
          id: item.id,
          type: 'video',
          title: item.title,
          description: item.description,
          video_url: item.video_url,
          thumbnail: item.thumbnail,
          course_id: item.course_id,
          duration: item.duration,
          created_at: item.created_at
        };
      }
    });

    res.json(formattedContent);
  } catch (error) {
    console.error('Get course content error:', error);
    res.status(500).json({ error: 'Failed to fetch course content' });
  }
});

// Submit quiz attempt
router.post('/quizzes/:quizId/attempt', requireStudentOrHigher, async (req: Request, res: Response) => {
  try {
    const { quizId } = req.params;
    const { answers } = req.body;
    const currentUserId = (req as any).user?.userId;

    // Get the quiz data
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        video: true
      }
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Verify student has access to this quiz
    const studentEnrollment = await prisma.enrollment.findFirst({
      where: {
        user_id: currentUserId,
        section: {
          course_id: quiz.video.course_id
        },
        role: 'STUDENT'
      }
    });

    if (!studentEnrollment) {
      return res.status(403).json({ error: 'You do not have access to this quiz' });
    }

    // Calculate score
    const questions = quiz.questions as any;
    const quizQuestions = questions.questions || [];
    let correctAnswers = 0;
    
    quizQuestions.forEach((question: any, index: number) => {
      if (answers[index] === question.answer) {
        correctAnswers++;
      }
    });

    const score = quizQuestions.length > 0 ? (correctAnswers / quizQuestions.length) * 100 : 0;
    const maxScore = 100;

    // Save the attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        quiz_id: quizId,
        user_id: currentUserId,
        answers: answers,
        score: score,
        max_score: maxScore
      }
    });

    res.json({
      message: 'Quiz submitted successfully',
      attempt: {
        id: attempt.id,
        score: score,
        maxScore: maxScore,
        correctAnswers: correctAnswers,
        totalQuestions: quizQuestions.length,
        percentage: Math.round(score),
        completed_at: attempt.completed_at
      }
    });

  } catch (error) {
    console.error('Quiz attempt error:', error);
    res.status(500).json({ error: 'Failed to submit quiz attempt' });
  }
});

// Get announcements for students
router.get('/announcements', requireStudentOrHigher, async (req: Request, res: Response) => {
  try {
    // Get announcements that target students or both students and teachers
    const announcements = await prisma.announcement.findMany({
      where: {
        OR: [
          { target_role: 'STUDENT' },
          { target_role: 'BOTH' }
        ]
      },
      include: {
        sender: {
          select: {
            name: true,
            email: true,
            roles: true
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
      type: announcement.target_role === 'BOTH' ? 'INFO' : 'ACADEMIC',
      target_audience: announcement.target_role === 'STUDENT' ? 'STUDENTS' : 'ALL',
      created_at: announcement.created_at,
      created_by: announcement.sender.name,
      sender_role: announcement.sender.roles.includes('ADMIN') ? 'Dean' : 
                   announcement.sender.roles.includes('SUPERADMIN') ? 'Admin' : 'Teacher'
    }));

    res.json(formattedAnnouncements);
  } catch (error) {
    console.error('Get student announcements error:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

export default router;
