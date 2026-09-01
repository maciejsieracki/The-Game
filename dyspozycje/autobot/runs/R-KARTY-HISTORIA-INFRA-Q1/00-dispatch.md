TEMAT:  R-KARTY-HISTORIA-INFRA-Q1
RUNDA:  1/5
DATA:   2026-09-01
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Właściciel, zrzut karty „Tarasy uprawne": karta pokazuje surowy tekst
deweloperski wprost graczowi — wiersz „Cywilizacje" ma doklejony fragment
„(Pole ogólne (konwencja z wonders.json: WonderDef.cywilizacje +
canCivBuildWonder) — czytane przez isImprovementAllowedForCiv
(game/terrain-improvements.ts), NIE hardkod per-ulepszenie...)", a wiersz
„Uwagi" pokazuje „C-TARASY-Q1 Maciej 2026-07-26: cofnięcie T-TECH-4
(2026-07-04, 'po Rolnictwie — wszystkie cywilizacje') — zgodność
historyczna: ...". Właściciel: gruntowny audyt i czyszczenie WSZYSTKICH kart
(budynki, jednostki, technologie, ulepszenia terenu, cuda) + dopisanie do
KAŻDEJ pozycji rysu historycznego (krótki tekst fabularny/edukacyjny, na
wzór Civilopedii z serii Civilization). Właściciel zaakceptował przykładowy
ton/długość dla Rolnictwa i Tarasów (patrz `dyspozycje/_handoff/` lub
transkrypt sesji 2026-09-01 — dwa akceptowane przykłady, ~4-6 zdań, rys
historyczny: co/gdzie/kiedy/po co, bez suchych faktów encyklopedycznych i
bez odniesień do mechaniki gry).

**To jest temat INFRASTRUKTURALNY — pierwszy z ~17 w serii.** Zero treści
historycznej w tej rundzie (to robią kolejne, oddzielnie dispatchowane
tematy per kategoria encji: budynki/technologie/jednostki/ulepszenia/cuda).
Cel tej rundy: (a) dodać mechanizm karty na rys historyczny, (b) trwale
usunąć wyciek tekstu deweloperskiego z kart, żeby kolejne batche treści
miały czyste, gotowe miejsce do wpisania historii.

## RECON (wykonany, nie powtarzać)
System kart żyje w `gra/src/ui/entityCards/`: `types.ts` (kontrakt),
`registry.ts` (resolver), `technologyAdapter.ts`/`buildingAdapter.ts`/
`unitAdapter.ts`/`improvementAdapter.ts` (adaptery), `renderer.ts` (DOM).
Cuda (`data/wonders.json`, 19 encji) renderowane OSOBNO w `cityPanel.ts`/
`buildModeHud.ts`/`empireDetailPanel.ts`, bez adaptera — POZA zakresem tej
rundy, dostaną własną infrastrukturę przy okazji swojego batcha treści.

Źródło wycieku:
- `improvementAdapter.ts` (~125-172): renderuje `improvement.uwagi`
  (wiersz „Uwagi"), `improvement.cywilizacje_uwaga` (doklejone do wiersza
  „Cywilizacje"), `improvement.tech_uwaga` (doklejone do „Technologia") —
  **ZERO filtrowania**, wprost z `data/terrain-improvements.json`.
- `buildingAdapter.ts`/`technologyAdapter.ts`: wiersz „Uwagi" filtrowany
  przez `playerFacingNote()` (`cityPanel.ts:6892`) — ale to allowlista
  regexów (`PYTANIE \d+`, `DECYZJA`, `DEC-\d{8}`, `ABC-\d+:`), która NIE
  łapie stylu z przykładu Tarasów (`C-TARASY-Q1 Maciej data: ...`).
  `playerFacingNote()` ma też 3 INNE miejsca wywołania w `cityPanel.ts`
  (linie ~7100, ~7213, ~7362 — krótkie tooltipy poza tym systemem kart) —
  te NIE są w zakresie tej rundy, zostają nietknięte.
