'use client';

import { useState, useEffect } from 'react';

interface StudentStats {
  enrolledCourses: number;
  completedCourses: number;
  overallProgress: number;
  certificates: number;
}

interface Course {
  id: string;
  name: string;
  section: string;
  instructor: string;
  progress: number;
  totalVideos: number;
  watchedVideos: number;
  lastActivity: string;
  score: number;
}

interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  duration?: number;
  status?: string;
  created_at: string;
}

interface Quiz {
  id: string;
  quiz_id: string;
  title: string;
  description: string;
  questions: any[];
  created_at: string;
}

interface ContentItem {
  id: string;
  type: 'video' | 'quiz';
  title: string;
  description: string;
  video_url?: string;
  duration?: number;
  questions?: any[];
  quiz_id?: string;
  created_at: string;
  unit_id?: string;
  unit_name?: string;
}

export default function StudentDashboard() {
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseContent, setCourseContent] = useState<ContentItem[]>([]);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [stats, setStats] = useState<StudentStats>({
    enrolledCourses: 0,
    completedCourses: 0,
    overallProgress: 0,
    certificates: 0
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStudentData();
  }, []);

  // Listen for sidebar navigation
  useEffect(() => {
    const handleSidebarClick = (event: any) => {
      const { id } = event.detail;
      setActiveView(id);
      
      // Fetch announcements when switching to announcements view
      if (id === 'announcements') {
        fetchAnnouncements();
      }
    };

    document.addEventListener('sidebarItemClick', handleSidebarClick);
    return () => {
      document.removeEventListener('sidebarItemClick', handleSidebarClick);
    };
  }, []);

  const fetchStudentData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('No access token found. Please login again.');
        setLoading(false);
        return;
      }

      // Fetch student courses
      const coursesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/student/courses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json();
        console.log('Courses data:', coursesData);
        setCourses(coursesData);
        
        // Calculate stats based on courses
        const enrolledCount = coursesData.length;
        const completedCount = coursesData.filter((c: Course) => c.progress === 100).length;
        const avgProgress = coursesData.length > 0 
          ? Math.round(coursesData.reduce((sum: number, c: Course) => sum + c.progress, 0) / coursesData.length)
          : 0;
        
        setStats({
          enrolledCourses: enrolledCount,
          completedCourses: completedCount,
          overallProgress: avgProgress,
          certificates: completedCount
        });
      } else if (coursesResponse.status === 401) {
        setError('Session expired. Please login again.');
      } else {
        console.error('Failed to fetch courses:', coursesResponse.status);
        setError('Failed to load course data');
      }

    } catch (error) {
      console.error('Error fetching student data:', error);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      setAnnouncementsLoading(true);
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        console.error('No access token found');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/student/announcements`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const announcementsData = await response.json();
        setAnnouncements(announcementsData);
      } else {
        console.error('Failed to fetch announcements:', response.status);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  const openCoursePlaylist = (course: Course) => {
    setSelectedCourse(course);
    setActiveView('course-playlist');
    fetchCourseContent(course.id);
  };

  const fetchCourseContent = async (courseId: string) => {
    setLoadingContent(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('No access token found');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/student/courses/${courseId}/content`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const content = await response.json();
        setCourseContent(content);
        
        // Auto-select first video if available
        const firstVideo = content.find((item: ContentItem) => item.type === 'video');
        if (firstVideo) {
          setCurrentVideo(firstVideo as Video);
        }
      } else {
        console.error('Failed to fetch course content');
        setCourseContent([]);
      }
    } catch (error) {
      console.error('Error fetching course content:', error);
      setCourseContent([]);
    } finally {
      setLoadingContent(false);
    }
  };

  const openQuiz = (quiz: ContentItem) => {
    setCurrentQuiz(quiz as Quiz);
    setQuizAnswers(new Array(quiz.questions?.length || 0).fill(-1));
    setQuizSubmitted(false);
    setQuizResult(null);
    setShowQuizModal(true);
  };

  const handleQuizAnswer = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...quizAnswers];
    newAnswers[questionIndex] = answerIndex;
    setQuizAnswers(newAnswers);
  };

  const submitQuiz = async () => {
    if (!currentQuiz?.quiz_id) return;

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/student/quizzes/${currentQuiz.quiz_id}/attempt`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          answers: quizAnswers
        })
      });

      if (response.ok) {
        const result = await response.json();
        setQuizResult(result.attempt);
        setQuizSubmitted(true);
      } else {
        console.error('Failed to submit quiz');
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  };

  const getYouTubeEmbedUrl = (url: string) => {
    // Convert YouTube URLs to embed format
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(regex);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    return url;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-red-800">Error</h3>
          <p className="text-red-700">{error}</p>
          <button 
            onClick={fetchStudentData}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Render functions for different views
  const renderDashboard = () => (
    <>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's your learning progress.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <span className="text-white font-semibold">📚</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Enrolled Courses</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.enrolledCourses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <span className="text-white font-semibold">✅</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed Courses</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.completedCourses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                <span className="text-white font-semibold">📊</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Overall Progress</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.overallProgress}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                <span className="text-white font-semibold">🏆</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Certificates</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.certificates}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            onClick={() => setActiveView('my-courses')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="text-center">
              <span className="text-2xl block mb-2">📚</span>
              <span className="text-sm font-medium text-gray-700">View My Courses</span>
            </div>
          </button>
          
          <button 
            onClick={() => setActiveView('forum')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="text-center">
              <span className="text-2xl block mb-2">💬</span>
              <span className="text-sm font-medium text-gray-700">Join Forum</span>
            </div>
          </button>
          
          <button 
            onClick={() => setActiveView('certificates')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="text-center">
              <span className="text-2xl block mb-2">🏆</span>
              <span className="text-sm font-medium text-gray-700">View Certificates</span>
            </div>
          </button>
          
          <button 
            onClick={() => setActiveView('analytics')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="text-center">
              <span className="text-2xl block mb-2">📊</span>
              <span className="text-sm font-medium text-gray-700">View Analytics</span>
            </div>
          </button>
        </div>
      </div>
    </>
  );

  const renderMyCourses = () => (
    <>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
        <p className="text-gray-600">Here are all your enrolled courses with video progress tracking.</p>
      </div>

      {/* My Courses */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Enrolled Courses</h3>
        {courses.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">📚</div>
            <p className="text-gray-500">No courses enrolled yet.</p>
            <p className="text-sm text-gray-400 mt-2">Contact your administrator to get enrolled in courses.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <div 
                key={course.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{course.name}</h4>
                    <p className="text-sm text-gray-500">{course.section}</p>
                    <p className="text-xs text-gray-400">{course.instructor}</p>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    course.progress === 100 
                      ? 'bg-green-100 text-green-800' 
                      : course.progress > 0 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {course.progress === 100 ? 'Completed' : course.progress > 0 ? 'In Progress' : 'Not Started'}
                  </span>
                </div>
                <div className="mb-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        course.progress === 100 ? 'bg-green-600' : 'bg-blue-600'
                      }`} 
                      style={{width: `${course.progress}%`}}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>{course.progress}% Complete</span>
                    <span>Videos: {course.watchedVideos}/{course.totalVideos}</span>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mb-3">
                  <span>Last: {course.lastActivity}</span>
                  <span>Score: {course.score}%</span>
                </div>
                <button 
                  onClick={() => openCoursePlaylist(course)}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  Continue Learning
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );

  const renderAnalytics = () => (
    <>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600">Track your learning progress and performance.</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-500">Analytics dashboard coming soon...</p>
      </div>
    </>
  );

  const renderForum = () => (
    <>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Forum</h1>
        <p className="text-gray-600">Participate in course discussions and ask questions.</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-500">Forum feature coming soon...</p>
      </div>
    </>
  );

  const renderAnnouncements = () => {
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const getBorderColor = (type: string) => {
      switch (type) {
        case 'ACADEMIC': return 'border-green-400';
        case 'INFO': return 'border-blue-400';
        default: return 'border-gray-400';
      }
    };

    const getIcon = (senderRole: string) => {
      switch (senderRole) {
        case 'Dean': return '🎓';
        case 'Admin': return '⚡';
        case 'Teacher': return '👨‍🏫';
        default: return '📢';
      }
    };

    return (
      <>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📢 Announcements</h1>
          <p className="text-gray-600">Stay updated with the latest news and important information from your instructors and administration.</p>
        </div>
        
        {announcementsLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : announcements.length > 0 ? (
          <div className="space-y-6">
            {/* Real Announcements from Dean/Admin */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📚 Latest Announcements</h3>
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className={`border-l-4 ${getBorderColor(announcement.type)} pl-4 py-3 bg-gray-50 rounded-r-lg`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg">{getIcon(announcement.sender_role)}</span>
                          <h4 className="font-medium text-gray-900">{announcement.title}</h4>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {announcement.sender_role}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{announcement.content}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>By {announcement.created_by}</span>
                          <span>•</span>
                          <span>{formatDate(announcement.created_at)}</span>
                          <span>•</span>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                            {announcement.target_audience}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* System Information */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-6 rounded-lg shadow">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">!</span>
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-blue-900">System Information</h3>
                  <p className="text-sm text-blue-700">Platform Updates & Features</p>
                </div>
              </div>
              <p className="text-blue-800 mb-3">
                🚀 Welcome to the enhanced LMS platform! We've upgraded our system with new features to improve your learning experience.
              </p>
              <ul className="text-sm text-blue-700 space-y-1 ml-4">
                <li>• Real-time announcements from your instructors</li>
                <li>• Enhanced quiz interface with better feedback</li>
                <li>• New progress tracking dashboard</li>
                <li>• Mobile-responsive design updates</li>
              </ul>
            </div>

            {/* Quick Links */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔗 Quick Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button className="flex items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200">
                  <span className="text-2xl mr-3">📧</span>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Student Support</div>
                    <div className="text-sm text-gray-500">Get help with technical issues</div>
                  </div>
                </button>
                
                <button className="flex items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200">
                  <span className="text-2xl mr-3">📋</span>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Academic Calendar</div>
                    <div className="text-sm text-gray-500">View important dates</div>
                  </div>
                </button>
                
                <button className="flex items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200">
                  <span className="text-2xl mr-3">💬</span>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Student Forum</div>
                    <div className="text-sm text-gray-500">Connect with peers</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-gray-400 text-2xl">📢</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Announcements Yet</h3>
            <p className="text-gray-500">Check back later for updates from your instructors and administration.</p>
          </div>
        )}
      </>
    );
  };

  const renderCertificates = () => (
    <>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Certificates</h1>
        <p className="text-gray-600">View and download your course completion certificates.</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-500">Certificates section coming soon...</p>
      </div>
    </>
  );

  const renderAuthority = () => (
    <>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Authority</h1>
        <p className="text-gray-600">Contact course authorities and administrators.</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-500">Authority contact section coming soon...</p>
      </div>
    </>
  );

  const renderCoursePlaylist = () => {
    if (!selectedCourse) return renderMyCourses();

    return (
      <>
        {/* Header with back button */}
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => setActiveView('my-courses')}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <span className="mr-2">←</span>
            Back to My Courses
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{selectedCourse.name}</h1>
            <p className="text-gray-600">{selectedCourse.section} • {selectedCourse.instructor}</p>
          </div>
        </div>

        {loadingContent ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
          </div>
        ) : courseContent.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <div className="text-gray-400 text-4xl mb-4">📚</div>
            <p className="text-gray-500">No content available for this course yet.</p>
            <p className="text-sm text-gray-400 mt-2">Check back later for new videos and quizzes.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Content Player */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                {currentVideo ? (
                  <div>
                    {/* Video iframe */}
                    <div className="aspect-video">
                      <iframe
                        src={getYouTubeEmbedUrl(currentVideo.video_url)}
                        title={currentVideo.title}
                        className="w-full h-full"
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      ></iframe>
                    </div>
                    
                    {/* Video details */}
                    <div className="p-6">
                      <h2 className="text-xl font-bold text-gray-900 mb-2">{currentVideo.title}</h2>
                      <p className="text-gray-600 mb-4">{currentVideo.description}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <span>Duration: {currentVideo.duration || 'N/A'}</span>
                        <span className="mx-2">•</span>
                        <span>Added: {new Date(currentVideo.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-100 flex items-center justify-center">
                    <p className="text-gray-500">Select content to start learning</p>
                  </div>
                )}
              </div>
            </div>

            {/* Content Playlist */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Course Content</h3>
                  <p className="text-sm text-gray-500">{courseContent.length} items</p>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {courseContent.map((item, index) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (item.type === 'video') {
                          setCurrentVideo(item as Video);
                        } else {
                          openQuiz(item);
                        }
                      }}
                      className={`p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
                        currentVideo?.id === item.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {item.type === 'video' ? (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                              currentVideo?.id === item.id 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                              ▶
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-green-200 text-green-600">
                              📝
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm font-medium truncate ${
                            currentVideo?.id === item.id ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {item.title}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {item.description}
                          </p>
                          <div className="flex items-center mt-2 text-xs text-gray-400">
                            {item.type === 'video' ? (
                              <span>{item.duration || 'N/A'}</span>
                            ) : (
                              <span>{item.questions?.length || 0} questions</span>
                            )}
                            <span className="mx-2">•</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              item.type === 'video' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {item.type === 'video' ? 'Video' : 'Quiz'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quiz Modal */}
        {showQuizModal && currentQuiz && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">{currentQuiz.title}</h2>
                  <button
                    onClick={() => setShowQuizModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✖
                  </button>
                </div>

                {currentQuiz.description && (
                  <p className="text-gray-600 mb-6">{currentQuiz.description}</p>
                )}

                {!quizSubmitted ? (
                  <div className="space-y-6">
                    {currentQuiz.questions?.map((question: any, qIndex: number) => (
                      <div key={qIndex} className="border rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-3">
                          {qIndex + 1}. {question.question}
                        </h3>
                        <div className="space-y-2">
                          {question.options?.map((option: string, oIndex: number) => (
                            <label
                              key={oIndex}
                              className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                            >
                              <input
                                type="radio"
                                name={`question-${qIndex}`}
                                value={oIndex}
                                checked={quizAnswers[qIndex] === oIndex}
                                onChange={() => handleQuizAnswer(qIndex, oIndex)}
                                className="w-4 h-4 text-blue-600"
                              />
                              <span className="text-gray-700">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-end space-x-4 pt-4 border-t">
                      <button
                        onClick={() => setShowQuizModal(false)}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={submitQuiz}
                        disabled={quizAnswers.includes(-1)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        Submit Quiz
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">
                      {quizResult?.percentage >= 80 ? '🎉' : quizResult?.percentage >= 60 ? '👍' : '📚'}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Quiz Completed!</h3>
                    <p className="text-gray-600 mb-4">
                      You scored {quizResult?.correctAnswers} out of {quizResult?.totalQuestions} questions correct
                    </p>
                    <div className="text-3xl font-bold mb-6">
                      <span className={`${
                        quizResult?.percentage >= 80 ? 'text-green-600' : 
                        quizResult?.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {quizResult?.percentage}%
                      </span>
                    </div>
                    <button
                      onClick={() => setShowQuizModal(false)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  const getCurrentView = () => {
    switch (activeView) {
      case 'my-courses':
        return renderMyCourses();
      case 'course-playlist':
        return renderCoursePlaylist();
      case 'announcements':
        return renderAnnouncements();
      case 'analytics':
        return renderAnalytics();
      case 'forum':
        return renderForum();
      case 'certificates':
        return renderCertificates();
      case 'authority':
        return renderAuthority();
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="p-6 space-y-6">
      {getCurrentView()}
    </div>
  );
}
