'use strict';
/**
 * Executable evidence for R-AI-BUDZET-SKARB-NAUKA-ZAMOZNOSC-Q1.
 * Run from gra/: node tools/ai-budzet-skarb-nauka-zamoznosc-audit.cjs
 *
 * This is an audit, not a second economy implementation: city yield, AI slider,
 * difficulty, and Wealth calculations are imported from src/ and exercised below.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.ai-budget-audit-entry.ts');
const BUNDLE = path.resolve(__dirname, '.ai-budget-audit-bundle.cjs');
fs.writeFileSync(ENTRY, `
import { loadGameData } from '../src/data/loader';
import { loadEconParams, cityYieldPerTurn } from '../src/game/economy';
import { decideAIEconomySliders, loadAiSliderParams, loadDifficultyParams } from '../src/game/ai';
import { difficultyProductionMultiplier, difficultyScienceBonusPerTurn, difficultyCombatMultiplier } from '../src/game/ai-difficulty-bonus';
import { advanceWealth, freshWealthState, loadWealthParams } from '../src/game/wealth';
export { loadGameData, loadEconParams, cityYieldPerTurn, decideAIEconomySliders,
  loadAiSliderParams, loadDifficultyParams, difficultyProductionMultiplier,
  difficultyScienceBonusPerTurn, difficultyCombatMultiplier, advanceWealth,
  freshWealthState, loadWealthParams };
`, 'utf8');
try {
  esbuild.buildSync({
    entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
    target: 'node18', loader: { '.ts': 'ts', '.json': 'json' },
    outfile: BUNDLE, absWorkingDir: GRA, logLevel: 'silent',
  });
} finally {
  try { fs.unlinkSync(ENTRY); } catch (_) { /* noop */ }
}

let passed = 0;
let failed = 0;
function ok(condition, message) {
  if (condition) { passed++; console.log(`PASS: ${message}`); }
  else { failed++; console.log(`FAIL: ${message}`); }
}
function near(value, expected, message) {
  ok(Math.abs(value - expected) < 1e-9, `${message} (got ${value}, expected ${expected})`);
}
function boundedRelative(values, message) {
  const normal = values.normal;
  ok(values.easy < normal && normal < values.hard, `${message}: easy < normal < hard`);
  ok(Math.abs(values.easy / normal - 1) <= 0.5 && Math.abs(values.hard / normal - 1) <= 0.5,
    `${message}: each difficulty is within ±50% of normal`);
}

const M = require(BUNDLE);
const data = M.loadGameData();
const rawEcon = JSON.parse(fs.readFileSync(path.resolve(GRA, 'data', 'econ-params.json'), 'utf8'));
const levels = { easy: 1, normal: 2, hard: 3 };
const difficultyParams = {};
for (const difficulty of Object.keys(levels)) {
  difficultyParams[difficulty] = M.loadDifficultyParams(data, levels[difficulty]);
}

console.log('-- A. Real difficulty consumers and formulas --');
const production = {};
const scienceBase20 = {};
for (const [difficulty, p] of Object.entries(difficultyParams)) {
  production[difficulty] = M.difficultyProductionMultiplier(p.bonusProdukcja);
  scienceBase20[difficulty] = 20 + M.difficultyScienceBonusPerTurn(p.bonusNauka);
}
const combat = {};
for (const [difficulty, p] of Object.entries(difficultyParams)) {
  combat[difficulty] = M.difficultyCombatMultiplier(p.bonusWalka);
}
boundedRelative(production, 'Praca: 1 + max(0, bonusProdukcja)');
boundedRelative(scienceBase20, 'Nauka: baza + max(0, bonusNauka), baza=20');
near(combat.easy, 0.95, 'Walka easy: 1 + bonusWalka (-5%)');
near(combat.normal, 1, 'Walka normal: 1 + bonusWalka (neutralny)');
near(combat.hard, 1.05, 'Walka hard: 1 + bonusWalka (+5%)');
boundedRelative(combat, 'Walka: efektywny mnożnik');

console.log('-- B. Slider decision and source parameters --');
const sliderParams = {};
for (const difficulty of Object.keys(levels)) sliderParams[difficulty] = M.loadAiSliderParams(rawEcon, difficulty);
for (const [difficulty, p] of Object.entries(sliderParams)) {
  const r = M.decideAIEconomySliders({
    zapasyPanstwa: 25, atWar: false, turn: 10, lastSliderChangeTurn: null,
    current: { procentRozwoj: 70, procentBudynki: 70, procentNauka: 20 },
    isMajorAi: true, isEarlyGame: false, treasuryGold: 100, upkeepGoldCost: 10,
  }, p);
  ok(r.procentBudynki === 50 && r.procentNauka === 60,
    `Suwaki ${difficulty}: major AI kończy na Praca=50%, Nauka=60% (konfiguracja ${JSON.stringify(p)})`);
}

