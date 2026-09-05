'use strict';
/**
 * dyplo-przemarsz-checkbox-przycisk-real-render-test.cjs
 *
 * TEMAT: P-DYPLO-PRZEMARSZ-CHECKBOX-PRZYCISK-Q1
 *
 * WYZWALACZ (dosłownie, zrzut ekranu modala „Traktat przemarszu"): „Poza tym powinny być
 * zamienione na Przyciski, bo wygląda to bardziej profesjonalnie." — dot. dwóch checkboxów
 * „Wariant wojskowy (+ opłata)" i „Wspólna walka z barbarzyńcami (3 tury)" w formularzu
 * traktatu przemarszu (akcja '4', `treatySectionHtml` w `diplomacyTradeBasket.ts`).
 *
 * ZAKRES: WYŁĄCZNIE reprezentacja UI (`<input type="checkbox">` → `<button class="cdb-chip">`,
 * wzorzec identyczny z `turnChips`/`.cdb-chip-turn`, case '2'). Zero zmian w
 * `diplomacy-proposals.ts` — semantyka `state.borderMilitary`/`state.barbarianCooperation` i
 * finalny `payload.borderMilitary`/`payload.barbarianCooperation` bez zmian.
 *
 * DOWÓD — real Chromium (`page.screenshot`), R-PROC-AUTOBOT.md §9 pkt 6a, REGUŁA PRZECIW
 * SAMOOSZUKIWANIU z dyspozycji tego tematu (zakaz uznania kryterium 2/3 za spełnione na
 * podstawie samego czytania kodu):
 *   (PRZED) mutacja w locie (bundle z odtworzonym kodem SPRZED tej zmiany, kontrola
 *     nietautologiczności — `mutation.applied === 1`): modal renderuje DWA `<input
 *     type="checkbox">`, klik na etykiecie przełącza `.checked`, payload po submit ma
 *     poprawne `borderMilitary`/`barbarianCooperation`.
 *   (PO) kod bieżący (bundle z prawdziwego, niezmutowanego źródła): modal renderuje DWA
 *     `<button type="button" class="cdb-chip ...">` z tymi samymi etykietami, klik przełącza
 *     klasę `selected`, payload po submit ma te same wartości boolean przy tych samych
 *     klikach co PRZED.
 *   (C) regresja zero: case '2' (turnChips), '3' (alliance select) i '8' (trybut) nietknięte —
 *     formularze renderują się identycznie jak przed zmianą.
 *
 * ZRZUTY EKRANU → `dyspozycje/autobot/runs/P-DYPLO-PRZEMARSZ-CHECKBOX-PRZYCISK-Q1/dowody/`.
 *
 * Usage (z gra/): node tools/dyplo-przemarsz-checkbox-przycisk-real-render-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[dyplo-przemarsz-checkbox-przycisk] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.dpcp-stubs');
const ENTRY = path.resolve(__dirname, '.dpcp-entry.ts');
const BUNDLE_PO = path.resolve(__dirname, '.dpcp-bundle-po.js');
const BUNDLE_PRZED = path.resolve(__dirname, '.dpcp-bundle-przed.js');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const DIPLO_BASKET = path.resolve(GRA, 'src', 'ui', 'diplomacyTradeBasket.ts');
const SHOT_DIR = path.resolve(
  GRA, '..', 'dyspozycje', 'autobot', 'runs',
  'P-DYPLO-PRZEMARSZ-CHECKBOX-PRZYCISK-Q1', 'dowody',
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

/* Mutacja W LOCIE — odtwarza stan SPRZED tej zmiany (dwa checkboxy zamiast przycisków
 * cdb-chip). Nie dotyka repo. Kontrola nietautologiczności: liczniki w `mutation`.
 *
 * KOTWICZENIE SEMANTYCZNE (P-DYPLO-DWA-TESTY-CZERWONE-ZASTANE-Q1, 2026-09-05).
 * Poprzednia wersja kotwiczyła mutację na DOSŁOWNYCH, wielolinijkowych blokach źródła
 * (cały `body = ...` case'a '4', cały blok listenera). Wystarczyło, że sąsiedni temat
 * `R-DYPLO-WSPOLNA-WALKA-BARB-KARENCJA-Q1` dołożył do tego samego `body` linię
 * `+ barbDurationSection` i skrócił etykietę („Wspólna walka z barbarzyńcami (3 tury)" →
 * „Wspólna walka z barbarzyńcami"), żeby dopasowanie przestało trafiać: `mutation.html === 0`
 * i cała bramka kończyła się `PRZERWANE` — czyli nie mierzyła NICZEGO, mimo że sam mechanizm
 * przemarszu był sprawny. Kotwice są teraz zbudowane wyłącznie z rzeczy, które NIE zmieniają
 * się przy przesunięciu kodu:
 *   - identyfikatory elementów: `cdb-treaty-mil` / `cdb-treaty-barb`,
 *   - nazwy pól stanu: `state.borderMilitary` / `state.barbarianCooperation`,
 *   - unikalny selektor listenera: `'.cdb-treaty-mil, .cdb-treaty-barb'`.
 * Treść etykiety jest PRZECHWYTYWANA ze źródła i przenoszona do wariantu PRZED, więc zmiana
 * etykiety nie rozspaja mutacji (a asercje etykiet niżej sprawdzają rdzeń tekstu, nie sufiks
 * dopisywany/zdejmowany przez inne tematy). Koniec bloku listenera wyznacza dopasowanie
 * nawiasów, nie wcięcie ani numer linii. */
