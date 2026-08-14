'use strict';
/**
 * barb-camp-destruction-test.cjs -- standalone Node test for the ENTRY-based barbarian
 * camp destruction mechanic (P-BARBARZYNCY-USUWANIE-SEMANTYKA-Q1, odpowiedź właściciela
 * 2026-08-12; RUNDA 2 tematu P-BARBARZYNCY-CHATA-NIE-ZNIKA-PO-ZDOBYCIU).
 * Run from gra/:  node tools/barb-camp-destruction-test.cjs
 *
 * Właściciel wprost (2026-08-12): "Jeżeli cywilizacja, zarówno AI, jak i gracz, wejdzie do
 * obozu, bezpowrotnie go niszczy. Ale nie niszczy jednostek, które ten obóz stworzył. [...]
 * jeżeli obóz zostanie zniszczony poprzez najechanie jednostkami na ten obóz, to stare
 * jednostki nie są usuwane, nie są likwidowane, tylko nadal atakują, a jedynie nie są już
 * tworzone nowe jednostki, ponieważ obóz został zniszczony."
 *
 * RUNDA 1 (commit 1c41c113, `pruneEmptyCampsAfterCombat`, wyzwalacz = zliczanie garnizonu
 * w promieniu PO WALCE) miała realną regresję znalezioną przez Evaluatora i została CAŁKOWICIE
 * ZASTĄPIONA -- nie poprawiona parametrem. Ten plik testuje NOWY mechanizm:
 *   `destroyCampAt(camps, q, r)` w src/game/barbarians.ts (czysta funkcja, bez znajomości
 *   właściciela wchodzącej jednostki ani jednostek na mapie) + jego wpięcie w main.ts
 *   (`checkBarbCampDestroyedAt`/`checkBarbCampDestructionAlongPath`), wołane po ZAKOŃCZENIU
 *   RUCHU jednostki na docelowy heks -- analogicznie do `checkVillageRewardAt` dla wiosek
 *   neutralnych, ale BEZ nagrody i dla KAŻDEJ cywilizacji (nie tylko gracza).
 *
 * Sekcje:
 *   1. destroyCampAt -- czyste zachowanie usuwania obozu po (q, r) (punkt zadania (a)).
 *   2. Integracja z tickCamps -- usunięty obóz przestaje spawnować (punkt (b)).
 *   3. Jednostki barbarzyńskie NIE są dotykane przez zniszczenie obozu (punkt (c), NAJWAŻNIEJSZA
 *      asercja tej rundy -- destroyCampAt nie przyjmuje nawet parametru `units`, więc nie ma
 *      jak ich dotknąć; test to demonstruje wprost przez snapshot przed/po).
 *   4. Symetria gracz/AI (punkt (d)) -- (i) destroyCampAt jest agnostyczna względem właściciela
 *      (brak parametru ownerId w sygnaturze -- ta sama funkcja obsługuje obie strony
 *      identycznie), (ii) statyczna weryfikacja źródła main.ts: `checkBarbCampDestroyedAt`
 *      jest wpięte zarówno w blok ruchu AI (`cmd.type === 'move'`), jak i w co najmniej jeden
 *      blok ruchu gracza.
 *   5. refreshFog()/mesh (punkt (e)) -- statyczna weryfikacja źródła main.ts: funkcja
 *      `checkBarbCampDestroyedAt` woła `refreshFog()` po udanym zniszczeniu (ten sam
 *      mechanizm co checkVillageRewardAt -- synchronizacja meshy obozu przez refreshFog,
 *      main.ts:2386-2402 `campMeshes`).
 *   6. Regresja RUNDY 1: stara mechanika (`pruneEmptyCampsAfterCombat`) NIE istnieje już w
 *      bundlu barbarians.ts ani w źródle main.ts -- zastąpiona, nie poprawiona parametrem.
 *
 * main.ts NIE jest bundlowany tu (monolityczny plik z zależnościami DOM/THREE -- żaden test
 * w tym repo tego nie robi, patrz ai-home-defense-vs-barbarians-test.cjs), więc sekcje 4(ii) i
 * 5 są weryfikacją STATYCZNĄ (przeszukanie tekstu źródła main.ts), nie wykonaniem silnika --
 * jawnie oznaczone w nazwach asercji jako "static:".
 */

const fs   = require('fs');
const path = require('path');

