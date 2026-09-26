# Automated UI audit

These scripts produced `AUDIT.md`. They drive the production build with Playwright.

```bash
npm run build && npx vite preview --port 4173 &
cd tests/audit
npm init -y && npm i playwright && npx playwright install chromium
node crawl.mjs desktop     # every route, every button, 1440×900
node crawl.mjs mobile      # same at 390×844 (touch)
node journeys.mjs desktop  # 19 cross-app journeys
node journeys.mjs mobile
node navigation.mjs desktop # every nav link, fails on any blank or stuck page
node navigation.mjs mobile
node report.mjs            # writes AUDIT.md here
```

Set `BASE_URL` to audit a deployed URL, for example a Vercel preview. Set `CHROMIUM_PATH` to use a specific browser binary.

## 11-inch iPad Pro

Install Safari's test engine with `npx playwright install webkit`, then run:

```bash
node tests/audit/navigation.mjs ipad           # 834 × 1194, touch, WebKit
node tests/audit/navigation.mjs ipad-landscape # 1194 × 834, touch, WebKit
```

Both profiles check navigation, blank pages, JavaScript errors and horizontal page overflow.
Set `BASE_URL` to check the live deployment. Device emulation does not replace physical iPad testing.
