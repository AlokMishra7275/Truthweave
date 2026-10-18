import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRouter from './routes/auth'
import chronologyRouter from './routes/chronology'
import evidenceRouter from './routes/evidence'
import legalBriefRouter from './routes/legalBrief'

const app = express()
const port = Number(process.env.PORT || 4000)
const frontendOrigin = process.env.FRONTEND_ORIGIN || '*'

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true)
      
      // If frontendOrigin is wildcard, allow everything
      if (frontendOrigin === '*' || !process.env.FRONTEND_ORIGIN) return callback(null, true)
      
      // Allow localhost or Vercel preview/production domains
      if (
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost') ||
        origin === frontendOrigin
      ) {
        return callback(null, true)
      }

      return callback(null, true)
    },
    credentials: true,
  })
)
app.use(express.json({ limit: '10mb' }))

app.get('/', (_req, res) => {
  res.json({
    ok: true,
    message: 'TruthView backend is running.',
    frontend: frontendOrigin,
    health: '/health',
  })
})

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'truthview-backend' })
})

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'truthview-backend' })
})

app.use('/api/auth', authRouter)
app.use('/api/chronology', chronologyRouter)
app.use('/api/evidence', evidenceRouter)
app.use('/api/legal-brief', legalBriefRouter)

if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`TruthView backend running on http://localhost:${port}`)
  })
}

export default app

