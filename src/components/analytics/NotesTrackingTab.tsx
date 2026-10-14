import { CircleHelp, FileText, ShoppingCart, Sparkles, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/stat-card';
import type { NotesAnalytics } from '../../services/notesService';
import { formatDate } from '../customers/CustomerTypes';

const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

// Shopping notes: customers type a list ("2 tins tomatoes, onions…") and
// the app turns it into products. All-time figures from /notes/analytics.
export default function NotesTrackingTab({ data, loading, failed }: { data: NotesAnalytics | null; loading: boolean; failed: boolean }) {
  const s = data?.stats;
  // Notes that were understood and then added to cart move to
  // 'added_to_cart', so "understood" is both statuses together.
  const understood = s ? s.processedNotes + s.addedToCart : 0;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">How well the app turns customers’ typed shopping lists into products. All time.</p>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Notes written" value={(s?.totalNotes ?? 0).toLocaleString()} icon={FileText} tint="bg-sky-500/10 text-sky-600" loading={loading} failed={failed} />
        <StatCard
          label="Understood"
          value={`${pct(understood, s?.totalNotes ?? 0)}%`}
          hint={s ? `${understood.toLocaleString()} notes matched to products` : undefined}
          icon={Sparkles}
          tint="bg-emerald-500/10 text-emerald-600"
          loading={loading}
          failed={failed}
        />
        <StatCard
          label="Turned into a cart"
          value={(s?.addedToCart ?? 0).toLocaleString()}
          hint={s ? `${pct(s.addedToCart, understood)}% of understood notes` : undefined}
          icon={ShoppingCart}
          tint="bg-violet-500/10 text-violet-600"
          loading={loading}
          failed={failed}
        />
        <StatCard
          label="Match confidence"
          value={`${Math.round((s?.avgConfidence ?? 0) * 100)}%`}
          hint={s ? `${s.errorNotes.toLocaleString()} notes not understood` : undefined}
          icon={Target}
          tint="bg-amber-500/10 text-amber-600"
          loading={loading}
          failed={failed}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CircleHelp className="size-4 text-amber-600" />
              Unsure matches
            </CardTitle>
            <CardDescription>Words matched to a product with low confidence — often a local name or spelling worth adding to that product’s names.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-56 w-full" />
            ) : !data?.lowConfidenceMatches.length ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No unsure matches.</p>
            ) : (
              <ul className="divide-y rounded-lg border text-sm">
                {data.lowConfidenceMatches.slice(0, 15).map((m, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 px-3 py-2">
                    <div className="min-w-0">
                      <p>
                        <span className="font-medium">“{m.originalText}”</span> <span className="text-muted-foreground">→</span> {m.matchedProduct}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">in “{m.searchedAs}”</p>
                    </div>
                    <Badge variant="outline" className={m.confidence < 0.5 ? 'border-red-500/20 bg-red-500/10 text-red-700' : 'border-amber-500/20 bg-amber-500/10 text-amber-700'}>
                      {Math.round(m.confidence * 100)}%
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Not understood</CardTitle>
            <CardDescription>Notes where no product could be recognised (latest first)</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-56 w-full" />
            ) : !data?.errorNotes.length ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Every note was understood.</p>
            ) : (
              <ul className="divide-y rounded-lg border text-sm">
                {data.errorNotes.slice(0, 15).map((n) => (
                  <li key={n.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="min-w-0 truncate">“{n.originalText}”</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatDate(n.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Most common notes</CardTitle>
          <CardDescription>Shopping lists customers write most often — candidates for a ready-made bundle.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : !data?.commonSearches.length ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No notes yet.</p>
          ) : (
            <ul className="divide-y rounded-lg border text-sm">
              {data.commonSearches.slice(0, 15).map((c) => (
                <li key={c.text} className="flex items-center justify-between gap-3 px-3 py-2">
                  <span className="min-w-0 truncate">“{c.text}”</span>
                  <span className="shrink-0 text-muted-foreground tabular-nums">{c.count.toLocaleString()}×</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
