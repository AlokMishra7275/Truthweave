'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type Sender = 'assistant' | 'user' | 'system'

interface ChatMessage {
  id: string
  sender: Sender
  text: string
  createdAt: string
}

interface IncidentQuestion {
  id: string
  prompt: string
}

interface AnswerRecord {
  text: string
  skipped: boolean
}

interface IncidentDraft {
  messages: ChatMessage[]
  currentQuestionIndex: number
  isPaused: boolean
  awaitingAnswer: boolean
  pendingAdvance: boolean
  isComplete: boolean
  answers: Record<string, AnswerRecord>
  savedAt: string
}

interface TimelineItem {
  order: number
  prompt: string
  answer: string
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

const DRAFT_STORAGE_KEY = 'truthweave_helpcenter_draft_v1'
const LEGAL_BRIEF_DRAFT_KEY = 'truthweave_legal_brief_draft_v1'

const INCIDENT_QUESTIONS: IncidentQuestion[] = [
  {
    id: 'q1',
    prompt: 'When you feel ready, can you share where this incident happened?'
  },
  {
    id: 'q2',
    prompt: 'Do you remember approximately when it happened (date, week, or time period)?'
  },
  {
    id: 'q3',
    prompt: 'What is the first thing you remember seeing or hearing in that moment?'
  },
  {
    id: 'q4',
    prompt: 'Who else was present, if anyone?'
  },
  {
    id: 'q5',
    prompt: 'What happened next, in your own words?'
  },
  {
    id: 'q6',
    prompt: 'Did you notice any messages, calls, photos, or documents related to this incident?'
  },
  {
    id: 'q7',
    prompt: 'How did this incident affect you emotionally or physically afterward?'
  }
]

const QUESTION_WORDS = ['what', 'why', 'how', 'when', 'where', 'who', 'can', 'could', 'should', 'would', 'is', 'are', 'do', 'does', 'did', 'tell me', 'explain', 'help']

const QUICK_HELP_RESPONSES: Array<{ terms: string[]; response: string }> = [
  {
    terms: ['pause', 'hold on', 'wait'],
    response: 'Pause stops the next questions until you are ready. You can resume with Continue whenever you want.'
  },
  {
    terms: ['continue', 'resume'],
    response: 'Continue picks up from the last point we left off and asks the next relevant question.'
  },
  {
    terms: ['skip'],
    response: 'Skip lets you move past a question you do not want to answer right now, and I move to the next one.'
  },
  {
    terms: ['draft', 'save', 'history', 'autosave'],
    response: 'Your answers are autosaved locally as a draft, so you can come back later and continue from where you left off.'
  },
  {
    terms: ['export', 'download', 'json'],
    response: 'Export creates a downloadable draft file with your chat history, progress, and answers.'
  },
  {
    terms: ['summary', 'copy summary'],
    response: 'Copy Summary creates a readable incident summary that you can paste into notes or share with support later.'
  },
  {
    terms: ['progress', 'answered', 'skipped', 'pending'],
    response: 'Progress shows how many questions are answered, skipped, and still pending in the incident flow.'
  },
  {
    terms: ['back', 'close', 'exit'],
    response: 'Back or Close will dismiss this popup and return you to the page behind it.'
  },
  {
    terms: ['mosaic', 'memory'],
    response: 'Memory Mosaic is the place where you can store fragments as text, voice, or images before organizing them into a timeline.'
  },
  {
    terms: ['evidence', 'vault', 'legal', 'brief', 'timeline'],
    response: 'The legal tools help organize your story safely, preserve evidence, and prepare a structured timeline or brief when you are ready.'
  },
  {
    terms: ['safety', 'emergency', 'crisis', 'help now'],
    response: 'If you are in immediate danger, contact local emergency services right away. If you want, I can also share breathing support or quick-exit guidance.'
  }
]

export default function HelpCenterChat({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  if (!isOpen) {
    return null
  }

  return <HelpCenterChatModal onClose={onClose} />
}

function HelpCenterChatModal({ onClose }: { onClose?: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [suggestedChips, setSuggestedChips] = useState<string[]>([
    'How does autosave work?',
    'What does skip do?',
    'How can I export draft?',
    'What is Memory Mosaic?'
  ])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [awaitingAnswer, setAwaitingAnswer] = useState(false)
  const [pendingAdvance, setPendingAdvance] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [answers, setAnswers] = useState<Record<string, AnswerRecord>>({})
  const [showTimelinePopup, setShowTimelinePopup] = useState(false)
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([])
  const [isHydrated, setIsHydrated] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const typingRef = useRef(false)
  const responseQueueRef = useRef<string[]>([])
  const streamingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const formatTimestamp = (value?: string) => {
    if (!value) return ''
    return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const canSkip = useMemo(() => !isPaused && !isComplete && awaitingAnswer, [isPaused, isComplete, awaitingAnswer])
  const answeredCount = useMemo(() => Object.values(answers).filter((item) => !item.skipped && item.text.trim()).length, [answers])
  const skippedCount = useMemo(() => Object.values(answers).filter((item) => item.skipped).length, [answers])
  const progressPercent = Math.round(((answeredCount + skippedCount) / INCIDENT_QUESTIONS.length) * 100)

  const normalizeText = (value: string) => value.toLowerCase().replace(/[^a-z0-9\s?]/g, ' ').replace(/\s+/g, ' ').trim()

  const isQuestionLike = (value: string) => {
    const normalized = normalizeText(value)
    const commandWords = ['pause', 'continue', 'resume', 'skip', 'export', 'summary', 'clear', 'close', 'back']

    return (
      value.trim().includes('?') ||
      commandWords.includes(normalized) ||
      QUESTION_WORDS.some((word) => normalized.startsWith(word + ' ') || normalized === word || normalized.includes(` ${word} `))
    )
  }

  const getRelatedAnswer = (value: string) => {
    const normalized = normalizeText(value)

    for (const item of QUICK_HELP_RESPONSES) {
      if (item.terms.some((term) => normalized.includes(term))) {
        return item.response
      }
    }

    if (normalized.includes('incident') || normalized.includes('story') || normalized.includes('question')) {
      return 'I can help with incident capture, pause or continue controls, skipping questions, draft saving, export, summary, and the memory-to-timeline flow. Ask me about any of those and I will answer directly.'
    }

    return null
  }

  const buildInitialState = () => ({
    messages: [
      {
        id: 'intro',
        sender: 'assistant' as const,
        text: 'I am here with you. We can go step-by-step, and you can pause any time. You can also ask me any topic-related question about this help centre, safety controls, memory capture, or legal preparation. You are in control.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'q-0',
        sender: 'assistant' as const,
        text: INCIDENT_QUESTIONS[0].prompt,
        createdAt: new Date().toISOString(),
      }
    ],
    currentQuestionIndex: 0,
    isPaused: false,
    awaitingAnswer: true,
    pendingAdvance: false,
    isComplete: false,
    answers: {} as Record<string, AnswerRecord>,
    savedAt: new Date().toISOString()
  })

  useEffect(() => {
    const initialState = buildInitialState()

    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as IncidentDraft
        if (parsed?.messages?.length) {
          setMessages(parsed.messages.map((msg) => ({
            ...msg,
            createdAt: msg.createdAt || new Date().toISOString()
          })))
          setCurrentQuestionIndex(parsed.currentQuestionIndex ?? 0)
          setIsPaused(Boolean(parsed.isPaused))
          setAwaitingAnswer(Boolean(parsed.awaitingAnswer))
          setPendingAdvance(Boolean(parsed.pendingAdvance))
          setIsComplete(Boolean(parsed.isComplete))
          setAnswers(parsed.answers ?? {})
          setLastSavedAt(parsed.savedAt ?? null)
          setIsHydrated(true)
          return
        }
      }
    } catch {
      // If draft parsing fails, start with clean initial state
    }

    setMessages(initialState.messages)
    setCurrentQuestionIndex(initialState.currentQuestionIndex)
    setIsPaused(initialState.isPaused)
    setAwaitingAnswer(initialState.awaitingAnswer)
    setPendingAdvance(initialState.pendingAdvance)
    setIsComplete(initialState.isComplete)
    setAnswers(initialState.answers)
    setLastSavedAt(initialState.savedAt)
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) return

    const draft: IncidentDraft = {
      messages,
      currentQuestionIndex,
      isPaused,
      awaitingAnswer,
      pendingAdvance,
      isComplete,
      answers,
      savedAt: new Date().toISOString()
    }

    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
    setLastSavedAt(draft.savedAt)
  }, [messages, currentQuestionIndex, isPaused, awaitingAnswer, pendingAdvance, isComplete, answers, isHydrated])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    return () => {
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current)
        streamingIntervalRef.current = null
      }
    }
  }, [])

  const addMessage = (sender: Sender, text: string) => {
    setMessages((prev) => [...prev, { id: `${sender}-${Date.now()}-${Math.random()}`, sender, text, createdAt: new Date().toISOString() }])
  }

  const formatInlineMarkdown = (line: string) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>
      }
      return <span key={`${part}-${index}`}>{part}</span>
    })
  }

  const renderMessageText = (text: string) => {
    const lines = text.split('\n')
    return (
      <div className="space-y-1.5">
        {lines.map((line, index) => {
          const trimmed = line.trim()

          if (!trimmed) {
            return <div key={`blank-${index}`} className="h-1" />
          }

          if (/^[-•]\s+/.test(trimmed)) {
            return (
              <div key={`bullet-${index}`} className="flex gap-2">
                <span>•</span>
                <span>{formatInlineMarkdown(trimmed.replace(/^[-•]\s+/, ''))}</span>
              </div>
            )
          }

          if (/^\d+\.\s+/.test(trimmed)) {
            const [num, ...rest] = trimmed.split(/\s+/)
            return (
              <div key={`num-${index}`} className="flex gap-2">
                <span>{num}</span>
                <span>{formatInlineMarkdown(rest.join(' '))}</span>
              </div>
            )
          }

          return (
            <p key={`line-${index}`}>
              {formatInlineMarkdown(trimmed)}
            </p>
          )
        })}
      </div>
    )
  }

  const getNextChips = (seed: string) => {
    const lower = seed.toLowerCase()
    if (lower.includes('legal') || lower.includes('brief') || lower.includes('evidence')) {
      return ['How to build legal timeline?', 'What counts as evidence?', 'How to keep chain of custody?', 'Can I export summary?']
    }
    if (lower.includes('memory') || lower.includes('mosaic')) {
      return ['How to capture memory fragments?', 'Can I add voice notes?', 'How does autosave work?', 'Can I skip sensitive questions?']
    }
    if (lower.includes('safety') || lower.includes('crisis') || lower.includes('pause')) {
      return ['How does Pause work?', 'How to use Quick Exit?', 'Can I continue later?', 'What should I do in emergency?']
    }
    if (awaitingAnswer) {
      return ['I need a pause', 'Can we skip this question?', 'Why is this question important?', 'How is this saved?']
    }
    return ['How does export work?', 'What does Skip do?', 'How can I continue later?', 'Explain this in simple words']
  }

  const processAssistantQueue = () => {
    if (typingRef.current || responseQueueRef.current.length === 0) return
    typingRef.current = true
    setIsTyping(true)
    const nextText = responseQueueRef.current.shift() as string
    const messageId = `assistant-${Date.now()}-${Math.random()}`
    const createdAt = new Date().toISOString()

    setMessages((prev) => [...prev, { id: messageId, sender: 'assistant', text: '', createdAt }])

    const tokens = nextText.split(/(\s+)/).filter((token) => token.length > 0)
    let tokenIndex = 0

    streamingIntervalRef.current = setInterval(() => {
      tokenIndex += 1
      const partial = tokens.slice(0, tokenIndex).join('')

      setMessages((prev) => prev.map((msg) => (
        msg.id === messageId ? { ...msg, text: partial } : msg
      )))

      if (tokenIndex >= tokens.length) {
        if (streamingIntervalRef.current) {
          clearInterval(streamingIntervalRef.current)
          streamingIntervalRef.current = null
        }
        setIsTyping(false)
        typingRef.current = false
        processAssistantQueue()
      }
    }, 38)
  }

  const handleStopGenerating = () => {
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current)
      streamingIntervalRef.current = null
    }

    responseQueueRef.current = []
    typingRef.current = false
    setIsTyping(false)

    const completedTimeline = INCIDENT_QUESTIONS
      .map((question, index) => {
        const entry = answers[question.id]
        if (!entry || entry.skipped || !entry.text.trim()) return null
        return {
          order: index + 1,
          prompt: question.prompt,
          answer: entry.text.trim(),
        }
      })
      .filter((item): item is TimelineItem => Boolean(item))

    const fallbackFromMessages = messages
      .filter((msg) => (msg.sender === 'user' || msg.sender === 'assistant') && msg.text.trim())
      .map((msg, index) => ({
        order: index + 1,
        prompt: msg.sender === 'assistant' ? `Assistant step ${index + 1}` : `User response ${index + 1}`,
        answer: msg.text.trim(),
      }))

    const finalTimeline = completedTimeline.length > 0 ? completedTimeline : fallbackFromMessages

    if (finalTimeline.length > 0) {
      setTimelineItems(finalTimeline)
      setShowTimelinePopup(true)

      try {
        const legalBriefDraft: LegalBriefDraft = {
          savedAt: new Date().toISOString(),
          source: isComplete ? 'Help Center completed chat timeline' : 'Help Center in-progress chat timeline',
          memoryFragments: finalTimeline.map((item) => ({
            description: `[help-center] ${item.prompt} - ${item.answer}`,
            metadata: {
              location: undefined,
              people: ['User', 'AI Companion'],
              emotions: ['self-reported'],
            },
          })),
          gaps: isComplete ? [] : ['Conversation was saved before completion.'],
        }

        localStorage.setItem(LEGAL_BRIEF_DRAFT_KEY, JSON.stringify(legalBriefDraft))
        addMessage('system', 'Timeline popup opened and Legal Brief draft updated.')
      } catch {
        addMessage('system', 'Timeline opened, but legal brief save failed.')
      }
      return
    }

    addMessage('system', 'Generation stopped. Timeline could not be built because no chat content is available yet.')
  }

  const enqueueAssistant = (text: string) => {
    responseQueueRef.current.push(text)
    processAssistantQueue()
  }

  const askNextQuestion = (startIndex: number) => {
    if (startIndex >= INCIDENT_QUESTIONS.length) {
      setIsComplete(true)
      setAwaitingAnswer(false)
      enqueueAssistant('Thank you for sharing this. You have done something very brave. If you want, we can now organize this into a clearer timeline together.')
      return
    }

    setCurrentQuestionIndex(startIndex)
    setAwaitingAnswer(true)
    enqueueAssistant(INCIDENT_QUESTIONS[startIndex].prompt)
  }

  const handleSend = (overrideValue?: string) => {
    const value = (overrideValue ?? input).trim()
    if (!value || isComplete) return

    addMessage('user', value)
    setInput('')
    setSuggestedChips(getNextChips(value))

    const relatedAnswer = isQuestionLike(value) ? getRelatedAnswer(value) : null
    if (relatedAnswer) {
      enqueueAssistant(relatedAnswer)
      if (awaitingAnswer) {
        enqueueAssistant('When you are ready, you can answer the current incident question or ask another related question.')
      }
      return
    }

    if (!awaitingAnswer) return

    const currentQuestion = INCIDENT_QUESTIONS[currentQuestionIndex]
    if (currentQuestion) {
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: {
          text: value,
          skipped: false
        }
      }))
    }

    setAwaitingAnswer(false)

    if (isPaused) {
      setPendingAdvance(true)
      enqueueAssistant('Thank you for sharing. Press Continue when you feel ready, and we will move gently to the next question.')
      return
    }

    askNextQuestion(currentQuestionIndex + 1)
  }

  const handlePause = () => {
    if (isPaused || isComplete) return
    setIsPaused(true)
    enqueueAssistant('It is okay, take your time. I am here whenever you are ready.')
  }

  const handleContinue = () => {
    if (!isPaused || isComplete) return

    setIsPaused(false)

    if (pendingAdvance) {
      setPendingAdvance(false)
      askNextQuestion(currentQuestionIndex + 1)
      return
    }

    if (!awaitingAnswer) {
      askNextQuestion(currentQuestionIndex + 1)
      return
    }

    enqueueAssistant('We can continue from the same point. Share only what feels manageable.')
  }

  const handleSkip = () => {
    if (!canSkip) return

    const currentQuestion = INCIDENT_QUESTIONS[currentQuestionIndex]
    if (currentQuestion) {
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: {
          text: '',
          skipped: true
        }
      }))
    }

    addMessage('system', 'You skipped this question.')
    enqueueAssistant('No problem, we can skip that.')
    setAwaitingAnswer(false)
    askNextQuestion(currentQuestionIndex + 1)
  }

  const handleResetDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY)
    const next = buildInitialState()
    setMessages(next.messages)
    setCurrentQuestionIndex(next.currentQuestionIndex)
    setIsPaused(next.isPaused)
    setAwaitingAnswer(next.awaitingAnswer)
    setPendingAdvance(next.pendingAdvance)
    setIsComplete(next.isComplete)
    setAnswers(next.answers)
    setInput('')
    setLastSavedAt(next.savedAt)
  }

  const handleExportDraft = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      progress: {
        answered: answeredCount,
        skipped: skippedCount,
        total: INCIDENT_QUESTIONS.length
      },
      answers,
      messages
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `truthweave-incident-draft-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    addMessage('system', 'Draft exported successfully.')
  }

  const handleRegenerate = () => {
    if (isTyping) return

    const latestUser = [...messages].reverse().find((msg) => msg.sender === 'user')
    const currentQuestion = INCIDENT_QUESTIONS[currentQuestionIndex]

    let regenerated = 'Here is another way to look at this. Share only what feels manageable, and we will proceed at your pace.'

    if (latestUser) {
      const related = getRelatedAnswer(latestUser.text)
      if (related) {
        regenerated = `Here is another way to explain it:\n- ${related}\n- If you want, I can break this into smaller steps.`
      } else if (awaitingAnswer && currentQuestion) {
        regenerated = `Let me rephrase the current step:\n${currentQuestion.prompt}\n\nTake your time. You can also skip this question if needed.`
      } else {
        regenerated = 'Thanks for sharing that. We can keep going gently, and I can clarify any part again in simpler words if you prefer.'
      }
    } else if (awaitingAnswer && currentQuestion) {
      regenerated = `Let me rephrase the current step:\n${currentQuestion.prompt}`
    }

    enqueueAssistant(regenerated)
    setSuggestedChips(getNextChips(regenerated))
  }

  return (
    <section className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="w-full max-w-5xl rounded-2xl border border-slate-700/70 bg-slate-900/90 shadow-2xl p-5 max-h-[92vh] overflow-y-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div>
          <h3 className="text-xl font-semibold text-slate-100">Your Friend</h3>
          <p className="text-sm text-sky-200 mt-1">You are safe here. Share only what feels comfortable right now.</p>
          <p className="text-sm text-slate-300">A serious, supportive space to document your incident step-by-step.</p>
          <p className="text-xs text-slate-400 mt-0.5">TruthWeave Assistant GPT • {isTyping ? 'Thinking…' : 'Ready'}</p>
          <p className="text-xs text-slate-400 mt-1">
            Autosave: {lastSavedAt ? new Date(lastSavedAt).toLocaleTimeString() : 'Not saved yet'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onClose && (
            <>
              <button
                onClick={onClose}
                className="px-3 py-2 rounded-lg text-sm font-medium bg-slate-600 text-white hover:bg-slate-500 flex items-center gap-2"
                aria-label="Back"
                title="Back"
              >
                <span aria-hidden="true">←</span>
                <span>Back</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-600 text-white hover:bg-slate-500"
              >
                Close
              </button>
            </>
          )}
          <button
            onClick={isPaused ? handleContinue : handlePause}
            disabled={isComplete}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isPaused
                ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                : 'bg-amber-600 text-white hover:bg-amber-500'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isPaused ? 'Continue' : 'Pause'}
          </button>
          <button
            onClick={handleSkip}
            disabled={!canSkip}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 text-slate-100 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Skip
          </button>
          <button
            onClick={handleExportDraft}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-700 text-white hover:bg-blue-600"
          >
            Export
          </button>
          <button
            onClick={handleResetDraft}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-rose-700 text-white hover:bg-rose-600"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="mb-4 rounded-lg border border-slate-700 bg-slate-950/60 p-3">
        <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
          <span>Incident progress</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="w-full h-2 rounded bg-slate-800 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-sky-500 to-indigo-500" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
          <span>Answered: {answeredCount}</span>
          <span>Skipped: {skippedCount}</span>
          <span>Pending: {INCIDENT_QUESTIONS.length - answeredCount - skippedCount}</span>
        </div>
      </div>

      <div className="h-80 overflow-y-auto rounded-lg border border-slate-700 bg-slate-950/70 p-4 space-y-3 mb-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : msg.sender === 'system'
                    ? 'bg-slate-700 text-slate-200 border border-slate-500/50'
                    : 'bg-slate-900 text-slate-100 border border-slate-700'
              }`}
            >
              {renderMessageText(msg.text)}
              <div className="mt-2 text-[11px] opacity-70 text-right">
                {formatTimestamp(msg.createdAt)}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-4 py-3 text-sm leading-relaxed bg-slate-900 text-slate-100 border border-slate-700 inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-300 animate-pulse" />
              <span className="w-2 h-2 rounded-full bg-slate-300 animate-pulse" style={{ animationDelay: '0.15s' }} />
              <span className="w-2 h-2 rounded-full bg-slate-300 animate-pulse" style={{ animationDelay: '0.3s' }} />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={isPaused ? 'Conversation is paused. Click Continue when ready.' : 'Type your response...'}
          className="flex-1 px-4 py-3 rounded-lg border border-slate-600 bg-slate-800 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isComplete}
        />
        <button
          onClick={() => handleSend()}
          disabled={isComplete}
          className="px-5 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
        <button
          onClick={handleStopGenerating}
          disabled={messages.length === 0}
          className="px-4 py-3 rounded-lg bg-amber-700 text-white font-medium hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Stop generating
        </button>
        <button
          onClick={handleRegenerate}
          disabled={isComplete || isTyping}
          className="px-4 py-3 rounded-lg bg-slate-700 text-slate-100 font-medium hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Regenerate
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {suggestedChips.map((chip) => (
          <button
            key={chip}
            onClick={() => handleSend(chip)}
            className="px-3 py-1.5 rounded-full text-xs bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-600"
          >
            {chip}
          </button>
        ))}
      </div>

      {showTimelinePopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-700 bg-slate-900 p-5 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xl font-semibold text-slate-100">Timeline</h4>
              <button
                onClick={() => setShowTimelinePopup(false)}
                className="px-3 py-1.5 rounded bg-slate-700 text-slate-100 hover:bg-slate-600"
              >
                Close
              </button>
            </div>

            <p className="text-sm text-slate-300 mb-4">
              Generated from completed Help Center chat. This has been saved in Legal Brief draft.
            </p>

            <div className="space-y-3">
              {timelineItems.map((item) => (
                <div key={`${item.order}-${item.prompt}`} className="rounded-lg border border-slate-700 bg-slate-950/60 p-4">
                  <p className="text-xs text-slate-400 mb-2">Step {item.order}</p>
                  <p className="text-sm text-slate-200 font-medium mb-2">{item.prompt}</p>
                  <p className="text-sm text-slate-100">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      </div>
    </section>
  )
}
