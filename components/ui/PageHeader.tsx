import { LucideIcon } from 'lucide-react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  icon?: React.ReactNode
}

export function PageHeader({ title, subtitle, action, icon }: PageHeaderProps) {
  return (
    <div className="page-header flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--terra-glow)', border: '1px solid rgba(232,96,76,0.2)' }}>
            {icon}
          </div>
        )}
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.2 }}>
            {title}
          </h1>
          {subtitle && <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 2 }}>{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'var(--bg-overlay)' }}>
        <Icon size={28} style={{ color: 'var(--text-muted)' }} />
      </div>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 6 }}>{title}</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 16 }}>{description}</p>
      {action}
    </div>
  )
}

export function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-2 rounded-full animate-spin"
        style={{ borderColor: 'var(--terra)', borderTopColor: 'transparent' }} />
    </div>
  )
}

interface FormRowProps {
  label: string
  children: React.ReactNode
  hint?: string
}
export function FormRow({ label, children, hint }: FormRowProps) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 4 }}>{hint}</p>}
    </div>
  )
}
