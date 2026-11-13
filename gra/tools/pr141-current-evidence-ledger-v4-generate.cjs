'use strict';

// Additive unit-speed current-evidence snapshot. This wrapper reuses only the
// v2 CORE build and v3 read-only semantic/history helpers; it never calls an
// older write path or v3's pre-unit build gates.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const V3 = require('./pr141-current-evidence-ledger-v3-generate.cjs');
const CORE = V3.CORE;
const ROOT = path.resolve(__dirname, '..', '..');
const RUN_REL = 'dyspozycje/autobot/runs/R-PR141-CODEX-F04-PRODUCTION-DECISION-CLOSEOUT-20261018';
const RUN = path.join(ROOT, RUN_REL);
const TOPIC = 'R-PR141-CODEX-F04-PRODUCTION-DECISION-CLOSEOUT-20261018';
const UNIT_ID = 'prod_szybkosc_jednostki_proc';
const UNIT_GROUP = 'UNIT_SPEED';
const V3_RUN_REL = 'dyspozycje/autobot/runs/R-PR141-CODEX-CURRENT-EVIDENCE-LEDGER-20261018';
const V3_LEDGER_REL = `${V3_RUN_REL}/evidence/matrix-93x15-current-evidence-ledger-v3.json`;
const V3_MANIFEST_REL = `${V3_RUN_REL}/evidence/source-manifest-v3.json`;
const V3_EVALUATOR_REL = `${V3_RUN_REL}/10-v3-evaluator-recheck-r4.md`;
const V3_FINAL_CONTROL_REL = `${V3_RUN_REL}/11-v3-final-control.md`;
const V3_INTEGRATION_REL = `${V3_RUN_REL}/12-v3-integration.md`;
const UNIT_RUN = 'R-PR141-CODEX-F04-PRODUCTION-ACTIVATION-20261018';
const UNIT_DECISION_RUN = 'R-PR141-CODEX-F04-PRODUCTION-REMAINING-DECISIONS-20261018';
const UNIT_INTEGRATION = `${UNIT_RUN}/12-unit-speed-integration.md`;
const UNIT_FINAL_CONTROL = `${UNIT_RUN}/11-unit-speed-final-control.md`;
const UNIT_OPERATOR = `${UNIT_RUN}/08-unit-speed-operator.md`;
const UNIT_ADDENDUM = `${UNIT_RUN}/09-unit-speed-fixture-addendum.md`;
const UNIT_EVALUATOR = `${UNIT_RUN}/10-unit-speed-evaluator.md`;
const UNIT_TEST = 'gra/tools/pr141-f04-unit-speed-activation-test.cjs';
const D10_TEST = 'gra/tools/ai-jednostki-tylko-zakup-test.cjs';
const UNIT_RUN_ROOT_REL = `dyspozycje/autobot/runs/${UNIT_RUN}`;
const UNIT_INTEGRATION_ROOT_REL = `${UNIT_RUN_ROOT_REL}/12-unit-speed-integration.md`;
const UNIT_FINAL_CONTROL_ROOT_REL = `${UNIT_RUN_ROOT_REL}/11-unit-speed-final-control.md`;
const CLOSEOUT_DISPATCH = `${RUN_REL}/00-dispatch.md`;
const GO_AMENDMENT = `${RUN_REL}/00-root-go-amendment.md`;
const OUTPUT_MANIFEST_REL = `${RUN_REL}/evidence/source-manifest-v4.json`;
const OUTPUT_LEDGER_REL = `${RUN_REL}/evidence/matrix-93x15-current-evidence-ledger-v4.json`;

CORE.ACCEPTED[UNIT_ID] = UNIT_GROUP;
CORE.INTEGRATIONS[UNIT_GROUP] = [UNIT_INTEGRATION, UNIT_FINAL_CONTROL, UNIT_TEST];

const SOURCE_PATHS = [...new Set([
  ...CORE.SOURCE_PATHS,
  V3_LEDGER_REL,
  V3_MANIFEST_REL,
  V3_EVALUATOR_REL,
  V3_FINAL_CONTROL_REL,
  V3_INTEGRATION_REL,
  'docs/decyzje/R-PR141-CODEX-F04-PRODUCTION-REMAINING-DECISIONS-20261018.md',
  ...['00-dispatch.md', '01-operator.md', '02-evaluator.md', '03-final-control.md', '04-integration.md']
    .map(file => `dyspozycje/autobot/runs/${UNIT_DECISION_RUN}/${file}`),
  `${UNIT_RUN_ROOT_REL}/00-dispatch.md`,
  `${UNIT_RUN_ROOT_REL}/08-unit-speed-operator.md`,
  `${UNIT_RUN_ROOT_REL}/09-unit-speed-fixture-addendum.md`,
  `${UNIT_RUN_ROOT_REL}/10-unit-speed-evaluator.md`,
  UNIT_FINAL_CONTROL_ROOT_REL,
  UNIT_INTEGRATION_ROOT_REL,
  UNIT_TEST,
  D10_TEST,
  CLOSEOUT_DISPATCH,
  GO_AMENDMENT,
  'gra/tools/pr141-current-evidence-ledger-v4-generate.cjs',
  'gra/tools/pr141-current-evidence-ledger-v4-test.cjs',
])].sort();

