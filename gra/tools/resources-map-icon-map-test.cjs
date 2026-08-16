'use strict';
/** Mapa ikon zasobow (resources-map-icon-map.json) — P-IKONA-RUDA-CYNY-PLACEHOLDER (2026-08-14):
 * pilnuje, ze Ruda zelaza i Ruda cyny maja WLASNE, oddzielne pliki ikon (przed fixem dzielily
 * jeden plik res-iron-ore.svg jako placeholder cyny) oraz ze liczba "grudek" (elementow <path>)
 * w kazdej ikonie odpowiada ustaleniu wlasciciela: zelazo=3 grudki, cyna=2 grudki, ten sam kolor
 * stroke #c8ccd4 (Maciej: "kolor powinien byc ten sam").
 * EN: Resource icon map guard — iron ore and tin ore must use separate SVG files with distinct
 * nugget counts (3 vs 2) but identical stroke color, per owner's decision. */
const fs = require('fs');
const path = require('path');

const ICON_MAP_PATH = path.resolve(__dirname, '..', 'src', 'ui', 'icons', 'brand', 'resources-map-icon-map.json');
const ICONS_DIR = path.resolve(__dirname, '..', 'src', 'ui', 'icons', 'brand', 'resources-map');

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error('FAIL:', msg); } }

const raw = fs.readFileSync(ICON_MAP_PATH, 'utf8');
let json;
try {
  json = JSON.parse(raw);
  ok(true, 'resources-map-icon-map.json parsuje sie jako poprawny JSON');
} catch (e) {
  ok(false, `resources-map-icon-map.json NIE parsuje sie jako JSON: ${e.message}`);
  json = { map: {} };
}

const map = json.map || {};

// A. Kazda wartosc w map (poza pustym _default) wskazuje na istniejacy plik res-*.svg w resources-map/.
for (const [key, value] of Object.entries(map)) {
  if (!value) continue;
  const svgPath = path.join(ICONS_DIR, `${value}.svg`);
  ok(fs.existsSync(svgPath), `klucz '${key}' -> '${value}.svg' istnieje w resources-map/ (${svgPath})`);
}

// B. Ruda zelaza (wszystkie warianty klucza) -> res-iron-ore, bez zmian.
ok(map['ruda żelaza'] === 'res-iron-ore', "'ruda żelaza' -> res-iron-ore");
ok(map['ruda zelaza'] === 'res-iron-ore', "'ruda zelaza' -> res-iron-ore");
ok(map['ruda_zelaza'] === 'res-iron-ore', "'ruda_zelaza' -> res-iron-ore");

// C. Ruda cyny (wszystkie warianty klucza) -> res-tin-ore, NIE res-iron-ore.
ok(map['ruda cyny'] === 'res-tin-ore', "'ruda cyny' -> res-tin-ore (dedykowana ikona, nie placeholder zelaza)");
ok(map['ruda_cyny'] === 'res-tin-ore', "'ruda_cyny' -> res-tin-ore (dedykowana ikona, nie placeholder zelaza)");
ok(map['ruda cyny'] !== map['ruda żelaza'],
  "REGRESJA-GUARD: 'ruda cyny' i 'ruda żelaza' NIE wskazuja juz na ten sam plik ikony");

// D. Policz elementy <path> w obu plikach SVG.
function countPaths(svgFile) {
  const content = fs.readFileSync(path.join(ICONS_DIR, `${svgFile}.svg`), 'utf8');
  const matches = content.match(/<path[\s>]/g);
  return matches ? matches.length : 0;
}

const ironPaths = countPaths('res-iron-ore');
const tinPaths = countPaths('res-tin-ore');
ok(ironPaths === 3, `res-iron-ore.svg ma 3 elementy <path> / "grudki" (ma: ${ironPaths})`);
ok(tinPaths === 2, `res-tin-ore.svg ma 2 elementy <path> / "grudki" (ma: ${tinPaths})`);
ok(ironPaths !== tinPaths,
  'REGRESJA-GUARD: liczba grudek zelaza (3) rozni sie od liczby grudek cyny (2) -- wizualne rozroznienie zachowane');

// E. Kolor stroke identyczny w obu plikach (Maciej: "kolor powinien byc ten sam").
function strokeColor(svgFile) {
  const content = fs.readFileSync(path.join(ICONS_DIR, `${svgFile}.svg`), 'utf8');
  const m = content.match(/stroke="(#[0-9a-fA-F]{3,8})"/);
  return m ? m[1] : null;
}
const ironColor = strokeColor('res-iron-ore');
const tinColor = strokeColor('res-tin-ore');
ok(ironColor === '#c8ccd4', `res-iron-ore.svg stroke = #c8ccd4 (ma: ${ironColor})`);
ok(tinColor === '#c8ccd4', `res-tin-ore.svg stroke = #c8ccd4 (ma: ${tinColor})`);
ok(ironColor === tinColor,
  "REGRESJA-GUARD: kolor stroke identyczny miedzy zelazem a cyna (Maciej: 'kolor powinien byc ten sam')");

console.log(`resources-map-icon-map-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
