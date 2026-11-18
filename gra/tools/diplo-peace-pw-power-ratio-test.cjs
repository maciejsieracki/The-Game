'use strict';
/**
 * diplo-peace-pw-power-ratio-test.cjs -- R-WEB-DIPLO-PEACE-PW-POWER-RATIO-IMPL-Q1 (ABC właściciela 2026-11-18).
 * Model PW pokoju „P·r i P/r": r = POWER silniejszej / POWER słabszej (>= 1); S = round(P·r) dla silniejszej,
 * W = round(P/r) dla słabszej, D = S − W dopłaca słabsza strona miastami (bez sufitu).
 *
 *  (U1) r = 1 (równa moc): D = 0, S = W = P (pokój bez dopłaty — konsekwencja wzoru, uwaga w raporcie);
 *  (U2) r = 1,5: P = 4320 → S = 6480, W = 2880, D = 3600;
 *  (U3) przykład z dispatchu: moc 6969/2611, P = 4320 → r ≈ 2,669, S = 11530, W = 1619, D = 9911;
 *  (U4) r = 5: S = 21600, W = 864, D = 20736; r = 10: S = 43200, W = 432, D = 42768;
 *  (U5) moc słabszej 0: mianownik chroniony (max(1, słabsza)) → r = 100, bez dzielenia przez 0;
 *  (U6) obie moce 0 → r = 1, D = 0; strona silniejsza wskazana poprawnie (także gdy silniejsza jest druga);
 *  (I1) evaluateProposal, gracz proponuje pokój JAKO SILNIEJSZY (moc 300 vs 100): brak „Brakuje N PW";
 *  (I2) gracz SŁABSZY (100 vs 300), bez miast: odrzucenie „Brakuje … PW” z kwotą D (po rabacie relacji);
 *  (I3) gracz SŁABSZY z miastami o wartości ≥ D: pokój przyjęty (accepted=true);
 *  (I4) gracz SŁABSZY z miastami o wartości < D: nadal blokada z kwotą;
 *  (I5) r = 1 (równa moc): D = 0 → brak blokady PW (accepted=true);
 *  (I6) bez pola powerPlayer/powerOther: zachowanie sprzed zmiany (bramka bilansu bez podziału mocy);
 *  (M1) mutacja: powrót do stałej bramki (gap = 0 dla słabszego gracza) czerwieni test I2 — dowód, że test
 *       jest czuły na implementację podziału;
 *  (S1) statyczna: parametr mianownikMin w war-weariness-params.json, brak magicznych liczb w funkcji.
 *
 *   node tools/diplo-peace-pw-power-ratio-test.cjs   # exit 0 = wszystko zielone i mutant wykryty
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const SRC_DIR = path.resolve(GRA, 'src', 'game');
const PROPOSALS = path.join(SRC_DIR, 'diplomacy-proposals.ts');
const PARAMS = path.join(GRA, 'data', 'war-weariness-params.json');
const TAG = `${process.pid}`;
const ENTRY = path.resolve(GRA, 'src', `.pwpow-entry-${TAG}.ts`);
let bundleSeq = 0;

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}

/** Buduje bundle (opcjonalnie z podmienionym diplomacy-proposals.ts) i zwraca moduł. */
function loadModule(proposalsSrc) {
  const mutPath = path.join(SRC_DIR, `.pwpow-prop-${TAG}.ts`);
  const entryTarget = proposalsSrc == null ? './game/diplomacy-proposals' : './game/.pwpow-prop-' + TAG;
  if (proposalsSrc != null) fs.writeFileSync(mutPath, proposalsSrc, 'utf8');
  const BUNDLE = path.resolve(__dirname, `.pwpow-${TAG}-${++bundleSeq}.cjs`);
  fs.writeFileSync(ENTRY, [
    `export { evaluateProposal, createNegotiation, negotiationAsProposal } from '${entryTarget}';`,
    "export { peacePwPointsByPowerRatio, WAR_WEARINESS_PARAMS, peacePowerSidesForPair, peaceAiAiPaymentPn } from './game/war-weariness';",
    "export { runAiAiPeaceTick, planCityPeacePayment } from './game/diplomacy-ai-forced-peace';",
    '',
  ].join('\n'), 'utf8');
  try {
    esbuild.buildSync({
      entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: BUNDLE,
      absWorkingDir: GRA, loader: { '.ts': 'ts', '.json': 'json' }, logLevel: 'silent',
    });
  } finally {
    try { fs.unlinkSync(ENTRY); } catch (_) { /* ok */ }
    if (proposalsSrc != null) { try { fs.unlinkSync(mutPath); } catch (_) { /* ok */ } }
  }
  const mod = require(BUNDLE);
  try { fs.unlinkSync(BUNDLE); } catch (_) { /* ok */ }
  return mod;
  // (każdy bundle ma własną nazwę: require() cache nie może zwrócić poprzedniego modułu)
}

