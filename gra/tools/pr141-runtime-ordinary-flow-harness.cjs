#!/usr/bin/env node
'use strict';

/*
 * PR141 ordinary-flow runtime slice candidate. Preparation only; this file is not
 * evidence that a scenario ran. --preflight is read-only and never launches a
 * browser. Runtime is inert unless a future owner decision and separate root
 * authorization record both match this exact slice.
 */

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { fileURLToPath } = require('node:url');

const ROOT = path.resolve(__dirname, '../..');
const OWN_RUN = path.join(ROOT, 'dyspozycje/autobot/runs/R-PR141-CODEX-RUNTIME-ORDINARY-PREP-20261019');
let REPORT = null;
const PROTECTED_PREFIXES = ['gra/src/', 'gra/data/', 'gra/tools/'];
const RUNNER_RELATIVE = 'gra/tools/pr141-runtime-ordinary-flow-harness.cjs';
const TEST_RELATIVE = 'gra/tools/pr141-runtime-ordinary-scope-test.cjs';
const EXPECTED_TOPIC = 'R-PR141-CODEX-RUNTIME-ORDINARY-PREP-20261019';
const EXPECTED_QUESTION = 'R-PR141-CODEX-NEXT-REPAIRS-20261019-Q1';
const MAX_PHASE_MS = 10 * 60 * 1000;
const MAX_TOTAL_MS = 30 * 60 * 1000;
const MAX_ORDINARY_ACTION_MS = 30 * 1000;
const ORDINARY_REQUIRED_CHECKS = [
  'approved-snapshot', 'legal-seed-input', 'new-game-ui', 'world-generation-readiness', 'seat-owners', 'ai-civ-readback',
  'human-city-founding', 'world-turn', 'mp-human1', 'mp-human2', 'mp-ai', 'g11-eligible-owner-and-neutral-controls',
  'save-slot-ui', 'load-slot-ui', 'seed-readback', 'serialized-mapSnapshot-identity',
  'saved-core-readback', 'slice-save-load-readback',
];
let runtimeStartedAt = 0;
let phaseStartedAt = 0;
let phaseName = 'preflight';
let runtimeOutputDir = null;
let screenshotSequence = 0;

function parseArgs(argv) {
  const out = { authorized: false, preflight: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--preflight') { out.preflight = true; continue; }
    if (arg === '--authorize-runtime-ordinary-slice') { out.authorized = true; continue; }
    if (!arg.startsWith('--') || i + 1 >= argv.length) throw new Error(`Invalid argument: ${arg}`);
    const key = arg.slice(2);
    if (!['url', 'seed', 'human1-civ', 'human2-civ', 'ai-civ', 'epoch', 'seed-selector', 'timeout-ms', 'approved-snapshot', 'authorization-record', 'run-output', 'chromium-path'].includes(key)) {
      throw new Error(`Unsupported option: --${key}`);
    }
    if (Object.hasOwn(out, key)) throw new Error(`Duplicate option: --${key}`);
    out[key] = argv[++i];
  }
  return out;
}

function setPhase(name) {
  phaseName = name;
  phaseStartedAt = Date.now();
}
function budgetExceeded(totalElapsedMs, phaseElapsedMs) {
  return totalElapsedMs > MAX_TOTAL_MS || phaseElapsedMs > MAX_PHASE_MS;
}
function checkRuntimeBudget() {
  if (!runtimeStartedAt) return;
  const now = Date.now();
  const totalElapsed = now - runtimeStartedAt;
  const phaseElapsed = now - phaseStartedAt;
  if (totalElapsed > MAX_TOTAL_MS) throw new Error('TOTAL_RUNTIME_BUDGET_EXCEEDED');
  if (phaseElapsed > MAX_PHASE_MS) throw new Error(`PHASE_BUDGET_EXCEEDED:${phaseName}`);
  return budgetExceeded(totalElapsed, phaseElapsed);
}
function remainingBudgetMs(totalElapsedMs, phaseElapsedMs) {
  return Math.max(1, Math.min(MAX_TOTAL_MS - totalElapsedMs, MAX_PHASE_MS - phaseElapsedMs));
}
function remainingRuntimeMs() {
  if (!runtimeStartedAt) return Math.min(MAX_PHASE_MS, MAX_TOTAL_MS);
  const now = Date.now();
  return remainingBudgetMs(now - runtimeStartedAt, now - phaseStartedAt);
}
function ordinaryActionTimeoutMs() {
  return clampOrdinaryActionTimeout(remainingRuntimeMs());
}
function clampOrdinaryActionTimeout(remainingMs) {
  const remaining = Number.isFinite(Number(remainingMs)) ? Math.max(1, Number(remainingMs)) : 1;
  return Math.max(1, Math.min(MAX_ORDINARY_ACTION_MS, remaining));
}
async function withRuntimeDeadline(operation, label, timeoutOverrideMs = null) {
  checkRuntimeBudget();
  const timeoutMs = timeoutOverrideMs ?? remainingRuntimeMs();
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`RUNTIME_DEADLINE_EXCEEDED:${label}`)), timeoutMs);
  });
  try { return await Promise.race([Promise.resolve().then(operation), deadline]); }
  finally { clearTimeout(timer); }
}

function git(args) {
  const result = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  if (result.status !== 0) throw new Error(`git ${args[0]} failed`);
  return result.stdout.trim();
}

function sha256(bytes) { return crypto.createHash('sha256').update(bytes).digest('hex'); }
function isSha256(value) { return typeof value === 'string' && /^[0-9a-f]{64}$/.test(value); }
function snapshotEntryMatches(entry, headBytes, indexBytes, worktreeBytes) {
  if (!entry || !isSha256(entry.sha256) || !Buffer.isBuffer(worktreeBytes)
      || sha256(worktreeBytes) !== entry.sha256) return false;
  if (entry.state === 'untracked') return true;
  return entry.state === 'tracked'
    && isSha256(entry.headSha256) && isSha256(entry.indexSha256)
    && Buffer.isBuffer(headBytes) && Buffer.isBuffer(indexBytes)
    && sha256(headBytes) === entry.headSha256
    && sha256(indexBytes) === entry.indexSha256;
}
function gitBytes(args) {
  const result = spawnSync('git', args, {
    cwd: ROOT,
    encoding: 'buffer',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.status !== 0) {
    const detail = result.error?.message || result.stderr?.toString().trim() || `exit ${result.status}`;
    throw new Error(`Could not read protected Git object (${args[0]}): ${detail}`);
  }
  return result.stdout;
}
function isProtectedPath(value) { return PROTECTED_PREFIXES.some((prefix) => value.startsWith(prefix)); }
function assertSnapshot(manifestArg) {
  if (!manifestArg) throw new Error('Missing --approved-snapshot; this runner never generates an approval baseline');
  const manifestPath = path.resolve(ROOT, manifestArg);
  const relativeManifest = path.relative(OWN_RUN, manifestPath);
  if (relativeManifest.startsWith('..') || path.isAbsolute(relativeManifest)) {
    throw new Error('--approved-snapshot must point to a manifest in this harness run directory');
  }
  const manifestRealPath = fs.realpathSync(manifestPath);
  const runRealPath = fs.realpathSync(OWN_RUN);
  if (!manifestRealPath.startsWith(`${runRealPath}${path.sep}`) || !fs.statSync(manifestRealPath).isFile()) {
    throw new Error('Approved snapshot must be a regular file inside this harness run');
  }
  const manifest = JSON.parse(fs.readFileSync(manifestRealPath, 'utf8'));
  if (manifest.schemaVersion !== 1 || !/^[0-9a-f]{40}$/.test(manifest.head || '') || !Array.isArray(manifest.protectedFiles)) {
    throw new Error('Approved snapshot manifest has an invalid schema');
  }
  const runnerHash = sha256(fs.readFileSync(path.join(ROOT, RUNNER_RELATIVE)));
  const testHash = sha256(fs.readFileSync(path.join(ROOT, TEST_RELATIVE)));
  if (manifest.runnerSha256 !== runnerHash || manifest.scopeTestSha256 !== testHash) {
    throw new Error('Approved snapshot does not bind the current ordinary runner and scope-test hashes');
  }
  if (git(['rev-parse', 'HEAD']) !== manifest.head) throw new Error('HEAD differs from the explicit approved snapshot');
  const expected = new Map();
  for (const entry of manifest.protectedFiles) {
    if (!entry || typeof entry.path !== 'string' || !isProtectedPath(entry.path)
        || entry.path.includes('..') || path.isAbsolute(entry.path) || !isSha256(entry.sha256)
        || (entry.state === 'tracked' && (!isSha256(entry.headSha256) || !isSha256(entry.indexSha256)))
        || !['tracked', 'untracked'].includes(entry.state) || expected.has(entry.path)) {
      throw new Error('Approved snapshot contains an invalid protected-file entry');
    }
    expected.set(entry.path, { sha256: entry.sha256, headSha256: entry.headSha256, indexSha256: entry.indexSha256, state: entry.state });
  }
  const listed = [...expected.keys()].sort();
  const tracked = git(['ls-files', '-z', '--', ...PROTECTED_PREFIXES]).split('\0').filter(Boolean).sort();
  const expectedTracked = [...expected].filter(([, row]) => row.state === 'tracked').map(([p]) => p).sort();
  if (JSON.stringify(tracked) !== JSON.stringify(expectedTracked)) {
    throw new Error('Protected tracked-file set differs from the explicit approved snapshot');
  }
  const preparationTools = new Set([RUNNER_RELATIVE, TEST_RELATIVE]);
  const untracked = git(['ls-files', '--others', '--exclude-standard', '-z', '--', ...PROTECTED_PREFIXES])
    .split('\0').filter(Boolean).filter((p) => !preparationTools.has(p)).sort();
  const expectedUntracked = [...expected].filter(([p, row]) => !preparationTools.has(p) && row.state === 'untracked').map(([p]) => p).sort();
  if (JSON.stringify(untracked) !== JSON.stringify(expectedUntracked)) {
    throw new Error('Protected untracked-file set differs from the explicit approved snapshot');
  }
  for (const relPath of [RUNNER_RELATIVE, TEST_RELATIVE]) {
    if (expected.has(relPath)) throw new Error(`Tool metadata is separate from the protected product-file manifest: ${relPath}`);
  }
  for (const relPath of listed) {
    const approved = expected.get(relPath);
    const worktreeBytes = fs.readFileSync(path.join(ROOT, relPath));
    const headBytes = approved.state === 'tracked' ? gitBytes(['show', `HEAD:${relPath}`]) : null;
    const indexBytes = approved.state === 'tracked' ? gitBytes(['show', `:${relPath}`]) : null;
    if (!snapshotEntryMatches(approved, headBytes, indexBytes, worktreeBytes)) {
      throw new Error(`Protected source differs from the explicit approved snapshot: ${relPath}`);
    }
  }
}
function result(status, detail) { return { status, detail }; }
function writeReport(state) {
  if (!REPORT) throw new Error('Report path was not initialized after runtime authorization');
  fs.writeFileSync(REPORT, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 });
}

function checkAuthorization(args) {
  if (!args.authorized) throw new Error('Missing --authorize-runtime-ordinary-slice');
  if (!args['authorization-record']) throw new Error('Missing --authorization-record; owner A choice and separate root runtime GO are required');
  const authPath = path.resolve(ROOT, args['authorization-record']);
  const relativeAuth = path.relative(OWN_RUN, authPath);
  if (relativeAuth.startsWith('..') || path.isAbsolute(relativeAuth) || !fs.statSync(authPath).isFile()) {
    throw new Error('--authorization-record must be a regular file inside this run directory');
  }
  const realAuth = fs.realpathSync(authPath);
  const realRun = fs.realpathSync(OWN_RUN);
  if (!realAuth.startsWith(`${realRun}${path.sep}`)) throw new Error('Authorization record resolves outside this run directory');
  const authBytes = fs.readFileSync(realAuth);
  const auth = JSON.parse(authBytes.toString('utf8'));
  if (!args['run-output']) throw new Error('Missing --run-output; authorization must bind one single-attempt output directory');
  const outputPath = path.resolve(ROOT, args['run-output']);
  const outputRelativeToRun = path.relative(OWN_RUN, outputPath);
  if (outputRelativeToRun.startsWith('..') || path.isAbsolute(outputRelativeToRun) || outputRelativeToRun === '') {
    throw new Error('--run-output must be inside this harness run and bound by authorization');
  }
  if (auth.schemaVersion !== 1 || auth.topic !== EXPECTED_TOPIC || auth.questionId !== EXPECTED_QUESTION
      || auth.ownerChoice !== 'A' || auth.runtimeAuthorizedAfterRun55 !== true
      || auth.runId !== EXPECTED_TOPIC || auth.scope !== 'ordinary-flow-slice-excluding-f05-and-rendered-terrain'
      || auth.outputDirectory !== outputRelativeToRun) {
    throw new Error('Authorization record does not explicitly authorize this exact ordinary-flow slice after run55');
  }
  return { hash: sha256(authBytes), file: path.relative(OWN_RUN, realAuth) };
}

function prepareOutputDirectory(args) {
  if (!args['run-output']) throw new Error('Missing --run-output; runtime evidence must be written to a unique run-local directory');
  runtimeOutputDir = path.resolve(ROOT, args['run-output']);
  const relative = path.relative(OWN_RUN, runtimeOutputDir);
  if (relative.startsWith('..') || path.isAbsolute(relative) || relative === '') {
    throw new Error('--run-output must be a new subdirectory inside this run directory');
  }
  const realRun = fs.realpathSync(OWN_RUN);
  const relativeFromRun = path.relative(OWN_RUN, runtimeOutputDir);
  let current = OWN_RUN;
  for (const segment of relativeFromRun.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    try {
      const stat = fs.lstatSync(current);
      if (stat.isSymbolicLink()) throw new Error('--run-output path contains a symlink; refusing before any directory creation');
      if (!stat.isDirectory()) throw new Error('--run-output path contains a non-directory component');
    } catch (err) {
      if (err && err.code === 'ENOENT') break;
      throw err;
    }
  }
  if (fs.existsSync(runtimeOutputDir)) {
    throw new Error('--run-output has already been used; this authorization permits one attempt and no retry');
  }
  fs.mkdirSync(runtimeOutputDir, { recursive: true });
  const realOutput = fs.realpathSync(runtimeOutputDir);
  if (!realOutput.startsWith(`${realRun}${path.sep}`)) throw new Error('Output directory resolves outside this run directory');
  fs.mkdirSync(path.join(runtimeOutputDir, 'screenshots'), { recursive: true });
  REPORT = path.join(runtimeOutputDir, 'runtime-report.json');
}

async function captureScreenshot(page, name) {
  checkRuntimeBudget();
  if (!runtimeOutputDir) return;
  const screenshotPath = makeScreenshotPath(runtimeOutputDir, name, ++screenshotSequence);
  await withRuntimeDeadline(() => page.screenshot({ path: screenshotPath, fullPage: false, timeout: remainingRuntimeMs() }), `screenshot:${path.basename(screenshotPath)}`);
}

function makeScreenshotPath(outputDir, name, sequence) {
  if (!Number.isSafeInteger(sequence) || sequence < 1) throw new Error('Screenshot sequence must be a positive integer');
  const safeName = String(name).replace(/[^a-zA-Z0-9_-]/g, '-');
  const target = path.resolve(outputDir, 'screenshots', `${String(sequence).padStart(2, '0')}-${safeName}.png`);
  const relative = path.relative(path.resolve(outputDir), target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Screenshot path escaped its authorized output directory');
  return target;
}

function assertOneWorldTurn(initialTurn, afterFirstSubmissionTurn, afterSecondSubmissionTurn, humanSubmissions) {
  if (![initialTurn, afterFirstSubmissionTurn, afterSecondSubmissionTurn].every(Number.isSafeInteger)) {
    throw new Error('World-turn evidence must contain integer turn counters');
  }
  if (humanSubmissions !== 2) throw new Error('Exactly two distinct human submissions are required');
  if (afterFirstSubmissionTurn !== initialTurn) throw new Error('First hot-seat submission unexpectedly advanced world turn');
  if (afterSecondSubmissionTurn !== initialTurn + 1) throw new Error('Two hot-seat submissions did not advance exactly one world turn');
  return true;
}

function staticPreflight(args) {
  const checks = {};
  const sourceFiles = [
    'gra/src/main.ts', 'gra/src/ui/newGameFlow.ts', 'gra/src/ui/cityPanel.ts', 'gra/src/ui/gamePauseMenu.ts',
    'gra/src/ui/bottomBarHud.ts', 'gra/src/ui/cityListHud.ts', 'gra/src/ui/unitRecruitCard.ts',
    'gra/src/ui/saveLoadDialog.ts', 'gra/src/ui/mapToolbarHud.ts', 'gra/src/ui/hud.ts', 'gra/src/ui/cityUxFrame.ts',
    'gra/tools/pr141-runtime-save-load-harness.cjs', RUNNER_RELATIVE, TEST_RELATIVE,
  ];
  const sourceText = new Map();
  for (const rel of sourceFiles) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full) || !fs.statSync(full).isFile()) {
      checks[`source:${rel}`] = result('BLOCKED', 'Required source file is missing');
      continue;
    }
    const bytes = fs.readFileSync(full);
    sourceText.set(rel, bytes.toString('utf8'));
    checks[`source:${rel}`] = result('PASS', { sha256: sha256(bytes), bytes: bytes.length });
  }
  const modulePath = path.join(ROOT, 'gra/node_modules/playwright/package.json');
  checks['playwright-package'] = fs.existsSync(modulePath) && fs.statSync(modulePath).isFile()
    ? result('PASS', 'Local Playwright package manifest exists; package was not loaded')
    : result('BLOCKED', 'Local Playwright package manifest was not found');
  const browserPath = args['chromium-path'] || '/usr/bin/chromium';
  let browserOk = false;
  try { fs.accessSync(browserPath, fs.constants.X_OK); browserOk = fs.statSync(browserPath).isFile(); } catch { browserOk = false; }
  checks['chromium-path'] = browserOk
    ? result('PASS', { executablePathExists: true, launched: false })
    : result('BLOCKED', 'Configured local Chromium path is absent or not executable; it was not launched');
  checks['node-runtime'] = result('PASS', { version: process.version });
  const anchors = [
    ['newGameFlow.ts', 'ng-seed'], ['newGameFlow.ts', 'seat2-toggle-btn'], ['newGameFlow.ts', 'seat2-dist-opt'],
    ['newGameFlow.ts', 'ai-civ-grid'], ['newGameFlow.ts', 'epoch-grid'], ['newGameFlow.ts', 'cta-hero'],
    ['main.ts', 'snapshotRuntimeObservabilityForTest'], ['main.ts', 'snapshotHumanSeatsForTest'],
    ['main.ts', 'snapshotRuntimeOwnerIdentitiesForTest'],
    ['main.ts', '__cityStateStartUnitsTestDebug'], ['gamePauseMenu.ts', 'data-act="save"'],
    ['gamePauseMenu.ts', 'data-act="load"'], ['cityPanel.ts', 'data-res-stat="'], ['cityPanel.ts', 'data-city-exit'],
    ['bottomBarHud.ts', 'data-end'], ['cityListHud.ts', 'civ-city-list-hud'], ['mapToolbarHud.ts', 'data-act="cities"'],
    ['unitRecruitCard.ts', 'unit-recruit-compact-row'], ['unitRecruitCard.ts', 'unit-recruit-manpower'],
    ['saveLoadDialog.ts', '.civ-sl-row'], ['saveLoadDialog.ts', 'row.dataset.slot'],
    ['saveLoadDialog.ts', 'civ-sl-name'], ['cityUxFrame.ts', 'civ-ux-frame'],
  ];
  for (const [suffix, anchor] of anchors) {
    const rel = sourceFiles.find((p) => p.endsWith(suffix));
    const present = !!rel && sourceText.get(rel)?.includes(anchor);
    checks[`source-anchor:${suffix}:${anchor}`] = present
      ? result('PASS', 'Read-only source anchor exists; no DOM or page was inspected')
      : result('BLOCKED', 'Read-only source anchor not found; selector/call path is unverified');
  }
  if (args['approved-snapshot']) {
    try {
      assertSnapshot(args['approved-snapshot']);
      checks['approved-snapshot'] = result('PASS', 'Existing explicit manifest matches protected files; preflight only');
    } catch (err) { checks['approved-snapshot'] = result('BLOCKED', err.message); }
  } else checks['approved-snapshot'] = result('BLOCKED', 'No root-approved explicit source snapshot manifest was supplied');
  checks['legal-runtime-fixture'] = result('NOT VERIFIED', 'Static source/preflight cannot prove a legal live start, founding or one-world-turn scenario');
  checks['runtime-authorization'] = result('NOT AUTHORIZED', 'Preflight never authorizes or launches runtime');
  return { run: EXPECTED_TOPIC, mode: 'READ_ONLY_PREFLIGHT', browserLaunched: false, worldGenerated: false, gameStateWritten: false, checks };
}

