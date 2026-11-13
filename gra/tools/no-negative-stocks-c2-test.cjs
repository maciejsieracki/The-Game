'use strict';
/**
 * no-negative-stocks-c2-test.cjs — R-WEB-ECON-NO-NEGATIVE-STOCKS-C-Q1 (etap C2, runda 3 obrony).
 *
 * Sprawdza:
 *  - decideAiOwnerBalance: brama tury (tury 1–10 wolne), flaga wylaczona (mutacja pomiarowa
 *    w logice: bez minusa nie ma wstrzymania ani rozwiazania), wstrzymanie zakupow,
 *    wybor jednostek wsparcia od najdrozszej, brak rozwiazania jednostek obronnych,
 *  - kara deficytu Zlota przy WYMUSZONYM minusie skarbca (advanceGoldDeficit +
 *    applyGoldDeficitStatMultToCombatUnit): licznik tur, karencja, oslabienie statow,
 *  - wiazanie z main.ts (statyczne): projekcja po ticku i wywolanie decideAiOwnerBalance w
 *    bankowaniu AI, czyszczenie wstrzymań PRZED bankowaniem kazdej tury (aiNnsHoldOwners.clear),
 *    bramka zakupow aiNnsHoldOwners, disbandAiSupportUnit (sprzata marsz), brak martwego importu.
 *
 * NIE mierzy trajektorii 15 AI x 3 ziarna x 150 tur: runner headless NIE_ZROBIONE w tej rundzie
 * (patrz 30-obrona-claude.md). Test pokrywa logike i wiazanie, nie przebieg gry.
 *
 * Run: node tools/no-negative-stocks-c2-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.no-negative-stocks-c2-entry.ts');
const BUNDLE = path.resolve(__dirname, '.no-negative-stocks-c2-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  buildAiLevers,
  decideAiOwnerBalance,
  setNnsAiBalanceEnabled,
  isNnsAiBalanceEnabled,
  NNS_AI_BALANCE_TURN_MIN,
} from '../src/game/no-negative-stocks';
export {
  advanceGoldDeficit,
  buildGoldDeficitParams,
  applyGoldDeficitStatMultToCombatUnit,
  clearLastGoldDeficitTicks,
} from '../src/game/gold-deficit';
`, 'utf8');

let M;
try {
  esbuild.buildSync({
    entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
    target: 'node18', outfile: BUNDLE, absWorkingDir: GRA_ROOT, logLevel: 'silent',
  });
  M = require(BUNDLE);
} finally {
  try { fs.unlinkSync(ENTRY); } catch (_) {}
}
let passed = 0, failed = 0;
function ok(cond, label) {
  if (cond) { passed++; } else { failed++; console.error('FAIL:', label); }
}

const levers = M.buildAiLevers({
  podatekSkarbiec: 0,
  wstrzymania: [],
  jednostkiWsparcia: [
    { id: 'tani', stock: 'skarbiec', zysk: 2, koszt: 3 },
    { id: 'drogi', stock: 'skarbiec', zysk: 2, koszt: 9 },
  ],
  jednostkiObronne: [{ id: 'mur', stock: 'skarbiec', zysk: 5, koszt: 50 }],
});

// Brama tury: tury 1–10 wolne.
ok(M.NNS_AI_BALANCE_TURN_MIN === 11, 'prog tury = 11');
const wolna = M.decideAiOwnerBalance(10, -5, 0, levers);
ok(wolna.aktywne === false && wolna.rozwiazJednostki.length === 0, 'tura 10: brak rownowazenia');

// Brak minusu: nieaktywne.
const czysto = M.decideAiOwnerBalance(20, 100, 100, levers);
ok(czysto.aktywne === false && czysto.wstrzymajZakupy === false, 'brak minusu: nieaktywne');

// Minus skarbca w turze 20: aktywne, zakupy wstrzymane, najdrozsze wsparcie pierwsze.
const d = M.decideAiOwnerBalance(20, -3, 0, levers);
ok(d.aktywne === true, 'minus skarbca: aktywne');
ok(d.wstrzymajZakupy === true, 'minus skarbca: zakupy wstrzymane');
ok(d.rozwiazJednostki[0] === 'drogi', 'najdrozsza jednostka wsparcia pierwsza');
ok(!d.rozwiazJednostki.includes('mur'), 'jednostka obronna nigdy nie rozwiazywana');
ok(d.plan.pokryte === true, 'brak 3 pokryty dwiema jednostkami (zysk 2+2)');

// Mutacja pomiarowa w logice (flaga wylaczona, minus obecny): nic sie nie dzieje.
M.setNnsAiBalanceEnabled(false);
const wyl = M.decideAiOwnerBalance(20, -3, -3, levers);
ok(wyl.aktywne === false && wyl.rozwiazJednostki.length === 0 && wyl.wstrzymajZakupy === false, 'flaga off: brak dzialania');
ok(M.isNnsAiBalanceEnabled() === false, 'flaga off odczytywalna');
M.setNnsAiBalanceEnabled(true);
ok(M.isNnsAiBalanceEnabled() === true, 'flaga przywrocona na wlaczona (domyslnie)');

// Kara deficytu Zlota przy WYMUSZONYM minusie skarbca (sciezka advanceGoldDeficit z tury).
const gdParams = M.buildGoldDeficitParams({});
ok(gdParams.zlotoDeficytKarencjaTur === 3, 'kara: karencja domyslnie 3 tury');
ok(gdParams.zlotoDeficytStatMult === 0.75, 'kara: mnoznik statow domyslnie 0,75');
const gdStates = new Map();
let forcedTreasury = -3;
const getTreasury = () => forcedTreasury;
const t1 = M.advanceGoldDeficit([7], gdStates, getTreasury, gdParams);
ok(t1.byOwner.get(7).deficytZlota === true && t1.byOwner.get(7).turyDeficytuZlotaPo === 1, 'kara: tura 1 minusu liczona');
ok(t1.byOwner.get(7).zlotoDeficytAtrycjaAktywna === false, 'kara: atrycja HP dopiero po karencji');
M.advanceGoldDeficit([7], gdStates, getTreasury, gdParams);
const t3 = M.advanceGoldDeficit([7], gdStates, getTreasury, gdParams);
ok(t3.byOwner.get(7).turyDeficytuZlotaPo === 3, 'kara: 3 kolejne tury minusu');
ok(t3.byOwner.get(7).zlotoDeficytAtrycjaAktywna === true, 'kara: atrycja aktywna po karencji');
forcedTreasury = 50;
const tOk = M.advanceGoldDeficit([7], gdStates, getTreasury, gdParams);
ok(tOk.byOwner.get(7).turyDeficytuZlotaPo === 0, 'kara: wyjscie na plus zeruje licznik');
M.clearLastGoldDeficitTicks();
const cuBase = { meleeAttack: 100, meleeDefence: 100, weaponDamage: 100, piercing: 100,
  chargeBonus: 100, health: 100, missileAttack: 100, armor: 100, 'Prog dezercji (% health)': 40 };
const cuOsl = M.applyGoldDeficitStatMultToCombatUnit(cuBase, gdParams.zlotoDeficytStatMult);
ok(cuOsl.meleeAttack === 75 && cuOsl.health === 75, 'kara: staty bojowe x0,75');
ok(cuOsl.armor === 100, 'kara: pancerz bez zmian');

// Wiazanie statyczne z main.ts.
const mainTs = fs.readFileSync(path.resolve(GRA_ROOT, 'src', 'main.ts'), 'utf8');
const idxClear = mainTs.indexOf('aiNnsHoldOwners.clear();');
const idxLoop = mainTs.indexOf('for (const oid of aiOwnerIds) {', idxClear);
const idxDecide = mainTs.indexOf('decideAiOwnerBalance(turn, aiSkarb, nnsSpichlerzPo, nnsLevers)');
ok(idxClear > 0 && idxLoop > idxClear && idxLoop - idxClear < 400, 'main.ts: aiNnsHoldOwners.clear() tuz przed petla bankowania AI');
ok(idxDecide > idxLoop, 'main.ts: decideAiOwnerBalance w petli bankowania AI (po czyszczeniu)');
ok(/getEmpireFoodReserve\(oid\);\s*\n\s*if \(aiSkarb < 0 \|\| nnsSpichlerzPo < 0\)/.test(mainTs), 'main.ts: projekcja po ticku (aiSkarb, spichlerz) przed decyzja');
ok(/!aiNnsHoldOwners\.has\(ownerId\)\s*&&\s*shouldAIPurchaseUnit/.test(mainTs), 'main.ts: bramka zakupow AI (aiNnsHoldOwners)');
ok(/function disbandAiSupportUnit\(unitId: string, ownerId: number\)/.test(mainTs), 'main.ts: disbandAiSupportUnit zdefiniowana');
ok(/units\.splice\(idx, 1\);\s*\n\s*clearPlannedMarch\(unitId, true\);/.test(mainTs), 'main.ts: disbandAiSupportUnit sprzata stan marszu');
ok(/for \(const uid of nnsDec\.rozwiazJednostki\) disbandAiSupportUnit\(uid, oid\)/.test(mainTs), 'main.ts: rozwiazanie jednostek wsparcia wpiete');
ok(!/isNnsAiBalanceEnabled/.test(mainTs), 'main.ts: brak martwego importu isNnsAiBalanceEnabled');

try { fs.unlinkSync(BUNDLE); } catch (_) {}
console.log(`no-negative-stocks-c2-test: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
