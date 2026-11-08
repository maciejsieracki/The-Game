'use strict';

// Additive v3 snapshot wrapper. It reuses the frozen v2 generator's inventory and
// receipt machinery in memory, but writes only v3-named artifacts.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const CORE = require('./pr141-current-evidence-ledger-generate.cjs');

const ROOT = path.resolve(__dirname, '..', '..');
const RUN = path.join(ROOT, 'dyspozycje/autobot/runs/R-PR141-CODEX-CURRENT-EVIDENCE-LEDGER-20261018');
const SEMANTIC_RUN = 'R-PR141-CODEX-SEMANTIC-CONSUMER-CONSISTENCY-20261018';
const SEMANTIC_DIR = `dyspozycje/autobot/runs/${SEMANTIC_RUN}`;
const APPROVED_IDS = [
  'walka_ruch_bitwa_proc',
  'walka_ruch_rydwany',
  'walka_ruch_piechota_teren_plytkie_morze',
  'walka_koszt_rekrutacji_proc',
];
const SEMANTIC_GROUP = 'SEMANTIC_CONSISTENCY';
const BASE_SOURCE_PATHS = [...CORE.SOURCE_PATHS];
const SOURCE_HISTORY_INDEX_REL = 'dyspozycje/autobot/runs/R-PR141-CODEX-CURRENT-EVIDENCE-LEDGER-20261018/evidence/source-history/source-history-index.json';
const EXPECTED_HISTORY = [
  {
    original_path: '/workspace/handoff-pr141/owner-decisions/26-owner-decisions-20261015.md',
    original_sha256: 'd6e8205e4f3ab76192d67135ff55e590bf77094d4d91a2072ee379115b273328',
    copy_path: 'dyspozycje/autobot/runs/R-PR141-CODEX-CURRENT-EVIDENCE-LEDGER-20261018/evidence/source-history/26-owner-decisions-20261015.md',
  },
  {
    original_path: '/workspace/pr141-review/review-f05.md',
    original_sha256: '0c3d595927c157d92cbcdef03820ea048a4e688c3b3351f0ca25c180bb4c6b04',
    copy_path: 'dyspozycje/autobot/runs/R-PR141-CODEX-CURRENT-EVIDENCE-LEDGER-20261018/evidence/source-history/review-f05.md',
  },
  {
    original_path: '/workspace/pr141-review/review-g11.md',
    original_sha256: 'ed4295a5d6b6cd93ca51d6bb530b5896d899aa7dbe7cb1ff88343d4b3b25e906',
    copy_path: 'dyspozycje/autobot/runs/R-PR141-CODEX-CURRENT-EVIDENCE-LEDGER-20261018/evidence/source-history/review-g11.md',
  },
];
const SEMANTIC_INPUTS = [
  `${SEMANTIC_DIR}/00-dispatch.md`,
  `${SEMANTIC_DIR}/01-operator.md`,
  `${SEMANTIC_DIR}/02-evaluator.md`,
  `${SEMANTIC_DIR}/03-defense.md`,
  `${SEMANTIC_DIR}/04-evaluator-recheck.md`,
  `${SEMANTIC_DIR}/05-defense-r3.md`,
  `${SEMANTIC_DIR}/06-evaluator-recheck-r3.md`,
  `${SEMANTIC_DIR}/07-final-control.md`,
  `${SEMANTIC_DIR}/08-integration.md`,
];
const EXTRA_SOURCE_PATHS = [
  'gra/tools/pr141-current-evidence-ledger-v3-generate.cjs',
  'gra/tools/pr141-current-evidence-ledger-v3-test.cjs',
  'gra/src/game/embarkation.ts',
  'gra/tools/pr141-semantic-consumer-consistency-test.cjs',
  'dyspozycje/autobot/runs/R-PR141-CODEX-CURRENT-EVIDENCE-LEDGER-20261018/06-v3-dispatch-proposal.md',
  ...SEMANTIC_INPUTS,
  'dyspozycje/autobot/runs/R-PR141-CODEX-CURRENT-EVIDENCE-LEDGER-20261018/evidence/source-manifest.json',
  'dyspozycje/autobot/runs/R-PR141-CODEX-CURRENT-EVIDENCE-LEDGER-20261018/evidence/matrix-93x15-current-evidence-ledger-v2.json',
  'dyspozycje/autobot/runs/R-PR141-CODEX-EVIDENCE-LEDGER-20261017/evidence/matrix-93x15-evidence-ledger.json',
  SOURCE_HISTORY_INDEX_REL,
  ...EXPECTED_HISTORY.map(entry => entry.copy_path),
  'dyspozycje/autobot/runs/R-CYWILIZACJE-MACIERZ-EKO-WEALTH-MANPOWER-SPOL-PROD-REBASE-Q1-20260925/attempt-codex-f05-20261017/01-operator.md',
  'dyspozycje/autobot/runs/R-CYWILIZACJE-MACIERZ-EKO-WEALTH-MANPOWER-SPOL-PROD-REBASE-Q1-20260925/attempt-codex-g11-20261017/01-operator.md',
];

