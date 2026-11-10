'use strict';
/**
 * battle-damage-colors-test.cjs
 * R-WEB-BATTLE-DAMAGE-COLORS-PLAYER-RED-ENEMY-YELLOW-Q1
 *
 * Strukturalny test (bez przeglądarki): straty GRACZA = czerwone, straty PRZECIWNIKA = żółte.
 *   A -- tokeny w battleHudTheme.ts (jedno miejsce), funkcja battleLossTextColor(isPlayer).
 *   B -- kontrast WCAG (AA, tekst normalny >= 4.5:1) tokenów strat na tle HUD/karty (ciemne).
 *   C -- pływające liczby obrażeń: battleScene.ts (_spawnDamageLabel) i manualBattle.ts wg strony jednostki.
 *   D -- ekran wyniku: endScreen1E.ts („Twoje straty" = czerwone, „Straty wroga" = żółte).
 *   E -- szczegóły bitwy: postBattleSummary.ts (zniszczone/straty wg strony), brak surowych #hex strat w tych miejscach.
 *   F -- brak pozostałości starego koloru #ff4444 w znacznikach obrażeń.
 *
 * Nie sprawdza wizualnie w Chromium (NIE_ZMIERZONO w raporcie operatora).
 * Usage: node tools/battle-damage-colors-test.cjs   (z katalogu gra/)
 */
const fs = require('fs');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(GRA, rel), 'utf8');

