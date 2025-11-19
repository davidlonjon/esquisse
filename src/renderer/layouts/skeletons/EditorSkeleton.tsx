/**
 * Loading skeleton for editor route
 * Displays during lazy load of editor page
 */
export function EditorSkeleton() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-base-100">
      <div className="flex flex-col items-center gap-4">
        {/* Pulsing icon placeholder */}
        <div className="h-12 w-12 animate-pulse rounded-full bg-base-300" />

        {/* Loading text */}
        <div className="h-4 w-32 animate-pulse rounded bg-base-300" />
      </div>
    </div>
  );
}
