import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RoleSwitcher from './RoleSwitcher';

const EXCLUDED = ['SUPERADMIN', 'STUDENT'];

export default function withRoleAndStatusGuard(WrappedComponent: any, requiredRoles?: string[]) {
  return function GuardedDashboard(props: any) {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
      const fetchUser = async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          router.push('/auth/login');
          return;
        }
        
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (res.ok) {
            const data = await res.json();
            
            // Check if user has required roles (if specified)
            if (requiredRoles && requiredRoles.length > 0) {
              const hasRequiredRole = requiredRoles.some(role => 
                data.roles?.includes(role)
              );
              
              if (!hasRequiredRole) {
                router.push('/auth/login');
                return;
              }
            }
            
            setUser(data);
          } else {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            router.push('/auth/login');
            return;
          }
        } catch (error) {
          console.error('Error fetching user:', error);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          router.push('/auth/login');
          return;
        }
        
        setLoading(false);
      };
      fetchUser();
    }, [router]);

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    
    if (user && user.is_active !== 'ACTIVE') {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="bg-red-100 text-red-700 px-6 py-4 rounded shadow text-lg font-semibold mb-4">
            You are inactive. Please contact an admin to activate your account.
          </div>
        </div>
      );
    }
    
    const roles = (user?.roles || []).filter((r: string) => !EXCLUDED.includes(r));
    return (
      <>
        {roles.length > 1 && (
          <div className="absolute top-4 left-4 z-50">
            <RoleSwitcher
              roles={roles}
              currentRole={user?.default_dashboard || roles[0]}
              onSwitch={role => {
                switch (role) {
                  case 'ADMIN': router.push('/admin/dashboard'); break;
                  case 'HOD': router.push('/hod/dashboard'); break;
                  case 'CC': router.push('/cc/dashboard'); break;
                  case 'TEACHER': router.push('/teacher/dashboard'); break;
                  default: break;
                }
              }}
            />
          </div>
        )}
        <WrappedComponent {...props} user={user} />
      </>
    );
  };
}
