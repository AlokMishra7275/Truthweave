# TruthView - Simple Setup (Hindi)

## Step 1: Database Install Karo
PostgreSQL download karo: https://www.postgresql.org/download/windows/
- Install karo (default settings use karo)
- Password yaad rakhna (default: postgres)

## Step 2: Database Create Karo
Windows Search mein "SQL Shell" type karo:
```
Server: localhost
Database: postgres
Username: postgres
Password: [jo password diya tha install mein]
Port: 5432

Phir command:
CREATE DATABASE truthview;
\q
```

## Step 3: .env.local Update Karo
`.env.local` file kholo aur change karo:
```
DATABASE_URL="postgresql://postgres:[YOUR_PASSWORD]@localhost:5432/truthview"
```

Example: Agar password "admin123" hai toh:
```
DATABASE_URL="postgresql://postgres:admin123@localhost:5432/truthview"
```

## Step 4: Prisma Setup
Command Prompt kholo aur run karo:
```bash
cd C:\Users\Aman Sharma\Desktop\TRUTHVIEW
npx prisma generate
npx prisma db push
```

## Step 5: Project Start Karo
```bash
npm run dev
```

## Step 6: Browser Mein Check Karo
http://localhost:3000 open karo

---
## Agar Problem Aaye Toh:

### Problem: PostgreSQL install nahi kar sakte
**Solution:** SQLite use karo (simple hai)
1. `.env.local` mein change karo:
```
DATABASE_URL="file:./dev.db"
```
2. `prisma/schema.prisma` mein change karo:
```
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```
3. Phir step 4 se continue karo

### Problem: Prisma commands fail
**Solution:** Node modules check karo:
```bash
npm list prisma
```
Agar nahi dikhe toh `npm install` fir se run karo

### Problem: npm run dev fail
**Solution:** Dependencies check karo:
```bash
node verify-setup.js
```

---
## Success Check:
- ✅ Database connect hua
- ✅ Prisma generate complete
- ✅ npm run dev start hua
- ✅ Browser mein page load hua

**Ready ho jao toh batao, main help karta hoon!**