const M = loadModule(null);
const split = (P, a, b) => M.peacePwPointsByPowerRatio(P, a, b);

// --- (U) wzór ---
{
  const u1 = split(4320, 100, 100);
  check('U1: r = 1 (równa moc) => D = 0, S = W = P', u1.r === 1 && u1.D === 0 && u1.S === 4320 && u1.W === 4320, u1);
  const u2 = split(4320, 150, 100);
  check('U2: r = 1,5 (P = 4320) => S = 6480, W = 2880, D = 3600', u2.S === 6480 && u2.W === 2880 && u2.D === 3600, u2);
  const u3 = split(4320, 6969, 2611);
  check('U3: przykład 6969/2611, P = 4320 => r ≈ 2,669, S = 11530, W = 1619, D = 9911',
    Math.abs(u3.r - 2.669) < 0.001 && u3.S === 11530 && u3.W === 1619 && u3.D === 9911, u3);
  const u4a = split(4320, 500, 100);
  check('U4a: r = 5 => S = 21600, W = 864, D = 20736', u4a.S === 21600 && u4a.W === 864 && u4a.D === 20736, u4a);
  const u4b = split(4320, 1000, 100);
  check('U4b: r = 10 => S = 43200, W = 432, D = 42768', u4b.S === 43200 && u4b.W === 432 && u4b.D === 42768, u4b);
  const u5 = split(4320, 100, 0);
  check('U5: moc słabszej 0 => mianownik chroniony, r = 100 (bez dzielenia przez 0, D skończone)',
    u5.r === 100 && Number.isFinite(u5.D) && u5.strongerSide === 'a', u5);
  const u6 = split(4320, 0, 0);
  check('U6a: obie moce 0 => r = 1, D = 0', u6.r === 1 && u6.D === 0, u6);
  const u6b = split(4320, 100, 300);
  check('U6b: silniejsza jest strona b => strongerSide = b, D = 3600 − … (r = 3)', u6b.strongerSide === 'b' && u6b.r === 3 && u6b.D === 12960 - 1440, u6b);
  check('U7: parametr mianownikMin w war-weariness-params.json = 1',
    JSON.parse(fs.readFileSync(PARAMS, 'utf8')).pwPrzezMoc.mianownikMin === 1);
}

// --- (I) integracja: evaluateProposal, gracz proponuje pokój (wojna, tura 10 => L = 0,25, cena 4500) ---
const WOJNA = { zaufanie: 5, respekt: 5, status: 'wojna' };
function playerPeace(powers, giveItems) {
  const payload = giveItems ? { giveItems } : {};
  const entry = M.createNegotiation({ actionId: 'pokoj', proposerOwnerId: 0, responderOwnerId: 1, payload }, 80, 'player', 1);
  const warState = { turnsAtWar: 10, lostCitiesResponder: 0, responderRw: 0.5 };
  if (powers) { warState.powerPlayer = powers[0]; warState.powerOther = powers[1]; }
  return M.evaluateProposal(M.negotiationAsProposal(entry), {
    relation: WOJNA, stanWojny: true, turn: 80, proposerRespekt: 60, responderRespekt: 60, militaryRatio: 1,
    respektWzgledny: 0.5, karaWspolnaGranica: false, difficulty: 'normal',
    responderPlayer: { ownerId: 1, typCywilizacji: 'rzymianie' }, proposerPlayer: { ownerId: 0, typCywilizacji: 'rzymianie' },
    authorOwnerId: 0, warState,
  });
}

{
  const i1 = playerPeace([300, 100]);
  check('I1: gracz silniejszy (300 vs 100) proponuje pokój => brak „Brakuje N PW”',
    i1.accepted === true && !/Brakuje/.test(i1.reason || ''), i1);
  const i2 = playerPeace([100, 300]);
  check('I2: gracz słabszy (100 vs 300), bez miast => odrzucenie „Brakuje … PW” z dopłatą D',
    i2.accepted === false && /Brakuje \d+ PW/.test(i2.reason || '') && /D = \d+ PW/.test(i2.reason || ''), i2);
  const dOf = (i2.reason || '').match(/D = (\d+) PW/);
  const dValue = dOf ? Number(dOf[1]) : -1;
  check('I2b: D w komunikacie = S − W dla P = cena 4500 (r = 3): D = 13500 − 1500 = 12000 (przed rabatem relacji)',
    dValue === 12000, { dValue });
  const i3 = playerPeace([100, 300], [{ typ: 'miasto', id: 'mCapture', ilosc: 1, cityPn: 100000 }]);
  check('I3: gracz słabszy z miastem o wartości ≥ D => pokój przyjęty', i3.accepted === true, i3);
  const i4 = playerPeace([100, 300], [{ typ: 'miasto', id: 'mSmall', ilosc: 1, cityPn: 10 }]);
  check('I4: gracz słabszy z miastem < D => nadal blokada „Brakuje” z kwotą', i4.accepted === false && /Brakuje/.test(i4.reason || ''), i4);
  const i5 = playerPeace([200, 200]);
  check('I5: równa moc (r = 1, D = 0) => brak blokady PW', i5.accepted === true, i5);
  const i6 = playerPeace(null);
  check('I6: bez powerPlayer/powerOther => zachowanie sprzed zmiany (brak „do wyrównania mocy”)',
    !/wyrównania mocy/.test(i6.reason || ''), i6);
}

