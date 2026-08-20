import {
  collection,
  collectionGroup,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  writeBatch,
  serverTimestamp,
  doc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { COLLECTIONS, SUBCOLLECTIONS } from './firestore'
import type { Booking, BookingStatus } from '@/types'

// ============================================================
// BOOKING SERVICE
// Project-centric restructure: bookings now live UNDER the project
//   projects/{projectId}/bookings/{bookingId}
// Cross-project queries use COLLECTION GROUP queries on 'bookings'.
// ⚠️ CREATION is server-enforced via the `createBooking` Cloud
// Function (src/services/firebase/functions.ts) — direct client
// creates are denied by firestore.rules so conflict detection
// cannot be bypassed. This module handles reads + status updates.
// ============================================================

/** collectionGroup reference for querying bookings across ALL projects */
function allBookings() {
  return collectionGroup(db, SUBCOLLECTIONS.PROJECT_BOOKINGS)
}

/**
 * Get all approved bookings for a machine on a specific date.
 * Used by the slot picker UI to show booked times.
 * COLLECTION GROUP query — narrow: equipmentId + date.
 */
export async function getBookingsForSlot(
  equipmentId: string,
  date: string
): Promise<Booking[]> {
  const q = query(
    allBookings(),
    where('equipmentId', '==', equipmentId),
    where('date', '==', date),
    where('status', '==', 'approved')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking)
}

/**
 * Look up a single booking by its full Firestore document path
 * (projects/{projectId}/bookings/{bookingId}). Returns null if not found.
 * The parent projectId is required — a collection-group `__name__` query with
 * only the bookingId would never match the fully-qualified path.
 */
export async function getBookingById(projectId: string, bookingId: string): Promise<Booking | null> {
  const ref = doc(db, COLLECTIONS.PROJECTS, projectId, SUBCOLLECTIONS.PROJECT_BOOKINGS, bookingId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Booking
}

/**
 * Update booking status (cancel / reject / complete).
 * projectId is required to construct the subcollection path.
 * The status update and the matching activity-log entry are committed in a
 * single batch with a deterministic log ID, so retries are idempotent.
 */
export async function updateBookingStatus(
  projectId: string,
  bookingId: string,
  status: BookingStatus,
  options?: { rejectionReason?: string; cancelledBy?: string; actor?: { uid: string; name: string; email: string } }
): Promise<void> {
  const ref = doc(db, COLLECTIONS.PROJECTS, projectId, SUBCOLLECTIONS.PROJECT_BOOKINGS, bookingId)
  const updates: Record<string, unknown> = {
    status,
    updatedAt: serverTimestamp(),
  }
  if (status === 'rejected' && options?.rejectionReason) {
    updates.rejectionReason = options.rejectionReason
  }
  if (status === 'cancelled' && options?.cancelledBy) {
    updates.cancelledBy = options.cancelledBy
  }

  const actor = options?.actor
  const summary = `Booking ${status}${options?.rejectionReason ? ` — ${options.rejectionReason}` : ''}`

  const batch = writeBatch(db)
  batch.update(ref, updates)

  // Deterministic log ID = idempotency key (retries write the same doc).
  const logRef = doc(
    db,
    COLLECTIONS.PROJECTS, projectId,
    SUBCOLLECTIONS.PROJECT_ACTIVITY_LOG,
    `status_${bookingId}_${status}`,
  )
  batch.set(logRef, {
    type: 'status_change',
    summary: summary.length > 280 ? summary.slice(0, 277) + '…' : summary,
    resourceId: bookingId,
    userId: actor?.uid ?? 'system',
    userName: actor?.name ?? 'Coordinator',
    userEmail: actor?.email ?? '',
    createdAt: serverTimestamp(),
  })

  await batch.commit()
}

/**
 * Get every booking that hangs under one project (admin project drill-down).
 * Scoped collection query — no collection-group scan needed.
 */
export async function getProjectBookings(projectId: string): Promise<Booking[]> {
  const ref = collection(db, COLLECTIONS.PROJECTS, projectId, SUBCOLLECTIONS.PROJECT_BOOKINGS)
  const q = query(ref, orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Booking)
    .sort((a, b) => (b.date.localeCompare(a.date) || a.startTime.localeCompare(b.startTime)))
}
