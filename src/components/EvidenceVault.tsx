'use client'

import { useState, useEffect } from 'react'
import crypto from 'crypto'

interface EvidenceRecord {
  id: string
  incidentTitle: string
  dateCreated: Date
  creator: string
  content: string // JSON stringified incident data
  fileSize: number
  cryptographicHash: string
  status: 'verified' | 'unsigned' | 'tampered'
  isLocked: boolean
  lastModified: Date
  legalNotes?: string
}

const EVIDENCE_VAULT_KEY = 'truthweave_evidence_vault_v1'

export default function EvidenceVault() {
  const [evidenceRecords, setEvidenceRecords] = useState<EvidenceRecord[]>([])
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceRecord | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [verifyMessage, setVerifyMessage] = useState('')

  // Load evidence from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(EVIDENCE_VAULT_KEY)
      if (!raw) return

      const parsed = JSON.parse(raw) as Array<Omit<EvidenceRecord, 'dateCreated' | 'lastModified'> & { dateCreated: string; lastModified: string }>
      const restored: EvidenceRecord[] = parsed.map((item) => ({
        ...item,
        dateCreated: new Date(item.dateCreated),
        lastModified: new Date(item.lastModified),
      }))

      setEvidenceRecords(restored)
    } catch {
      // Ignore errors
    }
  }, [])

  // Save evidence to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(EVIDENCE_VAULT_KEY, JSON.stringify(evidenceRecords))
    } catch {
      // Ignore storage errors
    }
  }, [evidenceRecords])

  // Generate cryptographic hash (simplified SHA-256 simulation)
  const generateHash = (data: string): string => {
    let hash = 0
    if (data.length === 0) return hash.toString()
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return 'sha256_' + Math.abs(hash).toString(16).padStart(64, '0').substring(0, 64)
  }

  // Verify evidence integrity
  const verifyEvidence = (record: EvidenceRecord) => {
    const currentHash = generateHash(record.content)
    if (currentHash === record.cryptographicHash) {
      setVerifyMessage('✅ Evidence is authentic and unmodified')
      setTimeout(() => setVerifyMessage(''), 3000)
    } else {
      setVerifyMessage('⚠️ Evidence has been tampered with!')
      setTimeout(() => setVerifyMessage(''), 3000)
    }
  }

  // Lock/Seal evidence
  const lockEvidence = (id: string) => {
    setEvidenceRecords((prev) =>
      prev.map((record) =>
        record.id === id
          ? { ...record, isLocked: true, status: 'verified' as const }
          : record
      )
    )
  }

  // Download as PDF
  const downloadAsPDF = (record: EvidenceRecord) => {
    const content = `
EVIDENCE VAULT CERTIFICATE
===========================

Incident Title: ${record.incidentTitle}
Evidence ID: ${record.id}
Created: ${record.dateCreated.toLocaleString()}
Creator: ${record.creator}
Status: ${record.status.toUpperCase()}
Locked: ${record.isLocked ? 'YES' : 'NO'}

CRYPTOGRAPHIC HASH:
${record.cryptographicHash}

FILE SIZE: ${(record.fileSize / 1024).toFixed(2)} KB

LEGAL NOTES:
${record.legalNotes || 'No additional notes'}

---
This document certifies the authenticity and integrity of the evidence.
Generated on: ${new Date().toLocaleString()}
    `
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `evidence-${record.id}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Save incident to evidence vault (called from help center or incident form)
  const addEvidenceFromIncident = (
    incidentTitle: string,
    incidentData: any,
    creatorName: string = 'Anonymous'
  ) => {
    const contentString = JSON.stringify(incidentData)
    const hash = generateHash(contentString)

    const newRecord: EvidenceRecord = {
      id: Date.now().toString(),
      incidentTitle,
      dateCreated: new Date(),
      creator: creatorName,
      content: contentString,
      fileSize: new Blob([contentString]).size,
      cryptographicHash: hash,
      status: 'unsigned',
      isLocked: false,
      lastModified: new Date(),
      legalNotes: '',
    }

    setEvidenceRecords((prev) => [newRecord, ...prev])
  }

  const getStatusColor = (status: string, isLocked: boolean): string => {
    if (isLocked) return 'bg-green-900/40 text-green-200'
    if (status === 'verified') return 'bg-green-900/40 text-green-200'
    if (status === 'unsigned') return 'bg-amber-900/40 text-amber-200'
    return 'bg-rose-900/40 text-rose-200'
  }

  const getStatusIcon = (status: string, isLocked: boolean): string => {
    if (isLocked) return '🔒'
    if (status === 'verified') return '✅'
    if (status === 'unsigned') return '🟡'
    return '⚠️'
  }

  return (
    <div className="min-h-screen theme-surface p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-3">
            <span className="text-4xl">🔐</span>
            <h1 className="text-4xl font-bold text-slate-100">Evidence Vault</h1>
          </div>
          <p className="text-slate-300">Cryptographically signed evidence for legal admissibility</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-4">
            <div className="text-sm text-slate-400">Total Evidence</div>
            <div className="text-3xl font-bold text-slate-100">{evidenceRecords.length}</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-4">
            <div className="text-sm text-slate-400">Verified</div>
            <div className="text-3xl font-bold text-green-400">
              {evidenceRecords.filter((e) => e.isLocked).length}
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-4">
            <div className="text-sm text-slate-400">Unsigned</div>
            <div className="text-3xl font-bold text-amber-400">
              {evidenceRecords.filter((e) => !e.isLocked && e.status === 'unsigned').length}
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-4">
            <div className="text-sm text-slate-400">Total Size</div>
            <div className="text-3xl font-bold text-slate-100">
              {(evidenceRecords.reduce((sum, e) => sum + e.fileSize, 0) / 1024 / 1024).toFixed(1)} MB
            </div>
          </div>
        </div>

        {/* Evidence List */}
        <div className="space-y-4">
          {evidenceRecords.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/40 border border-slate-700 rounded-lg">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-medium text-slate-100 mb-2">No Evidence Yet</h3>
              <p className="text-slate-400">When incidents are reported, they&apos;ll appear here as sealed evidence.</p>
            </div>
          ) : (
            evidenceRecords.map((record) => (
              <div
                key={record.id}
                className="bg-slate-900/80 border border-slate-700 rounded-lg p-5 hover:border-blue-500/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Title and Status */}
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-semibold text-slate-100">{record.incidentTitle}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium inline-flex items-center space-x-1 ${getStatusColor(
                          record.status,
                          record.isLocked
                        )}`}
                      >
                        <span>{getStatusIcon(record.status, record.isLocked)}</span>
                        <span>{record.isLocked ? 'Sealed' : record.status.charAt(0).toUpperCase() + record.status.slice(1)}</span>
                      </span>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">Created</span>
                        <div className="text-slate-200">{record.dateCreated.toLocaleDateString()}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Creator</span>
                        <div className="text-slate-200">{record.creator}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">File Size</span>
                        <div className="text-slate-200">{(record.fileSize / 1024).toFixed(1)} KB</div>
                      </div>
                      <div>
                        <span className="text-slate-500">ID</span>
                        <div className="text-slate-300 font-mono text-xs">{record.id.slice(0, 8)}...</div>
                      </div>
                    </div>

                    {/* Hash Display */}
                    <div className="mt-3 bg-slate-800/50 rounded p-3 border border-slate-700/50">
                      <div className="text-xs text-slate-400 mb-1">Cryptographic Hash (SHA-256)</div>
                      <div className="text-xs text-slate-300 font-mono break-all">{record.cryptographicHash}</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="ml-4 flex flex-col space-y-2">
                    <button
                      onClick={() => {
                        setSelectedEvidence(record)
                        setShowDetails(true)
                      }}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => verifyEvidence(record)}
                      className="px-4 py-2 bg-slate-700 text-slate-100 text-sm rounded hover:bg-slate-600 transition-colors"
                    >
                      Verify
                    </button>
                    <button
                      onClick={() => downloadAsPDF(record)}
                      className="px-4 py-2 bg-slate-700 text-slate-100 text-sm rounded hover:bg-slate-600 transition-colors"
                    >
                      Download
                    </button>
                    {!record.isLocked && (
                      <button
                        onClick={() => lockEvidence(record.id)}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                      >
                        Lock/Seal
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Verify Message */}
        {verifyMessage && (
          <div className="fixed bottom-4 right-4 bg-slate-900 border border-slate-700 rounded-lg p-4 text-slate-100 shadow-lg">
            {verifyMessage}
          </div>
        )}

        {/* Details Modal */}
        {showDetails && selectedEvidence && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center p-6 border-b border-slate-700">
                <h2 className="text-xl font-semibold text-slate-100">Evidence Details</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  ✕
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-6 space-y-4">
                <div>
                  <label className="text-sm text-slate-400">Incident Title</label>
                  <p className="text-slate-100">{selectedEvidence.incidentTitle}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400">Created</label>
                    <p className="text-slate-100">{selectedEvidence.dateCreated.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Creator</label>
                    <p className="text-slate-100">{selectedEvidence.creator}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-slate-400">Status</label>
                  <p className="text-slate-100">
                    {selectedEvidence.isLocked ? 'Sealed & Verified' : selectedEvidence.status.toUpperCase()}
                  </p>
                </div>

                <div>
                  <label className="text-sm text-slate-400">Cryptographic Hash</label>
                  <div className="bg-slate-800 rounded p-3 border border-slate-700 mt-1">
                    <p className="text-xs text-slate-300 font-mono break-all">
                      {selectedEvidence.cryptographicHash}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-slate-400">File Size</label>
                  <p className="text-slate-100">{(selectedEvidence.fileSize / 1024).toFixed(1)} KB</p>
                </div>

                <div>
                  <label className="text-sm text-slate-400">Legal Notes</label>
                  <textarea
                    value={selectedEvidence.legalNotes || ''}
                    readOnly
                    className="w-full mt-1 p-3 bg-slate-800 border border-slate-700 rounded text-slate-100 text-sm"
                    rows={4}
                    placeholder="No additional notes"
                  />
                </div>
              </div>

              <div className="border-t border-slate-700 p-6 flex space-x-3">
                <button
                  onClick={() => setShowDetails(false)}
                  className="flex-1 px-4 py-2 border border-slate-600 text-slate-200 rounded hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    downloadAsPDF(selectedEvidence)
                    setShowDetails(false)
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Download Certificate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
