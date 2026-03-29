export default function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-fade-up">
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="h-4 w-24 rounded animate-shimmer mb-4" />
        <div className="h-3 rounded-full animate-shimmer mb-2" />
        <div className="flex justify-between">
          <div className="h-3 w-8 rounded animate-shimmer" />
          <div className="h-3 w-8 rounded animate-shimmer" />
        </div>
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5">
          <div className="h-4 w-32 rounded animate-shimmer mb-4" />
          <div className="space-y-2">
            <div className="h-3 rounded animate-shimmer" />
            <div className="h-3 rounded animate-shimmer w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
