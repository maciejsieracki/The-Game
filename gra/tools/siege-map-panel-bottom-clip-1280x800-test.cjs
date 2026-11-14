'use strict';
/**
 * R-WEB-UI-SIEGE-MAP-PANEL-BOTTOM-CLIP-1280X800-Q1 — panel oblezenia na mapie (siegeMapPanel.ts)
 * NIE moze byc przycity u dolu: przyciski akcji (Oblegaj / Szturm / Odwrot) maja byc w pelni widoczne
 * BEZ przewijania, nad dolnym banerem HUD (.civ-bottom-bar) — dolna krawedz przyciskow <= gorna krawedz
 * banera - 4 px, przy 1280x800 i 1024x768, z odsluchem wszystkich dostepnych machin.
 *
 * Scenariusz zywy: ?playtest=oblez&civTest=1, hak __siegeBadgeTestDebug (jak live-verify W18r3).
 *
 * Usage (z gra/): node tools/siege-map-panel-bottom-clip-1280x800-test.cjs <dist-dir> [evidence-dir]
 * Exit 0 = PASS, 1 = FAIL (dowod mutacyjny: na kodzie sprzed poprawki wynik FAIL).
 */
const fs = require('fs');
const path = require('path');
const http = require('http');

const DIST = process.argv[2];
const EVID = process.argv[3] || null;
if (!DIST) throw new Error('usage: node siege-map-panel-bottom-clip-1280x800-test.cjs <dist-dir> [evidence-dir]');
const CHROME = process.env.W3_CHROMIUM || '/usr/bin/chromium';
const { chromium } = require('playwright');
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
const VIEWPORTS = [[1280, 800], [1024, 768]];
const TECHS = ['Obróbka drewna', 'Brązownictwo', 'Sztuka wojenna'];
const GAP_PX = 4;

function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const p = decodeURIComponent(req.url.split('?')[0]);
      const f = path.join(DIST, p === '/' ? 'index.html' : p);
      if (!f.startsWith(DIST) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

async function measure(page) {
  return page.evaluate(() => {
    const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom), left: Math.round(b.left), right: Math.round(b.right) }; };
    const bar = document.querySelector('.civ-bottom-bar');
    const overlay = document.querySelector('#civ-siege-map-panel .civ-smp-overlay');
    const acts = Array.from(document.querySelectorAll('#civ-siege-map-panel .civ-smp-act')).map((b) => ({ label: (b.querySelector('.civ-smp-act-label') || {}).textContent || '', ...r(b) }));
    const machines = Array.from(document.querySelectorAll('#civ-siege-map-panel .civ-smp-mach-btn')).map((b) => b.textContent.trim());
    const body = document.querySelector('#civ-siege-map-panel .civ-smp-body');
    return { vh: window.innerHeight, bar: r(bar), overlay: r(overlay), foot: r(document.querySelector('#civ-siege-map-panel .civ-smp-foot')), acts, machines, bodyScrollable: body ? body.scrollHeight > body.clientHeight : null };
  });
}

(async () => {
  const srv = await serve();
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ headless: true, executablePath: CHROME, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const out = { results: [], errors: [] };
  try {
    for (const [w, h] of VIEWPORTS) {
      const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
      page.on('pageerror', (e) => out.errors.push(String(e)));
      await page.goto(base + '/?playtest=oblez&civTest=1', { waitUntil: 'load', timeout: 180000 });
      for (let i = 0; i < 600; i++) {
        const ok = await page.evaluate(() => !!(window.__civTest && window.__siegeBadgeTestDebug && window.__civTest.state().cities.some((c) => c.id === 'city0')));
        if (ok) break;
        await page.waitForTimeout(250);
      }
      await page.waitForTimeout(1500);
      const first = await page.evaluate(() => window.__siegeBadgeTestDebug.startPlayerSiege('city0'));
      if (!first.ok) throw new Error('startPlayerSiege: ' + JSON.stringify(first));
      await page.evaluate(() => { const b = document.querySelector('#civ-siege-map-panel [data-act="retreat"]'); if (b) b.click(); });
      await page.waitForTimeout(300);
      await page.evaluate(({ q, r }) => { for (let i = 0; i < 10; i++) window.__civTest.addUnit(0, q, r, false); }, { q: first.q, r: first.r });
      await page.evaluate(() => window.__siegeBadgeTestDebug.fundPlayer(5000));
      await page.evaluate((t) => window.__siegeBadgeTestDebug.setResearchedTechs(t), TECHS);
      await page.evaluate(() => window.__siegeBadgeTestDebug.startPlayerSiege('city0'));
      await page.waitForTimeout(1200);
      const m = await measure(page);
      const checks = [];
      const limit = m.bar ? m.bar.top - GAP_PX : null;
      checks.push({ name: 'pasek HUD obecny i widoczny', ok: !!(m.bar && m.bar.bottom > m.bar.top) });
      checks.push({ name: 'panel oblezenia otwarty (3 akcje)', ok: m.acts.length === 3 });
      for (const a of m.acts) {
        checks.push({ name: 'przycisk "' + a.label + '" w calosci nad banerem (bottom <= bar.top-4, bez przewijania)', ok: limit !== null && a.bottom <= limit && a.top >= 0 });
      }
      checks.push({ name: 'stopka panelu nad banerem', ok: !!(m.foot && limit !== null && m.foot.bottom <= m.bar.top) });
      out.results.push({ viewport: [w, h], ...m, checks, pass: checks.every((c) => c.ok) });
      if (EVID) {
        fs.mkdirSync(EVID, { recursive: true });
        await page.screenshot({ path: path.join(EVID, 'siege-map-panel-' + w + 'x' + h + '.png') });
      }
      await page.close();
    }
  } catch (e) { out.errors.push(e.stack || String(e)); }
  await browser.close();
  srv.close();
  const pass = out.errors.length === 0 && out.results.length === VIEWPORTS.length && out.results.every((r) => r.pass);
  out.verdict = pass ? 'PASS' : 'FAIL';
  console.log(JSON.stringify(out, null, 1));
  process.exitCode = pass ? 0 : 1;
})();
