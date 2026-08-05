'use strict';
/**
 * ai-balans-step2-smoke.cjs — SMOKE metryczny AI-BALANS-STEP2 (Trudny / L3 pokój −40 Wojownik)
 * Pomiar chooseCityProduction major AI mid-game: L2 pokój · L3 pokój · L3 underThreat.
 * Run from gra/: node tools/ai-balans-step2-smoke.cjs
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[ai-balans-step2-smoke] esbuild not found');
    process.exit(1);
  }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE = path.resolve(__dirname, '.ai-balans-step2-smoke-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.ai-balans-step2-smoke-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
import { aiProductionScoreBoosts } from '../src/game/ai-production-priorities';
import { aiThreatMajorUnitScores } from '../src/game/ai-threat-mode';
import {
  chooseCityProduction,
  loadDifficultyParams,
  applyL3PeaceWarriorPenalty,
  AI_L3_PEACE_WARRIOR_SCORE_PENALTY,
  computeMajorArchetypeMilitaryFraction,
  isMajorAiOwner,
} from '../src/game/ai';

export {
  chooseCityProduction,
  loadDifficultyParams,
  applyL3PeaceWarriorPenalty,
  AI_L3_PEACE_WARRIOR_SCORE_PENALTY,
  computeMajorArchetypeMilitaryFraction,
  isMajorAiOwner,
};

export function probePeaceMidgameScores(
  mods: { wojsko: number; ekonomia: number; nauka: number; obrona: number },
  opts: { poziomTrudnosci?: number; defensiveCopy?: boolean; civAiProfile?: object },
  diffParams: { bonusProdukcja: number },
  underThreat: boolean,
): { wojownik: number; lucznik: number; stolarnia: number } {
  const panelBoost = aiProductionScoreBoosts(opts.civAiProfile as never);
  const diffProdBonus = Math.round(diffParams.bonusProdukcja * 200);
  const economyScore = 100 + mods.ekonomia * 20 + diffProdBonus + panelBoost.economy;
  const militaryScore = 100 + mods.wojsko * 20 + panelBoost.military;
  let wojownik = 170 + militaryScore;
  let lucznik = 165 + militaryScore;
  const stolarnia = 140 + economyScore;
  if (isMajorAiOwner(opts as never)) {
    const milFrac = computeMajorArchetypeMilitaryFraction(mods);
    const milBoost = Math.round((milFrac - 0.5) * 160);
    wojownik += milBoost;
    lucznik += milBoost;
    const candidates = [
      { id: 'Wojownik', score: wojownik },
      { id: 'Łucznik', score: lucznik },
      { id: 'stolarnia', score: stolarnia },
    ];
    applyL3PeaceWarriorPenalty(candidates, opts as never, underThreat);
    return {
      wojownik: candidates[0]!.score,
      lucznik: candidates[1]!.score,
      stolarnia: candidates[2]!.score,
    };
  }
  return { wojownik, lucznik, stolarnia };
}

export function probeThreatWarriorScore(
  mods: { wojsko: number },
  opts: { poziomTrudnosci?: number; defensiveCopy?: boolean },
): number {
  const militaryScore = 100 + mods.wojsko * 20;
  const threat = aiThreatMajorUnitScores(militaryScore);
  const candidates = [{ id: 'Wojownik', score: threat.wojownik }];
  applyL3PeaceWarriorPenalty(candidates, opts as never, true);
  return candidates[0]!.score;
}
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' },
    outfile: BUNDLE_FILE,
    absWorkingDir: GRA,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[ai-balans-step2-smoke] bundle failed:', e.message || e);
  process.exit(1);
}

const {
  chooseCityProduction,
  loadDifficultyParams,
  applyL3PeaceWarriorPenalty,
  AI_L3_PEACE_WARRIOR_SCORE_PENALTY,
  probePeaceMidgameScores,
  probeThreatWarriorScore,
} = require(BUNDLE_FILE);

function makeMap() {
  const hexes = {};
  for (let q = 0; q < 12; q++) {
    for (let r = 0; r < 12; r++) {
      hexes[`${q},${r}`] = {
        coords: { q, r },
        terenBazowy: 'laka',
        nakladka: 'brak',
        ulepszenie: 'brak',
        wlasciciel: null,
        wioska: { istnieje: false, ludnosc: 0 },
        widocznosc: {},
        rzeka: { obecna: false, krawedzie: [] },
      };
    }
  }
  return { szerokoscQ: 12, wysokoscR: 12, hexes, seed: 1, riverPaths: [] };
}

function makeData() {
  return {
    units: [{ Jednostka: 'Wojownik' }, { Jednostka: 'Łucznik' }],
    buildings: [
      { id: 'mury' }, { id: 'koszary' }, { id: 'spichlerz' },
      { id: 'stolarnia' }, { id: 'cegielnia' }, { id: 'magazyn' },
    ],
    terrainYields: { terrain_types: [{ Teren: 'laka', Zywnosc: 4 }] },
    aiParams: {
      ekspansja_zagroz_zasieg: { wartosc: 7 },
      trudnosc_poziom2_bonus_produkcja: { wartosc: 0 },
      trudnosc_poziom3_bonus_produkcja: { wartosc: 0 },
    },
  };
}

const ZERO = { wojsko: 0, nauka: 0, ekonomia: 0, obrona: 0 };
const map = makeMap();
const data = makeData();
const builtMid = ['koszary', 'spichlerz', 'cegielnia', 'magazyn'];

const SCENARIOS = [
  {
    id: 'baseline-5-5-5',
    label: 'Neutral 5/5/5 (3 miasta mid-game)',
    mods: ZERO,
    civAiProfile: {
      priorytetMilitarny: 5,
      priorytetEkonomia: 5,
      priorytetNauka: 5,
      ekspansywnosc: 0,
      sklonnoscDoPodboju: 0,
    },
    expectL2Pick: 'Wojownik',
    expectL3PeacePickNot: 'Wojownik',
    expectL3ThreatPick: 'Wojownik',
  },
  {
    id: 'military-8-5-5',
    label: 'Wojskowy 8/5/5',
    mods: { ...ZERO, wojsko: 2, ekonomia: -1 },
    civAiProfile: {
      priorytetMilitarny: 8,
      priorytetEkonomia: 5,
      priorytetNauka: 5,
      ekspansywnosc: 0,
      sklonnoscDoPodboju: 0,
    },
    expectL2Pick: 'Wojownik',
    expectL3PeacePick: null,
    expectL3ThreatPick: 'Wojownik',
  },
  {
    id: 'economy-5-8-5',
    label: 'Gospodarczy 5/8/5',
    mods: { ...ZERO, wojsko: -1, ekonomia: 2 },
    civAiProfile: {
      priorytetMilitarny: 5,
      priorytetEkonomia: 8,
      priorytetNauka: 5,
      ekspansywnosc: 0,
      sklonnoscDoPodboju: 0,
    },
    expectL2Pick: null,
    expectL3PeacePickNot: 'Wojownik',
    expectL3ThreatPick: null,
  },
];

function makeCities() {
  return [
    { id: 'c1', ownerId: 1, q: 5, r: 5, population: 6, name: 'A' },
    { id: 'c2', ownerId: 1, q: 8, r: 5, population: 6, name: 'B' },
    { id: 'c3', ownerId: 1, q: 2, r: 5, population: 6, name: 'C' },
  ];
}

function makeCityBuildings(cities) {
  const cb = {};
  for (const c of cities) cb[c.id] = [...builtMid];
  return cb;
}

const enemyNear = {
  id: 'e1', ownerId: 2, typeId: 'Wojownik', q: 6, r: 5, ruch: 2, ruchLeft: 2,
};

let failures = [];
const rows = [];

console.log('=== AI-BALANS-STEP2 SMOKE (Trudny) ===\n');
console.log(`Kara L3 pokój: AI_L3_PEACE_WARRIOR_SCORE_PENALTY = ${AI_L3_PEACE_WARRIOR_SCORE_PENALTY}\n`);

for (const sc of SCENARIOS) {
  const cities = makeCities();
  const cityBuildings = makeCityBuildings(cities);
  const baseOpts = {
    cityBuildings,
    currentTurn: 50,
    defensiveCopy: false,
    civAiProfile: sc.civAiProfile,
  };

  const diffL2 = loadDifficultyParams(data, 2);
  const diffL3 = loadDifficultyParams(data, 3);
  const optsL2 = { ...baseOpts, poziomTrudnosci: 2 };
  const optsL3 = { ...baseOpts, poziomTrudnosci: 3 };

  const pickL2 = chooseCityProduction(
    'c1', cities, [], 1, data, sc.mods, optsL2, map, diffL2,
  );
  const pickL3Peace = chooseCityProduction(
    'c1', cities, [], 1, data, sc.mods, optsL3, map, diffL3,
  );
  const pickL3Threat = chooseCityProduction(
    'c1', cities, [enemyNear], 1, data, sc.mods, optsL3, map, diffL3,
  );

  const scoresL2 = probePeaceMidgameScores(sc.mods, optsL2, diffL2, false);
  const scoresL3Peace = probePeaceMidgameScores(sc.mods, optsL3, diffL3, false);
  const warriorThreat = probeThreatWarriorScore(sc.mods, optsL3);

  const peaceDelta = scoresL2.wojownik - scoresL3Peace.wojownik;
  const topPeaceL3 = Math.max(scoresL3Peace.wojownik, scoresL3Peace.lucznik, scoresL3Peace.stolarnia);

  rows.push({
    scenario: sc.id,
    label: sc.label,
    pickL2,
    pickL3Peace,
    pickL3Threat,
    wojL2: scoresL2.wojownik,
    wojL3Peace: scoresL3Peace.wojownik,
    wojL3Threat: warriorThreat,
    lucznikL3Peace: scoresL3Peace.lucznik,
    stolarniaL3Peace: scoresL3Peace.stolarnia,
    peaceDelta,
    topPeaceL3,
  });

  console.log(`--- ${sc.label} (${sc.id}) ---`);
  console.log(`  L2 pokój:     pick=${pickL2}  Wojownik score=${scoresL2.wojownik}`);
  console.log(`  L3 pokój:     pick=${pickL3Peace}  Wojownik score=${scoresL3Peace.wojownik} (Δ vs L2: −${peaceDelta})`);
  console.log(`                Łucznik=${scoresL3Peace.lucznik}  stolarnia=${scoresL3Peace.stolarnia}`);
  console.log(`  L3 threat:    pick=${pickL3Threat}  Wojownik threat-score=${warriorThreat}`);

  if (peaceDelta !== AI_L3_PEACE_WARRIOR_SCORE_PENALTY) {
    failures.push(`${sc.id}: L3 pokój delta Wojownik ${peaceDelta} ≠ ${AI_L3_PEACE_WARRIOR_SCORE_PENALTY}`);
  }
  if (scoresL2.wojownik !== scoresL3Peace.wojownik + AI_L3_PEACE_WARRIOR_SCORE_PENALTY) {
    failures.push(`${sc.id}: L2 Wojownik ${scoresL2.wojownik} ≠ L3 peace ${scoresL3Peace.wojownik} + ${AI_L3_PEACE_WARRIOR_SCORE_PENALTY}`);
  }
  const milBase = 100 + sc.mods.wojsko * 20;
  const expectedThreat = 300 + milBase;
  if (warriorThreat !== expectedThreat) {
    failures.push(`${sc.id}: threat Wojownik score ${warriorThreat} ≠ expected ${expectedThreat}`);
  }

  const penaltyOffThreat = [{ id: 'Wojownik', score: 200 }];
  applyL3PeaceWarriorPenalty(penaltyOffThreat, optsL3, true);
  if (penaltyOffThreat[0].score !== 200) {
    failures.push(`${sc.id}: L3 underThreat should not apply penalty`);
  }

  const penaltyOnL2 = [{ id: 'Wojownik', score: 200 }];
  applyL3PeaceWarriorPenalty(penaltyOnL2, optsL2, false);
  if (penaltyOnL2[0].score !== 200) {
    failures.push(`${sc.id}: L2 should not apply penalty`);
  }

  if (sc.expectL2Pick && pickL2 !== sc.expectL2Pick) {
    failures.push(`${sc.id}: L2 pick ${pickL2} ≠ expected ${sc.expectL2Pick}`);
  }
  if (sc.expectL3PeacePickNot && pickL3Peace === sc.expectL3PeacePickNot) {
    failures.push(`${sc.id}: L3 pokój pick ${pickL3Peace} should not be ${sc.expectL3PeacePickNot}`);
  }
  if (sc.expectL3PeacePick && pickL3Peace !== sc.expectL3PeacePick) {
    failures.push(`${sc.id}: L3 pokój pick ${pickL3Peace} ≠ expected ${sc.expectL3PeacePick}`);
  }
  if (sc.expectL3ThreatPick && pickL3Threat !== sc.expectL3ThreatPick) {
    failures.push(`${sc.id}: L3 threat pick ${pickL3Threat} ≠ expected ${sc.expectL3ThreatPick}`);
  }

  if (scoresL3Peace.wojownik >= topPeaceL3 && pickL3Peace === 'Wojownik') {
    failures.push(`${sc.id}: L3 pokój Wojownik ma najwyższy score mimo kary — niespójność pick/score`);
  }
}

let tipSha = 'unknown';
try {
  tipSha = execSync('git rev-parse --short HEAD', { cwd: path.resolve(__dirname, '../..'), encoding: 'utf8' }).trim();
} catch (_) { /* ignore */ }

