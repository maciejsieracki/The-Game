'use strict';
/**
 * army-split-besieging-no-siege-lock-test.cjs -- R-WEB-ARMY-SPLIT-BESIEGING-ARMY-NO-SIEGE-LOCK-Q2.
 * Regres (zgloszenie wlasciciela 2026-11-16): armia gracza oblega miasto (commitBesiege: oblegaCityId +
 * ruchLeft=0). Gdy gracz ROZDZIELA ja (panel Rozdziel -> onSplit w main.ts), wydzielone jednostki NIE moga
 * zostac w oblezeniu ani miec zakazu ruchu. Pozostala czesc nadal oblega.
 *
 * Czesc A: JEDNOSTKOWA na realnym src/game/armyMerge.ts (esbuild) -- zachowanie, nie regexy.
 *   A1 reprodukcja: rozdzielenie bez zwolnienia zostawia wydzielone w oblezeniu (ruchLeft=0).
 *   A2 poprawka: releaseSplitFromSiege zdejmuje oblegaCityId i przywraca ruchLeft = ruch.
 *   A3 pozostala czesc nadal oblega; grupy oblegajacych nie zawieraja wydzielonych.
 *   A4 tura: wydzielone nie sa zerowane co ture i maja pule ruchu > 0.
 *   A5 laczenie: wydzielona armia dolaczona do oblegajacych przejmuje oblezenie (inheritSiegeOnJoin).
 * Czesc B: STRUKTURALNA main.ts (onSplit wywoluje releaseSplitFromSiege PRZED kosztem ruchu;
 *   zdjecie z murow, gdy nikt nie zostaje przy murze).
 * ARMY_MERGE_SRC (opcjonalnie) -- sciezka kopii armyMerge.ts do testu mutacji (cofnieta poprawka).
 * Run z gra/:  node tools/army-split-besieging-no-siege-lock-test.cjs
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  [OK] ' + m); } else { fail++; console.log('  [FAIL] ' + m + (d ? ' -- ' + d : '')); } };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'asbnl-'));

const armySrc = process.env.ARMY_MERGE_SRC
  ? path.resolve(process.env.ARMY_MERGE_SRC)
  : path.join(GRA, 'src', 'game', 'armyMerge.ts');
const entry = path.join(tmp, 'entry.ts');
const out = path.join(tmp, 'bundle.cjs');
fs.writeFileSync(entry,
  `export { besiegeLockTargets, besiegeArmyGroups, inheritSiegeOnJoin, releaseSplitFromSiege, stackGroupIdOf, stackRuchLeft, unitWithStackRuch } from ${JSON.stringify(armySrc)};\n`);
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: out, logLevel: 'error', absWorkingDir: GRA, nodePaths: [path.join(GRA, 'node_modules')] });
const M = require(out);

// Jednostka pola: pelna pula ruch = 3, ruchLeft = 3 przed blokada.
const U = (id, o = {}) => ({ id, ownerId: 0, typeId: 'test', q: 5, r: 4, ruch: 3, ruchLeft: 3, inGarnizon: false, stackGroupId: 'G1', ...o });
const CITY = { id: 'c1', q: 5, r: 5 };

// Stan po commitBesiege: 4 jednostki przy murze (q=5,r=4 sasiad miasta), grupa G1.
function besiegedArmy() {
  const units = [U('a'), U('b'), U('c'), U('d')];
  const groups = M.besiegeArmyGroups(units, 'c1', 0, 'G1', M.stackGroupIdOf);
  for (const t of M.besiegeLockTargets(units, CITY, 0, groups, M.stackGroupIdOf)) {
    t.oblegaCityId = 'c1';
    t.ruchLeft = 0;
  }
  return units;
}
// Turn-loop (main.ts start tury): pelna pula, oblegajacy zerowani.
function turnReset(units) {
  for (const u of units) {
    u.ruchLeft = u.ruch;
    if (u.oblegaCityId) u.ruchLeft = 0;
  }
}

console.log('A1. REPRODUKCJA: rozdzielenie bez zwolnienia (stan sprzed poprawki)');
{
  const units = besiegedArmy();
  const split = [units[0], units[1]]; // wydzielone: a, b
  // Stan sprzed poprawki: onSplit przesuwa jednostki i odejmuje koszt; oblegaCityId zostaje.
  for (const u of split) { u.q = 6; u.r = 4; u.ruchLeft = Math.max(0, M.stackRuchLeft(split) - 1); }
  const bad = split.filter(u => u.oblegaCityId === 'c1' && u.ruchLeft === 0);
  ok(bad.length === 2, 'przed poprawka: wydzielone nadal oblegaja (oblegaCityId) i maja ruchLeft=0 (czerwony)',
    JSON.stringify(split.map(u => [u.id, u.oblegaCityId, u.ruchLeft])));
}

console.log('A2. POPRAWKA: releaseSplitFromSiege zdejmuje oblezenie i przywraca normalny ruch');
{
  const units = besiegedArmy();
  const split = [units[0], units[1]];
  const cityId = M.releaseSplitFromSiege(split);
  ok(cityId === 'c1', 'zwraca id miasta, z ktorego wydzielono', String(cityId));
  ok(split.every(u => u.oblegaCityId === undefined), 'wydzielone: oblegaCityId wyczyszczone');
  ok(split.every(u => u.ruchLeft === u.ruch && u.ruchLeft > 0), 'wydzielone: ruchLeft = ruch (> 0), nie zerowa blokada',
    JSON.stringify(split.map(u => u.ruchLeft)));
  ok(M.stackRuchLeft(split) > 0, 'pula ruchu wydzielonego stosu > 0 (wykonalny ruch)');
  ok(M.releaseSplitFromSiege([units[2]]) === 'c1' && units[2].oblegaCityId === undefined,
    'zwolnienie dziala tez dla pojedynczej jednostki');
  ok(M.releaseSplitFromSiege([U('plain')]) === undefined, 'jednostka spoza oblezenia: brak zmian, undefined');
}

console.log('A3. Pozostala czesc nadal oblega; wydzielone nie naleza do grup oblegajacych');
{
  const units = besiegedArmy();
  const split = [units[0], units[1]];
  M.releaseSplitFromSiege(split);
  const remain = units.filter(u => !split.includes(u));
  ok(remain.every(u => u.oblegaCityId === 'c1' && u.ruchLeft === 0), 'reszta armii: oblegaCityId=c1, ruchLeft=0');
  // Wydzielone dostaja nowy stackGroupId (jak w onSplit: assignSharedStackGroupId) -- zbior grup = tylko stare.
  for (const u of split) u.stackGroupId = 'G-split';
  const groups = M.besiegeArmyGroups(units, 'c1', 0, 'G1', M.stackGroupIdOf);
  ok(groups.size === 1 && groups.has('G1'), 'besiegeArmyGroups: tylko grupa oblegajacych (G1), bez G-split', [...groups].join(','));
}

console.log('A4. Po kolejnej turze: wydzielone nie wracaja do blokady i maja pule ruchu');
{
  const units = besiegedArmy();
  const split = [units[0], units[1]];
  M.releaseSplitFromSiege(split);
  turnReset(units);
  ok(split.every(u => u.ruchLeft === u.ruch && u.ruchLeft > 0), 'po resecie tury: wydzielone ruchLeft = ruch (> 0)');
  ok(units.filter(u => !split.includes(u)).every(u => u.ruchLeft === 0), 'po resecie tury: reszta oblegajacych nadal ruchLeft=0');
  const unitOnStack = M.unitWithStackRuch(split[0], split);
  ok(unitOnStack.ruchLeft > 0, 'unitWithStackRuch (pathfinding) daje pule > 0 dla wydzielonego stosu');
}

console.log('A5. Laczenie z powrotem do armii oblegajacej przejmuje oblezenie (nie psuje stanu)');
{
  const units = besiegedArmy();
  const split = [units[0], units[1]];
  M.releaseSplitFromSiege(split);
  const besiegers = units.filter(u => u.oblegaCityId === 'c1');
  const taken = M.inheritSiegeOnJoin(split, besiegers);
  ok(taken === 2 && split.every(u => u.oblegaCityId === 'c1'), 'dolaczenie wydzielonych do oblegajacych: przejete oblezenie (2)', String(taken));
}

console.log('B. STRUKTURALNA main.ts: onSplit zwalnia wydzielone PRZED kosztem ruchu');
{
  const src = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');
  const iSplitCall = src.indexOf('onSplit: (ids, destQ, destR) => {');
  const iRel = src.indexOf('releaseSplitFromSiege(splitArrivals)');
  const iCost = src.indexOf('splitMoveCost(', iRel);
  ok(iSplitCall > 0 && iRel > iSplitCall, 'releaseSplitFromSiege(splitArrivals) wywolane wewnatrz onSplit');
  ok(iRel > 0 && iCost > iRel, 'zwolnienie wykonane przed liczeniem kosztu dojscia (splitMoveCost)');
  const iEnd = src.indexOf('endMapSiege(splitFromSiegeCityId)');
  ok(iEnd > iRel, 'zdjecie z murow (endMapSiege) gdy nikt nie zostaje przy murze');
}

console.log('');
console.log('PASS ' + pass + ' / FAIL ' + fail);
process.exit(fail === 0 ? 0 : 1);
