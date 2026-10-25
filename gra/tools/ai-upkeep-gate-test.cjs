'use strict';
/**
 * ai-upkeep-gate-test.cjs — R-WEB-AI-ARMY-UPKEEP-Q1: testy czystej bramki rekrutacji AI
 * świadomej ZAPASU utrzymania (src/game/ai-upkeep-gate.ts).
 *
 * Scenariusze właściciela (2026-10-25, ZAPAS a nie bilans):
 *   (a) duży zapas + ujemny bilans  -> rekrutacja dozwolona, dopóki runway >= próg
 *   (b) mały zapas + dodatni bilans -> dozwolona
 *   (c) mały zapas + ujemny bilans  -> zablokowana
 *   (d) zapas się kończy            -> wstrzymanie (brak rekrutacji przy runway < próg)
 * Plus: flaga domyślnie OFF, wartości brzegowe, blokada żywności, rezerwa złota.
 *
 * Run from gra/:  node tools/ai-upkeep-gate-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch (e) {
    console.error('[ai-upkeep-gate-test] esbuild not found. Run: npm ci --ignore-scripts (from gra/)');
    process.exit(1);
  }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE = path.resolve(__dirname, '.ai-upkeep-gate-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.ai-upkeep-gate-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export * from '../src/game/ai-upkeep-gate';
`, 'utf8');

let M;
try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE], bundle: true, platform: 'node', format: 'cjs',
    target: 'node18', loader: { '.ts': 'ts', '.json': 'json' },
    outfile: BUNDLE_FILE, absWorkingDir: GRA, logLevel: 'silent',
  });
  M = require(BUNDLE_FILE);
} catch (e) {
  console.error('[ai-upkeep-gate-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
} finally {
  try { fs.unlinkSync(ENTRY_FILE); } catch (_) { /* ignore */ }
  try { fs.unlinkSync(BUNDLE_FILE); } catch (_) { /* ignore */ }
}

