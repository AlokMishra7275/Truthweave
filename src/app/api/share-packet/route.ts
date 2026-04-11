import { NextRequest, NextResponse } from 'next/server'

interface SharePacketRequest {
  packetTitle?: string
  survivorAlias?: string
  packetView?: 'lawyer' | 'counselor' | 'police'
  memories: Array<{
    title: string
    description: string
    sourceType: string
    createdAt: string
    recallConfidence?: string
    location?: string
    people?: string
    timeWindow?: string
  }>
  chronology: Array<{
    order: number
    title: string
    description: string
    approxDate?: string
    confidence?: string
    confidenceScore?: number
  }>
  evidence: Array<{
    fileName: string
    fileHash?: string
    uploadTimestamp?: string
    status?: string
  }>
  supportNotes?: string[]
}

function buildPlainTextPacket(body: SharePacketRequest): string {
  const packetView = body.packetView || 'lawyer'
  const supportNotes = body.supportNotes && body.supportNotes.length > 0
    ? body.supportNotes
    : [
        'Fragmented recall is clinically normal after trauma.',
        'Approximate time windows are meaningful and valid documentation.',
        'This packet is informational and should be reviewed by legal counsel.',
      ]

  const viewHeadline = packetView === 'counselor'
    ? 'Counselor View: focus on wellbeing context and support continuity.'
    : packetView === 'police'
      ? 'Police Intake View: focus on event sequence and evidence references.'
      : 'Lawyer View: focus on legal chronology and consistency notes.'

  return [
    `SHARE PACKET: ${body.packetTitle || 'Trauma-Informed Documentation Packet'}`,
    `Packet View: ${packetView}`,
    `Survivor Alias: ${body.survivorAlias || 'Survivor'}`,
    `Generated At: ${new Date().toISOString()}`,
    viewHeadline,
    '',
    'SUMMARY',
    `- Memories: ${body.memories.length}`,
    `- Chronology Events: ${body.chronology.length}`,
    `- Evidence Items: ${body.evidence.length}`,
    '',
    'MEMORY FRAGMENTS',
    ...body.memories.map((memory, index) => [
      `${index + 1}. ${memory.title}`,
      `   Description: ${memory.description}`,
      `   Source: ${memory.sourceType}`,
      `   Confidence: ${memory.recallConfidence || 'approximate'}`,
      `   Time Window: ${memory.timeWindow || 'not specified'}`,
      `   Location: ${memory.location || 'not specified'}`,
      `   People: ${memory.people || 'not specified'}`,
    ].join('\n')),
    '',
    'CHRONOLOGY SNAPSHOT',
    ...body.chronology.map((event) => `${event.order}. ${event.title} | ${event.approxDate || 'date not fixed'} | ${event.confidence || 'Low'} (${event.confidenceScore || 0}%)`),
    '',
    'EVIDENCE INDEX',
    ...body.evidence.map((item, index) => `${index + 1}. ${item.fileName} | ${item.uploadTimestamp || 'time unavailable'} | ${item.status || 'recorded'}`),
    '',
    'SUPPORT NOTES',
    ...supportNotes.map((note, index) => `${index + 1}. ${note}`),
    '',
    'DISCLAIMER: This packet supports structured documentation and does not replace legal advice.',
  ].join('\n')
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SharePacketRequest

    if (!Array.isArray(body.memories) || !Array.isArray(body.chronology) || !Array.isArray(body.evidence)) {
      return NextResponse.json({ error: 'Invalid packet payload' }, { status: 400 })
    }

    const generatedAt = new Date().toISOString()
    const plainText = buildPlainTextPacket(body)

    return NextResponse.json({
      generatedAt,
      packet: {
        title: body.packetTitle || 'Trauma-Informed Documentation Packet',
        packetView: body.packetView || 'lawyer',
        survivorAlias: body.survivorAlias || 'Survivor',
        memories: body.memories,
        chronology: body.chronology,
        evidence: body.evidence,
        supportNotes: body.supportNotes || [],
      },
      plainText,
    })
  } catch (error) {
    console.error('Error generating share packet:', error)
    return NextResponse.json({ error: 'Failed to generate share packet' }, { status: 500 })
  }
}
