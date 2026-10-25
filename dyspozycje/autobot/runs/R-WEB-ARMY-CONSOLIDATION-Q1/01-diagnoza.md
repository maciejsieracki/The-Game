# R-WEB-ARMY-CONSOLIDATION-Q1 — runda 1, DIAGNOZA (Operator)

Baza: `origin/main` (d49c21c6) + cherry-pick haka `ed76682d`, `4a6b0791` (commity `6711dae9`, `0f7b4fbc`, lokalnie, bez push).
Status tej rundy: diagnoza z kodu + pomiar bazowy (flaga OFF, hash jak baza). Implementacja za flagą NIE wykonana w rundzie 1.

## 1. Mechanizmy, które zostawiają jednostki na polu (kod)

Plik `gra/src/game/ai.ts` (decideAITurn, ścieżka major AI; `isMajorAiOwner` = `!defensiveCopy`).

### 1a. Obrona domu: 1 jednostka na 1 zagrożenie, wysłana pojedynczo (główny podejrzany)
- `ai.ts:3293-3296`: `homeThreats` = KAŻDA jednostka wroga/barbarzyńska (`enemyAllUnitsRegardlessOfVisibility`, bez filtra mgły) w promieniu `cityTerritoryRadius + 2*AI_HOME_DEFENSE_VICINITY_HEX` od DOWOLNEGO własnego miasta (`isHomeDefenseThreatForCity`, `ai.ts:2952`).
- `ai.ts:2967-2993` `assignHomeDefenders`: przydział 1:1. Każde zagrożenie dostaje najbliższą wolną jednostkę (`ruchLeft>0`, nie zwiadowca). Komentarz w kodzie wprost nazywa to „świadomym uproszczeniem”.
- `ai.ts:3589-3596`: przydzielony obrońca dostaje `move` w stronę zagrożenia (`firstStep`) i jest pomijany w dalszej logice.
- `ai.ts:3329`: `concentrationExcludedUnitIds` zawiera `homeDefenderAssignments.keys()`. Obrońcy są więc WYKLUCZENI z `planArmyConcentration` i z `planArmyFrontMerge` (`frontMergeExcluded`, `ai.ts:3412-3416`).
- Skutek: każde błąkające się barbarzyńskie zagrożenie w pobliżu miast w pokoju odrywa jedną jednostkę od armii i wysyła ją samą na pole. Przydział jest przeliczany co turę, więc jednostka często zostaje w polu jako pojedyncza grupka. To odpowiada obrazowi z zrzutu właściciela (pojedyncze jednostki wokół Ur, Uruk, Eridu, ...).

### 1b. Kwalifikacja do skupiania wyklucza jednostki już ruszone w tej turze
- `army-concentration.ts:93-108` `isEligibleForArmyConcentration`: `ruchLeft<=0`, `inGarnizon`, `oblegaCityId`, cywile, statki, galery → poza skupieniem.
- Skład klastrów zmienia się w ciągu tury (jednostki ruszone wypadają z listy), więc klastry nie są stabilne między turami; grupa, która się częściowo ruszyła, rozpada się.

### 1c. Lokalne skupianie wymaga ≥3 jednostek w promieniu 4 (`army-concentration.ts:13-14`, `planArmyConcentration` :173)
- Pary i pojedyncze jednostki nigdy nie są „armią” w tym mechanizmie. Dopiero `planArmyFrontMerge` (:278) przesuwa nadmiarowe klastry.

### 1d. `planArmyFrontMerge` w pokoju: cel = 1 klaster, ale punkt zbiorczy NIE jest stolicą
- `ai.ts:3437-3438`: `targetClusterCount = forcedWarAttack ? 1 : (threatFrontCount <= 1 ? 1 : threatFrontCount)`. W pokoju cel = 1, więc wszystkie klastry poza najcięższym dostają rozkaz marszu.
- Kotwica to klaster o największej wadze (`army-concentration.ts:320-323`), nie stolica. W kodzie skupiania NIE występuje pojęcie stolicy (w `army-concentration.ts` ani `planArmyFrontMerge` brak `capital`). Stąd naruszony jest R-B (armie w stolicy).
- Każdy nadmiarowy klaster dostaje jeden krok (`firstStep`) na turę. Przy wielu klastrach konwergencja trwa wiele tur, a w tym czasie grupki stoją na polu.

### 1e. Wojna: `warAllInCapital` (flaga `WAR_ALLIN_CAPITAL_ENABLED = true`, `warAllInCapital.ts:24`)
- `ai.ts:3780-3785` nadpisuje ruch jednostek bojowych rozkazem marszu na stolicę wroga; `planWarAllInCapital` tworzy grupy wg łańcucha odległości `WAR_ALLIN_LINK_RADIUS`, potem rendezvous (`clusterGoal`) i marsz na cel. Ataki i wejścia na wrogie miasto są zachowywane (`keep`).
- Luka względem R-C: liczba armii NIE jest wymuszana jako „jedna armia na jedną wojnę”. Grupy wynikają z geometrii (łańcuch odległości), a nie z liczby wojen. Dodatkowo jednostki z `ruchLeft<=0` i jednostki poza łańcuchem są planowane osobno.
- Jednostki z `oblegaCityId` (oblężenie, `main.ts:15227`) i obrońcy domu nie wchodzą do planu marszu, więc też zostają rozproszone.

