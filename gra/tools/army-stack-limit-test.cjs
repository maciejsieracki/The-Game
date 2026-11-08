'use strict';
/**
 * R-WEB-ARMY-STACK-LIMIT-Q1
 * Niezmiennik: ZADEN heks nie ma > limitu wlasnych jednostek jednego wlasciciela (limit = BATTLE_MAX_PER_SIDE,
 * jedno zrodlo prawdy w battle/battleScene.ts). Test:
 *  [A] zrodlo limitu: modul army-stack-limit.ts nie ma wlasnej kopii liczby; main.ts czyta BATTLE_MAX_PER_SIDE;
 *  [B] funkcje czyste (canJoinStackAt, hexHasRoomFor, stackFreeSlots, trimPathToStackRoom);
 *  [C] migracja: duzy stos (np. 1300) dzielony deterministycznie na sasiednie heksy, nic nie ginie, kolejnosc stabilna;
 *  [D] symulacja z bramkami (ruch, scalenie, rekrutacja do pelnego stosu, narodziny w kolejce, wczytanie duzego stosu,
 *      petla 60 tur "AI") -- niezmiennik trzyma po KAZDEJ operacji;
 *  [E] mutacje: ta sama symulacja BEZ bramki lamie niezmiennik (test nie jest tautologiczny);
 *  [F] okablowanie main.ts: kazda droga powstawania/powiekszania stosu ma bramke (skan tekstu zrodla).
 * Headless, bez przegladarki. Pelna petla 60 tur prawdziwego silnika AI wymaga realnego buildu + Chromium
 * (patrz raport) -- tu jest model tych samych bramek na tych samych funkcjach.
 * Run from gra/: node tools/army-stack-limit-test.cjs
 */
const assert = require('node:assert/strict');
const path = require('node:path');
const vm = require('node:vm');
const fs = require('node:fs');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));
const ROOT = path.resolve(__dirname, '..');

async function load() {
  const result = await esbuild.build({
    stdin: {
      contents: `import * as L from './src/game/army-stack-limit.ts';
import { BATTLE_MAX_PER_SIDE } from './src/battle/battleScene.ts';
import * as S from './src/game/siege-enter-city.ts';
import * as V from './src/game/villageRewards.ts';
module.exports = { ...L, BATTLE_MAX_PER_SIDE, planSurrenderEntry: S.planSurrenderEntry, enterCityAfterSurrender: S.enterCityAfterSurrender, findVillageRewardSpawnHex: V.findVillageRewardSpawnHex };`,
      resolveDir: ROOT, sourcefile: 'army-stack-limit-entry.ts',
    },
    bundle: true, platform: 'node', format: 'cjs', target: 'es2020',
    alias: { three: path.join(ROOT, 'node_modules', 'three', 'build', 'three.cjs') },
    plugins: [{
      name: 'stubs',
      setup(build) {
        const stubs = [
          [/render\/units/, "import * as THREE from 'three'; export const buildUnitModel = () => new THREE.Group();"],
          [/brandAssets/, 'export const civIconSvg = () => ""; export const brandIconSvg = () => "";'],
          [/leaderPortraits/, 'export const leaderPortraitUrl = () => ""; export const leaderName = () => ""; export const civIconIdFromCivLabel = () => "";'],
          [/muzyka-antyczna/, 'export const startVictoryMusic = () => {}; export const startDefeatMusic = () => {}; export const startBattleMusic = () => {};'],
        ];
        stubs.forEach(([filter, contents], i) => {
          const ns = 'stub' + i;
          build.onResolve({ filter }, args => ({ path: args.path, namespace: ns }));
          build.onLoad({ filter: /.*/, namespace: ns }, () => ({ contents, loader: 'js', resolveDir: ROOT }));
        });
      },
    }],
    write: false, logLevel: 'silent',
  });
  const module = { exports: {} };
  vm.runInNewContext(result.outputFiles[0].text, {
    module, exports: module.exports, require, console, process, globalThis, setTimeout, clearTimeout, performance,
  }, { filename: 'army-stack-limit-bundle.js' });
  return module.exports;
}

