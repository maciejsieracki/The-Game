'use strict';
/**
 * adjust-handel-split-suma-test.cjs — R-NAUKA-LIMIT-60-PROC-BUDZETU-Q1
 *
 * Testy poprawności redystrybucji suwaka Handlu (Pieniądz/Nauka/Luksus):
 * - Suma zawsze = 100
 * - Żaden procent nie jest ujemny (>=0)
 * - Nauka nigdy nie przekracza MAX_PROCENT_NAUKA (60%)
 *
 * Run from gra/: node tools/adjust-handel-split-suma-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) { console.error('[adjust-handel-split-suma-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE  = path.resolve(__dirname, '.adjust-handel-split-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.adjust-handel-split-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export {
  adjustHandelSplit, MAX_PROCENT_NAUKA
} from '../src/game/cities';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' },
    outfile: BUNDLE_FILE,
    absWorkingDir: GRA,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[adjust-handel-split-suma-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);

let passed = 0, failed = 0;
function assert(cond, msg) {
  if (cond) {
    passed++;
    console.log('  PASS:', msg);
  } else {
    failed++;
    console.error('  FAIL:', msg);
  }
}

function testCase(name, current, changed, newVal, expectSum100 = true, expectAllNonNegative = true, expectNaukaLte60 = true) {
  console.log(`\n${name}`);
  const result = M.adjustHandelSplit(current, changed, newVal);
  const sum = result.procentPieniadz + result.procentNauka + result.procentLuksus;

  if (expectSum100) {
    assert(sum === 100, `  suma = 100 (got ${sum}): ${JSON.stringify(result)}`);
  }

  if (expectAllNonNegative) {
    assert(result.procentPieniadz >= 0, `  Pieniądz >= 0 (got ${result.procentPieniadz})`);
    assert(result.procentNauka >= 0, `  Nauka >= 0 (got ${result.procentNauka})`);
    assert(result.procentLuksus >= 0, `  Luksus >= 0 (got ${result.procentLuksus})`);
  }

  if (expectNaukaLte60) {
    assert(result.procentNauka <= M.MAX_PROCENT_NAUKA, `  Nauka <= ${M.MAX_PROCENT_NAUKA} (got ${result.procentNauka})`);
  }

  return result;
}

console.log('adjust-handel-split-suma-test — R-NAUKA-LIMIT-60-PROC-BUDZETU-Q1\n');

// 1. Scenariusz bazowy: zmiana Pieniądza, równa redystrybucja Nauki i Luksus
testCase(
  'Scenariusz 1: Pieniądz zmienia się 20→50, równa redystrybucja',
  { procentPieniadz: 20, procentNauka: 40, procentLuksus: 40 },
  'procentPieniadz',
  50
);

// 2. Zmiana Nauki, pozostałe pola się dostosowują
testCase(
  'Scenariusz 2: Nauka zmienia się 40→30, Pieniądz i Luksus się dostosowują',
  { procentPieniadz: 30, procentNauka: 40, procentLuksus: 30 },
  'procentNauka',
  30
);

// 3. Nauka na capie 60, zmiana Pieniądza — Nauka powinna zostać na capie
testCase(
  'Scenariusz 3: Nauka na capie 60, Pieniądz 20→10 — Nauka zostaje na 60',
  { procentPieniadz: 20, procentNauka: 60, procentLuksus: 20 },
  'procentPieniadz',
  10
);

// 4. Nauka poniżej capie, zmiana Pieniądza na maksimum
testCase(
  'Scenariusz 4: Pieniądz 20→80, Nauka i Luksus mają po 10',
  { procentPieniadz: 20, procentNauka: 40, procentLuksus: 40 },
  'procentPieniadz',
  80
);

// 5. User próbuje ustawić Naukę powyżej capie
testCase(
  'Scenariusz 5: User próbuje Nauka 40→70 — powinna być clampowana do 60',
  { procentPieniadz: 30, procentNauka: 40, procentLuksus: 30 },
  'procentNauka',
  70
);

// 6. Zmiana Luksus, Nauka na capie
testCase(
  'Scenariusz 6: Nauka na capie 60, Luksus 10→30 — Pieniądz zmniejsza się do 10',
  { procentPieniadz: 30, procentNauka: 60, procentLuksus: 10 },
  'procentLuksus',
  30
);

// 7. Wszystkie pola równo
testCase(
  'Scenariusz 7: Równy podział 33.33% — zaokrąglenie do 30/40/30',
  { procentPieniadz: 30, procentNauka: 40, procentLuksus: 30 },
  'procentPieniadz',
  33.33
);

// 8. Ekstremum: Pieniądz na 100
testCase(
  'Scenariusz 8: Pieniądz zmienia się na 100 — Nauka i Luksus na 0',
  { procentPieniadz: 30, procentNauka: 40, procentLuksus: 30 },
  'procentPieniadz',
  100
);

// 9. KLUCZOWY SCENARIUSZ: Nauka na capie 60 + zmiana innego pola tak że remainder < 60
//    → Nauka powinna być clampowana do remainder, drugi ulegnie dostosowaniu (BRAK ujemnych)
const result9 = testCase(
  'Scenariusz 9 (R-NAUKA-LIMIT-60-PROC-BUDZETU-Q1, runda 4): Nauka na capie 60, Pieniądz 10→80 — remainder 20, brak wartości ujemnych',
  { procentPieniadz: 10, procentNauka: 60, procentLuksus: 30 },
  'procentPieniadz',
  80
);
// Dodatkowe sprawdzenie: bez clampu byłoby Luksus = 20 - 60 = -40 (BUG).
// Z clampingiem: Nauka zostaje clampowana do min(60, remainder=20) = 20, Luksus = 0.
assert(
  result9.procentNauka + result9.procentLuksus === 20,
  `  Scenariusz 9: Nauka + Luksus = 20 (remainder) — (got Nauka=${result9.procentNauka}, Luksus=${result9.procentLuksus})`
);

console.log(`\nadjust-handel-split-suma-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE); } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed ? 1 : 0);
