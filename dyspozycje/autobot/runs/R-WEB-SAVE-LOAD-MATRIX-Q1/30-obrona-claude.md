STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-SAVE-LOAD-MATRIX-Q1 (obrona, runda 3 tego ID; Operator HAIKU)
GOAL: macierz zapis/wczytanie na MAKSIMUM (rivals=9, civTypesCount=14 dla Brazu, barbarzyncy Trudny), B==A >=6 tur, klik UI, A==A' >=10 tur x 2 ziarna, render po wczytaniu.
ZMIANY/COMMIT: gra/src bez zmian. gra/tools/save-load-continuity-live.cjs: domyslne rivals=9 (MAX_MIAST_PANSTWA), civTypesCount=14 (maksimum Brazu, wczesniej 15), stale MAX_RIVALS / MAX_CIV_TYPES_BRAZ z komentarzem. dyspozycje/analizy/ZAPIS-WCZYTANIE-MACIERZ-2026-11-27.md: sekcja 0 przepisana (stan wiazacy). dyspozycje/autobot/runs/R-WEB-SAVE-LOAD-MATRIX-Q1/dane/r3-*: wyniki A/B (4 pary), r3-READBACK-rivals9.txt, stany r3-STATE-*.json.gz. SHA: patrz git log (commit tej rundy).
BAZA: c79d0b0b5 (kandydat); gra/ zbudowana do katalogu w scratchpadzie (vite build exit 0), npm ci --ignore-scripts w gra/ wykonane.

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJE i CZESCIOWO NAPRAWIAM. Wykonano pomiar na rivals=9 dla 4 komorek max: max/4242/t3 PASS 6/6, max/4242/t10 PASS 6/6, max/7/t3 PASS 6/6, max/7/t10 PASS 6/6 (pageErrors 0 we wszystkich, cfgUsed rivals "9"). NIE ZMIERZONO na maksimum: bunt/4242/t3, bunt/4242/t10, bunt/7/t3, bunt/7/t10, aionly/4242/t3, aionly/4242/t10, aionly/7/t3, aionly/7/t10 (8 komorek). Liczba komorek na maksimum: 4 z 12, nie 1 z 12 jak w poprzedniej obronie (bo max/7/t10 i max/4242/t10 dochodza na 9).
2. PRZYJMUJE i NAPRAWIAM. civTypesCount 15 bylo zawyzone dla epoki Braz. Dane: civs.json, 14 cywilizacji z epokaWejscia <= braz; newGameFlow.ts:2236 clampuje do epochCivMax. Maksimum dla Brazu = 14 (zapis: dane/r3-READBACK-rivals9.txt). Stan aiOwnerCivMap w zapisie t3 (seed 4242 i 7) ma 14 roznych cywilizacji, zgodnie z tym. Maksimum dla Zelaza (15) nie bylo tu mierzone i nie jest uzywane.
3. PRZYJMUJE, NIE NAPRAWIAM W TEJ RUNDZIE. Komorki bunt/4242/t10 i bunt/7/t10 (B!=A) nadal nierozstrzygniete; brak minimalnego odtworzenia i testu czerwony->zielony. Powod: poprawka wskazywana w hipotezie to gra/src/game/cities.ts, poza allowlista dispatchu (dopuszczone wylacznie gra/src/main.ts po odtworzeniu bledu). Decyzja dla orkiestratora: zmiana cities.ts albo akceptacja reprezentacji.
4. PRZYJMUJE, NIE ZBADANO. Hipoteza harnessu (Math.random seedowany raz w addInitScript, nie przywracany po wczytaniu) NIE sprawdzona eksperymentem; nie wiem, czy rozjazd dirty3 jest artefaktem. Nie zrobiono wariantu dirty0 z przebudowa mapy ani testu z ponownym zasiewem.
5. PRZYJMUJE, NIE ZMIERZONO. Klik UI na max/7/t3 nie wykonany. gra/tools/save-load-continuity-ui-live.cjs nadal ma rivals i cityStatesCount '2' (nie zmieniano w tej rundzie; to kolejna do zrobienia).
6. PRZYJMUJE, NIE ZMIERZONO. Render po wczytaniu (hexCount, konsola, liczba miast i jednostek) nie wykonany w tej rundzie. Stary PNG z r2 (dane/r2-UI-max-4242-t3-po-wczytaniu.png) pochodzi ze stanu po rozjezdzie i nie jest oceniony.
7. PRZYJMUJE i NAPRAWIAM. Sekcja 0 dokumentu ZAPIS-WCZYTANIE-MACIERZ-2026-11-27.md przepisana: wprost podano, ze tylko 4 komorki sa na maksimum, a stare wyniki r2 nie liczą sie jako maksimum.
8. PRZYJMUJE. A==A' i pozostale A==A' z r2 zmierzono na rivals=2; nie powtorzono na rivals=9. Nie liczy sie jako dowod dla maksimum. NIE ZMIERZONO na maksimum.

