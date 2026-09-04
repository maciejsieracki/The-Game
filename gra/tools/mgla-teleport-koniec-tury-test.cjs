'use strict';
/**
 * mgla-teleport-koniec-tury-test.cjs — P-MGLA-ODKRYCIE-TELEPORT-KONIEC-TURY-Q1.
 *
 * ZGLOSZENIE: TRZECIE miejsce tego samego wzorca buga (po P-MGLA-ODKRYCIE-WZDLUZ-SCIEZKI-Q1,
 * ZINTEGROWANE, commit 6a9db6e0, FALA 342, naprawione w main.ts:32200-32205 i main.ts:22295):
 * `triggerPlayerEndTurn()` -- blok "Snap any in-flight animation to its destination" --
 * teleportuje jednostke na `anim.destQ`/`anim.destR` (koniec sciezki) BEZ wywolania
 * `computeVisibleAlongPath`/`addExplored` dla heksow POSRODKU sciezki (`anim.pathHexes`).
 * Scenariusz: gracz klika "koniec tury" PODCZAS trwajacej wieloheksowej animacji marszu --
 * jednostka zostaje teleportowana na koniec trasy, ale heksy posrodku (mijane) nie sa odkrywane.
 *
 * NAPRAWA (allowlist tego dispatchu): w petli `for (const su of stack)` (main.ts ~27457, wewnatrz
 * bloku "Snap any in-flight animation to its destination") dodac
 * `addExplored(explored, computeVisibleAlongPath(anim.pathHexes, map, unitSight(su)))`
 * warunkowane `anim.pathHexes.length > 0`, PRZED `checkVillageRewardsAlongPath`/
 * `checkBarbCampDestructionAlongPath` (kolejnosc: mgla najpierw, zgodnie z juz zintegrowanym
 * main.ts:32200-32205). Zero zmian w visibility.ts -- funkcje juz istnieja/przetestowane.
 *
 * SEKCJA A: reprodukcja buga jako CZYSTA logika (computeVisibleAt vs computeVisibleAlongPath) --
 *   identyczny wzorzec dowodowy co w mgla-odkrycie-wzdluz-sciezki-test.cjs SEKCJA A, tu z
 *   scenariuszem "koniec tury podczas animacji": heks SRODKOWY trasy PRZED (widocznosc TYLKO
 *   z pozycji koncowej `anim.destQ/destR` -- symulacja starego, niepoprawionego bloku)
 *   NIE jest odkryty; PO (unia z calej `anim.pathHexes`) JEST odkryty.
 * SEKCJA B: regresja -- widocznosc z pozycji koncowej pozostaje PODZBIOREM wyniku PO.
 * SEKCJA C: stos wielojednostkowy (petla `for (const su of stack)` w triggerPlayerEndTurn) --
 *   kazda jednostka wnosi wlasny `unitSight(su)`.
 * SEKCJA D (static): weryfikacja WPIECIA w main.ts -- w bloku "Snap any in-flight animation to
 *   its destination" (triggerPlayerEndTurn) wystepuje `addExplored(explored,
 *   computeVisibleAlongPath(anim.pathHexes, map, unitSight(su)))` WEWNATRZ petli `for (const su
 *   of stack)`, PRZED `checkVillageRewardsAlongPath(anim.pathHexes)` i
 *   `checkBarbCampDestructionAlongPath(anim.pathHexes)`. Rowniez: dwa juz naprawione miejsca
 *   (main.ts:32200-32205 wzorzec, main.ts:22295) pozostaja NIETKNIETE (ten sam ksztalt kodu).
 *
 * Usage (z gra/): node tools/mgla-teleport-koniec-tury-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.mgla-teleport-entry.ts');
const BUNDLE = path.join(__dirname, '.mgla-teleport-bundle.cjs');
const MAIN_TS_PATH = path.join(GRA_ROOT, 'src', 'main.ts');

fs.writeFileSync(
  ENTRY,
  `export {
  computeVisibleAt,
  computeVisibleAlongPath,
  addExplored,
} from '../src/game/visibility';`,
  'utf8',
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  logLevel: 'silent',
});

const { computeVisibleAt, computeVisibleAlongPath, addExplored } = require(BUNDLE);

let pass = 0;
let fail = 0;
function assert(cond, msg, detail) {
  if (cond) {
    pass++;
    console.log('  OK:', msg);
  } else {
    fail++;
    console.error('  FAIL:', msg, detail !== undefined ? '-- ' + JSON.stringify(detail) : '');
  }
}

// ---------------------------------------------------------------------------
// Fixture: mapa kwadratowa Q,R in [-3..10], wszystkie heksy istnieja.
// ---------------------------------------------------------------------------
function buildMap() {
  const hexes = {};
  for (let q = -3; q <= 10; q++) {
    for (let r = -3; r <= 10; r++) {
      hexes[`${q},${r}`] = { placeholder: true };
    }
  }
  return { szerokoscQ: 14, wysokoscR: 14, hexes, seed: 1 };
}
const map = buildMap();

// ---------------------------------------------------------------------------
// Scenariusz: jednostka w trakcie animowanego marszu 6 hexow, sight=1, linia prosta.
// Gracz klika "koniec tury" ZANIM animacja dobiegnie konca -- triggerPlayerEndTurn
// teleportuje jednostke na anim.destQ/destR (koniec anim.pathHexes) natychmiast.
// ---------------------------------------------------------------------------
const START = { q: 0, r: 0 };
const RUCH = 6;
const SIGHT = 1;
const animPathHexes = [];
for (let i = 1; i <= RUCH; i++) animPathHexes.push({ q: START.q + i, r: START.r });
const dest = animPathHexes[animPathHexes.length - 1]; // anim.destQ/destR

console.log('========================================================================');
console.log('P-MGLA-ODKRYCIE-TELEPORT-KONIEC-TURY-Q1 -- teleport na koniec tury podczas animacji');
console.log('anim.pathHexes: ' + JSON.stringify(animPathHexes));
console.log('========================================================================\n');

console.log('SEKCJA A -- reprodukcja: PRZED (blok bez computeVisibleAlongPath) vs PO (z nim)');

// PRZED (bug): triggerPlayerEndTurn tylko ustawial su.q/su.r = anim.destQ/destR i nie wolal
// zadnej funkcji mgly w tym bloku -- refreshFog() nastapi PO tym z pozycji juz koncowej,
// wiec widocznosc rownowazna computeVisibleAt(dest, sight) (jak w SEKCJI D naprawionego bloku
// main.ts:32200 PRZED tamtym fixem).
const before = computeVisibleAt(dest.q, dest.r, map, SIGHT);
// PO (fix tego dispatchu): addExplored(explored, computeVisibleAlongPath(anim.pathHexes, map,
// unitSight(su))) w petli `for (const su of stack)`.
const after = computeVisibleAlongPath(animPathHexes, map, SIGHT);

assert(before.size > 0, 'PRZED: widocznosc z pozycji koncowej (teleport) niepusta (sanity)', before.size);
assert(after.size > before.size,
  'PO: unia z calej anim.pathHexes daje WIECEJ heksow niz sama pozycja koncowa teleportu',
  { beforeSize: before.size, afterSize: after.size });

// Heks SRODKOWY trasy (odpowiada kryterium konca #1 z dispatchu: "heks SRODKOWY trasy").
// Sciezka dlugosci 6: (1,0)..(6,0) -> srodek ~ (3,0) lub (4,0). Test bierze sasiada (3,1),
// ktory jest w zasiegu sight=1 od (3,0) [srodek], ale POZA zasiegiem sight=1 od konca (6,0)
// (odleglosc heksowa max(|3-6|,|1-0|,|(-3-1)-(-6-0)|) = max(3,1,2) = 3 > 1).
const midPathHex = '3,1';
assert(!before.has(midPathHex),
  'PRZED: heks SRODKOWY trasy (' + midPathHex + ') NIE jest odkryty przy samym teleporcie na koniec (odtworzony bug)',
  { before: [...before] });
assert(after.has(midPathHex),
  'PO: heks SRODKOWY trasy (' + midPathHex + ') JEST odkryty po dodaniu computeVisibleAlongPath(anim.pathHexes, ...)',
  { after: [...after] });

console.log('\nSEKCJA B -- regresja: widocznosc z pozycji koncowej (teleport) pozostaje PODZBIOREM PO');
let allBeforeInAfter = true;
for (const k of before) { if (!after.has(k)) { allBeforeInAfter = false; break; } }
assert(allBeforeInAfter,
  'KAZDY heks widoczny z pozycji koncowej teleportu (PRZED) jest tez w wyniku PO -- zero regresji');

console.log('\nSEKCJA C -- stos wielojednostkowy (main.ts: `for (const su of stack)` w triggerPlayerEndTurn)');
const stackSights = [1, 3];
const explored = new Set(before); // symulacja: explored PRZED zawiera juz widocznosc teleportu
for (const s of stackSights) {
  addExplored(explored, computeVisibleAlongPath(animPathHexes, map, s));
}
assert(explored.has(midPathHex),
  'Stos: po fixie kazda jednostka stosu dokłada computeVisibleAlongPath -- heks srodkowy w explored');
assert(explored.size > before.size,
  'Stos: `explored` faktycznie urosl po dolozeniu widocznosci sciezki obu jednostek stosu',
  { before: before.size, explored: explored.size });

// ---------------------------------------------------------------------------
// SEKCJA D -- static: weryfikacja wpiecia w main.ts (nie bundlowany, patrz naglowek pliku).
// ---------------------------------------------------------------------------
console.log('\nSEKCJA D (static) -- wpiecie main.ts: triggerPlayerEndTurn, blok "Snap any in-flight animation"');
const mainSrc = fs.readFileSync(MAIN_TS_PATH, 'utf8');

assert(/import\s*\{[^}]*\bcomputeVisibleAlongPath\b[^}]*\}\s*from\s*'\.\/game\/visibility'/.test(mainSrc),
  'static: `computeVisibleAlongPath` zaimportowane z ./game/visibility w main.ts');

// Blok "Snap any in-flight animation to its destination" -- od komentarza do
// `anim = null;` ktory go zamyka (ten sam blok co dispatch, main.ts ~27449-27486).
const snapBlockMatch = mainSrc.match(
  /\/\/ Snap any in-flight animation to its destination\.([\s\S]*?)\n\s*anim = null;\n\s*isAnimating = false;\n\s*stopMarch\(\); \/\/ SFX marsz:/,
);
assert(snapBlockMatch !== null,
  'static: blok "Snap any in-flight animation to its destination" (triggerPlayerEndTurn) znaleziony');

if (snapBlockMatch) {
  const block = snapBlockMatch[1];

  // Petla `for (const su of stack)` musi istniec (przypisanie su.q/su.r) -- dispatch dopuszcza
  // wywolanie mgly WEWNATRZ tej petli LUB bezposrednio po niej (przed deductStackRuchLeft).
  const loopMatch = block.match(/for \(const su of stack\) \{([\s\S]*?)\n\s*\}\n/);
  assert(loopMatch !== null, 'static: petla `for (const su of stack)` znaleziona w bloku');

  const fogCallRe = /addExplored\(explored, computeVisibleAlongPath\(anim\.pathHexes, map, unitSight\(su\)\)\)/;
  if (loopMatch) {
    const afterFirstLoopIdx = block.indexOf(loopMatch[0]) + loopMatch[0].length;
    const beforeDeductIdx = block.indexOf('deductStackRuchLeft(stack, anim.cost);');
    const region = fogCallRe.test(loopMatch[1])
      ? loopMatch[1]
      : block.slice(afterFirstLoopIdx, beforeDeductIdx === -1 ? undefined : beforeDeductIdx);
    assert(fogCallRe.test(region),
      'static: addExplored(explored, computeVisibleAlongPath(anim.pathHexes, map, unitSight(su))) WEWNATRZ petli `for (const su of stack)` LUB bezposrednio po niej (przed deductStackRuchLeft)',
      { loopBody: loopMatch[1], region });
  }

  // Kolejnosc: wywolanie mgly (gdziekolwiek w bloku) musi wystapic PRZED
  // checkVillageRewardsAlongPath(anim.pathHexes) i PRZED checkBarbCampDestructionAlongPath(anim.pathHexes).
  const fogIdx = block.search(fogCallRe);
  const villageIdx = block.indexOf('checkVillageRewardsAlongPath(anim.pathHexes)');
  const barbIdx = block.indexOf('checkBarbCampDestructionAlongPath(anim.pathHexes)');
  assert(fogIdx !== -1 && villageIdx !== -1 && fogIdx < villageIdx,
    'static: wywolanie mgly wystepuje PRZED checkVillageRewardsAlongPath(anim.pathHexes)',
    { fogIdx, villageIdx });
  assert(fogIdx !== -1 && barbIdx !== -1 && fogIdx < barbIdx,
    'static: wywolanie mgly wystepuje PRZED checkBarbCampDestructionAlongPath(anim.pathHexes)',
    { fogIdx, barbIdx });

  // Warunkowanie: analogiczne do istniejacego `if (anim.pathHexes.length > 0)` uzytego juz
  // dla checkBarbCampDestructionAlongPath na tej samej galezi.
  assert(/if \(anim\.pathHexes\.length > 0\) \{[\s\S]*?addExplored\(explored, computeVisibleAlongPath\(anim\.pathHexes, map, unitSight\(su\)\)\)/.test(block)
    || /for \(const su of stack\) \{[\s\S]*?if \(anim\.pathHexes\.length > 0\)[\s\S]*?addExplored\(explored, computeVisibleAlongPath\(anim\.pathHexes, map, unitSight\(su\)\)\)/.test(block),
    'static: wywolanie mgly warunkowane `anim.pathHexes.length > 0` (ten sam warunek co checkBarbCampDestructionAlongPath)');
}

// Dwa juz naprawione miejsca (main.ts:32200-32205, main.ts:22295) pozostaja NIETKNIETE --
// zero regresji, zero duplikacji naprawy w tych blokach (allowlist tego dispatchu ich zakazuje).
assert(/addExplored\(explored, computeVisibleAlongPath\(result\.movePath, map, unitSight\(su\)\)\)/.test(mainSrc),
  'static: miejsce main.ts:22295 (applyMarchSegmentInstant) nietkniete -- wzorzec nadal obecny');
assert(/addExplored\(explored, computeVisibleAlongPath\(pathHexes, map, unitSight\(su\)\)\)/.test(mainSrc),
  'static: miejsce main.ts:32200-32205 (koniec animacji, renderLoop) nietkniete -- wzorzec nadal obecny');

console.log('\n' + pass + ' pass, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
