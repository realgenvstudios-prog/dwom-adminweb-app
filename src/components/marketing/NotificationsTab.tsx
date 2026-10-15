import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { AlertCircle, Archive, FileText, Link2, MoreHorizontal, Pencil, Plus, RotateCw, Send, Trash2, Users } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable, DataTableColumnHeader, facetedFilterFn } from '@/components/data-table';
import marketingService, { type CustomerGroup, type NotificationSend, type NotificationTemplate } from '../../services/marketingService';
import customerGroupsService from '../../services/marketing/customerGroupsService';
import CustomerGroupDialog from './CustomerGroupDialog';
import SchedulesCard from './SchedulesCard';
import { logger } from '../../utils/logger';
import SendNotificationDialog from './SendNotificationDialog';
import TemplateDialog from './TemplateDialog';
import { can } from '../../config/permissions';

const SEND_STATUS: Record<string, { label: string; className: string }> = {
  sent: {
    label: 'Sent',
    className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700',
  },
  sending: {
    label: 'Sending',
    className: 'border-sky-500/20 bg-sky-500/10 text-sky-700',
  },
  failed: {
    label: 'Failed',
    className: 'border-red-500/20 bg-red-500/10 text-red-700',
  },
  // Nothing processes scheduled sends yet, so these never went out.
  scheduled: { label: 'Not sent', className: 'text-muted-foreground' },
};

const when = (d?: string) =>
  d
    ? new Date(d).toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'None';

function ChannelResult({ ok = 0, failed = 0 }: { ok?: number; failed?: number }) {
  if (!ok && !failed) return <span className="text-muted-foreground">None</span>;
  return (
    <span className="whitespace-nowrap tabular-nums">
      {ok.toLocaleString()}
      {failed > 0 && <span className="ml-1 text-xs text-red-600">· {failed.toLocaleString()} failed</span>}
    </span>
  );
}

