# Deployment Readiness Checklist

## ✅ COMPLETED
- [x] Fixed merge conflict in `frontend/package.json`
- [x] Consolidated Next.js version to 14.2.3

---

## ⚠️ REQUIRED BEFORE DEPLOYMENT

### 1. **Environment Variables Setup**

#### Backend (.env in `backend/` folder)
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/truthview"

# Or use SQLite (for development only):
# DATABASE_URL="file:./dev.db"

# Security
EVIDENCE_SIGNATURE_KEY="<generate-32-char-random-key>"

# Email (Nodemailer - for OTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@your-domain.com"

# SMS (Twilio - optional, for OTP)
TWILIO_ACCOUNT_SID="your-twilio-sid"
TWILIO_AUTH_TOKEN="your-twilio-token"
TWILIO_PHONE_NUMBER="+1234567890"

# AI (Optional - for chronology feature)
ANTHROPIC_API_KEY="sk-ant-..."

# Server
NODE_ENV="production"
PORT=4000
```

#### Frontend (.env.local in `frontend/` folder)
```env
# API Connection
NEXT_PUBLIC_API_BASE_URL="https://your-backend-domain.onrender.com"

# Or for local development:
# NEXT_PUBLIC_API_BASE_URL="http://localhost:4000"
```

#### Root (.env.local in project root - if using monorepo)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/truthview"
EVIDENCE_SIGNATURE_KEY="<generate-32-char-random-key>"
ANTHROPIC_API_KEY="sk-ant-..."
```

**🔑 Generate Security Key:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### 2. **Database Setup**

#### Option A: PostgreSQL (Recommended for Production)
```bash
# Install PostgreSQL for your OS
# Windows: https://www.postgresql.org/download/windows/
# macOS: brew install postgresql
# Linux: sudo apt-get install postgresql

# Create database
createdb truthview

# Update schema.prisma provider:
# Change: provider = "sqlite"
# To: provider = "postgresql"

# Push schema
cd backend
npx prisma generate
npx prisma db push
```

#### Option B: SQLite (Development Only)
```bash
cd backend
npx prisma generate
npx prisma db push
```
- Database file: `backend/dev.db`
- ⚠️ **NOT suitable for production**

---

### 3. **Local Testing (Before Deploying)**

#### Step 1: Install Dependencies
```bash
# Root
npm install

# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

#### Step 2: Test Backend Build
```bash
cd backend
npm run build
# Check for compilation errors
```

#### Step 3: Test Frontend Build
```bash
cd frontend
npm run build
# Check for build errors and TypeScript issues
```

#### Step 4: Run Development Servers
```bash
# Terminal 1: Backend
cd backend
npm run dev
# Should show: Server running on http://localhost:4000

# Terminal 2: Frontend
cd frontend
npm run dev
# Should show: Ready on http://localhost:3000
```

#### Step 5: Test Features
1. **Auth OTP** - Send OTP and verify
2. **Memory Mosaic** - Add fragments
3. **AI Chronology** - Generate timeline
4. **Legal Brief** - Download PDF
5. **Panic Mode** - Test ESC key redirect
6. **Stealth Mode** - Toggle UI

---

### 4. **Choose Deployment Strategy**

#### Option A: Separate Deployment (Recommended)
- **Frontend**: Vercel (automatic deploys from GitHub)
- **Backend**: Render.com or Railway or Fly.io

#### Option B: Single Deployment
- Deploy both to Vercel (using monorepo settings)
- Configure `vercel.json` appropriately

---

### 5. **Backend Deployment (Render.com Example)**

1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. Create **New Web Service**
4. Connect GitHub repo
5. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run db:generate && npm run build`
   - **Start Command**: `npm start`
6. Add Environment Variables (from backend/.env):
   - `DATABASE_URL` (PostgreSQL connection)
   - `EVIDENCE_SIGNATURE_KEY`
   - `ANTHROPIC_API_KEY` (if using AI)
   - All email/SMS credentials
7. Deploy and copy backend URL
   - Example: `https://truthview-backend.onrender.com`

---

### 6. **Frontend Deployment (Vercel)**

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import same repo
4. Configure:
   - **Framework**: Next.js
   - **Root Directory**: `frontend`
5. Add Environment Variable:
   - `NEXT_PUBLIC_API_BASE_URL=https://truthview-backend.onrender.com`
6. Deploy
7. Get frontend URL (e.g., `https://truthview.vercel.app`)

---

### 7. **Post-Deployment Verification**

```bash
# Test backend health
curl https://your-backend-domain/health

# Expected Response:
# {"ok":true,"service":"truthview-backend"}

# Test frontend loads
# Open: https://your-frontend-domain.vercel.app
# Check console for API connection logs
```

---

### 8. **Database Provider Decision**

| Feature | SQLite | PostgreSQL |
|---------|---------|-----------|
| Dev/Test | ✅ Good | ✅ Good |
| Production | ❌ Don't use | ✅ Recommended |
| Scalability | ❌ Limited | ✅ Excellent |
| Concurrent Users | ❌ Limited | ✅ Good |
| File Size Limit | ❌ 2GB | ✅ No limit |

**Decision:** Update `prisma/schema.prisma` for production:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## 📋 Quick Pre-Deployment Checklist

- [ ] Environment variables created (.env files)
- [ ] Database selected (PostgreSQL for production)
- [ ] Local builds succeed (`npm run build` in backend & frontend)
- [ ] Backend tests pass (auth, API endpoints)
- [ ] Frontend tests pass (UI, API calls)
- [ ] Panic mode works (ESC key, Ctrl+Q)
- [ ] PDF generation works
- [ ] Security key generated and stored
- [ ] GitHub repo has all code committed
- [ ] Vercel account ready
- [ ] Render.com/hosting account ready
- [ ] SMTP/email credentials obtained
- [ ] Anthropic API key obtained (if using AI)

---

## 🔗 Useful Links

- **Next.js Deploy**: https://nextjs.org/docs/deployment
- **Vercel Docs**: https://vercel.com/docs
- **Render Docs**: https://render.com/docs
- **Prisma Deploy Guide**: https://www.prisma.io/docs/guides/deployment

---

## ❓ Common Issues & Solutions

**Issue: `DATABASE_URL not set`**
- ✅ Solution: Create `.env` file in backend with `DATABASE_URL`

**Issue: `NEXT_PUBLIC_API_BASE_URL is undefined`**
- ✅ Solution: Create `.env.local` in frontend with correct API URL

**Issue: `Build fails with TypeScript errors`**
- ✅ Solution: Run `npm run lint` to identify issues, fix them

**Issue: `Email/SMS not working`**
- ✅ Solution: Verify SMTP/Twilio credentials in `.env`

---

## 🚀 Next Steps

1. **Create `.env` files** (see Section 1 above)
2. **Choose database** (PostgreSQL recommended)
3. **Run local builds** to verify everything works
4. **Test all features** locally
5. **Push to GitHub**
6. **Deploy backend** to Render
7. **Deploy frontend** to Vercel
8. **Test remote URLs**
9. **Monitor logs** for errors

