'use strict';
/**
 * administrator-panel-real-render-test.cjs
 *
 * TEMAT: R-WEB-UI-IMPROVEMENT-AUTOMATION-LOCKED-WITHOUT-ADMIN-Q1 (DODATKI 2, 3, 4).
 * Test w PRAWDZIWYM Chromium na prawdziwych funkcjach UI (src/ui/administratorPanel.ts, src/ui/buildModeHud.ts):
 *  (A) panel wyboru administratora: opis, bonusy, koszt, utrzymanie jako chipy ikona+liczba (z JSON), brak gołych nazw
 *      surowców w widocznym tekście, escapowanie dokładnie raz, role=dialog/aria, fokus, Esc, klik w tło, Anuluj,
 *      „Zatrudnij” nieaktywne przy braku środków (z wyjaśnieniem ile brakuje; klik nie zatrudnia),
 *      zatrudnienie -> ten sam panel pokazuje stan + „Zwolnij”;
 *  (B) DANE, nie hardkod: wariant bundla z podmienionym JSON (koszt/utrzymanie/efekty) zmienia liczby w panelu;
 *  (C) panel budowy: bez działającego administratora kontrolki automatyzacji (profile, suwaki, „Własne ustawienia”,
 *      lokalny split) są disabled + aria-disabled + adnotacja „Wymaga administratora państwa”, a klik (także po
 *      zdjęciu `disabled`, tj. guard w handlerze) NIE wywołuje config.onUlepszenia*; z administratorem działają;
 *      zakres państwo/miasto (państwo zablokowane tylko gdy ŻADNE miasto nie ma działającego administratora);
 *  (D) przycisk „Administrator państwa +” otwiera panel, a klik w panel nie wychodzi z trybu budowy (onExit);
 *  (E) MUTACJE: usunięcie gatingu / usunięcie bonusów-kosztów z panelu czerwieni test (te same asercje, mutowany bundle).
 *
 * Opcjonalnie: ADM_PANEL_SHOTS_DIR=<katalog> — zrzuty ekranu.
 * Uruchomienie (z gra/): node tools/administrator-panel-real-render-test.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) { console.error('[administrator-panel] playwright missing — npm ci'); process.exit(1); }

const GRA = path.resolve(__dirname, '..');
const SHOTS_DIR = process.env.ADM_PANEL_SHOTS_DIR ? path.resolve(process.env.ADM_PANEL_SHOTS_DIR) : null;
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'adm-panel-'));
const PARAMS_PATH = path.resolve(GRA, 'data', 'city-administrator-params.json');
const PARAMS = JSON.parse(fs.readFileSync(PARAMS_PATH, 'utf8'));

function listSvgs(dir, prefix, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) listSvgs(file, prefix + entry.name + '/', out);
    else if (entry.name.endsWith('.svg')) out[prefix + entry.name] = fs.readFileSync(file, 'utf8');
  }
  return out;
}

/** Wtyczka: adaptery Vite + opcjonalne mutacje źródeł i podmiana JSON parametrów administratora. */
function makePlugin({ paramsOverride, mutations }) {
  return {
    name: 'adm-panel-compat',
    setup(build) {
      build.onResolve({ filter: /\?raw$/ }, (args) => ({
        path: path.resolve(args.resolveDir, args.path.replace(/\?raw$/, '')), namespace: 'raw-file',
      }));
      build.onLoad({ filter: /.*/, namespace: 'raw-file' }, (args) => ({ contents: fs.readFileSync(args.path, 'utf8'), loader: 'text' }));
      build.onLoad({ filter: /city-administrator-params\.json$/ }, (args) => {
        if (!paramsOverride) return null;
        return { contents: JSON.stringify(paramsOverride(JSON.parse(fs.readFileSync(args.path, 'utf8')))), loader: 'json' };
      });
      build.onLoad({ filter: /\.ts$/ }, (args) => {
        let source = fs.readFileSync(args.path, 'utf8');
        const base = path.basename(args.path);
        if (base === 'brandAssets.ts' && path.dirname(args.path) === path.resolve(GRA, 'src', 'ui', 'icons')) {
          source = source.replace(/import\.meta\.glob\('\.\/brand\/\*\*\/\*\.svg',\s*\{[\s\S]*?\}\)/,
            JSON.stringify(listSvgs(path.resolve(GRA, 'src', 'ui', 'icons', 'brand'), './brand/', {})));
        }
        for (const m of mutations || []) {
          if (base === m.file) {
            if (!source.includes(m.from)) throw new Error('mutacja nie pasuje: ' + m.from);
            source = source.replace(m.from, m.to);
          }
        }
        if (!source.includes('import.meta.glob')) return { contents: source, loader: 'ts', resolveDir: path.dirname(args.path) };
        return { contents: 'const __viteGlobStub = () => ({});\n' + source.replace(/import\.meta\.glob/g, '__viteGlobStub'), loader: 'ts', resolveDir: path.dirname(args.path) };
      });
    },
  };
}

let seq = 0;
async function bundle(opts) {
  const id = ++seq;
  const entry = path.join(TMP, `entry${id}.ts`);
  const out = path.join(TMP, `bundle${id}.js`);
  fs.writeFileSync(entry, [
    `import { openAdministratorPanel, administratorPanelInnerHtml, improvementAutomationBlockedRule } from ${JSON.stringify(GRA + '/src/ui/administratorPanel.ts')};`,
    `import { createBuildModeHud } from ${JSON.stringify(GRA + '/src/ui/buildModeHud.ts')};`,
    'window.__T = { openAdministratorPanel, administratorPanelInnerHtml, createBuildModeHud, improvementAutomationBlockedRule };',
  ].join('\n'));
  await esbuild.build({
    entryPoints: [entry], bundle: true, platform: 'browser', format: 'iife', target: 'es2020', outfile: out,
    absWorkingDir: GRA, loader: { '.ts': 'ts' }, plugins: [makePlugin(opts)], logLevel: 'silent',
  });
  return fs.readFileSync(out, 'utf8');
}

