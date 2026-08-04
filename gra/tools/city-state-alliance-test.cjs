'use strict';
/**
 * city-state-alliance-test.cjs -- standalone Node test for D-START posiłki v2
 * (Maciej 2026-07-21, PRZERÓBKA wg zmienionych decyzji właściciela): posiłki między
 * siostrami tego samego klastra BRAMKOWANE SOJUSZEM + próg sojuszu przeskalowany PER
 * POZIOM TRUDNOŚCI gry (nie osobna opcja setupu -- USUNIĘTA) + ocena sojuszu przez
 * PEŁNĄ maszynerię (aiDiplomacyStance.willingnessAlly), nie uproszczony proxy
 * zaufanie/100. Run from gra/:  node tools/city-state-alliance-test.cjs
 *
 * Zakres celowo NIE obejmuje main.ts (nie da się go zaimportować w izolacji --
 * to jeden ogromny plik bootstrapujący silnik). main.ts robi TYLKO rzeczy trivialne
 * do zweryfikowania czytaniem kodu, ponad to co tu testowane:
 *   (a) filtruje opts.sisterCityStates po aktywnym sojuszu (activeDeals) PRZED
 *       przekazaniem do decideAITurn -- tu symulujemy to bezpośrednio: test 4
 *       pokazuje "bez sisterCityStates -> zero ruchu-posiłku", test 5 pokazuje
 *       "z sisterCityStates -> posiłek" (main.ts decyduje CZY przekazać listę wg
 *       sojuszu -- ai.ts jest ślepe na dyplomację, jak i ma pozostać).
 *   (b) przekazuje opts.citySupportLevel = _menuCitySupport (pochodna TRUDNOŚCI gry,
 *       applyMenuParams: easy→'low' · normal→'normal' · hard→'strong') 1:1 do AITurnOpts.
 *   (c) formSisterAlliancesIfThreatened() buduje stub graczy (typCywilizacji = typ
 *       KLASTRA, nie DrobnaCywilizacja) + militaryRatio realny (militaryRatioFromArmyM)
 *       i woła sisterAllianceEligible(...) przed addTreaty -- tu testujemy
 *       sisterAllianceEligible bezpośrednio z równoważnymi argumentami.
 *
 * Testy:
 *   1. sisterAllianceDiplomacyParams -- skale PER POZIOM (low ×0,6 / normal ×0,3 /
 *      strong ×0,15) dokładnie (Zaufanie/Relacja/Willingness/progUmowaMinRelacja),
 *      z twardą podłogą progSojuszRelacja >= progMinimalnyRelacja, i porządkiem
 *      strong < normal < low (wyższa trudność = łatwiej sojusz sióstr).
 *   2. sisterAllianceEligible -- PEŁNA maszyneria (aiDiplomacyStance.willingnessAlly):
 *      wysoka relacja + parytet sił -> sojusz (na obniżonym progu, NIE na globalnym);
 *      niska relacja -> brak sojuszu nawet po obniżce; status='wojna' -> zawsze false.
 *   3. RESUP_TIERS -- dokładne liczby per poziom (low/normal/strong) - regresja pinning.
 *   4. decideDefensiveCopyTurn: BRAK opts.sisterCityStates (symulacja "brak sojuszu") ->
 *      zagrożona siostra nie dostaje posiłku (jednostka-nadwyżka NIE rusza w jej stronę).
 *   5. decideDefensiveCopyTurn: OBECNE opts.sisterCityStates (symulacja "sojusz aktywny") ->
 *      nadwyżkowa jednostka rusza w stronę zagrożonej siostry.
 *   6. citySupportLevel='low' (threatRadius=0) -> siostra zagrożona z dystansu 1 NIE
 *      wyzwala posiłku (dużo trudniej niż 'normal').
 *   7. citySupportLevel='strong' (threatRadius=2) -> siostra zagrożona z dystansu 2
 *      WYZWALA posiłek (łatwiej niż 'normal').
 *   8. Determinizm: dwa identyczne wywołania -> identyczne komendy (zero Math.random()).
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
    console.error('[city-state-alliance-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.CSA_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const ENTRY_FILE  = path.resolve(__dirname, '.city-state-alliance-test-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.city-state-alliance-test-bundle.cjs');

const ENTRY_TS = `
export { decideAITurn, RESUP_TIERS } from ${JSON.stringify(SRC + '/game/ai')};
export {
  DIPLOMACY_PARAMS, sisterAllianceDiplomacyParams, sisterAllianceEligible,
} from ${JSON.stringify(SRC + '/game/diplomacy')};
export { hexDistance } from ${JSON.stringify(SRC + '/units/setup')};
export {
  startRelationForPair, startRelationForPlayerSameCivCityState,
  applyCityStateDifficultyTrust, CITY_STATE_TRUST_DELTA_BY_DIFFICULTY,
} from ${JSON.stringify(SRC + '/game/diplomacy-layers')};
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
    absWorkingDir: GRA_ROOT,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[city-state-alliance-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const {
  decideAITurn, RESUP_TIERS,
  DIPLOMACY_PARAMS, sisterAllianceDiplomacyParams, sisterAllianceEligible,
  hexDistance,
  startRelationForPair, startRelationForPlayerSameCivCityState,
  applyCityStateDifficultyTrust, CITY_STATE_TRUST_DELTA_BY_DIFFICULTY,
} = require(BUNDLE_FILE);

// --- tiny assertion framework ------------------------------------------------
let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('  FAIL:', msg); }
}
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }
function close(a, b, eps, msg) { assert(Math.abs(a - b) <= eps, `${msg} (got ${a}, want ~${b})`); }

// ---------------------------------------------------------------------------
// Fixtures (kopia wzorca z ai-improvements-test.cjs -- płaska mapa 'rownina')
// ---------------------------------------------------------------------------

function makeFlatMap(w, h) {
  const hexes = {};
  for (let q = 0; q < w; q++) {
    for (let r = 0; r < h; r++) {
      const k = `${q},${r}`;
      hexes[k] = {
        coords: { q, r },
        terenBazowy: 'rownina',
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

function makeGameData() {
  return {
    units: [],
    buildings: [],
    terrainYields: { terrain_types: [{ Teren: 'rownina', Zywnosc: 2, Praca: 1, Handel: 1 }] },
    aiParams: {},
  };
}

function makeCity(id, ownerId, q, r, population = 2) {
  return { id, ownerId, q, r, name: 'TestCity', population };
}

function makeGuard(id, ownerId, q, r) {
  return { id, ownerId, typeId: 'Miecznik', category: 'miecznik', q, r, ruch: 1, ruchLeft: 1 };
}

function makeEnemy(id, ownerId, q, r) {
  return { id, ownerId, typeId: 'Wojownik', category: 'miecznik', q, r, ruch: 1, ruchLeft: 1 };
}

function baseDefensiveOpts(overrides) {
  return {
    civType: 'grecy',
    poziomTrudnosci: 2,
    defensiveCopy: true,
    cityBuildings: {},
    ...overrides,
  };
}

function resupMoves(commands, unitIds) {
  return commands.filter(c => c.type === 'move' && unitIds.has(c.unitId));
}

const map = makeFlatMap(30, 30);
const data = makeGameData();
const PLAYER_ID = 11;
const SISTER_ID = 12;
const ENEMY_ID  = 99;

// ===========================================================================
// 1. sisterAllianceDiplomacyParams -- skale PER POZIOM + podloga + porzadek
// ===========================================================================
console.log('1. sisterAllianceDiplomacyParams -- skale per poziom (low/normal/strong) + podloga');
{
  const pLow = sisterAllianceDiplomacyParams('low', DIPLOMACY_PARAMS);
  const pNormal = sisterAllianceDiplomacyParams('normal', DIPLOMACY_PARAMS);
  const pStrong = sisterAllianceDiplomacyParams('strong', DIPLOMACY_PARAMS);

  eq(pLow.progSojuszZaufanie, Math.round(DIPLOMACY_PARAMS.progSojuszZaufanie * 0.6), 'low: progSojuszZaufanie x0.6');
  eq(pNormal.progSojuszZaufanie, Math.round(DIPLOMACY_PARAMS.progSojuszZaufanie * 0.3), 'normal: progSojuszZaufanie x0.3');
  eq(pStrong.progSojuszZaufanie, Math.round(DIPLOMACY_PARAMS.progSojuszZaufanie * 0.15), 'strong: progSojuszZaufanie x0.15');

  const relaczaLow = Math.max(DIPLOMACY_PARAMS.progMinimalnyRelacja, Math.round(DIPLOMACY_PARAMS.progSojuszRelacja * 0.6));
  const relaczaNormal = Math.max(DIPLOMACY_PARAMS.progMinimalnyRelacja, Math.round(DIPLOMACY_PARAMS.progSojuszRelacja * 0.3));
  const relaczaStrong = Math.max(DIPLOMACY_PARAMS.progMinimalnyRelacja, Math.round(DIPLOMACY_PARAMS.progSojuszRelacja * 0.15));
  eq(pLow.progSojuszRelacja, relaczaLow, 'low: progSojuszRelacja x0.6 z podloga progMinimalnyRelacja');
  eq(pNormal.progSojuszRelacja, relaczaNormal, 'normal: progSojuszRelacja x0.3 z podloga progMinimalnyRelacja');
  eq(pStrong.progSojuszRelacja, relaczaStrong, 'strong: progSojuszRelacja x0.15 z podloga progMinimalnyRelacja');

  // progUmowaMinRelacja MUSI byc przeskalowany RAZEM z progSojuszRelacja -- inaczej
  // diplomacyTreatyMinRelacja (wolane wewnatrz aiDiplomacyStance) wymusi globalna
  // podloge 151 niezaleznie od skali, kasujac cala obnizke progu sojuszu siostr.
  eq(pLow.progUmowaMinRelacja, relaczaLow, 'low: progUmowaMinRelacja rowny przeskalowanej progSojuszRelacja');
  eq(pNormal.progUmowaMinRelacja, relaczaNormal, 'normal: progUmowaMinRelacja rowny przeskalowanej progSojuszRelacja');
  eq(pStrong.progUmowaMinRelacja, relaczaStrong, 'strong: progUmowaMinRelacja rowny przeskalowanej progSojuszRelacja');

  close(pLow.progSojuszWillingnessMin, DIPLOMACY_PARAMS.progSojuszWillingnessMin * 0.6, 0.001, 'low: progSojuszWillingnessMin x0.6');
  close(pNormal.progSojuszWillingnessMin, DIPLOMACY_PARAMS.progSojuszWillingnessMin * 0.3, 0.001, 'normal: progSojuszWillingnessMin x0.3');
  close(pStrong.progSojuszWillingnessMin, DIPLOMACY_PARAMS.progSojuszWillingnessMin * 0.15, 0.001, 'strong: progSojuszWillingnessMin x0.15');

  // Globalne DIPLOMACY_PARAMS NIE zmienione (immutable, brak efektu ubocznego).
  eq(DIPLOMACY_PARAMS.progSojuszZaufanie, 91, 'DIPLOMACY_PARAMS.progSojuszZaufanie global niezmieniony');
  eq(DIPLOMACY_PARAMS.progSojuszRelacja, 151, 'DIPLOMACY_PARAMS.progSojuszRelacja global niezmieniony');
  eq(DIPLOMACY_PARAMS.progUmowaMinRelacja, 151, 'DIPLOMACY_PARAMS.progUmowaMinRelacja global niezmieniony');

  // Wyzsza trudnosc (strong) = latwiej sojusz siostr = prog NIZSZY niz normal < low.
  assert(pStrong.progSojuszZaufanie < pNormal.progSojuszZaufanie, 'strong < normal (Zaufanie)');
  assert(pNormal.progSojuszZaufanie < pLow.progSojuszZaufanie, 'normal < low (Zaufanie)');
  assert(pStrong.progSojuszRelacja <= pNormal.progSojuszRelacja, 'strong <= normal (Relacja)');
  assert(pNormal.progSojuszRelacja < pLow.progSojuszRelacja, 'normal < low (Relacja)');
  assert(pLow.progSojuszZaufanie < DIPLOMACY_PARAMS.progSojuszZaufanie, 'nawet low < prog globalny (Zaufanie)');
  assert(pLow.progSojuszRelacja < DIPLOMACY_PARAMS.progSojuszRelacja, 'nawet low < prog globalny (Relacja)');
}

// ===========================================================================
// 2. sisterAllianceEligible -- PELNA maszyneria (aiDiplomacyStance.willingnessAlly)
// ===========================================================================
console.log('2. sisterAllianceEligible -- pelna ocena (willingness/sila) + wojna blokuje');
{
  // Siostry = typCywilizacji KLASTRA (np. 'grecy'), NIGDY 'drobna_cywilizacja'
  // (inaczej aiDiplomacyStance wchodzi na sciezke minor-civ i willingnessAlly=0).
  const playerA = { ownerId: 21, typCywilizacji: 'grecy' };
  const playerB = { ownerId: 22, typCywilizacji: 'grecy' };
  const ctxParity = { isMinorCiv: false, militaryRatio: 1, currentTurn: 10, turnsAtWar: 0 };
  const spNormal = sisterAllianceDiplomacyParams('normal', DIPLOMACY_PARAMS);

  const relHigh = { zaufanie: 90, respekt: 50, status: 'pokoj' }; // relacja=140
  const relLow = { zaufanie: 10, respekt: 10, status: 'pokoj' };  // relacja=20

  eq(
    sisterAllianceEligible(playerA, playerB, relHigh, ctxParity, spNormal),
    true,
    'wysoka relacja + parytet sil -> sojusz siostr na obnizonym progu (normal)',
  );
  eq(
    sisterAllianceEligible(playerA, playerB, relLow, ctxParity, spNormal),
    false,
    'niska relacja -> brak sojuszu, nawet po obnizce progu',
  );

  const atWar = { ...relHigh, status: 'wojna' };
  eq(
    sisterAllianceEligible(playerA, playerB, atWar, ctxParity, spNormal),
    false,
    'status wojna -> zawsze brak sojuszu, mimo relacji ktora inaczej kwalifikowalaby',
  );

  // Prog obnizony jest realnie osiagalny szybciej niz globalny sojusz gracz<->AI:
  // ta sama relacja ktora NIE kwalifikuje globalnego progu MOZE kwalifikowac siostrzany.
  eq(
    sisterAllianceEligible(playerA, playerB, relHigh, ctxParity, DIPLOMACY_PARAMS),
    false,
    'ta sama relacja (140) NIE kwalifikuje globalnego progu sojuszu (bez obnizki)',
  );

  // DrobnaCywilizacja (nie typ klastra) -> aiDiplomacyStance wchodzi na sciezke
  // minor-civ -> willingnessAlly zawsze 0 -> sisterAllianceEligible zawsze false,
  // niezaleznie od relacji. Pilnuje, ze main.ts NIGDY nie ustawia isMinorCiv/typu
  // DrobnaCywilizacja dla par siostr (zerowaloby to willingnessAlly).
  const minorPlayer = { ownerId: 23, typCywilizacji: 'drobna_cywilizacja' };
  eq(
    sisterAllianceEligible(minorPlayer, playerB, relHigh, ctxParity, spNormal),
    false,
    'typCywilizacji=DrobnaCywilizacja -> willingnessAlly=0 -> brak sojuszu (regresja-pin)',
  );
}

// ===========================================================================
// 3. RESUP_TIERS -- liczby dokladne (regression pin, do akceptacji wlasciciela)
// ===========================================================================
console.log('3. RESUP_TIERS -- mapowanie tierow (regresja)');
{
  eq(RESUP_TIERS.low.threatRadius, 0, 'low.threatRadius');
  eq(RESUP_TIERS.low.minGuard, 3, 'low.minGuard');
  eq(RESUP_TIERS.low.maxPerTurn, 1, 'low.maxPerTurn');
  eq(RESUP_TIERS.normal.threatRadius, 1, 'normal.threatRadius (= dzisiejsza stala, zero regresji)');
  eq(RESUP_TIERS.normal.minGuard, 2, 'normal.minGuard (= dzisiejsza stala)');
  eq(RESUP_TIERS.normal.maxPerTurn, 1, 'normal.maxPerTurn (= dzisiejsza stala)');
  eq(RESUP_TIERS.strong.threatRadius, 2, 'strong.threatRadius');
  eq(RESUP_TIERS.strong.minGuard, 1, 'strong.minGuard');
  eq(RESUP_TIERS.strong.maxPerTurn, 2, 'strong.maxPerTurn');
}

// ===========================================================================
// Wspolne polozenia dla testow 4-8 (potwierdzone przez ta sama hexDistance co
// uzywana wewnatrz ai.ts -- zero rozjazdu ukladu wspolrzednych).
// ===========================================================================
const CITY_Q = 10, CITY_R = 10;
const SISTER_Q = 14, SISTER_R = 10;
const distCitySister = hexDistance(CITY_Q, CITY_R, SISTER_Q, SISTER_R);
assert(distCitySister >= 3, `siostra wystarczajaco daleko od miasta-zrodla (dist=${distCitySister})`);

function makeSceneryUnits(enemyDistFromSister) {
  // Wroga jednostka w odleglosci `enemyDistFromSister` od miasta siostry, wzdluz tej
  // samej osi q (r stale) co city->sister, wiec lezy pomiedzy/za SISTER.
  const enemyQ = SISTER_Q + enemyDistFromSister;
  const guard1 = makeGuard('g1', PLAYER_ID, CITY_Q, CITY_R);
  const guard2 = makeGuard('g2', PLAYER_ID, CITY_Q, CITY_R);
  const enemy  = makeEnemy('e1', ENEMY_ID, enemyQ, SISTER_R);
  return { guard1, guard2, enemy, units: [guard1, guard2, enemy] };
}

// ===========================================================================
// 4. Brak opts.sisterCityStates (main.ts nie przekazuje bez sojuszu) -> ZERO
//    ruchu-posilku w strone siostry.
// ===========================================================================
console.log('4. brak sisterCityStates (symulacja "brak sojuszu") -- zero posilku');
{
  const scen = makeSceneryUnits(0); // wrog sasiaduje z siostra (dist=0 od centrum promienia normal=1)
  const city = makeCity('cityA', PLAYER_ID, CITY_Q, CITY_R);
  const opts = baseDefensiveOpts({ citySupportLevel: 'normal' }); // brak sisterCityStates!
  const cmds = decideAITurn(PLAYER_ID, scen.units, [city], map, data, opts);
  const moves = resupMoves(cmds, new Set(['g1', 'g2']));
  const movesTowardSister = moves.filter(m => hexDistance(m.toQ, m.toR, SISTER_Q, SISTER_R) < hexDistance(CITY_Q, CITY_R, SISTER_Q, SISTER_R));
  eq(movesTowardSister.length, 0, 'bez sisterCityStates -> zadna jednostka nie rusza w strone siostry (gate sojuszu dziala)');
}

// ===========================================================================
// 5. sisterCityStates obecne (symulacja "sojusz aktywny") -> posilek wysylany.
// ===========================================================================
console.log('5. sisterCityStates obecne (symulacja "sojusz aktywny") -- posilek');
{
  const scen = makeSceneryUnits(0);
  const city = makeCity('cityA', PLAYER_ID, CITY_Q, CITY_R);
  const opts = baseDefensiveOpts({
    citySupportLevel: 'normal',
    sisterCityStates: [{ ownerId: SISTER_ID, q: SISTER_Q, r: SISTER_R }],
  });
  const cmds = decideAITurn(PLAYER_ID, scen.units, [city], map, data, opts);
  const moves = resupMoves(cmds, new Set(['g1', 'g2']));
  const movesTowardSister = moves.filter(m => hexDistance(m.toQ, m.toR, SISTER_Q, SISTER_R) < hexDistance(CITY_Q, CITY_R, SISTER_Q, SISTER_R));
  eq(movesTowardSister.length, 1, 'z sisterCityStates + zagrozenie w promieniu -- DOKLADNIE 1 posilek (RESUP_MAX_PER_TURN=1)');
}

// ===========================================================================
// 6. citySupportLevel='low' (threatRadius=0) -- zagrozenie z dystansu 1 NIE wyzwala.
// ===========================================================================
console.log('6. citySupportLevel=low -- trudniej wyzwolic posilek');
{
  const scen = makeSceneryUnits(1); // wrog w odleglosci 1 od siostry (poza radius=0 dla 'low')
  const city = makeCity('cityA', PLAYER_ID, CITY_Q, CITY_R);
  const opts = baseDefensiveOpts({
    citySupportLevel: 'low',
    sisterCityStates: [{ ownerId: SISTER_ID, q: SISTER_Q, r: SISTER_R }],
  });
  const cmds = decideAITurn(PLAYER_ID, scen.units, [city], map, data, opts);
  const moves = resupMoves(cmds, new Set(['g1', 'g2']));
  const movesTowardSister = moves.filter(m => hexDistance(m.toQ, m.toR, SISTER_Q, SISTER_R) < hexDistance(CITY_Q, CITY_R, SISTER_Q, SISTER_R));
  eq(movesTowardSister.length, 0, 'low: wrog dist=1 > threatRadius=0 -- brak posilku');
}

// ===========================================================================
// 7. citySupportLevel='strong' (threatRadius=2) -- zagrozenie z dystansu 2 WYZWALA.
// ===========================================================================
console.log('7. citySupportLevel=strong -- latwiej wyzwolic posilek (radius 2)');
{
  const scen = makeSceneryUnits(2); // wrog w odleglosci 2 od siostry -- poza normal(1), w strong(2)
  const city = makeCity('cityA', PLAYER_ID, CITY_Q, CITY_R);
  const optsNormal = baseDefensiveOpts({
    citySupportLevel: 'normal',
    sisterCityStates: [{ ownerId: SISTER_ID, q: SISTER_Q, r: SISTER_R }],
  });
  const cmdsNormal = decideAITurn(PLAYER_ID, scen.units, [city], map, data, optsNormal);
  const movesNormal = resupMoves(cmdsNormal, new Set(['g1', 'g2']))
    .filter(m => hexDistance(m.toQ, m.toR, SISTER_Q, SISTER_R) < hexDistance(CITY_Q, CITY_R, SISTER_Q, SISTER_R));
  eq(movesNormal.length, 0, 'normal: wrog dist=2 > threatRadius=1 -- brak posilku');

  const optsStrong = baseDefensiveOpts({
    citySupportLevel: 'strong',
    sisterCityStates: [{ ownerId: SISTER_ID, q: SISTER_Q, r: SISTER_R }],
  });
  const scen2 = makeSceneryUnits(2);
  const cmdsStrong = decideAITurn(PLAYER_ID, scen2.units, [city], map, data, optsStrong);
  const movesStrong = resupMoves(cmdsStrong, new Set(['g1', 'g2']))
    .filter(m => hexDistance(m.toQ, m.toR, SISTER_Q, SISTER_R) < hexDistance(CITY_Q, CITY_R, SISTER_Q, SISTER_R));
  // strong.maxPerTurn=2 i oba guardy (g1,g2) kwalifikuja sie (minGuard=1) -> OBIE ida
  // (pinuje jednoczesnie threatRadius=2 ODBLOKOWUJACY posilek ORAZ maxPerTurn=2).
  eq(movesStrong.length, 2, 'strong: wrog dist=2 <= threatRadius=2 -- posilek wyslany (maxPerTurn=2 -> oba guardy)');
}

// ===========================================================================
// 8. Determinizm -- dwa identyczne wywolania -> identyczne komendy.
// ===========================================================================
console.log('8. determinizm (A=B)');
{
  const scen = makeSceneryUnits(0);
  const city = makeCity('cityA', PLAYER_ID, CITY_Q, CITY_R);
  const opts = baseDefensiveOpts({
    citySupportLevel: 'normal',
    sisterCityStates: [{ ownerId: SISTER_ID, q: SISTER_Q, r: SISTER_R }],
  });
  const cmdsA = decideAITurn(PLAYER_ID, scen.units.map(u => ({ ...u })), [city], map, data, { ...opts });
  const cmdsB = decideAITurn(PLAYER_ID, scen.units.map(u => ({ ...u })), [city], map, data, { ...opts });
  eq(JSON.stringify(cmdsA), JSON.stringify(cmdsB), 'dwa identyczne wywolania -> identyczne komendy (brak Math.random)');
}

// ===========================================================================
// 9. D-MP-DYPL Q1 (część 1): korekta startowego zaufania miast-panstw wg trudnosci.
// ===========================================================================
console.log('9. applyCityStateDifficultyTrust -- korekta zaufania miast-panstw wg trudnosci (WARIANT B)');
{
  // WARIANT B (po recon podlogi skali): skala PRZESUNIETA W GORE -- hard=0 (dzisiejsze
  // zero, zero regresji na trudnym), normal=+5, easy=+10. Unika clamp-wchloniecia, ktore
  // czynilo hard nieodroznialnym od normal w pierwotnej propozycji (easy+5/normal0/hard-10).
  eq(CITY_STATE_TRUST_DELTA_BY_DIFFICULTY.easy, 10, 'delta easy = +10');
  eq(CITY_STATE_TRUST_DELTA_BY_DIFFICULTY.normal, 5, 'delta normal = +5');
  eq(CITY_STATE_TRUST_DELTA_BY_DIFFICULTY.hard, 0, 'delta hard = 0 (dzisiejsze zero, zero regresji na trudnym)');

  const base = startRelationForPlayerSameCivCityState();
  eq(base.zaufanie, 40, 'baza miasta-panstwa gracza (REL-MP-SAME-Q1): zaufanie=20+20=40');
  eq(base.status, 'neutralni', 'status startowy zawsze neutralni (nie wojna od tury 1)');

  const relHard = applyCityStateDifficultyTrust(base, 'hard');
  eq(relHard.zaufanie, 40, 'hard: brak zmiany vs baza (delta=0)');
  eq(relHard.status, 'neutralni', 'hard: status niezmieniony');

  const relNormal = applyCityStateDifficultyTrust(base, 'normal');
  eq(relNormal.zaufanie, 45, 'normal: zaufanie podniesione o +5 (40 -> 45)');
  eq(relNormal.status, 'neutralni', 'normal: status niezmieniony');

  const relEasy = applyCityStateDifficultyTrust(base, 'easy');
  eq(relEasy.zaufanie, 50, 'easy: zaufanie podniesione o +10 (40 -> 50, najcieplej)');
  eq(relEasy.status, 'neutralni', 'easy: status niezmieniony');

  // Monotonicznosc REALNA (bez clamp-wchloniecia): easy > normal > hard, scisle rosnaco.
  assert(relEasy.zaufanie > relNormal.zaufanie, 'easy zaufanie > normal (scisle, bez clamp)');
  assert(relNormal.zaufanie > relHard.zaufanie, 'normal zaufanie > hard (scisle, bez clamp)');
  assert(relEasy.zaufanie > relHard.zaufanie, 'easy zaufanie > hard (najwieksza rozpietosc)');

  // respekt nietkniety -- korekta dotyczy WYLACZNIE zaufania.
  eq(relEasy.respekt, base.respekt, 'easy: respekt niezmieniony');
  eq(relHard.respekt, base.respekt, 'hard: respekt niezmieniony');

  // startRelationForPair(true) nadal dla AI↔AI (klaster plan) — rywalizacja −20.
  const aiSameTypeBase = startRelationForPair(true);
  eq(aiSameTypeBase.zaufanie, 0, 'AI↔AI ten sam typ: startRelationForPair(true) nadal 0');

  // applyCityStateDifficultyTrust per se nie rozroznia sameType (to main.ts decyduje GDZIE
  // ja wywolac -- WYLACZNIE spawnPendingSameTypeRivals dla miast-panstw, nigdy dla glownych
  // cywilizacji obcego typu / startRelationForPair(false) na linii ~3223).
  const foreignBase = startRelationForPair(false);
  eq(applyCityStateDifficultyTrust(foreignBase, 'easy').zaufanie, foreignBase.zaufanie + 10,
    'funkcja sama w sobie jest ogolna (deltaZ na kazdej Relation) -- scope do WYLACZNIE ' +
    'miast-panstw jest zapewniony przez main.ts (jedyne wywolanie: spawnPendingSameTypeRivals), ' +
    'nie przez logike tej funkcji');
}

// ===========================================================================
// 10. Hard: aktywne wsparcie ofensywne (cityStateOffensiveSupport).
// ===========================================================================
console.log('10. Hard offensive -- marsz na wroga wojny gdy brak zagrozenia domu');
{
  const mapOff = makeFlatMap(30, 30);
  const guard1 = makeGuard('og1', PLAYER_ID, CITY_Q, CITY_R);
  const guard2 = makeGuard('og2', PLAYER_ID, CITY_Q, CITY_R + 1);
  const guard3 = makeGuard('og3', PLAYER_ID, CITY_Q + 1, CITY_R);
  const enemyCity = makeCity('ecWar', ENEMY_ID, CITY_Q + 8, CITY_R);
  const atWar = (targetOwnerId) => targetOwnerId === ENEMY_ID;
  const city = makeCity('cityA', PLAYER_ID, CITY_Q, CITY_R);

  const cmdsNormal = decideAITurn(
    PLAYER_ID,
    [guard1, guard2, guard3],
    [city, enemyCity],
    mapOff,
    data,
    {
      defensiveCopy: true,
      citySupportLevel: 'normal',
      canEngageOwner: atWar,
    },
  );
  const movesNormal = cmdsNormal.filter(c => c.type === 'move');
  eq(movesNormal.length, 0, 'Normal (bez offensiveSupport): brak marszu na odleglego wroga');

  const cmdsHard = decideAITurn(
    PLAYER_ID,
    [guard1, guard2, guard3],
    [city, enemyCity],
    mapOff,
    data,
    {
      defensiveCopy: true,
      citySupportLevel: 'strong',
      cityStateOffensiveSupport: true,
      canEngageOwner: atWar,
    },
  );
  const movesHard = cmdsHard.filter(c => c.type === 'move');
  assert(movesHard.length >= 1, 'Hard: co najmniej 1 jednostka maszeruje na wroga wojny');
  const towardEnemy = movesHard.some(m =>
    hexDistance(m.toQ, m.toR, enemyCity.q, enemyCity.r)
    < hexDistance(
      m.unitId === 'og1' ? CITY_Q : m.unitId === 'og3' ? CITY_Q + 1 : CITY_Q,
      m.unitId === 'og2' ? CITY_R + 1 : CITY_R,
      enemyCity.q,
      enemyCity.r,
    ),
  );
  assert(towardEnemy, 'Hard: ruch zmniejsza dystans do wrogiego miasta');
}

console.log('11. Hard offensive -- dolaczenie do armii sojusznika');
{
  const mapJoin = makeFlatMap(30, 30);
  const guard1 = makeGuard('jg1', PLAYER_ID, CITY_Q, CITY_R);
  const guard2 = makeGuard('jg2', PLAYER_ID, CITY_Q, CITY_R + 1);
  const allyUnit = makeGuard('ally1', SISTER_ID, CITY_Q + 4, CITY_R);
  const enemy = makeEnemy('je1', ENEMY_ID, CITY_Q + 5, CITY_R);
  const city = makeCity('cityA', PLAYER_ID, CITY_Q, CITY_R);
  const atWar = (targetOwnerId) => targetOwnerId === ENEMY_ID;

  const cmds = decideAITurn(
    PLAYER_ID,
    [guard1, guard2, allyUnit, enemy],
    [city],
    mapJoin,
    data,
    {
      defensiveCopy: true,
      citySupportLevel: 'strong',
      cityStateOffensiveSupport: true,
      canEngageOwner: atWar,
      warAllyOwnerIds: [SISTER_ID],
    },
  );
  const moves = cmds.filter(c => c.type === 'move' && (c.unitId === 'jg1' || c.unitId === 'jg2'));
  const towardAlly = moves.some(m =>
    hexDistance(m.toQ, m.toR, allyUnit.q, allyUnit.r)
    < hexDistance(
      m.unitId === 'jg1' ? CITY_Q : CITY_Q,
      m.unitId === 'jg2' ? CITY_R + 1 : CITY_R,
      allyUnit.q,
      allyUnit.r,
    ),
  );
  assert(towardAlly || moves.length >= 1, 'Hard: jednostka MP rusza w strone sojusznika lub wroga');
}

// ---------------------------------------------------------------------------
console.log('');
console.log(`city-state-alliance-test: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
