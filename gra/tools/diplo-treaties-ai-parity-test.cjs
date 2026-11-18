'use strict';
/**
 * diplo-treaties-ai-parity-test.cjs — R-WEB-DIPLO-TREATIES-POWER-PARITY-IMPL-Q1 (runda 3, priorytet 2/3).
 * Ścieżka AI i AI↔AI parytetu siły dla szóstki (rozejm, nap, granice, sojusz_defensywny, sojusz_pelny, wasal):
 *  (A) wzór D = S − W po stronie AI (aiTreatyParityDuePn) dla 6 traktatów × r = 1 / 1,5 / 2,67 / 5 / 10 + moc słabszej 0,
 *      silniejszy płaci 0, brak mocy → 0, traktaty spoza listy (pokój, handel, tech, dar…) → 0;
 *  (B) decideAIDiplomacy: AI słabsze wg POWER nie proponuje paktu (nap) ani sojuszu (brak czym zapłacić D);
 *      równe / silniejsze / bez pól mocy — oferta jak dotąd; progi gotowości 130/90 bez zmian;
 *  (C) rozejm AI (oferuj_miasto_za_pokoj rodzaj=rozejm): D liczone z X = 2000 × (1 − L); AI słabsze bez miast ⇒ brak oferty;
 *  (D) POMIAR częstości rozejmów AI względem BAZY (7cc59b10f, ai.ts sprzed zmiany): siatka r × L × miasta — nowa liczba ofert
 *      NIE spada względem bazy (nie tylko deklaracja);
 *  (E) evaluateProposal rozejmu AUTORA-AI: słabsze AI nie żąda niczego (bilans 0), silniejsze żąda D (nie surowej bazy 2000);
 *  (F) wiring main.ts: AI↔AI rozejm przez aiTreatyParityDuePn, bilans od ceny, brama przemarszu, rozejm AI → gracz;
 *  (M) mutacje: ai.ts bez bramki sojuszu / bez bramki paktu czerwienią (B); main.ts bez bramki przemarszu czerwieni (F).
 * Run: node tools/diplo-treaties-ai-parity-test.cjs
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const SRC_GAME = path.resolve(GRA, 'src', 'game');
const TAG = `${process.pid}`;
const BASE_SHA = '7cc59b10fda74da45b659d2caba67b4cac4aac4b';
let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}

let seq = 0;
/** Bundle z opcjonalnie podmienionym ai.ts (mutant / baza). */
function load(aiSrc) {
  const entry = path.resolve(GRA, 'src', `.tap-entry-${TAG}-${++seq}.ts`);
  const aiTmp = path.join(SRC_GAME, `.tap-ai-${TAG}-${seq}.ts`);
  const out = path.resolve(__dirname, `.tap-${TAG}-${seq}.cjs`);
  if (aiSrc != null) fs.writeFileSync(aiTmp, aiSrc, 'utf8');
  const aiPath = aiSrc != null ? `./game/.tap-ai-${TAG}-${seq}` : './game/ai';
  fs.writeFileSync(entry, [
    `export { decideAIDiplomacy, aiPeaceCityDuePn } from '${aiPath}';`,
    "export { aiTreatyParityDuePn, treatyParityBasePnFromData, peacePwPointsByPowerRatio } from './game/war-weariness';",
    "export { evaluateProposal, treatyParityBaseX } from './game/diplomacy-proposals';",
    '',
  ].join('\n'), 'utf8');
  try {
    esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: out,
      absWorkingDir: GRA, loader: { '.ts': 'ts', '.json': 'json', '.svg': 'text', '.css': 'text' }, logLevel: 'silent' });
  } finally {
    for (const f of [entry, aiTmp]) { try { fs.unlinkSync(f); } catch (_) { /* ok */ } }
  }
  const m = require(out);
  try { fs.unlinkSync(out); } catch (_) { /* ok */ }
  return m;
}

const M = load(null);
const SIX = ['rozejm', 'nap', 'granice', 'sojusz_defensywny', 'sojusz_pelny', 'wasal'];
const DATA_X = { rozejm: 2000, nap: 2000, granice: 600, sojusz_defensywny: 4200, sojusz_pelny: 5000, wasal: 3500 };

