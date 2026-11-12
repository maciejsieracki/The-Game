'use strict';
/**
 * improvement-admin-tooltip-real-render-test.cjs
 *
 * TEMAT: R-WEB-UI-IMPROVEMENT-ADMIN-TOOLTIP-Q1.
 *
 * Zgłoszenie właściciela: w panelu „AUTOMATYZACJA ULEPSZEŃ TERENU" długie komunikaty o administratorze
 * zajmują za dużo miejsca. Decyzja: w treści zostaje krótki komunikat, pełne wyjaśnienie (co to administrator,
 * koszt, utrzymanie, skutek) jest w tooltipie (atrybut title) tego samego elementu.
 *
 * Test w PRAWDZIWYM Chromium na prawdziwym buildModeHud.ts (bundle esbuild), kryteria:
 *  (a) w treści panelu komunikaty administratora nie są dłuższe niż 60 znaków (test DOM, realne textContent);
 *  (b) pełny tekst (wyjaśnienie + koszt + utrzymanie / skutek) jest w title elementu widocznego w panelu;
 *  (c) przyciski automatyzacji zablokowane (disabled) nadal mają title z komunikatem (nie tracą tooltipa);
 *  (d) mutacja: przywrócenie długiego tekstu w treści czerwieni test;
 *  (e) brak błędów konsoli/pageerror.
 *
 * Uruchomienie (z gra/): node tools/improvement-admin-tooltip-real-render-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[improvement-admin-tooltip] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.stubs');
const BRAND_STUB = path.resolve(STUB_DIR, 'build-mode-lock-tip-brandAssets-stub.ts');
const OWL_STUB = path.resolve(STUB_DIR, 'build-mode-lock-tip-scienceOwlIcon-stub.ts');
const TMP = path.resolve(__dirname, '.improvement-admin-tooltip-tmp');
const EVIDENCE = path.resolve(GRA, '..', 'dyspozycje', 'autobot', 'runs', 'R-WEB-UI-IMPROVEMENT-ADMIN-TOOLTIP-Q1', 'evidence');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MAX_PANEL_TEXT = 60;

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

/** Bundle buildModeHud.ts; `mutateFrom`/`mutateTo` = opcjonalna mutacja źródła (test czerwienienia). */
async function bundle(id, mutateFrom, mutateTo) {
  fs.mkdirSync(TMP, { recursive: true });
  const entry = path.join(TMP, `entry${id}.ts`);
  const out = path.join(TMP, `bundle${id}.js`);
  fs.writeFileSync(entry, [
    "import { createBuildModeHud } from '../../src/ui/buildModeHud.ts';",
    'window.__createBuildModeHud = createBuildModeHud;',
    '',
  ].join('\n'), 'utf8');
  await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    target: 'es2020',
    outfile: out,
    absWorkingDir: GRA,
    loader: { '.ts': 'ts' },
    plugins: [{
      name: 'stub-icons-and-mutation',
      setup(build) {
        build.onResolve({ filter: /(^|\/)brandAssets$/ }, () => ({ path: BRAND_STUB }));
        build.onResolve({ filter: /icons\/scienceOwlIcon$/ }, () => ({ path: OWL_STUB }));
        if (mutateFrom !== undefined) {
          build.onLoad({ filter: /buildModeHud\.ts$/ }, (args) => {
            let src = fs.readFileSync(args.path, 'utf8');
            if (!src.includes(mutateFrom)) throw new Error('mutacja nie pasuje: ' + mutateFrom.slice(0, 80));
            src = src.replace(mutateFrom, mutateTo);
            return { contents: src, loader: 'ts', resolveDir: path.dirname(args.path) };
          });
        }
      },
    }],
    logLevel: 'silent',
  });
  return fs.readFileSync(out, 'utf8');
}

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true });
  } catch (e) {
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

/** Konfiguracja HUD: miasto gracza `c1` z zadanym stanem administratora ulepszeń. */
function configFor(adm) {
  return `({
    listTypes: () => [{ key: 'farma', label: 'Farma', kosztPraca: 20, epoka: 1, techUnlocked: true }],
    getActiveKey: () => null,
    onSelectType: () => {},
    onExit: () => {},
    isOpen: () => true,
    getPracaPool: () => 999,
    listPlayerCities: () => [{ id: 'c1', name: 'Ateny' }],
    isAutoBuildEnabled: () => true,
    getUlepszeniaCityId: () => 'c1',
    getUlepszeniaEmpireState: () => ({ focus: 'zywnosc', tryb: 'auto', pracaAutoPercent: 50 }),
    getUlepszeniaEffectiveState: () => ({ focus: 'zywnosc', tryb: 'auto', pracaAutoPercent: 50, override: false }),
    getUlepszeniaCityOverride: () => false,
    getImprovementAdministratorState: () => (${JSON.stringify(adm)}),
  })`;
}

/** Odczyt stanu DOM po renderze: teksty komunikatów i title. */
const READ = `(() => {
  const txt = (sel) => Array.from(document.querySelectorAll(sel)).map(e => e.textContent.replace(/\\s+/g, ' ').trim());
  const titles = (sel) => Array.from(document.querySelectorAll(sel)).map(e => e.getAttribute('title') || '');
  const vis = (sel) => { const e = document.querySelector(sel); if (!e) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  return {
    hint: txt('[data-imp-admin-hint]'),
    hintTitle: titles('[data-imp-admin-hint]'),
    hintLock: Array.from(document.querySelectorAll('[data-imp-admin-hint]')).map(e => e.getAttribute('data-lock-hint') || ''),
    hintVisible: vis('[data-imp-admin-hint]'),
    lockNotes: txt('.civ-build-lock-note'),
    lockNoteTitles: titles('.civ-build-lock-note'),
    eff: txt('.civ-build-auto-eff'),
    effTitles: titles('.civ-build-auto-eff'),
    adminBtnText: txt('[data-imp-admin-open] span'),
    lockedButtonTitles: Array.from(document.querySelectorAll('.civ-build-auto-btn[disabled], .civ-build-hbtn[disabled]')).map(e => e.getAttribute('title') || ''),
    lockedButtonCount: document.querySelectorAll('.civ-build-auto-btn[disabled]').length,
    panelExists: !!document.querySelector('.civ-build-panel'),
    autoBlock: !!document.querySelector('.civ-build-auto'),
  };
})()`;

/** Usuwa katalog tymczasowy bundli (także po błędzie). */
function cleanTmp() {
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_e) { /* noop */ }
}

