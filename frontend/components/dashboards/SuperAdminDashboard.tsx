'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DepartmentManagement from '../DepartmentManagement';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDepartments: 0,
    totalCourses: 0,
    activeUsers: 0
  });

  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showDirectLogin, setShowDirectLogin] = useState(false);
  const [showManageDepartments, setShowManageDepartments] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [directLoginUid, setDirectLoginUid] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(false);

  useEffect(() => {
    // Fetch dashboard stats
    fetchStats();
  }, []);

  // Listen for sidebar navigation
  useEffect(() => {
    const handleSidebarClick = (event: any) => {
      const { id } = event.detail;
      switch (id) {
        case 'dashboard':
          setShowCreateUser(false);
          setShowDirectLogin(false);
          setShowManageDepartments(false);
          setShowUserManagement(false);
          break;
        case 'manage-department':
          setShowManageDepartments(true);
          setShowCreateUser(false);
          setShowDirectLogin(false);
          setShowUserManagement(false);
          break;
        case 'manage-users':
          setShowUserManagement(true);
          setShowCreateUser(false);
          setShowDirectLogin(false);
          setShowManageDepartments(false);
          break;
        case 'direct-login':
          setShowDirectLogin(true);
          setShowCreateUser(false);
          setShowManageDepartments(false);
          setShowUserManagement(false);
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

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        console.error('No access token found');
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else if (response.status === 401) {
        console.error('Token expired or invalid');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        router.push('/auth/login');
      } else {
        console.error('Failed to fetch stats:', response.status);
        setStats({
          totalUsers: 0,
          totalDepartments: 0,
          totalCourses: 0,
          activeUsers: 0
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({
        totalUsers: 0,
        totalDepartments: 0,
        totalCourses: 0,
        activeUsers: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setShowCreateUser(true);
  };

  const fetchUsers = async () => {
    try {
      setUserLoading(true);
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else if (response.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setUserLoading(false);
    }
  };

  const handleUserManagement = () => {
    setShowUserManagement(true);
    fetchUsers();
  };

  const handleImpersonateUser = async (uid: string, userName: string) => {
    if (!confirm(`Are you sure you want to impersonate ${userName} (UID: ${uid})?`)) {
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/direct-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ uid })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store the new user's tokens
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Store the impersonation info for potential return to SuperAdmin
        localStorage.setItem('impersonating', 'true');
        localStorage.setItem('originalUser', 'superadmin');
        
        // Redirect to the user's default dashboard
        switch (data.user.defaultDashboard) {
          case 'ADMIN':
            router.push('/admin/dashboard');
            break;
          case 'HOD':
            router.push('/hod/dashboard');
            break;
          case 'CC':
            router.push('/cc/dashboard');
            break;
          case 'TEACHER':
            router.push('/teacher/dashboard');
            break;
          case 'STUDENT':
            router.push('/student/dashboard');
            break;
          default:
            router.push('/dashboard');
        }
      } else {
        const error = await response.json();
        alert(`Impersonation failed: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Impersonation error:', error);
      alert('Impersonation failed. Please try again.');
    }
  };

  const handleViewLogs = () => {
    router.push('/admin/logs');
  };

  const handleManageAccess = () => {
    router.push('/admin/access');
  };

  const handleImportUsers = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/import-users`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            },
            body: formData
          });
          
          if (response.ok) {
            const result = await response.json();
            alert(`Successfully imported ${result.imported} users`);
            fetchStats(); // Refresh stats
          } else {
            alert('Import failed. Please check the file format.');
          }
        } catch (error) {
          console.error('Import error:', error);
          alert('Import failed. Please try again.');
        }
      }
    };
    input.click();
  };

  const handleDirectLogin = () => {
    setShowDirectLogin(true);
  };

  const performDirectLogin = async () => {
    if (!directLoginUid.trim()) {
      alert('Please enter a valid UID');
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/direct-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ uid: directLoginUid })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store the new user's tokens
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Store the impersonation info for potential return to SuperAdmin
        localStorage.setItem('impersonating', 'true');
        localStorage.setItem('originalUser', 'superadmin');
        
        // Redirect to the user's default dashboard
        switch (data.user.defaultDashboard) {
          case 'ADMIN':
            router.push('/admin/dashboard');
            break;
          case 'HOD':
            router.push('/hod/dashboard');
            break;
          case 'CC':
            router.push('/cc/dashboard');
            break;
          case 'TEACHER':
            router.push('/teacher/dashboard');
            break;
          case 'STUDENT':
            router.push('/student/dashboard');
            break;
          default:
            router.push('/dashboard');
        }
      } else {
        const error = await response.json();
        alert(`Impersonation failed: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Impersonation error:', error);
      alert('Impersonation failed. Please try again.');
    }
    
    setShowDirectLogin(false);
    setDirectLoginUid('');
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <span className="text-white font-semibold">👥</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <span className="text-white font-semibold">🏢</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Departments</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalDepartments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
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
              <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                <span className="text-white font-semibold">✅</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Users</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeUsers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button 
            onClick={handleCreateUser}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
          >
            <div className="text-center">
              <span className="text-2xl block mb-2">👨‍🎓</span>
              <span className="text-sm font-medium text-gray-700">Create User</span>
            </div>
          </button>
          
          <button 
            onClick={handleViewLogs}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
          >
            <div className="text-center">
              <span className="text-2xl block mb-2">📋</span>
              <span className="text-sm font-medium text-gray-700">View Logs</span>
            </div>
          </button>
          
          <button 
            onClick={handleManageAccess}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
          >
            <div className="text-center">
              <span className="text-2xl block mb-2">🔐</span>
              <span className="text-sm font-medium text-gray-700">Manage Access</span>
            </div>
          </button>
          
          <button 
            onClick={handleImportUsers}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
          >
            <div className="text-center">
              <span className="text-2xl block mb-2">📤</span>
              <span className="text-sm font-medium text-gray-700">Import Users (CSV)</span>
            </div>
          </button>
          
          <button 
            onClick={handleUserManagement}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
          >
            <div className="text-center">
              <span className="text-2xl block mb-2">👥</span>
              <span className="text-sm font-medium text-gray-700">Manage Users</span>
            </div>
          </button>
          
          <button 
            onClick={handleDirectLogin}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
          >
            <div className="text-center">
              <span className="text-2xl block mb-2">🔑</span>
              <span className="text-sm font-medium text-gray-700">Quick Impersonate</span>
            </div>
          </button>
          
          <button 
            onClick={() => setShowManageDepartments(true)}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
          >
            <div className="text-center">
              <span className="text-2xl block mb-2">🏢</span>
              <span className="text-sm font-medium text-gray-700">Manage Departments</span>
            </div>
          </button>
        </div>
      </div>

      {/* Management Navigation */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">System Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            onClick={() => router.push('/admin/dashboard')}
            className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <div className="text-center">
              <span className="text-2xl block mb-2">🏠</span>
              <span className="text-sm font-medium text-blue-700">Dashboard</span>
            </div>
          </button>
          
          <button 
            onClick={() => router.push('/admin/users')}
            className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer"
          >
            <div className="text-center">
              <span className="text-2xl block mb-2">👥</span>
              <span className="text-sm font-medium text-purple-700">Manage Users</span>
            </div>
          </button>
          
          <button 
            onClick={() => router.push('/admin/access')}
            className="p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
          >
            <div className="text-center">
              <span className="text-2xl block mb-2">🔐</span>
              <span className="text-sm font-medium text-red-700">Manage Access</span>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          <button 
            onClick={() => router.push('/admin/logs')}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View All Logs →
          </button>
        </div>
        <div className="space-y-3">
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-gray-400 text-xl">📋</span>
            </div>
            <p className="text-sm text-gray-500">Recent system activities will appear here</p>
            <p className="text-xs text-gray-400 mt-1">
              Activity logs are tracked and can be viewed in the Logs section
            </p>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Create User</h3>
              <button
                onClick={() => setShowCreateUser(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const name = formData.get('name') as string;
              const email = formData.get('email') as string;
              const uid = formData.get('uid') as string;
              const role = formData.get('role') as string;
              const password = formData.get('password') as string;
              
              const requestBody: any = { name, email, uid, role };
              if (password && password.trim()) {
                requestBody.password = password;
              }
              
              try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                  },
                  body: JSON.stringify(requestBody)
                });

                if (response.ok) {
                  const result = await response.json();
                  alert(`User "${result.name}" created successfully! ${result.passwordMessage}`);
                  fetchStats(); // Refresh stats
                  setShowCreateUser(false);
                } else {
                  const error = await response.json();
                  alert(`Failed to create user: ${error.error}`);
                }
              } catch (error) {
                console.error('Error creating user:', error);
                alert('Failed to create user. Please try again.');
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="john@university.edu"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User ID
                  </label>
                  <input
                    type="text"
                    name="uid"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="67890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Leave empty to use UID as password"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    If left empty, the User ID will be used as the default password
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    name="role"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Role</option>
                    <option value="ADMIN">Admin (Dean)</option>
                    <option value="HOD">HOD</option>
                    <option value="CC">Course Coordinator</option>
                    <option value="TEACHER">Teacher</option>
                    <option value="STUDENT">Student</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateUser(false)}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Management Modal */}
      {showUserManagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">User Management & Impersonation</h3>
              <button
                onClick={() => {
                  setShowUserManagement(false);
                  setUsers([]);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            {userLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading users...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        UID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Roles
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.uid}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {user.roles?.map((role: string) => (
                              <span
                                key={role}
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                                  role === 'HOD' ? 'bg-blue-100 text-blue-800' :
                                  role === 'CC' ? 'bg-green-100 text-green-800' :
                                  role === 'TEACHER' ? 'bg-yellow-100 text-yellow-800' :
                                  role === 'STUDENT' ? 'bg-gray-100 text-gray-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {role}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleImpersonateUser(user.uid, user.name)}
                            disabled={user.status !== 'Active'}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                          >
                            🎭 Impersonate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {users.length === 0 && !userLoading && (
                  <div className="text-center py-8 text-gray-500">
                    No users found.
                  </div>
                )}
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowUserManagement(false);
                  setUsers([]);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Login Modal */}
      {showDirectLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Quick Impersonate</h3>
              <button
                onClick={() => {
                  setShowDirectLogin(false);
                  setDirectLoginUid('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User ID
                </label>
                <input
                  type="text"
                  value={directLoginUid}
                  onChange={(e) => setDirectLoginUid(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter UID (e.g., 11111, 22222)"
                />
              </div>
              <p className="text-sm text-gray-600">
                Enter the UID of the user you want to impersonate. For a full user list with details, use the "Manage Users" button instead.
              </p>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowDirectLogin(false);
                  setDirectLoginUid('');
                }}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={performDirectLogin}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Impersonate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Department Management */}
      {showManageDepartments && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Department Management</h1>
              <button
                onClick={() => setShowManageDepartments(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                ← Back to Dashboard
              </button>
            </div>
            <DepartmentManagement />
          </div>
        </div>
      )}
    </div>
  );
}
