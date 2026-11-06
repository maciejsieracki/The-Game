'use strict';
/**
 * R-WEB-SETTINGS-AUTOBUILD-TOGGLE-Q1 — „Automatyzacja budowy” gracza (domyślnie WYŁĄCZONA; AI bez zmian).
 * (A) czysta bramka game/auto-build-gate.ts (gracz vs AI, domyślne, odczyt z zapisu / parametrów nowej gry),
 * (B) dane: ui-params.json — opcja w GŁÓWNYCH ustawieniach nowej gry, domyślnie „Wyłączona”,
 * (C) sondy tekstowe: bramka użyta we WSZYSTKICH miejscach auto-budowy gracza w main.ts + UI,
 * (D) mutacje: domyślnie true / brak bramki w jednym miejscu => test FAIL.
 * Run z gra/:  node tools/autobuild-toggle-test.cjs   (env AUTOBUILD_SRC_DIR podmienia katalog src — mutacje)
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.AUTOBUILD_SRC_DIR || path.resolve(GRA_ROOT, 'src');

let passed = 0, failed = 0;
function ok(c, m) { if (c) { passed++; console.log('  [OK] ' + m); } else { failed++; console.error('  [FAIL] ' + m); } }

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'autobuild-toggle-'));
const entry = path.join(temp, 'entry.ts'), bundle = path.join(temp, 'bundle.cjs');
fs.writeFileSync(entry, `export * from ${JSON.stringify(SRC + '/game/auto-build-gate')};\n`);
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: bundle,
  loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: GRA_ROOT, logLevel: 'error' });
const G = require(bundle);

console.log('(A) bramka czysta');
ok(G.AUTO_BUILD_ENABLED_DEFAULT === false, 'AUTO_BUILD_ENABLED_DEFAULT === false (domyślnie WYŁĄCZONA)');
ok(G.isAutoBuildAllowedForOwner(0, [0], false) === false, 'gracz (owner 0), opcja OFF => auto-budowa zablokowana');
ok(G.isAutoBuildAllowedForOwner(0, [0], true) === true, 'gracz, opcja ON => auto-budowa działa jak dotąd');
ok(G.isAutoBuildAllowedForOwner(3, [0], false) === true, 'AI (owner 3), opcja OFF => AI buduje jak dotąd');
ok(G.isAutoBuildAllowedForOwner(7, [0, 1], false) === true, 'AI przy hot-seat (2 fotele), opcja OFF => AI buduje');
ok(G.isAutoBuildAllowedForOwner(1, [0, 1], false) === false, 'drugi fotel ludzki (hot-seat), opcja OFF => zablokowana');
ok(G.isAutoBuildAllowedForOwner(1, [0, 1], true) === true, 'drugi fotel ludzki, opcja ON => działa');
ok(G.autoBuildFromSaveMeta(undefined) === false, 'zapis bez pola => WYŁĄCZONA');
ok(G.autoBuildFromSaveMeta(false) === false && G.autoBuildFromSaveMeta('true') === false && G.autoBuildFromSaveMeta(1) === false, 'zapis: false / nie-boolean => WYŁĄCZONA');
ok(G.autoBuildFromSaveMeta(true) === true, 'zapis: true => WŁĄCZONA (round-trip)');
ok(G.autoBuildFromNewGameParam(undefined) === false, 'nowa gra bez parametru => WYŁĄCZONA');
ok(G.autoBuildFromNewGameParam(true) === true && G.autoBuildFromNewGameParam(false) === false, 'nowa gra: jawny boolean respektowany');

console.log('(B) dane: główne ustawienia nowej gry');
const params = JSON.parse(fs.readFileSync(path.resolve(GRA_ROOT, 'data', 'ui-params.json'), 'utf8'));
const row = params.nowa_gra.ustawienia.find(s => s.key === 'auto_build_enabled');
ok(!!row, 'ui-params.json: nowa_gra.ustawienia ma klucz auto_build_enabled');
ok(row && row.opts[row.domyslny] === 'Wyłączona', 'domyślna wartość = „Wyłączona”');
ok(row && row.label === 'Automatyzacja budowy', 'etykieta „Automatyzacja budowy”');
const flow = fs.readFileSync(path.join(SRC, 'ui', 'newGameFlow.ts'), 'utf8');
const mainIdx = flow.indexOf("renderSettingRows(layout, [");
const mainBlock = flow.slice(mainIdx, flow.indexOf(']);', mainIdx));
ok(/'auto_build_enabled'/.test(mainBlock), 'newGameFlow: opcja w GŁÓWNEJ siatce ustawień (nie w „Zaawansowanych”)');
const advIdx = flow.indexOf('advRowFromSett(');
ok(!/advRowFromSett\(\s*'auto_build_enabled'/.test(flow), 'newGameFlow: opcja NIE jest wierszem zaawansowanym');
ok(/autoBuildEnabled:\s*settingValue\('auto_build_enabled'\) === 'Włączona'/.test(flow), 'newGameFlow: parametr gry = (wartość === „Włączona”) — brak wyboru => false');

console.log('(C) sondy tekstowe main.ts / UI');
const main = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
ok(/let autoBuildEnabled = AUTO_BUILD_ENABLED_DEFAULT;/.test(main), 'main.ts: stan autoBuildEnabled startuje z domyślnej (false)');
ok(/autoBuildEnabled = autoBuildFromNewGameParam\(params\.autoBuildEnabled\)/.test(main), 'main.ts: doStartGame czyta parametr nowej gry');
ok(/autoBuildEnabled = autoBuildFromSaveMeta\(saved\.meta\?\.autoBuildEnabled\)/.test(main), 'main.ts: wczytanie zapisu (brak pola => false)');
ok(/dealsEndTurnGate: dealsEndTurnGateEnabled,\s*(?:\/\/[^\n]*\n\s*)*autoBuildEnabled,/.test(main), 'main.ts: zapis gry niesie meta.autoBuildEnabled');
const enq = main.slice(main.indexOf('function tryAutoEnqueueBuild'), main.indexOf('function tryAutoEnqueueBuild') + 500);
ok(/isAutoBuildAllowedFor\(city\.ownerId\)\) return null/.test(enq), 'tryAutoEnqueueBuild: bramka (kolejkowanie budynków gracza)');
ok(/isAutoBudowaTryb\(city\.budowaTryb\) && isAutoBuildAllowedFor\(city\.ownerId\)\) return false/.test(main), 'cityHasActionableProduction: tryb auto nieaktywny przy OFF');
ok(/amDecision\.enqueue !== null && isAutoBuildAllowedFor\(city\.ownerId\)/.test(main), 'Zarządca ⚙: enqueue tylko gdy bramka otwarta');
ok(/else if \(isAutoBudowaTryb\(city\.budowaTryb\) && isAutoBuildAllowedFor\(city\.ownerId\)\)/.test(main), 'EOT: auto-budowa bez Zarządcy za bramką');
ok(/isAutoBudowaTryb\(city\.budowaTryb\) && isAutoBuildAllowedFor\(city\.ownerId\) && frontItem\(prodFinal\) === null/.test(main), 'EOT: kolejkowanie po ukończeniu za bramką');
const impl = main.indexOf('const autoImpCities = cities.filter');
ok(impl > 0 && /isAutoBuildAllowedFor\(hOid\)/.test(main.slice(impl, impl + 500)), 'EOT: auto-ulepszenia terenu gracza (pickAutoImprovements) za bramką');
ok(/isAutoBuildEnabled: isPlayerAutoBuildEnabled/.test(main), 'main.ts: UI (panel miasta / budowy) dostaje stan opcji');
ok(/onAutoBuildToggle/.test(main) && /getAutoBuildEnabled: isPlayerAutoBuildEnabled/.test(main), 'main.ts: przełącznik w menu gry (zmiana w trakcie gry)');
ok(/setAutoBuildEnabled: v =>/.test(main), 'main.ts: hak testowy ?civTest=1 setAutoBuildEnabled');
const cityPanel = fs.readFileSync(path.join(SRC, 'ui', 'cityPanel.ts'), 'utf8');
ok(/isAutoBuildEnabled\?: \(\) => boolean/.test(cityPanel) && /data-auto-build-locked/.test(cityPanel) && /AUTO_BUILD_DISABLED_HINT/.test(cityPanel), 'cityPanel.ts: kontrolki auto wyszarzone + podpowiedź');
ok(/\.disabled = true;\s*\n\s*manager\.setAttribute\('aria-disabled'/.test(cityPanel) || /\(manager as HTMLButtonElement\)\.disabled = true/.test(cityPanel), 'cityPanel.ts: Zarządca ⚙ przy OFF jest disabled (obrona zarzutu 2)');
ok(/manager\.addEventListener\('click', \(\) => \{\s*if \(cfg\.isAutoBuildEnabled && !cfg\.isAutoBuildEnabled\(\)\) return;/.test(cityPanel), 'cityPanel.ts: klik Zarządcy ⚙ przy OFF nie przełącza trybu (obrona zarzutu 2)');
ok(/onAutoBuildToggle: \(enabled: boolean\) => \{[\s\S]{0,400}?updateHud\(\)[\s\S]{0,200}?refreshCityPanelIfOpen\(\)/.test(main), 'main.ts: przełącznik w menu odświeża HUD i panel miasta (obrona zarzutu 4)');
const bmh = fs.readFileSync(path.join(SRC, 'ui', 'buildModeHud.ts'), 'utf8');
ok(/isAutoBuildEnabled\?: \(\) => boolean/.test(bmh) && /autoBuildOn/.test(bmh) && /AUTO_BUILD_DISABLED_HINT/.test(bmh), 'buildModeHud.ts: blok auto-ulepszeń zastąpiony podpowiedzią');
const gate = fs.readFileSync(path.join(SRC, 'game', 'auto-build-gate.ts'), 'utf8');
ok(/'Włącz automatyzację budowy w Ustawieniach'/.test(gate), 'podpowiedź „Włącz automatyzację budowy w Ustawieniach”');
const autoImp = fs.readFileSync(path.join(SRC, 'game', 'auto-improvements.ts'), 'utf8');
ok(!/auto-build-gate|autoBuildEnabled/.test(autoImp), 'auto-improvements.ts bez zmian (picker wspólny z AI — bramka tylko na wywołaniu gracza)');
const ai = fs.readFileSync(path.join(SRC, 'game', 'ai.ts'), 'utf8');
ok(!/auto-build-gate|autoBuildEnabled|isAutoBuildAllowed/.test(ai), 'ai.ts bez bramki (AI buduje jak dotąd)');

try { fs.rmSync(temp, { recursive: true, force: true }); } catch { /* ignore */ }
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
