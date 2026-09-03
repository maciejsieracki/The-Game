'use strict';
/**
 * dyplo-warunek-niespelniony-czerwony-tooltip-test.cjs
 *
 * TEMAT: R-DYPLO-WARUNEK-NIESPELNIONY-CZERWONY-TOOLTIP-Q1 (Operator runda 1).
 *
 * ZGŁOSZENIE (właściciel, zrzuty ekranu, 2026-09-03): pakt o nieagresji odrzucany mimo
 * rosnącego "Bilans (netto)" w koszyku (+130→+414). Po wyjaśnieniu: „niespełnione warunki
 * powinny świecić się na czerwono ... powinna też być informacja po najechaniu na Przyjmij,
 * dlaczego nie można przyjąć ... skoro kara ekspansji w ogóle blokuje pakt, nie powinien być
 * w opcjach do wyboru [bez ostrzeżenia]".
 *
 * RECON (potwierdzone, patrz 00-dispatch.md): próg NAP w diplomacy-proposals.ts (110 baza +
 * 20 za ekspansję przy granicy = 130) jest CAŁKOWICIE POZA ZAKRESEM tej rundy — ZERO zmian
 * tam. Temat jest WYŁĄCZNIE UI: kolor blokady (GOAL 1), tooltip na Przyjmij (GOAL 2),
 * sygnalizacja na liście „Możliwe umowy" PRZED zbudowaniem koszyka (GOAL 3) —
 * WYŁĄCZNIE gra/src/ui/diplomacyAudience.ts (allowlista tego tematu).
 *
 * METODA (real-render, Playwright/Chromium, wzorzec z dyplo-traktat-handlowy-wybor-czasu):
 * esbuild bunduje PRAWDZIWY `diplomacyAudience.ts` (silnik CSS/HTML/JS — nie stub, nie
 * jsdom) w dwóch wariantach:
 *   PO    — plik bieżący (ta runda).
 *   PRZED — TA SAMA treść pliku z DOKŁADNIE dwiema liniami cofniętymi tekstowo do stanu
 *           SPRZED tej rundy (kolor `.no` z powrotem na bursztynowy #e0a868; `relWarn`
 *           w `dealsColumnHtml` na zawsze `null`) — dowód nietautologiczności: identyczny
 *           test na PRZED musi FAILować dokładnie tam, gdzie na PO PASSuje.
 *
 * `cfg.previewNegotiation` (hak JUŻ ISTNIEJĄCY w DiplomacyAudienceConfig, wpięty w main.ts
 * na `previewNegotiatedProposal` → `evaluateProposal`, main.ts NIETKNIĘTY) jest w tym teście
 * podłączony do PRAWDZIWEGO, niezmienionego `evaluateProposal` z diplomacy-proposals.ts —
 * czyli reason „Relacja zbyt niska na pakt (wymagana ≥ 130 ...)" i `accepted:false` przy
 * Relacji 112 + ekspansja przy granicy to WYNIK SILNIKA, nie tekst wpisany w tym teście.
 *
 * GOAL 2 (tooltip na Przyjmij) — recon w kodzie pokazał, że `title` na wyłączonym przycisku
 * JUŻ ISTNIEJE (negotiationActionBarHtml, nie zmieniony w tej rundzie — allowlista zero
 * zmian tam, gdzie już działa). Ten test weryfikuje ŻYWO (nie tylko czytaniem kodu, zgodnie
 * z regułą anty-halucynacyjną dispatchu), że atrybut faktycznie trafia na wyłączony
 * przycisk w DOM z tym samym tekstem `reason`, jaki niesie komunikat blokady panelu PW.
 *
 * Zrzuty: dyspozycje/autobot/runs/R-DYPLO-WARUNEK-NIESPELNIONY-CZERWONY-TOOLTIP-Q1/dowody/
 * Usage (z gra/): node tools/dyplo-warunek-niespelniony-czerwony-tooltip-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[dwnc-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const SRC = path.resolve(GRA, 'src');
const STUB_DIR = path.resolve(__dirname, '.dwnc-stubs');
const DIPLO_AUD_REAL = path.resolve(SRC, 'ui', 'diplomacyAudience.ts');
const DIPLO_AUD_PRZED = path.resolve(SRC, 'ui', '.dwnc-diplomacyAudience-przed.ts');
const ENTRY_PO = path.resolve(SRC, 'ui', '.dwnc-entry-po.ts');
const ENTRY_PRZED = path.resolve(SRC, 'ui', '.dwnc-entry-przed.ts');
const BUNDLE_PO = path.resolve(__dirname, '.dwnc-bundle-po.js');
const BUNDLE_PRZED = path.resolve(__dirname, '.dwnc-bundle-przed.js');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const SHOT_DIR = path.resolve(
  GRA, '..', 'dyspozycje', 'autobot', 'runs',
  'R-DYPLO-WARUNEK-NIESPELNIONY-CZERWONY-TOOLTIP-Q1', 'dowody',
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
  await page.screenshot({ path: p });
  console.log('  [zrzut] ' + p);
}

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[dwnc-test] domyslny Chromium niedostepny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

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

const ESBUILD_ALIAS = {
  '../audio/muzyka-antyczna': stubs.music,
  './leaderPortraits': stubs.leaderPortraits,
  './icons/brandAssets': stubs.brandAssets,
};

/** Plugin esbuild — przekierowuje TYLKO importy z plików wewnątrz src/ui na stuby. */
function stubAliasPlugin() {
  return {
    name: 'dwnc-stub-alias',
    setup(build) {
      build.onResolve({ filter: /^(\.\.\/audio\/muzyka-antyczna|\.\/leaderPortraits|\.\/icons\/brandAssets)$/ }, (args) => {
        const target = ESBUILD_ALIAS[args.path];
        if (target) return { path: target };
        return null;
      });
    },
  };
}

