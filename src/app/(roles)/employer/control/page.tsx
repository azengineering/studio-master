// src/app/(roles)/employer/control/page.tsx
'use client';

import React, { useState, Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserCircle, Briefcase, CheckSquare, Settings, ChevronRight, Loader2, PanelLeftOpen, PanelRightOpen, QrCode, BarChart3 } from 'lucide-react';
import ProfileSection from './sections/profile-section';
import JobManagementSection from './sections/job-management';
import TrackApplicationsSection from './sections/track-applications-section';
import AnalyticsSection from './sections/analytics-section'; // Added import for AnalyticsSection
import AccountSettingsSection from './sections/account-settings-section'; // Using relative path
import MyQrCodeSection from './sections/my-qr-code-section';
import { cn } from '@/lib/utils';
import { AuthRequiredModal } from '@/components/AuthRequiredModal';


type ControlSection = 'profile' | 'manageJobs' | 'trackApplications' | 'analytics' | 'myQrCode' | 'settings'; // Added 'analytics'

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  section: ControlSection;
  isActive: boolean;
  isCollapsed: boolean;
  onClick: () => void;
}

const navigationItems = [
  { icon: UserCircle, label: 'Company Profile', section: 'profile' as ControlSection },
  { icon: Briefcase, label: 'Manage Jobs', section: 'manageJobs' as ControlSection },
  { icon: CheckSquare, label: 'Track Applications', section: 'trackApplications' as ControlSection },
  { icon: BarChart3, label: 'Analytics', section: 'analytics' as ControlSection }, // New Analytics item
  { icon: QrCode, label: 'My QR Code', section: 'myQrCode' as ControlSection },
  { icon: Settings, label: 'Account Settings', section: 'settings' as ControlSection },
];

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, section, isActive, isCollapsed, onClick }) => {
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
    <span className="ml-2">Loading Control Panel...</span>
  </div>
);


export default function EmployerControlPage() {
  const [activeSection, setActiveSection] = useState<ControlSection | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [authStatus, setAuthStatus] = useState<'loading' | 'authorized' | 'unauthorized'>('loading');
  const router = useRouter();

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    const requiredRole = 'employer';

    if (!userId || userRole !== requiredRole) {
        setAuthStatus('unauthorized');
    } else {
        setAuthStatus('authorized');
    }

    const storedCollapseState = localStorage.getItem('employerControlSidebarCollapsed');
    if (storedCollapseState) {
      setIsSidebarCollapsed(JSON.parse(storedCollapseState));
    }
    
    const storedSection = localStorage.getItem('employerControlActiveSection') as ControlSection | null;
    if (storedSection && navigationItems.some(item => item.section === storedSection)) {
      setActiveSection(storedSection);
    } else {
      setActiveSection('profile'); 
    }

  }, []);

  const handleSectionChange = (section: ControlSection) => {
    setActiveSection(section);
    localStorage.setItem('employerControlActiveSection', section);
  };


  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const newState = !prev;
      localStorage.setItem('employerControlSidebarCollapsed', JSON.stringify(newState));
      return newState;
    });
  };

  if (authStatus === 'loading') {
    return <PageLoader />;
  }
  
  if (authStatus === 'unauthorized') {
    return <AuthRequiredModal 
              isOpen={true} 
              onCloseAndGoBack={() => router.back()}
              userRole="employer" 
           />;
  }


  const renderSectionContent = () => {
    if (authStatus !== 'authorized') {
      return null; 
    }
    const sectionFallback = <div className="flex justify-center items-center h-full py-10"><Loader2 className="h-10 w-10 animate-spin text-primary"/></div>;
    
    switch (activeSection) {
      case 'profile':
        return <Suspense fallback={sectionFallback}><ProfileSection /></Suspense>;
      case 'manageJobs':
        return <Suspense fallback={sectionFallback}><JobManagementSection /></Suspense>;
      case 'trackApplications':
        return <Suspense fallback={sectionFallback}><TrackApplicationsSection /></Suspense>;
      case 'analytics': // New case for Analytics
        return <Suspense fallback={sectionFallback}><AnalyticsSection /></Suspense>;
      case 'myQrCode':
        return <Suspense fallback={sectionFallback}><MyQrCodeSection /></Suspense>;
      case 'settings':
        return <Suspense fallback={sectionFallback}><AccountSettingsSection /></Suspense>;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full min-h-[calc(100vh-var(--header-height)-6rem)] text-center bg-card border border-border rounded-xl shadow-lg p-10">
            <Settings className="h-20 w-20 text-primary/60 mb-6" />
            <h2 className="text-2xl font-semibold text-foreground">Welcome to Your Control Center</h2>
            <p className="text-muted-foreground mt-3 max-w-md text-base">
              Select an option from the sidebar to manage your employer profile, job postings, applications, and account settings.
            </p>
          </div>
        );
    }
  };

  const headerHeight = '4rem'; 
  const collapsedSidebarWidth = '4.5rem'; 
  const expandedSidebarWidth = '18rem'; 

  if (authStatus !== 'authorized') {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-secondary/30" style={{paddingTop: headerHeight}}>
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
                <Settings className="h-6 w-6" /> Control Panel
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
          {!isSidebarCollapsed && <p className="text-xs text-muted-foreground mt-1">Manage your employer account.</p>}
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
  );
}
