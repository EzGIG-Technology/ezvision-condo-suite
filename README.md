# EzVision Condo Suite

Visitor management and AI vision security for residential communities, in one front end.

There are four apps. All of them read and write the same live data:

| App | Path | Who uses it |
| --- | --- | --- |
| Management Portal | `/login` → `/portal/*` | JMB/MC, building manager, security supervisor |
| Guard Tablet | `/guard/login` → `/guard/*` | Guards at the guardhouse and on patrol |
| Resident App | `/app/login` → `/app/*` | Owners, tenants and their household |
| Visitor & Courier Pass | `/v/:id`, `/v/:id/selfie`, `/d/:code` | Guests, riders and couriers (no app or login) |

The launcher at `/` links to all four and can reset the demo data.

> This is a production-grade **front end** running on sample data. There is no backend yet. State is kept in the browser (`localStorage`) and synced live between tabs. Open the guard tablet in one tab and the resident app in another to watch a walk-in approval go through both. All names, plates and units are fictional. Camera views and faces are drawn illustrations, not footage.

## Demo sign-in

| App | Credentials |
| --- | --- |
| Portal | Any email and password, then any 6-digit code (SSO button also works) |
| Guard | Kumar Selvam `2468` · Aiman Rashid `1111` · Mohd Taufiq `3333` · Nor Azman `4444` · Bishnu Karki `5555` · Suhaimi Ismail `6666` |
| Resident | Mobile `012-345 6789` (prefilled), then any 6-digit code. Signs in as Tan Mei Ling, unit A-15-07 |

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build to dist/
npm run preview    # serve the production build
```

Node 18 or newer.

## Deploy to Vercel

1. In Vercel, choose **Add New → Project** and import this repository.
2. Vercel detects **Vite**. Keep the defaults: build command `npm run build`, output directory `dist`.
3. Click **Deploy**.

`vercel.json` already rewrites every path to `index.html`, so deep links like `/portal/incidents/al-2` or `/v/v-10` work on refresh. It also sets long-lived caching on hashed assets. No environment variables are needed.

## End-to-end journeys you can click through

1. **Walk-in visitor.** Guard: Walk-in → Scan ID → Take photo → unit `A-15-07` → Ask the resident. Resident app: the "is at the gate" banner appears → Let in. Guard: Check in and open gate. Portal → Visitors shows them on site.
2. **Invited guest.** Resident: Invite → Create pass. Open "See what your visitor sees" → add a selfie. Guard: Verify → PIN → type the 6-digit PIN from the pass → Check in. Resident: Activity shows "arrived".
3. **SOS.** Resident: SOS → hold the button for 2 seconds. The guard tablet shows a red banner → Respond → I've got this → I'm going there → I'm on scene → Close. The resident's SOS screen updates at each step.
4. **Parcel.** Guard: Parcels → log for A-15-07. Resident: Parcels shows the pickup code. Guard: Hand over → enter code → Hand over.
5. **Renovation permit.** Resident: Renovation → Apply → upload the 4 documents → Submit. Portal: Permits → open it → Approve permit. Resident: pay the deposit → Active.
6. **Unregistered person.** Portal: Unregistered → pick a face → Add to watchlist, Mark as known, or Attach to an incident. Evidence Search: try "red myvi yesterday".
7. **Incident.** Portal: Alerts & Incidents → acknowledge → AI talk-down → dispatch a guard → on scene → close with an outcome. Share link and evidence pack download.
8. **Announcements, bookings and fees.** Portal: Community → New announcement (the resident receives it), bookings timeline, tickets, fee arrears, e-voting. Resident: Book a facility → pay → the receipt is in Fees and billing.
9. **Shift handover.** Guard: Report → Shift handover → tick the checklist → Sign off.

## Screens

**Portal (16 views):** Command Center · Live View · Alerts & Incidents (queue and detail) · Unregistered Gallery · Evidence Search · Visitors · Vehicles & Carpark · Permits & Contractors · Residents & Units (directory and unit detail) · Watchlist · Guard Performance · Community (announcements, bookings, tickets, fees, parcel room, e-voting) · Reports · Detection Rules · Privacy & PDPA

**Guard tablet (8 views):** PIN sign-in · Gate console · Alerts and alert takeover · Walk-in wizard · Verify pass (QR, PIN, search) · Parcels (log and hand over) · Patrol with camera-verified checkpoints · Incident report and shift handover

**Resident app (15 views):** Sign-in · Home · Invite · Pass · Walk-in approval · Visitors · Parcels and courier pass · Facility booking · SOS · Activity · My unit · Face access enrolment · Renovation permit · Fees and billing

**Public:** Visitor pass · Visitor selfie · Courier pass · 404

## Tech

- Vite 5, React 18, TypeScript (strict)
- Tailwind CSS 3, lucide-react icons
- React Router 6, with every screen lazy-loaded
- Zustand with `persist`, plus a `storage` listener for cross-tab sync
- No UI kit and no chart library: charts, camera scenes, face crops and QR codes are hand-built SVG

```
src/
  App.tsx               routes
  layouts/              PortalLayout, GuardLayout, ResidentLayout
  pages/portal|guard|resident|visitor/
  components/ui/        Button, Modal, Drawer, Field, Chip, Segmented, Toaster …
  components/vision/    CamFeed, FaceCrop, QRCode, Logo
  components/charts/    BarChart, LineChart
  store/useStore.ts     all data and actions (one place to swap in an API)
  data/seed.ts          demo scenario for Vista Harmoni Residences
```

### Connecting a backend

Every mutation lives in `src/store/useStore.ts` (`createVisit`, `respondApproval`, `logParcel`, `closeAlert`, `setPermitStatus` and so on). To go live, keep the action signatures and replace each body with an API call. For realtime events (new alerts, approvals, plate reads), subscribe over WebSocket and call the same actions. The pages do not need to change.

## Quality checks

`AUDIT.md` has the results of the automated audit. It covers every route at desktop (1440×900) and mobile (390×844) width, clicks every button and link, checks for console errors and horizontal overflow, and runs the cross-app journeys above end to end.
