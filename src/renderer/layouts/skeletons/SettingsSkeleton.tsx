/**
 * Loading skeleton for settings route
 * Displays during lazy load of settings page
 */
export function SettingsSkeleton() {
  return (
    <div className="flex min-h-screen w-screen bg-base-200">
      {/* Sidebar skeleton */}
      <div className="w-64 border-r border-base-300 bg-base-100 p-6">
        <div className="mb-8 h-8 w-24 animate-pulse rounded bg-base-300" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 w-full animate-pulse rounded bg-base-300" />
          ))}
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex-1 bg-base-100 p-10">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="h-8 w-48 animate-pulse rounded bg-base-300" />
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 w-full animate-pulse rounded bg-base-300" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
