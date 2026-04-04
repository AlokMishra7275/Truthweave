// Simple test script for TruthView crypto functions
// Run with: node test-crypto.js

const { EvidenceIntegrityManager } = require('./src/lib/crypto')

// Test data
const testFileBuffer = Buffer.from('This is test evidence content')
const testMetadata = {
  fileSize: testFileBuffer.length,
  mimeType: 'text/plain',
  gpsCoordinates: { latitude: 40.7128, longitude: -74.0060 },
  deviceInfo: { model: 'Test Device', os: 'Test OS', appVersion: '1.0.0' },
  creationDate: new Date().toISOString()
}

console.log('🧪 Testing TruthView Crypto Functions\n')

// Test 1: File Hash Generation
console.log('1. File Hash Generation:')
const fileHash = EvidenceIntegrityManager.generateFileHash(testFileBuffer)
console.log('SHA-256 Hash:', fileHash)
console.log('Hash Length:', fileHash.length, '(should be 64 for SHA-256)\n')

// Test 2: Digital Signature
console.log('2. Digital Signature Generation:')
const timestamp = new Date()
const signature = EvidenceIntegrityManager.generateDigitalSignature(fileHash, testMetadata, timestamp)
console.log('Digital Signature:', signature.substring(0, 50) + '...\n')

// Test 3: Signature Verification
console.log('3. Signature Verification:')
const isValid = EvidenceIntegrityManager.verifyDigitalSignature(fileHash, testMetadata, timestamp, signature)
console.log('Signature Valid:', isValid ? '✅ YES' : '❌ NO')
console.log()

// Test 4: Evidence Record Creation
console.log('4. Evidence Record Creation:')
const evidenceRecord = EvidenceIntegrityManager.createEvidenceRecord('test.txt', testFileBuffer, testMetadata)
console.log('Evidence Record:', {
  fileName: evidenceRecord.fileName,
  fileHash: evidenceRecord.fileHash.substring(0, 20) + '...',
  integrityVerified: evidenceRecord.integrityVerified,
  hasSignature: !!evidenceRecord.digitalSignature
})
console.log()

// Test 5: Integrity Report
console.log('5. Integrity Report Generation:')
const report = EvidenceIntegrityManager.generateIntegrityReport(fileHash, signature, testMetadata, timestamp)
console.log('Report Preview:')
console.log(report.split('\n').slice(0, 5).join('\n'))
console.log('...\n')

console.log('🎉 All crypto tests completed!')
console.log('Note: For full testing, set up database and run npm run dev')