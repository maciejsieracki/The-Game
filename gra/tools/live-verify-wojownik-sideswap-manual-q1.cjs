'use strict';
/**
 * R-WEB-TEST-HOOK-ADDUNIT-TYPE-SELECT-Q1 -- runda 4 (pomiar Wojownik vs Wojownik 10 vs 10 ŚCIEŻKĄ MAPOWĄ).
 *
 * Nie używa presetu bitwy (?playtest=bitwa-duza) ani przycinania sceny ani przepisywania statystyk.
 * Realna sciezka: ?playtest=mapa&civTest=1&civSeed=<N> -> __civTest.addUnit(owner,q,r,false,'Wojownik') x10 po obu
 * stronach (atakujacy: gracz ME=0, obronca: barbarzynca -1) -> klik na heks gracza (zaznaczenie) -> klik na heks wroga
 * (atak z mapy = okno przed bitwa .pb-overlay) -> przycisk "Wejdz na pole" (data-act=deploy) -> scena bitwy.
 * Scena startuje sama (AUTO, bez paska wdrozenia). Tryb:
 *   - auto: naturalny start sceny, bez zadnego klikniecia (klawisz R nie jest uzywany);
 *   - skip: klik w przycisk "Pomin do wyniku" (button[title="Pomin do wyniku"], battleScene.ts ~3411);
 *   - manual: wymaga generala gracza (bramka _manualCommanderGate, battleScene.ts ~3662). Na tej sciezce
 *     stos Wojownikow nie ma generala -> scena zostaje w AUTO; driver zapisuje to jako BLOCK (bez petli rozkazow).
 *
 * Ziarno: `civSeed` (URL, tylko przy civTest=1) ustawia _gameSeed -> gameStreamRng dla walki (main.ts battleCombatRng).
 * Math.random (initDet) NIE steruje walka taktyczna; initDet zostaje dla zegara/animacji.
 *
 * Kontrola zamiany stron (rola 'def'): barbarzynca (AI) z 10 Wojownikami obok stosu gracza; zamiast klikniecia
 * wykonujemy __civTest.endTurn i czekamy na atak AI (okno z rola "Obrońca -- Ty"). Jesli AI zaatakuje inna bitwe
 * albo nie zaatakuje -> NIE ZMIERZONO (zapis w error).
 *
 * Dowod haka w runtime: probe odczytuje z rosteru sceny (bu.nazwa, bu.hp, bu.maxHp) typ wstawionych jednostek.
 * Pole typeId nie istnieje w obiekcie sceny (zapisywane jako null); typ identyfikuje nazwa z units.json.
 *
 * R-WEB-TEST-HOOK-WARRIOR-SIDESWAP-MANUAL-MEASURE-Q1 (wariant rozszerzony; oryginal bez zmian):
 *   - rola 'swap': gracz klika jak 'atk' (okno przed bitwa), ale PRZED wejsciem na pole __civTest.setSwapSides(true)
 *     zamienia role stron sceny (gracz = obronca, barbarzynca = atakujacy). Nie jest to ataK AI na mapie (NIE ZMIERZONO).
 *   - tryb 'manual': __civTest.setGeneral(ME,q,r) ustawia generala na stosie gracza (bramka _manualCommanderGate);
 *     sterownik w petli wydaje rozkaz 'attack' najblizszemu wrogowi (_executeUnitsImmediate) gdy scena czeka na rozkazy.
 * Usage: node tools/live-verify-wojownik-sideswap-manual-q1.cjs <dist-dir> <out.json> [limitSekund]
 * Zmienne: W_ROLES=atk,def  W3_MODES=manual,auto,skip  W_SEEDS=1,2,3  W3_CHROMIUM=/usr/bin/chromium
 */
const fs = require('fs');
const path = require('path');
const http = require('http');

const DIST = process.argv[2];
const OUT = process.argv[3];
const LIMIT_S = Number(process.argv[4] || 1500);
if (!DIST || !OUT) throw new Error('usage: node live-verify-wojownik-map-q1.cjs <dist-dir> <out.json> [limitSekund]');
const CHROME = process.env.W3_CHROMIUM || (require('./_chrome-path.cjs').resolveChromePath() || '/usr/bin/chromium');
const { chromium } = require('playwright');

