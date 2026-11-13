#!/usr/bin/env node
/**
 * admin-panstwo-panel-names-test.cjs — R-WEB-ADMIN-PANSTWO-PANEL-AND-NAMES-Q1 (#327).
 *
 * (1) Wiersz „Administrator państwa” w panelu Państwa: render 3 stanów (zatrudniony+pracuje,
 *     zatrudniony+nie pracuje, nie zatrudniony) z modułu src/ui/stateAdministratorRow.ts
 *     (bundle esbuild ze stdin, bez zapisu plików), plus wiring hud.ts -> empireDetailPanel.ts -> main.ts.
 * (2) Nazwy w tekstach gracza (src/ui): „administrator ulepszeń” nie występuje w żadnej linii
 *     niebędącej komentarzem; są „administrator państwa” i „administrator miasta” tam, gdzie trzeba.
 * (3) Mutacja: wstrzyknięta stara nazwa MUSI być wykryta; usunięcie wiringu MUSI być wykryte.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let pass = 0;
let fail = 0;
const ok = (cond, msg) => {
  if (cond) { pass++; console.log('  ok   ' + msg); }
  else { fail++; console.log('  FAIL ' + msg); }
};

// Linie niebędące komentarzem (komentarze JSDoc / // nie są tekstem dla gracza).
const isCommentLine = (line) => /^\s*(\/\/|\*|\/\*)/.test(line);
const OLD_NAME = /administrator\w*\s+ulepszeń/i;

/** Zwraca numery linii ze starą nazwą w tekstach (nie w komentarzach). */
function findOldNames(text) {
  const hits = [];
  text.split('\n').forEach((line, i) => {
    if (!isCommentLine(line) && OLD_NAME.test(line)) hits.push(i + 1);
  });
  return hits;
}

/** Kompiluje moduł TS ze źródła tekstowego (stdin esbuild) i zwraca wyeksportowane obiekty. */
function loadModule(source, resolveDir) {
  const esbuild = require('esbuild');
  const out = esbuild.buildSync({
    stdin: { contents: source, resolveDir, loader: 'ts', sourcefile: 'stateAdministratorRow.ts' },
    bundle: true, write: false, format: 'cjs', platform: 'node',
  });
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', out.outputFiles[0].text)(mod, mod.exports, require);
  return mod.exports;
}

const UI_DIR = path.join(ROOT, 'src/ui');
const uiFiles = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.ts')) uiFiles.push(path.relative(ROOT, p));
  }
})(UI_DIR);

console.log('== (1) wiersz Administrator państwa: render 3 stanów ==');
const rowSrc = read('src/ui/stateAdministratorRow.ts');
const row = loadModule(rowSrc, path.join(ROOT, 'src/ui'));
const working = row.stateAdministratorStatusHtml({ hired: true, working: true, upkeep: 4.4, hireCost: 40, treasury: 100 });
const notWorking = row.stateAdministratorStatusHtml({ hired: true, working: false, upkeep: 4, hireCost: 40, treasury: 0 });
const notHired = row.stateAdministratorStatusHtml({ hired: false, working: false, upkeep: 4, hireCost: 40, treasury: 10 });
ok(/zatrudniony · pracuje · −4\/turę/.test(working), 'stan pracuje: „zatrudniony · pracuje · −4/turę”');
ok(/zatrudniony · nie pracuje \(brak środków w skarbcu państwa\)/.test(notWorking), 'stan nie pracuje: brak środków w skarbcu');
ok(/nie zatrudniony — koszt 40, utrzymanie 4\/turę/.test(notHired), 'stan nie zatrudniony: koszt i utrzymanie z silnika');
ok(/Jeden administrator na całe Państwo/.test(working), 'podpowiedź: jeden administrator na całe Państwo');

