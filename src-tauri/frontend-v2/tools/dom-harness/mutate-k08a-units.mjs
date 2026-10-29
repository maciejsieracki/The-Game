#!/usr/bin/env node
/**
 * mutate-k08a-units.mjs — mutacje portu K08A (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08A-Q1, runda 2, Operator-pomiary).
 * Każda mutacja = jedna podmiana tekstu w `src/ui/cityPanel/k08a-fundament.ts` (plik tymczasowy obok portu, bo importy
 * są względne). Mutant jest ZABITY, gdy PADNIE KTÓRAKOLWIEK z dwóch bramek:
 *   (a) `run-k08a-units.mjs --v2 <mutant>` (zachowanie, EXIT 1 = różnica wektora);
 *   (b) `verify-k08a-copies.mjs --port <mutant>` (wierność tekstowa bloków pinu, EXIT 1 = niezgodność kopii).
 * Przeżyła = obie bramki EXIT 0. EXIT 2 lub wzorzec niejednoznaczny (wystąpił ≠ 1 raz) = NIE_ZMIERZONO.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/mutate-k08a-units.mjs --pin-dir <PIN_DIR> [--part K/N] [--out <plik.json>]
 * `<PIN_DIR>` = katalog z `git archive edb8fb56 gra/src gra/data` (poza repo). `--part K/N` = mutanty o indeksie i ≡ K (mod N).
 */
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const PIN_DIR = argOf('--pin-dir');
if (!PIN_DIR) {
  console.error('Użycie: node tools/dom-harness/mutate-k08a-units.mjs --pin-dir <PIN_DIR> [--part K/N] [--out <plik>]');
  process.exit(2);
}
const PART = argOf('--part');
const [PK, PN] = PART ? PART.split('/').map(Number) : [0, 1];
const OUT = argOf('--out');
const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const PORT = join(V2_ROOT, 'src/ui/cityPanel/k08a-fundament.ts');
const MUT = join(V2_ROOT, 'src/ui/cityPanel/k08a-mutant-tmp.ts');
const HARNESS = join(V2_ROOT, 'tools/dom-harness/run-k08a-units.mjs');
const GATE = join(V2_ROOT, 'tools/dom-harness/verify-k08a-copies.mjs');
const WYBRANE = resolve(V2_ROOT, '../../dyspozycje/autobot/runs/R-RUSTPORT-P5-8-CITYPANEL-K08A-Q1/r1-logi/wybrane.json');
const src = readFileSync(PORT, 'utf8');

