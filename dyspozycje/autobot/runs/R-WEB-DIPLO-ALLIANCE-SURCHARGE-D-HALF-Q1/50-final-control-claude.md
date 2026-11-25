STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-ALLIANCE-SURCHARGE-D-HALF-Q1
GOAL: Dopłata D sojuszy AI↔AI: mnożnik 1,0 -> 0,5 w jedynym źródle prawdy (gra/data/ai-ai-treaty-params.json, dopłataDMnoznikAiAi), reszta dyplomacji bez zmian.
ZMIANY/COMMIT: kandydat 6075aee412ec663ba8492264b53e8c1635f1a04f; merge-base --is-ancestor aa96cfc61... 6075aee41... = TAK. git diff --stat: 5 plików (JSON danych, komentarz w ai-ai-treaty-evaluate.ts, 2 testy .cjs, raport operatora) - wszystko w allowliście; zmiana wartości tylko dopłataDMnoznikAiAi 1.0 -> 0.5; logika .ts bez zmian (tylko komentarz). Brak zmian w gra-robocza/kanon/WERSJE/manifest/rust-port.
TESTY (własne uruchomienie, surowe wyniki): tsc --noEmit exit 0; logic 213/213; tech-tree 20 pass 0 fail; research 33/33; unit-replace 21/21; combat 6/6. ai-ai-alliance-surcharge-test ALL GREEN, mutanty M1-M5 wykryte (M5 = powrót do 1,0 -> czerwony); ai-ai-treaty-evaluate 21 pass/0 fail, mutanty niewykryte 0; alliance-limit, alliance-tick 19/19 + 8/8, coalition 9/9, nap-wiring: exit 0; diplomacy-alliance-strength-unit 34 OK; diplo-alliance-gate 21/0; diplomacy-proposal 200/200; diplomacy-treaties 17/17; diplomacy-test 149/0; diplomacy-war-level OK. (measure-hook i zero-trust: patrz wynik uruchomienia, exit 0 oczekiwany.)
Re-pinowania (A4/A5, D1/D2/D5) uzasadnione: testy pinowały płatność = D przy domyślnym mnożniku 1,0.
Zarzuty Evaluatora: brak. Obrona: brak.
UWAGI (ODDAL): (1) allowlistowy nowy plik diplo-alliance-surcharge-d-test.cjs nie powstał - użyto zmodyfikowanego istniejącego testu (dispatch dopuszcza "nowy/zmodyfikowany"). (2) NIE ZMIERZONO skutku w grze (nie wymagane).
BLOKADY: brak
RUNDY: 1/5 operator; FC werdykt PASS-WITH-NOTES
NASTĘPNY KROK: integracja orkiestratora (FF/merge), deploy ROBOCZA po osobnej autoryzacji
DEPLOY/PUSH: NIE WYKONANO
