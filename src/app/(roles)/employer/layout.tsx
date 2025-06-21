
'use client';

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { logoutAction } from '@/app/(auth)/actions';
import { Loader2 } from 'lucide-react';

export default function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [authStatus, setAuthStatus] = useState<'loading' | 'authorized' | 'unauthorized' | 'unauthorized_role'>('loading');
  const [isLoggedInForLayout, setIsLoggedInForLayout] = useState(false); // Layout's own sense of login

  const updateLayoutSpecificAuthState = useCallback(() => {
    if (typeof window !== 'undefined') {
      const storedUserId = localStorage.getItem('userId');
      setIsLoggedInForLayout(!!storedUserId);
    }
  }, []);

  const performLogout = useCallback(async (message: string) => {
    await logoutAction(); // Server-side logout
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userId');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
      localStorage.removeItem('companyLogoUrl');
    }
    toast({ title: "Session Update", description: message, variant: "destructive", duration: 5000 });
    updateLayoutSpecificAuthState(); // Update layout's view of auth state
    // No direct router.push here; let the page render as "logged out"
  }, [toast, updateLayoutSpecificAuthState]);

  useEffect(() => {
    const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    const storedUserRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;

    if (storedUserId) {
      setIsLoggedInForLayout(true);
      if (storedUserRole === 'jobSeeker') { // Mismatch: Job Seeker on Employer page
        setAuthStatus('unauthorized_role');
        performLogout("Accessing employer section as a job seeker is not allowed. You've been logged out.");
      } else if (storedUserRole === 'employer') {
        setAuthStatus('authorized');
      } else { // Unknown or no role
        setAuthStatus('unauthorized_role');
        performLogout("Invalid user role. You have been logged out.");
      }
    } else { // Not logged in
      setIsLoggedInForLayout(false);
      setAuthStatus('unauthorized');
      // For employer layout, if not logged in, redirect to login
      // unless the page is the login/signup page itself or a public employer page.
      // This redirect is for protecting sensitive employer sections if directly accessed.
      const publicEmployerPaths = ['/employer']; // Add other public employer pages if any
      if (!publicEmployerPaths.includes(pathname) && pathname !== '/login' && pathname !== '/signup' && !pathname.startsWith('/employer/login') && !pathname.startsWith('/employer/signup')) {
         if (!pathname.startsWith('/employer/post-job') && !pathname.startsWith('/employer/control')) {
            // router.push('/login?role=employer'); // Temporarily disable aggressive redirect to test header update
         }
      }
    }
  }, [pathname, router, performLogout, updateLayoutSpecificAuthState]);

  if (authStatus === 'loading') {
    return <div className="flex flex-col min-h-screen justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /> Loading Employer Area...</div>;
  }

  // If unauthorized_role, means logout has occurred.
  // The Header should reflect the cleared localStorage and show appropriate login/signup for 'employer' role.
  // Children will render, and protected children should use AuthRequiredModal.
  return (
    <div className="flex flex-col min-h-screen">
      <Header role="employer" />
      <main className="flex-grow">{children}</main>
      <Footer role="employer" />
    </div>
  );
}
    