'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const GEN = require('./pr141-current-evidence-ledger-v4-generate.cjs');
const { V3, CORE, RUN, UNIT_ID, SOURCE_PATHS, OUTPUT_LEDGER_REL, OUTPUT_MANIFEST_REL } = GEN;
const ROOT = path.resolve(__dirname, '..', '..');
const LEDGER = JSON.parse(fs.readFileSync(path.join(RUN, 'evidence/matrix-93x15-current-evidence-ledger-v4.json'), 'utf8'));
const MANIFEST = JSON.parse(fs.readFileSync(path.join(RUN, 'evidence/source-manifest-v4.json'), 'utf8'));
const MATRIX = JSON.parse(fs.readFileSync(path.join(ROOT, 'gra/data/civ-matrix.json'), 'utf8'));
const RECEIPT = JSON.parse(fs.readFileSync(path.join(ROOT, 'dyspozycje/autobot/runs/R-PR141-CODEX-F04-SOURCE-APPROVAL-20261018/source-approval-receipt.json'), 'utf8'));
const V1 = JSON.parse(fs.readFileSync(path.join(ROOT, V3.V1_LEDGER_REL), 'utf8'));
const SNAPSHOT = V3.buildCurrentSemanticSnapshot();
const SNAPSHOT_BY_KEY = new Map(SNAPSHOT.cells.map(c => [`${c.parameterId}/${c.civilizationId}`, c]));
const OLD_V3 = JSON.parse(fs.readFileSync(path.join(ROOT, GEN.V3_RUN_REL || 'dyspozycje/autobot/runs/R-PR141-CODEX-CURRENT-EVIDENCE-LEDGER-20261018/evidence/matrix-93x15-current-evidence-ledger-v3.json'), 'utf8'));
const PRIOR_ACCEPTED_IDS = Object.keys(CORE.ACCEPTED).filter(id => id !== UNIT_ID).sort();
const ACCEPTED_IDS = Object.keys(CORE.ACCEPTED).sort();
const DISCOUNTS = ['prod_koszt_budynku_proc', 'prod_koszt_jednostki_proc', 'walka_koszt_rekrutacji_proc'];
const PER_CELL_PASS_CLAIM = /(?:15\s*(?:cells?|civilizations?).{0,24}PASS|PASS.{0,24}(?:all\s+)?15\s*(?:cells?|civilizations?))/i;
function assert(ok, message) { if (!ok) throw new Error(message); }
function hash(bytes) { return crypto.createHash('sha256').update(bytes).digest('hex'); }
function key(cell) { return `${cell.parameter_id}/${cell.civilization_id}`; }

