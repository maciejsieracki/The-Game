'use strict';
/**
 * R-WEB-UI-SIEGE-PANEL-NARROW-MACHINES-BLOCK-Q1 — blok „Zbuduj machinę w oblężeniu” w panelu oblężenia
 * (siegeMapPanel.ts, [data-siege-engine-build]) ma mieścić się w oknie BEZ wewnętrznego przewijania
 * dla 1, 2 i 4 odblokowanych typów machin, w oknach 1280x800 i 1366x768.
 * Przyciski akcji (Oblegaj / Szturm / Odwrot) mają pozostać widoczne i klikalne nad dolnym banerem HUD,
 * a dolna krawedz bloku machin ma lezec nad docem akcji (nie zasłaniać go).
 *
 * Konfiguracje technologii (wg data/units.json, pole Tech dla Typ=Siege):
 *   1 typ: ['Obróbka drewna']                       -> Taran
 *   2 typy: ['Brązownictwo']                        -> Taran okuty + Wieża oblężnicza
 *   4 typy: ['Obróbka drewna','Brązownictwo','Sztuka wojenna'] -> wszystkie 4
 *
 * Scenariusz zywy: ?playtest=oblez&civTest=1, hak __siegeBadgeTestDebug (jak bottom-clip test).
 *
 * Usage (z gra/): node tools/siege-panel-machines-block-fit-test.cjs <dist-dir> [evidence-dir]
 * Exit 0 = PASS, 1 = FAIL. Dowod mutacyjny: na kodzie sprzed poprawki (fab9a9b75) test ma dac FAIL dla 4 typow.
 * Zalozenie (ZAL-1): cala tresc panelu nadal przewija sie (stats+kolejka nad blokiem); wymog dotyczy tego, zeby blok machin byl w calosci widoczny naraz po przewinieciu do dolu.
 */
const fs = require('fs');
const path = require('path');
const http = require('http');

const DIST = process.argv[2];
const EVID = process.argv[3] || null;
if (!DIST) throw new Error('usage: node siege-panel-machines-block-fit-test.cjs <dist-dir> [evidence-dir]');
const CHROME = process.env.W3_CHROMIUM || '/usr/bin/chromium';
const { chromium } = require('playwright');
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
const VIEWPORTS = [[1280, 800], [1366, 768]];
const CONFIGS = [
  { types: 1, techs: ['Obróbka drewna'] },
  { types: 2, techs: ['Brązownictwo'] },
  { types: 4, techs: ['Obróbka drewna', 'Brązownictwo', 'Sztuka wojenna'] },
];
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
    const root = document.querySelector('#civ-siege-map-panel');
    const bar = document.querySelector('.civ-bottom-bar');
    const body = root ? root.querySelector('.civ-smp-body') : null;
    const dock = root ? root.querySelector('.civ-smp-dock') : null;
    const block = root ? root.querySelector('[data-siege-engine-build]') : null;
    const btns = root ? Array.from(root.querySelectorAll('.civ-smp-act')) : [];
    const acts = btns.map((b) => {
      const rect = b.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const hit = document.elementFromPoint(cx, cy);
      return {
        label: (b.querySelector('.civ-smp-act-label') || {}).textContent || '',
        ...r(b),
        clickable: !!hit && (hit === b || b.contains(hit)),
      };
    });
    const machineBtns = root ? Array.from(root.querySelectorAll('.civ-smp-mach-btn')) : [];
    return {
      vh: window.innerHeight,
      bar: r(bar),
      body: r(body),
      bodyScrollHeight: body ? body.scrollHeight : null,
      bodyClientHeight: body ? body.clientHeight : null,
      dock: r(dock),
      block: r(block),
      blockPresent: !!block,
      machineCount: machineBtns.length,
      acts,
    };
  });
}

