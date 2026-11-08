'use strict';
/**
 * ai-founding-territory-test.cjs
 * P-AI-ZAKLADANIE-MIAST-BEZ-ZASADY-ODLEGLOSCI (Maciej, decyzja A, 2026-08-09):
 * AI dostaje dokladnie ten sam twardy wymog withinTerritory co gracz przy
 * zakladaniu miast (findCityFoundingHex / planCityFounding, gra/src/game/ai.ts).
 * Dawna premia AI_COLONIZATION_OUTSIDE_TERRITORY_BONUS (+15 pkt za hex POZA
 * zasiegiem istniejacych miast) zostala usunieta.
 *
 * RUNDA 3 (scalenie): runda 2 przepisala test od zera (scenariusze A1-A5) i przez
 * to zgubila pokrycie planCityFounding sprzed niej (T1/T2/T4/T5) — mutacja
 * usuwajaca twardy filtr w findCityFoundingHex (zostawiajac tylko re-walidacje w
 * planCityFounding) dawala 16/16 PASS mimo realnego skutku gameplayowego (AI z
 * legalnym, dostepnym hexem w zasiegu moze nie zalozyc NICZEGO -- paraliz
 * ekspansji). Ten plik SCALA oba zestawy:
 *
 * Sekcja A (z rundy 1, T1-T5; T3 dolaczony w rundzie 4 wg werdyktu Evaluatora
 *   rundy 3, B3):
 *   T1 — AI NIE zaklada miasta poza wlasnym terytorium (repro buga: bez tego
 *        fixu bogaty w zasoby hex daleko od miasta wygrywalby przez +15 bonus).
 *   T2 — AI moze nadal zalozyc DRUGIE miasto blisko pierwszego w early-game
 *        (okno [MIN_CITY_DISTANCE, promien terytorium] nie jest puste).
 *   T3 — AI BEZ wlasnych miast zaklada pierwsze miasto BEZ restrykcji
 *        terytorium (parytet z isAwaitingFirstPlayerCity gracza).
 *   T4 — w obrebie wlasnego terytorium AI nadal wybiera DOBRY hex (rzeka),
 *        nie tylko pierwszy legalny -- usunieta premia nie psuje heurystyki.
 *   T5 — hex tuz POZA promieniem terytorium (promien+1) jest odrzucany mimo
 *        najlepszego mozliwego score (wartosc brzegowa promienia).
 *
 * Sekcja B (z rundy 2, B1 z werdyktu Evaluatora, poprawki N2/N3 w rundzie 3):
 *   straznik tekstowy main.ts — bramka sekcji A NIGDY nie laduje main.ts (ai.ts
 *   to tylko planista na migawce stanu), wiec musi istniec osobna kontrola
 *   tresci main.ts, ktora wykrywa cofniecie JEDYNEJ linii egzekwujacej wymog
 *   na poziomie wykonania (foundCityAt AI command handler).
 *   N2 (runda 3): guardedCallRe zluzniony do wzorca [^;]*, odporny na reformat
 *     wieloliniowy z przecinkiem koncowym (bareCallRe pozostaje strict, ale
 *     rowniez toleruje ewentualny przecinek koncowy).
 *   N3 (runda 3): B1e zawezony do PIERWSZEJ instrukcji funkcji (do najblizszego
 *     ';') + dowod ze miedzy nia a cityNodesForOwner(ownerId) NIE MA zadnego
 *     dodatkowego "return" -- lapie ciche zwolnienie AI z wymogu (np.
 *     "if (ownerId !== 0) return {};" wstawione tuz pod oryginalna linia),
 *     ktorego stary leniwy regex [\s\S]*? nie wykrywal (dowod mutacyjny
 *     potwierdzony w tej rundzie, patrz raport).
 *
 * Run from gra/:  node tools/ai-founding-territory-test.cjs
 */

