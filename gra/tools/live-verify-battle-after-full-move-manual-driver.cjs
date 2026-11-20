'use strict';
/**
 * R-WEB-LIVE-VERIFY-BATTLE-AFTER-FULL-MOVE-Q1 (runda 3, N1) -- straty zwyciezcy w trybie RECZNYM (klik-po-klik) vs AUTO.
 *
 * Driver Playwright steruje PRAWDZIWYM UI sceny bitwy (BattleScene, vite dev server na drzewie; gra/src nietkniete):
 *   1. scena startuje w trybie recznym w fazie planowania (_battleAwaitingOrders; wejscie klawiszem R jest zablokowane przez
 *      bramke generala dla zestawow testowych, wiec tool wylacza bramke -- tak samo jak istniejace testy reczne);
 *   2. klik w chip roster "all" (data-roster-chip="all") -> zaznaczenie CALEJ armii gracza (mysz, prawdziwy klik);
 *   3. Shift+klik w canvasie w najblizszego wroga (rzutowanie kamery -> piksel, walidacja _pickUnitAtScreen/_pickGroundTile)
 *      -> rozkaz ataku odlozony dla kazdej jednostki;
 *   4. klawisz Spacja -> wykonanie rozkazow / start tury;
 *   5. czekanie NA STAN UI (waitForFunction: roundNo wzroslo / bitwa zakonczona / pojawily sie jednostki bez rozkazu) -- bez slepego sleep;
 *      gdy cel zginal, a jednostki sa bez rozkazu, kroki 2-4 powtarzaja sie (nowy najblizszy wrog).
 * Stan koncowy: window.__e2e.result (ta sama struktura co przy AUTO: killed/fled/survived, hpStart/hpEnd, winner).
 * Porownanie z AUTO (tryb auto = ten sam skald, to samo ziarno Math.random, rozgrywka w czasie rzeczywistym bez Pomin).
 *
 * Roznica sterowania: AUTO uzywa doktryny (formacja, flanki), reczny driver wydaje jeden rozkaz "atakuj najblizszego" calej armii.
 * Rozbieznosc strat moze wiec wynikac z prostoty rozkazu, nie z defektu -- raport opisuje ja, nie ukrywa.
 *
 * Uzycie (z gra/): node tools/live-verify-battle-after-full-move-manual-driver.cjs [--out <katalog>] [--seeds 1,2,3] [--strict-discrepancy]
 *                   node tools/live-verify-battle-after-full-move-manual-driver.cjs --check <plik.jsonl>
 * Kod wyjscia 1: timeout / bitwa niezakonczona / brak rozkazow z UI / bilans jednostek / blad strony; z --strict-discrepancy takze
 * rozbieznosc strat zwyciezcy > DISCREPANCY_PCT (domyslnie 25).
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_OUT = path.resolve(ROOT, '..', 'dyspozycje', 'autobot', 'runs', 'R-WEB-LIVE-VERIFY-BATTLE-AFTER-FULL-MOVE-Q1', 'evidence');
const DISCREPANCY_PCT = Number(process.env.DISCREPANCY_PCT || 25);
const COMPOSITIONS = [
  { id: 'C1', name: 'piechota 14 vs 10', atk: 'Wojownik:14', def: 'Wojownik:10' },
  { id: 'C2', name: 'mieszany: piechota+strzelcy+konnica 18 vs 16', atk: 'Wojownik:8,Lucznik:6,Konnica:4', def: 'Wojownik:8,Lucznik:5,Konnica:3' },
];

const PICK_FN = `(() => {
  const s = window.__scene;
  const project = (x, y, z) => { s.camera.updateMatrixWorld(true); const v = s.camera.matrixWorldInverse.elements, p = s.camera.projectionMatrix.elements;
    const vx = v[0]*x+v[4]*y+v[8]*z+v[12], vy = v[1]*x+v[5]*y+v[9]*z+v[13], vz = v[2]*x+v[6]*y+v[10]*z+v[14], vw = v[3]*x+v[7]*y+v[11]*z+v[15];
    const cx = p[0]*vx+p[4]*vy+p[8]*vz+p[12]*vw, cy = p[1]*vx+p[5]*vy+p[9]*vz+p[13]*vw, cw = p[3]*vx+p[7]*vy+p[11]*vz+p[15]*vw;
    const rect = s.canvas.getBoundingClientRect(); return { x: rect.left + (cx / cw + 1) * rect.width / 2, y: rect.top + (1 - cy / cw) * rect.height / 2 }; };
  const unitPoint = (u) => { const pos = u.group.position, rect = s.canvas.getBoundingClientRect();
    for (const dy of [.25, .5, .8, 1.1, 1.4, 1.8, 2.2]) for (const dx of [-.15, 0, .15]) { const pt = project(pos.x + dx, pos.y + dy, pos.z);
      if (pt.x < rect.left || pt.x > rect.right || pt.y < rect.top || pt.y > rect.bottom) continue;
      const tile = s._pickGroundTile(pt.x, pt.y), hit = s._pickUnitAtScreen(pt.x, pt.y);
      if (hit && hit.bu && hit.bu.id === u.bu.id && document.elementFromPoint(pt.x, pt.y) === s.canvas) return { x: pt.x, y: pt.y, id: u.bu.id, tile: !!tile }; }
    return null; };
  const own = s._playerRoster().filter(u => !u.dead && !u.routed && !u.removed);
  const en = s._enemyRoster().filter(u => !u.dead && !u.routed && !u.removed && !u.fadingOut);
  if (!own.length || !en.length) return null;
  const cx = own.reduce((a, u) => a + u.q, 0) / own.length, cy = own.reduce((a, u) => a + u.r, 0) / own.length;
  en.sort((a, b) => (Math.abs(a.q - cx) + Math.abs(a.r - cy)) - (Math.abs(b.q - cx) + Math.abs(b.r - cy)));
  for (const e of en) { const p = unitPoint(e); if (p) return p; }
  return null; })()`;

const GROUND_FN = `(() => {
  const s = window.__scene;
  const project = (x, y, z) => { s.camera.updateMatrixWorld(true); const v = s.camera.matrixWorldInverse.elements, p = s.camera.projectionMatrix.elements;
    const vx = v[0]*x+v[4]*y+v[8]*z+v[12], vy = v[1]*x+v[5]*y+v[9]*z+v[13], vz = v[2]*x+v[6]*y+v[10]*z+v[14], vw = v[3]*x+v[7]*y+v[11]*z+v[15];
    const cx = p[0]*vx+p[4]*vy+p[8]*vz+p[12]*vw, cy = p[1]*vx+p[5]*vy+p[9]*vz+p[13]*vw, cw = p[3]*vx+p[7]*vy+p[11]*vz+p[15]*vw;
    const rect = s.canvas.getBoundingClientRect(); return { x: rect.left + (cx / cw + 1) * rect.width / 2, y: rect.top + (1 - cy / cw) * rect.height / 2 }; };
  const en = s._enemyRoster().filter(u => !u.dead && !u.routed && !u.removed && !u.fadingOut);
  if (!en.length) return null;
  const cq = Math.round(en.reduce((a, u) => a + u.q, 0) / en.length), cr = Math.round(en.reduce((a, u) => a + u.r, 0) / en.length);
  const rect = s.canvas.getBoundingClientRect(); const cand = [];
  for (let dq = -6; dq <= 6; dq++) for (let dr = -6; dr <= 6; dr++) cand.push([cq + dq, cr + dr, Math.abs(dq) + Math.abs(dr)]);
  cand.sort((a, b) => a[2] - b[2]);
  for (const [q, r] of cand) {
    if (!s.terrainMap.passable(q, r) || s.occByKey.has(q + ',' + r)) continue;
    const pt = project(q, .08, r);
    if (pt.x < rect.left + 360 || pt.x > rect.right - 10 || pt.y < rect.top + 120 || pt.y > rect.bottom - 10) continue;
    const tile = s._pickGroundTile(pt.x, pt.y), hit = s._pickUnitAtScreen(pt.x, pt.y);
    // przy oddaleniu kamery piksel moze trafic w sasiedni heks: bierzemy heks, ktory UI faktycznie wskaze (pusty, przechodni, blisko wroga)
    if (!tile || hit || document.elementFromPoint(pt.x, pt.y) !== s.canvas) continue;
    if (!s.terrainMap.passable(tile.col, tile.row) || s.occByKey.has(tile.col + ',' + tile.row)) continue;
    if (Math.abs(tile.col - cq) + Math.abs(tile.row - cr) > 10) continue;
    return { x: pt.x, y: pt.y, q: tile.col, r: tile.row };
  }
  return null; })()`;

async function manualRun(browser, base, comp, seed, strategy) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  const ui = { strategy, chipClicks: 0, enemyShiftClicks: 0, marchClicks: 0, groundClicks: 0, spacePresses: 0, zoomFallbacks: 0, iterations: 0, queuedOrders: 0, orderedUnits: 0 };
  await page.goto(`${base}?mode=manual&seed=${seed}&norender=1&atk=${encodeURIComponent(comp.atk)}&def=${encodeURIComponent(comp.def)}`, { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => window.__e2e && window.__e2e.ready === true && window.__scene && window.__scene.started && !window.__scene.deployPhase, undefined, { timeout: 60000 });
  const startState = await page.evaluate(() => ({ manual: window.__scene._manualMode, awaiting: window.__scene._battleAwaitingOrders, side: window.__scene._deployPlayerSideOpt, own: window.__scene._playerRoster().length, enemy: window.__scene._enemyRoster().length }));
  const t0 = Date.now(); let timedOut = false; let stuckReason = null; const trace = [];
  while (true) {
    const st = await page.evaluate(() => { const s = window.__scene; return { finished: s.finished, round: s.roundNo, aw: s._battleAwaitingOrders, activeEnemies: s._enemyRoster().filter(u => !u.dead && !u.routed && !u.removed && !u.fadingOut).length,
      idle: s._playerRoster().filter(u => !u.dead && !u.routed && !u.removed && u.playerOrder.type === 'none').length }; });
    trace.push(await page.evaluate(() => { const s = window.__scene; const own = s._playerRoster().filter(u => !u.dead && !u.routed && !u.removed);
      const orders = {}; for (const u of own) orders[u.playerOrder.type] = (orders[u.playerOrder.type] || 0) + 1;
      return { round: s.roundNo, ownAlive: own.length, enemyAlive: s._enemyRoster().filter(u => !u.dead && !u.routed && !u.removed).length, orders, acted: own.filter(u => u.acted).length, busy: s.busy }; }));
    if (st.finished) break;
    if (Date.now() - t0 > 270000 || ui.iterations > 400) { timedOut = true; stuckReason = 'limit czasu/iteracji'; break; }
    ui.iterations++;
    // brak aktywnych wrogow (reszta uciekla/ginie w poscigu): nie ma komu wydawac rozkazow -- czekamy na stan UI do konca bitwy
    if ((st.aw || st.idle > 0) && st.activeEnemies > 0) {
      const selectAll = async () => {
        const all = await page.evaluate(() => { const b = document.querySelector('button[data-roster-chip="all"]'); if (!b) return null; b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
        if (!all) return false;
        await page.mouse.click(all.x, all.y); ui.chipClicks++; return true;
      };
      const needPoint = async (fn) => {
        let pt = null;
        for (let k = 0; k < 8 && !pt; k++) {
          // stan UI: kamera ustabilizowana (macierz niezmieniona przez 6 klatek), dopiero potem rzutowanie na piksele
          await page.evaluate(() => new Promise(res => { const sc = window.__scene; let last = '', same = 0, n = 0;
            const f = () => { sc.camera.updateMatrixWorld(true); const sig = sc.camera.matrixWorld.elements.map(x => x.toFixed(3)).join(','); same = sig === last ? same + 1 : 0; last = sig;
              if (same >= 4 || ++n > 90) res(true); else requestAnimationFrame(f); }; f(); }));
          pt = await page.evaluate(fn);
          if (!pt) { // cel poza widokiem albo za maly do trafienia: zmien przyblizenie kolkiem myszy (UI): na zmiane oddal / przybliz
            await page.mouse.move(700, 450); await page.mouse.wheel(0, k % 2 === 0 ? 300 : -500); ui.zoomFallbacks++;
          }
        }
        return pt;
      };
      if (strategy === 'march') {
        // Atakuj-marszem: zaznacz cala armie, przycisk Atakuj-marszem, klik w puste pole za linia wroga (kazda jednostka atakuje po drodze)
        const pt = await needPoint(GROUND_FN);
        if (!pt) { stuckReason = 'brak widocznego pustego pola przy wrogu'; timedOut = true; ui.failDiag = await page.evaluate(() => { const sc = window.__scene; const en = sc._enemyRoster().filter(u => !u.dead && !u.routed && !u.removed); const r = sc.canvas.getBoundingClientRect(); return { enemies: en.map(u => [u.q, u.r]), canvas: [r.left, r.top, r.right, r.bottom], round: sc.roundNo }; }); break; }
        if (!(await selectAll())) { stuckReason = 'brak chipu roster "all"'; timedOut = true; break; }
        const btn = await page.evaluate(() => { const b = document.querySelector('button[data-battle-attack-move-mode]'); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
        if (!btn) { stuckReason = 'brak przycisku Atakuj-marszem'; timedOut = true; break; }
        await page.mouse.click(btn.x, btn.y); ui.marchClicks++;
        await page.mouse.click(pt.x, pt.y); ui.groundClicks++;
      } else {
        // focus: Shift+klik w najblizszego wroga (odlozony rozkaz ataku dla calej armii na jeden cel)
        const pt = await needPoint(PICK_FN);
        if (!pt) { stuckReason = 'brak widocznego wroga do kliku'; timedOut = true; break; }
        if (!(await selectAll())) { stuckReason = 'brak chipu roster "all"'; timedOut = true; break; }
        await page.mouse.click(pt.x, pt.y, { modifiers: ['Shift'] }); ui.enemyShiftClicks++;
      }
      ui.queuedOrders += await page.evaluate(() => window.__scene._queuedOrderUnitIds.size);
      ui.orderedUnits += await page.evaluate(() => window.__scene._playerRoster().filter(u => !u.dead && !u.routed && !u.removed && u.playerOrder.type !== 'none').length);
      if (await page.evaluate(() => window.__scene._battleAwaitingOrders || window.__scene._queuedOrderUnitIds.size > 0)) { await page.keyboard.press('Space'); ui.spacePresses++; }
    }
    // czekanie NA STAN UI: runda wzrosla, bitwa zakonczona albo pojawily sie jednostki bez rozkazu
    try {
      await page.waitForFunction(({ r }) => { const s = window.__scene; if (s.finished || s.roundNo > r) return true;
        if (!s._enemyRoster().some(u => !u.dead && !u.routed && !u.removed && !u.fadingOut)) return false; // brak aktywnych wrogow: czekamy na koniec bitwy/rundy
        return !s.busy && s._playerRoster().some(u => !u.dead && !u.routed && !u.removed && u.playerOrder.type === 'none'); }, { r: st.round }, { timeout: 60000, polling: 100 });
    } catch { stuckReason = `runda ${st.round} bez zmiany stanu przez 60 s`; timedOut = true; break; }
  }
  const finished = await page.evaluate(() => window.__scene.finished);
  let result = null;
  if (finished) { try { await page.waitForFunction(() => window.__e2e.done === true, undefined, { timeout: 10000 }); result = await page.evaluate(() => window.__e2e.result); } catch { /* brak wyniku */ } }
  const endManual = await page.evaluate(() => window.__scene._manualMode);
  await page.close();
  return { startState, endManual, ui, trace, timedOut, stuckReason, errors, r: result, finished };
}

