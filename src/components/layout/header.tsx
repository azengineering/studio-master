// src/components/layout/header.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Briefcase,
  Home,
  Info,
  LogIn,
  LogOut,
  UserPlus,
  Wrench,
  Search,
  Menu,
  Settings,
  SlidersHorizontal,
  Mail,
  PlusCircle,
  UserCircle,
  Users,
  Building2,
  Repeat, // For role switching
  QrCode,
  UserSearch, // Added UserSearch icon
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { logoutAction } from '@/app/(auth)/actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface HeaderProps {
  role: 'jobSeeker' | 'employer';
}

const jobSeekerNav = [
  { href: '/jobSeeker', label: 'Home', icon: Home },
  { href: '/jobSeeker/find-jobs', label: 'Find Jobs', icon: Search },
  { href: '/jobSeeker/dashboard', label: 'Dashboard', icon: Settings },
  { href: '/jobSeeker/tools', label: 'AI Tools', icon: Wrench },
  { href: '/jobSeeker/about', label: 'About', icon: Info },
  { href: '/contact', label: 'Contact', icon: Mail },
];

const employerNav = [
  { href: '/employer', label: 'Home', icon: Home },
  { href: '/employer/post-job', label: 'Post Job', icon: PlusCircle },
  { href: '/employer/control', label: 'Control Panel', icon: Settings },
  { href: '/employer/candidate-search-ui-test', label: 'Find Candidates', icon: UserSearch }, // Updated href
  { href: '/employer/tools', label: 'Recruiter Tools', icon: SlidersHorizontal },
  { href: '/employer/about', label: 'About', icon: Info },
  { href: '/contact', label: 'Contact', icon: Mail },
];

