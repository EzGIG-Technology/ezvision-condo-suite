# EzVision Condo Suite

Visitor management and AI vision security for residential communities, in one front end.

There are five apps. All of them read and write the same live data:

| App | Path | Who uses it |
| --- | --- | --- |
| Management Portal | `/login` → `/portal/*` | JMB/MC, building manager, security supervisor |
| Guard Tablet | `/guard/login` → `/guard/*` | Guards at the guardhouse and on patrol |
| Resident App | `/app/login` → `/app/*` | Owners, tenants and their household |
| Visitor & Courier Pass | `/v/:id`, `/v/:id/selfie`, `/d/:code` | Guests, riders and couriers (no app or login) |
| Lobby Intercom Panel | `/panel` | Visitors at a tower lobby door |

The launcher at `/` links to all five and can reset the demo data.

`docs/PROPOSAL_COVERAGE.md` maps every feature in the solution proposal to the screen that provides it.

> This is a production-grade **front end** running on sample data. There is no backend yet. State is kept in the browser (`localStorage`) and synced live between tabs. Open the guard tablet in one tab and the resident app in another to watch a walk-in approval go through both. All names, plates and units are fictional. Camera views and faces are drawn illustrations, not footage.

## Demo sign-in

| App | Credentials |
| --- | --- |
| Portal | Pick a role (Building Manager, JMB/MC committee or Security supervisor), any password, then any 6-digit code. Each role sees its own pages. |
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
10. **Guardhouse messages and intercom.** Resident: Guardhouse → send a message; Guard: Messages → reply or Call unit. Lobby panel: key in `1507` → call; the resident app rings → Answer → Open lobby door.
11. **Move-in.** Resident: Move in/out → book a slot, pay the deposit. Portal: Permits → service lift requests → Approve; the lorry is on the gate's expected list. Tick both inspections → Close and refund.
12. **Defect report.** Resident: Report issue → add a photo → Send. Portal: Community → Tickets → change the state; the resident is notified.
13. **Riders and courier passes.** Guard: Riders → log a GrabFood rider (drop-off only) or ask the resident to let one up. Resident: Parcels → Create a courier pass; Guard: Riders → check the code once (photo stamped).
14. **e-Voting.** Resident: the home banner → vote. Portal: Community → Voting → record a proxy vote → Close voting.
15. **Facilities and limits.** Portal: Facilities → add or close a facility; Site settings → visitor and car limits. The resident app follows both.
16. **Reports.** Portal: Reports → any report as PDF, Excel or CSV; pilot success metrics; strata accounts on Community → Fees.

## Screens

**Portal (19 views):** Command Center · Live View · Alerts & Incidents (queue and detail) · Unregistered Gallery · Evidence Search (with map timeline) · Visitors · Vehicles & Carpark · Permits & Contractors (with service lift and moves) · Residents & Units (directory and unit detail) · Watchlist (with committee approval) · Guard Performance · Community (announcements and emergency broadcasts, bookings, tickets, fees and strata accounts, parcel room, e-voting) · Facilities · Reports · Detection Rules (48) · Privacy & PDPA · Integrations · Site settings

**Guard tablet (10 views):** PIN sign-in · Gate console · Alerts and alert takeover · Walk-in wizard · Verify pass (QR, PIN, search) · Parcels (shelves and smart lockers) · Riders and courier passes · Messages from residents · Patrol with camera-verified checkpoints · Incident report and shift handover. Works offline.

**Resident app (19 views):** Sign-in · Home · Invite (single, multi-day, recurring, event) · Pass · Walk-in approval · Visitors · Parcels and courier pass · Facility booking · SOS · Activity · My unit · Face access enrolment · Renovation permit · Move in or out · Report an issue · Guardhouse · AGM and e-voting · Fees and billing · incoming video calls

**Public:** Visitor pass · Visitor selfie (with liveness check) · Courier pass · Lobby intercom panel · 404

## Tech

- Vite 5, React 18, TypeScript (strict)
- Tailwind CSS 3, lucide-react icons
- React Router 6, with every screen lazy-loaded
- Zustand with `persist`, plus a `storage` listener for cross-tab sync
- No UI kit and no chart library: charts, camera scenes, face crops and QR codes are hand-built SVG
- jsPDF and write-excel-file for PDF and Excel exports, loaded only when someone exports

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
