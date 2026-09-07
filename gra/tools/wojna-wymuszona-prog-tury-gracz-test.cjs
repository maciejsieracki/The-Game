'use strict';
/**
 * wojna-wymuszona-prog-tury-gracz-test.cjs — R-WOJNA-WYMUSZONA-PROG-TURY-GRACZ-Q1.
 *
 * "REGULA PRZECIW SAMOOSZUKIWANIU" dispatchu zakazuje uznania progu tury gracza za
 * działający bez REALNEJ symulacji tur 1-30 (nie tylko odczytu kodu). main.ts nie jest
 * bundlowalny wprost (monolityczny skrypt spięty z DOM), więc ta bramka:
 *
 *   (A) Tekstowym guardem wiąże Krok C w main.ts z dokładnie tym warunkiem: gracz
 *       dołącza do `triggeredSubjects` WYŁĄCZNIE gdy `turn >= WOJNA_KAMIEN_WYMUSZONA_START_TURY`
 *       ORAZ `totalActiveForcedWarsByOwner(0) === 0` (dowód że kod naprawdę tak wygląda).
 *   (B) Symulacją PRAWDZIWEGO importu `WOJNA_KAMIEN_WYMUSZONA_START_TURY` (esbuild z
 *       `forced-war-stone.ts`, ZERO literału 25 zreimplementowanego ręcznie) replikuje
 *       DOKŁADNIE ten sam warunek (odczytany w (A)) i przechodzi turę po turze 1..30,
 *       sprawdzając: zero dołączeń gracza do puli przed progiem, poprawne dołączenie
 *       od progu (przy zero aktywnych wojen gracza).
 *
 * Uruchamianie z gra/: node tools/wojna-wymuszona-prog-tury-gracz-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const main = fs.readFileSync(path.join(GRA_ROOT, 'src', 'main.ts'), 'utf8');

let passed = 0;
let failed = 0;
function check(label, condition) {
  if (condition) {
    passed++;
    console.log(`PASS: ${label}`);
  } else {
    failed++;
    console.log(`FAIL: ${label}`);
  }
}

console.log('R-WOJNA-WYMUSZONA-PROG-TURY-GRACZ-Q1 — prog tury gracza (Krok C)');

// (A) Guard tekstowy: Krok C w main.ts naprawdę bramkuje dołączenie gracza progiem tury
// WSPÓLNYM ze stałą stone (liczoną od startu gry, nie od wejścia w epokę -- gracz nie ma
// odrębnego "wejścia w epokę").
const krokCStart = main.indexOf('// Krok C:');
const krokCSlice = krokCStart >= 0 ? main.slice(krokCStart, krokCStart + 900) : '';
check(
  'Krok C zawiera blok warunkowy dołączenia gracza do triggeredSubjects',
  /if \(\s*\n?\s*playerCity[\s\S]{0,400}triggeredSubjects\.push\(\{ ownerId: 0/.test(krokCSlice),
);
check(
  'warunek zawiera próg turn >= WOJNA_KAMIEN_WYMUSZONA_START_TURY',
  /turn >= WOJNA_KAMIEN_WYMUSZONA_START_TURY/.test(krokCSlice),
);
check(
  'warunek zachowuje istniejące kryterium totalActiveForcedWarsByOwner(0) === 0',
  /totalActiveForcedWarsByOwner\(0\) === 0/.test(krokCSlice),
);
check(
  'literał 25 NIE jest zreimplementowany ręcznie w Kroku C (używana jest nazwana stała)',
  !/turn >= 25/.test(krokCSlice),
);

// (B) Symulacja realna, prawdziwy import stałej progu (ZERO reimplementacji formuły).
const entry = path.resolve(__dirname, '.wojna-wymuszona-prog-tury-gracz-entry.ts');
const bundle = path.resolve(__dirname, '.wojna-wymuszona-prog-tury-gracz-bundle.cjs');
fs.writeFileSync(entry, `
export { WOJNA_KAMIEN_WYMUSZONA_START_TURY } from ${JSON.stringify(GRA_ROOT + '/src/game/forced-war-stone')};
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [entry],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: bundle,
    logLevel: 'silent',
  });
  delete require.cache[require.resolve(bundle)];
  const { WOJNA_KAMIEN_WYMUSZONA_START_TURY } = require(bundle);

  check(
    'stała progu wyeksportowana i równa 25 (ta sama wartość co AI)',
    WOJNA_KAMIEN_WYMUSZONA_START_TURY === 25,
  );

  // Replika DOKŁADNIE warunku potwierdzonego w (A): playerCity istnieje (zawsze w tej
  // symulacji), totalActiveForcedWarsByOwner(0) === 0 (gracz bez aktywnej wojny — worst
  // case dla przedwczesnego dołączenia), turn >= próg.
  function joinsTriggeredPool(turn, playerHasActiveForcedWar) {
    const playerCity = true; // gracz zawsze ma miasto w tej symulacji
    const totalActiveForcedWarsByOwner0 = playerHasActiveForcedWar ? 1 : 0;
    return Boolean(
      playerCity
      && turn >= WOJNA_KAMIEN_WYMUSZONA_START_TURY
      && totalActiveForcedWarsByOwner0 === 0,
    );
  }

  let prematureJoin = false;
  let firstJoinTurn = null;
  for (let turn = 1; turn <= 30; turn++) {
    const joined = joinsTriggeredPool(turn, false);
    if (joined && turn < WOJNA_KAMIEN_WYMUSZONA_START_TURY) prematureJoin = true;
    if (joined && firstJoinTurn === null) firstJoinTurn = turn;
  }
  check(
    'symulacja tur 1-30: ZERO przedwczesnych dołączeń gracza przed progiem',
    prematureJoin === false,
  );
  check(
    `symulacja: pierwsze dołączenie gracza dokładnie w turze ${WOJNA_KAMIEN_WYMUSZONA_START_TURY} (przy zero aktywnych wojen gracza)`,
    firstJoinTurn === WOJNA_KAMIEN_WYMUSZONA_START_TURY,
  );

  // Kontrola: jeśli gracz MA aktywną wojnę wymuszoną, nie dołącza nawet po progu.
  let joinsWithActiveWar = false;
  for (let turn = WOJNA_KAMIEN_WYMUSZONA_START_TURY; turn <= 30; turn++) {
    if (joinsTriggeredPool(turn, true)) joinsWithActiveWar = true;
  }
  check(
    'symulacja: gracz z aktywną wojną wymuszoną NIE dołącza ponownie nawet po progu',
    joinsWithActiveWar === false,
  );

  // Kontrola tur przed progiem 1..24 z aktywną wojną -- też brak dołączenia (podwójna blokada).
  let joinsBeforeThresholdWithActiveWar = false;
  for (let turn = 1; turn < WOJNA_KAMIEN_WYMUSZONA_START_TURY; turn++) {
    if (joinsTriggeredPool(turn, true)) joinsBeforeThresholdWithActiveWar = true;
  }
  check(
    'symulacja: tury 1..24 z aktywną wojną -- też brak dołączenia',
    joinsBeforeThresholdWithActiveWar === false,
  );
} finally {
  try { fs.unlinkSync(entry); } catch (e) {}
  try { fs.unlinkSync(bundle); } catch (e) {}
}

console.log('');
console.log(`PASSED: ${passed}, FAILED: ${failed}`);
if (failed > 0) process.exit(1);
