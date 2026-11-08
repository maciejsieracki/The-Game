'use strict';

const fs = require('node:fs');
const path = require('node:path');
const V3 = require('./pr141-current-evidence-ledger-v3-generate.cjs');
const CORE = V3.CORE;
const ROOT = path.resolve(__dirname, '..', '..');
const RUN = path.join(ROOT, 'dyspozycje/autobot/runs/R-PR141-CODEX-CURRENT-EVIDENCE-LEDGER-20261018');
const LEDGER = JSON.parse(fs.readFileSync(path.join(RUN, 'evidence/matrix-93x15-current-evidence-ledger-v3.json'), 'utf8'));
const MANIFEST = JSON.parse(fs.readFileSync(path.join(RUN, 'evidence/source-manifest-v3.json'), 'utf8'));
const HISTORY_INDEX = JSON.parse(fs.readFileSync(path.join(ROOT, V3.SOURCE_HISTORY_INDEX_REL), 'utf8'));
const MATRIX = JSON.parse(fs.readFileSync(path.join(ROOT, 'gra/data/civ-matrix.json'), 'utf8'));
const RECEIPT = JSON.parse(fs.readFileSync(path.join(ROOT, 'dyspozycje/autobot/runs/R-PR141-CODEX-F04-SOURCE-APPROVAL-20261018/source-approval-receipt.json'), 'utf8'));
const OLD = JSON.parse(fs.readFileSync(path.join(ROOT, V3.V1_LEDGER_REL), 'utf8'));
const V2_LEDGER_BYTES = fs.readFileSync(path.join(ROOT, V3.V2_LEDGER_REL));
const V2_MANIFEST_BYTES = fs.readFileSync(path.join(ROOT, V3.V2_MANIFEST_REL));
const SNAPSHOT = V3.buildCurrentSemanticSnapshot();
const SNAPSHOT_BY_KEY = new Map(SNAPSHOT.cells.map(c => [`${c.parameterId}/${c.civilizationId}`, c]));
const APPROVED_IDS = Object.keys(CORE.ACCEPTED).sort();
const HARMFUL_DISCOUNTS = ['prod_koszt_budynku_proc', 'prod_koszt_jednostki_proc', 'walka_koszt_rekrutacji_proc'];

