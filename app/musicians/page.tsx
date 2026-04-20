'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, MUSICIAN_ROLES } from '@/lib/utils'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState, Spinner } from '@/components/ui/PageHeader'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/Toast'
import { UserCheck, Plus, Search, Trash2, Eye, Phone, Mail, Euro, ToggleLeft, ToggleRight } from 'lucide-react'
import Link from 'next/link'
import type { Musician } from '@/lib/supabase'

export default function MusiciansPage() {
  const { toast } = useToast()
  const [musicians, setMusicians] = useState<Musician[]>([])
  const [participationCounts, setParticipationCounts] = useState<Record<string, { count: number; total: number }>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterActive, setFilterActive] = useState<'' | 'true' | 'false'>('')
  const [showCreate, setShowCreate] = useState(false)
  const [editItem, setEditItem] = useState<Musician | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const emptyForm = { name: '', role: '', phone: '', email: '', default_fee: '', notes: '', is_active: true }
  const [form, setForm] = useState<any>(emptyForm)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: musData }, { data: lmData }] = await Promise.all([
      supabase.from('musicians').select('*').order('name'),
      supabase.from('live_musicians').select('musician_id, agreed_fee'),
    ])
    setMusicians(musData as Musician[] || [])
    const counts: Record<string, { count: number; total: number }> = {}
    ;(lmData || []).forEach(lm => {
      if (!counts[lm.musician_id]) counts[lm.musician_id] = { count: 0, total: 0 }
      counts[lm.musician_id].count++
      counts[lm.musician_id].total += lm.agreed_fee || 0
    })
    setParticipationCounts(counts)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openCreate() { setForm(emptyForm); setEditItem(null); setShowCreate(true) }
  function openEdit(m: Musician) {
    setForm({ name: m.name, role: m.role || '', phone: m.phone || '', email: m.email || '', default_fee: m.default_fee || '', notes: m.notes || '', is_active: m.is_active })
    setEditItem(m); setShowCreate(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const payload = {
      name: form.name, role: form.role || null, phone: form.phone || null, email: form.email || null,
      default_fee: form.default_fee ? parseFloat(form.default_fee) : null,
      notes: form.notes || null, is_active: form.is_active,
    }
    const { error } = editItem
      ? await supabase.from('musicians').update(payload).eq('id', editItem.id)
      : await supabase.from('musicians').insert(payload)
    setSaving(false)
    if (error) { toast('Σφάλμα', 'error'); return }
    toast(editItem ? 'Ενημερώθηκε!' : 'Μουσικός προστέθηκε!', 'success')
    setShowCreate(false); load()
  }

  async function handleToggleActive(m: Musician) {
    await supabase.from('musicians').update({ is_active: !m.is_active }).eq('id', m.id)
    load()
  }

  async function handleDelete() {
    if (!deleteId) return; setDeleting(true)
    await supabase.from('musicians').delete().eq('id', deleteId)
    setDeleting(false); toast('Διαγράφηκε', 'success'); setDeleteId(null); load()
  }

  const filtered = musicians.filter(m => {
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || (m.role || '').toLowerCase().includes(search.toLowerCase())
    const matchActive = !filterActive || String(m.is_active) === filterActive
    return matchSearch && matchActive
  })

  return (
    <div>
      <PageHeader
        title="Μουσικοί"
        subtitle={`${musicians.filter(m => m.is_active).length} ενεργοί`}
        icon={<UserCheck size={18} color="var(--terra)" />}
        action={<button className="btn btn-primary" onClick={openCreate}><Plus size={16} />Νέος Μουσικός</button>}
      />

      <div className="p-6 space-y-4">
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input" style={{ paddingLeft: 32 }} placeholder="Αναζήτηση..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="select w-auto" value={filterActive} onChange={e => setFilterActive(e.target.value as any)}>
            <option value="">Όλοι</option>
            <option value="true">Ενεργοί</option>
            <option value="false">Ανενεργοί</option>
          </select>
        </div>

        {loading ? <Spinner /> : filtered.length === 0 ? (
          <EmptyState icon={UserCheck} title="Δεν βρέθηκαν μουσικοί" description="Πρόσθεσε μουσικούς"
            action={<button className="btn btn-primary" onClick={openCreate}><Plus size={15} />Νέος</button>} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(m => {
              const stats = participationCounts[m.id]
              return (
                <div key={m.id} className="card card-hover">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold"
                        style={{ background: m.is_active ? 'rgba(74,127,193,0.15)' : 'var(--bg-overlay)', color: m.is_active ? 'var(--sea)' : 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
                        {m.name.charAt(0)}
                      </div>
                      <div>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>{m.name}</h3>
                        {m.role && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{m.role}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Link href={`/musicians/${m.id}`} className="btn btn-ghost btn-xs"><Eye size={13} /></Link>
                      <button className="btn btn-ghost btn-xs" onClick={() => openEdit(m)}>✏️</button>
                      <button className="btn btn-ghost btn-xs" onClick={() => handleToggleActive(m)}>
                        {m.is_active ? <ToggleRight size={15} style={{ color: 'var(--green)' }} /> : <ToggleLeft size={15} />}
                      </button>
                      <button className="btn btn-ghost btn-xs" onClick={() => setDeleteId(m.id)}><Trash2 size={13} /></button>
                    </div>
                  </div>

                  {m.default_fee && (
                    <div className="flex items-center gap-1 mb-2">
                      <Euro size={12} style={{ color: 'var(--amber)' }} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--amber)' }}>{formatCurrency(m.default_fee)}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>/ live</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    {m.phone && <p className="flex items-center gap-2" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}><Phone size={11} />{m.phone}</p>}
                    {m.email && <p className="flex items-center gap-2" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}><Mail size={11} /><span className="truncate">{m.email}</span></p>}
                  </div>

                  {stats && (
                    <div className="mt-3 pt-3 border-t flex gap-4" style={{ borderColor: 'var(--border)' }}>
                      <div>
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Συμμετοχές</p>
                        <p style={{ fontWeight: 800, color: 'var(--sea)' }}>{stats.count}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Σύνολο</p>
                        <p style={{ fontWeight: 800, color: 'var(--green)', fontSize: '0.9rem' }}>{formatCurrency(stats.total)}</p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={editItem ? 'Επεξεργασία Μουσικού' : 'Νέος Μουσικός'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="label">Όνομα *</label>
            <input required className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Ρόλος / Όργανο</label>
              <select className="select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="">—</option>{MUSICIAN_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select></div>
            <div><label className="label">Default Αμοιβή (€)</label>
              <input type="number" step="0.01" className="input" value={form.default_fee} onChange={e => setForm({ ...form, default_fee: e.target.value })} /></div>
            <div><label className="label">Τηλέφωνο</label>
              <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div><label className="label">Email</label>
              <input type="email" className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          </div>
          <div><label className="label">Σημειώσεις</label>
            <textarea className="textarea" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
            <span className="text-sm font-semibold">Ενεργός</span>
          </label>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowCreate(false)} className="btn btn-secondary">Ακύρωση</button>
            <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Αποθήκευση...' : 'Αποθήκευση'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        loading={deleting} title="Διαγραφή Μουσικού" message="Ο μουσικός θα διαγραφεί μόνιμα." />
    </div>
  )
}