function validate(ledger) {
  assert(ledger.schema_version === 4, 'wrong v4 ledger schema');
  assert(ledger.topic_id === 'R-PR141-CODEX-F04-PRODUCTION-DECISION-CLOSEOUT-20261018', 'wrong closeout topic');
  assert(ledger.source_manifest === 'source-manifest-v4.json', 'wrong v4 manifest reference');
  assert(ledger.cells.length === ledger.counts.parameter_ids * ledger.counts.civilizations, 'full matrix cell count mismatch');
  const byKey = new Map(ledger.cells.map(c => [key(c), c]));
  assert(byKey.size === ledger.cells.length, 'duplicate matrix cell');
  const expectedKeys = new Set(Object.keys(MATRIX.paramDefs).flatMap(id => MATRIX.cywilizacje.map(row => `${id}/${row.ikonaId}`)));
  assert(byKey.size === expectedKeys.size && [...expectedKeys].every(k => byKey.has(k)), 'matrix inventory mismatch');
  assert(ledger.counts.parameter_ids === Object.keys(MATRIX.paramDefs).length && ledger.counts.civilizations === MATRIX.cywilizacje.length, 'matrix dimensions differ from source');
  assert(ledger.cells.length === SNAPSHOT.expectedCellCount, 'ledger and current semantic snapshot dimensions differ');

  const statusCounts = {};
  for (const row of MATRIX.cywilizacje) for (const id of Object.keys(MATRIX.paramDefs)) {
    const k = `${id}/${row.ikonaId}`;
    const cell = byKey.get(k);
    const semantic = SNAPSHOT_BY_KEY.get(k);
    assert(cell && semantic, `missing matrix or semantic cell ${k}`);
    assert(cell.raw_value === row.params[id], `raw value differs from current matrix ${k}`);
    assert(cell.semantic.status === semantic.consumerStatus && cell.consumer.current_status === semantic.consumerStatus, `status differs from live semantic API ${k}`);
    assert(cell.semantic.label === semantic.label && cell.semantic.polarity === semantic.polarity, `label/polarity differs from live semantic API ${k}`);
    assert(cell.semantic.statusReasonPl === semantic.statusReasonPl, `status reason differs from live semantic API ${k}`);
    assert(cell.consumer.runtime_acceptance === 'NOT_VERIFIED', `unsupported runtime acceptance ${k}`);
    assert(cell.behavior_receipt.status === 'NO_CELL_LEVEL_BEHAVIOR_RECEIPT_RECORDED', `cell-level behavior receipt is forbidden ${k}`);
    assert(cell.save_load.status === 'NOT_VERIFIED' && cell.browser.status === 'NOT_VERIFIED' && /NOT_VERIFIED/.test(cell.difficulty.status) && /NOT_VERIFIED/.test(cell.owner_ai.status), `unsupported acceptance dimension ${k}`);
    statusCounts[cell.consumer.current_status] = (statusCounts[cell.consumer.current_status] || 0) + 1;
  }
  assert(JSON.stringify(Object.fromEntries(Object.entries(statusCounts).sort())) === JSON.stringify(Object.fromEntries(Object.entries(ledger.counts.current_consumer_classifications).sort())), 'status inventory counts mismatch');

  const receiptByKey = new Map(RECEIPT.cells.map(c => [`${c.parameter_id}/${c.civilization_key}`, c]));
  const approved = ledger.cells.filter(c => c.effective_raw_approval?.status === 'APPROVED_MATCH');
  assert(approved.length === 360 && ledger.counts.effective_raw_approval_cells === 360, 'exact 360 receipt-backed raw approvals required');
  for (const cell of ledger.cells) {
    const sourceReceipt = receiptByKey.get(key(cell));
    if (!sourceReceipt) { assert(cell.effective_raw_approval === null, `approval outside source receipt scope ${key(cell)}`); continue; }
    assert(cell.effective_raw_approval?.status === 'APPROVED_MATCH', `receipt cell lacks approval ${key(cell)}`);
    assert(cell.raw_value === sourceReceipt.current_raw_value && cell.effective_raw_approval.approved_value === sourceReceipt.approved_source_raw_value, `receipt values mismatch ${key(cell)}`);
    assert(cell.effective_raw_approval.owner_approval_ref === sourceReceipt.owner_approval_ref, `owner approval provenance mismatch ${key(cell)}`);
    assert(cell.effective_raw_approval.source_sha256 === RECEIPT.source.sha256, `raw source hash mismatch ${key(cell)}`);
  }

  const oldReal = new Set(V1.cells.filter(c => c.consumer.current_status === 'REAL_GAMEPLAY').map(c => c.parameter_id));
  const realCells = ledger.cells.filter(c => c.consumer.current_status === 'REAL_GAMEPLAY');
  const realIds = new Set(realCells.map(c => c.parameter_id));
  for (const id of oldReal) assert(realIds.has(id), `preserved baseline consumer missing: ${id}`);
  for (const id of ACCEPTED_IDS) assert(realIds.has(id), `accepted consumer status missing: ${id}`);
  assert(ACCEPTED_IDS.length === 35 && PRIOR_ACCEPTED_IDS.length === 34, 'new accepted ID inventory mismatch');
  assert(realIds.size === oldReal.size + ACCEPTED_IDS.filter(id => !oldReal.has(id)).length, 'unexpected REAL_GAMEPLAY ID promotion');
  assert(ledger.counts.accepted_consumer_candidate_ids === ACCEPTED_IDS.length, 'accepted candidate count mismatch');
  assert(ledger.counts.current_real_gameplay_parameter_ids === realIds.size, 'REAL_GAMEPLAY ID count mismatch');
  assert(ledger.counts.current_real_gameplay_cells === realCells.length, 'REAL_GAMEPLAY cell count mismatch');
  assert(ledger.counts.full_matrix_cells === ledger.cells.length, 'full matrix size is not separately reported');
  assert(ledger.counts.accepted_id_scoped_cells === realIds.size * MATRIX.cywilizacje.length, 'accepted-ID-scoped count must be derived separately from the full matrix');
  assert(ledger.cells.length === 1395 && realIds.size === 68 && realCells.length === 1019, 'review expectation differs from derived 93×15 unit-only inventory');

  const egypt = byKey.get('walka_ruch_bitwa_proc/egipt');
  assert(egypt.raw_value === 0.15 && egypt.consumer.current_status === 'BLOCKED', 'Egypt 1B exception changed');
  assert(/decyzj.{0,8}właściciela 1B/i.test(egypt.semantic.statusReasonPl), 'Egypt 1B status reason missing');
  assert(byKey.get('walka_ruch_bitwa_proc/zulusi').consumer.current_status === 'REAL_GAMEPLAY', 'Zulu general movement must remain active');
  for (const id of DISCOUNTS) assert(ledger.cells.filter(c => c.parameter_id === id).every(c => c.semantic.polarity === 'beneficial'), `beneficial cost polarity changed: ${id}`);
  assert(ledger.cells.filter(c => c.parameter_id === 'prod_rush_koszt_proc').every(c => c.semantic.polarity === 'harmful' && c.consumer.current_status === 'UNWIRED'), 'unresolved rush must remain harmful and UNWIRED');
  assert(ledger.cells.filter(c => c.parameter_id === UNIT_ID).every(c => c.consumer.current_status === 'REAL_GAMEPLAY'), 'unit-speed accepted status missing');
  assert(ledger.cells.filter(c => c.parameter_id === UNIT_ID).every(c => c.effective_raw_approval?.status === 'APPROVED_MATCH'), 'unit source approval provenance lost');
  assert(ledger.cells.filter(c => c.parameter_id === UNIT_ID).every(c => c.behavior_receipt.status === 'NO_CELL_LEVEL_BEHAVIOR_RECEIPT_RECORDED'), 'unit behavior was copied to each source cell');
  assert(ledger.cells.filter(c => c.parameter_id === 'prod_rush_koszt_proc').every(c => c.effective_raw_approval?.status === 'APPROVED_MATCH'), 'rush raw source overlay was conflated with consumer status');

  const bounded = ledger.bounded_behavior_receipts;
  assert(bounded.length === ACCEPTED_IDS.length, 'ID-level receipt count mismatch');
  const boundedIds = new Set(bounded.map(item => item.parameter_id));
  assert(boundedIds.size === bounded.length && ACCEPTED_IDS.every(id => boundedIds.has(id)), 'ID-level bounded receipt set mismatch');
  for (const item of bounded) {
    const group = CORE.ACCEPTED[item.parameter_id];
    const [integration, fc, test] = CORE.INTEGRATIONS[group];
    assert(item.integration.endsWith(integration) && item.final_control.endsWith(fc) && item.focused_test === test, `accepted reference mismatch for ${item.parameter_id}`);
    assert(fs.existsSync(path.join(ROOT, item.integration)) && fs.existsSync(path.join(ROOT, item.final_control)) && fs.existsSync(path.join(ROOT, item.focused_test)), `accepted evidence file missing for ${item.parameter_id}`);
    assert(item.runtime === 'NOT_VERIFIED' && item.browser === 'NOT_VERIFIED' && item.save_load === 'NOT_VERIFIED' && item.difficulty === 'NOT_VERIFIED', `unsupported runtime evidence for ${item.parameter_id}`);
    assert(!PER_CELL_PASS_CLAIM.test(JSON.stringify(item)), `per-cell behavior PASS replication in ${item.parameter_id}`);
    assert(ledger.cells.filter(c => c.parameter_id === item.parameter_id).every(c => c.consumer.bounded_behavior_receipt_id === item.parameter_id), `cell lacks ID receipt link for ${item.parameter_id}`);
  }
  const unit = bounded.find(item => item.parameter_id === UNIT_ID);
  assert(unit.evidence_ceiling.includes('15 source values are zero') && unit.evidence_ceiling.includes('no per-cell behavior PASS'), 'unit evidence ceiling is inaccurate');
  assert(unit.behavioral_owner_ai.includes('bounded') && !PER_CELL_PASS_CLAIM.test(JSON.stringify(unit)), 'unit owner evidence overclaims parity');
  assert(ledger.history.v3_snapshot.status === 'IMMUTABLE_ROOT_INTEGRATED_HISTORICAL_SNAPSHOT', 'v3 root-accepted history pin missing');
  assert(ledger.history.unit_speed_acceptance.status === 'ROOT_ACCEPTED_LOCAL_BOUNDED', 'unit root acceptance record missing');
  assert(ledger.acceptance_ceiling.product_93x15 === 'NOT_VERIFIED', 'unsupported full-product claim');

  const currentManifestHash = hash(fs.readFileSync(path.join(ROOT, 'dyspozycje/autobot/runs/R-PR141-CODEX-CURRENT-EVIDENCE-LEDGER-20261018/evidence/source-manifest-v3.json')));
  const currentLedgerHash = hash(fs.readFileSync(path.join(ROOT, 'dyspozycje/autobot/runs/R-PR141-CODEX-CURRENT-EVIDENCE-LEDGER-20261018/evidence/matrix-93x15-current-evidence-ledger-v3.json')));
  assert(ledger.history.v3_snapshot.source_manifest.sha256 === currentManifestHash, 'frozen v3 manifest history hash changed');
  assert(ledger.history.v3_snapshot.ledger.sha256 === currentLedgerHash, 'frozen v3 ledger history hash changed');
  for (const [rel, expected] of [[V3.V1_LEDGER_REL, 'eb525a44822569139bcb902300dd3e9dcc3af7f2b4c1ebfcec37f84c58544be6'], [V3.V2_LEDGER_REL, 'df8741a6b4eca0064e2f4f7c84f8147f2cdec86353a6bff825c71e1eddc4cd68'], [V3.V2_MANIFEST_REL, 'e902337973b8d74c60424f0a33ce1d57c082c48e12d9adafefb9d137530fbf9d']]) {
    assert(hash(fs.readFileSync(path.join(ROOT, rel))) === expected, `immutable history changed: ${rel}`);
  }
  return true;
}

