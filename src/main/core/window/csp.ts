/**
 * Content Security Policy configuration
 * Strict policies for production, relaxed for development (Vite HMR)
 */

/**
 * Get CSP header value based on environment
 */
export function getCSP(isProduction: boolean): string {
  if (isProduction) {
    // Strict CSP for production - no unsafe directives
    return [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' https://fonts.googleapis.com",
      "img-src 'self' data:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self'",
    ].join('; ');
  }

  // Relaxed CSP for development - allows Vite HMR
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' ws: wss:", // WebSocket for HMR
  ].join('; ');
}
