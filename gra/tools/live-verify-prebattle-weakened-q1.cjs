'use strict';
/**
 * live-verify-prebattle-weakened-q1.cjs — R-WEB-LIVE-VERIFY-PREBATTLE-WEAKENED-WARNING-Q1.
 *
 * Realna sciezka w Chromium (zbudowany bundle vite poza repo, `?playtest=mapa&civTest=1`):
 *   start tury 1 -> (opcjonalnie) wymuszenie kary -> REALNY endTurn -> spawn jednostki gracza
 *   obok jednostki barbarzyncow -> REALNY KLIK w jednostke gracza (zaznaczenie) -> REALNY KLIK
 *   w heks wroga (atak z mapy, openPlayerMapUnitAttack) -> odczyt DOM okna przed bitwa.
 *
 * Haki (tylko ?civTest=1), co jest HAKIEM, a co UI:
 *   - HAK: __frozenTestDebug.spawn/screenOf/selectedId (postawienie jednostki gracza, wspolrzedne ekranu);
 *   - HAK: __civTest.addUnit(-1, ...) (jednostka barbarzyncow), __civTest.endTurn() (REALNA tura);
 *   - HAK: __civTest.setSpichlerzPanstwa(ME, 0) -> proba glodu wojska (zapas Zywnosci panstwa = 0);
 *   - HAK: __ledgerRealPathDebug.setTreasury(ME, -X) -> deficyt Zlota (skarbiec < 0) przed endTurn;
 *   - UI: klik w jednostke i w heks wroga (page.mouse.click) — to jest prawdziwy atak z mapy.
 * Odczyt wyniku: WYLACZNIE DOM okna przed bitwa (.pb-weak i tekst), bez wywolan showPreBattle.
 *
 * Usage (z gra/): node tools/live-verify-prebattle-weakened-q1.cjs <dist-dir> <out.json>
 * Scenariusze: none (bez kary), hunger (glod wojska), gold (deficyt zlota); rozmiary 1280x800 i 1024x640.
 */
const fs = require('fs');
const path = require('path');
const http = require('http');

const DIST = process.argv[2];
const OUT = process.argv[3];
const SHOTS = process.argv[4] || '';
if (!DIST || !OUT) throw new Error('usage: node live-verify-prebattle-weakened-q1.cjs <dist-dir> <out.json> [shots-dir]');
const { chromium } = require('playwright');
const ME = 0;
const BARB = -1;

const SCENARIOS = ['none', 'hunger', 'gold'];
const VIEWPORTS = [{ w: 1280, h: 800 }, { w: 1024, h: 640 }];
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.svg': 'image/svg+xml', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.webp': 'image/webp', '.jpg': 'image/jpeg' };

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

/** Stan okna przed bitwa: ostrzezenie (.pb-weak), jego tekst, oraz prostokat karty okna (dziecko .pb-overlay). */
async function readPreBattle(page) {
  return page.evaluate(() => {
    const weak = document.querySelector('.pb-weak');
    const overlay = document.querySelector('.pb-overlay');
    const vh = window.innerHeight; const vw = window.innerWidth;
    let box = null;
    let cardInfo = null;
    if (overlay) {
      const kids = Array.from(overlay.children);
      let best = null; let bestH = -1;
      for (const el of kids) {
        const r = el.getBoundingClientRect();
        if (r.height > bestH) { bestH = r.height; best = el; }
      }
      if (best) {
        const r = best.getBoundingClientRect();
        const cs = getComputedStyle(best);
        box = { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), h: Math.round(r.height), w: Math.round(r.width), cls: String(best.className).slice(0, 80) };
        cardInfo = { maxHeight: cs.maxHeight, overflowY: cs.overflowY, scrollH: best.scrollHeight, clientH: best.clientHeight };
      }
    }
    const outside = box ? (box.top < 0 || box.bottom > vh || box.left < 0 || box.right > vw) : null;
    return {
      open: !!overlay,
      weakPresent: !!weak,
      weakText: weak ? weak.innerText.trim() : null,
      box, card: cardInfo, viewport: { w: vw, h: vh }, outsideViewport: outside,
    };
  });
}