// ---------------------------------------------------------------------------
// (A) wzór po stronie AI
// ---------------------------------------------------------------------------
for (const t of SIX) {
  check(`A0 ${t}: X z danych (JSON, ×10) = ${DATA_X[t]}`, M.treatyParityBasePnFromData(t, 0) === DATA_X[t], M.treatyParityBasePnFromData(t, 0));
}
check('A0b rozejm: X = 2000 × (1 − L): L = 0,5 → 1000, L = 1 → 0; pozostałe bez L',
  M.treatyParityBasePnFromData('rozejm', 0.5) === 1000 && M.treatyParityBasePnFromData('rozejm', 1) === 0
  && M.treatyParityBasePnFromData('nap', 0.5) === 2000);
const RATIOS = [[100, 100], [150, 100], [6969, 2611], [500, 100], [1000, 100], [500, 0]];
for (const t of SIX) {
  for (const [strong, weak] of RATIOS) {
    const X = M.treatyParityBasePnFromData(t, 0);
    const sp = M.peacePwPointsByPowerRatio(X, strong, weak);
    const duePayerWeak = M.aiTreatyParityDuePn(t, weak, strong, 0);
    const duePayerStrong = M.aiTreatyParityDuePn(t, strong, weak, 0);
    const wantD = strong === weak ? 0 : sp.D;
    check(`A1 ${t} r = ${sp.r.toFixed(2)} (${strong}/${weak}): AI słabsze płaci D = S − W = ${wantD}; silniejsze płaci 0`,
      duePayerWeak === wantD && duePayerStrong === 0 && sp.D === sp.S - sp.W && sp.S === Math.round(X * sp.r) && sp.W === Math.round(X / sp.r),
      { duePayerWeak, duePayerStrong, wantD });
  }
}
check('A2 brak mocy któregokolwiek → 0 (bez blokady; stary kontrakt)',
  M.aiTreatyParityDuePn('sojusz_pelny', undefined, 100) === 0 && M.aiTreatyParityDuePn('sojusz_pelny', 100, undefined) === 0);
for (const t of ['pokoj', 'handel', 'umowa_handlowa', 'umowa_szlakow', 'tech', 'dar', 'trybut_zadanie', 'ultimatum', 'namow_wojne']) {
  check(`A3 ${t}: poza listą parytetu → 0 (cena i reguły bez zmian)`, M.aiTreatyParityDuePn(t, 100, 1000, 0) === 0 && M.treatyParityBasePnFromData(t, 0) === 0);
}
check('A4 rozejm: zmęczenie obniża D (L = 0,5: X = 1000, r = 5 → D = 4800)',
  M.aiTreatyParityDuePn('rozejm', 100, 500, 0.5) === 4800, M.aiTreatyParityDuePn('rozejm', 100, 500, 0.5));

