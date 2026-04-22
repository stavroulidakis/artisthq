import { MUSICIAN_ROLES, LIVE_CATEGORIES, LIVE_STATUSES, LIVE_STATUS_LABELS } from './utils'
export interface StatusEntry { value: string; label: string }
export const DEFAULT_ROLES = MUSICIAN_ROLES
export const DEFAULT_CATEGORIES = LIVE_CATEGORIES
export const DEFAULT_STATUSES: StatusEntry[] = LIVE_STATUSES.map(v => ({
  value: v,
  label: LIVE_STATUS_LABELS[v] ?? v,
}))
function readList<T>(key: string, fallback: T[]): T[] {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? (parsed as T[]) : fallback
  } catch { return fallback }
}
function writeList(key: string, values: unknown[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(values))
}
export function getMusicianRoles(): string[] { return readList<string>('crm_roles', DEFAULT_ROLES) }
export function getLiveCategories(): string[] { return readList<string>('crm_categories', DEFAULT_CATEGORIES) }
export function getLiveStatuses(): StatusEntry[] { return readList<StatusEntry>('crm_statuses', DEFAULT_STATUSES) }
export function saveMusicianRoles(v: string[]): void { writeList('crm_roles', v) }
export function saveLiveCategories(v: string[]): void { writeList('crm_categories', v) }
export function saveLiveStatuses(v: StatusEntry[]): void { writeList('crm_statuses', v) }
export function getStatusLabel(status: string, statuses: StatusEntry[]): string {
  return statuses.find(s => s.value === status)?.label ?? LIVE_STATUS_LABELS[status] ?? status
}
export function getStatusBadgeClass(status: string): string {
  const known = ['confirmed', 'pending', 'cancelled', 'completed', 'inquiry']
  return known.includes(status) ? `badge-${status}` : 'badge-inquiry'
}