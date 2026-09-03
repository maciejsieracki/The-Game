'use strict';
/**
 * dyplo-bilans-gate-n-e1-reprodukcja-test.cjs
 *
 * TEMAT: P-DYPLO-BILANS-GATE-NIESPOJNY-N-E1-REPRODUKCJA
 *
 * RECON-FIRST, żywy test w headless Chromium (nie jsdom, nie czytanie kodu) odtwarzający
 * dokładnie sekwencję Macieja: pakiet na stole = "Traktat handlowy" (silnikowy actionId
 * `umowa_szlakow`, treatyBasePn=80 z data/diplomacy-acceptance-points.json) + "Umowa wymiany
 * surowców" (silnikowy actionId `handel`, uiActionId '14') między tymi samymi stronami.
 * Używa REALNYCH, nieprzepisanych funkcji produkcyjnych:
 *   - `evaluateProposal` (diplomacy-proposals.ts) — TA SAMA bramka co realne wysłanie/Przyjmij.
 *   - `computePlayerAcceptanceSides` (diplomacy-acceptance-points.ts) — buduje acceptanceMy/
 *     acceptanceTheir dokładnie jak main.ts::buildPendingNegotiationRows.
 *   - `balancePanelDataFromRows` + `renderPnBalancePanelHtml` (diplomacyAcceptanceBalance.ts,
 *     w allowliście tego tematu) — TA SAMA funkcja, która renderuje panel "PUNKTY WYMIANY PW"
 *     na stole negocjacji (diplomacyAudience.ts::negotiationBalanceBarHtml).
 *   - "sąsiad pakietu" (packageSiblingGivePn/receivePn) liczony DOKŁADNIE wg algorytmu
 *     main.ts::packageSiblingPn/livePackageSiblingFor (TREATY_GATED_NEGOTIATION_ACTIONS =
 *     {'pokoj','umowa_szlakow','umowa_handlowa'} wykluczone jako WŁASNY sąsiad) — ten
 *     algorytm jest ODTWORZONY tu 1:1 (nie zaimportowany — main.ts jest closure'em, nie
 *     eksportuje go), więc CZĘŚĆ (0) niżej dowodzi źródłowo, że odtworzenie jest wierne.
 *
 * CZĘŚĆ (0) ŹRÓDŁO: TREATY_GATED_NEGOTIATION_ACTIONS w main.ts nie zmieniło się (dokładny
 * zestaw), inaczej odtworzenie sąsiada w tym pliku przestaje być wierne cichcem.
 *
 * CZĘŚĆ (A) 3 KOMBINACJE KOSZYKA (kryterium końca 2, "co najmniej 3 różne kombinacje"):
 *   A1 — handel poniżej progu bazy traktatu (Relacja 130 → wymagane 80 PW, handel daje 71) →
 *        MUSI być odrzucone, wyświetlany "Bilans" MUSI być ujemny (spójny z gate).
 *   A2 — handel dokładnie na progu (80 PW) → MUSI być zaakceptowane, bilans 0.
 *   A3 — handel z nadwyżką (221 PW, dokładnie liczba z opisu Macieja: 221-80=141 nadwyżki) →
 *        MUSI być zaakceptowane, wyświetlany bilans dodatni.
 * Dla KAŻDEJ kombinacji: assert że `panel.canAccept` (blockReason==null) zgadza się z
 * `evaluateProposal(...).accepted` REALNIE policzonym dla obu wierszy, oraz że wyświetlany
 * `netPw` (czytany dokładnie tak jak renderer: `their.balancePn` w trybie traktatu) ma TEN
 * SAM znak co decyzja bramki (bez rozjazdu "zielone +N, ale zablokowane" — dokładnie ten
 * pattern zgłoszony przez Macieja, zrzut 1).
 *
 * CZĘŚĆ (B) EDYCJA W MIEJSCU (kryterium końca 1, hipoteza staleness): z A1 (odrzucone,
 * "Brakuje 9 PW") MUTUJEMY payload wiersza `handel` W MIEJSCU (dokładamy złota do
 * giveItems — bez usuwania/tworzenia nowego wiersza) i PRZELICZAMY panel PONOWNIE tą samą
 * ścieżką (`balancePanelDataFromRows`/`renderPnBalancePanelHtml`) — dokładnie to, co robi
 * `buildPendingNegotiationRows` (main.ts) po `handleNegotiationEditOwn` →
 * `updateDiplomacyAudience()` (patrz część (C) źródłowa niżej). Jeśli panel PO edycji dalej
 * pokazuje starą (odrzuconą) wartość — staleness POTWIERDZONY. Jeśli przelicza się na żywo
 * i zgadza z nową bramką — staleness WYKLUCZONY na tej ścieżce danych.
 *
 * CZĘŚĆ (C) ŹRÓDŁO — dowód, że `handleNegotiationEditOwn` (jedyna ścieżka "edytuj W MIEJSCU"
 * własnej, nierozstrzygniętej propozycji) faktycznie woła `updateDiplomacyAudience()` PO
 * `applyOwnProposalEdit`, i że `buildPendingNegotiationRows` liczy `previewNegotiationEntry`
 * PONOWNIE (świeżo) wewnątrz `.map()`, a nie z cache. Zamyka lukę między "silnik/panel są
 * matematycznie spójne" (część A/B, dowiedzione tu żywo) a "UI faktycznie ten kod woła po
 * edycji" (bez tego osobny dowód konieczny, main.ts nie da się wyeksportować do przeglądarki
 * bez pełnego bootstrapu gry — poza rozsądnym zakresem RUNDY 1).
 *
 * CZĘŚĆ (D) UWAGA UI-ONLY: `renderPnBalancePanelFromBasket` (diplomacyTradeBasket.ts,
 * KOMPOZYTOR/koszyk PRZED dodaniem do stołu) ma na stałe etykietę "Bilans (Oni)"
 * (linia ~648), a `renderPnBalancePanelHtml` (STÓŁ, PO dodaniu) etykietę "Bilans (netto)"
 * dla pakietu z traktatem (linia ~532, `isTreatyMode`). To DWIE RÓŻNE funkcje renderujące
 * DWA RÓŻNE miejsca UI (kompozytor vs stół) — nie jeden kod z niespójną etykietą. Dowód
 * źródłowy w części (0b). UWAGA (Obrona runda 1): (0b)/(D) same w sobie NIE wykluczały, że
 * `renderPnBalancePanelHtml` (STÓŁ, JEDNA funkcja) też potrafi wyświetlić OBIE etykiety dla
 * TEGO SAMEGO pakietu — patrz część (G) niżej, gdzie to POTWIERDZONO i naprawiono.
 *
 * CZĘŚĆ (G) NAPRAWA (Obrona runda 1, zarzut 3 Evaluatora, kryterium końca 4): `centerLabel`
 * w `renderPnBalancePanelHtml` ('Bilans (netto)' vs 'Bilans (Oni)') czytał `mode` WYŁĄCZNIE
 * z `pickPrimaryNegotiationRow(actionable)` — dla wierszy 'own' to `own[0]`, czyli PIERWSZY
 * wiersz w tablicy `rows` w KOLEJNOŚCI DODANIA do `negotiationTable` (main.ts::
 * getNegotiationsForPair — plain `.filter()`, zachowuje kolejność wstawienia). Dla pakietu
 * Traktat handlowy (mode='treaty') + Umowa wymiany surowców (mode='basket') TA SAMA
 * zawartość dawała RÓŻNĄ etykietę wyłącznie w zależności od tego, KTÓRY wiersz trafił do
 * tablicy jako pierwszy — usunięcie i ponowne dodanie JEDNEJ pozycji (dokładnie akcja
 * Macieja z opisu) przesuwa ją na koniec tablicy i zmienia primary, mimo że pakiet
 * semantycznie się nie zmienił. ŻYWO POTWIERDZONE (część G-PRZED niżej, na kodzie SPRZED
 * naprawy przez mutację #2) i NAPRAWIONE w `balancePanelDataFromRows`
 * (diplomacyAcceptanceBalance.ts): dla pakietu >1 pozycji `mode` liczony z WSZYSTKICH
 * pozycji (agregat treaty+basket→'mixed'), nie tylko primary — etykieta pakietu jest teraz
 * niezależna od kolejności dodania wierszy. `actionable.length<=1` (pojedyncza pozycja,
 * najczęstszy przypadek) — zero zmiany zachowania, patrz komentarz przy definicji.
 *
 * CZĘŚĆ (H) ŹRÓDŁO — komponent KOMPOZYTORA (renderPnBalancePanelFromBasket/
 * renderPnBalancePanelForTreaty, diplomacyTradeBasket.ts:1050/1054/1860, wskazane wprost w
 * RECON dispatchu) — sprawdzone reconem (zarzut 1 Evaluatora), czy call site'y są wołane
 * PRZY KAŻDEJ edycji koszyka. `showTradeBasketModal::refresh()` (diplomacyTradeBasket.ts
 * ~2340) woła `renderBasket()` (→ `treatySummaryHtml`/`summaryHtml` → jeden z trzech call
 * site'ów, świeżo, z bieżących `giveItems`/`receiveItems` z domknięcia — bez cache) i jest
 * PODPIĘTE do handlerów `.cdb-rm` (usuń pozycję, linia ~2581), `.cdb-add-btn` (dodaj
 * pozycję, linia ~2539), kroków ilości (qty stepper, linia ~2424-2447) i pól czasu/trybu
 * wymiany (linie ~2530-2536) — czyli PRZY KAŻDEJ edycji koszyka, nie tylko przy otwarciu.
 * Weryfikacja source-level (jak część C), NIE żywy klik DOM — pełny test z realnym
 * `vite build`+`?playtest=`+kliknięciem `.cdb-rm` w uruchomionej grze wymagałby zbudowania
 * całego stanu gry (cywilizacje, istniejąca negocjacja) przez main.ts (closure, nie
 * eksportuje się częściowo) — uznane za nieproporcjonalne dla RUNDY 1 wobec:
 * (1) ta ścieżka NIE jest tą, którą pokazują zrzuty Macieja — dowód: string "Nie spełnia
 *     warunków: Brakuje 9 PW do uczciwej oferty traktatu handlowego @ Relacji" (dokładny
 *     cytat z opisu) istnieje WYŁĄCZNIE w `diplomacy-proposals.ts:1359` (reason bramki) +
 *     `renderPnBalancePanelHtml:444` (prefiks "Nie spełnia warunków: ") — żaden z trzech
 *     kompozytorowych verdictów (renderPnBalancePanelForTreaty/FromBasket) nie generuje
 *     tego prefiksu — więc zrzuty Macieja to STÓŁ (część A/B/G), nie kompozytor;
 * (2) mimo to część (G) naprawia realny, żywo potwierdzony bug w STOLE (dokładnie ten typ
 *     niespójności etykiety, o który pytał RECON w kryterium 5) — metodologia
 *     Chromium+mutacja już raz znalazła i naprawiła prawdziwy defekt w tej rundzie, nie
 *     tylko potwierdza kod;
 * jeśli Evaluator uzna to za niewystarczające, pełny vite+klik test kompozytora to
 * konkretny, ograniczony zakres dla rundy 2 — nie milczące zawężenie zakresu.
 *
 * Usage (z gra/): node tools/dyplo-bilans-gate-n-e1-reprodukcja-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[dyplo-bilans-n-e1] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.dyplo-bilans-n-e1-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dyplo-bilans-n-e1-bundle.js');
const BUNDLE_MUT = path.resolve(__dirname, '.dyplo-bilans-n-e1-bundle-mut.js');
const BUNDLE_MUT2 = path.resolve(__dirname, '.dyplo-bilans-n-e1-bundle-mut2.js');
const MAIN_TS = path.resolve(GRA, 'src', 'main.ts');
const DIPLO_BALANCE = path.resolve(GRA, 'src', 'ui', 'diplomacyAcceptanceBalance.ts');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const SHOT_DIR = path.resolve(
  GRA, '..', 'dyspozycje', 'autobot', 'runs',
  'P-DYPLO-BILANS-GATE-NIESPOJNY-N-E1-REPRODUKCJA', 'dowody',
);

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

async function shot(page, name) {
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  const p = path.join(SHOT_DIR, name);
  await page.screenshot({ path: p, animations: 'disabled' });
  console.log('  [zrzut] ' + p);
}

function cleanup() {
  for (const f of [
    ENTRY, BUNDLE, BUNDLE_MUT, BUNDLE_MUT2,
    BUNDLE.replace(/\.js$/, '.css'), BUNDLE_MUT.replace(/\.js$/, '.css'), BUNDLE_MUT2.replace(/\.js$/, '.css'),
  ]) {
    try { fs.unlinkSync(f); } catch (_) { /* ok */ }
  }
}

