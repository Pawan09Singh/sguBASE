'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import ImpersonationBanner from '../../components/ImpersonationBanner';
import SuperAdminDashboard from '../../components/dashboards/SuperAdminDashboard';
import AdminDashboard from '../../components/dashboards/AdminDashboard';
import DeanDashboard from '../../components/dashboards/DeanDashboard';
import HODDashboard from '../../components/dashboards/HODDashboard';
import CCDashboard from '../../components/dashboards/CCDashboard';
import TeacherDashboard from '../../components/dashboards/TeacherDashboard';
import StudentDashboard from '../../components/dashboards/StudentDashboard';

interface User {
  id: string;
  name: string;
  email: string;
  uid: string;
  roles: string[];
  defaultDashboard: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setCurrentRole(parsedUser.defaultDashboard);
    } catch (error) {
      router.push('/auth/login');
      return;
    }

    setLoading(false);
  }, [router]);

  const handleRoleSwitch = (role: string) => {
    setCurrentRole(role);
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    router.push('/auth/login');
  };

  const renderDashboard = () => {
    switch (currentRole) {
      case 'SUPERADMIN':
        return <SuperAdminDashboard />;
      case 'ADMIN':
        return <AdminDashboard />;
      case 'DEAN':
        return <DeanDashboard />;
      case 'HOD':
        return <HODDashboard />;
      case 'CC':
        return <CCDashboard />;
      case 'TEACHER':
        return <TeacherDashboard />;
      case 'STUDENT':
        return <StudentDashboard />;
      default:
        return <StudentDashboard />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        user={user}
        currentRole={currentRole}
        onRoleSwitch={handleRoleSwitch}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          <ImpersonationBanner />
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {currentRole.charAt(0).toUpperCase() + currentRole.slice(1).toLowerCase()} Dashboard
            </h1>
            <p className="text-gray-600">Welcome back, {user.name}</p>
          </div>
          {renderDashboard()}
        </div>
      </main>
    </div>
  );
}
