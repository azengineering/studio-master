
// src/app/(admin)/admin-panel/layout.tsx
'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Users, Briefcase, Settings as SettingsIcon, ChevronRight, PanelLeftOpen, PanelRightOpen, Loader2, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Updated type for section keys to match route paths
type AdminPanelSectionKey = 'dashboard' | 'employer-data' | 'jobseeker-data' | 'settings';

interface AdminNavItem {
  icon: React.ElementType;
  label: string;
  section: AdminPanelSectionKey;
  path: string;
}

const adminNavigationItems: AdminNavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', section: 'dashboard', path: '/admin-panel' },
  { icon: Briefcase, label: 'Employer Data', section: 'employer-data', path: '/admin-panel/employer-data' },
  { icon: Users, label: 'Job Seeker Data', section: 'jobseeker-data', path: '/admin-panel/jobseeker-data' },
  { icon: SettingsIcon, label: 'Admin Settings', section: 'settings', path: '/admin-panel/settings' },
];

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  section: AdminPanelSectionKey;
  path: string; // Added path prop
  isActive: boolean;
  isCollapsed: boolean;
  onClick: (section: AdminPanelSectionKey, path: string) => void; // Updated onClick signature
}

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, section, path, isActive, isCollapsed, onClick }) => {
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
      onClick={() => onClick(section, path)} // Pass section and path
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
    <span className="ml-2">Loading Admin Panel...</span>
  </div>
);

export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [authStatus, setAuthStatus] = useState<'loading' | 'authorized' | 'unauthorized'>('loading');
  const [activeSection, setActiveSection] = useState<AdminPanelSectionKey>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const isAdminAuthenticated = typeof window !== 'undefined' ? localStorage.getItem('isAdminAuthenticated') === 'true' : false;

    if (isAdminAuthenticated) {
      setAuthStatus('authorized');
    } else {
      setAuthStatus('unauthorized');
      router.replace('/admin-login'); 
    }

    const storedCollapseState = typeof window !== 'undefined' ? localStorage.getItem('adminPanelSidebarCollapsed') : null;
    if (storedCollapseState) {
      setIsSidebarCollapsed(JSON.parse(storedCollapseState));
    }

    const currentPath = pathname;
    let determinedSection: AdminPanelSectionKey = 'dashboard';

    for (const item of adminNavigationItems) {
      if (item.section === 'dashboard' && (currentPath === '/admin-panel' || currentPath === '/admin-panel/')) {
        determinedSection = 'dashboard';
        break;
      } else if (item.section !== 'dashboard' && currentPath.startsWith(item.path)) {
        determinedSection = item.section;
        break;
      }
    }
    
    const storedSection = typeof window !== 'undefined' ? localStorage.getItem('adminPanelActiveSection') as AdminPanelSectionKey | null : null;
    if (adminNavigationItems.some(item => item.section === storedSection)) {
        setActiveSection(storedSection || determinedSection);
    } else {
        setActiveSection(determinedSection);
    }
    
  }, [pathname, router]);


  const handleSectionChange = (section: AdminPanelSectionKey, path: string) => {
    setActiveSection(section);
    if (typeof window !== 'undefined') localStorage.setItem('adminPanelActiveSection', section);
    router.push(path);
  };

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const newState = !prev;
      if (typeof window !== 'undefined') localStorage.setItem('adminPanelSidebarCollapsed', JSON.stringify(newState));
      return newState;
    });
  };

  const handleAdminLogout = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('isAdminAuthenticated');
    }
    toast({title: "Admin Logout", description: "You have been logged out from the admin panel."});
    router.push('/admin-login');
  };


  if (authStatus === 'loading') {
    return <PageLoader />;
  }

  if (authStatus === 'unauthorized') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
         <p className="mt-2 text-muted-foreground">Redirecting to Admin Login...</p>
      </div>
    );
  }

  const headerHeight = '0rem'; 
  const collapsedSidebarWidth = '4.5rem'; 
  const expandedSidebarWidth = '18rem'; 

  return (
    <div className="flex min-h-screen bg-secondary/30">
      <aside
        className={cn(
          "fixed top-0 left-0 h-full bg-card border-r border-border shadow-lg overflow-y-auto transition-all duration-300 ease-in-out flex flex-col",
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
                <Link href="/admin-panel" className="text-xl font-bold text-primary flex items-center gap-2">
                  <LayoutDashboard className="h-6 w-6" /> Admin Panel
                </Link>
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
          {!isSidebarCollapsed && <p className="text-xs text-muted-foreground mt-1">Site Management Tools</p>}
        </div>
        <nav className={cn("space-y-2 flex-grow", isSidebarCollapsed ? 'px-2' : 'px-6')}>
          {adminNavigationItems.map((item) => (
            <NavItem
              key={item.section}
              icon={item.icon}
              label={item.label}
              section={item.section}
              path={item.path}
              isActive={activeSection === item.section}
              isCollapsed={isSidebarCollapsed}
              onClick={handleSectionChange}
            />
          ))}
        </nav>
         <div className={cn("mt-auto p-4 border-t border-border", isSidebarCollapsed ? 'px-2' : 'px-6')}>
            <Button
                variant="outline"
                className={cn("w-full justify-start text-sm h-12 rounded-lg transition-colors duration-200 ease-in-out text-destructive-foreground bg-destructive/90 hover:bg-destructive", 
                           isSidebarCollapsed ? 'px-3 justify-center' : 'px-4')}
                onClick={handleAdminLogout}
                title={isSidebarCollapsed ? "Logout" : undefined}
            >
                <LogOut className={cn("h-5 w-5", isSidebarCollapsed ? '' : 'mr-3')} />
                {!isSidebarCollapsed && "Logout Admin"}
            </Button>
        </div>
      </aside>

      <main
        className={cn(
          "p-6 md:p-8 space-y-8 overflow-y-auto transition-all duration-300 ease-in-out flex-grow",
          isSidebarCollapsed ? `ml-[${collapsedSidebarWidth}] w-[calc(100%-${collapsedSidebarWidth})]` : `ml-[25%] w-[calc(100%-25%)] max-ml-[${expandedSidebarWidth}]`
        )}
        style={{minHeight: `calc(100vh - ${headerHeight})`,
                marginLeft: isSidebarCollapsed ? collapsedSidebarWidth : expandedSidebarWidth,
                width: `calc(100% - ${isSidebarCollapsed ? collapsedSidebarWidth : expandedSidebarWidth})`
        }}
      >
        <Suspense fallback={<div className="flex justify-center items-center h-full py-10"><Loader2 className="h-10 w-10 animate-spin text-primary"/></div>}>
            {children}
        </Suspense>
      </main>
    </div>
  );
}