function expectReject(mutator, label) {
  const clone = structuredClone(LEDGER); mutator(clone);
  let rejected = false; try { validate(clone); } catch { rejected = true; }
  assert(rejected, `ledger negative control accepted: ${label}`);
}
function expectManifestReject(mutator, overrides, label) {
  const clone = structuredClone(MANIFEST); mutator(clone);
  let rejected = false; try { GEN.verifyManifest(clone, overrides); } catch { rejected = true; }
  assert(rejected, `manifest negative control accepted: ${label}`);
}
function expectHistoryReject(mutator, overrides, label) {
  const index = JSON.parse(fs.readFileSync(path.join(ROOT, V3.SOURCE_HISTORY_INDEX_REL), 'utf8'));
  mutator(index);
  let rejected = false; try { V3.validateHistoryIndex(index, overrides); } catch { rejected = true; }
  assert(rejected, `source-history negative control accepted: ${label}`);
}

validate(LEDGER);
assert(MANIFEST.schema_version === 4 && MANIFEST.topic_id === 'R-PR141-CODEX-F04-PRODUCTION-DECISION-CLOSEOUT-20261018', 'wrong v4 manifest identity');
assert(Object.keys(MANIFEST.files).length === SOURCE_PATHS.length, 'manifest closure count mismatch');
assert(V3.CORE.SOURCE_PATHS.every(rel => SOURCE_PATHS.includes(rel)), 'v3 80-path closure was not retained');
assert(!SOURCE_PATHS.includes(OUTPUT_LEDGER_REL) && !SOURCE_PATHS.includes(OUTPUT_MANIFEST_REL), 'v4 output/self hash loop');
assert(SOURCE_PATHS.every(rel => !path.isAbsolute(rel) && !rel.split(/[\\/]/).includes('..') && path.resolve(ROOT, rel).startsWith(`${ROOT}${path.sep}`)), 'non-local manifest path');
GEN.verifyManifest(MANIFEST);

