'use client'

import { useEffect } from 'react'

export default function SafetyControls() {
  useEffect(() => {
    const handleQuickEscape = () => {
      // Clear all session storage
      sessionStorage.clear()
      localStorage.clear()

      // Redirect to neutral site
      window.location.href = 'https://www.google.com/search?q=weather'
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // ESC key or Ctrl+Q for quick escape
      if (event.key === 'Escape' || (event.ctrlKey && event.key === 'q')) {
        event.preventDefault()
        handleQuickEscape()
      }
    }

    // Add global key listener
    document.addEventListener('keydown', handleKeyDown)

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return null // This component only handles side effects
}