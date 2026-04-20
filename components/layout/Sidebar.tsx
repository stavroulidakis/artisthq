'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Calendar, Music2, Users, UserCheck,
  BarChart3, Bell, Settings, Mic2
} from 'lucide-react'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/calendar', label: 'Ημερολόγιο', icon: Calendar },
  { href: '/lives', label: 'Lives', icon: Music2 },
  { href: '/clients', label: 'Πελάτες', icon: Users },
  { href: '/musicians', label: 'Μουσικοί', icon: UserCheck },
  { href: '/reports', label: 'Αναφορές', icon: BarChart3 },
  { href: '/reminders', label: 'Υπενθυμίσεις', icon: Bell },
  { href: '/settings', label: 'Ρυθμίσεις', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="px-4 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--terra-dark), var(--terra))' }}>
            <Mic2 size={17} color="white" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.2, color: 'var(--text-primary)' }}>
              Κ. Σταυρουλιδάκης
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--terra)', fontWeight: 600, letterSpacing: '0.05em' }}>
              ΚΡΗΤΙΚΗ ΜΟΥΣΙΚΗ
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === '/dashboard'
            ? pathname === '/dashboard' || pathname === '/'
            : pathname.startsWith(href)
          return (
            <Link key={href} href={href} className={`nav-link ${active ? 'active' : ''}`}>
              <Icon size={17} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t text-center" style={{ borderColor: 'var(--border)' }}>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>v1.0 · CRM System</p>
      </div>
    </aside>
  )
}
