STATUS: BLOCK
TEMAT: R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1, podtemat T3 „MIGRACJA-KARTA-TECHNOLOGII"
GOAL: `techDiscoveryNotice.ts` (`showTechDiscoveryNotice`) zaczyna budować treść przez
`technologyAdapter.ts` (`buildEntityCardData`) i renderować przez wspólny `renderer.ts`
(`renderEntityCard`/`openEntityCard`), zamiast własnego DOM-buildera — bez zmiany
publicznej sygnatury/zachowania widocznego dla gracza, z zachowaniem wszystkich 5
świadomych odstępstw z nagłówka `techDiscoveryNotice.ts` (patrz `11-dispatch-T3-...md`).

## Powód BLOCK

Przed jakąkolwiek zmianą kodu przeczytałem w całości:
- `11-dispatch-T3-migracja-technologia.md`,
- `techDiscoveryNotice.ts` (nagłówek 1-44 + cała implementacja `buildBody`/`accordionSection`/
  `unlockItemRow`/`actionItemRow`/`wireInteractions`, linie ~90-552),
- `entityCards/{types,renderer,registry,technologyAdapter,slug}.ts` oraz pozostałe
  adaptery (`buildingAdapter.ts`, `unitAdapter.ts`, `improvementAdapter.ts`) jako
  dodatkowy kontekst kształtu kontraktu z T1.

