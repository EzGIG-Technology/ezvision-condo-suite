// Route + button audit for EzVision Condo Suite.
// Usage: node crawl.mjs <desktop|mobile> [surfaceFilter]
import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = process.env.BASE_URL || 'http://localhost:4173';
const KEY = 'ezvision-condo-suite:v1';
const VP = process.argv[2] ?? 'desktop';
const ONLY = process.argv[3];
const viewport = VP === 'mobile' ? { width: 390, height: 844 } : { width: 1440, height: 900 };
const EXE = process.env.CHROMIUM_PATH || undefined;

const SURFACES = {
  public: { login: null, routes: ['/', '/login', '/guard/login', '/app/login', '/v/v-10', '/v/v-10/selfie', '/v/v-1', '/d/A15074K2P', '/d/bad', '/v/nope', '/nonexistent'] },
  portal: { login: 'portal', routes: ['/portal/dashboard', '/portal/live', '/portal/incidents', '/portal/incidents/al-2', '/portal/unregistered', '/portal/search', '/portal/search?q=red%20myvi%20yesterday', '/portal/visitors', '/portal/vehicles', '/portal/permits', '/portal/residents', '/portal/residents/A-15-07', '/portal/watchlist', '/portal/guards', '/portal/community', '/portal/community?tab=bookings', '/portal/community?tab=tickets', '/portal/community?tab=fees', '/portal/community?tab=parcels', '/portal/community?tab=voting', '/portal/reports', '/portal/rules', '/portal/privacy'] },
  guard: { login: 'guard', routes: ['/guard', '/guard/alerts', '/guard/alerts/al-2', '/guard/walk-in', '/guard/verify', '/guard/parcels', '/guard/patrol', '/guard/report'] },
  resident: { login: 'resident', routes: ['/app', '/app/invite', '/app/pass/v-14', '/app/visitors', '/app/parcels', '/app/book', '/app/activity', '/app/unit', '/app/face', '/app/renovation', '/app/billing', '/app/approval/ap-1', '/app/sos'] },
};

const results = { viewport: VP, routes: [], dead: [], errors: [], overflow: [], tested: 0, ok: 0, external: [], skipped: 0 };
const log = (...a) => console.log(`[${VP}]`, ...a);

