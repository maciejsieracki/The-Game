STATUS: BLOCK
DOMAIN: GAME (diagnoza; kod gry NIE zmieniany)
TEMAT: R-WEB-ENDTURN-T57-DIAGNOSIS-Q1
GOAL: odtworzyć timeout endTurn (tura ~57) na harnessie z AI z miastami (>=5 ziaren x 100-150 tur), ustalić turę, stan, przyczynę; albo wpisać "nieodtworzone w N przebiegach".
BAZA: f6b09c76b (origin/main, FALA 754, MD5 70828a6b).

ZMIERZONO (odczyt kodu i evidence, bez uruchamiania przebiegów):
- Symptom r3 harnessu (refs/keep/R-WEB-AI-ECON-HARNESS-r3-fc, evidence/r3-run-seed4242.txt): seed 4242 zatrzymał się w t51 z reason=cannot-end, battle={preBattleOpen:false, pendingAuto:true, sceneOpen:false, summaryOpen:false, resolving:false}, pending=0. Po wznowieniu (od t50) stuckQueueHeals=0, battlesAuto=0. Evidence nie zawiera tury 57.
- Zapis kolejki: gra/src/ui/preBattle.ts:257-261. Automatyczne żądanie bitwy (opts.auto===true) trafia do deferredAutoRequests, gdy isPreBattleOpen() LUB pbCfg.isOtherEndTurnModalOpen() (w gra/src/main.ts:33403 = isDiplomacyAudienceOpen()). Odłożenie następuje więc przy otwartej audiencji dyplomatycznej.
- Odczyt kolejki: preBattle.ts:350-351 (hasPendingAutoPreBattle = length>0); preBattle.ts:418-424 (flushDeferredAutoPreBattle jest no-op, gdy isPreBattleOpen() lub isOtherEndTurnModalOpen()). Flush wywoływany z main.ts w kilku miejscach (m.in. 7333, 15651, 15732, 16033, 16041, 16107, 16111, 26764).
- Blokada końca tury: main.ts:40678, 40728 (oraz 46533) odrzucają koniec tury przy hasPendingAutoPreBattle().
- Heal: main.ts:40788-40816 healStuckDeferredPreBattleQueueOnEndTurnAttempt(): pokazuje odłożoną bitwę (flush) przy interaktywnej próbie końca tury; przy wieku >8000 ms czyści kolejkę. Wywołania: main.ts:46395 (wewnątrz endActiveHumanTurn, PRZED bramką canPlayerInitiateEndTurn) i main.ts:46635 (przed bramką w obsłudze kliknięcia).
- Wniosek kodowy: stan z r3 (kolejka niepusta, brak otwartego okna, audiencja zamknięta) jest osiągalny, gdy audiencja zamknęła się bez wywołania flushDeferredAutoPreBattle. Kliknięcie "Zakończ turę" uruchamia heal i pokazuje odłożoną bitwę, więc u gracza-człowieka wygląda to na opóźnienie/blokadę do pierwszej próby zakończenia tury, a nie na trwały deadlock (o ile kliknięcie dociera do obsługi). Czy przycisk jest wtedy klikalny i co widzi gracz (hint endTurnBlocked): NIE ZMIERZONO.
- Nie ustalono, czy t57 z oryginalnego przebiegu to ten sam mechanizm: brak evidence z tury 57; to hipoteza oparta na r3 (t51/t89).

NIE ZMIERZONO (uczciwie):
- Żaden przebieg live nie został wykonany: brak gra/node_modules w worktree, a 100 tur z 41 AI to ok. 40-50 min na ziarno (r3: 2118 s dla 100 tur), więc 5 ziaren nie mieści się w jednej rundzie operatora (limit 590 s na polecenie Bash, zakaz run_in_background). Nie odtworzono t57 ani t51.
- Nie zmierzono tabeli (ziarno | tura końcowa | czas tury max/mediana | bramka NNS).
- Nie uruchomiono bramek referencyjnych (logic-test, tech-tree-test, research-test, unit-replace-test, combat-test) ani tsc; brak zmian w kodzie, więc nie było powodu.

BLOKADY:
- Brak reprodukcji live (czas i zasoby w jednej rundzie operatora).
- Dług harnessu: runner nie zlicza stuckQueueHeals w przebiegu wznowionym (r3: 0), więc z evidence nie da się rozstrzygnąć, czy heal działał.

RUNDY: 1/5 (bez FAIL; wynik = diagnoza kodowa, bez live).

NASTĘPNY KROK (propozycja dla orkiestratora, bez wykonania):
1. Osobny temat R-WEB-ENDTURN-QUEUE-STALL-REPRO-Q1: uruchomić runner (gra/tools/ai-economy-measure-run.cjs) na ziarnach 4242 i 777 z zapisem battleState() oraz isDiplomacyAudienceOpen() w każdej turze od t45. Cel: ustalić, czy stan pojawia się po zamknięciu audiencji bez flusha.
2. Jeśli potwierdzone: kandydat R-WEB-* - po zamknięciu audiencji dyplomatycznej wywołać flushDeferredAutoPreBattle() (preBattle.ts:418). Decyzja Operatora po reprodukcji, nie przed.
3. Osobno: zapisywać stuckQueueHeals także w przebiegu wznowionym.
4. Pytanie ABC do właściciela: czy stan "kolejka bitew zalega, brak okna" ma być widoczny dla gracza jako komunikat (obecnie hintEndTurnBlocked). To decyzja produktowa.

ZMIANY/COMMIT: tylko ten plik raportu; brak zmian w gra/.
TESTY: NIE WYKONANO (patrz NIE ZMIERZONO).
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Dispatch pod podaną ścieżką nie istnieje w origin/main (git show: brak pliku 00-dispatch.md); użyto dodatku z origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0.
