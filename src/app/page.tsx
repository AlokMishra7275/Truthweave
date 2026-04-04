'use client'

import Link from 'next/link'
import Chatbot from '@/components/Chatbot'
import { useState } from 'react'

export default function Home() {
  const [isStealthMode, setIsStealthMode] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)

  const toggleStealthMode = () => {
    setIsStealthMode(!isStealthMode)
    if (!isStealthMode) {
      document.title = 'Online Dictionary - Search Words'
      document.body.classList.add('stealth-mode')
    } else {
      document.title = 'TruthWeaver - Trauma-Informed Platform'
      document.body.classList.remove('stealth-mode')
    }
  }

  const quickExit = () => {
    sessionStorage.clear()
    localStorage.clear()
    window.location.href = 'https://www.google.com/search?q=weather'
  }

  return (
    <main className={`min-h-screen ${isStealthMode ? 'bg-gray-100 text-gray-800' : 'bg-gradient-to-br from-slate-50 to-blue-50'} p-4 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto">
        {/* Stealth Header */}
        <header className={`flex justify-between items-center mb-8 p-4 ${isStealthMode ? 'bg-gray-200' : 'bg-white'} rounded-lg shadow-sm flex-wrap gap-4`}>
          <div>
            <h1 className={`text-2xl font-bold ${isStealthMode ? 'text-gray-800' : 'text-slate-800'}`}>
              {isStealthMode ? 'Online Dictionary' : 'TruthWeaver'}
            </h1>
            <p className={`text-sm ${isStealthMode ? 'text-gray-600' : 'text-slate-600'}`}>
              {isStealthMode ? 'Search and learn new words' : 'Your Safe Space for Healing'}
            </p>
          </div>

          <div className="flex items-center space-x-4 flex-wrap">
            {!isStealthMode && (
              <>
                <Link
                  href="/help"
                  className="px-3 py-2 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors text-sm"
                  title="Help & Resources"
                >
                  ❓ Help
                </Link>

                <button
                  onClick={toggleStealthMode}
                  className="px-3 py-2 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition-colors text-sm"
                  title="Toggle Stealth Mode"
                >
                  👁️ Stealth
                </button>
              </>
            )}

            <button
              onClick={quickExit}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors font-medium text-sm"
              title="Quick Exit (ESC)"
            >
              Exit
            </button>
          </div>
        </header>

        {!isStealthMode && (
          <>
            {/* Hero Section */}
            <section className="bg-white rounded-lg shadow-sm p-8 mb-8 text-center trauma-content">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-4xl font-bold text-slate-800 mb-4">
                  Your Story, Protected & Documented
                </h2>
                <p className="text-xl text-slate-600 mb-6">
                  A secure platform where your fragmented memories become a powerful narrative for justice and healing.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Link
                    href="/mosaic"
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
                  >
                    Start Secure Journey
                  </Link>
                  <button
                    onClick={() => setShowVideoModal(true)}
                    className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-lg"
                  >
                    How We Protect You
                  </button>
                </div>
              </div>
            </section>

            {/* Mosaic Input Preview */}
            <section className="bg-white rounded-lg shadow-sm p-6 mb-8 trauma-content">
              <h3 className="text-2xl font-semibold text-slate-800 mb-6 text-center">Memory Mosaic Preview</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg text-center hover:bg-slate-100 transition-colors">
                  <div className="text-4xl mb-2">📝</div>
                  <h4 className="font-medium text-slate-800">Text Fragment</h4>
                  <p className="text-sm text-slate-600">Write your thoughts securely</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg text-center hover:bg-slate-100 transition-colors">
                  <div className="text-4xl mb-2">🎤</div>
                  <h4 className="font-medium text-slate-800">Voice Note</h4>
                  <p className="text-sm text-slate-600">Record audio memories</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg text-center hover:bg-slate-100 transition-colors">
                  <div className="text-4xl mb-2">📸</div>
                  <h4 className="font-medium text-slate-800">Photo Evidence</h4>
                  <p className="text-sm text-slate-600">Upload images with metadata</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg text-center hover:bg-slate-100 transition-colors">
                  <div className="text-4xl mb-2">🎥</div>
                  <h4 className="font-medium text-slate-800">Video Clip</h4>
                  <p className="text-sm text-slate-600">Capture video fragments</p>
                </div>
              </div>
            </section>

            {/* Four Main Action Hubs */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 trauma-content">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🔐</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800">Digital Witness</h3>
                    <p className="text-slate-600">Securely upload and timestamp evidence with Blockchain hashes</p>
                  </div>
                </div>
                <Link href="/evidence" className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                  Upload Evidence
                </Link>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800">AI Legal Companion</h3>
                    <p className="text-slate-600">Chat with AI that structures your thoughts into a legal timeline</p>
                  </div>
                </div>
                <button className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                  Start Chat
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800">Legal Readiness Score</h3>
                    <p className="text-slate-600">Dashboard showing what's missing for a strong court case</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Medical Reports</span>
                    <span className="text-sm font-medium text-red-600">Pending</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Witness Statements</span>
                    <span className="text-sm font-medium text-yellow-600">Partial</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Timeline Complete</span>
                    <span className="text-sm font-medium text-green-600">Ready</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🛡️</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800">Safe Support</h3>
                    <p className="text-slate-600">Encrypted chat history and 24/7 crisis resource locator</p>
                  </div>
                </div>
                <Link href="/support" className="inline-block px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors">
                  Get Support
                </Link>
              </div>
            </section>

            {/* Trust Indicators */}
            <section className="bg-white rounded-lg shadow-sm p-6 mb-8 trauma-content">
              <h3 className="text-2xl font-semibold text-slate-800 mb-6 text-center">Why Trust TruthWeaver?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🔒</span>
                  </div>
                  <h4 className="text-lg font-semibold text-slate-800 mb-2">Zero-Knowledge Encryption</h4>
                  <p className="text-slate-600">Your data is encrypted end-to-end. We cannot access or view your memories - only you hold the keys.</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">⛓️</span>
                  </div>
                  <h4 className="text-lg font-semibold text-slate-800 mb-2">Chain of Custody</h4>
                  <p className="text-slate-600">Every piece of evidence is timestamped and hashed, creating an unbreakable chain for court admissibility.</p>
                </div>
              </div>
            </section>

            {/* Accessibility Footer */}
            <footer className="bg-slate-100 rounded-lg p-6 text-center trauma-content">
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-4">
                <button className="px-4 py-2 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition-colors">
                  High Contrast
                </button>
                <button className="px-4 py-2 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition-colors">
                  Large Text
                </button>
                <select className="px-4 py-2 bg-slate-200 text-slate-700 rounded">
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Spanish</option>
                </select>
              </div>
              <p className="text-slate-600">© 2024 TruthWeaver. All rights reserved. Your safety and privacy are our highest priorities.</p>
            </footer>
          </>
        )}

        {/* Stealth Mode Content - Looks like Online Dictionary */}
        {isStealthMode && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
              <h2 className="text-3xl font-normal text-gray-800 mb-6 text-center">Online Dictionary</h2>
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Search for a word..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="mt-4 px-6 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors">
                  Search
                </button>
              </div>
              <div className="text-center text-gray-600">
                <p className="text-lg mb-4">Welcome to our online dictionary</p>
                <p>Search for word definitions, synonyms, and usage examples.</p>
              </div>
            </div>
          </div>
        )}

        {/* Floating Safety Button */}
        {!isStealthMode && (
          <button
            onClick={quickExit}
            className="fixed bottom-6 left-6 w-12 h-12 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors flex items-center justify-center text-xl z-40"
            title="Quick Exit (ESC)"
          >
            🚪
          </button>
        )}
      </div>
    </main>
  )
}