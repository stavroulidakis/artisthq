'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDate, formatTime } from '@/lib/utils'
import { getLiveCategories, getLiveStatuses, getStatusLabel, getStatusBadgeClass, StatusEntry } from '@/lib/lists'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState, Spinner } from '@/components/ui/PageHeader'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/Toast'
import { Music2, Plus, Search, Trash2, Eye, Calendar, Clock } from 'lucide-react'
import Link from 'next/link'
import type { Live, Client } from '@/lib/supabase'

export default function LivesPage() {
  const { toast } = useToast()
  const [lives, setLives] = useState<Live[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [statusEntries, setStatusEntries] = useState<StatusEntry[]>([])

  const emptyForm = {
    title: '', date: '', category: '', client_id: '',
    city: '', status: 'confirmed', agreed_amount: '', deposit: '', notes: '',
  }
  const [form, setForm] = useState(emptyForm)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: livesData, error: livesError }, { data: clientsData }] = await Promise.all([
      supabase.from('lives').select('*, venues(name,city), clients(name)').order('date', { ascending: false }),
      supabase.from('clients').select('id,name').order('name'),
    ])
    if (livesError) console.error('Lives load error:', livesError.message)
    setLives((livesData || []) as Live[])
    setClients((clientsData || []) as Client[])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    setCategories(getLiveCategories())
    setStatusEntries(getLiveStatuses())
  }, [load])

  const years = Array.from(
    new Set(lives.map(l => l.date?.slice(0, 4)).filter(Boolean) as string[])
  ).sort().reverse()

  const filtered = lives.filter(l => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      l.title.toLowerCase().includes(q) ||
      l.clients?.name?.toLowerCase().includes(q) ||
      l.venues?.name?.toLowerCase().includes(q) ||
      l.city?.toLowerCase().includes(q)
    const matchStatus = !filterStatus || l.status === filterStatus
    const matchCat = !filterCategory || l.category === filterCategory
    const matchYear = !filterYear || l.date?.startsWith(filterYear)
    return matchSearch && matchStatus && matchCat && matchYear
  })

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const agreed = form.agreed_amount ? parseFloat(form.agreed_amount) : null
    const dep = form.deposit ? parseFloat(form.deposit) : null
    const balance = agreed !== null && dep !== null ? agreed - dep : agreed

    const { error } = await supabase.from('lives').insert({
      title: form.title,
      date: form.date || null,
      category: form.category || null,
      client_id: form.client_id || null,
      city: form.city || null,
      status: form.status,
      agreed_amount: agreed,
      deposit: dep,
      balance,
      notes: form.notes || null,
    })
    setSaving(false)
    if (error) { toast('Σφάλμα: ' + error.message, 'error'); return }
    toast('Live δημιουργήθηκε!', 'success')
    setShowCreate(false)
    setForm(emptyForm)
    load()
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    const { error } = await supabase.from('lives').delete().eq('id', deleteId)
    setDeleting(false)
    if (error) { toast('Σφάλμα: ' + error.message, 'error'); return }
    toast('Live διαγράφηκε', 'success')
    setDeleteId(null)
    load()
  }

  return (
    <div>
      <PageHeader
        title="Lives"
        subtitle={`${filtered.length} από ${lives.length} συνολικά`}
        icon={<Music2 size={18} color="var(--terra)" />}
        action={
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Νέο Live
          </button>
        }
      />

      <div className="p-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-48">
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input" style={{ paddingLeft: 32 }} placeholder="Αναζήτηση..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="select w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Όλες Καταστ.</option>
            {statusEntries.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select className="select w-auto" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="">Όλοι Τύποι</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="select w-auto" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
            <option value="">Όλα τα Έτη</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {loading ? <Spinner /> : filtered.length === 0 ? (
          <EmptyState icon={Music2} title="Δεν βρέθηκαν lives"
            description="Δημιούργησε το πρώτο live"
            action={<button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={15} />Νέο Live</button>} />
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--bg-overlay)' }}>
                  {['Τίτλος', 'Ημ/νία', 'Χώρος/Πόλη', 'Κατηγορία', 'Κατάσταση', 'Ποσό', 'Πληρ.', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left" style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(live => (
                  <tr key={live.id} className="table-row">
                    <td className="px-4 py-3">
                      <p style={{ fontWeight: 700 }}>{live.title}</p>
                      {live.clients?.name && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{live.clients.name}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1" style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                        <Calendar size={12} />{formatDate(live.date)}
                      </div>
                      {live.time_start && (
                        <div className="flex items-center gap-1" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          <Clock size={11} />{formatTime(live.time_start)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div style={{ fontSize: '0.82rem' }}>{live.venues?.name || live.city || '—'}</div>
                      {live.region && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{live.region}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{live.category || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${getStatusBadgeClass(live.status)}`}>
                        {getStatusLabel(live.status, statusEntries)}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ fontWeight: 700, color: 'var(--green)' }}>
                      {live.agreed_amount ? formatCurrency(live.agreed_amount) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${live.is_paid ? 'badge-paid' : 'badge-unpaid'}`}>
                        {live.is_paid ? 'Εξοφλήθη' : 'Ανεξόφλ.'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Link href={`/lives/${live.id}`} className="btn btn-ghost btn-xs" title="Προβολή"><Eye size={13} /></Link>
                        <button onClick={() => setDeleteId(live.id)} className="btn btn-ghost btn-xs" title="Διαγραφή"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => { setShowCreate(false); setForm(emptyForm) }} title="Νέο Live">
        <form onSubmit={handleCreate}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Τίτλος *</label>
              <input required className="input" placeholder="π.χ. Γάμος Παπαδάκη" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="label">Ημερομηνία</label>
              <input type="date" className="input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label className="label">Κατηγορία</label>
              <select className="select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option value="">— Επιλογή —</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Πελάτης</label>
              <select className="select" value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })}>
                <option value="">— Κανείς —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Πόλη</label>
              <input className="input" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
            </div>
            <div>
              <label className="label">Κατάσταση</label>
              <select className="select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {statusEntries.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Ποσό (€)</label>
              <input type="number" step="0.01" className="input" value={form.agreed_amount} onChange={e => setForm({ ...form, agreed_amount: e.target.value })} />
            </div>
            <div>
              <label className="label">Προκαταβολή (€)</label>
              <input type="number" step="0.01" className="input" value={form.deposit} onChange={e => setForm({ ...form, deposit: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="label">Σημειώσεις</label>
              <textarea className="textarea" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 justify-end mt-5">
            <button type="button" onClick={() => { setShowCreate(false); setForm(emptyForm) }} className="btn btn-secondary">Ακύρωση</button>
            <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Αποθήκευση...' : 'Δημιουργία'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        loading={deleting} title="Διαγραφή Live" message="Το live και όλα τα δεδομένα του θα διαγραφούν μόνιμα." />
    </div>
  )
}
