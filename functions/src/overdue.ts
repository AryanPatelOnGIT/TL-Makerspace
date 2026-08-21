import { onSchedule } from 'firebase-functions/v2/scheduler'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

// Lazy access — see functions/src/lib/helpers.ts.
function db() {
  return getFirestore()
}

// ============================================================
// sweepOverdueCheckouts — daily server-side overdue sweep
// Previously isOverdue was client-computed only. This scheduled
// function (02:00 Asia/Kolkata) flags every unreturned checkout
// whose expected return date has passed, and notifies the owner.
// ============================================================

/**
 * Current date in Asia/Kolkata, matching the schedule's timeZone so the
 * sweep does not depend on the Node.js runtime's local time zone.
 */
function todayStr(): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date())
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

// Firestore batches cap at 500 writes — commit and start a fresh batch before
// exceeding the limit so a single oversized commit can't fail the whole sweep.
const BATCH_LIMIT = 500

export const sweepOverdueCheckouts = onSchedule(
  { schedule: '0 2 * * *', timeZone: 'Asia/Kolkata', maxInstances: 1 },
  async () => {
    const today = todayStr()
    const snap = await db()
      .collectionGroup('checkouts')
      .where('action', '==', 'checking_out')
      .where('isOverdue', '==', false)
      .where('expectedReturnDate', '<', today)
      .get()

    let batch = db().batch()
    let ops = 0
    let flagged = 0

    for (const doc of snap.docs) {
      const data = doc.data()
      // Unreturned guard (returned checkouts flip action to 'returning', but
      // keep this belt-and-suspenders check for legacy records).
      if (data.returnedAt != null) continue

      // Finalize the overdue marker and its notification in the SAME batch so
      // they commit atomically (retry-safe — re-running won't double-notify).
      batch.update(doc.ref, { isOverdue: true, updatedAt: FieldValue.serverTimestamp() })
      flagged++
      ops++

      const userId: string | undefined = data.userId
      if (userId) {
        // Deterministic notification ID = idempotency key per checkout.
        const notifId = `overdue_${data.projectId ?? 'unknown'}_${doc.id}`
        batch.set(db().collection('notifications').doc(notifId), {
          userId,
          type: 'checkout_overdue',
          title: 'Tool overdue',
          message: `${data.toolName ?? 'A tool'} (due ${data.expectedReturnDate}) is overdue. Please return it to the lab.`,
          link: '/checkout/history',
          isRead: false,
          createdAt: FieldValue.serverTimestamp(),
        })
        ops++
      }

      if (ops >= BATCH_LIMIT) {
        await batch.commit()
        batch = db().batch()
        ops = 0
      }
    }

    if (ops > 0) await batch.commit()
    console.log(`[sweepOverdueCheckouts] flagged ${flagged} overdue checkout(s)`)
  },
)
