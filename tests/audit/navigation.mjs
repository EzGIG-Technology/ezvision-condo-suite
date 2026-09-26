// Blank-page check: clicks every navigation link in the portal, guard tablet and resident app, plus rapid
// double clicks and back/forward, and fails any page that is still blank or stuck 6 s after the click.
// Usage: node navigation.mjs <desktop|mobile>. Set BASE_URL to test a deployed site.
// Set USER_DIR to reuse a browser profile (for example one holding data saved by an older version).
import { chromium } from 'playwright';
const B = process.env.BASE_URL || 'http://localhost:4173';
const mobile = process.argv[2] === 'mobile';
const vp = mobile ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 } };
const exe = process.env.CHROMIUM_PATH || undefined;
// USER_DIR keeps localStorage between runs, like a real browser that used an older version.
const browser = process.env.USER_DIR ? null : await chromium.launch({ executablePath: exe });
const ctx = browser ? await browser.newContext(vp) : await chromium.launchPersistentContext(process.env.USER_DIR, { executablePath: exe, ...vp });
const b = { close: async () => { await ctx.close(); await browser?.close(); } };
const p = ctx.pages()[0] ?? await ctx.newPage();
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
p.on('console', (m) => { if (m.type() === 'error' && !/fonts|ERR_CERT|ERR_TUNNEL/.test(m.text())) errs.push(m.text()); });
const bad = [];
let clicks = 0;

// A page counts as shown when <main> has real text and no spinner or error screen.
const settled = async (label) => {
  const ok = await p.waitForFunction(() => {
    const m = document.querySelector('main') ?? document.body;
    return !m.querySelector('[aria-label="Loading"]') && m.innerText.trim().length > 60 && !/This page didn't load/.test(m.innerText);
  }, null, { timeout: 6000 }).then(() => true, () => false);
  clicks++;
  if (!ok) bad.push(`${label} → ${new URL(p.url()).pathname}: ${(await p.locator('body').innerText()).trim().slice(0, 90).replace(/\s+/g, ' ') || '(empty)'}`);
};
const openMenu = async () => {
  if (!mobile) return;
  if (!(await p.getByRole('dialog', { name: 'Menu' }).isVisible().catch(() => false))) await p.getByRole('button', { name: 'Open menu' }).click();
};
const portalNav = () => p.locator('nav[aria-label=Main]').last();

// Portal
await p.goto(B + '/login');
await p.getByLabel('Password').fill('x1234');
await p.getByRole('button', { name: 'Continue' }).click();
await p.getByLabel('Verification code').fill('123456');
await p.getByRole('button', { name: 'Verify and sign in' }).click();
await p.waitForURL('**/portal/dashboard');
await settled('portal sign-in');
await openMenu();
await portalNav().locator('a').first().waitFor({ timeout: 10000 });
const portalLinks = (await portalNav().locator('a').allInnerTexts()).map((t) => t.split('\n')[0].trim()).filter(Boolean);
for (const n of portalLinks) { await openMenu(); await portalNav().locator('a', { hasText: n }).first().click(); await settled(`portal ${n}`); }
// Rapid double navigation: a second link clicked before the first page has loaded.
for (const [a, c] of [['Reports', 'Watchlist'], ['Facilities', 'Integrations'], ['Visitors', 'Community']]) {
  await openMenu(); await portalNav().locator('a', { hasText: a }).first().click();
  await openMenu(); await portalNav().locator('a', { hasText: c }).first().click();
  await settled(`rapid ${a} then ${c}`);
}
await p.goBack(); await settled('browser back');
await p.goForward(); await settled('browser forward');

// Guard
await p.goto(B + '/guard/login');
await p.getByRole('button', { name: /Kumar Selvam/ }).click();
for (const d of '2468') await p.getByRole('button', { name: d, exact: true }).click();
await p.waitForURL(B + '/guard');
await settled('guard sign-in');
const guardNav = mobile ? p.locator('nav[aria-label=Guard]').last() : p.locator('aside nav[aria-label=Guard]');
await guardNav.locator('a').first().waitFor({ timeout: 10000 });
const guardLinks = (await guardNav.locator('a').allInnerTexts()).map((t) => t.split('\n')[0].trim()).filter(Boolean);
for (const n of guardLinks) { await guardNav.locator('a', { hasText: n }).first().click(); await settled(`guard ${n}`); }

// Resident
await p.goto(B + '/app/login');
await p.getByRole('button', { name: 'Send code' }).click();
await p.getByLabel('6-digit code').fill('123456');
await p.getByRole('button', { name: 'Verify and sign in' }).click();
await p.waitForURL(B + '/app');
await settled('resident sign-in');
const resNav = p.locator('nav[aria-label=Resident]');
await resNav.locator('a').first().waitFor({ timeout: 10000 });
const resLinks = (await resNav.locator('a').allInnerTexts()).map((t) => t.split('\n')[0].trim()).filter(Boolean);
for (const n of resLinks) { await resNav.locator('a', { hasText: n }).first().click(); await settled(`resident ${n}`); }
await resNav.locator('a', { hasText: 'Home' }).click(); await settled('resident home');
const tiles = (await p.locator('main a.card').allInnerTexts()).map((t) => t.split('\n')[0].trim()).filter(Boolean).slice(0, 9);
for (const t of tiles) {
  await resNav.locator('a', { hasText: 'Home' }).click(); await settled('resident home');
  await p.locator('main a.card', { hasText: t }).first().click(); await settled(`tile ${t}`);
}

console.log(`${mobile ? 'mobile' : 'desktop'}: ${clicks} navigations (portal ${portalLinks.length}, guard ${guardLinks.length}, resident ${resLinks.length}, tiles ${tiles.length}); blank or stuck: ${bad.length}; errors: ${errs.length}`);
bad.forEach((x) => console.log('  BLANK', x));
if (bad.length || errs.length) process.exitCode = 1;
errs.slice(0, 5).forEach((e) => console.log('  ERR', e.slice(0, 200)));
await b.close();
