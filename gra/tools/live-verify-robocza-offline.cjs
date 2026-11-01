'use strict';
/**
 * live-verify-robocza-offline.cjs — R-WEB-LIVE-VERIFY-ROBOCZA-Q1, analiza punktów 1 (realny % lądu), 3 (polary), 5 (rozproszenie stolic).
 * Wejście: evidence/live-gen-*.json (surowy stan ŻYWEJ gry z bundla ROBOCZA). Teren heksów NIE jest dostępny przez hooki bundla,
 * więc ta sama mapa jest odtwarzana deterministycznie (generateMap z tym samym ziarnem/typem/udziałem lądu) w node (esbuild
 * do katalogu tymczasowego POZA gra/). Zgodność mapy offline z żywą potwierdza identyczność położenia stolic żywych i planu offline.
 * esbuild: env CIV_ESBUILD_DIR (katalog z node_modules/esbuild) albo gra/node_modules.
 * Usage: node gra/tools/live-verify-robocza-offline.cjs [--out evidence/punkt-analiza.json]
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const GRA = path.resolve(__dirname, '..');
const EVID = path.join(GRA, '..', 'dyspozycje', 'autobot', 'runs', 'R-WEB-LIVE-VERIFY-ROBOCZA-Q1', 'evidence');

function loadEsbuild() {
  for (const d of [GRA, process.env.CIV_ESBUILD_DIR, process.cwd()].filter(Boolean)) {
    try { return require(require.resolve('esbuild', { paths: [d] })); } catch (_) { /* next */ }
  }
  throw new Error('Brak esbuild: ustaw CIV_ESBUILD_DIR');
}
const esbuild = loadEsbuild();
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lvr-'));
const entry = path.join(tmp, 'entry.ts');
const bundle = path.join(tmp, 'bundle.cjs');
const rel = (p) => JSON.stringify(path.join(GRA, p).replace(/\\/g, '/'));
fs.writeFileSync(entry, `
export { buildClusterStartPlan } from ${rel('src/game/cluster-start')};
export { generateMap } from ${rel('src/map/generator')};
export { setRiverGenPhaseOverride, setRiverGenEnabledOverride } from ${rel('src/map/riverGenSwitch')};
export { hexDistanceAxial, defaultLandFractionForTyp } from ${rel('src/map/gen-helpers')};
export { DEFAULT_START_EPOCH_ID, DEFAULT_PLAYER_CIV_ID } from ${rel('src/map/newGameMapDefaults')};
`, 'utf8');
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' }, outfile: bundle, absWorkingDir: GRA, logLevel: 'silent',
  nodePaths: [path.join(GRA, 'node_modules'), process.env.CIV_ESBUILD_DIR ? path.join(process.env.CIV_ESBUILD_DIR, 'node_modules') : ''].filter(Boolean),
});
const M = require(bundle);
M.setRiverGenPhaseOverride('main');
M.setRiverGenEnabledOverride(process.env.LVR_RIVERS === '1');
const civs = JSON.parse(fs.readFileSync(path.join(GRA, 'data/civs.json'), 'utf8'));
const D = (a, b) => M.hexDistanceAxial(a.q, a.r, b.q, b.r);
const WATER = new Set(['morze', 'plytkie_morze']);