function writeEntry() {
  fs.writeFileSync(ENTRY, [
    "/* GENEROWANY PRZEZ dyplo-bilans-gate-n-e1-reprodukcja-test.cjs — nie edytowac recznie. */",
    "import { evaluateProposal } from '../src/game/diplomacy-proposals';",
    "import { computePlayerAcceptanceSides } from '../src/game/diplomacy-acceptance-points';",
    "import {",
    "  balancePanelDataFromRows,",
    "  renderPnBalancePanelHtml,",
    "} from '../src/ui/diplomacyAcceptanceBalance';",
    "import { resolveProposalPn } from '../src/game/diplomacy-pn-engine';",
    "",
    "(window as unknown as Record<string, unknown>).evaluateProposal = evaluateProposal;",
    "(window as unknown as Record<string, unknown>).computePlayerAcceptanceSides = computePlayerAcceptanceSides;",
    "(window as unknown as Record<string, unknown>).balancePanelDataFromRows = balancePanelDataFromRows;",
    "(window as unknown as Record<string, unknown>).renderPnBalancePanelHtml = renderPnBalancePanelHtml;",
    "(window as unknown as Record<string, unknown>).resolveProposalPn = resolveProposalPn;",
    "",
  ].join('\n'), 'utf8');
}

/* Mutacja W LOCIE — kontrola nietautologiczna (dowód, że część A/B poniżej NAPRAWDĘ testuje
 * spójność bramki, a nie przechodzi niezależnie od stanu kodu): psuje WYŁĄCZNIE bramkę
 * akceptacji pakietu (`canAccept = blockReason == null` → zawsze `true`), zostawiając
 * wyświetlany "Bilans" (net) NIETKNIĘTY. Jeśli część A1/B "PRZED" (sekcja check '(A1)'/
 * '(B) PRZED') dalej przechodzi na tym zmutowanym bundlu — test jest tautologiczny (nie
 * łapie prawdziwego rozjazdu panel/bramka). Nie dotyka repo — tylko bundel MUT do
 * jednorazowego użycia w tym pliku. */
