'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/PageHeader'
import { BarChart3 } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { format } from 'date-fns'
import { el } from 'date-fns/locale'
import type { Live } from '@/lib/supabase'

const CHART_COLORS = ['var(--terra)', 'var(--sea)', 'var(--amber)', 'var(--green)', '#9b59b6', '#1abc9c', '#e67e22', '#3498db']

export default function ReportsPage() {
  const [lives, setLives] = useState<Live[]>([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(String(new Date().getFullYear()))

  useEffect(() => {
    supabase.from('lives').select('*, clients(name), venues(name,city)')
      .neq('status', 'cancelled')
      .then(({ data }) => { setLives((data || []) as Live[]); setLoading(false) })
  }, [])

  const years = Array.from(new Set(lives.map(l => l.date?.slice(0, 4)).filter(Boolean) as string[])).sort().reverse()
  const filteredLives = lives.filter(l => !year || l.date?.startsWith(year))

  // Monthly data (12 months of selected year OR last 12 months)
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const monthNum = String(i + 1).padStart(2, '0')
    const monthStr = `${year}-${monthNum}`
    const monthLives = filteredLives.filter(l => l.date?.startsWith(monthStr))
    return {
      month: format(new Date(parseInt(year), i, 1), 'MMM', { locale: el }),
      income: monthLives.reduce((s, l) => s + (l.agreed_amount || 0), 0),
      count: monthLives.length,
    }
  })

  // By category
  const byCategory: Record<string, { income: number; count: number }> = {}
  filteredLives.forEach(l => {
    const cat = l.category || 'Άλλο'
    if (!byCategory[cat]) byCategory[cat] = { income: 0, count: 0 }
    byCategory[cat].income += l.agreed_amount || 0
    byCategory[cat].count++
  })
  const categoryData = Object.entries(byCategory)
    .map(([name, v]) => ({ name, income: v.income, count: v.count }))
    .sort((a, b) => b.income - a.income)

  // By region
  const byRegion: Record<string, number> = {}
  filteredLives.forEach(l => {
    const r = l.region || 'Άγνωστη'
    byRegion[r] = (byRegion[r] || 0) + (l.agreed_amount || 0)
  })
  const regionData = Object.entries(byRegion)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // By client
  const byClient: Record<string, { income: number; count: number; name: string }> = {}
  filteredLives.forEach(l => {
    const cid = l.client_id || 'unknown'
    const cname = l.clients?.name || 'Χωρίς πελάτη'
    if (!byClient[cid]) byClient[cid] = { income: 0, count: 0, name: cname }
    byClient[cid].income += l.agreed_amount || 0
    byClient[cid].count++
  })
  const clientData = Object.entries(byClient)
    .map(([_, v]) => ({ name: v.name, income: v.income, count: v.count }))
    .sort((a, b) => b.income - a.income)
    .slice(0, 10)

  const totalIncome = filteredLives.reduce((s, l) => s + (l.agreed_amount || 0), 0)
  const avgPerLive = filteredLives.length > 0 ? totalIncome / filteredLives.length : 0
  const paidCount = filteredLives.filter(l => l.is_paid).length

  const tooltipStyle = {
    contentStyle: { background: 'var(--bg-overlay)', border: '1px solid var(--border)', borderRadius: 8 },
    labelStyle: { color: 'var(--text-muted)' },
  }

  if (loading) return <Spinner />

  return (
    <div>
      <PageHeader
        title="Αναφορές"
        subtitle="Οικονομική ανάλυση δραστηριότητας"
        icon={<BarChart3 size={18} color="var(--terra)" />}
        action={
          <select className="select w-auto" value={year} onChange={e => setYear(e.target.value)}>
            <option value="">Όλα τα έτη</option>
            {years.map(y => <option key={y} value={y!}>{y}</option>)}
          </select>
        }
      />

      <div className="p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Σύνολο Εσόδων', value: formatCurrency(totalIncome), color: 'var(--green)' },
            { label: 'Σύνολο Lives', value: String(filteredLives.length), color: 'var(--sea)' },
            { label: 'Μ.Ο. / Live', value: formatCurrency(avgPerLive), color: 'var(--amber)' },
            { label: 'Εξοφλημένα', value: `${paidCount}/${filteredLives.length}`, color: 'var(--terra)' },
          ].map(({ label, value, color }) => (
            <div key={label} className="stat-card">
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>{label}</p>
              <p style={{ fontSize: '1.4rem', fontWeight: 800, color, fontFamily: 'var(--font-display)' }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Monthly chart */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16 }}>Μηνιαία Έσοδα {year}</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={v => `€${(v / 1000).toFixed(0)}k`} />
              <Tooltip {...tooltipStyle} formatter={(v: any) => [formatCurrency(v), 'Έσοδα']} />
              <Bar dataKey="income" fill="var(--terra)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category + Region */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16 }}>Έσοδα ανά Τύπο Εκδήλωσης</h3>
            {categoryData.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>Δεν υπάρχουν δεδομένα</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={categoryData} dataKey="income" cx="50%" cy="50%" outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false} fontSize={10}>
                      {categoryData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip {...tooltipStyle} formatter={(v: any) => [formatCurrency(v), 'Έσοδα']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-3">
                  {categoryData.map((c, i) => (
                    <div key={c.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span style={{ fontSize: '0.82rem' }}>{c.name}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>({c.count})</span>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--green)' }}>{formatCurrency(c.income)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16 }}>Έσοδα ανά Περιοχή</h3>
            {regionData.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>Δεν υπάρχουν δεδομένα</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={regionData} layout="vertical" barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `€${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} formatter={(v: any) => [formatCurrency(v), 'Έσοδα']} />
                  <Bar dataKey="value" fill="var(--sea)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top clients */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16 }}>Top Πελάτες (κατά έσοδα)</h3>
          {clientData.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>Δεν υπάρχουν δεδομένα</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Πελάτης', 'Lives', 'Σύνολο', 'Μ.Ο.', 'Ποσοστό'].map(h =>
                    <th key={h} className="pb-2 text-left" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {clientData.map((c, i) => {
                  const pct = totalIncome > 0 ? (c.income / totalIncome) * 100 : 0
                  return (
                    <tr key={c.name} className="table-row">
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: i < 3 ? 'var(--terra)' : 'var(--text-muted)' }}>#{i + 1}</span>
                          <span style={{ fontWeight: 600 }}>{c.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-4" style={{ color: 'var(--sea)' }}>{c.count}</td>
                      <td className="py-2.5 pr-4" style={{ fontWeight: 700, color: 'var(--green)' }}>{formatCurrency(c.income)}</td>
                      <td className="py-2.5 pr-4" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(c.income / c.count)}</td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="score-bar flex-1" style={{ minWidth: 60 }}>
                            <div className="score-fill" style={{ width: `${pct}%`, background: 'var(--terra)' }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', width: 36 }}>{pct.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

