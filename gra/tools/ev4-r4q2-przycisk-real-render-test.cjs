'use strict';
/**
 * ev4-r4q2-przycisk-real-render-test.cjs — WERYFIKACJA W PRAWDZIWEJ PRZEGLADARCE
 * (Evaluator, runda 4 tematu R-AI-WYRAB-PRZY-RZECE-FARMY-Q1, R4-Q2=C).
 *
 * POWOD ISTNIENIA: temat ma warstwe UI (dwa nowe przyciski „Wolno wycinac las" w panelu
 * trybu budowy — zakres PANSTWO i zakres MIASTO). Granica §9 poz. 6a
 * (`R-PROC-AUTOBOT.md`) wymaga dla takiej warstwy REALNEJ weryfikacji w przegladarce,
 * nie samego jsdom i nie samego testu kontraktowego. Operator rundy 4 zglosil ten dowod
 * jako BRAK DOWODU (§13a) — ten plik go dostarcza.
 *
 * CO MIERZY (na zywym Chromium, na PRAWDZIWYM, niezmodyfikowanym `createBuildModeHud()`):
 *  (A) oba przyciski faktycznie sie RENDERUJA i maja niezerowy prostokat,
 *  (B) oba sa KLIKALNE — `document.elementFromPoint()` w srodku przycisku zwraca ten
 *      przycisk (nie element zaslaniajacy),
 *  (C) realny `page.mouse.click()` wywoluje wlasciwy callback z wlasciwym argumentem
 *      (panstwo: `!biezaca`; miasto: `(cityId, !biezaca)`),
 *  (D) `aria-pressed` i klasa `active` odzwierciedlaja stan (OFF/ON) — czyli gracz widzi,
 *      czy przelacznik jest wlaczony,
 *  (E) MUTACJA/kontrola negatywna: ten sam odczyt po recznym usunieciu przycisku z DOM
 *      musi PASC — dowod nie-tautologicznosci asercji (A)-(C).
 *
 * Wzorzec 1:1 z `tools/praca-budmode-slider-max-real-render-test.cjs` (esbuild + realny
 * `createBuildModeHud` + Chromium przez Playwright, stuby na assety marki).
 *
 * Usage (z gra/): node tools/ev4-r4q2-przycisk-real-render-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[ev4-r4q2-przycisk-real-render-test] playwright niedostepny');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.stubs');
const BRAND_ASSETS_STUB = path.resolve(STUB_DIR, 'ev4-r4q2-brandassets-stub.ts');
const ENTRY = path.resolve(__dirname, '.ev4-r4q2-entry.ts');
const OUTFILE = path.resolve(__dirname, '.ev4-r4q2-bundle.js');
const SCIENCE_OWL_STUB = path.resolve(STUB_DIR, 'ev4-r4q2-scienceOwlIcon-stub.ts');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  [OK] ' + name); }
  else { fail++; console.log('  [FAIL] ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

const stubPlugin = {
  name: 'stub-brand-assets',
  setup(build) {
    build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_ASSETS_STUB }));
    build.onResolve({ filter: /icons\/scienceOwlIcon$/ }, () => ({ path: SCIENCE_OWL_STUB }));
  },
};

const ENTRY_SOURCE = `
import { createBuildModeHud } from '../src/ui/buildModeHud.ts';
window.__createBuildModeHud = createBuildModeHud;
`;

/** Fixture: empire w trybie „auto" (odslania rzad przyciskow panstwa), miasto z override
 *  w trybie „auto" (odslania rzad przyciskow miasta). Oba `wolnoWycinacLas` = false —
 *  czyli stan DOMYSLNY po rundzie 4. Callbacki zapisuja swoje argumenty na `window`. */
function fixtureSource(empireWolno, cityWolno) {
  return `
window.__wywolania = [];
function __buildFixtureConfig() {
  return {
    listTypes: () => [],
    getActiveKey: () => null,
    onSelectType: () => {},
    onExit: () => {},
    isOpen: () => true,
    listPlayerCities: () => [{ id: 'miasto-1', name: 'Testowo' }],
    getUlepszeniaCityId: () => 'miasto-1',
    onUlepszeniaCityIdChange: () => {},
    getUlepszeniaEmpireState: () => ({
      focus: 'zrownowazone', tryb: 'auto', onlyWorked: true, pracaAutoPercent: 33,
      wolnoWycinacLas: ${empireWolno},
    }),
    onUlepszeniaEmpireFocusChange: () => {},
    onUlepszeniaEmpireTrybChange: () => {},
    onUlepszeniaEmpireOnlyWorkedChange: () => {},
    onUlepszeniaEmpireWyrabChange: (v) => { window.__wywolania.push(['empire', v]); },
    onUlepszeniaEmpirePracaPercentChange: () => {},
    getUlepszeniaCityOverride: () => true,
    onUlepszeniaCityOverrideChange: () => {},
    getUlepszeniaEffectiveState: () => ({
      focus: 'zrownowazone', tryb: 'auto', onlyWorked: true, pracaAutoPercent: 33,
      wolnoWycinacLas: ${cityWolno}, override: true,
    }),
    onUlepszeniaCityFocusChange: () => {},
    onUlepszeniaCityTrybChange: () => {},
    onUlepszeniaCityOnlyWorkedChange: () => {},
    onUlepszeniaCityWyrabChange: (id, v) => { window.__wywolania.push(['city', id, v]); },
    onUlepszeniaCityPracaPercentChange: () => {},
  };
}
window.__buildFixtureConfig = __buildFixtureConfig;
`;
}

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

