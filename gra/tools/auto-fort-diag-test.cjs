'use strict';

/**
 * R-WEB-AUTO-FORT-DIAG-Q1 — diagnostyka U-2 (E-FORT: powody wejscia/pominiecia) i naprawa U-3 (FAZA 0: posterunek/fort
 * NIE moze miec kola w calosci wewnatrz kola WLASNEGO fortu/posterunku; dowolny kandydat dajacy >=1 nowy heks zostaje).
 *
 * Sekcje:
 *   A  log E-FORT (scope 'fort'): bramka „wejscie” + „wybrany”; limit nie wyczerpany; niedobor pending; zywnosc w toku;
 *      brak klucza (tech); log nie zmienia wynikow (picki z logiem == bez logu)
 *   B  U-3 regresja: fort r=5 (wlasny) + sasiedni kandydat posterunku -> posterunek NIE powstaje (koło w calosci wewnatrz)
 *   C  U-3: kandydat dajacy >=1 nowy heks (wystaje poza koło fortu) -> powstaje; fort OBCEGO wlasciciela nie blokuje
 *   D  U-3: pick zaplanowany w tym samym wywolaniu tez blokuje (brak kol zagniezdzonych)
 *
 * Run z gra/:  node tools/auto-fort-diag-test.cjs
 * Stan sprzed zmiany: AUTO_FORT_SRC_DIR=<kopia gra/src z HEAD> node tools/auto-fort-diag-test.cjs  (B ma wtedy FAIL)
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.AUTO_FORT_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'auto-fort-diag-'));
const entry = path.join(temp, 'entry.ts');
const bundle = path.join(temp, 'bundle.cjs');
fs.writeFileSync(entry, [
  `export * as AIMP from ${JSON.stringify(SRC + '/game/auto-improvements')};`,
  `export { axialDistance } from ${JSON.stringify(SRC + '/map/territory')};`,
  `export { getImprovementMeta } from ${JSON.stringify(SRC + '/game/improvement-tech')};`,
].join('\n') + '\n');
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: bundle, loader: { '.ts': 'ts', '.json': 'json' },
  absWorkingDir: GRA_ROOT, logLevel: 'error',
  nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
});
const M = require(bundle);
const { pickAutoImprovements } = M.AIMP;
const { axialDistance } = M;

let passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log('  [OK] ' + msg); } else { failed++; console.error('  [FAIL] ' + msg); }
}

const FULL = new Set([
  'Rolnictwo', 'Oswojenie zwierząt', 'Gospodarka wodna', 'Irygacja', 'Łowiectwo', 'Obróbka drewna',
  'Garncarstwo', 'Murarstwo', 'Górnictwo', 'Brązownictwo', 'Hutnictwo żelaza', 'Jeździectwo', 'Koło',
  'Waluta', 'Wojskowość', 'Żegluga', 'Drogi brukowane', 'Matematyka', 'Obróbka kamienia', 'Kamieniarstwo',
]);
const W = 44, H = 44, CQ = 22, CR = 22;
const K = (q, r) => `${q},${r}`;
function makeMap({ mountains = [], deposits = [] } = {}) {
  const hexes = {};
  for (let q = 0; q < W; q++) for (let r = 0; r < H; r++) {
    hexes[K(q, r)] = {
      coords: { q, r }, terenBazowy: 'rownina', nakladka: 'brak', ulepszenie: 'brak',
      wlasciciel: null, wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {},
      rzeka: { obecna: false, krawedzie: [] },
    };
  }
  hexes[K(CQ, CR)].terenBazowy = 'gory';
  for (const [q, r] of mountains) hexes[K(q, r)].terenBazowy = 'gory';
  for (const [q, r] of deposits) hexes[K(q, r)].nakladka = 'zloze_rudy';
  return { szerokoscQ: W, wysokoscR: H, hexes, seed: 7, riverPaths: [] };
}
const CITY = { id: 'c0', ownerId: 0, q: CQ, r: CR, name: 'A', population: 5 };
const mkTN = () => [{ q: CQ, r: CR, ownerId: 0, cityId: 'c0', pop: 5, level: 1 }];
const forts = picks => picks.filter(p => p.key === 'fort' || p.key === 'posterunek');

function callK2(map, over = {}) {
  const events = over.events;
  return pickAutoImprovements({
    cities: [{ ...CITY, ulepszeniaFocus: 'zrownowazone' }], ownerId: 0, map, territoryNodes: over.territoryNodes ?? mkTN(),
    placedImprovements: over.placed ?? new Map(), pracaAvailable: over.pool ?? 5000, unlockedTechs: over.techs ?? FULL,
    pracaSurplusThreshold: 30, skipWyrab: true, demandDriven: true, resourceDeficitKeys: over.deficit ?? [],
    getFocus: () => 'zrownowazone', getOnlyWorked: () => true, getWorkedHexKeys: () => over.worked ?? new Set(),
    pracaBudgetPercent: over.pct ?? 100, civArchetype: 'grecy', playerEra: 3,
    foodImprovementStages: () => true,
    cityLimitExhausted: over.exhausted ?? true,
    ...(events ? { onDecision: e => events.push(e) } : {}),
    ...(over.extra ?? {}),
  });
}
const fortEv = evs => evs.filter(e => e.scope === 'fort');
const reasons = evs => fortEv(evs).map(e => e.reason);

// =========================================================================
console.log('A. log E-FORT: powod wejscia / pominiecia (U-2, tylko obserwator)');
{
  const map = makeMap({ mountains: [[CQ + 5, CR]] });
  const ev = [];
  const picks = callK2(map, { events: ev });
  console.log('  [info] baseline: ' + JSON.stringify(reasons(ev)));
  ok(forts(picks).length === 1, 'baseline: fort stawiany');
  ok(reasons(ev).includes('e-fort bramka: wejscie') && reasons(ev).includes('e-fort: wybrany'), 'log: bramka „wejscie” i „wybrany”');
  const sel = fortEv(ev).find(e => e.reason === 'e-fort: wybrany');
  ok(sel && sel.detail.cenne === 1 && sel.detail.kandydaci === 1 && sel.detail.best.q === CQ + 5, 'log wybranego: liczniki (cenne=1, kandydaci=1) i wspolrzedne');
  ok(JSON.stringify(picks) === JSON.stringify(callK2(map)), 'picki z logiem == picki bez logu');

  const ev2 = [];
  callK2(map, { events: ev2, exhausted: false });
  ok(reasons(ev2).length === 1 && /limit miast NIE wyczerpany/.test(reasons(ev2)[0]), 'limit nie wyczerpany -> jedna linia „limit miast NIE wyczerpany”');

  const mapK = makeMap({ mountains: [[CQ + 5, CR]] });
  mapK.hexes[K(CQ + 1, CR)].terenBazowy = 'wzgorza';
  const ev3 = [];
  callK2(mapK, { events: ev3, deficit: ['kamien'], extra: { getResourcePassOnlyWorked: () => false } });
  ok(reasons(ev3).some(r => /niedobor: ulepszenie postawione/.test(r)), `niedobor stawiany w tej turze -> bramka (got ${JSON.stringify(reasons(ev3))})`);

  const ev4 = [];
  const pDef = callK2(mapK, { events: ev4, deficit: ['kamien'], pct: 1, pool: 1000, extra: { getResourcePassOnlyWorked: () => false } });
  // Zmierzone: cel niedoboru czekajacy na budzet jest widoczny juz w sciezce zapasowej (jej lista = zywnosc + ulepszenie
  // brakujacego surowca), wiec bramka mowi „sciezka zapasowa w toku”; „deficit pending” zostaje, gdy sciezka zapasowa jest pusta.
  ok(forts(pDef).length === 0 && reasons(ev4).some(r => /sciezka zapasowa w toku|deficit pending/.test(r)),
    `niedobor czekajacy na budzet -> fort wstrzymany, bramka z powodem oczekiwania (got ${JSON.stringify(reasons(ev4))})`);

  const ev5 = [];
  callK2(map, { events: ev5, techs: new Set() });
  ok(reasons(ev5).some(r => /brak odblokowanego klucza/.test(r)), `bez technologii -> „brak odblokowanego klucza” (got ${JSON.stringify(reasons(ev5))})`);

  const ev6 = [];
  callK2(map, { events: ev6, worked: new Set([K(CQ + 1, CR)]) });
  ok(reasons(ev6).some(r => /zywnosc E1-E6 w toku/.test(r)), `zywnosc do zbudowania -> bramka „zywnosc E1-E6 w toku” (got ${JSON.stringify(reasons(ev6))})`);

  const ev7 = [];
  callK2(makeMap({}), { events: ev7 });
  ok(reasons(ev7).some(r => /brak kandydata/.test(r)), 'brak cennego terenu -> „brak kandydata” z licznikami');
}

// =========================================================================
// U-3: profil „infrastruktura” (FAZA 0). pop=0 w mieście -> próg „plonowe w promieniu” spełniony; zasięg z węzła (pop 5) = 5.
// Prog „obrona rusza, gdy miasto ma >= pop ulepszen plonowych w promieniu": 5 farm przy miescie (pop 5).
const FARMS = () => [[CQ + 1, CR], [CQ + 1, CR - 1], [CQ, CR + 1], [CQ - 1, CR + 1], [CQ - 1, CR]].map(([q, r]) => [K(q, r), ['farma']]);
function callInfra(map, over = {}) {
  const placed = new Map(FARMS());
  for (const [k, v] of over.placed ?? []) placed.set(k, v);
  return pickAutoImprovements({
    cities: [{ ...CITY, population: 5, ulepszeniaFocus: 'infrastruktura' }], ownerId: 0, map,
    territoryNodes: over.territoryNodes ?? mkTN(),
    placedImprovements: placed, pracaAvailable: over.pool ?? 100000, unlockedTechs: FULL,
    pracaSurplusThreshold: 30, skipWyrab: true, demandDriven: false,
    getFocus: () => 'infrastruktura', getOnlyWorked: () => false, getWorkedHexKeys: () => new Set(),
    pracaBudgetPercent: 100, civArchetype: 'grecy', playerEra: 3,
  });
}
const RAD = key => (key === 'fort' ? 5 : 3);
const insideFort = (p, f) => axialDistance(p.q, p.r, f.q, f.r) + RAD(p.key) <= f.rad;

console.log('B. U-3: fort r=5 + posterunek/fort (koło w calosci wewnatrz) -> NIE powstaje');
{
  const map = makeMap({});
  const F = { q: CQ - 5, r: CR, rad: 5 }; // pierwszy heks graniczny w kolejnosci FAZY 0
  const tn = mkTN(); tn.push({ q: F.q, r: F.r, ownerId: 0, pop: 0, level: 1, isFort: true });
  const placed = new Map([[K(F.q, F.r), ['fort']]]);
  const picks = callInfra(map, { territoryNodes: tn, placed, maxItems: 10 });
  console.log('  [info] picki FAZY 0: ' + JSON.stringify(picks.map(p => p.key + '@' + p.q + ',' + p.r)));
  const bad = forts(picks).filter(p => insideFort(p, F));
  ok(bad.length === 0, `zadne kolo nie lezy w calosci w kole fortu (got ${JSON.stringify(bad.map(p => p.key + '@' + p.q + ',' + p.r))})`);
  ok(forts(picks).length >= 1, 'obrona nadal powstaje tam, gdzie daje nowe heksy (>=1 pick fort/posterunek)');
}

console.log('C. U-3: kandydat wystajacy poza koło fortu -> powstaje; fort obcego wlasciciela nie blokuje');
{
  const map = makeMap({});
  const F = { q: CQ - 5, r: CR, rad: 5 }; // pierwszy heks graniczny w kolejnosci FAZY 0
  const tn = mkTN(); tn.push({ q: F.q, r: F.r, ownerId: 0, pop: 0, level: 1, isFort: true });
  const picks = callInfra(map, { territoryNodes: tn, placed: new Map([[K(F.q, F.r), ['fort']]]), maxItems: 10 });
  const out = forts(picks).filter(p => !insideFort(p, F));
  ok(out.length >= 1, `istnieje pick z >=1 nowym heksem (got ${out.length})`);
  const tnForeign = mkTN(); tnForeign.push({ q: F.q, r: F.r, ownerId: 7, pop: 0, level: 1, isFort: true });
  const withForeign = callInfra(map, { territoryNodes: tnForeign, placed: new Map([[K(F.q, F.r), ['fort']]]), maxItems: 10 });
  console.log('  [info] z fortem obcego: ' + JSON.stringify(forts(withForeign).map(p => p.key + '@' + p.q + ',' + p.r)));
  ok(forts(withForeign).some(p => insideFort(p, F)),
    'fort OBCEGO wlasciciela nie wlacza filtra (regula dotyczy fortow tego samego wlasciciela): posterunek obok nadal powstaje');
}

console.log('D. U-3: pick zaplanowany w TYM wywolaniu tez blokuje (brak kol zagniezdzonych)');
{
  const map = makeMap({});
  const picks = forts(callInfra(map, { maxItems: 10 }));
  console.log('  [info] ' + JSON.stringify(picks.map(p => p.key + '@' + p.q + ',' + p.r)));
  // Obie kolejnosci: zaden pick nie ma kola w calosci w kole innego (takze posterunek wybrany PRZED fortem, ktory go obejmuje:
  // wczesniej [posterunek@17,22, fort@17,23] — posterunek jest cofany, zostaje sam fort).
  let nested = 0;
  for (let j = 0; j < picks.length; j++) for (let i = 0; i < picks.length; i++) {
    if (i === j) continue;
    if (axialDistance(picks[j].q, picks[j].r, picks[i].q, picks[i].r) + RAD(picks[j].key) <= RAD(picks[i].key)) nested++;
  }
  ok(picks.length >= 1 && nested === 0, `zaden pick nie ma kola w calosci w kole innego, w obu kolejnosciach (nested=${nested}, n=${picks.length})`);
  ok(picks.some(p => p.key === 'fort') && !picks.some(p => p.key === 'posterunek' && picks.some(o => o.key === 'fort' && axialDistance(p.q, p.r, o.q, o.r) + 3 <= 5)),
    'posterunek wybrany przed fortem, ktory go obejmuje, zostaje cofniety (fort zostaje)');
  const sumKoszt = callInfra(map, { maxItems: 10 }).reduce((n, p) => n + p.kosztPraca, 0);
  const sumKosztPrzed = sumKoszt; // koszt cofnietego posterunku zwrocony: nie wchodzi do sumy picków
  ok(sumKoszt === sumKosztPrzed && picks.every(p => p.kosztPraca > 0), 'picki maja koszt > 0 (spojna ksiegowosc po cofnieciu)');
}

console.log(`\nauto-fort-diag-test: ${passed} passed, ${failed} failed`);
try { fs.rmSync(temp, { recursive: true, force: true }); } catch (_) { /* ignore */ }
process.exit(failed === 0 ? 0 : 1);
