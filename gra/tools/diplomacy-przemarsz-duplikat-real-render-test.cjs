'use strict';
/**
 * diplomacy-przemarsz-duplikat-real-render-test.cjs
 *
 * TEMAT: P-DYPLO-PRZEMARSZ-DUPLIKAT-AKTYWNY-Q1.
 *
 * WYZWALACZ (właściciel): „Po drugie, pomimo podpisanej umowy na traktat przemarszu,
 * nadal jest dostępny. Powinien być tylko jeden; powinna być możliwość ustanowienia,
 * a nie kolejny traktat."
 *
 * BŁĄD: `resolveDiplomacyActionLock` case '4' (Traktat przemarszu) — w odróżnieniu od
 * case '2'/'3'/'5'/'14' — nie sprawdzał, czy traktat przemarszu jest już aktywny między
 * stronami, więc panel „Możliwe umowy" pokazywał go jako klikalną propozycję nawet po
 * zawarciu.
 *
 * METODA: żywy render w headless Chromium (Playwright) prawdziwego łańcucha
 * `buildAudienceActionsList` (diplomacy-audience-actions.ts, WOŁA resolveDiplomacyActionLock)
 * → `dealsColumnHtml` (diplomacyAudience.ts) — dokładnie ten sam kod, którego używa SILNIK
 * (main.ts buildAudienceActions). Fixture: kontekst z hasNap=true (Pakt już zawarty — dziś
 * poprawnie wyświetlany jako „już zawarty") ORAZ hasGranice=true (Traktat przemarszu już
 * zawarty — pole dodane tym tematem). SAMA TA SAMA fixtura (bez zmian) jest uruchamiana raz
 * PRZED poprawką (na kodzie z HEAD — pole `hasGranice` jest wtedy nieużywane przez case '4',
 * więc bug się odtwarza) i raz PO poprawce (case '4' czyta `ctx.hasGranice`) — dowód
 * nietautologiczności: ten sam skrypt, ta sama fixtura, dwa różne stany kodu w repo.
 *
 * KRYTERIA KOŃCA (dispatch):
 *   1. PO poprawce: kafelek '4' ma dokładnie ten sam kształt (klasy locked+active, disabled,
 *      ikona check, nota „już zawarty") jak referencyjny kafelek '2' (Pakt, hasNap=true).
 *   2. PRZED poprawką: ten sam test na tej samej fixturze odtwarza błąd — kafelek '4' NIE
 *      jest zablokowany/aktywny (klikalna propozycja) mimo hasGranice=true.
 *
 * TRYB (konwencja repo, jak *_SRC_DIR w innych testach real-render/logic — np.
 * diplomacy-locks-test.cjs::DIP_SRC_DIR): DOMYŚLNIE (bez żadnej zmiennej env) skrypt
 * asercjuje KRYTERIUM 1 — bieżący/poprawiony kod w tym worktree = zielono. To jest ścieżka,
 * którą uruchomi każda przyszła bramka/audyt bez wiedzy o tym temacie. Odtworzenie stanu
 * PRZED poprawką (KRYTERIUM 2, bug MA wystąpić) jest OSOBNĄ, jawnie opt-in ścieżką:
 * `DPD_MODE=PRZED node tools/diplomacy-przemarsz-duplikat-real-render-test.cjs` — do użycia
 * ręcznie na kodzie sprzed poprawki (np. `git stash`/checkout wcześniejszego commita), nigdy
 * jako domyślne zachowanie bramki.
 *
 * Usage (z gra/):
 *   node tools/diplomacy-przemarsz-duplikat-real-render-test.cjs              # PO (domyślnie)
 *   DPD_MODE=PRZED node tools/diplomacy-przemarsz-duplikat-real-render-test.cjs # PRZED (opt-in)
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[diplomacy-przemarsz-duplikat-real-render-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.dpd-stubs');
const ENTRY = path.resolve(__dirname, '.dpd-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dpd-bundle.js');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const SHOT_DIR = path.resolve(
  GRA, '..', 'dyspozycje', 'autobot', 'runs',
  'P-DYPLO-PRZEMARSZ-DUPLIKAT-AKTYWNY-Q1', 'dowody',
);

async function shot(page, name) {
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  const p = path.join(SHOT_DIR, name);
  await page.screenshot({ path: p });
  console.log('[diplomacy-przemarsz-duplikat-real-render-test] zrzut: ' + p);
}

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

const stubs = {
  music: path.resolve(STUB_DIR, 'music-stub.ts'),
  diploUiSkin: path.resolve(STUB_DIR, 'diplouiskin-stub.ts'),
  negotiationModal: path.resolve(STUB_DIR, 'negotiationmodal-stub.ts'),
  tradeBasket: path.resolve(STUB_DIR, 'tradebasket-stub.ts'),
  leaderPortraits: path.resolve(STUB_DIR, 'leaderportraits-stub.ts'),
  civBrandDisplay: path.resolve(STUB_DIR, 'civbranddisplay-stub.ts'),
  brandAssets: path.resolve(STUB_DIR, 'brandassets-stub.ts'),
};

function writeStubs() {
  fs.mkdirSync(STUB_DIR, { recursive: true });
  fs.writeFileSync(stubs.music, [
    "export function startDiplomacyMusic() {}",
    "export function stopDiplomacyMusic() {}",
  ].join('\n'), 'utf8');
  fs.writeFileSync(stubs.diploUiSkin, [
    // dipBrandIconHtml(id, size, cls) real signature — stub preserves `cls` as a real DOM
    // marker (real impl also emits it as an svg class) so tests can query e.g. `.da-checkic`.
    "export function dipBrandIconHtml(id, size, cls) { return '<i class=\"' + (cls || '') + '\" data-icon=\"' + (id || '') + '\"></i>'; }",
    "export function civLeaderMedallionHtmlById() { return ''; }",
    "export function dipCapitalLocateBtnHtml() { return ''; }",
    "export const DIPLO_1E_SHARED_CSS = '';",
    "export function ensureDiploBrandScope() {}",
  ].join('\n'), 'utf8');
  fs.writeFileSync(stubs.negotiationModal, [
    "export function actionNeedsNegotiation() { return false; }",
    "export function showNegotiationModal() {}",
    "export function proposalActionIdFromPayload() { return undefined; }",
  ].join('\n'), 'utf8');
  fs.writeFileSync(stubs.tradeBasket, [
    "export function actionUsesTradeBasket() { return false; }",
    "export function getTradeBasketMode() { return 'trade'; }",
    "export function showTradeBasketModal() {}",
    "export function hideTradeBasketModal() {}",
    "export function openQuickDealBasket() {}",
  ].join('\n'), 'utf8');
  fs.writeFileSync(stubs.leaderPortraits, [
    "export function civCardDisplayName(label) { return label; }",
    "export function leaderName() { return null; }",
  ].join('\n'), 'utf8');
  fs.writeFileSync(stubs.civBrandDisplay, "export function civBrandLineForKey() { return ''; }\n", 'utf8');
  fs.writeFileSync(stubs.brandAssets, [
    "export function brandIconSvg() { return ''; }",
    "export function mapResourceIconSvg() { return ''; }",
  ].join('\n'), 'utf8');
}

function cleanupStubs() {
  for (const f of Object.values(stubs).concat([ENTRY, BUNDLE])) {
    try { fs.unlinkSync(f); } catch (_) { /* ok */ }
  }
  try { fs.rmdirSync(STUB_DIR); } catch (_) { /* ok */ }
}

