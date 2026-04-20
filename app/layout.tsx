import type { Metadata } from 'next'
import './globals.css'
import { Sidebar } from '@/components/layout/Sidebar'
import { ToastProvider } from '@/components/ui/Toast'

export const metadata: Metadata = {
  title: 'Σταυρουλιδάκης CRM',
  description: 'Διαχείριση καλλιτεχνικής δραστηριότητας',
}

interface RootLayoutProps {
  children?: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="el" className="dark">
      <body>
        <ToastProvider>
          <div className="flex" style={{ minHeight: '100vh' }}>
            <Sidebar />
            <main className="main-content">
              {children}
            </main>
          </div>
        </ToastProvider>
      </body>
    </html>
  )
}
