#!/usr/bin/env node
/**
 * AutoBot smoke test — Moduły 1–5 (R-PROC-AUTOBOT Spec v1)
 * Uruchom: node dyspozycje/autobot/tools/autobot-smoke.cjs
 */
'use strict';

const path = require('path');
const fs = require('fs');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist-smoke');
const TMP_PB = path.join(ROOT, 'logs', 'playbook-smoke-tmp.json');

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
    getOperatorSystemRules: require(path.join(DIST, 'playbook-manager.js')).getOperatorSystemRules,
    OperatorAgent: require(path.join(DIST, 'operator-agent.js')).OperatorAgent,
    EvaluatorAgent: require(path.join(DIST, 'evaluator-agent.js')).EvaluatorAgent,
    computePerformanceScore: require(path.join(DIST, 'hard-metrics.js')).computePerformanceScore,
    pruneFeatureWeights: require(path.join(DIST, 'feature-pruning.js')).pruneFeatureWeights,
    assertActionAllowed: require(path.join(DIST, 'guardrails.js')).assertActionAllowed,
    canDeclareWinner: require(path.join(DIST, 'guardrails.js')).canDeclareWinner,
    buildPostmortemEntry: require(path.join(DIST, 'logging.js')).buildPostmortemEntry,
    randomUUID: require('crypto').randomUUID,
  };
}

async function main() {
  const mod = loadModule();
  let passed = 0;

  // 1. Load playbook (temp copy — evaluator nie mutuje kanonu)
  const pbPath = path.join(ROOT, 'playbook.json');
  fs.mkdirSync(path.dirname(TMP_PB), { recursive: true });
  fs.copyFileSync(pbPath, TMP_PB);
  const pb = mod.loadPlaybook(TMP_PB);
  assert.strictEqual(pb.version, 2, 'playbook version');
  assert.ok(pb.min_confidence_threshold >= 0.6, 'min_confidence_threshold');
  assert.ok(Array.isArray(pb.rules) && pb.rules.length >= 4, 'rules array');
  assert.ok(pb.rules[0].rule_text, 'rule_text present');
  assert.strictEqual(pb.rules[0].status, 'ACTIVE', 'ACTIVE status');
  assert.ok(Array.isArray(pb.quarantine_rules), 'quarantine_rules');
  const operatorRules = mod.getOperatorSystemRules(pb);
  assert.ok(operatorRules.length >= 4, 'getOperatorSystemRules ACTIVE');
  console.log('1. load playbook — PASS');
  passed++;

  // 2. Operator stub safe action
  const op = new mod.OperatorAgent(TMP_PB);
  const safeRun = await op.run({
    taskId: 'SMOKE-001',
    summary: 'safe stub',
    actionId: 'run-lane-tests',
    context: { taskId: 'SMOKE-001', acChecklist: ['tsc'] },
  });
  assert.strictEqual(safeRun.success, true, 'safe action success');
  assert.ok(!safeRun.blockedByGuardrail, 'no guardrail block');
  console.log('2. Operator stub safe action — PASS');
  passed++;

  // 3. Evaluator fake metrics → performanceScore
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
  });
  assert.ok(evalResult.performanceScore != null, 'evaluation has performanceScore');
  assert.ok(evalResult.metricBefore, 'metricBefore');
  assert.ok(evalResult.metricAfter, 'metricAfter');
  console.log('3. Evaluator performanceScore — PASS');
  passed++;

  // 4. pruneFeatureWeights synthetic history
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
  console.log('4. pruneFeatureWeights — PASS');
  passed++;

  // 5. guardrail blocks merge-main
  const mergeGate = mod.assertActionAllowed('git-merge-main', {
    humanApproved: true,
    deployPasswordGiven: true,
  });
  assert.strictEqual(mergeGate.allowed, false, 'merge-main blocked');
  assert.ok(mergeGate.reason.includes('merge') || mergeGate.reason.includes('zabroniona'), 'merge reason');

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
  console.log('5. guardrails — PASS');
  passed++;

  // 6. log required fields
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
  console.log('6. dashboard log fields — PASS');
  passed++;

  console.log(`\nautobot-smoke: ${passed}/6 PASS`);
  process.exit(0);
}

main().catch(err => {
  console.error('autobot-smoke FAIL:', err);
  process.exit(1);
});
