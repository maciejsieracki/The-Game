'use strict';
/**
 * fort-outpost-placement-measure.cjs -- R-WEB-FORT-OUTPOST-PLACEMENT-RULES-Q1: pomiar (histogram) GDZIE realna
 * funkcja AI `planExpansionFortBuilding` stawia forty i posterunki wzgledem granicy wlasnego terytorium.
 * Klasy: wewnatrz-w-glebi | wewnatrz-przy-granicy | poza-przylegle (poza terenem, sasiad heksu wlasnego) | poza-nieprzylegle.
 * Metoda: realny generator mapy (generateMap) per (typ swiata x ziarno), 1 miasto AI na ladzie, N jednostek AI na
 * losowych heksach ladu; KAZDA jednostka osobno -> komenda planExpansionFortBuilding. To NIE jest pelna gra
 * (patrz raport: pelna gra w przegladarce ~50 min/bieg) -- mierzy WYLACZNIE sciezke ekspansji AI poza zasiegiem.
 * node tools/fort-outpost-placement-measure.cjs [--seeds 1,2,3,4,5] [--types kontynenty,pangea,wyspy] [--w 80 --h 56] [--units 60]
 * Zmienna PLACEMENT_SRC -- inny katalog src (stan PRZED).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
function arg(n, d) { const i = process.argv.indexOf('--' + n); return i >= 0 ? process.argv[i + 1] : d; }
const GRA = path.resolve(__dirname, '..');
const SRC = process.env.PLACEMENT_SRC ? path.resolve(process.env.PLACEMENT_SRC) : path.resolve(GRA, 'src');
const esbuild = require(path.resolve(GRA, 'node_modules', 'esbuild'));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fort-outpost-measure-'));
const ENTRY = path.join(tmp, 'entry.ts');
const BUNDLE = path.join(tmp, 'bundle.cjs');
fs.writeFileSync(ENTRY, `
export { planExpansionFortBuilding } from ${JSON.stringify(SRC + '/game/ai')};
export { territoryOwnerAt, cityTerritoryRadius } from ${JSON.stringify(SRC + '/map/territory')};
export { generateMap } from ${JSON.stringify(SRC + '/map/generator')};
export { setRiverGenPhaseOverride } from ${JSON.stringify(SRC + '/map/riverGenSwitch')};
`);
esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' }, outfile: BUNDLE, absWorkingDir: GRA, logLevel: 'silent' });
const M = require(BUNDLE);
M.setRiverGenPhaseOverride('main');

const SEEDS = arg('seeds', '1,2,3,4,5').split(',').map(Number);
const TYPES = arg('types', 'kontynenty,pangea,wyspy').split(',');
const W = Number(arg('w', '80')), H = Number(arg('h', '56')), NU = Number(arg('units', '60'));
const mulberry = (a) => () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];
const WATER = new Set(['morze', 'plytkie_morze', 'gory']);
const hist = {};
const bump = (key, cls) => { hist[key] = hist[key] || {}; hist[key][cls] = (hist[key][cls] || 0) + 1; };
const perRun = [];
for (const typ of TYPES) for (const seed of SEEDS) {
  const rnd = mulberry(seed * 7919 + 13);
  const map = M.generateMap(W, H, seed, typ);
  const land = Object.values(map.hexes).filter((h) => !WATER.has(h.terenBazowy));
  if (land.length < 20) continue;
  const c = land[Math.floor(rnd() * land.length)].coords;
  const city = { id: 'c0', ownerId: 0, q: c.q, r: c.r, population: 3 };
  const nodes = [{ q: c.q, r: c.r, pop: 3, level: 1, ownerId: 0 }];
  const own = (q, r) => M.territoryOwnerAt(q, r, nodes) === 0;
  const border = (q, r) => NB.some(([dq, dr]) => !own(q + dq, r + dr));
  const TECHS = arg('techs', 'Wojskowość,Obróbka drewna,Murarstwo').split(',').filter(Boolean);
  const base = { improvementTechs: new Set(TECHS), placedImprovements: new Map(),
    fortNodes: [], pracaAvailable: 5000, territoryNodes: nodes, currentTurn: 50 };
  const run = { typ, seed, cmds: 0 };
  for (let i = 0; i < NU; i++) {
    const u = land[Math.floor(rnd() * land.length)].coords;
    const cmd = M.planExpansionFortBuilding(0, [city], [{ id: 'u' + i, ownerId: 0, q: u.q, r: u.r, inGarnizon: false }], map, base);
    if (!cmd) continue;
    run.cmds++;
    let cls;
    if (own(cmd.q, cmd.r)) cls = border(cmd.q, cmd.r) ? 'wewnatrz-przy-granicy' : 'wewnatrz-w-glebi';
    else cls = NB.some(([dq, dr]) => own(cmd.q + dq, cmd.r + dr)) ? 'poza-przylegle' : 'poza-nieprzylegle';
    bump(cmd.key, cls); bump(cmd.key, 'RAZEM');
    if (cmd.key === 'posterunek' && cls !== 'wewnatrz-przy-granicy') bump('posterunek', 'NARUSZENIE-REGULY');
  }
  perRun.push(run);
}
console.log(JSON.stringify({ src: SRC, W, H, units: NU, seeds: SEEDS, types: TYPES, histogram: hist, runs: perRun.length }, null, 1));
try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) { /* ignore */ }
