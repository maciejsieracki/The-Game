# Audyt stanu niezapisywanego w zapisie gry — R-WEB-SAVE-STATE-AUDIT-Q1 (tag SAVEAUDIT)

Data: 2026-11-28. Baza kodu: `1dbd21efcd829d34433f7f72c0b9ea81d3e79697` (origin/main po FALI 937, AICSFIX).
Zakres: wyłącznie odczyt kodu i narzędzie read-only. ZERO zmian w `gra/src/`, `gra/data/`.
Źródło listy kandydatów: `dyspozycje/analizy/ZAPIS-AICS-ABSORPCJA-POPRAWKA-2026-11-28.md` (audyt tekstowy, 11 kandydatów NIEZWERYFIKOWANYCH).

Legenda klas:
- **S** — pamięć podręczna / diagnostyka / powiadomienia / flagi testowe; brak wpływu na decyzje gry po wczytaniu.
- **D** — stan decyzyjny; brak po wczytaniu zmienia decyzje AI lub wynik tury.
- **R** — wyliczany od nowa w tej samej turze, zanim zostanie odczytany; brak w zapisie nie zmienia wyniku.

Oznaczenia: „ciało save” = `buildSaveGameSnapshot` (main.ts:42678–43048), „ciało restore” = `restoreGameFromSave` (main.ts:52466–53802), „koniec tury” = `runWorldEndTurn` (main.ts:43880–~53xxx). Wszystkie odczyty decyzyjne AI leżą w `runWorldEndTurn` (sprawdzone: każde użycie kandydata mapuje się na tę funkcję).

## 1. Tabela 11 kandydatów

