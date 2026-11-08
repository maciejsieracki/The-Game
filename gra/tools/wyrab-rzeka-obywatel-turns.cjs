'use strict';
/**
 * wyrab-rzeka-obywatel-turns.cjs — pomiar wielotur (R-WEB-AUTOIMPROVE-PRIORITY-Q1, Objaw A).
 * Run from gra/ AFTER tools/wyrab-rzeka-obywatel-measure.cjs (reuses its bundle).
 * Symuluje N tur: picki są stosowane do stanu (wycinka usuwa Las, pozostałe warstwy dopisywane),
 * i wypisuje, czy heks rzeka+las zostaje wycięty i co na nim stoi.
 */
const path = require('path');
const { pickAutoImprovements } = require(path.resolve(__dirname, '.wyrab-measure-bundle.cjs'));

const ALL = ['Rolnictwo', 'Kamieniarstwo', 'Obróbka drewna', 'Murarstwo', 'Koło', 'Łowiectwo', 'Oswojenie zwierząt', 'Irygacja'];
const RIVER = '13,12';

function makeMap(extraForest) {
  const hexes = {};
  for (let q = 0; q < 24; q++) for (let r = 0; r < 24; r++) {
    hexes[`${q},${r}`] = { coords: { q, r }, terenBazowy: 'rownina', nakladka: 'brak', ulepszenie: 'brak',
      wlasciciel: null, wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {}, rzeka: { obecna: false, krawedzie: [] } };
  }
  hexes[RIVER].nakladka = 'las';
  for (const [q, r] of extraForest) hexes[`${q},${r}`].nakladka = 'las';
  return { szerokoscQ: 24, wysokoscR: 24, hexes, seed: 42, riverPaths: [[{ q: 13, r: 12 }, { q: 13, r: 11 }]] };
}

function simulate(label, extraForest, turns = 12) {
  const map = makeMap(extraForest);
  const placed = new Map();
  const worked = new Set(['12,12', '11,12', '12,11', '12,13', '11,13', RIVER]);
  const city = { id: 'c1', ownerId: 0, q: 12, r: 12, name: 'T', population: 3, ulepszeniaFocus: 'zywnosc' };
  const log = [];
  for (let t = 1; t <= turns; t++) {
    const picks = pickAutoImprovements({
      cities: [city], ownerId: 0, map,
      territoryNodes: [{ q: 12, r: 12, pop: 3, level: 1, ownerId: 0 }],
      placedImprovements: placed, pracaAvailable: 200, pracaBudgetPercent: 100,
      unlockedTechs: new Set(ALL), pracaSurplusThreshold: 0, skipWyrab: false, civArchetype: 'grecy',
      getOnlyWorked: () => true, getWorkedHexKeys: () => worked,
      getFocus: () => 'zrownowazone', demandDriven: true,
    });
    for (const p of picks) {
      const hk = `${p.q},${p.r}`;
      if (p.key === 'wyrab') { map.hexes[hk].nakladka = 'brak'; log.push(`t${t}:wycinka@${hk}`); continue; }
      const layers = placed.get(hk) ?? [];
      placed.set(hk, [...layers, p.key]);
      log.push(`t${t}:${p.key}@${hk}`);
    }
    if (picks.length === 0) log.push(`t${t}:(brak)`);
  }
  const riverLayers = (placed.get(RIVER) ?? []).join('+') || '-';
  const riverForest = map.hexes[RIVER].nakladka === 'las';
  console.log(`\n### ${label}\nrzeka ${RIVER}: las=${riverForest} warstwy=${riverLayers}`);
  console.log(log.join(' | '));
}

simulate('A: rzeka+las, las poza rzeką (5 heksów)', [[10, 12], [10, 13], [11, 13], [9, 12], [11, 11]]);
simulate('B: rzeka+las, BEZ innego lasu w promieniu', []);
