'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { STORAGE_KEYS, saveJSON, toSurvivorMemoryEntry, type RecallConfidence } from '@/lib/traumaPack'

interface MemoryCard {
  id: string
  type: 'text' | 'image' | 'voice'
  content: string
  audioUrl?: string
  imageUrl?: string
  timestamp: Date
  moodTag: string
  intensity: number // 1-5 scale
  recallConfidence: RecallConfidence
  timeWindow?: string
  location?: string
  people?: string
  eventType?: string
  triggerWarning?: boolean
}

const MEMORY_MOSAIC_STORAGE_KEY = STORAGE_KEYS.memoryMosaic

const MOODS = [
  { emoji: '😊', label: 'Calm', color: 'bg-emerald-900/40 text-emerald-200' },
  { emoji: '😐', label: 'Neutral', color: 'bg-slate-700/60 text-slate-200' },
  { emoji: '😢', label: 'Sad', color: 'bg-blue-900/40 text-blue-200' },
  { emoji: '😠', label: 'Angry', color: 'bg-rose-900/40 text-rose-200' },
  { emoji: '😨', label: 'Anxious', color: 'bg-amber-900/40 text-amber-200' },
  { emoji: '😰', label: 'Scared', color: 'bg-violet-900/40 text-violet-200' }
]

const EVENT_TYPES = ['Incident', 'Threat', 'Injury', 'Witness', 'Aftermath', 'Support', 'General']

