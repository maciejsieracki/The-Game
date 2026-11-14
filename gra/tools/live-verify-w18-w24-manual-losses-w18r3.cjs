'use strict';
/**
 * R-WEB-LIVE-VERIFY-W18-W24-MANUAL-LOSSES-Q1 — runda 3, punkt 1 (W18): machiny oblezenicze dostepne w PANELU OBLEZENIA
 * (siegeMapPanel, blok "Zbuduj machine w oblezeniu") PRZED i PO odkryciu technologii, w zywej grze (Chromium, vite build).
 *
 * Scenariusz: ?playtest=oblez&civTest=1 — wrogie, obwarowane miasto Ateny (wojna ustawiona przez preset) + jednostka gracza przy murze.
 * Oblezenie gracza startuje hakiem __siegeBadgeTestDebug.startPlayerSiege (deleguje do REALNEGO classifyCityAttack + startMapSiege,
 * ta sama sciezka co przycisk "Oblegaj"). Zbior technologii gracza jest ustawiany hakiem setResearchedTechs (izolacja jednej technologii;
 * unlockAllTech nie izoluje). Odczyt: (a) DOM panelu oblezenia, (b) bramka siegeEngineOptions/visibleSiegeEngineOptions na realnym stanie gry
 * (zapisane OSOBNO od DOM). Armia: 10 dodatkowych jednostek gracza przy murze (>=10 jednostek bez machin => pula 1 machiny/ture).
 *
 * Usage (z gra/): node tools/live-verify-w18-w24-manual-losses-w18r3.cjs <dist-dir> <evidence-dir>
 */
const fs = require('fs');
const path = require('path');
const http = require('http');

const DIST = process.argv[2];
const EVID = process.argv[3];
if (!DIST || !EVID) throw new Error('usage: node w18r3.cjs <dist-dir> <evidence-dir>');
const CHROME = process.env.W3_CHROMIUM || '/usr/bin/chromium';
const { chromium } = require('playwright');
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };

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

// Fazy: kontrolowane zestawy technologii (jedyny hak izolujacy = setResearchedTechs).
const PHASES = [
  { id: 'F0-brak-techow', techs: [] },
  { id: 'F1-tylko-Obrobka-drewna', techs: ['Obróbka drewna'] },
  { id: 'F2-tylko-Brazownictwo', techs: ['Brązownictwo'] },
  { id: 'F3-Obrobka-drewna+Brazownictwo', techs: ['Obróbka drewna', 'Brązownictwo'] },
  { id: 'F4-Obrobka-drewna+Brazownictwo+Sztuka-wojenna', techs: ['Obróbka drewna', 'Brązownictwo', 'Sztuka wojenna'] },
];

async function readPanel(page) {
  return page.evaluate(() => {
    const box = document.querySelector('#civ-siege-map-panel');
    if (!box) return { open: false };
    const build = box.querySelector('[data-siege-engine-build]');
    const buttons = build ? Array.from(build.querySelectorAll('button.civ-smp-mach-btn')).map((b) => ({ text: b.textContent.trim(), disabled: b.disabled, title: b.title })) : [];
    const notes = build ? Array.from(build.querySelectorAll('span.civ-smp-mach-meta')).map((s) => s.textContent.trim()) : [];
    const quota = build ? (build.querySelector('[data-siege-engine-quota]') || {}).textContent || '' : '';
    return { open: true, blockPresent: !!build, quota, buttons, notes, stats: (box.querySelector('.civ-smp-stats') || {}).innerText || '' };
  });
}