const mutation = { html: 0, read: 0, click: 0 };

/** Kotwica: przycisk chipa o danym `id`, sterowany danym polem `state.*`. Grupa 1 = etykieta. */
function chipButtonRe(id, stateProp) {
  return new RegExp(
    "\\+\\s*'<button type=\"button\" id=\"" + id + "\" class=\"cdb-chip " + id + "'"
    + "\\s*\\+\\s*\\(state\\." + stateProp + " \\? ' selected' : ''\\)"
    + "\\s*\\+\\s*'\">([\\s\\S]*?)</button>'",
  );
}
/** Wariant PRZED: natywny checkbox + `<label for>` z TĄ SAMĄ etykietą co przechwycona. */
function checkboxPrzed(id, stateProp, label) {
  return "+ '<div class=\"cdb-row\" style=\"display:flex;gap:8px;align-items:center;margin:6px 0\">'"
    + "\n        + '<input type=\"checkbox\" id=\"" + id + "\" class=\"" + id + "\"'"
    + " + (state." + stateProp + " ? ' checked' : '') + ' />'"
    + "\n        + '<label for=\"" + id + "\" style=\"margin:0\">" + label + "</label></div>'";
}
const CHIP_BUTTONS = [
  { id: 'cdb-treaty-mil', stateProp: 'borderMilitary' },
  { id: 'cdb-treaty-barb', stateProp: 'barbarianCooperation' },
];

/** Kotwica odczytu: `state.<pole> = ...classList.contains('selected')` dla danego selektora. */
function selectedReadRe(stateProp, id) {
  return new RegExp(
    "state\\." + stateProp + "\\s*=\\s*document\\.querySelector\\('\\." + id + "'\\)"
    + "\\?\\.classList\\.contains\\('selected'\\)\\s*\\?\\?\\s*false;",
  );
}
function checkedReadPrzed(stateProp, id) {
  return "state." + stateProp + " = (document.querySelector('." + id
    + "') as HTMLInputElement)?.checked ?? false;";
}

/** Wycina blok `<anchor>...(...)` dopasowując nawiasy — odporne na wcięcie i treść ciała. */
const CLICK_ANCHOR = "box.querySelectorAll('.cdb-treaty-mil, .cdb-treaty-barb').forEach(";
function cutBalancedCall(src, anchor) {
  const start = src.indexOf(anchor);
  if (start < 0) return null;
  let i = start + anchor.length - 1; // stoi na '(' z `.forEach(`
  let depth = 0;
  for (; i < src.length; i++) {
    if (src[i] === '(') depth++;
    else if (src[i] === ')') { depth--; if (depth === 0) { i++; break; } }
  }
  if (depth !== 0) return null;
  if (src[i] === ';') i++;
  return src.slice(0, start) + src.slice(i);
}