export function Header({ role }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const updateAuthState = useCallback(() => {
    if (typeof window !== 'undefined') {
      const storedUserId = localStorage.getItem('userId');
      const storedUserEmail = localStorage.getItem('userEmail');
      const storedUserRole = localStorage.getItem('userRole');
      const storedCompanyLogoUrl = localStorage.getItem('companyLogoUrl');

      const loggedInStatus = !!storedUserId;
      setIsLoggedIn(loggedInStatus);
      setUserEmail(loggedInStatus ? storedUserEmail : null);
      setCurrentUserRole(loggedInStatus ? storedUserRole : null);

      if (loggedInStatus && storedUserRole === 'employer' && storedCompanyLogoUrl) {
        setCompanyLogoUrl(storedCompanyLogoUrl);
      } else {
        setCompanyLogoUrl(null);
      }
    }
  }, []);

  useEffect(() => {
    updateAuthState(); 

    const handleStorageChange = (event: StorageEvent) => {
      if (['userId', 'userEmail', 'userRole', 'companyLogoUrl'].includes(event.key || '')) {
        updateAuthState();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    if (pathname) { 
        updateAuthState();
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [pathname, updateAuthState]);

  const performLogout = useCallback(async (message?: string, redirectPath?: string) => {
    const roleBeforeLogout = currentUserRole || role; 
    await logoutAction(); 
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userId');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
      localStorage.removeItem('companyLogoUrl');
      localStorage.removeItem('isAdminAuthenticated'); // Clear admin auth if it exists
      localStorage.removeItem('isAuthenticated');
    }
    updateAuthState(); 
    if (message) {
      toast({ title: "Session Update", description: message, variant: "default", duration: 5000 });
    } else {
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.', variant: 'default' });
    }
    router.push(redirectPath || (roleBeforeLogout === 'jobSeeker' ? '/jobSeeker' : roleBeforeLogout === 'employer' ? '/employer' : '/'));
  }, [toast, router, updateAuthState, currentUserRole, role]);


  const handleRoleSwitchAndNavigate = useCallback(async (targetRole: 'jobSeeker' | 'employer') => {
    const currentRoleFromStorage = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
    const userIdFromStorage = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

    if (userIdFromStorage && currentRoleFromStorage && currentRoleFromStorage !== targetRole) {
      await performLogout(
        `Switched to ${targetRole} view. Your previous session as ${currentRoleFromStorage} has been logged out.`,
        targetRole === 'jobSeeker' ? '/jobSeeker' : '/employer'
      );
    } else {
      router.push(targetRole === 'jobSeeker' ? '/jobSeeker' : '/employer');
    }
  }, [performLogout, router]);


  const getInitials = (email: string | null) => {
    if (!email) return 'U';
    const namePart = email.split('@')[0];
    if (!namePart) return 'U';
    if (namePart.length === 1) return namePart.toUpperCase();
    const parts = namePart.split(/[._-]/);
    if (parts.length > 1 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (namePart[0] + (namePart.length > 1 ? namePart[1] : '')).toUpperCase();
  };

  const handleDropdownNavigation = (path: string, section?: string) => {
    if (section && typeof window !== 'undefined') {
      localStorage.setItem('employerControlActiveSection', section);
    }
    router.push(path);
  };

  const navItems = role === 'jobSeeker' ? jobSeekerNav : employerNav;
  const targetSwitchRole = role === 'jobSeeker' ? 'employer' : 'jobSeeker';
  const switchRoleButtonTooltip = `Switch to ${targetSwitchRole.charAt(0).toUpperCase() + targetSwitchRole.slice(1)} View`;

  return (
    <TooltipProvider>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 md:px-6">
          <Link href={role === 'jobSeeker' ? '/jobSeeker' : '/employer'} className="flex items-center space-x-2 mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 text-primary">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="m9.09 9 1.82 1.82L12 9.09l1.09 1.82 1.82-1.82"/><path d="m14.91 12-1.82 1.82L12 12.09l-1.09 1.82-1.82-1.82"/><path d="m12 15 1.82 1.82L15 15.09l1.09 1.82 1.82-1.82"/><path d="m9.09 15 1.82 1.82L12 15.09l-1.09 1.82-1.82-1.82"/>
            </svg>
            <span className="font-bold text-xl">JobsAI</span>
          </Link>

          <nav className="hidden md:flex flex-grow items-center justify-start space-x-0.5 lg:space-x-1 text-sm font-medium overflow-x-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 text-foreground/70 transition-colors hover:text-primary px-2 py-1.5 rounded-md hover:bg-primary/5 whitespace-nowrap",
                  pathname === item.href && "text-primary bg-primary/10 font-semibold"
                  )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRoleSwitchAndNavigate(targetSwitchRole)}
                  className="ml-1 text-foreground/70 hover:text-primary hover:bg-primary/5 h-8 w-8"
                  aria-label={switchRoleButtonTooltip}
                >
                  <Repeat className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{switchRoleButtonTooltip}</p>
              </TooltipContent>
            </Tooltip>
          </nav>

          <div className="hidden md:flex items-center space-x-2 ml-auto pl-4">
            {isLoggedIn && currentUserRole === role ? (
               <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                    <Avatar className="h-9 w-9 border-2 border-primary/50">
                      {currentUserRole === 'employer' && companyLogoUrl ? (
                          <AvatarImage src={companyLogoUrl} alt={userEmail || 'Employer Logo'} />
                      ) : userEmail && currentUserRole === 'jobSeeker' ? (
                          <AvatarImage src={`https://placehold.co/60x60/FFA500/000000.png?text=${getInitials(userEmail)}&font=Montserrat`} alt={userEmail || 'User'} />
                      ) : null }
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                        {getInitials(userEmail)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-foreground truncate">{userEmail || 'User'}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        Logged in as: {currentUserRole === 'jobSeeker' ? 'Job Seeker' : 'Employer'}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => handleDropdownNavigation(currentUserRole === 'jobSeeker' ? '/jobSeeker/dashboard' : '/employer/control')} className="flex items-center gap-2 cursor-pointer">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    {currentUserRole === 'jobSeeker' ? 'My Dashboard' : 'Control Panel'}
                  </DropdownMenuItem>
                   {currentUserRole === 'employer' && (
                     <>
                      <DropdownMenuItem onSelect={() => handleDropdownNavigation('/employer/control', 'profile')} className="flex items-center gap-2 cursor-pointer">
                        <UserCircle className="h-4 w-4 text-muted-foreground" />
                        Company Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleDropdownNavigation('/employer/control', 'myQrCode')} className="flex items-center gap-2 cursor-pointer">
                        <QrCode className="h-4 w-4 text-muted-foreground" />
                        My QR Code
                      </DropdownMenuItem>
                     </>
                   )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => performLogout()} className="flex items-center gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer">
                    <LogOut className="h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={{ pathname: "/login", query: { role: role, from: pathname }}}>
                    <LogIn className="mr-1 h-4 w-4"/> Login
                  </Link>
                </Button>
                <Button variant="default" size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                   <Link href={{ pathname: "/signup", query: { role: role, from: pathname }}}>
                      <UserPlus className="mr-1 h-4 w-4" /> Sign Up
                   </Link>
                </Button>
              </>
            )}
          </div>

          <div className="md:hidden ml-auto">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[320px] p-0 flex flex-col">
                 <SheetHeader className="p-4 pb-2 border-b border-border">
                   <SheetTitle>
                    <SheetClose asChild>
                      <Link href={role === 'jobSeeker' ? '/jobSeeker' : '/employer'} className="flex items-center space-x-2">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9.09 9 1.82 1.82L12 9.09l1.09 1.82 1.82-1.82"/><path d="m14.91 12-1.82 1.82L12 12.09l-1.09 1.82-1.82-1.82"/><path d="m12 15 1.82 1.82L15 15.09l1.09 1.82 1.82-1.82"/><path d="m9.09 15 1.82 1.82L12 15.09l-1.09 1.82-1.82-1.82"/>
                          </svg>
                          <span className="font-bold text-lg">JobsAI</span>
                      </Link>
                      </SheetClose>
                   </SheetTitle>
                 </SheetHeader>

                 <nav className="flex flex-col p-4 space-y-1 flex-grow overflow-y-auto">
                   {navItems.map((item) => (
                    <SheetClose asChild key={item.href}>
                     <Link
                       href={item.href}
                       className={cn(
                         "flex items-center gap-3 text-base text-foreground/80 transition-colors hover:text-primary hover:bg-primary/10 p-3 rounded-md",
                         pathname === item.href && "text-primary bg-primary/10 font-semibold"
                         )}
                     >
                       <item.icon className="h-5 w-5" />
                       {item.label}
                     </Link>
                     </SheetClose>
                   ))}
                    <SheetClose asChild>
                      <Button
                        variant="ghost"
                        onClick={() => handleRoleSwitchAndNavigate(targetSwitchRole)}
                        className="w-full justify-start flex items-center gap-3 text-base text-foreground/80 hover:text-primary hover:bg-primary/10 p-3 rounded-md"
                        aria-label={switchRoleButtonTooltip}
                      >
                        <Repeat className="h-5 w-5" />
                        {switchRoleButtonTooltip}
                      </Button>
                    </SheetClose>
                  </nav>
                  <div className="p-4 border-t border-border space-y-3 mt-auto">
                   {isLoggedIn && currentUserRole === role ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-2 rounded-md bg-secondary">
                           <Avatar className="h-8 w-8">
                              {currentUserRole === 'employer' && companyLogoUrl ? (
                                  <AvatarImage src={companyLogoUrl} alt={userEmail || 'Employer Logo'} />
                              ) : userEmail && currentUserRole === 'jobSeeker' ? (
                                  <AvatarImage src={`https://placehold.co/60x60/FFA500/000000.png?text=${getInitials(userEmail)}&font=Montserrat`} alt={userEmail || 'User'} />
                              ) : null}
                              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                              {getInitials(userEmail)}
                              </AvatarFallback>
                          </Avatar>
                          <div>
                              <p className="text-xs font-medium leading-none text-foreground truncate">{userEmail}</p>
                              <p className="text-xs leading-none text-muted-foreground">
                                  {currentUserRole === 'jobSeeker' ? 'Job Seeker' : 'Employer'}
                              </p>
                          </div>
                        </div>
                        <SheetClose asChild>
                         <Button variant="outline" size="lg" onClick={() => performLogout()} className="w-full justify-start text-base">
                          <LogOut className="mr-3 h-5 w-5"/> Log Out
                        </Button>
                        </SheetClose>
                      </div>
                   ) : (
                      <>
                       <SheetClose asChild>
                       <Button variant="ghost" size="lg" asChild className="w-full justify-start text-base">
                         <Link href={{ pathname: "/login", query: { role: role, from: pathname }}}>
                           <LogIn className="mr-3 h-5 w-5"/> Login
                         </Link>
                       </Button>
                       </SheetClose>
                       <SheetClose asChild>
                       <Button variant="default" size="lg" className="w-full justify-start text-base bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                          <Link href={{ pathname: "/signup", query: { role: role, from: pathname }}}>
                             <UserPlus className="mr-3 h-5 w-5" /> Sign Up
                          </Link>
                       </Button>
                       </SheetClose>
                     </>
                   )}
                 </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}