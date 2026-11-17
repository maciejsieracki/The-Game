STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar na zywo; bez zmian w gra/src i gra/data)
TEMAT: R-WEB-LIVE-VERIFY-OBSERVATIONS-W18-W24-MANUAL-LOSSES-Q1
GOAL: punkt 3 dispatchu - straty zwyciezcy: reczna bitwa Z ROZKAZAMI vs AUTO vs skip, pary 10 vs 10, "pewne" 1 przebieg, "losowe" 3 ziarna (W18 zamkniety, W24 PASS - bez zmian).
ZMIANY/COMMIT: kandydat e6ccec38da2c6d6e43e80d7a80df9eba9b7fc261 (potomek bazy bf3f65f04: merge-base --is-ancestor = TAK; 2 commity). Diff vs baza: tylko 10-operator-claude.md, 30-obrona-claude.md, evidence/w3-manual-orders-10v10-r3.json, gra/tools/live-verify-w3-manual-orders-r3.cjs. git diff bf3f65f04 -- gra/src gra/data = puste. Allowlista zachowana. Trial merge-tree e6ccec38d z origin/main (ae7d9e3d5) = czysty (bez konfliktow).
TESTY (wlasne, surowe wyjscie, worktree na e6ccec38d, npm ci): tsc --noEmit exit 0; logic-test LOGIC OK (213/213); tech-tree-test 20 pass 0 fail; research-test PASSED 33 / FAILED 0; unit-replace-test 21/21; combat-test 6/6. Brak czerwonych, wiec porownanie baza vs kandydat zbedne (src identyczny). Evidence: 32 przebiegi, 0 bledow, pola survivors i endLogTail obecne (zarzut 1 zweryfikowany).
ZARZUTY:
1 (evidence bez survivors/endLogTail): ODDAL/naprawione przez Obrone - JSON zregenerowany zacommitowanym harnessem, klucze obecne, 0 "error".
2 (para Hastati vs Falanga, nie Wojownik): DO DECYZJI CZLOWIEKA - addUnit nie przyjmuje typeId (klonuje szablon wlasciciela), wstawienie Wojownika wymaga zmiany gra/src, poza zakresem pomiaru; udokumentowane jako NIE ZMIERZONO z dowodem z kodu, zastepnik (Hastati/Lucznik vs Falanga 10 vs 10) oznaczony. Nie jest to defekt pracy.
3 (liczba rozkazow): ODDAL - Obrona dodala actions.perRound (alive/eligible/issued); issued==eligible w kazdej rundzie; roznica wynika z ubywania jednostek i flagi acted (opisane).
4 (bramki NIE ZMIERZONO u operatora): ODDAL - zmierzone, patrz TESTY; zarzut procesowy, nie kodowy.
5 (brak kontroli negatywnej): ODDAL - tryb manual-null, 8 przebiegow, wynik rozni sie od trybu z rozkazami w 8/8, zwyciezca zmienia sie w 2/8.
6 (drobne): ODDAL - usage, martwy kod, trimInfo.before poprawione.
Zaden zarzut NAPRAW => nie FAIL.
BLOKADY: brak blokujacych. Uwagi: para Wojownik vs Wojownik NIE ZMIERZONO; rozkazy wywolaniem metody sceny, nie klikiem w plotno; przyczyna ucieczek lucznikow z pelnym HP i flagi acted niezdiagnozowana.
UWAGI-DLA-ORKIESTRATORA: decyzje wlasciciela - (a) balans: obronca wygrywa 8/8 w trybach z rozkazami oraz w AUTO/skip, bez rozkazow wygrywa atakujacy w 2/8; (b) czy lucznicy "uciekaja z pola bitwy" przy HP 20 jest zamierzone; (c) czy dopuscic zmiane src (addUnit z typeId) dla pary Wojownik; (d) flaga acted. Integrowac SHA e6ccec38d (nie 08297531d - brak raportu obrony i poprawionego evidence).
RUNDY: FC r3 (tematu r3/5 operatora, obrona r3).
NASTEPNY KROK: integracja orkiestratora (FF/merge e6ccec38d + ten raport), rejestry; decyzje ABC jw.
DEPLOY/PUSH: NIE WYKONANO
