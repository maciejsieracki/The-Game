'use strict';
/**
 * ai-war-city-garrison-measure.cjs -- R-WEB-AI-WAR-CITY-GARRISON-ONE-REST-TO-GENERAL-Q1 (r3), FAZA 1.
 *
 * POMIAR (nie test): odsetek miast AI BEZ zadnej jednostki wojskowej w srodku, tury 10/30/60/100,
 * >= 3 ziarna, wojna i pokoj osobno, PRZED (rekrutacja garnizonu wylaczona mutacja zrodla) vs PO.
 * Dodatkowo: miasta zdobyte w 30 turach wojny i czas decideAITurn na ture.
 *
 * UCZCIWY ZAKRES: silnik = PRAWDZIWY decideAITurn (esbuild, gra/src) + prawdziwe dane units/buildings/ai-params,
 * ale WYKONANIE polecen 'build' to MODEL (main.ts nie jest uruchamialny w Node): jednostka kupowana przez
 * pickExecutableCandidate + shouldAIPurchaseUnit (te same funkcje co main.ts) z modelowym skarbcem
 * (przychod 3 Pieniadza/miasto/ture, utrzymanie 1/jednostke bojowa, start 30, rezerwa Normalny z ai-params).
 * Bez bramek manpower, surowcow, dostepnosci tech/epoki. Walka: model sim (10 obr., kontra 4).
 * To NIE jest pomiar zywej gry (Chromium + main.ts: NIE ZMIERZONO).
 * Miasta zdobyte < N=5 tur wczesniej sa pomijane w odsetku niepilnowanych (okres karencji).
 *
 * Run (z gra/):  node tools/ai-war-city-garrison-measure.cjs [--seeds 3] [--turns 100]
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA, 'node_modules', 'esbuild'));
const S = require('./ai-war-defend-home-sim.cjs');

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? Number(argv[i + 1]) : d; };
const SEEDS = arg('seeds', 3);
const TURNS = arg('turns', 100);
const REC_LINE = 'if (atWar || threatened) out.add(city.id);';
const SAMPLE = [10, 30, 60, 100].filter(t => t <= TURNS);
const GRACE = 5;
const J = (f) => JSON.parse(fs.readFileSync(path.join(GRA, 'data', f), 'utf8'));
const DATA_REAL = {
  units: J('units.json'), buildings: J('buildings.json'), tech: J('tech.json').technologie,
  aiParams: J('ai-params.json'),
  terrainYields: { terrain_types: [{ Teren: 'laka', Zywnosc: 4, Praca: 1, Handel: 1 }] },
};

const WORK = fs.mkdtempSync(path.join(os.tmpdir(), 'gm-'));
async function loadEngine(tag, mutate) {
  const src = path.resolve(GRA, 'src');
  const J2 = (p) => JSON.stringify(path.join(src, p));
  const entry = path.join(WORK, tag + '-entry.ts');
  const out = path.join(WORK, tag + '-bundle.cjs');
  fs.writeFileSync(entry, `
export { decideAITurn, pickExecutableCandidate, buildCandidateIds, shouldAIPurchaseUnit, loadAiPurchaseReserveParams } from ${J2('game/ai')};
export { unitProductionItem } from ${J2('game/production')};
export { decideBarbarianMoves, FALLBACK_BARB_PARAMS, BARBARIAN_OWNER_ID } from ${J2('game/barbarians')};
export { hexDistance, isCivilianUnit, computePath } from ${J2('units/setup')};
export { truncatePathWithinBudget } from ${J2('game/ai-move-range')};
export { setArmyConsolidationOverride } from ${J2('game/army-consolidation')};
export { setWarAllInCapitalOverride } from ${J2('game/warAllInCapital')};
export { setHomeWarDefenseOverride, resetHomeWarMemory, planHomeWar } from ${J2('game/ai-war-home-defense')};
export { isCityLostOf, stampCityFounderOnCapture, cityFounderId, ownTerritoryClassOf } from ${J2('game/cities')};
`);
  const plugin = {
    name: 'm',
    setup(b) {
      b.onLoad({ filter: /game[\\/]ai\.ts$/ }, (a) => {
        let t = fs.readFileSync(a.path, 'utf8');
        if (mutate) {
          if (t.split(REC_LINE).length !== 2) throw new Error('mutacja: brak linii');
          t = t.replace(REC_LINE, 'void atWar; void threatened;');
        }
        return { contents: t, loader: 'ts' };
      });
    },
  };
  await esbuild.build({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: out,
    loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: GRA, logLevel: 'silent', plugins: [plugin],
  });
  return require(out);
}

function rng(seed) {
  let x = (seed * 2654435761) >>> 0 || 1;
  return () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };
}

/** Swiat: 2 cywilizacje, 8 miast kazda, rozrzucone; start: 3 jednostki bojowe w stolicy, reszta miast PUSTA. */
function world(seed, war) {
  const R = rng(seed + 11);
  const map = S.makeMap(60, 36);
  const cities = []; const units = [];
  const place = (owner, x0, x1) => {
    const placed = [];
    for (let i = 0; i < 8; i++) {
      for (let tries = 0; tries < 300; tries++) {
        const q = x0 + Math.floor(R() * (x1 - x0)); const r = 2 + Math.floor(R() * 32);
        if (placed.every(p => Math.max(Math.abs(p.q - q), Math.abs(p.r - r)) >= 5)) { placed.push({ q, r }); break; }
      }
    }
    placed.forEach((p, i) => cities.push(S.mkCity(`c${owner}_${i}`, owner, p.q, p.r)));
    for (let k = 0; k < 3; k++) units.push(S.mkUnit(`u${owner}_${k}`, owner, placed[0].q, placed[0].r));
  };
  place(1, 2, 26); place(2, 33, 57);
  return { map, cities, units, wars: war ? new Set(['1_2']) : new Set(), aiOwners: [1, 2] };
}

