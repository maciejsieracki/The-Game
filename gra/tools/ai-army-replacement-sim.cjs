'use strict';
/**
 * ai-army-replacement-sim.cjs -- POMIAR (nie bramka) dla R-WEB-AI-ARMY-CONCENTRATION-REPLACEMENT-Q1.
 *
 * Symulacja SILNIKOWA wielu cywilizacji AI (bez przegladarki): prawdziwy `decideAITurn` (z prawdziwymi
 * flagami domyslnymi: ARMY_CONSOLIDATION=ON, WAR_ALLIN_CAPITAL=ON, WAR_RULES_MULTIWAR=ON), prawdziwy
 * `buildWarCityTargets`, prawdziwy generator mapy (kontynenty/pangea) -- ALE z ATRAPA ekonomii i walki:
 *  - rekrutacja: co PROD tur kazde miasto dodaje 1 jednostke bojowa (do limitu CAP na cywilizacje),
 *  - walka: deterministyczne pojedynki wg lokalnej przewagi liczebnej (+bonus obroncy miasta), miasta
 *    nie sa zdobywane (stabilny cel); NIE jest to silnik walki gry => liczby opisuja ZACHOWANIE ruchu AI,
 *    nie wynik wojny.
 * Pelna gra w przegladarce = ~30 s/ture (patrz tools/ai-city-count-sim.cjs) => 6 ziaren x 150 tur NIE_ZMIERZONO.
 *
 * API:  const S = require('./ai-army-replacement-sim.cjs'); const res = S.simulate({ seed, world, turns });
 * CLI:  node tools/ai-army-replacement-sim.cjs [--seeds 1,2,3,4,5,6] [--worlds flat,kontynenty,pangea] [--turns 150]
 *       [--label pre] [--out plik.json]
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));

const WORK = fs.mkdtempSync(path.join(process.env.ARS_TMP || os.tmpdir(), 'ars-'));
const ENTRY = path.join(WORK, 'entry.ts');
const BUNDLE = path.join(WORK, 'bundle.cjs');
// ARS_SRC_GRA: katalog `gra` z kodem do pomiaru (np. kopia bazy z `git archive`); domyslnie biezacy.
const SRC_ROOT = process.env.ARS_SRC_GRA ? path.resolve(process.env.ARS_SRC_GRA) : GRA;
const SRC = (f) => JSON.stringify(path.join(SRC_ROOT, 'src', f));
fs.writeFileSync(ENTRY, `
export { decideAITurn } from ${SRC('game/ai.ts')};
export { clusterUnitsByProximity, ARMY_CONCENTRATION_RADIUS, ARMY_CONCENTRATION_MIN_UNITS } from ${SRC('game/army-concentration.ts')};
export { buildWarCityTargets } from ${SRC('game/ai-war-target-select.ts')};
export { WAR_RULES_PARAMS } from ${SRC('game/war-rules-multiwar.ts')};
export { generateMap } from ${SRC('map/generator.ts')};
export { loadGameData } from ${SRC('data/loader.ts')};
export { hexDistance, hexNeighborCoords } from ${SRC('units/setup.ts')};
`, 'utf8');
// ARS_MUTATE=gate-off: wylacza bramke luznych jednostek w ai.ts (pomiar "przed poprawka" na biezacym kodzie).
const GATE_ON = 'if (gateLooseUnits && isArmyConsolidationEnabled()) {';
const GATE_GATHER = 'if (gateLooseUnits && isArmyConsolidationEnabled() && planned.length >= 2) {'; // R-WEB-AI-ARMY-SCATTERED-NOT-MERGED-Q1
const mutatePlugin = {
  name: 'mutate-ai',
  setup(b) {
    b.onLoad({ filter: /game[\\/]ai\.ts$/ }, (args) => {
      let text = fs.readFileSync(args.path, 'utf8');
      if (process.env.ARS_MUTATE === 'gate-off' && text.includes(GATE_ON)) text = text.replace(GATE_ON, 'if (false) {');
      if (process.env.ARS_MUTATE === 'gate-off' && text.includes(GATE_GATHER)) text = text.replace(GATE_GATHER, 'if (false) {');
      return { contents: text, loader: 'ts' };
    });
  },
};
let E; let R; let MIN;
/** Async init (bundle z wtyczka) -- wolac `await ready` przed `simulate`. */
const ready = esbuild.build({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: BUNDLE, loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: GRA, logLevel: 'silent', plugins: [mutatePlugin],
}).then(() => { E = require(BUNDLE); R = E.ARMY_CONCENTRATION_RADIUS; MIN = E.ARMY_CONCENTRATION_MIN_UNITS; });
const MAPCACHE = process.env.ARS_MAPCACHE || path.join(os.tmpdir(), 'ars-mapcache');

