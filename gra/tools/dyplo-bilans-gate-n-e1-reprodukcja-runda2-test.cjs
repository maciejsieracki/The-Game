'use strict';
/**
 * dyplo-bilans-gate-n-e1-reprodukcja-runda2-test.cjs
 *
 * TEMAT: P-DYPLO-BILANS-GATE-NIESPOJNY-N-E1-REPRODUKCJA — RUNDA 2
 *
 * GOAL 1 (diagnoza z dowodem PRZED jakąkolwiek poprawką) + GOAL 2/3 (naprawa strukturalna,
 * reguła właściciela wprost w kodzie) + GOAL 4 (gate na AI-propozycje o ujemnym bilansie).
 * Deterministyczny test jednostkowy (esbuild -> Node CJS, BEZ mocków) na REALNYCH funkcjach
 * produkcyjnych — evaluateProposal / generateCounterOffer (diplomacy-proposals.ts),
 * computePlayerAcceptanceSides (diplomacy-acceptance-points.ts), balancePanelDataFromRows
 * (diplomacyAcceptanceBalance.ts) — dokładnie ta sama ścieżka, którą main.ts woła przy
 * budowie stołu negocjacji i przy realnym wykonaniu (previewNegotiationEntry ->
 * evaluateProposal; resolveNegotiationAsResponder -> generateCounterOffer).
 *
 * DIAGNOZA (CZĘŚĆ 0, żywo potwierdzona reconem tej rundy — patrz raport Operatora):
 * Mechanizm case 1 (Chińczycy, bilans ujemny, "Możesz przyjąć" aktywne) i case 2 (pakiet 3
 * pozycji, bilans dodatni, zablokowane) to DWA RÓŻNE kierunki TEGO SAMEGO strukturalnego
 * defektu: dla akcji traktatowych BEZ WŁASNEJ BRAMKI PW (nap/sojusz (oba warianty)/wasal/trybut_zadanie/
 * trybut_oferta/granice — próg WYŁĄCZNIE Relacja/Zaufanie/Respekt, evaluateProposal nigdy nie
 * odrzuca ich z powodu PW, patrz `treatyPnGate`/`proposerUnfairToPartnerGate`:
 * `if (!proposerIsPlayer) return null` — świadomie wyłączone dla incoming/AI-proponent):
 *   - `responderPreview.pwBalance` był `undefined` (evaluateProposal nie zwracał tego pola
 *     dla tych case'ów) -> `balancePanelDataFromRows` traktował wiersz jako "brak numerycznego
 *     pwBalance" (`allActionableHavePwBalance=false`) -> wyświetlany "Bilans" spadał na SUROWY
 *     `myOfferPn-theirOfferPn`, ALBO (pojedynczy wiersz incoming, treatyBase>0) na
 *     `computePlayerAcceptanceSides`'s `asymBalance = myDisplay-theirDisplay`, gdzie strona
 *     gracza (`treatyPwForRole(...,'player')`) jest DYSKONTOWANA Relacją<100, a strona
 *     partnera (`'partner'`) trzymana na STAŁEJ bazie — asymetria INFORMACYJNA (statusLabel:
 *     "możesz przyjąć bez dopłaty"), NIEZWIĄZANA z faktyczną bramką accept/reject, ale
 *     wyświetlana jako GŁÓWNA liczba "Bilans" panelu.
 *   - Case 1 (WASAL, ŻYWO ODTWORZONE niżej): relTotal<100 (typowe, nie ekstremum) + wasal
 *     akceptowany WYŁĄCZNIE progiem Respektu (niezależnym od relTotal) -> `net` silnie ujemny
 *     (np. -210 w tym teście) mimo `canAccept=true` — DOKŁADNIE wzorzec zrzutu 1 Macieja
 *     ("bilans -51... zielone Możesz przyjąć, Przyjmij aktywny").
 *   - Case 2 (pakiet z GRANICE, ŻYWO ODTWORZONE niżej): granice odrzucone (Relacja/Zaufanie
 *     za niskie) w pakiecie z pozycjami, które SĄ zaakceptowane -> `allActionableHavePwBalance
 *     =false` (bo granice nie niosło pwBalance) -> fallback na surowy `myOfferPn-theirOfferPn`,
 *     DODATNI, mimo że pakiet jest zablokowany — DOKŁADNIE wzorzec zrzutu 2.
 * NAPRAWA (allowlista): `evaluateProposal` dostaje `pwBalance` dla WSZYSTKICH gałęzi (accept
 * I reject) tych 6 case'ów (0 gdy accepted — "bez dopłaty" nie jest fikcją, to prawdziwy fakt
 * silnika; -1 (umowna, symboliczna wartość) gdy nie accepted — BEZ zmiany warunków
 * accepted/reason, wyłącznie dodanie pola), `balancePanelDataFromRows` dostaje twardą regułę
 * GOAL 3 (blockReason zawsze, gdy numeryczny pwBalance<0, niezależnie od accepted), a
 * `generateCounterOffer` dostaje gate GOAL 4 (nigdy nie zwraca kandydata z pwBalance<0, gdy
 * proponentem jest AI).
 *
 * Usage (z gra/): node tools/dyplo-bilans-gate-n-e1-reprodukcja-runda2-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.dyplo-bilans-n-e1-r2-entry.ts');
const DIPLO_PROPOSALS = path.resolve(GRA, 'src', 'game', 'diplomacy-proposals.ts');
const DIPLO_BALANCE = path.resolve(GRA, 'src', 'ui', 'diplomacyAcceptanceBalance.ts');

const BUNDLES = {
  fixed: path.resolve(__dirname, '.dyplo-n-e1-r2-fixed.cjs'),
  mutA: path.resolve(__dirname, '.dyplo-n-e1-r2-mutA.cjs'),
  mutB: path.resolve(__dirname, '.dyplo-n-e1-r2-mutB.cjs'),
  mutD: path.resolve(__dirname, '.dyplo-n-e1-r2-mutD.cjs'),
  mutDC: path.resolve(__dirname, '.dyplo-n-e1-r2-mutDC.cjs'),
  mutE: path.resolve(__dirname, '.dyplo-n-e1-r2-mutE.cjs'),
};

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

function cleanup() {
  try { fs.unlinkSync(ENTRY); } catch (_) { /* ok */ }
  for (const p of Object.values(BUNDLES)) {
    try { fs.unlinkSync(p); } catch (_) { /* ok */ }
  }
}

