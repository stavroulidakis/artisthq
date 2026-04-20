'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { generateICS, downloadICS, formatTime, LIVE_STATUS_LABELS } from '@/lib/utils'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/PageHeader'
import { Calendar as CalIcon, ChevronLeft, ChevronRight, Download, List, Grid3X3 } from 'lucide-react'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addMonths, subMonths, addWeeks, subWeeks,
  eachDayOfInterval, isSameMonth, isSameDay, parseISO, isToday
} from 'date-fns'
import { el } from 'date-fns/locale'
import Link from 'next/link'
import type { Live } from '@/lib/supabase'

type ViewMode = 'month' | 'week' | 'list'

const DAYS_GR = ['Δευ', 'Τρί', 'Τετ', 'Πέμ', 'Παρ', 'Σαβ', 'Κυρ']

export default function CalendarPage() {
  const [lives, setLives] = useState<Live[]>([])
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState(new Date())
  const [view, setView] = useState<ViewMode>('month')

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('lives')
      .select('*, venues(name, city), clients(name)')
      .order('date')
    setLives((data || []) as Live[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function livesForDay(date: Date) {
    const str = format(date, 'yyyy-MM-dd')
    return lives.filter(l => l.date === str)
  }

  function exportICS() {
    const content = generateICS(lives)
    downloadICS(content, 'stavrou-lives.ics')
  }

  // Navigation
  function prev() {
    if (view === 'month') setCurrent(subMonths(current, 1))
    else if (view === 'week') setCurrent(subWeeks(current, 1))
    else setCurrent(subMonths(current, 1))
  }
  function next() {
    if (view === 'month') setCurrent(addMonths(current, 1))
    else if (view === 'week') setCurrent(addWeeks(current, 1))
    else setCurrent(addMonths(current, 1))
  }

  // Month grid
  const monthStart = startOfMonth(current)
  const monthEnd = endOfMonth(current)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd })

  // Week
  const weekStart = startOfWeek(current, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(current, { weekStartsOn: 1 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  // List: upcoming
  const listLives = lives
    .filter(l => l.date && l.date >= format(new Date(), 'yyyy-MM-dd'))
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))

  return (
    <div>
      <PageHeader
        title="Ημερολόγιο"
        subtitle={view === 'month'
          ? format(current, 'MMMM yyyy', { locale: el })
          : view === 'week'
          ? `${format(weekStart, 'd MMM', { locale: el })} - ${format(weekEnd, 'd MMM yyyy', { locale: el })}`
          : 'Επόμενα Events'
        }
        icon={<CalIcon size={18} color="var(--terra)" />}
        action={
          <div className="flex items-center gap-2">
            <button onClick={exportICS} className="btn btn-secondary btn-sm">
              <Download size={14} /> Export .ics
            </button>
            <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
              {(['month', 'week', 'list'] as ViewMode[]).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className="btn btn-sm"
                  style={{
                    borderRadius: 0,
                    background: view === v ? 'var(--terra)' : 'var(--bg-overlay)',
                    color: view === v ? 'white' : 'var(--text-secondary)',
                    border: 'none',
                  }}>
                  {v === 'month' ? <Grid3X3 size={14} /> : v === 'week' ? '7D' : <List size={14} />}
                </button>
              ))}
            </div>
          </div>
        }
      />

      <div className="p-6">
        {/* Nav bar */}
        {view !== 'list' && (
          <div className="flex items-center justify-between mb-5">
            <button onClick={prev} className="btn btn-secondary btn-sm"><ChevronLeft size={16} /></button>
            <button onClick={() => setCurrent(new Date())} className="btn btn-secondary btn-sm">Σήμερα</button>
            <button onClick={next} className="btn btn-secondary btn-sm"><ChevronRight size={16} /></button>
          </div>
        )}

        {/* Legend */}
        <div className="flex gap-4 mb-4 flex-wrap">
          {[
            { s: 'confirmed', label: 'Επιβεβαιωμένο' },
            { s: 'pending', label: 'Αναμονή' },
            { s: 'completed', label: 'Ολοκληρωμένο' },
            { s: 'cancelled', label: 'Ακυρωμένο' },
            { s: 'inquiry', label: 'Ερώτημα' },
          ].map(({ s, label }) => (
            <div key={s} className="flex items-center gap-1.5">
              <div className={`cal-event ${s}`} style={{ width: 28, height: 12, borderRadius: 3 }} />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{label}</span>
            </div>
          ))}
        </div>

        {loading ? <Spinner /> : view === 'month' ? (
          <MonthView calDays={calDays} current={current} livesForDay={livesForDay} />
        ) : view === 'week' ? (
          <WeekView weekDays={weekDays} livesForDay={livesForDay} />
        ) : (
          <ListView lives={listLives} />
        )}
      </div>
    </div>
  )
}

