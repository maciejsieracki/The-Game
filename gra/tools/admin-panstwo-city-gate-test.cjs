'use strict';
/**
 * admin-panstwo-city-gate-test.cjs — R-WEB-ADMIN-PANSTWO-MIASTO-TWO-TYPES-Q1 (kryterium 3, test silnikowy bramki).
 * Miasto B bez własnego administratora w trybie auto dostaje auto-ulepszenia terenu, gdy Państwo ma
 * działającego administratora Państwa; bez niego — nie; administrator Państwa obcego właściciela nie działa.
 * Test używa TYCH SAMYCH funkcji co main.ts (isCityAutoImprovementAllowed + selectCitiesForAutoImprovement).
 * Run z gra/:  node tools/admin-panstwo-city-gate-test.cjs
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA = path.resolve(__dirname, '..');
const SRC = path.resolve(GRA, 'src');

let passed = 0, failed = 0;
function ok(c, m) { if (c) { passed++; console.log('  [OK] ' + m); } else { failed++; console.error('  [FAIL] ' + m); } }

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'adm-panstwo-gate-'));
const entry = path.join(temp, 'entry.ts'), bundle = path.join(temp, 'bundle.cjs');
fs.writeFileSync(entry,
  `export * from ${JSON.stringify(SRC + '/game/city-administrator')};\n` +
  `export * from ${JSON.stringify(SRC + '/game/auto-build-gate')};\n`);
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: bundle,
  loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: GRA, logLevel: 'error' });
const M = require(bundle);

const HUMAN = 0;
const humanOwnerIds = [HUMAN];
// Trzy miasta gracza; żadne nie ma własnego administratora (stan administratora jest na Państwie).
const cities = [
  { id: 'a', ownerId: HUMAN, mode: 'auto' },
  { id: 'b', ownerId: HUMAN, mode: 'auto' },
  { id: 'c', ownerId: HUMAN, mode: 'auto' },
];
const isAuto = c => c.mode === 'auto';

function selectFor(stateAdm, administratorsEnabled) {
  return M.selectCitiesForAutoImprovement(
    cities,
    HUMAN,
    true,
    c => M.isCityAutoImprovementAllowed(
      c.ownerId, humanOwnerIds, administratorsEnabled,
      M.ownerHasWorkingStateImprovementAdministrator(stateAdm, c.ownerId),
      false,
    ),
    isAuto,
  ).map(c => c.id);
}

console.log('(1) miasto B bez własnego administratora, Państwo z działającym administratorem Państwa');
const hired = M.hireOwnerImprovementAdministrator(undefined, HUMAN, 100, 1);
ok(!!hired && M.ownerHasWorkingStateImprovementAdministrator(hired, HUMAN), 'administrator Państwa zatrudniony i pracuje');
const withAdm = selectFor(hired, true);
ok(withAdm.includes('b'), 'miasto B (bez własnego administratora) objęte auto-ulepszeniami');
ok(withAdm.length === 3, 'wszystkie 3 miasta gracza w trybie auto objęte (' + withAdm.join(',') + ')');

console.log('(2) bez administratora Państwa — brak auto-ulepszeń');
const none = selectFor(undefined, true);
ok(none.length === 0, 'bez administratora Państwa żadne miasto nie jest objęte (wynik: ' + none.length + ')');

console.log('(3) opcja „Administratorzy” wyłączona — nawet przy administratorze Państwa brak auto-ulepszeń');
ok(selectFor(hired, false).length === 0, 'administratorsEnabled=false => brak auto-ulepszeń');

console.log('(4) administrator Państwa obcego właściciela nie działa w miastach gracza');
const foreign = M.hireOwnerImprovementAdministrator(undefined, 3, 100, 1);
ok(selectFor(foreign, true).length === 0, 'administrator Państwa właściciela 3 nie obejmuje miast właściciela 0');

console.log('(5) brak środków przy zatrudnieniu — administrator nie zatrudniony, brak auto-ulepszeń');
ok(M.hireOwnerImprovementAdministrator(undefined, HUMAN, 39, 1) === null, 'skarbiec 39 < koszt 40 => zatrudnienie zablokowane');
ok(selectFor(M.hireOwnerImprovementAdministrator(undefined, HUMAN, 39, 1), true).length === 0, 'bez zatrudnienia brak auto-ulepszeń');

console.log('(6) bez środków w turze — administrator przypisany, ale nie pracuje => brak auto-ulepszeń');
const funded = M.fundOwnerImprovementAdministrator(hired, HUMAN, 0);
ok(funded.adm && funded.adm.pracuje === false, 'budżet 0 => administrator nie pracuje');
ok(selectFor(funded.adm, true).length === 0, 'nie pracujący administrator nie uruchamia auto-ulepszeń');

console.log('');
console.log('RESULT: ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed === 0 ? 0 : 1);