// Retain all 37 v3 ledger/manifest/source-history negative controls.
expectManifestReject(x => { delete x.files['gra/src/game/production.ts']; }, undefined, 'missing prior closure source');
expectManifestReject(() => {}, { 'gra/src/main.ts': Buffer.from(fs.readFileSync(path.join(ROOT, 'gra/src/main.ts'), 'utf8') + '\n// in-memory mutation') }, 'changed prior closure source hash');
expectReject(x => x.cells[0].effective_raw_approval = { status: 'APPROVED_MATCH', approved_value: 99 }, 'fabricated approval');
expectReject(x => x.cells.pop(), 'missing matrix cell');
expectReject(x => x.cells.push(structuredClone(x.cells[0])), 'duplicate matrix cell');
expectReject(x => x.cells.find(c => c.parameter_id === 'eko_handel_brutto_proc').effective_raw_approval.owner_approval_ref = 'fabricated', 'altered owner reference');
expectReject(x => x.cells.find(c => c.parameter_id === 'eko_handel_brutto_proc').effective_raw_approval.source_sha256 = 'fabricated', 'altered source identity');
expectReject(x => x.bounded_behavior_receipts.pop(), 'missing candidate evidence');
expectReject(x => x.bounded_behavior_receipts.push(structuredClone(x.bounded_behavior_receipts[0])), 'duplicate candidate evidence');
expectReject(x => x.bounded_behavior_receipts[0].parameter_id = 'out_of_scope', 'out-of-scope candidate');
expectReject(x => x.acceptance_ceiling.product_93x15 = 'PASS', 'unsupported product promotion');
expectReject(x => x.counts.current_real_gameplay_parameter_ids++, 'incorrect resulting status count');
expectReject(x => x.cells.find(c => c.parameter_id === 'wealth_cap_proc').raw_value++, 'altered raw value');
expectReject(x => x.cells.find(c => c.parameter_id === 'lud_wzrost_proc').consumer.current_status = 'UNWIRED', 'removed baseline gameplay ID');
expectReject(x => x.bounded_behavior_receipts[0].integration = 'fabricated-integration.md', 'wrong integration reference');
expectReject(x => x.bounded_behavior_receipts[0].behavioral_owner_ai = '15 civilization PASS', 'unproven behavior receipt');
expectReject(x => x.cells[0].effective_raw_approval = { status: 'APPROVED_MATCH', approved_value: x.cells[0].raw_value }, 'out-of-scope approval');
expectReject(x => x.cells.find(c => c.parameter_id === 'eko_handel_brutto_proc').civilization_id = 'wrong-civ', 'wrong-civ identity');
expectReject(x => x.cells.find(c => c.parameter_id === 'walka_ruch_bitwa_proc' && c.civilization_id === 'egipt').consumer.current_status = 'REAL_GAMEPLAY', 'Egypt 1B falsely active');
expectReject(x => x.cells.find(c => c.parameter_id === 'walka_ruch_bitwa_proc' && c.civilization_id === 'egipt').semantic.status = 'REAL_GAMEPLAY', 'Egypt 1B semantic status falsely active');
expectReject(x => x.cells.find(c => c.parameter_id === 'walka_ruch_bitwa_proc' && c.civilization_id === 'egipt').semantic.statusReasonPl = 'generic blocked', 'Egypt 1B reason omitted');
for (const id of DISCOUNTS) expectReject(x => x.cells.find(c => c.parameter_id === id).semantic.polarity = 'harmful', `discount polarity changed: ${id}`);
expectReject(x => x.cells.find(c => c.parameter_id === 'prod_rush_koszt_proc').consumer.current_status = 'REAL_GAMEPLAY', 'rush cost promoted');
expectReject(x => x.bounded_behavior_receipts.find(c => c.parameter_id === 'walka_koszt_rekrutacji_proc').parameter_id = 'walka_ruch_bitwa_proc', 'candidate receipt replaced/duplicated');
expectReject(x => x.cells.find(c => c.parameter_id === 'walka_koszt_rekrutacji_proc').semantic.status = 'UNWIRED', 'prior accepted status removed');
expectReject(x => x.cells.find(c => c.parameter_id === UNIT_ID).semantic.status = 'UNSUPPORTED_STATUS', 'unsupported status value');
expectManifestReject(x => { delete x.files['gra/src/game/embarkation.ts']; }, undefined, 'missing accepted v3 closure source');
expectManifestReject(x => { delete x.files['gra/tools/pr141-semantic-consumer-consistency-test.cjs']; }, undefined, 'missing accepted semantic consumer test');
expectManifestReject(x => { delete x.files['dyspozycje/autobot/runs/R-PR141-CODEX-SEMANTIC-CONSUMER-CONSISTENCY-20261018/08-integration.md']; }, undefined, 'missing accepted semantic integration');
expectManifestReject(() => {}, { 'gra/src/game/embarkation.ts': Buffer.from(fs.readFileSync(path.join(ROOT, 'gra/src/game/embarkation.ts'), 'utf8') + '\n// in-memory mutation') }, 'changed closure source hash');
expectManifestReject(x => { x.files['../outside.md'] = 'fabricated'; }, undefined, 'manifest path escapes repository');
expectManifestReject(x => { delete x.files[V3.EXPECTED_HISTORY[0].copy_path]; }, undefined, 'missing repository-local history copy');
expectHistoryReject(x => { x.entries.pop(); }, undefined, 'missing source-history entry');
expectHistoryReject(() => {}, { [V3.EXPECTED_HISTORY[1].copy_path]: Buffer.from('changed historical bytes') }, 'altered historical copy');
expectHistoryReject(x => { x.entries[2].original_sha256 = '0'.repeat(64); }, undefined, 'source-history digest changed');

