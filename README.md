<<<<<<< HEAD
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
=======
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
>>>>>>> bb5e37c (init)
