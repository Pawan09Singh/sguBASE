import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';

const router = Router();
const prisma = new PrismaClient();

// Middleware to check if user is a Teacher or higher
const requireTeacherOrHigher = (req: any, res: Response, next: any) => {
  const userRoles = req.user?.roles || [];
  const allowedRoles = ['SUPERADMIN', 'ADMIN', 'HOD', 'CC', 'TEACHER'];
  
  if (req.user?.userId === 'superadmin' || userRoles.some((role: string) => allowedRoles.includes(role))) {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Teacher privileges required.' });
  }
};

// Get teacher dashboard statistics
router.get('/stats', requireTeacherOrHigher, async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user?.userId;
    
    // Get sections where this teacher is assigned
    const teacherSections = await prisma.enrollment.findMany({
      where: {
        user_id: currentUserId,
        role: 'TEACHER'
      },
      include: {
        section: {
          include: {
            course: true,
            _count: {
              select: {
                enrollments: {
                  where: { role: 'STUDENT' }
                }
              }
            }
          }
        }
      }
    });

    const totalCourses = teacherSections.length;
    const totalStudents = teacherSections.reduce((sum, enrollment) => 
      sum + enrollment.section._count.enrollments, 0
    );

    // Count videos uploaded by this teacher (mock for now)
    const videosUploaded = 15; // TODO: Implement video counting from actual video table
    const avgStudentProgress = 78; // TODO: Calculate from actual student progress data

    res.json({
      totalCourses,
      totalStudents,
      videosUploaded,
      avgStudentProgress
    });
  } catch (error) {
    console.error('Get teacher stats error:', error);
    res.status(500).json({ error: 'Failed to fetch teacher statistics' });
  }
});

// Get teacher's assigned courses
router.get('/courses', requireTeacherOrHigher, async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user?.userId;
    
    const teacherSections = await prisma.enrollment.findMany({
      where: {
        user_id: currentUserId,
        role: 'TEACHER'
      },
      include: {
        section: {
          include: {
            course: true,
            _count: {
              select: {
                enrollments: {
                  where: { role: 'STUDENT' }
                }
              }
            }
          }
        }
      }
    });

    const courses = teacherSections.map(enrollment => ({
      id: enrollment.section.id,
      name: `${enrollment.section.course.course_name} - ${enrollment.section.section_name}`,
      section: enrollment.section.section_name,
      students: enrollment.section._count.enrollments,
      progress: Math.floor(Math.random() * 40) + 60, // Mock progress 60-100%
      lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
    }));

    res.json(courses);
  } catch (error) {
    console.error('Get teacher courses error:', error);
    res.status(500).json({ error: 'Failed to fetch teacher courses' });
  }
});

// Get teacher's sections with detailed info
router.get('/sections', requireTeacherOrHigher, async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user?.userId;
    
    const teacherSections = await prisma.enrollment.findMany({
      where: {
        user_id: currentUserId,
        role: 'TEACHER'
      },
      include: {
        section: {
          include: {
            course: true,
            _count: {
              select: {
                enrollments: {
                  where: { role: 'STUDENT' }
                }
              }
            }
          }
        }
      }
    });

    const sections = teacherSections.map(enrollment => ({
      id: enrollment.section.id,
      name: enrollment.section.section_name,
      course: enrollment.section.course.course_name,
      courseId: enrollment.section.course.id,
      students: enrollment.section._count.enrollments,
      videos: Math.floor(Math.random() * 10) + 5, // Mock video count
      quizzes: Math.floor(Math.random() * 5) + 2  // Mock quiz count
    }));

    res.json(sections);
  } catch (error) {
    console.error('Get teacher sections error:', error);
    res.status(500).json({ error: 'Failed to fetch teacher sections' });
  }
});