async function buildBundle(entry, outfile) {
  await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    globalName: 'DWNC_IIFE',
    target: 'es2020',
    outfile,
    absWorkingDir: SRC,
    loader: { '.ts': 'ts', '.json': 'json' },
    logLevel: 'silent',
    plugins: [stubAliasPlugin()],
  });
}

/**
 * Wariant PRZED — dokładnie dwie mutacje tekstowe cofające tę rundę (kotwiczone na
 * dokładny, unikalny fragment; rzuca gdy kod się przesunął, zamiast cicho testować nic).
 */
function writePrzedVariant() {
  const src = fs.readFileSync(DIPLO_AUD_REAL, 'utf8');

  const noColorFrom = '.da-pn-bal-verdict.no{color:#e08a8a;background:rgba(200,64,64,.1);border:1px solid rgba(200,64,64,.5);}';
  const noColorTo = '.da-pn-bal-verdict.no{color:#e0a868;background:rgba(224,168,104,.1);border:1px solid rgba(224,168,104,.35);}';
  if (!src.includes(noColorFrom)) throw new Error('PRZED: kotwica koloru .no nie znaleziona — kod się przesunął');

  const relWarnFrom = "const relWarn = !isLocked && !a.active ? baseRelationWarning(a.id) : null;";
  const relWarnTo = "const relWarn = null;";
  if (!src.includes(relWarnFrom)) throw new Error('PRZED: kotwica relWarn nie znaleziona — kod się przesunął');

  const przed = src.split(noColorFrom).join(noColorTo).split(relWarnFrom).join(relWarnTo);
  fs.writeFileSync(DIPLO_AUD_PRZED, przed, 'utf8');
}

