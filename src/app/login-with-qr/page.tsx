// src/app/login-with-qr/page.tsx
'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getEmployerDetailsForQR } from '@/app/(auth)/actions'; 
import { Loader2, ShieldAlert, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

function QRLoginProcessor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing QR code login...');

  useEffect(() => {
    const userIdParam = searchParams.get('userId');

    if (!userIdParam) {
      setMessage('Invalid QR code link. User ID missing.');
      setStatus('error');
      toast({ title: 'Login Failed', description: 'Invalid QR code link: User ID missing.', variant: 'destructive' });
      return;
    }

    const processLogin = async () => {
      try {
        const userId = parseInt(userIdParam, 10);
        if (isNaN(userId)) {
          setMessage('Invalid User ID in QR code.');
          setStatus('error');
          toast({ title: 'Login Failed', description: 'Malformed User ID in QR code.', variant: 'destructive' });
          return;
        }

        setMessage(`Authenticating user ID: ${userId}...`);
        const employerDetails = await getEmployerDetailsForQR(userId);

        if (employerDetails && employerDetails.email) {
          localStorage.setItem('userId', String(userId));
          localStorage.setItem('userEmail', employerDetails.email);
          localStorage.setItem('userRole', 'employer');
          if (employerDetails.companyName) { // Store company name for QR page display
             localStorage.setItem('companyName', employerDetails.companyName);
          }
          if (employerDetails.companyLogoUrl) {
            localStorage.setItem('companyLogoUrl', employerDetails.companyLogoUrl);
          } else {
            localStorage.removeItem('companyLogoUrl');
          }
          
          setMessage('Login successful! Redirecting to your dashboard...');
          setStatus('success');
          toast({ title: 'Login Successful!', description: 'Redirecting to dashboard.', variant: 'default' });
          router.push('/employer/control');
        } else {
          setMessage('Authentication failed. Employer not found or QR data invalid.');
          setStatus('error');
          toast({ title: 'Login Failed', description: 'Employer not found or QR data invalid.', variant: 'destructive' });
        }
      } catch (e) {
        console.error("Error processing QR login:", e);
        setMessage('An unexpected error occurred during QR login.');
        setStatus('error');
        toast({ title: 'Login Error', description: 'An unexpected error occurred.', variant: 'destructive' });
      }
    };

    processLogin();
  }, [searchParams, router, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">QR Code Login</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 p-8">
          {status === 'processing' && (
            <>
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="text-muted-foreground">{message}</p>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="text-green-600 font-medium">{message}</p>
            </>
          )}
          {status === 'error' && (
            <>
              <ShieldAlert className="h-12 w-12 text-destructive" />
              <p className="text-destructive font-medium">{message}</p>
              <Button variant="outline" asChild className="mt-4">
                <Link href="/login?role=employer">Try Manual Login</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPageWithQR() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
            <QRLoginProcessor />
        </Suspense>
    )
}