const mulberry = (a) => () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const key = (q, r) => q + ',' + r;
const hd = (a, b) => E.hexDistance(a.q, a.r, b.q, b.r);

function flatMap(w, h) {
  const hexes = {};
  for (let q = 0; q < w; q++) for (let r = 0; r < h; r++) {
    hexes[key(q, r)] = {
      coords: { q, r }, terenBazowy: 'laka', nakladka: 'brak', ulepszenie: 'brak', wlasciciel: null,
      wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {}, rzeka: { obecna: false, krawedzie: [] },
    };
  }
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 1, riverPaths: [] };
}

function getMap(world, seed) {
  if (world === 'flat') return flatMap(60, 44);
  fs.mkdirSync(MAPCACHE, { recursive: true });
  const f = path.join(MAPCACHE, `map-${world}-${seed}-60x44.json`);
  if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8'));
  const realLog = console.log; console.log = () => {};
  let m;
  try { m = E.generateMap(60, 44, seed, world); } finally { console.log = realLog; }
  fs.writeFileSync(f, JSON.stringify(m));
  return m;
}

const isLandOk = (map, q, r) => {
  const h = map.hexes[key(q, r)];
  return h !== undefined && h.terenBazowy !== 'morze' && h.terenBazowy !== 'wybrzeze' && h.terenBazowy !== 'gory';
};

/** Wspolrzedne ladu dostepne z `from` (BFS po heksach ladowych). */
function landComponent(map, from) {
  const seen = new Set([key(from.q, from.r)]);
  const queue = [from];
  while (queue.length) {
    const c = queue.shift();
    for (const n of E.hexNeighborCoords(c.q, c.r)) {
      const k = key(n.q, n.r);
      if (seen.has(k) || !isLandOk(map, n.q, n.r)) continue;
      seen.add(k); queue.push(n);
    }
  }
  return seen;
}

/** Rozmieszczenie: NCIV cywilizacji po 3 miasta w jednej, najwiekszej spojnej masie ladu. */
function placeCivs(map, nciv, rnd) {
  const all = Object.keys(map.hexes).map(k => k.split(',').map(Number)).map(([q, r]) => ({ q, r })).filter(p => isLandOk(map, p.q, p.r));
  let best = null;
  const seenAll = new Set();
  for (const p of all) {
    if (seenAll.has(key(p.q, p.r))) continue;
    const comp = landComponent(map, p);
    for (const k of comp) seenAll.add(k);
    if (best === null || comp.size > best.size) best = comp;
  }
  const land = all.filter(p => best.has(key(p.q, p.r)));
  // starty: dalekie od siebie (farthest-point), ziarno wybiera pierwszy
  const starts = [land[Math.floor(rnd() * land.length)]];
  while (starts.length < nciv) {
    let pick = null; let bd = -1;
    for (const p of land) {
      const d = Math.min(...starts.map(s => hd(s, p)));
      if (d > bd) { bd = d; pick = p; }
    }
    starts.push(pick);
  }
  const cities = [];
  let n = 0;
  starts.forEach((s, i) => {
    const owner = i + 1;
    const mine = [s];
    const near = land.filter(p => hd(s, p) >= 5 && hd(s, p) <= 9).sort((a, b) => a.q - b.q || a.r - b.r);
    for (const p of near) {
      if (mine.length >= 3) break;
      if (mine.every(m => hd(m, p) >= 5)) mine.push(p);
    }
    mine.forEach((p) => cities.push({ id: 'c' + (n++), ownerId: owner, q: p.q, r: p.r, name: 'M' + n, population: 5 }));
  });
  return cities;
}

