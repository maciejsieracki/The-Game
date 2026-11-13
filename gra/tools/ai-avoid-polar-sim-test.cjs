'use strict';
/**
 * node tools/ai-avoid-polar-sim-test.cjs [--measure]
 * R-WEB-AI-AVOID-POLAR-CITIES-Q1: SYMULACJA ZASTEPCZA kolonizacji (NIE decideAITurn): buildClusterStartPlan +
 * petla TURNS iteracji `planCityFounding` (+ canFoundCity), zakladajaca miasta AI/MP bez gospodarki, wojen i
 * czasu tury. Liczy miasta AI/MP na heksie Polarny i w jego sasiedztwie (promien 1/2) oraz liczbe miast AI.
 * UWAGA: domyslnie TURNS=15 iteracji, to NIE jest "tura 100" gry. Prawdziwy pomiar liczby miast AI w turze 100
 * przez decideAITurn = NIE_ZMIERZONO (harness w sandboxie nie zalozyl zadnego miasta).
 * Ponadto plon w hexCityScore jest zerowy w realnych danych (diakrytyki), wiec test normalizuje nazwy tereni
 * po swojej stronie (FOLD) — wynik dotyczy znormalizowanej punktacji, nie realnego tempa ekspansji.
 * Env: GRA_ROOT (domyslnie ..), SEEDS, TYPES, TURNS (domyslnie 15), W, H (domyslnie 168x120).
 * Bez --measure: twarda asercja — zero miast AI/MP na heksie Polarny (exit 1 inaczej).
 * Wynik koncowy: linia "RESULT {json}" (do porownania PRZED/PO).
 */
const path = require('path');
const fs = require('fs');
const GRA = process.env.GRA_ROOT ? path.resolve(process.env.GRA_ROOT) : path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA, 'node_modules', 'esbuild'));
const entry = path.join(GRA, 'tools', '.ai-polar-sim-entry.ts');
const bundle = path.join(GRA, 'tools', '.ai-polar-sim-bundle.cjs');
fs.writeFileSync(entry, `
export { planCityFounding } from '../src/game/ai';
export { MIN_CITY_DISTANCE } from '../src/game/cities';
export { buildClusterStartPlan } from '../src/game/cluster-start';
export { canFoundCity } from '../src/game/cities';
export { isInTerritory } from '../src/map/territory';
export { loadGameData } from '../src/data/loader';
export { generateMap } from '../src/map/generator';
export { setRiverGenPhaseOverride, setRiverGenEnabledOverride } from '../src/map/riverGenSwitch';
export { hexDistance } from '../src/units/setup';
`, 'utf8');
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' }, outfile: bundle, absWorkingDir: GRA, logLevel: 'silent' });
const M = require(bundle);
M.setRiverGenPhaseOverride('main');
if (process.env.RIVERS !== '1') M.setRiverGenEnabledOverride(false);

const MEASURE = process.argv.includes('--measure');
const SEEDS = (process.env.SEEDS || '4242,7777,1001,2024,31337').split(',').map(Number);
const TYPES = (process.env.TYPES || 'kontynenty,pangea,wyspy').split(',');
const TURNS = Number(process.env.TURNS || 15);
const W = Number(process.env.W || 168);
const H = Number(process.env.H || 120);
const data0 = M.loadGameData();
// UWAGA (obserwacja poza zakresem): hexCityScore (ai.ts) szuka wiersza plonow po `t.Teren === hex.terenBazowy`, a w
// data/terrain-yields.json nazwy to 'Łąka'/'Równina'/... (z diakrytykami) vs id 'laka'/'rownina'/... — dopasowanie
// zawodzi, wiec w realnych danych kazdy teren ma plon 0 i planCityFounding (minScore 3) prawie nigdy nie zwraca
// kandydata. Zeby wywolac sciezke kolonizacji (PRZED i PO identycznie), sim normalizuje nazwy po stronie testu.
const FOLD = { 'Łąka': 'laka', 'Równina': 'rownina', 'Wzgórza': 'wzgorza', 'Góry': 'gory', 'Pustynia': 'pustynia', 'Polarny': 'polarny', 'Morze': 'morze', 'Wybrzeże': 'plytkie_morze' };
const data = { ...data0, terrainYields: { ...data0.terrainYields,
  terrain_types: data0.terrainYields.terrain_types.map(r => ({ ...r, Teren: FOLD[r.Teren] || r.Teren })) } };

function polarDist(map, q, r, maxR) {
  let best = Infinity;
  for (let dq = -maxR; dq <= maxR; dq++) for (let dr = -maxR; dr <= maxR; dr++) {
    if (M.hexDistance(q, r, q + dq, r + dr) > maxR) continue;
    const h = map.hexes[`${q + dq},${r + dr}`];
    if (h && h.terenBazowy === 'polarny') best = Math.min(best, M.hexDistance(q, r, q + dq, r + dr));
  }
  return best;
}

