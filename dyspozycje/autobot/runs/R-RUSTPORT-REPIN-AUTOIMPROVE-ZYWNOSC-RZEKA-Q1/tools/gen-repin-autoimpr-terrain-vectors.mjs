// REPIN-AUTOIMPROVE: wektory `terrain-improvements.ts` (hunki 86-100: skalowanie plonow epoka, x1,5 dla surowcow terytorium,
// `hexHasHorseDeposit`), `auto-build-gate.ts` i `road-network-plan.ts` z URUCHOMIONEGO weba, pin web main 180c08305.
// Uruchomienie (Node 22; WEB_ROOT = wynik `git archive origin/main gra/src gra/data` poza repo):
//   node --experimental-transform-types --no-warnings --import ./repin-b-loader-register.mjs \
//        ./gen-repin-autoimpr-terrain-vectors.mjs <WEB_ROOT> <KATALOG_WYJSCIA>
// Kodowanie liczb: skonczona -> number; NaN/Infinity/-Infinity -> napis; undefined -> brak klucza lub "$undef".
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve as presolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const webRoot = presolve(process.argv[2]);
const outDir = presolve(process.argv[3]);
mkdirSync(outDir, { recursive: true });
const src = (p) => pathToFileURL(join(webRoot, 'gra/src', p)).href;
const PIN = '180c08305';
const ti = await import(src('game/terrain-improvements.ts'));
const gate = await import(src('game/auto-build-gate.ts'));
const rnp = await import(src('game/road-network-plan.ts'));
const HX = await import(src('types/hex.ts'));
const TB = HX.TerenBazowy;
const NK = HX.Nakladka;

const enc = (x) => (typeof x === 'number' && !Number.isFinite(x) ? String(x) : x === undefined ? '$undef' : x);
const dec = (x) => (typeof x === 'string' && ['NaN', 'Infinity', '-Infinity'].includes(x) ? Number(x) : x === '$undef' ? undefined : x);
const encDeep = (v) => {
  if (v === undefined) return '$undef';
  if (typeof v === 'number') return enc(v);
  if (Array.isArray(v)) return v.map(encDeep);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, encDeep(x)]));
  return v;
};

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(0x7e44a1);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const chance = (p) => rnd() < p;

const KEYS = [...ti.IMPROVEMENT_KEYS, 'FARMA', '', 'xyz', '_meta', 'pastwisko', 'kopalnia'];
const ERAS = [undefined, 0, 0.5, 1, 1.5, 1.999999, 2, 2.0000001, 2.5, 3, 3.5, 4, 5, -1, NaN, Infinity, -Infinity];
const STATS = ['zywnosc', 'praca', 'handel', 'pieniadz', 'drewno', 'kamien', 'glina', 'xyz', ''];
const BASES = [-1, 0, 0.5, 1, 2, 3, 20, 99.5, NaN, Infinity, -Infinity];

const out = { pin: PIN, source: 'gra/src/game/terrain-improvements.ts', cases: {} };
const tc = (n) => (out.cases[n] ??= []);

