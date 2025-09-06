'use client';

import { useState, useEffect } from 'react';

export default function CCDashboard() {
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
      {/* CC Dashboard Stats */}
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
              <p className="text-2xl font-semibold text-gray-900">3</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <span className="text-white font-semibold">👨‍🎓</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Students</p>
              <p className="text-2xl font-semibold text-gray-900">156</p>
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
              <p className="text-sm font-medium text-gray-500">Completion Rate</p>
              <p className="text-2xl font-semibold text-gray-900">78%</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                <span className="text-white font-semibold">🎥</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Videos</p>
              <p className="text-2xl font-semibold text-gray-900">45</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section Management */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Section Management</h3>
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Data Structures - Section A</h4>
                <p className="text-sm text-gray-500">52 students enrolled</p>
              </div>
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200">
                  Manage
                </button>
                <button className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200">
                  Add Students
                </button>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Completion: 75% | Average Score: 82%
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Database Systems - Section B</h4>
                <p className="text-sm text-gray-500">48 students enrolled</p>
              </div>
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200">
                  Manage
                </button>
                <button className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200">
                  Add Students
                </button>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Completion: 68% | Average Score: 79%
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Web Development - Section C</h4>
                <p className="text-sm text-gray-500">56 students enrolled</p>
              </div>
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200">
                  Manage
                </button>
                <button className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200">
                  Add Students
                </button>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Completion: 85% | Average Score: 88%
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="text-center">
              <span className="text-2xl block mb-2">👨‍🎓</span>
              <span className="text-sm font-medium text-gray-700">Add Students (CSV)</span>
            </div>
          </button>
          
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="text-center">
              <span className="text-2xl block mb-2">📋</span>
              <span className="text-sm font-medium text-gray-700">Manage Playlist</span>
            </div>
          </button>
          
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="text-center">
              <span className="text-2xl block mb-2">📢</span>
              <span className="text-sm font-medium text-gray-700">Create Announcement</span>
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
              <span className="text-2xl block mb-2">👑</span>
              <span className="text-sm font-medium text-gray-700">View Authority</span>
            </div>
          </button>
        </div>
      </div>

      {/* Course Analytics */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Course Analytics</h3>
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
                  Completion %
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Section A
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">52</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">75%</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">82%</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    On Track
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Section B
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">48</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">68%</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">79%</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    Needs Attention
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Section C
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">56</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">85%</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">88%</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Excellent
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
