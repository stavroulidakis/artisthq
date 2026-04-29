export async function requestNotificationPermission(): Promise<void> {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission === 'default') {
    await Notification.requestPermission()
  }
}

export function checkTodayReminders(
  reminders: Array<{ id: string; type?: string | null; notes?: string | null; due_date?: string | null; is_done?: boolean }>
): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  const today = new Date().toISOString().slice(0, 10)
  const sessionKey = `notif_sent_${today}`
  if (sessionStorage.getItem(sessionKey)) return

  const due = reminders.filter(r => r.due_date === today && !r.is_done)
  if (due.length === 0) return

  for (const r of due) {
    new Notification(r.type || 'ArtistHQ — Υπενθύμιση', {
      body: r.notes || 'Έχεις υπενθύμιση για σήμερα',
      icon: '/favicon.ico',
    })
  }
  sessionStorage.setItem(sessionKey, '1')
}