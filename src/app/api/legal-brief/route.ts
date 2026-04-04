import { NextRequest, NextResponse } from 'next/server'
import { LegalBriefGenerator, type LegalBriefData } from '@/lib/pdfGenerator'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body: LegalBriefData = await request.json()

    // Fetch evidence records from database if not provided
    if (!body.evidenceRecords) {
      const evidenceRecords = await prisma.legalEvidence.findMany({
        orderBy: { uploadTimestamp: 'desc' },
        take: 10 // Limit to recent evidence
      })

      body.evidenceRecords = evidenceRecords.map(record => ({
        fileName: record.fileName,
        fileHash: record.fileHash,
        uploadTimestamp: record.uploadTimestamp,
        digitalSignature: record.digitalSignature || undefined
      }))
    }

    // Generate PDF
    const pdfBuffer = await LegalBriefGenerator.generateLegalBrief(body)

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="incident-report.pdf"'
      }
    })

  } catch (error) {
    console.error('Error generating legal brief:', error)
    return NextResponse.json(
      { error: 'Failed to generate legal brief' },
      { status: 500 }
    )
  }
}