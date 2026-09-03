'use strict';
/**
 * city-state-offensive-normal-easy-test.cjs — R-MIASTA-PANSTWA-PASYWNOSC-ROZSZERZENIE-Q1
 * (Operator Sonnet 5, effort high, runda 1 + runda 2 rozszerzenie zakresu).
 *
 * Pokrywa kryteria końca 1, 2, 3, 4, 5 z 00-dispatch.md jednostkowo (kryterium 6 — żywy
 * Chromium — w osobnym pliku city-state-offensive-live-test.cjs).
 *
 * RUNDA 2 (DECISION_REQUIRED z rundy 1 rozwiązany przez właściciela — zakres rozszerzony na
 * `decideDefensiveCopyTurn`): sekcja C niżej, opis historyczny luki kryterium 3 zamieniony na
 * opis FAKTYCZNEGO PODŁĄCZENIA — `decideDefensiveCopyTurn` (ai.ts ok. 3151+) teraz SAMA woła
 * planArmyConcentration/planArmyFrontMerge (nowy blok przed pętlą per-jednostka, gated
 * `canConcentrateArmy(opts)` czyli w praktyce `opts.cityStateOffensiveSupport===true`), bo
 * `decideAITurn` deleguje do niej PRZED dotarciem do bloku ai.ts:2662-2726 (ten blok
 * pozostaje martwy dla PM — to nie regresja, tylko potwierdzenie że gate z rundy 1 tam nie
 * miał szans się wykonać, patrz komentarz przy ai.ts:2677-2682).
 *
 * SEKCJA A (kryteria 1+2, GOAL 1): main.ts NIE eksportuje wyrażenia ustawiającego
 * `cityStateOffensiveSupport` jako osobnej funkcji (jest inline w literale opts wewnątrz
 * ogromnej funkcji boot()) — więc "bezpośrednie wywołanie funkcji budującej opts" (jak
 * dosłownie prosi dispatch) nie istnieje jako odrębny eksport. Zamiast reimplementować
 * warunek (ryzyko cichego rozjazdu z prawdziwym źródłem), test EKSTRAHUJE dosłowny tekst
 * wyrażenia z main.ts -- RAZ z wersji SPRZED tej rundy (`git show HEAD:...`, czyli stan
 * na commit dispatchu, przed edycją Operatora) i RAZ z wersji PO edycji (żywy plik na
 * dysku) -- i WYKONUJE oba teksty (`new Function`) z identycznymi wejściami. To jest
 * "żywy dowód zmiany przed/po" z dosłownego kodu, nie z pamięci/opisu.
 *
 * SEKCJA B: samokontrola zakresu -- git diff dla main.ts dotyka WYŁĄCZNIE linii wyrażenia
 * `cityStateOffensiveSupport:` (allowlista dispatchu: "main.ts WYŁĄCZNIE wyrażenie...").
 *
 * SEKCJA C (kryteria 3+4+5, GOAL 2 -- gate mechanika + regresja + podłączenie realne):
 * `canConcentrateArmy` (nowa funkcja pomocnicza w ai.ts) jako funkcja czysta, PLUS runtime
 * `decideAITurn` dla major AI (defensiveCopy=false) -- zero regresji vs. isMajorAiOwner,
 * PLUS (runda 2) runtime `decideAITurn` dla miasto-państwo (defensiveCopy=true) z
 * cityStateOffensiveSupport=true i TYM SAMYM rozproszonym rosterem co C2 -- teraz PRODUKUJE
 * komendy 'move' w stronę rally point (podłączone w `decideDefensiveCopyTurn`, nie w
 * ai.ts:2662-2726 -- ten blok pozostaje nieosiągalny dla PM, patrz komentarz w kodzie).
 *
 * Run from gra/: node tools/city-state-offensive-normal-easy-test.cjs
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const MAIN_TS = path.join(GRA_DIR, 'src', 'main.ts');
const AI_TS = path.join(GRA_DIR, 'src', 'game', 'ai.ts');

let pass = 0, fail = 0;
function check(label, cond, detail) {
  if (cond) { pass++; console.log('  PASS: ' + label); }
  else { fail++; console.error('  FAIL: ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}

function stripLineComments(src) {
  return src.split('\n').map((line) => {
    const idx = line.indexOf('//');
    return idx >= 0 ? line.slice(0, idx) : line;
  }).join('\n');
}

console.log('========================================================================');
console.log('city-state-offensive-normal-easy-test -- GOAL 1 (kryteria 1,2) + GOAL 2 (kryteria 3,4,5, runda 2)');
console.log('========================================================================\n');

// ---------------------------------------------------------------------------
// SEKCJA A: ekstrakcja + wykonanie dosłownego wyrażenia cityStateOffensiveSupport,
// PRZED (git HEAD, stan dispatchu) i PO (żywy plik na dysku).
// ---------------------------------------------------------------------------
console.log('A. Ekstrakcja + wykonanie wyrażenia cityStateOffensiveSupport (przed/po)');

const mainAfterRaw = fs.readFileSync(MAIN_TS, 'utf8');
const mainBeforeRaw = execSync('git show HEAD:gra/src/main.ts', {
  cwd: path.resolve(GRA_DIR, '..'), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
});

const mainAfter = stripLineComments(mainAfterRaw);
const mainBefore = stripLineComments(mainBeforeRaw);

function extractExpr(src, label) {
  const m = src.match(/cityStateOffensiveSupport:\s*([\s\S]*?),\s*\n\s*warAllyOwnerIds:/);
  if (!m) throw new Error('Nie znaleziono wyrażenia cityStateOffensiveSupport w wersji: ' + label);
  return m[1].trim();
}

const exprBefore = extractExpr(mainBefore, 'PRZED (HEAD)');
const exprAfter = extractExpr(mainAfter, 'PO (żywy plik)');
console.log('  wyrażenie PRZED:', JSON.stringify(exprBefore));
console.log('  wyrażenie PO:   ', JSON.stringify(exprAfter));

check(
  'wyrażenie faktycznie się zmieniło między PRZED a PO (test nietautologiczny)',
  exprBefore !== exprAfter,
);
check(
  'wyrażenie PRZED zawierało warunek trudności "hard" (dowód, że to faktycznie STARY kod)',
  /_menuCityStateDifficultyVsPlayer\s*===\s*'hard'/.test(exprBefore),
  exprBefore,
);
check(
  'wyrażenie PO NIE zawiera już warunku trudności (GOAL 1: usunięty)',
  !/_menuCityStateDifficultyVsPlayer\s*===\s*'hard'/.test(exprAfter),
  exprAfter,
);
check(
  'wyrażenie PO nadal zawiera isOwnerPlayerSameCivType(ownerId) (zero zmian w tym warunku)',
  /isOwnerPlayerSameCivType\(ownerId\)/.test(exprAfter),
  exprAfter,
);
check(
  'wyrażenie PO nadal zawiera typCityCopyOwners.has(ownerId) (zero zmian w tym warunku)',
  /typCityCopyOwners\.has\(ownerId\)/.test(exprAfter),
  exprAfter,
);

function makeFn(expr) {
  // eslint-disable-next-line no-new-func
  return new Function(
    'typCityCopyOwners', 'isOwnerPlayerSameCivType', '_menuCityStateDifficultyVsPlayer', 'ownerId',
    'return (' + expr + ');',
  );
}
const fnBefore = makeFn(exprBefore);
const fnAfter = makeFn(exprAfter);

const CS_OWNER = 7;
const csOwners = new Set([CS_OWNER]);
const sameCivType = (oid) => oid === CS_OWNER;
const diffCivType = () => false;

console.log('');
console.log('  -- kryterium 1: PM typu gracza, normal/easy -- PRZED=false, PO=true --');
for (const diff of ['normal', 'easy']) {
  const before = fnBefore(csOwners, sameCivType, diff, CS_OWNER);
  const after = fnAfter(csOwners, sameCivType, diff, CS_OWNER);
  check(
    `[${diff}] PRZED: cityStateOffensiveSupport === false (legacy defend-only)`,
    before === false, { diff, before },
  );
  check(
    `[${diff}] PO: cityStateOffensiveSupport === true (GOAL 1 -- żywy dowód zmiany)`,
    after === true, { diff, after },
  );
}

console.log('');
console.log('  -- regresja zerowa: PM typu gracza, hard -- PRZED=true, PO=true (bez zmian) --');
{
  const before = fnBefore(csOwners, sameCivType, 'hard', CS_OWNER);
  const after = fnAfter(csOwners, sameCivType, 'hard', CS_OWNER);
  check('[hard] PRZED === true', before === true, { before });
  check('[hard] PO === true (zero regresji na hard)', after === true, { after });
}

console.log('');
console.log('  -- kryterium 2: PM INNEGO typu cywilizacji -- false niezależnie od trudności, PRZED i PO --');
for (const diff of ['easy', 'normal', 'hard']) {
  const before = fnBefore(csOwners, diffCivType, diff, CS_OWNER);
  const after = fnAfter(csOwners, diffCivType, diff, CS_OWNER);
  check(`[${diff}] PRZED (inny typ civ): false`, before === false, { diff, before });
  check(`[${diff}] PO (inny typ civ): false (regresja zerowa dla isOwnerPlayerSameCivType)`, after === false, { diff, after });
}

console.log('');
console.log('  -- sanity: owner spoza typCityCopyOwners (nie PM) -- zawsze false, PO --');
{
  const notCsOwners = new Set();
  const after = fnAfter(notCsOwners, sameCivType, 'normal', CS_OWNER);
  check('owner spoza typCityCopyOwners: cityStateOffensiveSupport === false', after === false, { after });
}

console.log('');

// ---------------------------------------------------------------------------
// SEKCJA B: samokontrola zakresu -- git diff dla main.ts dotyka WYŁĄCZNIE bloku
// wyrażenia cityStateOffensiveSupport (allowlista dispatchu).
// ---------------------------------------------------------------------------
console.log('B. Samokontrola zakresu: git diff main.ts dotyka wyłącznie wyrażenia cityStateOffensiveSupport');

const mainDiff = execSync('git diff -U0 -- gra/src/main.ts', {
  cwd: path.resolve(GRA_DIR, '..'), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
});
// Allowlista dispatchu: "main.ts WYŁĄCZNIE wyrażenie ustawiające cityStateOffensiveSupport
// (main.ts:29096-29100) — żadnych innych zmian w tym pliku." Sprawdzamy DWA niezależne
// sygnały: (a) dokładnie JEDEN hunk `@@` w całym diffie main.ts (jedno miejsce dotknięte,
// nie rozrzucone zmiany po pliku), (b) treść tego jedynego hunka mieści się w promieniu
// komentarza + wyrażenia cityStateOffensiveSupport (żadna linia kodu spoza tego bloku).
const hunkHeaders = mainDiff.split('\n').filter((l) => l.startsWith('@@'));
// U0 rozbija sąsiadujące zmiany na osobne hunki gdy między nimi stoi choć jedna niezmieniona
// linia (tu: linia `isOwnerPlayerSameCivType(ownerId)` między blokiem komentarza a warunkiem
// trudności) -- liczba hunków nie jest więc dobrym sygnałem "jednego miejsca". Zamiast tego:
// (a) wszystkie hunki mieszczą się w wąskim paśmie linii 29096-29105 (dokładnie ten jeden
// blok pola opts z dispatchu), (b) JEDYNA zmieniona linia KODU (nie komentarza `//`) to
// usunięcie warunku trudności / dodanie przecinka.
const hunkStartLines = hunkHeaders.map((h) => {
  const m = h.match(/^@@ -(\d+)/);
  return m ? Number(m[1]) : -1;
});
check(
  'wszystkie hunki main.ts leżą w paśmie linii 29090-29110 (dokładnie blok opts.cityStateOffensiveSupport z dispatchu, main.ts:29096-29100)',
  hunkStartLines.length > 0 && hunkStartLines.every((n) => n >= 29090 && n <= 29110),
  hunkStartLines,
);
const diffLines = mainDiff.split('\n').filter((l) => /^[+-]/.test(l) && !/^(\+\+\+|---)/.test(l));
const codeLines = diffLines.filter((l) => !/^[+-]\s*\/\//.test(l)); // linie kodu (nie komentarz `//`)
check(
  'JEDYNE zmienione linie KODU (nie komentarza) w main.ts to usunięcie warunku trudności '
    + '`&& _menuCityStateDifficultyVsPlayer === \'hard\'` i przeniesienie przecinka na linię '
    + 'isOwnerPlayerSameCivType(ownerId) -- zero innych linii kodu dotkniętych',
  codeLines.length === 3
    && codeLines.filter((l) => l.startsWith('-')).length === 2
    && codeLines.filter((l) => l.startsWith('+')).length === 1
    && codeLines.some((l) => l.startsWith('-') && /_menuCityStateDifficultyVsPlayer\s*===\s*'hard'/.test(l))
    && codeLines.some((l) => l.startsWith('-') && /isOwnerPlayerSameCivType\(ownerId\)\s*$/.test(l))
    && codeLines.some((l) => l.startsWith('+') && /isOwnerPlayerSameCivType\(ownerId\),\s*$/.test(l)),
  codeLines,
);

console.log('');

// ---------------------------------------------------------------------------
// SEKCJA C: ai.ts -- canConcentrateArmy (gate GOAL 2) + regresja major AI (kryterium 5)
// + LUKA kryterium 3 (żywy dowód runtime, nie tylko odczyt kodu).
// ---------------------------------------------------------------------------
console.log('C. ai.ts: canConcentrateArmy (gate) + regresja major AI + żywy dowód luki kryterium 3');

const esbuild = require(path.resolve(GRA_DIR, 'node_modules', 'esbuild'));
const entry = path.resolve(__dirname, '.cs-offensive-normal-easy-entry.ts');
const bundle = path.resolve(__dirname, '.cs-offensive-normal-easy-bundle.cjs');
fs.writeFileSync(entry, `
export { decideAITurn, isMajorAiOwner, canConcentrateArmy } from '../src/game/ai';
`);
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: bundle, absWorkingDir: GRA_DIR, logLevel: 'silent',
});
const C = require(bundle);

function unit(id, q, r, extra = {}) {
  return { id, ownerId: 1, typeId: 'Wojownik', category: 'miecznik', q, r, ruch: 2, ruchLeft: 2, ...extra };
}
function makeMap(w, h) {
  const hexes = {};
  for (let q = 0; q < w; q++) for (let r = 0; r < h; r++) {
    hexes[`${q},${r}`] = {
      coords: { q, r }, terenBazowy: 'laka', nakladka: 'brak', ulepszenie: 'brak', wlasciciel: null,
      wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {}, rzeka: { obecna: false, krawedzie: [] },
    };
  }
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 1, riverPaths: [] };
}
const testData = { units: [], buildings: [], terrainYields: { terrain_types: [] }, aiParams: {} };

console.log('');
console.log('  -- C1: canConcentrateArmy jako funkcja czysta --');
check(
  'canConcentrateArmy: major AI (defensiveCopy=false/undefined) -> true (== isMajorAiOwner, zero regresji)',
  C.canConcentrateArmy({ civType: 'grecy' }) === true,
);
check(
  'canConcentrateArmy: PM defend-only (defensiveCopy=true, cityStateOffensiveSupport=false) -> false (kryterium 4)',
  C.canConcentrateArmy({ defensiveCopy: true, cityStateOffensiveSupport: false }) === false,
);
check(
  'canConcentrateArmy: PM defend-only (defensiveCopy=true, cityStateOffensiveSupport brak) -> false (kryterium 4, fallback)',
  C.canConcentrateArmy({ defensiveCopy: true }) === false,
);
check(
  'canConcentrateArmy: PM z aktywnym wsparciem ofensywnym (defensiveCopy=true, cityStateOffensiveSupport=true) -> true (warunek bramkujący GOAL 2 rozszerzony poprawnie)',
  C.canConcentrateArmy({ defensiveCopy: true, cityStateOffensiveSupport: true }) === true,
);

console.log('');
console.log('  -- C2: decideAITurn, major AI (defensiveCopy=false) -- zero regresji vs. army-concentration-test.cjs --');
{
  const aiUnits = [unit('ai-a', 1, 1), unit('ai-b', 5, 1), unit('ai-c', 1, 5)];
  const cmds = C.decideAITurn(1, aiUnits, [], makeMap(8, 8), testData, { civType: 'grecy' });
  const moveIds = new Set(cmds.filter((c) => c.type === 'move').map((c) => c.unitId));
  check(
    'major AI: rozproszony roster nadal wchodzi w koncentrację (ai-b, ai-c poruszają się, ai-a nie) -- zero regresji GOAL 2',
    moveIds.has('ai-b') && moveIds.has('ai-c') && !moveIds.has('ai-a'),
    { moveIds: [...moveIds] },
  );
}

console.log('');
console.log('  -- C3 (runda 2): ŻYWY DOWÓD kryterium 3 -- decideAITurn, PM (defensiveCopy=true) z '
  + 'cityStateOffensiveSupport=true i TYM SAMYM rozproszonym rosterem, który u major AI (C2) '
  + 'wywołuje ruch koncentracji -- podłączone w decideDefensiveCopyTurn (ai.ts ok. 3151+, nowy '
  + 'blok przed pętlą per-jednostka), więc ruch w stronę rally point TERAZ jest emitowany, mimo '
  + 'że decideAITurn deleguje do decideDefensiveCopyTurn PRZED dotarciem do bloku ai.ts:2662-2726 '
  + '(ten blok pozostaje nieosiągalny dla PM -- podłączenie jest w innym miejscu, nie tam).');
{
  const csUnits = [unit('cs-a', 1, 1), unit('cs-b', 5, 1), unit('cs-c', 1, 5)];
  const cmds = C.decideAITurn(
    1, csUnits, [], makeMap(8, 8), testData,
    { civType: 'grecy', defensiveCopy: true, cityStateOffensiveSupport: true },
  );
  const moveIds = new Set(cmds.filter((c) => c.type === 'move').map((c) => c.unitId));
  check(
    'PM z cityStateOffensiveSupport=true: TA SAMA sytuacja co C2 -- ruch koncentracji JEST '
      + 'emitowany (cs-b, cs-c poruszają się w stronę anchora cs-a, cs-a stoi) -- kryterium 3 '
      + 'z dispatchu SPEŁNIONE w tej rundzie',
    moveIds.has('cs-b') && moveIds.has('cs-c') && !moveIds.has('cs-a'),
    { moveIds: [...moveIds], commands: cmds },
  );
}

console.log('');
console.log('  -- C4 (runda 2): regresja PM defend-only (cityStateOffensiveSupport=false) -- ZERO '
  + 'ruchu koncentracji, TA SAMA sytuacja co C3 poza flagą (kryterium 4: PM bez wsparcia '
  + 'ofensywnego nadal nie wchodzi w te dwie gałęzie).');
{
  const csUnits = [unit('cs-a', 1, 1), unit('cs-b', 5, 1), unit('cs-c', 1, 5)];
  const cmds = C.decideAITurn(
    1, csUnits, [], makeMap(8, 8), testData,
    { civType: 'grecy', defensiveCopy: true, cityStateOffensiveSupport: false },
  );
  const moveIds = new Set(cmds.filter((c) => c.type === 'move').map((c) => c.unitId));
  check(
    'PM defend-only (cityStateOffensiveSupport=false): ŻADEN ruch koncentracji nie jest '
      + 'emitowany -- zero regresji istniejącego zachowania defensywnego',
    !moveIds.has('cs-a') && !moveIds.has('cs-b') && !moveIds.has('cs-c'),
    { moveIds: [...moveIds], commands: cmds },
  );
}

try { fs.unlinkSync(entry); } catch { /* best effort */ }
try { fs.unlinkSync(bundle); } catch { /* best effort */ }

console.log('');
console.log('========================================================================');
console.log('WYNIK: ' + pass + ' PASS, ' + fail + ' FAIL');
console.log('========================================================================');
if (fail > 0) process.exit(1);
