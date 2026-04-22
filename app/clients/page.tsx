'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { REGIONS } from '@/lib/utils'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState, Spinner } from '@/components/ui/PageHeader'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/Toast'
import { Users, Plus, Search, Trash2, Eye, Star, Phone, Mail } from 'lucide-react'
import Link from 'next/link'
import type { Client } from '@/lib/supabase'

const CLIENT_TYPES = ['Ιδιώτης', 'Εταιρεία', 'Γεγονός', 'Venue', 'Άλλο']

export default function ClientsPage() {
  const { toast } = useToast()
  const [clients, setClients] = useState<Client[]>([])
  const [liveCounts, setLiveCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editClient, setEditClient] = useState<Client | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const emptyForm = { name: '', type: '', phone: '', email: '', address: '', region: '', notes: '' }
  const [form, setForm] = useState(emptyForm)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: clientsData }, { data: livesData }] = await Promise.all([
      supabase.from('clients').select('*').order('name'),
      supabase.from('lives').select('client_id').not('client_id', 'is', null),
    ])
    setClients(clientsData as Client[] || [])
    const counts: Record<string, number> = {}
    ;(livesData || []).forEach(l => { if (l.client_id) counts[l.client_id] = (counts[l.client_id] || 0) + 1 })
    setLiveCounts(counts)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openCreate() { setForm(emptyForm); setEditClient(null); setShowCreate(true) }
  function openEdit(c: Client) {
    setForm({ name: c.name, type: c.type || '', phone: c.phone || '', email: c.email || '', address: c.address || '', region: c.region || '', notes: c.notes || '' })
    setEditClient(c); setShowCreate(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const payload = { name: form.name, type: form.type || null, phone: form.phone || null, email: form.email || null, address: form.address || null, region: form.region || null, notes: form.notes || null }
    const { error } = editClient
      ? await supabase.from('clients').update(payload).eq('id', editClient.id)
      : await supabase.from('clients').insert(payload)
    setSaving(false)
    if (error) { toast('Σφάλμα: ' + error.message, 'error'); return }
    toast(editClient ? 'Ενημερώθηκε!' : 'Πελάτης προστέθηκε!', 'success')
    setShowCreate(false); load()
  }

  async function handleDelete() {
    if (!deleteId) return; setDeleting(true)
    const { error } = await supabase.from('clients').delete().eq('id', deleteId)
    setDeleting(false)
    if (error) { toast('Σφάλμα: ' + error.message, 'error'); return }
    toast('Διαγράφηκε', 'success'); setDeleteId(null); load()
  }

  const filtered = clients.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search) || (c.region || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <PageHeader
        title="Πελάτες"
        subtitle={`${clients.length} πελάτες`}
        icon={<Users size={18} color="var(--terra)" />}
        action={<button className="btn btn-primary" onClick={openCreate}><Plus size={16} />Νέος Πελάτης</button>}
      />

      <div className="p-6 space-y-4">
        <div className="relative max-w-sm">
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input" style={{ paddingLeft: 32 }} placeholder="Αναζήτηση..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? <Spinner /> : filtered.length === 0 ? (
          <EmptyState icon={Users} title="Δεν βρέθηκαν πελάτες" description="Πρόσθεσε τον πρώτο πελάτη"
            action={<button className="btn btn-primary" onClick={openCreate}><Plus size={15} />Νέος</button>} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(c => (
              <div key={c.id} className="card card-hover" onClick={() => window.location.href = `/clients/${c.id}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0"
                    style={{ background: 'var(--terra-glow)', color: 'var(--terra)', fontFamily: 'var(--font-display)' }}>
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex gap-1">
                    <Link href={`/clients/${c.id}`} className="btn btn-ghost btn-xs" onClick={e => e.stopPropagation()}><Eye size={13} /></Link>
                    <button className="btn btn-ghost btn-xs" onClick={e => { e.stopPropagation(); openEdit(c) }}><Star size={13} /></button>
                    <button className="btn btn-ghost btn-xs" onClick={e => { e.stopPropagation(); setDeleteId(c.id) }}><Trash2 size={13} /></button>
                  </div>
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 4 }}>{c.name}</h3>
                {c.type && <span className="badge" style={{ background: 'var(--bg-overlay)', color: 'var(--text-secondary)', marginBottom: 8, display: 'inline-block' }}>{c.type}</span>}
                <div className="space-y-1">
                  {c.phone && <p className="flex items-center gap-2" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}><Phone size={12} />{c.phone}</p>}
                  {c.email && <p className="flex items-center gap-2" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}><Mail size={12} /><span className="truncate">{c.email}</span></p>}
                  {c.region && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.region}</p>}
                </div>
                {(liveCounts[c.id] || 0) > 0 && (
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--terra)', fontWeight: 700 }}>
                      {liveCounts[c.id]} live{liveCounts[c.id] !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                <div className="mt-2 flex gap-2">
                  {c.reliability_score && (
                    <div className="flex items-center gap-1">
                      <Star size={11} style={{ color: 'var(--amber)' }} />
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Αξιοπ: {c.reliability_score}/10</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={editClient ? 'Επεξεργασία Πελάτη' : 'Νέος Πελάτης'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="label">Όνομα *</label>
            <input required className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Τύπος</label>
              <select className="select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="">—</option>{CLIENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select></div>
            <div><label className="label">Περιοχή</label>
              <select className="select" value={form.region} onChange={e => setForm({ ...form, region: e.target.value })}>
                <option value="">—</option>{REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select></div>
            <div><label className="label">Τηλέφωνο</label>
              <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div><label className="label">Email</label>
              <input type="email" className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          </div>
          <div><label className="label">Διεύθυνση</label>
            <input className="input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
          <div><label className="label">Σημειώσεις</label>
            <textarea className="textarea" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowCreate(false)} className="btn btn-secondary">Ακύρωση</button>
            <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Αποθήκευση...' : 'Αποθήκευση'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        loading={deleting} title="Διαγραφή Πελάτη" message="Ο πελάτης θα διαγραφεί μόνιμα." />
    </div>
  )
}
