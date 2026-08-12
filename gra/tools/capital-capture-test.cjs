'use strict';
/**
 * capital-capture-test.cjs -- standalone Node sanity test for
 * src/game/capital-capture.ts (RDZEŃ „przejęcie stolicy" -- plunder + eliminacja).
 * Run from gra/:  node tools/capital-capture-test.cjs
 *
 * Bundles capital-capture.ts via esbuild, loads it with a fake City[] + a fake
 * OwnerResourceAccess (player-like ownerId 0 + AI-like ownerId>0, mirroring the
 * asymmetry in main.ts: AI ma pulę skarbca, ale NIE ma puli pracy ani puli nauki),
 * and checks:
 *   1. Zdarzenie 1 (stolica, ale są jeszcze inne miasta): skarbiec -> zwycięzca,
 *      pula pracy przepada (NIE do zwycięzcy), nauka/techy bez zmian.
 *   2. Zdarzenie 2 (ostatnie miasto = eliminacja): jak wyżej + nauka -> zwycięzca,
 *      brakujące techy skopiowane (deterministycznie, alfabetycznie), przegrany
 *      zachowuje swoje techy (kopiujemy, nie zabieramy).
 *   3. Przejęcie NIE-stołecznego miasta (oldOwner ma młodsze miasto o niższym id
 *      niż to przejęte) -> brak transferu, wynik null.
 *   4. Miasto-państwo (1 miasto) zawsze -> Zdarzenie 2.
 *   5. cityFoundOrder / wasCapitalOfOldOwner: poprawna kolejność numeryczna nawet
 *      gdy id przekraczają próg 9->10 (miejsce, gdzie localeCompare stringów by się
 *      pomylił -- patrz komentarz w capital-capture.ts o isPlayerCapitalCity).
 *
 * Pure logic only -- no DOM, no THREE.
 */

const fs   = require('fs');
const path = require('path');

// --- esbuild ---------------------------------------------------------------
const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[capital-capture-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE  = path.resolve(__dirname, '.capital-capture-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.capital-capture-bundle.cjs');

const ENTRY_TS = `
export {
  cityFoundOrder,
  oldestCityOfOwner,
  wasCapitalOfOldOwner,
  remainingCitiesOfOwner,
  applyCapitalCapturePlunder,
  disbandOwnerUnits,
  barbarianCaptorResourceAccess,
  barbarianCapturedPowerGain,
  applyBarbarianAwareCapitalCapturePlunder,
} from '../src/game/capital-capture';
export { computeObjectivePower } from '../src/game/power-objective';
export { BARBARIAN_OWNER_ID, isBarbarian } from '../src/game/barbarians';
`;

fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE_FILE,
    logLevel: 'silent',
    resolveExtensions: ['.ts', '.js', '.json'],
  });
} catch (e) {
  console.error('[capital-capture-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const {
  cityFoundOrder,
  oldestCityOfOwner,
  wasCapitalOfOldOwner,
  remainingCitiesOfOwner,
  applyCapitalCapturePlunder,
  disbandOwnerUnits,
  computeObjectivePower,
  barbarianCaptorResourceAccess,
  barbarianCapturedPowerGain,
  applyBarbarianAwareCapitalCapturePlunder,
  BARBARIAN_OWNER_ID,
  isBarbarian,
} = M;

// --- tiny assertion framework ------------------------------------------------
let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('  FAIL:', msg); }
}
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }
function deepEq(a, b, msg) {
  const sa = JSON.stringify(a);
  const sb = JSON.stringify(b);
  assert(sa === sb, `${msg} (got ${sa}, want ${sb})`);
}

// --- fake city helper ---------------------------------------------------------
function city(id, ownerId) {
  return { id, ownerId, q: 0, r: 0, name: id, population: 1 };
}

/** Fake owner-agnostic resource store mirroring main.ts's asymmetry:
 *  ownerId 0 (gracz) ma skarbiec+praca+nauka+techy; ownerId>0 (AI) ma TYLKO
 *  skarbiec + techy (brak puli pracy i puli nauki -- patrz recon handoffu). */
