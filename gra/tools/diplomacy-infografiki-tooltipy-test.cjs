'use strict';

/**
 * Kontrakt R-DYPLO-INFOGRAFIKI-TOOLTIPY-Q1.
 * Nie uruchamia bundlera: sprawdza źródło renderera i fizyczne artefakty SVG.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const AUDIENCE = fs.readFileSync(path.join(ROOT, 'src', 'ui', 'diplomacyAudience.ts'), 'utf8');
const giftSvg = fs.readFileSync(path.join(ROOT, 'src', 'ui', 'icons', 'brand', 'dip-gift.svg'), 'utf8');
const vassalSvg = fs.readFileSync(path.join(ROOT, 'src', 'ui', 'icons', 'brand', 'dip-vassal.svg'), 'utf8');

let pass = 0;
let fail = 0;
function ok(condition, message) {
  if (condition) pass++;
  else { fail++; console.error('[FAIL]', message); }
}

const actionMap = AUDIENCE.slice(AUDIENCE.indexOf('function actionIconId'), AUDIENCE.indexOf('/** Ikona traktatu'));
ok(actionMap.includes("case '13': return 'dip-gift';"), 'dar ma dedykowaną ikonę dip-gift');
ok(actionMap.includes("case '12': return 'dip-vassal';") && actionMap.includes("case '15': return 'dip-vassal';"),
  'wasalizacja i wchłonięcie mają dedykowaną ikonę dip-vassal');
ok(!actionMap.includes("case '13': return 'res-culture';") && !actionMap.includes("case '12': return 'tb-army';"),
  'akcje dar/wasal nie wracają do nieadekwatnych ikon zasobu/armii');

ok(giftSvg.includes('<rect') && giftSvg.includes('M12 4v5'), 'artefakt SVG daru zawiera pudełko i wstążkę');
ok(vassalSvg.includes('M4 18h16v2H4') && vassalSvg.includes('M4 18l2-9'),
  'artefakt SVG wasalizacji zawiera koronę i podstawę');

ok(AUDIENCE.includes('dipBrandIconHtml(actionIconId(spec.aid), 24, \'da-action-ic\')'),
  'pasek szybkich akcji korzysta z tego samego mapowania ikon co kafelki umów');
ok(AUDIENCE.includes("const visibleTip = enabled ? spec.label : (tip || spec.label);"),
  'tooltip blokady pokazuje powód zamiast samej nazwy akcji');
ok(AUDIENCE.includes('aria-label="\' + esc(visibleTip) +'),
  'przycisk akcji ma dostępny opis zgodny z widocznym tooltipem');
ok(AUDIENCE.includes('aria-label="\' + esc(qdTitle) +'),
  'Szybka wymiana ma aria-label zgodny z tytułem');

console.log(`[diplomacy-infografiki-tooltipy-test] ${pass} OK, ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
