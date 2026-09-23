'use strict';
/**
 * civ-matrix-semantic-labels-test.cjs
 *
 * Focused contract test for the Normal-only semantic presentation layer.
 * Run from gra/: node tools/civ-matrix-semantic-labels-test.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const sourceRoot = path.resolve(__dirname, '..', 'src');
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'civ-matrix-semantic-'));
const entry = path.join(tempRoot, 'entry.ts');
const bundle = path.join(tempRoot, 'bundle.cjs');
fs.writeFileSync(entry, `
  export {
    buildCivMatrixSemanticProfile,
    buildCivMatrixSemanticSnapshot,
    classifyCivMatrixCell,
    civMatrixConsumerStatus,
    civMatrixSemanticPolarity,
    civMatrixSemanticParameterIds,
    civMatrixSemanticCivilizations,
    civMatrixConsumerEvidence,
    statusAllowsDefaultVisibility,
    civMatrixFormattedValue,
    civMatrixIntensityLabel,
    civMatrixParameterLabelPl,
    median,
  } from ${JSON.stringify(sourceRoot + '/game/civ-matrix-semantic')};
`, 'utf8');

let M;
try {
  esbuild.buildSync({
    entryPoints: [entry],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: bundle,
    absWorkingDir: path.resolve(__dirname, '..'),
    logLevel: 'silent',
  });
  M = require(bundle);
} catch (error) {
  console.error('esbuild failed:', error.message || error);
  fs.rmSync(tempRoot, { recursive: true, force: true });
  process.exit(1);
}

let passed = 0;
let failed = 0;
function assert(condition, message) {
  if (condition) passed++;
  else {
    failed++;
    console.error('FAIL:', message);
  }
}
function equal(actual, expected, message) {
  assert(actual === expected, `${message} (got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)})`);
}
function near(actual, expected, message) {
  assert(Math.abs(actual - expected) < 1e-9, `${message} (got ${actual}, want ${expected})`);
}

const matrix = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'data', 'civ-matrix.json'), 'utf8'));
const snapshot = M.buildCivMatrixSemanticSnapshot();
const greek = M.buildCivMatrixSemanticProfile('grecy');
const unknown = M.buildCivMatrixSemanticProfile('not-a-civilization');

console.log('--- exact matrix and semantic coverage ---');
equal(Object.keys(matrix.paramDefs).length, 109, 'matrix declares 109 parameter definitions');
equal(matrix.cywilizacje.length, 15, 'matrix declares 15 civilizations');
equal(snapshot.expectedCellCount, 1635, 'semantic contract expects 1635 cells');
equal(snapshot.cells.length, 1635, 'semantic snapshot contains 1635 cells');
equal(greek.cells.length, 109, 'selected Greece profile contains every parameter');
equal(new Set(snapshot.cells.map(c => `${c.civilizationId}/${c.parameterId}`)).size, 1635, 'all semantic cells are unique');
equal(greek.blockedReasonPl, undefined, 'known civilization is not blocked');
assert(unknown.cells.length === 0 && /fallbacku/.test(unknown.blockedReasonPl), 'unknown civilization is explicitly blocked without Greece fallback');

console.log('--- Normal median, exact median, signed intensity ---');
equal(M.median([3, 1, 2]), 2, 'median uses sorted middle value');
equal(M.median([1, 2, 3, 4]), 2.5, 'median handles even synthetic input');
const attackGreece = greek.cells.find(c => c.parameterId === 'walka_atak_piechota');
const attackRomans = M.buildCivMatrixSemanticProfile('rzymianie').cells.find(c => c.parameterId === 'walka_atak_piechota');
near(attackGreece.baselineValue, 0, 'attack Normal median is zero');
equal(attackGreece.label, 'POZYTYWNY', 'exact directional median uses the owner-approved positive badge');
equal(attackGreece.signedIntensity, 1, 'exact directional median uses intensity +1');
equal(attackRomans.signedIntensity, 10, 'most extreme beneficial value maps to +10');
assert(snapshot.cells.every(c => c.signedIntensity >= -10 && c.signedIntensity <= 10), 'every signed intensity stays inside -10..+10');
assert(snapshot.cells.filter(c => c.polarity !== 'neutral/not-applicable' && c.rawValue === c.baselineValue)
  .every(c => c.label === 'POZYTYWNY' && c.signedIntensity === 1), 'every exact directional median follows D8');

console.log('--- reverse polarity and profile-only rows ---');
const declinePositive = M.classifyCivMatrixCell({
  parameterId: 'lud_spadek_proc', civilizationId: 'fixture-high', rawValue: 0.01,
  baselineValue: 0, minValue: -0.01, maxValue: 0.01,
});
const declineNegative = M.classifyCivMatrixCell({
  parameterId: 'lud_spadek_proc', civilizationId: 'fixture-low', rawValue: -0.01,
  baselineValue: 0, minValue: -0.01, maxValue: 0.01,
});
equal(declinePositive.polarity, 'harmful', 'decline has reverse/harmful polarity');
equal(declinePositive.label, 'NEGATYWNY', 'higher decline is negative');
equal(declinePositive.signedIntensity, -10, 'higher decline maps to -10');
equal(declineNegative.label, 'POZYTYWNY', 'lower decline is positive');
equal(declineNegative.signedIntensity, 10, 'lower decline maps to +10');
equal(M.civMatrixSemanticPolarity('eko_korupcja_proc'), 'harmful', 'corruption has harmful polarity');
equal(M.civMatrixSemanticPolarity('spec_Dezercja_proc'), 'harmful', 'attrition/desertion has harmful polarity');
equal(M.civMatrixSemanticPolarity('prod_koszt_budynku_proc'), 'harmful', 'building cost has harmful polarity');
equal(M.civMatrixSemanticPolarity('walka_atak_piechota'), 'beneficial', 'attack has beneficial polarity');
equal(M.civMatrixSemanticPolarity('ai_agresywnosc'), 'neutral/not-applicable', 'AI profile remains neutral badge');
equal(M.civMatrixSemanticPolarity('dip_handlowosc_archetyp'), 'neutral/not-applicable', 'relation profile remains neutral badge');
equal(M.civMatrixConsumerStatus('lud_wzrost_proc'), 'REAL_GAMEPLAY', 'growth has a proven gameplay consumer');
equal(M.civMatrixConsumerStatus('dip_nastawienie_bazowe'), 'DECISION_REQUIRED', 'base attitude requires an owner decision after round 2 recheck (no live consumer)');
equal(M.civMatrixConsumerEvidence('dip_nastawienie_bazowe').length, 0, 'base attitude has no proven consumer evidence');
equal(M.civMatrixConsumerStatus('dip_agresja_archetyp'), 'DECISION_REQUIRED', 'archetype aggression requires an owner decision after round 2 recheck (no live consumer, must not double-count with ai_agresywnosc)');
equal(M.civMatrixConsumerEvidence('dip_agresja_archetyp').length, 0, 'archetype aggression has no proven consumer evidence');
equal(M.civMatrixConsumerStatus('dip_otwartosc_handl'), 'UNWIRED', 'unknown parameter stays unwired');
equal(M.civMatrixConsumerStatus('dip_otwartosc_handel'), 'UI_ONLY', 'relation tag is explicitly UI-only');
const baseAttitudeCell = greek.cells.find(c => c.parameterId === 'dip_nastawienie_bazowe');
equal(baseAttitudeCell.consumerStatus, 'DECISION_REQUIRED', 'base attitude profile cell requires an owner decision');
equal(baseAttitudeCell.provenance.consumerEvidence.length, 0, 'base attitude profile cell carries no consumer evidence');
equal(M.statusAllowsDefaultVisibility(baseAttitudeCell.consumerStatus), false, 'decision-required base attitude is not visible in the active default set');
assert(baseAttitudeCell.statusReasonPl.includes('initialRelation') && baseAttitudeCell.statusReasonPl.includes('Decyzja właściciela'), 'base attitude explains the missing live consumer and the pending owner decision');
const archetypeAggressionCell = greek.cells.find(c => c.parameterId === 'dip_agresja_archetyp');
equal(archetypeAggressionCell.consumerStatus, 'DECISION_REQUIRED', 'archetype aggression profile cell requires an owner decision');
equal(archetypeAggressionCell.provenance.consumerEvidence.length, 0, 'archetype aggression profile cell carries no consumer evidence');
equal(M.statusAllowsDefaultVisibility(archetypeAggressionCell.consumerStatus), false, 'decision-required archetype aggression is not visible in the active default set');
assert(archetypeAggressionCell.statusReasonPl.includes('ai_agresywnosc') && archetypeAggressionCell.statusReasonPl.includes('Decyzja właściciela'), 'archetype aggression explains the ai_agresywnosc double-counting risk and the pending owner decision');

console.log('--- status counts and no persistence ---');
const statusCounts = snapshot.cells.reduce((out, cell) => {
  out[cell.consumerStatus] = (out[cell.consumerStatus] || 0) + 1;
  return out;
}, {});
equal(statusCounts.REAL_GAMEPLAY, 150, '10 proven gameplay parameters cover 15 profiles');
equal(statusCounts.UI_ONLY, 75, '5 UI-only parameters cover 15 profiles');
equal(statusCounts.DECISION_REQUIRED, 30, '2 unresolved AI/diplomacy parameters cover 15 profiles each and require an owner decision');
equal(statusCounts.BLOCKED, 525, '35 combat/special-unit DECISION_REQUIRED parameters cover 15 profiles (round 2, R-CYWILIZACJE-MACIERZ-WIRING-COMBAT-RECON-ORIGIN-20260922)');
equal(statusCounts.DEAD_UNWIRED, 375, '25 combat/siege/fortification parameters with all-default cells are closed dead (round 2)');
equal(statusCounts.UNWIRED, 480, '32 unresolved parameters are visibly unwired after AI DECISION_REQUIRED (2 params) and combat BLOCKED/DEAD_UNWIRED (60 params) reclassification; the 4 former meta REFERENCE_ONLY parameters were removed from the matrix entirely (R-CYWILIZACJE-MACIERZ-META-REMOVE-Q1-20260922), not reclassified as UNWIRED');
assert(!fs.readFileSync(path.resolve(sourceRoot, 'game/civ-matrix-semantic.ts'), 'utf8').includes('localStorage'), 'semantic classifier does not persist labels');

console.log('--- combat/special-unit BLOCKED decision_required (round 2, R-CYWILIZACJE-MACIERZ-WIRING-COMBAT-RECON-ORIGIN-20260922) ---');
const BLOCKED_COMBAT_IDS = [
  'walka_atak_piechota', 'walka_atak_kawaleria', 'walka_atak_rydwany', 'walka_atak_obleczenie',
  'walka_obrona_piechota', 'walka_pancerz_piechota', 'walka_uderzenie_piechota', 'walka_uderzenie_kawaleria',
  'walka_dystans_lukownicy', 'walka_hp_piechota', 'walka_hp_rydwany', 'walka_ruch_bitwa_proc',
  'walka_koszt_rekrutacji_proc', 'walka_atak_piechota_teren_las', 'walka_obrona_piechota_terytorium_wlasne',
  'walka_obrona_piechota_w_murze', 'walka_atak_piechota_runda_szarzy',
];
const BLOCKED_SPECIAL_UNIT_IDS = [
  'spec_Atak', 'spec_Obrazenia', 'spec_Obrona', 'spec_Uderzenie', 'spec_Pancerz', 'spec_Przebicie',
  'spec_Health', 'spec_Atak_dystansowy', 'spec_Zasieg_hex', 'spec_Pociski', 'spec_Ruch_bitwa',
  'spec_Ruch_mapa', 'spec_Widok', 'spec_Dezercja_proc', 'spec_Morale', 'spec_Koszt_pieniadz',
  'spec_Utrzymanie', 'spec_Zywnosc_ture',
];
equal(BLOCKED_COMBAT_IDS.length, 17, 'fixture lists all 17 blocked combat multiplier IDs');
equal(BLOCKED_SPECIAL_UNIT_IDS.length, 18, 'fixture lists all 18 blocked special-unit stat IDs');
for (const id of [...BLOCKED_COMBAT_IDS, ...BLOCKED_SPECIAL_UNIT_IDS]) {
  equal(M.civMatrixConsumerStatus(id), 'BLOCKED', `${id} is classified BLOCKED, not silently UNWIRED`);
  const cell = greek.cells.find(c => c.parameterId === id);
  equal(cell.consumerStatus, 'BLOCKED', `${id} profile cell is BLOCKED`);
  equal(M.statusAllowsDefaultVisibility(cell.consumerStatus), false, `${id} is not visible in the active default set`);
  assert(cell.statusReasonPl.length > 0, `${id} carries a non-empty reason string, never a silent UNWIRED`);
  assert(cell.statusReasonPl.includes('R-CYWILIZACJE-MACIERZ-WIRING-COMBAT-RECON-ORIGIN-20260922'), `${id} reason cites the owning topic`);
}

console.log('--- combat/siege/fortification DEAD_UNWIRED (round 2) ---');
const DEAD_UNWIRED_COMBAT_IDS = [
  'walka_atak_lukownicy', 'walka_atak_morska', 'walka_atak_wszystkie', 'walka_obrona_lukownicy',
  'walka_obrona_kawaleria', 'walka_obrona_rydwany', 'walka_obrona_obleczenie', 'walka_obrona_morska',
  'walka_pancerz_lukownicy', 'walka_pancerz_kawaleria', 'walka_pancerz_rydwany', 'walka_uderzenie_rydwany',
  'walka_dystans_rydwany', 'walka_hp_kawaleria', 'walka_zasieg_proc', 'walka_oblezenie_proc',
  'walka_obrona_piechota_teren_las', 'walka_atak_piechota_terytorium_wlasne', 'walka_atak_piechota_w_murze',
  'walka_obrona_piechota_runda_szarzy', 'walka_atak_piechota_teren_plytkie_morze',
  'walka_obrona_piechota_teren_plytkie_morze', 'obl_obrona_miasta_proc', 'obl_mur_proc', 'obl_machines_proc',
];
equal(DEAD_UNWIRED_COMBAT_IDS.length, 25, 'fixture lists all 25 dead-unwired combat/siege/fortification IDs');
for (const id of DEAD_UNWIRED_COMBAT_IDS) {
  equal(M.civMatrixConsumerStatus(id), 'DEAD_UNWIRED', `${id} is classified DEAD_UNWIRED`);
  const cell = greek.cells.find(c => c.parameterId === id);
  equal(cell.consumerStatus, 'DEAD_UNWIRED', `${id} profile cell is DEAD_UNWIRED`);
  assert(cell.statusReasonPl.length > 0, `${id} carries a non-empty reason string, never a silent UNWIRED`);
}

console.log('--- configurator source contract ---');
const newGameSource = fs.readFileSync(path.resolve(sourceRoot, 'ui/newGameFlow.ts'), 'utf8');
assert(newGameSource.includes('buildCivMatrixSemanticProfile'), 'new-game flow uses the semantic profile');
assert(newGameSource.includes('Pozostałe informacje'), 'inactive rows are reachable through one expandable control');
assert(newGameSource.includes('Szukaj parametru'), 'full profile has search');
assert(newGameSource.includes('Mediana Normal'), 'profile exposes Normal comparison context');
assert(newGameSource.includes('Siła:'), 'profile exposes signed intensity');
assert(newGameSource.includes('W panelu pokazano wyłącznie tożsamość Normal.'), 'civilization panel does not render Easy/Hard identity labels');
assert(!newGameSource.includes('civMatrixSemanticCell') || newGameSource.includes('type CivMatrixSemanticCell'), 'semantic cell type is imported as a type');

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function walkRuntimeFiles(dir) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) out.push(...walkRuntimeFiles(full));
    else if (/\.(ts|tsx)$/.test(name)) out.push(full);
  }
  return out;
}

function sourceHits(parameterId) {
  const pattern = new RegExp(`(^|[^A-Za-z0-9_])${parameterId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^A-Za-z0-9_]|$)`);
  const files = walkRuntimeFiles(sourceRoot)
    .filter(file => !file.endsWith('/game/civ-matrix.ts') && !file.endsWith('/game/civ-matrix-semantic.ts'));
  const hits = [];
  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, index) => {
      if (pattern.test(line)) hits.push(`${path.relative(path.resolve(__dirname, '..', '..'), file)}:${index + 1}`);
    });
  }
  return hits;
}

function jsonWrite(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function generateArtifacts(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const repoRoot = path.resolve(__dirname, '..', '..');
  const snapshot = M.buildCivMatrixSemanticSnapshot();
  const profiles = snapshot.profiles;
  const greece = profiles.find(profile => profile.civilizationId === 'grecy');
  const hitsByParameter = Object.fromEntries(
    Object.keys(matrix.paramDefs).map(parameterId => [parameterId, sourceHits(parameterId)]),
  );
  const statusCounts = {};
  for (const cell of snapshot.cells) statusCounts[cell.consumerStatus] = (statusCounts[cell.consumerStatus] || 0) + 1;
  const parameterStatusCounts = {};
  let decisionRequiredCounter = 0;
  const parameters = Object.entries(matrix.paramDefs).map(([parameterId, definition]) => {
    const status = M.civMatrixConsumerStatus(parameterId);
    const decisionRequiredId = status === 'UNWIRED'
      ? `D_REQUIRED-${String(++decisionRequiredCounter).padStart(3, '0')}`
      : null;
    parameterStatusCounts[status] = (parameterStatusCounts[status] || 0) + 1;
    const values = matrix.cywilizacje.map(row => row.params[parameterId]);
    const cells = snapshot.cells.filter(cell => cell.parameterId === parameterId);
    const greeceCell = greece.cells.find(cell => cell.parameterId === parameterId);
    const evidence = M.civMatrixConsumerEvidence(parameterId);
    const callSites = status === 'UNWIRED' ? [] : hitsByParameter[parameterId];
    const targetConsumers = Object.fromEntries(matrix.cywilizacje.map(row => [row.ikonaId, {
      status,
      actor: status === 'UNWIRED' ? 'UNRESOLVED — decyzja wymagana' : status === 'UI_ONLY' ? 'UI relacji/profilu' : 'runtime actor z potwierdzonego call-site',
      condition: status === 'UNWIRED' ? 'UNRESOLVED — warunek użycia nie został dowiedziony' : 'zgodnie z istniejącym call-site',
      formula: `${definition.formula}: ${definition.modul}`,
      precedence: status === 'UNWIRED' ? 'UNRESOLVED — brak precedencji do przeniesienia' : 'istniejąca implementacja pozostaje źródłem prawdy',
      normalBehavior: row.params[parameterId],
      callSites,
    }]));
    return {
      parameterId,
      labelPl: M.civMatrixParameterLabelPl(parameterId),
      domain: definition.domena,
      unit: definition.jednostka,
      rawFormula: definition.formula,
      declaredModule: definition.modul,
      defaultValue: matrix.defaults[parameterId],
      greece: {
        civilizationId: 'grecy',
        rawValue: matrix.cywilizacje.find(row => row.ikonaId === 'grecy').params[parameterId],
        source: 'gra/data/civ-matrix.json',
        provenConsumerCallSites: evidence,
        rawScanHits: hitsByParameter[parameterId],
      },
      targetConsumers,
      actor: targetConsumers.grecy.actor,
      condition: targetConsumers.grecy.condition,
      formula: targetConsumers.grecy.formula,
      precedence: targetConsumers.grecy.precedence,
      normalBehavior: targetConsumers.grecy.normalBehavior,
      polarity: M.civMatrixSemanticPolarity(parameterId),
      reversePolarityJustification: M.civMatrixSemanticPolarity(parameterId) === 'harmful'
        ? 'Większa wartość zwiększa koszt, stratę, korupcję, spadek lub attrition; kierunek korzystny jest odwrotny.'
        : M.civMatrixSemanticPolarity(parameterId) === 'neutral/not-applicable'
          ? 'Profil AI/relacji/metadane nie jest przewagą; badge pozostaje neutralny, a opis jest osobny.'
          : 'Większa wartość zwiększa wskazany wynik lub zdolność; kierunek jest korzystny.',
      consumerStatus: status,
      decisionRequired: status === 'UNWIRED',
      decisionRequiredId,
      exactRuntimeCallSites: callSites,
      signedIntensity: {
        formula: 'rawValue === median ? +1 : clamp(round2(polarityCorrectedDelta / maxDistance * 10), -10, +10)',
        bounds: [-10, 10],
        medianPopulation: 'all 15 civilizations at Normal',
        examples: cells.slice(0, 3).map(cell => ({ civilizationId: cell.civilizationId, value: cell.signedIntensity })),
      },
      testAndMigration: {
        focusedTest: status === 'UNWIRED'
          ? 'DECISION_REQUIRED: add actor/condition/formula/precedence and a two-civilization behavior assertion before wiring.'
          : 'civ-matrix-semantic-labels-test.cjs covers status, direction, coverage, and presentation contract.',
        saveMigration: 'No semantic labels are persisted; recompute from raw matrix on render.',
      },
      normalCells: cells,
      greeceCell,
    };
  });
  const sourcePaths = [
    'gra/data/civ-matrix.json',
    'gra/src/game/civ-matrix.ts',
    'gra/src/game/civ-matrix-semantic.ts',
    'gra/src/ui/newGameFlow.ts',
    'gra/tools/civ-matrix-semantic-labels-test.cjs',
    'gra/src/game/civ-ai-data.ts',
    'gra/src/game/diplomacy.ts',
    'gra/src/game/diplomacy-display.ts',
    'gra/src/game/population-growth-v85.ts',
  ];
  const sourceHashes = Object.fromEntries(sourcePaths.map(relative => [relative, sha256(path.join(repoRoot, relative))]));
  const allocation = {
    schemaVersion: '1.0',
    report: {
      status: Object.keys(parameterStatusCounts).some(status => status === 'UNWIRED') ? 'DECISION_REQUIRED' : 'PASS',
      domain: 'GAME',
      topic: 'R-CYWILIZACJE-MACIERZ-SEMANTYKA-LABELS-IMPLEMENTACJA-Q1',
      baseSha: process.env.CIV_MATRIX_BASE_SHA || 'f4c89d0081c622c16b207d338b49c8bacafc4553',
      generatedFrom: 'current worktree; static scan excludes generic helper and semantic classifier',
    },
    scope: {
      parameterCount: Object.keys(matrix.paramDefs).length,
      civilizationCount: matrix.cywilizacje.length,
      expectedCells: Object.keys(matrix.paramDefs).length * matrix.cywilizacje.length,
      actualCells: snapshot.cells.length,
      profiles: matrix.cywilizacje.map(row => ({ id: row.ikonaId, name: row.Cywilizacja, tier: row.tier })),
      parameterStatusCounts,
      cellStatusCounts: statusCounts,
      decisionRequiredParameters: parameters.filter(parameter => parameter.decisionRequired).map(parameter => parameter.parameterId),
      decisionRequiredRows: parameters
        .filter(parameter => parameter.decisionRequired)
        .map(parameter => ({ id: parameter.decisionRequiredId, parameterId: parameter.parameterId })),
    },
    sourceHashes,
    contract: {
      semanticDifficulty: 'Normal only',
      baseline: 'median of all 15 civilizations per parameter',
      badgeLabels: ['POZYTYWNY', 'NEGATYWNY'],
      exactMedian: 'POZYTYWNY 1',
      neutralProfileRows: 'AI/relations/descriptive fields use NEUTRALNY badge and separate explanation',
      signedIntensity: 'polarity-corrected distance / most extreme distance × 10, bounded -10..+10; exact median +1',
      missingValue: 'BLOCKED with explicit reason; never Greece fallback',
      persistence: 'derived only; never save semantic labels',
    },
    parameters,
    cells: snapshot.cells,
    coverage: {
      expectedCells: snapshot.expectedCellCount,
      actualCells: snapshot.cells.length,
      uniqueCells: new Set(snapshot.cells.map(cell => `${cell.civilizationId}/${cell.parameterId}`)).size,
      allParameterIdsPresent: parameters.length === 109,
      allCivilizationsPresent: matrix.cywilizacje.length === 15,
    },
  };
  jsonWrite(path.join(dir, '01-allocation.json'), allocation);

  const semanticContract = {
    schemaVersion: '1.0',
    topic: 'R-CYWILIZACJE-MACIERZ-SEMANTYKA-LABELS-IMPLEMENTACJA-Q1',
    implementation: 'gra/src/game/civ-matrix-semantic.ts',
    semanticVersion: 'normal-median-signed-v1',
    source: 'gra/data/civ-matrix.json',
    sourceHashes,
    computation: {
      rawValue: 'Normal value from selected civilization row; missing values are BLOCKED',
      baselineValue: 'median of all 15 civilization values for the same parameter',
      polarity: 'beneficial / harmful / neutral-not-applicable, parameter-specific',
      directionalDelta: 'beneficial: raw - median; harmful: median - raw',
      exactMedian: { label: 'POZYTYWNY', signedIntensity: 1 },
      signedIntensity: 'round2(clamp(delta / max(abs(max-median), abs(min-median)) * 10, -10, +10))',
      neutralProfileFields: 'NEUTRALNY / 0 intensity with separate AI or relations explanation',
    },
    statusPolicy: {
      REAL_GAMEPLAY: 'active consumer; compare directionally and disclose active status',
      UI_ONLY: 'neutral badge; relations/profile explanation only',
      UNWIRED: 'relative display is explicitly marked inactive; no gameplay effect; numbered DECISION_REQUIRED row',
      BLOCKED: 'neutral badge and explicit missing/unknown reason; no fallback',
    },
    ui: {
      location: 'newGameFlow.ts civilization selection detail',
      default: 'REAL_GAMEPLAY rows visible',
      expandable: 'one details control contains every non-active row',
      controls: ['search', 'status/label filter', 'native details expand'],
      accessibility: 'literal badge/status text and aria-labels; not color-only',
      difficulty: 'Normal identity only; no Easy/Hard labels in this panel',
    },
    coverage: { parameters: 109, civilizations: 15, cells: 1635 },
    decisionRequired: allocation.scope.decisionRequiredRows,
  };
  jsonWrite(path.join(dir, '01-semantic-contract.json'), semanticContract);

  const provenanceLines = [
    '# 01-consumer-provenance — Greece precedent and exact call-sites',
    '',
    `Base: ${allocation.report.baseSha}`,
    `Źródło macierzy: gra/data/civ-matrix.json (${sourceHashes['gra/data/civ-matrix.json']})`,
    '',
    'Skan exact parameter-ID w gra/src/**/*.ts, z wyłączeniem civ-matrix.ts i civ-matrix-semantic.ts. Samo pole modul, loader albo adapter bez wywołania nie jest konsumentem.',
    '',
    '| # | Parametr | Status | Greece precedent / call-sites | Następny krok |',
    '|---:|---|---|---|---|',
  ];
  parameters.forEach((parameter, index) => {
    const sites = parameter.exactRuntimeCallSites.length > 0 ? parameter.exactRuntimeCallSites.join('<br>') : 'brak potwierdzonego call-site';
    const next = parameter.decisionRequired
      ? 'DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji'
      : parameter.consumerStatus === 'UI_ONLY' ? 'utrzymać jako opis UI, bez premii' : 'utrzymać test zachowania i dokumentację trudności';
    provenanceLines.push(`| ${index + 1} | \`${parameter.parameterId}\` | ${parameter.consumerStatus} | ${sites} | ${next} |`);
  });
  provenanceLines.push('', '## Wniosek', '', `Potwierdzone: ${parameterStatusCounts.REAL_GAMEPLAY || 0} REAL_GAMEPLAY + ${parameterStatusCounts.UI_ONLY || 0} UI_ONLY.`, `${parameterStatusCounts.UNWIRED || 0} parametrów pozostaje DECISION_REQUIRED; nie dodano zerowych adapterów ani fikcyjnych efektów.`);
  fs.writeFileSync(path.join(dir, '01-consumer-provenance.md'), `${provenanceLines.join('\n')}\n`, 'utf8');

  const operatorLines = [
    '# 01-operator — semantyczne etykiety macierzy cywilizacji',
    '',
    'STATUS: DECISION_REQUIRED',
    'DOMAIN: GAME',
    'TEMAT: R-CYWILIZACJE-MACIERZ-SEMANTYKA-LABELS-IMPLEMENTACJA-Q1',
    'GOAL: Normal-only semantic profile with signed labels and proven Greece consumers.',
    `BASE: ${allocation.report.baseSha}`,
    `SCOPE: ${snapshot.parameterCount} parametrów × ${snapshot.civilizationCount} cywilizacji = ${snapshot.cells.length} komórek`,
    '',
    '## Wykonano',
    '- Dodano czysty, niemutujący classifier Normal median + signed intensity.',
    '- Dodano pełny profil 109 wierszy w wyborze cywilizacji: aktywne domyślnie, reszta w jednym rozwijanym panelu, wyszukiwanie i filtr.',
    '- Brak fallbacku do Grecji dla nieznanej cywilizacji lub brakującej wartości.',
    '- AI/relacje pozostają neutralnym badge z osobnym statusem/opisem.',
    '- Etykiety nie są zapisywane w stanie gry ani w sejwie.',
    '',
    '## Bramki konsumentów',
    `- REAL_GAMEPLAY: ${parameterStatusCounts.REAL_GAMEPLAY || 0} parametrów / ${(statusCounts.REAL_GAMEPLAY || 0)} komórek.`,
    `- UI_ONLY: ${parameterStatusCounts.UI_ONLY || 0} parametrów / ${(statusCounts.UI_ONLY || 0)} komórek.`,
    `- DECISION_REQUIRED/UNWIRED: ${parameterStatusCounts.UNWIRED || 0} parametrów / ${(statusCounts.UNWIRED || 0)} komórek.`,
    '- Dla każdego UNWIRED w allocation.json zapisano aktora, warunek, formułę, precedencję i test jako nierozstrzygnięte; nie wymyślono konsumenta.',
    '',
    '## Status per parametr',
    '| # | Parametr | Status | Polaryzacja | Greece call-site |',
    '|---:|---|---|---|---|',
  ];
  parameters.forEach((parameter, index) => operatorLines.push(`| ${index + 1} | \`${parameter.parameterId}\` | ${parameter.consumerStatus}${parameter.decisionRequired ? ` / ${parameter.decisionRequiredId}` : ''} | ${parameter.polarity} | ${parameter.exactRuntimeCallSites.join('<br>') || 'brak'} |`));
  operatorLines.push('', '## Dowód', '- `01-allocation.json` zawiera 109 parametrów, 1635 unikalnych komórek oraz statusy.', '- `01-semantic-contract.json` zawiera wzór mediany, polaryzacji, intensywności i UI.', '- `01-consumer-provenance.md` zawiera skan call-site’ów i następny krok dla każdego pola.', '', 'DEPLOY/PUSH: NIE WYKONANO');
  fs.writeFileSync(path.join(dir, '01-operator.md'), `${operatorLines.join('\n')}\n`, 'utf8');
}

if (process.env.CIV_MATRIX_ARTIFACT_DIR) {
  generateArtifacts(path.resolve(process.env.CIV_MATRIX_ARTIFACT_DIR));
  console.log(`ARTIFACTS: ${path.resolve(process.env.CIV_MATRIX_ARTIFACT_DIR)}`);
}

fs.rmSync(tempRoot, { recursive: true, force: true });
console.log(`PASS ${passed}; FAIL ${failed}`);
if (failed) process.exit(1);