/**
 * @param {object} o { seed, world: 'flat'|'kontynenty'|'pangea', turns, nciv, prod, cap, warFrom, patch }
 * `patch`: opcjonalny hak (np. nadpisanie opts) -- nieuzywany domyslnie.
 */
function simulate(o) {
  const seed = o.seed || 1;
  const world = o.world || 'flat';
  const TURNS = o.turns || 150;
  const NCIV = o.nciv || 4;
  const PROD = o.prod || 4;
  const CAP = o.cap || 14;
  const WAR_FROM = o.warFrom || 20;
  const realRandom = Math.random;
  Math.random = mulberry(seed * 7919 + 17);
  try {
    const rnd = mulberry(seed * 104729 + 3);
    const map = getMap(world, seed);
    const data = E.loadGameData();
    const cities = placeCivs(map, NCIV, rnd);
    const owners = [...new Set(cities.map(c => c.ownerId))];
    const units = [];
    const meta = new Map(); // unitId -> {born, wave, diedTurn}
    let uid = 0;
    const waveOf = new Map(owners.map(ow => [ow, 1]));
    const lossHist = new Map(owners.map(ow => [ow, []])); // [{turn, n}]
    const waveEvents = []; // {turn, owner, wave}
    const spawnCounter = new Map(cities.map(c => [c.id, c.ownerId % PROD]));
    // wojny: pierscien (i <-> i+1), od tury WAR_FROM
    const atWar = (a, b) => {
      if (a === b) return false;
      const d = Math.abs(a - b);
      return d === 1 || d === NCIV - 1;
    };
    const capitalOf = (ow) => (cities.find(c => c.ownerId === ow) || {}).id || null;
    const spawn = (c, turn) => {
      const u = { id: 'u' + (uid++), ownerId: c.ownerId, typeId: 'Wojownik', category: 'miecznik', q: c.q, r: c.r, ruch: 2, ruchLeft: 2 };
      units.push(u);
      meta.set(u.id, { born: turn, wave: waveOf.get(c.ownerId), owner: c.ownerId, died: null, joinedTurn: null, bornAtWar: turn >= WAR_FROM });
      return u;
    };
    // start: po 3 jednostki w stolicy (jak ekipa startowa)
    for (const ow of owners) { const cap = cities.find(c => c.id === capitalOf(ow)); for (let i = 0; i < 3; i++) spawn(cap, 0); }

    const samples = []; // {turn, owner, wave, nUnits, clusters:[sizes], stackHexes, largest, stragglers, meanRadius}
    const unitTurn = []; // {turn, owner, wave(unit), unitWave, cls, cause}
    const cmdSrc = new Map(); // klucz zrodlo -> licznik
    const ownAt = (ow) => units.filter(u => u.ownerId === ow);
    const isCityHex = (u) => cities.some(c => c.ownerId === u.ownerId && c.q === u.q && c.r === u.r);
    const t0 = Date.now();
    let aiMs = 0; let aiCalls = 0;

    for (let turn = 1; turn <= TURNS; turn++) {
      // produkcja
      for (const c of cities) {
        const k = (spawnCounter.get(c.id) + 1);
        spawnCounter.set(c.id, k);
        if (k % PROD === 0 && ownAt(c.ownerId).length < CAP) spawn(c, turn);
      }
      const war = turn >= WAR_FROM;
      for (const ow of owners) {
        for (const u of units) if (u.ownerId === ow) u.ruchLeft = u.ruch;
        const mineUnits = ownAt(ow);
        if (mineUnits.length === 0) continue;
        const enemyOwners = owners.filter(x => x !== ow && war && atWar(ow, x));
        const targets = E.buildWarCityTargets({
          selfOwnerId: ow, enemyOwnerIds: owners.filter(x => x !== ow).sort((a, b) => a - b),
          engage: (x) => war && atWar(ow, x), cities,
          combatUnits: units, isHuman: () => false, isBarbarian: () => false,
          capitalCityIdForOwner: (x) => capitalOf(x),
        });
        const warCtx = { targets };
        if (war && enemyOwners.length > 0) {
          const enemyArmies = []; const strength = new Map();
          for (const u of units) {
            if (!enemyOwners.includes(u.ownerId)) continue;
            if (cities.some(c => c.ownerId === u.ownerId && c.q === u.q && c.r === u.r)) continue;
            enemyArmies.push({ q: u.q, r: u.r, ownerId: u.ownerId });
            strength.set(u.ownerId, (strength.get(u.ownerId) || 0) + 1);
          }
          warCtx.enemyArmies = enemyArmies;
          warCtx.engageRadius = E.WAR_RULES_PARAMS.engageRadiusHexes;
          warCtx.enemyStrength = enemyOwners.map(x => ({ ownerId: x, strength: strength.get(x) || 0 }));
        }
        const opts = {
          civType: 'grecy', poziomTrudnosci: 2, currentTurn: turn,
          civAiProfile: { ekspansywnosc: 2, sklonnoscDoPodboju: 1 + (ow % 4) },
          canEngageOwner: (x) => war && atWar(ow, x),
          warAllIn: war && targets.length > 0 ? warCtx : undefined,
          capitalCityId: capitalOf(ow),
          atWarWithCiv: war && enemyOwners.length > 0,
        };
        if (o.patchOpts) o.patchOpts(opts, { ow, turn });
        const tp = Date.now();
        const cmds = E.decideAITurn(ow, units, cities, map, data, opts);
        aiMs += Date.now() - tp; aiCalls++;
        const srcByUnit = new Map();
        for (const cmd of cmds) {
          if (cmd.type !== 'move') continue;
          const u = units.find(x => x.id === cmd.unitId && x.ownerId === ow);
          if (!u) continue;
          const occ = units.find(x => x.id !== u.id && x.q === cmd.toQ && x.r === cmd.toR);
          if (occ && occ.ownerId !== ow) continue; // wrog: ruch zablokowany (walke rozstrzyga atrapa)
          const enemyCity = cities.find(c => c.ownerId !== ow && c.q === cmd.toQ && c.r === cmd.toR);
          if (enemyCity) continue;
          u.q = cmd.toQ; u.r = cmd.toR;
          srcByUnit.set(u.id, cmd.targetCityId !== undefined ? 'war-allin-march' : 'other-move');
        }
        for (const [uidx, s] of srcByUnit) { const m = meta.get(uidx); if (m) m.lastSrc = s; }
        for (const u of units) if (u.ownerId === ow && !srcByUnit.has(u.id)) { const m = meta.get(u.id); if (m) m.lastSrc = 'no-move'; }
      }
      // walka (atrapa)
      if (war) {
        const fought = new Set();
        const dead = new Set();
        const sorted = [...units].sort((a, b) => (a.id < b.id ? -1 : 1));
        const strengthAt = (u) => {
          let s = units.filter(x => x.ownerId === u.ownerId && !dead.has(x.id) && hd(x, u) <= 2).length;
          if (cities.some(c => c.ownerId === u.ownerId && hd(c, u) <= 1)) s += 3; // obronca przy miescie
          return s;
        };
        for (const a of sorted) {
          if (dead.has(a.id) || fought.has(a.id)) continue;
          const foe = sorted.find(b => !dead.has(b.id) && !fought.has(b.id) && b.ownerId !== a.ownerId && atWar(a.ownerId, b.ownerId) && hd(a, b) <= 1);
          if (!foe) continue;
          fought.add(a.id); fought.add(foe.id);
          const sa = strengthAt(a); const sb = strengthAt(foe);
          const lo = sa < sb ? a : foe; const hi = lo === a ? foe : a;
          const sl = Math.min(sa, sb); const sh = Math.max(sa, sb);
          if (sa === sb) { dead.add(a.id); dead.add(foe.id); } else { dead.add(lo.id); if (sh < 2 * sl) dead.add(hi.id); }
        }
        // atak na miasto: jednostka stojaca przy wrogim miescie bez obroncow na heksie -- ginie (mur)
        for (const a of sorted) {
          if (dead.has(a.id)) continue;
          const wallCity = cities.find(c => c.ownerId !== a.ownerId && atWar(a.ownerId, c.ownerId) && hd(a, c) <= 1);
          if (!wallCity) continue;
          const here = units.filter(x => x.ownerId === a.ownerId && !dead.has(x.id) && hd(x, wallCity) <= 1).length;
          if (here < 6) dead.add(a.id); // < 6 jednostek pod murami: rozbici
        }
        if (dead.size > 0) {
          const lossBy = new Map();
          for (const id of dead) { const m = meta.get(id); m.died = turn; lossBy.set(m.owner, (lossBy.get(m.owner) || 0) + 1); }
          for (let i = units.length - 1; i >= 0; i--) if (dead.has(units[i].id)) units.splice(i, 1);
          for (const [ow, n] of lossBy) {
            const h = lossHist.get(ow); h.push({ turn, n });
            const recent = h.filter(x => x.turn >= turn - 1).reduce((s, x) => s + x.n, 0);
            if (recent >= MIN && (waveEvents.filter(e => e.owner === ow).length === 0 || turn - waveEvents.filter(e => e.owner === ow).slice(-1)[0].turn > 3)) {
              waveOf.set(ow, waveOf.get(ow) + 1);
              waveEvents.push({ turn, owner: ow, wave: waveOf.get(ow) });
            }
          }
        }
      }
      // pomiary tury
      for (const ow of owners) {
        const mine = ownAt(ow);
        if (mine.length === 0) { samples.push({ turn, owner: ow, wave: waveOf.get(ow), nUnits: 0, clusters: [], stackHexes: 0, largest: 0, stragglers: 0, meanRadius: 0 }); continue; }
        const cl = E.clusterUnitsByProximity(mine, R).sort((a, b) => b.length - a.length);
        const big = cl[0];
        const cq = big.reduce((s, u) => s + u.q, 0) / big.length; const cr = big.reduce((s, u) => s + u.r, 0) / big.length;
        const others = mine.filter(u => !big.includes(u));
        const meanRadius = mine.reduce((s, u) => s + hd(u, { q: Math.round(cq), r: Math.round(cr) }), 0) / mine.length;
        const hexCount = new Map(); for (const u of mine) hexCount.set(key(u.q, u.r), (hexCount.get(key(u.q, u.r)) || 0) + 1);
        samples.push({ turn, owner: ow, wave: waveOf.get(ow), nUnits: mine.length, armies: cl.filter(g => g.length >= MIN).length, clusters: cl.map(g => g.length), stackHexes: [...hexCount.values()].filter(n => n >= 2).length, largest: big.length, stragglers: others.length, meanRadius });
        const clOf = new Map(); for (const g of cl) for (const u of g) clOf.set(u.id, g.length);
        for (const u of mine) {
          const m = meta.get(u.id);
          const size = clOf.get(u.id);
          if (size >= MIN && m.joinedTurn === null) m.joinedTurn = turn;
          let cls;
          if (isCityHex(u)) cls = size >= MIN ? 'city-in-army' : 'city-waiting';
          else if (size >= MIN) cls = 'in-army>=3';
          else if (size === 2) cls = 'pair';
          else cls = 'singleton-in-field';
          unitTurn.push({ turn, owner: ow, unitWave: m.wave, curWave: waveOf.get(ow), cls, src: m.lastSrc || 'none', size, war: turn >= WAR_FROM, born: m.born });
          if (turn >= WAR_FROM && cls !== 'in-army>=3' && cls !== 'city-in-army') {
            const k = (m.lastSrc || 'none');
            cmdSrc.set(k + '|' + cls, (cmdSrc.get(k + '|' + cls) || 0) + 1);
          }
        }
      }
    }
    return { seed, world, turns: TURNS, ncomp: NCIV, samples, unitTurn, waveEvents, meta: [...meta.entries()].map(([id, m]) => ({ id, ...m })), cmdSrc: Object.fromEntries(cmdSrc), aiMs, aiCalls, wallMs: Date.now() - t0, finalUnits: units.length };
  } finally {
    Math.random = realRandom;
  }
}

