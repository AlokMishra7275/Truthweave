import { STORAGE_KEYS } from '@/lib/traumaPack'

export const QUICK_EXIT_URL = 'https://www.google.com/search?q=weather'

const APP_STORAGE_KEYS = [
  STORAGE_KEYS.memoryMosaic,
  STORAGE_KEYS.chronologyFragments,
  STORAGE_KEYS.chronologySequence,
  STORAGE_KEYS.legalBriefDraft,
  STORAGE_KEYS.evidenceVault,
  STORAGE_KEYS.sharePacket,
  'truthweave_helpcenter_draft_v1',
  'truthweave_chatbot_log_v1',
] as const

export function clearTruthViewStorage(): void {
  if (typeof window === 'undefined') return

  for (const key of APP_STORAGE_KEYS) {
    window.localStorage.removeItem(key)
  }

  try {
    window.sessionStorage.clear()
  } catch {
    // Ignore session storage access issues.
  }
}

export function runQuickExit(): void {
  clearTruthViewStorage()
  window.location.href = QUICK_EXIT_URL
}
