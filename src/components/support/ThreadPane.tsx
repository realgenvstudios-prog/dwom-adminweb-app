import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, Loader2, Mail, MessageSquareOff, Phone, RotateCcw, SendHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import supportService, { type SupportThread } from '../../services/supportService';
import { logger } from '../../utils/logger';
import { displayName, initials, stateMeta } from './support-meta';
import { can } from '../../config/permissions';

interface ThreadPaneProps {
  userId: number;
  /** Bumped by the page's poll so an open thread picks up new messages. */
  refreshKey: number;
  onBack: () => void;
  onChanged: () => void;
}

const dayLabel = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: d.getFullYear() === today.getFullYear() ? undefined : 'numeric' });
};
const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

export default function ThreadPane({ userId, refreshKey, onBack, onChanged }: ThreadPaneProps) {
  const [thread, setThread] = useState<SupportThread | null>(null);
  const [failed, setFailed] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [toggling, setToggling] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const lastCount = useRef(0);

  const load = useCallback(async () => {
    try {
      const t = await supportService.getConversation(userId);
      setThread(t);
      setFailed(false);
    } catch (err) {
      logger.error('Failed to load conversation:', err);
      setFailed(true);
    }
  }, [userId]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load, refreshKey]);

  // Keep the newest message in view when messages arrive.
  useEffect(() => {
    const n = thread?.messages.length ?? 0;
    if (n !== lastCount.current) {
      lastCount.current = n;
      endRef.current?.scrollIntoView({ block: 'end' });
    }
  }, [thread]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    try {
      setSending(true);
      const r = await supportService.reply(userId, text);
      setDraft('');
      if (!r.notified) toast.message('Reply sent', { description: 'They don’t have push notifications on, so they’ll see it next time they open Support in the app.' });
      await load();
      onChanged();
    } catch {
      toast.error('Couldn’t send the reply. It wasn’t delivered. Try again.');
    } finally {
      setSending(false);
    }
  };

  const toggleResolved = async () => {
    if (!thread) return;
    const resolve = thread.state !== 'resolved';
    try {
      setToggling(true);
      setThread(await supportService.setResolved(userId, resolve));
      toast.success(resolve ? 'Marked as resolved' : 'Reopened');
      onChanged();
    } catch (err) {
      logger.error('Failed to update conversation:', err);
      toast.error('Couldn’t update the conversation.');
    } finally {
      setToggling(false);
    }
  };

  if (failed && !thread) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-sm text-muted-foreground">
        <MessageSquareOff className="size-8" />
        Couldn’t load this conversation.
        <Button variant="outline" size="sm" onClick={() => void load()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-6">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="ml-auto h-14 w-2/3" />
        <Skeleton className="h-14 w-1/2" />
        <Skeleton className="ml-auto h-10 w-1/3" />
      </div>
    );
  }

  const name = displayName(thread);
  const state = stateMeta(thread.state);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={onBack} aria-label="Back to conversations">
          <ArrowLeft />
        </Button>
        <Avatar className="size-9">
          <AvatarFallback className="text-xs">{initials(name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium">{name}</p>
            <Badge variant="outline" className={state.className}>
              {state.label}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
            {thread.phone && (
              <a href={`tel:${thread.phone}`} className="inline-flex items-center gap-1 hover:text-foreground">
                <Phone className="size-3" />
                {thread.phone}
              </a>
            )}
            {thread.email && (
              <a href={`mailto:${thread.email}`} className="inline-flex items-center gap-1 hover:text-foreground">
                <Mail className="size-3" />
                {thread.email}
              </a>
            )}
          </div>
        </div>
        {can('support.reply') && (
          <Button variant="outline" size="sm" onClick={() => void toggleResolved()} disabled={toggling}>
            {toggling ? <Loader2 className="animate-spin" /> : thread.state === 'resolved' ? <RotateCcw /> : <CheckCircle2 />}
            {thread.state === 'resolved' ? 'Reopen' : 'Resolve'}
          </Button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-muted/30 px-4 py-4">
        <div className="mx-auto flex max-w-2xl flex-col gap-1.5">
          {thread.messages.map((m, i) => {
            const prev = thread.messages[i - 1];
            const newDay = !prev || new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString();
            const mine = m.sender === 'support';
            return (
              <Fragment key={m.id}>
                {newDay && <p className="my-2 text-center text-xs text-muted-foreground">{dayLabel(m.createdAt)}</p>}
                <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-xs',
                      mine ? 'rounded-br-md bg-primary text-primary-foreground' : 'rounded-bl-md border bg-background',
                    )}
                  >
                    <p className="break-words whitespace-pre-wrap">{m.text}</p>
                    <p className={cn('mt-0.5 text-right text-[10px]', mine ? 'text-primary-foreground/70' : 'text-muted-foreground')}>{timeLabel(m.createdAt)}</p>
                  </div>
                </div>
              </Fragment>
            );
          })}
          <div ref={endRef} />
        </div>
      </div>

      {can('support.reply') ? (
        <div className="border-t p-3">
          <div className="mx-auto flex max-w-2xl items-end gap-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              rows={1}
              placeholder={`Reply to ${name}…`}
              className="max-h-40 min-h-10 resize-none"
              aria-label="Reply"
            />
            <Button onClick={() => void send()} disabled={!draft.trim() || sending} size="icon" aria-label="Send reply">
              {sending ? <Loader2 className="animate-spin" /> : <SendHorizontal />}
            </Button>
          </div>
          <p className="mx-auto mt-1.5 max-w-2xl text-[11px] text-muted-foreground">Enter to send · Shift+Enter for a new line · They get a push notification</p>
        </div>
      ) : (
        <p className="border-t p-3 text-center text-xs text-muted-foreground">You can read this conversation. Replying needs the “Reply and resolve conversations” permission.</p>
      )}
    </div>
  );
}
