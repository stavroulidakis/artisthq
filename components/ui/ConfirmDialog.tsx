'use client'

import { Modal } from './Modal'
import { AlertTriangle } from 'lucide-react'

interface ConfirmProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  message: string
  confirmLabel?: string
  loading?: boolean
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, message,
  confirmLabel = 'Διαγραφή', loading
}: ConfirmProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex gap-4 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--red-glow)' }}>
          <AlertTriangle size={20} color="var(--red)" />
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', paddingTop: 8 }}>{message}</p>
      </div>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="btn btn-secondary">Ακύρωση</button>
        <button onClick={onConfirm} disabled={loading} className="btn btn-danger">
          {loading ? 'Διαγραφή...' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