| # | Zmienna | Deklaracja | Zapis (linie) | Odczyt (linie) | W ciele save | W restore | Klasa | Uzasadnienie kodem |
|---|---|---|---|---|---|---|---|---|
| 1 | difficultyBonusGrantedOwners | 10404 (Set) | clear 11847 (`applyClusterStartPlan`, nowa gra); add 12189 (`grantDifficultyStartBonusesForMajorCapital`) | 12187 (guard `has`) | nie | nie (brak clear/odczytu) | **S** | Jedyna ścieżka wejścia do grant: `spawnPendingForeignClusters` (12308), która działa na kolejce `pendingForeignSpawnCities` (10400) — kolejka NIE jest zapisywana i jest opróżniana przy pierwszym założeniu stolicy gracza. Po wczytaniu kolejka jest pusta, więc grant nie jest już wywoływany. Zbiór jest „martwy” po wczytaniu (patrz §3.2 i uwagi o kolejce). |
| 2 | lastDiplomaticContactsSnapshot | 10890 (Set) | reset 24560 (`resetDiplomaticDiscoveryUiState`); init 24590 (`initDiplomaticContactSnapshot`); update 24688 (`checkNewDiplomaticContacts`) | 24686 | nie | nie, ale `loadGameFromSlot` (52237) woła `initDiplomaticContactSnapshot()` po restore (52386) | **S** | Po wczytaniu snapshot jest natychmiast re-inicjowany do aktualnych kontaktów (komentarz 24588: „Po startu / wczytaniu — bez auto-popupu dla już widocznych AI”). Brak zapisu nie zmienia zachowania. |
| 3 | diplomacyDobraWolaActiveTura | 10783 (Set) | clear 26923 + add 26932 w `runDiplomacyTurnTick` (26848) | 47292 (AI tick) | nie | nie | **R** | `runDiplomacyTurnTick` jest wołany w `runWorldEndTurn` (43968), czyli PRZED odczytem 47292 w tej samej turze; zbiór jest czyszczony i przeliczany co turę. |
| 4 | aiNnsHoldOwners | 11187 (Set) | clear 7851 + add 7931 w `nnsAiPreTickBalance` (7850) | 48929, 48963 (zakupy/budowa AI) | nie | nie | **R** | `nnsAiPreTickBalance` wołany bezwarunkowo w `runWorldEndTurn` (44081) przed ekonomią i przed zakupami; komentarz 11186: „wypełniane w nnsAiPreTickBalance”. |
| 5 | aiNnsUncoveredOwners | 11189 (Set) | clear 7852 + add 7994 w `nnsAiPreTickBalance` | 44752 (bankowanie skarbca AI) | nie | nie | **R** | Ten sam przebieg co #4; odczyt 44752 jest po wywołaniu 44081. |
| 6 | aiImprovementBudgetByOwner | 11222 (Map) | clear 45864, set 45872 (blok ekonomii) | 46980 (`improvementBudgetCap`) | nie | nie | **R** | Zapis i odczyt w tym samym `runWorldEndTurn`; odczyt 46980 po zapisie 45872. |
| 7 | aiSurplusReportByOwner | 11228 (Map) | set 46990 — ŚWIEŻY obiekt na każdą turę i właściciela, przed `decideAITurn` | 48274 (po `decideAITurn`) | nie | nie | **R** | Komentarz 46985: raport z poprzedniej tury nie może przylgnąć do bieżącej — kod celowo odtwarza go co turę. Trwała część (`aiSurplusRedirectedOwners`) JEST zapisywana (ciało save, linia 42916). |
| 8 | aiGoldIncomeByOwner | 11194 (Map) | set 44717 (pętla `aiOwnerIds` w bloku ekonomii); clear 11892 (nowa gra), 51245 (start), 53500 (restore) | 40023, 40064 (przez `aiPurchaseReserveInputs` 40017 i `aiUpkeepRunwayAllows` 40061); wywołania: 8239 (`upgradeAiUnitsForEra`, wołane z 46696), 48964, 48973 | nie | clear (nie odtworzenie) | **R** | Zapis 44717 jest PRZED wszystkimi odczytami w tym samym `runWorldEndTurn` (46696, 48964, 48973 > 44717). Okno „brak wpisu po wczytaniu” (komentarz 11192) nie zawiera żadnego odczytu: pierwszy odczyt następuje dopiero po zapisie w pierwszym koniec-tury po wczytaniu. |
| 9 | aiWonderPracaTickByCity | 6026 (Map) | clear 44146, set 44149 (blok ekonomii, z `econ.perCity`) | 48363 (`pracaPerTurn`) | nie | nie | **R** | Przeliczane z `econ` w każdym koniec-tury, przed odczytem 48363. |
| 10 | aiWonderStuckTurnsByOwner | 6033 (Map) | set 48429 / 48431 / 48433 (licznik „utykania” cudu AI, w `runWorldEndTurn` 48336–48435); clear 11857 (nowa gra), 51323 (start), 53108 (restore) | 48411 (`relaxedWonderCostThreshold`) | nie | clear → po wczytaniu licznik = 0 | **D** | Licznik NIE jest przeliczany z innego stanu: rośnie co turę, gdy AI ma dostępnego kandydata, a decyzja cudu padła `null`. Po wczytaniu jest zerowany (53108), więc łagodzenie progu opłacalności cudu (`ai.ts:2744–2756`: `progKosztX / (1 − t/cuda_stuck_relax_tur_max)`, max = 30) zaczyna się od zera. Szczegóły w §3.1. |
| 11 | pendingAdministratorChanges | 11008 (Map) | set/delete 11021–11026 (`refreshCityAdministrators`); flush 11030–11031 (`noteAdministratorChange`); clear 53585, 53587 (restore, z komentarzem) | 11024 (tylko w pętli łączenia), 11030 (tylko powiadomienia) | nie | clear (celowe) | **S** | Jedyny odczyt, który wpływa na coś poza mapą, to `noteAdministratorChange` (powiadomienie). Restore czyści kolejkę celowo („stan z zapisu jest punktem odniesienia, bez powiadomień o zmianach sprzed wczytania”). Utrata = co najwyżej jedno niepokazane powiadomienie. Stan decyzji administratorów (`stateAdmByOwner`) jest osobną strukturą. |