function shaBytes(bytes) { return crypto.createHash('sha256').update(bytes).digest('hex'); }
function shaFile(abs) { return shaBytes(fs.readFileSync(abs)); }
function absolute(rel) {
  if (typeof rel !== 'string' || !rel || path.isAbsolute(rel) || rel.split(/[\\/]/).includes('..')) throw new Error(`unsafe repository-relative source path: ${rel}`);
  const abs = path.resolve(ROOT, rel);
  if (!abs.startsWith(`${ROOT}${path.sep}`)) throw new Error(`source path escapes repository: ${rel}`);
  return abs;
}
function validateInputs() {
  CORE.validateInputs();
  const accepted = path.resolve(ROOT, UNIT_INTEGRATION_ROOT_REL);
  const finalControl = path.resolve(ROOT, UNIT_FINAL_CONTROL_ROOT_REL);
  if (!fs.existsSync(accepted) || !/DECISION:\s*ACCEPTED_LOCAL_BOUNDED/.test(fs.readFileSync(accepted, 'utf8'))) throw new Error('unit-speed root integration is absent or not accepted');
  if (!fs.existsSync(finalControl) || !/STATUS:\s*PASS/.test(fs.readFileSync(finalControl, 'utf8'))) throw new Error('unit-speed Final Control is absent or not PASS');
  const go = fs.readFileSync(path.resolve(ROOT, GO_AMENDMENT), 'utf8');
  if (!go.includes('ID-level unit-speed receipt') || !go.includes('do not call v3 build/write functions')) throw new Error('dated v4 GO amendment is missing required scope gates');
  for (const rel of SOURCE_PATHS) if (!fs.existsSync(absolute(rel))) throw new Error(`missing v4 source closure input: ${rel}`);
  for (const rel of [V3_LEDGER_REL, V3_MANIFEST_REL, V3_EVALUATOR_REL, V3_FINAL_CONTROL_REL, V3_INTEGRATION_REL]) {
    if (!fs.existsSync(absolute(rel))) throw new Error(`missing frozen v3 acceptance history: ${rel}`);
  }
  const v3Integration = fs.readFileSync(absolute(V3_INTEGRATION_REL), 'utf8');
  if (!/DECISION:\s*ACCEPTED_LOCAL_BOUNDED/.test(v3Integration)) throw new Error('v3 root integration history is not accepted');
  return true;
}

function v3History() {
  const manifestBytes = fs.readFileSync(absolute(V3_MANIFEST_REL));
  const ledgerBytes = fs.readFileSync(absolute(V3_LEDGER_REL));
  const manifest = JSON.parse(manifestBytes.toString('utf8'));
  const ledger = JSON.parse(ledgerBytes.toString('utf8'));
  return {
    status: 'IMMUTABLE_ROOT_INTEGRATED_HISTORICAL_SNAPSHOT',
    source_manifest: { path: V3_MANIFEST_REL, sha256: shaBytes(manifestBytes), recorded_source_path_count: Object.keys(manifest.files || {}).length },
    ledger: { path: V3_LEDGER_REL, sha256: shaBytes(ledgerBytes), recorded_raw_cells: ledger.cells.length },
    evaluator: V3_EVALUATOR_REL,
    final_control: V3_FINAL_CONTROL_REL,
    integration: V3_INTEGRATION_REL,
    note: 'The v3 snapshot predates accepted unit-speed source changes; its bytes and recorded pre-unit hashes are preserved as historical evidence.',
  };
}

