# R-WEB-AI-WAR-CITY-GARRISON-ONE-REST-TO-GENERAL-Q1 — raport Operatora, runda 1/5

STATUS: DECISION_REQUIRED
DOMAIN: GAME (AI wojna / rozmieszczenie wojsk)
TEMAT: R-WEB-AI-WAR-CITY-GARRISON-ONE-REST-TO-GENERAL-Q1
GOAL: w wojnie każde miasto AI, które ma na swoim heksie jednostkę bojową, zatrzymuje jedną jako garnizon; reszta idzie do marszu/zbiorki. Uzupełnienie pustych miast (przesunięcie najbliższej jednostki / rekrutacja najtańszej) — NIE wdrożone w tej rundzie (patrz BLOKADY).
BAZA: `cb077b588` (origin/main, FALA 778). Worktree detached HEAD = cb077b588 przed zmianą.

## ZMIANY / COMMIT
- `gra/src/game/ai.ts` — w `applyWarAllInCapitalToCommands` (przed `planned`): dla każdego własnego miasta wybierana jest JEDNA jednostka bojowa stojąca na heksie miasta (sort po id; bez wodza `isGeneral`, bez jednostek już w `keep` = atakujących/wchodzących na wrogie miasto). Zostaje wyjęta z `planned` i z jej wcześniejszych rozkazów `move` są usuwane. Reszta bez zmian. Funkcja działa na obu wywołaniach (główna ścieżka wojny i kampania wodza); flaga `WAR_ALLIN_CAPITAL_ENABLED` bez zmian.
- `gra/tools/ai-war-city-garrison-test.cjs` — NOWY test regresyjny (6 asercji): T1 jedyny obrońca miasta B nie dostaje rozkazu ruchu; T2 w mieście C przynajmniej jedna jednostka zostaje; T4 wódz nie jest garnizonem; T5 determinizm na świeżych bundle'ach; mutant (bez filtra garnizonów) musi być czerwony. Wynik na drzewie roboczym: 5 PASS / 0 FAIL (mutant czerwony). Uwaga: T2 jest słaba (weryfikuje tylko, że nie wszystkie jednostki z miasta wychodzą).
- Commit: patrz sekcja DEPLOY/PUSH (SHA w polu `sha` zwrotu orkiestratora).
- NIE zmieniano `main.ts`, `gra-robocza/`, `rust-port/`, `WERSJE.md`, manifestu, danych balansu, `ai-params.json`.

## TESTY
### Faza 1 — audyt (ZMIERZONO tylko na scenariuszu jednostkowym, NIE na żywym biegu)
Scenariusz 1 tura, wojna z graczem 2, miasta A (pusta), B (1 jednostka + wódz), C (2 jednostki), wolna jednostka 3 pola od A. Wykonane na `cb077b588` (baza) przez `decideAITurn`:
- jedyny obrońca w mieście B DOSTAJE rozkaz ruchu (test T1 czerwony na bazie);
- wolna jednostka przy pustym mieście A oddala się od A (dystans 3 → 5) — brak jakiegokolwiek uzupełnienia.
- NIE ZMIERZONO: tabela % miast AI bez jednostki w środku dla 10/30/60/100 tur, ≥3 ziarna, wojna i pokój osobno; liczba miast zdobytych w 30 turach wojny. Nie uruchomiono żywego biegu (100 tur × 3 ziarna) — poza zakresem tej rundy (czas, brak harnessu do % niepilnowanych miast).

### Faza 2 — wariant z uzupełnianiem pustych miast (ODRZUCONY w tej rundzie)
Próba: po garnizonach dodany przydział najbliższej wolnej jednostki do pustego miasta. Wynik (`ai-war-defend-home-test`): 3 FAIL — "A traci miasto mimo garnizonu (utracone=0 → >0)", "najezdzcy zwalczeni po 15 turach (zywych=3)", "stan po 8 turach identyczny OFF vs ON" — czyli przesunięta jednostka odchodzi z obrony domu i miasto przechodzi. Ten wariant usunięto z kodu.

