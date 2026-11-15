'use strict';
/** tech-choice-order-test.cjs — kolejność czterech badań startowych w „Możesz wybrać" (R-WEB-UI-TECH-CHOICE-ORDER-WOODWORK-FARM-TAMING-HUNT-Q1) */
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.tech-choice-order-test-entry.ts');
const BUNDLE = path.join(__dirname, '.tech-choice-order-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export { availableTechs } from '../src/game/playerState';
export { buildHubTechEntries, HUB_START_TECH_ORDER } from '../src/ui/scienceHubSnapshotLogic';`,
  'utf8',
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE,
  absWorkingDir: GRA_ROOT,
  logLevel: 'silent',
});

const M = require(BUNDLE);
const techRoot = JSON.parse(fs.readFileSync(path.join(GRA_ROOT, 'data', 'tech.json'), 'utf8'));
const techData = techRoot.technologie;

function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

const TECH_MAP = new Map();
for (const r of techData) {
  const id = slugify(r.Technologia);
  const prereqRaw = r['Wymaga (prereq)'] ?? '';
  const prereqIds = prereqRaw && prereqRaw !== '—'
    ? prereqRaw.split(/\s*\+\s*/).map(p => slugify(p.trim())).filter(Boolean)
    : [];
  TECH_MAP.set(id, { id, nazwa: r.Technologia, epoka: r.Epoka, koszt: r['Koszt nauki'] ?? 0, prereqIds });
}

const gate = { empireBuiltIds: new Set(), buildings: [] };
const EXPECTED_START = ['Obróbka drewna', 'Rolnictwo', 'Oswojenie zwierząt', 'Łowiectwo'];

let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log('  PASS:', msg); }
  else { fail++; console.error('  FAIL:', msg); }
}

// Świeża gra: researched=∅, gate=∅, era 1, bez celu — jak na starcie nowej gry.
const engineNames = M.availableTechs(techData, new Set(), gate).map(t => t.Technologia);
const entries = M.buildHubTechEntries({
  techById: TECH_MAP,
  slugify,
  researchedRaw: [],
  availableRaw: engineNames.map(slugify),
  targetSlug: null,
  playerEra: 1,
  costFor: k => k,
});
const unlocked = entries.filter(e => !e.locked).map(e => e.name);

// T1: cztery badania startowe na początku listy w jawnej kolejności
const head = unlocked.slice(0, EXPECTED_START.length);
ok(JSON.stringify(head) === JSON.stringify(EXPECTED_START),
  `start order = ${JSON.stringify(head)} (oczekiwano ${JSON.stringify(EXPECTED_START)})`);

// T2: stała eksportowana zgodna z oczekiwaniem (jedno miejsce prawdy)
ok(JSON.stringify(M.HUB_START_TECH_ORDER) === JSON.stringify(EXPECTED_START),
  'HUB_START_TECH_ORDER zgodny z decyzją właściciela');

// T3: pozostałe badania zachowują porządek alfabetyczny (pl) między sobą
const rest = unlocked.slice(EXPECTED_START.length);
const restSorted = [...rest].sort((a, b) => a.localeCompare(b, 'pl'));
ok(rest.length === engineNames.length - EXPECTED_START.length,
  `pozostałe badania obecne (${rest.length})`);
ok(JSON.stringify(rest) === JSON.stringify(restSorted),
  'reszta badań zachowuje względny porządek alfabetyczny');

// T4: badania AI / silnik nie są zmieniane — lista dostępnych z silnika ma tę samą kolejność co wejście
const engineOrderAfter = M.availableTechs(techData, new Set(), gate).map(t => t.Technologia);
ok(JSON.stringify(engineOrderAfter) === JSON.stringify(engineNames),
  'kolejność availableTechs (silnik/AI) nie zależy od sortowania hubu');

// T6: w trakcie gry (Obróbka drewna zbadana) reszta dostępnych nadal alfabetycznie, bez duplikatów
{
  const researched = ['Obróbka drewna'];
  const availNames = M.availableTechs(techData, new Set(researched), gate).map(t => t.Technologia);
  const mid = M.buildHubTechEntries({
    techById: TECH_MAP,
    slugify,
    researchedRaw: researched.map(slugify),
    availableRaw: availNames.map(slugify),
    targetSlug: null,
    playerEra: 1,
    costFor: k => k,
  }).filter(e => !e.locked).map(e => e.name);
  const midRest = mid.filter(n => !EXPECTED_START.includes(n));
  ok(JSON.stringify(midRest) === JSON.stringify([...midRest].sort((a, b) => a.localeCompare(b, 'pl'))),
    'mid-game: reszta badań alfabetycznie (pl)');
  ok(new Set(mid).size === mid.length, 'mid-game: brak duplikatów');
  ok(mid.indexOf('Rolnictwo') < mid.indexOf('Łowiectwo') || !mid.includes('Rolnictwo'),
    'mid-game: Rolnictwo przed Łowiectwem');
}

// T5: zablokowane (podgląd) nadal po dostępnych
const firstLockedIdx = entries.findIndex(e => e.locked);
ok(firstLockedIdx === -1 || entries.slice(firstLockedIdx).every(e => e.locked),
  'wpisy zablokowane pozostają po dostępnych');

console.log(`\ntech-choice-order-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
