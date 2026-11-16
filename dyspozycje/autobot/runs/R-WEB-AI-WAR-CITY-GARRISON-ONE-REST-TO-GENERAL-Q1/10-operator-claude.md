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
