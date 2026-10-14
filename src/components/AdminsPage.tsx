import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { AlertCircle, Ban, Loader2, Mail, MailX, MoreHorizontal, RotateCw, ShieldCheck, UserCheck, UserCog, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DataTable, DataTableColumnHeader, facetedFilterFn } from '@/components/data-table';
import { StatCard } from '@/components/stat-card';
import adminsService, { type Admin, type AdminRole } from '../services/adminsService';
import adminAuthService from '../services/authService';
import { ALL_ROLES } from '../config/permissions';
import { logger } from '../utils/logger';
import InviteAdminDialog from './admins/InviteAdminDialog';
import RoleSelect from './admins/RoleSelect';
import { ROLE_BLURB, ROLE_PAGES, ROLE_TINT, STATUS_TINT, initials } from './admins/role-meta';

const when = (iso?: string | null) => {
  if (!iso) return null;
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days < 1) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};
const rowKey = (a: Admin) => `${a.kind}-${a.id}`;

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteToken, setInviteToken] = useState<number | null>(null);
  const [roleFor, setRoleFor] = useState<{ admin: Admin; role: AdminRole } | null>(null);
  const [confirm, setConfirm] = useState<{ admin: Admin; action: 'suspend' | 'reactivate' | 'cancel' } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const me = Number(adminAuthService.getCurrentAdmin()?.id);

  const load = useCallback(async () => {
    try {
      setError(null);
      setAdmins(await adminsService.getAllAdmins());
    } catch (err) {
      logger.error('Failed to load admins:', err);
      setError(err instanceof Error ? err.message : 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const run = useCallback(
    async (key: string, fn: () => Promise<void>, success: string) => {
      try {
        setBusy(key);
        await fn();
        toast.success(success);
        await load();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Something went wrong.');
      } finally {
        setBusy(null);
      }
    },
    [load],
  );

  const columns = useMemo<ColumnDef<Admin>[]>(
    () => [
      {
        id: 'name',
        accessorFn: (a) => `${a.name} ${a.email} ${a.phone ?? ''}`,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Admin" />,
        sortingFn: (x, y) => x.original.name.localeCompare(y.original.name),
        cell: ({ row }) => {
          const a = row.original;
          return (
            <div className="flex min-w-[200px] items-center gap-3">
              <Avatar className="size-8">
                <AvatarFallback className="text-xs">{initials(a.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {a.name}
                  {a.kind === 'admin' && a.id === me && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>}
                </p>
                <p className="truncate text-xs text-muted-foreground">{a.email || a.phone}</p>
              </div>
            </div>
          );
        },
        meta: { title: 'Admin' },
      },
      {
        id: 'role',
        accessorKey: 'role',
        header: 'Role',
        filterFn: facetedFilterFn,
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <Badge variant="outline" className={ROLE_TINT[row.original.role]}>
            {row.original.role}
          </Badge>
        ),
        meta: { title: 'Role' },
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: 'Status',
        filterFn: facetedFilterFn,
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <Badge variant="outline" className={STATUS_TINT[row.original.status]}>
            {row.original.status}
          </Badge>
        ),
        meta: { title: 'Status' },
      },
      {
        id: 'lastLogin',
        accessorFn: (a) => (a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0),
        header: ({ column }) => <DataTableColumnHeader column={column} title="Last sign-in" />,
        enableGlobalFilter: false,
        cell: ({ row }) => {
          const a = row.original;
          if (a.kind === 'invite') {
            const exp = a.expiresAt ? Math.ceil((new Date(a.expiresAt).getTime() - Date.now()) / 86400000) : null;
            return <span className="text-muted-foreground">{exp !== null ? `Invite expires in ${exp} day${exp === 1 ? '' : 's'}` : 'Invite sent'}</span>;
          }
          return <span className="whitespace-nowrap text-muted-foreground">{when(a.lastLoginAt) ?? 'Never signed in'}</span>;
        },
        meta: { title: 'Last sign-in' },
      },
      {
        id: 'actions',
        enableHiding: false,
        enableSorting: false,
        meta: { className: 'w-10' },
        cell: ({ row }) => {
          const a = row.original;
          const self = a.kind === 'admin' && a.id === me;
          const key = rowKey(a);
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="data-[state=open]:bg-muted" disabled={busy === key}>
                  {busy === key ? <Loader2 className="animate-spin" /> : <MoreHorizontal />}
                  <span className="sr-only">Actions for {a.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {a.kind === 'invite' ? (
                  <>
                    <DropdownMenuItem onSelect={() => void run(key, () => adminsService.resendInvite(a.id), `New invite link sent to ${a.email}`)}>
                      <Mail />
                      Resend invite
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onSelect={() => setConfirm({ admin: a, action: 'cancel' })}>
                      <MailX />
                      Cancel invite
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem disabled={self} onSelect={() => setRoleFor({ admin: a, role: a.role })}>
                      <UserCog />
                      Change role
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {a.status === 'Suspended' ? (
                      <DropdownMenuItem onSelect={() => setConfirm({ admin: a, action: 'reactivate' })}>
                        <UserCheck />
                        Reactivate
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem variant="destructive" disabled={self} onSelect={() => setConfirm({ admin: a, action: 'suspend' })}>
                        <Ban />
                        Suspend
                      </DropdownMenuItem>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [busy, me, run],
  );

  const accounts = admins.filter((a) => a.kind === 'admin');
  const active = accounts.filter((a) => a.status === 'Active').length;
  const supers = accounts.filter((a) => a.role === 'Super Admin' && a.status === 'Active').length;
  const invites = admins.filter((a) => a.kind === 'invite').length;
  const suspended = accounts.filter((a) => a.status === 'Suspended').length;

  const confirmCopy = confirm && {
    suspend: {
      title: `Suspend ${confirm.admin.name}?`,
      body: 'They’re signed out on their next action and can’t sign in again until reactivated. Nothing they did is undone.',
      cta: 'Suspend',
    },
    reactivate: { title: `Reactivate ${confirm.admin.name}?`, body: `They can sign in again with their ${confirm.admin.role} access.`, cta: 'Reactivate' },
    cancel: { title: `Cancel the invite to ${confirm.admin.email}?`, body: 'The link they were sent stops working. You can invite them again later.', cta: 'Cancel invite' },
  }[confirm.action];

  const doConfirm = () => {
    if (!confirm) return;
    const { admin, action } = confirm;
    setConfirm(null);
    const key = rowKey(admin);
    if (action === 'cancel') void run(key, () => adminsService.cancelInvite(admin.id), 'Invite cancelled');
    else void run(key, () => adminsService.setSuspended(admin.id, action === 'suspend'), action === 'suspend' ? `${admin.name} suspended` : `${admin.name} reactivated`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Admins</h1>
        <p className="text-sm text-muted-foreground">Who can sign in to this dashboard, and what each person can see.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active admins" value={String(active)} hint={`${accounts.length} accounts in total`} icon={Users} tint="bg-sky-500/10 text-sky-600" loading={loading} failed={!!error} />
        <StatCard
          label="Super Admins"
          value={String(supers)}
          hint={supers <= 1 ? 'Consider a second, so you’re never locked out' : 'Full access, including this page'}
          icon={ShieldCheck}
          tint="bg-violet-500/10 text-violet-600"
          loading={loading}
          failed={!!error}
        />
        <StatCard label="Invites waiting" value={String(invites)} hint="Sent, not yet accepted" icon={Mail} tint="bg-amber-500/10 text-amber-600" loading={loading} failed={!!error} />
        <StatCard label="Suspended" value={String(suspended)} hint="Can’t sign in" icon={Ban} tint="bg-red-500/10 text-red-600" loading={loading} failed={!!error} />
      </div>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="size-4" />
            Couldn’t load admins: {error}
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RotateCw />
            Retry
          </Button>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <DataTable
          columns={columns}
          data={admins}
          isLoading={loading}
          getRowId={rowKey}
          initialSorting={[{ id: 'name', desc: false }]}
          searchPlaceholder="Search name, email or phone…"
          filters={[
            { columnId: 'role', title: 'Role', options: ALL_ROLES.map((r) => ({ value: r, label: r })) },
            {
              columnId: 'status',
              title: 'Status',
              options: [
                { value: 'Active', label: 'Active' },
                { value: 'Invited', label: 'Invited' },
                { value: 'Suspended', label: 'Suspended' },
              ],
            },
          ]}
          toolbarActions={
            <Button size="sm" className="h-8" onClick={() => setInviteToken(Date.now())}>
              <UserPlus />
              Invite admin
            </Button>
          }
          emptyMessage="No admins match."
        />

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Roles & access</CardTitle>
              <CardDescription>What each role can open in this dashboard.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {ALL_ROLES.map((r) => (
                <div key={r} className="grid gap-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className={ROLE_TINT[r]}>
                      {r}
                    </Badge>
                    <span className="text-xs text-muted-foreground tabular-nums">{accounts.filter((a) => a.role === r).length}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{ROLE_BLURB[r]}</p>
                  {r !== 'Super Admin' && <p className="text-[11px] text-muted-foreground/80">{(ROLE_PAGES[r] ?? []).join(' · ')}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {inviteToken && <InviteAdminDialog key={inviteToken} open={!!inviteToken} onOpenChange={(o) => !o && setInviteToken(null)} onInvited={() => void load()} />}

      <Dialog open={!!roleFor} onOpenChange={(o) => !o && setRoleFor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change {roleFor?.admin.name}’s role</DialogTitle>
            <DialogDescription>Takes effect on their next page load.</DialogDescription>
          </DialogHeader>
          {roleFor && <RoleSelect id="cr-role" value={roleFor.role} onChange={(role) => setRoleFor({ ...roleFor, role })} />}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleFor(null)}>
              Cancel
            </Button>
            <Button
              disabled={!roleFor || roleFor.role === roleFor.admin.role}
              onClick={() => {
                if (!roleFor) return;
                const { admin, role } = roleFor;
                setRoleFor(null);
                void run(rowKey(admin), () => adminsService.updateAdminRole(admin.id, role), `${admin.name} is now ${role}`);
              }}
            >
              Save role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmCopy?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmCopy?.body}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction variant={confirm?.action === 'reactivate' ? 'default' : 'destructive'} onClick={doConfirm}>
              {confirmCopy?.cta}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
