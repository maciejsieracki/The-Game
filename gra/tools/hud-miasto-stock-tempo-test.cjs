'use strict';
/**
 * hud-miasto-stock-tempo-test.cjs — R-HUD-MIASTO-STOCK-TEMPO-TRZY-ELEMENTY (2026-08-09).
 *
 * Chip karty miasta ma TRZY elementy:
 *   1. duża liczba  = tempo TEGO miasta,
 *   2. mała liczba (+N) = tempo CAŁEJ cywilizacji,
 *   3. `(N)` złote = realny ZAPAS całej cywilizacji (jak duża liczba na HUD mapy).
 *
 * CZĘŚĆ 1 (behawioralna): woła NAPRAWDĘ `buildChipDeltaStockHtml()` z
 *   `src/game/empire-hud-totals.ts` (bundle esbuild, DOM-free) i sprawdza markup.
 * CZĘŚĆ 2 (AST, `typescript` compiler API — wzorem tools/border-march-wygasanie-test.cjs):
 *   pilnuje WIRINGU w `src/ui/cityPanel.ts`, którego część 1 nie widzi:
 *   (a) 6 wywołań `w3CityChip(` ma po 8 argumentów, 8. kończy się na `.stock`;
 *   (b) `buildChipDeltaStockHtml(...)` wołane z DOKŁADNIE 2 argumentami, 2. na `civStock`;
 *   (c) prefiks obiektu bazowego 7. i 8. argumentu identyczny w każdym wywołaniu;
 *   (d) 7. argument kończy się na `.small`.
 *
 * Run from gra/:  node tools/hud-miasto-stock-tempo-test.cjs
 */

const fs = require('fs');
const path = require('path');

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; }
  else { fail++; console.error('FAIL:', label); }
}

