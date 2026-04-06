'use client'

import { useState } from 'react'
import Link from 'next/link'

interface FAQItem {
  id: string
  category: string
  question: string
  answer: string
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
    answer: 'Stealth Mode changes the interface so TruthView appears like a simple notes application, helping protect your privacy.',
  },
  {
    id: '9',
    category: 'Crisis Support',
    question: 'I need help immediately. What should I do?',
    answer: 'If you are in immediate danger, call your local emergency services right away. In India, call 1800-120-0770 or 1800-2233-330.',
  },
  {
    id: '10',
    category: 'Crisis Support',
    question: 'Are breathing exercises helpful?',
    answer: 'Yes. Try the 4-4-4 breathing exercise: inhale for 4, hold 4, exhale 4, hold 4. Repeat five times to help reduce stress.',
  },
]

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

  const categories = ['all', ...new Set(FAQS.map(faq => faq.category))]
  const filteredFAQs = selectedCategory === 'all' ? FAQS : FAQS.filter(faq => faq.category === selectedCategory)

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-amber-50 to-rose-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-6 flex justify-between items-center flex-wrap gap-4">
          <Link href="/" className="text-2xl font-bold text-blue-600">TruthView</Link>
          <Link href="/" className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors text-sm">← Back Home</Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">Help Center</h1>
          <p className="text-lg text-slate-600">Learn about TruthView and find support resources.</p>
        </div>

        <div className="mb-12 p-6 bg-red-50 border-l-4 border-red-600 rounded-lg">
          <div className="flex items-start space-x-4">
            <span className="text-3xl">🚨</span>
            <div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">Need Immediate Help?</h3>
              <p className="text-red-700 mb-3">If you are in immediate danger, call local emergency services or contact a trusted person.</p>
              <div className="space-y-2">
                <p className="text-red-700 font-medium">Emergency Helplines in India:</p>
                <p className="text-red-900">National Women&apos;s Helpline: <strong>1800-120-0770</strong></p>
                <p className="text-red-900">Crisis Intervention Centre: <strong>1800-2233-330</strong></p>
              </div>
            </div>
          </div>
        </div>

        <section className="mb-12">
          <h2 className="text-3xl font-bold text-slate-800 mb-8">Support Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {RESOURCES.map((resource, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-3">{resource.icon}</div>
                <h3 className="font-semibold text-slate-800 mb-2">{resource.title}</h3>
                <p className="text-sm text-slate-600 mb-4">{resource.description}</p>
                <p className="text-lg font-bold text-blue-600">{resource.contact}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-lg shadow-sm p-8 mb-12">
          <h2 className="text-3xl font-bold text-slate-800 mb-6">Frequently Asked Questions</h2>
          <div className="mb-6 flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {filteredFAQs.map(faq => (
              <div key={faq.id} className="border border-slate-200 rounded-lg overflow-hidden hover:border-blue-300 transition-colors">
                <button
                  onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                  className="w-full px-6 py-4 flex justify-between items-center hover:bg-slate-50 transition-colors"
                >
                  <div className="text-left flex-1">
                    <span className="inline-block px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full mb-2">{faq.category}</span>
                    <h3 className="font-semibold text-slate-800">{faq.question}</h3>
                  </div>
                  <span className="text-2xl text-slate-600 ml-4">{expandedId === faq.id ? '−' : '+'}</span>
                </button>
                {expandedId === faq.id && (
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                    <p className="text-slate-700 whitespace-pre-wrap">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="bg-blue-50 rounded-lg shadow-sm p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Have More Questions?</h2>
            <p className="text-slate-600 mb-6">Chat with our support assistant or return to the home page to explore more.</p>
            <div className="flex justify-center gap-4 flex-wrap">
              <Link href="/" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">💬 Open Chatbot</Link>
              <Link href="/" className="px-6 py-3 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium">🏠 Go Home</Link>
            </div>
          </div>
        </section>

        <div className="mt-12 text-center text-slate-600">
          <p>TruthView - Trauma-Informed Support & Legal Preparation Platform</p>
          <p className="text-sm mt-2">Your story matters. Your safety is our priority.</p>
        </div>
      </div>
    </main>
  )
}
