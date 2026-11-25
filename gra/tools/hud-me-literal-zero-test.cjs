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

// R-WEB-HUD-ME-REMAINING-Q1: podglądy (panel Handel / Imperium, prognoza producentów,
// przegląd religii) — literał 0 w roli gracza aktywnego zamieniony na ME() / stan fotela.
// Ciało wycinane do następnej funkcji na tym samym poziomie wcięcia (bez klamer w typie zwracanym).
function sliceToNextFn(startRe) {
  const m = startRe.exec(src);
  if (!m) return null;
  const next = src.indexOf('\n    function ', m.index + m[0].length);
  return next > m.index ? src.slice(m.index, next) : null;
}
const forecastCode = (() => { const b = sliceToNextFn(/function producersForecastArgs\(/); return b === null ? null : stripComments(b); })();
const tradeCode = (() => { const b = sliceToNextFn(/function buildEmpireTradeSnap\(/); return b === null ? null : stripComments(b); })();
const religionOvCode = (() => { const b = sliceToNextFn(/function buildReligionOverlayData\(/); return b === null ? null : stripComments(b); })();

const PANEL_LITERALS = [
  ['producersForecastArgs', forecastCode, /\bplayer\.era\b/, 'player.era'],
  ['producersForecastArgs', forecastCode, /\bplayer\.zbadane\b/, 'player.zbadane'],
  ['producersForecastArgs', forecastCode, /\bplayer\.civType\b/, 'player.civType'],
  ['buildEmpireTradeSnap', tradeCode, /wonderTradeRouteBonusForOwner\(\s*0\s*,/, 'wonderTradeRouteBonusForOwner(0,'],
  ['buildEmpireTradeSnap', tradeCode, /capitalCityIdForOwner\(\s*0\s*\)/, 'capitalCityIdForOwner(0)'],
  ['buildEmpireTradeSnap', tradeCode, /unlockedTechsForOwner\(\s*0\s*\)/, 'unlockedTechsForOwner(0)'],
  ['buildEmpireTradeSnap', tradeCode, /ownerZlotoAccessForMennicaEffective\(\s*0\s*\)/, 'ownerZlotoAccessForMennicaEffective(0)'],
  ['buildEmpireTradeSnap', tradeCode, /strony\.includes\(\s*0\s*\)/, 'strony.includes(0)'],
  ['buildEmpireTradeSnap', tradeCode, /strony\[0\]\s*===\s*0\b/, 'strony[0] === 0'],
  ['buildReligionOverlayData', religionOvCode, /ownerReligionForOwnerId\(\s*0\s*\)/, 'ownerReligionForOwnerId(0)'],
];
for (const [fn, code, re, label] of PANEL_LITERALS) {
  check(
    fn + ': brak ' + label + ' (gracz aktywny = ME() / stan fotela)',
    code !== null && !re.test(code),
    'literał 0 zamiast fotela aktywnego -- regresja migracji hotseat',
  );
}
check(
  'producersForecastArgs: stan fotela aktywnego (psMe) w base',
  forecastCode !== null
    && forecastCode.includes('playerStateByHuman.get(me) ?? player')
    && forecastCode.includes('playerEra: psMe.era')
    && forecastCode.includes('playerZbadane: psMe.zbadane'),
);
check(
  'buildEmpireTradeSnap: ME() jako właściciel panelu Handel/Imperium',
  tradeCode !== null
    && tradeCode.includes('wonderTradeRouteBonusForOwner(ME(), r.medium)')
    && tradeCode.includes('capitalCityIdForOwner(ME())')
    && tradeCode.includes('unlockedTechsForOwner(ME())')
    && tradeCode.includes('ownerZlotoAccessForMennicaEffective(ME())')
    && tradeCode.includes('wonderTradeRouteBonusForOwner(ME(), \'lad\')')
    && tradeCode.includes('wonderTradeRouteBonusForOwner(ME(), \'morze\')')
    && tradeCode.includes('deal.strony.includes(ME())'),
);
const powerOvBody = (() => { const m = /function buildPowerOverlayData\(/.exec(src); if (!m) return null; const n = src.indexOf('\n    function ', m.index + m[0].length); return n > m.index ? stripComments(src.slice(m.index, n)) : null; })();
check(
  'buildPowerOverlayData: objectivePowerForOwnerEffective(ME()), bez literału 0',
  powerOvBody !== null && powerOvBody.includes('buildObjectivePowerForOwnerEffective(ME())') && !/buildObjectivePowerForOwnerEffective\(\s*0\s*\)/.test(powerOvBody),
);
check(
  'buildReligionOverlayData: ownerReligionForOwnerId(ME())',
  religionOvCode !== null && religionOvCode.includes('ownerReligionForOwnerId(ME())'),
);

// R-WEB-HUD-ME-POWERRANK-RELIGION-Q1: ranking Mocy, nakładka zasięgu religii i lista graczy
// zwycięstwa — literał 0 był podstawieniem gracza aktywnego; zamieniony na ME() (kotwice po
// sygnaturach/nazwach pól, każda linia osobno — mutacja cofająca linię daje FAIL).
const POWERRANK_LINES = [
  ['buildAbsolutePowerRank: civ = ME()', /civ: oid === ME\(\) \? civDisplayNameForKey\(civKeyForOwner\(oid\)\) : ownerDiploLabel\(oid\),/],
  ['buildAbsolutePowerRank: isPlayer = ME()', /isPlayer: oid === ME\(\),/],
  ['buildPowerDiag labelForOwner = ME()', /labelForOwner: \(oid\) => oid === ME\(\)\s*\? civDisplayNameForKey\(civKeyForOwner\(oid\)\)/],
  ['nakładka religii: ownerReligionForOwnerId(ME())', /const stateRel = ownerReligionForOwnerId\(ME\(\)\);\s*const keys = collectReligionRangeHexKeys\(/],
  ['nakładka religii: collectReligionRangeHexKeys(..., ME())', /collectReligionRangeHexKeys\(\s*map, rangeCityInputs\(\), cityRelig, stateRel, rp, ME\(\),/],
  ['lista zwycięstwa: typCywilizacji = ME()', /typCywilizacji: oid === ME\(\) \? player\.civType/],
  ['lista zwycięstwa: ai = !isHuman(oid) (dowolny fotel człowieka nie jest AI)', /ai: !isHuman\(oid\),/],
];
const POWERRANK_LITERALS = [
  /civDisplayNameForKey\(civKeyForOwner\(0\)\)/,
  /isPlayer: oid === 0,/,
  /const stateRel = ownerReligionForOwnerId\(0\);\s*const keys = collectReligionRangeHexKeys\(/,
  /rangeCityInputs\(\), cityRelig, stateRel, rp, 0,/,
  /typCywilizacji: oid === 0 /,
  /ai: oid !== 0,/,
];
for (const [label, re] of POWERRANK_LINES) {
  check(label, re.test(src));
}
check(
  'R-WEB-HUD-ME-POWERRANK-RELIGION-Q1: brak literału 0 w miejscach rankingu/religii/zwycięstwa',
  !POWERRANK_LITERALS.some(re => re.test(src)),
  'literał 0 zamiast gracza aktywnego -- regresja hotseat',
);

// R-WEB-HUD-ME-EMPIREHUD-Q1: panel imperium `getEmpireHud(oid)` -- literał 0 w guardzie,
// filtrze miast, religii państwa i buildHudState był gracza aktywnego. Kotwica po sygnaturze
// (ciało wycinane po nawiasach z pominięciem komentarzy); każda linia osobno.
const empireHudBody = (() => {
  const m = /getEmpireHud: \(oid: number\) => \{/.exec(src);
  if (!m) return null;
  const open = m.index + m[0].length - 1;
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) return stripComments(src.slice(m.index, i + 1));
    }
  }
  return null;
})();
const EMPIREHUD_LINES = [
  ['getEmpireHud: guarda = isHuman(oid) (nie oid !== 0)', /if \(!isHuman\(oid\)\) return null;/],
  ['getEmpireHud: buildHudState(oid)', /const hs = buildHudState\(oid\);/],
  ['getEmpireHud: pc = miasta fotela oid', /const pc = cities\.filter\(c => c\.ownerId === oid\);/],
  ['getEmpireHud: stateRel = ownerReligionForOwnerId(oid)', /const stateRel = ownerReligionForOwnerId\(oid\);/],
];
for (const [label, re] of EMPIREHUD_LINES) {
  check(label, empireHudBody !== null && re.test(empireHudBody));
}
const EMPIREHUD_LITERALS = [
  /oid !== 0\)/,
  /buildHudState\(\)/,
  /c\.ownerId === 0\)/,
  /ownerReligionForOwnerId\(\s*0\s*\)/,
];
check(
  'getEmpireHud: brak literału 0 (guarda, buildHudState, miasta, religia)',
  empireHudBody !== null && !EMPIREHUD_LITERALS.some(re => re.test(empireHudBody)),
  'literał 0 zamiast fotela wyświetlanego -- regresja hotseat',
);

// buildHudStateRaw: wybór wierszy niedoboru dla fotela wyświetlanego (`isMe`, nie literał 0).
check(
  'buildHudStateRaw: shortageRows = isMe(ownerId) (nie ownerId === 0)',
  rawCode !== null
    && rawCode.includes('const shortageRows = isMe(ownerId)')
    && !/const shortageRows = ownerId === 0\b/.test(rawCode),
);

// R-WEB-HUD-ME-RESIDUAL-Q1: ostatnie literały 0 (gracz aktywny) -> ME().
// Każda zmieniona linia ma strażnika: wiersz = [tekst nowej linii, liczba zmian w diffie,
// oczekiwana liczba wystąpień tekstu w main.ts]. Przywrócenie `=== 0` w zmienionej linii
// zmienia liczbę wystąpień nowego tekstu -> FAIL (mutacja czerwona dla każdej linii).
const RESIDUAL_ROWS = [
  ["const openCity = cities.find(c => c.id === openId && c.ownerId === ME());", 1, 1],
  ["return cities.find(c => c.ownerId === ME())?.id ?? null;", 1, 1],
  ["if (city.ownerId === ME()) {", 3, 3],
  ["if (completed.id === 'spichlerz' && city.ownerId === ME()) updateHud();", 1, 1],
  ["...(city.ownerId === ME() ? { followGeneral: recruitFollowGeneralForOrder('city', recruitFollowGeneralDefault) } : {}),", 1, 1],
  ["if (ownerId === ME()) showHintMessage(CITY_SIEGE_RECRUIT_BLOCK_PL, 2800);", 2, 2],
  ["if (ownerId === ME()) showHintMessage(superMsg, 3200);", 2, 2],
  ["if (ownerId === ME()) {", 12, 12],
  ["if (ownerId === ME()) showHintMessage(recruitHint, 2800);", 1, 1],
  ["const followIntent = city.ownerId === ME()", 1, 1],
  ["if (ownerId === ME()) showHintMessage(`Za mało złota na ${count} jedn. rekrutacji`, 2800);", 1, 1],
  ["if (ownerId === ME()) showHintMessage(`Za mało rekrutów (Manpower) na ${count} jedn.`, 2800);", 1, 1],
  ["const batchFollowIntent = ownerId === ME()", 1, 1],
  ["if (site.ownerId === ME()) {", 2, 2],
  ["const site = wonderBuildSites.find(s => s.wonderId === wonderId && s.ownerId === ME());", 1, 1],
  ["const cityLabel = cityAtUnit(u)?.name ?? cities.find(c => c.ownerId === ME())?.name ?? 'imperium';", 1, 1],
  ["typeId, data, civBonusyForOwnerId(ME()), player.kosztJednostekPace ?? 'niski', 0, _menuDifficulty,", 1, 1],
  ["return u.ownerId === ME() && isUnitInPlayerTerritory(u) && u.replaceUsedThisTurn !== true", 1, 1],
  ["if (t.ownerId === ME() && isUnitInPlayerTerritory(t) && t.replaceUsedThisTurn !== true) {", 1, 1],
  ["const replaceCity = unitReplaceGarrisonCity(u) ?? cities.find(c => c.ownerId === ME());", 1, 1],
  ["isPlayer: id === ME(),", 1, 1],
  ["if (w.ownerId === ME()) return w;", 1, 1],
  ["for (const c of cities.filter(c => c.ownerId === ME())) {", 1, 2],
  ["if (!c || c.ownerId !== ME()) return;", 2, 2],
  ["if (!city || city.ownerId !== ME()) return;", 4, 4],
  ["if (u.ownerId !== ME()) return false;", 1, 1],
  ["const ep = empireEpochForOwner(ME());", 1, 1],
  ["const mpMults = civManpowerMultsForOwner(ME());", 1, 2],
  ["refundManpowerToEmpire(cities, ME(), ep, mpRefund, mpMults.maxMult);", 1, 1],
  ["ownerResourceCap(cities, cityBuilt, ME(), data, _menuDifficulty, ep);", 1, 1],
  ["snapshotOwnersStock([ME()], o => ownerResourceStockAll(cities, o));", 1, 1],
  ["disbandStockRefundCredit(cities, ME(), u, stockRefundCap);", 1, 1],
  ["if (u.ownerId !== ME()) return;", 1, 1],
  ["if (!u || u.ownerId !== ME()) return false;", 1, 2],
  ["if (!u || u.ownerId !== ME()) return;", 1, 1],
  ["if (!u || u.ownerId !== ME() || u.inGarnizon !== true) return;", 1, 1],
  ["if (executed && (proposerId === ME() || responderId === ME())) updateHud();", 1, 1],
  ["if (responderId === ME() || proposerId === ME()) updateHud();", 1, 1],
  ["if (route.ownerId !== ME() && route.toOwnerId !== ME()) continue;", 1, 1],
  ["if (ownerId !== ME() || playerArmyFoodHintShown) return;", 1, 1],
  ["getEmpireFoodReserve(ME())", 1, 2],
  ["if (bId === undefined || bId === ME() || city.ownerId === bId) return;", 1, 1],
  ["if (city.ownerId !== ME()) return false;", 1, 1],
  ["listBuildableWondersForOwner(ME())", 1, 3],
  ["if (toOwnerId === ME()) {", 1, 1],
  ["for (const t of basketTransferCtx.researchedByOwner.get(ME()) ?? []) {", 1, 1],
  ["if (su.ownerId === ME()) {", 1, 1],
  ["if (showPlayerHints && u.ownerId === ME()) {", 1, 1],
  ["if (u.ownerId === ME()) continue;", 1, 1],
  ["if (ownerId === ME()) return player.zbadane.has(EMBARK_TECH);", 1, 1],
  [".filter(c => c.ownerId === ME())", 1, 12],
  ["const ownUnitHere = units.some(u => u.ownerId === ME() && u.q === q && u.r === r);", 1, 1],
  ["if (u && u.ownerId === ME() && stackCanMove(u) && !u.oblegaCityId) {", 1, 1],
  ["if (ctx.oblegajacyOwnerId === ME()) {", 2, 2],
  ["const isPlayerRoute = (r: TradeRoute): boolean => r.ownerId === ME() || r.toOwnerId === ME();", 1, 1],
  ["const playerCityIdOf = (r: TradeRoute): string => (r.ownerId === ME() ? r.fromCityId : r.toCityId);", 1, 1],
  ["const civLabel = wewnetrzna ? 'handel wewnętrzny' : ownerDiploLabel(route.ownerId === ME() ? route.toOwnerId : route.ownerId);", 1, 1],
  ["if (ownerId === ME()) return String(player.civType || _menuCivId || 'gracz');", 1, 1],
  ["getNaukaRate: (ownerId: number) => buildHudState(ownerId).naukaRate ?? 0,", 1, 1],
  // R-WEB-HUD-ME-RESIDUAL-Q1 (runda 3, zarzut FC nr 5): literały 0 w roli gracza aktywnego -> ME().
  // Każdy wiersz = jedna zmieniona linia main.ts; przywrócenie literału 0 zmienia liczbę wystąpień.
  ["if (c.ownerId !== ME()) continue;", 1, 1],
  ["civType: civTypeForOwner(ME()),", 1, 1],
  ["return listBuildableWondersForOwner(ME()).map(w => ({", 1, 1],
  ["const list = listBuildableWondersForOwner(ME());", 1, 1],
  ["hasTradeRouteResourceAccess(tradeRouteResourceGrants, ME(), 'kon'),", 1, 1],
  ["const ok = setPlayerResearchTarget(player, techName, data.tech, researchGateForOwner(ME()));", 1, 1],
  ["const playerCiv = civTypeForOwner(ME());", 1, 1],
  ["horseStockAvailable: citySurowceSumForOwner(ME()).kon ?? 0,", 1, 1],
  ["ownUnitHexKeys: ownUnitHexKeysForOwner(ME()),", 1, 1],
  ["const horseStockNow = citySurowceSumForOwner(ME()).kon ?? 0;", 1, 1],
  ["onOpenTree: () => showTechTreeView(ME()),", 1, 1],
  ["showTechTreeView(ME());", 1, 1],
];
for (const [text, changes, expectedOcc] of RESIDUAL_ROWS) {
  const occ = src.split(text).length - 1;
  check(
    'RESIDUAL (zmian ' + changes + '): ' + text.slice(0, 80),
    occ === expectedOcc,
    'wystąpień ' + occ + ', oczekiwano ' + expectedOcc + ' -- literał 0 wrócił albo linia zmieniona cofnięta',
  );
}

console.log('\nWynik: ' + passCount + ' PASS / ' + failCount + ' FAIL');
if (failCount > 0) {
  process.exit(1);
}
