import { getFirestore, FieldValue } from 'firebase-admin/firestore'

// Lazy access — getFirestore() must only run after initializeApp() has been
// called by functions/src/index.ts. Resolving it at invocation time avoids any
// reliance on module/import evaluation order.
function db() {
  return getFirestore()
}

/**
 * Create an in-app notification for a user (admin SDK — bypasses rules,
 * but the Firestore rules still restrict client-created notifications).
 */
export async function notifyUser(params: {
  userId: string
  type: string
  title: string
  message: string
  link?: string
}): Promise<void> {
  await db().collection('notifications').add({
    userId: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    link: params.link ?? null,
    isRead: false,
    createdAt: FieldValue.serverTimestamp(),
  })
}

/**
 * Read a user's profile doc. Returns null if missing.
 */
export async function getUserProfile(uid: string) {
  const snap = await db().collection('users').doc(uid).get()
  return snap.exists ? (snap.data() ?? null) : null
}