async function launch() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) { return chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] }); }
}

/** Uruchamia pakiet asercji na danym bundlu; zwraca listę wyników {name, ok, detail}. */
async function runSuite(browser, code, label) {
  const results = [];
  const check = (name, cond, detail) => results.push({ name: `[${label}] ${name}`, ok: !!cond, detail });
  const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.setContent('<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="background:#0b0f16;color:#eee;margin:0"></body></html>');
  await page.addScriptTag({ content: code });
  // R-WEB-ADMIN-NATIVE-DIALOG-Q1: panel NIE otwiera natywnych okien przeglądarki (zatrudnienie i zwolnienie są w panelu).
  // Każde natywne okno ('dialog') jest liczone (oczekiwane 0) i odrzucane.
  let nativeDialogs = 0;
  page.on('dialog', (d) => { nativeDialogs++; d.dismiss().catch(() => {}); });
  const shot = async (n) => { if (SHOTS_DIR && label === 'base') { fs.mkdirSync(SHOTS_DIR, { recursive: true }); await page.screenshot({ path: path.join(SHOTS_DIR, n) }); } };

  // ---------- (A) panel administratora państwa ----------
  const A = await page.evaluate(() => {
    const T = window.__T;
    const calls = { hire: 0, dismiss: 0, close: 0 };
    let model = { kind: 'improvements', cityName: 'Teby <b>', hired: false, working: false, hireCost: 40, upkeep: 2, treasury: 100, blockReasonText: null };
    const h = T.openAdministratorPanel({
      getModel: () => model,
      onHire: () => { calls.hire++; model = { ...model, hired: true, working: true, treasury: 60 }; return true; },
      onDismiss: () => { calls.dismiss++; model = { ...model, hired: false, working: false }; return true; },
      onClose: () => { calls.close++; },
    });
    const host = document.querySelector('.civ-adm-panel-host');
    const dlg = host && host.querySelector('[role="dialog"]');
    const r = {};
    r.open = !!dlg;
    r.aria = dlg && dlg.getAttribute('aria-modal') === 'true' && !!document.getElementById(dlg.getAttribute('aria-labelledby'));
    r.focusInside = !!dlg && dlg.contains(document.activeElement);
    r.lead = (dlg.querySelector('[data-adm-lead]') || {}).textContent || '';
    r.bonuses = (dlg.querySelector('[data-adm-bonuses]') || {}).textContent || '';
    r.cost = (dlg.querySelector('[data-adm-cost]') || {}).textContent || '';
    r.costHtml = (dlg.querySelector('[data-adm-cost]') || {}).innerHTML || '';
    r.upkeep = (dlg.querySelector('[data-adm-upkeep]') || {}).textContent || '';
    r.effects = (dlg.querySelector('[data-adm-effects]') || {}).textContent || '';
    r.chips = dlg.querySelectorAll('.bld-res-chip').length;
    r.chipIcons = dlg.querySelectorAll('.bld-res-chip svg').length;
    r.visibleText = dlg.innerText;
    r.cityEsc = (dlg.querySelector('[data-adm-city]') || {}).textContent || '';
    r.cityHtml = (dlg.querySelector('[data-adm-city]') || {}).innerHTML || '';
    r.confirmDisabled = dlg.querySelector('[data-adm-panel-confirm]').disabled;
    r.html = dlg.innerHTML;
    return { r, hasHandle: !!h };
  });
  await shot('panel-ulepszen-przed-zatrudnieniem.png');
  const r = A.r;
  check('A1 panel otwarty jako role=dialog aria-modal z tytułem, fokus w środku', r.open && r.aria && r.focusInside, r);
  check('A2 opis „czym jest / do czego służy” (zakres całego Państwa, bez JSON „w tym mieście”)', r.lead.includes('Administrator państwa to jedna osoba na całe Państwo') && r.lead.includes('dla wszystkich miast Państwa') && !r.lead.includes('w tym mieście'), r.lead);
  check('A3 bonusy ulepszeń: automatyczne ulepszanie, bez bonusów miasta (produkcja/podatki/korupcja/budynki nie występują)', /ulepszanie terenu/.test(r.bonuses) && /Nie daje żadnych dodatkowych bonusów/.test(r.bonuses) && !/produkcj|podatk|korupcj|budynk/i.test(r.bonuses), r.bonuses);
  check('A4 koszt = JSON (40) jako chip ikona+liczba', r.cost.includes(String(PARAMS.administrator_ulepszen.koszt_zatrudnienia_pieniadz)) && r.costHtml.includes('bld-res-chip') && r.costHtml.includes('<svg'), r.costHtml);
  check('A5 utrzymanie = JSON (2) na turę', r.upkeep.includes(String(PARAMS.administrator_ulepszen.utrzymanie_pieniadz_na_ture)) && /na turę/.test(r.upkeep), r.upkeep);
  check('A6 skutek: bez administratora wstrzymane + po zatrudnieniu + gdzie zwolnić', /wstrzymane/.test(r.effects) && /Po zatrudnieniu/.test(r.effects) && /Zwolnisz/.test(r.effects), r.effects);
  check('A7 min. 2 chipy z ikoną SVG', r.chips >= 2 && r.chipIcons >= 2, { chips: r.chips, icons: r.chipIcons });
  check('A8 brak gołej nazwy surowca „Pieniądz” w widocznym tekście', !/Pieni[aą]dz/.test(r.visibleText), r.visibleText);
  check('A9 escapowanie dokładnie raz (nazwa miasta jako tekst, brak &lt;span)', r.cityEsc.includes('Teby <b>') && !r.html.includes('&lt;span') && !r.html.includes('&amp;lt;') && !r.html.includes('&amp;amp;'), r.cityHtml);
  check('A10 Zatrudnij aktywne gdy stać', r.confirmDisabled === false);

  // brak środków
  const B = await page.evaluate(() => {
    document.querySelector('.civ-adm-panel-host')?.remove();
    const T = window.__T; const calls = { hire: 0 };
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    const model = { kind: 'improvements', cityName: 'Teby', hired: false, working: false, hireCost: 40, upkeep: 2, treasury: 12, blockReasonText: null };
    T.openAdministratorPanel({ getModel: () => model, onHire: () => { calls.hire++; return true; }, onDismiss: () => false });
    const dlg = document.querySelector('.civ-adm-panel');
    const btn = dlg.querySelector('[data-adm-panel-confirm]');
    const disabled = btn.disabled && btn.getAttribute('aria-disabled') === 'true';
    btn.removeAttribute('disabled'); btn.click(); // guard w handlerze, nie tylko disabled
    const sf = dlg.querySelector('[data-adm-shortfall]');
    return { disabled, hire: calls.hire, shortfall: sf ? sf.textContent : null, shortfallHtml: sf ? sf.innerHTML : null };
  });
  await shot('panel-ulepszen-brak-srodkow.png');
  check('A11 brak środków: Zatrudnij nieaktywne, klik nie zatrudnia, komunikat ile brakuje (28)', B.disabled && B.hire === 0 && B.shortfall && B.shortfall.includes('28') && /Brakuje/.test(B.shortfall), B);

  // zatrudnienie: JEDEN klik w „Zatrudnij” w panelu = zatrudniony; zero okien natywnych (window.confirm)
  const H = await page.evaluate(() => {
    document.querySelector('.civ-adm-panel-host')?.remove();
    const T = window.__T; const calls = { hire: 0 };
    const mk = (kind) => ({ kind, cityName: 'Teby', hired: false, working: false, hireCost: 40, upkeep: 2, treasury: 100, tier: 2, blockReasonText: null });
    const out = {};
    for (const kind of ['improvements', 'city']) {
      let model = mk(kind);
      T.openAdministratorPanel({ getModel: () => model, onHire: () => { calls.hire++; model = { ...model, hired: true, working: true }; return true; }, onDismiss: () => false });
      const dlg = () => document.querySelector('.civ-adm-panel');
      dlg().querySelector('[data-adm-panel-confirm]').click();
      out[kind] = { hire: calls.hire, hired: dlg().getAttribute('data-adm-hired') };
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      calls.hire = 0;
    }
    return out;
  });
  check('A11b zatrudnienie (ulepszenia) jednym kliknięciem „Zatrudnij”: zatrudniony, bez okna natywnego', H.improvements.hire === 1 && H.improvements.hired === '1', H.improvements);
  check('A11c zatrudnienie (miasto) jednym kliknięciem „Zatrudnij”: zatrudniony, bez okna natywnego', H.city.hire === 1 && H.city.hired === '1', H.city);
  check('A11d brak natywnych okien (Playwright dialog) w całym przebiegu panelu administratora (oczekiwane 0)', nativeDialogs === 0, { nativeDialogs });

  // Obrona r1 (R-WEB-ADMIN-NATIVE-DIALOG-AND-TEXT-SPLIT-Q1): przed kliknięciem „Zatrudnij” panel mówi, że koszt jest jednorazowy i nie wraca;
  // lead miasta (wyrenderowany, nie tylko regex na źródle) wymaga budynku administracyjnego i nie opisuje ulepszeń terenu.
  const U = await page.evaluate(() => {
    document.querySelector('.civ-adm-panel-host')?.remove();
    const T = window.__T;
    const out = {};
    for (const kind of ['improvements', 'city']) {
      T.openAdministratorPanel({ getModel: () => ({ kind, cityName: 'Teby', hired: false, working: false, hireCost: 40, upkeep: 2, treasury: 100, tier: 2, blockReasonText: null }), onHire: () => true, onDismiss: () => true });
      const dlg = document.querySelector('.civ-adm-panel');
      out[kind] = { lead: (dlg.querySelector('[data-adm-lead]') || {}).textContent || '', effects: (dlg.querySelector('[data-adm-effects]') || {}).textContent || '' };
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    }
    return out;
  });
  check('A11e przed zatrudnieniem (ulepszenia): panel mówi, że koszt jest jednorazowy i nie wraca', /nie wraca/.test(U.improvements.effects), U.improvements.effects);
  check('A11f przed zatrudnieniem (miasto): panel mówi, że koszt jest jednorazowy i nie wraca', /nie wraca/.test(U.city.effects), U.city.effects);
  check('A11g lead miasta (renderowany): wymaga budynku administracyjnego, bez ulepszeń terenu', /budynku administracyjnego/.test(U.city.lead) && !/ulepszani|wycink|farm/i.test(U.city.lead), U.city.lead);

  // zatrudnienie, Zwolnij, zamykanie
  const C = await page.evaluate(() => {
    document.querySelector('.civ-adm-panel-host')?.remove();
    const T = window.__T; const calls = { hire: 0, dismiss: 0, close: 0 };
    let model = { kind: 'improvements', cityName: 'Teby', hired: false, working: false, hireCost: 40, upkeep: 2, treasury: 100, blockReasonText: null };
    T.openAdministratorPanel({
      getModel: () => model,
      onHire: () => { calls.hire++; model = { ...model, hired: true, working: true }; return true; },
      onDismiss: () => { calls.dismiss++; model = { ...model, hired: false, working: false }; return true; },
      onClose: () => { calls.close++; },
    });
    const dlg = () => document.querySelector('.civ-adm-panel');
    dlg().querySelector('[data-adm-panel-confirm]').click();
    const afterHire = { hired: dlg().getAttribute('data-adm-hired'), hasDismiss: !!dlg().querySelector('[data-adm-panel-dismiss]'), status: dlg().querySelector('[data-adm-status]').textContent, effects: dlg().querySelector('[data-adm-effects]').textContent };
    const beforeDismiss = { hired: dlg().getAttribute('data-adm-hired'), warnsNoRefund: /nie wraca/.test(dlg().querySelector('[data-adm-effects]').textContent) };
    // R-WEB-UI-ADMIN-DISMISS-CONFIRM-Q1: pierwszy klik „Zwolnij” tylko pokazuje krok potwierdzenia (bez zwolnienia).
    dlg().querySelector('[data-adm-panel-dismiss]').click();
    const afterFirstClick = { dismissCalls: calls.dismiss, hasYes: !!dlg().querySelector('[data-adm-dismiss-yes]') };
    dlg().querySelector('[data-adm-dismiss-yes]').click();
    const afterDismiss = { hired: dlg().getAttribute('data-adm-hired'), hasConfirm: !!dlg().querySelector('[data-adm-panel-confirm]') };
    // Esc zamyka
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    const escClosed = !document.querySelector('.civ-adm-panel-host');
    // klik w tło zamyka
    T.openAdministratorPanel({ getModel: () => model, onHire: () => true, onDismiss: () => true, onClose: () => { calls.close++; } });
    document.querySelector('[data-adm-panel-back]').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    const backClosed = !document.querySelector('.civ-adm-panel-host');
    // Anuluj zamyka
    T.openAdministratorPanel({ getModel: () => model, onHire: () => true, onDismiss: () => true, onClose: () => { calls.close++; } });
    document.querySelector('[data-adm-panel-cancel]:not(.civ-adm-panel-x)').click();
    const cancelClosed = !document.querySelector('.civ-adm-panel-host');
    // R-WEB-UI-ADMIN-DISMISS-CONFIRM-Q1: Anuluj w kroku potwierdzenia nie zwalnia; Esc w kroku zamyka panel bez zwolnienia.
    const callsA14 = { ...calls };
    model = { ...model, hired: true, working: true };
    const dismissBefore = calls.dismiss;
    T.openAdministratorPanel({ getModel: () => model, onHire: () => true, onDismiss: () => { calls.dismiss++; return true; }, onClose: () => { calls.close++; } });
    dlg().querySelector('[data-adm-panel-dismiss]').click();
    dlg().querySelector('[data-adm-dismiss-no]').click();
    const afterCancel = { dismissCalls: calls.dismiss - dismissBefore, hired: model.hired, hasYes: !!dlg().querySelector('[data-adm-dismiss-yes]'), hasDismissBtn: !!dlg().querySelector('[data-adm-panel-dismiss]'), stillOpen: !!document.querySelector('.civ-adm-panel-host') };
    dlg().querySelector('[data-adm-panel-dismiss]').click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    const escInConfirm = { dismissCalls: calls.dismiss - dismissBefore, hired: model.hired, closed: !document.querySelector('.civ-adm-panel-host') };
    return { calls: callsA14, afterHire, afterFirstClick, afterDismiss, beforeDismiss, escClosed, backClosed, cancelClosed, afterCancel, escInConfirm };
  });
  check('A12 po zatrudnieniu ten sam panel: stan, „Zwolnij”, utrzymanie', C.calls.hire === 1 && C.afterHire.hired === '1' && C.afterHire.hasDismiss && /Zatrudniony/.test(C.afterHire.status) && /Utrzymanie/.test(C.afterHire.effects), C);
  check('A13 Zwolnij (po potwierdzeniu „Zwolnij” w oknie) wywołuje onDismiss i wraca do stanu niezatrudnionego', C.calls.dismiss === 1 && C.afterDismiss.hired === '0' && C.afterDismiss.hasConfirm, C);
  check('A13a pierwszy klik „Zwolnij” NIE zwalnia: pokazuje krok potwierdzenia z „Zwolnij”/„Anuluj”', C.afterFirstClick.dismissCalls === 0 && C.afterFirstClick.hasYes, C.afterFirstClick);
  check('A13b „Zwolnij” w panelu (bez okna natywnego, dwuetapowo): przed kliknięciem zatrudniony, panel mówi, że koszt nie wraca', C.beforeDismiss.hired === '1' && C.beforeDismiss.warnsNoRefund, C.beforeDismiss);
  check('A13c Anuluj w kroku potwierdzenia NIE zwalnia: 0 wywołań onDismiss, nadal zatrudniony, panel otwarty, wraca stopka „Zwolnij”', C.afterCancel.dismissCalls === 0 && C.afterCancel.hired === true && !C.afterCancel.hasYes && C.afterCancel.hasDismissBtn && C.afterCancel.stillOpen, C.afterCancel);
  check('A13d Esc w kroku potwierdzenia zamyka panel BEZ zwolnienia (0 wywołań onDismiss)', C.escInConfirm.dismissCalls === 0 && C.escInConfirm.hired === true && C.escInConfirm.closed, C.escInConfirm);
  check('A14 Esc, klik w tło i Anuluj zamykają panel (onClose x3)', C.escClosed && C.backClosed && C.cancelClosed && C.calls.close === 3, C);
  await page.waitForTimeout(150); // zdarzenia 'dialog' docierają asynchronicznie — daj im czas przed oceną
  check('A15 brak natywnych okien (Playwright dialog) po zwolnieniu i zamknięciach (oczekiwane 0)', nativeDialogs === 0, { nativeDialogs });

  // administrator miasta: bonusy ze skali poziomu
  const D = await page.evaluate(() => {
    document.querySelector('.civ-adm-panel-host')?.remove();
    const T = window.__T;
    T.openAdministratorPanel({ getModel: () => ({ kind: 'city', cityName: 'Memfis', hired: false, working: false, hireCost: 40, upkeep: 3, treasury: 500, tier: 2, blockReasonText: null }), onHire: () => true, onDismiss: () => true });
    const dlg = document.querySelector('.civ-adm-panel');
    return { bonuses: dlg.querySelector('[data-adm-bonuses]').textContent, text: dlg.innerText };
  });
  await shot('panel-miasta-poziom-2.png');
  const fmt = (v) => String(Math.round(v * 1.5 * 100) / 100).replace('.', ',');
  const eb = PARAMS.efekty_bazowe;
  check('B1 administrator miasta: bonusy = JSON × skala poziomu 2 (korupcja/produkcja/podatki)', D.bonuses.includes('−' + fmt(eb.korupcja_redukcja_pct) + '%') && D.bonuses.includes('+' + fmt(eb.produkcja_miasta_pct) + '%') && D.bonuses.includes('+' + fmt(eb.sciagalnosc_podatkow_miasta_pct) + '%') && /automatyczna budowa|Automatyczna budowa/.test(D.bonuses), D.bonuses);

  // ---------- (C) panel budowy: blokada bez administratora ----------
  const hudRun = async (scenario) => page.evaluate((sc) => {
    document.querySelectorAll('.civ-build-panel,.civ-build-banner,.civ-build-lock-tip,.civ-adm-panel-host').forEach((n) => n.remove());
    const calls = [];
    const rec = (n) => (...a) => { calls.push(n + ':' + a.join(',')); };
    const adm = sc.adm; // cityId -> {hired, working}
    const stateFor = (id) => { const s = adm[id]; return s ? { hired: s.hired, working: s.working, upkeep: 2, hireCost: 40, blockReasonText: null, description: 'd', treasury: 100, blockReason: null } : null; };
    let exitCalls = 0;
    const cfg = {
      listTypes: () => [], getActiveKey: () => null, onSelectType: () => {}, onExit: () => { exitCalls++; }, isOpen: () => true,
      listPlayerCities: () => [{ id: 'a', name: 'Alfa' }, { id: 'b', name: 'Beta' }],
      isAutoBuildEnabled: () => true,
      getUlepszeniaCityId: () => sc.selected,
      getUlepszeniaEmpireState: () => ({ focus: 'zywnosc', tryb: 'auto', pracaAutoPercent: 50 }),
      getUlepszeniaCityOverride: () => !!sc.override,
      getUlepszeniaEffectiveState: () => ({ focus: 'zywnosc', tryb: 'auto', pracaAutoPercent: 40, override: !!sc.override }),
      getImprovementAdministratorState: stateFor,
      onHireImprovementAdministrator: (id) => { calls.push('hire:' + id); adm[id] = { hired: true, working: true }; return true; },
      onDismissImprovementAdministrator: (id) => { calls.push('dismiss:' + id); adm[id] = { hired: false, working: false }; return true; },
      onUlepszeniaCityIdChange: rec('cityId'),
      onUlepszeniaEmpireFocusChange: rec('empireFocus'), onUlepszeniaEmpireTrybChange: rec('empireTryb'), onUlepszeniaEmpirePracaPercentChange: rec('empirePct'),
      onUlepszeniaCityOverrideChange: rec('cityOverride'), onUlepszeniaCityFocusChange: rec('cityFocus'), onUlepszeniaCityTrybChange: rec('cityTryb'), onUlepszeniaCityPracaPercentChange: rec('cityPct'),
    };
    const hud = window.__T.createBuildModeHud(cfg);
    const q = (s) => Array.from(hud.el.querySelectorAll(s));
    const info = () => ({
      empireBtns: q('[data-ulepszenia-empire-focus],[data-ulepszenia-empire-reczny]').map((b) => ({ d: b.disabled, a: b.getAttribute('aria-disabled') })),
      cityBtns: q('[data-ulepszenia-city-focus],[data-ulepszenia-city-reczny]').map((b) => ({ d: b.disabled, a: b.getAttribute('aria-disabled') })),
      empireSlider: (hud.el.querySelector('[data-ulepszenia-empire-percent]') || {}).disabled,
      citySlider: (hud.el.querySelector('[data-ulepszenia-city-percent]') || {}).disabled,
      override: (hud.el.querySelector('[data-ulepszenia-city-override]') || {}).disabled,
      noteEmpire: !!hud.el.querySelector('[data-ulepszenia-locked-note="empire"]'),
      noteCity: !!hud.el.querySelector('[data-ulepszenia-locked-note="city"]'),
      text: hud.el.innerText,
    });
    const before = info();
    // próba zmiany stanu: klik w KAŻDĄ kontrolkę, także po zdjęciu `disabled` (guard w handlerze)
    const force = (el) => { el.removeAttribute('disabled'); el.click(); };
    q('[data-ulepszenia-empire-focus],[data-ulepszenia-empire-reczny],[data-ulepszenia-city-focus],[data-ulepszenia-city-reczny],[data-ulepszenia-city-override]').forEach(force);
    for (const sel of ['[data-ulepszenia-empire-percent]', '[data-ulepszenia-city-percent]']) {
      const s = hud.el.querySelector(sel); if (s) { s.removeAttribute('disabled'); s.value = '77'; s.dispatchEvent(new Event('change', { bubbles: true })); }
    }
    return { before, calls: calls.slice(), exitCalls, hudAvailable: true };
  }, scenario);

  const L1 = await hudRun({ adm: { a: { hired: false, working: false }, b: { hired: false, working: false } }, selected: 'a', override: true });
  await shot('panel-budowy-bez-administratora.png'); // (zrzut ostatniego renderu nie jest dostępny po remove — patrz niżej)
  check('C1 bez administratora (żadne miasto): kontrolki PAŃSTWA i MIASTA disabled + aria-disabled',
    L1.before.empireBtns.length > 0 && L1.before.empireBtns.every((b) => b.d && b.a === 'true')
    && L1.before.cityBtns.length > 0 && L1.before.cityBtns.every((b) => b.d && b.a === 'true')
    && L1.before.empireSlider === true && L1.before.citySlider === true && L1.before.override === true, L1.before);
  check('C2 adnotacja „Wymaga administratora państwa” (państwo i miasto)', L1.before.noteEmpire && L1.before.noteCity && L1.before.text.includes('Wymaga administratora państwa'), L1.before.text);
  check('C3 klik/zmiana (także po zdjęciu disabled) NIE wywołuje żadnego config.onUlepszenia*', L1.calls.length === 0, L1.calls);

  const L2 = await hudRun({ adm: { a: { hired: true, working: true }, b: { hired: true, working: true } }, selected: 'a', override: true });
  await shot('panel-budowy-z-administratorem.png');
  check('C4 z administratorem kontrolki aktywne', L2.before.empireBtns.every((b) => !b.d) && L2.before.cityBtns.every((b) => !b.d) && L2.before.empireSlider === false && L2.before.citySlider === false && L2.before.override === false && !L2.before.noteEmpire && !L2.before.noteCity, L2.before);
  check('C5 z administratorem klik wywołuje callbacki (focus/tryb/%/override, państwo i miasto)',
    ['empireFocus', 'empireTryb', 'empirePct', 'cityFocus', 'cityTryb', 'cityPct', 'cityOverride'].every((n) => L2.calls.some((c) => c.startsWith(n + ':'))), L2.calls);

  const L3 = await hudRun({ adm: { a: { hired: true, working: true }, b: { hired: false, working: false } }, selected: 'b', override: true });
  check('C6 zakres: wybrane miasto bez administratora zablokowane, państwo aktywne (inne miasto ma administratora)',
    L3.before.cityBtns.every((b) => b.d) && L3.before.empireBtns.every((b) => !b.d) && L3.before.noteCity && !L3.before.noteEmpire, L3.before);
  check('C7 w tym zakresie callbacki państwa działają, miasta nie',
    L3.calls.some((c) => c.startsWith('empireFocus:')) && !L3.calls.some((c) => c.startsWith('city')), L3.calls);

  const L4 = await hudRun({ adm: { a: { hired: true, working: false }, b: { hired: false, working: false } }, selected: 'a', override: false });
  check('C8 administrator zatrudniony, ale nie pracuje (brak środków) = też zablokowane', L4.before.empireBtns.every((b) => b.d) && L4.before.noteEmpire && L4.calls.length === 0, L4);

  // (D) przycisk administratora otwiera panel; klik w panel nie wychodzi z trybu budowy
  const E = await page.evaluate(() => {
    document.querySelectorAll('.civ-build-panel,.civ-build-banner,.civ-build-lock-tip,.civ-adm-panel-host').forEach((n) => n.remove());
    const adm = { a: { hired: false, working: false }, b: { hired: false, working: false } };
    let exitCalls = 0; const calls = [];
    const cfg = {
      listTypes: () => [], getActiveKey: () => null, onSelectType: () => {}, onExit: () => { exitCalls++; }, isOpen: () => true,
      listPlayerCities: () => [{ id: 'a', name: 'Alfa' }], isAutoBuildEnabled: () => true,
      getUlepszeniaCityId: () => 'a',
      getUlepszeniaEmpireState: () => ({ focus: 'zywnosc', tryb: 'reczny', pracaAutoPercent: 50 }),
      getUlepszeniaCityOverride: () => false,
      getUlepszeniaEffectiveState: () => ({ focus: 'zywnosc', tryb: 'reczny', pracaAutoPercent: 50, override: false }),
      getImprovementAdministratorState: (id) => ({ ...adm[id], upkeep: 2, hireCost: 40, blockReasonText: null, description: 'd', treasury: 100, blockReason: null }),
      onHireImprovementAdministrator: (id) => { calls.push('hire'); adm[id] = { hired: true, working: true }; return true; },
      onDismissImprovementAdministrator: (id) => { calls.push('dismiss'); adm[id] = { hired: false, working: false }; return true; },
    };
    const hud = window.__T.createBuildModeHud(cfg);
    const btn = hud.el.querySelector('[data-imp-admin-open]');
    const btnInfo = { label: btn.textContent.trim(), title: btn.getAttribute('title'), disabled: btn.disabled };
    const hireBefore = calls.length;
    btn.click();
    const opened = !!document.querySelector('.civ-adm-panel[data-adm-kind="improvements"]');
    const hiredImmediately = calls.length !== hireBefore; // przycisk NIE zatrudnia od razu
    // klik wewnątrz panelu (pointerdown w capture jak w buildModeHud) — nie może wyjść z trybu budowy
    const dlg = document.querySelector('.civ-adm-panel');
    dlg.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    const exitAfterPanelClick = exitCalls;
    document.querySelector('[data-adm-panel-confirm]').click();
    const hiredState = adm.a.hired;
    const dismissVisible = !!document.querySelector('[data-adm-panel-dismiss]');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    const closed = !document.querySelector('.civ-adm-panel-host');
    const afterBtn = hud.el.querySelector('[data-imp-admin-open]');
    return { btnInfo, opened, hiredImmediately, exitAfterPanelClick, calls, hiredState, dismissVisible, closed, afterLabel: afterBtn && afterBtn.textContent.trim() };
  });
  check('D1 przycisk „Administrator państwa +” z tooltipem „Wybierz administratora — koszt, utrzymanie”', /Administrator państwa \+/.test(E.btnInfo.label) && /Wybierz administratora/.test(E.btnInfo.title) && /koszt 40/.test(E.btnInfo.title) && /utrzymanie 2/.test(E.btnInfo.title) && !E.btnInfo.disabled, E.btnInfo);
  check('D2 klik otwiera panel i NIE zatrudnia od razu', E.opened && !E.hiredImmediately, E);
  check('D3 klik w panel nie wychodzi z trybu budowy (onExit = 0)', E.exitAfterPanelClick === 0, E);
  check('D4 „Zatrudnij” w panelu wykonuje onHire; panel pokazuje Zwolnij; Esc zamyka; przycisk zmienia się na ✓', E.calls.join() === 'hire' && E.hiredState === true && E.dismissVisible && E.closed && /✓/.test(E.afterLabel || ''), E);

  // G: czysta reguła guardu main.ts (improvementAutomationBlockedRule) — niezależny dowód mutacyjny ścieżki programowej
  const G = await page.evaluate(() => {
    const r = window.__T.improvementAutomationBlockedRule;
    return {
      offNever: r(false, 'city', null, []) === false && r(false, 'empire', null, [false]) === false,
      cityNoAdmin: r(true, 'city', { mine: true, working: false }, [false]) === true,
      cityUnknown: r(true, 'city', null, [true]) === true,
      cityForeign: r(true, 'city', { mine: false, working: true }, [true]) === true,
      cityOk: r(true, 'city', { mine: true, working: true }, [true]) === false,
      empNone: r(true, 'empire', null, [false, false]) === true,
      empOne: r(true, 'empire', null, [false, true]) === false,
      empNoCities: r(true, 'empire', null, []) === false,
    };
  });
  check('G1 reguła guardu (main.ts): miasto bez działającego administratora zablokowane, z nim nie; opcja OFF nie blokuje', G.offNever && G.cityNoAdmin && G.cityUnknown && G.cityForeign && G.cityOk, G);
  check('G2 reguła guardu: państwo zablokowane tylko gdy ŻADNE miasto nie ma administratora', G.empNone && G.empOne && G.empNoCities, G);

  check('Z0 brak błędów strony', errors.length === 0, errors);
  await page.close();
  return results;
}

