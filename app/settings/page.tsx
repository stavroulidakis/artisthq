'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { REGIONS } from '@/lib/utils'
import {
  getMusicianRoles, getLiveCategories, getLiveStatuses,
  saveMusicianRoles, saveLiveCategories, saveLiveStatuses,
  getStatusBadgeClass, StatusEntry,
  DEFAULT_ROLES, DEFAULT_CATEGORIES, DEFAULT_STATUSES,
  getProjectTypes, getProjectStatuses, getExpenseCats,
  saveProjectTypes, saveProjectStatuses, saveExpenseCats,
  DEFAULT_PROJECT_TYPES, DEFAULT_PROJECT_STATUSES, DEFAULT_EXPENSE_CATS,
} from '@/lib/lists'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/PageHeader'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/Toast'
import { Settings, Save, Plus, Trash2, Edit2, MapPin, Building2, Mic2, RotateCcw, List, Camera } from 'lucide-react'
import type { Venue } from '@/lib/supabase'

const VENUE_TYPES = ['Κτήμα', 'Ξενοδοχείο', 'Εστιατόριο', 'Κλαμπ', 'Υπαίθριο', 'Αίθουσα', 'Άλλο']

export default function SettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settingsId, setSettingsId] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [venues, setVenues] = useState<Venue[]>([])
  const [activeTab, setActiveTab] = useState<'profile' | 'venues' | 'lists'>('profile')
  const [showVenueModal, setShowVenueModal] = useState(false)
  const [editVenue, setEditVenue] = useState<Venue | null>(null)
  const [deleteVenueId, setDeleteVenueId] = useState<string | null>(null)
  const [venueSaving, setVenueSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [form, setForm] = useState({
    artist_name: 'Κώστας Σταυρουλιδάκης',
    artist_type: 'Κρητικός Μουσικός',
    phone: '', email: '', address: '',
  })

  const emptyVenueForm = {
    name: '', address: '', city: '', region: '',
    capacity: '', type: '', contact_person: '', phone: '', notes: '',
  }
  const [venueForm, setVenueForm] = useState(emptyVenueForm)

  // Lists state
  const [roles, setRoles] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [statuses, setStatuses] = useState<StatusEntry[]>([])
  const [newRole, setNewRole] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newStatusLabel, setNewStatusLabel] = useState('')

  // Project lists state
  const [projTypes, setProjTypes] = useState<string[]>([])
  const [projStatuses, setProjStatuses] = useState<string[]>([])
  const [expCats, setExpCats] = useState<string[]>([])
  const [newProjType, setNewProjType] = useState('')
  const [newProjStatus, setNewProjStatus] = useState('')
  const [newExpCat, setNewExpCat] = useState('')

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
      })
      if (s.avatar_url) setAvatarUrl(s.avatar_url)
    }
    setVenues((v || []) as Venue[])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    setRoles(getMusicianRoles())
    setCategories(getLiveCategories())
    setStatuses(getLiveStatuses())
    setProjTypes(getProjectTypes())
    setProjStatuses(getProjectStatuses())
    setExpCats(getExpenseCats())
  }, [load])

  async function handleAvatarUpload(file: File) {
    setUploadingAvatar(true)
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `artist-avatar-${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (uploadError) { toast('Σφάλμα upload: ' + uploadError.message, 'error'); setUploadingAvatar(false); return }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
    const url = urlData.publicUrl
    if (settingsId) {
      await supabase.from('settings').update({ avatar_url: url }).eq('id', settingsId)
    } else {
      const { data: newS } = await supabase.from('settings').insert({ avatar_url: url }).select().single()
      if (newS) setSettingsId(newS.id)
    }
    setAvatarUrl(url)
    setUploadingAvatar(false)
    toast('Φωτογραφία ανέβηκε!', 'success')
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      artist_name: form.artist_name,
      artist_type: form.artist_type,
      phone: form.phone || null,
      email: form.email || null,
      address: form.address || null,
    }
    let error
    if (settingsId) {
      ;({ error } = await supabase.from('settings').update(payload).eq('id', settingsId))
    } else {
      const { data, error: err } = await supabase.from('settings').insert(payload).select().single()
      if (data) setSettingsId(data.id)
      error = err
    }
    setSaving(false)
    if (error) { toast('Σφάλμα: ' + error.message, 'error'); return }
    toast('Αποθηκεύτηκε!', 'success')
  }

  function openCreateVenue() { setVenueForm(emptyVenueForm); setEditVenue(null); setShowVenueModal(true) }
  function openEditVenue(v: Venue) {
    setVenueForm({
      name: v.name, address: v.address || '', city: v.city || '',
      region: v.region || '', capacity: v.capacity?.toString() || '',
      type: v.type || '', contact_person: v.contact_person || '',
      phone: v.phone || '', notes: v.notes || '',
    })
    setEditVenue(v); setShowVenueModal(true)
  }

  async function handleSaveVenue(e: React.FormEvent) {
    e.preventDefault()
    setVenueSaving(true)
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
    if (error) { toast('Σφάλμα: ' + error.message, 'error'); return }
    toast(editVenue ? 'Χώρος ενημερώθηκε!' : 'Χώρος προστέθηκε!', 'success')
    setShowVenueModal(false); load()
  }

  async function handleDeleteVenue() {
    if (!deleteVenueId) return
    setDeleting(true)
    const { error } = await supabase.from('venues').delete().eq('id', deleteVenueId)
    setDeleting(false)
    if (error) { toast('Σφάλμα: ' + error.message, 'error'); return }
    setDeleteVenueId(null)
    toast('Χώρος διαγράφηκε', 'success')
    load()
  }

  // --- List handlers ---
  function addRole() {
    const val = newRole.trim()
    if (!val || roles.includes(val)) return
    const updated = [...roles, val]
    setRoles(updated); saveMusicianRoles(updated); setNewRole('')
  }
  function removeRole(i: number) {
    const updated = roles.filter((_, j) => j !== i)
    setRoles(updated); saveMusicianRoles(updated)
  }
  function resetRoles() { setRoles(DEFAULT_ROLES); saveMusicianRoles(DEFAULT_ROLES) }

  function addCategory() {
    const val = newCategory.trim()
    if (!val || categories.includes(val)) return
    const updated = [...categories, val]
    setCategories(updated); saveLiveCategories(updated); setNewCategory('')
  }
  function removeCategory(i: number) {
    const updated = categories.filter((_, j) => j !== i)
    setCategories(updated); saveLiveCategories(updated)
  }
  function resetCategories() { setCategories(DEFAULT_CATEGORIES); saveLiveCategories(DEFAULT_CATEGORIES) }

  function addStatus() {
    const label = newStatusLabel.trim()
    if (!label || statuses.some(s => s.label === label)) return
    const updated = [...statuses, { value: label, label }]
    setStatuses(updated); saveLiveStatuses(updated); setNewStatusLabel('')
  }
  function removeStatus(i: number) {
    const updated = statuses.filter((_, j) => j !== i)
    setStatuses(updated); saveLiveStatuses(updated)
  }
  function resetStatuses() { setStatuses(DEFAULT_STATUSES); saveLiveStatuses(DEFAULT_STATUSES) }

  function addProjType() {
    const val = newProjType.trim()
    if (!val || projTypes.includes(val)) return
    const updated = [...projTypes, val]
    setProjTypes(updated); saveProjectTypes(updated); setNewProjType('')
  }
  function removeProjType(i: number) {
    const updated = projTypes.filter((_, j) => j !== i)
    setProjTypes(updated); saveProjectTypes(updated)
  }
  function resetProjTypes() { setProjTypes(DEFAULT_PROJECT_TYPES); saveProjectTypes(DEFAULT_PROJECT_TYPES) }

  function addProjStatus() {
    const val = newProjStatus.trim()
    if (!val || projStatuses.includes(val)) return
    const updated = [...projStatuses, val]
    setProjStatuses(updated); saveProjectStatuses(updated); setNewProjStatus('')
  }
  function removeProjStatus(i: number) {
    const updated = projStatuses.filter((_, j) => j !== i)
    setProjStatuses(updated); saveProjectStatuses(updated)
  }
  function resetProjStatuses() { setProjStatuses(DEFAULT_PROJECT_STATUSES); saveProjectStatuses(DEFAULT_PROJECT_STATUSES) }

  function addExpCat() {
    const val = newExpCat.trim()
    if (!val || expCats.includes(val)) return
    const updated = [...expCats, val]
    setExpCats(updated); saveExpenseCats(updated); setNewExpCat('')
  }
  function removeExpCat(i: number) {
    const updated = expCats.filter((_, j) => j !== i)
    setExpCats(updated); saveExpenseCats(updated)
  }
  function resetExpCats() { setExpCats(DEFAULT_EXPENSE_CATS); saveExpenseCats(DEFAULT_EXPENSE_CATS) }

  if (loading) return <Spinner />

  return (
    <div>
      <PageHeader
        title="Ρυθμίσεις"
        subtitle="Προφίλ καλλιτέχνη, Χώροι & Λίστες"
        icon={<Settings size={18} color="var(--terra)" />}
      />

      <div className="p-6">
        <div className="tab-bar mb-6" style={{ maxWidth: 480 }}>
          <button onClick={() => setActiveTab('profile')} className={`tab ${activeTab === 'profile' ? 'active' : ''}`}>Προφίλ</button>
          <button onClick={() => setActiveTab('venues')} className={`tab ${activeTab === 'venues' ? 'active' : ''}`}>Χώροι ({venues.length})</button>
          <button onClick={() => setActiveTab('lists')} className={`tab ${activeTab === 'lists' ? 'active' : ''}`}>Λίστες</button>
        </div>

        {activeTab === 'profile' && (
          <div className="max-w-lg">
            <form onSubmit={handleSaveProfile} className="card space-y-4">
              <div className="flex flex-col items-center pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="relative cursor-pointer mb-2" onClick={() => !uploadingAvatar && avatarInputRef.current?.click()}>
                  <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center"
                    style={{ background: avatarUrl ? 'transparent' : 'var(--terra-glow)', border: '2px solid var(--border)' }}>
                    {uploadingAvatar ? (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>...</div>
                    ) : avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Mic2 size={32} color="var(--terra)" />
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center border-2"
                    style={{ background: 'var(--terra)', borderColor: 'var(--bg-card)' }}>
                    <Camera size={13} color="white" />
                  </div>
                </div>
                <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])} />
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {uploadingAvatar ? 'Ανέβασμα...' : 'Κλικ για αλλαγή φωτογραφίας'}
                </p>
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

        {activeTab === 'lists' && (
          <div className="space-y-6 max-w-xl">
            {/* Musician Roles */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <List size={15} color="var(--sea)" />
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Ρόλοι Μουσικών</h3>
                </div>
                <button onClick={resetRoles} className="btn btn-ghost btn-xs"><RotateCcw size={11} /> Προεπιλογές</button>
              </div>
              <div className="space-y-1 mb-3">
                {roles.map((role, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="flex-1 py-1 px-2 rounded-lg text-sm" style={{ background: 'var(--bg-overlay)', color: 'var(--text-primary)' }}>{role}</span>
                    <button onClick={() => removeRole(i)} className="btn btn-ghost btn-xs"><Trash2 size={12} /></button>
                  </div>
                ))}
                {roles.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Δεν υπάρχουν ρόλοι.</p>}
              </div>
              <div className="flex gap-2">
                <input className="input" placeholder="π.χ. Ακορντεονίστας" value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addRole() } }} />
                <button onClick={addRole} className="btn btn-primary btn-sm" style={{ whiteSpace: 'nowrap' }}><Plus size={14} />Προσθήκη</button>
              </div>
            </div>

            {/* Live Categories */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <List size={15} color="var(--terra)" />
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Κατηγορίες Live</h3>
                </div>
                <button onClick={resetCategories} className="btn btn-ghost btn-xs"><RotateCcw size={11} /> Προεπιλογές</button>
              </div>
              <div className="space-y-1 mb-3">
                {categories.map((cat, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="flex-1 py-1 px-2 rounded-lg text-sm" style={{ background: 'var(--bg-overlay)', color: 'var(--text-primary)' }}>{cat}</span>
                    <button onClick={() => removeCategory(i)} className="btn btn-ghost btn-xs"><Trash2 size={12} /></button>
                  </div>
                ))}
                {categories.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Δεν υπάρχουν κατηγορίες.</p>}
              </div>
              <div className="flex gap-2">
                <input className="input" placeholder="π.χ. Χριστουγεννιάτικη Εκδήλωση" value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCategory() } }} />
                <button onClick={addCategory} className="btn btn-primary btn-sm" style={{ whiteSpace: 'nowrap' }}><Plus size={14} />Προσθήκη</button>
              </div>
            </div>

            {/* Live Statuses */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <List size={15} color="var(--amber)" />
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Καταστάσεις Live</h3>
                </div>
                <button onClick={resetStatuses} className="btn btn-ghost btn-xs"><RotateCcw size={11} /> Προεπιλογές</button>
              </div>
              <div className="space-y-1 mb-3">
                {statuses.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className={`badge ${getStatusBadgeClass(s.value)}`}>{s.label}</span>
                    <span className="flex-1" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {s.value !== s.label ? `(${s.value})` : ''}
                    </span>
                    <button onClick={() => removeStatus(i)} className="btn btn-ghost btn-xs"><Trash2 size={12} /></button>
                  </div>
                ))}
                {statuses.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Δεν υπάρχουν καταστάσεις.</p>}
              </div>
              <div className="flex gap-2">
                <input className="input" placeholder="π.χ. Αναβλήθηκε" value={newStatusLabel}
                  onChange={e => setNewStatusLabel(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addStatus() } }} />
                <button onClick={addStatus} className="btn btn-primary btn-sm" style={{ whiteSpace: 'nowrap' }}><Plus size={14} />Προσθήκη</button>
              </div>
            </div>

            {/* Project Types */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <List size={15} color="var(--sea)" />
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Τύποι Projects</h3>
                </div>
                <button onClick={resetProjTypes} className="btn btn-ghost btn-xs"><RotateCcw size={11} /> Προεπιλογές</button>
              </div>
              <div className="space-y-1 mb-3">
                {projTypes.map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="flex-1 py-1 px-2 rounded-lg text-sm" style={{ background: 'var(--bg-overlay)', color: 'var(--text-primary)' }}>{t}</span>
                    <button onClick={() => removeProjType(i)} className="btn btn-ghost btn-xs"><Trash2 size={12} /></button>
                  </div>
                ))}
                {projTypes.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Δεν υπάρχουν τύποι.</p>}
              </div>
              <div className="flex gap-2">
                <input className="input" placeholder="π.χ. Ντοκιμαντέρ" value={newProjType}
                  onChange={e => setNewProjType(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addProjType() } }} />
                <button onClick={addProjType} className="btn btn-primary btn-sm" style={{ whiteSpace: 'nowrap' }}><Plus size={14} />Προσθήκη</button>
              </div>
            </div>

            {/* Project Statuses */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <List size={15} color="var(--terra)" />
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Statuses Projects</h3>
                </div>
                <button onClick={resetProjStatuses} className="btn btn-ghost btn-xs"><RotateCcw size={11} /> Προεπιλογές</button>
              </div>
              <div className="space-y-1 mb-3">
                {projStatuses.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="flex-1 py-1 px-2 rounded-lg text-sm" style={{ background: 'var(--bg-overlay)', color: 'var(--text-primary)' }}>{s}</span>
                    <button onClick={() => removeProjStatus(i)} className="btn btn-ghost btn-xs"><Trash2 size={12} /></button>
                  </div>
                ))}
                {projStatuses.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Δεν υπάρχουν statuses.</p>}
              </div>
              <div className="flex gap-2">
                <input className="input" placeholder="π.χ. Παγωμένο" value={newProjStatus}
                  onChange={e => setNewProjStatus(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addProjStatus() } }} />
                <button onClick={addProjStatus} className="btn btn-primary btn-sm" style={{ whiteSpace: 'nowrap' }}><Plus size={14} />Προσθήκη</button>
              </div>
            </div>

            {/* Expense Categories */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <List size={15} color="var(--amber)" />
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Κατηγορίες Εξόδων Projects</h3>
                </div>
                <button onClick={resetExpCats} className="btn btn-ghost btn-xs"><RotateCcw size={11} /> Προεπιλογές</button>
              </div>
              <div className="space-y-1 mb-3">
                {expCats.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="flex-1 py-1 px-2 rounded-lg text-sm" style={{ background: 'var(--bg-overlay)', color: 'var(--text-primary)' }}>{c}</span>
                    <button onClick={() => removeExpCat(i)} className="btn btn-ghost btn-xs"><Trash2 size={12} /></button>
                  </div>
                ))}
                {expCats.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Δεν υπάρχουν κατηγορίες.</p>}
              </div>
              <div className="flex gap-2">
                <input className="input" placeholder="π.χ. Licensing" value={newExpCat}
                  onChange={e => setNewExpCat(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addExpCat() } }} />
                <button onClick={addExpCat} className="btn btn-primary btn-sm" style={{ whiteSpace: 'nowrap' }}><Plus size={14} />Προσθήκη</button>
              </div>
            </div>
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
