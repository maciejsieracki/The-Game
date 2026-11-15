'use strict';
/**
 * live-verify-prebattle-weakened-q1.cjs — R-WEB-LIVE-VERIFY-PREBATTLE-WEAKENED-WARNING-Q1 (r2).
 *
 * Realna sciezka w Chromium (zbudowany bundle vite poza repo, `?playtest=mapa&civTest=1`):
 *   start tury 1 -> (scenariusz) wymuszenie kary -> REALNY endTurn (czekamy az tura = 2)
 *   -> spawn jednostek gracza obok jednostki barbarzyncow -> zaznaczenie jednostki gracza
 *   -> REALNY KLIK w heks wroga (atak z mapy, openPlayerMapUnitAttack) -> odczyt DOM okna przed bitwa.
 *
 * Haki (tylko ?civTest=1), co jest HAKIEM, a co UI:
 *   - HAK: __truceTestDebug.suppressVictoryForTest() -> wylacza zwyciestwo w pierwszym EOT mapy testowej
 *     (ten sam hak co w diplo-truce-live-test.cjs); bez tego ekran ZWYCIESTWO przykrywa okno przed bitwa;
 *   - HAK: __frozenTestDebug.spawn/screenOf/focus/freeLandHex (postawienie jednostek gracza, wspolrzedne ekranu);
 *   - HAK: __civTest.addUnit(-1, ...) (jednostka barbarzyncow), __civTest.endTurn() (REALNA tura);
 *   - HAK: __aiTradeWiringTestDebug.setSpichlerzPanstwa(ME, v) -> zapas Zywnosci panstwa (glod wojska przy 0);
 *   - HAK: __ledgerRealPathDebug.setTreasury(ME, v) -> skarbiec (deficyt Zlota przy < 0);
 *   - HAK (fallback, tylko gdy klik nie zaznaczy): __frozenTestDebug.select(id) -- zapisywane jako selectionMethod;
 *   - UI: klik w heks wroga (page.mouse.click) — to jest prawdziwy atak z mapy.
 * Odczyt wyniku: WYLACZNIE DOM okna przed bitwa (.pb-weak, jego karta .pb-cmd, strona pb-you/pb-foe),
 *   bez wywolan showPreBattle. Zrzut ekranu: po usunieciu nakladek konca gry (#__victory_screen__,
 *   #__gameover_overlay__), co jest zapisywane w polu victoryOverlayRemoved.
 *
 * Asercje (wynik zapisany w out.assertions; kod wyjscia 1 gdy ktorakolwiek nie przechodzi):
 *   none: brak .pb-weak; hunger/hunger-stack: .pb-weak tylko po stronie gracza, tekst "głód wojska −N%";
 *   gold: .pb-weak tylko po stronie gracza, tekst "deficyt złota −N%"; N = round((1 - mnoznik) * 100)
 *   z gra/data/econ-params.json (glod_wojska_stat_mult / zloto_deficyt_stat_mult, dla wszystkich trudnosci 0,75);
 *   wszystkie: karta z ostrzezeniem w viewport, brak poziomego i pionowego przewijania strony.
 *
 * Usage (z gra/): node tools/live-verify-prebattle-weakened-q1.cjs <dist-dir> <out.json> [shots-dir]
 * Scenariusze: none, hunger, gold, hunger-stack (12 jednostek gracza w stosie: 8 widocznych + "+N więcej");
 * rozmiary 1280x800 i 1024x640.
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

const ECON = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'econ-params.json'), 'utf8'));
const EM = ECON.ekonomia_miasta || {};
const GLOD_MULT = Number(EM.glod_wojska_stat_mult && EM.glod_wojska_stat_mult.normal);
const DEF_MULT = Number(EM.zloto_deficyt_stat_mult && EM.zloto_deficyt_stat_mult.normal);
const GLOD_PCT = Math.round((1 - GLOD_MULT) * 100);
const DEF_PCT = Math.round((1 - DEF_MULT) * 100);

const SCENARIOS = [
  { id: 'none', spichlerz: 9999, treasury: 5000, n: 1 },
  { id: 'hunger', spichlerz: 0, treasury: 5000, n: 1 },
  { id: 'gold', spichlerz: 9999, treasury: -200, n: 1 },
  { id: 'hunger-stack', spichlerz: 0, treasury: 5000, n: 12 },
];
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

/** Stan okna przed bitwa z DOM: strona ostrzezenia (karta .pb-cmd), jego karta, przewijanie i wyjscie poza viewport. */
async function readPreBattle(page) {
  return page.evaluate(() => {
    const vh = window.innerHeight; const vw = window.innerWidth;
    const overlay = document.querySelector('.pb-overlay');
    const weaks = Array.from(document.querySelectorAll('.pb-weak'));
    const weak = weaks[0] || null;
    const weakCard = weak ? weak.closest('.pb-cmd') : null;
    const rect = (el) => { const r = el.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), h: Math.round(r.height), w: Math.round(r.width) }; };
    const cmds = Array.from(document.querySelectorAll('.pb-overlay .pb-cmd')).map(c => ({
      side: c.classList.contains('pb-you') ? 'player' : (c.classList.contains('pb-foe') ? 'foe' : 'other'),
      hasWeak: !!c.querySelector('.pb-weak'),
      rect: rect(c),
    }));
    let weakCardBox = null;
    if (weakCard) {
      const cs = getComputedStyle(weakCard);
      weakCardBox = { ...rect(weakCard), side: weakCard.classList.contains('pb-you') ? 'player' : 'foe', maxHeight: cs.maxHeight, overflowY: cs.overflowY, scrollH: weakCard.scrollHeight, clientH: weakCard.clientHeight };
    }
    const rosters = Array.from(document.querySelectorAll('.pb-overlay .pb-roster')).map(r => ({
      cls: String(r.className).slice(0, 60), rect: rect(r), shown: r.querySelectorAll('.pb-uc').length,
      more: (r.querySelector('.pb-more') || { textContent: '' }).textContent.trim() || null,
    }));
    const offscreen = overlay ? Array.from(overlay.querySelectorAll('*')).filter(el => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && (r.top < -1 || r.bottom > vh + 1 || r.left < -1 || r.right > vw + 1);
    }).length : null;
    const doc = document.documentElement;
    return {
      open: !!overlay,
      weakCount: weaks.length,
      weakPresent: weaks.length > 0,
      weakText: weak ? weak.innerText.trim() : null,
      weakSide: weakCardBox ? weakCardBox.side : null,
      foeHasWeak: cmds.some(c => c.side === 'foe' && c.hasWeak),
      weakCardBox,
      cmds,
      rosters,
      offscreenOverlayElements: offscreen,
      docScroll: { scrollH: doc.scrollHeight, clientH: doc.clientHeight, scrollW: doc.scrollWidth, clientW: doc.clientWidth },
      viewport: { w: vw, h: vh },
      cardOutsideViewport: weakCardBox ? (weakCardBox.top < 0 || weakCardBox.bottom > vh || weakCardBox.left < 0 || weakCardBox.right > vw) : null,
    };
  });
}

