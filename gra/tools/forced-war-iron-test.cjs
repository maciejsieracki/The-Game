'use strict';

/**
 * R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1 — test czystego kontraktu Żelaza (trzecia epoka).
 * Wzorowany 1:1 na `forced-war-stone-test.cjs`/`forced-war-bronze-test.cjs`.
 * Uruchamianie z gra/: node tools/forced-war-iron-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const entry = path.resolve(__dirname, '.forced-war-iron-entry.ts');
const bundle = path.resolve(__dirname, '.forced-war-iron-bundle.cjs');
fs.writeFileSync(entry, `
export {
  EPOKA_ZELAZO_NUMER,
  WOJNA_ZELAZO_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE,
  WOJNA_ZELAZO_WYMUSZONA_ODPOCZYNEK_TUR,
  WOJNA_ZELAZO_WYMUSZONA_COOLDOWN_TA_SAMA_CYWILIZACJA_TUR,
  isEligibleForIronForcedWar,
  isIronEraEntry,
  pickIronForcedWarTargetId,
  shouldEndIronForcedWarByCityCount,
  isRestingFromIronForcedWar,
  serializeIronForcedWarState,
  restoreIronForcedWarState,
} from ${JSON.stringify(GRA_ROOT + '/src/game/forced-war-iron')};
export { decideAIDiplomacy } from ${JSON.stringify(GRA_ROOT + '/src/game/ai')};
`, 'utf8');

/**
 * Etykiety wszystkich asercji (bez sufiksu „(got …, want …)") — potrzebne sondzie
 * mutacyjnej `forced-war-iron-mutant-probe.cjs` do policzenia POKRYCIA: która asercja
 * czerwieni się pod którą mutacją źródła. Lista drukowana WYŁĄCZNIE pod
 * FORCED_WAR_IRON_LIST_ASSERTS=1, żeby nie zaśmiecać normalnego wyjścia bramki.
 */
