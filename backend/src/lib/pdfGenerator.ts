import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'

export interface MemoryFragment {
  date?: string
  description: string
  metadata?: {
    location?: string
    people?: string[]
    emotions?: string[]
  }
}

export interface EvidenceRecord {
  fileName: string
  fileHash: string
  uploadTimestamp: Date
  digitalSignature?: string
}

export interface LegalBriefData {
  survivorName?: string
  incidentDate?: string
  memoryFragments: MemoryFragment[]
  evidenceRecords: EvidenceRecord[]
  gaps: string[]
}

export class LegalBriefGenerator {
  private static readonly COVER_LETTER = `
NEUROBIOLOGY OF TRAUMA AND MEMORY

Your Honor,

This incident report is submitted with an understanding of how trauma affects memory and recall. Research in neurobiology shows that traumatic experiences can fragment memories, making linear recall challenging. The brain's stress response during trauma can impair the hippocampus, affecting the formation and retrieval of chronological memories.

This report presents information as it was recalled by the survivor, organized chronologically where possible. Gaps in the timeline do not indicate fabrication but reflect the natural fragmentation that occurs with traumatic memories. All evidence has been cryptographically signed to ensure integrity and admissibility.

The survivor's safety and healing journey are paramount. This documentation serves both legal and therapeutic purposes.

Respectfully submitted,
TruthView Platform
  `.trim()

  static async generateLegalBrief(data: LegalBriefData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: 'Incident Report - TruthView',
          Author: 'TruthView Platform',
          Subject: 'Legal Documentation with Trauma-Informed Approach'
        }
      })

      const buffers: Buffer[] = []

      doc.on('data', buffers.push.bind(buffers))
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers)
        resolve(pdfBuffer)
      })
      doc.on('error', reject)

      // Title Page
      this.addTitlePage(doc, data)

      // Cover Letter
      doc.addPage()
      this.addCoverLetter(doc)

      // Chronological Timeline
      doc.addPage()
      this.addTimeline(doc, data)

      // Evidence Documentation
      doc.addPage()
      this.addEvidenceSection(doc, data)

      // Gaps and Limitations
      if (data.gaps.length > 0) {
        doc.addPage()
        this.addGapsSection(doc, data)
      }

      // Footer on all pages
      this.addFooter(doc)

      doc.end()
    })
  }

  private static addTitlePage(doc: PDFKit.PDFDocument, data: LegalBriefData) {
    doc.fontSize(24).text('INCIDENT REPORT', { align: 'center' })
    doc.moveDown(2)

    doc.fontSize(18).text('TruthView Platform', { align: 'center' })
    doc.moveDown(2)

    doc.fontSize(12)
    if (data.survivorName) {
      doc.text(`Survivor: ${data.survivorName}`)
      doc.moveDown()
    }
    if (data.incidentDate) {
      doc.text(`Incident Date: ${data.incidentDate}`)
      doc.moveDown()
    }
    doc.text(`Report Generated: ${new Date().toLocaleDateString()}`)
    doc.moveDown(2)

    doc
      .fontSize(10)
      .fillColor('red')
      .text('This document contains sensitive information. Handle with care and confidentiality.', {
        align: 'center'
      })
      .fillColor('black')
  }

  private static addCoverLetter(doc: PDFKit.PDFDocument) {
    doc.fontSize(16).text('COVER LETTER', { underline: true })
    doc.moveDown()

    doc.fontSize(11).text(this.COVER_LETTER, {
      lineGap: 5,
      align: 'justify'
    })
  }

  private static addTimeline(doc: PDFKit.PDFDocument, data: LegalBriefData) {
    doc.fontSize(16).text('CHRONOLOGICAL TIMELINE', { underline: true })
    doc.moveDown()

    doc.fontSize(10).text(
      'The following timeline represents the survivor\'s recollection, organized chronologically where dates are available.',
      { lineGap: 3 }
    )
    doc.moveDown()

    data.memoryFragments
      .sort((a, b) => {
        if (a.date && b.date) {
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        }
        return 0
      })
      .forEach((fragment, index) => {
        const dateStr = fragment.date ? fragment.date : `Fragment ${index + 1}`
        doc.font('Helvetica-Bold').fontSize(12).text(dateStr)
        doc.font('Helvetica')
        doc.moveDown(0.5)

        doc.fontSize(10).text(fragment.description)
        doc.moveDown(0.5)

        if (fragment.metadata) {
          const metadataParts = []
          if (fragment.metadata.location) metadataParts.push(`Location: ${fragment.metadata.location}`)
          if (fragment.metadata.people?.length) metadataParts.push(`People: ${fragment.metadata.people.join(', ')}`)
          if (fragment.metadata.emotions?.length) metadataParts.push(`Emotions: ${fragment.metadata.emotions.join(', ')}`)

          if (metadataParts.length > 0) {
            doc.fontSize(9).fillColor('gray').text(`(${metadataParts.join(' | ')})`)
            doc.fillColor('black')
            doc.moveDown()
          }
        }

        doc.moveDown()
      })
  }

  private static addEvidenceSection(doc: PDFKit.PDFDocument, data: LegalBriefData) {
    doc.fontSize(16).text('EVIDENCE DOCUMENTATION', { underline: true })
    doc.moveDown()

    doc.fontSize(10).text(
      'All evidence has been cryptographically hashed and signed to ensure integrity and prevent tampering.',
      { lineGap: 3 }
    )
    doc.moveDown()

    data.evidenceRecords.forEach((evidence, index) => {
      doc.font('Helvetica-Bold').fontSize(12).text(`Evidence ${index + 1}: ${evidence.fileName}`)
      doc.font('Helvetica')
      doc.moveDown(0.5)

      doc.fontSize(9)
      doc.text(`SHA-256 Hash: ${evidence.fileHash}`)
      doc.text(`Upload Timestamp: ${evidence.uploadTimestamp.toLocaleString()}`)
      if (evidence.digitalSignature) {
        doc.text(`Digital Signature: ${evidence.digitalSignature.substring(0, 50)}...`)
      }
      doc.moveDown()
    })
  }

  private static addGapsSection(doc: PDFKit.PDFDocument, data: LegalBriefData) {
    doc.fontSize(16).text('MEMORY GAPS AND LIMITATIONS', { underline: true })
    doc.moveDown()

    doc.fontSize(10).text(
      'The following gaps were identified in the survivor\'s recollection. These are normal in trauma cases and do not indicate fabrication.',
      { lineGap: 3 }
    )
    doc.moveDown()

    data.gaps.forEach((gap, index) => {
      doc.fontSize(10).text(`${index + 1}. ${gap}`, { lineGap: 3 })
      doc.moveDown()
    })
  }

  private static addFooter(doc: PDFKit.PDFDocument) {
    const pageCount = doc.bufferedPageRange().count

    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i)

      doc.fontSize(8)
        .fillColor('gray')
        .text(
          'This document was generated by TruthView - A trauma-informed evidence platform',
          50,
          doc.page.height - 50,
          { align: 'center' }
        )
        .text(
          `Page ${i + 1} of ${pageCount}`,
          50,
          doc.page.height - 30,
          { align: 'center' }
        )
        .fillColor('black')
    }
  }
}