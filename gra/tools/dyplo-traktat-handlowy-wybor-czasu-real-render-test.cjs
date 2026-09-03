'use strict';
/**
 * dyplo-traktat-handlowy-wybor-czasu-real-render-test.cjs
 *
 * TEMAT: R-DYPLO-TRAKTAT-HANDLOWY-WYBOR-CZASU-Q1
 *
 * ZGŁOSZENIE (właściciel, zrzut stołu negocjacji): „Widzę, że traktat handlowy jest tylko
 * na pięć tur. Powinniśmy mieć możliwość ustanawiania długości traktatu tak samo w
 * negocjacjach, jak przy umowie o pakt nieagresji."
 *
 * KROK 1 — DIAGNOZA (żywa, PRZED zmianą kodu). Dwa niezależne ustalenia:
 *
 *  (D1) „wygasa za 5 tur" ze zrzutu NIE jest czasem traktatu. To WAŻNOŚĆ PROPOZYCJI na
 *       stole: `main.ts:15447` liczy `expiresInTurns = entry.expiresTurn - turn`, a
 *       `diplomacy-proposals.ts:2110` ustawia `expiresTurn = turn + NEGOTIATION_EXPIRY_TURNS`,
 *       gdzie `NEGOTIATION_EXPIRY_TURNS = 5` (`diplomacy-proposals.ts:1999`). Liczba 5 jest
 *       więc WSPÓLNA dla każdej nierozstrzygniętej propozycji (także paktu nieagresji) i
 *       nie ma nic wspólnego z zahardkodowanym `turns: 20`. Test (D1) dowodzi tego ŻYWO:
 *       renderuje ten sam wiersz stołu dla '5' i dla '2' i pokazuje identyczne „wygasa za 5 tur".
 *
 *  (D2) Prawdziwy defekt: klik w akcję „Traktat handlowy" (aid '5') omijał JAKIKOLWIEK modal
 *       i wysyłał `{ actionId:'5', turns: 20 }` na sztywno (dawne D-DYPLO-KOSZYK-OD-RAZU).
 *       Formularz czasu dla '5' JUŻ ISTNIAŁ w `diplomacyTradeBasket.ts` (`treatySectionHtml`
 *       case '5', `readTreatyStateFromDom`, `validateTreatyForm`, `buildTreatyPayload`) —
 *       martwy, bo '5' nie należy do `TRADE_BASKET_ACTION_IDS`, a bypass i tak strzelał pierwszy.
 *
 * KROK 2 — FIX (WYŁĄCZNIE `diplomacyAudience.ts`): bypass zastąpiony wywołaniem
 * `showTradeBasketModal(treatyBasketModeFor(aid), ...)` — TEN SAM modal, którego używa pakt
 * nieagresji (aid '2'); `treatyBasketModeFor` wymusza dla '5' tryb 'treaty'.
 *
 * ZAKRES CZASU dla '5' = 1–20 tur LUB 0 = bezterminowy (jak NAP, runda 1 → Obrona runda 1,
 * po odpowiedzi na zarzut 1 Evaluatora). Runda 1 błędnie wnioskowała „silnik nie ma
 * bezterminowego wariantu", bo myliła `turns: 0` (E3 — `clampDealTurns` 1–20 przycina 0 do
 * 1 tury, NIE bezterminowy) z pominięciem pola `turns` w ogóle (E5 — `diplomacy-proposals.ts:1325`
 * `payload.turns != null ? ... : null`, dokładnie jak NAP). Chip „Bezterminowy" dla '5' pomija
 * pole `turns` w payloadzie (nie wysyła `turns:0`) — patrz (G) niżej, żywy dowód end-to-end.
 * Silnik NIETKNIĘTY (`diplomacy-proposals.ts` bez zmian — zweryfikowano żywo, nie zakładając).
 *
 * ZARZUT 2 EVALUATORA (Obrona runda 1, po rozszerzeniu allowlisty o `diplomacyTradeBasket.ts`):
 * `buildTreatyPayload` (case '2'/'5'/'8') ustawiał `payload.turns = state.turns` (czas TRAKTATU
 * wybrany w formularzu), po czym bezwarunkowo NADPISYWAŁ go `dealTurns` z koszyka handlowego
 * (czas/częstotliwość WYMIANY „Co ile tur trwa wymiana", tylko gdy `resourceTradeMode==='per_turn'`
 * i koszyk ma `surowiec_ilosc`) — dwie różne wielkości, wybór gracza dla czasu traktatu ginął po
 * cichu. Pierwsza Obrona naprawiła to flagą `turnsSetByForm` (czas traktatu wygrywał z `dealTurns`
 * w tym SAMYM polu `payload.turns`).
 *
 * DRUGI PRZEBIEG EVALUATORA — DWA NOWE ZARZUTY, OBA PRZYJĘTE:
 *
 *  ZARZUT 1: `payload.turns` ma w silniku DWIE role naraz — wygaśnięcie traktatu ORAZ mnożnik
 *  wyceny PN cyklicznego słodzika (`proposalPnTurnsMultiplier`, ta sama funkcja w podglądzie
 *  koszyka, w `main.ts` i w `diplomacy-acceptance-points.ts`). Wpisanie tam czasu TRAKTATU
 *  sprzęgło wycenę z długością traktatu, mimo że `umowa_szlakow` transferuje koszyk JEDNORAZOWO:
 *  Evaluator zmierzył żywo 12→7 (−42%), 20→1 (−95%) i 1→20 (+1900%, furtka przez bramkę
 *  uczciwości) oraz 20-krotną rozbieżność podgląd-gracza vs wycena-silnika dla „Bezterminowego".
 *  NAPRAWA: rozdzielenie pól. `payload.treatyTurns` (NOWE) = czas TRAKTATU, 0 = bezterminowy,
 *  czytane wyłącznie przy liczeniu `wygasaTura` (`resolveTreatyDurationTurns`, fallback na
 *  `turns` dla payloadów AI/starych zapisów). `payload.turns` wraca do roli sprzed rundy =
 *  czas/częstotliwość WYMIANY z koszyka i mnożnik wyceny PN. Dowód: sekcje (H) i (I) — 3
 *  scenariusze Evaluatora + kontrola stabilności i nietautologiczności.
 *
 *  ZARZUT 2: handler kliku `.cdb-chip-turn` wybierał pole docelowe po `box.querySelector(
 *  '.cdb-treaty-turns')` — czyli po SAMYM ISTNIENIU pola traktatu gdziekolwiek w modalu, nie po
 *  sekcji klikniętego przycisku; klik chipa „5" w sekcji wymiany przestawiał czas TRAKTATU.
 *  NAPRAWA: adresat z `btn.closest('.cdb-treaty')` / `btn.closest('.cdb-duration')`.
 *  Dowód: sekcja (J) — REALNE kliki chipów w obu sekcjach, w obie strony.
 *
 * DOWÓD w tym pliku — real Chromium (`page.screenshot`), R-PROC-AUTOBOT.md §9 pkt 6a:
 *   (A) PRZED (mutacja w locie, przywrócony bypass): klik NIE otwiera modala, payload
 *       ma zahardkodowane `turns: 20` — kontrola negatywna (test nie jest tautologiczny).
 *   (B) PO (kod bieżący): klik otwiera modal z wyborem czasu; wybór 10 daje payload z 10.
 *   (C) brak regresu: pakt nieagresji, sojusz i trybut zachowują swoje formularze.
 *   (E) silnik: 10 → wygasaTura = tura+10; 0 → tura+1 (NIE bezterminowy); NAP 0 → null.
 *
 * ZRZUTY EKRANU → `dyspozycje/autobot/runs/R-DYPLO-TRAKTAT-HANDLOWY-WYBOR-CZASU-Q1/dowody/`.
 *
 * Usage (z gra/): node tools/dyplo-traktat-handlowy-wybor-czasu-real-render-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[traktat-handlowy-wybor-czasu] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.dthc-stubs');
const ENTRY = path.resolve(__dirname, '.dthc-entry.ts');
const BUNDLE_PO = path.resolve(__dirname, '.dthc-bundle-po.js');
const BUNDLE_PRZED = path.resolve(__dirname, '.dthc-bundle-przed.js');
/* (M) trzeci bundle: KOD BIEZACY z JEDNA mutacja — przywroconym bezwarunkowym
 * `payload.treatyTurns = state.tributeTurns` w case '8'. Kontrola nietautologiczna dla
 * zarzutu 1 piatego przebiegu Evaluatora (regresja mnoznika x8 dla domyslnego trybutu). */
const BUNDLE_TRIB_PRZED = path.resolve(__dirname, '.dthc-bundle-trib-przed.js');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const DIPLO_AUD = path.resolve(GRA, 'src', 'ui', 'diplomacyAudience.ts');
const DIPLO_BASKET = path.resolve(GRA, 'src', 'ui', 'diplomacyTradeBasket.ts');
const MAIN_TS = path.resolve(GRA, 'src', 'main.ts');
const MAINPATH = path.resolve(__dirname, '.dthc-mainpath.ts');
const MAINPATH_MUT = path.resolve(__dirname, '.dthc-mainpath-mut.ts');
const SHOT_DIR = path.resolve(
  GRA, '..', 'dyspozycje', 'autobot', 'runs',
  'R-DYPLO-TRAKTAT-HANDLOWY-WYBOR-CZASU-Q1', 'dowody',
);

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}
/* Przed kazda migawka wyciszamy dwa realne, powtarzalne zrodla roznic w tym modalu:
 * migajacy kursor tekstowy w polach liczbowych (pola dostaja focus przy klikach chipow)
 * oraz animacje/przejscia CSS wejscia modala. Dzieki temu kolejne przebiegi bramki nie
 * brudza drzewa roboczego duzymi, widocznymi roznicami (zgloszone przez Evaluatora w
 * piatym przebiegu na przykladzie 08-po-klik-chipow-...png).
 * UWAGA, zeby nie obiecywac wiecej niz to robi: zrzuty NIE sa deterministyczne bajtowo i
 * nie musza byc. Renderer Chromium potrafi dac inny antyaliasing — rzedu kilkunastu
 * pikseli, max delta RGB 2-3, wizualnie zerowe. To jest akceptowane i swiadomie NIE
 * scigane (zalecenie Evaluatora, szosty przebieg): dowod wizualny nie zalezy od bajtowej
 * identycznosci PNG. */
async function shot(page, name) {
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  const p = path.join(SHOT_DIR, name);
  await page.addStyleTag({
    content: '*,*::before,*::after{animation:none!important;-webkit-animation:none!important;'
      + 'transition:none!important;caret-color:transparent!important;}',
  });
  await page.evaluate(() => {
    const el = document.activeElement;
    if (el && el !== document.body && typeof el.blur === 'function') el.blur();
  });
  await page.screenshot({ path: p, animations: 'disabled', caret: 'hide' });
  console.log('  [zrzut] ' + p);
}

/* Stuby WYŁĄCZNIE dla modułów używających `import.meta.glob` (konstrukcja Vite — goły esbuild
 * daje `undefined` i moduł wybucha przy starcie) oraz dla audio. Cała warstwa testowana —
 * `diplomacyAudience.ts`, `diplomacyTradeBasket.ts`, `diplomacyNegotiationModal.ts`,
 * `diplomacy-proposals.ts` — jest PRAWDZIWA, nie stubowana. */
