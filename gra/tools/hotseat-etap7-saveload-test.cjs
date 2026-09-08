'use strict';
/**
 * hotseat-etap7-saveload-test.cjs — R-HOTSEAT-ETAP7-SAVELOAD-Q1 (format zapisu v3,
 * ABC-4: BEZ migracji v2->v3, komunikat czytelny dla starego formatu).
 *
 * Ta bramka jest DOWODEM PISEMNYM (uruchamialnym, deterministycznym) uzupełniającym
 * dowód NA ŻYWO wykonany w Chromium w tej samej rundzie (opisany w raporcie Operatora —
 * pełny cykl realny: nowa gra -> techs/jednostka/drugi fotel (skarbiec, exploredKeys,
 * przejęte miasto) -> Ctrl+S (doQuickSave -> buildSaveGameSnapshot -> serializeGame ->
 * IndexedDB) -> Ctrl+L (dialog -> loadGameFromSlot -> loadFromLocal -> deserializeGame ->
 * restoreGameFromSave), z zrzutem ekranu i JSON-em zapisu odczytanym wprost z IndexedDB;
 * ORAZ osobny dowód wizualny "starego formatu": zapis v2 wstrzyknięty do IndexedDB, klik
 * Wczytaj w REALNYM dialogu -> zrzut Chromium z widocznym tekstem toastu). Te dwa żywe
 * przebiegi nie są tu zapisane 1:1 (main.ts jest jedną wielką funkcją bootującą całą grę —
 * nie da się jej uruchomić z tego pliku bez pełnego bundla+DOM, wzorem innych bramek w tym
 * katalogu, np. load-fail-toast-zindex-test.cjs), więc ta bramka pokrywa to, co JEST
 * deterministycznie uruchamialne bez pełnego świata gry:
 *
 *  A. save.ts NAPRAWDĘ zbundlowany (esbuild) — serializeGame/deserializeGame na realnych,
 *     NIEPUSTYCH strukturach v3 (2 właścicieli ludzcy, miasta, jednostki, technologie w
 *     `zbadane`) — roundtrip bez utraty/przekształcenia danych.
 *  B. deserializeGame na spreparowanych zapisach v2/v1/przyszła-v4 — dowodzi PROGU `< 3`
 *     (IncompatibleSaveFormatError, ABC-4) ODDZIELNEGO od progu `> SAVE_VERSION` (Error
 *     zwykły, "nowsza niz obslugiwana").
 *  C. main.ts strukturalnie (regex po stripLineComments, main.ts jest jedną wielką
 *     funkcją) — kształt v3 w buildSaveGameSnapshot/restoreGameFromSave, KOLEJNOŚĆ
 *     openStartupMainMenu()/showHintMessage() w gałęzi IncompatibleSaveFormatError (ten sam
 *     wzorzec co load-fail-toast-zindex-test.cjs), i BRAK jakiejkolwiek funkcji migrującej
 *     v2->v3 (ABC-4).
 *
 * Usage (z gra/): node tools/hotseat-etap7-saveload-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const GRA = path.resolve(__dirname, '..');
const MAIN_TS = path.resolve(GRA, 'src', 'main.ts');
const SAVE_TS = path.resolve(GRA, 'src', 'game', 'save.ts');

let pass = 0;
let fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log('  OK: ' + label); }
  else { fail++; console.log('  FAIL: ' + label); }
}

/** Wzorem load-fail-toast-zindex-test.cjs: usuwa komentarze `// ...`, żeby proza PL/EN
 *  cytująca nazwy wywołań nie fałszowała asercji strukturalnych. */
function stripLineComments(src) {
  return src.split('\n').map((line) => {
    const idx = line.indexOf('//');
    return idx >= 0 ? line.slice(0, idx) : line;
  }).join('\n');
}

// ===========================================================================
// A + B. save.ts zbundlowany naprawdę (esbuild) -- serializeGame/deserializeGame.
// ===========================================================================
const ENTRY = path.join(__dirname, '.hotseat-etap7-saveload-entry.ts');
const BUNDLE = path.join(__dirname, '.hotseat-etap7-saveload-bundle.cjs');
fs.writeFileSync(
  ENTRY,
  `export { serializeGame, deserializeGame, SAVE_VERSION, IncompatibleSaveFormatError } from '../src/game/save';`,
  'utf8',
);
esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', outfile: BUNDLE, logLevel: 'silent',
});
const { serializeGame, deserializeGame, SAVE_VERSION, IncompatibleSaveFormatError } = require(BUNDLE);
try { fs.unlinkSync(ENTRY); } catch { /* best-effort */ }
try { fs.unlinkSync(BUNDLE); } catch { /* best-effort */ }

