STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar; bez zmian logiki gry i bez zmian gra/src)
TEMAT: R-WEB-MEASURE-FORTRING-ROUNDTRIP-Q1
GOAL: powtórka round-trip zapisu ON/OFF (różnica cityProd), bieg ciągły seed 4242 do t60 ON/OFF, test gate, dokument wyników.
ZMIANY/COMMIT: brak zmian kodu gry; dokument dyspozycje/analizy/POMIAR-FORTRING-ROUNDTRIP-2026-11-25.md i ten raport. Baza bb3a824ca (origin/main). Commit wstępny 71039c3dd; commit końcowy = SHA w polu sha wyniku.
TESTY: round-trip t8 (seed 4242, istniejący gra/tools/fortring-measure.cjs, bez wznowień ze slotu):
  ON: powtórzenie 1 NIE ZMIERZONO (zamknięcie Chromium po t8, brak pliku stanu); powtórzenia 2 i 3: shaBefore=shaAfter=a604d6388715…, forty 0/0, różnice []
  OFF: powtórzenia 1, 2b, 3: shaBefore=shaAfter=a604d6388715…, forty 0/0, różnice []
  Wynik: 5 zmierzonych round-trip tożsamych (ON 2, OFF 3). Różnica cityProd z t59/t60 NIE odtworzona (nie badano t60). Powtarzalność NIE ZMIERZONA.
  Bieg ciągły ON t60: proces PID 11723 (inna sesja, katalog wf_60985f36) trwa; nie przejęty. Bieg OFF t60: NIE ZMIERZONO.
  Test gate (30 tur, hash bazy): NIE ZMIERZONO. Hak stawiający fort: nie dodany (forty = 0 w t8).
BLOKADY: (1) Chromium headless zamyka się w połowie biegów (3 z 8 przebiegów tej serii); (2) t60 ON/OFF i gate nie wykonane w tej rundzie; (3) powtarzalność cityProd NIE ZMIERZONA.
RUNDY: 2/5 (runda 1 FAIL: brak commita)
NASTĘPNY KROK: FC ocenia częściowy wynik round-trip; kolejna runda: bieg ciągły OFF t60 po zakończeniu ON seed 4242, round-trip przy t60, test gate, ewentualny hak stawiający fort.
DEPLOY/PUSH: NIE WYKONANO
