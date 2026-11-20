'use strict';
/**
 * prebattle-rawids-roster-q1.cjs — R-WEB-UI-PREBATTLE-RAW-IDS-AND-ROSTER-OVERLAP-Q1.
 *
 * Realna sciezka w Chromium (bundle vite zbudowany POZA repo, ?playtest=mapa&civTest=1):
 * spawn N jednostek gracza, barbarzynca na sasiednim heksie, REALNY klik w jednostke gracza
 * i REALNY klik w heks wroga (atak z mapy) -> odczyt DOM okna „Rozstawienie bitwy” (.pb-overlay).
 * Haki (tylko ?civTest=1): __truceTestDebug.suppressVictoryForTest, __frozenTestDebug.{freeLandHex,
 * spawn, focus, screenOf, select, selectedId}, __civTest.addUnit.
 *
 * Mierzy:
 *  - raw: widoczny tekst okna (innerText, bez data-*) pod wzorce surowych ID;
 *  - geo: lista wojsk gracza (.pb-roster.pb-you): prostokaty listy, „+N więcej”, panelu rozstawienia
 *    (.pb-deploy) i przyciskow akcji; nakladanie listy/„+N” na panel; wyjscie poza viewport.
 *
 * Usage: node tools/prebattle-rawids-roster-q1.cjs <dist-dir> <out.json> [shots-dir] [label]
 * Env: PB_N (liczba jednostek, domyslnie 12), PB_VP (np. 1024x640; domyslnie wszystkie trzy),
 *      CHROMIUM_PATH (domyslnie: CHROME_PATH, potem /usr/bin/google-chrome, potem /usr/bin/chromium).
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');

const DIST = process.argv[2];
const OUT = process.argv[3];
const SHOTS = process.argv[4] || '';
const LABEL = process.argv[5] || 'run';
if (!DIST || !OUT) throw new Error('usage: node prebattle-rawids-roster-q1.cjs <dist-dir> <out.json> [shots-dir] [label]');
const N = Number(process.env.PB_N || 12);
const ALL_VP = [{ w: 1024, h: 640 }, { w: 1280, h: 800 }, { w: 1920, h: 1080 }];
const VIEWPORTS = process.env.PB_VP ? ALL_VP.filter(v => v.w + 'x' + v.h === process.env.PB_VP) : ALL_VP;
const RAW_SRC = 'Matrix:|walka_|plytkie_morze|[a-z]+_[a-z_]+';
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

async function readOverlay(page) {
  return page.evaluate((rawSrc) => {
    const ov = document.querySelector('.pb-overlay');
    if (!ov) return { open: false };
    const vw = window.innerWidth; const vh = window.innerHeight;
    const rect = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right) }; };
    const inter = (a, b) => !!a && !!b && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    const youRoster = ov.querySelector('.pb-roster.pb-you');
    const more = youRoster ? youRoster.querySelector('.pb-more') : null;
    const cards = youRoster ? youRoster.querySelector('.pb-rcards') : null;
    const deploy = ov.querySelector('.pb-deploy');
    const btns = deploy ? Array.from(deploy.querySelectorAll('.pb-btn')) : [];
    const rosterRect = rect(youRoster);
    const deployRect = rect(deploy);
    const moreRect = rect(more);
    const btnRects = btns.map(b => rect(b));
    const visText = ov.innerText;
    const rawMatches = (visText.match(new RegExp(rawSrc, 'g')) || []);
    return {
      open: true, vw, vh,
      innerText: visText,
      rawMatches,
      youShown: youRoster ? youRoster.querySelectorAll('.pb-uc').length : 0,
      youMore: more ? more.textContent.trim() : null,
      rosterRect, moreRect, cardsRect: rect(cards),
      deployRect, btnRects,
      cardsScrollable: !!cards && cards.scrollHeight > cards.clientHeight + 1,
      rosterOverlapsDeploy: inter(rosterRect, deployRect),
      moreOverlapsDeploy: inter(moreRect, deployRect),
      moreInViewport: !!moreRect && moreRect.bottom <= vh && moreRect.top >= 0,
      btnsInViewport: btnRects.length > 0 && btnRects.every(r => !!r && r.bottom <= vh && r.top >= 0 && r.left >= 0 && r.right <= vw),
      docScroll: { scrollH: document.documentElement.scrollHeight, clientH: document.documentElement.clientHeight, scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth },
    };
  }, RAW_SRC);
}

/** Asercje (dispatch kryteria b/c/d): zwraca liste naruszen; pusta = PASS. */
function checkRun(key, r) {
  const f = [];
  if (r.error) return ['blad uruchomienia: ' + r.error];
  const o = r.overlay || {};
  if (!o.open) return ['okno rozstawienia nie otwarte'];
  if (o.rawMatches.length) f.push('surowe ID w tekscie okna: ' + JSON.stringify(o.rawMatches));
  if (o.youShown !== 8) f.push('liczba kart listy ' + o.youShown + ' (oczekiwano 8 przy 12 jednostkach)');
  if (o.youMore !== '+4 więcej…') f.push('linia „+N” ' + JSON.stringify(o.youMore) + ' (oczekiwano „+4 więcej…”)');
  if (o.rosterOverlapsDeploy) f.push('lista wojsk nachodzi na panel rozstawienia');
  if (o.moreOverlapsDeploy) f.push('linia „+N” nachodzi na panel rozstawienia');
  if (!o.moreInViewport) f.push('linia „+N” poza viewportem: ' + JSON.stringify(o.moreRect));
  if (!o.btnsInViewport) f.push('przyciski akcji poza viewportem: ' + JSON.stringify(o.btnRects));
  if (!o.lastCardAfterScroll) f.push('brak ostatniej karty do pomiaru');
  else {
    if (!o.lastCardAfterScroll.inCards) f.push('ostatnia karta poza kontenerem listy po przewinieciu');
    if (!o.lastCardAfterScroll.inViewport) f.push('ostatnia karta poza viewportem po przewinieciu: ' + JSON.stringify(o.lastCardAfterScroll));
  }
  if (o.docScroll && o.docScroll.scrollW > o.docScroll.clientW) f.push('poziomy scroll strony');
  if ((r.pageErrors || []).length) f.push('bledy strony: ' + JSON.stringify(r.pageErrors));
  return f;
}