function makeAccess(seed) {
  const skarbiec = new Map(Object.entries(seed.skarbiec || {}).map(([k, v]) => [Number(k), v]));
  const praca    = new Map(Object.entries(seed.praca    || {}).map(([k, v]) => [Number(k), v])); // tylko ownerId 0 ma sens
  const nauka    = new Map(Object.entries(seed.nauka    || {}).map(([k, v]) => [Number(k), v])); // tylko ownerId 0 ma sens
  const techy    = new Map(Object.entries(seed.techy    || {}).map(([k, v]) => [Number(k), new Set(v)]));

  return {
    getTreasury: (oid) => skarbiec.get(oid) ?? 0,
    setTreasury: (oid, v) => skarbiec.set(oid, Math.max(0, v)),
    getPracaPool: (oid) => (oid === 0 ? (praca.get(oid) ?? 0) : 0),
    setPracaPool: (oid, v) => { if (oid === 0) praca.set(oid, Math.max(0, v)); },
    getNaukaPool: (oid) => (oid === 0 ? (nauka.get(oid) ?? 0) : 0),
    setNaukaPool: (oid, v) => { if (oid === 0) nauka.set(oid, Math.max(0, v)); },
    getResearchedTechs: (oid) => techy.get(oid) ?? new Set(),
    addResearchedTechs: (oid, ids) => {
      if (!techy.has(oid)) techy.set(oid, new Set());
      const s = techy.get(oid);
      for (const id of ids) s.add(id);
    },
    _raw: { skarbiec, praca, nauka, techy },
  };
}

/** RUNDA 3 (sekcja 14b): wariant BEZ asymetrii "tylko ownerId 0 ma pulę pracy/nauki" --
 *  potrzebny do integracyjnego testu guarda barbarzyńskiego, bo z `makeAccess` powyżej
 *  `getNaukaPool(BARBARIAN_OWNER_ID)` zawsze zwraca 0 (barbarzyńcy to ownerId ujemny,
 *  nigdy 0) NIEZALEŻNIE od tego, czy `setNaukaPool` faktycznie zapisało coś do tego
 *  ownera -- asercja przez taki mock byłaby ślepa na regres guarda (potwierdzone
 *  mutacyjnie: usunięcie no-opu setNaukaPool w `barbarianCaptorResourceAccess`
 *  PRZECHODZIŁO niezauważone przez sekcję 14b, dopóki używała `makeAccess`). Ten wariant
 *  śledzi WSZYSTKICH ownerów symetrycznie, więc realnie wykrywa zapis DO ownera
 *  barbarzyńskiego. */
function makeSymmetricAccess(seed) {
  const skarbiec = new Map(Object.entries(seed.skarbiec || {}).map(([k, v]) => [Number(k), v]));
  const praca    = new Map(Object.entries(seed.praca    || {}).map(([k, v]) => [Number(k), v]));
  const nauka    = new Map(Object.entries(seed.nauka    || {}).map(([k, v]) => [Number(k), v]));
  const techy    = new Map(Object.entries(seed.techy    || {}).map(([k, v]) => [Number(k), new Set(v)]));
  return {
    getTreasury: (oid) => skarbiec.get(oid) ?? 0,
    setTreasury: (oid, v) => skarbiec.set(oid, Math.max(0, v)),
    getPracaPool: (oid) => praca.get(oid) ?? 0,
    setPracaPool: (oid, v) => { praca.set(oid, Math.max(0, v)); },
    getNaukaPool: (oid) => nauka.get(oid) ?? 0,
    setNaukaPool: (oid, v) => { nauka.set(oid, Math.max(0, v)); },
    getResearchedTechs: (oid) => techy.get(oid) ?? new Set(),
    addResearchedTechs: (oid, ids) => {
      if (!techy.has(oid)) techy.set(oid, new Set());
      const s = techy.get(oid);
      for (const id of ids) s.add(id);
    },
    _raw: { skarbiec, praca, nauka, techy },
  };
}

// ===========================================================================
// 1. cityFoundOrder + wasCapitalOfOldOwner -- poprawna kolejnosc numeryczna
//    (nawet w progu 9->10, gdzie localeCompare stringow by sie pomylil)
// ===========================================================================
console.log('1. cityFoundOrder / wasCapitalOfOldOwner -- kolejnosc numeryczna');
{
  eq(cityFoundOrder('city0'), 0, 'city0 -> 0');
  eq(cityFoundOrder('city9'), 9, 'city9 -> 9');
  eq(cityFoundOrder('city10'), 10, 'city10 -> 10');
  assert(cityFoundOrder('city9') < cityFoundOrder('city10'), 'city9 zalozone przed city10 (numerycznie)');
  assert(cityFoundOrder('nie-city-id') === Infinity, 'nieparsowalny id -> +Infinity (nigdy "najstarsze")');

  // Gracz (ownerId 5) ma city9 (stolica, zalozona wczesniej) i city10 (mlodsze).
  // Po przejeciu city10 przez atakujacego -- city10 NIE bylo stolica.
  const citiesAfter = [city('city9', 5), city('city10', 7 /* nowy wlasciciel */)];
  eq(
    wasCapitalOfOldOwner(city('city10', 7), 5, citiesAfter), false,
    'city10 (mlodsze) nie bylo stolica -- city9 istnieje i jest starsze mimo "wiekszego" stringa',
  );
  // Odwrotnie: przejecie city9 (faktyczna stolica, mimo krotszego stringa) -- BYLO stolica.
  const citiesAfter2 = [city('city9', 7), city('city10', 5)];
  eq(
    wasCapitalOfOldOwner(city('city9', 7), 5, citiesAfter2), true,
    'city9 (stolica, id numerycznie nizszy niz city10) -- poprawnie wykryte jako stolica',
  );
}

