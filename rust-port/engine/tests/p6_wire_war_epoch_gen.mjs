// P6-WIRE-WAR-EPOKA (W8 r6): generator wektorow z WEBA (pin 07d2fbd72) dla producenta epoki wlasciciela.
// Funkcje `ERA_ID_TO_NUM`, `eraNumberFromEpochId`, `gameStartEra`, `empireEpochForOwner` sa domknieciami w
// `gra/src/main.ts` (main.ts:2402-2422), wiec NIE da sie ich zaimportowac: generator WYCINA ich tekst z pinu
// (zakotwiczone znacznikami), transpiluje TS esbuildem i wykonuje w node z wstrzyknietymi
// `_menuEpochId`, `isHuman`, `playerStateByHuman`, `ownerEraByOwner` (bez przepisywania logiki).
// Uzycie (poza repo):
//   git show 07d2fbd72f758705f8e1d59cc4968027ffbafe75:gra/src/main.ts > <work>/main.pin.ts
//   (cd <work>/esb && npm install esbuild@0.24.2)
//   node p6_wire_war_epoch_gen.mjs --main <work>/main.pin.ts --esbuild <work>/esb/node_modules/esbuild \
//     --out rust-port/engine/tests/p6_wire_war_epoch_vectors/vectors.json
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const mainPath = resolve(arg('--main') ?? '');
const esbuild = createRequire(import.meta.url)(resolve(arg('--esbuild') ?? ''));
const outFile = resolve(arg('--out') ?? '');
const src = readFileSync(mainPath, 'utf8');

const startMark = "const ERA_ID_TO_NUM: Record<string, number>";
const endMark = "function eraWarCounterEpochOf";
const a = src.indexOf(startMark);
const b = src.indexOf(endMark);
if (a < 0 || b < 0 || b < a) throw new Error('znaczniki pinu nie znalezione');
// Odcinamy komentarz JSDoc poprzedzajacy eraWarCounterEpochOf (nie jest czescia wycinka).
let chunk = src.slice(a, b);
chunk = chunk.slice(0, chunk.lastIndexOf('/**'));
const needed = ['ERA_ID_TO_NUM', 'eraNumberFromEpochId', 'gameStartEra', 'empireEpochForOwner'];
for (const n of needed) if (!chunk.includes(n)) throw new Error('brak ' + n);

const js = esbuild.transformSync(chunk, { loader: 'ts', target: 'node22' }).code;
const factory = new Function(
  '_menuEpochId', 'isHuman', 'playerStateByHuman', 'ownerEraByOwner',
  js + '\nreturn { eraNumberFromEpochId, gameStartEra, empireEpochForOwner };',
);

function run(menuEpochId, humans, humanEra, ownerEra, owner) {
  const playerStateByHuman = new Map(Object.entries(humanEra).map(([k, v]) => [Number(k), { era: v }]));
  const ownerEraByOwner = new Map(Object.entries(ownerEra).map(([k, v]) => [Number(k), v]));
  const hs = new Set(humans);
  const f = factory(menuEpochId, (id) => hs.has(id), playerStateByHuman, ownerEraByOwner);
  try {
    return { ok: f.empireEpochForOwner(owner), start: f.gameStartEra() };
  } catch (e) {
    return { throws: true, start: f.gameStartEra() };
  }
}

const menus = ['kamien', 'braz', 'zelazo', '', 'nieznana', 'Kamien', 'zelazo ', 'BRAZ'];
const cases = [];
function add(menu, humans, humanEra, ownerEra, owner) {
  const r = run(menu, humans, humanEra, ownerEra, owner);
  cases.push({
    menuEpochId: menu, humanIds: humans, humanEra, ownerEra, owner,
    gameStartEra: r.start, expected: r.throws ? null : r.ok, throws: !!r.throws,
  });
}
for (const m of menus) {
  // AI bez wpisu w ownerEraByOwner -> fallback gameStartEra (wariant A).
  add(m, [0], { 0: 1 }, {}, 1);
  // AI z wpisem (awans niezalezny od startu).
  add(m, [0], { 0: 1 }, { 1: 3 }, 1);
  // czlowiek z era w playerStateByHuman (rozne od startu).
  add(m, [0], { 0: 2 }, { 1: 1 }, 0);
  // wlasciciel AI inny niz ten z wpisem -> fallback.
  add(m, [0], { 0: 1 }, { 2: 2 }, 1);
  // czlowiek bez stanu gracza -> wyjatek weba (`!` na undefined).
  add(m, [0], {}, { 1: 2 }, 0);
}
// dodatkowe: dwoch ludzi, wpis w ownerEraByOwner dla czlowieka jest ignorowany.
add('braz', [0, 1], { 0: 3, 1: 2 }, { 1: 1 }, 1);
add('kamien', [0, 1], { 0: 3, 1: 2 }, { 0: 1 }, 0);
add('zelazo', [], {}, {}, 5);
add('kamien', [], {}, { 5: 10 }, 5);

mkdirSync(resolve(outFile, '..'), { recursive: true });
writeFileSync(outFile, JSON.stringify({
  pin: '07d2fbd72f758705f8e1d59cc4968027ffbafe75',
  source: 'gra/src/main.ts:2402-2422 (wycinek wykonany w node)',
  chunk: chunk.trim(),
  cases,
}, null, 2) + '\n');
console.log('cases', cases.length);