const UNITS = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'units.json'), 'utf8'));
const TYPE = 'Wojownik';
const TYPE_ROW = UNITS.find((u) => u['Jednostka'] === TYPE);
if (!TYPE_ROW) throw new Error('brak wiersza Wojownik w data/units.json');
const ME = 0;
const BARB = -1;
const N = 10;
const ROLES = (process.env.W_ROLES || 'atk,def').split(',');
const SEEDS = (process.env.W_SEEDS || '1,2,3').split(',').map(Number);
const MODES = (process.env.W3_MODES || 'manual,auto,skip').split(',');
const CONFIGS = [];
for (const role of ROLES) for (const sd of SEEDS) CONFIGS.push({ id: `${role}-s${sd}`, role, seed: sd });

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

// Zegar deterministyczny (ten sam kod co live-verify-w3-manual-orders-r3.cjs).
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

const NBRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];

/** Ustawia stos gracza (atakujacy lub obronca) i stos barbarzyncy na sasiednim heksie. */
async function setupStacks(page, cfg) {
  const info = { hexPlayer: null, hexEnemy: null, playerIds: [], enemyIds: [], spawnErrors: [] };
  const hex = await page.evaluate(() => window.__frozenTestDebug.freeLandHex());
  if (!hex) throw new Error('brak wolnego heksu ladu');
  info.hexPlayer = { q: hex.q, r: hex.r };
  // Stos wroga: pierwszy sasiad, na ktorym addUnit zwroci id.
  let enemyHex = null;
  for (const [dq, dr] of NBRS) {
    const q = hex.q + dq; const r = hex.r + dr;
    const id = await page.evaluate(([o, qq, rr, t]) => window.__civTest.addUnit(o, qq, rr, false, t), [BARB, q, r, TYPE]);
    if (id) { enemyHex = { q, r }; info.enemyIds.push(id); break; }
  }
  if (!enemyHex) throw new Error('nie udalo sie postawic wroga');
  info.hexEnemy = enemyHex;
  for (let i = 1; i < N; i++) {
    const id = await page.evaluate(([o, qq, rr, t]) => window.__civTest.addUnit(o, qq, rr, false, t), [BARB, enemyHex.q, enemyHex.r, TYPE]);
    if (id) info.enemyIds.push(id); else info.spawnErrors.push('enemy#' + i);
  }
  for (let i = 0; i < N; i++) {
    const id = await page.evaluate(([o, qq, rr, t]) => window.__civTest.addUnit(o, qq, rr, false, t), [ME, hex.q, hex.r, TYPE]);
    if (id) info.playerIds.push(id); else info.spawnErrors.push('player#' + i);
  }
  info.unitsAtPlayerHex = await page.evaluate(([q, r]) => window.__frozenTestDebug.unitsAt(q, r), [hex.q, hex.r]);
  info.unitsAtEnemyHex = await page.evaluate(([q, r]) => window.__frozenTestDebug.unitsAt(q, r), [enemyHex.q, enemyHex.r]);
  return info;
}

/** Odczyt okna przed bitwa z DOM: rola gracza (Atakujacy/Obronca -- Ty), liczba jednostek na stronach. */
async function readPreBattle(page) {
  return page.evaluate(() => {
    const ov = document.querySelector('.pb-overlay');
    if (!ov) return { open: false };
    const you = ov.querySelector('.pb-cmd.pb-you');
    const foe = ov.querySelector('.pb-cmd.pb-foe');
    const rosters = Array.from(ov.querySelectorAll('.pb-roster'));
    return {
      open: true,
      youRole: you ? (you.innerText || '').split('\n').slice(0, 2).join(' | ').slice(0, 120) : null,
      foeRole: foe ? (foe.innerText || '').split('\n').slice(0, 2).join(' | ').slice(0, 120) : null,
      playerIsAtk: !!you && /Atakuj/.test(you.innerText || ''),
      rosterShown: rosters.map((r) => ({ cls: String(r.className).slice(0, 40), shown: r.querySelectorAll('.pb-uc').length, more: (r.querySelector('.pb-more') || { textContent: '' }).textContent.trim() || null })),
      deployBtn: !!ov.querySelector('[data-act="deploy"]'),
    };
  });
}

