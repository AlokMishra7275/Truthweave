# TruthView Separate Deploy Guide

This repo now has two independent apps:
- frontend (Next.js)
- backend (Express + Prisma)

## 1) Local run (separate)

### Backend
1. Copy backend/.env.example to backend/.env
2. Fill required values
3. Run:

cd backend
npm install
npm run db:generate
npm run db:push
npm run dev

Backend runs on http://localhost:4000

### Frontend
1. Copy frontend/.env.example to frontend/.env.local
2. Set:

NEXT_PUBLIC_API_BASE_URL=http://localhost:4000

3. Run:

cd frontend
npm install
npm run dev

Frontend runs on http://localhost:3000

## 2) Deploy backend (Render)

1. Create new Web Service from this GitHub repo
2. Root Directory: backend
3. Build Command: npm install && npm run db:generate && npm run build
4. Start Command: npm start
5. Add environment variables from backend/.env.example
6. Set DATABASE_URL (for production, prefer PostgreSQL)
7. Deploy and copy backend URL

Example backend URL:
https://truthview-backend.onrender.com

## 3) Deploy frontend (Vercel)

1. Import same repo in Vercel
2. Root Directory: frontend
3. Framework preset: Next.js
4. Add env:

NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain

5. Deploy

## 4) Post-deploy checks

1. Open frontend URL
2. Test auth send OTP endpoint
3. Test legal brief download endpoint
4. Test backend health endpoint:

https://your-backend-domain/health

Expected response:
{"ok":true,"service":"truthview-backend"}