function writeEntry() {
  fs.writeFileSync(ENTRY, [
    "/* GENEROWANY PRZEZ dyplo-bilans-gate-n-e1-reprodukcja-runda2-test.cjs — nie edytowac recznie. */",
    "export { evaluateProposal, generateCounterOffer, aiCommandToPendingProposal } from '../src/game/diplomacy-proposals';",
    "export { computePlayerAcceptanceSides } from '../src/game/diplomacy-acceptance-points';",
    "export { balancePanelDataFromRows, renderPnBalancePanelHtml } from '../src/ui/diplomacyAcceptanceBalance';",
    "",
  ].join('\n'), 'utf8');
}

/* Mutacja A (KONTROLA NIETAUTOLOGICZNA, PRZED tej rundy): usuwa WYŁĄCZNIE ", pwBalance: 0"
 * i ", pwBalance: -1" dodane w tej rundzie do nap/sojusz (oba warianty)/trybut_zadanie/trybut_oferta/
 * granice/wasal w evaluateProposal — przywraca kod DOKŁADNIE sprzed naprawy (GOAL 2). */
const mutA = { applied: 0 };
const pluginA = {
  name: 'revert-pwbalance-additions',
  setup(build) {
    build.onLoad({ filter: /diplomacy-proposals\.ts$/ }, (args) => {
      if (path.resolve(args.path) !== DIPLO_PROPOSALS) return null;
      const src = fs.readFileSync(args.path, 'utf8');
      let n = 0;
      const out = src
        .replace(/accepted: true, pwBalance: 0,/g, () => { n++; return 'accepted: true,'; })
        .replace(/accepted: false, pwBalance: -1,/g, () => { n++; return 'accepted: false,'; });
      mutA.applied = n;
      return { contents: out, loader: 'ts', resolveDir: path.dirname(args.path) };
    });
  },
};

/* Mutacja B (KONTROLA NIETAUTOLOGICZNA dla Test 3): wyłącza WYŁĄCZNIE regułę GOAL 3
 * (blockReason z ujemnego pwBalance) w balancePanelDataFromRows — reszta pliku (w tym
 * mechanizm MIN z rund poprzednich) nietknięta. */
const mutB = { applied: 0 };
const pluginB = {
  name: 'revert-goal3-hard-rule',
  setup(build) {
    build.onLoad({ filter: /diplomacyAcceptanceBalance\.ts$/ }, (args) => {
      if (path.resolve(args.path) !== DIPLO_BALANCE) return null;
      const src = fs.readFileSync(args.path, 'utf8');
      const marker = "if (row.responderPreview.pwBalance < 0 && blockReason == null && row.uiActionId !== '10') {";
      const idx = src.indexOf(marker);
      if (idx < 0) { mutB.applied = 0; return { contents: src, loader: 'ts', resolveDir: path.dirname(args.path) }; }
      const closeIdx = src.indexOf('\n        }', idx);
      const out = src.slice(0, idx) + 'if (false) {' + src.slice(idx + marker.length, closeIdx) + src.slice(closeIdx);
      mutB.applied = 1;
      return { contents: out, loader: 'ts', resolveDir: path.dirname(args.path) };
    });
  },
};

/* Mutacja D (GOAL 4, KONTROLA NIETAUTOLOGICZNA — REGUŁA PRZECIW SAMOOSZUKIWANIU: wymusza
 * scenariusz, w którym AI HISTORYCZNIE mogłoby zaproponować ujemny dla gracza pakiet):
 * psuje WYŁĄCZNIE `pwBalance` zwracany przy zaakceptowanej wasalizacji (symuluje regresję —
 * silnik "przez pomyłkę" liczy fatalny dla gracza bilans, mimo że accepted=true, Respekt OK).
 * Reszta pliku (w tym reguła GOAL 4 w generateCounterOffer, PLUGIN C niżej decyduje, czy jest
 * aktywna) nietknięta. */
const mutD = { applied: 0 };
const pluginD = {
  name: 'break-wasal-pwbalance',
  setup(build) {
    build.onLoad({ filter: /diplomacy-proposals\.ts$/ }, (args) => {
      if (path.resolve(args.path) !== DIPLO_PROPOSALS) return null;
      const src = fs.readFileSync(args.path, 'utf8');
      const needle = "return { accepted: true, pwBalance: 0, reason: 'Wasalizacja zaakceptowana', deal };";
      const replacement = "return { accepted: true, pwBalance: -999, reason: 'Wasalizacja zaakceptowana', deal };";
      const out = src.replace(needle, () => { mutD.applied++; return replacement; });
      return { contents: out, loader: 'ts', resolveDir: path.dirname(args.path) };
    });
  },
};

/* Mutacja D+C połączone w JEDNYM onLoad (esbuild woła tylko PIERWSZY pasujący onLoad dla
 * danego pliku — dwa osobne pluginy na ten sam filtr nie złożyłyby się). */
const mutDC = { appliedD: 0, appliedC: 0 };
const pluginDC = {
  name: 'break-wasal-pwbalance-and-revert-goal4-gate',
  setup(build) {
    build.onLoad({ filter: /diplomacy-proposals\.ts$/ }, (args) => {
      if (path.resolve(args.path) !== DIPLO_PROPOSALS) return null;
      let src = fs.readFileSync(args.path, 'utf8');
      const needleD = "return { accepted: true, pwBalance: 0, reason: 'Wasalizacja zaakceptowana', deal };";
      const replD = "return { accepted: true, pwBalance: -999, reason: 'Wasalizacja zaakceptowana', deal };";
      src = src.replace(needleD, () => { mutDC.appliedD++; return replD; });
      const needleC = "const proposerIsAi = proposal.proposerOwnerId !== 0;\n"
        + "  const tryPayload = (p: ProposalPayload): boolean => {\n"
        + "    const evalResult = evaluateProposal({ ...proposal, payload: p }, ctx);\n"
        + "    if (!evalResult.accepted) return false;\n"
        + "    if (proposerIsAi && evalResult.pwBalance != null && evalResult.pwBalance < 0) return false;\n"
        + "    return true;\n"
        + "  };";
      const replC = "const tryPayload = (p: ProposalPayload): boolean =>\n"
        + "    evaluateProposal({ ...proposal, payload: p }, ctx).accepted;";
      src = src.replace(needleC, () => { mutDC.appliedC++; return replC; });
      return { contents: src, loader: 'ts', resolveDir: path.dirname(args.path) };
    });
  },
};

