'use client'

import { createContext, useContext, useState, useCallback } from 'react'

type ToastType = 'success' | 'error' | 'warning'
interface ToastItem { id: string; message: string; type: ToastType }
interface ToastCtx { toast: (msg: string, type?: ToastType) => void }

const ToastContext = createContext<ToastCtx>({ toast: () => {} })
export function useToast() { return useContext(ToastContext) }

const ICONS: Record<ToastType, string> = { success: '✓', error: '✕', warning: '⚠' }
const COLORS: Record<ToastType, string> = {
  success: 'var(--green)',
  error: 'var(--red)',
  warning: 'var(--amber)',
}

export function ToastProvider({ children }: { children?: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(p => [...p, { id, message, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className="toast">
            <span style={{ color: COLORS[t.type], fontWeight: 700 }}>{ICONS[t.type]}</span>
            <span style={{ color: 'var(--text-primary)' }}>{t.message}</span>
            <button
              onClick={() => setToasts(p => p.filter(x => x.id !== t.id))}
              style={{ color: 'var(--text-muted)', marginLeft: 4 }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