// ===========================================================================
// 2. Zdarzenie 1 -- stolica przejeta, oldOwner ma jeszcze inne miasto
// ===========================================================================
console.log('2. Zdarzenie 1 -- przejecie stolicy, cywilizacja przezywa');
{
  // oldOwner=1 mial city0 (stolica) + city1 (drugie miasto, przetrwalo).
  // newOwner=2 zdobywa city0.
  const citiesAfter = [city('city0', 2), city('city1', 1)];
  const access = makeAccess({
    skarbiec: { 1: 500, 2: 100 },
    praca:    { 1: 50 },   // AI (ownerId 1) i tak nie ma puli pracy w realnym kodzie,
                           // ale test uzywa go tez jako "gracz" w innym scenariuszu (patrz test 3)
    nauka:    { 1: 30 },
    techy:    { 1: ['a', 'b'], 2: ['a'] },
  });

  const res = applyCapitalCapturePlunder(city('city0', 2), 1, 2, citiesAfter, access);
  assert(res !== null, 'city0 bylo stolica -> wynik niepusty');
  eq(res.event, 'przejecie_stolicy', 'zdarzenie = przejecie_stolicy (NIE eliminacja, zostalo city1)');
  eq(res.eliminacja, false, 'eliminacja = false');
  eq(res.skarbiecPrzejety, 500, 'skarbiec przejety = 500 (caly skarbiec oldOwner)');

  eq(access.getTreasury(1), 0, 'skarbiec oldOwner wyzerowany');
  eq(access.getTreasury(2), 600, 'skarbiec newOwner += 500 (100+500)');

  // Pula pracy AI (ownerId 1 traktowany tu jako "ma pule" tylko w teście) --
  // reguła: PRZEPADA, nie idzie do newOwner.
  eq(access.getPracaPool(1), 0, 'pula pracy oldOwner zawsze zeruje sie (getPracaPool zwraca fallback dla ownerId!=0 wiec i tak 0)');

  // Nauka/techy BEZ ZMIAN w Zdarzeniu 1.
  eq(res.naukaPrzejeta, 0, 'Zdarzenie 1: nauka NIE przechodzi (0)');
  deepEq(res.techSkopiowane, [], 'Zdarzenie 1: brak kopiowania techow');
  deepEq(Array.from(access.getResearchedTechs(2)).sort(), ['a'], 'techy newOwner bez zmian');
  deepEq(Array.from(access.getResearchedTechs(1)).sort(), ['a', 'b'], 'techy oldOwner bez zmian (zostaja mu)');
}

// ===========================================================================
// 3. Zdarzenie 2 -- ostatnie miasto = eliminacja (gracz ownerId 0 jako oldOwner,
//    zeby przetestowac realna sciezke z pula pracy + pula nauki)
// ===========================================================================
console.log('3. Zdarzenie 2 -- ostatnie miasto = eliminacja (pelny transfer)');
{
  // oldOwner=0 (jak "gracz" w fake-access -- MA pule pracy i nauki) traci
  // JEDYNE miasto city3 na rzecz newOwner=9 (AI).
  const citiesAfter = [city('city3', 9)];
  const access = makeAccess({
    skarbiec: { 0: 200, 9: 0 },
    praca:    { 0: 77 },
    nauka:    { 0: 45 },
    techy:    { 0: ['brazownictwo', 'kolo', 'zelazo'], 9: ['kolo'] },
  });

  const res = applyCapitalCapturePlunder(city('city3', 9), 0, 9, citiesAfter, access);
  assert(res !== null, 'city3 bylo jedynym (a wiec i najstarszym) miastem -> wynik niepusty');
  eq(res.event, 'eliminacja', 'zdarzenie = eliminacja (0 pozostalych miast)');
  eq(res.eliminacja, true, 'eliminacja = true');

  eq(res.skarbiecPrzejety, 200, 'skarbiec przejety = 200');
  eq(access.getTreasury(0), 0, 'skarbiec pokonanego = 0');
  eq(access.getTreasury(9), 200, 'skarbiec zwyciezcy += 200');

  eq(access.getPracaPool(0), 0, 'pula pracy pokonanego wyzerowana (przepada, nie do zwyciezcy)');

  eq(res.naukaPrzejeta, 45, 'Zdarzenie 2: cala nauka pokonanego przejeta');
  eq(access.getNaukaPool(0), 0, 'nauka pokonanego = 0 po eliminacji');
  eq(access.getNaukaPool(9), 0, 'nauka zwyciezcy (AI, ownerId!=0 w fake-access) nie ma gdzie wladowac -- fallback 0 (asymetria danych, patrz raport)');

  deepEq(res.techSkopiowane, ['brazownictwo', 'zelazo'], 'brakujace techy skopiowane alfabetycznie ("kolo" juz mial zwyciezca)');
  deepEq(
    Array.from(access.getResearchedTechs(9)).sort(),
    ['brazownictwo', 'kolo', 'zelazo'],
    'zwyciezca ma teraz swoje + skopiowane techy',
  );
  deepEq(
    Array.from(access.getResearchedTechs(0)).sort(),
    ['brazownictwo', 'kolo', 'zelazo'],
    'pokonany ZACHOWUJE swoje techy (kopiujemy, nie zabieramy)',
  );
}

