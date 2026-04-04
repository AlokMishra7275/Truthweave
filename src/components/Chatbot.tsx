'use client'

import { useState, useEffect, useRef } from 'react'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

const RESPONSES: { [key: string]: string } = {
  hello: 'Hello! I am here to support you. How can I help today?',
  help: 'You can ask about Memory Mosaic, safety tips, quick exit, stealth mode, legal preparation, or crisis support.',
  breathing: 'Try this breathing exercise:\n\n1. Breathe in for 4 seconds\n2. Hold for 4 seconds\n3. Exhale for 4 seconds\n4. Hold for 4 seconds\n\nRepeat five times and notice how you feel.',
  safe: 'Your safety is the priority. Use quick exit and stealth mode if you need privacy.',
  crisis: 'If you are in immediate danger, call emergency services right away. In India, call 1800-120-0770 or 1800-2233-330.',
  memory: 'Memory Mosaic helps you collect text, voice, or image memories. Tag each memory with mood and intensity and save it securely.',
  legal: 'TruthView can organize your memories into a legal brief and prepare a PDF with your timeline and evidence.',
}

export default function Chatbot({ inline = false }: { inline?: boolean }) {
  const [isOpen, setIsOpen] = useState(inline)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello, I am your trauma-informed support assistant. Ask me about breathing, safety, memory support, or crisis help.',
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
    const query = input.toLowerCase()
    let responseText = 'I am sorry, I did not understand. Try asking for help, safety tips, breathing exercises, or legal support.'
    for (const key of Object.keys(RESPONSES)) {
      if (query.includes(key)) {
        responseText = RESPONSES[key]
        break
      }
    }
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'bot',
        timestamp: new Date(),
      }])
    }, 400)
    setInput('')
  }

  return (
    <>
      {!inline && (
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
                <h3 className="font-semibold">TruthView Assistant</h3>
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
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Type your question..."
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSend}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Send
                </button>
              </div>
              <div className="px-4 pb-2 flex gap-2 flex-wrap justify-center text-xs">
                <button onClick={() => setInput('breathing')} className="px-2 py-1 bg-slate-200 hover:bg-slate-300 rounded text-slate-700">Breathing</button>
                <button onClick={() => setInput('crisis')} className="px-2 py-1 bg-red-100 hover:bg-red-200 rounded text-red-700">Crisis Help</button>
                <button onClick={() => setInput('safety')} className="px-2 py-1 bg-green-100 hover:bg-green-200 rounded text-green-700">Safety Tips</button>
              </div>
            </div>
          )}
        </>
      )}

      {inline && isOpen && (
        <div className="w-full h-full bg-white flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-800 border border-slate-200 shadow-sm'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-3 border-t border-slate-200 bg-white">
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything..."
                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleSend}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Send
              </button>
            </div>
            <div className="flex gap-1 flex-wrap justify-center">
              <button onClick={() => setInput('breathing')} className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded text-slate-700 transition-colors">Breathing</button>
              <button onClick={() => setInput('crisis')} className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 rounded text-red-700 transition-colors">Crisis Help</button>
              <button onClick={() => setInput('safety')} className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 rounded text-green-700 transition-colors">Safety Tips</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
