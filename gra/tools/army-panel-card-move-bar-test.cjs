'use strict';
/**
 * army-panel-card-move-bar-test.cjs
 *
 * TEMAT: R-WEB-UI-ARMY-PANEL-CARD-MOVE-BAR-MISSING-Q1
 *
 * Strukturalny test: karty jednostek w panelu armii (lista armii) i mini-karty stosu
 * muszą mieć pasek POZOSTAŁEGO RUCHU: wypełnienie = ruchLeft / ruchMax, tor widoczny
 * także przy 0, podpowiedź „Ruch: X z Y”.
 *
 * Usage (z gra/): node tools/army-panel-card-move-bar-test.cjs
 */
const fs = require('fs');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const UI = path.resolve(GRA, 'src', 'ui');
const STACK = fs.readFileSync(path.resolve(UI, 'armyStackHud.ts'), 'utf8');
const LIST = fs.readFileSync(path.resolve(UI, 'armyListHud.ts'), 'utf8');
const CSS_HELPER = fs.readFileSync(path.resolve(UI, 'sideListHud.css.ts'), 'utf8');
// Komponent z reklamacji właściciela: karty stosu w podpowiedzi hexa (hexContextTooltip).
const HEX_TIP = fs.readFileSync(path.resolve(UI, 'hexContextTooltip.ts'), 'utf8');

let failures = 0;
function check(name, ok) {
  if (ok) console.log('PASS ' + name);
  else { failures++; console.error('FAIL ' + name); }
}

// 1. Helper procentu: 0 gdy max<=0, zaokrąglenie i clamp do 0..100.
check('pctClamped zwraca 0 dla max<=0',
  /export function pctClamped[\s\S]*?if \(!\(max > 0\)\) return 0;/.test(CSS_HELPER));
check('pctClamped clamp 0..100 i zaokrąglenie',
  /Math\.max\(0, Math\.min\(100, Math\.round\(\(value \/ max\) \* 100\)\)\)/.test(CSS_HELPER));

// 2. Mini-karta stosu: tekst ruchu + pasek ruchu z szerokością = ruchLeft/ruchMax.
check('mini-karta stosu importuje pctClamped',
  /import \{ pctClamped \} from '\.\/sideListHud\.css';/.test(STACK));
check('mini-karta stosu renderuje .ash-card-mv (tekst ruchu) — zachowany format „X/Y ruch”',
  /class="ash-card-mv"[^;]*c\.ruchLeft[^;]*'\/'[^;]*c\.ruchMax[^;]*' ruch<\/div>'/.test(STACK));
check('mini-karta stosu renderuje dwa paski: .ash-card-hp i .ash-card-mvbar',
  /class="ash-card-hp"/.test(STACK) && /class="ash-card-mvbar"/.test(STACK));
check('pasek ruchu mini-karty ma szerokość pctClamped(ruchLeft, ruchMax)',
  /class="ash-card-mvbar"[^]*?style="width:' \+ pctClamped\(c\.ruchLeft, c\.ruchMax\) \+ '%"/.test(STACK));
check('pasek ruchu mini-karty ma podpowiedź „Ruch: X z Y”',
  /class="ash-card-mvbar" title="Ruch: ' \+ c\.ruchLeft \+ ' z ' \+ c\.ruchMax/.test(STACK));
check('CSS toru ruchu mini-karty: widoczny tor (tło + obwódka inset)',
  /\.civ-army-stack \.ash-card-mvbar\{[^}]*background:rgba\(0,0,0,\.35\)[^}]*box-shadow:inset 0 0 0 1px rgba\(111,176,240,\.28\)/.test(STACK));
check('CSS wypełnienia ruchu mini-karty: niebieski gradient',
  /\.civ-army-stack \.ash-card-mvbar i\{[^}]*linear-gradient\(90deg,#1d4e8f,#6fb0f0\)/.test(STACK));

// 3. Karta armii (lista): pasek ruchu renderowany dla ruchMax>0, także przy ruchLeft=0.
check('lista armii: pasek ruchu renderowany gdy ruchMax > 0',
  /if \(typeof a\.ruchMax === 'number' && a\.ruchMax > 0\) \{/.test(LIST));
check('lista armii: ruchLeft domyślnie 0 i pct = pctClamped(ruchLeft, ruchMax)',
  /const ruchVal = a\.ruchLeft \?\? 0;[\s\S]*?const pct = pctClamped\(ruchVal, a\.ruchMax\);/.test(LIST));
check('lista armii: wypełnienie ruchu = pct (0 → pusty, pełny → 100%)',
  /fill\.style\.width = pct \+ '%';\s*mvbar\.appendChild\(fill\);/.test(LIST));
check('lista armii: podpowiedź „Ruch: X z Y”',
  /mvbar\.title = 'Ruch: ' \+ ruchVal \+ ' z ' \+ a\.ruchMax;/.test(LIST));
check('lista armii: etykieta „Ruch” + wartość X/Y',
  /<span>Ruch<\/span><span class="al-bar-val">' \+ ruchVal \+ '\/' \+ a\.ruchMax/.test(LIST));
check('lista armii: tor ruchu ma obwódkę inset (widoczny przy 0)',
  /\.civ-army-list-hud \.al-mvbar\{[^}]*box-shadow:inset 0 0 0 1px rgba\(111,176,240,\.28\)/.test(LIST));

// 4. Karty stosu w podpowiedzi hexa (hexContextTooltip.ts) — komponent ze zrzutu.
check('hexContextTooltip: pasek ruchu karty stosu ma podpowiedź „Ruch: X z Y”',
  /buildUnitStackBarHtml\(movPct, 'mov', `Ruch: \$\{c\.ruchLeft\} z \$\{c\.ruchMax\}`\)/.test(HEX_TIP));
check('hexContextTooltip: szerokość toru ruchu karty stosu = ruchLeft/ruchMax',
  /const movPct = c\.ruchMax > 0 \? \(c\.ruchLeft \/ c\.ruchMax\) \* 100 : 0;/.test(HEX_TIP));
check('hexContextTooltip: podpis karty stosu z etykietą „ruch X/Y”',
  /sp-unit-stack-meta">\$\{Math\.round\(c\.hp\)\}\/\$\{c\.hpMax\} · ruch \$\{c\.ruchLeft\}\/\$\{c\.ruchMax\}</.test(HEX_TIP));
check('hexContextTooltip: tor ruchu karty stosu ma obwódkę inset (widoczny przy 0)',
  /\.sp-unit-stack-bar\{[^}]*box-shadow:inset 0 0 0 1px rgba\(111,176,240,\.28\)/.test(HEX_TIP));
check('hexContextTooltip: pojedyncza jednostka — pasek ruchu z podpowiedzią',
  /buildUnitStackBarHtml\(movPct, 'mov', `Ruch: \$\{u\.ruchLeft\} z \$\{u\.ruchMax\}`\)/.test(HEX_TIP));

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nAll army-panel-card-move-bar checks passed');
