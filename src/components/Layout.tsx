import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import adminAuthService from '../services/authService';
import { canAccessRoute, resolveUiRole } from '../config/permissions';
import { getNavGroups } from '../config/navigation';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from './layout/AppSidebar';
import SiteHeader from './layout/SiteHeader';
import CommandMenu from './layout/CommandMenu';

interface LayoutProps {
  children: React.ReactNode;
}

// The shadcn sidebar remembers collapsed/expanded in this cookie.
function readSidebarOpen(): boolean {
  const match = document.cookie.match(/(?:^|;\s*)sidebar_state=(true|false)/);
  return match ? match[1] === 'true' : true;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);

  const currentAdmin = adminAuthService.getCurrentAdmin();
  const role = resolveUiRole(currentAdmin);
  const groups = getNavGroups(role);
  const user = {
    name: currentAdmin?.name || currentAdmin?.email || 'Admin User',
    email: currentAdmin?.email || '',
    role,
  };

  const handleLogout = () => {
    adminAuthService.logout();
    navigate('/login', { replace: true });
  };

  return (
    <SidebarProvider defaultOpen={readSidebarOpen()}>
      <AppSidebar
        groups={groups}
        user={user}
        canOpenSettings={canAccessRoute(role, '/settings')}
        onLogout={handleLogout}
      />
      <SidebarInset>
        <SiteHeader onOpenSearch={() => setSearchOpen(true)} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
      <CommandMenu open={searchOpen} onOpenChange={setSearchOpen} groups={groups} onLogout={handleLogout} />
    </SidebarProvider>
  );
};

export default Layout;