// ---------------------------------------------------------------------------
// (B) decideAIDiplomacy: pakt i sojusz
// ---------------------------------------------------------------------------
function paktCmd(MOD, mocAI, mocPartner) {
  return MOD.decideAIDiplomacy({
    myPlayerId: 'ai-1', agresja: 0.2, agresywnoscRaw: 2, sklonnoscDoPodboju: 2,
    relacje: [{ partnerId: 'peaceful-1', stanWojny: false, respektWzgledny: 0.5, hasNapTreaty: false,
      relation: { zaufanie: 49, respekt: 49, status: 'pokoj' }, mocAI, mocPartner }],
  }).find(c => c.type === 'zaproponuj_pakt');
}
function sojuszCmd(MOD, mocAI, mocPartner) {
  return MOD.decideAIDiplomacy({
    myPlayerId: 'ai-1', myTypCywilizacji: 'grecy', agresja: 0.1,
    relacje: [{ partnerId: 'p-1', partnerTypCywilizacji: 'rzymianie', relation: { zaufanie: 95, respekt: 70, status: 'pokoj' },
      respektWzgledny: 0.75, stanWojny: false, mocAI, mocPartner }],
  }).find(c => c.type === 'zaproponuj_sojusz');
}
check('B1 pakt: AI słabsze wg POWER (100 vs 300) → brak oferty (nie ma czym zapłacić D)', !paktCmd(M, 100, 300));
check('B2 pakt: równa moc (D = 0) → oferta jak dotąd', !!paktCmd(M, 100, 100));
check('B3 pakt: AI silniejsze → oferta (blokada „Brakuje” dotyczy tylko autora-gracza)', !!paktCmd(M, 300, 100));
check('B4 pakt: bez pól mocy (stary kontrakt) → oferta jak dotąd', !!paktCmd(M, undefined, undefined));
check('B5 sojusz: AI słabsze (100 vs 300) → brak oferty mimo rdzenia 130/90', !sojuszCmd(M, 100, 300));
check('B6 sojusz: równa moc → oferta (progi gotowości 130/90 bez zmian)', !!sojuszCmd(M, 100, 100));
check('B7 sojusz: AI silniejsze → oferta', !!sojuszCmd(M, 300, 100));
check('B8 sojusz: bez mocy → oferta jak dotąd', !!sojuszCmd(M, undefined, undefined));
check('B9 sojusz: Zaufanie 89 (< 90) → brak oferty także przy równej mocy (próg gotowości nieruszony)', (() => {
  const c = M.decideAIDiplomacy({ myPlayerId: 'ai-1', myTypCywilizacji: 'grecy', agresja: 0.1,
    relacje: [{ partnerId: 'p-1', partnerTypCywilizacji: 'rzymianie', relation: { zaufanie: 89, respekt: 70, status: 'pokoj' },
      respektWzgledny: 0.75, stanWojny: false, mocAI: 100, mocPartner: 100 }] }).find(x => x.type === 'zaproponuj_sojusz');
  return !c;
})());

// ---------------------------------------------------------------------------
// (C) rozejm AI: miasta, X = 2000 × (1 − L)
// ---------------------------------------------------------------------------
const aiWar = (MOD, turns, miasta, mocAI, mocPl, silaAI, silaPl) => MOD.decideAIDiplomacy({
  myPlayerId: '1', agresja: 0.5, currentTurn: 80, skarbiecGold: 0, miastaAI: miasta,
  relacje: [{ partnerId: '0', relation: { zaufanie: 0, respekt: 29, status: 'wojna' }, respektWzgledny: 0.06, stanWojny: true,
    turnsAtWar: turns, lostCitiesInWar: 0, turnsSinceCityChange: turns, armyHealthShare: 0.9, peaceLocked: false,
    silaMilitarnaAI: { sila: silaAI, armiaPkt: 0 }, silaMilitarnaPartner: { sila: silaPl, armiaPkt: 0 }, mocAI, mocPartner: mocPl }],
}).filter(c => c.targetId === '0');
const miasta = (n, pn, zakazane) => Array.from({ length: n }, (_, i) => ({ cityId: 'c' + i, cityPn: pn, zakazane: !!zakazane }));
// 14 tur: L = 0,35 → X = 1300; r = 3 → D = 1300 × (3 − 1/3) = 3467; waga miasta 1,5.
const truceOk = aiWar(M, 14, miasta(6, 800), 100, 300, 100, 200);
check('C1 rozejm AI (14 tur, r = 3): D = 3467 pokrywają 3 miasta po 800 PW (×1,5) → oferta rodzaj=rozejm, 2 dodatkowe',
  truceOk.length === 1 && truceOk[0].rodzaj === 'rozejm' && (truceOk[0].dodatkoweMiasta || []).length === 2, truceOk);
