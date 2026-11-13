#!/usr/bin/env node
'use strict';

// Read-only structural and provenance ledger for PR141. This validates source
// coverage and makes missing evidence explicit; it does not classify gameplay.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const repo = path.resolve(__dirname, '..', '..');
const review = '/workspace/pr141-review';
const handoff = '/workspace/handoff-pr141/matrix';
const runDir = path.join(repo, 'dyspozycje/autobot/runs/R-PR141-CODEX-EVIDENCE-LEDGER-20261017');
const evidenceDir = path.join(runDir, 'evidence');
fs.mkdirSync(evidenceDir, { recursive: true });

const sources = {
  raw: path.join(repo, 'gra/data/civ-matrix.json'),
  consumersCsv: path.join(review, 'current-consumers.csv'),
  consumersJson: path.join(review, 'current-consumers.json'),
  semantic: path.join(review, 'current-semantic.json'),
  f04Ids: path.join(handoff, 'f04-24-parameter-ids.txt'),
  f04Provenance: path.join(handoff, 'f04-provenance-cells.json'),
  f04Report: path.join(handoff, 'f04-operator-block-report.json'),
};

function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function sha256(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell.length || row.length) { row.push(cell.replace(/\r$/, '')); rows.push(row); }
  const [header, ...body] = rows;
  return body.filter(r => r.some(v => v !== '')).map(r => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
}
function cellKey(parameterId, civilizationId) { return `${parameterId}\u0000${civilizationId}`; }
function validateCellRows(rows, expectedKeys) {
  const found = new Set();
  for (const cell of rows) {
    const key = cellKey(cell.parameter_id, cell.civilization_id);
    if (!expectedKeys.has(key)) throw new Error(`unexpected matrix cell: ${cell.parameter_id}/${cell.civilization_id}`);
    if (found.has(key)) throw new Error(`duplicate matrix cell: ${cell.parameter_id}/${cell.civilization_id}`);
    found.add(key);
  }
  if (found.size !== expectedKeys.size) throw new Error(`matrix coverage ${found.size}/${expectedKeys.size}`);
  for (const key of expectedKeys) if (!found.has(key)) throw new Error(`missing matrix cell: ${key.replace('\u0000', '/')}`);
}
function validateEvidenceClassification(cell, receiptPolicy, f04Evidence) {
  const policy = receiptPolicy.get(cell.parameter_id);
  const receipt = cell.behavior_receipt;
  if (policy) {
    if (receipt.status !== policy.status) throw new Error(`invalid receipt status: ${cell.parameter_id}`);
    if (receipt.topicId !== policy.topic) throw new Error(`receipt topic mismatch: ${cell.parameter_id}`);
  } else if (receipt.topicId !== null || receipt.status !== 'NO_CELL_LEVEL_BEHAVIOR_RECEIPT_RECORDED') {
    throw new Error(`unsupported behavior receipt attribution: ${cell.parameter_id}`);
  }
  if (f04Evidence) {
    const approval = cell.raw_approval;
    if (approval.status !== f04Evidence.approval_classification || approval.ownerApprovedValue !== f04Evidence.owner_approved_native_value || approval.ownerApprovalSource !== f04Evidence.owner_approval_source) throw new Error(`F04 approval differs from source evidence: ${cell.parameter_id}`);
    if (['APPROVED_MATCH', 'APPROVED_MISMATCH'].includes(approval.status) && (!approval.ownerApprovalSource || approval.ownerApprovedValue === null)) throw new Error(`approved F04 status lacks source/value: ${cell.parameter_id}`);
    if (approval.status === 'APPROVED_MATCH' && approval.ownerApprovedValue !== cell.raw_value) throw new Error(`approved match differs from current raw value: ${cell.parameter_id}`);
  }
  if (cell.browser.status !== 'NOT_VERIFIED' && !cell.browser.evidence) throw new Error(`browser claim lacks evidence: ${cell.parameter_id}`);
  if (cell.save_load.status !== 'NOT_VERIFIED' && !cell.save_load.evidence) throw new Error(`save/load claim lacks evidence: ${cell.parameter_id}`);
}
function check(condition, message) { assert.ok(condition, message); }

