// Wplyw delty dc8a3adc->4bbef081d na tematy 8A, 8G, 8H2, 8I/8I2 (wg GOAL z dispatchy na galezi).
// Zakres: symbole z GOAL (nazwa -> zakres linii w pliku main), hunki (newStart..newStart+newN-1) przecinajace zakres.
import fs from 'node:fs';
const S = '/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad';
const rows = JSON.parse(fs.readFileSync(`${S}/hunks3.json`, 'utf8'));
const src = p => fs.readFileSync(`${S}/pin-main/gra/src/${p}`, 'utf8').split('\n');
const TOP = /^(export\s+)?(async\s+)?(function|const|let|class|interface|type|enum)\b|^\}\s*$|^\/\*\*/;
// zakres symbolu: od linii deklaracji do nastepnej deklaracji najwyzszego poziomu
function symRange(lines, name) {
  const re = new RegExp(`^(export\\s+)?(async\\s+)?(function|const|let|class|interface|type)\\s+${name}\\b`);
  const a = lines.findIndex(l => re.test(l));
  if (a < 0) return null;
  let b = a + 1;
  while (b < lines.length && !/^(export\s+)?(async\s+)?(function|const|let|class|interface|type|enum)\s/.test(lines[b])) b++;
  return [a + 1, b];
}
function hunksIn(file, ranges) {
  const out = [];
  for (const r of rows) {
    if (r.file !== `gra/src/${file}`) continue;
    const a = r.newStart, b = r.newStart + Math.max(r.newN, 1) - 1;
    if (ranges.some(([x, y]) => a <= y && b >= x)) out.push(`${r.newStart}(${r.cls})`);
  }
  return out;
}
const topics = {
  '8I/8I2 auto-improvements P1 (typy/stale/helpery)': ['game/auto-improvements.ts', ['AutoImprovementCity', 'AutoImprovementPick', 'AI_IMPROVEMENT_PRIORITY', 'ULEPSZENIA_FOCUS_ZYWNOSC', 'ULEPSZENIA_ZYWNOSCIOWE', 'ZERO_YIELD_IMPROVEMENTS', 'JEDEN_NA_ILU_OBYWATELI', 'WYRAB_MIN_FOREST_IN_RADIUS', 'AUTO_ULEPSZENIA_PRACA_RESERVE', 'hasNonFoodResourceDeficit', 'AutoImprovementSurplusReport', 'freshSurplusReport', 'prioritiesForUlepszeniaFocus', 'PickAutoImprovementsOpts']],
  '8I2 auto-improvements P2 (pickAutoImprovements)': ['game/auto-improvements.ts', ['pickAutoImprovements']],
  '8A production.ts (epoka, itemCost, buildingProductionItem, unitProductionItem, buildingLocationAllowed)': ['game/production.ts', ['epochNumber', 'itemCost', 'buildingProductionItem', 'unitProductionItem', 'buildingLocationAllowed']],
  '8H2 society-inputs (isForeignReligionDominant, isPlayerCapitalCity, stolicaEasyBonusActive)': ['game/society-inputs.ts', ['isForeignReligionDominant', 'isPlayerCapitalCity', 'stolicaEasyBonusActive']],
  '8H2 resource-access.ts (caly plik)': ['game/resource-access.ts', null],
  '8G okolica.ts (caly plik)': ['game/okolica.ts', null],
};
const report = {};
for (const [topic, [file, syms]] of Object.entries(topics)) {
  let lines;
  try { lines = src(file); } catch { report[topic] = { file, status: 'PLIK NIE ISTNIEJE W 4bbef081d' }; continue; }
  let ranges;
  if (syms === null) ranges = [[1, lines.length]];
  else ranges = syms.map(s => symRange(lines, s)).filter(Boolean);
  const found = syms ? syms.filter(s => symRange(lines, s)).length : null;
  const hits = hunksIn(file, ranges);
  report[topic] = { file, symboli_znalezione: found === null ? 'caly plik' : `${found}/${syms.length}`, hunki: hits.length, lista: hits.slice(0, 60) };
}
// hunki w calym pliku dla kontekstu
for (const f of ['game/production.ts', 'game/resource-access.ts', 'game/society-inputs.ts', 'game/okolica.ts', 'game/building-upgrades.ts', 'game/pending-improvements.ts', 'game/auto-improvements.ts']) {
  report[`plik ${f}: hunkow w delcie`] = rows.filter(r => r.file === `gra/src/${f}`).length;
}
console.log(JSON.stringify(report, null, 1));
