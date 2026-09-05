'use strict';
/**
 * szczescie-przebudowa-skali-test.cjs
 * Bramka tematu R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1 (pietnascie zmian G1-G15, wszystkie liczby
 * pochodza od wlasciciela — decyzje z 2026-09-05, `dyspozycje/BALANS-SZCZESCIE-SKALOWANIE-EPOK.md`).
 *
 * Run: cd gra && node tools/szczescie-przebudowa-skali-test.cjs
 *
 * Test importuje PRAWDZIWE moduly (esbuild na ../src/game/*) i PRAWDZIWE dane (data/*.json) —
 * nie odtwarza formul wlasna kopia (playbook C-046, wzorzec ucieczki mutacyjnej). Kazda liczba
 * oczekiwana w asercjach jest liczba WLASCICIELA z 00-dispatch.md, nie wyliczona przez test.
 *
 * Sekcje = kryteria konca 2a-2i z 00-dispatch.md:
 *   2a  asercja PER BUDYNEK: 19 daje szczescie, 22 daje DOKLADNIE 0
 *   2b  suma z budynkow = 14 / 25 / 42 (epoki 1-3, po zwinieciu lancuchow ulepszen)
 *   2c  kultura i religia: 100% -> +x, 0% -> -x, 50% -> 0, 75% -> +x/2
 *   2d  Wealth: poziom = cap epoki -> +10 w epokach 1, 2 i 3 osobno
 *   2e  podatki: 0% -> -10, 90% -> +10, 45% -> 0
 *   2f  zaopatrzenie: +2 i -2 na surowiec
 *   2g  skan negatywny: zaden z 7 usunietych kluczy nie wystepuje w society-params.json
 *   2h  scenariusz optymistyczny pop 8 = 58 / 85 / 118 pkt, szPct = 120% na normalu
 *   2i  cityPanel.ts i silnik daja TEN SAM wynik (jeden tor, nie dwa)
 */

const fs = require('fs');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const esbuild = (() => {
  try { return require(path.resolve(GRA, 'node_modules', 'esbuild')); }
  catch (e) {
    console.error('[szczescie-przebudowa-skali-test] brak esbuild. Uruchom: npm install (z gra/)');
    process.exit(1);
  }
})();

