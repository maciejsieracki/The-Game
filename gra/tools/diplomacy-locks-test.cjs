'use strict';
/**
 * diplomacy-locks-test.cjs -- standalone Node test for src/game/diplomacy-locks.ts
 * and src/game/diplomacy-factors.ts (Makieta DYPLOMACJA v1.1, KROK 3 pkt 4+6 —
 * DYSPOZYCJA-WDROZENIE.md, 2026-07-23, FAZA 1).
 * Run from gra/:  node tools/diplomacy-locks-test.cjs
 *
 * Self-contained: bundles both modules (+ DIPLOMACY_PARAMS z diplomacy.ts jako
 * źródło progów realnych) z esbuild do tymczasowego CJS, wymaga i uruchamia
 * asercje. Pure logic only -- no DOM, no THREE.
 *
 * Covers:
 *   - progi z silnika (DIPLOMACY_PARAMS) -- nie z makiety (91 nie 90 itd.)
 *   - resolveDiplomacyActionLock per actionId: sojusz/handel/wymiana-tech/
 *     trybut(KRYTYCZNE fix)/wasalizacja/pakt/propozycja-pokoju/wypowiedzenie-wojny
 *   - format notki „zablokowana — wymaga X N (masz M)"
 *   - appendDiploFactor (pure, immutable, cap, pomija delta=0)
 *   - buildRelationBreakdown (ciągłe + jednorazowe, etykiety PL)
 *   - round-trip save: JSON.stringify/parse rejestru per-para przetrwa nietknięty
 */

const fs   = require('fs');
const path = require('path');