Object.assign(CORE.ACCEPTED, Object.fromEntries(APPROVED_IDS.map(id => [id, SEMANTIC_GROUP])));
CORE.INTEGRATIONS[SEMANTIC_GROUP] = [
  `${SEMANTIC_RUN}/08-integration.md`,
  `${SEMANTIC_RUN}/07-final-control.md`,
  'gra/tools/pr141-semantic-consumer-consistency-test.cjs',
];
for (const rel of EXTRA_SOURCE_PATHS) if (!CORE.SOURCE_PATHS.includes(rel)) CORE.SOURCE_PATHS.push(rel);

const V3_LEDGER_REL = 'dyspozycje/autobot/runs/R-PR141-CODEX-CURRENT-EVIDENCE-LEDGER-20261018/evidence/matrix-93x15-current-evidence-ledger-v3.json';
const V3_MANIFEST_REL = 'dyspozycje/autobot/runs/R-PR141-CODEX-CURRENT-EVIDENCE-LEDGER-20261018/evidence/source-manifest-v3.json';
const V2_LEDGER_REL = 'dyspozycje/autobot/runs/R-PR141-CODEX-CURRENT-EVIDENCE-LEDGER-20261018/evidence/matrix-93x15-current-evidence-ledger-v2.json';
const V2_MANIFEST_REL = 'dyspozycje/autobot/runs/R-PR141-CODEX-CURRENT-EVIDENCE-LEDGER-20261018/evidence/source-manifest.json';
const V1_LEDGER_REL = 'dyspozycje/autobot/runs/R-PR141-CODEX-EVIDENCE-LEDGER-20261017/evidence/matrix-93x15-evidence-ledger.json';
const EXPECTED_V1_SHA256 = 'eb525a44822569139bcb902300dd3e9dcc3af7f2b4c1ebfcec37f84c58544be6';
const EXPECTED_V2_MANIFEST_SHA256 = 'e902337973b8d74c60424f0a33ce1d57c082c48e12d9adafefb9d137530fbf9d';
const EXPECTED_V2_LEDGER_SHA256 = 'df8741a6b4eca0064e2f4f7c84f8147f2cdec86353a6bff825c71e1eddc4cd68';

function sha(buffer) { return crypto.createHash('sha256').update(buffer).digest('hex'); }
function shaFile(abs) { return sha(fs.readFileSync(abs)); }

function isRepoRelativePath(rel) {
  if (typeof rel !== 'string' || !rel || path.isAbsolute(rel) || rel.split(/[\\/]/).includes('..')) return false;
  const resolved = path.resolve(ROOT, rel);
  return resolved === ROOT || resolved.startsWith(`${ROOT}${path.sep}`);
}

function validateHistoryIndex(index, contentOverrides = {}) {
  if (index?.schema_version !== 1 || index.source_history_only !== true || index.new_owner_decision !== false) throw new Error('source-history index purpose/schema mismatch');
  if (index.recorded_date !== '2026-10-18') throw new Error('source-history index date mismatch');
  if (!Array.isArray(index.entries) || index.entries.length !== EXPECTED_HISTORY.length) throw new Error('source-history index entry count mismatch');
  const seen = new Set();
  for (const [i, expected] of EXPECTED_HISTORY.entries()) {
    const entry = index.entries[i];
    if (!entry || entry.original_path !== expected.original_path || entry.original_sha256 !== expected.original_sha256 || entry.copy_path !== expected.copy_path) throw new Error(`source-history provenance index mismatch at entry ${i}`);
    if (!isRepoRelativePath(entry.copy_path) || !CORE.SOURCE_PATHS.includes(entry.copy_path) || seen.has(entry.copy_path)) throw new Error(`unsafe or duplicate source-history copy path: ${entry.copy_path}`);
    seen.add(entry.copy_path);
    if (entry.copy_sha256 !== entry.original_sha256) throw new Error(`source-history copy/original digest mismatch: ${entry.copy_path}`);
    const bytes = Object.prototype.hasOwnProperty.call(contentOverrides, entry.copy_path)
      ? Buffer.from(contentOverrides[entry.copy_path])
      : fs.readFileSync(path.resolve(ROOT, entry.copy_path));
    if (sha(bytes) !== entry.original_sha256) throw new Error(`source-history copy bytes mismatch: ${entry.copy_path}`);
  }
  return true;
}

function verifyV3Manifest(manifest, contentOverrides = {}) {
  for (const rel of Object.keys(manifest?.files || {})) if (!isRepoRelativePath(rel)) throw new Error(`source manifest path escapes repository: ${rel}`);
  return CORE.verifyManifest(manifest, contentOverrides);
}

