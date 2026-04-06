# TruthView - Trauma-Informed Evidence Platform

A secure, ethical platform designed to bridge the gap between neurobiological trauma responses and legal requirements. This platform prioritizes survivor safety, data integrity, and user-centered design.

## Features

### 🧩 Memory Mosaic
- Non-linear journaling for fragmented trauma memories
- Support for text, images, and voice notes
- Mood tagging and timestamping
- Calming, grounding UI design

### 🤖 AI Chronology Builder
- Uses Claude 3.5 Sonnet for empathetic timeline organization
- Identifies gaps without judgment
- Generates supportive legal statements

### 🚨 Panic Mode & Stealth UI
- Quick exit button (ESC or Ctrl+Q) redirects to neutral sites
- Clears session data immediately
- Stealth mode transforms UI to look like a boring note app

### 🔒 Immutable Chain of Custody
- SHA-256 file hashing
- Digital signatures for court admissibility
- PostgreSQL database with Prisma ORM
- Evidence integrity verification

### 📄 One-Click Legal Brief
- Generates professional PDF reports
- Includes neurobiology of trauma explanation
- Court-ready formatting with evidence hashes

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + Node.js
- **Database**: PostgreSQL + Prisma ORM
- **AI**: Anthropic Claude 3.5 Sonnet (for chronology)
- **Security**: AES-256 encryption, digital signatures
- **PDF Generation**: PDFKit

## Getting Started

**Note:** Due to network connectivity issues during setup, you may need to run the following commands when you have stable internet:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up the database:**
   ```bash
   # Create a PostgreSQL database and update the connection string
   npx prisma generate
   npx prisma db push
   ```

3. **Configure environment variables:**
   Create `.env.local` in the project root:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/truthview"
   EVIDENCE_SIGNATURE_KEY="your-secure-random-key-here"
   ANTHROPIC_API_KEY="your-anthropic-api-key" # Optional, for AI features
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

## Safety Features

- **Quick Exit**: Click the red "Exit" button or press ESC/Ctrl+Q to immediately redirect to Google Weather and clear all session data
- **Stealth Mode**: Click the 👁️ button to transform the UI into a generic note-taking app
- **End-to-End Security**: All evidence is cryptographically signed and hashed

## Trauma-Informed Design Principles

- Soft, grounding color palette (sage green, soft blue, earth tones)
- Non-linear interfaces that respect fragmented memory
- Supportive language that validates survivor experiences
- Safety-first approach with multiple escape mechanisms

## API Endpoints

- `POST /api/chronology` - Generate chronological timeline
- `POST /api/evidence` - Upload evidence with integrity verification
- `GET /api/evidence` - Fetch evidence records
- `POST /api/legal-brief` - Generate PDF legal brief

## Contributing

This platform is built with survivor safety and ethical AI as the highest priorities. All contributions must align with trauma-informed principles.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This platform is designed to support survivors but is not a substitute for professional legal or therapeutic services. Always consult qualified professionals for legal and mental health support.