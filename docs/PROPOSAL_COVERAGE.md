# Proposal coverage

How every feature in *Condo Smart VMS + EzVision Security — Solution Proposal* (23 Sep 2026) maps to the app. "Journey" names the automated end-to-end test in `tests/audit/journeys.mjs` that exercises it; see `AUDIT.md` for the latest results.

Apps: **Portal** = management portal (`/portal`), **Guard** = guard tablet (`/guard`), **Resident** = resident app (`/app`), **Pass** = visitor and courier pass (`/v`, `/d`), **Panel** = lobby intercom panel (`/panel`).

This is a front-end demo. Cameras, face and plate recognition, payments, SMS and WhatsApp are simulated; data lives in the browser (see `README.md`).

## Headline: unauthorised entry detection

| Proposal | Where | Journey |
| --- | --- | --- |
| Match every face and plate against residents, today's visitors, walk-ins, permits and riders | Portal → Detection Rules (Unauthorised entry); Guard → Gate, Verify | Walk-in, Invite |
| Unknown plate: barrier stays closed | Portal → Vehicles & Carpark; rule "Unknown plate at the barrier" | Detection rules |
| Unknown face, tailgating, two vehicles on one lift, wrong block, pass expired, watchlist match, repeat unknown | Portal → Detection Rules (8 entry rules) | Detection rules |
| Alert flow: guard verifies and registers, tags as known, or dispatches; auto-escalates after 2 min; closed with an outcome | Guard → Alerts; Portal → Alerts & Incidents | SOS, Incident |
| Unregistered Gallery: daily review, tag known, add to watchlist, attach to incident | Portal → Unregistered | Unregistered gallery |

## Complete VMS feature set

| Module | Feature | Where | Journey |
| --- | --- | --- | --- |
| 1. Pre-registration | Visitor invite with QR pass by WhatsApp/SMS | Resident → Invite; Pass | Invite |
| | Face pre-enrolment by selfie, with liveness check | Pass → Add a selfie | Invite |
| | Recurring passes (helpers, drivers, tutors) | Resident → Invite (repeats every week) | — |
| | Multi-day passes with automatic expiry | Resident → Invite (staying more than one day) | Multi-day pass |
| | Event registration with guest cap | Resident → Invite (Event); Portal → Site settings | Limits |
| | Visitor limits per unit, set by management | Portal → Site settings | Limits |
| | Arrival and exit notifications | Resident → Activity | Invite |
| | Pass cancellation | Resident → Visitor pass | — |
| 2. Guardhouse | QR scan and PIN entry | Guard → Verify | Invite |
| | Plate auto-entry | Guard → Gate console | — |
| | Walk-in: ID scan (IC masked), face check, host unit | Guard → Walk-in | Walk-in |
| | Resident approval, call-back fallback | Resident → approval screen; Guard → "Resident said yes by phone" | Walk-in |
| | Watchlist check | Guard → Walk-in | Walk-in |
| | Printed visitor slip | Guard → Walk-in (print sticker) | — |
| | Exit logging | Guard → Gate (check out) | — |
| | Alert inbox with one-tap outcomes | Guard → Alerts | SOS |
| | Incident reporting, shift handover | Guard → Report | Guard shift handover |
| | Offline mode with sync | Guard (banner and sync count) | Offline mode |
| 3. Contractors | Renovation permit, approval, deposit | Resident → Renovation; Portal → Permits | Renovation |
| | Worker registry with face enrolment | Portal → Permits | Renovation |
| | Hours and zone enforcement | Rules "Contractor outside permit hours", "Contractor on a floor not on the permit" | Detection rules |
| | Daily contractor log | Portal → Reports → Contractor and renovation activity | Reports |
| 4. Move-in / move-out | Move booking, service lift, mover and lorry registration, deposit and checklist | Resident → Move in/out; Portal → Permits (service lift) | Move-in |
| 5. Delivery and parcel | Rider registration, drop-off zone rule | Guard → Riders | Rider, drop-off; Rider, to the door |
| | Parcel logging, instant notice | Guard → Parcels | Parcel |
| | Collection by code, with photo proof | Guard → Parcels → Hand over | Parcel |
| | Unclaimed parcel reminders | Portal → Community → Parcels | — |
| 6. Residents and units | Unit database, vehicle registry with limit | Portal → Residents & Units; Portal → Site settings | Limits |
| | Access cards: issue, suspend, replace, lost | Portal → Residents; Resident → My unit | — |
| | Tenant change workflow | Portal → Residents → Change tenant | — |
| | Face enrolment (opt-in) | Resident → Face access | Face access |
| | Household members with their own login | Resident → My unit | — |
| 7. Watchlist | People and vehicles, reason and expiry, match alerts | Portal → Watchlist | Unregistered gallery |
| | Committee approval | Portal → Watchlist (JMB/MC role) | Roles |
| 8. Communication | Announcements to all or specific blocks | Portal → Community | Announcement |
| | Emergency broadcast | Portal → Community (emergency option); Dashboard → Broadcast | Emergency broadcast |
| | Resident to guardhouse (call or message) | Resident → Guardhouse; Guard → Messages | Guardhouse messages |
| | Video intercom | Panel; Resident (incoming call) | Video intercom |
| 9. Add-ons | Facility booking with rules and deposits | Resident → Book; Portal → Facilities | Facility booking |
| | Fee billing, online payment, arrears, facility restriction | Resident → Fees; Portal → Community → Fees | Billing |
| | Defect and complaint ticketing | Resident → Report issue; Portal → Community → Tickets | Defect report |
| | e-Voting and proxies | Resident → AGM and e-voting; Portal → Community → Voting | e-Voting |