console.log('-- C. 3 seeds × 3 difficulties × 20 turns: actual yield/treasury/science/Wealth path --');
const econParams = M.loadEconParams(data, 'normal');
const auditBuildings = [
  { id: 'targowisko', level: 3 },
  { id: 'biblioteka', level: 1 },
  { id: 'stolarnia', level: 3 },
].map(({ id, level }) => ({ record: data.buildings.find(b => b.id === id), level }));
if (auditBuildings.some(entry => !entry.record)) throw new Error('audit fixture: missing building data');
const seeds = [9191, 4242, 7777];
const summaries = [];
for (const seed of seeds) {
  for (const difficulty of Object.keys(levels)) {
    const p = difficultyParams[difficulty];
    let treasury = 100;
    let scienceBank = 0;
    let wealthState = M.freshWealthState();
    let totalWork = 0;
    let totalScience = 0;
    let totalMoney = 0;
    let totalSociety = 0;
    for (let turn = 1; turn <= 20; turn++) {
      const city = {
        id: `audit-${seed}`, ludnosc: 3, zdrowie: 0, czyStolica: true,
        maSpichlerz: false, maAkwedukt: false, magazynZywnosci: 0,
        specjalisci: [], kolejkaProdukcji: [],
        podziałHandlu: { procentNauka: 60, procentPieniadz: 30, procentLuksus: 10 },
        podziałPracy: { procentBudynki: 50 },
      };
      const tile = {
        terenBazowy: 'laka', nakladka: 'brak', maRzeke: false,
        ulepszeniaKeys: [],
      };
      const yieldResult = M.cityYieldPerTurn(city, [tile], auditBuildings, econParams, {
        strataFraction: 0, maTargowisko: false, maBiblioteka: false,
        maAkademia: false, walutaOdkrytaOnly: false, maMennica: false,
        wojskoZuzycieZywnosci: 0,
      });
      const work = Math.floor(yieldResult.praca * M.difficultyProductionMultiplier(p.bonusProdukcja));
      const science = yieldResult.nauka + M.difficultyScienceBonusPerTurn(p.bonusNauka);
      const money = yieldResult.pieniadz;
      const society = yieldResult.luksus;
      // A different deterministic army/building upkeep per seed keeps the
      // treasury trace non-identical without inventing an economy formula.
      const upkeep = 2 + (seed % 3);
      treasury += money - upkeep;
      scienceBank += science;
      wealthState = M.advanceWealth(wealthState, society, money, 1, M.loadWealthParams(rawEcon, difficulty));
      totalWork += work; totalScience += science; totalMoney += money; totalSociety += society;
    }
    const row = {
      seed, difficulty, turns: 20, work: totalWork, science: totalScience,
      money: totalMoney, society: totalSociety, treasuryAfter: treasury,
      scienceBank, wealthLevel: wealthState.poziom, wealthPool: wealthState.pula,
    };
    summaries.push(row);
    console.log(JSON.stringify(row));
  }
}
for (const seed of seeds) {
  const rows = summaries.filter(row => row.seed === seed);
  const work = Object.fromEntries(rows.map(row => [row.difficulty, row.work]));
  const science = Object.fromEntries(rows.map(row => [row.difficulty, row.science]));
  boundedRelative(work, `seed ${seed}: realna Praca po 20 turach`);
  boundedRelative(science, `seed ${seed}: realna Nauka po 20 turach`);
  ok(rows.every(row => Number.isFinite(row.treasuryAfter) && Number.isFinite(row.scienceBank)
    && Number.isFinite(row.wealthLevel) && Number.isFinite(row.wealthPool)),
  `seed ${seed}: skarbiec, bank Nauki i Wealth pozostają skończone`);
}

console.log('-- D. Live call-site guard --');
const mainSource = fs.readFileSync(path.resolve(GRA, 'src', 'main.ts'), 'utf8');
const turnEconomySource = fs.readFileSync(path.resolve(GRA, 'src', 'game', 'turn-economy.ts'), 'utf8');
ok(mainSource.includes('aiEcon.nauka + difficultyScienceBonusForOwner(oid)'),
  'main.ts bankuje Nauka miasta + bonus trudności');
ok(mainSource.includes('const scaledDoBudynkow = econTick.doBudynkow * prodMult'),
  'main.ts skaluje Praca przed pulą/produkcją');
ok(mainSource.includes('aiSkarbiecByOwner.set(oid, aiSkarb)'),
  'main.ts zapisuje skarbiec AI po utrzymaniu');
ok(mainSource.includes('function difficultyBattleOpts(')
  && mainSource.includes('attackerDifficultyCombatMult: difficultyCombatMultForOwner(atkOwnerId)')
  && mainSource.includes('defenderDifficultyCombatMult: difficultyCombatMultForOwner(defOwnerId)'),
  'main.ts buduje mnożniki walki per właściciel');
ok((mainSource.match(/\.\.\.difficultyBattleOpts\(/g) || []).length >= 2,
  'main.ts przekazuje mnożniki do obu żywych scen walki');
ok(turnEconomySource.includes('advanceWealth(') && turnEconomySource.includes('yld.luksus'),
  'turn-economy.ts prowadzi strumień luksusu do Wealth');

console.log(`\nai-budzet-skarb-nauka-zamoznosc-audit: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(BUNDLE); } catch (_) { /* noop */ }
process.exit(failed === 0 ? 0 : 1);