function assert(ok, message) { if (!ok) throw new Error(message); }
function cellKey(cell) { return `${cell.parameter_id}/${cell.civilization_id}`; }
function validate(ledger) {
  assert(ledger.schema_version === 3, 'wrong v3 schema');
  assert(ledger.topic_id === 'R-PR141-CODEX-CURRENT-EVIDENCE-LEDGER-20261018', 'wrong topic');
  assert(ledger.source_manifest === 'source-manifest-v3.json', 'wrong source-manifest reference');
  assert(ledger.cells.length === ledger.counts.parameter_ids * ledger.counts.civilizations, 'cell count mismatch');
  const byKey = new Map(ledger.cells.map(c => [cellKey(c), c]));
  assert(byKey.size === ledger.cells.length, 'duplicate cell');
  const expectedKeys = new Set(Object.keys(MATRIX.paramDefs).flatMap(id => MATRIX.cywilizacje.map(row => `${id}/${row.ikonaId}`)));
  assert(byKey.size === expectedKeys.size && [...expectedKeys].every(k => byKey.has(k)), 'matrix inventory mismatch');
  assert(ledger.counts.parameter_ids === Object.keys(MATRIX.paramDefs).length && ledger.counts.civilizations === MATRIX.cywilizacje.length, 'declared matrix dimensions mismatch');

  const statusCounts = {};
  for (const row of MATRIX.cywilizacje) for (const id of Object.keys(MATRIX.paramDefs)) {
    const key = `${id}/${row.ikonaId}`;
    const cell = byKey.get(key);
    const snapshot = SNAPSHOT_BY_KEY.get(key);
    assert(cell && snapshot, `missing matrix or semantic cell ${key}`);
    assert(cell.raw_value === row.params[id], `raw value differs from matrix ${key}`);
    assert(cell.semantic.status === snapshot.consumerStatus && cell.consumer.current_status === snapshot.consumerStatus, `current per-cell status differs from semantic API ${key}`);
    assert(cell.semantic.label === snapshot.label, `semantic label differs from semantic API ${key}`);
    assert(cell.semantic.polarity === snapshot.polarity, `semantic polarity differs from semantic API ${key}`);
    assert(cell.semantic.statusReasonPl === snapshot.statusReasonPl, `semantic status reason differs from semantic API ${key}`);
    statusCounts[cell.consumer.current_status] = (statusCounts[cell.consumer.current_status] || 0) + 1;
    assert(cell.consumer.runtime_acceptance === 'NOT_VERIFIED', `unsupported runtime claim ${key}`);
    assert(cell.behavior_receipt.status === 'NO_CELL_LEVEL_BEHAVIOR_RECEIPT_RECORDED', `cell-level behavior PASS is forbidden ${key}`);
    assert(cell.save_load.status === 'NOT_VERIFIED' && cell.browser.status === 'NOT_VERIFIED' && /NOT_VERIFIED/.test(cell.difficulty.status) && /NOT_VERIFIED/.test(cell.owner_ai.status), `unsupported acceptance dimension ${key}`);
  }
  assert(JSON.stringify(Object.fromEntries(Object.entries(statusCounts).sort())) === JSON.stringify(Object.fromEntries(Object.entries(ledger.counts.current_consumer_classifications).sort())), 'consumer status counts mismatch');

  const allReceiptCells = new Map(RECEIPT.cells.map(c => [`${c.parameter_id}/${c.civilization_key}`, c]));
  const approved = ledger.cells.filter(c => c.effective_raw_approval?.status === 'APPROVED_MATCH');
  assert(approved.length === 360 && ledger.counts.effective_raw_approval_cells === 360, 'exact 360 raw approvals required');
  for (const cell of ledger.cells) {
    const key = cellKey(cell);
    const receipt = allReceiptCells.get(key);
    if (receipt) {
      assert(cell.effective_raw_approval?.status === 'APPROVED_MATCH', `receipt cell lacks approval ${key}`);
      assert(cell.effective_raw_approval.approved_value === receipt.approved_source_raw_value && cell.raw_value === receipt.current_raw_value, `approval value mismatch ${key}`);
      assert(cell.effective_raw_approval.owner_approval_ref === receipt.owner_approval_ref, `owner reference mismatch ${key}`);
      assert(cell.effective_raw_approval.source_sha256 === RECEIPT.source.sha256, `source identity mismatch ${key}`);
    } else assert(cell.effective_raw_approval === null, `approval outside receipt scope ${key}`);
  }

  const oldReal = new Set(OLD.cells.filter(c => c.consumer.current_status === 'REAL_GAMEPLAY').map(c => c.parameter_id));
  const realCells = ledger.cells.filter(c => c.consumer.current_status === 'REAL_GAMEPLAY');
  const realIds = new Set(realCells.map(c => c.parameter_id));
  for (const id of oldReal) assert(realIds.has(id), `baseline REAL_GAMEPLAY ID removed ${id}`);
  for (const id of APPROVED_IDS) assert(realIds.has(id), `accepted consumer ID lacks active cell ${id}`);
  assert(realIds.size === oldReal.size + APPROVED_IDS.filter(id => !oldReal.has(id)).length, 'unexpected active parameter ID set/count');
  assert(realIds.size === 67 && ledger.counts.current_real_gameplay_parameter_ids === 67, 'expected 67 distinct IDs with at least one active cell');
  assert(realCells.length === 1004 && ledger.counts.current_real_gameplay_cells === 1004, 'expected 1004 REAL_GAMEPLAY cells and one intentional blocked cell');
  assert(ledger.counts.accepted_consumer_candidate_ids === 34, 'accepted ID candidate count mismatch');

  const egypt = byKey.get('walka_ruch_bitwa_proc/egipt');
  assert(egypt.raw_value === 0.15, 'Egypt general battle movement raw value changed');
  assert(egypt.consumer.current_status === 'BLOCKED', 'Egypt general movement must remain BLOCKED by decision 1B');
  assert(egypt.semantic.statusReasonPl === SNAPSHOT_BY_KEY.get('walka_ruch_bitwa_proc/egipt').statusReasonPl && /decyzj.{0,8}właściciela 1B/i.test(egypt.semantic.statusReasonPl), 'Egypt BLOCKED reason lacks explicit 1B precedence');
  assert(byKey.get('walka_ruch_bitwa_proc/zulusi').consumer.current_status === 'REAL_GAMEPLAY', 'Zulu general movement must remain active');

  for (const id of HARMFUL_DISCOUNTS) {
    assert(ledger.cells.filter(c => c.parameter_id === id).every(c => c.semantic.polarity === 'beneficial'), `discount polarity must be beneficial for ${id}`);
  }
  assert(ledger.cells.filter(c => c.parameter_id === 'prod_rush_koszt_proc').every(c => c.semantic.polarity === 'harmful' && c.consumer.current_status === 'UNWIRED'), 'rush discount must remain harmful and UNWIRED');
  for (const id of ['prod_szybkosc_jednostki_proc', 'prod_rush_koszt_proc']) {
    assert(!realIds.has(id), `unwired production ID promoted: ${id}`);
    assert(ledger.cells.filter(c => c.parameter_id === id).every(c => c.consumer.current_status === 'UNWIRED' && c.effective_raw_approval?.status === 'APPROVED_MATCH'), `raw-approved but consumer-unwired state lost: ${id}`);
  }

  const bounded = ledger.bounded_behavior_receipts;
  assert(bounded.length === APPROVED_IDS.length, 'bounded receipt count mismatch');
  const boundedIds = new Set(bounded.map(r => r.parameter_id));
  assert(boundedIds.size === bounded.length && APPROVED_IDS.every(id => boundedIds.has(id)), 'bounded ID set mismatch');
  for (const item of bounded) {
    const group = CORE.ACCEPTED[item.parameter_id];
    const [integration, finalControl, test] = CORE.INTEGRATIONS[group];
    assert(item.integration.endsWith(integration) && item.final_control.endsWith(finalControl) && item.focused_test === test, `wrong accepted evidence refs ${item.parameter_id}`);
    assert(fs.existsSync(path.join(ROOT, item.integration)) && fs.existsSync(path.join(ROOT, item.final_control)) && fs.existsSync(path.join(ROOT, item.focused_test)), `missing accepted evidence path ${item.parameter_id}`);
    assert(item.runtime === 'NOT_VERIFIED' && item.browser === 'NOT_VERIFIED' && item.save_load === 'NOT_VERIFIED' && item.difficulty === 'NOT_VERIFIED', `unsupported acceptance claim ${item.parameter_id}`);
    assert(!/15.*PASS|PASS.*15/i.test(JSON.stringify(item)), `cell-level behavior PASS replication ${item.parameter_id}`);
    const parameterCells = ledger.cells.filter(c => c.parameter_id === item.parameter_id);
    assert(parameterCells.every(c => c.consumer.bounded_behavior_receipt_id === item.parameter_id), `ID reference missing from its cells ${item.parameter_id}`);
  }
  assert(ledger.acceptance_ceiling.product_93x15 === 'NOT_VERIFIED', 'unsupported product-wide claim');

  const v1Path = path.join(ROOT, V3.V1_LEDGER_REL);
  const v2Path = path.join(ROOT, V3.V2_LEDGER_REL);
  const v2ManifestPath = path.join(ROOT, V3.V2_MANIFEST_REL);
  assert(require('node:crypto').createHash('sha256').update(fs.readFileSync(v1Path)).digest('hex') === 'eb525a44822569139bcb902300dd3e9dcc3af7f2b4c1ebfcec37f84c58544be6', 'v1 immutable history hash changed');
  assert(require('node:crypto').createHash('sha256').update(fs.readFileSync(v2Path)).digest('hex') === 'df8741a6b4eca0064e2f4f7c84f8147f2cdec86353a6bff825c71e1eddc4cd68', 'v2 immutable history hash changed');
  assert(require('node:crypto').createHash('sha256').update(fs.readFileSync(v2ManifestPath)).digest('hex') === 'e902337973b8d74c60424f0a33ce1d57c082c48e12d9adafefb9d137530fbf9d', 'v2 manifest immutable history hash changed');
  assert(ledger.history.v2_ledger.status === 'SUPERSEDED_NOT_ROOT_INTEGRATED', 'v2 history status must be explicit and conservative');
  return true;
}

