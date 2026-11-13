STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-ARMY-ALL-CIVS-GATHER-UNDER-GENERAL-Q1
GOAL: wszystkie cywilizacje AI mają wodza zgodnie z epoką i zbierają armię pod NAJBLIŻSZYM wodzem; Brąz: drugi wódz zbiera nową armię w mieście; po śmierci wodza nowy w stolicy.

## Przyczyna (zmierzona)
PRZED (realna gra, Chromium, seed 4242 T1-20 i seed 777 T1-30, 5 cywilizacji AI: Egipt, Zulusi, Inkowie, Chińczycy, Grecy): KAŻDA cywilizacja miała 0 wodzów we WSZYSTKICH turach (limit epoki 2), 0 jednostek przy wodzu, 0 wodzów w kolejce, kampania null, wojna false. Źródło: `gra/src/main.ts` `prepareAiGeneralWarCampaign` kupował wodza WYŁĄCZNIE gdy trwała kampania wojenna (cel osiągalny + wojna). W pokoju AI nigdy nie miało wodza, więc zbiórka `consolidationPeace` (ai.ts) szła do punktu w stolicy, a jednostki z innych miast / z marszu zostawały rozproszone (Egipt: 6/35, Inkowie 20/32, Chińczycy 20/40 jednostek-tur poza miastem i bez wodza w seedzie 4242). Zasada "najbliższy wódz" (ARMY-TO-NEAREST-LEADER) działała tylko w etapach recruiting/gathering kampanii. W kampanii etap attacking drugi wódz nie istniał / nie zbierał nowych jednostek.

## Zmiany
- `gra/src/main.ts`: nowa `ensureAiGeneralRoster(ownerId)` wołana przed `prepareAiGeneralWarCampaign` (nie dla kopii obronnych miast-państw): wielka cywilizacja AI utrzymuje wodzów do `generalLimitForEra` także w pokoju; jeden zakup na turę tą samą ścieżką i bramką (`purchaseRecruitmentUnit` + `attemptGeneralPurchase`) co kampania i gracz. Utrata wodza = nowy w stolicy w kolejnej turze (do skutku, gdy brak złota/oferty).
- `gra/src/game/ai.ts` (a) pokój: żołnierz idzie do najbliższego żywego wodza (długość trasy, `pickNearestAvailableLeader`), wódz wraca do stolicy, brak wodza/trasy = zbiórka w stolicy (zachowanie awaryjne, jak dotąd); (b) kampania `attacking`: gdy jest wódz rezerwowy (Brąz), jednostki bliższe jemu niż wodzowi kampanii (remis = kampania) idą do niego i nie dołączają do marszu (nowe jednostki zbierają się w mieście), przez ten sam zbiór `keep` co obrońcy domu.
- NOWE: `gra/tools/ai-army-all-civs-general-muster-test.cjs` (10 PASS, 2 mutacje zabite), `gra/tools/ai-army-all-civs-live-measure.cjs` (pomiar żywy: wodzowie vs limit, jednostki przy wodzu / w mieście / rozproszone, histogram odległości, czas dotarcia).
- Allowlista: tylko pliki powyżej + run. `generals.ts`, `army-concentration.ts`, `ai-march-guard.ts` bez zmian.

## Testy
- tsc: EXIT=0.
- Nowy test: 10 PASS/0 FAIL; mutacja A (wyłączona zbiórka u wodza w pokoju) łamie P1,P2; mutacja B (wyłączona rezerwa) łamie P5 (RED/GREEN przez mutację).
- Regresja (POST, logi `gate-*.txt`): ai-army-scattered-merge 33/0; army-concentration 56/0; army-consolidation (mutacje KILLED) EXIT=0; army-consolidation-e2e 6/0; ai-army-replacement-concentration 35/0; army-to-nearest-leader 43/0; ai-general-war-campaign 51/0; ai-war-defend-home 30/0; war-allin-capital 98/0; war-allin-keep-barb-defense 8/0; war-allin-general-path-barb-defense 24/0; ai-home-defense-civilian-filter 8/0; ai-home-defense-vs-barbarians 46/0; ai-move-full-range 20/0; ai-test 274/20 (identycznie jak baza).
- NIE URUCHOMIONE: general-capital-recruitment-order (9 PASS statyczne, część przeglądarkowa pada: brak /usr/bin/chromium w środowisku), generals-purchase-runtime (vite+Chromium), ai-general-war-campaign-live. Nie uruchomiono wersji PRZED dla bramek (zmiana nie dotyka ich ścieżek; do potwierdzenia przez Evaluatora).
- Pomiar żywy PO (seed 4242, T1-30, Chromium): wodzowie pojawiają się: Inkowie T7, Chińczycy T23, Egipt T25, Grecy T25, Zulusi T26; od ~T26 wszystkie 5 cywilizacji ma 2/2 wodzów. T26-30: 112 z 165 jednostek-tur przy wodzu (promień ≤2) vs 0 PRZED (seed 777, 0 wodzów w 29/29 turach); nowe jednostki dochodzą do wodza średnio w 2.6 tury (30 z 64 narodzonych w oknie). Czas tury AI bez wzrostu (ostatnie 10 tur 27.3 s PO vs 29.6 s PRZED, inne ziarno, 2 procesy równolegle, więc orientacyjnie).

## BLOKADY / NIE_ZMIERZONO
1. Pomiar NIE spełnia wymagań dispatchu: tylko 30 tur (nie 100), PO seed 4242, PRZED seedy 4242 (20 tur) i 777 (30 tur); 3 ziarna NIE_ZMIERZONO. Powód: świat+30 tur w swiftshader ~15-35 min na proces; 100 tur x 3 ziarna x 2 poza budżetem rundy. Determinizm AI (hash tras) i czas decyzji na 100 tur: NIE_ZMIERZONO.
2. Wskaźnik "rozproszone poza miastem i wodzem" PO nie spadł w oknie 30 tur (T26-30: 31% vs 12% PRZED, różne ziarna): jednostki wychodzą z miast do wodza, więc w tranzycie liczą się jako "far" (singlesOutside 58 vs 18). To przejściowe, ale NIE udowodnione na 100 turach.
3. Opóźnione pierwsze wodzowie (T23-26 poza Inkami): nie zbadano powodu (podejrzenie: złoto AI / wymóg Koszar dla jednostki wodza epoki >=2 w `bestGeneralUnitForOwner`). Decyzja produktowa: czy AI ma dostać priorytet złota na wodza (zmiana balansu, nie wprowadzona).
4. Brąz, wódz #2 "zbiera 5 tur i wyrusza": NIE zaimplementowane odejście po 5 turach. Rezerwa czeka w mieście; po śmierci wodza kampanii obecny cykl (`blockedGeneralIds`) wymaga ŚWIEŻEGO wodza, a rezerwa dołącza do niego w zbiórce. Opcje: A) tak zostaje; B) wódz #2 po 5 turach zbiórki startuje jako druga fala; C) po śmierci wodza #1 wódz #2 przejmuje kampanię (zmiana `reconcileAiGeneralWarCampaign`). Wymaga decyzji właściciela.
5. Wojna bez kampanii (cel nieosiągalny) obsługuje war-allin jak dotąd; nie zmieniano.

## RUNDY: 1/5
## NASTĘPNY KROK: Evaluator (powtórzyć pomiar 3 ziarna x 100 tur z `tools/ai-army-all-civs-live-measure.cjs`, ocenić BLOKADY 2-4), potem Obrona/Final Control.
## DEPLOY/PUSH: NIE WYKONANO
