'use strict';
/**
 * diplomacy-peace-sim.cjs — scenariusze willingnessPeace + decyzje AI o pokoju.
 * Uruchom: node tools/diplomacy-peace-sim.cjs
 */
const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch { console.error('esbuild missing'); process.exit(1); }
})();

const BUNDLE = path.resolve(__dirname, '.dip-peace-sim-bundle.cjs');
const entryFile = path.resolve(__dirname, '.dip-peace-sim-entry.ts');
fs.writeFileSync(entryFile, `
export {
  aiDiplomacyStance,
  relationScore,
  computeRespekt,
} from '../src/game/diplomacy.ts';
export {
  decideAIDiplomacy,
  loadDefaultAIDiplomacyProgs,
} from '../src/game/ai.ts';
import { TypCywilizacji } from '../src/types/player.ts';
export { TypCywilizacji };
`);

esbuild.buildSync({
  entryPoints: [entryFile],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  absWorkingDir: path.resolve(__dirname, '..'),
  logLevel: 'silent',
});

const {
  aiDiplomacyStance,
  relationScore,
  computeRespekt,
  decideAIDiplomacy,
  loadDefaultAIDiplomacyProgs,
  TypCywilizacji,
} = require(BUNDLE);

const progs = loadDefaultAIDiplomacyProgs();

function rel(z, r, status = 'pokoj') {
  return { zaufanie: z, respekt: r, status };
}

function stubPlayer(typ) {
  return { typCywilizacji: typ };
}

function fmt(n) {
  return typeof n === 'number' ? n.toFixed(3) : String(n);
}

function rwFromPower(aiPower, humanPower) {
  const total = aiPower + humanPower;
  if (total <= 0) return 0.5;
  return aiPower / total;
}

function militaryRatioFromRw(rw) {
  if (rw >= 1) return 99;
  if (rw <= 0) return 0.01;
  return rw / (1 - rw);
}

function aiPeaceCommand(rw, relObj, stanWojny) {
  const cmds = decideAIDiplomacy({
    myPlayerId: 'ai-1',
    agresja: 0.5,
    handlowosc: 0.5,
    relacje: [{
      partnerId: 'gracz',
      relation: relObj,
      respektWzgledny: rw,
      stanWojny,
    }],
  });
  const peace = cmds.find(c =>
    c.type === 'zaproponuj_pokoj' || c.type === 'oferuj_trybut_za_pokoj');
  return peace ? `${peace.type} (${peace.powod.slice(0, 60)}…)` : '— brak komendy pokoju —';
}

console.log('=== SYMULACJE POKOJU (willingnessPeace + decideAIDiplomacy) ===\n');
console.log('Progi AI (Panel-D):');
console.log(`  pokój gdy rw ≤ ${progs.progPokojSlabosc}  |  trybut za pokój gdy rw ≤ ${progs.progTrybutKrytyczny}`);
console.log('  rw = Moc_AI / (Moc_AI + Moc_gracza)  ·  militaryRatio = suma M_AI / suma M_gracza\n');

const scenarios = [
  {
    id: 'P1',
    opis: 'Wojna, AI słabsze (M 800 vs 2000) — wczesna faza',
    aiTyp: TypCywilizacji.Grecy,
    z: 40, r: 35, status: 'wojna',
    milRatio: 800 / 2000,
    turnsAtWar: 3,
    aiPower: 800, humanPower: 2000,
  },
  {
    id: 'P2',
    opis: 'Wojna, AI słabsze — długa wojna (20+ tur)',
    aiTyp: TypCywilizacji.Grecy,
    z: 40, r: 35, status: 'wojna',
    milRatio: 800 / 2000,
    turnsAtWar: 25,
    aiPower: 800, humanPower: 2000,
  },
  {
    id: 'P3',
    opis: 'Wojna, AI silniejsze (M 2500 vs 1200) — nie szuka pokoju',
    aiTyp: TypCywilizacji.Rzymianie,
    z: 25, r: 70, status: 'wojna',
    milRatio: 2500 / 1200,
    turnsAtWar: 10,
    aiPower: 2500, humanPower: 1200,
  },
  {
    id: 'P4',
    opis: 'Wojna, AI krytycznie słabe (M 400 vs 3000) — trybut za pokój',
    aiTyp: TypCywilizacji.Chinczycy,
    z: 30, r: 20, status: 'wojna',
    milRatio: 400 / 3000,
    turnsAtWar: 8,
    aiPower: 400, humanPower: 3000,
  },
  {
    id: 'P5',
    opis: 'Wojna, wyrównane siły (M 1500 vs 1500), niskie zaufanie',
    aiTyp: TypCywilizacji.Zulusi,
    z: 15, r: 45, status: 'wojna',
    milRatio: 1.0,
    turnsAtWar: 12,
    aiPower: 1500, humanPower: 1500,
  },
  {
    id: 'P6',
    opis: 'Wojna, AI słabsze ale wysokie zaufanie (40/55)',
    aiTyp: TypCywilizacji.Fenicjanie,
    z: 55, r: 40, status: 'wojna',
    milRatio: 900 / 1800,
    turnsAtWar: 6,
    aiPower: 900, humanPower: 1800,
  },
  {
    id: 'P7',
    opis: 'Pokój — brak wojny (baseline willingnessPeace = 0.80)',
    aiTyp: TypCywilizacji.Grecy,
    z: 50, r: 50, status: 'pokoj',
    milRatio: 1.2,
    turnsAtWar: 0,
    aiPower: 1200, humanPower: 1000,
  },
  {
    id: 'P8',
    opis: 'Poboczna cywilizacja — boi się gracza (Respekt 75)',
    aiTyp: TypCywilizacji.DrobnaCywilizacja,
    z: 35, r: 75, status: 'pokoj',
    milRatio: 0.3,
    turnsAtWar: 0,
    isMinor: true,
    aiPower: 300, humanPower: 2000,
  },
  {
    id: 'P9',
    opis: 'Poboczna — niski respekt gracza (25), w pokoju',
    aiTyp: TypCywilizacji.DrobnaCywilizacja,
    z: 35, r: 25, status: 'pokoj',
    milRatio: 0.8,
    turnsAtWar: 0,
    isMinor: true,
    aiPower: 400, humanPower: 500,
  },
  {
    id: 'P10',
    opis: 'Wojna, AI ledwo poniżej progu pokoju (rw ≈ 0.41)',
    aiTyp: TypCywilizacji.Egipt,
    z: 30, r: 40, status: 'wojna',
    milRatio: null,
    turnsAtWar: 5,
    aiPower: 820, humanPower: 1180,
  },
];

