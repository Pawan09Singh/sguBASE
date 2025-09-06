'use client';

import { useState, useEffect } from 'react';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  isSystemLevel: boolean;
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  level: number;
  permissions: string[];
  userCount: number;
  isSystemRole: boolean;
}

export default function AccessManagementPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions'>('roles');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  useEffect(() => {
    // Mock data for now - replace with actual API call
    const mockPermissions: Permission[] = [
      { id: '1', name: 'CREATE_USER', description: 'Create new users', category: 'User Management', isSystemLevel: true },
      { id: '2', name: 'EDIT_USER', description: 'Edit user information', category: 'User Management', isSystemLevel: true },
      { id: '3', name: 'DELETE_USER', description: 'Delete users', category: 'User Management', isSystemLevel: true },
      { id: '4', name: 'VIEW_USERS', description: 'View user list', category: 'User Management', isSystemLevel: false },
      { id: '5', name: 'CREATE_DEPARTMENT', description: 'Create departments', category: 'Department Management', isSystemLevel: true },
      { id: '6', name: 'EDIT_DEPARTMENT', description: 'Edit departments', category: 'Department Management', isSystemLevel: true },
      { id: '7', name: 'VIEW_DEPARTMENTS', description: 'View departments', category: 'Department Management', isSystemLevel: false },
      { id: '8', name: 'CREATE_COURSE', description: 'Create courses', category: 'Course Management', isSystemLevel: false },
      { id: '9', name: 'EDIT_COURSE', description: 'Edit courses', category: 'Course Management', isSystemLevel: false },
      { id: '10', name: 'VIEW_COURSES', description: 'View courses', category: 'Course Management', isSystemLevel: false },
      { id: '11', name: 'UPLOAD_CONTENT', description: 'Upload course content', category: 'Content Management', isSystemLevel: false },
      { id: '12', name: 'APPROVE_CONTENT', description: 'Approve course content', category: 'Content Management', isSystemLevel: false },
      { id: '13', name: 'VIEW_ANALYTICS', description: 'View system analytics', category: 'Analytics', isSystemLevel: false },
      { id: '14', name: 'VIEW_LOGS', description: 'View system logs', category: 'System', isSystemLevel: true },
      { id: '15', name: 'MANAGE_PERMISSIONS', description: 'Manage role permissions', category: 'System', isSystemLevel: true }
    ];

    const mockRoles: Role[] = [
      {
        id: '1',
        name: 'SUPERADMIN',
        displayName: 'Super Administrator',
        description: 'Full system access with all permissions',
        level: 1,
        permissions: mockPermissions.map(p => p.id),
        userCount: 1,
        isSystemRole: true
      },
      {
        id: '2',
        name: 'ADMIN',
        displayName: 'Administrator (Dean)',
        description: 'Department-level administration',
        level: 2,
        permissions: ['1', '2', '4', '5', '6', '7', '8', '9', '10', '13'],
        userCount: 5,
        isSystemRole: true
      },
      {
        id: '3',
        name: 'HOD',
        displayName: 'Head of Department',
        description: 'Department head with course oversight',
        level: 3,
        permissions: ['4', '7', '8', '9', '10', '12', '13'],
        userCount: 12,
        isSystemRole: true
      },
      {
        id: '4',
        name: 'CC',
        displayName: 'Course Coordinator',
        description: 'Course coordination and management',
        level: 4,
        permissions: ['4', '7', '9', '10', '11', '13'],
        userCount: 25,
        isSystemRole: true
      },
      {
        id: '5',
        name: 'TEACHER',
        displayName: 'Teacher',
        description: 'Content creation and student monitoring',
        level: 5,
        permissions: ['4', '7', '10', '11'],
        userCount: 150,
        isSystemRole: true
      },
      {
        id: '6',
        name: 'STUDENT',
        displayName: 'Student',
        description: 'Course access and learning',
        level: 6,
        permissions: ['10'],
        userCount: 2500,
        isSystemRole: true
      }
    ];
    
    setTimeout(() => {
      setRoles(mockRoles);
      setPermissions(mockPermissions);
      setLoading(false);
    }, 1000);
  }, []);

  const getPermissionsByCategory = () => {
    const categories: Record<string, Permission[]> = {};
    permissions.forEach(permission => {
      if (!categories[permission.category]) {
        categories[permission.category] = [];
      }
      categories[permission.category].push(permission);
    });
    return categories;
  };

  const togglePermission = (roleId: string, permissionId: string) => {
    setRoles(roles.map(role => {
      if (role.id === roleId) {
        const updatedPermissions = role.permissions.includes(permissionId)
          ? role.permissions.filter(p => p !== permissionId)
          : [...role.permissions, permissionId];
        return { ...role, permissions: updatedPermissions };
      }
      return role;
    }));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Management</h1>
        <p className="text-gray-600">Manage roles and permissions for system access control</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('roles')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'roles'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Roles Management
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'permissions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Permissions Overview
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'roles' && (
        <div className="space-y-6">
          {roles.map((role) => (
            <div key={role.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-gray-900">{role.displayName}</h3>
                    <span className="text-sm text-gray-500">({role.name})</span>
                    {role.isSystemRole && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        System Role
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mt-1">{role.description}</p>
                  <p className="text-sm text-gray-500 mt-1">Level {role.level} • {role.userCount} users</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedRole(role);
                    setShowPermissionModal(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Manage Permissions
                </button>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900">Current Permissions:</h4>
                <div className="flex flex-wrap gap-2">
                  {role.permissions.map((permId) => {
                    const permission = permissions.find(p => p.id === permId);
                    return permission ? (
                      <span
                        key={permId}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                      >
                        {permission.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'permissions' && (
        <div className="space-y-6">
          {Object.entries(getPermissionsByCategory()).map(([category, categoryPermissions]) => (
            <div key={category} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{category}</h3>
              <div className="space-y-3">
                {categoryPermissions.map((permission) => (
                  <div key={permission.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{permission.name}</span>
                        {permission.isSystemLevel && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            System Level
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{permission.description}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {roles.filter(role => role.permissions.includes(permission.id)).length} roles
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Permission Management Modal */}
      {showPermissionModal && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">
                Manage Permissions for {selectedRole.displayName}
              </h3>
              <button
                onClick={() => {
                  setShowPermissionModal(false);
                  setSelectedRole(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {Object.entries(getPermissionsByCategory()).map(([category, categoryPermissions]) => (
                <div key={category}>
                  <h4 className="text-md font-medium text-gray-900 mb-3">{category}</h4>
                  <div className="space-y-2">
                    {categoryPermissions.map((permission) => (
                      <label key={permission.id} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedRole.permissions.includes(permission.id)}
                          onChange={() => togglePermission(selectedRole.id, permission.id)}
                          disabled={permission.isSystemLevel && selectedRole.name !== 'SUPERADMIN'}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">{permission.name}</span>
                            {permission.isSystemLevel && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                System Level
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{permission.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowPermissionModal(false);
                  setSelectedRole(null);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Save changes here
                  console.log('Saving permissions for role:', selectedRole.id);
                  setShowPermissionModal(false);
                  setSelectedRole(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
