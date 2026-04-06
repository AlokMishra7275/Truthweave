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

app.use('/api/auth', authRouter)
app.use('/api/chronology', chronologyRouter)
app.use('/api/evidence', evidenceRouter)
app.use('/api/legal-brief', legalBriefRouter)

<<<<<<< HEAD
// Export the Express app for Vercel serverless deployment.
// The app.listen call is kept only for local/dev execution.
if (require.main === module) {
  app.listen(port, () => {
    console.log(`TruthView backend running on http://localhost:${port}`)
  })
}

export default app
=======
app.listen(port, () => {
  console.log(`TruthView backend running on http://localhost:${port}`)
})
>>>>>>> b28efdd55c846a635cb28b5c7b44e6b7c60cbea1
