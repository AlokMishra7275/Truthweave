import { Router } from 'express'
import { LegalBriefGenerator, type LegalBriefData } from '../lib/pdfGenerator'
import { prisma } from '../prisma'

const router = Router()

router.post('/', async (req, res) => {
  try {
    const body = req.body as LegalBriefData

    if (!body.evidenceRecords) {
      const evidenceRecords = await prisma.legalEvidence.findMany({
        orderBy: { uploadTimestamp: 'desc' },
        take: 10,
      })

      body.evidenceRecords = evidenceRecords.map((record) => ({
        fileName: record.fileName,
        fileHash: record.fileHash,
        uploadTimestamp: record.uploadTimestamp,
        digitalSignature: record.digitalSignature || undefined,
      }))
    }

    const pdfBuffer = await LegalBriefGenerator.generateLegalBrief(body)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'attachment; filename="incident-report.pdf"')

    return res.send(pdfBuffer)
  } catch (error) {
    console.error('Error generating legal brief:', error)
    return res.status(500).json({ error: 'Failed to generate legal brief' })
  }
})

export default router
