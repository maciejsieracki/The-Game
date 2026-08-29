STATUS: PASS
TEMAT: R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1, podtemat T3 „MIGRACJA-KARTA-TECHNOLOGII" (druga próba, po T1b)
GOAL: `techDiscoveryNotice.ts` (`showTechDiscoveryNotice`) zaczyna budować treść przez
`technologyAdapter.ts` (`buildEntityCardData`) i renderować przez wspólny `renderer.ts`
(`renderEntityCard`), zamiast własnego DOM-buildera — bez zmiany publicznej sygnatury,
z zachowaniem wszystkich 5 świadomych odstępstw z nagłówka `techDiscoveryNotice.ts`.

## Co zostało zrobione

1. `gra/src/ui/entityCards/technologyAdapter.ts` — wypełniony prawdziwą treścią, czytając
   `tech.json`/`buildings.json`/`units.json`/`terrain-improvements.json` dokładnie jak
   dawny `techDiscoveryNotice.ts::buildBody` (sekcje: „Co możesz teraz zrobić" (highlighted,
   collapsible, openDefault=true, badge per wiersz ok/warn/muted), „Budynki" (collapsible,
   icon per wiersz), „Jednostki" (collapsible, `previewLimit=UNIT_PREVIEW=3`, trailing,
   icon), „Ulepszenia terenu" (collapsible, openDefault=false, icon zmapowany przez
   `IMPROVEMENT_NAME_TO_KEY`), „Kolejne technologie" (badge „Możesz badać" gdy jedyny
   wymóg spełniony, inaczej `value: "Wymaga też: ..."` + icon), „Zmiany ekonomiczne"
   (collapsible, openDefault=false), „Wymagania" (`layout: 'pills'`), plus sekcja
   „Informacja" (fallback pustej karty). `compactHeaderOnExpand: true` na poziomie
   `EntityCardData`. Adapter jest samodzielny (jak `buildingAdapter.ts`/`unitAdapter.ts`),
   nie importuje z `techDiscoveryNotice.ts`.
2. `gra/src/ui/techDiscoveryNotice.ts` — `showTechDiscoveryNotice(opts)` (sygnatura BEZ
   ZMIAN) teraz: znajduje wiersz tech (jak dawniej), próbuje nowej ścieżki
   `showTechDiscoveryNoticeViaEntityCard` (wołanie `buildEntityCardData('technology', id,
   {})` + `renderEntityCard`, nagłówek — kicker/status/epoka/poziom/kamień milowy/hint
   podglądu — budowany lokalnie z danych tech i wpisany w `subtitle`/`statusBadges`
   zwróconego `EntityCardData`, akcje „Rozpocznij badanie"/„Otwórz drzewo" jako
   `EntityCardAction[]`, przycisk zamknięcia ✕ dopisany do zbudowanego DOM po
   `renderEntityCard` — bo `renderer.ts` go nie rysuje i nie wolno go edytować). W razie
   wyjątku na tej ścieżce (`catch`) — fallback do `_legacyShowTechDiscoveryNotice(tech,
   opts)`, czyli DAWNEJ implementacji (`buildBody`/`accordionSection`/`wireInteractions`),
   przeniesionej 1:1 pod prywatną (nieeksportowaną) nazwą, bez zmiany treści. `hideTech-
   DiscoveryNotice`/`isTechDiscoveryNoticeOpen` bez zmian (nadal operują na tym samym
   `HOST_ID`, więc działają identycznie dla obu ścieżek).
3. Wstrzyknięcie stylów: `ENTITY_CARD_CSS` (reeksport `renderer.ts`, T3 jest pierwszym
   realnym konsumentem — dotąd żaden kod produkcyjny go nie wołał) + lokalne nadpisania
   (szerokość karty, pozycjonowanie w `#${HOST_ID}`, styl przycisku zamknięcia) w nowej
   funkcji `ensureEntityCardOverrideStyles()`.

## 5 świadomych odstępstw z nagłówka pliku — zweryfikowane, zachowane

1. Pasek „Efekt" pominięty — nadal pominięty (adapter go nie generuje).
2. „Co możesz teraz zrobić" budowane z szablonów + realnymi nazwami — 1:1 przeniesione
   do `technologyAdapter.ts` (te same warunki/kolejność/teksty co `buildActionItems`).
3. „Kolejne technologie" — logika „jedyny wymóg = ta technologia" → badge „Możesz badać",
   inaczej „Wymaga też: {lista}" — 1:1 przeniesiona.
4. Tryb „podgląd" steruje wyłącznie nagłówkiem (kicker/status) — bez zmian, `opts.kind`
   nadal jedynym wejściem różnicującym.
5. Przycisk „Otwórz hub badań" — nadal nie renderowany (nie ma go ani w adapterze, ani
   w akcjach budowanych w `showTechDiscoveryNoticeViaEntityCard`).