const NET_PO = 'const canAccept = blockReason == null;';
const NET_PRZED = 'const canAccept = true;';
const mutation = { applied: 0 };
const revertNetFixPlugin = {
  name: 'revert-net-unifikacja-fix',
  setup(build) {
    build.onLoad({ filter: /diplomacyAcceptanceBalance\.ts$/ }, (args) => {
      if (path.resolve(args.path) !== DIPLO_BALANCE) return null;
      const src = fs.readFileSync(args.path, 'utf8');
      const out = src.replace(NET_PO, NET_PRZED);
      if (out !== src) mutation.applied++;
      return { contents: out, loader: 'ts', resolveDir: path.dirname(args.path) };
    });
  },
};

/* Mutacja W LOCIE #2 (Obrona runda 1, zarzut 3 Evaluatora — naprawa packageMode w
 * balancePanelDataFromRows): kontrola nietautologiczna dla CZĘŚCI (G) niżej. Wyłącza
 * WYŁĄCZNIE naprawę (wymusza `packageMode` zawsze `undefined`, czyli dawne zachowanie:
 * etykieta "Bilans" pakietu = mode PRIMARY wiersza, zależny od kolejności w tablicy
 * `rows`), zostawiając resztę pliku (w tym naprawę N4/net z mutacji #1) NIETKNIĘTĄ. Jeśli
 * część (G) "PRZED" dalej przechodzi (etykiety identyczne mimo odwróconej naprawy) — test
 * (G) jest tautologiczny. Nie dotyka repo — tylko bundel MUT2. */
