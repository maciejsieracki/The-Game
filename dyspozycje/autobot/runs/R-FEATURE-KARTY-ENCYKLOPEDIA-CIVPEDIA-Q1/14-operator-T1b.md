STATUS: PASS
TEMAT: R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1, podtemat T1b „ROZSZERZENIE KONTRAKTU RENDERERA"
GOAL: `renderer.ts` faktycznie obsługuje wszystkie pola już zarezerwowane/potrzebne w
`types.ts` (patrz `13-dispatch-T1b-rozszerzenie-renderera.md`), żeby T3 (migracja karty
technologii) mogło zacząć bez utraty funkcjonalności — bez zmiany zachowania widocznego
dla gracza, wstecznie kompatybilnie.

## Wykonane (6/6 z dispatchu)

Przed zmianami przeczytałem w całości: `13-dispatch-T1b-rozszerzenie-renderera.md`,
`12-operator-T3.md` (6 luk z plik:linia), `gra/src/ui/entityCards/types.ts`,
`gra/src/ui/entityCards/renderer.ts` (całość) oraz wskazane fragmenty
`gra/src/ui/techDiscoveryNotice.ts` (`iconTile`/`badge`/`accordionSection`/
`unlockItemRow`/`actionItemRow`/`buildActionItems` linie ~148-216, `buildBody` linie
341-447 w tym `UNIT_PREVIEW`/paginacja/pigułki wymagań, `wireInteractions` 449-472).
Sprawdziłem też `unitInfoCard.ts` (`header.innerHTML = ...medallionHtml(...)`) jako
istniejący wzorzec bezpiecznego wstawiania SVG jako markup — `renderer.ts` już go
używał dla medalionu (`buildMedallionEl`), rozszerzyłem TĘ SAMĄ technikę
(`el.innerHTML = svg`) na ikonę per wiersz, zamiast wymyślać nowy mechanizm.

1. **Akordeon działający.** `EntityCardSection.collapsible`/`openDefault` są teraz
   realnie obsłużone w `renderer.ts` (`buildSectionEl`): przycisk nagłówka (`<button
   class="entity-card-section-head">`), chevron (▾/▸), `aria-expanded`, `data-open`
   na sekcji, `hidden` na body sekcji, click-handler przełączający stan — wzorem
   `accordionSection()`/`wireInteractions()` z `techDiscoveryNotice.ts`. Dodano
   `EntityCardSection.highlighted?: boolean` (klasa `entity-card-section--hi`, wzorem
   `tdn-sec--hi`). Sekcje BEZ `collapsible` renderują się jak wcześniej (h3 statyczny,
   zawsze rozwinięte) — zero zmiany zachowania dla dotychczasowych wywołań.
2. **Ikona per wiersz.** Dodano `EntityCardRow.icon?: {kind:'svg'; svg:string}` do
   `types.ts`. `renderer.ts` (`buildGridRowEl`) wstawia ją jako kafelek
   (`.entity-card-row-icon`) przez `el.innerHTML = row.icon.svg` (markup, NIE
   `.textContent`) — zweryfikowane osobną asercją testową sprawdzającą
   `querySelector('svg[...]')` w DOM oraz brak `"<svg"` w `.textContent`.
3. **Pole „trailing".** Dodano `EntityCardRow.trailing?: string` — renderowane jako
   osobny `<span class="entity-card-row-trailing">` obok `label`/`value`, wzorem
   `unlockItemRow()` opts.trailing.
4. **Kolorowane odznaki per wiersz.** Dodano `EntityCardRow.badge?: {kind:'ok'|'warn'
   |'muted'; label:string}`. Gdy wiersz ma `badge`, `buildGridRowEl` renderuje go jak
   `actionItemRow(kind, label, text)`: badge kolorowy (`entity-card-row-badge--ok/
   warn/muted`) + `row.value` jako tekst — zamiast siatki label/value. Odrębne od
   istniejącego, płaskiego `EntityCardSection.badges?: string[]` (bez zmian).
