import { useEffect, useRef, useState } from 'react';
import { fmtClock } from '../lib/calc';
import { useStore } from '../store';

const beep = () => {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    /* audio not available */
  }
  navigator.vibrate?.([200, 100, 200]);
};

export function RestTimer() {
  const restEndsAt = useStore((s) => s.restEndsAt);
  const adjustRest = useStore((s) => s.adjustRest);
  const stopRest = useStore((s) => s.stopRest);
  const [now, setNow] = useState(Date.now());
  const firedFor = useRef<number | null>(null);

  useEffect(() => {
    if (!restEndsAt) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [restEndsAt]);

  const remaining = restEndsAt ? (restEndsAt - now) / 1000 : 0;

  useEffect(() => {
    if (restEndsAt && remaining <= 0 && firedFor.current !== restEndsAt) {
      firedFor.current = restEndsAt;
      beep();
      stopRest();
    }
  }, [remaining, restEndsAt, stopRest]);

  if (!restEndsAt || remaining <= 0) return null;

  return (
    <div className="rest-timer" role="timer">
      <span className="muted small">Rest</span>
      <strong className="rest-clock">{fmtClock(remaining)}</strong>
      <button className="btn small ghost" onClick={() => adjustRest(-15)}>
        −15
      </button>
      <button className="btn small ghost" onClick={() => adjustRest(15)}>
        +15
      </button>
      <button className="btn small" onClick={stopRest}>
        Skip
      </button>
    </div>
  );
}
