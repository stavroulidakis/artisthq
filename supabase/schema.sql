-- Κώστας Σταυρουλιδάκης CRM - Supabase Schema
-- Run in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS venues (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  region TEXT,
  capacity INTEGER,
  type TEXT,
  contact_person TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  region TEXT,
  reliability_score INTEGER,
  quality_score INTEGER,
  would_collaborate_again BOOLEAN DEFAULT true,
  notes TEXT,
  internal_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS musicians (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  phone TEXT,
  email TEXT,
  default_fee NUMERIC(10,2),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lives (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE,
  time_start TIME,
  time_end TIME,
  venue_id UUID REFERENCES venues(id),
  client_id UUID REFERENCES clients(id),
  category TEXT,
  status TEXT DEFAULT 'confirmed',
  address TEXT,
  city TEXT,
  region TEXT,
  agreed_amount NUMERIC(12,2),
  deposit NUMERIC(12,2),
  deposit_date DATE,
  balance NUMERIC(12,2),
  payment_method TEXT,
  is_paid BOOLEAN DEFAULT false,
  receipt_issued BOOLEAN DEFAULT false,
  cancellation_reason TEXT,
  notes TEXT,
  internal_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS live_musicians (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  live_id UUID REFERENCES lives(id) ON DELETE CASCADE,
  musician_id UUID REFERENCES musicians(id),
  agreed_fee NUMERIC(10,2),
  paid_fee NUMERIC(10,2),
  is_paid BOOLEAN DEFAULT false,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS financials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  live_id UUID REFERENCES lives(id) ON DELETE CASCADE,
  category TEXT,
  amount NUMERIC(12,2),
  description TEXT,
  paid_to UUID REFERENCES musicians(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS negotiations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  live_id UUID REFERENCES lives(id) ON DELETE CASCADE,
  initial_offer NUMERIC(12,2),
  counter_offer NUMERIC(12,2),
  final_amount NUMERIC(12,2),
  smaller_band_requested BOOLEAN DEFAULT false,
  extra_hours_requested BOOLEAN DEFAULT false,
  special_terms TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evaluations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  live_id UUID REFERENCES lives(id) ON DELETE CASCADE,
  overall_score INTEGER,
  financially_worthwhile BOOLEAN,
  artistically_worthwhile BOOLEAN,
  would_do_again BOOLEAN,
  notes_audience TEXT,
  notes_organization TEXT,
  notes_venue TEXT,
  notes_atmosphere TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reminders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  live_id UUID REFERENCES lives(id) ON DELETE CASCADE,
  type TEXT,
  due_date DATE,
  is_done BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings table for artist profile
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  artist_name TEXT DEFAULT 'Κώστας Σταυρουλιδάκης',
  artist_type TEXT DEFAULT 'Κρητικός Μουσικός',
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO settings (artist_name, artist_type)
VALUES ('Κώστας Σταυρουλιδάκης', 'Κρητικός Μουσικός')
ON CONFLICT DO NOTHING;

-- Sample data
INSERT INTO venues (name, city, region, type, capacity) VALUES
('Κτήμα Ζορπίδη', 'Ηράκλειο', 'Ηράκλειο', 'Κτήμα', 300),
('Θέατρο Ηρώδου Αττικού', 'Αθήνα', 'Αθήνα', 'Υπαίθριο', 5000),
('Κτήμα Αρετή', 'Χανιά', 'Χανιά', 'Κτήμα', 200)
ON CONFLICT DO NOTHING;