function expectReject(mutator, label) {
  const clone = structuredClone(LEDGER);
  mutator(clone);
  let rejected = false;
  try { validate(clone); } catch { rejected = true; }
  assert(rejected, `negative control accepted: ${label}`);
}

function expectManifestReject(mutator, overrides, label) {
  const clone = structuredClone(MANIFEST);
  mutator(clone);
  let rejected = false;
  try { V3.verifyV3Manifest(clone, overrides); } catch { rejected = true; }
  assert(rejected, `manifest negative control accepted: ${label}`);
}

function expectHistoryReject(mutator, overrides, label) {
  const clone = structuredClone(HISTORY_INDEX);
  mutator(clone);
  let rejected = false;
  try { V3.validateHistoryIndex(clone, overrides); } catch { rejected = true; }
  assert(rejected, `source-history negative control accepted: ${label}`);
}

validate(LEDGER);
assert(MANIFEST.schema_version === 3, 'wrong manifest schema');
assert(Object.keys(MANIFEST.files).length === CORE.SOURCE_PATHS.length, 'manifest source path count mismatch');
assert(!CORE.SOURCE_PATHS.includes(V3.V3_LEDGER_REL) && !CORE.SOURCE_PATHS.includes(V3.V3_MANIFEST_REL), 'manifest self/output hash loop');
assert(V3.BASE_SOURCE_PATHS.length === 58 && CORE.SOURCE_PATHS.length === new Set([...V3.BASE_SOURCE_PATHS, ...V3.EXTRA_SOURCE_PATHS]).size, 'v3 source closure does not preserve all 58 v2 paths without duplicates');
assert(CORE.SOURCE_PATHS.every(rel => !path.isAbsolute(rel) && !rel.split(/[\\/]/).includes('..') && path.resolve(ROOT, rel).startsWith(`${ROOT}${path.sep}`)), 'source closure contains an outside-root path');
V3.validateHistoryIndex(HISTORY_INDEX);
V3.verifyV3Manifest(MANIFEST);

