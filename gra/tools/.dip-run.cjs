'use strict';
/**
 * .dip-run.cjs -- TEMP fresh runner (identical logic to diplomacy-test.cjs).
 * Exists only because editing diplomacy-test.cjs dehydrated it in the sandbox
 * mount. Run:  DIP_SRC_DIR=/tmp/diptest/src node tools/.dip-run.cjs
 * Safe to delete; canonical test is tools/diplomacy-test.cjs.
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) { console.error('[dip-run] esbuild not found.'); process.exit(1); }
})();

const ENTRY_FILE  = path.resolve(__dirname, '.dip-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.dip-bundle.cjs');

const SRC = process.env.DIP_SRC_DIR || path.resolve(__dirname, '..', 'src');
const ENTRY_TS = `
export {
  DIPLOMACY_PARAMS, relationScore, applyDiplomaticEvent,
  aiDiplomacyStance, initialRelation, toRelation,
} from ${JSON.stringify(SRC + '/game/diplomacy')};
export { TypCywilizacji } from ${JSON.stringify(SRC + '/types/player')};
export { StanWojny, RodzajTraktatu } from ${JSON.stringify(SRC + '/types/diplomacy')};
`;
fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE], bundle: true, platform: 'node',
    format: 'cjs', target: 'node18', outfile: BUNDLE_FILE, logLevel: 'silent',
  });
} catch (e) { console.error('[dip-run] bundling failed:\n', e.message || e); process.exit(1); }

const B = require(BUNDLE_FILE);
const {
  DIPLOMACY_PARAMS, relationScore, applyDiplomaticEvent,
  aiDiplomacyStance, initialRelation, toRelation,
  TypCywilizacji, StanWojny, RodzajTraktatu,
} = B;

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) passed++; else { failed++; console.error('  FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }
function approx(a, b, msg, eps = 1e-9) { assert(Math.abs(a - b) < eps, `${msg} (got ${a}, want ~${b})`); }

function rel(z, r, status = 'neutralni') { return { zaufanie: z, respekt: r, status }; }
function mkPlayer(id, typ) {
  return { id, typCywilizacji: typ, skarbiec: { pieniadz: 0 },
    nauka: { punktyNauki: 0, tech: {} }, kultura: { laczna: 0, naTure: 0 },
    relacjeDyplomacjiIds: [], isAI: true, isAlive: true };
}
function rdip(zaufanie, respekt, stanWojny, traktaty = []) {
  return { graczA: 'a', graczB: 'b', zaufanie, respekt, relacjaOgolna: zaufanie + respekt,
    traktaty, stanWojny, kontaktNawiazany: true, urazyHistoryczne: 0 };
}
const ctx = (o = {}) => Object.assign({ isMinorCiv: false, militaryRatio: 1, currentTurn: 1, turnsAtWar: 0 }, o);

// 1. DIPLOMACY_PARAMS mirror
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

// 2. relationScore
eq(relationScore(rel(20, 30)), 50,  'relationScore 20+30 = 50');
eq(relationScore(rel(40, 10)), 50,  'relationScore weights default 1');
eq(relationScore(rel(100, 100)), 200, 'relationScore clamps at 200');
eq(relationScore(rel(0, 0)), 0,     'relationScore floor 0');

// 3. applyDiplomaticEvent immutability + each event
const r0 = rel(20, 30);
const r1 = applyDiplomaticEvent(r0, 'dar');
eq(r0.zaufanie, 20, 'applyDiplomaticEvent does not mutate input');
eq(r1.zaufanie, 26, 'dar returns new Relation +6');
eq(applyDiplomaticEvent(rel(20, 30), 'handel').zaufanie,            22, 'handel +2 Z');
eq(applyDiplomaticEvent(rel(20, 30), 'pomoc_sojusznikowi').zaufanie, 30, 'pomoc sojusznikowi +10 Z');
eq(applyDiplomaticEvent(rel(20, 30), 'dar').zaufanie,              26, 'dar +6 Z');
eq(applyDiplomaticEvent(rel(20, 30), 'wspolna_religia').zaufanie,  21, 'wspolna religia seed +1 Z');
{ const r = applyDiplomaticEvent(rel(20, 30), 'wspolny_wrog');
  eq(r.zaufanie, 25, 'wspolny wrog +5 Z'); eq(r.respekt, 40, 'wspolny wrog +10 R'); }
eq(applyDiplomaticEvent(rel(60, 30), 'zlamana_obietnica').zaufanie,    20, 'zlamana obietnica gracz -40 Z');
eq(applyDiplomaticEvent(rel(20, 30), 'zlamana_obietnica').zaufanie,     0, 'zlamana obietnica clamps at 0');
eq(applyDiplomaticEvent(rel(50, 30), 'zlamana_obietnica_ai').zaufanie, 30, 'zlamana obietnica AI -20 Z');
eq(applyDiplomaticEvent(rel(20, 30), 'tarcia_graniczne').zaufanie,     18, 'tarcia graniczne -2 Z');
eq(applyDiplomaticEvent(rel(20, 30), 'nieznane_zdarzenie').zaufanie,   20, 'unknown event is a no-op');
eq(applyDiplomaticEvent(rel(20, 30), 'wygrana_bitwa').respekt,       35, 'wygrana bitwa +5 R');
eq(applyDiplomaticEvent(rel(20, 30), 'przewaga_militarna').respekt, 45, 'przewaga militarna +15 R');
eq(applyDiplomaticEvent(rel(20, 40), 'slabszy_militarnie').respekt, 30, 'slabszy militarnie -10 R');
eq(applyDiplomaticEvent(rel(20, 30), 'trybut_zaakceptowany').respekt, 40, 'trybut zaakceptowany +10 R');
{ const r = applyDiplomaticEvent(rel(60, 40), 'zdrada');
  eq(r.zaufanie, 10, 'zdrada -50 Z'); eq(r.status, 'wojna', 'zdrada sets wojna'); }
{ const r = applyDiplomaticEvent(rel(50, 30), 'wojna_wypowiedziana');
  eq(r.zaufanie, 30, 'wojna bez c.b. -20 Z'); eq(r.status, 'wojna', 'wojna_wypowiedziana sets wojna'); }
{ const r = applyDiplomaticEvent(rel(20, 30, 'wojna'), 'pokoj');
  eq(r.zaufanie, 25, 'pokoj +5 Z'); eq(r.status, 'pokoj', 'pokoj sets pokoj'); }
eq(applyDiplomaticEvent(rel(20, 30, 'pokoj'), 'handel').status, 'pokoj', 'handel preserves status');
eq(applyDiplomaticEvent(rel(98, 30), 'dar').zaufanie,            100, 'Zaufanie clamps at 100');
eq(applyDiplomaticEvent(rel(20, 95), 'przewaga_militarna').respekt, 100, 'Respekt clamps at 100');
eq(applyDiplomaticEvent(rel(20, 30), 'dar', { mnoznikPodarunku: 2 }).zaufanie, 32, 'dar x2 mnoznik = +12');
// NEW events
{ const r = applyDiplomaticEvent(rel(50, 30), 'wojna_casus_belli');
  eq(r.zaufanie, 40, 'wojna z casus belli -10 Z'); eq(r.status, 'wojna', 'wojna_casus_belli sets wojna'); }
eq(applyDiplomaticEvent(rel(20, 30), 'ultimatum_spelnione').zaufanie, 15, 'ultimatum spelnione -5 Z');
{ const r = applyDiplomaticEvent(rel(30, 40), 'ultimatum_bezpodstawne');
  eq(r.zaufanie, 20, 'ultimatum bezpodstawne -10 Z'); eq(r.respekt, 30, 'ultimatum bezpodstawne -10 R'); }
eq(applyDiplomaticEvent(rel(20, 30), 'trybut_odmowa').zaufanie,        10, 'trybut odmowa -10 Z');
eq(applyDiplomaticEvent(rel(20, 30), 'trybut_oferta_przyjeta').zaufanie, 25, 'trybut oferta przyjeta +5 Z');
eq(applyDiplomaticEvent(rel(20, 30), 'wymiana_tech_gratis').zaufanie,   25, 'wymiana tech gratis +5 Z');

// 4. initialRelation
{ const r = initialRelation(mkPlayer('a', TypCywilizacji.Grecy), mkPlayer('b', TypCywilizacji.Grecy));
  eq(r.zaufanie, 0, 'same type 20-20 = 0'); eq(r.respekt, 30, 'same type Respekt 30');
  eq(r.status, 'neutralni', 'initial status neutralni'); }
eq(initialRelation(mkPlayer('a', TypCywilizacji.Grecy), mkPlayer('b', TypCywilizacji.Rzymianie)).zaufanie, 15, 'diff main 20-5 = 15');
eq(initialRelation(mkPlayer('a', TypCywilizacji.Grecy), mkPlayer('b', TypCywilizacji.DrobnaCywilizacja)).zaufanie, 20, 'main vs minor no penalty = 20');

// 5. aiDiplomacyStance minor
{ const s = aiDiplomacyStance(mkPlayer('g', TypCywilizacji.Grecy), mkPlayer('o', TypCywilizacji.Rzymianie), rel(50, 20), ctx({ isMinorCiv: true }));
  eq(s.willingnessAlly, 0, 'minor: no alliances'); eq(s.willingnessTrade, 0.6, 'minor: trade open Relacja70>30');
  eq(s.willingnessWar, 0.05, 'minor: baseline war 0.05'); approx(s.willingnessPeace, 20 / 60, 'minor: peace respekt/60'); }
{ const s = aiDiplomacyStance(mkPlayer('m', TypCywilizacji.DrobnaCywilizacja), mkPlayer('o', TypCywilizacji.Grecy), rel(10, 80), ctx({ isMinorCiv: false }));
  eq(s.willingnessAlly, 0, 'minor by type: no alliances'); eq(s.willingnessPeace, 0.9, 'minor: high Respekt -> 0.9'); }

// 6. aiDiplomacyStance main
eq(aiDiplomacyStance(mkPlayer('g', TypCywilizacji.Grecy), mkPlayer('o', TypCywilizacji.Zulusi), rel(5, 10), ctx()).willingnessTrade, 0, 'main: trade 0 when Relacja15<30');
eq(aiDiplomacyStance(mkPlayer('g', TypCywilizacji.Grecy), mkPlayer('o', TypCywilizacji.Grecy), rel(50, 80), ctx()).willingnessAlly, 0, 'main: ally 0 when Zaufanie50<60');
{ const s = aiDiplomacyStance(mkPlayer('g', TypCywilizacji.Grecy), mkPlayer('o', TypCywilizacji.Grecy), rel(80, 50), ctx());
  assert(s.willingnessAlly > 0 && s.willingnessAlly <= 1, 'main: ally>0 when Zaufanie80 & Relacja130'); }
{ const low = rel(10, 50);
  const zul = aiDiplomacyStance(mkPlayer('z', TypCywilizacji.Zulusi), mkPlayer('o', TypCywilizacji.Grecy), low, ctx());
  const chi = aiDiplomacyStance(mkPlayer('c', TypCywilizacji.Chinczycy), mkPlayer('o', TypCywilizacji.Grecy), low, ctx());
  assert(zul.willingnessWar > chi.willingnessWar, 'Zulusi warlust > Chinczycy'); }
eq(aiDiplomacyStance(mkPlayer('z', TypCywilizacji.Zulusi), mkPlayer('o', TypCywilizacji.Grecy), rel(10, 50, 'wojna'), ctx({ turnsAtWar: 5 })).willingnessWar, 0, 'no new war while at war');
{ const sShort = aiDiplomacyStance(mkPlayer('r', TypCywilizacji.Rzymianie), mkPlayer('o', TypCywilizacji.Grecy), rel(20, 50, 'wojna'), ctx({ turnsAtWar: 0 }));
  const sLong  = aiDiplomacyStance(mkPlayer('r', TypCywilizacji.Rzymianie), mkPlayer('o', TypCywilizacji.Grecy), rel(20, 50, 'wojna'), ctx({ turnsAtWar: 20 }));
  assert(sLong.willingnessPeace > sShort.willingnessPeace, 'longer war -> more peace');
  eq(aiDiplomacyStance(mkPlayer('r', TypCywilizacji.Rzymianie), mkPlayer('o', TypCywilizacji.Grecy), rel(20, 30, 'pokoj'), ctx()).willingnessPeace, 0.8, 'baseline peace 0.8 when not at war'); }

// 7. toRelation
{ const r = toRelation(rdip(44, 22, StanWojny.Wojna));
  eq(r.status, 'wojna', 'StanWojny.Wojna -> wojna'); eq(r.zaufanie, 44, 'passes Zaufanie'); eq(r.respekt, 22, 'passes Respekt'); }
eq(toRelation(rdip(50, 50, StanWojny.CasusBelli)).status, 'wojna', 'CasusBelli -> wojna');
eq(toRelation(rdip(50, 50, StanWojny.Pokoj)).status,      'pokoj', 'Pokoj (no treaty) -> pokoj');
eq(toRelation(rdip(50, 50, StanWojny.Rozejm)).status,     'pokoj', 'Rozejm (no treaty) -> pokoj');
eq(toRelation(rdip(50, 50, StanWojny.Pokoj, [{ rodzaj: RodzajTraktatu.SojuszWojskowy, wygasaTura: null }])).status, 'sojusz', 'Pokoj + sojusz -> sojusz');
eq(toRelation(rdip(50, 50, 'inny')).status, 'neutralni', 'unknown stanWojny, no treaty -> neutralni');
eq(toRelation(rdip(50, 50, 'inny', [{ rodzaj: RodzajTraktatu.SojuszWojskowy, wygasaTura: null }])).status, 'sojusz', 'unknown stanWojny + sojusz -> sojusz');

console.log(`\n[diplomacy-test] ${passed} passed, ${failed} failed (total ${passed + failed}).`);
process.exit(failed === 0 ? 0 : 1);
