'use strict';
/**
 * Live main-path coverage for the seven society civ-matrix fields.
 * Run: cd gra && node tools/civ-matrix-spoleczenstwo-main-path-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.civ-matrix-spoleczenstwo-entry.ts');
const BUNDLE = path.resolve(__dirname, '.civ-matrix-spoleczenstwo-bundle.cjs');
const MAIN = path.resolve(__dirname, '..', 'src', 'main.ts');

const MAIN_SOURCE = fs.readFileSync(MAIN, 'utf8');

function extractStatement(source, marker) {
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`main.ts marker not found: ${marker}`);
  let parenDepth = 0;
  let sawParen = false;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  for (let i = start; i < source.length; i++) {
    const ch = source[i];
    const next = source[i + 1];
    if (lineComment) {
      if (ch === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (ch === '*' && next === '/') {
        blockComment = false;
        i++;
      }
      continue;
    }
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === '/' && next === '/') {
      lineComment = true;
      i++;
      continue;
    }
    if (ch === '/' && next === '*') {
      blockComment = true;
      i++;
      continue;
    }
    if (ch === '\'' || ch === '"' || ch === '`') {
      quote = ch;
      continue;
    }
    if (ch === '(') {
      sawParen = true;
      parenDepth++;
      continue;
    }
    if (ch === ';' && !sawParen) return source.slice(start, i + 1);
    if (ch === ')') {
      parenDepth--;
      if (parenDepth === 0) {
        for (let j = i + 1; j < source.length; j++) {
          if (/\\s/.test(source[j])) continue;
          if (source[j] !== ';') throw new Error(`main.ts statement terminator missing: ${marker}`);
          return source.slice(start, j + 1);
        }
      }
    }
  }
  throw new Error(`main.ts statement could not be extracted: ${marker}`);
}

const OWNER_KEY_STATEMENT = extractStatement(
  MAIN_SOURCE,
  'const ownerCivKey = civKeyForOwnerId(city.ownerId)',
);
const ACCUMULATE_STATEMENT = extractStatement(
  MAIN_SOURCE,
  'const acc = accumulateCulture(ccIn, kulturaTick, cp, ownerCivKey)',
);
const CC_OUT_STATEMENT = extractStatement(
  MAIN_SOURCE,
  'const ccOut: CultureCity = { kulturaSkumulowana: acc.kulturaSkumulowana, ownCultureShare }',
);
const HA_KULT_STATEMENT = extractStatement(
  MAIN_SOURCE,
  'const haKult = cultureHappiness(ccOut, cp)',
);
const HA_REL_STATEMENT = extractStatement(
  MAIN_SOURCE,
  'const haRel = religionHappiness(curRel, ownRel, rp, builtIds.includes(\'swiatynia\'))',
);
const SPREAD_STATEMENT = extractStatement(
  MAIN_SOURCE,
  'const spreadRes = spreadReligion(curRel, relNeighbors, rp,',
);
const ORDER_STATEMENT = extractStatement(
  MAIN_SOURCE,
  'const ordPctRaw = evaluateOrderFromBreakdown(',
);
const MAIN_PATH_STATEMENTS = [
  OWNER_KEY_STATEMENT,
  ACCUMULATE_STATEMENT,
  CC_OUT_STATEMENT,
  HA_KULT_STATEMENT,
  HA_REL_STATEMENT,
  SPREAD_STATEMENT,
  ORDER_STATEMENT,
].join('\n');

fs.writeFileSync(ENTRY, `
export {
  accumulateCulture,
  FALLBACK_CULTURE_PARAMS,
  spreadReligion,
  FALLBACK_RELIGION_PARAMS,
} from '../src/game/culture-religion';
export { evaluateOrderFromBreakdown } from '../src/game/society-breakdown';
export {
  loadCivMatrix,
  civMatrixParam,
  applyCivMatrixMulProc,
} from '../src/game/civ-matrix';

import {
  FALLBACK_CULTURE_PARAMS,
  accumulateCulture,
  cultureHappiness,
  FALLBACK_RELIGION_PARAMS,
  religionHappiness,
  spreadReligion,
  type CultureCity,
} from '../src/game/culture-religion';
import { evaluateOrderFromBreakdown } from '../src/game/society-breakdown';

export function runMainSocietyPath(input: any) {
  const ownerId = input.ownerId ?? 7;
  const city = input.city ?? { id: 'c1', ownerId, q: 1, r: 2, population: 4 };
  const player = { civType: input.playerCivKey ?? input.civKey ?? 'grecy' };
  const aiOwnerCivMap = new Map([[ownerId, input.civKey ?? 'grecy']]);
  const civKeyForOwnerId = (id: number) => id === 0
    ? player.civType
    : (aiOwnerCivMap.get(id) ?? 'grecy');
  const ccIn = input.ccIn ?? { kulturaSkumulowana: 20, ownCultureShare: 1 };
  const kulturaTick = input.kulturaTick ?? 10;
  const cp = input.cp ?? FALLBACK_CULTURE_PARAMS;
  const curRel = input.curRel ?? { counts: { wiara: 10 } };
  const ownRel = input.ownRel ?? 'wiara';
  const relNeighbors = input.relNeighbors ?? [
    { id: 'n1', distance: 1, state: { counts: {} }, population: 10 },
  ];
  const rp = input.rp ?? FALLBACK_RELIGION_PARAMS;
  const hasSwiatynia = input.hasSwiatynia ?? false;
  const turn = input.turn ?? 7;
  const data = { societyParams: input.societyParams ?? {} };
  const difficulty = input.difficulty ?? 'normal';

  // Exact main.ts order-call context, reduced to deterministic test fixtures.
  const econTick = input.econTick ?? {
    garncarniaSurplusZadowolenie: 0,
    maSpichlerz: false,
    maSpichlerzII: false,
  };
  const ownerEraForUpkeep = input.ownerEraForUpkeep ?? 1;
  const empireEpochForOwner = () => ownerEraForUpkeep;
  const haBuildings = input.haBuildings ?? 2;
  const haWealth = input.haWealth ?? 0;
  const haCuda = input.haCuda ?? 0;
  const podzial = input.podzial;
  const ownerAtWar = input.ownerAtWar ?? false;
  const builtIds = input.builtIds ?? [];
  const cultureMixActive = input.cultureMixActive ?? false;
  const ownCultureShare = input.ownCultureShare ?? 1;
  const foreignReligionDominant = input.foreignReligionDominant ?? false;
  const conquestUnstablePen = input.conquestUnstablePen ?? 0;
  const stolicaBonus = input.stolicaBonus ?? false;
  const citizenUpkeep = input.citizenUpkeep ?? { happinessDelta: 0 };
  const gCountLaw = input.gCountLaw ?? 1;
  const conquestNoGarPen = input.conquestNoGarPen ?? 0;
  const cityPalacTier = (ids: string[]) => input.palacTier ?? (ids.includes('palac') ? 1 : null);

  ${MAIN_PATH_STATEMENTS}
  return { ownerCivKey, acc, spreadRes, ordPctRaw };
}
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE,
    logLevel: 'silent',
    resolveExtensions: ['.ts', '.js', '.json'],
  });

  const M = require(BUNDLE);
  const matrix = M.loadCivMatrix();
  let passed = 0;
  let failed = 0;

  function ok(condition, message) {
    if (condition) {
      passed++;
      console.log('  [OK] ' + message);
    } else {
      failed++;
      console.error('  [FAIL] ' + message);
    }
  }

  function near(actual, expected, message, epsilon = 1e-9) {
    ok(Math.abs(actual - expected) <= epsilon, `${message} (got ${actual}, expected ${expected})`);
  }

  function stable(value) {
    return JSON.stringify(value);
  }

  console.log('\n[civ-matrix-spoleczenstwo-main-path-test]\n');

  const civKeys = matrix.cywilizacje.map(row => row.ikonaId);
  ok(civKeys.length === 15, 'matrix exposes all 15 civilization keys');

  // Pure resolver coverage is kept as a separate baseline layer.
  const baseCulture = M.accumulateCulture(
    { kulturaSkumulowana: 20, ownCultureShare: 1 },
    10,
    M.FALLBACK_CULTURE_PARAMS,
  );
  const baseReligion = M.spreadReligion(
    { counts: { wiara: 10 } },
    [{ id: 'n1', distance: 1, state: { counts: {} }, population: 10 }],
    M.FALLBACK_RELIGION_PARAMS,
    { pressure: 1, seed: 7 },
  );
  const orderInput = [
    { population: 4, buildingZadowolenie: 2, ownCultureShare: 1, ownReligionShare: 1 },
    { population: 4, garnizonCount: 1, hasPalac: true },
  ];
  const baseOrder = M.evaluateOrderFromBreakdown(orderInput[0], orderInput[1], null, 'normal');

  function liveMainPath(civKey) {
    return M.runMainSocietyPath({
      civKey,
      ownerId: 7,
      city: { id: 'c1', ownerId: 7, q: 1, r: 2, population: 4 },
      ccIn: { kulturaSkumulowana: 20, ownCultureShare: 1 },
      kulturaTick: 10,
      cp: M.FALLBACK_CULTURE_PARAMS,
      curRel: { counts: { wiara: 10 } },
      relNeighbors: [{ id: 'n1', distance: 1, state: { counts: {} }, population: 10 }],
      rp: M.FALLBACK_RELIGION_PARAMS,
      difficulty: 'normal',
      builtIds: [],
      palacTier: 1,
      gCountLaw: 1,
    });
  }

  const baseLive = liveMainPath(civKeys[0]);

  ok(baseLive.ownerCivKey === civKeys[0], 'main.ts owner civ resolver reaches the exact runtime fragment');
  ok(stable(baseLive.acc) === stable(baseCulture), 'live main culture equals pure baseline');
  ok(stable(baseLive.spreadRes) === stable(baseReligion), 'live main religion equals pure baseline');
  ok(stable(baseLive.ordPctRaw.effects) === stable(baseOrder.effects), 'live main order equals pure baseline');

  for (const civKey of civKeys) {
    const live = liveMainPath(civKey);
    ok(live.ownerCivKey === civKey, `${civKey}: owner key reaches main path`);
    ok(stable(live.acc) === stable(baseCulture), `${civKey}: culture main-path parity`);
    ok(stable(live.spreadRes) === stable(baseReligion), `${civKey}: religion main-path parity`);
    ok(stable(live.ordPctRaw.effects) === stable(baseOrder.effects), `${civKey}: five order effects remain neutral`);
  }

  const unknown = liveMainPath('unknown-civilization');
  ok(unknown.ownerCivKey === 'unknown-civilization', 'unknown civ key reaches main path');
  ok(stable(unknown.acc) === stable(baseCulture), 'unknown civ culture is neutral');
  ok(stable(unknown.spreadRes) === stable(baseReligion), 'unknown civ religion is neutral');
  ok(stable(unknown.ordPctRaw.effects) === stable(baseOrder.effects), 'unknown civ order effects are neutral');

  const probeRow = matrix.cywilizacje[0];
  const societyFields = [
    'kultura_naplyw_proc',
    'religia_spread_proc',
    'porzadek_produkcja_proc',
    'porzadek_pieniadz_proc',
    'porzadek_nauka_proc',
    'porzadek_kultura_proc',
    'porzadek_wzrost_proc',
  ];
  const originalProbeValues = Object.fromEntries(
    societyFields.map(field => [field, probeRow.params[field]]),
  );
  for (const delta of [0.10, -0.10]) {
    for (const field of societyFields) probeRow.params[field] = delta;
    const live = liveMainPath(probeRow.ikonaId);
    near(live.acc.kulturaSkumulowana, 20 + 10 * (1 + delta), `${delta > 0 ? '+' : '-'}10% culture live path`);
    near(live.spreadRes.events[0].added, 1 * (1 + delta), `${delta > 0 ? '+' : '-'}10% religion live path`);
    for (const field of ['productionMult', 'pieniadzMult', 'naukaMult', 'kulturaMult', 'growthMult']) {
      near(live.ordPctRaw.effects[field], baseLive.ordPctRaw.effects[field] * (1 + delta), `${field} ${delta > 0 ? '+' : '-'}10% live path`);
    }
  }
  for (const [field, value] of Object.entries(originalProbeValues)) probeRow.params[field] = value;

  near(M.applyCivMatrixMulProc(100, 0.10), 110, '+10% mul_proc is applied');
  near(M.applyCivMatrixMulProc(100, -0.10), 90, '-10% mul_proc is applied');
  near(M.applyCivMatrixMulProc(100, Number.NaN), 100, 'non-finite mul_proc is neutral');

  console.log(`\npassed=${passed} failed=${failed}`);
  if (failed > 0) process.exitCode = 1;
} finally {
  for (const file of [ENTRY, BUNDLE]) {
    try { fs.unlinkSync(file); } catch (_) { /* already absent */ }
  }
}