// ---------------------------------------------------------------------------
// CZĘŚĆ 1 — BEHAWIORALNA: realne wywołanie buildChipDeltaStockHtml()
// ---------------------------------------------------------------------------
const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[hud-miasto-stock-tempo-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE  = path.resolve(__dirname, '.hud-miasto-stock-tempo-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.hud-miasto-stock-tempo-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
import { buildChipDeltaStockHtml } from '../src/game/empire-hud-totals';
export { buildChipDeltaStockHtml };
`, 'utf-8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true, platform: 'node', format: 'cjs',
    outfile: BUNDLE_FILE, loader: { '.json': 'json', '.ts': 'ts' },
    target: ['node16'], logLevel: 'warning',
  });
} catch (e) {
  console.error('[hud-miasto-stock-tempo-test] esbuild failed:', e.message);
  process.exit(1);
}

const { buildChipDeltaStockHtml } = require(BUNDLE_FILE);

const h1 = buildChipDeltaStockHtml(9, 54);
ok(/class="civ-v-w3-chip-delta green">\+9</.test(h1), 'tempo cywilizacji +9 → mała liczba zielona "+9"');
ok(/class="civ-v-w3-chip-stock">\(54\)</.test(h1), 'zapas cywilizacji 54 → trzeci element "(54)" w nawiasie');
ok(h1.indexOf('civ-v-w3-chip-delta') < h1.indexOf('civ-v-w3-chip-stock'),
  'kolejność: mała liczba (tempo) PRZED trzecim elementem (zapasem)');
ok(/civ-v-w3-chip-stock/.test(h1) && !/civ-v-w3-chip-delta[^"]*stock/.test(h1),
  'zapas ma WŁASNĄ klasę (osobny kolor), nie klasę tempa');

const h2 = buildChipDeltaStockHtml(-3, 7);
ok(/class="civ-v-w3-chip-delta red">-3</.test(h2), 'ujemne tempo cywilizacji → mała liczba czerwona "-3"');
ok(/civ-v-w3-chip-stock">\(7\)</.test(h2), 'zapas renderowany także przy ujemnym tempie');

const h3 = buildChipDeltaStockHtml(0, 12);
ok(!/civ-v-w3-chip-delta/.test(h3), 'tempo 0 → mała liczba pominięta (konwencja fmtResDelta)');
ok(/civ-v-w3-chip-stock">\(12\)</.test(h3), 'tempo 0 NIE kasuje trzeciego elementu (zapas 12 nadal widoczny)');

const h4 = buildChipDeltaStockHtml(5, 0);
ok(/civ-v-w3-chip-delta green">\+5</.test(h4), 'zapas 0 nie kasuje małej liczby');
ok(/civ-v-w3-chip-stock">\(0\)</.test(h4), 'zapas 0 renderowany jako "(0)" (0 to informacja, nie brak danych)');

const h5 = buildChipDeltaStockHtml(5, undefined);
ok(!/civ-v-w3-chip-stock/.test(h5), 'brak danych o zapasie (undefined) → trzeci element pominięty');
const h6 = buildChipDeltaStockHtml(undefined, 5);
ok(!/civ-v-w3-chip-delta/.test(h6), 'brak danych o tempie (undefined) → mała liczba pominięta');
ok(/civ-v-w3-chip-stock">\(5\)</.test(h6), 'brak tempa nie blokuje zapasu');
ok(buildChipDeltaStockHtml(undefined, undefined) === '', 'brak obu → pusty string (chip bez ogona)');

const h7 = buildChipDeltaStockHtml(4.6, 12.4);
ok(/\+5</.test(h7), 'tempo zaokrąglane (4,6 → +5)');
ok(/\(12\)</.test(h7), 'zapas zaokrąglany (12,4 → (12))');

// ---------------------------------------------------------------------------
// CZĘŚĆ 2 — AST: wiring w ui/cityPanel.ts
// ---------------------------------------------------------------------------
const ts = require(path.resolve(__dirname, '..', 'node_modules', 'typescript'));
const CITY_PANEL = path.resolve(__dirname, '..', 'src', 'ui', 'cityPanel.ts');
const srcText = fs.readFileSync(CITY_PANEL, 'utf8');
const sf = ts.createSourceFile(CITY_PANEL, srcText, ts.ScriptTarget.Latest, true);

ok(/import \{[^}]*buildChipDeltaStockHtml[^}]*\} from '\.\.\/game\/empire-hud-totals'/.test(srcText),
  'cityPanel.ts importuje buildChipDeltaStockHtml z game/empire-hud-totals');

/** Zbierz wszystkie wywołania o danej nazwie. */
function collectCalls(name) {
  const out = [];
  (function walk(n) {
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === name) out.push(n);
    ts.forEachChild(n, walk);
  })(sf);
  return out;
}
/** Deklaracja funkcji po nazwie. */
function findFn(name) {
  let found = null;
  (function walk(n) {
    if (ts.isFunctionDeclaration(n) && n.name && n.name.text === name) found = n;
    ts.forEachChild(n, walk);
  })(sf);
  return found;
}

// --- (a) 6 wywołań w3CityChip, po 8 argumentów, 8. kończy się na `.stock`
const chipCalls = collectCalls('w3CityChip');
ok(chipCalls.length === 6, `w3CityChip wołane dokładnie 6× (6 surowców gracza) — jest ${chipCalls.length}`);

const decl = findFn('w3CityChip');
ok(!!decl, 'znaleziono deklarację function w3CityChip');
ok(!!decl && decl.parameters.length === 8,
  `w3CityChip deklaruje 8 parametrów (…, civRate, civStock) — jest ${decl ? decl.parameters.length : 'n/d'}`);

chipCalls.forEach((call, i) => {
  const label = call.arguments[1] ? call.arguments[1].getText(sf) : `#${i}`;
  ok(call.arguments.length === 8,
    `w3CityChip ${label}: 8 argumentów (jest ${call.arguments.length}) — trzeci element chipu podłączony`);
  // element #1: duża liczba MUSI być tempem TEGO miasta (`.big`), nie `.small`/`.stock`
  const a3 = call.arguments[2];
  ok(!!a3 && /\.big\b/.test(a3.getText(sf)) && !/\.(small|stock)\b/.test(a3.getText(sf)),
    `w3CityChip ${label}: 3. argument (duża liczba) to tempo TEGO miasta ".big" — jest "${a3 ? a3.getText(sf) : 'brak'}"`);
  const a7 = call.arguments[6];
  const a8 = call.arguments[7];
  // (d) 7. argument = mała liczba, MUSI być polem `.small`
  ok(!!a7 && /\.small$/.test(a7.getText(sf)),
    `w3CityChip ${label}: 7. argument kończy się na ".small" (tempo cywilizacji, nie zapas) — jest "${a7 ? a7.getText(sf) : 'brak'}"`);
  // (a) 8. argument = zapas
  ok(!!a8 && /\.stock$/.test(a8.getText(sf)),
    `w3CityChip ${label}: 8. argument kończy się na ".stock" (zapas cywilizacji) — jest "${a8 ? a8.getText(sf) : 'brak'}"`);
  // (c) ten sam surowiec w 7. i 8. argumencie
  const base7 = a7 && ts.isPropertyAccessExpression(a7) ? a7.expression.getText(sf) : null;
  const base8 = a8 && ts.isPropertyAccessExpression(a8) ? a8.expression.getText(sf) : null;
  ok(!!base7 && base7 === base8,
    `w3CityChip ${label}: 7. i 8. argument z TEGO SAMEGO surowca (prefiks "${base7}" vs "${base8}")`);
});

