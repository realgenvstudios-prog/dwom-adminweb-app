import { useEffect, useRef, useState } from 'react';

const NUMBER = /-?\d[\d,]*(\.\d+)?/;

function parse(text: string) {
  const m = text.match(NUMBER);
  if (!m || m.index === undefined) return null;
  const raw = m[0];
  return {
    prefix: text.slice(0, m.index),
    suffix: text.slice(m.index + raw.length),
    value: Number(raw.replace(/,/g, '')),
    decimals: m[1] ? m[1].length - 1 : 0,
    grouped: raw.includes(','),
  };
}

const reduceMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Counts up to the number inside a formatted value ("GH₵ 1,234.50",
 * "38%", "12") keeping its prefix, suffix, decimals and grouping. Animates
 * from the previous value when it changes; static when there's no number
 * or the viewer prefers reduced motion.
 */
export function AnimatedValue({ text, duration = 700 }: { text: string; duration?: number }) {
  const target = parse(text);
  const [shown, setShown] = useState(() => (target && !reduceMotion() ? 0 : (target?.value ?? 0)));
  const from = useRef(shown);

  useEffect(() => {
    if (!target) return;
    if (reduceMotion()) {
      const id = requestAnimationFrame(() => setShown(target.value));
      return () => cancelAnimationFrame(id);
    }
    const start = performance.now();
    const begin = from.current;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = begin + (target.value - begin) * eased;
      from.current = v;
      setShown(v);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run only when the number changes
  }, [target?.value, duration]);

  if (!target) return <>{text}</>;
  const formatted = shown.toLocaleString('en-US', { minimumFractionDigits: target.decimals, maximumFractionDigits: target.decimals, useGrouping: target.grouped });
  return (
    <>
      {target.prefix}
      {formatted}
      {target.suffix}
    </>
  );
}
