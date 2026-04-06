import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRouter from './routes/auth'
import chronologyRouter from './routes/chronology'
import evidenceRouter from './routes/evidence'
import legalBriefRouter from './routes/legalBrief'

const app = express()
const port = Number(process.env.PORT || 4000)
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:3000'

app.use(cors({ origin: frontendOrigin }))
app.use(express.json({ limit: '10mb' }))

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'truthview-backend' })
})

app.use('/api/auth', authRouter)
app.use('/api/chronology', chronologyRouter)
app.use('/api/evidence', evidenceRouter)
app.use('/api/legal-brief', legalBriefRouter)

app.listen(port, () => {
  console.log(`TruthView backend running on http://localhost:${port}`)
})
