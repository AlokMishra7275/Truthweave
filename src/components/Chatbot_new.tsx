'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

const TRAUMA_INFORMED_RESPONSES: Record<string, string> = {
  hello: 'Hello! I am here to support you. How can I help today?',
  help: 'You can ask me about:\n• using Memory Mosaic\n• keeping your data secure\n• legal preparation\n• safety features\n• crisis resources\n\nPlease tell me what you need.',
  breathing: 'Try the 4-4-4 breathing exercise:\n\n1. Inhale for 4 counts\n2. Hold for 4 counts\n3. Exhale for 4 counts\n4. Pause for 4 counts\n\nRepeat 5 times and notice how you feel.',
  safe: 'Your safety is our priority. TruthView offers:\n✓ encrypted storage\n✓ quick exit button\n✓ stealth mode\n✓ full control over your content',
  crisis: 'If you are in immediate danger, please call your local emergency number.\n\nIn India:\n📞 National Women\'s Helpline: 1800-120-0770\n📞 Crisis Intervention Centre: 1800-2233-330\n\nHelp is available.',
  memory: 'Memory Mosaic helps you capture memories with:\n\n• Text entries\n• Voice notes\n• Image uploads\n\nTag each memory with mood and intensity, then save it securely.',
  legal: 'TruthView helps you prepare for legal proceedings by:\n\n✓ organizing your timeline\n✓ securing evidence with hashes\n✓ generating a professional report\n✓ keeping your story safe',
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Welcome to TruthView support. Ask me anything about safety, privacy, memory organization, or legal preparation.',
      sender: 'bot',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])

    setTimeout(() => {
      const lowerInput = input.toLowerCase()
      let responseText = 'I did not understand that. Please ask for help or mention a topic like memory, safety, or legal preparation.'

      for (const [key, value] of Object.entries(TRAUMA_INFORMED_RESPONSES)) {
        if (lowerInput.includes(key)) {
          responseText = value
          break
        }
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'bot',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, botMessage])
    }, 500)

    setInput('')
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-2xl z-40"
        title="Chat Support"
      >
        💬
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-96 bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-slate-200">
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <h3 className="font-semibold">TruthView Support</h3>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-slate-200">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs px-4 py-2 rounded-lg ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-slate-800 border border-slate-200'}`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  <span className="text-xs opacity-70 mt-1 block">{msg.timestamp.toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-slate-200 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSend()}
              placeholder="Type your question..."
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={handleSend} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Send</button>
          </div>

          <div className="px-4 pb-2 flex gap-2 flex-wrap justify-center text-xs">
            <button onClick={() => setInput('breathing')} className="px-2 py-1 bg-slate-200 hover:bg-slate-300 rounded text-slate-700">Breathing</button>
            <button onClick={() => setInput('crisis')} className="px-2 py-1 bg-red-100 hover:bg-red-200 rounded text-red-700">Crisis Help</button>
            <button onClick={() => setInput('safety')} className="px-2 py-1 bg-green-100 hover:bg-green-200 rounded text-green-700">Safety Tips</button>
          </div>
        </div>
      )}
    </>
  )
}
