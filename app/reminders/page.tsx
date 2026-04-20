'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDate, REMINDER_TYPES } from '@/lib/utils'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState, Spinner } from '@/components/ui/PageHeader'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { Bell, Plus, CheckCircle2, Circle, Trash2, Calendar, Music2 } from 'lucide-react'
import { isBefore, isAfter, addDays, parseISO } from 'date-fns'
import Link from 'next/link'
import type { Reminder, Live } from '@/lib/supabase'

export default function RemindersPage() {
  const { toast } = useToast()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [lives, setLives] = useState<Live[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'done' | 'all'>('pending')
  const [showCreate, setShowCreate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ type: '', due_date: '', notes: '', live_id: '' })

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: rem }, { data: liv }] = await Promise.all([
      supabase.from('reminders').select('*, lives(title, date)').order('due_date'),
      supabase.from('lives').select('id, title').order('date', { ascending: false }).limit(50),
    ])
    setReminders((rem || []) as Reminder[])
    setLives((liv || []) as Live[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleToggle(r: Reminder) {
    await supabase.from('reminders').update({ is_done: !r.is_done }).eq('id', r.id)
    toast(r.is_done ? 'Επαναφέρθηκε' : 'Ολοκληρώθηκε ✓', 'success')
    load()
  }

  async function handleDelete(id: string) {
    await supabase.from('reminders').delete().eq('id', id)
    toast('Διαγράφηκε', 'success'); load()
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await supabase.from('reminders').insert({
      type: form.type || null, due_date: form.due_date || null,
      notes: form.notes || null, live_id: form.live_id || null, is_done: false
    })
    setSaving(false); toast('Υπενθύμιση δημιουργήθηκε!', 'success')
    setShowCreate(false); setForm({ type: '', due_date: '', notes: '', live_id: '' }); load()
  }

  const now = new Date()
  const soon = addDays(now, 3)

  const filtered = reminders.filter(r => {
    if (filter === 'pending') return !r.is_done
    if (filter === 'done') return r.is_done
    return true
  })

  const overdue = filtered.filter(r => !r.is_done && r.due_date && isBefore(parseISO(r.due_date), now))
  const upcoming = filtered.filter(r => !r.is_done && r.due_date && isAfter(parseISO(r.due_date), now) && isBefore(parseISO(r.due_date), soon))
  const future = filtered.filter(r => !r.is_done && r.due_date && isAfter(parseISO(r.due_date), soon))
  const noDue = filtered.filter(r => !r.is_done && !r.due_date)
  const done = filtered.filter(r => r.is_done)

  const pendingCount = reminders.filter(r => !r.is_done).length

  return (
    <div>
      <PageHeader
        title="Υπενθυμίσεις"
        subtitle={`${pendingCount} εκκρεμείς`}
        icon={<Bell size={18} color="var(--terra)" />}
        action={<button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={16} />Νέα</button>}
      />

      <div className="p-6">
        {/* Filter tabs */}
        <div className="tab-bar mb-5" style={{ maxWidth: 320 }}>
          {[
            { id: 'pending', label: 'Εκκρεμείς' },
            { id: 'done', label: 'Ολοκληρωμένες' },
            { id: 'all', label: 'Όλες' },
          ].map(({ id, label }) => (
            <button key={id} onClick={() => setFilter(id as any)} className={`tab ${filter === id ? 'active' : ''}`}>{label}</button>
          ))}
        </div>

        {loading ? <Spinner /> : filtered.length === 0 ? (
          <EmptyState icon={Bell} title="Δεν υπάρχουν υπενθυμίσεις" description="Πρόσθεσε νέα υπενθύμιση"
            action={<button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={15} />Νέα</button>} />
        ) : (
          <div className="space-y-5">
            {overdue.length > 0 && <Section title="⚠️ Ληξιπρόθεσμες" color="var(--red)" items={overdue} onToggle={handleToggle} onDelete={handleDelete} />}
            {upcoming.length > 0 && <Section title="⏰ Επερχόμενες (3 ημέρες)" color="var(--amber)" items={upcoming} onToggle={handleToggle} onDelete={handleDelete} />}
            {future.length > 0 && <Section title="📅 Μελλοντικές" items={future} onToggle={handleToggle} onDelete={handleDelete} />}
            {noDue.length > 0 && <Section title="📌 Χωρίς ημερομηνία" items={noDue} onToggle={handleToggle} onDelete={handleDelete} />}
            {done.length > 0 && <Section title="✅ Ολοκληρωμένες" color="var(--green)" items={done} onToggle={handleToggle} onDelete={handleDelete} />}
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Νέα Υπενθύμιση" size="sm">
        <form onSubmit={handleCreate} className="space-y-4">
          <div><label className="label">Τύπος</label>
            <select className="select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="">— Επιλογή —</option>
              {REMINDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select></div>
          <div><label className="label">Ημερομηνία</label>
            <input type="date" className="input" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></div>
          <div><label className="label">Live (προαιρετικό)</label>
            <select className="select" value={form.live_id} onChange={e => setForm({ ...form, live_id: e.target.value })}>
              <option value="">— Κανένα —</option>
              {lives.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
            </select></div>
          <div><label className="label">Σημειώσεις</label>
            <textarea className="textarea" rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowCreate(false)} className="btn btn-secondary">Ακύρωση</button>
            <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Αποθήκευση...' : 'Δημιουργία'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function Section({ title, color, items, onToggle, onDelete }: {
  title: string; color?: string
  items: Reminder[]
  onToggle: (r: Reminder) => void
  onDelete: (id: string) => void
}) {
  return (
    <div>
      <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: color || 'var(--text-secondary)', marginBottom: 8 }}>{title}</h3>
      <div className="space-y-2">
        {items.map(r => (
          <div key={r.id} className="card card-sm flex items-start gap-3" style={{ opacity: r.is_done ? 0.65 : 1 }}>
            <button onClick={() => onToggle(r)} className="mt-0.5 flex-shrink-0 transition-transform hover:scale-110">
              {r.is_done
                ? <CheckCircle2 size={18} style={{ color: 'var(--green)' }} />
                : <Circle size={18} style={{ color: 'var(--text-muted)' }} />}
            </button>
            <div className="flex-1 min-w-0">
              <p style={{ fontWeight: 600, fontSize: '0.9rem', textDecoration: r.is_done ? 'line-through' : 'none' }}
                className="truncate">{r.type || r.notes || 'Υπενθύμιση'}</p>
              {r.notes && r.type && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }} className="truncate">{r.notes}</p>}
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {r.due_date && (
                  <span className="flex items-center gap-1" style={{ fontSize: '0.75rem', color: color || 'var(--text-muted)' }}>
                    <Calendar size={11} />{formatDate(r.due_date)}
                  </span>
                )}
                {r.lives && (
                  <Link href={`/lives/${r.live_id ?? ""}`} className="flex items-center gap-1"
                    style={{ fontSize: '0.75rem', color: 'var(--sea)', textDecoration: 'none' }}>
                    <Music2 size={11} />{r.lives.title}
                  </Link>
                )}
              </div>
            </div>
            <button onClick={() => onDelete(r.id)} className="btn btn-ghost btn-xs flex-shrink-0"><Trash2 size={13} /></button>
          </div>
        ))}
      </div>
    </div>
  )
}
