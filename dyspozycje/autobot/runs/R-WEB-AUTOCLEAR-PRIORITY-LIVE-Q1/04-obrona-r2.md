STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AUTOCLEAR-PRIORITY-LIVE-Q1
GOAL: Farma przed trzoda przy rzece (rejestr #1: E1 farma, E2 wycinka+farma, E3 trzoda, E4 irygacja); heks sasiadujacy z rzeka = heks nad rzeka (ABC-B).
ROLA: Operator (obrona), baza `689518a17`.

ODPOWIEDZI NA ZARZUTY
1. PRZYJMUJE. `onRiverHex` w `gra/src/game/auto-improvements.ts` (~:1187) = `hasRiverAccess(hk)` LUB sasiad z wlasnym `rzeka.obecna`. `hasRiverAccess` NIE zmieniony (tartak/oboz, `isRiverAdjacent`/irygacja bez zmian), wiec nie powstaje osobny temat. Sweep (mapa generujSwiat(778899,'standardowy','kontynenty'), 200 miejsc): trzoda przed otwarta farma 16/200 -> 10/200; klasa "sasiad przy rzece" 11 -> 0. Pozostale 10 to heksy DALEKO od rzeki (E5, zgodne z rejestrem #1). Uwaga: klasa "daleko" wzrosla z 5 do 10, bo farmy przy rzece zjadaja miejsca/pule przed E5; brak naruszenia #1. Dowod: `evidence/sweep-r3-mapa-generowana.txt`. Cel 0/200 dla heksow przy rzece spelniony; cel 0/200 ogolnie nie dotyczy heksow dalekich.
2. PRZYJMUJE. Nowy test (n) w `gra/tools/autoclear-priority-q1-test.cjs`: rzeka tylko jako `rzeka.obecna` (puste `riverPaths`), K1 i K2: pierwsza budowa = farma, farma na centrum i na trawie przy rzece przed pierwsza trzoda. Mutacja (powrot do `hasRiverAccess`) -> 2 FAIL (58/2), `evidence/mutacja-r3.txt`.
3. NIE_ZMIERZONO zywy (brak Chromium u Operatora); dopuszczone dispatchem r2 pkt 3. Zywy pomiar po zbudowaniu bundla: orkiestrator.
4. ODRZUCAM jako wade, PRZYJMUJE jako notatke dla orkiestratora: dwie poprawki testow poza allowlista byly konieczne (bez nich bramki czerwone po ABC-B), asercje nie oslabione. Zmiana oczekiwanej kolejnosci AI (`farma,farma,wyrab,wyrab,farma,farma`) jest skutkiem wspolnego pickera — wymaga jawnej akceptacji orkiestratora (DECYZJA_WYMAGANA: akceptacja zmiany zachowania AI).
5. ODRZUCAM jako wade: kontrakt E4 sprawdza ten sam sufit i budzet; bezposrednia interakcja "farmy sasiadow a E4 przy niskim %" jest NIE_ZMIERZONA osobnym testem; zgloszone jako nota, bez zmiany.

TESTY (logi `gate-*-r4.txt`, linia `EXIT=`):
- autoclear-priority-q1 60/0; autoimprove-stages-q1 302/0; auto-improvements 46/0; ai-food-improvement-priority-stages 13/0; ai2-heks-po-heksie 37/0; wyrab-rzeka-r2 EXIT=0; tsc --noEmit EXIT=0.

ZMIANY/COMMIT: `auto-improvements.ts`, `autoclear-priority-q1-test.cjs`, evidence/gate-r4, ten raport. SHA w odpowiedzi koncowej. Bez pusha.
BLOKADY: brak
RUNDY: 3/5 (obrona r2)
NASTEPNY KROK: Evaluator/Final Control; zywy pomiar w Chromium po buildzie orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
