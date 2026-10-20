#!/usr/bin/env node
'use strict';

/*
 * PR141 runtime save/load harness. Implementation only; this file is not evidence
 * that a scenario ran. The default path is deliberately inert. A future operator
 * needs the separate owner runtime authorization as well as the explicit CLI flag.
 */

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '../..');
const OWN_RUN = path.join(ROOT, 'dyspozycje/autobot/runs/R-PR141-CODEX-RUNTIME-HARNESS-20261018');
const REPORT = path.join(OWN_RUN, 'runtime-report.json');
const PROTECTED_PREFIXES = ['gra/src/', 'gra/data/', 'gra/tools/'];
const RUNNER_RELATIVE = 'gra/tools/pr141-runtime-save-load-harness.cjs';

function parseArgs(argv) {
  const out = { authorized: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--authorize-runtime-after-run55') { out.authorized = true; continue; }
    if (!arg.startsWith('--') || i + 1 >= argv.length) throw new Error(`Invalid argument: ${arg}`);
    const key = arg.slice(2);
    if (!['url', 'seed', 'human1-civ', 'human2-civ', 'ai-civ', 'epoch', 'seed-selector', 'timeout-ms', 'approved-snapshot'].includes(key)) {
      throw new Error(`Unsupported option: --${key}`);
    }
    if (Object.hasOwn(out, key)) throw new Error(`Duplicate option: --${key}`);
    out[key] = argv[++i];
  }
  return out;
}

function git(args) {
  const result = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  if (result.status !== 0) throw new Error(`git ${args[0]} failed`);
  return result.stdout.trim();
}

function sha256(bytes) { return crypto.createHash('sha256').update(bytes).digest('hex'); }
function gitBytes(args) {
  const result = spawnSync('git', args, { cwd: ROOT, encoding: 'buffer', stdio: ['ignore', 'pipe', 'pipe'] });
  if (result.status !== 0) throw new Error(`Could not read protected Git object (${args[0]})`);
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
  if (git(['rev-parse', 'HEAD']) !== manifest.head) throw new Error('HEAD differs from the explicit approved snapshot');
  const expected = new Map();
  for (const entry of manifest.protectedFiles) {
    if (!entry || typeof entry.path !== 'string' || !isProtectedPath(entry.path)
        || entry.path.includes('..') || path.isAbsolute(entry.path) || !/^[0-9a-f]{64}$/.test(entry.sha256 || '')
        || !['tracked', 'untracked'].includes(entry.state) || expected.has(entry.path)) {
      throw new Error('Approved snapshot contains an invalid protected-file entry');
    }
    expected.set(entry.path, { sha256: entry.sha256, state: entry.state });
  }
  const listed = [...expected.keys()].sort();
  const tracked = git(['ls-files', '-z', '--', ...PROTECTED_PREFIXES]).split('\0').filter(Boolean).sort();
  const expectedTracked = [...expected].filter(([, row]) => row.state === 'tracked').map(([p]) => p).sort();
  if (JSON.stringify(tracked) !== JSON.stringify(expectedTracked)) {
    throw new Error('Protected tracked-file set differs from the explicit approved snapshot');
  }
  const untracked = git(['ls-files', '--others', '--exclude-standard', '-z', '--', ...PROTECTED_PREFIXES])
    .split('\0').filter(Boolean).filter((p) => p !== RUNNER_RELATIVE).sort();
  const expectedUntracked = [...expected].filter(([p, row]) => p !== RUNNER_RELATIVE && row.state === 'untracked').map(([p]) => p).sort();
  if (JSON.stringify(untracked) !== JSON.stringify(expectedUntracked)) {
    throw new Error('Protected untracked-file set differs from the explicit approved snapshot');
  }
  if (expected.has(RUNNER_RELATIVE)) throw new Error('Harness source is intentionally outside the product snapshot manifest');
  for (const relPath of listed) {
    const approved = expected.get(relPath);
    const workHash = sha256(fs.readFileSync(path.join(ROOT, relPath)));
    const trackedMatches = approved.state !== 'tracked'
      || (sha256(gitBytes(['show', `HEAD:${relPath}`])) === approved.sha256
        && sha256(gitBytes(['show', `:${relPath}`])) === approved.sha256);
    if (!trackedMatches || workHash !== approved.sha256) {
      throw new Error(`Protected source differs from the explicit approved snapshot: ${relPath}`);
    }
  }
}
function result(status, detail) { return { status, detail }; }
function writeReport(state) {
  fs.mkdirSync(OWN_RUN, { recursive: true });
  fs.writeFileSync(REPORT, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 });
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
  return {
    seed, timeout, epochName: epochNames[args.epoch],
    human1Name: civName(args['human1-civ']), human2Name: civName(args['human2-civ']), aiName: civName(args['ai-civ']),
  };
}

