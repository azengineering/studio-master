// src/app/(roles)/employer/control/sections/my-qr-code-section.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode as QrCodeIcon, Download, AlertTriangle, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

export default function MyQrCodeSection() {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isLoadingQr, setIsLoadingQr] = useState(true);
  const [errorQr, setErrorQr] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const generateQrCode = () => {
      setIsLoadingQr(true);
      setErrorQr(null);
      const userId = localStorage.getItem('userId');
      const storedCompanyName = localStorage.getItem('companyName'); // Attempt to get company name from localStorage

      if (storedCompanyName) {
        setCompanyName(storedCompanyName);
      }

      if (!userId) {
        setErrorQr("User not authenticated. Cannot generate QR code.");
        setIsLoadingQr(false);
        toast({
          title: "Authentication Error",
          description: "Please log in to generate your QR code.",
          variant: "destructive",
        });
        return;
      }

      // Persistent login URL based on userId
      const loginUrlWithUserId = `${window.location.origin}/login-with-qr?userId=${encodeURIComponent(userId)}`;
      
      const generatedQrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(loginUrlWithUserId)}&size=250x250&format=png`;
      
      setQrCodeUrl(generatedQrUrl);
      setIsLoadingQr(false);
    };

    generateQrCode();
  }, [toast]);

  const handleDownloadQr = () => {
    if (!qrCodeUrl) {
      toast({ title: "Error", description: "QR Code not available for download.", variant: "destructive"});
      return;
    }
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.setAttribute('download', `employer_login_qr_${companyName || 'JobsAI'}.png`); 
    link.setAttribute('target', '_blank');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({title: "Downloading QR Code", description: "If download doesn't start, try right-click & Save Image.", variant: "default"});
  };


  return (
    <Card className="shadow-xl border-border rounded-xl overflow-hidden">
      <CardHeader className="border-b border-border bg-secondary/20 p-6">
        <CardTitle className="text-2xl flex items-center gap-3 text-primary">
          <QrCodeIcon className="h-7 w-7" /> My Login QR Code
        </CardTitle>
        <CardDescription>Scan this persistent QR code with a device to quickly log in to your employer account. Keep it secure.</CardDescription>
      </CardHeader>
      <CardContent className="p-6 md:p-8 space-y-6">
        <div className="flex flex-col items-center text-center">
          {isLoadingQr && (
            <div className="w-[250px] h-[250px] bg-muted flex flex-col items-center justify-center rounded-lg shadow-inner border border-dashed">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="mt-2 text-sm text-muted-foreground">Generating QR Code...</p>
            </div>
          )}
          {errorQr && !isLoadingQr && (
             <div className="w-[250px] h-[250px] bg-destructive/10 border border-destructive/30 flex flex-col items-center justify-center rounded-lg shadow-inner p-4">
              <AlertTriangle className="h-12 w-12 text-destructive mb-2" />
              <p className="text-sm text-destructive font-medium">Error Generating QR Code</p>
              <p className="text-xs text-destructive/80 mt-1">{errorQr}</p>
            </div>
          )}
          {!isLoadingQr && qrCodeUrl && !errorQr && (
            <div className="flex flex-col items-center">
              <div className="p-4 border-2 border-dashed border-primary/30 rounded-lg bg-background mb-3 inline-block shadow-lg">
                <Image 
                  src={qrCodeUrl} 
                  alt="Employer Login QR Code" 
                  width={250} 
                  height={250} 
                  className="rounded-md"
                  data-ai-hint="login qr code"
                />
              </div>
              {companyName && <p className="text-lg font-semibold text-foreground">{companyName}</p>}
            </div>
          )}
          <p className="text-sm text-muted-foreground max-w-md mt-2">
            This QR code provides a quick way to log in. Treat it like your password and do not share it publicly.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <Button onClick={handleDownloadQr} variant="default" disabled={isLoadingQr || !qrCodeUrl || !!errorQr} className="bg-primary text-primary-foreground hover:bg-primary/90 transition-default hover:shadow-md">
              <Download className="mr-2 h-4 w-4" /> Download QR (PNG)
            </Button>
          </div>
        </div>
        <Card className="mt-8 p-4 bg-destructive/5 border-destructive/20">
          <CardDescription className="text-xs text-destructive/80 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0"/>
            <span>
              <strong>Security Notice:</strong> This QR code login method is simplified for demonstration and uses a directly embedded user ID. 
              For production systems, a more secure server-side token generation, validation, and expiration mechanism is required. Do not use this method for sensitive accounts in a live environment.
            </span>
          </CardDescription>
        </Card>
      </CardContent>
    </Card>
  );
}
