'use strict';
/**
 * danina-podatek-tooltip-ui-test.cjs — ZADANIE 1 (Maciej, decyzja 81=A, 2026-07-25):
 * "plon heksu Danina/Podatek" musiał przestać być statyczny w tooltipie heksu
 * (gra/src/ui/hexContextTooltip.ts). Ten plik testuje WARSTWĘ UI — nie tylko
 * silnik danina-nazwa.ts (ten ma już swój test, tools/danina-podatek-nazwa-test.cjs) —
 * czyli realny render `buildHexContextTooltipHtml` z etykietą policzoną tak, jak
 * main.ts (buildHexContextPanelMessage / hexDaninaLabelAt) ją dziś liczy i przekazuje.
 *
 * Run from gra/:  node tools/danina-podatek-tooltip-ui-test.cjs
 *
 * OGRANICZENIE UCZCIWIE PRZYZNANE (ten sam wzorzec co tools/zloto-szlak-test.cjs
 * nagłówek "OGRANICZENIE..."): main.ts (17+ tys. linii, jeden monolityczny bootstrap
 * zależny od document/window/canvas/three.js, bez eksportowanych funkcji testowych)
 * nie da się zbundlować do tego node'owego harnessu. `hexDaninaLabelAt` w main.ts jest
 * więc ODTWORZONA tutaj jako `hexDaninaLabelForCiv()` — DOKŁADNIE tymi samymi dwoma
 * wołaniami co main.ts (mennicaWStolicy + daninaLabel z game/danina-nazwa.ts), żeby
 * test dokumentował kontrakt "main.ts liczy tak samo", a nie wymyślał inną logikę.
 * `buildHexContextTooltipHtml` samo w sobie jest zbundlowane NAPRAWDĘ (prawdziwy plik
 * z gra/src/ui/hexContextTooltip.ts) — to jest właśnie warstwa UI pod testem.
 *
 * Bundling hexContextTooltip.ts wymaga stuba dla './icons/brandAssets' (import.meta.glob
 * + `?raw` to składnia wyłącznie Vite, esbuild jej nie rozumie) — stub podmienia tylko
 * ikony SVG na puste stringi, nie dotyka logiki etykiety Danina/Podatek pod testem.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.stubs');
const STUB_FILE = path.resolve(STUB_DIR, 'brandAssets-stub.ts');
const ENTRY_FILE = path.resolve(__dirname, '.danina-podatek-tooltip-ui-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.danina-podatek-tooltip-ui-bundle.cjs');

fs.mkdirSync(STUB_DIR, { recursive: true });
fs.writeFileSync(STUB_FILE, `
export function brandIconSvg(_key, _size) { return ''; }
export function mapResourceIconSvg(_key, _size) { return ''; }
export function terrainIconSvg(_key, _size) { return ''; }
`, 'utf8');

fs.writeFileSync(ENTRY_FILE, `
export { buildHexContextTooltipHtml } from '../src/ui/hexContextTooltip';
export { daninaLabel, mennicaWStolicy } from '../src/game/danina-nazwa';
`, 'utf8');

const stubBrandAssetsPlugin = {
  name: 'stub-brand-assets',
  setup(build) {
    build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: STUB_FILE }));
  },
};

async function main() {
  try {
    await esbuild.build({
      entryPoints: [ENTRY_FILE],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      target: 'node18',
      outfile: BUNDLE_FILE,
      absWorkingDir: GRA,
      plugins: [stubBrandAssetsPlugin],
      logLevel: 'silent',
    });
  } catch (e) {
    console.error('[danina-podatek-tooltip-ui-test] esbuild failed:', e.message || e);
    process.exit(1);
  }

  const M = require(BUNDLE_FILE);

  let pass = 0, fail = 0;
  function ok(c, m) {
    if (c) { pass++; console.log('  PASS:', m); }
    else { fail++; console.error('  FAIL:', m); }
  }

  /**
   * Odtwarza main.ts hexDaninaLabelAt/buildHexContextPanelMessage — patrz nagłówek
   * pliku. `ownerId: null` = heks NICZYJ (poza terytorium każdej cywilizacji) —
   * bramka nie ma czego sprawdzić, więc main.ts zwraca zawsze "Danina" wprost,
   * nie przez fallback tooltipa.
   */
  function hexDaninaLabelForCiv({ ownerId, walutaOdkryta, capitalId, builtAtCapital, maDostepDoZlota }) {
    if (ownerId === null) return 'Danina';
    const hasMennicaWStolicy = M.mennicaWStolicy(capitalId, builtAtCapital);
    return M.daninaLabel(walutaOdkryta, hasMennicaWStolicy, maDostepDoZlota);
  }

  // Heks Łąka -- terrain-yields.json: Handel=1, więc wiersz "handel" NIE jest
  // pomijany przez formatYieldBreakdownHtml (sumVal=0 && baseVal=0 => continue).
  const hex = { terenBazowy: 'laka', nakladka: 'brak' };
  const esc = (s) => s;

  function handelRowLabel(html) {
    // Wiersz plonu "handel" renderuje etykietę DWA razy: w cp-yield-lbl i w
    // nawiasie cp-yield-detail -- obie muszą być tą samą, aktualną etykietą.
    const containsPodatek = html.includes('Podatek');
    const containsDanina = html.includes('>Danina<') || / Danina[:<]/.test(html) || html.includes('Danina</span>') || html.includes('Danina:');
    return { containsPodatek, containsDanina };
  }

  // 1) Cywilizacja BEZ Mennicy -> "Danina".
  {
    const label = hexDaninaLabelForCiv({
      ownerId: 1, walutaOdkryta: true, capitalId: '1-stolica', builtAtCapital: [], maDostepDoZlota: true,
    });
    ok(label === 'Danina', '1) cywilizacja bez Mennicy -> etykieta "Danina"');
    const html = M.buildHexContextTooltipHtml({ q: 0, r: 0, hex, esc, daninaLabel: label });
    const r = handelRowLabel(html);
    ok(r.containsDanina && !r.containsPodatek, '1b) tooltip renderuje wiersz "Danina", nie "Podatek"');
  }

  // 2) Ta sama cywilizacja z Walutą + Mennica W STOLICY + dostęp do złota -> "Podatek".
  {
    const label = hexDaninaLabelForCiv({
      ownerId: 1, walutaOdkryta: true, capitalId: '1-stolica', builtAtCapital: ['mennica'], maDostepDoZlota: true,
    });
    ok(label === 'Podatek', '2) Waluta+Mennica w stolicy+dostęp do złota -> etykieta "Podatek"');
    const html = M.buildHexContextTooltipHtml({ q: 0, r: 0, hex, esc, daninaLabel: label });
    const r = handelRowLabel(html);
    ok(r.containsPodatek && !r.containsDanina, '2b) tooltip renderuje wiersz "Podatek", nie "Danina"');
  }

  // 3) Ta sama cywilizacja PO UTRACIE dostępu do złota -> z powrotem "Danina"
  //    (Mennica fizycznie nadal stoi w builtAtCapital -- budynek nie jest burzony).
  {
    const label = hexDaninaLabelForCiv({
      ownerId: 1, walutaOdkryta: true, capitalId: '1-stolica', builtAtCapital: ['mennica'], maDostepDoZlota: false,
    });
    ok(label === 'Danina', '3) po utracie dostępu do złota -> etykieta wraca na "Danina" (Mennica stoi, efekt śpi)');
    const html = M.buildHexContextTooltipHtml({ q: 0, r: 0, hex, esc, daninaLabel: label });
    const r = handelRowLabel(html);
    ok(r.containsDanina && !r.containsPodatek, '3b) tooltip renderuje wiersz "Danina" po utracie dostępu do złota');
  }

  // 4) Heks NICZYJ -- decyzja jawna: zawsze "Danina" (bramka nie ma właściciela,
  //    więc nie ma czego sprawdzać). Sprawdzamy DWIE ścieżki: (a) main.ts liczy
  //    i przekazuje "Danina" wprost, (b) wołający, który W OGÓLE nie przekazał
  //    daninaLabel (pole nieobecne w inpucie), dostaje ten sam bezpieczny fallback
  //    wewnątrz samego tooltipa (buildHexContextTooltipHtml, input.daninaLabel ?? 'Danina').
  {
    const label = hexDaninaLabelForCiv({ ownerId: null });
    ok(label === 'Danina', '4a) heks niczyj -> jawnie "Danina" (brak właściciela = brak bramki)');
    const htmlExplicit = M.buildHexContextTooltipHtml({ q: 0, r: 0, hex, esc, daninaLabel: label });
    const rExplicit = handelRowLabel(htmlExplicit);
    ok(rExplicit.containsDanina && !rExplicit.containsPodatek, '4b) tooltip (etykieta jawna "Danina") renderuje "Danina"');
    const htmlFallback = M.buildHexContextTooltipHtml({ q: 0, r: 0, hex, esc }); // brak pola daninaLabel
    const rFallback = handelRowLabel(htmlFallback);
    ok(rFallback.containsDanina && !rFallback.containsPodatek, '4c) tooltip BEZ pola daninaLabel -> fallback domyślny "Danina" (nigdy "Podatek")');
    ok(htmlFallback === htmlExplicit, '4d) fallback domyślny daje BAJT-IDENTYCZNY wynik jak jawne "Danina" (spójność)');
  }

  // 5) PARYTET AI: cywilizacja AI (ownerId != 0) w tej samej sytuacji strukturalnej
  //    co gracz (ownerId=0) daje IDENTYCZNĄ etykietę i IDENTYCZNY render tooltipa --
  //    hexDaninaLabelForCiv/daninaLabel/mennicaWStolicy są ownerId-agnostic (biorą
  //    tylko booleany), a HexContextTooltipInput w ogóle nie niesie ownerId, więc
  //    tooltip STRUKTURALNIE nie może rozróżnić gracza od AI.
  {
    const situation = { walutaOdkryta: true, builtAtCapital: ['mennica'], maDostepDoZlota: true };
    const labelPlayer = hexDaninaLabelForCiv({ ownerId: 0, capitalId: '0-stolica', ...situation });
    const labelAi = hexDaninaLabelForCiv({ ownerId: 7, capitalId: '7-stolica', ...situation });
    ok(labelPlayer === 'Podatek' && labelAi === 'Podatek', '5a) gracz (ownerId=0) i AI (ownerId=7) w tej samej sytuacji -> oba "Podatek"');
    ok(labelPlayer === labelAi, '5b) PARYTET: etykieta gracza i AI identyczna dla identycznych warunków cywilizacji');
    const htmlPlayer = M.buildHexContextTooltipHtml({ q: 0, r: 0, hex, esc, daninaLabel: labelPlayer });
    const htmlAi = M.buildHexContextTooltipHtml({ q: 0, r: 0, hex, esc, daninaLabel: labelAi });
    ok(htmlPlayer === htmlAi, '5c) PARYTET: render tooltipa bajt-identyczny dla gracza i AI (ten sam heks, ta sama etykieta)');
  }

  console.log(`\ndanina-podatek-tooltip-ui-test: ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main();
