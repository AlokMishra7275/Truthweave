# Testing Guide for TruthView

## Prerequisites
- Node.js installed
- PostgreSQL database
- Internet for npm install

## Setup Steps
```bash
# 1. Install dependencies
npm install

# 2. Set up database
npx prisma generate
npx prisma db push

# 3. Configure environment
# Edit .env.local with your database URL and API keys

# 4. Start development server
npm run dev
```

## Feature Testing

### 1. Memory Mosaic (Non-Linear Journaling)
- Navigate to `http://localhost:3000/mosaic`
- Add memory cards with different types (text, image, voice)
- Test mood tags and timestamps
- Verify calming color scheme

### 2. Quick Exit & Stealth Mode
- Click red "Exit" button → should redirect to Google Weather
- Press ESC or Ctrl+Q → same redirect
- Click 👁️ button → UI changes to stealth mode (generic appearance)

### 3. AI Chronology Builder
- Use API endpoint: `POST /api/chronology`
- Send JSON with memory fragments
- Check response for chronological order and gaps

### 4. Evidence Integrity
- Upload file via `POST /api/evidence`
- Check database for SHA-256 hash and digital signature
- Verify integrity report generation

### 5. Legal Brief Generator
- Use `POST /api/legal-brief` with memory data
- Download PDF and verify content
- Check trauma-informed language

## Manual Testing Commands

```bash
# Test API endpoints with curl
curl -X POST http://localhost:3000/api/chronology \
  -H "Content-Type: application/json" \
  -d '{"fragments":[{"description":"First memory","date":"2024-01-01"}]}'

# Check evidence upload
curl -X GET http://localhost:3000/api/evidence
```

## Security Testing
- Verify session clearing on quick exit
- Test file hash integrity
- Check digital signature validation

## Performance Testing
- Load multiple memory cards
- Test PDF generation speed
- Verify database queries