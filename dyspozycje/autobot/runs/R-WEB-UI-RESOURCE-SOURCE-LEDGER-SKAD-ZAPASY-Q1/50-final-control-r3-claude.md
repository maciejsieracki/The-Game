STATUS: FAIL
DOMAIN: GAME
TEMAT: R-WEB-UI-RESOURCE-SOURCE-LEDGER-SKAD-ZAPASY-Q1
GOAL: dziennik "Skad zapasy" - ksiega zrodel przyrostu/zuzycia surowcow; partia 2 (zuzycie + handel) domknieta, zgodnosc ksiegi z magazynem w realnej sciezce gry.
ZMIANY/COMMIT: kandydat 2ad05c2c5a3aed5d7f0d074bab9d71a1eabce8f7 (r-ledger-obrona-r3). Pochodzi od 6ae20dbb3; NIE jest potomkiem aktualnego origin/main (ff090714d; merge-base 3d1670626) - przy ewentualnej integracji wymagany merge main. Ten raport: jedyny dodany plik.
TESTY (surowe wyniki, wlasne uruchomienie): tsc --noEmit exit 0; resource-ledger-trade-test 15 passed / 0 failed; resource-ledger-test 1030 passed / 0 failed; resource-ledger-consume-test 30 passed / 0 failed. Pozostale bramki referencyjne (logic, tech-tree, research, unit-replace, combat) NIE URUCHOMIONE przez FC - werdykt FAIL nie zalezy od nich; liczby Obrony (213/213, 20/0, ALL GREEN, 21/21, passed) niezweryfikowane przez FC.
WERDYKT ZARZUTOW:
1 Brak "Warzelnia (<miasto>)": NAPRAW. grep w resource-ledger.ts/turn-economy.ts: 0 trafien (jedyne trafienie w main.ts:4033 to tekst UI). Kryterium (b) i DODATEK 2 pkt 1 niespelnione; Obrona przyznaje NIE ZROBIONE.
2 Brak testu zgodnosci w realnej sciezce gry (>=3 ziarna x 30 tur, hash z/bez ksiegi): NAPRAW. Kryteria (a) i (c) niezmierzone; testy dzialaja na fixture.
3 Tautologiczny test handlu [1]: NAPRAW (czesciowo ugryziony przez [7a] - sprawdza tylko liczbe etykiet w tekscie main.ts; test dalej na wspolnej ksiedze i slabej mutacji).
4 Brak testu wpiecia Mennicy i limitu magazynu w turn-economy.ts: NAPRAW. Mutacja Evaluatora (no-op obu recordStockDeltaToTurn) nie zmienia zadnego testu; rozpoznanie FC: w turn-economy.ts istnieja wywolania recordStockDeltaToTurn (l.3202, 3219) bez pokrycia.
5 Szlak E3c przesuwa zapasy poza ksiega, sprzecznie z #311: DO DECYZJI CZLOWIEKA (ABC: usunac E3c jako osobny temat albo ksiegowac). DODATEK 2 zabrania ruszac E3c w tej rundzie - poprawne.
6 Okno pending nie czyszczone przy nowej grze: NAPRAW (wczytanie zalatane resetPendingLedger w prepareSessionForLoad; sciezka "nowa gra" nadal niezweryfikowana/nienaprawiona).
7 Kolejnosc pending vs tick (przelew w trakcie tury ksiegowany w nastepnej turze): NAPRAW lub jawnie udokumentowac jako akceptowana semantyke; dziś NIE ZMIERZONO w zywej grze.
8 Brak pomiaru czasu tury: DO PARTII 4 wg podzialu (DODATEK 1 wyklucza perf z partii 2) - nie jest powodem FAIL tej rundy.
9a Identyczne etykiety out/in: ODDAL (rozne sourceKey, kierunek ze znaku; do ocenienia w UI partii 4).
9b Zaplata cykliczna (praca/zloto) nieksiegowana: ODDAL do partii 3/4 jesli zaplata nie jest surowcem magazynu; potwierdzic w nastepnej rundzie.
9c DODATEK nieaktualny co do bazy: ODDAL (dlug procesowy orkiestratora).
Choc jeden NAPRAW => FAIL (zarzuty 1, 2, 3, 4, 6, 7).
BLOKADY: brak harnessu headless dla main.ts (Operator/Obrona deklaruja) - potrzebny albo test w realnej sciezce przez istniejace narzedzie determinizmu (#346/#349/#373), albo jawna zmiana zakresu przez orkiestratora; Warzelnia wymaga rozbicia plonu soli per budynek.
RUNDY: 3 z 5 zuzytych wg DODATKU (r3 = ten FC); do limitu zostaja r4 i r5.
NASTEPNY KROK: pytanie ABC E3c; runda 4 tego samego ID: Warzelnia, test realnej sciezki (>=3 ziarna x 30 tur, mutacja = rozjazd, hash), test wpiecia Mennicy/limitu, reset w nowej grze, rebase/merge na aktualny origin/main.
UWAGI-DLA-ORKIESTRATORA: (1) kandydat niezintegrowalny bez merge z ff090714d; (2) rozwazyc zmiane modelu Operatora na Sonnet po 2 nieudanych rundach Haiku (r2 FAIL, r3 FAIL) zgodnie z CLAUDE.md, z pisemnym uzasadnieniem; (3) ABC E3c.
DEPLOY/PUSH: NIE WYKONANO
