'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

interface FAQItem {
  id: string
  category: string
  question: string
  answer: string
}

type Lang = 'en' | 'hi' | 'es'

interface AssistMessage {
  id: string
  sender: 'user' | 'assistant' | 'system'
  text: string
}

const FAQS: FAQItem[] = [
  {
    id: '1',
    category: 'Getting Started',
    question: 'What is TruthView?',
    answer: 'TruthView is a trauma-informed platform that helps survivors safely document, organize, and prepare memories for legal proceedings. Your safety and privacy are our top priorities.',
  },
  {
    id: '2',
    category: 'Getting Started',
    question: 'Is my data secure?',
    answer: 'Yes. Your data is encrypted and protected. TruthView offers secure storage, quick exit, stealth mode, and full control over your content.',
  },
  {
    id: '3',
    category: 'Memory Mosaic',
    question: 'How does Memory Mosaic work?',
    answer: 'Memory Mosaic lets you add memories using text, voice, or image uploads. Tag each entry with mood and intensity, then save it securely.',
  },
  {
    id: '4',
    category: 'Memory Mosaic',
    question: 'Can I edit or delete my memories?',
    answer: 'Yes. Each memory entry can be edited or deleted at any time. You have full control over your content.',
  },
  {
    id: '5',
    category: 'Legal Preparation',
    question: 'What is a legal brief?',
    answer: 'A legal brief is a document that organizes your memories in a court-friendly format. TruthView can generate a PDF with your timeline, evidence, and key details.',
  },
  {
    id: '6',
    category: 'Legal Preparation',
    question: 'Is TruthView legally valid?',
    answer: 'TruthView secures records with SHA-256 hashing and digital signatures. Always consult legal counsel for your situation.',
  },
  {
    id: '7',
    category: 'Safety',
    question: 'What does the Quick Exit button do?',
    answer: 'The Quick Exit button clears session data, clears local storage, and redirects to a safe page. It helps you leave quickly and discreetly.',
  },
  {
    id: '8',
    category: 'Safety',
    question: 'What is Stealth Mode?',
    answer: 'Stealth Mode makes the interface look like a simple notes app, helping protect your privacy while you use TruthView.',
  },
  {
    id: '9',
    category: 'Crisis Support',
    question: 'I need help immediately. What should I do?',
    answer: 'If you are in immediate danger, call local emergency services right away. In India, call 1800-120-0770 or 1800-2233-330.',
  },
  {
    id: '10',
    category: 'Crisis Support',
    question: 'Are breathing exercises helpful?',
    answer: 'Yes. Try the 4-4-4 breathing exercise: inhale for 4, hold for 4, exhale for 4, hold for 4. Repeat five times to help reduce stress.',
  },
]

const ASSISTANT_RESPONSES: Record<string, Record<Lang, string>> = {
  start: {
    en: 'You are safe here. Share only what feels manageable. We can capture memory fragments one by one and organize them later.',
    hi: 'Aap yahan safe hain. Sirf wahi share karein jo manageable lage. Hum memories ko chhote fragments me capture karke baad me organize karenge.',
    es: 'Estas a salvo aqui. Comparte solo lo que te resulte manejable. Podemos capturar fragmentos de memoria y organizarlos despues.'
  },
  memory: {
    en: 'Use Memory Mosaic to add text, voice, or image fragments. Fragmented recall is normal after trauma.',
    hi: 'Memory Mosaic me text, voice ya image fragments add karein. Trauma ke baad fragmented recall bilkul normal hota hai.',
    es: 'Usa Memory Mosaic para agregar fragmentos de texto, voz o imagen. El recuerdo fragmentado es normal despues del trauma.'
  },
  legal: {
    en: 'When you are ready, we can build a clear chronology and create a legal brief with evidence integrity in mind.',
    hi: 'Jab aap ready hon, hum clear chronology bana kar evidence integrity ke saath legal brief tayar kar sakte hain.',
    es: 'Cuando estes lista, podemos construir una cronologia clara y crear un informe legal cuidando la integridad de la evidencia.'
  },
  crisis: {
    en: 'If you are in immediate danger, contact emergency services now. India helplines: 1800-120-0770, 1800-2233-330.',
    hi: 'Agar turant khatra ho to abhi emergency services se contact karein. India helplines: 1800-120-0770, 1800-2233-330.',
    es: 'Si estas en peligro inmediato, contacta servicios de emergencia ahora. Lineas de ayuda en India: 1800-120-0770, 1800-2233-330.'
  },
  breathing: {
    en: 'Try 4-4-4 breathing: inhale 4 sec, hold 4 sec, exhale 4 sec, rest 4 sec. Repeat 5 cycles.',
    hi: '4-4-4 breathing try karein: 4 sec inhale, 4 sec hold, 4 sec exhale, 4 sec rest. Isse 5 cycles repeat karein.',
    es: 'Prueba respiracion 4-4-4: inhala 4 s, soste 4 s, exhala 4 s, descansa 4 s. Repite 5 ciclos.'
  },
  default: {
    en: 'I am with you. Ask about memory, legal brief, safety, crisis help, or breathing support.',
    hi: 'Main aapke saath hoon. Aap memory, legal brief, safety, crisis help ya breathing support ke baare me puch sakte hain.',
    es: 'Estoy contigo. Puedes preguntar sobre memoria, informe legal, seguridad, ayuda en crisis o respiracion.'
  }
}

