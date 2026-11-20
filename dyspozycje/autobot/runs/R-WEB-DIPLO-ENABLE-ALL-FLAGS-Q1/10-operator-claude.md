# R-WEB-DIPLO-ENABLE-ALL-FLAGS-Q1 — raport Operatora, runda 1/5

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-ENABLE-ALL-FLAGS-Q1
GOAL: domyślnie ON sześć flag dyplomacji (decyzja właściciela 2026-11-19), piny testów przepięte, pomiar ON.
ZMIANY-COMMIT: baza dc2f0fed0; commit z kodem i raportem (SHA w polu sha wyniku). Dane: twardaDyplomacjaAktywna, torSojuszyAktywny, koalicjaAntyLiderAktywna (ai-ai-treaty-params), zeroZaufaniaAktywna, wojnaSilaSojuszuAktywna, limitWojen.wartosc (true; obie wartości liczbowe bez zmian; torAktywny NAP i dopłata D zostają). Testy: ai-ai-alliance-tick, ai-ai-coalition, ai-ai-alliance-measure-hook, diplomacy-alliance-strength, diplomacy-zero-trust, diplomacy-war-limit (piny default ON, OFF przez jawny hak false), ai-ai-treaty-live-proof-breach (jawny limit wojen OFF, patrz niżej). Kod src/ nie zmieniony.
TESTY:
- tsc --noEmit: exit 0.
- logic-test 213/213; tech-tree 20/0; research 33/0; ai-unit-replace 45/0; combat-test: wszystkie sanity OK.
- ai-test 292 OK / 5 FAIL: te same 5 na bazie dc2f0fed (dane OFF) = NIE spowodowane flagami.
- Nieaktualne piny dyplomacji (non-live): 0 FAIL po zmianach.
- ai-ai-treaty-live-proof-breach (vite build poza repo, Chromium): ON z limitem wojen domyślnie ON = 4 FAIL (A2/A3/A3b/A4). Przyczyna: warLimitAllowsDeclaration odmawia wojny 1-2 w scenariuszu. Z jawnym setWarLimitEnabled(false) = 12/0 (baza: 12/0). Po pinie w repo: 12/0.
- war-rules-multiwar-main-guard: 3 FAIL, identyczne na bazie (pre-existing).
- POMIAR ON (runner --all-flags 1, 2 ziarna, Chromium): seed 4242 do tury 75 (zapis co 5; limit 590 s/polecenie, runner bez wznowienia; tur 90 NIE osiągnięto); seed 7 do tury 70. Brak NaN, brak endturn-timeout. Wojny max równoległe na cywilizację: 1 (4242) / 2 (7). Sojusze AI↔AI do t70-75: 4 w obu; maks. stopień sojuszy na cywilizację 2 (limit 2 NIE przekroczony w zmierzonych turach). Zaufanie sąsiadów (średnia wg własnej definicji, NIE porównywalna 1:1 z analizatorem): spadek do ok. 7 w t60 (4242), potem ok. 20-26. Zerwania przy Zaufaniu 0: 16 (4242, t75), 2 (7, t70) — zero zaufania działa.
- Nie zmierzono: OFF w tym przebiegu; analizator all-flags wymaga obu katalogów (OFF pusty, brak wyniku porównawczego).
- war-rules-multiwar-live-test: NIE URUCHOMIONO (czas > limit, Chromium).
- ai-ai-treaty-live-proof-wiring: 40 tur ON = analizator NIE PRZESZEDŁ (A1 wymaga ≥59 tur, A3 NAP=0; nie interpretuję); bieg 60 tur padł w openGame (crash Chromium). NIE ZMIERZONO.

BLOKADY / UWAGI-DLA-ORKIESTRATORA:
1. BŁĄD HAKA (main.ts, poza allowlistą, NIE zmieniony): __diploAllFlagsMeasure.setAll(false) ustawia null = wartość z danych, czyli teraz ON. Ramię OFF pomiaru łącznego jest więc ON. Trzeba przekazać false.
2. setAll(true) wymusza też torAktywny (tor NAP AI↔AI), którego NIE ma w sześciu flagach (dane: false). Pomiar ON nie odpowiada więc domyślnej konfiguracji: napTor był TRUE. Wymaga decyzji właściciela lub poprawki haka.
3. Limit wojen ON blokuje wojny w scenariuszu NAP (breach); to efekt zamierzony, ale warto go znać przy testach live.
4. Zero zaufania: efekt potwierdzony liczbowo tylko przez zerwania w pomiarze (16/2), bez porównania OFF.
5. Limit wojen liczy gracza jako cel (warTypesForOwner obrońcy), gracz jako deklarujący nieograniczony — zgodnie z komentarzem w kodzie; nie zmieniano.
6. Dane OFF/ON z rejestru nie były ponownie mierzone.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator — sprawdzić diff (tylko allowlista), decyzja właściciela co do napTor w haku i poprawka setAll(false) w osobnym temacie.
DEPLOY-PUSH: NIE WYKONANO
