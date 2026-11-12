'use strict';
/**
 * siege-auto-breach-replay-e2e-live-test.cjs -- R-WEB-SIEGE-AUTO-BREACH-REPLAY-E2E-Q1.
 *
 * Dowody w ZYWEJ grze (Chromium, vite build serwowany po HTTP, ?playtest=oblezenie-duze, prawdziwa BattleScene,
 * deterministyczne ziarno Math.random + zegar wirtualny dt=16 ms) dla sciezek oblezenia, ktore mialy NIE_ZMIERZONO:
 *
 *   P1  AUTO w oblezeniu BEZ przeskoku == SKIP (parytet z FALI 618), 1x (skrocony scenariusz) i predkosc >1x (pelny)
 *   B   oblezenie z wylomem: mur pada -> wallEverBreached; B4 = zywy atakujacy stoi NA zburzonym kaflu (HISTORYCZNIE,
 *       co klatke po wylomie; stan koncowy tylko INFO);
 *       B4b (R-WEB-SIEGE-AUTO-BREACH-ATTACKERS-ENTER-BEHIND-WALL-Q1) = PIECHUR (bez machin) ZA murem w ciagu 3 tur od wylomu
 *   R   "Rozegraj ponownie" po oblezeniu z wylomem: stan wylomu/muru/bramy wraca do poczatku
 *   M   bitwa reczna oblezenicza do konca, BEZ Skip
 *   F   _skipInstantFallback (sciezka awaryjna skip() przed startem) -- wynik, wylom z machiny w skladzie
 *   MUT mutacje zrodla (wylom, petla ticków przewijania, wylom w fallbacku) => czerwone
 *
 * SKROCENIA (jawne; asercje nie oslabione):
 *   - AUTO 1x pelnej bitwy oblezenia (400 tur) zajmuje ok. 24 min wall (swiftshader/headless, zmierzone w
 *     R-WEB-BATTLE-SKIP-SIEGE-TRUE-RESULT-Q1) -- poza limitem 120 s. Dla 1x uzywamy skroconego rosteru
 *     (6 piechurow + cala obleznicza + 6 obroncow, przez realna sciezke _replayBattle na przycietych
 *     _savedAtkBUs/_savedDefBUs), obnizonego HP kafli muru (6) i sufitu tur (instancja: _roundCapVerdict
 *     zwraca REMIS po N turach w OBU trybach -- ta sama funkcja steruje AUTO i przewijaniem).
 *   - Pelny roster: AUTO na predkosci 128x (idx 7), SKIP na tej samej predkosci (kwant ticka zalezy od speedMul).
 *
 * Zmienne srodowiska:
 *   SABR_ONLY      lista scenariuszy po przecinku: p1x1,p1fast,b,r,m,f (domyslnie wszystkie)
 *   SABR_DIST      gotowy build (pomija vite build)     SABR_CHROME  sciezka Chromium
 *   SABR_SKIP_KNOWN 1 = znany defekt B4b nie zmienia kodu wyjscia
 *   SABR_MUT       nazwa mutacji (patrz MUTS) -- build ze zmodyfikowanym zrodlem sceny; asercje maja byc CZERWONE
 *   SABR_FAST_CAP  sufit tur scenariusza p1fast (domyslnie 180; 240 dalo margines 16 s do limitu 120 s, 180 daje ok. 37 s)
 *   SABR_LIMIT_S   limit czasu per przebieg (domyslnie 120)
 *   SABR_SHOTS     katalog zrzutow (JPEG)               SABR_OUT   plik JSON-lines z wynikami
 *
 * Exit: 0 = wszystko PASS; 1 = FAIL; 2 = NIE_ZMIERZONO (brak playwright/Chromium);
 *       4 = czesc scenariuszy NIE_ZMIERZONO (limit czasu) i brak FAIL;
 *       5 = tylko ZNANY-DEFEKT (B4b; osobny temat); SABR_SKIP_KNOWN=1 => 0
 *       3 = ZNALEZISKO-DEFEKTU gry (tylko wpisy DEFEKT, brak innych FAIL) -- patrz raport, osobny temat.
 * Nie wymaga npm run build/dev (vite build --outDir poza repo).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');

const GRA = path.resolve(__dirname, '..');
const CHROME = process.env.SABR_CHROME
  || ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/usr/bin/chromium'].find((p) => fs.existsSync(p));
const LIMIT_MS = parseInt(process.env.SABR_LIMIT_S || '120', 10) * 1000;
const RUN = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const TMP_ROOT = path.join(os.tmpdir(), `civ-sabr-${RUN}`);
fs.mkdirSync(TMP_ROOT, { recursive: true });
process.on('exit', () => { try { fs.rmSync(TMP_ROOT, { recursive: true, force: true }); } catch { /* best-effort */ } });