const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('  FAIL:', msg); }
}
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// ============================================================================
// SEKCJA A — ai.ts: planCityFounding respektuje withinTerritory wzgledem
// WLASNYCH miast AI (z rundy 1, scenariusze T1/T2/T4/T5)
// ============================================================================

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[ai-founding-territory-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA_ROOT = path.resolve(__dirname, '..');
const AI_SRC = path.resolve(GRA_ROOT, 'src');
const ENTRY_FILE = path.resolve(__dirname, '.ai-founding-territory-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.ai-founding-territory-bundle.cjs');

const ENTRY_TS = `
export { planCityFounding, isLocalExpansionPhase } from ${JSON.stringify(AI_SRC + '/game/ai')};
export { hexDistance } from ${JSON.stringify(AI_SRC + '/units/setup')};
export { cityTerritoryRadius } from ${JSON.stringify(AI_SRC + '/map/territory')};
export { MIN_CITY_DISTANCE } from ${JSON.stringify(AI_SRC + '/game/cities')};
export { AI_FOUNDING_SOURCE_MIN_POP } from ${JSON.stringify(AI_SRC + '/game/city-founding')};
`;

fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' },
    outfile: BUNDLE_FILE,
    absWorkingDir: GRA_ROOT,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[ai-founding-territory-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const {
  planCityFounding,
  hexDistance,
  cityTerritoryRadius,
  MIN_CITY_DISTANCE,
  AI_FOUNDING_SOURCE_MIN_POP,
} = require(BUNDLE_FILE);

function makeMap(w, h) {
  const hexes = {};
  for (let q = 0; q < w; q++) {
    for (let r = 0; r < h; r++) {
      hexes[`${q},${r}`] = {
        coords: { q, r },
        terenBazowy: 'laka',
        nakladka: 'brak',
        ulepszenie: 'brak',
        wlasciciel: null,
        wioska: { istnieje: false, ludnosc: 0 },
        widocznosc: {},
        rzeka: { obecna: false, krawedzie: [] },
      };
    }
  }
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 42, riverPaths: [] };
}

function makeCity(id, ownerId, q, r, pop) {
  return { id, ownerId, q, r, population: pop, name: id };
}

function makeGameData(aiParamsOverride = {}) {
  return {
    units: [
      { Jednostka: 'Wojownik', Health: 30, Ruch: 2 },
      { Jednostka: 'Zwiadowca', Health: 20, Ruch: 3 },
    ],
    buildings: [],
    terrainYields: {
      terrain_types: [{ Teren: 'laka', Zywnosc: 4, Praca: 1, Handel: 1 }],
    },
    aiParams: aiParamsOverride,
  };
}

// Opcje wspólne: tura 20 -> koniec fazy lokalnej bez skautow (AI-LOCAL-Q1=A),
// wystarczajaca Praca w skarbcu.
const baseOpts = { currentTurn: 20, pracaAvailable: 200 };

// ----------------------------------------------------------------------------
// T1 — AI NIE zaklada miasta poza wlasnym terytorium (repro buga sprzed fixu)
// ----------------------------------------------------------------------------
console.log('\n--- T1: AI nie zaklada miasta poza wlasnym terytorium (repro) ---');
{
  const map = makeMap(40, 40);
  // Miasto-zrodlo: pop = AI_FOUNDING_SOURCE_MIN_POP (min. legalne dla AI, R-AI-FOUNDING-THROTTLE-Q1).
  const srcPop = AI_FOUNDING_SOURCE_MIN_POP;
  const city = makeCity('c1', 1, 20, 20, srcPop);
  const radius = cityTerritoryRadius({ q: 20, r: 20, pop: srcPop, level: 1 });

  // Hex daleko POZA terytorium (promien+10), naszpikowany bonusami, ktory
  // przed fixem wygrywalby dzieki AI_COLONIZATION_OUTSIDE_TERRITORY_BONUS (+15).
  const farQ = 20, farR = 20 + radius + 10;
  map.hexes[`${farQ},${farR}`].rzeka.obecna = true;
  map.hexes[`${farQ},${farR}`].nakladka = 'zloze_gliny';

  const data = makeGameData({
    ekspansja_min_dystans_miast: { wartosc: MIN_CITY_DISTANCE, sekcja: 'test', opis: '' },
    ekspansja_min_score_hex: { wartosc: 1, sekcja: 'test', opis: '' },
    ekspansja_heurystyka_rzeka_pkt: { wartosc: 10, sekcja: 'test', opis: '' },
    ekspansja_heurystyka_surowiec_pkt: { wartosc: 10, sekcja: 'test', opis: '' },
  });

  const cmd = planCityFounding(1, [city], map, data, {
    ...baseOpts,
    resourceDeficitKeys: ['glina'],
  }, MIN_CITY_DISTANCE);

  assert(cmd !== null && cmd.type === 'foundCityAt', 'T1a: planCityFounding zwraca foundCityAt (jest legalny hex w terytorium)');
  if (cmd) {
    const dist = hexDistance(cmd.q, cmd.r, city.q, city.r);
    assert(dist <= radius, `T1b: wybrany hex (${cmd.q},${cmd.r}) w promieniu terytorium ${radius} (dist=${dist})`);
    assert(!(cmd.q === farQ && cmd.r === farR), 'T1c: AI NIE wybrala dalekiego "przynetowego" hexu poza terytorium');
  }
}

// ----------------------------------------------------------------------------
// T2 — AI moze zalozyc DRUGIE miasto blisko pierwszego w early-game
// ----------------------------------------------------------------------------
console.log('\n--- T2: drugie miasto AI mozliwe blisko pierwszego (early-game) ---');
{
  const map = makeMap(30, 30);
  const srcPop = AI_FOUNDING_SOURCE_MIN_POP;
  const city = makeCity('c1', 1, 15, 15, srcPop);
  const radius = cityTerritoryRadius({ q: 15, r: 15, pop: srcPop, level: 1 });

  assert(radius >= MIN_CITY_DISTANCE, `T2 zalozenie: promien terytorium (${radius}) >= MIN_CITY_DISTANCE (${MIN_CITY_DISTANCE}) — okno istnieje`);

  const data = makeGameData({
    ekspansja_min_dystans_miast: { wartosc: MIN_CITY_DISTANCE, sekcja: 'test', opis: '' },
    ekspansja_min_score_hex: { wartosc: 1, sekcja: 'test', opis: '' },
  });

  const cmd = planCityFounding(1, [city], map, data, baseOpts, MIN_CITY_DISTANCE);

  assert(cmd !== null && cmd.type === 'foundCityAt', 'T2a: AI zaklada drugie miasto (nie zablokowane przez withinTerritory)');
  if (cmd) {
    const dist = hexDistance(cmd.q, cmd.r, city.q, city.r);
    assert(dist >= MIN_CITY_DISTANCE, `T2b: dystans (${dist}) >= MIN_CITY_DISTANCE (${MIN_CITY_DISTANCE})`);
    assert(dist <= radius, `T2c: dystans (${dist}) <= promien terytorium (${radius})`);
  }
}

// ----------------------------------------------------------------------------
// T3 — AI BEZ wlasnych miast zaklada pierwsze miasto BEZ restrykcji terytorium
// (parytet z isAwaitingFirstPlayerCity gracza)
// ----------------------------------------------------------------------------
console.log('\n--- T3: brak miast wlasnych -> founding bez restrykcji terytorium ---');
{
  const map = makeMap(20, 20);
  const data = makeGameData({
    ekspansja_min_dystans_miast: { wartosc: MIN_CITY_DISTANCE, sekcja: 'test', opis: '' },
  });
  // cities=[] -> myCities puste (AI bez wlasnych miast, parytet z pierwszym miastem gracza).
  const cmd = planCityFounding(1, [], map, data, baseOpts, MIN_CITY_DISTANCE);
  assert(cmd !== null && cmd.type === 'foundCityAt', 'T3: brak wlasnych miast -> founding nieograniczony terytorium (jak pierwsze miasto gracza)');
}

// ----------------------------------------------------------------------------
// T4 — w terytorium AI nadal wybiera DOBRY hex (rzeka), nie pierwszy legalny
// ----------------------------------------------------------------------------
console.log('\n--- T4: AI woli hex z rzeka w obrebie terytorium (nie pierwszy legalny) ---');
{
  const map = makeMap(30, 30);
  const srcPop = AI_FOUNDING_SOURCE_MIN_POP;
  const city = makeCity('c1', 1, 15, 15, srcPop);
  const radius = cityTerritoryRadius({ q: 15, r: 15, pop: srcPop, level: 1 });

  // Hex z rzeka WEWNATRZ terytorium (dystans w oknie [MIN_CITY_DISTANCE, radius]).
  const riverQ = 15, riverR = 15 + Math.min(radius, MIN_CITY_DISTANCE + 1);
  map.hexes[`${riverQ},${riverR}`].rzeka.obecna = true;

  const data = makeGameData({
    ekspansja_min_dystans_miast: { wartosc: MIN_CITY_DISTANCE, sekcja: 'test', opis: '' },
    ekspansja_min_score_hex: { wartosc: 1, sekcja: 'test', opis: '' },
    ekspansja_heurystyka_rzeka_pkt: { wartosc: 20, sekcja: 'test', opis: '' },
  });

  const cmd = planCityFounding(1, [city], map, data, baseOpts, MIN_CITY_DISTANCE);
  assert(cmd !== null, 'T4a: founding zwraca komende');
  if (cmd) {
    eq(cmd.q, riverQ, 'T4b: AI wybiera hex z rzeka (q)');
    eq(cmd.r, riverR, 'T4c: AI wybiera hex z rzeka (r)');
  }
}

// ----------------------------------------------------------------------------
// T5 — hex TUZ poza promieniem terytorium (promien+1) jest odrzucany mimo
//      najlepszego mozliwego score (wartosc brzegowa)
// ----------------------------------------------------------------------------
console.log('\n--- T5: hex promien+1 (tuz poza terytorium) odrzucony mimo najwyzszego score ---');
{
  const map = makeMap(30, 30);
  const srcPop = AI_FOUNDING_SOURCE_MIN_POP;
  const city = makeCity('c1', 1, 15, 15, srcPop);
  const radius = cityTerritoryRadius({ q: 15, r: 15, pop: srcPop, level: 1 });

  // Hex dokladnie na granicy (w terytorium) — powinien byc legalny.
  const edgeInQ = 15, edgeInR = 15 + radius;
  // Hex jeden dalej (poza terytorium) — mocno wzbogacony, MUSI byc odrzucony.
  const edgeOutQ = 15, edgeOutR = 15 + radius + 1;
  map.hexes[`${edgeOutQ},${edgeOutR}`].rzeka.obecna = true;
  map.hexes[`${edgeOutQ},${edgeOutR}`].nakladka = 'zloze_gliny';

  const data = makeGameData({
    ekspansja_min_dystans_miast: { wartosc: MIN_CITY_DISTANCE, sekcja: 'test', opis: '' },
    ekspansja_min_score_hex: { wartosc: 1, sekcja: 'test', opis: '' },
    ekspansja_heurystyka_rzeka_pkt: { wartosc: 50, sekcja: 'test', opis: '' },
    ekspansja_heurystyka_surowiec_pkt: { wartosc: 50, sekcja: 'test', opis: '' },
  });

  const cmd = planCityFounding(1, [city], map, data, {
    ...baseOpts,
    resourceDeficitKeys: ['glina'],
  }, MIN_CITY_DISTANCE);

  assert(cmd !== null, 'T5a: founding zwraca komende (jest legalny hex w terytorium)');
  if (cmd) {
    const dist = hexDistance(cmd.q, cmd.r, city.q, city.r);
    assert(dist <= radius, `T5b: wybrany hex w promieniu terytorium (dist=${dist} <= ${radius})`);
    assert(!(cmd.q === edgeOutQ && cmd.r === edgeOutR), 'T5c: hex promien+1 (bogaty w bonusy) NIE zostal wybrany');
  }
  eq(edgeInR - 15, radius, 'T5d (sanity): edgeIn faktycznie na granicy promienia');
}

// ----------------------------------------------------------------------------
// A5 — straznik tekstowy ai.ts: premia +15 i requireOutsideTerritory USUNIETE
// (z rundy 2, zachowane -- prosty i wciaz wartosciowy pin)
// ----------------------------------------------------------------------------
console.log('\n--- A5: straznik tekstowy ai.ts -- premia +15 za oddalenie i flaga requireOutsideTerritory USUNIETE ---');
{
  const aiSrc = fs.readFileSync(path.resolve(GRA_ROOT, 'src/game/ai.ts'), 'utf8');
  assert(!/AI_COLONIZATION_OUTSIDE_TERRITORY_BONUS/.test(aiSrc),
    'A5a: stala premii +15 za zakladanie poza zasiegiem nie moze istniec w ai.ts');
  assert(!/requireOutsideTerritory/.test(aiSrc),
    'A5b: flaga requireOutsideTerritory (odwrotny kierunek wymogu) nie moze istniec w ai.ts');
}

try { fs.unlinkSync(ENTRY_FILE); } catch (e) { /* noop */ }
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) { /* noop */ }

