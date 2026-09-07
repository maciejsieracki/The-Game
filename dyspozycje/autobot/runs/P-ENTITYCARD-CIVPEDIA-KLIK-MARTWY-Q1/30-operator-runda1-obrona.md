# P-ENTITYCARD-CIVPEDIA-KLIK-MARTWY-Q1 — Operator, obrona (runda 1)

STATUS: PASS
DOMAIN: GAME
TEMAT: `P-ENTITYCARD-CIVPEDIA-KLIK-MARTWY-Q1`
GOAL: Klik w „Więcej informacji (Civpedia)" otwiera właściwe hasło dla wszystkich rodzajów
kart; brak hasła daje czytelny komunikat, nie ciszę.
RUNDA: 1/5 (obrona = II faza tej samej rundy)

Wszystkie cztery zarzuty **PRZYJMUJĘ**. Żaden nie dotyczy substancji (Evaluator zweryfikował
ją niezależnie i potwierdził), wszystkie dotyczą śladu procesowego. Ten plik uzupełnia braki;
zarzut 4 wymagał także poprawki komentarzy w kodzie produkcyjnym.

---

## Zarzut 1 — lista 26 bramek rodziny z wynikiem każdej

Wyznaczenie: `ls gra/tools/*.cjs | grep -Ei 'entity-card|entitycard|civpedia|karty'` → 26.
Wszystkie uruchomione ponownie w tej fazie (po poprawkach komentarzy).

| # | bramka | wynik | exit |
|---|---|---|---|
| 1 | `building-detail-card-entitycard-migration-test.cjs` | **51 / 1 FAIL** | 1 |
| 2 | `civpedia-budynki-historia-test.cjs` | 136 / 0 | 0 |
| 3 | `civpedia-caly-wiersz-przyciskiem-test.cjs` | 85 / 85 | 0 |
| 4 | `civpedia-cross-link-style-real-render-test.cjs` | 20 / 0 | 0 |
| 5 | `civpedia-cuda-historia-test.cjs` | 126 / 0 | 0 |
| 6 | `civpedia-gra-id-mostek-test.cjs` | wszystkie PASS (+ idempotencja bundle) | 0 |
| 7 | `civpedia-historia-infra-test.cjs` | 18 / 0 | 0 |
| 8 | `civpedia-jednostki-j1-test.cjs` | 161 / 0 | 0 |
| 9 | `civpedia-jednostki-j2-test.cjs` | 157 / 0 | 0 |
| 10 | `civpedia-karty-nazwa-przyciskiem-test.cjs` | 27 / 0 | 0 |
| 11 | `civpedia-karty-spojnosc-q1-c-test.cjs` | 24 / 0 | 0 |
| 12 | `civpedia-technologie-rys-historyczny-test.cjs` | 324 / 0 | 0 |
| 13 | `civpedia-ulepszenia-historia-batch-test.cjs` | 116 / 0 | 0 |
| 14 | `civpedia-wikihubhud-rys-historyczny-duplikacja-test.cjs` | 7 / 0 | 0 |
| 15 | `entity-card-action-buttons-real-render-test.cjs` | **30 / 1 FAIL** | 1 |
| 16 | `entity-card-contract-test.cjs` | **75 / 0** (wskazana w dyspozycji) | 0 |
| 17 | `entity-card-cross-links-button-style-real-render-test.cjs` | 34 / 0 | 0 |
| 18 | `entity-card-cross-links-nested-overlay-test.cjs` | **16 / 8 FAIL** | 1 |
| 19 | `entity-card-diorama-real-render-test.cjs` | 46 / 0 | 0 |
| 20 | `entity-card-historia-section-test.cjs` | 31 / 0 | 0 |
| 21 | `entity-card-single-dialog-real-render-test.cjs` | 25 / 0 | 0 |
| 22 | `entity-card-wonder-test.cjs` | 134 / 0 | 0 |
| 23 | `entitycard-civpedia-klik-test.cjs` (NOWA, ten temat) | **71 / 0** | 0 |
| 24 | `entitycard-sufit-dwoch-kart-test.cjs` | 67 / 0 | 0 |
| 25 | `unit-detail-card-entitycard-migration-test.cjs` | **37 / 2 FAIL** | 1 |
| 26 | `unit-info-card-entitycard-migration-test.cjs` | 26 / 0 | 0 |