/** Mutacje: [id, grupa, opis, tekst do zastąpienia (dokładnie raz), zamiennik]. */
const MUTANTS = [
  // refreshCityPanelIfOpen (pin :10337-10346).
  ['refresh-ux-gate', 'pole', 'gałąź uxSectionRefresh pominięta', 'if (getK07aUxSectionRefresh()) {', 'if (false) {'],
  ['refresh-ux-call', 'pole', 'uxSectionRefresh nie wywołane', '    getK07aUxSectionRefresh()?.();\n    return;', '    return;'],
  ['refresh-ux-return', 'pole', 'brak return po uxRefresh (dodatkowy rerender)', '    getK07aUxSectionRefresh()?.();\n    return;', '    getK07aUxSectionRefresh()?.();'],
  ['refresh-closed-guard', 'pole', 'guard zamkniętego panelu odwrócony', '  if (!isCityPanelOpen()) return;', '  if (isCityPanelOpen()) return;'],
  ['refresh-rerender-target', 'pole', 'rerender zastąpiony disposeHoverDetailDock', 'requireK08aDeps().rerender();', 'requireK08aDeps().disposeHoverDetailDock();'],
  ['refresh-resolve-open', 'pole', 'resolve pominięte na ścieżce otwartej', '  resolveK08aActiveCity();\n  requireK08aDeps().rerender();', '  requireK08aDeps().rerender();'],
  ['refresh-resolve-ux', 'pole', 'resolve pominięte na ścieżce UX', '    resolveK08aActiveCity();\n    getK07aUxSectionRefresh()?.();', '    getK07aUxSectionRefresh()?.();'],
  // resolveK08aActiveCity (r3, K08A-Z4): sync lustra K06A (pin ma jedno activeCity).
  ['resolve-k06-nosync', 'pole', 'bez sync lustra K06A (r3 zarzut FC r2 #1)', '    setK06aActive(fresh as unknown as CityK06, k06.activeMap, k06.activeOnClose);', '    void 0;'],
  ['resolve-k06-null-nosync', 'pole', 'brak miasta: lustro K06A nie zerowane (r3)', '    if (k06.activeCity !== null) setK06aActive(null, k06.activeMap, k06.activeOnClose);', '    void 0;'],
  ['resolve-k06-id-any', 'pole', 'sync K06A bez sprawdzenia id (r3)', '  } else if (k06.activeCity !== null && k06.activeCity.id === fresh.id) {', '  } else if (k06.activeCity !== null) {'],
  // clearCityPanelUxMode (pin :10367-10374).
  ['clear-garrison', 'pole', 'clearGarrisonPanel pominięte', '  requireK08aDeps().clearGarrisonPanel();\n  setK07aUxSectionRefresh(null);', '  setK07aUxSectionRefresh(null);'],
  ['clear-dispose', 'pole', 'disposeHoverDetailDock pominięte', '  requireK08aDeps().disposeHoverDetailDock();\n}', '}'],
  ['clear-ux-null', 'pole', 'uxSectionRefresh nie zerowane', "  setK07aUxSectionRefresh(null);\n  activeCityPanelTab = 'budowa';", "  activeCityPanelTab = 'budowa';"],
  ['clear-tab-omit', 'pole', 'zakładka nie resetowana', "  activeCityPanelTab = 'budowa';\n  clearActiveCityMirrors();", '  clearActiveCityMirrors();'],
  ['clear-tab-value', 'pole', 'zakładka resetowana do rekrutacja', "  activeCityPanelTab = 'budowa';\n  clearActiveCityMirrors();", "  activeCityPanelTab = 'rekrutacja';\n  clearActiveCityMirrors();"],
  ['clear-mirrors', 'pole', 'clearActiveCityMirrors pominięte', '  clearActiveCityMirrors();\n  // activeMap', '  // activeMap'],
  ['mirror-k07-omit', 'pole', 'lustro K07A (activeCity) nie czyszczone', '  setK07aActiveCity(null);\n  setK06aActive', '  setK06aActive'],
  ['mirror-k06-omit', 'pole', 'lustra K06A (activeCity/activeMap) nie czyszczone', '  setK06aActive(null, null, getK06aState().activeOnClose);', '  void 0;'],
  ['mirror-onclose', 'pole', 'activeOnClose zerowany (pin go nie zeruje)', '  setK06aActive(null, null, getK06aState().activeOnClose);', '  setK06aActive(null, null, () => {});'],
  // closeCityView (pin :10694-10698).
  ['close-clear', 'pole', 'closeCityView bez clearCityPanelUxMode', '  clearCityPanelUxMode();\n  if (onClose) onClose();', '  if (onClose) onClose();'],
  ['close-custom', 'pole', 'custom onClose pominięte', '  if (onClose) onClose();\n  else', '  if (false) onClose();\n  else'],
  ['close-default', 'pole', 'domyślny onClose pominięty', '  else getK06aState().activeOnClose();', '  else void 0;'],
  ['close-custom-plus-default', 'pole', 'custom onClose wywołuje także domyślny', '  if (onClose) onClose();\n  else getK06aState().activeOnClose();', '  if (onClose) { onClose(); getK06aState().activeOnClose(); }\n  else getK06aState().activeOnClose();'],
  // closeCityPanelIfOpen (pin :11971-11976).
  ['cpi-guard', 'pole', 'guard odwrócony', '  if (!isCityPanelOpen()) return false;', '  if (isCityPanelOpen()) return false;'],
  ['cpi-garrison', 'pole', 'clearGarrisonPanel pominięte w zamykaniu', '  requireK08aDeps().clearGarrisonPanel();\n  getK06aState().activeOnClose();\n  return true;', '  getK06aState().activeOnClose();\n  return true;'],
  ['cpi-onclose', 'pole', 'activeOnClose pominięte', '  getK06aState().activeOnClose();\n  return true;', '  return true;'],
  ['cpi-return', 'pole', 'zwracana wartość false po zamknięciu', '  return true;\n}', '  return false;\n}'],
  // isCityPanelOpen (pin :11979-11981) i getOpenCityPanelCityId (pin :11984-11986).
  ['open-negate', 'pole', 'isCityPanelOpen zanegowany', '  return requireK08aDeps().isCityUxFrameOpen();', '  return !requireK08aDeps().isCityUxFrameOpen();'],
  ['open-const', 'pole', 'isCityPanelOpen zawsze true', '  return requireK08aDeps().isCityUxFrameOpen();', '  return true;'],
  ['getid-fallback', 'brzeg', 'brak miasta zwraca pusty string zamiast null', '  return getK07aActiveCity()?.id ?? null;', "  return getK07aActiveCity()?.id ?? '';"],
  ['getid-field', 'pole', 'zwracane pole: nazwa zamiast id', '  return getK07aActiveCity()?.id ?? null;', '  return getK07aActiveCity()?.name ?? null;'],
  ['getid-source', 'pole', 'źródło: lustro K06A zamiast K07A', '  return getK07aActiveCity()?.id ?? null;', '  return getK06aState().activeCity?.id ?? null;'],
  // Stałe ikon i tytuły (pin :11554-11571).
  ['icons-left-iconid', 'pole', 'iconId budowa zamieniony', "iconId: 'cp-buildings'", "iconId: 'cp-recruit'"],
  ['icons-left-title', 'tekst', 'tytuł rekrutacji zmieniony', "title: 'Jednostki do rekrutacji'", "title: 'Jednostki'"],
  ['icons-right-iconid', 'pole', 'iconId handlu zamieniony', "iconId: 'cp-trade'", "iconId: 'cp-labor'"],
  ['icons-right-title', 'tekst', 'tytuł kultury zmieniony', "title: 'Kultura — granice i progi'", "title: 'Kultura — granice'"],
  ['icons-right-id', 'pole', 'id zakładki religia zamienione', "{ id: 'religia', iconId", "{ id: 'religja', iconId"],
  // isProductionPanelTab (pin :11573-11575).
  ['prod-rekrutacja', 'pole', 'rekrutacja nie jest panelem produkcji', "return tab === 'budowa' || tab === 'rekrutacja';", "return tab === 'budowa';"],
  ['prod-budowa', 'pole', 'budowa nie jest panelem produkcji', "return tab === 'budowa' || tab === 'rekrutacja';", "return tab === 'rekrutacja';"],
  // CADUCEUS_SVG (pin :11577-11585).
  ['cad-stroke', 'tekst', 'grubość obrysu zmieniona', 'stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden', 'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden'],
  ['cad-path', 'tekst', 'ścieżka lewej gałęzi zmieniona', '<path d="M12 8.6 C8.2 6.2 5.2 7.1 4 9.2"/>', '<path d="M12 8.6 C8.2 6.2 5.2 7.1 4 9.3"/>'],
  ['cad-aria', 'tekst', 'aria-hidden usunięte', 'aria-hidden="true">\' +', '>\' +'],
  // cityRailIconHtml (pin :11587-11591).
  ['rail-empty', 'brzeg', 'brak ikony zwraca placeholder zamiast pustego', "  if (!svg) return '';", "  if (!svg) return '<svg></svg>';"],
  ['rail-class', 'tekst', 'klasa civ-cp-rail-ic pominięta', `return svg.replace('<svg ', '<svg class="civ-cp-rail-ic" ');`, 'return svg;'],
  ['rail-size', 'pole', 'rozmiar ikony 24 → 16', 'brandIconSvg(iconId, 24)', 'brandIconSvg(iconId, 16)'],
  // Akcesory K08A-Z3 (zakładka) i zależności K08A-Z2.
  ['tab-setter', 'pole', 'setter zakładki nie zapisuje', '  activeCityPanelTab = tab;', '  void tab;'],
  ['tab-getter', 'pole', 'getter zakładki zwraca stałe budowa', '  return activeCityPanelTab;', "  return 'budowa';"],
  ['deps-setter', 'pole', 'setK08aDeps nie zapisuje', '  deps = next;', '  void next;'],
  ['deps-require-silent', 'pole', 'brak deps = cicha wartość zamiast wyjątku (K08A-Z2)', "  if (deps === null) throw new Error('K08A: brak setK08aDeps (rerender/DOM — pin zawsze je wywołuje)');", '  if (deps === null) return { rerender() {}, clearGarrisonPanel() {}, disposeHoverDetailDock() {}, isCityUxFrameOpen: () => false };'],
  ['deps-message', 'tekst', 'komunikat wyjątku bez nazwy funkcji', "'K08A: brak setK08aDeps (rerender/DOM — pin zawsze je wywołuje)'", "'brak zależności'"],
];

