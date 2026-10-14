import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import adminsService, { type AdminRole } from '../../services/adminsService';
import RoleSelect from './RoleSelect';

interface InviteAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvited: () => void;
}

export default function InviteAdminDialog({ open, onOpenChange, onInvited }: InviteAdminDialogProps) {
  const [form, setForm] = useState({ name: '', email: '', role: 'Support' as AdminRole });
  const [problem, setProblem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const send = async () => {
    const email = form.email.trim().toLowerCase();
    if (!form.name.trim()) return setProblem('Enter their name.');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setProblem('Enter a valid email address.');
    setProblem(null);
    try {
      setSaving(true);
      await adminsService.inviteAdmin({ name: form.name.trim(), email, role: form.role });
      toast.success(`Invite sent to ${email}`, { description: 'The link works for 7 days. They set their own phone number and password.' });
      onInvited();
      onOpenChange(false);
    } catch (err) {
      setProblem(err instanceof Error ? err.message : 'Couldn’t send the invite.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite an admin</DialogTitle>
          <DialogDescription>They get an email link to set up their account.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="ia-name">Name</Label>
            <Input id="ia-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ia-email">Email</Label>
            <Input id="ia-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@dwom.org" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ia-role">Role</Label>
            <RoleSelect id="ia-role" value={form.role} onChange={(role) => setForm({ ...form, role })} />
          </div>
        </div>
        <DialogFooter className="items-center">
          {problem && <p className="mr-auto text-sm text-destructive">{problem}</p>}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void send()} disabled={saving}>
            {saving && <Loader2 className="animate-spin" />}
            Send invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
