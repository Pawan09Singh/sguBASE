'use client';

import { useState, useEffect } from 'react';

export default function HODDashboard() {
  const [activeView, setActiveView] = useState('dashboard');

  // Listen for sidebar navigation
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

  if (activeView !== 'dashboard') {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {activeView.charAt(0).toUpperCase() + activeView.slice(1).replace('-', ' ')}
          </h2>
          <p className="text-gray-600">
            This feature is coming soon. Please check back later.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* HOD Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <span className="text-white font-semibold">📚</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Assigned Courses</p>
              <p className="text-2xl font-semibold text-gray-900">8</p>
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
              <p className="text-2xl font-semibold text-gray-900">15</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                <span className="text-white font-semibold">⏳</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
              <p className="text-2xl font-semibold text-gray-900">5</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                <span className="text-white font-semibold">📊</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Performance Score</p>
              <p className="text-2xl font-semibold text-gray-900">87%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Approvals */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Approvals</h3>
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Video Upload Request</h4>
                <p className="text-sm text-gray-500">Introduction to Algorithms - Prof. Smith</p>
                <p className="text-xs text-gray-400">Submitted 2 hours ago</p>
              </div>
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200">
                  Approve
                </button>
                <button className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200">
                  Reject
                </button>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Course Content Update</h4>
                <p className="text-sm text-gray-500">Database Design - Prof. Johnson</p>
                <p className="text-xs text-gray-400">Submitted 5 hours ago</p>
              </div>
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200">
                  Approve
                </button>
                <button className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200">
                  Reject
                </button>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Quiz Creation Request</h4>
                <p className="text-sm text-gray-500">Data Structures - Prof. Williams</p>
                <p className="text-xs text-gray-400">Submitted 1 day ago</p>
              </div>
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200">
                  Approve
                </button>
                <button className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200">
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Management */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Course Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="text-center">
              <span className="text-2xl block mb-2">👨‍🏫</span>
              <span className="text-sm font-medium text-gray-700">Assign Teachers</span>
            </div>
          </button>
          
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="text-center">
              <span className="text-2xl block mb-2">📊</span>
              <span className="text-sm font-medium text-gray-700">View Analytics</span>
            </div>
          </button>
          
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="text-center">
              <span className="text-2xl block mb-2">📢</span>
              <span className="text-sm font-medium text-gray-700">Create Announcement</span>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-xs">✅</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Approved video upload</p>
                <p className="text-xs text-gray-500">Introduction to AI - Prof. Davis</p>
              </div>
            </div>
            <span className="text-xs text-gray-400">1 hour ago</span>
          </div>
          
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xs">👨‍🏫</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">New teacher assigned</p>
                <p className="text-xs text-gray-500">Prof. Anderson to Database Systems</p>
              </div>
            </div>
            <span className="text-xs text-gray-400">3 hours ago</span>
          </div>
        </div>
      </div>
    </div>
  );
}