/** Tryb reczny: gdy scena czeka na rozkazy, kazda jednostka gracza dostaje 'attack' najblizszego wroga. */
async function manualStep(page, actions) {
  const s = await page.evaluate(() => {
    const bs = window.__lastBattleScene;
    if (!bs || bs.finished) return { skip: true, fin: !!(bs && bs.finished) };
    if (!bs._battleAwaitingOrders) return { skip: true, aw: false, round: bs.roundNo };
    const mine = bs._playerRoster().filter((u) => !u.dead && !u.removed && !u.routed);
    const foes = bs._enemyRoster().filter((u) => !u.dead && !u.removed && !u.routed);
    if (!mine.length || !foes.length) return { skip: true, aw: true, round: bs.roundNo, mine: mine.length, foes: foes.length };
    const ids = [];
    for (const u of mine) {
      let best = null; let bd = 1e9;
      for (const f of foes) { const d = Math.hypot(f.q - u.q, f.r - u.r); if (d < bd) { bd = d; best = f; } }
      u.playerOrder = { type: 'attack', targetId: best.id };
      ids.push(u.id);
    }
    bs._kickoffBattleTurn(); // SPACJA: rozpoczyna ture z ustawionymi rozkazami (ta sama sciezka co klawisz)
    return { skip: false, aw: true, round: bs.roundNo, n: ids.length, ids: ids.length };
  });
  if (!s.skip) actions.orderRounds++;
  return s;
}

const T0 = Date.now();
const log = (m) => process.stderr.write(`[${((Date.now() - T0) / 1000).toFixed(1)}s] ${m}\n`);

