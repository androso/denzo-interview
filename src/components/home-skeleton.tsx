import { TASK_STATUSES } from "@/features/tasks/models";

function BoardSkeletonContent() {
  return (
    <>
      <div className="bg-muted mb-4 h-7 w-40 animate-pulse rounded-md" />
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        {TASK_STATUSES.map((status) => (
          <div
            key={status}
            className="bg-muted/40 flex w-full min-w-0 flex-col gap-2 rounded-xl border p-3 md:w-72 md:shrink-0"
          >
            <div className="bg-muted h-5 w-24 animate-pulse rounded-md" />
            {status === "done" ? null : (
              <>
                <div className="bg-muted h-16 animate-pulse rounded-lg" />
                <div className="bg-muted h-16 animate-pulse rounded-lg" />
              </>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

export function BoardSkeleton() {
  return (
    <section
      className="min-w-0 flex-1 overflow-auto p-4 md:p-6"
      role="status"
      aria-live="polite"
      aria-label="Loading board"
    >
      <BoardSkeletonContent />
    </section>
  );
}

export function HomeSkeleton() {
  return (
    <div
      className="flex min-h-0 flex-1"
      role="status"
      aria-live="polite"
      aria-label="Loading board"
    >
      <div className="flex shrink-0 items-start border-r p-2 md:hidden">
        <div className="bg-muted size-8 animate-pulse rounded-md" />
      </div>
      <aside className="hidden w-64 shrink-0 flex-col gap-2 border-r p-3 md:flex">
        <div className="bg-muted h-8 animate-pulse rounded-lg" />
        <div className="bg-muted h-8 w-4/5 animate-pulse rounded-lg" />
        <div className="bg-muted h-8 w-3/5 animate-pulse rounded-lg" />
        <div className="bg-muted mt-auto h-9 animate-pulse rounded-md" />
      </aside>
      <section className="min-w-0 flex-1 overflow-auto p-4 md:p-6">
        <BoardSkeletonContent />
      </section>
    </div>
  );
}