async function runOne(browser, base, vp, shotsDir) {
  const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e && e.message || e)));
  await page.goto(base + '/?playtest=mapa&civTest=1', { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(
    () => window.__frozenTestDebug && window.__civTest && window.__eraTestDebug
      && window.__eraTestDebug.getWorldState().citiesLen > 0 && window.__eraTestDebug.getWorldState().turn === 1,
    null, { timeout: 240000 });
  await page.waitForTimeout(1200);
  const step = {};
  step.suppressVictory = await page.evaluate(() => { const t = window.__truceTestDebug; if (t && t.suppressVictoryForTest) { t.suppressVictoryForTest(); return true; } return false; });
  const hex = await page.evaluate(() => window.__frozenTestDebug.freeLandHex());
  if (!hex) { await page.close(); return { error: 'brak wolnego heksu ladu' }; }
  const ids = await page.evaluate(([q, r, n]) => window.__frozenTestDebug.spawn(q, r, n, { ruchLeft: 3 }), [hex.q, hex.r, N]);
  const nbrs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];
  let enemy = null;
  for (const [dq, dr] of nbrs) {
    const q = hex.q + dq; const r = hex.r + dr;
    const id = await page.evaluate(([qq, rr]) => window.__civTest.addUnit(-1, qq, rr, false), [q, r]);
    if (id) { enemy = { q, r, id }; break; }
  }
  step.playerUnits = ids.length;
  if (!enemy) { await page.close(); return { error: 'nie udalo sie postawic wroga' }; }
  await page.waitForTimeout(500);
  await page.evaluate(([q, r]) => window.__frozenTestDebug.focus(q, r), [hex.q, hex.r]);
  await page.waitForTimeout(400);
  const pos = await page.evaluate(([q, r]) => window.__frozenTestDebug.screenOf(q, r), [hex.q, hex.r]);
  await page.mouse.click(pos.x, pos.y);
  await page.waitForTimeout(500);
  step.selectionMethod = 'klik';
  if (!(await page.evaluate(() => window.__frozenTestDebug.selectedId()))) {
    await page.evaluate((id) => window.__frozenTestDebug.select(id), ids[0]);
    await page.waitForTimeout(300);
    step.selectionMethod = 'hak-select';
  }
  await page.evaluate(([q, r]) => window.__frozenTestDebug.focus(q, r), [enemy.q, enemy.r]);
  await page.waitForTimeout(400);
  const epos = await page.evaluate(([q, r]) => window.__frozenTestDebug.screenOf(q, r), [enemy.q, enemy.r]);
  await page.mouse.click(epos.x, epos.y);
  await page.waitForTimeout(1500);
  if (process.env.PB_MUTATE === 'deploy-wide') {
    // MUTACJA (tylko pomiar, nie zmiana kodu): panel rozstawienia rozciagniety na caly viewport.
    // Test geometrii musi wtedy zglosic nakladanie listy wojsk z panelem.
    await page.addStyleTag({ content: '.pb-deploy{width:100vw !important;left:0 !important;transform:none !important}' });
    await page.waitForTimeout(300);
  }
  if (process.env.PB_MUTATE === 'more-offscreen') {
    // MUTACJA (tylko pomiar): linia „+N więcej…” wypchnieta poza viewport; test (c) musi to zglosic.
    await page.addStyleTag({ content: '.pb-roster.pb-you .pb-more{position:fixed !important;top:' + (vp.h + 40) + 'px !important}' });
    await page.waitForTimeout(300);
  }
  const ov = await readOverlay(page);
  if (shotsDir && ov.open) {
    fs.mkdirSync(shotsDir, { recursive: true });
    await page.screenshot({ path: path.join(shotsDir, `${LABEL}-${vp.w}x${vp.h}.png`) });
  }
  // Ostatnia karta listy po przewinieciu wewnetrznego kontenera do konca (kryterium (c), dispatch).
  ov.lastCardAfterScroll = await page.evaluate(() => {
    const ov2 = document.querySelector('.pb-overlay');
    const cards = ov2 && ov2.querySelector('.pb-roster.pb-you .pb-rcards');
    if (!cards) return null;
    cards.scrollTop = cards.scrollHeight;
    const all = cards.querySelectorAll('.pb-uc');
    const last = all[all.length - 1];
    if (!last) return null;
    const r = last.getBoundingClientRect(); const c = cards.getBoundingClientRect();
    return { top: Math.round(r.top), bottom: Math.round(r.bottom), inViewport: r.bottom <= window.innerHeight && r.top >= 0, inCards: r.top >= c.top - 1 && r.bottom <= c.bottom + 1, count: all.length };
  });
  await page.close();
  return { ...step, overlay: ov, pageErrors: errors };
}