const truceNoCities = aiWar(M, 14, miasta(6, 100), 100, 300, 100, 200);
check('C2 AI słabsze bez czym zapłacić D (miasta po 100 PW) → brak oferty rozejmu (odmowa)', !truceNoCities.some(c => c.type === 'oferuj_miasto_za_pokoj'), truceNoCities);
const truceCapOnly = aiWar(M, 14, miasta(1, 90000, true), 100, 300, 100, 200);
check('C3 AI słabsze, jedyne miasto = stolica (zakazane) → brak oferty', !truceCapOnly.some(c => c.type === 'oferuj_miasto_za_pokoj'), truceCapOnly);
const truceEqual = aiWar(M, 14, miasta(6, 800), 300, 100, 100, 200);
check('C4 AI silniejsze mocą (D = 0) → nie oddaje miasta za rozejm', !aiWar(M, 14, miasta(6, 800), 300, 100, 100, 200).some(c => c.type === 'oferuj_miasto_za_pokoj'), truceEqual);
const peaceKind = aiWar(M, 20, miasta(6, 5000), 100, 300, 100, 200);
check('C5 pokój (≥ 20 tur) bez zmian: model P = wearinessPeaceCashPn (L = 0,5 → 3000, D = 8000) → 2 miasta po 5000 PW',
  peaceKind.length === 1 && peaceKind[0].rodzaj === 'pokoj' && (peaceKind[0].dodatkoweMiasta || []).length === 1, peaceKind);

