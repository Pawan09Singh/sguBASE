'use client';

import { useState, useEffect } from 'react';

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

interface AssignDeanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeanAssigned: () => void;
  department: Department | null;
  deans: Dean[];
}

export default function AssignDeanModal({ isOpen, onClose, onDeanAssigned, department, deans }: AssignDeanModalProps) {
  const [selectedDean, setSelectedDean] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && department) {
      // If department already has a dean, pre-select them
      if (department.Head) {
        setSelectedDean(department.Head.id);
      } else {
        setSelectedDean('');
      }
      setError('');
    }
  }, [isOpen, department]);

  const handleAssign = async () => {
    if (!selectedDean || !department) {
      setError('Please select a dean');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/assign-dean`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          deanId: selectedDean,
          departmentId: department.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign dean');
      }

      onDeanAssigned();
      onClose();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!department || !department.Head) {
      setError('No dean to remove');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/remove-dean`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          departmentId: department.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove dean');
      }

      onDeanAssigned();
      onClose();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !department) return null;

  const availableDeans = deans.filter(dean => 
    !dean.DepartmentHead || dean.DepartmentHead.id === department.id
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {department.Head ? 'Reassign Dean' : 'Assign Dean'} - {department.name}
        </h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {department.Head && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded mb-4">
            <p className="text-sm text-blue-800">
              <strong>Current Dean:</strong> {department.Head.name} ({department.Head.email})
            </p>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Dean
          </label>
          <select
            value={selectedDean}
            onChange={(e) => setSelectedDean(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose a dean...</option>
            {availableDeans.map((dean) => (
              <option key={dean.id} value={dean.id}>
                {dean.name} ({dean.email}) - UID: {dean.uid}
                {dean.DepartmentHead && dean.DepartmentHead.id !== department.id 
                  ? ` [Currently dean of ${dean.DepartmentHead.name}]` 
                  : ''
                }
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          
          {department.Head && (
            <button
              onClick={handleRemove}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Removing...' : 'Remove Dean'}
            </button>
          )}
          
          <button
            onClick={handleAssign}
            disabled={loading || !selectedDean}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Assigning...' : department.Head ? 'Reassign Dean' : 'Assign Dean'}
          </button>
        </div>
      </div>
    </div>
  );
}
