STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-POLAR-FALLBACK-Q1
GOAL: AI w ekspansji nie zakłada miasta na heksie polarnym jako ostatni fallback.
ZMIANY/COMMIT: ocenione 36f96b86b2b0cd4edfafef2e86f6dd9438a5b7a2 (nad 81a8e76a7, baza 57cc8aded). Allowlista czysta: gra/src/game/ai.ts (+8/-1, końcówka findCityFoundingHex), gra/tools/ai-polar-fallback-test.cjs, runs/R-WEB-AI-POLAR-FALLBACK-Q1/**. git diff --check: tylko trailing whitespace w logach gate-*.txt (bez znaczenia).
TESTY (odtworzone samodzielnie, npm ci --ignore-scripts, node_modules usunięte): tsc --noEmit EXIT=0 bez błędów; ai-polar-fallback-test 8/8; ai-avoid-polar-pick-test 16/16; mutacja (ai.ts z 57cc8aded) -> 5 pass / 3 fail, nowy 8/8. Martwe aliasy (OPTS2, MIN_HI, Number(10)) usunięte (grep pusty).
ZARZUTY:
1. Brak T100/progu w żywej grze: ODDAL. Obrona zmierzyła sim silnikowy T100 (0% różnicy PRE/POST) i żywy PRE/POST T51; zmiana dotyka wyłącznie ścieżki bez własnych miast lub null, więc wpływ na ekspansję jest ograniczony z konstrukcji. T100 żywa gra pozostaje NIE_ZMIERZONO (jawna notatka).
2. Jedna próba Pangea 1001: ODDAL. Bieg B powtórzył 0 polarnych i polar-null; rozrzut 56-60 większy niż różnica PRE/POST.
3. Dowody z łatanego bundla: ODDAL. Weryfikowalność zapewnia test jednostkowy na realnym planCityFounding + mutacja.
4. Martwe aliasy: naprawione w 36f96b86b; sim founded=0: ODDAL (ścieżka pokryta F1/F2/F4/F5).
DO DECYZJI CZŁOWIEKA: brak. Założenie (null w ekspansji, fallback tylko przy 0 własnych miast) przyjęte w dokumencie.
BLOKADY: brak
RUNDY: 3/5 (FC)
NASTĘPNY KROK: integracja orkiestratora; SHA do integracji = SHA tego commitu raportu (nad 36f96b86b). ai.ts nie jest zmieniany na origin/rust-port/parity-v2 (fd8585daf) od merge-base f4c89d008; merge-tree czysty, kolejność dowolna (po parity-v2 bez konfliktów).
DEPLOY/PUSH: NIE WYKONANO
