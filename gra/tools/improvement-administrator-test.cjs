'use strict';
/**
 * improvement-administrator-test.cjs — R-WEB-IMPROVEMENT-ADMINISTRATOR-Q1 + R-WEB-ADMIN-PANSTWO-MIASTO-TWO-TYPES-Q1.
 * Model (rew. 4): ADMINISTRATOR PAŃSTWA (ulepszenia terenu) jest STANEM NA WŁAŚCICIELU (`stateAdmByOwner`),
 * nie na mieście. Jeden koszt zatrudnienia i jedno utrzymanie na Państwo; działa we wszystkich miastach gracza.
 * (A) dane JSON (koszt 40, utrzymanie 2 = stawka tieru I; zero bonusów),
 * (B) logika Państwa: zatrudnienie, max 1 na Państwo, brak środków, bez wymogu budynku, BRAK efektów pasywnych,
 * (C) finansowanie ze skarbca (wspólny budżet z administratorem miasta), brak środków = nie pracuje, wznowienie,
 *     zmiana właściciela = koniec służby, utrzymanie RAZ na Państwo,
 * (D) bramka auto-ulepszeń: gracz TYLKO z działającym administratorem Państwa; AI wg flagi JSON,
 * (E) sondy wpięcia w main.ts / UI, (F) behawioralnie: miasto B dostaje ulepszenia; migracja starego zapisu,
 * (G) administrator miasta buduje tylko w swoim mieście (funkcje per miasto bez zmian).
 * Run z gra/:  node tools/improvement-administrator-test.cjs
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA = path.resolve(__dirname, '..');
const SRC = path.resolve(GRA, 'src');

let passed = 0, failed = 0;
function ok(c, m) { if (c) { passed++; console.log('  [OK] ' + m); } else { failed++; console.error('  [FAIL] ' + m); } }

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'imp-admin-'));
const entry = path.join(temp, 'entry.ts'), bundle = path.join(temp, 'bundle.cjs');
fs.writeFileSync(entry,
  `export * from ${JSON.stringify(SRC + '/game/city-administrator')};\n` +
  `export * from ${JSON.stringify(SRC + '/game/auto-build-gate')};\n`);
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: bundle,
  loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: GRA, logLevel: 'error' });
const M = require(bundle);

console.log('(A) dane JSON');
const P = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'city-administrator-params.json'), 'utf8'));
const I = P.administrator_ulepszen;
ok(!!I, 'sekcja administrator_ulepszen w JSON');
ok(I.koszt_zatrudnienia_pieniadz === P.koszt_zatrudnienia_pieniadz && I.koszt_zatrudnienia_pieniadz === 40, 'ten sam koszt zatrudnienia co administrator miasta (40)');
ok(I.utrzymanie_pieniadz_na_ture === P.utrzymanie_pieniadz_na_ture_wg_tieru['1'] && I.utrzymanie_pieniadz_na_ture === 2, 'utrzymanie = stawka tieru I (2/turę)');
ok(I.ai_wymaga_administratora === false, 'AI domyślnie bez bramki (flaga w JSON)');
ok(M.improvementAdministratorHireCost() === 40 && M.improvementAdministratorUpkeep() === 2, 'API czyta wartości z JSON');

console.log('(B) logika administratora PAŃSTWA (stan na właścicielu)');
{
  ok(M.ownerHasStateImprovementAdministrator(undefined, 0) === false, 'brak stanu => brak administratora Państwa');
  ok(M.ownerImprovementAdministratorHireBlockReason(undefined, 0, 39) === 'brak_srodkow', '39 < 40 => brak środków');
  ok(M.ownerImprovementAdministratorHireBlockReason(undefined, 0, 40) === null, '40 wystarcza (bez wymogu budynku administracyjnego)');
  const h = M.hireOwnerImprovementAdministrator(undefined, 0, 40, 7);
  ok(h && h.ownerId === 0 && h.hiredTurn === 7 && h.pracuje === true, 'zatrudnienie na Państwo (stan pracuje)');
  ok(M.hireOwnerImprovementAdministrator(h, 0, 500, 8) === null && M.ownerImprovementAdministratorHireBlockReason(h, 0, 500) === 'ma_administratora', 'max 1 na Państwo');
  ok(M.ownerHasStateImprovementAdministrator(h, 0) && M.ownerHasWorkingStateImprovementAdministrator(h, 0), 'stan: zatrudniony i pracuje');
  ok(M.ownerImprovementAdministratorUpkeep(h, 0) === 2 && M.ownerImprovementAdministratorUpkeep(undefined, 0) === 0, 'utrzymanie 2 gdy pracuje, 0 bez administratora');
  // ZERO efektów pasywnych: efekty administratora miasta pozostają neutralne także przy budynku administracyjnym
  const e = M.administratorEffectsFor({ id: 'c1', ownerId: 0 }, ['palac_iii']);
  ok(!e.aktywny && e.korupcjaRedukcja === 0 && e.produkcjaMult === 1 && e.podatkiMult === 1, 'ZERO bonusów (korupcja/produkcja/podatki neutralne)');
  ok(M.ownerHasStateImprovementAdministrator(h, 3) === false && M.ownerHasWorkingStateImprovementAdministrator(h, 3) === false, 'administrator Państwa poprzedniego właściciela nie działa');
  ok(M.ownerImprovementAdministratorUpkeep(h, 3) === 0, 'obcy właściciel nie płaci za cudzego administratora');
}

console.log('(C) finansowanie ze skarbca państwa (administrator miasta + JEDEN administrator Państwa)');
{
  // miasto 'a' ma administratora miasta (palac = tier 1 = utrzymanie 2); 'b','c' bez; Państwo 0 ma administratora (2)
  const cities = [
    { id: 'a', ownerId: 0, administrator: { ownerId: 0, hiredTurn: 1, pracuje: true } },
    { id: 'b', ownerId: 0 },
    { id: 'c', ownerId: 0 },
  ];
  const built = new Map([['a', ['palac']]]);
  const st = new Map([[0, { ownerId: 0, hiredTurn: 1, pracuje: true }]]);
  let ch = M.refreshAdministratorState(cities, built, () => 4, st);
  ok(ch.length === 0 && cities[0].administrator.pracuje && st.get(0).pracuje, 'skarbiec 4 pokrywa 2 (miasto) + 2 (Państwo) => oba pracują');
  ok(M.totalAdministratorUpkeepForOwner(cities, built, 0, st.get(0)) === 4, 'suma utrzymania = 4 (miasto + JEDNO Państwo)');
  ok(M.totalAdministratorUpkeepForOwner(cities, built, 0) === 2, 'bez stanu Państwa suma = tylko miasto (2)');
  ch = M.refreshAdministratorState(cities, built, () => 3, st);
  ok(cities[0].administrator.pracuje && !st.get(0).pracuje, 'skarbiec 3: najpierw administrator miasta (2), Państwo nie pracuje');
  ok(ch.length === 1 && ch[0].role === 'ulepszenia' && ch[0].kind === 'stopped_no_funds' && ch[0].city.id === 'a', 'zmiana: stopped_no_funds z rolą ulepszenia');
  ok(st.get(0) !== undefined, 'niepracujący administrator Państwa ZOSTAJE przypisany');
  ok(M.totalAdministratorUpkeepForOwner(cities, built, 0, st.get(0)) === 2 && M.totalAdministratorUpkeepIfAllWorkForOwner(cities, built, 0, st.get(0)) === 4, 'niepracujący nie płaci (2), prognoza 4');
  ch = M.refreshAdministratorState(cities, built, () => 0, st);
  ok(!cities[0].administrator.pracuje && !st.get(0).pracuje, 'skarbiec 0 => nikt nie pracuje');
  ch = M.refreshAdministratorState(cities, built, () => 100, st);
  ok(cities[0].administrator.pracuje && st.get(0).pracuje && ch.filter(x => x.kind === 'resumed').length === 2, 'skarbiec pokrywa => wznowienie (miasto i Państwo)');
  // zmiana właściciela Państwa => koniec służby
  const st2 = new Map([[0, { ownerId: 7, hiredTurn: 1, pracuje: true }]]);
  ch = M.refreshAdministratorState([{ id: 'z', ownerId: 0 }], new Map(), () => 100, st2);
  ok(!st2.has(0) && ch.length === 1 && ch[0].kind === 'ended_owner_changed' && ch[0].role === 'ulepszenia', 'stan Państwa z innym ownerId => koniec służby');
  // brak budynku administracyjnego NIE kończy służby administratora Państwa
  const st3 = new Map([[0, { ownerId: 0, hiredTurn: 1, pracuje: true }]]);
  ch = M.refreshAdministratorState([{ id: 'n', ownerId: 0 }], new Map([['n', []]]), () => 100, st3);
  ok(st3.has(0) && ch.length === 0, 'brak budynku administracyjnego NIE kończy służby administratora Państwa');
  // utrzymanie liczone RAZ na Państwo, nie na każde miasto
  const many = [{ id: 'p1', ownerId: 0 }, { id: 'p2', ownerId: 0 }, { id: 'p3', ownerId: 0 }];
  const stM = new Map([[0, { ownerId: 0, hiredTurn: 1, pracuje: true }]]);
  ok(M.totalAdministratorUpkeepForOwner(many, new Map(), 0, stM.get(0)) === 2, 'Państwo z 3 miastami płaci utrzymanie RAZ (2)');
  // finansowanie: budżet 1 => nie pracuje, budżet nietknięty; budżet 5 => wznowienie
  const f1 = M.fundOwnerImprovementAdministrator(st3.get(0), 0, 1);
  ok(f1.adm.pracuje === false && f1.budgetLeft === 1 && f1.stopped === true, 'budżet 1 => nie pracuje, budżet nietknięty');
  const f2 = M.fundOwnerImprovementAdministrator(f1.adm, 0, 5);
  ok(f2.adm.pracuje === true && f2.budgetLeft === 3 && f2.resumed === true, 'budżet 5 => wznowienie, zużycie 2');
}

console.log('(D) bramka auto-ulepszeń');
{
  const G = M.isCityAutoImprovementAllowed;
  const humans = [0];
  ok(G(0, humans, true, true) === true, 'gracz + opcja ON + pracujący administrator Państwa => wolno');
  ok(G(0, humans, true, false) === false, 'gracz + opcja ON + BEZ administratora Państwa => nie wolno');
  ok(G(0, humans, false, true) === false, 'opcja globalna OFF => nie wolno');
  ok(G(7, humans, true, false) === true, 'AI bez bramki (flaga false)');
  ok(G(7, humans, true, false, true) === false && G(7, humans, true, true, true) === true, 'AI z flagą aiRequires => też wymaga');
  ok(G(1, [0, 1], true, false) === false, 'hot-seat: drugi fotel człowieka też podlega bramce');
}

console.log('(F) behawioralnie: administrator Państwa odblokowuje auto-ulepszenia we WSZYSTKICH miastach gracza');
{
  const humans = [0];
  const mkWorld = () => [
    { id: 'a', ownerId: 0, tryb: 'auto' },
    { id: 'b', ownerId: 0, tryb: 'auto' },
    { id: 'm', ownerId: 0, tryb: 'manual' },
    { id: 'ai', ownerId: 7, tryb: 'auto' },
  ];
  const select = (world, seat, st) => M.selectCitiesForAutoImprovement(
    world, seat, true,
    c => M.isCityAutoImprovementAllowed(c.ownerId, humans, true, M.ownerHasWorkingStateImprovementAdministrator(st.get(c.ownerId), c.ownerId), false),
    c => c.tryb === 'auto').map(c => c.id).join(',');
  const noStateWorld = mkWorld();
  ok(select(noStateWorld, 0, new Map()) === '', 'BEZ administratora Państwa: zero miast gracza w auto-ulepszeniach');
  const world = mkWorld();
  const st = new Map([[0, M.hireOwnerImprovementAdministrator(undefined, 0, 40, 1)]]);
  M.refreshAdministratorState(world, new Map(), () => 100, st);
  ok(select(world, 0, st) === 'a,b', 'Miasto B BEZ własnego administratora dostaje auto-ulepszenia (Państwo ma administratora); m ręczne');
  M.refreshAdministratorState(world, new Map(), () => 0, st);
  ok(st.get(0) && st.get(0).pracuje === false && select(world, 0, st) === '', 'brak środków: administrator przypisany, ale nie pracuje => automat wyłączony');
  M.refreshAdministratorState(world, new Map(), () => 100, st);
  ok(select(world, 0, st) === 'a,b', 'skarbiec wraca => automat wraca');
  ok(select(world, 7, st) === 'ai', 'AI bez bramki (flaga false)');
  // migracja starego zapisu: administrator państwa przypisany do miasta 'a' -> stan Państwa (koszt nie płacony ponownie)
  const legacy = [
    { id: 'a', ownerId: 0, tryb: 'auto', administratorUlepszen: { ownerId: 0, hiredTurn: 1, pracuje: true } },
    { id: 'b', ownerId: 0, tryb: 'auto' },
    { id: 'm', ownerId: 0, tryb: 'manual' },
    { id: 'ai', ownerId: 7, tryb: 'auto' },
  ];
  const mig = M.migrateCityImprovementAdministratorsToState(legacy);
  for (const id of mig.clearedCityIds) delete legacy.find(c => c.id === id).administratorUlepszen;
  const stLegacy = mig.byOwner;
  M.refreshAdministratorState(legacy, new Map(), () => 100, stLegacy);
  ok(select(legacy, 0, stLegacy) === 'a,b' && !legacy[0].administratorUlepszen, 'migracja: stary zapis => Państwo pracuje, miasto b też działa, pola miast wyczyszczone');
  ok(M.shouldShowImprovementAdminMigration(false, 2) === true, 'migracja: flaga niepokazana + miasta bez admina => pokaż');
  ok(M.shouldShowImprovementAdminMigration(true, 2) === false && M.shouldShowImprovementAdminMigration(false, 0) === false, 'migracja: pokazana albo brak miast => nie pokazuj');
}

console.log('(E) sondy wpięcia');
const main = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
const hud = fs.readFileSync(path.join(SRC, 'ui', 'buildModeHud.ts'), 'utf8');
ok(/selectCitiesForAutoImprovement\(\s*cities, hOid,[\s\S]{0,400}isCityAutoImprovementActive,/.test(main), 'main.ts: filtr miast auto-ulepszeń EOT = selectCitiesForAutoImprovement z bramką administratora państwa');
ok(/improvementAdministratorNoticeShown = saved\.meta\?\.improvementAdministratorNoticeShown === true/.test(main) && /shouldShowImprovementAdminMigration\(improvementAdministratorNoticeShown/.test(main) && /^\s*improvementAdministratorNoticeShown,$/m.test(main), 'main.ts: OSOBNA flaga migracji ulepszeń (zapis/odczyt/użycie)');
ok(/isCityAutoImprovementAllowed\(\s*city\.ownerId, humanSeats\.humanOwnerIds, administratorsEnabled,\s*ownerHasWorkingStateImprovementAdministrator\(stateAdmByOwner\.get\(city\.ownerId\), city\.ownerId\),\s*aiRequiresImprovementAdministrator\(\)/.test(main), 'main.ts: bramka = stan administratora Państwa właściciela + flaga AI z JSON');
ok(/stateAdmByOwner\.set\(city\.ownerId, next\)/.test(main) && !/cityHasWorkingImprovementAdministrator|cityHasImprovementAdministrator/.test(main), 'main.ts: zatrudnienie zapisuje stan na właścicielu (brak odwołań do stanu miasta)');
ok(/migrateCityImprovementAdministratorsToState\(cities\)/.test(main) && /stateImprovementAdministrators: \[/.test(main), 'main.ts: migracja starego zapisu wpięta w wczytywanie; stan Państwa w zapisie');
ok(/setOwnerTreasury\(city\.ownerId, treasury - improvementAdministratorHireCost\(\)\)/.test(main), 'main.ts: koszt zatrudnienia ze skarbca państwa');
ok(/getImprovementAdministratorState:/.test(main) && /onHireImprovementAdministrator:/.test(main) && /onDismissImprovementAdministrator:/.test(main), 'main.ts: panel ulepszeń dostaje haki');
ok(/city-impadmin-migration/.test(main) && /affectedImp/.test(main), 'main.ts: jednorazowe powiadomienie migracyjne (stare zapisy z auto-ulepszeniami)');
ok(/pendingAdministratorChanges\.set\(pKey, ch\)/.test(main), 'main.ts: kolejka powiadomień rozróżnia role');
ok(/impAdminState:/.test(main) && /impAdminHire:/.test(main), 'main.ts: haki testowe ?civTest=1');
ok(/data-imp-admin-hire/.test(hud) && /data-imp-admin-dismiss/.test(hud) && /variant: 'improvements'/.test(hud), 'buildModeHud: przycisk zatrudnij/zwolnij + ikona wariantu ulepszeń');
ok(/AUTO_IMPROVE_NEEDS_ADMINISTRATOR_HINT/.test(hud), 'buildModeHud: podpowiedź o wymogu administratora');
const lib = fs.readFileSync(path.join(SRC, 'game', 'city-administrator.ts'), 'utf8');
ok(!/ownerId\s*===\s*\d/.test(lib.slice(lib.indexOf('ADMINISTRATOR PAŃSTWA'))), 'city-administrator.ts: brak gałęzi po stałym ownerId w logice administratora Państwa');
const cities = fs.readFileSync(path.join(SRC, 'game', 'cities.ts'), 'utf8');
ok(/administratorUlepszen\?: CityAdministrator/.test(cities), 'cities.ts: pole City.administratorUlepszen (LEGACY, tylko migracja; opcjonalne)');

console.log('(G) administrator MIASTA buduje tylko w swoim mieście (funkcje per miasto)');
{
  const cityA = { id: 'x', ownerId: 0, administrator: { ownerId: 0, hiredTurn: 1, pracuje: true } };
  ok(M.cityHasWorkingAdministrator(cityA) === true && M.cityHasWorkingAdministrator({ id: 'y', ownerId: 0 }) === false, 'stan administratora miasta tylko w tym mieście');
  ok(M.cityHasWorkingAdministrator({ id: 'z', ownerId: 0, administrator: { ownerId: 9, hiredTurn: 1, pracuje: true } }) === false, 'administrator miasta obcego właściciela nie działa');
}

console.log('\n' + 'improvement-administrator-test: ' + passed + ' passed, ' + failed + ' failed');
fs.rmSync(temp, { recursive: true, force: true });
process.exit(failed ? 1 : 0);