for (const k of ['farma', 'kopalnia_zlota', 'xyz']) for (const s of STATS) for (const b of BASES) for (const e of ERAS) {
  tc('improvementYieldForEra').push({ key: k, stat: s, base: enc(b), era: enc(e), out: enc(ti.improvementYieldForEra(k, s, b, e)) });
}
for (const k of KEYS) for (const e of ERAS) {
  tc('improvementBonusForKey').push({ key: k, era: enc(e), out: encDeep(e === undefined ? ti.improvementBonusForKey(k) : ti.improvementBonusForKey(k, e)) });
}
const starts = [
  { zywnosc: 0, praca: 0, handel: 0, drewno: 0, kamien: 0, glina: 0 },
  { zywnosc: 2, praca: 1, handel: 3, drewno: 4, kamien: 5, glina: 6 },
  { zywnosc: -1.5, praca: 0.25, handel: 10, drewno: 0.5, kamien: -2, glina: 1e3 },
];
for (const k of KEYS) for (const e of ERAS) for (const y0 of starts) {
  const y = { ...y0 };
  if (e === undefined) ti.applyImprovementBonus(y, k); else ti.applyImprovementBonus(y, k, e);
  tc('applyImprovementBonus').push({ key: k, era: enc(e), yield: y0, out: encDeep(y) });
}
for (let i = 0; i < 120; i++) {
  const keys = Array.from({ length: ri(0, 6) }, () => pick(KEYS));
  const e = pick(ERAS);
  const y0 = pick(starts);
  const y = { ...y0 };
  if (e === undefined) ti.applyImprovementBonuses(y, keys); else ti.applyImprovementBonuses(y, keys, e);
  tc('applyImprovementBonuses').push({ keys, era: enc(e), yield: y0, out: encDeep(y) });
}
for (const k of [...KEYS, null, undefined]) for (const e of ERAS) {
  tc('territoryResourceYieldForImprovement').push({ key: enc(k), era: enc(e), out: encDeep(ti.territoryResourceYieldForImprovement(k, null, e) ?? null) });
}
for (const k of KEYS) for (const b of [-5, 0, 1, 2.5, 3.5, 7, 10, 25, 50, 200, 1.3, NaN]) for (const e of ERAS) {
  tc('resourceProductionAmountForEra').push({ key: k, base: enc(b), era: enc(e), out: enc(ti.resourceProductionAmountForEra(k, b, e)) });
}
// hexHasHorseDeposit / improvementHidesDepositOnHex (stadnina) - zloze 'konie' po trim/lowercase
const NAKL = [undefined, 'brak', 'las', 'zloze_konia', 'zloze_bydla', 'zloze_gliny'];
const ZLOZE = [undefined, null, '', 'konie', 'Konie', ' KONIE ', ' konie ', '﻿konie', 'kon', 'koni', 'konie2', 'glina'];
for (const n of NAKL) for (const z of ZLOZE) {
  const hex = {}; if (n !== undefined) hex.nakladka = n; if (z !== undefined) hex.zloze = z;
  tc('hexHasHorseDeposit').push({ hex: encDeep(hex), out: ti.hexHasHorseDeposit(hex) });
  tc('improvementHidesDepositOnHex').push({ key: 'stadnina', hex: encDeep(hex), out: ti.improvementHidesDepositOnHex('stadnina', hex) });
}

// ---- auto-build-gate.ts ---------------------------------------------------------------------------------
const gateOut = { pin: PIN, source: 'gra/src/game/auto-build-gate.ts', constants: { AUTO_BUILD_ENABLED_DEFAULT: gate.AUTO_BUILD_ENABLED_DEFAULT, AUTO_BUILD_DISABLED_HINT: gate.AUTO_BUILD_DISABLED_HINT }, cases: {} };
const gc = (n) => (gateOut.cases[n] ??= []);
for (const owner of [0, 1, 2, -1, 7]) for (const humans of [[], [0], [1], [0, 1], [2, 7], [-1]]) {
  gc('isHumanSeatOwner').push({ owner, humans, out: gate.isHumanSeatOwner(owner, humans) });
  for (const en of [true, false]) gc('isAutoBuildAllowedForOwner').push({ owner, humans, enabled: en, out: gate.isAutoBuildAllowedForOwner(owner, humans, en) });
}
const RAWS = [true, false, 'true', 1, 0, null, undefined, {}, [], 'false', NaN];
for (const raw of RAWS) {
  gc('autoBuildFromSaveMeta').push({ raw: raw === undefined ? '$undef' : (typeof raw === 'number' && Number.isNaN(raw)) ? 'NaN-js' : raw, kind: typeof raw === 'object' ? (raw === null ? 'null' : Array.isArray(raw) ? 'array' : 'object') : typeof raw, out: gate.autoBuildFromSaveMeta(raw) });
  gc('autoBuildFromNewGameParam').push({ raw: raw === undefined ? '$undef' : (typeof raw === 'number' && Number.isNaN(raw)) ? 'NaN-js' : raw, kind: typeof raw === 'object' ? (raw === null ? 'null' : Array.isArray(raw) ? 'array' : 'object') : typeof raw, out: gate.autoBuildFromNewGameParam(raw) });
}