// Keep the previous v2 validator's 17 ledger controls and 2 manifest controls.
expectManifestReject(x => { delete x.files['gra/src/game/production.ts']; }, undefined, 'missing prior closure source');
expectManifestReject(() => {}, { 'gra/src/main.ts': Buffer.from(fs.readFileSync(path.join(ROOT, 'gra/src/main.ts'), 'utf8') + '\n// in-memory mutation') }, 'changed prior closure hash');
expectReject(x => x.cells[0].effective_raw_approval = { status: 'APPROVED_MATCH', approved_value: 99 }, 'fabricated approval');
expectReject(x => x.cells.pop(), 'missing matrix cell');
expectReject(x => x.cells.push(structuredClone(x.cells[0])), 'duplicate matrix cell');
expectReject(x => x.cells.find(c => c.parameter_id === 'eko_handel_brutto_proc').effective_raw_approval.owner_approval_ref = 'fabricated', 'altered owner reference');
expectReject(x => x.cells.find(c => c.parameter_id === 'eko_handel_brutto_proc').effective_raw_approval.source_sha256 = 'fabricated', 'altered source identity');
expectReject(x => x.bounded_behavior_receipts.pop(), 'missing candidate evidence');
expectReject(x => x.bounded_behavior_receipts.push(structuredClone(x.bounded_behavior_receipts[0])), 'duplicate candidate evidence');
expectReject(x => x.bounded_behavior_receipts[0].parameter_id = 'out_of_scope', 'out-of-scope candidate');
expectReject(x => x.cells.find(c => c.parameter_id === 'prod_szybkosc_jednostki_proc').semantic.status = 'REAL_GAMEPLAY', 'unwired production promotion');
expectReject(x => x.acceptance_ceiling.product_93x15 = 'PASS', 'unsupported product promotion');
expectReject(x => x.counts.current_real_gameplay_parameter_ids++, 'incorrect resulting status count');
expectReject(x => x.cells.find(c => c.parameter_id === 'wealth_cap_proc').raw_value++, 'altered raw value');
expectReject(x => x.cells.find(c => c.parameter_id === 'lud_wzrost_proc').consumer.current_status = 'UNWIRED', 'removed baseline gameplay ID');
expectReject(x => x.bounded_behavior_receipts[0].integration = 'fabricated-integration.md', 'wrong integration reference');
expectReject(x => x.bounded_behavior_receipts[0].behavioral_owner_ai = '15 civilization PASS', 'unproven behavior receipt');
expectReject(x => x.cells[0].effective_raw_approval = { status: 'APPROVED_MATCH', approved_value: x.cells[0].raw_value }, 'out-of-scope approval');
expectReject(x => x.cells.find(c => c.parameter_id === 'eko_handel_brutto_proc').civilization_id = 'wrong-civ', 'wrong-civ identity');

