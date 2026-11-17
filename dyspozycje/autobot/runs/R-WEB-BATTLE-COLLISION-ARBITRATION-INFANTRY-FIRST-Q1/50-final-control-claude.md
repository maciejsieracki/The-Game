# R-WEB-BATTLE-COLLISION-ARBITRATION-INFANTRY-FIRST-Q1 — Final Control r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-COLLISION-ARBITRATION-INFANTRY-FIRST-Q1
GOAL: przy kolizji o to samo pole w ruchu bitewnym piechota ma pierwszenstwo, lucznik ustepuje; ten sam typ => mniejsze ID; bez zamiany miejscami; konnica/rydwany/machiny bez zmian.
ZMIANY/COMMIT: kandydat 1d2f4e6a226832b29ae032fc6616cc213746b635 (rodzic 009ffe559 -> 7ac79dafb = FALA 747). integration_sha = 1d2f4e6a226832b29ae032fc6616cc213746b635. Uwaga: BAZA 4504924 z naglowka to czubek galezi dispatchow, nie baza kodu; 7ac79dafb jest przodkiem origin/main (bd647523b; 6 nowszych commitow to UI FALA 748, zero zmian w gra/src/battle); `git merge-tree --write-tree origin/main 1d2f4e6a2` czysty (tree 1218b78c6). Zakres kodu: gra/src/battle/autoBatchPhase.ts, gra/src/battle/battleScene.ts (10 linii), gra/tools/battle-*, runs/<ID>/** — zgodny z allowlista. git diff --check czysty.

## TESTY (ZMIERZONO samodzielnie na 1d2f4e6a2, surowe wyjscie)
- tsc --noEmit: exit 0.
- battle-collision-arbitration-test, czesc P: 14 ok / 0 FAIL (A-H: ten sam typ => mniejsze ID, swap odrzucony, determinizm x3).
- czesc L, AUTO, seed 2 (nowy, wczesniej niemierzony): 4 ok / 0 FAIL; infVsRng 0, rngVsInf 4, same 103, sameBad 0, swaps 0, pingpongAll 2, digest 2dbd6f36a39a7d9b0ac370090fa0c886.
- regresje: battle-full-move-strike 8/8 + mutacje 4/4; battle-pursuit-move-behavior 13/13 + mutacje 6/6; battle-pace-latch 5/5 (mutacja MELEE_LATCH wykryta); battle-line-advance-uniform PASS; battle-pace-equal-line-live 23 pass / 0 fail.
- Mutacja odwrocenia priorytetu (raport Obrony, pliki 33): live infVsRng 11 > 0 => czerwono; czesc P 3 naruszenia. Nie ponawiane przeze mnie (kod gry bez zmian od tego przebiegu).
- NIE ZMIERZONO: battle-doctrine-live-r4 i large-mixed-doctrine-matrix (r4 pada na bazie i kandydacie przez znany dlug sidecarow HTML #420; matrix nie uruchomiony).

## ZARZUTY
1. Ping-pong (c): ODDAL. Bitwa AUTO seed 1 bez arbitrazu daje identyczny digest i pingpongAll 3 => zjawisko pochodzi z planera bazy, nie z arbitrazu; arbitraz go nie zwieksza. Literalne "brak ping-ponga" niespelnione na bazie od zawsze — osobny temat planera (UWAGI).
2. (g) brak zrzutu: ODDAL. Dispatch dopuszcza "log/zrzut"; log zdarzen kontestu z realnego ticka AUTO (seed 1 przez Obrone, seed 2 przeze mnie) dostarczony. Brak zrzutu ekranu = NIE ZMIERZONO, nie blokuje.
3. Tryb reczny: DO DECYZJI CZLOWIEKA. W trybie recznym _beginAutoBatchPhase wraca natychmiast (_manualMode); rozkazy gracza wykonywane pojedynczo, brak symultanicznej kolizji; DODATEK 1 wymienia reczny rozkaz gracza jako wyjatek reguly pelnego ruchu. Narzucenie arbitrazu rozkazowi gracza to realna decyzja produktowa.
4. Obejscie: ODDAL. Decyzja wlasciciela: "zatrzymuje sie pole wczesniej ALBO omija"; wdrozono wariant "pole wczesniej" (cap), ustepujacy zachowuje ruch przed polem spornym. Luka opisana w UWAGACH.
5. Porownanie doctrine r4/matrix: ODDAL. Brak regresji w bramkach battle-* ani w testach FALA 745/747; r4 czerwony takze na bazie (dlug #420).
Zero NAPRAW => nie FAIL.

## BLOKADY
Brak.
RUNDY: FC 1 (po Operator r1 + Obrona r1)
NASTEPNY KROK: integracja orkiestratora (merge 1d2f4e6a2 do origin/main, tsc + bramki); REPIN Rust logiki bitewnej (resolveAutoBatchPhase + arbClass).

## UWAGI-DLA-ORKIESTRATORA
1. ABC: czy arbitraz ma obejmowac reczne rozkazy gracza.
2. Osobny temat planera: jostle/ping-pong linii styku istnieje na bazie.
3. Opcjonalnie: obejscie zamiast "pole wczesniej" gdy ustepujacy ma 0 krokow.
4. Docs (encyklopedia/poradnik) nie opisuja kolejnosci pierwszenstwa.
5. Dlug sidecarow doctrine-live (#420) blokuje porownanie r4.

DEPLOY/PUSH: NIE WYKONANO