// ===========================================================================
// 4. Przejecie NIE-stolecznego miasta -> brak zdarzenia (null)
// ===========================================================================
console.log('4. Przejecie zwyklego (nie-stolecznego) miasta -> null, brak transferu');
{
  // oldOwner=3: city5 (stolica, zostaje przy oldOwner) + city8 (przejete).
  const citiesAfter = [city('city5', 3), city('city8', 4)];
  const access = makeAccess({ skarbiec: { 3: 999, 4: 1 } });
  const res = applyCapitalCapturePlunder(city('city8', 4), 3, 4, citiesAfter, access);
  eq(res, null, 'city8 nie bylo stolica (city5 istnieje i jest starsze) -> null');
  eq(access.getTreasury(3), 999, 'skarbiec oldOwner NIETKNIETY (brak plunder poza stolica)');
  eq(access.getTreasury(4), 1, 'skarbiec newOwner NIETKNIETY');
}

// ===========================================================================
// 5. Miasto-panstwo (1 miasto) -> ZAWSZE Zdarzenie 2
// ===========================================================================
console.log('5. Miasto-panstwo (jedyne miasto) -> zawsze eliminacja');
{
  const citiesAfter = [city('city42', 6)];
  const access = makeAccess({ skarbiec: { 5: 10, 6: 0 }, techy: { 5: ['x'], 6: [] } });
  const res = applyCapitalCapturePlunder(city('city42', 6), 5, 6, citiesAfter, access);
  assert(res !== null && res.eliminacja === true, 'miasto-panstwo -> eliminacja=true');
}

// ===========================================================================
// 6. oldestCityOfOwner / remainingCitiesOfOwner -- pomocnicze
// ===========================================================================
console.log('6. oldestCityOfOwner / remainingCitiesOfOwner');
{
  const cities = [city('city2', 1), city('city0', 1), city('city5', 1), city('city1', 2)];
  eq(oldestCityOfOwner(1, cities).id, 'city0', 'najstarsze miasto ownera 1 = city0');
  eq(oldestCityOfOwner(9, cities), null, 'brak miast -> null');
  deepEq(
    remainingCitiesOfOwner(1, cities).map(c => c.id).sort(),
    ['city0', 'city2', 'city5'],
    'remainingCitiesOfOwner zwraca wszystkie miasta danego ownera',
  );
}

