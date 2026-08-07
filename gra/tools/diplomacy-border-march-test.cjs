'use strict';
/** diplomacy-border-march-test.cjs — P5 kara przemarszu (D3-BORD) */
const fs = require('fs');
const path = require('path');

const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.dip-border-march-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-border-march-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  hasAuthorizedBorderCrossing,
  applyUnauthorizedBorderPenalties,
  loadBorderMarchParams,
  dedupeBorderMarchPairs,
  classifyPlayerBorderMarchNotice,
} from '../src/game/diplomacy-border-march.ts';
export { addTreaty } from '../src/game/diplomacy-treaties.ts';
export { diploPairKey } from '../src/game/diplomacy-pn-engine.ts';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE,
  logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const M = require(BUNDLE);

let pass = 0;
let fail = 0;
function ok(c, m) {
  if (c) { pass++; console.log('  OK:', m); }
  else { fail++; console.error('  FAIL:', m); }
}

const params = M.loadBorderMarchParams();
ok(params.karaPrzemarszNieautoryzowany_zaufanie_perTura === 5, 'param JSON = 5');

const neutralRel = { zaufanie: 50, respekt: 30, status: 'neutralni' };
const relKey = M.diploPairKey(1, 2);
const baseRels = new Map([[relKey, { ...neutralRel }]]);

const emptyTreaties = [];
const resolveCivil = () => ({
  treaties: emptyTreaties,
  isMilitary: false,
  relation: neutralRel,
});

console.log('diplomacy-border-march-test');

// 1) jedna para bez traktatu → −5
const r1 = M.applyUnauthorizedBorderPenalties(
  [{ intruderOwnerId: 1, territoryOwnerId: 2 }],
  baseRels,
  params,
  resolveCivil,
);
ok(r1.penalizedPairs === 1, 'jedna para → kara');
ok(r1.relations.get(relKey).zaufanie === 45, '−5 Zaufanie jedna para');

// 2) trzy jednostki tej samej pary → nadal −5 (dedupe)
const rels2 = new Map([[relKey, { zaufanie: 50, respekt: 30, status: 'neutralni' }]]);
const r2 = M.applyUnauthorizedBorderPenalties(
  [
    { intruderOwnerId: 1, territoryOwnerId: 2 },
    { intruderOwnerId: 1, territoryOwnerId: 2 },
    { intruderOwnerId: 1, territoryOwnerId: 2, isMilitary: true },
  ],
  rels2,
  params,
  (pair) => ({
    treaties: emptyTreaties,
    isMilitary: pair.isMilitary === true,
    relation: neutralRel,
  }),
);
ok(r2.penalizedPairs === 1, '3 jednostki = 1 kara');
ok(r2.relations.get(relKey).zaufanie === 45, '3 jednostki = −5 (nie −15)');

// 3) sojusz → 0 kary
let deals = M.addTreaty([], {
  id: 's1', rodzaj: 'sojusz_pelny', strony: [1, 2], wygasaTura: null,
});
const rels3 = new Map([[relKey, { zaufanie: 50, respekt: 30, status: 'sojusz' }]]);
const r3 = M.applyUnauthorizedBorderPenalties(
  [{ intruderOwnerId: 1, territoryOwnerId: 2, isMilitary: true }],
  rels3,
  params,
  () => ({ treaties: deals, isMilitary: true, relation: { ...neutralRel, status: 'sojusz' } }),
);
ok(r3.penalizedPairs === 0, 'sojusz = 0 kary');
ok(r3.relations.get(relKey).zaufanie === 50, 'sojusz: Zaufanie bez zmian');

// 4) otwarte granice (cywil) → 0 kary
deals = M.addTreaty([], {
  id: 'og1', rodzaj: 'otwarte_granice', strony: [1, 2], wygasaTura: null,
});
const r4 = M.applyUnauthorizedBorderPenalties(
  [{ intruderOwnerId: 1, territoryOwnerId: 2 }],
  baseRels,
  params,
  () => ({ treaties: deals, isMilitary: false, relation: neutralRel }),
);
ok(r4.penalizedPairs === 0, 'otwarte granice = 0 kary');
ok(
  M.hasAuthorizedBorderCrossing(1, 2, { treaties: deals, isMilitary: false }),
  'hasAuthorized: otwarte granice cywil',
);

// 5) BUG-PRZEMARSZ-KOMUNIKAT-OBCY-Q1=C — classifyPlayerBorderMarchNotice: adresat komunikatu.
console.log('classifyPlayerBorderMarchNotice (BUG-PRZEMARSZ-KOMUNIKAT-OBCY-Q1=C)');

const resolveOpenCivil = () => ({ treaties: emptyTreaties, isMilitary: false, relation: neutralRel });

// 5a) para obcy↔obcy (ani intruz ani wlasciciel = gracz 0) → brak komunikatu w OBIE strony
const n1 = M.classifyPlayerBorderMarchNotice(
  [{ intruderOwnerId: 1, territoryOwnerId: 2 }],
  resolveOpenCivil,
  0,
);
ok(n1.playerBorderViolated === false, 'obcy↔obcy: playerBorderViolated=false');
ok(n1.playerTrespassing === false, 'obcy↔obcy: playerTrespassing=false');

