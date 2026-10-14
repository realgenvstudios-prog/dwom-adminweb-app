import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { AlertCircle, Archive, FileText, Link2, MoreHorizontal, Pencil, Plus, RotateCw, Send } from 'lucide-react';
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
import marketingService, { type NotificationSend, type NotificationTemplate } from '../../services/marketingService';
import { logger } from '../../utils/logger';
import SendNotificationDialog from './SendNotificationDialog';
import TemplateDialog from './TemplateDialog';

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
    : '—';

function ChannelResult({ ok = 0, failed = 0 }: { ok?: number; failed?: number }) {
  if (!ok && !failed) return <span className="text-muted-foreground">—</span>;
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
    token: number;
  } | null>(null);
  const [sendOpen, setSendOpen] = useState(false);
  const [edit, setEdit] = useState<{
    template: NotificationTemplate | null;
    token: number;
  } | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [toArchive, setToArchive] = useState<NotificationTemplate | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [s, t] = await Promise.all([marketingService.getNotificationSends(), marketingService.getTemplates()]);
      setSends(s);
      setTemplates(t);
    } catch (err) {
      logger.error('Failed to load notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
      setTemplates((t) => t ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const openSend = (templateId?: number) => {
    setSend({ templateId, token: Date.now() });
    setSendOpen(true);
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
        accessorFn: (s) => `${s.template?.name ?? ''} ${s.template?.title ?? ''}`,
        header: 'Message',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="max-w-[300px] min-w-[160px]">
            <p className="truncate font-medium">{row.original.template?.name ?? `Template #${row.original.templateId}`}</p>
            <p className="truncate text-xs text-muted-foreground">{row.original.template?.title}</p>
          </div>
        ),
        meta: { title: 'Message' },
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
            <CardDescription>Reusable messages. Send one to all customers, or narrow by zone and subscription.</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={() => openEdit(null)}>
            <Plus />
            New template
          </Button>
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
              <Button size="sm" onClick={() => openEdit(null)}>
                <Plus />
                New template
              </Button>
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
                        <DropdownMenuItem onSelect={() => openEdit(t)}>
                          <Pencil />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => setToArchive(t)}>
                          <Archive />
                          Archive
                        </DropdownMenuItem>
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
                    <Button size="sm" variant="secondary" onClick={() => openSend(t.id)}>
                      <Send />
                      Send
                    </Button>
                  </div>
                </div>
              ))}
            </div>
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
            <Button size="sm" className="h-8" onClick={() => openSend()} disabled={!templates?.length}>
              <Send />
              Send notification
            </Button>
          }
          emptyMessage={sends.length === 0 ? 'Nothing sent yet.' : 'No sends match.'}
        />
      </div>

      {send && templates && (
        <SendNotificationDialog key={send.token} templates={templates} templateId={send.templateId} open={sendOpen} onOpenChange={setSendOpen} onSent={() => void load()} />
      )}
      {edit && <TemplateDialog key={edit.token} template={edit.template} open={editOpen} onOpenChange={setEditOpen} onSaved={() => void load()} />}

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