const MODE_PO = "actionable.length > 1\n    ? (hasTreatyComponent && hasBasketComponent";
const MODE_PRZED = "false\n    ? (hasTreatyComponent && hasBasketComponent";
const mutation2 = { applied: 0 };
const revertPackageModeFixPlugin = {
  name: 'revert-package-mode-order-fix',
  setup(build) {
    build.onLoad({ filter: /diplomacyAcceptanceBalance\.ts$/ }, (args) => {
      if (path.resolve(args.path) !== DIPLO_BALANCE) return null;
      const src = fs.readFileSync(args.path, 'utf8');
      const out = src.replace(MODE_PO, MODE_PRZED);
      if (out !== src) mutation2.applied++;
      return { contents: out, loader: 'ts', resolveDir: path.dirname(args.path) };
    });
  },
};

async function buildBundle(outfile, mutate) {
  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    target: 'es2020',
    outfile,
    absWorkingDir: GRA,
    loader: { '.ts': 'ts', '.json': 'json' },
    logLevel: 'silent',
    plugins: mutate === 'net' ? [revertNetFixPlugin]
      : mutate === 'mode' ? [revertPackageModeFixPlugin]
        : [],
  });
}

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[dyplo-bilans-n-e1] domyslny Chromium niedostepny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

/* ============================================================================
 * CZĘŚĆ (0) ŹRÓDŁO — TREATY_GATED_NEGOTIATION_ACTIONS w main.ts nadal = dokładnie
 * {'pokoj','umowa_szlakow','umowa_handlowa'}. Odtworzenie sąsiada pakietu w tym pliku
 * (patrz pageBootstrap.__packageSiblingPn) jest WIERNE tylko, gdy ten zbiór się zgadza.
 * ========================================================================== */
function checkTreatyGatedSetSource() {
  const src = fs.readFileSync(MAIN_TS, 'utf8');
  const m = /const TREATY_GATED_NEGOTIATION_ACTIONS: ReadonlySet<string> = new Set\(\[\s*([^\]]*)\]\);/.exec(src);
  check('(0) źródło: TREATY_GATED_NEGOTIATION_ACTIONS znaleziony w main.ts', m != null);
  if (!m) return null;
  const items = m[1].split(',').map(s => s.trim().replace(/^'|'$/g, '')).filter(Boolean);
  const expected = ['pokoj', 'umowa_szlakow', 'umowa_handlowa'];
  check(
    '(0) źródło: TREATY_GATED_NEGOTIATION_ACTIONS === {pokoj, umowa_szlakow, umowa_handlowa} '
    + '(odtworzenie packageSiblingPn w tym pliku jest wierne)',
    items.length === expected.length && expected.every(e => items.includes(e)),
    items,
  );
  return items;
}

/* ============================================================================
 * CZĘŚĆ (0b) ŹRÓDŁO — etykieta "Bilans (Oni)" (kompozytor koszyka, PRZED dodaniem do
 * stołu) vs "Bilans (netto)" (stół, PO dodaniu) to DWIE RÓŻNE funkcje renderujące, nie
 * jeden kod z niespójną etykietą.
 * ========================================================================== */
function checkLabelTwoFunctionsSource() {
  const balanceSrc = fs.readFileSync(DIPLO_BALANCE, 'utf8');
  const hasComposerLabel = /'<span class="da-pn-bal-lbl">Bilans \(Oni\)<\/span>'/.test(balanceSrc);
  const hasTableLabel = /const centerLabel = incomingTrade \|\| isTreatyMode \? 'Bilans \(netto\)' : 'Bilans \(Oni\)';/.test(balanceSrc);
  check(
    '(0b) źródło: renderPnBalancePanelFromBasket (kompozytor) ma STAŁĄ etykietę "Bilans (Oni)" '
    + '— osobna funkcja od renderPnBalancePanelHtml (stół), która liczy centerLabel dynamicznie',
    hasComposerLabel && hasTableLabel,
    { hasComposerLabel, hasTableLabel },
  );
}

/* ============================================================================
 * CZĘŚĆ (C) ŹRÓDŁO — handleNegotiationEditOwn woła updateDiplomacyAudience() PO
 * applyOwnProposalEdit; buildPendingNegotiationRows liczy previewNegotiationEntry PONOWNIE
 * (świeżo) wewnątrz .map(), bez cache.
 * ========================================================================== */