// --- (M) mutacja: stała bramka (słabszy gracz zawsze wolny) musi czerwienić I2 ---
{
  const orig = fs.readFileSync(PROPOSALS, 'utf8');
  const marker = "          gap = requiredD - givePn;";
  if (orig.indexOf(marker) < 0) {
    check('M1: marker mutacji obecny w diplomacy-proposals.ts', false);
  } else {
    const mutant = orig.replace(marker, '          gap = 0;');
    const mm = loadModule(mutant);
    const m2 = mm.evaluateProposal(mm.negotiationAsProposal(mm.createNegotiation(
      { actionId: 'pokoj', proposerOwnerId: 0, responderOwnerId: 1, payload: {} }, 80, 'player', 1)), {
      relation: WOJNA, stanWojny: true, turn: 80, proposerRespekt: 60, responderRespekt: 60, militaryRatio: 1,
      respektWzgledny: 0.5, karaWspolnaGranica: false, difficulty: 'normal',
      responderPlayer: { ownerId: 1, typCywilizacji: 'rzymianie' }, proposerPlayer: { ownerId: 0, typCywilizacji: 'rzymianie' },
      authorOwnerId: 0, warState: { turnsAtWar: 10, lostCitiesResponder: 0, responderRw: 0.5, powerPlayer: 100, powerOther: 300 },
    });
    check('M1: mutant (gap = 0 dla słabszego gracza) czerwieni I2 — test wykrywa brak podziału', m2.accepted === true, m2);
  }
}