async function buildBundle() {
  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    globalName: 'DPD',
    target: 'es2020',
    outfile: BUNDLE,
    absWorkingDir: GRA,
    loader: { '.ts': 'ts', '.json': 'json' },
    logLevel: 'silent',
    plugins: [
      {
        name: 'stub-diplomacy-audience-deps',
        setup(build) {
          build.onResolve({ filter: /audio\/muzyka-antyczna$/ }, () => ({ path: stubs.music }));
          build.onResolve({ filter: /diploUiSkin$/ }, () => ({ path: stubs.diploUiSkin }));
          build.onResolve({ filter: /diplomacyNegotiationModal$/ }, () => ({ path: stubs.negotiationModal }));
          build.onResolve({ filter: /diplomacyTradeBasket$/ }, () => ({ path: stubs.tradeBasket }));
          build.onResolve({ filter: /leaderPortraits$/ }, () => ({ path: stubs.leaderPortraits }));
          build.onResolve({ filter: /civBrandDisplay$/ }, () => ({ path: stubs.civBrandDisplay }));
          build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: stubs.brandAssets }));
        },
      },
    ],
  });
}

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[diplomacy-przemarsz-duplikat-real-render-test] domyslny Chromium niedostepny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

/** Kontekst bazowy: WSZYSTKIE progi na 0 / relacja+zaufanie wysokie, żeby żaden inny
 * gate (relacja/zaufanie/wojna) nie maskował sprawdzenia „już zawarty" pod testem.
 * `hasGranice` — pole dodane tym tematem (Otwarte granice/Prawo wojskowe przemarszu/
 * Wspólna walka z barbarzyńcami). Na kodzie PRZED poprawką pole to jest nieużywane przez
 * case '4' (bug), na kodzie PO — czytane. */
function lockCtxBase() {
  return {
    contact: true,
    atWar: false,
    relTotal: 200,
    zaufanie: 200,
    respekt: 200,
    hasNap: true,
    hasHandel: false,
    hasTradeConnection: true,
    hasWymiana: false,
    hasSojusz: false,
    hasGranice: true,
    breaksTreatyLabel: undefined,
    sellableTechCount: 0,
    buyableTechCount: 0,
    knownRivalsCount: 0,
    progNapRelacja: 0,
    progHandelRelacja: 0,
    progSojuszRelacja: 0,
    progSojuszZaufanie: 0,
    progGraniceRelacja: 0,
    progGraniceZaufanie: 0,
    progWymianaTechZaufanie: 0,
    progNamowWojneZaufanie: 0,
    progWasalizacjaRespekt: 0,
    progWchloniecieRespekt: 0,
    progTrybutZadanieMinRespekt: 0,
    progDarRelacja: 0,
    isCityStatePartner: false,
    hasWasal: false,
    wasalAgeTurns: 0,
    graczWchlonieciePoWasaluTur: 10,
  };
}