function writeEntries() {
  fs.writeFileSync(ENTRY_PO, [
    "import { showDiplomacyAudience, updateDiplomacyAudience, hideDiplomacyAudience, dealsColumnHtml } from './diplomacyAudience';",
    '(window as any).DWNC = { showDiplomacyAudience, updateDiplomacyAudience, hideDiplomacyAudience, dealsColumnHtml };',
  ].join('\n'), 'utf8');
  fs.writeFileSync(ENTRY_PRZED, [
    "import { showDiplomacyAudience, updateDiplomacyAudience, hideDiplomacyAudience, dealsColumnHtml } from './.dwnc-diplomacyAudience-przed';",
    '(window as any).DWNC = { showDiplomacyAudience, updateDiplomacyAudience, hideDiplomacyAudience, dealsColumnHtml };',
  ].join('\n'), 'utf8');
}

const PAGE_HTML = '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body></body></html>';

/**
 * Kontekst evaluateProposal dla scenariusza właściciela: Relacja 112 (Zaufanie 56 + Respekt
 * 56, mnożniki=1 w DIPLOMACY_PARAMS), obie strony >2 miasta (ekspansjaPrzyGranicy=true) —
 * DOKŁADNIE zrzut ekranu (próg 130 = 110 baza + 20 ekspansja). `evaluateProposal` i
 * `getEffectiveDiplomacyParams`/`Relation` importowane z diplomacy-proposals.ts/diplomacy.ts
 * BEZ ŻADNEJ modyfikacji — silnik ZUPEŁNIE nietknięty w tej rundzie.
 */
function buildEnginePreviewSetup() {
  fs.writeFileSync(path.resolve(SRC, '.dwnc-engine-entry.ts'), `
import { evaluateProposal } from './game/diplomacy-proposals';
(window as any).DWNC_EVAL = { evaluateProposal };
`, 'utf8');
}
const ENGINE_ENTRY = path.resolve(SRC, '.dwnc-engine-entry.ts');
const ENGINE_BUNDLE = path.resolve(__dirname, '.dwnc-engine-bundle.js');