// ===========================================================================
// 7. Follow-up "przenieś stolicę" -- designatedCapitalId ZASTĘPUJE legacy
//    "najstarsze miasto" jako kryterium plunderu. Scenariusz: oldOwner=1 ma
//    city0 (najstarsze -- legacy "stolica") + city3 (młodsze), ale WYZNACZYŁ
//    (przeniósł) stolicę na city3. Przejęcie city0 (legacy-stolica, ale NIE
//    wyznaczona) -> BRAK plunderu. Przejęcie city3 (wyznaczona, młodsza) -> plunder.
// ===========================================================================
console.log('7. designatedCapitalId zastepuje legacy "najstarsze miasto"');
{
  // 7a. Przejecie city0 (legacy-najstarsze, ale NIE wyznaczone) -> null, brak plunderu.
  const citiesAfterA = [city('city0', 2), city('city3', 1)];
  const accessA = makeAccess({ skarbiec: { 1: 300, 2: 0 } });
  const resA = applyCapitalCapturePlunder(city('city0', 2), 1, 2, citiesAfterA, accessA, 'city3');
  eq(resA, null, 'city0 (najstarsze, ale wyznaczona to city3) -> NIE bylo stolica -> null');
  eq(accessA.getTreasury(1), 300, 'skarbiec oldOwner nietkniety (brak plunderu)');

  // 7b. Przejecie city3 (wyznaczona, mlodsza) -> plunder + SUKCESJA (oldOwner ma
  //     jeszcze city0 -> nowa stolica = city0, najstarsze z POZOSTALYCH).
  const citiesAfterB = [city('city0', 1), city('city3', 2)];
  const accessB = makeAccess({ skarbiec: { 1: 300, 2: 0 } });
  const resB = applyCapitalCapturePlunder(city('city3', 2), 1, 2, citiesAfterB, accessB, 'city3');
  assert(resB !== null, 'city3 (wyznaczona stolica) -> plunder');
  eq(resB.event, 'przejecie_stolicy', 'zdarzenie 1 (city0 zostaje przy oldOwner)');
  eq(resB.skarbiecPrzejety, 300, 'skarbiec przejety');
  eq(resB.newCapitalIdForOldOwner, 'city0', 'SUKCESJA: nowa stolica oldOwner = city0 (jedyne pozostale)');
}

// ===========================================================================
// 8. Sukcesja z wieloma pozostalymi miastami -- nowa stolica = NAJSTARSZE z
//    pozostalych (nie dowolne), niezaleznie od tego ktore bylo wyznaczone.
// ===========================================================================
console.log('8. Sukcesja -- nowa stolica = najstarsze z pozostalych miast oldOwner');
{
  // oldOwner=1: city5 (wyznaczona stolica, przejmowana), city2 i city8 zostaja.
  // Najstarsze z pozostalych to city2 (2 < 8).
  const citiesAfter = [city('city5', 9), city('city2', 1), city('city8', 1)];
  const access = makeAccess({ skarbiec: { 1: 10 } });
  const res = applyCapitalCapturePlunder(city('city5', 9), 1, 9, citiesAfter, access, 'city5');
  assert(res !== null && res.event === 'przejecie_stolicy', 'city5 wyznaczona -> plunder, cyw przezywa');
  eq(res.newCapitalIdForOldOwner, 'city2', 'sukcesja: city2 (najstarsze z pozostalych city2/city8)');
}

// ===========================================================================
// 9. Eliminacja -> newCapitalIdForOldOwner=null (brak sukcesji, brak miast).
// ===========================================================================
console.log('9. Eliminacja -> brak sukcesji (newCapitalIdForOldOwner=null)');
{
  const citiesAfter = [city('city7', 4)];
  const access = makeAccess({ skarbiec: { 2: 5 } });
  const res = applyCapitalCapturePlunder(city('city7', 4), 2, 4, citiesAfter, access, 'city7');
  assert(res !== null && res.eliminacja === true, 'ostatnie miasto -> eliminacja');
  eq(res.newCapitalIdForOldOwner, null, 'eliminacja -> brak sukcesji (owner juz nie istnieje)');
}

// ===========================================================================
// 10. Follow-up "Power-zdobycze" -- computeObjectivePower: nowa skladowa
//     "zdobycze" (coeff stale 1, wartosc to juz gotowe punkty), wchodzi do sumy.
// ===========================================================================
console.log('10. computeObjectivePower -- skladowa "zdobycze" (Power-zdobycze)');
{
  const baseInput = {
    ownerId: 9, epoka: 1, jednostki: 0, wygraneBitwy: 0, bitwyPktSum: 0,
    sumaLudkow: 0, rekrutEkw: 0, miasta: 0, heksyTerytorium: 0, budynki: 0,
    techZbadane: 0, ulepszeniaTerenu: 0,
  };
  const withoutZdobycze = computeObjectivePower(baseInput);
  eq(withoutZdobycze.power, 0, 'brak zdobyczePower (pole nieobecne) -> Power=0, bez wyjatku');
  const zdobyczeRow0 = withoutZdobycze.components.find(c => c.key === 'zdobycze');
  assert(!!zdobyczeRow0, 'skladowa "zdobycze" zawsze obecna w breakdown');
  eq(zdobyczeRow0.points, 0, 'brak zdobyczy -> 0 pkt');

  const withZdobycze = computeObjectivePower({ ...baseInput, zdobyczePower: 1234 });
  const zdobyczeRow = withZdobycze.components.find(c => c.key === 'zdobycze');
  // P-MOC-BALANS-WAGI (Maciej 2026-08-12): coeff "zdobycze" 1 -> 2 (×2). Wciaz stale (nie z
  // JSON) -- wartosc wejsciowa to juz gotowe punkty Power, nie surowy licznik.
  eq(zdobyczeRow.coefficient, 2, 'coeff "zdobycze" 2 od P-MOC-BALANS-WAGI (bylo 1)');
  eq(zdobyczeRow.points, 2468, 'pkt "zdobycze" = zdobyczePower x2 (1234 x2 = 2468)');
  eq(withZdobycze.power, 2468, 'Power calkowity = zdobycze x2 (jedyna niezerowa skladowa w tym teście)');
}