async function runOne(browser, base, cfg, mode) {
  log('start ' + cfg.id + '|' + mode);
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.addInitScript(initDet, cfg.seed);
  await page.goto(base + '/?playtest=mapa&civTest=1&civSeed=' + cfg.seed, { waitUntil: 'load', timeout: 180000 });
  // Ladowanie mapy idzie przez requestAnimationFrame, ktore initDet kolejkuje: pompujemy klatki w petli.
  let loaded = false;
  for (let i = 0; i < 2400 && !loaded; i++) {
    loaded = await page.evaluate(() => {
      if (window.__pumpFrames) window.__pumpFrames(5);
      return !!(window.__frozenTestDebug && window.__civTest && window.__eraTestDebug && window.__civSetHitMode
        && window.__eraTestDebug.getWorldState().citiesLen > 0);
    });
    if (!loaded) await page.waitForTimeout(100);
  }
  if (!loaded) throw new Error('mapa nie zaladowala sie (timeout 240 s)');
  const steps = { cfg, mode, errors };
  steps.suppressVictory = await page.evaluate(() => {
    const t = window.__truceTestDebug;
    if (t && typeof t.suppressVictoryForTest === 'function') { t.suppressVictoryForTest(); return true; }
    return false;
  });
  await page.evaluate((h) => window.__civSetHitMode(h), process.env.W_HIT || 'losowe');
  await page.evaluate(([me, b]) => window.__civTest.setWar(me, b), [ME, BARB]);
  log('mapa gotowa');
  const st = await setupStacks(page, cfg);
  log('stosy ustawione');
  steps.stacks = { hexPlayer: st.hexPlayer, hexEnemy: st.hexEnemy, playerIds: st.playerIds.length, enemyIds: st.enemyIds.length, spawnErrors: st.spawnErrors,
    unitsAtPlayerHex: st.unitsAtPlayerHex.length, unitsAtEnemyHex: st.unitsAtEnemyHex.length };
  // Probe haka: typ wstawionych jednostek z tablicy units mapy (typeId + owner).
  steps.probeMapUnits = st.unitsAtPlayerHex.concat(st.unitsAtEnemyHex).map((u) => ({ owner: u.ownerId, inGarnizon: u.inGarnizon }));
  if (mode === 'manual') steps.generalSet = await page.evaluate(([me, q, r]) => window.__civTest.setGeneral(me, q, r), [ME, st.hexPlayer.q, st.hexPlayer.r]);
  if (cfg.role === 'swap') steps.swapSet = await page.evaluate(() => { window.__civTest.setSwapSides(true); return true; });
  await page.waitForTimeout(400);

  if (cfg.role !== 'def') {
    // Gracz atakuje: zaznacz jednostke gracza, kliknij wroga.
    await page.evaluate(([q, r]) => window.__frozenTestDebug.focus(q, r), [st.hexPlayer.q, st.hexPlayer.r]);
    await page.waitForTimeout(300);
    const pos = await page.evaluate(([q, r]) => window.__frozenTestDebug.screenOf(q, r), [st.hexPlayer.q, st.hexPlayer.r]);
    await page.mouse.click(pos.x, pos.y);
    await page.waitForTimeout(400);
    steps.selectedByClick = await page.evaluate(() => window.__frozenTestDebug.selectedId());
    if (!steps.selectedByClick) {
      await page.evaluate((id) => window.__frozenTestDebug.select(id), st.playerIds[0]);
      steps.selectionMethod = 'hak-select';
    } else steps.selectionMethod = 'klik';
    await page.evaluate(() => { window.__mapCbs = window.__rafQ.slice(); });
    await page.evaluate(([q, r]) => window.__frozenTestDebug.focus(q, r), [st.hexEnemy.q, st.hexEnemy.r]);
    await page.waitForTimeout(300);
    const epos = await page.evaluate(([q, r]) => window.__frozenTestDebug.screenOf(q, r), [st.hexEnemy.q, st.hexEnemy.r]);
    await page.mouse.click(epos.x, epos.y);
  } else {
    // Gracz broni sie: barbarzynca (AI) atakuje stos gracza po zakonczeniu tury.
    steps.selectionMethod = 'brak-klikniecia (obrona)';
    await page.evaluate(() => { window.__mapCbs = window.__rafQ.slice(); });
    await page.evaluate(() => window.__civTest.endTurn());
    // Bez renderowania mapy: usuwamy callbacki mapy z kolejki, zostaja logika tury i AI.
    await page.evaluate(() => { const before = window.__mapCbs || []; window.__rafQ = window.__rafQ.filter(cb => !before.includes(cb)); });
  }
  // Czekamy na okno przed bitwa (atak z mapy / atak AI).
  let pb = { open: false };
  for (let i = 0; i < 150 && !pb.open; i++) {
    await page.waitForTimeout(50);
    await page.evaluate(() => { if (window.__pumpFrames) window.__pumpFrames(20); });
    pb = await readPreBattle(page);
  }
  steps.preBattle = pb;
  if (!pb.open) { await page.close(); return { ...steps, error: 'brak okna przed bitwa (' + (cfg.role === 'def' ? 'AI nie zaatakowal' : 'klik nie uruchomil bitwy') + ')' }; }
  log('okno przed bitwa otwarte');
  await page.click('.pb-overlay [data-act="deploy"]', { timeout: 30000 });
  log('klik wejscie na pole');
  // Wstrzymanie renderowania MAPY na czas bitwy (koszt klatki): usuwamy z kolejki callbacki zarejestrowane przed bitwa.
  steps.mapCallbacksDropped = await page.evaluate(() => { const before = window.__mapCbs || []; const n0 = window.__rafQ.length; window.__rafQ = window.__rafQ.filter(cb => !before.includes(cb)); window.__mapCbs = null; return n0 - window.__rafQ.length; });
  // Stan sceny tuz po wejsciu na pole (bez pompowania klatek).
  steps.afterDeployClick = await page.evaluate(() => { const bs = window.__lastBattleScene; return bs ? { deployMode: !!bs._deployMode, deployPhase: !!bs.deployPhase, manual: !!bs._manualMode, manualCommanderGate: !!bs._manualCommanderGate, awaitingOrders: !!bs._battleAwaitingOrders, roundNo: bs.roundNo, toolbarStart: !!document.getElementById('deploy-toolbar-start'), atk: bs.atk.length, def: bs.def.length, playerHasCommander: bs.atk.some(u => u.isArmyCommander && !u.dead && !u.routed) } : null; });
  log('stan po kliku ' + JSON.stringify(steps.afterDeployClick));
  // Render sceny bitwy wylaczony (jak w r3): liczy sie logika walki, nie rysowanie. Dowod haka: probe z rosteru sceny.
  await page.evaluate(() => { const bs = window.__lastBattleScene; bs.renderer.render = () => {}; window.__dt = 16; });
  steps.probe = await page.evaluate(() => {
    const bs = window.__lastBattleScene;
    const pick = (u) => ({ nazwa: u.bu.nazwa, hp: u.bu.hp, maxHp: u.bu.maxHp, kategoria: u.bu.kategoria ?? u.bu.category ?? null, typeId: u.bu.typeId ?? null });
    const cnt = (arr) => arr.reduce((m, u) => { m[u.bu.nazwa] = (m[u.bu.nazwa] || 0) + 1; return m; }, {});
    // Statystyki polem po polu (zarzut Evaluatora #3): bu.stats z units.json dla KAZDEJ jednostki obu stron.
    const FIELDS = ['Jednostka', 'health', 'meleeAttack', 'meleeDefence', 'weaponDamage', 'piercing', 'armor', 'Atak', 'Obrona', 'Uderzenie', 'Pancerz', 'Przebicie', 'Morale bazowe', 'Morale ucieczki', 'Próg dezercji (% health)', 'Ruch w bitwie (heksy)', 'Rola (linia)'];
    const st = (u) => { const s = (u.bu && u.bu.stats) || {}; const o = {}; for (const f of FIELDS) o[f] = s[f] === undefined ? null : s[f]; return o; };
    return { atkCount: bs.atk.length, defCount: bs.def.length, atkNames: cnt(bs.atk), defNames: cnt(bs.def), sampleAtk: bs.atk.slice(0, 1).map(pick), sampleDef: bs.def.slice(0, 1).map(pick), statsAtk: bs.atk.map(st), statsDef: bs.def.map(st) };
  });
  log('probe ' + JSON.stringify(steps.probe).slice(0, 300));
  // Kontrola zamiany stron: AI moglo zaatakowac INNA pare (np. Grecy-Rzymianie). Bez stosow Wojownik wynik NIE jest pomiarem.
  if (cfg.role === 'swap' && !(steps.probe.atkNames.Wojownik && steps.probe.defNames.Wojownik)) {
    await page.close();
    return { ...steps, error: 'NIE ZMIERZONO (zamiana stron): okno przed bitwa to inna para, nie stos Wojownikow; atk=' + JSON.stringify(steps.probe.atkNames) + ' def=' + JSON.stringify(steps.probe.defNames) };
  }
  steps.toolbarFound = steps.afterDeployClick ? steps.afterDeployClick.toolbarStart : false;
  if (mode === 'manual' && !(steps.afterDeployClick && steps.afterDeployClick.manual)) {
    // BLOCK (udokumentowany): tryb reczny z rozkazami niedostepny na sciezce mapowej bez dowodcy armii (bramka sceny).
    const probe0 = await page.evaluate(() => { const bs = window.__lastBattleScene; return { manual: !!bs._manualMode, roundNo: bs.roundNo, finished: !!bs.finished }; });
    await page.close();
    return { ...steps, probeAfterBlock: probe0, error: 'BLOCK: tryb reczny niedostepny (manual=false, bramka=true, dowodca gracza=false): scena startuje w AUTO' };
  }
  // Scena startuje od razu (bez paska wdrozenia): AUTO = naturalny start sceny, SKIP = przycisk Pomin.
  const start = await page.evaluate(() => {
    const bs = window.__lastBattleScene;
    const a = bs._sideEndStats('atk'); const d = bs._sideEndStats('def');
    return { atkTotal: a.total, defTotal: d.total, atkHp: Math.round(a.hp), defHp: Math.round(d.hp), deployPhase: !!bs.deployPhase };
  });
  const actions = { startClick: false, spacePresses: 0, rToggle: false, skipClick: false, ordersIssued: 0, orderRounds: 0, perRound: [] };
  if (mode === 'skip') {
    await page.evaluate(() => window.__pumpFrames(10));
    // Klik w realny przycisk UI (title="Pomin do wyniku", battleScene.ts ~3411). Brak przycisku = jawny fallback.
    const skipBtn = page.locator('button[title="Pomin do wyniku"]').first();
    if (await skipBtn.count()) { await skipBtn.click({ timeout: 30000 }); actions.skipClick = 'klik-ui'; }
    else { await page.evaluate(() => window.__lastBattleScene.skip()); actions.skipClick = 'fallback-metoda (BRAK przycisku UI)'; }
  } else if (mode === 'manual') {
    if (steps.afterDeployClick && steps.afterDeployClick.deployPhase) {
      await page.click('#deploy-toolbar-start', { timeout: 30000 });
      actions.startClick = 'deploy-toolbar-start';
    }
    await page.evaluate(() => window.__lastBattleScene._setSpeedIdx(3, { clamp: true }));
  } else {
    await page.evaluate(() => window.__lastBattleScene._setSpeedIdx(3, { clamp: true }));
  }
  const t0 = Date.now();
  let fin = false;
  while (!fin) {
    const tp = Date.now();
    if (mode === 'manual') {
      const ms = await manualStep(page, actions);
      if (ms.fin) break;
    }
    fin = await page.evaluate(() => window.__pumpFrames(60));
    const pinfo = await page.evaluate(() => ({ fr: window.__framesRun, round: window.__lastBattleScene.roundNo, rafQ: window.__rafQ.length, aw: !!window.__lastBattleScene._battleAwaitingOrders }));
    log('pump60 ms=' + (Date.now() - tp) + ' ' + JSON.stringify(pinfo));
    if (Date.now() - t0 > 420000) throw new Error('timeout bitwy ' + mode);
  }
  const res = await page.evaluate(() => {
    const bs = window.__lastBattleScene;
    const side = (arr) => {
      const total = arr.length;
      const eliminated = arr.filter((u) => u.dead).length;
      const fled = arr.filter((u) => !u.dead && u.routed).length;
      const remaining = arr.filter((u) => !u.dead && !u.routed).length;
      return { total, eliminated, fled, remaining };
    };
    return {
      winner: bs._endWinner ?? null, round: bs.roundNo,
      atk: side(bs.atk), def: side(bs.def),
      endLogTail: (bs.log || []).slice(-3).map((x) => String(typeof x === 'string' ? x : JSON.stringify(x)).slice(0, 160)),
      // Ucieczki i pościgi z PELNEGO logu (log nie rozróżnia stron; liczby dla obu stron razem).
      logRouted: (bs.log || []).filter((x) => String(typeof x === 'string' ? x : JSON.stringify(x)).includes('uciekl z pola bitwy')).length,
      logPursued: (bs.log || []).filter((x) => String(typeof x === 'string' ? x : JSON.stringify(x)).includes('dogoniony i zniszczony')).length,
    };
  });
  await page.close();
  return { ...steps, start, actions, res };
}