### Wynik bramek (ZMIERZONO, liczby z surowego wyjścia)
Wersja końcowa (garnizony bez uzupełniania), drzewo robocze:
- `tsc --noEmit`: exit 0
- ai-war-city-garrison-test: 5 PASS / 0 FAIL
- ai-army-all-civs-general-muster-test: 26 PASS / 0 FAIL (baza: 26/0)
- ai-war-defend-home-test: 30 PASS / 0 FAIL (baza: 30/0)
- ai-home-defense-vs-barbarians-test: 46 / 0 (baza: zielony)
- ai-general-war-campaign-test: 51 / 0
- ai-move-full-range-test: 20 / 0
- ai-war-gate-test: 24 / 0
- determinism-same-seed-test: PASS
- logic-test: 213/213; combat-test: passed; tech-tree-test: 20/0; research-test: 33/0; unit-replace-test: OK; load-game-regression-test: 34/0
- ai-army-replacement-concentration-test: 33 PASS / **2 FAIL** (baza: 34 / 1 FAIL — jedna asercja `atrybucja` jest już czerwona na bazie). NOWE czerwone: `S3: jedyna jednostka w miescie zbiorki czeka najwyzej 6 tur i rusza`.
- ai-army-scattered-merge-test: 31 PASS / **2 FAIL** (baza: 33 / 0). NOWE czerwone: `S1: cala chmura 16 jednostek w jednym stosie`, `S3: stos 16 maszeruje jako JEDNA armia przez 10 tur`.

Interpretacja: wszystkie nowe czerwone asercje wynikają z tego, że w mieście zostaje jedna jednostka (stos 16 w mieście ⇒ 15 maszeruje; pojedynczy oddział w mieście zbiórki nie rusza). To jest zamierzona zmiana reguły, ale łamie oczekiwania istniejących testów — NIE jest to regresja jakości, lecz zmiana zachowania wymagająca decyzji (patrz BLOKADY).

