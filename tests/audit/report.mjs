// Builds AUDIT.md from the crawl and journey results.
import fs from 'node:fs';
const FIXED = JSON.parse(fs.existsSync('fixed.json') ? fs.readFileSync('fixed.json', 'utf8') : '[]');
const read = (f) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null);
const crawl = { desktop: read('results-desktop.json'), mobile: read('results-mobile.json') };
const jr = { desktop: read('journeys-desktop.json'), mobile: read('journeys-mobile.json') };
const date = new Date().toISOString().slice(0, 10);

let md = `# Audit report\n\nRun on ${date} against the production build (\`npm run build\` + \`vite preview\`). The runner was Playwright with headless Chromium.\n\n`;
md += `## Summary\n\n| Check | Desktop 1440×900 | Mobile 390×844 |\n| --- | --- | --- |\n`;
const c = (vp, f) => (crawl[vp] ? f(crawl[vp]) : 'n/a');
md += `| Routes loaded | ${c('desktop', (r) => r.routes.length)} | ${c('mobile', (r) => r.routes.length)} |\n`;
md += `| Buttons, links, toggles clicked | ${c('desktop', (r) => r.tested + (r.selfLinks ?? 0) + r.external.length)} | ${c('mobile', (r) => r.tested + (r.selfLinks ?? 0) + r.external.length)} |\n`;
md += `| Controls with no effect (dead) | ${c('desktop', (r) => r.dead.length)} | ${c('mobile', (r) => r.dead.length)} |\n`;
md += `| Runtime errors (console or uncaught) | ${c('desktop', (r) => r.errors.length)} | ${c('mobile', (r) => r.errors.length)} |\n`;
md += `| Pages with horizontal scroll | ${c('desktop', (r) => r.overflow.length)} | ${c('mobile', (r) => r.overflow.length)} |\n`;
const j = (vp) => (jr[vp] ? `${jr[vp].results.filter((x) => x.ok).length} / ${jr[vp].results.length} passed` : 'n/a');
md += `| End-to-end journeys | ${j('desktop')} | ${j('mobile')} |\n\n`;

md += `## How the click audit works\n\nThe audit signs in to each app through its real login screen. It then opens every route, finds every visible button, link, checkbox and slider, and clicks each one on a fresh copy of the state. A control passes if the click changes something: the URL, the page content, a dialog, a toast, a download, a new tab, a toggle state or stored data. When a control opens a dialog or drawer, every control inside that dialog is clicked too. A control that repeats on the same page, such as the Remind button on every row or the sidebar links on every page, is tested once. Links to external sites, \`tel:\` and \`mailto:\` are checked for a valid target but not followed.\n\n`;

for (const vp of ['desktop', 'mobile']) {
  const r = crawl[vp];
  if (!r) continue;
  md += `## Routes, ${vp}\n\n| Route | Lands on | Controls on page | Clicked (new ones, incl. inside dialogs) | Dead |\n| --- | --- | --- | --- | --- |\n`;
  for (const x of r.routes) md += `| \`${x.route}\` | \`${x.finalUrl}\` | ${x.clickables} | ${x.tested} | ${x.dead} |\n`;
  md += '\n';
  if (r.dead.length) {
    md += `**Controls that did nothing (${vp}):**\n\n`;
    for (const d of r.dead) md += `- \`${d.route}\`: "${d.text || d.aria}"${d.dialogOf ? ` (inside "${d.dialogOf}")` : ''}${d.clickErr ? `. ${d.clickErr}` : ''}\n`;
    md += '\n';
  }
  if (r.errors.length) { md += `**Errors (${vp}):**\n\n`; for (const e of r.errors) md += `- \`${e.route}\`: ${e.errors.join('; ')}\n`; md += '\n'; }
  if (r.overflow.length) { md += `**Horizontal overflow (${vp}):**\n\n`; for (const o of r.overflow) md += `- \`${o.route}\`: ${o.overflow}px\n`; md += '\n'; }
}

for (const vp of ['desktop', 'mobile']) {
  if (!jr[vp]) continue;
  md += `## End-to-end journeys, ${vp}\n\nThe portal, guard tablet, resident app and visitor pass run as four tabs in one browser, like on a single machine. Every step waits for the real UI to update in the other tab.\n\n| Journey | Result |\n| --- | --- |\n`;
  for (const x of jr[vp].results) md += `| ${x.name} | ${x.ok ? `Pass (${(x.ms / 1000).toFixed(1)} s)` : `**Fail**: ${x.error}`} |\n`;
  md += `\nRuntime errors during journeys: ${jr[vp].errors.length ? jr[vp].errors.join('; ') : 'none'}.\n\n`;
}

md += `## Fixed during the audit\n\n`;
md += FIXED.map((f) => `- ${f}`).join('\n') + '\n\n';
md += `## Known limits (by design, front end only)\n\n`;
md += `- There is no backend. Data lives in the browser's localStorage and syncs between tabs on one machine, not between devices. Use **Reset demo data** on the launcher to start over.\n- Camera views, faces and QR codes are drawn illustrations. ID scanning, face matching, plate reads, payments, SMS and WhatsApp are simulated with realistic delays and results.\n- Web fonts load from Google Fonts. The audit sandbox blocks them, so those network errors were excluded, and the app falls back to system fonts.\n`;
fs.writeFileSync('AUDIT.md', md);
console.log('AUDIT.md written');