Kontrakt `EntityCardData`/`EntityCardSection`/`EntityCardRow` z T1 (`types.ts`) oraz
faktyczna implementacja DOM-buildera w `renderer.ts` (`renderEntityCard`) **nie
obsługują** kilku elementów, które dzisiejsza karta odkrycia technologii realnie
posiada, są udokumentowane jako świadome decyzje produktowe i — co ważniejsze —
są dziś jawnie przypięte regexami w `gra/tools/technology-discovery-card-visual-test.cjs`
(48 asercji na dosłownym tekście źródła `techDiscoveryNotice.ts`, m.in. linie 74-83 tego
testu: `UNIT_PREVIEW = 3`, `Pokaż pozostałe ${hiddenUnits}`, `tdn-card--compact`,
`<b>✓</b>` + „spełnione", `data-act="tree"`, brak przycisku „hub badań").
Zgodnie z ograniczeniem allowlisty T3 („Zero zmian w
`entityCards/types.ts`/`renderer.ts`/`registry.ts`/`slug.ts` — jeśli fundament T1
czegoś nie obsługuje, STATUS: BLOCK zamiast cichego rozszerzania") zatrzymuję się
tutaj zamiast dopisywać brakującą funkcjonalność do T1 w tym samym kroku.

Konkretne braki (plik:linia, T1 kontrakt vs. potrzeba T3):

1. **Akordeon sekcji nie działa w rendererze mimo pól w typach.**
   `types.ts:29-31` deklaruje `EntityCardSection.collapsible`/`openDefault` z
   komentarzem wprost: „Akordeon — potrzebne dla kart technologii z wieloma
   odblokowaniami" — czyli T1 świadomie zarezerwował te pola pod T3. Ale
   `renderer.ts` (`renderEntityCard`, sekcja budowy `body`, linie ~106-143) NIGDY
   nie czyta `collapsible`/`openDefault` — każda sekcja renderuje się w pełni
   rozwinięta, bez przycisku nagłówka, bez chevronu, bez `aria-expanded`, bez
   możliwości zwinięcia. Dzisiejsza karta (`accordionSection()` w
   `techDiscoveryNotice.ts:158-177`) ma realne zwijanie/rozwijanie (np. „Ulepszenia
   terenu" domyślnie zwinięte, reszta rozwinięta) wpięte przez `wireInteractions()`
   (linie 449-462) — to zachowanie funkcjonalne, nie kosmetyczne, i nie da się go
   odtworzyć przez `renderEntityCard` bez zmiany `renderer.ts`.
   Dodatkowo `EntityCardSection` nie ma pola `highlighted` (potrzebnego dla sekcji
   „Co możesz teraz zrobić", `techDiscoveryNotice.ts:358-361`, klasa `tdn-sec--hi`).

2. **Brak ikony per wiersz.** `EntityCardRow` (`types.ts:14-20`) ma tylko
   `label`/`value`/`emphasize`/`linkTo` — żadnego pola na SVG. `renderer.ts` buduje
   wiersz przez `.textContent` (linie ~118-121), więc nawet wstrzyknięcie znaczników
   do `label`/`value` nie wyrenderuje się jako HTML. Dzisiejsza karta rysuje kafelek
   ikony (`buildingIconSvg`/`unitIconSvg`/`techIconSvg`/`improvementIconSvg`) przy
   KAŻDYM wierszu odblokowania (`unlockItemRow()`, `techDiscoveryNotice.ts:179-187`,
   używane w sekcjach Budynki/Jednostki/Ulepszenia/Kolejne technologie) — jest tylko
   jeden medalion na całą kartę (`buildMedallionEl`, `renderer.ts:66-72`).

3. **Brak osobnego pola „trailing".** Wiersze jednostek pokazują tytuł+meta po lewej
   i osobny trailing (rola/typ) po prawej (`unlockItemRow` opts.trailing,
   `techDiscoveryNotice.ts:179-187` i użycie w `unitRows`, linia ~374-378) —
   `EntityCardRow` ma tylko dwa sloty tekstu (`label`, `value`).

4. **Brak kolorowanych, per-wiersz odznak (ok/warn/muted).**
   `EntityCardSection.badges?: string[]` (`types.ts:28`) to płaska lista renderowana
   razem na dole sekcji (`renderer.ts:131-141`) — nie jeden kolorowy badge + dowolny
   tekst na osobny wiersz, jak wymaga `actionItemRow(kind, label, text)`
   (`techDiscoveryNotice.ts:189-191`) używane w „Co możesz teraz zrobić"
   (`buildActionItems`, linie 193-216) i w „Kolejne technologie" (badge „Możesz
   badać" per pozycja, linie 400-411).

5. **Brak mechanizmu częściowego ujawniania (paginacja „Pokaż pozostałe N").**
   Sekcja Jednostki pokazuje pierwsze `UNIT_PREVIEW = 3` wiersze, resztę za
   przyciskiem, który dodatkowo przełącza nagłówek karty na wariant kompaktowy
   (`techDiscoveryNotice.ts:373-386`, klasa `tdn-card--compact`,
   `wireInteractions()` linie 463-472). `renderer.ts` renderuje `section.rows`
   zawsze w całości — nic w kontrakcie nie niesie „ile pokazać domyślnie" ani
   referencji do nagłówka karty potrzebnej do przełączenia wariantu kompaktowego.

6. **Brak układu pigułek-z-checkmarkiem dla „Wymagania".**
   `techDiscoveryNotice.ts:435-438` renderuje zawijaną listę pigułek, każda z
   trailing `<b>✓</b>` — inny layout niż siatka `label`/`value` z `renderer.ts`
   (`entity-card-row`/`entity-card-section-grid`).

Powyższe nie są różnicami czysto wizualnymi (kolor/krój) — to funkcjonalne
zachowania (zwijanie sekcji, ujawnianie części listy, ikonografia per pozycja jako
nośnik informacji o typie odblokowania) i są dziś jawnie przypięte testem
regresyjnym `technology-discovery-card-visual-test.cjs` (linie 71-83). Wypełnienie
`technologyAdapter.ts` i przełączenie `showTechDiscoveryNotice` na
`renderEntityCard` w obecnym kształcie `types.ts`/`renderer.ts` oznaczałoby albo
(a) utratę tych zachowań (regresja produktowa, złamanie ww. testu — bo test sam
sprawdza literalne fragmenty starego kodu, które musiałyby zniknąć z aktywnej
ścieżki, choć mogą przetrwać w fallbacku), albo (b) ciche dopisanie obsługi
`collapsible`/ikon-per-wiersz/paginacji/kolorowanych odznak do `entityCards/
types.ts`/`renderer.ts` — co dispatch T3 wprost zakazuje w tym kroku.

## Co NIE zostało zrobione (świadomie, zgodnie z BLOCK)

- `gra/src/ui/entityCards/technologyAdapter.ts` — bez zmian (nadal szkielet z T1).
- `gra/src/ui/techDiscoveryNotice.ts` — bez zmian (stara implementacja
  `buildBody`/`accordionSection`/... zostaje jedyną, aktywną — nic nie przełączono
  na `renderEntityCard`, więc nie ma też potrzeby fallbacku `_legacyBuildBody`:
  nie zmieniałem nic co wymagałoby zachowania starej ścieżki obok nowej).
- Zero zmian w `scienceHubHud.ts`/`techTreeView.ts`/`cityPanel.ts`/
  `entityCards/{types,renderer,registry,slug}.ts` — potwierdzone `git status`
  (czysto, brak niezacommitowanych zmian w `gra/`).

ZMIANY/COMMIT: Brak zmian w `gra/`. Jedyny nowy plik to ten raport
(`dyspozycje/autobot/runs/R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1/12-operator-T3.md`),
commit lokalny na branchu `autobot/R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1` (SHA — patrz
`git log -1` po commicie tego pliku).

TESTY:
- `node gra/tools/technology-discovery-card-visual-test.cjs` → 48 PASS, 0 FAIL (stan
  bazowy, bez zmian w kodzie gry — potwierdza, że BLOCK nie jest spowodowany
  istniejącą regresją).
- `cd gra && npx tsc --noEmit` → jeden pre-istniejący, niezwiązany z zakresem T3 błąd
  konfiguracyjny: `tsconfig.json(15,5): error TS5101: Option 'baseUrl' is deprecated...`
  (dotyczy `compilerOptions.baseUrl`/`ignoreDeprecations`, nie kodu T3 — obecny
  niezależnie od tego zadania, nie wynika ze zmian, bo zmian w kodzie nie ma).
- Build weryfikacyjny (`vite build`) pominięty — brak zmian w `gra/src`, więc nie ma
  czego weryfikować buildem; uruchomienie byłoby zbędnym ryzykiem bez wartości
  dowodowej dla BLOCK.

BLOKADY:
Kontrakt T1 (`entityCards/types.ts` + `renderer.ts`) nie obsługuje: (1) realnego
zwijania/rozwijania sekcji mimo zarezerwowanych pól `collapsible`/`openDefault`
(pole `highlighted` w ogóle nie istnieje), (2) ikony per wiersz odblokowania,
(3) osobnego pola „trailing" obok label/value, (4) kolorowanych odznak (ok/warn/
muted) przypiętych do pojedynczego, dowolnego wiersza tekstu, (5) paginacji
„pokaż pozostałe N" ze sprzężeniem do wariantu kompaktowego nagłówka karty,
(6) układu pigułek-z-checkmarkiem dla sekcji Wymagania. Pełne uzasadnienie i
odniesienia plik:linia — patrz sekcja „Powód BLOCK" wyżej. Bez rozstrzygnięcia
przez właściciela/Evaluatora (czy T1 ma zostać rozszerzone o te elementy jako
osobny krok, czy T3 ma zaakceptować redukcję funkcjonalności/wizualną — co
kolidowałoby z istniejącym testem regresyjnym) nie da się kontynuować migracji
bez naruszenia allowlisty T3 („zero zmian w entityCards/types.ts/renderer.ts z T1").

NASTĘPNY KROK: Evaluator/właściciel decyduje: (a) rozszerzyć `entityCards/
types.ts`/`renderer.ts` o brakujące elementy (per-row icon, `highlighted`,
działający accordion toggle, paginację, kolorowane odznaki per wiersz, layout
pigułek) jako osobny, jawnie zaplanowany krok PRZED ponownym dispatchem T3, albo
(b) jawnie zaakceptować (i zaktualizować `technology-discovery-card-visual-test.cjs`
oraz kryterium ukończenia w planie architektury) redukcję tych zachowań w
migrowanej karcie. Do tego czasu T3 wstrzymane.

DEPLOY/PUSH: NIE WYKONANO
