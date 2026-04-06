import crypto from 'crypto'

type OtpMethod = 'email' | 'mobile'

type OtpRecord = {
  codeHash: string
  expiresAt: number
  attempts: number
}

const OTP_TTL_MS = 5 * 60 * 1000
const MAX_ATTEMPTS = 5

const otpStore = new Map<string, OtpRecord>()

function buildKey(method: OtpMethod, target: string): string {
  return `${method}:${target}`
}

function hashOtp(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex')
}

function cleanupExpired(): void {
  const now = Date.now()
  for (const [key, value] of otpStore.entries()) {
    if (value.expiresAt <= now) {
      otpStore.delete(key)
    }
  }
}

export function generateOtp(): string {
  return `${Math.floor(100000 + Math.random() * 900000)}`
}

export function setOtp(method: OtpMethod, target: string, otp: string): void {
  cleanupExpired()
  const key = buildKey(method, target)
  otpStore.set(key, {
    codeHash: hashOtp(otp),
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
  })
}

export function verifyOtp(method: OtpMethod, target: string, otp: string): { ok: boolean; reason?: string } {
  cleanupExpired()
  const key = buildKey(method, target)
  const record = otpStore.get(key)

  if (!record) {
    return { ok: false, reason: 'OTP not found or expired. Please request a new OTP.' }
  }

  if (record.expiresAt <= Date.now()) {
    otpStore.delete(key)
    return { ok: false, reason: 'OTP expired. Please request a new OTP.' }
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(key)
    return { ok: false, reason: 'Too many attempts. Please request a new OTP.' }
  }

  const isMatch = hashOtp(otp) === record.codeHash
  if (!isMatch) {
    record.attempts += 1
    otpStore.set(key, record)
    return { ok: false, reason: 'Incorrect OTP. Please try again.' }
  }

  otpStore.delete(key)
  return { ok: true }
}