console.log('== (1b) wiring: hud.ts -> empireDetailPanel.ts -> main.ts ==');
const hud = read('src/ui/hud.ts');
const edp = read('src/ui/empireDetailPanel.ts');
const main = read('src/main.ts');
const ROW_LINE = /balRow\('Administrator państwa',[^\n]*stateAdministratorStatusHtml\(economy\.administratorPanstwa\)/;
const MAIN_LINE = /administratorPanstwa: administratorsEnabled \? stateAdministratorPanelRow\(ME\(\)\) : undefined/;
ok(/administratorPanstwa\?:\s*\{/.test(hud), 'hud.ts: pole HudState.administratorPanstwa');
ok(ROW_LINE.test(edp), 'empireDetailPanel.ts: wiersz „Administrator państwa” w skarbcu Państwa');
ok(/import \{ stateAdministratorStatusHtml \} from '\.\/stateAdministratorRow';/.test(edp), 'empireDetailPanel.ts: import helpera');
ok(MAIN_LINE.test(main), 'main.ts: wiring stanu do buildHudState (OFF -> undefined)');
ok(/function stateAdministratorPanelRow\(ownerId: number\)/.test(main), 'main.ts: funkcja stateAdministratorPanelRow');

console.log('== (2) nazwy w tekstach gracza (cała gra, nie tylko src/ui) ==');
// Zakres kryterium „teksty zawierają tylko dwie nazwy”: UI, main.ts (napisy powiadomień/podpowiedzi),
// silnik z tekstami dla gracza (komunikaty/stałe), JSON z opisami gracza i bundle wiki.
const GAME_TEXT_FILES = [
  ...uiFiles,
  'src/main.ts',
  'src/game/city-administrator.ts',
  'src/game/auto-build-gate.ts',
  'src/game/cities.ts',
  'src/game/civ-test-hooks.ts',
  'data/city-administrator-params.json',
  'src/data/wikiBundle.json',
  // R-WEB-ADMIN-PANSTWO-PANEL-AND-NAMES-Q1 r2: także testy przeglądarkowe (asercje na napisy).
  ...fs.readdirSync(path.join(ROOT, 'tools'))
    .filter((n) => n.endsWith('.cjs') && n !== path.basename(__filename))
    .map((n) => path.join('tools', n)),
];
const offenders = [];
for (const f of GAME_TEXT_FILES) {
  for (const ln of findOldNames(read(f))) offenders.push(`${f}:${ln}`);
}
ok(offenders.length === 0,
  `brak starej nazwy „administrator ulepszeń” w tekstach gry (trafienia: ${offenders.length}${offenders.length ? ' — ' + offenders.join(', ') : ''})`);
const cityPanel = read('src/ui/cityPanel.ts');
const bmh = read('src/ui/buildModeHud.ts');
const adp = read('src/ui/administratorPanel.ts');
ok(cityPanel.includes("'Administrator państwa: pracuje'"), 'cityPanel.ts: stan „Administrator państwa: pracuje”');
ok(cityPanel.includes("'Administrator państwa')"), 'cityPanel.ts: etykieta chipa „Administrator państwa”');
ok(bmh.includes("'Wymaga administratora państwa'"), 'buildModeHud.ts: adnotacja „Wymaga administratora państwa”');
ok(bmh.includes('Administrator państwa ✓') && bmh.includes('Administrator państwa +'), 'buildModeHud.ts: przycisk „Administrator państwa +/✓”');
ok(adp.includes("'Administrator miasta' : 'Administrator państwa'"), 'administratorPanel.ts: tytuł państwa / miasta');
ok(cityPanel.includes('Administrator miasta') && adp.includes('Administrator miasta'), 'nazwa „administrator miasta” zachowana (budynki w mieście)');
// Zakresy (zarzut: nie mieszać nazw i zakresów): tekst państwa nie mówi „w tym mieście”.
ok(adp.includes("'Zatrudnić administratora państwa (jeden na całe Państwo)?'"), 'administratorPanel.ts: pytanie zatrudnienia państwa bez „w mieście X”');
ok(adp.includes("'we wszystkich miastach Państwa'") && adp.includes('Administrator państwa to jedna osoba na całe Państwo'),
  'administratorPanel.ts: zakres państwa = „we wszystkich miastach Państwa” (lead, bonusy, skutki)');
ok(!/Administrator to osoba przypisana do jednego miasta[^\n]*improvementAdministratorDescription/.test(adp),
  'administratorPanel.ts: opis administratora państwa nie dokleja JSON z „w tym mieście”');

console.log('== (3) mutacja: stara nazwa i usunięty wiring muszą czerwienić test ==');
// Mutacje REALNE: podmiana w pliku na dysku, odczyt skanerem, przywrócenie w finally (bajt po bajcie).
const realMutation = (rel, from, to) => {
  const p = path.join(ROOT, rel);
  const orig = fs.readFileSync(p, 'utf8');
  if (!orig.includes(from)) return { applied: false, hits: [] };
  try {
    fs.writeFileSync(p, orig.replace(from, to));
    return { applied: true, hits: findOldNames(read(rel)) };
  } finally {
    fs.writeFileSync(p, orig);
  }
};
const mCity = realMutation('src/ui/cityPanel.ts', "'Administrator państwa: pracuje'", "'Administrator ulepszeń: pracuje'");
ok(mCity.applied && mCity.hits.length > 0, 'mutacja realna: stara nazwa w cityPanel.ts jest wykrywana');
const mBmh = realMutation('src/ui/buildModeHud.ts', "'Wymaga administratora państwa'", "'Wymaga administratora ulepszeń'");
ok(mBmh.applied && mBmh.hits.length > 0, 'mutacja realna: stara nazwa w buildModeHud.ts jest wykrywana');
ok(read('src/ui/cityPanel.ts') === cityPanel && read('src/ui/buildModeHud.ts') === bmh, 'po mutacjach pliki przywrócone bajt po bajcie');
const mutEdp = edp.replace("balRow('Administrator państwa'", "balRow('Administrator'");
ok(!ROW_LINE.test(mutEdp), 'mutacja: usunięcie wiersza z panelu Państwa jest wykrywane');
const mutMain = main.replace('administratorPanstwa: administratorsEnabled ? stateAdministratorPanelRow(ME()) : undefined', '');
ok(!MAIN_LINE.test(mutMain), 'mutacja: usunięcie wiringu w main.ts jest wykrywane');

console.log(`\nadmin-panstwo-panel-names-test: ${pass} pass, ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
