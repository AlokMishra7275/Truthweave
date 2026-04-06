'use client'

import { useEffect, useMemo, useState } from 'react'
import Button from '@/components/Button'
import OTPInput from '@/components/OTPInput'
import { buildApiUrl } from '@/lib/api'

type AuthMethod = 'email' | 'mobile'
type AuthMode = 'signin' | 'signup'

type AuthModalProps = {
  isOpen: boolean
  mode: AuthMode
  onClose: () => void
}

const COUNTRY_CODES = ['+91', '+1', '+44', '+971', '+61']

export default function AuthModal({ isOpen, mode, onClose }: AuthModalProps) {
  const [method, setMethod] = useState<AuthMethod>('email')
  const [email, setEmail] = useState('')
  const [countryCode, setCountryCode] = useState('+91')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [entered, setEntered] = useState(false)

  const modeLabel = useMemo(() => (mode === 'signin' ? 'Sign In' : 'Sign Up'), [mode])

  useEffect(() => {
    if (!isOpen) return
    setEntered(false)
    setTimeout(() => setEntered(true), 10)

    setMethod('email')
    setEmail('')
    setCountryCode('+91')
    setPhone('')
    setOtp('')
    setOtpSent(false)
    setIsSending(false)
    setIsVerifying(false)
    setCountdown(0)
    setMessage('')
    setError('')
  }, [isOpen])

  useEffect(() => {
    if (countdown <= 0) return
    const id = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(id)
  }, [countdown])

  if (!isOpen) return null

  const validateInput = () => {
    setError('')
    if (method === 'email') {
      if (!email.trim()) {
        setError('Please enter your email.')
        return false
      }
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      if (!valid) {
        setError('Please enter a valid email address.')
        return false
      }
    } else {
      if (!phone.trim()) {
        setError('Please enter your mobile number.')
        return false
      }
      const valid = /^\d{8,14}$/.test(phone)
      if (!valid) {
        setError('Please enter a valid mobile number.')
        return false
      }
    }
    return true
  }

  const handleSendOtp = async () => {
    if (!validateInput()) return

    setIsSending(true)
    setMessage('')
    setError('')

    try {
      const payload =
        method === 'email'
          ? { method, email: email.trim() }
          : { method, countryCode, phone: phone.trim() }

      const response = await fetch(buildApiUrl('/api/auth/send-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = (await response.json()) as { message?: string; error?: string }
      if (!response.ok) {
        setError(data.error ?? 'Unable to send OTP right now.')
        return
      }

      setOtpSent(true)
      setCountdown(30)
      setMessage(data.message ?? 'OTP sent')
      setOtp('')
    } catch {
      setError('Network error while sending OTP. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  const handleVerify = async () => {
    setError('')
    if (otp.length !== 6) {
      setError('Please enter the 6-digit OTP.')
      return
    }

    setIsVerifying(true)
    try {
      const payload =
        method === 'email'
          ? { method, email: email.trim(), otp }
          : { method, countryCode, phone: phone.trim(), otp }

      const response = await fetch(buildApiUrl('/api/auth/verify-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = (await response.json()) as { message?: string; error?: string }
      if (!response.ok) {
        setError(data.error ?? 'OTP verification failed.')
        return
      }

      setIsVerifying(false)
      setMessage(data.message ?? `${modeLabel} successful. Redirecting...`)
      setTimeout(onClose, 600)
    } catch {
      setError('Network error while verifying OTP. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-md p-4 transition-opacity duration-200 ${
        entered ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md rounded-2xl border border-slate-500/50 bg-slate-900/95 p-6 shadow-2xl transition-all duration-200 ${
          entered ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-100">Continue Securely</h3>
            <p className="text-sm text-slate-300 mt-1">{modeLabel} to continue in a private, protected flow.</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full px-3 py-1 text-slate-300 hover:bg-slate-800"
            aria-label="Close authentication modal"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-800/70 p-1">
          <button
            onClick={() => {
              setMethod('email')
              setOtpSent(false)
              setOtp('')
              setMessage('')
              setError('')
            }}
            className={`rounded-lg px-3 py-2 text-sm transition ${
              method === 'email' ? 'bg-slate-700 text-slate-100' : 'text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            Email
          </button>
          <button
            onClick={() => {
              setMethod('mobile')
              setOtpSent(false)
              setOtp('')
              setMessage('')
              setError('')
            }}
            className={`rounded-lg px-3 py-2 text-sm transition ${
              method === 'mobile' ? 'bg-slate-700 text-slate-100' : 'text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            Mobile Number
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {!otpSent ? (
            <>
              {method === 'email' ? (
                <div>
                  <label className="mb-1 block text-sm text-slate-300">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-500/60 bg-slate-900/70 px-4 py-2.5 text-slate-100 outline-none focus:border-blue-400/60"
                  />
                </div>
              ) : (
                <div>
                  <label className="mb-1 block text-sm text-slate-300">Mobile Number</label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="rounded-xl border border-slate-500/60 bg-slate-900/70 px-3 py-2.5 text-slate-100 outline-none"
                    >
                      {COUNTRY_CODES.map((code) => (
                        <option key={code} value={code}>
                          {code}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter mobile number"
                      className="w-full rounded-xl border border-slate-500/60 bg-slate-900/70 px-4 py-2.5 text-slate-100 outline-none focus:border-blue-400/60"
                    />
                  </div>
                </div>
              )}

              <Button
                type="button"
                variant="primary"
                className="w-full rounded-xl"
                onClick={handleSendOtp}
                disabled={isSending}
              >
                {isSending ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-blue-100/30 border-t-blue-100 animate-spin" />
                    Sending OTP...
                  </span>
                ) : (
                  'Send OTP'
                )}
              </Button>
            </>
          ) : (
            <>
              <div>
                <p className="mb-3 text-center text-sm text-slate-300">Enter the 6-digit OTP</p>
                <OTPInput value={otp} onChange={setOtp} />
              </div>

              <Button
                type="button"
                variant="primary"
                className="w-full rounded-xl"
                onClick={handleVerify}
                disabled={isVerifying}
              >
                {isVerifying ? 'Verifying...' : 'Verify & Continue'}
              </Button>

              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-xs text-slate-400">Resend OTP in {countdown}s</p>
                ) : (
                  <button
                    onClick={handleSendOtp}
                    className="text-xs text-blue-300 hover:text-blue-200 transition"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </>
          )}

          {message && <p className="text-center text-sm text-emerald-300">{message}</p>}
          {error && <p className="text-center text-sm text-amber-300">{error}</p>}
        </div>
      </div>
    </div>
  )
}
