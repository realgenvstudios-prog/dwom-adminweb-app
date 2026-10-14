import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import type { NavGroup } from '@/config/navigation';

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: NavGroup[];
  onLogout: () => void;
}

export default function CommandMenu({ open, onOpenChange, groups, onLogout }: CommandMenuProps) {
  const navigate = useNavigate();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  const run = (action: () => void) => {
    onOpenChange(false);
    action();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Search" description="Jump to a page">
      <Command>
        <CommandInput placeholder="Search pages…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {groups.map((group) => (
            <CommandGroup key={group.label} heading={group.label}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.path}
                  value={`${group.label} ${item.label}`}
                  onSelect={() => run(() => navigate(item.path))}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
          <CommandSeparator />
          <CommandGroup heading="Account">
            <CommandItem value="log out sign out" onSelect={() => run(onLogout)}>
              <LogOut />
              <span>Log out</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