const raw = readJson(sources.raw);
const consumerDoc = readJson(sources.consumersJson);
const semanticDoc = readJson(sources.semantic);
const f04Doc = readJson(sources.f04Provenance);
const f04Report = readJson(sources.f04Report);
const csvRows = parseCsv(fs.readFileSync(sources.consumersCsv, 'utf8'));
const parameterIds = Array.isArray(raw.paramDefs)
  ? raw.paramDefs.map(d => typeof d === 'string' ? d : d.id)
  : Object.keys(raw.paramDefs);
const civs = raw.cywilizacje.map(c => ({ id: c.typCywilizacji, name: c.Cywilizacja, params: c.params }));
const expectedKeys = new Set(parameterIds.flatMap(id => civs.map(c => cellKey(id, c.id))));
const consumersById = new Map(consumerDoc.parameters.map(p => [p.id, p]));
const csvById = new Map(csvRows.map(p => [p.id, p]));
const semanticByCell = new Map(semanticDoc.cells.map(c => [cellKey(c.parameterId, c.civilizationId), c]));
const f04Ids = fs.readFileSync(sources.f04Ids, 'utf8').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
const f04IdSet = new Set(f04Ids);
const f04ByCell = new Map(f04Doc.cells.map(c => [cellKey(c.parameter_id, c.civilization_key), c]));
const receiptPolicy = new Map();
const bindTopic = (ids, topic, status = 'TOPIC_LEVEL_RECEIPT_REVIEW_OPEN') => ids.forEach(id => receiptPolicy.set(id, { topic, status }));
bindTopic(['lud_wzrost_proc', 'lud_spadek_proc', 'lud_zdrowie_proc', 'lud_zadowolenie_bazowe', 'lud_limit_populacji'], 'R-PR141-CODEX-POPULATION-20261017');
bindTopic(['ai_ekspansywnosc', 'ai_sklonnosc_podboju', 'ai_tolerancja_ryzyka', 'ai_profil_obronna', 'dip_handlowosc_archetyp'], 'R-PR141-CODEX-AI-STRATEGY-20261017');
bindTopic(['ai_priorytet_militarny', 'ai_priorytet_ekonomia', 'ai_priorytet_nauka'], 'R-PR141-CODEX-AI-PRODUCTION-20261017');
bindTopic(['walka_atak_kawaleria', 'walka_atak_rydwany', 'walka_atak_obleczenie', 'walka_atak_morska', 'walka_uderzenie_piechota', 'walka_uderzenie_kawaleria', 'walka_dystans_rydwany', 'walka_atak_piechota_teren_las', 'walka_atak_piechota_runda_szarzy', 'walka_atak_piechota_teren_plytkie_morze'], 'R-PR141-CODEX-COMBAT-OFFENSE-20261017');
bindTopic(['walka_obrona_morska', 'walka_obrona_piechota_teren_las', 'walka_obrona_piechota_terytorium_wlasne', 'walka_obrona_piechota_w_murze', 'walka_obrona_piechota_teren_plytkie_morze'], 'R-PR141-CODEX-COMBAT-DEFENSE-20261017');
bindTopic(['mp_regen_proc', 'mp_max_proc', 'mp_koszt_jednostki_proc', 'walka_ruch_bitwa_proc', 'walka_koszt_rekrutacji_proc'], 'R-CYWILIZACJE-MACIERZ-EKO-WEALTH-MANPOWER-SPOL-PROD-REBASE-Q1-20260925', 'LIMITED_LOCAL_RECEIPT_REVIEWED');

