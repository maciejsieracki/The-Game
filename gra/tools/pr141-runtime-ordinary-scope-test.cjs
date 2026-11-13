#!/usr/bin/env node
'use strict';

// Bounded contract test of the candidate's actual exported guard/status
// functions. The preflight case invokes the real CLI branch with filesystem
// writes and browser loading trapped. No app, browser, server, or world runs.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const candidatePath = path.join(__dirname, 'pr141-runtime-ordinary-flow-harness.cjs');
const mainPath = path.join(__dirname, '../src/main.ts');
const harness = require(candidatePath);
const failures = [];
const passed = [];

function check(name, fn) {
  try {
    fn();
    passed.push(name);
  } catch (err) {
    failures.push(`${name}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function checkAsync(name, fn) {
  try {
    await fn();
    passed.push(name);
  } catch (err) {
    failures.push(`${name}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

check('candidate import did not load Playwright or Vite', () => {
  assert.equal(Object.keys(require.cache).some((key) => /node_modules\/(playwright|vite)\//.test(key)), false);
});

check('actual authorization guard rejects missing authorization flag and record', () => {
  assert.throws(() => harness.checkAuthorization({}), /Missing --authorize-runtime-ordinary-slice/);
  assert.throws(() => harness.checkAuthorization({ authorized: true }), /Missing --authorization-record/);
});

check('actual authorization guard rejects a synthetic mismatched in-memory record', () => {
  const repoRoot = path.resolve(__dirname, '../..');
  const runRelative = 'dyspozycje/autobot/runs/R-PR141-CODEX-RUNTIME-ORDINARY-PREP-20261019';
  const authRelative = `${runRelative}/synthetic-invalid-auth.json`;
  const authPath = path.resolve(repoRoot, authRelative);
  const originalStatSync = fs.statSync;
  const originalRealpathSync = fs.realpathSync;
  const originalReadFileSync = fs.readFileSync;
  const invalidRecord = Buffer.from(JSON.stringify({
    schemaVersion: 1,
    topic: 'wrong-topic',
    questionId: 'wrong-question',
    ownerChoice: 'B',
    runtimeAuthorizedAfterRun55: false,
    runId: 'wrong-run',
    scope: 'wrong-scope',
  }));
  try {
    fs.statSync = (file, ...rest) => path.resolve(String(file)) === authPath
      ? { isFile: () => true }
      : originalStatSync.call(fs, file, ...rest);
    fs.realpathSync = (file, ...rest) => path.resolve(String(file)) === authPath
      ? authPath
      : originalRealpathSync.call(fs, file, ...rest);
    fs.readFileSync = (file, ...rest) => path.resolve(String(file)) === authPath
      ? invalidRecord
      : originalReadFileSync.call(fs, file, ...rest);
    assert.throws(() => harness.checkAuthorization({
      authorized: true,
      'authorization-record': authRelative,
      'run-output': `${runRelative}/synthetic-output`,
    }), /does not explicitly authorize this exact ordinary-flow slice/);
  } finally {
    fs.statSync = originalStatSync;
    fs.realpathSync = originalRealpathSync;
    fs.readFileSync = originalReadFileSync;
  }
});

check('actual authorization binds one output directory and rejects a different path', () => {
  const repoRoot = path.resolve(__dirname, '../..');
  const runRelative = 'dyspozycje/autobot/runs/R-PR141-CODEX-RUNTIME-ORDINARY-PREP-20261019';
  const authRelative = `${runRelative}/synthetic-valid-auth.json`;
  const authPath = path.resolve(repoRoot, authRelative);
  const outputRelative = `${runRelative}/synthetic-once/output-a`;
  const originalStatSync = fs.statSync;
  const originalRealpathSync = fs.realpathSync;
  const originalReadFileSync = fs.readFileSync;
  const record = Buffer.from(JSON.stringify({
    schemaVersion: 1, topic: 'R-PR141-CODEX-RUNTIME-ORDINARY-PREP-20261019',
    questionId: 'R-PR141-CODEX-NEXT-REPAIRS-20261019-Q1', ownerChoice: 'A',
    runtimeAuthorizedAfterRun55: true, runId: 'R-PR141-CODEX-RUNTIME-ORDINARY-PREP-20261019',
    scope: 'ordinary-flow-slice-excluding-f05-and-rendered-terrain', outputDirectory: 'synthetic-once/output-a',
  }));
  try {
    fs.statSync = (file, ...rest) => path.resolve(String(file)) === authPath
      ? { isFile: () => true } : originalStatSync.call(fs, file, ...rest);
    fs.realpathSync = (file, ...rest) => path.resolve(String(file)) === authPath
      ? authPath : originalRealpathSync.call(fs, file, ...rest);
    fs.readFileSync = (file, ...rest) => path.resolve(String(file)) === authPath
      ? record : originalReadFileSync.call(fs, file, ...rest);
    const args = { authorized: true, 'authorization-record': authRelative, 'run-output': outputRelative };
    assert.equal(harness.checkAuthorization(args).file, 'synthetic-valid-auth.json');
    assert.throws(() => harness.checkAuthorization({ ...args, 'run-output': `${runRelative}/synthetic-once/output-b` }), /does not explicitly authorize/);
  } finally {
    fs.statSync = originalStatSync;
    fs.realpathSync = originalRealpathSync;
    fs.readFileSync = originalReadFileSync;
  }
});

check('actual status and aggregate functions keep F05/render identity deferred and full goal blocked', () => {
  const defaults = harness.statusBook();
  assert.equal(defaults['f05-battle'].status, 'DEFERRED');
  assert.equal(defaults['live-rendered-terrain-identity'].status, 'DEFERRED');
  assert.equal(defaults['original-full-runtime-goal'].status, 'BLOCKED');

  const fullChecks = { ...defaults };
  for (const key of [
    'legal-seed-input', 'new-game-ui', 'seat-owners', 'ai-civ-readback', 'human-city-founding',
    'world-turn', 'save-slot-ui', 'load-slot-ui', 'seed-readback', 'serialized-mapSnapshot-identity',
    'saved-core-readback', 'saved-state-readback', 'mp-human1', 'mp-human2', 'mp-ai',
    'g11-human1', 'g11-human2', 'g11-ai',
  ]) fullChecks[key] = { status: 'PASS' };
  const fullAggregate = harness.aggregateChecks(fullChecks, [
    'legal-seed-input', 'new-game-ui', 'seat-owners', 'ai-civ-readback', 'human-city-founding',
    'world-turn', 'save-slot-ui', 'load-slot-ui', 'seed-readback', 'serialized-mapSnapshot-identity',
    'live-rendered-terrain-identity', 'saved-core-readback', 'saved-state-readback',
    'mp-human1', 'mp-human2', 'mp-ai', 'f05-battle', 'g11-human1', 'g11-human2', 'g11-ai',
  ], 'full runtime');
  assert.equal(fullAggregate.status, 'BLOCKED');
  assert.equal(harness.aggregateChecks({ a: { status: 'PASS' } }, ['a'], 'ordinary slice').status, 'PASS');
});

check('actual owner projection copies identities, selects the configured major AI, and excludes city-state owners', () => {
  const mainText = fs.readFileSync(mainPath, 'utf8');
  const sourceFile = ts.createSourceFile(mainPath, mainText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let initializer = null;
  function visit(node) {
    if (ts.isPropertyAssignment(node) && ts.isIdentifier(node.name)
        && node.name.text === 'snapshotRuntimeOwnerIdentitiesForTest') initializer = node.initializer;
    if (!initializer) ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  assert.ok(initializer, 'missing actual main.ts read-only owner projection');
  const expression = initializer.getText(sourceFile);
  const compiled = ts.transpileModule(`const projection = ${expression}; this.projection = projection;`, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.None },
  }).outputText;
  const humanOwnerIds = Object.freeze([0, 7]);
  const humanCivs = new Map([[0, 'rzymianie'], [7, 'zulusi']]);
  const aiStarts = Object.freeze([
    Object.freeze({ ownerId: 42 }), Object.freeze({ ownerId: 77 }), Object.freeze({ ownerId: 99 }),
  ]);
  const aiCivs = new Map([[42, 'egipt'], [77, 'egipt'], [99, 'rzymianie']]);
  const context = {
    humanSeats: { humanOwnerIds },
    _menuCivIdByOwner: humanCivs,
    aiStartHexes: aiStarts,
    aiOwnerCivMap: aiCivs,
    typCityCopyOwners: new Set([77]),
  };
  vm.runInNewContext(compiled, context, { timeout: 1000 });
  const owners = context.projection();
  assert.deepEqual(JSON.parse(JSON.stringify(owners.humanOwners)), [
    { ownerId: 0, civKey: 'rzymianie' }, { ownerId: 7, civKey: 'zulusi' },
  ]);
  assert.deepEqual(JSON.parse(JSON.stringify(owners.majorAiOwners)), [
    { ownerId: 42, civKey: 'egipt' }, { ownerId: 99, civKey: 'rzymianie' },
  ]);
  const configuredEgypt = owners.majorAiOwners.filter((row) => row.civKey === 'egipt');
  assert.equal(configuredEgypt.length, 1);
  assert.equal(configuredEgypt[0].ownerId, 42);
  owners.humanOwners[0].civKey = 'poisoned';
  owners.majorAiOwners[0].civKey = 'poisoned';
  owners.humanOwners.push({ ownerId: 123, civKey: 'bad' });
  assert.equal(humanCivs.get(0), 'rzymianie');
  assert.equal(aiCivs.get(42), 'egipt');
  assert.equal(humanOwnerIds.length, 2);
  assert.equal(aiStarts.length, 3);
});

check('actual config accepts only the concrete legal Rome/Zulu/Egypt Iron proposal', () => {
  const cfg = harness.requireConfig({
    url: `file://${candidatePath}`,
    seed: '141',
    'human1-civ': 'rzymianie',
    'human2-civ': 'zulusi',
    'ai-civ': 'egipt',
    epoch: 'zelazo',
  });
  assert.deepEqual([cfg.human1Name, cfg.human2Name, cfg.aiName], ['Rzymianie', 'Zulusi', 'Egipt']);
  assert.equal(cfg.epochName, 'Epoka Zelaza');
  assert.throws(() => harness.requireConfig({
    url: `file://${candidatePath}`, seed: '141', 'human1-civ': 'rzymianie',
    'human2-civ': 'zulusi', 'ai-civ': 'sumer', epoch: 'zelazo',
  }), /requires Rome .* Zulu .* Egypt/);
});

check('actual G11 owner function requires a Zulu Impi roster and rejects non-Zulu Impi leakage', () => {
  const baseCity = { cityId: 'c', manpower: {
    manpowerBiezacy: 4, manpowerMax: 10, regenPerTurn: 1, kosztJednostki: 2,
  } };
  const zuluObservation = { cities: [{ ...baseCity, recruitmentOptions: [
    { id: 'Impi', goldCost: 60, manpowerCost: 1 }, { id: 'Swordsman', goldCost: 60, manpowerCost: 2 },
  ] }] };
  const neutralObservation = { cities: [{ ...baseCity, recruitmentOptions: [{ id: 'Swordsman', goldCost: 60, manpowerCost: 2 }] }] };
  const leakedImpiObservation = { cities: [{ ...baseCity, recruitmentOptions: [
    { id: 'Impi', goldCost: 60, manpowerCost: 1 }, { id: 'Swordsman', goldCost: 60, manpowerCost: 2 },
  ] }] };
  assert.equal(harness.ownerObservationChecks(neutralObservation, 0, 'Rome', 'rzymianie').g11.status, 'NOT APPLICABLE');
  assert.equal(harness.ownerObservationChecks(neutralObservation, 42, 'Egypt', 'egipt').g11.status, 'NOT APPLICABLE');
  assert.equal(harness.ownerObservationChecks(leakedImpiObservation, 0, 'Rome', 'rzymianie').g11.status, 'FAIL');
  assert.equal(harness.ownerObservationChecks(leakedImpiObservation, 42, 'Egypt', 'egipt').g11.status, 'FAIL');
  assert.equal(harness.ownerObservationChecks(zuluObservation, 7, 'Zulu', 'zulusi').g11.status, 'PASS');
  const missingGold = { cities: [{ ...baseCity, recruitmentOptions: [{ id: 'Impi', manpowerCost: 1 }, { id: 'Swordsman', manpowerCost: 2 }] }] };
  assert.equal(harness.ownerObservationChecks(missingGold, 7, 'Zulu', 'zulusi').g11.status, 'BLOCKED');
  assert.equal(harness.ownerObservationChecks({ cities: [baseCity] }, 0, 'Rome', 'rzymianie').g11.status, 'BLOCKED');
  assert.equal(harness.neutralRosterControl(
    [{ id: 'Swordsman', goldCost: 60 }], [{ name: 'Swordsman', goldCostText: '60' }],
  ).status, 'NOT APPLICABLE');
  assert.equal(harness.neutralRosterControl(
    [{ id: 'Impi', goldCost: 60 }], [{ name: 'Swordsman', goldCostText: '60' }],
  ).status, 'FAIL');
  assert.equal(harness.neutralRosterControl(
    [{ id: 'Swordsman', goldCost: 60 }], [{ name: 'Impi', goldCostText: '60' }],
  ).status, 'FAIL');
  assert.equal(harness.neutralRosterControl([], []).status, 'BLOCKED');
  assert.equal(harness.eligibleOwnerAndNeutralControls({
    'g11-human1': { status: 'NOT APPLICABLE' },
    'g11-human2': { status: 'PASS' },
    'g11-ai': { status: 'NOT APPLICABLE' },
  }).status, 'PASS');
  assert.equal(harness.eligibleOwnerAndNeutralControls({
    'g11-human1': { status: 'PASS' }, 'g11-human2': { status: 'PASS' }, 'g11-ai': { status: 'NOT APPLICABLE' },
  }).status, 'BLOCKED');
});

check('actual runtime budget guard enforces exact 10-minute phase and 30-minute total boundaries', () => {
  assert.equal(harness.budgetExceeded(30 * 60 * 1000, 10 * 60 * 1000), false);
  assert.equal(harness.budgetExceeded(30 * 60 * 1000 + 1, 1), true);
  assert.equal(harness.budgetExceeded(1, 10 * 60 * 1000 + 1), true);
  assert.equal(harness.MAX_PHASE_MS, 10 * 60 * 1000);
  assert.equal(harness.MAX_TOTAL_MS, 30 * 60 * 1000);
});

check('actual turn acceptance requires two human submissions and exactly one increment', () => {
  assert.equal(harness.assertOneWorldTurn(12, 12, 13, 2), true);
  assert.throws(() => harness.assertOneWorldTurn(12, 12, 13, 1), /Exactly two distinct human submissions/);
  assert.throws(() => harness.assertOneWorldTurn(12, 12, 14, 2), /exactly one world turn/);
  assert.throws(() => harness.assertOneWorldTurn(12, 13, 14, 2), /First hot-seat submission/);
});

check('actual screenshot path builder keeps repeated stage captures unique and contained', () => {
  const output = path.resolve(__dirname, '../dyspozycje/autobot/runs/R-PR141-CODEX-RUNTIME-ORDINARY-PREP-20261019/mock-output');
  const pre = harness.makeScreenshotPath(output, 'human-1-pre-turn', 1);
  const post = harness.makeScreenshotPath(output, 'human-1-post-turn', 2);
  const afterLoad = harness.makeScreenshotPath(output, 'human-1-post-load', 3);
  assert.equal(new Set([pre, post, afterLoad]).size, 3);
  for (const file of [pre, post, afterLoad]) {
    const relative = path.relative(output, file);
    assert.equal(relative.startsWith('..') || path.isAbsolute(relative), false);
  }
  const sanitized = harness.makeScreenshotPath(output, '../../outside', 4);
  assert.equal(path.relative(output, sanitized).startsWith('..'), false);
  assert.equal(path.basename(sanitized).includes('/'), false);
});

check('actual protected snapshot guard rejects candidate/test hash drift before Git or runtime', () => {
  const repoRoot = path.resolve(__dirname, '../..');
  const runRelative = 'dyspozycje/autobot/runs/R-PR141-CODEX-RUNTIME-ORDINARY-PREP-20261019';
  const manifestRelative = `${runRelative}/synthetic-bad-hashes.json`;
  const manifestPath = path.resolve(repoRoot, manifestRelative);
  const originalStatSync = fs.statSync;
  const originalRealpathSync = fs.realpathSync;
  const originalReadFileSync = fs.readFileSync;
  const badManifest = Buffer.from(JSON.stringify({
    schemaVersion: 1, head: '0'.repeat(40), protectedFiles: [],
    runnerSha256: '0'.repeat(64), scopeTestSha256: '0'.repeat(64),
  }));
  try {
    fs.statSync = (file, ...rest) => path.resolve(String(file)) === manifestPath
      ? { isFile: () => true }
      : originalStatSync.call(fs, file, ...rest);
    fs.realpathSync = (file, ...rest) => path.resolve(String(file)) === manifestPath
      ? manifestPath
      : originalRealpathSync.call(fs, file, ...rest);
    fs.readFileSync = (file, ...rest) => path.resolve(String(file)) === manifestPath
      ? badManifest
      : originalReadFileSync.call(fs, file, ...rest);
    assert.throws(() => harness.assertSnapshot(manifestRelative), /does not bind the current ordinary runner and scope-test hashes/);
  } finally {
    fs.statSync = originalStatSync;
    fs.realpathSync = originalRealpathSync;
    fs.readFileSync = originalReadFileSync;
  }
});

check('actual snapshot hash matcher accepts the approved dirty worktree row and rejects HEAD/index/worktree drift', () => {
  const repoRoot = path.resolve(__dirname, '../..');
  const relative = 'gra/src/data/wikiBundle.json';
  const gitBytes = (rev) => {
    const result = spawnSync('git', ['show', `${rev}:${relative}`], { cwd: repoRoot, encoding: 'buffer', maxBuffer: 32 * 1024 * 1024 });
    assert.equal(result.status, 0, result.stderr?.toString() || result.error?.message || 'git show failed');
    return result.stdout;
  };
  const headBytes = gitBytes('HEAD');
  const indexBytes = gitBytes('');
  const worktreeBytes = fs.readFileSync(path.join(repoRoot, relative));
  const hash = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
  const entry = {
    path: relative,
    state: 'tracked',
    headSha256: 'cb067919df8bf2c51697e8444617cf1c58ba2beeffa914a4a9df1724aefd461a',
    indexSha256: 'cb067919df8bf2c51697e8444617cf1c58ba2beeffa914a4a9df1724aefd461a',
    sha256: '3ed2ca1ffb4eec7402fd9dd6477aa62370e5b365818a281467fce74debe47964',
  };
  assert.equal(hash(headBytes), entry.headSha256);
  assert.equal(hash(indexBytes), entry.indexSha256);
  assert.equal(hash(worktreeBytes), entry.sha256);
  assert.notEqual(entry.headSha256, entry.sha256, 'the accepted source row is intentionally dirty relative to HEAD/index');
  assert.equal(harness.snapshotEntryMatches(entry, headBytes, indexBytes, worktreeBytes), true);
  const drift = Buffer.concat([Buffer.from('approved-source-drift\n'), worktreeBytes]);
  assert.equal(harness.snapshotEntryMatches(entry, drift, indexBytes, worktreeBytes), false, 'HEAD drift is rejected');
  assert.equal(harness.snapshotEntryMatches(entry, headBytes, drift, worktreeBytes), false, 'index drift is rejected');
  assert.equal(harness.snapshotEntryMatches(entry, headBytes, indexBytes, drift), false, 'worktree drift is rejected');
  assert.equal(harness.snapshotEntryMatches({ ...entry, headSha256: undefined }, headBytes, indexBytes, worktreeBytes), false, 'missing HEAD hash is rejected');
  assert.equal(harness.snapshotEntryMatches({ ...entry, indexSha256: undefined }, headBytes, indexBytes, worktreeBytes), false, 'missing index hash is rejected');
  assert.equal(harness.snapshotEntryMatches({ ...entry, sha256: undefined }, headBytes, indexBytes, worktreeBytes), false, 'missing worktree hash is rejected');
  assert.equal(harness.snapshotEntryMatches({ state: 'untracked', sha256: entry.sha256 }, null, null, worktreeBytes), true, 'untracked rows retain the worktree-hash contract');
});

check('actual Git object reader returns the full tracked wiki bundle above one MiB', () => {
  const bytes = harness.gitBytes(['show', 'HEAD:gra/src/data/wikiBundle.json']);
  const hash = crypto.createHash('sha256').update(bytes).digest('hex');
  assert.ok(bytes.length > 1024 * 1024, `expected a large Git object, received ${bytes.length} bytes`);
  assert.equal(hash, 'cb067919df8bf2c51697e8444617cf1c58ba2beeffa914a4a9df1724aefd461a');
});

check('actual output preparation rejects symlink ancestors before mkdir', () => {
  const originalLstatSync = fs.lstatSync;
  const originalMkdirSync = fs.mkdirSync;
  let mkdirCalls = 0;
  try {
    fs.lstatSync = (file, ...rest) => String(file).endsWith(`${path.sep}synthetic-symlink`)
      ? { isSymbolicLink: () => true, isDirectory: () => false }
      : originalLstatSync.call(fs, file, ...rest);
    fs.mkdirSync = (...args) => { mkdirCalls += 1; return originalMkdirSync.call(fs, ...args); };
    assert.throws(() => harness.prepareOutputDirectory({
      'run-output': 'dyspozycje/autobot/runs/R-PR141-CODEX-RUNTIME-ORDINARY-PREP-20261019/synthetic-symlink/output',
    }), /contains a symlink/);
    assert.equal(mkdirCalls, 0);
  } finally {
    fs.lstatSync = originalLstatSync;
    fs.mkdirSync = originalMkdirSync;
  }
});

check('actual output preparation rejects reusing an authorized output directory for retry', () => {
  const originalExistsSync = fs.existsSync;
  const outputPath = path.resolve(__dirname, '../../dyspozycje/autobot/runs/R-PR141-CODEX-RUNTIME-ORDINARY-PREP-20261019/synthetic-used-output');
  try {
    fs.existsSync = (file) => path.resolve(String(file)) === outputPath || originalExistsSync.call(fs, file);
    assert.throws(() => harness.prepareOutputDirectory({
      'run-output': 'dyspozycje/autobot/runs/R-PR141-CODEX-RUNTIME-ORDINARY-PREP-20261019/synthetic-used-output',
    }), /one attempt and no retry/);
  } finally {
    fs.existsSync = originalExistsSync;
  }
});

async function run() {
await checkAsync('actual operation deadline rejects a hanging async operation within the mock bound', async () => {
  await assert.rejects(harness.withRuntimeDeadline(() => new Promise(() => {}), 'synthetic-hang', 5),
    /RUNTIME_DEADLINE_EXCEEDED:synthetic-hang/);
});

await checkAsync('failed actual runtime preflight creates no output and reports no authorization PASS', async () => {
  const repoRoot = path.resolve(__dirname, '../..');
  const runRelative = 'dyspozycje/autobot/runs/R-PR141-CODEX-RUNTIME-ORDINARY-PREP-20261019';
  const authRelative = `${runRelative}/synthetic-in-memory-valid-auth.json`;
  const authPath = path.resolve(repoRoot, authRelative);
  const snapshotRelative = `${runRelative}/synthetic-missing-source-snapshot.json`;
  const outputRelative = `${runRelative}/synthetic-output-must-not-exist`;
  const outputPath = path.resolve(repoRoot, outputRelative);
  const originalArgv = process.argv;
  const originalExitCode = process.exitCode;
  const originalLoad = Module._load;
  const originalStdoutWrite = process.stdout.write;
  const originalStderrWrite = process.stderr.write;
  const originalStatSync = fs.statSync;
  const originalRealpathSync = fs.realpathSync;
  const originalReadFileSync = fs.readFileSync;
  const originalWriteFileSync = fs.writeFileSync;
  const originalMkdirSync = fs.mkdirSync;
  let stdout = '';
  let stderr = '';
  let writes = 0;
  const inMemoryAuthorizedRecord = Buffer.from(JSON.stringify({
    schemaVersion: 1,
    topic: 'R-PR141-CODEX-RUNTIME-ORDINARY-PREP-20261019',
    questionId: 'R-PR141-CODEX-NEXT-REPAIRS-20261019-Q1',
    ownerChoice: 'A',
    runtimeAuthorizedAfterRun55: true,
    runId: 'R-PR141-CODEX-RUNTIME-ORDINARY-PREP-20261019',
    scope: 'ordinary-flow-slice-excluding-f05-and-rendered-terrain',
    outputDirectory: 'synthetic-output-must-not-exist',
  }));
  try {
    process.argv = [process.execPath, candidatePath,
      '--authorize-runtime-ordinary-slice',
      '--authorization-record', authRelative,
      '--approved-snapshot', snapshotRelative,
      '--run-output', outputRelative,
      '--url', `file://${candidatePath}`,
      '--seed', '141', '--human1-civ', 'rzymianie', '--human2-civ', 'zulusi',
      '--ai-civ', 'egipt', '--epoch', 'zelazo'];
    process.exitCode = undefined;
    Module._load = function guardedLoad(request, parent, isMain) {
      if (request === 'playwright' || request === 'vite') throw new Error(`Forbidden module load in preflight test: ${request}`);
      return originalLoad.call(this, request, parent, isMain);
    };
    process.stdout.write = (chunk) => { stdout += String(chunk); return true; };
    process.stderr.write = (chunk) => { stderr += String(chunk); return true; };
    fs.statSync = (file, ...rest) => path.resolve(String(file)) === authPath
      ? { isFile: () => true }
      : originalStatSync.call(fs, file, ...rest);
    fs.realpathSync = (file, ...rest) => path.resolve(String(file)) === authPath
      ? authPath
      : originalRealpathSync.call(fs, file, ...rest);
    fs.readFileSync = (file, ...rest) => path.resolve(String(file)) === authPath
      ? inMemoryAuthorizedRecord
      : originalReadFileSync.call(fs, file, ...rest);
    fs.writeFileSync = () => { writes += 1; throw new Error('Output writes are forbidden before all guards pass'); };
    fs.mkdirSync = () => { writes += 1; throw new Error('Output directories are forbidden before all guards pass'); };
    const cachedCandidate = require.cache[candidatePath];
    delete require.cache[candidatePath];
    const isolatedHarness = require(candidatePath);
    require.cache[candidatePath] = cachedCandidate;
    await isolatedHarness.main();
  } finally {
    process.argv = originalArgv;
    process.exitCode = originalExitCode;
    Module._load = originalLoad;
    process.stdout.write = originalStdoutWrite;
    process.stderr.write = originalStderrWrite;
    fs.statSync = originalStatSync;
    fs.realpathSync = originalRealpathSync;
    fs.readFileSync = originalReadFileSync;
    fs.writeFileSync = originalWriteFileSync;
    fs.mkdirSync = originalMkdirSync;
  }
  assert.equal(stdout, '');
  assert.match(stderr, /Runtime preflight is not ready: approved-snapshot/);
  assert.equal(writes, 0);
  assert.equal(fs.existsSync(outputPath), false);
  assert.equal(process.exitCode, originalExitCode);
});

await checkAsync('actual --preflight main branch returns without browser loading or filesystem writes', async () => {
  const originalArgv = process.argv;
  const originalExitCode = process.exitCode;
  const originalLoad = Module._load;
  const originalStdoutWrite = process.stdout.write;
  const originalStderrWrite = process.stderr.write;
  const originalWriteFileSync = fs.writeFileSync;
  const originalMkdirSync = fs.mkdirSync;
  let stdout = '';
  let stderr = '';
  let browserLoadAttempts = 0;
  let writeAttempts = 0;
  try {
    process.argv = [process.execPath, candidatePath, '--preflight'];
    process.exitCode = undefined;
    Module._load = function guardedLoad(request, parent, isMain) {
      if (request === 'playwright' || request === 'vite') {
        browserLoadAttempts += 1;
        throw new Error(`Forbidden module load in preflight: ${request}`);
      }
      return originalLoad.call(this, request, parent, isMain);
    };
    process.stdout.write = (chunk) => { stdout += String(chunk); return true; };
    process.stderr.write = (chunk) => { stderr += String(chunk); return true; };
    fs.writeFileSync = () => { writeAttempts += 1; throw new Error('Forbidden filesystem write in preflight'); };
    fs.mkdirSync = () => { writeAttempts += 1; throw new Error('Forbidden directory creation in preflight'); };
    await harness.main();
  } finally {
    process.argv = originalArgv;
    process.exitCode = originalExitCode;
    Module._load = originalLoad;
    process.stdout.write = originalStdoutWrite;
    process.stderr.write = originalStderrWrite;
    fs.writeFileSync = originalWriteFileSync;
    fs.mkdirSync = originalMkdirSync;
  }
  assert.equal(stderr, '');
  assert.equal(browserLoadAttempts, 0);
  assert.equal(writeAttempts, 0);
  assert.equal(process.exitCode, originalExitCode);
  const receipt = JSON.parse(stdout);
  assert.equal(receipt.mode, 'READ_ONLY_PREFLIGHT');
  assert.equal(receipt.browserLaunched, false);
  assert.equal(receipt.worldGenerated, false);
  assert.equal(receipt.gameStateWritten, false);
  assert.equal(receipt.checks['runtime-authorization'].status, 'NOT AUTHORIZED');
  assert.equal(receipt.checks['legal-runtime-fixture'].status, 'NOT VERIFIED');
  assert.equal(receipt.checks['source-anchor:saveLoadDialog.ts:.civ-sl-row'].status, 'PASS');
  assert.equal(receipt.checks['source-anchor:saveLoadDialog.ts:row.dataset.slot'].status, 'PASS');
  assert.equal(receipt.checks['source-anchor:main.ts:snapshotRuntimeOwnerIdentitiesForTest'].status, 'PASS');
  assert.equal(receipt.checks['approved-snapshot'].status, 'BLOCKED');
});

if (failures.length) {
  process.stderr.write(`FAIL ${failures.length}/${passed.length + failures.length}\n${failures.map((item) => `- ${item}`).join('\n')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`PASS ${passed.length}/${passed.length + failures.length} ordinary-flow guard contracts\n`);
  for (const item of passed) process.stdout.write(`- ${item}\n`);
}
}

run().catch((err) => {
  process.stderr.write(`FAIL unexpected test error: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exitCode = 1;
});
