'use strict';
/**
 * starvation-no-food-gate-test.cjs — R-WEB-STARVATION-IMPL-Q44A (Q42=C, Q44=A).
 *
 * Kontrakt „tura gracza przechodzi z ujemnym zapasem żywności; głód wojska jako skutek”:
 *  1) decideEndTurnGate z ignorujZywnosc: brak blokady z powodu spichlerza; skarbiec nadal blokuje;
 *     bez opcji (ścieżka AI / inne wywołania) blokada żywności bez zmian.
 *  2) Wiring main.ts (source-scan, bo main.ts nie da się zaimportować): nnsGateForPlayer przekazuje
 *     ignorujZywnosc: true; ścieżka AI nie dostaje opcji; advanceSeat pokazuje komunikat o głodzie
 *     wojska tylko przy ujemnym zapasie po prognozie.
 *  3) Scenariusz tury bez żywności (Trudny, 2 jednostki): zapas państwa 0 po clampie, atrycja głodu
 *     od 3. tury z rzędu (karencja), jednostka traci 10% maxHP od 3. tury; miasto nie traci ludności
 *     z powodu deficytu wojska (advanceEmpireFood nie modyfikuje ludności; mechanizm ludności liczony
 *     w applyPostCentralPopulationGrowth — patrz dokument GLOD-WDROZENIE-Q44A, sekcja NIE ZMIERZONO).
 *
 * Mutacje semantyczne (muszą czerwienić test):
 *  M1: usunięcie opcji ignorujZywnosc z bramki (decideEndTurnGate) → sekcja 1.
 *  M2: main.ts `ignorujZywnosc: true` zamienione na `false` → sekcja 2.
 *  M3: usunięcie komunikatu o głodzie w advanceSeat → sekcja 2.
 *  M4: hpFrac Trudny 0,10 zmienione na 0,08 → sekcja 3.
 *
 * Run: node tools/starvation-no-food-gate-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.starvation-no-food-gate-entry.ts');
const BUNDLE = path.resolve(__dirname, '.starvation-no-food-gate-bundle.cjs');
fs.writeFileSync(ENTRY, `
export { decideEndTurnGate } from '../src/game/no-negative-stocks';
export {
  advanceEmpireFood, freshEmpireFoodState, buildEmpireFoodParams,
  isArmyStarving, clearLastEmpireFoodTicks,
} from '../src/game/empire-food';
export { applyArmyStarvationHpLoss } from '../src/game/army-starvation';
`, 'utf8');
esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, absWorkingDir: GRA_ROOT, logLevel: 'silent',
});
const M = require(BUNDLE);

let passed = 0, failed = 0;
function ok(cond, label) {
  if (cond) passed++; else { failed++; console.error('FAIL:', label); }
}

// ---------------------------------------------------------------------------
// 1) Bramka decideEndTurnGate
// ---------------------------------------------------------------------------
const ZYW = { ignorujZywnosc: true, suwakZywnosc: 10, podatekSkarbiec: 0 };
// Tura 16 (po oknie łaski): zapas żywności ujemny po turze, skarbiec dodatni.
const food = { turn: 16, skarbiecObecny: 100, skarbiecPo: 100, spichlerzObecny: 5, spichlerzPo: -18 };
{
  const g = M.decideEndTurnGate(food, 0, 0, ZYW);
  ok(g.blokada === false, 'gracz: ujemna żywność nie blokuje tury (ignorujZywnosc)');
  ok(g.komunikat === '', 'gracz: brak komunikatu blokady dla żywności');
}
{
  const g = M.decideEndTurnGate(food, 0, 0, { suwakZywnosc: 10 });
  ok(g.blokada === true && g.zasob === 'spichlerz', 'bez opcji: ujemna żywność blokuje (AI bez zmian)');
}
{
  const g = M.decideEndTurnGate({ ...food, skarbiecPo: -20 }, 0, 0, { ...ZYW, podatekSkarbiec: 5 });
  ok(g.blokada === true && g.zasob === 'skarbiec', 'skarbiec<0 nadal blokuje przy ignorujZywnosc');
}
{
  const g = M.decideEndTurnGate({ ...food, spichlerzPo: 3 }, 0, 0, ZYW);
  ok(g.blokada === false, 'dodatnia żywność: brak blokady');
}

// ---------------------------------------------------------------------------
// 2) Wiring main.ts (source-scan)
// ---------------------------------------------------------------------------
const mainSrc = fs.readFileSync(path.join(GRA_ROOT, 'src', 'main.ts'), 'utf8');
const lines = mainSrc.split('\n');
const gateBlockStart = lines.findIndex(l => /function\s+nnsGateForPlayer|nnsGateForPlayer\s*=/.test(l));
let gateBlock = '';
if (gateBlockStart >= 0) gateBlock = lines.slice(gateBlockStart, gateBlockStart + 60).join('\n');
ok(gateBlockStart >= 0, 'main.ts: znaleziono nnsGateForPlayer');
ok(/ignorujZywnosc:\s*true/.test(gateBlock), 'main.ts: nnsGateForPlayer przekazuje ignorujZywnosc: true');
ok(/decideEndTurnGate\(\s*live\s*,\s*_nnsZyskSkarbiec\s*,\s*_nnsZyskSpichlerz\s*,\s*levers\s*\)/.test(gateBlock),
  'main.ts: nnsGateForPlayer wywołuje decideEndTurnGate z levers');
ok((mainSrc.match(/ignorujZywnosc:\s*true/g) || []).length === 1,
  'main.ts: ignorujZywnosc: true tylko w ścieżce gracza (AI bez opcji)');
ok(!/decideAiOwnerBalance[^\n]*ignorujZywnosc/.test(mainSrc), 'main.ts: ścieżka AI nie używa ignorujZywnosc');

const HINT = 'Brak żywności: wojsko słabnie w walce, od 3. tury z rzędu jednostki tracą zdrowie.';
const hintIdx = lines.findIndex(l => l.includes(HINT));
ok(hintIdx >= 0, 'main.ts: komunikat o głodzie wojska obecny');
const hintCtx = hintIdx >= 0 ? lines.slice(Math.max(0, hintIdx - 8), hintIdx + 1).join('\n') : '';
ok(/spPo\s*<\s*0/.test(hintCtx), 'main.ts: komunikat o głodzie pokazywany tylko przy ujemnym zapasie po prognozie');

// ---------------------------------------------------------------------------
// 3) Scenariusz: Trudny (hpFrac 0,10), 2 jednostki, zero żywności, 6 tur
// ---------------------------------------------------------------------------
M.clearLastEmpireFoodTicks();
const upkeep = {
  jednostkaUtrzymanieStd: 1,
  zywnoscJednostkaRuch: 1,
  zywnoscJednostkaOboz: 0.5,
  zywnoscMnoznikTerytorium: 1,
  zywnoscMnoznikPozaTerytorium: 2,
};
const paramsHard = M.buildEmpireFoodParams({
  glod_wojska_hp_frac: { hard: 0.10 },
  glod_wojska_karencja_tur: { hard: 3 },
  spichlerz_pojemnosc_zapasow_panstwa: { hard: 100 },
}, 'hard');
ok(Math.abs(paramsHard.glodWojskaHpFrac - 0.10) < 1e-9, 'Trudny: glod_wojska_hp_frac = 0,10');
ok(paramsHard.glodWojskaKarencjaTur === 3, 'Trudny: karencja 3 tury');

{
  const states = new Map([[0, M.freshEmpireFoodState(0)]]);
  // Brak produkcji żywności (zywnoscNetto 0), 2 jednostki własne: koszt 2 x 4 = 8/turę > 0 zapasu.
  const econ = { perCity: [{ ownerId: 0, zywnoscNetto: 0, oblegany: false, procentRozwoj: 100 }] };
  const units = [
    { id: 'u1', ownerId: 0, typeId: 'woj', camping: false, onOwnTerritory: true, hp: 100, hpMax: 100 },
    { id: 'u2', ownerId: 0, typeId: 'woj', camping: false, onOwnTerritory: true, hp: 100, hpMax: 100 },
  ];
  const hpAfter = [];
  for (let t = 1; t <= 6; t++) {
    const res = M.advanceEmpireFood(econ, units, states, upkeep, paramsHard);
    const tick = res.byOwner.get(0);
    // Tura przechodzi: silnik nie blokuje tury; zapas po clampie = 0, deficyt widoczny jako głód.
    ok(tick.zapasyPo === 0, `tura ${t}: zapas państwa clampowany do 0`);
    ok(tick.glodWojska === true, `tura ${t}: głód wojska wykryty`);
    if (M.isArmyStarving(0)) {
      M.applyArmyStarvationHpLoss(units, 0, paramsHard.glodWojskaHpFrac, () => 100);
    }
    hpAfter.push(units[0].hp);
  }
  // Karencja: tury 1–2 bez utraty HP; od 3. tury 10% maxHP (10 pkt) co turę.
  ok(hpAfter[0] === 100 && hpAfter[1] === 100, 'tury 1–2 (karencja): brak utraty zdrowia');
  ok(hpAfter[2] === 90, 'tura 3: jednostka traci 10% maxHP (100 → 90)');
  ok(hpAfter[3] === 80, 'tura 4: kolejne 10% (90 → 80)');
  ok(hpAfter[5] === 60, 'tura 6: po 4 turach atrycji 60 HP');
  ok(units.every(u => u.hp > 0), 'jednostki nie giną w krótkim scenariuszu');
}

console.log(`starvation-no-food-gate-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }
process.exit(failed === 0 ? 0 : 1);