const stubs = {
  music: path.resolve(STUB_DIR, 'music-stub.ts'),
  leaderPortraits: path.resolve(STUB_DIR, 'leaderportraits-stub.ts'),
  brandAssets: path.resolve(STUB_DIR, 'brandassets-stub.ts'),
};
function writeStubs() {
  fs.mkdirSync(STUB_DIR, { recursive: true });
  fs.writeFileSync(stubs.music, [
    'export function startDiplomacyMusic() {}',
    'export function stopDiplomacyMusic() {}',
  ].join('\n'), 'utf8');
  fs.writeFileSync(stubs.leaderPortraits, [
    'export function civCardDisplayName(label) { return label; }',
    'export function leaderName() { return null; }',
    'export function leaderPortraitUrl() { return null; }',
    'export function civLeaderPortraitUrl() { return null; }',
  ].join('\n'), 'utf8');
  fs.writeFileSync(stubs.brandAssets, [
    'export function brandIconSvg() { return \'\'; }',
    'export function improvementIconSvg() { return \'\'; }',
    'export function mapResourceIconSvg() { return \'\'; }',
    'export function terrainIconSvg() { return \'\'; }',
    'export function buildingIconSvg() { return \'\'; }',
    'export function unitIconSvg() { return \'\'; }',
    'export function civIconSvg() { return \'\'; }',
    'export function epochIconSvg() { return \'\'; }',
    'export function settingIconSvg() { return \'\'; }',
    'export function brandMenuComponentsCss() { return \'\'; }',
    'export function menuIconSvg() { return \'\'; }',
    'export function brandMenuEmblemSvg() { return \'\'; }',
    'export function newGameIntroEmblemSvg() { return \'\'; }',
    'export function brandMotionCss() { return \'\'; }',
    'export function brandMenuBackgroundCss() { return \'\'; }',
    'export function svgThumbHtml() { return \'\'; }',
  ].join('\n'), 'utf8');
}
/* ============================================================================
 * (K)/(L) ZARZUT 4 EVALUATORA R3 — luka metodologiczna, PRZYJETY.
 *
 * Kazda dotychczasowa asercja silnikowa (E/G/H/I) podawala payload BEZPOSREDNIO do
 * `window.evaluateProposal`, z POMINIECIEM `main.ts::buildProposalFromPayload` — jedynej
 * realnej drogi „formularz -> stol negocjacyjny -> silnik" w grze. Dowodzila wiec, ze
 * technika dziala w izolacji, a nie ze skutek w grze jest poprawny. Dokladnie ta luka
 * przepuscila regresje: `treatyTurns` nie bylo na BIALEJ LISCIE pol `uiPayload`, wiec
 * traktat handlowy BEZ koszyka tracil jedyne pole czasu i stawal sie WIECZYSTY. To DRUGIE
 * wystapienie tej samej klasy bledu w tym samym miejscu (pierwsze: techPaymentMode/
 * techOfferId, Evaluator runda 3 innego tematu — komentarz zyje w main.ts obok bialej listy).
 *
 * Zamiast kopiowac ksztalt payloadu do testu (tautologia — kopia nie zna bialej listy),
 * WYCINAMY DOSLOWNIE zrodlo dwoch fragmentow `main.ts` i wykonujemy JE SAME w przegladarce:
 *   • `buildProposalFromPayload` — biala lista `uiPayload` (zarzuty 1 i 2),
 *   • blok budujacy `counterInitial` — prefill kontroferty/edycji (zarzut 3).
 * Kazda przyszla zmiana ksztaltu payloadu w main.ts natychmiast czerwieni te bramke, bo
 * test nie ma wlasnej kopii tej logiki. Kontrola nietautologicznosci: te same fragmenty z
 * mutacja przywracajaca stan sprzed poprawki (`.dthc-mainpath-mut.ts`) MUSZA dac zly wynik.
 * ========================================================================== */
const MAIN_BPFP_HEAD = 'function buildProposalFromPayload(';
const MAIN_BPFP_TAIL = 'return { cywAction, uiPayload, proposal };\n    }';
const MAIN_CI_HEAD = 'let counterInitial: import(';
const MAIN_CI_TAIL = '\n        return {\n          id: entry.id,';
/** Wycina [head..tail] ze zrodla; rzuca, gdy kod sie przesunal (zamiast cicho testowac nic). */
function sliceMainSource(src, head, tail, includeTail) {
  const i = src.indexOf(head);
  if (i < 0) throw new Error('main.ts: nie znaleziono kotwicy poczatkowej: ' + head);
  const j = src.indexOf(tail, i);
  if (j < 0) throw new Error('main.ts: nie znaleziono kotwicy koncowej: ' + JSON.stringify(tail));
  return src.slice(i, includeTail ? j + tail.length : j);
}
/** Sciezki modulow w wycietym kodzie sa relatywne do `src/`, generat lezy w `tools/`. */
function reroot(code) {
  return code.split("'./ui/").join("'../src/ui/").split("'./game/").join("'../src/game/");
}
const mainPathMutation = { whitelist: 0, counterGate: 0 };
function writeMainPathModules() {
  const src = fs.readFileSync(MAIN_TS, 'utf8');
  const bpfp = reroot(sliceMainSource(src, MAIN_BPFP_HEAD, MAIN_BPFP_TAIL, true));
  const ci = reroot(sliceMainSource(src, MAIN_CI_HEAD, MAIN_CI_TAIL, false));
  const render = (b, c) => [
    '/* GENEROWANY PRZEZ dyplo-traktat-handlowy-wybor-czasu-real-render-test.cjs.',
    ' * Cialo obu funkcji jest WYCIETE DOSLOWNIE z gra/src/main.ts — nie edytowac recznie. */',
    "import { proposalActionIdFromPayload } from '../src/ui/diplomacyNegotiationModal';",
    "import { actionUsesTradeBasket } from '../src/ui/diplomacyTradeBasket';",
    '/* eslint-disable @typescript-eslint/no-explicit-any */',
    'type NegotiationPayload = any;',
    'type ProposalPayload = any;',
    'type BasketItem = any;',
    'export ' + b,
    'export function counterInitialFromMain(',
    '  uiActionId: string, p: any, entry: any, direction: string, canCounter: boolean,',
    '): any {',
    c,
    '  return counterInitial;',
    '}',
    '',
  ].join('\n');
  fs.writeFileSync(MAINPATH, render(bpfp, ci), 'utf8');

  // Mutacja = dokladnie stan sprzed tej Obrony (oba zarzuty krytyczne + zarzut 3).
  let bMut = bpfp.replace(/\n\s*treatyTurns: payload\.treatyTurns,/, '');
  if (bMut !== bpfp) mainPathMutation.whitelist++;
  const CI_GATE_PO = "canCounter && (uiActionId === '5' || actionUsesTradeBasket(uiActionId))";
  const CI_GATE_PRZED = 'canCounter && actionUsesTradeBasket(uiActionId)';
  let cMut = ci.replace(CI_GATE_PO, CI_GATE_PRZED);
  if (cMut !== ci) mainPathMutation.counterGate++;
  fs.writeFileSync(MAINPATH_MUT, render(bMut, cMut), 'utf8');
}

function cleanup() {
  /* .css to sidecar esbuild (import CSS w drzewie UI) — usuwany razem z bundlem, inaczej
   * zostaje w `gra/tools/` jako smiec po przebiegu testu. */
  const artifacts = Object.values(stubs).concat([
    ENTRY, MAINPATH, MAINPATH_MUT, BUNDLE_PO, BUNDLE_PRZED, BUNDLE_TRIB_PRZED,
    BUNDLE_PO.replace(/\.js$/, '.css'), BUNDLE_PRZED.replace(/\.js$/, '.css'),
    BUNDLE_TRIB_PRZED.replace(/\.js$/, '.css'),
  ]);
  for (const f of artifacts) {
    try { fs.unlinkSync(f); } catch (_) { /* ok */ }
  }
  try { fs.rmdirSync(STUB_DIR); } catch (_) { /* ok */ }
}

/** Mutacja W LOCIE — przywraca stan SPRZED poprawki (bypass z `turns: 20`). Nie dotyka repo. */
const mutation = { applied: 0 };
const BYPASS_PO = `          showTradeBasketModal(
            treatyBasketModeFor(aid),
            action,
            withOwnTableTechFilter(mergeBasketCtx(negCtx), st, aid),
            (payload) => cfg!.onAction(cfg!.ownerId, aid, payload),
            () => { /* anulowano */ },
          );
          return;`;
const BYPASS_PRZED = `          cfg!.onAction(cfg!.ownerId, '5', { actionId: '5', turns: 20 });
          return;`;
const revertFixPlugin = {
  name: 'revert-traktat-handlowy-fix',
  setup(build) {
    build.onLoad({ filter: /diplomacyAudience\.ts$/ }, (args) => {
      if (path.resolve(args.path) !== DIPLO_AUD) return null;
      const src = fs.readFileSync(args.path, 'utf8');
      const out = src.replace(BYPASS_PO, BYPASS_PRZED);
      if (out !== src) mutation.applied++;
      return { contents: out, loader: 'ts', resolveDir: path.dirname(args.path) };
    });
  },
};

/* (M) Mutacja W LOCIE dla kontroli nietautologicznej zarzutu 1 (piaty przebieg Evaluatora):
 * przywraca BEZWARUNKOWY zapis `payload.treatyTurns = state.tributeTurns` w case '8'
 * (`buildTreatyPayload`), czyli stan sprzed tej Obrony. Nie dotyka repo. */
const tributeMutation = { applied: 0 };
const TRIB_PO = `      if (state.tributeTurns > 0) {
        payload.treatyTurns = state.tributeTurns;
        payload.turns = state.tributeTurns;
      }
      break;`;
const TRIB_PRZED = `      payload.treatyTurns = state.tributeTurns;
      if (state.tributeTurns > 0) payload.turns = state.tributeTurns;
      break;`;
const revertTributeFixPlugin = {
  name: 'revert-trybut-treatyturns-fix',
  setup(build) {
    build.onLoad({ filter: /diplomacyTradeBasket\.ts$/ }, (args) => {
      if (path.resolve(args.path) !== DIPLO_BASKET) return null;
      const src = fs.readFileSync(args.path, 'utf8');
      const out = src.replace(TRIB_PO, TRIB_PRZED);
      if (out !== src) tributeMutation.applied++;
      return { contents: out, loader: 'ts', resolveDir: path.dirname(args.path) };
    });
  },
};

async function buildBundle(outfile, mutate, mutateTribute) {
  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    target: 'es2020',
    outfile,
    absWorkingDir: GRA,
    loader: { '.ts': 'ts', '.json': 'json', '.svg': 'text', '.png': 'dataurl' },
    logLevel: 'silent',
    plugins: [
      ...(mutate ? [revertFixPlugin] : []),
      ...(mutateTribute ? [revertTributeFixPlugin] : []),
      {
        name: 'stub-import-meta-glob-modules',
        setup(build) {
          build.onResolve({ filter: /audio\/muzyka-antyczna$/ }, () => ({ path: stubs.music }));
          build.onResolve({ filter: /leaderPortraits$/ }, () => ({ path: stubs.leaderPortraits }));
          build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: stubs.brandAssets }));
        },
      },
    ],
  });
}

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[traktat-handlowy-wybor-czasu] domyslny Chromium niedostepny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