const LANGUAGE_LABELS: Record<Lang, string> = {
  en: 'English',
  hi: 'Hindi',
  es: 'Spanish'
}

const RESOURCES = [
  {
    title: 'National Women\'s Helpline',
    description: '24/7 support for women in India',
    contact: '1800-120-0770',
    icon: '📞',
  },
  {
    title: 'Crisis Intervention Centre',
    description: 'Immediate support and counseling',
    contact: '1800-2233-330',
    icon: '💙',
  },
  {
    title: 'Trauma Support Services',
    description: 'Expert counselors and legal advisors',
    contact: 'Online Counseling',
    icon: '🤝',
  },
  {
    title: 'Emergency Services',
    description: 'Help for immediate physical danger',
    contact: '100 / 911',
    icon: '🚨',
  },
]

export default function HelpCenter() {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [language, setLanguage] = useState<Lang>('en')
  const [input, setInput] = useState('')
  const [isPaused, setIsPaused] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [messages, setMessages] = useState<AssistMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: ASSISTANT_RESPONSES.start.en
    }
  ])

  const queueRef = useRef<string[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const currentMessageIdRef = useRef<string | null>(null)
  const currentResponseRef = useRef('')
  const currentIndexRef = useRef(0)
  const pausedRef = useRef(false)
  const listBottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    pausedRef.current = isPaused
  }, [isPaused])

  useEffect(() => {
    listBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const categories = ['all', ...new Set(FAQS.map(faq => faq.category))]
  const filteredFAQs = selectedCategory === 'all' ? FAQS : FAQS.filter(faq => faq.category === selectedCategory)

  const detectIntent = (query: string) => {
    const q = query.toLowerCase()
    if (/(start|begin|ready)/.test(q)) return 'start'
    if (/(memory|mosaic|fragment|voice|image|text)/.test(q)) return 'memory'
    if (/(legal|court|brief|evidence|timeline)/.test(q)) return 'legal'
    if (/(crisis|danger|emergency|help now)/.test(q)) return 'crisis'
    if (/(breathe|breathing|panic|ground)/.test(q)) return 'breathing'
    return 'default'
  }

  const runTyping = () => {
    if (pausedRef.current || intervalRef.current || !currentMessageIdRef.current) return

    intervalRef.current = setInterval(() => {
      if (pausedRef.current || !currentMessageIdRef.current) return

      currentIndexRef.current += 1
      const nextText = currentResponseRef.current.slice(0, currentIndexRef.current)
      const done = currentIndexRef.current >= currentResponseRef.current.length

      setMessages(prev => prev.map(msg => (
        msg.id === currentMessageIdRef.current ? { ...msg, text: nextText } : msg
      )))

      if (done) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        currentMessageIdRef.current = null
        currentResponseRef.current = ''
        currentIndexRef.current = 0
        if (queueRef.current.length > 0 && !pausedRef.current) {
          startNextReply()
        } else {
          setIsTyping(false)
        }
      }
    }, 18)
  }

  const startNextReply = () => {
    if (pausedRef.current || queueRef.current.length === 0) {
      setIsTyping(false)
      return
    }

    const response = queueRef.current.shift()
    if (!response) {
      setIsTyping(false)
      return
    }

    const messageId = `assistant-${Date.now()}-${Math.random()}`
    currentMessageIdRef.current = messageId
    currentResponseRef.current = response
    currentIndexRef.current = 0
    setIsTyping(true)
    setMessages(prev => [...prev, { id: messageId, sender: 'assistant', text: '' }])
    runTyping()
  }

  const togglePause = () => {
    const next = !isPaused
    setIsPaused(next)

    if (next) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setMessages(prev => [...prev, {
        id: `system-${Date.now()}`,
        sender: 'system',
        text: language === 'hi' ? 'Assistant paused.' : language === 'es' ? 'Asistente en pausa.' : 'Assistant paused.'
      }])
    } else {
      setMessages(prev => [...prev, {
        id: `system-${Date.now()}`,
        sender: 'system',
        text: language === 'hi' ? 'Assistant resumed.' : language === 'es' ? 'Asistente reanudado.' : 'Assistant resumed.'
      }])

      if (currentMessageIdRef.current) {
        runTyping()
      } else if (queueRef.current.length > 0) {
        startNextReply()
      }
    }
  }

  const handleSend = () => {
    if (!input.trim()) return

    const userText = input.trim()
    setMessages(prev => [...prev, { id: `user-${Date.now()}`, sender: 'user', text: userText }])
    const intent = detectIntent(userText)
    queueRef.current.push(ASSISTANT_RESPONSES[intent][language])

    if (!currentMessageIdRef.current && !pausedRef.current) {
      startNextReply()
    }

    setInput('')
  }

  const changeLanguage = (value: Lang) => {
    setLanguage(value)
    setMessages(prev => [...prev, {
      id: `system-${Date.now()}`,
      sender: 'system',
      text: `Language switched to ${LANGUAGE_LABELS[value]}.`
    }])
  }

  return (
    <main className="min-h-screen theme-surface">
      <header className="bg-slate-900/80 border-b border-slate-700/60 sticky top-0 z-10 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-6 flex justify-between items-center flex-wrap gap-4">
          <Link href="/" className="text-2xl font-bold text-slate-100">TruthWeave</Link>
          <Link href="/" className="px-4 py-2 text-slate-300 hover:text-slate-100 transition-colors text-sm">Back Home</Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-100 mb-4">Help Center</h1>
          <p className="text-lg text-slate-300">Talk to a guided assistant and get support resources in one place.</p>
        </div>

        <section className="rounded-2xl border border-slate-700/70 bg-slate-900/75 shadow-xl backdrop-blur-md overflow-hidden mb-12">
          <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-100">TruthWeave Assistant</h2>
              <p className="text-sm text-slate-300">ChatGPT-style support for memory, safety, and legal preparation.</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={language}
                onChange={(e) => changeLanguage(e.target.value as Lang)}
                className="px-3 py-2 rounded-lg border border-slate-600 bg-slate-800 text-slate-100 text-sm"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="es">Spanish</option>
              </select>
              <button
                onClick={togglePause}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isPaused ? 'bg-emerald-700 text-emerald-100 hover:bg-emerald-600' : 'bg-amber-700 text-amber-100 hover:bg-amber-600'
                }`}
              >
                {isPaused ? 'Resume' : 'Pause'}
              </button>
            </div>
          </div>

          <div className="h-[440px] overflow-y-auto px-5 py-5 bg-slate-950/60 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : msg.sender === 'system'
                      ? 'bg-slate-700 text-slate-200 border border-slate-500/50'
                      : 'bg-slate-900 text-slate-100 border border-slate-700'
                }`}>
                  {msg.text || (msg.sender === 'assistant' && isTyping ? '...' : '')}
                </div>
              </div>
            ))}
            <div ref={listBottomRef} />
          </div>

          <div className="px-5 py-4 border-t border-slate-700 bg-slate-900/80">
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Message TruthWeave Assistant..."
                className="flex-1 px-4 py-3 rounded-xl border border-slate-600 bg-slate-800 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSend}
                className="px-5 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors"
              >
                Send
              </button>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setInput('memory')} className="px-3 py-1.5 rounded-full bg-slate-800 text-slate-200 text-xs hover:bg-slate-700">Memory</button>
              <button onClick={() => setInput('legal')} className="px-3 py-1.5 rounded-full bg-slate-800 text-slate-200 text-xs hover:bg-slate-700">Legal Brief</button>
              <button onClick={() => setInput('breathing')} className="px-3 py-1.5 rounded-full bg-slate-800 text-slate-200 text-xs hover:bg-slate-700">Breathing</button>
              <button onClick={() => setInput('crisis help')} className="px-3 py-1.5 rounded-full bg-slate-800 text-slate-200 text-xs hover:bg-slate-700">Crisis Help</button>
            </div>
          </div>
        </section>

        <div className="mb-12 p-6 bg-rose-900/30 border border-rose-500/40 rounded-lg">
          <div className="flex items-start space-x-4">
            <span className="text-3xl">🚨</span>
            <div>
              <h3 className="text-lg font-semibold text-rose-100 mb-2">Need Immediate Help?</h3>
              <p className="text-rose-200 mb-3">If you are in immediate danger, call local emergency services or contact a trusted person.</p>
              <div className="space-y-2">
                <p className="text-rose-200 font-medium">Emergency Helplines in India:</p>
                <p className="text-rose-100">National Women&apos;s Helpline: <strong>1800-120-0770</strong></p>
                <p className="text-rose-100">Crisis Intervention Centre: <strong>1800-2233-330</strong></p>
              </div>
            </div>
          </div>
        </div>

        <section className="mb-12">
          <h2 className="text-3xl font-bold text-slate-100 mb-8">Support Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {RESOURCES.map((resource, idx) => (
              <div key={idx} className="bg-slate-900/80 border border-slate-700 rounded-lg shadow-md p-6 hover:border-slate-500 transition-colors">
                <div className="text-4xl mb-3">{resource.icon}</div>
                <h3 className="font-semibold text-slate-100 mb-2">{resource.title}</h3>
                <p className="text-sm text-slate-300 mb-4">{resource.description}</p>
                <p className="text-lg font-bold text-blue-300">{resource.contact}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-slate-900/80 border border-slate-700 rounded-lg shadow-sm p-8 mb-12">
          <h2 className="text-3xl font-bold text-slate-100 mb-6">Frequently Asked Questions</h2>
          <div className="mb-6 flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}>
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {filteredFAQs.map(faq => (
              <div key={faq.id} className="border border-slate-700 rounded-lg overflow-hidden hover:border-blue-500/60 transition-colors">
                <button
                  onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                  className="w-full px-6 py-4 flex justify-between items-center hover:bg-slate-800 transition-colors"
                >
                  <div className="text-left flex-1">
                    <span className="inline-block px-3 py-1 text-xs font-medium bg-blue-900/50 text-blue-200 rounded-full mb-2">{faq.category}</span>
                    <h3 className="font-semibold text-slate-100">{faq.question}</h3>
                  </div>
                  <span className="text-2xl text-slate-300 ml-4">{expandedId === faq.id ? '-' : '+'}</span>
                </button>
                {expandedId === faq.id && (
                  <div className="px-6 py-4 bg-slate-800 border-t border-slate-700">
                    <p className="text-slate-200 whitespace-pre-wrap">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="bg-blue-900/20 border border-blue-500/30 rounded-lg shadow-sm p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Have More Questions?</h2>
            <p className="text-slate-300 mb-6">Ask the assistant above, then continue your journey from home.</p>
            <div className="flex justify-center gap-4 flex-wrap">
              <Link href="/" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors font-medium">Go Home</Link>
            </div>
          </div>
        </section>

        <div className="mt-12 text-center text-slate-400">
          <p>TruthWeave - Trauma-Informed Support and Legal Preparation Platform</p>
          <p className="text-sm mt-2">Your story matters. Your safety is our priority.</p>
        </div>
      </div>
    </main>
  )
}
