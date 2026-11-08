'use strict';
/**
 * R-WEB-AUTOIMPROVE-PASTURE-IRRIGATION-NOT-BUILT-Q2 (Operator R2) — harness BISECTU na wyniku przeplywu wieloturowego.
 * Produkcyjny `pickAutoImprovements` z danymi jak w main.ts (workedHexCoordsForCity + lostToSibling, % 33, rezerwa 30, demandDriven,
 * foodImprovementStages), ale z ROSNACA populacja (obywatele przybywaja co 2 tury => kandydaci na farmy pojawiaja sie CO TURE),
 * czyli warunki duzej, rozwijajacej sie cywilizacji (wlasciciel: 26 miast, 128 obywateli).
 *
 * Kryterium (wynik realnego przeplywu): po wyczerpaniu farm na polach obywateli startuje trzoda, potem irygacja.
 * Mierzone w FAZIE WZROSTU (tury 1..GROW) i po niej (do TURNS):
 *   starved = liczba tur fazy wzrostu, w ktorych istnieje pole obywatela z farma bez trzody (przy rzece, Laka/Rownina), a automat
 *             NIE postawil zadnej trzody ani irygacji (pula >> koszt);
 *   firstPastureTurn / firstIrrigTurn = pierwsza tura z trzoda / irygacja;
 *   gapGrow = (farmy bez trzody) w turze GROW; gapEnd = po TURNS.
 * Wypisuje JEDNA linie JSON. Uzycie (z gra/):  PI_SRC_DIR=<gra/src innego commita> node tools/autoimprove-pasture-irrigation-q2-bisect.cjs
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.PI_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const NODE_PATHS = [path.resolve(GRA_ROOT, 'node_modules')];
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'pi-q2b-'));
const entry = path.join(temp, 'entry.ts');
const bundle = path.join(temp, 'bundle.cjs');
fs.writeFileSync(entry, `
import { pickAutoImprovements as pick } from ${JSON.stringify(SRC + '/game/auto-improvements')};
import * as TE from ${JSON.stringify(SRC + '/game/turn-economy')};
import * as OK from ${JSON.stringify(SRC + '/game/okolica')};
import * as GEN from ${JSON.stringify(SRC + '/map/generator')};
import * as IB from ${JSON.stringify(SRC + '/map/improvement-build')};
export const pickAutoImprovements = pick;
export const workedHexCoordsForCity = (TE as any).workedHexCoordsForCity;
export const computeLostToNearerSiblingByCity = (OK as any).computeLostToNearerSiblingByCity;
export const generateMap = (GEN as any).generateMap;
export const isHexNearRiver = (IB as any).isHexNearRiver;
`);
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: bundle,
  loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: GRA_ROOT, logLevel: 'error', nodePaths: NODE_PATHS,
});
const { pickAutoImprovements, workedHexCoordsForCity, computeLostToNearerSiblingByCity, generateMap, isHexNearRiver: isHexNearRiverProd } = require(bundle);

const K = (q, r) => `${q},${r}`;
const ERA = 2, PID = 0;
const NC = Number(process.env.NC || 10), GROW = Number(process.env.GROW || 24), TURNS = Number(process.env.TURNS || 44);
const POP0 = 3, POPMAX = 16, POOL0 = 3000, REFILL = 120;
const ZERO_CITY = process.env.ZERO_CITY || '';
const LOW_PCT = process.env.LOW_PCT != null ? Number(process.env.LOW_PCT) : 0; // % puli miasta ZERO_CITY (domyslnie 0)
const TECHS = new Set([
  'Łowiectwo', 'Rolnictwo', 'Oswojenie zwierząt', 'Obróbka drewna', 'Garncarstwo', 'Murarstwo', 'Brązownictwo', 'Hutnictwo żelaza',
  'Jeździectwo', 'Koło', 'Waluta', 'Wojskowość', 'Żegluga', 'Gospodarka wodna', 'Irygacja', 'Drogi brukowane', 'Matematyka',
]);
const SEA = ['morze', 'plytkie_morze', 'wybrzeze'];
const FLAT = new Set(['laka', 'rownina']);
const SEED = Number(process.env.SEED || 1);

const map = generateMap(48, 36, SEED, 'kontynenty');
const riverSet = new Set();
for (const p of map.riverPaths || []) for (const h of p) riverSet.add(K(h.q, h.r));
const NB = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
// Starsze commity nie maja `isHexNearRiver` (UNIFY-MAP d7b8b7548) — wtedy: heks na rzece albo sasiad rzeki wg riverPaths.
const isHexNearRiver = (m, q, r) => (typeof isHexNearRiverProd === 'function' ? isHexNearRiverProd(m, q, r)
  : riverSet.has(K(q, r)) || NB.some(([dq, dr]) => riverSet.has(K(q + dq, r + dr))));
const cand = Object.keys(map.hexes).sort().filter(k => riverSet.has(k) && !SEA.includes(map.hexes[k].terenBazowy)).map(k => k.split(',').map(Number));
const cities = [];
for (const [q, r] of cand) {
  if (cities.every(c => Math.abs(c.q - q) + Math.abs(c.r - r) > 7)) cities.push({ id: `c${String(cities.length).padStart(2, '0')}`, ownerId: PID, q, r, name: 'C', population: POP0 });
  if (cities.length >= NC) break;
}
const tn = cities.map(c => ({ q: c.q, r: c.r, ownerId: PID, cityId: c.id, pop: c.population, level: 1 }));
const placed = new Map();
let pool = POOL0;
const workedAt = () => {
  const lost = typeof computeLostToNearerSiblingByCity === 'function' ? computeLostToNearerSiblingByCity(cities, map) : new Map();
  return new Map(cities.map(c => [c.id, new Set([K(c.q, c.r), ...workedHexCoordsForCity(c, map, tn, lost.get(c.id), ERA).map(h => K(h.q, h.r))])]));
};
const gaps = () => {
  const w = workedAt(); let farmNoPast = 0, farmNoIrr = 0, farms = 0;
  for (const c of cities) for (const hk of w.get(c.id)) {
    if (hk === K(c.q, c.r)) continue;
    const [q, r] = hk.split(',').map(Number); const h = map.hexes[hk];
    if (!h || SEA.includes(h.terenBazowy) || !FLAT.has(h.terenBazowy)) continue;
    const L = placed.get(hk) ?? [];
    if (!L.includes('farma')) continue;
    farms++;
    if (!L.includes('bydlo')) farmNoPast++;
    if (isHexNearRiver(map, q, r) && !L.includes('irygacja')) farmNoIrr++;
  }
  return { farms, farmNoPast, farmNoIrr };
};
let starved = 0, firstPast = null, firstIrr = null, gapGrow = null, orderViol = 0;
const per = [];
for (let t = 1; t <= TURNS; t++) {
  if (t <= GROW) for (let i = 0; i < cities.length; i++) { if ((t + i) % 2 === 0 && cities[i].population < POPMAX) { cities[i].population++; tn[i].pop = cities[i].population; } }
  pool += REFILL;
  const wbc = workedAt();
  const gBefore = gaps();
  const forestAtStart = new Set(Object.keys(map.hexes).filter(k => map.hexes[k].nakladka === 'las')); // wycinka trwa kilka tur: heks pod wyrab nie jest jeszcze kandydatem na farme
  const picks = pickAutoImprovements({
    cities, ownerId: PID, map, territoryNodes: tn, placedImprovements: new Map(placed), pracaAvailable: pool, unlockedTechs: TECHS,
    pracaSurplusThreshold: 30, demandDriven: true, resourceDeficitKeys: [], civArchetype: 'grecy', playerEra: ERA, cityLimitExhausted: false,
    getFocus: () => 'zrownowazone', pracaBudgetPercent: 33,
    getPracaBudgetPercent: c => (ZERO_CITY && c.id === ZERO_CITY ? LOW_PCT : 33),
    getWorkedHexKeys: c => wbc.get(c.id) ?? new Set(),
    foodImprovementStages: () => true, clearingHexKeys: new Set(),
  });
  if (process.env.DEBUG_E1 && t === 1) {
    const base = {
      cities, ownerId: PID, map, territoryNodes: tn, placedImprovements: new Map(placed), pracaAvailable: 1e9, improvementBudgetCap: 1e9, unlockedTechs: TECHS,
      pracaSurplusThreshold: 0, demandDriven: true, resourceDeficitKeys: [], civArchetype: 'grecy', playerEra: ERA, cityLimitExhausted: false,
      getFocus: () => 'zrownowazone', pracaBudgetPercent: 100, getWorkedHexKeys: c => wbc.get(c.id) ?? new Set(), foodImprovementStages: false, clearingHexKeys: new Set(),
    };
    const e1 = pickAutoImprovements({ ...base, priorityOverride: ['farma'], riverHexesOnly: true, irrigationNeedsFarm: true });
    console.error('E1 unlimited picks', e1.length, e1.filter(p => p.cityId === 'c01').map(p => p.q + ',' + p.r + ':' + p.key).join(' '));
    const full = picks.filter(p => p.cityId === 'c01').map(p => p.q + ',' + p.r + ':' + p.key).join(' ');
    console.error('real c01 picks', full);
  }
  let spent = 0, nPast = 0, nIrr = 0, nFarm = 0;
  for (const p of picks) {
    spent += p.kosztPraca;
    const hk = K(p.q, p.r);
    if (p.key === 'bydlo' || p.key === 'owce' || p.key === 'lama') nPast++;
    if (p.key === 'irygacja') nIrr++;
    if (p.key === 'farma') nFarm++;
    if (p.key === 'wyrab') { map.hexes[hk].nakladka = 'brak'; continue; }
    const layers = [...(placed.get(hk) ?? []), p.key];
    placed.set(hk, layers); map.hexes[hk].ulepszenia = [...layers];
  }
  pool -= spent;
  // Niezmiennik kolejnosci (wiazaca specyfikacja): trzoda/irygacja tylko gdy etap wyzej jest WYCZERPANY po pickach tej tury:
  // trzoda => kazdy obrabiany, czysty (bez lasu) heks Laka/Rownina przy rzece ma farme; irygacja => dodatkowo kazda farma przy rzece ma trzode.
  if (nPast > 0 || nIrr > 0) {
    const w2 = wbc; // ten sam zbior pol obywateli, z ktorego korzystal picker w tej turze (po budowie obywatele moga sie przesunac)
    let viol = 0;
    for (const c of cities) {
      if (ZERO_CITY && c.id === ZERO_CITY) continue;
      for (const hk of w2.get(c.id)) {
        if (hk === K(c.q, c.r)) continue;
        const [q, r] = hk.split(',').map(Number); const h = map.hexes[hk];
        if (!h || !FLAT.has(h.terenBazowy) || forestAtStart.has(hk) || !isHexNearRiver(map, q, r)) continue;
        const L = placed.get(hk) ?? [];
        if (!L.includes('farma') && L.length === 0) { viol++; if (process.env.DEBUG_VIOL && viol <= 2) console.error('VIOL t' + t + ' ' + c.id + ' ' + hk + ' ' + h.terenBazowy + ' nak=' + h.nakladka + ' L=' + JSON.stringify(L) + ' pool=' + Math.round(pool) + ' nPast=' + nPast + ' nIrr=' + nIrr); }
        if (nIrr > 0 && L.includes('farma') && !L.includes('bydlo')) viol++;
      }
    }
    if (viol > 0) orderViol++;
  }
  if (nPast > 0 && firstPast == null) firstPast = t;
  if (nIrr > 0 && firstIrr == null) firstIrr = t;
  if (t <= GROW && gBefore.farmNoPast > 0 && nPast === 0 && nIrr === 0 && pool > 500) starved++;
  if (t === GROW) gapGrow = gaps();
  per.push(`${t}:f${nFarm}p${nPast}i${nIrr}`);
}
const end = gaps();
if (process.env.DEBUG_HEX) for (const hk of process.env.DEBUG_HEX.split(';')) console.error('HEX', hk, JSON.stringify(placed.get(hk) ?? null), JSON.stringify({ ...map.hexes[hk], ulepszenia: undefined }).slice(0, 500));
console.log(JSON.stringify({ orderViol, src: SRC.replace(/.*\/(wt-[^/]+|[^/]+)\/gra\/src$/, '$1'), cities: cities.length, starved, firstPast, firstIrr, gapGrow, end, pool: Math.round(pool), perTurn: process.env.VERBOSE ? per.join(' ') : undefined }));
fs.rmSync(temp, { recursive: true, force: true });
