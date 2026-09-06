/**
 * entityCards/civpediaOpenGate.ts — szew (seam) między KARTĄ ENCJI a HUBEM CIVPEDII.
 *
 * TEMAT: `P-ENTITYCARD-CIVPEDIA-KLIK-MARTWY-Q1`.
 *
 * PRECEDENS (G1 dispatchu — „zgodnie z tym, co projekt JUŻ ROBI dla podobnych
 * przejść"): `gra/src/ui/unitCtxDockDiploGate.ts`, którego nagłówek mówi wprost
 * „Bez importów diplo modułów — checker rejestruje hud.ts". Ten sam kształt:
 * lekki, BEZZALEŻNOŚCIOWY moduł-liść trzyma zarejestrowaną funkcję, konsument
 * (`renderer.ts`) importuje wyłącznie ten liść, a dostawca (`wikiHubHud.ts`)
 * rejestruje w nim swoją implementację przy załadowaniu modułu — dokładnie jak
 * `hud.ts:1558` woła `setDiploOpenChecker(...)`, a `sidePanelHud.ts` importuje
 * sam `unitCtxDockDiploGate`, nigdy modułów dyplomacji.
 *
 * DLACZEGO NIE BEZPOŚREDNI IMPORT `wikiHubHud` w `renderer.ts` (mierzone, nie
 * przeczucie): domknięcie importów `wikiHubHud.ts` to 112 modułów, w tym
 * `brandTokenVars.ts` z importem `./icons/brand/tokens.css?raw` (składnia
 * WYŁĄCZNIE Vite). Istniejące bramki rodziny kart bundlują `renderer.ts` przez
 * esbuild BEZ pluginu dla `?raw` (m.in. `entity-card-contract-test.cjs`, 75/0) —
 * bezpośredni import wywróciłby je, a leżą poza allowlistą tego tematu i nie
 * wolno ich „naprawić przy okazji" (C-025). Ten liść nie importuje NICZEGO, więc
 * bundluje się wszędzie tam, gdzie dziś bundluje się `renderer.ts`.
 *
 * DLACZEGO NIE CALLBACK W DANYCH KARTY (jak `EntityCardAction.onClick`): kartę
 * buduje pięć adapterów wołanych z czterech różnych miejsc gry (`cityPanel.ts`,
 * `unitInfoCard.ts`, `techDiscoveryNotice.ts`, linkowanie krzyżowe wewnątrz
 * `renderer.ts`) — wszystkie poza allowlistą. Callback w danych oznaczałby, że
 * przycisk działa tylko tam, gdzie ktoś pamiętał go podać, czyli dokładnie klasa
 * defektu, którą ten temat naprawia. Zdarzenie na `document` odpada, bo projekt
 * NIE MA takiego wzorca: `grep 'document.dispatchEvent'` w `gra/src` = 0 trafień.
 */

/** Wynik próby otwarcia hasła CivPedii z karty encji.
 *  - `opened` — hub otwarty na właściwym haśle;
 *  - `no-entry` — hasła dla tej encji jeszcze nie napisano (najczęstsza ścieżka:
 *    16 z 41 budynków nie ma hasła — pomiar w raporcie tematu);
 *  - `unavailable` — hub CivPedii nie istnieje w tym kontekście (np. karta
 *    renderowana w izolacji, przed `createWikiHubHud`). */
export type CivpediaOpenResult = 'opened' | 'no-entry' | 'unavailable';

export type CivpediaEntryOpener = (folder: string, gameId: string) => CivpediaOpenResult;

let entryOpener: CivpediaEntryOpener | null = null;

/** Rejestruje realne otwieranie hasła. Wołane z `wikiHubHud.ts` przy załadowaniu
 * modułu — analogicznie do `setDiploOpenChecker` wołanego z `hud.ts`. */
export function setCivpediaEntryOpener(fn: CivpediaEntryOpener): void {
  entryOpener = fn;
}

/** Otwiera hasło CivPedii dla pary (folder, id gry). Gdy nikt nie zarejestrował
 * dostawcy — `'unavailable'`, nigdy wyjątek i nigdy cisza: wołający MUSI pokazać
 * graczowi komunikat (kryterium 2 dispatchu). */
export function openCivpediaEntry(folder: string, gameId: string): CivpediaOpenResult {
  return entryOpener?.(folder, gameId) ?? 'unavailable';
}
