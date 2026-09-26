export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Loading product"
      className="shell grid gap-10 pt-[calc(var(--nav-h)+2.5rem)] pb-16 lg:grid-cols-2 lg:gap-16"
    >
      <div className="aspect-square skeleton" />

      <div className="pt-2">
        <div className="mb-4 h-3 w-24 skeleton" />
        <div className="mb-5 h-9 w-2/3 skeleton" />
        <div className="mb-8 h-5 w-24 skeleton" />
        <div className="mb-3 h-3 w-full skeleton" />
        <div className="mb-8 h-3 w-4/5 skeleton" />
        <div className="mb-8 flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="size-11 skeleton" />
          ))}
        </div>
        <div className="h-14 w-full skeleton" />
      </div>
    </div>
  );
}
