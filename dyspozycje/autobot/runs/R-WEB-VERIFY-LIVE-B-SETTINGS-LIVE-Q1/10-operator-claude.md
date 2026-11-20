STATUS: PASS-WITH-NOTES
DOMAIN: GAME (weryfikacja; kod gry bez zmian)
TEMAT: R-WEB-VERIFY-LIVE-B-SETTINGS-LIVE-Q1
GOAL: Na żywo (Chromium) zmierzyć 5 nowych ustawień/reguł z FAL 876–889 i zapisać wyniki z liczbami.
ZMIANY/COMMIT: 5 nowych testów gra/tools/verify-live-{diplo-war-level,growth-toggle,unit-cost-pace,food-to-tax,improvement-cost-era}-test.cjs + dyspozycje/analizy/WERYFIKACJA-NA-ZYWO-USTAWIENIA-2026-11-20.md + ten raport. Brak zmian w gra/src, gra/data, istniejących testach. SHA: patrz pole sha w wyniku.
TESTY:
- tsc --noEmit: exit 0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED 33 / FAILED 0 / TOTAL 33
- combat-test: COMBAT TEST 6/6 pass
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21)
- verify-live-diplo-war-level: BAZA ZIELONA; mutacja zdrada_zaufanie CZERWONA
- verify-live-growth-toggle: BAZA ZIELONA; mutacja przychody stałe CZERWONA
- verify-live-unit-cost-pace: BAZA ZIELONA; mutacja koszt Procarza CZERWONA
- verify-live-food-to-tax: BAZA ZIELONA; mutacja NIE ZMIERZONO (brak pliku danych kursu)
- verify-live-improvement-cost-era: BAZA ZIELONA; mutacja flaga → false CZERWONA
BLOKADY: brak odczytu w grze (civTest) dla punktów 3–5; testy mierzą prawdziwe moduły przez harness poza repo, a nie pełną grę z kreatora i turą.
RUNDY: 1/5
NASTĘPNY KROK: (a) temat z minimalnym hakiem civTest (odczyt rekrutacji, utrzymania, zamiany żywności i kosztu budowy); (b) decyzja właściciela o kursie 0,2 (źródło w danych); (c) pomiar utrzymania w Pieniądzu.
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: Z-1 hak civTest (main.ts ok. 49760–49762 i 51671–51675); Z-2 harness nie jest pełną grą; Z-3 kurs 0,2 nie z danych; Z-4 utrzymanie Pieniądz nie mierzone; NIE ZMIERZONO: round-trip zapisu ustawienia wzrostu i wczytanie z localStorage (crash Chrome, CHROMEHELPER).