// ===========================================================================
// 11. Eliminacja — disbandOwnerUnits usuwa wszystkie jednostki ownera.
// ===========================================================================
console.log('11. disbandOwnerUnits — brak jednostek po eliminacji ownerId');
{
  const units = [
    { id: 'u1', ownerId: 3, q: 1, r: 2 },
    { id: 'u2', ownerId: 3, q: 4, r: 5 },
    { id: 'u3', ownerId: 7, q: 0, r: 0 },
    { id: 'u4', ownerId: 0, q: 2, r: 2 },
  ];
  const after = disbandOwnerUnits(units, 3);
  eq(after.length, 2, 'zostają tylko jednostki innych ownerów');
  assert(!after.some(u => u.ownerId === 3), 'brak jednostek ownerId=3 po disband');
  eq(after.map(u => u.id).sort().join(','), 'u3,u4', 'zachowane jednostki owner 7 i 0');
  eq(units.length, 4, 'oryginalna tablica nietknięta (pure helper)');
}

// ===========================================================================
// 12. RUNDA 3 (P-BARB-CAPTURE-GUARD, punkt 3) -- barbarianCaptorResourceAccess:
//     zapisy DO newOwner no-opowane, zapisy DO INNEGO ownera (ofiary) przechodzą,
//     odczyty zawsze przechodzą (delegacja do base). Sprawdzone OSOBNO dla KAŻDEGO
//     z 3 opakowanych setterów -- cofnięcie opakowania JEDNEGO z nich (a nie
//     wszystkich naraz) musi dać czerwono tylko w JEGO sekcji.
// ===========================================================================
console.log('12. barbarianCaptorResourceAccess -- no-op zapisów DO newOwner, per-setter');
{
  function makeSpyAccess() {
    const calls = { setTreasury: [], setNaukaPool: [], addResearchedTechs: [] };
    const store = { treasury: new Map(), nauka: new Map(), techy: new Map() };
    return {
      access: {
        getTreasury: (oid) => store.treasury.get(oid) ?? 0,
        setTreasury: (oid, v) => { calls.setTreasury.push([oid, v]); store.treasury.set(oid, v); },
        getPracaPool: () => 0,
        setPracaPool: () => {},
        getNaukaPool: (oid) => store.nauka.get(oid) ?? 0,
        setNaukaPool: (oid, v) => { calls.setNaukaPool.push([oid, v]); store.nauka.set(oid, v); },
        getResearchedTechs: (oid) => store.techy.get(oid) ?? new Set(),
        addResearchedTechs: (oid, ids) => { calls.addResearchedTechs.push([oid, Array.from(ids)]); },
      },
      calls,
      store,
    };
  }

  // 12a. setTreasury: no-op DO newOwner, przechodzi DO innego ownera.
  {
    const { access, calls } = makeSpyAccess();
    const wrapped = barbarianCaptorResourceAccess(access, 9 /* newOwner=barbarzyńca */);
    wrapped.setTreasury(9, 500);
    eq(calls.setTreasury.length, 0, '12a: setTreasury(newOwner=9, ...) jest no-opowane (0 wywołań base)');
    wrapped.setTreasury(3, 200);
    eq(calls.setTreasury.length, 1, '12a: setTreasury(oldOwner=3, ...) PRZECHODZI do base (1 wywołanie)');
    deepEq(calls.setTreasury[0], [3, 200], '12a: przepuszczone wywołanie ma niezmienione argumenty');
  }

  // 12b. setNaukaPool: no-op DO newOwner, przechodzi DO innego ownera.
  {
    const { access, calls } = makeSpyAccess();
    const wrapped = barbarianCaptorResourceAccess(access, 9);
    wrapped.setNaukaPool(9, 40);
    eq(calls.setNaukaPool.length, 0, '12b: setNaukaPool(newOwner=9, ...) jest no-opowane');
    wrapped.setNaukaPool(3, 15);
    eq(calls.setNaukaPool.length, 1, '12b: setNaukaPool(oldOwner=3, ...) PRZECHODZI do base');
    deepEq(calls.setNaukaPool[0], [3, 15], '12b: przepuszczone wywołanie ma niezmienione argumenty');
  }

  // 12c. addResearchedTechs: no-op DO newOwner, przechodzi DO innego ownera.
  {
    const { access, calls } = makeSpyAccess();
    const wrapped = barbarianCaptorResourceAccess(access, 9);
    wrapped.addResearchedTechs(9, ['brazownictwo']);
    eq(calls.addResearchedTechs.length, 0, '12c: addResearchedTechs(newOwner=9, ...) jest no-opowane');
    wrapped.addResearchedTechs(3, ['kolo']);
    eq(calls.addResearchedTechs.length, 1, '12c: addResearchedTechs(oldOwner=3, ...) PRZECHODZI do base');
    deepEq(calls.addResearchedTechs[0], [3, ['kolo']], '12c: przepuszczone wywołanie ma niezmienione argumenty');
  }

  // 12d. Odczyty zawsze delegowane do base (nieopakowane), niezależnie od ownerId.
  {
    const { access, store } = makeSpyAccess();
    store.treasury.set(9, 777);
    const wrapped = barbarianCaptorResourceAccess(access, 9);
    eq(wrapped.getTreasury(9), 777, '12d: getTreasury zawsze deleguje do base, nawet dla newOwner');
  }
}

