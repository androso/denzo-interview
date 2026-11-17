export function AuthSkeleton({
  label = "Loading authentication",
}: {
  label?: string;
}) {
  return (
    <div
      className="bg-card flex w-full max-w-sm flex-col gap-5 rounded-xl border p-6 shadow-sm"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="bg-muted h-6 w-36 animate-pulse rounded-md" />
        <div className="bg-muted h-4 w-52 animate-pulse rounded-md" />
      </div>
      <div className="flex flex-col gap-3">
        <div className="bg-muted h-9 animate-pulse rounded-md" />
        <div className="bg-muted h-9 animate-pulse rounded-md" />
      </div>
      <div className="bg-muted h-9 animate-pulse rounded-md" />
    </div>
  );
}
