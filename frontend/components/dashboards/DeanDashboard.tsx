'use client';

import { useState, useEffect } from 'react';
import CreateCourseModal from '../modals/CreateCourseModal';
import ManageCoursesModal from '../modals/ManageCoursesModal';
import AddTeacherModal from '../modals/AddTeacherModal';
import ViewAnalyticsModal from '../modals/ViewAnalyticsModal';
import ViewLogsModal from '../modals/ViewLogsModal';
import AnnouncementsModal from '../modals/AnnouncementsModal';

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

interface Department {
  id: string;
  dept_name: string;
  dean_id: string;
}

export default function DeanDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    totalTeachers: 0,
    totalStudents: 0,
    pendingApprovals: 0
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [showManageCourses, setShowManageCourses] = useState(false);
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

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
          setShowManageCourses(false);
          setShowAddTeacher(false);
          setShowAnalytics(false);
          setShowAnnouncements(false);
          setShowLogs(false);
          break;
        case 'manage-courses':
          setShowManageCourses(true);
          setShowCreateCourse(false);
          setShowAddTeacher(false);
          setShowAnalytics(false);
          setShowAnnouncements(false);
          setShowLogs(false);
          break;
        case 'create-teacher':
          setShowAddTeacher(true);
          setShowCreateCourse(false);
          setShowManageCourses(false);
          setShowAnalytics(false);
          setShowAnnouncements(false);
          setShowLogs(false);
          break;
        case 'analytics':
          setShowAnalytics(true);
          setShowCreateCourse(false);
          setShowManageCourses(false);
          setShowAddTeacher(false);
          setShowAnnouncements(false);
          setShowLogs(false);
          break;
        case 'logs':
          setShowLogs(true);
          setShowCreateCourse(false);
          setShowManageCourses(false);
          setShowAddTeacher(false);
          setShowAnalytics(false);
          setShowAnnouncements(false);
          break;
        case 'announcements':
          setShowAnnouncements(true);
          setShowCreateCourse(false);
          setShowManageCourses(false);
          setShowAddTeacher(false);
          setShowAnalytics(false);
          setShowLogs(false);
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
      if (!token) return;

      // Fetch dean-specific stats
      const statsResponse = await fetch('/api/dean/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch dean's departments (only departments they are assigned to)
      const deptResponse = await fetch('/api/dean/departments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (deptResponse.ok) {
        const deptData = await deptResponse.json();
        setDepartments(deptData);
      }

      // Fetch dean's courses (only from their departments)
      const coursesResponse = await fetch('/api/dean/courses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json();
        setCourses(coursesData);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-md">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Courses</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalCourses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-md">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Teachers</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalTeachers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-md">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalStudents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-md">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pendingApprovals}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <button
          onClick={() => setShowCreateCourse(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg flex items-center space-x-2 transition duration-200"
        >
          <span>📚</span>
          <span>Create Course</span>
        </button>

        <button
          onClick={() => setShowManageCourses(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg flex items-center space-x-2 transition duration-200"
        >
          <span>📖</span>
          <span>Manage Courses</span>
        </button>

        <button
          onClick={() => setShowAddTeacher(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg flex items-center space-x-2 transition duration-200"
        >
          <span>👨‍🏫</span>
          <span>Add Teacher</span>
        </button>

        <button
          onClick={() => setShowAnalytics(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg flex items-center space-x-2 transition duration-200"
        >
          <span>📊</span>
          <span>View Analytics</span>
        </button>

        <button
          onClick={() => setShowAnnouncements(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg flex items-center space-x-2 transition duration-200"
        >
          <span>📢</span>
          <span>Announcements</span>
        </button>

        <button
          onClick={() => setShowLogs(true)}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg flex items-center space-x-2 transition duration-200"
        >
          <span>📋</span>
          <span>View Logs</span>
        </button>
      </div>

      {/* My Departments */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">My Departments</h2>
          <p className="text-sm text-gray-600">Departments you are assigned as Dean</p>
        </div>
        <div className="p-6">
          {departments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No departments assigned</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map((dept) => (
                <div key={dept.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition duration-200">
                  <h3 className="font-semibold text-gray-900">{dept.dept_name}</h3>
                  <p className="text-sm text-gray-600 mt-1">Department ID: {dept.id}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Courses */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Courses</h2>
          <p className="text-sm text-gray-600">Courses in your departments</p>
        </div>
        <div className="overflow-x-auto">
          {courses.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No courses found</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sections</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{course.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.sections}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.students}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        course.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800'
                          : course.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {course.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(course.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateCourse && (
        <CreateCourseModal
          isOpen={showCreateCourse}
          departments={departments}
          onClose={() => setShowCreateCourse(false)}
          onCourseCreated={refreshData}
        />
      )}

      {showManageCourses && (
        <ManageCoursesModal
          onClose={() => setShowManageCourses(false)}
        />
      )}

      {showAddTeacher && (
        <AddTeacherModal
          isOpen={showAddTeacher}
          onClose={() => setShowAddTeacher(false)}
          onTeacherAdded={refreshData}
        />
      )}

      {showAnalytics && (
        <ViewAnalyticsModal
          isOpen={showAnalytics}
          onClose={() => setShowAnalytics(false)}
          stats={stats}
        />
      )}

      {showAnnouncements && (
        <AnnouncementsModal
          onClose={() => setShowAnnouncements(false)}
        />
      )}

      {showLogs && (
        <ViewLogsModal
          isOpen={showLogs}
          onClose={() => setShowLogs(false)}
        />
      )}
    </div>
  );
}