async function waitReady(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() => !document.querySelector('[aria-label="Loading"]') && document.body.innerText.length > 20, null, { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(120);
}

async function login(page, kind) {
  if (kind === 'portal') {
    await page.goto(BASE + '/login'); await waitReady(page);
    await page.getByLabel('Work email').first().fill('farah@vistaharmoni.my');
    await page.getByLabel('Password').fill('demo1234');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByLabel('Verification code').fill('123456');
    await page.getByRole('button', { name: 'Verify and sign in' }).click();
    await page.waitForURL('**/portal/dashboard');
  } else if (kind === 'guard') {
    await page.goto(BASE + '/guard/login'); await waitReady(page);
    await page.getByRole('button', { name: /Kumar Selvam/ }).click();
    for (const d of '2468') await page.getByRole('button', { name: d, exact: true }).click();
    await page.waitForURL(BASE + '/guard');
  } else if (kind === 'resident') {
    await page.goto(BASE + '/app/login'); await waitReady(page);
    await page.getByRole('button', { name: 'Send code' }).click();
    await page.getByLabel('6-digit code').fill('654321');
    await page.getByRole('button', { name: 'Verify and sign in' }).click();
    await page.waitForURL(BASE + '/app');
  }
  await waitReady(page);
}

const TAG = `(() => {
  const sel = 'button, a[href], input[type=checkbox], input[type=range]';
  const out = [];
  let i = 0;
  document.querySelectorAll('[data-aidx]').forEach((e) => e.removeAttribute('data-aidx'));
  const dlg = [...document.querySelectorAll('[role=dialog]')].pop();
  const scope = dlg ?? document;
  for (const el of scope.querySelectorAll(sel)) {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const hidden = r.width < 2 || r.height < 2 || cs.visibility === 'hidden' || cs.display === 'none' || el.closest('[aria-hidden=true]');
    if (hidden || el.disabled) continue;
    if (el.getAttribute('aria-selected') === 'true' || el.getAttribute('aria-pressed') === 'true' || el.getAttribute('aria-current') === 'page') continue;
    // Don't bother re-testing dismiss controls; the modal tests cover them
    const text = (el.innerText || el.value || '').trim().replace(/\\s+/g, ' ').slice(0, 60);
    const aria = el.getAttribute('aria-label') || el.getAttribute('title') || '';
    const href = el.getAttribute('href') || '';
    el.setAttribute('data-aidx', String(i));
    out.push({ i, tag: el.tagName.toLowerCase(), text, aria, href, target: el.getAttribute('target') || '', type: el.getAttribute('type') || '', inDialog: !!dlg });
    i++;
  }
  return out;
})()`;

const SIG = `(() => {
  const st = [...document.querySelectorAll('[aria-pressed],[aria-selected],[aria-checked],[aria-expanded],input[type=checkbox],input[type=range]')].map((e) => (e.getAttribute('aria-pressed') ?? '') + (e.getAttribute('aria-selected') ?? '') + (e.getAttribute('aria-checked') ?? '') + (e.getAttribute('aria-expanded') ?? '') + (e.checked ?? '') + (e.type === 'range' ? e.value : '')).join('');
  const t = document.body.innerText;
  let h = 0; for (let k = 0; k < t.length; k += 3) h = (h * 31 + t.charCodeAt(k)) | 0;
  return [location.href, document.body.innerHTML.length, h, (localStorage.getItem('${KEY}') || '').length, document.querySelectorAll('[role=dialog]').length, document.querySelectorAll('[role=status]').length, st, Math.round(scrollY)].join('|');
})()`;

async function run() {
  const browser = await chromium.launch({ executablePath: EXE });
  for (const [surface, cfg] of Object.entries(SURFACES)) {
    if (ONLY && ONLY !== surface) continue;
    const context = await browser.newContext({ viewport, acceptDownloads: true, hasTouch: VP === 'mobile', isMobile: VP === 'mobile' });
    const page = await context.newPage();
    let pageErrors = [];
    page.on('pageerror', (e) => pageErrors.push(String(e.message).slice(0, 200)));
    page.on('console', (m) => { if (m.type() === 'error' && !/ERR_TUNNEL|fonts\.g/.test(m.text())) pageErrors.push('console: ' + m.text().slice(0, 200)); });
    let downloads = 0; page.on('download', () => downloads++);
    let popups = 0; context.on('page', (p) => { popups++; p.close().catch(() => {}); });
    page.on('dialog', (d) => d.dismiss().catch(() => {}));

    await page.goto(BASE + '/'); await waitReady(page);
    if (cfg.login) await login(page, cfg.login);
    const snap = await page.evaluate((k) => localStorage.getItem(k), KEY);
    const restore = async (route) => {
      await page.evaluate(([k, s]) => { localStorage.clear(); if (s) localStorage.setItem(k, s); }, [KEY, snap]);
      await page.goto(BASE + route); await waitReady(page);
    };
    const seen = new Set();

    for (const route of cfg.routes) {
      pageErrors = [];
      await restore(route);
      const finalUrl = page.url();
      const overflow = await page.evaluate((w) => document.documentElement.scrollWidth - w, viewport.width);
      if (overflow > 2) results.overflow.push({ route, overflow });
      const items = await page.evaluate(TAG);
      const rinfo = { surface, route, finalUrl: finalUrl.replace(BASE, ''), clickables: items.length, tested: 0, dead: 0 };
      log(route, '→', rinfo.finalUrl, items.length, 'clickables');
      let dirty = false;

      const testOne = async (it, reopen) => {
        const key = `${surface}|${it.text}|${it.aria}|${it.href}|${it.inDialog ? 'dlg:' + (reopen?.key ?? '') : ''}`;
        if (seen.has(key)) { results.skipped++; return null; }
        seen.add(key);
        if (it.href && (/^(https?:|tel:|mailto:)/.test(it.href) || it.target === '_blank')) { results.external.push({ route, ...it }); results.ok++; return 'external'; }
        if (it.href && !it.inDialog) {
          const here = await page.evaluate(() => location.pathname + location.search);
          if (it.href === here) { results.selfLinks = (results.selfLinks ?? 0) + 1; results.ok++; return 'external'; }
        }
        if (dirty) {
          await restore(route);
          if (reopen) {
            const c2 = await page.evaluate(TAG);
            const op = c2.find((c) => c.text === reopen.it.text && c.aria === reopen.it.aria && c.href === reopen.it.href) ?? c2[reopen.i];
            if (op) await page.locator(`[data-aidx="${op.i}"]`).click({ timeout: 3000 }).catch(() => {});
            await page.waitForTimeout(300);
          }
          dirty = false;
        }
        const cur = await page.evaluate(TAG);
        const match = cur.find((c) => c.text === it.text && c.aria === it.aria && c.href === it.href && c.inDialog === it.inDialog) ?? cur[it.i];
        if (!match) { results.skipped++; return null; }
        const before = await page.evaluate(SIG);
        const d0 = downloads, p0 = popups;
        let clickErr = '';
        await page.locator(`[data-aidx="${match.i}"]`).click({ timeout: 3000 }).catch((e) => { clickErr = String(e.message).split('\n')[0].slice(0, 160); });
        await page.waitForTimeout(it.type === 'submit' ? 700 : 450);
        const after = await page.evaluate(SIG).catch(() => 'navigated');
        const changed = before !== after || downloads > d0 || popups > p0;
        results.tested++; rinfo.tested++;
        if (!changed || clickErr) {
          rinfo.dead++;
          results.dead.push({ route, text: it.text, aria: it.aria, href: it.href, inDialog: it.inDialog, dialogOf: reopen?.text, clickErr });
        } else results.ok++;
        if (changed) dirty = true;
        return changed ? { opened: after.split('|')[4] !== before.split('|')[4] && Number(after.split('|')[4]) > Number(before.split('|')[4]), key } : null;
      };

      for (const it of items) {
        const r = await testOne(it);
        if (r && r !== 'external' && r.opened) {
          // Sweep controls inside the dialog/drawer this opened
          const inner = await page.evaluate(TAG);
          for (const d of inner.filter((x) => x.inDialog)) await testOne(d, { i: it.i, it, text: it.text || it.aria, key: r.key });
          dirty = true;
        }
      }
      if (pageErrors.length) results.errors.push({ route, errors: [...new Set(pageErrors)] });
      results.routes.push(rinfo);
    }
    await context.close();
  }
  await browser.close();
  fs.writeFileSync(`results-${VP}${ONLY ? '-' + ONLY : ''}.json`, JSON.stringify(results, null, 2));
  log('DONE tested', results.tested, 'ok', results.ok, 'dead', results.dead.length, 'errors', results.errors.length, 'overflow', results.overflow.length);
}
run().catch((e) => { console.error(e); fs.writeFileSync(`results-${VP}-crash.txt`, String(e.stack)); process.exit(1); });