// Independent coverage checks, including controlled negative mutations.
check(raw._meta.kolumny === 93, 'raw matrix must declare 93 parameters');
check(raw._meta.cywilizacje === 15, 'raw matrix must declare 15 civilizations');
check(parameterIds.length === 93 && new Set(parameterIds).size === 93, 'raw parameter IDs must be 93 unique values');
check(civs.length === 15 && new Set(civs.map(c => c.id)).size === 15, 'raw civilization keys must be 15 unique values');
check(expectedKeys.size === 1395, 'expected matrix cross product must be 1,395 cells');
check(consumerDoc.parameters.length === 93 && consumersById.size === 93, 'consumer JSON must have 93 unique parameter entries');
check(csvRows.length === 93 && csvById.size === 93, 'consumer CSV must have 93 unique parameter entries');
check(semanticDoc.expectedCellCount === 1395 && semanticDoc.cells.length === 1395 && semanticByCell.size === 1395, 'semantic snapshot must cover 1,395 unique parameter/civilization pairs');
check(consumerDoc.head === 'edb8fb56115e9dec0a58614dfb23ca6173d60c9a', 'consumer snapshot HEAD must match dispatch base');
check(parameterIds.every(id => consumersById.has(id) && csvById.has(id)), 'consumer inventory must contain every raw parameter ID');
check(civs.every(c => parameterIds.every(id => Object.hasOwn(c.params, id))), 'each civilization must contain every parameter key');

const expectedCsvCounts = { REAL_GAMEPLAY: 33, UNWIRED: 26, DEAD_UNWIRED: 19, BLOCKED: 8, UI_ONLY: 5, DECISION_REQUIRED: 2 };
const csvCounts = Object.fromEntries(Object.keys(expectedCsvCounts).map(k => [k, csvRows.filter(r => r.current_semantic_status === k).length]));
check(JSON.stringify(csvCounts) === JSON.stringify(expectedCsvCounts), 'consumer classification counts must match the recorded audit');
check(f04Ids.length === 24 && f04IdSet.size === 24, 'F04 ID inventory must contain 24 unique fields');
check(f04Doc.coverage.expected_cell_count === 360 && f04Doc.cells.length === 360 && f04ByCell.size === 360, 'F04 provenance must cover 360 unique cells');
check(f04Ids.every(id => parameterIds.includes(id)), 'all F04 IDs must be present in the raw matrix');
check(f04Doc.cells.every(c => c.approval_classification === 'SEED_ONLY_UNAPPROVED' && c.owner_approved_native_value === null && c.owner_approval_source === null), 'all F04 values must remain explicitly unapproved');
check(f04Report.PROVENANCE_CLASSIFICATION.owner_approved_native_values === 0, 'F04 report must record zero owner-approved native values');

