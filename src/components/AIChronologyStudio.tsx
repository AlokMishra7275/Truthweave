'use client'

import { useEffect, useMemo, useState } from 'react'
import { loadJSON, STORAGE_KEYS, type SurvivorMemoryEntry } from '@/lib/traumaPack'

type SourceType = 'text' | 'voice' | 'image' | 'other'

interface Fragment {
  id: string
  title: string
  description: string
  approxDate: string
  location: string
  people: string
  sourceType: SourceType
  certainty: number
  sequenceIndex: number
  origin?: 'ai-companion' | 'add-fragment' | 'chat-import' | 'seed'
}

interface TimelineEvent {
  fragmentId: string
  order: number
  confidence: 'High' | 'Medium' | 'Low'
  confidenceScore: number
}

interface SavedTimeline {
  savedAt: string
  totalEvents: number
  events: Array<{
    order: number
    title: string
    description: string
    approxDate: string
    location: string
    people: string
    confidence: 'High' | 'Medium' | 'Low'
    confidenceScore: number
  }>
}

const CHRONOLOGY_FRAGMENTS_KEY = 'truthweave_chronology_fragments_v1'
const CHRONOLOGY_SEQUENCE_KEY = 'truthweave_chronology_sequence_v1'
const LEGAL_BRIEF_DRAFT_KEY = 'truthweave_legal_brief_draft_v1'
const HELP_CENTER_DRAFT_KEY = 'truthweave_helpcenter_draft_v1'
const CHATBOT_LOG_KEY = 'truthweave_chatbot_log_v1'

interface SharedChatMessage {
  id: string
  text: string
  sender: 'user' | 'assistant' | 'bot' | 'system'
  createdAt?: string
  timestamp?: string
}

interface ChatTimelineSource {
  source: 'help-center' | 'chatbot'
  message: SharedChatMessage
}

interface LegalBriefDraft {
  savedAt: string
  source: string
  memoryFragments: Array<{
    date?: string
    description: string
    metadata?: {
      location?: string
      people?: string[]
      emotions?: string[]
    }
  }>
  gaps: string[]
}

const initialFragments: Fragment[] = [
  {
    id: 'f1',
    title: 'Phone Threat',
    description: 'Received repeated threatening calls and one voicemail.',
    approxDate: '2026-01-12T20:30',
    location: 'Home',
    people: 'Unknown caller',
    sourceType: 'voice',
    certainty: 4,
    sequenceIndex: 1,
    origin: 'seed',
  },
  {
    id: 'f2',
    title: 'Hospital Visit',
    description: 'Visited emergency unit for panic symptoms and documented anxiety episode.',
    approxDate: '2026-01-13T09:15',
    location: 'City Hospital',
    people: 'Duty doctor, nurse',
    sourceType: 'text',
    certainty: 5,
    sequenceIndex: 2,
    origin: 'seed',
  },
  {
    id: 'f3',
    title: 'Support Call',
    description: 'Spoke with support contact about next legal steps.',
    approxDate: '2026-01-14T00:00',
    location: '',
    people: 'Support contact',
    sourceType: 'voice',
    certainty: 2,
    sequenceIndex: 3,
    origin: 'seed',
  },
]

function getConfidenceLabel(score: number): 'High' | 'Medium' | 'Low' {
  if (score >= 80) return 'High'
  if (score >= 55) return 'Medium'
  return 'Low'
}

function toDate(value: string): number {
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed
}

function parseChatTranscript(transcript: string): Fragment[] {
  const normalized = transcript.replace(/\\n/g, '\n').trim()

  const candidateLines = normalized
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      if (line.includes(' | ') && line.length > 120) {
        return line.split(' | ').map((part) => part.trim()).filter(Boolean)
      }
      return [line]
    })

  const lines = candidateLines.length > 1
    ? candidateLines
    : normalized
        .split(/(?=\b(?:User|Support|Me|Client|Speaker|Agent)\s*:)/i)
        .map((line) => line.trim())
        .filter(Boolean)

  return lines
    .map((line, index) => {
      const cleanedLine = line.replace(/^[-*•\d.\s]+/, '').trim()
      const lineMatch = cleanedLine.match(/^(?:(\d{1,2}:\d{2}(?:\s?[AP]M)?)\s*[-|:]\s*)?(?:(.+?)\s*:\s*)?(.*)$/i)

      const timeLabel = lineMatch?.[1]?.trim() || ''
      const speaker = lineMatch?.[2]?.trim() || ''
      const message = (lineMatch?.[3] || cleanedLine).trim()

      const detailLength = message.length + speaker.length

      return {
        id: `chat-${Date.now()}-${index}`,
        title: speaker || `Chat line ${index + 1}`,
        description: message,
        approxDate: '',
        location: '',
        people: speaker || 'Chat participant',
        sourceType: 'other' as SourceType,
        certainty: detailLength > 80 ? 4 : detailLength > 40 ? 3 : 2,
        sequenceIndex: index + 1,
        origin: 'chat-import' as const,
      }
    })
    .filter((fragment) => fragment.description.length > 0)
}