// ---------------------------------------------------------------------------
// (D) POMIAR częstości rozejmów AI względem bazy (ai.ts z 7cc59b10f)
// ---------------------------------------------------------------------------
let baseMod = null;
try {
  const baseAi = execFileSync('git', ['show', `${BASE_SHA}:gra/src/game/ai.ts`], { cwd: GRA, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  baseMod = load(baseAi);
} catch (e) {
  console.log('UWAGA: nie można odczytać ai.ts z bazy (' + String(e && e.message).slice(0, 80) + ') — sekcja D (pomiar vs baza) pominięta');
}
let nTruceNew = 0; let nTruceBase = 0; let nCells = 0; let nWorse = 0; let nBetter = 0;
if (baseMod) {
  for (const [strong, weak] of [[100, 100], [150, 100], [267, 100], [500, 100], [1000, 100]]) {
    for (const turns of [5, 8, 11, 14, 17, 19]) {
      for (const cityPn of [200, 800, 1500, 3000, 6000]) {
        for (const n of [1, 2, 4, 6]) {
          const args = [turns, miasta(n, cityPn), weak, strong, 100, 200];
          const hasTruce = list => list.some(c => c.type === 'oferuj_miasto_za_pokoj' && c.rodzaj === 'rozejm');
          const a = hasTruce(aiWar(M, ...args));
          const b = hasTruce(aiWar(baseMod, ...args));
          nCells++; if (a) nTruceNew++; if (b) nTruceBase++;
          if (b && !a) nWorse++; if (a && !b) nBetter++;
        }
      }
    }
  }
  check(`D1 POMIAR: rozejmy AI (oferta miasta za rozejm) nowe ${nTruceNew}/${nCells} vs baza ${nTruceBase}/${nCells} — liczba NIE spada`,
    nTruceNew >= nTruceBase, { nTruceNew, nTruceBase, nCells });
  check('D2 POMIAR: żadna komórka siatki nie traci oferty rozejmu względem bazy (nowy X rozejmu ≤ P pokoju)', nWorse === 0, { nWorse, nBetter });
  console.log(`  [pomiar] siatka r×L×miasta: nowe=${nTruceNew}, baza=${nTruceBase}, komórek=${nCells}, lepiej=${nBetter}, gorzej=${nWorse}`);
}

// ---------------------------------------------------------------------------
// (E) evaluateProposal rozejmu autora-AI: bilans liczony od D, nie od surowej bazy 2000
// ---------------------------------------------------------------------------
const warCtx = (pPlayer, pOther) => ({
  relation: { zaufanie: 5, respekt: 5, status: 'wojna' }, stanWojny: true, turn: 50, difficulty: 'normal', activeDeals: [],
  proposerRespekt: 50, responderRespekt: 50, proposerWiarygodnosc: 100, responderWiarygodnosc: 100,
  warState: { turnsAtWar: 14, lostCitiesResponder: 0, turnsSinceCityChange: 14, responderRw: 0.5, powerPlayer: pPlayer, powerOther: pOther },
  treatyPower: { powerPlayer: pPlayer, powerOther: pOther },
});
const truceFromAi = () => ({ actionId: 'rozejm', proposerOwnerId: 1, responderOwnerId: 0, payload: { turns: 10 } });
const aiWeakerEval = M.evaluateProposal(truceFromAi(), warCtx(300, 100));
const aiStrongerEval = M.evaluateProposal(truceFromAi(), warCtx(100, 300));
check('E1 rozejm autora-AI, AI słabsze: AI niczego nie żąda → bilans 0 (nie liczony od 2000)',
  aiWeakerEval.pwBalance === 0 || aiWeakerEval.pwBalance === undefined, aiWeakerEval);
check('E2 rozejm autora-AI, AI silniejsze: bilans liczony od D (ujemny, skończony), nie „pełna baza” 2000',
  typeof aiStrongerEval.pwBalance === 'number' && aiStrongerEval.pwBalance < 0, aiStrongerEval);

// ---------------------------------------------------------------------------
// (F) wiring main.ts (źródło)
// ---------------------------------------------------------------------------
const mainSrc = fs.readFileSync(path.resolve(GRA, 'src', 'main.ts'), 'utf8');
check('F1 main.ts: AI↔AI rozejm liczy D przez aiTreatyParityDuePn(\'rozejm\', …, aiAiPairWearinessLevel)',
  /aiTreatyParityDuePn\(\s*'rozejm',\s*objectivePowerForOwner\(loser\),\s*objectivePowerForOwner\(winner\),\s*aiAiPairWearinessLevel\(winner, loser\)\s*\)/.test(mainSrc));
check('F2 main.ts: bilans AI↔AI rozejmu od ceny (balBasePn = requiredPn), nie od bazy 2000', /const balBasePn = kind === 'rozejm' \? requiredPn : basePn;/.test(mainSrc));
check('F3 main.ts: prośba AI o przemarsz bramkowana parytetem (AI słabsze → brak prośby)',
  /aiTreatyParityDuePn\('granice', objectivePowerForOwner\(aiOwnerId\), objectivePowerForOwner\(territoryOwnerId\)\) > 0\) return;/.test(mainSrc));
check('F4 main.ts: rozejm AI → gracz: baza żądania = D z parytetu (aiTreatyParityDuePn), nie surowa 2000',
  /const rozejmParity = workingCmd\.rodzaj === 'rozejm' && treatyParityBasePnFromData\('rozejm'\) > 0;/.test(mainSrc)
  && /aiTreatyParityDuePn\(\s*'rozejm', objectivePowerForOwner\(ME\(\)\), objectivePowerForOwner\(ownerId\),/.test(mainSrc));

// ---------------------------------------------------------------------------
// (M) mutacje
// ---------------------------------------------------------------------------
{
  const aiSrc = fs.readFileSync(path.join(SRC_GAME, 'ai.ts'), 'utf8');
  const sojGate = "&& aiTreatyParityDuePn(sojuszAllianceKind === 'pelny' ? 'sojusz_pelny' : 'sojusz_defensywny', rel.mocAI, rel.mocPartner) <= 0";
  const napGate = "&& aiTreatyParityDuePn('nap', rel.mocAI, rel.mocPartner) <= 0";
  check('M0 źródło ai.ts zawiera obie bramki (inaczej mutacja bez sensu)', aiSrc.includes(sojGate) && aiSrc.includes(napGate));
  const mSoj = load(aiSrc.replace(sojGate, ''));
  check('M1 mutant bez bramki sojuszu → B5 czerwieni (AI słabsze znów proponuje sojusz)', !!sojuszCmd(mSoj, 100, 300));
  const mNap = load(aiSrc.replace(napGate, ''));
  check('M2 mutant bez bramki paktu → B1 czerwieni (AI słabsze znów proponuje pakt)', !!paktCmd(mNap, 100, 300));
  const mainMut = mainSrc.replace(/aiTreatyParityDuePn\('granice'[^\n]*\n/, '');
  check('M3 mutant main.ts bez bramki przemarszu → F3 czerwieni', !/aiTreatyParityDuePn\('granice'/.test(mainMut));
}

console.log(`\ndiplo-treaties-ai-parity-test: ${pass} pass / ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
