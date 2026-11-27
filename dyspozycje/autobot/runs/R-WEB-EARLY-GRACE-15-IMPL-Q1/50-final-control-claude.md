STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-EARLY-GRACE-15-IMPL-Q1
GOAL: okno łaski 15 tur (Q41-A): Wojownik na starcie Trudny, barbarzyńcy bez działań w t1–15, utrzymanie jednostek gracza 0 w t1–15.
ZMIANY/COMMIT: kandydat c4bf50f53051feff526da7e790c6b0b5c16c53b3 (potomek bazy 6afdec814356dc8ca1ebd409bf5cec31d84eafb7: merge-base --is-ancestor = tak). Diff: 10 plików, wszystko w allowliście (ai-params.json, ai-difficulty-bonus.ts, ai-free-unit-upkeep.ts, barbarians.ts, main.ts, 2 testy, dokument, raporty). Brak zmian w gra-robocza/kanon/WERSJE/rust-port. Ten raport: jedyny dodany plik.
TESTY (własny bieg, tsc 5.9.3 po npm ci --ignore-scripts):
- tsc --noEmit: exit 0
- logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6; unit-power 6/0
- ai-test 297/0; society-breakdown 56/0; ai-city-order-need-wiring 267/0; save-load-sort 4/4; endturn-aria-sync 5/0
- early-grace-15 33/0; ai-difficulty-bonus 97/0; barbarians 213/0; barbarian-cooperation-grace 30/0; barbarian-cooperation-grace-maints-wiring 29/0; diplomacy-barbarian-cooperation 10/0; ai-home-defense-vs-barbarians 64/0
- ai-free-unit-upkeep 34/0; ai-recruit-upkeep-gate 23/0; ai-upkeep-wiring 4/0; unit-resource-upkeep 7/0; upkeep 91/0; upkeep-difficulty-per-owner 19/0; city-state-start-units 16/0
- unit-upkeep-cost-pace: 80 ok / 1 FAIL ("wszystkie wywołania silnika utrzymania w 27 miejscach niosą tempo") -- identyczny wynik na bazie 6afdec814 (pre-existing, nie od tego tematu).
- scout-start-units-live: przekroczył timeout 120 s w moim biegu (NIE ZMIERZONO).
- Mutacje własne: bramka barbarzyńców -> return false: early-grace-15 28/5 (czerwone); usunięcie okna utrzymania gracza: 24/9 (czerwone); start Trudny=1 przypięty w ai-difficulty-bonus-test (hard:1).
POMIAR NA ŻYWO (Chrome, tools/realdef-max-gaps.cjs, polityka p0 = gracz pasywny bez akcji; MAKSIMUM = ustawienia domyślne runnera REALDEF5: Trudny, Wysoki x4, kultura trudny, dyplomacja trudna, barbarzyńcy Trudny, Mały, Kontynenty):
- ziarno 4242: Wojownik od t1 (playerMil=1), zero barbarzyńców w pobliżu t1–16 (barbMinDist=null), pierwszy spawn obozów w logu "Tura 17" (faza domykająca turę 16), miasto nie utracone, "Zakończ turę" działało t1–18; stop w t19 = bramka skarbca (prognoza -12 złota po wygaśnięciu darmowego utrzymania), nie atak. Wcześniej to ziarno traciło miasto w t10.
- ziarno 778899: Wojownik od t1, zero barbarzyńców t1–16, miasto nie utracone, "Zakończ turę" działało t1–16; stop w t17 = bramka skarbca (skarbiec 16 -> prognoza ujemna). Wcześniej miasto ginęło w t13.
- Od t17 barbarzyńcy wracają jak dotąd (12 nowych obozów, na 4242 barbMinDist 3 w t17 i 2 w t19).
OCENA ZARZUTÓW: (1) PRZYJĘTE i naprawione poprawnie (okno liczone dla domykanej tury N=turn-1, spójne z utrzymaniem; potwierdzone logiem: pierwszy spawn przy domknięciu t16). (2) Pomiar wykonany teraz (powyżej); literalne "przeżycie t20" NIEDOWIEDZIONE, bo pasywny gracz staje na bramce skarbca w t17/t19, miasto jednak stoi. (3) Test behawioralny helpera + pin tekstowy wywołania akceptowalne, pomiar na żywo to uzupełnia; blokada spawnu do t16 to założenie (uwaga b). (4)(5) naprawione (mutacje czerwone, pętle poziomów). (6) dokument uzupełniony. (7) pre-existing potwierdzone na bazie.
BLOKADY: brak blokujących. Literalne "przeżycie t20" niedowiedzione z powodu bramki skarbca pasywnego gracza po t16 (ekonomia, poza zakresem tematu).
RUNDY: FC po rundzie 2/5.
UWAGI-DLA-ORKIESTRATORA: (a) Po oknie łaski pasywny gracz Trudny/Wysoki x4 trafia w t17–19 na blokadę "Zakończ turę" (brak złota na utrzymanie Wojownika x4); skutek wygaśnięcia darmowego utrzymania, nie błąd tematu -- kandydat na pytanie ABC dla właściciela (czy okno łaski ma wygasać łagodniej). (b) Założenie: bramka barbarzyńców blokuje też spawn i tick obozów, obozy powstają najwcześniej przy domknięciu t16. (c) scout-start-units-live niezmierzony. (d) Wiki "Barbarzyńcy" niesprawdzona.
NASTĘPNY KROK: integracja orkiestratora (merge c4bf50f53 do main, bramki, deploy ROBOCZA wg procedury).
DEPLOY/PUSH: NIE WYKONANO
