# R-WEB-BATTLE-WINNING-ARMY-FULL-MOVE-RANGE-AFTER-CONTACT-Q1 — obrona, runda 2

STATUS: BLOCK (częściowo: merge i pomiar wykonane, poprawka ruchu NIE wdrożona; patrz NASTĘPNY KROK)
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-WINNING-ARMY-FULL-MOVE-RANGE-AFTER-CONTACT-Q1
GOAL: konnica zwycięskiej armii wykorzystuje >= 80% puli ruchu, gdy ma wolną drogę (AUTO/SKIP, tury 9–16).
BAZA: 275f047d3 (kandydat r1 z FC) + merge origin/main 3a6b0e405 -> commit 3cfda16ac (merge bez konfliktów; tsc EXIT 0 na tym SHA).

## Odpowiedź na zarzuty Evaluatora (FAIL r1, report_sha 5700631f8)

- Zarzut 1 (brak naprawy i testu zachowania): PRZYJMUJĘ jako prawdziwy. Naprawy ruchu nie wdrożono w r2 (patrz niżej, dlaczego). Test behawioralny nie powstał.
- Zarzut 2 (przyczyna uogólniona z jednego ziarna): PRZYJMUJĘ. Pomiar r2 objął seedy 1–2 (scen. mieszana, AUTO watch i SKIP). Seed 3 NIE_ZMIERZONO (brak czasu w tej rundzie).
- Zarzut 3 (kolizja z własnymi jednostkami nieobalona, brak surowych zdarzeń): CZĘŚCIOWO ODRZUCAM hipotezę kolizji w wykonaniu. Dowód: log `moves` z `_resolveAutoBatchMovement` (wszystkie 4 biegi, 2 tury 9–16 i całość): reason=occupied: 0; reason=impassable: 0; wszystkie wpisy to plan_end (625 / 588 / 562 / 562). Kolizja z jednostką w fazie wykonania NIE powoduje zatrzymania w tych biegach. Hipoteza z r1 (zajęte hexy w `_resolveAutoBatchMovement`) była błędna. Zatrzymania mają miejsce w FAZIE PLANOWANIA AUTO (na klonach), patrz tabela.
- Zarzut 4 (brak merge z origin/main): PRZYJĘTY, wykonany (3cfda16ac). `git merge-base --is-ancestor 3a6b0e405 HEAD` = 0 po merge.
- Zarzut 5 (test zatrzasku sprawdza capa, nie ruch): PRZYJMUJĘ. Test behawioralny NIE dodany (nie zmieniono ruchu, więc nie ma czego czerwienić).
- Zarzut 6 (brak pomiaru piechoty i scen. 2): PRZYJMUJĘ, NIE_ZMIERZONO. Scenariusz 2 (12 vs 12) nie ma konnicy, więc nie wnosi danych o konnicy; piechota nie zmierzona w r2.
- Zarzut 7 (wariant A bez prototypu): PRZYJMUJĘ. Wariant A nie wdrożony i nie rekomendowany w tej rundzie.
- Zarzut 8 (dług Rust): PRZYJMUJĘ. Dług REPIN zatrzasku (melee_latched) pozostaje z r1 (UWAGA-3 w 10-operator-claude.md); bez nowego długu w r2.

## Pomiar r2 (ZMIERZONO, Chromium, tury 9–16, konnica = Horseman atk14–atk17, scen. mieszana)

Źródło: `gra/tools/battle-pursuit-pace-measure.cjs` (PP_SCEN=1, PP_SEEDS=1,2, PP_MODES=skip,watch), surowe dane w runnerze; zestawienie w evidence/r2-zatrzymania-plan-auto-s1.json.
Kategorie wg `moveLeft` w chwili zatrzymania planu AUTO (wartość planowania, nie wykonania):

| bieg | pula konnicy r9–16 | zatrzymania: kontakt tylko z rozbitym wrogiem (n / MP) | zatrzymania: brak kroku, can=false (n / MP) | occupied |
|---|---|---|---|---|
| skip s1 | 217 | 16 / 96 | 14 / 84 | 0 |
| watch s1 | 196 | 10 / 59 | 17 / 98 | 0 |
| skip s2 | 203 | 12 / 71 | 16 / 81 | 0 |
| watch s2 | 203 | 12 / 71 | 16 / 81 | 0 |

(skip s2 i watch s2 dały identyczne liczby; nie sprawdzono, czy to determinizm AUTO=SKIP czy błąd runnera. NIE_ZMIERZONO różnicy.)