function assertRuntimePreflight(args) {
  const preflight = staticPreflight(args);
  const required = Object.entries(preflight.checks).filter(([key]) => key.startsWith('source:')
    || key.startsWith('source-anchor:')
    || ['playwright-package', 'chromium-path', 'approved-snapshot'].includes(key));
  const failed = required.filter(([, item]) => item.status !== 'PASS');
  if (failed.length) throw new Error(`Runtime preflight is not ready: ${failed.map(([key]) => key).join(', ')}`);
  return preflight;
}

function requireConfig(args) {
  for (const key of ['url', 'seed', 'human1-civ', 'human2-civ', 'ai-civ', 'epoch']) {
    if (!args[key]) throw new Error(`Missing required option --${key}`);
  }
  const seed = Number(args.seed);
  if (!Number.isSafeInteger(seed) || seed < 1 || seed > 999999) throw new Error('--seed must be an integer in 1..999999');
  if (new Set([args['human1-civ'], args['human2-civ'], args['ai-civ']]).size !== 3) {
    throw new Error('Human and AI civilization IDs must be distinct');
  }
  if (args['human1-civ'] !== 'rzymianie' || args['human2-civ'] !== 'zulusi' || args['ai-civ'] !== 'egipt') {
    throw new Error('This proposed ordinary slice requires Rome (human 1), Zulu (human 2), and Egypt (AI); only Zulu is the G11-eligible owner');
  }
  if (args.epoch !== 'zelazo') throw new Error('This proposed ordinary slice uses the legal Iron-age start for Rome, Zulu, and Egypt');
  const epochNames = { kamien: 'Epoka Kamienia', braz: 'Epoka Brazu', zelazo: 'Epoka Zelaza' };
  if (!epochNames[args.epoch]) throw new Error('--epoch must be kamien, braz, or zelazo');
  const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'gra/data/civs.json'), 'utf8'));
  const epochOrder = ['kamien', 'braz', 'zelazo'];
  const civName = (id) => {
    const item = catalog.cywilizacje.find((c) => c.ikonaId === id);
    if (!item) throw new Error(`Unknown civilization ID: ${id}`);
    const gameIndex = epochOrder.indexOf(args.epoch);
    const engineEntry = typeof item.epokaWejscia === 'string'
      ? item.epokaWejscia
      : (Array.isArray(item.epokiStartowe) && item.epokiStartowe.length ? item.epokiStartowe[0] : 'kamien');
    const uiEpochs = Array.isArray(item.epokiStartowe) && item.epokiStartowe.length
      ? item.epokiStartowe
      : (typeof item.epokaWejscia === 'string' ? [item.epokaWejscia] : ['kamien', 'braz', 'zelazo']);
    const engineEntryIndex = epochOrder.indexOf(engineEntry);
    const uiEntryIndexes = uiEpochs.map((e) => {
      const index = epochOrder.indexOf(e);
      return index >= 0 ? index : epochOrder.length;
    });
    const uiEntryIndex = uiEntryIndexes.length ? Math.min(...uiEntryIndexes) : 0;
    if (engineEntryIndex < 0 || engineEntryIndex > gameIndex || uiEntryIndex > gameIndex) {
      throw new Error(`Civilization ${id} is not available at game epoch ${args.epoch}`);
    }
    return item.Cywilizacja;
  };
  const timeout = args['timeout-ms'] === undefined ? 15000 : Number(args['timeout-ms']);
  if (!Number.isSafeInteger(timeout) || timeout < 1000 || timeout > 120000) throw new Error('--timeout-ms must be in 1000..120000');
  if (!args.url) throw new Error('Missing required option --url');
  let parsedUrl;
  try { parsedUrl = new URL(args.url); } catch { throw new Error('--url must be an absolute file:// or local http(s) URL'); }
  if (parsedUrl.protocol === 'file:') {
    if (!fs.existsSync(fileURLToPath(parsedUrl))) throw new Error('--url file target does not exist');
  } else if (!['http:', 'https:'].includes(parsedUrl.protocol)
      || !['localhost', '127.0.0.1', '[::1]'].includes(parsedUrl.hostname)) {
    throw new Error('--url must use file:// or a loopback-only local http(s) address');
  }
  return {
    seed, timeout, epochName: epochNames[args.epoch],
    human1Name: civName(args['human1-civ']), human2Name: civName(args['human2-civ']), aiName: civName(args['ai-civ']),
  };
}

function statusBook() {
  return {
    'approved-snapshot': result('NOT RUN', 'Not checked'),
    'runtime-authorization': result('NOT RUN', 'No owner decision or root runtime authorization has been read'),
    'ordinary-slice-overall': result('NOT RUN', 'Not checked'),
    'scenario-overall': result('BLOCKED', 'The original full runtime goal is deliberately outside this candidate slice'),
    'original-full-runtime-goal': result('BLOCKED', 'This partial slice cannot satisfy the original F05/live-rendered-terrain runtime goal'),
    'legal-seed-input': result('NOT RUN', 'Not checked'),
    'wizard-ui-settings-summary': result('NOT RUN', 'No read-only wizard settings or seat-distance observation was captured'),
    'new-game-ui': result('NOT RUN', 'Not checked'),
    'world-generation-readiness': result('NOT RUN', 'Generation overlay lifecycle and settled-world identities not verified'),
    'seat-owners': result('NOT RUN', 'Not checked'),
    'ai-civ-readback': result('NOT RUN', 'Not checked'),
    'human-city-founding': result('NOT RUN', 'Not checked'),
    'human1-founding-proof': result('NOT RUN', 'First human founding helper has not returned'),
    'world-turn': result('NOT RUN', 'Not checked'),
    'save-slot-ui': result('NOT RUN', 'Not checked'),
    'load-slot-ui': result('NOT RUN', 'Not checked'),
    'seed-readback': result('NOT RUN', 'Not checked'),
    'serialized-mapSnapshot-identity': result('NOT RUN', 'Production save serialized mapSnapshot hash has not been compared'),
    'live-rendered-terrain-identity': result('DEFERRED', 'No independent live rendered-terrain observation is claimed by this slice'),
    'saved-core-readback': result('NOT RUN', 'Not checked'),
    'mp-human1': result('NOT RUN', 'Not checked through active human UI'),
    'mp-human2': result('NOT RUN', 'Not checked through active human UI'),
    'mp-human1-partial-ui': result('NOT RUN', 'No partial human Manpower recruitment UI observation yet'),
    'mp-human2-partial-ui': result('NOT RUN', 'No partial human Manpower recruitment UI observation yet'),
    'mp-ai': result('NOT RUN', 'Awaiting public read-only owner snapshot after AI mapping'),
    'f05-battle': result('DEFERRED', 'F05 is explicitly excluded from the ordinary-flow slice; original full goal stays BLOCKED'),
    'g11-human1': result('NOT RUN', 'Not checked through active human recruitment UI'),
    'g11-human2': result('NOT RUN', 'Not checked through active human recruitment UI'),
    'g11-ai': result('NOT RUN', 'Awaiting public read-only owner snapshot after AI mapping'),
    'g11-eligible-owner-and-neutral-controls': result('NOT RUN', 'Requires one eligible Zulu G11 observation and two neutral controls'),
    'g11-human-and-ai': result('BLOCKED', 'The original positive-human-and-AI G11 claim is unsupported: only Zulu has the approved Impi source field'),
    'slice-save-load-readback': result('NOT RUN', 'Not checked'),
    'saved-state-readback': result('BLOCKED', 'Full saved-state acceptance remains open because F05 and live terrain are deferred'),
  };
}