// Upload video endpoint
router.post('/upload-video', [
  requireTeacherOrHigher,
  body('title').notEmpty().withMessage('Video title is required'),
  body('course_id').notEmpty().withMessage('Course ID is required'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, course_id, video_url, youtubeLink } = req.body;
    const currentUserId = (req as any).user?.userId;

    // Use video_url if provided, otherwise use youtubeLink for backward compatibility
    const videoUrl = video_url || youtubeLink;

    // Verify teacher is assigned to this course (through any section)
    const teacherEnrollment = await prisma.enrollment.findFirst({
      where: {
        user_id: currentUserId,
        section: {
          course_id: course_id
        },
        role: 'TEACHER'
      }
    });

    if (!teacherEnrollment) {
      return res.status(403).json({ error: 'You are not assigned to teach this course' });
    }

    // If videoUrl is provided, store it as a video resource
    if (videoUrl && typeof videoUrl === 'string' && videoUrl.trim().length > 0) {
      const video = await prisma.video.create({
        data: {
          title,
          description: description || '',
          video_url: videoUrl,
          course_id: course_id,
          uploaded_by: currentUserId,
          status: 'APPROVED', // Auto-approve for simplicity
        }
      });
      return res.json({
        message: 'Video uploaded successfully',
        video: {
          id: video.id,
          title: video.title,
          description: video.description,
          video_url: video.video_url,
          course_id: video.course_id,
          uploaded_by: video.uploaded_by,
          status: video.status,
          created_at: video.created_at
        }
      });
    }

    // TODO: Handle actual video file upload to cloud storage
    // For now, just respond with a mock
    res.json({
      message: 'Video uploaded successfully (file upload not implemented)',
      video: {
        id: `video_${Date.now()}`,
        title,
        description,
        course_id,
        uploadedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({ error: 'Failed to upload video' });
  }
});

// Debug endpoint to test quiz creation data
router.post('/debug-quiz', requireTeacherOrHigher, async (req: Request, res: Response) => {
  console.log('DEBUG QUIZ REQUEST:');
  console.log('Headers:', req.headers);
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('User:', (req as any).user);
  
  res.json({
    message: 'Debug info logged',
    receivedBody: req.body,
    user: (req as any).user
  });
});

// Get standalone quizzes for a course
router.get('/courses/:courseId/quizzes', requireTeacherOrHigher, async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const currentUserId = (req as any).user?.userId;

    console.log('Fetching standalone quizzes for course:', courseId);

    // Verify teacher has access to this course
    const teacherAccess = await prisma.enrollment.findFirst({
      where: {
        user_id: currentUserId,
        section: {
          course_id: courseId
        },
        role: 'TEACHER'
      }
    });

    if (!teacherAccess) {
      return res.status(403).json({ error: 'You do not have access to this course' });
    }

    // Get standalone quizzes (those not attached to videos)
    const quizzes = await prisma.quiz.findMany({
      where: {
        video_id: {
          startsWith: 'standalone-quiz-'
        },
        questions: {
          path: ['course_id'],
          equals: courseId
        }
      },
      orderBy: {
        created_at: 'asc'
      }
    });

    const formattedQuizzes = quizzes.map(quiz => {
      const questionsData = quiz.questions as any;
      return {
        id: quiz.id,
        quiz_id: quiz.id,
        type: 'quiz',
        title: quiz.title,
        questions: questionsData.questions || [],
        course_id: questionsData.course_id,
        unit_id: questionsData.unit_id,
        unit_name: questionsData.unit_name,
        created_at: quiz.created_at
      };
    });

    console.log(`Found ${formattedQuizzes.length} standalone quizzes for course ${courseId}`);
    res.json(formattedQuizzes);

  } catch (error) {
    console.error('Error fetching standalone quizzes:', error);
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

// Create quiz endpoint - Simplified version
router.post('/create-quiz-v2', [
  requireTeacherOrHigher,
  body('title').notEmpty().withMessage('Quiz title is required'),
  body('course_id').notEmpty().withMessage('Course ID is required'),
  body('questions').isArray({ min: 1 }).withMessage('At least one question is required')
], async (req: Request, res: Response) => {
  try {
    console.log('Quiz creation v2 request body:', JSON.stringify(req.body, null, 2));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Quiz validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, course_id, questions, unit_id, unit_name } = req.body;
    const currentUserId = (req as any).user?.userId;

    console.log('Creating quiz v2 with:', { title, course_id, questionsCount: questions.length, currentUserId });

    // Verify teacher has access to this course
    const teacherAccess = await prisma.enrollment.findFirst({
      where: {
        user_id: currentUserId,
        section: {
          course_id: course_id
        },
        role: 'TEACHER'
      }
    });

    if (!teacherAccess) {
      console.log('Teacher access denied for course:', course_id);
      return res.status(403).json({ error: 'You do not have access to this course' });
    }

    console.log('Teacher access verified, creating quiz directly in Quiz table...');

    // Create quiz directly in the Quiz table without the video wrapper
    const quizData = await prisma.quiz.create({
      data: {
        video_id: `standalone-quiz-${Date.now()}`, // Use a placeholder video_id for standalone quizzes
        title,
        questions: {
          questions: questions,
          course_id: course_id,
          unit_id: unit_id || null,
          unit_name: unit_name || null,
          created_by: currentUserId,
          created_at: new Date().toISOString()
        }
      }
    });

    console.log('Quiz v2 created successfully:', quizData.id);

    res.json({
      message: 'Quiz created successfully',
      quiz: {
        id: quizData.id,
        quiz_id: quizData.id,
        title: quizData.title,
        course_id: course_id,
        questions: questions,
        unit_id,
        unit_name,
        type: 'quiz',
        created_at: quizData.created_at
      }
    });

  } catch (error) {
    console.error('Quiz v2 creation error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    res.status(500).json({ 
      error: 'Failed to create quiz',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
router.post('/create-quiz', [
  requireTeacherOrHigher,
  body('title').notEmpty().withMessage('Quiz title is required'),
  body('course_id').notEmpty().withMessage('Course ID is required'),
  body('questions').isArray({ min: 1 }).withMessage('At least one question is required')
], async (req: Request, res: Response) => {
  try {
    console.log('Quiz creation request body:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Quiz validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, course_id, questions, unit_id, unit_name } = req.body;
    const currentUserId = (req as any).user?.userId;

    console.log('Creating quiz with:', { title, course_id, questionsCount: questions.length, currentUserId });

    // Verify teacher has access to this course
    const teacherAccess = await prisma.enrollment.findFirst({
      where: {
        user_id: currentUserId,
        section: {
          course_id: course_id
        },
        role: 'TEACHER'
      }
    });

    if (!teacherAccess) {
      console.log('Teacher access denied for course:', course_id);
      return res.status(403).json({ error: 'You do not have access to this course' });
    }

    console.log('Teacher access verified, creating quiz...');

    console.log('Teacher access verified, creating quiz...');

    // Create a standalone quiz in the videos table with a special marker
    // For now, we'll use the existing structure but mark it as a quiz
    const quiz = await prisma.video.create({
      data: {
        title,
        description: description || '',
        video_url: `quiz://standalone-${Date.now()}`, // Special URL to indicate it's a quiz
        course_id,
        uploaded_by: currentUserId,
        status: 'APPROVED', // Auto-approve quizzes
        duration: questions.length * 60 // Estimate 1 minute per question
      }
    });

    console.log('Quiz video entry created:', quiz.id);

    // Store quiz questions and metadata in a separate table using the Quiz model
    const quizData = await prisma.quiz.create({
      data: {
        video_id: quiz.id,
        title,
        questions: {
          questions: questions,
          unit_id: unit_id || null,
          unit_name: unit_name || null,
          created_at: new Date().toISOString()
        }
      }
    });

    console.log('Quiz data created:', quizData.id);

    res.json({
      message: 'Quiz created successfully',
      quiz: {
        id: quiz.id,
        quiz_id: quizData.id,
        title: quiz.title,
        description: quiz.description,
        course_id: quiz.course_id,
        questions: questions,
        unit_id,
        unit_name,
        type: 'quiz',
        created_at: quiz.created_at
      }
    });

  } catch (error) {
    console.error('Quiz creation error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    res.status(500).json({ 
      error: 'Failed to create quiz',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get course content (videos and quizzes) for playlist
router.get('/courses/:courseId/content', requireTeacherOrHigher, async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const currentUserId = (req as any).user?.userId;

    // Verify teacher has access to this course
    const teacherAccess = await prisma.enrollment.findFirst({
      where: {
        user_id: currentUserId,
        section: {
          course_id: courseId
        },
        role: 'TEACHER'
      }
    });

    if (!teacherAccess) {
      return res.status(403).json({ error: 'You do not have access to this course' });
    }

    // Get all videos and quizzes for this course
    const content = await prisma.video.findMany({
      where: {
        course_id: courseId
      },
      include: {
        quizzes: true
      },
      orderBy: {
        created_at: 'asc'
      }
    });

    // Also get standalone quizzes (not attached to videos)
    const standaloneQuizzes = await prisma.quiz.findMany({
      where: {
        video_id: {
          startsWith: 'standalone-quiz-'
        },
        questions: {
          path: ['course_id'],
          equals: courseId
        }
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
        let unit_id = null;
        let unit_name = null;
        let questions = [];
        if (quizData?.questions && typeof quizData.questions === 'object' && !Array.isArray(quizData.questions)) {
          // If questions is an object, extract unit_id/unit_name and questions array
          unit_id = (quizData.questions as any).unit_id || null;
          unit_name = (quizData.questions as any).unit_name || null;
          questions = Array.isArray((quizData.questions as any).questions) ? (quizData.questions as any).questions : [];
        } else {
          questions = Array.isArray(quizData?.questions) ? quizData.questions as any[] : [];
        }
        return {
          id: item.id,
          quiz_id: quizData?.id,
          type: 'quiz',
          title: item.title,
          description: item.description,
          questions,
          course_id: item.course_id,
          created_at: item.created_at,
          unit_id,
          unit_name
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

    // Add standalone quizzes to the content
    const standaloneQuizContent = standaloneQuizzes.map(quiz => {
      const questionsData = quiz.questions as any;
      return {
        id: quiz.id,
        quiz_id: quiz.id,
        type: 'quiz',
        title: quiz.title,
        description: '',
        questions: questionsData.questions || [],
        course_id: questionsData.course_id,
        unit_id: questionsData.unit_id,
        unit_name: questionsData.unit_name,
        created_at: quiz.created_at
      };
    });

    // Combine and sort all content by creation date
    const allContent = [...formattedContent, ...standaloneQuizContent].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    console.log(`Returning ${formattedContent.length} video/quiz items + ${standaloneQuizContent.length} standalone quizzes = ${allContent.length} total items`);

    res.json(allContent);
  } catch (error) {
    console.error('Get course content error:', error);
    res.status(500).json({ error: 'Failed to fetch course content' });
  }
});

// Get section students (for teacher to view their students)
router.get('/sections/:sectionId/students', requireTeacherOrHigher, async (req: Request, res: Response) => {
  try {
    const { sectionId } = req.params;
    const currentUserId = (req as any).user?.userId;

    // Verify teacher is assigned to this section
    const teacherEnrollment = await prisma.enrollment.findFirst({
      where: {
        user_id: currentUserId,
        section_id: sectionId,
        role: 'TEACHER'
      }
    });

    if (!teacherEnrollment) {
      return res.status(403).json({ error: 'You are not assigned to teach this section' });
    }

    const students = await prisma.enrollment.findMany({
      where: {
        section_id: sectionId,
        role: 'STUDENT'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            uid: true
          }
        }
      }
    });

    const formattedStudents = students.map(enrollment => ({
      id: enrollment.user.id,
      name: enrollment.user.name,
      email: enrollment.user.email,
      uid: enrollment.user.uid,
      enrolledAt: enrollment.enrolled_at,
      progress: Math.floor(Math.random() * 40) + 60, // Mock progress
      lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
    }));

    res.json(formattedStudents);
  } catch (error) {
    console.error('Get section students error:', error);
    res.status(500).json({ error: 'Failed to fetch section students' });
  }
});

export default router;