function statusBook() {
  return {
    'approved-snapshot': result('NOT RUN', 'Not checked'),
    'scenario-overall': result('NOT RUN', 'Not checked'),
    'legal-seed-input': result('NOT RUN', 'Not checked'),
    'new-game-ui': result('NOT RUN', 'Not checked'),
    'seat-owners': result('NOT RUN', 'Not checked'),
    'ai-civ-readback': result('NOT RUN', 'Not checked'),
    'human-city-founding': result('NOT RUN', 'Not checked'),
    'world-turn': result('NOT RUN', 'Not checked'),
    'save-slot-ui': result('NOT RUN', 'Not checked'),
    'load-slot-ui': result('NOT RUN', 'Not checked'),
    'seed-readback': result('NOT RUN', 'Not checked'),
    'same-map-identity': result('BLOCKED', 'Production save hash is serialized identity only; independent live terrain identity is unavailable'),
    'saved-core-readback': result('NOT RUN', 'Not checked'),
    'mp-human1': result('NOT RUN', 'Not checked through active human UI'),
    'mp-human2': result('NOT RUN', 'Not checked through active human UI'),
    'mp-ai': result('NOT RUN', 'Awaiting public read-only owner snapshot after AI mapping'),
    'f05-battle': result('BLOCKED', 'Requires an actual legal battle scene and observable movement/range values'),
    'g11-human1': result('NOT RUN', 'Not checked through active human recruitment UI'),
    'g11-human2': result('NOT RUN', 'Not checked through active human recruitment UI'),
    'g11-ai': result('NOT RUN', 'Awaiting public read-only owner snapshot after AI mapping'),
    'g11-human-and-ai': result('NOT RUN', 'Aggregate requires both human observations and the AI owner observation'),
    'saved-state-readback': result('NOT RUN', 'Not checked'),
  };
}

