# Audit report

Run on 2026-09-24 against the production build (`npm run build` + `vite preview`). The runner was Playwright with headless Chromium.

## Summary

| Check | Desktop 1440×900 | Mobile 390×844 |
| --- | --- | --- |
| Routes loaded | 55 | 55 |
| Buttons, links, toggles clicked | 825 | 832 |
| Controls with no effect (dead) | 0 | 0 |
| Runtime errors (console or uncaught) | 0 | 0 |
| Pages with horizontal scroll | 0 | 0 |
| End-to-end journeys | 19 / 19 passed | 19 / 19 passed |

## How the click audit works

The audit signs in to each app through its real login screen. It then opens every route, finds every visible button, link, checkbox and slider, and clicks each one on a fresh copy of the state. A control passes if the click changes something: the URL, the page content, a dialog, a toast, a download, a new tab, a toggle state or stored data. When a control opens a dialog or drawer, every control inside that dialog is clicked too. A control that repeats on the same page, such as the Remind button on every row or the sidebar links on every page, is tested once. Links to external sites, `tel:` and `mailto:` are checked for a valid target but not followed.

## Routes, desktop

| Route | Lands on | Controls on page | Clicked (new ones, incl. inside dialogs) | Dead |
| --- | --- | --- | --- | --- |
| `/` | `/` | 5 | 8 | 0 |
| `/login` | `/login` | 5 | 8 | 0 |
| `/guard/login` | `/guard/login` | 17 | 17 | 0 |
| `/app/login` | `/app/login` | 2 | 1 | 0 |
| `/v/v-10` | `/v/v-10` | 2 | 3 | 0 |
| `/v/v-10/selfie` | `/v/v-10/selfie` | 2 | 1 | 0 |
| `/v/v-1` | `/v/v-1` | 1 | 0 | 0 |
| `/d/A15074K2P` | `/d/A15074K2P` | 0 | 0 | 0 |
| `/d/bad` | `/d/bad` | 0 | 0 | 0 |
| `/v/nope` | `/v/nope` | 0 | 0 | 0 |
| `/nonexistent` | `/nonexistent` | 1 | 1 | 0 |
| `/portal/dashboard` | `/portal/dashboard` | 50 | 74 | 0 |
| `/portal/live` | `/portal/live` | 49 | 27 | 0 |
| `/portal/incidents` | `/portal/incidents` | 42 | 23 | 0 |
| `/portal/incidents/al-2` | `/portal/incidents/al-2` | 42 | 1 | 0 |
| `/portal/unregistered` | `/portal/unregistered` | 38 | 27 | 0 |
| `/portal/search` | `/portal/search` | 39 | 12 | 0 |
| `/portal/search?q=red%20myvi%20yesterday` | `/portal/search?q=red%20myvi%20yesterday` | 39 | 6 | 0 |
| `/portal/visitors` | `/portal/visitors` | 40 | 20 | 0 |
| `/portal/vehicles` | `/portal/vehicles` | 60 | 39 | 0 |
| `/portal/permits` | `/portal/permits` | 25 | 11 | 0 |
| `/portal/residents` | `/portal/residents` | 35 | 15 | 0 |
| `/portal/residents/A-15-07` | `/portal/residents/A-15-07` | 38 | 29 | 0 |
| `/portal/watchlist` | `/portal/watchlist` | 37 | 7 | 0 |
| `/portal/guards` | `/portal/guards` | 41 | 56 | 0 |
| `/portal/community` | `/portal/community` | 26 | 10 | 0 |
| `/portal/community?tab=bookings` | `/portal/community?tab=bookings` | 38 | 17 | 0 |
| `/portal/community?tab=tickets` | `/portal/community?tab=tickets` | 28 | 7 | 0 |
| `/portal/community?tab=fees` | `/portal/community?tab=fees` | 35 | 4 | 0 |
| `/portal/community?tab=parcels` | `/portal/community?tab=parcels` | 27 | 2 | 0 |
| `/portal/community?tab=voting` | `/portal/community?tab=voting` | 27 | 7 | 0 |
| `/portal/reports` | `/portal/reports` | 40 | 25 | 0 |
| `/portal/rules` | `/portal/rules` | 74 | 148 | 0 |
| `/portal/privacy` | `/portal/privacy` | 29 | 8 | 0 |
| `/guard` | `/guard` | 27 | 26 | 0 |
| `/guard/alerts` | `/guard/alerts` | 17 | 9 | 0 |
| `/guard/alerts/al-2` | `/guard/alerts/al-2` | 17 | 14 | 0 |
| `/guard/walk-in` | `/guard/walk-in` | 11 | 2 | 0 |
| `/guard/verify` | `/guard/verify` | 12 | 3 | 0 |
| `/guard/parcels` | `/guard/parcels` | 14 | 5 | 0 |
| `/guard/patrol` | `/guard/patrol` | 12 | 6 | 0 |
| `/guard/report` | `/guard/report` | 17 | 8 | 0 |
| `/app` | `/app` | 21 | 20 | 0 |
| `/app/invite` | `/app/invite` | 17 | 12 | 0 |
| `/app/pass/v-14` | `/app/pass/v-14` | 13 | 8 | 0 |
| `/app/visitors` | `/app/visitors` | 12 | 5 | 0 |
| `/app/parcels` | `/app/parcels` | 11 | 6 | 0 |
| `/app/book` | `/app/book` | 34 | 29 | 0 |
| `/app/activity` | `/app/activity` | 18 | 11 | 0 |
| `/app/unit` | `/app/unit` | 25 | 19 | 0 |
| `/app/face` | `/app/face` | 9 | 0 | 0 |
| `/app/renovation` | `/app/renovation` | 9 | 1 | 0 |
| `/app/billing` | `/app/billing` | 12 | 9 | 0 |
| `/app/approval/ap-1` | `/app/approval/ap-1` | 5 | 4 | 0 |
| `/app/sos` | `/app/sos` | 6 | 5 | 0 |

