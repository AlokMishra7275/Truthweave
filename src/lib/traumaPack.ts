export const STORAGE_KEYS = {
  memoryMosaic: 'truthweave_memory_mosaic_cards_v1',
  chronologyFragments: 'truthweave_chronology_fragments_v1',
  chronologySequence: 'truthweave_chronology_sequence_v1',
  legalBriefDraft: 'truthweave_legal_brief_draft_v1',
  evidenceVault: 'truthweave_evidence_vault_v1',
  sharePacket: 'truthweave_share_packet_v1',
} as const

export type RecallConfidence = 'certain' | 'approximate' | 'unsure'

export interface SurvivorMemoryEntry {
  id: string
  title: string
  description: string
  sourceType: 'text' | 'voice' | 'image' | 'other'
  createdAt: string
  location?: string
  people?: string
  timeWindow?: string
  eventType?: string
  recallConfidence: RecallConfidence
  emotionalState?: string
  intensity?: number
  triggerWarning?: boolean
}

export interface SurvivorSharePacket {
  generatedAt: string
  summary: {
    totalMemories: number
    chronologyEvents: number
    timelineConflicts: number
    evidenceCount: number
  }
  memories: SurvivorMemoryEntry[]
  chronology: Array<{
    order: number
    title: string
    description: string
    approxDate: string
    confidence: 'High' | 'Medium' | 'Low'
    confidenceScore: number
  }>
  evidence: Array<{
    id?: string
    fileName: string
    fileHash?: string
    uploadTimestamp?: string
    status?: string
  }>
  supportNotes: string[]
}

export function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback

  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function saveJSON<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore storage quota or parsing failures to keep the flow resilient.
  }
}

export function toSurvivorMemoryEntry(input: {
  id: string
  description: string
  sourceType: 'text' | 'voice' | 'image' | 'other'
  title?: string
  createdAt?: Date | string
  location?: string
  people?: string
  timeWindow?: string
  eventType?: string
  recallConfidence?: RecallConfidence
  emotionalState?: string
  intensity?: number
  triggerWarning?: boolean
}): SurvivorMemoryEntry {
  return {
    id: input.id,
    title: input.title || 'Memory fragment',
    description: input.description,
    sourceType: input.sourceType,
    createdAt: new Date(input.createdAt || Date.now()).toISOString(),
    location: input.location || '',
    people: input.people || '',
    timeWindow: input.timeWindow || '',
    eventType: input.eventType || 'General',
    recallConfidence: input.recallConfidence || 'approximate',
    emotionalState: input.emotionalState || '',
    intensity: input.intensity || 3,
    triggerWarning: Boolean(input.triggerWarning),
  }
}