(async () => {
  const srv = await serve();
  const base = 'http://127.0.0.1:' + srv.address().port;
  const out = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : { runs: {}, meta: { chromium: CHROME, dist: DIST, runda: 4, path: 'playtest=mapa + __civTest.addUnit(typeId=Wojownik) x10 vs x10, bez presetu i bez przepisywania statystyk' } };
  const browser = await chromium.launch({ headless: true, executablePath: CHROME, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const t0 = Date.now();
  try {
    for (const cfg of CONFIGS) {
      for (const mode of MODES) {
        const key = cfg.id + '|' + mode;
        if (out.runs[key] && !out.runs[key].error) continue;
        if ((Date.now() - t0) / 1000 > LIMIT_S) break;
        try {
          out.runs[key] = await runOne(browser, base, cfg, mode);
        } catch (e) {
          out.runs[key] = { cfg, mode, error: String(e && e.message || e) };
        }
        fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
        const r = out.runs[key];
        console.log('DONE', key, JSON.stringify(r.res || r.error));
      }
    }
  } finally {
    await browser.close();
    srv.close();
  }
  const left = CONFIGS.flatMap((c) => MODES.map((m) => c.id + '|' + m)).filter((k) => !out.runs[k] || out.runs[k].error);
  console.log('LEFT', left.length, left.join(','));
})();
