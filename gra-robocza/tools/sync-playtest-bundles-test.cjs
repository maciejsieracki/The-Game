/**
 * Zywy test sync-playtest-bundles.cjs (P-REPO-2-BUNDLE-NIEODTWARZALNE-Q1, GOAL 4).
 * Uruchamia PRAWDZIWY skrypt (kopia pliku, nie reimplementacja) w izolowanym katalogu
 * tymczasowym (os.tmpdir()) na kopii biezacego gra-robocza/Gra-ROBOCZA.html — zero zapisu
 * w drzewie repo, zero ryzyka scommitowania wielomegabajtowych bundli poza allowlista.
 * Sprawdza, ze WSZYSTKICH OSIEM nazw (w tym przywrocone BITWA-DUZA/OBLEZENIE-DUZE) powstaje
 * i md5 kazdej rowna sie md5 zrodlowego Gra-ROBOCZA.html.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const REAL_MAIN = path.join(REPO_ROOT, 'gra-robocza', 'Gra-ROBOCZA.html');
const REAL_SCRIPT = path.join(__dirname, 'sync-playtest-bundles.cjs');

function md5(p) {
  return crypto.createHash('md5').update(fs.readFileSync(p)).digest('hex');
}

if (!fs.existsSync(REAL_MAIN)) {
  console.error('BRAK zrodla:', REAL_MAIN);
  process.exit(1);
}
if (!fs.existsSync(REAL_SCRIPT)) {
  console.error('BRAK skryptu:', REAL_SCRIPT);
  process.exit(1);
}

const EXPECTED_NAMES = [
  'Gra-ROBOCZA-PLAYTEST-WALKA.html',
  'Gra-ROBOCZA-PLAYTEST-ODSKOK.html',
  'Gra-ROBOCZA-PLAYTEST-ODSKOK-OBLEZENIE.html',
  'Gra-ROBOCZA-PLAYTEST-OBLEZENIE-3v3.html',
  'Gra-ROBOCZA-PLAYTEST-MAPA.html',
  'Gra-ROBOCZA-PLAYTEST-MIASTO.html',
  'Gra-ROBOCZA-PLAYTEST-BITWA-DUZA.html',
  'Gra-ROBOCZA-PLAYTEST-OBLEZENIE-DUZE.html',
];

let tmpRoot;
let pass = 0;
let fail = 0;
try {
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-playtest-test-'));
  const tmpGraRobocza = path.join(tmpRoot, 'gra-robocza');
  const tmpTools = path.join(tmpGraRobocza, 'tools');
  fs.mkdirSync(tmpTools, { recursive: true });
  fs.copyFileSync(REAL_MAIN, path.join(tmpGraRobocza, 'Gra-ROBOCZA.html'));
  fs.copyFileSync(REAL_SCRIPT, path.join(tmpTools, 'sync-playtest-bundles.cjs'));

  execFileSync('node', [path.join(tmpTools, 'sync-playtest-bundles.cjs')], { stdio: 'pipe' });

  const expectedMd5 = md5(path.join(tmpGraRobocza, 'Gra-ROBOCZA.html'));

  for (const n of EXPECTED_NAMES) {
    const p = path.join(tmpGraRobocza, n);
    if (!fs.existsSync(p)) {
      console.error('FAIL: plik nie powstal:', n);
      fail++;
      continue;
    }
    const m = md5(p);
    if (m !== expectedMd5) {
      console.error('FAIL: md5 niezgodny:', n, m, '!=', expectedMd5);
      fail++;
      continue;
    }
    console.log('OK', n, m);
    pass++;
  }

  // Dowod nietautologicznosci: skrypt SPRZED tego tematu (6 nazw) na tych samych
  // EXPECTED_NAMES (8) MUSI dac FAIL dla obu przywroconych nazw — inaczej test niczego
  // nie odroznia.
  const oldScript = `'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const main = path.join(root, 'Gra-ROBOCZA.html');
const names = [
  'Gra-ROBOCZA-PLAYTEST-WALKA.html',
  'Gra-ROBOCZA-PLAYTEST-ODSKOK.html',
  'Gra-ROBOCZA-PLAYTEST-ODSKOK-OBLEZENIE.html',
  'Gra-ROBOCZA-PLAYTEST-OBLEZENIE-3v3.html',
  'Gra-ROBOCZA-PLAYTEST-MAPA.html',
  'Gra-ROBOCZA-PLAYTEST-MIASTO.html',
];
for (const n of names) { fs.copyFileSync(main, path.join(root, n)); }
`;
  const tmpRoot2 = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-playtest-mutation-'));
  const tmpGraRobocza2 = path.join(tmpRoot2, 'gra-robocza');
  const tmpTools2 = path.join(tmpGraRobocza2, 'tools');
  fs.mkdirSync(tmpTools2, { recursive: true });
  fs.copyFileSync(REAL_MAIN, path.join(tmpGraRobocza2, 'Gra-ROBOCZA.html'));
  fs.writeFileSync(path.join(tmpTools2, 'sync-playtest-bundles.cjs'), oldScript);
  execFileSync('node', [path.join(tmpTools2, 'sync-playtest-bundles.cjs')], { stdio: 'pipe' });
  const missing = EXPECTED_NAMES.filter(
    (n) => !fs.existsSync(path.join(tmpGraRobocza2, n))
  );
  if (missing.length === 2 && missing.includes('Gra-ROBOCZA-PLAYTEST-BITWA-DUZA.html') &&
      missing.includes('Gra-ROBOCZA-PLAYTEST-OBLEZENIE-DUZE.html')) {
    console.log('OK mutacja: skrypt sprzed tematu poprawnie NIE tworzy obu przywroconych nazw (test nie jest tautologiczny)');
    pass++;
  } else {
    console.error('FAIL mutacja: oczekiwano dokladnie 2 brakujacych plikow (BITWA-DUZA, OBLEZENIE-DUZE), dostano:', missing);
    fail++;
  }
  fs.rmSync(tmpRoot2, { recursive: true, force: true });
} finally {
  if (tmpRoot) fs.rmSync(tmpRoot, { recursive: true, force: true });
}

console.log(`=== WYNIK: ${pass}/${pass + fail} ===`);
process.exit(fail === 0 ? 0 : 1);