// ===========================================================================
// 13. RUNDA 3 (punkt 3) -- barbarianCapturedPowerGain: 0 Power gdy barbCaptor,
//     lostPower bez zmian gdy nie-barbarzyńca.
// ===========================================================================
console.log('13. barbarianCapturedPowerGain -- Power zdobyczy barbarzyńcy zawsze 0');
{
  eq(barbarianCapturedPowerGain(1000, true), 0, '13a: barbCaptor=true -> 0 Power (barbarzyńcy nie dziedziczą)');
  eq(barbarianCapturedPowerGain(1000, false), 1000, '13b: barbCaptor=false -> lostPower bez zmian');
  eq(barbarianCapturedPowerGain(0, false), 0, '13c: lostPower=0 -> 0 niezależnie od barbCaptor');
  eq(barbarianCapturedPowerGain(0, true), 0, '13d: lostPower=0, barbCaptor=true -> 0');
}

// ===========================================================================
// 14. RUNDA 3 (punkt 3) -- applyBarbarianAwareCapitalCapturePlunder: integracja
//     obu guardów (oldOwner barbarzyńca -> null; newOwner barbarzyńca -> no-op
//     zapisów) NAD realnym applyCapitalCapturePlunder. Weryfikacja mutacyjna
//     (cofnięcie KAŻDEGO guarda z osobna) uruchomiona OSOBNO -- patrz raport
//     finalny Operatora.
// ===========================================================================
console.log('14. applyBarbarianAwareCapitalCapturePlunder -- oba guardy zintegrowane');
{
  // 14a. oldOwner barbarzyńca -> null, ZERO efektów ubocznych (skarbiec nietknięty).
  {
    const citiesAfter = [city('cityBarb', 5)];
    const access = makeAccess({ skarbiec: { [BARBARIAN_OWNER_ID]: 999, 5: 0 } });
    const res = applyBarbarianAwareCapitalCapturePlunder(
      city('cityBarb', 5), BARBARIAN_OWNER_ID, 5, citiesAfter, access, undefined, isBarbarian,
    );
    eq(res, null, '14a: oldOwner=barbarzyńca -> null (guard 1 aktywny, brak legacy eliminacji CAŁEJ frakcji)');
    eq(access.getTreasury(BARBARIAN_OWNER_ID), 999, '14a: skarbiec barbarzyńców NIETKNIĘTY (funkcja wyszła wcześnie)');
  }

  // 14b. newOwner barbarzyńca -> ofiara traci normalnie, ale barbarzyńcy NIC nie dostają.
  // Używa `makeSymmetricAccess` (nie `makeAccess`) -- z asymetrycznym mockiem
  // `getNaukaPool(BARBARIAN_OWNER_ID)` zawsze zwraca 0 z konstrukcji (tylko ownerId===0
  // ma pulę), więc asercja "nauka nie trafia do barbarzyńców" byłaby ślepa na regres
  // guarda (potwierdzone mutacyjnie -- patrz raport finalny Operatora).
  {
    const citiesAfter = [city('cityCaptured', BARBARIAN_OWNER_ID)];
    const access = makeSymmetricAccess({
      skarbiec: { 4: 300, [BARBARIAN_OWNER_ID]: 0 },
      nauka:    { 4: 20 },
      techy:    { 4: ['brazownictwo'] },
    });
    const res = applyBarbarianAwareCapitalCapturePlunder(
      city('cityCaptured', BARBARIAN_OWNER_ID), 4, BARBARIAN_OWNER_ID, citiesAfter, access, undefined, isBarbarian,
    );
    assert(res !== null, '14b: oldOwner=4 (nie-barbarzyńca) -> plunder wykonany (eliminacja, miasto-państwo)');
    eq(res.eliminacja, true, '14b: ostatnie miasto ofiary -> eliminacja');
    eq(access.getTreasury(4), 0, '14b: ofiara TRACI skarbiec normalnie (strata ofiary niezależna od guarda 2)');
    eq(access.getTreasury(BARBARIAN_OWNER_ID), 0,
      '14b: skarbiec NIE trafia na konto barbarzyńców (guard 2 -- barbarianCaptorResourceAccess aktywny)');
    eq(access.getNaukaPool(BARBARIAN_OWNER_ID), 0, '14b: nauka NIE trafia na konto barbarzyńców');
    deepEq(Array.from(access.getResearchedTechs(BARBARIAN_OWNER_ID)).sort(), [],
      '14b: techy NIE trafiają na konto barbarzyńców (addResearchedTechs no-opowane)');
    eq(res.skarbiecPrzejety, 300, '14b: outcome.skarbiecPrzejety nadal raportuje realną kwotę utraconą przez ofiarę (dla UI)');
  }

  // 14c. Regresja: oldOwner I newOwner oboje nie-barbarzyńcy -> zachowanie identyczne
  //      z applyCapitalCapturePlunder bez owijki (żaden guard się nie odpala).
  {
    const citiesAfter = [city('cityNormal', 2)];
    const accessWrapped = makeAccess({ skarbiec: { 1: 150, 2: 0 } });
    const accessDirect  = makeAccess({ skarbiec: { 1: 150, 2: 0 } });
    const resWrapped = applyBarbarianAwareCapitalCapturePlunder(
      city('cityNormal', 2), 1, 2, citiesAfter, accessWrapped, undefined, isBarbarian,
    );
    const resDirect = applyCapitalCapturePlunder(city('cityNormal', 2), 1, 2, citiesAfter, accessDirect);
    deepEq(resWrapped, resDirect, '14c: gracz/AI vs gracz/AI -- wynik IDENTYCZNY z gołym applyCapitalCapturePlunder');
    eq(accessWrapped.getTreasury(2), accessDirect.getTreasury(2), '14c: skarbiec newOwner identyczny (bez owijki barbarzyńskiej)');
  }
}