## Routes, mobile

| Route | Lands on | Controls on page | Clicked (new ones, incl. inside dialogs) | Dead |
| --- | --- | --- | --- | --- |
| `/` | `/` | 5 | 8 | 0 |
| `/login` | `/login` | 5 | 8 | 0 |
| `/guard/login` | `/guard/login` | 17 | 17 | 0 |
| `/app/login` | `/app/login` | 2 | 1 | 0 |
| `/v/v-10` | `/v/v-10` | 2 | 3 | 0 |
| `/v/v-10/selfie` | `/v/v-10/selfie` | 2 | 1 | 0 |
| `/v/v-1` | `/v/v-1` | 1 | 0 | 0 |
| `/d/A15074K2P` | `/d/A15074K2P` | 0 | 0 | 0 |
| `/d/bad` | `/d/bad` | 0 | 0 | 0 |
| `/v/nope` | `/v/nope` | 0 | 0 | 0 |
| `/nonexistent` | `/nonexistent` | 1 | 1 | 0 |
| `/portal/dashboard` | `/portal/dashboard` | 33 | 70 | 0 |
| `/portal/live` | `/portal/live` | 32 | 26 | 0 |
| `/portal/incidents` | `/portal/incidents` | 12 | 9 | 0 |
| `/portal/incidents/al-2` | `/portal/incidents/al-2` | 17 | 15 | 0 |
| `/portal/unregistered` | `/portal/unregistered` | 19 | 44 | 0 |
| `/portal/search` | `/portal/search` | 22 | 12 | 0 |
| `/portal/search?q=red%20myvi%20yesterday` | `/portal/search?q=red%20myvi%20yesterday` | 22 | 6 | 0 |
| `/portal/visitors` | `/portal/visitors` | 23 | 20 | 0 |
| `/portal/vehicles` | `/portal/vehicles` | 43 | 39 | 0 |
| `/portal/permits` | `/portal/permits` | 7 | 10 | 0 |
| `/portal/residents` | `/portal/residents` | 18 | 15 | 0 |
| `/portal/residents/A-15-07` | `/portal/residents/A-15-07` | 21 | 29 | 0 |
| `/portal/watchlist` | `/portal/watchlist` | 20 | 7 | 0 |
| `/portal/guards` | `/portal/guards` | 24 | 56 | 0 |
| `/portal/community` | `/portal/community` | 9 | 10 | 0 |
| `/portal/community?tab=bookings` | `/portal/community?tab=bookings` | 21 | 17 | 0 |
| `/portal/community?tab=tickets` | `/portal/community?tab=tickets` | 11 | 7 | 0 |
| `/portal/community?tab=fees` | `/portal/community?tab=fees` | 18 | 4 | 0 |
| `/portal/community?tab=parcels` | `/portal/community?tab=parcels` | 10 | 2 | 0 |
| `/portal/community?tab=voting` | `/portal/community?tab=voting` | 10 | 7 | 0 |
| `/portal/reports` | `/portal/reports` | 23 | 25 | 0 |
| `/portal/rules` | `/portal/rules` | 57 | 148 | 0 |
| `/portal/privacy` | `/portal/privacy` | 12 | 8 | 0 |
| `/guard` | `/guard` | 24 | 24 | 0 |
| `/guard/alerts` | `/guard/alerts` | 14 | 9 | 0 |
| `/guard/alerts/al-2` | `/guard/alerts/al-2` | 14 | 14 | 0 |
| `/guard/walk-in` | `/guard/walk-in` | 8 | 2 | 0 |
| `/guard/verify` | `/guard/verify` | 9 | 3 | 0 |
| `/guard/parcels` | `/guard/parcels` | 11 | 5 | 0 |
| `/guard/patrol` | `/guard/patrol` | 10 | 6 | 0 |
| `/guard/report` | `/guard/report` | 15 | 8 | 0 |
| `/app` | `/app` | 21 | 20 | 0 |
| `/app/invite` | `/app/invite` | 17 | 12 | 0 |
| `/app/pass/v-14` | `/app/pass/v-14` | 13 | 8 | 0 |
| `/app/visitors` | `/app/visitors` | 12 | 5 | 0 |
| `/app/parcels` | `/app/parcels` | 11 | 6 | 0 |
| `/app/book` | `/app/book` | 34 | 29 | 0 |
| `/app/activity` | `/app/activity` | 18 | 11 | 0 |
| `/app/unit` | `/app/unit` | 25 | 19 | 0 |
| `/app/face` | `/app/face` | 9 | 0 | 0 |
| `/app/renovation` | `/app/renovation` | 9 | 1 | 0 |
| `/app/billing` | `/app/billing` | 12 | 9 | 0 |
| `/app/approval/ap-1` | `/app/approval/ap-1` | 5 | 4 | 0 |
| `/app/sos` | `/app/sos` | 6 | 5 | 0 |