const results = [];
try {
  const selected = MUTANTS.filter((_m, i) => i % PN === PK);
  for (const [id, grupa, desc, from, to] of selected) {
    const count = src.split(from).length - 1;
    if (count !== 1) {
      results.push({ id, grupa, desc, status: 'NIE_ZMIERZONO', reason: `wzorzec wystąpił ${count} razy` });
      continue;
    }
    writeFileSync(MUT, src.replace(from, to));
    let status = 'PRZEZYLA';
    let zabitaPrzez = null;
    let blad = null;
    // (a) harness zachowania.
    try {
      execFileSync(process.execPath, [HARNESS, '--v2', MUT], { stdio: 'pipe', timeout: 200000 });
    } catch (err) {
      if (err.status === 1) {
        status = 'ZABITA'; zabitaPrzez = 'harness';
      } else if (err.status === 2 && String(err.stderr).includes('błąd harnessu')) {
        // Mutant powoduje wyjątek już na ścieżce poprawnej (np. brak `setK08aDeps`): harness przerywa z EXIT 2
        // przy działającym bundlu i zerowym wyniku wzorcowym — traktowane jako zabicie przez wyjątek (dowód w logu).
        status = 'ZABITA'; zabitaPrzez = 'harness-wyjątek'; blad = String(err.stderr).split('\n').find((l) => l.includes('błąd harnessu')) ?? null;
      } else {
        status = 'NIE_ZMIERZONO'; blad = `harness exit ${err.status}`;
      }
    }
    // (b) bramka wierności kopii (tylko jeśli harness nie zabił — ten sam wynik, mniej pracy).
    if (status !== 'ZABITA') {
      try {
        execFileSync(process.execPath, [GATE, '--pin-dir', PIN_DIR, '--wybrane', WYBRANE, '--port', MUT], { stdio: 'pipe', timeout: 200000 });
      } catch (err) {
        if (err.status === 1) { status = 'ZABITA'; zabitaPrzez = 'bramka-kopii'; } else { status = 'NIE_ZMIERZONO'; blad = `bramka exit ${err.status}`; }
      }
    }
    results.push({ id, grupa, desc, status, zabitaPrzez, ...(blad ? { blad } : {}) });
  }
} finally {
  rmSync(MUT, { force: true });
}
const count = (s) => results.filter((r) => r.status === s).length;
const summary = {
  part: PART ?? 'all',
  mutantow: results.length,
  zabite: count('ZABITA'),
  przezyte: count('PRZEZYLA'),
  nieZmierzone: count('NIE_ZMIERZONO'),
  results,
};
if (OUT) writeFileSync(resolve(OUT), JSON.stringify(summary, null, 1) + '\n');
console.log(JSON.stringify(summary, null, 1));
process.exit(count('NIE_ZMIERZONO') === 0 && count('PRZEZYLA') === 0 ? 0 : 1);
