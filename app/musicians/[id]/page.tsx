'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDate, MUSICIAN_ROLES } from '@/lib/utils'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/PageHeader'
import { useToast } from '@/components/ui/Toast'
import { UserCheck, Save, ArrowLeft, CheckCircle2, Circle, Camera } from 'lucide-react'
import Link from 'next/link'
import type { Musician } from '@/lib/supabase'

interface LiveMusWithLive {
  id: string
  live_id: string
  musician_id: string
  agreed_fee?: number
  paid_fee?: number
  is_paid: boolean
  notes?: string
  lives?: {
    title: string
    date?: string
    status: string
    venues?: { name: string } | null
  } | null
}

export default function MusicianDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()
  const [musician, setMusician] = useState<Musician | null>(null)
  const [participations, setParticipations] = useState<LiveMusWithLive[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [form, setForm] = useState<any>({})
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: m }, { data: lm }] = await Promise.all([
      supabase.from('musicians').select('*').eq('id', id).single(),
      supabase.from('live_musicians')
        .select('*, lives(title, date, status, venues(name))')
        .eq('musician_id', id),
    ])
    setMusician(m as Musician)
    const sorted = ((lm || []) as LiveMusWithLive[]).sort((a, b) =>
      (b.lives?.date || '').localeCompare(a.lives?.date || '')
    )
    setParticipations(sorted)
    if (m) setForm({
      name: m.name, role: m.role || '', phone: m.phone || '',
      email: m.email || '', default_fee: m.default_fee || '',
      notes: m.notes || '', is_active: m.is_active
    })
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  async function handleAvatarUpload(file: File) {
    if (!musician) return
    setUploadingAvatar(true)
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `musician-${musician.id}.${ext}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (uploadError) { toast('Σφάλμα upload: ' + uploadError.message, 'error'); setUploadingAvatar(false); return }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
    await supabase.from('musicians').update({ avatar_url: urlData.publicUrl }).eq('id', musician.id)
    setUploadingAvatar(false)
    load()
    toast('Φωτογραφία ανέβηκε!', 'success')
  }

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase.from('musicians').update({
      name: form.name, role: form.role || null, phone: form.phone || null,
      email: form.email || null,
      default_fee: form.default_fee ? parseFloat(form.default_fee) : null,
      notes: form.notes || null, is_active: form.is_active,
    }).eq('id', id)
    setSaving(false)
    if (error) { toast('Σφάλμα', 'error'); return }
    toast('Αποθηκεύτηκε!', 'success'); setEditing(false); load()
  }

  if (loading) return <Spinner />
  if (!musician) return <div className="p-8 text-center">Μουσικός δεν βρέθηκε</div>

  const totalEarned = participations.reduce((s, p) => s + (p.agreed_fee || 0), 0)
  const totalPaid = participations.filter(p => p.is_paid).reduce((s, p) => s + (p.agreed_fee || 0), 0)
  const totalUnpaid = totalEarned - totalPaid

  return (
    <div>
      <PageHeader
        title={musician.name}
        subtitle={musician.role || 'Μουσικός'}
        icon={<UserCheck size={18} color="var(--terra)" />}
        action={
          <div className="flex gap-2">
            <Link href="/musicians" className="btn btn-secondary btn-sm"><ArrowLeft size={14} />Πίσω</Link>
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="stat-card sea">
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Συμμετοχές</p>
            <p style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>{participations.length}</p>
          </div>
          <div className="stat-card green">
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Σύνολο Αμοιβών</p>
            <p style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--green)', fontFamily: 'var(--font-display)' }}>{formatCurrency(totalEarned)}</p>
          </div>
          <div className="stat-card green">
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Πληρωμένα</p>
            <p style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--green)', fontFamily: 'var(--font-display)' }}>{formatCurrency(totalPaid)}</p>
          </div>
          <div className="stat-card amber">
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Εκκρεμή</p>
            <p style={{ fontSize: '1.2rem', fontWeight: 800, color: totalUnpaid > 0 ? 'var(--amber)' : 'var(--green)', fontFamily: 'var(--font-display)' }}>
              {formatCurrency(totalUnpaid)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card">
            <div className="flex items-center gap-4 mb-5">
              <div className="relative cursor-pointer flex-shrink-0" onClick={() => !uploadingAvatar && avatarInputRef.current?.click()}>
                <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center"
                  style={{ background: musician.avatar_url ? 'transparent' : 'rgba(74,127,193,0.15)', border: '2px solid var(--border)' }}>
                  {uploadingAvatar ? (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>...</span>
                  ) : musician.avatar_url ? (
                    <img src={musician.avatar_url} alt={musician.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--sea)', fontFamily: 'var(--font-display)' }}>
                      {musician.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2"
                  style={{ background: 'var(--terra)', borderColor: 'var(--bg-card)' }}>
                  <Camera size={11} color="white" />
                </div>
              </div>
              <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])} />
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {uploadingAvatar ? 'Ανέβασμα...' : 'Κλικ για αλλαγή φωτογραφίας'}
                </p>
              </div>
            </div>

            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16 }}>Στοιχεία</h3>
            {editing ? (
              <div className="space-y-3">
                <div><label className="label">Όνομα *</label>
                  <input required className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
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
                <div><label className="label">Σημειώσεις</label>
                  <textarea className="textarea" rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                  <span className="text-sm font-semibold">Ενεργός</span>
                </label>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div><p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600 }}>Τηλέφωνο</p>
                  <p>{musician.phone || '—'}</p></div>
                <div><p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600 }}>Email</p>
                  <p>{musician.email || '—'}</p></div>
                <div><p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600 }}>Default Αμοιβή</p>
                  <p style={{ color: 'var(--amber)', fontWeight: 700 }}>{musician.default_fee ? formatCurrency(musician.default_fee) : '—'}</p></div>
                <div><p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600 }}>Κατάσταση</p>
                  <p style={{ color: musician.is_active ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
                    {musician.is_active ? '✓ Ενεργός' : '✗ Ανενεργός'}</p></div>
                {musician.notes && <div><p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600 }}>Σημειώσεις</p>
                  <p style={{ color: 'var(--text-secondary)' }}>{musician.notes}</p></div>}
              </div>
            )}
          </div>

          <div className="card lg:col-span-2">
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 12 }}>Ιστορικό Συμμετοχών</h3>
            {participations.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Δεν υπάρχουν συμμετοχές</p>
            ) : (
              <table className="w-full text-sm">
                <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Live', 'Ημ/νία', 'Αμοιβή', 'Πληρωμή'].map(h =>
                    <th key={h} className="pb-2 text-left" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {participations.map(p => (
                    <tr key={p.id} className="table-row">
                      <td className="py-2 pr-3">
                        <Link href={`/lives/${p.live_id}`} style={{ fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.875rem' }}>
                          {p.lives?.title || 'Live'}
                        </Link>
                        {p.lives?.venues?.name && <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.lives.venues.name}</p>}
                      </td>
                      <td className="py-2 pr-3" style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        {formatDate(p.lives?.date)}
                      </td>
                      <td className="py-2 pr-3" style={{ fontWeight: 700, color: 'var(--amber)' }}>
                        {formatCurrency(p.agreed_fee)}
                      </td>
                      <td className="py-2">
                        {p.is_paid
                          ? <span className="flex items-center gap-1" style={{ color: 'var(--green)', fontWeight: 700, fontSize: '0.8rem' }}><CheckCircle2 size={13} />Πληρώθηκε</span>
                          : <span className="flex items-center gap-1" style={{ color: 'var(--amber)', fontWeight: 700, fontSize: '0.8rem' }}><Circle size={13} />Εκκρεμεί</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