const P = { runwayTurnsGold: 15, runwayTurnsFood: 15, marginFrac: 0.1, minReserveTurns: 1, garrisonPerCity: 1 };

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) passed++; else { failed++; console.error('FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// Bazowe wejście: zapas żywności wystarczający, zero utrzymania nowej jednostki.
function inp(over) {
  return Object.assign({
    treasury: 1000, goldNetPerTurn: 0, goldUnitCost: 50, newUnitGoldUpkeep: 0,
    foodReserve: 1000, foodNetPerTurn: 0, newUnitFoodUpkeep: 0,
  }, over);
}

// --- flaga ---
eq(M.AI_UPKEEP_AWARE_RECRUITMENT_ENABLED, false, 'flaga domyślnie OFF');
eq(M.isAiUpkeepAwareRecruitmentEnabled(), false, 'isEnabled = OFF bez override');
M.setAiUpkeepAwareRecruitmentOverride(true);
eq(M.isAiUpkeepAwareRecruitmentEnabled(), true, 'override ON');
M.setAiUpkeepAwareRecruitmentOverride(null);
eq(M.isAiUpkeepAwareRecruitmentEnabled(), false, 'override null wraca do stałej');

// --- runwayTurns (czysta funkcja) ---
eq(M.runwayTurns(100, 5), Infinity, 'bilans dodatni -> runway nieskończony');
eq(M.runwayTurns(100, 0), Infinity, 'bilans zerowy -> runway nieskończony');
eq(M.runwayTurns(100, -10), 10, 'zapas 100, deficyt 10/t -> 10 tur');
eq(M.runwayTurns(0, -10), 0, 'zapas 0 przy deficycie -> 0 tur');
eq(M.runwayTurns(-30, -10), 0, 'zapas ujemny przy deficycie -> 0 tur');
eq(M.runwayTurns(-30, 4), Infinity, 'zapas ujemny ale bilans dodatni -> nieskończony (nie blokuje same w sobie)');

// --- (a) duży zapas + ujemny bilans: dozwolona dopóki runway >= 15 ---
{
  // zapas 1000, deficyt 40/t po nowej jednostce (netto -40 - 0 = -40) -> runway 1000-50 / 40 = 23.75 >= 15
  const d = M.decideAiUpkeepRecruitment(inp({ goldNetPerTurn: -40 }), P);
  eq(d.allowed, true, '(a) duży zapas, ujemny bilans -> dozwolona');
  eq(d.reason, 'ok', '(a) powód ok');
  assert(Math.abs(d.goldRunway - (1000 - 50) / 40) < 1e-9, '(a) runway = (zapas - koszt)/deficyt');
}
{
  // ten sam bilans, ale zapas 600 -> (600-50)/40 = 13.75 < 15 -> blokada runway
  const d = M.decideAiUpkeepRecruitment(inp({ treasury: 600, goldNetPerTurn: -40 }), P);
  eq(d.allowed, false, '(a/d) zapas maleje do progu runway -> wstrzymanie');
  eq(d.reason, 'gold-runway', '(a/d) powód gold-runway');
}

// --- (b) mały zapas + dodatni bilans: dozwolona ---
{
  const d = M.decideAiUpkeepRecruitment(inp({ treasury: 60, goldUnitCost: 50, goldNetPerTurn: 12 }), P);
  eq(d.allowed, true, '(b) mały zapas, dodatni bilans -> dozwolona');
  eq(d.goldRunway, Infinity, '(b) runway nieskończony');
}
{
  // dodatni bilans, ale nowa jednostka zjada go z marginesem: 12 - 2*1.1 = 9.8 > 0
  const d = M.decideAiUpkeepRecruitment(inp({ treasury: 60, goldUnitCost: 50, goldNetPerTurn: 12, newUnitGoldUpkeep: 2 }), P);
  eq(d.allowed, true, '(b) dodatni po utrzymaniu nowej jednostki -> dozwolona');
}

// --- (c) mały zapas + ujemny bilans: zablokowana ---
{
  const d = M.decideAiUpkeepRecruitment(inp({ treasury: 80, goldUnitCost: 50, goldNetPerTurn: -10 }), P);
  eq(d.allowed, false, '(c) mały zapas, ujemny bilans -> zablokowana');
  assert(d.reason === 'gold-runway' || d.reason === 'gold-reserve', '(c) powód złoto (runway lub rezerwa)');
}

// --- (d) zapas się kończy: wstrzymanie ---
{
  const d = M.decideAiUpkeepRecruitment(inp({ treasury: 40, goldUnitCost: 50, goldNetPerTurn: -1 }), P);
  eq(d.allowed, false, '(d) zapas poniżej kosztu zakupu -> wstrzymanie');
  eq(d.reason, 'gold-stock-short', '(d) powód gold-stock-short');
}
{
  const d = M.decideAiUpkeepRecruitment(inp({ treasury: -200, goldUnitCost: 0, goldNetPerTurn: 5 }), P);
  eq(d.allowed, false, '(d) skarbiec już ujemny -> wstrzymanie nawet przy dodatnim bilansie');
  eq(d.reason, 'gold-stock-short', '(d) ujemny skarbiec -> gold-stock-short');
}

// --- rezerwa złota: runway >= 1 tura, ale rezerwa < minReserveTurns × deficyt ---
{
  const pRes = Object.assign({}, P, { runwayTurnsGold: 0, minReserveTurns: 3 });
  const d = M.decideAiUpkeepRecruitment(inp({ treasury: 100, goldUnitCost: 50, goldNetPerTurn: -20 }), pRes);
  eq(d.allowed, false, 'rezerwa: 50 < 3 × 20 -> zablokowana');
  eq(d.reason, 'gold-reserve', 'rezerwa: powód gold-reserve');
}
{
  const pRes = Object.assign({}, P, { runwayTurnsGold: 0, minReserveTurns: 3 });
  const d = M.decideAiUpkeepRecruitment(inp({ treasury: 200, goldUnitCost: 50, goldNetPerTurn: -20 }), pRes);
  eq(d.allowed, true, 'rezerwa: 150 >= 3 × 20 -> dozwolona');
}

// --- żywność: osobny runway, ta sama reguła ---
{
  const d = M.decideAiUpkeepRecruitment(inp({ foodReserve: 100, foodNetPerTurn: -10 }), P);
  eq(d.allowed, false, 'żywność: runway 10 < 15 -> zablokowana');
  eq(d.reason, 'food-runway', 'żywność: powód food-runway');
}
{
  const d = M.decideAiUpkeepRecruitment(inp({ foodReserve: 500, foodNetPerTurn: -10, newUnitFoodUpkeep: 1 }), P);
  // netto po jednostce: -10 - 1.1 = -11.1 ; runway 500/11.1 = 45 >= 15
  eq(d.allowed, true, 'żywność: duży zapas, ujemny bilans -> dozwolona');
}
{
  const d = M.decideAiUpkeepRecruitment(inp({ foodReserve: 0, foodNetPerTurn: 3 }), P);
  eq(d.allowed, true, 'żywność: zapas 0, bilans dodatni -> dozwolona (zapas nie maleje)');
}

// --- wartości brzegowe i wejścia niefinite ---
{
  const d = M.decideAiUpkeepRecruitment(inp({ goldUnitCost: 50, treasury: 50, goldNetPerTurn: 0 }), P);
  eq(d.allowed, true, 'stockAfter = 0 dokładnie -> dozwolona (brak ujemnego skarbca)');
}
{
  const d = M.decideAiUpkeepRecruitment(inp({ goldNetPerTurn: NaN }), P);
  eq(d.allowed, true, 'NaN bilans traktowany jako brak deficytu (runway Infinity)');
}
eq(M.runwayTurns(100, NaN), Infinity, 'runwayTurns: NaN netto -> Infinity');

// --- parametry z JSON ---
{
  const lp = M.loadAiUpkeepParams({});
  eq(lp.runwayTurnsGold, 15, 'domyślny runwayTurnsGold = 15');
  eq(lp.runwayTurnsFood, 15, 'domyślny runwayTurnsFood = 15');
  eq(lp.marginFrac, 0.1, 'domyślny marginFrac = 0.1');
  const lp2 = M.loadAiUpkeepParams({ runwayTurnsGold: -5, marginFrac: 'x' });
  eq(lp2.runwayTurnsGold, 0, 'ujemny próg obcięty do 0');
  eq(lp2.marginFrac, 0.1, 'nieliczbowy narzut -> domyślny');
  eq(M.AI_UPKEEP_PARAMS.runwayTurnsGold, 15, 'AI_UPKEEP_PARAMS z data/ai-upkeep-params.json');
}

// --- marginFrac: narzut bezpieczeństwa realnie zmienia decyzję (mutacja marginFrac=0 MUSI być wykryta) ---
// Utrzymanie 10 zł/tura, runway 15 => próg 150 bez narzutu, 165 z narzutem 0,1. Skarbiec 160:
// z narzutem blokada (14,5 < 15), bez narzutu dozwolone (16 >= 15).
{
  const base = { treasury: 160, goldNetPerTurn: 0, goldUnitCost: 0, newUnitGoldUpkeep: 10, foodReserve: 1e6, foodNetPerTurn: 0, newUnitFoodUpkeep: 0 };
  eq(M.decideAiUpkeepRecruitment(base, P).reason, 'gold-runway', 'marginFrac 0,1: skarbiec 160 < 165 -> blokada runway');
  eq(M.decideAiUpkeepRecruitment(base, { ...P, marginFrac: 0 }).allowed, true, 'marginFrac 0: skarbiec 160 >= 150 -> dozwolone');
}

// --- same-turn: utrzymanie jednostek kupionych w TEJ turze wchodzi do salda (zamrożone saldo nie wystarcza) ---
{
  const base = inp({ treasury: 1000, goldNetPerTurn: 0, newUnitGoldUpkeep: 10 });
  eq(M.decideAiUpkeepRecruitment(base, P).allowed, true, 'bez kupionych w turze: 1000/11 >= 15 -> dozwolone');
  const after6 = inp({ treasury: 1000, goldNetPerTurn: 0, newUnitGoldUpkeep: 10, pendingGoldUpkeep: 60 });
  eq(M.decideAiUpkeepRecruitment(after6, P).reason, 'gold-runway', 'po 6 zakupach w turze (60/tura): 1000/71 < 15 -> blokada');
  const pendFood = inp({ foodReserve: 100, foodNetPerTurn: 0, newUnitFoodUpkeep: 1, pendingFoodUpkeep: 6 });
  eq(M.decideAiUpkeepRecruitment(pendFood, P).reason, 'food-runway', 'kupione w turze żywność: 100/(6+1,1) < 15 -> blokada żywności');
}

// --- podłoga garnizonu: poniżej progu miasta zakup mimo runway, ale NIE ponad skarbiec ---
{
  const poor = inp({ treasury: 100, goldNetPerTurn: -500, newUnitGoldUpkeep: 10, cityCount: 2, militaryUnits: 0 });
  const r1 = M.decideAiUpkeepRecruitment(poor, P);
  eq(r1.allowed, true, 'podłoga: 0 wojska przy 2 miastach -> dozwolone mimo deficytu');
  eq(r1.reason, 'garrison-floor', 'podłoga: powód garrison-floor');
  // Skarbiec 1000, deficyt 111/tura: rezerwa OK (1000 >= 111), runway 9 < 15 -> gold-runway.
  const deep = inp({ treasury: 1000, goldUnitCost: 0, goldNetPerTurn: -100, newUnitGoldUpkeep: 10, cityCount: 2, militaryUnits: 2 });
  eq(M.decideAiUpkeepRecruitment(deep, P).reason, 'gold-runway', 'podłoga osiągnięta (2 >= 2) -> wraca do runway');
  eq(M.decideAiUpkeepRecruitment({ ...deep, militaryUnits: 0 }, P).reason, 'garrison-floor', 'to samo przy 0 wojska -> podłoga');
  eq(M.decideAiUpkeepRecruitment({ ...deep, militaryUnits: 0 }, { ...P, garrisonPerCity: 0 }).reason, 'gold-runway', 'garrisonPerCity=0 wyłącza podłogę');
  eq(M.decideAiUpkeepRecruitment({ ...poor, treasury: 10, goldUnitCost: 50 }, P).reason, 'gold-stock-short', 'podłoga NIE omija skarbca ujemnego po zakupie');
}

// --- parametr podłogi z JSON ---
eq(M.loadAiUpkeepParams({}).garrisonPerCity, 1, 'domyślna podłoga garnizonu = 1 na miasto');
eq(M.AI_UPKEEP_PARAMS.garrisonPerCity, 1, 'AI_UPKEEP_PARAMS.garrisonPerCity z JSON');

console.log(`ai-upkeep-gate-test: ${passed} passed, ${failed} failed`);
process.exitCode = failed ? 1 : 0;