const FILT = process.env.LVR_FILTER ? new RegExp(process.env.LVR_FILTER) : null;
const files = fs.readdirSync(EVID).filter((f) => /^live-gen-.*\.json$/.test(f) && (!FILT || FILT.test(f))).sort();
const rows = [];
for (const f of files) {
  const live = JSON.parse(fs.readFileSync(path.join(EVID, f), 'utf8'));
  if (!live.ok) { rows.push({ file: f, error: live.error }); continue; }
  const typ = live.typ; const seed = live.seedSeen ?? live.seedWanted;
  const lf = M.defaultLandFractionForTyp(typ);
  const map = M.generateMap(168, 120, seed, typ, { landFraction: lf, mapSizeMenuLabel: 'Standardowy', difficulty: 'normal', civTypesCount: 7, cityStatesCount: 6, villageRewardsEnabled: true, worldDensity: { resources: 'medium', rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' } });
  const hexes = Object.values(map.hexes);
  const land = hexes.filter((h) => !WATER.has(h.terenBazowy)).length;
  const landNoCoast = hexes.filter((h) => !WATER.has(h.terenBazowy) && h.terenBazowy !== 'wybrzeze').length;
  const polarHexes = hexes.filter((h) => h.terenBazowy === 'polarny').length;
  const plan = M.buildClusterStartPlan({ map, civs, seed, playerCivId: live.menuCivId, rywaleNaKlaster: 6, aktywneTypy: 7, startEpochId: M.DEFAULT_START_EPOCH_ID });
  // żywe stolice: gracz + pierwsze miasto każdego obcego typu (ownerId, kolejność utworzenia)
  const liveCities = live.cities;
  const player = liveCities.find((c) => c.ownerId === 0);
  const firstOfOwner = new Map();
  for (const c of liveCities) if (c.ownerId !== 0 && !c.startCityState && !firstOfOwner.has(c.ownerId)) firstOfOwner.set(c.ownerId, c);
  const liveCaps = [{ id: 'gracz', q: player.q, r: player.r }];
  const typeOfOwner = (oid) => (liveCities.find((c) => c.ownerId === oid) || {}).civTypeId;
  for (const [oid, c] of firstOfOwner) liveCaps.push({ id: typeOfOwner(oid) + '#' + oid, q: c.q, r: c.r });
  // capitals: wlasciciel AI bez flagi startCityState
  let liveCapMin = Infinity, liveCapPair = null;
  for (let i = 0; i < liveCaps.length; i++) for (let j = i + 1; j < liveCaps.length; j++) {
    const d = D(liveCaps[i], liveCaps[j]);
    if (d < liveCapMin) { liveCapMin = d; liveCapPair = [liveCaps[i].id, liveCaps[j].id]; }
  }
  const planCaps = [{ id: 'gracz', q: plan.playerStartHex.q, r: plan.playerStartHex.r }];
  for (const fc of plan.foreignTypeClusters) if (fc.positions[0]) planCaps.push({ id: fc.typ, q: fc.positions[0].q, r: fc.positions[0].r });
  let planCapMin = Infinity;
  for (let i = 0; i < planCaps.length; i++) for (let j = i + 1; j < planCaps.length; j++) planCapMin = Math.min(planCapMin, D(planCaps[i], planCaps[j]));
  const same = liveCaps.filter((c) => planCaps.some((p) => p.q === c.q && p.r === c.r)).length;
  // polary: stolice AI (bez gracza) i WSZYSTKIE miasta AI/MP
  const terrAt = (c) => (map.hexes[c.q + ',' + c.r] || {}).terenBazowy;
  const aiCities = liveCities.filter((c) => c.ownerId !== 0);
  const polarCaps = liveCaps.filter((c) => c.id !== 'gracz' && terrAt(c) === 'polarny');
  const polarAiCities = aiCities.filter((c) => terrAt(c) === 'polarny');
  const playerPolar = terrAt(player) === 'polarny';
  // pary miast różnych cywilizacji (typ różny od typu gracza lub różny od siebie)
  const civOf = (c) => (c.ownerId === 0 ? live.menuCivId : c.civTypeId);
  let cityMin = Infinity;
  for (let i = 0; i < liveCities.length; i++) for (let j = i + 1; j < liveCities.length; j++) {
    if (civOf(liveCities[i]) !== civOf(liveCities[j])) cityMin = Math.min(cityMin, D(liveCities[i], liveCities[j]));
  }
  rows.push({
    file: f, typ, seed, lf, landPct: +(100 * land / hexes.length).toFixed(1), landNoCoastPct: +(100 * landNoCoast / hexes.length).toFixed(1),
    hexes: hexes.length, polarHexes,
    liveCapMin, liveCapPair, planCapMin, liveCaps: liveCaps.map((c) => `${c.id}@${c.q},${c.r}`),
    capsMatchPlan: `${same}/${liveCaps.length}`, mapMatches: same === liveCaps.length,
    polarCaps: polarCaps.map((c) => c.id), polarAiCityCount: polarAiCities.length, playerPolar, cityMinDiffCiv: Number.isFinite(cityMin) ? cityMin : null,
    liveCitiesN: liveCities.length,
  });
}
const out = { note: 'teren z deterministycznej regeneracji mapy (ziarno z logu zywej gry); zgodnosc potwierdza capsMatchPlan', rows };
fs.writeFileSync(path.join(EVID, process.env.LVR_RIVERS === '1' ? 'analiza-offline-rzeki-ON.json' : 'analiza-offline-z-zywych-stanow.json'), JSON.stringify(out, null, 2));
for (const r of rows) console.log(JSON.stringify(r));
try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) { /* ignore */ }