async function runOne(browser, base, scenario, vp, shotsDir) {
  const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e && e.message || e)));
  await page.goto(base + '/?playtest=mapa&civTest=1', { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(
    () => window.__frozenTestDebug && window.__civTest && window.__eraTestDebug
      && window.__eraTestDebug.getWorldState().citiesLen > 0 && window.__eraTestDebug.getWorldState().turn === 1,
    null, { timeout: 240000 });
  await page.waitForTimeout(1200);
  const steps = { scenario, vp };
  // Zdrowa baza: zapas Zywnosci panstwa duzy i skarbiec dodatni, chyba ze scenariusz wymusza kare.
  steps.spichlerzSet = await page.evaluate(([me, v]) => window.__aiTradeWiringTestDebug.setSpichlerzPanstwa(me, v), [ME, scenario === 'hunger' ? 0 : 9999]);
  steps.skarbiec = await page.evaluate(([me, v]) => window.__ledgerRealPathDebug.setTreasury(me, v), [ME, scenario === 'gold' ? -200 : 5000]);
  // REALNA tura: kara (lub zdrowa baza) liczy sie w tickach ekonomii endTurn.
  await page.evaluate(() => window.__civTest.endTurn());
  await page.waitForTimeout(800);
  steps.turnAfterEnd = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
  steps.preOpenBeforeAttack = (await readPreBattle(page)).open;
  const hex = await page.evaluate(() => window.__frozenTestDebug.freeLandHex());
  if (!hex) { await page.close(); return { ...steps, error: 'brak wolnego heksu ladu' }; }
  const ids = await page.evaluate(([q, r]) => window.__frozenTestDebug.spawn(q, r, 1, { ruchLeft: 3 }), [hex.q, hex.r]);
  // Wrog (barbarzyncy) na sasiednim heksie; w razie braku miejsca probujemy kolejnych.
  const nbrs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];
  let enemy = null;
  for (const [dq, dr] of nbrs) {
    const q = hex.q + dq; const r = hex.r + dr;
    const id = await page.evaluate(([qq, rr]) => window.__civTest.addUnit(-1, qq, rr, false), [q, r]);
    if (id) { enemy = { q, r, id }; break; }
  }
  steps.playerUnits = ids;
  steps.enemy = enemy;
  if (!enemy) { await page.close(); return { ...steps, error: 'nie udalo sie postawic wroga' }; }
  await page.waitForTimeout(500);
  await page.evaluate(([q, r]) => window.__frozenTestDebug.focus(q, r), [hex.q, hex.r]);
  await page.waitForTimeout(400);
  const pos = await page.evaluate(([q, r]) => window.__frozenTestDebug.screenOf(q, r), [hex.q, hex.r]);
  await page.mouse.click(pos.x, pos.y);
  await page.waitForTimeout(500);
  steps.selectedByClick = await page.evaluate(() => window.__frozenTestDebug.selectedId());
  steps.selectionMethod = 'klik';
  if (!steps.selectedByClick) {
    // Fallback (HAK, nie UI): zaznaczenie jednostki przez frozenTestDebug.select, gdy klik nie trafil w zolw jednostki.
    await page.evaluate((id) => window.__frozenTestDebug.select(id), ids[0]);
    await page.waitForTimeout(300);
    steps.selectionMethod = 'hak-select';
  }
  steps.selected = await page.evaluate(() => window.__frozenTestDebug.selectedId());
  await page.evaluate(([q, r]) => window.__frozenTestDebug.focus(q, r), [enemy.q, enemy.r]);
  await page.waitForTimeout(400);
  const epos = await page.evaluate(([q, r]) => window.__frozenTestDebug.screenOf(q, r), [enemy.q, enemy.r]);
  steps.clickPos = { pos, epos };
  await page.mouse.click(epos.x, epos.y);
  await page.waitForTimeout(1500);
  const pb = await readPreBattle(page);
  if (shotsDir) {
    fs.mkdirSync(shotsDir, { recursive: true });
    await page.screenshot({ path: path.join(shotsDir, `${scenario}-${vp.w}x${vp.h}.png`) });
  }
  await page.close();
  return { ...steps, preBattle: pb, pageErrors: errors };
}

(async () => {
  const srv = await serve();
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ headless: true, executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const out = { runs: {}, meta: { dist: DIST, chromium: '/opt/pw-browsers/chromium' } };
  try {
    for (const sc of SCENARIOS) {
      for (const vp of VIEWPORTS) {
        const key = `${sc}|${vp.w}x${vp.h}`;
        try {
          out.runs[key] = await runOne(browser, base, sc, vp, SHOTS);
        } catch (e) {
          out.runs[key] = { scenario: sc, vp, error: String(e && e.message || e) };
        }
        fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
        const r = out.runs[key];
        console.log('RUN', key, JSON.stringify({ err: r.error || null, open: r.preBattle && r.preBattle.open, weak: r.preBattle && r.preBattle.weakText, outside: r.preBattle && r.preBattle.outsideViewport }));
      }
    }
  } finally {
    await browser.close();
    srv.close();
  }
})();
