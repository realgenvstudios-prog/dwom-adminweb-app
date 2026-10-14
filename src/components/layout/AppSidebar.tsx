import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { activeSubTab, type NavGroup, type NavItem } from '@/config/navigation';
import NavUser from './NavUser';

interface AppSidebarProps {
  groups: NavGroup[];
  user: { name: string; email: string; role: string };
  canOpenSettings: boolean;
  onLogout: () => void;
}

function isOnPage(pathname: string, item: NavItem) {
  return pathname === item.path || pathname.startsWith(`${item.path}/`);
}

function NavLinkItem({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
        <Link to={item.path}>
          <item.icon />
          <span>{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

// Expanded sidebar: a chevron row that slides its sub-pages open.
function NavCollapsibleItem({ item, active, currentTab }: { item: NavItem; active: boolean; currentTab?: string }) {
  const [open, setOpen] = useState(active);

  useEffect(() => {
    if (active) setOpen(true);
  }, [active]);

  return (
    <Collapsible asChild open={open} onOpenChange={setOpen} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.label} isActive={active && !open}>
            <item.icon />
            <span>{item.label}</span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          <SidebarMenuSub>
            {item.children!.map((sub) => (
              <SidebarMenuSubItem key={sub.tab}>
                <SidebarMenuSubButton asChild isActive={active && currentTab === sub.tab}>
                  <Link to={sub.href}>
                    <span>{sub.label}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

// Icon-only sidebar: sub-pages can't expand inline, so they fly out to the right.
function NavFlyoutItem({ item, active, currentTab }: { item: NavItem; active: boolean; currentTab?: string }) {
  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton tooltip={item.label} isActive={active}>
            <item.icon />
            <span>{item.label}</span>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" sideOffset={4} className="min-w-44">
          <DropdownMenuLabel>{item.label}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {item.children!.map((sub) => (
            <DropdownMenuItem key={sub.tab} asChild className={active && currentTab === sub.tab ? 'bg-accent' : ''}>
              <Link to={sub.href}>{sub.label}</Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}

export default function AppSidebar({ groups, user, canOpenSettings, onLogout }: AppSidebarProps) {
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const { state, isMobile } = useSidebar();
  const iconOnly = state === 'collapsed' && !isMobile;

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
                const active = isOnPage(pathname, item);
                if (!item.children) return <NavLinkItem key={item.path} item={item} active={active} />;
                const currentTab = activeSubTab(item, params.get('tab'));
                return iconOnly ? (
                  <NavFlyoutItem key={item.path} item={item} active={active} currentTab={currentTab} />
                ) : (
                  <NavCollapsibleItem key={item.path} item={item} active={active} currentTab={currentTab} />
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