// --- (P) wiring pary i ścieżka AI↔AI (zarzuty Evaluatora r2: 1, 4, 5) ---
{
  // (P1a) AI proponuje pokój graczowi: powerPlayer = moc GRACZA, powerOther = moc AI (konwencja, zarzut 5)
  const pow = { 0: 6969, 2: 2611 };
  const sAi = M.peacePowerSidesForPair(0, 2, 0, o => pow[o]);
  check('P1a: AI proposer (2) → powerPlayer = moc gracza (6969), powerOther = moc AI (2611)',
    sAi.powerPlayer === 6969 && sAi.powerOther === 2611, sAi);
  // (P1b) gracz proponuje: ta sama konwencja
  const sPl = M.peacePowerSidesForPair(0, 0, 2, o => pow[o]);
  check('P1b: player proposer (0) → powerPlayer = 6969, powerOther = 2611',
    sPl.powerPlayer === 6969 && sPl.powerOther === 2611, sPl);
  // (P1c) end-to-end: wiring + evaluateProposal AI→gracz (AI słabsza), bez ręcznego ustawiania mocy po stronie gracza
  const evAi = M.evaluateProposal(M.negotiationAsProposal(M.createNegotiation(
    { actionId: 'pokoj', proposerOwnerId: 2, responderOwnerId: 0, payload: {} }, 80, 'ai', 0)), {
    relation: WOJNA, stanWojny: true, turn: 80, proposerRespekt: 60, responderRespekt: 60, militaryRatio: 1,
    respektWzgledny: 0.5, karaWspolnaGranica: false, difficulty: 'normal',
    responderPlayer: { ownerId: 0, typCywilizacji: 'rzymianie' }, proposerPlayer: { ownerId: 2, typCywilizacji: 'rzymianie' },
    authorOwnerId: 2, warState: Object.assign({ turnsAtWar: 10, lostCitiesResponder: 0, responderRw: 0.5 },
      M.peacePowerSidesForPair(0, 2, 0, o => pow[o])),
  });
  check('P1c: AI (słabsza wg wiringu) proponuje pokój — evaluateProposal nie zwraca „Brakuje” dla gracza (AI nie jest blokowana)',
    !/Brakuje/.test(String(evAi.reason || '')), evAi);
}
{
  // (P2a) AI↔AI: przegrany słabszy (100 vs 300), P = 4320 → dopłata D = 11520 (S 12960 − W 1440)
  const d2a = M.peaceAiAiPaymentPn(4320, 100, 300);
  check('P2a: AI↔AI słabszy przegrany dopłaca D = 11520 (P = 4320, r = 3)', d2a === 11520, d2a);
  check('P2b: AI↔AI przegrany silniejszy → 0 (dopłaca zwycięzca, nie modelowane tu)', M.peaceAiAiPaymentPn(4320, 300, 100) === 0);
  check('P2c: AI↔AI równa moc (r = 1) → 0 (D = 0)', M.peaceAiAiPaymentPn(4320, 200, 200) === 0);
  // (P2d) test (c): słabsza AI bez miast do oddania (stolica / ostatnie) → plan niepełny → pokój NIE zapada (wait)
  const cap = [{ kind: 'miasto', id: 'stolica', amount: 1, pn: 15000, forbidden: true }];
  const planCap = M.planCityPeacePayment(d2a, cap, cap.length);
  check('P2d: (c) słabsza AI tylko ze stolicą → plan niepełny (full=false), brak pokoju', planCap.full === false && planCap.items.length === 0, planCap);
  // (P2e) test (d): AI↔AI przez runAiAiPeaceTick — tylko miasto o wartości ≥ D pokrywa cenę i pokój zapada
  const runTick = (assets, turn) => {
    const store = new Map();
    store.set('1-0', { requesterId: 1, otherId: 0, sinceTurn: 10, kind: 'pokoj' });
    const paid = [];
    const out = M.runAiAiPeaceTick({
      store, turn, limit: 10,
      pairEligible: () => true,
      requesterShareOf: () => 0.2,
      gateVerdict: () => 'ok',
      price: () => ({ requiredPn: d2a, balanceFor: () => 0, tolerancePn: 1e9, loserBalanceFor: () => 0 }),
      assets: () => assets,
      cityCessionOk: () => true,
      battlePending: false,
      pay: (l, w, plan) => { paid.push(plan.coveredPn); },
      finalize: () => {},
    });
    return { out, paid };
  };
  const stolicaOnly = runTick(cap, 40);
  check('P2e: (c) runAiAiPeaceTick, słabsza AI bez miast do oddania → brak zapłaty i brak pokoju',
    stolicaOnly.paid.length === 0 && stolicaOnly.out.length === 1 && stolicaOnly.out[0].action === 'wait', stolicaOnly.out.map(o => o.action));
  const city = [{ kind: 'miasto', id: 'c1', amount: 1, pn: 12000, forbidden: false }];
  const cityTick = runTick(city, 12);
  check('P2f: (d) runAiAiPeaceTick, miasto 12000 ≥ D → zapłata zapada, pokój (accept_paid)',
    cityTick.paid.length === 1 && cityTick.out[0].action === 'accept_paid', { paid: cityTick.paid, out: cityTick.out.map(o => o.action) });
}
// (P3) statyczna: main.ts używa wspólnych helperów (brak lokalnych konwencji mocy w obu miejscach)
{
  const mainSrc = fs.readFileSync(path.resolve(GRA, 'src', 'main.ts'), 'utf8');
  check('P3a: main.ts wiring pary przez peacePowerSidesForPair (zarzut 4/5)', mainSrc.includes('peacePowerSidesForPair(ME(), proposerId, responderId, objectivePowerForOwner)'));
  check('P3b: main.ts AI↔AI price przez peaceAiAiPaymentPn (zarzut 1)', (mainSrc.match(/peaceAiAiPaymentPn\(/g) || []).length === 2);
}

// --- (S) statyczna: funkcja bez magicznych liczb (poza 1 = ochrona mianownika i 0 = dolna granica) ---
{
  const ww = fs.readFileSync(path.join(SRC_DIR, 'war-weariness.ts'), 'utf8');
  const fnStart = ww.indexOf('export function peacePwPointsByPowerRatio');
  const fnBody = fnStart >= 0 ? ww.slice(fnStart, ww.indexOf('\n}\n', fnStart)) : '';
  const literals = (fnBody.match(/(?<![A-Za-z_.\d])\d+(\.\d+)?/g) || []).map(s => s.trim());
  const allowed = new Set(['0', '1']);
  const bad = literals.filter(l => !allowed.has(l));
  check('S1: funkcja peacePwPointsByPowerRatio bez magicznych liczb (poza 0 i 1)', fnBody.length > 0 && bad.length === 0, bad);
}

try { fs.unlinkSync(BUNDLE); } catch (_) { /* ok */ }
console.log(`\nWynik: ${pass} PASS, ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
