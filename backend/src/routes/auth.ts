import { Router } from 'express'
import nodemailer from 'nodemailer'
import twilio from 'twilio'
import { generateOtp, setOtp, verifyOtp } from '../lib/otpStore'

type AuthMethod = 'email' | 'mobile'

type SendOtpPayload = {
  method: AuthMethod
  email?: string
  countryCode?: string
  phone?: string
}

type VerifyOtpPayload = SendOtpPayload & {
  otp?: string
}

function isPlaceholder(value: string | undefined): boolean {
  if (!value) return true
  const v = value.toLowerCase()
  return v.includes('your-') || v.includes('xxxxxxxx') || v.includes('example')
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function normalizePhone(countryCode: string, phone: string): string {
  const cleanCode = countryCode.trim()
  const cleanPhone = phone.replace(/\D/g, '')
  return `${cleanCode}${cleanPhone}`
}

async function sendEmailOtp(toEmail: string, otp: string): Promise<void> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env

  if (
    !SMTP_HOST ||
    !SMTP_PORT ||
    !SMTP_USER ||
    !SMTP_PASS ||
    !SMTP_FROM ||
    isPlaceholder(SMTP_USER) ||
    isPlaceholder(SMTP_PASS) ||
    isPlaceholder(SMTP_FROM)
  ) {
    throw new Error('Email provider is not configured. Add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM in backend/.env and restart the server.')
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  })

  await transporter.sendMail({
    from: SMTP_FROM,
    to: toEmail,
    subject: 'TruthWeave OTP Verification',
    text: `Your TruthWeave OTP is ${otp}. It expires in 5 minutes.`,
    html: `<p>Your TruthWeave OTP is <strong>${otp}</strong>.</p><p>It expires in 5 minutes.</p>`,
  })
}

async function sendSmsOtp(toPhone: string, otp: string): Promise<void> {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER } = process.env

  if (
    !TWILIO_ACCOUNT_SID ||
    !TWILIO_AUTH_TOKEN ||
    !TWILIO_FROM_NUMBER ||
    isPlaceholder(TWILIO_ACCOUNT_SID) ||
    isPlaceholder(TWILIO_AUTH_TOKEN) ||
    isPlaceholder(TWILIO_FROM_NUMBER) ||
    !TWILIO_ACCOUNT_SID.startsWith('AC')
  ) {
    throw new Error('SMS provider is not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER in backend/.env and restart the server.')
  }

  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

  await client.messages.create({
    body: `Your TruthWeave OTP is ${otp}. It expires in 5 minutes.`,
    from: TWILIO_FROM_NUMBER,
    to: toPhone,
  })
}

const router = Router()

router.post('/send-otp', async (req, res) => {
  try {
    const body = req.body as SendOtpPayload

    if (!body?.method || !['email', 'mobile'].includes(body.method)) {
      return res.status(400).json({ error: 'Invalid authentication method.' })
    }

    const otp = generateOtp()

    if (body.method === 'email') {
      if (!body.email) {
        return res.status(400).json({ error: 'Email is required.' })
      }
      const normalizedEmail = normalizeEmail(body.email)
      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
      if (!isValidEmail) {
        return res.status(400).json({ error: 'Invalid email address.' })
      }

      await sendEmailOtp(normalizedEmail, otp)
      setOtp('email', normalizedEmail, otp)

      return res.json({ success: true, message: 'OTP sent to your email.' })
    }

    if (!body.phone || !body.countryCode) {
      return res.status(400).json({ error: 'Country code and mobile number are required.' })
    }

    const normalizedPhone = normalizePhone(body.countryCode, body.phone)
    const isValidPhone = /^\+\d{8,15}$/.test(normalizedPhone)
    if (!isValidPhone) {
      return res.status(400).json({ error: 'Invalid mobile number.' })
    }

    await sendSmsOtp(normalizedPhone, otp)
    setOtp('mobile', normalizedPhone, otp)

    return res.json({ success: true, message: 'OTP sent to your mobile number.' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send OTP.'
    return res.status(500).json({ error: message })
  }
})

router.post('/verify-otp', (req, res) => {
  try {
    const body = req.body as VerifyOtpPayload

    if (!body?.method || !['email', 'mobile'].includes(body.method)) {
      return res.status(400).json({ error: 'Invalid authentication method.' })
    }

    if (!body.otp || !/^\d{6}$/.test(body.otp)) {
      return res.status(400).json({ error: 'OTP must be a 6-digit code.' })
    }

    if (body.method === 'email') {
      if (!body.email) {
        return res.status(400).json({ error: 'Email is required.' })
      }
      const normalizedEmail = normalizeEmail(body.email)
      const result = verifyOtp('email', normalizedEmail, body.otp)
      if (!result.ok) {
        return res.status(400).json({ error: result.reason })
      }
      return res.json({ success: true, message: 'OTP verified successfully.' })
    }

    if (!body.phone || !body.countryCode) {
      return res.status(400).json({ error: 'Country code and mobile number are required.' })
    }

    const normalizedPhone = normalizePhone(body.countryCode, body.phone)
    const result = verifyOtp('mobile', normalizedPhone, body.otp)
    if (!result.ok) {
      return res.status(400).json({ error: result.reason })
    }

    return res.json({ success: true, message: 'OTP verified successfully.' })
  } catch {
    return res.status(500).json({ error: 'Failed to verify OTP.' })
  }
})

export default router
