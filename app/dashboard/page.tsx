'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDate, formatTime, LIVE_STATUS_LABELS } from '@/lib/utils'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/PageHeader'
import {
  LayoutDashboard, TrendingUp, AlertCircle, Bell, Calendar, ChevronRight, Clock, MapPin, Music2
} from 'lucide-react'
import Link from 'next/link'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import { format, subMonths, startOfMonth, endOfMonth, parseISO, isAfter } from 'date-fns'
import { el } from 'date-fns/locale'
import type { Live, Reminder } from '@/lib/supabase'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [artistName, setArtistName] = useState('Κώστας Σταυρουλιδάκης')
  const [lives, setLives] = useState<Live[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [monthlyData, setMonthlyData] = useState<any[]>([])

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [{ data: livesData }, { data: remindersData }, { data: settings }] = await Promise.all([
      supabase.from('lives').select('*, venues(name,city), clients(name)').order('date', { ascending: false }),
      supabase.from('reminders').select('*, lives(title,date)').eq('is_done', false).order('due_date'),
      supabase.from('settings').select('artist_name').single(),
    ])
    if (settings?.artist_name) setArtistName(settings.artist_name)
    const allLives = (livesData || []) as Live[]
    setLives(allLives)
    setReminders((remindersData || []) as Reminder[])

    const months = Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(new Date(), 5 - i)
      const ms = format(startOfMonth(d), 'yyyy-MM-dd')
      const me = format(endOfMonth(d), 'yyyy-MM-dd')
      const monthLives = allLives.filter(l => l.date && l.date >= ms && l.date <= me && l.status !== 'cancelled')
      return {
        month: format(d, 'MMM', { locale: el }),
        income: monthLives.reduce((s, l) => s + (l.agreed_amount || 0), 0),
        count: monthLives.length,
      }
    })
    setMonthlyData(months)
    setLoading(false)
  }

  const now = new Date()
  const thisMonthStart = format(startOfMonth(now), 'yyyy-MM-dd')
  const thisMonthEnd = format(endOfMonth(now), 'yyyy-MM-dd')

  const thisMonthLives = lives.filter(l => l.date && l.date >= thisMonthStart && l.date <= thisMonthEnd && l.status !== 'cancelled')
  const monthIncome = thisMonthLives.reduce((s, l) => s + (l.agreed_amount || 0), 0)
  const monthCount = thisMonthLives.length
  const unpaidLives = lives.filter(l => !l.is_paid && l.status === 'confirmed' && l.agreed_amount)
  const totalUnpaid = unpaidLives.reduce((s, l) => s + ((l.balance || l.agreed_amount) || 0), 0)
  const upcomingLives = lives
    .filter(l => l.date && isAfter(parseISO(l.date), now) && l.status !== 'cancelled')
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    .slice(0, 6)

  if (loading) return <Spinner />

  return (
    <div className="animate-in">
      <PageHeader
        title={`Καλωσήρθες, ${artistName.split(' ')[0]}!`}
        subtitle={format(now, "EEEE d MMMM yyyy", { locale: el })}
        icon={<LayoutDashboard size={18} color="var(--terra)" />}
      />

      <div className="p-5 space-y-4">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard title="Έσοδα Μήνα" value={formatCurrency(monthIncome)} sub={`${monthCount} lives`} icon={<TrendingUp size={15} />} color="green" />
          <StatCard title="Ανεξόφλητα" value={formatCurrency(totalUnpaid)} sub={`${unpaidLives.length} lives`} icon={<AlertCircle size={15} />} color="terra" />
          <StatCard title="Επόμενα Lives" value={String(upcomingLives.length)} sub="προγραμματισμένα" icon={<Calendar size={15} />} color="sea" />
          <StatCard title="Υπενθυμίσεις" value={String(reminders.length)} sub="εκκρεμείς" icon={<Bell size={15} />} color="amber" />
        </div>

        {/* Chart + Reminders */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card lg:col-span-2" style={{ padding: '14px 16px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700, marginBottom: 10 }}>Έσοδα τελευταίων 6 μηνών</h2>
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={monthlyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--terra)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--terra)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `€${(v / 1000).toFixed(0)}k`} width={36} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.8rem' }}
                  formatter={(v: any) => [formatCurrency(v), 'Έσοδα']}
                  labelStyle={{ color: 'var(--text-muted)' }}
                />
                <Area type="monotone" dataKey="income" stroke="var(--terra)" strokeWidth={2} fill="url(#incomeGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Reminders */}
          <div className="card" style={{ padding: '14px 16px' }}>
            <div className="flex items-center justify-between mb-3">
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700 }}>Υπενθυμίσεις</h2>
              <Link href="/reminders" style={{ color: 'var(--terra)', fontSize: '0.75rem' }}>Όλες →</Link>
            </div>
            {reminders.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '12px 0' }}>Καμία εκκρεμής</p>
            ) : (
              <div className="space-y-1.5">
                {reminders.slice(0, 6).map(r => (
                  <div key={r.id} className="flex items-start gap-2 px-2 py-1.5 rounded-lg" style={{ background: 'var(--bg-overlay)' }}>
                    <Bell size={12} style={{ color: 'var(--amber)', flexShrink: 0, marginTop: 2 }} />
                    <div className="min-w-0">
                      <p style={{ fontSize: '0.78rem', fontWeight: 600 }} className="truncate">{r.type || r.notes}</p>
                      {r.lives?.title && <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }} className="truncate">{r.lives.title}</p>}
                      {r.due_date && <p style={{ fontSize: '0.68rem', color: 'var(--terra)' }}>{formatDate(r.due_date)}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Lives */}
        <div className="card" style={{ padding: '14px 16px' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700 }}>Επόμενα Lives</h2>
            <Link href="/lives" style={{ color: 'var(--terra)', fontSize: '0.75rem' }}>Όλα →</Link>
          </div>
          {upcomingLives.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '12px 0' }}>Δεν υπάρχουν επερχόμενα lives</p>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {upcomingLives.map(live => (
                <Link key={live.id} href={`/lives/${live.id}`}
                  className="flex items-center gap-3 py-2 table-row"
                  style={{ display: 'flex', textDecoration: 'none' }}>
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg flex flex-col items-center justify-center text-center"
                    style={{ background: 'var(--terra-glow)', border: '1px solid rgba(232,96,76,0.2)' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--terra)', lineHeight: 1 }}>
                      {live.date ? format(parseISO(live.date), 'd') : '?'}
                    </span>
                    <span style={{ fontSize: '0.58rem', color: 'var(--terra)', textTransform: 'uppercase', fontWeight: 700 }}>
                      {live.date ? format(parseISO(live.date), 'MMM', { locale: el }) : ''}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontWeight: 700, fontSize: '0.85rem' }} className="truncate">{live.title}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {live.venues?.name && (
                        <span className="flex items-center gap-1" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          <MapPin size={10} />{live.venues.name}
                        </span>
                      )}
                      {live.time_start && (
                        <span className="flex items-center gap-1" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          <Clock size={10} />{formatTime(live.time_start)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`badge badge-${live.status}`}>{LIVE_STATUS_LABELS[live.status]}</span>
                    {live.agreed_amount && (
                      <span style={{ fontWeight: 700, color: 'var(--green)', fontSize: '0.82rem' }}>
                        {formatCurrency(live.agreed_amount)}
                      </span>
                    )}
                    <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Unpaid Lives */}
        {unpaidLives.length > 0 && (
          <div className="card" style={{ padding: '14px 16px', borderColor: 'rgba(232,96,76,0.3)' }}>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle size={15} color="var(--terra)" />
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700 }}>Ανεξόφλητα Lives</h2>
              <span style={{ fontSize: '0.72rem', color: 'var(--terra)', marginLeft: 'auto', fontWeight: 700 }}>
                Σύνολο: {formatCurrency(totalUnpaid)}
              </span>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {unpaidLives.slice(0, 5).map(live => (
                <Link key={live.id} href={`/lives/${live.id}`}
                  className="flex items-center justify-between py-2 table-row"
                  style={{ display: 'flex', textDecoration: 'none' }}>
                  <div className="flex items-center gap-2">
                    <Music2 size={13} color="var(--text-muted)" />
                    <div>
                      <p style={{ fontSize: '0.82rem', fontWeight: 600 }}>{live.title}</p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{formatDate(live.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ fontWeight: 700, color: 'var(--amber)', fontSize: '0.85rem' }}>{formatCurrency(live.balance || live.agreed_amount)}</span>
                    <span className="badge badge-unpaid">Ανεξόφλητο</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ title, value, sub, icon, color }: {
  title: string; value: string; sub: string
  icon: React.ReactNode; color: 'terra' | 'green' | 'sea' | 'amber'
}) {
  const colors = {
    terra: { text: 'var(--terra)', bg: 'var(--terra-glow)' },
    green: { text: 'var(--green)', bg: 'var(--green-glow)' },
    sea: { text: 'var(--sea)', bg: 'var(--sea-glow)' },
    amber: { text: 'var(--amber)', bg: 'var(--amber-glow)' },
  }
  return (
    <div className={`stat-card ${color} animate-in`} style={{ padding: '12px 14px' }}>
      <div className="flex items-center justify-between mb-2">
        <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{title}</p>
        <div className="w-7 h-7 rounded-md flex items-center justify-center"
          style={{ background: colors[color].bg, color: colors[color].text }}>
          {icon}
        </div>
      </div>
      <p style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1.1 }}>{value}</p>
      <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 3 }}>{sub}</p>
    </div>
  )
}