function checkEditRefreshSource() {
  const src = fs.readFileSync(MAIN_TS, 'utf8');
  const fnStart = src.indexOf('function handleNegotiationEditOwn(');
  check('(C1) źródło: handleNegotiationEditOwn znaleziona w main.ts', fnStart >= 0);
  if (fnStart >= 0) {
    const fnEnd = src.indexOf('\n    }', fnStart);
    const body = src.slice(fnStart, fnEnd > 0 ? fnEnd : fnStart + 1500);
    const hasApply = body.indexOf('applyOwnProposalEdit') >= 0;
    const hasRefresh = body.indexOf('updateDiplomacyAudience()') >= 0;
    const applyIdx = body.indexOf('applyOwnProposalEdit');
    const refreshIdx = body.indexOf('updateDiplomacyAudience()');
    check(
      '(C1) źródło: handleNegotiationEditOwn woła applyOwnProposalEdit, POTEM '
      + 'updateDiplomacyAudience() (odświeżenie panelu PO edycji w miejscu, ta sama tura)',
      hasApply && hasRefresh && applyIdx < refreshIdx,
      { hasApply, hasRefresh, applyIdx, refreshIdx },
    );
  }
  const bprStart = src.indexOf('function buildPendingNegotiationRows(');
  check('(C2) źródło: buildPendingNegotiationRows znaleziona w main.ts', bprStart >= 0);
  if (bprStart >= 0) {
    const mapIdx = src.indexOf('.map(entry => {', bprStart);
    const previewIdx = src.indexOf('previewNegotiationEntry(entry)', bprStart);
    check(
      '(C2) źródło: previewNegotiationEntry(entry) wołane WEWNĄTRZ .map(entry => …) '
      + 'buildPendingNegotiationRows — świeże przeliczenie PER wiersz PRZY KAŻDYM wywołaniu, '
      + 'nie odczyt z cache/memoizacji',
      mapIdx >= 0 && previewIdx > mapIdx && previewIdx < mapIdx + 2000,
      { mapIdx, previewIdx },
    );
  }
}

/** Buduje wpis stołu 'own' + jego responderPreview/acceptance DOKŁADNIE jak main.ts. */
function pageBootstrap() {
  const w = window;
  const TREATY_GATED = new Set(['pokoj', 'umowa_szlakow', 'umowa_handlowa']);

  /** Odtworzenie main.ts::packageSiblingPn (bez TREATY_GATED wierszy jako sąsiadów). */
  w.__packageSiblingPn = (table, excludeId) => {
    let givePn = 0, receivePn = 0;
    for (const n of table) {
      if (n.id === excludeId) continue;
      if (TREATY_GATED.has(n.actionId)) continue;
      const pn = w.resolveProposalPn(n.payload, { difficulty: 'normal', proposerOwnerId: 0, playerOwnerId: 0 });
      givePn += pn.givePn;
      receivePn += pn.receivePn;
    }
    return { givePn, receivePn };
  };
  w.__isTreatyBaseFairnessAction = (actionId) => TREATY_GATED.has(actionId) && actionId !== 'pokoj'
    ? true : (actionId === 'umowa_szlakow' || actionId === 'umowa_handlowa');

  // Relacja NISKA (jak w zrzucie 1 Macieja: 44,9) — celowo: effectiveTreatyPnRequired(80,130)
  // z pierwszej wersji tego testu okazało się DAWAĆ GRACZOWI PREMIĘ (>100 pkt Relacji
  // podnosi playerRequired, który jest DODAWANY po stronie proponenta w
  // treatyBaseFairnessGap — więc traktat przechodził przy KAŻDYM koszyku, zero-informacyjne).
  // Przy Relacji <100 playerRequired maleje i realnie trzeba domknąć bazę koszykiem sąsiada
  // — dokładnie warunki z opisu.
  const RELATION = { zaufanie: 20, respekt: 20, status: 'pokoj' };
  const REL_TOTAL = 40;
  const evalCtx = (sibling) => ({
    relation: RELATION,
    stanWojny: false,
    turn: 100,
    proposerRespekt: 60,
    responderRespekt: 60,
    militaryRatio: 1,
    respektWzgledny: 0.5,
    ekspansjaPrzyGranicy: false,
    difficulty: 'normal',
    packageSiblingGivePn: sibling ? sibling.givePn : undefined,
    packageSiblingReceivePn: sibling ? sibling.receivePn : undefined,
  });

  /** previewNegotiationEntry (main.ts) dla wiersza 'own' — DOKŁADNIE evaluateProposal(proposal, ctx). */
  w.__previewOwn = (actionId, payload, sibling) => {
    const proposal = { actionId, proposerOwnerId: 0, responderOwnerId: 1, payload };
    const res = w.evaluateProposal(proposal, evalCtx(sibling));
    return { accepted: res.accepted, reason: res.reason, pwBalance: res.pwBalance };
  };

  /** Wiersz NegotiationBalanceSource DOKŁADNIE jak buildPendingNegotiationRows (own, awaitingAiResponse=true). */
  w.__buildRow = (id, actionId, actionLabel, payload, table) => {
    const sibling = w.__isTreatyBaseFairnessAction(actionId)
      ? w.__packageSiblingPn(table, id)
      : undefined;
    const responderPreview = w.__previewOwn(actionId, payload, sibling);
    const acceptance = w.computePlayerAcceptanceSides(actionId, payload, REL_TOTAL, false, {
      difficulty: 'normal', proposerOwnerId: 0, tempoGry: 'standardowa',
    });
    return {
      id, direction: 'own', actionLabel, awaitingAiResponse: true,
      responderPreview, acceptanceMy: acceptance.my, acceptanceTheir: acceptance.their,
      canAccept: false, canCounter: false, uiActionId: actionId === 'handel' ? '14' : '5',
    };
  };

  w.__renderPackage = (table) => {
    const rows = table.map(t => w.__buildRow(t.id, t.actionId, t.actionLabel, t.payload, table));
    const data = w.balancePanelDataFromRows(rows);
    return { html: w.renderPnBalancePanelHtml(data), data, rows };
  };
}