const assertLabels = [];
function labelOf(message) {
  return String(message).replace(/ \(got [\s\S]*$/, '');
}
let passed = 0;
let failed = 0;
function assert(condition, message) {
  assertLabels.push(labelOf(message));
  if (condition) passed++;
  else {
    failed++;
    console.error(`FAIL: ${labelOf(message)}`);
  }
}
function eq(actual, expected, message) {
  assert(actual === expected, `${message} (got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)})`);
}
function deepEq(actual, expected, message) {
  assert(JSON.stringify(actual) === JSON.stringify(expected), message);
}

try {
  esbuild.buildSync({
    entryPoints: [entry],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: bundle,
    absWorkingDir: GRA_ROOT,
    logLevel: 'silent',
  });
  const api = require(bundle);
  const {
    EPOKA_ZELAZO_NUMER: ironEra,
    WOJNA_ZELAZO_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE: cityLimit,
    WOJNA_ZELAZO_WYMUSZONA_ODPOCZYNEK_TUR: restTurns,
    WOJNA_ZELAZO_WYMUSZONA_COOLDOWN_TA_SAMA_CYWILIZACJA_TUR: cooldownTurns,
    isEligibleForIronForcedWar,
    isIronEraEntry,
    pickIronForcedWarTargetId,
    shouldEndIronForcedWarByCityCount,
    isRestingFromIronForcedWar,
    serializeIronForcedWarState,
    restoreIronForcedWarState,
    decideAIDiplomacy,
  } = api;

  console.log('--- kontrakt parametrów (dispatch §PARAMETR: wartości jak Brąz/Kamień) ---');
  eq(ironEra, 3, 'Żelazo to epoka numer 3 (KOLEJNOSC_EPOK = Kamien/Braz/Zelazo)');
  eq(cityLimit, 2, 'pokój po 2 miastach');
  eq(restTurns, 20, 'odpoczynek 20 tur');
  eq(cooldownTurns, 20, 'cooldown tej samej cywilizacji 20 tur');

  console.log('--- wyzwalacz = AWANS do Żelaza, nie próg tury ---');
  assert(isIronEraEntry(2, 3), 'awans Brąz(2) → Żelazo(3) wyzwala mechanizm');
  assert(isIronEraEntry(1, 3), 'skok Kamień(1) → Żelazo(3) w jednej synchronizacji też wyzwala');
  assert(!isIronEraEntry(1, 2), 'awans Kamień → Brąz NIE wyzwala Żelaza');
  assert(!isIronEraEntry(3, 3), 'brak zmiany epoki (już w Żelazie) NIE wyzwala ponownie');
  assert(!isIronEraEntry(3, 4), 'awans z Żelaza dalej NIE wyzwala ponownie');
  assert(!isIronEraEntry(2, 2), 'brak zmiany epoki w Brązie nie wyzwala');

  console.log('--- guardy ownera (napastnik) ---');
  const eligibility = (overrides = {}) => isEligibleForIronForcedWar({
    isMainAiCiv: true,
    isAlreadyAtWarAnyRole: false,
    ...overrides,
  });
  assert(eligibility(), 'główna cywilizacja AI poza wojną jest kwalifikowana');
  assert(!eligibility({ isMainAiCiv: false }), 'brak dla gracza/miasta-państwa/barbarzyńcy');
  assert(!eligibility({ isAlreadyAtWarAnyRole: true }), 'brak dla ownera już w wojnie (dowolna rola)');

  console.log('--- wybór celu: najbliższy terytorialnie + wykluczenia ---');
  const distance = (aq, ar, bq, br) => (
    Math.abs(aq - bq) + Math.abs(aq - bq + ar - br) + Math.abs(ar - br)
  ) / 2;
  const candidates = [
    { ownerId: 3, q: 8, r: 8 },
    { ownerId: 4, q: 1, r: 1 },
    { ownerId: 5, q: 2, r: 2 },
  ];
  eq(
    pickIronForcedWarTargetId(candidates, { q: 0, r: 0 }, distance),
    4,
    'wybiera najbliższego sąsiada terytorialnego',
  );
  eq(
    pickIronForcedWarTargetId(
      candidates,
      { q: 0, r: 0 },
      distance,
      { blockedOwnerIds: new Set([4]) },
    ),
    5,
    'NAP/blokada pokoju/sojusz z celem wyklucza najbliższego',
  );
  eq(
    pickIronForcedWarTargetId(
      [{ ownerId: 8, q: 1, r: 1 }, { ownerId: 2, q: 1, r: 1 }],
      { q: 0, r: 0 },
      distance,
    ),
    2,
    'remis dystansu rozstrzyga niższy ownerId (determinizm)',
  );
  eq(
    pickIronForcedWarTargetId(
      candidates,
      { q: 0, r: 0 },
      distance,
      { blockedOwnerIds: new Set([3, 4, 5]) },
    ),
    null,
    'wszyscy kandydaci zablokowani → brak celu (null), nie wyjątek',
  );
  eq(
    pickIronForcedWarTargetId([], { q: 0, r: 0 }, distance),
    null,
    'pusta pula kandydatów → null',
  );

  console.log('--- czysta funkcja pickera nie dokłada celów spoza podanej puli (filtr puli żyje w main.ts) ---');
  // main.ts buduje pulę z `oid >= 0` (gracz oid 0 JEST w puli od tej naprawy) i wyklucza
  // wyłącznie miasta-państwa; tu pinujemy kontrakt czystej funkcji: nie dokłada NICZEGO spoza podanej puli.
  eq(
    pickIronForcedWarTargetId([{ ownerId: 6, q: 5, r: 5 }], { q: 0, r: 0 }, distance),
    6,
    'zwraca wyłącznie ownerId z podanej puli (nigdy 0/gracza ani miasta-państwa spoza puli)',
  );

  console.log('--- 2 miasta, odpoczynek i cooldown ---');
  assert(!shouldEndIronForcedWarByCityCount(1, 1), '1 zdobyte i 1 utracone nie kończy wojny');
  assert(shouldEndIronForcedWarByCityCount(2, 0), '2 zdobyte kończą wojnę pokojem');
  assert(shouldEndIronForcedWarByCityCount(0, 2), '2 utracone kończą wojnę pokojem');
  assert(isRestingFromIronForcedWar(100, 120), 'odpoczynek działa przed restUntil');
  assert(!isRestingFromIronForcedWar(120, 120), 'odpoczynek kończy się na restUntil');
  assert(!isRestingFromIronForcedWar(100, undefined), 'brak wpisu restUntil = brak odpoczynku');

  console.log('--- decideAIDiplomacy: wymuszona wojna Żelaza POZA ogólnymi regułami ---');
  const rel = {
    partnerId: '7',
    relation: { status: 'neutralny', zaufanie: 0, respekt: 50 },
    respektWzgledny: 0.5,
    stanWojny: false,
  };
  const ironCommand = (extra = {}) => decideAIDiplomacy({
    myPlayerId: '1',
    relacje: [{ ...rel, ...extra }],
    // agresja 0.1 = pacyfista: ogólne reguły wojny NIE wyprodukowałyby DOW.
    agresja: 0.1,
    currentTurn: 80,
    ironForceWarTargetId: 7,
  });
  const ironCmds = ironCommand();
  assert(ironCmds.some(c => c.type === 'wypowiedz_wojne'), 'cel Żelaza generuje DOW mimo agresji 0.1');
  assert(
    ironCmds.some(c => c.type === 'wypowiedz_wojne' && /ZELAZO-WYMUSZONA-WOJNA/.test(c.powod)),
    'powód DOW identyfikuje mechanizm Żelaza',
  );
  assert(
    !decideAIDiplomacy({
      myPlayerId: '1', relacje: [{ ...rel }], agresja: 0.1, currentTurn: 80,
    }).some(c => c.type === 'wypowiedz_wojne'),
    'BEZ ironForceWarTargetId ta sama relacja NIE daje DOW (dowód, że to mechanizm, nie ogólna reguła)',
  );
  assert(!ironCommand({ stanWojny: true }).some(c => c.type === 'wypowiedz_wojne'), 'target już w wojnie blokuje DOW');
  assert(!ironCommand({ peaceLocked: true }).some(c => c.type === 'wypowiedz_wojne'), 'peace lock (w tym cooldown pary) blokuje DOW');
  assert(!ironCommand({ hasNapTreaty: true }).some(c => c.type === 'wypowiedz_wojne'), 'NAP blokuje DOW');
  assert(!ironCommand({ hasAllianceTreaty: true }).some(c => c.type === 'wypowiedz_wojne'), 'sojusz z celem blokuje DOW');

  console.log('--- ironForceWarTargetId bez pasującej relacji (żaden target, w tym gracz) ---');
  // P-WOJNA-WYMUSZONA-TRZY-NAPRAWY-Q1 (c) (2026-08-30): od tej decyzji main.ts MOŻE
  // ustawić ironForceWarTargetId = 0 (gracz jest teraz w puli kandydatów na równi z AI —
  // main.ts `[0, ...aiOwnerList]` + `oid >= 0`). Ten test pinuje coś innego, nadal
  // prawdziwego bez zmian: `decideAIDiplomacy` samo w sobie wymaga relacji z partnerem
  // o pasującym id (main.ts buduje ją zawsze, gdy AI ma z tym ownerem realny kontakt) —
  // brak dopasowanej relacji nie produkuje DOW, niezależnie od tego, czy targetem jest
  // gracz czy inna AI.
  const noPlayerRel = decideAIDiplomacy({
    myPlayerId: '1',
    relacje: [{ ...rel }],
    agresja: 0.1,
    currentTurn: 80,
    ironForceWarTargetId: 0,
  });
  assert(
    !noPlayerRel.some(c => c.type === 'wypowiedz_wojne' && c.targetId === '0'),
    'ironForceWarTargetId=0 nie produkuje DOW wobec gracza',
  );

  console.log('--- rozdzielność od Kamienia i Brązu (osobne pola wejścia) ---');
  assert(
    decideAIDiplomacy({
      myPlayerId: '1', relacje: [{ ...rel }], agresja: 0.1, currentTurn: 80,
      bronzeForceWarTargetId: 7,
    }).some(c => c.type === 'wypowiedz_wojne' && /BRAZU/.test(c.powod)),
    'pole Brązu nadal działa niezależnie (bez regresji)',
  );
  assert(
    decideAIDiplomacy({
      myPlayerId: '1', relacje: [{ ...rel }], agresja: 0.1, currentTurn: 80,
      stoneForceWarTargetId: 7,
    }).some(c => c.type === 'wypowiedz_wojne' && /KAMIEN/.test(c.powod)),
    'pole Kamienia nadal działa niezależnie (bez regresji)',
  );

  console.log('--- save/load i mutacje stanu ---');
  const pending = new Set([2]);
  const cycle = new Set([2]);
  const restUntil = new Map([[2, 95]]);
  const active = new Map([
    ['2_7', { attackerId: 2, targetId: 7, capturedByAttacker: 1, capturedByDefender: 0 }],
  ]);
  const save = JSON.parse(JSON.stringify(
    serializeIronForcedWarState(pending, cycle, restUntil, active),
  ));
  const loaded = restoreIronForcedWarState(save);
  deepEq([...loaded.pendingOwners], [2], 'pending przetrwał save/load');
  deepEq([...loaded.cycleOwners], [2], 'cycle przetrwał save/load');
  deepEq([...loaded.restUntilByOwner.entries()], [[2, 95]], 'restUntil przetrwał save/load');
  deepEq(
    loaded.activeByPairKey.get('2_7'),
    { attackerId: 2, targetId: 7, capturedByAttacker: 1, capturedByDefender: 0 },
    'licznik aktywnej wojny przetrwał save/load (niezerowy)',
  );
  loaded.activeByPairKey.get('2_7').capturedByAttacker++;
  loaded.pendingOwners.delete(2);
  loaded.restUntilByOwner.set(2, 115);
  assert(loaded.activeByPairKey.get('2_7').capturedByAttacker === 2, 'mutacja licznika działa');
  assert(!loaded.pendingOwners.has(2), 'mutacja pending działa');
  eq(loaded.restUntilByOwner.get(2), 115, 'mutacja odpoczynku działa');
  const oldSave = restoreIronForcedWarState(undefined);
  eq(oldSave.pendingOwners.size, 0, 'stary save bez pól Żelaza jest bezpieczny (pusty stan)');
  eq(oldSave.activeByPairKey.size, 0, 'stary save: brak aktywnych par Żelaza');
  const partialSave = restoreIronForcedWarState({ cycleOwners: [5] });
  eq(partialSave.cycleOwners.size, 1, 'częściowy zapis: obecne pole wczytane');
  eq(partialSave.pendingOwners.size, 0, 'częściowy zapis: brakujące pole → pusty stan, nie wyjątek');

  if (process.env.FORCED_WAR_IRON_LIST_ASSERTS === '1') {
    for (const l of assertLabels) console.log('ASSERT-LABEL: ' + l);
  }
  console.log(`PASSED: ${passed} / FAILED: ${failed} / TOTAL: ${passed + failed}`);
  if (failed > 0) process.exitCode = 1;
} finally {
  for (const file of [entry, bundle]) {
    try { fs.unlinkSync(file); } catch {}
  }
}
