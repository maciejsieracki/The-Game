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

console.log('(7) granica administratora MIASTA: buduje tylko w swoim mieście (ta sama bramka co main.ts)');
const adminBld = M.administrativeBuildingIds()[0];
const cA = { id: 'A', ownerId: HUMAN, mode: 'auto' };
const cB = { id: 'B', ownerId: HUMAN, mode: 'auto' };
ok(M.hireAdministrator(cA, [adminBld], 1000, 1) === true, 'administrator miasta A zatrudniony (budynek administracyjny)');
const builtB7 = new Map([['A', [adminBld]], ['B', []]]);
M.refreshAdministratorState([cA, cB], builtB7, () => 1000, new Map());
ok(M.cityHasWorkingAdministrator(cA) === true, 'miasto A ma działającego administratora miasta');
ok(M.cityHasWorkingAdministrator(cB) === false, 'miasto B nie ma administratora miasta');
ok(M.isCityAutoBuildAllowed(HUMAN, humanOwnerIds, true, M.cityHasWorkingAdministrator(cA), false) === true, 'autobudowa w A dozwolona');
ok(M.isCityAutoBuildAllowed(HUMAN, humanOwnerIds, true, M.cityHasWorkingAdministrator(cB), false) === false, 'autobudowa w B zablokowana (administrator z A nie buduje w B)');
const stateOnly = M.hireOwnerImprovementAdministrator(undefined, HUMAN, 1000, 1);
ok(M.isCityAutoBuildAllowed(HUMAN, humanOwnerIds, true, M.cityHasWorkingAdministrator(cB), false) === false
  && M.ownerHasWorkingStateImprovementAdministrator(stateOnly, HUMAN) === true,
  'administrator Państwa NIE otwiera autobudowy budynków w B (tylko ulepszenia terenu)');

console.log('(8) migracja zapisu: administrator miasta -> Państwo (koszt raz)');
const migCities = [
  { id: 'X', ownerId: HUMAN, administratorUlepszen: { ownerId: HUMAN, hiredTurn: 5, pracuje: true } },
  { id: 'Y', ownerId: HUMAN, administratorUlepszen: { ownerId: HUMAN, hiredTurn: 7, pracuje: true } },
  { id: 'Z', ownerId: 3 },
];
const mig = M.migrateCityImprovementAdministratorsToState(migCities);
ok(mig.byOwner.size === 1 && mig.byOwner.get(HUMAN).hiredTurn === 5, 'jeden administrator Państwa (pierwsze miasto w kolejności tablicy)');
ok(mig.clearedCityIds.join(',') === 'X,Y', 'pola administratora ulepszeń miast X,Y oznaczone do wyczyszczenia');
ok(M.totalAdministratorUpkeepForOwner(migCities, new Map(), HUMAN, mig.byOwner.get(HUMAN)) === M.improvementAdministratorUpkeep(),
  'utrzymanie po migracji = jedno utrzymanie administratora Państwa (nie dwa)');
ok(M.migrateCityImprovementAdministratorsToState([{ id: 'Q', ownerId: HUMAN }]).byOwner.size === 0, 'brak administratora ulepszeń w zapisie => brak migracji');

console.log('(9) wpięcie w main.ts (test statyczny: regex na źródle, NIE wykonanie tury)');
const mainSrc = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
ok(/const stateAdmByOwner = new Map<number, CityAdministrator>\(\)/.test(mainSrc), 'stan Państwa: stateAdmByOwner (mapa per właściciel)');
ok(/function isCityAutoImprovementActive[\s\S]{0,300}?ownerHasWorkingStateImprovementAdministrator\(stateAdmByOwner\.get\(city\.ownerId\)/.test(mainSrc), 'bramka auto-ulepszeń czyta stan Państwa właściciela');
ok(/refreshAdministratorState\(cities, cityBuilt, ownerTreasury, stateAdmByOwner\)/.test(mainSrc), 'odświeżenie stanu przekazuje stateAdmByOwner');
ok(/hireOwnerImprovementAdministrator\(cur, city\.ownerId, treasury, turn\)/.test(mainSrc), 'zatrudnienie Państwa przez hireOwnerImprovementAdministrator');
ok(/stateImprovementAdministrators: \[\.\.\.stateAdmByOwner\.values\(\)\]/.test(mainSrc), 'zapis gry niesie stan administratora Państwa');
ok(/Array\.isArray\(savedStateAdm\)/.test(mainSrc) && /migrateCityImprovementAdministratorsToState\(cities\)/.test(mainSrc), 'wczytanie: gałąź zapisu nowego i gałąź migracji starego');
ok(/for \(const c of cities\) delete \(c as \{ administratorUlepszen\?: unknown \}\)\.administratorUlepszen;/.test(mainSrc), 'wczytanie kasuje pola administratora ulepszeń miast po migracji');
ok(/if \(!administratorsEnabled\) \{[\s\S]{0,600}?stateAdmByOwner\.delete\(o\)/.test(mainSrc), 'wczytanie przy OFF usuwa administratora Państwa gracza');
ok(!/effectiveUlepszeniaForCity\(c\)\.tryb/.test(mainSrc), 'Z4: w main.ts nie ma odczytu trybu automatyzacji per miasto');
ok(/c => ulepszeniaEmpireForOwner\(c\.ownerId\)\.tryb === 'auto'/.test(mainSrc), 'Z4: tryb auto z polityki Państwa właściciela (selectCitiesForAutoImprovement)');
ok(!/effectiveUlepszeniaForCity\(c as City\)\.(focus|pracaAutoPercent)/.test(mainSrc), 'Z4 r5: getFocus/getPracaBudgetPercent nie czytają override miasta');
ok(!/effectiveUlepszeniaForCity\(city as City\)\.(focus|pracaAutoPercent)/.test(mainSrc), 'Z4 r5: foodImprovementStages nie czyta override miasta');
ok(/getFocus: c => ulepszeniaEmpireForOwner\(\(c as City\)\.ownerId\)\.focus/.test(mainSrc), 'Z4 r5: getFocus z polityki Państwa');
ok(/getPracaBudgetPercent: c => ulepszeniaEmpireForOwner\(\(c as City\)\.ownerId\)\.pracaAutoPercent/.test(mainSrc), 'Z4 r5: getPracaBudgetPercent z polityki Państwa');
ok(/const policy = ulepszeniaEmpireForOwner\(\(city as City\)\.ownerId\);\s*return policy\.focus === 'zywnosc'/.test(mainSrc), 'Z4 r5: foodImprovementStages z polityki Państwa');

console.log('(10) override miasta nie zmienia wyboru automatu (tryb auto wg Państwa)');
{
  // Miasto z lokalnym override „ręczny” nadal jest objęte automatem, gdy tryb Państwa = auto.
  const overridden = { id: 'O', ownerId: HUMAN, mode: 'manual', ulepszeniaOverride: true, ulepszeniaTryb: 'reczny' };
  const empireTryb = 'auto';
  const picked = M.selectCitiesForAutoImprovement(
    [overridden], HUMAN, true,
    () => true,
    () => empireTryb === 'auto',
  ).map(c => c.id);
  ok(picked.includes('O'), 'miasto z override „ręczny” objęte automatem przy trybie Państwa auto');
}

console.log('');
console.log('RESULT: ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed === 0 ? 0 : 1);
