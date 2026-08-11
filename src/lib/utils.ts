import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const toDate = (d: any) => d?.seconds ? new Date(d.seconds * 1000) : new Date(d)

export const formatDate = (d: any) => d ? toDate(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
export const formatDateTime = (d: any) => d ? toDate(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

export function formatRelativeTime(date: any): string {
  if (!date) return '—'
  const d = toDate(date)
  const diffInSeconds = (d.getTime() - Date.now()) / 1000
  
  if (Math.abs(diffInSeconds) < 60) return 'just now'
  
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto', style: 'short' })
  
  if (Math.abs(diffInSeconds) < 3600) return rtf.format(Math.round(diffInSeconds / 60), 'minute')
  if (Math.abs(diffInSeconds) < 86400) return rtf.format(Math.round(diffInSeconds / 3600), 'hour')
  if (Math.abs(diffInSeconds) < 604800) return rtf.format(Math.round(diffInSeconds / 86400), 'day')
  return formatDate(d)
}

export function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function generateId(prefix: string, count: number): string {
  return `${prefix}-${String(count + 1).padStart(3, '0')}`
}

export function cleanFirestoreData<T extends Record<string, any>>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  if (typeof (obj as any)._methodName === 'string') return obj
  const cleaned: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue
    if (typeof (value as any)?._methodName === 'string') {
      cleaned[key] = value
      continue
    }
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !(value instanceof Date) &&
      typeof (value as any).toMillis !== 'function'
    ) {
      cleaned[key] = cleanFirestoreData(value)
    } else if (Array.isArray(value)) {
      cleaned[key] = value.filter(item => item !== undefined).map(item => {
        if (item === null || typeof item !== 'object') return item
        if (item instanceof Date || typeof (item as any).toMillis === 'function') return item
        return cleanFirestoreData(item)
      })
    } else {
      cleaned[key] = value
    }
  }
  return cleaned as T
}

