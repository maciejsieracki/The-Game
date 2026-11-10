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
 * Część A: JEDNOSTKOWA (realne src/game/armyMerge.ts, esbuild).
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
  `export { besiegingUnitsOnHex, inheritSiegeOnJoin, coLocatedForMergePrompt } from ${JSON.stringify(GRA + '/src/game/armyMerge')};\n`);
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: out, logLevel: 'error', absWorkingDir: GRA, nodePaths: [path.join(GRA, 'node_modules')] });
const M = require(out);

const U = (id, o = {}) => ({ id, ownerId: 0, q: 5, r: 5, ruchLeft: 2, inGarnizon: false, ...o });
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
{
  const city = { id: 'c1', oblegane: true, siegeTurn: 7 };
  const arriving = [U('new1'), U('new2', { oblegaCityId: 'c1' })];
  const besiegers = [U('besieger', { oblegaCityId: 'c1', ruchLeft: 0 })];
  const taken = M.inheritSiegeOnJoin(arriving, besiegers);
  ok(taken === 1 && arriving[0].oblegaCityId === 'c1', 'inheritSiegeOnJoin: dołączająca jednostka przejmuje oblegaCityId armii');
  ok(city.siegeTurn === 7 && city.oblegane === true, 'inheritSiegeOnJoin: liczniki/stan miasta nietknięte');
  const none = [U('x')];
  ok(M.inheritSiegeOnJoin(none, [U('plain')]) === 0 && none[0].oblegaCityId === undefined, 'inheritSiegeOnJoin: brak oblegających -> bez zmian');
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
ok(/city\.siegeArmyGroupId/.test(commit) && /stackGroupIdOfAnchor\(u\) !== armyGroup/.test(commit),
  'commitBesiege: marka oblężenia tylko dla stosu armii (stackGroupId), nie dla każdego sąsiada');
const start = fnBody('function startMapSiege(', 3000);
ok(/city\.siegeArmyGroupId = ctx\.oblegajacyOwnerId === 0 \? stackGroupIdOfAnchor\(ctx\.atakujacy\)/.test(start),
  'startMapSiege: zapisuje grupę atakującego stosu dla miasta gracza');
const end = fnBody('function endMapSiege(', 900);
ok(/delete city\.siegeArmyGroupId/.test(end), 'endMapSiege: czyści zapis grupy armii');
const merge = fnBody('function promptMergeIfCoLocated(', 4000);
ok(/besiegingUnitsOnHex\(units, rep\.q, rep\.r, rep\.ownerId\)/.test(merge)
  && /inheritSiegeOnJoin\(arrivingUnits, besiegersHere\)/.test(merge),
  'promptMergeIfCoLocated: armia oblegająca jest celem dołączenia i przejmuje stan oblężenia');
ok(!/siegeTurnByCity\.set\([^)]*\)/.test(merge), 'promptMergeIfCoLocated: nie resetuje liczników oblężenia');
ok(/import \{[^}]*besiegingUnitsOnHex[^}]*inheritSiegeOnJoin[^}]*\} from '\.\/game\/armyMerge'/.test(mainSrc),
  'main.ts importuje besiegingUnitsOnHex i inheritSiegeOnJoin');

console.log('C. ZYWA (Chromium)');
console.log('  [NIE_ZMIERZONO] brak przegladarki w kontenerze sesji; sprawdzenie na zywo do wykonania w ROBOCZEJ');

console.log(`\nWYNIK: ${pass} OK, ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
