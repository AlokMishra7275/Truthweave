'use client'

import Link from 'next/link'
import Button from '@/components/Button'
import AuthModal from '@/components/AuthModal'
import HelpCenterChat from '@/components/HelpCenterChat'
import { useState } from 'react'
import { runQuickExit } from '@/lib/safety'
import { STORAGE_KEYS, loadJSON, saveJSON, type SurvivorMemoryEntry } from '@/lib/traumaPack'

export default function Home() {
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false)
  const [briefStatus, setBriefStatus] = useState('')
  const [isGeneratingPacket, setIsGeneratingPacket] = useState(false)
  const [packetStatus, setPacketStatus] = useState('')
  const [packetView, setPacketView] = useState<'lawyer' | 'counselor' | 'police'>('lawyer')
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')

  const LEGAL_BRIEF_DRAFT_KEY = 'truthweave_legal_brief_draft_v1'

  const handleGenerateSharePacket = async () => {
    if (isGeneratingPacket) return

    setIsGeneratingPacket(true)
    setPacketStatus('Preparing share packet...')

    try {
      const briefDraft = loadJSON<{ events?: Array<{ order: number; title: string; description: string; approxDate: string; confidence: 'High' | 'Medium' | 'Low'; confidenceScore: number }> }>(
        'truthweave_chronology_sequence_v1',
        { events: [] }
      )

      const memories = loadJSON<SurvivorMemoryEntry[]>(STORAGE_KEYS.sharePacket, [])

      const evidenceResponse = await fetch('/api/evidence')
      const evidence = evidenceResponse.ok ? await evidenceResponse.json() : []

      const response = await fetch('/api/share-packet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packetTitle: 'Institution Share Packet',
          packetView,
          survivorAlias: 'Survivor',
          memories,
          chronology: briefDraft.events || [],
          evidence: Array.isArray(evidence)
            ? evidence.map((item: any) => ({
                fileName: item.fileName,
                fileHash: item.fileHash,
                uploadTimestamp: item.uploadTimestamp,
                status: item.integrityVerified ? 'verified' : 'recorded',
              }))
            : [],
          supportNotes: [
            'Entries may include approximate recall windows and this is expected in trauma documentation.',
            'Use this packet to avoid repeated retelling across institutions.',
          ],
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        setPacketStatus(data.error || 'Could not generate share packet.')
        return
      }

      saveJSON(STORAGE_KEYS.sharePacket, memories)

      const textBlob = new Blob([data.plainText], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(textBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `share-packet-${packetView}-${Date.now()}.txt`
      link.click()
      URL.revokeObjectURL(url)

      setPacketStatus('Share packet downloaded successfully.')
    } catch {
      setPacketStatus('Unexpected error while generating share packet.')
    } finally {
      setIsGeneratingPacket(false)
    }
  }

  const openAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode)
    setIsAuthOpen(true)
  }

  const quickExit = () => {
    runQuickExit()
  }

  const handleGenerateBrief = async () => {
    if (isGeneratingBrief) return

    setIsGeneratingBrief(true)
    setBriefStatus('Generating legal brief...')

    try {
      const raw = localStorage.getItem(LEGAL_BRIEF_DRAFT_KEY)
      if (!raw) {
        setBriefStatus('No timeline draft found. Please generate and save timeline first.')
        return
      }

      const parsed = JSON.parse(raw) as {
        memoryFragments?: Array<{
          date?: string
          description: string
          metadata?: {
            location?: string
            people?: string[]
            emotions?: string[]
          }
        }>
        gaps?: string[]
      }

      const memoryFragments = Array.isArray(parsed.memoryFragments) ? parsed.memoryFragments : []
      const gaps = Array.isArray(parsed.gaps) ? parsed.gaps : []

      if (memoryFragments.length === 0) {
        setBriefStatus('Timeline is empty. Add AI chat or fragments, then save sequence first.')
        return
      }

      const firstDated = memoryFragments.find((item) => item.date)

      const response = await fetch('/api/legal-brief', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          survivorName: 'Survivor',
          incidentDate: firstDated?.date || undefined,
          memoryFragments,
          evidenceRecords: [],
          gaps,
        }),
      })

      if (!response.ok) {
        setBriefStatus('Could not generate brief right now. Please try again.')
        return
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `legal-brief-${Date.now()}.pdf`
      link.click()
      URL.revokeObjectURL(url)

      setBriefStatus('Legal brief downloaded successfully.')
    } catch {
      setBriefStatus('Unexpected error while generating brief. Please try again.')
    } finally {
      setIsGeneratingBrief(false)
    }
  }

  return (
    <main className="min-h-screen theme-surface p-4 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-0 p-4 bg-slate-900/70 border border-slate-700/60 backdrop-blur-md rounded-lg shadow-sm flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">TruthWeave</h1>
            <p className="text-sm text-slate-300">Your Safe Space for Healing</p>
          </div>

          <div className="flex items-center space-x-4 flex-wrap">
            <Link
              href="/evidence-vault"
              className="px-4 py-2 bg-slate-700 text-slate-100 rounded hover:bg-slate-600 transition-colors font-medium text-sm"
              title="Evidence Vault"
            >
              🔐 Evidence Vault
            </Link>

            <Button
              variant="soft"
              onClick={() => openAuth('signin')}
              title="Sign In"
            >
              Sign In
            </Button>

            <Button
              variant="primary"
              onClick={() => openAuth('signup')}
              title="Sign Up"
            >
              Sign Up
            </Button>

            <button
              onClick={quickExit}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors font-medium text-sm"
              title="Quick Exit (ESC)"
            >
              Exit
            </button>
          </div>
        </header>

        <>
            {/* Hero */}
            <section className="rounded-xl shadow-sm p-8 mb-8 trauma-content relative overflow-hidden">
              <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo-400/10 blur-3xl" />
              <div className="absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />

              <div className="relative max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <div>
                  <p className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-indigo-900/50 text-indigo-100 mb-4">
                    Private • Safe • Court-Ready
                  </p>
                  <h2 className="text-4xl md:text-5xl font-bold mb-4">
                    Turn painful fragments into a clear, protected truth.
                  </h2>
                  <p className="text-lg mb-6 leading-relaxed">
                    TruthWeave helps survivors capture memories gently, organize events reliably, and preserve evidence with legal integrity.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <Link
                      href="/mosaic"
                      className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-sky-600 text-white rounded-lg hover:from-indigo-500 hover:to-sky-500 transition-colors font-semibold text-lg text-center"
                    >
                      Memory Mosaic
                    </Link>
                    <button
                      onClick={() => setIsHelpOpen(true)}
                      className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-500 hover:to-blue-500 transition-colors font-semibold text-lg text-center border border-cyan-400/60"
                      title="AI Companion"
                    >
                      AI Companion
                    </button>
                    <button
                      onClick={() => setShowVideoModal(true)}
                      className="px-8 py-3 bg-slate-800 text-slate-100 rounded-lg hover:bg-slate-700 transition-colors font-semibold text-lg text-center border border-slate-600"
                    >
                      Learn How We Help
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-lg bg-slate-900/70 border border-slate-700 p-3">
                      <p className="text-xs uppercase tracking-wide">Memory Capture</p>
                      <p className="font-semibold">Non-linear and voice-friendly</p>
                    </div>
                    <div className="rounded-lg bg-slate-900/70 border border-slate-700 p-3">
                      <p className="text-xs uppercase tracking-wide">Evidence Safety</p>
                      <p className="font-semibold">Timestamped integrity trails</p>
                    </div>
                    <div className="rounded-lg bg-slate-900/70 border border-slate-700 p-3">
                      <p className="text-xs uppercase tracking-wide">Legal Readiness</p>
                      <p className="font-semibold">Structured timeline output</p>
                    </div>
                  </div>
                </div>

                <div className="relative h-80">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/15 via-sky-500/10 to-slate-200/5 border border-slate-600/60" />
                  <div className="absolute inset-8 rounded-xl border border-slate-500/40" />
                  <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-300/20 border border-sky-300/40 animate-pulse" />
                  <div className="absolute left-16 top-16 h-12 w-12 rounded-full bg-indigo-300/20 border border-indigo-300/40 animate-pulse" style={{ animationDelay: '0.3s' }} />
                  <div className="absolute right-16 top-20 h-14 w-14 rounded-full bg-blue-300/20 border border-blue-300/40 animate-pulse" style={{ animationDelay: '0.7s' }} />
                  <div className="absolute left-20 bottom-20 h-10 w-10 rounded-full bg-cyan-300/20 border border-cyan-300/40 animate-pulse" style={{ animationDelay: '0.5s' }} />
                  <div className="absolute right-20 bottom-16 h-12 w-12 rounded-full bg-slate-300/20 border border-slate-300/40 animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="absolute inset-x-16 top-1/2 h-px bg-gradient-to-r from-transparent via-sky-300/50 to-transparent" />
                  <div className="absolute inset-y-16 left-1/2 w-px bg-gradient-to-b from-transparent via-indigo-300/40 to-transparent" />
                </div>
              </div>
            </section>

            {/* Context + Capture */}
            <section className="rounded-xl shadow-sm p-8 mb-8 trauma-content">
              <h3 className="text-3xl font-bold mb-6 text-center">We Understand Your Reality</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
                <div className="rounded-lg border border-rose-500/30 bg-rose-900/20 p-5">
                  <h4 className="text-lg font-semibold mb-2">The Problem</h4>
                  <p className="text-sm">Trauma often appears fragmented, delayed, and inconsistent in recall, even though this is clinically normal.</p>
                </div>
                <div className="rounded-lg border border-amber-500/30 bg-amber-900/20 p-5">
                  <h4 className="text-lg font-semibold mb-2">The Burden</h4>
                  <p className="text-sm">Survivors repeat difficult memories across systems, causing exhaustion and documentation gaps.</p>
                </div>
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-900/20 p-5">
                  <h4 className="text-lg font-semibold mb-2">Our Approach</h4>
                  <p className="text-sm">Capture once, structure respectfully, and preserve integrity for legal and support pathways.</p>
                </div>
              </div>

              <h3 className="text-2xl font-semibold mb-6 text-center">Memory Mosaic: Capture Your Truth</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-blue-400/30 bg-blue-900/20">
                  <div className="text-4xl mb-2">📝</div>
                  <h4 className="font-semibold mb-1">Text Fragment</h4>
                  <p className="text-sm">Write moments as they appear, without forced sequence.</p>
                </div>
                <div className="p-4 rounded-xl border border-purple-400/30 bg-purple-900/20">
                  <div className="text-4xl mb-2">🎤</div>
                  <h4 className="font-semibold mb-1">Voice Note</h4>
                  <p className="text-sm">Record thoughts quickly with automatic transcription support.</p>
                </div>
                <div className="p-4 rounded-xl border border-cyan-400/30 bg-cyan-900/20">
                  <div className="text-4xl mb-2">📸</div>
                  <h4 className="font-semibold mb-1">Photo Evidence</h4>
                  <p className="text-sm">Upload and preserve visual details with metadata context.</p>
                </div>
                <div className="p-4 rounded-xl border border-pink-400/30 bg-pink-900/20">
                  <div className="text-4xl mb-2">🏷️</div>
                  <h4 className="font-semibold mb-1">Mood Tag</h4>
                  <p className="text-sm">Add emotional context and intensity for fuller understanding.</p>
                </div>
              </div>
            </section>

            {/* Workflow */}
            <section className="rounded-xl shadow-sm p-8 mb-8 trauma-content">
              <h3 className="text-2xl font-semibold mb-6 text-center">How It Works</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="rounded-lg p-4 border border-slate-600 bg-slate-900/50">
                  <p className="text-xs uppercase tracking-wide mb-2">Step 1</p>
                  <h4 className="font-semibold mb-1">Capture Safely</h4>
                  <p className="text-sm">Add fragments through text, voice, and media.</p>
                </div>
                <div className="rounded-lg p-4 border border-slate-600 bg-slate-900/50">
                  <p className="text-xs uppercase tracking-wide mb-2">Step 2</p>
                  <h4 className="font-semibold mb-1">Organize Clearly</h4>
                  <p className="text-sm">AI assists chronology without forcing memory order.</p>
                </div>
                <div className="rounded-lg p-4 border border-slate-600 bg-slate-900/50">
                  <p className="text-xs uppercase tracking-wide mb-2">Step 3</p>
                  <h4 className="font-semibold mb-1">Secure Evidence</h4>
                  <p className="text-sm">Apply custody tracking and integrity checks.</p>
                </div>
                <div className="rounded-lg p-4 border border-slate-600 bg-slate-900/50">
                  <p className="text-xs uppercase tracking-wide mb-2">Step 4</p>
                  <h4 className="font-semibold mb-1">Generate Brief</h4>
                  <p className="text-sm">Export structured, court-ready documentation.</p>
                </div>
              </div>
            </section>

            {/* Action Hubs + Trust */}
            <section className="rounded-xl shadow-sm p-8 mb-8 trauma-content">
              <h3 className="text-2xl font-semibold mb-6 text-center">Core Action Hub</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                <div className="rounded-xl border border-blue-400/30 bg-blue-900/20 p-6">
                  <h4 className="text-xl font-semibold mb-2">🔐 Chain of Custody</h4>
                  <p className="text-sm mb-4">Cryptographically sign evidence for legal admissibility.</p>
                    <Link href="/evidence-vault" className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors text-sm font-medium">
                    Open Evidence Vault
                  </Link>
                </div>
                <div className="rounded-xl border border-emerald-400/30 bg-emerald-900/20 p-6">
                  <h4 className="text-xl font-semibold mb-2">🤖 AI Chronology</h4>
                  <p className="text-sm mb-4">Detect sequence confidence, timeline conflicts, and clarification gaps before legal export.</p>
                  <Link href="/chronology" className="inline-block px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-500 transition-colors text-sm font-medium">
                    Build Timeline
                  </Link>
                </div>
                <div className="rounded-xl border border-violet-400/30 bg-violet-900/20 p-6">
                  <h4 className="text-xl font-semibold mb-2">📋 Legal Brief</h4>
                  <p className="text-sm mb-4">Generate a structured PDF brief from your verified timeline.</p>
                  <button
                    onClick={handleGenerateBrief}
                    disabled={isGeneratingBrief}
                    className="inline-block px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-500 transition-colors text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isGeneratingBrief ? 'Generating...' : 'Generate Brief'}
                  </button>
                  {briefStatus && <p className="mt-3 text-xs text-violet-100">{briefStatus}</p>}
                  <button
                    onClick={handleGenerateSharePacket}
                    disabled={isGeneratingPacket}
                    className="mt-3 inline-block px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 transition-colors text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isGeneratingPacket ? 'Building Packet...' : 'Download Share Packet'}
                  </button>
                  <div className="mt-2">
                    <label className="text-xs text-indigo-100 mr-2">Packet View:</label>
                    <select
                      value={packetView}
                      onChange={(e) => setPacketView(e.target.value as 'lawyer' | 'counselor' | 'police')}
                      className="px-2 py-1 rounded bg-slate-900 border border-indigo-300/30 text-xs text-indigo-100"
                    >
                      <option value="lawyer">Lawyer</option>
                      <option value="counselor">Counselor</option>
                      <option value="police">Police Intake</option>
                    </select>
                  </div>
                  {packetStatus && <p className="mt-2 text-xs text-indigo-100">{packetStatus}</p>}
                </div>
                <div className="rounded-xl border border-rose-400/30 bg-rose-900/20 p-6">
                  <h4 className="text-xl font-semibold mb-2">🚨 Safety Controls</h4>
                  <p className="text-sm mb-4">Stealth mode, quick exit, and privacy-first session controls.</p>
                  <Link href="/help" className="inline-block px-4 py-2 bg-rose-600 text-white rounded hover:bg-rose-500 transition-colors text-sm font-medium">
                    Learn Safety Features
                  </Link>
                </div>
              </div>

              <h3 className="text-2xl font-semibold mb-6 text-center">Why Trust TruthWeave?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="rounded-lg border border-slate-600 bg-slate-900/60 p-5">
                  <h4 className="text-lg font-semibold mb-2">🔒 Zero-Knowledge Encryption</h4>
                  <p className="text-sm">Only you hold access to your account context and memory records.</p>
                </div>
                <div className="rounded-lg border border-slate-600 bg-slate-900/60 p-5">
                  <h4 className="text-lg font-semibold mb-2">⛓️ Evidence Integrity</h4>
                  <p className="text-sm">Each evidence item is timestamped to maintain legal chain continuity.</p>
                </div>
                <div className="rounded-lg border border-slate-600 bg-slate-900/60 p-5">
                  <h4 className="text-lg font-semibold mb-2">🛡️ Survivor Safety First</h4>
                  <p className="text-sm">Quick exit and stealth controls are available at all times.</p>
                </div>
                <div className="rounded-lg border border-slate-600 bg-slate-900/60 p-5">
                  <h4 className="text-lg font-semibold mb-2">🤝 Trauma-Informed by Design</h4>
                  <p className="text-sm">Designed around emotional reality, not rigid form-filling.</p>
                </div>
              </div>
            </section>

            {/* Accessibility Footer */}
            <footer className="rounded-lg p-6 text-center trauma-content">
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-4">
                <button className="px-4 py-2 bg-slate-800 text-slate-100 rounded hover:bg-slate-700 transition-colors text-sm">
                  🔤 High Contrast
                </button>
                <button className="px-4 py-2 bg-slate-800 text-slate-100 rounded hover:bg-slate-700 transition-colors text-sm">
                  Aa Large Text
                </button>
                <select className="px-4 py-2 bg-slate-800 text-slate-100 rounded text-sm">
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Spanish</option>
                </select>
              </div>
              <p className="text-sm">© 2024 TruthWeave. All rights reserved. Your safety and privacy are our highest priorities.</p>
            </footer>

            {showVideoModal && (
              <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="w-full max-w-2xl rounded-xl border border-slate-600 bg-slate-900 p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <h3 className="text-xl font-semibold text-slate-100">How TruthWeave Helps</h3>
                    <button
                      onClick={() => setShowVideoModal(false)}
                      className="px-3 py-1 rounded bg-slate-800 text-slate-200 hover:bg-slate-700"
                    >
                      Close
                    </button>
                  </div>
                  <div className="rounded-lg border border-slate-700 bg-slate-950 p-4">
                    <p className="text-slate-300 mb-3">TruthWeave supports survivors through a three-part approach:</p>
                    <ul className="list-disc list-inside text-slate-300 space-y-2 text-sm">
                      <li>Capture difficult memories safely in small fragments.</li>
                      <li>Organize chronology with trauma-informed AI assistance.</li>
                      <li>Prepare trusted documentation for legal and support systems.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
        </>

        {/* Floating Safety Button */}
        <button
          onClick={quickExit}
          className="fixed bottom-6 left-6 w-12 h-12 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors flex items-center justify-center text-xl z-40"
          title="Quick Exit (ESC)"
        >
          🚪
        </button>
      </div>

      <AuthModal isOpen={isAuthOpen} mode={authMode} onClose={() => setIsAuthOpen(false)} />
      <HelpCenterChat isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </main>
  )
}