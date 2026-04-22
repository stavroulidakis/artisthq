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

export const DEFAULT_PROJECT_TYPES = ['Βίντεο Κλιπ', 'Ηχογράφηση', 'Festival', 'Συνεργασία', 'Παραγωγή', 'Άλλο']
export const DEFAULT_PROJECT_STATUSES = ['Σχεδιασμός', 'Σε εξέλιξη', 'Ολοκληρωμένο', 'Ακυρωμένο']
export const DEFAULT_EXPENSE_CATS = ['Σκηνοθεσία', 'Φωτογραφία', 'Μοντάζ', 'Studio', 'Εξοπλισμός', 'Μεταφορά', 'Catering', 'Άλλο']

export function getProjectTypes(): string[] { return readList<string>('crm_project_types', DEFAULT_PROJECT_TYPES) }
export function getProjectStatuses(): string[] { return readList<string>('crm_project_statuses', DEFAULT_PROJECT_STATUSES) }
export function getExpenseCats(): string[] { return readList<string>('crm_expense_cats', DEFAULT_EXPENSE_CATS) }
export function saveProjectTypes(v: string[]): void { writeList('crm_project_types', v) }
export function saveProjectStatuses(v: string[]): void { writeList('crm_project_statuses', v) }
export function saveExpenseCats(v: string[]): void { writeList('crm_expense_cats', v) }

export function getProjectStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    'Σχεδιασμός': 'badge-pending',
    'Σε εξέλιξη': 'badge-completed',
    'Ολοκληρωμένο': 'badge-confirmed',
    'Ακυρωμένο': 'badge-cancelled',
  }
  return map[status] ?? 'badge-inquiry'
}

export function getStatusLabel(status: string, statuses: StatusEntry[]): string {
  return statuses.find(s => s.value === status)?.label ?? LIVE_STATUS_LABELS[status] ?? status
}

export function getStatusBadgeClass(status: string): string {
  const known = ['confirmed', 'pending', 'cancelled', 'completed', 'inquiry']
  return known.includes(status) ? `badge-${status}` : 'badge-inquiry'
}
