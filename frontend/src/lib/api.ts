export function buildApiUrl(path: string): string {
  // On the server (SSR / Server Functions), use Vercel's internal service binding (BACKEND_URL).
  // In the browser, use NEXT_PUBLIC_API_BASE_URL if configured, or fall back to same-origin relative path for Vercel rewrites.
  const isServer = typeof window === 'undefined'
  const serverBase = isServer ? process.env.BACKEND_URL?.trim() : undefined
  const clientBase = process.env.NEXT_PUBLIC_API_BASE_URL?.trim()
  const base = serverBase || clientBase

  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  if (!base) {
    return normalizedPath
  }

  return `${base.replace(/\/$/, '')}${normalizedPath}`
}