function runOne(E, seed, war) {
  const st = world(seed, war);
  const treasury = { 1: 30, 2: 30 };
  const reserve = E.loadAiPurchaseReserveParams(DATA_REAL, 2);
  let uid = 0;
  const since = new Map(); // cityId -> tura zdobycia
  const samples = {};
  let captures30 = 0;
  const stats = S.simulate(st, {
    engine: E, turns: TURNS, data: DATA_REAL,
    onOptions: (opts, owner, turn) => {
      opts.currentTurn = turn; opts.poziomTrudnosci = 2; opts.cityBuildings = {};
      opts.canAfford = () => true; opts.recruitStockDeficitScratch = new Set(); opts.civType = 'grecy';
      return opts;
    },
    onCommands: (cmds, owner, turn, state) => {
      for (const c of cmds) {
        if (c.type !== 'build') continue;
        const city = state.cities.find(x => x.id === c.cityId && x.ownerId === owner);
        if (!city) continue;
        const pick = E.pickExecutableCandidate(E.buildCandidateIds(c), {
          isAlreadyQueued: () => false,
          isBuildAllowed: (id) => DATA_REAL.units.some(u => u.Jednostka === id),
          resolveItem: (id) => E.unitProductionItem(id, DATA_REAL, [], 'niski', owner, 'normal'),
          canAfford: () => true,
        });
        if (pick === null || pick.item.kind !== 'jednostka') continue;
        const mil = state.units.filter(u => u.ownerId === owner && u.hp > 0 && !E.isCivilianUnit(u)).length;
        const income = 3 * state.cities.filter(x => x.ownerId === owner).length;
        if (!E.shouldAIPurchaseUnit({
          treasury: treasury[owner], goldCost: pick.item.koszt, hasManpower: true, reserve,
          netIncomePerTurn: income - mil, upkeepPerTurn: mil, unitUpkeepPerTurn: 1,
        })) continue;
        treasury[owner] -= pick.item.koszt;
        state.units.push(S.mkUnit(`p${uid++}`, owner, city.q, city.r));
      }
    },
    onTurn: (turn, state, sts) => {
      for (const o of [1, 2]) {
        const mil = state.units.filter(u => u.ownerId === o && u.hp > 0 && !E.isCivilianUnit(u)).length;
        treasury[o] += 3 * state.cities.filter(x => x.ownerId === o).length - mil;
        if (treasury[o] < 0) treasury[o] = 0;
      }
      for (const c of state.cities) if (c.capturedFromOwnerId !== undefined && !since.has(c.id)) since.set(c.id, turn);
      if (turn === 30) captures30 = sts.captures;
      if (SAMPLE.includes(turn)) {
        const el = state.cities.filter(c => (c.ownerId === 1 || c.ownerId === 2)
          && !(since.has(c.id) && turn - since.get(c.id) < GRACE));
        const un = el.filter(c => !state.units.some(u => u.hp > 0 && u.q === c.q && u.r === c.r && u.ownerId === c.ownerId
          && !E.isCivilianUnit(u)));
        samples[turn] = el.length === 0 ? 0 : un.length / el.length;
      }
    },
  });
  return { samples, captures30, ms: stats.decisionMs / TURNS };
}

(async () => {
  const BASE = await loadEngine('base', true);
  const AFTER = await loadEngine('after', false);
  const rows = [];
  for (const war of [true, false]) {
    for (const [label, E] of [['PRZED', BASE], ['PO', AFTER]]) {
      const acc = {}; let cap = 0; let ms = 0;
      for (let seed = 1; seed <= SEEDS; seed++) {
        const r = runOne(E, seed, war);
        for (const t of SAMPLE) (acc[t] = acc[t] || []).push(r.samples[t]);
        cap += r.captures30; ms += r.ms;
      }
      rows.push({
        war, label,
        pctEmpty: Object.fromEntries(SAMPLE.map(t => [t, Math.round(1000 * acc[t].reduce((a, b) => a + b, 0) / acc[t].length) / 10])),
        capturedIn30Turns: Math.round(100 * cap / SEEDS) / 100,
        decideMsPerTurn: Math.round(100 * ms / SEEDS) / 100,
      });
    }
  }
  fs.rmSync(WORK, { recursive: true, force: true });
  console.log(JSON.stringify({ seeds: SEEDS, turns: TURNS, graceTurns: GRACE, rows }, null, 1));
})().catch(e => { console.error(e); process.exit(2); });
