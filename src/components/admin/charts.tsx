/**
 * Dependency-free SVG charts, rendered on the server. One series, one accent
 * (#B268FD carries data marks on dark surfaces at 5.7:1), quiet gridlines,
 * and a visually hidden table so the numbers are available to screen readers.
 */

interface Point {
  label: string;
  value: number;
}

function niceMax(v: number): number {
  if (v <= 0) return 1;
  const mag = 10 ** Math.floor(Math.log10(v));
  const n = v / mag;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag;
}

export function AreaChart({
  data,
  format,
  title,
  height = 220,
}: {
  data: Point[];
  format: (n: number) => string;
  title: string;
  height?: number;
}) {
  const W = 720;
  const H = height;
  const pad = { l: 56, r: 12, t: 12, b: 26 };
  const max = niceMax(Math.max(0, ...data.map((d) => d.value)));
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const x = (i: number) => pad.l + (data.length <= 1 ? iw / 2 : (i / (data.length - 1)) * iw);
  const y = (v: number) => pad.t + ih - (v / max) * ih;
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join("");
  const area = data.length ? `${line}L${x(data.length - 1).toFixed(1)},${pad.t + ih}L${x(0).toFixed(1)},${pad.t + ih}Z` : "";
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const every = Math.max(1, Math.ceil(data.length / 8));
  const gid = `g-${title.replace(/\W/g, "")}`;

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={title}>
        <defs>
          <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#b268fd" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#b268fd" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} className="adm-chart-grid" />
            <text x={pad.l - 8} y={y(t) + 3} textAnchor="end" className="adm-chart-axis">
              {format(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) =>
          i % every === 0 || i === data.length - 1 ? (
            <text key={d.label} x={x(i)} y={H - 8} textAnchor="middle" className="adm-chart-axis">
              {d.label}
            </text>
          ) : null,
        )}
        {area && <path d={area} fill={`url(#${gid})`} />}
        {line && <path d={line} fill="none" stroke="#b268fd" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
        {data.map((d, i) => (
          <circle key={i} cx={x(i)} cy={y(d.value)} r={data.length > 40 ? 0 : 2.5} fill="#b268fd">
            <title>{`${d.label}: ${format(d.value)}`}</title>
          </circle>
        ))}
      </svg>
      <table className="sr-only">
        <caption>{title}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <th>{d.label}</th>
              <td>{format(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export function BarList({ data, format }: { data: (Point & { sub?: string })[]; format: (n: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ul className="space-y-3">
      {data.map((d) => (
        <li key={d.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-[0.8125rem]">
            <span className="truncate text-bone">
              {d.label}
              {d.sub && <span className="ml-2 text-smoke">{d.sub}</span>}
            </span>
            <span className="numeric shrink-0 text-fog">{format(d.value)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-bone/[0.06]">
            <div className="h-full rounded-full bg-[#b268fd]" style={{ width: `${Math.max(2, (d.value / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
