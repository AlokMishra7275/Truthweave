'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

const TRAUMA_INFORMED_RESPONSES: Record<string, string> = {
  start: `I am here to listen whenever you are ready. There is no pressure, no judgment, and no rush.

My role is to help you structure your fragmented memories into a legal-ready testimony—but only in a way that feels safe for you. Trauma fragments our memories. That is not weakness; that is how our minds protect us.

Rather than asking for dates or linear facts immediately, I want to understand your experiences through your senses:
• What do you see when you close your eyes?
• What sounds remain with you?
• What did you feel in your body?
• What emotions were present?

These sensory details are just as valuable as facts. Often, our bodies remember what our minds cannot yet organize.

To start organizing your thoughts in a safe space, please click on "Begin Your Journey" below.`,

  sensory: `You do not need to remember everything in order. Our minds protect us by fragmenting traumatic memories. This is healing, not failure.

Let me help you gather what you do remember—piece by piece, safely.

Tell me about:
• A specific moment you remember clearly (even if it is just 10 seconds)
• What you sensed in that moment
• How your body felt

There are no wrong answers. Your memories, however fragmented, are valid and important.`,

  timeline: `I will not rush you into a linear timeline. Instead, we will collect your memories as fragments first, like a mosaic.

Once you have shared what feels manageable, we can gently weave these fragments into a coherent structure—one that respects your healing while creating something legally sound.

This process is for you. We move at your pace.`,

  safety: `Your physical and emotional safety comes first, always.

If at any point you need to:
• Take a break: Click Pause. Return when ready.
• Exit quickly: Press ESC or click the red Exit button.
• Switch to stealth mode: Click the eye icon for privacy.
• Access crisis support: I can provide 24/7 resources.

You have complete control. You are safe here.`,

  breathing: `If you feel triggered or overwhelmed, let us pause and ground you together.
  
**4-4-4 Breathing:**
1. Breathe in slowly for 4 seconds
2. Hold for 4 seconds  
3. Exhale slowly for 4 seconds
4. Rest for 4 seconds

Repeat 5 times. Notice how this grounds you in the present moment.

You are safe right now. Take your time.`,

  crisis: `If you are in immediate danger, your safety is the priority. Please call emergency services:

🇮🇳 **India:** 
• Police: 100
• Women's Helpline: 1800-120-0770
• AASRA (Suicide Prevention): 1800-2233-330
• iCall: 9152987821

🌍 **International:**
• RAINN (US): 1-800-656-4673
• Samaritans (UK): 116-123

You deserve support. Help is available 24/7.`,

  memory: `Memory Mosaic is your private space to collect fragments:

📝 **Text:** Write thoughts as they come
🎤 **Voice:** Record memories without transcribing
📸 **Images:** Upload photos with preserved metadata
🏷️ **Mood Tags:** Track emotional context & intensity

No organization required. Just capture what comes to mind. We will structure it later when it feels safe.`,

  legal: `When you are ready, TruthView will help transform your fragmented memories into a legal narrative.

We will:
✓ Organize memories with timestamps
✓ Create a coherent timeline 
✓ Preserve chain of custody for evidence
✓ Generate a court-ready PDF brief

But first, we focus on capturing your truth safely. Legal documentation comes after psychological processing.`,

  mosaic: `The Memory Mosaic is your personal healing and documentation space. It represents:

🧩 **Fragmentation is normal** – Trauma doesn't organize linearly
🌊 **Your narrative emerges** – Patterns appear when fragments connect
🎨 **You control the structure** – Not forced chronology
🛡️ **It is encrypted** – Only you see your memories

Start by clicking "Add Memory" and choose what feels easiest to express today.`,

  support: `You are not alone. TruthView connects you to:

🤝 **24/7 Crisis Resources** – Always available
📚 **Trauma Education** – Understand your responses
👥 **Survivor Community** – Stories of resilience
⚖️ **Legal Guidance** – Connect with advocates

Your trauma is not your fault. Your strength in sharing is extraordinary.`,

  ready: `I sense you might be ready to begin. That takes courage.

When you click "Begin Your Journey," you will enter a completely private space. What you create here is yours alone.

Start with whatever feels most manageable:
• A moment that stands out
• A sensory detail you remember
• An emotion from that time

There is no right way to begin. Your truth matters exactly as it is.

Are you ready? Click "Begin Your Journey" below.`,

  default: `I understand. No pressure to share anything right now.

If you need support with:
• Breathing or grounding → Ask for "breathing"
• Immediate danger → Ask for "crisis help"
• Understanding how this works → Ask for "how does this work"
• Learning about Memory Mosaic → Ask for "memory"

I am here whenever you are ready. Your safety and comfort are my priority.`
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `I am here to listen whenever you are ready. There is no pressure, no judgment, and no rush.

My role is to help you structure your fragmented memories into a legal-ready testimony—but only in a way that feels safe for you. Trauma fragments our memories. That is not weakness; that is how our minds protect us.

Rather than asking for dates or linear facts immediately, I want to understand your experiences through your senses:
• What do you see when you close your eyes?
• What sounds remain with you?
• What did you feel in your body?
• What emotions were present?

These sensory details are just as valuable as facts. Often, our bodies remember what our minds cannot yet organize.

To start organizing your thoughts in a safe space, please click on "Begin Your Journey" below.`,
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
