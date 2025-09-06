'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ImpersonationBanner() {
  const router = useRouter();
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const impersonating = localStorage.getItem('impersonating') === 'true';
    const user = localStorage.getItem('user');
    
    setIsImpersonating(impersonating);
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
  }, []);

  const handleReturnToSuperAdmin = async () => {
    try {
      // Clear current impersonation
      localStorage.removeItem('impersonating');
      localStorage.removeItem('originalUser');
      
      // Login back as SuperAdmin
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          login: '12345',
          password: '12345'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store SuperAdmin tokens
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirect to SuperAdmin dashboard
        router.push('/dashboard');
      } else {
        alert('Failed to return to SuperAdmin. Please login manually.');
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('Return to SuperAdmin error:', error);
      alert('Failed to return to SuperAdmin. Please login manually.');
      router.push('/auth/login');
    }
  };

  if (!isImpersonating) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <span className="text-yellow-400 text-lg">⚠️</span>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Impersonation Mode:</strong> You are currently viewing as{' '}
              <span className="font-semibold">
                {currentUser?.name} ({currentUser?.uid})
              </span>
              {' '}with roles: {currentUser?.roles?.join(', ')}
            </p>
          </div>
        </div>
        <div className="flex-shrink-0">
          <button
            onClick={handleReturnToSuperAdmin}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            🔄 Return to SuperAdmin
          </button>
        </div>
      </div>
    </div>
  );
}