console.log(
  '| ID | Scenariusz | Zauf | Resp | score | milRatio | rw(Power) | Respekt% | peaceW | Decyzja AI |',
);
console.log(
  '|----|------------|------|------|-------|----------|-----------|----------|--------|------------|',
);

for (const s of scenarios) {
  const relation = rel(s.z, s.r, s.status);
  const score = relationScore(relation);
  const milRatio = s.milRatio ?? (s.aiPower / s.humanPower);
  const rw = rwFromPower(s.aiPower, s.humanPower);
  const respektPct = computeRespekt(s.aiPower, s.humanPower);

  const stance = aiDiplomacyStance(
    stubPlayer(s.aiTyp),
    stubPlayer(TypCywilizacji.Rzymianie),
    relation,
    {
      isMinorCiv: !!s.isMinor,
      militaryRatio: milRatio,
      currentTurn: 50,
      turnsAtWar: s.turnsAtWar,
    },
  );

  const cmd = s.status === 'wojna'
    ? aiPeaceCommand(rw, relation, true)
    : '— (nie w wojnie) —';

  const short = s.opis.length > 42 ? s.opis.slice(0, 40) + '…' : s.opis;
  console.log(
    `| ${s.id} | ${short} | ${s.z} | ${s.r} | ${score} | ${fmt(milRatio)} | ${fmt(rw)} | ${respektPct}% | ${fmt(stance.willingnessPeace)} | ${cmd.slice(0, 36)} |`,
  );
}

console.log('\n--- Rozkład składników willingnessPeace (tylko w WOJNIE, cyw. główne) ---\n');
console.log('Wzór: peaceW = min(tury/20, 0.5) + (1−milRatio)×0.4 [gdy słabszy] + (Zaufanie/100)×0.2\n');

for (const s of scenarios.filter(x => x.status === 'wojna' && !x.isMinor)) {
  const weariness = Math.min(s.turnsAtWar / 20, 0.5);
  const milRatio = s.milRatio ?? (s.aiPower / s.humanPower);
  const pressure = milRatio < 1 ? (1 - milRatio) * 0.4 : 0;
  const goodwill = (s.z / 100) * 0.2;
  const sum = Math.min(1, Math.max(0, weariness + pressure + goodwill));
  console.log(
    `${s.id}: zmęczenie=${fmt(weariness)} + presja=${fmt(pressure)} + zaufanie=${fmt(goodwill)} → peaceW≈${fmt(sum)}`,
  );
}

console.log('\n--- Próg decyzji AI (wojna → pokój / trybut) ---\n');
const rwSamples = [0.15, 0.22, 0.25, 0.30, 0.38, 0.42, 0.50, 0.65];
for (const rw of rwSamples) {
  const relW = rel(35, 40, 'wojna');
  let cmd = '—';
  if (rw <= progs.progTrybutKrytyczny) cmd = 'oferuj_trybut_za_pokoj';
  else if (rw <= progs.progPokojSlabosc) cmd = 'zaproponuj_pokoj';
  else cmd = 'kontynuuje wojnę';
  console.log(`  rw=${fmt(rw)} (${Math.round(rw * 100)}% Mocy AI) → ${cmd}`);
}

console.log('\nGotowe.\n');
