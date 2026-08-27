import { COLORWAYS, FLATS, TONES, poseGeometry, rng } from "@/lib/art";
import type { ColorwayKey, FlatKey, Pose, Tone } from "@/lib/art";

/* ==================================================================
   GRAIN — the single most effective "expensive" tell.
   Rendered as an inline filter so it never costs a network request.
   ================================================================== */

export function Grain({ id, opacity = 0.34 }: { id: string; opacity?: number }) {
  return (
    <>
      <filter id={`grain-${id}`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="4" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect
        width="100%"
        height="100%"
        filter={`url(#grain-${id})`}
        opacity={opacity}
        style={{ mixBlendMode: "overlay" }}
      />
    </>
  );
}

/* ==================================================================
   SCULPTURE
   A faceted figure in architectural light. The brand name, literal.
   ================================================================== */

interface SculptureProps {
  seed: string;
  tone?: Tone;
  pose?: Pose;
  /** Horizontal placement of the figure within the frame, 0 → 1. */
  anchor?: number;
  /** Scale of the figure relative to the frame. */
  scale?: number;
  className?: string;
  /** Decorative by default; pass a label when the image carries meaning. */
  label?: string;
  priority?: boolean;
}

export function Sculpture({
  seed,
  tone = "apparel",
  pose = "front",
  anchor = 0.5,
  scale = 1,
  className = "",
  label,
}: SculptureProps) {
  const p = TONES[tone];
  const r = rng(seed);
  const { silhouette, facets } = poseGeometry(pose);
  const uid = `s${Math.abs(Math.round(r() * 1e9)).toString(36)}`;

  // Composition jitter — enough to make every frame distinct, never
  // enough to break the art direction.
  const shaftAngle = -18 + r() * 36;
  const shaftX = 120 + r() * 520;
  const horizon = 720 + r() * 140;
  const columnA = 60 + r() * 120;
  const columnB = 820 + r() * 120;
  const figureX = 500 + (anchor - 0.5) * 900;
  const figureY = 640 + (r() - 0.5) * 40;
  const rimSide = r() > 0.5 ? 1 : -1;

  return (
    <svg
      viewBox="0 0 1000 1200"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role={label ? "img" : "presentation"}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <defs>
        {/* Field — a slow vertical fall-off, never a flat colour */}
        <linearGradient id={`${uid}-field`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor={p.base} />
          <stop offset="46%" stopColor={p.mid} stopOpacity="0.55" />
          <stop offset="100%" stopColor={p.base} />
        </linearGradient>

        {/* Key light shaft */}
        <linearGradient id={`${uid}-shaft`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.haze} stopOpacity="0" />
          <stop offset="34%" stopColor={p.haze} stopOpacity="0.5" />
          <stop offset="100%" stopColor={p.haze} stopOpacity="0" />
        </linearGradient>

        {/* Modelling gradient across the form */}
        <linearGradient id={`${uid}-model`} x1="0" y1="0" x2="1" y2="0.55">
          <stop offset="0%" stopColor={p.high} />
          <stop offset="52%" stopColor={p.mid} />
          <stop offset="100%" stopColor={p.base} />
        </linearGradient>

        {/* Rim light — the one saturated edge */}
        <linearGradient id={`${uid}-rim`} x1={rimSide > 0 ? "0" : "1"} y1="0" x2={rimSide > 0 ? "1" : "0"} y2="0">
          <stop offset="0%" stopColor={p.key} stopOpacity="0.92" />
          <stop offset="24%" stopColor={p.key} stopOpacity="0.12" />
          <stop offset="100%" stopColor={p.key} stopOpacity="0" />
        </linearGradient>

        {/* Floor contact shadow */}
        <radialGradient id={`${uid}-contact`}>
          <stop offset="0%" stopColor={p.base} stopOpacity="0.9" />
          <stop offset="100%" stopColor={p.base} stopOpacity="0" />
        </radialGradient>

        {/* Cinematic vignette */}
        <radialGradient id={`${uid}-vig`} cx="0.5" cy="0.42" r="0.78">
          <stop offset="52%" stopColor={p.base} stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.82" />
        </radialGradient>

        <clipPath id={`${uid}-clip`}>
          <path d={silhouette} />
        </clipPath>
      </defs>

      {/* --- ENVIRONMENT --- */}
      <rect width="1000" height="1200" fill={p.base} />
      <rect width="1000" height="1200" fill={`url(#${uid}-field)`} />

      {/* Architecture: two receding planes and a horizon */}
      <g opacity="0.5">
        <rect x={columnA} y="0" width="86" height="1200" fill={p.mid} opacity="0.42" />
        <rect x={columnA + 86} y="0" width="6" height="1200" fill={p.high} opacity="0.14" />
        <rect x={columnB} y="0" width="112" height="1200" fill={p.mid} opacity="0.34" />
        <rect x={columnB - 6} y="0" width="6" height="1200" fill={p.high} opacity="0.1" />
        <rect x="0" y={horizon} width="1000" height="2" fill={p.high} opacity="0.16" />
      </g>

      {/* Volumetric shaft */}
      <g transform={`rotate(${shaftAngle} ${shaftX} 600)`} opacity="0.85">
        <rect x={shaftX - 130} y="-300" width="260" height="1800" fill={`url(#${uid}-shaft)`} />
      </g>

      {/* --- FIGURE --- */}
      <g transform={`translate(${figureX} ${figureY}) scale(${scale}) translate(-500 -600)`}>
        <ellipse cx="500" cy="930" rx="300" ry="42" fill={`url(#${uid}-contact)`} />

        <path d={silhouette} fill={`url(#${uid}-model)`} />

        {/* Chiselled planes */}
        <g clipPath={`url(#${uid}-clip)`}>
          {facets.map((f, i) => (
            <path
              key={i}
              d={f.d}
              fill={p.high}
              opacity={0.06 + f.light * 0.3}
              style={{ mixBlendMode: "screen" }}
            />
          ))}
          {/* Plane edges — what makes it read as carved, not painted */}
          {facets.map((f, i) => (
            <path
              key={`e${i}`}
              d={f.d}
              fill="none"
              stroke={p.base}
              strokeWidth="1.4"
              opacity="0.5"
            />
          ))}
          <rect x="0" y="0" width="1000" height="1200" fill={`url(#${uid}-rim)`} style={{ mixBlendMode: "screen" }} />
        </g>

        {/* Silhouette edge */}
        <path d={silhouette} fill="none" stroke={p.key} strokeWidth="1.6" opacity="0.22" />
      </g>

      {/* --- ATMOSPHERE --- */}
      <rect width="1000" height="1200" fill={`url(#${uid}-vig)`} />

      <Grain id={uid} opacity={0.3} />
    </svg>
  );
}

/* ==================================================================
   FLAT
   An elevated technical garment drawing — the language of a design
   atelier's line sheet, rendered as product imagery.
   ================================================================== */

interface FlatProps {
  flat: FlatKey;
  colorway: ColorwayKey;
  seed?: string;
  className?: string;
  label?: string;
  /** Back / detail view for the hover transition. */
  view?: "front" | "detail";
  surface?: string;
}

export function Flat({
  flat,
  colorway,
  seed = "flat",
  className = "",
  label,
  view = "front",
  surface,
}: FlatProps) {
  const g = FLATS[flat] ?? FLATS.tee;
  const c = COLORWAYS[colorway] ?? COLORWAYS.onyx;
  const uid = `f${Math.abs(hash(`${flat}${colorway}${seed}${view}`)).toString(36)}`;
  const detail = view === "detail";

  return (
    <svg
      viewBox="0 0 400 500"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      role={label ? "img" : "presentation"}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <defs>
        {/* Fabric fall — light from upper left, as a studio would set it */}
        <linearGradient id={`${uid}-cloth`} x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor={lighten(c.hex, 0.16)} />
          <stop offset="44%" stopColor={c.hex} />
          <stop offset="100%" stopColor={darken(c.hex, 0.42)} />
        </linearGradient>

        {/* Panel treatment — the technical-fabric block */}
        <linearGradient id={`${uid}-panel`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={darken(c.hex, 0.22)} />
          <stop offset="100%" stopColor={darken(c.hex, 0.5)} />
        </linearGradient>

        {/* Specular sweep across the garment */}
        <linearGradient id={`${uid}-spec`} x1="0" y1="0" x2="1" y2="0.4">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="40%" stopColor="#ffffff" stopOpacity="0.09" />
          <stop offset="62%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        <radialGradient id={`${uid}-pedestal`} cx="0.5" cy="0.5">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>

        <clipPath id={`${uid}-clip`}>
          <path d={g.outline} />
        </clipPath>
      </defs>

      {surface ? <rect width="400" height="500" fill={surface} /> : null}

      {/* Contact shadow grounds the garment in space */}
      <ellipse cx="200" cy="446" rx="150" ry="22" fill={`url(#${uid}-pedestal)`} />

      <g clipPath={`url(#${uid}-clip)`}>
        <path d={g.outline} fill={`url(#${uid}-cloth)`} />

        {(g.panels ?? []).map((d, i) => (
          <path key={i} d={d} fill={`url(#${uid}-panel)`} opacity="0.86" />
        ))}

        <rect width="400" height="500" fill={`url(#${uid}-spec)`} />

        {/* Detail view exposes the construction grid — the "engineered" read */}
        {detail ? (
          <g opacity="0.3">
            {Array.from({ length: 22 }).map((_, i) => (
              <line
                key={i}
                x1="0"
                y1={i * 24}
                x2="400"
                y2={i * 24 - 60}
                stroke={c.seam}
                strokeWidth="0.6"
              />
            ))}
          </g>
        ) : null}
      </g>

      {/* Construction lines */}
      <g fill="none" stroke={c.seam} strokeWidth="1.15" opacity={detail ? 0.95 : 0.66} strokeLinecap="round">
        {g.seams.map((d, i) => (
          <path key={i} d={d} strokeDasharray={detail ? "3 4" : undefined} />
        ))}
      </g>

      {/* Cut line */}
      <path d={g.outline} fill="none" stroke={lighten(c.seam, 0.2)} strokeWidth="1.5" opacity="0.85" />

      {/* Woven brand tab */}
      {g.tab ? (
        <g>
          <circle cx={g.tab.x} cy={g.tab.y} r={g.tab.r} fill="none" stroke="#16d992" strokeWidth="1.4" opacity="0.85" />
          <circle cx={g.tab.x} cy={g.tab.y} r={g.tab.r * 0.34} fill="#16d992" opacity="0.7" />
        </g>
      ) : null}

      <Grain id={uid} opacity={0.16} />
    </svg>
  );
}

/* ==================================================================
   SPECIMEN
   An abstract performance visual — used where a figure or garment
   would be too literal (bundles, method pillars, journal headers).
   ================================================================== */

export function Specimen({
  seed,
  tone = "void",
  className = "",
  rings = 3,
}: {
  seed: string;
  tone?: Tone;
  className?: string;
  rings?: number;
}) {
  const p = TONES[tone];
  const r = rng(seed);
  const uid = `x${Math.abs(Math.round(r() * 1e9)).toString(36)}`;

  const bars = Array.from({ length: 26 }, () => 0.12 + r() * 0.88);
  const cx = 300 + (r() - 0.5) * 90;
  const cy = 300 + (r() - 0.5) * 60;

  return (
    <svg
      viewBox="0 0 600 600"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="presentation"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor={p.mid} stopOpacity="0.5" />
          <stop offset="100%" stopColor={p.base} />
        </linearGradient>
        <linearGradient id={`${uid}-bar`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={p.key} stopOpacity="0.04" />
          <stop offset="100%" stopColor={p.key} stopOpacity="0.5" />
        </linearGradient>
      </defs>

      <rect width="600" height="600" fill={p.base} />
      <rect width="600" height="600" fill={`url(#${uid}-bg)`} />

      {/* Concentric measurement rings — the laboratory register */}
      {Array.from({ length: rings }).map((_, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={90 + i * 76}
          fill="none"
          stroke={p.high}
          strokeWidth="1"
          opacity={0.24 - i * 0.05}
          strokeDasharray={i % 2 ? "2 10" : undefined}
        />
      ))}

      {/* Performance histogram */}
      <g transform="translate(0 600) scale(1 -1)">
        {bars.map((h, i) => (
          <rect
            key={i}
            x={i * 23 + 4}
            y="0"
            width="9"
            height={h * 300}
            fill={`url(#${uid}-bar)`}
          />
        ))}
      </g>

      {/* Axis */}
      <line x1="0" y1="470" x2="600" y2="470" stroke={p.high} strokeWidth="1" opacity="0.2" />

      <Grain id={uid} opacity={0.22} />
    </svg>
  );
}

/* ==================================================================
   COLOUR MATH
   ================================================================== */

function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function clamp255(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function parseHex(hex: string): [number, number, number] {
  const v = hex.replace("#", "");
  const full = v.length === 3 ? v.split("").map((c) => c + c).join("") : v;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function toHex([r, g, b]: [number, number, number]) {
  return `#${[r, g, b].map((n) => clamp255(n).toString(16).padStart(2, "0")).join("")}`;
}

export function lighten(hex: string, amount: number) {
  const [r, g, b] = parseHex(hex);
  return toHex([r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount]);
}

export function darken(hex: string, amount: number) {
  const [r, g, b] = parseHex(hex);
  return toHex([r * (1 - amount), g * (1 - amount), b * (1 - amount)]);
}