export default function NotificationsTab() {
  const [sends, setSends] = useState<NotificationSend[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [send, setSend] = useState<{
    templateId?: number;
    groupId?: number;
    token: number;
  } | null>(null);
  const [groups, setGroups] = useState<CustomerGroup[] | null>(null);
  const [groupEdit, setGroupEdit] = useState<{ group: CustomerGroup | null; token: number } | null>(null);
  const [groupEditOpen, setGroupEditOpen] = useState(false);
  const [toDeleteGroup, setToDeleteGroup] = useState<CustomerGroup | null>(null);
  const [sendOpen, setSendOpen] = useState(false);
  const [schedulesKey, setSchedulesKey] = useState(0);
  const [edit, setEdit] = useState<{
    template: NotificationTemplate | null;
    token: number;
  } | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [toArchive, setToArchive] = useState<NotificationTemplate | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [s, t, g] = await Promise.all([
        marketingService.getNotificationSends(),
        marketingService.getTemplates(),
        customerGroupsService.list().catch((err) => {
          logger.error('Failed to load customer groups:', err);
          return [] as CustomerGroup[];
        }),
      ]);
      setSends(s);
      setTemplates(t);
      setGroups(g);
    } catch (err) {
      logger.error('Failed to load notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
      setTemplates((t) => t ?? []);
      setGroups((g) => g ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const openSend = (templateId?: number, groupId?: number) => {
    setSend({ templateId, groupId, token: Date.now() });
    setSendOpen(true);
  };
  const openGroup = (group: CustomerGroup | null) => {
    setGroupEdit({ group, token: Date.now() });
    setGroupEditOpen(true);
  };
  const groupSaved = (g: CustomerGroup) => setGroups((prev) => [...(prev ?? []).filter((x) => x.id !== g.id), g].sort((a, b) => a.name.localeCompare(b.name)));

  const deleteGroup = async () => {
    const g = toDeleteGroup;
    setToDeleteGroup(null);
    if (!g) return;
    try {
      await customerGroupsService.remove(g.id);
      setGroups((prev) => prev?.filter((x) => x.id !== g.id) ?? null);
      toast.success(`“${g.name}” deleted`);
    } catch (err) {
      logger.error('Failed to delete group:', err);
      toast.error('Couldn’t delete the group.');
    }
  };
  const openEdit = (template: NotificationTemplate | null) => {
    setEdit({ template, token: Date.now() });
    setEditOpen(true);
  };

  // Archiving hides the template but keeps its send history (deleting it
  // would cascade-delete every send made with it).
  const archive = async () => {
    const t = toArchive;
    setToArchive(null);
    if (!t) return;
    try {
      await marketingService.updateTemplate(t.id, { isActive: false });
      setTemplates((prev) => prev?.filter((x) => x.id !== t.id) ?? null);
      toast.success(`“${t.name}” archived`);
    } catch (err) {
      logger.error('Failed to archive template:', err);
      toast.error('Couldn’t archive the template.');
    }
  };

  const columns = useMemo<ColumnDef<NotificationSend>[]>(
    () => [
      {
        id: 'template',
        accessorFn: (s) => `${s.template?.name ?? ''} ${s.template?.title ?? s.title ?? ''} ${s.audienceLabel ?? ''}`,
        header: 'Message',
        enableSorting: false,
        cell: ({ row }) => {
          const s = row.original;
          return (
            <div className="max-w-[300px] min-w-[160px]">
              <p className="truncate font-medium">{s.template?.name ?? s.title ?? `Template #${s.templateId}`}</p>
              <p className="truncate text-xs text-muted-foreground">{s.template ? s.template.title : s.body}</p>
            </div>
          );
        },
        meta: { title: 'Message' },
      },
      {
        id: 'to',
        header: 'To',
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => {
          const s = row.original;
          const zones = Array.isArray(s.targetZones) ? s.targetZones.length : 0;
          const label =
            s.audienceLabel ??
            [
              s.targetSubscriptionStatus && s.targetSubscriptionStatus !== 'all' ? `${s.targetSubscriptionStatus} subscribers` : 'Everyone',
              zones ? `${zones} zone${zones === 1 ? '' : 's'}` : null,
            ]
              .filter(Boolean)
              .join(' · ');
          return <span className="block max-w-[180px] truncate text-muted-foreground">{label}</span>;
        },
        meta: { title: 'To' },
      },
      {
        id: 'sent',
        accessorFn: (s) => new Date(s.sentAt ?? s.createdAt).getTime(),
        header: ({ column }) => <DataTableColumnHeader column={column} title="Sent" />,
        enableGlobalFilter: false,
        cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{when(row.original.sentAt ?? row.original.createdAt)}</span>,
        meta: { title: 'Sent' },
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: 'Status',
        filterFn: facetedFilterFn,
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => {
          const s = SEND_STATUS[row.original.status] ?? {
            label: row.original.status,
            className: '',
          };
          return (
            <Badge variant="outline" className={s.className}>
              {s.label}
            </Badge>
          );
        },
        meta: { title: 'Status' },
      },
      {
        id: 'recipients',
        accessorKey: 'totalRecipients',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Customers" className="justify-end" />,
        enableGlobalFilter: false,
        cell: ({ row }) => <div className="text-right tabular-nums">{row.original.totalRecipients.toLocaleString()}</div>,
        meta: { title: 'Customers', className: 'text-right' },
      },
      {
        id: 'push',
        header: 'Push',
        enableSorting: false,
        cell: ({ row }) => <ChannelResult ok={row.original.pushSuccessCount} failed={row.original.pushFailureCount} />,
        meta: { title: 'Push' },
      },
      {
        id: 'sms',
        header: 'SMS',
        enableSorting: false,
        cell: ({ row }) => <ChannelResult ok={row.original.smsSuccessCount} failed={row.original.smsFailureCount} />,
        meta: { title: 'SMS' },
      },
      {
        id: 'email',
        header: 'Email',
        enableSorting: false,
        cell: ({ row }) => <ChannelResult ok={row.original.emailSuccessCount} failed={row.original.emailFailureCount} />,
        meta: { title: 'Email' },
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="size-4" />
            Couldn’t load notifications: {error}
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RotateCw />
            Retry
          </Button>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle>Templates</CardTitle>
            <CardDescription>Reusable messages. Send to everyone, a zone, chosen customers or a saved group.</CardDescription>
          </div>
          {can('notifications.templates') && (
            <Button size="sm" variant="outline" onClick={() => openEdit(null)}>
              <Plus />
              New template
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {templates === null ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
              ))}
            </div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-10 text-center">
              <FileText className="size-8 text-muted-foreground" />
              <div>
                <p className="font-medium">No templates yet</p>
                <p className="text-sm text-muted-foreground">Create one to send your first notification.</p>
              </div>
              {can('notifications.templates') && (
                <Button size="sm" onClick={() => openEdit(null)}>
                  <Plus />
                  New template
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {templates.map((t) => (
                <div key={t.id} className="group flex flex-col gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/40">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium tracking-wide text-muted-foreground uppercase">{t.name}</p>
                      <p className="mt-1 font-medium">{t.title}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" className="-mt-1 -mr-2 shrink-0 data-[state=open]:bg-muted">
                          <MoreHorizontal />
                          <span className="sr-only">Template options</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        {can('notifications.templates') && (
                          <DropdownMenuItem onSelect={() => openEdit(t)}>
                            <Pencil />
                            Edit
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {can('notifications.templates') && (
                          <DropdownMenuItem onSelect={() => setToArchive(t)}>
                            <Archive />
                            Archive
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="line-clamp-3 flex-1 text-sm text-muted-foreground">{t.body}</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                      {t.actionUrl && (
                        <>
                          <Link2 className="size-3 shrink-0" />
                          <span className="truncate">{t.actionUrl}</span>
                        </>
                      )}
                    </span>
                    {can('notifications.send') && (
                      <Button size="sm" variant="secondary" onClick={() => openSend(t.id)}>
                        <Send />
                        Send
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <SchedulesCard refreshKey={schedulesKey} />

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle>Customer groups</CardTitle>
            <CardDescription>Saved sets of customers to message together, like VIPs or a street’s regulars.</CardDescription>
          </div>
          {can('customerGroups.manage') && (
            <Button size="sm" variant="outline" onClick={() => openGroup(null)}>
              <Plus />
              New group
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {groups === null ? (
            <Skeleton className="h-16 w-full rounded-lg" />
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-8 text-center">
              <Users className="size-7 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No groups yet. Create one, or save customers as a group while sending.</p>
            </div>
          ) : (
            <ul className="divide-y rounded-lg border">
              {groups.map((g) => (
                <li key={g.id} className="flex items-center gap-3 px-3 py-2.5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold tabular-nums">{g.members.length}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{g.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {g.description ||
                        g.members
                          .slice(0, 4)
                          .map((m) => m.name || m.phoneNumber)
                          .join(', ') + (g.members.length > 4 ? ` and ${g.members.length - 4} more` : '')}
                    </p>
                  </div>
                  {can('notifications.send') && (
                    <Button size="sm" variant="secondary" onClick={() => openSend(undefined, g.id)} disabled={!g.members.length}>
                      <Send />
                      Send
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" className="data-[state=open]:bg-muted">
                        <MoreHorizontal />
                        <span className="sr-only">Group options</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      {can('customerGroups.manage') && (
                        <DropdownMenuItem onSelect={() => openGroup(g)}>
                          <Pencil />
                          Edit
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      {can('customerGroups.manage') && (
                        <DropdownMenuItem variant="destructive" onSelect={() => setToDeleteGroup(g)}>
                          <Trash2 />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">History</h2>
        <DataTable
          columns={columns}
          data={sends}
          isLoading={loading}
          getRowId={(s) => String(s.id)}
          initialSorting={[{ id: 'sent', desc: true }]}
          searchPlaceholder="Search messages…"
          filters={[
            {
              columnId: 'status',
              title: 'Status',
              options: Object.entries(SEND_STATUS).map(([value, s]) => ({
                value,
                label: s.label,
              })),
            },
          ]}
          toolbarActions={
            can('notifications.send') && (
              <Button size="sm" className="h-8" onClick={() => openSend()} disabled={!templates}>
                <Send />
                Send notification
              </Button>
            )
          }
          emptyMessage={sends.length === 0 ? 'Nothing sent yet.' : 'No sends match.'}
        />
      </div>

      {send && templates && (
        <SendNotificationDialog
          key={send.token}
          templates={templates}
          templateId={send.templateId}
          initialGroupId={send.groupId}
          open={sendOpen}
          onOpenChange={setSendOpen}
          onSent={() => {
            void load();
            setSchedulesKey((k) => k + 1);
          }}
        />
      )}
      {groupEdit && <CustomerGroupDialog key={groupEdit.token} group={groupEdit.group} open={groupEditOpen} onOpenChange={setGroupEditOpen} onSaved={groupSaved} />}
      {edit && <TemplateDialog key={edit.token} template={edit.template} open={editOpen} onOpenChange={setEditOpen} onSaved={() => void load()} />}

      <AlertDialog open={!!toDeleteGroup} onOpenChange={(o) => !o && setToDeleteGroup(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{toDeleteGroup?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>Only the saved group goes. The customers aren’t affected, and past messages stay in the history.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void deleteGroup()}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!toArchive} onOpenChange={(o) => !o && setToArchive(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive “{toArchive?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>It disappears from your templates. Messages already sent with it stay in the history.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void archive()}>Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
