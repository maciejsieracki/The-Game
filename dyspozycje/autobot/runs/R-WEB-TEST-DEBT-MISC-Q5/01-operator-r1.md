STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) - dlug testowy, bez zmian w grze
TEMAT: R-WEB-TEST-DEBT-MISC-Q5
GOAL: Splata dlugu testowego (bez zmiany zachowania gry): wszystkie wymienione bramki zielone, kazda czerwona asercja sklasyfikowana i klasa A przepisana.
BAZA: origin/main 45ea4b67a (detached), worktree wf_5940fd88-106-1.

ZMIANY/COMMIT: 7 plikow testow w gra/tools/ (allowlista OK), SHA: w commicie ponizej. Brak zmian w gra/src/**.
- gra/tools/recruitment-no-upkeep-gate-test.cjs (A)
- gra/tools/spichlerz-wzrost-test.cjs (A)
- gra/tools/spichlerz-widocznosc-test.cjs (A)
- gra/tools/growthmult-compound-test.cjs (A)
- gra/tools/end-turn-modal-sequencing-test.cjs (A)
- gra/tools/koniec-tury-f1-f4-runda3-test.cjs (A)
- gra/tools/barb-city-capture-cluster-test.cjs (A)
Logi: dyspozycje/autobot/runs/R-WEB-TEST-DEBT-MISC-Q5/logs/ (BASELINE-PRZED.txt, before*/after*.log), gate-po-*.txt (EXIT=).

TESTY (PRZED -> PO):
- end-turn-modal-sequencing: 35/5 FAIL -> 41/0 EXIT=0
- growthmult-compound: 17/7 -> 24/0 EXIT=0
- barb-city-capture-cluster: 93/3 -> 97/0 EXIT=0
- spichlerz-wzrost: 2/7 -> 14/0 EXIT=0
- spichlerz-widocznosc: 37/8 -> 45/0 EXIT=0
- recruitment-no-upkeep-gate: 22/14 -> 37/0 EXIT=0
- koniec-tury-f1-f4-runda3: 36/3 -> 39/0 EXIT=0
- siege-tower-breach-everywhere: 47/0 PRZED i PO (EXIT=0, bez zmian)
- cities-buildings-production-owner-contract: 53/0 PRZED i PO (EXIT=0)
- deposit-building-gate: 49/0 PRZED i PO (EXIT=0, zielony, bez zmian)
- koniec-tury-g1-g2-runda4: 41/0 PRZED i PO (EXIT=0)
- hud-topbar-grid-gross-net: 1190/0 PRZED i PO (EXIT=0)
- simple-food-rule-no-toggles: 36/0 PRZED i PO (EXIT=0)
Bramki uruchomione w pierwszym planie, po dwie bramki na raz nie byly potrzebne (sekwencyjnie). Tsc nie uruchamiano (tylko testy .cjs; npm ci --ignore-scripts wykonane).

KLASYFIKACJA (czerwone asercje, lacznie 47):
- A (przestarzala asercja, przepisana): wszystkie 47. Konkrety:
  - recruitment: zaszyte 50 Drewna / 10 utrzymania; units.json ma Surowiec (ilosc)=13, Utrzymanie (ilosc)=3. Liczby czytane z danych, kontrakt bramki (tylko koszt zakupu) bez zmian.
  - spichlerz-wzrost: prog wzrostu = 20 + ludnosc*wsp (economy.ts), nie 10+...; zapasy panstwa = poprzednie + netto - wojsko z capem (empire-food.ts), bez reguly 50%; Spichlerz podwaja cap (+1000).
  - spichlerz-widocznosc: zaszyte koszty magazynu przestarzale (np. spichlerz drewno 40 w danych, po FALA2 x2 = 80); stan magazynu liczony przez buildingStockCost (kanon FALA2 x mnoznik epoki).
  - growthmult: buildingUpkeep stosuje FALA2 x2 (R_STAWKI_FALA2_MULT, economy-upkeep.ts); asercje x2.
  - end-turn-modal: hook isOtherEndTurnModalOpen ma tez isTechDiscoveryNoticeOpen() (wieloliniowy); manualne showPreBattle maja wieloliniowe opcje; finally pipeline woła flushDeferredPreBattleSafely('endActiveHumanTurn') (siatka wyjatku, sam woła flushDeferredAutoPreBattle).
  - koniec-tury-f1-f4: finally finishIncomingBattleUi ma dalsze kroki po fladze; warunek heal ma stala hasStaleAiResume; triggerPlayerEndTurn -> advanceSeat(), heal przed bramka w advanceSeat (R-WEB-ENDTURN-BATTLE-DEADLOCK r6).
  - barb-city-capture-cluster: marker wystepuje 3x, okno szukalo pierwszego (komentarz); wywolanie canBarbarianWalkIntoEmptyCity ma 5 argumentow.
- B (prawdziwa usterka gry): 0. Nic nie zgloszono w BLOKADY; kod gry nie zmieniany.
- C (timeout/flake): 0. siege-tower nie przekroczyl timeoutu w tym uruchomieniu (EXIT=0, 47/0), scenariusza nie skracano.

MUTACJE (klasa A, wykazanie ze test nadal lapie regresje, kazdy mutant EXIT=1): recruitment (POOL_OK = COST-1), spichlerz-wzrost (prog 10+), spichlerz-widocznosc (stock {drewno:1}), growthmult (bez x2), end-turn (kolejnosc reveals/merge), koniec-tury-f1-f4 (kolejnosc heal/gate), barb (regex 1f). Mutanty tymczasowe, usuniete.

BLOKADY: brak.
Uwaga (zalozenie, nie fakt z produkcji): kanoniczne dane = aktualne data/units.json i data/buildings.json. Jesli wlasciciel uwaza wartosci 50/10 za wlasciwe, to jest zmiana danych, nie testu, i wymaga osobnej decyzji.
Uwaga: w kilku komunikatach asercji zostaly stare liczby w opisie (tekst), sama logika jest juz na danych.

RUNDY: 1/5
NASTEPNY KROK: Evaluator (weryfikacja klasyfikacji A i mutacji), potem Final Control. Brak integracji z tego kroku.
DEPLOY/PUSH: NIE WYKONANO