async function main() {
  console.log('dyplo-warunek-niespelniony-czerwony-tooltip-test — start');
  writeStubs();
  writePrzedVariant();
  writeEntries();
  buildEnginePreviewSetup();

  await buildBundle(ENTRY_PO, BUNDLE_PO);
  await buildBundle(ENTRY_PRZED, BUNDLE_PRZED);
  await esbuild.build({
    entryPoints: [ENGINE_ENTRY],
    bundle: true, platform: 'browser', format: 'iife', globalName: 'DWNC_EVAL_IIFE',
    target: 'es2020', outfile: ENGINE_BUNDLE, absWorkingDir: SRC,
    loader: { '.ts': 'ts', '.json': 'json' }, logLevel: 'silent',
  });

  const browser = await launchBrowser();
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
    await page.setContent(PAGE_HTML);
    await page.addScriptTag({ path: ENGINE_BUNDLE });

    // --- (E) Silnik REALNY — reason/accepted dla nap @ Relacja 112 + ekspansja, NIETKNIĘTY.
    const engineNap = await page.evaluate(() => {
      const relation = { zaufanie: 56, respekt: 56, status: 'pokoj' };
      const ctx = {
        relation, stanWojny: false, turn: 10,
        proposerRespekt: 60, responderRespekt: 60,
        proposerWiarygodnosc: 100,
        ekspansjaPrzyGranicy: true,
        activeDeals: [],
      };
      const proposal = { actionId: 'nap', proposerOwnerId: 0, responderOwnerId: 1, payload: {} };
      return window.DWNC_EVAL.evaluateProposal(proposal, ctx);
    });
    check('(E) SILNIK (nietknięty): nap @ Relacja 112 + ekspansja → accepted:false',
      engineNap.accepted === false, engineNap);
    check('(E) SILNIK: reason zawiera "Relacja zbyt niska na pakt" i próg 130',
      typeof engineNap.reason === 'string'
        && engineNap.reason.includes('Relacja zbyt niska na pakt')
        && engineNap.reason.includes('130'),
      engineNap.reason);

    const engineNapOk = await page.evaluate(() => {
      const relation = { zaufanie: 100, respekt: 100, status: 'pokoj' };
      const ctx = {
        relation, stanWojny: false, turn: 10,
        proposerRespekt: 60, responderRespekt: 60,
        proposerWiarygodnosc: 100,
        ekspansjaPrzyGranicy: true,
        activeDeals: [],
      };
      const proposal = { actionId: 'nap', proposerOwnerId: 0, responderOwnerId: 1, payload: {} };
      return window.DWNC_EVAL.evaluateProposal(proposal, ctx);
    });
    check('(KONTROLA) SILNIK: nap @ Relacja 200 (≥130) → accepted:true (regresja zero)',
      engineNapOk.accepted === true, engineNapOk);

    // Zbuduj stan audiencji ze scenariuszem właściciela — responderPreview z reason
    // REALNIE wyliczonym powyżej (nie wpisanym ręcznie w tym teście).
    const napReason = engineNap.reason;

    // `onTable` — R-DYPLO-STOL: gdy nap jest JUŻ na stole (`pendingNegotiations`), kafelek
    // katalogu poprawnie przechodzi w stan `on-table`/`locked` (osobny, wcześniejszy sygnał,
    // nietknięty w tej rundzie) — GOAL 3 dotyczy WYŁĄCZNIE etapu PRZED wyborem z listy, więc
    // scenariusz katalogu (dla KRYTERIUM 4) renderuje się BEZ tej pozycji na stole, tak jak
    // faktycznie wygląda ekran audiencji zanim gracz w ogóle kliknie kafelek "Pakt o
    // nieagresji" (żywy dowód — patrz `onTable: false` niżej).
    async function renderScenario(bundleFile, ownReason, ownAccepted, opts) {
      const onTable = opts?.onTable !== false;
      await page.setContent(PAGE_HTML);
      await page.addScriptTag({ path: bundleFile });
      return page.evaluate(({ ownReason, ownAccepted, onTable }) => {
        const W = window.DWNC;
        const napRow = {
          id: 'neg-1',
          direction: 'own',
          actionLabel: 'Pakt o nieagresji',
          summary: 'Pakt o nieagresji',
          round: 1,
          maxRounds: 5,
          expiresInTurns: 5,
          canCounter: true,
          uiActionId: '2',
          awaitingAiResponse: true,
          responderPreview: { accepted: ownAccepted, reason: ownReason },
          acceptanceMy: {
            offerPn: 0, demandPn: 0, fairMinPn: 0, balancePn: 0, treatyBasePn: 0,
            mode: 'treaty', statusLabel: ownReason, accepted: ownAccepted, relCurrent: 112,
          },
          acceptanceTheir: {
            offerPn: 0, demandPn: 0, fairMinPn: 0, balancePn: 0, treatyBasePn: 0,
            mode: 'treaty', statusLabel: ownReason, accepted: ownAccepted, relCurrent: 112,
          },
        };
        const actions = [
          { id: '2', label: 'Pakt o nieagresji', enabled: true, opis: 'Pakt o nieagresji' },
          { id: '5', label: 'Traktat handlowy', enabled: true, opis: 'Traktat handlowy' },
        ];
        const state = {
          playerTitle: 'Cesarz', playerCivName: 'Rzym', otherTitle: 'Faraon', otherCivName: 'Egipt',
          zaufanie: 56, respekt: 56, tier: 2, layer: 'full', contactEstablished: true,
          actions, relacjaTotal: 112,
          pendingNegotiations: onTable ? [napRow] : [],
        };
        const previews = {
          '2': { accepted: ownAccepted, reason: ownReason },
          '5': { accepted: true, reason: 'ok' },
        };
        W.showDiplomacyAudience({
          ownerId: 1,
          getState: () => state,
          onAction: () => {},
          onBack: () => {},
          previewNegotiation: (_ownerId, payload) => previews[payload.actionId] ?? { accepted: true },
        });
        const verdictEl = document.querySelector('.da-pn-bal-verdict');
        const verdictCs = verdictEl ? getComputedStyle(verdictEl) : null;
        const barEl = document.querySelector('.da-pn-balance-bar');
        const accBtn = document.querySelector('.da-negot-actionbar button.acc');
        const dealBtn = document.querySelector('button.da-deal[data-aid="2"]');
        return {
          verdictText: verdictEl ? verdictEl.textContent : null,
          verdictClass: verdictEl ? verdictEl.className : null,
          verdictColor: verdictCs ? verdictCs.color : null,
          verdictBorderColor: verdictCs ? verdictCs.borderTopColor : null,
          barClass: barEl ? barEl.className : null,
          accBtnDisabled: accBtn ? accBtn.disabled : null,
          accBtnTitle: accBtn ? accBtn.getAttribute('title') : null,
          dealBtnClass: dealBtn ? dealBtn.className : null,
          dealBtnDisabled: dealBtn ? dealBtn.disabled : null,
          dealBtnTitle: dealBtn ? dealBtn.getAttribute('title') : null,
          dealBtnNote: dealBtn ? (dealBtn.querySelector('.da-note')?.textContent ?? null) : null,
          dealBtnOpacity: dealBtn ? getComputedStyle(dealBtn).opacity : null,
        };
      }, { ownReason, ownAccepted, onTable });
    }

    // === PO (kod bieżący) — scenariusz BLOKADY (Relacja 112, próg 130) ===
    const po = await renderScenario(BUNDLE_PO, napReason, false);
    await shot(page, '01-po-blokada-panel-i-lista.png');
    console.log('  PO (blokada):', JSON.stringify(po, null, 2));

    check('KRYTERIUM 1: PO — panel negocjacji ma klasę verdict "no"',
      /(^|\s)no(\s|$)/.test(po.verdictClass ?? ''), po.verdictClass);
    check('KRYTERIUM 1: PO — komunikat blokady zawiera "Nie spełnia warunków" + reason silnika',
      (po.verdictText ?? '').includes('Nie spełnia warunków')
        && (po.verdictText ?? '').includes('Relacja zbyt niska na pakt'),
      po.verdictText);
    check('KRYTERIUM 1 (getComputedStyle — nie sama nazwa klasy): kolor verdictu to CZERWONY #e08a8a (rgb(224,138,138))',
      po.verdictColor === 'rgb(224, 138, 138)', po.verdictColor);
    check('KRYTERIUM 1: kolor NIE jest już starym bursztynowym #e0a868 (rgb(224,168,104))',
      po.verdictColor !== 'rgb(224, 168, 104)', po.verdictColor);
    check('KRYTERIUM 1: border verdictu też czerwony rgba(200,64,64,.5)',
      po.verdictBorderColor === 'rgba(200, 64, 64, 0.5)', po.verdictBorderColor);

    check('KRYTERIUM 2: przycisk Przyjmij jest disabled przy zablokowanej ofercie',
      po.accBtnDisabled === true, po.accBtnDisabled);
    check('KRYTERIUM 2 (żywy DOM, nie kod źródłowy): title na wyłączonym Przyjmij zawiera "Relacja zbyt niska na pakt"',
      typeof po.accBtnTitle === 'string' && po.accBtnTitle.includes('Relacja zbyt niska na pakt'),
      po.accBtnTitle);
    check('KRYTERIUM 2: title identyczny z reason panelu PW (ta sama treść, nie inny tekst)',
      po.accBtnTitle === napReason, { title: po.accBtnTitle, reason: napReason });

    // === KRYTERIUM 4 — katalog "Możliwe umowy" PRZED wyborem z listy (nap jeszcze NIE na
    // stole — inaczej poprawnie wygrywa wcześniejszy sygnał on-table/locked, sprawdzony
    // osobno wyżej przez `po.dealBtnClass` przy onTable:true). ===
    const listPo = await renderScenario(BUNDLE_PO, napReason, false, { onTable: false });
    await shot(page, '04-po-lista-mozliwe-umowy-rel-warn.png');
    console.log('  PO (lista, przed wyborem):', JSON.stringify(listPo, null, 2));

    check('KRYTERIUM 4: kafelek "Pakt o nieagresji" na liście ma klasę rel-warn (sygnał PRZED koszykiem)',
      /(^|\s)rel-warn(\s|$)/.test(listPo.dealBtnClass ?? ''), listPo.dealBtnClass);
    check('KRYTERIUM 4: kafelek NIE jest disabled/locked — nadal klikalny (słodzik może obniżyć próg)',
      listPo.dealBtnDisabled === false && !/(^|\s)locked(\s|$)/.test(listPo.dealBtnClass ?? ''),
      { disabled: listPo.dealBtnDisabled, cls: listPo.dealBtnClass });
    check('KRYTERIUM 4: notatka na kafelku = "wymaga wyższej Relacji"',
      listPo.dealBtnNote === 'wymaga wyższej Relacji', listPo.dealBtnNote);
    check('KRYTERIUM 4: tooltip kafelka niesie realny reason silnika',
      listPo.dealBtnTitle === napReason, { title: listPo.dealBtnTitle, reason: napReason });
    check('KRYTERIUM 4: kafelek wyraźnie przygaszony (opacity < 1, ale > blokady .locked=.48)',
      parseFloat(listPo.dealBtnOpacity) < 1 && parseFloat(listPo.dealBtnOpacity) > 0.48,
      listPo.dealBtnOpacity);

    // === KONTROLA REGRESJI: Relacja WYSTARCZAJĄCA — 'ok'/zielone, kafelek bez ostrzeżenia ===
    const okEngine = await page.evaluate(() => {
      const relation = { zaufanie: 100, respekt: 100, status: 'pokoj' };
      const ctx = {
        relation, stanWojny: false, turn: 10,
        proposerRespekt: 60, responderRespekt: 60, proposerWiarygodnosc: 100,
        ekspansjaPrzyGranicy: false, activeDeals: [],
      };
      const proposal = { actionId: 'nap', proposerOwnerId: 0, responderOwnerId: 1, payload: {} };
      return window.DWNC_EVAL.evaluateProposal(proposal, ctx);
    });
    const ok = await renderScenario(BUNDLE_PO, okEngine.reason ?? 'ok', true);
    await shot(page, '02-po-relacja-wystarczajaca-ok-zielone.png');
    check('KRYTERIUM 3 (regresja zero): Relacja wystarczająca → verdict "ok"',
      /(^|\s)ok(\s|$)/.test(ok.verdictClass ?? ''), ok.verdictClass);
    check('KRYTERIUM 3: kolor verdictu "ok" zostaje zielony #7ad0a0 (rgb(122,208,160)) — bez zmian',
      ok.verdictColor === 'rgb(122, 208, 160)', ok.verdictColor);
    check('KRYTERIUM 3: przycisk Przyjmij AKTYWNY (nie disabled) przy spełnionych warunkach',
      ok.accBtnDisabled === false, ok.accBtnDisabled);

    // Kontrola regresji GOAL 3 na katalogu — TA SAMA konfiguracja onTable:false co KRYTERIUM 4,
    // ale z Relacją wystarczającą (bazowy próg osiągalny) — kafelek MUSI zostać bez rel-warn.
    const listOk = await renderScenario(BUNDLE_PO, okEngine.reason ?? 'ok', true, { onTable: false });
    check('REGRESJA: kafelek "Pakt o nieagresji" na liście BEZ rel-warn, gdy bazowy próg jest osiągalny',
      !/(^|\s)rel-warn(\s|$)/.test(listOk.dealBtnClass ?? ''), listOk.dealBtnClass);

    // === DOWÓD NIETAUTOLOGICZNOŚCI (barrier §9 pkt 6a) — PRZED musi FAILować dokładnie tu ===
    const przed = await renderScenario(BUNDLE_PRZED, napReason, false);
    await shot(page, '03-przed-mutacja-nadal-bursztynowy-i-bez-ostrzegania.png');
    check('NIETAUTOLOGICZNOŚĆ GOAL 1: PRZED (kod sprzed rundy) nadal renderuje STARY bursztynowy #e0a868 (kontrola negatywna)',
      przed.verdictColor === 'rgb(224, 168, 104)', przed.verdictColor);
    check('NIETAUTOLOGICZNOŚĆ GOAL 1: PRZED NIE jest czerwony (różni się od PO — test faktycznie łapie regres koloru)',
      przed.verdictColor !== po.verdictColor, { przed: przed.verdictColor, po: po.verdictColor });

    const listPrzed = await renderScenario(BUNDLE_PRZED, napReason, false, { onTable: false });
    check('NIETAUTOLOGICZNOŚĆ GOAL 3: PRZED (relWarn wymuszone na null) NIE ma klasy rel-warn na kafelku (kontrola negatywna)',
      !/(^|\s)rel-warn(\s|$)/.test(listPrzed.dealBtnClass ?? ''), listPrzed.dealBtnClass);
    check('NIETAUTOLOGICZNOŚĆ GOAL 3: PO vs PRZED różnią się dokładnie klasą rel-warn (test faktycznie łapie regres)',
      listPo.dealBtnClass !== listPrzed.dealBtnClass, { po: listPo.dealBtnClass, przed: listPrzed.dealBtnClass });

    // === Smoke: dealsColumnHtml wołany BEZPOŚREDNIO (bez showDiplomacyAudience → cfg===null)
    // nie wybucha i fail-open na sam sygnał (istniejący test warstwy wiązania,
    // diplomacy-tech-chip-filter-and-multi-deal-test.cjs, robi dokładnie to — regresja zero).
    await page.setContent(PAGE_HTML);
    await page.addScriptTag({ path: BUNDLE_PO });
    const directCallHtml = await page.evaluate(() => {
      const W = window.DWNC;
      const state = {
        playerTitle: 'x', playerCivName: 'x', otherTitle: 'x', otherCivName: 'x',
        zaufanie: 56, respekt: 56, tier: 1, layer: 'full', contactEstablished: true,
        actions: [{ id: '2', label: 'Pakt o nieagresji', enabled: true }],
      };
      return W.dealsColumnHtml(state);
    });
    check('SMOKE (cfg===null, wywołanie bez showDiplomacyAudience): dealsColumnHtml nie wybucha i renderuje kafelek "2"',
      typeof directCallHtml === 'string' && directCallHtml.includes('data-aid="2"'), directCallHtml?.slice(0, 200));
    check('SMOKE: bez cfg.previewNegotiation kafelek NIE ma rel-warn (fail-open na sam sygnał, nie na blokadę)',
      !directCallHtml.includes('rel-warn'), null);

    await page.close();
  } finally {
    await browser.close();
    for (const f of [
      ENTRY_PO, ENTRY_PRZED, DIPLO_AUD_PRZED, ENGINE_ENTRY,
      BUNDLE_PO, BUNDLE_PRZED, ENGINE_BUNDLE,
      BUNDLE_PO.replace(/\.js$/, '.css'), BUNDLE_PRZED.replace(/\.js$/, '.css'),
    ]) {
      try { fs.unlinkSync(f); } catch (_) { /* ok */ }
    }
    try { fs.rmSync(STUB_DIR, { recursive: true, force: true }); } catch (_) { /* ok */ }
  }

  console.log('\n' + pass + '/' + (pass + fail) + ' PASS');
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  for (const f of [ENTRY_PO, ENTRY_PRZED, DIPLO_AUD_PRZED, ENGINE_ENTRY]) {
    try { fs.unlinkSync(f); } catch (_) { /* ok */ }
  }
  process.exit(1);
});
