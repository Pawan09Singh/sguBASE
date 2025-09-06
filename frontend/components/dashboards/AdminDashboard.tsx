'use client';

import { useState, useEffect } from 'react';
import RoleSwitcher from '../RoleSwitcher';
import { useRouter } from 'next/navigation';
import CreateCourseModal from '../modals/CreateCourseModal';
import AddTeacherModal from '../modals/AddTeacherModal';
import ViewAnalyticsModal from '../modals/ViewAnalyticsModal';
import ViewLogsModal from '../modals/ViewLogsModal';
import DeanManageCoursesModal from '../modals/DeanManageCoursesModal';
import AdminAnnouncementsModal from '../modals/AdminAnnouncementsModal';

interface DashboardStats {
  totalCourses: number;
  totalTeachers: number;
  totalStudents: number;
  pendingApprovals: number;
}

interface Course {
  id: string;
  name: string;
  department: string;
  sections: number;
  students: number;
  teachers: number;
  status: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [roles, setRoles] = useState<string[]>([]);
  const [currentRole, setCurrentRole] = useState('ADMIN');
  const router = useRouter();

  useEffect(() => {
    // Example: roles stored in localStorage as comma-separated string
    const storedRoles = localStorage.getItem('roles');
    if (storedRoles) {
      const parsed = storedRoles.split(',').map(r => r.trim()).filter(Boolean);
      setRoles(parsed);
      if (parsed.includes(currentRole)) setCurrentRole(currentRole);
      else if (parsed.length > 0) setCurrentRole(parsed[0]);
    }
  }, []);

  const handleRoleSwitch = (role: string) => {
    setCurrentRole(role);
    // Redirect to the correct dashboard for the selected role
    switch (role) {
      case 'ADMIN': router.push('/admin/dashboard'); break;
      case 'HOD': router.push('/hod/dashboard'); break;
      case 'CC': router.push('/cc/dashboard'); break;
      case 'TEACHER': router.push('/teacher/dashboard'); break;
      default: break;
    }
  };

  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    totalTeachers: 0,
    totalStudents: 0,
    pendingApprovals: 0
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showManageCourses, setShowManageCourses] = useState(false);
  const [showAnnouncements, setShowAnnouncements] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Listen for sidebar navigation
  useEffect(() => {
    const handleSidebarClick = (event: any) => {
      const { id } = event.detail;
      switch (id) {
        case 'dashboard':
          setShowCreateCourse(false);
          setShowAddTeacher(false);
          setShowAnalytics(false);
          setShowLogs(false);
          setShowManageCourses(false);
          setShowAnnouncements(false);
          break;
        case 'manage-courses':
          setShowManageCourses(true);
          setShowCreateCourse(false);
          setShowAddTeacher(false);
          setShowAnalytics(false);
          setShowLogs(false);
          setShowAnnouncements(false);
          break;
        case 'create-teacher':
          setShowAddTeacher(true);
          setShowCreateCourse(false);
          setShowManageCourses(false);
          setShowAnalytics(false);
          setShowLogs(false);
          setShowAnnouncements(false);
          break;
        case 'analytics':
          setShowAnalytics(true);
          setShowCreateCourse(false);
          setShowAddTeacher(false);
          setShowManageCourses(false);
          setShowLogs(false);
          setShowAnnouncements(false);
          break;
        case 'logs':
          setShowLogs(true);
          setShowCreateCourse(false);
          setShowAddTeacher(false);
          setShowAnalytics(false);
          setShowManageCourses(false);
          setShowAnnouncements(false);
          break;
        case 'announcements':
          setShowAnnouncements(true);
          setShowCreateCourse(false);
          setShowAddTeacher(false);
          setShowAnalytics(false);
          setShowLogs(false);
          setShowManageCourses(false);
          break;
        default:
          break;
      }
    };

    document.addEventListener('sidebarItemClick', handleSidebarClick);
    return () => {
      document.removeEventListener('sidebarItemClick', handleSidebarClick);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = {
        'Authorization': `Bearer ${token}`
      };

      // Fetch stats
      const statsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dean/stats`, { headers });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch courses
      const coursesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dean/courses`, { headers });
      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json();
        setCourses(coursesData);
      }

      // Fetch departments
      const deptsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dean/departments`, { headers });
      if (deptsResponse.ok) {
        const deptsData = await deptsResponse.json();
        setDepartments(deptsData);
      }

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseCreated = () => {
    fetchDashboardData(); // Refresh data
  };

  const handleTeacherAdded = () => {
    fetchDashboardData(); // Refresh data
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-4 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="mb-2">
        <RoleSwitcher roles={roles} currentRole={currentRole} onSwitch={handleRoleSwitch} />
      </div>
      {/* Dean Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <span className="text-white font-semibold">📚</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Courses</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalCourses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <span className="text-white font-semibold">👨‍🏫</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Teachers</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalTeachers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                <span className="text-white font-semibold">👨‍🎓</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Students</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalStudents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                <span className="text-white font-semibold">⏳</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pendingApprovals}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Dean Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button 
            onClick={() => setShowCreateCourse(true)}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="text-center">
              <span className="text-2xl block mb-2">📚</span>
              <span className="text-sm font-medium text-gray-700">Create Course</span>
            </div>
          </button>
          
          <button 
            onClick={() => setShowAddTeacher(true)}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="text-center">
              <span className="text-2xl block mb-2">👨‍🏫</span>
              <span className="text-sm font-medium text-gray-700">Add Teacher</span>
            </div>
          </button>

          <button 
            onClick={() => setShowManageCourses(true)}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="text-center">
              <span className="text-2xl block mb-2">🎓</span>
              <span className="text-sm font-medium text-gray-700">Manage Courses</span>
            </div>
          </button>

          <button 
            onClick={() => setShowAnnouncements(true)}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="text-center">
              <span className="text-2xl block mb-2">📢</span>
              <span className="text-sm font-medium text-gray-700">Announcements</span>
            </div>
          </button>
          
          <button 
            onClick={() => setShowAnalytics(true)}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="text-center">
              <span className="text-2xl block mb-2">📊</span>
              <span className="text-sm font-medium text-gray-700">View Analytics</span>
            </div>
          </button>
          
          <button 
            onClick={() => setShowLogs(true)}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="text-center">
              <span className="text-2xl block mb-2">📋</span>
              <span className="text-sm font-medium text-gray-700">View Logs</span>
            </div>
          </button>
        </div>
      </div>

      {/* Course Overview */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Course Overview</h3>
          <button
            onClick={() => setShowCreateCourse(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            Add New Course
          </button>
        </div>
        
        {courses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No courses found. Create your first course to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sections
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Students
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {course.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {course.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {course.sections}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {course.students}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        course.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                        course.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {course.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateCourseModal
        isOpen={showCreateCourse}
        onClose={() => setShowCreateCourse(false)}
        onCourseCreated={handleCourseCreated}
        departments={departments}
      />

      <AddTeacherModal
        isOpen={showAddTeacher}
        onClose={() => setShowAddTeacher(false)}
        onTeacherAdded={handleTeacherAdded}
      />

      <ViewAnalyticsModal
        isOpen={showAnalytics}
        onClose={() => setShowAnalytics(false)}
        stats={stats}
      />

      <ViewLogsModal
        isOpen={showLogs}
        onClose={() => setShowLogs(false)}
      />

      <DeanManageCoursesModal
        isOpen={showManageCourses}
        onClose={() => setShowManageCourses(false)}
      />

      <AdminAnnouncementsModal
        isOpen={showAnnouncements}
        onClose={() => setShowAnnouncements(false)}
      />
    </div>
  );
}
