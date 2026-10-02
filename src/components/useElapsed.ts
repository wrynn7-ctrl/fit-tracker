import { useEffect, useState } from 'react';
import { fmtClock } from '../lib/calc';

/** Live "m:ss" (or "h:mm:ss") since a start time; empty when no start. */
export function useElapsed(startedAt?: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!startedAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [startedAt]);
  if (!startedAt) return '';
  const sec = Math.max(0, (now - startedAt) / 1000);
  const h = Math.floor(sec / 3600);
  return h ? `${h}:${fmtClock(sec % 3600).padStart(5, '0')}` : fmtClock(sec);
}