// ===========================================================================
// 15. RUNDA 3 (punkt 3) -- main.ts WIRING (statyczne, main.ts nie jest bundlowalny --
//     patrz nagłówek pliku barb-city-behavior-test.cjs dla tego samego ograniczenia).
//     Realna logika guardów jest w pełni wykonana i dowiedziona mutacyjnie w sekcjach
//     12-14 wyżej -- to WYŁĄCZNIE cienka weryfikacja, że main.ts faktycznie WOŁA te
//     wyciągnięte funkcje zamiast trzymać logikę inline (regres: ktoś przywraca stary
//     inline kod w main.ts, zostawiając poprawne, ale teraz nieużywane funkcje tutaj).
// ===========================================================================
console.log('15. main.ts wiring -- statyczna weryfikacja (uzupełnienie realnego wykonania z 12-14)');
{
  const mainTsPath = path.resolve(__dirname, '..', 'src', 'main.ts');
  const mainTs = fs.readFileSync(mainTsPath, 'utf8');
  assert(mainTs.includes('applyBarbarianAwareCapitalCapturePlunder(') ,
    '15a: main.ts woła applyBarbarianAwareCapitalCapturePlunder(...) (guardy 1+2)');
  assert(mainTs.includes('barbarianCapturedPowerGain(lostPower, barbCaptor)'),
    '15b: main.ts woła barbarianCapturedPowerGain(lostPower, barbCaptor) (guard 3)');
  assert(!mainTs.includes('if (lostPower > 0 && !barbCaptor)'),
    '15c regresja: stary inline warunek "lostPower > 0 && !barbCaptor" usunięty z main.ts');
}

// --- summary ---------------------------------------------------------------
const total = passed + failed;
if (failed === 0) {
  console.log(`\nCAPITAL-CAPTURE-TEST OK (${passed}/${total})`);
} else {
  console.log(`\nCAPITAL-CAPTURE-TEST FAIL (${passed}/${total} passed, ${failed} failed)`);
}

// Clean up temp artifacts
try { fs.unlinkSync(ENTRY_FILE);  } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed === 0 ? 0 : 1);