async function runOne(browser, base, sc, vp, shotsDir) {
  const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e && e.message || e)));
  await page.goto(base + '/?playtest=mapa&civTest=1', { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(
    () => window.__frozenTestDebug && window.__civTest && window.__eraTestDebug
      && window.__eraTestDebug.getWorldState().citiesLen > 0 && window.__eraTestDebug.getWorldState().turn === 1,
    null, { timeout: 240000 });
  await page.waitForTimeout(1200);
  const steps = { scenario: sc.id, vp };
  // HAK: zwyciestwo w pierwszym EOT mapy testowej wylaczone (inaczej ekran konca gry przykrywa okno).
  steps.suppressVictory = await page.evaluate(() => {
    const t = window.__truceTestDebug;
    if (t && typeof t.suppressVictoryForTest === 'function') { t.suppressVictoryForTest(); return true; }
    return false;
  });
  steps.spichlerzSet = await page.evaluate(([me, v]) => window.__aiTradeWiringTestDebug.setSpichlerzPanstwa(me, v), [ME, sc.spichlerz]);
  steps.skarbiec = await page.evaluate(([me, v]) => window.__ledgerRealPathDebug.setTreasury(me, v), [ME, sc.treasury]);
  // REALNA tura: kara (lub zdrowa baza) liczy sie w tickach ekonomii endTurn. Czekamy, az tura faktycznie przejdzie.
  await page.evaluate(() => window.__civTest.endTurn());
  try {
    await page.waitForFunction(() => window.__eraTestDebug.getWorldState().turn === 2, null, { timeout: 30000 });
  } catch (e) { steps.turnWaitTimeout = true; }
  await page.waitForTimeout(800);
  steps.turnAfterEnd = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
  steps.preOpenBeforeAttack = (await readPreBattle(page)).open;
  const hex = await page.evaluate(() => window.__frozenTestDebug.freeLandHex());
  if (!hex) { await page.close(); return { ...steps, error: 'brak wolnego heksu ladu' }; }
  const ids = await page.evaluate(([q, r, n]) => window.__frozenTestDebug.spawn(q, r, n, { ruchLeft: 3 }), [hex.q, hex.r, sc.n]);
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
    // Fallback (HAK, nie UI): zaznaczenie przez frozenTestDebug.select, gdy klik nie zaznaczyl jednostki.
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
    // Nakladki konca gry nie sa czescia tego pomiaru: usuwamy je tuz przed zrzutem i zapisujemy ten fakt.
    steps.victoryOverlayRemoved = await page.evaluate(() => {
      const ids = ['__victory_screen__', '__gameover_overlay__'];
      const found = ids.filter(id => document.getElementById(id));
      found.forEach(id => document.getElementById(id).remove());
      return found;
    });
    const stillOpen = await page.evaluate(() => !!document.querySelector('.pb-overlay'));
    steps.preBattleStillOpenForShot = stillOpen;
    await page.screenshot({ path: path.join(shotsDir, `${sc.id}-${vp.w}x${vp.h}.png`) });
  }
  await page.close();
  return { ...steps, preBattle: pb, pageErrors: errors };
}

