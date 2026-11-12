"use client";

export default function Error({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  void error;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6">
      <h2 className="text-lg font-medium">Something went wrong</h2>
      <button type="button" onClick={() => retry()}>
        Try again
      </button>
    </div>
  );
}
