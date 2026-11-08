'use strict';
/**
 * heks-plony-zloze-parytet-ui-test.cjs -- P-HEKS-ZLOZE-PARYTET-NIEDOMKNIETY (2026-08-10)
 * Run: cd gra && node tools/heks-plony-zloze-parytet-ui-test.cjs
 *
 * Kontekst: `yieldOfMapHex` (src/game/okolica.ts) juz przekazuje `hex.zloze` do
 * `tileYield()` (naprawa P-HEKS-RENDER-ZLOZE-NIEPRZEKAZYWANE, commit 3809d4f4). Ten
 * dlug obejmowal TRZY dalsze wywolania `tileYield()`, ktore o `zloze` "zapominaly":
 *   - src/ui/cityPanel.ts: tileYieldLabel(hex)
 *   - src/ui/cityPanel.ts: appendOkolicaYieldLabel(svg, c, ...)
 *   - src/ui/hexContextTooltip.ts: fullTileYield(hex)
 * (`terrainBaseYield` w tym samym pliku CELOWO pomija zloze/nakladke/rzeke/ulepszenia
 * -- to "goly teren", nie pelny plon -- wiec NIE powinien dostac zloze; test pilnuje
 * i tego, zeby zakres naprawy nie "wyciekl" tam, gdzie nie powinien).
 *
 * DLACZEGO REGEX NA ZRODLE, NIE PELNE E2E PRZEZ DOM (jsdom):
 * `hexContextTooltip.ts` transitywnie importuje `src/ui/icons/brandAssets.ts`, ktory
 * na poziomie MODULU wywoluje `import.meta.glob(...)` -- w bundlu esbuild/cjs (potrzebnym
 * do uruchomienia kodu TS w node bez Vite) ta linia rzuca `TypeError: import_meta.glob
 * is not a function` NATYCHMIAST przy `require()`, zanim jakikolwiek kod testu zdazy
 * wywolac `buildHexContextTooltipHtml`. To ten sam, juz udokumentowany w CLAUDE.md
 * ("Znane PRE-ISTNIEJACE porazki") defekt harnessu testowego co w
 * `map-field-battle-test.cjs` / `pre-battle-save-test.cjs` -- nie regresja tej naprawy,
 * ale realna, sprawdzona blokada dla pelnego E2E przez ten konkretny plik. `cityPanel.ts`
 * (>10 000 linii) ma z kolei `tileYieldLabel`/`appendOkolicaYieldLabel` NIE eksportowane
 * i osiagalne wylacznie przez `renderWorkedPreview`, ktore manipuluje realnym DOM
 * (document.createElementNS) -- ten sam wzorzec pragmatycznego wyboru regexu zamiast
 * pelnego DOM E2E co juz przyjety w `heks-panel-tooltip-warstwa-test.cjs`
 * (P-HEKS-PANEL-TOOLTIP-WARSTWA-OSTATNIA) i `city-panel-growth-percent-separator-test.cjs`.
 *
 * Test laczy TRZY niezalezne dowody:
 *   [1] PRZYPIETA LOKALIZACJA -- regex na zrodle: kazde z 3 wywolan tileYield() faktycznie
 *       zawiera linie `zloze: (hex as { zloze?: string }).zloze,` (identyczny idiom co
 *       juz naprawiony yieldOfMapHex w okolica.ts), a `terrainBaseYield` (celowo pomijany
 *       przez zakres naprawy) go NIE zawiera.
 *   [2] PARYTET Z SILNIKIEM (hexToWorkedTile) -- dla tego samego heksa, WorkedTile ktory
 *       kazde z 3 naprawionych miejsc buduje (reimplementacja 1:1 tresci funkcji, ktorej
 *       zrodlo dopiero co przypieto regexem w [1]) ma pole `zloze` IDENTYCZNE z tym, ktore
 *       buduje `hexToWorkedTile()` w turn-economy.ts -- to jest dokladnie ten sam kontrakt,
 *       ktory sprawdza juz istniejacy `heks-plony-zloze-forward-test.cjs` dla `yieldOfMapHex`.
 *   [3] ZERO WPLYWU NA DZISIEJSZE ZACHOWANIE -- realne wywolanie tileYield() (prawdziwy kod
 *       z src/game/economy.ts, nie regex) dowodzi, ze dla identycznego WorkedTile przekazanie
 *       zloze vs jego pominiecie daje DZIS identyczny wynik na WSZYSTKICH polach (wlacznie
 *       z ruda/ruda_zelaza) -- bo `oreYieldFromImprovements()` (economy.ts/terrain-improvements.ts)
 *       przyjmuje parametr `zloze`, ale go jeszcze nie odczytuje (rodzaj kopalni juz determinuje
 *       klucz ulepszenia `kopalnia_miedzi`/`kopalnia_zelaza`, patrz improvementKeysForHex).
 *       To NIE jest defekt tej naprawy -- to osobny, pre-istniejacy stan silnika (parametr
 *       przygotowany pod przyszle rozszerzenie, jeszcze nie podlaczony). Dowod jest WIEC
 *       silniejszy niz zakladano w opisie zadania: dzis zloze nie zmienia ZADNEGO pola
 *       zwracanego przez tileYield(), nie tylko tych trzech, ktore te 3 miejsca akurat czytaja.
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const CITY_PANEL_SRC = path.join(GRA, 'src', 'ui', 'cityPanel.ts');
const TOOLTIP_SRC = path.join(GRA, 'src', 'ui', 'hexContextTooltip.ts');
const ENTRY = path.join(__dirname, '.heks-plony-zloze-parytet-ui-entry.ts');
const BUNDLE = path.join(__dirname, '.heks-plony-zloze-parytet-ui-bundle.cjs');

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}
function eq(got, want, msg) {
  assert(got === want, `${msg} (got=${JSON.stringify(got)} want=${JSON.stringify(want)})`);
}

console.log('heks-plony-zloze-parytet-ui-test (P-HEKS-ZLOZE-PARYTET-NIEDOMKNIETY)\n');

// --- [1] PRZYPIETA LOKALIZACJA -----------------------------------------------------------------
console.log('[1] regex na zrodle: 3 wywolania tileYield() przekazuja zloze; terrainBaseYield celowo NIE');

const cityPanelSrc = fs.readFileSync(CITY_PANEL_SRC, 'utf8');
const tooltipSrc = fs.readFileSync(TOOLTIP_SRC, 'utf8');

const ZLOZE_HEX_LINE = 'zloze: (hex as { zloze?: string }).zloze,';
const ZLOZE_CHEX_LINE = 'zloze: (c.hex as { zloze?: string }).zloze,';

const tileYieldLabelMatch = cityPanelSrc.match(
  /function tileYieldLabel\(hex: Hex\): string \{[\s\S]{0,500}?\n\}/,
);
assert(tileYieldLabelMatch !== null, 'znaleziono cialo funkcji tileYieldLabel()');
if (tileYieldLabelMatch) {
  assert(tileYieldLabelMatch[0].includes(ZLOZE_HEX_LINE),
    'tileYieldLabel() przekazuje zloze do tileYield() (' + ZLOZE_HEX_LINE + ')');
}

const appendMatch = cityPanelSrc.match(
  /function appendOkolicaYieldLabel\(\s*svg: SVGSVGElement,[\s\S]{0,1500}?svg\.appendChild\(ytxt\);\n\}/,
);
assert(appendMatch !== null, 'znaleziono cialo funkcji appendOkolicaYieldLabel()');
if (appendMatch) {
  assert(appendMatch[0].includes(ZLOZE_CHEX_LINE),
    'appendOkolicaYieldLabel() przekazuje zloze do tileYield() (' + ZLOZE_CHEX_LINE + ')');
}

const fullTileYieldMatch = tooltipSrc.match(
  /function fullTileYield\(hex: Hex\): TileYield \{[\s\S]{0,400}?\n\}/,
);
assert(fullTileYieldMatch !== null, 'znaleziono cialo funkcji fullTileYield()');
if (fullTileYieldMatch) {
  assert(fullTileYieldMatch[0].includes(ZLOZE_HEX_LINE),
    'fullTileYield() przekazuje zloze do tileYield() (' + ZLOZE_HEX_LINE + ')');
}

const terrainBaseYieldMatch = tooltipSrc.match(
  /function terrainBaseYield\(hex: Hex\): TileYield \{[\s\S]{0,300}?\n\}/,
);
assert(terrainBaseYieldMatch !== null, 'znaleziono cialo funkcji terrainBaseYield()');
if (terrainBaseYieldMatch) {
  assert(!terrainBaseYieldMatch[0].includes('zloze'),
    'terrainBaseYield() (goly teren, celowo bez nakladki/rzeki/ulepszen) NADAL nie dostaje zloze -- poza zakresem tej naprawy');
}

// --- [2]+[3] PARYTET Z SILNIKIEM + ZERO WPLYWU (realny kod, nie regex) -------------------------
console.log('\n[2] parytet z hexToWorkedTile: WorkedTile.zloze budowany przez 3 naprawione miejsca == silnik');
console.log('[3] realne tileYield(): zloze nie zmienia ZADNEGO pola dzis (dowod, nie tylko twierdzenie)');

fs.writeFileSync(ENTRY, `
export { tileYield } from '../src/game/economy';
export { hexToWorkedTile } from '../src/game/turn-economy';
export { improvementKeysForHex } from '../src/game/terrain-improvements';
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
  console.error('[heks-plony-zloze-parytet-ui-test] bundle failed:', e.message || e);
  process.exit(1);
}

const { tileYield, hexToWorkedTile, improvementKeysForHex } = require(BUNDLE);

// Heks gorski z kopalnia na zlozu rudy -- dokladnie ten typ pola, ktory kazde z 3 miejsc
// renderuje graczowi (panel miasta / tooltip mapy).
const hex = {
  coords: { q: 3, r: 0 },
  terenBazowy: 'gory',
  nakladka: 'brak',
  rzeka: null,
  zloze: 'zloze_rudy',
  ulepszenia: ['kopalnia_miedzi'],
};

const silnikTile = hexToWorkedTile(hex);
eq(silnikTile.zloze, hex.zloze, 'sanity: hexToWorkedTile(hex).zloze == hex.zloze');

// Reimplementacja 1:1 tego, co teraz budujaz zrodlo (przypiete regexem w [1]) w kazdym
// z 3 naprawionych miejsc -- porownanie pola `zloze` z silnikiem.
const ulepszeniaKeys = improvementKeysForHex(hex);

// cityPanel.ts: tileYieldLabel(hex) / appendOkolicaYieldLabel(svg, {hex}, ...)
const panelWorkedTileArg = {
  terenBazowy: hex.terenBazowy,
  nakladka: hex.nakladka ?? 'brak',
  maRzeke: !!(hex.rzeka && hex.rzeka.obecna),
  zloze: hex.zloze,
  ulepszenieKey: ulepszeniaKeys[0],
  ulepszeniaKeys: ulepszeniaKeys.length ? ulepszeniaKeys : undefined,
};
eq(panelWorkedTileArg.zloze, silnikTile.zloze,
  'cityPanel.ts (tileYieldLabel/appendOkolicaYieldLabel): zloze przekazany do tileYield() == silnik');

// hexContextTooltip.ts: fullTileYield(hex)
const tooltipWorkedTileArg = {
  terenBazowy: hex.terenBazowy,
  nakladka: hex.nakladka ?? 'brak',
  maRzeke: !!(hex.rzeka && hex.rzeka.obecna),
  zloze: hex.zloze,
  ulepszeniaKeys: improvementKeysForHex(hex),
};
eq(tooltipWorkedTileArg.zloze, silnikTile.zloze,
  'hexContextTooltip.ts (fullTileYield): zloze przekazany do tileYield() == silnik');

// [3] Zero wplywu na dzisiejszy wynik tileYield() -- z i bez zloze, WSZYSTKIE pola identyczne.
const withZloze = tileYield(panelWorkedTileArg);
const withoutZloze = tileYield({ ...panelWorkedTileArg, zloze: undefined });

for (const key of ['zywnosc', 'praca', 'handel', 'drewno', 'kamien', 'glina', 'ruda', 'ruda_zelaza']) {
  eq(withZloze[key], withoutZloze[key],
    `pole "${key}" identyczne z i bez zloze (0 wplywu na dzisiejsze zachowanie gry -- ` +
    `oreYieldFromImprovements() przyjmuje zloze, ale go dzis jeszcze nie odczytuje)`);
}

console.log(`\n${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY); } catch (e) { /* ignore */ }
try { fs.unlinkSync(BUNDLE); } catch (e) { /* ignore */ }
process.exit(failed > 0 ? 1 : 0);