// 5b) gracz jako WLASCICIEL terenu (ktos wszedl na teren gracza) → "granice naruszone"
const n2 = M.classifyPlayerBorderMarchNotice(
  [{ intruderOwnerId: 3, territoryOwnerId: 0 }],
  resolveOpenCivil,
  0,
);
ok(n2.playerBorderViolated === true, 'intruz obcy → gracz wlasciciel: playerBorderViolated=true');
ok(n2.playerTrespassing === false, 'intruz obcy → gracz wlasciciel: playerTrespassing=false');

// 5c) gracz jako INTRUZ (jednostka gracza na cudzym terenie) → "jednostka na cudzym terenie"
const n3 = M.classifyPlayerBorderMarchNotice(
  [{ intruderOwnerId: 0, territoryOwnerId: 4 }],
  resolveOpenCivil,
  0,
);
ok(n3.playerBorderViolated === false, 'gracz intruz na obcym: playerBorderViolated=false');
ok(n3.playerTrespassing === true, 'gracz intruz na obcym: playerTrespassing=true');

// 5d) mieszana tura: obcy↔obcy + gracz-wlasciciel + gracz-intruz jednoczesnie → oba flagi true,
//     para obcy↔obcy nie wplywa na wynik (regresja dla "komunikat dla KAZDEJ ukaranej pary")
const n4 = M.classifyPlayerBorderMarchNotice(
  [
    { intruderOwnerId: 5, territoryOwnerId: 6 },
    { intruderOwnerId: 7, territoryOwnerId: 0 },
    { intruderOwnerId: 0, territoryOwnerId: 8 },
  ],
  resolveOpenCivil,
  0,
);
ok(n4.playerBorderViolated === true, 'tura mieszana: playerBorderViolated=true (obcy↔obcy zignorowana)');
ok(n4.playerTrespassing === true, 'tura mieszana: playerTrespassing=true (obcy↔obcy zignorowana)');

// 5e) para z graczem, ale AUTORYZOWANA (otwarte granice cywil) → oba flagi false mimo udzialu gracza
const dealsOG = M.addTreaty([], {
  id: 'og-player', rodzaj: 'otwarte_granice', strony: [0, 9], wygasaTura: null,
});
const n5 = M.classifyPlayerBorderMarchNotice(
  [{ intruderOwnerId: 0, territoryOwnerId: 9 }],
  () => ({ treaties: dealsOG, isMilitary: false, relation: neutralRel }),
  0,
);
ok(n5.playerBorderViolated === false, 'otwarte granice + gracz intruz: playerBorderViolated=false');
ok(n5.playerTrespassing === false, 'otwarte granice + gracz intruz: playerTrespassing=false (autoryzowane, brak komunikatu)');

// 5f) sam gracz na wlasnym terenie (intruderOwnerId === territoryOwnerId === 0) nie moze
//     wystapic w praktyce (collectUnauthorizedBorderPairs go filtruje), ale funkcja jest
//     defensywna: hasAuthorizedBorderCrossing zwraca true dla intruz===wlasciciel → oba false.
const n6 = M.classifyPlayerBorderMarchNotice(
  [{ intruderOwnerId: 0, territoryOwnerId: 0 }],
  resolveOpenCivil,
  0,
);
ok(n6.playerBorderViolated === false, 'gracz==gracz (edge case): playerBorderViolated=false');
ok(n6.playerTrespassing === false, 'gracz==gracz (edge case): playerTrespassing=false');

// 5g) ZADANIE 2: barbarzyńca (relacja zawsze 'wojna', C-BARB-Q1) na terenie gracza →
//     hasAuthorizedBorderCrossing traktuje wojnę jako autoryzowaną (brak kary REPUTACYJNEJ,
//     patrz diplomacy-border-march.ts:108) → classifyPlayerBorderMarchNotice też milczy.
const n7 = M.classifyPlayerBorderMarchNotice(
  [{ intruderOwnerId: -1, territoryOwnerId: 0 }],
  () => ({ treaties: emptyTreaties, isMilitary: true, relation: { zaufanie: 0, respekt: 0, status: 'wojna' } }),
  0,
);
ok(n7.playerBorderViolated === false, 'barbarzynca (wojna) na terenie gracza: playerBorderViolated=false (autoryzowane wojną)');
ok(n7.playerTrespassing === false, 'barbarzynca (wojna) na terenie gracza: playerTrespassing=false');

// 5h-5l) R-PRZEMARSZ-ATRYBUCJA-Q1=B (Maciej 2026-08-07): atrybucja (ownerId + q/r) w
// violatingIntruders/trespassedOwners — main.ts tłumaczy ownerId→nazwę (ownerDiploLabel) i
// q/r→skok kamery (axialToWorld+camCtrl.focusAt); ta warstwa tylko niesie dane.
console.log('classifyPlayerBorderMarchNotice — atrybucja q/r + ownerId (R-PRZEMARSZ-ATRYBUCJA-Q1=B)');

