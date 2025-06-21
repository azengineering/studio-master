
'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { UserCircle, Briefcase, Wand2, Settings, ChevronRight, Loader2, PanelLeftOpen, PanelRightOpen, Mail, Phone, InfoIcon as GeneralInfoIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AuthRequiredModal } from '@/components/AuthRequiredModal';
import Link from 'next/link';

// Dynamically import sections for better code splitting
const ProfileSection = React.lazy(() => import('./sections/profile-section'));
const JobActivitiesSection = React.lazy(() => import('./sections/job-activities-section'));
const AiToolsSection = React.lazy(() => import('./sections/ai-tools-section'));
const AccountSettingsSection = React.lazy(() => import('./sections/account-settings-section'));

type DashboardSection = 'profile' | 'jobActivities' | 'aiTools' | 'settings';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  section: DashboardSection;
  isActive: boolean;
  isCollapsed: boolean;
  onClick: () => void;
}

const navigationItems: Array<{ icon: React.ElementType; label: string; section: DashboardSection }> = [
  { icon: UserCircle, label: 'My Profile', section: 'profile' },
  { icon: Briefcase, label: 'My Job Activities', section: 'jobActivities' },
  { icon: Wand2, label: 'AI Tools', section: 'aiTools' },
  { icon: Settings, label: 'Account Settings', section: 'settings' },
];

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, isActive, isCollapsed, onClick }) => {
  return (
    <Button
      variant={isActive ? 'default' : 'ghost'}
      className={cn(
        `w-full justify-start text-sm h-12 rounded-lg transition-all duration-200 ease-in-out group`,
        isCollapsed ? 'px-3 justify-center' : 'px-4',
        isActive
          ? 'font-semibold text-primary-foreground bg-primary shadow-lg hover:bg-primary/90'
          : 'text-muted-foreground hover:bg-primary/5 hover:text-primary'
      )}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      title={isCollapsed ? label : undefined}
    >
      <Icon className={cn(`h-5 w-5 transition-colors`,
        isCollapsed ? '' : 'mr-3',
        isActive ? 'text-primary-foreground' : 'text-primary group-hover:text-primary')} />
      {!isCollapsed && label}
      {!isCollapsed && isActive && <ChevronRight className="ml-auto h-5 w-5 text-primary-foreground" />}
    </Button>
  );
};

const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <span className="ml-2">Loading Dashboard...</span>
  </div>
);

