'use strict';

/**
 * R-WEB-AUTO-FORT-CLAIM-Q1 — krok E-FORT automatu ulepszen (K2 gracz „zrownowazone" + K3 AI cywilizacji):
 * gdy LIMIT MIAST wyczerpany, fort/posterunek zabezpiecza CENNY teren (zloze/gory) na granicy dostepnej budowy,
 * dajac MAKSIMUM nowych heksow terytorium. Kolejnosc: E1-E5 (zywnosc) -> krok niedoboru -> FORTY -> drogi.
 *
 * Sekcje:
 *   A  limit wyczerpany -> fort na gorze/zlozu NA GRANICY (najdalszy = max zysk), nie blizej
 *   B  limit NIE wyczerpany -> 0 fortow
 *   C  brak zloz/gor -> 0
 *   D  nie nakłada zasiegow (wiele wywolan, okregi fortow rozlaczne; istniejacy fort blokuje kandydata)
 *   E  budzet gracza SZTYWNY (% puli, rezerwa); AI 100%
 *   F  K3 (decideAITurn): fort przy wyczerpanym limicie; bez `cityLimitBase` / `defensiveCopy` -> 0
 *   G  parytet K2<->K3 (te same wspolrzedne i klucz)
 *   H  kolejnosc: zywnosc przed fortami, forty przed drogami (drogi czekaja na cel fortu)
 *   I  K1 „Zywnosc", „surowce", „infrastruktura": bez zmian (flaga nic nie zmienia)
 *   J  zysk = liczba NOWYCH heksow (nie liczy heksow miasta); fort przed posterunkiem
 *   P  parytet `isCityLimitExhausted` z realnym `canFoundCity` (granica limitu, era, foundedByOwner)
 *
 * Run z gra/:  node tools/auto-fort-claim-test.cjs
 * Mutacje:     AUTO_FORT_SRC_DIR=<kopia gra/src z mutacja> node tools/auto-fort-claim-test.cjs
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.AUTO_FORT_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'auto-fort-'));
const entry = path.join(temp, 'entry.ts');
const bundle = path.join(temp, 'bundle.cjs');
fs.writeFileSync(entry, [
  `export * as AIMP from ${JSON.stringify(SRC + '/game/auto-improvements')};`,
  `export { decideAITurn } from ${JSON.stringify(SRC + '/game/ai')};`,
  `export { canFoundCity } from ${JSON.stringify(SRC + '/game/cities')};`,
  `export { territoryOwnerAt, axialDistance, cityTerritoryRadius } from ${JSON.stringify(SRC + '/map/territory')};`,
  `export { getImprovementMeta } from ${JSON.stringify(SRC + '/game/improvement-tech')};`,
].join('\n') + '\n');
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: bundle, loader: { '.ts': 'ts', '.json': 'json' },
  absWorkingDir: GRA_ROOT, logLevel: 'error',
  nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
});
// Wariant z PODMIENIONYMI kosztami (plugin esbuild na terrain-improvements.json): stadnina znacznie drozsza od fortu.
// Dane produkcyjne maja dzis wszystkie ulepszenia niedoboru TANSZE od fortu (stadnina 56 < fort 100), wiec mutant m7
// (usuniecie `!deficitIsPendingNow()`) jest rownowazny na danych produkcyjnych — ten wariant go zabija niezaleznie od danych.
const bundleCostly = path.join(temp, 'bundle-costly.cjs');
// Plugin wymaga asynchronicznego API esbuild -> osobny proces potomny (reszta testu jest synchroniczna).
require('node:child_process').execFileSync(process.execPath, ['-e', `
const esbuild = require(${JSON.stringify(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'))});
const fs = require('node:fs');
esbuild.build({
  entryPoints: [${JSON.stringify(entry)}], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: ${JSON.stringify(bundleCostly)}, loader: { '.ts': 'ts', '.json': 'json' },
  absWorkingDir: ${JSON.stringify(GRA_ROOT)}, logLevel: 'error',
  nodePaths: [${JSON.stringify(path.resolve(GRA_ROOT, 'node_modules'))}],
  plugins: [{ name: 'costly-stadnina', setup(b) {
    b.onLoad({ filter: /terrain-improvements\\.json$/ }, a => {
      const j = JSON.parse(fs.readFileSync(a.path, 'utf8'));
      j.stadnina.koszt_praca = j.stadnina.koszt_praca * 10;
      return { contents: JSON.stringify(j), loader: 'json' };
    });
  } }],
}).catch(e => { console.error(e); process.exit(1); });
`], { stdio: 'inherit' });
const MC = require(bundleCostly);
const M = require(bundle);
const { pickAutoImprovements } = M.AIMP;
// Stan sprzed zmiany: brak eksportu -> sekcje P/J czerwone (nie blad budowania).
const isCityLimitExhausted = M.AIMP.isCityLimitExhausted || (() => { throw new Error('brak isCityLimitExhausted'); });
const { decideAITurn, canFoundCity, territoryOwnerAt, axialDistance, getImprovementMeta } = M;
// Koszt z danych (skalowany epoka: scaleTerrainImprovementWorkCost) — testy nie zakladaja stalej liczby.
const FORT_COST = getImprovementMeta('fort').kosztPraca;

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
function makeMap({ mountains = [], deposits = [], clay = [], plainMountainsAround = false } = {}) {
  const hexes = {};
  for (let q = 0; q < W; q++) for (let r = 0; r < H; r++) {
    hexes[K(q, r)] = {
      coords: { q, r }, terenBazowy: 'rownina', nakladka: 'brak', ulepszenie: 'brak',
      wlasciciel: null, wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {},
      rzeka: { obecna: false, krawedzie: [] },
    };
  }
  // Centrum miasta = gory: heks centrum jest zwyklym kandydatem farmy (R4 KOREKTA F) i inaczej wstrzymywalby etapy zywnosci.
  hexes[K(CQ, CR)].terenBazowy = 'gory';
  for (const [q, r] of mountains) hexes[K(q, r)].terenBazowy = 'gory';
  for (const [q, r] of deposits) hexes[K(q, r)].nakladka = 'zloze_rudy';
  for (const [q, r] of clay) hexes[K(q, r)].nakladka = 'zloze_gliny';
  return { szerokoscQ: W, wysokoscR: H, hexes, seed: 7, riverPaths: [] };
}
const CITY = { id: 'c0', ownerId: 0, q: CQ, r: CR, name: 'A', population: 5 }; // zasieg terytorium = 5
const mkTN = () => [{ q: CQ, r: CR, ownerId: 0, cityId: 'c0', pop: 5, level: 1 }];

function callK2(map, over = {}) {
  const cities = over.cities ?? [{ ...CITY, ulepszeniaFocus: 'zrownowazone' }];
  return pickAutoImprovements({
    cities, ownerId: 0, map, territoryNodes: over.territoryNodes ?? mkTN(),
    placedImprovements: over.placed ?? new Map(), pracaAvailable: over.pool ?? 5000, unlockedTechs: over.techs ?? FULL,
    pracaSurplusThreshold: over.reserve ?? 30, skipWyrab: true,
    demandDriven: true, resourceDeficitKeys: over.deficit ?? [],
    getFocus: () => over.focus ?? 'zrownowazone',
    getOnlyWorked: () => true, getWorkedHexKeys: () => new Set(),
    pracaBudgetPercent: over.pct ?? 100, civArchetype: 'grecy', playerEra: 3,
    foodImprovementStages: () => true,
    cityLimitExhausted: over.exhausted ?? true,
    ...(over.extra ?? {}),
  });
}
const forts = picks => picks.filter(p => p.key === 'fort' || p.key === 'posterunek');

const RAD5 = 5;

// =========================================================================
console.log('A. limit wyczerpany -> fort na gorze NA GRANICY (max zysk), nie na bliskiej');
{
  const map = makeMap({ mountains: [[CQ + 3, CR], [CQ + 5, CR]] });
  const picks = callK2(map);
  ok(picks.length === 1, `dokladnie 1 pick (got ${picks.length}: ${JSON.stringify(picks.map(p => p.key + '@' + p.q + ',' + p.r))})`);
  ok(picks[0]?.key === 'fort', 'klucz = fort (r=5 preferowany)');
  ok(picks[0]?.q === CQ + 5 && picks[0]?.r === CR, `heks na granicy zasiegu (q=${CQ + 5}), nie blizszy (got ${picks[0]?.q},${picks[0]?.r})`);
  ok(picks[0]?.kosztPraca === FORT_COST && FORT_COST > 0, `koszt Pracy fortu = ${FORT_COST} (z danych)`);
}
{
  const map = makeMap({ deposits: [[CQ - 2, CR], [CQ - 5, CR + 0]] });
  const picks = callK2(map);
  ok(picks.length === 1 && picks[0].q === CQ - 5, `zloze na granicy (q=${CQ - 5}) wygrywa ze zlozem blizej (got ${picks[0]?.q})`);
}

// =========================================================================
console.log('B. limit NIE wyczerpany -> 0 fortow');
{
  const map = makeMap({ mountains: [[CQ + 5, CR]] });
  ok(forts(callK2(map, { exhausted: false })).length === 0, 'cityLimitExhausted=false -> 0 fortow');
  ok(forts(callK2(map, { extra: { cityLimitExhausted: undefined } })).length === 0, 'brak flagi -> 0 fortow (domyslnie wylaczone)');
}

// =========================================================================
console.log('C. brak zloz/gor -> 0');
{
  const map = makeMap({});
  ok(callK2(map).length === 0, 'mapa bez zloz i gor, limit wyczerpany -> 0 pickow');
  const mapLas = makeMap({});
  for (const [q, r] of [[CQ + 5, CR], [CQ + 4, CR]]) mapLas.hexes[K(q, r)].nakladka = 'las';
  ok(forts(callK2(mapLas)).length === 0, 'sam las nie jest cennym terenem -> 0 fortow');
}

// =========================================================================
console.log('D. nie nakłada zasiegow');
{
  // dwie gory w odleglosci 4 od siebie na granicy: okregi (r=5+5) sie nakladaja -> w kolejnych wywolaniach tylko JEDEN fort
  const map = makeMap({ mountains: [[CQ + 5, CR], [CQ + 5, CR - 4], [CQ - 5, CR]] });
  const placed = new Map();
  const tn = mkTN();
  const got = [];
  for (let t = 0; t < 4; t++) {
    const picks = forts(callK2(map, { placed, territoryNodes: tn }));
    for (const p of picks) {
      got.push(p);
      placed.set(K(p.q, p.r), [p.key]);
      tn.push({ q: p.q, r: p.r, ownerId: 0, pop: 0, level: 1, isFort: p.key === 'fort', isOutpost: p.key === 'posterunek' });
    }
  }
  ok(got.length === 2, `3 gory (2 sasiednie), wielokrotne wywolania -> 2 forty (got ${got.length})`);
  let overlap = false;
  for (let i = 0; i < got.length; i++) for (let j = i + 1; j < got.length; j++) {
    const ri = got[i].key === 'fort' ? 5 : 3, rj = got[j].key === 'fort' ? 5 : 3;
    if (axialDistance(got[i].q, got[i].r, got[j].q, got[j].r) <= ri + rj) overlap = true;
  }
  console.log('  [info] forty: ' + JSON.stringify(got.map(p => p.key + '@' + p.q + ',' + p.r)));
  ok(!overlap, 'okregi zadnych dwoch fortow/posterunkow nie zachodza na siebie (odleglosc > suma promieni; fort r=5, posterunek r=3)');
  // istniejacy fort blokuje kandydata w swoim zasiegu
  const map2 = makeMap({ mountains: [[CQ + 5, CR]] });
  const tn2 = mkTN();
  tn2.push({ q: CQ + 8, r: CR, ownerId: 1, pop: 0, level: 1, isFort: true });
  ok(forts(callK2(map2, { territoryNodes: tn2 })).length === 0, 'cudzy fort w odleglosci 3 (okregi zachodza) blokuje kandydata');
  const map3 = makeMap({ mountains: [[CQ + 5, CR]] });
  const tn3 = mkTN();
  tn3.push({ q: CQ + 5, r: CR + 5, ownerId: 0, pop: 0, level: 1, isFort: true });
  ok(forts(callK2(map3, { territoryNodes: tn3 })).length === 0, 'WLASNY fort w odleglosci 5 blokuje kandydata (jeden fort na obszar)');
}

// =========================================================================
console.log('E. budzet: gracz sztywny %, rezerwa; AI 100%');
{
  const map = makeMap({ mountains: [[CQ + 5, CR]] });
  const pctLow = Math.floor((FORT_COST - 1) / 10);   // pct% z 1000 < koszt
  const pctHigh = Math.ceil(FORT_COST / 10) + 1;      // pct% z 1000 >= koszt
  ok(forts(callK2(map, { pool: 1000, pct: pctLow })).length === 0, `gracz ${pctLow}% z 1000 = ${pctLow * 10} < ${FORT_COST} -> 0 (sztywny sufit)`);
  ok(forts(callK2(map, { pool: 1000, pct: pctHigh })).length === 1, `gracz ${pctHigh}% z 1000 = ${pctHigh * 10} >= ${FORT_COST} -> 1 fort`);
  ok(forts(callK2(map, { pool: FORT_COST + 29, pct: 100, reserve: 30 })).length === 0, 'rezerwa 30: pula-koszt < 30 -> 0');
  ok(forts(callK2(map, { pool: FORT_COST + 30, pct: 100, reserve: 30 })).length === 1, 'pula = koszt + rezerwa -> 1');
  ok(forts(callK2(map, { pool: 1000, extra: { getPracaBudgetPercent: () => 1 } })).length === 0, 'override miasta 1% zaciska pulap -> 0');
  // pending: cel czekajacy na Prace wstrzymuje drogi (patrz H); tu: przy budzecie 0 brak pickow
  ok(callK2(map, { pool: 1000, pct: 0 }).length === 0, '0% -> brak pickow');
}

// =========================================================================
console.log('F. K3 (decideAITurn)');
function aiCmds(map, over = {}) {
  const cities = over.cities ?? [{ ...CITY, okolicaTryb: 'reczny', okolicaReczne: {} }];
  return decideAITurn(0, [], cities, map,
    { units: [], buildings: [], aiParams: {}, terrainYields: { terrain_types: [] } }, {
      civType: 'grecy', poziomTrudnosci: 2, defensiveCopy: over.defensiveCopy ?? false, cityBuildings: {},
      territoryNodes: over.territoryNodes ?? mkTN(), placedImprovements: over.placed ?? new Map(),
      improvementTechs: over.techs ?? FULL, pracaAvailable: over.pool ?? 5000, civEra: over.era ?? 3,
      resourceDeficitKeys: [], improvementBudgetCap: over.pool ?? 5000,
      ...(over.cityLimitBase === null ? {} : { cityLimitBase: over.cityLimitBase ?? 1 }),
    }).filter(c => c.type === 'buildImprovement');
}
{
  const map = makeMap({ mountains: [[CQ + 5, CR]] });
  // era 1 -> limit = base; base=1 i jedno miasto => limit WYCZERPANY; base=2 => nie.
  const cmds = aiCmds(map, { era: 1, cityLimitBase: 1 });
  ok(cmds.some(c => c.key === 'fort' && c.q === CQ + 5 && c.r === CR), `AI 1 miasto, era 1, base 1 (limit 1) -> fort na gorze na granicy (got ${JSON.stringify(cmds.map(c => c.key + '@' + c.q + ',' + c.r))})`);
  ok(!aiCmds(map, { era: 1, cityLimitBase: null }).some(c => c.key === 'fort'), 'AI bez cityLimitBase -> 0 fortow (krok nieaktywny)');
  ok(!aiCmds(map, { era: 1, cityLimitBase: 2 }).some(c => c.key === 'fort'), 'AI 1 miasto, limit 2 (nie wyczerpany) -> 0 fortow');
  ok(!aiCmds(map, { era: 3, cityLimitBase: 1 }).some(c => c.key === 'fort'), 'AI era 3 -> limit 11 > 1 miasto -> 0 fortow (parytet z canFoundCity)');
  ok(!aiCmds(map, { era: 1, cityLimitBase: 1, defensiveCopy: true }).some(c => c.key === 'fort'), 'miasto-panstwo (defensiveCopy) -> 0 fortow (jak planExpansionFortBuilding)');
  // AI: budzet 100% puli (improvementBudgetCap = pula) — fort przechodzi przy niskiej puli >= koszt (+ bramka wejscia AI)
  const poolOk = FORT_COST + 80;
  ok(aiCmds(map, { era: 1, cityLimitBase: 1, pool: poolOk }).some(c => c.key === 'fort'), `AI pula ${poolOk} (100% puli, bez sufitu %) -> fort stawiany`);
  ok(!aiCmds(map, { era: 1, cityLimitBase: 1, pool: FORT_COST - 1 }).some(c => c.key === 'fort'), 'AI pula < koszt -> 0');
}

// =========================================================================
console.log('G. parytet K2 <-> K3 (te same wspolrzedne i klucz)');
for (const [nazwa, mountains, deposits] of [
  ['gora na granicy', [[CQ + 5, CR]], []],
  ['zloze + gora, wybor wg zysku', [[CQ + 2, CR + 2]], [[CQ, CR - 5]]],
  ['trzy kandydaty', [[CQ + 5, CR - 5], [CQ - 5, CR + 5], [CQ + 3, CR]], [[CQ - 5, CR]]],
]) {
  const map = makeMap({ mountains, deposits });
  const k2 = forts(callK2(map));
  const k2b = k2;
  const k3 = aiCmds(map, { era: 1, cityLimitBase: 1 }).filter(c => c.key === 'fort' || c.key === 'posterunek');
  const s2 = k2b.map(p => `${p.key}@${p.q},${p.r}`).sort().join('|');
  const s3 = k3.map(p => `${p.key}@${p.q},${p.r}`).sort().join('|');
  ok(s2.length > 0 && s2 === s3, `${nazwa}: K2 == K3 (${s2} vs ${s3})`);
  ok(k2.length >= 1, `${nazwa}: K2 (1 miasto) tez wybiera fort`);
}

// =========================================================================
console.log('H. kolejnosc: zywnosc -> fort -> drogi');
{
  // 1) zywnosc przed fortem: heks z rzeka w zasiegu (farma kandydat) -> w tej samej turze zadnego fortu
  const map = makeMap({ mountains: [[CQ + 5, CR]] });
  map.hexes[K(CQ, CR - 2)].rzeka = { obecna: true, krawedzie: [] };
  map.riverPaths = [[{ q: CQ, r: CR - 2 }]];
  const worked = new Set([K(CQ, CR - 2)]);
  const picks = callK2(map, { extra: { getWorkedHexKeys: () => worked } });
  ok(picks.some(p => p.key === 'farma') && forts(picks).length === 0, 'rzeka z kandydatem farmy: farma TAK, fort NIE w tej samej turze');
  // 2) po zagospodarowaniu zywnosci -> fort
  const placed = new Map([[K(CQ, CR - 2), ['farma', 'bydlo', 'irygacja']]]);
  const picks2 = callK2(map, { placed, extra: { getWorkedHexKeys: () => worked } });
  ok(forts(picks2).length === 1, `po zagospodarowaniu rzeki (farma/trzoda/irygacja) -> fort (got ${JSON.stringify(picks2.map(p => p.key))})`);
  // 3) niedobor surowca z celem (kamien -> kamieniolom) idzie PRZED fortem
  const mapK = makeMap({ mountains: [[CQ + 5, CR]] });
  mapK.hexes[K(CQ + 1, CR)].terenBazowy = 'wzgorza';
  const pDef = callK2(mapK, { deficit: ['kamien'], extra: { getResourcePassOnlyWorked: () => false } });
  console.log('  [info] niedobor kamien -> ' + JSON.stringify(pDef.map(p => p.key + '@' + p.q + ',' + p.r)));
  ok(pDef.length >= 1 && pDef[0].key === 'kamieniolom' && forts(pDef).length === 0,
    'niedobor kamienia z celem: kamieniolom NA PRZOD, fort dopiero w kolejnej turze (nie w tej samej)');
  const placedK = new Map([[K(CQ, CR), ['kamieniolom']], [K(CQ + 1, CR), ['kamieniolom']], [K(CQ + 5, CR), ['kamieniolom']]]);
  const pAfter = callK2(mapK, { deficit: ['kamien'], placed: placedK, extra: { getResourcePassOnlyWorked: () => false } });
  ok(forts(pAfter).length === 1, 'po zaspokojeniu celu niedoboru (kamieniolom stoi) -> fort');
  // 4) drogi: fort ma priorytet nad drogami. Heks przy miescie (obrabiany, farma juz stoi) kwalifikuje droge.
  const mapR = makeMap({ mountains: [[CQ + 5, CR]] });
  const wR = new Set([K(CQ + 1, CR)]);
  const placedR = () => new Map([[K(CQ + 1, CR), ['farma']]]);
  const callR = over => callK2(mapR, { placed: placedR(), ...over, extra: { getWorkedHexKeys: () => wR, ...(over.extra ?? {}) } });
  const isRoad = p => p.key === 'droga' || p.key === 'droga_brukowana';
  const noFort = callR({ exhausted: false });
  const withFort = callR({ exhausted: true });
  ok(noFort.some(isRoad), `bez limitu (brak fortow) droga JEST budowana (kontrola fixtury; got ${JSON.stringify(noFort.map(p => p.key))})`);
  ok(forts(withFort).length === 1, 'z limitem: fort jest');
  ok(!withFort.some(isRoad), 'w turze z fortem drogi NIE sa budowane (fort przed drogami)');
  // 5) fort czekajacy na Prace wstrzymuje drogi (sufit % < koszt fortu)
  const waiting = callR({ pool: 1000, pct: Math.floor((FORT_COST - 1) / 10) });
  ok(!waiting.some(isRoad) && forts(waiting).length === 0, 'fort czeka na Prace (sufit % < koszt) -> drogi tez wstrzymane');
  // 6) po postawieniu fortu (limit nadal wyczerpany, brak kolejnych kandydatow) drogi ruszaja
  const tnF = mkTN(); tnF.push({ q: CQ + 5, r: CR, ownerId: 0, pop: 0, level: 1, isFort: true });
  const placedF = placedR(); placedF.set(K(CQ + 5, CR), ['fort']);
  const afterFort = callK2(mapR, { placed: placedF, territoryNodes: tnF, extra: { getWorkedHexKeys: () => wR } });
  ok(afterFort.some(isRoad) && forts(afterFort).length === 0, 'fort stoi, brak innych kandydatow -> drogi ruszaja (najnizszy priorytet)');
}

// =========================================================================
console.log('I. K1 / surowce / infrastruktura: flaga nic nie zmienia');
{
  const map = makeMap({ mountains: [[CQ + 5, CR]], deposits: [[CQ - 3, CR]] });
  for (const focus of ['zywnosc', 'surowce', 'infrastruktura']) {
    const a = callK2(map, { focus, exhausted: true, cities: [{ ...CITY, ulepszeniaFocus: focus }] });
    const b = callK2(map, { focus, exhausted: false, cities: [{ ...CITY, ulepszeniaFocus: focus }] });
    const sa = JSON.stringify(a), sb = JSON.stringify(b);
    ok(sa === sb, `[${focus}] picki identyczne z flaga i bez (${a.length} vs ${b.length})`);
  }
  const k1 = callK2(map, { focus: 'zywnosc', exhausted: true, cities: [{ ...CITY, ulepszeniaFocus: 'zywnosc' }] });
  ok(forts(k1).length === 0, '[K1] zero fortow');
}

// =========================================================================
console.log('J. zysk = NOWE heksy (wolne, ladowe); fort przed posterunkiem');
{
  const map = makeMap({ mountains: [[CQ + 5, CR]] });
  const p = callK2(map)[0];
  // reczne policzenie zysku w (CQ+5,CR): heksy w r=5 od fortu, ktore NIE lezą w zasiegu miasta (r=5)
  let gain = 0;
  for (let q = 0; q < W; q++) for (let r = 0; r < H; r++) {
    if (axialDistance(q, r, p.q, p.r) <= 5 && territoryOwnerAt(q, r, mkTN()) === null) gain++;
  }
  ok(gain > 0 && gain < 91, `zysk fortu na granicy liczony jako heksy wolne: ${gain} (< 91 calych)`);
  // fort niedostepny (brak technologii) -> posterunek (jesli tech posterunku jest)
  const pl = callK2(map, { techs: new Set() });
  console.log('  [info] bez technologii -> ' + JSON.stringify(pl.map(x => x.key)));
  ok(pl.every(x => x.key !== 'fort'), 'bez technologii fortu nie ma fortu (tech-gate szanowany)');
  ok(FORT_MIN_OK(), `FORT_CLAIM_MIN_NEW_HEXES = ${M.AIMP.FORT_CLAIM_MIN_NEW_HEXES}`);
}
function FORT_MIN_OK() { return (M.AIMP.FORT_CLAIM_MIN_NEW_HEXES ?? 0) >= 1; }

// =========================================================================
console.log('P. parytet isCityLimitExhausted z canFoundCity');
{
  const map = makeMap({});
  const mk = (n, extra = {}) => Array.from({ length: n }, (_, i) => ({
    id: 'x' + i, ownerId: 0, q: 2 + (i % 8) * 5, r: 2 + Math.floor(i / 8) * 5, name: 'x', population: 3, ...extra,
  }));
  let allOk = true;
  for (const base of [10, 15, 20]) for (const era of [0, 1, 2, 3, 5]) {
    const limit = base + (Math.max(1, era) - 1) * 5;
    for (const n of [limit - 1, limit, limit + 1]) {
      const cities = mk(n);
      const real = canFoundCity(40, 40, cities, map, { ownerId: 0, ownerEra: era, gameConfig: { cityLimitBase: base } });
      const mine = isCityLimitExhausted(cities, base, era);
      if ((real.reason === 'limit miast na tej epoce') !== mine) { allOk = false; console.error(`   rozjazd base=${base} era=${era} n=${n}: real=${real.reason} mine=${mine}`); }
    }
  }
  ok(allOk, 'isCityLimitExhausted == (canFoundCity odrzuca z powodu limitu) dla base 10/15/20 x era 0..5 x granica +-1');
  const conquered = [...mk(9), ...mk(3, { foundedByOwner: false }).map((c, i) => ({ ...c, id: 'z' + i, q: 41, r: 2 + i * 4 }))];
  const realC = canFoundCity(40, 40, conquered, map, { ownerId: 0, ownerEra: 1, gameConfig: { cityLimitBase: 10 } });
  ok((realC.reason === 'limit miast na tej epoce') === isCityLimitExhausted(conquered, 10, 1), 'miasta zdobyte (foundedByOwner=false) nie licza sie do limitu — parytet');
  ok(isCityLimitExhausted(mk(50), undefined, 1) === false, 'brak cityLimitBase -> false');
}

// =========================================================================
console.log('K. m7: niedobor czekajacy na Prace wstrzymuje fort (stadnina drozsza od fortu)');
{
  const costs = ks => ks.map(k => `${k}=${getImprovementMeta(k)?.kosztPraca}`).join(' ');
  console.log('  [info] koszty produkcyjne: ' + costs(['fort', 'posterunek', 'tartak', 'kamieniolom', 'glinianka', 'kopalnia_miedzi', 'kopalnia_zelaza', 'kopalnia_cyny', 'warzelnia_soli', 'stadnina']));
  // (a) dane produkcyjne: kazde ulepszenie niedoboru tansze od fortu -> m7 rownowazny; pin tej zaleznosci.
  const DEF_KEYS = ['tartak', 'kamieniolom', 'glinianka', 'kopalnia_miedzi', 'kopalnia_zelaza', 'kopalnia_cyny', 'warzelnia_soli', 'stadnina'];
  const maxDef = Math.max(...DEF_KEYS.map(k => getImprovementMeta(k).kosztPraca));
  ok(maxDef < FORT_COST, `dane produkcyjne: najdrozsze ulepszenie niedoboru (${maxDef}) < fort (${FORT_COST}) — m7 rownowazny na tych danych (patrz wariant nizej)`);
  // (b) wariant z kosztami podmienionymi: stadnina x10 -> drozsza od fortu; to zabija m7.
  const G = MC.AIMP, getMetaC = MC.getImprovementMeta;
  const STAD = getMetaC('stadnina').kosztPraca, FORTC = getMetaC('fort').kosztPraca;
  console.log(`  [info] wariant kosztowy: stadnina=${STAD}, fort=${FORTC}`);
  ok(STAD > FORTC, `fixtura: stadnina (${STAD}) drozsza od fortu (${FORTC})`);
  const map = makeMap({ mountains: [[CQ + 5, CR]] });
  map.hexes[K(CQ + 1, CR)].nakladka = 'zloze_konia';
  const callC = (over = {}) => G.pickAutoImprovements({
    cities: [{ ...CITY, ulepszeniaFocus: 'zrownowazone' }], ownerId: 0, map, territoryNodes: mkTN(),
    placedImprovements: new Map(), pracaAvailable: over.pool, unlockedTechs: FULL,
    pracaSurplusThreshold: 30, skipWyrab: true, demandDriven: true, resourceDeficitKeys: over.deficit ?? [],
    getFocus: () => 'zrownowazone', getOnlyWorked: () => true, getWorkedHexKeys: () => new Set(),
    getResourcePassOnlyWorked: () => false,
    pracaBudgetPercent: 100, civArchetype: 'grecy', playerEra: 3, foodImprovementStages: () => true,
    cityLimitExhausted: true,
  });
  const richC = callC({ pool: STAD + 500, deficit: ['kon'] });
  ok(richC.some(p => p.key === 'stadnina') && forts(richC).length === 0, `kontrola: pula ${STAD + 500} -> stadnina TAK, fort NIE (got ${JSON.stringify(richC.map(p => p.key))})`);
  const pool = FORTC + 30 + 1;
  ok(pool < STAD + 30, `fixtura: pula ${pool} miesci fort (+rezerwa 30) ale nie stadnine (+rezerwa 30)`);
  const poorC = callC({ pool, deficit: ['kon'] });
  ok(!poorC.some(p => p.key === 'stadnina'), `pula ${pool}: stadniny nie stac`);
  ok(forts(poorC).length === 0, `niedobor konia czeka na Prace -> fort NIE jest stawiany (got ${JSON.stringify(poorC.map(p => p.key))})`);
  const noDefC = callC({ pool, deficit: [] });
  ok(forts(noDefC).length === 1, 'ta sama pula bez niedoboru -> fort stawiany (kontrola: wstrzymuje niedobor, nie pula)');
}

// =========================================================================
console.log('L. fort i kopalnia na tym samym heksie (wspolistnienie w silniku)');
{
  // Zloze rudy (miedz) NA GORZE na granicy: heks jest kandydatem i fortu, i kopalni.
  const map = makeMap({ mountains: [[CQ + 5, CR]], deposits: [[CQ + 5, CR]] });
  const extra = { getResourcePassOnlyWorked: () => false };
  const onHex = ps => ps.filter(p => p.q === CQ + 5 && p.r === CR).map(p => p.key);
  const ctl = callK2(map, { deficit: ['ruda'], extra });
  console.log('  [info] kontrola (niedobor rudy, bez fortu): ' + JSON.stringify(ctl.map(p => p.key + '@' + p.q + ',' + p.r)));
  ok(onHex(ctl).includes('kopalnia_miedzi'), 'kontrola fixtury: bez fortu niedobor rudy daje kopalnie na zlozu');
  const fortPlaced = new Map([[K(CQ + 5, CR), ['fort']]]);
  const tn = mkTN(); tn.push({ q: CQ + 5, r: CR, ownerId: 0, pop: 0, level: 1, isFort: true });
  const withFort = callK2(map, { deficit: ['ruda'], placed: fortPlaced, territoryNodes: tn, extra });
  console.log('  [info] fort stoi na zlozu -> ' + JSON.stringify(withFort.map(p => p.key + '@' + p.q + ',' + p.r)));
  ok(onHex(withFort).includes('kopalnia_miedzi'), 'kopalnia MOZE stanac na heksie z fortem (wspolistnienie warstw w silniku)');
  const minePlaced = new Map([[K(CQ + 5, CR), ['kopalnia_miedzi']]]);
  const withMine = callK2(map, { placed: minePlaced });
  ok(onHex(withMine).includes('fort'), 'fort MOZE stanac na heksie z kopalnia (wspolistnienie warstw w silniku)');
}

// =========================================================================
console.log('M. fort drozszy od sufitu % gracza na stale: drogi wstrzymane (udokumentowane zachowanie)');
{
  const map = makeMap({ mountains: [[CQ + 5, CR]] });
  const wR = new Set([K(CQ + 1, CR)]);
  const placedR = new Map([[K(CQ + 1, CR), ['farma']]]);
  const isRoad = p => p.key === 'droga' || p.key === 'droga_brukowana';
  const pct = Math.floor((FORT_COST - 1) / 10);
  const picks = callK2(map, { pool: 1000, pct, placed: placedR, extra: { getWorkedHexKeys: () => wR } });
  ok(picks.length === 0, `sufit ${pct}% z 1000 < koszt fortu: ani fort, ani droga (got ${JSON.stringify(picks.map(p => p.key))}) — ZAMIERZONE: wzorzec jak E1-E5 (cel czekajacy na Prace wstrzymuje nizsze priorytety)`);
  const picks2 = callK2(map, { pool: 1000, pct: pct + 3, placed: placedR, extra: { getWorkedHexKeys: () => wR } });
  ok(forts(picks2).length === 1, 'po podniesieniu sufitu % gracza fort jest stawiany i blokada znika');
}

console.log(`\nauto-fort-claim-test: ${passed} passed, ${failed} failed`);
try { fs.rmSync(temp, { recursive: true, force: true }); } catch (_) { /* ignore */ }
process.exit(failed === 0 ? 0 : 1);