// 5h) obcy↔obcy → obie tablice atrybucji puste (regresja n1, teraz sprawdzamy też tablice)
ok(Array.isArray(n1.violatingIntruders) && n1.violatingIntruders.length === 0, 'obcy↔obcy: violatingIntruders=[]');
ok(Array.isArray(n1.trespassedOwners) && n1.trespassedOwners.length === 0, 'obcy↔obcy: trespassedOwners=[]');

// 5i) gracz właściciel, para NIESIE q/r (jak realny BorderMarchPair z border-march-scan.ts) →
// violatingIntruders = [{ ownerId: 3, q: 5, r: -2 }]
const n8 = M.classifyPlayerBorderMarchNotice(
  [{ intruderOwnerId: 3, territoryOwnerId: 0, q: 5, r: -2 }],
  resolveOpenCivil,
  0,
);
ok(n8.violatingIntruders.length === 1, 'intruz z q/r: violatingIntruders ma 1 wpis');
ok(n8.violatingIntruders[0].ownerId === 3, 'intruz z q/r: ownerId=3 (intruderOwnerId, NIE gracz)');
ok(n8.violatingIntruders[0].q === 5 && n8.violatingIntruders[0].r === -2, 'intruz z q/r: q=5,r=-2 (heks pary)');
ok(n8.trespassedOwners.length === 0, 'intruz z q/r: trespassedOwners=[] (gracz nie jest intruzem tu)');

// 5j) para BEZ q/r (jak wywołania 5a-5g bez lokalizacji, np. testy ręczne) → ownerId nadal
// obecny, q/r=undefined (opcjonalne pola BorderMarchPair — wsteczna zgodność)
ok(n2.violatingIntruders.length === 1 && n2.violatingIntruders[0].ownerId === 3, 'n2 bez q/r: ownerId=3 mimo braku lokalizacji');
ok(n2.violatingIntruders[0].q === undefined && n2.violatingIntruders[0].r === undefined, 'n2 bez q/r: q/r=undefined (nie 0 — brak fałszywej lokalizacji)');

// 5k) gracz jako INTRUZ z q/r → trespassedOwners = [{ ownerId: 4, q, r }] (kierunek odwrotny do 5i)
const n9 = M.classifyPlayerBorderMarchNotice(
  [{ intruderOwnerId: 0, territoryOwnerId: 4, q: 10, r: 1 }],
  resolveOpenCivil,
  0,
);
ok(n9.trespassedOwners.length === 1, 'gracz intruz z q/r: trespassedOwners ma 1 wpis');
ok(n9.trespassedOwners[0].ownerId === 4, 'gracz intruz z q/r: ownerId=4 (territoryOwnerId, właściciel terenu)');
ok(n9.trespassedOwners[0].q === 10 && n9.trespassedOwners[0].r === 1, 'gracz intruz z q/r: q=10,r=1');

// 5l) WIELU naruszycieli terenu gracza w JEDNEJ turze (decyzja: agregacja, nie tylko
// pierwszy/najbliższy — main.ts zbiera WSZYSTKIE pozycje do jednego komunikatu z listą nazw)
// → violatingIntruders ma DWIE pozycje z różnymi ownerId, każda z własnym q/r.
const n10 = M.classifyPlayerBorderMarchNotice(
  [
    { intruderOwnerId: 3, territoryOwnerId: 0, q: 5, r: -2 },
    { intruderOwnerId: 7, territoryOwnerId: 0, q: 8, r: 3 },
  ],
  resolveOpenCivil,
  0,
);
ok(n10.playerBorderViolated === true, 'dwoch naruszycieli: playerBorderViolated=true');
ok(n10.violatingIntruders.length === 2, 'dwoch naruszycieli: violatingIntruders ma 2 wpisy (agregacja, nie tylko pierwszy)');
ok(
  n10.violatingIntruders.some(v => v.ownerId === 3 && v.q === 5 && v.r === -2)
    && n10.violatingIntruders.some(v => v.ownerId === 7 && v.q === 8 && v.r === 3),
  'dwoch naruszycieli: obie pary (ownerId 3 i 7) obecne z własnymi q/r',
);

// 6) N8 (R-PRZEMARSZ-ATRYBUCJA-Q1=B naprawa Evaluatora) — dedupeBorderMarchPairs z q/r: dwie
// pary o tym samym kluczu intruz->wlasciciel, rozne q/r → wynik ma q/r PIERWSZEJ pary
// (implementacja: `{...prev, isMilitary: ...}` w dedupeBorderMarchPairs zachowuje q/r z prev).
const dedup1 = M.dedupeBorderMarchPairs([
  { intruderOwnerId: 3, territoryOwnerId: 0, q: 5, r: -2 },
  { intruderOwnerId: 3, territoryOwnerId: 0, q: 8, r: 3 },
]);
ok(dedup1.length === 1, 'dedupe q/r: dwie pary tego samego klucza → jeden wpis');
ok(dedup1[0].q === 5 && dedup1[0].r === -2, 'dedupe q/r: wynik ma q/r PIERWSZEJ pary (5,-2), nie drugiej (8,3)');

try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) {}

console.log(`\n${pass}/${pass + fail} PASS`);
process.exit(fail ? 1 : 0);