export default function JobSeekerDashboardPage() {
  const [activeSection, setActiveSection] = useState<DashboardSection | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [authStatus, setAuthStatus] = useState<'loading' | 'authorized' | 'unauthorized'>('loading');
  const router = useRouter();

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    const requiredRole = 'jobSeeker';

    if (!userId || userRole !== requiredRole) {
        setAuthStatus('unauthorized');
    } else {
        setAuthStatus('authorized');
    }

    const storedCollapseState = localStorage.getItem('jobSeekerDashboardSidebarCollapsed');
    if (storedCollapseState) {
      setIsSidebarCollapsed(JSON.parse(storedCollapseState));
    }
    
    const storedSection = localStorage.getItem('jobSeekerDashboardActiveSection') as DashboardSection | null;
    if (storedSection && navigationItems.some(item => item.section === storedSection)) {
      setActiveSection(storedSection);
    } else {
      setActiveSection('profile'); 
    }
  }, []);

  const handleSectionChange = useCallback((section: DashboardSection) => {
    setActiveSection(section);
    localStorage.setItem('jobSeekerDashboardActiveSection', section);
  }, []);

  const toggleSidebarCollapse = useCallback(() => {
    setIsSidebarCollapsed(prev => {
      const newState = !prev;
      localStorage.setItem('jobSeekerDashboardSidebarCollapsed', JSON.stringify(newState));
      return newState;
    });
  }, []);

  if (authStatus === 'loading') {
    return <PageLoader />;
  }
  
  if (authStatus === 'unauthorized') {
    return <AuthRequiredModal 
              isOpen={true} 
              onCloseAndGoBack={() => router.back()}
              userRole="jobSeeker" 
           />;
  }

  const renderSectionContent = () => {
    if (authStatus !== 'authorized') return null;
    
    const sectionFallback = <div className="flex justify-center items-center h-full py-10"><Loader2 className="h-10 w-10 animate-spin text-primary"/></div>;

    switch (activeSection) {
      case 'profile':
        return <Suspense fallback={sectionFallback}><ProfileSection /></Suspense>;
      case 'jobActivities':
        return <Suspense fallback={sectionFallback}><JobActivitiesSection /></Suspense>;
      case 'aiTools':
        return <Suspense fallback={sectionFallback}><AiToolsSection /></Suspense>;
      case 'settings':
        return <Suspense fallback={sectionFallback}><AccountSettingsSection /></Suspense>;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full min-h-[calc(100vh-var(--header-height)-6rem)] text-center bg-card border border-border rounded-xl shadow-lg p-10">
            <Settings className="h-20 w-20 text-primary/60 mb-6" />
            <h2 className="text-2xl font-semibold text-foreground">Welcome to Your Dashboard</h2>
            <p className="text-muted-foreground mt-3 max-w-md text-base">
              Select an option from the sidebar to manage your profile, job activities, and tools.
            </p>
          </div>
        );
    }
  };

  const headerHeight = '4rem'; 
  const collapsedSidebarWidth = '4.5rem'; 
  const expandedSidebarWidth = '18rem'; 

  if (authStatus !== 'authorized') return null;

  return (
    <div className="flex flex-col min-h-screen"> 
      <div className="flex flex-grow bg-secondary/30" style={{paddingTop: headerHeight}}>
        <aside
          className={cn(
            "fixed top-0 left-0 h-full bg-card border-r border-border shadow-lg overflow-y-auto transition-all duration-300 ease-in-out",
            isSidebarCollapsed ? `w-[${collapsedSidebarWidth}]` : `w-1/4 max-w-[${expandedSidebarWidth}]`
          )}
          style={{ paddingTop: `calc(${headerHeight} + 1rem)`, 
                   width: isSidebarCollapsed ? collapsedSidebarWidth : expandedSidebarWidth
          }}
        >
          <div className={cn(
            "pb-4 mb-4 border-b border-border",
            isSidebarCollapsed ? 'px-2 text-center' : 'px-6'
          )}>
            <div className={cn("flex items-center", isSidebarCollapsed ? "justify-center" : "justify-between")}>
              {!isSidebarCollapsed && (
                  <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                  <Settings className="h-6 w-6" /> My Dashboard
                  </h2>
              )}
              <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleSidebarCollapse}
                  className={cn(
                      "text-primary border-primary/50 hover:bg-primary/10 active:bg-primary/20", 
                      isSidebarCollapsed ? "mx-auto" : ""
                  )}
                  aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {isSidebarCollapsed ? <PanelRightOpen className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
                </Button>
            </div>
            {!isSidebarCollapsed && <p className="text-xs text-muted-foreground mt-1">Manage your job seeking journey.</p>}
          </div>
          <nav className={cn("space-y-2", isSidebarCollapsed ? 'px-2' : 'px-6')}>
            {navigationItems.map((item) => (
              <NavItem
                key={item.section}
                icon={item.icon}
                label={item.label}
                section={item.section}
                isActive={activeSection === item.section}
                isCollapsed={isSidebarCollapsed}
                onClick={() => handleSectionChange(item.section)}
              />
            ))}
          </nav>
        </aside>

        <main
          className={cn(
            "p-6 md:p-8 space-y-8 overflow-y-auto flex-grow",
            isSidebarCollapsed ? `ml-[${collapsedSidebarWidth}] w-[calc(100%-${collapsedSidebarWidth})]` : `ml-[25%] w-[calc(100%-25%)] max-ml-[${expandedSidebarWidth}]`
          )}
          style={{minHeight: `calc(100vh - ${headerHeight})`, 
                  marginLeft: isSidebarCollapsed ? collapsedSidebarWidth : expandedSidebarWidth,
                  width: `calc(100% - ${isSidebarCollapsed ? collapsedSidebarWidth : expandedSidebarWidth})`
          }}
          >
          {renderSectionContent()}
        </main>
      </div>
      <footer className="border-t border-border bg-background py-6">
        <div className="container max-w-screen-lg text-center">
          <p className="text-xs text-muted-foreground space-x-4 flex flex-wrap items-center justify-center">
            <Link href="/contact" className="hover:text-primary transition-default flex items-center">
              <GeneralInfoIcon className="h-4 w-4 mr-1.5" /> Contact Support
            </Link>
            <span className="hidden sm:inline text-muted-foreground/50">|</span>
            <a href="mailto:support@jobsai.com" className="hover:text-primary transition-default flex items-center mt-2 sm:mt-0">
              <Mail className="h-4 w-4 mr-1.5" /> support@jobsai.com
            </a>
            <span className="hidden sm:inline text-muted-foreground/50">|</span>
            <a href="tel:+12345678900" className="hover:text-primary transition-default flex items-center mt-2 sm:mt-0">
              <Phone className="h-4 w-4 mr-1.5" /> +1 (234) 567-8900
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
