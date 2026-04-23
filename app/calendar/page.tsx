'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { generateICS, downloadICS, formatTime, LIVE_STATUS_LABELS, REMINDER_TYPES } from '@/lib/utils'
import { getLiveCategories, getLiveStatuses, StatusEntry } from '@/lib/lists'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/PageHeader'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { Calendar as CalIcon, ChevronLeft, ChevronRight, Download, List, Grid3X3, Plus, Music2, Bell } from 'lucide-react'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addMonths, subMonths, addWeeks, subWeeks,
  eachDayOfInterval, isSameMonth, parseISO, isToday
} from 'date-fns'
import { el } from 'date-fns/locale'
import Link from 'next/link'
import type { Live, Client, Project } from '@/lib/supabase'

type ViewMode = 'month' | 'week' | 'list'

const DAYS_GR = ['Δευ', 'Τρί', 'Τετ', 'Πέμ', 'Παρ', 'Σαβ', 'Κυρ']

export default function CalendarPage() {
  const { toast } = useToast()
  const [lives, setLives] = useState<Live[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState(new Date())
  const [view, setView] = useState<ViewMode>('month')
  const [categories, setCategories] = useState<string[]>([])
  const [statusEntries, setStatusEntries] = useState<StatusEntry[]>([])

  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  const emptyLiveForm = { title: '', date: '', category: '', client_id: '', city: '', status: 'confirmed', agreed_amount: '', deposit: '', notes: '' }
  const [showNewLive, setShowNewLive] = useState(false)
  const [liveForm, setLiveForm] = useState(emptyLiveForm)
  const [liveSaving, setLiveSaving] = useState(false)

  const emptyRemForm = { type: '', due_date: '', notes: '' }
  const [showNewReminder, setShowNewReminder] = useState(false)
  const [remForm, setRemForm] = useState(emptyRemForm)
  const [remSaving, setRemSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: livesData }, { data: clientsData }, { data: projectsData }] = await Promise.all([
      supabase.from('lives').select('*, venues(name, city), clients(name)').order('date'),
      supabase.from('clients').select('id,name').order('name'),
      supabase.from('projects').select('id,title,date,status,type').order('date'),
    ])
    setLives((livesData || []) as Live[])
    setClients((clientsData || []) as Client[])
    setProjects((projectsData || []) as Project[])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    setCategories(getLiveCategories())
    setStatusEntries(getLiveStatuses())
  }, [load])

  function livesForDay(date: Date) {
    const str = format(date, 'yyyy-MM-dd')
    return lives.filter(l => l.date === str)
  }

  function projectsForDay(date: Date) {
    const str = format(date, 'yyyy-MM-dd')
    return projects.filter(p => p.date === str)
  }

  function exportICS() {
    const content = generateICS(lives)
    downloadICS(content, 'stavrou-lives.ics')
  }

  function handleDayClick(day: Date) {
    setSelectedDay(day)
  }

  function openNewLive() {
    const dateStr = selectedDay ? format(selectedDay, 'yyyy-MM-dd') : ''
    setLiveForm({ ...emptyLiveForm, date: dateStr })
    setSelectedDay(null)
    setShowNewLive(true)
  }

  function openNewReminder() {
    const dateStr = selectedDay ? format(selectedDay, 'yyyy-MM-dd') : ''
    setRemForm({ ...emptyRemForm, due_date: dateStr })
    setSelectedDay(null)
    setShowNewReminder(true)
  }

  async function handleCreateLive(e: React.FormEvent) {
    e.preventDefault()
    setLiveSaving(true)
    const agreed = liveForm.agreed_amount ? parseFloat(liveForm.agreed_amount) : null
    const dep = liveForm.deposit ? parseFloat(liveForm.deposit) : null
    const { error } = await supabase.from('lives').insert({
      title: liveForm.title,
      date: liveForm.date || null,
      category: liveForm.category || null,
      client_id: liveForm.client_id || null,
      city: liveForm.city || null,
      status: liveForm.status,
      agreed_amount: agreed,
      deposit: dep,
      balance: agreed !== null && dep !== null ? agreed - dep : agreed,
      notes: liveForm.notes || null,
    })
    setLiveSaving(false)
    if (error) { toast('Σφάλμα: ' + error.message, 'error'); return }
    toast('Live δημιουργήθηκε!', 'success')
    setShowNewLive(false)
    load()
  }

  async function handleCreateReminder(e: React.FormEvent) {
    e.preventDefault()
    setRemSaving(true)
    const { error } = await supabase.from('reminders').insert({
      type: remForm.type || null,
      due_date: remForm.due_date || null,
      notes: remForm.notes || null,
      is_done: false,
    })
    setRemSaving(false)
    if (error) { toast('Σφάλμα: ' + error.message, 'error'); return }
    toast('Υπενθύμιση προστέθηκε!', 'success')
    setShowNewReminder(false)
  }

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

  const monthStart = startOfMonth(current)
  const monthEnd = endOfMonth(current)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd })

  const weekStart = startOfWeek(current, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(current, { weekStartsOn: 1 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const listLives = lives
    .filter(l => l.date && l.date >= format(new Date(), 'yyyy-MM-dd'))
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))

  const selectedDayLives = selectedDay ? livesForDay(selectedDay) : []
  const selectedDayProjects = selectedDay ? projectsForDay(selectedDay) : []

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
        {view !== 'list' && (
          <div className="flex items-center justify-between mb-5">
            <button onClick={prev} className="btn btn-secondary btn-sm"><ChevronLeft size={16} /></button>
            <button onClick={() => setCurrent(new Date())} className="btn btn-secondary btn-sm">Σήμερα</button>
            <button onClick={next} className="btn btn-secondary btn-sm"><ChevronRight size={16} /></button>
          </div>
        )}

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
          <div className="flex items-center gap-1.5">
            <div style={{ width: 28, height: 12, borderRadius: 3, background: 'rgba(139,92,246,0.3)' }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Project</span>
          </div>
        </div>

        {loading ? <Spinner /> : view === 'month' ? (
          <MonthView calDays={calDays} current={current} livesForDay={livesForDay} projectsForDay={projectsForDay} onDayClick={handleDayClick} />
        ) : view === 'week' ? (
          <WeekView weekDays={weekDays} livesForDay={livesForDay} projectsForDay={projectsForDay} onDayClick={handleDayClick} />
        ) : (
          <ListView
            lives={listLives}
            projects={projects.filter(p => p.date && p.date >= format(new Date(), 'yyyy-MM-dd')).sort((a, b) => (a.date || '').localeCompare(b.date || ''))}
          />
        )}
      </div>

      {/* Day Popup */}
      <Modal
        open={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        title={selectedDay ? format(selectedDay, 'd MMMM yyyy', { locale: el }) : ''}
        size="sm"
      >
        <div className="space-y-4">
          {selectedDayLives.length === 0 && selectedDayProjects.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '8px 0' }}>
              Δεν υπάρχουν events για αυτή την ημέρα
            </p>
          )}
          {selectedDayLives.length > 0 && (
            <div className="space-y-2">
              {selectedDayLives.map(live => (
                <Link
                  key={live.id}
                  href={`/lives/${live.id}`}
                  onClick={() => setSelectedDay(null)}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'var(--bg-overlay)', textDecoration: 'none', display: 'flex' }}
                >
                  <div className={`cal-event ${live.status}`} style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, padding: 0 }} />
                  <div className="flex-1 min-w-0">
                    <p style={{ fontWeight: 700, fontSize: '0.88rem' }} className="truncate">{live.title}</p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {live.time_start ? formatTime(live.time_start) + ' · ' : ''}
                      {live.venues?.name || live.city || LIVE_STATUS_LABELS[live.status]}
                    </p>
                  </div>
                  <span className={`badge badge-${live.status}`} style={{ flexShrink: 0 }}>
                    {LIVE_STATUS_LABELS[live.status]}
                  </span>
                </Link>
              ))}
            </div>
          )}
          {selectedDayProjects.length > 0 && (
            <div className="space-y-2">
              {selectedDayProjects.map(p => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  onClick={() => setSelectedDay(null)}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(139,92,246,0.08)', textDecoration: 'none', display: 'flex' }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: 'rgb(139,92,246)' }} />
                  <div className="flex-1 min-w-0">
                    <p style={{ fontWeight: 700, fontSize: '0.88rem' }} className="truncate">{p.title}</p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.type || 'Project'}</p>
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(139,92,246,0.15)', color: 'rgb(139,92,246)', flexShrink: 0 }}>
                    {p.status || 'Project'}
                  </span>
                </Link>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
            <button onClick={openNewLive} className="btn btn-primary flex-1" style={{ justifyContent: 'center' }}>
              <Music2 size={14} />Νέο Live
            </button>
            <button onClick={openNewReminder} className="btn btn-secondary flex-1" style={{ justifyContent: 'center' }}>
              <Bell size={14} />Νέα Υπενθύμιση
            </button>
          </div>
        </div>
      </Modal>

      {/* New Live Modal */}
      <Modal open={showNewLive} onClose={() => setShowNewLive(false)} title="Νέο Live">
        <form onSubmit={handleCreateLive}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Τίτλος *</label>
              <input required className="input" placeholder="π.χ. Γάμος Παπαδάκη" value={liveForm.title}
                onChange={e => setLiveForm({ ...liveForm, title: e.target.value })} />
            </div>
            <div>
              <label className="label">Ημερομηνία</label>
              <input type="date" className="input" value={liveForm.date}
                onChange={e => setLiveForm({ ...liveForm, date: e.target.value })} />
            </div>
            <div>
              <label className="label">Κατηγορία</label>
              <select className="select" value={liveForm.category}
                onChange={e => setLiveForm({ ...liveForm, category: e.target.value })}>
                <option value="">— Επιλογή —</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Πελάτης</label>
              <select className="select" value={liveForm.client_id}
                onChange={e => setLiveForm({ ...liveForm, client_id: e.target.value })}>
                <option value="">— Κανείς —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Πόλη</label>
              <input className="input" value={liveForm.city}
                onChange={e => setLiveForm({ ...liveForm, city: e.target.value })} />
            </div>
            <div>
              <label className="label">Κατάσταση</label>
              <select className="select" value={liveForm.status}
                onChange={e => setLiveForm({ ...liveForm, status: e.target.value })}>
                {statusEntries.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Ποσό (€)</label>
              <input type="number" step="0.01" className="input" value={liveForm.agreed_amount}
                onChange={e => setLiveForm({ ...liveForm, agreed_amount: e.target.value })} />
            </div>
            <div>
              <label className="label">Προκαταβολή (€)</label>
              <input type="number" step="0.01" className="input" value={liveForm.deposit}
                onChange={e => setLiveForm({ ...liveForm, deposit: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="label">Σημειώσεις</label>
              <textarea className="textarea" rows={2} value={liveForm.notes}
                onChange={e => setLiveForm({ ...liveForm, notes: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 justify-end mt-5">
            <button type="button" onClick={() => setShowNewLive(false)} className="btn btn-secondary">Ακύρωση</button>
            <button type="submit" disabled={liveSaving} className="btn btn-primary">
              {liveSaving ? 'Αποθήκευση...' : 'Δημιουργία'}
            </button>
          </div>
        </form>
      </Modal>

      {/* New Reminder Modal */}
      <Modal open={showNewReminder} onClose={() => setShowNewReminder(false)} title="Νέα Υπενθύμιση" size="sm">
        <form onSubmit={handleCreateReminder} className="space-y-4">
          <div>
            <label className="label">Τύπος</label>
            <select className="select" value={remForm.type}
              onChange={e => setRemForm({ ...remForm, type: e.target.value })}>
              <option value="">—</option>
              {REMINDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Ημερομηνία</label>
            <input type="date" className="input" value={remForm.due_date}
              onChange={e => setRemForm({ ...remForm, due_date: e.target.value })} />
          </div>
          <div>
            <label className="label">Σημειώσεις</label>
            <textarea className="textarea" rows={3} value={remForm.notes}
              onChange={e => setRemForm({ ...remForm, notes: e.target.value })} />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowNewReminder(false)} className="btn btn-secondary">Ακύρωση</button>
            <button type="submit" disabled={remSaving} className="btn btn-primary">
              {remSaving ? 'Αποθήκευση...' : 'Προσθήκη'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function MonthView({ calDays, current, livesForDay, projectsForDay, onDayClick }: {
  calDays: Date[]
  current: Date
  livesForDay: (d: Date) => Live[]
  projectsForDay: (d: Date) => Project[]
  onDayClick: (d: Date) => void
}) {
  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {DAYS_GR.map(d => (
          <div key={d} className="text-center py-2"
            style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {calDays.map(day => {
          const dayLives = livesForDay(day)
          const dayProjects = projectsForDay(day)
          const totalEvents = dayLives.length + dayProjects.length
          const inMonth = isSameMonth(day, current)
          const today = isToday(day)
          return (
            <div
              key={day.toString()}
              className={`cal-day ${!inMonth ? 'other-month' : ''} ${today ? 'today' : ''}`}
              onClick={(e) => { if (!(e.target as HTMLElement).closest('a')) onDayClick(day) }}
              style={{ cursor: 'pointer' }}
            >
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
                {totalEvents > 2 && (
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>+{totalEvents - 1}</span>
                )}
              </div>
              {dayLives.slice(0, 2).map(live => (
                <Link key={live.id} href={`/lives/${live.id}`}
                  className={`cal-event ${live.status}`}
                  style={{ display: 'block', textDecoration: 'none' }}>
                  {live.title}
                </Link>
              ))}
              {dayLives.length === 0 && dayProjects.slice(0, 2).map(p => (
                <Link key={p.id} href={`/projects/${p.id}`}
                  style={{ display: 'block', textDecoration: 'none', fontSize: '0.7rem', padding: '1px 4px', borderRadius: 3, marginBottom: 1, background: 'rgba(139,92,246,0.15)', color: 'rgb(139,92,246)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.title}
                </Link>
              ))}
              {dayLives.length > 0 && dayProjects.length > 0 && (
                <div style={{ fontSize: '0.65rem', color: 'rgb(139,92,246)', fontWeight: 600 }}>
                  +{dayProjects.length} project
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WeekView({ weekDays, livesForDay, projectsForDay, onDayClick }: {
  weekDays: Date[]
  livesForDay: (d: Date) => Live[]
  projectsForDay: (d: Date) => Project[]
  onDayClick: (d: Date) => void
}) {
  return (
    <div className="grid grid-cols-7 gap-3">
      {weekDays.map(day => {
        const dayLives = livesForDay(day)
        const today = isToday(day)
        return (
          <div key={day.toString()}>
            <div className="text-center mb-2" style={{ cursor: 'pointer' }} onClick={() => onDayClick(day)}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                {format(day, 'EEE', { locale: el })}
              </div>
              <div style={{
                fontSize: '1.3rem', fontWeight: 800,
                color: today ? 'var(--terra)' : 'var(--text-primary)',
                fontFamily: 'var(--font-display)',
              }}>
                {format(day, 'd')}
              </div>
            </div>
            <div
              className="space-y-1.5 min-h-[200px] p-2 rounded-xl border"
              style={{ borderColor: today ? 'var(--terra)' : 'var(--border)', background: 'var(--bg-raised)', cursor: 'pointer' }}
              onClick={(e) => { if (!(e.target as HTMLElement).closest('a')) onDayClick(day) }}
            >
              {dayLives.map(live => (
                <Link key={live.id} href={`/lives/${live.id}`}
                  className="block"
                  style={{
                    whiteSpace: 'normal', fontSize: '0.72rem', padding: '6px 8px',
                    textDecoration: 'none', borderRadius: 6,
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
              {projectsForDay(day).map(p => (
                <Link key={p.id} href={`/projects/${p.id}`}
                  className="block"
                  style={{ whiteSpace: 'normal', fontSize: '0.72rem', padding: '6px 8px', textDecoration: 'none', borderRadius: 6, background: 'rgba(139,92,246,0.12)', color: 'rgb(139,92,246)' }}>
                  <p className="font-bold truncate">{p.title}</p>
                  {p.type && <p style={{ opacity: 0.8 }}>{p.type}</p>}
                </Link>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ListView({ lives, projects }: { lives: Live[]; projects: Project[] }) {
  if (lives.length === 0 && projects.length === 0) return (
    <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
      Δεν υπάρχουν επερχόμενα events
    </div>
  )

  type AnyEvent = { date: string; _type: 'live'; live: Live } | { date: string; _type: 'project'; project: Project }
  const allEvents: AnyEvent[] = [
    ...lives.map(l => ({ date: l.date || '', _type: 'live' as const, live: l })),
    ...projects.map(p => ({ date: p.date || '', _type: 'project' as const, project: p })),
  ].sort((a, b) => a.date.localeCompare(b.date))

  const grouped: Record<string, AnyEvent[]> = {}
  for (const ev of allEvents) {
    const key = ev.date ? format(parseISO(ev.date), 'MMMM yyyy', { locale: el }) : 'Άγνωστο'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(ev)
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([month, monthEvents]) => (
        <div key={month}>
          <h3 className="text-sm font-bold uppercase tracking-wider mb-3"
            style={{ color: 'var(--terra)' }}>{month}</h3>
          <div className="space-y-2">
            {monthEvents.map(ev => ev._type === 'live' ? (
              <Link key={ev.live.id} href={`/lives/${ev.live.id}`}
                className="flex items-center gap-4 p-4 rounded-xl table-row"
                style={{ display: 'flex', textDecoration: 'none' }}>
                <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--bg-overlay)' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 800, lineHeight: 1 }}>
                    {ev.live.date ? format(parseISO(ev.live.date), 'd') : '?'}
                  </span>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {ev.live.date ? format(parseISO(ev.live.date), 'EEE', { locale: el }) : ''}
                  </span>
                </div>
                <div className="flex-1">
                  <p style={{ fontWeight: 700 }}>{ev.live.title}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {ev.live.venues?.name || ev.live.city} {ev.live.time_start ? `· ${formatTime(ev.live.time_start)}` : ''}
                  </p>
                </div>
                <span className={`badge badge-${ev.live.status}`}>{LIVE_STATUS_LABELS[ev.live.status]}</span>
              </Link>
            ) : (
              <Link key={ev.project.id} href={`/projects/${ev.project.id}`}
                className="flex items-center gap-4 p-4 rounded-xl table-row"
                style={{ display: 'flex', textDecoration: 'none' }}>
                <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(139,92,246,0.1)' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 800, lineHeight: 1 }}>
                    {ev.project.date ? format(parseISO(ev.project.date), 'd') : '?'}
                  </span>
                  <span style={{ fontSize: '0.6rem', color: 'rgb(139,92,246)', textTransform: 'uppercase' }}>
                    {ev.project.date ? format(parseISO(ev.project.date), 'EEE', { locale: el }) : ''}
                  </span>
                </div>
                <div className="flex-1">
                  <p style={{ fontWeight: 700 }}>{ev.project.title}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{ev.project.type || 'Project'}</p>
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(139,92,246,0.15)', color: 'rgb(139,92,246)' }}>
                  {ev.project.status || 'Project'}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
