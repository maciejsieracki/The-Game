'use strict';
/**
 * unfortify-all-action-bar-test.cjs — P-UNITACTIONBAR-UNFORTIFY-ALL-NIEOSIAGALNE
 * (dyspozycje/PYTANIA-OTWARTE.md, 2026-08-16, znalezisko Evaluatora przy okazji
 * P-BITWA-OBLEZENIE-NIE-ANULUJE-ZAKOLEJKOWANEGO-ATAKU).
 *
 * Zgłoszenie: `main.ts:17883` ma w pełni działający handler dla `actionId === 'unfortify-all'`
 * (Odfortyfikuj całą armię — zdejmuje fortyfikację ze WSZYSTKICH jednostek w garnizonie na
 * heksie miasta naraz, w odróżnieniu od 'fortify', który dotyczy jednej wybranej jednostki),
 * a `ACTION_ICONS['unfortify-all']` w `unitActionBarHtml.ts` już miało gotową ikonę SVG. Mimo
 * to `buildUnitActionBarHtml()` renderuje WYŁĄCZNIE id wymienione w `COMPACT_ACTION_ORDER`
 * (+ osobno hardkodowany 'disband') — 'unfortify-all' nie było na tej liście, więc przycisk
 * nigdy nie trafiał do DOM, mimo że `main.ts` poprawnie wypychał go do `actions[]` (gałąź
 * `if (isGarnizoned) { const garCount = ...; if (garCount > 1) { actions.push({id:
 * 'unfortify-all', ...}) } }`, main.ts ok. 17791-17800) — dokładnie ta sama klasa błędu, która
 * ukryła przycisk 'march-stop' (Anuluj atak) przez całą FALĘ 284 (patrz
 * march-attack-queue-persist-test.cjs).
 *
 * Naprawa: dopisanie `'unfortify-all'` do `COMPACT_ACTION_ORDER` w `unitActionBarHtml.ts`,
 * zaraz po `'fortify'` (odpowiednik grupowy — cała armia w garnizonie zamiast jednej
 * jednostki). Etykieta jest statyczna („Odfortyfikuj całą armię", main.ts:17796), więc — w
 * odróżnieniu od 'march-stop' (etykieta dynamiczna, dedykowany blok tekstowy) — renderuje się
 * jako zwykła ikona z listy, identycznie jak 'fortify'.
 *
 * METODA (wzorzec kanoniczny repo — march-attack-queue-persist-test.cjs, atak-dystansowy-mapa-
 * test.cjs): `buildUnitActionBarHtml` jest budowane i wykonywane NAPRAWDĘ z prawdziwego pliku
 * `src/ui/unitActionBarHtml.ts` przez esbuild (bundle), zero reimplementacji renderera w teście.
 *
 * Pokrycie:
 *  1. 'unfortify-all' obecne w `actions[]` → renderuje się w DOM (button z data-act, ikoną,
 *     title/aria-label z etykiety main.ts, BEZ atrybutu disabled).
 *  2. 'unfortify-all' NIEOBECNE w `actions[]` (np. garnizon z 1 jednostką — main.ts w ogóle
 *     go nie wypycha) → NIE renderuje się (brak zaśmiecania UI, jak 'march-stop' (i2)).
 *  3. `disabled: true` → atrybut disabled obecny w wyrenderowanym przycisku.
 *  4. Styl renderowania spójny z 'fortify' (ikona, klasa `uc-act-btn`, BRAK klasy
 *     `uc-act-text` używanej dla dynamicznych etykiet jak 'march-stop'/'disband').
 *  5. Pozycja w kolejności: 'unfortify-all' renderuje się PO 'fortify', PRZED 'sentry' —
 *     zgodnie z żądaniem „logicznie blisko fortify/unfortify pojedynczych".
 *  6. STRAŻNIK STRUKTURALNY: `main.ts` nadal produkuje 'unfortify-all' wyłącznie gdy
 *     `isGarnizoned && garCount > 1` (warunek widoczności nietknięty tym tematem — renderer,
 *     nie handler, był łamany).
 *  7. DOWÓD MUTACYJNY: kopia pliku źródłowego z 'unfortify-all' WYCIĘTYM z powrotem z
 *     `COMPACT_ACTION_ORDER` (symulacja cofnięcia naprawy) → ten sam test (1) MUSI się złapać
 *     (przycisk znowu znika z DOM mimo że main.ts go dostarcza) — potwierdza że to właśnie ten
 *     wpis w tablicy, nie coś innego, naprawia lukę.
 *
 * Bramka (z katalogu gra/): node tools/unfortify-all-action-bar-test.cjs — exit 0 = zielona.
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

console.log('unfortify-all-action-bar-test');

const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));

/** Buduje (bundle rzeczywisty, esbuild) i wymaga moduł buildUnitActionBarHtml z podanej
 * treści pliku unitActionBarHtml.ts (zapisanej do tymczasowej ścieżki obok oryginału, żeby
 * relatywny `import type './unitPanelHud'` dalej się rozwiązywał tak samo). */