(async () => {
  const srv = await serve();
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ headless: true, executablePath: CHROME, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const out = { scenario: '?playtest=oblez&civTest=1 (Ateny, wrogie miasto z murem; wojna z presetu)', phases: [], errors: [] };
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', (e) => out.errors.push(String(e)));
    await page.goto(base + '/?playtest=oblez&civTest=1', { waitUntil: 'load', timeout: 180000 });
    for (let i = 0; i < 600; i++) {
      const ok = await page.evaluate(() => !!(window.__civTest && window.__siegeBadgeTestDebug && window.__civTest.state().cities.some((c) => c.id === 'city0')));
      if (ok) break;
      await page.waitForTimeout(250);
    }
    await page.waitForTimeout(1500);
    out.state0 = await page.evaluate(() => window.__civTest.state());
    // Zamknij ewentualne okna/panele (Dyplomacja itd.) przed zrzutami.
    const closeOverlays = async () => page.evaluate(() => {
      const closed = [];
      for (const b of Array.from(document.querySelectorAll('button'))) {
        if (b.offsetParent && /^(Zamknij|Wróć|OK|Rozumiem)$/.test((b.textContent || '').trim()) && !b.closest('#civ-siege-map-panel')) { b.click(); closed.push((b.textContent || '').trim()); }
      }
      return closed;
    });
    out.closedOverlays = await closeOverlays();

    // Krok 0: wyznacz heks jednostki przy murze (start oblezenia = zwroci anchor), wycofaj, dodaj 10 jednostek, wroc.
    await page.evaluate(() => window.__siegeBadgeTestDebug.setResearchedTechs([]));
    const first = await page.evaluate(() => window.__siegeBadgeTestDebug.startPlayerSiege('city0'));
    out.firstStart = first;
    if (!first.ok) throw new Error('startPlayerSiege nie powiodl sie: ' + JSON.stringify(first));
    await page.evaluate(() => { const b = document.querySelector('#civ-siege-map-panel [data-act="retreat"]'); if (b) b.click(); });
    await page.waitForTimeout(300);
    const added = await page.evaluate(({ q, r }) => { const ids = []; for (let i = 0; i < 10; i++) ids.push(window.__civTest.addUnit(0, q, r, false)); return ids; }, { q: first.q, r: first.r });
    out.addedUnits = added.filter(Boolean).length;
    await page.evaluate(() => window.__siegeBadgeTestDebug.fundPlayer(5000));

    for (const ph of PHASES) {
      await page.evaluate((t) => window.__siegeBadgeTestDebug.setResearchedTechs(t), ph.techs);
      const st = await page.evaluate(() => window.__siegeBadgeTestDebug.startPlayerSiege('city0'));
      await page.waitForTimeout(700);
      await closeOverlays();
      const gate = await page.evaluate(() => window.__siegeBadgeTestDebug.siegeOptions('city0'));
      const dom = await readPanel(page);
      const shot = 'w18-r3-' + ph.id + '.png';
      await page.screenshot({ path: path.join(EVID, shot) });
      out.phases.push({ id: ph.id, techs: ph.techs, start: st, domPanel: dom, gateOptions: gate, screenshot: shot });
      await page.evaluate(() => { const b = document.querySelector('#civ-siege-map-panel [data-act="retreat"]'); if (b) b.click(); });
      await page.waitForTimeout(300);
    }
  } catch (e) { out.errors.push(e.stack || String(e)); }
  await browser.close();
  srv.close();

  // Werdykt: oczekiwanie = machina widoczna (DOM i bramka) wtw. jej Tech jest w zestawie gracza.
  const NEED = { 'Taran': 'Obróbka drewna', 'Taran okuty': 'Brązownictwo', 'Wieża oblężnicza': 'Brązownictwo', 'Katapulta': 'Sztuka wojenna' };
  const rows = [];
  let fail = false;
  for (const ph of out.phases) {
    for (const [unit, tech] of Object.entries(NEED)) {
      const expected = ph.techs.includes(tech);
      const domVisible = (ph.domPanel.buttons || []).some((b) => b.text.startsWith(unit + ' ·'));
      const g = (ph.gateOptions || []).find((o) => o.unit === unit);
      const gateVisible = !!(g && g.visible);
      const ok = expected === domVisible && expected === gateVisible;
      if (!ok) fail = true;
      rows.push({ phase: ph.id, unit, tech, expectedVisible: expected, domVisible, gateVisible, gateAllowed: g ? g.allowed : null, gateReason: g ? g.reason : null, ok });
    }
  }
  out.table = rows;
  out.verdict = out.errors.length || out.phases.length !== PHASES.length ? 'BLAD (' + out.errors.length + ' bledow)' : (fail ? 'FAIL' : 'PASS');
  fs.mkdirSync(EVID, { recursive: true });
  fs.writeFileSync(path.join(EVID, 'w18-r3-oblezenie-przed-po.json'), JSON.stringify(out, null, 2));
  console.log('VERDICT', out.verdict);
  console.log(JSON.stringify(rows, null, 0));
  process.exitCode = out.verdict === 'PASS' ? 0 : 1;
})();