const avg = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const med = (a) => { if (!a.length) return NaN; const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; };
const f1 = (x) => (Number.isFinite(x) ? x.toFixed(2) : 'NIE_ZMIERZONO');

/** Agregacja metryk (a)-(e) z listy wynikow `simulate`. */
function summarize(results) {
  const out = { runs: results.length };
  const warSamples = [];
  for (const r of results) for (const s of r.samples) if (s.turn >= 20 && s.nUnits >= 1) warSamples.push({ ...s, w: r.world });
  const byWave = (w) => warSamples.filter(s => (w === 1 ? s.wave === 1 : s.wave >= 2));
  out.waves = {};
  for (const [name, w] of [['fala1', 1], ['fala2+', 2]]) {
    const ss = byWave(w);
    out.waves[name] = {
      samples: ss.length,
      avgClusters: avg(ss.map(s => s.clusters.length)),
      avgLargest: avg(ss.map(s => s.largest)),
      avgUnits: avg(ss.map(s => s.nUnits)),
      avgStragglerShare: avg(ss.map(s => (s.nUnits ? s.stragglers / s.nUnits : 0))),
      avgStackHexes: avg(ss.map(s => s.stackHexes)),
      avgArmies3: avg(ss.map(s => s.armies)),
      shareMultiArmy: avg(ss.map(s => (s.armies >= 2 ? 1 : 0))),
      shareArmiesOverWars: avg(ss.map(s => (s.armies > 2 ? 1 : 0))), // pierscien 4 cywilizacji => 2 wojny/cywilizacje
      shareArmiesOver1: avg(ss.map(s => (s.armies > 1 ? 1 : 0))),
      avgMeanRadius: avg(ss.map(s => s.meanRadius)),
      shareTurnsWithArmy3: avg(ss.map(s => (s.largest >= MIN ? 1 : 0))),
    };
  }
  // (c) czas od rekrutacji do dolaczenia do armii (>=3 w promieniu 4) -- jednostki urodzone w wojnie
  const joinBy = { fala1: [], 'fala2+': [] }; const neverBy = { fala1: 0, 'fala2+': 0 }; const nBy = { fala1: 0, 'fala2+': 0 };
  for (const r of results) for (const m of r.meta) {
    if (!m.bornAtWar) continue;
    const k = m.wave === 1 ? 'fala1' : 'fala2+';
    nBy[k]++;
    if (m.joinedTurn !== null) joinBy[k].push(m.joinedTurn - m.born); else neverBy[k]++;
  }
  out.join = {};
  for (const k of Object.keys(joinBy)) out.join[k] = { n: nBy[k], medianTurns: med(joinBy[k]), meanTurns: avg(joinBy[k]), neverJoinedShare: nBy[k] ? neverBy[k] / nBy[k] : NaN };
  // (d) zachowanie jednostek ZASTEPCZYCH (unitWave>=2) w ciagu 15 tur po zdarzeniu "armia zniszczona"
  const dist = {}; let dn = 0;
  for (const r of results) {
    const evs = r.waveEvents;
    for (const ut of r.unitTurn) {
      if (ut.unitWave < 2) continue;
      const ev = evs.find(e => e.owner === ut.owner && e.wave === ut.unitWave);
      if (!ev || ut.turn < ev.turn || ut.turn > ev.turn + 15) continue;
      dist[ut.cls] = (dist[ut.cls] || 0) + 1; dn++;
    }
  }
  out.replacement15t = { unitTurns: dn, share: Object.fromEntries(Object.entries(dist).map(([k, v]) => [k, v / dn])) };
  // (e) przyczyny: zrodlo ostatniej komendy jednostki poza armia >=3
  const cause = {}; let cn = 0;
  for (const r of results) for (const [k, v] of Object.entries(r.cmdSrc)) { cause[k] = (cause[k] || 0) + v; cn += v; }
  out.causeHistogram = Object.fromEntries(Object.entries(cause).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, v]));
  // wojny: "ataki ponizej progu": jednostki w polu, poza armia >=3, ktore dostaly marsz war-allin
  let belowThr = 0; let marching = 0;
  for (const r of results) for (const ut of r.unitTurn) {
    if (!ut.war) continue;
    if (ut.src === 'war-allin-march') { marching++; if (ut.size < MIN) belowThr++; }
  }
  out.marchBelowThreshold = { marchUnitTurns: marching, belowThresholdUnitTurns: belowThr, share: marching ? belowThr / marching : NaN };
  out.waveEvents = results.reduce((s, r) => s + r.waveEvents.length, 0);
  out.aiMsPerCall = avg(results.map(r => r.aiMs / Math.max(1, r.aiCalls)));
  return out;
}

