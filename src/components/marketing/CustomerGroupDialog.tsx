import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CustomerGroup } from '../../services/marketingService';
import customerGroupsService from '../../services/marketing/customerGroupsService';
import CustomerPicker from './CustomerPicker';
import { useCustomerDirectory } from './customer-directory';

interface CustomerGroupDialogProps {
  /** null = new group. Mount with a fresh `key` per open. */
  group: CustomerGroup | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (group: CustomerGroup) => void;
}

export default function CustomerGroupDialog({ group, open, onOpenChange, onSaved }: CustomerGroupDialogProps) {
  const [name, setName] = useState(group?.name ?? '');
  const [description, setDescription] = useState(group?.description ?? '');
  const [userIds, setUserIds] = useState<number[]>(group?.userIds ?? []);
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const { customers, failed } = useCustomerDirectory();

  const save = async () => {
    if (!name.trim()) return setProblem('Give the group a name.');
    if (!userIds.length) return setProblem('Choose at least one customer.');
    setProblem(null);
    try {
      setSaving(true);
      const data = { name: name.trim(), description: description.trim(), userIds };
      const saved = group ? await customerGroupsService.update(group.id, data) : await customerGroupsService.create(data);
      toast.success(group ? `“${saved.name}” saved` : `“${saved.name}” created`);
      onSaved(saved);
      onOpenChange(false);
    } catch (err) {
      setProblem(err instanceof Error ? err.message : 'Couldn’t save the group.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{group ? `Edit ${group.name}` : 'New customer group'}</DialogTitle>
          <DialogDescription>A saved set of customers you can message together.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="cg-name">Name</Label>
            <Input id="cg-name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder="e.g. VIPs, Weekend shoppers" autoFocus />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="cg-desc">Note</Label>
            <Input id="cg-desc" value={description} maxLength={200} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="cg-members">Customers</Label>
            <CustomerPicker id="cg-members" customers={customers} failed={failed} value={userIds} onChange={setUserIds} />
          </div>
        </div>
        <DialogFooter className="items-center">
          {problem && <p className="mr-auto text-sm text-destructive">{problem}</p>}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void save()} disabled={saving}>
            {saving && <Loader2 className="animate-spin" />}
            {group ? 'Save group' : 'Create group'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