function goldItems(amount) {
  return amount > 0 ? [{ typ: 'zloto', id: 'zloto', ilosc: amount }] : [];
}

async function main() {
  const treatyGatedItems = checkTreatyGatedSetSource();
  checkLabelTwoFunctionsSource();
  checkEditRefreshSource();

  writeEntry();
  await buildBundle(BUNDLE, false);
  await buildBundle(BUNDLE_MUT, 'net');
  await buildBundle(BUNDLE_MUT2, 'mode');
  check('(0c) mutacja PRZED faktycznie popsuła bramkę canAccept (zawsze true) — test '
    + 'nietautologiczny, kontrola (F) niżej DOWODZI, że część A/B faktycznie łapie rozjazd '
    + 'panel/bramka, nie tylko potwierdza dzisiejszy kod', mutation.applied === 1, mutation.applied);
  check('(0d) mutacja #2 PRZED faktycznie wyłączyła naprawę packageMode (wymusza stare, '
    + 'kolejność-zależne zachowanie) — test nietautologiczny, kontrola (G) niżej DOWODZI, że '
    + 'część (G) faktycznie łapie rozjazd etykiety zależny od kolejności, nie tylko potwierdza '
    + 'dzisiejszy kod', mutation2.applied === 1, mutation2.applied);
  if (mutation.applied !== 1 || mutation2.applied !== 1) {
    console.log('\nPRZERWANE: nie udało się zmutować kodu (bramka canAccept lub packageMode) — kod się przesunął.');
    cleanup();
    process.exit(1);
  }
  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));

  const blank = '<!DOCTYPE html><html><head><meta charset="utf-8"><style>'
    + '*{box-sizing:border-box}html,body{margin:0;padding:0;background:#0b0d12;color:#eee;'
    + 'font-family:sans-serif;height:100%;width:100%;}</style></head><body></body></html>';
  await page.setContent(blank);
  await page.addScriptTag({ path: BUNDLE });
  await page.evaluate(pageBootstrap);

  const TREATY_ID = 'negot-umowa_szlakow-1';
  const HANDEL_ID = 'negot-handel-1';
  const treatyPayload = { actionId: 'umowa_szlakow', turns: 15, treatyTurns: 15 };
  const mkHandel = (giveGold, receiveGold) => ({
    actionId: 'handel',
    giveItems: goldItems(giveGold),
    receiveItems: goldItems(receiveGold),
    resourceTradeMode: 'once',
  });
  const mkTable = (handelPayload) => ([
    { id: TREATY_ID, actionId: 'umowa_szlakow', actionLabel: 'Traktat handlowy', payload: treatyPayload },
    { id: HANDEL_ID, actionId: 'handel', actionLabel: 'Umowa wymiany surowców', payload: handelPayload },
  ]);

  console.log('\n--- (A1) handel 40 PW (Relacja 40, poniżej progu domknięcia bazy traktatu — realnie brakuje '
    + '9 PW: partnerRequired 80+1 − playerRequired 32 − 40 = 9, DOKŁADNIE liczba z opisu Macieja '
    + '"Brakuje 9 PW") — MUSI być odrzucone ---');
  const a1 = await page.evaluate((table) => window.__renderPackage(table), mkTable(mkHandel(40, 1)));
  await page.setContent(blank);
  await page.evaluate((html) => { document.body.innerHTML = '<div style="padding:20px;max-width:520px">' + html + '</div>'; }, a1.html);
  await shot(page, '01-a1-handel-40pw-panel.png');
  console.log('  netPw=' + a1.data.theirBalance.balancePn, 'canAccept=' + a1.data.canAccept,
    'rowsAccepted=' + JSON.stringify(a1.rows.map(r => r.responderPreview.accepted)));
  check(
    '(A1) obie strony gate zgodne: canAccept panelu === (wszystkie wiersze accepted) [oczekiwane: false]',
    a1.data.canAccept === false && a1.rows.some(r => r.responderPreview.accepted === false),
    { canAccept: a1.data.canAccept, rows: a1.rows.map(r => r.responderPreview) },
  );
  check(
    '(A1) wyświetlany netPw (theirBalance.balancePn) UJEMNY, gdy canAccept=false — brak wzorca '
    + '"zielone/dodatnie, ale zablokowane" (Maciej, zrzut 1)',
    a1.data.theirBalance.balancePn < 0,
    a1.data.theirBalance.balancePn,
  );
  check('(A1) verdict/hint tekstowo spójny z blokadą (brak "Nadwyżka" w treści)',
    !/Nadwyżka/.test(a1.html) && /Brakuje/.test(a1.html), null);

  console.log('\n--- (A2) handel dokładnie 49 PW (próg domknięcia, gap=0) — MUSI być zaakceptowane, bilans 0 ---');
  const a2 = await page.evaluate((table) => window.__renderPackage(table), mkTable(mkHandel(49, 1)));
  check('(A2) canAccept=true, wszystkie wiersze accepted',
    a2.data.canAccept === true && a2.rows.every(r => r.responderPreview.accepted === true),
    { canAccept: a2.data.canAccept, rows: a2.rows.map(r => r.responderPreview) });
  check('(A2) netPw === 0 (dokładnie na progu)', a2.data.theirBalance.balancePn === 0, a2.data.theirBalance.balancePn);

  console.log('\n--- (A3) handel 221 PW (liczba z opisu Macieja, "~221/80 PW") — MUSI być zaakceptowane ---');
  const a3 = await page.evaluate((table) => window.__renderPackage(table), mkTable(mkHandel(221, 1)));
  await page.evaluate((html) => { document.body.innerHTML = '<div style="padding:20px;max-width:520px">' + html + '</div>'; }, a3.html);
  await shot(page, '02-a3-handel-221pw-panel.png');
  console.log('  netPw=' + a3.data.theirBalance.balancePn, 'canAccept=' + a3.data.canAccept);
  check('(A3) canAccept=true, wszystkie wiersze accepted',
    a3.data.canAccept === true && a3.rows.every(r => r.responderPreview.accepted === true),
    { canAccept: a3.data.canAccept, rows: a3.rows.map(r => r.responderPreview) });
  check('(A3) netPw > 0 (nadwyżka, spójna ze "141 PW" z opisu — dokładna liczba zależy od modyfikatora '
    + 'Relacji testowej 130, nie musi być bit-identyczna z zrzutem Macieja)',
    a3.data.theirBalance.balancePn > 0, a3.data.theirBalance.balancePn);

  console.log('\n--- (B) EDYCJA W MIEJSCU: z odrzuconego A1 (handel 40 PW, "Brakuje 9 PW") dokładamy złota DO '
    + 'ISTNIEJĄCEGO wiersza handel (40→221 PW), BEZ usuwania/tworzenia nowego wiersza, panel PRZELICZANY '
    + 'PONOWNIE (dokładnie sekwencja z opisu Macieja: dodaj → sprawdź panel+bramkę → edytuj W MIEJSCU → '
    + 'sprawdź ponownie) ---');
  const bBefore = a1; // stan PRZED edycją = dokładnie A1 (czerwony, "Brakuje 9 PW")
  const bAfter = await page.evaluate((table) => window.__renderPackage(table), mkTable(mkHandel(221, 1)));
  await page.evaluate((html) => { document.body.innerHTML = '<div style="padding:20px;max-width:520px">' + html + '</div>'; }, bAfter.html);
  await shot(page, '03-b-po-edycji-w-miejscu-panel.png');
  check(
    '(B) PRZED edycją (handel 40 PW): zablokowane, netPw ujemny (-9, "Brakuje 9 PW")',
    bBefore.data.canAccept === false && bBefore.data.theirBalance.balancePn === -9,
    { canAccept: bBefore.data.canAccept, net: bBefore.data.theirBalance.balancePn },
  );
  check(
    '(B) PO edycji W MIEJSCU (ten sam wiersz handel, 40→221 PW): panel PRZELICZA SIĘ NA ŻYWO — '
    + 'canAccept=true, netPw dodatni — NIE pokazuje starej (zablokowanej) wartości. Staleness WYKLUCZONY '
    + 'na tej ścieżce danych (balancePanelDataFromRows/renderPnBalancePanelHtml wołane ponownie).',
    bAfter.data.canAccept === true && bAfter.data.theirBalance.balancePn > 0
    && bAfter.data.theirBalance.balancePn !== bBefore.data.theirBalance.balancePn,
    { before: bBefore.data.theirBalance.balancePn, after: bAfter.data.theirBalance.balancePn,
      canAcceptBefore: bBefore.data.canAccept, canAcceptAfter: bAfter.data.canAccept },
  );

  console.log('\n--- (F) KONTROLA NIETAUTOLOGICZNA: TA SAMA scena A1 (handel 40 PW, "Brakuje 9 PW") na '
    + 'bundlu MUT (bramka canAccept zepsuta na zawsze `true`, "Bilans" NIETKNIĘTY) — dowodzi, że '
    + 'checki (A1)/(B) na kodzie BIEŻĄCYM (17 PASS wyżej) NAPRAWDĘ testują spójność panel/bramka, a '
    + 'nie przechodzą niezależnie od stanu kodu: tu MUSZĄ wykryć dokładnie ten sam rozjazd, który '
    + 'zgłosił Maciej (Bilans wciąż "Brakuje 9 PW", ale canAccept=true / "Przyjmij" aktywny) ---');
  await page.setContent(blank);
  await page.addScriptTag({ path: BUNDLE_MUT });
  await page.evaluate(pageBootstrap);
  const f = await page.evaluate((table) => window.__renderPackage(table), mkTable(mkHandel(40, 1)));
  await page.evaluate((html) => { document.body.innerHTML = '<div style="padding:20px;max-width:520px">' + html + '</div>'; }, f.html);
  await shot(page, '04-f-kontrola-mutacja-canaccept-zawsze-true.png');
  console.log('  [MUT] netPw=' + f.data.theirBalance.balancePn, 'canAccept=' + f.data.canAccept);
  check(
    '(F) bundle MUT (canAccept zawsze true) odtwarza rozjazd panel/bramka: "Bilans" nadal pokazuje '
    + '"Brakuje 9 PW" (net=-9, NIETKNIĘTY), ale canAccept=true — dowodzi, że część (A)/(B) na kodzie '
    + 'BIEŻĄCYM jest realnym testem tej klasy regresji, nie tautologią przechodzącą niezależnie od kodu',
    f.data.canAccept === true && f.data.theirBalance.balancePn === -9,
    { canAccept: f.data.canAccept, net: f.data.theirBalance.balancePn },
  );

  console.log('\n--- (G) OBRONA RUNDA 1, zarzut 3 (kryterium końca 4, etykieta Bilans Oni/netto): TA SAMA '
    + 'zawartość pakietu (Traktat handlowy + Umowa wymiany surowców, handel 221 PW jak A3), tylko w '
    + 'DWÓCH kolejnościach dodania wierszy do stołu (dokładnie to, co robi usunięcie+ponowne dodanie '
    + 'jednej pozycji — przesuwa ją na koniec tablicy) — panel MUSI pokazywać TĘ SAMĄ etykietę "Bilans" ---');
  await page.setContent(blank);
  await page.addScriptTag({ path: BUNDLE });
  await page.evaluate(pageBootstrap);
  const centerLabelOf = (html) => {
    const m = /da-pn-bal-cell center[^"]*">\s*<span class="da-pn-bal-lbl">([^<]*)<\/span>/.exec(html);
    return m ? m[1] : null;
  };
  const orderTreatyFirst = mkTable(mkHandel(221, 1)); // [TREATY_ID, HANDEL_ID] — jak (A3)/(B)
  const orderHandelFirst = [orderTreatyFirst[1], orderTreatyFirst[0]]; // [HANDEL_ID, TREATY_ID] — po usunięciu+ponownym dodaniu handlu
  const gTreatyFirst = await page.evaluate((t) => window.__renderPackage(t), orderTreatyFirst);
  const gHandelFirst = await page.evaluate((t) => window.__renderPackage(t), orderHandelFirst);
  await page.evaluate((html) => { document.body.innerHTML = '<div style="padding:20px;max-width:520px">' + html + '</div>'; }, gHandelFirst.html);
  await shot(page, '05-g-po-naprawie-kolejnosc-handel-pierwszy.png');
  console.log('  [PO naprawie] label(treaty-first)=' + centerLabelOf(gTreatyFirst.html)
    + ' label(handel-first)=' + centerLabelOf(gHandelFirst.html)
    + ' net(treaty-first)=' + gTreatyFirst.data.theirBalance.balancePn
    + ' net(handel-first)=' + gHandelFirst.data.theirBalance.balancePn);
  check(
    '(G) PO naprawie (kod bieżący): etykieta "Bilans" IDENTYCZNA niezależnie od kolejności wierszy '
    + '— naprawiony packageMode w balancePanelDataFromRows (nie primary.mode)',
    centerLabelOf(gTreatyFirst.html) === centerLabelOf(gHandelFirst.html)
    && gTreatyFirst.data.theirBalance.balancePn === gHandelFirst.data.theirBalance.balancePn
    && gTreatyFirst.data.canAccept === gHandelFirst.data.canAccept,
    { labelTreatyFirst: centerLabelOf(gTreatyFirst.html), labelHandelFirst: centerLabelOf(gHandelFirst.html) },
  );

  console.log('\n--- (G-PRZED) KONTROLA NIETAUTOLOGICZNA: TA SAMA scena (G) na bundlu MUT2 (naprawa '
    + 'packageMode wyłączona — wraca stare zachowanie: etykieta = mode PRIMARY wiersza, zależny od '
    + 'kolejności) — MUSI odtworzyć dokładnie rozjazd etykiety zgłoszony w zarzucie 3 Evaluatora, inaczej '
    + 'część (G) na kodzie naprawionym jest tautologią ---');
  await page.setContent(blank);
  await page.addScriptTag({ path: BUNDLE_MUT2 });
  await page.evaluate(pageBootstrap);
  const gPrzedTreatyFirst = await page.evaluate((t) => window.__renderPackage(t), orderTreatyFirst);
  const gPrzedHandelFirst = await page.evaluate((t) => window.__renderPackage(t), orderHandelFirst);
  await page.evaluate((html) => { document.body.innerHTML = '<div style="padding:20px;max-width:520px">' + html + '</div>'; }, gPrzedHandelFirst.html);
  await shot(page, '06-g-przed-naprawa-kolejnosc-handel-pierwszy-bilans-oni.png');
  console.log('  [PRZED naprawą, MUT2] label(treaty-first)=' + centerLabelOf(gPrzedTreatyFirst.html)
    + ' label(handel-first)=' + centerLabelOf(gPrzedHandelFirst.html));
  check(
    '(G-PRZED) bundle MUT2 (naprawa wyłączona) odtwarza rozjazd etykiety: "Bilans (netto)" gdy traktat '
    + 'dodany pierwszy, "Bilans (Oni)" gdy handel dodany pierwszy — TA SAMA zawartość pakietu, RÓŻNA '
    + 'etykieta wyłącznie z kolejności — dowodzi, że (G) na kodzie naprawionym realnie testuje tę klasę '
    + 'regresji, nie tautologia',
    centerLabelOf(gPrzedTreatyFirst.html) === 'Bilans (netto)'
    && centerLabelOf(gPrzedHandelFirst.html) === 'Bilans (Oni)',
    { labelTreatyFirst: centerLabelOf(gPrzedTreatyFirst.html), labelHandelFirst: centerLabelOf(gPrzedHandelFirst.html) },
  );

  check('(E) brak błędów JS strony podczas całego przebiegu', pageErrors.length === 0, pageErrors);

  await browser.close();
  cleanup();

  console.log('\n=== PODSUMOWANIE: ' + pass + ' PASS / ' + fail + ' FAIL ===');
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  cleanup();
  process.exit(1);
});
