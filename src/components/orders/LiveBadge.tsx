import { useEffect, useState } from 'react';

/** "Live · updated 12s ago" with a pulsing dot. */
export default function LiveBadge({ updatedAt }: { updatedAt: number | null }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);
  const secs = updatedAt ? Math.max(0, Math.round((now - updatedAt) / 1000)) : null;
  return (
    <span className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
      </span>
      Live
      {secs !== null && <span className="tabular-nums">· updated {secs < 10 ? 'just now' : `${secs}s ago`}</span>}
    </span>
  );
}
