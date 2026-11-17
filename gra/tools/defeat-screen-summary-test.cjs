'use strict';
/**
 * defeat-screen-summary-test.cjs — DOM test (jsdom) ekranu porażki z podsumowaniem.
 * Sprawdza: sekcje „Osiągnięcia” i „Straty” z liczbami ze stats, dokładnie dwa przyciski
 * („Wczytaj grę”, „Rozpocznij od nowa”) z callbackami; zwycięstwo bez zmian (1 przycisk „Nowa gra”).
 * Mutacja na kopii: env VS_SRC=<ścieżka do kopii victoryScreen.ts> podmienia źródło testowane.
 * Run from gra/: node tools/defeat-screen-summary-test.cjs
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { JSDOM } = require('jsdom');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch (e) {
    console.error('[defeat-screen-summary-test] esbuild not found. Run: npm ci (from gra/)');
    process.exit(1);
  }
})();

const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', { pretendToBeVisual: true });
global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.getComputedStyle = dom.window.getComputedStyle;

const SRC = process.env.VS_SRC
  ? path.resolve(process.env.VS_SRC)
  : path.resolve(__dirname, '..', 'src', 'ui', 'victoryScreen.ts');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'defeat-summary-'));
const ENTRY_FILE = path.join(tmp, 'entry.ts');
const BUNDLE_FILE = path.join(tmp, 'bundle.cjs');
fs.writeFileSync(ENTRY_FILE, [
  'export {',
  '  showVictoryScreen, hideVictoryScreen, buildDefeatSummary,',
  '  buildVictoryScreenData, formatVictoryTitle,',
  `} from ${JSON.stringify(SRC.replace(/\.ts$/, ''))};`,
  '',
].join('\n'), 'utf8');
try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE_FILE,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[defeat-screen-summary-test] esbuild failed:', e.message || e);
  process.exit(1);
}
const V = require(BUNDLE_FILE);

let passed = 0;
let failed = 0;
function ok(cond, msg) {
  if (cond) passed++;
  else { failed++; console.error('  FAIL:', msg); }
}
function eq(a, b, msg) { ok(a === b, `${msg} (got "${a}", want "${b}")`); }

const defeatStats = { turn: 42, eraLabel: 'Żelazo', civLabel: 'Polska', technologieZbadane: 17, utraconeMiasta: 3, utraconeJednostki: 7 };
const defeatData = V.buildVictoryScreenData({ rodzaj: 'przegrana', winner: 1 }, defeatStats);

// 1. Podsumowanie (bez DOM)
const sum = V.buildDefeatSummary(defeatStats);
ok(sum.osiagniecia.some((c) => c.value === '42' && c.label === 'Tur przetrwanych'), 'osiagniecia: tury z stats');
ok(sum.osiagniecia.some((c) => c.value === 'Żelazo'), 'osiagniecia: epoka z stats');
ok(sum.osiagniecia.some((c) => c.value === '17' && c.label === 'Zbadane technologie'), 'osiagniecia: technologie z stats');
ok(sum.straty.length === 2 && sum.straty[0].label === 'Utracone miasta' && sum.straty[0].value === '3', 'straty: utracone miasta = licznik');
ok(sum.straty[1].label === 'Utracone jednostki' && sum.straty[1].value === '7', 'straty: utracone jednostki = licznik');
const sumNoCounters = V.buildDefeatSummary({ turn: 3 });
ok(sumNoCounters.straty.every((c) => c.value === '—'), 'stary zapis bez licznikow: myslniki, nie zgadujemy');
const sumNoTech = V.buildDefeatSummary({ turn: 3 });
ok(!sumNoTech.osiagniecia.some((c) => c.label === 'Zbadane technologie'), 'brak technologii w stats = brak karty');

// 2. Przegrana w DOM
function overlay() { return document.getElementById('__victory_screen__'); }
let newGameCalls = 0;
let loadCalls = 0;
V.showVictoryScreen(defeatData, () => { newGameCalls++; }, () => { loadCalls++; });
let el = overlay();
ok(el !== null, 'przegrana: overlay w DOM');
ok(el && el.classList.contains('lose'), 'przegrana: klasa lose');
const titles = el ? Array.from(el.querySelectorAll('.vsc-section-title')).map((n) => n.textContent.trim()) : [];
ok(titles.includes('Osiągnięcia') && titles.includes('Straty'), `przegrana: sekcje Osiągnięcia/Straty (got ${JSON.stringify(titles)})`);
const valsText = el ? el.textContent : '';
ok(valsText.includes('42') && valsText.includes('Żelazo') && valsText.includes('17') && valsText.includes('Polska'), 'przegrana: liczby ze stats w DOM');
ok(valsText.includes('Utracone miasta') && valsText.includes('Utracone jednostki') && valsText.includes('3') && valsText.includes('7'), 'przegrana: sekcja strat z licznikami w DOM');
const buttons = el ? Array.from(el.querySelectorAll('button')) : [];
eq(buttons.length, 2, 'przegrana: dokładnie dwa przyciski');
eq(buttons[0] && buttons[0].textContent.trim(), 'Wczytaj grę', 'przegrana: pierwszy przycisk Wczytaj grę');
eq(buttons[1] && buttons[1].textContent.trim(), 'Rozpocznij od nowa', 'przegrana: drugi przycisk Rozpocznij od nowa');
buttons[0] && buttons[0].click();
eq(loadCalls, 1, 'klik Wczytaj grę woła callback wczytania');
eq(newGameCalls, 0, 'klik Wczytaj grę nie woła nowej gry');
ok(overlay() !== null, 'klik Wczytaj grę nie chowa ekranu sam (chowa wywołujący po wyborze zapisu)');
V.hideVictoryScreen();
V.showVictoryScreen(defeatData, () => { newGameCalls++; }, () => { loadCalls++; });
el = overlay();
el.querySelector('#vsc-new-game').click();
eq(newGameCalls, 1, 'klik Rozpocznij od nowa woła callback nowej gry');
ok(overlay() === null, 'Rozpocznij od nowa chowa ekran');

// 3. Zwycięstwo: układ bez zmian
const winData = V.buildVictoryScreenData({ rodzaj: 'dominacja', winner: 0 }, { turn: 50, powerShare: 0.6, eraLabel: 'Żelazo', civLabel: 'Polska' });
let winNew = 0;
V.showVictoryScreen(winData, () => { winNew++; });
el = overlay();
ok(el && el.classList.contains('win'), 'zwycięstwo: klasa win');
eq(el ? el.querySelectorAll('.vsc-section-title').length : -1, 0, 'zwycięstwo: brak sekcji podsumowania');
const winButtons = el ? Array.from(el.querySelectorAll('button')) : [];
eq(winButtons.length, 1, 'zwycięstwo: jeden przycisk');
eq(winButtons[0] && winButtons[0].textContent.trim(), 'Nowa gra', 'zwycięstwo: przycisk Nowa gra');
winButtons[0] && winButtons[0].click();
eq(winNew, 1, 'zwycięstwo: Nowa gra woła callback');
V.hideVictoryScreen();

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`[defeat-screen-summary-test] passed=${passed} failed=${failed}`);
process.exit(failed === 0 ? 0 : 1);
