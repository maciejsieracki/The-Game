STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiary, priorytet 2)
TEMAT: R-WEB-VERIFY-LIVE-3-Q1 (Final Control)
GOAL: trzy pomiary na żywej grze na poziomie maksymalnym: Targowisko, cesja >1 miasta, FORTRING (ON/OFF, round-trip).
ZMIANY/COMMIT: kandydat 469213cdd5af7f2c22fddadfa68731a332a19b91; baza 3608af1ce2aae306c6fa2f77413f8817d2c7bed0 jest przodkiem (merge-base --is-ancestor: OK). git diff --stat: 22 plików, +1467/-0; wszystkie w allowliście (gra/src/main.ts, gra/tools/*, dyspozycje/analizy/VERIFY-LIVE-3-2026-11-27.md, runs/R-WEB-VERIFY-LIVE-3-Q1/**). Brak gra-robocza/gra-kanon/WERSJE.md/manifestu/rust-port. main.ts: +52 linii, wyłącznie hooki w bloku __settingsLive (tylko ?civTest=1): convertOwnerFoodToTaxLive (ta sama wiązka io co UI), odczyty owner*Live, setOwnerFoodReserveLive, forceFortLive. Zero zmian reguł/balansu/progów.
TESTY (własny przebieg, rc z surowego wyjścia, gra/ z node_modules): tsc --noEmit rc 0; logic-test 213/213; tech-tree-test 20/0; research-test 33/0; combat-test 6/6; ai-unit-replace-same-rules-test 45/0 (dispatch podawał 21; faktycznie 45); ai-test 297/0; ai-city-rebellion-gate 37/0; ai-city-rebellion-news 24/0. Żywych biegów Chromium nie powtarzałem; oceniam surowe logi w dane/ (targowisko: JSON A/B, kurs 0,2, rezerwa 100->0, kolejka 0->20, delta skarbca B-A = +6; fortring ON/OFF po 20 tur, forts=1 stale, round-trip equal; cesja 23/0).
OCENA ZARZUTÓW (bez etykiet ról): 1,3,4,5,7 usunięte przez rundę obrony (pomiar wykonany, T4 dodany, bieg na maksimum Trudny/trudna/wysoki x4/trudny przez startNewGame, bramki uruchomione). 2 zasadny w części wykonawczej, naprawiony nowym hakiem zmieniającym stan; wynik liczbowy jest. 6: OFF i round-trip wykonane, fort wymuszony hakiem, raw .txt w dane/; brak logów padnięć Chromium, bo w tych biegach padnięć nie było (jeden przerwany przebieg ON t12 zachowany jako dowód). Wszystkie zarzuty NAPRAWIONE; żaden nie wymaga FAIL.
KRYTERIUM BINARNE: poz. 1 ZMIERZONO (PASS, kurs 0,2 zgodny); poz. 2 ZMIERZONO (PASS, 2 miasta w jednej komendzie, AI 3->1, pokój); poz. 3: round-trip i czas tury ZMIERZONE na maksimum, wpływ pierścienia NIE ZMIERZONO z udokumentowaną próbą (20 tur x ON/OFF, brak obserwowalnej różnicy, AI nie buduje fortów), co kryterium dopuszcza.
BLOKADY / UWAGI (nie blokują PASS):
- Cesja na scenariuszu ?playtest=mapa (domyślne ustawienia dyplomacji), nie na maksimum; ceny pokoju na maksimum NIE ZMIERZONO. Założenie: mechanizm przeniesienia własności nie zależy od poziomu (jawnie zapisane przez operatora).
- Rozmiar mapy Maly zamiast największego w runnerach FORTRING/Targowisko; rozmiar nie jest ustawieniem trudności/kosztów; odstępstwo opisane w dokumencie.
- Round-trip fortów obejmuje liczbę fortów i ustawienia, nie pełny skrót stanu.
- Netto skarbca +6 z 20 kolejki (0,30) to pytanie o ekonomię gry (ABC), nie błąd kodu.
- Przerwany koniec tury ON t12 (endTurnInProgress bez modala): nieodtworzony deterministycznie.
UWAGI-DLA-ORKIESTRATORA: (a) temat: identyfikacja, co pierścień fortów zmienia (warunek pomiaru wpływu; fort nie powstaje samoistnie w 20 tur na maksimum); (b) pytanie ABC o zamierzoność netto 30% Targowiska (redakcja wg zasad ABC); (c) temat: odtworzenie zablokowanego końca tury ON t12; (d) opcjonalnie cesja na kreatorze maksimum dla cen pokoju.
RUNDY: FC po rundzie 2/5.
NASTĘPNY KROK: orkiestrator: integracja kandydata 469213cdd (merge/FF, rejestry); deploy tylko jeśli uzna zmianę main.ts (hooki civTest) za wymagającą FALI.
DEPLOY/PUSH: NIE WYKONANO