function zbudujModul(src, tmpName) {
  const tmpPath = path.join(GRA_ROOT, 'src', 'ui', tmpName);
  fs.writeFileSync(tmpPath, src, 'utf8');
  const outfile = path.join(__dirname, '.' + tmpName.replace(/\.ts$/, '') + '-bundle.cjs');
  try {
    esbuild.buildSync({
      entryPoints: [tmpPath], bundle: true, platform: 'node', format: 'cjs',
      target: 'node18', outfile, logLevel: 'silent',
      resolveExtensions: ['.ts', '.js'],
      absWorkingDir: GRA_ROOT, nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
    });
    delete require.cache[require.resolve(outfile)];
    const mod = require(outfile);
    return mod;
  } finally {
    fs.rmSync(tmpPath, { force: true });
    fs.rmSync(outfile, { force: true });
  }
}

// ===========================================================================
// (1)-(5): renderer rzeczywisty (dzisiejszy stan pliku, PO naprawie)
// ===========================================================================
{
  const mod = zbudujModul(realActionBarSrc, '.tmp-real-unitActionBarHtml.ts');
  ok(typeof mod.buildUnitActionBarHtml === 'function',
    'SETUP: buildUnitActionBarHtml wyeksportowana z prawdziwego pliku i wykonywalna po zbudowaniu esbuild');

  // (1) 'unfortify-all' obecne w actions[] → renderuje się w DOM
  const actionsZUnfortifyAll = [
    { id: 'fortify', label: 'Odfortyfikuj', disabled: false, active: false },
    { id: 'unfortify-all', label: 'Odfortyfikuj całą armię', disabled: false },
    { id: 'sentry', label: 'Czuwaj', disabled: false, active: false },
    { id: 'skip', label: 'Pomiń', disabled: false },
    { id: 'disband', label: 'ROZWIĄŻ', danger: true },
  ];
  const htmlZ = mod.buildUnitActionBarHtml(actionsZUnfortifyAll);
  ok(htmlZ.includes('data-act="unfortify-all"'),
    "(1) 'unfortify-all' obecne w actions[] → button z data-act=\"unfortify-all\" OBECNY w wyrenderowanym HTML (naprawiona luka)");
  ok(htmlZ.includes('title="Odfortyfikuj całą armię"') && htmlZ.includes('aria-label="Odfortyfikuj całą armię"'),
    '(1) title/aria-label przycisku = dokładnie etykieta z main.ts ("Odfortyfikuj całą armię")');
  ok(/data-act="unfortify-all"[^>]*>(?![\s\S]*?disabled)/.test(htmlZ) || !/data-act="unfortify-all"[^>]*disabled/.test(htmlZ),
    '(1) disabled:false → atrybut disabled NIEOBECNY na przycisku unfortify-all');

  // (2) 'unfortify-all' NIEOBECNE w actions[] (np. garnizon z 1 jednostką — main.ts w ogóle
  // go nie wypycha) → renderer NIE dodaje przycisku samodzielnie (brak zaśmiecania UI).
  const actionsBezUnfortifyAll = [
    { id: 'fortify', label: 'Odfortyfikuj', disabled: false, active: false },
    { id: 'sentry', label: 'Czuwaj', disabled: false, active: false },
    { id: 'skip', label: 'Pomiń', disabled: false },
  ];
  const htmlBez = mod.buildUnitActionBarHtml(actionsBezUnfortifyAll);
  ok(!htmlBez.includes('data-act="unfortify-all"'),
    "(2) 'unfortify-all' NIEOBECNE w actions[] (garnizon z 1 jednostką) → button NIEOBECNY w DOM (brak zaśmiecania UI)");

  // (3) disabled:true → atrybut disabled obecny
  const actionsDisabled = [
    { id: 'unfortify-all', label: 'Odfortyfikuj całą armię', disabled: true },
  ];
  const htmlDisabled = mod.buildUnitActionBarHtml(actionsDisabled);
  const btnMatch = htmlDisabled.match(/<button[^>]*data-act="unfortify-all"[^>]*>/);
  ok(!!btnMatch, '(3) SETUP: przycisk unfortify-all znaleziony w HTML dla disabled:true');
  ok(!!btnMatch && / disabled(?:[ >])/.test(btnMatch[0]),
    '(3) disabled:true w actions[] → atrybut disabled OBECNY na wyrenderowanym przycisku');

  // (4) styl renderowania spójny z 'fortify' -- ikona (uc-act-btn), NIE tekstowy blok
  // (uc-act-text, używany dla dynamicznych etykiet jak 'march-stop'/'disband').
  ok(!!btnMatch && /class="uc-act-btn"/.test(btnMatch[0]) && !/uc-act-text/.test(btnMatch[0]),
    "(4) przycisk unfortify-all renderuje się jako ikona (class=\"uc-act-btn\"), tak jak 'fortify' — NIE jako dedykowany blok tekstowy jak 'march-stop'");
  ok(/<span class="uc-act-ic">/.test(htmlZ.slice(htmlZ.indexOf('data-act="unfortify-all"'), htmlZ.indexOf('data-act="unfortify-all"') + 400)),
    '(4) przycisk unfortify-all zawiera <span class="uc-act-ic"> z ikoną SVG (ta sama struktura co fortify)');

  // (5) pozycja: unfortify-all renderuje się PO fortify, PRZED sentry.
  const idxFortify = htmlZ.indexOf('data-act="fortify"');
  const idxUnfortifyAll = htmlZ.indexOf('data-act="unfortify-all"');
  const idxSentry = htmlZ.indexOf('data-act="sentry"');
  ok(idxFortify >= 0 && idxUnfortifyAll > idxFortify,
    "(5) 'unfortify-all' renderuje się PO 'fortify' w wyjściowym HTML (kolejność zgodna z COMPACT_ACTION_ORDER)");
  ok(idxSentry >= 0 && idxSentry > idxUnfortifyAll,
    "(5) 'unfortify-all' renderuje się PRZED 'sentry' (bezpośrednio między fortify i sentry, blisko akcji fortyfikacji)");
}

