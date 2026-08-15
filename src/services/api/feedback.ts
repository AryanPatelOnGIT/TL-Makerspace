import { auth } from '@/lib/firebase'
import { apiFetch } from '@/lib/api'

export async function submitFeedback(message: string): Promise<void> {
  const token = await auth.currentUser?.getIdToken()
  if (!token) throw new Error('Not authenticated')
  await apiFetch('/api/feedback', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ message }),
  })
}
