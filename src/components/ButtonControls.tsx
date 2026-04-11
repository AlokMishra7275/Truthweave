'use client'

import { runQuickExit } from '@/lib/safety'

export default function ButtonControls() {
  return (
    <>
      {/* Quick Exit Button */}
      <button
        onClick={() => {
          runQuickExit()
        }}
        className="fixed top-4 right-4 z-50 bg-red-500 text-white px-4 py-2 rounded shadow-lg hover:bg-red-600 transition-colors"
        title="Quick Exit (ESC or Ctrl+Q)"
      >
        Exit
      </button>

      {/* Stealth Mode Toggle */}
      <button
        onClick={() => {
          const body = document.body
          if (body.classList.contains('stealth-mode')) {
            body.classList.remove('stealth-mode')
          } else {
            body.classList.add('stealth-mode')
          }
        }}
        className="fixed top-4 left-4 z-50 bg-gray-500 text-white px-4 py-2 rounded shadow-lg hover:bg-gray-600 transition-colors"
        title="Toggle Stealth Mode"
      >
        👁️
      </button>
    </>
  )
}