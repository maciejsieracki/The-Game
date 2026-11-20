'use strict';
/**
 * R-WEB-LIVE-VERIFY-OBSERVATIONS-W18-W24-MANUAL-LOSSES-Q1 -- runda 3, punkt 3 (straty zwyciezcy).
 * RECZNA bitwa Z ROZKAZAMI: w kazdej rundzie oczekujacej na rozkazy driver dla KAZDEJ zywej jednostki gracza
 * ustawia zaznaczenie (_selectedUnits) i wydaje rozkaz ATAK na najblizszego wroga przez produkcyjna sciezke
 * _issueBattleAttack(targetId, queueOnly=true) (ta sama co Shift+LPM na wrogu), potem klawisz Spacja (Playwright)
 * wykonuje kolejke. Bez rozkazow = nie jest "reczna".
 * Roster 10 vs 10: scena z presetu ?playtest=bitwa-duza (28 vs 28) jest PRZYCINANA w fazie rozstawienia
 * (przed "Start walki") do 10 jednostek typu A (atakujacy) i 10 typu B (obronca); bez zmian w gra/src.
 * Pary: melee = Hastati vs Falanga; dystans = Lucznik vs Falanga (preset nie zawiera Wojownika).
 * Tryby: manual-rozkazy / AUTO (klawisz R) / skip (przycisk Pomin).
 * Usage (z gra/): node tools/live-verify-w3-manual-orders-r3.cjs <dist-dir> <out.json> [limitSekund]
 */
const fs = require('fs');
const path = require('path');
const http = require('http');

const DIST = process.argv[2];
const OUT = process.argv[3];
const LIMIT_S = Number(process.argv[4] || 1500);
if (!DIST || !OUT) throw new Error('usage: node live-verify-w3-manual-orders-r3.cjs <dist-dir> <out.json> [limitSekund]');
const CHROME = process.env.W3_CHROMIUM || (require('./_chrome-path.cjs').resolveChromePath() || '/usr/bin/chromium');
const { chromium } = require('playwright');

const PAIRS = [
  { pair: 'melee', atkType: 'Hastati', defType: 'Phalanx', label: 'wrecz: Hastati 10 vs Falanga 10' },
  { pair: 'dystans', atkType: 'Archer', defType: 'Phalanx', label: 'dystans: Lucznik 10 vs Falanga 10' },
];
const HITS = [
  { hit: 'pewne', seeds: [1] },
  { hit: 'losowe', seeds: [1, 2, 3] },
];
const CONFIGS = [];
for (const p of PAIRS) for (const h of HITS) for (const sd of h.seeds) {
  CONFIGS.push({ id: `${p.pair}-${h.hit}-s${sd}`, pt: 'bitwa-duza', seed: sd, hit: h.hit, pair: p.pair, atkType: p.atkType, defType: p.defType, ratioLabel: p.label });
}
const ONLY = process.env.W3_ONLY ? process.env.W3_ONLY.split(',') : null;
const MODES = process.env.W3_MODES ? process.env.W3_MODES.split(',') : ['manual', 'auto', 'skip'];

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

// Zegar deterministyczny (ten sam kod co live-verify-w3-seeds123-obs.cjs).
function initDet(seed) {
  let s = seed >>> 0;
  Math.random = () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  window.__fakeNow = 1000;
  window.__rafQ = [];
  window.requestAnimationFrame = (cb) => { window.__rafQ.push(cb); return window.__rafQ.length; };
  window.cancelAnimationFrame = () => {};
  performance.now = () => { window.__fakeNow += 0.01; return window.__fakeNow; };
  window.__framesRun = 0;
  window.__pumpFrames = (n) => {
    const bs = window.__lastBattleScene;
    for (let i = 0; i < n && !(bs && bs.finished); i++) {
      window.__framesRun++;
      const q = window.__rafQ; window.__rafQ = [];
      window.__fakeNow += 16;
      for (const cb of q) cb(window.__fakeNow);
    }
    return !!(bs && bs.finished);
  };
}

