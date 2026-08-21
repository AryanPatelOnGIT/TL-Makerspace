import express from 'express'
import type { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

// ============================================================
// Tinker's Lab — Backend API (hosted on Vercel)
//
// The frontend (hosted on Firebase Hosting) talks to this API for operations
// that must be enforced server-side: privileged writes, rate limiting, and
// scheduled/administrative sweeps. Everything is verified against a Firebase
// ID token, so a client can only act as its own authenticated identity.
// ============================================================

const FEEDBACK_WINDOW_MS = 5 * 60 * 1000 // 5 minutes
const FEEDBACK_MAX_CHARS = 2000
const STAFF_ROLES = ['super_admin', 'faculty', 'lab_assistant'] as const

// CORS: only the Firebase Hosting origin (and local dev) may call the API.
const allowedOrigins = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

function corsOrigin(
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
): void {
  // No origin = same-origin/server-to-server; allow. When CORS_ORIGINS is unset
  // we allow any origin (dev fallback).
  if (!origin || !allowedOrigins.length || allowedOrigins.includes(origin)) {
    callback(null, true)
    return
  }
  callback(new Error('Not allowed by CORS'))
}

function initAdmin() {
  if (getApps().length > 0) return getApp()
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is not set. Deploy requires the service account JSON.')
  }
  let serviceAccount: object
  try {
    serviceAccount = JSON.parse(raw)
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is not valid JSON.')
  }
  return initializeApp({ credential: cert(serviceAccount as never) })
}

async function verifyIdToken(req: Request): Promise<string> {
  initAdmin()
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    throw new HttpError(401, 'Missing bearer token')
  }
  const token = header.slice('Bearer '.length)
  try {
    const decoded = await getAuth().verifyIdToken(token)
    return decoded.uid
  } catch {
    throw new HttpError(401, 'Invalid or expired token')
  }
}

async function getUserRole(uid: string): Promise<string | undefined> {
  initAdmin()
  const snap = await getFirestore().collection('users').doc(uid).get()
  return snap.data()?.role as string | undefined
}

async function requireStaff(uid: string): Promise<void> {
  const role = await getUserRole(uid)
  if (!role || !(STAFF_ROLES as readonly string[]).includes(role)) {
    throw new HttpError(403, 'Forbidden: staff only')
  }
}

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

const app = express()

app.use(cors({ origin: corsOrigin, credentials: true }))
app.use(express.json({ limit: '64kb' }))

// Health check — used by uptime monitors and the frontend to detect availability.
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'tinkers-lab-backend', time: new Date().toISOString() })
})

// Submit feedback with server-enforced rate limiting (1 per user per 5-min window)
// and a 2000-character cap. Replaces the previous client-side-only cooldown.
app.post('/api/feedback', async (req, res) => {
  const uid = await verifyIdToken(req)
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : ''

  if (!message) throw new HttpError(400, 'Message is required')
  if (message.length > FEEDBACK_MAX_CHARS) {
    throw new HttpError(400, `Message must be ${FEEDBACK_MAX_CHARS} characters or fewer`)
  }

  const db = getFirestore()
  const windowId = Math.floor(Date.now() / FEEDBACK_WINDOW_MS)
  const docId = `${uid}_${windowId}`

  try {
    await db.collection('feedback').doc(docId).create({
      userId: uid,
      message,
      createdAt: FieldValue.serverTimestamp(),
    })
  } catch (err) {
    const code = (err as { code?: number | string })?.code
    if (code === 6 || code === 'ALREADY_EXISTS') {
      throw new HttpError(429, 'Feedback already sent in this window. Please wait a few minutes.')
    }
    throw err
  }

  res.status(201).json({ ok: true })
})

// Mark tool checkouts overdue (Phase 9 daily sweep). Staff only.
app.post('/api/overdue-sweep', async (req, res) => {
  const uid = await verifyIdToken(req)
  await requireStaff(uid)

  const db = getFirestore()
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD (UTC)

  const overdue = await db
    .collection('toolCheckouts')
    .where('action', '==', 'checking_out')
    .where('isOverdue', '==', false)
    .where('expectedReturnDate', '<', today)
    .get()

  const batch = db.batch()
  overdue.docs.forEach((doc) => {
    batch.update(doc.ref, { isOverdue: true, updatedAt: FieldValue.serverTimestamp() })
  })
  if (overdue.size > 0) await batch.commit()

  res.json({ ok: true, markedOverdue: overdue.size })
})

// 404 for unknown API routes
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// Centralised error handler
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message })
    return
  }
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

export default app
