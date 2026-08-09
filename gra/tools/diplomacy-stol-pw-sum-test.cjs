'use strict';
/**
 * diplomacy-stol-pw-sum-test.cjs — R-DYPLO-STOL-PW-SUM: suma PW wszystkich umów na stole.
 * Run: node tools/diplomacy-stol-pw-sum-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const SRC = path.resolve(__dirname, '..', 'src');
const ENTRY = path.resolve(SRC, '.dip-stol-pw-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-stol-pw-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  balancePanelDataFromRow,
  balancePanelDataFromRows,
  renderPnBalancePanelHtml,
  incomingTradeNetBalancePw,
} from './ui/diplomacyAcceptanceBalance';
export { computePlayerAcceptanceSides } from './game/diplomacy-acceptance-points';
`);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  absWorkingDir: SRC,
  logLevel: 'silent',
});

const mod = require(BUNDLE);
let pass = 0;
let fail = 0;

function ok(cond, msg) {
  if (cond) { pass++; return; }
  fail++;
  console.error('[FAIL]', msg);
}

function basketSide(offerPn, demandPn, fairMinPn) {
  const balancePn = offerPn - fairMinPn;
  const accepted = balancePn >= 0;
  return {
    offerPn,
    demandPn,
    fairMinPn,
    balancePn,
    treatyBasePn: 0,
    mode: 'basket',
    statusLabel: accepted ? 'OK' : 'Brakuje',
    accepted,
  };
}

function treatySide(offerPn, treatyBase, treatyEffective, mode = 'treaty') {
  return {
    offerPn,
    demandPn: 0,
    fairMinPn: 0,
    balancePn: offerPn,
    treatyBasePn: treatyBase,
    treatyEffectivePn: treatyEffective,
    mode,
    statusLabel: 'Traktat',
    accepted: true,
  };
}

// R-DYPLO-STOL-PW-SUM: dwa wiersze — traktat 72/80 + koszyk 10/2 → suma 82/82, net 0
// responderPreview jawnie ustawiony accepted:true na obu (P-DYPLO-RESPONDERPREVIEW-FAIL-OPEN:
// od naprawy fail-closed, brak responderPreview na pozycji incoming daje canAccept=false, więc
// ten fixture, testujący ścieżkę "canAccept=true", musi go mieć jawnie ustawionego — zgodnie
// z realnym main.ts, które ZAWSZE ustawia responderPreview, patrz buildPendingNegotiationRows).
const treatyRow = {
  id: 'neg-treaty',
  direction: 'incoming',
  actionLabel: 'Traktat handlowy',
  acceptanceMy: treatySide(0, 80, 72),
  acceptanceTheir: treatySide(0, 80, 80),
  canAccept: false,
  responderPreview: { accepted: true },
};
const basketRow = {
  id: 'neg-basket',
  direction: 'incoming',
  actionLabel: 'Wymiana surowców',
  acceptanceMy: basketSide(10, 2, 2),
  acceptanceTheir: basketSide(2, 10, 2),
  canAccept: true,
  responderPreview: { accepted: true },
};

const singleTreaty = mod.balancePanelDataFromRow(treatyRow, 0);
ok(singleTreaty != null, 'single treaty row: data');
ok(singleTreaty.myOfferPn === 72, 'single treaty: my 72 PW');
ok(singleTreaty.theirOfferPn === 80, 'single treaty: their 80 PW');

const aggregated = mod.balancePanelDataFromRows([treatyRow, basketRow]);
ok(aggregated != null, 'aggregated: data');
ok(aggregated.myOfferPn === 82, 'aggregated: myOfferPn 82 (72+10)');
ok(aggregated.theirOfferPn === 82, 'aggregated: theirOfferPn 82 (80+2)');
ok(aggregated.extraOnTable === 0, 'aggregated: extraOnTable 0 (bez badge)');
ok(aggregated.actionLabel.includes('Pakiet na stole'), 'aggregated: label pakietu');
ok(aggregated.actionLabel.includes('2 umów'), 'aggregated: label z liczbą umów');
ok(aggregated.canAccept === true, 'aggregated: canAccept true przy net 0 (responderPreview.accepted=true na obu pozycjach)');
ok(aggregated.theirBalance.balancePn === 0, 'aggregated: balancePn net 0');
ok(aggregated.theirBalance.accepted === true, 'aggregated: theirBalance accepted');

const net = mod.incomingTradeNetBalancePw(aggregated);
ok(net === 0, 'aggregated: incomingTradeNetBalancePw 0');

const panelHtml = mod.renderPnBalancePanelHtml(aggregated);
ok(panelHtml.includes('82 PW'), 'panel HTML: 82 PW w kolumnach');
ok(!panelHtml.includes('inna na stole'), 'panel HTML: brak badge +N inna na stole');
ok(panelHtml.includes('da-pn-balance-bar ok'), 'panel HTML: tone ok przy net 0');

// Pojedynczy wiersz — bez zmiany labelu
const singleAgg = mod.balancePanelDataFromRows([treatyRow]);
ok(singleAgg.actionLabel === 'Traktat handlowy', 'single row: label bez + inne');
ok(singleAgg.myOfferPn === 72, 'single row agg: my 72');

// Puste stoło
ok(mod.balancePanelDataFromRows([]) === null, 'empty rows: null');

// Realne dane z silnika: traktat @ rel 100 + handel
const tradePayload = {
  giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 8 }],
  receiveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 8 }],
};
const treatySides = mod.computePlayerAcceptanceSides('umowa_szlakow', {}, 100, true);
const tradeSides = mod.computePlayerAcceptanceSides('handel', tradePayload, 100, true);
const engineRow1 = {
  direction: 'incoming',
  actionLabel: 'Traktat handlowy',
  acceptanceMy: treatySides.my,
  acceptanceTheir: treatySides.their,
  canAccept: true,
};
const engineRow2 = {
  direction: 'incoming',
  actionLabel: 'Wymiana',
  acceptanceMy: tradeSides.my,
  acceptanceTheir: tradeSides.their,
  canAccept: true,
};
const engineAgg = mod.balancePanelDataFromRows([engineRow1, engineRow2]);
ok(engineAgg != null, 'engine rows: aggregated');
ok(
  engineAgg.myOfferPn === engineRow1.acceptanceMy.offerPn + tradeSides.my.offerPn + 80,
  'engine: my sum includes treaty effective + basket',
);
ok(
  engineAgg.theirOfferPn === engineRow1.acceptanceTheir.offerPn + tradeSides.their.offerPn + 80,
  'engine: their sum includes treaty + basket',
);

// R-DYPLO-FAIRNESS-GATE-ZAKRES-Q2=A (BUG-PAKIET-BILANS-DODATNI-BLOKADA): pakiet WŁASNY
// (direction:'own', gracz proponuje AI) — traktat bez koszyka (umowa_szlakow, deficyt własny
// 40 PW, patrz diplomacy-proposal-test.cjs "Q2: BEZ sąsiada") + osobny handel na tym samym
// stole pokrywający deficyt. `responderPreview` symuluje evaluateProposal PO naprawie Q2
// (package-aware, main.ts previewNegotiationEntry dolicza sąsiada) — `acceptanceTheir`
// (computePlayerAcceptanceSides, CELOWO nie zmieniana w Q2 — per-item, nie zna sąsiadów)
// zostaje ujemna, dokładnie tak jak przed naprawą. Przed Q2 `ownOk` wymagał OBU flag →
// pakiet blokowany mimo dodatniej sumy PW; po Q2 liczy się WYŁĄCZNIE responderPreview.
{
  const treatyOwnRow = {
    id: 'own-treaty',
    direction: 'own',
    actionLabel: 'Traktat handlowy',
    awaitingAiResponse: true,
    acceptanceMy: treatySide(0, 80, 40),
    acceptanceTheir: { ...treatySide(0, 80, 80), accepted: false, statusLabel: 'Brakuje 40 PW — dopłać' },
    responderPreview: { accepted: true },
  };
  const handelOwnRow = {
    id: 'own-handel',
    direction: 'own',
    actionLabel: 'Wymiana',
    awaitingAiResponse: true,
    acceptanceMy: basketSide(54, 0, 0),
    acceptanceTheir: basketSide(0, 54, 0),
    responderPreview: { accepted: true },
  };
  const ownPackagePositive = mod.balancePanelDataFromRows([treatyOwnRow, handelOwnRow]);
  ok(ownPackagePositive != null, 'Q2 own pakiet: data');
  ok(
    ownPackagePositive.canAccept === true,
    'Q2 own pakiet BUG-PAKIET-BILANS-DODATNI-BLOKADA: canAccept=true gdy responderPreview (package-aware) mówi accepted mimo ujemnej acceptanceTheir per-item (legacy, nieznająca sąsiada)',
  );

  // Kontrola negatywna — responderPreview SAM mówi odrzucone (np. sąsiad na stole za mały,
  // patrz "Q2: sąsiad 20 PW < deficyt" w diplomacy-proposal-test.cjs) → pakiet nadal blokowany,
  // niezależnie od acceptanceTheir. Dowodzi, że fix NIE zdjął bramki, tylko przeniósł źródło
  // prawdy z podwójnego (i rozjeżdżającego się) warunku na jeden — ten sam, którego użyje backend.
  const treatyOwnRowBlocked = {
    ...treatyOwnRow,
    responderPreview: { accepted: false, reason: 'Brakuje 20 PW do uczciwej oferty traktatu handlowego @ Relacji (baza 80 PW, licząc pakiet na stole) — oferta nieuczciwa dla partnera' },
  };
  const ownPackageBlocked = mod.balancePanelDataFromRows([treatyOwnRowBlocked, handelOwnRow]);
  ok(
    ownPackageBlocked.canAccept === false,
    'Q2 own pakiet kontrola negatywna: canAccept=false gdy responderPreview mówi odrzucone (sąsiad na stole nadal za mały)',
  );
  ok(
    ownPackageBlocked.responderPreview?.reason?.includes('pakiet na stole'),
    'Q2 own pakiet kontrola negatywna: komunikat blokady = responderPreview.reason (package-aware), nie stary generyczny tekst',
  );
}

// BUG-PAKIET-INCOMING-CZESCIOWA-AKCEPTACJA (2026-08-08): pakiet PRZYCHODZĄCY (allIncoming) —
// suma PW pakietu jest DODATNIA (net +14, jak w zrzucie Macieja: 94 vs 80), ale JEDNA pozycja
// (czysty traktat bez koszyka) sama nie przechodzi swojej bramki uczciwości — responderPreview
// (ta sama previewNegotiationEntry, którą realne wykonanie woła PER ID w
// handleNegotiationAcceptPackage → handleNegotiationAccept) mówi accepted:false. Przed naprawą
// canAccept dla allIncoming liczył WYŁĄCZNIE `net >= 0` — przycisk „Przyjmij" byłby aktywny,
// a kliknięcie wykonałoby pakiet częściowo (koszyk wykonany, traktat odrzucony osobnym
// toastem). Po naprawie: canAccept = false, jeśli KTÓRAKOLWIEK pozycja incoming ma
// responderPreview.accepted===false — zgodnie z faktycznym wykonaniem per-pozycja.
{
  const treatyRowBlocked = {
    id: 'neg-treaty-blocked',
    direction: 'incoming',
    actionLabel: 'Traktat handlowy',
    acceptanceMy: treatySide(0, 80, 94),
    acceptanceTheir: treatySide(0, 80, 80),
    canAccept: true, // pole legacy per-wiersz (computeIncomingPlayerAcceptNetPw) — null dla traktatu bez koszyka, zawsze true; NIE jest już źródłem prawdy
    responderPreview: {
      accepted: false,
      reason: 'Brakuje 26 PW do uczciwej oferty traktatu handlowego @ Relacji (baza 80 PW) — oferta nieuczciwa dla partnera',
    },
  };
  const basketRowOk = {
    id: 'neg-basket-ok',
    direction: 'incoming',
    actionLabel: 'Wymiana surowców',
    acceptanceMy: basketSide(0, 0, 0),
    acceptanceTheir: basketSide(0, 0, 0),
    canAccept: true,
    responderPreview: { accepted: true },
  };
  const positiveSumButBlocked = mod.balancePanelDataFromRows([treatyRowBlocked, basketRowOk]);
  ok(positiveSumButBlocked != null, 'BUG-PAKIET-INCOMING: data');
  ok(
    positiveSumButBlocked.myOfferPn - positiveSumButBlocked.theirOfferPn > 0,
    'BUG-PAKIET-INCOMING: suma netto pakietu jest DODATNIA (+14, jak w zgłoszeniu)',
  );
  ok(
    positiveSumButBlocked.canAccept === false,
    'BUG-PAKIET-INCOMING: canAccept=false mimo dodatniej sumy — jedna pozycja (responderPreview) nie przechodzi',
  );
  ok(
    positiveSumButBlocked.responderPreview?.reason?.includes('26 PW'),
    'BUG-PAKIET-INCOMING: komunikat blokady = responderPreview.reason tej pozycji (parytet z realnym wykonaniem)',
  );

  // P-DYPLO-PANEL-WIZUALNA-NIESPOJNOSC-VS-CANACCEPT (kierunek 1/2): net DODATNI, ale
  // canAccept=false — panel HTML musi pokazać "no" (czerwony), spójnie z zablokowanym
  // przyciskiem Przyjmij, NIE "ok" jak sugerowałby sam znak net dodatniego.
  const positiveSumBlockedHtml = mod.renderPnBalancePanelHtml(positiveSumButBlocked);
  ok(
    positiveSumBlockedHtml.includes('da-pn-balance-bar no'),
    'P-DYPLO-PANEL-WIZUALNA-NIESPOJNOSC: net dodatni + canAccept=false -> panel HTML tone "no" (spójne z canAccept, nie z dodatnim net)',
  );
  ok(
    !positiveSumBlockedHtml.includes('da-pn-balance-bar ok'),
    'P-DYPLO-PANEL-WIZUALNA-NIESPOJNOSC: net dodatni + canAccept=false -> panel HTML NIE ma tone "ok"',
  );

  // Kontrola pozytywna — obie pozycje incoming przechodzą własną bramkę (responderPreview
  // accepted:true) → pakiet nadal do przyjęcia jednym klikiem, mimo że suma i tak dodatnia.
  const treatyRowOk = { ...treatyRowBlocked, id: 'neg-treaty-ok', responderPreview: { accepted: true } };
  const bothOk = mod.balancePanelDataFromRows([treatyRowOk, basketRowOk]);
  ok(
    bothOk.canAccept === true,
    'BUG-PAKIET-INCOMING kontrola pozytywna: canAccept=true gdy KAŻDA pozycja incoming przechodzi własny responderPreview',
  );
}

// P-DYPLO-RESPONDERPREVIEW-FAIL-OPEN: brak responderPreview (undefined) na pozycji
// akcjonowalnej (incoming) MUSI dawać canAccept=false (fail-closed), NIE true (fail-open).
// Dziś main.ts zawsze ustawia responderPreview (previewNegotiationEntry wołane bezwarunkowo
// w buildPendingNegotiationRows), więc nieosiągalne w praktyce — ale funkcja nie może na tym
// polegać jako na jedynym zabezpieczeniu.
{
  const noPreviewRow = {
    id: 'neg-no-preview',
    direction: 'incoming',
    actionLabel: 'Traktat handlowy',
    acceptanceMy: treatySide(0, 80, 80),
    acceptanceTheir: treatySide(0, 80, 80),
    canAccept: true, // pole legacy — NIE jest już źródłem prawdy
    // responderPreview celowo pominięty (undefined) — to jest właśnie testowany przypadek
  };
  const failClosed = mod.balancePanelDataFromRows([noPreviewRow]);
  ok(failClosed != null, 'P-DYPLO-RESPONDERPREVIEW-FAIL-OPEN: data');
  ok(
    failClosed.canAccept === false,
    'P-DYPLO-RESPONDERPREVIEW-FAIL-OPEN: canAccept=false gdy responderPreview=undefined (fail-closed, nie fail-open jak przed naprawą)',
  );

  // Kontrola pozytywna w tym samym przypadku — gdy JEDNA pozycja w pakiecie ma
  // responderPreview i jest odrzucona, a DRUGA nie ma responderPreview wcale, całość musi
  // pozostać zablokowana (obie ścieżki blokady, undefined i accepted:false, muszą działać
  // razem w tym samym pakiecie, nie wzajemnie się maskować).
  const mixedRow = {
    id: 'neg-mixed-no-preview',
    direction: 'incoming',
    actionLabel: 'Wymiana surowców',
    acceptanceMy: basketSide(0, 0, 0),
    acceptanceTheir: basketSide(0, 0, 0),
    canAccept: true,
  };
  const failClosedPackage = mod.balancePanelDataFromRows([noPreviewRow, mixedRow]);
  ok(
    failClosedPackage.canAccept === false,
    'P-DYPLO-RESPONDERPREVIEW-FAIL-OPEN pakiet: canAccept=false gdy KTÓRAKOLWIEK pozycja ma responderPreview=undefined',
  );
}

// P-DYPLO-PANEL-WIZUALNA-NIESPOJNOSC-VS-CANACCEPT (kierunek 2/2): net UJEMNY, ale
// responderPreview (per pozycja) mówi accepted:true -> canAccept=true. Kolor/hint MUSZĄ iść
// za canAccept, nie za znakiem net — inaczej panel pokazuje "no" (czerwony) + mylący hint
// "Brakuje...dopłać do bilansu" mimo aktywnego przycisku Przyjmij (dokładnie zgłoszenie
// Macieja: traktat incoming z net −20 PW, werdykt "możesz przyjąć" ale panel czerwony).
{
  const treatyRowNegNet = {
    id: 'neg-treaty-negnet',
    direction: 'incoming',
    actionLabel: 'Traktat handlowy',
    acceptanceMy: treatySide(0, 80, 60),
    acceptanceTheir: treatySide(0, 80, 80),
    canAccept: true,
    responderPreview: { accepted: true },
  };
  const negNetAccepted = mod.balancePanelDataFromRows([treatyRowNegNet]);
  ok(negNetAccepted != null, 'net ujemny + canAccept=true: data');
  ok(
    negNetAccepted.myOfferPn - negNetAccepted.theirOfferPn === -20,
    'net ujemny + canAccept=true: net -20 PW (60-80), jak w zgłoszeniu',
  );
  ok(
    negNetAccepted.canAccept === true,
    'net ujemny + canAccept=true: canAccept=true (responderPreview per-pozycja przechodzi mimo ujemnej sumy)',
  );
  const negNetHtml = mod.renderPnBalancePanelHtml(negNetAccepted);
  ok(
    negNetHtml.includes('da-pn-balance-bar ok'),
    'P-DYPLO-PANEL-WIZUALNA-NIESPOJNOSC: net ujemny + canAccept=true -> panel HTML tone "ok" (spójne z canAccept, nie z ujemnym net)',
  );
  ok(
    !negNetHtml.includes('da-pn-balance-bar no'),
    'P-DYPLO-PANEL-WIZUALNA-NIESPOJNOSC: net ujemny + canAccept=true -> panel HTML NIE ma tone "no"',
  );
  ok(
    !negNetHtml.includes('dopłać do bilansu'),
    'P-DYPLO-PANEL-WIZUALNA-NIESPOJNOSC: net ujemny + canAccept=true -> brak mylącego hintu "dopłać do bilansu"',
  );
}

try { fs.unlinkSync(ENTRY); } catch (_) { /* ignore */ }

console.log(`diplomacy-stol-pw-sum-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
