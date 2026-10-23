STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-WAR-ALLIN-CAPITAL-Q1
GOAL: Tymczasowa zasada wojny w wersji webowej: w stanie wojny cala armia (jednostki bojowe) cywilizacji AI i barbarzyncow idzie na AKTUALNA stolice przeciwnika (AI: najblizsza od grupy stolica wsrod wrogow; barbarzyncy: najblizsza stolica wsrod cywilizacji, z ktorymi sa w wojnie); gracz NIE dostaje automatycznych rozkazow; jedna flaga wylaczenia.
RUNDY: 1/5

## Baza
Worktree detached na `origin/main` = `75f53d58`. Dispatch skopiowany z galezi claude/sprawdzenie-funkcjonalnosci-ek4ra0 (`00-dispatch.md`).

## Znalezione mechanizmy (plik:linia, stan po zmianie)
- Decyzje AI jednostek: `gra/src/game/ai.ts` `decideAITurn` (Krok 4 "UNIT MOVEMENT AND ATTACK"); istniejaca wojna wymuszona: `AITurnOpts.forcedWar` (ai.ts ~435) + `forcedWarAssignmentByOwner` (main.ts ~34041). Komenda `move` = pierwszy krok trasy (`firstStep`); silnik `executeAiCityMove` (`gra/src/game/ai-city-capture-executor.ts:75`) przesuwa jednostke o 1 heks i zeruje `ruchLeft`.
- Wolanie AI: `main.ts:35173` (`decideAITurn`), opts z `canEngageOwner` (main.ts ~34245, wojna = `getDiploRelation(...).status === 'wojna'`).
- Stolica: `capitalCityIdForOwner` main.ts:29203 (wpis `capitalCityIdByOwner` albo najstarsze miasto); po utracie stolicy sukcesja `main.ts:29723-29724` (`outcome.newCapitalIdForOldOwner`, logika `game/capital-capture.ts`); proaktywne przenoszenie AI `maybeRelocateThreatenedAiCapital` main.ts:29321. Cel zawsze = aktualna stolica liczona co ture (zmiana stolicy w marszu = automatyczne przekierowanie).
- Barbarzyncy: `gra/src/game/barbarians.ts:1745` `decideBarbarianMoves` (rally -> odwrot -> atak sasiada -> poscig najblizszej jednostki/miasta w `aggroRadius`); wolane z `main.ts:~36225`; barbarzyncy sa w wojnie ze wszystkimi (`getDiploRelation`, main.ts ~8542, `barbCanEngageOwner`).

## Zmiany
- NOWY `gra/src/game/warAllInCapital.ts` (jeden modul): flaga `WAR_ALLIN_CAPITAL_ENABLED = true` (+ `setWarAllInCapitalOverride` tylko dla testow), `planWarAllInCapital` (czysty, bez RNG): grupy (lancuch <=3 hex) -> cel = najblizsza stolica od kotwicy grupy -> mniejsze grupy w promieniu 8 hex dolaczaja do wiekszej/wczesniejszej grupy tego samego celu (rendezvous na kotwice; w promieniu <=3 od stolicy bez zbiorki) -> reszta idzie na stolice; trasy z JEDNEGO pola odleglosci (Dijkstra od celu) na cel, nie computePath na jednostke.
- `gra/src/game/ai.ts`: pole `AITurnOpts.warAllIn`; na koncu `decideAITurn` (przed endTurn) `applyWarAllInCapitalToCommands` zastepuje komendy RUCHU jednostek bojowych (zostawia `attack` i wejscie na heks wrogiego miasta). Uzasadnienie: jedyny punkt wejscia AI, nie rusza reszty logiki (obrona domu, produkcja, koncentracja).
- `gra/src/game/barbarians.ts`: dodatkowy parametr `warAllIn` w `decideBarbarianMoves`; jednostki bojowe (poza garnizonami wlasnych miast barbarzynskich i rajderami morskimi) dostaja rozkaz marszu na najblizsza stolice; atak sasiada zostaje; rally/odwrot pominiete gdy regula aktywna.
- `gra/src/main.ts`: `warAllInContextFor` (main.ts:29217) buduje liste aktualnych stolic wrogow (wojna) -- zwraca `undefined` gdy flaga OFF; podpiete w opts AI (main.ts:34277, nie dla kopii obronnych miast-panstw `typCityCopyOwners`) i przy barbarzyncach (main.ts:36228). Gracz: `decideAITurn` nie jest wolane dla czlowieka -- gracz jest tylko CELEM.
- NOWE testy/narzedzia `gra/tools/war-allin-capital-{test,harness,scenarios,quick,perf,regress,evidence}.cjs`.

