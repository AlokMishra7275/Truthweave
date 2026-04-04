import { NextRequest, NextResponse } from 'next/server'
import { EvidenceIntegrityManager, type EvidenceMetadata } from '@/lib/crypto'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const metadataStr = formData.get('metadata') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Parse metadata
    let metadata: EvidenceMetadata
    try {
      metadata = JSON.parse(metadataStr || '{}')
      metadata.fileSize = file.size
      metadata.mimeType = file.type
    } catch {
      metadata = {
        fileSize: file.size,
        mimeType: file.type
      }
    }

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    // Create evidence record with integrity
    const evidenceRecord = EvidenceIntegrityManager.createEvidenceRecord(
      file.name,
      fileBuffer,
      metadata
    )

    // Save to database
    const savedEvidence = await prisma.legalEvidence.create({
      data: {
        ...evidenceRecord,
        originalMetadata: JSON.stringify(metadata) // Convert to string for SQLite
      }
    })

    // Generate integrity report
    const integrityReport = EvidenceIntegrityManager.generateIntegrityReport(
      evidenceRecord.fileHash,
      evidenceRecord.digitalSignature!,
      metadata,
      evidenceRecord.uploadTimestamp
    )

    return NextResponse.json({
      success: true,
      evidence: savedEvidence,
      integrityReport,
      message: 'Evidence uploaded and cryptographically signed for court admissibility'
    })

  } catch (error) {
    console.error('Error uploading evidence:', error)
    return NextResponse.json(
      { error: 'Failed to upload evidence' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const evidence = await prisma.legalEvidence.findMany({
      orderBy: { uploadTimestamp: 'desc' }
    })

    return NextResponse.json(evidence)
  } catch (error) {
    console.error('Error fetching evidence:', error)
    return NextResponse.json(
      { error: 'Failed to fetch evidence' },
      { status: 500 }
    )
  }
}