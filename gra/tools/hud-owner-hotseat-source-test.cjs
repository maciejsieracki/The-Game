/**
 * hud-owner-hotseat-source-test.cjs
 *
 * R-WEB-HUD-ME-REMAINING-Q1: test źródłowy hotseat dla HUD. Dowodzi, że
 * buildHudStateRaw(ownerId) czyta dane FOTELA ownerId (nie właściciela 0) dla
 * reprezentantów: zasoby, religia, nazwa przywódcy, kolor cywilizacji, nazwa
 * narodu, pobór ludzi, zapas żywności. Dla każdego reprezentanta sprawdza:
 *   (a) wywołanie w buildHudStateRaw przekazuje ownerId (nie literał 0),
 *   (b) funkcja pomocnicza przyjmuje parametr ownerId i używa go w ciele
 *       (nie stałej 0 ani pola singletonu `player`).
 *
 * Uwaga: to test źródłowy (nie uruchamia gry). Zachowanie w grze jednoosobowej
 * (ownerId = 0) jest bit-w-bit tym samym kodem; dowód runtime hotseat jest osobnym
 * tematem (live).
 *
 * Usage (z gra/): node tools/hud-owner-hotseat-source-test.cjs
 */

'use strict';

const path = require('path');
const fs = require('fs');

const GRA_DIR = path.resolve(__dirname, '..');
// Domyślnie gra/src/main.ts; HUD_OWNER_GUARD_MAIN=<plik> -- tryb mutacji (dowód czerwieni).
const MAIN_TS = process.env.HUD_OWNER_GUARD_MAIN
  ? path.resolve(process.env.HUD_OWNER_GUARD_MAIN)
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

