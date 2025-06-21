
// src/app/(admin)/admin-login/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { LogIn, ShieldAlert, Loader2, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Hardcoded credentials -  ONLY FOR DEVELOPMENT/TESTING
    const HARDCODED_ADMIN_ID = "Admin";
    const HARDCODED_PASSWORD = "Admin";

    // Simulate API call
    setTimeout(() => {
      if (adminId === HARDCODED_ADMIN_ID && password === HARDCODED_PASSWORD) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('isAdminAuthenticated', 'true');
        }
        toast({
          title: 'Admin Login Successful',
          description: 'Redirecting to Admin Panel...',
          variant: 'default',
        });
        router.push('/admin-panel');
      } else {
        setError('Invalid Admin ID or Password.');
        toast({
          title: 'Admin Login Failed',
          description: 'Invalid Admin ID or Password.',
          variant: 'destructive',
        });
      }
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-secondary/50 via-background to-secondary/30 p-4">
      <Card className="w-full max-w-md shadow-2xl border-2 border-primary rounded-xl overflow-hidden">
        <CardHeader className="text-center bg-primary/10 p-6">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <KeyRound className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">Admin Panel Access</CardTitle>
          <CardDescription className="text-muted-foreground">Please authenticate to manage the platform.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="adminId">Admin ID</Label>
              <Input
                id="adminId"
                type="text"
                placeholder="Enter Admin ID"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                required
                className="transition-default focus:ring-primary focus:border-primary h-11 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="transition-default focus:ring-primary focus:border-primary h-11 text-base"
              />
            </div>
            {error && (
              <p className="text-sm font-medium text-destructive flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" /> {error}
              </p>
            )}
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 h-12 text-lg font-semibold transition-default" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
              {isLoading ? 'Authenticating...' : 'Log In'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="bg-primary/5 p-4 text-center">
          <p className="text-xs text-muted-foreground w-full">
            This login is for authorized administrators only.
            <Link href="/" className="ml-1 font-medium text-primary hover:underline">
              Return to main site
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
