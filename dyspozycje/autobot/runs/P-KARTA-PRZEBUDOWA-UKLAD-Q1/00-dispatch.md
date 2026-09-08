STATUS: DISPATCH
DOMAIN: GAME
TEMAT: P-KARTA-PRZEBUDOWA-UKLAD-Q1
GOAL: Wdroż zaakceptowany przez właściciela nowy UKŁAD (kolejność sekcji) kart budynków i
jednostek w istniejącym wspólnym systemie kart encji (`gra/src/ui/entityCards/`). To jest
TEMAT WYŁĄCZNIE INFRASTRUKTURALNY/STRUKTURALNY — układ, kontrakt typów, renderer, adaptery —
BEZ masowego autorstwa nowej treści (opis/top3 per konkretny budynek/jednostka to OSOBNA,
przyszła fala, wzorem `R-KARTY-HISTORIA-Q1`). W tej rundzie wystarczy, że struktura działa
poprawnie z danymi, które już istnieją — brakującą treść pokazuj jako pustą/pominiętą sekcję,
nie wymyślaj jej.

KONTEKST — PRZECZYTAJ W CAŁOŚCI PRZED PIERWSZĄ ZMIANĄ KODU:
- Właściciel zaakceptował w rozmowie (2026-09-08) plan przebudowy kart, po jednej rundzie
  poprawek (dodanie punktu "rozszerzony opis" nazwanego wprost "rys historyczny" między
  punktami 2-3). Zaakceptowany plan, DOSŁOWNIE (to jest wiążąca specyfikacja tego tematu, nie
  punkt wyjścia do dalszej dyskusji):

  **Karta budynku — kolejność sekcji:**
  1. Nagłówek (ikona, nazwa, POZIOM/EPOKA na górze)
  2. Wymagania (skonsolidowane: technologia, budynek-wymóg, surowce)
  3. Opis (1-2 zdania)
  4. Rys historyczny (rozszerzony opis, WŁASNA nazwana sekcja — NIE "Historia"/"Historical
     note" bez etykiety, dosłownie nazwana "Rys historyczny")
  5. Top 3 (najważniejsze efekty/odblokowania)
  6. Charakterystyka (kategoria/epoka/typ, BEZ poziomu — poziom już jest w nagłówku)
  7. Efekty/Plony (ikona per surowiec)
  8. Koszty — podzielone na DWIE osobne pod-sekcje: "Koszt budowy" i "Koszt utrzymania"
  9. Poziomy
  10. Więcej informacji (link CivPedia)

  **Karta jednostki — kolejność sekcji:**
  1. Nagłówek
  2. Wymagania (technologia, kultura, budynek rekrutujący)
  3. Opis
  4. Rys historyczny (jw. — WŁASNA nazwana sekcja, między Opis i Top3)
  5. Top 3
  6. Charakterystyka (Linia/Klasa/Typ/Zastępuje)
  7. Statystyki bojowe — DWIE pod-sekcje: "Podstawowe" ZAWSZE WIDOCZNE (Atak/Obrona/HP/
     Pancerz/Przebicie/Ruch/Zasięg) + "Zaawansowane" ZWIJANA/collapsible (bonus szarży/ruch
     bitwy/pociski/widok pola/kary flanki-tyłu/próg dezercji/morale)
  8. Kontry (WŁASNA sekcja — dziś połączona z Wymaganiami, ma być rozdzielona)
  9. Koszty — DWIE pod-sekcje: "Koszt rekrutacji" i "Utrzymanie"
  10. Rys historyczny — UWAGA: właściciel przesunął rys historyczny na pozycję 4 (patrz wyżej,
      między Opis i Top3) w OBU typach kart w wersji ostatecznie zaakceptowanej — NIE zostawiaj
      go też/tylko na końcu jako pozycję 10 z wcześniejszego szkicu; jeśli w trakcie pracy
      zauważysz sprzeczność między "pozycja 4" a "pozycja 9/10" we wcześniejszych notatkach
      tego projektu, POZYCJA 4 (zaraz po Opisie) JEST OSTATECZNIE ZAAKCEPTOWANA — zatrzymaj się
      i zgłoś DECISION_REQUIRED zamiast zgadywać, jeśli po świeżym przeczytaniu wciąż widzisz
      realną sprzeczność w tym dispatchu.
- ABC właściciela 2026-09-08 (osobne pytanie, AskUserQuestion, odpowiedź "Przenieś wszędzie
  (Recommended)"): stara decyzja `P-KARTA-OPIS-PRZED-STATYSTYKAMI-Q1` (Rys historyczny ZAWSZE
  zaraz po nagłówku, przed wszystkimi sekcjami, dla WSZYSTKICH typów kart) jest niniejszym
  UCHYLONA w całości i zastąpiona nowym układem z tego dispatchu (Rys historyczny jako WŁASNA
  nazwana sekcja na pozycji 4, zaraz po Opisie) — dla WSZYSTKICH typów encji (unit/building/
  technology/improvement/wonder), nie tylko dla budynków/jednostek z tej rundy. Renderer ma
  JEDEN wspólny punkt pozycjonowania historii (`renderer.ts::renderEntityCard`, patrz notatka
  z poprzedniego tematu — `historia` był dotąd doklejany PO `body` przez zwykłe
  `card.appendChild()`, nie przez pozycję w tablicy `sections`) — zmień GO, nie osobno per typ.
- ZNANE BLOKERY z prototypu Opus 5 (2026-09-08, worktree `/home/user/wt-karty-prototyp`, już
  usunięty — patrz `dyspozycje/autobot/runs/PROTOTYP-KARTY-BUDYNEK-JEDNOSTKA/`):
  a. "wymagane surowce do odblokowania" (część sekcji Wymagania) NIE MA odpowiednika w modelu
     danych — istnieje wyłącznie JEDNORAZOWY koszt budowy, nie "surowce wymagane do
     odblokowania" jako osobne pole. NIE WYMYŚLAJ nowego pola/mechaniki w tym temacie —
     sekcja Wymagania w tej rundzie pokazuje to, co faktycznie istnieje (technologia,
     budynek-wymóg), a jednorazowy koszt budowy zostaje w sekcji Koszty (pozycja 8/9), nie w
     Wymaganiach. Jeśli właściciel chciał czegoś więcej, to DECISION_REQUIRED, nie zgadywanie.
  b. "budynek rekrutujący" (jednostki) nigdy się nie wypełnia — brak danych dla żadnej
     jednostki dziś. Renderuj sekcję/wiersz TYLKO gdy dane istnieją; gdy brak — pomiń wiersz
     całkowicie (nie pokazuj pustego/"—"), zgodnie z zasadą tego tematu "brak treści = brak
     sekcji, nie wymyślona treść".
  c. `statuses` (żywe statusy bitwy, używane przez `unitInfoCard.ts:86`) MUSI pozostać
     zachowane i działać identycznie jak dziś — nie jest częścią nowego widocznego układu
     powyżej, ale nie usuwaj go/nie przenoś w sposób który zepsuje `unitInfoCard.ts`.
- Pliki kontraktu/renderera/adapterów (świeżo zweryfikuj dokładne nazwy i numery linii, mogły
  się przesunąć): `gra/src/ui/entityCards/types.ts` (kontrakt `EntityCardSection`/
  `EntityCardData`, w tym `EntityCardSection.layout` warianty `'prose'`/`'top3'` z prototypu —
  sprawdź czy zostały wdrożone do głównego kontraktu czy istnieją tylko w patchu prototypu),
  `gra/src/ui/entityCards/renderer.ts` (`renderEntityCard`, kolejność appendChild sekcji),
  `gra/src/ui/entityCards/buildingAdapter.ts`, `gra/src/ui/entityCards/unitAdapter.ts`.
  Prototyp (`prototyp-uklad-kart.patch` w `dyspozycje/autobot/runs/PROTOTYP-KARTY-BUDYNEK-
  JEDNOSTKA/`) jest REFERENCJĄ zatwierdzonego wizualnie kierunku (3 zrzuty PNG w tym samym
  katalogu), NIE gotowym kodem do ślepego zastosowania — zweryfikuj go świeżo, dopasuj do
  aktualnego stanu `main` (mógł się rozjechać), i POPRAW gdziekolwiek nie zgadza się z
  ostatecznie zaakceptowaną kolejnością z tego dispatchu (w szczególności pozycja rysu
  historycznego — patrz wyżej).

ZADANIE:
1. Zaktualizuj kontrakt typów (`types.ts`) jeśli potrzeba nowych pól/wariantów sekcji (np.
   `layout: 'prose' | 'top3'` z prototypu, podział Koszty na dwie pod-sekcje, podział
   Statystyki bojowe na Podstawowe/Zaawansowane collapsible).
2. Zmień `renderer.ts::renderEntityCard` tak, żeby Rys historyczny renderował się na
   pozycji 4 (zaraz po Opisie) dla WSZYSTKICH typów encji (jeden wspólny punkt, nie osobno per
   adapter) — to jest uchylenie `P-KARTA-OPIS-PRZED-STATYSTYKAMI-Q1` w całości.
3. Zaktualizuj `buildingAdapter.ts` i `unitAdapter.ts` tak, żeby zwracały sekcje w
   zaakceptowanej kolejności z ZADANIA/KONTEKSTU wyżej, używając WYŁĄCZNIE danych, które już
   istnieją w modelu (żadnego nowego autorstwa treści opisowej per encja — jeśli `opis`/`top3`
   dla konkretnego budynku/jednostki jeszcze nie istnieje w danych, sekcja/wiersz jest po
   prostu pusta/pominięta w tej rundzie, wypełnianie treści to następna, osobna fala).
4. Zachowaj działanie `statuses` (żywe statusy bitwy) bez regresji — zweryfikuj wprost przez
   `unitInfoCard.ts`.
5. Żywy dowód (Chromium/Playwright, real render — to jest temat wizualny, wymaga zrzutów wg
   R-PROC-AUTOBOT.md §9 pkt 6a): otwórz kartę budynku i kartę jednostki, potwierdź kolejność
   sekcji zrzutem ekranu zgodną z zaakceptowanym układem, w tym POZYCJĘ rysu historycznego.

BINARNE KRYTERIUM SUKCESU: karta budynku i karta jednostki renderują sekcje w DOKŁADNIE
zaakceptowanej kolejności (potwierdzone zrzutem żywego Chromium), rys historyczny na pozycji 4
dla WSZYSTKICH typów kart (unit/building/technology/improvement/wonder — sprawdź żywo
przynajmniej jedną kartę technologii/ulepszenia/cudu żeby potwierdzić brak regresji reszty
typów), `statuses` bez regresji, żadnej nowej zmyślonej treści opisowej. `tsc --noEmit`
czysty, 5 bramek referencyjnych zielone, istniejące testy kart encji (pliki z "entity-card"/
"entitycard" w nazwie w `gra/tools/`) zielone lub świadomie zaktualizowane (np. odwrócona
asercja pozycji historii, wzorem poprzedniego tematu).

ALLOWLISTA:
- `gra/src/ui/entityCards/types.ts`
- `gra/src/ui/entityCards/renderer.ts`
- `gra/src/ui/entityCards/buildingAdapter.ts`
- `gra/src/ui/entityCards/unitAdapter.ts`
- `gra/tools/*-test.cjs` (rozszerzenie istniejących testów kart encji + nowy test kolejności
  jeśli potrzeba)
- `dyspozycje/autobot/runs/P-KARTA-PRZEBUDOWA-UKLAD-Q1/*`
Zakaz `git add -A`. Zakaz masowego autorstwa treści opisowej per budynek/jednostka (osobna,
przyszła fala — patrz GOAL). Zakaz zmiany innych adapterów (technologyAdapter/
improvementAdapter/wonderAdapter) POZA zmianą pozycji rysu historycznego w `renderer.ts`
(wspólny punkt — te adaptery nie potrzebują zmiany danych, tylko renderer zmienia kolejność).

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz deklaracji "gotowe" bez żywego zrzutu Chromium
pokazującego faktyczną kolejność sekcji (to jest temat czysto wizualny/strukturalny — sam
kod może "wyglądać" poprawnie i mimo to renderować się w złej kolejności, jak pokazał
poprzedni temat tej samej rodziny). Zakaz wymyślania treści opis/top3 dla konkretnych
budynków/jednostek — to nie jest ten temat.

IZOLACJA: nowy worktree `/home/user/wt-karta-przebudowa`, gałąź
`autobot/P-KARTA-PRZEBUDOWA-UKLAD-Q1`, baza `origin/main` @ najświeższy commit w chwili startu
(sprawdź `git fetch origin main` przed założeniem worktree).
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`; jedyna dozwolona komenda buildu do
bramki Chromium: `node ./node_modules/vite/bin/vite.js build --outDir <poza repo>
--emptyOutDir`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty) → Final Control (Ścieżka A,
Workflow) — temat wizualny/UI, wymaga Final Control z żywym zrzutem.
DEPLOY/PUSH: NIE WYKONANO
