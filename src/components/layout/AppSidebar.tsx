import { Link, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import type { NavGroup } from '@/config/navigation';
import NavUser from './NavUser';

interface AppSidebarProps {
  groups: NavGroup[];
  user: { name: string; email: string; role: string };
  canOpenSettings: boolean;
  onLogout: () => void;
}

export default function AppSidebar({ groups, user, canOpenSettings, onLogout }: AppSidebarProps) {
  const { pathname } = useLocation();

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="DWOM Admin">
              <Link to="/dashboard">
                <img
                  src="/dwom-logo.png"
                  alt="DWOM"
                  className="aspect-square size-8 shrink-0 rounded-lg border bg-white object-contain"
                />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">DWOM</span>
                  <span className="truncate text-xs text-muted-foreground">Admin Console</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => {
                const active = pathname === item.path || pathname.startsWith(`${item.path}/`);
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                      <Link to={item.path}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} canOpenSettings={canOpenSettings} onLogout={onLogout} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
