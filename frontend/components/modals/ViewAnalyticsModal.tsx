'use client';

interface ViewAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: any;
}

export default function ViewAnalyticsModal({ isOpen, onClose, stats }: ViewAnalyticsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Dean Analytics Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800">Total Courses</h3>
            <p className="text-3xl font-bold text-blue-600">{stats?.totalCourses || 0}</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800">Total Teachers</h3>
            <p className="text-3xl font-bold text-green-600">{stats?.totalTeachers || 0}</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-800">Total Students</h3>
            <p className="text-3xl font-bold text-purple-600">{stats?.totalStudents || 0}</p>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800">Pending Approvals</h3>
            <p className="text-3xl font-bold text-yellow-600">{stats?.pendingApprovals || 0}</p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-2">Quick Insights</h3>
          <ul className="space-y-2 text-gray-700">
            <li>• Average students per course: {stats?.totalCourses > 0 ? Math.round((stats?.totalStudents || 0) / stats.totalCourses) : 0}</li>
            <li>• Teacher to student ratio: 1:{stats?.totalTeachers > 0 ? Math.round((stats?.totalStudents || 0) / stats.totalTeachers) : 0}</li>
            <li>• Course approval rate: {stats?.totalCourses > 0 ? Math.round(((stats?.totalCourses - stats?.pendingApprovals) / stats.totalCourses) * 100) : 100}%</li>
          </ul>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
