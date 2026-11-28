# Audyt stanu niezapisywanego w zapisie gry — R-WEB-SAVE-STATE-AUDIT-Q1 (tag SAVEAUDIT)

Data: 2026-11-28. Baza kodu: `1dbd21efcd829d34433f7f72c0b9ea81d3e79697` (origin/main po FALI 937, AICSFIX).
Zakres: wyłącznie odczyt kodu i narzędzia read-only (`gra/tools/save-state-audit-*.cjs`). ZERO zmian w `gra/src/`, `gra/data/`.
Źródło listy kandydatów: `dyspozycje/analizy/ZAPIS-AICS-ABSORPCJA-POPRAWKA-2026-11-28.md` (audyt tekstowy, 11 kandydatów NIEZWERYFIKOWANYCH).

Runda 2 (obrona po FC FAIL, zarzuty 1–7): dodano ablację wejścia progu cudu, poprawiono skan (wszystkie typy inicjalizatorów, komentarze wykluczone z dopasowań), 4 dodatkowe kandydaty z klasą wstępną D? zbadane kodem, bramki tsc/logic/ai-test zmierzone.

Legenda klas:
- **S** — pamięć podręczna / diagnostyka / powiadomienia / UI; brak wpływu na decyzje gry po wczytaniu.
- **D** — stan decyzyjny; brak po wczytaniu zmienia decyzje AI lub wynik tury.
- **R** — wyliczany od nowa w tej samej turze (lub przy pierwszym koniec-tury po wczytaniu), zanim zostanie odczytany; brak w zapisie nie zmienia wyniku.

