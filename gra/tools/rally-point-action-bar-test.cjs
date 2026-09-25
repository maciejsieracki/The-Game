'use strict';
/**
 * rally-point-action-bar-test.cjs — P-ARMIA-RALLY-POINT-BRAK-PRZYCISKU-UI-Q1
 * (właściciel zgłosił 2026-09-25: przycisk "Ustaw punkt zbiórki" nieobecny w HUD
 * jednostki mimo w pełni działającej logiki w main.ts/rally-point.ts).
 *
 * Zgłoszenie: `main.ts` ma w pełni działający handler dla `actionId === 'rally-set'` /
 * `'rally-launch'` / `'rally-clear'` (handleSelectedUnitHudAction) i poprawnie wypycha
 * te trzy id do `actions[]` (buildArmyStackHudStateInner), ale `buildUnitActionBarHtml()`
 * renderowała WYŁĄCZNIE id z `COMPACT_ACTION_ORDER` + hardkodowane 'siege-hold'/
 * 'march-stop'/'disband' — żadne z trzech id rally-* nie było na żadnej z tych list, więc
 * przycisk nigdy nie trafiał do DOM. Dokładnie ta sama klasa błędu jak wcześniej
 * 'unfortify-all' i 'march-stop'/'siege-hold' (patrz unfortify-all-action-bar-test.cjs).
 *
 * Naprawa: dedykowane bloki dla 'rally-set'/'rally-launch'/'rally-clear' w
 * unitActionBarHtml.ts, zaraz po 'march-stop', przed 'disband'. Etykiety dynamiczne
 * (main.ts: "Ustaw punkt zbiórki"/"Kliknij heks punktu zbiórki"/"Zmień punkt (q,r)" dla
 * rally-set; "Wyślij na punkt (q,r)" dla rally-launch; "Usuń punkt zbiórki" dla
 * rally-clear) — renderowane jako tekstowe przyciski jak 'march-stop', nie ikony.
 * 'rally-set' dodatkowo niesie stan `active` (tryb ustawiania włączony) — renderowany z
 * klasą `uc-act-btn--on` i `aria-pressed`, identycznie jak ikony w głównej pętli.
 *
 * METODA (wzorzec kanoniczny repo — unfortify-all-action-bar-test.cjs): buildUnitActionBarHtml
 * jest budowane i wykonywane NAPRAWDĘ z prawdziwego pliku src/ui/unitActionBarHtml.ts przez
 * esbuild (bundle), zero reimplementacji renderera w teście.
 *
 * Pokrycie:
 *  1. Wszystkie trzy id obecne w actions[] (punkt jeszcze nie ustawiony: tylko rally-set;
 *     punkt ustawiony: rally-set + rally-launch + rally-clear) -> renderują się w DOM.
 *  2. rally-set z active=true -> ma klasę uc-act-btn--on i aria-pressed="true".
 *  3. rally-set z active=false -> BRAK klasy uc-act-btn--on, aria-pressed="false".
 *  4. rally-launch z disabled=true (isAnimating) -> atrybut disabled obecny.
 *  5. Żadne z trzech id NIEOBECNE w actions[] -> nic się nie renderuje (brak zaśmiecania UI).
 *  6. Etykiety dynamiczne z main.ts przechodzą 1:1 do title/aria-label/tekstu przycisku.
 *  7. data-act atrybuty poprawne (rally-set/rally-launch/rally-clear) — potwierdza że
 *     generyczny click-handler (hud.ts::ensureBarActionsBound, [data-act] delegation)
 *     złapie kliknięcie bez dodatkowego kodu JS.
 *  8. STRUKTURALNE: main.ts nadal produkuje rally-launch/rally-clear WYŁĄCZNIE gdy
 *     rallyPoint istnieje (warunek widoczności w main.ts nietknięty tym tematem).
 *  9. DOWÓD MUTACYJNY: kopia pliku źródłowego z blokami rally-* WYCIĘTYMI z powrotem
 *     (symulacja cofnięcia naprawy) -> ten sam test (1) MUSI się złapać (przyciski znowu
 *     znikają z DOM mimo że main.ts je dostarcza) — potwierdza że to właśnie te bloki,
 *     nie coś innego, naprawiają lukę.
 *
 * Bramka (z katalogu gra/): node tools/rally-point-action-bar-test.cjs — exit 0 = zielona.
 */
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const ACTION_BAR_TS = path.join(GRA_ROOT, 'src', 'ui', 'unitActionBarHtml.ts');
const MAIN_TS = path.join(GRA_ROOT, 'src', 'main.ts');
const realActionBarSrc = fs.readFileSync(ACTION_BAR_TS, 'utf8');
const realMainSrc = fs.readFileSync(MAIN_TS, 'utf8');

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; } else { fail++; console.error('FAIL:', label); }
}

