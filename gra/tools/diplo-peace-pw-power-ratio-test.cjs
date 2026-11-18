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
    "export { decideAIDiplomacy, aiPeaceCityDuePn } from './game/ai';",
    "export { peacePowerSplitRowHtml } from './ui/diplomacyAcceptanceBalance';",
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
  check('P3c: main.ts przekazuje mocAI/mocPartner (Power) do decideAIDiplomacy w obu relacjeDip.push', (mainSrc.match(/mocAI: objectivePowerForOwner\(ownerId\)/g) || []).length === 2);
}

// --- (A) r3 P2: AI jako autor pokoju wobec gracza (R2): D z POWER, miasta, stolica, AI silniejsze żąda D ---
{
  check('A0: aiPeaceCityDuePn bez mocy → baza P (zachowanie sprzed zmiany)', M.aiPeaceCityDuePn(4320, undefined, 100) === 4320);
  check('A0b: aiPeaceCityDuePn płacący słabszy 100 vs 300 → D = 11520; silniejszy → 0; P = 0 → 0',
    M.aiPeaceCityDuePn(4320, 100, 300) === 11520 && M.aiPeaceCityDuePn(4320, 300, 100) === 0 && M.aiPeaceCityDuePn(0, 100, 300) === 0);
  const ai = (turns, miasta, mocAI, mocPl, silaAI, silaPl, extraRel) => M.decideAIDiplomacy({
    myPlayerId: '1', agresja: 0.5, currentTurn: 80, skarbiecGold: 0, miastaAI: miasta,
    relacje: [Object.assign({
      partnerId: '0', relation: { zaufanie: 0, respekt: 29, status: 'wojna' }, respektWzgledny: 0.06,
      stanWojny: true, turnsAtWar: turns, lostCitiesInWar: 0, turnsSinceCityChange: turns, armyHealthShare: 0.9, peaceLocked: false,
      silaMilitarnaAI: { sila: silaAI, armiaPkt: 0 }, silaMilitarnaPartner: { sila: silaPl, armiaPkt: 0 },
      mocAI, mocPartner: mocPl,
    }, extraRel || {})],
  }).filter(c => c.targetId === '0');
  const miasta = (n, pn) => Array.from({ length: n }, (_, i) => ({ cityId: 'c' + i, cityPn: pn, zakazane: false }));
  // R-WEB-DIPLO-TREATIES-POWER-PARITY-IMPL-Q1 (r3): przed 20. turą wojny AI proponuje ROZEJM (aiPeaceProposalKind), a ten ma
  // własną cenę X = 2000 × (1 − L) (parytet traktatów), nie P pokoju. Asercje A1/A2 dotyczą POKOJU → 20 tur wojny:
  // L = 0,5, P = 3000, AI słabsze mocą 1:3 → D = 3000*(3-1/3) = 8000. (Rozejm: sekcja A1r niżej.)
  const weakSmall = ai(20, miasta(6, 800), 100, 300, 100, 200);
  check('A1: (c) AI słabsze (r = 3), 6 miast po 800 PW (suma ≪ D) → brak oferty miasta (nie ma czym zapłacić D)',
    !weakSmall.some(c => c.type === 'oferuj_miasto_za_pokoj'), weakSmall);
  const weakBig = ai(20, miasta(6, 5000), 100, 300, 100, 200);
  check('A2: AI słabsze (r = 3), miasta po 5000 PW (×1,5 waga; dopiero dwa pokrywają D) → oferta miasta za pokój/rozejm z dodatkowymi miastami',
    weakBig.length === 1 && weakBig[0].type === 'oferuj_miasto_za_pokoj'
    && (1 + (weakBig[0].dodatkoweMiasta || []).length) >= 2, weakBig);
  // A1r (TREATYIMPL r3): rozejm (14 tur) liczy D z X = 2000 × (1 − 0,35) = 1300 → D = 1300*(3-1/3) = 3467; 6 miast po 800 PW
  // (×1,5 waga = 1200) pokrywa to trzema miastami — oferta ROZEJMU istnieje (przy cenie pokoju P = 3900, D = 10400 nie istniała).
  const weakTruce = ai(14, miasta(6, 800), 100, 300, 100, 200);
  check('A1r: rozejm AI (14 tur, r = 3): D = 3467 (X rozejmu), 3 miasta po 800 PW wystarczą → oferta rodzaj=rozejm z 2 dodatkowymi',
    weakTruce.length === 1 && weakTruce[0].type === 'oferuj_miasto_za_pokoj' && weakTruce[0].rodzaj === 'rozejm'
    && (weakTruce[0].dodatkoweMiasta || []).length === 2, weakTruce);
  const weakNoPow = ai(14, miasta(6, 800), undefined, undefined, 100, 200);
  check('A3: bez mocy (stary kontrakt) AI płaci samo P (800 PW × waga, 6 miast) → oferta jak dotąd',
    weakNoPow.some(c => c.type === 'oferuj_miasto_za_pokoj'), weakNoPow);
  const weakStrongPow = ai(14, miasta(6, 800), 300, 100, 100, 200);
  check('A4: AI słabsze militarnie, ale SILNIEJSZE mocą (D = 0) → nie składa oferty miasta (brak dopłaty do pokrycia)',
    !weakStrongPow.some(c => c.type === 'oferuj_miasto_za_pokoj'), weakStrongPow);
  const cap = [{ cityId: 'cap', cityPn: 90000, zakazane: true }];
  const weakCapOnly = ai(14, cap, 100, 300, 100, 200);
  check('A5: (c) AI słabsze, jedyne miasto = stolica (zakazane) → brak oferty miasta (wymuszony pokój zostaje drogą 100%)',
    !weakCapOnly.some(c => c.type === 'oferuj_miasto_za_pokoj'), weakCapOnly);
  // (e) AI silniejsze żąda D od gracza: rw >= 0,7, wojna >= 20 tur. P przy 20 turach: L = 0,5 → 3000; r = 3 → D = 8000.
  const strongArgs = (miastaGracza, mocAI, mocPl) => ai(20, miasta(3, 800), mocAI, mocPl, 200, 100, {
    respektWzgledny: 0.8, miastaPartnera: miastaGracza });
  const demandBig = strongArgs([{ cityId: 'p1', cityPn: 9000, zakazane: false }], 300, 100);
  check('A6: (e) AI silniejsze mocą (r = 3) żąda miasta gracza o wartości ≥ D (9000 ≥ 8000)',
    demandBig.some(c => c.type === 'zada_miasto_za_pokoj' && c.cityId === 'p1'), demandBig);
  const demandSmall = strongArgs([{ cityId: 'p1', cityPn: 5000, zakazane: false }], 300, 100);
  check('A7: (e) miasto gracza < D (5000 < 8000) → AI nie żąda (nie ma czym pokryć D)',
    !demandSmall.some(c => c.type === 'zada_miasto_za_pokoj'), demandSmall);
  const demandEqualPow = strongArgs([{ cityId: 'p1', cityPn: 9000, zakazane: false }], 100, 100);
  check('A8: (e) równa moc (r = 1, D = 0) → AI nie żąda miasta (konsekwencja wzoru)',
    !demandEqualPow.some(c => c.type === 'zada_miasto_za_pokoj'), demandEqualPow);
  // (A9) mutacja: ai.ts bez aiPeaceCityDuePn w N1b/N1a (powrót do samego P) czerwieni A1/A4/A8 — dowód czułości
  const aiSrc = fs.readFileSync(path.join(SRC_DIR, 'ai.ts'), 'utf8');
  check('A9: ai.ts używa aiPeaceCityDuePn w obu ścieżkach (oddanie i żądanie)',
    (aiSrc.match(/aiPeaceCityDuePn\(/g) || []).length >= 3);
}
// (T) r3 P3: panel PW — tooltip z mocami, r, S, W, D, rabatem relacji i etykietą „(po rabacie relacji)”
{
  const info = (ps) => ({ turnsAtWar: 10, lostCities: 0, level: 0.25, cenaPokojuPn: 4500, powerSplit: ps });
  const weak = { playerPower: 2611, otherPower: 6969, r: 2.669, S: 11530, W: 1619, D: 9911, dAfterRelief: 8000, playerStronger: false };
  const h1 = M.peacePowerSplitRowHtml(info(weak));
  check('T1: gracz słabszy — tooltip: moce 2611/6969, r = 2,7, S, W, D, „po rabacie relacji” i kwota dopłaty',
    /2.?611/.test(h1) && /6.?969/.test(h1) && /r = 2,7/.test(h1) && /11.?530/.test(h1) && /1.?619/.test(h1) && /9.?911/.test(h1)
    && /po rabacie relacji/.test(h1) && /dopłacasz miastami/.test(h1), h1);
  const strong = { playerPower: 6969, otherPower: 2611, r: 2.669, S: 11530, W: 1619, D: 9911, dAfterRelief: 9911, playerStronger: true };
  const h2 = M.peacePowerSplitRowHtml(info(strong));
  check('T2: gracz silniejszy — „nie dopłacasz”, bez słowa „Brakuje”', /nie dopłacasz/.test(h2) && !/Brakuje/.test(h2), h2);
  const eq = { playerPower: 100, otherPower: 100, r: 1, S: 4320, W: 4320, D: 0, dAfterRelief: 0, playerStronger: true };
  check('T3: r = 1 — „brak dopłaty”', /brak dopłaty/.test(M.peacePowerSplitRowHtml(info(eq))));
  check('T4: bez powerSplit → pusty ciąg (zachowanie sprzed zmiany)', M.peacePowerSplitRowHtml(info(undefined)) === '');
  // (T5) evaluateProposal przekazuje powerSplit w wearinessInfo (silnik → panel)
  const evW = playerPeace([100, 300], null);
  const ps = evW.wearinessInfo && evW.wearinessInfo.powerSplit;
  check('T5: evaluateProposal zwraca wearinessInfo.powerSplit (moce 100/300, r = 3, playerStronger = false)',
    !!ps && ps.playerPower === 100 && ps.otherPower === 300 && ps.r === 3 && ps.playerStronger === false && ps.dAfterRelief > 0, evW.wearinessInfo);
}


// --- (M2) mutacja ai.ts: aiPeaceCityDuePn zwraca samo P (brak wzoru mocy po stronie AI) → A4 i A8 muszą czerwienieć ---
{
  const aiSrc = fs.readFileSync(path.join(SRC_DIR, 'ai.ts'), 'utf8');
  const sig = 'export function aiPeaceCityDuePn(';
  const i = aiSrc.indexOf(sig);
  const bodyStart = aiSrc.indexOf('{', aiSrc.indexOf('): number', i)) + 1;
  const mutSrc = aiSrc.slice(0, bodyStart) + '\n  return basePn;\n' + aiSrc.slice(aiSrc.indexOf('\n}\n', bodyStart));
  const mutPath = path.join(SRC_DIR, `.pwpow-ai-${TAG}.ts`);
  const entry = path.resolve(GRA, 'src', `.pwpow-aient-${TAG}.ts`);
  const out = path.resolve(__dirname, `.pwpow-ai-${TAG}.cjs`);
  fs.writeFileSync(mutPath, mutSrc, 'utf8');
  fs.writeFileSync(entry, `export { decideAIDiplomacy } from './game/.pwpow-ai-${TAG}';\n`, 'utf8');
  try {
    esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: out,
      absWorkingDir: GRA, loader: { '.ts': 'ts', '.json': 'json' }, logLevel: 'silent' });
  } finally { for (const f of [mutPath, entry]) { try { fs.unlinkSync(f); } catch (_) { /* ok */ } } }
  const MM = require(out);
  try { fs.unlinkSync(out); } catch (_) { /* ok */ }
  const aiM = (mocAI, mocPl, silaAI, silaPl, extra) => MM.decideAIDiplomacy({
    myPlayerId: '1', agresja: 0.5, currentTurn: 80, skarbiecGold: 0,
    miastaAI: Array.from({ length: 6 }, (_, i) => ({ cityId: 'c' + i, cityPn: 800, zakazane: false })),
    relacje: [Object.assign({
      partnerId: '0', relation: { zaufanie: 0, respekt: 29, status: 'wojna' }, respektWzgledny: 0.06,
      stanWojny: true, turnsAtWar: 14, lostCitiesInWar: 0, turnsSinceCityChange: 14, armyHealthShare: 0.9, peaceLocked: false,
      silaMilitarnaAI: { sila: silaAI, armiaPkt: 0 }, silaMilitarnaPartner: { sila: silaPl, armiaPkt: 0 }, mocAI, mocPartner: mocPl,
    }, extra || {})],
  }).filter(c => c.targetId === '0');
  const a4m = aiM(300, 100, 100, 200);
  check('M2: mutant ai.ts (D = samo P) → A4 czerwieni (AI silniejsze mocą wciąż oferuje miasto) — test czuły na wzór po stronie AI',
    a4m.some(c => c.type === 'oferuj_miasto_za_pokoj'), a4m);
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
