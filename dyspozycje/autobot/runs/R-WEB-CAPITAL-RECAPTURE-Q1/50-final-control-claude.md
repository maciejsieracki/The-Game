STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-CAPITAL-RECAPTURE-Q1
GOAL: Naprawa kryterium "to byla stolica" przy przejeciu miasta (plunder skarbca + sukcesja) gdy jawny wpis stolicy jest nieaktualny po buncie/cesji.
KANDYDAT: 952b18d51d25bc1e421b285b45ddd5ef9399d3f2, baza a562809ff69fb4ca4d94acbab18a96e6a8881457 (niezalezna weryfikacja Final Control)

ZMIANY/COMMIT:
- merge-base --is-ancestor baza -> kandydat: TAK. Jeden commit (952b18d51).
- diff --stat: gra/src/game/capital-capture.ts +37, gra/src/main.ts +6/-1, gra/tools/capital-recapture-live.cjs (nowy), gra/tools/capital-recapture-stale-designation-test.cjs, dyspozycje/analizy/STOLICA-ODBICIE-PO-BUNCIE-2026-11-27.md, runs/.../10-operator-claude.md. Wszystko w allowliscie r2; brak gra/data, WERSJE.md, manifestu, gra-robocza/kanon, rust-port.
- Przeglad kodu: nowa czysta funkcja effectiveCapitalBeforeCapture odtwarza reguly capitalCityIdForOwner (jawny wpis wazny gdy miasto ma oldOwnera lub jest przejmowane; inaczej najstarsze miasto oldOwner wlacznie z przejmowanym). main.ts: designatedCapitalId zawsze string zamiast surowej mapy. Dla braku wpisu wynik rowny dawnemu legacy fallbackowi (najstarsze); dla waznego wpisu bez zmian; dla nieaktualnego wpisu = naprawa. Guardy REBEL/barbarzynca bez zmian. Zero zmian balansu, zapis wstecznie zgodny (brak nowych pol). Poprawka poprawna i minimalna.

TESTY (surowe wyniki wlasnych uruchomien na kandydacie):
- tsc --noEmit: rc=0
- logic-test 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6
- ai-test 297 passed, 0 failed
- capital-capture-test 107/107
- society-breakdown 56 OK, 0 FAIL
- ai-city-rebellion-gate 37 PASS, 0 FAIL
- capital-recapture-stale-designation-test: rc=0, PASS=12 FAIL=0 NIE-ZMIERZONO=1 (S5 jawnie)
- testy sasiednie (capitalCityIdByOwner/runCapitalCapturePlunder): ai-dlug-porzadki-q1 17/0, annex-citystate-spoils 80/0, capital-resolver-economy 10/0, elimination-full-spoils 114/0, elimination-toast-merge 56/0, miasto-zdobycie-raport 117/0
- wydarzenia-eliminacja-podboj-karta-test: 27 pass / 1 fail (0.5c kicker "Dyplomacja"); IDENTYCZNY wynik 27/1 na bazie a562809ff -> wada istniejaca, nie regresja kandydata (ODDAJ, uwaga).
- Brama "wiring 267/0": brak jednoznacznego pliku o tej liczbie; NIE ZMIERZONO jako jedna bramka (zamiast niej testy z listy wyzej).
- Pomiar live (Chromium, maks. Trudny/Wysoki x4/kultura trudny/dyplomacja trudna; build vite do /tmp, usuniety): seed 4242 etykieta PO: S1-AI, S3-cesja, S4-dwa-bunty wszystkie okSiege=true, ztrataEksplicit=false, wpis jawny po zdobyciu = nowa stolica (city43/city46/city49), errors=[]. Seed 7: dwie proby, obie crash Chromium (SIGSEGV, "browser has been closed", znany problem infrastruktury) -> seed 7 w moim pomiarze NIE ZMIERZONO; Operator raportuje seed 7 i 11 PASS w dokumencie. Pomiar PRZED nie powtarzany (dowod PRZED: test modulowy z mutantem + raport Operatora).
- Mutacja czerwona: test modulowy zawiera captureMutantRaw (stan sprzed poprawki) i kotwice main.ts; wlasnej mutacji main.ts ani przebudowy live PRZED nie wykonywalem. Test dziala na replice resolvera (main.ts nie jest bundlowalny) - ograniczenie jawne, skompensowane kotwicami i pomiarem live.

ZARZUTY EVALUATORA: [] | obrona: brak. Brak zarzutow do rozstrzygniecia.

UWAGI-DLA-ORKIESTRATORA:
1. Skutek uboczny (zamierzony, opisany w dokumencie): przejecie ostatniego miasta bedacego faktyczna stolica przy nieaktualnym wpisie teraz daje eliminacje (wczesniej null i cywilizacja bez miast zostawala w grze).
2. wydarzenia-eliminacja-podboj-karta-test 0.5c czerwony juz na a562809ff - temat dlugu testowego.
3. Seed 7 live crash Chromium (infra) - dopisac do #90.
4. Wdrozenie jako kolejna FALA (numer ustala orkiestrator).

BLOKADY: brak
RUNDY: 2/5 (FC r2)
NASTEPNY KROK: integracja orkiestratora (merge 952b18d51 do main, ponowne bramki), potem deploy ROBOCZA wg dispatchu
DEPLOY/PUSH: NIE WYKONANO
