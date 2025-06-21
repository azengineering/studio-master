'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldCheck, LogIn, UserPlus } from 'lucide-react'; 
import { useRouter, usePathname } from 'next/navigation'; // Added usePathname
import type React from 'react';

interface AuthRequiredModalProps {
  isOpen: boolean;
  onCloseAndGoBack: () => void; 
  userRole?: 'jobSeeker' | 'employer' | null;
}

export const AuthRequiredModal: React.FC<AuthRequiredModalProps> = ({ isOpen, onCloseAndGoBack, userRole }) => {
  const router = useRouter();
  const pathname = usePathname(); // Get current pathname

  const handleLogin = () => {
    const params = new URLSearchParams();
    if (userRole) params.set('role', userRole);
    if (pathname) params.set('from', pathname);
    router.push(`/login${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const handleSignup = () => {
    const params = new URLSearchParams();
    if (userRole) params.set('role', userRole);
    if (pathname) params.set('from', pathname);
    router.push(`/signup${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onCloseAndGoBack(); 
      }
    }}>
      <DialogContent className="sm:max-w-md rounded-xl shadow-2xl border-border bg-card">
        <DialogHeader className="items-center text-center p-6 pb-4">
          <ShieldCheck className="h-16 w-16 text-primary mb-5" /> 
          <DialogTitle className="text-2xl font-bold text-foreground">Authentication Required</DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2 px-4 text-base leading-relaxed">
            To access this feature, please log in or create an account. It only takes a moment!
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-3 p-6 pt-4 bg-secondary/20 border-t border-border rounded-b-xl">
          <Button variant="outline" onClick={onCloseAndGoBack} className="w-full sm:w-auto sm:order-3 order-1 text-base py-2.5 h-auto border-muted-foreground/50 hover:border-primary">
            Cancel
          </Button>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:justify-end sm:order-2 order-2">
            <Button onClick={handleLogin} className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 text-base py-2.5 h-auto shadow-md hover:shadow-lg transition-shadow">
              <LogIn className="mr-2 h-5 w-5" /> Log In
            </Button>
            <Button onClick={handleSignup} className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 text-base py-2.5 h-auto shadow-md hover:shadow-lg transition-shadow">
              <UserPlus className="mr-2 h-5 w-5" /> Sign Up
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
