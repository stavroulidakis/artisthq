'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  formatCurrency, formatDate, formatTime, formatDateLong,
  LIVE_STATUS_LABELS, LIVE_CATEGORIES, LIVE_STATUSES, PAYMENT_METHODS,
  REGIONS, FINANCIAL_CATEGORIES, REMINDER_TYPES
} from '@/lib/utils'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/PageHeader'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  Music2, Save, Edit2, X, Plus, Trash2, CheckCircle2, Circle,
  Euro, Users, Star, MessageSquare, TrendingDown, Calendar,
  MapPin, Phone, Clock, AlertCircle, ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import type { Live, LiveMusician, Financial, Negotiation, Evaluation, Reminder, Musician, Client, Venue } from '@/lib/supabase'

type Tab = 'general' | 'financial' | 'musicians' | 'negotiation' | 'evaluation' | 'notes'
const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'general', label: 'Γενικά', icon: Music2 },
  { id: 'financial', label: 'Οικονομικά', icon: Euro },
  { id: 'musicians', label: 'Μουσικοί', icon: Users },
  { id: 'negotiation', label: 'Διαπρ/ση', icon: TrendingDown },
  { id: 'evaluation', label: 'Αξιολόγηση', icon: Star },
  { id: 'notes', label: 'Σημειώσεις', icon: MessageSquare },
]

