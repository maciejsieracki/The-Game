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

  // ---------------------------------------------------------------- G: bramka wypowiedzenia (zarzut FC r1 nr 2)
  console.log('--- G: evaluateEraForcedWarGate (czysta bramka, ta sama co main.ts) ---');
  {
    const base = { multiwarEnabled: true, tag: 'stone', declaredByTag: new Map(), counts: new Map(),
      attackerId: 3, attackerEpoch: 1, targetId: 0, targetEpoch: 1 };
    eq(M.evaluateEraForcedWarGate(base), 'ok', 'G1 Kamień, świeży licznik -> ok');
    eq(M.evaluateEraForcedWarGate({ ...base, tag: null }), 'ok', 'G2 zwykła wojna (tag null) -> ok');
    eq(M.evaluateEraForcedWarGate({ ...base, tag: 'bronze' }), 'era-disabled', 'G3 Brąz wyłączony flagą -> era-disabled');
    eq(M.evaluateEraForcedWarGate({ ...base, tag: 'iron', multiwarEnabled: false }), 'era-disabled', 'G4 Żelazo wyłączone -> era-disabled także przy multiwar OFF (jak baza)');
    eq(M.evaluateEraForcedWarGate({ ...base, multiwarEnabled: false, counts: new Map([['3:1', 1]]) }), 'ok', 'G5 multiwar OFF: licznik nie blokuje (zachowanie bazowe)');
    eq(M.evaluateEraForcedWarGate({ ...base, declaredByTag: new Map([['stone', 5]]) }), 'ok', 'G6 limit globalny zniesiony (null): licznik globalny nie blokuje');
    eq(M.evaluateEraForcedWarGate({ ...base, counts: new Map([['3:1', 1]]) }), 'civ-cap-attacker', 'G7 napastnik z zużytym licznikiem -> civ-cap-attacker');
    eq(M.evaluateEraForcedWarGate({ ...base, counts: new Map([['0:1', 1]]) }), 'civ-cap-target', 'G8 CEL-gracz z zużytym licznikiem -> civ-cap-target');
    eq(M.evaluateEraForcedWarGate({ ...base, counts: new Map([['3:1', 1]]), attackerEpoch: 2 }), 'ok', 'G9 awans epoki napastnika -> licznik odnowiony (ok)');
    // Kryterium 1 w bramce: AI uczestnicząca (jako CEL / NAPASTNIK) nie dostaje drugiej wojny w tej epoce.
    const c2 = new Map();
    M.recordEraForcedWarParticipation(c2, 1, 2, 1, 1);
    eq(M.evaluateEraForcedWarGate({ ...base, counts: c2, attackerId: 4, targetId: 2 }), 'civ-cap-target', 'G10 AI-cel wojny epoki nie dostaje drugiej (kryterium 1)');
    eq(M.evaluateEraForcedWarGate({ ...base, counts: c2, attackerId: 1, targetId: 5 }), 'civ-cap-attacker', 'G11 AI-napastnik wojny epoki nie dostaje drugiej (kryterium 1)');
    // Założenie (zarzut FC r1 nr 4): klucz = epoka WŁAŚCICIELA w chwili wypowiedzenia. Wojna Kamienia
    // wypowiedziana w epoce 2 zużywa licznik epoki 2, nie 1 -- zapisane jawnie w raporcie.
    const c3 = new Map();
    M.recordEraForcedWarParticipation(c3, 7, 8, 2, 2);
    eq(M.eraWarCountFor(c3, 7, 2), 1, 'G12 założenie: wojna Kamienia w epoce 2 zużywa licznik epoki 2');
    eq(M.eraWarCountFor(c3, 7, 1), 0, 'G13 założenie: licznik epoki 1 nietknięty');
    // Pula: AI 1 zużyta w tej epoce odpada z kandydatów gracza (prawdziwe assignForcedWarPairings).
    const pool = M.assignForcedWarPairings(
      [{ ownerId: 1, q: 0, r: 0, era: 'stone' }],
      [],
      { isPairBlocked: () => false, hexDistanceFn: hexDist, totalActiveForcedWarsByOwner: () => 0,
        isEraWarExhausted: (oid) => !M.canCivJoinEraForcedWar(c2, oid, 1),
        playerFirst: { playerOwnerId: 0, isPlayerPairGateOpen: () => true,
          candidates: [{ ownerId: 1, q: 0, r: 0, era: 'stone' }] } },
    );
    eq(pool.playerFirstPartnerId ?? null, null, 'G14 AI-1 zużyta (była w wojnie epoki) odpada z kandydatów gracza');
  }

  // ---------------------------------------------------------------- S2: wielotur na realnych funkcjach (kryterium 1)
  console.log('--- S2: wielotur -- gracz po wojnie Kamienia nie dostaje drugiej w tej epoce ---');
  {
    const counts = new Map();
    const optsFor = (cands) => ({ isPairBlocked: () => false, hexDistanceFn: hexDist, totalActiveForcedWarsByOwner: () => 0,
      isEraWarExhausted: (oid) => !M.canCivJoinEraForcedWar(counts, oid, 1),
      playerFirst: { playerOwnerId: 0, isPlayerPairGateOpen: () => true, candidates: cands } });
    const cands = [{ ownerId: 1, q: 2, r: 0, era: 'stone' }, { ownerId: 2, q: 5, r: 0, era: 'stone' }];
    const t1 = M.assignForcedWarPairings([{ ownerId: 0, q: 0, r: 0 }, ...cands.map(c => ({ ...c }))], [], optsFor(cands));
    eq(t1.playerFirstPartnerId, 1, 'S2-1 tura 1: partner gracza = AI 1 (najbliższa)');
    eq(M.evaluateEraForcedWarGate({ multiwarEnabled: true, tag: 'stone', declaredByTag: new Map(), counts,
      attackerId: 1, attackerEpoch: 1, targetId: 0, targetEpoch: 1 }), 'ok', 'S2-2 wypowiedzenie dozwolone');
    M.recordEraForcedWarParticipation(counts, 1, 0, 1, 1);
    // Wojna zakończona (brak aktywnej pary): gracz i AI-1 nadal zużyte w epoce 1.
    const t2 = M.assignForcedWarPairings([{ ownerId: 0, q: 0, r: 0 }, { ownerId: 1, q: 2, r: 0, era: 'stone' }], [], optsFor(cands));
    eq(t2.playerFirstPartnerId ?? null, null, 'S2-3 tura po wojnie: gracz nie wchodzi do puli (zużyty)');
    eq(M.evaluateEraForcedWarGate({ multiwarEnabled: true, tag: 'stone', declaredByTag: new Map(), counts,
      attackerId: 0, attackerEpoch: 1, targetId: 2, targetEpoch: 1 }), 'civ-cap-attacker', 'S2-4 gracz nie wypowie drugiej wojny Kamienia w tej epoce');
    eq(M.evaluateEraForcedWarGate({ multiwarEnabled: true, tag: 'stone', declaredByTag: new Map(), counts,
      attackerId: 2, attackerEpoch: 1, targetId: 0, targetEpoch: 1 }), 'civ-cap-target', 'S2-5 AI-2 nie wypowie wojny graczowi drugi raz w epoce 1 (cel zużyty)');
    // Kryterium 2: awans do epoki 2 odnawia licznik.
    eq(M.evaluateEraForcedWarGate({ multiwarEnabled: true, tag: 'stone', declaredByTag: new Map(), counts,
      attackerId: 0, attackerEpoch: 2, targetId: 2, targetEpoch: 2 }), 'ok', 'S2-6 po awansie do epoki 2 gracz znów może (nowy klucz)');
  }

  // ---------------------------------------------------------------- R: pick/restore (prawdziwe funkcje)
  console.log('--- R: pickPlayerReferenceCity + restoreEraWarCounts ---');
  {
    const cities = [{ id: 'c1', ownerId: 0 }, { id: 'c2', ownerId: 0 }, { id: 'c9', ownerId: 3 }];
    eq(M.pickPlayerReferenceCity(cities, 'c2', 0).id, 'c2', 'R1 stolica gracza wybrana (nie pierwsze miasto)');
    eq(M.pickPlayerReferenceCity(cities, null, 0).id, 'c1', 'R2 brak stolicy -> pierwsze miasto gracza');
    eq(M.pickPlayerReferenceCity(cities, 'c9', 0).id, 'c1', 'R3 stolica cudza -> fallback pierwsze miasto gracza');
    eq(M.pickPlayerReferenceCity([{ id: 'x', ownerId: 3 }], undefined, 0), undefined, 'R4 gracz bez miast -> undefined');
    const counts = new Map();
    M.recordEraForcedWarParticipation(counts, 4, 0, 1, 1);
    const restored = M.restoreEraWarCounts(JSON.parse(JSON.stringify(Array.from(counts.entries()))), [], () => 1);
    eq(M.eraWarCountFor(restored, 4, 1), 1, 'R5 round-trip JSON: napastnik zachowany');
    eq(M.eraWarCountFor(restored, 0, 1), 1, 'R6 round-trip JSON: gracz zachowany');
    const oldSave = M.restoreEraWarCounts(undefined, [{ attackerId: 2, targetId: 0 }], () => 1);
    eq(M.eraWarCountFor(oldSave, 0, 1), 1, 'R7 stary zapis (brak pola): odbudowa z aktywnej pary, gracz = 1');
    eq(M.eraWarCountFor(oldSave, 5, 1), 0, 'R8 stary zapis: poza parami = 0');
    const junk = M.restoreEraWarCounts([['3:1', 1], ['bad'], [5, 1], ['4:1', 'x']], [], () => 1);
    eq(Array.from(junk.entries()), [['3:1', 1]], 'R9 śmieciowe wpisy zapisu odrzucone, poprawne zostają');
  }

  // ---------------------------------------------------------------- B: bramka okablowania main.ts
  console.log('--- B: okablowanie main.ts (tekstowe) ---');
  const MAIN_PATH = path.join(SRC, 'main.ts');
  const main = fs.readFileSync(MAIN_PATH, 'utf8');
  const gChecks = [
    ['bypass R3 (const waveActorBypassR3) usunięty', !/const waveActorBypassR3/.test(main)],
    ['bramka dostaje licznik per cywilizacja i epoki napastnika/celu (ownerId/targetId)', /counts: eraWarCountByCivKey,/.test(main)
      && /attackerEpoch: empireEpochForOwner\(ownerId\),/.test(main) && /targetEpoch: empireEpochForOwner\(targetId\),/.test(main)],
    ['zużycie licznika przy wypowiedzeniu (napastnik + cel)', /recordEraForcedWarParticipation\(\s*\n?\s*eraWarCountByCivKey, ownerId, targetId,/.test(main)],
    ['bramka wypowiedzenia = evaluateEraForcedWarGate (cała logika epok/liczników w czystej funkcji)', /const eraGateVerdict = evaluateEraForcedWarGate\(\{[\s\S]*?attackerId: ownerId,[\s\S]*?targetId,[\s\S]*?\}, WAR_RULES_PARAMS\);\s*\n\s*if \(eraGateVerdict !== 'ok'\) continue;/.test(main)],
    ['pending Brąz/Żelazo przy awansie epoki gated flagą', /if \(isForcedEraWarEnabled\('bronze'\)\) bronzeForceWarPendingOwners\.add\(ownerId\);/.test(main) && /if \(isForcedEraWarEnabled\('iron'\)\) ironForceWarPendingOwners\.add\(ownerId\);/.test(main)],
    ['pending w hookach debug Brąz/Żelazo gated flagą (2x Brąz, 1x Żelazo)', (main.match(/if \(isForcedEraWarEnabled\('bronze'\)\) bronzeForceWarPendingOwners\.add\(attackerId\);/g) || []).length === 2
      && /if \(isForcedEraWarEnabled\('iron'\)\) ironForceWarPendingOwners\.add\(attackerId\);/.test(main)],
    ['nieodwołalne pending Brąz/Żelazo bez gate: brak gołego .add(ownerId/attackerId) dla bronze/iron', !/^\s*(bronze|iron)ForceWarPendingOwners\.add\((ownerId|attackerId)\);/m.test(main)],
    ['hak debug wojny Kamienia na gracza (forceStoneForcedWarOnPlayer)', /forceStoneForcedWarOnPlayer: \(\)/.test(main)],
    ['Brąz/Żelazo nie wchodzą do puli parowania (flaga)', /shouldSearch && isForcedEraWarEnabled\('bronze'\)/.test(main) && /shouldSearch && isForcedEraWarEnabled\('iron'\)/.test(main)],
    ['filtr zużytych w assignForcedWarPairings', /isEraWarExhausted: isWarRulesMultiwarEnabled\(\) \? isEraWarExhausted : undefined/.test(main)],
    ['odległość gracza od stolicy: pickPlayerReferenceCity(cities, capitalCityIdForOwner(0), 0)', /const playerCity = pickPlayerReferenceCity\(cities, capitalCityIdForOwner\(0\), 0\);/.test(main)],
    ['komunikat powodu wojny epoki (hint)', /'\\u2694 ' \+ eraWarReasonLabel \+ ': ' \+ ownerDiploLabel\(ownerId\) \+ ' wypowiada wojnę'/.test(main)],
    ['powód w karcie zdarzeń (Wojna epoki / Wojna z progu zaufania)', /recordWarDeclarationEvent\(ownerId, targetId, eraWarReasonLabel\)/.test(main)
      && /'Wojna z progu zaufania'/.test(main)],
    ['zapis licznika w meta (klucz warRulesEraWarCountByCiv, za flagą ON)', /\.\.\.\(isWarRulesMultiwarEnabled\(\)\s*\n\s*\? \{ warRulesEraWarCountByCiv: Array\.from\(eraWarCountByCivKey\.entries\(\)\) \}/.test(main)],
    ['odczyt licznika: restoreEraWarCounts(saved.meta.warRulesEraWarCountByCiv, aktywne pary, epoka)', /restoreEraWarCounts\(\s*\n?\s*saved\.meta\?\.warRulesEraWarCountByCiv,/.test(main)],
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