## EzVision use cases (48 rules)

Portal → Detection Rules lists every detection, each with a zone, schedule, sensitivity, package tier and on/off switch. Journey: Detection rules.

| Category | Rules |
| --- | --- |
| A. Perimeter and access | Fence tripwire, side or back gate breach, restricted zones (roof, M&E, substation, water tank, genset), after-hours facility presence, fire door held or forced, loitering, weapons |
| B. Carpark and vehicles | Watchlist plate, visitor overstay, bay misuse, fire lane and hydrant, double parking and ramp obstruction, wrong-way driving, abandoned vehicle, door-checking between cars, level occupancy |
| C. People safety | Fall or collapse, fighting, child alone near pool, crowd, person down in a lift |
| D. Fire and hazard | Smoke or flame, basement flooding |
| E. Nuisance and property | Dumping, objects thrown from height, vandalism, smoking, pets, littering |
| F. Contractors and delivery | Out of hours, out of zone, rider beyond drop-off, parcel theft |
| G. Guard accountability and system health | Guardhouse unattended, missed patrol checkpoint, slow response, camera offline or tampered, unusual activity (learned normal) |
| Audio | Glass breaking or bang, screaming, late-night noise |

## Evidence, dashboard, reports and roles

| Proposal | Where | Journey |
| --- | --- | --- |
| Plain-language evidence search, voice search | Portal → Evidence Search | — |
| Related clips grouped into one incident (case builder) | Portal → Evidence Search → build case | — |
| Evidence pack: clips and timeline as PDF | Portal → Alerts & Incidents → Evidence pack | Incident |
| Dashboard KPIs, live alert feed, site map with pins, traffic by hour and entry point, carpark occupancy, camera health | Portal → Command Center | Portal sign-in |
| Eight reports, PDF and Excel | Portal → Reports (plus parcels, permits, strata accounts, pilot metrics) | Reports |
| Roles: JMB/MC committee, building manager, security supervisor | Portal sign-in (role) | Roles |
| Audit trail of views, exports, approvals and changes | Portal → Privacy & PDPA → Audit log | — |
| Integrations: CCTV/NVR, barriers, turnstiles, access cards, lift access, intercom, WhatsApp/SMS, payments | Portal → Integrations | UHF tag, accounts and integrations |

## Benchmark gaps (proposal items 1–18)

| # | Feature | Where | Journey |
| --- | --- | --- | --- |
| 1 | AI talk-down | Guard → Alerts; rule actions | — |
| 2 | AI operator agent | Portal → Command Center (EzVision Agent) | — |
| 3 | AI incident narrative, case builder, expiring share links | Portal → Incidents (summary, share for 7 days); Evidence Search | — |
| 4 | ID-to-face check, liveness for self-registration | Guard → Walk-in; Pass → selfie | Walk-in, Invite |
| 5 | IC OCR auto-fill | Guard → Walk-in (Scan ID) | Walk-in |
| 6 | Compound alerts | Portal → Detection Rules (only alert when…) | Detection rules |
| 7 | Unusual activity (learned normal) | Rule in Guard accountability | Detection rules |
| 8 | Audio detection | Audio rules | Detection rules |
| 9 | Panic / SOS | Resident → SOS | SOS |
| 10 | Single-use delivery code with photo stamp | Resident → Parcels (courier pass); Guard → Riders | Courier pass |
| 11 | Smart parcel lockers | Guard → Parcels (smart locker); Resident → Parcels | Parcel locker |
| 12 | Guest QR/PIN at the intercom, face unlock | Panel (I have a visitor pass); selfie | Visitor self-entry |
| 13 | In-app intercom from the guardhouse | Guard → Messages / Walk-in → Call unit | Video intercom |
| 14 | Wrong check-in and visitor aging reports | Portal → Reports | Reports |
| 15 | Unified map timeline | Portal → Evidence Search | Map timeline |
| 16 | Voice search | Portal → Evidence Search (microphone) | — |
| 17 | UHF/RFID windscreen tags | Portal → Residents → Issue UHF tag | UHF tag, accounts and integrations |
| 18 | Accounting, levy and sinking fund | Portal → Community → Fees (strata accounts); Reports | UHF tag, accounts and integrations |

## PDPA and governance

| Proposal | Where |
| --- | --- |
| Opt-in face enrolment with consent | Resident → Face access; Pass → selfie consent |
| Signage and privacy notice | Portal → Privacy (signage text); Pass → "How we use your data" |
| IC numbers masked | Guard → Walk-in; resident approval shows the last 4 digits only |
| Unknown faces kept briefly, never auto-enrolled | Portal → Privacy → Retention |
| Retention set by the MC | Portal → Privacy → Retention |
| Role-based access, every view and export logged | Portal roles; Privacy → Audit log |
| Data subject requests | Portal → Privacy → Data requests |
| Breach response | Portal → Privacy → Breach response |

## Implementation plan

The pilot success metrics (digital capture, unregistered entries and share resolved, alert-to-response time, false alert rate, app adoption) are computed from live data in Portal → Reports → Pilot success metrics.
