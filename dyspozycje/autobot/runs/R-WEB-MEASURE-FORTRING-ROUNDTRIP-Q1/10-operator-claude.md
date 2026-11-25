STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar; bez zmian logiki gry, bez zmian src)
TEMAT: R-WEB-MEASURE-FORTRING-ROUNDTRIP-Q1
GOAL: powtórka round-trip zapisu ON/OFF (różnica cityProd), bieg ciągły seed 4242 do t60 ON/OFF, test gate, dokument wyników.
ZMIANY/COMMIT: brak zmian kodu gry; dodany tylko dokument analizy dyspozycje/analizy/POMIAR-FORTRING-ROUNDTRIP-2026-11-25.md i ten raport. Bazą jest bb3a824ca (origin/main).
TESTY: w toku (stan w dokumencie analizy, sekcja wyników; wartości liczbowe z surowych plików run.log).
BLOKADY: (1) Chromium (headless) ulega zamknięciu/SIGSEGV w trakcie biegu przy turach ok. 9-16 - round-trip t20 nieosiągalny w jednym przebiegu (rt-on-a: zamknięcie strony po turze 9); round-trip wykonany na t8 (krótszy bieg). (2) Bieg ciągły ON t60 prowadzony przez inną sesję (proces PID 11723, katalog wf_60985f36) - nie przejęty, nie zabity. (3) Test gate (30 tur, porównanie z bazą) NIE ZMIERZONO w tej rundzie. (4) Hak stawiający fort nie dodany - NIE ZMIERZONO.
RUNDY: 2/5 (runda 1 FAIL: brak commita)
NASTĘPNY KROK: FC ocenia częściowy wynik round-trip; kolejna runda: bieg ciągły OFF t60 po zakończeniu ON, test gate, hak stawiania fortu.
DEPLOY/PUSH: NIE WYKONANO
