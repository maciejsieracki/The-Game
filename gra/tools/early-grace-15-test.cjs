'use strict';
/**
 * early-grace-15-test.cjs -- R-WEB-EARLY-GRACE-15-IMPL-Q1 (decyzja Q41-A, 2026-11-27).
 * Run from gra/:  node tools/early-grace-15-test.cjs
 *
 * Reguly (wszystkie poziomy trudności, tury 1..15 włącznie):
 *   R1. start: Trudny gracz ma 1 Wojownika (Łatwy 2, Normalny 1 bez zmian).
 *   R2. barbarzyńcy nie wykonują tury w oknie łaski (barbariansGraceActive + bramka main.ts).
 *   R3. utrzymanie wszystkich jednostek GRACZA-CZŁOWIEKA = 0 (złoto, żywność, surowce)
 *       w oknie łaski przy każdym tempie; AI bez zmian (okno FALA 890: 1..40).
 *   Tura 16: wszystko jak dziś. Zakup jednostek nie jest objęty (nie testowany tu).
 *
 * Mutacje (ręczne, opisane w raporcie): zdjęcie każdej z trzech reguł musi dać czerwony wynik.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA, 'node_modules', 'esbuild'));
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'early-grace-15-'));
const ENTRY = path.join(TMP, 'entry.ts');
const BUNDLE = path.join(TMP, 'bundle.cjs');

fs.writeFileSync(ENTRY, [
  `export * from ${JSON.stringify(path.join(GRA, 'src/game/ai-free-unit-upkeep'))};`,
  `export * from ${JSON.stringify(path.join(GRA, 'src/game/unit-cost-tempo'))};`,
  `export * from ${JSON.stringify(path.join(GRA, 'src/game/barbarians'))};`,
  `export { playerStartUnitCount, cityStateStartUnitCount, foreignCityStateStartUnitCount } from ${JSON.stringify(path.join(GRA, 'src/game/ai-difficulty-bonus'))};`,
  `export { previewOwnerUpkeep as previewTurn, militaryFoodConsumptionWithSpichlerz } from ${JSON.stringify(path.join(GRA, 'src/game/turn-economy'))};`,
  `export { loadUpkeepParams, totalUnitResourceUpkeep, buildUnitUpkeepTable, buildUnitFoodTable } from ${JSON.stringify(path.join(GRA, 'src/game/economy-upkeep'))};`,
].join('\n') + '\n', 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
    target: 'node18', loader: { '.ts': 'ts', '.json': 'json' }, outfile: BUNDLE,
    absWorkingDir: GRA, logLevel: 'silent',
  });
} catch (e) {
  console.error('[early-grace-15-test] bundle failed:', e.message);
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

const HUMAN = 0;
const AI = 1;
const GRACE = 15;
const P_ON = { wlaczone: true, tury: 40 };
const DIFFS = ['easy', 'normal', 'hard'];

// ---------------------------------------------------------------------------
console.log('-- R1: start gracza --');
t('Latwy=2, Normalny=1, Trudny=1 (wszystkie poziomy)', () => {
  assert.equal(M.playerStartUnitCount('easy'), 2);
  assert.equal(M.playerStartUnitCount('normal'), 1);
  assert.equal(M.playerStartUnitCount('hard'), 1);
});
t('Trudny daje dokladnie 1 jednostke (nie 0)', () => {
  assert.equal(M.playerStartUnitCount('hard') > 0, true);
});
t('obce panstwa-miasta i panstwa-miasta gracza bez zmian', () => {
  assert.deepEqual(DIFFS.map(d => M.foreignCityStateStartUnitCount(d)), [2, 1, 0]);
  assert.deepEqual(DIFFS.map(d => M.cityStateStartUnitCount(d)), [0, 1, 2]);
});

// ---------------------------------------------------------------------------
console.log('-- R2: barbarzyncy nie graja w oknie laski --');
t('barbariansGraceActive: tury 1..15 wlacznie = true', () => {
  for (let turn = 1; turn <= GRACE; turn++) assert.equal(M.barbariansGraceActive(turn, GRACE), true, 'tura ' + turn);
});
t('barbariansGraceActive: tura 16 = false (od tury 16 jak dzis)', () => {
  assert.equal(M.barbariansGraceActive(16, GRACE), false);
});
t('barbariansGraceActive: tura 0 i ujemne = false', () => {
  assert.equal(M.barbariansGraceActive(0, GRACE), false);
  assert.equal(M.barbariansGraceActive(-3, GRACE), false);
});
t('barbariansGraceActive: brak/NaN okna = false (bez zmian)', () => {
  assert.equal(M.barbariansGraceActive(5, NaN), false);
  assert.equal(M.barbariansGraceActive(5, undefined), false);
});
t('okno 0 wylacza mechanike', () => {
  assert.equal(M.barbariansGraceActive(1, 0), false);
});
t('loadBarbGraceTurns: klucz z ai-params (15) i fallback 15 przy braku', () => {
  const dataReal = { aiParams: require(path.join(GRA, 'data/ai-params.json')) };
  assert.equal(M.loadBarbGraceTurns(dataReal), 15);
  assert.equal(M.loadBarbGraceTurns({ aiParams: {} }), M.BARBARIAN_GRACE_TURNS_DEFAULT);
  assert.equal(M.BARBARIAN_GRACE_TURNS_DEFAULT, 15);
});
t('barbariansActive nie zmienione (startTurn nadal gate; okno jest osobna bramka)', () => {
  const P = M.FALLBACK_BARB_PARAMS;
  assert.equal(M.barbariansActive(P.startTurn, P), true);
  assert.equal(M.barbariansActive(P.startTurn - 1, P), false);
});

t('barbariansGraceBlocksTurnEnd: domkniecie tury 15 (turn=16 po turn++) = zablokowane; 16 = nie', () => {
  assert.equal(M.barbariansGraceBlocksTurnEnd(2, GRACE), true, 'domkniecie tury 1');
  assert.equal(M.barbariansGraceBlocksTurnEnd(16, GRACE), true, 'domkniecie tury 15');
  assert.equal(M.barbariansGraceBlocksTurnEnd(17, GRACE), false, 'domkniecie tury 16 (od 16 jak dzis)');
});
t('barbariansGraceBlocksTurnEnd spojne z utrzymaniem: ta sama tura domykana (N = turn-1)', () => {
  for (let n = 1; n <= 20; n++) {
    assert.equal(M.barbariansGraceBlocksTurnEnd(n + 1, GRACE), M.playerUnitUpkeepGraceActive(n, true, GRACE), 'tura domykana ' + n);
  }
});
for (const diff of DIFFS) {
  t(`okno barbarzyncow na poziomie ${diff}: dane (15) i domkniecie tur 1..15 blokowane`, () => {
    const dataDiff = { aiParams: require(path.join(GRA, 'data/ai-params.json')) };
    assert.equal(M.loadBarbGraceTurns(dataDiff), 15, diff);
    for (let n = 1; n <= GRACE; n++) assert.equal(M.barbariansGraceBlocksTurnEnd(n + 1, M.loadBarbGraceTurns(dataDiff)), true, diff + ' tura ' + n);
    assert.equal(M.barbariansGraceBlocksTurnEnd(GRACE + 2, M.loadBarbGraceTurns(dataDiff)), false, diff + ' tura 16');
  });
}
t('dane: klucze okna w ai-params.json = 15 (pin wartosci, nie tylko fallback)', () => {
  const ai = require(path.join(GRA, 'data/ai-params.json'));
  assert.equal(ai[M.BARBARIAN_GRACE_TURNS_KEY] && ai[M.BARBARIAN_GRACE_TURNS_KEY].wartosc, 15, 'barbarzyncy');
  assert.equal(ai[M.PLAYER_UPKEEP_GRACE_TURNS_KEY] && ai[M.PLAYER_UPKEEP_GRACE_TURNS_KEY].wartosc, 15, 'utrzymanie gracza');
});

t('wiring: main.ts bramka tury barbarzyncow zawiera okno laski (pin tekstowy)', () => {
  const src = fs.readFileSync(path.join(GRA, 'src/main.ts'), 'utf8');
  assert.ok(src.includes('&& !barbariansGraceBlocksTurnEnd(turn, barbGraceTurns)'), 'brak bramki w main.ts');
  assert.ok(src.includes('playerGraceTurns: (aiParamsRaw as Record<string, { wartosc?: number }>)[PLAYER_UPKEEP_GRACE_TURNS_KEY]?.wartosc ?? PLAYER_UPKEEP_GRACE_TURNS_DEFAULT'), 'brak wiringu utrzymania gracza');
});

// ---------------------------------------------------------------------------
console.log('-- R3: utrzymanie gracza = 0 w oknie laski --');
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
const foodTbl = M.buildUnitFoodTable(data.units);

const ctx = (turn, graceTurns = GRACE) => ({
  getTurn: () => turn,
  isHumanOwner: (o) => o === HUMAN,
  params: P_ON,
  playerGraceTurns: graceTurns,
});
const withCtx = (c, fn) => { M.setAiFreeUnitUpkeepContext(c); try { return fn(); } finally { M.setAiFreeUnitUpkeepContext(null); } };

t('playerUnitUpkeepGraceActive: czlowiek 1..15 = true, 16 = false, AI = false', () => {
  for (let turn = 1; turn <= GRACE; turn++) assert.equal(M.playerUnitUpkeepGraceActive(turn, true, GRACE), true, 'tura ' + turn);
  assert.equal(M.playerUnitUpkeepGraceActive(16, true, GRACE), false);
  assert.equal(M.playerUnitUpkeepGraceActive(1, false, GRACE), false);
  assert.equal(M.playerUnitUpkeepGraceActive(1, true, undefined), false);
});
for (const pace of ['niski', 'normalny', 'wysoki']) {
  t(`paceUtrzymania gracza tura 1 i 15 (${pace}) = 0`, () => {
    withCtx(ctx(1), () => assert.equal(M.paceUtrzymaniaWlasciciela(HUMAN, pace), 0));
    withCtx(ctx(15), () => assert.equal(M.paceUtrzymaniaWlasciciela(HUMAN, pace), 0));
  });
  t(`paceUtrzymania gracza tura 16 (${pace}) = tempo bez zmian`, () => {
    withCtx(ctx(16), () => assert.equal(M.paceUtrzymaniaWlasciciela(HUMAN, pace), pace));
  });
}
t('AI: okno FALA 890 (1..40) bez zmian -- AI tura 16 nadal 0', () => {
  withCtx(ctx(16), () => assert.equal(M.paceUtrzymaniaWlasciciela(AI, 'wysoki'), 0));
  withCtx(ctx(41), () => assert.equal(M.paceUtrzymaniaWlasciciela(AI, 'wysoki'), 'wysoki'));
});
t('kontekst bez playerGraceTurns: gracz tura 1 nie dostaje zera (regresja wylaczona)', () => {
  const c = ctx(1); delete c.playerGraceTurns;
  withCtx(c, () => assert.equal(M.paceUtrzymaniaWlasciciela(HUMAN, 'wysoki'), 'wysoki'));
});

const goldOf = (r) => (r && typeof r.utrzymanieRazem === 'number' ? r.utrzymanieRazem : NaN);
const previewFor = (ownerId, turn, pace, diff = 'normal') => withCtx(ctx(turn), () =>
  M.previewTurn(ownerId, [], data, diff, new Map(), mkUnits(ownerId, 3), 1, new Set(), undefined, undefined, new Map(), pace));
const foodFor = (ownerId, turn, pace) => withCtx(ctx(turn), () =>
  M.militaryFoodConsumptionWithSpichlerz(mkUnits(ownerId, 3), ownerId, upkeepParams, foodTbl, { kosztJednostekPace: pace }));
const resFor = (ownerId, turn, pace) => withCtx(ctx(turn), () => {
  const r = M.totalUnitResourceUpkeep(mkUnits(ownerId, 3), tid => data.units.find(u => u.Jednostka === tid), M.paceUtrzymaniaWlasciciela(ownerId, pace));
  return Object.values(r).reduce((s, v) => s + (Number(v) || 0), 0);
});

t('zloto gracza w turze 1 (wysoki) = 0; w turze 16 > 0 (ta sama armia)', () => {
  const g1 = goldOf(previewFor(HUMAN, 1, 'wysoki'));
  const g16 = goldOf(previewFor(HUMAN, 16, 'wysoki'));
  assert.ok(Number.isFinite(g1), 'gold t1 liczba');
  assert.equal(g1, 0, 'gold t1 = ' + g1);
  assert.ok(g16 > 0, 'gold t16 = ' + g16);
});
t('zywnosc jednostek gracza: tura 1 i 15 = 0 (wysoki), tura 16 > 0', () => {
  assert.equal(foodFor(HUMAN, 1, 'wysoki'), 0);
  assert.equal(foodFor(HUMAN, 15, 'wysoki'), 0);
  assert.ok(foodFor(HUMAN, 16, 'wysoki') > 0, 'food t16');
});
t('surowce utrzymania gracza: tura 1 i 15 = 0, tura 16 > 0 (liczone, nie tylko >= 0)', () => {
  assert.equal(resFor(HUMAN, 1, 'wysoki'), 0);
  assert.equal(resFor(HUMAN, 15, 'wysoki'), 0);
  assert.ok(resFor(HUMAN, 16, 'wysoki') > 0, 'surowce t16 = ' + resFor(HUMAN, 16, 'wysoki'));
});
for (const diff of DIFFS) {
  t(`zloto/zywnosc/surowce gracza na poziomie ${diff}: t1 i t15 = 0, t16 > 0`, () => {
    assert.equal(goldOf(previewFor(HUMAN, 1, 'wysoki', diff)), 0, 'gold t1');
    assert.equal(goldOf(previewFor(HUMAN, 15, 'wysoki', diff)), 0, 'gold t15');
    assert.ok(goldOf(previewFor(HUMAN, 16, 'wysoki', diff)) > 0, 'gold t16');
    assert.equal(foodFor(HUMAN, 15, 'wysoki'), 0, 'food t15');
    assert.ok(foodFor(HUMAN, 16, 'wysoki') > 0, 'food t16');
    assert.equal(resFor(HUMAN, 15, 'wysoki'), 0, 'res t15');
    assert.ok(resFor(HUMAN, 16, 'wysoki') > 0, 'res t16');
  });
}
t('AI w turze 1 nadal bez utrzymania (FALA 890 bez zmian)', () => {
  assert.equal(foodFor(AI, 1, 'wysoki'), 0);
});

// ---------------------------------------------------------------------------
console.log('');
console.log(`early-grace-15-test: ${pass} passed, ${fail} failed`);
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) { /* ignore */ }
if (fail > 0) process.exit(1);
