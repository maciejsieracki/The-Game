STATUS: PASS-WITH-NOTES
DOMAIN: GAME (testy; zero zmian gra/src i gra/data)
TEMAT: R-WEB-TEST-DEBT-TRUCE-WIRING-Q1
GOAL: test wiążący/wykonujący węzły okablowania main.ts ścieżki „koniec rozejmu -> oferta pokoju z ceną”, mutacje czerwone.
ZMIANY/COMMIT: kandydat c65aceb27510157da8649d6a6ac4144e96db91d1; merge-base --is-ancestor 1bb77a7a0 -> TAK. git diff --stat vs baza: 4 pliki, +738 (gra/tools/truce-end-main-wiring-test.cjs, dyspozycje/analizy/TRUCETEST-2026-11-26.md, 10-operator-claude.md, 30-obrona-claude.md). gra/src i gra/data: 0 zmian. Allowlista zachowana.
TESTY (własne uruchomienie, surowe): tsc 0; truce-end-main-wiring BAZA 34/34, MUTACJE CZERWONE 42/42; truce-end-peace-price 72/0; truce-end-window 43/0; truce-end-settle-exec 30/0; war-limit-truce-count 19/0; logic 213/213; tech-tree 20/0; research 33/0; combat 6/6; ai-test 297/0; ai-unit-replace-same-rules 45/0; unit-replace 21/21.
Własna kontrola mutacji na main.ts (przywrócone git checkout, drzewo czyste): (a) usunięcie tickTruceExpiries() z końca tury -> FAIL K3 (BAZA 33/34); (b) zamiana (payerId,payeeId) w porcie settlePeacePrice -> FAIL S4, S4c, S6 (BAZA 31/34). Zarzuty 1 i 5 potwierdzone jako domknięte.
OCENA ZARZUTÓW: 1,3,4,7 domknięte (mutacje m18-m29, S4g/S4h, S9/S9b, S5b-S5d). 2: domknięte (S3b-S3d); mutant proposerId!==ME() równoważny — uzasadnienie z dowodem przyjęte. 5: wiązanie źródłowe K1-K7 zamiast wykonania tury — akceptowalne, odnotowane. 6: realny transferBasketItems tylko kotwica R1 — ODDAL (uwaga). 8: live Chromium NIE ZMIERZONO — luka punktu 4 dispatchu (sonda 2/2 stabilna, ale bez scenariusza okna gracza), nie błąd gry.
BLOKADY: brak blokujących. Notatki: live okna gracza po rozejmie NIE ZMIERZONO; ciała transferBasketItems i wywołania K1-K7 wiązane źródłowo, nie wykonywane.
RUNDY: FC po rundzie 2/5.
NASTĘPNY KROK: integracja orkiestratora (c65aceb27 + ten raport); osobny temat na live okna gracza po rozejmie (priorytet 3).
UWAGI-DLA-ORKIESTRATORA: brak błędu gry. Test wymaga npm ci w gra/.
DEPLOY/PUSH: NIE WYKONANO
