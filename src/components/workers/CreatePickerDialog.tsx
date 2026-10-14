import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import workersService from '../../services/workersService';
import { logger } from '../../utils/logger';
import { PICKER_TYPES } from './picker-meta';

interface CreatePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

const EMPTY = { name: '', phone: '', type: 'kayayie' };

export default function CreatePickerDialog({ open, onOpenChange, onCreated }: CreatePickerDialogProps) {
  const [form, setForm] = useState(EMPTY);
  const [problem, setProblem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setProblem('Enter a name.');
    setProblem(null);
    try {
      setSaving(true);
      await workersService.create({ name: form.name.trim(), phone: form.phone.trim() || undefined, type: form.type });
      toast.success(`${form.name.trim()} added`);
      setForm(EMPTY);
      onOpenChange(false);
      onCreated();
    } catch (err) {
      logger.error('❌ Failed to create picker:', err);
      setProblem(err instanceof Error ? err.message : 'Couldn’t add the picker.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add picker</DialogTitle>
          <DialogDescription>Pickers buy orders from suppliers. Assign them to an order from the Orders page.</DialogDescription>
        </DialogHeader>
        <form id="create-picker" onSubmit={submit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="cp-name">Name</Label>
            <Input id="cp-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ama" autoFocus />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="cp-phone">Phone</Label>
              <Input id="cp-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Optional" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cp-type">Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger id="cp-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PICKER_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </form>
        <DialogFooter className="items-center">
          {problem && <p className="mr-auto text-sm text-destructive">{problem}</p>}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="create-picker" disabled={saving}>
            {saving && <Loader2 className="animate-spin" />}
            Add picker
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
