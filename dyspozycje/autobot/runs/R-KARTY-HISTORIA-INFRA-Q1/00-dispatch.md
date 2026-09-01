TEMAT:  R-KARTY-HISTORIA-INFRA-Q1
RUNDA:  2/5 (runda 1 = DECISION_REQUIRED, patrz ECHO RUNDA 2 na końcu pliku)
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
`gra/tools/` (np. `entity-card-historia-section-test.cjs`). RUNDA 2 (patrz
ECHO na końcu pliku): dodatkowo `gra/src/ui/cityPanel.ts` WYŁĄCZNIE w
zakresie usunięcia miejsc wywołania, które doklejają kafelek/wiersz „Uwagi"
do pełnej karty budynku/jednostki (`playerFacingNote(def.uwagi)` w obu
budowniczych karty budynku, `u.Uwagi` w obu budowniczych karty jednostki) —
sama funkcja `playerFacingNote`/`isDevOnlyPlayerText`/
`stripInlineDevAnnotations` i jej pozostałe, niezwiązane wywołania (inline
tooltip, inline blok technologii) zostają NIETKNIĘTE. Zakazane
bezwzględnie: wszelkie INNE zmiany w `cityPanel.ts` poza tym jednym
punktem, `gra/data/**` (żadnych
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

## ECHO / DECYZJA WŁAŚCICIELA — RUNDA 2 (2026-09-01)

Runda 1 (commit `86c85ab0`, branch `autobot/R-KARTY-HISTORIA-INFRA-Q1`) zakończyła
się DECISION_REQUIRED: Evaluator + Obrona (zgodnie) wykryli, że GOAL(c) i
KRYTERIUM 2 wymagają CAŁKOWITEGO usunięcia wiersza „Uwagi" z kart budynków i
jednostek, ale allowlista jednocześnie zakazywała dotykania `cityPanel.ts` —
a to właśnie tam, PO wyrenderowaniu karty przez `renderEntityCard`, host
doklejał dodatkowy kafelek „Uwagi":
- `buildBuildingDetailCardViaEntityCard` (~linia 7247) i DRUGI, analogiczny
  budowniczy karty budynku (~linia 7396) — `playerFacingNote(def.uwagi)`,
  filtrowany, ale regexem zbyt wąskim (łapie `PYTANIE \d+`/`DECYZJA`/
  `DEC-\d{8}`/`ABC-\d+:`, NIE łapie stylu `B-SUROW-BUD-03:`).
- Karta jednostki (~linie 7578, 7678, dwa analogiczne budowniczy) — `u.Uwagi`
  doklejane WPROST, BEZ ŻADNEGO filtra.
- (Dodatkowo, informacyjnie: inline blok technologii ~linia 7134,
  `techNote = playerFacingNote(t.Uwagi)`, osobna, NIE-entityCards ścieżka —
  ten sam mechanizm co budynki, tylko dla technologii w innym kontekście UI.)

Technologia (pełna karta przez `openEntityCard('technology',...)`) jest już
DZIŚ czysta — nie ma żadnego host-doklejenia analogicznego do budynków/
jednostek. Decyzja właściciela: doprowadzić budynki i jednostki do TEGO
SAMEGO stanu (zero host-doklejanego wiersza „Uwagi" na pełnej karcie), NIE
łatać regexów punktowo.

**ROZSZERZENIE ALLOWLISTY (WYŁĄCZNIE to, nic więcej) na `gra/src/ui/cityPanel.ts`:**
Usuń doklejanie kafelka/wiersza „Uwagi" (blok `const playerNote =
playerFacingNote(def.uwagi); if (playerNote) { ... }` i jego odpowiednik dla
`u.Uwagi`) z WSZYSTKICH budowniczych kart budynku i jednostki renderowanych
przez `renderEntityCard`/`entityCards` (to obejmuje oba budowniczy budynku
~7247/~7396 i oba budowniczy jednostki ~7578/~7678 — zweryfikuj grepem
`playerFacingNote(def.uwagi)` i `u.Uwagi` w całym pliku, żeby złapać
WSZYSTKIE wystąpienia, nie tylko te cztery numery linii, które mogły się
przesunąć). Karta ma wyglądać dokładnie tak jak dziś wygląda karta
technologii — bez sekcji „Uwagi" w ogóle, niezależnie od treści pola w JSON.

**NIE DOTYKAJ:** funkcji `playerFacingNote()`/`isDevOnlyPlayerText()`/
`stripInlineDevAnnotations()` SAMEJ W SOBIE (zero zmian w jej implementacji/
regexie) — usuwasz WYŁĄCZNIE MIEJSCA WYWOŁANIA, które doklejają wynik jako
osobny kafelek/wiersz na pełnej karcie budynku/jednostki. Inline blok
technologii (~7134, `techNote`/„Uwagi tech") zostaje NIETKNIĘTY w tej rundzie
(inny, mniejszy kontekst UI, poza zakresem — może dostać własny, przyszły
temat, jeśli właściciel uzna że przecieka też tam).

**Zaktualizowane KRYTERIUM 2** (zastępuje brzmienie z rundy 1): Dowolna
pełna karta budynku (przez `buildBuildingDetailCardViaEntityCard` i przez
drugiego budowniczego ~7396, oba wywoływane z REALNEJ ścieżki hover/klik w
panelu miasta) i pełna karta jednostki (przez oba budowniczych ~7578/~7678,
REALNA ścieżka rekrutacji/panelu miasta) z niepustym `uwagi`/`Uwagi` w danych
(np. `stolarnia` dla budynku — `uwagi`: „B-SUROW-BUD-03: ...") NIE pokazuje
ŻADNEGO wiersza/kafelka „Uwagi". Realny zrzut PRZED/PO z TEJ REALNEJ ścieżki
(hover/klik w panelu miasta), NIE z izolowanej ścieżki `entityCards`
wywołanej bezpośrednio w teście — to był dokładnie błąd metodologii dowodowej
rundy 1 (Zarzut 2 Evaluatora).

**Zaktualizowane KRYTERIUM 5**: 3 istniejące, NIEZWIĄZANE wywołania
`playerFacingNote()` (inline tooltip ~7100, inline blok technologii ~7134 —
to jest to samo miejsce co „3 inne wywołania" z rundy 1, licz je razem, nie
osobno — oraz jeszcze jedno gdzieś w okolicach ~7362 jeśli nadal istnieje po
Twoich zmianach) DZIAŁAJĄ IDENTYCZNIE jak przed zmianą — regex/funkcja
nietknięta, jedyna zmiana to USUNIĘCIE wywołań w budowniczych kart
budynku/jednostki. `citypanel-uwagi-abc-filter-test.cjs` zielony,
IDENTYCZNA liczba asercji.

Wszystkie pozostałe kryteria (1, 3, 4, 6, 7) i cała reszta dispatchu (RECON,
GOAL a/b, IZOLACJA, REGUŁA PRZECIW SAMOOSZUKIWANIU, PROCEDURA NAPRAWCZA,
GRANICE) zostają w mocy bez zmian. To jest RUNDA 2 na TYM SAMYM branchu
(`autobot/R-KARTY-HISTORIA-INFRA-Q1`), kontynuacja od commitu `86c85ab0`, nie
nowy temat od zera.