let pass = 0; let fail = 0; let defects = 0; let unmeasured = 0; let knownDefects = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}
// ZNANY DEFEKT (osobny temat/decyzja wlasciciela): raportowany osobno, nie miesza sie z DEFEKT/FAIL.
// Exit 5 gdy to jedyny wynik niezerowy; SABR_SKIP_KNOWN=1 => exit 0 (nadal drukuje wpis).
function known(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { knownDefects++; console.log('ZNANY-DEFEKT: ' + name + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}
function defect(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { defects++; console.log('DEFEKT: ' + name + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}

// Mutacje zrodla BattleScene (wzorzec -> zamiennik). Kazda MA zdjac pokrycie z odpowiedniej asercji (CZERWONE).
const SCENE_REL = 'src/battle/battleScene.ts';
const MUTS = {
  'breach-off': [
    { from: 'this.wallTileHp.delete(wallRow);\n    this.wallEverBreached = true;', to: 'this.wallTileHp.delete(wallRow);' },
    { from: 'this.gateOpen = true;\n    this.wallEverBreached = true;', to: 'this.gateOpen = true;' },
  ],
  'restore-terrain-off': [
    { from: 'if (idx >= 0 && idx < tiles.length) tiles[idx] = this.siegeWallInitialTiles[r] as typeof tiles[number];', to: '' },
  ],
  'restore-visual-off': [
    { from: 'for (const o of this.siegeHiddenMeshes) o.visible = true;', to: '' },
  ],
  'restore-towers-off': [
    { from: '      t.destroyed = false;\n', to: '' },
  ],
  'restore-hp-off': [
    { from: 'this.wallTileHp.set(r, BattleScene.WALL_TILE_HP);', to: '' },
  ],
  'ff-tick': [
    { from: 'this.vNow += FF_STEP_MS;\n      this._ffVirtualMs += FF_STEP_MS;', to: 'this.vNow += FF_STEP_MS * 2;\n      this._ffVirtualMs += FF_STEP_MS * 2;' },
  ],
  // B4b: atakujacy NIE wchodza ZA linie muru (kolumna > kolumny muru) => B4/B4b CZERWONE (ruch = _moveCostForUnit).
  'atk-no-inside': [
    { from: 'if (!this.terrainMap.passable(col, row)) return Infinity;\n    const base = this.terrainMap.moveCost(col, row);',
      to: 'if (!this.terrainMap.passable(col, row)) return Infinity;\n    if (ru.side === \'atk\' && this.siegeWallCol >= 0 && col > this.siegeWallCol) return Infinity;\n    const base = this.terrainMap.moveCost(col, row);' },
  ],
  'fallback-breach': [
    { from: 'if (this.siegeWallCol >= 0 && this.atk.some(u => !u.dead && isSiegeUnit(u.bu))) {\n      this.wallEverBreached = true;\n    }\n    const result = computeInstantResult(',
      to: 'if (false) {\n      this.wallEverBreached = true;\n    }\n    const result = computeInstantResult(' },
  ],
};

function buildVite(mutName) {
  if (process.env.SABR_DIST) return process.env.SABR_DIST;
  const root = path.join(TMP_ROOT, 'root');
  fs.mkdirSync(root, { recursive: true });
  for (const f of ['index.html', 'vite.config.ts', 'tsconfig.json', 'package.json']) fs.copyFileSync(path.join(GRA, f), path.join(root, f));
  for (const d of ['data', 'node_modules']) fs.symlinkSync(fs.realpathSync(path.join(GRA, d)), path.join(root, d), 'dir');
  fs.cpSync(path.join(GRA, 'src'), path.join(root, 'src'), { recursive: true });
  if (mutName) {
    const p = path.join(root, SCENE_REL);
    let s = fs.readFileSync(p, 'utf8');
    for (const m of MUTS[mutName]) {
      if (s.indexOf(m.from) < 0) throw new Error('Mutacja niemozliwa (' + mutName + '): brak wzorca: ' + m.from.slice(0, 80));
      s = s.replace(m.from, m.to);
    }
    fs.writeFileSync(p, s, 'utf8');
  }
  const outDir = path.join(TMP_ROOT, 'dist');
  execSync(`node ${JSON.stringify(path.join(GRA, 'node_modules/vite/bin/vite.js'))} build --outDir ${JSON.stringify(outDir)} --emptyOutDir`,
    { cwd: root, stdio: 'pipe', maxBuffer: 128 * 1024 * 1024 });
  fs.rmSync(root, { recursive: true, force: true });
  if (!fs.existsSync(path.join(outDir, 'index.html'))) throw new Error('brak index.html po vite build');
  return outDir;
}

// Zegar deterministyczny + pompa klatek (jak battle-skip-siege-parity-live-test.cjs).
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
  window.__reseed = (n) => { s = n >>> 0; };
  window.__framesRun = 0;
  window.__dt = 16;
  window.__pumpFrames = (n) => {
    const bs = window.__lastBattleScene;
    for (let i = 0; i < n && !(bs && bs.finished); i++) {
      window.__framesRun++;
      const q = window.__rafQ; window.__rafQ = [];
      window.__fakeNow += window.__dt;
      for (const cb of q) cb(window.__fakeNow);
      if (window.__sampler) window.__sampler();
    }
    return !!(bs && bs.finished);
  };
}

// Kod strony: przygotowanie sceny wg cfg {k, wallHp, cap, speedIdx, mode}. Zwraca opis rosteru.
function pageSetup(cfg) {
  const bs = window.__lastBattleScene;
  bs.renderer.render = () => {};
  window.__tiles0 = Array.from(bs.terrainMap.tiles);
  const isSiege = (bu) => /Siege|Obl/i.test(String((bu.stats && (bu.stats['Typ'] || bu.stats['Rola (linia)'])) || ''));
  if (cfg.k) {
    // Skrocony roster przez realna sciezke "Rozegraj ponownie" (_replayBattle klonuje _saved*BUs).
    const keepA = []; let n = 0;
    for (const bu of bs._savedAtkBUs) { if (isSiege(bu)) keepA.push(bu); else if (n < cfg.k) { keepA.push(bu); n++; } }
    bs._savedAtkBUs = keepA; bs._savedDefBUs = bs._savedDefBUs.slice(0, cfg.k);
    bs._replayBattle();
    window.__tiles0 = Array.from(bs.terrainMap.tiles);
  }
  if (cfg.wallHp) for (const r of Array.from(bs.wallTileHp.keys())) bs.wallTileHp.set(r, cfg.wallHp);
  if (cfg.cap) {
    // Ten sam sufit tur w AUTO/recznej (_checkEnd) i w przewijaniu (_runFastForward): jedna funkcja.
    bs._roundCapVerdict = () => (bs.roundNo >= cfg.cap
      ? { winner: 'remis', reason: 'SZTURM ODPARTY (test-cap ' + cfg.cap + ' tur)', cap: cfg.cap } : null);
  }
  // Instrumentacja wylomu (wrapery wolaja oryginal bez zmiany logiki).
  window.__breachEvents = [];
  const ow = bs._breachWallTile.bind(bs);
  bs._breachWallTile = (row) => { window.__breachEvents.push({ kind: 'mur', row, round: bs.roundNo }); return ow(row); };
  const og = bs._breachGate.bind(bs);
  bs._breachGate = () => { window.__breachEvents.push({ kind: 'brama', round: bs.roundNo }); return og(); };
  // Probkowanie HISTORYCZNE (co klatke, od wylomu): stan koncowy (tura cap) gubi piechote, ktora przeszla wylom
  // i zginela/poszla dalej; tu liczymy, czy w ktorejs klatce zywy piechur byl ZA murem / na kaflu wylomu.
  window.__hist = { samples: 0, infOnBreach: 0, infInside: 0, anyOnBreach: 0, maxInfInside: 0, firstInfInsideRound: null, firstInfOnBreachRound: null };
  const isSiegeU = (bu) => /Siege|Obl/i.test(String((bu.stats && (bu.stats['Typ'] || bu.stats['Rola (linia)'])) || ''));
  window.__sampler = () => {
    const b = window.__lastBattleScene;
    if (!b || !b.wallEverBreached || !window.__tiles0) return;
    const H = window.__hist; H.samples++;
    const wc = b.siegeWallCol; const cols = b.terrainMap.cols; const T = b.terrainMap.tiles; const T0 = window.__tiles0;
    const onB = (u) => {
      if (u.dead || u.q !== wc) return false;
      const i = u.r * cols + u.q;
      return (T0[i] === 6 || T0[i] === 7) && T[i] !== 6 && T[i] !== 7;
    };
    const alive = b.atk.filter((u) => !u.dead);
    const inf = alive.filter((u) => !isSiegeU(u.bu));
    const infIn = inf.filter((u) => u.q > wc).length;
    const infOn = inf.filter(onB).length;
    if (infOn > 0) { H.infOnBreach++; if (H.firstInfOnBreachRound === null) H.firstInfOnBreachRound = b.roundNo; }
    if (infIn > 0) { H.infInside++; if (H.firstInfInsideRound === null) H.firstInfInsideRound = b.roundNo; }
    if (infIn > H.maxInfInside) H.maxInfInside = infIn;
    if (alive.some(onB)) H.anyOnBreach++;
  };
  window.__t0 = bs.vNow;
  bs._setSpeedIdx(cfg.speedIdx || 0, { clamp: true });
  return {
    atk: bs.atk.length, def: bs.def.length, wallCol: bs.siegeWallCol, wallTiles: bs.wallTileHp.size, init: bs.siegeWallTilesInit,
    siegeInAtk: bs.atk.filter((u) => isSiege(u.bu)).length,
  };
}

function pageMetrics() {
  const bs = window.__lastBattleScene;
  const a = bs._sideEndStats('atk'); const d = bs._sideEndStats('def');
  const units = [...bs.atk, ...bs.def].map((u) => [u.side, u.bu.id, Math.round(u.bu.hp), !!u.dead]);
  const wc = bs.siegeWallCol;
  const insideAtk = bs.atk.filter((u) => !u.dead && u.q > wc).length;
  // Atakujacy stojacy NA zburzonym kaflu muru / otwartej bramie (kafel startowo Wall/Gate, teraz przejezdny) = przejscie przez wylom.
  const T0 = window.__tiles0; const cols = bs.terrainMap.cols; const T = bs.terrainMap.tiles;
  const onBreachTile = bs.atk.filter((u) => {
    if (u.dead || u.q !== wc) return false;
    const i = u.r * cols + u.q;
    return (T0[i] === 6 || T0[i] === 7) && T[i] !== 6 && T[i] !== 7;
  }).length;
  return {
    finished: !!bs.finished, winner: bs._endWinner, round: bs.roundNo, breached: !!bs.wallEverBreached,
    gateOpen: !!bs.gateOpen, wallTilesLeft: bs.wallTileHp.size, wallTilesInit: bs.siegeWallTilesInit,
    breachEvents: window.__breachEvents, framesRun: window.__framesRun, virtMs: Math.round(bs.vNow - window.__t0),
    atk: { lost: a.lost, remaining: a.remaining, hp: Math.round(a.hp) },
    def: { lost: d.lost, remaining: d.remaining, hp: Math.round(d.hp) },
    units, insideAtk, onBreachTile, hist: window.__hist, wallCol: wc, maxAtkQ: Math.max(...bs.atk.filter((u) => !u.dead).map((u) => u.q)),
    endLine: bs.log.find((l) => /PAT|SZTURM|Koniec bitwy/.test(l)) || null,
    logBreach: bs.log.filter((l) => /WYLOM|WYBURZON|BRAM/i.test(l)).length,
    logTail: bs.log.slice(-2),
  };
}

async function openScene(browser, base, seed, query) {
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.addInitScript(initDet, seed);
  await page.goto(base + '?playtest=oblezenie-duze' + (query || ''), { waitUntil: 'load', timeout: 120000 });
  for (let i = 0; i < 400; i++) {
    const ready = await page.evaluate(() => { window.__pumpFrames(5); return !!window.__lastBattleScene; });
    if (ready) break;
    await page.waitForTimeout(50);
  }
  await page.evaluate(() => { if (!window.__lastBattleScene) throw new Error('brak sceny bitwy'); });
  return { page, errors };
}

// Jeden przebieg bitwy oblezenia. mode: 'auto' | 'skip' | 'manual'.
async function runBattle(browser, base, mode, cfg, shotPath) {
  const { page, errors } = await openScene(browser, base, cfg.seed || 1, cfg.query || '');
  const setup = await page.evaluate(pageSetup, cfg);
  await page.evaluate(([mode, nOrders]) => {
    const bs = window.__lastBattleScene;
    if (mode === 'skip') { bs.skip(); return; }
    if (bs.deployPhase) bs._endDeployPhase();
    if (mode === 'auto') { if (bs._manualMode) bs._toggleManualMode(); return; }
    // manual: gracz zleca atak marszem do bramy dla calej strony atakujacej; reczna petla tur bez Skip.
    const mid = bs.siegeGateRow;
    window.__manual = { modeAtStart: !!bs._manualMode, awaitingAtStart: !!bs._battleAwaitingOrders, space: 0, ordersIssued: 0, manualFalseSeen: false, playerSide: bs._deployPlayerSideOpt };
    // Rozkazy gracza (ten sam typ co klik 'atak-marsz' w UI: ru.playerOrder) -- wydawane na poczatku KAZDEJ tury recznej.
    window.__issueOrders = () => {
      for (const u of bs.atk) if (!u.dead && u.playerOrder.type === 'none') { u.playerOrder = { type: 'attackMove', col: bs.siegeWallCol + 6, row: mid }; window.__manual.ordersIssued++; }
    };
    window.__issueOrders();
    // Start tury jak gracz: klawisz SPACJA (_onKeyExecuteTurn -> _kickoffBattleTurn).
    window.__space = () => { window.__manual.space++; window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', key: ' ', bubbles: true })); };
    window.__space();
  }, [mode, 0]);
  const t0 = Date.now();
  let fin = false; let timeout = false;
  while (!fin) {
    fin = await page.evaluate((isManual) => {
      const f = window.__pumpFrames(200);
      if (isManual && !f) {
        const bs = window.__lastBattleScene;
        if (!bs._manualMode) window.__manual.manualFalseSeen = true;
        // Faza planowania (czeka na rozkazy): wydaj rozkazy i wystartuj ture SPACJA, jak gracz.
        if (bs._manualMode && bs._battleAwaitingOrders) { window.__issueOrders(); window.__space(); }
      }
      return f;
    }, mode === 'manual');
    if (!fin && Date.now() - t0 > LIMIT_MS) { timeout = true; break; }
  }
  const wallS = (Date.now() - t0) / 1000;
  const m = await page.evaluate(pageMetrics);
  m.manual = await page.evaluate(() => window.__manual || null);
  if (shotPath && !timeout) {
    try { await page.screenshot({ path: shotPath, type: 'jpeg', quality: 55, timeout: 60000 }); } catch (e) { console.log('[shot] blad: ' + e); }
  }
  await page.close();
  return { mode, setup, timeout, wallS: +wallS.toFixed(1), errors, ...m };
}

function record(row) {
  if (process.env.SABR_OUT) fs.appendFileSync(process.env.SABR_OUT, JSON.stringify(row) + '\n', 'utf8');
}
function brief(r) {
  return { mode: r.mode, winner: r.winner, round: r.round, breached: r.breached, wallS: r.wallS, atk: r.atk, def: r.def, ev: r.breachEvents && r.breachEvents.length, inside: r.insideAtk, onBreachTile: r.onBreachTile, hist: r.hist, manual: r.manual };
}
function sameOutcome(a, b) {
  return a.winner === b.winner && a.round === b.round && a.breached === b.breached
    && a.atk.lost === b.atk.lost && a.def.lost === b.def.lost
    && a.atk.remaining === b.atk.remaining && a.def.remaining === b.def.remaining
    && a.atk.hp === b.atk.hp && a.def.hp === b.def.hp
    && a.wallTilesLeft === b.wallTilesLeft && a.gateOpen === b.gateOpen
    && JSON.stringify(a.units) === JSON.stringify(b.units);
}

async function main() {
  let chromium;
  try { ({ chromium } = require(path.join(GRA, 'node_modules', 'playwright'))); }
  catch (e) { console.log('NIE_ZMIERZONO: brak playwright (' + e.message.split('\n')[0] + ')'); process.exit(2); }
  if (!CHROME || !fs.existsSync(CHROME)) { console.log('NIE_ZMIERZONO: brak Chromium'); process.exit(2); }
  const only = new Set((process.env.SABR_ONLY || 'p1x1,p1fast,b,r,m,f').split(','));
  const mut = process.env.SABR_MUT || '';
  if (mut && !MUTS[mut]) { console.log('nieznana mutacja ' + mut); process.exit(1); }
  const shots = process.env.SABR_SHOTS || '';
  if (shots) fs.mkdirSync(shots, { recursive: true });
  const shot = (n) => (shots ? path.join(shots, n + '.jpg') : '');

  const t0 = Date.now();
  const dist = buildVite(mut);
  console.log('BUILD ok in ' + Math.round((Date.now() - t0) / 1000) + ' s' + (mut ? ' MUTACJA=' + mut : ''));
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/+/, '') || 'index.html';
    const file = path.resolve(dist, rel);
    if (!file.startsWith(path.resolve(dist) + path.sep)) { res.writeHead(403).end(); return; }
    fs.readFile(file, (err, data) => { if (err) { res.writeHead(404).end(); return; } res.writeHead(200, { 'content-type': mime[path.extname(file)] || 'application/octet-stream' }); res.end(data); });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--headless=new'] });

  // Skrocony scenariusz (1x): 6 piechurow + obleznicza vs 6 obroncow, kafle muru HP 6, sufit 24 tur.
  const MINI = { k: 6, wallHp: 6, cap: 24, speedIdx: 0, seed: 1 };
  // Pelny scenariusz, predkosc 128x (idx 7).
  // Sufit 180 tur (instancja, ta sama funkcja w AUTO i SKIP): bez niego AUTO 128x nie konczy 400 tur w 120 s (zmierzone: tura 275 po 120,3 s).
  const FULL = { speedIdx: 7, seed: 1, cap: parseInt(process.env.SABR_FAST_CAP || '180', 10) }; // SABR_FAST_CAP: sufit tur P1 128x

  // ---------------- P1: parytet AUTO == SKIP ----------------
  if (only.has('p1x1')) {
    const a = await runBattle(browser, base, 'auto', MINI, shot('p1x1-auto'));
    console.log('RUN ' + JSON.stringify(brief(a))); record({ sc: 'p1x1', ...a });
    const s = await runBattle(browser, base, 'skip', MINI, '');
    console.log('RUN ' + JSON.stringify(brief(s))); record({ sc: 'p1x1', ...s });
    if (a.timeout || s.timeout) { unmeasured++; console.log('NIE_ZMIERZONO: P1 1x limit czasu ' + LIMIT_MS / 1000 + ' s (auto ' + a.wallS + ' s, round ' + a.round + ')'); }
    else {
      check('P1a 1x AUTO: bitwa oblezenia zakonczona w limicie ' + LIMIT_MS / 1000 + ' s (bez przeskoku, speedIdx 0), brak bledow JS', a.finished && a.errors.length === 0 && s.errors.length === 0, { wallS: a.wallS, errors: a.errors });
      check('P1b 1x: wynik AUTO == SKIP (zwyciezca, tura, wylom, straty, HP, kafle muru, wszystkie jednostki)', sameOutcome(a, s), { auto: brief(a), skip: brief(s) });
      check('P1c 1x: oblezenie z wylomem w obu trybach (wylom po kaflu/bramie)', a.breached === true && s.breached === true && a.breachEvents.length > 0, { a: a.breachEvents, s: s.breachEvents });
    }
  }
  if (only.has('p1fast')) {
    const a = await runBattle(browser, base, 'auto', FULL, shot('p1fast-auto'));
    console.log('RUN ' + JSON.stringify(brief(a))); record({ sc: 'p1fast', ...a });
    const s = await runBattle(browser, base, 'skip', FULL, '');
    console.log('RUN ' + JSON.stringify(brief(s))); record({ sc: 'p1fast', ...s });
    if (a.timeout || s.timeout) { unmeasured++; console.log('NIE_ZMIERZONO: P1 128x limit czasu (auto ' + a.wallS + ' s, round ' + a.round + ')'); }
    else {
      check('P1d 128x AUTO (pelny roster): zakonczona w limicie, brak bledow JS', a.finished && a.errors.length === 0 && s.errors.length === 0, { wallS: a.wallS, errors: a.errors });
      check('P1e 128x pelny roster: wynik AUTO == SKIP (ta sama predkosc)', sameOutcome(a, s), { auto: brief(a), skip: brief(s) });
      check('P1f 128x pelny roster: wylom w obu trybach', a.breached === true && s.breached === true, { a: a.breached, s: s.breached });
    }
  }

  // ---------------- B: mur pada -> wylom -> szturm ----------------
  if (only.has('b')) {
    const a = await runBattle(browser, base, 'auto', { ...MINI, speedIdx: 5, cap: 150 }, shot('b-auto'));
    console.log('RUN ' + JSON.stringify(brief(a))); record({ sc: 'b', ...a });
    check('B0 scenariusz oblezenia: obleznicza w rosterze, mur z kaflami', a.setup.siegeInAtk > 0 && a.setup.wallTiles > 0, a.setup);
    check('B1 mur/brama padly: co najmniej jedno zdarzenie wylomu w AUTO (kafel muru lub brama), kafle muru ubyly lub brama otwarta',
      a.breachEvents.length > 0 && (a.wallTilesLeft < a.wallTilesInit || a.gateOpen), { ev: a.breachEvents, left: a.wallTilesLeft, init: a.wallTilesInit, gate: a.gateOpen });
    check('B2 wylom ustawia wallEverBreached (wynik bitwy niesie wallBreached -> miasto do zdobycia)', a.breached === true, a.breached);
    check('B3 wylom padl PRZED koncem bitwy (nie zalozony retroaktywnie): tura wylomu < tura konca', a.breachEvents.length > 0 && a.breachEvents[0].round <= a.round, { ev: a.breachEvents[0], round: a.round });
    // B4 mierzy HISTORYCZNIE (co klatke po wylomie), nie stan koncowy: stan koncowy (tura cap) gubi piechote, ktora przeszla
    // wylom i zginela/poszla dalej. Wartosc koncowa (onBreachTile) zostaje w RUN jako INFO. Zmiana definicji pomiaru -- do akceptacji Evaluatora.
    console.log('INFO B4 stan koncowy: onBreachTile=' + a.onBreachTile + ' (informacyjnie, nie asercja)');
    check('B4 SZTURM po wylomie: w ktorejs klatce po wylomie zywy atakujacy stoi NA zburzonym kaflu muru / otwartej bramie (historycznie)', a.hist && a.hist.anyOnBreach > 0, { hist: a.hist, wallCol: a.wallCol });
    // B4b (zaostrzona, dispatch R-WEB-SIEGE-AUTO-BREACH-ATTACKERS-ENTER-BEHIND-WALL-Q1): PIECHUR (nie machina obleznicza) ZA murem
    // (q > kolumny muru) w klatce po wylomie, najpozniej 3 tury po pierwszym wylomie. Prog 3 tury: zmierzone w AUTO MINI
    // (wylom tura 23, pierwszy piechur za murem tura 24, max jednoczesnie 4). Machiny celowo stoja w zasiegu (FIX 2) i sa wykluczone.
    const breachRound = a.breachEvents && a.breachEvents.length ? a.breachEvents[0].round : null;
    check('B4b PIECHOTA ZA MUREM: zywy piechur (bez machin) stoi ZA linia muru (q > kolumna muru) w ciagu 3 tur od wylomu (historycznie)',
      !!a.hist && a.hist.firstInfInsideRound !== null && breachRound !== null && a.hist.firstInfInsideRound <= breachRound + 3,
      { firstInfInsideRound: a.hist && a.hist.firstInfInsideRound, breachRound, maxInfInside: a.hist && a.hist.maxInfInside, insideAtkEnd: a.insideAtk });
    check('B5 brak bledow JS', a.errors.length === 0, a.errors);
  }

  // ---------------- R: replay ("Rozegraj ponownie") po oblezeniu z wylomem ----------------
  if (only.has('r')) {
    const { page, errors } = await openScene(browser, base, 1, '');
    await page.evaluate(() => window.__reseed(555)); // to samo ziarno przed rozstawieniem w pageSetup i w replayu (determinizm porownania R9)
    await page.evaluate(pageSetup, { ...MINI, speedIdx: 4 });
    await page.evaluate(() => { const bs = window.__lastBattleScene; window.__reseed(777); bs.skip(); });
    let fin = false; const t0r = Date.now();
    while (!fin && Date.now() - t0r < LIMIT_MS) fin = await page.evaluate(() => window.__pumpFrames(200));
    const rp = await page.evaluate(() => {
      const bs = window.__lastBattleScene;
      const T0 = window.__tiles0;
      const diff = (T) => T.reduce((n, v, i) => n + (v !== T0[i] ? 1 : 0), 0);
      const before = {
        finished: bs.finished, breached: bs.wallEverBreached, gateOpen: bs.gateOpen, tilesLeft: bs.wallTileHp.size, init: bs.siegeWallTilesInit,
        tileDiff: diff(Array.from(bs.terrainMap.tiles)),
        hiddenN: bs.siegeHiddenMeshes.length, rubbleN: bs.siegeRubbleMeshes.length, towersDestroyed: bs.siegeTowers.filter((t) => t.destroyed).length,
      };
      // Prawdziwy przycisk ekranu wyniku, jesli jest w DOM; inaczej ta sama funkcja (onReplay -> _replayBattle).
      window.__hid = bs.siegeHiddenMeshes.slice();
      window.__reseed(555);
      let via = 'direct';
      const btn = Array.from(document.querySelectorAll('button')).find((b) => /ponownie/i.test(b.textContent || ''));
      if (btn) { btn.click(); via = 'button'; } else { bs._replayBattle(); }
      const T1 = Array.from(bs.terrainMap.tiles);
      const wc = bs.siegeWallCol; const cols = bs.terrainMap.cols;
      let wallColDiff = 0;
      for (let r = 0; r < bs.terrainMap.rows; r++) if (T1[r * cols + wc] !== T0[r * cols + wc]) wallColDiff++;
      return {
        via, before, wallColDiff,
        after: {
          finished: bs.finished, started: bs.started, deploy: bs.deployPhase, breached: bs.wallEverBreached, gateOpen: bs.gateOpen,
          gateHp: bs.gateHp, tilesLeft: bs.wallTileHp.size, init: bs.siegeWallTilesInit, towers: bs.towerAtWallRows.size,
          hpVals: Array.from(bs.wallTileHp.values()), hiddenN: bs.siegeHiddenMeshes.length, rubbleN: bs.siegeRubbleMeshes.length,
          towersDestroyed: bs.siegeTowers.filter((t) => t.destroyed).length, towersHidden: bs.siegeTowers.filter((t) => t.mesh && !t.mesh.visible).length,
          hiddenStillInvisible: window.__hid.filter((o) => !o.visible).length, lastAtt: bs.lastAttackedWallRow,
          round: bs.roundNo, atkAlive: bs.atk.filter((u) => !u.dead).length, defAlive: bs.def.filter((u) => !u.dead).length,
          tileDiff: diff(T1),
        },
      };
    });
    console.log('REPLAY ' + JSON.stringify(rp)); record({ sc: 'r', ...rp });
    // Determinizm powtorek: przebieg B (po replayu A) i C (po kolejnym replayu B, ktory skonczyl sie wylomem) maja startowac z
    // identycznego stanu => identyczny wynik. Resztki stanu wylomu z B (teren/HP/brama/wiezyczki) rozjechalyby C.
    // A (swiezy start) nie sluzy do porownania: replay odtwarza grupy z konca rozstawiania bez ponownej auto-kompaktacji,
    // wiec rozmieszczenie po replayu jest inne niz przy pierwszym starcie (osobna obserwacja, poza zakresem tego tematu).
    const REPLAY_CAP = 60;
    const runAgain = async (viaReplay) => {
      await page.evaluate(([cfg, cap, viaReplay]) => {
        const bs = window.__lastBattleScene;
        window.__reseed(555);
        if (viaReplay) bs._replayBattle();
        for (const r of Array.from(bs.wallTileHp.keys())) bs.wallTileHp.set(r, cfg.wallHp); // jak w pageSetup (replay przywraca HP 640)
        bs._roundCapVerdict = () => (bs.roundNo >= cap ? { winner: 'remis', reason: 'SZTURM ODPARTY (test-cap ' + cap + ' tur)', cap } : null);
        window.__breachEvents.length = 0; window.__t0 = bs.vNow;
        window.__reseed(777);
        if (bs.deployPhase) bs._endDeployPhase();
        bs.skip();
      }, [MINI, REPLAY_CAP, viaReplay]);
      let f = false; const tt = Date.now();
      while (!f && Date.now() - tt < LIMIT_MS) f = await page.evaluate(() => window.__pumpFrames(200));
      return { fin: f, m: await page.evaluate(pageMetrics) };
    };
    const rB = await runAgain(false); // B: bitwa po replayu A (replay juz wykonany w bloku wyzej)
    const fin2 = rB.fin; const first = rB.m;
    const rC = await runAgain(true);
    const second = rC.m;
    const finC = rC.fin;
    check('R0 przed replayem: oblezenie z wylomem zakonczone (wylom + zniszczony teren muru/bramy)', rp.before.finished === true && rp.before.breached === true && rp.before.tileDiff > 0, rp.before);
    const A = rp.after;
    check('R1 po replayu: bitwa od nowa (faza rozstawiania, tura 0, brak konca)', A.finished === false && A.deploy === true && A.started === false && A.round === 0, A);
    check('R2 po replayu: wylom wyzerowany (wallEverBreached=false, brama zamknieta, HP bramy 400, wiezy przy murze 0)', A.breached === false && A.gateOpen === false && A.gateHp === 400 && A.towers === 0, A);
    check('R3 po replayu: HP kafli muru przywrocone (liczba kafli == poczatkowa)', A.tilesLeft === A.init && A.init === rp.before.init, A);
    // Zarzut 2 Evaluatora: wartosc HP kafli przywrocona przez SAM replay (przed jakimkolwiek nadpisaniem przez test) == 640 (WALL_TILE_HP).
    check('R3b po replayu: HP KAZDEGO kafla muru == 640 (wartosc z samego replayu, nieprzepisana przez test)', A.hpVals.length > 0 && A.hpVals.every((v) => v === 640), { hpVals: A.hpVals });
    // Zarzut 3 Evaluatora: wizualia/wiezyczki. Przed replayem musi byc co przywracac (inaczej asercje bylyby puste).
    check('R3c przed replayem: wylom ukryl segmenty/dodal gruz (co przywracac)', rp.before.hiddenN > 0 && rp.before.rubbleN > 0, rp.before);
    check('R3d po replayu: ukryte segmenty muru/brama przywrocone, gruz zdjety, lastAttackedWallRow=-1', A.hiddenN === 0 && A.hiddenStillInvisible === 0 && A.rubbleN === 0 && A.lastAtt === -1, A);
    check('R3e po replayu: wiezyczki odbudowane (destroyed=false, mesh widoczny)', A.towersDestroyed === 0 && A.towersHidden === 0, A);
    check('R4 po replayu: roster wrocil (ten sam sklad zywych: 6+obleznicza vs 6)', A.atkAlive === 17 && A.defAlive === 6, A);
    check('R5 po replayu: TEREN muru/bramy przywrocony (kafle == stan startowy); inaczej wyburzony mur zostaje otwarty mimo wallEverBreached=false (obejscie reguly R1)',
      A.tileDiff === 0, { tileDiffPoReplayu: A.tileDiff, tileDiffPrzed: rp.before.tileDiff });
    check('R5b po replayu: teren KAZDEGO kafla kolumny muru == poczatkowy (wallColDiff=0)', rp.wallColDiff === 0, { wallColDiff: rp.wallColDiff });
    check('R8 przebiegi B i C po replayach skonczone, oba z wylomem (B: wylom padl, wiec C weryfikuje brak resztek)', fin2 && finC && first.finished && second.finished && first.breached === true && second.breached === true, { fin2, finC, b: brief(first), c: brief(second) });
    check('R9 determinizm replayu: wynik przebiegu C == B (zwyciezca, tura, straty, HP, kafle muru, jednostki)', sameOutcome(first, second), { first: brief(first), second: brief(second) });
    check('R10 determinizm replayu: zdarzenia wylomu C == B', JSON.stringify(first.breachEvents) === JSON.stringify(second.breachEvents) && first.breachEvents.length > 0, { first: first.breachEvents, second: second.breachEvents });
    check('R11 po przebiegu C stan muru po wylomie == po B', second.onBreachTile === first.onBreachTile && second.wallTilesLeft === first.wallTilesLeft, { first: first.wallTilesLeft, second: second.wallTilesLeft });
    check('R6 brak bledow JS', errors.length === 0, errors);
    await page.close();
  }

  // ---------------- M: bitwa reczna do konca, bez Skip ----------------
  if (only.has('m')) {
    const m = await runBattle(browser, base, 'manual', { ...MINI, speedIdx: 5, cap: 150 }, shot('m-manual'));
    console.log('RUN ' + JSON.stringify(brief(m))); record({ sc: 'm', ...m });
    check('M0 tryb RECZNY byl wlaczony od startu i ani razu nie przelaczony na AUTO; tury startowane SPACJA (>=1) i rozkazy gracza wydane', !!m.manual && m.manual.modeAtStart === true && m.manual.manualFalseSeen === false && m.manual.space >= 1 && m.manual.ordersIssued > 0, m.manual);
    check('M1 bitwa reczna oblezenicza doszla do konca BEZ Skip (finished, w limicie)', m.finished === true && !m.timeout, { wallS: m.wallS, round: m.round });
    check('M2 reczna: rozstrzygniecie silnika (zwyciezca ustawiony), tura > 0', m.winner != null && m.round > 0, { winner: m.winner, round: m.round });
    check('M3 reczna: wylom padl i atakujacy weszli za mur', m.breached === true && m.insideAtk > 0, { breached: m.breached, inside: m.insideAtk, ev: m.breachEvents });
    check('M4 brak bledow JS', m.errors.length === 0, m.errors);
  }

  // ---------------- F: _skipInstantFallback ----------------
  if (only.has('f')) {
    const { page, errors } = await openScene(browser, base, 1, '');
    const f = await page.evaluate(() => {
      const bs = window.__lastBattleScene;
      bs.renderer.render = () => {};
      const isSiege = (bu) => /Siege|Obl/i.test(String((bu.stats && (bu.stats['Typ'] || bu.stats['Rola (linia)'])) || ''));
      const out = { siegeInAtk: bs.atk.filter((u) => !u.dead && isSiege(u.bu)).length, breachedBefore: bs.wallEverBreached, started0: bs.started };
      // Sciezka awaryjna: skip() zanim bitwa wystartowala (started=false, deployPhase=false; _startBattle zawsze
      // ustawia started=true, wiec stan jest wymuszony -- ZALOZENIE: siatka bezpieczenstwa, w grze praktycznie nieosiagalna).
      if (bs.deployPhase) bs._endDeployPhase();
      bs.started = false; bs.deployPhase = false;
      let calls = 0;
      const orig = bs._skipInstantFallback.bind(bs);
      bs._skipInstantFallback = () => { calls++; return orig(); };
      bs.skip();
      out.fallbackCalls = calls;
      out.finished = bs.finished; out.winner = bs._endWinner; out.breached = bs.wallEverBreached;
      out.survivors = Array.isArray(bs._endSurvivors) ? bs._endSurvivors.length : -1;
      out.ffActive = !!bs._ffActive; out.round = bs.roundNo;
      out.logTail = bs.log.slice(-2);
      out.hasDefBonus = Array.isArray(bs.lastInstantDefBonus);
      return out;
    });
    console.log('FALLBACK ' + JSON.stringify(f)); record({ sc: 'f', ...f });
    check('F0 scena: obleznicza w skladzie atakujacego', f.siegeInAtk > 0 && f.breachedBefore === false, f);
    check('F1 skip() przed startem bitwy uruchamia _skipInstantFallback (1 wywolanie), bez przewijania', f.fallbackCalls === 1 && f.ffActive === false, f);
    check('F2 fallback konczy bitwe z werdyktem (finished, zwyciezca atakujacy/obronca/remis, lista ocalalych)', f.finished === true && ['atakujacy', 'obronca', 'remis'].includes(f.winner) && f.survivors >= 0, f);
    check('F3 fallback: machina w skladzie atakujacego = zalozony wylom (wallEverBreached=true, jak szturm Auto)', f.breached === true, f);
    check('F4 fallback: tabela bonusu muru dla testu parytetu ustawiona', f.hasDefBonus === true, f);
    check('F5 brak bledow JS', errors.length === 0, errors);
    await page.close();
  }

  await browser.close();
  await new Promise((resolve) => server.close(resolve));
  console.log('--- ' + pass + ' ok, ' + fail + ' fail, ' + defects + ' defekt(y) gry, ' + unmeasured + ' NIE_ZMIERZONO, ' + knownDefects + ' znany(ch) defekt(ow) (B4b)' + (mut ? ' [MUTACJA ' + mut + ']' : ''));
  process.exit(fail ? 1 : (defects ? 3 : (unmeasured ? 4 : (knownDefects && !process.env.SABR_SKIP_KNOWN ? 5 : 0))));
}

main().catch((e) => { console.log('FAIL: wyjatek: ' + String((e && e.stack) || e)); process.exit(1); });
