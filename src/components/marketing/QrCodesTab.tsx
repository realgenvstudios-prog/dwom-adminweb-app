import { useCallback, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { toast } from 'sonner';
import { Apple, Copy, Download, MapPin, Monitor, Plus, QrCode as QrIcon, ScanLine, Smartphone, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatCard } from '@/components/stat-card';
import { cn } from '@/lib/utils';
import qrCodeService, { linkOf, type QrCode, type QrStats } from '../../services/qrCodeService';
import { can } from '../../config/permissions';
import { logger } from '../../utils/logger';

const RANGES = [7, 30, 90] as const;
const chartConfig: ChartConfig = { scans: { label: 'Scans', color: 'var(--chart-1)' } };
// Black on white with room around it scans most reliably once printed.
const QR_OPTIONS = { margin: 2, errorCorrectionLevel: 'M' as const, color: { dark: '#000000', light: '#FFFFFF' } };

const dayLabel = (day: string) => new Date(`${day}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

function save(href: string, filename: string) {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  a.click();
}

async function downloadPng(code: QrCode) {
  save(await QRCode.toDataURL(linkOf(code), { ...QR_OPTIONS, width: 1200 }), `dwom-qr-${code.slug}.png`);
}

async function downloadSvg(code: QrCode) {
  const svg = await QRCode.toString(linkOf(code), { ...QR_OPTIONS, type: 'svg' });
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  save(url, `dwom-qr-${code.slug}.svg`);
  URL.revokeObjectURL(url);
}

function QrThumb({ code }: { code: QrCode }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    let live = true;
    QRCode.toDataURL(linkOf(code), { ...QR_OPTIONS, width: 160 }).then((url) => live && setSrc(url));
    return () => {
      live = false;
    };
  }, [code]);
  return src ? <img src={src} alt="" className={cn('size-14 rounded-md border bg-white', code.archived && 'opacity-40')} /> : <div className="size-14 rounded-md border" />;
}

export default function QrCodesTab() {
  const [days, setDays] = useState<(typeof RANGES)[number]>(30);
  const [codes, setCodes] = useState<QrCode[]>([]);
  const [stats, setStats] = useState<QrStats | null>(null);
  const [focus, setFocus] = useState<QrCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const canManage = can('qrCodes.manage');

  const load = useCallback(async () => {
    try {
      setError(null);
      const [list, numbers] = await Promise.all([qrCodeService.list(days), qrCodeService.stats(days, focus?.id)]);
      setCodes(list);
      setStats(numbers);
    } catch (err) {
      logger.error('Failed to load QR codes:', err);
      setError(err instanceof Error ? err.message : 'Failed to load QR codes');
    } finally {
      setLoading(false);
    }
  }, [days, focus]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    if (!name.trim()) return;
    try {
      setCreating(true);
      const code = await qrCodeService.create(name.trim());
      setName('');
      toast.success(`Created ${code.name}. Download its QR code for the flyer.`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't create the code.");
    } finally {
      setCreating(false);
    }
  };

  const toggle = async (code: QrCode) => {
    try {
      await qrCodeService.setArchived(code.id, !code.archived);
      toast.success(code.archived ? `${code.name} is on again.` : `${code.name} is off. Its scans now count towards General.`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't change the code.");
    }
  };

  const copy = (code: QrCode) =>
    navigator.clipboard.writeText(linkOf(code)).then(
      () => toast.success('Link copied'),
      () => toast.error("Couldn't copy the link"),
    );

  const total = stats?.total ?? 0;
  const share = (n: number) => (total ? `${Math.round((n / total) * 100)}% of scans` : 'No scans yet');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Each code sends iPhones to the App Store and Android phones to Play. Use a code per place to see which flyers work, and General anywhere else.
        </p>
        <div className="flex gap-1 rounded-lg border p-1">
          {RANGES.map((r) => (
            <Button key={r} size="sm" variant={days === r ? 'secondary' : 'ghost'} onClick={() => setDays(r)}>
              {r} days
            </Button>
          ))}
        </div>
      </div>

      {focus && (
        <div className="flex items-center gap-2 text-sm">
          Showing scans for <Badge variant="secondary">{focus.name}</Badge>
          <Button size="sm" variant="ghost" onClick={() => setFocus(null)}>
            <X />
            Show all codes
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Scans" value={total.toLocaleString()} hint={`Last ${days} days`} icon={ScanLine} tint="bg-rose-500/10 text-rose-600" loading={loading} failed={!!error} />
        <StatCard label="iPhone" value={(stats?.platforms.ios ?? 0).toLocaleString()} hint={share(stats?.platforms.ios ?? 0)} icon={Apple} tint="bg-zinc-500/10 text-zinc-700" loading={loading} failed={!!error} />
        <StatCard label="Android" value={(stats?.platforms.android ?? 0).toLocaleString()} hint={share(stats?.platforms.android ?? 0)} icon={Smartphone} tint="bg-emerald-500/10 text-emerald-600" loading={loading} failed={!!error} />
        <StatCard label="Computer or other" value={(stats?.platforms.other ?? 0).toLocaleString()} hint="Shown both store buttons" icon={Monitor} tint="bg-sky-500/10 text-sky-600" loading={loading} failed={!!error} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <Card>
          <CardHeader>
            <CardTitle>Scans per day</CardTitle>
            <CardDescription>{focus ? focus.name : 'All codes'}</CardDescription>
          </CardHeader>
          <CardContent>
            {total === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">{loading ? 'Loading…' : 'No scans in this period yet.'}</p>
            ) : (
              <ChartContainer config={chartConfig} className="h-48 w-full">
                <BarChart data={(stats?.daily ?? []).map((d) => ({ ...d, label: dayLabel(d.day) }))} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} fontSize={11} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  <Bar dataKey="scans" fill="var(--color-scans)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="size-4 text-muted-foreground" />
              Where scans happen
            </CardTitle>
            <CardDescription>Approximate city, from the phone's network</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.cities.length ? (
              <ul className="grid gap-2 text-sm">
                {stats.cities.map((c) => (
                  <li key={c.city} className="flex justify-between gap-2">
                    <span className="truncate">{c.city}</span>
                    <span className="tabular-nums text-muted-foreground">{c.scans.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No locations yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <QrIcon className="size-4 text-muted-foreground" />
                Codes
              </CardTitle>
              <CardDescription>Download a code for each flyer. SVG stays sharp at any print size.</CardDescription>
            </div>
            {canManage && (
              <form
                className="flex w-full gap-2 sm:w-auto"
                onSubmit={(e) => {
                  e.preventDefault();
                  void create();
                }}
              >
                <Input className="sm:w-64" placeholder="Where it goes, e.g. Madina Market" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
                <Button type="submit" disabled={creating || !name.trim()}>
                  <Plus />
                  New code
                </Button>
              </form>
            )}
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16" />
                  <TableHead>Code</TableHead>
                  <TableHead className="text-right">Scans</TableHead>
                  <TableHead className="text-right">iPhone</TableHead>
                  <TableHead className="text-right">Android</TableHead>
                  <TableHead className="text-right">Other</TableHead>
                  <TableHead className="text-right">Download</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.map((code) => (
                  <TableRow key={code.id} className={cn(code.archived && 'text-muted-foreground')}>
                    <TableCell>
                      <QrThumb code={code} />
                    </TableCell>
                    <TableCell>
                      <button type="button" className="text-left font-medium hover:underline" onClick={() => setFocus(code)}>
                        {code.name}
                      </button>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {linkOf(code).replace('https://', '')}
                        {code.general && <Badge variant="outline">Default</Badge>}
                        {code.archived && <Badge variant="outline">Off</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{code.scans.total.toLocaleString()}</TableCell>
                    <TableCell className="text-right tabular-nums">{code.scans.ios.toLocaleString()}</TableCell>
                    <TableCell className="text-right tabular-nums">{code.scans.android.toLocaleString()}</TableCell>
                    <TableCell className="text-right tabular-nums">{code.scans.other.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="outline" onClick={() => void downloadPng(code)} disabled={code.archived}>
                          <Download />
                          PNG
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => void downloadSvg(code)} disabled={code.archived}>
                          SVG
                        </Button>
                        <Button size="icon-sm" variant="ghost" onClick={() => copy(code)} aria-label={`Copy the link for ${code.name}`}>
                          <Copy />
                        </Button>
                        {canManage && !code.general && (
                          <Button size="sm" variant="ghost" onClick={() => void toggle(code)}>
                            {code.archived ? 'Turn on' : 'Turn off'}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
