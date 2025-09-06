'use client';

import { useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  uid: string;
  roles: string[];
  defaultDashboard: string;
}

interface SidebarProps {
  user: User;
  currentRole: string;
  onRoleSwitch: (role: string) => void;
  onLogout: () => void;
}

export default function Sidebar({ user, currentRole, onRoleSwitch, onLogout }: SidebarProps) {
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const getSidebarItems = () => {
    const baseItems = [
      { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    ];

    switch (currentRole) {
      case 'SUPERADMIN':
        return [
          ...baseItems,
          { id: 'manage-department', label: 'Manage Department', icon: '🏢' },
          { id: 'manage-users', label: 'Manage Users', icon: '👥' },
          { id: 'logs', label: 'Logs', icon: '📋' },
          { id: 'manage-access', label: 'Manage Access', icon: '🔐' },
          { id: 'direct-login', label: 'Direct Login', icon: '🔑' },
        ];
      case 'ADMIN':
        return [
          ...baseItems,
          { id: 'manage-courses', label: 'Manage Courses', icon: '📚' },
          { id: 'create-teacher', label: 'Create Teacher', icon: '👨‍🏫' },
          { id: 'analytics', label: 'Analytics', icon: '📊' },
          { id: 'logs', label: 'Logs', icon: '📋' },
          { id: 'announcements', label: 'Announcements', icon: '📢' },
        ];
      case 'DEAN':
        return [
          ...baseItems,
          { id: 'manage-courses', label: 'Manage Courses', icon: '📚' },
          { id: 'create-teacher', label: 'Create Teacher', icon: '👨‍🏫' },
          { id: 'analytics', label: 'Analytics', icon: '📊' },
          { id: 'logs', label: 'Logs', icon: '📋' },
          { id: 'announcements', label: 'Announcements', icon: '📢' },
        ];
      case 'HOD':
        return [
          ...baseItems,
          { id: 'courses', label: 'Courses', icon: '📚' },
          { id: 'manage-teachers', label: 'Manage Teachers', icon: '👨‍🏫' },
          { id: 'pending-approvals', label: 'Pending Approvals', icon: '⏳' },
          { id: 'analytics', label: 'Analytics', icon: '📊' },
          { id: 'logs', label: 'Logs', icon: '📋' },
          { id: 'authority', label: 'Authority', icon: '👑' },
          { id: 'announcements', label: 'Announcements', icon: '📢' },
        ];
      case 'CC':
        return [
          ...baseItems,
          { id: 'courses', label: 'Courses', icon: '📚' },
          { id: 'analytics', label: 'Analytics', icon: '📊' },
          { id: 'announcements', label: 'Announcements', icon: '📢' },
          { id: 'authority', label: 'Authority', icon: '👑' },
        ];
      case 'TEACHER':
        return [
          ...baseItems,
          { id: 'my-courses', label: 'My Courses', icon: '📚' },
          { id: 'section-reports', label: 'Section Reports', icon: '📈' },
          { id: 'video-quiz-management', label: 'Video/Quiz Management', icon: '🎥' },
          { id: 'analytics', label: 'Analytics', icon: '📊' },
          { id: 'announcements', label: 'Announcements', icon: '📢' },
        ];
      case 'STUDENT':
        return [
          ...baseItems,
          { id: 'my-courses', label: 'My Courses', icon: '📚' },
          { id: 'announcements', label: 'Announcements', icon: '📢' },
          { id: 'analytics', label: 'Analytics', icon: '📊' },
          { id: 'forum', label: 'Forum', icon: '💬' },
          { id: 'certificates', label: 'Certificates', icon: '🏆' },
          { id: 'authority', label: 'Authority', icon: '👑' },
        ];
      default:
        return baseItems;
    }
  };

  const sidebarItems = getSidebarItems();

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">University LMS</h2>
      </div>

      {/* User Info & Role Switcher */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        </div>

        {/* Role Switcher */}
        {user.roles.length > 1 && (
          <div className="relative">
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="w-full text-left px-3 py-2 text-sm bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              <span className="font-medium">Role: </span>
              {currentRole}
              <span className="float-right">▼</span>
            </button>
            
            {showRoleDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                {user.roles.map((role) => (
                  <button
                    key={role}
                    onClick={() => {
                      onRoleSwitch(role);
                      setShowRoleDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                      role === currentRole ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {sidebarItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              // Dispatch custom event for dashboard components to listen to
              const event = new CustomEvent('sidebarItemClick', { 
                detail: { id: item.id, label: item.label } 
              });
              document.dispatchEvent(event);
            }}
            className="w-full text-left px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors flex items-center space-x-3"
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onLogout}
          className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors flex items-center space-x-3"
        >
          <span className="text-lg">🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