async function visible(locator) { return locator.count().then((n) => n > 0).catch(() => false); }
async function clickUnique(locator, label) {
  const n = await locator.count();
  if (n !== 1) throw new Error(`${label}: expected one matching UI control, found ${n}`);
  await locator.click();
}
async function clickCardByText(page, selector, text, label) {
  const cards = page.locator(selector);
  const indexes = await cards.evaluateAll((els, expected) => els.flatMap((el, index) => {
    const name = el.querySelector('.cn')?.textContent?.trim();
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    return isVisible && name === expected ? [index] : [];
  }), text);
  if (indexes.length !== 1) throw new Error(`${label}: expected one visible card with exact configured name, found ${indexes.length}`);
  await cards.nth(indexes[0]).click();
}
async function waitFor(locator, label, timeout) {
  try { await locator.first().waitFor({ state: 'visible', timeout }); }
  catch { throw new Error(`Timed out waiting for ${label}`); }
}
async function readSnapshot(page) {
  return page.evaluate(() => {
    const d = window.__cityStateStartUnitsTestDebug;
    const h = window.__hotSeatTestDebug;
    if (!d || typeof d.dumpState !== 'function' || !h || typeof h.snapshotHumanSeatsForTest !== 'function') return null;
    const seats = h.snapshotHumanSeatsForTest();
    const owners = Array.isArray(seats.humanOwnerIds) ? seats.humanOwnerIds : [];
    const civTypes = {};
    if (typeof h.civTypeForOwnerForTest === 'function') {
      for (const owner of owners) civTypes[owner] = h.civTypeForOwnerForTest(owner);
    }
    return { state: d.dumpState(), seats, civTypes };
  });
}
function canonicalSnapshot(raw) {
  if (!raw || !raw.state || !raw.seats) throw new Error('Read-only state hooks are unavailable');
  return {
    turn: raw.state.turn,
    seed: raw.state.seed ?? raw.state.mapSeed ?? null,
    seats: raw.seats,
    cities: (raw.state.cities || []).map((c) => ({ id: c.id, name: c.name ?? null, ownerId: c.ownerId, q: c.q, r: c.r, civTypeId: c.civTypeId })).sort((a, b) => String(a.id).localeCompare(String(b.id))),
    units: (raw.state.units || []).map((u) => ({ id: u.id, ownerId: u.ownerId, typeId: u.typeId, q: u.q, r: u.r })).sort((a, b) => String(a.id).localeCompare(String(b.id))),
  };
}
async function readOwnerObservability(page, ownerId) {
  return page.evaluate((owner) => {
    const snapshot = window.__hotSeatTestDebug?.snapshotRuntimeObservabilityForTest?.();
    if (!snapshot || !Array.isArray(snapshot.cities)) return null;
    const cities = snapshot.cities.filter((city) => city.ownerId === owner).map((city) => ({
      cityId: city.cityId,
      manpower: city.manpower,
      recruitmentOptions: city.recruitmentOptions,
    }));
    return { activeHumanOwnerId: snapshot.activeHumanOwnerId, ownerId: owner, cities };
  }, ownerId);
}
function ownerObservationChecks(observation, ownerId, label) {
  const cities = observation?.cities ?? [];
  const usable = cities.filter((city) => city.manpower
    && ['manpowerBiezacy', 'manpowerMax', 'regenPerTurn', 'kosztJednostki']
      .every((key) => Number.isFinite(city.manpower[key])));
  const mp = usable.length
    ? result('PASS', { ownerId, cities: usable.map((city) => ({ cityId: city.cityId, ...city.manpower })) })
    : result('BLOCKED', `${label}: read-only owner hook did not expose complete MP values for an owned city`);
  const cityWithRecruitment = cities.find((city) => Array.isArray(city.recruitmentOptions));
  const options = cityWithRecruitment?.recruitmentOptions ?? [];
  const impi = options.find((unit) => unit.id === 'Impi');
  const ordinary = options.find((unit) => unit.id && unit.id !== 'Impi');
  const g11 = impi && ordinary && Number.isFinite(impi.manpowerCost) && Number.isFinite(ordinary.manpowerCost)
    ? result('PASS', { ownerId, cityId: cityWithRecruitment.cityId, impi: { id: impi.id, manpowerCost: impi.manpowerCost }, ordinary: { id: ordinary.id, manpowerCost: ordinary.manpowerCost } })
    : result('BLOCKED', `${label}: read-only owner hook did not expose Impi and ordinary recruitment costs`);
  return { mp, g11 };
}
async function foundCityThroughMapUi(page, ownerId, timeout) {
  const before = await page.evaluate((owner) => {
    const h = window.__hotSeatTestDebug;
    const d = window.__cityStateStartUnitsTestDebug;
    const seats = h?.snapshotHumanSeatsForTest?.();
    const runtime = h?.snapshotRuntimeObservabilityForTest?.();
    const state = d?.dumpState?.();
    const start = runtime?.startHexes?.find((row) => row.ownerId === owner);
    return {
      activeOwner: seats?.activeHumanOwnerId,
      awaiting: h?.isAwaitingFirstPlayerCity?.(owner) ?? null,
      point: start?.absoluteViewportCssPx ?? null,
      hex: start?.hex ?? null,
      canvas: runtime?.canvas ?? null,
      viewport: runtime?.viewport ?? null,
      priorCityIds: (state?.cities ?? []).filter((city) => city.ownerId === owner).map((city) => city.id),
    };
  }, ownerId);
  if (before.activeOwner !== ownerId || before.awaiting !== true || !before.point || !before.hex) {
    return result('BLOCKED', `Owner ${ownerId} is not awaiting founding at an observable start hex in the active seat`);
  }
  if (before.point.x < Math.max(0, before.canvas?.left ?? Infinity)
      || before.point.x > Math.min(before.viewport?.width ?? -Infinity, before.canvas?.right ?? -Infinity)
      || before.point.y < Math.max(0, before.canvas?.top ?? Infinity)
      || before.point.y > Math.min(before.viewport?.height ?? -Infinity, before.canvas?.bottom ?? -Infinity)) {
    return result('BLOCKED', `Owner ${ownerId} start-hex projection is outside visible canvas bounds`);
  }
  await page.mouse.click(before.point.x, before.point.y);
  const after = await page.waitForFunction((args) => {
    const h = window.__hotSeatTestDebug;
    const state = window.__cityStateStartUnitsTestDebug?.dumpState?.();
    if (!state || h?.isAwaitingFirstPlayerCity?.(args.ownerId) !== false) return null;
    const cities = (state.cities ?? []).filter((city) => city.ownerId === args.ownerId
      && city.q === args.q && city.r === args.r && !args.priorCityIds.includes(city.id));
    return cities.length === 1 ? { cityId: cities[0].id, ownerId: args.ownerId, q: args.q, r: args.r } : null;
  }, { ownerId, q: before.hex.q, r: before.hex.r, priorCityIds: before.priorCityIds }, { timeout }).then((handle) => handle.jsonValue());
  if (!after) return result('BLOCKED', `Legal map click did not produce one new city for owner ${ownerId} at its projected start hex`);
  return result('PASS', after);
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

async function collectActiveHumanUi(page, cfg, expectedOwner) {
  const seat = await page.evaluate(() => window.__hotSeatTestDebug?.snapshotHumanSeatsForTest?.() ?? null);
  if (!seat || seat.activeHumanOwnerId !== expectedOwner) {
    return { mp: result('BLOCKED', 'Active owner did not match the expected seat before opening city UI'), g11: result('BLOCKED', 'Active owner mismatch') };
  }
  const ownerObservation = await readOwnerObservability(page, expectedOwner);
  const apiChecks = ownerObservationChecks(ownerObservation, expectedOwner, 'active human owner API');
  const cityButton = page.locator('[data-act="cities"]');
  if (await cityButton.count() !== 1) return { mp: result('BLOCKED', 'Unique ordinary Cities control not found'), g11: apiChecks.g11 };
  await cityButton.click();
  const cityList = page.locator('.civ-city-list-hud.open');
  await waitFor(cityList, 'active-owner city list', cfg.timeout);
  const names = await cityList.locator('.sl-item .sl-name').allTextContents();
  const stateCities = await page.evaluate((owner) => {
    const s = window.__cityStateStartUnitsTestDebug?.dumpState?.();
    return (s?.cities ?? []).filter((c) => c.ownerId === owner).map((c) => ({ id: c.id, name: c.name ?? c.cityName ?? null }));
  }, expectedOwner);
  const uiName = names[0]?.trim();
  if (!uiName || names.length !== stateCities.length || stateCities.length === 0) {
    return { mp: result('BLOCKED', 'Visible active-owner city-list rows do not match read-only owner city rows'), g11: apiChecks.g11 };
  }
  const matchingRows = await cityList.locator('.sl-item').evaluateAll((els, name) => els.flatMap((el, index) =>
    el.querySelector('.sl-name')?.textContent?.trim() === name ? [index] : []), uiName);
  if (matchingRows.length !== 1) return { mp: result('BLOCKED', 'Could not identify one city-list row for the current human owner'), g11: apiChecks.g11 };
  // `buildPlayerCityListEntries()` and both read-only snapshots filter the same live
  // `cities` array without reordering, so visible row order maps to source city ID.
  const selectedIndex = matchingRows[0];
  const stateCity = stateCities[selectedIndex];
  const apiCity = ownerObservation?.cities?.[selectedIndex];
  if (!apiCity) return { mp: result('BLOCKED', 'Selected UI city has no matching read-only owner snapshot'), g11: apiChecks.g11 };
  await cityList.locator('.sl-item').nth(matchingRows[0]).click();
  await waitFor(page.locator('.civ-ux-frame [data-res-stat="rekruci"]'), 'city Manpower stat control', cfg.timeout);
  await clickUnique(page.locator('.civ-ux-frame [data-res-stat="rekruci"]'), 'city Manpower details');
  const mpCard = page.locator('.civ-ux-frame .civ-ux-detail-dock .detail-card');
  let mp = result('BLOCKED', 'Visible Manpower detail card/required values were not found');
  try {
    await mpCard.waitFor({ state: 'visible', timeout: cfg.timeout });
    const rows = await mpCard.evaluate((el) => {
      const out = {};
      for (const grid of el.querySelectorAll('.dc-grid')) {
        const labels = [...grid.querySelectorAll('.dc-l')];
        const values = [...grid.querySelectorAll('.dc-v')];
        labels.forEach((label, i) => { if (values[i]) out[label.textContent.trim()] = values[i].textContent.trim(); });
      }
      return out;
    });
    const targets = [
      ['Bieżąca pula', 'manpowerBiezacy'], ['Maksimum', 'manpowerMax'],
      ['Odnowa', 'regenPerTurn'], ['Koszt 1 jednostki', 'kosztJednostki'],
    ];
    if (apiChecks.mp.status !== 'PASS' || !apiCity.manpower) {
      mp = result('BLOCKED', 'Selected city read-only MP values are incomplete');
    } else if (targets.every(([label]) => rows[label] !== undefined)) {
      const agrees = targets.every(([label, key]) => sameDisplayedNumber(rows[label], apiCity.manpower[key]));
      if (agrees) mp = result('PASS', { ownerId: expectedOwner, cityId: apiCity.cityId, uiValues: Object.fromEntries(targets.map(([label]) => [label, rows[label]])), apiValues: apiCity.manpower });
      else mp = result('FAIL', `Human MP UI values disagreed with the read-only owner snapshot for city ${apiCity.cityId}`);
    }
  } catch { /* a missing UI observation becomes BLOCKED below */ }

  const recruitButton = page.locator('.civ-ux-frame .civ-v-icon-btn[aria-label="Jednostki do rekrutacji"]');
  let g11 = apiChecks.g11;
  if (await recruitButton.count() === 1) {
    await recruitButton.click();
    const recruitRows = page.locator('.unit-recruit-compact-row');
    try {
      await recruitRows.first().waitFor({ state: 'visible', timeout: cfg.timeout });
      const unitCosts = await recruitRows.evaluateAll((els) => els.map((el) => ({
        name: el.querySelector('.bld-compact-name')?.textContent?.trim() ?? '',
        mpRequired: el.querySelector('.unit-recruit-manpower')?.getAttribute('data-required') ?? null,
      })));
      const apiOptions = apiCity.recruitmentOptions ?? [];
      const uiImpi = unitCosts.find((row) => row.name === 'Impi');
      const apiImpi = apiOptions.find((unit) => unit.id === 'Impi');
      const uiOrdinary = unitCosts.find((row) => row.name && row.name !== 'Impi');
      const apiOrdinary = uiOrdinary && apiOptions.find((unit) => unit.id === uiOrdinary.name);
      if (uiImpi?.mpRequired !== null && uiImpi && apiImpi && uiOrdinary?.mpRequired !== null && uiOrdinary && apiOrdinary) {
        const agrees = sameDisplayedNumber(uiImpi.mpRequired, apiImpi.manpowerCost)
          && sameDisplayedNumber(uiOrdinary.mpRequired, apiOrdinary.manpowerCost);
        g11 = agrees
          ? result('PASS', { ownerId: expectedOwner, cityId: apiCity.cityId, impi: { id: apiImpi.id, uiManpowerCost: uiImpi.mpRequired, apiManpowerCost: apiImpi.manpowerCost }, ordinary: { id: apiOrdinary.id, uiManpowerCost: uiOrdinary.mpRequired, apiManpowerCost: apiOrdinary.manpowerCost } })
          : result('FAIL', 'Human recruitment UI costs disagreed with the read-only owner snapshot');
      }
    } catch { /* missing target rows stay BLOCKED */ }
  }
  const close = page.locator('.civ-ux-frame [data-city-exit]');
  if (await close.count() === 1) await close.click();
  await page.locator('.civ-ux-frame').waitFor({ state: 'hidden', timeout: cfg.timeout });
  if (await cityList.count()) await page.keyboard.press('Escape');
  return { mp, g11 };
}

async function readProductionSaveProof(page, slotId) {
  const proof = await page.evaluate(async (id) => {
    if (!id || !indexedDB.databases) return null;
    const dbs = await indexedDB.databases();
    if (!dbs.some((db) => db.name === 'thegame-saves')) return null;
    const db = await new Promise((resolve, reject) => {
      const req = indexedDB.open('thegame-saves');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(new Error('IDB open failed'));
    });
    try {
      if (!db.objectStoreNames.contains('kv')) return null;
      const raw = await new Promise((resolve, reject) => {
        const tx = db.transaction('kv', 'readonly');
        const req = tx.objectStore('kv').get(`thegame.save.${id}`);
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => reject(new Error('IDB read failed'));
      });
      if (typeof raw !== 'string') return null;
      const save = JSON.parse(raw);
      return {
        seed: save.seed ?? null,
        turn: save.tura ?? null,
        humanOwnerIds: save.humanOwnerIds ?? null,
        activeHumanOwnerId: save.activeHumanOwnerId ?? null,
        cities: (save.cities ?? []).map((c) => ({ id: c.id, ownerId: c.ownerId, q: c.q, r: c.r })).sort((a, b) => String(a.id).localeCompare(String(b.id))),
        units: (save.units ?? []).map((u) => ({ id: u.id, ownerId: u.ownerId, typeId: u.typeId, q: u.q, r: u.r })).sort((a, b) => String(a.id).localeCompare(String(b.id))),
        mapSnapshotJson: save.mapSnapshot ? JSON.stringify(save.mapSnapshot) : null,
      };
    } finally { db.close(); }
  }, slotId);
  if (!proof || typeof proof.mapSnapshotJson !== 'string') return null;
  const mapHash = crypto.createHash('sha256').update(proof.mapSnapshotJson).digest('hex');
  delete proof.mapSnapshotJson;
  return { ...proof, mapHash };
}
async function runUiFlow(page, args, cfg, checks) {
  await clickUnique(page.getByRole('button', { name: 'Rozpocznij grę', exact: false }), 'main menu Start game');
  await clickUnique(page.locator('.cta-hero'), '.cta-hero');
  await waitFor(page.locator('.epoch-grid .ec'), 'epoch picker', cfg.timeout);
  await clickCardByText(page, '.epoch-grid .ec', cfg.epochName, 'epoch');
  await clickUnique(page.locator('.nav .next'), 'continue from epoch selection');
  await waitFor(page.locator('.civ-grid .card'), 'civilization picker', cfg.timeout);
  await clickCardByText(page, '.civ-grid .card', cfg.human1Name, 'human seat 1');
  await clickUnique(page.locator('.nav .next'), 'continue from human 1 civilization selection');

  // Seed is a legal input only after the ordinary wizard reaches Settings.
  const seedInput = page.locator(args['seed-selector'] || '#ng-seed');
  await waitFor(seedInput, 'legal seed input in game settings', cfg.timeout);
  if (await seedInput.count() !== 1 || !(await visible(seedInput))) {
    checks['legal-seed-input'] = result('BLOCKED', 'Settings step did not expose one visible legal seed input; game start not attempted');
    for (const key of ['new-game-ui', 'seat-owners', 'ai-civ-readback', 'human-city-founding', 'world-turn', 'save-slot-ui', 'load-slot-ui', 'seed-readback', 'saved-state-readback']) {
      checks[key] = result('NOT RUN', 'Stopped before game start because legal seed input was unavailable');
    }
    return;
  }
  await seedInput.fill(String(cfg.seed));
  if (Number(await seedInput.inputValue()) !== cfg.seed) throw new Error('Seed input did not preserve configured expected value');
  checks['legal-seed-input'] = result('PASS', 'Configured expected seed entered through the visible Settings UI field');

  await waitFor(page.locator('.ai-civ-grid .card'), 'AI civilization picker', cfg.timeout);
  await clickCardByText(page, '.ai-civ-grid .card', cfg.aiName, 'AI seat');
  await clickUnique(page.locator('.seat2-toggle-btn'), '.seat2-toggle-btn');
  await clickUnique(page.locator('.sett-actions .start'), 'continue to second human seat');
  await waitFor(page.locator('.seat2-dist-opt'), 'second human distance choices', cfg.timeout);
  await clickCardByText(page, '.civ-grid .card', cfg.human2Name, 'human seat 2');
  await clickUnique(page.locator('.seat2-dist-opt.sel'), 'selected second-human distance choice');
  const seat2Seed = page.locator('#ng-seed');
  await waitFor(seat2Seed, 'seed confirmation in second-seat step', cfg.timeout);
  if (Number(await seat2Seed.inputValue()) !== cfg.seed) throw new Error('Second-seat UI did not preserve configured seed');
  await clickUnique(page.locator('.sett-actions .start'), 'start game');

  await page.waitForFunction(() => !!window.__hotSeatTestDebug?.snapshotRuntimeObservabilityForTest
    && !!window.__cityStateStartUnitsTestDebug?.dumpState, null, { timeout: cfg.timeout });
  checks['new-game-ui'] = result('PASS', 'Configured seats and seed submitted through ordinary UI; read-only hooks mounted');
  const beforeRaw = await readSnapshot(page);
  const before = canonicalSnapshot(beforeRaw);
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
  const mappedHumanCivs = expectedHumans.map((owner) => before.seats.civIdByOwner[owner]);
  if (!before.civTypes || mappedHumanCivs.some((id) => !id)) {
    checks['seat-owners'] = result('BLOCKED', 'Read-only owner-to-civilization readback is incomplete');
    for (const key of ['human-city-founding', 'mp-human1', 'mp-human2', 'g11-human1', 'g11-human2', 'world-turn', 'save-slot-ui', 'load-slot-ui', 'saved-state-readback']) checks[key] = result('BLOCKED', 'Required owner mapping is unavailable');
    return;
  }
  if (JSON.stringify(mappedHumanCivs) !== JSON.stringify([args['human1-civ'], args['human2-civ']])) {
    checks['seat-owners'] = result('FAIL', 'Human owner-to-civilization mapping differs from configured order');
    for (const key of ['human-city-founding', 'mp-human1', 'mp-human2', 'g11-human1', 'g11-human2', 'world-turn', 'save-slot-ui', 'load-slot-ui', 'saved-state-readback']) checks[key] = result('BLOCKED', 'Fixture owner mapping failed');
    return;
  }
  if (expectedHumans.some((owner) => before.civTypes[owner] !== before.seats.civIdByOwner[owner])) {
    checks['seat-owners'] = result('FAIL', 'Owner civ-type readback differs from seat civ mapping');
    for (const key of ['human-city-founding', 'mp-human1', 'mp-human2', 'g11-human1', 'g11-human2', 'world-turn', 'save-slot-ui', 'load-slot-ui', 'saved-state-readback']) checks[key] = result('BLOCKED', 'Fixture owner mapping failed');
    return;
  }
  checks['seat-owners'] = result('PASS', 'Read-only seat snapshot contains two human owners and civilization mapping');
  const aiEntry = Object.entries(before.seats.civIdByOwner).find(([owner, civId]) => !expectedHumans.includes(Number(owner)) && civId === args['ai-civ']);
  if (!aiEntry) {
    checks['ai-civ-readback'] = result('BLOCKED', 'Configured AI civilization is not exposed in the read-only owner-to-civ mapping');
    checks['mp-ai'] = result('BLOCKED', 'AI owner mapping is not available for attribution');
    checks['g11-ai'] = result('BLOCKED', 'AI owner mapping is not available for attribution');
  } else {
    checks['ai-civ-readback'] = result('PASS', 'Configured AI civilization is present in the read-only owner mapping');
    const aiChecks = ownerObservationChecks(await readOwnerObservability(page, Number(aiEntry[0])), Number(aiEntry[0]), 'AI owner');
    checks['mp-ai'] = aiChecks.mp;
    checks['g11-ai'] = aiChecks.g11;
  }

  const human1Founding = await foundCityThroughMapUi(page, expectedHumans[0], cfg.timeout);
  if (human1Founding.status !== 'PASS') {
    checks['human-city-founding'] = human1Founding;
    for (const key of ['mp-human1', 'mp-human2', 'g11-human1', 'g11-human2', 'world-turn', 'save-slot-ui', 'load-slot-ui', 'saved-state-readback']) checks[key] = result('BLOCKED', 'Stopped because a legal human start-city click was not verified');
    return;
  }
  checks['human-city-founding'] = result('NOT RUN', 'Human 2 founding follows the first legal seat submission');
  const initialTurn = Number(before.turn);
  if (!Number.isSafeInteger(initialTurn)) throw new Error('Engine world-turn counter is not an integer');
  const endTurn = page.locator('.civ-bottom-bar button[data-end]');
  let human1BeforeTurn;
  try { human1BeforeTurn = await collectActiveHumanUi(page, cfg, expectedHumans[0]); }
  catch (err) { human1BeforeTurn = { mp: result('BLOCKED', `Human 1 MP UI read failed: ${err.message}`), g11: result('BLOCKED', 'Human 1 recruitment UI read failed') }; }
  checks['mp-human1'] = human1BeforeTurn.mp;
  checks['g11-human1'] = human1BeforeTurn.g11;
  await clickUnique(endTurn, 'human 1 end-turn button');
  await page.waitForFunction((expectedOwner) => {
    const h = window.__hotSeatTestDebug?.snapshotHumanSeatsForTest?.();
    return h?.activeHumanOwnerId === expectedOwner;
  }, expectedHumans[1], { timeout: cfg.timeout });
  const afterSeat1 = canonicalSnapshot(await readSnapshot(page));
  if (Number(afterSeat1.turn) !== initialTurn) throw new Error('First hot-seat submission unexpectedly advanced world turn');
  const human2Founding = await foundCityThroughMapUi(page, expectedHumans[1], cfg.timeout);
  if (human2Founding.status !== 'PASS') {
    checks['human-city-founding'] = result('BLOCKED', `Human 1 founded legally; human 2: ${human2Founding.detail}`);
    checks['world-turn'] = result('BLOCKED', 'Stopped before human 2 submission because seat 2 founding was not verified');
    for (const key of ['mp-human2', 'g11-human2', 'save-slot-ui', 'load-slot-ui', 'saved-state-readback']) checks[key] = result('BLOCKED', 'Stopped before completion of both legal human seat submissions');
    return;
  }
  checks['human-city-founding'] = result('PASS', { human1: human1Founding.detail, human2: human2Founding.detail });
  try {
    const human2 = await collectActiveHumanUi(page, cfg, expectedHumans[1]);
    checks['mp-human2'] = human2.mp;
    checks['g11-human2'] = human2.g11;
  } catch (err) {
    checks['mp-human2'] = result('BLOCKED', `Human 2 MP UI read failed: ${err.message}`);
    checks['g11-human2'] = result('BLOCKED', `Human 2 recruitment UI read failed: ${err.message}`);
  }
  await clickUnique(endTurn, 'human 2 end-turn button');
  await page.waitForFunction((expectedOwner) => {
    const h = window.__hotSeatTestDebug?.snapshotHumanSeatsForTest?.();
    return h?.activeHumanOwnerId === expectedOwner;
  }, expectedHumans[0], { timeout: cfg.timeout });
  const afterBothSeats = canonicalSnapshot(await readSnapshot(page));
  if (Number(afterBothSeats.turn) !== initialTurn + 1) throw new Error('Two hot-seat submissions did not advance exactly one world turn');
  const transition = page.locator('.civ-turn-transition.on');
  await transition.waitFor({ state: 'visible', timeout: cfg.timeout });
  await transition.waitFor({ state: 'hidden', timeout: cfg.timeout });
  checks['world-turn'] = result('PASS', 'Exactly one legal UI end-turn submission per human advanced the engine world-turn counter by one');
  const turnSnapshot = canonicalSnapshot(await readSnapshot(page));
  try {
    const human1After = await collectActiveHumanUi(page, cfg, expectedHumans[0]);
    checks['mp-human1'] = human1After.mp;
    checks['g11-human1'] = human1After.g11;
  } catch (err) {
    checks['mp-human1'] = result('BLOCKED', `Human 1 post-turn UI read failed: ${err.message}`);
    checks['g11-human1'] = result('BLOCKED', 'Human 1 post-turn recruitment UI read failed');
  }

  const slotName = `PR141-${Date.now()}-${process.pid}`;
  await openPauseAction(page, 'save', cfg.timeout);
  const saveDialog = page.locator('.civ-sl[aria-label="Zapisz grę"]');
  await waitFor(saveDialog, 'save dialog', cfg.timeout);
  await saveDialog.locator('#civ-sl-name').fill(slotName);
  await clickUnique(saveDialog.getByRole('button', { name: 'Zapisz', exact: true }), 'save slot');
  await saveDialog.waitFor({ state: 'hidden', timeout: cfg.timeout });
  checks['save-slot-ui'] = result('PASS', 'Unique slot saved through the production save dialog');

  await openPauseAction(page, 'load', cfg.timeout);
  const loadDialog = page.locator('.civ-sl[aria-label="Wczytaj grę"]');
  await waitFor(loadDialog, 'load dialog', cfg.timeout);
  const row = loadDialog.locator('.civ-sl-row[data-slot]').filter({ hasText: slotName });
  const firstSlotId = await row.getAttribute('data-slot');
  const initialSaveProof = await readProductionSaveProof(page, firstSlotId);
  if (initialSaveProof && initialSaveProof.seed === cfg.seed && initialSaveProof.mapHash) {
    checks['seed-readback'] = result('PASS', 'Production IndexedDB save blob seed matched configured UI seed');
  } else if (initialSaveProof && initialSaveProof.seed !== cfg.seed) {
    checks['seed-readback'] = result('FAIL', 'Production save blob seed differs from configured UI seed');
  } else {
    checks['seed-readback'] = result('BLOCKED', 'Production save blob seed/mapSnapshot was not readable through read-only IndexedDB access');
  }
  if (initialSaveProof) {
    checks['saved-core-readback'] = result('PASS', 'Production slot blob contains seed, turn, owners, cities, units, and mapSnapshot fingerprint');
  } else {
    checks['save-slot-ui'] = result('BLOCKED', 'Save dialog closed but the production slot blob/mapSnapshot could not be read back');
  }
  await clickUnique(row, 'saved slot row');
  await clickUnique(loadDialog.getByRole('button', { name: 'Wczytaj', exact: true }), 'load saved slot');
  await loadDialog.waitFor({ state: 'hidden', timeout: cfg.timeout });
  await page.waitForFunction(() => !!window.__cityStateStartUnitsTestDebug?.dumpState?.(), null, { timeout: cfg.timeout });
  const loaded = canonicalSnapshot(await readSnapshot(page));
  checks['load-slot-ui'] = result('PASS', 'Selected slot reloaded through the production load dialog');
  const equalFields = ['turn', 'seats', 'cities', 'units'];
  const mismatches = equalFields.filter((key) => JSON.stringify(loaded[key]) !== JSON.stringify(turnSnapshot[key]));
  if (mismatches.length) checks['saved-core-readback'] = result('FAIL', `Loaded runtime state differed in: ${mismatches.join(', ')}`);
  const postLoadHuman1 = await collectActiveHumanUi(page, cfg, expectedHumans[0]).catch((err) => ({
    mp: result('BLOCKED', `Post-load human 1 MP observation failed: ${err.message}`),
    g11: result('BLOCKED', 'Post-load human 1 recruitment observation failed'),
  }));
  if (checks['mp-human1'].status !== 'PASS' || postLoadHuman1.mp.status !== 'PASS') {
    checks['mp-human1'] = result('BLOCKED', 'Could not compare human 1 Manpower before/after saved-slot reload');
  } else if (JSON.stringify(checks['mp-human1'].detail) !== JSON.stringify(postLoadHuman1.mp.detail)) {
    checks['mp-human1'] = result('FAIL', 'Human 1 visible Manpower values changed after saved-slot reload');
  }
  if (checks['g11-human1'].status !== 'PASS' || postLoadHuman1.g11.status !== 'PASS') {
    checks['g11-human1'] = result('BLOCKED', 'Could not compare human 1 recruitment costs before/after saved-slot reload');
  } else if (JSON.stringify(checks['g11-human1'].detail) !== JSON.stringify(postLoadHuman1.g11.detail)) {
    checks['g11-human1'] = result('FAIL', 'Human 1 visible recruitment costs changed after saved-slot reload');
  }

  const recaptureLabel = `${slotName}-recapture`;
  await openPauseAction(page, 'save', cfg.timeout);
  const recaptureDialog = page.locator('.civ-sl[aria-label="Zapisz grę"]');
  await waitFor(recaptureDialog, 'post-load re-save dialog', cfg.timeout);
  await recaptureDialog.locator('#civ-sl-name').fill(recaptureLabel);
  await clickUnique(recaptureDialog.getByRole('button', { name: 'Zapisz', exact: true }), 'post-load state re-save');
  await recaptureDialog.waitFor({ state: 'hidden', timeout: cfg.timeout });
  await openPauseAction(page, 'load', cfg.timeout);
  await waitFor(loadDialog, 'post-load re-save slot list', cfg.timeout);
  const recaptureRow = loadDialog.locator('.civ-sl-row[data-slot]').filter({ hasText: recaptureLabel });
  const recaptureSlotId = await recaptureRow.getAttribute('data-slot');
  const recapturedProof = await readProductionSaveProof(page, recaptureSlotId);
  if (initialSaveProof && recapturedProof) {
    const proofFields = ['seed', 'turn', 'humanOwnerIds', 'activeHumanOwnerId', 'cities', 'units'];
    const proofMismatches = proofFields.filter((key) => JSON.stringify(initialSaveProof[key]) !== JSON.stringify(recapturedProof[key]));
    const serializedMapChanged = initialSaveProof.mapHash !== recapturedProof.mapHash;
    if (proofMismatches.length || serializedMapChanged) {
      checks['same-map-identity'] = result('FAIL', `Production save payload changed after reload/re-save in: ${[...proofMismatches, ...(serializedMapChanged ? ['serialized mapSnapshot hash'] : [])].join(', ')}`);
    } else checks['same-map-identity'] = result('BLOCKED', 'Serialized production mapSnapshot hash matches after reload, but this is not an independent live-terrain identity observation');
    if (!proofMismatches.length && !mismatches.length) {
      checks['saved-core-readback'] = result('PASS', 'Loaded live state and production re-save matched the original seed, turn, owner seats, cities, and units');
    } else if (checks['saved-core-readback'].status !== 'FAIL') {
      checks['saved-core-readback'] = result('FAIL', 'Live or serialized saved state did not match after reload');
    }
    if (recapturedProof.seed === cfg.seed && initialSaveProof.seed === cfg.seed) checks['seed-readback'] = result('PASS', 'Initial and post-load production save blob seeds matched configured seed');
    else checks['seed-readback'] = result('FAIL', 'Initial/post-load production save blob seed mismatch');
  } else {
    checks['same-map-identity'] = result('BLOCKED', 'Production save blobs were not available for seed/mapSnapshot comparison');
    checks['saved-core-readback'] = result('BLOCKED', 'Could not verify live state against a post-load production save blob');
  }
  checks['saved-state-readback'] = result('BLOCKED', 'Full saved-state acceptance requires independent live map identity and a legal observed F05 battle; serialized map hash alone is insufficient');
}

async function openPauseAction(page, action, timeout) {
  await page.keyboard.press('Escape');
  await waitFor(page.locator('.civ-pause-btns'), 'game pause menu', timeout);
  const pause = page.locator(`.civ-pause-btns [data-act="${action}"]`);
  await waitFor(pause, `pause menu ${action} action`, timeout);
  await clickUnique(pause, `pause menu ${action} action`);
}

async function main() {
  const report = { run: 'R-PR141-CODEX-RUNTIME-HARNESS-20261018', generatedAt: new Date().toISOString(), executed: false, checks: statusBook() };
  try {
    const args = parseArgs(process.argv.slice(2));
    if (!args.authorized) {
      report.checks['runtime-opt-in'] = result('BLOCKED', 'Missing --authorize-runtime-after-run55; no browser/server/runtime module loaded');
      report.executed = false;
      writeReport(report);
      process.stderr.write('BLOCKED: explicit runtime opt-in is required.\n');
      process.exitCode = 2;
      return;
    }
    assertSnapshot(args['approved-snapshot']);
    report.checks['approved-snapshot'] = result('PASS', 'HEAD and protected source/data/test content match explicit approved manifest');
    const cfg = requireConfig(args);
    const { chromium } = require('playwright');
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      page.setDefaultTimeout(cfg.timeout);
      await page.goto(args.url, { waitUntil: 'domcontentloaded', timeout: cfg.timeout });
      report.executed = true;
      await runUiFlow(page, args, cfg, report.checks);
    } finally {
      await browser.close();
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
    report.checks['g11-human-and-ai'] = aggregateChecks(report.checks, ['g11-human1', 'g11-human2', 'g11-ai'], 'Human and AI G11 observations');
    report.checks['scenario-overall'] = aggregateChecks(report.checks, [
      'legal-seed-input', 'new-game-ui', 'seat-owners', 'ai-civ-readback', 'human-city-founding', 'world-turn',
      'save-slot-ui', 'load-slot-ui', 'seed-readback', 'same-map-identity', 'saved-core-readback',
      'saved-state-readback', 'mp-human1', 'mp-human2', 'mp-ai', 'f05-battle', 'g11-human1', 'g11-human2', 'g11-ai',
    ], 'Required runtime acceptance checks');
    writeReport(report);
  }
}

function aggregateChecks(checks, keys, label) {
  const statuses = keys.map((key) => checks[key]?.status ?? 'BLOCKED');
  if (statuses.includes('FAIL')) return result('FAIL', `${label}: at least one required check failed`);
  if (statuses.includes('BLOCKED') || statuses.includes('NOT RUN')) return result('BLOCKED', `${label}: required observations remain blocked or unrun`);
  if (statuses.every((status) => status === 'PASS')) return result('PASS', `${label}: every required check passed`);
  return result('BLOCKED', `${label}: incomplete status set`);
}

main();