- Pole „Warunek" (`improvement.warunek`) ma tekst deweloperski WTRĄCONY
  wewnątrz tej samej wartości (nie osobne pole) — np. `owce.warunek` ma w
  środku „(Maciej 2026-07-29) COFNIĘTY 2026-08-27 — R-...-Q1, ECHO
  właściciela: ...". Tego NIE da się naprawić kodem — wymaga przepisania
  treści per encja. **POZA zakresem tej rundy**, do zrobienia przy okazji
  batchy treści ulepszeń terenu (I1/I2), gdzie Operator i tak czyta każdą
  encję indywidualnie.

Brak dziś żadnego pola/mechanizmu na treść fabularną w żadnym z 4 adapterów.
CivPedia (`src/data/wikiBundle.json`) to osobny, czysto mechaniczny system
(„Co robi", „Koszty", „Strategia") — bez narracji, nie nadaje się do
ponownego użycia dla tego celu.

## GOAL
**(a) Nowa sekcja „Rys historyczny"** w kontrakcie `EntityCardData`
(`types.ts`) i `renderer.ts` — pojedynczy akapit tekstu prozy, renderowany
WYŁĄCZNIE gdy pole źródłowe jest niepuste (żeby karty bez jeszcze
niedopisanej historii nie pokazywały pustej sekcji), stylistycznie
odróżniony od sekcji mechanicznych (np. kursywa, delikatny separator,
umieszczony na końcu karty, POD wszystkimi sekcjami mechanicznymi — rys
historyczny to ciekawostka, nie dana do optymalizacji rozgrywki).

**(b) Wpięcie w 4 adaptery**, każdy czyta WŁAŚCIWE dla swojego pliku danych
pole (konwencja nazewnictwa per plik, NIE jedna nazwa wszędzie):
- `buildingAdapter.ts` ← `data/buildings.json` pole `historia` (lowercase,
  zgodne z istniejącym `uwagi`/`wymagania`).
- `technologyAdapter.ts` ← `data/tech.json` pole `Historia` (capitalizowane,
  zgodne z istniejącym `Uwagi`/`Technologia`).
- `unitAdapter.ts` ← `data/units.json` pole `Historia` (capitalizowane,
  zgodne z `Jednostka`/`Surowiec`).
- `improvementAdapter.ts` ← `data/terrain-improvements.json` pole `historia`
  (lowercase, zgodne z `uwagi`/`cywilizacje_uwaga`).
Pola te NIE MUSZĄ jeszcze istnieć w JSON (dodadzą je dopiero batche treści)
— adapter ma bezpiecznie zwracać brak sekcji, gdy pole nie istnieje.

**(c) Trwałe usunięcie wycieku tekstu deweloperskiego z KART** (nie z
`cityPanel.ts` tooltipów poza tym systemem — te zostają nietknięte):
- `improvementAdapter.ts`: usuń renderowanie `improvement.uwagi` (wiersz
  „Uwagi"), `improvement.cywilizacje_uwaga` (doklejka do „Cywilizacje"),
  `improvement.tech_uwaga` (doklejka do „Technologia"). Wiersze „Cywilizacje"/
  „Technologia" mają dalej pokazywać CZYSTĄ, mechaniczną wartość (samą listę
  cywilizacji / samą nazwę technologii), bez dev-adnotacji w nawiasie.
- `buildingAdapter.ts`/`technologyAdapter.ts`: usuń wiersz „Uwagi" z karty
  CAŁKOWICIE (nie tylko z regexowego filtra — porzuć `playerFacingNote()`
  jako źródło tego wiersza na karcie; funkcja zostaje nietknięta dla swoich
  3 innych, niezwiązanych wywołań w `cityPanel.ts`).
- Pole JSON `uwagi`/`Uwagi`/`cywilizacje_uwaga`/`tech_uwaga` NIE jest
  usuwane z danych (może być używane przez inne narzędzia/dokumentację) —
  wyłącznie przestaje być RENDEROWANE na karcie gracza.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. Karta „Tarasy uprawne" w żywej przeglądarce: wiersz „Cywilizacje" pokazuje
   WYŁĄCZNIE „chinczycy, inkowie" (albo ich wyświetlane nazwy), zero
   dev-tekstu w nawiasie. Wiersz „Uwagi" NIE ISTNIEJE na karcie. Realny
   zrzut PRZED/PO (headless Chromium).
2. Dowolna karta budynku i technologii z niepustym `uwagi`/`Uwagi` w danych
   (np. karta z przykładu regresu `P-TECH-UWAGI-WYCIEK-CITYPANEL-Q1` —
   Brązownictwo) NIE pokazuje wiersza „Uwagi" na karcie. Realny zrzut PRZED/
   PO.
3. Nowa sekcja „Rys historyczny" renderuje się poprawnie, gdy pole źródłowe
   (`historia`/`Historia`) jest ustawione — dowód: tymczasowo (w teście, NIE
   w commitowanych danych gry) ustaw `historia` dla jednej encji testowej,
   zrób zrzut pokazujący sekcję, usuń testową wartość przed commitem.
4. Karty encji BEZ ustawionego pola `historia`/`Historia` (czyli 100%
   wszystkich dziś, przed batchami treści) NIE pokazują pustej/białej sekcji
   „Rys historyczny" — sekcja po prostu nie istnieje w DOM.
5. Istniejące 3 wywołania `playerFacingNote()` w `cityPanel.ts` (linie
   ~7100/~7213/~7362, poza systemem kart) działają identycznie jak przed
   zmianą — zero regresu, `citypanel-uwagi-abc-filter-test.cjs` zielony bez
   zmiany liczby asercji.
6. `tarasy-cywilizacje-test.cjs`, `map-improvement-qualify-test.cjs`,
   `hodowla-las-test.cjs` (mechanika kwalifikacji cywilizacji/terenu,
   NIEZALEŻNA od renderowania karty) zielone bez regresu.
7. `tsc --noEmit` 0 błędów + wszystkie 5 bramek referencyjnych bez regresu.

## ALLOWLISTA — nic poza tym
`gra/src/ui/entityCards/types.ts`, `gra/src/ui/entityCards/renderer.ts`,
`gra/src/ui/entityCards/buildingAdapter.ts`,
`gra/src/ui/entityCards/technologyAdapter.ts`,
`gra/src/ui/entityCards/unitAdapter.ts`,
`gra/src/ui/entityCards/improvementAdapter.ts`, nowy plik testowy w
`gra/tools/` (np. `entity-card-historia-section-test.cjs`). Zakazane
bezwzględnie: `gra/src/ui/cityPanel.ts` (funkcja `playerFacingNote` i jej 3
istniejące wywołania — NIE dotykać w tej rundzie), `gra/data/**` (żadnych
zmian w danych — pola `historia`/`Historia` dodają dopiero batche treści),
`gra/src/game/**`, `docs/decyzje/<ID>.md`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-KARTY-HISTORIA-INFRA-Q1`, baza JAWNIE
`origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`, `dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryterium 1/2 za spełnione na podstawie samego czytania kodu
— wymagany realny zrzut z żywej, zbudowanej gry pokazujący DOKŁADNIE kartę
Tarasów ze zrzutu właściciela, PRZED i PO. Zakaz przypadkowego usunięcia
mechanicznej treści wiersza „Cywilizacje"/„Technologia" przy okazji
usuwania dev-adnotacji — lista cywilizacji i nazwa technologii MUSZĄ
zostać, znika WYŁĄCZNIE doklejka w nawiasie. Zakaz „ulepszania" filtra
`playerFacingNote()` w tej rundzie — jego 3 inne wywołania są PROSTOTĄ
zamierzone jako osobny, niezwiązany temat (mogą dostać własny, przyszły
dispatch, jeśli właściciel uzna że dev-tekst przecieka też tam).

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/` (typecheck
wyłącznie `tsc --noEmit`; build produkcyjny wyłącznie
`node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist --emptyOutDir`
dla zrzutów w przeglądarce). Zakaz `git add -A`.

## OBIEG
Operator → Evaluator (zarzuty, lista może być pusta) → Operator (Obrona,
tylko gdy zarzuty niepuste) → Final Control (osobne wywołanie Workflow) →
orkiestrator integruje allowlist-only NATYCHMIAST (blokuje wszystkie
kolejne 16 tematów treści w tej serii, priorytet wysoki).
