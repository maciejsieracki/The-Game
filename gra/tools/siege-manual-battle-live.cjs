'use strict';
/**
 * siege-manual-battle-live.cjs -- harness ZYWY (Chromium + prawdziwa BattleScene) dla
 * R-WEB-SIEGE-MANUAL-BATTLE-BEHAVIOR-Q1: zachowanie jednostek w RECZNEJ bitwie oblezniczej
 * (tarany -> brama, wieza -> wejscie na mur, szarza/atakuj-marszem poza zasiegiem ostrzalu,
 * konnica z boku az do wylomu bramy).
 *
 * Usage (z gra/): node tools/siege-manual-battle-live.cjs <distDir> <outJson> [--shots <dir>] [--only <nazwa>]
 *   distDir : bundle `vite build --outDir` POZA repo (np. /dev/shm/...). BEZ `npm run build`.
 * Determinizm: Math.random() podmieniony na mulberry32(seed) przed startem strony;
 *   ruch/AI bitwy nie zalezy od zegara scianowego (zegar wirtualny speedMul).
 * Kazdy scenariusz: `?playtest=oblezenie-duze&fort=<mury|palisada>&bare=1&rams=N&towers=M`,
 *   rozkazy gracza (strona atakujaca, tryb RECZNY) + N rund; metryki z prawdziwego stanu sceny.
 * Wynik: JSON {name, pass, checks[], metrics} na scenariusz + podsumowanie na stdout.
 */
