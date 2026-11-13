'use strict';
/**
 * auto-fort-claim-measure.cjs — POMIAR (nie bramka) tematu R-WEB-AUTO-FORT-CLAIM-Q1: skutek kroku E-FORT na AI
 * cywilizacji (K3, produkcyjny `decideAITurn`) — N ziaren x T tur na wygenerowanej mapie ('kontynenty').
 * Porownanie: ON = `cityLimitBase` podany (limit miast wyczerpany: 3 miasta, era 1, baza 3), OFF = brak `cityLimitBase`
 * (krok nieaktywny — zachowanie sprzed tematu). Mierzy: heksy ladowe w terytorium AI, w tym heksy ZE ZLOZEM i GORY,
 * liczbe fortow/posterunkow, Prace wydana na forty.
 *
 * Run z gra/:  node tools/auto-fort-claim-measure.cjs
 * Env: FORT_SEEDS=42,1337,2026,7,99  FORT_TURNS=40  FORT_INCOME=80  FORT_POOL0=2000  FORT_SRC_DIR=<src>
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.FORT_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'fort-measure-'));
const entry = path.join(temp, 'entry.ts');
const bundle = path.join(temp, 'bundle.cjs');
fs.writeFileSync(entry, [
  `export { generateMap } from ${JSON.stringify(SRC + '/map/generator')};`,
  `export { decideAITurn } from ${JSON.stringify(SRC + '/game/ai')};`,
  `export { territoryOwnerAt } from ${JSON.stringify(SRC + '/map/territory')};`,
  `export { hexHasDepositReserve } from ${JSON.stringify(SRC + '/map/improvement-build')};`,
  `export { getImprovementMeta } from ${JSON.stringify(SRC + '/game/improvement-tech')};`,
  `export { TerenBazowy, Nakladka } from ${JSON.stringify(SRC + '/types/hex')};`,
].join('\n') + '\n');
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: bundle,
  loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: GRA_ROOT, logLevel: 'error',
  nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
});
const M = require(bundle);
const { TerenBazowy, Nakladka } = M;

const TECHS = new Set([
  'Rolnictwo', 'Oswojenie zwierząt', 'Gospodarka wodna', 'Irygacja', 'Łowiectwo', 'Obróbka drewna',
  'Garncarstwo', 'Murarstwo', 'Górnictwo', 'Brązownictwo', 'Hutnictwo żelaza', 'Jeździectwo', 'Koło',
  'Waluta', 'Wojskowość', 'Żegluga', 'Drogi brukowane', 'Matematyka', 'Obróbka kamienia', 'Kamieniarstwo',
]);
const isWater = h => h.terenBazowy === TerenBazowy.Morze || h.terenBazowy === TerenBazowy.PlytkieMorze;

function pickCitySpots(map, n) {
  const keys = Object.keys(map.hexes).sort((a, b) => {
    const [aq, ar] = a.split(',').map(Number); const [bq, br] = b.split(',').map(Number);
    return aq !== bq ? aq - bq : ar - br;
  });
  const scored = [];
  for (const k of keys) {
    const h = map.hexes[k];
    if (!h || isWater(h) || h.terenBazowy === TerenBazowy.Gory) continue;
    const [q, r] = k.split(',').map(Number);
    let land = 0;
    for (let dq = -4; dq <= 4; dq++) for (let dr = -4; dr <= 4; dr++) {
      if (Math.abs(dq + dr) > 4) continue;
      const nb = map.hexes[`${q + dq},${r + dr}`];
      if (nb && !isWater(nb)) land++;
    }
    scored.push({ q, r, land });
  }
  scored.sort((a, b) => (b.land - a.land) || (a.q - b.q) || (a.r - b.r));
  const out = [];
  for (const s of scored) {
    if (out.every(o => Math.abs(o.q - s.q) + Math.abs(o.r - s.r) > 12)) out.push(s);
    if (out.length >= n) break;
  }
  return out;
}

function measureTerritory(map, nodes, ownerId) {
  let land = 0, deposits = 0, mountains = 0;
  for (const k of Object.keys(map.hexes)) {
    const h = map.hexes[k];
    if (isWater(h)) continue;
    const [q, r] = k.split(',').map(Number);
    if (M.territoryOwnerAt(q, r, nodes) !== ownerId) continue;
    land++;
    if (h.terenBazowy === TerenBazowy.Gory) mountains++;
    else if (M.hexHasDepositReserve(h)) deposits++;
  }
  return { land, deposits, mountains, valuable: deposits + mountains };
}

function simulate(seed, turns, on, income, pool0) {
  const map = M.generateMap(36, 28, seed, 'kontynenty');
  const spots = pickCitySpots(map, 3);
  const cities = spots.map((s, i) => ({
    id: `c${i}`, ownerId: 1, q: s.q, r: s.r, name: `M${i}`, population: 6,
    okolicaTryb: 'reczny', okolicaReczne: {},
  }));
  const nodes = cities.map(c => ({ q: c.q, r: c.r, ownerId: 1, cityId: c.id, pop: c.population, level: 1 }));
  const placed = new Map();
  let pool = pool0;
  let fortSpent = 0;
  const forts = [];
  const before = measureTerritory(map, nodes, 1);
  const counts = {};
  let firstFortTurn = null;
  for (let t = 0; t < turns; t++) {
    const cmds = M.decideAITurn(1, [], cities, map,
      { units: [], buildings: [], aiParams: {}, terrainYields: { terrain_types: [] } }, {
        civType: 'grecy', poziomTrudnosci: 2, defensiveCopy: false, cityBuildings: {},
        territoryNodes: nodes, placedImprovements: placed, improvementTechs: TECHS, pracaAvailable: pool,
        civEra: 1, resourceDeficitKeys: [], improvementBudgetCap: pool,
        ...(on ? { cityLimitBase: cities.length } : {}),
      }).filter(c => c.type === 'buildImprovement');
    for (const c of cmds) {
      const meta = M.getImprovementMeta(c.key);
      const cost = c.key === 'wyrab' ? 3 : (meta ? meta.kosztPraca : 20);
      if (pool < cost) continue;
      pool -= cost;
      counts[c.key] = (counts[c.key] ?? 0) + 1;
      const hk = `${c.q},${c.r}`;
      if (c.key === 'wyrab') { map.hexes[hk].nakladka = Nakladka.Brak; continue; }
      placed.set(hk, [...(placed.get(hk) ?? []), c.key]);
      if (c.key === 'fort' || c.key === 'posterunek') {
        fortSpent += cost;
        forts.push({ t, key: c.key, q: c.q, r: c.r });
        if (firstFortTurn === null) firstFortTurn = t;
        nodes.push({ q: c.q, r: c.r, ownerId: 1, pop: 0, level: 1, isFort: c.key === 'fort', isOutpost: c.key === 'posterunek' });
      }
    }
    pool += income;
  }
  const after = measureTerritory(map, nodes, 1);
  return { seed, before, after, forts, fortSpent, firstFortTurn, counts };
}

const seeds = (process.env.FORT_SEEDS || '42,1337,2026,7,99').split(',').map(Number);
const TURNS = Number(process.env.FORT_TURNS || 40);
const INCOME = Number(process.env.FORT_INCOME || 80);
const POOL0 = Number(process.env.FORT_POOL0 || 2000);
console.log(`# R-WEB-AUTO-FORT-CLAIM-Q1 pomiar AI (K3) · ${seeds.length} ziaren x ${TURNS} tur · dochod ${INCOME}/ture, pula startowa ${POOL0} · src=${SRC}`);
const sum = { off: { land: 0, valuable: 0, forts: 0, spent: 0 }, on: { land: 0, valuable: 0, forts: 0, spent: 0 } };
for (const seed of seeds) {
  const off = simulate(seed, TURNS, false, INCOME, POOL0);
  const on = simulate(seed, TURNS, true, INCOME, POOL0);
  for (const [name, r] of [['off', off], ['on', on]]) {
    sum[name].land += r.after.land; sum[name].valuable += r.after.valuable; sum[name].forts += r.forts.length; sum[name].spent += r.fortSpent;
  }
  console.log(`seed ${seed}: OFF land ${off.after.land} (zloza+gory ${off.after.valuable}) forty ${off.forts.length}`
    + ` | ON land ${on.after.land} (zloza+gory ${on.after.valuable}) forty ${on.forts.length} [${on.forts.map(f => `${f.key}@t${f.t}`).join(' ')}] praca-na-forty ${on.fortSpent}`
    + ` | start land ${on.before.land}`);
  const keysOn = Object.entries(on.counts).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join(' ');
  console.log(`   ON rozkazy: ${keysOn}`);
}
const n = seeds.length;
console.log(`\nSREDNIA/ziarno: OFF land ${(sum.off.land / n).toFixed(1)} valuable ${(sum.off.valuable / n).toFixed(1)} forty ${(sum.off.forts / n).toFixed(1)}`
  + ` | ON land ${(sum.on.land / n).toFixed(1)} valuable ${(sum.on.valuable / n).toFixed(1)} forty ${(sum.on.forts / n).toFixed(1)} praca-na-forty ${(sum.on.spent / n).toFixed(1)}`);
console.log(`PRZYROST terytorium ON-OFF: +${((sum.on.land - sum.off.land) / n).toFixed(1)} heksow lad./ziarno, +${((sum.on.valuable - sum.off.valuable) / n).toFixed(1)} heksow zloza+gory/ziarno`);
try { fs.rmSync(temp, { recursive: true, force: true }); } catch (_) { /* ignore */ }
