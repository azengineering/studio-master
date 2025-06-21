
'use client';

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { logoutAction } from '@/app/(auth)/actions';
import { Loader2 } from 'lucide-react';

export default function JobSeekerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [authStatus, setAuthStatus] = useState<'loading' | 'authorized' | 'unauthorized' | 'unauthorized_role'>('loading');
  const [isLoggedInForLayout, setIsLoggedInForLayout] = useState(false);

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
  }, [toast, updateLayoutSpecificAuthState]);

  useEffect(() => {
    const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    const storedUserRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;

    if (storedUserId) {
      setIsLoggedInForLayout(true);
      if (storedUserRole === 'employer') { 
        setAuthStatus('unauthorized_role');
        performLogout("Accessing job seeker section as an employer is not allowed. You've been logged out.");
      } else if (storedUserRole === 'jobSeeker') {
        setAuthStatus('authorized');
      } else { 
        setAuthStatus('unauthorized_role');
        performLogout("Invalid user role. You have been logged out.");
      }
    } else { 
      setIsLoggedInForLayout(false);
      setAuthStatus('unauthorized');
    }
  }, [pathname, router, performLogout, updateLayoutSpecificAuthState]);

  if (authStatus === 'loading') {
    return <div className="flex flex-col min-h-screen justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /> Loading Job Seeker Area...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header role="jobSeeker" />
      <main className="flex-grow">{children}</main>
      {/* Conditionally render the main footer. Do not render it on the job seeker dashboard page. */}
      {pathname !== '/jobSeeker/dashboard' && <Footer role="jobSeeker" />}
    </div>
  );
}
    
