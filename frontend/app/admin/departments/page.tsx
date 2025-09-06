'use client';

import { useState, useEffect } from 'react';
import AssignDeanModal from '../../../components/modals/AssignDeanModal';

interface Department {
  id: string;
  name: string;
  head_id: string | null;
  Head: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface Dean {
  id: string;
  name: string;
  email: string;
  uid: string;
  DepartmentHead: {
    id: string;
    name: string;
  } | null;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deans, setDeans] = useState<Dean[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAssignDean, setShowAssignDean] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  useEffect(() => {
    fetchDepartmentsAndDeans();
  }, []);

  const fetchDepartmentsAndDeans = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        console.error('No access token found');
        window.location.href = '/auth/login';
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/deans-departments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments);
        setDeans(data.deans);
      } else if (response.status === 401) {
        console.error('Token expired or invalid');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/auth/login';
      } else {
        console.error('Failed to fetch data:', response.status);
        setDepartments([]);
        setDeans([]);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setDepartments([]);
      setDeans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditDepartment = (department: Department) => {
    setSelectedDepartment(department);
    setShowAssignDean(true);
  };

  const handleDeanAssigned = () => {
    fetchDepartmentsAndDeans();
    setShowAssignDean(false);
    setSelectedDepartment(null);
  };

  const filteredDepartments = departments.filter(dept => 
    dept.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-300 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Department Management</h1>
        <p className="text-gray-600">Manage all departments in the university</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search departments by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDepartments.map((department) => (
          <div key={department.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{department.name}</h3>
                <p className="text-sm text-gray-500 font-medium">Department ID: {department.id.slice(0, 8)}...</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ACTIVE
              </span>
            </div>

            {department.Head ? (
              <div className="mb-4">
                <p className="text-sm text-gray-500">Dean Assigned</p>
                <p className="text-sm font-medium text-gray-900">{department.Head.name}</p>
                <p className="text-xs text-gray-600">{department.Head.email}</p>
              </div>
            ) : (
              <div className="mb-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  ⚠️ No Dean Assigned
                </span>
              </div>
            )}

            <div className="flex space-x-2">
              <button 
                onClick={() => handleEditDepartment(department)}
                className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {department.Head ? 'Reassign Dean' : 'Assign Dean'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredDepartments.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-gray-400 text-2xl">🏢</span>
          </div>
          <div className="text-gray-500 text-lg mb-2">No departments found</div>
          <div className="text-gray-400 text-sm">
            {departments.length === 0 ? 'No departments have been created yet' : 'No departments match your search criteria'}
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-3xl">🏢</span>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Total Departments</div>
              <div className="text-2xl font-bold text-gray-900">{departments.length}</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-3xl">👨‍💼</span>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Available Deans</div>
              <div className="text-2xl font-bold text-gray-900">{deans.length}</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-3xl">✅</span>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Departments with Deans</div>
              <div className="text-2xl font-bold text-gray-900">
                {departments.filter(d => d.Head).length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assign Dean Modal */}
      <AssignDeanModal
        isOpen={showAssignDean}
        onClose={() => setShowAssignDean(false)}
        onDeanAssigned={handleDeanAssigned}
        department={selectedDepartment}
        deans={deans}
      />
    </div>
  );
}