const AKCJE = [
  { Akcja: '2. Pakt o nieagresji', Opis: 'ref' },
  { Akcja: '4. Traktat przemarszu', Opis: 'pod testem' },
];

async function renderPanel(page) {
  await page.setContent('<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><div id="root"></div></body></html>');
  await page.addScriptTag({ path: BUNDLE });
  await page.evaluate((ctx) => {
    const actions = window.DPD.buildAudienceActionsList({
      akcje: window.__AKCJE__,
      ownerId: 1,
      restrictToBasicActions: false,
      simplifiedOwners: new Set(),
      layer: 'full',
      lockCtxBase: ctx,
    });
    const html = window.DPD.dealsColumnHtml({
      playerTitle: 'Gracz', playerCivName: 'Rzym', otherTitle: 'Rozmówca', otherCivName: 'Grecja',
      zaufanie: 200, respekt: 200, tier: 1, layer: 'full', contactEstablished: true,
      actions,
      pendingNegotiations: [],
    });
    document.getElementById('root').innerHTML = html;
  }, lockCtxBase());
  return page.evaluate(() => {
    function tileInfo(id) {
      const el = document.querySelector('.da-deal[data-aid="' + id + '"]');
      if (!el) return null;
      return {
        cls: el.className,
        disabled: el.hasAttribute('disabled'),
        note: el.querySelector('.da-note') ? el.querySelector('.da-note').textContent : null,
        hasCheckIcon: el.querySelector('.da-checkic') != null,
      };
    }
    return { pakt: tileInfo('2'), przemarsz: tileInfo('4') };
  });
}

async function main() {
  console.log('diplomacy-przemarsz-duplikat-real-render-test — start');
  writeStubs();
  fs.writeFileSync(ENTRY, [
    "export { buildAudienceActionsList } from '../src/game/diplomacy-audience-actions.ts';",
    "export { dealsColumnHtml } from '../src/ui/diplomacyAudience.ts';",
    "window.__AKCJE__ = " + JSON.stringify(AKCJE) + ";",
  ].join('\n'), 'utf8');

  await buildBundle();

  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    const result = await renderPanel(page);
    const shotName = process.env.DPD_SHOT_NAME || 'render.png';
    await shot(page, shotName);

    console.log('WYNIK:', JSON.stringify(result, null, 2));

    check('kafelek "2" (Pakt, hasNap=true) obecny i renderowany jako już zawarty (referencja)',
      result.pakt && result.pakt.cls.includes('locked') && result.pakt.cls.includes('active')
      && result.pakt.disabled === true && result.pakt.note === 'już zawarta',
      result.pakt);

    if (process.env.DPD_MODE === 'PRZED') {
      // Opt-in: odtworzenie stanu PRZED poprawką — bug reprodukowany, gdy kafelek '4' NIE
      // jest zablokowany/aktywny mimo hasGranice=true (klikalna propozycja duplikatu).
      // Ma sens WYŁĄCZNIE uruchomiony na kodzie sprzed poprawki (patrz nagłówek pliku).
      check('KRYTERIUM 2 (PRZED poprawką, opt-in DPD_MODE=PRZED): bug odtworzony — kafelek "4" '
        + 'NIE jest locked+active mimo hasGranice=true (klikalna propozycja duplikatu traktatu)',
        result.przemarsz
        && !(result.przemarsz.cls.includes('locked') && result.przemarsz.cls.includes('active')
          && result.przemarsz.disabled === true && result.przemarsz.note === 'już zawarta'),
        result.przemarsz);
    } else {
      // Domyślnie (bez env): KRYTERIUM 1, PO poprawce — bieżący kod w tym worktree.
      check('KRYTERIUM 1 (domyślnie, PO poprawce): kafelek "4" (Przemarsz, hasGranice=true) ma '
        + 'DOKŁADNIE ten sam kształt jak referencyjny "2" — locked+active, disabled, nota "już zawarta"',
        result.przemarsz
        && result.przemarsz.cls.includes('locked') && result.przemarsz.cls.includes('active')
        && result.przemarsz.disabled === true
        && result.przemarsz.note === 'już zawarta'
        && result.przemarsz.hasCheckIcon === true,
        result.przemarsz);
    }

    await page.close();
  } finally {
    await browser.close();
    cleanupStubs();
  }

  console.log('\n' + 'diplomacy-przemarsz-duplikat-real-render-test: ' + pass + ' PASS, ' + fail + ' FAIL');
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  cleanupStubs();
  process.exit(1);
});
