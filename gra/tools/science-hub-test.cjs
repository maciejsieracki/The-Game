'use strict';
/** science-hub-test.cjs — regresja listy „Możesz wybrać" w hubie badań */
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.science-hub-test-entry.ts');
const BUNDLE = path.join(__dirname, '.science-hub-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export { availableTechs } from '../src/game/playerState';
export { buildHubTechEntries } from '../src/ui/scienceHubSnapshotLogic';`,
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
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function buildTechMap() {
  const map = new Map();
  for (const r of techData) {
    const id = slugify(r.Technologia);
    const prereqRaw = r['Wymaga (prereq)'] ?? '';
    const prereqIds = prereqRaw && prereqRaw !== '—'
      ? prereqRaw.split(/\s*\+\s*/).map(p => slugify(p.trim())).filter(Boolean)
      : [];
    map.set(id, {
      id,
      nazwa: r.Technologia,
      epoka: r.Epoka,
      koszt: r['Koszt nauki'] ?? 0,
      prereqIds,
    });
  }
  return map;
}

const TECH_MAP = buildTechMap();
const gate = { empireBuiltIds: new Set(), buildings: [] };

let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log('  PASS:', msg); }
  else { fail++; console.error('  FAIL:', msg); }
}

function hubUnlocked(researchedNames, targetName, era) {
  const zbadane = new Set(researchedNames);
  const availSlugs = M.availableTechs(techData, zbadane, gate).map(t => slugify(t.Technologia));
  const drafts = M.buildHubTechEntries({
    techById: TECH_MAP,
    slugify,
    researchedRaw: [...zbadane].map(slugify),
    availableRaw: availSlugs,
    targetSlug: targetName ? slugify(targetName) : null,
    playerEra: era,
    costFor: (k) => k,
  });
  return drafts.filter(d => !d.locked);
}

// T1: świeża gra
{
  const unlocked = hubUnlocked([], null, 1);
  const engine = M.availableTechs(techData, new Set(), gate);
  ok(engine.length >= 5, `engine available=${engine.length} (>=5)`);
  ok(unlocked.length >= 5, `hub unlocked=${unlocked.length} (>=5)`);
  ok(unlocked.length === engine.length,
    `hub unlocked matches engine (${unlocked.length} vs ${engine.length})`);
}

// T2: w trakcie Garncarstwa
{
  const unlocked = hubUnlocked(['Obróbka drewna', 'Murarstwo', 'Rolnictwo'], 'Garncarstwo', 1);
  ok(unlocked.length >= 3, `mid-game hub unlocked=${unlocked.length} (>=3)`);
  ok(unlocked.some(e => e.name === 'Garncarstwo'), 'hub includes active target Garncarstwo');
}

// T3: regresja — available z nazwami kanonicznymi (nie slugami)
{
  const zbadane = new Set();
  const names = M.availableTechs(techData, zbadane, gate).map(t => t.Technologia);
  const drafts = M.buildHubTechEntries({
    techById: TECH_MAP,
    slugify,
    researchedRaw: [],
    availableRaw: names,
    targetSlug: null,
    playerEra: 1,
    costFor: (k) => k,
  });
  const unlocked = drafts.filter(d => !d.locked);
  ok(unlocked.length === names.length,
    `canonical names in availableRaw → ${unlocked.length} unlocked (engine ${names.length})`);
}

// T4: epoka UI = epoka celu (player.era=2, cel Garncarstwo → Kamień)
{
  const drafts = M.buildHubTechEntries({
    techById: TECH_MAP,
    slugify,
    researchedRaw: [],
    availableRaw: ['garncarstwo'],
    targetSlug: 'garncarstwo',
    playerEra: 2,
    costFor: (k) => k,
  });
  ok(drafts.some(d => d.name === 'Garncarstwo' && !d.locked),
    'target epoch Kamień shown even when player.era=2');
}

console.log(`\nscience-hub-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