const rows = [];
for (const civ of civs) for (const parameterId of parameterIds) {
  const key = cellKey(parameterId, civ.id);
  const semantic = semanticByCell.get(key);
  const consumer = consumersById.get(parameterId);
  const csv = csvById.get(parameterId);
  assert.ok(semantic, `semantic cell missing: ${parameterId}/${civ.id}`);
  assert.equal(semantic.rawValue, civ.params[parameterId], `raw/semantic value mismatch: ${parameterId}/${civ.id}`);
  assert.equal(semantic.consumerStatus, csv.current_semantic_status, `semantic/consumer status mismatch: ${parameterId}`);

  let rawApproval;
  if (f04IdSet.has(parameterId)) {
    const provenance = f04ByCell.get(key);
    assert.ok(provenance, `F04 provenance cell missing: ${parameterId}/${civ.id}`);
    assert.equal(provenance.current_raw_value, civ.params[parameterId], `F04 value differs from current raw matrix: ${parameterId}/${civ.id}`);
    rawApproval = {
      status: provenance.approval_classification,
      ownerApprovedValue: provenance.owner_approved_native_value,
      ownerApprovalSource: provenance.owner_approval_source,
      candidateEqualsCreationSeed: provenance.current_matches_creation_seed,
      evidence: 'handoff-pr141/matrix/f04-provenance-cells.json; candidate/seed equality is provenance only, not approval',
    };
  } else {
    rawApproval = {
      status: 'NOT_ASSESSED_BY_F04_SOURCE_AUDIT',
      ownerApprovedValue: null,
      ownerApprovalSource: null,
      evidence: 'This task records current raw value; approval of this non-F04 cell was not re-audited.',
    };
  }

  const topicReceipt = {
    lud_wzrost_proc: ['R-PR141-CODEX-POPULATION-20261017', 'Topic-level operator defense receipt; evaluator recheck 24/24; cap closed; main.ts happiness hookup remains OPEN_NOT_PROVEN; separate FC pending.'],
    lud_spadek_proc: ['R-PR141-CODEX-POPULATION-20261017', 'Topic-level operator defense receipt; evaluator recheck 24/24; cap closed; main.ts happiness hookup remains OPEN_NOT_PROVEN; separate FC pending.'],
    lud_zdrowie_proc: ['R-PR141-CODEX-POPULATION-20261017', 'Topic-level operator defense receipt; evaluator recheck 24/24; cap closed; main.ts happiness hookup remains OPEN_NOT_PROVEN; separate FC pending.'],
    lud_zadowolenie_bazowe: ['R-PR141-CODEX-POPULATION-20261017', 'Topic-level operator defense receipt; evaluator recheck 24/24; cap closed; main.ts happiness hookup remains OPEN_NOT_PROVEN; separate FC pending.'],
    lud_limit_populacji: ['R-PR141-CODEX-POPULATION-20261017', 'Topic-level operator defense receipt; evaluator recheck 24/24; cap closed; main.ts happiness hookup remains OPEN_NOT_PROVEN; separate FC pending.'],
    ai_ekspansywnosc: ['R-PR141-CODEX-AI-STRATEGY-20261017', 'Topic-level operator defense receipt 19/19; evaluator recheck in progress.'],
    ai_sklonnosc_podboju: ['R-PR141-CODEX-AI-STRATEGY-20261017', 'Topic-level operator defense receipt 19/19; evaluator recheck in progress.'],
    ai_tolerancja_ryzyka: ['R-PR141-CODEX-AI-STRATEGY-20261017', 'Topic-level operator defense receipt 19/19; evaluator recheck in progress.'],
    ai_profil_obronna: ['R-PR141-CODEX-AI-STRATEGY-20261017', 'Topic-level operator defense receipt 19/19; evaluator recheck in progress.'],
    dip_handlowosc_archetyp: ['R-PR141-CODEX-AI-STRATEGY-20261017', 'Topic-level operator defense receipt 19/19; evaluator recheck in progress.'],
    ai_priorytet_militarny: ['R-PR141-CODEX-AI-PRODUCTION-20261017', 'Topic-level operator defense/evaluator recheck 23/23; two objections closed; Final Control pending.'],
    ai_priorytet_ekonomia: ['R-PR141-CODEX-AI-PRODUCTION-20261017', 'Topic-level operator defense/evaluator recheck 23/23; two objections closed; Final Control pending.'],
    ai_priorytet_nauka: ['R-PR141-CODEX-AI-PRODUCTION-20261017', 'Topic-level operator defense/evaluator recheck 23/23; two objections closed; Final Control pending.'],
    walka_atak_kawaleria: ['R-PR141-CODEX-COMBAT-OFFENSE-20261017', 'Topic-level Operator/Evaluator evidence; evaluator raised range and owner-scene objections; operator defense report present; evaluator recheck pending.'],
    walka_atak_rydwany: ['R-PR141-CODEX-COMBAT-OFFENSE-20261017', 'Topic-level Operator/Evaluator evidence; evaluator raised range and owner-scene objections; operator defense report present; evaluator recheck pending.'],
    walka_atak_obleczenie: ['R-PR141-CODEX-COMBAT-OFFENSE-20261017', 'Topic-level Operator/Evaluator evidence; evaluator raised range and owner-scene objections; operator defense report present; evaluator recheck pending.'],
    walka_atak_morska: ['R-PR141-CODEX-COMBAT-OFFENSE-20261017', 'Topic-level Operator/Evaluator evidence; evaluator raised range and owner-scene objections; operator defense report present; evaluator recheck pending.'],
    walka_uderzenie_piechota: ['R-PR141-CODEX-COMBAT-OFFENSE-20261017', 'Topic-level Operator/Evaluator evidence; evaluator raised range and owner-scene objections; operator defense report present; evaluator recheck pending.'],
    walka_uderzenie_kawaleria: ['R-PR141-CODEX-COMBAT-OFFENSE-20261017', 'Topic-level Operator/Evaluator evidence; evaluator raised range and owner-scene objections; operator defense report present; evaluator recheck pending.'],
    walka_dystans_rydwany: ['R-PR141-CODEX-COMBAT-OFFENSE-20261017', 'Topic-level Operator/Evaluator evidence; bounded BattleScene range receipt was added during defense; evaluator recheck pending.'],
    walka_atak_piechota_teren_las: ['R-PR141-CODEX-COMBAT-OFFENSE-20261017', 'Topic-level Operator/Evaluator evidence; evaluator raised range and owner-scene objections; operator defense report present; evaluator recheck pending.'],
    walka_atak_piechota_runda_szarzy: ['R-PR141-CODEX-COMBAT-OFFENSE-20261017', 'Topic-level Operator/Evaluator evidence; evaluator raised range and owner-scene objections; operator defense report present; evaluator recheck pending.'],
    walka_atak_piechota_teren_plytkie_morze: ['R-PR141-CODEX-COMBAT-OFFENSE-20261017', 'Topic-level Operator/Evaluator evidence; evaluator raised range and owner-scene objections; operator defense report present; evaluator recheck pending.'],
    walka_obrona_morska: ['R-PR141-CODEX-COMBAT-DEFENSE-20261017', 'Topic-level operator defense 59 assertions; evaluator accepts foreign-owner row control; main.ts owner routing remains NOT_PROVEN; separate FC pending.'],
    walka_obrona_piechota_teren_las: ['R-PR141-CODEX-COMBAT-DEFENSE-20261017', 'Topic-level operator defense 59 assertions; evaluator accepts foreign-owner row control; main.ts owner routing remains NOT_PROVEN; separate FC pending.'],
    walka_obrona_piechota_terytorium_wlasne: ['R-PR141-CODEX-COMBAT-DEFENSE-20261017', 'Topic-level operator defense 59 assertions; evaluator accepts foreign-owner row control; main.ts owner routing remains NOT_PROVEN; separate FC pending.'],
    walka_obrona_piechota_w_murze: ['R-PR141-CODEX-COMBAT-DEFENSE-20261017', 'Topic-level operator defense 59 assertions; evaluator accepts foreign-owner row control; main.ts owner routing remains NOT_PROVEN; separate FC pending.'],
    walka_obrona_piechota_teren_plytkie_morze: ['R-PR141-CODEX-COMBAT-DEFENSE-20261017', 'Topic-level operator defense 59 assertions; evaluator accepts foreign-owner row control; main.ts owner routing remains NOT_PROVEN; separate FC pending.'],
  }[parameterId];
  let behavior;
  if (topicReceipt) {
    behavior = { status: 'TOPIC_LEVEL_RECEIPT_REVIEW_OPEN', topicId: topicReceipt[0], detail: topicReceipt[1] };
  } else if (['mp_regen_proc', 'mp_max_proc', 'mp_koszt_jednostki_proc'].includes(parameterId)) {
    behavior = { status: 'LIMITED_LOCAL_RECEIPT_REVIEWED', topicId: 'R-CYWILIZACJE-MACIERZ-EKO-WEALTH-MANPOWER-SPOL-PROD-REBASE-Q1-20260925', detail: 'Local MP sensitivity review; scope is limited and does not establish full matrix acceptance.' };
  } else if (parameterId === 'walka_ruch_bitwa_proc') {
    behavior = { status: 'LIMITED_LOCAL_RECEIPT_REVIEWED', topicId: 'R-CYWILIZACJE-MACIERZ-EKO-WEALTH-MANPOWER-SPOL-PROD-REBASE-Q1-20260925', detail: 'Local F05 Egypt movement receipt; this does not approve other combat holds.' };
  } else if (parameterId === 'walka_koszt_rekrutacji_proc') {
    behavior = { status: 'LIMITED_LOCAL_RECEIPT_REVIEWED', topicId: 'R-CYWILIZACJE-MACIERZ-EKO-WEALTH-MANPOWER-SPOL-PROD-REBASE-Q1-20260925', detail: 'Local G11 Zulu/Impi discount receipt; F04 raw values remain unapproved.' };
  } else {
    behavior = { status: 'NO_CELL_LEVEL_BEHAVIOR_RECEIPT_RECORDED', topicId: null, detail: 'Consumer labels and source references are not behavioral acceptance.' };
  }

  rows.push({
    parameter_id: parameterId,
    civilization_id: civ.id,
    civilization_name: civ.name,
    raw_value: civ.params[parameterId],
    raw_source: 'gra/data/civ-matrix.json',
    raw_approval: rawApproval,
    semantic: {
      label: semantic.label,
      status: semantic.consumerStatus,
      snapshot_difficulty: semanticDoc.difficulty,
      note: 'Semantic label is descriptive relative to its snapshot; it is not gameplay acceptance.',
    },
    consumer: {
      current_status: csv.current_semantic_status,
      current_reference_count: Number(csv.current_reference_count),
      current_reference_files: csv.current_reference_files ? csv.current_reference_files.split(';').filter(Boolean) : [],
      runtime_acceptance: consumer.runtimeAcceptance,
      note: 'Reference inventory alone does not prove a terminal behavioral effect.',
    },
    behavior_receipt: behavior,
    owner_ai: { status: 'NOT_VERIFIED_PER_CELL_FOR_OWNER_AND_AI', evidence: 'Operator receipts cover named scenarios only; no cell-wide owner/player/AI parity claim.' },
    difficulty: { status: 'NORMAL_SEMANTIC_SNAPSHOT_ONLY; RUNTIME_DIFFICULTY_NOT_VERIFIED', evidence: semantic.difficultyBehaviorPl ?? null },
    save_load: { status: 'NOT_VERIFIED', evidence: null },
    browser: { status: 'NOT_VERIFIED', evidence: null },
  });
}