const ENTRY  = path.resolve(__dirname, '.szczescie-przebudowa-skali-entry.ts');
const BUNDLE = path.resolve(__dirname, '.szczescie-przebudowa-skali-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  computeHappinessBreakdown,
  evaluateOrderFromBreakdown,
  loadSocietyScaleParams,
  szMaxForEra,
  szMaxForCity,
  kultReligScaleForEra,
  proporcjonalneSzczescie,
  ownShareFromSignal,
  luksusHappinessBonus,
} from '../src/game/society-breakdown';
export {
  buildingHappinessAtLevel,
  buildingGivesHappiness,
  sumBuildingHappinessFromBuiltIds,
  BUILDING_HAPPINESS_BASE_PER_BUILDING,
} from '../src/game/economy';
export { wealthZadowolenie, wealthCap, loadWealthParams } from '../src/game/wealth';
export { religionHappiness, religionOwnShare } from '../src/game/culture-religion';
export { conquestUnstableHappinessPenalty } from '../src/game/conquest-stability';
export {
  resolveCitizenResourceCoverage,
  CITIZEN_UPKEEP_HAPPINESS_PER_AVAILABLE,
  CITIZEN_UPKEEP_HAPPINESS_PER_MISSING,
} from '../src/game/citizen-resource-upkeep';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE,
    absWorkingDir: GRA,
    logLevel: 'silent',
    resolveExtensions: ['.ts', '.js', '.json'],
  });
} catch (e) {
  console.error('[szczescie-przebudowa-skali-test] bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE);

const society   = require('../data/society-params.json');
const buildings = require('../data/buildings.json');
const wonders   = require('../data/wonders.json');
const econ      = require('../data/econ-params.json');
const upkeep    = require('../data/citizen-resource-upkeep.json');

let passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('  [FAIL] ' + msg); }
}
function eq(a, b, msg) {
  ok(a === b, msg + ' -- got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b));
}
function near(a, b, msg, eps) {
  const e = eps === undefined ? 1e-9 : eps;
  ok(Math.abs(a - b) <= e, msg + ' -- got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b));
}
function section(t) { console.log('\n-- ' + t + ' --'); }

console.log('\n[szczescie-przebudowa-skali-test] R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1');

// ===========================================================================
// Listy WLASCICIELA (00-dispatch.md G1) — wpisane wprost, nie odczytane z danych,
// zeby test faktycznie sprawdzal dane, a nie powtarzal je za nimi.
// ===========================================================================
const TAK = [
  'studnia', 'kamienne_kregi', 'palac', 'spichlerz', 'targowisko', 'stela', 'swiatynia',
  'akwedukt', 'palac_ii', 'spichlerz_ii', 'trybunal', 'biblioteka', 'port', 'teatr',
  'laznia_publiczna', 'palac_iii', 'akademia', 'sad', 'port_wielki',
];
const NIE = [
  'dom_starszyzny', 'palisada', 'garncarnia', 'kamieniarski', 'stolarnia', 'dwor_zarzadcy',
  'mury', 'mennica', 'cegielnia', 'odlewnia_brazu', 'magazyn', 'kuznia', 'koszary',
  'pretorium', 'baszta', 'fort', 'odlewnia_zelaza', 'kuznia_zelaza', 'akademia_wojskowa',
  'warsztat_oblezniczy', 'wielka_kuznia', 'wielka_odlewnia',
];
const byId = new Map(buildings.map(b => [b.id, b]));

// ===========================================================================
// 2a. ASERCJA PER BUDYNEK — 19 daje szczescie, 22 daje DOKLADNIE 0
// ===========================================================================
section('2a. per budynek: 19 szczesciodajnych, 22 z zerem (G1)');
eq(TAK.length, 19, 'lista TAK ma 19 pozycji');
eq(NIE.length, 22, 'lista NIE ma 22 pozycje');
eq(buildings.length, 41, 'katalog budynkow ma 41 pozycji (19 + 22)');
eq(TAK.filter(id => NIE.includes(id)).length, 0, 'listy TAK i NIE sa rozlaczne');

for (const id of TAK) {
  const b = byId.get(id);
  ok(!!b, '2a: budynek "' + id + '" istnieje w buildings.json');
  if (!b) continue;
  eq(b.dajeSzczescie, true, '2a: "' + id + '" ma dajeSzczescie: true w danych');
  eq(M.buildingGivesHappiness(b), true, '2a: "' + id + '" jest szczesciodajny wg kodu');
  ok(M.buildingHappinessAtLevel(b, 1) > 0, '2a: "' + id + '" daje szczescie > 0 (poziom 1)');
}
for (const id of NIE) {
  const b = byId.get(id);
  ok(!!b, '2a: budynek "' + id + '" istnieje w buildings.json');
  if (!b) continue;
  eq(b.dajeSzczescie, false, '2a: "' + id + '" ma dajeSzczescie: false w danych');
  eq(M.buildingGivesHappiness(b), false, '2a: "' + id + '" NIE jest szczesciodajny wg kodu');
  eq(M.buildingHappinessAtLevel(b, 1), 0, '2a: "' + id + '" daje DOKLADNIE 0 (poziom 1)');
  eq(M.buildingHappinessAtLevel(b, 3), 0, '2a: "' + id + '" daje DOKLADNIE 0 takze na poziomie 3');
}
// brak flagi = brak szczescia (nowy budynek musi zostac sklasyfikowany swiadomie)
eq(M.buildingHappinessAtLevel({ baza: { zadowolenie: 5 } }, 1), 0,
  '2a: budynek BEZ pola dajeSzczescie daje 0, mimo baza.zadowolenie = 5');
eq(M.BUILDING_HAPPINESS_BASE_PER_BUILDING, 1, '2a: ryczalt za budynek szczesciodajny to +1');

// G2 + wartosci zachowane
eq(M.buildingHappinessAtLevel(byId.get('spichlerz'), 1), 5, 'G2: Spichlerz lacznie +5');
eq(M.buildingHappinessAtLevel(byId.get('spichlerz_ii'), 1), 5, 'G2: Spichlerz II lacznie +5');
eq(M.buildingHappinessAtLevel(byId.get('swiatynia'), 1), 3, 'G2: Swiatynia zachowuje +3');
eq(M.buildingHappinessAtLevel(byId.get('teatr'), 1), 4, 'G2: Teatr zachowuje +4');
eq(M.buildingHappinessAtLevel(byId.get('akademia'), 1), 4, 'G2: Akademia zachowuje +4');

// ===========================================================================
// 2b. SUMA Z BUDYNKOW = 14 / 25 / 42 po ZWINIECIU LANCUCHOW ULEPSZEN
// ===========================================================================
section('2b. suma z budynkow 14 / 25 / 42 (lancuchy ulepszen zwiniete)');

/**
 * Komplet budynkow stojacych w miescie w epoce `era`. Ulepszenie USUWA poprzednika
 * (`building-resource-gate.ts:357`), wiec kazdy budynek, ktory jest `upgradeFrom`
 * innego DOSTEPNEGO juz budynku, znika z listy. Miasto z kompletem ma 11 / 23 / 31
 * budynkow, NIE 11 / 26 / 39.
 */
function builtIdsForEra(era) {
  const dostepne = buildings.filter(b => b.epokaWejscia <= era).map(b => b.id);
  const zastapione = new Set(
    buildings.filter(b => b.epokaWejscia <= era && b.upgradeFrom).map(b => b.upgradeFrom),
  );
  return dostepne.filter(id => !zastapione.has(id));
}
eq(builtIdsForEra(1).length, 11, '2b: epoka 1 — komplet to 11 budynkow');
eq(builtIdsForEra(2).length, 23, '2b: epoka 2 — komplet to 23 budynki (nie 26)');
eq(builtIdsForEra(3).length, 31, '2b: epoka 3 — komplet to 31 budynkow (nie 39)');

// Poziom 1 = wartosci BAZOWE z buildings.json. To jest odniesienie wlasciciela: BUD(e)
// w BALANS-SZCZESCIE-SKALOWANIE-EPOK.md to suma bazowego szczescia budynkow stojacych
// w epoce e, bez mnoznika poziomu z buildingLevelForEpoch.
const BUD = { 1: 14, 2: 25, 3: 42 };
for (const era of [1, 2, 3]) {
  const suma = M.sumBuildingHappinessFromBuiltIds(builtIdsForEra(era), buildings, () => 1);
  eq(suma, BUD[era], '2b: BUD(epoka ' + era + ') = ' + BUD[era]);
}
// kontrola negatywna: gdyby lancuchy NIE byly zwiniete, liczby by sie nie zgadzaly
{
  const bezZwiniecia = buildings.filter(b => b.epokaWejscia <= 3).map(b => b.id);
  const suma = M.sumBuildingHappinessFromBuiltIds(bezZwiniecia, buildings, () => 1);
  ok(suma !== BUD[3],
    '2b: suma BEZ zwiniecia lancuchow (' + suma + ') rozni sie od 42 — test faktycznie zwija');
}

// ===========================================================================
// 2c. KULTURA I RELIGIA PROPORCJONALNIE
// ===========================================================================
section('2c. kultura i religia proporcjonalnie (G4)');
const X_WLASCICIELA = { 1: 10, 2: 16, 3: 23 };
for (const diff of ['easy', 'normal', 'hard']) {
  const scale = M.loadSocietyScaleParams(society, diff);
  for (const era of [1, 2, 3]) {
    eq(M.kultReligScaleForEra(era, scale), X_WLASCICIELA[era],
      '2c: x(epoka ' + era + ', ' + diff + ') = ' + X_WLASCICIELA[era] + ' (G13: te same na kazdej trudnosci)');
  }
}
for (const era of [1, 2, 3]) {
  const x = X_WLASCICIELA[era];
  near(M.proporcjonalneSzczescie(x, 1.0),  x, '2c: 100% wlasnej (epoka ' + era + ') -> +' + x);
  near(M.proporcjonalneSzczescie(x, 0.0), -x, '2c: 100% obcej (epoka ' + era + ') -> -' + x);
  eq(M.proporcjonalneSzczescie(x, 0.5), 0, '2c: 50/50 (epoka ' + era + ') -> DOKLADNIE 0');
  near(M.proporcjonalneSzczescie(x, 0.75), x / 2, '2c: 75% wlasnej (epoka ' + era + ') -> +x/2 = ' + (x / 2));
  near(M.proporcjonalneSzczescie(x, 0.25), -x / 2, '2c: 25% wlasnej (epoka ' + era + ') -> -x/2');
}
// pelna sciezka przez rozpiske: linia Kultury i linia Religii
for (const era of [1, 2, 3]) {
  const x = X_WLASCICIELA[era];
  const probe = (share, relShare) => M.computeHappinessBreakdown({
    difficulty: 'normal', era, population: 3, buildingZadowolenie: 0,
    ownCultureShare: share, ownReligionShare: relShare,
  }, society).lines;
  const l100 = probe(1, 1);
  near((l100.find(l => l.id === 'kultura') || {}).value, x, '2c: linia Kultury 100% (epoka ' + era + ') = +' + x);
  near((l100.find(l => l.id === 'religia') || {}).value, x, '2c: linia Religii 100% (epoka ' + era + ') = +' + x);
  const l0 = probe(0, 0);
  near((l0.find(l => l.id === 'kultura') || {}).value, -x, '2c: linia Kultury 0% (epoka ' + era + ') = -' + x);
  near((l0.find(l => l.id === 'religia') || {}).value, -x, '2c: linia Religii 0% (epoka ' + era + ') = -' + x);
  const l50 = probe(0.5, 0.5);
  eq(l50.filter(l => l.id === 'kultura' || l.id === 'religia').length, 0,
    '2c: przy 50/50 (epoka ' + era + ') linie Kultury i Religii sa zerowe (brak wiersza)');
  const l75 = probe(0.75, 0.75);
  near((l75.find(l => l.id === 'kultura') || {}).value, x / 2, '2c: linia Kultury 75% (epoka ' + era + ') = +x/2');
  near((l75.find(l => l.id === 'religia') || {}).value, x / 2, '2c: linia Religii 75% (epoka ' + era + ') = +x/2');
}
// brak ownCultureShare = miasto bez mixu = 100% wlasnej kultury
{
  const lines = M.computeHappinessBreakdown(
    { difficulty: 'normal', era: 2, population: 3, buildingZadowolenie: 0 }, society,
  ).lines;
  near((lines.find(l => l.id === 'kultura') || {}).value, 16,
    '2c: brak ownCultureShare -> 100% wlasnej -> +16 (epoka 2)');
}
// religionHappiness zwraca ZNORMALIZOWANY wskaznik, nie punkty
eq(M.religionHappiness({ counts: { A: 10 } }, 'A'), 1, '2c: religionHappiness 100% wlasnej = wskaznik +1');
eq(M.religionHappiness({ counts: { B: 10 } }, 'A'), -1, '2c: religionHappiness 100% obcej = wskaznik -1');
eq(M.religionHappiness({ counts: { A: 5, B: 5 } }, 'A'), 0, '2c: religionHappiness 50/50 = wskaznik 0');
eq(M.religionHappiness({ counts: {} }, 'A'), 0, '2c: miasto bez wyznawcow = wskaznik 0 (neutralnie)');
near(M.religionOwnShare({ counts: { A: 3, B: 1 } }, 'A'), 0.75, '2c: religionOwnShare 3:1 = 0,75');
// wskaznik -> ta sama linia co udzial jawny (jeden tor, nie dwa)
for (const era of [1, 2, 3]) {
  const zWskaznika = M.computeHappinessBreakdown({
    difficulty: 'normal', era, population: 3, buildingZadowolenie: 0,
    haRel: M.religionHappiness({ counts: { A: 3, B: 1 } }, 'A'),
  }, society).lines.find(l => l.id === 'religia');
  const zUdzialu = M.computeHappinessBreakdown({
    difficulty: 'normal', era, population: 3, buildingZadowolenie: 0, ownReligionShare: 0.75,
  }, society).lines.find(l => l.id === 'religia');
  near(zWskaznika.value, zUdzialu.value,
    '2c: linia Religii z haRel = linia z ownReligionShare (epoka ' + era + ')');
}
// G5: kary usuniete na OBU torach
eq(M.conquestUnstableHappinessPenalty(0, true, society, 'normal'), 0,
  'G5: conquestUnstableHappinessPenalty zawsze 0');
{
  const lines = M.computeHappinessBreakdown({
    difficulty: 'normal', era: 1, population: 3, buildingZadowolenie: 0,
    foreignReligionDominant: true, conquestUnstablePenalty: -2,
    hasSwiatynia: true, hasAmfiteatr: true,
    ceramikaZadowolenie: 1, spichlerzZadowolenie: 1,
  }, society).lines;
  const ids = lines.map(l => l.id);
  for (const zniknelo of ['obca_religia', 'podboj_niestabilny', 'swiatynia', 'amfiteatr',
                          'ceramika', 'spichlerz', 'zageszczenie']) {
    eq(ids.includes(zniknelo), false, 'G3/G5/G12: brak wiersza "' + zniknelo + '" w rozpisce');
  }
}
// G12: brak kary zageszczenia takze w duzym miescie
{
  const ids = M.computeHappinessBreakdown({
    difficulty: 'normal', era: 3, population: 20, buildingZadowolenie: 0,
  }, society).lines.map(l => l.id);
  eq(ids.includes('zageszczenie'), false, 'G12: pop 20 — nadal brak wiersza zageszczenia');
}

// ===========================================================================
// 2d. WEALTH — poziom = cap epoki -> +10 w epokach 1, 2 i 3 OSOBNO
// ===========================================================================
section('2d. Wealth: cap epoki -> +10 (G6)');
const wp = M.loadWealthParams(econ, 'normal');
for (const era of [1, 2, 3]) {
  const cap = M.wealthCap(era, wp);
  eq(cap, era * 10, '2d: cap epoki ' + era + ' = ' + (era * 10));
  eq(M.wealthZadowolenie(cap, wp, era), 10, '2d: poziom = cap epoki ' + era + ' -> +10');
  eq(M.wealthZadowolenie(Math.floor(cap / 2), wp, era), 5, '2d: polowa capu epoki ' + era + ' -> +5');
  eq(M.wealthZadowolenie(0, wp, era), 0, '2d: W=0 (epoka ' + era + ') -> 0 (karaZero)');
}
eq(M.wealthZadowolenie(10, wp, 1), 10, '2d: poziom 10 w epoce 1 -> +10 (dawniej +1)');
eq(M.wealthZadowolenie(10, wp, 2), 5, '2d: poziom 10 w epoce 2 -> +5 (prog rosnie)');
eq(M.wealthZadowolenie(10, wp, 3), 3, '2d: poziom 10 w epoce 3 -> +3');
for (const diff of ['easy', 'normal', 'hard']) {
  eq(M.loadWealthParams(econ, diff).zadowolenieMax, 10,
    '2d: wealth_zadowolenie_max = 10 na poziomie ' + diff + ' (G13)');
}

// ===========================================================================
// 2e. PODATKI LINIOWO
// ===========================================================================
section('2e. podatki liniowo -10 .. +10 (G7)');
for (const diff of ['easy', 'normal', 'hard']) {
  near(M.luksusHappinessBonus(0, society, diff), -10, '2e: udzial 0% (' + diff + ') -> -10');
  near(M.luksusHappinessBonus(90, society, diff), 10, '2e: udzial 90% (' + diff + ') -> +10');
  eq(M.luksusHappinessBonus(45, society, diff), 0, '2e: udzial 45% (' + diff + ') -> DOKLADNIE 0');
  near(M.luksusHappinessBonus(100, society, diff), 10, '2e: udzial 100% (' + diff + ') -> +10 (obciete progiem)');
}
near(M.luksusHappinessBonus(22.5, society, 'normal'), -5, '2e: udzial 22,5% -> -5 (liniowo)');
near(M.luksusHappinessBonus(67.5, society, 'normal'), 5, '2e: udzial 67,5% -> +5 (liniowo)');
near(M.luksusHappinessBonus(-5, society, 'normal'), -10, '2e: udzial ujemny -> jak 0% -> -10');
near(M.luksusHappinessBonus(NaN, society, 'normal'), -10, '2e: udzial NaN -> jak 0% -> -10');

// ===========================================================================
// 2f. ZAOPATRZENIE +-2 NA SUROWIEC
// ===========================================================================
section('2f. zaopatrzenie obywateli +-2 na surowiec (G8)');
function zaopatrzenieLinia(delta, era) {
  const l = M.computeHappinessBreakdown({
    difficulty: 'normal', era: era || 1, population: 3, buildingZadowolenie: 0,
    ownCultureShare: 0.5, ownReligionShare: 0.5,
    citizenResourceHappinessDelta: delta,
  }, society).lines.find(l2 => l2.id === 'zaopatrzenie_obywateli');
  return l ? l.value : 0;
}

// Zrodlo prawdy dla +-2 to data/citizen-resource-upkeep.json -> _kara. Po ratyfikacji
// orkiestratora (runda 2) NIE MA juz drugiego nosnika tej liczby: mnoznik obejsciowy
// `szczescie_zaopatrzenie_na_surowiec` zostal usuniety z society-params.json, a rozpiska
// wstawia sume dostarczona przez `resolveCitizenResourceCoverage` 1:1.
eq(upkeep._kara.szczescieZaDostepny, 2,
  '2f: citizen-resource-upkeep._kara.szczescieZaDostepny = +2 (G8, liczba wlasciciela)');
eq(upkeep._kara.szczescieZaBrakujacy, -2,
  '2f: citizen-resource-upkeep._kara.szczescieZaBrakujacy = -2 (G8, symetrycznie)');
eq(M.CITIZEN_UPKEEP_HAPPINESS_PER_AVAILABLE, 2,
  '2f: stala TS czyta +2 z danych (nie z fallbacku +1)');
eq(M.CITIZEN_UPKEEP_HAPPINESS_PER_MISSING, -2,
  '2f: stala TS czyta -2 z danych (nie z fallbacku -1)');
eq(Object.prototype.hasOwnProperty.call(society.szczescie, 'szczescie_zaopatrzenie_na_surowiec'), false,
  '2f: mnoznik obejsciowy szczescie_zaopatrzenie_na_surowiec USUNIETY (jeden nosnik liczby, nie dwa)');

// Rozpiska nie skaluje juz wejscia — 1:1. Gdyby ktos przywrocil mnoznik obok +-2 w danych,
// linia dalaby +-4 i te cztery asercje zaczerwienieja.
eq(zaopatrzenieLinia(2), 2, '2f: 1 surowiec dostarczony (delta +2) -> linia +2, bez mnozenia');
eq(zaopatrzenieLinia(-2), -2, '2f: 1 surowiec brakujacy (delta -2) -> linia -2, bez mnozenia');
eq(zaopatrzenieLinia(4), 4, '2f: 2 surowce dostarczone (delta +4) -> linia +4');
eq(zaopatrzenieLinia(-4), -4, '2f: 2 surowce brakujace (delta -4) -> linia -4');

// Koniec-do-konca przez PRAWDZIWY `resolveCitizenResourceCoverage`: liczba surowcow epoki
// (NSUR = 2 / 4 / 5) razy +-2. To jest ta sama sciezka, ktora wola silnik tury.
const NSUR_2F = { 1: 2, 2: 4, 3: 5 };
const PELNY_MAGAZYN = { drewno: 999, glina: 999, kamien: 999, ceramika: 999, cegla: 999 };
for (const era of [1, 2, 3]) {
  const wszystkie = M.resolveCitizenResourceCoverage(era, PELNY_MAGAZYN);
  const zadne = M.resolveCitizenResourceCoverage(era, {});
  eq(wszystkie.available.length, NSUR_2F[era], '2f: epoka ' + era + ' wymaga ' + NSUR_2F[era] + ' surowcow');
  eq(wszystkie.happinessDelta, 2 * NSUR_2F[era],
    '2f: epoka ' + era + ', komplet zaopatrzenia -> delta +' + (2 * NSUR_2F[era]) + ' (+2 na surowiec)');
  eq(zadne.happinessDelta, -2 * NSUR_2F[era],
    '2f: epoka ' + era + ', pusty magazyn -> delta ' + (-2 * NSUR_2F[era]) + ' (-2 na surowiec)');
  eq(zaopatrzenieLinia(wszystkie.happinessDelta, era), 2 * NSUR_2F[era],
    '2f: epoka ' + era + ', komplet -> linia rozpiski +' + (2 * NSUR_2F[era]));
  eq(zaopatrzenieLinia(zadne.happinessDelta, era), -2 * NSUR_2F[era],
    '2f: epoka ' + era + ', brak -> linia rozpiski ' + (-2 * NSUR_2F[era]));
}
// Symetria wprost: ta sama liczba surowcow daje przeciwne wartosci co do znaku.
for (const era of [1, 2, 3]) {
  eq(
    M.resolveCitizenResourceCoverage(era, PELNY_MAGAZYN).happinessDelta
      + M.resolveCitizenResourceCoverage(era, {}).happinessDelta,
    0,
    '2f: epoka ' + era + ': kara i bonus sa symetryczne (suma = 0)',
  );
}

// ===========================================================================
// 2g. SKAN NEGATYWNY — siedem martwych parametrow USUNIETYCH NA STALE
// ===========================================================================
section('2g. skan negatywny: 7 martwych parametrow + wiersze dublujace (G14/G3/G5/G12)');
const USUNIETE_G14 = [
  'szczescie_kara_obca_kultura', 'szczescie_bonus_produkcja_wartosc',
  'szczescie_bonus_wzrost_wartosc', 'szczescie_prog_bonus_produkcja',
  'szczescie_prog_bonus_wzrost', 'szczescie_prog_bunt', 'szczescie_prog_strajk_produkcja',
];
eq(USUNIETE_G14.length, 7, '2g: lista G14 ma dokladnie 7 pozycji');
const rawSociety = fs.readFileSync(path.resolve(GRA, 'data', 'society-params.json'), 'utf8');
for (const k of USUNIETE_G14) {
  eq(Object.prototype.hasOwnProperty.call(society.szczescie, k), false,
    '2g: klucz "' + k + '" NIE wystepuje w bloku szczescie');
  eq(rawSociety.includes('"' + k + '"'), false,
    '2g: klucz "' + k + '" NIE wystepuje nigdzie w society-params.json');
}
for (const k of ['szczescie_swiatynia', 'szczescie_amfiteatr', 'szczescie_kara_obca_religia',
                 'szczescie_kara_podboj_podwojna_obca', 'szczescie_kara_wielkosc_miasta',
                 'szczescie_siatka_zamoznosc']) {
  eq(rawSociety.includes('"' + k + '"'), false, '2g: klucz "' + k + '" usuniety (G3/G5/G12/G7)');
}
eq(typeof M.happinessBucketsFromPct, 'undefined',
  '2g: happinessBucketsFromPct usunieta z society-breakdown.ts (G14)');
// klucze, ktore MAJA zostac
for (const k of ['szczescie_pct_cap', 'szczescie_max_pop_wspolczynnik', 'szczescie_max_pop_odniesienia']) {
  eq(Object.prototype.hasOwnProperty.call(society.szczescie, k), true, '2g: klucz "' + k + '" ZOSTAJE');
}
eq(society.szczescie.szczescie_pct_cap.normal, 120, '2g: szczescie_pct_cap = 120 bez zmian');
// R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1 R3-A (decyzja wlasciciela 2026-09-05) uchyla zapis G13
// „0,048 — BEZ ZMIAN, ZOSTAJE": wspolczynnik to teraz JEDNA liczba 0,04 na wszystkich
// trzech poziomach trudnosci (ten sam co prawo_max_pop_wspolczynnik, zeby wielkosc miasta
// obciazala oba filary Porzadku identycznie). Asercja nie znika i nie slabnie — pilnuje
// dalej, ze klucz ZOSTAJE i niesie liczbe wlasciciela, tylko liczba jest nowa; dolozony
// parytet trudnosci domyka kontrakt G13.
for (const d of ['easy', 'normal', 'hard']) {
  eq(society.szczescie.szczescie_max_pop_wspolczynnik[d], 0.04,
    '2g: szczescie_max_pop_wspolczynnik ' + d + ' = 0,04 (R3-A)');
}

// G9/G10/G11/G13 — liczby wlasciciela w danych
section('G9-G13: pozostale liczby wlasciciela w danych');
for (const diff of ['easy', 'normal', 'hard']) {
  eq(society.szczescie.szczescie_kara_wojna[diff], -5, 'G9: wojna -5 (' + diff + ')');
  eq(JSON.stringify(society.szczescie.szczescie_bonus_osiedle_pop[diff]), '[15,12,8,5]',
    'G10: bonus osiedla [15,12,8,5] (' + diff + ')');
}
{
  const cuda = ['koloseum', 'roquepertuse', 'stupa_sanchi', 'mundo_perdido', 'palac_weiyang', 'posag_peruna'];
  const lista = Array.isArray(wonders) ? wonders : (wonders.cuda || []);
  for (const id of cuda) {
    const c = lista.find(w => w.id === id);
    ok(!!c, 'G11: cud "' + id + '" istnieje w wonders.json');
    if (c) eq(((c.bonusy || {}).miasto || {}).zadowolenie, 6, 'G11: cud "' + id + '" daje +6 zadowolenia');
  }
}
eq(JSON.stringify(society.szczescie.szczescie_max_epoka.easy), '[20,40,60]', 'G13: easy 20/40/60');
eq(JSON.stringify(society.szczescie.szczescie_max_epoka.normal), '[30,50,70]', 'G13: normal 30/50/70');
eq(JSON.stringify(society.szczescie.szczescie_max_epoka.hard), '[35,55,80]', 'G13: hard 35/55/80');
for (const era of [1, 2, 3]) {
  eq(M.szMaxForEra(era, M.loadSocietyScaleParams(society, 'normal')), [30, 50, 70][era - 1],
    'G13: szMaxForEra(' + era + ', normal)');
}

// ===========================================================================
// 2h. SCENARIUSZ OPTYMISTYCZNY pop 8 = 58 / 85 / 118 pkt; szPct = 120% (normal)
// ===========================================================================
section('2h. scenariusz optymistyczny pop 8 = 58 / 85 / 118, szPct = 120%');
const NSUR = { 1: 2, 2: 4, 3: 5 };
for (const era of [1, 2, 3]) {
  eq(upkeep.epoki.find(e => e.epoka === era).surowce.length, NSUR[era],
    '2h: NSUR(epoka ' + era + ') = ' + NSUR[era]);
}
const OPTYMISTYCZNY = { 1: 58, 2: 85, 3: 118 };
for (const era of [1, 2, 3]) {
  const sz = M.computeHappinessBreakdown({
    difficulty: 'normal',
    era,
    population: 8,
    // komplet budynkow szczesciodajnych epoki, lancuchy zwiniete, poziom bazowy
    buildingZadowolenie: M.sumBuildingHappinessFromBuiltIds(builtIdsForEra(era), buildings, () => 1),
    ownCultureShare: 1,                    // 100% wlasnej kultury -> +x
    ownReligionShare: 1,                   // 100% wlasnej religii -> +x
    haWealth: M.wealthZadowolenie(M.wealthCap(era, wp), wp, era),   // cap epoki -> +10
    podzialHandlu: { procentPieniadz: 10, procentNauka: 0, procentLuksus: 90 }, // -> +10
    // komplet zaopatrzenia epoki: NSUR surowcow x (+2) z citizen-resource-upkeep.json -> _kara
    citizenResourceHappinessDelta: 2 * NSUR[era],
    atWar: false,
  }, society);
  eq(sz.netto, OPTYMISTYCZNY[era],
    '2h: optymistyczny pop 8, epoka ' + era + ' = ' + OPTYMISTYCZNY[era] + ' pkt');
  eq(sz.szPct, 120, '2h: szPct epoka ' + era + ' = 120% (obciety sufitem, normal)');
  // rozbicie na skladniki decyzji wlasciciela
  const v = id => (sz.lines.find(l => l.id === id) || { value: 0 }).value;
  eq(v('budynki'), BUD[era], '2h: skladnik Budynki (epoka ' + era + ') = ' + BUD[era]);
  eq(v('kultura'), X_WLASCICIELA[era], '2h: skladnik Kultura = x = ' + X_WLASCICIELA[era]);
  eq(v('religia'), X_WLASCICIELA[era], '2h: skladnik Religia = x = ' + X_WLASCICIELA[era]);
  eq(v('wealth'), 10, '2h: skladnik Wealth = +10');
  eq(v('niskie_podatki'), 10, '2h: skladnik podatki = +10');
  eq(v('zaopatrzenie_obywateli'), 2 * NSUR[era], '2h: skladnik zaopatrzenie = ' + (2 * NSUR[era]));
  eq(v('osiedle'), 0, '2h: pop 8 -> brak bonusu osiedla');
  eq(v('zageszczenie'), 0, '2h: pop 8 -> brak kary zageszczenia (G12)');
}

// ===========================================================================
// 2i. cityPanel.ts i SILNIK — JEDEN TOR
// ===========================================================================
section('2i. cityPanel.ts liczy tym samym kodem co silnik (G15)');
const panelSrc = fs.readFileSync(path.resolve(GRA, 'src', 'ui', 'cityPanel.ts'), 'utf8');

// (1) panel NIE ma juz wlasnej matematyki Kultury/Religii
eq(/\bcultureHappiness\b/.test(panelSrc), false,
  '2i: cityPanel.ts nie wola juz cultureHappiness (linia Kultury powstaje w silniku)');
eq(panelSrc.includes('haKult'), false,
  '2i: cityPanel.ts nie buduje wlasnego haKult');
// (2) panel podaje udzial kultury i wskaznik religii do WSPOLNEJ rozpiski
ok(/evaluateOrderFromBreakdown\(/.test(panelSrc),
  '2i: cityPanel.ts liczy Szczescie przez evaluateOrderFromBreakdown (wspolny kod)');
ok(/ownCultureShare,/.test(panelSrc),
  '2i: cityPanel.ts przekazuje ownCultureShare do rozpiski');
// (3) Wealth z EPOKA (nie literalem) na wszystkich trzech wywolaniach panelu.
//     OBRONA runda 1, zarzut 1: poprzednia wersja liczyla tylko przecinki
//     (`w.split(',').length === 3`), wiec podmiana `era` na literal `1` przechodzila
//     na zielono, mimo ze panel pokazywalby wtedy +10 Wealth przy W=10 w KAZDEJ epoce.
//     Teraz sprawdzany jest sam trzeci argument.
{
  const wywolania = panelSrc.match(/wealthZadowolenie\([^)]*\)/g) || [];
  eq(wywolania.length, 3, '2i: cityPanel.ts ma 3 wywolania wealthZadowolenie');
  // W panelu epoke niesie zmienna `era` (blok Porzadku) albo `epoch` (karty Wealth) —
  // obie deklarowane jako `cfg.getEpoch?.(...) ?? 1`. Literal, wyrazenie stale albo inna
  // nazwa = FAIL.
  const NOSNIKI_EPOKI = ['era', 'epoch'];
  for (const w of wywolania) {
    const args = w.replace(/^wealthZadowolenie\(/, '').replace(/\)$/, '').split(',');
    eq(args.length, 3, '2i: wywolanie "' + w + '" podaje epoke (3 argumenty)');
    ok(NOSNIKI_EPOKI.includes(args[2].trim()),
      '2i: trzecim argumentem "' + w + '" jest zmienna epoki z cfg.getEpoch, nie literal'
      + ' -- got "' + args[2].trim() + '"');
  }
  // ...a te zmienne faktycznie pochodza z epoki wlasciciela miasta, nie ze stalej.
  for (const nazwa of NOSNIKI_EPOKI) {
    ok(new RegExp('const ' + nazwa + ' = cfg\\.getEpoch\\?\\.\\([^)]*\\) \\?\\? 1;').test(panelSrc),
      '2i: `' + nazwa + '` w cityPanel.ts pochodzi z cfg.getEpoch(ownerId)');
  }
}
// (4) panel nie dokleja juz nadwyzki Garncarni do linii Budynkow (G3)
eq(panelSrc.includes('computeGarncarniaSurplusZadowolenieByOwner'), false,
  '2i: cityPanel.ts nie dolicza nadwyzki Garncarni do Budynkow (wiersz Ceramika usuniety)');
// (5) punkty Religii w panelu = ta sama funkcja co linia Religii w silniku
ok(panelSrc.includes('function religiaSzPunkty('),
  '2i: cityPanel.ts ma jeden helper religiaSzPunkty do prezentacji punktow Religii');
ok(/religiaSzPunkty[\s\S]{0,600}kultReligScaleForEra/.test(panelSrc),
  '2i: religiaSzPunkty uzywa kultReligScaleForEra z society-breakdown (nie wlasnej skali)');
ok(/religiaSzPunkty[\s\S]{0,600}proporcjonalneSzczescie/.test(panelSrc),
  '2i: religiaSzPunkty uzywa proporcjonalneSzczescie z society-breakdown');
eq((panelSrc.match(/relState\.wplywSzczescie >= 0/g) || []).length, 0,
  '2i: zaden widok nie pokazuje juz surowego wskaznika [-1,+1] jako punktow Szczescia');

// (6) TEST FUNKCJONALNY parytetu: wartosc, ktora panel POKAZUJE dla Religii, jest
//     identyczna z wartoscia linii "religia", ktora silnik wpisuje do rozpiski.
function panelReligiaPunkty(wskaznik, era, diff) {
  const scale = M.loadSocietyScaleParams(society, diff);
  const pkt = M.proporcjonalneSzczescie(M.kultReligScaleForEra(era, scale), M.ownShareFromSignal(wskaznik));
  return Math.round(pkt * 10) / 10;
}
for (const era of [1, 2, 3]) {
  for (const counts of [{ A: 10 }, { B: 10 }, { A: 5, B: 5 }, { A: 3, B: 1 }, { A: 1, B: 3 }]) {
    const wskaznik = M.religionHappiness(counts, 'A');
    const silnik = M.computeHappinessBreakdown({
      difficulty: 'normal', era, population: 5, buildingZadowolenie: 0, haRel: wskaznik,
    }, society).lines.find(l => l.id === 'religia');
    const silnikV = Math.round((silnik ? silnik.value : 0) * 10) / 10;
    eq(panelReligiaPunkty(wskaznik, era, 'normal'), silnikV,
      '2i: panel == silnik dla Religii, epoka ' + era + ', sklad ' + JSON.stringify(counts));
  }
}
// (6b) OBRONA runda 1, zarzut 6: karta Religii i wiersz rozpiski musza pokazac graczowi
//      TE SAMA liczbe. Model zostaje dokladny (`proporcjonalneSzczescie` celowo nie
//      zaokragla — to byloby strojenie liczby wlasciciela), zaokraglane jest wylacznie
//      to, co idzie na ekran, i to jednym helperem po obu stronach.
{
  // najpierw dowod, ze sprawdzenie nie jest puste: przy x=23 i udziale 1/3 wartosc
  // linii jest UlAMKOWA, wiec zaokraglenie faktycznie ma co zmienic.
  const surowa = M.proporcjonalneSzczescie(M.kultReligScaleForEra(3, M.loadSocietyScaleParams(society, 'normal')), 1 / 3);
  ok(Math.abs(surowa - Math.round(surowa)) > 1e-6,
    '2i(6b): x=23, udzial 1/3 -> linia Religii jest ulamkowa (' + surowa + '), wiec test nie jest pusty');
  ok(panelSrc.includes('function szPktDisplay('),
    '2i(6b): cityPanel.ts ma JEDEN helper prezentacyjny szPktDisplay');
  ok(/function religiaSzPunkty\([\s\S]{0,400}return szPktDisplay\(/.test(panelSrc),
    '2i(6b): karta Religii formatuje punkty przez szPktDisplay');
  ok(/function szLinesDoWyswietlenia\([\s\S]{0,300}szPktDisplay\(/.test(panelSrc),
    '2i(6b): linie rozpiski Szczescia ida przez ten sam helper');
  eq((panelSrc.match(/szLinesDoWyswietlenia\(state\.szLines\)/g) || []).length, 2,
    '2i(6b): OBA miejsca renderujace linie Szczescia (blok % i karta szczegolow) uzywaja helpera');
  eq((panelSrc.match(/for \(const l of state\.szLines\)/g) || []).length, 0,
    '2i(6b): zadne miejsce nie renderuje juz surowych wartosci state.szLines');
}
// (7) SPOJNOSC WEWNETRZNA silnika (nie parytet z panelem!): `evaluateOrderFromBreakdown`
//     wola `computeHappinessBreakdown` (society-breakdown.ts:983), wiec ta para pilnuje
//     wylacznie tego, ze wejscie przechodzi przez obudowe bez zgubienia pola. OBRONA
//     runda 1, zarzut 1 trafnie wskazala, ze NIE jest to dowod jednego toru z panelem —
//     ten dowod daje dopiero blok (8) nizej, ktory URUCHAMIA panel.
for (const era of [1, 2, 3]) {
  const wejscie = {
    difficulty: 'normal', era, population: 6,
    buildingZadowolenie: M.sumBuildingHappinessFromBuiltIds(builtIdsForEra(era), buildings, () => 1),
    ownCultureShare: 0.6,
    haRel: M.religionHappiness({ counts: { A: 3, B: 2 } }, 'A'),
    haWealth: M.wealthZadowolenie(era * 10, wp, era),
    podzialHandlu: { procentPieniadz: 40, procentNauka: 20, procentLuksus: 40 },
    citizenResourceHappinessDelta: 2 * (NSUR[era] - 2),
  };
  const a = M.computeHappinessBreakdown(wejscie, society);
  const b = M.evaluateOrderFromBreakdown(wejscie, { difficulty: 'normal', era, population: 6, garnizonCount: 0 }, society, 'normal').sz;
  eq(a.netto, b.netto, '2i: computeHappinessBreakdown == evaluateOrderFromBreakdown netto (epoka ' + era + ')');
  eq(a.szPct, b.szPct, '2i: ... i szPct (epoka ' + era + ')');
}

// ===========================================================================
// 2i (8). PARYTET FUNKCJONALNY panel <-> silnik — przez URUCHOMIENIE panelu
//
// OBRONA runda 1, zarzut 1. Punkty (1)-(6) czytaja `cityPanel.ts` jako TEKST, a punkt (7)
// porownuje silnik sam ze soba. Zaden z nich nie lapal realnego rozjazdu: Evaluator podmienil
// w panelu `era` na literal `1` i bramka nadal byla zielona. Tutaj panel jest BUDOWANY
// (esbuild + jsdom) i WYKONYWANY przez szew `__cityPanelOrderStateLocalForTest`, a wynik
// porownywany z niezaleznie zlozonym wejsciem silnika — tak jak sklada je `main.ts:29140+`
// (`sumBuildingHappinessFromBuiltIds` + `buildingLevelForEpoch`, `wealthZadowolenie(..., era)`,
// `wonderCityYieldBonusForOwner` -> `haCuda`, `isOwnerAtWar` -> `atWar`).
// Trzy mutacje, ktore ta sekcja lapie, a poprzednia wersja przepuszczala:
//   * `wealthZadowolenie(..., era)` -> `..., 1`   (linia Wealth rozjezdza sie w epokach 2-3)
//   * usuniecie `haCuda` z wejscia panelu        (do 36 pkt roznicy, G11)
//   * `atWar` zamrozone na `false`               (5 pkt roznicy, G9)
// ===========================================================================
section('2i (8). parytet FUNKCJONALNY: uruchomiony cityPanel == silnik');

const PANEL_ENTRY  = path.resolve(__dirname, '.szczescie-przebudowa-skali-panel-entry.ts');
const PANEL_BUNDLE = path.resolve(__dirname, '.szczescie-przebudowa-skali-panel-bundle.cjs');
fs.writeFileSync(PANEL_ENTRY, `
export { __cityPanelOrderStateLocalForTest, configureCityPanel } from '../src/ui/cityPanel';
export { buildingLevelForEpoch } from '../src/game/production';
`, 'utf8');

let P = null;
try {
  esbuild.buildSync({
    entryPoints: [PANEL_ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: PANEL_BUNDLE,
    absWorkingDir: GRA,
    logLevel: 'silent',
    resolveExtensions: ['.ts', '.js', '.json'],
    // cityPanel ciagnie ikony brandowe (?raw) i Vite'owy import.meta.glob — w node trzeba
    // podac loader i podmienic glob na pusta mape; to nie zmienia liczonej matematyki.
    loader: { '.svg': 'text', '.png': 'dataurl', '.jpg': 'dataurl', '.webp': 'dataurl' },
    define: { 'import.meta.glob': '__viteGlobShim' },
    banner: { js: 'const __viteGlobShim = () => ({});' },
  });
  const { JSDOM } = require(path.resolve(GRA, 'node_modules', 'jsdom'));
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    pretendToBeVisual: true, url: 'http://localhost/',
  });
  global.window = dom.window;
  global.document = dom.window.document;
  for (const [k, v] of [['navigator', dom.window.navigator], ['location', dom.window.location]]) {
    try { Object.defineProperty(global, k, { value: v, configurable: true }); } catch (e) { /* juz ustawione */ }
  }
  global.HTMLElement = dom.window.HTMLElement;
  global.Element = dom.window.Element;
  global.Node = dom.window.Node;
  global.getComputedStyle = dom.window.getComputedStyle;
  global.requestAnimationFrame = cb => setTimeout(cb, 0);
  global.cancelAnimationFrame = id => clearTimeout(id);
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  P = require(PANEL_BUNDLE);
} catch (e) {
  P = null;
  console.error('  [FAIL] 2i(8): nie udalo sie zbudowac/zaladowac cityPanel.ts: ' + (e.message || e));
}
// Brak harnessu = brak dowodu jednego toru. To FAIL, nie ciche pominiecie.
ok(P !== null && typeof P.__cityPanelOrderStateLocalForTest === 'function',
  '2i(8): harness panelu zbudowany (szew __cityPanelOrderStateLocalForTest dostepny)');

if (P) {
  // Scenariusze: rozne epoki, z cudami i bez, na wojnie i w pokoju, rozne udzialy kultury.
  const SCENARIUSZE = [
    { era: 1, haCuda: 0,  atWar: false, kult: 1.0, poziomW: 10, relCounts: { A: 10 },        pop: 4 },
    { era: 2, haCuda: 12, atWar: false, kult: 0.5, poziomW: 20, relCounts: { A: 5, B: 5 },   pop: 6 },
    { era: 3, haCuda: 36, atWar: true,  kult: 0.6, poziomW: 30, relCounts: { A: 3, B: 2 },   pop: 8 },
    { era: 3, haCuda: 6,  atWar: true,  kult: 0.0, poziomW: 15, relCounts: { B: 9, A: 1 },   pop: 12 },
    { era: 2, haCuda: 0,  atWar: true,  kult: 0.75, poziomW: 40, relCounts: { A: 3, B: 1 },  pop: 5 },
  ];
  for (const s of SCENARIUSZE) {
    const etyk = 'epoka ' + s.era + ', cuda ' + s.haCuda + ', wojna ' + s.atWar + ', pop ' + s.pop;
    const builtIds = builtIdsForEra(s.era);
    const podzial = { procentPieniadz: 40, procentNauka: 20, procentLuksus: 40 };
    const wskaznik = M.religionHappiness({ counts: s.relCounts }, 'A');
    const upkeepDelta = 2 * (NSUR[s.era] - 1) - 2;   // czesc surowcow pokryta, czesc nie

    // --- wejscie SILNIKA, zlozone tak jak w main.ts (niezaleznie od panelu) ---
    const poziomBudynku = bdef => P.buildingLevelForEpoch(
      bdef.epokaWejscia, s.era, bdef.maksPoziom, bdef.poziomTechGate ?? null, [],
    );
    const wejscieSilnika = {
      difficulty: 'normal',
      era: s.era,
      population: s.pop,
      buildingZadowolenie: M.sumBuildingHappinessFromBuiltIds(builtIds, buildings, poziomBudynku),
      haRel: wskaznik,
      ownCultureShare: s.kult,
      haWealth: M.wealthZadowolenie(s.poziomW, wp, s.era),
      haCuda: s.haCuda,
      podzialHandlu: podzial,
      atWar: s.atWar,
      stolicaEasyBonus: false,
      citizenResourceHappinessDelta: upkeepDelta,
    };
    // Prawo NIE jest przedmiotem tego tematu (§GRANICE), ale `porPct` liczy sie z obu
    // polowek — wiec wejscie Prawa musi byc zlozone z tych samych `builtIds`, co panel,
    // inaczej porownanie porPct mierzyloby roznice w scenariuszu, nie w kodzie.
    const palacTier = builtIds.includes('palac_iii') ? 3
      : builtIds.includes('palac_ii') ? 2
      : builtIds.includes('palac') ? 1 : null;
    const wejscieLaw = {
      difficulty: 'normal', era: s.era, population: s.pop, garnizonCount: 0,
      hasDomStarszyzny: builtIds.includes('dom_starszyzny'),
      hasDworZarzadcy: builtIds.includes('dwor_zarzadcy'),
      hasPretorium: builtIds.includes('pretorium'),
      hasTrybunal: builtIds.includes('trybunal'),
      hasSad: builtIds.includes('sad'),
      palacTier,
      brakGarnizonuKara: s.pop >= 6,
      stolicaEasyBonus: false,
    };
    const silnik = M.evaluateOrderFromBreakdown(wejscieSilnika, wejscieLaw, society, 'normal');

    // --- werdykt silnika podany panelowi dokladnie tak, jak robi to `main.ts` ---
    const stanSilnika = {
      szczescie: silnik.sz.netto,
      porzadek: silnik.prawo.netto,
      szPct: silnik.sz.szPct,
      prawPct: silnik.prawo.prawPct,
      porPct: silnik.porPct,
      bandLabel: silnik.bandLabel,
      szLines: silnik.sz.lines,
      prawLines: silnik.prawo.lines,
      progT1: 0,
      progT2: 0,
      citizenUpkeep: { happinessDelta: upkeepDelta, available: [], missing: [], lines: [] },
    };
    const city = {
      id: 'test-city', ownerId: 0, q: 0, r: 0, population: s.pop,
      wealthState: { poziom: s.poziomW, punkty: 0 },
      ownCultureShare: s.kult,
    };
    P.configureCityPanel({
      data: { buildings, societyParams: society, econParams: econ },
      difficulty: 'normal',
      getEpoch: () => s.era,
      getBuiltBuildingIds: () => builtIds,
      getUnlockedTechs: () => [],
      getUnitsAt: () => [],
      getCities: () => [city],
      getReligionState: () => ({ dominujaca: 'A', udzialPct: 60, wplywSzczescie: wskaznik }),
      getPodzialHandlu: () => podzial,
      getOrderState: () => stanSilnika,
      getTurn: () => 5,
      getCapitalCityId: () => null,
    });

    const panel = P.__cityPanelOrderStateLocalForTest(city, { buildings, societyParams: society, econParams: econ });

    // 1. KAZDA linia rozpiski identyczna co do id i wartosci.
    const pl = panel.state.szLines || [];
    const sl = silnik.sz.lines || [];
    eq(pl.map(l => l.id).join('|'), sl.map(l => l.id).join('|'),
      '2i(8): panel i silnik maja te same linie Szczescia (' + etyk + ')');
    for (const l of sl) {
      const p = pl.find(x => x.id === l.id);
      near(p ? p.value : NaN, l.value,
        '2i(8): linia "' + l.id + '" identyczna (' + etyk + ')', 1e-9);
    }
    // 2. ...i te same wyniki zbiorcze, ktorymi galaz `fromEngine: true` NADPISUJE werdykt.
    near(panel.state.szPct, silnik.sz.szPct, '2i(8): szPct panelu == szPct silnika (' + etyk + ')', 1e-9);
    near(panel.state.porPct, silnik.porPct, '2i(8): porPct panelu == porPct silnika (' + etyk + ')', 1e-9);
    eq(panel.state.bandLabel, silnik.bandLabel, '2i(8): pasmo Porzadku identyczne (' + etyk + ')');
    // netto w panelu jest zaokraglane do 1 miejsca (prezentacja), wiec porownanie z tolerancja
    near(panel.state.szczescie, silnik.sz.netto, '2i(8): netto Szczescia identyczne (' + etyk + ')', 0.05);
  }
}

try { fs.unlinkSync(PANEL_ENTRY); } catch (e) { /* nic */ }

// ===========================================================================
console.log('\n[szczescie-przebudowa-skali-test] ' + passed + ' OK, ' + failed + ' FAIL');
if (failed > 0) process.exit(1);
