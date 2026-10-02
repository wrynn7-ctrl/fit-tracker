export interface Point {
  x: number;
  y: number;
}

const W = 320;
const H = 160;
const PAD = { l: 36, r: 10, t: 10, b: 22 };

const niceRange = (min: number, max: number) => {
  if (min === max) return [min - 1, max + 1];
  const pad = (max - min) * 0.1;
  return [min - pad, max + pad];
};

const shortDate = (ts: number) => new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

export function LineChart({ points, format = (v) => v.toFixed(0) }: { points: Point[]; format?: (v: number) => string }) {
  if (points.length === 0) return <p className="muted empty">No data yet.</p>;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const [x0, x1] = xs.length > 1 ? [Math.min(...xs), Math.max(...xs)] : [xs[0] - 1, xs[0] + 1];
  const [y0, y1] = niceRange(Math.min(...ys), Math.max(...ys));
  const sx = (x: number) => PAD.l + ((x - x0) / (x1 - x0)) * (W - PAD.l - PAD.r);
  const sy = (y: number) => H - PAD.b - ((y - y0) / (y1 - y0)) * (H - PAD.t - PAD.b);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(' ');
  const ticks = [y0, (y0 + y1) / 2, y1];

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img">
      {ticks.map((t) => (
        <g key={t}>
          <line className="grid" x1={PAD.l} x2={W - PAD.r} y1={sy(t)} y2={sy(t)} />
          <text className="axis" x={PAD.l - 4} y={sy(t) + 3} textAnchor="end">
            {format(t)}
          </text>
        </g>
      ))}
      <path className="line" d={d} />
      {points.map((p, i) => (
        <circle key={i} className="dot" cx={sx(p.x)} cy={sy(p.y)} r={3}>
          <title>
            {shortDate(p.x)}: {format(p.y)}
          </title>
        </circle>
      ))}
      <text className="axis" x={PAD.l} y={H - 6}>
        {shortDate(x0)}
      </text>
      {xs.length > 1 && (
        <text className="axis" x={W - PAD.r} y={H - 6} textAnchor="end">
          {shortDate(x1)}
        </text>
      )}
    </svg>
  );
}

export function BarChart({
  bars,
  format = (v) => v.toFixed(0),
}: {
  bars: { label: string; value: number }[];
  format?: (v: number) => string;
}) {
  if (!bars.length) return <p className="muted empty">No data yet.</p>;
  const max = Math.max(1, ...bars.map((b) => b.value));
  const bw = (W - PAD.l - PAD.r) / bars.length;
  const sy = (y: number) => H - PAD.b - (y / max) * (H - PAD.t - PAD.b);
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img">
      <line className="grid" x1={PAD.l} x2={W - PAD.r} y1={sy(0)} y2={sy(0)} />
      <text className="axis" x={PAD.l - 4} y={sy(max) + 3} textAnchor="end">
        {format(max)}
      </text>
      {bars.map((b, i) => (
        <g key={b.label + i}>
          <rect
            className="bar"
            x={PAD.l + i * bw + bw * 0.15}
            width={bw * 0.7}
            y={sy(b.value)}
            height={Math.max(0, sy(0) - sy(b.value))}
            rx={2}
          >
            <title>
              {b.label}: {format(b.value)}
            </title>
          </rect>
          {(bars.length <= 8 || i % 2 === 0) && (
            <text className="axis" x={PAD.l + i * bw + bw / 2} y={H - 6} textAnchor="middle">
              {b.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
