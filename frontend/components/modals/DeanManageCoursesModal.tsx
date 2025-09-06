'use client';

import { useState, useEffect } from 'react';

interface Subject {
  id: string;
  name: string;
  code: string;
  department: string;
  sections: number;
  totalStudents: number;
  status: string;
}

interface Section {
  id: string;
  name: string;
  capacity: number;
  enrolled: number;
  teacher?: {
    id: string;
    name: string;
  };
  students: Array<{
    id: string;
    name: string;
    email: string;
  }>;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
  department: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  department: string;
}

interface DeanManageCoursesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DeanManageCoursesModal({ isOpen, onClose }: DeanManageCoursesModalProps) {
  const [currentView, setCurrentView] = useState<'subjects' | 'sections' | 'section-details'>('subjects');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [availableTeachers, setAvailableTeachers] = useState<Teacher[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal states for forms
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);

  // Form states
  const [newSubject, setNewSubject] = useState({
    name: '',
    code: '',
    description: ''
  });
  const [newSection, setNewSection] = useState({
    name: '',
    capacity: 30
  });

  useEffect(() => {
    if (isOpen) {
      fetchSubjects();
    }
  }, [isOpen]);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dean/courses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSubjects(data);
      }
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async (subjectId: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dean/courses/${subjectId}/sections`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSections(data);
      }
    } catch (error) {
      console.error('Failed to fetch sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSectionDetails = async (sectionId: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dean/sections/${sectionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedSection(data);
      }
    } catch (error) {
      console.error('Failed to fetch section details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTeachers = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dean/teachers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAvailableTeachers(data);
      }
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
    }
  };

  const fetchAvailableStudents = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dean/students`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAvailableStudents(data);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dean/courses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSubject)
      });
      
      if (response.ok) {
        setShowAddSubject(false);
        setNewSubject({ name: '', code: '', description: '' });
        fetchSubjects();
      }
    } catch (error) {
      console.error('Failed to add subject:', error);
    }
  };

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dean/courses/${selectedSubject?.id}/sections`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSection)
      });
      
      if (response.ok) {
        setShowAddSection(false);
        setNewSection({ name: '', capacity: 30 });
        if (selectedSubject) {
          fetchSections(selectedSubject.id);
        }
      }
    } catch (error) {
      console.error('Failed to add section:', error);
    }
  };

  const handleAssignTeacher = async (teacherId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dean/sections/${selectedSection?.id}/assign-teacher`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ teacherId })
      });
      
      if (response.ok) {
        setShowAddTeacher(false);
        if (selectedSection) {
          fetchSectionDetails(selectedSection.id);
        }
      }
    } catch (error) {
      console.error('Failed to assign teacher:', error);
    }
  };

  const handleAddStudent = async (studentId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dean/sections/${selectedSection?.id}/add-student`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ studentId })
      });
      
      if (response.ok) {
        if (selectedSection) {
          fetchSectionDetails(selectedSection.id);
        }
      }
    } catch (error) {
      console.error('Failed to add student:', error);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dean/sections/${selectedSection?.id}/remove-student`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ studentId })
      });
      
      if (response.ok) {
        if (selectedSection) {
          fetchSectionDetails(selectedSection.id);
        }
      }
    } catch (error) {
      console.error('Failed to remove student:', error);
    }
  };

  const handleSubjectClick = (subject: Subject) => {
    setSelectedSubject(subject);
    setCurrentView('sections');
    fetchSections(subject.id);
  };

  const handleSectionClick = (section: Section) => {
    setSelectedSection(section);
    setCurrentView('section-details');
    fetchSectionDetails(section.id);
  };

  const handleBack = () => {
    if (currentView === 'section-details') {
      setCurrentView('sections');
      setSelectedSection(null);
    } else if (currentView === 'sections') {
      setCurrentView('subjects');
      setSelectedSubject(null);
      setSections([]);
    }
  };

  const handleClose = () => {
    setCurrentView('subjects');
    setSelectedSubject(null);
    setSelectedSection(null);
    setSections([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-4">
            {currentView !== 'subjects' && (
              <button
                onClick={handleBack}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back
              </button>
            )}
            <h2 className="text-xl font-semibold text-gray-900">
              {currentView === 'subjects' && 'Manage Courses'}
              {currentView === 'sections' && `${selectedSubject?.name} - Sections`}
              {currentView === 'section-details' && `${selectedSection?.name} - Details`}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* Subjects View */}
          {currentView === 'subjects' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium">Available Subjects</h3>
                <button
                  onClick={() => setShowAddSubject(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Subject
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subjects.map((subject) => (
                    <div
                      key={subject.id}
                      onClick={() => handleSubjectClick(subject)}
                      className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <h4 className="font-medium text-gray-900">{subject.name}</h4>
                      <p className="text-sm text-gray-500">Code: {subject.code}</p>
                      <p className="text-sm text-gray-500">Sections: {subject.sections}</p>
                      <p className="text-sm text-gray-500">Students: {subject.totalStudents}</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-2 ${
                        subject.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {subject.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sections View */}
          {currentView === 'sections' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium">Sections for {selectedSubject?.name}</h3>
                <button
                  onClick={() => setShowAddSection(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Section
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sections.map((section) => (
                    <div
                      key={section.id}
                      onClick={() => handleSectionClick(section)}
                      className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <h4 className="font-medium text-gray-900">{section.name}</h4>
                      <p className="text-sm text-gray-500">
                        Capacity: {section.enrolled}/{section.capacity}
                      </p>
                      <p className="text-sm text-gray-500">
                        Teacher: {section.teacher?.name || 'Not assigned'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section Details View */}
          {currentView === 'section-details' && selectedSection && (
            <div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Section Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-4">Section Information</h3>
                  <p><strong>Name:</strong> {selectedSection.name}</p>
                  <p><strong>Capacity:</strong> {selectedSection.capacity}</p>
                  <p><strong>Enrolled:</strong> {selectedSection.enrolled}</p>
                  <p><strong>Teacher:</strong> {selectedSection.teacher?.name || 'Not assigned'}</p>
                </div>

                {/* Teacher Assignment */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Teacher Assignment</h3>
                    <button
                      onClick={() => {
                        fetchAvailableTeachers();
                        setShowAddTeacher(true);
                      }}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      {selectedSection.teacher ? 'Change Teacher' : 'Assign Teacher'}
                    </button>
                  </div>
                  {selectedSection.teacher ? (
                    <div className="p-3 bg-white rounded border">
                      <p className="font-medium">{selectedSection.teacher.name}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500">No teacher assigned</p>
                  )}
                </div>
              </div>

              {/* Students List */}
              <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Students ({selectedSection.students?.length || 0})</h3>
                  <button
                    onClick={() => {
                      fetchAvailableStudents();
                      setShowAddStudent(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add Student
                  </button>
                </div>
                
                <div className="bg-white border rounded-lg overflow-hidden">
                  {selectedSection.students && selectedSection.students.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedSection.students.map((student) => (
                          <tr key={student.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {student.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {student.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button
                                onClick={() => handleRemoveStudent(student.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      No students enrolled in this section
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Subject Modal */}
      {showAddSubject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">Add New Subject</h3>
              <form onSubmit={handleAddSubject}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject Name
                    </label>
                    <input
                      type="text"
                      value={newSubject.name}
                      onChange={(e) => setNewSubject({...newSubject, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject Code
                    </label>
                    <input
                      type="text"
                      value={newSubject.code}
                      onChange={(e) => setNewSubject({...newSubject, code: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newSubject.description}
                      onChange={(e) => setNewSubject({...newSubject, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddSubject(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add Subject
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Section Modal */}
      {showAddSection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">Create New Section</h3>
              <form onSubmit={handleAddSection}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Section Name
                    </label>
                    <input
                      type="text"
                      value={newSection.name}
                      onChange={(e) => setNewSection({...newSection, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="e.g., Section A, Morning Batch"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Capacity
                    </label>
                    <input
                      type="number"
                      value={newSection.capacity}
                      onChange={(e) => setNewSection({...newSection, capacity: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="1"
                      max="100"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddSection(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Create Section
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Teacher Modal */}
      {showAddTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">Assign Teacher</h3>
              <div className="max-h-60 overflow-y-auto">
                {availableTeachers.map((teacher) => (
                  <div
                    key={teacher.id}
                    onClick={() => handleAssignTeacher(teacher.id)}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b"
                  >
                    <p className="font-medium">{teacher.name}</p>
                    <p className="text-sm text-gray-500">{teacher.email}</p>
                    <p className="text-sm text-gray-500">{teacher.department}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setShowAddTeacher(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">Add Student</h3>
              <div className="max-h-60 overflow-y-auto">
                {availableStudents.map((student) => (
                  <div
                    key={student.id}
                    onClick={() => handleAddStudent(student.id)}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b"
                  >
                    <p className="font-medium">{student.name}</p>
                    <p className="text-sm text-gray-500">{student.email}</p>
                    <p className="text-sm text-gray-500">{student.department}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setShowAddStudent(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
