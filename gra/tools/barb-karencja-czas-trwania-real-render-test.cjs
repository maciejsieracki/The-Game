'use strict';
/**
 * barb-karencja-czas-trwania-real-render-test.cjs
 *
 * TEMAT: R-DYPLO-WSPOLNA-WALKA-BARB-KARENCJA-Q1 — GOAL 1 (KRYTERIUM KOŃCA 1).
 *
 * DOWÓD — real Chromium (`page.screenshot`), R-PROC-AUTOBOT.md §9 pkt 6a: formularz
 * traktatu przemarszu (akcja '4') pozwala wybrać czas trwania „Wspólna walka z
 * barbarzyńcami" — 5/10/15 tur lub Bezterminowy — zamiast dawnego sztywnego „(3 tury)".
 * Kontrola nietautologiczności (`mutation.applied`): bundle PRZED odtwarza dokładnie stan
 * SPRZED tej rundy (etykieta z „(3 tury)", brak sekcji wyboru czasu) — jeśli mutacja się
 * nie powiedzie, test przerywa się PRZED oceną PASS/FAIL zamiast fałszywie zielenieć.
 *
 * Wzorzec pliku i harness (stuby, bundlowanie, otwarcie audiencji→koszyka w realnej
 * stronie) skopiowany z `dyplo-przemarsz-checkbox-przycisk-real-render-test.cjs`
 * (P-DYPLO-PRZEMARSZ-CHECKBOX-PRZYCISK-Q1) — ta sama rodzina UI (case '4').
 *
 * Usage (z gra/): node tools/barb-karencja-czas-trwania-real-render-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[barb-karencja-czas-trwania] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.bkct-stubs');
const ENTRY = path.resolve(__dirname, '.bkct-entry.ts');
const BUNDLE_PO = path.resolve(__dirname, '.bkct-bundle-po.js');
const BUNDLE_PRZED = path.resolve(__dirname, '.bkct-bundle-przed.js');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const DIPLO_BASKET = path.resolve(GRA, 'src', 'ui', 'diplomacyTradeBasket.ts');
const SHOT_DIR = path.resolve(
  GRA, '..', 'dyspozycje', 'autobot', 'runs',
  'R-DYPLO-WSPOLNA-WALKA-BARB-KARENCJA-Q1', 'dowody',
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
  await page.addStyleTag({
    content: '*,*::before,*::after{animation:none!important;-webkit-animation:none!important;'
      + 'transition:none!important;caret-color:transparent!important;}',
  });
  await page.screenshot({ path: p, animations: 'disabled', caret: 'hide' });
  console.log('  [zrzut] ' + p);
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

function cleanup() {
  const artifacts = Object.values(stubs).concat([
    ENTRY, BUNDLE_PO, BUNDLE_PRZED,
    BUNDLE_PO.replace(/\.js$/, '.css'), BUNDLE_PRZED.replace(/\.js$/, '.css'),
  ]);
  for (const f of artifacts) {
    try { fs.unlinkSync(f); } catch (_) { /* ok */ }
  }
  try { fs.rmdirSync(STUB_DIR); } catch (_) { /* ok */ }
}

/* Mutacja W LOCIE — odtwarza dokładnie stan SPRZED tej rundy (etykieta z „(3 tury)",
 * brak sekcji wyboru czasu, brak `payload.treatyTurns` dla case '4'). Nie dotyka repo. */
const mutation = { html: 0, payload: 0 };
const HTML_PO_ANCHOR = `        + '<button type="button" id="cdb-treaty-barb" class="cdb-chip cdb-treaty-barb'
        + (state.barbarianCooperation ? ' selected' : '') + '">Wspólna walka z barbarzyńcami</button>'
        + '</div>'
        + barbDurationSection
        + '<p class="cdb-sub">Opłata cywilne: ' + feeC + ' ¤ · wojskowe: ' + feeM + ' ¤ (jednorazowo)</p>';`;
const HTML_PRZED_ANCHOR = `        + '<button type="button" id="cdb-treaty-barb" class="cdb-chip cdb-treaty-barb'
        + (state.barbarianCooperation ? ' selected' : '') + '">Wspólna walka z barbarzyńcami (3 tury)</button>'
        + '</div>'
        + '<p class="cdb-sub">Opłata cywilne: ' + feeC + ' ¤ · wojskowe: ' + feeM + ' ¤ (jednorazowo)</p>';`;
const PAYLOAD_PO = `      if (state.barbarianCooperation) {
        payload.treatyTurns = state.turns;
      }
      break;`;
const PAYLOAD_PRZED = `      break;`;

