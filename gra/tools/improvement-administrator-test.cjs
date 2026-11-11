'use strict';
/**
 * improvement-administrator-test.cjs — R-WEB-IMPROVEMENT-ADMINISTRATOR-Q1 (decyzja właściciela ABC 2026-11-11).
 * (A) dane JSON (koszt 40, utrzymanie 2 = stawka tieru I; zero bonusów),
 * (B) logika: zatrudnienie/zwolnienie, max 1/miasto, brak środków, bez wymogu budynku, BRAK efektów pasywnych,
 * (C) finansowanie ze skarbca (wspólny budżet z administratorami miast), brak środków = nie pracuje, wznowienie,
 *     zmiana właściciela = koniec służby, utrzymanie wchodzi do sum,
 * (D) bramka auto-ulepszeń: gracz TYLKO z działającym administratorem; AI wg flagi JSON (domyślnie bez bramki),
 * (E) sondy tekstowe: wpięcie w main.ts (filtr EOT, hook UI, zapis/migracja), buildModeHud, bez gałęzi po ownerId.
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

console.log('(B) logika');
const mk = (over) => ({ id: 'c1', ownerId: 0, ...over });
ok(M.improvementAdministratorHireBlockReason(mk({}), 39) === 'brak_srodkow', '39 < 40 => brak środków');
ok(M.improvementAdministratorHireBlockReason(mk({}), 40) === null, '40 wystarcza (bez wymogu budynku administracyjnego)');
{
  const c = mk({});
  ok(M.hireImprovementAdministrator(c, 40, 7) === true && c.administratorUlepszen && c.administratorUlepszen.hiredTurn === 7 && c.administratorUlepszen.pracuje === true, 'zatrudnienie');
  ok(!c.administrator, 'administrator ulepszeń NIE jest administratorem miasta');
  ok(M.hireImprovementAdministrator(c, 500, 8) === false && M.improvementAdministratorHireBlockReason(c, 500) === 'ma_administratora', 'max 1 na miasto');
  ok(M.cityHasImprovementAdministrator(c) && M.cityHasWorkingImprovementAdministrator(c) && !M.cityHasAdministrator(c), 'stany: zatrudniony/pracuje, brak admina miasta');
  ok(M.improvementAdministratorUpkeepForCity(c) === 2, 'utrzymanie 2 gdy pracuje');
  // ZERO efektów pasywnych: efekty administratora miasta pozostają neutralne
  const e = M.administratorEffectsFor(c, ['palac_iii']);
  ok(!e.aktywny && e.korupcjaRedukcja === 0 && e.produkcjaMult === 1 && e.podatkiMult === 1, 'ZERO bonusów (korupcja/produkcja/podatki neutralne)');
  ok(M.dismissImprovementAdministrator(c) === true && !c.administratorUlepszen && M.dismissImprovementAdministrator(c) === false, 'zwolnienie (drugie = false)');
  const foreign = mk({ ownerId: 3, administratorUlepszen: { ownerId: 0, hiredTurn: 1, pracuje: true } });
  ok(!M.cityHasImprovementAdministrator(foreign) && !M.cityHasWorkingImprovementAdministrator(foreign), 'administrator poprzedniego właściciela nie działa');
}

console.log('(C) finansowanie ze skarbca państwa');
{
  const cities = [
    { id: 'a', ownerId: 0, administrator: { ownerId: 0, hiredTurn: 1, pracuje: true }, administratorUlepszen: { ownerId: 0, hiredTurn: 1, pracuje: true } },
    { id: 'b', ownerId: 0, administratorUlepszen: { ownerId: 0, hiredTurn: 1, pracuje: true } },
    { id: 'c', ownerId: 0, administratorUlepszen: { ownerId: 0, hiredTurn: 1, pracuje: true } },
  ];
  const built = new Map([['a', ['palac']]]); // admin miasta tier 1 = 2; + 3 x ulepszeń po 2 => 8
  let ch = M.refreshAdministratorState(cities, built, () => 8);
  ok(ch.length === 0 && cities[0].administrator.pracuje && cities.every(c => c.administratorUlepszen.pracuje), 'skarbiec 8 pokrywa 2 + 3x2 => wszyscy pracują');
  ok(M.totalAdministratorUpkeepForOwner(cities, built, 0) === 8, 'suma utrzymania (miasto + ulepszenia) = 8');
  ch = M.refreshAdministratorState(cities, built, () => 5);
  // kolejność: admin miasta (2): 5->3; ulepszeń a (2): 3->1; b (1<2) i c nie => pracuje tylko a
  ok(cities[0].administrator.pracuje && cities[0].administratorUlepszen.pracuje, 'finansowanie zachłanne: najpierw administrator miasta, potem ulepszeń w kolejności miast');
  ok(!cities[1].administratorUlepszen.pracuje && !cities[2].administratorUlepszen.pracuje, 'skarbiec 5: b i c nie pracują (brak środków)');
  ok(ch.length === 2 && ch.every(x => x.role === 'ulepszenia' && x.kind === 'stopped_no_funds'), 'zmiany: 2x stopped_no_funds z rolą ulepszenia');
  ok(cities[2].administratorUlepszen !== undefined, 'niepracujący ZOSTAJE przypisany');
  ch = M.refreshAdministratorState(cities, built, () => 0);
  ok(cities.every(c => !c.administratorUlepszen.pracuje) && !cities[0].administrator.pracuje, 'skarbiec 0 => nikt nie pracuje');
  ch = M.refreshAdministratorState(cities, built, () => 100);
  ok(cities.every(c => c.administratorUlepszen.pracuje) && ch.filter(x => x.kind === 'resumed' && x.role === 'ulepszenia').length === 3, 'skarbiec pokrywa => wznowienie (resumed)');
  cities[2].administratorUlepszen.pracuje = false;
  ok(M.totalAdministratorUpkeepForOwner(cities, built, 0) === 6 && M.totalAdministratorUpkeepIfAllWorkForOwner(cities, built, 0) === 8, 'niepracujący nie płaci (6), prognoza 8');
  const city2 = { id: 'm', ownerId: 5, administratorUlepszen: { ownerId: 0, hiredTurn: 1, pracuje: true } };
  ch = M.refreshAdministratorState([city2], new Map(), () => 100);
  ok(!city2.administratorUlepszen && ch.length === 1 && ch[0].kind === 'ended_owner_changed' && ch[0].role === 'ulepszenia', 'zdobycie miasta => koniec służby administratora ulepszeń');
  const city3 = { id: 'n', ownerId: 0, administratorUlepszen: { ownerId: 0, hiredTurn: 1, pracuje: true } };
  ch = M.refreshAdministratorState([city3], new Map([['n', []]]), () => 100);
  ok(city3.administratorUlepszen && ch.length === 0, 'brak budynku administracyjnego NIE kończy służby administratora ulepszeń');
}

console.log('(D) bramka auto-ulepszeń');
{
  const G = M.isCityAutoImprovementAllowed;
  const humans = [0];
  ok(G(0, humans, true, true) === true, 'gracz + opcja ON + pracujący administrator => wolno');
  ok(G(0, humans, true, false) === false, 'gracz + opcja ON + BEZ administratora => nie wolno (wszystko ręcznie)');
  ok(G(0, humans, false, true) === false, 'opcja globalna OFF => nie wolno');
  ok(G(7, humans, true, false) === true, 'AI bez bramki (flaga false)');
  ok(G(7, humans, true, false, true) === false && G(7, humans, true, true, true) === true, 'AI z flagą aiRequires => też wymaga');
  ok(G(1, [0, 1], true, false) === false, 'hot-seat: drugi fotel człowieka też podlega bramce');
}

console.log('(F) behawioralnie: ten sam świat z administratorem i bez, brak środków, migracja');
{
  const humans = [0];
  const mkWorld = () => [
    { id: 'a', ownerId: 0, tryb: 'auto' },
    { id: 'b', ownerId: 0, tryb: 'auto' },
    { id: 'm', ownerId: 0, tryb: 'manual' },
    { id: 'ai', ownerId: 7, tryb: 'auto' },
  ];
  const select = (world, seat) => M.selectCitiesForAutoImprovement(
    world, seat, true,
    c => M.isCityAutoImprovementAllowed(c.ownerId, humans, true, M.cityHasWorkingImprovementAdministrator(c), false),
    c => c.tryb === 'auto').map(c => c.id).join(',');
  const without = mkWorld();
  ok(select(without, 0) === '', 'BEZ administratora: zero miast gracza w auto-ulepszeniach (wszystko ręcznie)');
  const withAdm = mkWorld();
  M.hireImprovementAdministrator(withAdm[0], 40, 1);
  M.refreshAdministratorState(withAdm, new Map(), () => 100);
  ok(select(withAdm, 0) === 'a', 'Z administratorem w mieście a: tylko a (b bez, m ręczne)');
  M.refreshAdministratorState(withAdm, new Map(), () => 0);
  ok(withAdm[0].administratorUlepszen && withAdm[0].administratorUlepszen.pracuje === false && select(withAdm, 0) === '', 'brak środków: administrator przypisany, ale nie pracuje => automat wyłączony');
  M.refreshAdministratorState(withAdm, new Map(), () => 100);
  ok(select(withAdm, 0) === 'a', 'skarbiec wraca => automat wraca');
  ok(select(withAdm, 7) === 'ai', 'AI bez bramki (flaga false)');
  ok(M.shouldShowImprovementAdminMigration(false, 2) === true, 'migracja: flaga niepokazana + miasta bez admina => pokaż');
  ok(M.shouldShowImprovementAdminMigration(true, 2) === false && M.shouldShowImprovementAdminMigration(false, 0) === false, 'migracja: pokazana albo brak miast => nie pokazuj');
  const metaCityTrue = { cityAdministratorNoticeShown: true };
  ok(M.shouldShowImprovementAdminMigration(metaCityTrue.improvementAdministratorNoticeShown === true, 1) === true, 'zapis z cityAdministratorNoticeShown=true i bez flagi ulepszeń => powiadomienie pokazane');
}

console.log('(E) sondy wpięcia');
const main = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
const hud = fs.readFileSync(path.join(SRC, 'ui', 'buildModeHud.ts'), 'utf8');
ok(/selectCitiesForAutoImprovement\(\s*cities, hOid,[\s\S]{0,400}isCityAutoImprovementActive,/.test(main), 'main.ts: filtr miast auto-ulepszeń EOT = selectCitiesForAutoImprovement z bramką administratora ulepszeń');
ok(/improvementAdministratorNoticeShown = saved\.meta\?\.improvementAdministratorNoticeShown === true/.test(main) && /shouldShowImprovementAdminMigration\(improvementAdministratorNoticeShown/.test(main) && /^\s*improvementAdministratorNoticeShown,$/m.test(main), 'main.ts: OSOBNA flaga migracji ulepszeń (zapis/odczyt/użycie)');
const migBlock = main.slice(main.indexOf('if (!cityAdministratorNoticeShown) {'), main.indexOf("fogRevealKeyFEnabled = fogRevealKeyFFromSaveMeta"));
ok(!/city-impadmin-migration/.test(migBlock), 'main.ts: migracja ulepszeń NIE siedzi w bloku flagi administratora miasta');
ok(/isCityAutoImprovementAllowed\(\s*city\.ownerId, humanSeats\.humanOwnerIds, autoBuildEnabled,\s*cityHasWorkingImprovementAdministrator\(city\), aiRequiresImprovementAdministrator\(\)/.test(main), 'main.ts: bramka z flagą AI z JSON');
ok(/setOwnerTreasury\(city\.ownerId, treasury - improvementAdministratorHireCost\(\)\)/.test(main), 'main.ts: koszt zatrudnienia ze skarbca państwa');
ok(/getImprovementAdministratorState:/.test(main) && /onHireImprovementAdministrator:/.test(main) && /onDismissImprovementAdministrator:/.test(main), 'main.ts: panel ulepszeń dostaje haki');
ok(/city-impadmin-migration/.test(main) && /affectedImp/.test(main), 'main.ts: jednorazowe powiadomienie migracyjne (stare zapisy z auto-ulepszeniami)');
ok(/pendingAdministratorChanges\.set\(pKey, ch\)/.test(main), 'main.ts: kolejka powiadomień rozróżnia role');
ok(/impAdminState:/.test(main) && /impAdminHire:/.test(main), 'main.ts: haki testowe ?civTest=1');
ok(/data-imp-admin-hire/.test(hud) && /data-imp-admin-dismiss/.test(hud) && /variant: 'improvements'/.test(hud), 'buildModeHud: przycisk zatrudnij/zwolnij + ikona wariantu ulepszeń');
ok(/AUTO_IMPROVE_NEEDS_ADMINISTRATOR_HINT/.test(hud), 'buildModeHud: podpowiedź o wymogu administratora');
const lib = fs.readFileSync(path.join(SRC, 'game', 'city-administrator.ts'), 'utf8');
const impBlock = lib.slice(lib.indexOf('ADMINISTRATOR ULEPSZEŃ'), lib.indexOf('Utrzymanie administratora tego miasta'));
ok(!/ownerId\s*===\s*\d/.test(impBlock), 'city-administrator.ts: brak gałęzi po stałym ownerId w logice administratora ulepszeń');
const cities = fs.readFileSync(path.join(SRC, 'game', 'cities.ts'), 'utf8');
ok(/administratorUlepszen\?: CityAdministrator/.test(cities), 'cities.ts: pole City.administratorUlepszen (opcjonalne => stary zapis = brak)');

console.log('\n' + 'improvement-administrator-test: ' + passed + ' passed, ' + failed + ' failed');
fs.rmSync(temp, { recursive: true, force: true });
process.exit(failed ? 1 : 0);
