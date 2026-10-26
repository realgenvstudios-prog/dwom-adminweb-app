import { useEffect, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import adminApiClient from '../../../services/apiClient';

interface Expiring {
  documentId: number;
  riderId: number;
  name: string;
  phone: string;
  document: string;
  required: boolean;
  expiresAt: string;
  expired: boolean;
}

/** Approved riders' documents that expire in the next 30 days, or already have. */
export default function ExpiringDocuments({ onOpen }: { onOpen: (riderId: number) => void }) {
  const [list, setList] = useState<Expiring[]>([]);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    adminApiClient
      .get<Expiring[]>('/riders/admin/documents/expiring?days=30')
      .then(setList)
      .catch(() => setList([]));
  }, []);

  if (!list.length) return null;
  const days = (iso: string) => Math.ceil((new Date(iso).getTime() - now) / 86_400_000);

  return (
    <Card className="gap-0 py-0">
      <div className="flex items-center gap-2 border-b px-4 py-3 text-sm font-medium">
        <CalendarClock className="size-4 text-amber-600" />
        Expiring documents
        <span className="text-muted-foreground tabular-nums">{list.length}</span>
      </div>
      <ul className="divide-y text-sm">
        {list.map((d) => (
          <li key={d.documentId}>
            <button type="button" onClick={() => onOpen(d.riderId)} className="flex w-full flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-left hover:bg-muted/50">
              <span>
                <span className="font-medium">{d.name || 'Rider'}</span>
                <span className="text-muted-foreground"> · {d.document}</span>
              </span>
              {d.expired ? (
                <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-700">
                  {d.required ? 'Expired: can’t go online' : 'Expired'}
                </Badge>
              ) : (
                <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700">
                  In {days(d.expiresAt)} day{days(d.expiresAt) === 1 ? '' : 's'}
                </Badge>
              )}
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