async function autoRun(browser, base, comp, seed) {
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(`${base}?mode=auto&seed=${seed}&norender=1&atk=${encodeURIComponent(comp.atk)}&def=${encodeURIComponent(comp.def)}`, { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => window.__e2e && window.__e2e.ready === true, undefined, { timeout: 60000 });
  let timedOut = false;
  try { await page.waitForFunction(() => window.__e2e.done === true, undefined, { timeout: 280000, polling: 500 }); } catch { timedOut = true; }
  const r = timedOut ? null : await page.evaluate(() => window.__e2e.result);
  await page.close();
  return { timedOut, errors, r };
}

/** Straty strony: jednostki (zabici, zabici+uciekli) i HP (utracone, % HP startowych). */
function sideLoss(s) {
  return { killed: s.killed, lost: s.killed + s.fled, hpLost: s.hpStart - s.hpEnd, hpLostPct: s.hpLostPct, total: s.total };
}

function analyze(rows) {
  const out = []; let fails = 0; let candidates = 0; const lines = [];
  lines.push('=== TABELA 3: straty zwyciezcy vs przegranego, tryb RECZNY (klik-po-klik) vs AUTO, ten sam sklad i ziarno ===');
  lines.push('sklad | ziarno | tryb | zwyciezca | rundy | ZWYCIEZCA: zabici/utraceni(+uciekli)/HP utracone (% HP) | PRZEGRANY: zabici/utraceni/HP utracone (% HP) | akcje UI (chip/Shift+klik enemy/Spacja)');
  const byKey = new Map();
  for (const row of rows) byKey.set(`${row.comp}|${row.seed}|${row.mode}`, row);
  for (const row of rows) {
    const bad = [];
    if (row.timedOut) bad.push(`TIMEOUT/niezakonczona (${row.stuckReason || 'limit'})`);
    if (row.errors && row.errors.length) bad.push(`pageerror x${row.errors.length}`);
    if (!row.r) bad.push('brak wyniku');
    if (row.mode.startsWith('manual')) {
      if (!row.startState || !row.startState.manual) bad.push('scena nie byla w trybie recznym');
      if (!row.endManual) bad.push('tryb reczny wylaczony w trakcie');
      if (!row.ui || !((row.ui.enemyShiftClicks >= 1 || row.ui.groundClicks >= 1) && row.ui.orderedUnits >= 1)) bad.push('driver nie wydal zadnego rozkazu z UI');
    }
    let wl = null, ll = null, winner = '--';
    if (row.r) {
      for (const [side, s] of [['atk', row.r.atk], ['def', row.r.def]]) if (s.killed + s.fled + s.survived !== s.total) bad.push(`bilans ${side}`);
      winner = row.r.winner;
      const wSide = winner === 'atakujacy' ? row.r.atk : winner === 'obronca' ? row.r.def : null;
      const lSide = winner === 'atakujacy' ? row.r.def : winner === 'obronca' ? row.r.atk : null;
      if (!wSide) bad.push(`brak zwyciezcy (winner=${winner})`);
      else { wl = sideLoss(wSide); ll = sideLoss(lSide); }
    }
    const f = x => x ? `${x.killed}/${x.lost}/${x.hpLost} (${x.hpLostPct}%)` : '--';
    lines.push(`${row.comp} ${row.compName} | s${row.seed} | ${row.mode} | ${winner} | ${row.r ? row.r.round : '--'} | ${f(wl)} | ${f(ll)} | ${row.ui ? `${row.ui.chipClicks}/${row.ui.enemyShiftClicks + row.ui.groundClicks}/${row.ui.spacePresses}` : 'n/d'}${row.attempts && row.attempts.length > 1 ? ` (proby: ${row.attempts.length})` : ''}${bad.length ? ' | FAIL: ' + bad.join('; ') : ''}`);
    row._bad = bad; row._wl = wl; row._ll = ll; row._winner = winner;
    if (bad.length) fails++;
  }
  lines.push('');
  lines.push(`=== ROZBIEZNOSC reczny vs AUTO (kandydat R-WEB-*, gdy straty zwyciezcy roznia sie o > ${DISCREPANCY_PCT}% albo zwyciezca inny) ===`);
  lines.push('sklad | ziarno | zwyciezca reczny/AUTO | HP utracone zwyciezcy reczny | AUTO | roznica % (wzgl. AUTO) | jednostki utracone zwyciezcy reczny/AUTO | werdykt');
  const compKeys = [...new Set(rows.map(r => `${r.comp}|${r.seed}`))];
  for (const k of compKeys) {
    for (const strat of ['manual-march', 'manual-focus']) {
      const m = byKey.get(`${k}|${strat}`), a = byKey.get(`${k}|auto`);
      if (!m || !a || !m._wl || !a._wl) { lines.push(`${k} ${strat} | brak pary (INFO)`); continue; }
      const diffPct = a._wl.hpLost > 0 ? Math.round(1000 * Math.abs(m._wl.hpLost - a._wl.hpLost) / a._wl.hpLost) / 10 : (m._wl.hpLost > 0 ? 100 : 0);
      const flip = m._winner !== a._winner;
      const cand = flip || diffPct > DISCREPANCY_PCT;
      if (cand) candidates++;
      lines.push(`${m.comp} ${m.compName} | s${m.seed} ${strat} | ${m._winner}/${a._winner} | ${m._wl.hpLost} | ${a._wl.hpLost} | ${diffPct} | ${m._wl.lost}/${a._wl.lost} | ${cand ? 'KANDYDAT' + (flip ? ' (inny zwyciezca)' : '') : 'w normie'}`);
    }
  }
  lines.push('');
  lines.push('=== DIAGNOSTYKA ruchu i ciosow strony gracza (atakujacy; w AUTO ta sama strona) -- skad rozbieznosc ===');
  lines.push('tryb | obserwacji (jedn. x runda, bez sasiedztwa wroga, po rundzie 1) | sredni ruch heks/runde | odsetek obs. z pelnym ruchem (>= dostepny zapas) | ciosy strony atk / def (suma na bitwe, srednio)');
  const agg = {};
  for (const row of rows) {
    if (!row.r || !row.r.snapshots) continue;
    const a = (agg[row.mode] = agg[row.mode] || { obs: 0, disp: 0, full: 0, hitsAtk: 0, hitsDef: 0, n: 0 });
    const info = row.r.unitInfo;
    for (const sn of row.r.snapshots.slice(2)) for (const u of sn.units) {
      if (info[u[0]].side !== 'atk' || u[3] || u[5] === 1 || u[6] < 0) continue;
      a.obs++; a.disp += u[6]; if (u[6] >= u[7]) a.full++;
    }
    for (const [k, v] of Object.entries(row.r.hitCount || {})) { if (k.split('|')[1].startsWith('atk')) a.hitsAtk += v; else a.hitsDef += v; }
    a.n++;
  }
  for (const [mode, a] of Object.entries(agg)) lines.push(`${mode} | ${a.obs} | ${a.obs ? (a.disp / a.obs).toFixed(2) : '--'} | ${a.obs ? Math.round(100 * a.full / a.obs) : '--'}% | ${(a.hitsAtk / a.n).toFixed(0)} / ${(a.hitsDef / a.n).toFixed(0)}`);
  lines.push('');
  lines.push(`=== manual-driver: ${rows.length} bitew, ${fails} z naruszeniem integralnosci pomiaru, kandydatow na rozbieznosc: ${candidates} (prog ${DISCREPANCY_PCT}%) ===`);
  console.log(lines.join('\n'));
  return { fails, candidates };
}

async function measure(opts) {
  const { chromium } = require('playwright');
  const { createServer } = require('vite');
  const exe = [process.env.CHROMIUM_PATH, (require('./_chrome-path.cjs').resolveChromePath() || '/usr/bin/chromium')].find(p => p && fs.existsSync(p));
  const server = await createServer({ root: ROOT, configFile: path.join(ROOT, 'vite.config.ts'), logLevel: 'error', server: { host: '127.0.0.1', port: 0, strictPort: false } });
  await server.listen();
  const browser = await chromium.launch({ headless: true, executablePath: exe, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const base = `http://127.0.0.1:${server.httpServer.address().port}/tools/battle-rout-pursuit-browser-entry.html`;
  fs.mkdirSync(opts.out, { recursive: true });
  const outFile = path.join(opts.out, 'manual-vs-auto.jsonl');
  const rows = []; const done = new Set();
  if (fs.existsSync(outFile)) for (const l of fs.readFileSync(outFile, 'utf8').split('\n')) { if (l.trim()) { const r = JSON.parse(l); rows.push(r); if (!r.timedOut) done.add(`${r.comp}|${r.seed}|${r.mode}`); } }
  try {
    for (const comp of COMPOSITIONS) for (const seed of opts.seeds) for (const mode of ['manual-march', 'manual-focus', 'auto']) {
      const key = `${comp.id}|${seed}|${mode}`;
      if (done.has(key)) continue;
      if (process.env.ONLY && !new RegExp(process.env.ONLY).test(key)) continue; // np. ONLY='C2\\|1\\|manual-march'
      // manual: timing UI wplywa na przebieg (animacje zuzywaja losowosc) -- nieudany PRZEBIEG STEROWANIA (driver nie znalazl celu do kliku) powtarzamy do 3 razy, ze sladem prob
      let res = null; const attempts = [];
      for (let at = 1; at <= 3; at++) {
        res = mode.startsWith('manual') ? await manualRun(browser, base, comp, seed, mode.split('-')[1]) : await autoRun(browser, base, comp, seed);
        attempts.push({ attempt: at, timedOut: res.timedOut, stuckReason: res.stuckReason || null });
        if (!res.timedOut || !mode.startsWith('manual') || !res.stuckReason || !/brak widocznego|brak chipu|brak przycisku/.test(res.stuckReason)) break;
      }
      const row = { comp: comp.id, compName: comp.name, atk: comp.atk, def: comp.def, seed, mode, attempts, ...res };
      const idx = rows.findIndex(r => r.comp === row.comp && r.seed === seed && r.mode === mode); if (idx >= 0) rows.splice(idx, 1);
      rows.push(row);
      fs.writeFileSync(outFile, rows.map(r => JSON.stringify(r)).join('\n') + '\n');
      console.log(`DONE ${key} winner=${row.r && row.r.winner} round=${row.r && row.r.round} timedOut=${row.timedOut}${row.ui ? ' ui=' + JSON.stringify(row.ui) : ''}`);
    }
  } finally { await browser.close(); await server.close(); }
  return rows;
}

module.exports = { analyze, COMPOSITIONS };

if (require.main === module) {
  (async () => {
    const argv = process.argv.slice(2);
    const o = { out: DEFAULT_OUT, seeds: [1, 2, 3], strict: false, check: null };
    for (let i = 0; i < argv.length; i++) {
      if (argv[i] === '--out') o.out = path.resolve(argv[++i]);
      else if (argv[i] === '--seeds') o.seeds = argv[++i].split(',').map(Number);
      else if (argv[i] === '--strict-discrepancy') o.strict = true;
      else if (argv[i] === '--check') o.check = argv[++i];
    }
    let rows;
    if (o.check) rows = fs.readFileSync(o.check, 'utf8').split('\n').filter(l => l.trim()).map(JSON.parse);
    else rows = await measure(o);
    const { fails, candidates } = analyze(rows);
    process.exitCode = fails > 0 || rows.length === 0 || (o.strict && candidates > 0) ? 1 : 0;
  })().catch(e => { console.error(e.stack || e); process.exitCode = 1; });
}
