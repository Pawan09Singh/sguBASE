import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create departments
  const csDepartment = await prisma.department.create({
    data: {
      dept_name: 'Computer Science',
      created_by: 'superadmin',
    },
  });

  const mathDepartment = await prisma.department.create({
    data: {
      dept_name: 'Mathematics',
      created_by: 'superadmin',
    },
  });

  const physicsDepartment = await prisma.department.create({
    data: {
      dept_name: 'Physics',
      created_by: 'superadmin',
    },
  });

  console.log('✅ Departments created');

  // Create users with different roles
  const hashedPassword = await bcrypt.hash('password123', 12);
  const superAdminPassword = await bcrypt.hash('12345', 12);

  // SuperAdmin
  const superAdmin = await prisma.user.create({
    data: {
      id: 'superadmin', // Use 'superadmin' as the ID to match department references
      uid: '12345',
      name: 'Super Administrator',
      email: 'superadmin@university.edu',
      password_hash: superAdminPassword,
      roles: ['SUPERADMIN'],
      default_dashboard: 'SUPERADMIN',
    },
  });

  // Dean (Admin)
  const dean = await prisma.user.create({
    data: {
      uid: 'DEAN001',
      name: 'Dr. Alice Johnson',
      email: 'dean@university.edu',
      password_hash: hashedPassword,
      roles: ['ADMIN'],
      default_dashboard: 'ADMIN',
    },
  });

  // Update department with dean
  await prisma.department.update({
    where: { id: csDepartment.id },
    data: { dean_id: dean.id },
  });

  // HOD
  const hod = await prisma.user.create({
    data: {
      uid: 'HOD001',
      name: 'Prof. Bob Smith',
      email: 'hod@university.edu',
      password_hash: hashedPassword,
      roles: ['HOD', 'TEACHER'],
      default_dashboard: 'HOD',
    },
  });

  // Course Coordinator
  const cc = await prisma.user.create({
    data: {
      uid: 'CC001',
      name: 'Dr. Carol Williams',
      email: 'cc@university.edu',
      password_hash: hashedPassword,
      roles: ['CC', 'TEACHER'],
      default_dashboard: 'CC',
    },
  });

  // Teachers
  const teacher1 = await prisma.user.create({
    data: {
      uid: 'TEACH001',
      name: 'Prof. David Brown',
      email: 'teacher1@university.edu',
      password_hash: hashedPassword,
      roles: ['TEACHER'],
      default_dashboard: 'TEACHER',
    },
  });

  const teacher2 = await prisma.user.create({
    data: {
      uid: 'TEACH002',
      name: 'Dr. Emily Davis',
      email: 'teacher2@university.edu',
      password_hash: hashedPassword,
      roles: ['TEACHER'],
      default_dashboard: 'TEACHER',
    },
  });

  // Students
  const students = [];
  for (let i = 1; i <= 10; i++) {
    const student = await prisma.user.create({
      data: {
        uid: `STU${i.toString().padStart(3, '0')}`,
        name: `Student ${i}`,
        email: `student${i}@university.edu`,
        password_hash: hashedPassword,
        roles: ['STUDENT'],
        default_dashboard: 'STUDENT',
      },
    });
    students.push(student);
  }

  console.log('✅ Users created');

  // Create courses
  const course1 = await prisma.course.create({
    data: {
      course_name: 'Data Structures and Algorithms',
      course_code: 'CS301',
      description: 'Introduction to fundamental data structures and algorithms',
      dept_id: csDepartment.id,
      created_by: dean.id,
    },
  });

  const course2 = await prisma.course.create({
    data: {
      course_name: 'Database Management Systems',
      course_code: 'CS302',
      description: 'Comprehensive study of database design and management',
      dept_id: csDepartment.id,
      created_by: dean.id,
    },
  });

  const course3 = await prisma.course.create({
    data: {
      course_name: 'Web Development',
      course_code: 'CS303',
      description: 'Modern web development with React and Node.js',
      dept_id: csDepartment.id,
      created_by: dean.id,
    },
  });

  console.log('✅ Courses created');

  // Create sections
  const section1A = await prisma.section.create({
    data: {
      section_name: 'Section A',
      course_id: course1.id,
    },
  });

  const section1B = await prisma.section.create({
    data: {
      section_name: 'Section B',
      course_id: course1.id,
    },
  });

  const section2A = await prisma.section.create({
    data: {
      section_name: 'Section A',
      course_id: course2.id,
    },
  });

  const section3A = await prisma.section.create({
    data: {
      section_name: 'Section A',
      course_id: course3.id,
    },
  });

  console.log('✅ Sections created');

  // Create enrollments
  // Enroll students in sections
  for (let i = 0; i < 5; i++) {
    await prisma.enrollment.create({
      data: {
        user_id: students[i].id,
        section_id: section1A.id,
        role: 'STUDENT',
      },
    });
  }

  for (let i = 5; i < 10; i++) {
    await prisma.enrollment.create({
      data: {
        user_id: students[i].id,
        section_id: section1B.id,
        role: 'STUDENT',
      },
    });
  }

  // Enroll some students in multiple courses
  for (let i = 0; i < 7; i++) {
    await prisma.enrollment.create({
      data: {
        user_id: students[i].id,
        section_id: section2A.id,
        role: 'STUDENT',
      },
    });
  }

  for (let i = 2; i < 8; i++) {
    await prisma.enrollment.create({
      data: {
        user_id: students[i].id,
        section_id: section3A.id,
        role: 'STUDENT',
      },
    });
  }

  // Enroll teachers
  await prisma.enrollment.create({
    data: {
      user_id: teacher1.id,
      section_id: section1A.id,
      role: 'TEACHER',
    },
  });

  await prisma.enrollment.create({
    data: {
      user_id: teacher2.id,
      section_id: section1B.id,
      role: 'TEACHER',
    },
  });

  await prisma.enrollment.create({
    data: {
      user_id: teacher1.id,
      section_id: section2A.id,
      role: 'TEACHER',
    },
  });

  await prisma.enrollment.create({
    data: {
      user_id: cc.id,
      section_id: section1A.id,
      role: 'CC',
    },
  });

  await prisma.enrollment.create({
    data: {
      user_id: cc.id,
      section_id: section2A.id,
      role: 'CC',
    },
  });

  console.log('✅ Enrollments created');

  // Create sample videos
  const video1 = await prisma.video.create({
    data: {
      title: 'Introduction to Arrays',
      description: 'Basic concepts of arrays and their operations',
      video_url: 'https://example.com/video1.mp4',
      course_id: course1.id, // Changed from section_id to course_id
      uploaded_by: teacher1.id,
      status: 'APPROVED',
      deadline: new Date('2024-12-31'),
    },
  });

  const video2 = await prisma.video.create({
    data: {
      title: 'Linked Lists Fundamentals',
      description: 'Understanding linked lists and their implementation',
      video_url: 'https://example.com/video2.mp4',
      course_id: course1.id, // Changed from section_id to course_id
      uploaded_by: teacher1.id,
      status: 'APPROVED',
      deadline: new Date('2024-12-31'),
    },
  });

  const video3 = await prisma.video.create({
    data: {
      title: 'Database Design Principles',
      description: 'Core principles of database design and normalization',
      video_url: 'https://example.com/video3.mp4',
      course_id: course2.id, // Changed from section_id to course_id
      uploaded_by: teacher1.id,
      status: 'APPROVED', // Changed from PENDING to APPROVED so students can see it
      deadline: new Date('2024-12-31'),
    },
  });

  console.log('✅ Videos created');

  // Create sample quizzes
  const quiz1 = await prisma.quiz.create({
    data: {
      video_id: video1.id,
      title: 'Arrays Quiz',
      questions: JSON.stringify([
        {
          id: 'q1',
          question: 'What is the time complexity of accessing an element in an array?',
          options: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'],
          correct: 0,
        },
        {
          id: 'q2',
          question: 'Which of the following is true about arrays?',
          options: [
            'Elements are stored in contiguous memory',
            'Size can be changed dynamically',
            'Elements can be of different types',
            'Random access is not possible',
          ],
          correct: 0,
        },
      ]),
    },
  });

  const quiz2 = await prisma.quiz.create({
    data: {
      video_id: video2.id,
      title: 'Linked Lists Quiz',
      questions: JSON.stringify([
        {
          id: 'q1',
          question: 'What is the main advantage of linked lists over arrays?',
          options: [
            'Faster access time',
            'Dynamic size',
            'Less memory usage',
            'Better cache performance',
          ],
          correct: 1,
        },
        {
          id: 'q2',
          question: 'In a singly linked list, each node contains:',
          options: [
            'Only data',
            'Data and pointer to next node',
            'Data and pointer to previous node',
            'Two pointers',
          ],
          correct: 1,
        },
      ]),
    },
  });

  console.log('✅ Quizzes created');

  // Create sample announcements
  await prisma.announcement.create({
    data: {
      title: 'Welcome to Data Structures Course',
      content: 'Welcome everyone! Please make sure to complete all video assignments on time.',
      sender_id: teacher1.id,
      target_role: 'STUDENT',
      section_id: section1A.id,
      expiry_date: new Date('2024-12-31'),
    },
  });

  await prisma.announcement.create({
    data: {
      title: 'Mid-term Exam Schedule',
      content: 'Mid-term exams will be conducted in the third week of December.',
      sender_id: dean.id,
      target_role: 'BOTH',
      course_id: course1.id,
      expiry_date: new Date('2024-12-31'),
    },
  });

  console.log('✅ Announcements created');

  // Create sample quiz attempts
  for (let i = 0; i < 3; i++) {
    await prisma.quizAttempt.create({
      data: {
        quiz_id: quiz1.id,
        user_id: students[i].id,
        answers: JSON.stringify([
          { questionId: 'q1', answer: 0 }, // Correct
          { questionId: 'q2', answer: 0 }, // Correct
        ]),
        score: 2,
        max_score: 2,
      },
    });
  }

  for (let i = 3; i < 5; i++) {
    await prisma.quizAttempt.create({
      data: {
        quiz_id: quiz1.id,
        user_id: students[i].id,
        answers: JSON.stringify([
          { questionId: 'q1', answer: 0 }, // Correct
          { questionId: 'q2', answer: 1 }, // Incorrect
        ]),
        score: 1,
        max_score: 2,
      },
    });
  }

  console.log('✅ Quiz attempts created');

  // Create sample watch history
  for (let i = 0; i < 5; i++) {
    await prisma.watchHistory.create({
      data: {
        user_id: students[i].id,
        video_id: video1.id,
        watch_time: 1200, // 20 minutes
        completion: Math.random() * 100, // Random completion percentage
      },
    });
  }

  console.log('✅ Watch history created');

  // Create sample forum posts
  const forumPost1 = await prisma.forumPost.create({
    data: {
      title: 'Help with Array Implementation',
      content: 'I am having trouble understanding how to implement dynamic arrays. Can someone help?',
      section_id: section1A.id,
      author_id: students[0].id,
    },
  });

  await prisma.forumReply.create({
    data: {
      content: 'Sure! Dynamic arrays are resized automatically when they reach capacity. Think about how vectors work in C++.',
      post_id: forumPost1.id,
      author_id: teacher1.id,
    },
  });

  await prisma.forumReply.create({
    data: {
      content: 'Thanks! That helps clarify the concept.',
      post_id: forumPost1.id,
      author_id: students[0].id,
    },
  });

  console.log('✅ Forum posts and replies created');

  // Create sample logs
  await prisma.log.create({
    data: {
      user_id: dean.id,
      action: 'COURSE_CREATED',
      context: { course_name: 'Data Structures and Algorithms', course_id: course1.id },
    },
  });

  await prisma.log.create({
    data: {
      user_id: teacher1.id,
      action: 'VIDEO_UPLOADED',
      context: { video_title: 'Introduction to Arrays', video_id: video1.id },
    },
  });

  await prisma.log.create({
    data: {
      user_id: students[0].id,
      action: 'QUIZ_COMPLETED',
      context: { quiz_title: 'Arrays Quiz', score: 2, max_score: 2 },
    },
  });

  console.log('✅ Sample logs created');

  // Create system permissions
  await prisma.systemPermission.create({
    data: {
      chat_level: 3,
      video_upload: 2,
      announcement: 3,
      quiz_delete: true,
    },
  });

  console.log('✅ System permissions created');

  console.log('🎉 Database seeding completed successfully!');
  
  console.log('\n📝 Sample Login Credentials:');
  console.log('SuperAdmin: UID: 12345, Password: 12345');
  console.log('Dean: Email: dean@university.edu, Password: password123');
  console.log('HOD: Email: hod@university.edu, Password: password123');
  console.log('CC: Email: cc@university.edu, Password: password123');
  console.log('Teacher: Email: teacher1@university.edu, Password: password123');
  console.log('Student: Email: student1@university.edu, Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
