STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-UI-DIPLO-FACTORS-MILITARY-ROW-CURRENT-ONLY-Q1
GOAL: Panel „ZA CO CIĘ LUBIĄ": jeden wiersz militarny odpowiadający aktualnemu stanowi progu (A: +15, B: −10, brak: zero); wiersze „Wygrana bitwa (historia)" ukryte; reszta bez zmian; liczby i rejestr zdarzeń nietknięte.
ZMIANY-COMMIT: kandydat 3925d8f522566a1c3e4c93eb18afdab585d8790d; baza 64208a85be265d561977181cfe566d637627d256 jest jego przodkiem (merge-base --is-ancestor rc=0). Diff 4 pliki, +199: gra/src/game/diplomacy-factors.ts (+29), gra/src/main.ts (+3, tylko przekazanie respektMilStan/respektMilOffset), gra/tools/diplo-factors-military-row-current-only-test.cjs (nowy), raport Operatora. Allowlista zachowana; brak zmian w diplomacy-military-strength*, parametrach, gra-robocza/kanon, WERSJE.md.
TESTY (własne uruchomienie na kandydacie):
- tsc --noEmit: 0
- test tematu: PROD pass=20 fail=0; mutant (filtr wyłączony) fail=12 (czerwieni, S1-S5)
- logic-test 213/213; tech-tree-test 20/0; research-test 33/33; unit-replace-test 21/21; combat-test 6/6
- pr141-hotseat-diplomacy-owner 10/10; diplo-trust-numbers 22/0; diplomacy-border-era-penalty 39/0; diplomacy-locks 88/0
- dyplo-pakt-ekspansja-granica-test 22/26 (D1-D4 FAIL) — TO SAMO na bazie 64208a85b (22/26, te same D1-D4): istniejący stan, nie regresja kandydata.
Przegląd kodu: pushRow pomija 0, więc stan 'A'/'B' bez offsetu nie daje wiersza; stan 'brak'/null nie daje wiersza; filtr dotyczy tylko prezentacji (log nie jest modyfikowany, test S6). Jedyny odbiorca buildRelationBreakdown poza testami to main.ts (jedno miejsce wywołania, zaktualizowane).
BLOKADY: brak. NIE ZMIERZONO: zrzut panelu w Chromium (opcjonalny w dispatchu).
Zarzuty Evaluatora: brak ([]); obrona: brak.
RUNDY: 1/5 (Final Control)
NASTĘPNY KROK: integracja orkiestratora (merge, bramki, deploy ROBOCZA po osobnej autoryzacji).
UWAGI-DLA-ORKIESTRATORA: dyplo-pakt-ekspansja-granica-test.cjs D1-D4 czerwone już na main 64208a85b — warto osobny temat R-WEB-*.
DEPLOY-PUSH: NIE WYKONANO
