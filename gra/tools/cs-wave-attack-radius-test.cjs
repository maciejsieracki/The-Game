'use strict';
/**
 * cs-wave-attack-radius-test.cjs — R-CS-HARD-BRAK-STOSOWANIA-AI (Maciej 2026-08-11)
 * Bramka ataku PM (Trudny) liczy sojuszników w promieniu CS_WAVE_ATTACK_RADIUS
 * zamiast wymagać fizycznej współobecności na JEDNYM heksie.
 *
 * Sekcje:
 *  (a) countFriendlyMilitaryInRadius — realne wykonanie, dystanse 0..4 od punktu.
 *  (b) filtr ownerIds/isScoutUnit identyczny jak w countFriendlyMilitaryOnHex.
 *  (c) strukturalna asercja (po stripLineComments): call site na attack-gate
 *      używa countFriendlyMilitaryInRadius + CS_WAVE_ATTACK_RADIUS, NIE starej
 *      funkcji na heksie — pozytywna i negatywna asercja.
 *
 * Run from gra/: node tools/cs-wave-attack-radius-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const AI_SRC = process.env.AI_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const AI_FILE = path.resolve(AI_SRC, 'game', 'ai.ts');
const ENTRY_FILE = path.resolve(__dirname, '.cs-wave-attack-radius-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.cs-wave-attack-radius-bundle.cjs');

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('  FAIL:', msg); }
}
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// ---------------------------------------------------------------------------
// (a) + (b) — realne wykonanie przez esbuild
// ---------------------------------------------------------------------------

const ENTRY_TS = `
export {
  countFriendlyMilitaryInRadius,
  countFriendlyMilitaryOnHex,
  CS_WAVE_ATTACK_RADIUS,
  CS_WAVE_ATTACK_MIN_STACK,
} from ${JSON.stringify(AI_SRC + '/game/ai')};
`;

fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY_FILE],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE_FILE,
  absWorkingDir: GRA_ROOT,
  logLevel: 'silent',
});

const {
  countFriendlyMilitaryInRadius,
  countFriendlyMilitaryOnHex,
  CS_WAVE_ATTACK_RADIUS,
  CS_WAVE_ATTACK_MIN_STACK,
} = require(BUNDLE_FILE);

console.log(`--- Sekcja A: countFriendlyMilitaryInRadius — realne wykonanie ---`);

eq(CS_WAVE_ATTACK_RADIUS, 3, 'CS_WAVE_ATTACK_RADIUS = 3');
eq(CS_WAVE_ATTACK_MIN_STACK, 3, 'CS_WAVE_ATTACK_MIN_STACK niezmieniony = 3 (sam próg się nie zmienia)');

function makeUnit(id, ownerId, q, r, opts = {}) {
  return {
    id, ownerId, q, r,
    typeId: opts.typeId ?? 'Miecznik',
    category: opts.category ?? 'miecznik',
    hp: 10, ruchLeft: 2, ruchMax: 2,
  };
}

// Jednostki sojusznicze PM (ownerId 100) na rosnących dystansach od (0,0) przy użyciu
// hexDistance osiowego (q,r): jednostka na (d, 0) jest w dystansie d od (0,0).
const ownerIds = new Set([100]);
const unitsByDistance = [0, 1, 2, 3, 4].map(
  d => makeUnit(`u${d}`, 100, d, 0),
);

for (const radius of [0, 1, 2, 3, 4]) {
  const count = countFriendlyMilitaryInRadius(0, 0, radius, ownerIds, unitsByDistance);
  const expected = unitsByDistance.filter((_, idx) => idx <= radius).length; // d = idx tutaj
  eq(count, expected, `promień=${radius}: liczy jednostki na dystansie 0..${radius}`);
}

// Bramka realna: promień 3 (CS_WAVE_ATTACK_RADIUS) liczy jednostki na dystansach 0,1,2,3 (4),
// jednostka na dystansie 4 NIE jest liczona.
{
  const countAtGateRadius = countFriendlyMilitaryInRadius(
    0, 0, CS_WAVE_ATTACK_RADIUS, ownerIds, unitsByDistance,
  );
  eq(countAtGateRadius, 4, 'promień bramki (CS_WAVE_ATTACK_RADIUS=3): liczy 4 jednostki (dyst. 0,1,2,3)');
  assert(
    countAtGateRadius !== unitsByDistance.length,
    'jednostka na dystansie 4 (poza promieniem) NIE jest liczona — promień nie liczy wszystkiego',
  );
}

console.log(`--- Sekcja B: filtr ownerIds/isScoutUnit identyczny jak countFriendlyMilitaryOnHex ---`);

{
  // Wszystkie na tym samym heksie (0,0) — na heksie dystans=0, więc obie funkcje
  // (stara "na heksie" i nowa "w promieniu") muszą się zgadzać dla dystansu 0.
  const mixedUnits = [
    makeUnit('ally1', 100, 0, 0),                                   // sojusznik, nie zwiadowca -> liczony
    makeUnit('ally2', 100, 0, 0),                                   // sojusznik, nie zwiadowca -> liczony
    makeUnit('scout', 100, 0, 0, { typeId: 'Zwiadowca', category: 'zwiadowca' }), // zwiadowca -> WYKLUCZONY
    makeUnit('enemy', 200, 0, 0),                                   // obcy właściciel -> WYKLUCZONY
  ];

  const onHex = countFriendlyMilitaryOnHex(0, 0, ownerIds, mixedUnits);
  const inRadius0 = countFriendlyMilitaryInRadius(0, 0, 0, ownerIds, mixedUnits);

  eq(onHex, 2, 'countFriendlyMilitaryOnHex: zwiadowca i obcy właściciel wykluczeni (2 sojuszników)');
  eq(inRadius0, 2, 'countFriendlyMilitaryInRadius(radius=0): identyczny filtr jak na heksie (2 sojuszników)');
  eq(onHex, inRadius0, 'obie funkcje zgadzają się dla promienia=0 (odpowiednik "na heksie")');

  // Filtr zwiadowcy działa też poza promieniem 0 — zwiadowca sojusznika w promieniu 3
  // nadal NIE jest liczony, mimo że jest w zasięgu przestrzennym.
  const scoutNearby = makeUnit('scout2', 100, 2, 0, { typeId: 'Zwiadowca', category: 'zwiadowca' });
  const allyNearby = makeUnit('ally3', 100, 2, 0);
  const withScoutInRadius = countFriendlyMilitaryInRadius(
    0, 0, 3, ownerIds, [scoutNearby, allyNearby],
  );
  eq(withScoutInRadius, 1, 'w promieniu: zwiadowca sojusznika nadal wykluczony, liczy się tylko wojsko');

  // Filtr obcego właściciela działa też w promieniu — jednostka wroga w zasięgu promienia
  // nadal NIE jest liczona jako "sojusznik".
  const enemyNearby = makeUnit('enemy2', 999, 1, 0);
  const withEnemyInRadius = countFriendlyMilitaryInRadius(
    0, 0, 3, ownerIds, [enemyNearby, allyNearby],
  );
  eq(withEnemyInRadius, 1, 'w promieniu: obcy właściciel nadal wykluczony, liczy się tylko sojusznik');
}

// ---------------------------------------------------------------------------
// (c) — asercja strukturalna po stripLineComments: call site na attack-gate
// ---------------------------------------------------------------------------

console.log(`--- Sekcja C: strukturalna asercja — call site attack-gate ---`);

/** Usuwa komentarze linii (//...) bez ruszania stringów zawierających "//" w komentarzach blokowych. */
function stripLineComments(src) {
  return src
    .split('\n')
    .map(line => {
      // Prosty, wystarczający dla tego pliku: usuń wszystko po pierwszym "//" poza
      // stringiem w cudzysłowie — w ai.ts nie ma "//" wewnątrz stringów na tych liniach.
      const idx = line.indexOf('//');
      if (idx === -1) return line;
      const beforeQuote = line.slice(0, idx);
      const singleQuotes = (beforeQuote.match(/'/g) || []).length;
      const doubleQuotes = (beforeQuote.match(/"/g) || []).length;
      if (singleQuotes % 2 === 1 || doubleQuotes % 2 === 1) return line; // "//" wewnątrz stringa
      return line.slice(0, idx);
    })
    .join('\n')
    // usuń komentarze blokowe /* ... */ (niezachłannie, wieloliniowo)
    .replace(/\/\*[\s\S]*?\*\//g, '');
}

const rawSrc = fs.readFileSync(AI_FILE, 'utf8');
const src = stripLineComments(rawSrc);

// Wytnij ciało decideDefensiveCopyTurn (jedyny call site bramki ataku), żeby asercja
// była precyzyjna i nie łapała innych wystąpień w pliku (np. definicji funkcji).
const fnStart = src.indexOf('function decideDefensiveCopyTurn');
assert(fnStart !== -1, 'funkcja decideDefensiveCopyTurn znaleziona w ai.ts');

// Znajdź koniec funkcji: `src` jest JUŻ po stripLineComments, więc separator "// ---"
// (komentarz linii) nigdy tam nie występuje — szukanie go zawsze dawało -1 i fnBody
// obejmowało CAŁĄ resztę pliku (~40000 znaków) zamiast tylko ciała funkcji (~6900 znaków),
// co czyniło poniższe asercje ślepe na regresję gdziekolwiek indziej w pliku. Zamiast tego
// szukamy granicy po KOLEJNEJ deklaracji top-level "function " za pierwszą linią funkcji —
// to poprawnie ogranicza fnBody do samego ciała decideDefensiveCopyTurn (weryfikacja:
// fnBody.length ≈ 6894 znaków, nie 40207).
// / EN: `src` is ALREADY stripped of comments here, so the "// ---" separator (a line
// comment) never occurs in it — searching for it always returned -1 and fnBody covered
// the ENTIRE rest of the file (~40000 chars) instead of just the function body (~6900
// chars), making the assertions below blind to a regression placed anywhere else in the
// file. Instead we find the boundary at the NEXT top-level "function " declaration after
// the function's first line — this correctly bounds fnBody to decideDefensiveCopyTurn's
// own body (verified: fnBody.length ≈ 6894 chars, not 40207).
const afterFn = src.slice(fnStart + 1);
const nextFnDecl = afterFn.search(/\nfunction /);
const fnBody = nextFnDecl !== -1 ? afterFn.slice(0, nextFnDecl) : afterFn;
assert(
  fnBody.length > 1000 && fnBody.length < 20000,
  `fnBody.length w rozsądnym zakresie ciała jednej funkcji, nie całego pliku (got ${fnBody.length})`,
);

// POZYTYWNA: call site attack-gate używa nowej funkcji + nowej stałej promienia.
assert(
  /countFriendlyMilitaryInRadius\(\s*\n?\s*unit\.q,\s*unit\.r,\s*CS_WAVE_ATTACK_RADIUS,\s*waveStackOwnerIds,\s*units,?\s*\n?\s*\)/.test(fnBody),
  'call site attack-gate wywołuje countFriendlyMilitaryInRadius(unit.q, unit.r, CS_WAVE_ATTACK_RADIUS, waveStackOwnerIds, units)',
);

// NEGATYWNA: attack-gate (adjacentEnemy / stackSize) NIE używa już starej funkcji na heksie.
// Wycinamy okolicę "const stackSize = ..." żeby sprawdzić dokładnie ten call site,
// niezależnie od tego czy countFriendlyMilitaryOnHex jest gdzie indziej zadeklarowana.
const stackSizeMatch = fnBody.match(/const stackSize = ([\s\S]*?);/);
assert(stackSizeMatch !== null, 'blok "const stackSize = ...;" znaleziony w decideDefensiveCopyTurn');
if (stackSizeMatch !== null) {
  assert(
    !stackSizeMatch[1].includes('countFriendlyMilitaryOnHex'),
    'call site "const stackSize" NIE używa już countFriendlyMilitaryOnHex (stara funkcja na heksie)',
  );
  assert(
    stackSizeMatch[1].includes('countFriendlyMilitaryInRadius'),
    'call site "const stackSize" używa countFriendlyMilitaryInRadius',
  );
}

// Próg porównania (CS_WAVE_ATTACK_MIN_STACK) pozostaje niezmieniony w warunku bramki —
// zmienia się TYLKO sposób zliczania (promień), nie sama liczba progu.
assert(
  /if\s*\(\s*stackSize\s*<\s*CS_WAVE_ATTACK_MIN_STACK\s*\)/.test(fnBody),
  'warunek bramki nadal porównuje stackSize < CS_WAVE_ATTACK_MIN_STACK (próg niezmieniony)',
);

// Sanity: stała CS_WAVE_ATTACK_RADIUS zadeklarowana obok CS_WAVE_ATTACK_MIN_STACK w pliku źródłowym.
assert(
  /CS_WAVE_ATTACK_MIN_STACK = 3;[\s\S]{0,600}CS_WAVE_ATTACK_RADIUS = 3;/.test(src),
  'CS_WAVE_ATTACK_RADIUS zadeklarowana niedaleko CS_WAVE_ATTACK_MIN_STACK (ta sama sekcja stałych)',
);

// ---------------------------------------------------------------------------

fs.rmSync(ENTRY_FILE, { force: true });
fs.rmSync(BUNDLE_FILE, { force: true });

console.log(`\n=== cs-wave-attack-radius-test: ${passed} passed, ${failed} failed ===`);
process.exit(failed === 0 ? 0 : 1);