/* Mutacja E (OBRONA RUNDA 2, KONTROLA NIETAUTOLOGICZNA dla Test 5 — zarzut 1 Evaluatora):
 * usuwa WYŁĄCZNIE ", pwBalance: pokojPwBalance" dodane w tej obronie do case 'pokoj' —
 * przywraca kod sprzed poprawki (case 'pokoj' zawsze accepted:true BEZ pwBalance,
 * niezależnie od bilansu, dla OBU ról).
 * AKTUALIZACJA RUNDA 4 (P-DYPLO-BILANS-GATE-NIESPOJNY-N-E1-REPRODUKCJA, decyzja właściciela
 * — 'pokoj' NIGDY nie blokuje canAccept liczbą pwBalance, patrz DECYZJA WŁAŚCICIELA runda 4 w
 * diplomacy-proposals.ts): rundy 2/3 miały tu DWIE gałęzie `return {accepted:false,
 * pwBalance:pokojPwBalance,...}` (gap>0 / oferta poniżej wartości @ Relacji, WYŁĄCZNIE
 * proposerIsPlayer) + JEDNĄ `return {accepted:true, pwBalance:pokojPwBalance,...}` — runda 4
 * USUNĘŁA obie gałęzie reject (decyzja produktowa: 'pokoj' nigdy nie blokuje), więc dziś w
 * pliku źródłowym zostaje już TYLKO JEDNO wystąpienie tego pola (ta sama zmienna, teraz
 * używana bezwarunkowo dla OBU ról) — licznik kontrolny niżej zmieniony z 3 na 1. */
const mutE = { applied: 0 };
const pluginE = {
  name: 'revert-pokoj-pwbalance',
  setup(build) {
    build.onLoad({ filter: /diplomacy-proposals\.ts$/ }, (args) => {
      if (path.resolve(args.path) !== DIPLO_PROPOSALS) return null;
      const src = fs.readFileSync(args.path, 'utf8');
      let n = 0;
      const out = src.replace(/pwBalance: pokojPwBalance,\s*/g, () => { n++; return ''; });
      mutE.applied = n;
      return { contents: out, loader: 'ts', resolveDir: path.dirname(args.path) };
    });
  },
};

async function buildBundle(outfile, plugins) {
  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile,
    absWorkingDir: GRA,
    loader: { '.ts': 'ts', '.json': 'json' },
    logLevel: 'silent',
    plugins,
  });
}

/** Wiersz 'incoming' + panel dokładnie jak main.ts::buildPendingNegotiationRows/previewNegotiationEntry. */
function buildIncomingRow(mod, actionId, payload, relation, relTotal, ctxExtra) {
  const proposal = { actionId, proposerOwnerId: 1, responderOwnerId: 0, payload };
  const ctx = Object.assign({
    relation, stanWojny: false, turn: 50,
    proposerRespekt: 60, responderRespekt: 60, militaryRatio: 1, respektWzgledny: 0.5,
    ekspansjaPrzyGranicy: false, difficulty: 'normal', proposerWiarygodnosc: 50,
  }, ctxExtra || {});
  const res = mod.evaluateProposal(proposal, ctx);
  const acceptance = mod.computePlayerAcceptanceSides(actionId, payload, relTotal, true, {
    difficulty: 'normal', proposerOwnerId: 1, tempoGry: 'standardowa',
  });
  return {
    id: actionId + '-1', direction: 'incoming', actionLabel: actionId, awaitingAiResponse: false,
    responderPreview: { accepted: res.accepted, reason: res.reason, pwBalance: res.pwBalance },
    acceptanceMy: acceptance.my, acceptanceTheir: acceptance.their,
    canCounter: true, uiActionId: '3',
  };
}

/** Wiersz 'own' (kontroferta gracza, awaitingAiResponse) dla pakietu case 2 — jak w rundzie 1. */
function buildOwnRow(mod, id, actionId, actionLabel, payload, relTotal, ctxExtra) {
  const proposal = { actionId, proposerOwnerId: 0, responderOwnerId: 1, payload };
  const ctx = Object.assign({
    relation: { zaufanie: 20, respekt: 20, status: 'pokoj' }, stanWojny: false, turn: 100,
    proposerRespekt: 60, responderRespekt: 60, militaryRatio: 1, respektWzgledny: 0.5,
    ekspansjaPrzyGranicy: false, difficulty: 'normal',
  }, ctxExtra || {});
  const res = mod.evaluateProposal(proposal, ctx);
  const acceptance = mod.computePlayerAcceptanceSides(actionId, payload, relTotal, false, {
    difficulty: 'normal', proposerOwnerId: 0, tempoGry: 'standardowa',
  });
  return {
    id, direction: 'own', actionLabel, awaitingAiResponse: true,
    responderPreview: { accepted: res.accepted, reason: res.reason, pwBalance: res.pwBalance },
    acceptanceMy: acceptance.my, acceptanceTheir: acceptance.their,
    canAccept: false, canCounter: false, uiActionId: actionId === 'handel' ? '14' : '5',
  };
}

