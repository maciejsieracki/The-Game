'use strict';
/**
 * objaw-b-measure.cjs — pomiar Objawu B (R-WEB-AUTOIMPROVE-PRIORITY-Q1, runda 3).
 * Run from gra/:  node tools/objaw-b-measure.cjs
 * Scenariusz: miasto (pop 5) z obywatelami na heksie rzeki (13,12) z farmą już postawioną;
 * odblokowane Rolnictwo, Oswojenie zwierząt, Irygacja; onlyWorked=true, wolnoWycinacLas=true.
 * Wypisuje picki per tura, żeby zobaczyć, czy po farmie pojawia się trzoda/irygacja.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.OBJAW_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const ENTRY_FILE = path.resolve(__dirname, '.objaw-b-measure-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.objaw-b-measure-bundle.cjs');
fs.writeFileSync(ENTRY_FILE, `export { pickAutoImprovements } from ${JSON.stringify(SRC + '/game/auto-improvements')};\n`, 'utf8');
esbuild.buildSync({ entryPoints: [ENTRY_FILE], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: BUNDLE_FILE, absWorkingDir: GRA_ROOT, logLevel: 'silent' });
const { pickAutoImprovements } = require(BUNDLE_FILE);

const TECHS = ['Rolnictwo', 'Oswojenie zwierząt', 'Irygacja', 'Gospodarka wodna'];
const RIVER = '13,12';

function makeMap(opts) {
  const hexes = {};
  for (let q = 0; q < 24; q++) for (let r = 0; r < 24; r++) {
    hexes[`${q},${r}`] = { coords: { q, r }, terenBazowy: 'rownina', nakladka: 'brak', ulepszenie: 'brak',
      wlasciciel: null, wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {}, rzeka: { obecna: false, krawedzie: [] } };
  }
  hexes[RIVER].rzeka = { obecna: true, krawedzie: [] };
  for (const [q, r] of opts.forest || []) hexes[`${q},${r}`].nakladka = 'las';
  return { szerokoscQ: 24, wysokoscR: 24, hexes, seed: 42,
    riverPaths: [[{ q: 13, r: 12 }, { q: 13, r: 11 }, { q: 14, r: 11 }]] };
}

function run(label, cfg) {
  const map = makeMap(cfg);
  const placed = new Map(cfg.placed || []);
  const worked = new Set(cfg.worked);
  const city = { id: 'c1', ownerId: 0, q: 12, r: 12, name: 'T', population: 5, ulepszeniaFocus: 'zrownowazone' };
  const log = [];
  for (let t = 1; t <= cfg.turns; t++) {
    const picks = pickAutoImprovements({
      cities: [city], ownerId: 0, map,
      territoryNodes: [{ q: 12, r: 12, pop: 5, level: 1, ownerId: 0 }],
      placedImprovements: placed, pracaAvailable: cfg.praca ?? 200, pracaBudgetPercent: cfg.pct ?? 100,
      unlockedTechs: new Set(TECHS), pracaSurplusThreshold: 30, skipWyrab: false, civArchetype: 'grecy',
      getOnlyWorked: () => cfg.onlyWorked, getWorkedHexKeys: () => worked,
      getFocus: () => 'zrownowazone', demandDriven: true,
    });
    const line = [];
    for (const p of picks) {
      const hk = `${p.q},${p.r}`;
      line.push(`${p.key}@${hk}${hk === RIVER ? '(R)' : ''}`);
      if (p.key === 'wyrab') { map.hexes[hk].nakladka = 'brak'; continue; }
      placed.set(hk, [...(placed.get(hk) ?? []), p.key]);
    }
    if (line.length) log.push(`  t${t}: ${line.join(', ')}`);
  }
  console.log(label);
  console.log(log.length ? log.join('\n') : '  (brak pickow)');
  console.log('  stan R:', JSON.stringify(placed.get(RIVER) ?? []));
}

const base = { turns: 8, onlyWorked: true, worked: ['12,12', '11,12', '12,11', '12,13', '11,13', RIVER] };
run('A. farma juz na rzece (13,12), bez lasu, obywatel na rzece', { ...base, placed: [[RIVER, ['farma']]] });
run('B. farma na rzece + sasiedni wolny heks z obywatelem', { ...base, placed: [[RIVER, ['farma']]], worked: [...base.worked, '12,10'] });
run('C. jak A, ale onlyWorked=false', { ...base, onlyWorked: false, placed: [[RIVER, ['farma']]] });
run('D. brak farmy, rzeka bez lasu, obywatel na rzece', { ...base });
console.log('--- budzet domyslny 33% (DEFAULT_ULEPSZENIA_PRACA_PERCENT), pula 100/tura ---');
run('E. jak A, pula 100, pct 33', { ...base, praca: 100, pct: 33, placed: [[RIVER, ['farma']]] });
run('F. brak farmy, pula 100, pct 33', { ...base, praca: 100, pct: 33 });
run('G. jak A, pula 60, pct 33', { ...base, praca: 60, pct: 33, placed: [[RIVER, ['farma']]] });
run('H. jak E, pula 200, pct 33 (irygacja koszt 60 wymaga cap >= 60)', { ...base, praca: 200, pct: 33, placed: [[RIVER, ['farma']]] });
run('I. jak E, pula 150, pct 33', { ...base, praca: 150, pct: 33, placed: [[RIVER, ['farma']]] });