// ===========================================================================
// (6) STRAŻNIK STRUKTURALNY: main.ts nadal produkuje 'unfortify-all' wyłącznie gdy
// isGarnizoned && garCount > 1 -- renderer był złamany, nie warunek widoczności handlera;
// upewniamy się, że ta naprawa go NIE naruszyła.
// ===========================================================================
{
  ok(/if \(isGarnizoned\) \{\s*\n\s*const garCount = garrisonUnitsOnHex\(units, active\.q, active\.r, active\.ownerId\)\.length;\s*\n\s*if \(garCount > 1\) \{\s*\n\s*actions\.push\(\{\s*\n\s*id: 'unfortify-all',/.test(realMainSrc),
    "(6) main.ts: 'unfortify-all' nadal wypychane WYŁĄCZNIE gdy isGarnizoned && garCount>1 (warunek widoczności handlera nietknięty tym tematem)");
  ok(/\} else if \(actionId === 'unfortify-all'\) \{/.test(realMainSrc),
    "(6) main.ts: handler `actionId === 'unfortify-all'` nadal obecny i podłączony (temat naprawiał WYŁĄCZNIE renderer)");
}

// ===========================================================================
// (7) DOWÓD MUTACYJNY: cofnięcie naprawy (usunięcie 'unfortify-all' z powrotem z
// COMPACT_ACTION_ORDER, symulując stan SPRZED tego tematu) -- test (1) MUSI się złapać.
// ===========================================================================
{
  const guardRegex = /const COMPACT_ACTION_ORDER = \['fortify', 'unfortify-all', /;
  ok(guardRegex.test(realActionBarSrc),
    '(MUT-UNFORTIFY-ALL) wzorzec naprawionej linii COMPACT_ACTION_ORDER znaleziony w prawdziwym pliku (mutacja przygotowana poprawnie)');
  const mutSrc = realActionBarSrc.replace(guardRegex, "const COMPACT_ACTION_ORDER = ['fortify', ");
  ok(mutSrc !== realActionBarSrc, '(MUT-UNFORTIFY-ALL) mutacja faktycznie zmieniła tekst (cofnięcie naprawy)');

  const modMut = zbudujModul(mutSrc, '.tmp-mut-unitActionBarHtml.ts');
  const actionsZUnfortifyAll = [
    { id: 'fortify', label: 'Odfortyfikuj', disabled: false, active: false },
    { id: 'unfortify-all', label: 'Odfortyfikuj całą armię', disabled: false },
  ];
  const htmlMut = modMut.buildUnitActionBarHtml(actionsZUnfortifyAll);
  ok(!htmlMut.includes('data-act="unfortify-all"'),
    "(MUT-UNFORTIFY-ALL) po cofnięciu wpisu z COMPACT_ACTION_ORDER: przycisk 'unfortify-all' ZNOWU znika z DOM mimo że jest w actions[] → ZŁAPANE, wraca zgłoszony bug (dowód, że to właśnie ten wpis w tablicy naprawia lukę)");
}

console.log('unfortify-all-action-bar-test: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