let pass = 0;
let fail = 0;
const failures = [];
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; failures.push(name); console.log('  FAIL ' + name + (detail ? ' -- ' + detail : '')); }
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16));
}
function relLum([r, g, b]) {
  const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrast(a, b) {
  const la = relLum(a), lb = relLum(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

const theme = read('src/battle/battleHudTheme.ts');
const scene = read('src/battle/battleScene.ts');
const manual = read('src/battle/manualBattle.ts');
const endScreen = read('src/battle/endScreen1E.ts');
const summary = read('src/ui/postBattleSummary.ts');

console.log('A. Tokeny strat w battleHudTheme.ts');
const tokenRe = (n) => new RegExp("export const " + n + " = '(#[0-9a-fA-F]{6})'");
const pText = (theme.match(tokenRe('BATTLE_LOSS_PLAYER_TEXT')) || [])[1];
const eText = (theme.match(tokenRe('BATTLE_LOSS_ENEMY_TEXT')) || [])[1];
check('BATTLE_LOSS_PLAYER_TEXT zdefiniowany (hex)', !!pText, pText);
check('BATTLE_LOSS_ENEMY_TEXT zdefiniowany (hex)', !!eText, eText);
check('funkcja battleLossTextColor(isPlayerUnit) eksportowana',
  /export function battleLossTextColor\(isPlayerUnit: boolean\): string/.test(theme));
check('battleLossTextColor: gracz -> czerwony token, przeciwnik -> żółty token',
  /return isPlayerUnit \? BATTLE_LOSS_PLAYER_TEXT : BATTLE_LOSS_ENEMY_TEXT;/.test(theme));

// czerwony: R dominuje; żółty: R i G wysokie, B niskie
if (pText && eText) {
  const [pr, pg, pb] = hexToRgb(pText);
  const [er, eg, eb] = hexToRgb(eText);
  check('strata gracza ma barwę czerwoną (R > 2*G, R > B)', pr > 2 * pg && pr > pb, pText);
  check('strata przeciwnika ma barwę żółtą (R i G > 2*B, |R-G| < 60)', er > 2 * eb && eg > 2 * eb && Math.abs(er - eg) < 60, eText);
}

console.log('B. Kontrast WCAG na ciemnym tle');
const darkBgs = { 'tło karty HUD #0a0d14': [10, 13, 20], 'tło karty gracza #12202e': [18, 32, 46], 'tło tafli #1a1a1a': [26, 26, 26] };
if (pText && eText) {
  for (const [label, bg] of Object.entries(darkBgs)) {
    const cp = contrast(hexToRgb(pText), bg);
    const ce = contrast(hexToRgb(eText), bg);
    check('kontrast czerwony (gracz) na ' + label + ' >= 4.5 (' + cp.toFixed(2) + ')', cp >= 4.5);
    check('kontrast żółty (przeciwnik) na ' + label + ' >= 4.5 (' + ce.toFixed(2) + ')', ce >= 4.5);
  }
}
check('tła strat (BG) zdefiniowane', /BATTLE_LOSS_PLAYER_BG = 'rgba\(229,72,77/.test(theme) && /BATTLE_LOSS_ENEMY_BG = 'rgba\(255,213,74/.test(theme));

console.log('C. Pływające liczby obrażeń (bitwa polowa i ręczna)');
const spawnScene = (scene.match(/private _spawnDamageLabel\(ru: RuntimeBattleUnit[\s\S]*?\n  \}\n/) || [''])[0];
check('battleScene._spawnDamageLabel istnieje', spawnScene.length > 0);
check('battleScene: kolor etykiety wg strony jednostki (battleLossTextColor(this._isPlayerSide(ru.side)))',
  spawnScene.includes('battleLossTextColor(this._isPlayerSide(ru.side))'));
check('battleScene: import battleLossTextColor z battleHudTheme', /battleLossTextColor,\s*\n\} from '\.\/battleHudTheme';/.test(scene));
const spawnManual = (manual.match(/private _spawnDamageLabel\(ru: RuntimeUnit[\s\S]*?\n  \}\n/) || [''])[0];
check('manualBattle._spawnDamageLabel istnieje', spawnManual.length > 0);
check('manualBattle: gracz (side==="player") -> BATTLE_LOSS_PLAYER_TEXT, przeciwnik -> BATTLE_LOSS_ENEMY_TEXT',
  /color: ru\.side === 'player' \? BATTLE_LOSS_PLAYER_TEXT : BATTLE_LOSS_ENEMY_TEXT/.test(spawnManual));
check('manualBattle: import tokenów strat', /import \{ BATTLE_LOSS_PLAYER_TEXT, BATTLE_LOSS_ENEMY_TEXT \} from '\.\/battleHudTheme';/.test(manual));

console.log('D. Ekran wyniku bitwy (endScreen1E)');
check('„Twoje straty" używa BATTLE_LOSS_PLAYER_TEXT (czerwony)',
  /statTileHtml\('−' \+ playerLost, 'Twoje straty', BATTLE_LOSS_PLAYER_TEXT,/.test(endScreen));
check('„Straty wroga" używa BATTLE_LOSS_ENEMY_TEXT (żółty)',
  /statTileHtml\('−' \+ enemyLost, 'Straty wroga', BATTLE_LOSS_ENEMY_TEXT,/.test(endScreen));
check('endScreen1E: brak starego koloru strat gracza (BATTLE_PLAYER_TEXT) w kaflach',
  !/'Twoje straty', BATTLE_PLAYER_TEXT/.test(endScreen));

console.log('E. Szczegóły bitwy (postBattleSummary)');
check('postBattleSummary: import battleLossTextColor', /\n  battleLossTextColor,\n/.test(summary));
check('postBattleSummary: tekst strat wg strony (battleLossTextColor(isPlayer))',
  summary.includes('battleLossTextColor(isPlayer)'));
check('postBattleSummary: zniszczona jednostka gracza ma obwódkę czerwoną (rgba(229,72,77',
  summary.includes("(isPlayer ? 'rgba(229,72,77,.55)' : 'rgba(255,213,74,.55)')"));

console.log('F. Brak starego koloru strat w znacznikach obrażeń');
check('battleScene: brak literału #ff4444 w _spawnDamageLabel', !/#ff4444/.test(spawnScene));
check('manualBattle: brak literału #ff4444 w _spawnDamageLabel', !/#ff4444/.test(spawnManual));

console.log('');
console.log('WYNIK: ' + pass + ' PASS / ' + fail + ' FAIL');
if (fail > 0) {
  console.log('FAIL: ' + failures.join('; '));
  process.exit(1);
}
process.exit(0);
