
'use client';

import Link from 'next/link';
import { Github, Linkedin, Twitter, Youtube, Instagram, Mail, Phone, InfoIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface FooterProps {
  role?: 'jobSeeker' | 'employer';
}

export function Footer({ role }: FooterProps) {
  const pathname = usePathname();
  const showJobSeekerLinks = role === 'jobSeeker' || !role;
  const showEmployerLinks = role === 'employer' || !role;

  // Minimal footer for employer control panel and find candidates page
  const isMinimalFooterPage =
    pathname === '/employer/control' ||
    pathname.startsWith('/employer/control/') ||
    pathname === '/employer/candidate-search-ui-test'; // Updated this line

  if (isMinimalFooterPage) {
    return (
      <footer className="border-t border-border bg-background">
        <div className="container max-w-screen-lg py-6 px-4 md:px-6">
          <div className="flex justify-end">
            <p className="text-xs text-muted-foreground space-x-4 flex flex-wrap items-center justify-end">
              <Link href="/contact" className="hover:text-primary transition-default flex items-center">
                <InfoIcon className="h-4 w-4 mr-1.5" /> Contact Support
              </Link>
              <span className="hidden sm:inline">|</span>
              <a href="mailto:support@jobsai.com" className="hover:text-primary transition-default flex items-center mt-2 sm:mt-0">
                <Mail className="h-4 w-4 mr-1.5" /> support@jobsai.com
              </a>
              <span className="hidden sm:inline">|</span>
              <a href="tel:+12345678900" className="hover:text-primary transition-default flex items-center mt-2 sm:mt-0">
                <Phone className="h-4 w-4 mr-1.5" /> +1 (234) 567-8900
              </a>
            </p>
          </div>
        </div>
      </footer>
    );
  }

  // Main footer for other pages
  return (
    <footer className="border-t border-border bg-secondary/50 mt-12">
      <div className="container max-w-screen-2xl py-12 px-4 md:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-10">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-3">
             <Link href="/" className="flex items-center space-x-2">
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 text-primary">
                 <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                 <path d="m9.09 9 1.82 1.82L12 9.09l1.09 1.82 1.82-1.82"/>
                 <path d="m14.91 12-1.82 1.82L12 12.09l-1.09 1.82-1.82-1.82"/>
                 <path d="m12 15 1.82 1.82L15 15.09l1.09 1.82 1.82-1.82"/>
                 <path d="m9.09 15 1.82 1.82L12 15.09l-1.09 1.82-1.82-1.82"/>
               </svg>
               <span className="font-bold text-xl text-foreground">JobsAI</span>
             </Link>
            <p className="text-sm text-muted-foreground pr-4">
              Connecting talent with opportunity through the power of AI. Find your next role or hire smarter with our intelligent platform.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="text-muted-foreground hover:text-primary transition-default">About Us</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-primary transition-default">Contact</Link></li>
              <li><Link href="/#faq" className="text-muted-foreground hover:text-primary transition-default">FAQ</Link></li>
              <li><Link href="/blog" className="text-muted-foreground hover:text-primary transition-default">Blog</Link></li>
            </ul>
          </div>

          {/* For Job Seekers */}
          {showJobSeekerLinks && (
            <div>
              <h4 className="font-semibold text-foreground mb-4">For Job Seekers</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/jobSeeker/find-jobs" className="text-muted-foreground hover:text-primary transition-default">Find Jobs</Link></li>
                <li><Link href="/jobSeeker/tools" className="text-muted-foreground hover:text-primary transition-default">AI Job Tools</Link></li>
                <li><Link href="/jobSeeker#how-it-works" className="text-muted-foreground hover:text-primary transition-default">How It Works</Link></li>
                <li><Link href="/signup?role=jobSeeker" className="text-muted-foreground hover:text-primary transition-default">Create Profile</Link></li>
              </ul>
            </div>
          )}

          {/* For Employers */}
          {showEmployerLinks && (
            <div>
              <h4 className="font-semibold text-foreground mb-4">For Employers</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/employer/control" className="text-muted-foreground hover:text-primary transition-default">Employer Dashboard</Link></li>
                <li><Link href="/employer/tools" className="text-muted-foreground hover:text-primary transition-default">Recruiter Tools</Link></li>
               <li><Link href="/employer#pricing" className="text-muted-foreground hover:text-primary transition-default">Pricing</Link></li>
                <li><Link href="/signup?role=employer" className="text-muted-foreground hover:text-primary transition-default">Employer Account</Link></li>
              </ul>
            </div>
          )}
        </div>

        {/* Bottom Bar: Copyright and Social Links */}
        <div className="mt-10 pt-6 border-t border-border/60 flex flex-col md:flex-row md:justify-center items-center text-center space-y-3 md:space-y-0 md:space-x-6">
          <p className="text-xs text-muted-foreground text-center md:text-center">
            © {new Date().getFullYear()} JobsAI Technologies Inc. All rights reserved.
             <Link href="/privacy" className="ml-2 hover:text-primary transition-default">Privacy Policy</Link>
             <span className="mx-1 text-muted-foreground/50">|</span>
             <Link href="/terms" className="hover:text-primary transition-default">Terms of Service</Link>
          </p>
          <div className="flex space-x-3 justify-center">
              <Link href="#" aria-label="JobsAI on Twitter" className="text-muted-foreground hover:text-primary transition-default">
                  <Twitter className="h-4 w-4" />
              </Link>
               <Link href="#" aria-label="JobsAI on LinkedIn" className="text-muted-foreground hover:text-primary transition-default">
                  <Linkedin className="h-4 w-4" />
              </Link>
               <Link href="#" aria-label="JobsAI on GitHub" className="text-muted-foreground hover:text-primary transition-default">
                  <Github className="h-4 w-4" />
              </Link>
              <Link href="#" aria-label="JobsAI on Instagram" className="text-muted-foreground hover:text-primary transition-default">
                  <Instagram className="h-4 w-4" />
              </Link>
               <Link href="#" aria-label="JobsAI on YouTube" className="text-muted-foreground hover:text-primary transition-default">
                  <Youtube className="h-4 w-4" />
              </Link>
           </div>
        </div>
      </div>
    </footer>
  );
}
    