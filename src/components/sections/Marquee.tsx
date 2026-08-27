/** A slow kinetic band that separates major movements of the page. */
export function Marquee({
  items,
  accent = false,
}: {
  items: string[];
  accent?: boolean;
}) {
  const row = [...items, ...items];

  return (
    <div
      className={[
        "relative overflow-hidden border-y py-5",
        accent ? "border-purple/25 bg-purple-shade/40" : "border-bone/10 bg-carbon",
      ].join(" ")}
      aria-hidden
    >
      <div className="marquee-track">
        {row.map((item, i) => (
          <span
            key={i}
            className={[
              "flex shrink-0 items-center gap-8 px-8 font-display text-h5 font-black uppercase tracking-tight",
              accent ? "text-purple-bright" : "text-bone/45",
            ].join(" ")}
          >
            {item}
            <span className={accent ? "text-purple-bright/50" : "text-bone/15"}>—</span>
          </span>
        ))}
      </div>

      {/* Feathered edges so the band never hard-cuts at the viewport */}
      <span
        className={[
          "pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r to-transparent",
          accent ? "from-purple-shade" : "from-carbon",
        ].join(" ")}
      />
      <span
        className={[
          "pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l to-transparent",
          accent ? "from-purple-shade" : "from-carbon",
        ].join(" ")}
      />
    </div>
  );
}