// V3 cell-level, polarity, and closure controls.
expectReject(x => x.cells.find(c => c.parameter_id === 'walka_ruch_bitwa_proc' && c.civilization_id === 'egipt').consumer.current_status = 'REAL_GAMEPLAY', 'Egypt 1B cell falsely active');
expectReject(x => x.cells.find(c => c.parameter_id === 'walka_ruch_bitwa_proc' && c.civilization_id === 'egipt').semantic.status = 'REAL_GAMEPLAY', 'Egypt 1B semantic status falsely active');
expectReject(x => x.cells.find(c => c.parameter_id === 'walka_ruch_bitwa_proc' && c.civilization_id === 'egipt').semantic.statusReasonPl = 'generic blocked', 'Egypt 1B reason omitted');
for (const id of HARMFUL_DISCOUNTS) expectReject(x => x.cells.find(c => c.parameter_id === id).semantic.polarity = 'harmful', `discount polarity corrupted: ${id}`);
expectReject(x => x.cells.find(c => c.parameter_id === 'prod_rush_koszt_proc').consumer.current_status = 'REAL_GAMEPLAY', 'rush cost promoted');
expectReject(x => x.bounded_behavior_receipts.find(c => c.parameter_id === 'walka_koszt_rekrutacji_proc').parameter_id = 'walka_ruch_bitwa_proc', 'new candidate omitted/duplicated');
expectReject(x => x.cells.find(c => c.parameter_id === 'walka_koszt_rekrutacji_proc').semantic.status = 'UNWIRED', 'new accepted candidate status removed');
expectManifestReject(x => { delete x.files['gra/src/game/embarkation.ts']; }, undefined, 'missing embarkation source');
expectManifestReject(x => { delete x.files['gra/tools/pr141-semantic-consumer-consistency-test.cjs']; }, undefined, 'missing semantic consumer test');
expectManifestReject(x => { delete x.files['dyspozycje/autobot/runs/R-PR141-CODEX-SEMANTIC-CONSUMER-CONSISTENCY-20261018/08-integration.md']; }, undefined, 'missing accepted semantic integration');
expectManifestReject(() => {}, { 'gra/src/game/embarkation.ts': Buffer.from(fs.readFileSync(path.join(ROOT, 'gra/src/game/embarkation.ts'), 'utf8') + '\n// in-memory mutation') }, 'changed new source hash');
expectManifestReject(x => { x.files['../pr141-review/review-f05.md'] = 'fabricated'; }, undefined, 'manifest path escapes repository');
expectManifestReject(x => { delete x.files[V3.EXPECTED_HISTORY[0].copy_path]; }, undefined, 'missing repository-local source-history copy');
expectHistoryReject(x => { x.entries.pop(); }, undefined, 'missing source-history index entry/copy');
expectHistoryReject(() => {}, { [V3.EXPECTED_HISTORY[1].copy_path]: Buffer.from('changed historical bytes') }, 'altered copy bytes');
expectHistoryReject(x => { x.entries[2].original_sha256 = '0'.repeat(64); }, undefined, 'source-history provenance digest mismatch');

console.log(`PASS v3 current evidence ledger: ${LEDGER.cells.length} cells; ${LEDGER.counts.effective_raw_approval_cells} exact approvals; ${LEDGER.bounded_behavior_receipts.length} ID-level receipts; 26 ledger, 8 manifest, and 3 source-history negative controls rejected; ${LEDGER.counts.current_real_gameplay_cells} active cells across ${LEDGER.counts.current_real_gameplay_parameter_ids} IDs.`);