function stripComments(code) {
  return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

// Ciało funkcji wycinane dopasowaniem nawiasów klamrowych (bez stałych okien znaków).
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
const rawCode = rawBody === null ? null : stripComments(rawBody);
check('buildHudStateRaw istnieje (wycinek nawiasowy)', rawCode !== null && rawCode.length > 1000);
check(
  'buildHudStateRaw przyjmuje ownerId jako parametr',
  /function buildHudStateRaw\(ownerId: number = ME\(\)\)/.test(src),
);

// Reprezentanci: [etykieta, wywołanie w HUD, sygnatura helpera (regex), nazwa helpera].
const REPRESENTATIVES = [
  ['zasoby', 'buildEmpireResourceRows(ownerId)', /function buildEmpireResourceRows\(ownerId: number\)/, 'buildEmpireResourceRows'],
  ['religia', 'ownerReligionForOwnerId(ownerId)', /function ownerReligionForOwnerId\(ownerId: number\)/, 'ownerReligionForOwnerId'],
  ['nazwa przywódcy', 'leaderNameForOwnerId(ownerId)', /function leaderNameForOwnerId\(ownerId: number\)/, 'leaderNameForOwnerId'],
  ['kolor cywilizacji', 'civKolorHexFn(ownerId)', /function civKolorHexFn\(ownerId: number\)/, 'civKolorHexFn'],
  ['nazwa narodu', 'civDisplayNameForOwner(ownerId)', /function civDisplayNameForOwner\(ownerId: number\)/, 'civDisplayNameForOwner'],
  ['pobór ludzi', 'empirePoborTotals(cities, ownerId,', /function empirePoborTotals\(/, 'empirePoborTotals'],
  ['mnożniki poboru', 'civManpowerMultsForOwner(ownerId)', /function civManpowerMultsForOwner\(ownerId: number\)/, 'civManpowerMultsForOwner'],
];

for (const [label, call, sigRe, helper] of REPRESENTATIVES) {
  check(
    'HUD (' + label + '): buildHudStateRaw wywołuje ' + call,
    rawCode !== null && rawCode.includes(call),
  );
  // empirePoborTotals jest importowany z src/game/manpower.ts; sprawdzamy jego sygnaturę tam.
  const sigSrc = helper === 'empirePoborTotals'
    ? fs.readFileSync(path.join(GRA_DIR, 'src/game/manpower.ts'), 'utf8')
    : src;
  const sig = sigRe.exec(sigSrc);
  const sigOk = helper === 'empirePoborTotals'
    ? sig !== null && /ownerId: number/.test(sigSrc.slice(sig.index, sig.index + 200))
    : sig !== null;
  check(
    'HUD (' + label + '): helper ' + helper + ' przyjmuje ownerId',
    sigOk,
  );
}

// Ciała helperów: używają ownerId (nie literału 0 i nie singletonu `player`).
const BODY_HELPERS = [
  ['buildEmpireResourceRows', /function buildEmpireResourceRows\(ownerId: number\)/],
  ['ownerReligionForOwnerId', /function ownerReligionForOwnerId\(ownerId: number\)/],
  ['leaderNameForOwnerId', /function leaderNameForOwnerId\(ownerId: number\)/],
  ['civKolorHexFn', /function civKolorHexFn\(ownerId: number\)/],
  ['civDisplayNameForOwner', /function civDisplayNameForOwner\(ownerId: number\)/],
  ['civManpowerMultsForOwner', /function civManpowerMultsForOwner\(ownerId: number\)/],
];
for (const [name, re] of BODY_HELPERS) {
  const m = re.exec(src);
  const body = m === null ? null : braceBody(re);
  const code = body === null ? null : stripComments(body);
  check(
    'helper ' + name + ': ciało istnieje i czyta ownerId',
    code !== null && /\bownerId\b/.test(code.slice(code.indexOf('{') + 1)),
  );
  check(
    'helper ' + name + ': brak literału 0 jako właściciela w ciele',
    code !== null && !/ForOwner\(\s*0\s*\)|ownerId\s*===\s*0\b\s*\?\s*player/.test(code),
  );
}

// Zapas i cap żywności w HUD: dla ownerId ≠ 0 projekcja wołana z ownerId.
check(
  'HUD (żywność): getEmpireFoodReserve(ownerId) i projectPlayerFoodMaxCap(ownerId)',
  rawCode !== null
    && rawCode.includes('getEmpireFoodReserve(ownerId)')
    && rawCode.includes('projectPlayerFoodMaxCap(ownerId)'),
);

// Stan gracza (skarbiec/nauka/era) z mapy per fotel, nie z singletonu `player`.
check(
  'HUD (stan): ps = playerStateByHuman.get(ownerId) ?? player',
  rawCode !== null && rawCode.includes('playerStateByHuman.get(ownerId) ?? player'),
);
check(
  'HUD (stan): era poboru z ps.era (nie player.era)',
  rawCode !== null && rawCode.includes('ps.era') && !/\bplayer\.era\b/.test(rawCode),
);

// R-WEB-HUD-ME-REMAINING-Q1 (zarzut Evaluatora nr 2): pokrycie 8 linii, które poprzednio
// nie miały kontroli. Każda nazwa: w buildHudStateRaw brak wywołania z literałem 0
// i obecne wywołanie z ownerId (mutacja literału 0 -> FAIL).
const HUD_OWNER_NAMES = [
  'ownerReligionForOwnerId',
  'buildEmpireResourceRows',
  'wonderTradeRouteBonusForOwner',
  'civManpowerMultsForOwner',
  'civKolorHexFn',
  'leaderNameForOwnerId',
  'civDisplayNameForOwner',
];
for (const name of HUD_OWNER_NAMES) {
  const lit = new RegExp(name + '\\(\\s*0\\s*[,)]');
  check(
    'HUD (pokrycie): buildHudStateRaw bez ' + name + '(0',
    rawCode !== null && !lit.test(rawCode),
    'literał 0 zamiast ownerId -- hotseat czyta fotel 0',
  );
  check(
    'HUD (pokrycie): buildHudStateRaw z ' + name + '(ownerId',
    rawCode !== null && rawCode.includes(name + '(ownerId'),
  );
}
check(
  'HUD (pokrycie): empirePoborTotals / cityManpowerSnapshot / ps.civType bez literału i singletonu',
  rawCode !== null
    && !/empirePoborTotals\(\s*cities\s*,\s*0\s*,/.test(rawCode)
    && !/\bplayer\.civType\b/.test(rawCode)
    && rawCode.includes('ps.civType')
    && rawCode.includes('cityManpowerSnapshot(c, ps.era'),
);
check(
  'HUD (pokrycie): r.toOwnerId === ownerId (strona gracza w handlu, nie literał 0)',
  rawCode !== null && rawCode.includes('r.toOwnerId === ownerId') && !/r\.toOwnerId\s*===\s*0\b/.test(rawCode),
);

// Żywność w buildEmpireFoodSnap (fotel aktywny = ME()): 4 wywołania bez literału 0.
const foodSnapBody2 = braceBody(/function buildEmpireFoodSnap\(/);
const foodSnapCode2 = foodSnapBody2 === null ? null : stripComments(foodSnapBody2);
check(
  'HUD (żywność, snap): tick/zapas/cap liczone dla ME(), bez literału 0 i bez projectPlayerFoodMaxCap()',
  foodSnapCode2 !== null
    && foodSnapCode2.includes('getLastEmpireFoodTick(ME())')
    && foodSnapCode2.includes('getEmpireFoodReserve(ME())')
    && foodSnapCode2.includes('getEmpireFoodMaxCap(ME())')
    && foodSnapCode2.includes('projectPlayerFoodMaxCap(ME())')
    && !/getLastEmpireFoodTick\(\s*0\s*\)|getEmpireFoodReserve\(\s*0\s*\)|getEmpireFoodMaxCap\(\s*0\s*\)|projectPlayerFoodMaxCap\(\s*\)/.test(foodSnapCode2),
);

// R-WEB-HUD-ME-EMPIREHUD-Q1: getEmpireHud(oid) zwraca panel imperium FOTELA oid (nie właściciela 0).
// Źródłowo: guarda przepuszcza każdy fotel człowieka, a dane (buildHudState, miasta, religia państwa)
// idą wyłącznie z oid. Dla AI (nie-fotel) zwraca null jak dotąd. Zachowanie runtime (ownerId ≠ 0)
// wymaga sesji hotseat -- ten test jest dowodem źródłowym.
const empireHudCode = (() => {
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
check(
  'getEmpireHud(oid): guarda isHuman(oid), nie literał 0',
  empireHudCode !== null && empireHudCode.includes('if (!isHuman(oid)) return null;'),
);
check(
  'getEmpireHud(oid): buildHudState(oid), miasta c.ownerId === oid, religia ownerReligionForOwnerId(oid)',
  empireHudCode !== null
    && empireHudCode.includes('buildHudState(oid)')
    && empireHudCode.includes('c.ownerId === oid')
    && empireHudCode.includes('ownerReligionForOwnerId(oid)'),
);
check(
  'getEmpireHud(oid): brak ownerId === 0 / ForOwnerId(0) / buildHudState() bez argumentu',
  empireHudCode !== null
    && !/ownerId === 0\b/.test(empireHudCode)
    && !/ownerReligionForOwnerId\(\s*0\s*\)/.test(empireHudCode)
    && !/buildHudState\(\s*\)/.test(empireHudCode),
);

// R-WEB-HUD-ME-RESIDUAL-Q1: hotseat (ownerId != 0). Ostatnie literały 0 w roli gracza
// aktywnego podstawione ME(); fotel przekazywany przez parametr tam, gdzie wcześniej stał 0.
check(
  'buildHudState: domyślny fotel = ME() (wywołanie bez argumentu = gracz aktywny)',
  /function buildHudState\(ownerId: number = ME\(\)\): HudState \{/.test(src),
);
check(
  'getNaukaRate: używa przekazanego ownerId (nie buildHudState() ignorujące argument)',
  src.includes('getNaukaRate: (ownerId: number) => buildHudState(ownerId).naukaRate ?? 0,')
    && !src.includes('getNaukaRate: (_ownerId: number) => buildHudState().naukaRate'),
);
check(
  'replaceUnitMoneyCost: koszt liczony z bonusami fotela ME() (nie civBonusyForOwnerId(0))',
  src.includes('typeId, data, civBonusyForOwnerId(ME()), player.kosztJednostekPace')
    && !src.includes('typeId, data, civBonusyForOwnerId(0), player.kosztJednostekPace'),
);
check(
  'onBudowaListaLoadAllCities: nadpisuje listę we wszystkich miastach fotela ME()',
  src.includes('for (const c of cities.filter(c => c.ownerId === ME())) {')
    && !src.includes('for (const c of cities.filter(c => c.ownerId === 0)) {'),
);
check(
  'buildAudienceOtherRelations: partner = gracz gdy id === ME() (nie id === 0)',
  src.includes('isPlayer: id === ME(),') && !src.includes('isPlayer: id === 0,'),
);
check(
  'buildAudienceOtherRelations: wojna strony ME() zostaje bez przeliczania',
  src.includes('if (w.ownerId === ME()) return w;') && !src.includes('if (w.ownerId === 0) return w;'),
);
check(
  'battle preset: attackerCivBonusy(0) zostawione (preset playtest, label Rzym, obrońca stały fotel 1)',
  src.includes('attackerCivBonusy: civBonusyForOwnerId(0),') && src.includes('defenderCivBonusy: civBonusyForOwnerId(1),'),
);

console.log('\nWynik: ' + passCount + ' PASS / ' + failCount + ' FAIL');
if (failCount > 0) {
  process.exit(1);
}
