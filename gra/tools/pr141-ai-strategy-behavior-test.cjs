'use strict';
/**
 * Controlled, single-cell matrix perturbations through production decision functions.
 * Run from gra/: node tools/pr141-ai-strategy-behavior-test.cjs
 * Matrix mutations are in-memory only; no data or product source is written.
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const root = path.resolve(__dirname, '..');
const src = path.join(root, 'src');
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'pr141-ai-strategy-'));
const entry = path.join(scratch, 'entry.ts');
const bundle = path.join(scratch, 'bundle.cjs');
fs.writeFileSync(entry, `
 export { planCityFounding, decideAIDiplomacy } from ${JSON.stringify(path.join(src, 'game/ai'))};
 export { civAiProfileFor, civAiProfilMapy, resolveArchetypeTrade } from ${JSON.stringify(path.join(src, 'game/civ-ai-data'))};
 export { loadCivMatrix } from ${JSON.stringify(path.join(src, 'game/civ-matrix'))};
 export { AI_FOUNDING_SOURCE_MIN_POP } from ${JSON.stringify(path.join(src, 'game/city-founding'))};
`);
try {
  esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' }, outfile: bundle, absWorkingDir: root, logLevel: 'silent' });
} catch (error) {
  console.error('BUNDLE FAIL:', error.message || error);
  fs.rmSync(scratch, { recursive: true, force: true });
  process.exit(1);
}
const M = require(bundle);
const matrix = M.loadCivMatrix();
let passed = 0;
let failed = 0;
function check(ok, label, actual) {
  if (ok) passed++;
  else { failed++; console.error(`FAIL: ${label}; got ${JSON.stringify(actual)}`); }
}
function eq(actual, expected, label) { check(actual === expected, label, actual); }
function deepEq(actual, expected, label) {
  check(JSON.stringify(actual) === JSON.stringify(expected), label, actual);
}
function setCell(civ, field, value) {
  const row = matrix.cywilizacje.find(r => r.ikonaId === civ);
  const previous = row.params[field];
  row.params[field] = value;
  return () => { row.params[field] = previous; };
}
const data = {};
function profile(civ) { return M.civAiProfileFor(data, civ, 'normal'); }
function makeMap(w, h) {
  const hexes = {};
  for (let q = 0; q < w; q++) for (let r = 0; r < h; r++) hexes[`${q},${r}`] = {
    coords: { q, r }, terenBazowy: 'laka', nakladka: 'brak', ulepszenie: 'brak', wlasciciel: null,
    wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {}, rzeka: { obecna: false, krawedzie: [] },
  };
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 7719, riverPaths: [] };
}
const gameData = { units: [], buildings: [], terrainYields: { terrain_types: [{ Teren: 'laka', Zywnosc: 4, Praca: 1, Handel: 1 }] }, aiParams: {
  ekspansja_min_dystans_miast: { wartosc: 5 }, ekspansja_min_score_hex: { wartosc: 1 },
} };
const city = { id: 'greek-home', ownerId: 1, q: 20, r: 20, population: M.AI_FOUNDING_SOURCE_MIN_POP, name: 'home' };
const cities = [city];
const map = makeMap(40, 40);
const warRelation = { partnerId: '2', partnerTypCywilizacji: 'rzymianie', relation: { zaufanie: 0, respekt: 0, status: 'neutralni' },
  respektWzgledny: 0.55, stanWojny: false };
function diplomacyInputs(civ, overrides = {}) {
  const p = profile(civ);
  const rel = { ...warRelation, respektWzgledny: overrides.respektWzgledny ?? warRelation.respektWzgledny };
  const rest = { ...overrides };
  delete rest.respektWzgledny;
  return { relacje: [rel], agresja: p.agresywnosc / 10, agresywnoscRaw: p.agresywnosc,
    sklonnoscDoPodboju: p.sklonnoscDoPodboju, tolerancjaRyzyka: p.tolerancjaRyzyka,
    myTypCywilizacji: civ, currentTurn: 40, skarbiecGold: 1000, ...rest };
}
function decide(input, difficulty = 'normal') { return M.decideAIDiplomacy(input, undefined, 1, 1, difficulty); }

console.log('--- ai_ekspansywnosc: command from fixed map and founding state ---');
{
  // Hold Rome at 3 for both control observations; then perturb only Greece.
  const restoreRome = setCell('rzymianie', 'ai_ekspansywnosc', 3);
  const foundingFor = (ownerId, civ) => M.planCityFounding(ownerId,
    [{ ...city, ownerId }], map, gameData,
    { currentTurn: 20, pracaAvailable: 200, civAiProfile: profile(civ), clusterStateTargets: [{ ownerId: 88 }] }, 5);
  let ordinary;
  let foreignBaseline;
  let bypass;
  let foreignPerturbed;
  try {
    ordinary = foundingFor(1, 'grecy');
    foreignBaseline = foundingFor(2, 'rzymianie');
    const restoreGreece = setCell('grecy', 'ai_ekspansywnosc', 4);
    try {
      bypass = foundingFor(1, 'grecy');
      foreignPerturbed = foundingFor(2, 'rzymianie');
    } finally { restoreGreece(); }
  } finally { restoreRome(); }
  eq(ordinary, null, 'low Greek expansion retains cluster-consolidation block');
  check(bypass?.type === 'foundCityAt', 'high Greek expansion yields final founding command under same cluster state', bypass);
  deepEq(foreignPerturbed, foreignBaseline, 'active Greek expansion perturbation leaves Roman founding decision at its baseline');
}

console.log('--- ai_sklonnosc_podboju: final declaration command threshold ---');
{
  const fixed = { agresja: 0.5, agresywnoscRaw: 5, respektWzgledny: 0.48 };
  const foreignBaseline = decide(diplomacyInputs('grecy', fixed));
  let low;
  let high;
  let foreignPerturbed;
  const restoreLow = setCell('rzymianie', 'ai_sklonnosc_podboju', 3);
  try {
    low = decide(diplomacyInputs('rzymianie', fixed));
    const restoreHigh = setCell('rzymianie', 'ai_sklonnosc_podboju', 4);
    try {
      high = decide(diplomacyInputs('rzymianie', fixed));
      foreignPerturbed = decide(diplomacyInputs('grecy', fixed));
    } finally { restoreHigh(); }
  } finally { restoreLow(); }
  check(!low.some(c => c.type === 'wypowiedz_wojne'), 'low conquest profile does not declare war in fixed relation', low);
  check(high.some(c => c.type === 'wypowiedz_wojne'), 'high conquest profile declares war in same relation', high);
  deepEq(foreignPerturbed, foreignBaseline, 'active Roman conquest perturbation leaves Greek diplomacy command at its baseline');
}

console.log('--- ai_tolerancja_ryzyka: risk threshold changes final war command ---');
{
  const fixed = { agresja: 0.5, agresywnoscRaw: 5, sklonnoscDoPodboju: 4, respektWzgledny: 0.4 };
  const foreignBaseline = decide(diplomacyInputs('grecy', fixed));
  let cautious;
  let risky;
  let foreignPerturbed;
  const restoreCautious = setCell('rzymianie', 'ai_tolerancja_ryzyka', 6);
  try {
    cautious = decide(diplomacyInputs('rzymianie', fixed));
    const restoreRisky = setCell('rzymianie', 'ai_tolerancja_ryzyka', 8);
    try {
      risky = decide(diplomacyInputs('rzymianie', fixed));
      foreignPerturbed = decide(diplomacyInputs('grecy', fixed));
    } finally { restoreRisky(); }
  } finally { restoreCautious(); }
  check(!cautious.some(c => c.type === 'wypowiedz_wojne'), 'risk 6 keeps war threshold above fixed military relation', cautious);
  check(risky.some(c => c.type === 'wypowiedz_wojne'), 'risk 8 crosses war threshold at unchanged relation', risky);
  deepEq(foreignPerturbed, foreignBaseline, 'active Roman risk perturbation leaves Greek diplomacy command at its baseline');
}

console.log('--- ai_profil_obronna: rival owner map-role configuration ---');
{
  const restoreRome = setCell('rzymianie', 'ai_profil_obronna', 0);
  let baseline;
  let defensive;
  let foreignBaseline;
  let foreignPerturbed;
  let simulatedLeak;
  try {
    const restoreGreece = setCell('grecy', 'ai_profil_obronna', 0);
    try {
      baseline = M.civAiProfilMapy(data, 'grecy', 'normal');
      foreignBaseline = M.civAiProfilMapy(data, 'rzymianie', 'normal');
      const restoreFlag = setCell('grecy', 'ai_profil_obronna', 1);
      try {
        defensive = M.civAiProfilMapy(data, 'grecy', 'normal');
        foreignPerturbed = M.civAiProfilMapy(data, 'rzymianie', 'normal');
        // Deliberately model the owner leak: copy Greece's active flag to Rome.
        // The control must distinguish this bad result from Rome's synthetic 0 baseline.
        const restoreLeakedRomanFlag = setCell('rzymianie', 'ai_profil_obronna', 1);
        try { simulatedLeak = M.civAiProfilMapy(data, 'rzymianie', 'normal'); }
        finally { restoreLeakedRomanFlag(); }
      } finally { restoreFlag(); }
    } finally { restoreGreece(); }
  } finally { restoreRome(); }
  eq(baseline, 'standardowa', 'zero flag configures standard rival map role');
  eq(foreignBaseline, 'standardowa', 'synthetic Roman flag 0 establishes standard-role baseline');
  eq(defensive, 'kopia_typu_obronna', 'one flag configures defensive-copy rival map role');
  deepEq(foreignPerturbed, foreignBaseline, 'active Greek defensive-flag perturbation leaves Roman rival role at its baseline');
  eq(foreignPerturbed, 'standardowa', 'foreign Roman remains standard during active Greek flag 1');
  eq(simulatedLeak, 'kopia_typu_obronna', 'negative leak control proves copying Greek flag 1 into Rome would be detected');
}

console.log('--- dip_handlowosc_archetyp: final trade proposal command ---');
{
  const relation = { ...warRelation, relation: { zaufanie: 30, respekt: 30, status: 'neutralni' }, respektWzgledny: 0.5 };
  const foreignTradeBaseline = M.resolveArchetypeTrade('rzymianie', 0.5, 'normal');
  const foreignCommandsBaseline = decide(diplomacyInputs('rzymianie', { relacje: [relation], handlowosc: foreignTradeBaseline, currentTurn: 0 }), 'easy');
  let lowOffer;
  let low;
  let highOffer;
  let high;
  let foreignTradePerturbed;
  let foreignCommandsPerturbed;
  const restoreLow = setCell('inkowie', 'dip_handlowosc_archetyp', 0.3);
  try {
    lowOffer = M.resolveArchetypeTrade('inkowie', 0.5, 'normal');
    low = decide(diplomacyInputs('inkowie', { relacje: [relation], handlowosc: lowOffer, currentTurn: 0 }), 'easy');
    const restoreHigh = setCell('inkowie', 'dip_handlowosc_archetyp', 0.8);
    try {
      highOffer = M.resolveArchetypeTrade('inkowie', 0.5, 'normal');
      high = decide(diplomacyInputs('inkowie', { relacje: [relation], handlowosc: highOffer, currentTurn: 0 }), 'easy');
      foreignTradePerturbed = M.resolveArchetypeTrade('rzymianie', 0.5, 'normal');
      foreignCommandsPerturbed = decide(diplomacyInputs('rzymianie', { relacje: [relation], handlowosc: foreignTradePerturbed, currentTurn: 0 }), 'easy');
    } finally { restoreHigh(); }
  } finally { restoreLow(); }
  check(lowOffer < 0.4 && !low.some(c => c.type === 'zaproponuj_handel'), 'low trade archetype suppresses proposal at the same relation', low);
  check(highOffer >= 0.4 && high.some(c => c.type === 'zaproponuj_handel'), 'high trade archetype produces final trade proposal', high);
  eq(foreignTradePerturbed, foreignTradeBaseline, 'active Inca trade perturbation leaves Roman trade resolver at its baseline');
  deepEq(foreignCommandsPerturbed, foreignCommandsBaseline, 'active Inca trade perturbation leaves Roman trade command at its baseline');
}

console.log(`RESULT: ${passed} passed, ${failed} failed`);
fs.rmSync(scratch, { recursive: true, force: true });
process.exit(failed ? 1 : 0);