async function main() {
  writeEntry();

  await buildBundle(BUNDLES.fixed, []);
  await buildBundle(BUNDLES.mutA, [pluginA]);
  await buildBundle(BUNDLES.mutB, [pluginB]);
  await buildBundle(BUNDLES.mutD, [pluginD]);
  await buildBundle(BUNDLES.mutDC, [pluginDC]);
  await buildBundle(BUNDLES.mutE, [pluginE]);

  check('(0a) mutacja A faktycznie usunęła 29 dodanych pól pwBalance (7 accept + 22 reject) w '
    + '6 case\'ach evaluateProposal — kontrola nietautologiczna dla Testów 1/2 aktywna',
    mutA.applied === 29, mutA.applied);
  check('(0b) mutacja B faktycznie wyłączyła regułę GOAL 3 w balancePanelDataFromRows — '
    + 'kontrola nietautologiczna dla Testu 3 aktywna',
    mutB.applied === 1, mutB.applied);
  check('(0c) mutacja D faktycznie popsuła pwBalance zaakceptowanej wasalizacji (0 -> -999) — '
    + 'wymuszony scenariusz "AI historycznie mogłoby zaproponować ujemny bilans" dla Testu 4',
    mutD.applied === 1, mutD.applied);
  check('(0d) mutacja D+C (na bundlu mutDC) faktycznie popsuła pwBalance ORAZ przywróciła starą '
    + 'wersję tryPayload w generateCounterOffer (bez sprawdzenia pwBalance<0) — kontrola '
    + 'nietautologiczna dla Testu 4 aktywna',
    mutDC.appliedD === 1 && mutDC.appliedC === 1, mutDC);
  if (mutA.applied !== 29 || mutB.applied !== 1 || mutD.applied !== 1
    || mutDC.appliedD !== 1 || mutDC.appliedC !== 1) {
    console.log('\nPRZERWANE: co najmniej jedna mutacja nie zadziałała — kod się przesunął, '
      + 'testy niżej byłyby tautologiczne.');
    cleanup();
    process.exit(1);
  }

  const fixed = require(BUNDLES.fixed);
  const mutA_mod = require(BUNDLES.mutA);

  // ==========================================================================
  // TEST 1 — CASE 1 (Chińczycy): WASAL incoming, BRAK koszyka, relTotal=40 (<100, typowe
  // dla środkowej gry — nie ekstremum), proposerRespekt=80 (>=próg 70) -> evaluateProposal
  // AKCEPTUJE (Respekt OK), niezależnie od relTotal.
  // ==========================================================================
  console.log('\n--- TEST 1 (case 1, WASAL incoming, relTotal=40, proposerRespekt=80) ---');
  const relation1 = { zaufanie: 20, respekt: 20, status: 'pokoj' };
  const rowPrzed = buildIncomingRow(mutA_mod, 'wasal', {}, relation1, 40, { proposerRespekt: 80 });
  const dataPrzed = mutA_mod.balancePanelDataFromRows([rowPrzed]);
  console.log('  PRZED (mutacja A — kod sprzed naprawy GOAL2): responderPreview='
    + JSON.stringify(rowPrzed.responderPreview) + ' myOfferPn=' + dataPrzed.myOfferPn
    + ' theirOfferPn=' + dataPrzed.theirOfferPn
    + ' net(theirBalance.balancePn)=' + dataPrzed.theirBalance.balancePn
    + ' canAccept=' + dataPrzed.canAccept);
  check('(1-PRZED) DOWÓD BŁĘDU: bilans silnie ujemny (-210) mimo poprawnie zaakceptowanej '
    + 'oferty (Respekt spełniony) — canAccept=true — DOKŁADNIE wzorzec zrzutu 1 Macieja '
    + '("bilans -51, zielone Możesz przyjąć, Przyjmij aktywny" mimo ujemnego bilansu)',
    dataPrzed.theirBalance.balancePn === -210 && dataPrzed.canAccept === true,
    { net: dataPrzed.theirBalance.balancePn, canAccept: dataPrzed.canAccept });

  const rowPo = buildIncomingRow(fixed, 'wasal', {}, relation1, 40, { proposerRespekt: 80 });
  const dataPo = fixed.balancePanelDataFromRows([rowPo]);
  console.log('  PO (kod bieżący, GOAL2 pwBalance=0 dla wasal accept): responderPreview='
    + JSON.stringify(rowPo.responderPreview) + ' net=' + dataPo.theirBalance.balancePn
    + ' canAccept=' + dataPo.canAccept);
  check('(1-PO) NAPRAWIONE: ten sam scenariusz — net=0 (nie -210), canAccept=true — SPÓJNE '
    + '("bez dopłaty" jest teraz i tekstem, i liczbą, nie sprzecznym -210 obok zielonego statusu)',
    dataPo.theirBalance.balancePn === 0 && dataPo.canAccept === true,
    { net: dataPo.theirBalance.balancePn, canAccept: dataPo.canAccept });

  // ==========================================================================
  // TEST 2 — CASE 2: pakiet [Traktat handlowy (umowa_szlakow, pokryty sąsiadem-handlem) +
  // Traktat przemarszu (granice, ODRZUCONY — Relacja/Zaufanie za niskie) + Umowa wymiany
  // surowców (handel, kontroferta gracza, akceptowana)] — mirror struktury zrzutu 2
  // (Kontroferta 2/3, 3 pozycje, jedna traktatowa bez koszyka blokuje pakiet).
  // ==========================================================================
  console.log('\n--- TEST 2 (case 2, pakiet 3 pozycji z granice odrzuconym) ---');
  const REL_TOTAL2 = 40; // Relacja 20/20 -> za niska na granice (wymaga >=100 total i zauf>=45)
  const relation2 = { zaufanie: 20, respekt: 20, status: 'pokoj' };
  function buildPackage(mod) {
    const TREATY_ID = 'negot-umowa_szlakow-1';
    const GRANICE_ID = 'negot-granice-1';
    const HANDEL_ID = 'negot-handel-1';
    const treatyPayload = { actionId: 'umowa_szlakow', turns: 15, treatyTurns: 15 };
    const granicePayload = { actionId: 'granice' };
    const handelPayload = {
      actionId: 'handel',
      giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 221 }],
      receiveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 1 }],
      resourceTradeMode: 'once',
    };
    const table = [
      { id: TREATY_ID, actionId: 'umowa_szlakow', payload: treatyPayload },
      { id: GRANICE_ID, actionId: 'granice', payload: granicePayload },
      { id: HANDEL_ID, actionId: 'handel', payload: handelPayload },
    ];
    const packageSibling = (excludeId) => {
      let givePn = 0, receivePn = 0;
      for (const n of table) {
        if (n.id === excludeId) continue;
        if (n.actionId === 'umowa_szlakow' || n.actionId === 'umowa_handlowa' || n.actionId === 'pokoj') continue;
        // handel/granice contribute PN via resolveProposalPn indirectly through evaluateProposal
        // sibling accounting — for this reproduction only umowa_szlakow needs the handel sibling.
      }
      return { givePn, receivePn };
    };
    const rows = table.map((t) => {
      if (t.actionId === 'umowa_szlakow') {
        // Sibling PW from the handel row (giveItems 221 zloto, receiveItems 1 zloto) — same
        // algorithm as main.ts::packageSiblingPn (round 1 test, part 0), needed so the treaty
        // base (80 PW) is covered by the neighbouring handel row on the same table.
        const siblingGivePn = 221 * 3; // diplomacyPnZloto(1)=3 in this catalog (see round1 test A3=221 -> +141 surplus)
        const siblingReceivePn = 1 * 3;
        return buildOwnRow(mod, t.id, t.actionId, t.actionId, t.payload, REL_TOTAL2, {
          packageSiblingGivePn: siblingGivePn, packageSiblingReceivePn: siblingReceivePn,
        });
      }
      return buildOwnRow(mod, t.id, t.actionId, t.actionId, t.payload, REL_TOTAL2, {});
    });
    return mod.balancePanelDataFromRows(rows);
  }

  const dataPrzed2 = buildPackage(mutA_mod);
  console.log('  PRZED (mutacja A): myOfferPn=' + dataPrzed2.myOfferPn
    + ' theirOfferPn=' + dataPrzed2.theirOfferPn
    + ' net=' + dataPrzed2.theirBalance.balancePn + ' canAccept=' + dataPrzed2.canAccept
    + ' responderPreview.reason=' + JSON.stringify(dataPrzed2.responderPreview?.reason));
  check('(2-PRZED) DOWÓD BŁĘDU: bilans DODATNI mimo zablokowanego pakietu (granice odrzucone) '
    + '— DOKŁADNIE wzorzec zrzutu 2 (bilans netto +N, "Nie można przyjąć")',
    dataPrzed2.theirBalance.balancePn > 0 && dataPrzed2.canAccept === false,
    { net: dataPrzed2.theirBalance.balancePn, canAccept: dataPrzed2.canAccept });

  const dataPo2 = buildPackage(fixed);
  console.log('  PO (kod bieżący): myOfferPn=' + dataPo2.myOfferPn
    + ' theirOfferPn=' + dataPo2.theirOfferPn
    + ' net=' + dataPo2.theirBalance.balancePn + ' canAccept=' + dataPo2.canAccept
    + ' responderPreview.reason=' + JSON.stringify(dataPo2.responderPreview?.reason));
  check('(2-PO) NAPRAWIONE: bilans NIE jest już myląco dodatni (<=0, ciągnięty w dół przez '
    + 'symboliczny pwBalance=-1 granice) I canAccept=false — spójne, ORAZ konkretny powód '
    + 'blokady (Relacja/Zaufanie granice, nie generyczny tekst) jest niesiony w responderPreview',
    dataPo2.theirBalance.balancePn <= 0 && dataPo2.canAccept === false
    && /granic|Relacja|Zaufanie/i.test(dataPo2.responderPreview?.reason ?? ''),
    { net: dataPo2.theirBalance.balancePn, canAccept: dataPo2.canAccept, reason: dataPo2.responderPreview?.reason });

  // ==========================================================================
  // TEST 3 — GOAL 3 twarda reguła, bezpośrednio (bez mutacji evaluateProposal): syntetyczny
  // wiersz z responderPreview.accepted=true, ale pwBalance=-5 (symuluje regresję innego,
  // nienazwanego case'u) — canAccept MUSI być false. Kontrola nietautologiczna: bundle mutB
  // (reguła GOAL 3 wyłączona) MUSI odtworzyć stary błąd (canAccept=true mimo pwBalance<0).
  // ==========================================================================
  console.log('\n--- TEST 3 (GOAL 3, reguła twarda: pwBalance<0 => canAccept=false, zawsze) ---');
  const mutB_mod = require(BUNDLES.mutB);
  const syntheticRow = {
    id: 'synthetic-1', direction: 'incoming', actionLabel: 'test', awaitingAiResponse: false,
    responderPreview: { accepted: true, reason: 'Zaakceptowane (inny powód)', pwBalance: -5 },
    acceptanceMy: undefined,
    acceptanceTheir: {
      offerPn: 0, demandPn: 0, fairMinPn: 0, balancePn: 0, treatyBasePn: 0, mode: 'basket',
      statusLabel: 'test', accepted: true,
    },
    canCounter: false, uiActionId: '5',
  };
  const dataFixed3 = fixed.balancePanelDataFromRows([syntheticRow]);
  check('(3-PO) canAccept=false mimo responderPreview.accepted=true, bo pwBalance=-5<0 — '
    + 'reguła GOAL 3 zadziałała niezależnie od `accepted`',
    dataFixed3.canAccept === false, { canAccept: dataFixed3.canAccept });

  const dataMutB3 = mutB_mod.balancePanelDataFromRows([syntheticRow]);
  check('(3-KONTROLA) bundle mutB (reguła GOAL 3 wyłączona) odtwarza dokładnie odwrotny wynik '
    + '(canAccept=true mimo pwBalance=-5) — dowodzi, że (3-PO) NAPRAWDĘ testuje tę regułę, nie '
    + 'przechodzi niezależnie od kodu',
    dataMutB3.canAccept === true, { canAccept: dataMutB3.canAccept });

  // ==========================================================================
  // TEST 4 — GOAL 4: generateCounterOffer nigdy nie zwraca kandydata z pwBalance<0, gdy
  // proponentem jest AI. WYMUSZONY scenariusz (mutacja D, REGUŁA PRZECIW SAMOOSZUKIWANIU):
  // AI proponuje 'wasal' graczowi, proposerRespekt=65 (poniżej progu 70) -> pierwsza wersja
  // odrzucona -> generateCounterOffer szuka słodzika, który obniży próg. Mutacja D psuje
  // pwBalance zaakceptowanej wasalizacji na -999 (symulacja regresji silnika).
  // ==========================================================================
  console.log('\n--- TEST 4 (GOAL 4, generateCounterOffer vs wymuszony ujemny pwBalance) ---');
  const mutD_mod = require(BUNDLES.mutD);
  const mutDC_mod = require(BUNDLES.mutDC);
  const wasalProposal = { actionId: 'wasal', proposerOwnerId: 1, responderOwnerId: 0, payload: {} };
  const wasalCtx = {
    relation: { zaufanie: 20, respekt: 20, status: 'pokoj' }, stanWojny: false, turn: 50,
    proposerRespekt: 65, responderRespekt: 60, militaryRatio: 1, respektWzgledny: 0.5,
    ekspansjaPrzyGranicy: false, difficulty: 'normal',
  };
  const initial = mutD_mod.evaluateProposal(wasalProposal, wasalCtx);
  check('(4-setup) pierwsza wersja (bez słodzika) faktycznie odrzucona (Respekt 65<70) — '
    + 'generateCounterOffer MA co robić (musi szukać słodzika)',
    initial.accepted === false, initial);

  const counterFixedD = mutD_mod.generateCounterOffer(wasalProposal, wasalCtx);
  console.log('  bundle mutD (pwBalance wasal zepsuty na -999, gate GOAL4 AKTYWNY): counter='
    + JSON.stringify(counterFixedD));
  check('(4-PO) Z AKTYWNYM gate\'em GOAL 4: generateCounterOffer NIE zwraca żadnego kandydata '
    + '(null) zamiast zaproponować graczowi pakiet z pwBalance=-999 — silnik ODRZUCA generowanie '
    + 'takiej propozycji, zanim trafi do gracza',
    counterFixedD === null, counterFixedD);

  const counterMutDC = mutDC_mod.generateCounterOffer(wasalProposal, wasalCtx);
  console.log('  bundle mutDC (pwBalance wasal zepsuty NA -999 ORAZ gate GOAL4 wyłączony): counter='
    + JSON.stringify(counterMutDC));
  const counterMutDCEval = counterMutDC
    ? mutDC_mod.evaluateProposal({ ...wasalProposal, payload: counterMutDC.payload }, wasalCtx)
    : null;
  check('(4-KONTROLA) bundle mutDC (gate GOAL4 WYŁĄCZONY, kod sprzed tej rundy): '
    + 'generateCounterOffer ZWRACA kandydata zaakceptowanego z pwBalance=-999 — dowodzi, że '
    + 'AI HISTORYCZNIE (bez gate\'a z GOAL 4) mogłoby zaproponować graczowi pakiet o ujemnym '
    + 'bilansie, i że (4-PO) NAPRAWDĘ temu zapobiega, nie jest tautologią',
    counterMutDC !== null && counterMutDCEval?.accepted === true && counterMutDCEval?.pwBalance === -999,
    { counter: counterMutDC, evalOfCounter: counterMutDCEval });

  // ==========================================================================
  // TEST 5 — OBRONA RUNDA 2 (zarzut 1 Evaluatora, POTWIERDZONY żywym reconem): AI proponuje
  // 'pokoj' (proposerOwnerId=AI) z PUSTYM koszykiem podczas wojny, przy złej Relacji (typowe
  // dla trwającej wojny) — basePn traktatu pokoju = 500 PW (acceptance-points.json). PRZED
  // (mutacja E cofa TĘ obronę): evaluateProposal zwraca accepted:true BEZ pwBalance —
  // DOKŁADNIE ten sam wzorzec co zrzut 1 właściciela (ujemny bilans + zielone "Przyjmij"),
  // tylko dla innej, częstej akcji (AI proponujące pokój po/w trakcie wojny).
  //
  // AKTUALIZACJA RUNDA 4 (P-DYPLO-BILANS-GATE-NIESPOJNY-N-E1-REPRODUKCJA — decyzja właściciela,
  // 00-dispatch.md rundy 4): rundy 2/3 kończyły ten wywód na "GOAL 3 blokuje Przyjmij mimo
  // accepted:true" — właściciel PRZEGŁOSOWAŁ to zachowanie: pwBalance dla 'pokoj' NIGDY nie ma
  // blokować canAccept (patrz DECYZJA WŁAŚCICIELA runda 4 w diplomacy-proposals.ts i WYJĄTEK
  // runda 4 w diplomacyAcceptanceBalance.ts). (5-PO) niżej testuje TERAZ dokładnie odwrotny
  // wynik niż rundy 2/3: pwBalance nadal policzony i nadal silnie ujemny (informacyjnie —
  // GOAL 2 dispatchu rundy 4), ale canAccept=true.
  // ==========================================================================
  console.log('\n--- TEST 5 (zarzut 1 obrony, AI proponuje pokój z pustym koszykiem w wojnie) ---');
  const mutE_mod = require(BUNDLES.mutE);
  check('(0e) mutacja E faktycznie usunęła (runda 4: już tylko 1, patrz komentarz przy mutE) '
    + 'dodane pole "pwBalance: pokojPwBalance" w case \'pokoj\' evaluateProposal — kontrola '
    + 'nietautologiczna dla Testu 5 aktywna',
    mutE.applied === 1, mutE.applied);

  const warRelation = { zaufanie: 5, respekt: 5, status: 'wojna' };
  function buildPokojIncomingRow(mod) {
    const proposal = { actionId: 'pokoj', proposerOwnerId: 1, responderOwnerId: 0, payload: {} };
    const ctx = {
      relation: warRelation, stanWojny: true, turn: 80,
      proposerRespekt: 60, responderRespekt: 60, militaryRatio: 1, respektWzgledny: 0.5,
      ekspansjaPrzyGranicy: false, difficulty: 'normal',
    };
    const res = mod.evaluateProposal(proposal, ctx);
    const acceptance = mod.computePlayerAcceptanceSides('pokoj', {}, 10, true, {
      difficulty: 'normal', proposerOwnerId: 1, tempoGry: 'standardowa',
    });
    return {
      row: {
        id: 'pokoj-1', direction: 'incoming', actionLabel: 'pokoj', awaitingAiResponse: false,
        responderPreview: { accepted: res.accepted, reason: res.reason, pwBalance: res.pwBalance },
        acceptanceMy: acceptance.my, acceptanceTheir: acceptance.their,
        canCounter: false, uiActionId: '10',
      },
      res,
    };
  }

  const { row: pokojRowPrzed, res: pokojResPrzed } = buildPokojIncomingRow(mutE_mod);
  const pokojDataPrzed = mutE_mod.balancePanelDataFromRows([pokojRowPrzed]);
  console.log('  PRZED (mutacja E — kod sprzed tej obrony): responderPreview='
    + JSON.stringify(pokojRowPrzed.responderPreview)
    + ' theirBalance.balancePn=' + pokojDataPrzed.theirBalance.balancePn
    + ' canAccept=' + pokojDataPrzed.canAccept);
  check('(5-PRZED) DOWÓD ZARZUTU 1: AI-proponent \'pokoj\' pustym koszykiem w wojnie -> '
    + 'accepted:true, pwBalance BRAK (undefined), canAccept=true — silnik nie ma żadnej bramki '
    + 'PW dla tej gałęzi (dokładnie zarzut Evaluatora)',
    pokojResPrzed.accepted === true && pokojResPrzed.pwBalance === undefined
    && pokojDataPrzed.canAccept === true,
    { accepted: pokojResPrzed.accepted, pwBalance: pokojResPrzed.pwBalance, canAccept: pokojDataPrzed.canAccept });

  const { row: pokojRowPo, res: pokojResPo } = buildPokojIncomingRow(fixed);
  const pokojDataPo = fixed.balancePanelDataFromRows([pokojRowPo]);
  console.log('  PO (kod bieżący, runda 4): responderPreview='
    + JSON.stringify(pokojRowPo.responderPreview)
    + ' theirBalance.balancePn=' + pokojDataPo.theirBalance.balancePn
    + ' canAccept=' + pokojDataPo.canAccept
    + ' blockReason=' + JSON.stringify(pokojDataPo.responderPreview?.reason));
  check('(5-PO) RUNDA 4: pwBalance nadal POPRAWNIE policzony i silnie ujemny (informacyjnie, '
    + 'GOAL 2 dispatchu rundy 4 — liczba w panelu ma nadal być widoczna), ale canAccept=true — '
    + 'decyzja właściciela: "pokoj" NIGDY nie blokuje Przyjmij liczbą pwBalance, niezależnie od '
    + 'znaku (przeciwieństwo (5-PO) rund 2/3, celowo zaktualizowane)',
    pokojResPo.accepted === true && typeof pokojResPo.pwBalance === 'number' && pokojResPo.pwBalance < 0
    && pokojDataPo.canAccept === true,
    { accepted: pokojResPo.accepted, pwBalance: pokojResPo.pwBalance, canAccept: pokojDataPo.canAccept });

  // ==========================================================================
  // (5-REGRESJA/PLAYER) RUNDA 4 — kierunek ODWROTNY dispatchu rundy 4 (GOAL/kryterium końca #4:
  // "Test również odwrotnego kierunku (gracz proponuje pokoj AI) — również bez blokady PW").
  // Gracz proponuje 'pokoj' AI z pustym koszykiem podczas wojny, przy złej Relacji — rundy 2/3
  // BLOKOWAŁY tę gałąź (gap>0 -> accepted:false, "Brakuje N PW do uczciwej oferty pokoju").
  // Runda 4 USUWA tę blokadę: `fixed.evaluateProposal` musi zwrócić accepted:true, z pwBalance
  // NADAL policzonym i nadal silnie ujemnym (ten sam gap, ta sama matematyka — GOAL 2, liczba
  // zostaje NIETKNIĘTA, tylko przestaje blokować `accepted`).
  // ==========================================================================
  const playerPokojProposal = { actionId: 'pokoj', proposerOwnerId: 0, responderOwnerId: 1, payload: {} };
  const playerPokojCtx = {
    relation: warRelation, stanWojny: true, turn: 80,
    proposerRespekt: 60, responderRespekt: 60, militaryRatio: 1, respektWzgledny: 0.5,
    ekspansjaPrzyGranicy: false, difficulty: 'normal',
  };
  const playerPokojPo = fixed.evaluateProposal(playerPokojProposal, playerPokojCtx);
  console.log('  gracz proponuje pokój (zła relacja, pusty koszyk, wojna), PO (runda 4): '
    + JSON.stringify(playerPokojPo));
  check('(5-REGRESJA/PLAYER) RUNDA 4: gałąź gracz-proponent \'pokoj\' NIE JEST już blokowana '
    + 'gap>0 — accepted:true mimo silnie ujemnego pwBalance (rundy 2/3 tu zwracały accepted:'
    + 'false, "Brakuje N PW do uczciwej oferty pokoju" — usunięte tą rundą, decyzja właściciela '
    + '"OBA kierunki")',
    playerPokojPo.accepted === true && typeof playerPokojPo.pwBalance === 'number'
    && playerPokojPo.pwBalance < 0,
    playerPokojPo);

  // Kontrola nietautologiczna dla (5-REGRESJA/PLAYER): mutE (usuwa WYŁĄCZNIE pole pwBalance,
  // zostawia strukturę bezwarunkowego accepted:true, patrz komentarz przy mutE) potwierdza, że
  // ten wynik nie zależy przypadkiem od braku pola pwBalance w ogóle — accepted:true niezależnie
  // od tego, czy pwBalance jest obecny.
  const playerPokojMutE = mutE_mod.evaluateProposal(playerPokojProposal, playerPokojCtx);
  check('(5-KONTROLA/PLAYER) bundle mutE (pole pwBalance usunięte z case \'pokoj\') zwraca '
    + 'accepted:true BEZ pwBalance — accepted nie jest przypadkowym efektem obecności pola '
    + 'pwBalance (runda 4 usunęła BLOKADĘ, nie samo pole)',
    playerPokojMutE.accepted === true && playerPokojMutE.pwBalance === undefined,
    playerPokojMutE);

  // ==========================================================================
  // TEST 6 — OBRONA RUNDA 2 (zarzut 2 Evaluatora): 'tech'/'namow_wojne'/'ultimatum'/
  // 'wchloniecie' NIGDY nie mogą mieć proposerOwnerId=AI w realnej grze — dowód STRUKTURALNY
  // (nie założenie "prawdopodobnie OK"): AIDiplomacyCommand (game/ai.ts) ma skończoną listę
  // `type`; aiCommandToPendingProposal (JEDYNA funkcja tworząca propozycje AI->gracz, wołana
  // wyłącznie z main.ts::enqueueNegotiationFromAiCmd) ma switch z `default: return null` —
  // dla KAŻDEGO zdefiniowanego `type` sprawdzamy ŻYWO, że wynikowy actionId nigdy nie jest
  // jednym z tych 4. Dodatkowo: statyczna kontrola tekstu unii w ai.ts, żeby przyszła zmiana
  // (nowy typ komendy) nie ominęła cichcem tego testu.
  // ==========================================================================
  console.log('\n--- TEST 6 (zarzut 2 obrony, tech/namow_wojne/ultimatum/wchloniecie AI-proponent) ---');
  const FORBIDDEN_AS_AI_PROPOSER = new Set(['tech', 'namow_wojne', 'ultimatum', 'wchloniecie']);
  const aiTs = fs.readFileSync(path.resolve(GRA, 'src', 'game', 'ai.ts'), 'utf8');
  const unionStart = aiTs.indexOf('export type AIDiplomacyCommand =');
  const unionEnd = aiTs.indexOf('\n\n', unionStart);
  const unionText = aiTs.slice(unionStart, unionEnd);
  const cmdTypes = Array.from(unionText.matchAll(/type:\s*'([^']+)'/g)).map((m) => m[1]);
  check('(6-setup) AIDiplomacyCommand (game/ai.ts) sparsowany żywo z pliku źródłowego — '
    + 'znaleziono >=8 typów komend (nie 0 — parser trafił w unię)',
    cmdTypes.length >= 8, cmdTypes);

  const CMD_FIXTURES = {
    wypowiedz_wojne: { type: 'wypowiedz_wojne', targetId: 'ai-1', powod: 't' },
    zaproponuj_pokoj: { type: 'zaproponuj_pokoj', targetId: 'ai-1', powod: 't' },
    zadaj_trybut: { type: 'zadaj_trybut', targetId: 'ai-1', powod: 't' },
    oferuj_trybut_za_pokoj: { type: 'oferuj_trybut_za_pokoj', targetId: 'ai-1', powod: 't', goldOnce: 100 },
    zaproponuj_sojusz: { type: 'zaproponuj_sojusz', targetId: 'ai-1', powod: 't', allianceKind: 'pelny' },
    zaproponuj_handel: { type: 'zaproponuj_handel', targetId: 'ai-1', powod: 't', goldOnce: 100 },
    zaproponuj_umowe_handlowa: { type: 'zaproponuj_umowe_handlowa', targetId: 'ai-1', powod: 't' },
    zaproponuj_handel_surowiec: {
      type: 'zaproponuj_handel_surowiec', targetId: 'ai-1', powod: 't',
      surowiecKey: 'zelazo', label: 'Żelazo', pakietyPerTura: 1,
      zaplataTyp: 'zloto', zaplataPerTura: 10, turns: 10, kierunek: 'sprzedaz',
    },
    zaproponuj_pakt: { type: 'zaproponuj_pakt', targetId: 'ai-1', powod: 't', turns: 15 },
    zaproponuj_audiencje: { type: 'zaproponuj_audiencje', targetId: 'ai-1', powod: 't' },
  };
  const missingFixture = cmdTypes.filter((t) => !CMD_FIXTURES[t]);
  check('(6-setup) każdy typ komendy sparsowany z ai.ts ma fixture w tym teście (0 brakujących '
    + '— gdyby przybył nowy typ komendy, ten test go NIE pominie milcząco)',
    missingFixture.length === 0, missingFixture);

  const results = cmdTypes.map((t) => {
    const cmd = CMD_FIXTURES[t];
    if (!cmd) return { type: t, actionId: '(brak fixture)' };
    const pending = fixed.aiCommandToPendingProposal(cmd, 1, 0, 80);
    return { type: t, actionId: pending ? pending.actionId : null };
  });
  console.log('  aiCommandToPendingProposal dla każdego typu komendy AI: '
    + JSON.stringify(results));
  const anyForbidden = results.filter((r) => r.actionId && FORBIDDEN_AS_AI_PROPOSER.has(r.actionId));
  check('(6-PO) DOWÓD ŻYWY: dla WSZYSTKICH ' + cmdTypes.length + ' typów komend AI, '
    + 'aiCommandToPendingProposal NIGDY nie tworzy propozycji actionId in '
    + '{tech,namow_wojne,ultimatum,wchloniecie} — te 4 case\'y evaluateProposal z '
    + 'proposerIsPlayer=false są martwym kodem w realnej grze (AI strukturalnie nie ma jak ich '
    + 'zaproponować), więc wzorzec "AI proponuje ujemny bilans" z zarzutu 2 jest dla nich '
    + 'nieosiągalny — nie założenie, dowód z wyczerpującego wyliczenia unii komend',
    anyForbidden.length === 0, anyForbidden);

  // ==========================================================================
  // TEST 7 — OBRONA RUNDA 2 (zarzut 3 Evaluatora, PRZYJĘTY jako obserwacja): feeC/feeM
  // (opłata cywilna/wojskowa traktatu przemarszu) to WYŁĄCZNIE etykieta UI w
  // diplomacyTradeBasket.ts — case 'granice' w evaluateProposal (diplomacy-proposals.ts) NIE
  // odczytuje żadnego z tych pól (ani ich main.ts-owych źródeł borderFeeCivil/
  // borderFeeMilitary) — opłata NIE jest dziś w ogóle egzekwowana (ani jako koszt złota, ani
  // jako składnik PW). To NIE jest "bilans gate niespójny" (evaluateProposal nie ma tu żadnej
  // bramki PW do rozjechania z UI — 'granice' jest progiem Relacja/Zaufanie/Respekt, nie
  // koszykiem) — to ODRĘBNA obserwacja (etykieta obiecuje koszt, silnik go nie pobiera).
  // Poza allowlistą tej obrony (main.ts + realny system opłat traktatu — zmiana zasad gry) —
  // udokumentowane tu żywym testem źródła, NIE naprawione (zgodnie z regułą dispatchu: zmiana
  // logiki poza wąskim zakresem wymaga DECISION_REQUIRED, nie samodzielnego rozszerzenia).
  // ==========================================================================
  console.log('\n--- TEST 7 (zarzut 3 obrony, feeC/feeM traktatu przemarszu — etykieta bez egzekwowania) ---');
  const basketSrc = fs.readFileSync(
    path.resolve(GRA, 'src', 'ui', 'diplomacyTradeBasket.ts'), 'utf8',
  );
  const proposalsSrc = fs.readFileSync(DIPLO_PROPOSALS, 'utf8');
  const granCaseMatch = proposalsSrc.match(/case 'granice': \{[\s\S]*?\n    \}\n/);
  const granCaseBody = granCaseMatch ? granCaseMatch[0] : '';
  check('(7-setup) case \'granice\' odnaleziony żywo w diplomacy-proposals.ts (nie pusty — parser '
    + 'trafił we właściwy blok)', granCaseBody.length > 100, granCaseBody.length);
  check('(7-DOWÓD) diplomacyTradeBasket.ts POKAZUJE etykietę opłaty feeC/feeM dla traktatu '
    + 'przemarszu (borderFeeCivil/borderFeeMilitary)',
    /feeC\s*=\s*ctx\.borderFeeCivil/.test(basketSrc) && /feeM\s*=\s*ctx\.borderFeeMilitary/.test(basketSrc),
    { hasFeeC: /feeC/.test(basketSrc), hasFeeM: /feeM/.test(basketSrc) });
  check('(7-DOWÓD) case \'granice\' w evaluateProposal NIE odczytuje feeC/feeM/borderFeeCivil/'
    + 'borderFeeMilitary/goldOnce — opłata z etykiety NIE jest dziś egzekwowana silnikiem '
    + '(ani jako koszt złota, ani jako PW) — POTWIERDZONE żywym odczytem źródła, nie założeniem',
    !/feeC|feeM|borderFeeCivil|borderFeeMilitary|goldOnce/.test(granCaseBody), granCaseBody);
  console.log('  UWAGA (nie naprawiane w tej obronie — poza allowlistą, wymaga decyzji '
    + 'produktowej): etykieta "Opłata cywilne: X ¤ · wojskowe: Y ¤" w formularzu traktatu '
    + 'przemarszu dziś nic nie kosztuje w realnej grze.');

  console.log('\n=== PODSUMOWANIE: ' + pass + ' PASS / ' + fail + ' FAIL ===');
  cleanup();
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  cleanup();
  process.exit(1);
});
