import Link from "next/link";
import { Sculpture } from "@/components/primitives/Visual";
import { ArrowMark } from "@/components/primitives/Marks";

export default function NotFound() {
  return (
    <div className="relative grain vignette flex min-h-[100svh] items-center overflow-hidden bg-ink">
      <Sculpture
        seed="not-found"
        tone="void"
        pose="back"
        anchor={0.74}
        scale={1.05}
        className="absolute inset-0 size-full opacity-60"
      />
      <span aria-hidden className="absolute inset-0 z-[2] bg-gradient-to-r from-ink via-ink/80 to-ink/20" />

      <div className="shell relative z-[4]">
        <p className="eyebrow mb-6 text-emerald-bright">Error 404</p>
        <h1 className="display-xl mb-7 max-w-[14ch] text-bone">This one isn&apos;t here.</h1>
        <p className="lede mb-10 max-w-[42ch]">
          The page you were looking for has moved or never existed. The collection has not gone
          anywhere.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="btn btn-primary">
            Back to home
            <ArrowMark className="size-4" />
          </Link>
          <Link href="/shop" className="btn btn-ghost">
            Shop the collection
          </Link>
        </div>
      </div>
    </div>
  );
}
