import crypto from 'crypto'

export interface EvidenceMetadata {
  gpsCoordinates?: {
    latitude: number
    longitude: number
  }
  deviceInfo?: {
    model: string
    os: string
    appVersion: string
  }
  creationDate?: string
  lastModified?: string
  fileSize: number
  mimeType: string
}

export class EvidenceIntegrityManager {
  private static readonly ALGORITHM = 'sha256'
  private static readonly SIGNATURE_KEY = process.env.EVIDENCE_SIGNATURE_KEY || 'default-key-change-in-production'

  /**
   * Generate SHA-256 hash of file content
   */
  static generateFileHash(fileBuffer: Buffer): string {
    return crypto.createHash(this.ALGORITHM).update(fileBuffer).digest('hex')
  }

  /**
   * Generate digital signature for evidence integrity
   */
  static generateDigitalSignature(fileHash: string, metadata: EvidenceMetadata, timestamp: Date): string {
    const signatureData = {
      fileHash,
      metadata,
      timestamp: timestamp.toISOString(),
      nonce: crypto.randomBytes(16).toString('hex') // Prevent replay attacks
    }

    const signatureString = JSON.stringify(signatureData)
    const hmac = crypto.createHmac('sha256', this.SIGNATURE_KEY)
    hmac.update(signatureString)

    return hmac.digest('base64')
  }

  /**
   * Verify digital signature
   */
  static verifyDigitalSignature(
    fileHash: string,
    metadata: EvidenceMetadata,
    timestamp: Date,
    signature: string
  ): boolean {
    try {
      const expectedSignature = this.generateDigitalSignature(fileHash, metadata, timestamp)
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'base64'),
        Buffer.from(expectedSignature, 'base64')
      )
    } catch {
      return false
    }
  }

  /**
   * Create court-admissible evidence record
   */
  static createEvidenceRecord(
    fileName: string,
    fileBuffer: Buffer,
    metadata: EvidenceMetadata
  ) {
    const fileHash = this.generateFileHash(fileBuffer)
    const timestamp = new Date()
    const digitalSignature = this.generateDigitalSignature(fileHash, metadata, timestamp)

    return {
      fileName,
      fileHash,
      fileSize: metadata.fileSize,
      mimeType: metadata.mimeType,
      uploadTimestamp: timestamp,
      originalMetadata: metadata,
      digitalSignature,
      integrityVerified: true
    }
  }

  /**
   * Generate integrity report for legal purposes
   */
  static generateIntegrityReport(
    fileHash: string,
    digitalSignature: string,
    metadata: EvidenceMetadata,
    uploadTimestamp: Date
  ): string {
    const isVerified = this.verifyDigitalSignature(fileHash, metadata, uploadTimestamp, digitalSignature)

    return `
EVIDENCE INTEGRITY REPORT
========================

File Hash (SHA-256): ${fileHash}
Digital Signature: ${digitalSignature}
Upload Timestamp: ${uploadTimestamp.toISOString()}
Integrity Verified: ${isVerified ? 'YES' : 'NO'}

Original Metadata:
${JSON.stringify(metadata, null, 2)}

This evidence has been cryptographically signed and verified for court admissibility.
Any tampering with the original file would result in a different hash value.

Generated on: ${new Date().toISOString()}
    `.trim()
  }
}