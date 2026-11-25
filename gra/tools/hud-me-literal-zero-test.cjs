/**
 * hud-me-literal-zero-test.cjs
 *
 * R-WEB-HUD-ME-MIGRATION-Q1: strażnik migracji hotseat. W dwóch miejscach HUD /
 * respektu gracza literał `0` (pozostałość po migracji na jednego gracza) został
 * zastąpiony przez `ME()` (aktywny fotel człowieka). Ten test FAILUJE, jeśli
 * `objectivePowerForOwnerEffective(0)` wróci do ciała:
 *   - buildHudState (licznik Mocy w HUD),
 *   - objectiveRespektPctTowardEffective (respekt widoczny dla gracza).
 *
 * Tryb mutacji (dowód, że strażnik jest czerwony po przywróceniu literału):
 *   HUD_ME_GUARD_MAIN=/ścieżka/do/main-z-mutacją.ts node tools/hud-me-literal-zero-test.cjs
 * Domyślnie czyta gra/src/main.ts.
 *
 * Usage (z gra/): node tools/hud-me-literal-zero-test.cjs
 */

'use strict';

const path = require('path');
const fs = require('fs');

const GRA_DIR = path.resolve(__dirname, '..');
const MAIN_TS = process.env.HUD_ME_GUARD_MAIN
  ? path.resolve(process.env.HUD_ME_GUARD_MAIN)
  : path.join(GRA_DIR, 'src/main.ts');

const src = fs.readFileSync(MAIN_TS, 'utf8');

let passCount = 0;
let failCount = 0;

function check(label, cond, detail) {
  if (cond) {
    passCount++;
    console.log('  PASS: ' + label);
  } else {
    failCount++;
    console.log('  FAIL: ' + label + (detail ? ' -- ' + detail : ''));
  }
}

// Wycinek ciała funkcji (od sygnatury, długość ograniczona jak w hud-moc-warstwa-test).
function bodyOf(startRe, maxLen) {
  const m = startRe.exec(src);
  if (!m) return null;
  return src.slice(m.index, m.index + maxLen);
}

const LITERAL_ZERO = /objectivePowerForOwnerEffective\(\s*0\s*\)/;

const respektBody = bodyOf(/function objectiveRespektPctTowardEffective\(/, 600);
check(
  'objectiveRespektPctTowardEffective istnieje w main.ts',
  respektBody !== null,
);
check(
  'objectiveRespektPctTowardEffective: brak literału objectivePowerForOwnerEffective(0)',
  respektBody !== null && !LITERAL_ZERO.test(respektBody),
  'literał 0 zamiast ME() -- regresja migracji hotseat',
);
check(
  'objectiveRespektPctTowardEffective: strona gracza = objectivePowerForOwnerEffective(ME())',
  respektBody !== null && /objectivePowerForOwnerEffective\(ME\(\)\)/.test(respektBody),
);

const hudBody = bodyOf(/function buildHudState\(/, 30000);
const hudPowerLine = hudBody ? /const power = objectivePowerForOwnerEffective\([^;]*\);/.exec(hudBody) : null;
check(
  'buildHudState: linia `const power = objectivePowerForOwnerEffective(...)` istnieje',
  hudPowerLine !== null,
);
check(
  'buildHudState: const power NIE używa literału 0 (ma ME())',
  hudPowerLine !== null && !LITERAL_ZERO.test(hudPowerLine[0]),
  'literał 0 zamiast ME() -- regresja migracji hotseat',
);

// R-WEB-HUD-ME-FOODRESERVE-Q1: ciało buildHudStateRaw wycinane przez dopasowanie nawiasów
// klamrowych (bez stałego okna znaków — odporne na wydłużanie funkcji).
function braceBody(startRe) {
  const m = startRe.exec(src);
  if (!m) return null;
  const open = src.indexOf('{', m.index + m[0].length - 1);
  if (open < 0) return null;
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const ch = src[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return src.slice(m.index, i + 1);
    }
  }
  return null;
}

const rawBody = braceBody(/function buildHudStateRaw\(/);
// Ciało bez komentarzy (komentarze wspominają literały historycznie — nie są kodem).
function stripComments(code) {
  return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}
const rawCode = rawBody === null ? null : stripComments(rawBody);
check(
  'buildHudStateRaw istnieje w main.ts (wycinek nawiasowy)',
  rawBody !== null && rawBody.length > 1000,
);

// Literały właściciela 0 w roli fotela wyświetlanego (zapas/cap/głód/tick żywności).
const FOOD_LITERALS = [
  [/getEmpireFoodReserve\(\s*0\s*\)/, 'getEmpireFoodReserve(0)', 'getEmpireFoodReserve(ownerId)'],
  [/getArmyStarvationCountdown\(\s*0\s*,/, 'getArmyStarvationCountdown(0,', 'getArmyStarvationCountdown(ownerId,'],
  [/getLastEmpireFoodTick\(\s*0\s*\)/, 'getLastEmpireFoodTick(0)', 'getLastEmpireFoodTick(ownerId)'],
  [/isArmyHungry\(\s*0\s*\)/, 'isArmyHungry(0)', 'isArmyHungry(ownerId)'],
];
for (const [re, badLabel, goodLabel] of FOOD_LITERALS) {
  check(
    'buildHudStateRaw: brak ' + badLabel,
    rawCode !== null && !re.test(rawCode),
    'literał 0 zamiast fotela wyświetlanego -- regresja migracji hotseat',
  );
  check(
    'buildHudStateRaw: obecne ' + goodLabel,
    rawCode !== null && rawCode.includes(goodLabel),
  );
}
check(
  'buildHudStateRaw: projectPlayerFoodMaxCap(ownerId) (nie bez argumentu)',
  rawCode !== null && rawCode.includes('projectPlayerFoodMaxCap(ownerId)') && !/projectPlayerFoodMaxCap\(\s*\)/.test(rawCode),
);
const capBody = braceBody(/function projectPlayerFoodMaxCap\(/);
const capCode = capBody === null ? null : stripComments(capBody);
check(
  'projectPlayerFoodMaxCap: używa getEmpireFoodMaxCap(ownerId), nie literału 0',
  capCode !== null && capCode.includes('getEmpireFoodMaxCap(ownerId)') && !/getEmpireFoodMaxCap\(\s*0\s*\)/.test(capCode),
);

console.log('\nWynik: ' + passCount + ' PASS / ' + failCount + ' FAIL');
if (failCount > 0) {
  process.exit(1);
}
