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
 * Trajektoria 15 AI x 3 ziarna x 150 tur: tools/no-negative-stocks-headless-measure.cjs; test turowy na realnym
 * wywolaniu: tools/no-negative-stocks-c3-turn-test.cjs.
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
  nnsAiUnitLeverInputs,
  nnsUnitIdsFromPlan,
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

// C3: dzwignie per jednostka (id `<unit>|g` zloto, `<unit>|f` zywnosc), suwak zywnosci, brak atrap.
const unitInput = M.nnsAiUnitLeverInputs([
  { id: 'a', zloto: 8, zywnosc: 0, obronna: false },
  { id: 'b', zloto: 3, zywnosc: 6, obronna: false },
  { id: 'c', zloto: 20, zywnosc: 9, obronna: true },
]);
ok(unitInput.jednostkiWsparcia.length === 3 && unitInput.jednostkiObronne.length === 2, 'C3: rozdzial wsparcie/obronne per stock');
const lv3 = M.buildAiLevers({ podatekSkarbiec: 4, suwakZywnosc: 5, ...unitInput });
ok(lv3.some(l => l.id === 'podatek-skarbiec' && l.rodzaj === 'podatek'), 'C3: dzwignia podatku');
ok(lv3.some(l => l.id === 'suwak-zywnosc' && l.stock === 'spichlerz' && l.rodzaj === 'podatek'), 'C3: dzwignia suwaka zywnosci (ranga tania)');
const d3 = M.decideAiOwnerBalance(20, -15, -9, lv3);
const ids3 = M.nnsUnitIdsFromPlan(d3.plan);
ok(d3.plan.akcje[0].rodzaj === 'podatek', 'C3: tanie srodki (podatek/suwak) przed rozwiazaniem jednostek');
ok(ids3[0] === 'a' && !ids3.includes('c'), 'C3: najdrozsza jednostka wsparcia (a=8) pierwsza, obronna (c) nigdy');
ok(new Set(ids3).size === ids3.length, 'C3: id jednostek bez duplikatow (zloto+zywnosc tej samej jednostki)');
const bezWstrz = M.buildAiLevers({ podatekSkarbiec: 0, jednostkiWsparcia: [], jednostkiObronne: [] });
ok(bezWstrz.length === 0, 'C3: bez atrap — brak pustych dzwigni wstrzymania/podatku');

// Wiazanie statyczne z main.ts (C3: rownowazenie PRZED tickiem; mutacja = usuniecie wywolania czerwieni test).
const mainTs = fs.readFileSync(path.resolve(GRA_ROOT, 'src', 'main.ts'), 'utf8');
function wired(src) {
  const idxCall = src.indexOf('nnsAiPreTickBalance({');
  const idxEcon = src.indexOf('const econ = advanceCityEconomy(');
  const idxFn = src.indexOf('function nnsAiPreTickBalance(ctx: NnsPreCtx)');
  return idxCall > 0 && idxFn > 0 && idxCall < idxEcon && idxEcon - idxCall < 2500;
}
ok(wired(mainTs), 'main.ts: nnsAiPreTickBalance wolane PRZED advanceCityEconomy (tick tej tury)');
ok(!wired(mainTs.replace('nnsAiPreTickBalance({', 'void ({')), 'MUTACJA: usuniecie wywolania nnsAiPreTickBalance czerwieni test');
const fnStart = mainTs.indexOf('function nnsAiPreTickBalance(ctx: NnsPreCtx)');
const fnBody = mainTs.slice(fnStart, fnStart + 14000);
ok(/aiNnsHoldOwners\.clear\(\);/.test(fnBody), 'main.ts: wstrzymania czyszczone per tura (w pre-ticku)');
ok(/previewCityEconomy\(/.test(fnBody) && /projectEmpireFoodAfterTick\(/.test(fnBody) && /projectTreasuryAfterTick\(/.test(fnBody), 'main.ts: projekcja po ticku (realne preview + realny advanceEmpireFood na kopii)');
ok(/decideAiOwnerBalance\(turn, cur\.skPo, cur\.spPo, levers\)/.test(fnBody), 'main.ts: decyzja z projekcji PRZED tickiem');
ok(/podatekSkarbiec: podatekZysk/.test(fnBody) && /suwakZywnosc: rationZysk/.test(fnBody), 'main.ts: dzwignie podatku i suwaka zywnosci z modelu (what-if), nie stale 0');
ok(!/podatekSkarbiec: 0/.test(mainTs) && !/wstrzymania: \[\]/.test(mainTs), 'main.ts: brak atrap `podatekSkarbiec: 0` / `wstrzymania: []`');
ok(!/decideAiOwnerBalance\(turn, aiSkarb/.test(mainTs), 'main.ts: brak rownowazenia PO ticku w bankowaniu AI');
ok(/const project = /.test(fnBody), 'main.ts: funkcja project() (jedna projekcja na wlasciciela; what-if tylko przy minusie)');
ok(/!aiNnsHoldOwners\.has\(ownerId\)\s*&&\s*shouldAIPurchaseUnit/.test(mainTs), 'main.ts: bramka zakupow AI (aiNnsHoldOwners)');
ok(/if \(aiNnsHoldOwners\.has\(ownerId\)\) continue;\s*\n\s*const def = data\.buildings\.find/.test(mainTs), 'main.ts: wstrzymanie budowy AI (aiNnsHoldOwners)');
ok(/function disbandAiSupportUnit\(unitId: string, ownerId: number\)/.test(mainTs), 'main.ts: disbandAiSupportUnit zdefiniowana');
ok(/units\.splice\(idx, 1\);\s*\n\s*if \(wasGarnizon && cityForGarnizon\) syncGarnizonForCity\(cityForGarnizon\);\s*\n\s*clearPlannedMarch\(unitId, true\);/.test(mainTs), 'main.ts: disbandAiSupportUnit sprzata garnizon i stan marszu');
const dStart = mainTs.indexOf('function disbandAiSupportUnit');
ok(/refundManpowerToEmpire\(cities, ownerId, ep,/.test(mainTs.slice(dStart, dStart + 1400)), 'main.ts: zwrot Manpower przy rozwiazaniu AI (parytet z graczem)');
ok(/function nnsProtectedDefenderIds/.test(mainTs), 'main.ts: ochrona ostatniego obroncy kazdego miasta');
ok(/nnsUnitIdsFromPlan\(dec\.plan\)/.test(fnBody) && /disbandAiSupportUnit\(uid, oid\)/.test(fnBody), 'main.ts: rozwiazanie jednostek z planu wpiete');

try { fs.unlinkSync(BUNDLE); } catch (_) {}
console.log(`no-negative-stocks-c2-test: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