## BLOKADY
1. **Decyzja właściciela/orkiestratora (DECISION_REQUIRED):** czy zaakceptować aktualizację 3 asercji istniejących testów (`ai-army-scattered-merge-test` S1/S3, `ai-army-replacement-concentration-test` S3) do nowego oczekiwania „w mieście zostaje garnizon", czy zawęzić regułę (np. nie garnizonować stosu zbiórki/armii zastępczej). Propozycja Operatora: zaakceptować zmianę asercji (test debt) — garnizon 1 z stosu 16 to zamierzony efekt.
2. **Uzupełnianie pustych miast (GOAL, punkt „przesunięcie / rekrutacja") NIE wdrożone:** przesunięcie najbliższej jednostki psuje `ai-war-defend-home-test` (utrata miasta). Wymaga projektu: np. uzupełnianie tylko z nadwyżki ponad obrońców domu, albo rekrutacja najtańszej jednostki (DECISION_REQUIRED: nowy parametr kosztu/priorytetu w ramach istniejącego budżetu AI — zgodnie z dodatkiem orkiestratora).
3. **Faza 1 (tabela % niepilnowanych miast, 100 tur × 3 ziarna, przed/po):** NIE ZMIERZONO.
4. **Test T2** (garnizon w mieście z 2 jednostkami) jest słaby — do wzmocnienia przy decyzji z pkt 1.
5. Dług Rust: zmiana dotyczy `applyWarAllInCapitalToCommands` (logika wojny AI) — do REPIN w `rust-port` po wdrożeniu (nie ruszano).

## RUNDY
1/5 (Operator, Haiku 5.5). Wariant z uzupełnianiem odrzucony po pomiarze (defend-home). Dalsze rundy wymagają decyzji z BLOKAD 1–2.

## NASTĘPNY KROK
Orkiestrator: (a) decyzja o asercjach S1/S3/replacement-S3 (akceptacja zmiany lub zawężenie reguły); (b) decyzja o sposobie uzupełniania pustych miast (nadwyżka vs rekrutacja, DECISION_REQUIRED z propozycją). Dopiero po tym runda 2 (uzupełnianie + tabela Fazy 1 z żywego biegu).

## UWAGI-DLA-ORKIESTRATORA
- Test `ai-army-replacement-concentration-test` ma już na bazie 1 czerwoną asercję (`atrybucja`) — dług przed tym tematem.
- Zgłoszenie z dodatku ("zbyt łatwo zdobywane miasta") potwierdza się w scenariuszu jednostkowym: na bazie miasto bez jednostki nie jest uzupełniane wcale.

## DEPLOY/PUSH
NIE WYKONANO (brak integracji, brak push na main, brak deployu — zgodnie z zakazami dispatchu).


---

# RUNDA 2/5 — raport Operatora (Haiku 5.5), baza 3524f5f38 (kandydat r1)

STATUS: BLOCK
DOMAIN: GAME (AI wojna / rozmieszczenie wojsk)
TEMAT: R-WEB-AI-WAR-CITY-GARRISON-ONE-REST-TO-GENERAL-Q1
GOAL: w wojnie AI pilnuje KAZDEGO miasta co najmniej jedna jednostka bojowa; puste miasta uzupelniane (nadwyzka, a gdy brak — rekrutacja najtanszej w istniejacym budzecie); reszta do generala.
ZMIANY/COMMIT: BRAK zmian kodu gry w tej rundzie. Kod gry wrocil do stanu 3524f5f38 (`git checkout -- gra/src/game/ai.ts`). Jedyny commit: ten raport (`10-operator-claude.md`, dopisana sekcja rundy 2). Allowlista nienaruszona; main.ts nie tkniety.

## Co sprawdzono w rundzie 2
1. Wariant (b) — przesuniecie NADWYZKI do PUSTEGO miasta w `applyWarAllInCapitalToCommands` (ai.ts, po petli garnizonow, przed kolejka zbiorki). Reguly: miasto wojenne bez jednostki bojowej (wodz nie liczy sie); kandydat = planned, nie wodz, nie obronca domu, stoi na heksie z >= 2 jednostkami bojowymi (zostaje co najmniej jedna); najblizszy wg hexDistance; jeden krok `firstStep` na ture.
   Wynik (ZMIERZONO, Node, `node tools/<test>.cjs`, po `npm ci` w gra/, tsc exit 0):
   - ai-war-defend-home-test: 22 passed / 8 failed (baza: 30/0). Bledy takze w asercjach PRZED (np. `PRZED: A traci miasto mimo garnizonu`, `PRZED: wymiana miast zachodzi (exchanges=0)`) — scenariusz testu zaklada puste miasto B, ktore zmiana wypelnia.
   - ai-army-scattered-merge-test: 26/7 (baza 33/0): S3 (stos 16 traci spojnosc), S4 (marsz na cel).
   - ai-army-replacement-concentration-test: 33/2 (baza 34/1, jedyny czerwony `atrybucja` z bazy): nowe FAIL S3 (zastoj pary) i regresja „skupisko 4 rusza najpozniej w turze 2”.
   - ai-army-all-civs-general-muster-test: 25/1 (baza 26/0): P6 rezerwa rusza jako druga fala.
   - ai-war-city-garrison-test (6/0), ai-war-gate-test (24/0), ai-general-war-campaign-test (51/0), ai-home-defense-civilian-filter-test (8/0): bez zmian.
   WNIOSEK: wariant (b) w tej postaci lamie zywe reguly obrony domu i zbiorki (regresja 30/0 -> 22/8 jest niedopuszczalna wg bramek tematu). Odrzucony, kod cofniety.
2. Wariant (a) — rekrutacja najtanszej jednostki jako garnizonu z priorytetem w istniejacym budzecie: NIE ZROBIONE. Wymaga zmian w sciezce kolejki/zakupu AI w `gra/src/main.ts` (blok `item.kind === 'jednostka'` ~ linia 45840, `wantsPurchase` = `aiUpkeepRunwayAllows` + `shouldAIPurchaseUnit` + `aiPurchaseReserveInputs`; wybor kandydata `buildCandidateIds`/`pickExecutableCandidate` ~ 45700-45800). Priorytet „pustego miasta” wymaga wstrzyknac najtanszy wojskowy kandydat na poczatek listy i pominac rezerwe tylko dla garnizonu — to nowa regula ekonomiczna, nie tylko przeniesienie. Nie wdrazam bez decyzji (DECISION_REQUIRED nizej).
3. Faza 1 (odsetek miast AI bez jednostki w turach 10/30/60/100, >= 3 ziarna, wojna/pokoj; zdobyte miasta w 30 turach; czas tury PRZED/PO): NIE ZMIERZONO. Zywy bieg wymaga Chromium (`ai-economy-measure-run.cjs`, max 1 naraz, bundle vite) — nie uruchamiany w tej rundzie. Nie napisano metryki w Node (brak haku `civTest` dla „miasto bez jednostki” w tej rundzie).

## TESTY (liczby z surowego wyjscia, baza 3524f5f38 po cofnieciu eksperymentu)
- `node node_modules/typescript/bin/tsc --noEmit`: exit 0 (z kodem eksperymentu; kod cofniety, bez ponownego tsc).
- ai-war-city-garrison-test: 6 PASS / 0 FAIL.
- ai-war-defend-home-test: 30 passed / 0 failed.
- ai-army-scattered-merge-test: 33 passed / 0 failed.
- ai-army-replacement-concentration-test: 34 passed / 1 failed (`atrybucja`, czerwony takze na bazie cb077b588 — dlug bazowy).
- ai-army-all-civs-general-muster-test: 26 PASS / 0 FAIL.
- ai-war-gate-test: 24 passed / 0 failed.
- ai-general-war-campaign-test: 51 passed / 0 failed.
- ai-home-defense-civilian-filter-test: 8 passed / 0 failed.
- NIE ZMIERZONO w tej rundzie: bramki referencyjne (logic/tech-tree/research/unit-replace/combat), determinism, load-game-regression, pozostale `ai-*` (move-full-range, move-range-collision, army-composition-per-civ, defend-recapture-attack-priority).

## BLOKADY
1. DECYZJA (ABC, rekomendacja): czy zezwolic na zmiane w `main.ts` (rekrutacja najtanszego garnizonu w pustym miescie wojennym z priorytetem w istniejacym budzecie/rezerwie). Bez tego wariant (a) nie istnieje.
2. TECHNICZNA: wariant (b) (nadwyzka) lamie `ai-war-defend-home-test` — do rozwiazania wymagalby filtra „nadwyzka po wykluczeniu obrony domu i zbiorki” (ktory trzeba zaprojektowac i zmierzyc) — poza budzetem tej rundy.
3. POMIAR: Faza 1 nie wykonana (wymaga Chromium albo nowego haku Node).
4. Zmiana asercji r1 (scattered-merge S1/S3, replacement S3, muster) nadal czeka na decyzje wlasciciela (zamierzona regula „1 jednostka zostaje w miescie”).

## RUNDY
2/5 zuzyta (Operator Haiku 5.5). Status BLOCK: brak dostarczonej zmiany kodu; decyzja 1 i pomiar 3 wymagaja orkiestratora.

## NASTEPNY KROK
Orkiestrator: (a) decyzja BLOKADY 1 (main.ts) — jesli TAK, osobny temat rundy z pelna regula priorytetu i testem na zywo/symulacji; (b) wariant nadwyzki wymaga nowego projektu filtra (kandydat: nadwyzka = planned poza jednostkami z aktywnym rozkazem obrony/zbiorki) — jako osobna runda Operatora z wlasnym pomiarem; (c) Faza 1 jako osobny temat pomiarowy (Chromium, 3 ziarna x 100 tur).

## UWAGI-DLA-ORKIESTRATORA
- `git show origin/main:dyspozycje/...` daje „path does not exist”: dispatch zyje tylko na galezi `claude/sprawdzenie-funkcjonalnosci-ek4ra0`.
- Prosba wlasciciela „zmeczenie wojna 100% => pokoj, przegrywajacy z miastami” wystepowala w kontekscie tego workflow. NIE jest to zakres tego tematu; nie wykonywana w tej rundzie.
- Kandydat r1 (3524f5f38) nie jest potomkiem origin/main 98abccdfc (baza cb077b588 zostala wyprzedzona). Przy integracji: merge-tree na aktualny main.

DEPLOY/PUSH: NIE WYKONANO


---

# RUNDA 3/5 — raport Operatora (SONNET 5.5; uzasadnienie: 2 nieudane rundy Haiku tego tematu, haikuFailures=2)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (AI wojna / garnizony miast)
TEMAT: R-WEB-AI-WAR-CITY-GARRISON-ONE-REST-TO-GENERAL-Q1
GOAL: AI pilnuje KAZDEGO miasta >= 1 jednostka wojskowa: rdzen = rekrutacja najtanszej jednostki do pustego miasta w wojnie/zagrozeniu z priorytetem; garnizon 1 jednostka zostaje (r1); reszta do marszu.
BAZA: `235ad7b4d` (kod gry = r1 `3524f5f38`), merge `origin/main` (fadf21af9) -> `cdb2bfdd8` (bez konfliktow; `git merge-base --is-ancestor origin/main HEAD` = tak, `... 235ad7b4d HEAD` = tak).

## ZMIANY / COMMIT (SHA w polu `sha` zwrotu)
- `gra/src/game/ai.ts` (TYLKO ai.ts; main.ts NIE ruszany — pelna decyzja zapadla po stronie ai.ts, egzekucja przez ISTNIEJACA sciezke `cmd.type === 'build'` -> `pickExecutableCandidate` -> bramki `aiNnsHoldOwners`, `aiUpkeepRunwayAllows`, `shouldAIPurchaseUnit` (rezerwa), manpower w main.ts ~45914 BEZ omijania):
  - nowa funkcja eksportowana `emptyCityGarrisonRecruitIds(myCities, myUnits, enemyUnitsAll, opts, data)` + stala `EMPTY_CITY_GARRISON_UNIT_ID = 'Wojownik'` (najtansza jednostka bojowa: units.json `Pieniadz (koszt)` = 5, epoka Kamien, baza zawsze dostepna; ten sam wybor co istniejacy garnizon pierwszej jednostki w chooseCityProduction). Miasto kwalifikuje sie gdy: (AI w wojnie z cywilizacja: `opts.atWarWithCiv` LUB `opts.warAllIn.targets.length > 0`) LUB (wrog `aiCanEngageOwner` w zasiegu `ekspansja_zagroz_zasieg` = domyslnie `AI_THREAT_RANGE_DEFAULT` od miasta; N = ta wartosc) ORAZ w miescie nie ma zadnej jednostki wojskowej (cywile, zwiadowcy, wodz, zaokretowani nie licza sie). Maks. 1 na miasto na ture. W pokoju bez zagrozenia: zero zmian (ekonomia pokoju nietknieta, zgodnie z DODATKIEM 1).
  - `decideAITurn` Step 2: dla kwalifikujacych sie miast emitowane jest polecenie `build` z `buildingId='Wojownik'` i `fallbackIds` = dotychczasowy wybor produkcji (+jego fallbacki); gdy dotychczasowa produkcja to jednostka bojowa/`Wojownik`, garnizon ja ZASTEPUJE (jeden zakup wojska na miasto); gdy to budynek — dopisuje sie obok. Polecenia garnizonow sa wstawiane PRZED pierwszym innym `build` (priorytet przed reszta zakupow wojska tej tury, w ramach istniejacego budzetu).
  - Brak nowego budzetu, kosztow, limitow, parametrow (DECISION_REQUIRED nie jest potrzebne).
- Wariant (b) przesuniecia nadwyzki: NIE wdrazany. Powod: rekrutacja (a) doprowadza odsetek pustych miast w wojnie do 0% w pomiarze, wiec przesuwanie jednostek (3 nieudane proby w r2: regresje defend-home 22/8 itd.) jest zbedne i niebezpieczne; zakazane powtarzanie prob z r2 zachowane.
- `gra/tools/ai-war-city-garrison-test.cjs` — rozszerzony: 18 PASS (przyrost o G1-G4, G6-G9 + 2 asercje mutacyjne MUTACJA G/G2; wlasny mutant `mutrec` wylaczajacy rekrutacje: polecenia sie roznia).
- `gra/tools/ai-war-city-garrison-measure.cjs` — NOWE narzedzie pomiarowe Fazy 1 (Node; PRAWDZIWY decideAITurn + prawdziwe units/buildings/ai-params; wykonanie `build` = MODEL zakupu przez `pickExecutableCandidate`+`shouldAIPurchaseUnit`).
- `gra/tools/ai-war-defend-home-sim.cjs` — tylko dwa opcjonalne haki (`o.data`, `o.onOptions`, `o.onCommands`); zachowanie dotychczasowych testow bez zmian (30/0).
- Raport: ten plik.

## TESTY (liczby z surowego wyjscia, drzewo po merge `cdb2bfdd8` + zmiany)
- `tsc --noEmit`: exit 0.
- ai-war-city-garrison-test: 18 PASS / 0 FAIL (nowe G1-G9 + mutant czerwony).
- ai-war-defend-home-test: 30 passed / 0 failed (baza 30/0).
- ai-army-scattered-merge-test: 33 passed / 0 failed.
- ai-army-replacement-concentration-test: 34 passed / 1 failed — jedyna czerwona = `atrybucja` (DLUG BAZOWY, nietkniety).
- ai-army-all-civs-general-muster-test: 26 PASS / 0 FAIL.
- ai-move-full-range-test: 20/0 (D3 czas decyzji PO 2.51 ms/ruch = PRZED); ai-war-gate-test: 24/0; ai-general-war-campaign-test: 51/0; ai-home-defense-vs-barbarians-test: 46/0.
- ai-prod-fallback-test 17/0; ai-prod-gate-difficulty-test 8/0; ai-production-priority-test 9/0; ai-jednostki-tylko-zakup-test 45/0; ai-produkcja-pokrycie-katalogu-test 6/0; ai-army-composition-per-civ-test 341/0.
- determinism-same-seed-test: PASS; logic-test: 213/213; combat-test: 6/6; tech-tree-test: 20/0; research-test: 33/0; unit-replace-test: 21/21; load-game-regression-test: 34 PASS / 0 FAIL.

## FAZA 1 — POMIAR (Node, ZMIERZONO; `node tools/ai-war-city-garrison-measure.cjs --seeds 3 --turns 100`)
Swiat: 2 cywilizacje AI x 8 miast rozrzuconych, start = 3 jednostki bojowe w stolicy, reszta miast pusta (odtwarza obserwacje wlasciciela); 3 ziarna (1,2,3); karencja: miasta zdobyte < N = 5 tur wczesniej pomijane w odsetku. PRZED = ta sama zrodlowa wersja z wylaczona rekrutacja garnizonu (mutacja jednej linii), PO = kod dostarczony.
| tryb | wersja | % miast AI bez jednostki wojskowej t10 / t30 / t60 / t100 | zdobyte miasta w 30 turach (sr. na ziarno) | czas decideAITurn (sr. ms/ture, 100 tur) |
|---|---|---|---|---|
| WOJNA | PRZED | 62,5 / 58,3 / 55,1 / 39,3 | 0,33 | 96,28 |
| WOJNA | PO | 0 / 0 / 0 / 0 | 0,33 | 73,33 |
| POKOJ | PRZED | 87,5 / 87,5 / 87,5 / 87,5 | 0 | 4,70 |
| POKOJ | PO | 87,5 / 87,5 / 87,5 / 87,5 | 0 | 4,74 |
Wniosek: w wojnie odsetek niepilnowanych miast spada z 39-63% do 0%; czas tury bez regresji; w pokoju bez zagrozenia 87,5% miast nadal puste (SWIADOMIE nie ruszane — DODATEK 1: nie wymuszac garnizonow w pokoju kosztem ekonomii bez decyzji; patrz UWAGI). Zdobycia w 30 turach tego modelu sa nieliczne (0,33/ziarno, bez zmiany) — model walki jest uproszczony, wiec kryterium „mniej zdobytych miast” NIE jest tym pomiarem rozstrzygniete.
NIE ZMIERZONO: zywa gra (Chromium + main.ts): bramki manpower/surowcow/epoki/rezerwy realnego main.ts nie sa w modelu (zakup modelowy: skarbiec 3/miasto/ture, utrzymanie 1/jednostke, rezerwa Normalny z ai-params); czy w prawdziwej turze Wojownik przechodzi `isBuildAllowed` w kazdej epoce/cywilizacji (np. cywilizacje bez Wojownika) — NIE ZMIERZONO; fallbackIds (dotychczasowy wybor) zawieraja alternatywy.

## BLOKADY
Brak blokujacych. Zalozenia: (1) cel garnizonu = `Wojownik` (id stale w ai.ts, jak istniejaca gałąź garnizonu); (2) „wojna” = `atWarWithCiv` lub cele warAllIn; „zagrozenie” = wrog w `ekspansja_zagroz_zasieg` (nie tylko barbarzyncy); (3) wodz w mieście nie liczy sie jako garnizon.

## RUNDY
3/5 (Operator Sonnet 5.5, po 2 nieudanych rundach Haiku). Rdzen dostarczony; status nie BLOCK.

## NASTEPNY KROK
Evaluator -> Obrona -> Final Control. Zalecane weryfikacje zywe (Chromium) po FC: puste miasto AI w wojnie dostaje zakup Wojownika przez realny main.ts (log `[AI n] Zakup jednostki za Skarbiec: Wojownik`).

## LISTA DEPLOYU (nowe narzedzia/testy)
`gra/tools/ai-war-city-garrison-test.cjs` (test), `gra/tools/ai-war-city-garrison-measure.cjs` (narzedzie pomiarowe, nie test bramkowy); zmieniony `gra/tools/ai-war-defend-home-sim.cjs` (haki opcjonalne).

## DLUG RUST — REPIN (pelna lista)
- `emptyCityGarrisonRecruitIds` (nowa; warunki: atWarWithCiv || warAllIn.targets>0 || wrog aiCanEngageOwner w ekspansja_zagroz_zasieg; brak jednostki wojskowej poza cywilami/zwiadowcami/wodzem/zaokretowanymi) — fixtury: wojna+puste miasto, miasto z samym zwiadowca+wodzem, pokoj bez zagrozenia, pokoj + barbarzynca w zasiegu.
- `decideAITurn` Step 2: wstawienie polecen garnizonu PRZED pierwszym `build`, zastapienie produkcji-jednostki, `fallbackIds` = [dotychczasowy wybor, jego fallbacki]; reguła priorytetu = kolejnosc polecen (egzekucja main.ts w kolejnosci).
- `applyWarAllInCapitalToCommands` (garnizon 1 jednostka z r1, bez zmian w r3) i sciezka zakupu `item.kind === 'jednostka'` w main.ts (bez zmian w r3; reuzywa `shouldAIPurchaseUnit`, `aiUpkeepRunwayAllows`, `aiNnsHoldOwners`, manpower).
- Fixtury: scenariusz G1-G9 z `ai-war-city-garrison-test.cjs`.

## UWAGI-DLA-ORKIESTRATORA
- W pokoju 87,5% miast AI pozostaje bez jednostki wojskowej (pomiar). Jesli wlasciciel chce tez pokoj: ABC (koszt utrzymania garnizonu 1 jednostka/miasto vs zdobywanie przez nagly atak); rekomendacja: wlaczyc dla miast graniczacych z obca cywilizacja (osobny temat).
- `ai-army-replacement-concentration` `atrybucja` — dlug bazowy, bez zmian.
- Zmiana asercji S1/S3 (scattered-merge) i S3 (replacement-concentration) z r1 nie byla wymagana na tym drzewie (33/0, 34/1 tylko atrybucja).

DEPLOY/PUSH: NIE WYKONANO