/** Stan audiencji: obie akcje na liście + JEDEN wiersz stołu dla dowodu (D1). */
function pageBootstrap() {
  window.__lastAction = null;
  const mkAction = (id, label) => ({ id, label, enabled: true });
  window.__openAudience = (pendingActionId) => {
    document.querySelectorAll('.civ-diplo-basket-overlay,.civ-diplo-neg-overlay').forEach(n => n.remove());
    window.__lastAction = null;
    window.showDiplomacyAudience({
      ownerId: 1,
      getState: () => ({
        playerTitle: 'Wodzu', playerCivName: 'Rzym',
        otherTitle: 'Krolu', otherCivName: 'Grecja',
        zaufanie: 70, respekt: 60, relacjaTotal: 130, tier: 2, layer: 'full',
        contactEstablished: true, playerSkarbiec: 500,
        actions: [
          mkAction('5', 'Traktat handlowy'),
          mkAction('2', 'Pakt nieagresji'),
          mkAction('3', 'Sojusz'),
          mkAction('8', 'Trybut'),
        ],
        activeTreaties: [],
        pendingNegotiations: pendingActionId
          ? [{
              id: 'row-' + pendingActionId,
              uiActionId: pendingActionId,
              actionLabel: pendingActionId === '5' ? 'Traktat handlowy' : 'Pakt nieagresji',
              direction: 'own',
              round: 1,
              maxRounds: 3,
              /* main.ts:15447 -> entry.expiresTurn - turn; NEGOTIATION_EXPIRY_TURNS = 5 */
              expiresInTurns: 5,
              summary: pendingActionId === '5' ? 'Traktat handlowy' : 'Pakt nieagresji',
              dealDetails: '',
            }]
          : [],
      }),
      getNegotiationContext: () => ({
        civName: 'Grecja',
        relacjaTotal: 130,
        trustPnGainedThisTurn: 0,
        playerSkarbiec: 500,
        borderFeeCivil: 20,
        borderFeeMilitary: 40,
        rivalOptions: [],
        techOptions: [],
        giveTechOptions: [],
        receiveTechOptions: [],
        resourceOptions: [],
        cityOptions: [],
        receiveCityOptions: [],
      }),
      previewNegotiation: () => ({ accepted: true }),
      onAction: (ownerId, actionId, payload) => {
        window.__lastAction = { ownerId, actionId, payload: payload ?? null };
      },
      onBack: () => {},
    });
  };
  /* (L) Stol z PRZYCHODZACA propozycja AI + prefill `counterInitial` DOKLADNIE takim, jaki
   * zwraca wyciety ze zrodla blok `main.ts`. Klik w karte otwiera openCounterNegotiationModal. */
  window.__lastCounter = null;
  window.__openAudienceIncoming = (row) => {
    document.querySelectorAll('.civ-diplo-basket-overlay,.civ-diplo-neg-overlay').forEach(n => n.remove());
    window.__lastCounter = null;
    window.showDiplomacyAudience({
      ownerId: 1,
      getState: () => ({
        playerTitle: 'Wodzu', playerCivName: 'Rzym',
        otherTitle: 'Krolu', otherCivName: 'Grecja',
        zaufanie: 70, respekt: 60, relacjaTotal: 130, tier: 2, layer: 'full',
        contactEstablished: true, playerSkarbiec: 500,
        actions: [{ id: '5', label: 'Traktat handlowy', enabled: true }],
        activeTreaties: [],
        pendingNegotiations: [row],
      }),
      getNegotiationContext: () => ({
        civName: 'Grecja', relacjaTotal: 130, trustPnGainedThisTurn: 0, playerSkarbiec: 500,
        borderFeeCivil: 20, borderFeeMilitary: 40,
        rivalOptions: [], techOptions: [], giveTechOptions: [], receiveTechOptions: [],
        resourceOptions: [], cityOptions: [], receiveCityOptions: [],
      }),
      previewNegotiation: () => ({ accepted: true }),
      onAction: (ownerId, actionId, payload) => {
        window.__lastAction = { ownerId, actionId, payload: payload ?? null };
      },
      onCounterNegotiation: (id, payload) => { window.__lastCounter = { id, payload }; },
      onBack: () => {},
    });
  };
  window.__clickNegotCard = () => {
    const card = document.querySelector('.da-negot-linked[data-negot-editable="1"]');
    if (!card) return false;
    card.click();
    return true;
  };
  /* (K) REALNA sciezka gry: payload z UI -> main.ts::buildProposalFromPayload (wyciety
   * doslownie ze zrodla) -> zywy evaluateProposal. `mutant` = wariant sprzed tej Obrony. */
  window.__realPathDeal = (payload, mutant) => {
    const build = mutant ? window.__buildProposalFromPayloadMut : window.__buildProposalFromPayload;
    const built = build(1, payload);
    const res = window.evaluateProposal(built.proposal, {
      turn: 100, relation: { zaufanie: 95, respekt: 95 }, stanWojny: false, difficulty: 'normal',
    });
    return {
      actionId: built.proposal.actionId,
      uiPayload: built.proposal.payload,
      accepted: res.accepted,
      wygasaTura: res.deal ? res.deal.wygasaTura : undefined,
    };
  };
  window.__clickAction = (aid) => {
    const btn = document.querySelector('button[data-aid="' + aid + '"]');
    if (!btn) return false;
    btn.click();
    return true;
  };
  window.__basketOpen = () => document.querySelector('.civ-diplo-basket-overlay') !== null;
  window.__turnUi = () => {
    const box = document.querySelector('.civ-diplo-basket');
    if (!box) return null;
    const label = box.querySelector('label[for="cdb-treaty-turns"]');
    const input = box.querySelector('.cdb-treaty-turns');
    const chips = Array.from(box.querySelectorAll('.cdb-treaty .cdb-chip-turn'))
      .map(c => c.getAttribute('data-turns'));
    return {
      label: label ? label.textContent : null,
      hasInput: !!input,
      inputValue: input ? input.value : null,
      inputMin: input ? input.getAttribute('min') : null,
      inputMax: input ? input.getAttribute('max') : null,
      chips,
      text: box.textContent,
    };
  };
  window.__pickTurnChip = (turns) => {
    const box = document.querySelector('.civ-diplo-basket');
    const chip = Array.from(box.querySelectorAll('.cdb-treaty .cdb-chip-turn'))
      .find(c => c.getAttribute('data-turns') === String(turns));
    if (!chip) return false;
    chip.click();
    return true;
  };
  window.__submitBasket = () => {
    const box = document.querySelector('.civ-diplo-basket');
    const btn = Array.from(box.querySelectorAll('button'))
      .find(b => !b.disabled && /Zaproponuj|Wyślij|Zapisz|Przekaż/i.test(b.textContent || ''));
    if (!btn) return false;
    btn.click();
    return true;
  };
  window.__tableExpiryTexts = () => Array.from(document.querySelectorAll('.da-meta'))
    .map(n => (n.textContent || '').trim())
    .filter(t => t.indexOf('wygasa') >= 0);

  /* R-DYPLO-TRAKTAT-HANDLOWY-WYBOR-CZASU-Q1 (Operator, obrona runda 1, zarzut 2 Evaluatora):
   * scenariusz z koszykiem — dodaje surowiec_ilosc (Drewno) po stronie „give" w trybie
   * „Co turę", żeby wystawić DRUGIE pole czasu („Co ile tur trwa wymiana") obok „Czas
   * traktatu handlowego" i sprawdzić, które z nich faktycznie trafia do silnika. */
  window.__addQtyResourceGive = () => {
    const box = document.querySelector('.civ-diplo-basket');
    if (!box) return false;
    const typChip = box.querySelector('.cdb-chip-typ[data-side="give"][data-value="surowiec_ilosc"]');
    if (!typChip) return false;
    typChip.click();
    const addBtn = box.querySelector('.cdb-add-btn[data-side="give"]');
    if (!addBtn) return false;
    addBtn.click();
    return true;
  };
  window.__pickPerTurnMode = () => {
    const box = document.querySelector('.civ-diplo-basket');
    const chip = box && box.querySelector('.cdb-chip-mode[data-value="per_turn"]');
    if (!chip) return false;
    chip.click();
    return true;
  };
  window.__setDealTurns = (n) => {
    const inp = document.querySelector('.cdb-deal-turns');
    if (!inp) return false;
    inp.value = String(n);
    inp.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  };
  window.__setTreatyTurnsInput = (n) => {
    const inp = document.querySelector('.cdb-treaty-turns');
    if (!inp) return false;
    inp.value = String(n);
    inp.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  };
  /* R-DYPLO-TRAKTAT-HANDLOWY-WYBOR-CZASU-Q1 (Obrona runda 1, zarzut 2 drugiego przebiegu
   * Evaluatora): REALNY klik chipa w KONKRETNEJ sekcji modala — nie programowe ustawienie
   * `inp.value`. `.cdb-treaty` = „Warunki traktatu", `.cdb-duration` z polem
   * `.cdb-deal-turns` = „Co ile tur trwa wymiana". Zwraca `false`, gdy chipa nie ma. */
  window.__dealSectionRoot = () => {
    const box = document.querySelector('.civ-diplo-basket');
    if (!box) return null;
    return Array.from(box.querySelectorAll('.cdb-duration'))
      .find(d => d.querySelector('.cdb-deal-turns')) || null;
  };
  window.__clickChipInSection = (section, turns) => {
    const box = document.querySelector('.civ-diplo-basket');
    if (!box) return false;
    const root = section === 'treaty' ? box.querySelector('.cdb-treaty') : window.__dealSectionRoot();
    if (!root) return false;
    const chip = Array.from(root.querySelectorAll('.cdb-chip-turn'))
      .find(c => c.getAttribute('data-turns') === String(turns));
    if (!chip) return false;
    chip.click();
    return true;
  };
  window.__chipDataTurns = (section) => {
    const box = document.querySelector('.civ-diplo-basket');
    if (!box) return null;
    const root = section === 'treaty' ? box.querySelector('.cdb-treaty') : window.__dealSectionRoot();
    if (!root) return null;
    return Array.from(root.querySelectorAll('.cdb-chip-turn')).map(c => c.getAttribute('data-turns'));
  };
  /* Oba pola czasu naraz — dowod „klik w sekcji A nie rusza pola sekcji B". */
  window.__bothTurnInputs = () => {
    const box = document.querySelector('.civ-diplo-basket');
    if (!box) return null;
    const treaty = box.querySelector('.cdb-treaty-turns');
    const deal = box.querySelector('.cdb-deal-turns');
    return {
      treaty: treaty ? treaty.value : null,
      deal: deal ? deal.value : null,
    };
  };
  /* (M) Formularz TRYBUTU (aid '8') — pola „Czas (tur, 0 = bezterminowy)" i „Kwota ¤/turę".
   * Zarzut 1 piatego przebiegu Evaluatora: domyslne 0 w polu czasu bylo wysylane jako
   * `treatyTurns: 0` i czytane przez `treatyDurationPnMultiplier` jako kod „bezterminowy" (x8). */
  window.__tributeUi = () => {
    const box = document.querySelector('.civ-diplo-basket');
    if (!box) return null;
    const turnsInp = box.querySelector('.cdb-treaty-trib-turns');
    const gptInp = box.querySelector('.cdb-treaty-gpt');
    const modeSel = box.querySelector('.cdb-treaty-trib-mode');
    return {
      hasTurns: !!turnsInp,
      turnsValue: turnsInp ? turnsInp.value : null,
      turnsMin: turnsInp ? turnsInp.getAttribute('min') : null,
      goldValue: gptInp ? gptInp.value : null,
      mode: modeSel ? modeSel.value : null,
      text: box.textContent,
    };
  };
  window.__setTributeTurns = (n) => {
    const inp = document.querySelector('.cdb-treaty-trib-turns');
    if (!inp) return false;
    inp.value = String(n);
    inp.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  };
  window.__dealTurnsUi = () => {
    const box = document.querySelector('.civ-diplo-basket');
    if (!box) return null;
    const inp = box.querySelector('.cdb-deal-turns');
    const modeVisible = !!box.querySelector('.cdb-chip-mode');
    const dealLabelEl = Array.from(box.querySelectorAll('label')).find(l => /Co ile tur trwa wymiana|Czas umowy/.test(l.textContent || ''));
    return {
      hasDealInput: !!inp,
      dealInputValue: inp ? inp.value : null,
      modeVisible,
      dealLabel: dealLabelEl ? dealLabelEl.textContent : null,
    };
  };
}

/** Silnik — ŻYWE wywołanie evaluateProposal (nie odczyt kodu). */
function engineEval(actionId, turns) {
  const proposal = {
    actionId,
    proposerOwnerId: 0,
    responderOwnerId: 1,
    payload: turns === null ? { actionId: 'x' } : { actionId: 'x', turns },
  };
  const ctx = {
    turn: 100,
    relation: { zaufanie: 95, respekt: 95 },
    stanWojny: false,
    difficulty: 'normal',
  };
  const res = window.evaluateProposal(proposal, ctx);
  return {
    accepted: res.accepted,
    reason: res.reason,
    wygasaTura: res.deal ? res.deal.wygasaTura : undefined,
    rodzaj: res.deal ? res.deal.rodzaj : undefined,
  };
}