const path = require('path');
const fs = require('fs');
const { chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'));

const argv = process.argv.slice(2);
const dist = argv[0];
const outJson = argv[1];
const shotsIdx = argv.indexOf('--shots');
const shotsDir = shotsIdx >= 0 ? argv[shotsIdx + 1] : null;
const onlyIdx = argv.indexOf('--only');
const only = onlyIdx >= 0 ? argv[onlyIdx + 1] : null;

const SEED_SCRIPT = `(() => { let s = 123456789; Math.random = function () { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();`;

// Funkcje wstrzykiwane do strony.
const PAGE_LIB = `
window.__H = {
  kind(u) {
    const n = String(u.bu.nazwa || '').toLowerCase();
    if (n.includes('battering')) return 'ram';
    if (n.includes('siege tower')) return 'tower';
    if (n.includes('catapult')) return 'cata';
    if (u.mounted) return 'cav';
    if (u.rangedBase) return 'arch';
    return 'inf';
  },
  // Strefa ostrzalu obroncow: [{q,r,range}] -- lucznicy (zasieg x2 na koronie) + wiezyczki muru.
  threats(bs) {
    const out = [];
    for (const d of bs.def) {
      if (d.dead || d.fadingOut || d.removed || d.routed) continue;
      if (!d.rangedBase || d.rangeBase <= 0) continue;
      bs._applyTerrainRange(d);
      out.push({ q: d.q, r: d.r, range: d.range, src: 'unit' });
    }
    for (const t of (bs.siegeTowers || [])) {
      if (t.destroyed) continue;
      out.push({ q: bs.siegeWallCol, r: t.row, range: bs.towerRange, src: 'turret' });
    }
    return out;
  },
  slack(threats, q, r) {
    let m = Infinity;
    for (const t of threats) m = Math.min(m, Math.abs(q - t.q) + Math.abs(r - t.r) - t.range);
    return m;
  },
  snap(bs) {
    const th = window.__H.threats(bs);
    return {
      round: bs.roundNo,
      gateHp: bs.gateHp, gateOpen: bs.gateOpen, breached: bs.wallEverBreached,
      towersAtWall: Array.from(bs.towerAtWallRows || []),
      units: bs.atk.filter(u => !u.dead && !u.fadingOut && !u.removed).map(u => ({
        id: u.bu.id, k: window.__H.kind(u), q: u.q, r: u.r, hp: Math.round(u.bu.hp), wall: !!u.onWallWalkway,
        slack: window.__H.slack(th, u.q, u.r),
      })),
      defAlive: bs.def.filter(u => !u.dead && !u.fadingOut && !u.removed).length,
    };
  },
};
`;

async function runScenario(browser, sc) {
  const page = await browser.newPage({ viewport: { width: 1100, height: 700 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.addInitScript(SEED_SCRIPT);
  const q = `playtest=oblezenie-duze&fort=${sc.fort}&bare=1&rams=${sc.rams || 0}&towers=${sc.towers || 0}`;
  await page.goto('file://' + path.join(dist, 'index.html') + '?' + q, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => !!window.__lastBattleScene, { timeout: 60000 });
  await page.evaluate(PAGE_LIB);
  await page.evaluate((v) => { window.sc_shots = v; }, !!(shotsDir && sc.shot));
  // Start: koniec rozstawienia, tryb RECZNY (playtest startuje w recznym), brak AUTO.
  await page.evaluate(() => {
    const bs = window.__lastBattleScene; bs._endDeployPhase(); bs.speedMul = 16;
    // Szybki przebieg (bez zmiany logiki): render wylaczony, klatki co ~2 ms; zegar wirtualny liczy speedMul.
    if (!window.sc_shots) { try { bs.renderer.render = () => {}; } catch (e) { /* brak renderera */ } }
    window.requestAnimationFrame = (cb) => setTimeout(() => cb(performance.now()), 2);
  });
  await page.waitForTimeout(300);
  const setup = await page.evaluate((sc) => {
    const bs = window.__lastBattleScene;
    const H = window.__H;
    const sel = (kinds) => bs.atk.filter(u => !u.dead && kinds.includes(H.kind(u)));
    const mid = bs.siegeGateRow;
    const wallCol = bs.siegeWallCol;
    // Pozycje startowe wg scenariusza (deterministyczne): opcjonalne przestawienie jednostek.
    const place = (u, c, r) => {
      bs.occByKey.delete(u.q + ',' + u.r);
      u.q = c; u.r = r; bs.occByKey.set(c + ',' + r, u);
      const w = bs.constructor.prototype; // brak API -- pozycja 3D ustawiana nizej
    };
    const out = { gate: [bs.siegeGateCol, bs.siegeGateRow], wallCol, mid, kinds: {} };
    for (const u of bs.atk) out.kinds[H.kind(u)] = (out.kinds[H.kind(u)] || 0) + 1;
    // Rozkazy: kinds -> { type: 'attackMove'|'attack'|'none'|'move', target }
    for (const [kinds, ord] of sc.orders) {
      for (const u of sel(kinds)) {
        if (ord === 'none') { u.playerOrder = { type: 'none' }; continue; }
        if (ord === 'attackMove') u.playerOrder = { type: 'attackMove', col: wallCol + 8, row: mid };
        else if (ord === 'attackMoveNear') u.playerOrder = { type: 'attackMove', col: wallCol - 2, row: mid };
        else if (ord === 'attack') {
          const t = bs.def.find(d => !d.dead && d.onWallWalkway);
          u.playerOrder = t ? { type: 'attack', targetId: t.bu.id } : { type: 'none' };
        } else if (ord === 'attackArcher') {
          const t = bs.def.find(d => !d.dead && d.onWallWalkway && d.rangedBase);
          u.playerOrder = t ? { type: 'attack', targetId: t.bu.id } : { type: 'none' };
        }
      }
    }
    return out;
  }, sc);
  // Przebieg: N rund; snapshot na starcie kazdej rundy.
  await page.evaluate((rounds) => {
    const bs = window.__lastBattleScene;
    window.__snaps = [window.__H.snap(bs)];
    window.__limit = rounds;
    const orig = bs._beginTurn.bind(bs);
    bs._beginTurn = function () {
      window.__snaps.push(window.__H.snap(bs));
      if (bs.roundNo >= window.__limit) { bs._battleAwaitingOrders = true; return; }
      orig();
    };
    bs._kickoffBattleTurn();
  }, sc.rounds);
  const t0 = Date.now();
  let done = false;
  while (Date.now() - t0 < (sc.timeoutMs || 170000)) {
    done = await page.evaluate(() => window.__snaps.length > window.__limit || window.__lastBattleScene.finished);
    if (done) break;
    await page.waitForTimeout(400);
  }
  const snaps = await page.evaluate(() => window.__snaps);
  const shots = [];
  if (shotsDir && sc.shot) {
    fs.mkdirSync(shotsDir, { recursive: true });
    await page.evaluate((cam) => {
      const bs = window.__lastBattleScene;
      bs.camTarget.set(cam.x, 0, cam.z);
      const cv = bs.renderer && bs.renderer.domElement;
      if (bs.overlay && cv) for (const el of Array.from(bs.overlay.children)) { if (el === cv || el.contains(cv)) continue; el.style.display = 'none'; }
      bs.camDir.set(-0.62, 0.5, 0.45).normalize();
      bs.camDistTarget = cam.dist; bs.camDist = cam.dist; bs._applyCamera();
    }, sc.shot);
    await page.waitForTimeout(900);
    const f = path.join(shotsDir, `${sc.name}.png`);
    await page.screenshot({ path: f });
    shots.push(f);
  }
  await page.close();
  return { setup, snaps, done, errors, shots };
}

// ---------------------------------------------------------------------------
// Scenariusze + asercje (oczekiwania wlasciciela A/B).
// ---------------------------------------------------------------------------
const INF = ['inf']; const CAV = ['cav']; const ARCH = ['arch'];
const SC = [];
for (const fort of ['mury', 'palisada']) {
  // A1: tarany ida do bramy (rozne rozkazy gracza).
  for (const ord of ['none', 'attackMove', 'attack']) {
    SC.push({ name: `A1-ram-gate-${fort}-${ord}`, fort, rams: 2, towers: 0, rounds: 14, orders: [[['ram'], ord]],
      check: 'ramGate', shot: ord === 'attackMove' ? { x: 38, z: 77, dist: 24 } : undefined });
  }
  // A2: wieza dociera pod mur; piechota wchodzi na mur.
  for (const ord of ['none', 'attackMove']) {
    SC.push({ name: `A2-tower-climb-${fort}-${ord}`, fort, rams: 0, towers: 2, rounds: 22,
      orders: [[['tower'], ord], [INF, ord]], check: 'towerClimb', shot: ord === 'attackMove' ? { x: 38, z: 77, dist: 24 } : undefined });
  }
  // B1: szarza piechoty bez machin -- poza zasiegiem ostrzalu.
  for (const ord of ['attackMove', 'attack']) {
    SC.push({ name: `B1-inf-charge-nomachines-${fort}-${ord}`, fort, rams: 0, towers: 0, rounds: 14,
      orders: [[INF, ord]], check: 'staysOutOfFire', shot: ord === 'attackMove' ? { x: 30, z: 77, dist: 30 } : undefined });
  }
  // B2: konnica -- z boku do wylomu bramy.
  for (const ord of ['attackMove', 'attack']) {
    SC.push({ name: `B2-cav-charge-nomachines-${fort}-${ord}`, fort, rams: 0, towers: 0, rounds: 14,
      orders: [[CAV, ord]], check: 'staysOutOfFire' });
  }
  // B3: tarany + piechota + konnica razem (scenariusz wlasciciela, bez wiez): piechota/konnica poza ogniem
  // dopoki brama stoi.
  SC.push({ name: `B3-mixed-ram-army-${fort}`, fort, rams: 2, towers: 0, rounds: 16,
    orders: [[['ram'], 'attackMove'], [INF, 'attackMove'], [CAV, 'attackMove']], check: 'mixedBeforeBreach' });
}

function checkScenario(sc, r) {
  const checks = [];
  const add = (ok, msg) => checks.push({ ok: !!ok, msg });
  const snaps = r.snaps;
  const last = snaps[snaps.length - 1];
  add(r.errors.length === 0, `brak bledow JS (${r.errors.length})`);
  add(snaps.length > 2, `symulacja ruszyla (${snaps.length} migawek)`);
  const gate = r.setup.gate; const wallCol = r.setup.wallCol;
  if (sc.check === 'ramGate') {
    const rams = (s) => s.units.filter(u => u.k === 'ram');
    const dGate = (u) => Math.min(Math.abs(u.q - gate[0]) + Math.abs(u.r - gate[1]), Math.abs(u.q - gate[0]) + Math.abs(u.r - (gate[1] - 1)));
    const best = Math.min(...rams(last).map(dGate));
    add(best <= 1, `taran dotarl do bramy (min dystans do bramy = ${best}, wymagane <= 1)`);
    add(last.gateHp < 400 || last.gateOpen, `brama uszkodzona (gateHp=${last.gateHp}, open=${last.gateOpen})`);
    // Nie wedruje po bokach muru: zaden taran nie schodzi dalej niz 6 rzedow od bramy w osi pionowej.
    let maxOff = 0;
    for (const s of snaps) for (const u of rams(s)) maxOff = Math.max(maxOff, Math.abs(u.r - gate[1]) - 0);
    const startOff = Math.max(...rams(snaps[0]).map(u => Math.abs(u.r - gate[1])));
    add(maxOff <= Math.max(startOff, 3) + 1, `taran nie bladzi po bokach (max |dRzad|=${maxOff}, start=${startOff})`);
  } else if (sc.check === 'towerClimb') {
    add(last.towersAtWall.length > 0, `wieza pod murem (towersAtWall=${JSON.stringify(last.towersAtWall)})`);
    const onWall = last.units.filter(u => u.wall && u.k === 'inf').length;
    add(onWall > 0, `piechota weszla na mur (na koronie: ${onWall})`);
    add(last.breached, 'wylom zarejestrowany (wallEverBreached)');
  } else if (sc.check === 'staysOutOfFire' || sc.check === 'mixedBeforeBreach') {
    const watch = sc.check === 'staysOutOfFire' ? null : null;
    let violations = 0; let minSlack = Infinity; let hpLost = 0;
    const firstOpen = snaps.findIndex(s => s.gateOpen || s.breached);
    const lim = firstOpen < 0 ? snaps.length : firstOpen; // do wylomu
    for (let i = 1; i < lim; i++) {
      for (const u of snaps[i].units) {
        if (u.k !== 'inf' && u.k !== 'cav') continue;
        minSlack = Math.min(minSlack, u.slack);
        if (u.slack <= 0 && !(snaps[0].units.find(x => x.id === u.id) && snaps[0].units.find(x => x.id === u.id).slack <= 0)) violations++;
      }
    }
    const melee0 = snaps[0].units.filter(u => u.k === 'inf' || u.k === 'cav');
    const melee1 = (snaps[Math.max(0, lim - 1)] || last).units.filter(u => u.k === 'inf' || u.k === 'cav');
    const hp0 = melee0.reduce((a, u) => a + u.hp, 0);
    const hp1 = melee1.filter(u => melee0.some(x => x.id === u.id)).reduce((a, u) => a + u.hp, 0)
      + 0;
    add(violations === 0, `wrecz nie wszedl w zasieg ostrzalu przed wylomem (naruszen=${violations}, min luz=${minSlack})`);
    add(melee1.length === melee0.length, `wrecz nie ginie przed wylomem (zywych ${melee1.length}/${melee0.length})`);
    // Podejscie: zblizyl sie do muru (luz maly, ale > 0) -- nie stoi bez ruchu na starcie.
    const moved = melee1.some(u => { const a = melee0.find(x => x.id === u.id); return a && (a.q !== u.q || a.r !== u.r); });
    add(moved, 'wrecz podszedl (ruch wykonany)');
    if (sc.check === 'mixedBeforeBreach') {
      const rams = last.units.filter(u => u.k === 'ram');
      add(last.gateHp < 400 || last.gateOpen, `tarany uderzaja w brame (gateHp=${last.gateHp})`);
    }
  }
  return checks;
}

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--no-sandbox', '--headless=new', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const results = [];
  for (const sc of SC) {
    if (only && !sc.name.includes(only)) continue;
    let res;
    try {
      const r = await runScenario(browser, sc);
      const checks = checkScenario(sc, r);
      const last = r.snaps[r.snaps.length - 1];
      res = {
        name: sc.name, pass: checks.every(c => c.ok), checks, shots: r.shots,
        metrics: { rounds: last.round, gateHp: last.gateHp, gateOpen: last.gateOpen, breached: last.breached, towersAtWall: last.towersAtWall,
          units: last.units.filter(u => u.k !== 'arch').map(u => `${u.k}:${u.q},${u.r}${u.wall ? 'W' : ''}:s${u.slack}`).slice(0, 40), errors: r.errors.slice(0, 2) },
      };
    } catch (e) {
      res = { name: sc.name, pass: false, checks: [{ ok: false, msg: 'wyjatek harnessu: ' + String(e).slice(0, 200) }] };
    }
    results.push(res);
    console.log((res.pass ? 'PASS ' : 'FAIL ') + res.name);
    for (const c of res.checks) if (!c.ok) console.log('    - ' + c.msg);
  }
  await browser.close();
  fs.writeFileSync(outJson, JSON.stringify(results, null, 1));
  const p = results.filter(r => r.pass).length;
  console.log(`SUMMARY ${p}/${results.length} PASS`);
  process.exit(0);
})();
