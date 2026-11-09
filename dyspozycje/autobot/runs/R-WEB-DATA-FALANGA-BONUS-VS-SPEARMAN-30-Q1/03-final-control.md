STATUS: FAIL
DOMAIN: GAME
TEMAT: R-WEB-DATA-FALANGA-BONUS-VS-SPEARMAN-30-Q1
GOAL: Falanga: Atak 7, Obrona 12, Przebicie 4, Bonus vs Spearman 30 (DODATEK 1 + 2) wraz ze wszystkimi pochodnymi.
ZMIANY/COMMIT: oceniany 4ed1b5a47 (potomek 43ae3a418 i 12fa64c97; diff do 12fa64c97 = 9 plikow, wszystkie w allowliscie). Ten plik: tylko raport FC.
TESTY (samodzielnie): falanga-bonus-vs-spearman-test 15/15 PASS. unit-power-test, unit-power-sort-test, combat-test: NIE_ZMIERZONO przez FC (brak node_modules/esbuild w worktree; unit-power* wymagaja bundlingu). Asercja unit-power-test zaktualizowana poprawnie (57.5+57.5+58.5). fieldPower 58.5 zgodne ze wzorem: (7+4+4+3.5)+(12+8+20)... wg unit-power.ts: atak 18.5, obrona 40. git diff --check czysty. merge-tree 4ed1b5a47 z origin/main (60a355ba6): bez konfliktow.
ROZSTRZYGNIECIE ZARZUTOW (r1 -> r2):
1 regresja unit-power-test: ODDAL (naprawione w r2).
2 inne testy: ODDAL (zmierzone w r2 tam gdzie sie dalo; crashe legion-vs-falanga-compare/true-stats i moc-ranking-rozjazd identyczne na bazie 12fa64c97 = dlug poza tematem; testy wymagajace playwright/three - NIE_ZMIERZONO, do bramki integracji).
3 ranking mocy: ODDAL (Falanga 27->24, Hastati 24->25, Evocati 25->26, Konnica luczn. asyryjska 26->27).
4 meleeAttack=7: ODDAL. DODATEK 2 wprost wymaga aktualizacji Atak i meleeAttack; brak stalego przesuniecia w danych. Zalozenie meleeAttack 7 / meleeDefence 12 / piercing 4 zatwierdzam jako zgodne z DODATKIEM 2 (nie jest decyzja produktowa).
5 pochodne: czesciowo ODDAL, jedno NAPRAW:
  - NAPRAW: gra/data/tech-cards-top5.json:1006 "np. Falanga (Obrona 10)" jest teraz falszywe (Obrona 12). DODATEK 1 wprost obejmuje karty cytujace statystyki Falangi. Plik generowany z dyspozycje/autobot/runs/R-WEB-TECH-CARDS-TOP5-IMPLEMENT-Q1/zrodlo/odkrycia-top5.csv - zmienic CSV (Obrona 10 -> 12), przegenerowac gen-tech-cards-top5, --check musi przejsc. Rozszerzenie allowlisty o ten CSV i tech-cards-top5.json jest czescia tego tematu (nie wymaga decyzji wlasciciela).
  - ODDAL: docs/WALKA-TW-v3.md (przyklad "staty TW v3 robocze", Falanga 5/10) i AUTO-WALKA-MOC-ALGORYTM.md (playtest historyczny) - dokumenty historyczne/robocze, nie katalog statystyk.
WERDYKT: 1 x NAPRAW -> FAIL, runda 3 do tego samego Operatora/ID, zakres: wylacznie punkt tech-cards-top5.
BLOKADY: brak decyzji produktowych. Dlug (poza tematem): REPIN Rust (Falanga Atak/Obrona/Przebicie/Bonus/fieldPower); legion-vs-falanga-compare, true-stats-legion-falanga, moc-ranking-rozjazd-test (Konnica).
RUNDY: 2/5 (FC po r2)
KOLEJNOSC INTEGRACJI: baza do r3 = 4ed1b5a47. Kod czysto mergeuje sie z origin/main 60a355ba6. origin/rust-port/parity-v2 (43f4064b0) nie zawiera tego tematu; rownolegla galaz Rust - integracja web przed REPIN-em Rust (REPIN dopiero po mergu do main).
SHA do integracji: brak (FAIL); po r3 i PASS - nowy SHA.
NASTEPNY KROK: Operator r3 (Haiku) -> Evaluator -> FC, to samo ID.
DEPLOY/PUSH: NIE WYKONANO