function buildCurrentSemanticSnapshot() {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'pr141-current-ledger-v3-semantic-'));
  const entry = path.join(temp, 'semantic-entry.ts');
  const bundle = path.join(temp, 'semantic-bundle.cjs');
  try {
    fs.writeFileSync(entry, `export {buildCivMatrixSemanticSnapshot} from ${JSON.stringify(path.join(ROOT, 'gra/src/game/civ-matrix-semantic'))};\n`);
    esbuild.buildSync({
      entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
      outfile: bundle, absWorkingDir: path.join(ROOT, 'gra'), logLevel: 'silent',
    });
    const loaded = require(bundle);
    return loaded.buildCivMatrixSemanticSnapshot();
  } finally {
    delete require.cache[require.resolve(bundle)];
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

function verifyPreconditions() {
  CORE.validateInputs();
  const historyIndex = JSON.parse(fs.readFileSync(path.resolve(ROOT, SOURCE_HISTORY_INDEX_REL), 'utf8'));
  validateHistoryIndex(historyIndex);
  const integration = path.join(ROOT, 'dyspozycje/autobot/runs', `${SEMANTIC_RUN}/08-integration.md`);
  if (!fs.existsSync(integration)) throw new Error(`semantic-consistency root integration is not present: ${SEMANTIC_INPUTS.at(-1)}`);
  const finalControl = path.join(ROOT, 'dyspozycje/autobot/runs', `${SEMANTIC_RUN}/07-final-control.md`);
  const fcText = fs.readFileSync(finalControl, 'utf8');
  if (!/STATUS:\s*PASS/.test(fcText)) throw new Error('semantic-consistency Final Control is not PASS');
  const integrationText = fs.readFileSync(integration, 'utf8');
  if (!/DECISION:\s*ACCEPTED_LOCAL_BOUNDED/.test(integrationText)) throw new Error('semantic-consistency root integration is not accepted');
  for (const rel of CORE.SOURCE_PATHS) if (!fs.existsSync(path.resolve(ROOT, rel))) throw new Error(`missing v3 manifest input: ${rel}`);
  for (const rel of [V1_LEDGER_REL, V2_LEDGER_REL, V2_MANIFEST_REL]) if (!fs.existsSync(path.join(ROOT, rel))) throw new Error(`missing frozen history input: ${rel}`);
  const historyDigests = {
    v1: shaFile(path.join(ROOT, V1_LEDGER_REL)),
    v2Ledger: shaFile(path.join(ROOT, V2_LEDGER_REL)),
    v2Manifest: shaFile(path.join(ROOT, V2_MANIFEST_REL)),
  };
  if (historyDigests.v1 !== EXPECTED_V1_SHA256 || historyDigests.v2Ledger !== EXPECTED_V2_LEDGER_SHA256 || historyDigests.v2Manifest !== EXPECTED_V2_MANIFEST_SHA256) {
    throw new Error(`frozen v1/v2 history hash mismatch: ${JSON.stringify(historyDigests)}`);
  }
  if (BASE_SOURCE_PATHS.length !== 58) throw new Error(`unexpected v2 base closure size: ${BASE_SOURCE_PATHS.length}`);
  const v2Manifest = JSON.parse(fs.readFileSync(path.join(ROOT, V2_MANIFEST_REL), 'utf8'));
  const priorPaths = Object.keys(v2Manifest.files || {}).sort();
  if (JSON.stringify(priorPaths) !== JSON.stringify([...BASE_SOURCE_PATHS].sort())) throw new Error('v3 source closure does not preserve the exact 58-path v2 closure');
  return historyDigests;
}

function buildV3() {
  const historyDigests = verifyPreconditions();
  const ledger = CORE.build();
  const snapshot = buildCurrentSemanticSnapshot();
  const snapshotCells = new Map(snapshot.cells.map(cell => [`${cell.parameterId}/${cell.civilizationId}`, cell]));
  if (snapshotCells.size !== ledger.cells.length) throw new Error('semantic snapshot and ledger cell inventories differ');
  for (const cell of ledger.cells) {
    const key = `${cell.parameter_id}/${cell.civilization_id}`;
    const semantic = snapshotCells.get(key);
    if (!semantic) throw new Error(`missing current semantic cell: ${key}`);
    cell.semantic.polarity = semantic.polarity;
    cell.semantic.statusReasonPl = semantic.statusReasonPl;
    if (cell.semantic.status !== semantic.consumerStatus || cell.consumer.current_status !== semantic.consumerStatus) {
      throw new Error(`semantic status does not match live snapshot: ${key}`);
    }
  }
  const gameplayIds = new Set(ledger.cells.filter(c => c.consumer.current_status === 'REAL_GAMEPLAY').map(c => c.parameter_id));
  const gameplayCells = ledger.cells.filter(c => c.consumer.current_status === 'REAL_GAMEPLAY').length;
  const expectedCandidateIds = Object.keys(CORE.ACCEPTED).sort();
  for (const id of expectedCandidateIds) if (!gameplayIds.has(id)) throw new Error(`accepted ID has no active cell in current snapshot: ${id}`);
  const egyptCell = ledger.cells.find(c => c.parameter_id === 'walka_ruch_bitwa_proc' && c.civilization_id === 'egipt');
  if (!egyptCell || egyptCell.raw_value !== 0.15 || egyptCell.consumer.current_status !== 'BLOCKED' || !/decyzj.{0,8}właściciela 1B/i.test(egyptCell.semantic.statusReasonPl)) {
    throw new Error('Egypt general movement cell does not preserve explicit 1B BLOCKED precedence');
  }
  ledger.schema_version = 3;
  ledger.topic_id = 'R-PR141-CODEX-CURRENT-EVIDENCE-LEDGER-20261018';
  ledger.round = '4/5 — v3 portability defense; v2 remains immutable history';
  ledger.source_manifest = 'source-manifest-v3.json';
  ledger.counts.current_real_gameplay_cells = gameplayCells;
  ledger.counts.current_real_gameplay_parameter_ids = gameplayIds.size;
  ledger.counts.accepted_consumer_candidate_ids = expectedCandidateIds.length;
  ledger.history = {
    ...ledger.history,
    v1_ledger: { path: V1_LEDGER_REL, sha256: historyDigests.v1, status: 'IMMUTABLE_HISTORICAL_SEED' },
    v2_manifest: { path: V2_MANIFEST_REL, sha256: historyDigests.v2Manifest, status: 'IMMUTABLE_HISTORICAL_SNAPSHOT' },
    v2_ledger: { path: V2_LEDGER_REL, sha256: historyDigests.v2Ledger, status: 'SUPERSEDED_NOT_ROOT_INTEGRATED', reason: 'Historical 63-ID snapshot predates the accepted semantic-consistency corrections; v3 does not rewrite it.' },
    v3_basis: 'Current semantic snapshot; per-cell statuses, status reasons, and polarity are copied from the live semantic API.',
  };
  const expectedCells = ledger.counts.parameter_ids * ledger.counts.civilizations;
  if (ledger.cells.length !== expectedCells || ledger.cells.length !== 1395) throw new Error(`unexpected full cell inventory: ${ledger.cells.length}`);
  if (ledger.counts.effective_raw_approval_cells !== 360) throw new Error('F-04 raw approval count changed from exact 360');
  if (gameplayIds.size !== 67 || gameplayCells !== 1004) throw new Error(`unexpected REAL_GAMEPLAY inventory: ${gameplayIds.size} IDs, ${gameplayCells} cells`);
  return { ledger, historyDigests, snapshot };
}

function writeV3() {
  const { ledger, historyDigests } = buildV3();
  const manifestPathSet = new Set(CORE.SOURCE_PATHS);
  for (const output of [V3_LEDGER_REL, V3_MANIFEST_REL]) if (manifestPathSet.has(output)) throw new Error(`v3 output self-loop in source manifest: ${output}`);
  const files = Object.fromEntries([...manifestPathSet].sort().map(rel => [rel, shaFile(path.resolve(ROOT, rel))]));
  verifyV3Manifest({ files });
  const manifest = {
    schema_version: 3,
    topic_id: 'R-PR141-CODEX-CURRENT-EVIDENCE-LEDGER-20261018',
    generated_after_source_freeze: true,
    historical_inputs: historyDigests,
    files,
  };
  ledger.source_manifest = 'source-manifest-v3.json';
  fs.writeFileSync(path.join(RUN, 'evidence/source-manifest-v3.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  fs.writeFileSync(path.join(RUN, 'evidence/matrix-93x15-current-evidence-ledger-v3.json'), `${JSON.stringify(ledger, null, 2)}\n`);
  return { manifest, ledger };
}

if (require.main === module) {
  const result = writeV3();
  console.log(JSON.stringify({ counts: result.ledger.counts, manifestFiles: Object.keys(result.manifest.files).length }, null, 2));
}

module.exports = {
  CORE, ACCEPTED_IDS: APPROVED_IDS, BASE_SOURCE_PATHS, EXTRA_SOURCE_PATHS, SEMANTIC_INPUTS, EXPECTED_HISTORY,
  V3_LEDGER_REL, V3_MANIFEST_REL, V2_LEDGER_REL, V2_MANIFEST_REL, V1_LEDGER_REL,
  SOURCE_HISTORY_INDEX_REL, buildCurrentSemanticSnapshot, validateHistoryIndex, verifyV3Manifest, verifyPreconditions, buildV3, writeV3,
};