let pass = 0;
function ok(cond, msg) { assert.ok(cond, msg); pass++; }
function eq(a, b, msg) { assert.deepEqual(a, b, msg); pass++; }

function hexDist(aq, ar, bq, br) {
  const dq = aq - bq, dr = ar - br;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}
/** Najwiekszy stos wlasnych jednostek na jednym heksie (niezmiennik: <= limit). */
function maxStack(units) {
  const m = new Map();
  let max = 0;
  for (const u of units) {
    const k = u.ownerId + '|' + u.q + ',' + u.r;
    const n = (m.get(k) || 0) + 1;
    m.set(k, n);
    if (n > max) max = n;
  }
  return max;
}
let seq = 0;
function mk(ownerId, q, r) { seq++; return { id: 'u' + seq, ownerId, q, r }; }
function fill(ownerId, q, r, n) { return Array.from({ length: n }, () => mk(ownerId, q, r)); }
/** deterministyczny PRNG */
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

(async () => {
  const L = await load();
  const LIMIT = L.BATTLE_MAX_PER_SIDE;

  // ---------------- [A] zrodlo limitu ----------------
  ok(LIMIT === 500, 'A1 limit bitwy = 500 (CAP500)');
  const modSrc = fs.readFileSync(path.join(ROOT, 'src/game/army-stack-limit.ts'), 'utf8')
    .split('\n').filter(l => !/^\s*(\*|\/\/|\/\*)/.test(l)).join('\n');
  ok(!/\b(500|120)\b/.test(modSrc), 'A2 modul nie ma wlasnej kopii liczby limitu (500/120)');
  const mainSrc = fs.readFileSync(path.join(ROOT, 'src/main.ts'), 'utf8');
  ok(/function armyStackLimit\(\): number \{\s*return BATTLE_MAX_PER_SIDE;\s*\}/.test(mainSrc), 'A3 main.ts: armyStackLimit() = BATTLE_MAX_PER_SIDE');

  // ---------------- [B] funkcje czyste ----------------
  {
    const us = [...fill(0, 0, 0, LIMIT - 1), ...fill(1, 5, 5, 3)];
    ok(L.ownUnitCountAt(us, 0, 0, 0) === LIMIT - 1, 'B1 ownUnitCountAt');
    ok(L.stackFreeSlots(us, 0, 0, 0, LIMIT) === 1, 'B2 stackFreeSlots = 1');
    ok(L.hexHasRoomFor(us, 0, 0, 0, LIMIT, 1) && !L.hexHasRoomFor(us, 0, 0, 0, LIMIT, 2), 'B3 hexHasRoomFor granica');
    const mover = [mk(0, 1, 0), mk(0, 1, 0)];
    ok(!L.canJoinStackAt([...us, ...mover], mover, 0, 0, LIMIT), 'B4 2 jednostki nie dolacza do stosu z 1 wolnym miejscem');
    ok(L.canJoinStackAt([...us, ...mover], [mover[0]], 0, 0, LIMIT), 'B5 1 jednostka dolacza do stosu z 1 wolnym miejscem');
    ok(L.canJoinStackAt(us, [us[0]], 0, 0, LIMIT), 'B6 jednostka juz stojaca na heksie nie liczona podwojnie');
    const full = fill(0, 0, 0, LIMIT);
    const m1 = [mk(0, 9, 9)];
    const trimmed = L.trimPathToStackRoom([...full, ...m1], m1, [{ q: 3, r: 3 }, { q: 0, r: 0 }], LIMIT);
    eq(trimmed, [{ q: 3, r: 3 }], 'B7 trimPathToStackRoom: trase konczaca sie na pelnym stosie skraca');
    eq(L.trimPathToStackRoom([...full, ...m1], m1, [{ q: 0, r: 0 }], LIMIT), [], 'B8 brak miejsca -> pusta trasa');
    ok(L.stackLimitBlockMessage(LIMIT).includes(String(LIMIT)), 'B9 komunikat blokady zawiera limit');
    ok(L.stackLimitSplitNotice(7, LIMIT).includes('7'), 'B10 komunikat migracji');
  }

  // ---------------- [C] migracja ----------------
  {
    const always = () => true;
    const big = fill(0, 0, 0, 1300);
    const plan = L.planOversizedStackSplits(big, LIMIT, { canPlaceAt: always });
    ok(plan.unplaced.length === 0, 'C1 wszystkie jednostki umieszczone');
    ok(plan.moves.length === 800, 'C2 przeniesiono dokladnie nadwyzke (1300-500)');
    const after = big.map(u => ({ ...u }));
    for (const mv of plan.moves) { const u = after.find(x => x.id === mv.unitId); u.q = mv.toQ; u.r = mv.toR; }
    ok(maxStack(after) <= LIMIT, 'C3 po migracji zaden stos > limitu');
    ok(after.length === 1300 && new Set(after.map(u => u.id)).size === 1300, 'C4 zadna jednostka nie zginela');
    ok(plan.moves.every(mv => hexDist(0, 0, mv.toQ, mv.toR) <= 6 && !(mv.toQ === 0 && mv.toR === 0)), 'C5 cele w promieniu <= 6, nie na heksie zrodlowym');
    ok(plan.moves.every(mv => hexDist(0, 0, mv.toQ, mv.toR) === 1), 'C6 pierwsze idzie na sasiadow (promien 1 starcza dla 800 = 6*500)');
    eq(L.planOversizedStackSplits(big.map(u => ({ ...u })), LIMIT, { canPlaceAt: always }), plan, 'C7 deterministyczne (dwa przebiegi identyczne)');
    // pierscienie: kazdy promien r daje 6r unikalnych heksow w odleglosci r (test przez duzy stos 500+6*500*3)
    const huge = fill(0, 0, 0, LIMIT + 6 * LIMIT + 12 * LIMIT);
    const p2 = L.planOversizedStackSplits(huge, LIMIT, { canPlaceAt: always });
    const dests = new Map();
    for (const mv of p2.moves) { const k = mv.toQ + ',' + mv.toR; dests.set(k, (dests.get(k) || 0) + 1); }
    ok(p2.unplaced.length === 0 && [...dests.values()].every(n => n <= LIMIT), 'C8 pierscienie 1-2: kazdy cel <= limit');
    const byDist = {};
    for (const k of dests.keys()) { const [q, r] = k.split(',').map(Number); const d = hexDist(0, 0, q, r); byDist[d] = (byDist[d] || 0) + 1; }
    ok(byDist[1] === 6 && byDist[2] === 12, 'C9 pierscien promienia 1 ma 6 unikalnych heksow, promienia 2 ma 12');
    // ograniczenia: obca jednostka / niedozwolony teren
    const foreign = mk(1, 1, 0);
    const blocked = (o, q, r) => !(q === -1 && r === 0);
    const p3 = L.planOversizedStackSplits([...fill(0, 0, 0, LIMIT + 10), foreign], LIMIT, { canPlaceAt: blocked });
    ok(p3.moves.length === 10 && p3.moves.every(mv => !(mv.toQ === 1 && mv.toR === 0) && !(mv.toQ === -1 && mv.toR === 0)),
      'C10 omija heks z obca jednostka i heks niedozwolony');
    const p4 = L.planOversizedStackSplits(fill(0, 0, 0, LIMIT + 3), LIMIT, { canPlaceAt: () => false });
    ok(p4.moves.length === 0 && p4.unplaced.length === 3, 'C11 brak miejsca -> unplaced (nic nie ginie)');
    // wlasciciele niezalezni; stosy <= limit nietkniete
    const p5 = L.planOversizedStackSplits([...fill(0, 0, 0, LIMIT), ...fill(1, 0, 0, 1)], LIMIT, { canPlaceAt: always });
    ok(p5.moves.length === 0, 'C12 stos rowny limitowi i stos innego wlasciciela nietkniete');
  }

  // ---------------- [D]/[E] symulacja z bramkami i bez ----------------
  /**
   * Model gry: swiat 15x15 heksow, jednostki, operacje: move, merge (ruch na wlasny stos), recruit (do miasta),
   * births (kolejka), load, ai-turn. `gated=false` pomija bramki (mutacja) -- niezmiennik musi pasc.
   */
  function simulate(gated, turns) {
    const units = [];
    const city = { q: 0, r: 0, ownerId: 0 };
    const queue = [];
    const violations = [];
    const check = (where) => { const m = maxStack(units); if (m > LIMIT) violations.push(where + ':' + m); };
    const place = (ownerId, q, r) => (Math.abs(q) <= 7 && Math.abs(r) <= 7 && Math.abs(q + r) <= 7);
    const tryMove = (mover, q, r) => {
      if (gated && !L.canJoinStackAt(units, mover, q, r, LIMIT)) return false;
      for (const u of mover) { u.q = q; u.r = r; }
      return true;
    };
    const recruitCity = (n) => { // zakup do kolejki
      if (gated && !L.hexHasRoomFor(units, 0, city.q, city.r, LIMIT, queue.length + n)) return false;
      for (let i = 0; i < n; i++) queue.push(1);
      return true;
    };
    const births = () => { // narodziny z kolejki
      const free = gated ? L.stackFreeSlots(units, 0, city.q, city.r, LIMIT) : Infinity;
      const n = Math.min(queue.length, free, 40);
      for (let i = 0; i < n; i++) { queue.shift(); units.push(mk(0, city.q, city.r)); }
    };
    // wczytanie duzego stosu (migracja)
    units.push(...fill(0, 0, 0, 1300));
    if (gated) {
      const plan = L.planOversizedStackSplits(units, LIMIT, { canPlaceAt: place });
      for (const mv of plan.moves) { const u = units.find(x => x.id === mv.unitId); u.q = mv.toQ; u.r = mv.toR; }
    }
    check('load');
    const rnd = rng(12345);
    // gracz: ruch + scalenie; AI: wlasciciel 1 z wlasnym miastem
    units.push(...fill(1, 5, 5, 480));
    for (let t = 0; t < turns; t++) {
      recruitCity(1 + Math.floor(rnd() * 80)); check('recruit');
      births(); check('births');
      // gracz: losowy stos przesuwa sie na losowy sasiedni heks (czesto na wlasny stos = scalenie)
      for (let i = 0; i < 12; i++) {
        const src = units[Math.floor(rnd() * units.length)];
        if (!src) break;
        const stack = units.filter(u => u.ownerId === src.ownerId && u.q === src.q && u.r === src.r);
        const mover = stack.slice(0, 1 + Math.floor(rnd() * stack.length));
        const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];
        const d = dirs[Math.floor(rnd() * 6)];
        const nq = src.q + d[0], nr = src.r + d[1];
        if (!place(src.ownerId, nq, nr)) continue;
        if (units.some(u => u.ownerId !== src.ownerId && u.q === nq && u.r === nr)) continue;
        tryMove(mover, nq, nr);
        check('move');
      }
      // siatka bezpieczenstwa na start tury (tylko w wariancie z bramkami)
      if (gated) {
        const plan = L.planOversizedStackSplits(units, LIMIT, { canPlaceAt: place });
        for (const mv of plan.moves) { const u = units.find(x => x.id === mv.unitId); u.q = mv.toQ; u.r = mv.toR; }
      }
      check('turn' + t);
    }
    return { violations, max: maxStack(units), total: units.length };
  }
  {
    const g = simulate(true, 60);
    ok(g.violations.length === 0, 'D1 petla 60 tur z bramkami: niezmiennik trzyma po kazdej operacji (max=' + g.max + ')');
    ok(g.total > 1780, 'D2 nic nie ginie w petli (lacznie ' + g.total + ')');
    const bad = simulate(false, 60);
    ok(bad.violations.length > 0, 'E1 mutacja (brak bramek) LAMIE niezmiennik: ' + bad.violations.slice(0, 3).join(','));
    // mutacja pojedynczych bramek
    const once = (name, fn) => { const r = fn(); ok(r, name); };
    once('E2 bez bramki ruchu stos przekracza limit', () => {
      const us = fill(0, 0, 0, LIMIT); const m = [mk(0, 1, 0)]; const all = [...us, ...m];
      for (const u of m) { u.q = 0; u.r = 0; } // ruch bez bramki
      return maxStack(all) > LIMIT && !L.canJoinStackAt([...us, ...m.map(x => ({ ...x, q: 1, r: 0 }))], m.map(x => ({ ...x, q: 1, r: 0 })), 0, 0, LIMIT);
    });
    once('E3 bez bramki rekrutacji stos przekracza limit', () => {
      const us = fill(0, 0, 0, LIMIT);
      return !L.hexHasRoomFor(us, 0, 0, 0, LIMIT, 1) && L.stackFreeSlots(us, 0, 0, 0, LIMIT) === 0;
    });
  }

  // ---------------- [G] wejscie po poddaniu miasta respektuje limit (R-WEB-ARMY-STACK-LIMIT-Q1 poprawka zarzutu 1) ----------------
  {
    const deps = { isCivilian: () => false, stackLimit: LIMIT };
    const city = { id: 'c1', q: 3, r: 0 };
    const mkU = (id, ownerId, q, r) => ({ id, ownerId, q, r, oblegaCityId: 'c1' });
    // miasto pelne (LIMIT wlasnych jednostek na heksie) -> grupa 2 jednostek nie wchodzi
    const full = [...Array.from({ length: LIMIT }, (_, i) => ({ id: 'g' + i, ownerId: 0, q: 3, r: 0 })),
      mkU('a', 0, 2, 0), mkU('b', 0, 2, 0)];
    ok(L.planSurrenderEntry(full, city, 0, deps).length === 0, 'G1 pelne miasto: grupa nie wchodzi ponad limit');
    // miasto z miejscem na 2 -> grupa wchodzi, stos = LIMIT
    const room2 = [...Array.from({ length: LIMIT - 2 }, (_, i) => ({ id: 'g' + i, ownerId: 0, q: 3, r: 0 })),
      mkU('a', 0, 2, 0), mkU('b', 0, 2, 0)];
    const entered = L.enterCityAfterSurrender(room2, city, 0, deps);
    ok(entered.length === 2 && maxStack(room2) === LIMIT, 'G2 grupa miesci sie dokladnie do limitu');
    // bez pola stackLimit zachowanie sprzed zmiany (bez limitu)
    const legacy = L.planSurrenderEntry(full, city, 0, { isCivilian: () => false });
    ok(legacy.length === 2, 'G3 bez stackLimit: zachowanie bez limitu (kompatybilnosc)');
  }

  // ---------------- [H] nagroda chatki nie stawia jednostki na pelnym stosie (poprawka zarzutu 1) ----------------
  {
    // garnizon (inGarnizon) na heksie (1,0) omija test `occupied` -- bez limitu finder go wybiera
    const garrison = Array.from({ length: LIMIT }, (_, i) => ({ id: 'gz' + i, ownerId: 0, q: 1, r: 0, inGarnizon: true }));
    // jedyny przechodni heks to (1,0) -- inne sasiedztwo zablokowane
    const input = { hutQ: 0, hutR: 0, ownerId: 0, units: garrison, cities: [], isPassable: (q, r) => q === 1 && r === 0 };
    const without = L.findVillageRewardSpawnHex(input);
    ok(without && without.q === 1 && without.r === 0, 'H1 (kontrola bledu) bez limitu finder wybiera heks z pelnym garnizonem');
    const withLim = L.findVillageRewardSpawnHex({ ...input, stackLimit: LIMIT });
    ok(withLim === undefined, 'H2 z limitem: pelny heks odrzucony, brak kandydata (' + JSON.stringify(withLim) + ')');
  }

  // ---------------- [F] okablowanie main.ts ----------------
  {
    const count = (re) => (mainSrc.match(re) || []).length;
    ok(count(/hexHasRoomFor\(units, city\.ownerId, city\.q, city\.r, armyStackLimit\(\)\)/g) === 1, 'F1 narodziny produkcji jednostki (applyProductionCompleted) maja bramke');
    ok(count(/stackFreeSlots\(units, city\.ownerId, city\.q, city\.r, armyStackLimit\(\)\)/g) === 1
      && /Math\.min\(unitRecruitmentCapacityPerTurn\(/.test(mainSrc) && /recStackFree <= 0/.test(mainSrc), 'F2 narodziny z kolejki rekrutacji sa ograniczone wolnymi miejscami');
    ok(count(/hexHasRoomFor\(units, ownerId, city\.q, city\.r, armyStackLimit\(\)/g) === 2, 'F3 zakup (pojedynczy i partia) ma bramke');
    ok(/!attackTarget && !canJoinStackAt\(units, stack, destQ, destR, armyStackLimit\(\)\)/.test(mainSrc), 'F4 cel marszu gracza (planMarchTo) ma bramke');
    ok(/!canJoinStackAt\(units, stack, moveDestQ, moveDestR, armyStackLimit\(\)\)/.test(mainSrc), 'F5 ruch bezposredni gracza ma bramke');
    ok(count(/trimPathToStackRoom\(units, stack, result\.movePath, armyStackLimit\(\)\)/g) === 2
      && /roomPathInstant/.test(mainSrc), 'F6 segmenty marszu (animowany i natychmiastowy) przycinaja trase do miejsca w stosie');
    ok(/if \(!canJoinStackAt\(units, stack, u\.q, u\.r, armyStackLimit\(\)\)\) continue;/.test(mainSrc), 'F7 pelny stos nie jest celem scalenia (reachableWithMergeTargets)');
    ok(/truncatePath: \(fullPath\) => trimPathToStackRoom\(\s*units,\s*\[u\],/.test(mainSrc), 'F8 trasa ruchu AI jest przycinana do miejsca w stosie (pelny stos = brak ruchu)');
    ok(/enforceArmyStackLimit\('wczytanie zapisu'\)/.test(mainSrc), 'F9 migracja przy wczytaniu zapisu');
    ok(/enforceArmyStackLimit\('start tury'\)/.test(mainSrc), 'F10 siatka bezpieczenstwa na starcie tury');
    ok(/ownUnitCountAt\(units, active\.ownerId, destQ, destR, new Set\(ids\)\) \+ splitArrivals\.length > armyStackLimit\(\)/.test(mainSrc), 'F12 rozdzielenie armii (onSplit) nie przepelnia stosu docelowego');
    ok(/\.filter\(d => \(d\.q === active\.q && d\.r === active\.r\)\s*\|\| stackFreeSlots\(units, active\.ownerId, d\.q, d\.r, armyStackLimit\(\)\) > 0\)/.test(mainSrc), 'F13 panel rozdzielenia nie oferuje pelnych sasiednich heksow');
    ok(/stackLimit: armyStackLimit\(\) \}\)/.test(mainSrc), 'F14 wejscie po poddaniu dostaje limit stosu');
    ok(/exploredHexes: explored,\s*stackLimit: armyStackLimit\(\)/.test(mainSrc), 'F16 nagroda chatki dostaje limit stosu');
    ok(/function spawnDifficultyBonusUnit[\s\S]{0,200}hexHasRoomFor\(units, ownerId, q, r, armyStackLimit\(\)\)/.test(mainSrc), 'F15 startowe jednostki bonusowe respektuja limit');
    ok(/battleReserveNotice/.test(mainSrc) || /battleReserveNotice/.test(fs.readFileSync(path.join(ROOT, 'src/game/post-battle-map.ts'), 'utf8')), 'F11 komunikat rezerwy (battleReserveNotice) zachowany');
  }

  console.log('army-stack-limit-test: ' + pass + ' asercji, wszystkie OK');
})().catch(e => { console.error('FAIL', e && e.stack || e); process.exit(1); });
