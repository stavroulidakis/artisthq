'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  getProjectTypes, getProjectStatuses, getExpenseCats,
  getProjectStatusBadgeClass,
  DEFAULT_PROJECT_TYPES, DEFAULT_PROJECT_STATUSES, DEFAULT_EXPENSE_CATS,
} from '@/lib/lists'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState, Spinner } from '@/components/ui/PageHeader'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/Toast'
import { Film, Plus, Search, Trash2, Eye } from 'lucide-react'
import type { Project } from '@/lib/supabase'

export default function ProjectsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editItem, setEditItem] = useState<Project | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [projectTypes, setProjectTypes] = useState<string[]>(DEFAULT_PROJECT_TYPES)
  const [projectStatuses, setProjectStatuses] = useState<string[]>(DEFAULT_PROJECT_STATUSES)
  const [expenseCats, setExpenseCats] = useState<string[]>(DEFAULT_EXPENSE_CATS)

  const emptyForm = { title: '', type: '', date: '', budget: '', status: 'Σχεδιασμός', expenses: {} as Record<string, string>, notes: '' }
  const [form, setForm] = useState<any>(emptyForm)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('projects').select('*').order('date', { ascending: false })
    setProjects((data || []) as Project[])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    setProjectTypes(getProjectTypes())
    setProjectStatuses(getProjectStatuses())
    setExpenseCats(getExpenseCats())
  }, [load])

  function openCreate() {
    setForm({ ...emptyForm, expenses: {} })
    setEditItem(null)
    setShowCreate(true)
  }

  function openEdit(p: Project) {
    const expenses: Record<string, string> = {}
    if (p.expenses) Object.entries(p.expenses).forEach(([k, v]) => { expenses[k] = String(v) })
    setForm({
      title: p.title, type: p.type || '', date: p.date || '',
      budget: p.budget != null ? String(p.budget) : '',
      status: p.status || 'Σχεδιασμός', expenses, notes: p.notes || '',
    })
    setEditItem(p)
    setShowCreate(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const expenses: Record<string, number> = {}
    Object.entries(form.expenses).forEach(([k, v]) => {
      const n = parseFloat(v as string)
      if (!isNaN(n) && n > 0) expenses[k] = n
    })
    const payload = {
      title: form.title,
      type: form.type || null,
      date: form.date || null,
      budget: form.budget ? parseFloat(form.budget) : null,
      status: form.status || null,
      expenses,
      notes: form.notes || null,
    }
    const { error } = editItem
      ? await supabase.from('projects').update(payload).eq('id', editItem.id)
      : await supabase.from('projects').insert(payload)
    setSaving(false)
    if (error) { toast('Σφάλμα: ' + error.message, 'error'); return }
    toast(editItem ? 'Ενημερώθηκε!' : 'Project προστέθηκε!', 'success')
    setShowCreate(false); load()
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    const { error } = await supabase.from('projects').delete().eq('id', deleteId)
    setDeleting(false)
    if (error) { toast('Σφάλμα: ' + error.message, 'error'); return }
    toast('Διαγράφηκε', 'success'); setDeleteId(null); load()
  }

  function totalExpenses(p: Project) {
    return Object.values(p.expenses || {}).reduce((s, v) => s + v, 0)
  }

  const filtered = projects.filter(p => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || (p.type || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = !filterStatus || p.status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle={`${projects.length} σύνολο`}
        icon={<Film size={18} color="var(--terra)" />}
        action={<button className="btn btn-primary" onClick={openCreate}><Plus size={16} />Νέο Project</button>}
      />

      <div className="p-6 space-y-4">
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input" style={{ paddingLeft: 32 }} placeholder="Αναζήτηση..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="select w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Όλα τα statuses</option>
            {projectStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {loading ? <Spinner /> : filtered.length === 0 ? (
          <EmptyState icon={Film} title="Δεν βρέθηκαν projects" description="Πρόσθεσε το πρώτο project"
            action={<button className="btn btn-primary" onClick={openCreate}><Plus size={15} />Νέο</button>} />
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-overlay)' }}>
                  {['Τίτλος', 'Τύπος', 'Ημερομηνία', 'Budget', 'Έξοδα', 'Status', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left"
                      style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const expenses = totalExpenses(p)
                  return (
                    <tr key={p.id} className="table-row"
                      style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <td className="px-4 py-2.5">
                        <span style={{ fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{p.title}</span>
                      </td>
                      <td className="px-4 py-2.5" style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        {p.type || '—'}
                      </td>
                      <td className="px-4 py-2.5" style={{ color: 'var(--text-muted)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                        {formatDate(p.date)}
                      </td>
                      <td className="px-4 py-2.5">
                        <span style={{ fontWeight: 700, color: 'var(--amber)', fontSize: '0.9rem' }}>
                          {p.budget != null ? formatCurrency(p.budget) : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span style={{ fontWeight: 700, color: expenses > 0 ? 'var(--red)' : 'var(--text-muted)', fontSize: '0.9rem' }}>
                          {expenses > 0 ? formatCurrency(expenses) : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        {p.status && (
                          <span className={`badge ${getProjectStatusBadgeClass(p.status)}`}>{p.status}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex gap-1 justify-end">
                          <button className="btn btn-ghost btn-xs" onClick={() => router.push(`/projects/${p.id}`)}><Eye size={13} /></button>
                          <button className="btn btn-ghost btn-xs" onClick={() => openEdit(p)}>✏️</button>
                          <button className="btn btn-ghost btn-xs" onClick={() => setDeleteId(p.id)}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={editItem ? 'Επεξεργασία Project' : 'Νέο Project'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="label">Τίτλος *</label>
            <input required className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>

          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Τύπος</label>
              <select className="select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="">—</option>{projectTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select></div>
            <div><label className="label">Status</label>
              <select className="select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {projectStatuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select></div>
            <div><label className="label">Ημερομηνία</label>
              <input type="date" className="input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
            <div><label className="label">Budget (€)</label>
              <input type="number" step="0.01" className="input" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} /></div>
          </div>

          <div>
            <label className="label" style={{ marginBottom: 8 }}>Έξοδα ανά Κατηγορία (€)</label>
            <div className="grid grid-cols-2 gap-2">
              {expenseCats.map(cat => (
                <div key={cat} className="flex items-center gap-2">
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', minWidth: 80, flexShrink: 0 }}>{cat}</span>
                  <input type="number" step="0.01" min="0" className="input" style={{ flex: 1 }}
                    placeholder="0"
                    value={form.expenses[cat] || ''}
                    onChange={e => setForm({ ...form, expenses: { ...form.expenses, [cat]: e.target.value } })} />
                </div>
              ))}
            </div>
          </div>

          <div><label className="label">Σημειώσεις</label>
            <textarea className="textarea" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowCreate(false)} className="btn btn-secondary">Ακύρωση</button>
            <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Αποθήκευση...' : 'Αποθήκευση'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        loading={deleting} title="Διαγραφή Project" message="Το project θα διαγραφεί μόνιμα." />
    </div>
  )
}
