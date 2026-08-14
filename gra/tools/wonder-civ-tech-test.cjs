'use strict';
/** node tools/wonder-civ-tech-test.cjs — techUnlock cudów E >= epokaWejscia państwa */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.wonder-civ-tech-entry.ts');
const bundle = path.join(__dirname, '.wonder-civ-tech-bundle.cjs');

fs.writeFileSync(entry, `
export {
  buildTechEpochMap,
  findExclusiveWonderTechViolations,
  wonderTechValidForCivEntry,
} from '../src/game/wonder-civ-tech';
export { getCivEpokaWejscia } from '../src/game/civ-entry-epoch';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  loader: { '.ts': 'ts' },
  outfile: bundle,
  absWorkingDir: GRA,
  logLevel: 'silent',
});

const M = require(bundle);
const tech = require('../data/tech.json');
const civs = require('../data/civs.json');
const wonders = require('../data/wonders.json');

const techMap = M.buildTechEpochMap(tech.technologie ?? []);
const violations = M.findExclusiveWonderTechViolations(
  wonders.cuda ?? [],
  civs.cywilizacje,
  techMap,
);

let passed = 0;
let failed = 0;
function assert(c, msg) {
  if (c) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}

console.log('wonder-civ-tech-test (E: tech >= epokaWejscia)\n');

assert(violations.length === 0, 'brak naruszeń reguły tech cudów E');
if (violations.length > 0) {
  for (const v of violations) {
    console.error('  VIOLATION:', v.wonderId, v.civId, v.invalidTech, '<', v.civEntryEpoch);
  }
}

const ink = civs.cywilizacje.find(c => c.ikonaId === 'inkowie');
assert(
  M.wonderTechValidForCivEntry(ink, ['Matematyka', 'Murarstwo'], techMap),
  'Inkowie (kamien): Matematyka+Murarstwo OK',
);
assert(
  !M.wonderTechValidForCivEntry(
    civs.cywilizacje.find(c => c.ikonaId === 'fenicjanie'),
    ['Murarstwo'],
    techMap,
  ),
  'Fenicjanie (braz): Murarstwo (kamien) NIE',
);
assert(
  M.wonderTechValidForCivEntry(
    civs.cywilizacje.find(c => c.ikonaId === 'fenicjanie'),
    ['Inżynieria'],
    techMap,
  ),
  'Fenicjanie: Inżynieria OK',
);
assert(
  M.wonderTechValidForCivEntry(
    civs.cywilizacje.find(c => c.ikonaId === 'grecy'),
    ['Inżynieria'],
    techMap,
  ),
  'Grecy (kamien): tech żelaza OK (późniejsza epoka)',
);

// ---------------------------------------------------------------------------
// Regresja generyczna „rozjazd danych Petra" (2026-08-13, ECHO A): dla WSZYSTKICH
// cudów w wonders.json, `epokaWejscia` własnego cudu musi być >= najwyższej epoki
// spośród technologii w jego `techUnlock`. Kierunek epokaWejscia < maxTechEpoch jest
// strukturalnie wadliwy -- cywilizacja formalnie "wchodzi" do epoki cudu, zanim
// technologia go odblokowująca w ogóle staje się badalna (dokładnie stary defekt
// Petry: epokaWejscia=2, techUnlock="Inżynieria" epoki 3). Kierunek odwrotny
// (epokaWejscia > maxTechEpoch) jest NIESZKODLIWY i częsty w danych (np. Terakotowa
// Armia epokaWejscia=3 z techUnlock Wojskowość epoki 2 -- tech dawno zbadana, zanim
// cywilizacja wchodzi w epokę cudu) — NIE jest to naruszeniem tej reguły.
// ---------------------------------------------------------------------------
{
  const EPOCH_ID_TO_NUM = { kamien: 1, braz: 2, zelazo: 3 };
  const allWonders = [...(wonders.cuda ?? []), ...(wonders.parkowane_epoka4plus ?? [])];
  const mismatches = [];
  for (const w of allWonders) {
    if (typeof w.epokaWejscia !== 'number' || !w.techUnlock || w.techUnlock.length === 0) continue;
    const techEpochNums = w.techUnlock
      .map((t) => techMap.get(t))
      .filter(Boolean)
      .map((id) => EPOCH_ID_TO_NUM[id] ?? 0);
    const maxTechEpoch = techEpochNums.length ? Math.max(...techEpochNums) : 0;
    if (maxTechEpoch > w.epokaWejscia) {
      mismatches.push(`${w.id}: epokaWejscia=${w.epokaWejscia} < maxTechEpoch=${maxTechEpoch} (${w.techUnlock.join(',')})`);
    }
  }
  assert(mismatches.length === 0,
    `regresja rozjazdu danych Petra: żaden cud NIE MOŻE mieć epokaWejscia niższej niż epoka najwyższej wymaganej technologii (naruszenia: ${mismatches.join('; ') || 'brak'})`);
}

console.log('\nwonder-civ-tech-test:', passed, 'passed,', failed, 'failed');
if (failed) process.exit(1);