function buildV4() {
  validateInputs();
  const ledger = CORE.build();
  const snapshot = V3.buildCurrentSemanticSnapshot();
  const semanticByKey = new Map(snapshot.cells.map(cell => [`${cell.parameterId}/${cell.civilizationId}`, cell]));
  if (semanticByKey.size !== ledger.cells.length) throw new Error('v4 semantic and ledger cell inventories differ');
  for (const cell of ledger.cells) {
    const key = `${cell.parameter_id}/${cell.civilization_id}`;
    const semantic = semanticByKey.get(key);
    if (!semantic) throw new Error(`missing live semantic cell: ${key}`);
    cell.semantic.polarity = semantic.polarity;
    cell.semantic.statusReasonPl = semantic.statusReasonPl;
    cell.semantic.status = semantic.consumerStatus;
    cell.consumer.current_status = semantic.consumerStatus;
  }

  const realIds = new Set(ledger.cells.filter(cell => cell.consumer.current_status === 'REAL_GAMEPLAY').map(cell => cell.parameter_id));
  const realCells = ledger.cells.filter(cell => cell.consumer.current_status === 'REAL_GAMEPLAY');
  const oldRealIds = new Set(JSON.parse(fs.readFileSync(absolute(V3_LEDGER_REL), 'utf8')).cells
    .filter(cell => cell.consumer.current_status === 'REAL_GAMEPLAY').map(cell => cell.parameter_id));
  for (const id of oldRealIds) if (!realIds.has(id)) throw new Error(`accepted prior REAL_GAMEPLAY ID removed: ${id}`);
  if (!realIds.has(UNIT_ID)) throw new Error('accepted unit-speed consumer is not REAL_GAMEPLAY in current semantic API');
  if (realIds.has('prod_rush_koszt_proc')) throw new Error('unresolved rush consumer unexpectedly promoted');
  if (ledger.bounded_behavior_receipts.length !== Object.keys(CORE.ACCEPTED).length) throw new Error('bounded ID receipt inventory mismatch');
  const unitReceipt = ledger.bounded_behavior_receipts.find(item => item.parameter_id === UNIT_ID);
  if (!unitReceipt) throw new Error('unit-speed bounded ID receipt is missing');
  unitReceipt.evidence_ceiling = 'bounded actual-source owner routing and integer-capacity behavior; 15 source values are zero; no per-cell behavior PASS or full turn runtime claim';
  unitReceipt.behavioral_owner_ai = 'human and AI owner routing exercised in bounded test; no per-cell or all-civilization parity claim';
  unitReceipt.runtime = 'NOT_VERIFIED';
  unitReceipt.browser = 'NOT_VERIFIED';
  unitReceipt.save_load = 'NOT_VERIFIED';
  unitReceipt.difficulty = 'NOT_VERIFIED';

  const statusCounts = {};
  for (const cell of ledger.cells) statusCounts[cell.consumer.current_status] = (statusCounts[cell.consumer.current_status] || 0) + 1;
  const expectedTotal = Object.keys(JSON.parse(fs.readFileSync(absolute('gra/data/civ-matrix.json'), 'utf8')).paramDefs).length
    * JSON.parse(fs.readFileSync(absolute('gra/data/civ-matrix.json'), 'utf8')).cywilizacje.length;
  const candidateScopedCells = realIds.size * snapshot.civilizationCount;
  if (ledger.cells.length !== expectedTotal || expectedTotal !== 1395) throw new Error(`unexpected matrix total: ${ledger.cells.length}/${expectedTotal}`);
  if (ledger.counts.effective_raw_approval_cells !== 360) throw new Error('canonical raw approval count must remain exactly 360');
  if (realIds.size !== oldRealIds.size + 1 || realCells.length !== 1019) throw new Error(`unexpected accepted semantic scope: ${realIds.size} IDs / ${realCells.length} active cells`);
  const blocked = ledger.cells.filter(cell => cell.consumer.current_status === 'BLOCKED');
  const egypt = ledger.cells.find(cell => cell.parameter_id === 'walka_ruch_bitwa_proc' && cell.civilization_id === 'egipt');
  if (!egypt || egypt.raw_value !== 0.15 || egypt.consumer.current_status !== 'BLOCKED' || !/decyzj.{0,8}właściciela 1B/i.test(egypt.semantic.statusReasonPl)) throw new Error('Egypt 1B BLOCKED reason/status changed');
  if (blocked.length !== 1) throw new Error(`unexpected BLOCKED inventory: ${blocked.length}`);
  const rushCells = ledger.cells.filter(cell => cell.parameter_id === 'prod_rush_koszt_proc');
  if (rushCells.some(cell => cell.consumer.current_status !== 'UNWIRED' || cell.semantic.polarity !== 'harmful')) throw new Error('unresolved rush semantics/status changed');

  ledger.schema_version = 4;
  ledger.topic_id = TOPIC;
  ledger.round = '1/5 implementation after unit-speed acceptance; new closeout topic, v3 history preserved';
  ledger.scope = 'Current evidence synchronization with one newly accepted unit-speed bounded consumer; no whole-runtime/product acceptance.';
  ledger.source_manifest = 'source-manifest-v4.json';
  ledger.counts.current_real_gameplay_cells = realCells.length;
  ledger.counts.current_real_gameplay_parameter_ids = realIds.size;
  ledger.counts.accepted_consumer_candidate_ids = Object.keys(CORE.ACCEPTED).length;
  ledger.counts.accepted_id_scoped_cells = candidateScopedCells;
  ledger.counts.full_matrix_cells = ledger.cells.length;
  ledger.history = {
    ...ledger.history,
    v3_snapshot: v3History(),
    unit_speed_acceptance: {
      status: 'ROOT_ACCEPTED_LOCAL_BOUNDED',
      owner_decision: 'docs/decyzje/R-PR141-CODEX-F04-PRODUCTION-REMAINING-DECISIONS-20261018.md',
      operator: `${UNIT_RUN_ROOT_REL}/08-unit-speed-operator.md`,
      fixture_addendum: `${UNIT_RUN_ROOT_REL}/09-unit-speed-fixture-addendum.md`,
      evaluator: `${UNIT_RUN_ROOT_REL}/10-unit-speed-evaluator.md`,
      final_control: UNIT_FINAL_CONTROL_ROOT_REL,
      integration: UNIT_INTEGRATION_ROOT_REL,
      focused_test: UNIT_TEST,
      d10_guard_test: D10_TEST,
      contract: 'floor integer capacity each turn without fractional carry; disabled zero base remains zero; actual root-approved helper preserves the documented positive-base minimum-one behavior',
      evidence_ceiling: unitReceipt.evidence_ceiling,
    },
  };
  ledger.acceptance_ceiling = {
    ...ledger.acceptance_ceiling,
    runtime: 'NOT_VERIFIED', browser: 'NOT_VERIFIED', save_load: 'NOT_VERIFIED', difficulty: 'NOT_VERIFIED',
    owner_ai: 'NOT_VERIFIED_PER_CELL', product_93x15: 'NOT_VERIFIED',
  };
  ledger.counts.current_consumer_classifications = statusCounts;
  ledger.counts.raw_cells = ledger.cells.length;
  ledger.counts.semantic_cells = snapshot.cells.length;
  ledger.counts.resulting_real_gameplay_ids = realIds.size;
  if (ledger.bounded_behavior_receipts.length !== 35 || candidateScopedCells !== realIds.size * snapshot.civilizationCount) throw new Error('unexpected accepted ID-level evidence totals');
  return { ledger, snapshot, candidateScopedCells, v3: v3History() };
}

