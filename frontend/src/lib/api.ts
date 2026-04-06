export function buildApiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.trim()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  if (!base) {
    return normalizedPath
  }

  return `${base.replace(/\/$/, '')}${normalizedPath}`
}
