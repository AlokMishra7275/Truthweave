// Quick setup verification script
// Run with: node verify-setup.js

const fs = require('fs')
const path = require('path')

console.log('🔍 TruthView Setup Verification\n')

const checks = [
  {
    name: 'Package.json exists',
    check: () => fs.existsSync('package.json'),
    required: true
  },
  {
    name: 'Node modules installed',
    check: () => fs.existsSync('node_modules'),
    required: true
  },
  {
    name: 'Next.js installed',
    check: () => fs.existsSync('node_modules/next'),
    required: true
  },
  {
    name: 'Prisma installed',
    check: () => fs.existsSync('node_modules/prisma'),
    required: true
  },
  {
    name: 'Environment file exists',
    check: () => fs.existsSync('.env.local'),
    required: true
  },
  {
    name: 'Source code exists',
    check: () => fs.existsSync('src'),
    required: true
  },
  {
    name: 'Database schema exists',
    check: () => fs.existsSync('prisma/schema.prisma'),
    required: true
  },
  {
    name: 'Memory Mosaic component',
    check: () => fs.existsSync('src/components/MemoryMosaic.tsx'),
    required: true
  },
  {
    name: 'API routes exist',
    check: () => fs.existsSync('src/app/api'),
    required: true
  },
  {
    name: 'Crypto utilities',
    check: () => fs.existsSync('src/lib/crypto.ts'),
    required: true
  }
]

let allPassed = true

checks.forEach(({ name, check, required }) => {
  const passed = check()
  const status = passed ? '✅' : '❌'
  const note = required && !passed ? ' (REQUIRED)' : ''

  console.log(`${status} ${name}${note}`)

  if (required && !passed) {
    allPassed = false
  }
})

console.log('\n' + '='.repeat(50))

if (allPassed) {
  console.log('🎉 Setup verification PASSED!')
  console.log('Ready to run: npm run dev')
} else {
  console.log('⚠️  Setup verification FAILED!')
  console.log('Complete the missing requirements above.')
}

console.log('\nNext steps:')
console.log('1. Ensure PostgreSQL is running')
console.log('2. Update DATABASE_URL in .env.local')
console.log('3. Run: npx prisma generate && npx prisma db push')
console.log('4. Run: npm run dev')
console.log('5. Open http://localhost:3000')