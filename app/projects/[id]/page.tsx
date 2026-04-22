'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  getProjectTypes, getProjectStatuses, getExpenseCats,
  getProjectStatusBadgeClass,
  DEFAULT_PROJECT_TYPES, DEFAULT_PROJECT_STATUSES, DEFAULT_EXPENSE_CATS,
} from '@/lib/lists'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/PageHeader'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/Toast'
import { Film, Save, ArrowLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'
import type { Project } from '@/lib/supabase'

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState<any>({})

  const [projectTypes, setProjectTypes] = useState<string[]>(DEFAULT_PROJECT_TYPES)
  const [projectStatuses, setProjectStatuses] = useState<string[]>(DEFAULT_PROJECT_STATUSES)
  const [expenseCats, setExpenseCats] = useState<string[]>(DEFAULT_EXPENSE_CATS)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('projects').select('*').eq('id', id).single()
    const p = data as Project
    setProject(p)
    if (p) {
      const expenses: Record<string, string> = {}
      if (p.expenses) Object.entries(p.expenses).forEach(([k, v]) => { expenses[k] = String(v) })
      setForm({
        title: p.title, type: p.type || '', date: p.date || '',
        budget: p.budget != null ? String(p.budget) : '',
        status: p.status || 'Σχεδιασμός', expenses, notes: p.notes || '',
      })
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    load()
    setProjectTypes(getProjectTypes())
    setProjectStatuses(getProjectStatuses())
    setExpenseCats(getExpenseCats())
  }, [load])

  async function handleSave() {
    setSaving(true)
    const expenses: Record<string, number> = {}
    Object.entries(form.expenses).forEach(([k, v]) => {
      const n = parseFloat(v as string)
      if (!isNaN(n) && n > 0) expenses[k] = n
    })
    const { error } = await supabase.from('projects').update({
      title: form.title,
      type: form.type || null,
      date: form.date || null,
      budget: form.budget ? parseFloat(form.budget) : null,
      status: form.status || null,
      expenses,
      notes: form.notes || null,
    }).eq('id', id)
    setSaving(false)
    if (error) { toast('Σφάλμα', 'error'); return }
    toast('Αποθηκεύτηκε!', 'success'); setEditing(false); load()
  }

  async function handleDelete() {
    setDeleting(true)
    const { error } = await supabase.from('projects').delete().eq('id', id)
    setDeleting(false)
    if (error) { toast('Σφάλμα', 'error'); return }
    toast('Διαγράφηκε', 'success')
    router.push('/projects')
  }

  if (loading) return <Spinner />
  if (!project) return <div className="p-8 text-center">Project δεν βρέθηκε</div>

  const totalExpenses = Object.values(project.expenses || {}).reduce((s, v) => s + v, 0)
  const net = project.budget != null ? project.budget - totalExpenses : null

  return (
    <div>
      <PageHeader
        title={project.title}
        subtitle={project.type || 'Project'}
        icon={<Film size={18} color="var(--terra)" />}
        action={
          <div className="flex gap-2">
            <Link href="/projects" className="btn btn-secondary btn-sm"><ArrowLeft size={14} />Πίσω</Link>
            <button onClick={() => setShowDelete(true)} className="btn btn-secondary btn-sm"><Trash2 size={14} /></button>
            {editing ? (
              <>
                <button onClick={() => { setEditing(false); load() }} className="btn btn-secondary btn-sm">Ακύρωση</button>
                <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm">
                  <Save size={14} />{saving ? 'Αποθήκευση...' : 'Αποθήκευση'}
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} className="btn btn-secondary btn-sm">Επεξεργασία</button>
            )}
          </div>
        }
      />

      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="stat-card sea">
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Ημερομηνία</p>
            <p style={{ fontSize: '1rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>{formatDate(project.date) || '—'}</p>
          </div>
          <div className="stat-card amber">
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Budget</p>
            <p style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--amber)', fontFamily: 'var(--font-display)' }}>
              {project.budget != null ? formatCurrency(project.budget) : '—'}
            </p>
          </div>
          <div className="stat-card red">
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Σύνολο Εξόδων</p>
            <p style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--red)', fontFamily: 'var(--font-display)' }}>
              {formatCurrency(totalExpenses)}
            </p>
          </div>
          <div className="stat-card green">
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Καθαρό</p>
            <p style={{ fontSize: '1.2rem', fontWeight: 800, color: net != null && net >= 0 ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--font-display)' }}>
              {net != null ? formatCurrency(net) : '—'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16 }}>Στοιχεία</h3>
            {editing ? (
              <div className="space-y-3">
                <div><label className="label">Τίτλος *</label>
                  <input required className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
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
                <div><label className="label">Σημειώσεις</label>
                  <textarea className="textarea" rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600 }}>Status</p>
                  {project.status && <span className={`badge ${getProjectStatusBadgeClass(project.status)}`}>{project.status}</span>}
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600 }}>Τύπος</p>
                  <p>{project.type || '—'}</p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600 }}>Ημερομηνία</p>
                  <p>{formatDate(project.date) || '—'}</p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600 }}>Budget</p>
                  <p style={{ color: 'var(--amber)', fontWeight: 700 }}>{project.budget != null ? formatCurrency(project.budget) : '—'}</p>
                </div>
                {project.notes && (
                  <div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600 }}>Σημειώσεις</p>
                    <p style={{ color: 'var(--text-secondary)' }}>{project.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="card lg:col-span-2">
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16 }}>
              {editing ? 'Έξοδα ανά Κατηγορία (€)' : 'Ανάλυση Εξόδων'}
            </h3>
            {editing ? (
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
            ) : totalExpenses === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Δεν υπάρχουν καταγεγραμμένα έξοδα</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th className="pb-2 text-left" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Κατηγορία</th>
                    <th className="pb-2 text-right" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Ποσό</th>
                    <th className="pb-2 text-right" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>%</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(project.expenses || {})
                    .filter(([, v]) => v > 0)
                    .sort(([, a], [, b]) => b - a)
                    .map(([cat, amount]) => (
                      <tr key={cat} className="table-row">
                        <td className="py-2" style={{ fontWeight: 500 }}>{cat}</td>
                        <td className="py-2 text-right" style={{ fontWeight: 700, color: 'var(--red)' }}>{formatCurrency(amount)}</td>
                        <td className="py-2 text-right" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          {Math.round((amount / totalExpenses) * 100)}%
                        </td>
                      </tr>
                    ))}
                  <tr style={{ borderTop: '2px solid var(--border)' }}>
                    <td className="pt-2" style={{ fontWeight: 700 }}>Σύνολο</td>
                    <td className="pt-2 text-right" style={{ fontWeight: 800, color: 'var(--red)' }}>{formatCurrency(totalExpenses)}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog open={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete}
        loading={deleting} title="Διαγραφή Project" message="Το project θα διαγραφεί μόνιμα." />
    </div>
  )
}