// ---- road-network-plan.ts: planRoadNetwork na losowych mapach/miastach -------------------------------------
const NEIGH = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];
const disk = (rad) => { const o = []; for (let dq = -rad; dq <= rad; dq++) for (let dr = -rad; dr <= rad; dr++) if (Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr)) <= rad) o.push([dq, dr]); return o; };
const TERR = [TB.Laka, TB.Rownina, TB.Wzgorza, TB.Gory, TB.Pustynia, TB.Polarny, TB.PlytkieMorze, TB.Morze];
const TERRW = [6, 6, 3, 2, 1, 0.6, 0.6, 0.6];
const wpick = () => { const tot = TERRW.reduce((s, x) => s + x, 0); let x = rnd() * tot; for (let i = 0; i < TERR.length; i++) { x -= TERRW[i]; if (x <= 0) return TERR[i]; } return TERR[0]; };
const plans = [];
for (let i = 0; i < 400; i++) {
  const rad = ri(2, 11);
  const holeP = pick([0, 0, 0.03, 0.1]);
  const cells = disk(rad).filter(() => !chance(holeP));
  const mode = pick(['rnd', 'rnd', 'plain', 'mix']);
  const hexes = {};
  const roadsP = pick([0, 0, 0.05, 0.2]);
  for (const [q, r] of cells) {
    let teren = mode === 'plain' ? TB.Laka : mode === 'mix' ? (((q * 7 + r * 3) % 5 + 5) % 5 === 0 ? TB.Gory : (q + r) % 3 === 0 ? TB.Wzgorza : TB.Rownina) : wpick();
    const h = { coords: { q, r }, terenBazowy: teren, nakladka: NK.Brak, ulepszenie: 'brak', rzeka: { obecna: false, krawedzie: [] } };
    if (chance(roadsP)) h.ulepszenie = pick(['droga', 'droga_brukowana']);
    if (chance(roadsP / 2)) h.ulepszenia = [pick(['farma', 'droga']), pick(['droga_brukowana', 'tartak'])];
    hexes[`${q},${r}`] = h;
  }
  const nC = ri(0, 8);
  const cities = [];
  for (let j = 0; j < nC; j++) {
    if (cells.length === 0) break;
    const [q, r] = pick(cells);
    cities.push({ id: pick(['a', 'b', 'c', 'A', 'z', '\u{1F600}', 'Ａ', 'c1']) + (chance(0.7) ? j : ''), q, r });
  }
  if (chance(0.05) && cities.length) cities.push({ ...cities[0], id: cities[0].id + 'dup' }); // dwa miasta na tym samym heksie
  const spec = { hexes: cells.map(([q, r]) => { const h = hexes[`${q},${r}`]; return [q, r, h.terenBazowy, h.ulepszenie, h.ulepszenia ?? null]; }), cities, trav: null, extra: [] };
  const opts = {};
  if (chance(0.4)) {
    const reach = new Set(cells.filter(() => chance(0.85)).map(([q, r]) => `${q},${r}`));
    opts.isTraversable = (q, r) => reach.has(`${q},${r}`);
    spec.trav = [...reach];
  }
  if (chance(0.35)) {
    const ex = cells.filter(() => chance(0.05)).map(([q, r]) => `${q},${r}`);
    opts.extraRoadKeys = new Set(ex);
    spec.extra = ex;
  }
  const res = rnp.planRoadNetwork(cities, { hexes, riverPaths: [] }, opts);
  plans.push({ ...spec, out: { hexes: res.hexes, edges: res.edges, disconnected: res.disconnected } });
}

writeFileSync(join(outDir, 'terrain.json'), JSON.stringify(out) + '\n');
writeFileSync(join(outDir, 'gate.json'), JSON.stringify(gateOut) + '\n');
writeFileSync(join(outDir, 'roadplan.json'), JSON.stringify({ pin: PIN, source: 'gra/src/game/road-network-plan.ts', plans }) + '\n');
console.log(`terrain cases=${Object.entries(out.cases).map(([k, v]) => `${k}:${v.length}`).join(' ')} plans=${plans.length} nonEmptyPlans=${plans.filter(p => p.out.hexes.length > 0).length}`);
