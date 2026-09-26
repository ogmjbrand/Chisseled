/** Loading placeholder for a product grid — mirrors ProductGrid's own card layout and spacing. */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading products" className="shell py-[var(--section-y)]">
      <div className="mb-10 h-4 w-40 skeleton" />
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i}>
            <div className="mb-4 aspect-[4/5] skeleton" />
            <div className="mb-2 h-3 w-3/4 skeleton" />
            <div className="h-3 w-1/3 skeleton" />
          </div>
        ))}
      </div>
    </div>
  );
}
