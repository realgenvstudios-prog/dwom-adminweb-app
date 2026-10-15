import { useState } from 'react';
import { Loader2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import adminsService, { type Admin } from '../../services/adminsService';
import PermissionsEditor from './PermissionsEditor';
import { presetFor, usePermissionCatalog } from './permission-catalog';

interface PermissionsDialogProps {
  /** An admin account (not an invite). Mount with a fresh `key` per open. */
  admin: Admin;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export default function PermissionsDialog({ admin, open, onOpenChange, onSaved }: PermissionsDialogProps) {
  const { catalog, failed } = usePermissionCatalog();
  const [value, setValue] = useState<string[] | null>(admin.permissions ?? null);
  const [busy, setBusy] = useState<'save' | 'reset' | null>(null);
  const preset = catalog ? presetFor(catalog, admin.role) : [];
  const current = value ?? preset;
  const same = (a: string[], b: string[]) => a.length === b.length && a.every((k) => b.includes(k));
  const dirty = !same(current, admin.permissions ?? preset);

  const save = async () => {
    try {
      setBusy('save');
      if (same(current, preset)) await adminsService.resetPermissions(admin.id);
      else await adminsService.setPermissions(admin.id, current);
      toast.success(`${admin.name}’s permissions saved`, { description: 'They apply from their next action.' });
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Couldn’t save permissions.');
    } finally {
      setBusy(null);
    }
  };

  const reset = async () => {
    try {
      setBusy('reset');
      await adminsService.resetPermissions(admin.id);
      toast.success(`${admin.name} is back to the ${admin.role} defaults`);
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Couldn’t reset permissions.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Permissions for {admin.name}</DialogTitle>
          <DialogDescription>
            {admin.customPermissions ? `Customised from the ${admin.role} defaults.` : `Using the ${admin.role} defaults.`} Tick what they may see and do. Changes apply from their
            next action, no sign-out needed.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {failed ? (
            <p className="text-sm text-destructive">Couldn’t load the permission list. Close this and try again.</p>
          ) : !catalog ? (
            <div className="grid gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full" />
              ))}
            </div>
          ) : (
            <PermissionsEditor catalog={catalog} value={current} onChange={setValue} preset={preset} disabled={!!busy} />
          )}
        </div>
        <DialogFooter className="flex-row flex-wrap items-center gap-2 sm:justify-between">
          <Button variant="ghost" size="sm" onClick={() => void reset()} disabled={!catalog || !!busy || !admin.customPermissions}>
            {busy === 'reset' ? <Loader2 className="animate-spin" /> : <RotateCcw />}
            Reset to {admin.role} defaults
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={!!busy}>
              Cancel
            </Button>
            <Button onClick={() => void save()} disabled={!catalog || !!busy || !dirty}>
              {busy === 'save' && <Loader2 className="animate-spin" />}
              Save permissions
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