function buildManifest() {
  validateInputs();
  const files = Object.fromEntries(SOURCE_PATHS.map(rel => [rel, shaFile(absolute(rel))]));
  return {
    schema_version: 4,
    topic_id: TOPIC,
    generated_after_source_freeze: true,
    historical_v3: v3History(),
    source_scope: 'Preserved v3 80-path closure at current bytes plus exact unit acceptance and immutable v3 acceptance-history pins; bounded accepted-consumer evidence, not a whole-app runtime freeze.',
    files,
  };
}

function verifyManifest(manifest, contentOverrides = {}) {
  if (manifest?.schema_version !== 4 || manifest?.topic_id !== TOPIC) throw new Error('v4 manifest schema/topic mismatch');
  if (manifest?.generated_after_source_freeze !== true) throw new Error('v4 manifest was not marked frozen');
  if (JSON.stringify(manifest.historical_v3) !== JSON.stringify(v3History())) throw new Error('v3 historical artifact pins changed');
  const expected = [...SOURCE_PATHS].sort();
  const actual = Object.keys(manifest?.files || {}).sort();
  if (JSON.stringify(expected) !== JSON.stringify(actual)) throw new Error('v4 source manifest closure mismatch');
  for (const rel of SOURCE_PATHS) {
    const bytes = Object.prototype.hasOwnProperty.call(contentOverrides, rel)
      ? Buffer.from(contentOverrides[rel]) : fs.readFileSync(absolute(rel));
    if (shaBytes(bytes) !== manifest.files[rel]) throw new Error(`v4 source hash mismatch: ${rel}`);
  }
  if (SOURCE_PATHS.includes(OUTPUT_MANIFEST_REL) || SOURCE_PATHS.includes(OUTPUT_LEDGER_REL)) throw new Error('v4 output self-hash loop');
  return true;
}

function writeV4() {
  const { ledger } = buildV4();
  const manifest = buildManifest();
  verifyManifest(manifest);
  const evidenceDir = path.join(RUN, 'evidence');
  fs.mkdirSync(evidenceDir, { recursive: true });
  ledger.source_manifest = 'source-manifest-v4.json';
  fs.writeFileSync(path.join(evidenceDir, 'source-manifest-v4.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  fs.writeFileSync(path.join(evidenceDir, 'matrix-93x15-current-evidence-ledger-v4.json'), `${JSON.stringify(ledger, null, 2)}\n`);
  return { manifest, ledger };
}

if (require.main === module) {
  const result = writeV4();
  console.log(JSON.stringify({ counts: result.ledger.counts, sourcePathCount: Object.keys(result.manifest.files).length }, null, 2));
}

module.exports = { CORE, V3, SOURCE_PATHS, UNIT_ID, RUN, RUN_REL, OUTPUT_LEDGER_REL, OUTPUT_MANIFEST_REL, buildV4, buildManifest, verifyManifest, writeV4 };
