#!/usr/bin/env node
/**
 * AutoBot smoke test — Moduły 1–5 (R-PROC-AUTOBOT Spec v1 + P0)
 * Uruchom: node dyspozycje/autobot/tools/autobot-smoke.cjs
 */
'use strict';

const path = require('path');
const fs = require('fs');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist-smoke');
const TMP_PB = path.join(ROOT, 'logs', 'playbook-smoke-tmp.json');
const TMP_HISTORY = path.join(ROOT, 'logs', 'run-history-smoke.jsonl');

function compileTs() {
  const { execSync } = require('child_process');
  const tsc = path.resolve(__dirname, '../../../gra/node_modules/typescript/bin/tsc');
  if (!fs.existsSync(tsc)) {
    throw new Error('tsc not found at gra/node_modules/typescript/bin/tsc');
  }
  execSync(`node "${tsc}" -p "${path.join(ROOT, 'tsconfig.json')}" --outDir "${DIST}" --noEmit false`, {
    stdio: 'pipe',
  });
}

function loadModule() {
  compileTs();
  return {
    loadPlaybook: require(path.join(DIST, 'playbook-manager.js')).loadPlaybook,
    savePlaybook: require(path.join(DIST, 'playbook-manager.js')).savePlaybook,
    getOperatorSystemRules: require(path.join(DIST, 'playbook-manager.js')).getOperatorSystemRules,
    retireWeakRules: require(path.join(DIST, 'playbook-manager.js')).retireWeakRules,
    OperatorAgent: require(path.join(DIST, 'operator-agent.js')).OperatorAgent,
    EvaluatorAgent: require(path.join(DIST, 'evaluator-agent.js')).EvaluatorAgent,
    computePerformanceScore: require(path.join(DIST, 'hard-metrics.js')).computePerformanceScore,
    pruneFeatureWeights: require(path.join(DIST, 'feature-pruning.js')).pruneFeatureWeights,
    assertActionAllowed: require(path.join(DIST, 'guardrails.js')).assertActionAllowed,
    canDeclareWinner: require(path.join(DIST, 'guardrails.js')).canDeclareWinner,
    buildPostmortemEntry: require(path.join(DIST, 'logging.js')).buildPostmortemEntry,
    readRunHistory: require(path.join(DIST, 'logging.js')).readRunHistory,
    randomUUID: require('crypto').randomUUID,
  };
}

function resetSmokeHistory() {
  if (fs.existsSync(TMP_HISTORY)) fs.unlinkSync(TMP_HISTORY);
  // Redirect run-history via env — logging uses fixed path; copy/delete instead
  const histPath = path.join(ROOT, 'logs', 'run-history.jsonl');
  if (fs.existsSync(histPath)) {
    fs.copyFileSync(histPath, TMP_HISTORY + '.bak');
    fs.unlinkSync(histPath);
  }
}