const total = { runs: 0, aiCities: 0, onPolar: 0, r1: 0, r2: 0, aiStart: 0, founded: 0, foundedOnPolar: 0, foundedR1: 0, foundedR1WithAlt: 0 };
for (const typ of TYPES) for (const seed of SEEDS) {
  const map = M.generateMap(W, H, seed, typ);
  const plan = M.buildClusterStartPlan({ map, civs: data.civs, seed, playerCivId: 'grecy', rywaleNaKlaster: 6,
    aktywneTypy: 8, startEpochId: 'kamien', cityNamesPools: data.cityNamesPools });
  let idx = 0;
  const cities = [];
  const mk = (q, r, ownerId, pop) => ({ id: 'c' + (idx++), ownerId, q, r, population: pop });
  cities.push(mk(plan.playerStartHex.q, plan.playerStartHex.r, 0, 8));
  for (const sc of plan.spawnCities) cities.push(mk(sc.q, sc.r, sc.ownerId, 8));
  const aiOwners = [...new Set(cities.map(c => c.ownerId))].filter(o => o !== 0);
  const startCount = cities.length;
  let foundedHere = 0, foundedPolar = 0, foundedR1 = 0, foundedR1WithAlt = 0;
  const t0 = Date.now();
  // Picker-sim: planCityFounding (ten sam kod co decideAITurn dla kolonizacji) w petli: kazda AI zaklada
  // kolejne miasta, az planCityFounding zwroci null albo wyczerpie sie TURNS iteracji (1 miasto/tura/AI).
  for (let turn = 1; turn <= TURNS; turn++) {
    let any = false;
    for (const ownerId of aiOwners) {
      if (!cities.some(c => c.ownerId === ownerId)) continue;
      const cmd = M.planCityFounding(ownerId, cities, map, data, {
        currentTurn: 200 + turn, civEra: 1, civAiProfile: { ekspansywnosc: 2, sklonnoscDoPodboju: 2 },
        pracaAvailable: 250, poziomTrudnosci: 2,
      }, M.MIN_CITY_DISTANCE);
      if (cmd === null || cmd.type !== 'foundCityAt') continue;
      const nodes = cities.filter(c => c.ownerId === ownerId).map(c => ({ q: c.q, r: c.r, pop: c.population, level: 1 }));
      const res = M.canFoundCity(cmd.q, cmd.r, cities, map, {
        withinTerritory: nodes.length ? (fq, fr) => M.isInTerritory(fq, fr, nodes) : undefined,
        ownerId, ownerEra: 1, gameConfig: { cityLimitBase: 10 },
      });
      if (!res.ok) continue;
      const pd = polarDist(map, cmd.q, cmd.r, 2);
      if (pd <= 1) {
        // Dowod dostepnosci alternatywy: czy ISTNIAL legalny (canFoundCity) lad poza polarnym i poza promieniem 1.
        let alt = false;
        for (const key of Object.keys(map.hexes)) {
          const hx = map.hexes[key];
          const tb = hx.terenBazowy;
          if (tb === 'morze' || tb === 'plytkie_morze' || tb === 'gory' || tb === 'polarny') continue;
          if (polarDist(map, hx.coords.q, hx.coords.r, 1) <= 1) continue;
          const ok = M.canFoundCity(hx.coords.q, hx.coords.r, cities, map, {
            withinTerritory: nodes.length ? (fq, fr) => M.isInTerritory(fq, fr, nodes) : undefined,
            ownerId, ownerEra: 1, gameConfig: { cityLimitBase: 10 },
          });
          if (ok.ok) { alt = true; break; }
        }
        if (alt) foundedR1WithAlt++;
      }
      cities.push(mk(cmd.q, cmd.r, ownerId, 8));
      any = true;
      foundedHere++;
      if (pd === 0) foundedPolar++;
      if (pd <= 1) foundedR1++;
    }
    if (!any) break;
  }
  let onP = 0, r1 = 0, r2 = 0;
  const ai = cities.filter(c => c.ownerId !== 0);
  for (const c of ai) {
    const d = polarDist(map, c.q, c.r, 2);
    if (d === 0) onP++;
    if (d <= 1) r1++;
    if (d <= 2) r2++;
  }
  console.log(`[${typ} ${seed}] startAI=${startCount - 1} founded=${foundedHere} aiCitiesT${TURNS}=${ai.length} onPolar=${onP} r<=1=${r1} r<=2=${r2} foundedOnPolar=${foundedPolar} foundedR<=1=${foundedR1} foundedR<=1_zLegalnaAlternatywa=${foundedR1WithAlt} (${Math.round((Date.now() - t0) / 1000)}s)`);
  total.runs++; total.aiCities += ai.length; total.onPolar += onP; total.r1 += r1; total.r2 += r2;
  total.aiStart += startCount - 1; total.founded += foundedHere; total.foundedOnPolar += foundedPolar; total.foundedR1 += foundedR1; total.foundedR1WithAlt += foundedR1WithAlt;
}
console.log('RESULT ' + JSON.stringify(total));
try { fs.unlinkSync(entry); fs.unlinkSync(bundle); } catch (e) { /* ignore */ }
if (!MEASURE && total.onPolar > 0) { console.error('FAIL: miasta AI/MP na heksie polarnym: ' + total.onPolar); process.exit(1); }
