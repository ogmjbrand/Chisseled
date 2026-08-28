import Image from "next/image";

/**
 * The supplier's own size sheets, shown as images.
 *
 * These replace a table of measurements that was invented — the previous
 * component carried a comment admitting the numbers were illustrative, which
 * on a garment page is the one place a plausible-looking number does real
 * damage: someone orders an L on the strength of it.
 *
 * They are shown as images rather than retyped into HTML on purpose. Every
 * sheet supplied has its left-hand column cropped off in the source, so the
 * rows read `67 / 70 / 73` with nothing saying whether that is chest, length
 * or shoulder. Retyping them would mean guessing which measurement each row
 * is and presenting the guess as a specification. The image at least shows a
 * customer exactly what the manufacturer published, and what is missing from
 * it is visibly missing rather than silently filled in.
 *
 * A photographed table is not readable to a screen reader, so what IS legible
 * in each sheet is also stated in text below it. Nothing is asserted there
 * that cannot be read off the sheet.
 */

type ChartKey = "tee" | "top" | "bottom";

interface Chart {
  src: ChartKey;
  w: number;
  h: number;
  /** What the sheet covers. */
  title: string;
  /** Read directly off the sheet — never inferred. */
  legible: string;
  /** What the source crop lost. Stated, not hidden. */
  cropped: string;
}

const CHARTS: Record<ChartKey, Chart> = {
  tee: {
    src: "tee",
    w: 1072,
    h: 688,
    title: "T-shirt sizing",
    legible:
      "Sizes S to 2XL. Recommended height 165–185 cm and weight 50–100 kg across the run; garment measurements 67–77 cm and 47–59 cm, with a 42.9–55.4 cm row and a 20–21 cm sleeve.",
    cropped:
      "The sheet's row-label column is cut off in the supplier's own file, so each row's measurement is not named on it.",
  },
  top: {
    src: "top",
    w: 789,
    h: 471,
    title: "Upper body sizing",
    legible:
      "Nine rows, in centimetres and inches. Bust/chest 92 to 124 cm, shoulder 42 to 58 cm, sleeve 63 to 79 cm.",
    cropped:
      "The size-name column is cut off in the supplier's own file, so the rows are not labelled S, M, L on the sheet itself.",
  },
  bottom: {
    src: "bottom",
    w: 789,
    h: 651,
    title: "Lower body sizing",
    legible: "Hip width 95 to 125 cm and leg length 104 to 116 cm, in centimetres.",
    cropped:
      "The waist column and the size names are cut off at the left edge of the supplier's own file.",
  },
};

/** Which sheet belongs to a product, by its catalogue category. */
export function chartFor(category: string): ChartKey | null {
  const c = category.toLowerCase();
  if (c.includes("t-shirt") || c.includes("tee")) return "tee";
  if (c.includes("legging") || c.includes("short") || c.includes("jogger")) return "bottom";
  if (
    c.includes("hoodie") ||
    c.includes("sweatshirt") ||
    c.includes("set") ||
    c.includes("top") ||
    c.includes("bra") ||
    c.includes("jacket")
  )
    return "top";
  return null;
}

export function SizeChart({ category }: { category: string }) {
  const key = chartFor(category);
  if (!key) return null;
  const chart = CHARTS[key];

  return (
    <figure className="mt-8 m-0">
      <figcaption className="eyebrow mb-1.5">{chart.title} — manufacturer&rsquo;s sheet</figcaption>
      <p className="mb-4 text-caption text-smoke">
        Measurements in centimetres. The sheet states a 1–3 cm tolerance, since it is measured by
        hand.
      </p>

      {/* The sheet is wider than a phone; it scrolls rather than shrinking to
          the point where the figures stop being readable. */}
      <div className="overflow-x-auto border border-bone/10 bg-bone">
        <Image
          src={`/media/size/${chart.src}.webp`}
          alt={`${chart.title} chart. ${chart.legible}`}
          width={chart.w}
          height={chart.h}
          sizes="(min-width: 1024px) 32rem, 92vw"
          className="h-auto w-full min-w-[22rem] max-w-none"
        />
      </div>

      <p className="mt-3 text-caption leading-relaxed text-smoke">{chart.legible}</p>
      <p className="mt-2 text-micro leading-relaxed text-ash">
        {chart.cropped} We are showing the sheet as supplied rather than filling the gaps in with
        numbers we cannot verify — if you are between sizes, the fit note above is the better guide.
      </p>
    </figure>
  );
}