async function visible(locator) {
  try { return await withRuntimeDeadline(() => locator.count(), 'locator-visible-count').then((n) => n > 0); }
  catch { return false; }
}
async function clickUnique(locator, label) {
  checkRuntimeBudget();
  const n = await withRuntimeDeadline(() => locator.count(), `${label}:count`);
  if (n !== 1) throw new Error(`${label}: expected one matching UI control, found ${n}`);
  const isVisible = typeof locator.isVisible === 'function'
    ? await withRuntimeDeadline(() => locator.isVisible(), `${label}:visibility`)
    : true;
  if (!isVisible) throw new Error(`${label}: matching UI control is not visible`);
  await withRuntimeDeadline(() => locator.click({ timeout: ordinaryActionTimeoutMs() }), `${label}:click`, ordinaryActionTimeoutMs());
}
async function clickCardByText(page, selector, text, label, options = {}) {
  checkRuntimeBudget();
  const cards = page.locator(selector);
  const labelSelector = options.labelSelector || '.cn';
  const matches = await withRuntimeDeadline(() => cards.evaluateAll((els, params) => els.flatMap((el, index) => {
    const name = el.querySelector(params.childSelector)?.textContent?.trim();
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    const disabled = el.classList.contains('disabled') || el.getAttribute('aria-disabled') === 'true';
    return isVisible && name === params.expected ? [{ index, disabled }] : [];
  }), { expected: text, childSelector: labelSelector }), `${label}:find-visible-card`);
  if (matches.length !== 1) throw new Error(`${label}: expected one visible card with exact configured name, found ${matches.length}`);
  if (options.rejectDisabled && matches[0].disabled) throw new Error(`${label}: configured card is disabled`);
  const card = cards.nth(matches[0].index);
  await withRuntimeDeadline(() => card.click({ timeout: ordinaryActionTimeoutMs() }), `${label}:click-card`, ordinaryActionTimeoutMs());
  if (options.requireSelected) {
    const selected = await withRuntimeDeadline(() => card.evaluate((el) => el.classList.contains('sel')), `${label}:verify-selected`);
    if (!selected) throw new Error(`${label}: configured card did not become selected`);
  }
}
async function observeWizardSettingsSummary(page, seed) {
  try {
    const locator = page.locator('.civ-newgame .sett-grid');
    const count = await withRuntimeDeadline(() => locator.count(), 'read-wizard-settings-count', Math.min(2000, remainingRuntimeMs()));
    if (count !== 1) return { verified: false, reason: `expected one wizard settings panel, found ${count}`, seed: String(seed) };
    const panel = await withRuntimeDeadline(() => locator.evaluate((el) => {
      const style = getComputedStyle(el); const rect = el.getBoundingClientRect();
      return { visible: style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0, text: (el.innerText || el.textContent || '').trim().slice(0, 1600) };
    }), 'read-wizard-settings-panel', Math.min(2000, remainingRuntimeMs()));
    if (!panel.visible) return { verified: false, reason: 'wizard settings panel was not visible', seed: String(seed) };
    return { verified: true, seed: String(seed), settingsText: panel.text };
  } catch (error) {
    return { verified: false, reason: `wizard settings observer failed: ${boundedDiagnosticText(error?.message || error, 240)}`, seed: String(seed) };
  }
}
async function observeSelectedSeat2Distance(page) {
  try {
    const locator = page.locator('.seat2-dist-opt.sel');
    const count = await withRuntimeDeadline(() => locator.count(), 'read-seat2-distance-count', Math.min(2000, remainingRuntimeMs()));
    if (count !== 1) return { verified: false, reason: `expected one selected distance option, found ${count}` };
    const text = await withRuntimeDeadline(() => locator.evaluate((el) => (el.innerText || el.textContent || '').trim()), 'read-seat2-distance', Math.min(2000, remainingRuntimeMs()));
    return { verified: true, text };
  } catch (error) {
    return { verified: false, reason: `seat2 distance observer failed: ${boundedDiagnosticText(error?.message || error, 240)}` };
  }
}
const MAX_NEW_GAME_MAP_LOAD_WAIT_MS = 480000;
const MAX_MAP_LOAD_WAIT_MS = 118000;
function mapLoadLifecycleInPage({ timeoutMs }) {
  return new Promise((resolve) => {
    let shown = false;
    let finished = false;
    let timer;
    const isOverlay = (node) => !!node && node.nodeType === 1
      && (node.matches?.('.civ-map-load-overlay') || !!node.querySelector?.('.civ-map-load-overlay'));
    const isVisible = (el) => {
      if (!el) return false;
      for (let node = el; node && node.nodeType === 1; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse'
            || Number(style.opacity) === 0 || style.contentVisibility === 'hidden') return false;
      }
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };
    const readError = () => document.querySelector('.civ-map-load-err')?.textContent?.trim() || null;
    let observer;
    const finish = (result) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      observer?.disconnect();
      resolve(result);
    };
    const inspect = (records = []) => {
      const overlay = document.querySelector('.civ-map-load-overlay');
      // Mutation records prove insertion, not rendered visibility. In particular,
      // an added node can be display:none, under a hidden ancestor, or removed
      // before this observer callback runs. Only a connected, rendered overlay
      // can establish the visible edge of the lifecycle.
      if (overlay && isVisible(overlay)) shown = true;
      const overlayError = readError();
      if (overlayError) return finish({ ok: false, shown, hidden: false, overlayError, reason: 'map loading overlay reported an error' });
      if (shown && (!overlay || !isVisible(overlay))) finish({ ok: true, shown: true, hidden: true, overlayError: null, reason: 'map loading overlay appeared and was hidden' });
    };
    observer = new MutationObserver(inspect);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
    timer = setTimeout(() => {
      finish({ ok: false, shown, hidden: false, overlayError: readError(), reason: shown ? 'timed out waiting for map loading overlay to hide' : 'timed out waiting for map loading overlay to appear and hide' });
    }, Math.max(1, Math.min(480000, timeoutMs)));
  });
}
function turnTransitionLifecycleInPage({ timeoutMs }) {
  return new Promise((resolve) => {
    let shown = false;
    let finished = false;
    let timer;
    let observer;
    const active = () => document.querySelector('.civ-turn-transition.on');
    const isOn = (value) => String(value || '').split(/\s+/).includes('on');
    const finish = (result) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      observer?.disconnect();
      resolve(result);
    };
    const inspect = (records = []) => {
      for (const record of records) {
        if (record.type === 'attributes' && record.attributeName === 'class' && record.target.matches?.('.civ-turn-transition')) {
          const nextRecord = records.find((next, index) => index > records.indexOf(record) && next.target === record.target && next.attributeName === 'class');
          const nextValue = nextRecord ? nextRecord.oldValue : record.target.getAttribute('class');
          const wasOn = isOn(record.oldValue);
          const nowOn = isOn(nextValue);
          if (!wasOn && nowOn) shown = true;
          if (shown && wasOn && !nowOn) return finish({ ok: true, shown: true, hidden: true });
        }
        if ([...(record.addedNodes || [])].some((node) => node.nodeType === 1 && (node.matches?.('.civ-turn-transition.on') || !!node.querySelector?.('.civ-turn-transition.on')))) shown = true;
      }
      if (active()) shown = true;
      if (shown && !active()) finish({ ok: true, shown: true, hidden: true });
    };
    observer = new MutationObserver(inspect);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true });
    timer = setTimeout(() => finish({ ok: false, shown, hidden: false, reason: shown ? 'timed out waiting for turn transition to hide' : 'timed out waiting for turn transition to appear and hide' }), Math.max(1, Math.min(120000, timeoutMs)));
  });
}
function validateSettledWorld(snapshot, args, lifecycle, { requireStartHex = true, requireAi = true } = {}) {
  if (!lifecycle?.ok || lifecycle.shown !== true || lifecycle.hidden !== true) return { ok: false, status: 'BLOCKED', reasonType: 'lifecycle', reason: 'map-load overlay was not observed visible then hidden' };
  if (!snapshot || !snapshot.seats) return { ok: false, status: 'BLOCKED', reasonType: 'seats', reason: 'settled-world read-only seat snapshot was unavailable' };
  const owners = snapshot.seats.humanOwnerIds;
  if (!Array.isArray(owners) || owners.length !== 2 || new Set(owners).size !== 2) return { ok: false, status: 'BLOCKED', reasonType: 'seats', reason: 'settled world did not expose exactly two distinct human owners' };
  const identities = snapshot.ownerIdentities;
  const humanByOwner = Object.fromEntries((identities?.humanOwners || []).map((row) => [row.ownerId, row.civKey]));
  const civs = owners.map((owner) => humanByOwner[owner]);
  const expectedCivs = [args['human1-civ'], args['human2-civ']];
  if (civs.some((civ) => !civ) || JSON.stringify(civs) !== JSON.stringify(expectedCivs)
      || owners.some((owner) => snapshot.seats.civIdByOwner?.[owner] !== humanByOwner[owner]
        || snapshot.civTypes?.[owner] !== humanByOwner[owner])) {
    return { ok: false, status: 'FAIL', reasonType: 'seats', reason: 'settled-world human owner/civilization mapping did not match configured order', owners, civs };
  }
  const starts = owners.map((owner) => snapshot.seats.startHexByOwner?.[owner]);
  if (requireStartHex && starts.some((hex) => !hex || !Number.isFinite(hex.q) || !Number.isFinite(hex.r))) {
    return { ok: false, status: 'BLOCKED', reasonType: 'seats', reason: 'settled world did not expose finite start hexes for both human owners', owners, civs, starts };
  }
  const aiRows = (identities?.majorAiOwners || []).filter((row) => row.civKey === args['ai-civ'] && !owners.includes(Number(row.ownerId)));
  if (requireAi && aiRows.length !== 1) return { ok: false, status: 'BLOCKED', reasonType: 'ai', reason: `settled-world identity hook exposed ${aiRows.length} owners for configured AI ${args['ai-civ']}`, owners, civs, starts };
  return { ok: true, status: 'PASS', owners, civs, ...(requireStartHex ? { humanStartHexes: starts } : {}), ...(requireAi ? { ai: { ownerId: aiRows[0].ownerId, civKey: aiRows[0].civKey } } : {}) };
}
async function readAiRosterAfterFirstFounding(page, args, lifecycle, foundingResult) {
  if (foundingResult?.status !== 'PASS') return {
    snapshot: null,
    readiness: { ok: false, status: 'BLOCKED', reasonType: 'founding', reason: 'AI roster is not observed before a verified legal first-city founding' },
  };
  try {
    const snapshot = canonicalSnapshot(await readSnapshot(page));
    return { snapshot, readiness: validateSettledWorld(snapshot, args, lifecycle, { requireStartHex: false }) };
  } catch (error) {
    return { snapshot: null, readiness: { ok: false, status: 'BLOCKED', reasonType: 'ai', reason: `post-founding AI roster read failed: ${boundedDiagnosticText(error?.message || error, 240)}` } };
  }
}
function formatManpowerDisplay(value) {
  const n = Number(value);
  if (n >= 1_000_000) {
    const millions = n / 1_000_000;
    return `${millions >= 10 ? Math.round(millions) : Math.round(millions * 10) / 10} mln`;
  }
  if (n >= 1_000) {
    const thousands = n / 1_000;
    return `${thousands >= 100 ? Math.round(thousands) : Math.round(thousands * 10) / 10} tys.`;
  }
  return String(n);
}
function sameDisplayedManpower(text, expected, requirePlus = false) {
  const normalized = String(text ?? '').trim().replace(/\s+/g, ' ');
  const prefix = normalized.startsWith('+');
  return (!requirePlus || prefix) && (requirePlus ? normalized.slice(1).trim() : normalized) === formatManpowerDisplay(expected);
}
function ordinaryExitCode(executed, ordinaryStatus, currentCode = 0) {
  if (!executed) return currentCode;
  if (ordinaryStatus === 'FAIL' || ordinaryStatus === 'BLOCKED') return 1;
  if (ordinaryStatus === 'PASS') return currentCode;
  return currentCode;
}
function clampLifecycleTimeout(capMs, remainingMs) {
  return Math.max(1, Math.min(Number(capMs) || MAX_MAP_LOAD_WAIT_MS, Number(remainingMs) || 1));
}
function startMapLoadObservation(page, capMs = MAX_MAP_LOAD_WAIT_MS) {
  checkRuntimeBudget();
  const timeoutMs = clampLifecycleTimeout(capMs, remainingRuntimeMs());
  return page.evaluate(mapLoadLifecycleInPage, { timeoutMs }).catch((error) => ({
    ok: false, shown: false, hidden: false, overlayError: null,
    reason: `map loading observer failed: ${boundedDiagnosticText(error?.message || error, 240)}`,
  }));
}
function startTurnTransitionObservation(page) {
  checkRuntimeBudget();
  const timeoutMs = clampLifecycleTimeout(MAX_MAP_LOAD_WAIT_MS, remainingRuntimeMs());
  return page.evaluate(turnTransitionLifecycleInPage, { timeoutMs }).catch((error) => ({
    ok: false, shown: false, hidden: false,
    reason: `turn transition observer failed: ${boundedDiagnosticText(error?.message || error, 240)}`,
  }));
}
async function awaitLifecycleObservation(observation, label, capMs = MAX_MAP_LOAD_WAIT_MS) {
  try { return await withRuntimeDeadline(() => observation, label, clampLifecycleTimeout(capMs, remainingRuntimeMs())); }
  catch (error) { return { ok: false, shown: false, hidden: false, reason: boundedDiagnosticText(error?.message || error, 240) }; }
}
async function waitFor(locator, label, timeout) {
  checkRuntimeBudget();
  try { await withRuntimeDeadline(() => locator.first().waitFor({ state: 'visible', timeout: Math.min(timeout, remainingRuntimeMs()) }), `wait:${label}`); }
  catch { throw new Error(`Timed out waiting for ${label}`); }
}
async function waitForMainMenuStart(page, timeout) {
  const startButton = page.getByRole('button', { name: 'Rozpocznij grę', exact: false });
  await waitFor(startButton, 'main menu Start game', timeout);
  return startButton;
}
function boundedDiagnosticText(value, limit = 512) {
  return String(value ?? '').replace(/\b(?:https?|file):\/\/[^\s"'<>]+/gi, (url) => diagnosticUrl(url)).slice(0, limit);
}
function diagnosticUrl(value) {
  try {
    const parsed = new URL(String(value));
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return String(value ?? '')
      .replace(/\/\/[^/@?#\s]*@/g, '//[redacted]@')
      .split(/[?#]/, 1)[0]
      .slice(0, 256);
  }
}
function attachPageDiagnostics(page) {
  const criticalRecords = [];
  const consoleRecords = [];
  const addCritical = (record) => {
    if (criticalRecords.length + consoleRecords.length >= 40) {
      if (consoleRecords.length) consoleRecords.shift();
      else if (criticalRecords.length) criticalRecords.shift();
    }
    criticalRecords.push({ at: new Date().toISOString(), ...record });
  };
  const addConsole = (record) => {
    if (criticalRecords.length + consoleRecords.length < 40) consoleRecords.push({ at: new Date().toISOString(), ...record });
  };
  page.on('console', (message) => {
    const type = message.type();
    const record = { kind: `console-${type}`, text: boundedDiagnosticText(message.text()) };
    if (type === 'error') addCritical(record);
    else if (['warning', 'warn', 'info', 'log'].includes(type)) addConsole(record);
  });
  page.on('pageerror', (error) => addCritical({ kind: 'page-error', text: boundedDiagnosticText(error?.stack || error?.message || error) }));
  page.on('requestfailed', (request) => addCritical({ kind: 'request-failed', url: diagnosticUrl(request.url()), text: boundedDiagnosticText(request.failure()?.errorText) }));
  page.on('response', (response) => {
    if (response.status() >= 400) addCritical({ kind: 'http-error', status: response.status(), url: diagnosticUrl(response.url()) });
  });
  return () => [...criticalRecords, ...consoleRecords].slice(0, 40);
}
async function captureFailureUiState(page, cleanupTimeoutMs = 2000) {
  if (!page) return { captured: false, reason: 'page was not created' };
  const timeout = Math.min(2000, Math.max(1, Number(cleanupTimeoutMs) || 2000));
  let timer;
  const evaluation = Promise.resolve()
    .then(() => page.evaluate(() => {
      const text = (value, limit) => String(value ?? '').slice(0, limit);
      const styleVisible = (element) => {
        if (!element) return false;
        for (let node = element; node && node.nodeType === 1; node = node.parentElement) {
          const style = getComputedStyle(node);
          if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse'
              || Number(style.opacity) === 0 || style.contentVisibility === 'hidden') return false;
        }
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      };
      const overlay = document.querySelector('.civ-map-load-overlay');
      const overlayText = (selector, limit = 256) => text(overlay?.querySelector(selector)?.textContent?.trim(), limit) || null;
      const progress = overlay?.querySelector('.civ-map-load-bar');
      const retry = overlay?.querySelector('.civ-map-load-retry');
      return {
        captured: true,
        readyState: document.readyState,
        title: text(document.title, 200),
        url: `${location.origin}${location.pathname}`,
        bodyText: text(document.body?.innerText, 2048),
        buttons: [...(document.querySelectorAll('button') || [])].slice(0, 40).map((button) => ({
          text: text(button.innerText, 120), visible: styleVisible(button), disabled: button.disabled,
        })),
        canvases: [...(document.querySelectorAll('canvas') || [])].slice(0, 12).map((canvas) => {
          const rect = canvas.getBoundingClientRect();
          return { width: canvas.width, height: canvas.height, visible: styleVisible(canvas), rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } };
        }),
        bodyChildren: [...(document.body?.children || [])].slice(0, 20).map((element) => ({
          tag: element.tagName, id: text(element.id, 100), className: text(element.className, 160), visible: styleVisible(element),
        })),
        mapLoading: overlay ? {
          present: true,
          visible: styleVisible(overlay),
          title: overlayText('.civ-map-load-title'),
          meta: overlayText('.civ-map-load-meta'),
          phase: overlayText('.civ-map-load-phase'),
          elapsed: overlayText('.civ-map-load-elapsed'),
          progressWidth: progress ? text(progress.style?.width || getComputedStyle(progress).width, 64) : null,
          errorText: overlayText('.civ-map-load-err', 512),
          retryButton: retry ? { present: true, label: text(retry.innerText || retry.textContent, 120), visible: styleVisible(retry) } : { present: false },
        } : { present: false, visible: false },
      };
    }))
    .then((value) => ({ kind: 'value', value }), (error) => ({ kind: 'error', error }));
  const deadline = new Promise((resolve) => {
    timer = setTimeout(() => resolve({ kind: 'timeout' }), timeout);
  });
  const outcome = await Promise.race([evaluation, deadline]);
  clearTimeout(timer);
  if (outcome.kind === 'value') return outcome.value;
  if (outcome.kind === 'error') return { captured: false, reason: boundedDiagnosticText(outcome.error?.message || outcome.error) };
  return { captured: false, timedOut: true, reason: 'UI diagnostic evaluation exceeded cleanup deadline' };
}
function capFailureDiagnostics(browserEvents, uiState, collectionError = null, failureScreenshot = null) {
  const output = {
    browserEvents: Array.isArray(browserEvents) ? browserEvents.slice(0, 40) : [],
    uiState: uiState || { captured: false, reason: 'UI state unavailable' },
  };
  if (collectionError) output.collectionError = boundedDiagnosticText(collectionError, 256);
  if (failureScreenshot) output.failureScreenshot = failureScreenshot;
  const maxBytes = 16 * 1024;
  while (Buffer.byteLength(JSON.stringify(output)) > maxBytes && output.browserEvents.length) output.browserEvents.pop();
  if (Buffer.byteLength(JSON.stringify(output)) > maxBytes) {
    output.uiState = { captured: false, reason: 'UI summary omitted to respect failure diagnostic payload limit' };
  }
  if (Buffer.byteLength(JSON.stringify(output)) > maxBytes) {
    output.browserEvents = [];
    delete output.collectionError;
  }
  if (Buffer.byteLength(JSON.stringify(output)) > maxBytes) {
    output.uiState = { captured: false, reason: 'UI summary omitted to respect failure diagnostic payload limit' };
    output.failureScreenshot = { captured: false, reason: 'Screenshot metadata omitted to respect failure diagnostic payload limit' };
  }
  if (Buffer.byteLength(JSON.stringify(output)) > maxBytes) {
    return { browserEvents: [], uiState: { captured: false, reason: 'Diagnostics omitted to respect failure payload limit' } };
  }
  return output;
}
async function captureFailureScreenshot(page, outputDir, deadlineAt) {
  if (!page || !outputDir) return { captured: false, reason: 'Screenshot output directory unavailable' };
  const timeout = Math.max(0, deadlineAt - Date.now());
  if (timeout <= 0) return { captured: false, timedOut: true, reason: 'Shared diagnostics cleanup deadline elapsed before screenshot' };
  const screenshotPath = makeScreenshotPath(outputDir, 'failure-normal-blocked', ++screenshotSequence);
  let timer;
  const operation = Promise.resolve()
    .then(() => page.screenshot({ path: screenshotPath, fullPage: false, timeout }))
    .then(() => ({ kind: 'value' }), (error) => ({ kind: 'error', error }));
  const deadline = new Promise((resolve) => {
    timer = setTimeout(() => resolve({ kind: 'timeout' }), timeout);
  });
  const outcome = await Promise.race([operation, deadline]);
  clearTimeout(timer);
  if (outcome.kind === 'value') return { captured: true, path: path.relative(outputDir, screenshotPath) };
  if (outcome.kind === 'error') return { captured: false, reason: boundedDiagnosticText(outcome.error?.message || outcome.error, 240) };
  return { captured: false, timedOut: true, reason: 'Screenshot exceeded shared diagnostics cleanup deadline' };
}
async function collectFailureDiagnostics(page, snapshotEvents, cleanupTimeoutMs = 2000, { captureScreenshot: includeScreenshot = false, screenshotOutputDir = runtimeOutputDir } = {}) {
  const timeout = Math.min(2000, Math.max(1, Number(cleanupTimeoutMs) || 2000));
  const deadlineAt = Date.now() + timeout;
  let browserEvents = [];
  let collectionError = null;
  try {
    if (typeof snapshotEvents === 'function') browserEvents = snapshotEvents();
    if (!Array.isArray(browserEvents)) browserEvents = [];
  } catch (error) {
    collectionError = `browser event snapshot failed: ${error?.message || error}`;
  }
  const uiPromise = captureFailureUiState(page, Math.max(1, deadlineAt - Date.now()))
    .then((value) => ({ kind: 'value', value }), (error) => ({ kind: 'error', error }));
  const screenshotPromise = includeScreenshot
    ? captureFailureScreenshot(page, screenshotOutputDir, deadlineAt)
      .then((value) => ({ kind: 'value', value }), (error) => ({ kind: 'error', error }))
    : Promise.resolve(null);
  const [uiOutcome, screenshotOutcome] = await Promise.all([uiPromise, screenshotPromise]);
  let uiState;
  if (uiOutcome?.kind === 'value') uiState = uiOutcome.value;
  else {
    uiState = { captured: false, reason: 'UI diagnostic collection failed' };
    collectionError = [collectionError, `UI state snapshot failed: ${uiOutcome?.error?.message || uiOutcome?.error || 'unknown error'}`].filter(Boolean).join('; ');
  }
  let failureScreenshot = null;
  if (screenshotOutcome?.kind === 'value') failureScreenshot = screenshotOutcome.value;
  else if (screenshotOutcome?.kind === 'error') failureScreenshot = { captured: false, reason: boundedDiagnosticText(screenshotOutcome.error?.message || screenshotOutcome.error, 240) };
  return capFailureDiagnostics(browserEvents, uiState, collectionError, failureScreenshot);
}
async function collectNormalReturnDiagnostics(page, snapshotEvents, checks, cleanupTimeoutMs = 2000, screenshotOutputDir = runtimeOutputDir) {
  if (!shouldCaptureNormalDiagnostics(checks)) return null;
  try {
    return await collectFailureDiagnostics(page, snapshotEvents, cleanupTimeoutMs, {
      captureScreenshot: true,
      screenshotOutputDir,
    });
  } catch (error) {
    return capFailureDiagnostics([], { captured: false, reason: 'Normal-return diagnostics unavailable' }, boundedDiagnosticText(error?.message || error, 256));
  }
}
async function readSnapshot(page) {
  checkRuntimeBudget();
  return withRuntimeDeadline(() => page.evaluate(readSnapshotInPage), 'read-runtime-snapshot');
}
function readSnapshotInPage() {
    const d = window.__cityStateStartUnitsTestDebug;
    const h = window.__hotSeatTestDebug;
    if (!d || typeof d.dumpState !== 'function' || !h || typeof h.snapshotHumanSeatsForTest !== 'function') return null;
    const seats = h.snapshotHumanSeatsForTest();
    const owners = Array.isArray(seats.humanOwnerIds) ? seats.humanOwnerIds : [];
    const civTypes = {};
    if (typeof h.civTypeForOwnerForTest === 'function') {
      for (const owner of owners) civTypes[owner] = h.civTypeForOwnerForTest(owner);
    }
    const ownerIdentities = h.snapshotRuntimeOwnerIdentitiesForTest?.() ?? null;
    return { state: d.dumpState(), seats, civTypes, ownerIdentities };
}
function canonicalSnapshot(raw) {
  if (!raw || !raw.state || !raw.seats) throw new Error('Read-only state hooks are unavailable');
  return {
    turn: raw.state.turn,
    seed: raw.state.seed ?? raw.state.mapSeed ?? null,
    seats: raw.seats,
    civTypes: raw.civTypes,
    cities: (raw.state.cities || []).map((c) => ({ id: c.id, name: c.name ?? null, ownerId: c.ownerId, q: c.q, r: c.r, civTypeId: c.civTypeId })).sort((a, b) => String(a.id).localeCompare(String(b.id))),
    units: (raw.state.units || []).map((u) => ({ id: u.id, ownerId: u.ownerId, typeId: u.typeId, q: u.q, r: u.r })).sort((a, b) => String(a.id).localeCompare(String(b.id))),
    ownerIdentities: raw.ownerIdentities,
  };
}
async function readOwnerObservability(page, ownerId) {
  checkRuntimeBudget();
  return withRuntimeDeadline(() => page.evaluate((owner) => {
    const snapshot = window.__hotSeatTestDebug?.snapshotRuntimeObservabilityForTest?.();
    if (!snapshot || !Array.isArray(snapshot.cities)) return null;
    const cities = snapshot.cities.filter((city) => city.ownerId === owner).map((city) => ({
      cityId: city.cityId,
      manpower: city.manpower,
      recruitmentOptions: city.recruitmentOptions,
    }));
    return { activeHumanOwnerId: snapshot.activeHumanOwnerId, ownerId: owner, cities };
  }, ownerId), `read-owner-observability:${ownerId}`);
}
function ownerObservationChecks(observation, ownerId, label, civId) {
  const cities = observation?.cities ?? [];
  const usable = cities.filter((city) => city.manpower
    && ['manpowerBiezacy', 'manpowerMax', 'regenPerTurn', 'kosztJednostki']
      .every((key) => Number.isFinite(city.manpower[key])));
  const mp = usable.length
    ? result('PASS', { ownerId, cities: usable.map((city) => ({ cityId: city.cityId, ...city.manpower })) })
    : result('BLOCKED', `${label}: read-only owner hook did not expose complete MP values for an owned city`);
  let g11;
  if (civId !== 'zulusi') {
    const observedRosters = cities.filter((city) => Array.isArray(city.recruitmentOptions));
    const leakedImpi = observedRosters.some((city) =>
      city.recruitmentOptions.some((unit) => unit.id === 'Impi'));
    g11 = observedRosters.length === 0
      ? result('BLOCKED', `${label}: no owned recruitment roster was observed for the neutral control`)
      : leakedImpi
      ? result('FAIL', { ownerId, civId, reason: 'Impi appeared in a non-Zulu owner roster; this is not a neutral control' })
      : result('NOT APPLICABLE', { ownerId, civId, reason: 'Non-Zulu owner has no approved Impi/G11 source field and no Impi roster entry; retained as a neutral control' });
  } else {
    const cityWithRecruitment = cities.find((city) => Array.isArray(city.recruitmentOptions));
    const options = cityWithRecruitment?.recruitmentOptions ?? [];
    const impi = options.find((unit) => unit.id === 'Impi');
    const ordinary = options.find((unit) => unit.id && unit.id !== 'Impi');
    g11 = impi && ordinary && Number.isFinite(impi.goldCost) && Number.isFinite(ordinary.goldCost)
      && Number.isFinite(impi.manpowerCost) && Number.isFinite(ordinary.manpowerCost)
      ? result('PASS', { ownerId, cityId: cityWithRecruitment.cityId, civId,
        impi: { id: impi.id, goldCost: impi.goldCost, manpowerCost: impi.manpowerCost },
        ordinary: { id: ordinary.id, goldCost: ordinary.goldCost, manpowerCost: ordinary.manpowerCost },
        evidence: 'live owner-specific gold-cost quote from the approved G11 consumer, plus separate MP values; no counterfactual sensitivity claimed' })
      : result('BLOCKED', `${label}: Zulu read-only hook did not expose finite gold and manpower costs for Impi and ordinary recruitment`);
  }
  return { mp, g11 };
}
function neutralRosterControl(apiOptions, uiRows) {
  if (!Array.isArray(apiOptions) || !Array.isArray(uiRows) || apiOptions.length === 0 || uiRows.length === 0) {
    return result('BLOCKED', 'Neutral control needs both observed API and rendered recruitment rosters');
  }
  if (apiOptions.some((unit) => unit.id === 'Impi') || uiRows.some((unit) => unit.name === 'Impi')) {
    return result('FAIL', 'Impi appeared in a non-Zulu owner API or rendered recruitment roster');
  }
  const uiOrdinary = uiRows.find((row) => row.name && Number.isFinite(parseDisplayedNumber(row.goldCostText)));
  const apiOrdinary = uiOrdinary && apiOptions.find((unit) => unit.id === uiOrdinary.name);
  if (!uiOrdinary || !apiOrdinary || !Number.isFinite(apiOrdinary.goldCost)
      || !sameDisplayedNumber(uiOrdinary.goldCostText, apiOrdinary.goldCost)) {
    return result('BLOCKED', 'Neutral control lacks matching ordinary-unit API and rendered gold-cost evidence');
  }
  return result('NOT APPLICABLE', { reason: 'No approved G11 source field for this civ; both actual owner rosters lack Impi and ordinary gold quote matches', ordinary: { id: apiOrdinary.id, uiGoldCostText: uiOrdinary.goldCostText, apiGoldCost: apiOrdinary.goldCost } });
}
function g11Unavailable(civId, ownerId, detail) {
  return result('BLOCKED', { ownerId, civId, reason: detail || 'Recruitment roster/UI evidence was unavailable; a neutral control cannot be inferred' });
}
function ordinaryUiCleanupAllowsNextAction(observation) {
  return observation?.cleanup?.ok === true;
}

function eligibleOwnerAndNeutralControls(checks) {
  const statuses = ['g11-human1', 'g11-human2', 'g11-ai'].map((key) => checks[key]?.status ?? 'BLOCKED');
  if (statuses.includes('FAIL')) return result('FAIL', 'Zulu G11 observation or a neutral control failed');
  if (statuses.filter((status) => status === 'PASS').length === 1
      && statuses.filter((status) => status === 'NOT APPLICABLE').length === 2) {
    return result('PASS', 'Exactly one Zulu owner produced the eligible G11 observation; Rome and Egypt remained neutral controls');
  }
  return result('BLOCKED', 'Expected exactly one eligible Zulu G11 observation and two NOT APPLICABLE neutral controls');
}
function inspectFirstContactAudienceInPage() {
  const overlay = document.querySelector('.civ-diplo-aud');
  const visible = (element) => {
    if (!element) return false;
    for (let node = element; node && node.nodeType === 1; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse'
          || Number(style.opacity) === 0 || style.contentVisibility === 'hidden') return false;
    }
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };
  if (!overlay || !visible(overlay)) return { open: false };
  const back = overlay.querySelector('.civ-diplo-aud-back');
  return { open: true, back: back ? { visible: visible(back), disabled: !!back.disabled, label: String(back.textContent || '').trim() } : null };
}
function waitTwoAnimationFramesInPage() {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}
async function dismissFirstContactAudiences(page, timeout, stage = 'before-ordinary-ui') {
  const budget = Math.max(1, Math.min(Number(timeout) || 1, remainingRuntimeMs()));
  const started = Date.now();
  let dismissed = 0;
  try {
    return await withRuntimeDeadline(async () => {
      // Allow already queued first-contact work to settle before declaring the queue empty.
      await page.evaluate(waitTwoAnimationFramesInPage);
      while (true) {
        checkRuntimeBudget();
        const state = await page.evaluate(inspectFirstContactAudienceInPage);
        if (!state?.open) return { ok: true, dismissed, stage, elapsedMs: Date.now() - started };
        if (dismissed >= 16) return { ok: false, dismissed, stage, elapsedMs: Date.now() - started, reason: 'First-contact audience queue exceeded the 16-dismissal bound', audience: state };
        const label = String(state.back?.label || '').replace(/\s+/g, ' ').trim();
        if (!state.back?.visible || state.back.disabled || !['Wróć', 'Wyjście'].includes(label)) {
          return { ok: false, dismissed, stage, elapsedMs: Date.now() - started, reason: 'Visible diplomacy audience has no enabled ordinary Wróć/Wyjście dismiss control', audience: state };
        }
        const button = page.locator('.civ-diplo-aud .civ-diplo-aud-back');
        const count = await button.count();
        if (count !== 1) return { ok: false, dismissed, stage, elapsedMs: Date.now() - started, reason: `Expected one visible diplomacy audience back control, found ${count}`, audience: state };
        await button.click({ timeout: Math.max(1, Math.min(budget - (Date.now() - started), ordinaryActionTimeoutMs())) });
        dismissed += 1;
        await page.evaluate(waitTwoAnimationFramesInPage);
      }
    }, `dismiss-first-contact-audience:${stage}`, budget);
  } catch (error) {
    return { ok: false, dismissed, stage, elapsedMs: Date.now() - started, reason: boundedDiagnosticText(error?.message || error, 240) };
  }
}
function foundingProbeInPage({ ownerId, point }) {
  const h = window.__hotSeatTestDebug;
  const d = window.__cityStateStartUnitsTestDebug;
  if (typeof h?.snapshotHumanSeatsForTest !== 'function'
      || typeof h?.snapshotRuntimeObservabilityForTest !== 'function'
      || typeof h?.isAwaitingFirstPlayerCity !== 'function'
      || typeof d?.dumpState !== 'function') {
    return { available: false, reason: 'Required read-only founding hooks are unavailable' };
  }
  const seats = h.snapshotHumanSeatsForTest();
  const runtime = h.snapshotRuntimeObservabilityForTest();
  const state = d.dumpState();
  const expectedStart = runtime?.startHexes?.find((row) => row.ownerId === ownerId) ?? null;
  const allCities = (state?.cities ?? []).map((city) => ({
    id: city.id ?? null, ownerId: city.ownerId ?? null,
    q: Number.isFinite(city.q) ? city.q : null, r: Number.isFinite(city.r) ? city.r : null,
  }));
  const cities = allCities.slice(0, 64);
  const element = point ? document.elementFromPoint(point.x, point.y) : null;
  const hitCanvas = typeof element?.closest === 'function' ? element.closest('canvas') : null;
  const rect = hitCanvas?.getBoundingClientRect?.() ?? null;
  const expectedCanvas = runtime?.canvas ?? null;
  const sameRect = !!rect && !!expectedCanvas
    && Math.abs(rect.left - expectedCanvas.left) < 1
    && Math.abs(rect.top - expectedCanvas.top) < 1
    && Math.abs(rect.right - expectedCanvas.right) < 1
    && Math.abs(rect.bottom - expectedCanvas.bottom) < 1;
  const targetPath = [];
  for (let node = element, depth = 0; node && depth < 6; node = node.parentElement, depth += 1) {
    targetPath.push({ tag: node.tagName || null, id: String(node.id || '').slice(0, 80), className: String(node.className || '').slice(0, 120) });
  }
  return {
    available: true,
    activeHumanOwnerId: seats?.activeHumanOwnerId ?? null,
    awaitingFirstPlayerCity: h.isAwaitingFirstPlayerCity(ownerId),
    projectedStartHex: expectedStart?.hex ?? null,
    projectedStartPoint: expectedStart?.absoluteViewportCssPx ?? null,
    canvas: expectedCanvas,
    priorCities: cities,
    priorCityIds: allCities.map((city) => city.id),
    hitTarget: { tag: element?.tagName || null, id: String(element?.id || '').slice(0, 80), className: String(element?.className || '').slice(0, 120), ancestorPath: targetPath, canvasHit: !!hitCanvas && sameRect },
  };
}
function foundingProofInPage({ ownerId, priorCityIds }) {
  const h = window.__hotSeatTestDebug;
  const state = window.__cityStateStartUnitsTestDebug?.dumpState?.();
  const seats = h?.snapshotHumanSeatsForTest?.();
  if (!state || !Array.isArray(state.cities) || !seats) return null;
  if (seats.activeHumanOwnerId !== ownerId || h.isAwaitingFirstPlayerCity?.(ownerId) !== false) return null;
  const prior = new Set(priorCityIds || []);
  const newHumanCities = state.cities.filter((city) => city.id != null && !prior.has(city.id)
      && city.ownerId === ownerId).map((city) => ({
    id: city.id, ownerId: city.ownerId,
    q: Number.isFinite(city.q) ? city.q : null,
    r: Number.isFinite(city.r) ? city.r : null,
  }));
  if (newHumanCities.length !== 1
      || !Number.isFinite(newHumanCities[0].q) || !Number.isFinite(newHumanCities[0].r)) return null;
  return { ownerId, activeHumanOwnerId: seats.activeHumanOwnerId, awaitingFirstPlayerCity: false, city: newHumanCities[0] };
}
async function boundedFoundingProbe(page, ownerId, point, timeoutMs = 750) {
  let timer;
  const evaluation = Promise.resolve()
    .then(() => page.evaluate(foundingProbeInPage, { ownerId, point }))
    .then((value) => ({ kind: 'value', value }), (error) => ({ kind: 'error', error }));
  const deadline = new Promise((resolve) => { timer = setTimeout(() => resolve({ kind: 'timeout' }), Math.max(1, timeoutMs)); });
  const outcome = await Promise.race([evaluation, deadline]);
  clearTimeout(timer);
  if (outcome.kind === 'value') return outcome.value;
  if (outcome.kind === 'error') return { available: false, reason: boundedDiagnosticText(outcome.error?.message || outcome.error, 240) };
  return { available: false, timedOut: true, reason: 'Bounded read-only founding probe timed out' };
}
async function foundCityThroughMapUi(page, ownerId, timeout) {
  const stage = 'first-city-founding';
  const dismissal = await dismissFirstContactAudiences(page, timeout, `${stage}:pre-click`);
  if (!dismissal.ok) return result('BLOCKED', { stage, reason: dismissal.reason, audience: dismissal, clickIssued: false });
  const before = await withRuntimeDeadline(() => page.evaluate(foundingProbeInPage, { ownerId, point: null }), `founding-before:${ownerId}`);
  const point = before?.projectedStartPoint;
  if (!before?.available || before.activeHumanOwnerId !== ownerId || before.awaitingFirstPlayerCity !== true
      || !point || !Number.isFinite(point.x) || !Number.isFinite(point.y) || !before.projectedStartHex) {
    return result('BLOCKED', { stage, reason: `Owner ${ownerId} is not awaiting founding with finite projected start point and read-only hooks`, before, clickIssued: false });
  }
  const viewport = await withRuntimeDeadline(() => page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight })), `founding-viewport:${ownerId}`);
  if (point.x < Math.max(0, before.canvas?.left ?? Infinity)
      || point.x > Math.min(viewport?.width ?? -Infinity, before.canvas?.right ?? -Infinity)
      || point.y < Math.max(0, before.canvas?.top ?? Infinity)
      || point.y > Math.min(viewport?.height ?? -Infinity, before.canvas?.bottom ?? -Infinity)) {
    return result('BLOCKED', { stage, reason: `Owner ${ownerId} projected start point is outside visible canvas bounds`, before, clickIssued: false });
  }
  const clickProbe = await withRuntimeDeadline(() => page.evaluate(foundingProbeInPage, { ownerId, point }), `founding-hit-target:${ownerId}`);
  if (!clickProbe?.hitTarget?.canvasHit) {
    return result('BLOCKED', { stage, reason: 'Projected click point does not hit the main map canvas; no click was issued', before, hitTarget: clickProbe?.hitTarget ?? null, clickIssued: false });
  }
  const clickStartedAt = Date.now();
  await withRuntimeDeadline(() => page.mouse.click(point.x, point.y, { timeout: Math.min(timeout, ordinaryActionTimeoutMs()) }), `founding-click:${ownerId}`, Math.min(timeout, ordinaryActionTimeoutMs()));
  try {
    const after = await withRuntimeDeadline(() => page.waitForFunction(foundingProofInPage, {
      ownerId, priorCityIds: before.priorCityIds,
    }, { timeout: Math.min(timeout, remainingRuntimeMs()) }).then((handle) => handle.jsonValue()), `founding-readback:${ownerId}`);
    if (!after) return result('BLOCKED', {
      stage, elapsedMs: Date.now() - clickStartedAt,
      reason: 'Map click did not produce exactly one new active-human city with finite actual coordinates and cleared founding-pending state',
      projectedStartHex: before.projectedStartHex, projectedStartPoint: point, actualCityHex: null, clickIssued: true,
    });
    return result('PASS', {
      stage, elapsedMs: Date.now() - clickStartedAt, ownerId, cityId: after.city.id,
      projectedStartHex: before.projectedStartHex, actualCityHex: { q: after.city.q, r: after.city.r },
      awaitingFirstPlayerCity: after.awaitingFirstPlayerCity, activeHumanOwnerId: after.activeHumanOwnerId,
      clickTarget: clickProbe.hitTarget, clickIssued: true,
    });
  } catch (error) {
    const after = await boundedFoundingProbe(page, ownerId, point, 750);
    return result('BLOCKED', {
      stage, elapsedMs: Date.now() - clickStartedAt,
      reason: boundedDiagnosticText(error?.message || error, 240),
      projectedStartHex: before.projectedStartHex, projectedStartPoint: point,
      before: { activeHumanOwnerId: before.activeHumanOwnerId, awaitingFirstPlayerCity: before.awaitingFirstPlayerCity, priorCities: before.priorCities },
      after: after?.available ? {
        activeHumanOwnerId: after.activeHumanOwnerId, awaitingFirstPlayerCity: after.awaitingFirstPlayerCity,
        currentCities: after.priorCities,
        newCities: after.priorCities.filter((city) => !before.priorCityIds.includes(city.id)),
      } : after,
      clickTarget: clickProbe.hitTarget, clickIssued: true,
    });
  }
}
function recordFirstHumanFoundingProof(checks, foundingResult, expectedOwnerId) {
  if (!checks || typeof checks !== 'object') return result('BLOCKED', 'Runtime check record is unavailable');
  const detail = foundingResult?.detail;
  const valid = foundingResult?.status === 'PASS'
    && detail && typeof detail === 'object' && !Array.isArray(detail)
    && detail.stage === 'first-city-founding'
    && Number.isSafeInteger(expectedOwnerId) && detail.ownerId === expectedOwnerId
    && Number.isSafeInteger(detail.activeHumanOwnerId) && detail.activeHumanOwnerId === expectedOwnerId
    && detail.awaitingFirstPlayerCity === false
    && detail.clickIssued === true
    && detail.clickTarget?.canvasHit === true
    && typeof detail.cityId === 'string' && detail.cityId.trim().length > 0
    && Number.isFinite(detail.actualCityHex?.q) && Number.isFinite(detail.actualCityHex?.r)
    && Number.isFinite(detail.projectedStartHex?.q) && Number.isFinite(detail.projectedStartHex?.r)
    && Number.isFinite(detail.elapsedMs) && detail.elapsedMs >= 0;
  if (!valid) {
    const proof = result('BLOCKED', {
      reason: foundingResult?.status === 'PASS'
        ? 'Actual first-human founding helper detail is incomplete or malformed'
        : 'First-human founding helper did not return PASS',
      helperStatus: foundingResult?.status ?? 'NOT RETURNED',
      detail: detail && typeof detail === 'object' ? detail : null,
    });
    checks['human1-founding-proof'] = proof;
    return proof;
  }
  const proof = result('PASS', {
    source: 'actual foundCityThroughMapUi helper result',
    stage: detail.stage,
    ownerId: detail.ownerId,
    cityId: detail.cityId,
    actualCityHex: { q: detail.actualCityHex.q, r: detail.actualCityHex.r },
    projectedStartHex: { q: detail.projectedStartHex.q, r: detail.projectedStartHex.r },
    activeHumanOwnerId: detail.activeHumanOwnerId,
    awaitingFirstPlayerCity: detail.awaitingFirstPlayerCity,
    clickIssued: detail.clickIssued,
    clickTarget: detail.clickTarget,
    elapsedMs: detail.elapsedMs,
  });
  checks['human1-founding-proof'] = proof;
  return proof;
}
function parseDisplayedNumber(value) {
  const normalized = String(value).replace(/\s/g, '').replace(',', '.').replace(/[^0-9.+-]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}
function sameDisplayedNumber(text, expected) {
  const actual = parseDisplayedNumber(text);
  return actual !== null && Math.abs(actual - Number(expected)) < 0.011;
}

async function collectActiveHumanUi(page, cfg, expectedOwner, civId, stage) {
  checkRuntimeBudget();
  const audience = await dismissFirstContactAudiences(page, cfg.timeout, `city-ui:${stage}`);
  if (!audience.ok) return {
    mp: result('BLOCKED', { reason: audience.reason, regeneration: 'NOT EXPOSED BY RECRUITMENT UI' }), mpPartial: result('NOT OBSERVED', 'City UI was not reached'),
    g11: g11Unavailable(civId, expectedOwner, 'Could not safely dismiss the first-contact audience before ordinary city UI'),
    cleanup: { attempted: false, ok: true },
  };
  const seat = await withRuntimeDeadline(() => page.evaluate(() => window.__hotSeatTestDebug?.snapshotHumanSeatsForTest?.() ?? null), `active-seat:${expectedOwner}`);
  if (!seat || seat.activeHumanOwnerId !== expectedOwner) {
    return { mp: result('BLOCKED', { reason: 'Active owner did not match the expected seat before opening city UI', regeneration: 'NOT EXPOSED BY RECRUITMENT UI' }), mpPartial: result('NOT OBSERVED', 'Active-owner check failed before city UI'), g11: g11Unavailable(civId, expectedOwner, 'Active human owner mismatch'), cleanup: { attempted: false, ok: true } };
  }
  const ownerObservation = await readOwnerObservability(page, expectedOwner);
  const apiChecks = ownerObservationChecks(ownerObservation, expectedOwner, 'active human owner API', civId);
  const cityButton = page.locator('[data-act="cities"]');
  if (await withRuntimeDeadline(() => cityButton.count(), 'city-list-control-count') !== 1) return {
    mp: result('BLOCKED', { reason: 'Unique ordinary Cities control not found', regeneration: 'NOT EXPOSED BY RECRUITMENT UI' }), mpPartial: result('NOT OBSERVED', 'City-list control was not found'), g11: g11Unavailable(civId, expectedOwner, 'City-list control was not found before rendered recruitment UI evidence'), cleanup: { attempted: false, ok: true },
  };
  const cityList = page.locator('.civ-city-list-hud.open');
  let mp = result('BLOCKED', { reason: 'Recruitment UI does not expose the full Manpower acceptance fields', regeneration: 'NOT EXPOSED BY RECRUITMENT UI' });
  let mpPartial = result('NOT OBSERVED', 'Recruitment UI not yet inspected');
  // A G11 PASS needs rendered recruitment evidence as well as the API quote.
  let g11 = g11Unavailable(civId, expectedOwner, 'Recruitment UI roster and cost parity have not been observed yet');
  let primaryError = null;
  let cleanupError = null;
  const cleanupErrors = [];
  let g11Options = null;
  let g11Rows = null;
  try {
    await withRuntimeDeadline(() => cityButton.click({ timeout: ordinaryActionTimeoutMs() }), 'open-owner-city-list', ordinaryActionTimeoutMs());
    await waitFor(cityList, 'active-owner city list', cfg.timeout);
    const names = await withRuntimeDeadline(() => cityList.locator('.sl-item .sl-name').allTextContents(), 'read-owner-city-names');
    const stateCities = await withRuntimeDeadline(() => page.evaluate((owner) => {
      const s = window.__cityStateStartUnitsTestDebug?.dumpState?.();
      return (s?.cities ?? []).filter((c) => c.ownerId === owner).map((c) => ({ id: c.id, name: c.name ?? c.cityName ?? null }));
    }, expectedOwner), `read-owner-city-list:${expectedOwner}`);
    const uiName = names[0]?.trim();
    if (!uiName || names.length !== stateCities.length || stateCities.length === 0) throw new Error('Visible active-owner city-list rows do not match read-only owner city rows');
    const matchingRows = await withRuntimeDeadline(() => cityList.locator('.sl-item').evaluateAll((els, name) => els.flatMap((el, index) =>
      el.querySelector('.sl-name')?.textContent?.trim() === name ? [index] : []), uiName), 'match-visible-city-row');
    if (matchingRows.length !== 1) throw new Error('Could not identify one city-list row for the current human owner');
    // The visible list and owner snapshot share source order; select only its first matching human city.
    const stateCity = stateCities[matchingRows[0]];
    const apiCity = ownerObservation?.cities?.[matchingRows[0]];
    if (!apiCity || !stateCity) throw new Error('Selected UI city has no matching read-only owner snapshot');
    await withRuntimeDeadline(() => cityList.locator('.sl-item').nth(matchingRows[0]).click({ timeout: ordinaryActionTimeoutMs() }), 'select-owner-city', ordinaryActionTimeoutMs());
    const recruitButton = page.locator('.civ-ux-frame .civ-v-icon-btn[aria-label="Jednostki do rekrutacji"]');
    if (await withRuntimeDeadline(() => recruitButton.count(), 'recruitment-control-count') !== 1) throw new Error('Existing recruitment UI control was not found');
    await withRuntimeDeadline(() => recruitButton.click({ timeout: ordinaryActionTimeoutMs() }), 'open-recruitment-panel', ordinaryActionTimeoutMs());
    const recruitRows = page.locator('.unit-recruit-compact-row');
    await withRuntimeDeadline(() => recruitRows.first().waitFor({ state: 'visible', timeout: Math.min(cfg.timeout, remainingRuntimeMs()) }), 'wait-for-recruitment-rows', Math.min(cfg.timeout, remainingRuntimeMs()));
    await captureScreenshot(page, `human-${expectedOwner}-${stage}-recruitment`);
    const recruitmentObservation = await withRuntimeDeadline(() => recruitRows.evaluateAll((els) => els.map((el) => {
      const manpower = el.querySelector('.unit-recruit-manpower');
      const unitRequired = manpower?.getAttribute('data-required') ?? null;
      return {
        name: el.querySelector('.bld-compact-name')?.textContent?.trim() ?? '',
        empireAvailable: manpower?.getAttribute('data-available') ?? null,
        unitRequired,
        required: unitRequired,
        summary: manpower?.querySelector('.unit-recruit-manpower-summary')?.textContent?.trim() ?? null,
        goldCostText: el.querySelector('.unit-compact-cost')?.childNodes?.[0]?.textContent?.trim() ?? null,
      };
    })), 'read-recruitment-rows');
    const partialUi = recruitmentObservation.filter((row) => row.empireAvailable !== null || row.unitRequired !== null);
    const hasDisplayedPool = partialUi.some((row) => row.empireAvailable !== null && row.unitRequired !== null);
    mpPartial = result(hasDisplayedPool ? 'OBSERVED' : 'NOT OBSERVED', {
      observation: hasDisplayedPool ? 'Partial recruitment-panel Manpower values observed' : 'No complete empire-available/unit-required pair found in visible recruitment rows',
      valuesByUnit: partialUi.slice(0, 12), ownerId: expectedOwner,
      poolScope: 'empire', cityContextId: apiCity.cityId, cityContextOnly: true,
      noCityCurrentOrMaximumClaim: true,
      regeneration: 'NOT EXPOSED BY RECRUITMENT UI', fullAcceptance: 'NOT CLAIMED',
    });
    mp = result('BLOCKED', {
      reason: 'Recruitment UI exposes a partial Manpower observation only; it does not expose per-turn regeneration.',
      partialUiCheck: mpPartial.status,
      regeneration: 'NOT EXPOSED BY RECRUITMENT UI',
      cityId: apiCity.cityId,
      ownerId: expectedOwner,
      fullManpowerAcceptance: 'NOT CLAIMED',
    });
    const apiOptions = apiCity.recruitmentOptions ?? [];
    const uiImpi = recruitmentObservation.find((row) => row.name === 'Impi');
    const apiImpi = apiOptions.find((unit) => unit.id === 'Impi');
    const uiOrdinary = recruitmentObservation.find((row) => row.name && row.name !== 'Impi');
    const apiOrdinary = uiOrdinary && apiOptions.find((unit) => unit.id === uiOrdinary.name);
    g11Rows = recruitmentObservation;
    g11Options = apiOptions;
    if (apiChecks.g11.status === 'NOT APPLICABLE') {
      g11 = neutralRosterControl(apiOptions, recruitmentObservation);
    } else if (uiImpi?.required !== null && uiImpi?.goldCostText !== null && uiImpi && apiImpi
        && uiOrdinary?.required !== null && uiOrdinary?.goldCostText !== null && uiOrdinary && apiOrdinary
        && apiChecks.g11.status === 'PASS') {
      const agrees = sameDisplayedNumber(uiImpi.required, apiImpi.manpowerCost)
        && sameDisplayedNumber(uiOrdinary.required, apiOrdinary.manpowerCost)
        && sameDisplayedNumber(uiImpi.goldCostText, apiImpi.goldCost)
        && sameDisplayedNumber(uiOrdinary.goldCostText, apiOrdinary.goldCost);
      g11 = agrees
        ? result('PASS', { ownerId: expectedOwner, cityId: apiCity.cityId,
          impi: { id: apiImpi.id, uiGoldCostText: uiImpi.goldCostText, apiGoldCost: apiImpi.goldCost, uiManpowerCost: uiImpi.required, apiManpowerCost: apiImpi.manpowerCost },
          ordinary: { id: apiOrdinary.id, uiGoldCostText: uiOrdinary.goldCostText, apiGoldCost: apiOrdinary.goldCost, uiManpowerCost: uiOrdinary.required, apiManpowerCost: apiOrdinary.manpowerCost },
          evidence: 'observed owner-specific gold quote and separate MP cost parity; no counterfactual sensitivity claimed' })
        : result('FAIL', 'Human recruitment UI gold or manpower costs disagreed with the read-only owner snapshot');
    }
  } catch (err) {
    primaryError = err;
    mp = result('BLOCKED', {
      reason: err instanceof Error ? err.message : 'Unknown recruitment UI read failure',
      partialUiCheck: mpPartial.status,
      regeneration: 'NOT EXPOSED BY RECRUITMENT UI',
      fullManpowerAcceptance: 'NOT CLAIMED',
    });
    if (mpPartial.status === 'NOT OBSERVED') mpPartial = result('NOT OBSERVED', { reason: mp.detail.reason, valuesByUnit: [], regeneration: 'NOT EXPOSED BY RECRUITMENT UI' });
    g11 = g11Unavailable(civId, expectedOwner, `Recruitment UI read failed: ${mp.detail.reason}`);
  } finally {
    try {
      const close = page.locator('.civ-ux-frame [data-city-exit]');
      if (await withRuntimeDeadline(() => close.count(), 'city-close-control-count') === 1
          && await withRuntimeDeadline(() => close.isVisible(), 'city-close-control-visible')) {
        await withRuntimeDeadline(() => close.click({ timeout: ordinaryActionTimeoutMs() }), 'close-city-panel', ordinaryActionTimeoutMs());
      }
    } catch (err) {
      cleanupErrors.push(`city panel close: ${err instanceof Error ? err.message : 'unknown error'}`);
    }
    try {
      await withRuntimeDeadline(() => page.locator('.civ-ux-frame').waitFor({ state: 'hidden', timeout: Math.min(cfg.timeout, remainingRuntimeMs()) }), 'wait-for-city-panel-close', Math.min(cfg.timeout, remainingRuntimeMs()));
    } catch (err) {
      cleanupErrors.push(`city panel hidden wait: ${err instanceof Error ? err.message : 'unknown error'}`);
    }
    try {
      if (await withRuntimeDeadline(() => cityList.count(), 'city-list-count')) await withRuntimeDeadline(() => page.keyboard.press('Escape'), 'close-city-list', ordinaryActionTimeoutMs());
    } catch (err) {
      cleanupErrors.push(`city list dismiss: ${err instanceof Error ? err.message : 'unknown error'}`);
    }
    try {
      await withRuntimeDeadline(() => cityList.waitFor({ state: 'hidden', timeout: Math.min(cfg.timeout, remainingRuntimeMs()) }), 'wait-for-city-list-close', Math.min(cfg.timeout, remainingRuntimeMs()));
    } catch (err) {
      cleanupErrors.push(`city list hidden wait: ${err instanceof Error ? err.message : 'unknown error'}`);
    }
    if (cleanupErrors.length) cleanupError = new Error(cleanupErrors.join('; ').slice(0, 1024));
  }
  if (cleanupError) {
    mp = result('BLOCKED', { ...mp.detail, cleanup: { status: 'FAILED', errors: cleanupErrors }, primaryError: primaryError?.message ?? null });
  } else if (mp.detail && typeof mp.detail === 'object') {
    mp = result(mp.status, { ...mp.detail, cleanup: { status: 'PASS', panelAndCityListClosed: true, errors: [] } });
  }
  if (g11.status === 'NOT APPLICABLE' && g11Rows && g11Options) g11 = neutralRosterControl(g11Options, g11Rows);
  return { mp, mpPartial, g11, cleanup: { attempted: true, ok: !cleanupError, errors: cleanupErrors }, primaryError: primaryError?.message ?? null };
}

function validateSerializedMapSnapshot(snapshot, expectedSeed) {
  const errors = [];
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return ['mapSnapshot must be an object'];
  if (snapshot.fmt !== 2) errors.push('mapSnapshot.fmt must equal 2');
  if (!Number.isSafeInteger(snapshot.szerokoscQ) || snapshot.szerokoscQ <= 0) errors.push('mapSnapshot.szerokoscQ must be a positive safe integer');
  if (!Number.isSafeInteger(snapshot.wysokoscR) || snapshot.wysokoscR <= 0) errors.push('mapSnapshot.wysokoscR must be a positive safe integer');
  if (!Number.isSafeInteger(snapshot.n) || snapshot.n <= 0) errors.push('mapSnapshot.n must be a positive safe integer');
  if (Number.isSafeInteger(snapshot.szerokoscQ) && Number.isSafeInteger(snapshot.wysokoscR)
      && Number.isSafeInteger(snapshot.n) && snapshot.n !== snapshot.szerokoscQ * snapshot.wysokoscR) {
    errors.push('mapSnapshot.n must equal its width × height');
  }
  if (!Number.isSafeInteger(snapshot.seed)) errors.push('mapSnapshot.seed must be a safe integer');
  else if (Number.isSafeInteger(expectedSeed) && snapshot.seed !== expectedSeed) errors.push('mapSnapshot.seed differs from expected seed');
  if (!Array.isArray(snapshot.riverPaths)
      || snapshot.riverPaths.some((river) => !Array.isArray(river) || river.some((point) => !point || !Number.isFinite(point.q) || !Number.isFinite(point.r)))) {
    errors.push('mapSnapshot.riverPaths must be coordinate arrays');
  }
  if (!Array.isArray(snapshot.dict) || snapshot.dict.some((entry) => typeof entry !== 'string')) errors.push('mapSnapshot.dict must be a string array');
  if (!Number.isSafeInteger(snapshot.n) || snapshot.n <= 0) return errors;
  const dictLength = Array.isArray(snapshot.dict) ? snapshot.dict.length : 0;
  const dense = ['q', 'r', 'terenIdx', 'nakladkaIdx', 'ulepszenieIdx', 'wlascicielIdx', 'wioskaIstnieje', 'wioskaLudnosc', 'rzekaObecna'];
  for (const key of dense) {
    const values = snapshot[key];
    if (!Array.isArray(values) || values.length !== snapshot.n) { errors.push(`mapSnapshot.${key} must be an array with length n`); continue; }
    if (values.some((value) => !Number.isFinite(value))) errors.push(`mapSnapshot.${key} entries must be finite numbers`);
  }
  for (const key of ['q', 'r']) {
    if (Array.isArray(snapshot[key]) && snapshot[key].some((value) => !Number.isFinite(value))) errors.push(`mapSnapshot.${key} entries must be finite coordinates`);
  }
  for (const key of ['terenIdx', 'nakladkaIdx', 'ulepszenieIdx']) {
    if (Array.isArray(snapshot[key]) && snapshot[key].some((value) => !Number.isSafeInteger(value) || value < 0 || value >= dictLength)) errors.push(`mapSnapshot.${key} entries must index dict`);
  }
  if (Array.isArray(snapshot.wlascicielIdx) && snapshot.wlascicielIdx.some((value) => !Number.isSafeInteger(value) || value < -1 || value >= dictLength)) errors.push('mapSnapshot.wlascicielIdx entries must be -1 or index dict');
  for (const key of ['wioskaIstnieje', 'rzekaObecna']) {
    if (Array.isArray(snapshot[key]) && snapshot[key].some((value) => value !== 0 && value !== 1)) errors.push(`mapSnapshot.${key} entries must be 0 or 1`);
  }
  if (Array.isArray(snapshot.wioskaLudnosc) && snapshot.wioskaLudnosc.some((value) => !Number.isFinite(value) || value < 0)) errors.push('mapSnapshot.wioskaLudnosc entries must be nonnegative finite numbers');
  const sparseTypes = {
    rzekaKrawedzie: 'safeIntegerArray', zloze: 'dictIndex', zlozeMinEra: 'finiteNumber',
    ulepszenia: 'dictIndexArray', improvementKey: 'dictIndex',
  };
  for (const [key, valueType] of Object.entries(sparseTypes)) {
    const column = snapshot[key];
    if (!column || !Array.isArray(column.hexIdx) || !Array.isArray(column.val) || column.hexIdx.length !== column.val.length) {
      errors.push(`mapSnapshot.${key} must have matching hexIdx/val arrays`);
      continue;
    }
    if (column.hexIdx.some((index) => !Number.isSafeInteger(index) || index < 0 || index >= snapshot.n)) errors.push(`mapSnapshot.${key}.hexIdx entries must index the map`);
    const validDictIndex = (value) => Number.isSafeInteger(value) && value >= 0 && value < dictLength;
    const validValue = valueType === 'dictIndex'
      ? validDictIndex
      : valueType === 'finiteNumber'
        ? (value) => Number.isFinite(value)
        : valueType === 'safeIntegerArray'
          ? (value) => Array.isArray(value) && value.every((item) => Number.isSafeInteger(item))
          : (value) => Array.isArray(value) && value.every(validDictIndex);
    if (column.val.some((value) => !validValue(value))) errors.push(`mapSnapshot.${key}.val entries have invalid types`);
  }
  const visibility = snapshot.widocznosc;
  if (!visibility || !Array.isArray(visibility.hexIdx) || !Array.isArray(visibility.playerIdx) || !Array.isArray(visibility.valIdx)
      || visibility.hexIdx.length !== visibility.playerIdx.length || visibility.hexIdx.length !== visibility.valIdx.length) {
    errors.push('mapSnapshot.widocznosc must have matching hexIdx/playerIdx/valIdx arrays');
  } else if (visibility.hexIdx.some((index) => !Number.isSafeInteger(index) || index < 0 || index >= snapshot.n)
      || visibility.playerIdx.some((index) => !Number.isSafeInteger(index) || index < 0 || index >= dictLength)
      || visibility.valIdx.some((index) => !Number.isSafeInteger(index) || index < 0 || index >= dictLength)) {
    errors.push('mapSnapshot.widocznosc indices must reference map and dictionary entries');
  }
  return errors;
}

function validateProductionSaveProof(proof, expectedSeed) {
  if (!proof || typeof proof !== 'object' || Array.isArray(proof)) return { status: 'BLOCKED', reason: 'No production save payload was readable for the selected slot' };
  const errors = [];
  if (!Number.isSafeInteger(proof.turn) || proof.turn < 1) errors.push('tura must be a positive safe integer');
  if (!Number.isSafeInteger(proof.seed)) errors.push('seed must be a safe integer');
  else if (Number.isSafeInteger(expectedSeed) && proof.seed !== expectedSeed) errors.push('seed differs from the configured seed');
  if (!Array.isArray(proof.humanOwnerIds) || proof.humanOwnerIds.length === 0
      || proof.humanOwnerIds.some((owner) => !Number.isSafeInteger(owner) || owner < 0)
      || new Set(proof.humanOwnerIds).size !== proof.humanOwnerIds.length) {
    errors.push('humanOwnerIds must be a nonempty array of unique nonnegative safe integers');
  }
  if (!Number.isSafeInteger(proof.activeHumanOwnerId)
      || !Array.isArray(proof.humanOwnerIds)
      || !proof.humanOwnerIds.includes(proof.activeHumanOwnerId)) errors.push('activeHumanOwnerId must be a listed human owner');
  if (!Array.isArray(proof.cities)) errors.push('cities must be an array');
  else {
    if (proof.cities.some((city) => !city || typeof city.id !== 'string' || !city.id.trim()
        || !Number.isSafeInteger(city.ownerId) || !Number.isFinite(city.q) || !Number.isFinite(city.r))) {
      errors.push('cities must contain string IDs, safe-integer owners, and finite q/r coordinates');
    }
    if (new Set(proof.cities.map((city) => city?.id)).size !== proof.cities.length) errors.push('city IDs must be unique');
  }
  if (!Array.isArray(proof.units)) errors.push('units must be an array');
  else {
    if (proof.units.some((unit) => !unit || typeof unit.id !== 'string' || !unit.id.trim()
        || !Number.isSafeInteger(unit.ownerId) || typeof unit.typeId !== 'string' || !unit.typeId.trim()
        || !Number.isFinite(unit.q) || !Number.isFinite(unit.r))) {
      errors.push('units must contain string IDs/typeIds, safe-integer owners, and finite q/r coordinates');
    }
    if (new Set(proof.units.map((unit) => unit?.id)).size !== proof.units.length) errors.push('unit IDs must be unique');
  }
  errors.push(...validateSerializedMapSnapshot(proof.mapSnapshot, Number.isSafeInteger(proof.seed) ? proof.seed : undefined));
  if (typeof proof.mapHash !== 'string' || !/^[0-9a-f]{64}$/.test(proof.mapHash)) errors.push('mapSnapshot hash must be a SHA-256 digest');
  if (errors.length) return { status: 'FAIL', errors };
  return { status: 'PASS', proof };
}

function compareProductionSaveProofToSnapshot(proof, snapshot, expectedSeed) {
  const validation = validateProductionSaveProof(proof, expectedSeed);
  if (validation.status !== 'PASS') return validation;
  if (!snapshot || !snapshot.seats || !Number.isSafeInteger(snapshot.turn)
      || !Array.isArray(snapshot.seats.humanOwnerIds) || !Number.isSafeInteger(snapshot.seats.activeHumanOwnerId)
      || !Array.isArray(snapshot.cities) || !Array.isArray(snapshot.units)) {
    return { status: 'BLOCKED', reason: 'Live pre-save canonical snapshot lacks required save-core fields' };
  }
  if (!Number.isSafeInteger(expectedSeed)) return { status: 'BLOCKED', reason: 'Configured legal seed is unavailable for production save comparison' };
  if (snapshot.seats.humanOwnerIds.length === 0
      || snapshot.seats.humanOwnerIds.some((owner) => !Number.isSafeInteger(owner) || owner < 0)
      || new Set(snapshot.seats.humanOwnerIds).size !== snapshot.seats.humanOwnerIds.length
      || !snapshot.seats.humanOwnerIds.includes(snapshot.seats.activeHumanOwnerId)) {
    return { status: 'BLOCKED', reason: 'Live pre-save canonical human-owner seats are invalid or incomplete' };
  }
  const malformedCityIndex = snapshot.cities.findIndex((city) => city === null || typeof city !== 'object' || Array.isArray(city));
  if (malformedCityIndex !== -1) {
    return { status: 'BLOCKED', reason: `Live pre-save canonical city row ${malformedCityIndex} is not an object` };
  }
  const malformedUnitIndex = snapshot.units.findIndex((unit) => unit === null || typeof unit !== 'object' || Array.isArray(unit));
  if (malformedUnitIndex !== -1) {
    return { status: 'BLOCKED', reason: `Live pre-save canonical unit row ${malformedUnitIndex} is not an object` };
  }
  const expectedCities = snapshot.cities.map(({ id, ownerId, q, r }) => ({ id, ownerId, q, r })).sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const expectedUnits = snapshot.units.map(({ id, ownerId, typeId, q, r }) => ({ id, ownerId, typeId, q, r })).sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const actualCities = Array.isArray(proof.cities) ? proof.cities.slice().sort((a, b) => String(a?.id).localeCompare(String(b?.id))) : proof.cities;
  const actualUnits = Array.isArray(proof.units) ? proof.units.slice().sort((a, b) => String(a?.id).localeCompare(String(b?.id))) : proof.units;
  if (expectedCities.some((city) => typeof city.id !== 'string' || !city.id.trim() || !Number.isSafeInteger(city.ownerId) || !Number.isFinite(city.q) || !Number.isFinite(city.r))
      || expectedUnits.some((unit) => typeof unit.id !== 'string' || !unit.id.trim() || !Number.isSafeInteger(unit.ownerId) || typeof unit.typeId !== 'string' || !unit.typeId.trim() || !Number.isFinite(unit.q) || !Number.isFinite(unit.r))) {
    return { status: 'BLOCKED', reason: 'Live pre-save canonical city/unit rows lack required typed fields' };
  }
  const expected = {
    turn: snapshot.turn,
    seed: expectedSeed,
    humanOwnerIds: snapshot.seats.humanOwnerIds,
    activeHumanOwnerId: snapshot.seats.activeHumanOwnerId,
    cities: expectedCities,
    units: expectedUnits,
  };
  const fields = ['turn', 'seed', 'humanOwnerIds', 'activeHumanOwnerId', 'cities', 'units'];
  const comparableProof = { ...proof, cities: actualCities, units: actualUnits };
  const mismatches = fields.filter((key) => JSON.stringify(comparableProof[key]) !== JSON.stringify(expected[key]));
  if (mismatches.length) return { status: 'FAIL', errors: mismatches.map((key) => `saved ${key} differs from live pre-save snapshot`) };
  return { status: 'PASS', proof, comparedFields: fields };
}

async function findExactProductionSaveSlot(loadDialog, expectedLabel) {
  if (typeof expectedLabel !== 'string' || !expectedLabel.trim()) return { status: 'BLOCKED', reason: 'Expected save label is empty' };
  const candidates = loadDialog.locator('.civ-sl-row[data-slot]').filter({ hasText: expectedLabel });
  const count = await withRuntimeDeadline(() => candidates.count(), 'exact-save-slot-row-count');
  if (count !== 1) return { status: 'BLOCKED', reason: `Expected one saved slot row matching ${expectedLabel}, found ${count}` };
  const title = candidates.locator('.civ-sl-row-title');
  const titleCount = await withRuntimeDeadline(() => title.count(), 'exact-save-slot-title-count');
  if (titleCount !== 1) return { status: 'BLOCKED', reason: `Expected one slot title for ${expectedLabel}, found ${titleCount}` };
  const actualLabel = (await withRuntimeDeadline(() => title.textContent(), 'read-exact-save-slot-title'))?.trim() ?? '';
  const slotId = await withRuntimeDeadline(() => candidates.getAttribute('data-slot'), 'read-exact-save-slot-id');
  if (actualLabel !== expectedLabel) return { status: 'BLOCKED', reason: 'Filtered save row title was not an exact label match', actualLabel };
  if (typeof slotId !== 'string' || !slotId.trim() || slotId.startsWith('fsa:')) return { status: 'BLOCKED', reason: 'Exact production save row has no local production slot ID' };
  return { status: 'PASS', row: candidates, slotId, label: actualLabel };
}

async function readProductionSaveProof(page, slotId, expectedSeed) {
  checkRuntimeBudget();
  if (typeof slotId !== 'string' || !slotId.trim()) return { status: 'BLOCKED', reason: 'Selected save row has no slot ID' };
  let raw;
  try {
    raw = await withRuntimeDeadline(() => page.evaluate(async (id) => {
      if (!indexedDB.databases) return null;
      const dbs = await indexedDB.databases();
      if (!dbs.some((db) => db.name === 'thegame-saves')) return null;
      const db = await new Promise((resolve, reject) => {
        const req = indexedDB.open('thegame-saves');
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(new Error('IDB open failed'));
      });
      try {
        if (!db.objectStoreNames.contains('kv')) return null;
        const rawSave = await new Promise((resolve, reject) => {
          const tx = db.transaction('kv', 'readonly');
          const req = tx.objectStore('kv').get(`thegame.save.${id}`);
          req.onsuccess = () => resolve(req.result ?? null);
          req.onerror = () => reject(new Error('IDB read failed'));
        });
        return typeof rawSave === 'string' ? rawSave : null;
      } finally { db.close(); }
    }, slotId), 'read-production-save-proof');
  } catch (error) {
    return { status: 'BLOCKED', reason: `Production save payload read failed: ${boundedDiagnosticText(error?.message || error, 256)}` };
  }
  if (typeof raw !== 'string') return { status: 'BLOCKED', reason: 'No production save payload was readable for the selected slot' };
  let save;
  try { save = JSON.parse(raw); }
  catch { return { status: 'FAIL', reason: 'Production save payload is not valid JSON' }; }
  if (!save || typeof save !== 'object' || Array.isArray(save)) return { status: 'FAIL', reason: 'Production save payload root must be an object' };
  let mapSnapshot = null;
  let mapHash = null;
  if (save.mapSnapshot != null) {
    try {
      const mapSnapshotJson = JSON.stringify(save.mapSnapshot);
      mapSnapshot = JSON.parse(mapSnapshotJson);
      mapHash = crypto.createHash('sha256').update(mapSnapshotJson).digest('hex');
    } catch {
      return { status: 'FAIL', reason: 'Production mapSnapshot payload is not valid JSON' };
    }
  }
  const proof = {
    seed: save.seed ?? null,
    turn: save.tura ?? null,
    humanOwnerIds: save.humanOwnerIds ?? null,
    activeHumanOwnerId: save.activeHumanOwnerId ?? null,
    cities: Array.isArray(save.cities) ? save.cities.map((city) => ({ id: city?.id, ownerId: city?.ownerId, q: city?.q, r: city?.r })) : save.cities ?? null,
    units: Array.isArray(save.units) ? save.units.map((unit) => ({ id: unit?.id, ownerId: unit?.ownerId, typeId: unit?.typeId, q: unit?.q, r: unit?.r })) : save.units ?? null,
    mapSnapshot,
    mapHash,
  };
  return validateProductionSaveProof(proof, expectedSeed);
}

async function runUiFlow(page, args, cfg, checks) {
  setPhase('setup-and-first-founding');
  const startButton = await waitForMainMenuStart(page, cfg.timeout);
  await captureScreenshot(page, 'main-menu');
  await clickUnique(startButton, 'main menu Start game');
  await clickUnique(page.locator('.cta-hero'), '.cta-hero');
  await waitFor(page.locator('.epoch-grid .ec'), 'epoch picker', cfg.timeout);
  await clickCardByText(page, '.epoch-grid .ec', cfg.epochName, 'epoch', { labelSelector: '.en' });
  await clickUnique(page.locator('.nav .next'), 'continue from epoch selection');
  await waitFor(page.locator('.civ-grid .card'), 'civilization picker', cfg.timeout);
  await clickCardByText(page, '.civ-grid .card', cfg.human1Name, 'human seat 1');
  await clickUnique(page.locator('.nav .next'), 'continue from human 1 civilization selection');

  // Seed is a legal input only after the ordinary wizard reaches Settings.
  const seedInput = page.locator(args['seed-selector'] || '#ng-seed');
  await waitFor(seedInput, 'legal seed input in game settings', cfg.timeout);
  if (await withRuntimeDeadline(() => seedInput.count(), 'seed-input-count') !== 1 || !(await visible(seedInput))) {
    checks['legal-seed-input'] = result('BLOCKED', 'Settings step did not expose one visible legal seed input; game start not attempted');
    for (const key of ['new-game-ui', 'seat-owners', 'ai-civ-readback', 'human-city-founding', 'world-turn', 'save-slot-ui', 'load-slot-ui', 'seed-readback', 'saved-state-readback']) {
      checks[key] = result('NOT RUN', 'Stopped before game start because legal seed input was unavailable');
    }
    return;
  }
  await withRuntimeDeadline(() => seedInput.fill(String(cfg.seed), { timeout: ordinaryActionTimeoutMs() }), 'fill-seed-input', ordinaryActionTimeoutMs());
  if (Number(await withRuntimeDeadline(() => seedInput.inputValue(), 'verify-seed-input')) !== cfg.seed) throw new Error('Seed input did not preserve configured expected value');
  checks['legal-seed-input'] = result('PASS', 'Configured expected seed entered through the visible Settings UI field');
  const settingsSummary = await observeWizardSettingsSummary(page, cfg.seed);
  checks['wizard-ui-settings-summary'] = result(settingsSummary.verified ? 'OBSERVED' : 'NOT VERIFIED', settingsSummary);
  await captureScreenshot(page, 'new-game-settings');

  await waitFor(page.locator('.ai-civ-grid .card'), 'AI civilization picker', cfg.timeout);
  await clickCardByText(page, '.ai-civ-grid .card', cfg.aiName, 'AI seat', { rejectDisabled: true, requireSelected: true });
  await clickUnique(page.locator('.seat2-toggle-btn'), '.seat2-toggle-btn');
  await clickUnique(page.locator('.sett-actions .start'), 'continue to second human seat');
  await waitFor(page.locator('.seat2-dist-opt'), 'second human distance choices', cfg.timeout);
  await clickCardByText(page, '.civ-grid .card', cfg.human2Name, 'human seat 2');
  await clickUnique(page.locator('.seat2-dist-opt.sel'), 'selected second-human distance choice');
  const selectedDistance = await observeSelectedSeat2Distance(page);
  const previousWizardObservation = checks['wizard-ui-settings-summary']?.detail;
  checks['wizard-ui-settings-summary'] = result(previousWizardObservation?.verified ? 'OBSERVED' : 'NOT VERIFIED', { ...(typeof previousWizardObservation === 'object' ? previousWizardObservation : {}), selectedSeat2Distance: selectedDistance });
  const seat2Seed = page.locator('#ng-seed');
  await waitFor(seat2Seed, 'seed confirmation in second-seat step', cfg.timeout);
  if (Number(await withRuntimeDeadline(() => seat2Seed.inputValue(), 'verify-second-seat-seed')) !== cfg.seed) throw new Error('Second-seat UI did not preserve configured seed');
  const generationObservation = startMapLoadObservation(page, MAX_NEW_GAME_MAP_LOAD_WAIT_MS);
  generationObservation.catch(() => {}); // attach a rejection handler before the UI trigger
  await clickUnique(page.locator('.sett-actions .start'), 'start game');
  const generationLifecycle = await awaitLifecycleObservation(generationObservation, 'wait-for-new-game-map-load-lifecycle', MAX_NEW_GAME_MAP_LOAD_WAIT_MS);
  if (!generationLifecycle.ok) {
    checks['world-generation-readiness'] = result('BLOCKED', { ...generationLifecycle, retryClicked: false });
    checks['new-game-ui'] = result('BLOCKED', 'World generation overlay did not complete its observed show→hide lifecycle');
    checks['seat-owners'] = result('BLOCKED', 'Settled world was not ready for owner readback');
    checks['ai-civ-readback'] = result('BLOCKED', 'Settled world was not ready for AI identity readback');
    return;
  }
  await withRuntimeDeadline(() => page.waitForFunction(() => !!window.__hotSeatTestDebug?.snapshotRuntimeObservabilityForTest
    && !!window.__cityStateStartUnitsTestDebug?.dumpState, null, { timeout: Math.min(cfg.timeout, remainingRuntimeMs()) }), 'wait-for-readonly-hooks-after-map-load');
  const beforeRaw = await readSnapshot(page);
  const before = canonicalSnapshot(beforeRaw);
  const settledWorld = validateSettledWorld(before, args, generationLifecycle, { requireAi: false });
  if (!settledWorld.ok) {
    checks['world-generation-readiness'] = result(settledWorld.status, { ...settledWorld, overlayLifecycle: generationLifecycle });
    checks['new-game-ui'] = result('BLOCKED', 'Ordinary wizard was submitted but settled-world roster/identity/start-hex checks failed');
    checks['seat-owners'] = result(settledWorld.reasonType === 'ai' ? 'PASS' : settledWorld.status, settledWorld);
    checks['ai-civ-readback'] = result('BLOCKED', 'Major-AI roster readback was not reached after the initial human-world readiness check');
    checks['mp-ai'] = result('BLOCKED', 'AI owner mapping is not available for attribution');
    checks['g11-ai'] = result('BLOCKED', 'AI owner mapping is not available for attribution');
    return;
  }
  checks['world-generation-readiness'] = result('PASS', { overlayLifecycle: generationLifecycle, settledWorld });
  checks['new-game-ui'] = result('PASS', 'Configured seats and seed submitted; map-load overlay and settled human owners/start hexes were verified; major-AI roster awaits first legal human city founding');
  checks['seat-owners'] = result('PASS', 'Settled-world readback contains the configured human owners, civilization mapping, and finite start hexes');
  checks['ai-civ-readback'] = result('NOT RUN', 'Major-AI roster remains pending until ordinary first-city founding spawns foreign clusters');
  checks['mp-ai'] = result('NOT RUN', 'AI owner MP observation follows verified first-city founding and roster attribution');
  checks['g11-ai'] = result('NOT RUN', 'AI owner G11 observation follows verified first-city founding and roster attribution');
  await captureScreenshot(page, 'post-start-world');
  const seedRead = before.seed;
  if (seedRead === null) checks['seed-readback'] = result('BLOCKED', 'Read-only state hook does not expose the runtime seed');
  else if (Number(seedRead) !== cfg.seed) checks['seed-readback'] = result('FAIL', 'Runtime seed differs from configured expected seed');
  else checks['seed-readback'] = result('PASS', 'Runtime seed matched configured expected seed');
  const expectedHumans = before.seats.humanOwnerIds;
  if (!Array.isArray(expectedHumans) || expectedHumans.length !== 2 || before.seats.civIdByOwner == null) {
    checks['seat-owners'] = result('BLOCKED', 'Read-only seat snapshot does not expose exactly two human owners and civilization mapping');
    for (const key of ['human-city-founding', 'mp-human1', 'mp-human2', 'g11-human1', 'g11-human2', 'world-turn', 'save-slot-ui', 'load-slot-ui', 'saved-state-readback']) checks[key] = result('BLOCKED', 'Required human-seat readback is unavailable');
    return;
  }
  const identityHumanMap = Object.fromEntries((before.ownerIdentities?.humanOwners ?? []).map((row) => [row.ownerId, row.civKey]));
  const mappedHumanCivs = expectedHumans.map((owner) => identityHumanMap[owner]);
  if (!before.ownerIdentities || mappedHumanCivs.some((id) => !id)) {
    checks['seat-owners'] = result('BLOCKED', 'Read-only owner-to-civilization readback is incomplete');
    for (const key of ['human-city-founding', 'mp-human1', 'mp-human2', 'g11-human1', 'g11-human2', 'world-turn', 'save-slot-ui', 'load-slot-ui', 'saved-state-readback']) checks[key] = result('BLOCKED', 'Required owner mapping is unavailable');
    return;
  }
  if (JSON.stringify(mappedHumanCivs) !== JSON.stringify([args['human1-civ'], args['human2-civ']])) {
    checks['seat-owners'] = result('FAIL', 'Human owner-to-civilization mapping differs from configured order');
    for (const key of ['human-city-founding', 'mp-human1', 'mp-human2', 'g11-human1', 'g11-human2', 'world-turn', 'save-slot-ui', 'load-slot-ui', 'saved-state-readback']) checks[key] = result('BLOCKED', 'Fixture owner mapping failed');
    return;
  }
  if (expectedHumans.some((owner) => before.civTypes[owner] !== before.seats.civIdByOwner[owner]
      || identityHumanMap[owner] !== before.seats.civIdByOwner[owner])) {
    checks['seat-owners'] = result('FAIL', 'Owner civ-type readback differs from seat civ mapping');
    for (const key of ['human-city-founding', 'mp-human1', 'mp-human2', 'g11-human1', 'g11-human2', 'world-turn', 'save-slot-ui', 'load-slot-ui', 'saved-state-readback']) checks[key] = result('BLOCKED', 'Fixture owner mapping failed');
    return;
  }
  checks['seat-owners'] = result('PASS', 'Read-only seat snapshot contains two human owners and civilization mapping');
  const human1Founding = await foundCityThroughMapUi(page, expectedHumans[0], cfg.timeout);
  recordFirstHumanFoundingProof(checks, human1Founding, expectedHumans[0]);
  if (human1Founding.status !== 'PASS') {
    checks['human-city-founding'] = human1Founding;
    for (const key of ['mp-human1', 'mp-human2', 'g11-human1', 'g11-human2', 'world-turn', 'save-slot-ui', 'load-slot-ui', 'saved-state-readback']) checks[key] = result('BLOCKED', 'Stopped because a legal human start-city click was not verified');
    checks['ai-civ-readback'] = result('BLOCKED', 'No actual post-founding major-AI roster is available because legal first-city founding was not verified');
    checks['mp-ai'] = result('BLOCKED', 'AI owner mapping is not available for attribution');
    checks['g11-ai'] = result('BLOCKED', 'AI owner mapping is not available for attribution');
    return;
  }
  const postFoundingAi = await readAiRosterAfterFirstFounding(page, args, generationLifecycle, human1Founding);
  if (!postFoundingAi.readiness.ok) {
    checks['ai-civ-readback'] = result('BLOCKED', postFoundingAi.readiness);
    checks['mp-ai'] = result('BLOCKED', 'AI owner mapping is not available for attribution');
    checks['g11-ai'] = result('BLOCKED', 'AI owner mapping is not available for attribution');
    checks['world-turn'] = result('BLOCKED', 'Stopped before any next-turn action because post-founding AI roster validation failed');
    return;
  }
  const aiOwnerId = Number(postFoundingAi.readiness.ai.ownerId);
  checks['ai-civ-readback'] = result('PASS', { ownerId: aiOwnerId, civKey: postFoundingAi.readiness.ai.civKey, source: 'read-only major-AI roster hook after first legal human city founding' });
  const aiChecks = ownerObservationChecks(await readOwnerObservability(page, aiOwnerId), aiOwnerId, 'AI owner', args['ai-civ']);
  checks['mp-ai'] = aiChecks.mp;
  checks['g11-ai'] = aiChecks.g11;
  checks['human-city-founding'] = result('NOT RUN', 'Human 2 founding follows the first legal seat submission');
  await captureScreenshot(page, 'human-1-founded');
  setPhase('turn-and-owner-observations');
  const initialTurn = Number(before.turn);
  if (!Number.isSafeInteger(initialTurn)) throw new Error('Engine world-turn counter is not an integer');
  const endTurn = page.locator('.civ-bottom-bar button[data-end]');
  let human1BeforeTurn;
  try { human1BeforeTurn = await collectActiveHumanUi(page, cfg, expectedHumans[0], args['human1-civ'], 'pre-turn'); }
  catch (err) { human1BeforeTurn = { mp: result('BLOCKED', `Human 1 MP UI read failed: ${err.message}`), mpPartial: result('NOT OBSERVED', err.message), g11: g11Unavailable(args['human1-civ'], expectedHumans[0], 'Human 1 Zulu recruitment UI read failed') }; }
  checks['mp-human1'] = human1BeforeTurn.mp;
  checks['mp-human1-partial-ui'] = human1BeforeTurn.mpPartial;
  checks['g11-human1'] = human1BeforeTurn.g11;
  if (!ordinaryUiCleanupAllowsNextAction(human1BeforeTurn)) {
    checks['world-turn'] = result('BLOCKED', 'Stopped before the next ordinary action because city panel/list cleanup failed');
    for (const key of ['human-city-founding', 'save-slot-ui', 'load-slot-ui', 'saved-state-readback']) {
      if (checks[key].status === 'NOT RUN') checks[key] = result('BLOCKED', 'Stopped after city UI cleanup failure');
    }
    return;
  }
  await clickUnique(endTurn, 'human 1 end-turn button');
  let humanSubmissions = 1;
  await withRuntimeDeadline(() => page.waitForFunction((expectedOwner) => {
    const h = window.__hotSeatTestDebug?.snapshotHumanSeatsForTest?.();
    return h?.activeHumanOwnerId === expectedOwner;
  }, expectedHumans[1], { timeout: Math.min(cfg.timeout, remainingRuntimeMs()) }), 'wait-hotseat-human2');
  const afterSeat1 = canonicalSnapshot(await readSnapshot(page));
  if (Number(afterSeat1.turn) !== initialTurn) throw new Error('First hot-seat submission unexpectedly advanced world turn');
  const human2Founding = await foundCityThroughMapUi(page, expectedHumans[1], cfg.timeout);
  if (human2Founding.status !== 'PASS') {
    checks['human-city-founding'] = result('BLOCKED', `Human 1 founded legally; human 2: ${human2Founding.detail}`);
    checks['world-turn'] = result('BLOCKED', 'Stopped before human 2 submission because seat 2 founding was not verified');
    for (const key of ['mp-human2', 'g11-human2', 'save-slot-ui', 'load-slot-ui', 'saved-state-readback']) checks[key] = result('BLOCKED', 'Stopped before completion of both legal human seat submissions');
    return;
  }
  if (checks['human1-founding-proof']?.status !== 'PASS') {
    checks['human-city-founding'] = result('BLOCKED', {
      reason: 'Human 1 helper did not yield a complete separately recorded founding proof; dual-human founding is not accepted',
      human1Proof: checks['human1-founding-proof']?.detail ?? null,
      human2: human2Founding.detail,
    });
  } else checks['human-city-founding'] = result('PASS', { human1: human1Founding.detail, human2: human2Founding.detail });
  await captureScreenshot(page, 'both-humans-founded');
  let human2BeforeTurn;
  try {
    human2BeforeTurn = await collectActiveHumanUi(page, cfg, expectedHumans[1], args['human2-civ'], 'pre-turn');
    checks['mp-human2'] = human2BeforeTurn.mp;
    checks['mp-human2-partial-ui'] = human2BeforeTurn.mpPartial;
    checks['g11-human2'] = human2BeforeTurn.g11;
  } catch (err) {
    human2BeforeTurn = { cleanup: { ok: false } };
    checks['mp-human2'] = result('BLOCKED', `Human 2 MP UI read failed: ${err.message}`);
    checks['mp-human2-partial-ui'] = result('NOT OBSERVED', err.message);
    checks['g11-human2'] = g11Unavailable(args['human2-civ'], expectedHumans[1], `Human 2 Zulu recruitment UI read failed: ${err.message}`);
  }
  if (!ordinaryUiCleanupAllowsNextAction(human2BeforeTurn)) {
    checks['world-turn'] = result('BLOCKED', 'Stopped before the next ordinary action because city panel/list cleanup failed');
    for (const key of ['save-slot-ui', 'load-slot-ui', 'saved-state-readback']) checks[key] = result('BLOCKED', 'Stopped after city UI cleanup failure');
    return;
  }
  const turnTransitionObservation = startTurnTransitionObservation(page);
  turnTransitionObservation.catch(() => {}); // attach before the second-human end-turn action
  await clickUnique(endTurn, 'human 2 end-turn button');
  humanSubmissions += 1;
  await withRuntimeDeadline(() => page.waitForFunction((expectedOwner) => {
    const h = window.__hotSeatTestDebug?.snapshotHumanSeatsForTest?.();
    return h?.activeHumanOwnerId === expectedOwner;
  }, expectedHumans[0], { timeout: Math.min(cfg.timeout, remainingRuntimeMs()) }), 'wait-hotseat-human1');
  const transitionLifecycle = await awaitLifecycleObservation(turnTransitionObservation, 'wait-for-turn-transition-show-hide');
  if (!transitionLifecycle.ok) throw new Error(`End-turn transition lifecycle was not observed: ${transitionLifecycle.reason || 'unknown transition state'}`);
  await withRuntimeDeadline(() => page.waitForFunction((expected) => {
    const activeOwner = window.__hotSeatTestDebug?.snapshotHumanSeatsForTest?.()?.activeHumanOwnerId;
    const state = window.__cityStateStartUnitsTestDebug?.dumpState?.();
    return activeOwner === expected.ownerId && Number(state?.turn) === expected.turn;
  }, { ownerId: expectedHumans[0], turn: initialTurn + 1 }, { timeout: Math.min(cfg.timeout, remainingRuntimeMs()) }), 'wait-for-transition-owner-and-world-turn');
  const afterBothSeats = canonicalSnapshot(await readSnapshot(page));
  assertOneWorldTurn(initialTurn, Number(afterSeat1.turn), Number(afterBothSeats.turn), humanSubmissions);
  checks['world-turn'] = result('PASS', 'Exactly one legal UI end-turn submission per human advanced the engine world-turn counter by one');
  setPhase('save-load');
  await captureScreenshot(page, 'post-world-turn');
  try {
    const human1After = await collectActiveHumanUi(page, cfg, expectedHumans[0], args['human1-civ'], 'post-turn');
    checks['mp-human1'] = human1After.mp;
    checks['mp-human1-partial-ui'] = human1After.mpPartial;
    checks['g11-human1'] = human1After.g11;
  } catch (err) {
    checks['mp-human1'] = result('BLOCKED', `Human 1 post-turn UI read failed: ${err.message}`);
    checks['mp-human1-partial-ui'] = result('NOT OBSERVED', err.message);
    checks['g11-human1'] = g11Unavailable(args['human1-civ'], expectedHumans[0], 'Human 1 Zulu post-turn recruitment UI read failed');
  }
  if (checks['mp-human1']?.detail?.cleanup?.status === 'FAILED') {
    checks['save-slot-ui'] = result('BLOCKED', 'Stopped before pause-menu actions because city panel/list cleanup failed');
    checks['load-slot-ui'] = result('BLOCKED', 'Stopped before pause-menu actions because city panel/list cleanup failed');
    checks['saved-state-readback'] = result('BLOCKED', 'Stopped before pause-menu actions because city panel/list cleanup failed');
    return;
  }

  const preSaveSnapshot = canonicalSnapshot(await readSnapshot(page));
  const slotName = `PR141-${Date.now()}-${process.pid}`;
  await openPauseAction(page, 'save', cfg.timeout);
  const saveDialog = page.locator('.civ-sl[aria-label="Zapisz grę"]');
  await waitFor(saveDialog, 'save dialog', cfg.timeout);
  await withRuntimeDeadline(() => saveDialog.locator('#civ-sl-name').fill(slotName, { timeout: ordinaryActionTimeoutMs() }), 'fill-save-slot-name', ordinaryActionTimeoutMs());
  await clickUnique(saveDialog.getByRole('button', { name: 'Zapisz', exact: true }), 'save slot');
  await withRuntimeDeadline(() => saveDialog.waitFor({ state: 'hidden', timeout: Math.min(cfg.timeout, remainingRuntimeMs()) }), 'wait-save-dialog-close');

  await openPauseAction(page, 'load', cfg.timeout);
  const loadDialog = page.locator('.civ-sl[aria-label="Wczytaj grę"]');
  await waitFor(loadDialog, 'load dialog', cfg.timeout);
  const exactInitialSlot = await findExactProductionSaveSlot(loadDialog, slotName);
  if (exactInitialSlot.status !== 'PASS') {
    const detail = { reason: exactInitialSlot.reason, label: slotName };
    checks['save-slot-ui'] = result('BLOCKED', detail);
    checks['seed-readback'] = result('BLOCKED', 'No unique exact-label production save row was verified');
    checks['saved-core-readback'] = result('BLOCKED', 'No selected production save payload was available for strict validation');
    checks['serialized-mapSnapshot-identity'] = result('BLOCKED', 'No selected production save payload was available for mapSnapshot validation');
    checks['load-slot-ui'] = result('BLOCKED', 'Load was not attempted because the saved row was not uniquely identified');
    checks['saved-state-readback'] = result('BLOCKED', 'Stopped because the saved slot was not uniquely identified');
    return;
  }
  const initialSaveRead = await readProductionSaveProof(page, exactInitialSlot.slotId, cfg.seed);
  const initialSaveProof = initialSaveRead.status === 'PASS' ? initialSaveRead.proof : null;
  const initialSaveComparison = initialSaveProof
    ? compareProductionSaveProofToSnapshot(initialSaveProof, preSaveSnapshot, cfg.seed)
    : initialSaveRead;
  if (initialSaveComparison.status !== 'PASS') {
    const message = initialSaveComparison.errors ?? initialSaveComparison.reason ?? 'Production save proof did not validate';
    const failStatus = initialSaveComparison.status === 'FAIL' ? 'FAIL' : 'BLOCKED';
    checks['save-slot-ui'] = result(failStatus, { label: exactInitialSlot.label, slotId: exactInitialSlot.slotId, proof: message });
    checks['seed-readback'] = result(failStatus, { reason: 'Seed/save payload validation did not pass', proof: message });
    checks['saved-core-readback'] = result(failStatus, { reason: 'Initial production payload did not match the live pre-save canonical snapshot', proof: message });
    checks['serialized-mapSnapshot-identity'] = result(failStatus, { reason: 'Initial mapSnapshot proof did not pass strict validation', proof: message });
    checks['load-slot-ui'] = result('BLOCKED', 'Load was not attempted because the selected production payload failed validation');
    checks['saved-state-readback'] = result('BLOCKED', 'Stopped because the selected production payload failed validation');
    return;
  }
  checks['save-slot-ui'] = result('PASS', {
    label: exactInitialSlot.label, slotId: exactInitialSlot.slotId,
    evidence: 'exact production slot row and valid actual IndexedDB payload matched the live pre-save core',
  });
  checks['seed-readback'] = result('PASS', 'Strict production payload seed and mapSnapshot seed matched the configured legal seed');
  checks['saved-core-readback'] = result('PASS', { evidence: 'Initial production payload turn, owner seats, cities, and units matched the live pre-save canonical snapshot' });
  await clickUnique(exactInitialSlot.row, 'saved slot row');
  const productionLoadObservation = startMapLoadObservation(page);
  productionLoadObservation.catch(() => {}); // attach before the production load action
  await clickUnique(loadDialog.getByRole('button', { name: 'Wczytaj', exact: true }), 'load saved slot');
  await withRuntimeDeadline(() => loadDialog.waitFor({ state: 'hidden', timeout: Math.min(cfg.timeout, remainingRuntimeMs()) }), 'wait-load-dialog-close');
  const productionLoadLifecycle = await awaitLifecycleObservation(productionLoadObservation, 'wait-for-production-load-lifecycle');
  if (!productionLoadLifecycle.ok) {
    checks['load-slot-ui'] = result('BLOCKED', { ...productionLoadLifecycle, retryClicked: false });
    checks['saved-core-readback'] = result('BLOCKED', 'Post-load comparison stopped because production map-load overlay did not complete show→hide');
    checks['saved-state-readback'] = result('BLOCKED', 'Post-load readback stopped because production map-load overlay did not complete show→hide');
    return;
  }
  const loaded = canonicalSnapshot(await readSnapshot(page));
  const loadedReadyWorld = validateSettledWorld(loaded, args, productionLoadLifecycle, { requireStartHex: false });
  if (!loadedReadyWorld.ok) {
    checks['load-slot-ui'] = result('BLOCKED', { reason: 'Post-load settled-world identity checks failed', detail: loadedReadyWorld, overlayLifecycle: productionLoadLifecycle });
    checks['saved-core-readback'] = result('BLOCKED', 'Post-load state was not read because settled-world identity checks failed');
    return;
  }
  checks['load-slot-ui'] = result('PASS', { detail: 'Selected slot reloaded through the production load dialog; load overlay completed and settled-world identities were verified', settledWorld: loadedReadyWorld });
  await captureScreenshot(page, 'post-production-load');
  const equalFields = ['turn', 'seats', 'cities', 'units'];
  const mismatches = equalFields.filter((key) => JSON.stringify(loaded[key]) !== JSON.stringify(preSaveSnapshot[key]));
  if (mismatches.length) checks['saved-core-readback'] = result('FAIL', `Loaded runtime state differed in: ${mismatches.join(', ')}`);
  const postLoadHuman1 = await collectActiveHumanUi(page, cfg, expectedHumans[0], args['human1-civ'], 'post-load').catch((err) => ({
    mp: result('BLOCKED', `Post-load human 1 MP observation failed: ${err.message}`),
    g11: result('BLOCKED', 'Post-load human 1 recruitment observation failed'),
  }));
  if (checks['mp-human1'].status !== 'PASS' || postLoadHuman1.mp.status !== 'PASS') {
    checks['mp-human1'] = result('BLOCKED', 'Could not compare human 1 Manpower before/after saved-slot reload');
  } else if (JSON.stringify(checks['mp-human1'].detail) !== JSON.stringify(postLoadHuman1.mp.detail)) {
    checks['mp-human1'] = result('FAIL', 'Human 1 visible Manpower values changed after saved-slot reload');
  }
  if (args['human1-civ'] !== 'zulusi') {
    checks['g11-human1'] = g11Unavailable(args['human1-civ'], expectedHumans[0], '');
  } else if (checks['g11-human1'].status !== 'PASS' || postLoadHuman1.g11.status !== 'PASS') {
    checks['g11-human1'] = result('BLOCKED', 'Could not compare human 1 recruitment costs before/after saved-slot reload');
  } else if (JSON.stringify(checks['g11-human1'].detail) !== JSON.stringify(postLoadHuman1.g11.detail)) {
    checks['g11-human1'] = result('FAIL', 'Human 1 visible recruitment costs changed after saved-slot reload');
  }

  const recaptureLabel = `${slotName}-recapture`;
  await openPauseAction(page, 'save', cfg.timeout);
  const recaptureDialog = page.locator('.civ-sl[aria-label="Zapisz grę"]');
  await waitFor(recaptureDialog, 'post-load re-save dialog', cfg.timeout);
  await withRuntimeDeadline(() => recaptureDialog.locator('#civ-sl-name').fill(recaptureLabel, { timeout: ordinaryActionTimeoutMs() }), 'fill-recapture-slot-name', ordinaryActionTimeoutMs());
  await clickUnique(recaptureDialog.getByRole('button', { name: 'Zapisz', exact: true }), 'post-load state re-save');
  await withRuntimeDeadline(() => recaptureDialog.waitFor({ state: 'hidden', timeout: Math.min(cfg.timeout, remainingRuntimeMs()) }), 'wait-recapture-dialog-close');
  await openPauseAction(page, 'load', cfg.timeout);
  await waitFor(loadDialog, 'post-load re-save slot list', cfg.timeout);
  const exactRecaptureSlot = await findExactProductionSaveSlot(loadDialog, recaptureLabel);
  const recapturedRead = exactRecaptureSlot.status === 'PASS'
    ? await readProductionSaveProof(page, exactRecaptureSlot.slotId, cfg.seed)
    : { status: 'BLOCKED', reason: exactRecaptureSlot.reason };
  const recapturedProof = recapturedRead.status === 'PASS' ? recapturedRead.proof : null;
  const recapturedComparison = recapturedProof
    ? compareProductionSaveProofToSnapshot(recapturedProof, preSaveSnapshot, cfg.seed)
    : recapturedRead;
  if (initialSaveProof && recapturedProof && recapturedComparison.status === 'PASS') {
    const proofFields = ['seed', 'turn', 'humanOwnerIds', 'activeHumanOwnerId', 'cities', 'units'];
    const proofMismatches = proofFields.filter((key) => JSON.stringify(initialSaveProof[key]) !== JSON.stringify(recapturedProof[key]));
    const serializedMapChanged = initialSaveProof.mapHash !== recapturedProof.mapHash;
    if (proofMismatches.length || serializedMapChanged) {
      checks['serialized-mapSnapshot-identity'] = result('FAIL', `Production save payload changed after reload/re-save in: ${[...proofMismatches, ...(serializedMapChanged ? ['serialized mapSnapshot hash'] : [])].join(', ')}`);
    } else checks['serialized-mapSnapshot-identity'] = result('PASS', 'Serialized production mapSnapshot hash matched across save/load/re-save; this says nothing about independently rendered terrain');
    if (!proofMismatches.length && !mismatches.length) {
      checks['saved-core-readback'] = result('PASS', 'Loaded live state and production re-save matched the original seed, turn, owner seats, cities, and units');
    } else if (checks['saved-core-readback'].status !== 'FAIL') {
      checks['saved-core-readback'] = result('FAIL', 'Live or serialized saved state did not match after reload');
    }
    if (recapturedProof.seed === cfg.seed && initialSaveProof.seed === cfg.seed) checks['seed-readback'] = result('PASS', 'Initial and post-load production save blob seeds matched configured seed');
    else checks['seed-readback'] = result('FAIL', 'Initial/post-load production save blob seed mismatch');
  } else {
    const message = recapturedComparison.errors ?? recapturedComparison.reason ?? 'Post-load production save proof did not validate';
    const status = recapturedComparison.status === 'FAIL' ? 'FAIL' : 'BLOCKED';
    checks['serialized-mapSnapshot-identity'] = result(status, { reason: 'Initial/re-save payload comparison did not complete with valid proofs', proof: message });
    checks['seed-readback'] = result(status, { reason: 'Post-load production save proof did not validate', proof: message });
    if (checks['saved-core-readback'].status !== 'FAIL') checks['saved-core-readback'] = result(status, { reason: 'Could not complete strict post-load production payload comparison', proof: message });
  }
  checks['live-rendered-terrain-identity'] = result('DEFERRED', 'No independent live rendered-terrain observation is part of this ordinary-flow slice');
  checks['f05-battle'] = result('DEFERRED', 'F05 battle is outside this ordinary-flow slice; original full GOAL remains BLOCKED');
  checks['saved-state-readback'] = result('BLOCKED', 'Original full saved-state acceptance remains open; this slice reports saved-core and serialized snapshot evidence separately');
  checks['slice-save-load-readback'] = aggregateChecks(checks,
    ['save-slot-ui', 'load-slot-ui', 'seed-readback', 'serialized-mapSnapshot-identity', 'saved-core-readback'],
    'Ordinary-slice production save/load checks');
}

async function openPauseAction(page, action, timeout) {
  checkRuntimeBudget();
  const audience = await dismissFirstContactAudiences(page, timeout, `production-pause:${action}`);
  if (!audience.ok) throw new Error(`Could not safely dismiss first-contact audience before production pause action ${action}: ${audience.reason}`);
  await withRuntimeDeadline(() => page.keyboard.press('Escape'), `open-pause:${action}`, ordinaryActionTimeoutMs());
  await waitFor(page.locator('.civ-pause-btns'), 'game pause menu', timeout);
  const pause = page.locator(`.civ-pause-btns [data-act="${action}"]`);
  await waitFor(pause, `pause menu ${action} action`, timeout);
  await clickUnique(pause, `pause menu ${action} action`);
}

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
    if (args.preflight) {
      process.stdout.write(`${JSON.stringify(staticPreflight(args), null, 2)}\n`);
      return;
    }
  } catch (err) {
    process.stderr.write(`BLOCKED: ${err instanceof Error ? err.message : 'Invalid arguments'}\n`);
    process.exitCode = 2;
    return;
  }
  const report = {
    run: EXPECTED_TOPIC, generatedAt: new Date().toISOString(), executed: false,
    acceptance: 'PARTIAL_ORDINARY_FLOW_SLICE_ONLY; ORIGINAL_FULL_RUNTIME_GOAL_REMAINS_BLOCKED',
    checks: statusBook(),
  };
  let activePage = null;
  let pageDiagnosticRecords = null;
  try {
    if (!args.authorized) {
      process.stderr.write('BLOCKED: no browser/server/runtime module was loaded; use the read-only --preflight path or wait for explicit authorization.\n');
      process.exitCode = 2;
      return;
    }
    const auth = checkAuthorization(args);
    const preflight = assertRuntimePreflight(args);
    const cfg = requireConfig(args);
    prepareOutputDirectory(args);
    report.checks['runtime-authorization'] = result('PASS', { file: auth.file, sha256: auth.hash, scope: 'ordinary-flow-slice-excluding-f05-and-rendered-terrain' });
    report.checks['approved-snapshot'] = preflight.checks['approved-snapshot'];
    report.checks['read-only-preflight'] = result('PASS', 'Source anchors, local package/executable presence, and explicit protected-file manifest checked without launching browser');
    runtimeStartedAt = Date.now();
    setPhase('setup-and-first-founding');
    const { chromium } = require('playwright');
    const browser = await withRuntimeDeadline(() => chromium.launch({
      headless: true,
      executablePath: args['chromium-path'] || '/usr/bin/chromium',
      timeout: remainingRuntimeMs(),
    }), 'browser-launch');
    try {
      const page = await withRuntimeDeadline(() => browser.newPage(), 'new-browser-page');
      activePage = page;
      pageDiagnosticRecords = attachPageDiagnostics(page);
      page.setDefaultTimeout(Math.min(cfg.timeout, remainingRuntimeMs()));
      try {
        await withRuntimeDeadline(() => page.goto(args.url, { waitUntil: 'domcontentloaded', timeout: Math.min(cfg.timeout, remainingRuntimeMs()) }), 'local-app-navigation');
        report.executed = true;
        await withRuntimeDeadline(() => runUiFlow(page, args, cfg, report.checks), 'ordinary-flow-ui', MAX_TOTAL_MS);
        report.failureDiagnostics = await collectNormalReturnDiagnostics(activePage, pageDiagnosticRecords, report.checks, 2000, runtimeOutputDir);
      } catch (error) {
        try {
          report.failureDiagnostics = await collectFailureDiagnostics(activePage, pageDiagnosticRecords);
        } catch {
          report.failureDiagnostics = capFailureDiagnostics([], { captured: false, reason: 'Failure diagnostics unavailable' });
        }
        throw error;
      }
    } finally {
      await Promise.race([browser.close(), new Promise((resolve) => setTimeout(resolve, 5000))]);
    }
  } catch (err) {
    report.error = err instanceof Error ? err.message : 'Unknown harness error';
      for (const [key, item] of Object.entries(report.checks)) {
        if (item.status === 'NOT RUN') report.checks[key] = result('BLOCKED', 'Stopped after an earlier fail-closed error');
    }
    process.stderr.write(`BLOCKED: ${report.error}\n`);
    process.exitCode = 1;
  } finally {
    if (report.executed) {
      for (const [key, item] of Object.entries(report.checks)) {
        if (item.status === 'NOT RUN') report.checks[key] = result('BLOCKED', 'No supported observation or path was reached in this scenario');
      }
    }
    report.checks['g11-eligible-owner-and-neutral-controls'] = eligibleOwnerAndNeutralControls(report.checks);
    report.checks['g11-human-and-ai'] = result('BLOCKED', 'The original positive-human-and-AI G11 claim is unsupported: only Zulu has the approved Impi source field');
    report.checks['scenario-overall'] = aggregateChecks(report.checks, [
      'legal-seed-input', 'new-game-ui', 'seat-owners', 'ai-civ-readback', 'human-city-founding', 'world-turn',
      'save-slot-ui', 'load-slot-ui', 'seed-readback', 'serialized-mapSnapshot-identity', 'live-rendered-terrain-identity',
      'saved-core-readback', 'saved-state-readback', 'mp-human1', 'mp-human2', 'mp-ai', 'f05-battle',
      'g11-human1', 'g11-human2', 'g11-ai',
    ], 'Original full runtime acceptance checks');
    report.checks['original-full-runtime-goal'] = result('BLOCKED', 'Ordinary slice does not include live F05 battle or live rendered-terrain identity');
    report.checks['ordinary-slice-overall'] = aggregateChecks(report.checks, ORDINARY_REQUIRED_CHECKS, 'Narrowed ordinary-flow runtime slice');
    if (report.executed) process.exitCode = ordinaryExitCode(true, report.checks['ordinary-slice-overall']?.status, process.exitCode ?? 0);
    if (REPORT) writeReport(report);
  }
}

