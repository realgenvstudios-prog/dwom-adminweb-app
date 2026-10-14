import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import NewOrderAlerts from './NewOrderAlerts';
import PasswordSection from './PasswordSection';

/** Personal settings every admin can reach from the account menu. */
export default function AccountDialog({ open, onOpenChange, name, email }: { open: boolean; onOpenChange: (o: boolean) => void; name: string; email: string }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Your account</DialogTitle>
          <DialogDescription>
            {name}
            {email ? ` · ${email}` : ''}
          </DialogDescription>
        </DialogHeader>
        <PasswordSection />
        <Separator />
        <NewOrderAlerts />
      </DialogContent>
    </Dialog>
  );
}