// --- (b) wywołanie buildChipDeltaStockHtml WEWNĄTRZ w3CityChip: dokładnie 2 argumenty
const declText = decl ? decl.getText(sf) : '';
const inner = collectCalls('buildChipDeltaStockHtml').filter(
  c => decl && c.getStart(sf) >= decl.getStart(sf) && c.getEnd() <= decl.getEnd(),
);
ok(inner.length === 1, `buildChipDeltaStockHtml wołane dokładnie raz wewnątrz w3CityChip — jest ${inner.length}`);
ok(inner.length === 1 && inner[0].arguments.length === 2,
  `buildChipDeltaStockHtml(...) ma DOKŁADNIE 2 argumenty — jest ${inner.length === 1 ? inner[0].arguments.length : 'n/d'}`);
ok(inner.length === 1 && inner[0].arguments.length >= 1 && /civRate$/.test(inner[0].arguments[0].getText(sf)),
  '1. argument buildChipDeltaStockHtml kończy się na "civRate" (tempo cywilizacji)');
ok(inner.length === 1 && inner[0].arguments.length >= 2 && /civStock$/.test(inner[0].arguments[1].getText(sf)),
  '2. argument buildChipDeltaStockHtml kończy się na "civStock" (zapas cywilizacji)');

// wynik wywołania MUSI trafić do zwracanego HTML (nie do martwej zmiennej)
let inReturn = false;
if (decl) {
  (function walk(n) {
    if (ts.isReturnStatement(n)) {
      const t = n.getText(sf);
      if (t.includes('buildChipDeltaStockHtml(')) inReturn = true;
    }
    ts.forEachChild(n, walk);
  })(decl);
}
ok(inReturn, 'wynik buildChipDeltaStockHtml(...) jest częścią wyrażenia `return` w3CityChip (realnie renderowany)');
ok(/civ-v-w3-chip-stock\{[^}]*color:/.test(srcText),
  'klasa .civ-v-w3-chip-stock ma zdefiniowany własny kolor (złoty) w CSS panelu');

// --- źródła zapasu: 6 pól zapasu z EmpireHudSnap, ŻADNE nie jest polem *Rate
// Znajdź (po KSZTAŁCIE, nie po nazwie zmiennej — odporne na rename/reformat) literał
// obiektu z trójkami per surowiec: 6 kluczy, każdy z podobiektem zawierającym `stock`.
const RES_KEYS = ['praca', 'zywnosc', 'zloto', 'nauka', 'kultura', 'religia'];
let triples = null;
(function walk(n) {
  if (ts.isObjectLiteralExpression(n)) {
    const props = n.properties.filter(p => ts.isPropertyAssignment(p) && p.name);
    const names = props.map(p => p.name.getText(sf));
    if (RES_KEYS.every(k => names.includes(k)) &&
        props.every(p => ts.isObjectLiteralExpression(p.initializer) &&
          p.initializer.properties.some(q => q.name && q.name.getText(sf) === 'stock'))) {
      triples = n;
    }
  }
  ts.forEachChild(n, walk);
})(sf);
ok(!!triples, 'znaleziono literał trójek per surowiec (6 kluczy × {big, small, stock})');

const STOCK_FIELDS = {
  praca: 'pracaPool', zywnosc: 'zywnoscReserve', zloto: 'zloto',
  nauka: 'nauka', kultura: 'kultura', religia: 'religionStock',
};
RES_KEYS.forEach(res => {
  const p = triples && triples.properties.find(q => q.name && q.name.getText(sf) === res);
  const stockProp = p && ts.isPropertyAssignment(p) && ts.isObjectLiteralExpression(p.initializer)
    ? p.initializer.properties.find(q => q.name && q.name.getText(sf) === 'stock') : null;
  const txt = stockProp ? stockProp.initializer.getText(sf) : '';
  ok(new RegExp(`\\.${STOCK_FIELDS[res]}\\b`).test(txt),
    `zapas ${res} czytany z pola ZAPASU .${STOCK_FIELDS[res]} — jest "${txt}"`);
  ok(txt.length > 0 && !/Rate\b/.test(txt),
    `zapas ${res} NIE sięga po żadne pole *Rate (N2: fallback nie może pokazywać tempa) — jest "${txt}"`);
});

// --- N3: komentarz-kanon o doBudynkow
ok(/DOPÓKI kolejka budowy nie jest pusta/.test(srcText),
  'komentarz-kanon mówi "NIE trafia do puli, DOPÓKI kolejka budowy nie jest pusta"');
ok(!/doBudynkow[^\n]{0,120}nigdy nie trafia/i.test(srcText),
  'usunięte fałszywe twierdzenie, że doBudynkow "nigdy" nie trafia do puli imperium');

try { fs.unlinkSync(ENTRY_FILE); } catch (e) { /* ignore */ }
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) { /* ignore */ }

console.log(`\nhud-miasto-stock-tempo-test: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
