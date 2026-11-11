'use strict';
/**
 * R-WEB-SETTINGS-ADMINISTRATORS-WIZARD-Q1 — opcja „Administratorzy” w kreatorze nowej gry
 * (zastąpiła przełącznik „Automatyzacja budowy” z ustawień; R-WEB-SETTINGS-AUTOBUILD-TOGGLE-Q1).
 * (A) czysta bramka game/auto-build-gate.ts: OFF => brak automatyzacji gracza; ON => zasady CITY/IMPROVEMENT; AI bez zmian,
 * (B) dane: ui-params.json — „Administratorzy” w głównych ustawieniach kreatora, domyślnie „Wyłączone”, brak starego klucza,
 * (C) sondy tekstowe: zapis/wczytanie, migracja starych zapisów + powiadomienie, brak przełącznika w menu gry, UI bez administratora przy OFF,
 * (D) parytet AI + armia niezależna od opcji.
 * Run z gra/:  node tools/administrators-wizard-test.cjs   (env ADMINWIZ_SRC_DIR podmienia katalog src — mutacje)
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.ADMINWIZ_SRC_DIR || path.resolve(GRA_ROOT, 'src');

let passed = 0, failed = 0;
function ok(c, m) { if (c) { passed++; console.log('  [OK] ' + m); } else { failed++; console.error('  [FAIL] ' + m); } }

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'adminwiz-'));
const entry = path.join(temp, 'entry.ts'), bundle = path.join(temp, 'bundle.cjs');
fs.writeFileSync(entry, `export * from ${JSON.stringify(SRC + '/game/auto-build-gate')};\n`);
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: bundle,
  loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: GRA_ROOT, logLevel: 'error' });
const G = require(bundle);

console.log('(A) bramka czysta');
ok(G.ADMINISTRATORS_ENABLED_DEFAULT === false, 'ADMINISTRATORS_ENABLED_DEFAULT === false (domyślnie WYŁĄCZONE)');
ok(G.isAutoBuildAllowedForOwner(0, [0], false) === false, 'gracz, Administratorzy OFF => brak automatyzacji');
ok(G.isAutoBuildAllowedForOwner(0, [0], true) === true, 'gracz, Administratorzy ON => automatyzacja dozwolona (dalej bramki miast)');
ok(G.isAutoBuildAllowedForOwner(3, [0], false) === true, 'AI (owner 3), opcja OFF => AI buduje jak dotąd (parytet: opcja dotyczy tylko gracza)');
ok(G.isAutoBuildAllowedForOwner(1, [0, 1], false) === false, 'drugi fotel ludzki, OFF => zablokowana');
ok(G.isCityAutoBuildAllowed(0, [0], false, true) === false, 'OFF: autobudowa budynków zablokowana nawet z (resztkowym) administratorem');
ok(G.isCityAutoBuildAllowed(0, [0], true, false) === false, 'ON bez administratora miasta => autobudowa zablokowana (zasady CITY)');
ok(G.isCityAutoBuildAllowed(0, [0], true, true) === true, 'ON z działającym administratorem miasta => autobudowa działa');
ok(G.isCityAutoBuildAllowed(3, [0], false, false) === true, 'AI: autobudowa bez bramki administratora, niezależnie od opcji');
ok(G.isCityAutoImprovementAllowed(0, [0], false, true) === false, 'OFF: auto-ulepszenia terenu zablokowane');
ok(G.isCityAutoImprovementAllowed(0, [0], true, false) === false, 'ON bez administratora ulepszeń => zablokowane (zasady IMPROVEMENT)');
ok(G.isCityAutoImprovementAllowed(0, [0], true, true) === true, 'ON z administratorem ulepszeń => działa');
ok(G.isCityAutoImprovementAllowed(3, [0], false, false, false) === true, 'AI (ai_wymaga_administratora=false): auto-ulepszenia jak dotąd, opcja OFF');
ok(G.administratorsFromSaveMeta(undefined) === false && G.administratorsFromSaveMeta('true') === false && G.administratorsFromSaveMeta(1) === false, 'zapis bez pola / nie-boolean => WYŁĄCZONE');
ok(G.administratorsFromSaveMeta(true) === true && G.administratorsFromSaveMeta(false) === false, 'zapis: round-trip boolean');
ok(G.administratorsFromNewGameParam(undefined) === false, 'nowa gra bez parametru => WYŁĄCZONE');
ok(G.administratorsFromNewGameParam(true) === true && G.administratorsFromNewGameParam(false) === false, 'nowa gra: jawny boolean respektowany');
ok(G.shouldShowLegacyAutomationMigration({ autoBuildEnabled: true }) === true, 'stary zapis z włączoną automatyzacją (bez nowego pola) => powiadomienie');
ok(G.shouldShowLegacyAutomationMigration({ autoBuildEnabled: false }) === false, 'stary zapis z wyłączoną automatyzacją => bez powiadomienia');
ok(G.shouldShowLegacyAutomationMigration({}) === false && G.shouldShowLegacyAutomationMigration(undefined) === false, 'zapis bez żadnego pola => bez powiadomienia');
ok(G.shouldShowLegacyAutomationMigration({ administratorsEnabled: false, autoBuildEnabled: true }) === false, 'zapis już z nowym polem => bez powiadomienia (jednorazowość)');
ok(/nowej gr/.test(G.LEGACY_AUTOMATION_NOTICE_TEXT) && /Administratorzy/.test(G.LEGACY_AUTOMATION_NOTICE_TEXT), 'powiadomienie mówi, jak odzyskać automatyzację (nowa gra z opcją Administratorzy)');

console.log('(B) dane: kreator nowej gry');
const params = JSON.parse(fs.readFileSync(path.resolve(GRA_ROOT, 'data', 'ui-params.json'), 'utf8'));
const row = params.nowa_gra.ustawienia.find(s => s.key === 'administrators_enabled');
ok(!!row, 'ui-params.json: nowa_gra.ustawienia ma klucz administrators_enabled');
ok(row && row.label === 'Administratorzy', 'etykieta „Administratorzy”');
ok(row && row.opts[row.domyslny] === 'Wyłączone', 'domyślna wartość = „Wyłączone”');
ok(row && row.opts.length === 2 && row.descs.length === 2 && row.descs.every(d => d.length > 20), 'opis (descs) dla obu opcji');
ok(!params.nowa_gra.ustawienia.some(s => s.key === 'auto_build_enabled'), 'stary klucz auto_build_enabled USUNIĘTY z ustawień');
ok(!/auto_build_enabled|Automatyzacja budowy/.test(JSON.stringify(params)), 'ui-params.json: brak starego klucza i etykiety „Automatyzacja budowy”');
const flow = fs.readFileSync(path.join(SRC, 'ui', 'newGameFlow.ts'), 'utf8');
const mainIdx = flow.indexOf('renderSettingRows(layout, [');
const mainBlock = flow.slice(mainIdx, flow.indexOf(']);', mainIdx));
ok(/'administrators_enabled'/.test(mainBlock), 'newGameFlow: opcja w GŁÓWNEJ siatce ustawień kreatora');
ok(!/advRowFromSett\(\s*'administrators_enabled'/.test(flow), 'newGameFlow: opcja NIE jest wierszem zaawansowanym');
ok(/administratorsEnabled:\s*settingValue\('administrators_enabled'\) === 'Włączone'/.test(flow), 'newGameFlow: parametr gry = (wartość === „Włączone”) — brak wyboru => false');
ok(!/auto_build_enabled|autoBuildEnabled/.test(flow), 'newGameFlow: brak starego klucza/parametru');

console.log('(C) sondy tekstowe main.ts / UI');
const main = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
ok(/let administratorsEnabled = ADMINISTRATORS_ENABLED_DEFAULT;/.test(main), 'main.ts: stan administratorsEnabled startuje z domyślnej (false)');
ok(/administratorsEnabled = administratorsFromNewGameParam\(params\.administratorsEnabled\)/.test(main), 'main.ts: doStartGame czyta parametr kreatora');
ok(/administratorsEnabled = administratorsFromSaveMeta\(saved\.meta\?\.administratorsEnabled\)/.test(main), 'main.ts: wczytanie zapisu (brak pola => false)');
ok(/dealsEndTurnGate: dealsEndTurnGateEnabled,\s*(?:\/\/[^\n]*\n\s*)*administratorsEnabled,/.test(main), 'main.ts: zapis gry niesie meta.administratorsEnabled (na stałe)');
ok(!/^\s*autoBuildEnabled,\s*$/m.test(main) && !/let autoBuildEnabled/.test(main), 'main.ts: stary stan autoBuildEnabled usunięty (zapis go nie niesie)');
ok(/shouldShowLegacyAutomationMigration\(saved\.meta/.test(main) && /LEGACY_AUTOMATION_NOTICE_TITLE/.test(main) && /administrators-legacy-migration/.test(main), 'main.ts: migracja starego zapisu + jednorazowe powiadomienie w „Ważne”');
ok(/if \(!administratorsEnabled\) \{[\s\S]{0,400}?delete \(c as \{ administrator\?: unknown \}\)\.administrator;[\s\S]{0,200}?administratorUlepszen/.test(main), 'main.ts: wczytanie przy OFF usuwa administratorów gracza (brak bonusów/utrzymania)');
ok(/function hireCityAdministratorForPlayer[\s\S]{0,300}?if \(!administratorsEnabled\) return false;/.test(main), 'main.ts: zatrudnienie administratora miasta przy OFF odrzucone');
ok(/function hireImprovementAdministratorForPlayer[\s\S]{0,300}?if \(!administratorsEnabled\) return false;/.test(main), 'main.ts: zatrudnienie administratora ulepszeń przy OFF odrzucone');
ok(/function cityAdministratorUiState[\s\S]{0,300}?!administratorsEnabled && isHuman\(city\.ownerId\)\) return null/.test(main), 'main.ts: UI administratora miasta przy OFF = brak (przyciski/chipy/koszty)');
ok(/function improvementAdministratorUiState[\s\S]{0,300}?!administratorsEnabled && isHuman\(city\.ownerId\)\) return null/.test(main), 'main.ts: UI administratora ulepszeń przy OFF = brak');
ok(/function isCityAutoBuildActive\(city: City\): boolean \{\s*return isCityAutoBuildAllowed\(/.test(main), 'main.ts: isCityAutoBuildActive = opcja + administrator miasta');
const impl = main.indexOf('const autoImpCities = selectCitiesForAutoImprovement(');
ok(impl > 0 && /isAutoBuildAllowedFor\(hOid\)/.test(main.slice(impl, impl + 500)), 'EOT: auto-ulepszenia terenu gracza za bramką opcji');
ok(/isAutoBuildEnabled: isPlayerAutoBuildEnabled/.test(main), 'main.ts: UI (panel miasta / budowy) dostaje stan opcji');
const pause = fs.readFileSync(path.join(SRC, 'ui', 'gamePauseMenu.ts'), 'utf8');
ok(!/autobuild|AutoBuild|Automatyzacja budowy/i.test(pause), 'gamePauseMenu.ts: BRAK starego przełącznika automatyzacji w ustawieniach/menu');
ok(!/onAutoBuildToggle|getAutoBuildEnabled/.test(main), 'main.ts: brak podpięcia starego przełącznika menu');
const cityPanel = fs.readFileSync(path.join(SRC, 'ui', 'cityPanel.ts'), 'utf8');
ok(/data-auto-build-locked/.test(cityPanel) && /AUTO_BUILD_DISABLED_HINT/.test(cityPanel), 'cityPanel.ts: kontrolki auto wyszarzone + podpowiedź przy OFF');
const gate = fs.readFileSync(path.join(SRC, 'game', 'auto-build-gate.ts'), 'utf8');
ok(!/Włącz automatyzację budowy w Ustawieniach/.test(gate) && /Administratorzy/.test(gate), 'podpowiedź nie odsyła już do Ustawień (opcja tylko w kreatorze nowej gry)');
const wiki = fs.readFileSync(path.resolve(GRA_ROOT, '..', 'docs', 'encyklopedia', 'pojecia', 'administrator-miasta.md'), 'utf8');
ok(/Administratorzy/.test(wiki) && !/opcja w ustawieniach/.test(wiki), 'Civpedia: opis opcji „Administratorzy” w kreatorze, bez „opcja w ustawieniach”');

console.log('(D) parytet AI + armia niezależna');
const ai = fs.readFileSync(path.join(SRC, 'game', 'ai.ts'), 'utf8');
ok(!/auto-build-gate|administratorsEnabled|isAutoBuildAllowed/.test(ai), 'ai.ts bez bramki opcji (AI buduje i ulepsza jak dotąd)');
const admParams = JSON.parse(fs.readFileSync(path.resolve(GRA_ROOT, 'data', 'city-administrator-params.json'), 'utf8'));
ok(admParams.administrator_ulepszen.ai_wymaga_administratora === false, 'city-administrator-params.json: administrator_ulepszen.ai_wymaga_administratora === false (AI nie podlega bramce)');
const autoImp = fs.readFileSync(path.join(SRC, 'game', 'auto-improvements.ts'), 'utf8');
ok(!/auto-build-gate|administratorsEnabled/.test(autoImp), 'auto-improvements.ts bez zmian (picker wspólny z AI)');
const recruitGeneral = fs.readFileSync(path.join(SRC, 'game', 'recruit-general.ts'), 'utf8');
ok(!/auto-build-gate|administratorsEnabled|isAutoBuildAllowed/.test(recruitGeneral), 'armia: recruit-general.ts (auto-rekrutacja z generałem) NIE zależy od opcji administratorów');
ok(!/auto-build-gate/.test(fs.readFileSync(path.join(SRC, 'ui', 'empireRecruitPanel.ts'), 'utf8')), 'armia: panel rekrutacji imperium bez bramki administratorów')

try { fs.rmSync(temp, { recursive: true, force: true }); } catch { /* ignore */ }
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