Podsumowanie klas dla 11 kandydatów: **S = 3** (#1, #2, #11), **D = 1** (#10), **R = 7** (#3–#9). Suma 11.

## 2. Skan systematyczny

Narzędzie: `gra/tools/save-state-audit-scan.cjs` (tylko odczyt pliku; nie uruchamia gry, nie importuje kodu gry).
Wynik surowy: `dyspozycje/autobot/runs/R-WEB-SAVE-STATE-AUDIT-Q1/scan-output.txt`.

Wynik (liczby z surowego wyjścia, uruchomienie 2026-11-28):
- Deklaracje `let`/`const` na wcięciu 4 spacje, typ Map/Set/Array/Obiekt/Licznik/Flaga: **330**.
- Nie występują w ciele `buildSaveGameSnapshot`: **201**.
- Wśród tych 201 — wstępnie oznaczone jako D? (nazwa): **46**; S? (nazwa): **34**; bez sygnału (?): pozostałe.
- Mimo tego, że nie są w ciele save, część występuje w ciele restore (zwykle jako `clear()`): np. `aiWonderStuckTurnsByOwner`, `aiGoldIncomeByOwner`, `citizenUpkeepByOwner`, `buildingResourceUpkeepByOwner`, `unitResourceUpkeepByOwner`, `aiFoodTickNetByOwner`, `movedByPlayerThisTurn`, liczniki `_lastPraca*`.

Ograniczenia skanu (zapisane jawnie):
- Klasy D?/S? to heurystyka po nazwie; ostateczna klasa wymaga czytania kodu (jak dla 11 powyżej). Skan nie rozstrzyga klasy.
- Skan obejmuje tylko deklaracje na wcięciu 4 (domknięcie gry); zmienne zagnieżdżone głębiej, stan w innych modułach (`gra/src/game/*.ts`, `save.ts`) i stan dostępny przez obiekty już zapisane NIE są objęte.
- „w restore: tak” znaczy tylko „wzmianka w ciele restore” (często `clear()`), NIE że wartość jest odtwarzana z zapisu.

## 3. Trzy zbadane kandydaci D/niepewni (werdykt z kodu)

### 3.1 aiWonderStuckTurnsByOwner (#10) — werdykt: D, realna rozbieżność po wczytaniu

Mechanizm:
1. Licznik rośnie o 1 co turę dla AI, które mają dostępnego kandydata na cud, nie budują cudu i `decideAiWonderBuild` zwrócił `null` (main.ts:48425–48433).
2. Efektywny próg opłacalności cudu jest mnożony przez `1/(1 − t/max)` (ai.ts:2744–2756, `max = cuda_stuck_relax_tur_max`, domyślnie 30; `ai.ts:2727–2728`). Przy t = 15 próg ×2, przy t = 25 ×6, przy t ≥ 30 nieskończoność (wartość domyślna w kodzie; config `ai-params` może ją nadpisać). Mechanizm 2 („twardy wymuszacz”, komentarz main.ts 48336–48340) działa osobno, przy komplecie technologii epoki.
3. `restoreGameFromSave` zeruje mapę (main.ts:53108), a ciało save nie zawiera tego licznika. Każde wczytanie zapisu kasuje więc postęp łagodzenia.

Konsekwencja dla gry (opis dla gracza): AI, które od kilku tur nie mogło postawić cudu, po wczytaniu gry zaczyna liczyć od zera. Przez kolejne tury próg jest ostrzejszy niż w ciągłej grze, więc cud AI może powstać kilka tur później (do ok. liczby tur utykania przed zapisem, ograniczonej przez 30). Wymuszacz (t ≥ 30) przesuwa się o pełne 30 tur.

Weryfikacja: **przez kod**. Live ablacja (zapis licznika w meta w kopii i porównanie B≠A) — **NIE ZMIERZONO** (w tej rundzie bez harnessu na żywo; dispatch pozwala na wytłumaczenie kodem).

Proponowany minimalny fix (≤ 10 linii, osobny temat, NIE w tej rundzie):
- ciało save: w obiekcie `meta`, obok `aiSurplusRedirectedOwners` (linia 42916): `aiWonderStuckTurnsByOwner: Array.from(aiWonderStuckTurnsByOwner),`
- ciało restore: zamiast `aiWonderStuckTurnsByOwner.clear();` (53108): `aiWonderStuckTurnsByOwner.clear(); for (const [oid, t] of (saved.meta?.aiWonderStuckTurnsByOwner ?? []) as Array<[number, number]>) aiWonderStuckTurnsByOwner.set(oid, t);`
- Ryzyko: nowe pole w zapisie (opcjonalne; stare zapisy bez pola dają 0, czyli dzisiejsze zachowanie). Wymaga testu round-trip i mutacji (pole nieczytane → test czerwony). Niski.

### 3.2 difficultyBonusGrantedOwners (#1) — werdykt: S (brak wpływu na decyzje po wczytaniu), z zastrzeżeniem o kolejce

- Jedyny zapis (`add`) jest w `grantDifficultyStartBonusesForMajorCapital`, a jedyne wywołanie tej funkcji to `spawnPendingForeignClusters` (12308), które działa wyłącznie na `pendingForeignSpawnCities` (10400, `let`, nie zapisywane; opróżniane w 12240 przy każdym wywołaniu; ustawiane w 11831 przy nowej grze).
- Po wczytaniu kolejka jest pusta (nie jest odtwarzana), więc `grant…` nie jest wołane i zbiór nie wpływa na żadną decyzję.
- Uwaga (stan rozbieżny, bez wpływu obecnie): restore NIE wywołuje `applyClusterStartPlan`, więc zbiór nie jest czyszczony przy wczytaniu w tej samej sesji — może zawierać właścicieli z poprzedniej gry. Nieszkodliwe wyłącznie dlatego, że nie ma już ścieżki wywołania.
- Pokrewny problem (do weryfikacji, NIE potwierdzony live): `pendingForeignSpawnCities` i pokrewne kolejki `pendingSameTypeRival*` (10381–10394) NIE są zapisywane. Jeśli zapis powstanie przed założeniem stolicy gracza (kolejki jeszcze pełne), wczytana gra nie utworzy zaplanowanych miast-państw/rywali. Do sprawdzenia, czy taki zapis jest w ogóle osiągalny.

Weryfikacja: kod. Live — **NIE ZMIERZONO**.

### 3.3 aiGoldIncomeByOwner (#8) — werdykt: R (brak wpływu), sprawdzony kolejność zapisu i odczytu

- Zapis 44717 jest w bloku ekonomii `runWorldEndTurn`, odczyty 40023/40064 (przez `aiPurchaseReserveInputs` i `aiUpkeepRunwayAllows`) są w tej samej funkcji i zawsze po 44717 (46696, 48964, 48973).
- Komentarz 11192 („brak wpisu (tura 1, po wczytaniu zapisu) = reguła rezerwy wyłączona”) opisuje okno między wczytaniem a pierwszym koniec-tury. W tym oknie nie ma odczytu tego zbioru, więc fallback nigdy nie jest użyty.
- Wniosek: brak w zapisie NIE zmienia decyzji zakupów AI. Dotyczy też `aiFoodTickNetByOwner` (ten sam wzorzec; do potwierdzenia w follow-upach).

Weryfikacja: kod. Live — **NIE ZMIERZONO** (nie wykonano ablacji).

## 4. Lista follow-upów (posortowana: D najpierw)

| Prio | Pozycja | Klasa | Opis błędu dla gracza | Proponowany fix | Ryzyko |
|---|---|---|---|---|---|
| 1 | aiWonderStuckTurnsByOwner (#10) | D (potwierdzone kodem) | Po wczytaniu cud AI może powstać kilka tur później niż w ciągłej grze. | Patrz §3.1 (≤10 linii, pole w meta + odtworzenie w restore). | Niski; wymaga testu round-trip. |
| 2 | pendingForeignSpawnCities / pendingSameTypeRival* (10381–10400) | D warunkowo (do sprawdzenia osiągalności zapisu przed założeniem stolicy) | Gdyby zapis powstał przed założeniem stolicy, wczytana gra nie ma zaplanowanych miast-państw/rywali. | Zapisać kolejki w meta albo zablokować zapis przed założeniem stolicy. | Średni (zmiana formatu zapisu). |
| 3 | playerStartHexByOwner (3305) | D? (nie zapisywane; odtwarzane tylko z planu nowej gry, 11812) | Po wczytaniu start gracza/właścicieli może wskazywać stary hex. Konsumenci nieprzebadani (getter 3310). | Przebadać konsumentów; zapisać w meta, jeśli używane przez decyzje. | Nieznany do przebadania. |
| 4 | diploZeroTrustWarned (10779) | S? (flaga deduplikacji ostrzeżeń, nie zapisywana) | Po wczytaniu to samo ostrzeżenie o zaufaniu może pojawić się ponownie. Do sprawdzenia, czy sama flaga wpływa na zdarzenie dyplomatyczne (12764). | Przebadać 12742–12765. | Niski. |
| 5 | aiTurnAwaitingBattle (14948) | D? | Jeśli zapis powstanie w trakcie oczekiwania na bitwę, wczytana gra może pominąć lub zdublować turę AI. Do sprawdzenia, czy zapis jest blokowany przy bitwie. | Przebadać blokadę zapisu w trakcie bitwy. | Nieznany. |
| 6 | movedByPlayerThisTurn (35989), converterProducedLastTurnByOwner (5982), citizenUpkeepByOwner (5964), buildingResourceUpkeepByOwner (5976), unitResourceUpkeepByOwner (5983), aiFoodTickNetByOwner (11197) | D? (wzmianka w restore) | Prawdopodobnie przeliczane z zapisanego stanu w pierwszym koniec-tury (wzorzec #8). | Potwierdzić przeliczenie przed pierwszym odczytem. | Niski. |
| 7 | pozostałe D? z tabeli skanu (46 pozycji) | D? niezweryfikowane | Nieznane bez czytania każdej pozycji. | Ręczna klasyfikacja w kolejnym temacie (wzorzec §1). | — |
| 8 | pozostałe S? (34 pozycje) i liczniki `_last*` | S? | Głównie cache/UI/diagnostyka (np. `nnsAiLog`, `nnsAiTurnStats`, `eraWarMeasure*`, `endTurnInProgress`). | Brak działania; zostawić. | — |

Zasada z tematu: dla D rozbieżność jest potwierdzona dopiero testem B≠A (ablacja). Pozycje 1–5 wymagają takiego testu przed wdrożeniem fixu.

## 5. NIE ZMIERZONO

- Żadna pozycja nie była mierzona na żywo (harness Chromium, ablacja B≠A, macierz A==A'). Werdykty D/R/S są z kodu.
- Bramki zadania (`tsc 0`, `logic 213`, `ai-test 297/0`) NIE zostały uruchomione: w worktree brak `gra/node_modules`, a dispatch zakazuje `npm run build/dev` w `gra/`. Dowód braku wpływu na grę: `git diff --stat gra/src gra/data` jest puste (wynik w raporcie operatora).
- Pełny rozkład klas dla 201 pozycji skanu: tylko heurystyka po nazwie; ręczna klasyfikacja poza zakresem tej rundy.
