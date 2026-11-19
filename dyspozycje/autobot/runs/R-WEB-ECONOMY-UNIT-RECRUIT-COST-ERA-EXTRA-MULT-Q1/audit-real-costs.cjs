'use strict';
const path = require('path');
const ROOT = process.argv[2];
const esbuild = require(path.resolve(ROOT, 'node_modules', 'esbuild'));
const GAME = path.resolve(ROOT, 'src', 'game');
const UNITS = require(path.resolve(ROOT, 'data', 'units.json'));
const ECON = require(path.resolve(ROOT, 'data', 'econ-params.json'));
(async () => {
  const entry = [
    "export { unitProductionItem } from './production';",
    "export { unitUpkeep, buildUnitUpkeepTable, buildUnitFoodTable, unitFoodPerTurn, loadUpkeepParams } from './economy-upkeep';",
  ].join('\n');
  const r = await esbuild.build({ stdin: { contents: entry, resolveDir: GAME, sourcefile: path.resolve(GAME, '.audit-entry.ts'), loader: 'ts' },
    bundle: true, write: false, format: 'cjs', platform: 'node', logLevel: 'silent' });
  const m = { exports: {} };
  new Function('module', 'exports', 'require', r.outputFiles[0].text)(m, m.exports, require);
  const A = m.exports;
  const data = { buildings: [], units: UNITS };
  const names = ['Wojownik', 'Łucznik', 'Rydwan (woły)', 'Zwiadowca', 'Włócznik', 'Procarz', 'Rydwan konny', 'Falanga', 'Hastati', 'Konnica'];
  const tbl = A.buildUnitUpkeepTable(UNITS);
  const ftbl = A.buildUnitFoodTable(UNITS);
  const p = A.loadUpkeepParams(ECON, 'normal');
  const out = [];
  for (const n of names) {
    const u = UNITS.find(x => x.Jednostka === n);
    if (!u) { out.push(n + ' | brak w units.json'); continue; }
    const rec = ['niski', 'normalny', 'wysoki'].map(pc => { const it = A.unitProductionItem(n, data, undefined, pc, 1, 'normal'); return it ? it.koszt : 'n/a'; });
    let mon, food;
    try { mon = A.unitUpkeep({ typeId: n }, tbl, p.jednostkaUtrzymanieStd); } catch (e) { mon = 'ERR ' + e.message; }
    try { food = A.unitFoodPerTurn({ typeId: n, Epoka: u.Epoka }, p, ftbl); } catch (e) { food = 'ERR ' + e.message; }
    out.push([n, u.Epoka, 'raw=' + u['Pieniądz (koszt)'], 'rekr=' + rec.join('/'), 'Pien/tura=' + mon, 'zyw/tura=' + food].join(' | '));
  }
  console.log(out.join('\n'));
})().catch(e => { console.error('AUDIT_ERR', e); process.exit(1); });
