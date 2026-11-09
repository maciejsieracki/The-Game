'use strict';
/**
 * R-WEB-SETTINGS-FOG-REVEAL-KEY-F-OPTION-Q1 — „Odkrywanie mapy klawiszem F (tryb testowy)”.
 * Klawisz F (odkrycie/wyłączenie mgły wojny) działa WYŁĄCZNIE gdy opcja nowej gry jest włączona.
 * Domyślnie WYŁĄCZONA; brak pola w nowej grze / zapisie = WYŁĄCZONA; opcja nie wpływa na AI.
 *
 * (A) czysta bramka game/fog-reveal-key-f.ts (domyślne, odczyt z parametrów i zapisu),
 * (B) dane: ui-params.json — opcja w GŁÓWNYCH ustawieniach nowej gry, domyślnie „Wyłączone”,
 * (C) sondy tekstowe: bramka w obsłudze klawisza F (przed preventDefault/toggle), zapis/odczyt meta,
 *     parametr nowej gry, przepięcie z newGameFlow,
 * (D) FOG_F_SRC_DIR podmienia katalog src (mutacje: bramka usunięta => FAIL).
 * Run z gra/:  node tools/fog-reveal-key-f-option-test.cjs   (env FOG_F_SRC_DIR podmienia katalog src)
 * Chromium (żywy klawisz F ON/OFF) NIE jest tu uruchamiany — patrz raport operatora.
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.FOG_F_SRC_DIR || path.resolve(GRA_ROOT, 'src');

let passed = 0, failed = 0;
function ok(c, m) { if (c) { passed++; console.log('  [OK] ' + m); } else { failed++; console.error('  [FAIL] ' + m); } }

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'fog-f-option-'));
const entry = path.join(temp, 'entry.ts'), bundle = path.join(temp, 'bundle.cjs');
fs.writeFileSync(entry, `export * from ${JSON.stringify(SRC + '/game/fog-reveal-key-f')};\n`);
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: bundle,
  loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: GRA_ROOT, logLevel: 'error' });
const G = require(bundle);

console.log('(A) bramka czysta');
ok(G.FOG_REVEAL_KEY_F_DEFAULT === false, 'FOG_REVEAL_KEY_F_DEFAULT === false (domyślnie WYŁĄCZONA)');
ok(G.fogRevealKeyFFromNewGameParam(undefined) === false, 'nowa gra bez parametru => WYŁĄCZONA');
ok(G.fogRevealKeyFFromNewGameParam(true) === true && G.fogRevealKeyFFromNewGameParam(false) === false, 'nowa gra: jawny boolean respektowany');
ok(G.fogRevealKeyFFromNewGameParam('true') === false && G.fogRevealKeyFFromNewGameParam(1) === false, 'nowa gra: nie-boolean => WYŁĄCZONA');
ok(G.fogRevealKeyFFromSaveMeta(undefined) === false, 'zapis bez pola => WYŁĄCZONA (stare zapisy = dotychczasowe zachowanie bez F)');
ok(G.fogRevealKeyFFromSaveMeta(false) === false && G.fogRevealKeyFFromSaveMeta('true') === false && G.fogRevealKeyFFromSaveMeta(1) === false, 'zapis: false / nie-boolean => WYŁĄCZONA');
ok(G.fogRevealKeyFFromSaveMeta(true) === true, 'zapis: true => WŁĄCZONA (round-trip)');
ok(G.isFogRevealKeyFActive(false) === false, 'opcja OFF => klawisz F nieaktywny');
ok(G.isFogRevealKeyFActive(true) === true, 'opcja ON => klawisz F aktywny');

console.log('(B) dane: główne ustawienia nowej gry');
const params = JSON.parse(fs.readFileSync(path.resolve(GRA_ROOT, 'data', 'ui-params.json'), 'utf8'));
const row = params.nowa_gra.ustawienia.find(s => s.key === 'fog_reveal_key_f');
ok(!!row, 'ui-params.json: nowa_gra.ustawienia ma klucz fog_reveal_key_f');
ok(row && row.opts[row.domyslny] === 'Wyłączone', 'domyślna wartość = „Wyłączone”');
ok(row && row.label === 'Odkrywanie mapy klawiszem F (tryb testowy)', 'etykieta „Odkrywanie mapy klawiszem F (tryb testowy)”');
ok(row && row.opts.length === 2 && row.descs.length === 2, 'dwie opcje i dwa opisy');
const flow = fs.readFileSync(path.join(SRC, 'ui', 'newGameFlow.ts'), 'utf8');
const mainIdx = flow.indexOf('renderSettingRows(layout, [');
const mainBlock = flow.slice(mainIdx, flow.indexOf(']);', mainIdx));
ok(/'fog_reveal_key_f'/.test(mainBlock), 'newGameFlow: opcja w GŁÓWNEJ siatce ustawień');
ok(/fogRevealKeyFEnabled:\s*settingValue\('fog_reveal_key_f'\) === 'Włączone'/.test(flow), 'newGameFlow: parametr gry = (wartość === „Włączone”) — brak wyboru => false');

console.log('(C) sondy tekstowe main.ts');
const main = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
ok(/let fogRevealKeyFEnabled = FOG_REVEAL_KEY_F_DEFAULT;/.test(main), 'main.ts: stan fogRevealKeyFEnabled startuje z domyślnej (false)');
ok(/fogRevealKeyFEnabled = fogRevealKeyFFromNewGameParam\(params\.fogRevealKeyFEnabled\)/.test(main), 'main.ts: doStartGame czyta parametr nowej gry');
ok(/fogRevealKeyFEnabled = fogRevealKeyFFromSaveMeta\(saved\.meta\?\.fogRevealKeyFEnabled\)/.test(main), 'main.ts: wczytanie zapisu (brak pola => false)');
ok(/autoBuildEnabled,\s*(?:\/\/[^\n]*\n\s*)*fogRevealKeyFEnabled,/.test(main), 'main.ts: zapis gry niesie meta.fogRevealKeyFEnabled');
// Obsługa F: bramka musi stać PRZED preventDefault i toggleDevFogFull, w gałęzi KeyF.
const fIdx = main.indexOf("if (e.code === 'KeyF' || e.key.toLowerCase() === 'f') {");
const fEnd = fIdx >= 0 ? main.indexOf('toggleDevFogFull();', fIdx) : -1;
const fBlock = fIdx >= 0 && fEnd > fIdx ? main.slice(fIdx, fEnd) : '';
ok(fBlock.length > 0, 'main.ts: gałąź klawisza F znaleziona');
ok(/if \(!isFogRevealKeyFActive\(fogRevealKeyFEnabled\)\) return;/.test(fBlock), 'klawisz F: bramka opcji w gałęzi F');
ok(fBlock.indexOf('isFogRevealKeyFActive') >= 0 && fBlock.indexOf('isFogRevealKeyFActive') < fBlock.indexOf('e.preventDefault()'), 'klawisz F: bramka PRZED preventDefault (OFF = brak efektu ubocznego)');
ok(!/showHintMessage/.test(fBlock.slice(0, fBlock.indexOf('isFogRevealKeyFActive'))), 'klawisz F: brak komunikatu przed bramką');
ok(!/isAutoBuild|isAI|aiTurn|runAi/.test(fBlock), 'klawisz F: opcja nie dotyka AI');
const aiSrc = fs.readFileSync(path.join(SRC, 'game', 'ai.ts'), 'utf8');
ok(!/fogRevealKeyF|fog-reveal-key-f/.test(aiSrc), 'AI (game/ai.ts): brak odwołań do opcji klawisza F');

console.log(`\nWynik: ${passed} OK, ${failed} FAIL`);
process.exitCode = failed === 0 ? 0 : 1;
