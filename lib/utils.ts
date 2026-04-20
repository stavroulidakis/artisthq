import { format, parseISO, isValid } from 'date-fns'
import { el } from 'date-fns/locale'
import type { Live } from './supabase'

export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '—'
  return new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR' }).format(amount)
}

export function formatDate(dateStr: string | null | undefined, fmt = 'd MMM yyyy'): string {
  if (!dateStr) return '—'
  try {
    const d = parseISO(dateStr)
    if (!isValid(d)) return '—'
    return format(d, fmt, { locale: el })
  } catch { return '—' }
}

export function formatDateShort(dateStr: string | null | undefined): string {
  return formatDate(dateStr, 'dd/MM/yy')
}

export function formatTime(t: string | null | undefined): string {
  if (!t) return ''
  return t.slice(0, 5)
}

export function formatDateLong(dateStr: string | null | undefined): string {
  return formatDate(dateStr, "EEEE d MMMM yyyy")
}

export const LIVE_STATUS_LABELS: Record<string, string> = {
  confirmed: 'Επιβεβαιωμένο',
  pending: 'Σε αναμονή',
  cancelled: 'Ακυρωμένο',
  completed: 'Ολοκληρωμένο',
  inquiry: 'Ερώτημα',
}

export const LIVE_CATEGORIES: string[] = [
  'Γάμος', 'Βάπτιση', 'Αρραβώνας', 'Πάρτι', 'Εταιρική', 'Live Show', 'Φεστιβάλ', 'Άλλο'
]

export const LIVE_STATUSES: string[] = ['confirmed', 'pending', 'cancelled', 'completed', 'inquiry']

export const PAYMENT_METHODS: string[] = ['Μετρητά', 'Τραπεζική Μεταφορά', 'Επιταγή', 'Κάρτα']

export const MUSICIAN_ROLES: string[] = [
  'Κιθαρίστας', 'Μπουζουξής', 'Λαουτιέρης', 'Βιολιστής', 'Κρουστά', 'Μπάσο',
  'Πλήκτρα', 'Τραγουδιστής/τρια', 'Λύρα', 'Σαντούρι', 'Άλλο'
]

export const REGIONS: string[] = [
  'Ηράκλειο', 'Χανιά', 'Ρέθυμνο', 'Λασίθι',
  'Αθήνα', 'Θεσσαλονίκη', 'Πειραιάς', 'Άλλη Ελλάδα', 'Εξωτερικό'
]

export const FINANCIAL_CATEGORIES: string[] = [
  'Αμοιβή Μουσικού', 'Ενοίκιο Εξοπλισμού', 'Μεταφορικά', 'Διαμονή',
  'Φαγητό', 'Τεχνικός Ήχου', 'Διαφήμιση', 'Άλλο Έξοδο'
]

export const REMINDER_TYPES: string[] = [
  'Κατάθεση Προκαταβολής', 'Εξόφληση', 'Τιμολόγιο/Απόδειξη',
  'Επικοινωνία Πελάτη', 'Πληρωμή Μουσικών', 'Άλλο'
]

// ==================== ICS EXPORT ====================

export function generateICS(lives: Live[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Σταυρουλιδάκης CRM//GR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Κώστας Σταυρουλιδάκης - Lives',
    'X-WR-TIMEZONE:Europe/Athens',
  ]

  for (const live of lives) {
    if (!live.date) continue
    const dateStr = live.date.replace(/-/g, '')
    const dtStart = live.time_start
      ? `${dateStr}T${live.time_start.replace(/:/g, '').slice(0, 6)}`
      : dateStr
    const dtEnd = live.time_end
      ? `${dateStr}T${live.time_end.replace(/:/g, '').slice(0, 6)}`
      : dtStart

    const location = [live.venues?.name, live.city, live.region].filter(Boolean).join(', ')
    const description = [
      live.category ? `Κατηγορία: ${live.category}` : '',
      live.agreed_amount ? `Συμφωνηθέν: ${formatCurrency(live.agreed_amount)}` : '',
      live.clients?.name ? `Πελάτης: ${live.clients.name}` : '',
      live.notes || '',
    ].filter(Boolean).join('\\n')

    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${live.id}@stavrou-crm`)
    lines.push(`DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss")}Z`)
    if (live.time_start) {
      lines.push(`DTSTART;TZID=Europe/Athens:${dtStart}00`)
      lines.push(`DTEND;TZID=Europe/Athens:${dtEnd}00`)
    } else {
      lines.push(`DTSTART;VALUE=DATE:${dateStr}`)
      lines.push(`DTEND;VALUE=DATE:${dateStr}`)
    }
    lines.push(`SUMMARY:${escapeICS(live.title)}`)
    if (location) lines.push(`LOCATION:${escapeICS(location)}`)
    if (description) lines.push(`DESCRIPTION:${description}`)
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

function escapeICS(str: string): string {
  return str.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n')
}

export function downloadICS(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ==================== SCORE HELPERS ====================

export function scoreColor(score: number | null | undefined): string {
  if (!score) return 'var(--text-muted)'
  if (score >= 8) return 'var(--green)'
  if (score >= 5) return 'var(--amber)'
  return 'var(--red)'
}

export function scoreBg(score: number | null | undefined): string {
  if (!score) return 'var(--bg-overlay)'
  if (score >= 8) return 'rgba(39,174,96,0.15)'
  if (score >= 5) return 'rgba(245,158,11,0.15)'
  return 'rgba(231,76,60,0.15)'
}

// ==================== GROUPING ====================

export function groupLivesByMonth(lives: Live[]): Record<string, Live[]> {
  const grouped: Record<string, Live[]> = {}
  for (const live of lives) {
    const key = live.date ? format(parseISO(live.date), 'yyyy-MM') : 'unknown'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(live)
  }
  return grouped
}
