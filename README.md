# 🎵 Σταυρουλιδάκης CRM

CRM & Business Management για τον Κώστα Σταυρουλιδάκη, Κρητικό μουσικό καλλιτέχνη.

## Εγκατάσταση

```bash
cd C:\Users\...\stavrou-crm
npm install
npm run dev
```

Άνοιξε: http://localhost:3000

## Supabase Setup

1. Πήγαινε στο **Supabase Dashboard → SQL Editor**
2. Τρέξε το αρχείο `supabase/schema.sql`
3. Τα credentials είναι ήδη στο `.env.local`

## Σελίδες

| Σελίδα | Περιγραφή |
|--------|-----------|
| **Dashboard** | KPIs μήνα, επόμενα lives, ανεξόφλητα, υπενθυμίσεις |
| **Ημερολόγιο** | Month/Week view, color-coded, Google Calendar export (.ics) |
| **Lives** | Λίστα + καρτέλα με 6 tabs: Γενικά/Οικονομικά/Μουσικοί/Διαπραγμάτευση/Αξιολόγηση/Σημειώσεις |
| **Πελάτες** | CRM με ιστορικό lives & αξιολόγηση πελάτη |
| **Μουσικοί** | Διαχείριση συνεργατών, πληρωμές, ιστορικό |
| **Αναφορές** | Γραφήματα εσόδων/εξόδων ανά μήνα, κατηγορία, περιοχή |
| **Υπενθυμίσεις** | Εκκρεμείς/ολοκληρωμένες |
| **Ρυθμίσεις** | Προφίλ καλλιτέχνη |

## Stack

- Next.js 14 (App Router) + TypeScript
- Supabase (PostgreSQL)
- Tailwind CSS (Mediterranean Dark theme)
- Recharts (γραφήματα)
- date-fns (ημερομηνίες)
- ICS export για Google Calendar