## End-to-end journeys, desktop

The portal, guard tablet, resident app and visitor pass run as four tabs in one browser, like on a single machine. Every step waits for the real UI to update in the other tab.

| Journey | Result |
| --- | --- |
| Launcher lists the four apps and resets demo data | Pass (3.7 s) |
| Portal: protected routes redirect to sign-in | Pass (0.3 s) |
| Portal: sign in with email, password and 2-step code | Pass (4.5 s) |
| Guard: wrong PIN is refused, right PIN signs in | Pass (18.7 s) |
| Resident: sign in with phone and SMS code | Pass (3.2 s) |
| Walk-in: guard scans ID, checks face, asks A-15-07; resident approves in the app; guard checks in; portal sees visitor | Pass (20.9 s) |
| Invite: resident creates a pass; visitor opens it and adds a selfie; guard verifies by PIN and checks in; resident is notified | Pass (7.1 s) |
| SOS: resident holds SOS; guard tablet gets banner and responds; resident sees each step; closed | Pass (17.3 s) |
| Parcel: guard logs a parcel; resident sees the code; guard hands over by code; resident history updates | Pass (4.6 s) |
| Renovation: resident applies; manager approves in the portal; resident pays deposit; permit active | Pass (26.8 s) |
| Announcement: manager composes; resident receives it | Pass (3.4 s) |
| Unregistered gallery: add unknown person to watchlist; appears on the watchlist page | Pass (4.0 s) |
| Facility booking: resident books BBQ pit; manager sees it on the bookings timeline | Pass (15.2 s) |
| Billing: resident pays the Q4 bill by FPX and downloads the receipt | Pass (7.8 s) |
| Patrol: guard verifies next checkpoint; portal patrol matrix updates | Pass (3.6 s) |
| Face access: resident enrols with consent, then deletes | Pass (17.3 s) |
| Incident: manager acknowledges, dispatches and closes an alert with outcome; evidence pack downloads | Pass (0.5 s) |
| Guard shift handover: checklist, sign off, logged out | Pass (8.8 s) |
| Sign out: resident and portal | Pass (7.1 s) |

