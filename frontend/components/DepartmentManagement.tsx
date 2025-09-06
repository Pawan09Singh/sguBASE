'use client';

import { useState, useEffect } from 'react';
import CreateDepartmentModal from './modals/CreateDepartmentModal';
import AssignDeanModal from './modals/AssignDeanModal';

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

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deans, setDeans] = useState<Dean[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDepartment, setShowCreateDepartment] = useState(false);
  const [showAssignDean, setShowAssignDean] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  useEffect(() => {
    fetchDepartmentsAndDeans();
  }, []);

  const fetchDepartmentsAndDeans = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/deans-departments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments);
        setDeans(data.deans);
      } else {
        console.error('Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDean = (department: Department) => {
    setSelectedDepartment(department);
    setShowAssignDean(true);
  };

  const handleDepartmentCreated = () => {
    fetchDepartmentsAndDeans();
    setShowCreateDepartment(false);
  };

  const handleDeanAssigned = () => {
    fetchDepartmentsAndDeans();
    setShowAssignDean(false);
    setSelectedDepartment(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Department Management</h2>
        <button
          onClick={() => setShowCreateDepartment(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
        >
          <span>➕</span>
          <span>Create Department</span>
        </button>
      </div>

      {/* Departments List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Departments</h3>
          <p className="text-sm text-gray-500">Manage departments and assign deans</p>
        </div>
        
        <div className="divide-y divide-gray-200">
          {departments.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No departments found. Create your first department to get started.
            </div>
          ) : (
            departments.map((department) => (
              <div key={department.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">🏢</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{department.name}</h4>
                      <div className="text-sm text-gray-500">
                        {department.Head ? (
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              👨‍💼 Dean Assigned
                            </span>
                            <span>{department.Head.name} ({department.Head.email})</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            ⚠️ No Dean Assigned
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleAssignDean(department)}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      department.Head
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                    }`}
                  >
                    {department.Head ? 'Reassign Dean' : 'Assign Dean'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      {/* Available Deans */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Available Deans</h3>
          <p className="text-sm text-gray-500">Users with Dean (ADMIN) role</p>
        </div>
        
        <div className="divide-y divide-gray-200">
          {deans.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No deans found. Create users with ADMIN role to assign as deans.
            </div>
          ) : (
            deans.map((dean) => (
              <div key={dean.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">👨‍💼</span>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">{dean.name}</h4>
                    <p className="text-sm text-gray-500">{dean.email} (UID: {dean.uid})</p>
                  </div>
                </div>
                
                <div>
                  {dean.DepartmentHead ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Dean of {dean.DepartmentHead.name}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Available
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateDepartmentModal
        isOpen={showCreateDepartment}
        onClose={() => setShowCreateDepartment(false)}
        onDepartmentCreated={handleDepartmentCreated}
      />
      
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