console.log('--- A. Roundtrip v3 NIEPUSTY (2 wlascicieli ludzcy, miasta, jednostki, tech) ---');
{
  ok(SAVE_VERSION === 3, 'SAVE_VERSION === 3 (bump 2->3, R-HOTSEAT-ETAP7-SAVELOAD-Q1)');

  // Kształt DOKŁADNIE z recon §4 (Array<[ownerId, X]>), niepusty na wszystkich osiach
  // wymaganych przez REGUŁĘ PRZECIW SAMOOSZUKIWANIU: miasta, jednostki, technologie.
  const v3 = {
    wersja: 3,
    tura: 12,
    seed: 778899,
    units: [
      { id: 'u1', ownerId: 0, q: 1, r: 1 },
      { id: 'u2', ownerId: 3, q: 5, r: 5 },
    ],
    cities: [
      { id: 'c-stolica-a', ownerId: 0, q: 0, r: 0, nazwa: 'Ardea' },
      { id: 'c-stolica-b', ownerId: 3, q: 6, r: 6, nazwa: 'Lanuvium' },
    ],
    exploredByHuman: [
      [0, ['0,0', '0,1', '1,0']],
      [3, ['6,6', '6,7', '7,6']],
    ],
    gracze: [
      [0, {
        skarbiec: 120, nauka: 725, era: 1,
        zbadane: ['brazownictwo', 'kolo', 'pismo'],
        badana: null, researchQueue: [],
        tempoGry: 'standardowa', buildingCostPace: 'niski',
        kosztJednostekPace: 'niski', wzrostLudnosciPace: 'wysoki', ruchSwiataPace: 'krotki',
      }],
      [3, {
        skarbiec: 80, nauka: 15, era: 1,
        zbadane: [], badana: 'pismo', researchQueue: ['pismo'],
        tempoGry: 'standardowa', buildingCostPace: 'wysoki',
        kosztJednostekPace: 'normalny', wzrostLudnosciPace: 'normalny', ruchSwiataPace: 'dlugi',
      }],
    ],
    humanOwnerIds: [0, 3],
    activeHumanOwnerId: 3,
  };

  const json = serializeGame(v3);
  ok(!/"gracz"\s*:/.test(json), 'JSON zserializowany NIE zawiera starego pola `gracz` (v2)');
  ok(!/"explored"\s*:\s*\[/.test(json), 'JSON zserializowany NIE zawiera starego pola `explored` (v2, tablicowe)');

  const back = deserializeGame(json);
  ok(back.wersja === 3, 'roundtrip: wersja === 3');
  ok(back.gracze.length === 2, 'roundtrip: gracze[] ma 2 wpisy (nie 1 -- dowod ze to NIE jest zawsze single-player)');
  ok(back.exploredByHuman.length === 2, 'roundtrip: exploredByHuman[] ma 2 wpisy');
  ok(JSON.stringify(back.humanOwnerIds) === JSON.stringify([0, 3]), 'roundtrip: humanOwnerIds === [0,3]');
  ok(back.activeHumanOwnerId === 3, 'roundtrip: activeHumanOwnerId === 3 (fotel B byl aktywny)');
  ok(back.cities.length === 2 && back.units.length === 2, 'roundtrip: miasta i jednostki obu wlascicieli zachowane');

  const g0 = back.gracze.find(([oid]) => oid === 0)[1];
  ok(g0.skarbiec === 120 && g0.nauka === 725, 'roundtrip: gracze[0] skarbiec/nauka zachowane');
  ok(JSON.stringify(g0.zbadane.slice().sort()) === JSON.stringify(['brazownictwo', 'kolo', 'pismo'].sort()),
    'roundtrip: gracze[0] technologie (zbadane[]) zachowane -- NIEPUSTE (spelnia REGULE PRZECIW SAMOOSZUKIWANIU)');
  ok(g0.buildingCostPace === 'niski' && g0.wzrostLudnosciPace === 'wysoki' && g0.ruchSwiataPace === 'krotki',
    'roundtrip: gracze[0] pola *Pace (string-union) zachowane 1:1');

  const g3 = back.gracze.find(([oid]) => oid === 3)[1];
  ok(g3.skarbiec === 80 && g3.badana === 'pismo', 'roundtrip: gracze[3] (fotel B) skarbiec/badana zachowane, NIEZALEZNE od gracza[0]');

  const e3 = back.exploredByHuman.find(([oid]) => oid === 3)[1];
  ok(JSON.stringify(e3.slice().sort()) === JSON.stringify(['6,6', '6,7', '7,6'].sort()),
    'roundtrip: exploredByHuman[3] (fotel B, mgla WLASNA) zachowane, rozne od fotela 0');
}

console.log('\n--- B. Prog `< 3` (IncompatibleSaveFormatError) ODDZIELNY od `> SAVE_VERSION` ---');
{
  const v2 = { wersja: 2, tura: 5, units: [], cities: [], explored: ['0,0'], gracz: { skarbiec: 10 } };
  let threwV2 = null;
  try { deserializeGame(JSON.stringify(v2)); } catch (e) { threwV2 = e; }
  ok(threwV2 instanceof IncompatibleSaveFormatError, 'zapis v2 -> throw IncompatibleSaveFormatError (NIE zwykly Error, NIE cichy null)');
  ok(!!threwV2 && /starszej wersji/.test(threwV2.message), 'komunikat v2 zawiera "starszej wersji"');
  ok(!!threwV2 && /gorącego krzesła/.test(threwV2.message), 'komunikat v2 zawiera "gorącego krzesła" (kontekst ABC-4)');
  ok(!!threwV2 && /Rozpocznij nową grę/.test(threwV2.message), 'komunikat v2 doradza "Rozpocznij nową grę" (nie sugeruje migracji/naprawy)');

  const v1 = { wersja: 1, tura: 1, units: [], cities: [] };
  let threwV1 = null;
  try { deserializeGame(JSON.stringify(v1)); } catch (e) { threwV1 = e; }
  ok(threwV1 instanceof IncompatibleSaveFormatError, 'zapis v1 (jeszcze starszy) -> throw IncompatibleSaveFormatError, ten sam prog');

  const vFuture = { wersja: SAVE_VERSION + 1, tura: 1, units: [], cities: [], gracze: [], exploredByHuman: [], humanOwnerIds: [0], activeHumanOwnerId: 0 };
  let threwFuture = null;
  try { deserializeGame(JSON.stringify(vFuture)); } catch (e) { threwFuture = e; }
  ok(threwFuture !== null && !(threwFuture instanceof IncompatibleSaveFormatError),
    `zapis z wersja=${SAVE_VERSION + 1} (przyszla) -> throw ZWYKLY Error ("nowsza"), NIE IncompatibleSaveFormatError -- prog gorny NIEZALEZNY od progu ABC-4`);
  ok(!!threwFuture && /nowsza/.test(threwFuture.message), 'komunikat przyszlej wersji mowi "nowsza"');

  // Zapis v3 malformed (brak gracze[]/exploredByHuman) -- NIE throw, defensywna
  // normalizacja do [] (main.ts::restoreGameFromSave dostaje pusta liste zamiast crasha).
  const v3Malformed = { wersja: 3, tura: 1, units: [], cities: [] };
  let normalized = null;
  try { normalized = deserializeGame(JSON.stringify(v3Malformed)); } catch (e) { normalized = e; }
  ok(!(normalized instanceof Error) && Array.isArray(normalized.gracze) && normalized.gracze.length === 0,
    'zapis v3 BEZ pola gracze[] -- normalizuje sie do [] defensywnie (nie throw, main.ts petla po [] to no-op)');
  ok(Array.isArray(normalized.humanOwnerIds) && normalized.humanOwnerIds.length === 1 && normalized.humanOwnerIds[0] === 0,
    'zapis v3 BEZ humanOwnerIds -- fallback [0] (HUMAN_OWNER_PRIMARY)');
}

// ===========================================================================
// C. main.ts strukturalnie (regex, stripLineComments) -- main.ts nie da sie
//    zbundlowac/uruchomic (jedna gigantyczna funkcja bootujaca cala gre).
// ===========================================================================
console.log('\n--- C. main.ts: ksztalt v3 + kolejnosc komunikatu + BRAK migracji v2->v3 ---');
{
  const mainSrcRaw = fs.readFileSync(MAIN_TS, 'utf8');
  const mainSrc = stripLineComments(mainSrcRaw);

  ok(
    /import\s*\{[^}]*\bIncompatibleSaveFormatError\b[^}]*\}\s*from\s*'\.\/game\/save';/.test(mainSrcRaw),
    "main.ts importuje IncompatibleSaveFormatError z './game/save'",
  );

  // --- buildSaveGameSnapshot: kod v3, zero literalu "wersja: 2". ---
  const bsgStart = mainSrc.indexOf('function buildSaveGameSnapshot(label?: string): SaveGame {');
  ok(bsgStart >= 0, 'znaleziono function buildSaveGameSnapshot(...)');
  const bsgEnd = mainSrc.indexOf('mapSnapshot: serializeMapForSave(map),', bsgStart);
  ok(bsgEnd > bsgStart, 'znaleziono koniec buildSaveGameSnapshot (mapSnapshot: serializeMapForSave(map),)');
  const bsgBody = bsgStart >= 0 && bsgEnd > bsgStart ? mainSrc.slice(bsgStart, bsgEnd) : '';

  ok(/wersja:\s*SAVE_VERSION\s*,/.test(bsgBody), 'buildSaveGameSnapshot pisze `wersja: SAVE_VERSION` (nie literal `2`)');
  ok(!/wersja:\s*2\s*,/.test(bsgBody), 'buildSaveGameSnapshot NIE pisze juz literalu `wersja: 2`');
  ok(/gracze:\s*graczeSave\s*,/.test(bsgBody), 'buildSaveGameSnapshot pisze `gracze: graczeSave`');
  ok(/exploredByHuman:\s*exploredByHumanSave\s*,/.test(bsgBody), 'buildSaveGameSnapshot pisze `exploredByHuman: exploredByHumanSave`');
  ok(/humanOwnerIds:\s*humanSeats\.humanOwnerIds\.slice\(\)\s*,/.test(bsgBody), 'buildSaveGameSnapshot pisze `humanOwnerIds: humanSeats.humanOwnerIds.slice()`');
  ok(/activeHumanOwnerId:\s*humanSeats\.activeHumanOwnerId\s*,/.test(bsgBody), 'buildSaveGameSnapshot pisze `activeHumanOwnerId: humanSeats.activeHumanOwnerId`');
  ok(!/\bgracz:\s*\{/.test(bsgBody), 'buildSaveGameSnapshot NIE pisze juz starego pojedynczego pola `gracz: {`');
  ok(!/explored:\s*Array\.from\(explored\)/.test(bsgBody), 'buildSaveGameSnapshot NIE pisze juz starego `explored: Array.from(explored)`');

  // graczeSave/exploredByHumanSave MUSZA pochodzic z Map.entries() per-human, NIE z
  // pojedynczego `player`/`explored` na sztywno -- to jest rdzen wymogu "nie tylko gracz 0".
  ok(/Array\.from\(\s*playerStateByHuman\.entries\(\)/.test(bsgBody),
    'graczeSave budowany z Array.from(playerStateByHuman.entries()) -- PER-HUMAN, nie hardkodowany gracz 0');
  ok(/Array\.from\(\s*exploredByHuman\.entries\(\)/.test(bsgBody),
    'exploredByHumanSave budowany z Array.from(exploredByHuman.entries()) -- PER-HUMAN');

  // --- restoreGameFromSave: czyta nowe pola, PETLA po wielu wlascicielach, alias zywy. ---
  const rgfsStart = mainSrc.indexOf('function restoreGameFromSave(saved: SaveGame): void {');
  ok(rgfsStart >= 0, 'znaleziono function restoreGameFromSave(...)');
  const rgfsEnd = mainSrc.indexOf('cityProd.clear();', rgfsStart);
  ok(rgfsEnd > rgfsStart, 'znaleziono punkt konca odczytywanego fragmentu (cityProd.clear();)');
  const rgfsBody = rgfsStart >= 0 && rgfsEnd > rgfsStart ? mainSrc.slice(rgfsStart, rgfsEnd) : '';

  ok(/for\s*\(\s*const\s*\[oid,\s*keys\]\s*of\s*saved\.exploredByHuman\s*\)/.test(rgfsBody),
    'restoreGameFromSave iteruje `for (const [oid, keys] of saved.exploredByHuman)` -- WSZYSTKIE fotele, nie tylko 0');
  ok(/for\s*\(\s*const\s*\[oid,\s*g\]\s*of\s*saved\.gracze\s*\)/.test(rgfsBody),
    'restoreGameFromSave iteruje `for (const [oid, g] of saved.gracze)` -- WSZYSTKIE fotele');
  ok(/humanSeats\s*=\s*\{\s*humanOwnerIds:\s*saved\.humanOwnerIds\.slice\(\)/.test(rgfsBody),
    'restoreGameFromSave odtwarza `humanSeats` z `saved.humanOwnerIds`/`saved.activeHumanOwnerId`');
  ok(!/saved\.gracz\b(?!e)/.test(rgfsBody), 'restoreGameFromSave NIE czyta juz starego `saved.gracz` (pojedynczego)');
  ok(!/saved\.explored\b(?!ByHuman)/.test(rgfsBody), 'restoreGameFromSave NIE czyta juz starego `saved.explored` (tablicowego)');

  // Alias krytyczny (§2 recon): explored.clear()+add (mutacja), NIE nowy Set() podstawiony
  // pod exploredByHuman.get(0) -- inaczej 33+ miejsc czytajacych `explored` wprost widzi
  // stare dane po wczytaniu (patrz raport Operatora, sekcja o aliasie).
  ok(/exploredByHuman\.set\(HUMAN_OWNER_PRIMARY,\s*explored\)/.test(rgfsBody),
    'restoreGameFromSave zachowuje alias: exploredByHuman.set(HUMAN_OWNER_PRIMARY, explored) (TEN SAM obiekt, nie kopia)');
  ok(/oid === HUMAN_OWNER_PRIMARY[\s\S]{0,80}explored\.clear\(\)/.test(rgfsBody),
    'gracz 0 (HUMAN_OWNER_PRIMARY) odtwarzany przez MUTACJE `explored` (clear+add), nie przez nowy Set()');

  // --- BRAK funkcji migrujacej v2->v3 (ABC-4, REGULA PRZECIW SAMOOSZUKIWANIU) ---
  const migrationNamePatterns = [
    /migrateV2ToV3/i, /migrateSaveV2/i, /migrateGraczToGracze/i, /upgradeSaveV2/i, /v2ToV3/i,
  ];
  for (const re of migrationNamePatterns) {
    ok(!re.test(mainSrcRaw), `main.ts nie zawiera identyfikatora pasujacego do ${re} (brak funkcji migrujacej v2->v3, ABC-4)`);
  }

  // --- Gałąź IncompatibleSaveFormatError w loadGameFromSlot: KOLEJNOŚĆ wywołań. ---
  const lgfsStart = mainSrc.indexOf('async function loadGameFromSlot(slotId: string, fromInGamePause = false): Promise<void> {');
  ok(lgfsStart >= 0, 'znaleziono function loadGameFromSlot(...)');
  const catchStart = mainSrc.indexOf('} catch (e) {', lgfsStart);
  ok(catchStart > lgfsStart, 'znaleziono `} catch (e) {` w loadGameFromSlot');
  const catchEnd = mainSrc.indexOf('\n    }\n', catchStart);
  const catchBody = catchStart >= 0 && catchEnd > catchStart ? mainSrc.slice(catchStart, catchEnd) : '';

  ok(/e instanceof IncompatibleSaveFormatError/.test(catchBody), 'catch(e) w loadGameFromSlot ma galaz `e instanceof IncompatibleSaveFormatError`');
  const branchStart = catchBody.indexOf('if (e instanceof IncompatibleSaveFormatError) {');
  const branchEnd = branchStart >= 0 ? catchBody.indexOf('return;', branchStart) : -1;
  const branchBody = branchStart >= 0 && branchEnd > branchStart ? catchBody.slice(branchStart, branchEnd) : '';
  const openIdx = branchBody.indexOf('if (!fromInGamePause) openStartupMainMenu();');
  const hintIdx = branchBody.indexOf('showHintMessage(e.message, 6000);');
  ok(openIdx >= 0 && hintIdx >= 0 && openIdx < hintIdx,
    'KOLEJNOSC (N-ZINDEX-TOAST): openStartupMainMenu() PRZED showHintMessage(e.message, 6000) w galezi IncompatibleSaveFormatError');

  // --- loadFromLocal wolany z { rethrowIncompatible: true } WYLACZNIE w tej sciezce. ---
  ok(
    /await loadFromLocal\(slotId,\s*\{\s*rethrowIncompatible:\s*true\s*\}\)/.test(mainSrc),
    'loadGameFromSlot woła loadFromLocal(slotId, { rethrowIncompatible: true }) -- jedyna sciezka z ta flaga',
  );
}

console.log('\n--- C2. save.ts strukturalnie: loadFromLocal domyslnie NIE rzuca (inni wolajacy) ---');
{
  const saveSrc = fs.readFileSync(SAVE_TS, 'utf8');
  ok(
    /if \(opts\?\.rethrowIncompatible && e instanceof IncompatibleSaveFormatError\) throw e;/.test(saveSrc),
    'loadFromLocal rzuca WYLACZNIE gdy opts.rethrowIncompatible===true I e instanceof IncompatibleSaveFormatError '
    + '-- domyslne wywolanie (np. summarizeSaveSlots() w saveLoadDialog.ts) zachowuje sie jak PRZED ta zmiana',
  );
  const migrationNamePatterns2 = [/migrateV2ToV3/i, /migrateSaveV2/i, /upgradeSaveV2/i];
  for (const re of migrationNamePatterns2) {
    ok(!re.test(saveSrc), `save.ts nie zawiera identyfikatora pasujacego do ${re} (brak funkcji migrujacej v2->v3, ABC-4)`);
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