// Additional unit-specific status and receipt controls.
expectReject(x => x.cells.find(c => c.parameter_id === UNIT_ID).consumer.current_status = 'UNWIRED', 'unit accepted status removed');
expectReject(x => x.cells.find(c => c.parameter_id === UNIT_ID).semantic.status = 'UI_ONLY', 'unit consumer status substituted');
expectReject(x => x.bounded_behavior_receipts.find(c => c.parameter_id === UNIT_ID).integration = 'fabricated-unit-integration.md', 'unit root integration reference fabricated');
expectReject(x => x.bounded_behavior_receipts.find(c => c.parameter_id === UNIT_ID).evidence_ceiling = '15 cells PASS', 'unit evidence ceiling overclaimed');
expectReject(x => x.cells.find(c => c.parameter_id === UNIT_ID).behavior_receipt = { status: 'PASS' }, 'unit behavior duplicated across cells');
expectManifestReject(x => { delete x.files['dyspozycje/autobot/runs/R-PR141-CODEX-F04-PRODUCTION-ACTIVATION-20261018/12-unit-speed-integration.md']; }, undefined, 'missing accepted unit root integration');
expectManifestReject(() => {}, { 'gra/tools/pr141-f04-unit-speed-activation-test.cjs': Buffer.from(fs.readFileSync(path.join(ROOT, 'gra/tools/pr141-f04-unit-speed-activation-test.cjs'), 'utf8') + '\n// in-memory mutation') }, 'changed unit focused-test hash');
expectManifestReject(x => { x.historical_v3.ledger.sha256 = '0'.repeat(64); }, undefined, 'altered immutable v3 history pin');

console.log(`PASS v4 current evidence: ${LEDGER.cells.length} total matrix cells; ${LEDGER.counts.accepted_id_scoped_cells} accepted-ID-scoped cells; ${LEDGER.counts.current_real_gameplay_cells} REAL_GAMEPLAY cells / ${LEDGER.counts.current_real_gameplay_parameter_ids} IDs; ${LEDGER.counts.effective_raw_approval_cells} exact raw approvals; ${LEDGER.bounded_behavior_receipts.length} ID-level receipts; 37 retained plus 8 unit/v4-focused negative controls rejected.`);