Oznaczenia: „ciało save” = `buildSaveGameSnapshot` (main.ts:42678–43048), „ciało restore” = `restoreGameFromSave` (main.ts:52466–53802), „koniec tury” = `runWorldEndTurn`. Wszystkie odczyty decyzyjne AI leżą w `runWorldEndTurn` (sprawdzone dla kandydatów #3–#9).

## 1. Tabela 11 kandydatów

| # | Zmienna | Deklaracja | Zapis (linie) | Odczyt (linie) | W ciele save | W restore | Klasa | Uzasadnienie kodem |
|---|---|---|---|---|---|---|---|---|
| 1 | difficultyBonusGrantedOwners | 10404 (Set) | clear 11847 (`applyClusterStartPlan`, nowa gra); add 12189 (`grantDifficultyStartBonusesForMajorCapital`) | 12187 (guard `has`) | nie | nie (brak clear/odczytu) | **S** | Jedyna ścieżka wejścia do grant: `spawnPendingForeignClusters` (12308), która działa na kolejce `pendingForeignSpawnCities` (10400) — kolejka NIE jest zapisywana i jest opróżniana przy pierwszym założeniu stolicy gracza. Po wczytaniu kolejka jest pusta, więc grant nie jest już wywoływany. Zastrzeżenie: patrz §3.2. |
| 2 | lastDiplomaticContactsSnapshot | 10890 (Set) | reset 24560 (`resetDiplomaticDiscoveryUiState`); init 24590 (`initDiplomaticContactSnapshot`); update 24688 (`checkNewDiplomaticContacts`) | 24686 | nie | nie, ale `loadGameFromSlot` (52237) woła `initDiplomaticContactSnapshot()` po restore (52386) | **S** | Po wczytaniu snapshot jest natychmiast re-inicjowany do aktualnych kontaktów (komentarz 24588: „Po startu / wczytaniu — bez auto-popupu dla już widocznych AI”). Brak zapisu nie zmienia zachowania. |
| 3 | diplomacyDobraWolaActiveTura | 10783 (Set) | clear 26923 + add 26932 w `runDiplomacyTurnTick` (26848) | 47292 (AI tick) | nie | nie | **R** | `runDiplomacyTurnTick` jest wołany w `runWorldEndTurn` (43968), czyli PRZED odczytem 47292 w tej samej turze; zbiór jest czyszczony i przeliczany co turę. |
| 4 | aiNnsHoldOwners | 11187 (Set) | clear 7851 + add 7931 w `nnsAiPreTickBalance` (7850) | 48929, 48963 (zakupy/budowa AI) | nie | nie | **R** | `nnsAiPreTickBalance` wołany bezwarunkowo w `runWorldEndTurn` (44081) przed ekonomią i przed zakupami; komentarz 11186: „wypełniane w nnsAiPreTickBalance”. |
| 5 | aiNnsUncoveredOwners | 11189 (Set) | clear 7852 + add 7994 w `nnsAiPreTickBalance` | 44752 (bankowanie skarbca AI) | nie | nie | **R** | Ten sam przebieg co #4; odczyt 44752 jest po wywołaniu 44081. |
| 6 | aiImprovementBudgetByOwner | 11222 (Map) | clear 45864, set 45872 (blok ekonomii) | 46980 (`improvementBudgetCap`) | nie | nie | **R** | Zapis i odczyt w tym samym `runWorldEndTurn`; odczyt 46980 po zapisie 45872. |
| 7 | aiSurplusReportByOwner | 11228 (Map) | set 46990 — ŚWIEŻY obiekt na każdą turę i właściciela, przed `decideAITurn` | 48274 (po `decideAITurn`) | nie | nie | **R** | Komentarz 46985: raport z poprzedniej tury nie może przylgnąć do bieżącej — kod celowo odtwarza go co turę. Trwała część (`aiSurplusRedirectedOwners`) JEST zapisywana (ciało save, linia 42916). |
| 8 | aiGoldIncomeByOwner | 11194 (Map) | set 44717 (pętla `aiOwnerIds` w bloku ekonomii); clear 11892 (nowa gra), 51245 (start), 53500 (restore) | 40023, 40064 (przez `aiPurchaseReserveInputs` 40017 i `aiUpkeepRunwayAllows` 40061); wywołania: 8239 (`upgradeAiUnitsForEra`, wołane z 46696), 48964, 48973 | nie | clear (nie odtworzenie) | **R** | Zapis 44717 jest PRZED wszystkimi odczytami w tym samym `runWorldEndTurn` (46696, 48964, 48973 > 44717). Okno „brak wpisu po wczytaniu” (komentarz 11192) nie zawiera żadnego odczytu: pierwszy odczyt następuje dopiero po zapisie w pierwszym koniec-tury po wczytaniu. |
| 9 | aiWonderPracaTickByCity | 6026 (Map) | clear 44146, set 44149 (blok ekonomii, z `econ.perCity`) | 48363 (`pracaPerTurn`) | nie | nie | **R** | Przeliczane z `econ` w każdym koniec-tury, przed odczytem 48363. |
| 10 | aiWonderStuckTurnsByOwner | 6033 (Map) | set 48429 / 48431 / 48433 (licznik „utykania” cudu AI, w `runWorldEndTurn` 48336–48435); clear 11857 (nowa gra), 51323 (start), 53108 (restore) | 48411 (`relaxedWonderCostThreshold`) | nie | clear → po wczytaniu licznik = 0 | **D** (kod + ablacja wejścia progu; wpływ na grę NIE ZMIERZONO) | Licznik NIE jest przeliczany z innego stanu: rośnie co turę, gdy AI ma dostępnego kandydata, a decyzja cudu padła `null`. Po wczytaniu jest zerowany (53108). Ablacja (§3.1): próg dla licznika 12 wynosi 1,667, a po wczytaniu (licznik 0) — 1,000. Szczegóły w §3.1. |
| 11 | pendingAdministratorChanges | 11008 (Map) | set/delete 11021–11026 (`refreshCityAdministrators`); flush 11030–11031 (`noteAdministratorChange`); clear 53585, 53587 (restore, z komentarzem) | 11024 (tylko w pętli łączenia), 11030 (tylko powiadomienia) | nie | clear (celowe) | **S** | Jedyny odczyt, który wpływa na coś poza mapą, to `noteAdministratorChange` (powiadomienie). Restore czyści kolejkę celowo („stan z zapisu jest punktem odniesienia, bez powiadomień o zmianach sprzed wczytania”). Utrata = co najwyżej jedno niepokazane powiadomienie. Stan decyzji administratorów (`stateAdmByOwner`) jest osobną strukturą. |

Podsumowanie klas dla 11 kandydatów: **S = 3** (#1, #2, #11), **D = 1** (#10), **R = 7** (#3–#9). Suma 11.

## 2. Skan systematyczny

Narzędzie: `gra/tools/save-state-audit-scan.cjs` (tylko odczyt pliku; nie uruchamia gry, nie importuje kodu gry).
Polecenie (z katalogu głównego repo): `node gra/tools/save-state-audit-scan.cjs --md > dyspozycje/autobot/runs/R-WEB-SAVE-STATE-AUDIT-Q1/scan-output.txt`
Wynik surowy: `dyspozycje/autobot/runs/R-WEB-SAVE-STATE-AUDIT-Q1/scan-output.txt` (tabela Markdown, nagłówek `# save-state-audit-scan: gra/src/main.ts`).

Wynik (liczby z surowego wyjścia, uruchomienie 2026-11-28, runda 2):
- Deklaracje `let`/`const` na wcięciu 4 spacje, **wszystkie typy inicjalizatora**: **533**. Rozkład: Map=120, Null=63, Licznik=72, Wyrażenie=80, Flaga=52, Array=54, Set=35, Tekst=24, Obiekt=15, Instancja=9, Brak=7, Undefined=2.
- Nie występują w ciele `buildSaveGameSnapshot` (bez komentarzy w ciele): **384**.
- Wśród tych 384 — wstępna klasa po nazwie: D? = **76**, S? = **56**, bez sygnału (?) = **252**.
- Mimo tego, że nie są w ciele save, część występuje w ciele restore (zwykle jako `clear()`): np. `aiWonderStuckTurnsByOwner`, `aiGoldIncomeByOwner`, `citizenUpkeepByOwner`, `buildingResourceUpkeepByOwner`, `unitResourceUpkeepByOwner`, `aiFoodTickNetByOwner`, `movedByPlayerThisTurn`, liczniki `_lastPraca*`.
- `aiCmdResume` (linia 14947, `Null`) trafia do tabeli: nie w zapisie, D?.

Zmiany skanu względem rundy 1 (zarzuty 3–5):
- Inicjalizatory `null`, `undefined`, literały tekstowe/obiektowe/tablicowe, `new X(...)`, brak inicjalizatora — wszystkie objęte (poprzednio 330 deklaracji tylko z Map/Set/Array/obiekt/licznik/flaga).
- Komentarze `//` i `/* */` są usuwane przed dopasowaniem nazwy w ciele funkcji i w deklaracjach. Literały tekstowe są zachowywane (np. `'https://…'` nie jest komentarzem).
- Wynik zapisany poleceniem z sekcji powyżej (nagłówek i format spójne z poleceniem; rundy 1 nie była reprodukowalna 1:1).
- Heurystyka D? rozszerzona o `Garrison`, `Battle`, `Resume` (wzmianka w kodzie: `aiGarrisonUnitIdByOwner`, `aiTurnAwaitingBattle`, `aiCmdResume`).

Test mutacyjny komentarzy (kopia `main.ts` poza repo; w ciele `buildSaveGameSnapshot` dopisane linie `// aiGoldIncomeByOwner aiCmdResume …` i `/* aiWonderStuckTurnsByOwner */`):
- stary skan (commit 618fc67, `gra/tools/save-state-audit-scan.cjs`) na mutancie: `aiGoldIncomeByOwner` i `aiWonderStuckTurnsByOwner` ZNIKAJĄ z listy niezapisywanych (komentarz zliczony jako zapis = fałszywe „tak”);
- nowy skan na mutancie: obie zmienne nadal „nie” (wynik niezmieniony względem oryginału: `aiGoldIncomeByOwner` 11194 „nie”, `aiWonderStuckTurnsByOwner` 6033 „nie”).

Ograniczenia skanu (zapisane jawnie):
- Klasy D?/S? to heurystyka po nazwie; ostateczna klasa wymaga czytania kodu. Skan nie rozstrzyga klasy.
- Skan obejmuje tylko deklaracje na wcięciu 4 (domknięcie gry); zmienne zagnieżdżone głębiej, stan w innych modułach (`gra/src/game/*.ts`, `save.ts`) i stan dostępny przez obiekty już zapisane NIE są objęte.
- „w restore: tak” znaczy tylko „wzmianka w ciele restore” (często `clear()`), NIE że wartość jest odtwarzana z zapisu.
- Dopasowanie słów po nazwie: nazwa użyta w innym zakresie znaczeniowym (np. parametr funkcji o tej samej nazwie) liczy się jako „w zapisie”. Niedomiar możliwy tylko przy takiej kolizji nazw.

## 3. Zbadane kandydaty z wstępną klasą D? (werdykt z kodu)

Zbadano 5 kandydatów oznaczonych w skanie jako D? (wszystkie z listy zarzutu 2): werdykty D = 2 (#10, aiGarrisonUnitIdByOwner), R = 2 (wiarygodnoscCyclicDeliveryOkThisTurn, objectivePowerByOwner), S = 1 (lastCityKulturaTick). Plus 3 pozycje z tabeli 11 (#1, #8, #10) — ich werdykty w §1 i §3.

### 3.1 aiWonderStuckTurnsByOwner (#10) — werdykt: D (kod + ablacja wejścia progu); wpływ na grę NIE ZMIERZONO

Mechanizm:
1. Licznik rośnie o 1 co turę dla AI, które mają dostępnego kandydata na cud, nie budują cudu i `decideAiWonderBuild` zwrócił `null` (main.ts:48425–48433).
2. Efektywny próg opłacalności cudu jest mnożony przez `1/(1 − t/max)` (`relaxedWonderCostThreshold`, `gra/src/game/ai.ts:2743–2757`, `max = cuda_stuck_relax_tur_max`, domyślnie 30; `ai.ts:2727–2728`). Mechanizm 2 („twardy wymuszacz”, komentarz main.ts 48336–48340) działa osobno, przy komplecie technologii epoki.
3. `restoreGameFromSave` zeruje mapę (main.ts:53108), a ciało save nie zawiera tego licznika. Każde wczytanie zapisu kasuje więc postęp łagodzenia.

Ablacja (B≠A dla wejścia progu, wynik surowy: `dyspozycje/autobot/runs/R-WEB-SAVE-STATE-AUDIT-Q1/ablation-wonder-stuck-output.txt`, narzędzie `gra/tools/save-state-audit-ablation.cjs`, które bundluje rzeczywistą funkcję `relaxedWonderCostThreshold` do katalogu tymczasowego poza repo):
- `stuckRelaxTurMax=30 base=1`
- A (licznik=12, zachowany): efektywny próg = **1,6667**
- B (licznik=0, po wczytaniu): efektywny próg = **1,0000**
- B≠A dla progu: **TAK**. Tabela: licznik 0 → 1; 6 → 1,25; 12 → 1,667; 18 → 2,5; 24 → 5,0; 30 → nieskończoność.
- Uwaga: to ablacja WEJŚCIA progu (ta sama funkcja, ten sam wynik, różny licznik). Czy różnica progu zmienia decyzję cudu w konkretnej turze (dokąd `progKosztX` przepuszcza kandydata), wymaga biegu gry — NIE ZMIERZONO (harness na żywo nie był uruchamiany w tej rundzie).

Konsekwencja dla gry (opis dla gracza, z kodu): AI, które od kilku tur nie mogło postawić cudu, po wczytaniu gry zaczyna liczyć od zera. Przez kolejne tury próg jest ostrzejszy niż w ciągłej grze, więc cud AI może powstać kilka tur później (ograniczone przez `max`, 30 tur). Wymuszacz (t ≥ 30) przesuwa się o pełne 30 tur.

Proponowany minimalny fix (≤ 10 linii, osobny temat, NIE w tej rundzie):
- ciało save: w obiekcie `meta`, obok `aiSurplusRedirectedOwners` (linia 42916): `aiWonderStuckTurnsByOwner: Array.from(aiWonderStuckTurnsByOwner),`
- ciało restore: zamiast `aiWonderStuckTurnsByOwner.clear();` (53108): `aiWonderStuckTurnsByOwner.clear(); for (const [oid, t] of (saved.meta?.aiWonderStuckTurnsByOwner ?? []) as Array<[number, number]>) aiWonderStuckTurnsByOwner.set(oid, t);`
- Ryzyko: nowe pole w zapisie (opcjonalne; stare zapisy bez pola dają 0, czyli dzisiejsze zachowanie). Wymaga testu round-trip i mutacji (pole nieczytane → test czerwony) oraz pomiaru B≠A w grze przy maksimum. Niski.

### 3.2 difficultyBonusGrantedOwners (#1) — werdykt: S (brak wpływu na decyzje po wczytaniu), z zastrzeżeniem o kolejce

- Jedyny zapis (`add`) jest w `grantDifficultyStartBonusesForMajorCapital`, a jedyne wywołanie tej funkcji to `spawnPendingForeignClusters` (12308), które działa wyłącznie na `pendingForeignSpawnCities` (10400, `let`, nie zapisywane; opróżniane w 12240 przy każdym wywołaniu; ustawiane w 11831 przy nowej grze).
- Po wczytaniu kolejka jest pusta (nie jest odtwarzana), więc `grant…` nie jest wołane i zbiór nie wpływa na żadną decyzję.
- Uwaga (stan rozbieżny, bez wpływu obecnie): restore NIE wywołuje `applyClusterStartPlan`, więc zbiór nie jest czyszczony przy wczytaniu w tej samej sesji — może zawierać właścicieli z poprzedniej gry. Nieszkodliwe wyłącznie dlatego, że nie ma już ścieżki wywołania.
- Pokrewny problem (do weryfikacji, NIE potwierdzony live): `pendingForeignSpawnCities` i pokrewne kolejki `pendingSameTypeRival*` (10381–10394) NIE są zapisywane. Jeśli zapis powstanie przed założeniem stolicy gracza, wczytana gra nie utworzy zaplanowanych miast-państw/rywali. Do sprawdzenia, czy taki zapis jest w ogóle osiągalny.

Weryfikacja: kod. Live — **NIE ZMIERZONO**.

### 3.3 aiGoldIncomeByOwner (#8) — werdykt: R (brak wpływu)

- Zapis 44717 jest w bloku ekonomii `runWorldEndTurn`, odczyty 40023/40064 (przez `aiPurchaseReserveInputs` i `aiUpkeepRunwayAllows`) są w tej samej funkcji i zawsze po 44717 (46696, 48964, 48973).
- Komentarz 11192 („brak wpisu (tura 1, po wczytaniu zapisu) = reguła rezerwy wyłączona”) opisuje okno między wczytaniem a pierwszym koniec-tury. W tym oknie nie ma odczytu tego zbioru, więc fallback nigdy nie jest użyty.
- Wniosek: brak w zapisie NIE zmienia decyzji zakupów AI. Dotyczy też `aiFoodTickNetByOwner` (ten sam wzorzec; do potwierdzenia w follow-upach).

Weryfikacja: kod. Live — **NIE ZMIERZONO**.

### 3.4 aiGarrisonUnitIdByOwner (main.ts:40103) — werdykt: D (warunkowe); wpływ NIE ZMIERZONO

- Deklaracja `const aiGarrisonUnitIdByOwner = new Map<number, string>()` (40103). Zapis: `set` w pętli zakupów `runWorldEndTurn` (48959) tylko gdy `cmd.garrison === true`. Odczyt: `aiGarrisonGoldReserve` (40104–40112) przez `aiGarrisonUnitIdByOwner.get(ownerId) ?? EMPTY_CITY_GARRISON_UNIT_ID`.
- Grep: brak `clear()` tej mapy, brak wpisu w ciele save i restore. Mapa żyje przez całą sesję i nie jest odtwarzana po wczytaniu.
- Skutek po wczytaniu: pierwsza tura po wczytaniu liczy rezerwę na garnizony z fallbackiem `'Wojownik'` (`gra/src/game/ai.ts:1989`), dopóki w tej turze nie padnie komenda garnizonu. `aiGarrisonGoldReserve` jest wołana dla zakupów niepriorytetowych także PRZED komendą garnizonu, jeśli kolejność komend na to pozwala.
- Warunek rozbieżności: różnica tylko gdy typ garnizonu wybrany przez AI ma inny koszt niż `Wojownik` i w tej turze jest zakup niepriorytetowy przed komendą garnizonu. Wtedy rezerwa złota (`garrisonGoldReserve`) może różnić się od ciągłej gry i AI inaczej rozdysponuje skarbiec.
- Werdykt: D warunkowe (wpływ na zakup AI w pierwszej turze po wczytaniu, zależnie od kolejności komend i kosztu typu). Ablacja B≠A: NIE ZMIERZONO.

Proponowany fix (≤ 10 linii): jak w §3.1, mapa w `meta` i odtworzenie w restore. Ryzyko: niski; wymaga testu round-trip z komendą garnizonu w turze 1 po wczytaniu.

### 3.5 wiarygodnoscCyclicDeliveryOkThisTurn (main.ts:10830) — werdykt: R

- Deklaracja 10830. `clear()` na początku `tickCyclicResourceTradeDeals` (26694), `set` w tej samej funkcji (26755–26777), odczyt w tej samej funkcji (26825). Mapa jest wypełniana i czytana w obrębie jednej tury, przed jakimkolwiek zapisem.
- Brak w zapisie nie zmienia wyniku: pierwszy odczyt następuje po zapisie w tej samej wywołaniu.

### 3.6 objectivePowerByOwner (main.ts:2477) — werdykt: R

- `refreshObjectivePowerCache` (3134–3140) przebudowuje mapę, gdy `powerDirty` lub mapa pusta; wołana w koniec-tury przed odczytami (44141). Odczyty z fallbackiem `?? buildObjectivePowerForOwner(ownerId).power` (12504, 27041–27042) przeliczają wartość z aktualnego stanu, gdy wpisu brak.
- Wniosek: po wczytaniu wartość odtwarzana z aktualnego stanu gry, brak w zapisie nie zmienia decyzji.

### 3.7 lastCityKulturaTick (main.ts:6019) — werdykt: S (UI) / R

- Zapis: `set` w pętli `econ.perCity` (44148) przy każdym koniec-tury; `clear` przed nią (44145) i przy starcie (51321). Odczyt w buildzie danych wyświetlania miasta (`przyrost`, 9698).
- Po wczytaniu pierwszy koniec-tury wypełnia mapę z `econ.perCity`, więc wpływ ogranicza się do wartości wyświetlanej w oknie miasta do pierwszego koniec-tury po wczytaniu. Odczytów decyzyjnych nie znaleziono w tej rundzie (klasa S = brak wpływu na decyzje; konsumenci poza buildem UI nieprzebadani w całości).

## 4. Lista follow-upów (posortowana: D najpierw)

| Prio | Pozycja | Klasa | Opis błędu dla gracza | Proponowany fix | Ryzyko |
|---|---|---|---|---|---|
| 1 | aiWonderStuckTurnsByOwner (#10) | D (kod + ablacja progu; wpływ na grę NIE ZMIERZONO) | Po wczytaniu cud AI może powstać kilka tur później niż w ciągłej grze. | §3.1 (≤10 linii, pole w meta + odtworzenie w restore). | Niski; wymaga testu round-trip, mutacji i pomiaru B≠A w grze przy maksimum. |
| 2 | aiGarrisonUnitIdByOwner (§3.4) | D warunkowe (wpływ NIE ZMIERZONO) | W pierwszej turze po wczytaniu AI może inaczej odłożyć złoto na garnizon. | Jak #1 (mapa w meta + restore). | Niski; test round-trip z komendą garnizonu w turze 1. |
| 3 | pendingForeignSpawnCities / pendingSameTypeRival* (10381–10400) | D warunkowe (osiągalność zapisu przed założeniem stolicy do sprawdzenia) | Gdyby zapis powstał przed założeniem stolicy gracza, wczytana gra nie ma zaplanowanych miast-państw/rywali. | Zapisać kolejki w meta albo zablokować zapis przed założeniem stolicy. | Średni (zmiana formatu zapisu). |
| 4 | playerStartHexByOwner (3305) | D? (nie zapisywane; odtwarzane tylko z planu nowej gry, 11812) | Po wczytaniu start gracza/właścicieli może wskazywać stary hex. Konsumenci NIE ZBADANE. | Przebadać konsumentów; zapisać w meta, jeśli używane przez decyzje. | Nieznany do przebadania. |
| 5 | aiTurnAwaitingBattle (14948) | D? (NIE ZBADANE w tej rundzie) | Jeśli zapis powstanie w trakcie oczekiwania na bitwę AI, wczytana gra może pominąć lub zdublować turę AI. Do sprawdzenia, czy zapis jest blokowany przy bitwie (set 48728, clear 43863/46185). | Przebadać blokadę zapisu w trakcie bitwy. | Nieznany. |
| 6 | diploZeroTrustWarned (10779) | S? (flaga deduplikacji ostrzeżeń, nie zapisywana) | Po wczytaniu to samo ostrzeżenie o zaufaniu może pojawić się ponownie. | Przebadać 12742–12765. | Niski. |
| 7 | movedByPlayerThisTurn (35989), converterProducedLastTurnByOwner (5982), citizenUpkeepByOwner (5964), buildingResourceUpkeepByOwner (5976), unitResourceUpkeepByOwner (5983), aiFoodTickNetByOwner (11197) | D? (wzmianka w restore) | Prawdopodobnie przeliczane z zapisanego stanu w pierwszym koniec-tury (wzorzec #8). | Potwierdzić przeliczenie przed pierwszym odczytem. | Niski. |
| 8 | pozostałe D? z tabeli skanu (76 pozycji, wliczając powyższe) | D? niezweryfikowane | Nieznane bez czytania każdej pozycji. | Ręczna klasyfikacja w kolejnym temacie (wzorzec §1). | — |
| 9 | pozostałe S? (56 pozycji) i liczniki `_last*` | S? | Głównie cache/UI/diagnostyka (np. `nnsAiLog`, `nnsAiTurnStats`, `eraWarMeasure*`, `endTurnInProgress`). | Brak działania; zostawić. | — |

Zasada z tematu: dla D rozbieżność jest potwierdzona dopiero testem B≠A w grze (ablacja). Ablacja wejścia progu (#1) jest tylko dowodem, że zmienna wpływa na wejście decyzji. Pozycje 1–5 wymagają testu w grze przed wdrożeniem fixu.

## 5. NIE ZMIERZONO

- Żadna pozycja nie była mierzona na żywo (harness Chromium, ablacja B≠A w grze, macierz A==A'). Wyjątek: ablacja WEJŚCIA progu cudu (§3.1) — czysta funkcja, bez gry.
- Werdykty D/R/S są z kodu (z wyjątkiem ablacji progu dla #10).
- Pełny rozkład klas dla 384 pozycji skanu: tylko heurystyka po nazwie; ręczna klasyfikacja poza zakresem tej rundy.
- Bramki zadania zmierzone w tej rundzie (po `npm ci` w `gra/`, bez `build`/`dev`): `npx tsc --noEmit` exit 0; `node tools/logic-test.cjs` LOGIC OK (213/213); `node tools/ai-test.cjs` 297 passed, 0 failed. Dowód braku zmian w grze: `git diff --stat -- gra/src gra/data` puste.