async function runOne(browser, base, cfg, mode) {
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.addInitScript(initDet, cfg.seed);
  const qs = `?playtest=${cfg.pt}&civTest=1&rams=0&chariots=0&towers=0`;
  await page.goto(base + '/' + qs, { waitUntil: 'load', timeout: 180000 });
  for (let i = 0; i < 600; i++) {
    const ready = await page.evaluate(() => { window.__pumpFrames(5); return !!window.__lastBattleScene; });
    if (ready) break;
    await page.waitForTimeout(50);
  }
  await page.evaluate(() => { if (!window.__lastBattleScene) throw new Error('brak sceny bitwy'); });
  await page.evaluate((h) => { window.__civSetHitMode(h); }, cfg.hit);
  await page.evaluate(() => {
    const bs = window.__lastBattleScene;
    bs.renderer.render = () => {};
    window.__dt = 16;
  });
  const trimInfo = await page.evaluate((c) => {
    const bs = window.__lastBattleScene;
    const before = { atk: bs.atk.map((u) => u.bu.nazwa), def: bs.def.map((u) => u.bu.nazwa) };
    const keep = (arr, type, n) => {
      const out = []; let k = 0;
      for (const u of arr) {
        if (u.bu.nazwa === type && k < n) { out.push(u); k++; }
        else { try { u.group && u.group.parent && u.group.parent.remove(u.group); } catch (e) {} }
      }
      return out;
    };
    const na = keep(bs.atk, c.atkType, 10); const nd = keep(bs.def, c.defType, 10);
    bs.atk.length = 0; na.forEach((u) => bs.atk.push(u));
    bs.def.length = 0; nd.forEach((u) => bs.def.push(u));
    try { bs._syncGroupRegistry && bs._syncGroupRegistry(); } catch (e) {}
    const cnt = (arr) => arr.reduce((m, u) => { m[u.bu.nazwa] = (m[u.bu.nazwa] || 0) + 1; return m; }, {});
    return { before: { atk: cnt(before.atk.map((n) => ({ bu: { nazwa: n } }))), def: cnt(before.def.map((n) => ({ bu: { nazwa: n } }))) }, atkAfter: cnt(bs.atk), defAfter: cnt(bs.def) };
  }, cfg);
  if (process.env.R3_TRACE) console.log('TRIM', JSON.stringify(trimInfo));
  const start = await page.evaluate(() => {
    const bs = window.__lastBattleScene;
    const a = bs._sideEndStats('atk'); const d = bs._sideEndStats('def');
    return { atkTotal: a.total, defTotal: d.total, atkHp: Math.round(a.hp), defHp: Math.round(d.hp), deployPhase: !!bs.deployPhase, manualAtStart: !!bs._manualMode };
  });
  const actions = { startClick: false, spacePresses: 0, rToggle: false, skipClick: false, ordersIssued: 0, orderRounds: 0, perRound: [] };
  // Pelne klikniecia/klawisze przez Playwright (wejscie uzytkownika), nie przez metody sceny.
  await page.waitForSelector('#deploy-toolbar-start', { timeout: 60000 }).catch(() => {});
  if (mode === 'skip') {
    // Start walki (klik), potem Pomin (klik) jak w produkcyjnym przycisku.
    await page.click('#deploy-toolbar-start', { timeout: 30000 });
    actions.startClick = true;
    await page.evaluate(() => window.__pumpFrames(30));
    const skipBtn = page.locator('button', { hasText: /Pomi/ }).first();
    if (await skipBtn.count()) { await skipBtn.click({ timeout: 30000 }).catch(() => {}); actions.skipClick = true; }
    else { await page.evaluate(() => window.__lastBattleScene.skip()); actions.skipClick = 'fallback-metoda'; }
  } else {
    await page.click('#deploy-toolbar-start', { timeout: 30000 });
    actions.startClick = true;
    await page.evaluate(() => window.__pumpFrames(30));
    if (mode === 'auto') {
      await page.keyboard.press('r'); actions.rToggle = true; // klawisz R = przelacz na AUTO
      await page.evaluate(() => window.__lastBattleScene._setSpeedIdx(3, { clamp: true }));
    }
  }
  const t0 = Date.now();
  let fin = false;
  let stuckLoops = 0;
  while (!fin) {
    if (mode === 'manual' || mode === 'manual-null') {
      // Faza 1 (runda 1): scena czeka na rozkazy (_battleAwaitingOrders). Kolejne rundy: po zmianie roundNo
      // driver ponownie wydaje rozkazy ATAK wszystkim zywym jednostkom i Spacja wykonuje kolejke.
      const st = await page.evaluate((lastRound) => {
        const bs = window.__lastBattleScene;
        for (let i = 0; i < 40 && !bs.finished; i++) {
          if (bs._battleAwaitingOrders || bs.roundNo !== lastRound) break;
          window.__pumpFrames(1);
        }
        return { aw: !!bs._battleAwaitingOrders, round: bs.roundNo, fin: !!bs.finished };
      }, actions.lastRound ?? -1);
      if (st.fin) { fin = true; }
      else if (st.aw || st.round !== (actions.lastRound ?? -1)) {
        // Licznik per runda: alive = zywe jednostki gracza; eligible = zywe, nie acted, z celem; issued = wydane rozkazy.
        // Tryb manual-null: BEZ rozkazow (tylko Spacja) - kontrola negatywna (nietautologicznosc sterownika).
        const pr = mode === 'manual-null' ? { alive: null, eligible: 0, issued: 0 } : await page.evaluate(() => {
          const bs = window.__lastBattleScene; let k = 0; let alive = 0; let eligible = 0;
          for (const u of bs._playerRoster()) {
            if (u.dead || u.removed || u.routed || u.fadingOut) continue;
            alive++;
            if (u.acted) continue;
            const e = bs._nearestEnemy(u);
            if (!e) continue;
            eligible++;
            bs._selectedUnits = new Set([u.bu.id]);
            bs._issueBattleAttack(e.bu.id, true);
            k++;
          }
          bs._selectedUnits = new Set();
          return { alive, eligible, issued: k };
        });
        const n = pr.issued;
        actions.perRound.push({ round: st.round, ...pr });
        actions.ordersIssued += n; actions.orderRounds++; actions.lastRound = st.round;
        await page.keyboard.press('Space'); actions.spacePresses++;
        fin = await page.evaluate(() => { window.__pumpFrames(2); return !!window.__lastBattleScene.finished; });
      } else {
        fin = false;
      }
      if (Date.now() - t0 > 420000) throw new Error('timeout bitwy manual');
      continue;
    } else {
      fin = await page.evaluate(() => window.__pumpFrames(300));
    }
    if (Date.now() - t0 > 420000) throw new Error('timeout bitwy ' + mode);
  }
  const res = await page.evaluate(() => {
    const bs = window.__lastBattleScene;
    const a = bs._sideEndStats('atk'); const d = bs._sideEndStats('def');
    return {
      winner: bs._endWinner ?? null, round: bs.roundNo,
      manualAtEnd: !!bs._manualMode,
      wallBreached: bs.wallEverBreached === true,
      atk: { total: a.total, lost: a.lost, remaining: a.remaining, hp: Math.round(a.hp), hpMax: Math.round(a.hpMax) },
      def: { total: d.total, lost: d.lost, remaining: d.remaining, hp: Math.round(d.hp), hpMax: Math.round(d.hpMax) },
      survivors: { atk: bs.atk.filter((u) => !u.dead && !u.routed).map((u) => ({ n: u.bu.nazwa, hp: Math.round(u.bu.hp), routed: !!u.routed, ammo: u.ammoLeft ?? null })), def: bs.def.filter((u) => !u.dead && !u.routed).length },
      endLogTail: (bs.log || []).slice(-4).map((x) => String(typeof x === 'string' ? x : JSON.stringify(x)).slice(0, 160)),
      endText: (document.body.innerText.match(/Koniec bitwy|Zwyci[ęe]stwo|Pora[żz]ka|Remis/g) || []).slice(0, 3),
    };
  });
  await page.close();
  return { trimInfo, start, actions, res, errors };
}

