'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/PageHeader'
import { Users } from 'lucide-react'
import {
  format, startOfYear, endOfYear, startOfMonth, endOfMonth, subYears, subMonths
} from 'date-fns'

type RangePreset = 'year' | 'last_year' | 'month' | 'last_month' | 'custom'

function getRange(preset: RangePreset, customFrom: string, customTo: string): { start: string; end: string } {
  const n = new Date()
  if (preset === 'year') return { start: format(startOfYear(n), 'yyyy-MM-dd'), end: format(endOfYear(n), 'yyyy-MM-dd') }
  if (preset === 'last_year') {
    const ly = subYears(n, 1)
    return { start: format(startOfYear(ly), 'yyyy-MM-dd'), end: format(endOfYear(ly), 'yyyy-MM-dd') }
  }
  if (preset === 'month') return { start: format(startOfMonth(n), 'yyyy-MM-dd'), end: format(endOfMonth(n), 'yyyy-MM-dd') }
  if (preset === 'last_month') {
    const lm = subMonths(n, 1)
    return { start: format(startOfMonth(lm), 'yyyy-MM-dd'), end: format(endOfMonth(lm), 'yyyy-MM-dd') }
  }
  return { start: customFrom, end: customTo }
}

const PRESET_LABELS: Record<RangePreset, string> = {
  year: 'Φέτος',
  last_year: 'Πέρυσι',
  month: 'Τρέχων μήνας',
  last_month: 'Προηγ. μήνας',
  custom: 'Προσαρμοσμένο',
}

interface MusicianRow {
  name: string
  count: number
  total: number
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<any[]>([])
  const [preset, setPreset] = useState<RangePreset>('year')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  useEffect(() => {
    supabase
      .from('live_musicians')
      .select('live_id, agreed_fee, paid_fee, musicians(name), lives(date, status)')
      .then(({ data }) => {
        setRows(data || [])
        setLoading(false)
      })
  }, [])

  const { start, end } = getRange(preset, customFrom, customTo)
  const today = format(new Date(), 'yyyy-MM-dd')

  const inRange = rows.filter(r => {
    const livesObj = Array.isArray(r.lives) ? r.lives[0] : r.lives
    const d = livesObj?.date
    if (!d) return false
    if (livesObj?.status === 'cancelled') return false
    if (d > today) return false
    return d >= start && d <= end
  })

  // Deduplicate: μόνο μία εγγραφή ανά (musician + live_id)
  const seen = new Set<string>()
  const unique = inRange.filter(r => {
    const musObj = Array.isArray(r.musicians) ? r.musicians[0] : r.musicians
    const name = musObj?.name || 'Άγνωστος'
    const key = `${name}::${r.live_id}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const byMusician: Record<string, MusicianRow> = {}
  unique.forEach(r => {
    const musObj = Array.isArray(r.musicians) ? r.musicians[0] : r.musicians
    const name = musObj?.name || 'Άγνωστος'
    const fee = r.agreed_fee || r.paid_fee || 0
    if (!byMusician[name]) byMusician[name] = { name, count: 0, total: 0 }
    byMusician[name].count++
    byMusician[name].total += fee
  })

  const tableRows = Object.values(byMusician).sort((a, b) => b.total - a.total)
  const totalCount = tableRows.reduce((s, r) => s + r.count, 0)
  const totalFees = tableRows.reduce((s, r) => s + r.total, 0)

  if (loading) return <Spinner />

  return (
    <div className="animate-in">
      <PageHeader
        title="Αναφορές"
        subtitle="Αμοιβές μουσικών για ολοκληρωμένες εμφανίσεις"
        icon={<Users size={18} color="var(--terra)" />}
      />

      <div className="p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {(['year', 'last_year', 'month', 'last_month', 'custom'] as RangePreset[]).map(p => (
            <button key={p} onClick={() => setPreset(p)}
              className={`btn btn-sm ${preset === p ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.75rem' }}>
              {PRESET_LABELS[p]}
            </button>
          ))}
          {preset === 'custom' && (
            <div className="flex items-center gap-2 ml-2">
              <input type="date" className="input" style={{ width: 140, fontSize: '0.78rem', padding: '4px 8px' }}
                value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
              <input type="date" className="input" style={{ width: 140, fontSize: '0.78rem', padding: '4px 8px' }}
                value={customTo} onChange={e => setCustomTo(e.target.value)} />
            </div>
          )}
        </div>

        <div className="card" style={{ padding: '14px 16px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700, marginBottom: 12 }}>
            Αμοιβές Μουσικών — {PRESET_LABELS[preset]}
          </h2>

          {tableRows.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '24px 0' }}>
              Δεν υπάρχουν εγγραφές για το επιλεγμένο διάστημα
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Μουσικός', 'Εμφανίσεις', 'Σύνολο Αμοιβών'].map(h => (
                    <th key={h} className="pb-2 text-left" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map(row => (
                  <tr key={row.name} className="table-row">
                    <td className="py-2.5 pr-4" style={{ fontWeight: 600 }}>{row.name}</td>
                    <td className="py-2.5 pr-4" style={{ color: 'var(--sea)', fontWeight: 600 }}>{row.count}</td>
                    <td className="py-2.5" style={{ fontWeight: 700, color: 'var(--amber)' }}>{formatCurrency(row.total)}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: '2px solid var(--border)' }}>
                  <td className="pt-3 pb-1" style={{ fontWeight: 800, fontSize: '0.85rem' }}>Σύνολο</td>
                  <td className="pt-3 pb-1" style={{ fontWeight: 800, color: 'var(--sea)' }}>{totalCount}</td>
                  <td className="pt-3 pb-1" style={{ fontWeight: 800, color: 'var(--amber)', fontSize: '0.95rem' }}>{formatCurrency(totalFees)}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