const revertFixPlugin = {
  name: 'revert-przemarsz-checkbox-fix',
  setup(build) {
    build.onLoad({ filter: /diplomacyTradeBasket\.ts$/ }, (args) => {
      if (path.resolve(args.path) !== DIPLO_BASKET) return null;
      let src = fs.readFileSync(args.path, 'utf8');

      // (1) HTML: `<button class="cdb-chip ...">` → `<input type="checkbox">` + `<label for>`.
      for (const btn of CHIP_BUTTONS) {
        const re = chipButtonRe(btn.id, btn.stateProp);
        const m = src.match(re);
        if (!m) continue;
        src = src.replace(re, () => checkboxPrzed(btn.id, btn.stateProp, m[1]));
        mutation.html++;
      }

      // (2) Odczyt: klasa `selected` → natywne `.checked`.
      for (const btn of CHIP_BUTTONS) {
        const re = selectedReadRe(btn.stateProp, btn.id);
        if (!re.test(src)) continue;
        src = src.replace(re, checkedReadPrzed(btn.stateProp, btn.id));
        mutation.read++;
      }

      // (3) Klik-handler przycisku (PO) znika przy PRZED — checkbox przełącza się natywnie,
      //     a stan i tak czytany jest z `.checked` przy składaniu payloadu.
      const cut = cutBalancedCall(src, CLICK_ANCHOR);
      if (cut !== null) { src = cut; mutation.click++; }

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
      ...(mutate ? [revertFixPlugin] : []),
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
    console.log('[dyplo-przemarsz-checkbox-przycisk] domyslny Chromium niedostepny, fallback na', FALLBACK_CHROME);
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
        actions: [
          { id: '4', label: 'Traktat przemarszu', enabled: true },
          { id: '2', label: 'Pakt nieagresji', enabled: true },
          { id: '3', label: 'Sojusz', enabled: true },
          { id: '8', label: 'Trybut', enabled: true },
        ],
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
  window.__milUi = () => {
    const box = window.__box();
    if (!box) return null;
    const milEl = box.querySelector('.cdb-treaty-mil');
    const barbEl = box.querySelector('.cdb-treaty-barb');
    return {
      milTag: milEl ? milEl.tagName : null,
      barbTag: barbEl ? barbEl.tagName : null,
      milText: milEl ? (milEl.tagName === 'INPUT'
        ? box.querySelector('label[for="cdb-treaty-mil"]').textContent
        : milEl.textContent) : null,
      barbText: barbEl ? (barbEl.tagName === 'INPUT'
        ? box.querySelector('label[for="cdb-treaty-barb"]').textContent
        : barbEl.textContent) : null,
      milOn: milEl ? (milEl.tagName === 'INPUT' ? milEl.checked : milEl.classList.contains('selected')) : null,
      barbOn: barbEl ? (barbEl.tagName === 'INPUT' ? barbEl.checked : barbEl.classList.contains('selected')) : null,
    };
  };
  /* Klik „identycznie jak dotychczasowy checkbox": na checkboxie klikamy jego <label>
   * (tak jak realny użytkownik — pole samo jest małe), na przycisku klikamy sam element. */
  window.__clickMil = () => {
    const box = window.__box();
    const el = box.querySelector('.cdb-treaty-mil');
    if (!el) return false;
    if (el.tagName === 'INPUT') box.querySelector('label[for="cdb-treaty-mil"]').click();
    else el.click();
    return true;
  };
  window.__clickBarb = () => {
    const box = window.__box();
    const el = box.querySelector('.cdb-treaty-barb');
    if (!el) return false;
    if (el.tagName === 'INPUT') box.querySelector('label[for="cdb-treaty-barb"]').click();
    else el.click();
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
  window.__turnChipsIntact = () => {
    // (C) regres case '2': turnChips (cdb-chip-turn) muszą nadal istnieć i działać.
    const box = window.__box();
    if (!box) return null;
    const chips = Array.from(box.querySelectorAll('.cdb-chip-turn')).map(c => c.getAttribute('data-turns'));
    return chips;
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
  check('(0) mutacja PRZED przywróciła OBA checkboxy (HTML) — test nie jest tautologiczny',
    mutation.html === 2, mutation.html);
  check('(0b) mutacja PRZED przywróciła OBA odczyty `.checked` — test nie jest tautologiczny',
    mutation.read === 2, mutation.read);
  check('(0c) mutacja PRZED usunęła klik-handler przycisków (kotwica `.cdb-treaty-mil, .cdb-treaty-barb`)',
    mutation.click === 1, mutation.click);
  if (mutation.html !== 2 || mutation.read !== 2 || mutation.click !== 1) {
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
    // ================= (PRZED) stan sprzed zmiany =================
    console.log('\n--- (PRZED) checkboxy — kontrola nietautologiczna ---');
    await page.setContent(blank);
    await page.addScriptTag({ path: BUNDLE_PRZED });
    await page.evaluate(pageBootstrap);
    await page.evaluate(() => window.__openAudience());
    const opened1 = await page.evaluate(() => window.__clickAction('4'));
    check('(PRZED-1) klik akcji "4" otwiera koszyk', opened1 && await page.evaluate(() => window.__basketOpen()));
    let ui = await page.evaluate(() => window.__milUi());
    check('(PRZED-2) render to <input> (checkbox), nie <button>',
      ui && ui.milTag === 'INPUT' && ui.barbTag === 'INPUT', ui);
    // Rdzeń etykiety, bez sufiksu czasu trwania: `R-DYPLO-WSPOLNA-WALKA-BARB-KARENCJA-Q1`
    // zdjął z przycisku „(3 tury)" (czas wybierają teraz chipy `.cdb-chip-barbturns`).
    check('(PRZED-3) etykiety bez zmian', ui
      && /Wariant wojskowy \(\+ opłata\)/.test(ui.milText || '')
      && /Wspólna walka z barbarzyńcami/.test(ui.barbText || ''), ui);
    check('(PRZED-4) start: oba pola OFF', ui && ui.milOn === false && ui.barbOn === false, ui);
    await shot(page, '00-przed-checkboxy.png');

    await page.evaluate(() => window.__clickMil());
    await page.evaluate(() => window.__clickBarb());
    ui = await page.evaluate(() => window.__milUi());
    check('(PRZED-5) klik → oba .checked=true', ui && ui.milOn === true && ui.barbOn === true, ui);
    await shot(page, '01-przed-checkboxy-oba-zaznaczone.png');

    await page.evaluate(() => window.__submitBasket());
    let action = await page.evaluate(() => window.__lastAction);
    check('(PRZED-6) payload: borderMilitary=true, barbarianCooperation=true',
      action && action.payload && action.payload.borderMilitary === true
      && action.payload.barbarianCooperation === true, action);

    // Drugi przebieg: tylko "mil" zaznaczony, "barb" OFF.
    await page.evaluate(() => window.__openAudience());
    await page.evaluate(() => window.__clickAction('4'));
    await page.evaluate(() => window.__clickMil());
    await page.evaluate(() => window.__submitBasket());
    action = await page.evaluate(() => window.__lastAction);
    check('(PRZED-7) payload: borderMilitary=true, barbarianCooperation=false (bez zmiany drugiego pola)',
      action && action.payload && action.payload.borderMilitary === true
      && action.payload.barbarianCooperation === false, action);

    // ================= (PO) kod bieżący =================
    console.log('\n--- (PO) przyciski cdb-chip ---');
    await page.setContent(blank);
    await page.addScriptTag({ path: BUNDLE_PO });
    await page.evaluate(pageBootstrap);
    await page.evaluate(() => window.__openAudience());
    const opened2 = await page.evaluate(() => window.__clickAction('4'));
    check('(PO-1) klik akcji "4" otwiera koszyk', opened2 && await page.evaluate(() => window.__basketOpen()));
    ui = await page.evaluate(() => window.__milUi());
    check('(PO-2) render to <button class="cdb-chip ...">, nie <input>',
      ui && ui.milTag === 'BUTTON' && ui.barbTag === 'BUTTON', ui);
    check('(PO-3) etykiety identyczne jak PRZED', ui
      && /Wariant wojskowy \(\+ opłata\)/.test(ui.milText || '')
      && /Wspólna walka z barbarzyńcami/.test(ui.barbText || ''), ui);
    check('(PO-4) start: oba przyciski BEZ klasy selected', ui && ui.milOn === false && ui.barbOn === false, ui);
    const chipClass = await page.evaluate(() => {
      const box = document.querySelector('.civ-diplo-basket');
      const mil = box.querySelector('.cdb-treaty-mil');
      return mil.classList.contains('cdb-chip');
    });
    check('(PO-4b) przycisk używa wzorca cdb-chip (ta sama klasa co turnChips case \'2\')', chipClass === true);
    await shot(page, '02-po-przyciski.png');

    await page.evaluate(() => window.__clickMil());
    await page.evaluate(() => window.__clickBarb());
    ui = await page.evaluate(() => window.__milUi());
    check('(PO-5) klik → oba dostają klasę selected (dokładnie jak PRZED-5 dawało .checked=true)',
      ui && ui.milOn === true && ui.barbOn === true, ui);
    await shot(page, '03-po-przyciski-oba-zaznaczone.png');

    await page.evaluate(() => window.__submitBasket());
    action = await page.evaluate(() => window.__lastAction);
    check('(PO-6) payload IDENTYCZNY jak PRZED-6: borderMilitary=true, barbarianCooperation=true',
      action && action.payload && action.payload.borderMilitary === true
      && action.payload.barbarianCooperation === true, action);

    await page.evaluate(() => window.__openAudience());
    await page.evaluate(() => window.__clickAction('4'));
    await page.evaluate(() => window.__clickMil());
    await page.evaluate(() => window.__submitBasket());
    action = await page.evaluate(() => window.__lastAction);
    check('(PO-7) payload IDENTYCZNY jak PRZED-7: borderMilitary=true, barbarianCooperation=false',
      action && action.payload && action.payload.borderMilitary === true
      && action.payload.barbarianCooperation === false, action);

    // Drugi klik na tym samym przycisku = odznaczenie (toggle w obie strony, jak checkbox).
    await page.evaluate(() => window.__openAudience());
    await page.evaluate(() => window.__clickAction('4'));
    await page.evaluate(() => window.__clickMil());
    await page.evaluate(() => window.__clickMil());
    ui = await page.evaluate(() => window.__milUi());
    check('(PO-8) drugi klik odznacza (toggle) — dokładnie jak checkbox', ui && ui.milOn === false, ui);

    // ================= (C) regresja zero: case '2'/'3'/'8' nietknięte =================
    console.log('\n--- (C) brak regresu na pozostałych case\'ach ---');
    await page.evaluate(() => window.__openAudience());
    await page.evaluate(() => window.__clickAction('2'));
    const napOpen = await page.evaluate(() => window.__basketOpen());
    const napChips = await page.evaluate(() => window.__turnChipsIntact());
    check('(C-1) NAP (\'2\'): koszyk się otwiera, turnChips obecne', napOpen && Array.isArray(napChips) && napChips.length > 0, napChips);
    await shot(page, '04-po-regres-nap-turnchips.png');

    await page.evaluate(() => window.__openAudience());
    await page.evaluate(() => window.__clickAction('3'));
    const allianceSelect = await page.evaluate(() => !!document.querySelector('.cdb-treaty-alliance'));
    check('(C-2) Sojusz (\'3\'): select typu sojuszu obecny, nietknięty', allianceSelect);

    await page.evaluate(() => window.__openAudience());
    await page.evaluate(() => window.__clickAction('8'));
    const tribFields = await page.evaluate(() => !!document.querySelector('.cdb-treaty-trib-mode')
      && !!document.querySelector('.cdb-treaty-gpt'));
    check('(C-3) Trybut (\'8\'): pola trybutu obecne, nietknięte', tribFields);

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