(async () => {
  const srv = await serve();
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ headless: true, executablePath: CHROME, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const out = { results: [], errors: [] };
  try {
    for (const [w, h] of VIEWPORTS) {
      for (const cfg of CONFIGS) {
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
        await page.evaluate((t) => window.__siegeBadgeTestDebug.setResearchedTechs(t), cfg.techs);
        await page.evaluate(() => window.__siegeBadgeTestDebug.startPlayerSiege('city0'));
        await page.waitForTimeout(1200);
        // Dokoncz animacje wejscia panelu (smp-in) przed pomiarem; nieskonczone animacje nie blokuja (limit 3 s).
        await page.evaluate(() => Promise.race([
          Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {}))),
          new Promise((r) => setTimeout(r, 3000)),
        ]));
        const m = await measure(page);
        const limit = m.bar ? m.bar.top - GAP_PX : null;
        const checks = [];
        checks.push({ name: 'panel oblezenia otwarty (3 akcje)', ok: m.acts.length === 3 });
        checks.push({ name: 'liczba machin = ' + cfg.types, ok: m.machineCount === cfg.types });
        checks.push({ name: 'blok machin obecny', ok: m.blockPresent });
        // Przewin tresc panelu do dolu (tam lezy blok machin) i sprawdz, ze CALY blok jest widoczny naraz,
        // bez przewijania wewnatrz bloku (blok nie ma wlasnego overflow) i bez zaslaniania docka.
        const atBottom = await page.evaluate(() => {
          const root = document.querySelector('#civ-siege-map-panel');
          const body = root.querySelector('.civ-smp-body');
          const block = root.querySelector('[data-siege-engine-build]');
          // Informacyjnie (bez wplywu na verdict, ZAL-1): pomiar PRZED przewinieciem (scrollTop=0).
          const topBr = body.getBoundingClientRect();
          const topBb = block ? block.getBoundingClientRect() : null;
          const probeTop = { scrollTop: body.scrollTop, blockFullyVisibleAtTop: !!(topBb && topBb.top >= topBr.top - 0.5 && topBb.bottom <= topBr.bottom + 0.5), blockTop: topBb ? Math.round(topBb.top) : null, bodyBottom: Math.round(topBr.bottom) };
          body.scrollTop = body.scrollHeight;
          const br = body.getBoundingClientRect();
          const bb = block ? block.getBoundingClientRect() : null;
          const dk = root.querySelector('.civ-smp-dock').getBoundingClientRect();
          return {
            _probeTop: probeTop,
            blockBottom: bb ? Math.round(bb.bottom) : null,
            blockBottom: bb ? Math.round(bb.bottom) : null,
            dockTop: Math.round(dk.top),
            blockHeight: bb ? Math.round(bb.height) : null,
            bodyVisibleHeight: Math.round(br.height),
            blockFullyVisible: !!(bb && bb.top >= br.top - 0.5 && bb.bottom <= br.bottom + 0.5),
            blockOwnOverflow: block ? block.scrollHeight > block.clientHeight + 1 : null,
          };
        });
        checks.push({ name: 'blok machin w calosci widoczny po przewinieciu tresci do dolu (bez przewijania w bloku)', ok: atBottom.blockFullyVisible && atBottom.blockOwnOverflow === false });
        checks.push({ name: 'blok machin nie wyzszy niz widoczna tresc panelu (mieszczi sie w oknie, 16 px zapasu)', ok: atBottom.blockHeight !== null && atBottom.blockHeight <= atBottom.bodyVisibleHeight - 16 });
        checks.push({ name: 'blok machin (po przewinieciu do dolu) nad docem akcji (block.bottom <= dock.top)', ok: atBottom.blockBottom !== null && atBottom.blockBottom <= atBottom.dockTop });
        for (const a of m.acts) {
          checks.push({ name: 'przycisk "' + a.label + '" w calosci nad banerem (bottom <= bar.top-4) i w oknie', ok: limit !== null && a.bottom <= limit && a.top >= 0 && a.right <= w });
          checks.push({ name: 'przycisk "' + a.label + '" klikalny (nie przykryty)', ok: a.clickable });
        }
        out.results.push({ viewport: [w, h], types: cfg.types, ...m, atBottom, checks, pass: checks.every((c) => c.ok) });
        if (EVID) {
          fs.mkdirSync(EVID, { recursive: true });
          await page.screenshot({ path: path.join(EVID, 'siege-machines-' + w + 'x' + h + '-types' + cfg.types + '.png') });
        }
        await page.close();
      }
    }
  } catch (e) { out.errors.push(e.stack || String(e)); }
  await browser.close();
  srv.close();
  const pass = out.errors.length === 0 && out.results.length === VIEWPORTS.length * CONFIGS.length && out.results.every((r) => r.pass);
  out.verdict = pass ? 'PASS' : 'FAIL';
  console.log(JSON.stringify(out, null, 1));
  process.exitCode = pass ? 0 : 1;
})();
