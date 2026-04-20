declare const process: { env: Record<string, string | undefined> }

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL as string) ?? ''
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string) ?? ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ==================== TYPES ====================

export type LiveStatus = 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'inquiry'
export type LiveCategory = 'γάμος' | 'βάπτιση' | 'αρραβώνας' | 'πάρτι' | 'εταιρική' | 'live_show' | 'φεστιβάλ' | 'άλλο'

export interface Venue {
  id: string
  name: string
  address?: string
  city?: string
  region?: string
  capacity?: number
  type?: string
  contact_person?: string
  phone?: string
  notes?: string
  created_at: string
}

export interface Client {
  id: string
  name: string
  type?: string
  phone?: string
  email?: string
  address?: string
  region?: string
  reliability_score?: number
  quality_score?: number
  would_collaborate_again?: boolean
  notes?: string
  internal_notes?: string
  created_at: string
}

export interface Musician {
  id: string
  name: string
  role?: string
  phone?: string
  email?: string
  default_fee?: number
  notes?: string
  is_active: boolean
  created_at: string
}

export interface Live {
  id: string
  title: string
  date?: string
  time_start?: string
  time_end?: string
  venue_id?: string
  client_id?: string
  category?: string
  status: LiveStatus
  address?: string
  city?: string
  region?: string
  agreed_amount?: number
  deposit?: number
  deposit_date?: string
  balance?: number
  payment_method?: string
  is_paid: boolean
  receipt_issued: boolean
  cancellation_reason?: string
  notes?: string
  internal_notes?: string
  created_at: string
  // joined
  venues?: Venue | null
  clients?: Client | null
}

export interface LiveMusician {
  id: string
  live_id: string
  musician_id: string
  agreed_fee?: number
  paid_fee?: number
  is_paid: boolean
  notes?: string
  musicians?: Musician | null
}

export interface Financial {
  id: string
  live_id: string
  category?: string
  amount?: number
  description?: string
  paid_to?: string
  created_at: string
  musicians?: Musician | null
}

export interface Negotiation {
  id: string
  live_id: string
  initial_offer?: number
  counter_offer?: number
  final_amount?: number
  smaller_band_requested: boolean
  extra_hours_requested: boolean
  special_terms?: string
  notes?: string
  created_at: string
}

export interface Evaluation {
  id: string
  live_id: string
  overall_score?: number
  financially_worthwhile?: boolean
  artistically_worthwhile?: boolean
  would_do_again?: boolean
  notes_audience?: string
  notes_organization?: string
  notes_venue?: string
  notes_atmosphere?: string
  created_at: string
}

export interface Reminder {
  id: string
  live_id?: string
  type?: string
  due_date?: string
  is_done: boolean
  notes?: string
  created_at: string
  lives?: { title: string; date?: string | null } | null
}
