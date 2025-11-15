/**
 * Format a duration (seconds) into a human-friendly string.
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const hours = Math.floor(mins / 60);

  if (hours > 0) {
    const remMins = mins % 60;
    return `${hours}h ${remMins}m`;
  }

  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }

  return `${secs}s`;
}