export default function LiveDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()
  const [live, setLive] = useState<Live | null>(null)
  const [liveMusicians, setLiveMusicians] = useState<LiveMusician[]>([])
  const [financials, setFinancials] = useState<Financial[]>([])
  const [negotiation, setNegotiation] = useState<Negotiation | null>(null)
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null)
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [allMusicians, setAllMusicians] = useState<Musician[]>([])
  const [allClients, setAllClients] = useState<Client[]>([])
  const [allVenues, setAllVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('general')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>({})

  // Modals
  const [showAddMusician, setShowAddMusician] = useState(false)
  const [showAddFinancial, setShowAddFinancial] = useState(false)
  const [showAddReminder, setShowAddReminder] = useState(false)
  const [deleteMusId, setDeleteMusId] = useState<string | null>(null)
  const [deleteFinId, setDeleteFinId] = useState<string | null>(null)

  const [musForm, setMusForm] = useState({ musician_id: '', agreed_fee: '' })
  const [finForm, setFinForm] = useState({ category: '', amount: '', description: '', paid_to: '' })
  const [remForm, setRemForm] = useState({ type: '', due_date: '', notes: '' })

  const load = useCallback(async () => {
    setLoading(true)
    const [
      { data: liveData },
      { data: lm }, { data: fin }, { data: neg }, { data: ev }, { data: rem },
      { data: mus }, { data: clients }, { data: venues }
    ] = await Promise.all([
      supabase.from('lives').select('*, venues(*), clients(*)').eq('id', id).single(),
      supabase.from('live_musicians').select('*, musicians(name,role)').eq('live_id', id),
      supabase.from('financials').select('*, musicians(name)').eq('live_id', id),
      supabase.from('negotiations').select('*').eq('live_id', id).single(),
      supabase.from('evaluations').select('*').eq('live_id', id).single(),
      supabase.from('reminders').select('*').eq('live_id', id).order('due_date'),
      supabase.from('musicians').select('*').eq('is_active', true).order('name'),
      supabase.from('clients').select('*').order('name'),
      supabase.from('venues').select('*').order('name'),
    ])
    const l = liveData as Live
    setLive(l)
    if (l) setForm({
      title: l.title, date: l.date || '', time_start: l.time_start || '',
      time_end: l.time_end || '', venue_id: l.venue_id || '', client_id: l.client_id || '',
      category: l.category || '', status: l.status, city: l.city || '', region: l.region || '',
      agreed_amount: l.agreed_amount || '', deposit: l.deposit || '', deposit_date: l.deposit_date || '',
      balance: l.balance || '', payment_method: l.payment_method || '',
      is_paid: l.is_paid, receipt_issued: l.receipt_issued,
      notes: l.notes || '', internal_notes: l.internal_notes || '',
    })
    setLiveMusicians((lm || []) as LiveMusician[])
    setFinancials((fin || []) as Financial[])
    setNegotiation(neg as Negotiation || null)
    setEvaluation(ev as Evaluation || null)
    setReminders((rem || []) as Reminder[])
    setAllMusicians((mus || []) as Musician[])
    setAllClients((clients || []) as Client[])
    setAllVenues((venues || []) as Venue[])
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  async function handleSave() {
    setSaving(true)
    const agreed = form.agreed_amount ? parseFloat(String(form.agreed_amount)) : null
    const dep = form.deposit ? parseFloat(String(form.deposit)) : null
    const bal = form.balance ? parseFloat(String(form.balance)) : (agreed && dep ? agreed - dep : null)
    const { error } = await supabase.from('lives').update({
      title: form.title, date: form.date || null, time_start: form.time_start || null,
      time_end: form.time_end || null, venue_id: form.venue_id || null, client_id: form.client_id || null,
      category: form.category || null, status: form.status, city: form.city || null, region: form.region || null,
      agreed_amount: agreed, deposit: dep, deposit_date: form.deposit_date || null,
      balance: bal, payment_method: form.payment_method || null,
      is_paid: form.is_paid, receipt_issued: form.receipt_issued,
      notes: form.notes || null, internal_notes: form.internal_notes || null,
    }).eq('id', id)
    setSaving(false)
    if (error) { toast('Σφάλμα αποθήκευσης', 'error'); return }
    toast('Αποθηκεύτηκε!', 'success'); setEditing(false); load()
  }

  async function handleAddMusician(e: React.FormEvent) {
    e.preventDefault()
    const mus = allMusicians.find(m => m.id === musForm.musician_id)
    await supabase.from('live_musicians').insert({
      live_id: id, musician_id: musForm.musician_id,
      agreed_fee: musForm.agreed_fee ? parseFloat(musForm.agreed_fee) : (mus?.default_fee || null),
      is_paid: false,
    })
    toast('Μουσικός προστέθηκε!', 'success')
    setShowAddMusician(false); setMusForm({ musician_id: '', agreed_fee: '' }); load()
  }

  async function handleToggleMusicianPaid(lm: LiveMusician) {
    await supabase.from('live_musicians').update({ is_paid: !lm.is_paid }).eq('id', lm.id)
    load()
  }

  async function handleAddFinancial(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('financials').insert({
      live_id: id, category: finForm.category || null,
      amount: parseFloat(finForm.amount), description: finForm.description || null,
      paid_to: finForm.paid_to || null,
    })
    toast('Καταχωρήθηκε!', 'success')
    setShowAddFinancial(false); setFinForm({ category: '', amount: '', description: '', paid_to: '' }); load()
  }

  async function handleSaveNegotiation(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData(e.target as HTMLFormElement)
    const payload = {
      live_id: id,
      initial_offer: fd.get('initial_offer') ? parseFloat(fd.get('initial_offer') as string) : null,
      counter_offer: fd.get('counter_offer') ? parseFloat(fd.get('counter_offer') as string) : null,
      final_amount: fd.get('final_amount') ? parseFloat(fd.get('final_amount') as string) : null,
      smaller_band_requested: fd.get('smaller_band_requested') === 'on',
      extra_hours_requested: fd.get('extra_hours_requested') === 'on',
      special_terms: fd.get('special_terms') as string || null,
      notes: fd.get('notes') as string || null,
    }
    if (negotiation) await supabase.from('negotiations').update(payload).eq('id', negotiation.id)
    else await supabase.from('negotiations').insert(payload)
    toast('Αποθηκεύτηκε!', 'success'); load()
  }

  async function handleSaveEvaluation(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData(e.target as HTMLFormElement)
    const payload = {
      live_id: id,
      overall_score: fd.get('overall_score') ? parseInt(fd.get('overall_score') as string) : null,
      financially_worthwhile: fd.get('financially_worthwhile') === 'on',
      artistically_worthwhile: fd.get('artistically_worthwhile') === 'on',
      would_do_again: fd.get('would_do_again') === 'on',
      notes_audience: fd.get('notes_audience') as string || null,
      notes_organization: fd.get('notes_organization') as string || null,
      notes_venue: fd.get('notes_venue') as string || null,
      notes_atmosphere: fd.get('notes_atmosphere') as string || null,
    }
    if (evaluation) await supabase.from('evaluations').update(payload).eq('id', evaluation.id)
    else await supabase.from('evaluations').insert(payload)
    toast('Αξιολόγηση αποθηκεύτηκε!', 'success'); load()
  }

  async function handleAddReminder(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('reminders').insert({
      live_id: id, type: remForm.type || null,
      due_date: remForm.due_date || null, notes: remForm.notes || null, is_done: false,
    })
    toast('Υπενθύμιση προστέθηκε!', 'success')
    setShowAddReminder(false); setRemForm({ type: '', due_date: '', notes: '' }); load()
  }

  async function handleToggleReminder(r: Reminder) {
    await supabase.from('reminders').update({ is_done: !r.is_done }).eq('id', r.id)
    load()
  }

  if (loading) return <Spinner />
  if (!live) return <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>Live δεν βρέθηκε</div>

  const totalExpenses = financials.reduce((s, f) => s + (f.amount || 0), 0)
  const totalMusicianFees = liveMusicians.reduce((s, lm) => s + (lm.agreed_fee || 0), 0)
  const netProfit = (live.agreed_amount || 0) - totalExpenses - totalMusicianFees

  return (
    <div>
      <PageHeader
        title={live.title}
        subtitle={live.date ? formatDateLong(live.date) : 'Χωρίς ημερομηνία'}
        icon={<Music2 size={18} color="var(--terra)" />}
        action={
          <div className="flex gap-2">
            <Link href="/lives" className="btn btn-secondary btn-sm"><ArrowLeft size={14} />Πίσω</Link>
            <span className={`badge badge-${live.status}`} style={{ alignSelf: 'center' }}>
              {LIVE_STATUS_LABELS[live.status]}
            </span>
            {editing ? (
              <>
                <button onClick={() => setEditing(false)} className="btn btn-secondary btn-sm"><X size={14} />Ακύρωση</button>
                <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm">
                  <Save size={14} />{saving ? 'Αποθήκευση...' : 'Αποθήκευση'}
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} className="btn btn-secondary btn-sm"><Edit2 size={14} />Επεξεργασία</button>
            )}
          </div>
        }
      />

      {/* Tabs */}
      <div className="px-6 pt-4">
        <div className="tab-bar" style={{ maxWidth: 640 }}>
          {TABS.map(t => {
            const Icon = t.icon
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`tab ${tab === t.id ? 'active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'center' }}>
                <Icon size={13} />{t.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="p-6">
        {/* ==================== TAB: GENERAL ==================== */}
        {tab === 'general' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card space-y-4">
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700 }}>Στοιχεία Live</h3>
              {editing ? (
                <>
                  <div><label className="label">Τίτλος *</label>
                    <input required className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="label">Ημερομηνία</label>
                      <input type="date" className="input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
                    <div><label className="label">Κατηγορία</label>
                      <select className="select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                        <option value="">—</option>
                        {LIVE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select></div>
                    <div><label className="label">Ώρα Έναρξης</label>
                      <input type="time" className="input" value={form.time_start} onChange={e => setForm({ ...form, time_start: e.target.value })} /></div>
                    <div><label className="label">Ώρα Λήξης</label>
                      <input type="time" className="input" value={form.time_end} onChange={e => setForm({ ...form, time_end: e.target.value })} /></div>
                  </div>
                  <div><label className="label">Κατάσταση</label>
                    <select className="select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                      {LIVE_STATUSES.map(s => <option key={s} value={s}>{LIVE_STATUS_LABELS[s]}</option>)}
                    </select></div>
                  <div><label className="label">Πελάτης</label>
                    <select className="select" value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })}>
                      <option value="">—</option>
                      {allClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select></div>
                  <div><label className="label">Χώρος</label>
                    <select className="select" value={form.venue_id} onChange={e => setForm({ ...form, venue_id: e.target.value })}>
                      <option value="">—</option>
                      {allVenues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="label">Πόλη</label>
                      <input className="input" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
                    <div><label className="label">Περιοχή</label>
                      <select className="select" value={form.region} onChange={e => setForm({ ...form, region: e.target.value })}>
                        <option value="">—</option>
                        {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select></div>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  {[
                    { label: 'Ημερομηνία', value: live.date ? formatDateLong(live.date) : '—', icon: Calendar },
                    { label: 'Ώρα', value: live.time_start ? `${formatTime(live.time_start)}${live.time_end ? ' - ' + formatTime(live.time_end) : ''}` : '—', icon: Clock },
                    { label: 'Κατηγορία', value: live.category || '—', icon: Music2 },
                    { label: 'Πελάτης', value: live.clients?.name || '—', icon: Phone },
                    { label: 'Χώρος', value: live.venues?.name || '—', icon: MapPin },
                    { label: 'Πόλη / Περιοχή', value: [live.city, live.region].filter(Boolean).join(', ') || '—', icon: MapPin },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex items-start gap-3">
                      <Icon size={14} style={{ color: 'var(--text-muted)', marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>{label}</p>
                        <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reminders */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700 }}>Υπενθυμίσεις</h3>
                <button className="btn btn-ghost btn-xs" onClick={() => setShowAddReminder(true)}><Plus size={13} /></button>
              </div>
              {reminders.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Δεν υπάρχουν υπενθυμίσεις</p>
              ) : (
                <div className="space-y-2">
                  {reminders.map(r => (
                    <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg"
                      style={{ background: 'var(--bg-overlay)', opacity: r.is_done ? 0.6 : 1 }}>
                      <button onClick={() => handleToggleReminder(r)}>
                        {r.is_done ? <CheckCircle2 size={16} style={{ color: 'var(--green)' }} />
                          : <Circle size={16} style={{ color: 'var(--text-muted)' }} />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize: '0.82rem', fontWeight: 600, textDecoration: r.is_done ? 'line-through' : 'none' }}
                          className="truncate">{r.type || r.notes || '—'}</p>
                        {r.due_date && <p style={{ fontSize: '0.72rem', color: 'var(--terra)' }}>{formatDate(r.due_date)}</p>}
                      </div>
                      <button onClick={async () => { await supabase.from('reminders').delete().eq('id', r.id); load() }}
                        className="btn btn-ghost btn-xs"><Trash2 size={12} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB: FINANCIAL ==================== */}
        {tab === 'financial' && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Συμφωνηθέν', value: formatCurrency(live.agreed_amount), color: 'var(--green)' },
                { label: 'Προκαταβολή', value: formatCurrency(live.deposit), color: 'var(--sea)' },
                { label: 'Υπόλοιπο', value: formatCurrency(live.balance), color: 'var(--amber)' },
                { label: 'Καθαρό Κέρδος', value: formatCurrency(netProfit), color: netProfit >= 0 ? 'var(--green)' : 'var(--red)' },
              ].map(({ label, value, color }) => (
                <div key={label} className="stat-card" style={{ borderTopColor: color }}>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>{label}</p>
                  <p style={{ fontSize: '1.3rem', fontWeight: 800, color, fontFamily: 'var(--font-display)' }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Edit financial fields */}
            {editing && (
              <div className="card grid grid-cols-2 gap-4">
                <div><label className="label">Συμφωνηθέν (€)</label>
                  <input type="number" step="0.01" className="input" value={form.agreed_amount}
                    onChange={e => setForm({ ...form, agreed_amount: e.target.value })} /></div>
                <div><label className="label">Προκαταβολή (€)</label>
                  <input type="number" step="0.01" className="input" value={form.deposit}
                    onChange={e => setForm({ ...form, deposit: e.target.value })} /></div>
                <div><label className="label">Ημ. Προκατ/λής</label>
                  <input type="date" className="input" value={form.deposit_date}
                    onChange={e => setForm({ ...form, deposit_date: e.target.value })} /></div>
                <div><label className="label">Υπόλοιπο (€)</label>
                  <input type="number" step="0.01" className="input" value={form.balance}
                    onChange={e => setForm({ ...form, balance: e.target.value })} /></div>
                <div><label className="label">Τρόπος Πληρωμής</label>
                  <select className="select" value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })}>
                    <option value="">—</option>
                    {PAYMENT_METHODS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select></div>
                <div className="flex items-center gap-4 pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4" checked={form.is_paid}
                      onChange={e => setForm({ ...form, is_paid: e.target.checked })} />
                    <span className="text-sm font-semibold">Εξοφλήθηκε</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4" checked={form.receipt_issued}
                      onChange={e => setForm({ ...form, receipt_issued: e.target.checked })} />
                    <span className="text-sm font-semibold">Απόδειξη</span>
                  </label>
                </div>
              </div>
            )}

            {!editing && (
              <div className="card">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div><p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>Τρόπος Πληρωμής</p>
                    <p style={{ fontWeight: 600 }}>{live.payment_method || '—'}</p></div>
                  <div className="flex items-center gap-2">
                    {live.is_paid
                      ? <><CheckCircle2 size={16} style={{ color: 'var(--green)' }} /><span style={{ color: 'var(--green)', fontWeight: 700 }}>Εξοφλήθηκε</span></>
                      : <><AlertCircle size={16} style={{ color: 'var(--amber)' }} /><span style={{ color: 'var(--amber)', fontWeight: 700 }}>Ανεξόφλητο</span></>}
                  </div>
                  <div className="flex items-center gap-2">
                    {live.receipt_issued
                      ? <><CheckCircle2 size={16} style={{ color: 'var(--green)' }} /><span style={{ color: 'var(--green)', fontWeight: 700 }}>Απόδειξη Εκδόθηκε</span></>
                      : <><Circle size={16} style={{ color: 'var(--text-muted)' }} /><span style={{ color: 'var(--text-muted)' }}>Χωρίς Απόδειξη</span></>}
                  </div>
                </div>
              </div>
            )}

            {/* Additional financials */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Έξοδα & Χρεώσεις</h3>
                <button onClick={() => setShowAddFinancial(true)} className="btn btn-secondary btn-sm"><Plus size={13} />Προσθήκη</button>
              </div>
              {financials.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Δεν υπάρχουν εγγραφές</p>
              ) : (
                <table className="w-full text-sm">
                  <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Κατηγορία', 'Περιγραφή', 'Πληρώθηκε σε', 'Ποσό', ''].map(h =>
                      <th key={h} className="pb-2 text-left" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {financials.map(f => (
                      <tr key={f.id} className="table-row">
                        <td className="py-2 pr-3" style={{ fontSize: '0.82rem' }}>{f.category || '—'}</td>
                        <td className="py-2 pr-3" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{f.description || '—'}</td>
                        <td className="py-2 pr-3" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{f.musicians?.name || '—'}</td>
                        <td className="py-2 pr-3" style={{ fontWeight: 700, color: 'var(--red)' }}>{formatCurrency(f.amount)}</td>
                        <td className="py-2">
                          <button onClick={() => setDeleteFinId(f.id)} className="btn btn-ghost btn-xs"><Trash2 size={12} /></button>
                        </td>
                      </tr>
                    ))}
                    <tr style={{ borderTop: '2px solid var(--border)' }}>
                      <td colSpan={3} className="pt-2 font-bold text-right pr-3" style={{ fontSize: '0.82rem' }}>Σύνολο Εξόδων:</td>
                      <td className="pt-2 font-bold" style={{ color: 'var(--red)' }}>{formatCurrency(totalExpenses)}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB: MUSICIANS ==================== */}
        {tab === 'musicians' && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Μουσικοί Live</h3>
              <button onClick={() => setShowAddMusician(true)} className="btn btn-secondary btn-sm"><Plus size={13} />Προσθήκη</button>
            </div>
            {liveMusicians.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Δεν έχουν προστεθεί μουσικοί</p>
            ) : (
              <table className="w-full text-sm">
                <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Μουσικός', 'Ρόλος', 'Συμφ. Αμοιβή', 'Πληρωμένη', 'Πληρώθηκε', ''].map(h =>
                    <th key={h} className="pb-2 text-left" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {liveMusicians.map(lm => (
                    <tr key={lm.id} className="table-row">
                      <td className="py-3" style={{ fontWeight: 700 }}>{lm.musicians?.name}</td>
                      <td className="py-3" style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{lm.musicians?.role || '—'}</td>
                      <td className="py-3" style={{ color: 'var(--amber)', fontWeight: 700 }}>{formatCurrency(lm.agreed_fee)}</td>
                      <td className="py-3" style={{ color: 'var(--green)', fontWeight: 700 }}>{formatCurrency(lm.paid_fee)}</td>
                      <td className="py-3">
                        <button onClick={() => handleToggleMusicianPaid(lm)}
                          className={`badge ${lm.is_paid ? 'badge-paid' : 'badge-unpaid'}`}
                          style={{ cursor: 'pointer' }}>
                          {lm.is_paid ? 'Πληρώθηκε ✓' : 'Εκκρεμεί'}
                        </button>
                      </td>
                      <td className="py-3">
                        <button onClick={() => setDeleteMusId(lm.id)} className="btn btn-ghost btn-xs"><Trash2 size={12} /></button>
                      </td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: '2px solid var(--border)' }}>
                    <td colSpan={2} className="pt-2 font-bold" style={{ fontSize: '0.82rem' }}>Σύνολο:</td>
                    <td className="pt-2 font-bold" style={{ color: 'var(--amber)' }}>{formatCurrency(totalMusicianFees)}</td>
                    <td colSpan={3}></td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ==================== TAB: NEGOTIATION ==================== */}
        {tab === 'negotiation' && (
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16 }}>Στοιχεία Διαπραγμάτευσης</h3>
            <form onSubmit={handleSaveNegotiation} className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div><label className="label">Αρχική Προσφορά (€)</label>
                  <input name="initial_offer" type="number" step="0.01" className="input" defaultValue={negotiation?.initial_offer || ''} /></div>
                <div><label className="label">Αντιπρόταση (€)</label>
                  <input name="counter_offer" type="number" step="0.01" className="input" defaultValue={negotiation?.counter_offer || ''} /></div>
                <div><label className="label">Τελικό Ποσό (€)</label>
                  <input name="final_amount" type="number" step="0.01" className="input" defaultValue={negotiation?.final_amount || ''} /></div>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input name="smaller_band_requested" type="checkbox" defaultChecked={negotiation?.smaller_band_requested} className="w-4 h-4" />
                  <span className="text-sm">Ζητήθηκε μικρότερο συγκρότημα</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input name="extra_hours_requested" type="checkbox" defaultChecked={negotiation?.extra_hours_requested} className="w-4 h-4" />
                  <span className="text-sm">Ζητήθηκαν επιπλέον ώρες</span>
                </label>
              </div>
              <div><label className="label">Ειδικοί Όροι</label>
                <textarea name="special_terms" className="textarea" defaultValue={negotiation?.special_terms || ''} /></div>
              <div><label className="label">Σημειώσεις Διαπρ/σης</label>
                <textarea name="notes" className="textarea" defaultValue={negotiation?.notes || ''} /></div>
              <button type="submit" className="btn btn-primary"><Save size={14} />Αποθήκευση</button>
            </form>
          </div>
        )}

        {/* ==================== TAB: EVALUATION ==================== */}
        {tab === 'evaluation' && (
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16 }}>Αξιολόγηση Live</h3>
            <form onSubmit={handleSaveEvaluation} className="space-y-4">
              <div><label className="label">Συνολική Βαθμολογία (1-10)</label>
                <input name="overall_score" type="number" min="1" max="10" className="input" style={{ maxWidth: 120 }}
                  defaultValue={evaluation?.overall_score || ''} /></div>
              <div className="flex flex-wrap gap-6">
                {[
                  { name: 'financially_worthwhile', label: 'Οικονομικά αξίζει', checked: evaluation?.financially_worthwhile },
                  { name: 'artistically_worthwhile', label: 'Καλλιτεχνικά αξίζει', checked: evaluation?.artistically_worthwhile },
                  { name: 'would_do_again', label: 'Θα το ξανακέρδαζα', checked: evaluation?.would_do_again },
                ].map(({ name, label, checked }) => (
                  <label key={name} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name={name} defaultChecked={checked ?? false} className="w-4 h-4" />
                    <span className="text-sm font-semibold">{label}</span>
                  </label>
                ))}
              </div>
              {[
                { name: 'notes_audience', label: 'Κοινό' },
                { name: 'notes_organization', label: 'Οργάνωση' },
                { name: 'notes_venue', label: 'Χώρος' },
                { name: 'notes_atmosphere', label: 'Ατμόσφαιρα' },
              ].map(({ name, label }) => (
                <div key={name}>
                  <label className="label">Σημειώσεις: {label}</label>
                  <textarea name={name} className="textarea" rows={2}
                    defaultValue={(evaluation as any)?.[name] || ''} />
                </div>
              ))}
              <button type="submit" className="btn btn-primary"><Save size={14} />Αποθήκευση</button>
            </form>
          </div>
        )}

        {/* ==================== TAB: NOTES ==================== */}
        {tab === 'notes' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card">
              <label className="label">Σημειώσεις (Εξωτερικές)</label>
              <textarea className="textarea" rows={8} value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })} />
              {editing && <button onClick={handleSave} disabled={saving} className="btn btn-primary mt-3">
                <Save size={14} />{saving ? 'Αποθήκευση...' : 'Αποθήκευση'}
              </button>}
              {!editing && <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 8 }}>{live.notes || 'Δεν υπάρχουν σημειώσεις'}</p>}
            </div>
            <div className="card">
              <label className="label">Εσωτερικές Σημειώσεις</label>
              <textarea className="textarea" rows={8} value={form.internal_notes}
                onChange={e => setForm({ ...form, internal_notes: e.target.value })} />
              {!editing && <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 8 }}>{live.internal_notes || 'Δεν υπάρχουν εσωτερικές σημειώσεις'}</p>}
            </div>
          </div>
        )}
      </div>

      {/* ADD MUSICIAN MODAL */}
      <Modal open={showAddMusician} onClose={() => setShowAddMusician(false)} title="Προσθήκη Μουσικού" size="sm">
        <form onSubmit={handleAddMusician} className="space-y-4">
          <div><label className="label">Μουσικός *</label>
            <select required className="select" value={musForm.musician_id} onChange={e => {
              const m = allMusicians.find(x => x.id === e.target.value)
              setMusForm({ musician_id: e.target.value, agreed_fee: m?.default_fee?.toString() || '' })
            }}>
              <option value="">— Επιλογή —</option>
              {allMusicians.map(m => <option key={m.id} value={m.id}>{m.name} ({m.role})</option>)}
            </select></div>
          <div><label className="label">Αμοιβή (€)</label>
            <input type="number" step="0.01" className="input" value={musForm.agreed_fee}
              onChange={e => setMusForm({ ...musForm, agreed_fee: e.target.value })} /></div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowAddMusician(false)} className="btn btn-secondary">Ακύρωση</button>
            <button type="submit" className="btn btn-primary">Προσθήκη</button>
          </div>
        </form>
      </Modal>

      {/* ADD FINANCIAL MODAL */}
      <Modal open={showAddFinancial} onClose={() => setShowAddFinancial(false)} title="Νέο Έξοδο / Χρέωση" size="sm">
        <form onSubmit={handleAddFinancial} className="space-y-4">
          <div><label className="label">Κατηγορία</label>
            <select className="select" value={finForm.category} onChange={e => setFinForm({ ...finForm, category: e.target.value })}>
              <option value="">—</option>
              {FINANCIAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select></div>
          <div><label className="label">Ποσό (€) *</label>
            <input required type="number" step="0.01" className="input" value={finForm.amount}
              onChange={e => setFinForm({ ...finForm, amount: e.target.value })} /></div>
          <div><label className="label">Περιγραφή</label>
            <input className="input" value={finForm.description} onChange={e => setFinForm({ ...finForm, description: e.target.value })} /></div>
          <div><label className="label">Πληρώθηκε σε (Μουσικό)</label>
            <select className="select" value={finForm.paid_to} onChange={e => setFinForm({ ...finForm, paid_to: e.target.value })}>
              <option value="">—</option>
              {allMusicians.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select></div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowAddFinancial(false)} className="btn btn-secondary">Ακύρωση</button>
            <button type="submit" className="btn btn-primary">Προσθήκη</button>
          </div>
        </form>
      </Modal>

      {/* ADD REMINDER MODAL */}
      <Modal open={showAddReminder} onClose={() => setShowAddReminder(false)} title="Νέα Υπενθύμιση" size="sm">
        <form onSubmit={handleAddReminder} className="space-y-4">
          <div><label className="label">Τύπος</label>
            <select className="select" value={remForm.type} onChange={e => setRemForm({ ...remForm, type: e.target.value })}>
              <option value="">—</option>
              {REMINDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select></div>
          <div><label className="label">Ημερομηνία</label>
            <input type="date" className="input" value={remForm.due_date} onChange={e => setRemForm({ ...remForm, due_date: e.target.value })} /></div>
          <div><label className="label">Σημειώσεις</label>
            <textarea className="textarea" rows={2} value={remForm.notes} onChange={e => setRemForm({ ...remForm, notes: e.target.value })} /></div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowAddReminder(false)} className="btn btn-secondary">Ακύρωση</button>
            <button type="submit" className="btn btn-primary">Προσθήκη</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteMusId} onClose={() => setDeleteMusId(null)}
        onConfirm={async () => { await supabase.from('live_musicians').delete().eq('id', deleteMusId!); setDeleteMusId(null); load() }}
        title="Αφαίρεση Μουσικού" message="Ο μουσικός θα αφαιρεθεί από αυτό το live." confirmLabel="Αφαίρεση" />

      <ConfirmDialog open={!!deleteFinId} onClose={() => setDeleteFinId(null)}
        onConfirm={async () => { await supabase.from('financials').delete().eq('id', deleteFinId!); setDeleteFinId(null); load() }}
        title="Διαγραφή Εγγραφής" message="Η οικονομική εγγραφή θα διαγραφεί μόνιμα." />
    </div>
  )
}