**22 zielone, 4 czerwone.** Czerwień (#1, #15, #18, #25) potwierdzona jako **zastana** —
te same liczby (51/1, 30/1, 16/8, 37/2) na `f4cc06cd^`; weryfikował też niezależnie Evaluator.
Leżą poza allowlistą, nie były dotykane (C-025).

## Zarzut 2 — G1: wybrany wzorzec i jego precedens (brak w raporcie)

Uzasadnienie istniało wyłącznie w komentarzu `civpediaOpenGate.ts` i w treści commitu
`f4cc06cd`; raport rundy pierwszej nie powstał, bo przebieg przerwał limit sesji przed jego
zapisem. Uzupełniam:

**Wybrany wzorzec: szew (seam) — bezzależnościowy moduł-liść z rejestracją dostawcy.**
Nowy `gra/src/ui/entityCards/civpediaOpenGate.ts` trzyma zarejestrowaną funkcję; konsument
(`renderer.ts`) importuje wyłącznie ten liść, dostawca (`wikiHubHud.ts`) rejestruje w nim
implementację przy załadowaniu modułu.

**Precedens w tym projekcie: `gra/src/ui/unitCtxDockDiploGate.ts`.** Ten sam kształt —
`hud.ts:1558` woła `setDiploOpenChecker(...)`, a `sidePanelHud.ts` importuje sam gate, nigdy
modułów dyplomacji. Nagłówek precedensu mówi wprost: „Bez importów diplo modułów — checker
rejestruje hud.ts".

**Odrzuceni kandydaci (z powodem, nie z gustu):**
- *Bezpośredni import `wikiHubHud` w `renderer.ts`* — domknięcie importów huba to 112 modułów,
  w tym `brandTokenVars.ts` z `./icons/brand/tokens.css?raw` (składnia wyłącznie Vite).
  Bramki rodziny kart bundlują `renderer.ts` przez esbuild bez pluginu dla `?raw`
  (m.in. `entity-card-contract-test.cjs`) — import wywróciłby je, a leżą poza allowlistą.
- *Callback w danych karty (jak `EntityCardAction.onClick`)* — kartę buduje pięć adapterów
  wołanych z czterech miejsc gry, wszystkie poza allowlistą; przycisk działałby tylko tam,
  gdzie ktoś pamiętał podać callback, czyli **dokładnie klasa defektu naprawianego tutaj**.
- *Zdarzenie na `document`* — projekt nie ma takiego wzorca: `grep 'document.dispatchEvent'`
  w `gra/src` = 0 trafień.

## Zarzut 3 — druga część defektu z G1, głębsze ustalenie i jawna lista plików

**(a) Rozjazd slug hasła ↔ id gry — ZNALEZIONY i NAPRAWIONY.** Slugi haseł powstają w
`bundle-wiki-for-game.cjs` z nazwy pliku `.md` (NFD-strip gubi „ł": `włócznik.md` → `w-ocznik`),
a identyfikatory gry z `entityCards/slug.ts` (pełna tabela diakrytyków: `wlocznik`). Naprawa:
trójstopniowe rozwiązywanie w `findEncyEntryForGameId` (mostek `gameIds` → dokładny
`slug === id` → klucz znormalizowany z `slug` **i** z `title`), bez zmiany zachowania
`openEncyEntry` dla istniejących wołających.

**(b) Ustalenie cięższe niż RECON dispatchu, dotąd nieujawnione.** Dispatch zakładał, że
przycisk istnieje i tylko nie ma listenera. **To prawda wyłącznie dla budynków.** Dla trzech
z czterech rodzajów kart (jednostka, technologia, ulepszenie terenu) przycisk **w ogóle nie
powstawał**, bo adaptery zwracały `civpediaLink: null`. Dowód sprzed naprawy —
`dowody/_pomiar-przed.json`: `hasButton:false` dla scenariuszy 02/03/04, `hasButton:true`
tylko dla 01 i 05 (budynki). Dlatego naprawa musiała objąć adaptery, nie sam `renderer.ts`.

**(c) Jawna lista plików z rozszerzonej allowlisty (`gra/src/ui/entityCards/`)**, wymagana
przez dyspozycję — zmienione w commicie produkcyjnym `f4cc06cd`:
1. `gra/src/ui/entityCards/civpediaOpenGate.ts` — **NOWY** (szew, zero importów)
2. `gra/src/ui/entityCards/renderer.ts` — listener + komunikat + normalizacja slug + CSS
3. `gra/src/ui/entityCards/unitAdapter.ts` — `civpediaLink` przestaje być `null`
4. `gra/src/ui/entityCards/technologyAdapter.ts` — j.w.
5. `gra/src/ui/entityCards/improvementAdapter.ts` — j.w.
6. `gra/src/ui/entityCards/wonderAdapter.ts` — j.w.
7. `gra/src/ui/wikiHubHud.ts` — `openWikiHubEncyEntry` + `hasWikiEncyEntry` + tolerancyjne
   dopasowanie + rejestracja w szwie (czysta addycja)

Plus poza `gra/src/`: `gra/tools/entitycard-civpedia-klik-test.cjs` (NOWA bramka) i katalog
runu. Zakazane ścieżki nietknięte; `docs/encyklopedia/**` bez zmian.

## Zarzut 4 — POMIARY (sekcja, na którą powoływał się kod) i sprostowanie komentarzy

### POMIARY

Wszystkie liczby odtworzone w tej fazie, nie przepisane.

**Budynki bez hasła — 16 z 41.** `gra/data/buildings.json` = **41** budynków;
`docs/encyklopedia/budynki/` = **25** haseł; dokładne trafienie `slug === id` = **25**,
więc **16 budynków nie ma hasła**.
**Sprostowanie wobec dispatchu:** dispatch podaje „25 z 42 budynków nie ma hasła" — liczba
jest odwrócona i na złej podstawie. 25 to hasła, które **istnieją**, a budynków jest 41, nie 42.
Rozbieżność wyjaśniona; poprawna liczba to 16 z 41. Treści haseł ten temat nie dotyka.

**Jednostki — trafienia slug hasła ↔ id gry.** `gra/data/units.json` = 75 jednostek,
`docs/encyklopedia/jednostki/` = 49 haseł. Przy samym `slug === id` bramka tematu zmierzyła
**13 z 75**; po dopasowaniu tolerancyjnym **49 z 75** (czyli wszystkie istniejące hasła).
Niezależna replikacja w tej fazie uproszczonym slugify dała **14 → 49** — różnica jednego
trafienia wynika z uproszczenia mojej repliki, nie z kodu; wiążący jest pomiar bramki.

**Mostek `gra-id`:** wypełniony w **2 hasłach na 168** — dlatego dopasowanie musiało powstać
po stronie kodu, a nie danych (`docs/encyklopedia/**` poza allowlistą).

### Poprawki komentarzy (kod produkcyjny, w allowliście)

1. `civpediaOpenGate.ts` i `renderer.ts` — martwe odwołanie „pomiar w raporcie tematu"
   zastąpione ścieżką do sekcji POMIARY tego pliku; dopisane sprostowanie „25 z 42" → „16 z 41".
2. `wikiHubHud.ts` — „raport tematu, sekcja POMIARY" zastąpione pełną ścieżką do tego pliku.
3. `renderer.ts` (`buildEntityCardData`) — **poprawka merytoryczna**. Poprzednie brzmienie
   sugerowało, że normalizacja sluga czyni rozjazd niemożliwym. Nie czyni: gwarancja obowiązuje
   wyłącznie dla danych przechodzących przez `buildEntityCardData`, a `unitInfoCard.ts:72,91`
   i `cityPanel.ts:7381-7382,7697-7708` wołają adapter bezpośrednio. Dziś bezpieczne, bo
   `buildingAdapter` i `unitAdapter` mają slug równy id, a adaptery z placeholderem
   (`improvement`, `wonder`) bezpośrednio wołane nie są. Komentarz mówi to teraz wprost i
   wskazuje, co zrobić, gdy warunek przestanie zachodzić (przenieść normalizację do adapterów).
   **Zmiana wyłącznie w komentarzu — zero zmian zachowania.**

---

ZMIANY/COMMIT: `gra/src/ui/entityCards/civpediaOpenGate.ts`,
`gra/src/ui/entityCards/renderer.ts`, `gra/src/ui/wikiHubHud.ts` (wyłącznie komentarze),
`dyspozycje/autobot/runs/P-ENTITYCARD-CIVPEDIA-KLIK-MARTWY-Q1/30-operator-runda1-obrona.md`.
TESTY (po poprawkach): `tsc --noEmit` 0 błędów; bramka tematu **71/0**; referencyjne
**213/213, 19/19, 33/33, 13/13, 6/6**; rodzina 26 bramek — **22 zielone, 4 czerwone zastane**
(tabela wyżej). Pliki brudzone przez przebieg rodziny (`gra/src/data/wikiBundle.json`,
12 zrzutów w `runs/R-KARTA-JEDNOSTKI-3D-EKSPOZYCJA-UX-Q1/dowody/`) przywrócone jawnymi
ścieżkami; `git status` czysty poza allowlistą.
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Final Control.
DEPLOY/PUSH: NIE WYKONANO.