function buildChatTimelineFragments(): Fragment[] {
  const collected: Array<{ source: ChatTimelineSource['source']; text: string; createdAt: string; index: number; parent?: string }> = []

  try {
    const helpCenterRaw = localStorage.getItem(HELP_CENTER_DRAFT_KEY)
    if (helpCenterRaw) {
      const helpCenterParsed = JSON.parse(helpCenterRaw) as { messages?: SharedChatMessage[] }
      const helpCenterMessages = helpCenterParsed?.messages ?? []

      helpCenterMessages
        .filter((message) => message.sender === 'user' && message.text.trim())
        .forEach((message, index) => {
          const priorAssistant = [...helpCenterMessages]
            .slice(0, helpCenterMessages.findIndex((item) => item.id === message.id))
            .reverse()
            .find((item) => item.sender === 'assistant')

          collected.push({
            source: 'help-center',
            text: message.text.trim(),
            createdAt: message.createdAt || new Date().toISOString(),
            index,
            parent: priorAssistant?.text?.trim(),
          })
        })
    }
  } catch {
    // Ignore help center parse failures
  }

  try {
    const chatbotRaw = localStorage.getItem(CHATBOT_LOG_KEY)
    if (chatbotRaw) {
      const chatbotParsed = JSON.parse(chatbotRaw) as SharedChatMessage[]
      chatbotParsed
        .filter((message) => message.sender === 'user' && message.text.trim())
        .forEach((message, index) => {
          collected.push({
            source: 'chatbot',
            text: message.text.trim(),
            createdAt: message.createdAt || message.timestamp || new Date().toISOString(),
            index,
            parent: undefined,
          })
        })
    }
  } catch {
    // Ignore chatbot parse failures
  }

  return collected
    .sort((a, b) => toDate(a.createdAt) - toDate(b.createdAt))
    .map((item, index) => {
      const titleSource = item.parent || item.text
      const title = titleSource.slice(0, 54).replace(/\s+/g, ' ').trim()

      return {
        id: `chat-auto-${index}-${Date.now()}`,
        title: title || `Chat event ${index + 1}`,
        description: item.text,
        approxDate: '',
        location: item.source === 'help-center' ? 'Help Center chat' : 'AI chat',
        people: item.source === 'help-center' ? 'User + Help Center' : 'User + Chatbot',
        sourceType: 'other' as SourceType,
        certainty: item.text.length > 90 ? 4 : item.text.length > 45 ? 3 : 2,
        sequenceIndex: index + 1,
        origin: 'ai-companion',
      }
    })
}

function mergeUniqueFragments(existing: Fragment[], incoming: Fragment[]): Fragment[] {
  const seen = new Set(existing.map((item) => `${item.title}::${item.description}`))
  const merged = [...existing]

  incoming.forEach((item) => {
    const key = `${item.title}::${item.description}`
    if (!seen.has(key)) {
      seen.add(key)
      merged.push(item)
    }
  })

  return merged.map((item, index) => ({
    ...item,
    sequenceIndex: index + 1,
  }))
}

