'use client'

import { useEffect, useRef } from 'react'

type OTPInputProps = {
  value: string
  onChange: (value: string) => void
  length?: number
}

export default function OTPInput({ value, onChange, length = 6 }: OTPInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    if (!value) {
      refs.current[0]?.focus()
    }
  }, [value])

  const handleChange = (index: number, input: string) => {
    const digit = input.replace(/\D/g, '').slice(-1)
    const next = value.split('')
    next[index] = digit
    const merged = next.join('').slice(0, length)
    onChange(merged)

    if (digit && index < length - 1) {
      refs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, key: string) => {
    if (key === 'Backspace' && !value[index] && index > 0) {
      refs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return
    onChange(pasted)
    refs.current[Math.min(pasted.length, length) - 1]?.focus()
  }

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el
          }}
          value={value[index] ?? ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e.key)}
          onPaste={handlePaste}
          inputMode="numeric"
          maxLength={1}
          className="h-11 w-10 sm:h-12 sm:w-11 rounded-lg border border-slate-500/60 bg-slate-900/70 text-center text-lg text-slate-100 outline-none focus:border-blue-400/70"
          aria-label={`OTP digit ${index + 1}`}
        />
      ))}
    </div>
  )
}