TESTY (surowe wyniki z plikow dane/r3-*.json; verdict z wyjscia harnessu):
- A max/4242 save t3 (rivals 9): zrzuty t4..t9, exit 0. B max/4242 t3: VERDICT PASS (expect=equal, anyDiff=false, pageErrors=0), rebuild=false, tury OK x6.
- A max/4242 save t10: zrzuty t11..t16, exit 0. B max/4242 t10: VERDICT PASS (anyDiff=false, pageErrors=0), tury OK x6.
- A max/7 save t3: zrzuty t4..t9, exit 0. B max/7 t3: VERDICT PASS (anyDiff=false, pageErrors=0), 02:08:55.
- A max/7 save t10: zrzuty t11..t16, exit 0 (02:20:09). B max/7 t10: VERDICT PASS (anyDiff=false, pageErrors=0), 02:25:46.
- Bramki kodu: gra/src bez zmian, tsc/logic/ai-test nie uruchamiane (brak wplywu na kod). npx tsc --noEmit w tej rundzie nie wykonano.
- Procesowo: dwa biegi (A max/7 t10 oraz B max/7 t3) przekroczyly 600 s i narzedzie przeniosло je w tlo bez mojej decyzji; nie uruchomiono drugiej kopii; wyniki odczytane z plikow wyjsciowych (exit 0). Biegi bez run_in_background; oczekiwanie przez petle z sleep w pierwszym planie.

BLOKADY:
- 8 komorek bunt/aionly na maksimum nie zmierzono.
- bunt/t10 B!=A nierozstrzygniete (decyzja orkiestratora, cities.ts poza allowlista).
- Klik UI na maksimum (max/4242/t3 i max/7/t3): nie zrobione, harness UI ma rivals=2.
- A==A' na maksimum (max/4242 i max/7, >=10 tur): nie zrobione.
- Render po wczytaniu: nie zrobione.
- Diagnoza dirty3 UI: nie zrobiona.

RUNDY: 3/5 (runda 1 FAIL, runda 2 BLOK, obrona runda 3 = ta). Decyzja wymagana: TAK w jednej sprawie: bunt/t10 B!=A (zmiana cities.ts albo akceptacja reprezentacji).
NASTEPNY KROK: (a) orkiestrator decyduje o bunt/t10 (cities.ts poza allowlista); (b) pozostale 8 komorek na maksimum (bunt, aionly) jako osobne A (--saves 3 i --saves 10) + B; (c) klik UI na rivals=9 (zmiana rivals w gra/tools/save-load-continuity-ui-live.cjs); (d) A==A' 10 tur na max/4242 i max/7 na rivals=9; (e) render po wczytaniu z PNG.
UWAGI-DLA-ORKIESTRATORA: pozycja 'rivals=9' jest teraz domyslna w runnerze live; runner UI nadal na 2. Wyniki r2 na rivals=2 (dane/r2-*) nie sa dowodem dla maksimum.
DEPLOY/PUSH: NIE WYKONANO