function restoreSmokeHistory() {
  const histPath = path.join(ROOT, 'logs', 'run-history.jsonl');
  if (fs.existsSync(TMP_HISTORY + '.bak')) {
    fs.copyFileSync(TMP_HISTORY + '.bak', histPath);
    fs.unlinkSync(TMP_HISTORY + '.bak');
  } else if (fs.existsSync(histPath)) {
    fs.unlinkSync(histPath);
  }
  const tempFiles = [
    path.join(ROOT, 'logs', 'playbook-delay-smoke.json'),
    path.join(ROOT, 'logs', 'playbook-retire-smoke.json'),
    path.join(ROOT, 'logs', 'playbook-eval-retire-smoke.json'),
  ];
  for (const f of tempFiles) {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
}

async function main() {
  resetSmokeHistory();
  const mod = loadModule();
  let passed = 0;

  // 1. Dev score — pusty / niepełny metrics → 0
  assert.strictEqual(mod.computePerformanceScore({}, 0), 0, 'empty metrics score 0');
  assert.strictEqual(
    mod.computePerformanceScore({
      profile: 'dev',
      typecheckOk: true,
      buildPassed: true,
      linterPassed: true,
      testsFailed: 0,
    }, 0),
    0,
    'Dev bez HITL = 0',
  );
  console.log('1. Dev score anti confidence-machine — PASS');
  passed++;

  // 2. Load playbook (temp copy)
  const pbPath = path.join(ROOT, 'playbook.json');
  fs.mkdirSync(path.dirname(TMP_PB), { recursive: true });
  fs.copyFileSync(pbPath, TMP_PB);
  const pb = mod.loadPlaybook(TMP_PB);
  assert.strictEqual(pb.version, 5, 'playbook version');
  assert.ok(pb.min_confidence_threshold >= 0.6, 'min_confidence_threshold');
  assert.ok(Array.isArray(pb.rules) && pb.rules.length >= 4, 'rules array');
  assert.ok(pb.rules[0].rule_text, 'rule_text present');
  assert.strictEqual(pb.rules[0].status, 'ACTIVE', 'ACTIVE status');
  assert.ok(Array.isArray(pb.quarantine_rules), 'quarantine_rules');
  const operatorRules = mod.getOperatorSystemRules(pb);
  assert.ok(operatorRules.length >= 4, 'getOperatorSystemRules ACTIVE');
  console.log('2. load playbook — PASS');
  passed++;

  // 3. Operator stub safe action
  const op = new mod.OperatorAgent(TMP_PB);
  const safeRun = await op.run({
    taskId: 'SMOKE-001',
    summary: 'safe stub',
    actionId: 'run-lane-tests',
    context: { taskId: 'SMOKE-001', acChecklist: ['tsc'] },
  });
  assert.strictEqual(safeRun.success, true, 'safe action success');
  assert.ok(!safeRun.blockedByGuardrail, 'no guardrail block');
  console.log('3. Operator stub safe action — PASS');
  passed++;

  // 4. Evaluator fake metrics → performanceScore (allowPlaybookMutation dla smoke)
  const ev = new mod.EvaluatorAgent();
  const metrics = {
    profile: 'dev',
    testsPassed: 10,
    testsFailed: 0,
    typecheckOk: true,
    buildPassed: true,
    linterPassed: true,
    humanApproved: true,
  };
  const score = mod.computePerformanceScore(metrics, 0.1);
  assert.ok(score > 0 && score <= 1, 'performanceScore range');
  const evalResult = ev.evaluate({
    run: safeRun,
    metrics,
    baseline: { profile: 'dev', testsPassed: 8, testsFailed: 0, typecheckOk: true },
    playbookPath: TMP_PB,
    complexityPenalty: 0.05,
    allowPlaybookMutation: true,
  });
  assert.ok(evalResult.performanceScore != null, 'evaluation has performanceScore');
  assert.ok(evalResult.metricBefore, 'metricBefore');
  assert.ok(evalResult.metricAfter, 'metricAfter');
  console.log('4. Evaluator performanceScore — PASS');
  passed++;

  // 5. pruneFeatureWeights synthetic history
  const runs = [];
  for (let i = 0; i < 10; i++) {
    const success = i < 5;
    runs.push({
      id: mod.randomUUID(),
      startedAtIso: new Date().toISOString(),
      finishedAtIso: new Date().toISOString(),
      taskId: `T${i}`,
      taskSummary: 'synthetic',
      operatorRuleIds: [],
      contextPayload: {
        signal: success ? 1 : 0,
        noise: 0.5,
      },
      actionId: 'run-lane-tests',
      success,
      successScore: success ? 1 : 0,
    });
  }
  const pruneReport = mod.pruneFeatureWeights({
    runs,
    featureWeights: [
      { name: 'signal', weight: 1, enabled: true },
      { name: 'noise', weight: 1, enabled: true },
    ],
    opts: { minRuns: 5, correlationThreshold: 0.05 },
  });
  assert.ok(pruneReport.evaluatedRuns === 10, 'prune evaluatedRuns');
  assert.ok(pruneReport.keptAttributes.includes('signal'), 'signal kept');
  assert.ok(pruneReport.prunedAttributes.includes('noise'), 'noise pruned');
  assert.ok(pruneReport.actionsTaken.some(a => a.includes('Removed feature noise')), 'action_taken prune');
  console.log('5. pruneFeatureWeights — PASS');
  passed++;

  // 6. guardrails — merge-main + deny-by-default
  const mergeGate = mod.assertActionAllowed('git-merge-main', {
    humanApproved: true,
    deployPasswordGiven: true,
  });
  assert.strictEqual(mergeGate.allowed, false, 'merge-main blocked');
  assert.strictEqual(mergeGate.risk, 'forbidden', 'merge-main risk forbidden');

  const mergeToMain = mod.assertActionAllowed('merge-to-main', {
    humanApproved: true,
    deployPasswordGiven: true,
  });
  assert.strictEqual(mergeToMain.allowed, false, 'merge-to-main blocked');
  assert.strictEqual(mergeToMain.risk, 'forbidden', 'merge-to-main risk forbidden');

  const gitMerge = mod.assertActionAllowed('git-merge', {
    humanApproved: true,
    deployPasswordGiven: true,
  });
  assert.strictEqual(gitMerge.allowed, false, 'git-merge blocked');
  assert.strictEqual(gitMerge.risk, 'forbidden', 'git-merge risk forbidden');

  const unknown = mod.assertActionAllowed('totally-unknown-action');
  assert.strictEqual(unknown.allowed, false, 'unknown action blocked');
  assert.strictEqual(unknown.risk, 'forbidden', 'unknown risk forbidden');

  const prodGate = mod.assertActionAllowed('deploy-robocza', {
    env: 'production',
    humanApproved: true,
    deployPasswordGiven: true,
  });
  assert.strictEqual(prodGate.allowed, false, 'prod deploy blocked');

  const winnerEarly = mod.canDeclareWinner({
    eventCount: 10,
    minEvents: 1000,
    firstEventAtIso: new Date().toISOString(),
    minDelayHours: 48,
  });
  assert.strictEqual(winnerEarly.ok, false, 'winner delay early');

  const winnerLate = mod.canDeclareWinner({
    eventCount: 10,
    minEvents: 1000,
    firstEventAtIso: new Date(Date.now() - 72 * 3600_000).toISOString(),
    minDelayHours: 48,
  });
  assert.strictEqual(winnerLate.ok, true, 'winner after 48h');
  console.log('6. guardrails deny-by-default + delay — PASS');
  passed++;

  // 7. retireWeakRules → status RETIRED (nie QUARANTINE)
  const retirePbPath = path.join(ROOT, 'logs', 'playbook-retire-smoke.json');
  const retirePb = mod.loadPlaybook(TMP_PB);
  retirePb.thresholds.minRunsForSignificance = 3;
  retirePb.thresholds.deprecateBelowWinRate = 0.3;
  retirePb.rules = [
    {
      id: 'rule_weak_smoke',
      rule_text: 'weak rule for smoke',
      status: 'ACTIVE',
      win_count: 0,
      fail_count: 5,
      win_rate: 0,
      lastUpdatedIso: new Date().toISOString(),
    },
  ];
  retirePb.quarantine_rules = [];
  mod.savePlaybook(retirePb, retirePbPath);
  const loadedRetire = mod.loadPlaybook(retirePbPath);
  const retireUpdates = mod.retireWeakRules(loadedRetire, new Date().toISOString(), true);
  assert.ok(retireUpdates.length === 1, 'one retire update');
  assert.strictEqual(retireUpdates[0].kind, 'retire', 'kind retire');
  const retiredInQuarantine = loadedRetire.quarantine_rules.find(r => r.id === 'rule_weak_smoke');
  assert.ok(retiredInQuarantine, 'rule moved to quarantine_rules');
  assert.strictEqual(retiredInQuarantine.status, 'RETIRED', 'status RETIRED not QUARANTINE');
  console.log('7. retireWeakRules RETIRED — PASS');
  passed++;

  // 8. evaluate z historią + delay deferred (bez allowPlaybookMutation)
  const delayPbPath = path.join(ROOT, 'logs', 'playbook-delay-smoke.json');
  fs.copyFileSync(pbPath, delayPbPath);
  const delayPb = mod.loadPlaybook(delayPbPath);
  delayPb.thresholds.minEventsForWinner = 1000;
  delayPb.thresholds.evaluationDelayHours = 48;
  mod.savePlaybook(delayPb, delayPbPath);
  const attrsBeforeDelay = [...delayPb.operatorContextAttributes];

  const delayRun = {
    id: mod.randomUUID(),
    startedAtIso: new Date().toISOString(),
    finishedAtIso: new Date().toISOString(),
    taskId: 'DELAY-001',
    taskSummary: 'delay smoke',
    operatorRuleIds: ['rule_101'],
    contextPayload: {},
    actionId: 'run-lane-tests',
    success: true,
  };
  const delayResult = ev.evaluate({
    run: delayRun,
    metrics: {
      profile: 'dev',
      testsPassed: 5,
      testsFailed: 0,
      typecheckOk: true,
      buildPassed: true,
      linterPassed: true,
      humanApproved: true,
    },
    playbookPath: delayPbPath,
    allowPlaybookMutation: false,
  });
  assert.ok(delayResult.postmortem.includes('playbookMutationDeferred'), 'deferred in postmortem');
  assert.ok(
    !delayResult.playbookUpdates.some(u => u.kind === 'retire' || u.kind === 'quarantine'),
    'no retire/quarantine when delay blocks mutation',
  );
  const delayPbAfter = mod.loadPlaybook(delayPbPath);
  assert.deepStrictEqual(
    delayPbAfter.operatorContextAttributes,
    attrsBeforeDelay,
    'operatorContextAttributes unchanged on defer',
  );
  assert.ok(
    delayResult.playbookUpdates.some(u => u.kind === 'win' || u.kind === 'loss'),
    'recordRuleOutcome win/loss still recorded on defer',
  );
  assert.ok(mod.readRunHistory().length >= 1, 'run history appended');
  console.log('8. evaluate history + delay deferred — PASS');
  passed++;

  // 9. evaluate → retire przez ścieżkę evaluate (nie bezpośrednie retireWeakRules)
  const evalRetirePbPath = path.join(ROOT, 'logs', 'playbook-eval-retire-smoke.json');
  const evalRetirePb = mod.loadPlaybook(TMP_PB);
  evalRetirePb.thresholds.minRunsForSignificance = 3;
  evalRetirePb.thresholds.deprecateBelowWinRate = 0.3;
  evalRetirePb.thresholds.minEventsForWinner = 1;
  evalRetirePb.thresholds.evaluationDelayHours = 0;
  evalRetirePb.rules = [
    {
      id: 'rule_eval_retire_smoke',
      rule_text: 'weak rule — evaluate retire path',
      status: 'ACTIVE',
      win_count: 0,
      fail_count: 5,
      win_rate: 0,
      lastUpdatedIso: new Date().toISOString(),
    },
  ];
  evalRetirePb.quarantine_rules = [];
  mod.savePlaybook(evalRetirePb, evalRetirePbPath);

  const evalRetireRun = {
    id: mod.randomUUID(),
    startedAtIso: new Date().toISOString(),
    finishedAtIso: new Date().toISOString(),
    taskId: 'EVAL-RETIRE-001',
    taskSummary: 'evaluate retire smoke',
    operatorRuleIds: ['rule_eval_retire_smoke'],
    contextPayload: {},
    actionId: 'run-lane-tests',
    success: true,
  };
  const evalRetireResult = ev.evaluate({
    run: evalRetireRun,
    metrics: {
      profile: 'dev',
      testsPassed: 5,
      testsFailed: 0,
      typecheckOk: true,
      buildPassed: true,
      linterPassed: true,
      humanApproved: true,
    },
    playbookPath: evalRetirePbPath,
    allowPlaybookMutation: true,
  });
  assert.ok(
    evalRetireResult.playbookUpdates.some(u => u.kind === 'retire'),
    'evaluate path emits retire update',
  );
  const evalRetirePbAfter = mod.loadPlaybook(evalRetirePbPath);
  const retiredViaEvaluate = evalRetirePbAfter.quarantine_rules.find(
    r => r.id === 'rule_eval_retire_smoke',
  );
  assert.ok(retiredViaEvaluate, 'rule moved to quarantine_rules via evaluate');
  assert.strictEqual(retiredViaEvaluate.status, 'RETIRED', 'status RETIRED via evaluate path');
  assert.ok(
    !evalRetirePbAfter.rules.some(r => r.id === 'rule_eval_retire_smoke'),
    'rule removed from active rules',
  );
  console.log('9. evaluate → retireWeakRules path — PASS');
  passed++;

  // 10. dashboard log required fields
  const entry = mod.buildPostmortemEntry({
    runId: safeRun.id,
    success: true,
    metricBefore: { prSuccessRate: 0.8 },
    metricAfter: { prSuccessRate: 1.0 },
    deltaPercentage: 25,
    postmortemReasoning: 'smoke test',
    actionTaken: 'Removed feature noise',
  });
  const required = [
    'run_id',
    'timestamp',
    'metric_before',
    'metric_after',
    'delta_percentage',
    'postmortem_reasoning',
    'action_taken',
  ];
  for (const field of required) {
    assert.ok(field in entry, `log field ${field}`);
  }
  console.log('10. dashboard log fields — PASS');
  passed++;

  restoreSmokeHistory();
  console.log(`\nautobot-smoke: ${passed}/10 PASS`);
  process.exit(0);
}

main().catch(err => {
  restoreSmokeHistory();
  console.error('autobot-smoke FAIL:', err);
  process.exit(1);
});
