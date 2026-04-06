# TruthView - Complete Setup Guide (Option 1)

## Step-by-Step Setup Process

### Step 1: Install Dependencies
```bash
cd C:\Users\Aman Sharma\Desktop\TRUTHVIEW
npm install
```
**Expected Output:** Should show successful installation of all packages
**Time:** 2-5 minutes depending on internet speed
**Troubleshooting:** If fails, try `npm cache clean --force` then retry

### Step 2: Set Up PostgreSQL Database
```bash
# Install PostgreSQL if not already installed
# Download from: https://www.postgresql.org/download/windows/

# Create database
createdb truthview

# Or use pgAdmin to create database manually
```

### Step 3: Configure Environment Variables
Edit `.env.local` file:
```env
# Database Connection
DATABASE_URL="postgresql://username:password@localhost:5432/truthview"

# Security Key (Generate a random string)
EVIDENCE_SIGNATURE_KEY="your-super-secure-random-key-here-minimum-32-chars"

# AI API (Optional - Get from Anthropic)
ANTHROPIC_API_KEY="sk-ant-api03-..."
```

**How to generate secure key:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Initialize Database
```bash
# Generate Prisma client
npx prisma generate

# Create database tables
npx prisma db push
```
**Expected:** "The database schema was successfully created"

### Step 5: Start Development Server
```bash
npm run dev
```
**Expected Output:**
```
- Local:        http://localhost:3000
- Environments: .env.local
✓ Ready in 2.3s
```

## Testing Each Feature

### 1. Memory Mosaic Testing
1. Open `http://localhost:3000/mosaic`
2. Click "Add New Memory"
3. Test different card types:
   - Text: Write a memory fragment
   - Image: Upload a photo
   - Voice: (Placeholder - will show message)
4. Add mood tags (anxious, sad, hopeful, etc.)
5. Verify timestamps and color coding

### 2. Safety Features Testing
1. **Quick Exit:**
   - Click red "Exit" button → Should redirect to Google Weather
   - Press ESC key → Same redirect
   - Press Ctrl+Q → Same redirect

2. **Stealth Mode:**
   - Click 👁️ button → UI changes to generic appearance
   - Colors become gray, fonts change to Times New Roman

### 3. AI Chronology Testing
Use Postman or curl:
```bash
curl -X POST http://localhost:3000/api/chronology \
  -H "Content-Type: application/json" \
  -d '{
    "fragments": [
      {"description": "Woke up feeling scared", "date": "2024-01-01", "metadata": {"emotions": ["fear"]}},
      {"description": "Called friend for support", "date": "2024-01-02", "metadata": {"people": ["friend"]}},
      {"description": "Went to doctor", "date": "2024-01-03", "metadata": {"location": "clinic"}}
    ]
  }'
```
**Expected:** JSON response with chronological order and supportive gap analysis

### 4. Evidence Integrity Testing
```bash
# Create test file
echo "Test evidence content" > test.txt

# Upload via API (using curl with form data)
curl -X POST http://localhost:3000/api/evidence \
  -F "file=@test.txt" \
  -F 'metadata={"fileSize": 22, "mimeType": "text/plain"}'
```
**Expected:** Evidence record with SHA-256 hash and digital signature

### 5. Legal Brief Testing
```bash
curl -X POST http://localhost:3000/api/legal-brief \
  -H "Content-Type: application/json" \
  -d '{
    "survivorName": "Test Survivor",
    "memoryFragments": [
      {"description": "Incident occurred", "date": "2024-01-01"}
    ],
    "evidenceRecords": []
  }' \
  --output legal-brief.pdf
```
**Expected:** PDF file download with trauma-informed legal brief

## Database Verification
```bash
# Check evidence records
npx prisma studio
# Or query directly
psql -d truthview -c "SELECT * FROM legal_evidence;"
```

## Common Issues & Solutions

### Issue: "next command not found"
**Solution:** `npm install` didn't complete. Run again.

### Issue: "Can't connect to database"
**Solution:** Check DATABASE_URL in .env.local and ensure PostgreSQL is running.

### Issue: "Prisma client not generated"
**Solution:** Run `npx prisma generate`

### Issue: "API returns 500 error"
**Solution:** Check server logs in terminal, verify environment variables.

## Performance Testing
- Add 10+ memory cards
- Upload multiple evidence files
- Generate legal briefs with complex data
- Test concurrent API calls

## Security Verification
- Verify session clearing on quick exit
- Check file hashes match original files
- Test digital signature validation
- Confirm no sensitive data in logs

## Success Indicators
- ✅ Server starts without errors
- ✅ Database connects successfully
- ✅ All API endpoints return 200 status
- ✅ UI loads with calming colors
- ✅ Safety features work instantly
- ✅ Evidence integrity verified
- ✅ PDF generation works

Once all tests pass, the platform is ready for trauma-informed evidence collection! 🎉