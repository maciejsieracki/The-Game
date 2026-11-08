// Generator wektorow F (P6-DYPLOMACJA-MULTIWAR-3): wola PRAWDZIWE funkcje weba (origin/main).
import fs from 'node:fs';
import { brakeWarOutcome } from './web-src/gra/src/game/diplomacy-tick-war-brake.ts';
import { isWarMarchOpenForPair } from './web-src/gra/src/game/war-rules-multiwar.ts';

const num = (x: number) => (Number.isNaN(x) ? 'NaN' : x === Infinity ? 'Infinity' : x === -Infinity ? '-Infinity' : x);
const powers = [0, 1, 2.5, 3, 3, Number.NaN, Infinity];
const brake: any[] = [];
for (const pa of powers) for (const pb of powers) for (const ida of [0, 1]) for (const idb of [2, 3]) for (const pl of [0, 1, 2, 3]) {
  // isPlayer: wlasciciel `pl` jest graczem
  const isPlayer = (id: number) => id === pl;
  const res = brakeWarOutcome({ ownerId: ida, power: pa }, { ownerId: idb, power: pb }, isPlayer);
  brake.push({ a: { owner: ida, power: num(pa) }, b: { owner: idb, power: num(pb) }, player: pl, declarer: res.declarer, victim: res.victim, mayDeclare: res.mayDeclare });
}
const turns: any[] = [0, 19, 39, 40, 41, Number.NaN, undefined];
const tags: any[] = ['bronze', 'iron', 'stone', null, undefined];
const march: any[] = [];
for (const t of turns) for (const tag of tags) {
  const v = isWarMarchOpenForPair(t as number, tag);
  march.push({ turn: t === undefined ? 'undefined' : num(t), tag: tag === undefined ? 'undefined' : tag, out: v });
}
fs.writeFileSync(process.argv[2] + '/brake.json', JSON.stringify(brake, null, 1) + '\n');
fs.writeFileSync(process.argv[2] + '/march.json', JSON.stringify(march, null, 1) + '\n');
console.log('brake', brake.length, 'march', march.length);
