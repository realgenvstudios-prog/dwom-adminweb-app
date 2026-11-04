import { waitUntil } from '@vercel/functions';

// get.dwom.org: the one link on every flyer's QR code. It sends each phone to
// its own app store, and records the scan for the dashboard on the way.
// Lives on Vercel, not the backend, so the redirect is instant even while the
// backend is asleep or restarting; the scan is saved in the background.

const APP_STORE = 'https://apps.apple.com/app/id6759815651';
const PLAY_STORE = 'https://play.google.com/store/apps/details?id=com.realgenius.dwom';
const API_URL = process.env.QR_API_URL || 'https://dwom-backend.onrender.com';
const GENERAL = 'general';

type Platform = 'ios' | 'android' | 'other';

// Link previews in chat apps fetch the page without anyone scanning.
const BOT = /bot|crawl|spider|preview|facebookexternalhit|whatsapp|telegram|slack|discord|twitter|linkedin/i;

function platformOf(userAgent: string): Platform {
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'ios';
  if (/android/i.test(userAgent)) return 'android';
  return 'other';
}

function slugOf(url: URL) {
  // The rewrite from get.dwom.org/<slug> passes the slug as ?path=.
  const raw = url.searchParams.get('f') || url.searchParams.get('path') || '';
  const slug = raw.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40);
  return slug && slug !== 'api' ? slug : GENERAL;
}

// Tagged so each store's own reports can show downloads by flyer too.
function storeUrl(platform: Platform, slug: string) {
  if (platform === 'ios') return `${APP_STORE}?ct=${encodeURIComponent(slug)}&mt=8`;
  const referrer = `utm_source=qr&utm_medium=flyer&utm_campaign=${slug}`;
  return `${PLAY_STORE}&referrer=${encodeURIComponent(referrer)}`;
}

function header(request: Request, name: string) {
  const value = request.headers.get(name);
  if (!value) return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

async function recordScan(request: Request, slug: string, platform: Platform) {
  const secret = process.env.QR_SCAN_SECRET;
  if (!secret) return;
  try {
    await fetch(`${API_URL}/qr/scans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-qr-secret': secret },
      body: JSON.stringify({
        slug,
        platform,
        city: header(request, 'x-vercel-ip-city'),
        country: header(request, 'x-vercel-ip-country'),
      }),
      // A sleeping backend can take a while to wake; the customer isn't waiting on this.
      signal: AbortSignal.timeout(60_000),
    });
  } catch {
    // A lost scan only means a count is one short.
  }
}

const page = (slug: string) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Get the DWOM app</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #F5F5F5; color: #111; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  main { width: min(360px, calc(100% - 32px)); background: #fff; border-radius: 24px; padding: 32px 24px; text-align: center; box-shadow: 0 8px 30px rgba(0,0,0,.08); }
  h1 { margin: 0 0 8px; font-size: 26px; }
  p { margin: 0 0 24px; color: #666; line-height: 1.5; }
  a { display: block; margin-top: 12px; padding: 14px; border-radius: 28px; background: #C53030; color: #fff; text-decoration: none; font-weight: 600; }
  a + a { background: #111; }
</style>
</head>
<body>
<main>
  <h1>Get the DWOM app</h1>
  <p>Fresh groceries from the market, delivered. Open this link on your phone, or pick your store.</p>
  <a href="${storeUrl('ios', slug)}">Download on the App Store</a>
  <a href="${storeUrl('android', slug)}">Get it on Google Play</a>
</main>
</body>
</html>`;

export function GET(request: Request) {
  const url = new URL(request.url);
  const slug = slugOf(url);
  const userAgent = request.headers.get('user-agent') ?? '';
  const platform = platformOf(userAgent);

  if (!BOT.test(userAgent)) waitUntil(recordScan(request, slug, platform));

  if (platform === 'other') {
    return new Response(page(slug), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
  }
  // Not cached, so every scan comes through here and is counted.
  return new Response(null, { status: 302, headers: { Location: storeUrl(platform, slug), 'Cache-Control': 'no-store' } });
}