Interpretacja (ZMIERZONO liczbami, przyczyny z kodu):
1. Kontakt z rozbitym wrogiem: `_advanceStep` (battleScene.ts ~l.8449–8453, `_doMove` callback) zatrzymuje marsz, gdy `_canAttackFrom` jest prawdziwe, także gdy sąsiad jest rozbity (routed). Cios na rozbitego nie jest zadawany (attacks = 0), więc MP przepada. To jest 53% (skip s1) do 42% (watch s1) utraconego MP.
2. Brak kroku przy can=false: `_advanceStep` kończy, gdy `_firstStepAlongPathToAttack` i `_stepToward` nie znajdują kroku (silne `done()` bez logu, l.~8460–8470 i ~8475). Przyczyna dokładna NIE_ZMIERZONO: nie logowano, czy BFS nie znalazł ścieżki, czy greedy krok jest zajęty (sojusznik lub wróg), czy filtr `_compactAttackAllowsStep` odrzucił krok (dla konnicy `mounted` = zawsze true, więc raczej nie). Ten rodzaj zatrzymania to 47–58% utraconego MP.
3. Sufit tempa (`_paceCapFor` / `_lineAdvanceCap`): dla konnicy w tych turach paceCap = None i lineCap = None (zatrzask z r1 działa). Sufit NIE jest przyczyną w tym scenariuszu.

Wniosek: skarga „dziobią” ma w tym scenariuszu przyczynę w planowaniu AUTO (zatrzymanie przy rozbitym wrogu + brak kroku), a nie w kolizji wykonania. Poprawka wymaga zmiany zachowania planera (czy marsz ma iść dalej mimo kontaktu z rozbitym wrogiem) — to jest zgodne z decyzją ABC A właściciela (pościg z pełnym zasięgiem), ale zmienia kod ścigania, więc decyzja właściciela/Evaluatora przed wdrożeniem.

## Dlaczego naprawa nie wdrożona w r2

- Ustalenie przyczyny dopiero teraz (r1 mylnie wskazał kolizję).
- Brak pomiaru seed 3 i pełnej piechoty.
- Dysk: 5,3 GB wolne (`df -h /`), dispatch wymaga >= 6 GB; nie ryzykowano nowego worktree/instalacji.

## ZMIANY/COMMIT

- Merge origin/main w gałęzi `R-WEB-WIN-ARMY-obrona-r2` (3cfda16ac; bez konfliktów).
- Ten raport + `evidence/r2-zatrzymania-plan-auto-s1.json` (commit po merge).
- Kod gry: bez zmian w r2 poza merge.

## TESTY (surowe wyniki)

- `npx tsc --noEmit` (gra/): EXIT 0, 0 linii wyjścia.
- Pomiar: `node tools/battle-pursuit-pace-measure.cjs` z PP_SCEN=1 PP_SEEDS=1,2 PP_MODES=skip,watch: 4 biegi, timedOut=false, errors=[] (wyniki: atakujący wygrywa we wszystkich 4).
- Pozostałe bramki (logic 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat 6/6, latch-test 5/5, battle-skip-equals-auto-resolve 42/0) NIE_ZMIERZONO na bazie po merge w tej rundzie (czas i dysk). Ostatnie zielone wyniki pochodzą z r1 na 275f047d3 i nie zostały potwierdzone na 3cfda16ac.

## BLOKADY

- Brak pomiaru seed 3 i piechoty (NIE_ZMIERZONO).
- Decyzja właściciela/Evaluatora: czy kontakt z wyłącznie rozbitym wrogiem ma przerywać marsz zwycięzcy (zmiana kodu ścigania).
- Dysk 5,3 GB < 6 GB wymagane w dispatchu.

## UWAGI-DLA-ORKIESTRATORA

- UWAGA-A: hipoteza r1 o kolizji w `_resolveAutoBatchMovement` została obalona pomiarem (occupied=0). W dispatchu ETAP 2 pkt 2 należy zmienić na: planowanie AUTO (`_advanceStep`) przy kontakcie z rozbitym wrogiem i przy braku kroku.
- UWAGA-B: rozbieżność z Evaluatorem: jego udział „36–43% puli” nie odtworzyłem; mój wskaźnik to moveLeft w chwili zatrzymania planu (wartość planowania). NIE_ZMIERZONO udziału z kroków wykonanych, bo runner nie zapisuje kroków wykonania na poziomie ruchu.
- UWAGA-C: skip s2 = watch s2 (identyczne liczby) — do sprawdzenia czy to nie artefakt runnera.
- UWAGA-D: dług Rust bez zmian (UWAGA-3 z r1).

## RUNDY

2/5 (Operator, HAIKU 5.5). Ostatni werdykt: FAIL r1 (zarzuty 1–8 wyżej).

## NASTĘPNY KROK

Decyzja właściciela (czy kontakt z rozbitym wrogiem ma przerywać pościg) i zgoda Evaluatora na poprawkę planera; potem r3: (a) log powodu braku kroku w `_advanceStep`, (b) pomiar seed 3 i piechoty, (c) test behawioralny ruchu z mutacją.

DEPLOY/PUSH: NIE WYKONANO
