'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { shouldUseSidebarLayout } from '@/lib/utils/redirect';

export function LayoutRedirect() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only redirect if auth is loaded and user is authenticated
    if (!isLoading && isAuthenticated && user) {
      const isStaff = shouldUseSidebarLayout(user.role);
      
      // If user is staff and on homepage, redirect to dashboard
      if (isStaff && pathname === '/') {
        router.replace('/dashboard');
        return;
      }
      
      // If user is patient and trying to access staff-only routes, redirect to homepage
      if (user.role === 'PATIENT' && pathname.startsWith('/dashboard')) {
        router.replace('/');
        return;
      }
    }
  }, [user, isAuthenticated, isLoading, router, pathname]);

  return null;
}
