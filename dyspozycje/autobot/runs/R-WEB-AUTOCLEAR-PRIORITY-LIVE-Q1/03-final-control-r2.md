STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AUTOCLEAR-PRIORITY-LIVE-Q1
GOAL: Farma przed trzoda przy rzece (rejestr #1); heks sasiadujacy z rzeka = heks nad rzeka (ABC-B). Final Control RUNDA 2 (kod d7d4f9f91; r1 zostaje w 03-final-control.md).

ZARZUTY (Evaluator r2):
1. Luka `rzeka.obecna` bez `riverPaths`: ODDAL. Naprawione w d7d4f9f91 (`onRiverHex`, auto-improvements.ts ~:1187). Sweep r3: klasa sasiada 11 -> 0, razem 16 -> 10/200; 10 = heksy daleko od rzeki (E5, zgodne z #1). Wzrost 5 -> 10 to przypuszczenie Obrony, niezmierzone (NOTA).
2. Brak testu luki: ODDAL (test (n)). Mutacja FC `onRiverHex = hasRiverAccess`: 58 passed / 2 failed ([K1], [K2] "obie farmy PRZED pierwsza trzoda").
3. NIE_ZMIERZONO zywy w Chromium: ODDAL jako nota; zywy pomiar po bundlu orkiestratora.
4. Testy poza allowlista (ai-food-improvement-priority-stages, wyrab-rzeka-r2 test 5): ODDAL, minimalne, asercje nie oslabione. NOTA dla orkiestratora: zmiana kolejnosci AI (`farma,farma,wyrab,wyrab,farma,farma`) wynika ze wspolnego pickera — wymaga jawnej akceptacji.
5. Kontrakt E4 przez `placedE1Done()`: ODDAL (sufit/budzet nietkniete); brak testu "farmy sasiadow a E4 przy niskim %" (NOTA).

TESTY (FC, detached d7d4f9f91, npm ci --ignore-scripts): autoclear-priority-q1 60/0; autoimprove-stages-q1 302/0; auto-improvements 46/0; ai-food-improvement-priority-stages 13/0; wyrab-rzeka-r2 10/0; ai2-heks-po-heksie 37/0; tsc --noEmit bez bledow.
ALLOWLISTA: kod tylko gra/src/game/auto-improvements.ts; testy autoclear-priority-*, autoimprove-stages-q1 + 2 testy poza lista (pkt 4). Zero zmian: gra-robocza, WERSJE.md, rust-port, generator map.
INTEGRACJA: merge-tree d7d4f9f91 z origin/main (97dbcb416) czysty; main zmienil tylko ai.ts, clusters.ts, ai-params.json, testy ai-avoid-polar.
KOLEJNOSC: niezalezne od origin/rust-port/parity-v2 (zmiana tylko w gra/); web do main bez zaleznosci od parity-v2.
SHA DO INTEGRACJI: d7d4f9f91 (+ commit tego raportu).
BLOKADY: brak
RUNDY: FC r2
NASTEPNY KROK: integracja orkiestratora, bundle, zywy pomiar Chromium, akceptacja zmiany kolejnosci AI
DEPLOY/PUSH: NIE WYKONANO