validateCellRows(rows, expectedKeys);
const validateRowEvidence = row => validateEvidenceClassification(row, receiptPolicy, f04ByCell.get(cellKey(row.parameter_id, row.civilization_id)));
rows.forEach(validateRowEvidence);
let missingRejected = false;
try { validateCellRows(rows.slice(1), expectedKeys); } catch { missingRejected = true; }
let duplicateRejected = false;
try { validateCellRows([...rows, rows[0]], expectedKeys); } catch { duplicateRejected = true; }
check(missingRejected, 'negative control must reject one missing cell');
check(duplicateRejected, 'negative control must reject one duplicated cell');
const ludReceipt = rows.find(r => r.parameter_id === 'lud_wzrost_proc');
let wrongTopicRejected = false;
try { validateRowEvidence({ ...ludReceipt, behavior_receipt: { ...ludReceipt.behavior_receipt, topicId: 'R-PR141-CODEX-COMBAT-OFFENSE-20261017' } }); } catch { wrongTopicRejected = true; }
check(wrongTopicRejected, 'negative control must reject a receipt attributed to the wrong topic');
const f04Cell = rows.find(r => f04IdSet.has(r.parameter_id));
let falseApprovalRejected = false;
const fakeF04Evidence = { ...f04ByCell.get(cellKey(f04Cell.parameter_id, f04Cell.civilization_id)), approval_classification: 'APPROVED_MATCH', owner_approved_native_value: f04Cell.raw_value, owner_approval_source: 'unverified' };
try { validateEvidenceClassification({ ...f04Cell, raw_approval: { ...f04Cell.raw_approval, status: 'APPROVED_MATCH', ownerApprovedValue: f04Cell.raw_value, ownerApprovalSource: 'unverified' } }, receiptPolicy, f04ByCell.get(cellKey(f04Cell.parameter_id, f04Cell.civilization_id))); } catch { falseApprovalRejected = true; }
check(falseApprovalRejected, 'negative control must reject complete but unsupported F04 approval promotion');
const authorizedF04SourceProbe = { ...fakeF04Evidence, owner_approval_source: 'authenticated-owner-decision-record' };
const authorizedF04LedgerProbe = { ...f04Cell, raw_approval: { ...f04Cell.raw_approval, status: 'APPROVED_MATCH', ownerApprovedValue: f04Cell.raw_value, ownerApprovalSource: authorizedF04SourceProbe.owner_approval_source } };
validateEvidenceClassification(authorizedF04LedgerProbe, receiptPolicy, authorizedF04SourceProbe);
const unmappedReceiptCell = rows.find(r => !receiptPolicy.has(r.parameter_id) && !f04IdSet.has(r.parameter_id));
let unmappedLocalReceiptRejected = false;
try { validateRowEvidence({ ...unmappedReceiptCell, behavior_receipt: { status: 'LIMITED_LOCAL_RECEIPT_REVIEWED', topicId: null, detail: 'unsupported' } }); } catch { unmappedLocalReceiptRejected = true; }
check(unmappedLocalReceiptRejected, 'negative control must reject limited local receipt outside explicit mapping');
let unsupportedBrowserRejected = false;
try { validateRowEvidence({ ...rows[0], browser: { status: 'VERIFIED', evidence: null } }); } catch { unsupportedBrowserRejected = true; }
check(unsupportedBrowserRejected, 'negative control must reject browser verification without evidence');
let unsupportedSaveLoadRejected = false;
try { validateRowEvidence({ ...rows[0], save_load: { status: 'VERIFIED', evidence: null } }); } catch { unsupportedSaveLoadRejected = true; }
check(unsupportedSaveLoadRejected, 'negative control must reject save/load verification without evidence');
validateRowEvidence({ ...rows[0], save_load: { status: 'VERIFIED', evidence: 'future-authorized-save-load-receipt' } });