## ZALOZENIA (luki w dispatchu)
1. Miasta-panstwa idace sciezka `decideAITurn` traktowane jak AI (regula je obejmuje); kopie obronne (`defensiveCopy`) nie.
2. Cywile/zwiadowcy (`isCivilianUnit`) nie dostaja rozkazu. Garnizon wlasnego miasta barbarzynskiego zostaje.
3. Jednostka juz atakujaca lub wchodzaca na heks wrogiego miasta zachowuje swoj rozkaz (przejecie nie-stolicy "po drodze" dozwolone).
4. Cel liczony z pozycji grup/miast niezaleznie od mgly (pozycje miast sa znane silnikowi, jak w `forcedWar`); przejecie nadal podlega `aiCityCaptureAllowed`/mgle w executorze.
5. Barbarzyncy na `easy/normal` nie wchodza na PUSTE miasto (`canBarbarianWalkIntoEmptyCity`, istniejaca regula) -- staja przy stolicy i atakuja obroncow; bez zmiany tej reguly.

## Wyjatki obligatoryjne
- Przeciwnik bez miast: `warAllInContextFor` pomija ownera bez miasta (main.ts:29217+), puste `targets` => komendy identyczne z dotychczasowymi (test 5a).
- Brak sciezki ladowej: pole odleglosci nie obejmuje jednostki => `plan.noPath`, jednostka zostaje; zero zawieszenia (test 4: symulacja <20 s, po ustabilizowaniu 0 ruchow w turach 21-30; test 8h).
- Determinizm: brak RNG, sortowanie po id/(q,r) (test 7, 8i).

## Dowody (evidence/, kazdy z EXIT=)
Symulacja headless (prawdziwe `decideAITurn`/`decideBarbarianMoves`, zastepczy silnik krokowy jak w `executeAiCityMove`, realna mgla promien 4, 90 tur), `evidence/sim-before-after.log.txt`:
- AI<->AI PRZED: 0 bitew, 0 przejec; PO: 43 bitwy, 3 przejecia (stolice zdobywane po kolei c1a,c1b,c1c).
- AI->gracz PRZED: 0 przejec; PO: 9 bitew, stolica gracza c0a zdobyta, potem nowa stolica c0b (przekierowanie). Gracz: 0 komend dla jego jednostek, pozycje niezmienione (test 2d-2g).
- Barbarzyncy PRZED: 0 przejec; PO: 4 przejecia; test 3d-3f: krok na NAJBLIZSZA stolice (nie najblizsze miasto), wojna tylko z graczem => stolica gracza, zmiana stolicy => nowy cel.
- Flaga OFF == origin/main: hash stanu po 90 turach identyczny dla 4 scenariuszy (test 6b; baza z `git archive origin/main`). Flaga ON != baza (6c).
- Determinizm ON: 2 przebiegi, ten sam hash (test 7).
- Czas fazy decyzji AI+barbarzyncy (4 AI x 26 jedn. + 15 barb., mapa 80x50, 40 tur, mediana z 3): OFF 55-59 ms/ture, ON 73-80 ms/ture = x1,31-1,35 (przy ~12x wiekszej liczbie ruchow i 13x wiekszej liczbie bitew); pierwsza wersja z computePath na jednostke dawala x4,6, zastapiona polem odleglosci per cel. CALEJ tury (ekonomia, render, main.ts) NIE_ZMIERZONO (main.ts nieuruchamialny headless); faza decyzji to jej mala czesc, wiec x<=1,3 dla calej tury jest bardzo prawdopodobne, ale nie udowodnione.
- Mutacja: wylaczenie wywolania w ai.ts => 8 FAIL w `war-allin-capital-test.cjs` (test wykrywa brak reguly).