/** Asercje dla jednego przebiegu. Zwraca liste {name, ok, detail}. */
function assertRun(sc, vp, r) {
  const out = [];
  const add = (name, ok, detail) => out.push({ name, ok: !!ok, detail: detail === undefined ? null : detail });
  const key = `${sc.id}|${vp.w}x${vp.h}`;
  if (r.error) { add(`${key}: przebieg bez bledu`, false, r.error); return out; }
  const pb = r.preBattle;
  add(`${key}: okno przed bitwa otwarte`, pb.open);
  add(`${key}: brak bledow strony`, r.pageErrors.length === 0, r.pageErrors);
  add(`${key}: tura przeszla na 2 po endTurn`, r.turnAfterEnd === 2, r.turnAfterEnd);
  add(`${key}: zaznaczenie jednostki gracza (metoda ${r.selectionMethod})`, !!r.selected, r.selected);
  if (sc.id === 'none') {
    add(`${key}: bez kary brak .pb-weak`, !pb.weakPresent, pb.weakCount);
  } else {
    add(`${key}: .pb-weak obecny (dokladnie 1)`, pb.weakCount === 1, pb.weakCount);
    add(`${key}: .pb-weak po stronie gracza (pb-you)`, pb.weakSide === 'player', pb.weakSide);
    add(`${key}: strona barbarzyncow (pb-foe) bez ostrzezenia`, !pb.foeHasWeak, pb.foeHasWeak);
    if (sc.id === 'gold') {
      add(`${key}: tekst deficytu zlota -${DEF_PCT}%`, !!pb.weakText && pb.weakText.includes('deficyt złota −' + DEF_PCT + '%') && !pb.weakText.includes('głód'), pb.weakText);
    } else {
      add(`${key}: tekst glodu wojska -${GLOD_PCT}%`, !!pb.weakText && pb.weakText.includes('głód wojska −' + GLOD_PCT + '%') && !pb.weakText.includes('deficyt'), pb.weakText);
    }
  }
  if (pb.weakCardBox) {
    add(`${key}: karta ostrzezenia miesci sie w viewport`, !r.preBattle.cardOutsideViewport, pb.weakCardBox);
  }
  add(`${key}: brak poziomego przewijania strony`, pb.docScroll.scrollW <= pb.docScroll.clientW + 1, pb.docScroll);
  add(`${key}: brak pionowego przewijania strony`, pb.docScroll.scrollH <= pb.docScroll.clientH + 1, pb.docScroll);
  add(`${key}: zadne elementy okna poza viewport`, pb.offscreenOverlayElements === 0, pb.offscreenOverlayElements);
  if (sc.id === 'hunger-stack') {
    const you = pb.rosters.find(x => x.cls.includes('pb-you'));
    add(`${key}: lista wojsk gracza pokazuje 8 i \"+N więcej\"`, !!you && you.shown === 8 && !!you.more && /\+\d+ więcej/.test(you.more), you);
    add(`${key}: lista wojsk gracza miesci sie w viewport`, !!you && you.rect.bottom <= pb.viewport.h && you.rect.top >= 0, you && you.rect);
  }
  return out;
}

(async () => {
  const srv = await serve();
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ headless: true, executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const out = { runs: {}, assertions: [], meta: { dist: DIST, chromium: '/opt/pw-browsers/chromium', glodMult: GLOD_MULT, deficytMult: DEF_MULT, expectedGlodPct: GLOD_PCT, expectedDeficytPct: DEF_PCT } };
  let failed = 0;
  try {
    for (const sc of SCENARIOS) {
      for (const vp of VIEWPORTS) {
        const key = `${sc.id}|${vp.w}x${vp.h}`;
        let r;
        try {
          r = await runOne(browser, base, sc, vp, SHOTS);
        } catch (e) {
          r = { scenario: sc.id, vp, error: String(e && e.message || e) };
        }
        out.runs[key] = r;
        const asserts = assertRun(sc, vp, r);
        out.assertions.push(...asserts);
        failed += asserts.filter(a => !a.ok).length;
        fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
        console.log('RUN', key, JSON.stringify({ err: r.error || null, weak: r.preBattle && r.preBattle.weakText, weakSide: r.preBattle && r.preBattle.weakSide, fails: asserts.filter(a => !a.ok).map(a => a.name) }));
      }
    }
  } finally {
    await browser.close();
    srv.close();
  }
  out.summary = { total: out.assertions.length, failed };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log('SUMMARY', JSON.stringify(out.summary));
  process.exitCode = failed === 0 ? 0 : 1;
})();