function MonthView({ calDays, current, livesForDay }: {
  calDays: Date[]; current: Date; livesForDay: (d: Date) => Live[]
}) {
  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {DAYS_GR.map(d => (
          <div key={d} className="text-center py-2" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {calDays.map(day => {
          const dayLives = livesForDay(day)
          const inMonth = isSameMonth(day, current)
          const today = isToday(day)
          return (
            <div key={day.toString()} className={`cal-day ${!inMonth ? 'other-month' : ''} ${today ? 'today' : ''}`}>
              <div className="flex items-center justify-between mb-1">
                <span style={{
                  fontSize: '0.78rem',
                  fontWeight: today ? 800 : 500,
                  color: today ? 'var(--terra)' : 'var(--text-secondary)',
                  background: today ? 'var(--terra-glow)' : 'transparent',
                  borderRadius: '50%',
                  width: 22, height: 22,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {format(day, 'd')}
                </span>
                {dayLives.length > 2 && (
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>+{dayLives.length - 1}</span>
                )}
              </div>
              {dayLives.slice(0, 2).map(live => (
                <Link key={live.id} href={`/lives/${live.id}`}
                  className={`cal-event ${live.status}`}
                  style={{ display: 'block', textDecoration: 'none' }}>
                  {live.title}
                </Link>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WeekView({ weekDays, livesForDay }: { weekDays: Date[]; livesForDay: (d: Date) => Live[] }) {
  return (
    <div className="grid grid-cols-7 gap-3">
      {weekDays.map(day => {
        const dayLives = livesForDay(day)
        const today = isToday(day)
        return (
          <div key={day.toString()}>
            <div className="text-center mb-2">
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                {format(day, 'EEE', { locale: el })}
              </div>
              <div style={{
                fontSize: '1.3rem', fontWeight: 800,
                color: today ? 'var(--terra)' : 'var(--text-primary)',
                fontFamily: 'var(--font-display)'
              }}>
                {format(day, 'd')}
              </div>
            </div>
            <div className="space-y-1.5 min-h-[200px] p-2 rounded-xl border"
              style={{ borderColor: today ? 'var(--terra)' : 'var(--border)', background: 'var(--bg-raised)' }}>
              {dayLives.map(live => (
                <Link key={live.id} href={`/lives/${live.id}`}
                  className={`cal-event block`}
                  style={{
                    whiteSpace: 'normal', fontSize: '0.72rem', padding: '6px 8px',
                    textDecoration: 'none',
                    background: live.status === 'confirmed' ? 'rgba(39,174,96,0.15)'
                      : live.status === 'completed' ? 'rgba(74,127,193,0.15)'
                      : live.status === 'cancelled' ? 'rgba(231,76,60,0.12)'
                      : live.status === 'pending' ? 'rgba(245,158,11,0.15)'
                      : 'rgba(160,152,128,0.12)',
                    color: live.status === 'confirmed' ? 'var(--green)'
                      : live.status === 'completed' ? 'var(--sea)'
                      : live.status === 'cancelled' ? 'var(--red)'
                      : live.status === 'pending' ? 'var(--amber)'
                      : 'var(--text-muted)',
                  }}>
                  <p className="font-bold truncate">{live.title}</p>
                  {live.time_start && <p style={{ opacity: 0.8 }}>{formatTime(live.time_start)}</p>}
                </Link>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ListView({ lives }: { lives: Live[] }) {
  if (lives.length === 0) return (
    <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
      Δεν υπάρχουν επερχόμενα events
    </div>
  )

  // Group by month
  const grouped: Record<string, Live[]> = {}
  for (const live of lives) {
    const key = live.date ? format(parseISO(live.date), 'MMMM yyyy', { locale: el }) : 'Άγνωστο'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(live)
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([month, monthLives]) => (
        <div key={month}>
          <h3 className="text-sm font-bold uppercase tracking-wider mb-3"
            style={{ color: 'var(--terra)' }}>{month}</h3>
          <div className="space-y-2">
            {monthLives.map(live => (
              <Link key={live.id} href={`/lives/${live.id}`}
                className="flex items-center gap-4 p-4 rounded-xl table-row"
                style={{ display: 'flex', textDecoration: 'none' }}>
                <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--bg-overlay)' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 800, lineHeight: 1 }}>
                    {live.date ? format(parseISO(live.date), 'd') : '?'}
                  </span>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {live.date ? format(parseISO(live.date), 'EEE', { locale: el }) : ''}
                  </span>
                </div>
                <div className="flex-1">
                  <p style={{ fontWeight: 700 }}>{live.title}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {live.venues?.name || live.city} {live.time_start ? `· ${formatTime(live.time_start)}` : ''}
                  </p>
                </div>
                <span className={`badge badge-${live.status}`}>{LIVE_STATUS_LABELS[live.status]}</span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