// --- esbuild ---------------------------------------------------------------
const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[diplomacy-locks-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE  = path.resolve(__dirname, '.dip-locks-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.dip-locks-bundle.cjs');

const SRC = process.env.DIP_SRC_DIR || path.resolve(__dirname, '..', 'src');
const ENTRY_TS = `
export { DIPLOMACY_PARAMS, getEffectiveDiplomacyParams } from ${JSON.stringify(SRC + '/game/diplomacy')};
export {
  resolveDiplomacyActionLock, formatLockedNote,
} from ${JSON.stringify(SRC + '/game/diplomacy-locks')};
export {
  appendDiploFactor, buildRelationBreakdown, DIPLO_FACTOR_LABELS_PL,
} from ${JSON.stringify(SRC + '/game/diplomacy-factors')};
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
  console.error('[diplomacy-locks-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const B = require(BUNDLE_FILE);
const {
  DIPLOMACY_PARAMS, getEffectiveDiplomacyParams,
  resolveDiplomacyActionLock, formatLockedNote,
  appendDiploFactor, buildRelationBreakdown, DIPLO_FACTOR_LABELS_PL,
} = B;

// --- tiny assertion framework ----------------------------------------------
let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('  FAIL:', msg); }
}
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }
function deepEq(a, b, msg) {
  assert(JSON.stringify(a) === JSON.stringify(b), `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`);
}

// ===========================================================================
// 1. Progi REALNE z silnika (getEffectiveDiplomacyParams @ normal) — NIE z makiety.
//    Makieta v1.1 pokazuje 90/70; silnik ma 91/70 -- używamy silnika (zlecenie).
// ===========================================================================
const dip = getEffectiveDiplomacyParams('normal');
eq(dip.progSojuszZaufanie, 91, 'silnik progSojuszZaufanie = 91 (makieta pokazuje 90 -- NIE używamy makiety)');
eq(dip.progWymianaTechZaufanie, 70, 'silnik progWymianaTechZaufanie = 70');
eq(dip.progWasalizacjaRespekt, 70, 'silnik progWasalizacjaRespekt = 70');
eq(dip.progTrybutZadanieMinRespekt, 70, 'silnik progTrybutZadanieMinRespekt = 70');
eq(dip.progSojuszRelacja, 151, 'silnik progSojuszRelacja = 151');
eq(DIPLOMACY_PARAMS.progSojuszZaufanie, 91, 'DIPLOMACY_PARAMS.progSojuszZaufanie = 91 (mirror diplomacy.json)');

// --- fixture helper: kontekst bazowy dla resolveDiplomacyActionLock ---------
function baseCtx(overrides = {}) {
  return Object.assign({
    contact: true,
    atWar: false,
    relTotal: 0,
    zaufanie: 0,
    respekt: 0,
    hasNap: false,
    hasHandel: false,
    hasSojusz: false,
    breaksTreatyLabel: undefined,
    sellableTechCount: 1,
    knownRivalsCount: 1,
    progNapRelacja: dip.progNapRelacja,
    progHandelRelacja: dip.progHandelRelacja,
    progSojuszRelacja: dip.progSojuszRelacja,
    progSojuszZaufanie: dip.progSojuszZaufanie,
    progGraniceRelacja: dip.progGraniceRelacja,
    progGraniceZaufanie: dip.progGraniceZaufanie,
    progWymianaTechZaufanie: dip.progWymianaTechZaufanie,
    progNamowWojneZaufanie: dip.progNamowWojneZaufanie,
    progWasalizacjaRespekt: dip.progWasalizacjaRespekt,
    progTrybutZadanieMinRespekt: dip.progTrybutZadanieMinRespekt,
    progDarRelacja: 100,
  }, overrides);
}

// ===========================================================================
// 2. formatLockedNote -- format makiety v1.1 dosłownie
// ===========================================================================
eq(
  formatLockedNote('Zaufania', 90, 34),
  'zablokowana — wymaga Zaufania 90 (masz 34)',
  'formatLockedNote — makieta CHANGELOG przykład dosłownie',
);
eq(
  formatLockedNote('Respektu', 70, 61),
  'zablokowana — wymaga Respektu 70 (masz 61)',
  'formatLockedNote — Respekt',
);

// ===========================================================================
// 3. resolveDiplomacyActionLock -- id '3' Sojusz wojskowy (Zaufanie 91 z silnika)
// ===========================================================================
{
  // Makieta CHANGELOG: Zaufanie 34 < 45 -> ZABLOKOWANY (przykład historyczny; silnik ma 91)
  const r = resolveDiplomacyActionLock(baseCtx({
    actionId: '3', relTotal: 200, zaufanie: 34,
  }));
  eq(r.locked, true, 'id3 Sojusz: locked gdy Zaufanie 34 < prog silnika 91');
  eq(r.requirement.kind, 'zaufanie', 'id3: requirement.kind = zaufanie');
  eq(r.requirement.prog, 91, 'id3: requirement.prog = 91 (SILNIK, nie makieta 90)');
  eq(r.requirement.masz, 34, 'id3: requirement.masz = 34');
  eq(r.note, 'zablokowana — wymaga Zaufania 91 (masz 34)', 'id3: note w formacie makiety z progiem silnika');
}
{
  // Zaufanie wystarczające, ale Relacja poniżej progSojuszRelacja(151) -> nadal locked (dual-gate)
  const r = resolveDiplomacyActionLock(baseCtx({ actionId: '3', relTotal: 100, zaufanie: 95 }));
  eq(r.locked, true, 'id3: dual-gate -- Zaufanie OK ale Relacja(100) < 151 wciąż blokuje');
  eq(r.requirement.kind, 'stan', 'id3: brakująca Relacja raportowana jako kind stan');
}
{
  const r = resolveDiplomacyActionLock(baseCtx({ actionId: '3', relTotal: 200, zaufanie: 95 }));
  eq(r.locked, false, 'id3: odblokowany gdy oba progi spełnione');
}
{
  const r = resolveDiplomacyActionLock(baseCtx({ actionId: '3', hasSojusz: true }));
  eq(r.locked, false, 'id3: już zawarty sojusz -> nie locked');
  eq(r.active, true, 'id3: active=true gdy hasSojusz');
}
{
  const r = resolveDiplomacyActionLock(baseCtx({ actionId: '3', atWar: true }));
  eq(r.locked, true, 'id3: locked w wojnie (nawet bez sprawdzania progów)');
}

// ===========================================================================
// 4. id '8' Żądanie/oferta trybutu -- KRYTYCZNE fix (silnik dotąd NIE gate'ował Respektu)
// ===========================================================================
{
  // Makieta CHANGELOG: Respekt 61 < prog 70 -> było klikalne, teraz ZABLOKOWANE.
  const r = resolveDiplomacyActionLock(baseCtx({ actionId: '8', respekt: 61 }));
  eq(r.locked, true, 'id8 Trybut: KRYTYCZNY fix -- locked gdy Respekt 61 < prog 70');
  eq(r.requirement.kind, 'respekt', 'id8: requirement.kind = respekt');
  eq(r.requirement.prog, 70, 'id8: requirement.prog = 70');
  eq(r.requirement.masz, 61, 'id8: requirement.masz = 61');
  eq(r.note, 'zablokowana — wymaga Respektu 70 (masz 61)', 'id8: note dosłownie z CHANGELOG makiety');
}
{
  const r = resolveDiplomacyActionLock(baseCtx({ actionId: '8', respekt: 75 }));
  eq(r.locked, false, 'id8: odblokowane gdy Respekt >= 70');
}
{
  // W wojnie: tylko oferta reparacji -- zawsze dostępne (nie blokujemy progiem Respektu)
  const r = resolveDiplomacyActionLock(baseCtx({ actionId: '8', atWar: true, respekt: 0 }));
  eq(r.locked, false, 'id8: w wojnie dostępna oferta reparacji niezależnie od Respektu');
}

// ===========================================================================
// 5. id '12' Wasalizacja -- Respekt 70, format identyczny jak makieta
// ===========================================================================
{
  const r = resolveDiplomacyActionLock(baseCtx({ actionId: '12', respekt: 61 }));
  eq(r.locked, true, 'id12 Wasalizacja: locked gdy Respekt 61 < 70 (przykład makiety)');
  eq(r.note, 'zablokowana — wymaga Respektu 70 (masz 61)', 'id12: note identyczna z makietą');
}

// ===========================================================================
// 5b. id '15' Wchłonięcie MP (R-GRACZ-WCHLONIECIE)
// ===========================================================================
{
  const r = resolveDiplomacyActionLock(baseCtx({ actionId: '15', isCityStatePartner: false }));
  eq(r.locked, true, 'id15: locked gdy partner nie jest MP');
}
{
  const r = resolveDiplomacyActionLock(baseCtx({
    actionId: '15', isCityStatePartner: true, hasWasal: false, respekt: 95,
  }));
  eq(r.locked, true, 'id15: locked bez wasalu');
}
{
  const r = resolveDiplomacyActionLock(baseCtx({
    actionId: '15', isCityStatePartner: true, hasWasal: true, wasalAgeTurns: 10,
    respekt: 95, graczWchlonieciePoWasaluTur: 10,
  }));
  eq(r.locked, false, 'id15: unlocked CS + wasal 10t + respekt 95');
}

// ===========================================================================
// 6. id '5' Umowa handlowa -- "już zawarta" (KRYTYCZNE: silnik dotąd tego nie sprawdzał)
// ===========================================================================
{
  const r = resolveDiplomacyActionLock(baseCtx({ actionId: '5', hasHandel: true }));
  eq(r.locked, false, 'id5: aktywna umowa handlowa -> nie locked');
  eq(r.active, true, 'id5: active=true gdy hasHandel (fix makiety v1.1)');
  eq(r.note, 'już zawarta', 'id5: note "już zawarta" (forma żeńska -- Umowa)');
}
{
  // R-PROGI-MARTWE-CLEANUP: progHandelRelacja obniżony do 0 pkt Relacji deployem Maciej
  // 2026-07-26 (commit 579dec8, "Maciej 2026-07-26: 0 = od neutralnej") i utwierdzony
  // 2026-08-03 (commit d7e8fa1, docs/decyzje/R-PROGI-MARTWE-CLEANUP-2026-08-03.md) --
  // gra/src/game/diplomacy.ts:432 dokumentuje to jako celowe: prog Relacji dla handlu
  // trzymany poza skalą trudności, stały z JSON = 0. relacjaGate(prog=0, masz) blokuje
  // tylko gdy masz < 0 pkt Relacji, co nie występuje w realnym zakresie Relacji (0-200 pkt).
  // Case '5' (Traktat handlowy) NIE jest już dziś nigdy blokowany samym progiem Relacji,
  // niezależnie od relTotal -- handel wymaga tylko braku wojny/istniejącej umowy (+ osobno
  // willingnessTrade w diplomacy-proposals.ts, poza zakresem resolveDiplomacyActionLock).
  const r = resolveDiplomacyActionLock(baseCtx({ actionId: '5', relTotal: 0 }));
  eq(r.locked, false, 'id5: NIE locked przy relTotal=0 -- prog Relacji handlu = 0, martwy prog usunięty (Maciej 2026-07-26 / R-PROGI-MARTWE-CLEANUP-2026-08-03)');
}

// ===========================================================================
// 7. id '2' Pakt o nieagresji -- "już zawarty"
// ===========================================================================
{
  const r = resolveDiplomacyActionLock(baseCtx({ actionId: '2', hasNap: true }));
  eq(r.active, true, 'id2: active=true gdy hasNap');
  eq(r.note, 'już zawarty', 'id2: note "już zawarty"');
}

// ===========================================================================
// 8. id '6' Wymiana technologii -- dual-gate + brak technologii do wymiany
// ===========================================================================
{
  const r = resolveDiplomacyActionLock(baseCtx({ actionId: '6', relTotal: 200, zaufanie: 34 }));
  eq(r.locked, true, 'id6: locked gdy Zaufanie(34) < prog(70)');
  eq(r.requirement.prog, 70, 'id6: prog Zaufania = progWymianaTechZaufanie (70)');
}
{
  const r = resolveDiplomacyActionLock(baseCtx({
    actionId: '6', relTotal: 200, zaufanie: 95, sellableTechCount: 0,
  }));
  eq(r.locked, true, 'id6: progi spełnione ale brak technologii do wymiany -> locked');
}
{
  const r = resolveDiplomacyActionLock(baseCtx({ actionId: '6', relTotal: 200, zaufanie: 95, sellableTechCount: 3 }));
  eq(r.locked, false, 'id6: odblokowana gdy progi + technologie dostępne');
}

// ===========================================================================
// 9. id '10' Propozycja pokoju -- niedostępna gdy nie trwa wojna (rewording makiety)
// ===========================================================================
{
  const r = resolveDiplomacyActionLock(baseCtx({ actionId: '10', atWar: false }));
  eq(r.locked, true, 'id10: locked gdy nie trwa wojna');
  eq(r.note, 'niedostępna — nie trwa wojna', 'id10: note dosłownie z makiety');
}
{
  const r = resolveDiplomacyActionLock(baseCtx({ actionId: '10', atWar: true }));
  eq(r.locked, false, 'id10: odblokowana w trakcie wojny');
}

// ===========================================================================
// 10. id '11' Wypowiedzenie wojny -- nota "zrywa [traktat]"
// ===========================================================================
{
  const r = resolveDiplomacyActionLock(baseCtx({ actionId: '11', breaksTreatyLabel: 'Pakt nieagresji' }));
  eq(r.locked, false, 'id11: nie locked (poza stanem wojny)');
  eq(r.note, 'zrywa Pakt nieagresji', 'id11: note informacyjna "zrywa X"');
}
{
  const r = resolveDiplomacyActionLock(baseCtx({ actionId: '11', atWar: true }));
  eq(r.locked, true, 'id11: locked gdy już w stanie wojny');
}
{
  const r = resolveDiplomacyActionLock(baseCtx({ actionId: '11' }));
  eq(r.note, '', 'id11: brak traktatu do zerwania -> pusta nota');
}

// ===========================================================================
// 11. appendDiploFactor -- pure, immutable, cap, pomija delta=0
// ===========================================================================
{
  const log0 = [];
  const log1 = appendDiploFactor(log0, { eventKey: 'dar_pn', delta: 6, tura: 5 });
  eq(log0.length, 0, 'appendDiploFactor nie mutuje wejścia');
  eq(log1.length, 1, 'appendDiploFactor dopisuje wpis');
  deepEq(log1[0], { eventKey: 'dar_pn', delta: 6, tura: 5 }, 'appendDiploFactor wpis dokładny');

  const log2 = appendDiploFactor(log1, { eventKey: 'handel', delta: 0, tura: 6 });
  eq(log2.length, 1, 'appendDiploFactor pomija delta=0 (no-op)');
  eq(log2, log1, 'appendDiploFactor zwraca TĘ SAMĄ referencję gdy no-op');
}
{
  // cap: maxLen=3
  let log = [];
  for (let i = 0; i < 5; i++) {
    log = appendDiploFactor(log, { eventKey: 'zlamana_obietnica', delta: -1, tura: i }, 3);
  }
  eq(log.length, 3, 'appendDiploFactor respektuje cap maxLen');
  eq(log[0].tura, 2, 'appendDiploFactor cap trzyma NAJNOWSZE wpisy (obcina najstarsze)');
  eq(log[2].tura, 4, 'appendDiploFactor ostatni wpis to najnowszy');
}

// ===========================================================================
// 12. buildRelationBreakdown -- czynniki ciągłe + jednorazowe, etykiety PL
// ===========================================================================
{
  const log = appendDiploFactor([], { eventKey: 'dar_pn', delta: 6, tura: 3 });
  const breakdown = buildRelationBreakdown(
    log,
    { aktywnyHandel: true, pokojTrustTier: 'nap', rywalizacjaTenSamTyp: true },
    DIPLOMACY_PARAMS,
  );
  const posLabels = breakdown.pozytywne.map(r => r.label);
  assert(posLabels.includes('Aktywny handel'), 'breakdown: Aktywny handel obecny w pozytywnych');
  assert(posLabels.includes('Trwający pakt o nieagresji'), 'breakdown: pakt NAP obecny (tier=nap)');
  assert(posLabels.includes(DIPLO_FACTOR_LABELS_PL.dar_pn), 'breakdown: etykieta daru z rejestru');
  const negLabels = breakdown.negatywne.map(r => r.label);
  assert(negLabels.includes('Rywalizacja (ten sam typ nacji)'), 'breakdown: rywalizacja w negatywnych');
  const handelRow = breakdown.pozytywne.find(r => r.label === 'Aktywny handel');
  eq(handelRow.perTurn, true, 'breakdown: Aktywny handel oznaczony perTurn');
  eq(handelRow.value, DIPLOMACY_PARAMS.handel_zaufanie_perTura, 'breakdown: wartość Aktywny handel z DIPLOMACY_PARAMS (nie makiety)');
  const rywalRow = breakdown.negatywne.find(r => r.label === 'Rywalizacja (ten sam typ nacji)');
  eq(rywalRow.perTurn, undefined, 'breakdown: rywalizacja NIE jest perTurn (fakt jednorazowy pary)');
  eq(rywalRow.value, DIPLOMACY_PARAMS.rywalizacjaTenSamTyp_zaufanie, 'breakdown: wartość rywalizacji z DIPLOMACY_PARAMS');
}
{
  // najnowsze zdarzenie z logu pierwsze
  let log = appendDiploFactor([], { eventKey: 'dar_pn', delta: 6, tura: 1 });
  log = appendDiploFactor(log, { eventKey: 'zlamana_obietnica_ai', delta: -20, tura: 2 });
  const breakdown = buildRelationBreakdown(log, {}, DIPLOMACY_PARAMS);
  eq(breakdown.negatywne[0].label, DIPLO_FACTOR_LABELS_PL.zlamana_obietnica_ai, 'breakdown: najnowszy jednorazowy wpis pierwszy (negatywne)');
}

// ===========================================================================
// 13. SAVE round-trip -- rejestr per-para przetrwa JSON.stringify/parse (main.ts
//     zapisuje jako Array.from(map.entries()) w meta.diplomacyFactorLog, jak
//     istniejący diplomacyPairMeta -- patrz main.ts).
// ===========================================================================
{
  let log = appendDiploFactor([], { eventKey: 'dar_pn', delta: 6, tura: 3 });
  log = appendDiploFactor(log, { eventKey: 'wojna_wypowiedziana', delta: -20, tura: 7 });
  const registry = new Map([['0_1', log]]);

  // Symuluje main.ts: meta.diplomacyFactorLog = Array.from(diplomacyFactorLog.entries())
  const savedMeta = { diplomacyFactorLog: Array.from(registry.entries()) };
  const roundTripped = JSON.parse(JSON.stringify(savedMeta));

  const restored = new Map();
  for (const [key, l] of roundTripped.diplomacyFactorLog) restored.set(key, l);

  deepEq(restored.get('0_1'), log, 'save round-trip: rejestr pary identyczny po JSON round-trip');
  const breakdown = buildRelationBreakdown(restored.get('0_1'), {}, DIPLOMACY_PARAMS);
  eq(breakdown.pozytywne.length, 1, 'save round-trip: breakdown z odtworzonego logu -- 1 pozytywny');
  eq(breakdown.negatywne.length, 1, 'save round-trip: breakdown z odtworzonego logu -- 1 negatywny');
}
{
  // Stary save BEZ pola diplomacyFactorLog -- main.ts: savedFactorLog?.length -> pusty rejestr, bez crasha.
  const oldSaveMeta = { diplomacyPairMeta: [] }; // pole diplomacyFactorLog nieobecne
  const savedFactorLog = oldSaveMeta.diplomacyFactorLog;
  assert(savedFactorLog === undefined, 'stary save: pole nieobecne = undefined (nie crash)');
  const registry = new Map();
  if (savedFactorLog && savedFactorLog.length) {
    for (const [key, l] of savedFactorLog) registry.set(key, l);
  }
  eq(registry.size, 0, 'stary save: rejestr pozostaje pusty, bez wyjątku');
}

// ===========================================================================
console.log(`\n[diplomacy-locks-test] ${passed} passed, ${failed} failed (total ${passed + failed}).`);
process.exit(failed > 0 ? 1 : 0);