Runtime errors during journeys: none.

## End-to-end journeys, mobile

The portal, guard tablet, resident app and visitor pass run as four tabs in one browser, like on a single machine. Every step waits for the real UI to update in the other tab.

| Journey | Result |
| --- | --- |
| Launcher lists the four apps and resets demo data | Pass (2.6 s) |
| Portal: protected routes redirect to sign-in | Pass (0.3 s) |
| Portal: sign in with email, password and 2-step code | Pass (3.6 s) |
| Guard: wrong PIN is refused, right PIN signs in | Pass (21.7 s) |
| Resident: sign in with phone and SMS code | Pass (3.2 s) |
| Walk-in: guard scans ID, checks face, asks A-15-07; resident approves in the app; guard checks in; portal sees visitor | Pass (23.2 s) |
| Invite: resident creates a pass; visitor opens it and adds a selfie; guard verifies by PIN and checks in; resident is notified | Pass (9.2 s) |
| SOS: resident holds SOS; guard tablet gets banner and responds; resident sees each step; closed | Pass (26.2 s) |
| Parcel: guard logs a parcel; resident sees the code; guard hands over by code; resident history updates | Pass (6.9 s) |
| Renovation: resident applies; manager approves in the portal; resident pays deposit; permit active | Pass (34.0 s) |
| Announcement: manager composes; resident receives it | Pass (6.3 s) |
| Unregistered gallery: add unknown person to watchlist; appears on the watchlist page | Pass (12.4 s) |
| Facility booking: resident books BBQ pit; manager sees it on the bookings timeline | Pass (18.3 s) |
| Billing: resident pays the Q4 bill by FPX and downloads the receipt | Pass (10.2 s) |
| Patrol: guard verifies next checkpoint; portal patrol matrix updates | Pass (3.3 s) |
| Face access: resident enrols with consent, then deletes | Pass (17.3 s) |
| Incident: manager acknowledges, dispatches and closes an alert with outcome; evidence pack downloads | Pass (5.1 s) |
| Guard shift handover: checklist, sign off, logged out | Pass (14.8 s) |
| Sign out: resident and portal | Pass (7.2 s) |

Runtime errors during journeys: none.

## Fixed during the audit

- Mobile: 6 portal pages were wider than a 390 px phone (up to 361 px too wide). The phone zoomed the whole page out, and dialog buttons became hard to tap. There were three causes: charts that never shrank below 600 px, grid columns that grew to fit wide tables, and hidden screen-reader text inside scrolling tables. All three are fixed. Every page now fits the phone width.
- Dialogs: typing in the second or later field sent focus back to the first field, because an inline onClose re-ran the modal's focus effect on every keystroke. Fixed for every modal and drawer.
- Permits and Unregistered: at 1280 px and wider, clicking a row also opened the mobile detail drawer over the side panel and blocked its buttons. The drawer now opens only below 1280 px.
- Live View: Full screen did nothing where the browser blocks the Fullscreen API. It now switches to a video-wall mode with an Exit button, and Esc also exits.
- Guard tablet: the logo overflowed the 92 px navigation rail and covered the header. The rail now shows the icon only. Visitor rows on phones now wrap the Check in button onto its own line so names are no longer squeezed.
- Unregistered gallery: sighting thumbnails ignored their width and pushed the text 27 px off-screen. Camera tiles and form fields now respect the width a page gives them.
- Guard Performance: the status dropdown collapsed and the row actions were clipped. The dropdown now has a fixed width and the row actions are icon buttons. Community bookings: the day tabs now scroll inside the card on phones.
- Charts: the last x-axis label was clipped at the right edge.
- Evidence Search: the selected result now reports its pressed state to screen readers. Resident Activity: notices with no link that are already read are no longer shown as buttons.
- Guard PIN pad: Delete is disabled while no digits are entered.

## Known limits (by design, front end only)

- There is no backend. Data lives in the browser's localStorage and syncs between tabs on one machine, not between devices. Use **Reset demo data** on the launcher to start over.
- Camera views, faces and QR codes are drawn illustrations. ID scanning, face matching, plate reads, payments, SMS and WhatsApp are simulated with realistic delays and results.
- Web fonts load from Google Fonts. The audit sandbox blocks them, so those network errors were excluded, and the app falls back to system fonts.
