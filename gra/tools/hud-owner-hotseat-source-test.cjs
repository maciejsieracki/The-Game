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
const MAIN_TS = path.join(GRA_DIR, 'src/main.ts');
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

console.log('\nWynik: ' + passCount + ' PASS / ' + failCount + ' FAIL');
if (failCount > 0) {
  process.exit(1);
}
