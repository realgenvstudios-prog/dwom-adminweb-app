import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { activeSubTab, findNavItem } from '@/config/navigation';
import type { UiRole } from '@/config/permissions';
import ThemeToggle from './ThemeToggle';

interface SiteHeaderProps {
  role: UiRole;
  onOpenSearch: () => void;
}

export default function SiteHeader({ role, onOpenSearch }: SiteHeaderProps) {
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const current = findNavItem(pathname, role);
  const tab = current ? activeSubTab(current.item, params.get('tab')) : undefined;
  const sub = current?.item.children?.find((c) => c.tab === tab);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur transition-shadow supports-[backdrop-filter]:bg-background/70',
        scrolled && 'shadow-sm',
      )}
    >
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
      {current && (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">{current.group}</BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            {sub ? (
              <>
                <BreadcrumbItem className="hidden sm:block">
                  <BreadcrumbLink asChild>
                    <Link to={current.item.path}>{current.item.label}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden sm:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{sub.label}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            ) : (
              <BreadcrumbItem>
                <BreadcrumbPage>{current.item.label}</BreadcrumbPage>
              </BreadcrumbItem>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="outline"
          onClick={onOpenSearch}
          className="h-8 w-9 justify-start gap-2 px-2 text-muted-foreground sm:w-56 sm:px-3"
        >
          <Search className="size-4" />
          <span className="hidden sm:inline">Search…</span>
          <kbd className="pointer-events-none ml-auto hidden h-5 items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium sm:inline-flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}