// --- esbuild -----------------------------------------------------------------------------
const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[barb-camp-destruction-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA_ROOT   = path.resolve(__dirname, '..');
const ENTRY_FILE  = path.resolve(__dirname, '.barb-camp-destruction-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.barb-camp-destruction-bundle.cjs');

const ENTRY_TS = `
export {
  BARBARIAN_OWNER_ID, isBarbarian,
  FALLBACK_BARB_PARAMS, destroyCampAt, tickCamps, decideBarbarianMoves,
} from ${JSON.stringify(path.join(GRA_ROOT, 'src/game/barbarians'))};
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
  console.error('[barb-camp-destruction-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const B = require(BUNDLE_FILE);
const { BARBARIAN_OWNER_ID, FALLBACK_BARB_PARAMS, destroyCampAt, tickCamps, decideBarbarianMoves } = B;

// --- tiny assertion framework --------------------------------------------------------------
let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('  FAIL:', msg); }
}
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// --- helpers --------------------------------------------------------------------------------
function camp(id, q, r, extra = {}) {
  return Object.assign({ id, q, r, spawnCooldown: 0 }, extra);
}
function barb(id, q, r, extra = {}) {
  return Object.assign({
    id, ownerId: BARBARIAN_OWNER_ID, typeId: 'Wojownik', category: 'miecznik',
    q, r, ruch: 2, ruchLeft: 2,
  }, extra);
}
function makeMap(w, h) {
  const hexes = {};
  for (let q = 0; q < w; q++) {
    for (let r = 0; r < h; r++) {
      const k = `${q},${r}`;
      hexes[k] = {
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
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 1, riverPaths: [] };
}
/** Axial hex distance (pointy-top, max-based) -- lokalna kopia formuły z units/setup.ts,
 * używana WYŁĄCZNIE do asercji w tym pliku testowym (nie testujemy tu samej formuły). */
function axialDist(aq, ar, bq, br) {
  const dq = Math.abs(aq - bq);
  const dr = Math.abs(ar - br);
  const ds = Math.abs((-aq - ar) - (-bq - br));
  return Math.max(dq, dr, ds);
}

const P = FALLBACK_BARB_PARAMS;

// --- RUNDA 3: inwentarz WSZYSTKICH realnych wpięć checkBarbCampDestroyedAt/
// checkBarbCampDestructionAlongPath w main.ts (definicje funkcji WYKLUCZONE). Zastępuje próg
// liczbowy `>= 5` z RUNDY 2 (Evaluatorzy zweryfikowali wykonaniem: regex łapał też 2 definicje,
// a próg pozwalał usunąć 2-3 realne wpięcia i dalej przechodzić zielono). Każdy wpis ma WŁASNĄ,
// nazwaną asercję (sekcja 4 niżej) -- usunięcie DOWOLNEGO JEDNEGO psuje WYŁĄCZNIE jego asercję,
// z czytelnym komunikatem, nie ogólny licznik. `window` to margines (znaki) od `marker` do
// końca przeszukiwanego okna -- zmierzony wykonaniem (node -e ...) w trakcie pisania tej rundy,
// z zapasem, żeby drobne przyszłe zmiany komentarzy w main.ts nie fałszywie wywalały testu.
const CALL_SITES = [
  { label: 'onSplit (main.ts ok. 9576) -- rozdzielenie armii na heks obozu (RUNDA 3 naprawa #3)',
    marker: 'P-BARBARZYNCY-SPLIT-Q1', call: 'checkBarbCampDestroyedAt(destQ, destR)', window: 1200 },
  { label: 'applyMarchSegmentInstant -- ruch gracza krok-po-kroku (marsz)',
    marker: 'function applyMarchSegmentInstant(', call: 'checkBarbCampDestructionAlongPath(result.movePath)', window: 2300 },
  { label: 'checkBarbCampDestructionAlongPath -- pętla wewnętrzna po każdym unikalnym heksie ścieżki',
    marker: 'function checkBarbCampDestructionAlongPath(', call: 'checkBarbCampDestroyedAt(h.q, h.r)', window: 600 },
  { label: 'hak po zwycięskiej walce -- atakujący faktycznie wchodzi na heks bitwy',
    marker: 'attackerNowOnBattleHex', call: 'checkBarbCampDestroyedAt(battleQ, battleR)', window: 400 },
  { label: 'koniec tury -- domknięcie (snap) animacji ruchu gracza w locie',
    marker: 'Snap any in-flight animation to its destination.', call: 'checkBarbCampDestructionAlongPath(anim.pathHexes)', window: 1600 },
  { label: 'auto-eksploracja zwiadowców gracza (runScoutsAutoExplore)',
    marker: 'runScoutsAutoExplore(', call: 'checkBarbCampDestroyedAt(u.q, u.r)', window: 900 },
  { label: 'ruch AI (cmd.type===\'move\') -- RUNDA 3 naprawa #1: cała trasa zamiast last.q/last.r',
    marker: 'P-BARBARZYNCY-AI-CALA-TRASA-Q1', call: 'checkBarbCampDestructionAlongPath(path)', window: 800 },
  { label: 'animowany ruch gracza -- gałąź wieloheksowa (pathHexes.length > 0)',
    marker: 'GRAFIKA-TEREN-2 / WIOSKI', call: 'checkBarbCampDestructionAlongPath(pathHexes)', window: 1200 },
  { label: 'animowany ruch gracza -- gałąź jednoheksowa (bez pathHexes, destQ/destR)',
    marker: 'checkVillageRewardAt(destQ, destR)', call: 'checkBarbCampDestroyedAt(destQ, destR)', window: 300 },
  { label: 'wczytanie zapisu -- rekoncyliacja jednostek z żywymi obozami (RUNDA 3 naprawa #4)',
    marker: 'P-BARBARZYNCY-LOAD-REKONCYLIACJA-Q1', call: 'checkBarbCampDestroyedAt(u.q, u.r)', window: 1400 },
  { label: 'evictForeignUnitsFromCityHexes -- wypchnięcie obcej jednostki z heksu miasta (RUNDA 3 pkt 6)',
    marker: 'RUNDA 3 pkt 6', call: 'checkBarbCampDestroyedAt(dest.q, dest.r)', window: 900 },
  // RUNDA 4 (dispatch, 2026-08-14): brakująca pozycja -- Fort/straznica runda 2 (66be754f, F2 fix)
  // dopisała TO wywolanie w applyFortTakeoverAndEvacuation, ale inwentarz rundy 3 nie zostal wtedy
  // zaktualizowany (dlug testowy, nie regresja silnika -- patrz sprostowanie Evaluatora rundy 3 w
  // PYTANIA-OTWARTE.md). Bez tej pozycji `static 4-list: dokladnie N realnych wywolan` liczylo 12
  // realnych wywolan w main.ts, ale CALL_SITES mialo tylko 11 wpisow -- FAIL.
  { label: 'applyFortTakeoverAndEvacuation -- ewakuacja jednostki poprzedniego wlasciciela z przejetego fortu (Fort/straznica R2, fix F2)',
    marker: 'F2 fix (Evaluator runda 1, 2026-08-13)', call: 'checkBarbCampDestroyedAt(dest.q, dest.r)', window: 700 },
];

// ============================================================================================
// 1. destroyCampAt -- czyste zachowanie (punkt zadania (a))
// ============================================================================================
{
  // 1a. Obóz na (q,r) -> usunięty, id zwrócone.
  {
    const camps = [camp('c1', 5, 5)];
    const res = destroyCampAt(camps, 5, 5);
    eq(res.camps.length, 0, '1a: camp at (q,r) is removed');
    eq(res.destroyedCampId, 'c1', '1a: destroyedCampId matches the removed camp');
  }

  // 1b. Brak obozu na (q,r) -> nic się nie dzieje, destroyedCampId = null.
  {
    const camps = [camp('c1', 5, 5)];
    const res = destroyCampAt(camps, 6, 6);
    eq(res.camps.length, 1, '1b: no camp at (q,r) -> camps unchanged');
    eq(res.destroyedCampId, null, '1b: destroyedCampId is null when nothing matched');
  }

  // 1c. Kilka obozów -- usuwany WYŁĄCZNIE ten na dokładnym heksie (bez promienia,
  // w przeciwieństwie do starej mechaniki -- obóz SĄSIEDNI, nie na tym samym heksie,
  // musi przetrwać).
  {
    const campOn = camp('cOn', 5, 5);
    const campNear = camp('cNear', 6, 5); // sąsiad, NIE ten sam heks
    const campFar = camp('cFar', 20, 20);
    const res = destroyCampAt([campOn, campNear, campFar], 5, 5);
    eq(res.camps.length, 2, '1c: only the exact-hex camp is removed');
    assert(res.camps.some(c => c.id === 'cNear'), '1c: neighboring camp (not on the hex) survives');
    assert(res.camps.some(c => c.id === 'cFar'), '1c: unrelated far camp survives');
    assert(!res.camps.some(c => c.id === 'cOn'), '1c: the exact-hex camp is gone');
    eq(res.destroyedCampId, 'cOn', '1c: destroyedCampId is the exact-hex camp');
  }

  // 1d. Pure: nie mutuje wejściowej listy `camps`.
  {
    const camps = [camp('c1', 5, 5)];
    destroyCampAt(camps, 5, 5);
    eq(camps.length, 1, '1d: input camps array left untouched (purity)');
  }
}

// ============================================================================================
// 2. Integracja z tickCamps -- usunięty obóz przestaje spawnować (punkt zadania (b))
// ============================================================================================
{
  const map = makeMap(10, 10);
  const camps = [camp('c1', 5, 5)];
  const destroyed = destroyCampAt(camps, 5, 5);
  eq(destroyed.camps.length, 0, '2: camp gone before the next tick');

  const tick = tickCamps(destroyed.camps, [], [], map, P);
  eq(tick.spawns.length, 0, '2: destroyed camp produces zero spawns on the next tick');
  eq(tick.camps.length, 0, '2: destroyed camp does not reappear in tickCamps output');
}

// ============================================================================================
// 3. Jednostki barbarzyńskie NIE są dotykane przez zniszczenie obozu (punkt zadania (c) --
//    NAJWAŻNIEJSZA asercja tej rundy, różniąca ją od RUNDY 1)
// ============================================================================================
{
  // 3a. destroyCampAt nie przyjmuje w ogóle parametru `units` -- strukturalna gwarancja, że
  // nie ma jak dotknąć jednostek. Sygnatura: (camps, q, r) -- długość 3.
  eq(destroyCampAt.length, 3, '3a: destroyCampAt signature has no `units` parameter (camps, q, r)');

  // 3b. Snapshot przed/po: jednostki zaspawnowane przez zniszczony obóz (campId='c1') istnieją
  // w niezależnej tablicy `units`, poza `camps` -- destroyCampAt na `camps` nie zmienia ANI
  // treści, ANI tożsamości (referencji) obiektów w `units`.
  {
    const units = [
      barb('u1', 5, 6, { campId: 'c1' }),
      barb('u2', 5, 4, { campId: 'c1' }),
      barb('u3', 20, 20, { campId: 'c2' }),
    ];
    const unitsSnapshotBefore = JSON.stringify(units);
    const unitRefsBefore = units.map(u => u); // referencje obiektów przed

    const camps = [camp('c1', 5, 5), camp('c2', 20, 20)];
    const res = destroyCampAt(camps, 5, 5); // c1 zniszczony przez wejście na (5,5)
    eq(res.destroyedCampId, 'c1', '3b: c1 destroyed by entry at its hex');

    // `units` nie było w ogóle przekazane do destroyCampAt -- musi być bit-identyczne.
    eq(JSON.stringify(units), unitsSnapshotBefore, '3b: units array content unchanged by camp destruction');
    for (let i = 0; i < units.length; i++) {
      assert(units[i] === unitRefsBefore[i], `3b: unit[${i}] object identity unchanged (not replaced/mutated)`);
    }
    eq(units.length, 3, '3b: no units removed (u1/u2 belonged to the destroyed camp c1, still present)');
    assert(units.some(u => u.id === 'u1') && units.some(u => u.id === 'u2'),
      '3b: u1 and u2 (spawned by the now-destroyed camp c1) are both still on the map');
  }

  // 3c. Po zniszczeniu obozu, jednostki które z niego pochodzą (campId) mogą nadal być
  // przetwarzane normalnie przez tickCamps (nie generuje z nich nic nowego, ale ich obecność
  // w `units`/`barbUnits` wejściowych nie wywołuje błędu ani nie jest z niczego usuwana --
  // tickCamps przyjmuje wyłącznie `camps` do decyzji o spawnie, gracz-owned units to osobny
  // parametr niezależny od `camps`).
  {
    const map = makeMap(10, 10);
    const survivingBarbs = [barb('u1', 5, 6, { campId: 'c1' })];
    const destroyed = destroyCampAt([camp('c1', 5, 5)], 5, 5);
    const tick = tickCamps(destroyed.camps, survivingBarbs, [], map, P);
    eq(tick.spawns.length, 0, '3c: no new spawns from the destroyed camp');
    // survivingBarbs samo w sobie nie jest zwracane/mutowane przez tickCamps -- funkcja
    // operuje na przekazanej referencji tylko do odczytu (liczenie garnizonu innych obozów).
    eq(survivingBarbs.length, 1, '3c: pre-existing barbarian unit list untouched by tickCamps after camp destruction');
  }
}

// ============================================================================================
// 4. Symetria gracz/AI (punkt zadania (d))
// ============================================================================================
{
  // 4a. destroyCampAt jest AGNOSTYCZNA względem właściciela wchodzącej jednostki -- sygnatura
  // (camps, q, r) nie ma parametru ownerId. Ta sama funkcja, wołana z main.ts identycznie z
  // miejsc obsługujących ruch gracza i ruch AI, daje identyczny wynik niezależnie od tego,
  // KTO wszedł na heks -- symetria wynika ze STRUKTURY sygnatury, nie z osobnej gałęzi kodu
  // per-owner.
  {
    const campsA = [camp('c1', 5, 5)];
    const campsB = [camp('c1', 5, 5)];
    const resAsIfPlayer = destroyCampAt(campsA, 5, 5); // main.ts wołałby to samo dla gracza...
    const resAsIfAi = destroyCampAt(campsB, 5, 5);     // ...i dla AI -- identyczne wejście, identyczny wynik.
    eq(JSON.stringify(resAsIfPlayer.camps), JSON.stringify(resAsIfAi.camps),
      '4a: identical (camps, q, r) input yields identical result regardless of the conceptual caller');
    eq(resAsIfPlayer.destroyedCampId, resAsIfAi.destroyedCampId,
      '4a: destroyedCampId identical -- no owner-specific branching inside destroyCampAt');
  }

  // 4b/4c. static: main.ts faktycznie WOŁA checkBarbCampDestroyedAt zarówno z bloku ruchu AI
  // (cmd.type === 'move' w pętli komend AI), jak i z co najmniej jednego bloku ruchu gracza.
  {
    const mainTsPath = path.join(GRA_ROOT, 'src/main.ts');
    const mainTs = fs.readFileSync(mainTsPath, 'utf8');

    assert(mainTs.includes('function checkBarbCampDestroyedAt('),
      'static 4: main.ts defines checkBarbCampDestroyedAt()');

    // Blok AI: komentarz-znacznik dopisany razem z wywołaniem w gałęzi cmd.type === 'move' AI.
    // RUNDA 3 naprawa #1: sprawdzana jest CAŁA trasa (checkBarbCampDestructionAlongPath(path)),
    // NIE tylko ostatni heks (checkBarbCampDestroyedAt(last.q, last.r) -- stary, dziurawy kod
    // sprzed tej rundy, zweryfikowany wykonaniem przez Evaluatorów jako pomijający obozy w
    // połowie trasy AI, bo AI "teleportuje się" na `last` z ruchLeft=0).
    const aiCallIdx = mainTs.indexOf('P-BARBARZYNCY-AI-CALA-TRASA-Q1');
    assert(aiCallIdx !== -1, 'static 4b: AI move-command block carries the RUNDA-3 full-path marker comment');
    const aiCallWindow = mainTs.slice(aiCallIdx, aiCallIdx + 600);
    assert(aiCallWindow.includes('checkBarbCampDestructionAlongPath(path)'),
      'static 4b: checkBarbCampDestructionAlongPath(path) is called right after the AI move-command computes the FULL path (parity with player -- naprawa #1)');
    assert(!aiCallWindow.includes('checkBarbCampDestroyedAt(last.q, last.r)'),
      'static 4b: the AI move-command block no longer uses the old last-hex-only check (regresja rundy 2 naprawiona)');

    // Blok gracza: applyMarchSegmentInstant (ruch player-only, `u.ownerId !== 0` return false wyżej).
    const playerFnIdx = mainTs.indexOf('function applyMarchSegmentInstant(');
    assert(playerFnIdx !== -1, 'static 4c: main.ts defines applyMarchSegmentInstant() (player-only move path)');
    const playerFnWindow = mainTs.slice(playerFnIdx, playerFnIdx + 2500);
    assert(playerFnWindow.includes('checkBarbCampDestructionAlongPath(result.movePath)'),
      'static 4c: checkBarbCampDestructionAlongPath is called on the player move-completion path');

    // RUNDA 3 (zastępuje próg liczbowy `>= 5` z RUNDY 2 -- Evaluatorzy zweryfikowali wykonaniem,
    // że regex łapał też 2 definicje funkcji i próg pozwalał usunąć 2-3 realne wpięcia i dalej
    // przechodzić zielono, np. usunięcie haka bitewnego CAŁEGO + animacji końca tury naraz dawało
    // 39/39). Zamiast jednego licznika: JAWNA lista wszystkich realnych wpięć (CALL_SITES,
    // zdefiniowana na górze pliku), każde z WŁASNĄ nazwaną asercją -- usunięcie DOWOLNEGO JEDNEGO
    // psuje TYLKO jego asercję, z czytelnym komunikatem które konkretnie wpięcie zniknęło.
    for (const site of CALL_SITES) {
      const mi = mainTs.indexOf(site.marker);
      if (mi === -1) {
        assert(false, `static 4-list: marker not found for [${site.label}] (marker: ${JSON.stringify(site.marker)})`);
        continue;
      }
      const win = mainTs.slice(mi, mi + site.window);
      assert(win.includes(site.call),
        `static 4-list: [${site.label}] -- wywołanie ${JSON.stringify(site.call)} obecne w main.ts blisko markera ${JSON.stringify(site.marker)}`);
    }

    // Siatka bezpieczeństwa: dokładna liczba realnych wywołań (definicje funkcji WYKLUCZONE przez
    // odrzucenie dopasowań poprzedzonych "function "). Łapie też wpięcia SPOZA listy CALL_SITES
    // (np. przyszły nowy hak dodany bez odpowiadającej asercji -- test wtedy nie milczy, tylko
    // zgłasza rozjazd liczby zamiast fałszywie przechodzić zielono).
    const callRegex = /checkBarbCampDestroyedAt\(|checkBarbCampDestructionAlongPath\(/g;
    let match;
    let realCallCount = 0;
    while ((match = callRegex.exec(mainTs)) !== null) {
      const preceding = mainTs.slice(Math.max(0, match.index - 9), match.index);
      if (!preceding.endsWith('function ')) realCallCount++;
    }
    eq(realCallCount, CALL_SITES.length,
      `static 4-list: dokładnie ${CALL_SITES.length} realnych wywołań w main.ts (definicje funkcji wykluczone)`);
  }
}

// ============================================================================================
// 5. refreshFog()/mesh (punkt zadania (e)) -- static
// ============================================================================================
{
  const mainTsPath = path.join(GRA_ROOT, 'src/main.ts');
  const mainTs = fs.readFileSync(mainTsPath, 'utf8');

  const fnIdx = mainTs.indexOf('function checkBarbCampDestroyedAt(');
  assert(fnIdx !== -1, 'static 5: main.ts defines checkBarbCampDestroyedAt()');
  // Wytnij ciało funkcji do najbliższego "\n    }\n" (styl wcięcia tego pliku) po starcie.
  const bodyEnd = mainTs.indexOf('\n    }\n', fnIdx);
  const fnBody = mainTs.slice(fnIdx, bodyEnd === -1 ? fnIdx + 500 : bodyEnd);
  assert(fnBody.includes('refreshFog()'),
    'static 5: checkBarbCampDestroyedAt() calls refreshFog() on successful destruction (mesh sync)');
  assert(fnBody.includes('barbCamps = result.camps'),
    'static 5: checkBarbCampDestroyedAt() reassigns barbCamps so campMeshes sync (refreshFog) sees the removal');
}

// ============================================================================================
// 6. Regresja RUNDY 1: stara mechanika CAŁKOWICIE zastąpiona, nie poprawiona parametrem
// ============================================================================================
{
  assert(B.pruneEmptyCampsAfterCombat === undefined,
    '6: pruneEmptyCampsAfterCombat no longer exported from barbarians.ts');

  // Dopuszczalne: docblocki wspominające NAZWĘ starej funkcji jako historię/kontekst
  // decyzji (tak jak w tym pliku wyżej) -- niedopuszczalne: sama FUNKCJA (deklaracja) albo
  // jej IMPORT/UŻYCIE jako wywołania w main.ts.
  const barbariansSrcPath = path.join(GRA_ROOT, 'src/game/barbarians.ts');
  const barbariansSrc = fs.readFileSync(barbariansSrcPath, 'utf8');
  assert(!barbariansSrc.includes('export function pruneEmptyCampsAfterCombat'),
    '6: barbarians.ts no longer DECLARES pruneEmptyCampsAfterCombat (comment mentions of the old name as history are fine)');

  const mainTsPath = path.join(GRA_ROOT, 'src/main.ts');
  const mainTs = fs.readFileSync(mainTsPath, 'utf8');
  const importStart = mainTs.indexOf('loadBarbParams, barbariansActive, spawnCamps');
  const importEnd = mainTs.indexOf("} from './game/barbarians';", importStart);
  assert(importStart !== -1 && importEnd !== -1, '6: found the ./game/barbarians import block in main.ts');
  const importBlock = mainTs.slice(importStart, importEnd);
  assert(!importBlock.includes('pruneEmptyCampsAfterCombat'),
    '6: main.ts import list from ./game/barbarians no longer includes pruneEmptyCampsAfterCombat');
  assert(!mainTs.includes('pruneEmptyCampsAfterCombat('),
    '6: main.ts no longer CALLS pruneEmptyCampsAfterCombat(...) anywhere');
}

// ============================================================================================
// 7. RUNDA 3 -- naprawa #2 (jednostki osierocone: chaseRadius) + degradacja
//    checkBarbCampDestructionAlongPath do "tylko ostatni heks"
// ============================================================================================
{
  // 7a. EXECUTION (nie source-text): jednostka barbarzyńska bez ŻYWEGO obozu macierzystego
  // (campId wskazuje na obóz, którego NIE MA w `camps`) musi NADAL wydawać rozkaz pościgu do
  // celu odległego o 20 heksów -- daleko poza aggroRadius=6 (FALLBACK_BARB_PARAMS). Przed
  // naprawą #2: homeCamp===undefined -> raidReady=false -> chaseRadius=aggroRadius=6 ->
  // target.d(20) > 6 -> krok 3 pomija cel -> krok 4 "drift do domu" też nic nie robi (camps=[]
  // -> homeCampIdle=undefined) -> commands=[] (jednostka zamiera). To bezpośredni test
  // wykonaniowy przeciwko dokładnie tej regresji, zweryfikowanej przez 2 Evaluatorów na
  // realnym bundlu barbarians.ts.
  const map = makeMap(25, 5);
  const orphan = barb('orphan1', 2, 2, { campId: 'destroyed-camp-id-does-not-exist' });
  const farEnemy = { id: 'enemy1', ownerId: 0, typeId: 'Wojownik', category: 'miecznik', q: 22, r: 2, ruch: 2, ruchLeft: 2 };
  eq(axialDist(orphan.q, orphan.r, farEnemy.q, farEnemy.r) > P.aggroRadius, true,
    '7a-setup: test target is beyond aggroRadius (sanity check on the fixture itself)');

  const cmds = decideBarbarianMoves([orphan], [farEnemy], /* cities */ [], /* camps */ [], map, P);
  const orphanCmd = cmds.find(c => c.unitId === 'orphan1');
  assert(cmds.length > 0,
    '7a: orphaned unit (home camp destroyed) at distance 20 >> aggroRadius=6 still issues an order -- does NOT idle/freeze (naprawa #2)');
  assert(orphanCmd !== undefined, '7a: the issued order belongs to the orphaned unit itself (unitId match)');
  if (orphanCmd) {
    eq(orphanCmd.type, 'move', '7a: orphaned unit issues a MOVE command chasing the far target (not stuck)');
    const distBefore = axialDist(orphan.q, orphan.r, farEnemy.q, farEnemy.r);
    const distAfter = axialDist(orphanCmd.toQ, orphanCmd.toR, farEnemy.q, farEnemy.r);
    assert(distAfter < distBefore,
      `7a: the move step goes TOWARD the target, not away toward a foreign camp / idling (distBefore=${distBefore}, distAfter=${distAfter})`);
  }

  // 7b. static: checkBarbCampDestructionAlongPath w main.ts musi iterować po CAŁEJ przekazanej
  // ścieżce (for-of po `hexes`), a NIE degradować się do sprawdzania wyłącznie ostatniego heksu
  // (`hexes.slice(-1)` / `hexes[hexes.length-1]`) -- dokładnie ta degradacja, którą Evaluatorzy
  // RUNDY 2 zademonstrowali jako niewykrywalną przez sam próg liczbowy (usunięcie realnych
  // wpięć + degradacja treści funkcji to dwie RÓŻNE mutacje, obie muszą być złapane osobno).
  const mainTsPath = path.join(GRA_ROOT, 'src/main.ts');
  const mainTs = fs.readFileSync(mainTsPath, 'utf8');
  const fnIdx = mainTs.indexOf('function checkBarbCampDestructionAlongPath(');
  assert(fnIdx !== -1, '7b: main.ts defines checkBarbCampDestructionAlongPath()');
  const bodyEnd = mainTs.indexOf('\n    }\n', fnIdx);
  const fnBody = mainTs.slice(fnIdx, bodyEnd === -1 ? fnIdx + 500 : bodyEnd);
  assert(fnBody.includes('for (const h of hexes)'),
    '7b: checkBarbCampDestructionAlongPath iterates the FULL hexes array (for-of), not just the last hex');
  assert(!/hexes\s*\.\s*slice\(\s*-1\s*\)/.test(fnBody),
    '7b: checkBarbCampDestructionAlongPath does not degrade to hexes.slice(-1) (last-hex-only)');
  assert(!/hexes\s*\[\s*hexes\s*\.\s*length\s*-\s*1\s*\]/.test(fnBody),
    '7b: checkBarbCampDestructionAlongPath does not degrade to hexes[hexes.length-1] (last-hex-only)');
}

// ============================================================================================
// 8. RUNDA 3 (P-BARB-CAPTURE-GUARD, punkt 5) -- ochrona fallbacku "raid-ready freeze" (punkt 1
//    ze zlecenia rundy 3, naprawiony WSPÓLNIE z tematem miast w barbarians.ts) we WŁASNYM
//    pliku testowym tematu obozów -- dziś (przed tą sekcją) ten wspólny fix nie miał TU żadnej
//    asercji blokującej, więc przyszła zmiana w temacie obozów mogłaby po cichu cofnąć fallback
//    przy zielonych bramkach obozowych. EXECUTION: jedyne miasto na mapie, niebronione,
//    jednostka JUŻ ma je zapamiętane w `clearedCityIds` (zbiór, RUNDA 4) -- per-jednostkowy
//    filtr wykluczyłby je (lista pusta), fallback (`filtered.length > 0 ? filtered : civCitiesBase`)
//    musi mimo to dać komendę ruchu w jego stronę, zamiast zamrożenia jednostki bez rozkazu.
// ============================================================================================
{
  const map = makeMap(15, 3);
  const onlyCity = { id: 'onlyCity', q: 9, r: 1, ownerId: 0, name: 'onlyCity' };
  const unit = barb('raider1', 5, 1, { clearedCityIds: ['onlyCity'] });
  const cmds = decideBarbarianMoves([unit], /* enemies */ [], [onlyCity], /* camps */ [], map, P, undefined, 'hard');
  assert(cmds.length === 1,
    '8: fallback (punkt 1, freeze fix) -- jedyny niebroniony cel już "zapamiętany" jako oczyszczony ' +
    'przez TĘ jednostkę wciąż dostaje rozkaz (pusta przefiltrowana lista spada na pełną, jednostka ' +
    'nie zamiera bez rozkazu)');
  const cmd = cmds[0];
  if (cmd) {
    eq(cmd.type, 'move', '8: fallback wydaje komendę ruchu (nie brak rozkazu)');
    const distBefore = axialDist(unit.q, unit.r, onlyCity.q, onlyCity.r);
    const distAfter = axialDist(cmd.toQ, cmd.toR, onlyCity.q, onlyCity.r);
    assert(distAfter < distBefore,
      `8: krok zbliża jednostkę do jedynego (zapamiętanego jako "oczyszczone") miasta -- dowód, że ` +
      `to WŁAŚNIE fallback wybrał ten cel, nie przypadek (before=${distBefore}, after=${distAfter})`);
  }
}

// ============================================================================================
// 9. Weryfikacja mutacyjna (self-check) -- RUNDA 3, kryterium przyjęcia sekcji 5 ze zlecenia.
//    Sam ten plik dowodzi, wykonaniem, że asercje z sekcji 4/7 faktycznie łapią dokładnie te
//    mutacje, które mają łapać -- analogicznie do wzorca `--self-check-skip-mutation` już
//    używanego w tym repo (empire-panel-econ-slider-visibility-test.cjs,
//    owned-building-detail-side-test.cjs): mutuje plik źródłowy NA DYSKU, odpala TEN SAM plik
//    testowy w podprocesie z `--self-check-skip-mutation` (unika nieskończonej rekurencji
//    mutacyjnej -- ta flaga pomija całą tę sekcję 8), oczekuje niezerowego kodu wyjścia,
//    PRZYWRACA oryginał w `finally` (nawet przy wyjątku w środku).
//    Pominięta w trybie --self-check-skip-mutation (żeby uniknąć nieskończonej rekurencji --
//    ten tryb uruchamia TEN SAM plik na zmutowanym źródle i oczekuje, że sekcje 1-7 złapią to
//    czerwono; sekcja 8 sama w sobie nie ma sensu wewnątrz zmutowanego podprocesu).
// ============================================================================================
if (!process.argv.includes('--self-check-skip-mutation')) {
  const { execSync } = require('child_process');
  const mainTsPath = path.join(GRA_ROOT, 'src/main.ts');
  const barbariansSrcPath = path.join(GRA_ROOT, 'src/game/barbarians.ts');

  /** Zapisuje `mutations` (Map<ścieżka, nowa treść>) na dysk, odpala self-check w podprocesie,
   * oczekuje niezerowego exit code, PRZYWRACA oryginały w finally, zwraca czy złapano czerwono. */
  function expectSelfCheckFails(mutations, label) {
    const backups = new Map();
    for (const [p, content] of mutations) backups.set(p, fs.readFileSync(p, 'utf8'));
    let mutantFailed = false;
    let errorMsg = '';
    try {
      for (const [p, content] of mutations) fs.writeFileSync(p, content, 'utf8');
      execSync(`node ${JSON.stringify(__filename)} --self-check-skip-mutation`, {
        cwd: __dirname, stdio: 'pipe', timeout: 60000,
      });
    } catch (e) {
      mutantFailed = true;
      errorMsg = String(e && e.message || e);
    } finally {
      for (const [p, orig] of backups) fs.writeFileSync(p, orig, 'utf8');
    }
    assert(mutantFailed, `mutacja [${label}] złapana czerwono przez self-check podproces (niezerowy exit code)`);
    return mutantFailed;
  }

  console.log('\n-- Sekcja 9 / weryfikacja mutacyjna: usunięcie KAŻDEGO z ' + CALL_SITES.length + ' wpięć osobno --');
  const mainTsOriginalForMutation = fs.readFileSync(mainTsPath, 'utf8');
  for (const site of CALL_SITES) {
    const mi = mainTsOriginalForMutation.indexOf(site.marker);
    const callIdx = mi === -1 ? -1 : mainTsOriginalForMutation.indexOf(site.call, mi);
    if (mi === -1 || callIdx === -1) {
      assert(false, `mutacja-setup: nie znaleziono markera/wywołania do zmutowania dla [${site.label}]`);
      continue;
    }
    const mutated = mainTsOriginalForMutation.slice(0, callIdx)
      + 'NOOP_MUTATION_PLACEHOLDER_RUNDA3()'
      + mainTsOriginalForMutation.slice(callIdx + site.call.length);
    expectSelfCheckFails(new Map([[mainTsPath, mutated]]), `usunięcie wpięcia: ${site.label}`);
  }

  console.log('-- Sekcja 9 / degradacja checkBarbCampDestructionAlongPath do hexes.slice(-1) --');
  {
    const fnMarker = 'function checkBarbCampDestructionAlongPath(hexes: ReadonlyArray<{ q: number; r: number }>): boolean {';
    const fnIdx = mainTsOriginalForMutation.indexOf(fnMarker);
    const bodyEnd = mainTsOriginalForMutation.indexOf('\n    }\n', fnIdx);
    assert(fnIdx !== -1 && bodyEnd !== -1, 'mutacja-setup: checkBarbCampDestructionAlongPath body found for degradation mutation');
    if (fnIdx !== -1 && bodyEnd !== -1) {
      const degradedFn =
        'function checkBarbCampDestructionAlongPath(hexes: ReadonlyArray<{ q: number; r: number }>): boolean {\n'
        + '        const lastOnly = hexes.slice(-1)[0];\n'
        + '        if (!lastOnly) return false;\n'
        + '        return checkBarbCampDestroyedAt(lastOnly.q, lastOnly.r);\n'
        + '      }\n';
      const degraded = mainTsOriginalForMutation.slice(0, fnIdx) + degradedFn + mainTsOriginalForMutation.slice(bodyEnd + '\n    }\n'.length);
      expectSelfCheckFails(new Map([[mainTsPath, degraded]]),
        'degradacja checkBarbCampDestructionAlongPath do hexes.slice(-1) (dokładnie mutacja z rundy 2)');
    }
  }

  console.log('-- Sekcja 9 / cofnięcie naprawy #2 (stary chaseRadius, homeCamp===undefined -> raidReady=false) --');
  {
    const barbariansOriginal = fs.readFileSync(barbariansSrcPath, 'utf8');
    const oldBlock =
      'const homeCamp = homeCampForUnit(unit, camps, params.campControlRadius);\n'
      + '    const raidReady = homeCamp !== undefined && isCampRaidReady(homeCamp, barbUnits, params);\n'
      + '    const chaseRadius = raidReady ? Infinity : params.aggroRadius;';
    const anchor = 'const homeCamp = homeCampForUnit(unit, camps, params.campControlRadius);';
    const chaseLine = 'const chaseRadius = raidReady ? Infinity : params.aggroRadius;';
    const anchorIdx = barbariansOriginal.indexOf(anchor);
    const chaseIdx = anchorIdx === -1 ? -1 : barbariansOriginal.indexOf(chaseLine, anchorIdx);
    assert(anchorIdx !== -1 && chaseIdx !== -1, 'mutacja-setup: naprawiony blok homeCamp/raidReady/chaseRadius found in barbarians.ts');
    if (anchorIdx !== -1 && chaseIdx !== -1) {
      const blockEnd = chaseIdx + chaseLine.length;
      const reverted = barbariansOriginal.slice(0, anchorIdx) + oldBlock + barbariansOriginal.slice(blockEnd);
      assert(reverted !== barbariansOriginal, 'mutacja-setup: reversion actually changed barbarians.ts source');
      expectSelfCheckFails(new Map([[barbariansSrcPath, reverted]]),
        'cofnięcie naprawy #2 (stary chaseRadius bez homeCamp===undefined -> raidReady=true)');
    }
  }

  console.log('-- Sekcja 9 / punkt 5 -- odwrócenie fallbacku "raid-ready freeze" (civCities = filtered) --');
  {
    const barbariansOriginal = fs.readFileSync(barbariansSrcPath, 'utf8');
    const fallbackLine = 'civCities = filtered.length > 0 ? filtered : civCitiesBase;';
    const fallbackIdx = barbariansOriginal.indexOf(fallbackLine);
    assert(fallbackIdx !== -1, 'mutacja-setup: fallback line "civCities = filtered.length > 0 ? ..." found in barbarians.ts');
    if (fallbackIdx !== -1) {
      const mutated = barbariansOriginal.slice(0, fallbackIdx)
        + 'civCities = filtered;'
        + barbariansOriginal.slice(fallbackIdx + fallbackLine.length);
      assert(mutated !== barbariansOriginal, 'mutacja-setup: reversion actually changed barbarians.ts source');
      expectSelfCheckFails(new Map([[barbariansSrcPath, mutated]]),
        'odwrócenie fallbacku punktu 1: civCities = filtered (bez spadku na civCitiesBase, freeze wraca)');
    }
  }
}

// --- summary ----------------------------------------------------------------------------------
console.log(`\nbarb-camp-destruction-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE); } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed > 0 ? 1 : 0);
