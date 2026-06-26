'use strict';
/**
 * diplomacy-test.cjs -- standalone Node test for src/game/diplomacy.ts.
 * Run from gra/:  node tools/diplomacy-test.cjs
 *
 * Self-contained: bundles diplomacy.ts (+ its type-only deps) with esbuild to a
 * temp CJS file, then requires it and runs assertions. Does NOT touch the shared
 * logic-test harness. Pure logic only -- no DOM, no THREE.
 *
 * Covers: relationScore, applyDiplomaticEvent (every event + sign + clamp +
 * immutability + params override), initialRelation, aiDiplomacyStance (minor +
 * main paths, thresholds, war/peace dynamics), toRelation, DIPLOMACY_PARAMS
 * mirror of data/diplomacy.json, computePotegaNacji + computeRespekt (nowe API).
 */

const fs   = require('fs');
const path = require('path');

// --- esbuild ---------------------------------------------------------------
const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[diplomacy-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE  = path.resolve(__dirname, '.dip-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.dip-bundle.cjs');

// Source tree base. Defaults to the real gra/src. Override with DIP_SRC_DIR to
// bundle from a fresh copy (used when the OneDrive sandbox mount serves a stale
// diplomacy.ts after an edit -- the real file stays the source of truth).
const SRC = process.env.DIP_SRC_DIR || path.resolve(__dirname, '..', 'src');
const ENTRY_TS = `
export {
  DIPLOMACY_PARAMS, relationScore, applyDiplomaticEvent,
  aiDiplomacyStance, initialRelation, toRelation, loadDiplomacyParams,
  relationTier, TIER_NAMES,
  computePotegaNacji, computeRespekt, DEFAULT_POTEGA_WAGI, tickDiplomacy,
} from ${JSON.stringify(SRC + '/game/diplomacy')};
export { TypCywilizacji } from ${JSON.stringify(SRC + '/types/player')};
export { StanWojny, RodzajTraktatu } from ${JSON.stringify(SRC + '/types/diplomacy')};
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
  });
} catch (e) {
  console.error('[diplomacy-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const B = require(BUNDLE_FILE);
const {
  DIPLOMACY_PARAMS, relationScore, applyDiplomaticEvent,
  aiDiplomacyStance, initialRelation, toRelation, loadDiplomacyParams,
  relationTier, TIER_NAMES,
  computePotegaNacji, computeRespekt, DEFAULT_POTEGA_WAGI, tickDiplomacy,
  TypCywilizacji, StanWojny, RodzajTraktatu,
} = B;

// --- tiny assertion framework ----------------------------------------------
let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('  FAIL:', msg); }
}
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }
function approx(a, b, msg, eps = 1e-9) {
  assert(Math.abs(a - b) < eps, `${msg} (got ${a}, want ~${b})`);
}

// --- fixtures ---------------------------------------------------------------
function rel(z, r, status = 'neutralni') { return { zaufanie: z, respekt: r, status }; }
function mkPlayer(id, typ) {
  return {
    id,
    typCywilizacji: typ,
    skarbiec: { pieniadz: 0 },
    nauka: { punktyNauki: 0, tech: {} },
    kultura: { laczna: 0, naTure: 0 },
    relacjeDyplomacjiIds: [],
    isAI: true,
    isAlive: true,
  };
}
function rdip(zaufanie, respekt, stanWojny, traktaty = []) {
  return {
    graczA: 'a', graczB: 'b',
    zaufanie, respekt, relacjaOgolna: zaufanie + respekt,
    traktaty, stanWojny, kontaktNawiazany: true, urazyHistoryczne: 0,
  };
}
const ctx = (o = {}) => Object.assign(
  { isMinorCiv: false, militaryRatio: 1, currentTurn: 1, turnsAtWar: 0 }, o);

// ===========================================================================
// 1. DIPLOMACY_PARAMS -- mirror of data/diplomacy.json (panel C/E + starts)
// ===========================================================================
eq(DIPLOMACY_PARAMS.progSojuszZaufanie,      60, 'prog Sojusz Zaufanie = 60');
eq(DIPLOMACY_PARAMS.progWymianaTechZaufanie, 70, 'prog Wymiana tech Zaufanie = 70');
eq(DIPLOMACY_PARAMS.progWasalizacjaRespekt,  70, 'prog Wasalizacja Respekt = 70');
eq(DIPLOMACY_PARAMS.progWchloniecieRespekt,  90, 'prog Wchloniecie Respekt = 90');
eq(DIPLOMACY_PARAMS.progMinimalnyRelacja,    30, 'prog Minimalny Relacja = 30');
eq(DIPLOMACY_PARAMS.progSojuszRelacja,      120, 'prog Sojusz Relacja = 120');
eq(DIPLOMACY_PARAMS.startZaufanie,           20, 'start Zaufanie = 20');
eq(DIPLOMACY_PARAMS.startRespekt,            30, 'start Respekt = 30');
eq(DIPLOMACY_PARAMS.turyEfektuPodarunku,      5, 'tury efektu podarunku = 5');
approx(DIPLOMACY_PARAMS.wspolnaReligia_zaufanie_perTura,  0.5, 'wspolna religia +0.5/ture');
approx(DIPLOMACY_PARAMS.odmiennaReligia_zaufanie_perTura, -0.5, 'odmienna religia -0.5/ture');
eq(DIPLOMACY_PARAMS.ekspansjaGranica_zaufanie_perTura,   -2, 'ekspansja granica -2/ture');

// ===========================================================================
// 2. relationScore -- Relacja = Zaufanie + Respekt, clamp [0,200]
// ===========================================================================
eq(relationScore(rel(20, 30)), 50,  'relationScore 20+30 = 50');
eq(relationScore(rel(40, 10)), 50,  'relationScore weights default 1');
eq(relationScore(rel(100, 100)), 200, 'relationScore clamps at 200');
eq(relationScore(rel(0, 0)), 0,     'relationScore floor 0');

// ===========================================================================
// 3. applyDiplomaticEvent -- immutability
// ===========================================================================
const r0 = rel(20, 30);
const r1 = applyDiplomaticEvent(r0, 'dar');
eq(r0.zaufanie, 20, 'applyDiplomaticEvent does not mutate input');
eq(r1.zaufanie, 26, 'dar returns new Relation +6');

// ---- one-shot Zaufanie bonuses ----
eq(applyDiplomaticEvent(rel(20, 30), 'handel').zaufanie,            22, 'handel +2 Z');
eq(applyDiplomaticEvent(rel(20, 30), 'pomoc_sojusznikowi').zaufanie, 30, 'pomoc sojusznikowi +10 Z');
eq(applyDiplomaticEvent(rel(20, 30), 'dar').zaufanie,              26, 'dar +6 Z');
eq(applyDiplomaticEvent(rel(20, 30), 'wspolna_religia').zaufanie,  21, 'wspolna religia seed +1 Z');
{
  const r = applyDiplomaticEvent(rel(20, 30), 'wspolny_wrog');
  eq(r.zaufanie, 25, 'wspolny wrog +5 Z');
  eq(r.respekt,  40, 'wspolny wrog +10 R');
}

// ---- one-shot Zaufanie penalties ----
eq(applyDiplomaticEvent(rel(60, 30), 'zlamana_obietnica').zaufanie,    20, 'zlamana obietnica gracz -40 Z');
eq(applyDiplomaticEvent(rel(20, 30), 'zlamana_obietnica').zaufanie,     0, 'zlamana obietnica clamps at 0');
eq(applyDiplomaticEvent(rel(50, 30), 'zlamana_obietnica_ai').zaufanie, 30, 'zlamana obietnica AI -20 Z');
eq(applyDiplomaticEvent(rel(20, 30), 'tarcia_graniczne').zaufanie,     18, 'tarcia graniczne -2 Z');
eq(applyDiplomaticEvent(rel(20, 30), 'szpiegostwo_wykryte' /* not an event */).zaufanie, 20, 'unknown event is a no-op');

// ---- respect events ----
eq(applyDiplomaticEvent(rel(20, 30), 'wygrana_bitwa').respekt,       35, 'wygrana bitwa +5 R');
eq(applyDiplomaticEvent(rel(20, 30), 'przewaga_militarna').respekt, 45, 'przewaga militarna +15 R');
eq(applyDiplomaticEvent(rel(20, 40), 'slabszy_militarnie').respekt, 30, 'slabszy militarnie -10 R');
eq(applyDiplomaticEvent(rel(20, 30), 'trybut_zaakceptowany').respekt, 40, 'trybut zaakceptowany +10 R');

// ---- war / peace status transitions ----
{
  const r = applyDiplomaticEvent(rel(60, 40), 'zdrada');
  eq(r.zaufanie, 10,      'zdrada -50 Z');
  eq(r.status,  'wojna',  'zdrada sets status wojna');
}
{
  const r = applyDiplomaticEvent(rel(50, 30), 'wojna_wypowiedziana');
  eq(r.zaufanie, 30,      'wojna bez c.b. -20 Z');
  eq(r.status,  'wojna',  'wojna_wypowiedziana sets wojna');
}
{
  const r = applyDiplomaticEvent(rel(20, 30, 'wojna'), 'pokoj');
  eq(r.zaufanie, 25,      'pokoj +5 Z');
  eq(r.status,  'pokoj',  'pokoj sets status pokoj');
}
// status preserved when event does not touch it
eq(applyDiplomaticEvent(rel(20, 30, 'pokoj'), 'handel').status, 'pokoj', 'handel preserves status');

// ---- clamp bounds ----
eq(applyDiplomaticEvent(rel(98, 30), 'dar').zaufanie,            100, 'Zaufanie clamps at 100');
eq(applyDiplomaticEvent(rel(20, 95), 'przewaga_militarna').respekt, 100, 'Respekt clamps at 100');

// ---- params override (mnoznikPodarunku) ----
eq(applyDiplomaticEvent(rel(20, 30), 'dar', { mnoznikPodarunku: 2 }).zaufanie, 32, 'dar x2 mnoznik = +12');

// ---- NEW spec-faithful events (Dyplomacja-szablon.md section 1) ----
{
  const r = applyDiplomaticEvent(rel(50, 30), 'wojna_casus_belli');
  eq(r.zaufanie, 40,     'wojna z casus belli -10 Z');
  eq(r.status,  'wojna', 'wojna_casus_belli sets wojna');
}
eq(applyDiplomaticEvent(rel(20, 30), 'ultimatum_spelnione').zaufanie, 15, 'ultimatum spelnione -5 Z');
{
  const r = applyDiplomaticEvent(rel(30, 40), 'ultimatum_bezpodstawne');
  eq(r.zaufanie, 20, 'ultimatum bezpodstawne -10 Z');
  eq(r.respekt,  30, 'ultimatum bezpodstawne -10 R');
}
eq(applyDiplomaticEvent(rel(20, 30), 'trybut_odmowa').zaufanie,        10, 'trybut odmowa -10 Z');
eq(applyDiplomaticEvent(rel(20, 30), 'trybut_oferta_przyjeta').zaufanie, 25, 'trybut oferta przyjeta +5 Z');
eq(applyDiplomaticEvent(rel(20, 30), 'wymiana_tech_gratis').zaufanie,   25, 'wymiana tech gratis +5 Z');

// ===========================================================================
// 4. initialRelation -- startowe korekty
// ===========================================================================
{
  const a = mkPlayer('a', TypCywilizacji.Grecy);
  const b = mkPlayer('b', TypCywilizacji.Grecy);
  const r = initialRelation(a, b);
  eq(r.zaufanie, 0,  'same type: start 20 - 20 rywalizacja = 0');
  eq(r.respekt, 30,  'same type: start Respekt 30');
  eq(r.status, 'neutralni', 'initial status neutralni');
}
{
  const r = initialRelation(mkPlayer('a', TypCywilizacji.Grecy), mkPlayer('b', TypCywilizacji.Rzymianie));
  eq(r.zaufanie, 15, 'diff main types: 20 - 5 roznica kulturowa = 15');
}
{
  const r = initialRelation(mkPlayer('a', TypCywilizacji.Grecy), mkPlayer('b', TypCywilizacji.DrobnaCywilizacja));
  eq(r.zaufanie, 20, 'main vs minor: no penalty = 20');
}

// ===========================================================================
// 5. aiDiplomacyStance -- minor civ path (paragraph 5.2)
// ===========================================================================
{
  // isMinorCiv flag forces minor path even for a main-type player
  const s = aiDiplomacyStance(mkPlayer('g', TypCywilizacji.Grecy), mkPlayer('o', TypCywilizacji.Rzymianie),
                              rel(50, 20), ctx({ isMinorCiv: true }));
  eq(s.willingnessAlly, 0,   'minor: alliances impossible');
  eq(s.willingnessTrade, 0.6, 'minor: trade open when Relacja(70) > 30');
  eq(s.willingnessWar,  0.05, 'minor: baseline low war willingness');
  approx(s.willingnessPeace, 20 / 60, 'minor: peace = respekt/60 when respekt<=60');
}
{
  // DrobnaCywilizacja type forces minor path even with isMinorCiv:false
  const s = aiDiplomacyStance(mkPlayer('m', TypCywilizacji.DrobnaCywilizacja), mkPlayer('o', TypCywilizacji.Grecy),
                              rel(10, 80), ctx({ isMinorCiv: false }));
  eq(s.willingnessAlly, 0,   'minor by type: alliances impossible');
  eq(s.willingnessPeace, 0.9, 'minor: high Respekt(80>60) -> peace 0.9');
}

// ===========================================================================
// 6. aiDiplomacyStance -- main civ path (thresholds + dynamics)
// ===========================================================================
{
  // trade gated by progMinimalnyRelacja (30)
  const s = aiDiplomacyStance(mkPlayer('g', TypCywilizacji.Grecy), mkPlayer('o', TypCywilizacji.Zulusi),
                              rel(5, 10), ctx());
  eq(s.willingnessTrade, 0, 'main: trade 0 when Relacja(15) < 30');
}
{
  // alliance gated by Zaufanie>=60 AND Relacja>=120
  const sNo = aiDiplomacyStance(mkPlayer('g', TypCywilizacji.Grecy), mkPlayer('o', TypCywilizacji.Grecy),
                                rel(50, 80), ctx());
  eq(sNo.willingnessAlly, 0, 'main: ally 0 when Zaufanie(50) < 60 even if Relacja 130');
  const sYes = aiDiplomacyStance(mkPlayer('g', TypCywilizacji.Grecy), mkPlayer('o', TypCywilizacji.Grecy),
                                 rel(80, 50), ctx());
  assert(sYes.willingnessAlly > 0 && sYes.willingnessAlly <= 1, 'main: ally > 0 when Zaufanie 80 & Relacja 130');
}
{
  // archetype aggression: Zulusi more warlike than Chinczycy at equal low relation
  const low = rel(10, 50);
  const zul = aiDiplomacyStance(mkPlayer('z', TypCywilizacji.Zulusi),    mkPlayer('o', TypCywilizacji.Grecy), low, ctx());
  const chi = aiDiplomacyStance(mkPlayer('c', TypCywilizacji.Chinczycy), mkPlayer('o', TypCywilizacji.Grecy), low, ctx());
  assert(zul.willingnessWar > chi.willingnessWar, 'Zulusi warlust > Chinczycy at equal relation');
}
{
  // no war willingness while already at war
  const s = aiDiplomacyStance(mkPlayer('z', TypCywilizacji.Zulusi), mkPlayer('o', TypCywilizacji.Grecy),
                              rel(10, 50, 'wojna'), ctx({ turnsAtWar: 5 }));
  eq(s.willingnessWar, 0, 'no new war declaration while at war');
}
{
  // peace willingness rises with war weariness; 0.8 baseline at peace
  const sShort = aiDiplomacyStance(mkPlayer('r', TypCywilizacji.Rzymianie), mkPlayer('o', TypCywilizacji.Grecy),
                                   rel(20, 50, 'wojna'), ctx({ turnsAtWar: 0,  militaryRatio: 1 }));
  const sLong  = aiDiplomacyStance(mkPlayer('r', TypCywilizacji.Rzymianie), mkPlayer('o', TypCywilizacji.Grecy),
                                   rel(20, 50, 'wojna'), ctx({ turnsAtWar: 20, militaryRatio: 1 }));
  assert(sLong.willingnessPeace > sShort.willingnessPeace, 'longer war -> more peace willingness');
  const sPeace = aiDiplomacyStance(mkPlayer('r', TypCywilizacji.Rzymianie), mkPlayer('o', TypCywilizacji.Grecy),
                                   rel(20, 30, 'pokoj'), ctx());
  eq(sPeace.willingnessPeace, 0.8, 'baseline peace willingness 0.8 when not at war');
}

// ===========================================================================
// 7. toRelation -- RelacjaDyplomatyczna -> Relation projection
// ===========================================================================
{
  const r = toRelation(rdip(44, 22, StanWojny.Wojna));
  eq(r.status, 'wojna', 'StanWojny.Wojna -> wojna');
  eq(r.zaufanie, 44, 'toRelation passes Zaufanie');
  eq(r.respekt,  22, 'toRelation passes Respekt');
}
eq(toRelation(rdip(50, 50, StanWojny.CasusBelli)).status, 'wojna', 'CasusBelli -> wojna');
eq(toRelation(rdip(50, 50, StanWojny.Pokoj)).status,      'pokoj', 'Pokoj (no treaty) -> pokoj');
eq(toRelation(rdip(50, 50, StanWojny.Rozejm)).status,     'pokoj', 'Rozejm (no treaty) -> pokoj');
eq(toRelation(rdip(50, 50, StanWojny.Pokoj,
     [{ rodzaj: RodzajTraktatu.SojuszWojskowy, wygasaTura: null }])).status, 'sojusz',
   'Pokoj + sojusz treaty -> sojusz');
// default branch (out-of-enum status)
eq(toRelation(rdip(50, 50, 'inny')).status, 'neutralni', 'unknown stanWojny, no treaty -> neutralni');
eq(toRelation(rdip(50, 50, 'inny',
     [{ rodzaj: RodzajTraktatu.SojuszWojskowy, wygasaTura: null }])).status, 'sojusz',
   'unknown stanWojny + sojusz -> sojusz');

// ===========================================================================
// 8. loadDiplomacyParams -- panel (json.params) -> model overrides
// ===========================================================================
eq(Object.keys(loadDiplomacyParams({})).length,            0, 'loadDiplomacyParams: brak params -> {}');
eq(Object.keys(loadDiplomacyParams({ params: null })).length, 0, 'loadDiplomacyParams: params=null -> {}');
eq(Object.keys(loadDiplomacyParams(undefined)).length,     0, 'loadDiplomacyParams: undefined -> {}');
{
  const o = loadDiplomacyParams({ params: { progSojuszZaufanie: 55, dar_zaufanie: 9 } });
  eq(o.progSojuszZaufanie, 55, 'loadDiplomacyParams czyta progSojuszZaufanie');
  eq(o.dar_zaufanie,        9, 'loadDiplomacyParams czyta dar_zaufanie');
}
{
  const o = loadDiplomacyParams({ params: { progSojuszZaufanie: 'x', bogus: 5, startRespekt: 40 } });
  eq(o.progSojuszZaufanie, undefined, 'loadDiplomacyParams pomija nie-liczbe');
  eq(o.bogus,              undefined, 'loadDiplomacyParams pomija nieznany klucz');
  eq(o.startRespekt,       40,        'loadDiplomacyParams czyta poprawny startRespekt');
}
eq(applyDiplomaticEvent(rel(20, 30), 'dar', loadDiplomacyParams({ params: { dar_zaufanie: 9 } })).zaufanie,
   29, 'override z loadera wplywa na applyDiplomaticEvent (+9)');

// ===========================================================================
// 9. progPoboczneWojna remap -- galaz wojny drobnych osiagalna (skala 0-200)
// ===========================================================================
{
  const minor = mkPlayer('m', TypCywilizacji.DrobnaCywilizacja);
  const other = mkPlayer('o', TypCywilizacji.Grecy);
  eq(aiDiplomacyStance(minor, other, rel(5, 5),  ctx()).willingnessWar, 0.2,  'minor: Relacja(10)<15 -> wojna 0.2');
  eq(aiDiplomacyStance(minor, other, rel(50, 20), ctx()).willingnessWar, 0.05, 'minor: Relacja(70)>=15 -> wojna 0.05');
}

// ===========================================================================
// 10. relationTier + TIER_NAMES
// ===========================================================================
// TIER_NAMES: indeks = tier
eq(TIER_NAMES[0], 'Wojna',     'TIER_NAMES[0] = Wojna');
eq(TIER_NAMES[4], 'Sojusz',   'TIER_NAMES[4] = Sojusz');

// status nadrzedny nad score
eq(relationTier(rel(100, 100, 'wojna')),  0, 'status=wojna -> tier 0 (Wojna), niezaleznie od score');
eq(relationTier(rel(0, 0, 'sojusz')),     4, 'status=sojusz -> tier 4 (Sojusz), niezaleznie od score');

// score-based tiers (status neutralni/pokoj)
eq(relationTier(rel(10, 10)),  1, 'score=20 (< 30) -> tier 1 (Wrogi)');
eq(relationTier(rel(25, 25)),  2, 'score=50 (>= 30, < 60) -> tier 2 (Neutralny; typowy start gry)');
eq(relationTier(rel(50, 40)),  3, 'score=90 (>= 60, < 120) -> tier 3 (Przyjazny)');
eq(relationTier(rel(70, 60)),  4, 'score=130 (>= 120) -> tier 4 (Sojusz)');

// granice (boundary values)
eq(relationTier(rel(15, 15)),  2, 'score=30 DOKLADNIE >= progMinimalny(30) -> tier 2 (Neutralny), granica');


// ===========================================================================
// 11. computePotegaNacji -- warstwa 1: ważona suma komponentów [0,1]
// ===========================================================================
{
  // Pelna dominacja: wszystkie komponenty = 1 -> Potega = 100
  const k = { wielkoscArmii: 1, wygraneBitwy: 1, ludnosc: 1, miasta: 1, gospodarka: 1, epoka: 1 };
  eq(computePotegaNacji(k), 100, 'computePotegaNacji: pelna dominacja -> 100');
}
{
  // Pelna slabosc: wszystkie komponenty = 0 -> Potega = 0
  const k = { wielkoscArmii: 0, wygraneBitwy: 0, ludnosc: 0, miasta: 0, gospodarka: 0, epoka: 0 };
  eq(computePotegaNacji(k), 0, 'computePotegaNacji: pelna slabosc -> 0');
}
{
  // Rownowaga: wszystkie komponenty = 0.5 -> Potega = round(0.5*100) = 50
  const k = { wielkoscArmii: 0.5, wygraneBitwy: 0.5, ludnosc: 0.5, miasta: 0.5, gospodarka: 0.5, epoka: 0.5 };
  eq(computePotegaNacji(k), 50, 'computePotegaNacji: rownowaga (0.5) -> 50');
}
{
  // Tylko wielkoscArmii=1 (waga 28), reszta 0 -> round(28) = 28
  const k = { wielkoscArmii: 1, wygraneBitwy: 0, ludnosc: 0, miasta: 0, gospodarka: 0, epoka: 0 };
  eq(computePotegaNacji(k), 28, 'computePotegaNacji: tylko wielkoscArmii=1 -> 28');
}
{
  // Tylko wygraneBitwy=1 (waga 20), reszta 0 -> round(20) = 20
  const k = { wielkoscArmii: 0, wygraneBitwy: 1, ludnosc: 0, miasta: 0, gospodarka: 0, epoka: 0 };
  eq(computePotegaNacji(k), 20, 'computePotegaNacji: tylko wygraneBitwy=1 -> 20');
}
{
  // DEFAULT_POTEGA_WAGI suma = 100
  const { wielkoscArmii, wygraneBitwy, ludnosc, miasta, gospodarka, epoka } = DEFAULT_POTEGA_WAGI;
  eq(wielkoscArmii + wygraneBitwy + ludnosc + miasta + gospodarka + epoka, 100,
     'DEFAULT_POTEGA_WAGI suma = 100');
}
{
  // Militaria (armia+bitwy) = 48% wagi
  eq(DEFAULT_POTEGA_WAGI.wielkoscArmii + DEFAULT_POTEGA_WAGI.wygraneBitwy, 48,
     'DEFAULT_POTEGA_WAGI: militaria (armia+bitwy) = 48');
}
{
  // Clamp: wynik nie przekracza 100 nawet gdy suma wag > 100
  const k = { wielkoscArmii: 1, wygraneBitwy: 1, ludnosc: 1, miasta: 1, gospodarka: 1, epoka: 1 };
  const overWagi = { wielkoscArmii: 30, wygraneBitwy: 25, ludnosc: 20, miasta: 20, gospodarka: 15, epoka: 15 };
  // sum = 125; wynik = clamp(round(125), 0, 100) = 100
  eq(computePotegaNacji(k, overWagi), 100, 'computePotegaNacji: wynik klampuje do 100 gdy suma wag > 100');
}

// ===========================================================================
// 12. computeRespekt -- warstwa 2: ratio-share relatywizacja potegi
// ===========================================================================
{
  // Parytet: self = partner -> Respekt = 50
  eq(computeRespekt(50, 50), 50, 'computeRespekt: parytet (50,50) -> 50');
}
{
  // Parytet dowolny: self = partner (kazda wartosc) -> 50
  eq(computeRespekt(30, 30), 50, 'computeRespekt: parytet (30,30) -> 50');
  eq(computeRespekt(100, 100), 50, 'computeRespekt: parytet (100,100) -> 50');
}
{
  // Przewaga: self > partner -> Respekt > 50
  const r = computeRespekt(80, 20);
  assert(r > 50, `computeRespekt: self(80) > partner(20) -> Respekt(${r}) > 50`);
  eq(r, 80, 'computeRespekt: self=80, partner=20 -> round(100*80/100)=80');
}
{
  // Slabosc: self < partner -> Respekt < 50
  const r = computeRespekt(20, 80);
  assert(r < 50, `computeRespekt: self(20) < partner(80) -> Respekt(${r}) < 50`);
  eq(r, 20, 'computeRespekt: self=20, partner=80 -> round(100*20/100)=20');
}
{
  // Guard: 0+0 -> 50 (parytet, brak danych)
  eq(computeRespekt(0, 0), 50, 'computeRespekt: guard 0+0 -> 50');
}
{
  // Clamp: nawet jesli potega_self >> 100 wynik klampuje do 100
  eq(computeRespekt(200, 0), 100, 'computeRespekt: clamp gorny -> 100 przy partner=0');
}
{
  // Asymetria: computeRespekt(A,B) + computeRespekt(B,A) = 100
  const ab = computeRespekt(70, 30);
  const ba = computeRespekt(30, 70);
  eq(ab + ba, 100, `computeRespekt: asymetria A(${ab})+B(${ba})=100`);
}
{
  // Odporne na skale: 2x obu stron nie zmienia wyniku
  eq(computeRespekt(40, 60), computeRespekt(80, 120), 'computeRespekt: odporne na skale (2x obu)');
}
{
  // Bardzo slaby (potega 10 vs 70): Respekt wyraznie < 50 -> powinien ulec
  const r = computeRespekt(10, 70);
  assert(r < 30, `computeRespekt: bardzo slaby (10 vs 70) -> Respekt(${r}) < 30 -> ulega`);
}
{
  // Bardzo silny (potega 70 vs 10): Respekt wyraznie > 50 -> moze zadac trybutu
  const r = computeRespekt(70, 10);
  assert(r > 70, `computeRespekt: bardzo silny (70 vs 10) -> Respekt(${r}) > 70 -> zadaje trybutu`);
}

// ===========================================================================
// 13. tickDiplomacy -- per-turowe przesunięcie (immutable, flags, expiry)
// ===========================================================================
function mkRdip(zaufanie, respekt, urazyHistoryczne = 0, traktaty = []) {
  return {
    graczA: 'a', graczB: 'b',
    zaufanie, respekt, relacjaOgolna: zaufanie + respekt,
    traktaty, stanWojny: StanWojny.Pokoj, kontaktNawiazany: true, urazyHistoryczne,
  };
}
{
  // handel + pakt -> +2 Zaufanie/turę; immutable
  const r0 = mkRdip(30, 20);
  const r1 = tickDiplomacy(r0, { turn: 1, aktywnyHandel: true, aktywnyPakt: true });
  eq(r0.zaufanie, 30, 'tickDiplomacy: nie mutuje wejścia');
  eq(r1.zaufanie, 32, 'tickDiplomacy: handel+pakt -> +2 Zaufanie');
  eq(r1.relacjaOgolna, 52, 'tickDiplomacy: relacjaOgolna = zaufanie + respekt');
}
{
  // ekspansja przy granicy -> -2 Zaufanie/turę
  const r = tickDiplomacy(mkRdip(50, 30), { turn: 5, ekspansjaPrzyGranicy: true });
  eq(r.zaufanie, 48, 'tickDiplomacy: ekspansja -> -2 Zaufanie');
}
{
  // Clamp: Zaufanie nie schodzi poniżej 0
  const r = tickDiplomacy(mkRdip(1, 30), { turn: 2, ekspansjaPrzyGranicy: true });
  eq(r.zaufanie, 0, 'tickDiplomacy: Zaufanie klampuje do 0');
}
{
  // Wygasanie traktatu: wygasaTura <= turn -> usunięty
  const traktaty = [
    { rodzaj: RodzajTraktatu.PaktNieagresji, wygasaTura: 5 },  // wygasa
    { rodzaj: RodzajTraktatu.UmowaHandlowa,  wygasaTura: 10 }, // zostaje
    { rodzaj: RodzajTraktatu.SojuszWojskowy, wygasaTura: null }, // bezterminowy
  ];
  const r = tickDiplomacy(mkRdip(40, 30, 0, traktaty), { turn: 5 });
  eq(r.traktaty.length, 2, 'tickDiplomacy: traktat wygasaTura<=turn usuwany');
  assert(r.traktaty.every(t => t.wygasaTura === null || t.wygasaTura > 5),
         'tickDiplomacy: pozostałe traktaty mają wygasaTura>5 lub null');
}
{
  // Zanik urazów co 20 tur: turn=20, urazyHistoryczne=10 -> zmniejsza o 2 -> 8
  const r = tickDiplomacy(mkRdip(30, 20, 10), { turn: 20 });
  eq(r.urazyHistoryczne, 8, 'tickDiplomacy: zanik urazów co 20 tur o 2');
}
{
  // Zanik urazów: turn=19 (nie 20) -> brak zaniku
  const r = tickDiplomacy(mkRdip(30, 20, 10), { turn: 19 });
  eq(r.urazyHistoryczne, 10, 'tickDiplomacy: brak zaniku urazów poza turą %20');
}
{
  // Zanik urazów nie schodzi poniżej 0 (urazy=1 -> max(0, 1-2)=0)
  const r = tickDiplomacy(mkRdip(30, 20, 1), { turn: 20 });
  eq(r.urazyHistoryczne, 0, 'tickDiplomacy: zanik urazów nie schodzi poniżej 0');
}

// ===========================================================================
// 14. zerwanie_handlu event -- §1.5 -10 Zaufanie
// ===========================================================================
{
  const r = applyDiplomaticEvent(rel(40, 30), 'zerwanie_handlu');
  eq(r.zaufanie, 30, 'zerwanie_handlu: -10 Zaufanie');
  eq(r.respekt,  30, 'zerwanie_handlu: Respekt bez zmian');
  eq(r.status, 'neutralni', 'zerwanie_handlu: status bez zmian');
}
{
  // Clamp: Zaufanie nie schodzi poniżej 0
  const r = applyDiplomaticEvent(rel(5, 30), 'zerwanie_handlu');
  eq(r.zaufanie, 0, 'zerwanie_handlu: Zaufanie klampuje do 0');
}

// ===========================================================================
// Summary
// ===========================================================================
console.log(`\n[diplomacy-test] ${passed} passed, ${failed} failed (total ${passed + failed}).`);
process.exit(failed === 0 ? 0 : 1);
