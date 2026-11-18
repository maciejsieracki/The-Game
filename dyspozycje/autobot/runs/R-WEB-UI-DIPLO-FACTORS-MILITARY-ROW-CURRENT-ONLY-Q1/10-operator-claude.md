# R-WEB-UI-DIPLO-FACTORS-MILITARY-ROW-CURRENT-ONLY-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-DIPLO-FACTORS-MILITARY-ROW-CURRENT-ONLY-Q1
GOAL: Panel „ZA CO CIĘ LUBIĄ": wiersz militarny tylko jeden, zgodny z aktualnym stanem progu (A → „Przewaga militarna" +respektMilOffset; B → „Słabszy militarnie" respektMilOffset; brak → brak wiersza); historia zdarzeń militarnych nie jest pokazywana; wpis „Wygrana bitwa (historia)" usunięty z rozbicia (decyzja B, DODATEK 1). Zapis zdarzeń, liczby Respektu i pasek nietknięte.
ZMIANY-COMMIT: 8b84c5059aaf861b24bd721e3cbe4580c83634bd (baza 64208a85b)
- gra/src/game/diplomacy-factors.ts: pola `respektMilStan`, `respektMilOffset` w ContinuousFactorFlags; zbiór HIDDEN_BREAKDOWN_EVENT_KEYS (przewaga/słabszy militarnie, wygrana_bitwa_respekt) pomijany w pętli historii; jeden wiersz militarny aktualnego stanu przed historią.
- gra/src/main.ts (getRelationBreakdown, ~24559): dwa pola przekazane z getDiploPairMeta(a,b) — minimalne wpięcie.
- gra/tools/diplo-factors-military-row-current-only-test.cjs (nowy).
- Zmiany w renderze UI: brak (diplomacyAudience.ts konsumuje rows bez duplikatu).
TESTY:
- tsc --noEmit: exit 0, 0 linii błędów.
- logic-test: 213 PASS, 0 FAIL.
- tech-tree-test: 20 pass, 0 fail.
- research-test: PASSED 33 / FAILED 0.
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21).
- combat-test: "All sanity checks passed" (exit 0).
- diplo-factors-military-row-current-only-test (nowy): PROD pass=20 fail=0; MUTANT (filtr wyłączony = przywrócenie historii) fail=12, exit 1 jako oczekiwane. Sceny: S1 [A@2,A@6,B@8] stan B → 1 wiersz „Słabszy militarnie” −10, 0 „Przewaga”; S2 [A@2,B@4,A@6] stan A → 1 wiersz +15, suma = offset; S3 brak zdarzeń/brak/null → 0; S5 4× wygrana_bitwa → 0 wierszy, inne wiersze bez zmian; S6 log nietknięty.
- diplomacy-locks-test 88/0; diplo-trust-numbers-test 22/0; diplo-trust-war-drift-test 14/0; diplo-trust-war-n6-cleanup-test 17/0; diplomacy-border-era-penalty-test 39/0; diplomacy-test 149/0; diplomacy-infografiki-tooltipy-test 12/0; diplo-respect-military-events-test 30/0; diplo-respect-military-edge-test 12/0; diplo-respect-military-offset-test 12/0; diplo-respect-battle-win-plus5-test (exit 0); dyplo-rel-current-etykieta-test 5/0; diplomacy-relation-labels-test 23/0; diplomacy-display-test 45/0; pr141-hotseat-diplomacy-owner-test (exit 0); diplomacy-relation-deal-text-consistent-test 6/0.
- dyplo-pakt-ekspansja-granica-test: 22/26 — NIE przez ten temat: identyczny wynik 22/26 na bazie 64208a85b (zmierzone: checkout bazy, test, przywrócenie HEAD). Pre-existing, poza allowlistą.
- diplomacy-respect-true-value-real-render-test: NIE ZMIERZONO — wymaga Chromium pod ścieżką chromium-1194, która nie istnieje (crash launch).
- Zrzut PRZED/PO z Chromium: NIE ZMIERZONO (opcjonalne, pominięte). Tekst panelu PRZED/PO wyprowadzony z buildRelationBreakdown w teście, nie z renderera.
BLOKADY: brak w zakresie. Uwaga: nieśledzony plik gra/tools/.rtv-bundle.js (powstał w trakcie uruchamiania testów; nie dodany do commita, nie usunięty — zakaz rm).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator — weryfikacja diffu 64208a85b..8b84c5059 i mutacji; wizualna weryfikacja panelu w przeglądarce, jeśli wymagana przez właściciela.
UWAGI-DLA-ORKIESTRATORA: (1) Pre-existing failure dyplo-pakt-ekspansja-granica-test 22/26 na bazie — do osobnego tematu. (2) Test real-render diplomacy-respect-true-value wymaga ścieżki chromium-1194 (w /opt/pw-browsers jest chromium-1243). (3) Zakaz tworzenia sesji/zadań nie był w konflikcie z żadnym krokiem; nic nie utworzono.
DEPLOY/PUSH: NIE WYKONANO