5. **Paginacja „Pokaż pozostałe N".** Dodano `EntityCardSection.previewLimit?:
   number` — `buildSectionEl` renderuje pierwsze `previewLimit` wierszy, resztę w
   ukrytym kontenerze za przyciskiem „Pokaż pozostałe N" (`.entity-card-more`),
   analogicznie do `UNIT_PREVIEW`/`techDiscoveryNotice.ts:373-386`. **Sprzężenie z
   wariantem kompaktowym nagłówka KARTY wymagało WIĘCEJ niż jednego pola** — zgodnie
   z dispatchem opisuję to jawnie zamiast robić po cichu: dodano
   `EntityCardData.compactHeaderOnExpand?: boolean` (poziom karty, nie sekcji) +
   logikę w `renderer.ts` (`buildSectionEl` przyjmuje `compactHeaderOnExpand:
   boolean` przekazane z `renderEntityCard`, click-handler przycisku „Pokaż
   pozostałe" dodaje klasę `entity-card--compact` do `card` root TYLKO gdy ta flaga
   jest `true`). To dwa elementy (pole na `EntityCardData` + gałąź renderera), nie
   jeden — nie dało się tego rozwiązać lokalnie w obrębie samej sekcji, bo klasa
   kompaktowa dotyczy CAŁEGO nagłówka karty (medalionu), nie tylko sekcji z
   paginacją. CSS `.entity-card--compact .entity-card-medallion{...}` dodany
   analogicznie do `tdn-card--compact`.
6. **Layout pigułek-z-checkmarkiem.** Dodano `EntityCardSection.layout?: 'grid' |
   'pills'` (domyślnie `'grid'`, zero zmiany dla istniejących wywołań). W trybie
   `'pills'` `buildSectionEl` woła `buildPillRowEl` zamiast `buildGridRowEl` —
   zawijana lista (`.entity-card-section-pills`) pigułek (`.entity-card-pill`) z
   tekstem `row.label` i trailing `<b>✓</b>`, wzorem `techDiscoveryNotice.ts:435-438`.

## Ograniczenia dotrzymane

- Zero edycji `techDiscoveryNotice.ts`/adapterów (`technologyAdapter.ts`,
  `buildingAdapter.ts`, `unitAdapter.ts`, `improvementAdapter.ts`)/`scienceHubHud.ts`/
  `techTreeView.ts`/`cityPanel.ts` — potwierdzone `git status` po zmianach: wyłącznie
  `entityCards/types.ts`, `entityCards/renderer.ts`, `tools/entity-card-contract-test.cjs`.
- Wszystkie nowe pola (`EntityCardRow.icon/trailing/badge`,
  `EntityCardSection.highlighted/previewLimit/layout`,
  `EntityCardData.compactHeaderOnExpand`) są opcjonalne (`?`) — kod adapterów z T1
  (które ich nie ustawiają) kompiluje się i działa bez zmian.
- Stary test `entity-card-contract-test.cjs` (47 asercji z T1) przechodzi BEZ ZMIAN w
  swojej treści — dopisałem nowe asercje jako oddzielny blok na końcu pliku, nie
  ruszając istniejących.

ZMIANY/COMMIT:
- `gra/src/ui/entityCards/types.ts` — nowe opcjonalne pola (patrz wyżej).
- `gra/src/ui/entityCards/renderer.ts` — `buildSectionEl`/`buildGridRowEl`/
  `buildPillRowEl` (nowe funkcje), `renderEntityCard` deleguje budowę sekcji do
  `buildSectionEl`; nowe reguły CSS w `ENTITY_CARD_CSS` dla ikon/trailing/badge/
  pigułek/wariantu kompaktowego/akordeonu.
- `gra/tools/entity-card-contract-test.cjs` — 28 nowych asercji (6 bloków, po 1 na
  funkcjonalność z dispatchu) na danych fixture, dopisanych PO istniejących 47.
- Commit lokalny na branchu `autobot/R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1` — SHA
  patrz `git log -1` po commicie tego raportu (kod + raport w jednym commicie).

TESTY:
- `cd gra && npx tsc --noEmit` → czyste, exit 0 (brak nawet pre-istniejącego
  ostrzeżenia TS5101 zaobserwowanego w `12-operator-T3.md` — najwyraźniej zależne od
  cache/wersji npx w tym uruchomieniu; niezwiązane ze zmianami T1b).
- `node gra/tools/entity-card-contract-test.cjs` → **75 PASS, 0 FAIL** (47
  pierwotnych z T1 bez zmian treści + 28 nowych dla T1b, po jednym bloku per
  funkcjonalność 1-6).
- `node gra/tools/technology-discovery-card-visual-test.cjs` → 48 PASS, 0 FAIL (stan
  bazowy nienaruszony — potwierdza zero regresji w `techDiscoveryNotice.ts`, którego
  nie dotykałem).
- Build weryfikacyjny: `cd gra && node ./node_modules/vite/bin/vite.js build --outDir
  dist --emptyOutDir` → `✓ built in 23.52s`, bez błędów (dist/ usunięty po
  weryfikacji, nieśledzony przez git).
- Uwaga infrastrukturalna: worktree nie miał `node_modules` (świeży `git worktree`,
  katalog nieśledzony) — utworzyłem tymczasowy symlink `gra/node_modules ->
  ../../../gra/node_modules` (repo główne) na czas testów/buildu, usunięty przed
  commitem (niewidoczny w `git status`, nie wchodzi do commitu).

BLOKADY: brak.

NASTĘPNY KROK: T3 (migracja `techDiscoveryNotice.ts`/`showTechDiscoveryNotice` na
`buildEntityCardData`+`technologyAdapter.ts`+`renderEntityCard`) może zostać
ponownie zdispatchowane — fundament `entityCards/types.ts`+`renderer.ts` obsługuje
teraz wszystkie 6 zachowań z `12-operator-T3.md`. Uwaga dla T3: przy wypełnianiu
`technologyAdapter.ts` zwrócić uwagę na kolejność argumentów `EntityCardRow.badge`
(label=etykieta badge'a, value=tekst obok — analogicznie do `actionItemRow(kind,
label, text)`, NIE `(kind, text, label)`) oraz na to, że `compactHeaderOnExpand`
trzeba jawnie ustawić `true` na `EntityCardData` zwracanym przez adapter technologii,
żeby zachować dzisiejsze sprzężenie paginacji jednostek z kompaktowym nagłówkiem.

DEPLOY/PUSH: NIE WYKONANO
