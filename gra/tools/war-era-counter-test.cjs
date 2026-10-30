'use strict';
/**
 * war-era-counter-test.cjs -- R-WEB-ERA-WAR-COUNTER-Q1.
 *
 * Licznik wojen epoki per (cywilizacja, epoka): każda główna cywilizacja i GRACZ może
 * uczestniczyć (napastnik LUB cel) w najwyżej JEDNEJ wojnie epoki na epokę; Brąz i Żelazo
 * wyłączone flagą `enabledForcedWarEras`; odległość partnera gracza od STOLICY; zapis/odczyt
 * licznika (stary zapis = odtworzenie z aktywnych par).
 *
 * Część A -- PRAWDZIWE moduły (esbuild): game/war-rules-multiwar.ts + game/forced-war-common.ts.
 * Część B -- tekstowa bramka okablowania gra/src/main.ts.
 *
 * Mutacje: WRM_SRC_DIR=<kopia gra/src z mutacją> node tools/war-era-counter-test.cjs
 * (test MUSI wtedy paść). Uruchomienie (z katalogu gra/): node tools/war-era-counter-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.WRM_SRC_DIR ? path.resolve(process.env.WRM_SRC_DIR) : path.resolve(GRA_ROOT, 'src');
const entry = path.resolve(__dirname, '.war-era-counter-entry.ts');
const bundle = path.resolve(__dirname, '.war-era-counter-bundle.cjs');
const J = (p) => JSON.stringify(path.join(SRC, p));
fs.writeFileSync(entry, `
export * from ${J('game/war-rules-multiwar')};
export * from ${J('game/forced-war-common')};
`, 'utf8');

let passed = 0;
let failed = 0;
function assert(c, m) { if (c) passed++; else { failed++; console.error('  FAIL:', m); } }
function eq(a, b, m) { assert(JSON.stringify(a) === JSON.stringify(b), `${m} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

const hexDist = (aq, ar, bq, br) => Math.abs(aq - bq) + Math.abs(ar - br);

try {
  esbuild.buildSync({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile: bundle, absWorkingDir: GRA_ROOT, logLevel: 'silent',
  });
  const M = require(bundle);

  // ---------------------------------------------------------------- P: parametry JSON
  console.log('--- P: parametry (war-rules-params.json) ---');
  eq(M.WAR_RULES_PARAMS.maxEraForcedWarsPerEra, null, 'P1 globalny limit wojen epoki zniesiony (null)');
  eq(M.WAR_RULES_PARAMS.maxEraForcedWarsPerCivPerEra, 1, 'P2 limit per cywilizacja w epoce = 1');
  eq(M.WAR_RULES_PARAMS.enabledForcedWarEras, ['stone'], 'P3 włączone wojny epoki = tylko Kamień');
  assert(M.isForcedEraWarEnabled('stone') === true, 'P4 Kamień włączony');
  assert(M.isForcedEraWarEnabled('bronze') === false, 'P5 Brąz wyłączony flagą');
  assert(M.isForcedEraWarEnabled('iron') === false, 'P6 Żelazo wyłączone flagą');

  // ---------------------------------------------------------------- C: licznik per (cywilizacja, epoka)
  console.log('--- C: licznik per (cywilizacja, epoka) ---');
  {
    const counts = new Map();
    assert(M.canCivJoinEraForcedWar(counts, 0, 1) === true, 'C1 gracz bez wojny -> może');
    M.recordEraForcedWarParticipation(counts, 3, 0, 1, 1);
    assert(M.canCivJoinEraForcedWar(counts, 3, 1) === false, 'C2 napastnik po wojnie w epoce 1 -> nie może');
    assert(M.canCivJoinEraForcedWar(counts, 0, 1) === false, 'C3 CEL-gracz po wojnie w epoce 1 -> nie może (gracz liczony jak AI)');
    assert(M.canCivJoinEraForcedWar(counts, 4, 1) === true, 'C4 cywilizacja nieuczestnicząca -> może');
    // Kryterium 2: awans epoki = nowy klucz = licznik odnawia się.
    assert(M.canCivJoinEraForcedWar(counts, 3, 2) === true, 'C5 po awansie (epoka 2) licznik odnowiony');
    assert(M.canCivJoinEraForcedWar(counts, 0, 2) === true, 'C6 gracz po awansie (epoka 2) licznik odnowiony');
    // Wojna zakończona (brak aktywnej pary) nie zwalnia licznika -- licznik to zużycie, nie stan wojny.
    eq(M.eraWarCountFor(counts, 3, 1), 1, 'C7 zużycie zostaje po zakończeniu wojny');
  }

  // ---------------------------------------------------------------- S: symulacja wielotur (kryterium 1)
  console.log('--- S: symulacja wielotur (gracz + AI, Kamień) ---');
  {
    // Gracz (0) na stolicy (0,0); AI 1..4 w różnych odległościach; AI 5 bez pary i bez wojny.
    const counts = new Map();
    const epoch = () => 1;
    const subj = (ownerId, q, r) => ({ ownerId, q, r, era: ownerId === 0 ? undefined : 'stone' });
    const world = [subj(0, 0, 0), subj(1, 2, 0), subj(2, 9, 0), subj(3, 4, 4), subj(4, 20, 20), subj(5, 30, 30)];
    let active = [];
    const declaredBy = new Map(); // ownerId -> liczba wojen (napastnik lub cel)
    const playerWarTurns = [];
    for (let turn = 25; turn < 45; turn++) {
      // Wojny kończą się po dwóch turach (usunięcie z listy aktywnych); zużycie licznika zostaje.
      if (turn % 2 === 0) active = [];
      const res = M.assignForcedWarPairings(world, active.map(p => ({ ...p, era: 'stone' })), {
        isPairBlocked: () => false,
        hexDistanceFn: hexDist,
        totalActiveForcedWarsByOwner: (oid) => active.filter(p => p.attackerId === oid || p.targetId === oid).length,
        isEraWarExhausted: (oid) => !M.canCivJoinEraForcedWar(counts, oid, epoch()),
        playerFirst: {
          playerOwnerId: 0,
          isPlayerPairGateOpen: () => true,
          candidates: world.filter(s => s.ownerId > 0),
        },
      });
      for (const a of res.assignments) {
        if (a.targetId === undefined) continue;
        // Zgodnie z main.ts: deklaracja tylko gdy OBIE strony mają wolny licznik (bramka deklaracji).
        if (!M.canCivJoinEraForcedWar(counts, a.ownerId, epoch())) continue;
        if (!M.canCivJoinEraForcedWar(counts, a.targetId, epoch())) continue;
        M.recordEraForcedWarParticipation(counts, a.ownerId, a.targetId, epoch(), epoch());
        active.push({ attackerId: a.ownerId, targetId: a.targetId });
        declaredBy.set(a.ownerId, (declaredBy.get(a.ownerId) ?? 0) + 1);
        declaredBy.set(a.targetId, (declaredBy.get(a.targetId) ?? 0) + 1);
        if (a.targetId === 0 || a.ownerId === 0) playerWarTurns.push(turn);
      }
    }
    eq(playerWarTurns.length, 1, 'S1 gracz dostał DOKŁADNIE jedną wojnę epoki w epoce (nie drugą po zakończeniu)');
    for (const [oid, n] of declaredBy) {
      assert(n <= 1, `S2 cywilizacja ${oid} uczestniczyła w ${n} wojnach epoki (limit 1)`);
    }
    // AI 5 (bez pary i bez wojny) nie zostaje zmuszona do drugiej wojny -- ale też nie dostała pierwszej,
    // bo po pierwszej turze nie ma pary dla niej; dowód: licznik nie przekracza 1.
    assert(M.eraWarCountFor(counts, 0, 1) === 1, 'S3 licznik gracza = 1 po całej symulacji');
  }

  // ---------------------------------------------------------------- X: pula, kandydaci i dołączanie
  console.log('--- X: wykluczenie z puli / kandydatów / dołączania ---');
  {
    const exhausted = new Set([2]);
    const res = M.assignForcedWarPairings(
      [{ ownerId: 1, q: 0, r: 0, era: 'stone' }, { ownerId: 2, q: 1, r: 0, era: 'stone' }],
      [],
      { isPairBlocked: () => false, hexDistanceFn: hexDist, totalActiveForcedWarsByOwner: () => 0,
        isEraWarExhausted: (oid) => exhausted.has(oid) },
    );
    assert(res.assignments.every(a => a.ownerId !== 2 && a.targetId !== 2), 'X1 zużyty licznik odpada z puli (brak wpisu 2)');
    assert(res.assignments.length === 0, 'X2 bez partnera AI 1 nie dostaje pary z zużytym 2');
    eq(res.unresolvedOwnerIds, [1], 'X2b AI 1 bez wolnego partnera trafia do unresolved');

    // Gracz ze zużytym licznikiem nie wchodzi do puli i nie dostaje partnera.
    const r2 = M.assignForcedWarPairings(
      [{ ownerId: 0, q: 0, r: 0 }, { ownerId: 1, q: 1, r: 0, era: 'stone' }],
      [],
      { isPairBlocked: () => false, hexDistanceFn: hexDist, totalActiveForcedWarsByOwner: () => 0,
        isEraWarExhausted: (oid) => oid === 0,
        playerFirst: { playerOwnerId: 0, isPlayerPairGateOpen: () => true,
          candidates: [{ ownerId: 1, q: 1, r: 0, era: 'stone' }] } },
    );
    eq(r2.playerFirstPartnerId, null, 'X3 gracz ze zużytym licznikiem nie dostaje partnera');
    assert(r2.assignments.every(a => a.ownerId !== 0 && a.targetId !== 0), 'X4 gracz ze zużytym licznikiem nie występuje w przydziale');

    // Kandydat partnera gracza ze zużytym licznikiem odpada, wybierany jest kolejny (najbliższy spośród wolnych).
    const r3 = M.assignForcedWarPairings(
      [{ ownerId: 0, q: 0, r: 0 }, { ownerId: 1, q: 1, r: 0, era: 'stone' }, { ownerId: 2, q: 5, r: 0, era: 'stone' }],
      [],
      { isPairBlocked: () => false, hexDistanceFn: hexDist, totalActiveForcedWarsByOwner: () => 0,
        isEraWarExhausted: (oid) => oid === 1,
        playerFirst: { playerOwnerId: 0, isPlayerPairGateOpen: () => true,
          candidates: [{ ownerId: 1, q: 1, r: 0, era: 'stone' }, { ownerId: 2, q: 5, r: 0, era: 'stone' }] } },
    );
    eq(r3.playerFirstPartnerId, 2, 'X5 partner gracza pomija zużytego kandydata 1 i wybiera 2');

    // Dołączanie do istniejącej pary: strona ze zużytym licznikiem nie może zostać celem.
    const r4 = M.assignForcedWarPairings(
      [{ ownerId: 7, q: 0, r: 0, era: 'stone' }],
      [{ attackerId: 3, targetId: 4, era: 'stone' }],
      { isPairBlocked: () => false, hexDistanceFn: hexDist, totalActiveForcedWarsByOwner: () => 0,
        isEraWarExhausted: (oid) => oid === 4 },
    );
    assert(r4.assignments.length === 0, 'X6 leftover nie dołącza do pary, gdy strona pary zużyła licznik');
    eq(r4.unresolvedOwnerIds, [7], 'X6b leftover bez wolnej pary trafia do unresolved (ponowna próba)');
  }

  // ---------------------------------------------------------------- K: odległość od stolicy (kryterium 4)
  console.log('--- K: partner gracza liczony od stolicy ---');
  {
    // Pierwsze miasto gracza (0,0) -- ale stolica (12,0). AI 1 blisko pierwszego miasta, AI 2 blisko stolicy.
    const capital = { q: 12, r: 0 };
    const res = M.assignForcedWarPairings(
      [{ ownerId: 0, q: capital.q, r: capital.r }, { ownerId: 1, q: 1, r: 0, era: 'stone' }, { ownerId: 2, q: 11, r: 0, era: 'stone' }],
      [],
      { isPairBlocked: () => false, hexDistanceFn: hexDist, totalActiveForcedWarsByOwner: () => 0,
        playerFirst: { playerOwnerId: 0, isPlayerPairGateOpen: () => true,
          candidates: [{ ownerId: 1, q: 1, r: 0, era: 'stone' }, { ownerId: 2, q: 11, r: 0, era: 'stone' }] } },
    );
    eq(res.playerFirstPartnerId, 2, 'K1 partner = najbliższy od STOLICY gracza (AI 2), nie od pierwszego miasta (AI 1)');
  }

  // ---------------------------------------------------------------- Z: zapis / odczyt (kryterium 6)
  console.log('--- Z: zapis/odczyt licznika ---');
  {
    const counts = new Map();
    M.recordEraForcedWarParticipation(counts, 0, 5, 1, 1);
    const saved = Array.from(counts.entries());
    const restored = new Map(saved);
    eq(M.eraWarCountFor(restored, 0, 1), 1, 'Z1 round-trip: gracz zachowuje zużycie');
    eq(M.eraWarCountFor(restored, 5, 1), 1, 'Z2 round-trip: cel zachowuje zużycie');
    eq(M.eraWarCountFor(restored, 3, 1), 0, 'Z3 round-trip: cywilizacja bez zużycia = 0');
    // Stary zapis bez pola: odtworzenie z aktywnych par (obie strony = 1 w bieżącej epoce).
    const rebuilt = M.rebuildEraWarCountsFromActivePairs(
      [{ attackerId: 2, targetId: 0 }, { attackerId: 6, targetId: 7 }],
      () => 1,
    );
    eq(M.eraWarCountFor(rebuilt, 2, 1), 1, 'Z4 stary zapis: napastnik aktywnej pary = zużyty');
    eq(M.eraWarCountFor(rebuilt, 0, 1), 1, 'Z5 stary zapis: gracz w aktywnej parze = zużyty');
    eq(M.eraWarCountFor(rebuilt, 9, 1), 0, 'Z6 stary zapis: poza parami = 0');
    eq(M.eraWarCountFor(rebuilt, 2, 2), 0, 'Z7 stary zapis: inna epoka = 0');
  }

  console.log(`WYNIK: ${passed} OK / ${failed} FAIL`);

  // ---------------------------------------------------------------- B: bramka okablowania main.ts
  console.log('--- B: okablowanie main.ts (tekstowe) ---');
  const MAIN_PATH = path.join(SRC, 'main.ts');
  const main = fs.readFileSync(MAIN_PATH, 'utf8');
  const gChecks = [
    ['bypass R3 (const waveActorBypassR3) usunięty', !/const waveActorBypassR3/.test(main)],
    ['licznik per cywilizacja: napastnik i cel w bramce deklaracji', /!canCivJoinEraForcedWar\(eraWarCountByCivKey, ownerId, empireEpochForOwner\(ownerId\), WAR_RULES_PARAMS\)/.test(main)
      && /\|\| !canCivJoinEraForcedWar\(eraWarCountByCivKey, targetId, empireEpochForOwner\(targetId\), WAR_RULES_PARAMS\)/.test(main)],
    ['zużycie licznika przy wypowiedzeniu (napastnik + cel)', /recordEraForcedWarParticipation\(\s*\n?\s*eraWarCountByCivKey, ownerId, targetId,/.test(main)],
    ['wyłączona epoka odrzucana w bramce deklaracji', /if \(gateForcedTagAny !== null && !isForcedEraWarEnabled\(gateForcedTagAny\)\) continue;/.test(main)],
    ['Brąz/Żelazo nie wchodzą do puli parowania (flaga)', /shouldSearch && isForcedEraWarEnabled\('bronze'\)/.test(main) && /shouldSearch && isForcedEraWarEnabled\('iron'\)/.test(main)],
    ['filtr zużytych w assignForcedWarPairings', /isEraWarExhausted: isWarRulesMultiwarEnabled\(\) \? isEraWarExhausted : undefined/.test(main)],
    ['odległość gracza od stolicy (capitalCityIdForOwner(0))', /const playerCapIdForWar = capitalCityIdForOwner\(0\);/.test(main)
      && /cities\.find\(c => c\.id === playerCapIdForWar && c\.ownerId === 0\)/.test(main)],
    ['komunikat powodu wojny epoki (hint)', /'\\u2694 ' \+ eraWarReasonLabel \+ ': ' \+ ownerDiploLabel\(ownerId\) \+ ' wypowiada wojnę'/.test(main)],
    ['powód w karcie zdarzeń (Wojna epoki / Wojna z progu zaufania)', /recordWarDeclarationEvent\(ownerId, targetId, eraWarReasonLabel\)/.test(main)
      && /'Wojna z progu zaufania'/.test(main)],
    ['zapis licznika w meta (klucz warRulesEraWarCountByCiv, za flagą ON)', /\.\.\.\(isWarRulesMultiwarEnabled\(\)\s*\n\s*\? \{ warRulesEraWarCountByCiv: Array\.from\(eraWarCountByCivKey\.entries\(\)\) \}/.test(main)],
    ['odczyt licznika + odbudowa dla starego zapisu', /saved\.meta\?\.warRulesEraWarCountByCiv/.test(main)
      && /rebuildEraWarCountsFromActivePairs\(/.test(main)],
    ['nowa gra zeruje licznik', /regularWarCapturedByPairKey\.clear\(\);\s*\n\s*forcedEraWarDeclaredByTag\.clear\(\);\s*\n\s*\/\/ R-WEB-ERA-WAR-COUNTER-Q1[^\n]*\n\s*eraWarCountByCivKey\.clear\(\);/.test(main)],
  ];
  for (const [label, ok] of gChecks) assert(ok, `B: ${label}`);
  console.log(`WYNIK B: ${gChecks.filter(([, ok]) => ok).length} / ${gChecks.length} OK`);
} catch (e) {
  failed++;
  console.error('  ERROR:', e && e.stack ? e.stack : e);
} finally {
  try { fs.unlinkSync(entry); } catch (_) { /* ignore */ }
  try { fs.unlinkSync(bundle); } catch (_) { /* ignore */ }
}

console.log(`war-era-counter-test: ${passed} pass / ${failed} fail`);
process.exit(failed === 0 ? 0 : 1);
