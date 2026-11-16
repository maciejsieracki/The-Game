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