function aggregateChecks(checks, keys, label) {
  const statuses = keys.map((key) => checks[key]?.status ?? 'BLOCKED');
  if (statuses.includes('FAIL')) return result('FAIL', `${label}: at least one required check failed`);
  if (statuses.includes('BLOCKED') || statuses.includes('NOT RUN') || statuses.includes('DEFERRED') || statuses.includes('NOT VERIFIED')) return result('BLOCKED', `${label}: required observations remain blocked, deferred, or unrun`);
  if (statuses.every((status) => status === 'PASS')) return result('PASS', `${label}: every required check passed`);
  return result('BLOCKED', `${label}: incomplete status set`);
}
function shouldCaptureNormalDiagnostics(checks) {
  const projected = { ...checks, 'g11-eligible-owner-and-neutral-controls': eligibleOwnerAndNeutralControls(checks || {}) };
  const ordinary = aggregateChecks(projected, ORDINARY_REQUIRED_CHECKS, 'Narrowed ordinary-flow runtime slice');
  return ['BLOCKED', 'FAIL'].includes(ordinary.status);
}

// Export the real guard/status functions for the bounded static contract test.
// Importing this file has no side effects and does not load Playwright.
module.exports = { main, clickCardByText, observeWizardSettingsSummary, observeSelectedSeat2Distance, mapLoadLifecycleInPage, turnTransitionLifecycleInPage, readSnapshotInPage, validateSettledWorld, readAiRosterAfterFirstFounding, canonicalSnapshot, formatManpowerDisplay, sameDisplayedManpower, validateSerializedMapSnapshot, validateProductionSaveProof, compareProductionSaveProofToSnapshot, findExactProductionSaveSlot, readProductionSaveProof, recordFirstHumanFoundingProof, ordinaryExitCode, staticPreflight, checkAuthorization, assertSnapshot, snapshotEntryMatches, gitBytes, statusBook, aggregateChecks, ownerObservationChecks, eligibleOwnerAndNeutralControls, neutralRosterControl, ordinaryUiCleanupAllowsNextAction, requireConfig, prepareOutputDirectory, withRuntimeDeadline, budgetExceeded, remainingBudgetMs, ordinaryActionTimeoutMs, clampOrdinaryActionTimeout, makeScreenshotPath, assertOneWorldTurn, waitForMainMenuStart, clickUnique, collectActiveHumanUi, inspectFirstContactAudienceInPage, waitTwoAnimationFramesInPage, dismissFirstContactAudiences, foundingProbeInPage, foundingProofInPage, boundedFoundingProbe, foundCityThroughMapUi, attachPageDiagnostics, captureFailureUiState, collectFailureDiagnostics, collectNormalReturnDiagnostics, shouldCaptureNormalDiagnostics, capFailureDiagnostics, startMapLoadObservation, startTurnTransitionObservation, awaitLifecycleObservation, clampLifecycleTimeout, ORDINARY_REQUIRED_CHECKS, MAX_ORDINARY_ACTION_MS, MAX_NEW_GAME_MAP_LOAD_WAIT_MS, MAX_MAP_LOAD_WAIT_MS, MAX_PHASE_MS, MAX_TOTAL_MS };

if (require.main === module) {
  main();
}
