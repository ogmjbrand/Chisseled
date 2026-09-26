export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="flex min-h-[60svh] items-center justify-center bg-ink"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="size-8 animate-spin rounded-full border-2 border-bone/15 border-t-purple-bright" />
        <p className="eyebrow text-ash">Loading</p>
      </div>
    </div>
  );
}
