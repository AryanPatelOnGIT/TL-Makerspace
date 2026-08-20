import {
  collection,
  query,
  where,
  getDocs,
  getCountFromServer,
  doc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { COLLECTIONS, SUBCOLLECTIONS } from './firestore'
import { createProjectCallable } from './functions'
import type { Project, ProjectStatus } from '@/types'

// ============================================================
// PROJECT SERVICE  (Form 1 — Project Registration)
// ⚠️ CREATION is server-enforced via the `createProject` Cloud
// Function (functions/src/createProject.ts) — the atomic TL-XXX
// counter lives server-side so no client can tamper with it.
// This module handles reads + admin status updates.
// ============================================================

/**
 * Create a new project registration (Form 1).
 * Delegates to the `createProject` Cloud Function, which atomically:
 *  - increments counters/projects (server-side, tamper-proof)
 *  - writes the project doc with its business code (TL-XXX)
 *  - seeds the immutable activity timeline + relational team roster
 * Returns the Firestore document ID.
 */
export async function createProject(
  data: Omit<Project, 'id' | 'projectCode' | 'createdAt' | 'updatedAt' | 'status' | 'imageUrls' | 'documentUrls'> & {
    imageUrls?: string[]
    documentUrls?: string[]
  }
): Promise<string> {
  const { projectId } = (await createProjectCallable({
    title: data.title,
    abstract: data.abstract,
    contact: data.contact,
    startDate: data.startDate,
    endDate: data.endDate ?? '',
    resourceLink: data.resourceLink ?? '',
    expectedEquipmentNeeds: data.expectedEquipmentNeeds ?? [],
    equipmentNeedsOther: data.equipmentNeedsOther ?? '',
    teamMembers: data.teamMembers ?? '',
    facultyMentor: data.facultyMentor ?? '',
    department: data.department ?? '',
    universityId: data.universityId ?? '',
    userType: data.userType ?? 'Student',
    safetyAgreementAccepted: data.safetyAgreementAccepted,
    termsAccepted: data.termsAccepted,
    imageUrls: data.imageUrls ?? [],
    documentUrls: data.documentUrls ?? [],
  })).data
  return projectId
}

/**
 * Get all projects for a user by their userId.
 * Used to populate the project selector in booking/checkout forms.
 * Only returns active/pending projects (not rejected/completed).
 * React Query caches this — only fetched once per session.
 *
 * Returns `docId` (Firestore doc ID) alongside `projectCode` (TL-XXX) so
 * callers can display the code while storing the doc ID as the FK.
 */
export async function getUserProjects(userId: string, statusFilter?: string): Promise<(Project & { docId: string })[]> {
  const ref = collection(db, COLLECTIONS.PROJECTS)
  const constraints: any[] = [where('userId', '==', userId)]
  if (statusFilter) constraints.push(where('status', '==', statusFilter))
  const q = query(ref, ...constraints)
  const snap = await getDocs(q)
  return snap.docs
    .map((d) => ({ docId: d.id, ...d.data() }) as Project & { docId: string })
    .sort((a, b) => b.createdAt?.toMillis?.() - a.createdAt?.toMillis?.())
}

/**
 * Validate that a user (by userId) has at least one registered project.
 * Gate for Forms 2A and 2B: "every booking/checkout must reference a registered project" (Spec 2).
 * Uses count query — 1 read regardless of project count.
 */
export async function userHasActiveProject(userId: string): Promise<boolean> {
  const ref = collection(db, COLLECTIONS.PROJECTS)
  const q = query(
    ref,
    where('userId', '==', userId),
    where('status', '==', 'active')
  )
  const snap = await getCountFromServer(q)
  return snap.data().count > 0
}

/**
 * Get all projects (admin view) with optional status filter.
 */
export async function getProjectsByStatus(status?: ProjectStatus): Promise<(Project & { docId: string })[]> {
  const ref = collection(db, COLLECTIONS.PROJECTS)
  const constraints = status ? [where('status', '==', status)] : []
  const q = query(ref, ...constraints)
  const snap = await getDocs(q)
  return snap.docs
    .map((d) => ({ docId: d.id, ...d.data() }) as Project & { docId: string })
    .sort((a, b) => b.createdAt?.toMillis?.() - a.createdAt?.toMillis?.())
}

/**
 * Admin: approve or reject a project registration.
 * Commits the project status, reviewedBy metadata, and status_change activity
 * entry in one atomic batched write (retry-safe via a deterministic log ID).
 */
export async function updateProjectStatus(
  firestoreDocId: string,
  status: 'active' | 'rejected' | 'on_hold' | 'completed',
  rejectionReason?: string,
  actor?: { uid: string; name: string; email: string }
): Promise<void> {
  const updates: Record<string, unknown> = {
    status,
    rejectionReason: status === 'rejected' ? (rejectionReason?.trim() || null) : null,
    reviewedBy: actor?.name ?? 'Admin',
    reviewedByEmail: actor?.email ?? '',
    reviewedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  const ref = doc(db, COLLECTIONS.PROJECTS, firestoreDocId)

  const summary = `Project marked as ${status}${rejectionReason ? ` — ${rejectionReason}` : ''}`

  const batch = writeBatch(db)
  batch.update(ref, updates)

  const logRef = doc(
    db,
    COLLECTIONS.PROJECTS, firestoreDocId,
    SUBCOLLECTIONS.PROJECT_ACTIVITY_LOG,
    `status_${firestoreDocId}_${status}`,
  )
  batch.set(logRef, {
    type: 'status_change',
    summary: summary.length > 280 ? summary.slice(0, 277) + '…' : summary,
    resourceId: firestoreDocId,
    userId: actor?.uid ?? 'system',
    userName: actor?.name ?? 'Coordinator',
    userEmail: actor?.email ?? '',
    createdAt: serverTimestamp(),
  })

  await batch.commit()
}