async function main() {
  writeStubs();
  writeMainPathModules();
  fs.writeFileSync(ENTRY, [
    "import { showDiplomacyAudience } from '../src/ui/diplomacyAudience.ts';",
    /* (K)/(L) — REALNA sciezka main.ts, wycieta doslownie ze zrodla (patrz
     * writeMainPathModules) + jej wariant zmutowany do stanu sprzed tej Obrony. */
    "import { buildProposalFromPayload as __bpfp, counterInitialFromMain as __cifm } from './.dthc-mainpath.ts';",
    "import { buildProposalFromPayload as __bpfpMut, counterInitialFromMain as __cifmMut } from './.dthc-mainpath-mut.ts';",
    'window.__buildProposalFromPayload = __bpfp;',
    'window.__buildProposalFromPayloadMut = __bpfpMut;',
    'window.__counterInitialFromMain = __cifm;',
    'window.__counterInitialFromMainMut = __cifmMut;',
    "import { evaluateProposal, clampDealTurns, NEGOTIATION_EXPIRY_TURNS,",
    "  treatyDurationPnMultiplier, treatyBasePnFromConfig } from '../src/game/diplomacy-proposals.ts';",
    /* (M) Choke-pointy WYSWIETLANEJ bazy PW traktatu — te same, ktore zasilaja panel
     * „MY ODDAJEMY … PW (baza …)" oraz prognoze „Partner prawdopodobnie przyjmie/odrzuci"
     * na stole negocjacji (`computePlayerAcceptanceSides` -> `treatyBaseAcceptancePn` ->
     * `treatyDurationPnMultiplier`). */
    'window.treatyDurationPnMultiplier = treatyDurationPnMultiplier;',
    'window.treatyBasePnFromConfig = treatyBasePnFromConfig;',
    "import { treatyBaseAcceptancePn, computePlayerAcceptanceSides }",
    "  from '../src/game/diplomacy-acceptance-points.ts';",
    'window.treatyBaseAcceptancePn = treatyBaseAcceptancePn;',
    'window.computePlayerAcceptanceSides = computePlayerAcceptanceSides;',
    "import { resolveProposalPn, proposalPnTurnsMultiplier } from '../src/game/diplomacy-pn-engine.ts';",
    'window.showDiplomacyAudience = showDiplomacyAudience;',
    'window.evaluateProposal = evaluateProposal;',
    'window.clampDealTurns = clampDealTurns;',
    'window.NEGOTIATION_EXPIRY_TURNS = NEGOTIATION_EXPIRY_TURNS;',
    'window.resolveProposalPn = resolveProposalPn;',
    'window.proposalPnTurnsMultiplier = proposalPnTurnsMultiplier;',
    /* Wycena PN payloadu DOKLADNIE ta sama sciezka co silnik (diplomacy-proposals.ts:948
     * -> resolveProposalPn + proposalPnTurnsMultiplier) — uzywana w sekcji (H)/(I). */
    'window.__resolvedPn = (payload) => resolveProposalPn(payload, {',
    "  difficulty: 'normal', proposerOwnerId: 0, playerOwnerId: 0,",
    '  ...proposalPnTurnsMultiplier(payload),',
    '});',
    '',
  ].join('\n'), 'utf8');

  await buildBundle(BUNDLE_PO, false, false);
  await buildBundle(BUNDLE_PRZED, true, false);
  await buildBundle(BUNDLE_TRIB_PRZED, false, true);
  check('(0) mutacja PRZED faktycznie przywrocila bypass `turns: 20` (test nie jest tautologiczny)',
    mutation.applied === 1, mutation.applied);
  check('(0b) mutacja (M) faktycznie przywrocila bezwarunkowe `payload.treatyTurns = '
    + 'state.tributeTurns` w case \'8\' — kontrola nietautologiczna zarzutu 1 (piaty przebieg '
    + 'Evaluatora) jest osadzona dokladnie raz',
    tributeMutation.applied === 1, tributeMutation.applied);
  if (tributeMutation.applied !== 1) {
    console.log('\nPRZERWANE: nie udalo sie odtworzyc stanu sprzed poprawki trybutu — kod sie przesunal.');
    cleanup();
    process.exit(1);
  }
  if (mutation.applied !== 1) {
    console.log('\nPRZERWANE: nie udalo sie odtworzyc stanu sprzed poprawki — kod sie przesunal.');
    cleanup();
    process.exit(1);
  }

  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));

  const blank = '<!DOCTYPE html><html><head><meta charset="utf-8"><style>'
    + '*{box-sizing:border-box}html,body{margin:0;padding:0;background:#0b0d12;height:100%;width:100%;}'
    + '</style></head><body></body></html>';

  try {
    // ================= (D1) DIAGNOZA: skad „wygasa za 5 tur" =================
    console.log('\n--- (D1) KROK 1: zrodlo liczby 5 ze zrzutu wlasciciela ---');
    await page.setContent(blank);
    await page.addScriptTag({ path: BUNDLE_PO });
    await page.evaluate(pageBootstrap);

    const expiryConst = await page.evaluate(() => window.NEGOTIATION_EXPIRY_TURNS);
    check('(D1a) NEGOTIATION_EXPIRY_TURNS === 5 (waznosc propozycji na stole, nie czas traktatu)',
      expiryConst === 5, expiryConst);

    await page.evaluate(() => window.__openAudience('5'));
    const expiry5 = await page.evaluate(() => window.__tableExpiryTexts());
    await page.evaluate(() => window.__openAudience('2'));
    const expiry2 = await page.evaluate(() => window.__tableExpiryTexts());
    // R-DYPLO-TRAKTAT-HANDLOWY-WYBOR-CZASU-Q1 (Operator, obrona runda 1, zarzut 3 Evaluatora,
    // PRZYJETY): ten check jest TAUTOLOGICZNY wobec ZYWEGO zachowania silnika — `pageBootstrap`
    // (window.__openAudience) sam wpisuje `expiresInTurns: 5` w zwracany `getState()`, wiec
    // wyrenderowane „wygasa za 5 tur" dowodzi WYLACZNIE, ze renderer stolu (main.ts) pokazuje
    // wprost to, co dostal w danych wejsciowych — NIE dowodzi, ze silnik faktycznie WYLICZA 5
    // z NEGOTIATION_EXPIRY_TURNS dla obu akcji identycznie. Ten check zostaje jako regres UI
    // (test.ze renderer traktuje '5' i '2' symetrycznie), ale NIE jest dowodem zrodla liczby —
    // dowodem nietautologicznym jest WYLACZNIE (D1a) (zywy odczyt stalej NEGOTIATION_EXPIRY_TURNS
    // z zaimportowanego modulu silnika) + statyczny odczyt kodu: main.ts:15447
    // `expiresInTurns = entry.expiresTurn - turn` i diplomacy-proposals.ts:2110
    // `expiresTurn = turn + NEGOTIATION_EXPIRY_TURNS` — ta sama stala dla KAZDEJ nierozstrzygnietej
    // propozycji, niezaleznie od actionId.
    check('(D1b, PRZEETYKIETOWANE — regres UI, NIE dowod zrodla liczby 5) renderer stolu pokazuje '
      + '„wygasa za 5 tur" identycznie dla obu akcji, gdy DANE WEJSCIOWE (bootstrap testu) juz '
      + 'mowia expiresInTurns:5 dla obu — symetria renderowania, nie zywa kalkulacja silnika',
      expiry5.length > 0 && expiry5.some(t => /wygasa za 5 tur/.test(t))
      && expiry2.length > 0 && expiry2.some(t => /wygasa za 5 tur/.test(t)),
      { expiry5, expiry2 });
    await page.evaluate(() => window.__openAudience('5'));
    await shot(page, '00-diagnoza-stol-wygasa-za-5-tur.png');

    // ================= (A) PRZED poprawka =================
    console.log('\n--- (A) PRZED poprawka (mutacja: przywrocony bypass) ---');
    await page.setContent(blank);
    await page.addScriptTag({ path: BUNDLE_PRZED });
    await page.evaluate(pageBootstrap);
    await page.evaluate(() => window.__openAudience(null));
    await shot(page, '01-przed-audiencja-przed-klikiem.png');

    const przedClicked = await page.evaluate(() => window.__clickAction('5'));
    const przedOpen = await page.evaluate(() => window.__basketOpen());
    const przedAction = await page.evaluate(() => window.__lastAction);
    check('(A1) PRZED: klik „Traktat handlowy" NIE otwiera zadnego modala (bypass)',
      przedClicked === true && przedOpen === false, { przedClicked, przedOpen });
    check('(A2) PRZED: propozycja ladu na stole z ZAHARDKODOWANYM turns=20, bez wyboru gracza',
      przedAction && przedAction.actionId === '5' && przedAction.payload
      && przedAction.payload.turns === 20, przedAction);
    await shot(page, '02-przed-po-kliku-brak-modala.png');

    // ================= (B) PO poprawce =================
    console.log('\n--- (B) PO poprawce (kod biezacy) ---');
    await page.setContent(blank);
    await page.addScriptTag({ path: BUNDLE_PO });
    await page.evaluate(pageBootstrap);
    await page.evaluate(() => window.__openAudience(null));

    const poClicked = await page.evaluate(() => window.__clickAction('5'));
    const poOpen = await page.evaluate(() => window.__basketOpen());
    check('(B1) PO: klik „Traktat handlowy" otwiera modal (ten sam koszyk-traktat co pakt nieagresji)',
      poClicked === true && poOpen === true, { poClicked, poOpen });

    const ui5 = await page.evaluate(() => window.__turnUi());
    await shot(page, '03-po-modal-traktat-handlowy-wybor-czasu.png');
    check('(B2) PO: modal ma etykiete czasu traktatu handlowego',
      !!ui5 && /Czas traktatu handlowego/.test(ui5.label || ''), ui5 && ui5.label);
    check('(B3) PO: chipy szybkiego wyboru 10 / 15 / 20',
      !!ui5 && ['10', '15', '20'].every(t => ui5.chips.indexOf(t) >= 0), ui5 && ui5.chips);
    check('(B4) PO: pole reczne 1–20 tur (widelki silnika clampDealTurns dla wartosci >0), '
      + 'min=0 (stepper dopuszcza zejscie do bezterminowego), domyslnie 20 (dawna wartosc '
      + 'zahardkodowana zostaje DOMYSLNA, nie jedyna)',
      !!ui5 && ui5.hasInput === true && ui5.inputMin === '0' && ui5.inputMax === '20'
      && ui5.inputValue === '20', ui5);
    // R-DYPLO-TRAKTAT-HANDLOWY-WYBOR-CZASU-Q1 (Obrona runda 1, zarzut 1 Evaluatora PRZYJETY,
    // zywy dowod E5 nizej): silnik JUZ obsluguje bezterminowy umowa_szlakow (payload BEZ pola
    // turns -> wygasaTura===null) — wniosek rundy 1 „silnik go nie ma" byl bledny (mylil
    // turns:0, E3, z brakiem pola turns). Chip „Bezterminowy" jest wiec funkcjonalnie
    // uzasadniony i teraz obecny — patrz (G) nizej dla zywego dowodu end-to-end.
    check('(B5) PO (naprawione): chip „Bezterminowy" (data-turns=0) DLA TRAKTATU HANDLOWEGO '
      + 'JEST obecny — UI byl jedynym ograniczeniem, nie silnik',
      !!ui5 && ui5.chips.indexOf('0') >= 0 && /Bezterminowy/.test(ui5.text || ''), ui5 && ui5.chips);

    // Kryterium 3 — wybor 10 daje DOKLADNIE 10
    const picked = await page.evaluate(() => window.__pickTurnChip(10));
    await shot(page, '04-po-modal-wybrano-10-tur.png');
    const submitted = await page.evaluate(() => window.__submitBasket());
    const poAction = await page.evaluate(() => window.__lastAction);
    check('(B6) PO: wybor 10 tur w modalu daje propozycje z DOKLADNIE 10 turami traktatu (nie 20). '
      + 'Czas traktatu jedzie w polu `treatyTurns` (osobnym od `turns`, ktory nalezy do WYMIANY '
      + 'koszyka i do wyceny PN — patrz (H)); bez koszyka `turns` w ogole nie jest ustawiane.',
      picked === true && submitted === true && poAction && poAction.actionId === '5'
      && poAction.payload && poAction.payload.treatyTurns === 10
      && poAction.payload.turns === undefined, { picked, submitted, poAction });
    const b7Engine = await page.evaluate((payload) => {
      const proposal = { actionId: 'umowa_szlakow', proposerOwnerId: 0, responderOwnerId: 1, payload };
      const ctx = { turn: 100, relation: { zaufanie: 95, respekt: 95 }, stanWojny: false, difficulty: 'normal' };
      const res = window.evaluateProposal(proposal, ctx);
      return { accepted: res.accepted, wygasaTura: res.deal ? res.deal.wygasaTura : undefined };
    }, poAction.payload);
    check('(B7) ZYWY dowod end-to-end: DOKLADNIE ten payload podany do zywego evaluateProposal() '
      + 'daje wygasaTura === 110 (tura 100 + 10 tur traktatu) — wybor gracza dociera do silnika',
      b7Engine.accepted === true && b7Engine.wygasaTura === 110, b7Engine);
    /* Zrzut 05 — audiencja PO zamknieciu modala + realny payload, ktory poszedl do SILNIKA,
     * wyrenderowany na stronie (nie przepisany z raportu). Kryterium 3 „dokladnie ta liczba tur". */
    await page.evaluate(() => {
      const p = document.createElement('div');
      p.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:9999;padding:10px 14px;'
        + 'background:#101820;border:2px solid #e8d88a;border-radius:8px;color:#e8d88a;'
        + "font:14px 'Segoe UI',Tahoma,sans-serif;max-width:900px";
      p.id = 'dthc-payload-probe';
      p.textContent = 'onAction -> SILNIK: ' + JSON.stringify(window.__lastAction);
      document.body.appendChild(p);
    });
    await shot(page, '05-po-payload-do-silnika-turns-10.png');
    await page.evaluate(() => { document.getElementById('dthc-payload-probe')?.remove(); });

    // ================= (C) BRAK REGRESU pozostalych akcji =================
    console.log('\n--- (C) Brak regresu: pakt nieagresji / sojusz / trybut ---');
    await page.evaluate(() => window.__openAudience(null));
    await page.evaluate(() => window.__clickAction('2'));
    const uiNap = await page.evaluate(() => window.__turnUi());
    await shot(page, '06-po-brak-regresu-pakt-nieagresji.png');
    check('(C1) NAP („Czas paktu"): chipy 10/15/20 + „Bezterminowy" (0), pole 0–20 — bez zmian',
      !!uiNap && /Czas paktu/.test(uiNap.label || '')
      && ['10', '15', '20', '0'].every(t => uiNap.chips.indexOf(t) >= 0)
      && uiNap.inputMin === '0' && uiNap.inputMax === '20', uiNap);

    const napPicked = await page.evaluate(() => window.__pickTurnChip(0));
    const napSubmitted = await page.evaluate(() => window.__submitBasket());
    const napAction = await page.evaluate(() => window.__lastAction);
    check('(C2) NAP: „Bezterminowy" nadal daje payload turns=0 — bez zmian; dodatkowo treatyTurns=0 '
      + '(nowe pole czasu traktatu, ktore silnik czyta z pierwszenstwem)',
      napPicked === true && napSubmitted === true && napAction
      && napAction.actionId === '2' && napAction.payload.turns === 0
      && napAction.payload.treatyTurns === 0,
      { napPicked, napSubmitted, napAction });
    const napEngine = await page.evaluate((payload) => {
      const proposal = { actionId: 'nap', proposerOwnerId: 0, responderOwnerId: 1, payload };
      const ctx = { turn: 100, relation: { zaufanie: 95, respekt: 95 }, stanWojny: false, difficulty: 'normal' };
      const res = window.evaluateProposal(proposal, ctx);
      return { accepted: res.accepted, wygasaTura: res.deal ? res.deal.wygasaTura : undefined };
    }, napAction.payload);
    check('(C2b) NAP bez regresu w SILNIKU: ten sam payload przez zywe evaluateProposal() daje '
      + 'wygasaTura === null (bezterminowy pakt) — nowe pole nie zmienilo zachowania NAP',
      napEngine.accepted === true && napEngine.wygasaTura === null, napEngine);

    await page.evaluate(() => window.__openAudience(null));
    await page.evaluate(() => window.__clickAction('3'));
    const sojuszOpen = await page.evaluate(() => window.__basketOpen());
    const sojuszTxt = await page.evaluate(() => {
      const b = document.querySelector('.civ-diplo-basket');
      return b ? b.textContent : '';
    });
    check('(C3) Sojusz (aid 3): modal otwarty, formularz „Typ sojuszu" bez pola czasu — bez zmian',
      sojuszOpen === true && /Typ sojuszu/.test(sojuszTxt)
      && !/Czas traktatu handlowego/.test(sojuszTxt), { sojuszOpen });

    await page.evaluate(() => window.__openAudience(null));
    await page.evaluate(() => window.__clickAction('8'));
    const trybutTxt = await page.evaluate(() => {
      const b = document.querySelector('.civ-diplo-basket');
      return b ? b.textContent : '';
    });
    check('(C4) Trybut (aid 8): wlasny formularz („Kwota ¤/turę") — bez zmian',
      /Kwota/.test(trybutTxt) && /turę/.test(trybutTxt), trybutTxt.slice(0, 80));

    // ================= (E) SILNIK — zywe wywolania =================
    console.log('\n--- (E) Silnik: evaluateProposal (zywe wywolanie, nie odczyt kodu) ---');
    const eng10 = await page.evaluate(([fn, a, t]) => eval('(' + fn + ')')(a, t),
      [engineEval.toString(), 'umowa_szlakow', 10]);
    check('(E1) turns=10 => traktat handlowy wygasa dokladnie w turze 110 (tura 100 + 10)',
      eng10.accepted === true && eng10.wygasaTura === 110, eng10);

    const eng1 = await page.evaluate(([fn, a, t]) => eval('(' + fn + ')')(a, t),
      [engineEval.toString(), 'umowa_szlakow', 1]);
    check('(E2) turns=1 => wygasaTura = 101 (dolny brzeg widelek 1–20)',
      eng1.accepted === true && eng1.wygasaTura === 101, eng1);

    const eng0 = await page.evaluate(([fn, a, t]) => eval('(' + fn + ')')(a, t),
      [engineEval.toString(), 'umowa_szlakow', 0]);
    check('(E3) SCIEZKA HISTORYCZNA (payload bez `treatyTurns`, np. z AI): turns=0 dla traktatu '
      + 'handlowego NIE daje bezterminowego — clampDealTurns 1–20 zwraca wygasaTura=101, czyli 1 ture. '
      + 'Dlatego UI NIE wysyla „Bezterminowy" jako turns:0, tylko jako treatyTurns:0 (patrz E6/G2).',
      eng0.accepted === true && eng0.wygasaTura === 101, eng0);

    const engNap0 = await page.evaluate(([fn, a, t]) => eval('(' + fn + ')')(a, t),
      [engineEval.toString(), 'nap', 0]);
    check('(E4) Kontrola: dla PAKTU NIEAGRESJI turns=0 daje wygasaTura === null (bezterminowy) — '
      + 'roznica zakresow jest wlasciwoscia silnika, nie UI',
      engNap0.accepted === true && engNap0.wygasaTura === null, engNap0);

    // R-DYPLO-TRAKTAT-HANDLOWY-WYBOR-CZASU-Q1 (Operator, obrona runda 1) — Evaluator
    // zarzut 1: silnik NIE ma bezterminowego wariantu? Sprawdzone ZYWO z payload.turns
    // POMINIETYM (nie turns:0) — dokladnie jak robi to chip „Bezterminowy" dla NAP.
    const eng5NoTurns = await page.evaluate(([fn, a, t]) => eval('(' + fn + ')')(a, t),
      [engineEval.toString(), 'umowa_szlakow', null]);
    check('(E5) Zarzut 1 Evaluatora: umowa_szlakow BEZ pola turns w payloadzie (nie turns:0) '
      + '-> silnik JUZ akceptuje i deal.wygasaTura === null (bezterminowy) — diplomacy-proposals.ts:1325 '
      + '`payload.turns != null ? ... : null`. Rozroznienie: E3 (turns:0 -> wygasaTura=101) dowodzi '
      + 'tylko ze 0 != bezterminowy; E5 dowodzi ze OPCJA bezterminowa (turns pominiete) JEST w zakresie '
      + 'silnika. Operator PRZYJMUJE zarzut 1: wniosek "silnik nie ma tego wariantu" w rundzie 1 byl bledny.',
      eng5NoTurns.accepted === true && eng5NoTurns.wygasaTura === null, eng5NoTurns);

    /* E6/E7 — nowe pole `treatyTurns`: czas TRAKTATU ma pierwszenstwo przed `turns`
     * (ktore niesie czas WYMIANY koszyka i mnoznik wyceny PN). Zywe wywolania silnika. */
    const engSplit = await page.evaluate(() => {
      const ctx = { turn: 100, relation: { zaufanie: 95, respekt: 95 }, stanWojny: false, difficulty: 'normal' };
      const run = (payload) => {
        const res = window.evaluateProposal(
          { actionId: 'umowa_szlakow', proposerOwnerId: 0, responderOwnerId: 1, payload }, ctx,
        );
        return { accepted: res.accepted, wygasaTura: res.deal ? res.deal.wygasaTura : undefined };
      };
      return {
        split: run({ actionId: 'x', turns: 12, treatyTurns: 7 }),
        indefinite: run({ actionId: 'x', turns: 20, treatyTurns: 0 }),
        legacy: run({ actionId: 'x', turns: 12 }),
      };
    });
    check('(E6) SILNIK: payload {turns:12 (wymiana), treatyTurns:7 (traktat)} -> wygasaTura === 107 — '
      + 'czas traktatu wygrywa nad czasem wymiany, nie odwrotnie',
      engSplit.split.accepted === true && engSplit.split.wygasaTura === 107, engSplit.split);
    check('(E7) SILNIK: payload {turns:20 (wymiana), treatyTurns:0 („Bezterminowy")} -> wygasaTura === null — '
      + 'obecnosc czasu wymiany 20 NIE zamienia bezterminowego traktatu w 20-turowy',
      engSplit.indefinite.accepted === true && engSplit.indefinite.wygasaTura === null, engSplit.indefinite);
    check('(E8) SILNIK, brak regresu sciezki historycznej: payload BEZ `treatyTurns` (payloady AI) '
      + 'dalej liczy wygasniecie z `turns` — {turns:12} -> wygasaTura === 112',
      engSplit.legacy.accepted === true && engSplit.legacy.wygasaTura === 112, engSplit.legacy);

    // ================= (F) Zarzut 2 Evaluatora — koszyk z surowcem "Co ture" =================
    console.log('\n--- (F) Zarzut 2: czas TRAKTATU vs czas WYMIANY (koszyk) ---');
    await page.evaluate(() => window.__openAudience(null));
    await page.evaluate(() => window.__clickAction('5'));
    const fOpen = await page.evaluate(() => window.__basketOpen());
    check('(F0) modal traktatu handlowego otwarty', fOpen === true);

    const added = await page.evaluate(() => window.__addQtyResourceGive());
    check('(F1) dodano pozycje surowiec_ilosc (Drewno) po stronie "daje"', added === true);

    const perTurnPicked = await page.evaluate(() => window.__pickPerTurnMode());
    const dealUiAfterMode = await page.evaluate(() => window.__dealTurnsUi());
    check('(F2) tryb "Co ture" wybrany -> pojawia sie DRUGIE pole czasu ("Co ile tur trwa wymiana"), '
      + 'obok "Czas traktatu handlowego" z (B2)/(B4) — DWA ROZNE pola czasu w jednym modalu',
      perTurnPicked === true && dealUiAfterMode && dealUiAfterMode.hasDealInput === true
      && /Co ile tur trwa wymiana/.test(dealUiAfterMode.dealLabel || ''), dealUiAfterMode);

    // Gracz wybiera DWIE ROZNE wartosci: czas traktatu = 7, czas/czestotliwosc wymiany = 12.
    await page.evaluate(() => window.__setTreatyTurnsInput(7));
    await page.evaluate(() => window.__setDealTurns(12));
    const treatyUiBeforeSubmit = await page.evaluate(() => window.__turnUi());
    const dealUiBeforeSubmit = await page.evaluate(() => window.__dealTurnsUi());
    check('(F3) PRZED submitem: pole "Czas traktatu handlowego" pokazuje 7, pole "Co ile tur trwa '
      + 'wymiana" pokazuje 12 — gracz widzi i wybral OBA, rozne od siebie',
      treatyUiBeforeSubmit && treatyUiBeforeSubmit.inputValue === '7'
      && dealUiBeforeSubmit && dealUiBeforeSubmit.dealInputValue === '12',
      { treatyUiBeforeSubmit, dealUiBeforeSubmit });

    const fSubmitted = await page.evaluate(() => window.__submitBasket());
    const fAction = await page.evaluate(() => window.__lastAction);
    await shot(page, '07-po-koszyk-czas-traktatu-vs-czas-wymiany.png');
    check('(F4) OBIE wielkosci docieraja do silnika, KAZDA we wlasnym polu: treatyTurns === 7 '
      + '(czas TRAKTATU z pola „Czas traktatu handlowego") ORAZ turns === 12 (czas/czestotliwosc '
      + 'WYMIANY z koszyka „Co ile tur trwa wymiana"). Pierwsza Obrona wpisywala 7 do `turns` — to '
      + 'naprawialo wygasniecie traktatu, ale sprzegalo z nim WYCENE PN slodzika (zarzut 1 drugiego '
      + 'przebiegu Evaluatora), bo `turns` jest mnoznikiem `proposalPnTurnsMultiplier`. Rozdzielenie '
      + 'pol naprawia oba skutki naraz — dowod wyceny w sekcji (H).',
      fSubmitted === true && fAction && fAction.actionId === '5' && fAction.payload
      && fAction.payload.treatyTurns === 7 && fAction.payload.turns === 12,
      fAction);
    if (fSubmitted === true && fAction && fAction.payload) {
      check('(F4b) payload.resourceTradeMode nadal === "per_turn" — informacja o trybie wymiany '
        + 'co-N-tur dalej dociera do silnika',
        fAction.payload.resourceTradeMode === 'per_turn', fAction.payload);
      const fEngine = await page.evaluate((payload) => {
        const proposal = { actionId: 'umowa_szlakow', proposerOwnerId: 0, responderOwnerId: 1, payload };
        const ctx = { turn: 100, relation: { zaufanie: 95, respekt: 95 }, stanWojny: false, difficulty: 'normal' };
        const res = window.evaluateProposal(proposal, ctx);
        return { accepted: res.accepted, wygasaTura: res.deal ? res.deal.wygasaTura : undefined };
      }, fAction.payload);
      check('(F4c) ZYWY dowod end-to-end: ten sam payload w evaluateProposal() daje wygasaTura === 107 '
        + '(tura 100 + 7 tur TRAKTATU), a nie 112 (czas wymiany) — wybor gracza nie ginie',
        fEngine.accepted === true && fEngine.wygasaTura === 107, fEngine);
    }

    // ================= (G) Zarzut 1 Evaluatora — chip „Bezterminowy" (naprawiony, end-to-end) ===
    console.log('\n--- (G) Zarzut 1: chip "Bezterminowy" dla traktatu handlowego, zywo end-to-end ---');
    await page.evaluate(() => window.__openAudience(null));
    await page.evaluate(() => window.__clickAction('5'));
    const gOpen = await page.evaluate(() => window.__basketOpen());
    check('(G0) modal traktatu handlowego otwarty', gOpen === true);

    const gPicked = await page.evaluate(() => window.__pickTurnChip(0));
    const gUi = await page.evaluate(() => window.__turnUi());
    check('(G1) chip „Bezterminowy" zaznaczony, pole czasu traktatu = 0',
      gPicked === true && !!gUi && gUi.inputValue === '0', gUi);

    const gSubmitted = await page.evaluate(() => window.__submitBasket());
    const gAction = await page.evaluate(() => window.__lastAction);
    check('(G2) Bezterminowy traktat handlowy: payload ma treatyTurns === 0 (jednoznaczny marker '
      + 'bezterminowosci czytany przez silnik) i NIE MA pola `turns` (brak koszyka = brak czasu '
      + 'wymiany) — NIE `turns: 0`, ktore dalaby 1 ture wg E3',
      gSubmitted === true && gAction && gAction.actionId === '5' && gAction.payload
      && gAction.payload.treatyTurns === 0
      && !Object.prototype.hasOwnProperty.call(gAction.payload, 'turns'),
      gAction);

    if (gSubmitted === true && gAction && gAction.payload) {
      const gEngineRes = await page.evaluate((payload) => {
        const proposal = { actionId: 'umowa_szlakow', proposerOwnerId: 0, responderOwnerId: 1, payload };
        const ctx = { turn: 100, relation: { zaufanie: 95, respekt: 95 }, stanWojny: false, difficulty: 'normal' };
        const res = window.evaluateProposal(proposal, ctx);
        return { accepted: res.accepted, wygasaTura: res.deal ? res.deal.wygasaTura : undefined };
      }, gAction.payload);
      check('(G3) ZYWY dowod end-to-end: DOKLADNIE ten payload, ktory wyszedl z UI po kliknieciu '
        + 'chipa „Bezterminowy" i submicie, podany do zywego evaluateProposal() daje '
        + 'accepted===true i wygasaTura===null (traktat handlowy bez wygasniecia)',
        gEngineRes.accepted === true && gEngineRes.wygasaTura === null, gEngineRes);
    }

    // ===== (H) ZARZUT 1 (drugi przebieg Evaluatora): wycena PN vs czas TRAKTATU =====
    /* Evaluator zmierzyl zywo, ze po pierwszej Obronie wycena PN slodzika zaczela zalezec od
     * CZASU TRAKTATU (traktat=7/wymiana=12 -> 12 spadlo na 7; traktat=1/wymiana=20 -> 20 na 1;
     * traktat=20/wymiana=1 -> 1 na 20, czyli furtka przez bramke uczciwosci), mimo ze
     * `umowa_szlakow` transferuje koszyk JEDNORAZOWO, a `payload.turns` jest mnoznikiem
     * `proposalPnTurnsMultiplier`. Ponizej DOKLADNIE te 3 scenariusze Evaluatora + kontrola
     * stabilnosci: przy TYCH SAMYCH parametrach wymiany zmiana czasu traktatu NIE rusza wyceny. */
    console.log('\n--- (H) Wycena PN: stabilna wzgledem czasu TRAKTATU, zalezna od czasu WYMIANY ---');
    const scenario = async (treatyTurns, dealTurnsVal) => {
      await page.evaluate(() => window.__openAudience(null));
      await page.evaluate(() => window.__clickAction('5'));
      const added2 = await page.evaluate(() => window.__addQtyResourceGive());
      const mode2 = await page.evaluate(() => window.__pickPerTurnMode());
      await page.evaluate((t) => window.__setTreatyTurnsInput(t), treatyTurns);
      await page.evaluate((d) => window.__setDealTurns(d), dealTurnsVal);
      const ui2 = await page.evaluate(() => window.__bothTurnInputs());
      const ok2 = await page.evaluate(() => window.__submitBasket());
      const act2 = await page.evaluate(() => window.__lastAction);
      const payload = act2 && act2.payload ? act2.payload : null;
      if (!payload) return { added2, mode2, ui2, ok2, payload: null };
      const enginePn = await page.evaluate((p) => window.__resolvedPn(p), payload);
      const mult = await page.evaluate((p) => window.proposalPnTurnsMultiplier(p), payload);
      const engine = await page.evaluate((p) => {
        const res = window.evaluateProposal(
          { actionId: 'umowa_szlakow', proposerOwnerId: 0, responderOwnerId: 1, payload: p },
          { turn: 100, relation: { zaufanie: 95, respekt: 95 }, stanWojny: false, difficulty: 'normal' },
        );
        return { accepted: res.accepted, wygasaTura: res.deal ? res.deal.wygasaTura : undefined };
      }, payload);
      return { added2, mode2, ui2, ok2, payload, enginePn, mult, engine };
    };

    const s7x12 = await scenario(7, 12);
    const s1x20 = await scenario(1, 20);
    const s20x1 = await scenario(20, 1);
    check('(H0) wszystkie 3 scenariusze Evaluatora dosly do submitu z widocznymi DWOMA polami czasu',
      [s7x12, s1x20, s20x1].every(s => s.ok2 === true && s.payload
        && s.ui2 && s.ui2.treaty !== null && s.ui2.deal !== null),
      [s7x12.ui2, s1x20.ui2, s20x1.ui2]);
    check('(H1) traktat=7 / wymiana=12: mnoznik wyceny PN === 12 (czas WYMIANY), a wygasniecie '
      + 'traktatu === tura 107 (czas TRAKTATU) — dwie wielkosci, dwa skutki',
      s7x12.mult && s7x12.mult.turnsMultiplier === 12 && s7x12.mult.perTurn === true
      && s7x12.engine.wygasaTura === 107,
      { mult: s7x12.mult, engine: s7x12.engine, payload: s7x12.payload });
    check('(H2) traktat=1 / wymiana=20: mnoznik wyceny PN === 20 (NIE 1 — Evaluator zmierzyl '
      + 'spadek wyceny o 95% po pierwszej Obronie)',
      s1x20.mult && s1x20.mult.turnsMultiplier === 20 && s1x20.engine.wygasaTura === 101,
      { mult: s1x20.mult, engine: s1x20.engine });
    check('(H3) traktat=20 / wymiana=1: mnoznik wyceny PN === 1 (NIE 20 — po pierwszej Obronie '
      + 'dlugi traktat zawyzal wycene o 1900%, furtka przez bramke uczciwosci)',
      s20x1.mult && s20x1.mult.turnsMultiplier === 1 && s20x1.engine.wygasaTura === 120,
      { mult: s20x1.mult, engine: s20x1.engine });

    /* Kontrola STABILNOSCI: te same parametry wymiany (12), trzy rozne czasy traktatu. */
    const stab7 = s7x12;
    const stab1 = await scenario(1, 12);
    const stab20 = await scenario(20, 12);
    check('(H4) STABILNOSC: przy TEJ SAMEJ wymianie (12 tur, „Co ture") wycena PN jest IDENTYCZNA '
      + 'dla czasu traktatu 7 / 1 / 20 — wycena nie zalezy juz od dlugosci traktatu (jak PRZED runda)',
      stab7.enginePn && stab1.enginePn && stab20.enginePn
      && stab7.enginePn.givePn === stab1.enginePn.givePn
      && stab7.enginePn.givePn === stab20.enginePn.givePn
      && stab7.enginePn.givePn > 0,
      { t7: stab7.enginePn, t1: stab1.enginePn, t20: stab20.enginePn });
    const stab7x6 = await scenario(7, 6);
    check('(H5) KONTROLA NIETAUTOLOGICZNOSCI: zmiana samego czasu WYMIANY (12 -> 6, ten sam traktat 7) '
      + 'JEDNAK zmienia wycene PN — test faktycznie mierzy wycene, a nie stala',
      stab7x6.enginePn && stab7x6.enginePn.givePn !== stab7.enginePn.givePn
      && stab7x6.mult.turnsMultiplier === 6,
      { pn6: stab7x6.enginePn, pn12: stab7.enginePn });
    check('(H6) ZGODNOSC PODGLAD vs SILNIK: `givePn` policzone przez UI do podgladu koszyka jest '
      + 'rowne `givePn` przeliczonemu przez silnik z tego samego payloadu — gracz widzi to, '
      + 'czym silnik ocenia oferte (dla wszystkich 3 scenariuszy Evaluatora)',
      [s7x12, s1x20, s20x1].every(s => s.payload && typeof s.payload.givePn === 'number'
        && s.enginePn && s.payload.givePn === s.enginePn.givePn),
      [s7x12.payload && s7x12.payload.givePn, s7x12.enginePn,
        s1x20.payload && s1x20.payload.givePn, s1x20.enginePn,
        s20x1.payload && s20x1.payload.givePn, s20x1.enginePn]);

    // ===== (I) „Bezterminowy" + wymiana 20 tur — rozbieznosc 20x zglaszana przez Evaluatora =====
    console.log('\n--- (I) „Bezterminowy" + wymiana 20 tur: podglad gracza vs wycena silnika ---');
    const sInf = await scenario(0, 20);
    check('(I1) „Bezterminowy" (treatyTurns=0) + wymiana 20: payload niesie OBA — treatyTurns===0 '
      + 'i turns===20; wygasaTura === null (traktat bez konca), mnoznik wyceny === 20 (czas wymiany)',
      sInf.payload && sInf.payload.treatyTurns === 0 && sInf.payload.turns === 20
      && sInf.engine.wygasaTura === null && sInf.mult.turnsMultiplier === 20,
      { payload: sInf.payload, engine: sInf.engine, mult: sInf.mult });
    check('(I2) BRAK ROZBIEZNOSCI 20x: `givePn` z podgladu koszyka === `givePn` przeliczone przez '
      + 'silnik przy akceptacji (przed ta poprawka silnik liczyl z pominietego `turns`, czyli x1, '
      + 'a gracz widzial x20)',
      sInf.payload && typeof sInf.payload.givePn === 'number' && sInf.enginePn
      && sInf.payload.givePn === sInf.enginePn.givePn && sInf.enginePn.givePn > 0,
      { podglad: sInf.payload && sInf.payload.givePn, silnik: sInf.enginePn });

    // ===== (J) ZARZUT 2: REALNY klik chipa — kazda sekcja pisze do WLASNEGO pola =====
    console.log('\n--- (J) Zarzut 2: klik chipa w sekcji A nie rusza pola sekcji B ---');
    await page.evaluate(() => window.__openAudience(null));
    await page.evaluate(() => window.__clickAction('5'));
    await page.evaluate(() => window.__addQtyResourceGive());
    await page.evaluate(() => window.__pickPerTurnMode());
    await page.evaluate(() => window.__setTreatyTurnsInput(15));
    await page.evaluate(() => window.__setDealTurns(12));
    const jStart = await page.evaluate(() => window.__bothTurnInputs());
    const jTreatyChips = await page.evaluate(() => window.__chipDataTurns('treaty'));
    const jDealChips = await page.evaluate(() => window.__chipDataTurns('deal'));
    check('(J0) modal ma DWIE niezalezne sekcje chipow czasu: „Warunki traktatu" (10/15/20/0) '
      + 'i „Co ile tur trwa wymiana" (5/10/15); stan wyjsciowy pol: traktat 15, wymiana 12',
      jStart && jStart.treaty === '15' && jStart.deal === '12'
      && Array.isArray(jTreatyChips) && jTreatyChips.indexOf('0') >= 0
      && Array.isArray(jDealChips) && jDealChips.indexOf('5') >= 0
      && jDealChips.indexOf('0') < 0,
      { jStart, jTreatyChips, jDealChips });

    /* J1 — DOKLADNIE zywy scenariusz Evaluatora: klik chipa „5" w sekcji WYMIANY. Przed poprawka
     * przestawial pole „Czas traktatu handlowego" (klamrowane do 10) i nie ruszal pola wymiany. */
    const j1Clicked = await page.evaluate(() => window.__clickChipInSection('deal', 5));
    const jAfterDeal = await page.evaluate(() => window.__bothTurnInputs());
    check('(J1) REALNY klik chipa „5" w sekcji „Co ile tur trwa wymiana": pole WYMIANY = 5, '
      + 'pole „Czas traktatu handlowego" NIETKNIETE (nadal 15) — przed poprawka traktat skakal na 10',
      j1Clicked === true && jAfterDeal && jAfterDeal.deal === '5' && jAfterDeal.treaty === '15',
      { j1Clicked, jAfterDeal });

    /* J2 — kierunek odwrotny: klik chipa w sekcji TRAKTATU nie rusza pola wymiany. */
    const j2Clicked = await page.evaluate(() => window.__clickChipInSection('treaty', 20));
    const jAfterTreaty = await page.evaluate(() => window.__bothTurnInputs());
    check('(J2) REALNY klik chipa „20" w sekcji „Warunki traktatu": pole TRAKTATU = 20, pole '
      + 'wymiany NIETKNIETE (nadal 5)',
      j2Clicked === true && jAfterTreaty && jAfterTreaty.treaty === '20' && jAfterTreaty.deal === '5',
      { j2Clicked, jAfterTreaty });

    /* J3 — chip „Bezterminowy" tez tylko w swojej sekcji. */
    const j3Clicked = await page.evaluate(() => window.__clickChipInSection('treaty', 0));
    const jAfterInf = await page.evaluate(() => window.__bothTurnInputs());
    check('(J3) REALNY klik chipa „Bezterminowy" w sekcji traktatu: pole TRAKTATU = 0, pole '
      + 'wymiany NIETKNIETE (nadal 5)',
      j3Clicked === true && jAfterInf && jAfterInf.treaty === '0' && jAfterInf.deal === '5',
      { j3Clicked, jAfterInf });

    /* J4 — skutek koncowy w payloadzie po samych KLIKACH (bez programowego pisania po polach). */
    const j4Deal = await page.evaluate(() => window.__clickChipInSection('deal', 10));
    const j4Treaty = await page.evaluate(() => window.__clickChipInSection('treaty', 15));
    const j4Ui = await page.evaluate(() => window.__bothTurnInputs());
    await shot(page, '08-po-klik-chipow-dwie-sekcje-niezalezne.png');
    const j4Submitted = await page.evaluate(() => window.__submitBasket());
    const j4Action = await page.evaluate(() => window.__lastAction);
    check('(J4) po serii samych KLIKOW (wymiana 10, traktat 15) payload niesie treatyTurns===15 '
      + 'i turns===10 — kazdy chip trafil tam, gdzie gracz kliknal',
      j4Deal === true && j4Treaty === true && j4Ui && j4Ui.treaty === '15' && j4Ui.deal === '10'
      && j4Submitted === true && j4Action && j4Action.payload
      && j4Action.payload.treatyTurns === 15 && j4Action.payload.turns === 10,
      { j4Ui, j4Action });

    /* J5 — brak regresu: w modalu BEZ sekcji wymiany (NAP bez koszyka) chipy traktatu dzialaja. */
    await page.evaluate(() => window.__openAudience(null));
    await page.evaluate(() => window.__clickAction('2'));
    const j5Clicked = await page.evaluate(() => window.__clickChipInSection('treaty', 15));
    const j5Ui = await page.evaluate(() => window.__bothTurnInputs());
    check('(J5) brak regresu: w modalu paktu nieagresji (brak sekcji wymiany) klik chipa traktatu '
      + 'nadal ustawia pole czasu paktu na 15',
      j5Clicked === true && j5Ui && j5Ui.treaty === '15' && j5Ui.deal === null,
      { j5Clicked, j5Ui });

    // ===== (K) ZARZUTY 1+2 (Evaluator R3): REALNA sciezka gry, nie samo evaluateProposal =====
    console.log('\n--- (K) UI -> main.ts::buildProposalFromPayload (biala lista) -> silnik ---');
    check('(K0) obie mutacje kontrolne osadzone dokladnie raz (stan sprzed tej Obrony: brak '
      + '`treatyTurns` na bialej liscie + gate `counterInitial` bez \'5\') — test nie jest tautologiczny',
      mainPathMutation.whitelist === 1 && mainPathMutation.counterGate === 1, mainPathMutation);

    /* K1 — NAJCZESTSZY PRZYPADEK i zarazem REGRESJA z zarzutu 2: traktat BEZ koszyka.
     * Payload z UI to wtedy WYLACZNIE {actionId:'5', treatyTurns:13} — biala lista jest
     * jedynym miejscem, w ktorym to pole moze zginac. */
    await page.evaluate(() => window.__openAudience(null));
    await page.evaluate(() => window.__clickAction('5'));
    await page.evaluate(() => window.__setTreatyTurnsInput(13));
    const k1Submitted = await page.evaluate(() => window.__submitBasket());
    const k1Ui = await page.evaluate(() => window.__lastAction);
    await shot(page, '09-realna-sciezka-traktat-13-tur-bez-koszyka.png');
    const k1Real = await page.evaluate((p) => window.__realPathDeal(p, false), k1Ui && k1Ui.payload);
    const k1Mut = await page.evaluate((p) => window.__realPathDeal(p, true), k1Ui && k1Ui.payload);
    check('(K1a) gracz wybiera 13 tur i NIE dodaje koszyka: payload z UI niesie treatyTurns===13 '
      + 'i NIE ma pola `turns` (czas wymiany nie istnieje bez koszyka)',
      k1Submitted === true && k1Ui && k1Ui.payload && k1Ui.payload.treatyTurns === 13
      && k1Ui.payload.turns === undefined, k1Ui);
    check('(K1b) REALNA SCIEZKA (buildProposalFromPayload wyciety z main.ts -> evaluateProposal): '
      + 'wygasaTura === 113 przy turze 100 — DOKLADNIE wybor gracza, nie 20 i nie bezterminowy',
      k1Real && k1Real.actionId === 'umowa_szlakow' && k1Real.accepted === true
      && k1Real.wygasaTura === 113 && k1Real.uiPayload.treatyTurns === 13, k1Real);
    check('(K1c) KONTROLA NIETAUTOLOGICZNOSCI zarzutu 2: ten sam payload przez biala liste SPRZED '
      + 'poprawki daje pusty `uiPayload.treatyTurns` i wygasaTura === null — czyli traktat '
      + 'WIECZYSTY (regresja, ktora ta bramka ma lapac na zawsze)',
      k1Mut && k1Mut.uiPayload.treatyTurns === undefined && k1Mut.wygasaTura === null, k1Mut);

    /* K2 — „Bezterminowy" BEZ koszyka: 0 to wartosc znaczaca, nie brak wartosci. */
    await page.evaluate(() => window.__openAudience(null));
    await page.evaluate(() => window.__clickAction('5'));
    await page.evaluate(() => window.__clickChipInSection('treaty', 0));
    await page.evaluate(() => window.__submitBasket());
    const k2Ui = await page.evaluate(() => window.__lastAction);
    const k2Real = await page.evaluate((p) => window.__realPathDeal(p, false), k2Ui && k2Ui.payload);
    check('(K2) REALNA SCIEZKA, chip „Bezterminowy" bez koszyka: treatyTurns===0 przechodzi biala '
      + 'liste i daje wygasaTura === null (bezterminowy nadal dziala po naprawie)',
      k2Ui && k2Ui.payload && k2Ui.payload.treatyTurns === 0
      && k2Real && k2Real.uiPayload.treatyTurns === 0 && k2Real.wygasaTura === null,
      { k2Ui, k2Real });

    /* K3 — traktat 12 + wymiana co 8 tur: OBIE wielkosci musza przejsc biala liste, kazda
     * do swojego skutku (wygasniecie vs mnoznik wyceny PN). */
    const k3 = await scenario(12, 8);
    const k3Real = await page.evaluate((p) => window.__realPathDeal(p, false), k3.payload);
    check('(K3) REALNA SCIEZKA z koszykiem: traktat 12 / wymiana 8 -> wygasaTura === 112, a '
      + '`turns` (mnoznik wyceny PN) === 8 przezywa biala liste bez zmian',
      k3Real && k3Real.wygasaTura === 112 && k3Real.uiPayload.turns === 8
      && k3Real.uiPayload.treatyTurns === 12, { k3: k3.payload, k3Real });

    /* K4 — brak regresu paktu nieagresji na TEJ SAMEJ, realnej sciezce. */
    await page.evaluate(() => window.__openAudience(null));
    await page.evaluate(() => window.__clickAction('2'));
    await page.evaluate(() => window.__clickChipInSection('treaty', 10));
    await page.evaluate(() => window.__submitBasket());
    const k4Ui = await page.evaluate(() => window.__lastAction);
    const k4Real = await page.evaluate((p) => window.__realPathDeal(p, false), k4Ui && k4Ui.payload);
    check('(K4) BRAK REGRESU: pakt nieagresji na tej samej realnej sciezce -> actionId `nap`, '
      + 'wygasaTura === 110 (10 tur wybrane chipem)',
      k4Real && k4Real.actionId === 'nap' && k4Real.wygasaTura === 110, { k4Ui, k4Real });

    // ===== (L) ZARZUT 3 (Evaluator R3): prefill kontroferty/edycji dla aid '5' =====
    console.log('\n--- (L) Prefill counterInitial dla \'5\' (kontroferta / edycja ze stolu) ---');
    /* Zywy scenariusz Evaluatora: na stole lezy propozycja AI „traktat 12 tur, wymiana co ture 8".
     * `p` to payload wpisu stolu; `counterInitial` liczy WYCIETY ZE ZRODLA blok main.ts. */
    const tablePayload = {
      treatyTurns: 12,
      turns: 8,
      resourceTradeMode: 'per_turn',
      giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 30 }],
      receiveItems: [{ typ: 'surowiec_ilosc', id: 'drewno', ilosc: 2 }],
    };
    const lInit = await page.evaluate((p) => window.__counterInitialFromMain(
      '5', p, { actionId: 'umowa_szlakow' }, 'incoming', true), tablePayload);
    const lInitMut = await page.evaluate((p) => window.__counterInitialFromMainMut(
      '5', p, { actionId: 'umowa_szlakow' }, 'incoming', true), tablePayload);
    check('(L1) WYCIETY ZE ZRODLA blok main.ts buduje dla \'5\' pelny prefill: treatyTurns===12 '
      + '(czas traktatu), turns===8 (czas wymiany), strony ZAMIENIONE (kontroferta)',
      lInit && lInit.treatyTurns === 12 && lInit.turns === 8
      && lInit.resourceTradeMode === 'per_turn'
      && Array.isArray(lInit.giveItems) && lInit.giveItems[0].id === 'drewno'
      && Array.isArray(lInit.receiveItems) && lInit.receiveItems[0].id === 'zloto', lInit);
    check('(L2) KONTROLA NIETAUTOLOGICZNOSCI zarzutu 3: ten sam blok SPRZED poprawki zwraca '
      + '`undefined` — gracz nie widzial ZADNEGO z warunkow lezacych na stole',
      lInitMut === undefined || lInitMut === null, lInitMut);

    /* L3 — ten sam prefill podany audiencji: modal ma faktycznie pokazac 12 tur i wymiane. */
    await page.evaluate((init) => window.__openAudienceIncoming({
      id: 'row-in-5',
      uiActionId: '5',
      actionLabel: 'Traktat handlowy',
      direction: 'incoming',
      round: 1,
      maxRounds: 3,
      expiresInTurns: 5,
      summary: 'Traktat handlowy',
      dealDetails: '',
      canCounter: true,
      dealPayload: { treatyTurns: 12, turns: 8 },
      counterInitial: init,
    }), lInit);
    const lOpened = await page.evaluate(() => window.__clickNegotCard());
    const lUi = await page.evaluate(() => window.__turnUi());
    const lBoth = await page.evaluate(() => window.__bothTurnInputs());
    await shot(page, '10-kontroferta-traktat-prefill-12-tur.png');
    check('(L3) ZYWO: klik w karte propozycji AI otwiera modal z „Czas traktatu handlowego" = 12 '
      + '(warunek ze stolu), NIE domyslne 20 — dokladnie objaw zgloszony przez Evaluatora',
      lOpened === true && lUi && /Czas traktatu handlowego/.test(lUi.label || '')
      && lUi.inputValue === '12', { lOpened, lUi });
    check('(L4) ZYWO: modal kontroferty ma tez sekcje wymiany z prefillem 8 tur i pozycjami '
      + 'koszyka ze stolu (przed poprawka sekcji wymiany nie bylo wcale)',
      lBoth && lBoth.treaty === '12' && lBoth.deal === '8'
      && /Drewno|drewno/.test((lUi && lUi.text) || ''), { lBoth, text: lUi && lUi.text });

    /* L5 — prefill PONIZEJ 10 tur: widelki '5' to 1–20, wiec 7 ma zostac 7, nie skoczyc na 10. */
    const l5Init = await page.evaluate((p) => window.__counterInitialFromMain(
      '5', p, { actionId: 'umowa_szlakow' }, 'incoming', true), { treatyTurns: 7 });
    await page.evaluate((init) => window.__openAudienceIncoming({
      id: 'row-in-5b', uiActionId: '5', actionLabel: 'Traktat handlowy', direction: 'incoming',
      round: 1, maxRounds: 3, expiresInTurns: 5, summary: 'Traktat handlowy', dealDetails: '',
      canCounter: true, dealPayload: { treatyTurns: 7 }, counterInitial: init,
    }), l5Init);
    await page.evaluate(() => window.__clickNegotCard());
    const l5Ui = await page.evaluate(() => window.__turnUi());
    check('(L5) prefill 7 tur zostaje 7 (widelki \'5\' to 1–20) — twarde `Math.max(10, …)` po cichu '
      + 'podnosilo warunek ze stolu do 10 tur',
      l5Ui && l5Ui.inputValue === '7', l5Ui);

    /* L6 — brak regresu prefillu paktu nieagresji (widelki 10–20, `treatyTurns` nieustawiane). */
    const l6Init = await page.evaluate((p) => window.__counterInitialFromMain(
      '2', p, { actionId: 'nap' }, 'incoming', true), { turns: 12 });
    check('(L6) BRAK REGRESU: prefill paktu nieagresji nadal jedzie samym `turns` (12), bez '
      + '`treatyTurns` — zachowanie bit-w-bit jak przed ta runda',
      l6Init && l6Init.turns === 12 && l6Init.treatyTurns === undefined, l6Init);

    // ===== (M) ZARZUT 1 (piaty przebieg Evaluatora): domyslny TRYBUT nie moze dostac x8 =====
    /* Regresja wprowadzona przez poprzedni przebieg Obrony: `buildTreatyPayload` case '8'
     * ustawial `payload.treatyTurns = state.tributeTurns` BEZWARUNKOWO, takze gdy 0.
     * `trybut_zadanie`/`trybut_oferta` NALEZA do `TREATY_DURATION_MULTIPLIER_ACTIONS`, a
     * `treatyDurationPnMultiplier` czyta `treatyTurns ?? turns` i dla `raw <= 0` zwraca 8
     * (kod „bezterminowy"). Formularz trybutu ma DOMYSLNIE `tributeTurns = 0` („Czas (tur,
     * 0 = bezterminowy)", min="0"), wiec KAZDA domyslna propozycja trybutu dostawala
     * OSMIOKROTNIE zawyzona baze PW w panelu akceptacji stolu (960 zamiast 120). Silnikowa
     * galaz `trybut_zadanie` bazy nie uzywa, wiec `wygasaTura` bylo poprawne — ale gracz
     * widzial falszywa liczbe i falszywy bilans. Ta sekcja pilnuje tego na zawsze; przed nia
     * NIC nie pilnowalo mnoznika CZASU dla trybutu, dlatego zarzut przeszedl 5 rund. */
    console.log('\n--- (M) Domyslny formularz trybutu: mnoznik CZASU === 1, baza PW === 120 ---');
    await page.evaluate(() => window.__openAudience(null));
    await page.evaluate(() => window.__clickAction('8'));
    const mOpen = await page.evaluate(() => window.__basketOpen());
    const mUi = await page.evaluate(() => window.__tributeUi());
    check('(M0) modal trybutu otwarty, pole „Czas (tur, 0 = bezterminowy)" ma DOMYSLNIE 0 '
      + '(min="0") — czyli scenariusz z zarzutu to najczestszy przypadek, nie skrajny',
      mOpen === true && mUi && mUi.hasTurns === true && mUi.turnsValue === '0'
      && mUi.turnsMin === '0' && mUi.mode === 'demand', mUi);

    const mSubmitted = await page.evaluate(() => window.__submitBasket());
    const mAction = await page.evaluate(() => window.__lastAction);
    check('(M1) DOMYSLNY trybut (nic nie ruszone): payload NIE MA ani `treatyTurns`, ani `turns` '
      + '— brak obu pol = „czas nie podany", dokladnie jak przed tym tematem',
      mSubmitted === true && mAction && mAction.actionId === '8' && mAction.payload
      && !Object.prototype.hasOwnProperty.call(mAction.payload, 'treatyTurns')
      && !Object.prototype.hasOwnProperty.call(mAction.payload, 'turns'), mAction);

    const mPn = await page.evaluate((p) => ({
      mult: window.treatyDurationPnMultiplier('trybut_zadanie', p),
      multOferta: window.treatyDurationPnMultiplier('trybut_oferta', p),
      base: window.treatyBaseAcceptancePn('trybut_zadanie', p),
      baseProposals: window.treatyBasePnFromConfig('trybut_zadanie', p),
    }), mAction && mAction.payload);
    check('(M2) ZYWY POMIAR na TYM SAMYM choke-poincie, ktory zasila panel PW stolu: mnoznik '
      + 'CZASU dla domyslnego trybutu === 1, a baza === 120 PW (NIE 960). To ta sama liczba, '
      + 'ktora Evaluator zmierzyl na main.ts',
      mPn && mPn.mult === 1 && mPn.multOferta === 1 && mPn.base === 120
      && mPn.baseProposals === 120, mPn);

    const mSides = await page.evaluate((p) => {
      const s = window.computePlayerAcceptanceSides('trybut_zadanie', p, 130, false);
      return { myBase: s.my.treatyBasePn, theirBase: s.their.treatyBasePn };
    }, mAction && mAction.payload);
    check('(M3) PANEL AKCEPTACJI (computePlayerAcceptanceSides — dokladnie to, co widzi gracz '
      + 'w wierszu „MY ODDAJEMY … PW (baza …)"): baza traktatu === 120 po obu stronach',
      mSides && mSides.myBase === 120 && mSides.theirBase === 120, mSides);

    await page.evaluate((probe) => {
      const p = document.createElement('div');
      p.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:9999;padding:10px 14px;'
        + 'background:#101820;border:2px solid #e8d88a;border-radius:8px;color:#e8d88a;'
        + "font:14px 'Segoe UI',Tahoma,sans-serif;max-width:1200px";
      p.id = 'dthc-trib-probe';
      p.textContent = 'PO (naprawione): ' + probe;
      document.body.appendChild(p);
    }, 'domyslny trybut -> payload ' + JSON.stringify(mAction && mAction.payload)
      + ' -> mnoznik CZASU x' + (mPn && mPn.mult) + ', baza PW ' + (mPn && mPn.base));
    await shot(page, '11-trybut-domyslny-mnoznik-czasu-1-baza-120.png');
    await page.evaluate(() => { document.getElementById('dthc-trib-probe')?.remove(); });

    const mReal = await page.evaluate((p) => window.__realPathDeal(p, false), mAction && mAction.payload);
    check('(M4) REALNA SCIEZKA (buildProposalFromPayload z main.ts -> zywy evaluateProposal): '
      + 'domyslny trybut nadal jest BEZTERMINOWY (wygasaTura === null) — naprawa mnoznika NIE '
      + 'zmienila wygasniecia, zachowanie bit-w-bit jak przed tematem',
      mReal && mReal.actionId === 'trybut_zadanie' && mReal.accepted === true
      && mReal.wygasaTura === null, mReal);

    /* M5 — terminowy trybut: obie wielkosci nadal jada i mnoznik liczy sie z czasu traktatu. */
    await page.evaluate(() => window.__openAudience(null));
    await page.evaluate(() => window.__clickAction('8'));
    await page.evaluate(() => window.__setTributeTurns(15));
    await page.evaluate(() => window.__submitBasket());
    const m5Action = await page.evaluate(() => window.__lastAction);
    const m5Pn = await page.evaluate((p) => ({
      mult: window.treatyDurationPnMultiplier('trybut_zadanie', p),
      base: window.treatyBaseAcceptancePn('trybut_zadanie', p),
    }), m5Action && m5Action.payload);
    const m5Real = await page.evaluate((p) => window.__realPathDeal(p, false), m5Action && m5Action.payload);
    check('(M5) BRAK REGRESU trybutu TERMINOWEGO: 15 tur -> payload {treatyTurns:15, turns:15}, '
      + 'mnoznik === 2 i baza === 240 (2^((15-10)/5), tak samo jak na main, gdzie liczyl sie z '
      + '`turns`), wygasaTura === 115',
      m5Action && m5Action.payload && m5Action.payload.treatyTurns === 15
      && m5Action.payload.turns === 15 && m5Pn && m5Pn.mult === 2 && m5Pn.base === 240
      && m5Real && m5Real.wygasaTura === 115, { m5Action, m5Pn, m5Real });

    /* M6 — nota Evaluatora: prefill KONTROFERTY trybutu (ta sama wada, co naprawiona w '5').
     * Przed poprawka pierwszy `refresh()` czytal nieistniejace jeszcze pola DOM i podstawial
     * sztywne 0/10, kasujac warunki lezace na stole — a wyzerowany czas zasilal wprost x8. */
    const m6Init = await page.evaluate((p) => window.__counterInitialFromMain(
      '8', p, { actionId: 'trybut_zadanie' }, 'incoming', true), { turns: 7, goldPerTurn: 55 });
    check('(M6a) blok `counterInitial` wyciety z main.ts buduje dla \'8\' prefill 7 tur / 55 ¤',
      m6Init && m6Init.tributeTurns === 7 && m6Init.goldPerTurn === 55, m6Init);
    await page.evaluate((init) => window.__openAudienceIncoming({
      id: 'row-in-8', uiActionId: '8', actionLabel: 'Trybut', direction: 'incoming',
      round: 1, maxRounds: 3, expiresInTurns: 5, summary: 'Trybut', dealDetails: '',
      canCounter: true, dealPayload: { turns: 7, goldPerTurn: 55 }, counterInitial: init,
    }), m6Init);
    const m6Opened = await page.evaluate(() => window.__clickNegotCard());
    const m6Ui = await page.evaluate(() => window.__tributeUi());
    check('(M6b) ZYWO: kontroferta trybutu pokazuje 7 tur i 55 ¤ (warunki ze stolu), NIE sztywne '
      + '0 i 10 — pierwszy render nie kasuje juz prefillu (ten sam wzorzec „brak pola w DOM -> '
      + 'zachowaj prev", ktory naprawiono wczesniej dla galezi \'5\')',
      m6Opened === true && m6Ui && m6Ui.turnsValue === '7' && m6Ui.goldValue === '55',
      { m6Opened, m6Ui });
    /* Kontroferta wychodzi kanalem `onCounterNegotiation` (window.__lastCounter), nie `onAction`. */
    const m6Submitted = await page.evaluate(() => window.__submitBasket());
    const m6Counter = await page.evaluate(() => window.__lastCounter);
    const m6Pn = await page.evaluate((p) => window.treatyDurationPnMultiplier('trybut_zadanie', p),
      m6Counter && m6Counter.payload);
    check('(M6c) i skutek: kontroferta wychodzi z treatyTurns===7 (nie 0), wiec mnoznik CZASU '
      + '=== 1 zamiast x8 — obie usterki spinaly sie w jeden objaw',
      m6Submitted === true && m6Counter && m6Counter.payload
      && m6Counter.payload.treatyTurns === 7 && m6Counter.payload.turns === 7 && m6Pn === 1,
      { m6Counter, m6Pn });

    // ===== (M7) KONTROLA NIETAUTOLOGICZNOSCI: ten sam klik na kodzie SPRZED poprawki =====
    /* DOKLADNIE ten sam scenariusz co (M0)-(M3), ale na bundlu z przywrocona jedna linia
     * (`payload.treatyTurns = state.tributeTurns` bezwarunkowo). Musi dac liczby Evaluatora. */
    console.log('\n--- (M7) PRZED: ten sam klik na kodzie sprzed poprawki -> x8 / baza 960 ---');
    await page.setContent(blank);
    await page.addScriptTag({ path: BUNDLE_TRIB_PRZED });
    await page.evaluate(pageBootstrap);
    await page.evaluate(() => window.__openAudience(null));
    await page.evaluate(() => window.__clickAction('8'));
    const m7Submitted = await page.evaluate(() => window.__submitBasket());
    const m7Action = await page.evaluate(() => window.__lastAction);
    const m7Pn = await page.evaluate((p) => ({
      mult: window.treatyDurationPnMultiplier('trybut_zadanie', p),
      base: window.treatyBaseAcceptancePn('trybut_zadanie', p),
      sides: window.computePlayerAcceptanceSides('trybut_zadanie', p, 130, false).my.treatyBasePn,
    }), m7Action && m7Action.payload);
    check('(M7) PRZED poprawka ten sam domyslny klik daje payload.treatyTurns === 0, mnoznik '
      + 'CZASU === 8 i baze === 960 PW — czyli asercje (M1)-(M3) faktycznie mierza regresje, '
      + 'a nie stala. To liczby zmierzone przez Evaluatora na 25afe93c',
      m7Submitted === true && m7Action && m7Action.payload
      && m7Action.payload.treatyTurns === 0 && m7Pn && m7Pn.mult === 8 && m7Pn.base === 960
      && m7Pn.sides === 960, { m7Action, m7Pn });
    await page.evaluate((probe) => {
      const p = document.createElement('div');
      p.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:9999;padding:10px 14px;'
        + 'background:#2a1010;border:2px solid #e08a8a;border-radius:8px;color:#e8c8c8;'
        + "font:14px 'Segoe UI',Tahoma,sans-serif;max-width:1200px";
      p.textContent = 'PRZED (regresja): ' + probe;
      document.body.appendChild(p);
    }, 'domyslny trybut -> payload ' + JSON.stringify(m7Action && m7Action.payload)
      + ' -> mnoznik CZASU x' + (m7Pn && m7Pn.mult) + ', baza PW ' + (m7Pn && m7Pn.base));
    await shot(page, '12-trybut-przed-mnoznik-czasu-8-baza-960.png');

    check('(E0) zero bledow konsoli/JS podczas calego przebiegu', pageErrors.length === 0, pageErrors);
  } finally {
    await browser.close();
  }

  cleanup();
  console.log('\ndyplo-traktat-handlowy-wybor-czasu-real-render-test: ' + pass + ' pass, ' + fail + ' fail');
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); cleanup(); process.exit(1); });