### 1f. Nowo wyszkolone jednostki
- `army-concentration.ts:151` `mergeCompletedAiRecruitment`: scalanie tylko na tym samym heksie narodzin. Jednostka zostaje w mieście produkcji jako osobny stos, aż zadziała 1b/1d. Nie ma rozkazu „dołącz do armii stolicy”.

## 2. Pomiar bazowy (flaga OFF = baza)

Narzędzie: `/home/user/scratch-army/measure-groups.cjs` (poza repo; korzysta z harnessu `gra/tools/lib/game-sim-harness.cjs` i haka `?testhook=1`, tylko odczyt snapshotów). Grupy = łańcuchy odległości ≤4 między jednostkami AI poza heksami miast własnego właściciela. Seed 101, 5 AI, 2 miasta-państwa, normal, kamień, gracz pasywny. Tury 20/40/60.

Narzędzie odczytu: hak `window.__test.rawPositions()` (commit `6c14961c`, tylko odczyt, za `?testhook=1`).

## 3. Wynik pomiaru (seed 101, tura 20, flaga OFF = baza)

Dane surowe: `{"turn":20,"wars":0}`, 5 AI + 2 miasta-państwa (właściciele 1-17), **pokój** (0 par w wojnie).
Jednostki cywilizacji (owner 1-17 bez barbarzyńców): ~50 razem, w tym 37 poza miastami (pole).

| Właściciel | jednostki | w mieście | pole | grupy polowe | największa |
|---|---|---|---|---|---|
| 1 | 3 | 0 | 3 | 2 | 2 |
| 4 | 3 | 0 | 3 | 3 | 1 |
| 7 | 3 | 0 | 3 | 2 | 2 |
| 10 | 4 | 0 | 4 | 2 | 3 |
| 13 | 4 | 0 | 4 | 3 | 2 |

Wniosek z pomiaru: w turze 20, w pokoju, przy małej liczbie jednostek (1-4 na właściciela) problem jest widoczny, ale skala jest mniejsza niż na zrzucie właściciela (dziesiątki grupek). Na każdą cywilizację przypada 2-3 grupy polowe, a większość jednostek stoi poza miastem. Pomiar tur 40/60 nie został wykonany (patrz sekcja 5).

Uwaga o metodzie: sam przebieg 20 tur na współdzielonej maszynie (równoległe symulacje innych sesji) dwukrotnie zakończył się `Target crashed` przy 60 turach; przebieg 20-turowy zakończył się bez pageerror.

## 3a. Ograniczenia pomiaru

- Brak pomiaru flagi ON (flaga `ARMY_CONSOLIDATION_ENABLED` nie istnieje; implementacja nie była wykonana w rundzie 1).
- Brak pomiaru wojny (turn > 40, `wars > 0`); potrzebny do oceny R-C.
- Próg „dziesiątek grupek” z zrzutu właściciela nie został odtworzony w tym seedzie. Może wynikać z późniejszych tur, większej liczby miast lub innego seeda.

## 4. Ryzyka i ZAŁOŻENIA

- ZAŁOŻENIE: garnizony miast (`inGarnizon`, jednostki w mieście) nie są przesuwane, zgodnie z dispatchem.
- ZAŁOŻENIE: „stolica” = `city` z najwyższą populacją do czasu znalezienia pola stolicy w danych AI; do potwierdzenia przed implementacją.
- Zmiana obrony domu (1a) dotyka zachowania barbarzyńców i obrony. Wymaga regresji `ai-test`, `army-concentration-test`, `barb-city-behavior`.

## 5. Plan rundy 2 (proponowany)

1. Za flagą `ARMY_CONSOLIDATION_ENABLED`: w pokoju jednostki polowe nie przydzielone do obrony scalają się w stolicy (kotwica = stolica; fallback najbliższe miasto).
2. Obrona domu: zagrożenie wymagające jednostek dostaje kworum/pojedynczą jednostkę tylko gdy realnie jest w zasięgu; reszta zostaje w zbiórce (zmiana za flagą, OFF = baza).
3. Wojna: liczba armii = liczba wojen (min 1), przydział zrównoważony siłą, marsz scalonych armii (reuse W1/W2).
4. Pomiar: flaga ON vs OFF, seedy 101/102/103 × 60 tur × 5 AI, metryki z sekcji 2.

DEPLOY/PUSH: NIE WYKONANO
