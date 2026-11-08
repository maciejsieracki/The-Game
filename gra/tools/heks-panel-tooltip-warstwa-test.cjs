'use strict';
/**
 * heks-panel-tooltip-warstwa-test.cjs -- P-HEKS-PANEL-TOOLTIP-WARSTWA-OSTATNIA (2026-08-09)
 * Run: cd gra && node tools/heks-panel-tooltip-warstwa-test.cjs
 *
 * Kontekst: trzeci czlon tej samej rodziny bledu co P-HEKS-PLONY-WARSTWA-OSTATNIA-VS-WSZYSTKIE
 * i P-HEKS-POTENCJAL-ZYWNOSCI-WARSTWA-OSTATNIA (oba naprawione dzis rano w src/game/okolica.ts,
 * patrz tools/heks-plony-warstwy-test.cjs). `tileYieldLabel()` i `appendOkolicaYieldLabel()`
 * w src/ui/cityPanel.ts budowaly WorkedTile z tylko legacy pojedynczego pola `hex.ulepszenie`
 * (ostatnia postawiona warstwa), nie przekazywaly `ulepszeniaKeys` -- w rezultacie panel miasta
 * (tooltipy pol + liczby na heksach w mapce okolicy) pokazywal graczowi ZANIZONY plon dla kazdego
 * heksu z wiecej niz jedna warstwa ulepszenia.
 *
 * Zmierzony przez Evaluatora przypadek (Rownina, ulepszenia=['farma','droga'], legacy
 * hex.ulepszenie='droga' -- droga nadpisuje legacy pole przy budowie): silnik (hexToWorkedTile)
 * liczy Zywnosc=5/Praca=5/Handel=5 pkt/ture, stary panel pokazywal 2/2/2 -- mniej niz polowe.
 *
 * cityPanel.ts ma >10 000 linii, `tileYieldLabel`/`appendOkolicaYieldLabel` NIE sa eksportowane.
 * UWAGA (skorygowane 2026-08-10, patrz PYTANIA-OTWARTE.md
 * P-BRAMKA-TOOLTIP-REGEX-UZASADNIENIE-NIEPRAWDZIWE): ponizszy test regex-owy NIE jest wybrany
 * dlatego, ze appendOkolicaYieldLabel() "wymaga DOM, ktorego nie ma" -- jsdom ^29.1.1 jest
 * zadeklarowanym devDependency tego repo i uzywa go juz kilkanascie plikow w tools/*.cjs (w tym
 * 4 nazwane bramki), wiec test E2E wywolujacy obie funkcje na prawdziwym DOM jest technicznie
 * mozliwy (Evaluator zbudowal dzialajacy prototyp ~40 linii). Regex zostal wybrany pragmatycznie
 * -- tak jak
 * city-panel-growth-percent-separator-test.cjs (P-ETYKIETA-WZROST-SEPARATOR-ROZJAZD, dzis rano) --
 * NIE odpala calego cityPanel.ts, tylko:
 *   1. PRZYPIETA LOKALIZACJA -- zrodlo cityPanel.ts w obu funkcjach faktycznie wola
 *      improvementKeysForHex(...) i przekazuje ulepszeniaKeys do tileYield(...), a NIE stary
 *      wzorzec normalizeImprovementKey(String(...ulepszenie ?? 'brak')).
 *   2. KONTRAKT SILNIKA -- improvementKeysForHex + tileYield (te same funkcje, ktore importuje
 *      cityPanel.ts) faktycznie licza wszystkie warstwy tak samo jak hexToWorkedTile (silnik
 *      produkcji miasta w turn-economy.ts) -- na dokladnie tym przypadku, ktory zmierzyl
 *      Evaluator, plus dowod mutacyjny: reimplementacja STAREJ logiki panelu (tylko legacy pole)
 *      daje zanizony wynik 2/2/2, rozny od silnika 5/5/5.
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const CITY_PANEL_SRC = path.join(GRA, 'src', 'ui', 'cityPanel.ts');
const ENTRY = path.join(__dirname, '.heks-panel-tooltip-warstwa-entry.ts');
const BUNDLE = path.join(__dirname, '.heks-panel-tooltip-warstwa-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { improvementKeysForHex, normalizeImprovementKey } from '../src/game/terrain-improvements';
export { tileYield } from '../src/game/economy';
export { hexToWorkedTile } from '../src/game/turn-economy';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' },
    outfile: BUNDLE,
    absWorkingDir: GRA,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[heks-panel-tooltip-warstwa-test] bundle failed:', e.message || e);
  process.exit(1);
}

const { improvementKeysForHex, normalizeImprovementKey, tileYield, hexToWorkedTile } = require(BUNDLE);

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}
function eq(got, want, msg) {
  assert(got === want, `${msg} (got=${JSON.stringify(got)} want=${JSON.stringify(want)})`);
}

console.log('heks-panel-tooltip-warstwa-test (P-HEKS-PANEL-TOOLTIP-WARSTWA-OSTATNIA)\n');

// --- 1. PRZYPIETA LOKALIZACJA -- zrodlo cityPanel.ts faktycznie wola improvementKeysForHex ------
console.log('\n[1] tileYieldLabel() i appendOkolicaYieldLabel() w cityPanel.ts wolaja improvementKeysForHex');
const src = fs.readFileSync(CITY_PANEL_SRC, 'utf8');

assert(
  /import\s*\{[^}]*\bimprovementKeysForHex\b[^}]*\}\s*from\s*['"]\.\.\/game\/terrain-improvements['"]/.test(src),
  'cityPanel.ts importuje improvementKeysForHex z ../game/terrain-improvements',
);

const tileYieldLabelMatch = src.match(
  /function tileYieldLabel\(hex: Hex\): string \{[\s\S]{0,500}?\n\}/,
);
assert(tileYieldLabelMatch !== null, 'znaleziono cialo funkcji tileYieldLabel()');
if (tileYieldLabelMatch) {
  const block = tileYieldLabelMatch[0];
  assert(/improvementKeysForHex\(hex\)/.test(block), 'tileYieldLabel() woła improvementKeysForHex(hex)');
  assert(/ulepszeniaKeys:\s*ulepszeniaKeys\.length\s*\?\s*ulepszeniaKeys\s*:\s*undefined/.test(block),
    'tileYieldLabel() przekazuje ulepszeniaKeys do tileYield() (wszystkie warstwy, nie tylko [0])');
  assert(!/normalizeImprovementKey\(String\(hex\.ulepszenie/.test(block),
    'tileYieldLabel() NIE zawiera już starego wzorca normalizeImprovementKey(String(hex.ulepszenie ?? "brak")) (regresja)');
}

const appendMatch = src.match(
  /function appendOkolicaYieldLabel\(\s*svg: SVGSVGElement,[\s\S]{0,1500}?svg\.appendChild\(ytxt\);\n\}/,
);
assert(appendMatch !== null, 'znaleziono cialo funkcji appendOkolicaYieldLabel()');
if (appendMatch) {
  const block = appendMatch[0];
  assert(/improvementKeysForHex\(c\.hex\)/.test(block), 'appendOkolicaYieldLabel() woła improvementKeysForHex(c.hex)');
  assert(/ulepszeniaKeys:\s*ulepszeniaKeys\.length\s*\?\s*ulepszeniaKeys\s*:\s*undefined/.test(block),
    'appendOkolicaYieldLabel() przekazuje ulepszeniaKeys do tileYield() (wszystkie warstwy)');
  assert(!/normalizeImprovementKey\(String\(c\.hex\.ulepszenie/.test(block),
    'appendOkolicaYieldLabel() NIE zawiera już starego wzorca normalizeImprovementKey(String(c.hex.ulepszenie ?? "brak")) (regresja)');
}

// --- 2. KONTRAKT SILNIKA -- na dokladnym przypadku Evaluatora ----------------------------------
console.log('\n[2] parytet panel<->silnik na przypadku Evaluatora (Rownina, [\'farma\',\'droga\'], legacy \'droga\')');

const hex = {
  coords: { q: 0, r: 0 },
  terenBazowy: 'rownina',
  nakladka: 'brak',
  rzeka: null,
  // legacy pojedyncze pole -- droga nadpisuje legacy przy budowie (scenariusz z ticketu)
  ulepszenie: 'droga',
  ulepszenia: ['farma', 'droga'],
};

// Silnik -- to, co faktycznie dolicza sie do produkcji miasta (turn-economy.ts).
const silnikY = tileYield(hexToWorkedTile(hex));
eq(silnikY.zywnosc, 5, 'silnik: zywnosc = 2(teren) + 3(farma) + 0(droga) = 5');
eq(silnikY.praca, 5, 'silnik: praca = 2(teren) + 3(farma) + 0(droga) = 5');
// R-DROGI-RUCH-HANDEL-Q1 (Maciej 2026-08-14): Handel (plon heksa) droga 1->2/ture, wiec suma 5->6.
eq(silnikY.handel, 6, 'silnik: handel = 1(teren) + 3(farma) + 2(droga) = 6 (bylo 1+3+1=5 przed R-DROGI-RUCH-HANDEL-Q1)');

// Nowa logika panelu (naprawiona, kopia dokladnie tego co robi teraz tileYieldLabel/append*) --
// musi sie zgadzac z silnikiem.
const keys = improvementKeysForHex(hex);
const newPanelY = tileYield({
  terenBazowy: hex.terenBazowy,
  nakladka: hex.nakladka,
  maRzeke: !!(hex.rzeka && hex.rzeka.obecna),
  ulepszenieKey: keys[0],
  ulepszeniaKeys: keys.length ? keys : undefined,
});
eq(newPanelY.zywnosc, silnikY.zywnosc, 'panel (naprawiony) zywnosc == silnik');
eq(newPanelY.praca, silnikY.praca, 'panel (naprawiony) praca == silnik');
eq(newPanelY.handel, silnikY.handel, 'panel (naprawiony) handel == silnik');

// Stara logika panelu (PRZED naprawa, tylko legacy hex.ulepszenie) -- dowod mutacyjny: musi
// dawac ZANIZONY wynik, rozny od silnika (dokladnie 2/2/2 zmierzone przez Evaluatora).
const oldPanelY = tileYield({
  terenBazowy: hex.terenBazowy,
  nakladka: hex.nakladka,
  maRzeke: !!(hex.rzeka && hex.rzeka.obecna),
  ulepszenieKey: normalizeImprovementKey(String(hex.ulepszenie ?? 'brak')),
});
eq(oldPanelY.zywnosc, 2, 'stara logika panelu (legacy tylko): zywnosc = 2 (zanizone, dowod mutacyjny)');
eq(oldPanelY.praca, 2, 'stara logika panelu (legacy tylko): praca = 2 (zanizone, dowod mutacyjny)');
// R-DROGI-RUCH-HANDEL-Q1: droga handel 1->2/ture, wiec teren(1)+droga(2)=3 (bylo 1+1=2).
eq(oldPanelY.handel, 3, 'stara logika panelu (legacy tylko): handel = 3 = 1(teren)+2(droga) (zanizone wzgledem silnika 6, dowod mutacyjny; bylo 2 przed R-DROGI-RUCH-HANDEL-Q1)');
assert(
  oldPanelY.zywnosc !== silnikY.zywnosc && oldPanelY.praca !== silnikY.praca && oldPanelY.handel !== silnikY.handel,
  'stara logika panelu (legacy tylko) daje wynik RÓŻNY od silnika -- to byl bug (P-HEKS-PANEL-TOOLTIP-WARSTWA-OSTATNIA)',
);

// --- 3. Regresja podstawowa -- pojedyncza warstwa (bez tablicy ulepszenia) ----------------------
console.log('\n[3] regresja podstawowa: pojedyncza warstwa, legacy hex.ulepszenie bez ulepszenia[]');
{
  const hexSingle = { terenBazowy: 'rownina', nakladka: 'brak', rzeka: null, ulepszenie: 'farma' };
  const silnikS = tileYield(hexToWorkedTile(hexSingle));
  const keysS = improvementKeysForHex(hexSingle);
  const panelS = tileYield({
    terenBazowy: hexSingle.terenBazowy,
    nakladka: hexSingle.nakladka,
    maRzeke: false,
    ulepszenieKey: keysS[0],
    ulepszeniaKeys: keysS.length ? keysS : undefined,
  });
  eq(panelS.zywnosc, silnikS.zywnosc, 'panel == silnik zywnosc (1 warstwa, fallback na legacy)');
  eq(panelS.praca, silnikS.praca, 'panel == silnik praca (1 warstwa)');
  eq(panelS.handel, silnikS.handel, 'panel == silnik handel (1 warstwa)');
}

console.log(`\n${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY); } catch (e) { /* ignore */ }
try { fs.unlinkSync(BUNDLE); } catch (e) { /* ignore */ }
process.exit(failed > 0 ? 1 : 0);
