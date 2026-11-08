// Generator wektorow D/E/G (P6-DYPLOMACJA-MULTIWAR-3, runda 2): wola PRAWDZIWE funkcje weba (origin/main).
import fs from 'node:fs';
import { siegeAllowedBetween, enemyUnitsAdjacentToCity, detectWarAutoSiegeOnCity, isSiegeStillValid, aiAutoSiegeAllowed, autoSiegeCandidateForScan } from './web-src/gra/src/game/diplomacy-siege-war-gate.ts';
import { resolveDiplomacyActionLock } from './web-src/gra/src/game/diplomacy-locks.ts';
import { evaluateInterCivWarGate } from './web-src/gra/src/game/war-rules-multiwar.ts';

const OUT = process.argv[2];
const num = (x: number) => (Number.isNaN(x) ? 'NaN' : x === Infinity ? 'Infinity' : x === -Infinity ? '-Infinity' : x);

// deterministyczny PRNG (LCG)
let seed = 12345;
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const pick = <T,>(a: T[]): T => a[Math.floor(rnd() * a.length)]!;

// --- D: siege ---
// pary wrogow (symetryczne); 0 = gracz, 1..3 = AI, 9 = barbarzyncy
const ENEMY_PAIRS: [number, number][] = [[0, 1], [1, 2], [2, 3], [0, 3], [9, 0], [9, 2]];
const enemyPairSet = new Set(ENEMY_PAIRS.map(([a, b]) => `${a}-${b}`).concat(ENEMY_PAIRS.map(([a, b]) => `${b}-${a}`)));
const areEnemies = (a: number, b: number) => enemyPairSet.has(`${a}-${b}`);
const isHumanOwner = (id: number) => id === 0;
const isBarbarianOwner = (id: number) => id === 9;
const OWNERS = [0, 1, 2, 3, 9];
const siege: any[] = [];
for (let i = 0; i < 1500; i++) {
  const nU = 1 + Math.floor(rnd() * 5);
  const units: any[] = [];
  for (let k = 0; k < nU; k++) units.push({ q: Math.floor(rnd() * 4), r: Math.floor(rnd() * 4), ownerId: pick(OWNERS) });
  const city: any = { q: Math.floor(rnd() * 4), r: Math.floor(rnd() * 4), ownerId: pick(OWNERS), maMur: rnd() < 0.7, oblegane: rnd() < 0.2 };
  const besieger = pick(OWNERS);
  const adj = enemyUnitsAdjacentToCity(city, units, areEnemies).map(u => units.indexOf(u));
  const det = detectWarAutoSiegeOnCity(city, units, areEnemies);
  const cand = autoSiegeCandidateForScan(city, units, areEnemies, isHumanOwner, isBarbarianOwner);
  const ctxOut = (c: any) => c === null ? null : { tryb: c.tryb, atakujacyIdx: units.indexOf(c.atakujacy), garnizonIdx: c.garnizonUnit ? units.indexOf(c.garnizonUnit) : null, oblegajacyOwnerId: c.oblegajacyOwnerId };
  siege.push({
    city, units, besieger,
    allowed: siegeAllowedBetween(besieger, city.ownerId, areEnemies),
    adjIdx: adj,
    detect: ctxOut(det),
    stillValid: isSiegeStillValid(city, besieger, units, areEnemies),
    cand: ctxOut(cand),
  });
}
const aiAllow: any[] = [];
for (const c of OWNERS) for (const b of OWNERS) aiAllow.push({ cityOwner: c, besieger: b, out: aiAutoSiegeAllowed(c, b, isHumanOwner, isBarbarianOwner) });
fs.writeFileSync(OUT + '/siege.json', JSON.stringify({ enemyPairs: ENEMY_PAIRS, humanOwner: 0, barbarianOwner: 9, cases: siege, aiAllow }));

// --- E: locks ---
const ACTIONS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16'];
const NUMS = [0, 1, 10, 29, 29.25, 30, 31, 34, 39, 40, 41, 61, 69, 70, 90, 91, 110, 200, -5, NaN];
const locks: any[] = [];
for (let i = 0; i < 2500; i++) {
  const ctx: any = {
    actionId: pick(ACTIONS), contact: rnd() < 0.9, atWar: rnd() < 0.35,
    relTotal: pick(NUMS), zaufanie: pick(NUMS), respekt: pick(NUMS),
    hasNap: rnd() < 0.2, hasHandel: rnd() < 0.2, hasTradeConnection: rnd() < 0.7,
    sellableTechCount: pick([0, 1, 3]), buyableTechCount: pick([0, 2]), knownRivalsCount: pick([0, 1, 2]),
    progNapRelacja: pick([30, 40, 45, 50]), progHandelRelacja: pick([40, 50, 61]), progSojuszRelacja: pick([55, 65, 70]),
    progSojuszZaufanie: pick([70, 80, 91]), progGraniceRelacja: pick([35, 45]), progGraniceZaufanie: pick([40, 50]),
    progWymianaTechZaufanie: pick([50, 60]), progNamowWojneZaufanie: pick([60, 70]), progWasalizacjaRespekt: pick([60, 70]),
    progTrybutZadanieMinRespekt: pick([50, 70]), progDarRelacja: pick([20, 30]),
    hasSojusz: rnd() < 0.2, hasGranice: rnd() < 0.2, hasWymiana: rnd() < 0.2,
    karaWspolnaGranica: rnd() < 0.3, napAgresorAktywny: rnd() < 0.3,
    isCityStatePartner: rnd() < 0.3, hasWasal: rnd() < 0.5, wasalAgeTurns: pick([0, 5, 9, 10, 11]),
  };
  if (rnd() < 0.5) ctx.hasTradeTechSelf = rnd() < 0.7;
  if (rnd() < 0.5) ctx.hasTradeTechOther = rnd() < 0.7;
  if (rnd() < 0.5) ctx.progNapZaufanie = pick([25, 30, 35]);
  if (rnd() < 0.3) ctx.breaksTreatyLabel = pick(['Pakt o nieagresji', 'Sojusz wojskowy']);
  if (rnd() < 0.3) ctx.progWchloniecieRespekt = pick([80, 90]);
  if (rnd() < 0.3) ctx.graczWchlonieciePoWasaluTur = pick([5, 10]);
  const res = resolveDiplomacyActionLock(ctx);
  const enc = (v: any) => JSON.parse(JSON.stringify(v, (_k, x) => (typeof x === 'number' ? num(x) : x)));
  locks.push({ ctx: enc(ctx), out: enc(res) });
}
fs.writeFileSync(OUT + '/locks.json', JSON.stringify(locks));

// --- G: evaluateInterCivWarGate ---
const turns = [0, 19, 20, 39, 40, 41, 100, NaN];
const eras = [1, 2, 3, 4];
const warG: any[] = [];
for (const turn of turns) for (const ae of eras) for (const aw of [0, 1, 2, 3]) for (const tp of [true, false]) for (const te of eras) for (const tw of [0, 1, 2]) for (const tg of [null, 'bronze', 'stone', 'iron']) {
  const inp: any = { turn, attackerEra: ae, attackerWarCount: aw, targetIsPlayer: tp, targetEra: te, targetWarCount: tw, eraTag: tg };
  warG.push({ inp: JSON.parse(JSON.stringify(inp, (_k, x) => (typeof x === 'number' ? num(x) : x))), out: evaluateInterCivWarGate(inp) });
}
fs.writeFileSync(OUT + '/war-gate.json', JSON.stringify(warG));
console.log('siege', siege.length, 'locks', locks.length, 'warGate', warG.length);
