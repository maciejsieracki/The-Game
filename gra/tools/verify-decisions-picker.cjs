'use strict';
/**
 * verify-decisions-picker.cjs — R-WEB-DECISIONS-VERIFY-Q1 (pomiar, ZERO zmian w gra/src, gra/data).
 * Niezalezny pomiar decyzji wlasciciela 2026-10-31 na REALNYM `pickAutoImprovements` + `decideAITurn`
 * (esbuild bundle z gra/src, symulacja tura po turze). Wypisuje liczby i werdykt per pomiar (M1..M14).
 * Uzycie (z gra/):  node tools/verify-decisions-picker.cjs
 * Kontekst: K1 = gracz „Zywnosc”, K2 = gracz „zrownowazone”, K3 = AI cywilizacji.
 * Fixtury celowo niezalezne od autoimprove-stages-q1-test.cjs (wlasna mapa, wlasne scenariusze).
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = path.resolve(GRA_ROOT, 'src');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-dec-'));
const entry = path.join(temp, 'entry.ts');
const bundle = path.join(temp, 'bundle.cjs');
fs.writeFileSync(entry,
  `export { pickAutoImprovements, ULEPSZENIA_FOCUS_ZYWNOSC, IMPROVEMENT_FOR_DEFICIT, FOOD_STAGE_MAX_ITEMS_PER_CITY, JEDEN_NA_ILU_OBYWATELI } from ${JSON.stringify(SRC + '/game/auto-improvements')};\n`
  + `export { decideAITurn } from ${JSON.stringify(SRC + '/game/ai')};\n`);
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: bundle, loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: GRA_ROOT, logLevel: 'error',
  nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
});
const M = require(bundle);

const FULL = [
  'Rolnictwo', 'Oswojenie zwierząt', 'Gospodarka wodna', 'Irygacja', 'Łowiectwo', 'Obróbka drewna',
  'Garncarstwo', 'Murarstwo', 'Górnictwo', 'Brązownictwo', 'Hutnictwo żelaza', 'Jeździectwo', 'Koło',
  'Waluta', 'Wojskowość', 'Żegluga', 'Drogi brukowane', 'Matematyka', 'Obróbka kamienia', 'Kamieniarstwo',
];
const W = 40, H = 40, CQ = 20, CR = 20;
const K = (q, r) => `${q},${r}`;
function makeMap({ river = [], forest = [], hills = [] } = {}) {
  const hexes = {};
  for (let q = 0; q < W; q++) for (let r = 0; r < H; r++) {
    hexes[K(q, r)] = {
      coords: { q, r }, terenBazowy: 'rownina', nakladka: 'brak', ulepszenie: 'brak', wlasciciel: null,
      wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {}, rzeka: { obecna: false, krawedzie: [] },
    };
  }
  for (const [q, r] of river) hexes[K(q, r)].rzeka = { obecna: true, krawedzie: [] };
  for (const [q, r] of forest) hexes[K(q, r)].nakladka = 'las';
  for (const [q, r] of hills) hexes[K(q, r)].terenBazowy = 'wzgorza';
  return { szerokoscQ: W, wysokoscR: H, hexes, seed: 7, riverPaths: river.length ? [river.map(([q, r]) => ({ q, r }))] : [] };
}
function ring(cq, cr, rad) {
  const out = [];
  for (let dq = -rad; dq <= rad; dq++) for (let dr = -rad; dr <= rad; dr++) {
    const ds = -dq - dr;
    if (Math.max(Math.abs(dq), Math.abs(dr), Math.abs(ds)) <= rad && !(dq === 0 && dr === 0)) out.push([cq + dq, cr + dr]);
  }
  return out;
}
const FOCUS_OF = { K1: 'zywnosc', K2: 'zrownowazone', K3: 'zrownowazone' };
function sim({ map, worked, profil = 'K2', pop = 12, turns = 40, deficitFn = () => [], pool0 = 6000, income = 80,
  techs = FULL, maxItems, wolnoWycinac = true, onlyWorked = true }) {
  const city = { id: 'c0', ownerId: 0, q: CQ, r: CR, name: 'A', population: pop };
  const tn = [{ q: CQ, r: CR, ownerId: 0, cityId: 'c0', pop, level: 1 }];
  const placed = new Map();
  const wk = new Set(worked.map(([q, r]) => K(q, r)));
  let pool = pool0;
  const log = [];
  for (let t = 0; t < turns; t++) {
    const deficit = deficitFn(t, placed, map);
    let picks;
    if (profil === 'K3') {
      const cmds = M.decideAITurn(0, [], [{ ...city, okolicaTryb: 'reczny', okolicaReczne: Object.fromEntries([...wk].map(k => [k, 1])) }], map,
        { units: [], buildings: [], aiParams: {}, terrainYields: { terrain_types: [] } }, {
          civType: 'grecy', poziomTrudnosci: 2, defensiveCopy: false, cityBuildings: {}, territoryNodes: tn,
          placedImprovements: placed, improvementTechs: new Set(techs), pracaAvailable: pool, civEra: 3,
          resourceDeficitKeys: deficit, improvementBudgetCap: pool,
        }).filter(c => c.type === 'buildImprovement');
      picks = cmds.map(c => ({ q: c.q, r: c.r, key: c.key, kosztPraca: c.key === 'wyrab' ? 2.5 : c.key === 'irygacja' ? 60 : 20 }));
    } else {
      picks = M.pickAutoImprovements({
        cities: [{ ...city, ulepszeniaFocus: FOCUS_OF[profil] }], ownerId: 0, map, territoryNodes: tn,
        placedImprovements: placed, pracaAvailable: pool, unlockedTechs: new Set(techs), pracaSurplusThreshold: 30,
        skipWyrab: !wolnoWycinac, demandDriven: true, resourceDeficitKeys: deficit, getFocus: () => FOCUS_OF[profil],
        getOnlyWorked: () => onlyWorked, getWorkedHexKeys: () => wk, pracaBudgetPercent: 100, civArchetype: 'grecy', playerEra: 3,
        foodImprovementStages: () => true, ...(maxItems ? { maxItemsPerCity: maxItems } : {}),
      });
    }
    for (const p of picks) {
      const hk = K(p.q, p.r);
      log.push({ t, key: p.key, hk });
      pool -= p.kosztPraca;
      if (p.key === 'wyrab') { map.hexes[hk].nakladka = 'brak'; continue; }
      placed.set(hk, [...(placed.get(hk) ?? []), p.key]);
    }
    pool += income;
  }
  return { log, placed };
}
const count = (log, key) => log.filter(e => e.key === key).length;
const keysOf = log => [...new Set(log.map(e => e.key))].sort().join(',');
const results = [];
function verdict(id, decyzja, ok, expected, measured) {
  results.push({ id, decyzja, ok });
  console.log(`[${ok === null ? 'NIE_ZMIERZONO' : ok ? 'ZGODNE' : 'NIEZGODNE'}] ${id} | ${decyzja}\n    oczekiwane: ${expected}\n    zmierzone : ${measured}`);
}

// ---- M1: centrum miasta zwykłym heksem (decyzja 12 / korekta F), K1/K2/K3 ----
for (const p of ['K1', 'K2', 'K3']) {
  const map = makeMap();
  const { log } = sim({ map, worked: [], profil: p, turns: 6 }); // brak obywateli poza centrum
  const atCenter = log.filter(e => e.hk === K(CQ, CR));
  verdict(`M1-${p}`, `centrum miasta jest zwykłym heksem (farma na centrum bez innych heksów pracowanych) [${p}]`,
    atCenter.some(e => e.key === 'farma'), 'farma@centrum w pierwszych turach', `picks@centrum=${JSON.stringify(atCenter.map(e => e.key))}, wszystkie=${JSON.stringify(log.map(e => e.key + '@' + e.hk))}`);
}

// ---- M2: tartak tylko przy niedoborze drewna (decyzja 8) — las wokół miasta z obywatelami, K2/K3 ----
const FOREST = ring(CQ, CR, 3).filter(([q, r]) => (q + r) % 2 === 0);
const WORKED_FOREST = [...FOREST];
for (const p of ['K2', 'K3']) {
  const { log } = sim({ map: makeMap({ forest: FOREST }), worked: WORKED_FOREST, profil: p, turns: 40 });
  verdict(`M2-${p}`, `bez niedoboru tartak i obóz NIE powstają [${p}]`, count(log, 'tartak') === 0 && count(log, 'oboz_lowiecki') === 0,
    'tartak=0, oboz=0', `tartak=${count(log, 'tartak')} oboz=${count(log, 'oboz_lowiecki')} wyrab=${count(log, 'wyrab')} farma=${count(log, 'farma')}`);
}

// ---- M3: niedobór drewna: tartak na lasach (bez rzeki) — LIMIT liczby (R5: stary limit 1/10 obywateli), K2/K3 ----
for (const pop of [12, 30]) {
  for (const p of ['K2', 'K3']) {
    const { log } = sim({ map: makeMap({ forest: FOREST }), worked: WORKED_FOREST, profil: p, pop, turns: 40, deficitFn: () => ['drewno'] });
    const lim = Math.max(1, Math.ceil(pop / 10));
    const n = count(log, 'tartak');
    verdict(`M3-${p}-pop${pop}`, `niedobór drewna: brak LIMITU liczby tartaków (właściciel R5: „żadnego limitu”) [${p}]`,
      n > lim, `tartaków > ceil(pop/10)=${lim} (jest ${FOREST.length} lasów z obywatelami)`, `tartak=${n}, oboz=${count(log, 'oboz_lowiecki')}, wyrab=${count(log, 'wyrab')} (limit stary 1/10 NADAL aktywny jeśli tartak==${lim}) | R5 W TOKU`);
  }
}

// ---- M4: tartak na heksie rzeka+las przy niedoborze drewna (R5 nowa reguła: NIE) ----
{
  const RIV = [[CQ, CR - 2], [CQ, CR - 3], [CQ + 1, CR - 3]];
  for (const p of ['K2', 'K3']) {
    const map = makeMap({ river: RIV, forest: RIV });
    const { log } = sim({ map, worked: [...RIV], profil: p, turns: 30, deficitFn: () => ['drewno'], techs: FULL.filter(t => true), wolnoWycinac: false });
    const onRiver = log.filter(e => e.key === 'tartak' && RIV.some(([q, r]) => K(q, r) === e.hk)).length;
    verdict(`M4-${p}`, `tartak NIE na heksie rzeka+las przy niedoborze drewna (R5, wycinka wyłączona) [${p}]`, onRiver === 0,
      'tartak@rzeka+las = 0', `tartak@rzeka+las=${onRiver}, wszystkie=${JSON.stringify(log.map(e => e.key + '@' + e.hk))} | R5 W TOKU`);
  }
}

// ---- M5: niedobór otwiera TYLKO ulepszenia brakującego surowca (decyzja 11) + drogi na końcu (13) ----
{
  const ALL = ring(CQ, CR, 4);
  for (const p of ['K2', 'K3']) {
    const map = makeMap({ forest: FOREST });
    const { log } = sim({ map, worked: ALL, profil: p, pop: 60, turns: 60, deficitFn: () => ['drewno', 'zloto'] });
    const bad = log.filter(e => ['fort', 'posterunek'].includes(e.key));
    const roads = log.filter(e => e.key === 'droga' || e.key === 'droga_brukowana');
    const lastNonRoad = Math.max(-1, ...log.filter(e => !['droga', 'droga_brukowana'].includes(e.key)).map(e => e.t));
    const firstRoad = roads.length ? Math.min(...roads.map(e => e.t)) : -1;
    verdict(`M5-${p}`, `niedobór (drewno+złoto) NIE otwiera fort/posterunek; drogi dopiero po wszystkim innym [${p}]`,
      bad.length === 0 && (roads.length === 0 || firstRoad >= lastNonRoad),
      'fort=posterunek=0; pierwsza droga >= ostatni nie-droga', `fort/posterunek=${bad.length}, drogi=${roads.length}, firstRoadTurn=${firstRoad}, lastNonRoadTurn=${lastNonRoad}, klucze=${keysOf(log)}`);
  }
}

// ---- M6: brak niedoboru, żywność wyczerpana → drogi na samym końcu (13) ----
{
  const ALL = ring(CQ, CR, 4);
  for (const p of ['K2', 'K3']) {
    const { log } = sim({ map: makeMap(), worked: ALL, profil: p, pop: 60, turns: 80 });
    const roads = log.filter(e => e.key === 'droga' || e.key === 'droga_brukowana');
    const lastFood = Math.max(-1, ...log.filter(e => !['droga', 'droga_brukowana'].includes(e.key)).map(e => e.t));
    const firstRoad = roads.length ? Math.min(...roads.map(e => e.t)) : -1;
    verdict(`M6-${p}`, `drogi dopiero po wyczerpaniu żywności, bez niedoboru [${p}]`, roads.length > 0 && firstRoad >= lastFood,
      'drogi > 0 i firstRoad >= lastFood', `drogi=${roads.length}, firstRoad=${firstRoad}, lastFood=${lastFood}, klucze=${keysOf(log)}`);
  }
}

// ---- M7: K1 bez tartaku/obozu nawet z lasem i z niedoborem (decyzja 6) ----
{
  const { log } = sim({ map: makeMap({ forest: FOREST }), worked: WORKED_FOREST, profil: 'K1', turns: 50, deficitFn: () => ['drewno', 'glina'] });
  verdict('M7-K1', 'profil „Żywność”: bez tartaku/obozu/gliniany mimo niedoboru', ['tartak', 'oboz_lowiecki', 'glinianka', 'droga', 'fort', 'posterunek'].every(k => count(log, k) === 0),
    'tartak=oboz=glinianka=droga=fort=posterunek=0', `klucze=${keysOf(log)}`);
}

// ---- M8: wycinka tylko pod farmy: wycinka bez niedoboru poza heksami farmowymi? (K2 bez niedoboru, las na wzgórzach) ----
{
  const HILLS = FOREST.slice();
  const map = makeMap({ forest: FOREST, hills: HILLS });
  const { log } = sim({ map, worked: WORKED_FOREST, profil: 'K2', turns: 40 });
  const w = log.filter(e => e.key === 'wyrab');
  const farmOnCleared = w.filter(e => log.some(x => x.key === 'farma' && x.hk === e.hk)).length;
  verdict('M8-K2', 'wycinka tylko pod farmy: każdy wyrąb ma później farmę na tym heksie (las na wzgórzach, K2 bez niedoboru)',
    w.length === farmOnCleared, 'wyrab==farma@wyciety', `wyrab=${w.length}, z_farma_po=${farmOnCleared}`);
}

// ---- M9: hodowla nie na lesie (bydlo/owce), lama na lesie dozwolona (decyzja 4) — kwalifikator ----
// (zob. gra/src/map/improvement-build.ts — test hodowla-las-test.cjs 113/0; tu pomiar pickera: bydlo przy rzece z lasem)
{
  const RIV = [[CQ, CR - 2], [CQ, CR - 3]];
  const map = makeMap({ river: RIV, forest: RIV });
  const { log } = sim({ map, worked: [...RIV], profil: 'K2', turns: 15 });
  const hodNaLesie = log.filter(e => ['bydlo', 'owce'].includes(e.key) && map.hexes[e.hk].nakladka === 'las').length;
  const seq = log.filter(e => RIV.some(([q, r]) => K(q, r) === e.hk)).map(e => `${e.t}:${e.key}@${e.hk}`).join(' ');
  verdict('M9-K2', 'trzoda/owce nie na lesie; najpierw wycinka (rzeka+las) potem farma/trzoda', hodNaLesie === 0 && log.some(e => e.key === 'wyrab'),
    'hodowla@las=0, wyrab>0', `hodowla@las=${hodNaLesie}, seq=${seq}`);
}

// ---- M10: AI bez limitu 1 budowa/miasto (decyzja 10) — liczba rozkazów AI w jednej turze ----
{
  const map = makeMap();
  const ALL = ring(CQ, CR, 4);
  const city = { id: 'c0', ownerId: 0, q: CQ, r: CR, name: 'A', population: 12, okolicaTryb: 'reczny', okolicaReczne: Object.fromEntries(ALL.map(([q, r]) => [K(q, r), 1])) };
  const cmds = M.decideAITurn(0, [], [city], map, { units: [], buildings: [], aiParams: {}, terrainYields: { terrain_types: [] } }, {
    civType: 'grecy', poziomTrudnosci: 2, defensiveCopy: false, cityBuildings: {}, territoryNodes: [{ q: CQ, r: CR, ownerId: 0, cityId: 'c0', pop: 12, level: 1 }],
    placedImprovements: new Map(), improvementTechs: new Set(FULL), pracaAvailable: 6000, civEra: 3, resourceDeficitKeys: [], improvementBudgetCap: 6000,
  }).filter(c => c.type === 'buildImprovement');
  verdict('M10-K3', 'AI: więcej niż 1 ulepszenie/miasto/turę (brak limitu maxItemsPerCity:1; etap ograniczony do FOOD_STAGE_MAX_ITEMS_PER_CITY=3)',
    cmds.length > 1, '>1 rozkaz w turze 1', `rozkazów=${cmds.length}: ${cmds.map(c => c.key + '@' + c.q + ',' + c.r).join(' ')}`);
}

// ---- M12: trzoda i irygacja poza limitem % puli Pracy (decyzja 5) — pct=10, pula 400, bez przychodu ----
{
  const RIV = [[CQ, CR - 2], [CQ, CR - 3], [CQ + 1, CR - 3]];
  const map = makeMap({ river: RIV });
  const ALL = [...RIV, ...ring(CQ, CR, 2)];
  const city = { id: 'c0', ownerId: 0, q: CQ, r: CR, name: 'A', population: 12, ulepszeniaFocus: 'zrownowazone' };
  const tn = [{ q: CQ, r: CR, ownerId: 0, cityId: 'c0', pop: 12, level: 1 }];
  const placed = new Map(RIV.map(([q, r]) => [K(q, r), ['farma']]));
  const picks = M.pickAutoImprovements({
    cities: [city], ownerId: 0, map, territoryNodes: tn, placedImprovements: placed, pracaAvailable: 400,
    unlockedTechs: new Set(FULL), pracaSurplusThreshold: 30, demandDriven: true, resourceDeficitKeys: [],
    getFocus: () => 'zrownowazone', getOnlyWorked: () => true, getWorkedHexKeys: () => new Set(ALL.map(([q, r]) => K(q, r))),
    pracaBudgetPercent: 10, civArchetype: 'grecy', playerEra: 3, foodImprovementStages: () => true,
  });
  verdict('M12-K2', 'trzoda (E3) poza limitem % puli (pct=10% z 400 = 40 < koszt trzody)', picks.some(p => p.key === 'bydlo' || p.key === 'owce' || p.key === 'lama'),
    'bydlo/owce/lama > 0 mimo 10%', `picks=${picks.map(p => p.key + '@' + p.q + ',' + p.r + '(' + p.kosztPraca + ')').join(' ')}`);
  const placed2 = new Map(RIV.map(([q, r]) => [K(q, r), ['farma', 'bydlo']]));
  const picks2 = M.pickAutoImprovements({
    cities: [city], ownerId: 0, map, territoryNodes: tn, placedImprovements: placed2, pracaAvailable: 400,
    unlockedTechs: new Set(FULL), pracaSurplusThreshold: 30, demandDriven: true, resourceDeficitKeys: [],
    getFocus: () => 'zrownowazone', getOnlyWorked: () => true, getWorkedHexKeys: () => new Set(ALL.map(([q, r]) => K(q, r))),
    pracaBudgetPercent: 10, civArchetype: 'grecy', playerEra: 3, foodImprovementStages: () => true,
  });
  verdict('M12b-K2', 'irygacja (E4) poza limitem % puli (10%)', picks2.some(p => p.key === 'irygacja'),
    'irygacja > 0 mimo 10%', `picks=${picks2.map(p => p.key + '@' + p.q + ',' + p.r + '(' + p.kosztPraca + ')').join(' ')}`);
}

// ---- M13: niedobór przestawia priorytet i wraca do żywności (decyzja 7), K2 i K3 ----
for (const p of ['K2', 'K3']) {
  const { log } = sim({ map: makeMap({ forest: FOREST }), worked: WORKED_FOREST, profil: p, pop: 60, turns: 16, deficitFn: t => (t >= 4 && t < 8 ? ['drewno'] : []) });
  const tartakTurns = log.filter(e => e.key === 'tartak').map(e => e.t);
  const nonTartakAfter = log.filter(e => e.t >= 8).map(e => e.key);
  verdict(`M13-${p}`, `niedobór drewna t4-7: tartak tylko w oknie niedoboru (t4..7); po zaspokojeniu zero tartaków (zero histerezy) [${p}]`,
    tartakTurns.length > 0 && tartakTurns.every(t => t >= 4 && t < 8) && !log.some(e => e.t >= 8 && e.key === 'tartak'),
    'tartak@t∈[4,8) i brak tartaku po t>=8', `tartakTurns=${JSON.stringify(tartakTurns)}, picki po t>=8=${JSON.stringify(nonTartakAfter)} (żywność wyczerpana wcześniej => brak nowych celów)`);
}

// ---- M14: parytet K2=K3 (decyzja 7) — ta sama sekwencja per tura (pop 60, wszystkie heksy pracowane) ----
{
  const ALL = ring(CQ, CR, 4);
  const a = sim({ map: makeMap({ forest: FOREST }), worked: ALL, profil: 'K2', pop: 60, turns: 30, deficitFn: t => (t >= 6 && t < 10 ? ['drewno'] : []) }).log;
  const b = sim({ map: makeMap({ forest: FOREST }), worked: ALL, profil: 'K3', pop: 60, turns: 30, deficitFn: t => (t >= 6 && t < 10 ? ['drewno'] : []) }).log;
  const norm = l => l.map(e => `${e.t}:${e.key}@${e.hk}`).sort().join(' ');
  verdict('M14', 'parytet K2=K3: identyczny zbiór (tura:klucz@heks) przy tych samych danych', norm(a) === norm(b), 'równe', `K2 n=${a.length}, K3 n=${b.length}, równe=${norm(a) === norm(b)}`);
}

// ---- M15: wycinka z wyłączonym „wolno wycinać las” — wycinka przy rzece nadal działa (c3 pin) — INFO ----
{
  const RIV = [[CQ, CR - 2], [CQ, CR - 3]];
  const map = makeMap({ river: RIV, forest: [...RIV, [CQ + 2, CR]] });
  const { log } = sim({ map, worked: [...RIV, [CQ + 2, CR]], profil: 'K2', turns: 12, wolnoWycinac: false });
  console.log(`[INFO] M15 wolno_wycinac=OFF: wyrab@rzeka=${log.filter(e => e.key === 'wyrab' && RIV.some(([q, r]) => K(q, r) === e.hk)).length}, wyrab@poza=${log.filter(e => e.key === 'wyrab' && !RIV.some(([q, r]) => K(q, r) === e.hk)).length} (pin testu c3: rzeka tak, poza nie — do potwierdzenia intencji właściciela)`);
}

// ---- M11: FOOD_STAGE_MAX_ITEMS_PER_CITY — limit per etap per miasto per wywołanie (czy to „limit”) ----
console.log(`[INFO] M11 FOOD_STAGE_MAX_ITEMS_PER_CITY=${M.FOOD_STAGE_MAX_ITEMS_PER_CITY}, JEDEN_NA_ILU_OBYWATELI=${M.JEDEN_NA_ILU_OBYWATELI}; IMPROVEMENT_FOR_DEFICIT=${JSON.stringify(M.IMPROVEMENT_FOR_DEFICIT)}`);

const bad = results.filter(r => r.ok === false);
console.log(`\n=== verify-decisions-picker: ${results.filter(r => r.ok).length} ZGODNE, ${bad.length} NIEZGODNE (${bad.map(b => b.id).join(', ') || '-'}) ===`);
fs.rmSync(temp, { recursive: true, force: true });