## Znane, świadome delty (kontrakt T1b w obecnym kształcie nie niesie 1:1 wszystkiego)

- Przycisk „Pokaż pozostałe N" (paginacja jednostek) w `renderer.ts` generuje tekst
  „Pokaż pozostałe N" bez polskiej odmiany rzeczownika („jednostkę/jednostki/jednostek"),
  którą miał stary `unitsBody` (`pluralPl()`). Renderer jest poza allowlistą T3 — udoku-
  mentowane w komentarzu `technologyAdapter.ts` jako świadoma, akceptowana delta języ-
  kowa (ta sama liczba, ten sam mechanizm ujawniania, mniej precyzyjny tekst przycisku).
- Nagłówek generycznej karty (`entity-card-header`) nie ma osobnego miejsca na „kicker"
  nad tytułem — kicker+status trafiają do `statusBadges` (badge obok `<h2>`), a
  epoka/poziom/kamień milowy/hint podglądu do `subtitle` (jedna linia tekstu) zamiast
  osobnych elementów. Treść identyczna, układ inny — zgodnie z kryterium ukończenia
  z `11-dispatch-...md` („nie identyczny HTML, ale te same informacje").
- Przycisk zamknięcia (✕) nie jest częścią `renderer.ts` — dopisany post-hoc do DOM
  zwróconego przez `renderEntityCard` w `techDiscoveryNotice.ts` (manipulacja gotowego
  elementu, zero edycji `renderer.ts`).

## ZMIANY/COMMIT

Pliki zmienione (poza tym raportem):
- `gra/src/ui/entityCards/technologyAdapter.ts` (pełna treść zamiast szkieletu T1)
- `gra/src/ui/techDiscoveryNotice.ts` (nowa ścieżka + fallback prywatny)

Zero zmian w: `scienceHubHud.ts`, `techTreeView.ts`, `cityPanel.ts`,
`entityCards/{types,renderer,registry,slug}.ts` — potwierdzone `git diff --stat` (puste)
i `grep showTechDiscoveryNotice(` w 3 wołających (4 miejsca wywołania, bez zmian w kodzie
wywołującym). Commit lokalny na branchu `autobot/R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1`
(SHA — patrz `git log -1` po commicie tego raportu razem z kodem).

## TESTY

- `cd gra && npx tsc --noEmit` → czysto poza tym samym pre-istniejącym błędem
  konfiguracyjnym co w BLOCK z pierwszej próby (`tsconfig.json(15,5): TS5101 baseUrl
  deprecated`, niezwiązany z T3, obecny niezależnie od tej zmiany).
- `node gra/tools/technology-discovery-card-visual-test.cjs` → **48 PASS, 0 FAIL**.
- `node gra/tools/entity-card-contract-test.cjs` (bunduje realny `renderer.ts` przez
  esbuild+jsdom, wywołuje `buildEntityCardData('technology', technologyIdFromName
  ('Łowiectwo'), {})` na PRAWDZIWYM `technologyAdapter.ts`) → **75 pass, 0 fail**
  (obejmuje wszystkie 6 mechanizmów T1b: akordeon, ikona per wiersz, trailing, badge,
  paginacja+compactHeaderOnExpand, layout pills).
- Build weryfikacyjny: `node ./node_modules/vite/bin/vite.js build --outDir dist
  --emptyOutDir` (z `gra/`) → **✓ built in 21.11s**, 844 modułów, brak błędów.
  (Uwaga proceduralna: worktree nie miał zainstalowanego `node_modules` — użyty
  tymczasowy symlink do `node_modules` głównego repo, zweryfikowany identyczny
  `package.json`/`package-lock.json` diff-em przed użyciem; symlink i `dist/` usunięte
  po weryfikacji, `git status` czyste poza dwoma plikami produkcyjnymi.)

## BLOKADY

Brak. Kontrakt T1b (`collapsible`/`openDefault`/`highlighted`, `icon`/`trailing`/`badge`
per wiersz, `previewLimit`+`compactHeaderOnExpand`, `layout: 'pills'`) w pełni wystarczył
do migracji treści bez potrzeby dalszego rozszerzania `types.ts`/`renderer.ts`. Jedyne
delty są udokumentowane wyżej jako świadome, akceptowalne redukcje kosmetyczno-językowe
(nie funkcjonalne), zgodne z kryterium „treść równoważna, nie identyczny HTML".

## NASTĘPNY KROK

Evaluator → Final Control tego kroku (T3 retry) → integracja orkiestratora. Po PASS
Final Control: rozważyć osobny, drobny temat dla braku odmiany rzeczownika w przycisku
„Pokaż pozostałe N" w `renderer.ts` (jeśli właściciel uzna to za wartą naprawy regresję
językową) — poza allowlistą i zakresem T3.

DEPLOY/PUSH: NIE WYKONANO