// --- Structural: main.ts still gates rally-launch/rally-clear on rallyPoint existing ---
ok(
  /if \(rallyPoint\) \{\s*\n\s*actions\.push\(\{\s*\n\s*id: 'rally-launch'/.test(realMainSrc),
  '8) main.ts: rally-launch pushed only inside `if (rallyPoint)` guard',
);
ok(
  realMainSrc.includes("actions.push({ id: 'rally-clear', label: 'Usuń punkt zbiórki', disabled: false });"),
  '8b) main.ts: rally-clear pushed with the exact expected static label',
);

// --- Build the REAL renderer via esbuild, exactly like unfortify-all-action-bar-test.cjs ---
const esbuild = require(path.join(GRA_ROOT, 'node_modules', 'esbuild'));
const os = require('os');
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'rally-actionbar-'));

function buildRenderer(actionBarSrc) {
  const entry = path.join(tempRoot, 'entry.ts');
  const bundle = path.join(tempRoot, 'bundle.cjs');
  const patchedPath = path.join(tempRoot, 'unitActionBarHtml.ts');
  fs.writeFileSync(patchedPath, actionBarSrc, 'utf8');
  fs.writeFileSync(entry, `export { buildUnitActionBarHtml } from ${JSON.stringify(patchedPath.replace(/\.ts$/, ''))};`, 'utf8');
  esbuild.buildSync({
    entryPoints: [entry],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: bundle,
    absWorkingDir: GRA_ROOT,
    logLevel: 'silent',
    external: ['./unitPanelHud'],
  });
  delete require.cache[require.resolve(bundle)];
  return require(bundle);
}

// unitPanelHud.ts is type-only import (UnitPanelAction interface) -- stub it so esbuild
// doesn't need to resolve it as a real module at bundle time.
fs.mkdirSync(path.join(tempRoot, 'stub'), { recursive: true });
const stubUnitPanelHud = path.join(tempRoot, 'unitPanelHud.ts');
fs.writeFileSync(stubUnitPanelHud, 'export {};\n', 'utf8');

function buildRendererReal(actionBarSrc) {
  const entry = path.join(tempRoot, 'entry.ts');
  const bundle = path.join(tempRoot, 'bundle.cjs');
  const patchedPath = path.join(tempRoot, 'unitActionBarHtml.ts');
  fs.writeFileSync(patchedPath, actionBarSrc, 'utf8');
  fs.writeFileSync(entry, `export { buildUnitActionBarHtml } from './unitActionBarHtml';`, 'utf8');
  esbuild.buildSync({
    entryPoints: [entry],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: bundle,
    absWorkingDir: tempRoot,
    logLevel: 'silent',
  });
  delete require.cache[require.resolve(bundle)];
  return require(bundle);
}

const M = buildRendererReal(realActionBarSrc);

// --- 1. rally-set alone (no rally point yet) renders ---
{
  const html = M.buildUnitActionBarHtml([
    { id: 'rally-set', label: 'Ustaw punkt zbiórki', disabled: false, active: false },
  ]);
  ok(html.includes('data-act="rally-set"'), '1a) rally-set renders with data-act');
  ok(html.includes('>Ustaw punkt zbiórki<'), '1b) rally-set renders with the exact label text');
  ok(!html.includes('data-act="rally-launch"'), '1c) rally-launch absent when not in actions[]');
  ok(!html.includes('data-act="rally-clear"'), '1d) rally-clear absent when not in actions[]');
}

// --- 1b. all three present (rally point set) renders all three ---
{
  const html = M.buildUnitActionBarHtml([
    { id: 'rally-set', label: 'Zmień punkt (5,7)', disabled: false, active: false },
    { id: 'rally-launch', label: 'Wyślij na punkt (5,7)', disabled: false },
    { id: 'rally-clear', label: 'Usuń punkt zbiórki', disabled: false },
  ]);
  ok(html.includes('data-act="rally-set"') && html.includes('>Zmień punkt (5,7)<'), '1e) rally-set dynamic label (changed point) renders');
  ok(html.includes('data-act="rally-launch"') && html.includes('>Wyślij na punkt (5,7)<'), '1f) rally-launch dynamic label renders');
  ok(html.includes('data-act="rally-clear"') && html.includes('>Usuń punkt zbiórki<'), '1g) rally-clear renders');
}

// --- 2/3. rally-set active state toggling ---
{
  const htmlActive = M.buildUnitActionBarHtml([
    { id: 'rally-set', label: 'Kliknij heks punktu zbiórki', disabled: false, active: true },
  ]);
  ok(htmlActive.includes('uc-act-btn--on'), '2a) rally-set active=true carries uc-act-btn--on class');
  ok(htmlActive.includes('aria-pressed="true"'), '2b) rally-set active=true carries aria-pressed=true');

  const htmlInactive = M.buildUnitActionBarHtml([
    { id: 'rally-set', label: 'Ustaw punkt zbiórki', disabled: false, active: false },
  ]);
  ok(!htmlInactive.includes('uc-act-btn--on'), '3a) rally-set active=false has NO uc-act-btn--on class');
  ok(htmlInactive.includes('aria-pressed="false"'), '3b) rally-set active=false carries aria-pressed=false');
}

// --- 4. rally-launch disabled (isAnimating) ---
{
  const html = M.buildUnitActionBarHtml([
    { id: 'rally-set', label: 'Zmień punkt (1,1)', disabled: false, active: false },
    { id: 'rally-launch', label: 'Wyślij na punkt (1,1)', disabled: true },
    { id: 'rally-clear', label: 'Usuń punkt zbiórki', disabled: false },
  ]);
  const launchBtnMatch = html.match(/<button[^>]*data-act="rally-launch"[^>]*>/);
  ok(launchBtnMatch !== null && launchBtnMatch[0].includes('disabled'), '4) rally-launch disabled=true renders the disabled attribute');
}

// --- 5. no rally-* actions at all -> nothing renders for these ids ---
{
  const html = M.buildUnitActionBarHtml([
    { id: 'fortify', label: 'Ufortyfikuj', disabled: false },
  ]);
  ok(!html.includes('rally-'), '5) zero rally-* ids in actions[] -> zero rally-* markup in DOM');
}

// --- 6. exact label passthrough from a main.ts-style dynamic value ---
{
  const html = M.buildUnitActionBarHtml([
    { id: 'rally-launch', label: 'Wyślij na punkt (-3,12)', disabled: false },
  ]);
  ok(html.includes('title="Wyślij na punkt (-3,12)"') && html.includes('aria-label="Wyślij na punkt (-3,12)"'),
    '6) negative-coordinate dynamic label passes through unescaped-safe to title/aria-label');
}

// --- 7. data-act values match exactly what main.ts's handleSelectedUnitHudAction expects ---
{
  const html = M.buildUnitActionBarHtml([
    { id: 'rally-set', label: 'x', disabled: false, active: false },
    { id: 'rally-launch', label: 'y', disabled: false },
    { id: 'rally-clear', label: 'z', disabled: false },
  ]);
  for (const id of ['rally-set', 'rally-launch', 'rally-clear']) {
    ok(new RegExp(`data-act="${id}"`).test(html), `7) data-act="${id}" present for hud.ts delegated click handler`);
  }
  ok(
    realMainSrc.includes("if (actionId === 'rally-set')")
    && realMainSrc.includes("} else if (actionId === 'rally-launch')")
    && realMainSrc.includes("} else if (actionId === 'rally-clear')"),
    '7b) main.ts handleSelectedUnitHudAction still handles all three rally-* actionIds',
  );
}

// --- 9. mutation proof: cut the rally-* blocks back out, confirm the bug reproduces ---
{
  const startMarker = "  const rallySet = byId.get('rally-set');";
  const endMarker = "  const disband = byId.get('disband');";
  const startIdx = realActionBarSrc.indexOf(startMarker);
  const endIdx = realActionBarSrc.indexOf(endMarker);
  ok(startIdx > 0 && endIdx > startIdx, '9-setup) can locate the rally-* block boundaries in the real source');
  const mutatedSrc = realActionBarSrc.slice(0, startIdx) + realActionBarSrc.slice(endIdx);
  const MMutated = buildRendererReal(mutatedSrc);
  const html = MMutated.buildUnitActionBarHtml([
    { id: 'rally-set', label: 'Ustaw punkt zbiórki', disabled: false, active: false },
    { id: 'rally-launch', label: 'Wyślij na punkt (5,7)', disabled: false },
    { id: 'rally-clear', label: 'Usuń punkt zbiórki', disabled: false },
  ]);
  ok(!html.includes('data-act="rally-set"'), '9a) MUTATED (blocks removed): rally-set correctly disappears from DOM again');
  ok(!html.includes('data-act="rally-launch"'), '9b) MUTATED: rally-launch correctly disappears from DOM again');
  ok(!html.includes('data-act="rally-clear"'), '9c) MUTATED: rally-clear correctly disappears from DOM again');
}

try { fs.rmSync(tempRoot, { recursive: true, force: true }); } catch (_) { /* ignore */ }

console.log('rally-point-action-bar-test');
console.log(`rally-point-action-bar-test: ${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
