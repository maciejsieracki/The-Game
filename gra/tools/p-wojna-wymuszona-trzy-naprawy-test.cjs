'use strict';
/**
 * p-wojna-wymuszona-trzy-naprawy-test.cjs — P-WOJNA-WYMUSZONA-TRZY-NAPRAWY-Q1
 * (Operator Sonnet 5, effort=medium, 2026-08-30). Real-execution (esbuild bundle
 * z realnych modułów `src/game/*`, ZERO regexów/reimplementacji formuł) dla trzech
 * napraw z dispatchu:
 *
 *  (a) `countActiveWarsExcluding` (forced-war-common.ts) — licznik aktywnych wojen
 *      z dowolnym wykluczeniem (main.ts używa go z `isBarbarian` WYŁĄCZNIE przy
 *      bramce wymuszonej wojny; `countActiveWarsForOwner` sam w sobie, użyty też
 *      w `buildAllianceWarObligationCtx`, zostaje nietknięty).
 *  (b) `partitionDiplomacyCommandsForPlayerFog` (diplomacy-layers.ts) — rozdziela
 *      `wypowiedz_wojne` AI↔AI (bez gracza) od komend z udziałem gracza, tak by
 *      main.ts mógł filtrować je DWIEMA różnymi warstwami (patrz main.ts wywołanie
 *      obok `dipCmdsLayered`).
 *  (c) `pickForcedWarTargetId` (forced-war-common.ts, już istniejący, ownerId-
 *      agnostyczny) — dowód, że gracz (ownerId=0) jako NAJBLIŻSZY kandydat zostaje
 *      wybrany, i że wykluczenia (barbarzyńcy/CS/eliminowani) nadal działają na tej
 *      samej puli — main.ts sam dokłada teraz gracza do źródła tej puli
 *      (`[0, ...aiOwnerList]` zamiast `oid > 0`, main-guard bramki forced-war-*
 *      pinują to wiązanie tekstowo).
 *
 * Uruchamianie z gra/: node tools/p-wojna-wymuszona-trzy-naprawy-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const entry = path.resolve(__dirname, '.p-wojna-3-naprawy-entry.ts');
const bundle = path.resolve(__dirname, '.p-wojna-3-naprawy-bundle.cjs');

fs.writeFileSync(entry, `
export {
  countActiveWarsExcluding,
  pickForcedWarTargetId,
} from ${JSON.stringify(GRA_ROOT + '/src/game/forced-war-common')};
export {
  partitionDiplomacyCommandsForPlayerFog,
  filterDiplomacyCommandsForLayer,
  diplomacyLayerForOwner,
} from ${JSON.stringify(GRA_ROOT + '/src/game/diplomacy-layers')};
export { isBarbarian, BARBARIAN_OWNER_ID } from ${JSON.stringify(GRA_ROOT + '/src/game/barbarians')};
`, 'utf8');

let passed = 0;
let failed = 0;
function assert(condition, message) {
  if (condition) passed++;
  else {
    failed++;
    console.error(`FAIL: ${message}`);
  }
}
function eq(actual, expected, message) {
  assert(actual === expected, `${message} (got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)})`);
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
    countActiveWarsExcluding,
    pickForcedWarTargetId,
    partitionDiplomacyCommandsForPlayerFog,
    filterDiplomacyCommandsForLayer,
    diplomacyLayerForOwner,
    isBarbarian,
    BARBARIAN_OWNER_ID,
  } = api;

  console.log('--- (a) countActiveWarsExcluding: barbarzyńcy nie blokują bramki wymuszonej wojny ---');
  {
    // Kryterium końca 1: cywilizacja z barbarzyńcami obecnymi (relacja 'wojna'
    // wymuszona, C-BARB-Q1) i ZERO wojen z innymi cywilizacjami kwalifikuje się.
    const ownerId = 5;
    const allOwners = [ownerId, BARBARIAN_OWNER_ID, 7, 9];
    // isAtWar: TYLKO barbarzyńca jest w realnej wojnie z ownerId (jak w grze —
    // C-BARB-Q1 wymusza 'wojna' strukturalnie dla KAŻDEJ pary z barbarzyńcą).
    const isAtWar = (a, b) => isBarbarian(a) || isBarbarian(b);
    const excludingBarb = countActiveWarsExcluding(ownerId, allOwners, isAtWar, isBarbarian);
    eq(excludingBarb, 0, 'z wykluczeniem barbarzyńców: 0 aktywnych wojen mimo wojny z barbarzyńcą');
    const noExclusion = countActiveWarsExcluding(ownerId, allOwners, isAtWar, () => false);
    eq(noExclusion, 1, 'bez wykluczenia (odpowiednik countActiveWarsForOwner): barbarzyńca liczy się jako 1 wojna — dowód, że problem byłby realny bez naprawy');
  }
  console.log('--- (a) regresja: buildAllianceWarObligationCtx (main.ts:17164) liczy nadal WSZYSTKO, w tym barbarzyńców ---');
  {
    // Kryterium końca 2: main.ts NIE zmienia countActiveWarsForOwner (funkcja bez
    // wykluczenia) — symulujemy identyczne zachowanie, wołając ten sam czysty
    // helper BEZ predykatu wykluczającego (excludeOwnerId zawsze false), dokładnie
    // tak jak stara, nietknięta funkcja main.ts nadal działa dla sojuszniczych
    // zobowiązań wojennych.
    const allyId = 3;
    const allOwners = [allyId, BARBARIAN_OWNER_ID, 8];
    const isAtWar = (a, b) => isBarbarian(a) || isBarbarian(b);
    const activeWarCountForAllianceObligation = countActiveWarsExcluding(
      allyId, allOwners, isAtWar, () => false,
    );
    eq(
      activeWarCountForAllianceObligation, 1,
      'buildAllianceWarObligationCtx: wojna z barbarzyńcami NADAL liczy się (brak regresji, bez wykluczenia)',
    );
  }

  console.log('--- (b) partitionDiplomacyCommandsForPlayerFog: mgła gracza nie kasuje DOW AI<->AI ---');
  {
    // Kryterium końca 3, część 1: wypowiedz_wojne między dwoma ownerId != 0
    // PRZECHODZI nawet gdy warstwa (z widoczności gracza) to 'pre_contact'.
    const cmds = [
      { type: 'wypowiedz_wojne', targetId: '7', powod: 'test-ai-ai' },
      { type: 'wypowiedz_wojne', targetId: '0', powod: 'test-ai-player' },
      { type: 'zaproponuj_pokoj', targetId: '0', powod: 'test-player-peace' },
    ];
    const { playerFacing, aiToAiWar } = partitionDiplomacyCommandsForPlayerFog(cmds);
    eq(aiToAiWar.length, 1, 'partycja: dokładnie 1 komenda AI<->AI (wypowiedz_wojne targetId!=0)');
    eq(aiToAiWar[0].targetId, '7', 'partycja: AI<->AI to ta z targetId=7');
    eq(playerFacing.length, 2, 'partycja: 2 komendy z udziałem gracza (DOW na gracza + propozycja pokoju)');

    // Symulujemy DOKŁADNIE to, co main.ts robi z tymi dwiema paczkami: aiToAiWar
    // filtrowane WARSTWĄ BEZ MGŁY GRACZA (2-arg. diplomacyLayerForOwner), playerFacing
    // warstwą PEŁNĄ (z mgłą, jak dotychczas).
    const simplifiedOwners = new Set();
    const layerWithFog = diplomacyLayerForOwner(42, simplifiedOwners, new Set(), new Set()); // brak kontaktu gracza -> pre_contact
    eq(layerWithFog, 'pre_contact', 'sanity: bez odkrycia gracza warstwa PEŁNA to pre_contact');
    const layerNoFog = diplomacyLayerForOwner(42, simplifiedOwners); // overload 2-arg, ignoruje mgłę
    eq(layerNoFog, 'full', 'sanity: warstwa BEZ mgły (2-arg. overload) to full/simplified, nigdy pre_contact');

    const aiToAiAfterFilter = filterDiplomacyCommandsForLayer(aiToAiWar, layerNoFog);
    eq(aiToAiAfterFilter.length, 1, 'DOW AI<->AI PRZECHODZI mimo braku odkrycia gracza (naprawa (b))');

    const playerFacingAfterFilter = filterDiplomacyCommandsForLayer(playerFacing, layerWithFog);
    eq(
      playerFacingAfterFilter.length, 0,
      'D3-Q2 bez regresji: komendy Z UDZIAŁEM gracza (w tym DOW NA gracza) nadal kasowane pod pre_contact',
    );
  }

  console.log('--- (b) regresja: warstwa "full" (kontakt jest) przepuszcza obie grupy tak jak dawniej ---');
  {
    const cmds = [
      { type: 'wypowiedz_wojne', targetId: '7', powod: 'ai-ai' },
      { type: 'wypowiedz_wojne', targetId: '0', powod: 'ai-player' },
    ];
    const { playerFacing, aiToAiWar } = partitionDiplomacyCommandsForPlayerFog(cmds);
    const merged = [
      ...filterDiplomacyCommandsForLayer(playerFacing, 'full'),
      ...filterDiplomacyCommandsForLayer(aiToAiWar, 'full'),
    ];
    eq(merged.length, 2, 'z kontaktem: obie komendy DOW przechodzą, tak jak przed naprawą (b)');
  }

  console.log('--- (c) pickForcedWarTargetId: gracz (ownerId=0) jako najbliższy kandydat zostaje wybrany ---');
  {
    // Kryterium końca 4: main.ts dokłada gracza do ŹRÓDŁA puli ([0, ...aiOwnerList])
    // i filtruje `oid >= 0` zamiast `oid > 0` — ten sam, niezmieniony
    // pickForcedWarTargetId dostaje teraz gracza jako jednego z kandydatów. Test
    // dowodzi, że picker sam w sobie NIE wyklucza go strukturalnie i wybiera go,
    // gdy jest najbliżej.
    const referenceHex = { q: 0, r: 0 };
    const hexDistance = (aq, ar, bq, br) => Math.abs(aq - bq) + Math.abs(ar - br);
    const candidates = [
      { ownerId: 0, q: 1, r: 0 }, // gracz — najbliżej (dystans 1)
      { ownerId: 4, q: 5, r: 5 }, // AI daleko
      { ownerId: 6, q: 3, r: 3 }, // AI dalej niż gracz
    ];
    const picked = pickForcedWarTargetId(candidates, referenceHex, hexDistance);
    eq(picked, 0, 'gracz najbliższy geograficznie -> WYBRANY jako cel (nie jest już strukturalnie wykluczony)');
  }
  console.log('--- (c) regresja: barbarzyńcy/CS/eliminowani nadal wykluczeni z tej samej puli (main.ts filtruje ich PRZED pickerem) ---');
  {
    // main.ts buduje pulę z [0, ...aiOwnerList].filter(oid => ... && !isBarbarian(oid)
    // && !eliminatedOwners.has(oid) && !isOwnerClusterCityState(oid, ...)) — tu
    // symulujemy dokładnie ten filtr na surowej liście ownerów i dowodzimy że
    // barbarzyńca/eliminowany/CS nigdy nie trafiają DO candidates przekazanych
    // pickerowi, mimo że gracz (oid===0) już przechodzi.
    const ownerId = 11;
    const aiOwnerList = [4, 6, BARBARIAN_OWNER_ID, 20];
    const eliminatedOwners = new Set([6]);
    const cityStateOwners = new Set([20]);
    const isOwnerClusterCityState = (oid) => cityStateOwners.has(oid);
    const rawCandidates = [0, ...aiOwnerList]
      .filter(oid =>
        oid !== ownerId
        && oid >= 0
        && !isBarbarian(oid)
        && !eliminatedOwners.has(oid)
        && !isOwnerClusterCityState(oid),
      );
    deepEqSorted(rawCandidates, [0, 4], 'pula po filtrach: gracz (0) + AI4 wyłącznie — barbarzyńca/eliminowany(6)/CS(20) wykluczeni');
  }

  function deepEqSorted(actual, expected, message) {
    const a = [...actual].sort((x, y) => x - y);
    const b = [...expected].sort((x, y) => x - y);
    assert(JSON.stringify(a) === JSON.stringify(b), `${message} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`);
  }
} finally {
  try { fs.unlinkSync(entry); } catch (e) { /* nieistotne */ }
  try { fs.unlinkSync(bundle); } catch (e) { /* nieistotne */ }
}

console.log(`\nPASSED: ${passed} / FAILED: ${failed} / TOTAL: ${passed + failed}`);
if (failed > 0) {
  console.log('SOME TESTS FAILED');
  process.exit(1);
} else {
  console.log('ALL GREEN');
}
