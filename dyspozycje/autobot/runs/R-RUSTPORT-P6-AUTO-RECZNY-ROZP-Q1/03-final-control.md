STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-AUTO-RECZNY-ROZP-Q1
GOAL: Rozpoznanie (read-only) trybu recznego sterownika petli oblezenia.
ZMIANY/COMMIT: kandydat e91fae2a9 (baza f7baa3848, ancestry OK). Diff vs baza = 3 pliki w allowliscie (01-rozpoznanie.md, 02-evaluator.md, 02a-obrona.md). Zero kodu, zero gra/.
TESTY: bramki cargo NIE URUCHAMIANE (rozpoznanie bez zmian kodu, zgodnie z dispatchem). Wyrywkowo zweryfikowane git show: pin 3572, 3703, wolajacy _performPlayerOrder 18082/18122/18608; Rust siege_tactics_loop.rs:350 (is_army_commander: false), army_leadership.rs:26/128/156 (predykat zgodny z pinem).
BLOKADY: brak.
RUNDY: FC r1 (rozpoznanie 2/5)

ORZECZENIE ZARZUTOW:
1 ODDAL (naprawione w r2: dodano 18082/18122/18608, attack{targetId}).
2 ODDAL (naprawione: ocena CZESCIOWE/ROZBIEZNE, wskazano ratio():350).
3 ODDAL (naprawione: main.ts isGeneral, start bez !fadingOut).
4 ODDAL (naprawione: wiersz rozbity na start/reset = BRAK).
5 ODDAL (naprawione: FF 3703-3710, 9425, wolajacy 9805/9931).
6 ODDAL (naprawione: allowlista rozszerzona, podzial T1/T2/T3, 3-5 rund, #112 twarda; generator wektorow jawnie NIE_ZMIERZONO).
7 ODDAL (attackMove i _performSiegeManualOrder opisane; ciala pomocnicze jawnie NIE_ZMIERZONO w sekcji 5 - dopuszczalne w rozpoznaniu).
NAPRAW: brak.

UWAGI: sekcja 5 NIE_ZMIERZONO (ciala _attackMovePath, _siegeRamTowerStep, wspinaczka, _kickoffBattleTurn, generator wektorow) do domkniecia przed dispatchem T1/T2/T3.
DO DECYZJI CZLOWIEKA: zakres #97 (czy tryb reczny wchodzi w K5-LOOP-AUTO czy w osobne tematy T1-T3); czy T3 osobno czy w T2.
NASTEPNY KROK: integracja orkiestratora (tylko dokumentacja).
DEPLOY/PUSH: NIE WYKONANO