(async () => {
  const srv = await serve();
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || (require('./_chrome-path.cjs').resolveChromePath() || '/usr/bin/chromium'), args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const out = { label: LABEL, n: N, runs: {} };
  const allFails = [];
  try {
    for (const vp of VIEWPORTS) {
      const key = vp.w + 'x' + vp.h;
      let r;
      try { r = await runOne(browser, base, vp, SHOTS); } catch (e) { r = { error: String(e && e.message || e) }; }
      out.runs[key] = r;
      const o = r.overlay || {};
      const fails = checkRun(key, r);
      allFails.push(...fails.map(f => key + ': ' + f));
      console.log('RUN', LABEL, key, JSON.stringify({ err: r.error || null, open: o.open, raw: o.rawMatches, youShown: o.youShown, youMore: o.youMore, overlapRoster: o.rosterOverlapsDeploy, overlapMore: o.moreOverlapsDeploy, moreIn: o.moreInViewport, btnsIn: o.btnsInViewport, cardsScrollable: o.cardsScrollable, lastCard: o.lastCardAfterScroll, rosterRect: o.rosterRect, deployRect: o.deployRect, docScroll: o.docScroll, pageErrors: (r.pageErrors || []).length, fails }));
      fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
    }
  } finally {
    await browser.close();
    srv.close();
  }
  out.failures = allFails;
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log('ASSERT', LABEL, allFails.length === 0 ? 'OK' : 'FAIL ' + allFails.length, JSON.stringify(allFails));
  process.exitCode = allFails.length === 0 ? 0 : 1;
})().catch(e => { console.error('FATAL', e); process.exit(1); });
