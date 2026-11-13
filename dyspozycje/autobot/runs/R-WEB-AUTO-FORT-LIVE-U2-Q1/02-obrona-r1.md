STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AUTO-FORT-LIVE-U2-Q1
GOAL: Domknac U-2 zywym biegiem z logiem E-FORT na bundlu ROBOCZEJ e3f08be6 (MD5 e3f08be6b0dcc31e55c45234dcb92d78).

## Odpowiedzi na zarzuty
1. Allowlista/pomiar (potwierdzenie): PRZYJMUJE, bez zmian.
2. Zarzut 1 (U-2 tautologia, #24 niezmierzona): PRZYJMUJE. Werdykt U-2 zmieniam na "CZESCIOWO: ZGODNE tylko dla scenariusza z niewyczerpanym limitem; zachowanie przy wyczerpanym limicie NIE ROZSTRZYGNIETE". #24 nadal NIE_ZMIERZONA.
3. Zarzut 2 (NIEOSIAGALNY bez haka): PRZYJMUJE i sprawdzilem wariant 11 miast w allowliscie. Nowy `FILL_CITIES=11` (fort.cjs) + sonda `fort-fill-probe`: 11 miast gracza w T2 (era 3). Pierwsza zywa bramka przy wyczerpanym limicie: T3 `zywnosc E1-E6 w toku` (cityLimitExhausted=true, roadCities=11, stagedPicks=63, deficitPicks=397, fortPicks=0). Dalej konczenie T3 wisi 420 s, log `blocked: gameOver` (z wojna i z `NO_WAR=1`); przyczyna NIE_ZMIERZONO. Slowo "NIEOSIAGALNY" wycofane (usterki.md). Wynik: 1 tura danych zamiast T3-T33; kandydat na osobny temat diagnostyczny.
4. Zarzut 3 (U-3 slabo dyskryminujace): PRZYJMUJE i dodalem kontrole negatywna. Bundel przed poprawka 8f59c5c2 (MD5 8f59c5c22da274f1b64ca6a0bac53b44), `fort.cjs 8 infrastruktura`, ziarno 18: posterunek (14,33) w odleglosci 1 od fortu (14,34), shared=37=nHex (w calosci w kole). Bundel e3f08be6: posterunek (13,37), d=3, shared=33<37. Roznica obserwowalna (`evidence/negctl-bundle-8f59c5c2-infrastruktura-s18.json`). Sformulowanie koryguje na "kryterium shared<nHex spelnione, kontrola negatywna zgodna". Brak wpisow e-fort w profilu infrastruktura: NIE_ZMIERZONO (bez zmian).
5. Zarzut 4 (s18 gameOver T33): PRZYJMUJE jako informacje; porownywalnosc po T33 NIE_ZMIERZONO. Dane s7 (T2-T39) pelne, bez gameOver.
6. Zarzut 5 (forma): PRZYJMUJE. Logi `gate-*.txt` maja teraz dokladnie jedna linie `EXIT=0` (10 plikow; w raporcie r1 bylo "7", faktycznie 6); stdout w `evidence/stdout/*.stdout.json`. Raport skrocony.

## ZMIANY-COMMIT
Skrypty: `gra/tools/live-verify-autoimprove-fort.cjs` (FILL_CITIES, NO_WAR), nowy `live-verify-autoimprove-fort-fill-probe.cjs`; dowody i usterki w katalogu runu. Bez zmian w gra/src, gra/data, gra-robocza, rust-port, WERSJE.md. Gałąź obrona-u2-q1; SHA w odpowiedzi.

## TESTY / komendy
export ROBOCZA_HTML=<kopia bundla w mktemp> NODE_PATH=/usr/lib/node_modules:/opt/node-tools/node_modules EVID_DIR=<run>/evidence SEED=18
FILL_CITIES=11 [NO_WAR=1] node gra/tools/live-verify-autoimprove-fort.cjs 12 zrownowazone
node gra/tools/live-verify-autoimprove-fort-fill-probe.cjs 5 11
Stary bundel: git show b7aa7fc0b^:gra-robocza/Gra-ROBOCZA.html; fort.cjs 8 infrastruktura. pageErrors 0; parytet 0 niezgodnosci (kontrola negatywna: 217 porownan).

BLOKADY: gameOver w T3 w wariancie 11 miast (przyczyna NIE_ZMIERZONO; wymaga diagnozy lub haka).
RUNDY: 1/5 (obrona)
NASTEPNY KROK: Final Control; orkiestrator decyduje o temacie diagnozy gameOver / haka dla pelnego U-2.
DEPLOY-PUSH: NIE WYKONANO