(async () => {
  const srv = await serve();
  const base = 'http://127.0.0.1:' + srv.address().port;
  const out = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : { runs: {}, meta: { chromium: CHROME, dist: DIST, runda: 3, note: 'reczna = rozkazy ATAK per jednostka (_issueBattleAttack queue) + Space; AUTO = klawisz R; skip = Pomin; roster przyciety do 10 vs 10' } };
  const browser = await chromium.launch({ headless: true, executablePath: CHROME, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const t0 = Date.now();
  try {
    for (const cfg of CONFIGS) {
      for (const mode of MODES) {
        const key = cfg.id + '|' + mode;
        if (ONLY && !ONLY.includes(cfg.id)) continue;
        if (out.runs[key] && !out.runs[key].error) continue;
        if ((Date.now() - t0) / 1000 > LIMIT_S) break;
        try {
          const r = await runOne(browser, base, cfg, mode);
          out.runs[key] = { cfg, mode, ...r };
        } catch (e) {
          out.runs[key] = { cfg, mode, error: String(e && e.message || e) };
        }
        fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
        console.log('DONE', key, JSON.stringify(out.runs[key].res || out.runs[key].error));
      }
    }
  } finally {
    await browser.close();
    srv.close();
  }
  const left = CONFIGS.flatMap((c) => MODES.map((m) => c.id + '|' + m)).filter((k) => !out.runs[k] || out.runs[k].error);
  console.log('LEFT', left.length, left.join(','));
})();