export default function AIChronologyStudio() {
  const [fragments, setFragments] = useState<Fragment[]>(initialFragments)
  const [isGenerated, setIsGenerated] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [chatTranscript, setChatTranscript] = useState('')
  const [chatMessage, setChatMessage] = useState('')
  const [chatSourceMessage, setChatSourceMessage] = useState('')

  const importMosaicMemories = () => {
    const memories = loadJSON<SurvivorMemoryEntry[]>(STORAGE_KEYS.sharePacket, [])

    if (!Array.isArray(memories) || memories.length === 0) {
      setChatSourceMessage('No Memory Mosaic entries found. Add fragments in Memory Mosaic first.')
      return
    }

    const converted: Fragment[] = memories.map((memory, index) => ({
      id: `mosaic-${memory.id}-${index}`,
      title: memory.title || `Memory ${index + 1}`,
      description: memory.description,
      approxDate: '',
      location: memory.location || '',
      people: memory.people || '',
      sourceType: memory.sourceType,
      certainty: memory.recallConfidence === 'certain' ? 5 : memory.recallConfidence === 'approximate' ? 3 : 2,
      sequenceIndex: index + 1,
      origin: 'ai-companion',
    }))

    setFragments((prev) => mergeUniqueFragments(prev, converted))
    setIsGenerated(true)
    setChatSourceMessage(`Memory Mosaic import complete. ${converted.length} fragments merged.`)
  }

  const [newFragment, setNewFragment] = useState<Fragment>({
    id: '',
    title: '',
    description: '',
    approxDate: '',
    location: '',
    people: '',
    sourceType: 'text',
    certainty: 3,
    sequenceIndex: 0,
    origin: 'add-fragment',
  })

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHRONOLOGY_FRAGMENTS_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as Fragment[]
      if (Array.isArray(parsed) && parsed.length > 0) {
        setFragments(
          parsed.map((fragment, index) => ({
            ...fragment,
            sequenceIndex: fragment.sequenceIndex || index + 1,
            origin: fragment.origin || 'add-fragment',
          }))
        )
      }
    } catch {
      // Ignore load failures and use defaults
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(CHRONOLOGY_FRAGMENTS_KEY, JSON.stringify(fragments))
    } catch {
      // Ignore save failures
    }
  }, [fragments])

  const orderedFragments = useMemo(() => {
    return [...fragments].sort((a, b) => {
      const aHasDate = Boolean(a.approxDate)
      const bHasDate = Boolean(b.approxDate)

      if (aHasDate && bHasDate) {
        return toDate(a.approxDate) - toDate(b.approxDate)
      }

      if (aHasDate && !bHasDate) return -1
      if (!aHasDate && bHasDate) return 1

      return a.sequenceIndex - b.sequenceIndex
    })
  }, [fragments])

  const timelineEvents: TimelineEvent[] = useMemo(() => {
    return orderedFragments.map((fragment, index) => {
      const hasDate = Boolean(fragment.approxDate)
      const hasLocation = Boolean(fragment.location.trim())
      const hasPeople = Boolean(fragment.people.trim())
      const dataCompleteness = [hasDate, hasLocation, hasPeople].filter(Boolean).length / 3
      const certaintyFactor = Math.max(1, fragment.certainty) / 5
      const confidenceScore = Math.round((dataCompleteness * 55 + certaintyFactor * 45))

      return {
        fragmentId: fragment.id,
        order: index + 1,
        confidenceScore,
        confidence: getConfidenceLabel(confidenceScore),
      }
    })
  }, [orderedFragments])

  const timelineMap = useMemo(() => {
    return new Map(timelineEvents.map((event) => [event.fragmentId, event]))
  }, [timelineEvents])

  const contradictions = useMemo(() => {
    const issues: string[] = []

    for (let i = 0; i < orderedFragments.length; i += 1) {
      for (let j = i + 1; j < orderedFragments.length; j += 1) {
        const a = orderedFragments[i]
        const b = orderedFragments[j]

        const aDay = a.approxDate ? a.approxDate.slice(0, 10) : ''
        const bDay = b.approxDate ? b.approxDate.slice(0, 10) : ''

        if (aDay && bDay && aDay === bDay && a.location && b.location && a.location !== b.location) {
          issues.push(
            `Same-day location mismatch between "${a.title}" (${a.location}) and "${b.title}" (${b.location}).`
          )
        }
      }
    }

    return issues
  }, [orderedFragments])

  const clarificationQuestions = useMemo(() => {
    const prompts: string[] = []

    orderedFragments.forEach((fragment, index) => {
      if (!fragment.approxDate) {
        prompts.push(`For "${fragment.title}", can you add an approximate date or time window? Approximate recall is valid.`)
      }
      if (!fragment.location.trim()) {
        prompts.push(`Where did "${fragment.title}" happen (even approximate location helps)?`)
      }
      if (!fragment.people.trim()) {
        prompts.push(`Who else was present during "${fragment.title}"?`)
      }
      if (fragment.certainty <= 2) {
        prompts.push(`For event ${index + 1} "${fragment.title}", what detail would increase confidence (time, location, person)?`)
      }
    })

    return prompts.slice(0, 7)
  }, [orderedFragments])

  const addFragment = () => {
    if (!newFragment.title.trim() || !newFragment.description.trim()) return

    const record: Fragment = {
      ...newFragment,
      id: `f-${Date.now()}`,
      sequenceIndex: fragments.length + 1,
      origin: 'add-fragment',
    }

    setFragments((prev) => [record, ...prev])
    setNewFragment({
      id: '',
      title: '',
      description: '',
      approxDate: '',
      location: '',
      people: '',
      sourceType: 'text',
      certainty: 3,
      sequenceIndex: 0,
      origin: 'add-fragment',
    })
  }

  const importChatTimeline = () => {
    const importedFragments = parseChatTranscript(chatTranscript)

    if (importedFragments.length === 0) {
      setChatMessage('Chat transcript me koi clear line nahi mili. Real chat lines paste karein.')
      return
    }

    setFragments((prev) => {
      const offset = prev.length
      const adjusted = importedFragments.map((fragment, index) => ({
        ...fragment,
        sequenceIndex: offset + index + 1,
      }))
      return [...adjusted, ...prev]
    })

    setIsGenerated(true)
    setChatMessage(`${importedFragments.length} chat lines timeline me convert ho gayi.`)
    setChatTranscript('')
  }

  const generateFromAIChatHistory = () => {
    const chatFragments = buildChatTimelineFragments()

    if (chatFragments.length === 0) {
      setChatSourceMessage('No AI chat history found yet. Please use Help Center or Chatbot first.')
      return
    }

    setFragments((prev) => mergeUniqueFragments(prev, chatFragments))
    setIsGenerated(true)
    setChatSourceMessage(`AI Companion chat merged. ${chatFragments.length} events added from chat history.`)
    setSaveMessage('Timeline now includes AI Companion chat + Add Fragment entries. Save to keep for Legal Brief.')
  }

  const loadSampleChat = () => {
    setChatTranscript(
      'User: We left home at 8:30 PM\nSupport: I asked her to write everything down\nUser: Then I got a call from the same number\nSupport: Please save all screenshots and notes'
    )
    setChatMessage('Sample chat loaded. Convert Chat to Timeline dabaiye.')
  }

  const removeFragment = (id: string) => {
    setFragments((prev) => prev.filter((item) => item.id !== id))
  }

  const generateTimeline = () => {
    setIsGenerated(true)
  }

  const generateAlternateSequence = () => {
    setFragments((prev) => [...prev].sort((a, b) => a.certainty - b.certainty))
    setIsGenerated(true)
  }

  const saveSequencedTimeline = () => {
    const payload: SavedTimeline = {
      savedAt: new Date().toISOString(),
      totalEvents: orderedFragments.length,
      events: orderedFragments.map((fragment) => {
        const event = timelineMap.get(fragment.id)
        return {
          order: event?.order ?? 0,
          title: fragment.title,
          description: fragment.description,
          approxDate: fragment.approxDate || '',
          location: fragment.location || '',
          people: fragment.people || '',
          confidence: event?.confidence ?? 'Low',
          confidenceScore: event?.confidenceScore ?? 0,
        }
      }),
    }

    try {
      localStorage.setItem(CHRONOLOGY_SEQUENCE_KEY, JSON.stringify(payload))

      const legalBriefDraft: LegalBriefDraft = {
        savedAt: payload.savedAt,
        source: 'AI Companion + Add Fragment merged timeline',
        memoryFragments: orderedFragments.map((fragment) => ({
          date: fragment.approxDate || undefined,
          description: `[${fragment.origin || 'timeline'}] ${fragment.description}`,
          metadata: {
            location: fragment.location || undefined,
            people: fragment.people ? fragment.people.split(',').map((item) => item.trim()).filter(Boolean) : undefined,
            emotions: [`certainty-${fragment.certainty}`],
          },
        })),
        gaps: [...contradictions, ...clarificationQuestions],
      }

      localStorage.setItem(LEGAL_BRIEF_DRAFT_KEY, JSON.stringify(legalBriefDraft))
      setSaveMessage(`Sequence saved (${payload.totalEvents} events) at ${new Date(payload.savedAt).toLocaleTimeString()}.`)
      setIsGenerated(true)
    } catch {
      setSaveMessage('Could not save sequence right now. Please try again.')
    }
  }

  return (
    <div className="min-h-screen theme-surface p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <section className="rounded-xl border border-emerald-400/30 bg-emerald-900/20 p-6">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">AI Chronology Studio</h1>
          <p className="text-slate-300">
            Build event order confidence, detect timeline conflicts, and collect clarification prompts before legal export.
          </p>
          <div className="mt-4 rounded-lg border border-emerald-500/30 bg-slate-900/50 p-4 text-sm text-slate-200">
            <p className="font-semibold mb-2">Simple guide (aap kya kar rahi hain):</p>
            <p>1. Chat lines ya memories add kariye. 2. System unhe sequence me arrange karega. 3. Confidence aur gaps dikhenge. 4. &quot;Save Sequenced Timeline&quot; dabakar arranged data store ho jayega.</p>
            <p className="mt-2 text-xs text-slate-400">Chat me jo bhi line hogi, wo timeline ka ek event ban sakti hai.</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={generateTimeline}
              className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-500 transition-colors text-sm font-medium"
            >
              Generate Primary Timeline
            </button>
            <button
              onClick={generateAlternateSequence}
              className="px-4 py-2 bg-slate-700 text-slate-100 rounded hover:bg-slate-600 transition-colors text-sm font-medium"
            >
              Generate Alternate Sequence
            </button>
            <button
              onClick={generateFromAIChatHistory}
              className="px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-500 transition-colors text-sm font-medium"
            >
              Generate from AI Chat
            </button>
            <button
              onClick={importMosaicMemories}
              className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-500 transition-colors text-sm font-medium"
            >
              Import from Memory Mosaic
            </button>
            <button
              onClick={saveSequencedTimeline}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 transition-colors text-sm font-medium"
            >
              Save Sequenced Timeline
            </button>
          </div>
          {saveMessage && (
            <p className="mt-3 text-sm text-indigo-200">{saveMessage}</p>
          )}
          {chatSourceMessage && (
            <p className="mt-2 text-sm text-violet-200">{chatSourceMessage}</p>
          )}
        </section>

        <section className="rounded-xl border border-slate-700 bg-slate-900/70 p-6">
          <h2 className="text-xl font-semibold text-slate-100 mb-4">Add Fragment</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              value={newFragment.title}
              onChange={(e) => setNewFragment((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Event title"
              className="px-3 py-2 rounded-md border border-slate-600 bg-slate-800 text-slate-100"
            />
            <input
              type="datetime-local"
              value={newFragment.approxDate}
              onChange={(e) => setNewFragment((prev) => ({ ...prev, approxDate: e.target.value }))}
              className="px-3 py-2 rounded-md border border-slate-600 bg-slate-800 text-slate-100"
            />
            <input
              value={newFragment.location}
              onChange={(e) => setNewFragment((prev) => ({ ...prev, location: e.target.value }))}
              placeholder="Approx location"
              className="px-3 py-2 rounded-md border border-slate-600 bg-slate-800 text-slate-100"
            />
            <input
              value={newFragment.people}
              onChange={(e) => setNewFragment((prev) => ({ ...prev, people: e.target.value }))}
              placeholder="People involved"
              className="px-3 py-2 rounded-md border border-slate-600 bg-slate-800 text-slate-100"
            />
            <select
              value={newFragment.sourceType}
              onChange={(e) => setNewFragment((prev) => ({ ...prev, sourceType: e.target.value as SourceType }))}
              className="px-3 py-2 rounded-md border border-slate-600 bg-slate-800 text-slate-100"
            >
              <option value="text">Text</option>
              <option value="voice">Voice</option>
              <option value="image">Image</option>
              <option value="other">Other</option>
            </select>
            <div>
              <label className="text-xs text-slate-400">Certainty: {newFragment.certainty}/5</label>
              <input
                type="range"
                min="1"
                max="5"
                value={newFragment.certainty}
                onChange={(e) => setNewFragment((prev) => ({ ...prev, certainty: Number(e.target.value) }))}
                className="w-full"
              />
            </div>
          </div>
          <textarea
            value={newFragment.description}
            onChange={(e) => setNewFragment((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Describe what happened"
            rows={3}
            className="mt-4 w-full px-3 py-2 rounded-md border border-slate-600 bg-slate-800 text-slate-100"
          />
          <button
            onClick={addFragment}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors text-sm font-medium"
          >
            Add Fragment
          </button>
        </section>

        <section className="rounded-xl border border-indigo-400/30 bg-indigo-900/20 p-6">
          <h2 className="text-xl font-semibold text-slate-100 mb-2">Import from Chat</h2>
          <p className="text-sm text-slate-300 mb-3">
            Paste chat transcript here. Each line will become one timeline event in the same order.
          </p>
          <textarea
            value={chatTranscript}
            onChange={(e) => setChatTranscript(e.target.value)}
            placeholder="Example: User: We left home at 8:30 PM\nSupport: I told her to write everything down\nUser: Then I got a call"
            rows={6}
            className="w-full px-3 py-2 rounded-md border border-slate-600 bg-slate-800 text-slate-100"
          />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={importChatTimeline}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 transition-colors text-sm font-medium"
            >
              Convert Chat to Timeline
            </button>
            <button
              onClick={loadSampleChat}
              className="px-4 py-2 bg-slate-700 text-slate-100 rounded hover:bg-slate-600 transition-colors text-sm font-medium"
            >
              Load Sample Chat
            </button>
            {chatMessage && <p className="text-sm text-indigo-200">{chatMessage}</p>}
          </div>
          <p className="mt-3 text-xs text-slate-400">Tip: agar chat ek hi line me ho aur {String.raw`\n`} dikh raha ho, ye ab automatically split ho jayega.</p>
        </section>

        <section className="rounded-xl border border-slate-700 bg-slate-900/70 p-6">
          <h2 className="text-xl font-semibold text-slate-100 mb-4">Timeline Inputs</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="rounded-lg bg-slate-800/70 p-3 border border-slate-700">
              <p className="text-xs text-slate-400">Fragments</p>
              <p className="text-2xl font-bold text-slate-100">{fragments.length}</p>
            </div>
            <div className="rounded-lg bg-slate-800/70 p-3 border border-slate-700">
              <p className="text-xs text-slate-400">Missing Dates</p>
              <p className="text-2xl font-bold text-amber-300">{fragments.filter((f) => !f.approxDate).length}</p>
            </div>
            <div className="rounded-lg bg-slate-800/70 p-3 border border-slate-700">
              <p className="text-xs text-slate-400">Low Certainty</p>
              <p className="text-2xl font-bold text-rose-300">{fragments.filter((f) => f.certainty <= 2).length}</p>
            </div>
            <div className="rounded-lg bg-slate-800/70 p-3 border border-slate-700">
              <p className="text-xs text-slate-400">Conflict Signals</p>
              <p className="text-2xl font-bold text-cyan-300">{contradictions.length}</p>
            </div>
          </div>

          <div className="space-y-3">
            {orderedFragments.map((fragment) => {
              const event = timelineMap.get(fragment.id)
              return (
                <div key={fragment.id} className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-slate-100 font-semibold">{fragment.title}</h3>
                      <p className="text-sm text-slate-300">{fragment.description}</p>
                      <p className="text-xs text-slate-400 mt-2">
                        {fragment.approxDate ? new Date(fragment.approxDate).toLocaleString() : 'Date missing'} | {fragment.location || 'Location missing'} | {fragment.people || 'People missing'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Sequence #{event?.order ?? '-'}</p>
                      <p className="text-sm font-medium text-slate-200">Confidence: {event?.confidence ?? '-'}</p>
                      <p className="text-xs text-slate-400">Score: {event?.confidenceScore ?? 0}%</p>
                      <button
                        onClick={() => removeFragment(fragment.id)}
                        className="mt-2 text-xs text-rose-300 hover:text-rose-200"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {isGenerated && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-cyan-400/30 bg-cyan-900/20 p-6">
              <h2 className="text-xl font-semibold text-slate-100 mb-3">Conflict Radar</h2>
              {contradictions.length === 0 ? (
                <p className="text-sm text-emerald-200">No direct contradiction detected in current entries.</p>
              ) : (
                <ul className="space-y-2 text-sm text-slate-200">
                  {contradictions.map((issue, idx) => (
                    <li key={idx} className="rounded-md bg-slate-900/50 border border-slate-700 p-2">{issue}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-violet-400/30 bg-violet-900/20 p-6">
              <h2 className="text-xl font-semibold text-slate-100 mb-3">Clarification Prompts</h2>
              {clarificationQuestions.length === 0 ? (
                <p className="text-sm text-emerald-200">Great coverage. No urgent clarifications needed.</p>
              ) : (
                <ul className="space-y-2 text-sm text-slate-200">
                  {clarificationQuestions.map((q, idx) => (
                    <li key={idx} className="rounded-md bg-slate-900/50 border border-slate-700 p-2">{q}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
