'use strict';
/**
 * ai-free-unit-upkeep-test.cjs -- R-WEB-AI-FREE-UNIT-UPKEEP-40-TURNS-Q1.
 * Run from gra/:  node tools/ai-free-unit-upkeep-test.cjs
 *
 * Decyzja właściciela 2026-11-22: AI nie płaci utrzymania jednostek wojskowych w turach 1..40
 * (złoto, surowce, żywność); od tury 41 pełny koszt; gracz-człowiek bez zmian.
 *
 * Zakres:
 *   (a) czysta funkcja aiFreeUnitUpkeepActive (1, 40 = aktywne; 41 = nieaktywne; gracz; flaga off)
 *   (b) tempo paceUtrzymaniaWlasciciela + mnoznikUtrzymaniaJednostek(0) = 0
 *   (c) silnik: previewOwnerUpkeep (złoto) i militaryFoodConsumptionWithSpichlerz (żywność)
 *       dla AI przy 'wysoki' w turze 40 = 0, w turze 41 = pełne ×4; gracz w turze 40 = pełne ×4
 *   (d) bramka rekrutacji AI (aiUpkeepRunwayAllowsRecruit) na danych okna vs po oknie
 *   (e) wiring: źródła wołają punkt wejścia (pin tekstowy)
 *
 * Mutacja (ręczna, opisana w raporcie): zdjęcie warunku `turn <= params.tury` musi dać czerwony test.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA, 'node_modules', 'esbuild'));
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-free-upkeep-'));
const ENTRY = path.join(TMP, 'entry.ts');
const BUNDLE = path.join(TMP, 'bundle.cjs');

fs.writeFileSync(ENTRY, [
  `export * from ${JSON.stringify(path.join(GRA, 'src/game/ai-free-unit-upkeep'))};`,
  `export * from ${JSON.stringify(path.join(GRA, 'src/game/unit-cost-tempo'))};`,
  `export * from ${JSON.stringify(path.join(GRA, 'src/game/ai-upkeep-runway'))};`,
  `export { previewOwnerUpkeep, totalUnitUpkeep, totalUnitResourceUpkeep, unitFoodPerTurn, buildUnitUpkeepTable, buildUnitFoodTable } from ${JSON.stringify(path.join(GRA, 'src/game/economy-upkeep'))};`,
  `export { previewOwnerUpkeep as previewTurn, militaryFoodConsumptionWithSpichlerz } from ${JSON.stringify(path.join(GRA, 'src/game/turn-economy'))};`,
  `export { loadUpkeepParams } from ${JSON.stringify(path.join(GRA, 'src/game/economy-upkeep'))};`,
].join('\n') + '\n', 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
    target: 'node18', loader: { '.ts': 'ts', '.json': 'json' }, outfile: BUNDLE,
    absWorkingDir: GRA, logLevel: 'silent',
  });
} catch (e) {
  console.error('[ai-free-unit-upkeep-test] bundle failed:', e.message);
  process.exit(1);
}

const M = require(BUNDLE);
const assert = require('assert');

let pass = 0;
let fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ok   ' + name); }
  catch (e) { fail++; console.log('  FAIL ' + name + '\n       ' + e.message); }
}

const P_ON = { wlaczone: true, tury: 40 };
const P_OFF = { wlaczone: false, tury: 40 };
const AI = 1;
const HUMAN = 0;

console.log('-- (a) aiFreeUnitUpkeepActive --');
t('tura 1 AI = aktywne', () => assert.equal(M.aiFreeUnitUpkeepActive(AI, 1, false, P_ON), true));
t('tura 40 AI = aktywne (wlacznie)', () => assert.equal(M.aiFreeUnitUpkeepActive(AI, 40, false, P_ON), true));
t('tura 41 AI = nieaktywne', () => assert.equal(M.aiFreeUnitUpkeepActive(AI, 41, false, P_ON), false));
t('tura 0 AI = nieaktywne', () => assert.equal(M.aiFreeUnitUpkeepActive(AI, 0, false, P_ON), false));
t('gracz w turze 1 = nieaktywne', () => assert.equal(M.aiFreeUnitUpkeepActive(HUMAN, 1, true, P_ON), false));
t('gracz w turze 40 = nieaktywne', () => assert.equal(M.aiFreeUnitUpkeepActive(HUMAN, 40, true, P_ON), false));
t('flaga wlaczone=false = nieaktywne', () => assert.equal(M.aiFreeUnitUpkeepActive(AI, 10, false, P_OFF), false));
t('brak parametrow = nieaktywne', () => assert.equal(M.aiFreeUnitUpkeepActive(AI, 10, false, null), false));
t('NaN tura = nieaktywne', () => assert.equal(M.aiFreeUnitUpkeepActive(AI, NaN, false, P_ON), false));

console.log('-- (b) tempo --');
t('mnoznikUtrzymaniaJednostek (unit-cost-tempo) bez zmian: 0 -> 1 (zero obsluguje economy-upkeep)', () => assert.equal(M.mnoznikUtrzymaniaJednostek(0), 1));
t('mnoznikUtrzymaniaJednostek(wysoki) = 4', () => assert.equal(M.mnoznikUtrzymaniaJednostek('wysoki'), 4));
t('mnoznikUtrzymaniaJednostek(ujemne) = 1 (Niski)', () => assert.equal(M.mnoznikUtrzymaniaJednostek(-2), 1));
t('bez kontekstu tempo bez zmian', () => {
  M.setAiFreeUnitUpkeepContext(null);
  assert.equal(M.paceUtrzymaniaWlasciciela(AI, 'wysoki'), 'wysoki');
});
const ctxAt = (turn) => ({
  getTurn: () => turn,
  isHumanOwner: (oid) => oid === HUMAN,
  params: P_ON,
});
t('kontekst: AI tura 40 -> 0', () => {
  M.setAiFreeUnitUpkeepContext(ctxAt(40));
  assert.equal(M.paceUtrzymaniaWlasciciela(AI, 'wysoki'), 0);
});
t('kontekst: AI tura 41 -> wysoki', () => {
  M.setAiFreeUnitUpkeepContext(ctxAt(41));
  assert.equal(M.paceUtrzymaniaWlasciciela(AI, 'wysoki'), 'wysoki');
});
t('kontekst: gracz tura 40 -> wysoki', () => {
  M.setAiFreeUnitUpkeepContext(ctxAt(40));
  assert.equal(M.paceUtrzymaniaWlasciciela(HUMAN, 'wysoki'), 'wysoki');
});
M.setAiFreeUnitUpkeepContext(null);

// Dane gry (prawdziwe pliki JSON) do silnika.
const data = {
  units: require(path.join(GRA, 'data/units.json')),
  buildings: [],
  econParams: require(path.join(GRA, 'data/econ-params.json')),
};
const unitDef = (data.units.find(u => u.Jednostka && u.Kategoria) || data.units[0]);
const typeId = unitDef.Jednostka;
const mkUnits = (owner, n) => Array.from({ length: n }, () => ({
  ownerId: owner, typeId, camping: false, onOwnTerritory: true,
}));
const upkeepParams = M.loadUpkeepParams(data.econParams, 'normal');
const unitUpkeepTbl = M.buildUnitUpkeepTable(data.units);
const foodTbl = M.buildUnitFoodTable(data.units);

const previewFor = (ownerId, turn, pace, params = P_ON, n = 3) => {
  M.setAiFreeUnitUpkeepContext({ getTurn: () => turn, isHumanOwner: (o) => o === HUMAN, params });
  try {
    return M.previewTurn(ownerId, [], data, 'normal', new Map(), mkUnits(ownerId, n), 1, new Set(), undefined, undefined, new Map(), pace);
  } finally { M.setAiFreeUnitUpkeepContext(null); }
};
const foodFor = (ownerId, turn, pace, params = P_ON) => {
  M.setAiFreeUnitUpkeepContext({ getTurn: () => turn, isHumanOwner: (o) => o === HUMAN, params });
  try {
    return M.militaryFoodConsumptionWithSpichlerz(mkUnits(ownerId, 3), ownerId, upkeepParams, foodTbl, { kosztJednostekPace: pace });
  } finally { M.setAiFreeUnitUpkeepContext(null); }
};
// Surowce utrzymania jednostek: ta sama funkcja, którą tick woła dla właściciela (turn-economy.ts).
const resFor = (ownerId, turn, pace, params = P_ON) => {
  M.setAiFreeUnitUpkeepContext({ getTurn: () => turn, isHumanOwner: (o) => o === HUMAN, params });
  try {
    const r = M.totalUnitResourceUpkeep(mkUnits(ownerId, 3), tid => data.units.find(u => u.Jednostka === tid), M.paceUtrzymaniaWlasciciela(ownerId, pace));
    return Object.values(r).reduce((s, v) => s + (Number(v) || 0), 0);
  } finally { M.setAiFreeUnitUpkeepContext(null); }
};

console.log('-- (c) silnik: zloto i zywnosc --');
const gold = (r) => (r && typeof r.utrzymanieRazem === 'number' ? r.utrzymanieRazem : NaN);
t('AI tura 40 wysoki: utrzymanie zlota = 0', () => {
  assert.equal(gold(previewFor(AI, 40, 'wysoki')), 0);
});
t('AI tura 41 wysoki: utrzymanie zlota pelne (>0)', () => {
  assert.ok(gold(previewFor(AI, 41, 'wysoki')) > 0, 'expected > 0');
});
t('AI tura 41 wysoki = 4 x AI tura 41 niski (pelny koszt x4)', () => {
  const hi = gold(previewFor(AI, 41, 'wysoki'));
  const lo = gold(previewFor(AI, 41, 'niski'));
  assert.ok(Math.abs(hi - 4 * lo) <= 4, `hi=${hi} lo=${lo}`);
});
t('gracz tura 40 wysoki: utrzymanie zlota pelne (>0, = AI tura 41)', () => {
  const h = gold(previewFor(HUMAN, 40, 'wysoki'));
  assert.ok(h > 0, 'player must pay');
  assert.equal(h, gold(previewFor(AI, 41, 'wysoki')));
});
t('flaga off: AI tura 40 wysoki nadal platny', () => {
  assert.ok(gold(previewFor(AI, 40, 'wysoki', P_OFF)) > 0);
});
t('zywnosc AI tura 40 wysoki = 0', () => {
  assert.equal(foodFor(AI, 40, 'wysoki'), 0);
});
t('zywnosc AI tura 41 wysoki > 0', () => {
  assert.ok(foodFor(AI, 41, 'wysoki') > 0);
});
t('zywnosc gracz tura 40 wysoki > 0', () => {
  assert.ok(foodFor(HUMAN, 40, 'wysoki') > 0);
});

t('surowce AI tura 40 wysoki = 0 (totalUnitResourceUpkeep przez okno)', () => {
  assert.equal(resFor(AI, 40, 'wysoki'), 0);
});
t('surowce AI tura 41 wysoki > 0 i = 4 x niski', () => {
  const hi = resFor(AI, 41, 'wysoki');
  const lo = resFor(AI, 41, 'niski');
  assert.ok(hi > 0, `hi=${hi}`);
  assert.ok(Math.abs(hi - 4 * lo) < 1e-6, `hi=${hi} lo=${lo}`);
});
t('surowce gracz tura 40 wysoki > 0', () => {
  assert.ok(resFor(HUMAN, 40, 'wysoki') > 0);
});

console.log('-- (d) bramka rekrutacji AI: okno vs po oknie (dane z silnika) --');
const gateP = { runwayTurns: 15, margin: 0.1 };
const base = { goldStock: 100, goldCost: 10, foodStock: 100, foodNetPerTurn: 5, unitFoodUpkeep: 1, unitGoldUpkeep: 4 };
t('syntetyczne: okno (netto zlota = przychod, utrzymanie 0): zakup dozwolony', () => {
  assert.equal(M.aiUpkeepRunwayAllowsRecruit({ ...base, goldNetPerTurn: 5 }, gateP), true);
});
t('syntetyczne: po oknie (utrzymanie 30/tura): zakup zablokowany', () => {
  assert.equal(M.aiUpkeepRunwayAllowsRecruit({ ...base, goldNetPerTurn: 5 - 30 }, gateP), false);
});
// Ta sama konstrukcja wejścia co aiUpkeepRunwayAllows (main.ts): przed = 3 jednostki, po = 4 jednostki,
// utrzymanie złota z previewTurn (silnik + okno). Dowodzi, że bramka dostaje 0 w oknie, a pełny koszt po nim.
const gateFromEngine = (turn) => {
  const before = previewFor(AI, turn, 'wysoki', P_ON, 3).utrzymanieRazem;
  const after = previewFor(AI, turn, 'wysoki', P_ON, 4).utrzymanieRazem;
  return M.aiUpkeepRunwayAllowsRecruit({
    goldStock: 100, goldCost: 10, goldNetPerTurn: 5 - before,
    unitGoldUpkeep: Math.max(0, after - before),
    foodStock: 100, foodNetPerTurn: 5, unitFoodUpkeep: 0,
  }, gateP);
};
t('bramka z silnika: tura 40 (okno) -> unitGoldUpkeep 0 -> zakup dozwolony', () => {
  assert.equal(gateFromEngine(40), true);
});
t('bramka z silnika: tura 41 -> pełny koszt -> zakup zablokowany', () => {
  assert.equal(gateFromEngine(41), false);
});

console.log('-- (e) wiring (pin tekstowy, liczony) --');
const readSrc = (rel) => fs.readFileSync(path.join(GRA, rel), 'utf8');
const count = (s, needle) => s.split(needle).length - 1;
t('turn-economy: tick (upkeepBalance + totalUnitResourceUpkeep) = 2 pinы, preview 1, food 1', () => {
  const s = readSrc('src/game/turn-economy.ts');
  assert.equal(count(s, 'paceUtrzymaniaWlasciciela(oid, unitPace)'), 2, 'tick pins (oczekiwane 2)');
  assert.equal(count(s, 'paceUtrzymaniaWlasciciela(ownerId, kosztJednostekPace)'), 1, 'preview pin');
  assert.equal(count(s, 'paceUtrzymaniaWlasciciela(ownerId, opts?.kosztJednostekPace'), 1, 'food pin');
});
t('main.ts: okno AI ustawiane w tickach (override) i zdejmowane przed faza AI i w finally', () => {
  const s = readSrc('src/main.ts');
  assert.ok(s.includes('getTurn: () => aiUpkeepTickTurnOverride ?? turn'), 'getTurn override missing');
  assert.equal(count(s, 'aiUpkeepTickTurnOverride = turn - 1;'), 1, 'set after turn++');
  assert.equal(count(s, 'aiUpkeepTickTurnOverride = null;'), 2, 'clear before runAiPhase + finally');
  assert.ok(s.includes('aiUpkeepTickTurnOverride = null;\n          await runAiPhase();'), 'clear not directly before runAiPhase');
});
t('main.ts: wszystkie punkty utrzymania (garnizon, rezerwa, NNS, karty, statystyki AI) przez paceUtrzymaniaWlasciciela', () => {
  const s = readSrc('src/main.ts');
  assert.ok(s.includes('paceUtrzymaniaWlasciciela(city.ownerId'), 'garrison pin missing');
  assert.equal(count(s, 'paceUtrzymaniaWlasciciela(ownerId, kosztJednostekPaceUtrzymania())'), 4, 'podglad armii/rezerwa/bramka AI/NNS (4: 4161, 7707, 39513, 39558)');
  assert.equal(count(s, 'paceUtrzymaniaWlasciciela(oid, kosztJednostekPaceUtrzymania())'), 2, 'NNS zloto+zywnosc (2)');
  assert.equal(count(s, 'paceUtrzymaniaWlasciciela(o, kosztJednostekPaceUtrzymania())'), 3, 'statystyki AI: pieniadz, zywnosc, surowce (3)');
  assert.ok(s.includes('paceUtrzymaniaWlasciciela(ownerId, pace)'), 'karta jednostki: utrzymanie (nie rekrutacja)');
  assert.ok(s.includes('setAiFreeUnitUpkeepContext({'), 'context install missing');
});

try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) { /* ignore */ }

console.log(`\nai-free-unit-upkeep-test: ${pass} ok, ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