// ============================================================================
// SEKCJA B (z rundy 2, B1; poprawki N2/N3 w rundzie 3) — straznik tekstowy
// main.ts: bramka sekcji A NIGDY nie laduje main.ts (ai.ts to tylko planista
// na migawce stanu), wiec musi istniec kontrola tresci pliku, ktora wykryje
// cofniecie JEDYNEJ linii egzekwujacej wymog na poziomie wykonania rozkazu AI.
// ============================================================================

console.log('\n--- B1: straznik tekstowy main.ts -- blok obslugi cmd.type === "foundCityAt" (AI) ---');
{
  const mainTsPath = path.resolve(GRA_ROOT, 'src/main.ts');
  const mainSrc = fs.readFileSync(mainTsPath, 'utf8');

  const startMarker = "if (cmd.type === 'foundCityAt') {";
  const startIdx = mainSrc.indexOf(startMarker);
  assert(startIdx !== -1, 'B1-pre: marker startu bloku foundCityAt (AI) nie znaleziony w main.ts');

  const searchFrom = startIdx + startMarker.length;
  const nextIfIdx = mainSrc.indexOf('if (cmd.type ===', searchFrom);
  assert(nextIfIdx !== -1 && nextIfIdx > startIdx,
    'B1-pre: nastepny blok "if (cmd.type ===" po foundCityAt nie znaleziony w main.ts');

  const block = (startIdx !== -1 && nextIfIdx !== -1)
    ? mainSrc.slice(startIdx, nextIfIdx)
    : '';

  // (1) obecnosc wywolania z opcjami terytorium (parytet gracz/AI egzekwowany).
  // N2 (runda 3, poprawka Evaluatora): wzorzec [^;]* zamiast sztywnej kolejnosci
  // argumentow/spacji -- odporny na reformat wieloliniowy z przecinkiem koncowym
  // (np. canFoundCity(\n  cmd.q,\n  cmd.r,\n  cities,\n  map,\n  foundingTerritoryOpts(ownerId),\n)),
  // ktory sztywny wzorzec z rundy 2 by przeoczyl.
  const guardedCallRe = /canFoundCity\([^;]*foundingTerritoryOpts\(\s*ownerId\s*\)/;
  assert(guardedCallRe.test(block),
    'B1a: blok foundCityAt (AI) musi wolac canFoundCity(cmd.q, cmd.r, cities, map, foundingTerritoryOpts(ownerId))');

  // (2) BRAK golego wywolania bez opcji -- regex konczacy sie na "map)" (opcjonalny
  // przecinek koncowy) bez dalszych argumentow w tym samym wywolaniu. To jest CEL
  // tego strażnika: cofniecie jedynej linii egzekwujacej wymog (usuniecie 5. argumentu)
  // daloby 15/15 PASS bez tej asercji.
  const bareCallRe = /canFoundCity\(\s*cmd\.q\s*,\s*cmd\.r\s*,\s*cities\s*,\s*map\s*,?\s*\)/;
  assert(!bareCallRe.test(block),
    'B1b: blok foundCityAt (AI) NIE MOZE zawierac golego canFoundCity(cmd.q, cmd.r, cities, map) bez opcji terytorium');

  // (3) foundingTerritoryOpts: musi uzywac cityNodesForOwner(ownerId) + isInTerritory, a jej
  // wczesny return (skip terytorium) musi byc zawezony DOKLADNIE do ownerId === 0 (gracz) --
  // zeby przyszla zmiana nie zwolnila po cichu AI (ownerId > 0) z wymogu.
  const fnMarker = 'function foundingTerritoryOpts(ownerId: number)';
  const fnStart = mainSrc.indexOf(fnMarker);
  assert(fnStart !== -1, 'B1-pre: definicja foundingTerritoryOpts nie znaleziona w main.ts');

  // Balansuje nawiasy klamrowe od podanego indeksu '{' i zwraca indeks TUZ ZA dopasowanym '}'.
  function balancedBraceEnd(src, openBraceIdx) {
    let depth = 0;
    let i = openBraceIdx;
    for (; i < src.length; i++) {
      if (src[i] === '{') depth++;
      else if (src[i] === '}') {
        depth--;
        if (depth === 0) { i++; break; }
      }
    }
    return i;
  }

  let fnBody = '';
  if (fnStart !== -1) {
    // Sygnatura ma typ zwracany w nawiasach klamrowych PRZED cialem funkcji:
    // "function foundingTerritoryOpts(ownerId: number): { withinTerritory?: ... } {".
    // Pierwsze '{' po fnStart to adnotacja typu (rowniez zbalansowana) -- trzeba ja pominac
    // i dopiero KOLEJNE '{' potraktowac jako realny poczatek ciala funkcji.
    const typeBraceStart = mainSrc.indexOf('{', fnStart);
    const afterTypeBrace = typeBraceStart !== -1 ? balancedBraceEnd(mainSrc, typeBraceStart) : -1;
    const bodyBraceStart = afterTypeBrace !== -1 ? mainSrc.indexOf('{', afterTypeBrace) : -1;
    const bodyEnd = bodyBraceStart !== -1 ? balancedBraceEnd(mainSrc, bodyBraceStart) : fnStart;
    fnBody = mainSrc.slice(fnStart, bodyEnd);
  }

  assert(fnBody.includes('cityNodesForOwner(ownerId)'),
    'B1c: foundingTerritoryOpts musi wolac cityNodesForOwner(ownerId)');
  assert(/isInTerritory/.test(fnBody),
    'B1d: foundingTerritoryOpts musi uzywac isInTerritory');

  // N3 (runda 3, poprawka Evaluatora): stary leniwy regex [\s\S]*? dopasowywal sie
  // do PIERWSZEGO legalnego "if (ownerId === 0 && ...) return {}" w calym ciele
  // funkcji NIEZALEZNIE od tego, co zostalo wstawione PO nim -- wiec mutacja
  // dopisujaca ciche zwolnienie AI ("if (ownerId !== 0) return {};" tuz pod
  // oryginalna linia) nadal dawala PASS (dowod mutacyjny w tej rundzie).
  // Naprawa: wytnij PREAMBULE (od poczatku ciala do pierwszego wystapienia
  // cityNodesForOwner(ownerId), czyli realnej logiki terytorium), zweryfikuj ze
  // PIERWSZA instrukcja w tej preambule (do najblizszego ';', bez przeskakiwania
  // przez kod) to dokladnie "if (ownerId === 0 && ...) return {}", i ze NIC innego
  // w preambule (miedzy ta instrukcja a cityNodesForOwner) nie zawiera "return".
  const cityNodesMarker = 'cityNodesForOwner(ownerId)';
  const cityNodesIdx = fnBody.indexOf(cityNodesMarker);
  assert(cityNodesIdx !== -1, 'B1e-pre: cityNodesForOwner(ownerId) nie znaleziony w ciele foundingTerritoryOpts');
  const preamble = cityNodesIdx !== -1 ? fnBody.slice(0, cityNodesIdx) : fnBody;

  // Pierwsza instrukcja preambuly, ograniczona do najblizszego ';' -- warunek
  // "ownerId === 0 && ..." nie zawiera srednika, wiec to bezpiecznie wycina
  // DOKLADNIE jedna instrukcje, bez przeskakiwania przez kolejne linie kodu.
  const firstStmtMatch = preamble.match(/if\s*\(\s*ownerId\s*===\s*0\s*&&[\s\S]*?;/);
  assert(firstStmtMatch !== null,
    'B1e-a: pierwsza instrukcja w foundingTerritoryOpts musi zaczynac sie od "if (ownerId === 0 && ...)"');
  if (firstStmtMatch !== null) {
    assert(/return\s*\{\}\s*;?\s*$/.test(firstStmtMatch[0]),
      'B1e-b: pierwsza instrukcja (ownerId === 0 && ...) musi konczyc sie na "return {}"');
    const rest = preamble.slice(firstStmtMatch.index + firstStmtMatch[0].length);
    assert(!/\breturn\b/.test(rest),
      'B1e-c: ZADEN dodatkowy "return" nie moze wystapic miedzy pierwsza instrukcja (ownerId===0) '
      + 'a cityNodesForOwner(ownerId) -- lapie ciche zwolnienie AI z wymogu (np. '
      + '"if (ownerId !== 0) return {};") wstawione tuz pod oryginalna linia');
  }
}

console.log(`\n=== ai-founding-territory-test: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