export default function MemoryMosaic() {
  const [cards, setCards] = useState<MemoryCard[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCardId, setEditingCardId] = useState<string | null>(null)
  const [cardToDeleteId, setCardToDeleteId] = useState<string | null>(null)
  const [newCardType, setNewCardType] = useState<'text' | 'image' | 'voice'>('text')
  const [newContent, setNewContent] = useState('')
  const [newMoodTag, setNewMoodTag] = useState('Neutral')
  const [newIntensity, setNewIntensity] = useState(3)
  const [newRecallConfidence, setNewRecallConfidence] = useState<RecallConfidence>('approximate')
  const [newTimeWindow, setNewTimeWindow] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [newPeople, setNewPeople] = useState('')
  const [newEventType, setNewEventType] = useState('General')
  const [triggerWarning, setTriggerWarning] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [voicePreviewUrl, setVoicePreviewUrl] = useState('')
  const [imagePreviewUrl, setImagePreviewUrl] = useState('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const recognitionRef = useRef<any>(null)
  const audioUrlsRef = useRef<string[]>([])

  useEffect(() => {
    // Revoke all generated object URLs on unmount to avoid memory leaks
    return () => {
      audioUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
      audioUrlsRef.current = []
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  useEffect(() => {
    if (newCardType !== 'voice' && isRecording) {
      stopRecording()
    }
  }, [newCardType, isRecording])

  useEffect(() => {
    if (newCardType !== 'image' && imagePreviewUrl) {
      setImagePreviewUrl('')
    }
  }, [newCardType, imagePreviewUrl])

  const resetFormState = () => {
    setNewCardType('text')
    setNewContent('')
    setVoicePreviewUrl('')
    setImagePreviewUrl('')
    setNewMoodTag('Neutral')
    setNewIntensity(3)
    setNewRecallConfidence('approximate')
    setNewTimeWindow('')
    setNewLocation('')
    setNewPeople('')
    setNewEventType('General')
    setTriggerWarning(false)
    setIsRecording(false)
    setEditingCardId(null)
  }

  const closeForm = () => {
    setShowAddForm(false)
    resetFormState()
  }

  const openAddForm = () => {
    resetFormState()
    setShowAddForm(true)
  }

  const openEditForm = (card: MemoryCard) => {
    setEditingCardId(card.id)
    setNewCardType(card.type)
    setNewContent(card.content)
    setVoicePreviewUrl(card.audioUrl || '')
    setImagePreviewUrl(card.imageUrl || '')
    setNewMoodTag(card.moodTag)
    setNewIntensity(card.intensity)
    setNewRecallConfidence(card.recallConfidence || 'approximate')
    setNewTimeWindow(card.timeWindow || '')
    setNewLocation(card.location || '')
    setNewPeople(card.people || '')
    setNewEventType(card.eventType || 'General')
    setTriggerWarning(Boolean(card.triggerWarning))
    setShowAddForm(true)
  }

  const deleteCard = (cardId: string) => {
    setCards((prev) => prev.filter((card) => card.id !== cardId))
    setCardToDeleteId(null)
  }

  const saveCard = () => {
    const isEditing = Boolean(editingCardId)

    // Validation checks
    if (newCardType === 'voice' && !voicePreviewUrl) return
    if (newCardType === 'image' && !imagePreviewUrl) return
    if (newCardType !== 'voice' && !newContent.trim()) return

    const baseCard: MemoryCard = {
      id: editingCardId || Date.now().toString(),
      type: newCardType,
      content: newCardType === 'voice' ? (newContent.trim() || 'Voice memory recorded') : newContent,
      audioUrl: newCardType === 'voice' ? voicePreviewUrl : undefined,
      imageUrl: newCardType === 'image' ? imagePreviewUrl : undefined,
      timestamp: new Date(),
      moodTag: newMoodTag,
      intensity: newIntensity,
      recallConfidence: newRecallConfidence,
      timeWindow: newTimeWindow,
      location: newLocation,
      people: newPeople,
      eventType: newEventType,
      triggerWarning
    }

    if (isEditing && editingCardId) {
      setCards((prev) => prev.map((card) => (
        card.id === editingCardId
          ? {
              ...card,
              ...baseCard,
              timestamp: card.timestamp,
            }
          : card
      )))
    } else {
      setCards((prev) => [baseCard, ...prev])
    }

    closeForm()
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem(MEMORY_MOSAIC_STORAGE_KEY)
      if (!raw) return

      const parsed = JSON.parse(raw) as Array<Omit<MemoryCard, 'timestamp'> & { timestamp: string }>
      const restoredCards: MemoryCard[] = parsed.map((item) => ({
        ...item,
        timestamp: new Date(item.timestamp),
      }))

      setCards(restoredCards)
    } catch {
      // If parsing fails, ignore and start with empty list
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(MEMORY_MOSAIC_STORAGE_KEY, JSON.stringify(cards))
      const mapped = cards.map((card) => toSurvivorMemoryEntry({
        id: card.id,
        title: card.eventType ? `${card.eventType} memory` : 'Memory fragment',
        description: card.content,
        sourceType: card.type === 'image' ? 'image' : card.type === 'voice' ? 'voice' : 'text',
        createdAt: card.timestamp,
        location: card.location,
        people: card.people,
        timeWindow: card.timeWindow,
        eventType: card.eventType,
        recallConfidence: card.recallConfidence,
        emotionalState: card.moodTag,
        intensity: card.intensity,
        triggerWarning: card.triggerWarning,
      }))
      saveJSON(STORAGE_KEYS.sharePacket, mapped)
    } catch {
      // Ignore storage errors to avoid blocking user flow
    }
  }, [cards])

  const addCard = () => {
    if (newCardType === 'voice' && !voicePreviewUrl) return
    if (newCardType === 'image' && !imagePreviewUrl) return
    if (newCardType !== 'voice' && !newContent.trim()) return

    const newCard: MemoryCard = {
      id: Date.now().toString(),
      type: newCardType,
      content: newCardType === 'voice' ? (newContent.trim() || 'Voice memory recorded') : newContent,
      audioUrl: newCardType === 'voice' ? voicePreviewUrl : undefined,
      imageUrl: newCardType === 'image' ? imagePreviewUrl : undefined,
      timestamp: new Date(),
      moodTag: newMoodTag,
      intensity: newIntensity,
      triggerWarning
    }

    setCards([newCard, ...cards]) // Add to beginning
    setNewContent('')
    setVoicePreviewUrl('')
    setImagePreviewUrl('')
    setNewMoodTag('Neutral')
    setNewIntensity(3)
    setTriggerWarning(false)
    setIsRecording(false)
    setShowAddForm(false)
  }

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    setIsRecording(false)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []

      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
        if (audioBlob.size === 0) return

        const previewUrl = URL.createObjectURL(audioBlob)
        audioUrlsRef.current.push(previewUrl)
        setVoicePreviewUrl(previewUrl)
      }

      recorder.start()

      const SpeechRecognitionApi = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognitionApi) {
        const recognition = new SpeechRecognitionApi()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-US'
        recognitionRef.current = recognition

        recognition.onresult = (event: any) => {
          let transcript = ''
          for (let i = 0; i < event.results.length; i += 1) {
            transcript += event.results[i][0].transcript + ' '
          }
          setNewContent(transcript.trim())
        }

        recognition.start()
      }

      setIsRecording(true)
    } catch (error) {
      alert('Microphone access denied or unavailable. Please allow mic permission.')
      setIsRecording(false)
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
      return
    }
    startRecording()
  }

  const getMoodInfo = (mood: string) => {
    return MOODS.find(m => m.label === mood) || MOODS[1]
  }

  return (
    <div className="min-h-screen theme-surface p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Memory Mosaic</h1>
            <p className="text-slate-300">Add memories as fragments - no pressure to organize</p>
          </div>

          <button
            onClick={openAddForm}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 safe-button font-medium"
          >
            + Add Memory
          </button>
        </div>

        {/* Add Memory Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center mb-4 p-6 pb-0">
                <h2 className="text-xl font-semibold text-slate-100">Add New Memory</h2>
                <button
                  onClick={closeForm}
                  className="text-slate-400 hover:text-slate-200"
                >
                  ✕
                </button>
              </div>

              {editingCardId && (
                <div className="mb-3 mx-6 rounded-md border border-indigo-500/30 bg-indigo-900/20 px-3 py-2 text-xs text-indigo-200">
                  Editing existing memory card
                </div>
              )}

              <div className="overflow-y-auto flex-1 px-6">

              {/* Type Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-200 mb-2">Type</label>
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
                          ? 'border-blue-500 bg-blue-900/30 text-blue-100'
                          : 'border-slate-700 text-slate-200 hover:border-slate-500'
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
                <label className="block text-sm font-medium text-slate-200 mb-2">Content</label>
                {newCardType === 'text' && (
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Write your memory here... Take your time."
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-600 bg-slate-800 text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <p className="text-sm text-slate-300 mt-2">
                      {isRecording ? 'Recording... Tap to stop' : 'Tap to start recording'}
                    </p>
                    {voicePreviewUrl && (
                      <audio controls src={voicePreviewUrl} className="w-full mt-3" />
                    )}
                    {newContent && (
                      <div className="mt-3 p-3 bg-slate-800 rounded-md border border-slate-700">
                        <p className="text-sm text-slate-200">{newContent}</p>
                      </div>
                    )}
                  </div>
                )}

                {newCardType === 'image' && (
                  <div className="text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          try {
                            const dataUrl = await new Promise<string>((resolve, reject) => {
                              const reader = new FileReader()
                              reader.onload = () => resolve(String(reader.result || ''))
                              reader.onerror = () => reject(reader.error)
                              reader.readAsDataURL(file)
                            })

                            setImagePreviewUrl(dataUrl)
                            setNewContent(file.name)
                          } catch {
                            alert('Could not read image file. Please try another image.')
                          }
                        }
                      }}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="inline-block px-6 py-3 bg-slate-800 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors text-slate-100"
                    >
                      📷 Choose Image
                    </label>
                    {newContent && (
                      <p className="text-sm text-slate-300 mt-2">{newContent}</p>
                    )}
                    {imagePreviewUrl && (
                      <Image
                        src={imagePreviewUrl}
                        alt="Selected memory preview"
                        width={320}
                        height={160}
                        unoptimized
                        className="mt-3 mx-auto max-h-40 rounded-md border border-slate-700"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Mood Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-200 mb-2">How did this make you feel?</label>
                <div className="grid grid-cols-3 gap-2">
                  {MOODS.map(({ emoji, label, color }) => (
                    <button
                      key={label}
                      onClick={() => setNewMoodTag(label)}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        newMoodTag === label
                          ? 'border-blue-500 bg-blue-900/30 text-blue-100'
                          : 'border-slate-700 text-slate-200 hover:border-slate-500'
                      }`}
                    >
                      <div className="text-2xl mb-1">{emoji}</div>
                      <div className="text-xs font-medium">{label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-200 mb-2">Recall confidence</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: 'certain', label: 'Certain' },
                    { value: 'approximate', label: 'Approximate' },
                    { value: 'unsure', label: 'Unsure' }
                  ] as Array<{ value: RecallConfidence; label: string }>).map((item) => (
                    <button
                      key={item.value}
                      onClick={() => setNewRecallConfidence(item.value)}
                      className={`p-2 rounded-md border text-sm ${
                        newRecallConfidence === item.value
                          ? 'border-emerald-500 bg-emerald-900/30 text-emerald-100'
                          : 'border-slate-700 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <input
                  value={newTimeWindow}
                  onChange={(e) => setNewTimeWindow(e.target.value)}
                  placeholder="Approx time window (e.g., Late night, Week 2 Jan)"
                  className="w-full px-3 py-2 border border-slate-600 bg-slate-800 text-slate-100 rounded-md"
                />
                <input
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="Approx location"
                  className="w-full px-3 py-2 border border-slate-600 bg-slate-800 text-slate-100 rounded-md"
                />
                <input
                  value={newPeople}
                  onChange={(e) => setNewPeople(e.target.value)}
                  placeholder="People involved"
                  className="w-full px-3 py-2 border border-slate-600 bg-slate-800 text-slate-100 rounded-md"
                />
                <select
                  value={newEventType}
                  onChange={(e) => setNewEventType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-600 bg-slate-800 text-slate-100 rounded-md"
                >
                  {EVENT_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Intensity Scale */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-200 mb-2">
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
                <div className="flex justify-between text-xs text-slate-400 mt-1">
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
                  <span className="text-sm text-slate-300">
                    This memory may be triggering for me later
                  </span>
                </label>
              </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 border-t border-slate-700 p-6 pt-4">
                <button
                  onClick={closeForm}
                  className="flex-1 px-4 py-2 border border-slate-600 text-slate-200 rounded-md hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCard}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingCardId ? 'Update Memory' : 'Save Memory'}
                </button>
              </div>
            </div>
          </div>
        )}

        {cardToDeleteId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-w-sm w-full p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Delete Memory?</h3>
              <p className="text-sm text-slate-300 mb-5">
                This action will permanently remove the selected memory card.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setCardToDeleteId(null)}
                  className="flex-1 px-4 py-2 border border-slate-600 text-slate-200 rounded-md hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteCard(cardToDeleteId)}
                  className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-500"
                >
                  Delete
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
              <div key={card.id} className="bg-slate-900/80 border border-slate-700 rounded-lg shadow-sm p-4 memory-card">
                {/* Trigger Warning */}
                {card.triggerWarning && (
                  <div className="mb-3 p-2 bg-amber-900/30 border border-amber-700/50 rounded-md">
                    <p className="text-xs text-amber-200 font-medium">
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
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-200 border border-slate-600">
                      {card.recallConfidence}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">
                      {card.timestamp.toLocaleDateString()}
                    </div>
                    <div className="text-xs text-slate-300">
                      Intensity: {card.intensity}/5
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="mb-3">
                  {card.type === 'text' && (
                    <p className="text-slate-200 leading-relaxed">{card.content}</p>
                  )}
                  {card.type === 'voice' && (
                    <div className="bg-blue-900/30 border border-blue-700/50 p-3 rounded-md">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-blue-600">🎵</span>
                        <span className="text-sm font-medium text-blue-200">Voice Note</span>
                      </div>
                      {card.audioUrl && (
                        <audio controls src={card.audioUrl} className="w-full mb-2" />
                      )}
                      <p className="text-blue-200 text-sm">{card.content}</p>
                    </div>
                  )}
                  {card.type === 'image' && (
                    <div className="bg-slate-800 rounded-md border border-slate-700 p-2">
                      {card.imageUrl ? (
                        <Image
                          src={card.imageUrl}
                          alt={card.content || 'Saved memory image'}
                          width={600}
                          height={160}
                          unoptimized
                          className="w-full h-40 object-cover rounded"
                        />
                      ) : (
                        <div className="h-24 flex items-center justify-center">
                          <span className="text-slate-300">📷 {card.content}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {(card.timeWindow || card.location || card.people || card.eventType) && (
                  <div className="mb-3 rounded-md border border-slate-700 bg-slate-800/60 p-2 text-xs text-slate-300">
                    <p>Type: {card.eventType || 'General'}</p>
                    {card.timeWindow && <p>When: {card.timeWindow}</p>}
                    {card.location && <p>Where: {card.location}</p>}
                    {card.people && <p>Who: {card.people}</p>}
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                  <span className="text-xs text-slate-300 capitalize">{card.type}</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openEditForm(card)}
                      className="text-xs text-blue-300 hover:text-blue-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setCardToDeleteId(card.id)}
                      className="text-xs text-rose-300 hover:text-rose-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {cards.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🌱</div>
            <h3 className="text-xl font-medium text-slate-100 mb-2">Your memory journey starts here</h3>
            <p className="text-slate-300 mb-6">Add memories as they come to mind. No pressure to organize.</p>
            <button
              onClick={openAddForm}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 safe-button font-medium"
            >
              Add Your First Memory
            </button>
          </div>
        )}
      </div>
    </div>
  )
}