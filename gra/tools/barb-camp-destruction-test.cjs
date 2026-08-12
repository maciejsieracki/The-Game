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
  FALLBACK_BARB_PARAMS, destroyCampAt, tickCamps,
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
const { BARBARIAN_OWNER_ID, FALLBACK_BARB_PARAMS, destroyCampAt, tickCamps } = B;

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

const P = FALLBACK_BARB_PARAMS;

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
    const aiCallIdx = mainTs.indexOf('symetria z ruchem gracza');
    assert(aiCallIdx !== -1, 'static 4b: AI move-command block carries the symmetry marker comment');
    const aiCallWindow = mainTs.slice(aiCallIdx, aiCallIdx + 600);
    assert(aiCallWindow.includes('checkBarbCampDestroyedAt(last.q, last.r)'),
      'static 4b: checkBarbCampDestroyedAt is called right after the AI move-command finalizes u.q/u.r');

    // Blok gracza: applyMarchSegmentInstant (ruch player-only, `u.ownerId !== 0` return false wyżej).
    const playerFnIdx = mainTs.indexOf('function applyMarchSegmentInstant(');
    assert(playerFnIdx !== -1, 'static 4c: main.ts defines applyMarchSegmentInstant() (player-only move path)');
    const playerFnWindow = mainTs.slice(playerFnIdx, playerFnIdx + 2500);
    assert(playerFnWindow.includes('checkBarbCampDestructionAlongPath(result.movePath)'),
      'static 4c: checkBarbCampDestructionAlongPath is called on the player move-completion path');

    // Nie wystarczy JEDNO wystąpienie w całym pliku -- musi być >= 2 wywołań
    // checkBarbCampDestroyedAt/checkBarbCampDestructionAlongPath (AI + co najmniej 1 gracz),
    // nie licząc definicji funkcji samej.
    const callSites = (mainTs.match(/checkBarbCampDestroy(edAt|ed|edAt)?\(|checkBarbCampDestructionAlongPath\(/g) || []);
    assert(callSites.length >= 5,
      `static 4: at least 5 checkBarbCampDestroyedAt/checkBarbCampDestructionAlongPath call sites in main.ts (got ${callSites.length})`);
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

// --- summary ----------------------------------------------------------------------------------
console.log(`\nbarb-camp-destruction-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE); } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed > 0 ? 1 : 0);