## Bramki
- `tsc --noEmit` EXIT=0 (`evidence/tsc.log.txt`); direct Vite build (`node node_modules/vite/bin/vite.js build --outDir <scratchpad>`) EXIT=0, 895 modulow, 69 867,95 kB (artefakt skasowany, nie publikowany).
- `war-allin-capital-test.cjs`: 59 passed, 0 failed (`evidence/test.log.txt`).
- Regresja: logic-test 213/213; ai-home-defense 42/0; army-concentration 55/0; barb-city-behavior 177/0; barb-city-capture-cluster 96/0; barbarians-test 213/0; barbarzyncy-krazenie 249/0; barbarzyncy-podwojny-atak-prebattle 18/0; city-state-alliance 74/0; siege-ai 17/0; ai-city-recovery 7/0; forced-war-waves 17/0; forced-war-bronze 56/0; forced-war-iron 55/0; forced-war-stone 38/0; forced-war-reguly-multi-turn 39/0; ai-early-no-major-war 14/0.
- NIEZIELONE PRZED ZMIANA (identycznie na bazie): `ai-test.cjs` 276 passed / 18 failed (te same 18 na czystym origin/main, diplomacja); `city-state-offensive-normal-easy-test.cjs` 21 PASS / 6 FAIL na czystym `main.ts` z origin/main (test jest samokontrola diffu working-tree dla historycznej zmiany -- sekcja A i B padaja bez wzgledu na ten temat). Nie naprawiane (poza zakresem).

## Zaleznosc od wojny wymuszonej
Spam "[Wojna wymuszona] DECISION_REQUIRED" (main.ts ~34040, `forcedWarAssignmentByOwner`) nie dotkniety. Gdy regula ON, nadpisuje ona KOMENDY RUCHU napastnika/obroncy wojny wymuszonej (cala armia -> najblizsza stolica wrogow w wojnie), wiec ksiegowanie fal (`forcedWarWavesByPairKey`, `wavePlan`) nadal sie wykonuje, ale fale nie wplywaja na ruch; po wylaczeniu flagi dziala jak wczesniej.

## Allowlista (pliki zmienione)
`gra/src/game/warAllInCapital.ts` (nowy), `gra/src/game/ai.ts`, `gra/src/game/barbarians.ts`, `gra/src/main.ts` (okablowanie), `gra/tools/war-allin-capital-*.cjs`, `dyspozycje/autobot/runs/R-WEB-WAR-ALLIN-CAPITAL-Q1/**`. Zero zmian w gra-robocza/, WERSJE.md, rust-port/, src-tauri/, package-lock.json.

## BLOKADY / NOTY
- Brak smoke w przegladarce (zmiana logiki AI; zywa potwierdzenie wymaga rozgrywki z wojna) -- NIE_ZMIERZONO.
- Rendezvous/tempo: ruch 1 heks/ture (istniejaca semantyka executora) -- dojscie na duzej mapie trwa wiele tur; to nie zmiana tego tematu.
- Przy ON jednostki AI przestaja realizowac obrone domu/koncentracje/zbieranie wiosek (poza atakiem sasiada) -- zgodnie z "zero bezczynnych"; wylaczenie jedna flaga.

NASTEPNY KROK: Evaluator (niezalezny rerun `war-allin-capital-test.cjs`, przeglad diffu vs allowlista, ocena ryzyka x1,3 calej tury).
DEPLOY/PUSH: NIE WYKONANO
