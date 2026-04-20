'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDate, LIVE_STATUS_LABELS, REGIONS } from '@/lib/utils'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/PageHeader'
import { useToast } from '@/components/ui/Toast'
import { Users, Save, ArrowLeft, Music2, Phone, Mail, MapPin, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import type { Client, Live } from '@/lib/supabase'

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()
  const [client, setClient] = useState<Client | null>(null)
  const [lives, setLives] = useState<Live[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>({})

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: c }, { data: l }] = await Promise.all([
      supabase.from('clients').select('*').eq('id', id).single(),
      supabase.from('lives').select('*, venues(name)').eq('client_id', id).order('date', { ascending: false }),
    ])
    setClient(c as Client)
    setLives((l || []) as Live[])
    if (c) setForm({
      name: c.name, type: c.type || '', phone: c.phone || '', email: c.email || '',
      address: c.address || '', region: c.region || '', notes: c.notes || '', internal_notes: c.internal_notes || '',
      reliability_score: c.reliability_score || '', quality_score: c.quality_score || '',
      would_collaborate_again: c.would_collaborate_again ?? true,
    })
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase.from('clients').update({
      name: form.name, type: form.type || null, phone: form.phone || null, email: form.email || null,
      address: form.address || null, region: form.region || null, notes: form.notes || null,
      internal_notes: form.internal_notes || null,
      reliability_score: form.reliability_score ? parseInt(form.reliability_score) : null,
      quality_score: form.quality_score ? parseInt(form.quality_score) : null,
      would_collaborate_again: form.would_collaborate_again,
    }).eq('id', id)
    setSaving(false)
    if (error) { toast('Σφάλμα', 'error'); return }
    toast('Αποθηκεύτηκε!', 'success'); setEditing(false); load()
  }

  if (loading) return <Spinner />
  if (!client) return <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>Πελάτης δεν βρέθηκε</div>

  // Yearly stats
  const yearlyStats: Record<string, { count: number; income: number }> = {}
  lives.forEach(l => {
    const y = l.date?.slice(0, 4) || 'Άγνωστο'
    if (!yearlyStats[y]) yearlyStats[y] = { count: 0, income: 0 }
    yearlyStats[y].count++
    yearlyStats[y].income += l.agreed_amount || 0
  })

  const totalIncome = lives.reduce((s, l) => s + (l.agreed_amount || 0), 0)
  const completedLives = lives.filter(l => l.status === 'completed' || l.status === 'confirmed')

  return (
    <div>
      <PageHeader
        title={client.name}
        subtitle={`${lives.length} lives · ${client.region || 'Δεν έχει καταχωρηθεί περιοχή'}`}
        icon={<Users size={18} color="var(--terra)" />}
        action={
          <div className="flex gap-2">
            <Link href="/clients" className="btn btn-secondary btn-sm"><ArrowLeft size={14} />Πίσω</Link>
            {editing ? (
              <>
                <button onClick={() => setEditing(false)} className="btn btn-secondary btn-sm">Ακύρωση</button>
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
        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="stat-card sea">
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Σύνολο Lives</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>{lives.length}</p>
          </div>
          <div className="stat-card green">
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Σύνολο Εσόδων</p>
            <p style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--green)' }}>{formatCurrency(totalIncome)}</p>
          </div>
          <div className="stat-card amber">
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Αξιοπιστία</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--amber)' }}>
              {client.reliability_score ? `${client.reliability_score}/10` : '—'}
            </p>
          </div>
          <div className="stat-card terra">
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Συνεργασία πάλι;</p>
            <p style={{ fontSize: '1rem', fontWeight: 800, color: client.would_collaborate_again ? 'var(--green)' : 'var(--red)' }}>
              {client.would_collaborate_again ? '✓ Ναι' : '✗ Όχι'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Client info */}
          <div className="card lg:col-span-1">
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16 }}>Στοιχεία Πελάτη</h3>
            {editing ? (
              <div className="space-y-3">
                <div><label className="label">Όνομα *</label>
                  <input required className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div><label className="label">Τηλέφωνο</label>
                  <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                <div><label className="label">Email</label>
                  <input type="email" className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                <div><label className="label">Περιοχή</label>
                  <select className="select" value={form.region} onChange={e => setForm({ ...form, region: e.target.value })}>
                    <option value="">—</option>{REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select></div>
                <div><label className="label">Αξιοπιστία (1-10)</label>
                  <input type="number" min="1" max="10" className="input" value={form.reliability_score} onChange={e => setForm({ ...form, reliability_score: e.target.value })} /></div>
                <div><label className="label">Ποιότητα Συνεργ. (1-10)</label>
                  <input type="number" min="1" max="10" className="input" value={form.quality_score} onChange={e => setForm({ ...form, quality_score: e.target.value })} /></div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4" checked={form.would_collaborate_again}
                    onChange={e => setForm({ ...form, would_collaborate_again: e.target.checked })} />
                  <span className="text-sm font-semibold">Θα συνεργαστώ ξανά</span>
                </label>
                <div><label className="label">Σημειώσεις</label>
                  <textarea className="textarea" rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
                <div><label className="label">Εσωτερικές Σημειώσεις</label>
                  <textarea className="textarea" rows={3} value={form.internal_notes} onChange={e => setForm({ ...form, internal_notes: e.target.value })} /></div>
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { icon: Phone, label: 'Τηλέφωνο', value: client.phone },
                  { icon: Mail, label: 'Email', value: client.email },
                  { icon: MapPin, label: 'Περιοχή', value: client.region },
                ].map(({ icon: Icon, label, value }) => value ? (
                  <div key={label} className="flex items-start gap-3">
                    <Icon size={14} style={{ color: 'var(--text-muted)', marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>{label}</p>
                      <p style={{ fontSize: '0.9rem' }}>{value}</p>
                    </div>
                  </div>
                ) : null)}
                {client.notes && (
                  <div className="pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Σημειώσεις</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{client.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Lives & yearly stats */}
          <div className="lg:col-span-2 space-y-4">
            {/* Yearly breakdown */}
            {Object.keys(yearlyStats).length > 0 && (
              <div className="card">
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 12 }}>
                  <TrendingUp size={16} style={{ display: 'inline', marginRight: 6, color: 'var(--terra)' }} />
                  Ανάλυση ανά Έτος
                </h3>
                <table className="w-full text-sm">
                  <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Έτος', 'Lives', 'Έσοδα', 'Μέσος Όρος'].map(h =>
                      <th key={h} className="pb-2 text-left" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {Object.entries(yearlyStats).sort((a, b) => b[0].localeCompare(a[0])).map(([year, stats]) => (
                      <tr key={year} className="table-row">
                        <td className="py-2 font-bold" style={{ color: 'var(--terra)' }}>{year}</td>
                        <td className="py-2">{stats.count}</td>
                        <td className="py-2 font-semibold" style={{ color: 'var(--green)' }}>{formatCurrency(stats.income)}</td>
                        <td className="py-2" style={{ color: 'var(--text-muted)' }}>{formatCurrency(stats.income / stats.count)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Live history */}
            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 12 }}>Ιστορικό Lives</h3>
              {lives.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Δεν υπάρχουν lives</p>
              ) : (
                <div className="space-y-2">
                  {lives.map(l => (
                    <Link key={l.id} href={`/lives/${l.id}`}
                      className="flex items-center justify-between p-3 rounded-xl table-row"
                      style={{ display: 'flex', textDecoration: 'none' }}>
                      <div className="flex items-center gap-3">
                        <Music2 size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        <div>
                          <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{l.title}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {formatDate(l.date)} · {l.venues?.name || l.city || '—'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`badge badge-${l.status}`}>{LIVE_STATUS_LABELS[l.status]}</span>
                        {l.agreed_amount && <span style={{ fontWeight: 700, color: 'var(--green)', fontSize: '0.9rem' }}>{formatCurrency(l.agreed_amount)}</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