const ledger = {
  schema_version: 1,
  generated_at: new Date().toISOString(),
  topic_id: 'R-PR141-CODEX-EVIDENCE-LEDGER-20261017',
  round: '1/5',
  base_head: consumerDoc.head,
  scope: 'Evidence inventory only; no semantic upgrades, product acceptance, or F04 data activation.',
  counts: {
    parameter_ids: parameterIds.length,
    civilizations: civs.length,
    raw_cells: rows.length,
    semantic_cells: semanticDoc.cells.length,
    current_consumer_classifications: csvCounts,
    f04_parameter_ids: f04Ids.length,
    f04_cells: f04Doc.cells.length,
    f04_approved_values: f04Report.PROVENANCE_CLASSIFICATION.owner_approved_native_values,
  },
  source_hashes: Object.fromEntries(Object.entries(sources).map(([key, file]) => [key, sha256(file)])),
  tests: {
    result: 'PASS',
    positive: ['93 raw parameter IDs × 15 civilization keys = 1,395 unique product cells', 'every semantic cell and consumer parameter reconciles to the raw matrix inventory', 'all 24 F04 IDs and 360 provenance cells reconcile exactly to raw values'],
    negative: ['removing a cell is rejected', 'duplicating a cell is rejected', 'wrong topic attribution is rejected', 'unsupported complete F04 approval promotion is rejected', 'unmapped limited local receipt is rejected', 'browser verification without evidence is rejected', 'save/load verification without evidence is rejected'],
    positive_mutation_controls: ['future APPROVED_MATCH is accepted only when it matches the supplied source record and exact raw value', 'save/load verification is structurally allowed when evidence is supplied'],
    validation_counts: { raw_parameter_ids: 93, civilization_keys: 15, matrix_cells: 1395, f04_ids: 24, f04_cells: 360, negative_mutations_rejected: 7, positive_future_evidence_controls: 2 },
    behavior_claim: 'No game behavior is asserted by this structural test. Topic-level receipts are attribution only, not cell-level evidence or acceptance.',
  },
  evidence_columns: ['raw_value', 'raw_approval', 'semantic', 'consumer', 'behavior_receipt', 'owner_ai', 'difficulty', 'save_load', 'browser'],
  cells: rows,
};
fs.writeFileSync(path.join(evidenceDir, 'matrix-93x15-evidence-ledger.json'), `${JSON.stringify(ledger, null, 2)}\n`);
console.log(`PR141 evidence ledger structural checks PASS: ${rows.length} cells; 93 parameters; 15 civilizations; F04 ${f04Ids.length}/360 unapproved; seven negative controls reject coverage/topic/approval/save-load/browser false claims; two positive controls allow matching sourced F04 approval and sourced save/load evidence.`);
