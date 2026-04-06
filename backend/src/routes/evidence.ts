import { Router } from 'express'
import multer from 'multer'
import { EvidenceIntegrityManager, type EvidenceMetadata } from '../lib/crypto'
import { prisma } from '../prisma'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

router.post('/', upload.single('file'), async (req, res) => {
  try {
    const file = req.file
    const metadataStr = req.body?.metadata as string | undefined

    if (!file) {
      return res.status(400).json({ error: 'No file provided' })
    }

    let metadata: EvidenceMetadata
    try {
      metadata = JSON.parse(metadataStr || '{}')
      metadata.fileSize = file.size
      metadata.mimeType = file.mimetype
    } catch {
      metadata = {
        fileSize: file.size,
        mimeType: file.mimetype,
      }
    }

    const evidenceRecord = EvidenceIntegrityManager.createEvidenceRecord(file.originalname, file.buffer, metadata)

    const savedEvidence = await prisma.legalEvidence.create({
      data: {
        ...evidenceRecord,
        originalMetadata: JSON.stringify(metadata),
      },
    })

    const integrityReport = EvidenceIntegrityManager.generateIntegrityReport(
      evidenceRecord.fileHash,
      evidenceRecord.digitalSignature!,
      metadata,
      evidenceRecord.uploadTimestamp
    )

    return res.json({
      success: true,
      evidence: savedEvidence,
      integrityReport,
      message: 'Evidence uploaded and cryptographically signed for court admissibility',
    })
  } catch (error) {
    console.error('Error uploading evidence:', error)
    return res.status(500).json({ error: 'Failed to upload evidence' })
  }
})

router.get('/', async (_req, res) => {
  try {
    const evidence = await prisma.legalEvidence.findMany({
      orderBy: { uploadTimestamp: 'desc' },
    })

    return res.json(evidence)
  } catch (error) {
    console.error('Error fetching evidence:', error)
    return res.status(500).json({ error: 'Failed to fetch evidence' })
  }
})

export default router
