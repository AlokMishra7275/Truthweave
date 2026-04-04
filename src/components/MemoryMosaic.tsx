'use client'

import { useState, useEffect } from 'react'

interface MemoryCard {
  id: string
  type: 'text' | 'image' | 'voice'
  content: string
  timestamp: Date
  moodTag: string
  intensity: number // 1-5 scale
  triggerWarning?: boolean
}

const MOODS = [
  { emoji: '😊', label: 'Calm', color: 'bg-green-100 text-green-800' },
  { emoji: '😐', label: 'Neutral', color: 'bg-gray-100 text-gray-800' },
  { emoji: '😢', label: 'Sad', color: 'bg-blue-100 text-blue-800' },
  { emoji: '😠', label: 'Angry', color: 'bg-red-100 text-red-800' },
  { emoji: '😨', label: 'Anxious', color: 'bg-yellow-100 text-yellow-800' },
  { emoji: '😰', label: 'Scared', color: 'bg-purple-100 text-purple-800' }
]

export default function MemoryMosaic() {
  const [cards, setCards] = useState<MemoryCard[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCardType, setNewCardType] = useState<'text' | 'image' | 'voice'>('text')
  const [newContent, setNewContent] = useState('')
  const [newMoodTag, setNewMoodTag] = useState('Neutral')
  const [newIntensity, setNewIntensity] = useState(3)
  const [triggerWarning, setTriggerWarning] = useState(false)
  const [isRecording, setIsRecording] = useState(false)

  // Auto-logout after 2 minutes of inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout

    const resetTimer = () => {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        // In a real app, this would log out the user
        alert('Session expired for security. Please log back in.')
      }, 120000) // 2 minutes
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(event => document.addEventListener(event, resetTimer))

    resetTimer()

    return () => {
      clearTimeout(timeout)
      events.forEach(event => document.removeEventListener(event, resetTimer))
    }
  }, [])

  const addCard = () => {
    if (!newContent.trim()) return

    const newCard: MemoryCard = {
      id: Date.now().toString(),
      type: newCardType,
      content: newContent,
      timestamp: new Date(),
      moodTag: newMoodTag,
      intensity: newIntensity,
      triggerWarning
    }

    setCards([newCard, ...cards]) // Add to beginning
    setNewContent('')
    setNewMoodTag('Neutral')
    setNewIntensity(3)
    setTriggerWarning(false)
    setShowAddForm(false)
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)
    // In a real app, this would start/stop voice recording
    if (!isRecording) {
      alert('Voice recording started. Speak your memory...')
    } else {
      alert('Voice recording stopped. Transcribing...')
      // Simulate transcription
      setTimeout(() => {
        setNewContent('This is a transcribed voice memory...')
      }, 2000)
    }
  }

  const getMoodInfo = (mood: string) => {
    return MOODS.find(m => m.label === mood) || MOODS[1]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Memory Mosaic</h1>
            <p className="text-slate-600">Add memories as fragments - no pressure to organize</p>
          </div>

          <button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 safe-button font-medium"
          >
            + Add Memory
          </button>
        </div>

        {/* Add Memory Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-slate-800">Add New Memory</h2>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              {/* Type Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                <div className="flex space-x-2">
                  {[
                    { type: 'text', label: 'Text', icon: '📝' },
                    { type: 'voice', label: 'Voice', icon: '🎤' },
                    { type: 'image', label: 'Image', icon: '📷' }
                  ].map(({ type, label, icon }) => (
                    <button
                      key={type}
                      onClick={() => setNewCardType(type as any)}
                      className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                        newCardType === type
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{icon}</div>
                      <div className="text-sm font-medium">{label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Content</label>
                {newCardType === 'text' && (
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Write your memory here... Take your time."
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}

                {newCardType === 'voice' && (
                  <div className="text-center">
                    <button
                      onClick={toggleRecording}
                      className={`w-16 h-16 rounded-full transition-colors ${
                        isRecording
                          ? 'bg-red-500 hover:bg-red-600'
                          : 'bg-blue-500 hover:bg-blue-600'
                      }`}
                    >
                      <span className="text-white text-2xl">
                        {isRecording ? '⏹️' : '🎤'}
                      </span>
                    </button>
                    <p className="text-sm text-slate-600 mt-2">
                      {isRecording ? 'Recording... Tap to stop' : 'Tap to start recording'}
                    </p>
                    {newContent && (
                      <div className="mt-3 p-3 bg-slate-50 rounded-md">
                        <p className="text-sm text-slate-700">{newContent}</p>
                      </div>
                    )}
                  </div>
                )}

                {newCardType === 'image' && (
                  <div className="text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setNewContent(`Image: ${file.name}`)
                        }
                      }}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="inline-block px-6 py-3 bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-200 transition-colors"
                    >
                      📷 Choose Image
                    </label>
                    {newContent && (
                      <p className="text-sm text-slate-600 mt-2">{newContent}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Mood Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">How did this make you feel?</label>
                <div className="grid grid-cols-3 gap-2">
                  {MOODS.map(({ emoji, label, color }) => (
                    <button
                      key={label}
                      onClick={() => setNewMoodTag(label)}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        newMoodTag === label
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{emoji}</div>
                      <div className="text-xs font-medium">{label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Intensity Scale */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Intensity: {newIntensity}/5
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={newIntensity}
                  onChange={(e) => setNewIntensity(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Mild</span>
                  <span>Moderate</span>
                  <span>Severe</span>
                </div>
              </div>

              {/* Trigger Warning */}
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={triggerWarning}
                    onChange={(e) => setTriggerWarning(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-slate-700">
                    This memory may be triggering for me later
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={addCard}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Memory
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Memory Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => {
            const moodInfo = getMoodInfo(card.moodTag)
            return (
              <div key={card.id} className="bg-white rounded-lg shadow-sm p-4 memory-card">
                {/* Trigger Warning */}
                {card.triggerWarning && (
                  <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-xs text-yellow-800 font-medium">
                      ⚠️ Content Warning: This memory may be triggering
                    </p>
                  </div>
                )}

                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{moodInfo.emoji}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${moodInfo.color}`}>
                      {card.moodTag}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">
                      {card.timestamp.toLocaleDateString()}
                    </div>
                    <div className="text-xs text-slate-400">
                      Intensity: {card.intensity}/5
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="mb-3">
                  {card.type === 'text' && (
                    <p className="text-slate-700 leading-relaxed">{card.content}</p>
                  )}
                  {card.type === 'voice' && (
                    <div className="bg-blue-50 p-3 rounded-md">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-blue-600">🎵</span>
                        <span className="text-sm font-medium text-blue-800">Voice Note</span>
                      </div>
                      <p className="text-blue-700 text-sm">{card.content}</p>
                    </div>
                  )}
                  {card.type === 'image' && (
                    <div className="bg-slate-100 h-24 rounded-md flex items-center justify-center">
                      <span className="text-slate-500">📷 {card.content}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-400 capitalize">{card.type}</span>
                  <div className="flex space-x-2">
                    <button className="text-xs text-blue-600 hover:text-blue-800">Edit</button>
                    <button className="text-xs text-red-600 hover:text-red-800">Delete</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {cards.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🌱</div>
            <h3 className="text-xl font-medium text-slate-700 mb-2">Your memory journey starts here</h3>
            <p className="text-slate-500 mb-6">Add memories as they come to mind. No pressure to organize.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 safe-button font-medium"
            >
              Add Your First Memory
            </button>
          </div>
        )}
      </div>
    </div>
  )
}