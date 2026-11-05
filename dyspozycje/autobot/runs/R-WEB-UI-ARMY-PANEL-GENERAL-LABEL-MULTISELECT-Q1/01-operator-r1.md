STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — UI panelu armii/stosu na heksie
TEMAT: R-WEB-UI-ARMY-PANEL-GENERAL-LABEL-MULTISELECT-Q1
GOAL: generał/wódz rozpoznawalny na każdej liście armii (rola + typ, pierwszy na liście); wielokrotne zaznaczanie jednostek w stosie; „ROZWIĄŻ” działa na zaznaczonym zbiorze z potwierdzeniem. Bez zmian balansu, danych i save.

ZMIERZONE PRZED (baza origin/main 80919e2ae):
- Panel z zrzutu „Armia · (x,y) · N jednostek · Właściciel” = `sidePanelHud.ts` → `hexContextTooltip.ts` (`buildUnitStackCardsHtml`, `buildUnitContextTooltipHtml`) z `main.ts` (`buildUnitContextTooltipForUnit`, `buildArmyStackHudStateInner`). Pasek ikon: `unitActionBarHtml.ts` (`uc-act-disband` = ROZWIĄŻ). `armyStackHud.ts` (dolny pasek) jest w tej wersji wyłączony (`buildArmyStackHudState` zwraca null).
- Nazwa karty: `name` = typ jednostki; rola generała to osobne pole `commanderTitle`, ustawiane tylko gdy `unit.isGeneral` (`armyStackCardIdentity`). Stąd „Wojownik” to typ, a generał tracił się przez małą etykietę roli (8 px) i pozycję w środku stosu. Panel podziału (`armySplitPanel.ts`) w ogóle nie pokazywał roli (lista z samym typem).
- Zaznaczanie w `armySplitPanel.ts`: checkboxy + `Set<string>` + licznik „Zaznaczono N z M” — ten wzorzec reużyty.
- ROZWIĄŻ: `disbandPlayerUnit(id)` — jedna jednostka, bez potwierdzenia, zwrot rekrutów (manpower), czyszczenie oblężenia. Ścieżka `capital-capture` nie jest dotykana.
- Plik zrzutu `evidence/zrzut-44-panel-armii.png` NIE istnieje w repo ani na branchu; opis z dispatchu użyty jako dowód zamiast obrazu.

ZMIANY/COMMIT: 837c56b32 (baza origin/main 80919e2ae), PUSH NIE
- `gra/src/ui/armyStackLabel.ts` (NOWY, bez zależności): `armyStackCardLabel` („Generał — Wojownik”), `sortArmyStackGeneralsFirst`. Wydzielony, bo `armySplitPanel` importowany z `armyStackHud` ciągnął łańcuch brandAssets i łamał istniejący test scroll-grid.
- `gra/src/ui/hexContextTooltip.ts`: pole wyboru na karcie, pasek „Zaznaczono N z M · Zaznacz wszystko · Odznacz”, generał pierwszy, czytelniejsza rola generała.
- `gra/src/ui/sidePanelHud.ts`: obsługa `[data-pick]` z `stopPropagation` (kliknięcie w pole nie zmienia wybranej jednostki).
- `gra/src/main.ts`: stan `stackPickState` (klucz heks+właściciel); akcje `pick:<id>`, `pick-all` (bez generała), `pick-none` przez istniejące `onContextAction`; `disbandSelectedOrPickedUnits` — z zaznaczeniem: `window.confirm("Rozwiązać N jednostek?")` + ostrzeżenie, gdy w zbiorze jest generał; bez zaznaczenia jak dotąd. Etykieta akcji „ROZWIĄŻ ZAZNACZONE (N)”. `mergeUnitRow` niesie `commanderTitle`.
- `gra/src/ui/armySplitPanel.ts`, `gra/src/ui/armyMergePanel.ts`: generał pierwszy z etykietą roli (typ pola opcjonalny).
- `gra/tools/army-panel-general-label-multiselect-test.cjs` (NOWY): 9 kontroli (sortowanie, etykieta, DOM karty, 3 kliknięcia pól, licznik, „zaznacz wszystko”, panel podziału 2 z 3) + strażnicy statyczni main.ts.
- `dyspozycje/.../po-panel-stosu-zaznaczanie.png`: zrzut PO (stos 12 jednostek, generał pierwszy, 3 zaznaczone, „ROZWIĄŻ ZAZNACZONE (3)”).
- `dyspozycje/.../gate-results.txt`, ten raport.
- hud.ts NIE zmieniany (nowe akcje idą istniejącym `onContextAction`).

TESTY: patrz `gate-results.txt` (EXIT per bramka).
- tsc --noEmit: EXIT=0.
- Nowy test: 9/9 PASS po zmianach; RED na bazie: EXIT=1 (oczekiwane).
- Regresje: split-ruch 7/7, merge-split-direction OK, commander-identity 8/8, split-movement 4/4, unit-action-bar 31/31, merge-panel-list-visibility 104/104, escape-overlay 84/84, army-leadership OK, general-eligible 137/137, ai-test 274/20 (zgodne z bazą).
- Nieprzechodzące, NIE z tej zmiany: `army-split-panel-scroll-grid` (PO 11/11 PASS; 2 kontrole „PRZED/RED-PRE” porównują z origin/main, który już zawiera poprawkę), `unit-info-card-army-interaction` (1 z 7: szukany ciąg nie istnieje w origin/main).

BLOKADY: brak. Założenia (bez pytań ABC):
1. Pojedyncze „Rozwiąż” bez zaznaczenia działa jak dotąd, bez potwierdzenia (dispatch mówi o potwierdzeniu dla zbioru).
2. Zaznaczenie resetuje się przy zmianie heksu lub wyborze innego stosu.
3. Lista „Lista” (`armyListHud.ts`) i panel łączenia nie dostały etykiety roli poza typem w `ArmyMergeUnitRow` — NIE_ZMIERZONO wizualnie.
4. Allowlista: dodany nowy plik `armyStackLabel.ts` (helper UI) poza wymienionymi — uzasadnienie wyżej.

NIE_ZMIERZONO: pełny start gry i klik „ROZWIĄŻ” w `main.ts` na żywym stanie gry (potwierdzenie i rozwiązanie 3 jednostek end-to-end). Pokryte statycznymi strażnikami, tsc i testami komponentów.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (R1) — przegląd diffu 837c56b32 względem dispatchu; weryfikacja w realnym stanie gry (Chromium, potwierdzenie i rozwiązanie zbioru) przed FC.
DEPLOY/PUSH: NIE WYKONANO
