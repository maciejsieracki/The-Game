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

// R-WEB-HUD-ME-FOODRESERVE-Q1 (zarzut FC nr 1+2): projekcja żywności dla fotela wyświetlanego.
// buildHudStateRaw musi wołać projectPlayerFoodProjection(ownerId), a jej ciało nie może
// liczyć wyłącznie właściciela 0 (zapas, miasta, armia, preview).
check(
  'buildHudStateRaw: projectPlayerFoodProjection(ownerId) (nie bez argumentu, nie literał 0)',
  rawCode !== null && rawCode.includes('projectPlayerFoodProjection(ownerId)') && !/projectPlayerFoodProjection\(\s*\)/.test(rawCode) && !/projectPlayerFoodProjection\(\s*0\s*\)/.test(rawCode),
);
// Ciało z typem zwracanym `{...}` w sygnaturze: wycinek do następnej funkcji (nie dopasowanie klamer).
const projStart = /function projectPlayerFoodProjection\(/.exec(src);
const projEnd = projStart ? src.indexOf('function projectPlayerFoodNetRate(', projStart.index) : -1;
const projBody = projStart && projEnd > projStart.index ? src.slice(projStart.index, projEnd) : null;
const projCode = projBody === null ? null : stripComments(projBody);
const PROJ_LITERALS = [
  [/getEmpireFoodReserve\(\s*0\s*\)/, 'getEmpireFoodReserve(0)'],
  [/c\.ownerId\s*===\s*0\b/, 'c.ownerId === 0'],
  [/tk\.ownerId\s*!==\s*0\b/, 'tk.ownerId !== 0'],
  [/u\.ownerId\s*===\s*0\b/, 'u.ownerId === 0'],
  [/buildWonderCityYieldsByOwnerMap\(\s*\[\s*0\s*\]\s*\)/, 'buildWonderCityYieldsByOwnerMap([0])'],
  [/spichlerzSolArmyBonusActive\(\s*0\s*\)/, 'spichlerzSolArmyBonusActive(0)'],
  [/militaryFoodConsumptionWithSpichlerz\(\s*playerUnits\s*,\s*0\s*,/, 'militaryFoodConsumptionWithSpichlerz(playerUnits, 0,'],
  [/new Map\(\[\[0,/, 'new Map([[0,'],
];
for (const [re, label] of PROJ_LITERALS) {
  check(
    'projectPlayerFoodProjection: brak ' + label,
    projCode !== null && !re.test(projCode),
    'właściciel 0 zamiast ownerId -- niespójny HUD hotseat',
  );
}
check(
  'projectPlayerFoodProjection: sygnatura (ownerId: number = 0) i użycie ownerId w zapasie/armii',
  projCode !== null
    && /function projectPlayerFoodProjection\(ownerId: number = 0\)/.test(projBody)
    && projCode.includes('getEmpireFoodReserve(ownerId)')
    && /militaryFoodConsumptionWithSpichlerz\(\s*playerUnits\s*,\s*ownerId\s*,/.test(projCode),
);

// R-WEB-HUD-ME-REMAINING-Q1: pozostałe miejsca, w których literał 0 był podstawieniem
// gracza aktywnego (buildHudStateRaw: pobór, religia, zasoby, handel, rekruci, nazwa/kolor;
// buildEmpireFoodSnap: zapas/cap/tick żywności dla ME()). Kotwice po sygnaturach funkcji.
const REMAINING_RAW = [
  [/ownerReligionForOwnerId\(\s*0\s*\)/, 'ownerReligionForOwnerId(0)'],
  [/buildEmpireResourceRows\(\s*0\s*\)/, 'buildEmpireResourceRows(0)'],
  [/wonderTradeRouteBonusForOwner\(\s*0\s*,/, 'wonderTradeRouteBonusForOwner(0,'],
  [/civManpowerMultsForOwner\(\s*0\s*\)/, 'civManpowerMultsForOwner(0)'],
  [/civKolorHexFn\(\s*0\s*\)/, 'civKolorHexFn(0)'],
  [/leaderNameForOwnerId\(\s*0\s*\)/, 'leaderNameForOwnerId(0)'],
  [/civDisplayNameForOwner\(\s*0\s*\)/, 'civDisplayNameForOwner(0)'],
  [/empirePoborTotals\(\s*cities\s*,\s*0\s*,/, 'empirePoborTotals(cities, 0,'],
  [/r\.toOwnerId\s*===\s*0\b/, 'r.toOwnerId === 0'],
  [/\bplayer\.era\b/, 'player.era'],
  [/player\.civType\b/, 'player.civType'],
];
for (const [re, label] of REMAINING_RAW) {
  check(
    'buildHudStateRaw: brak ' + label + ' (fotel wyświetlany, nie literał 0)',
    rawCode !== null && !re.test(rawCode),
    'literał 0 zamiast ownerId/ps -- regresja migracji hotseat',
  );
}
const REMAINING_RAW_GOOD = [
  'ownerReligionForOwnerId(ownerId)',
  'buildEmpireResourceRows(ownerId)',
  'wonderTradeRouteBonusForOwner(ownerId, r.medium)',
  'civManpowerMultsForOwner(ownerId)',
  'civKolorHexFn(ownerId)',
  'leaderNameForOwnerId(ownerId)',
  'civDisplayNameForOwner(ownerId)',
  'empirePoborTotals(cities, ownerId, ps.era',
  'r.toOwnerId === ownerId',
];
for (const good of REMAINING_RAW_GOOD) {
  check(
    'buildHudStateRaw: obecne ' + good,
    rawCode !== null && rawCode.includes(good),
  );
}

// buildEmpireFoodSnap (zasilane ME() w buildEmpireDetailSnap): zapas/cap/tick = fotel aktywny.
const foodSnapBody = braceBody(/function buildEmpireFoodSnap\(/);
const foodSnapCode = foodSnapBody === null ? null : stripComments(foodSnapBody);
const FOOD_SNAP_LITERALS = [
  [/getLastEmpireFoodTick\(\s*0\s*\)/, 'getLastEmpireFoodTick(0)'],
  [/getEmpireFoodReserve\(\s*0\s*\)/, 'getEmpireFoodReserve(0)'],
  [/getEmpireFoodMaxCap\(\s*0\s*\)/, 'getEmpireFoodMaxCap(0)'],
  [/projectPlayerFoodMaxCap\(\s*\)/, 'projectPlayerFoodMaxCap()'],
];
for (const [re, label] of FOOD_SNAP_LITERALS) {
  check(
    'buildEmpireFoodSnap: brak ' + label,
    foodSnapCode !== null && !re.test(foodSnapCode),
    'literał 0 zamiast ME() -- regresja migracji hotseat',
  );
}
check(
  'buildEmpireFoodSnap: zapas/cap/tick liczone dla ME()',
  foodSnapCode !== null
    && foodSnapCode.includes('getLastEmpireFoodTick(ME())')
    && foodSnapCode.includes('getEmpireFoodReserve(ME())')
    && foodSnapCode.includes('getEmpireFoodMaxCap(ME())')
    && foodSnapCode.includes('projectPlayerFoodMaxCap(ME())'),
);

console.log('\nWynik: ' + passCount + ' PASS / ' + failCount + ' FAIL');
if (failCount > 0) {
  process.exit(1);
}