async function main() {
  // Scenariusz 1: brak administratora (blokada całego państwa i miasta).
  // Scenariusz 2: administrator zatrudniony, ale nie pracuje (brak środków).
  const noAdm = { hired: false, working: false, upkeep: 2, hireCost: 40, blockReasonText: null, description: '' };
  const hiredIdle = { hired: true, working: false, upkeep: 2, hireCost: 40, blockReasonText: null, description: '' };

  const errors = [];
  const browser = await launchBrowser();

  /** Renderuje HUD, zapisuje zrzut (1440x900) i najeżdża myszą na podpowiedź — sprawdza, że tooltip się pokazuje. */
  async function scenario(label, adm, mutFrom, mutTo, id, shotName) {
    const code = await bundle(id, mutFrom, mutTo);
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.setContent('<!doctype html><html><head><meta charset="utf-8"></head><body style="background:#0a1020"></body></html>');
    await page.addScriptTag({ content: code });
    await page.evaluate(`(() => { window.__hud = window.__createBuildModeHud(${configFor(adm)}); window.__hud.update(); })()`);
    const st = await page.evaluate(READ);
    const hint = page.locator('[data-imp-admin-hint]').first();
    if (await hint.count()) {
      await hint.hover();
      st.tip = await page.evaluate(`(() => { const t = document.querySelector('.civ-build-lock-tip'); if (!t) return null; const r = t.getBoundingClientRect(); return { shown: t.style.display === 'block' && r.width > 0, text: t.textContent }; })()`);
    }
    if (shotName) {
      fs.mkdirSync(EVIDENCE, { recursive: true });
      await page.screenshot({ path: path.join(EVIDENCE, shotName), fullPage: false });
      st.shot = shotName;
    }
    await page.close();
    return st;
  }

  // ---- Scenariusz 1: brak administratora ----
  const s1 = await scenario('brak', noAdm, undefined, undefined, 1, 'po-zmianie-brak-administratora-1440x900.png');
  check('S1: panel automatyzacji wyrenderowany (blok .civ-build-auto)', s1.autoBlock, s1);
  check('S1: podpowiedź administratora widoczna i w treści krótka („Wymaga administratora ulepszeń")',
    s1.hint.length === 1 && s1.hint[0] === 'Wymaga administratora ulepszeń' && s1.hintVisible, s1.hint);
  check(`S1: (a) każdy komunikat w treści panelu ≤ ${MAX_PANEL_TEXT} znaków`,
    [...s1.hint, ...s1.lockNotes, ...s1.eff, ...s1.adminBtnText].every(t => t.length <= MAX_PANEL_TEXT),
    { hint: s1.hint, lockNotes: s1.lockNotes, eff: s1.eff, btn: s1.adminBtnText });
  check('S1: (b) pełne wyjaśnienie w data-lock-hint podpowiedzi (co to administrator, koszt 40, utrzymanie 2)',
    /Auto-ulepszenia terenu w tym mieście wymagają działającego administratora ulepszeń\..*Koszt 40 Pieniądza, utrzymanie 2 Pieniądza na turę\./.test(s1.hintLock[0] || ''),
    s1.hintLock);
  check('S1: (b) title notatki blokady państwa zawiera wyjaśnienie (żadne miasto nie ma administratora)',
    s1.lockNoteTitles.some(t => /Żadne miasto nie ma działającego administratora ulepszeń/.test(t)), s1.lockNoteTitles);
  check('S1: (b) title notatki blokady miasta zawiera wyjaśnienie (ustawienia nieaktywne)',
    s1.lockNoteTitles.some(t => /Ustawienia tego miasta są nieaktywne/.test(t)), s1.lockNoteTitles);
  check('S1: najechanie na podpowiedź pokazuje tooltip z pełnym tekstem (lock-tip widoczny)',
    !!(s1.tip && s1.tip.shown && /Auto-ulepszenia terenu.*Koszt 40 Pieniądza, utrzymanie 2/.test(s1.tip.text)), s1.tip);
  check('S1: (c) zablokowane przyciski automatyzacji (disabled) mają title z komunikatem',
    s1.lockedButtonCount > 0 && s1.lockedButtonTitles.every(t => t.includes('Wymaga administratora ulepszeń')),
    { count: s1.lockedButtonCount, titles: s1.lockedButtonTitles });

  // ---- Scenariusz 2: zatrudniony, nie pracuje ----
  const s2 = await scenario('nie-pracuje', hiredIdle, undefined, undefined, 2, 'po-zmianie-nie-pracuje-1440x900.png');
  check('S2: najechanie na „nie pracuje” pokazuje tooltip z przyczyną (brak środków)',
    !!(s2.tip && s2.tip.shown && /brak środków w skarbcu państwa/.test(s2.tip.text)), s2.tip);
  check('S2: (a) komunikat „nie pracuje” w treści ≤ 60 znaków',
    s2.hint.length === 1 && s2.hint[0].length <= MAX_PANEL_TEXT, s2.hint);
  check('S2: (b) pełny tekst („brak środków w skarbcu państwa”) w data-lock-hint',
    s2.hintLock.some(t => /brak środków w skarbcu państwa/.test(t)), s2.hintLock);
  check('S2: (a) „Efekt w mieście” krótki; przyczyna w title',
    s2.eff.some(t => t === 'Efekt w mieście: wstrzymane (państwo)' || t.startsWith('Efekt w mieście: wstrzymane')) &&
    s2.effTitles.some(t => /Brak działającego administratora ulepszeń/.test(t)),
    { eff: s2.eff, effTitles: s2.effTitles });

  // ---- (d) Mutacja: długi tekst z powrotem w treści musi czerwienić test ----
  const mutFrom = '>${AUTO_IMPROVE_LOCKED_NOTE}</div>`;\n  } else if (!st.working)';
  const mutTo = '>${AUTO_IMPROVE_LOCKED_NOTE}. ${full}</div>`;\n  } else if (!st.working)';
  const mut = await scenario('mutacja', noAdm, mutFrom, mutTo, 3, 'przed-odtworzenie-dlugiego-tekstu-1440x900.png');
  const mutLong = mut.hint.length === 1 && mut.hint[0].length > MAX_PANEL_TEXT;
  check('(d) mutacja (długi tekst w treści) wykrywana przez kryterium (a)', mutLong, mut.hint);

  check('(e) brak błędów konsoli/pageerror w scenariuszach', errors.length === 0, errors);

  await browser.close();

  console.log('');
  console.log(`[improvement-admin-tooltip-real-render-test] ${pass} pass, ${fail} fail`);
  cleanTmp();
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  cleanTmp();
  process.exit(1);
});