function perCiv(results) {
  const rows = [];
  for (const r of results) {
    for (let ow = 1; ow <= r.ncomp; ow++) {
      const ss = r.samples.filter(s => s.owner === ow && s.turn >= 20 && s.nUnits >= 1);
      const evs = r.waveEvents.filter(e => e.owner === ow).length;
      rows.push({ world: r.world, seed: r.seed, owner: ow, waves: evs + 1, avgUnits: avg(ss.map(s => s.nUnits)), avgClusters: avg(ss.map(s => s.clusters.length)), avgLargest: avg(ss.map(s => s.largest)), stragglerShare: avg(ss.map(s => (s.nUnits ? s.stragglers / s.nUnits : 0))), meanRadius: avg(ss.map(s => s.meanRadius)), turnsWithArmy3: avg(ss.map(s => (s.largest >= MIN ? 1 : 0))) });
    }
  }
  return rows;
}

module.exports = { ready, simulate, summarize, perCiv, f1 };

if (require.main === module) ready.then(() => {
  const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i >= 0 ? process.argv[i + 1] : d; };
  const seeds = arg('seeds', '1,2,3,4,5,6').split(',').map(Number);
  const worlds = arg('worlds', 'flat,kontynenty,pangea').split(',');
  const turns = Number(arg('turns', '150'));
  const label = arg('label', 'run');
  const outF = arg('out', null);
  const results = [];
  for (const w of worlds) for (const s of seeds) {
    const r = simulate({ seed: s, world: w, turns });
    results.push(r);
    console.log(`[${label}] ${w} seed=${s} wave-events=${r.waveEvents.length} finalUnits=${r.finalUnits} aiMs/call=${(r.aiMs / Math.max(1, r.aiCalls)).toFixed(2)} wall=${r.wallMs}ms`);
  }
  const sum = summarize(results);
  console.log(JSON.stringify(sum, null, 1));
  if (outF) fs.writeFileSync(outF, JSON.stringify({ label, summary: sum, perCiv: perCiv(results) }, null, 1));
  try { fs.rmSync(WORK, { recursive: true, force: true }); } catch (e) { /* ignore */ }
}).catch((e) => { console.error(e); process.exit(1); });
