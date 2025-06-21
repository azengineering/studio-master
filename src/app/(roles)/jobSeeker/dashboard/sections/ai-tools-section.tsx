// src/app/(roles)/jobSeeker/dashboard/sections/ai-tools-section.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wand2, ArrowRight } from 'lucide-react';

export default function AiToolsSection() {
  return (
    <Card className="shadow-xl border-border rounded-xl overflow-hidden">
      <CardHeader className="border-b border-border bg-secondary/20 p-6">
        <CardTitle className="text-2xl flex items-center gap-3 text-primary">
          <Wand2 className="h-7 w-7" /> AI Career Tools
        </CardTitle>
        <CardDescription>Leverage artificial intelligence to boost your job search.</CardDescription>
      </CardHeader>
      <CardContent className="p-6 md:p-8">
        <div className="space-y-6">
          <p className="text-muted-foreground">
            Our suite of AI-powered tools is designed to help you optimize your resume, prepare for interviews,
            and gain valuable insights into your career path.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="hover:shadow-md transition-shadow">
                <CardHeader><CardTitle className="text-lg">AI Job Matcher</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">Paste your profile and job descriptions to find the best matches.</p>
                    <Button asChild variant="outline">
                        <Link href="/jobSeeker/tools">Use Job Matcher <ArrowRight className="ml-2 h-4 w-4"/></Link>
                    </Button>
                </CardContent>
            </Card>
             <Card className="hover:shadow-md transition-shadow opacity-50 cursor-not-allowed">
                <CardHeader><CardTitle className="text-lg">AI Resume Analyzer</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">Get instant feedback on your resume. (Coming Soon)</p>
                    <Button variant="outline" disabled>Analyze Resume</Button>
                </CardContent>
            </Card>
             <Card className="hover:shadow-md transition-shadow opacity-50 cursor-not-allowed">
                <CardHeader><CardTitle className="text-lg">Interview Prep Kit</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">Practice common interview questions. (Coming Soon)</p>
                    <Button variant="outline" disabled>Start Prep</Button>
                </CardContent>
            </Card>
          </div>
           <div className="text-center mt-8">
             <Button asChild variant="default" size="lg" className="bg-primary hover:bg-primary/90">
                <Link href="/jobSeeker/tools">
                    Explore All AI Tools
                </Link>
             </Button>
           </div>
        </div>
      </CardContent>
    </Card>
  );
}
