import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AdminRole } from '../../services/adminsService';
import { ALL_ROLES } from '../../config/permissions';
import { ROLE_BLURB, ROLE_PAGES } from './role-meta';

/** Role picker that shows what each role can open, so you know what you're granting. */
export default function RoleSelect({ id, value, onChange }: { id?: string; value: AdminRole; onChange: (r: AdminRole) => void }) {
  return (
    <div className="grid gap-2">
      <Select value={value} onValueChange={(v) => onChange(v as AdminRole)}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ALL_ROLES.map((r) => (
            <SelectItem key={r} value={r}>
              {r}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="rounded-md bg-muted px-3 py-2 text-xs">
        <p className="text-foreground">{ROLE_BLURB[value]}</p>
        <p className="mt-1 text-muted-foreground">Can open: {(ROLE_PAGES[value] ?? []).join(', ') || 'None'}</p>
      </div>
    </div>
  );
}
