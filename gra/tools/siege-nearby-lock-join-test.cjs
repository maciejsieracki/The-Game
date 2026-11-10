'use strict';
/**
 * siege-nearby-lock-join-test.cjs -- R-WEB-SIEGE-NEARBY-UNIT-LOCK-AND-JOIN-BESIEGING-ARMY-Q1.
 * Reguly:
 *  1. Blokada oblężenia (oblegaCityId + ruchLeft=0) dotyczy WYŁĄCZNIE stosu faktycznie oblegającego.
 *     Sąsiadujący stos tego samego właściciela przy murze zostaje wolny (ruch działa).
 *  2. Jednostka może dołączyć do armii OBLEGAJĄCEJ (poza miastem); dołączająca przejmuje oblegaCityId,
 *     a liczniki oblężenia (City) się nie resetują.
 *  3. Dołączenie do armii w MIEŚCIE (garnizon) nadal zabronione.
 *
 * Część A: JEDNOSTKOWA (realne src/game/armyMerge.ts, esbuild) -- zachowanie, nie regexy.
 * Część B: STRUKTURALNA main.ts (commitBesiege / startMapSiege / endMapSiege / promptMergeIfCoLocated).
 * Część C: ŻYWA (Chromium) -- NIE_ZMIERZONO w tym przebiegu (brak przeglądarki w kontenerze sesji).
 * Run z gra/:  node tools/siege-nearby-lock-join-test.cjs
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  [OK] ' + m); } else { fail++; console.log('  [FAIL] ' + m + (d ? ' -- ' + d : '')); } };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'snlj-'));

console.log('A. JEDNOSTKOWA (armyMerge.ts)');
const entry = path.join(tmp, 'entry.ts');
const out = path.join(tmp, 'bundle.cjs');
fs.writeFileSync(entry,
  `export { besiegingUnitsOnHex, inheritSiegeOnJoin, coLocatedForMergePrompt, besiegeArmyGroups, besiegeLockTargets, stackGroupIdOf } from ${JSON.stringify(GRA + '/src/game/armyMerge')};\n`);
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: out, logLevel: 'error', absWorkingDir: GRA, nodePaths: [path.join(GRA, 'node_modules')] });
const M = require(out);

const U = (id, o = {}) => ({ id, ownerId: 0, q: 5, r: 5, ruchLeft: 2, inGarnizon: false, ...o });
const CITY = { id: 'c1', q: 5, r: 5 };

// A1. Wybór armii oblegającej (poza miastem, bez garnizonu, tylko własne).
{
  const units = [
    U('besieger', { oblegaCityId: 'c1', ruchLeft: 0 }),
    U('garn', { inGarnizon: true, oblegaCityId: 'c1' }),
    U('plain'),
    U('otherHex', { q: 6, oblegaCityId: 'c1' }),
    U('foreign', { ownerId: 1, oblegaCityId: 'c1' }),
  ];
  const b = M.besiegingUnitsOnHex(units, 5, 5, 0).map(u => u.id);
  ok(b.length === 1 && b[0] === 'besieger', 'besiegingUnitsOnHex: tylko oblegający poza garnizonem na tym heksie', JSON.stringify(b));
  ok(M.besiegingUnitsOnHex(units, 9, 9, 0).length === 0, 'besiegingUnitsOnHex: pusty heks -> brak');
}

// A2. BLOKADA (reguła 1): pierwsze oblężenie, hint = grupa stosu atakującego.
{
  const units = [
    U('besiegerA', { q: 5, r: 4, stackGroupId: 'G1' }),
    U('besiegerB', { q: 4, r: 5, stackGroupId: 'G1' }),
    U('neighbor', { q: 5, r: 6, stackGroupId: 'G2', ruchLeft: 2 }),
    U('far', { q: 9, r: 9, stackGroupId: 'G3', ruchLeft: 2 }),
  ];
  const groups = M.besiegeArmyGroups(units, 'c1', 0, 'G1', M.stackGroupIdOf);
  const targets = M.besiegeLockTargets(units, CITY, 0, groups, M.stackGroupIdOf).map(u => u.id).sort();
  ok(targets.join(',') === 'besiegerA,besiegerB', 'blokada: cele = tylko armia oblegająca przy murze', targets.join(','));
  // Symulacja commitBesiege: zastosuj oznaczenie i sprawdź, że sąsiad się rusza.
  for (const t of M.besiegeLockTargets(units, CITY, 0, groups, M.stackGroupIdOf)) { t.oblegaCityId = 'c1'; t.ruchLeft = 0; }
  const nb = units.find(u => u.id === 'neighbor');
  ok(nb.oblegaCityId === undefined && nb.ruchLeft === 2, 'blokada: sąsiedni stos nieoblegający NIE zablokowany (ruch 2 zachowany)', JSON.stringify(nb));
  ok(units.find(u => u.id === 'besiegerA').ruchLeft === 0, 'blokada: oblegający dostaje ruchLeft=0');
}

// A3. Ścieżka AI (groups undefined): dawne zachowanie, wszyscy sąsiedzi.
{
  const units = [U('a', { q: 5, r: 4 }), U('b', { q: 5, r: 6 })];
  const t = M.besiegeLockTargets(units, CITY, 0, undefined, M.stackGroupIdOf).map(u => u.id).sort();
  ok(t.join(',') === 'a,b', 'AI (bez grup): wszyscy sąsiedzi jak dotąd', t.join(','));
}

// A4. Grupy z ŻYWYCH jednostek oblegających (odporne na scalenie/podział), nie ze starego hintu.
{
  const units = [
    U('besiegerA', { q: 5, r: 4, stackGroupId: 'G9', oblegaCityId: 'c1' }),
    U('besiegerB', { q: 4, r: 5, stackGroupId: 'G9', oblegaCityId: 'c1' }),
    U('neighbor', { q: 5, r: 6, stackGroupId: 'G2', ruchLeft: 2 }),
  ];
  const groups = M.besiegeArmyGroups(units, 'c1', 0, 'G1', M.stackGroupIdOf);
  const t = M.besiegeLockTargets(units, CITY, 0, groups, M.stackGroupIdOf).map(u => u.id).sort();
  ok(groups.has('G9') && !groups.has('G1'), 'grupy po scaleniu: z jednostek (G9), nie ze starego hintu (G1)', [...groups].join(','));
  ok(t.join(',') === 'besiegerA,besiegerB', 'po scaleniu: ponowne oblężenie obejmuje scalonych oblegających');
  units[1].stackGroupId = 'G10';
  const g2 = M.besiegeArmyGroups(units, 'c1', 0, 'G1', M.stackGroupIdOf);
  const t2 = M.besiegeLockTargets(units, CITY, 0, g2, M.stackGroupIdOf).map(u => u.id).sort();
  ok(t2.join(',') === 'besiegerA,besiegerB' && !t2.includes('neighbor'), 'po podziale: obie części armii oblegającej zablokowane, sąsiad wolny', t2.join(','));
}

// A5. Dołączenie (reguła 2): dołączająca jednostka przejmuje oblegaCityId; City nietknięte (sygnatura bez City).
{
  const besiegers = [U('besieger', { oblegaCityId: 'c1', ruchLeft: 0 })];
  const before = JSON.stringify(besiegers);
  const arriving = [U('new1'), U('new2', { oblegaCityId: 'c1' })];
  const taken = M.inheritSiegeOnJoin(arriving, besiegers);
  ok(taken === 1 && arriving[0].oblegaCityId === 'c1', 'dołączenie: dołączająca jednostka przejmuje oblegaCityId armii');
  ok(JSON.stringify(besiegers) === before, 'dołączenie: stan armii oblegającej nietknięty (tylko przyjmujący się zmienia)');
  ok(M.inheritSiegeOnJoin.length === 2, 'dołączenie: funkcja nie przyjmuje City -- liczniki oblężenia (City) nie mogą się zmienić');
  const none = [U('x')];
  ok(M.inheritSiegeOnJoin(none, [U('plain')]) === 0 && none[0].oblegaCityId === undefined, 'dołączenie: brak oblegających -> bez zmian');
}
{
  const units = [U('a'), U('b', { q: 5, r: 5 }), U('besieger', { oblegaCityId: 'c1' })];
  const co = M.coLocatedForMergePrompt(units, 5, 5, 0).map(u => u.id).sort();
  ok(co.join(',') === 'a,b', 'coLocatedForMergePrompt: nadal bez oblegających (reguła zachowana)', co.join(','));
}

console.log('B. STRUKTURALNA (main.ts)');
const mainSrc = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');
const fnBody = (name, len = 2500) => {
  const i = mainSrc.indexOf(name);
  return i < 0 ? '' : mainSrc.slice(i, i + len);
};
const commit = fnBody('function commitBesiege(', 1800);
ok(/besiegeArmyGroups\(units, cityId, bId, city\.siegeArmyGroupId/.test(commit),
  'commitBesiege: grupy oblegających liczone przez besiegeArmyGroups');
ok(/besiegeLockTargets\(units, city, bId, armyGroups/.test(commit), 'commitBesiege: cele blokady przez besiegeLockTargets');
ok(/isHuman\(bId\)/.test(commit), 'commitBesiege: zawężenie dla KAŻDEGO gracza-człowieka (nie tylko ownerId 0)');
const start = fnBody('function startMapSiege(', 3000);
ok(/city\.siegeArmyGroupId = isHuman\(ctx\.oblegajacyOwnerId\) \? stackGroupIdOfAnchor\(ctx\.atakujacy\)/.test(start),
  'startMapSiege: zapisuje grupę atakującego stosu dla każdego gracza-człowieka');
const end = fnBody('function endMapSiege(', 900);
ok(/delete city\.siegeArmyGroupId/.test(end), 'endMapSiege: czyści zapis grupy armii');
const merge = fnBody('function promptMergeIfCoLocated(', 6000);
ok(/besiegingUnitsOnHex\(units, rep\.q, rep\.r, rep\.ownerId\)/.test(merge)
  && /inheritSiegeOnJoin\(arrivingUnits, besiegersHere\)/.test(merge),
  'promptMergeIfCoLocated: armia oblegająca jest celem dołączenia i przejmuje stan oblężenia');
ok(!/siegeTurnByCity\.set\([^)]*\)/.test(merge), 'promptMergeIfCoLocated: nie resetuje liczników oblężenia');
ok(/besiegedCity\.siegeArmyGroupId = stackGroupIdOfAnchor\(rep\)/.test(merge),
  'promptMergeIfCoLocated: odświeża zapasowy hint grupy po scaleniu');
ok(/besiegingUnitsOnHex,\s*inheritSiegeOnJoin,\s*besiegeArmyGroups,\s*besiegeLockTargets/.test(mainSrc),
  'main.ts importuje helpery armyMerge');

console.log('C. ZYWA (Chromium)');
console.log('  [NIE_ZMIERZONO] brak przegladarki w kontenerze sesji; sprawdzenie na zywo do wykonania w ROBOCZEJ');

console.log(`\nWYNIK: ${pass} OK, ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