const docPath = path.resolve(__dirname, '../../docs/decyzje/AI-BALANS-STEP2-SMOKE.md');
const status = failures.length === 0 ? 'PASS' : 'FAIL';
const tableLines = [
  '# AI-BALANS-STEP2 — smoke metryczny (Trudny)',
  '',
  `**Data:** 2026-08-05 · **Tip SHA:** \`${tipSha}\` · **Wynik:** **${status}**`,
  '',
  'Automatyczny pomiar `chooseCityProduction` major AI mid-game — kara L3 pokój −40 score Wojownika (STEP2).',
  '',
  'Uruchomienie: `cd gra && node tools/ai-balans-step2-smoke.cjs`',
  '',
  '## Tabela metryk',
  '',
  '| Scenariusz | L2 pokój pick | L3 pokój pick | L3 threat pick | Wojownik L2 | Wojownik L3 pokój | Δ pokój | Łucznik L3 | stolarnia L3 | Wojownik L3 threat |',
  '|---|---|---|---|---:|---:|---:|---:|---:|---:|',
];

for (const r of rows) {
  tableLines.push(
    `| ${r.scenario} | ${r.pickL2} | ${r.pickL3Peace} | ${r.pickL3Threat} | ${r.wojL2} | ${r.wojL3Peace} | −${r.peaceDelta} | ${r.lucznikL3Peace} | ${r.stolarniaL3Peace} | ${r.wojL3Threat} |`,
  );
}

tableLines.push(
  '',
  '## Bramki smoke',
  '',
  `- Kara stała: \`${AI_L3_PEACE_WARRIOR_SCORE_PENALTY}\` pkt`,
  '- L3 + pokój: score Wojownika o 40 niższy niż L2 (identyczne inputy)',
  '- L3 + underThreat: brak kary (−40 nie stosowane)',
  '- L2: brak kary',
  `- Unit test regresji: \`node tools/ai-balans-step2-test.cjs\` (9/9)`,
  '',
  '## Odniesienia',
  '',
  '- Decyzja: `docs/decyzje/AI-BALANS-STEP2.md`',
  '- Deploy FALA 246: md5 `cbf529f3`',
  '',
);

fs.writeFileSync(docPath, tableLines.join('\n'), 'utf8');
console.log(`\nZapisano: ${docPath}`);

if (failures.length > 0) {
  console.error('\n=== SMOKE FAIL ===');
  for (const f of failures) console.error('  ✗', f);
  process.exit(1);
}

console.log('\n=== SMOKE PASS — STEP2 metryki zgodne ===');
process.exit(0);