/** Pakiet na zmutowanym bundlu: wyjątek (np. brak elementu) też oznacza „czerwony” — liczy się jako FAIL mutacji. */
async function mutSuite(browser, code, label) {
  try { return await runSuite(browser, code, label); }
  catch (e) { return [{ name: `[${label}] wyjątek: ${String(e.message).split('\n')[0]}`, ok: false }]; }
}

async function main() {
  const browser = await launch();
  let allResults = [];
  try {
    const base = await bundle({});
    allResults = allResults.concat(await runSuite(browser, base, 'base'));

    // (B) DANE: podmiana JSON zmienia liczby w panelu
    const patched = await bundle({
      paramsOverride: (j) => {
        j.koszt_zatrudnienia_pieniadz = 77;
        j.administrator_ulepszen.koszt_zatrudnienia_pieniadz = 77;
        j.administrator_ulepszen.utrzymanie_pieniadz_na_ture = 9;
        j.efekty_bazowe.korupcja_redukcja_pct = 14;
        return j;
      },
    });
    const pg = await browser.newPage();
    await pg.setContent('<!DOCTYPE html><html><body></body></html>');
    await pg.addScriptTag({ content: patched });
    const dat = await pg.evaluate(() => {
      const T = window.__T;
      const imp = T.administratorPanelInnerHtml({ kind: 'improvements', cityName: 'X', hired: false, working: false, hireCost: 77, upkeep: 9, treasury: 100, blockReasonText: null });
      const city = T.administratorPanelInnerHtml({ kind: 'city', cityName: 'X', hired: false, working: false, hireCost: 77, upkeep: 2, treasury: 100, tier: 1, blockReasonText: null });
      const strip = (h) => h.replace(/<[^>]+>/g, ' ');
      return { imp: strip(imp), city: strip(city) };
    });
    await pg.close();
    allResults.push({ name: '[data] opis zakresu Państwa idzie do panelu (nie JSON „w tym mieście”)', ok: dat.imp.includes('Administrator państwa to jedna osoba na całe Państwo') && !dat.imp.includes('w tym mieście'), detail: dat.imp });
    allResults.push({ name: '[data] model z koszt/utrzymanie 77/9 -> liczby 77 i 9 w panelu', ok: /\b77\b/.test(dat.imp) && /\b9\b/.test(dat.imp), detail: dat.imp });
    allResults.push({ name: '[data] podmieniony JSON efekty_bazowe.korupcja 14% -> panel miasta pokazuje −14%', ok: dat.city.includes('−14%'), detail: dat.city });

    // (E) MUTACJE
    const mutGate = await bundle({ mutations: [{ file: 'buildModeHud.ts', from: 'return st !== null && !st.working;', to: 'return false;' }] });
    const gateRes = await mutSuite(browser, mutGate, 'mut-gate');
    const gateFail = gateRes.filter((x) => !x.ok).length;
    allResults.push({ name: '[E1 mutacja] usunięcie gatingu MIASTA czerwieni test (>=1 FAIL)', ok: gateFail >= 1, detail: gateRes.filter((x) => !x.ok).map((x) => x.name) });
    const mutEmpire = await bundle({ mutations: [{ file: 'buildModeHud.ts', from: 'return st !== null && !st.working;\n    });', to: 'return false;\n    });' }] });
    const empRes = await mutSuite(browser, mutEmpire, 'mut-empire');
    allResults.push({ name: '[E2 mutacja] usunięcie gatingu PAŃSTWA czerwieni test (>=1 FAIL)', ok: empRes.filter((x) => !x.ok).length >= 1, detail: empRes.filter((x) => !x.ok).map((x) => x.name) });
    const mutGuard = await bundle({ mutations: [{ file: 'buildModeHud.ts', from: 'if (focus && !empireImprovementAutomationLocked()) config.onUlepszeniaEmpireFocusChange?.(focus);', to: 'if (focus) config.onUlepszeniaEmpireFocusChange?.(focus);' }] });
    const grdRes = await mutSuite(browser, mutGuard, 'mut-guard');
    allResults.push({ name: '[E3 mutacja] usunięcie guardu w handlerze (bez disabled) czerwieni test (C3)', ok: grdRes.some((x) => !x.ok && /C3/.test(x.name)), detail: grdRes.filter((x) => !x.ok).map((x) => x.name) });
    const mutPanel = await bundle({ mutations: [{ file: 'administratorPanel.ts', from: '`<div data-adm-cost>Zatrudnienie (jednorazowo): <b>${costChip}</b></div>`', to: "''" }] });
    const pnlRes = await mutSuite(browser, mutPanel, 'mut-panel');
    allResults.push({ name: '[E4 mutacja] usunięcie kosztu z panelu czerwieni test', ok: pnlRes.filter((x) => !x.ok).length >= 1, detail: pnlRes.filter((x) => !x.ok).map((x) => x.name) });
    const mutBonus = await bundle({ mutations: [{ file: 'administratorPanel.ts', from: 'html += `<ul class="civ-adm-panel-list" data-adm-bonuses>${bonusRows(m)}</ul>`;', to: '' }] });
    const bnsRes = await mutSuite(browser, mutBonus, 'mut-bonus');
    allResults.push({ name: '[E5 mutacja] usunięcie bonusów z panelu czerwieni test', ok: bnsRes.filter((x) => !x.ok).length >= 1, detail: bnsRes.filter((x) => !x.ok).map((x) => x.name) });
    const mutRuleCity = await bundle({ mutations: [{ file: 'administratorPanel.ts', from: 'return !city || !city.mine || !city.working;', to: 'return false;' }] });
    const rcRes = await mutSuite(browser, mutRuleCity, 'mut-rule-city');
    allResults.push({ name: '[E6 mutacja] usunięcie reguły guardu MIASTA (ścieżka programowa main.ts) czerwieni test (G1)', ok: rcRes.some((x) => !x.ok && /G1/.test(x.name)), detail: rcRes.filter((x) => !x.ok).map((x) => x.name) });
    const mutRuleEmp = await bundle({ mutations: [{ file: 'administratorPanel.ts', from: 'return myCitiesWorking.length > 0 && !myCitiesWorking.some(Boolean);', to: 'return false;' }] });
    const reRes = await mutSuite(browser, mutRuleEmp, 'mut-rule-emp');
    allResults.push({ name: '[E7 mutacja] usunięcie reguły guardu PAŃSTWA czerwieni test (G2)', ok: reRes.some((x) => !x.ok && /G2/.test(x.name)), detail: reRes.filter((x) => !x.ok).map((x) => x.name) });
    const mutHire = await bundle({ mutations: [{ file: 'administratorPanel.ts', from: 'hooks.onHire();', to: "window.confirm('Zatrudnić?'); hooks.onHire();" }] });
    const mhRes = await mutSuite(browser, mutHire, 'mut-hire');
    allResults.push({ name: '[E8 mutacja] przywrócenie window.confirm przy zatrudnieniu czerwieni test (A11d)', ok: mhRes.some((x) => !x.ok && /A11d/.test(x.name)), detail: mhRes.filter((x) => !x.ok).map((x) => x.name) });
    const mutDismiss = await bundle({ mutations: [{ file: 'administratorPanel.ts', from: 'hooks.onDismiss();', to: "window.confirm('Zwolnić?'); hooks.onDismiss();" }] });
    const mdRes = await mutSuite(browser, mutDismiss, 'mut-dismiss');
    allResults.push({ name: '[E9 mutacja] przywrócenie window.confirm przy zwolnieniu czerwieni test (A15)', ok: mdRes.some((x) => !x.ok && /A15/.test(x.name)), detail: mdRes.filter((x) => !x.ok).map((x) => x.name) });

    // (F) statycznie: main.ts — każdy z 7 setterów polityki ulepszeń woła guard, a guard deleguje do reguły
    const mainSrc = fs.readFileSync(path.resolve(GRA, 'src', 'main.ts'), 'utf8');
    const guardCalls = (mainSrc.match(/if \(improvementAutomationChangeBlocked\('(empire|city)'/g) || []).length;
    allResults.push({ name: '[F1] main.ts: 7 setterów polityki ulepszeń ma guard improvementAutomationChangeBlocked', ok: guardCalls === 7, detail: guardCalls });
    allResults.push({ name: '[F2] main.ts: guard deleguje do improvementAutomationBlockedRule', ok: /return improvementAutomationBlockedRule\(/.test(mainSrc), detail: null });
  } finally {
    await browser.close();
  }
  let pass = 0, fail = 0;
  for (const x of allResults) {
    if (x.name.startsWith('[mut-')) { continue; } // wyniki podsuite mutacji pokazuje tylko podsumowanie E*
    if (x.ok) { pass++; console.log('PASS: ' + x.name); }
    else { fail++; console.log('FAIL: ' + x.name + ' — ' + JSON.stringify(x.detail)); }
  }
  console.log(`\n${pass} PASS / ${fail} FAIL`);
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ignore */ }
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