const revertPlugin = {
  name: 'revert-barb-karencja-czas-trwania',
  setup(build) {
    build.onLoad({ filter: /diplomacyTradeBasket\.ts$/ }, (args) => {
      if (path.resolve(args.path) !== DIPLO_BASKET) return null;
      let src = fs.readFileSync(args.path, 'utf8');
      const out1 = src.replace(HTML_PO_ANCHOR, HTML_PRZED_ANCHOR);
      if (out1 !== src) mutation.html++;
      src = out1;
      const out2 = src.replace(PAYLOAD_PO, PAYLOAD_PRZED);
      if (out2 !== src) mutation.payload++;
      src = out2;
      return { contents: src, loader: 'ts', resolveDir: path.dirname(args.path) };
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
    loader: { '.ts': 'ts', '.json': 'json', '.svg': 'text', '.png': 'dataurl' },
    logLevel: 'silent',
    plugins: [
      ...(mutate ? [revertPlugin] : []),
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
    console.log('[barb-karencja-czas-trwania] domyslny Chromium niedostepny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

function pageBootstrap() {
  window.__lastAction = null;
  window.__openAudience = () => {
    document.querySelectorAll('.civ-diplo-basket-overlay,.civ-diplo-neg-overlay').forEach(n => n.remove());
    window.__lastAction = null;
    window.showDiplomacyAudience({
      ownerId: 1,
      getState: () => ({
        playerTitle: 'Wodzu', playerCivName: 'Rzym',
        otherTitle: 'Krolu', otherCivName: 'Grecja',
        zaufanie: 70, respekt: 60, relacjaTotal: 130, tier: 2, layer: 'full',
        contactEstablished: true, playerSkarbiec: 500,
        actions: [{ id: '4', label: 'Traktat przemarszu', enabled: true }],
        activeTreaties: [],
        pendingNegotiations: [],
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
      onBack: () => {},
    });
  };
  window.__clickAction = (aid) => {
    const btn = document.querySelector('button[data-aid="' + aid + '"]');
    if (!btn) return false;
    btn.click();
    return true;
  };
  window.__basketOpen = () => document.querySelector('.civ-diplo-basket-overlay') !== null;
  window.__box = () => document.querySelector('.civ-diplo-basket');
  window.__clickBarb = () => {
    const box = window.__box();
    const el = box.querySelector('.cdb-treaty-barb');
    if (!el) return false;
    el.click();
    return true;
  };
  window.__barbLabel = () => {
    const box = window.__box();
    const el = box.querySelector('.cdb-treaty-barb');
    return el ? el.textContent : null;
  };
  window.__durationChips = () => {
    const box = window.__box();
    return Array.from(box.querySelectorAll('.cdb-chip-barbturns')).map(c => c.getAttribute('data-turns'));
  };
  window.__clickDurationChip = (turns) => {
    const box = window.__box();
    const btn = Array.from(box.querySelectorAll('.cdb-chip-barbturns'))
      .find(c => c.getAttribute('data-turns') === String(turns));
    if (!btn) return false;
    btn.click();
    return true;
  };
  window.__submitBasket = () => {
    const box = window.__box();
    const btn = Array.from(box.querySelectorAll('button'))
      .find(b => !b.disabled && /Zaproponuj|Wyślij|Zapisz|Przekaż/i.test(b.textContent || ''));
    if (!btn) return false;
    btn.click();
    return true;
  };
}

async function main() {
  writeStubs();
  fs.writeFileSync(ENTRY, [
    "import { showDiplomacyAudience } from '../src/ui/diplomacyAudience.ts';",
    'window.showDiplomacyAudience = showDiplomacyAudience;',
    '',
  ].join('\n'), 'utf8');

  await buildBundle(BUNDLE_PO, false);
  await buildBundle(BUNDLE_PRZED, true);
  check('(0) mutacja PRZED faktycznie przywróciła etykietę „(3 tury)" bez sekcji czasu — test nie jest tautologiczny',
    mutation.html === 1, mutation.html);
  check('(0b) mutacja PRZED faktycznie usunęła zapis payload.treatyTurns dla case \'4\' — test nie jest tautologiczny',
    mutation.payload === 1, mutation.payload);
  if (mutation.html !== 1 || mutation.payload !== 1) {
    console.log('\nPRZERWANE: nie udało się odtworzyć stanu sprzed zmiany — kod się przesunął.');
    cleanup();
    process.exit(1);
  }

  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));

  const blank = '<!DOCTYPE html><html><head><meta charset="utf-8"><style>'
    + '*{box-sizing:border-box}html,body{margin:0;padding:0;background:#0b0d12;height:100%;width:100%;}'
    + '</style></head><body></body></html>';

  try {
    // ================= (PRZED) stan sprzed zmiany — kontrola nietautologiczna =================
    console.log('\n--- (PRZED) sztywne "(3 tury)", brak wyboru czasu ---');
    await page.setContent(blank);
    await page.addScriptTag({ path: BUNDLE_PRZED });
    await page.evaluate(pageBootstrap);
    await page.evaluate(() => window.__openAudience());
    await page.evaluate(() => window.__clickAction('4'));
    let label = await page.evaluate(() => window.__barbLabel());
    check('(PRZED-1) etykieta niesie sztywne „(3 tury)"', /\(3 tury\)/.test(label || ''), label);
    await page.evaluate(() => window.__clickBarb());
    let chips = await page.evaluate(() => window.__durationChips());
    check('(PRZED-2) brak sekcji wyboru czasu (0 chipów) po zaznaczeniu przycisku', Array.isArray(chips) && chips.length === 0, chips);
    await page.evaluate(() => window.__submitBasket());
    let action = await page.evaluate(() => window.__lastAction);
    check('(PRZED-3) payload BEZ treatyTurns (dawne zachowanie)', action && action.payload
      && action.payload.barbarianCooperation === true && action.payload.treatyTurns === undefined, action);
    await shot(page, '00-przed-sztywne-3-tury.png');

    // ================= (PO) kod bieżący =================
    console.log('\n--- (PO) wybór czasu 5/10/15/Bezterminowy ---');
    await page.setContent(blank);
    await page.addScriptTag({ path: BUNDLE_PO });
    await page.evaluate(pageBootstrap);
    await page.evaluate(() => window.__openAudience());
    await page.evaluate(() => window.__clickAction('4'));
    label = await page.evaluate(() => window.__barbLabel());
    check('(PO-1) etykieta BEZ sztywnego „(3 tury)"', !/\(3 tury\)/.test(label || '') && /Wspólna walka z barbarzyńcami/.test(label || ''), label);
    chips = await page.evaluate(() => window.__durationChips());
    check('(PO-2) sekcja czasu ukryta, dopóki barb-coop NIE jest zaznaczone', Array.isArray(chips) && chips.length === 0, chips);

    await page.evaluate(() => window.__clickBarb());
    chips = await page.evaluate(() => window.__durationChips());
    check('(PO-3) po zaznaczeniu: dokładnie 4 chipy czasu — 5/10/15/Bezterminowy(0)',
      Array.isArray(chips) && chips.length === 4
      && chips.includes('5') && chips.includes('10') && chips.includes('15') && chips.includes('0'), chips);
    await shot(page, '01-po-wybor-czasu-widoczny.png');

    await page.evaluate(() => window.__clickDurationChip(5));
    await page.evaluate(() => window.__submitBasket());
    action = await page.evaluate(() => window.__lastAction);
    check('(PO-4) klik chipa "5" -> payload.treatyTurns === 5, barbarianCooperation === true',
      action && action.payload && action.payload.treatyTurns === 5 && action.payload.barbarianCooperation === true, action);

    await page.evaluate(() => window.__openAudience());
    await page.evaluate(() => window.__clickAction('4'));
    await page.evaluate(() => window.__clickBarb());
    await page.evaluate(() => window.__clickDurationChip(15));
    await page.evaluate(() => window.__submitBasket());
    action = await page.evaluate(() => window.__lastAction);
    check('(PO-5) klik chipa "15" -> payload.treatyTurns === 15', action && action.payload && action.payload.treatyTurns === 15, action);

    await page.evaluate(() => window.__openAudience());
    await page.evaluate(() => window.__clickAction('4'));
    await page.evaluate(() => window.__clickBarb());
    await page.evaluate(() => window.__clickDurationChip(0));
    await page.evaluate(() => window.__submitBasket());
    action = await page.evaluate(() => window.__lastAction);
    check('(PO-6) klik chipa "Bezterminowy" (0) -> payload.treatyTurns === 0 (silnik: wygasaTura=null)',
      action && action.payload && action.payload.treatyTurns === 0, action);
    await shot(page, '02-po-bezterminowy-wybrany.png');

    // Bez barb-coop: zwykły przemarsz zostaje bez zmian (brak treatyTurns w payloadzie).
    await page.evaluate(() => window.__openAudience());
    await page.evaluate(() => window.__clickAction('4'));
    await page.evaluate(() => window.__submitBasket());
    action = await page.evaluate(() => window.__lastAction);
    check('(PO-7) bez zaznaczenia barb-coop: payload BEZ treatyTurns (zwykły przemarsz nietknięty)',
      action && action.payload && action.payload.barbarianCooperation === false && action.payload.treatyTurns === undefined, action);

    check('(Z) brak błędów strony (pageerror) w całym przebiegu', pageErrors.length === 0, pageErrors);
  } finally {
    await browser.close();
    cleanup();
  }

  console.log('\n' + '='.repeat(72));
  console.log('WYNIK: ' + pass + ' PASS, ' + fail + ' FAIL');
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  cleanup();
  process.exit(1);
});
