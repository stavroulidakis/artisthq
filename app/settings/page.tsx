'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { REGIONS } from '@/lib/utils'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/PageHeader'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/Toast'
import { Settings, Save, Plus, Trash2, Edit2, MapPin, Building2, Mic2 } from 'lucide-react'
import type { Venue } from '@/lib/supabase'

const VENUE_TYPES = ['Κτήμα', 'Ξενοδοχείο', 'Εστιατόριο', 'Κλαμπ', 'Υπαίθριο', 'Αίθουσα', 'Άλλο']

export default function SettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settingsId, setSettingsId] = useState<string | null>(null)
  const [venues, setVenues] = useState<Venue[]>([])
  const [activeTab, setActiveTab] = useState<'profile' | 'venues'>('profile')
  const [showVenueModal, setShowVenueModal] = useState(false)
  const [editVenue, setEditVenue] = useState<Venue | null>(null)
  const [deleteVenueId, setDeleteVenueId] = useState<string | null>(null)
  const [venueSaving, setVenueSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [form, setForm] = useState({
    artist_name: 'Κώστας Σταυρουλιδάκης',
    artist_type: 'Κρητικός Μουσικός',
    phone: '', email: '', address: '', notes: ''
  })

  const emptyVenueForm = {
    name: '', address: '', city: '', region: '',
    capacity: '', type: '', contact_person: '', phone: '', notes: ''
  }
  const [venueForm, setVenueForm] = useState(emptyVenueForm)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: s }, { data: v }] = await Promise.all([
      supabase.from('settings').select('*').single(),
      supabase.from('venues').select('*').order('name'),
    ])
    if (s) {
      setSettingsId(s.id)
      setForm({
        artist_name: s.artist_name || 'Κώστας Σταυρουλιδάκης',
        artist_type: s.artist_type || 'Κρητικός Μουσικός',
        phone: s.phone || '',
        email: s.email || '',
        address: s.address || '',
        notes: s.notes || '',
      })
    }
    setVenues((v || []) as Venue[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const payload = {
      artist_name: form.artist_name,
      artist_type: form.artist_type,
      phone: form.phone || null,
      email: form.email || null,
      address: form.address || null,
    }
    if (settingsId) {
      await supabase.from('settings').update(payload).eq('id', settingsId)
    } else {
      const { data } = await supabase.from('settings').insert(payload).select().single()
      if (data) setSettingsId(data.id)
    }
    setSaving(false); toast('Αποθηκεύτηκε!', 'success')
  }

  function openCreateVenue() { setVenueForm(emptyVenueForm); setEditVenue(null); setShowVenueModal(true) }
  function openEditVenue(v: Venue) {
    setVenueForm({
      name: v.name, address: v.address || '', city: v.city || '',
      region: v.region || '', capacity: v.capacity?.toString() || '',
      type: v.type || '', contact_person: v.contact_person || '',
      phone: v.phone || '', notes: v.notes || ''
    })
    setEditVenue(v); setShowVenueModal(true)
  }

  async function handleSaveVenue(e: React.FormEvent) {
    e.preventDefault(); setVenueSaving(true)
    const payload = {
      name: venueForm.name,
      address: venueForm.address || null,
      city: venueForm.city || null,
      region: venueForm.region || null,
      capacity: venueForm.capacity ? parseInt(venueForm.capacity) : null,
      type: venueForm.type || null,
      contact_person: venueForm.contact_person || null,
      phone: venueForm.phone || null,
      notes: venueForm.notes || null,
    }
    const { error } = editVenue
      ? await supabase.from('venues').update(payload).eq('id', editVenue.id)
      : await supabase.from('venues').insert(payload)
    setVenueSaving(false)
    if (error) { toast('Σφάλμα', 'error'); return }
    toast(editVenue ? 'Χώρος ενημερώθηκε!' : 'Χώρος προστέθηκε!', 'success')
    setShowVenueModal(false); load()
  }

  async function handleDeleteVenue() {
    if (!deleteVenueId) return
    setDeleting(true)
    await supabase.from('venues').delete().eq('id', deleteVenueId)
    setDeleting(false)
    setDeleteVenueId(null)
    toast('Χώρος διαγράφηκε', 'success')
    load()
  }

  if (loading) return <Spinner />

  return (
    <div>
      <PageHeader
        title="Ρυθμίσεις"
        subtitle="Προφίλ καλλιτέχνη & Χώροι"
        icon={<Settings size={18} color="var(--terra)" />}
      />

      <div className="p-6">
        <div className="tab-bar mb-6" style={{ maxWidth: 320 }}>
          <button onClick={() => setActiveTab('profile')} className={`tab ${activeTab === 'profile' ? 'active' : ''}`}>Προφίλ</button>
          <button onClick={() => setActiveTab('venues')} className={`tab ${activeTab === 'venues' ? 'active' : ''}`}>Χώροι ({venues.length})</button>
        </div>

        {activeTab === 'profile' && (
          <div className="max-w-lg">
            <form onSubmit={handleSaveProfile} className="card space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--terra-glow)' }}>
                  <Mic2 size={22} color="var(--terra)" />
                </div>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700 }}>Προφίλ Καλλιτέχνη</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Βασικές πληροφορίες</p>
                </div>
              </div>
              <div><label className="label">Όνομα Καλλιτέχνη</label>
                <input className="input" value={form.artist_name} onChange={e => setForm({ ...form, artist_name: e.target.value })} /></div>
              <div><label className="label">Τύπος / Περιγραφή</label>
                <input className="input" placeholder="π.χ. Κρητικός Μουσικός" value={form.artist_type} onChange={e => setForm({ ...form, artist_type: e.target.value })} /></div>
              <div><label className="label">Τηλέφωνο</label>
                <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <div><label className="label">Email</label>
                <input type="email" className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div><label className="label">Διεύθυνση</label>
                <input className="input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
              <button type="submit" disabled={saving} className="btn btn-primary w-full justify-center">
                <Save size={16} />{saving ? 'Αποθήκευση...' : 'Αποθήκευση Ρυθμίσεων'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'venues' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Χώροι Εκδηλώσεων</h2>
              <button className="btn btn-primary" onClick={openCreateVenue}><Plus size={15} />Νέος Χώρος</button>
            </div>
            {venues.length === 0 ? (
              <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                Δεν υπάρχουν χώροι. Πρόσθεσε τον πρώτο!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {venues.map(v => (
                  <div key={v.id} className="card card-hover">
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'var(--sea-glow)' }}>
                        <Building2 size={16} color="var(--sea)" />
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openEditVenue(v)} className="btn btn-ghost btn-xs"><Edit2 size={12} /></button>
                        <button onClick={() => setDeleteVenueId(v.id)} className="btn btn-ghost btn-xs"><Trash2 size={12} /></button>
                      </div>
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 4 }}>{v.name}</h3>
                    {v.type && <span className="badge" style={{ background: 'var(--bg-overlay)', color: 'var(--text-muted)', marginBottom: 8, display: 'inline-block' }}>{v.type}</span>}
                    <div className="space-y-1">
                      {(v.city || v.region) && (
                        <p className="flex items-center gap-1" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          <MapPin size={11} />{[v.city, v.region].filter(Boolean).join(', ')}
                        </p>
                      )}
                      {v.capacity && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Χωρητικότητα: {v.capacity}</p>}
                      {v.contact_person && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{v.contact_person}{v.phone ? ` · ${v.phone}` : ''}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Modal open={showVenueModal} onClose={() => setShowVenueModal(false)} title={editVenue ? 'Επεξεργασία Χώρου' : 'Νέος Χώρος'}>
        <form onSubmit={handleSaveVenue}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="label">Όνομα *</label>
              <input required className="input" value={venueForm.name} onChange={e => setVenueForm({ ...venueForm, name: e.target.value })} /></div>
            <div><label className="label">Τύπος</label>
              <select className="select" value={venueForm.type} onChange={e => setVenueForm({ ...venueForm, type: e.target.value })}>
                <option value="">—</option>{VENUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select></div>
            <div><label className="label">Χωρητικότητα</label>
              <input type="number" className="input" value={venueForm.capacity} onChange={e => setVenueForm({ ...venueForm, capacity: e.target.value })} /></div>
            <div className="col-span-2"><label className="label">Διεύθυνση</label>
              <input className="input" value={venueForm.address} onChange={e => setVenueForm({ ...venueForm, address: e.target.value })} /></div>
            <div><label className="label">Πόλη</label>
              <input className="input" value={venueForm.city} onChange={e => setVenueForm({ ...venueForm, city: e.target.value })} /></div>
            <div><label className="label">Περιοχή</label>
              <select className="select" value={venueForm.region} onChange={e => setVenueForm({ ...venueForm, region: e.target.value })}>
                <option value="">—</option>{REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select></div>
            <div><label className="label">Υπεύθυνος</label>
              <input className="input" value={venueForm.contact_person} onChange={e => setVenueForm({ ...venueForm, contact_person: e.target.value })} /></div>
            <div><label className="label">Τηλέφωνο</label>
              <input className="input" value={venueForm.phone} onChange={e => setVenueForm({ ...venueForm, phone: e.target.value })} /></div>
            <div className="col-span-2"><label className="label">Σημειώσεις</label>
              <textarea className="textarea" rows={2} value={venueForm.notes} onChange={e => setVenueForm({ ...venueForm, notes: e.target.value })} /></div>
          </div>
          <div className="flex gap-3 justify-end mt-4">
            <button type="button" onClick={() => setShowVenueModal(false)} className="btn btn-secondary">Ακύρωση</button>
            <button type="submit" disabled={venueSaving} className="btn btn-primary">{venueSaving ? 'Αποθήκευση...' : 'Αποθήκευση'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteVenueId}
        onClose={() => setDeleteVenueId(null)}
        onConfirm={handleDeleteVenue}
        loading={deleting}
        title="Διαγραφή Χώρου"
        message="Ο χώρος θα διαγραφεί μόνιμα."
      />
    </div>
  )
}