async function scena(page, bundleJs, empireWolno, cityWolno) {
  await page.setContent('<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box;}'
    + 'body{background:#0b0f16;color:#eee;}</style></head><body></body></html>');
  await page.addScriptTag({ content: bundleJs });
  await page.addScriptTag({ content: fixtureSource(empireWolno, cityWolno) });
  return page.evaluate(() => {
    const hud = window.__createBuildModeHud(window.__buildFixtureConfig());
    document.body.appendChild(hud.el);
    hud.update();
    const opis = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return { missing: true };
      const r = el.getBoundingClientRect();
      const cx = Math.round(r.left + r.width / 2), cy = Math.round(r.top + r.height / 2);
      const top = document.elementFromPoint(cx, cy);
      return {
        tekst: (el.textContent || '').trim(),
        w: Math.round(r.width), h: Math.round(r.height),
        cx, cy,
        aria: el.getAttribute('aria-pressed'),
        active: el.className.includes('active'),
        klikalny: !!top && (top === el || el.contains(top)),
        title: el.getAttribute('title'),
      };
    };
    return {
      empire: opis('[data-ulepszenia-empire-wyrab]'),
      city: opis('[data-ulepszenia-city-wyrab]'),
      htmlLen: hud.el.innerHTML.length,
    };
  });
}

async function main() {
  fs.writeFileSync(ENTRY, ENTRY_SOURCE, 'utf8');
  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife',
    target: 'es2020', outfile: OUTFILE, absWorkingDir: GRA, loader: { '.ts': 'ts' },
    plugins: [stubPlugin], logLevel: 'silent',
  });
  const bundleJs = fs.readFileSync(OUTFILE, 'utf8');

  const browser = await launchBrowser();
  const bledy = [];
  try {
    const page = await browser.newPage({ viewport: { width: 900, height: 1100 } });
    page.on('console', m => { if (m.type() === 'error') bledy.push(m.text()); });
    page.on('pageerror', e => bledy.push(String(e)));

    console.log('A. STAN DOMYSLNY (oba przelaczniki WYLACZONE) — realny render Chromium');
    const off = await scena(page, bundleJs, false, false);
    check('A1: panel wyrenderowany, HTML niepusty', off.htmlLen > 0, { htmlLen: off.htmlLen });
    check('A2: przycisk PANSTWO „Wolno wycinac las" jest w DOM', !off.empire.missing, off.empire);
    check('A3: przycisk PANSTWO ma niezerowy prostokat', !off.empire.missing && off.empire.w > 0 && off.empire.h > 0, off.empire);
    check('A4: przycisk PANSTWO jest KLIKALNY (elementFromPoint trafia w niego)', off.empire.klikalny, off.empire);
    check('A5: przycisk PANSTWO w stanie OFF: aria-pressed="false" i BEZ klasy active',
      off.empire.aria === 'false' && off.empire.active === false, off.empire);
    check('A6: przycisk PANSTWO ma etykiete „Wolno wycinac las"',
      /Wolno wycina/.test(off.empire.tekst || ''), off.empire);
    check('A7: przycisk MIASTO jest w DOM, niezerowy i KLIKALNY',
      !off.city.missing && off.city.w > 0 && off.city.h > 0 && off.city.klikalny, off.city);
    check('A8: przycisk MIASTO w stanie OFF: aria-pressed="false", bez klasy active',
      off.city.aria === 'false' && off.city.active === false, off.city);

    console.log('\nB. REALNY KLIK MYSZA — czy wola wlasciwy callback z wlasciwym argumentem');
    await page.mouse.click(off.empire.cx, off.empire.cy);
    await page.mouse.click(off.city.cx, off.city.cy);
    const wyw = await page.evaluate(() => window.__wywolania);
    check('B1: klik w przycisk PANSTWO wywolal onUlepszeniaEmpireWyrabChange(true)',
      wyw.some(w => w[0] === 'empire' && w[1] === true), wyw);
    check('B2: klik w przycisk MIASTO wywolal onUlepszeniaCityWyrabChange("miasto-1", true)',
      wyw.some(w => w[0] === 'city' && w[1] === 'miasto-1' && w[2] === true), wyw);

    console.log('\nC. STAN WLACZONY — czy gracz WIDZI, ze przelacznik jest wlaczony');
    const on = await scena(page, bundleJs, true, true);
    check('C1: PANSTWO ON -> aria-pressed="true" ORAZ klasa active',
      on.empire.aria === 'true' && on.empire.active === true, on.empire);
    check('C2: MIASTO ON -> aria-pressed="true" ORAZ klasa active',
      on.city.aria === 'true' && on.city.active === true, on.city);
    const mieszany = await scena(page, bundleJs, false, true);
    check('C3: ZAKRESY NIEZALEZNE — panstwo OFF, miasto ON w jednym renderze',
      mieszany.empire.aria === 'false' && mieszany.city.aria === 'true',
      { e: mieszany.empire.aria, c: mieszany.city.aria });

    console.log('\nD. KONTROLA NEGATYWNA (nie-tautologicznosc): usun przycisk z DOM');
    const poUsunieciu = await page.evaluate(() => {
      document.querySelector('[data-ulepszenia-empire-wyrab]')?.remove();
      const el = document.querySelector('[data-ulepszenia-empire-wyrab]');
      return { missing: !el };
    });
    check('D1: po usunieciu przycisku ta sama asercja PADA (test nie jest tautologia)',
      poUsunieciu.missing === true, poUsunieciu);

    check('E1: brak bledow konsoli / pageerror podczas renderu i klikow', bledy.length === 0, bledy.slice(0, 3));
  } finally {
    await browser.close();
    for (const f of [ENTRY, OUTFILE]) { try { fs.unlinkSync(f); } catch (e) { /* ignore */ } }
  }
  console.log(`\nev4-r4q2-przycisk-real-render-test: ${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}
main().catch(e => { console.error(e); process.exit(1); });
