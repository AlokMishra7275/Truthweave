import { NextRequest, NextResponse } from 'next/server'
import { verifyOtp } from '@/lib/otpStore'

type AuthMethod = 'email' | 'mobile'

type VerifyOtpPayload = {
  method: AuthMethod
  email?: string
  countryCode?: string
  phone?: string
  otp?: string
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function normalizePhone(countryCode: string, phone: string): string {
  const cleanCode = countryCode.trim()
  const cleanPhone = phone.replace(/\D/g, '')
  return `${cleanCode}${cleanPhone}`
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as VerifyOtpPayload

    if (!body?.method || !['email', 'mobile'].includes(body.method)) {
      return NextResponse.json({ error: 'Invalid authentication method.' }, { status: 400 })
    }

    if (!body.otp || !/^\d{6}$/.test(body.otp)) {
      return NextResponse.json({ error: 'OTP must be a 6-digit code.' }, { status: 400 })
    }

    if (body.method === 'email') {
      if (!body.email) {
        return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
      }
      const normalizedEmail = normalizeEmail(body.email)
      const result = verifyOtp('email', normalizedEmail, body.otp)
      if (!result.ok) {
        return NextResponse.json({ error: result.reason }, { status: 400 })
      }
      return NextResponse.json({ success: true, message: 'OTP verified successfully.' })
    }

    if (!body.phone || !body.countryCode) {
      return NextResponse.json({ error: 'Country code and mobile number are required.' }, { status: 400 })
    }

    const normalizedPhone = normalizePhone(body.countryCode, body.phone)
    const result = verifyOtp('mobile', normalizedPhone, body.otp)
    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'OTP verified successfully.' })
  } catch {
    return NextResponse.json({ error: 'Failed to verify OTP.' }, { status: 500 })
  }
}
