// End-to-end user journeys across the four apps, sharing one browser profile (like tabs on one machine).
import { chromium, expect } from 'playwright/test';
import fs from 'node:fs';

const BASE = process.env.BASE_URL || 'http://localhost:4173';
const EXE = process.env.CHROMIUM_PATH || undefined;
const VP = process.argv[2] ?? 'desktop';
const viewport = VP === 'mobile' ? { width: 390, height: 844 } : { width: 1366, height: 860 };
const results = [];
const errors = [];

async function ready(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() => !document.querySelector('[aria-label="Loading"]') && document.body.innerText.length > 20, null, { timeout: 8000 }).catch(() => {});
}
const go = async (page, path) => { await page.goto(BASE + path); await ready(page); };

async function step(name, fn) {
  const t = Date.now();
  try { await fn(); results.push({ name, ok: true, ms: Date.now() - t }); console.log('PASS', name); }
  catch (e) { results.push({ name, ok: false, error: String(e.message).split('\n').slice(0, 3).join(' ') }); console.log('FAIL', name, String(e.message).split('\n')[0]); }
}

const browser = await chromium.launch({ executablePath: EXE });
const ctx = await browser.newContext({ viewport, isMobile: VP === 'mobile', hasTouch: VP === 'mobile', acceptDownloads: true });
const portal = await ctx.newPage();
const guard = await ctx.newPage();
const res = await ctx.newPage();
const visitor = await ctx.newPage();
for (const [n, p] of [['portal', portal], ['guard', guard], ['resident', res], ['visitor', visitor]]) {
  p.on('pageerror', (e) => errors.push(`${n}: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error' && !/ERR_TUNNEL|ERR_CERT_AUTHORITY_INVALID|fonts\.g/.test(m.text())) errors.push(`${n}: ${m.text()}`); });
}
expect.configure?.({ timeout: 6000 });
const T = { timeout: 7000 };

await step('Launcher lists the four apps and resets demo data', async () => {
  await go(portal, '/');
  await portal.getByRole('button', { name: 'Reset demo data' }).click();
  await portal.getByRole('dialog').getByRole('button', { name: 'Reset' }).click();
  await expect(portal.getByText('Demo data reset')).toBeVisible(T);
  for (const t of ['Management Portal', 'Guard Tablet', 'Resident App', 'Visitor & Courier Pass']) await expect(portal.getByText(t, { exact: true })).toBeVisible(T);
});

await step('Portal: protected routes redirect to sign-in', async () => {
  await go(portal, '/portal/visitors');
  await portal.waitForURL('**/login', T);
});

await step('Portal: sign in with email, password and 2-step code', async () => {
  await portal.getByLabel('Work email').first().fill('farah@vistaharmoni.my');
  await portal.getByLabel('Password').fill('secret');
  await portal.getByRole('button', { name: 'Continue' }).click();
  await portal.getByLabel('Verification code').fill('123456');
  await portal.getByRole('button', { name: 'Verify and sign in' }).click();
  await portal.waitForURL('**/portal/visitors', T); // returns to the page that was requested
  await go(portal, '/portal/dashboard');
  await expect(portal.getByText('Live alert feed')).toBeVisible(T);
});

await step('Guard: wrong PIN is refused, right PIN signs in', async () => {
  await go(guard, '/guard');
  await guard.waitForURL('**/guard/login', T);
  await guard.getByRole('button', { name: /Kumar Selvam/ }).click();
  for (const d of '1111') await guard.getByRole('button', { name: d, exact: true }).click();
  await expect(guard.getByText('Wrong PIN')).toBeVisible(T);
  await guard.waitForTimeout(600);
  for (const d of '2468') await guard.getByRole('button', { name: d, exact: true }).click();
  await guard.waitForURL(BASE + '/guard', T);
  await expect(guard.getByRole('heading', { name: 'Gate console' })).toBeVisible(T);
});

await step('Resident: sign in with phone and SMS code', async () => {
  await go(res, '/app');
  await res.waitForURL('**/app/login', T);
  await res.getByRole('button', { name: 'Send code' }).click();
  await res.getByLabel('6-digit code').fill('111222');
  await res.getByRole('button', { name: 'Verify and sign in' }).click();
  await res.waitForURL(BASE + '/app', T);
  await expect(res.getByText('Emergency SOS')).toBeVisible(T);
});

await step('Walk-in: guard scans ID, checks face, asks A-15-07; resident approves in the app; guard checks in; portal sees visitor', async () => {
  await go(guard, '/guard/walk-in');
  await guard.getByRole('button', { name: 'Scan ID' }).click();
  await expect(guard.getByRole('button', { name: 'Next: face check' })).toBeEnabled(T);
  const name = await guard.getByLabel('Full name').inputValue();
  await guard.getByRole('button', { name: 'Next: face check' }).click();
  await guard.getByRole('button', { name: 'Take photo' }).click();
  await expect(guard.getByText('Not on the watchlist')).toBeVisible(T);
  await guard.getByRole('button', { name: 'Next: visit details' }).click();
  await guard.getByRole('button', { name: 'Ask the resident' }).click();
  await expect(guard.getByText('Waiting for A-15-07')).toBeVisible(T);
  // resident tab receives it (storage event sync)
  await expect(res.getByText(`${name} is at the gate`)).toBeVisible(T);
  await res.getByText(`${name} is at the gate`).click();
  await res.getByRole('button', { name: 'Let in' }).click();
  await expect(res.getByText(`${name} can come up`)).toBeVisible(T);
  await expect(guard.getByText(/Approved by Tan Mei Ling/)).toBeVisible(T);
  await guard.getByRole('button', { name: 'Check in and open gate' }).click();
  await guard.waitForURL(BASE + '/guard', T);
  await go(portal, '/portal/visitors');
  await expect(portal.getByText(name).first()).toBeVisible(T);
  await go(res, '/app');
  await expect(res.getByText(name).first()).toBeVisible(T);
});

let pin = '';
let passUrl = '';
await step('Invite: resident creates a pass; visitor opens it and adds a selfie; guard verifies by PIN and checks in; resident is notified', async () => {
  await go(res, '/app/invite');
  await res.getByLabel("Visitor's name").fill('Audit Guest');
  await res.getByLabel('Mobile number').fill('012-555 0101');
  await res.getByRole('button', { name: 'Create pass and send' }).click();
  await res.waitForURL(/\/app\/pass\//, T);
  passUrl = res.url().replace(BASE, '').replace('/app/pass/', '/v/');
  pin = (await res.locator('p.font-mono.text-3xl').first().innerText()).trim();
  if (!/^\d{6}$/.test(pin)) throw new Error('PIN not shown: ' + pin);
  await go(visitor, passUrl);
  await expect(visitor.getByText('Hi Audit, you\'re visiting')).toBeVisible(T);
  await visitor.getByText('Skip the lobby queue.').click();
  await visitor.getByText('I agree to my selfie').click();
  await visitor.getByRole('button', { name: 'Take selfie' }).click();
  await visitor.getByRole('button', { name: 'Use this' }).click();
  await expect(visitor.getByText('Your selfie is on file')).toBeVisible(T);
  await go(guard, '/guard/verify');
  await guard.getByRole('tab', { name: 'PIN' }).click();
  await guard.getByLabel('6-digit pass PIN').fill(pin);
  await guard.getByRole('button', { name: 'Check PIN' }).click();
  await expect(guard.getByText(/Pass valid/)).toBeVisible(T);
  await expect(guard.getByText('Selfie on file')).toBeVisible(T);
  await guard.getByRole('button', { name: 'Check in', exact: true }).click();
  await expect(guard.getByText('Audit Guest checked in')).toBeVisible(T);
  await go(res, '/app/activity');
  await expect(res.getByText('Audit Guest arrived')).toBeVisible(T);
  await go(visitor, passUrl);
  await expect(visitor.getByText(/Checked in at/)).toBeVisible(T);
});

await step('SOS: resident holds SOS; guard tablet gets banner and responds; resident sees each step; closed', async () => {
  await go(res, '/app/sos');
  await res.getByRole('button', { name: 'Intruder' }).click();
  const btn = res.getByRole('button', { name: 'Hold for 2 seconds to send SOS' });
  const box = await btn.boundingBox();
  await res.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await res.mouse.down(); await res.waitForTimeout(2300); await res.mouse.up();
  await expect(res.getByText('Help is coming')).toBeVisible(T);
  await go(guard, '/guard');
  const banner = guard.getByRole('link', { name: /SOS · Intruder · A-15-07/ });
  await expect(banner).toBeVisible(T);
  await banner.click();
  await guard.getByRole('button', { name: "I've got this" }).click();
  await expect(res.getByText('Kumar Selvam is handling your alert', { exact: false })).toBeVisible(T);
  await guard.getByRole('button', { name: "I'm going there" }).click();
  await guard.getByRole('button', { name: "I'm on scene" }).click();
  await guard.getByRole('button', { name: 'Close', exact: true }).click();
  await guard.getByRole('dialog').getByRole('button', { name: 'Close alert' }).click();
  await guard.waitForURL('**/guard/alerts', T);
  await expect(res.getByText('Resolved')).toBeVisible(T);
  await go(portal, '/portal/incidents');
  await portal.getByRole('tab', { name: 'Closed' }).click();
  await expect(portal.getByText(/SOS · Intruder/).first()).toBeVisible(T);
});

await step('Parcel: guard logs a parcel; resident sees the code; guard hands over by code; resident history updates', async () => {
  await go(guard, '/guard/parcels');
  await guard.getByLabel('Unit').fill('A-15-07');
  await guard.getByLabel('Tracking number').fill('SPXAUDIT0001');
  await guard.getByRole('button', { name: 'Log parcel and notify' }).click();
  const code = (await guard.locator('p.font-mono.text-4xl').innerText()).trim();
  await go(res, '/app/parcels');
  await expect(res.getByText(code)).toBeVisible(T);
  await go(guard, '/guard/parcels');
  await guard.getByRole('tab', { name: /Hand over/ }).click();
  await guard.getByLabel(/Pickup code/).fill(code);
  await guard.getByRole('button', { name: 'Find parcel' }).click();
  await guard.getByRole('button', { name: 'Hand over', exact: true }).first().click();
  await expect(guard.getByText('Handed over')).toBeVisible(T);
  await go(res, '/app/parcels');
  await res.getByRole('tab', { name: 'Collected' }).click();
  await expect(res.getByText('SPXAUDIT0001', { exact: false })).toBeVisible(T);
});

await step('Renovation: resident applies; manager approves in the portal; resident pays deposit; permit active', async () => {
  await go(res, '/app/renovation');
  await res.getByRole('button', { name: 'Apply for a permit' }).click();
  await res.getByLabel('Contractor company').fill('Audit Builders Sdn Bhd');
  const d = new Date(); d.setDate(d.getDate() + 5); const e = new Date(); e.setDate(e.getDate() + 9);
  const f = (x) => x.toISOString().slice(0, 10);
  await res.getByLabel('Start').fill(f(d));
  await res.getByLabel('End').fill(f(e));
  await res.getByLabel('Worker 1').fill('Ali Worker');
  for (const doc of ['Floor plan with work marked', 'Contractor SSM registration', 'Public liability insurance', 'Worker IC list']) await res.getByRole('button', { name: new RegExp(doc) }).click();
  await res.getByRole('button', { name: 'Submit application' }).click();
  await expect(res.getByText('Audit Builders Sdn Bhd', { exact: false })).toBeVisible(T);
  const permitId = (await res.locator('p.font-mono.text-xs').first().innerText()).trim();
  await go(portal, '/portal/permits');
  await portal.getByRole('tab', { name: /Applications/ }).click();
  await portal.getByRole('row', { name: `Open ${permitId}` }).click();
  await portal.getByRole('button', { name: 'Approve permit' }).first().click();
  await go(res, '/app/activity');
  await expect(res.getByText(new RegExp(`Permit ${permitId}`))).toBeVisible(T);
  await go(res, '/app/renovation');
  await res.getByRole('button', { name: /Pay deposit/ }).click();
  await expect(res.getByText('Active', { exact: true }).first()).toBeVisible(T);
});

await step('Announcement: manager composes; resident receives it', async () => {
  await go(portal, '/portal/community?compose=1');
  await portal.getByLabel('Title').fill('Audit: lift maintenance Tower A');
  await portal.getByLabel('Message').fill('Lift A2 is closed on Saturday 9am to 1pm.');
  await portal.getByRole('button', { name: /Send to/ }).click();
  await expect(portal.getByText('Announcement sent')).toBeVisible(T);
  await go(res, '/app/activity');
  await expect(res.getByText('Audit: lift maintenance Tower A')).toBeVisible(T);
});

await step('Unregistered gallery: add unknown person to watchlist; appears on the watchlist page', async () => {
  await go(portal, '/portal/unregistered');
  if (VP === 'mobile') await portal.locator('main button.card').first().click();
  await portal.getByRole('button', { name: 'Add to watchlist' }).first().click();
  await portal.getByRole('dialog').last().getByRole('button', { name: 'Add to watchlist' }).click();
  await expect(portal.getByRole('status').filter({ hasText: 'Added to watchlist' })).toBeVisible(T);
  await go(portal, '/portal/watchlist');
  await expect(portal.getByText(/Unknown U-0923/).first()).toBeVisible(T);
});

await step('Facility booking: resident books BBQ pit; manager sees it on the bookings timeline', async () => {
  await go(res, '/app/book');
  await res.getByRole('button', { name: /BBQ pit 2/ }).click();
  await res.locator('button.w-14').nth(3).click(); // three days ahead
  await res.getByRole('button', { name: '9:00', exact: true }).click();
  await res.getByRole('button', { name: /Book 9:00/ }).click();
  await res.getByRole('dialog').getByRole('button', { name: /Pay RM/ }).click();
  await expect(res.getByText('BBQ pit 2 booked')).toBeVisible(T);
  await go(res, '/app/billing');
  await expect(res.getByText('BBQ pit 2 booking')).toBeVisible(T);
  await go(portal, '/portal/community?tab=bookings');
  await portal.getByRole('tablist', { name: 'Day' }).getByRole('tab').nth(3).click();
  await expect(portal.getByRole('button', { name: 'Cancel BBQ pit 2 booking for A-15-07' })).toBeAttached(T);
});

await step('Billing: resident pays the Q4 bill by FPX and downloads the receipt', async () => {
  await go(res, '/app/billing');
  await res.getByRole('button', { name: /Pay RM 1,026/ }).click();
  await res.getByRole('dialog').getByRole('button', { name: 'Pay now' }).click();
  await expect(res.getByText('All paid up')).toBeVisible(T);
  const [dl] = await Promise.all([res.waitForEvent('download'), res.getByRole('button', { name: /Download receipt for Q4/ }).click()]);
  if (!dl.suggestedFilename().startsWith('receipt-')) throw new Error('bad receipt');
});

await step('Patrol: guard verifies next checkpoint; portal patrol matrix updates', async () => {
  await go(guard, '/guard/patrol');
  const nextName = (await guard.locator('p.text-xl.font-extrabold').first().innerText()).trim();
  await guard.getByRole('button', { name: "I'm here" }).click();
  await expect(guard.getByText(`${nextName} verified`)).toBeVisible(T);
  await go(portal, '/portal/guards');
  await expect(portal.getByText(/8 of 12 done/)).toBeVisible(T);
});

await step('Face access: resident enrols with consent, then deletes', async () => {
  await go(res, '/app/face');
  await res.getByText('I agree to Vista Harmoni processing').click();
  await res.getByRole('button', { name: 'Start' }).click();
  for (let i = 0; i < 3; i++) { await res.getByRole('button', { name: 'Capture' }).click(); await res.waitForTimeout(950); }
  await expect(res.getByRole('heading', { name: 'Face access is on' })).toBeVisible(T);
  await res.getByRole('button', { name: /Turn off and delete/ }).click();
  await res.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
  await expect(res.getByRole('heading', { name: 'Walk in without your card' })).toBeVisible(T);
});

await step('Incident: manager acknowledges, dispatches and closes an alert with outcome; evidence pack downloads', async () => {
  await go(portal, '/portal/incidents/al-2');
  const ack = portal.getByRole('button', { name: /Acknowledge/ }).first();
  if (await ack.isVisible()) await ack.click();
  const [dl] = await Promise.all([portal.waitForEvent('download', T), portal.getByRole('button', { name: /Evidence pack/i }).first().click()]);
  if (!dl) throw new Error('no download');
});

await step('Guardhouse messages: resident messages the guardhouse; guard replies on the tablet; resident sees the reply', async () => {
  await go(res, '/app/guardhouse');
  await res.getByLabel('Message to the guardhouse').fill('Audit: is the pool open tonight?');
  await res.getByRole('button', { name: 'Send message' }).click();
  await expect(res.getByText('Audit: is the pool open tonight?')).toBeVisible(T);
  await go(guard, '/guard/messages');
  await guard.getByRole('button', { name: /A-15-07/ }).click();
  await expect(guard.getByRole('region', { name: 'Conversation with A-15-07' }).getByText('Audit: is the pool open tonight?')).toBeVisible(T);
  await guard.getByLabel('Reply to A-15-07').fill('Audit: yes, until 10pm.');
  await guard.getByRole('button', { name: 'Send reply' }).click();
  await go(res, '/app/guardhouse');
  await expect(res.getByText('Audit: yes, until 10pm.')).toBeVisible(T);
  await go(res, '/app/activity');
  await expect(res.getByText('Guardhouse replied').first()).toBeVisible(T);
});

await step('Defect report: resident reports a problem with a photo; manager sees it and updates it; resident is notified', async () => {
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAAEklEQVR4nGP4z8DAwMDAwMAAAAr2AQG5fYB3AAAAAElFTkSuQmCC', 'base64');
  await go(res, '/app/report');
  await res.getByRole('button', { name: 'Report an issue' }).click();
  await res.getByLabel('Type').selectOption('Defect');
  await res.getByLabel('What is the problem?').fill('Audit: corridor light broken');
  await res.getByLabel('Where?').fill('Tower A, level 15 lift lobby');
  await res.getByLabel('Photo of the problem').setInputFiles({ name: 'light.png', mimeType: 'image/png', buffer: png });
  await expect(res.getByRole('img', { name: 'Photo of the problem' })).toBeVisible(T);
  await res.getByRole('button', { name: 'Send report' }).click();
  const card = res.locator('.card', { hasText: 'Audit: corridor light broken' });
  await expect(card).toBeVisible(T);
  const id = (await card.innerText()).match(/TK-\d+/)[0];
  await go(portal, '/portal/community?tab=tickets');
  await expect(portal.getByText('Audit: corridor light broken')).toBeVisible(T);
  await expect(portal.getByRole('button', { name: `View photo for ${id}` })).toBeVisible(T);
  await portal.getByLabel(`Change state of ${id}`).selectOption('Assigned');
  await go(res, '/app/report');
  await expect(res.locator('.card', { hasText: 'Audit: corridor light broken' }).getByText('Assigned')).toBeVisible(T);
  await go(res, '/app/activity');
  await expect(res.getByText(`${id} is assigned`)).toBeVisible(T);
});

await step('Move-in: resident books the service lift and pays the deposit; manager approves; lorry is expected at the gate; inspection closes it and refunds', async () => {
  await go(res, '/app/move');
  await res.getByRole('button', { name: 'Book a move' }).click();
  await res.getByLabel('Moving company').fill('Audit Movers');
  await res.getByLabel('Lorry plate').fill('AUD 1234');
  await res.getByText('I accept the moving rules').click();
  await res.getByRole('button', { name: 'Continue' }).click();
  await res.getByRole('dialog').getByRole('button', { name: /Pay RM 500/ }).click();
  await expect(res.getByText('Waiting for approval')).toBeVisible(T);
  await go(portal, '/portal/permits');
  const req = portal.locator('div.rounded-lg', { hasText: 'Move-in · A-15-07' }).filter({ hasText: 'Audit Movers' });
  await req.getByRole('button', { name: 'Approve' }).click();
  await expect(portal.getByText('Move approved')).toBeVisible(T);
  const expected = await portal.evaluate(() => JSON.parse(localStorage.getItem('ezvision-condo-suite:v1')).state.visits.some((v) => v.plate === 'AUD 1234' && v.status === 'expected'));
  if (!expected) throw new Error('lorry not on the expected list');
  await go(res, '/app/move');
  await expect(res.getByText('Approved', { exact: true })).toBeVisible(T);
  await go(portal, '/portal/permits');
  await portal.getByRole('button', { name: /Move-in · A-15-07/ }).click();
  const dlg = portal.getByRole('dialog');
  await dlg.getByText('Before the move').click();
  await dlg.getByText('After the move').click();
  await dlg.getByRole('button', { name: /Close and refund RM 500/ }).click();
  await go(res, '/app/move');
  await expect(res.getByText('Completed', { exact: true })).toBeVisible(T);
  await expect(res.getByText(/refunded/)).toBeVisible(T);
});

await step('Guard shift handover: checklist, sign off, logged out', async () => {
  await go(guard, '/guard/report');
  await guard.getByRole('tab', { name: 'Shift handover' }).click();
  for (const t of ['Keys and access cards counted', 'Radio and torch handed over, charged', 'Open alerts explained to the next guard', 'Guardhouse screens and barrier checked']) await guard.getByText(t).click();
  await guard.getByRole('button', { name: 'Sign off shift' }).click();
  await guard.getByRole('dialog').getByRole('button', { name: 'Sign off' }).click();
  await guard.waitForURL('**/guard/login', T);
});

await step('Sign out: resident and portal', async () => {
  await go(res, '/app/unit');
  await res.getByRole('button', { name: 'Sign out' }).last().click();
  await res.getByRole('dialog').getByRole('button', { name: 'Sign out' }).click();
  await res.waitForURL('**/app/login', T);
});

fs.writeFileSync(`journeys-${VP}.json`, JSON.stringify({ results, errors: [...new Set(errors)] }, null, 2));
console.log(`\n${results.filter((r) => r.ok).length}/${results.length} journeys passed; ${new Set(errors).size} runtime errors`);
await browser.close();
