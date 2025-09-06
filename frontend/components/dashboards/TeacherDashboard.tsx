'use client';

import { useState, useEffect } from 'react';
import { fetchCourseVideos } from '../../utils/api';

// Custom CSS for line-clamp (since Tailwind might not have it enabled)
const styles = `
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

// Quiz creation modal state and logic
type QuizQuestion = {
  question: string;
  options: string[];
  answer: number; // index of correct option
};

// Type for items in a unit (video or quiz)
type UnitItem = {
  id: string;
  type: 'video' | 'quiz';
  title: string;
  [key: string]: any;
};

interface DashboardStats {
  totalCourses: number;
  totalStudents: number;
  videosUploaded: number;
  avgStudentProgress: number;
}

interface Course {
  id: string;
  name: string;
  section: string;
  students: number;
  progress: number;
  lastActivity: string;
}

interface Section {
  id: string;
  name: string;
  course: string;
  students: number;
  videos: number;
  quizzes: number;
}

export default function TeacherDashboard() {
  // Helper function to extract YouTube video ID from various URL formats
  const getYouTubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length == 11) ? match[2] : null;
  };

  // Helper function to get YouTube thumbnail URL
  const getYouTubeThumbnail = (url: string) => {
    const videoId = getYouTubeVideoId(url);
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    }
    return '/api/placeholder/320/180'; // Fallback placeholder
  };

  // Helper function to play video
  const playVideo = (video: any) => {
    setSelectedVideo(video);
    setShowVideoPlayer(true);
  };

  // Main state variables
  const [activeView, setActiveView] = useState('dashboard');
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    totalStudents: 0,
    videosUploaded: 0,
    avgStudentProgress: 0
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [courseVideos, setCourseVideos] = useState<any[]>([]);

  // Video player state
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);

  // Video Upload states
  const [showVideoUpload, setShowVideoUpload] = useState(false);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'file' | 'youtube'>('file');
  const [youtubeLink, setYoutubeLink] = useState('');

  // Units state: [{ id, name, items: [{id, type, ...}] }]
  const [units, setUnits] = useState<{ id: string; name: string; items: UnitItem[]; }[]>([
    { id: 'unit1', name: 'Unit 1', items: [] }
  ]);
  const [activeUnitId, setActiveUnitId] = useState<string | null>(null);
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);

  // Quiz modal state
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([{
    question: '', options: ['', '', '', ''], answer: 0
  }]);

  // Effects
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (selectedCourseId && token) {
      // Fetch course content (videos and quizzes)
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teacher/courses/${selectedCourseId}/content`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(async response => {
          if (response.ok) {
            const content = await response.json();
            setCourseVideos(content);
          } else {
            setCourseVideos([]);
          }
        })
        .catch(() => setCourseVideos([]));
    } else {
      setCourseVideos([]);
    }
  }, [selectedCourseId]);

  useEffect(() => {
    fetchTeacherData();
  }, []);

  useEffect(() => {
    const handleSidebarClick = (event: any) => {
      const { id } = event.detail;
      setActiveView(id);
    };

    document.addEventListener('sidebarItemClick', handleSidebarClick);
    return () => {
      document.removeEventListener('sidebarItemClick', handleSidebarClick);
    };
  }, []);

  // Sync courseVideos (which now includes quizzes) into units for demo
  useEffect(() => {
    if (courseVideos.length > 0) {
      // Group content by unit_name or put in default unit
      const contentByUnit: { [key: string]: any[] } = {};
      
      courseVideos.forEach(content => {
        const unitName = content.unit_name || 'Unit 1';
        if (!contentByUnit[unitName]) {
          contentByUnit[unitName] = [];
        }
        contentByUnit[unitName].push({
          id: content.id,
          type: content.type,
          title: content.title,
          description: content.description,
          questions: content.questions,
          video_url: content.video_url,
          thumbnail: content.thumbnail,
          duration: content.duration,
          quiz_id: content.quiz_id,
          ...content
        });
      });

      // Create units from the grouped content
      const newUnits = Object.keys(contentByUnit).map((unitName, index) => ({
        id: `unit${index + 1}`,
        name: unitName,
        items: contentByUnit[unitName]
      }));

      // If no content, keep the default empty unit
      if (newUnits.length === 0) {
        setUnits([{ id: 'unit1', name: 'Unit 1', items: [] }]);
      } else {
        setUnits(newUnits);
      }
    }
  }, [courseVideos]);

  // Functions
  const fetchTeacherData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      // Fetch teacher-specific stats
      const statsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teacher/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch teacher's courses
      const coursesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teacher/courses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json();
        setCourses(coursesData);
      }

      // Fetch teacher's sections
      const sectionsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teacher/sections`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (sectionsResponse.ok) {
        const sectionsData = await sectionsResponse.json();
        setSections(sectionsData);
        
        // Auto-select first section if none selected
        if (sectionsData.length > 0 && !selectedCourseId) {
          setSelectedCourseId(sectionsData[0].courseId);
        }
      }

    } catch (error) {
      console.error('Error fetching teacher data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Unit management handlers
  const handleAddUnit = () => {
    const newUnitNum = units.length + 1;
    setUnits([
      ...units,
      { id: `unit${newUnitNum}`, name: `Unit ${newUnitNum}`, items: [] },
    ]);
  };

  const handleAddQuizVideo = (unitId: string) => {
    setActiveUnitId(unitId);
    setShowAddTypeModal(true);
  };

  const handleChooseType = (type: 'video' | 'quiz') => {
    setShowAddTypeModal(false);
    if (type === 'video') {
      setShowVideoUpload(true);
    } else {
      setShowQuizModal(true);
    }
  };

  // Quiz creation handlers
  const handleQuizQuestionChange = (idx: number, field: 'question' | 'option' | 'answer', value: string | number, optIdx?: number) => {
    setQuizQuestions(qs => qs.map((q, i) => {
      if (i !== idx) return q;
      if (field === 'question') return { ...q, question: value as string };
      if (field === 'option' && typeof optIdx === 'number') {
        const newOpts = [...q.options];
        newOpts[optIdx] = value as string;
        return { ...q, options: newOpts };
      }
      if (field === 'answer') return { ...q, answer: value as number };
      return q;
    }));
  };

  const handleAddQuizQuestion = () => {
    setQuizQuestions(qs => [...qs, { question: '', options: ['', '', '', ''], answer: 0 }]);
  };

  const handleRemoveQuizQuestion = (idx: number) => {
    setQuizQuestions(qs => qs.length > 1 ? qs.filter((_, i) => i !== idx) : qs);
  };

  const handleQuizCreate = () => {
    if (!activeUnitId) return;
    const quiz: UnitItem = {
      id: 'quiz_' + Date.now(),
      type: 'quiz' as const,
      title: quizTitle,
      description: quizDescription,
      questions: quizQuestions
    };
    setUnits(units => units.map(u =>
      u.id === activeUnitId ? { ...u, items: [...u.items, quiz] } : u
    ));
    setShowQuizModal(false);
    setActiveUnitId(null);
    setQuizTitle('');
    setQuizDescription('');
    setQuizQuestions([{ question: '', options: ['', '', '', ''], answer: 0 }]);
    // Call API to save quiz (stub)
    saveQuizToBackend(quiz, activeUnitId);
  };

  // API stubs for backend integration
  const saveQuizToBackend = async (quiz: any, unitId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token || !selectedCourseId) {
        console.error('No token or course selected');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teacher/create-quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: quiz.title,
          description: quiz.description,
          course_id: selectedCourseId,
          questions: quiz.questions,
          unit_id: unitId,
          unit_name: units.find(u => u.id === unitId)?.name
        })
      });

      if (response.ok) {
        // Instead of updating local state, refetch the playlist from backend
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teacher/courses/${selectedCourseId}/content`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
          .then(async response => {
            if (response.ok) {
              const content = await response.json();
              setCourseVideos(content);
            } else {
              setCourseVideos([]);
            }
          })
          .catch(() => setCourseVideos([]));
      } else {
        console.error('Failed to save quiz:', await response.text());
      }
    } catch (error) {
      console.error('Error saving quiz:', error);
    }
  };

  const saveVideoToBackend = async (video: any, unitId: string) => {
    console.log('Saving video to backend:', video, unitId);
  };

  const handleVideoUploadComplete = (video: any) => {
    if (!activeUnitId) return;
    setUnits(units => units.map(u =>
      u.id === activeUnitId
        ? { ...u, items: [...u.items, { id: video.id, type: 'video' as const, title: video.title, ...video }] }
        : u
    ));
    saveVideoToBackend(video, activeUnitId);
    setActiveUnitId(null);
  };

  const handleVideoUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedCourseId || !videoTitle.trim()) {
      alert('Please select a course and enter a video title');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        alert('No authentication token found');
        return;
      }

      let videoData: any;

      if (uploadMode === 'youtube') {
        videoData = {
          title: videoTitle,
          description: videoDescription,
          video_url: youtubeLink,
          course_id: selectedCourseId
        };
      } else {
        alert('File upload feature coming soon!');
        return;
      }

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teacher/upload-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(videoData)
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const result = await response.json();
        const updatedVideos = await fetchCourseVideos(selectedCourseId, token);
        setCourseVideos(updatedVideos);
        
        setVideoTitle('');
        setVideoDescription('');
        setYoutubeLink('');
        setShowVideoUpload(false);
        
        alert('Video uploaded successfully!');
        
        if (activeUnitId) {
          handleVideoUploadComplete(result.video);
        }
      } else {
        const error = await response.json();
        alert(`Upload failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Render functions
  const renderDashboardView = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">📚</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Courses
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalCourses}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">👥</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Students
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalStudents}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">🎥</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Videos Uploaded
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.videosUploaded}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">📊</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Avg. Progress
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.avgStudentProgress}%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">My Course Sections</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Section
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Students
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg. Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Activity
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {courses.map((course) => (
                  <tr key={course.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {course.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.students}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{width: `${course.progress}%`}}></div>
                      </div>
                      <span className="text-xs text-gray-600">{course.progress}%</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">85%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.lastActivity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderMyCoursesView = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">My Courses</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section) => (
            <div key={section.id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-2">{section.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{section.course}</p>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Students:</span>
                  <span className="font-medium">{section.students}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Videos:</span>
                  <span className="font-medium">{section.videos}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Quizzes:</span>
                  <span className="font-medium">{section.quizzes}</span>
                </div>
              </div>
              
              <button
                onClick={() => {
                  setSelectedSection(section.id);
                  setSelectedCourseId((section as any).courseId);
                  setActiveView('video-quiz-management');
                }}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Manage Content
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderVideoQuizManagement = () => {
    const currentSection = sections.find(s => s.id === selectedSection);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Playlist</h2>
            {currentSection && (
              <p className="text-gray-600">{currentSection.name} - {currentSection.course}</p>
            )}
          </div>
        </div>

        <div className="space-y-8">
          {units.map((unit, idx) => (
            <div key={unit.id} className="border rounded-lg p-4">
              <div className="font-semibold mb-4 text-lg">{unit.name}:</div>
              <div className="space-y-4 mb-4">
                {unit.items.length === 0 && <div className="text-gray-400">No items yet.</div>}
                {unit.items.map(item => (
                  <div key={item.id} className="ml-4">
                    {item.type === 'video' ? (
                      <div className="flex items-start space-x-4 p-3 border rounded-lg hover:bg-gray-50">
                        {/* Video Thumbnail */}
                        <div className="flex-shrink-0">
                          <div 
                            className="relative w-40 h-24 bg-gray-200 rounded-lg overflow-hidden cursor-pointer group"
                            onClick={() => playVideo(item)}
                          >
                            {item.video_url && getYouTubeVideoId(item.video_url) ? (
                              <img 
                                src={getYouTubeThumbnail(item.video_url)}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-300">
                                <span className="text-gray-500 text-2xl">🎬</span>
                              </div>
                            )}
                            {/* Play button overlay */}
                            <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <div className="bg-white bg-opacity-90 rounded-full p-2">
                                <svg className="w-6 h-6 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.68L9.54 5.98C8.87 5.55 8 6.03 8 6.82z"/>
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Video Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{item.title}</h4>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                              🎬 Video
                            </span>
                            <button 
                              onClick={() => playVideo(item)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Watch Now
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start space-x-4 p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex-shrink-0">
                          <div className="w-40 h-24 bg-green-100 rounded-lg flex items-center justify-center">
                            <span className="text-green-600 text-2xl">📝</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{item.title}</h4>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                              📝 Quiz
                            </span>
                            <span className="text-sm text-gray-500">
                              {item.questions?.length || 0} Questions
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button
                className="border px-4 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors"
                onClick={() => handleAddQuizVideo(unit.id)}
              >
                + Add Quiz/Video
              </button>
            </div>
          ))}
        </div>
        <button
          className="mt-4 text-blue-600 hover:underline text-sm"
          onClick={handleAddUnit}
        >
          add unit
        </button>

        {/* Modal to choose between video or quiz */}
        {showAddTypeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs relative">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowAddTypeModal(false)}
              >✖</button>
              <h3 className="text-lg font-semibold mb-4">Add to Playlist</h3>
              <div className="flex flex-col gap-3">
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  onClick={() => handleChooseType('video')}
                >Add Video</button>
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  onClick={() => handleChooseType('quiz')}
                >Add Quiz</button>
              </div>
            </div>
          </div>
        )}

        {/* Quiz Creation Modal */}
        {showQuizModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowQuizModal(false)}
              >✖</button>
              <h3 className="text-lg font-semibold mb-4">Create Quiz</h3>
              <div className="space-y-3">
                <input
                  className="w-full border px-3 py-2 rounded mb-2"
                  placeholder="Quiz Title"
                  value={quizTitle}
                  onChange={e => setQuizTitle(e.target.value)}
                />
                <textarea
                  className="w-full border px-3 py-2 rounded mb-2"
                  placeholder="Quiz Description"
                  value={quizDescription}
                  onChange={e => setQuizDescription(e.target.value)}
                  rows={2}
                />
                {quizQuestions.map((q, idx) => (
                  <div key={idx} className="border rounded p-2 mb-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold">Q{idx + 1}</span>
                      <button className="text-xs text-red-500" onClick={() => handleRemoveQuizQuestion(idx)} disabled={quizQuestions.length === 1}>Remove</button>
                    </div>
                    <input
                      className="w-full border px-2 py-1 rounded mb-1"
                      placeholder="Question"
                      value={q.question}
                      onChange={e => handleQuizQuestionChange(idx, 'question', e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-2 mb-1">
                      {q.options.map((opt, oidx) => (
                        <input
                          key={oidx}
                          className="border px-2 py-1 rounded"
                          placeholder={`Option ${oidx + 1}`}
                          value={opt}
                          onChange={e => handleQuizQuestionChange(idx, 'option', e.target.value, oidx)}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs">Correct:</span>
                      <select
                        value={q.answer}
                        onChange={e => handleQuizQuestionChange(idx, 'answer', Number(e.target.value))}
                        className="border rounded px-2 py-1 text-xs"
                      >
                        {q.options.map((_, oidx) => (
                          <option key={oidx} value={oidx}>{String.fromCharCode(65 + oidx)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
                <button className="text-blue-600 text-xs hover:underline" onClick={handleAddQuizQuestion}>+ Add Question</button>
                <button
                  className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mt-2"
                  onClick={handleQuizCreate}
                >Create Quiz</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSectionReports = () => {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Section Reports</h2>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-center py-8 text-gray-500">
            <p>Section performance reports and analytics will be displayed here.</p>
          </div>
        </div>
      </div>
    );
  };

  const renderAnalytics = () => {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-center py-8 text-gray-500">
            <p>Student performance analytics and insights will be displayed here.</p>
          </div>
        </div>
      </div>
    );
  };

  const renderAnnouncements = () => {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Announcements</h2>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-center py-8 text-gray-500">
            <p>Create and manage announcements for your students.</p>
          </div>
        </div>
      </div>
    );
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'my-courses':
        return renderMyCoursesView();
      case 'dashboard':
        return renderDashboardView();
      case 'video-quiz-management':
        return renderVideoQuizManagement();
      case 'section-reports':
        return renderSectionReports();
      case 'analytics':
        return renderAnalytics();
      case 'announcements':
        return renderAnnouncements();
      default:
        return renderDashboardView();
    }
  };

  return (
    <div className="p-6">
      {/* Custom Styles */}
      <style jsx>{styles}</style>
      
      {showVideoUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowVideoUpload(false)}
            >
              ✖
            </button>
            <h3 className="text-lg font-semibold mb-4">Upload Video</h3>
            <form onSubmit={handleVideoUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={videoTitle}
                  onChange={e => setVideoTitle(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={videoDescription}
                  onChange={e => setVideoDescription(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Upload Mode</label>
                <select
                  value={uploadMode}
                  onChange={e => setUploadMode(e.target.value as 'file' | 'youtube')}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="file">File Upload</option>
                  <option value="youtube">YouTube Link</option>
                </select>
              </div>
              {uploadMode === 'youtube' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">YouTube Link</label>
                  <input
                    type="url"
                    value={youtubeLink}
                    onChange={e => setYoutubeLink(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required={uploadMode === 'youtube'}
                  />
                </div>
              )}
              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  disabled={isUploading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Uploading...' : uploadMode === 'youtube' ? 'Upload Link' : 'Upload Video'}
                </button>
                {isUploading && (
                  <div className="ml-4 w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Video Player Modal */}
      {showVideoPlayer && selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl mx-4 relative">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10 bg-white rounded-full p-2"
              onClick={() => {
                setShowVideoPlayer(false);
                setSelectedVideo(null);
              }}
            >
              ✖
            </button>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">{selectedVideo.title}</h3>
              
              {/* Video Player */}
              <div className="aspect-w-16 aspect-h-9 mb-4">
                {selectedVideo.video_url && getYouTubeVideoId(selectedVideo.video_url) ? (
                  <iframe
                    className="w-full h-96 rounded-lg"
                    src={`https://www.youtube.com/embed/${getYouTubeVideoId(selectedVideo.video_url)}?autoplay=1`}
                    title={selectedVideo.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                ) : (
                  <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl mb-4">🎬</div>
                      <p className="text-gray-600">Video player not available</p>
                      <p className="text-sm text-gray-500 mt-2">Please check the video URL</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Video Description */}
              {selectedVideo.description && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">{selectedVideo.description}</p>
                </div>
              )}
              
              {/* Video Details */}
              <div className="mt-4 pt-4 border-t">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Duration:</span>
                    <span className="ml-2 text-gray-800">{selectedVideo.duration || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Views:</span>
                    <span className="ml-2 text-gray-800">{selectedVideo.views || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {renderActiveView()}
    </div>
  );
}