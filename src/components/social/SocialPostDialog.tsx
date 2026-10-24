import { useEffect, useState } from 'react';
import { AlertTriangle, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import ImageUpload from '../common/ImageUpload';
import productsService, { type Product } from '../../services/productsService';
import bundlesService, { type Bundle } from '../../services/bundlesService';
import couponService, { type Coupon } from '../../services/couponService';
import socialService, { type SocialAccount } from '../../services/socialService';
import { logger } from '../../utils/logger';
import { formatGhs } from '../orders/order-status';
import { couponState, discountLabel } from '../marketing/coupon-meta';
import { platformOf } from './social-meta';

interface Props {
  accounts: SocialAccount[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const NONE = 'none';
const VIDEO = /\.(mp4|mov|m4v|webm)(\?|$)/i;

// Tomorrow at 18:00 local, as a datetime-local value: evenings get the most eyes.
function defaultTime() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(18, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function SocialPostDialog({ accounts, open, onOpenChange, onSaved }: Props) {
  const usable = accounts.filter((a) => a.active && !a.needsReconnection);
  const [accountIds, setAccountIds] = useState<string[]>(() => usable.map((a) => a.id));
  const [content, setContent] = useState('');
  const [media, setMedia] = useState('');
  const [promote, setPromote] = useState(NONE);
  const [couponId, setCouponId] = useState(NONE);
  const [includeLink, setIncludeLink] = useState(true);
  const [mode, setMode] = useState<'schedule' | 'now'>('schedule');
  const [time, setTime] = useState(defaultTime);
  const [problem, setProblem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  useEffect(() => {
    if (!open) return;
    productsService
      .getAll(undefined, undefined, 0, 1000)
      .then((p) => setProducts(p.filter((x) => x.active !== false).sort((a, b) => a.nameEnglish.localeCompare(b.nameEnglish))))
      .catch((err) => logger.error('Failed to load products:', err));
    bundlesService
      .getAll()
      .then((b) => setBundles(b.filter((x) => x.active)))
      .catch((err) => logger.error('Failed to load bundles:', err));
    couponService
      .getAll(false)
      .then((c) => setCoupons(c.filter((x) => couponState(x) === 'active')))
      .catch((err) => logger.error('Failed to load discount codes:', err));
  }, [open]);

  const chosen = usable.filter((a) => accountIds.includes(a.id));
  const platforms = [...new Set(chosen.map((a) => a.platform))];
  const coupon = coupons.find((c) => String(c.id) === couponId);

  // Warnings worth seeing before posting, per chosen platform.
  const warnings = (() => {
    const out: string[] = [];
    const length = content.trim().length + (includeLink ? 50 : 0);
    for (const p of platforms) {
      const meta = platformOf(p);
      if (length > meta.captionLimit) out.push(`${meta.label} allows ${meta.captionLimit.toLocaleString()} characters; this is about ${length.toLocaleString()}.`);
    }
    if (!media && platforms.some((p) => ['instagram', 'tiktok', 'youtube', 'pinterest'].includes(p))) {
      out.push(`${platforms.filter((p) => ['instagram', 'tiktok', 'youtube', 'pinterest'].includes(p)).map((p) => platformOf(p).label).join(' and ')} won’t post without a photo or video.`);
    }
    if (media && !VIDEO.test(media) && platforms.some((p) => ['tiktok', 'youtube'].includes(p))) {
      out.push(`${platforms.filter((p) => ['tiktok', 'youtube'].includes(p)).map((p) => platformOf(p).label).join(' and ')} need a video, not a photo.`);
    }
    return out;
  })();

  const toggle = (id: string) => setAccountIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  // Picking a product or bundle fills in a starter post and its photo.
  const choosePromote = (value: string) => {
    setPromote(value);
    if (value === NONE) return;
    const [kind, id] = value.split(':');
    if (kind === 'p') {
      const p = products.find((x) => String(x.id) === id);
      if (!p) return;
      const name = p.nameLocal && p.nameLocal !== p.nameEnglish ? `${p.nameEnglish} (${p.nameLocal})` : p.nameEnglish;
      if (!content.trim()) setContent(`Fresh ${name} is on DWOM today — ${formatGhs(Number(p.pricePerUnit))} per ${p.unitType}. Order now and we’ll bring it to your door.`);
      if (p.imageUrl) setMedia(p.imageUrl);
    } else {
      const b = bundles.find((x) => String(x.id) === id);
      if (!b) return;
      if (!content.trim()) setContent(`${b.name}: everything you need in one bundle for ${formatGhs(Number(b.price))}. Order on DWOM and we’ll deliver it.`);
      if (b.imageUrl) setMedia(b.imageUrl);
    }
  };

  const chooseCoupon = (value: string) => {
    setCouponId(value);
    const c = coupons.find((x) => String(x.id) === value);
    if (c && !content.toUpperCase().includes(c.code.toUpperCase())) {
      setContent((t) => `${t.trim()}${t.trim() ? '\n\n' : ''}Use code ${c.code} for ${discountLabel(c)}.`);
    }
  };

  const save = async () => {
    if (!chosen.length) return setProblem('Pick at least one account.');
    if (!content.trim()) return setProblem('Write the post.');
    let scheduledFor: string | undefined;
    if (mode === 'schedule') {
      const when = new Date(time);
      if (isNaN(when.getTime())) return setProblem('Pick a date and time.');
      if (when.getTime() < Date.now() + 2 * 60_000) return setProblem('Pick a time at least a couple of minutes from now, or choose Post now.');
      scheduledFor = when.toISOString();
    }
    const [kind, id] = promote === NONE ? [] : promote.split(':');
    setProblem(null);
    setSaving(true);
    try {
      const post = await socialService.create({
        content: content.trim(),
        mediaUrls: media ? [media] : [],
        accountIds: chosen.map((a) => a.id),
        ...(scheduledFor ? { scheduledFor } : { publishNow: true }),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Accra',
        productId: kind === 'p' ? Number(id) : undefined,
        bundleId: kind === 'b' ? Number(id) : undefined,
        couponId: coupon ? coupon.id : undefined,
        includeLink,
      });
      toast.success(post.status === 'failed' ? 'Saved, but Zernio couldn’t post it' : scheduledFor ? 'Post scheduled' : 'Posting now');
      onSaved();
      onOpenChange(false);
    } catch (err) {
      logger.error('Failed to create social post:', err);
      setProblem(err instanceof Error ? err.message : 'Couldn’t create the post.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New social post</DialogTitle>
          <DialogDescription>Zernio posts it to every account you pick, at the time you choose.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-5">
          <div className="grid gap-2">
            <Label>Post to</Label>
            <div className="flex flex-wrap gap-2">
              {accounts.map((a) => {
                const blocked = !a.active || a.needsReconnection;
                const on = accountIds.includes(a.id) && !blocked;
                return (
                  <button
                    key={a.id}
                    type="button"
                    disabled={blocked}
                    onClick={() => toggle(a.id)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                      on ? 'border-foreground bg-foreground text-background' : 'bg-background hover:bg-muted',
                      blocked && 'cursor-not-allowed opacity-50',
                    )}
                    title={blocked ? 'Reconnect this account in Zernio first' : undefined}
                  >
                    {on ? <Check className="size-3.5" /> : <span className={cn('size-2 rounded-full', platformOf(a.platform).dot)} />}
                    {platformOf(a.platform).label}
                    <span className={on ? 'opacity-70' : 'text-muted-foreground'}>@{a.username}</span>
                    {blocked && <span className="text-xs">· reconnect</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
            <div className="grid gap-2">
              <Label>Promote (optional)</Label>
              <Select value={promote} onValueChange={choosePromote}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Nothing in particular" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  <SelectItem value={NONE}>Nothing in particular</SelectItem>
                  {bundles.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>Bundles</SelectLabel>
                      {bundles.map((b) => (
                        <SelectItem key={`b${b.id}`} value={`b:${b.id}`}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                  <SelectGroup>
                    <SelectLabel>Products</SelectLabel>
                    {products.map((p) => (
                      <SelectItem key={`p${p.id}`} value={`p:${p.id}`}>
                        {p.nameEnglish}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Discount code (optional)</Label>
              <Select value={couponId} onValueChange={chooseCoupon}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="No code" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  <SelectItem value={NONE}>No code</SelectItem>
                  {coupons.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.code} · {discountLabel(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Orders using this code after the post goes out count as its sales.</p>
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="social-content">Post</Label>
              <span className="text-xs text-muted-foreground tabular-nums">{content.length.toLocaleString()} characters</span>
            </div>
            <Textarea id="social-content" rows={6} value={content} onChange={(e) => setContent(e.target.value)} placeholder="What do you want to tell people?" />
          </div>

          <ImageUpload value={media} onChange={setMedia} label="Photo or video (paste a video link)" />

          <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="social-link">Add a DWOM link</Label>
              <p className="text-xs text-muted-foreground">Adds a short link that opens the app store, so we can count who tapped it.</p>
            </div>
            <Switch id="social-link" checked={includeLink} onCheckedChange={setIncludeLink} />
          </div>

          <div className="grid gap-2">
            <Label>When</Label>
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex rounded-lg border p-0.5">
                {(['schedule', 'now'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={cn('rounded-md px-3 py-1.5 text-sm', mode === m ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground')}
                  >
                    {m === 'schedule' ? 'Schedule' : 'Post now'}
                  </button>
                ))}
              </div>
              {mode === 'schedule' && <Input type="datetime-local" value={time} onChange={(e) => setTime(e.target.value)} className="w-auto" />}
            </div>
          </div>

          {warnings.length > 0 && (
            <div className="grid gap-1 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
              {warnings.map((w) => (
                <p key={w} className="flex gap-2">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  {w}
                </p>
              ))}
            </div>
          )}
          {problem && <p className="text-sm text-destructive">{problem}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void save()} disabled={saving}>
            {saving && <Loader2 className="animate-spin" />}
            {mode === 'schedule' ? 'Schedule post' : 'Post now'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
