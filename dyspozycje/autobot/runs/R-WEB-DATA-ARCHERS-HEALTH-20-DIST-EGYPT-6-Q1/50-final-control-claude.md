# R-WEB-DATA-ARCHERS-HEALTH-20-DIST-EGYPT-6-Q1 — Final Control (Claude)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (dane jednostek)
TEMAT: R-WEB-DATA-ARCHERS-HEALTH-20-DIST-EGYPT-6-Q1
GOAL: zdrowie wszystkich pieszych łuczników = 20 (pola `Health` i `health`); Atak dystansowy: Łucznik 5, egipski 6, nubijski 7; reszta bez zmian.

ZMIANY/COMMIT: kandydat 68dd4666ae1e1bd2739b36dcc59d36dd768d96ec (kod: 42f52a2c3; 68dd4666a dodaje tylko raport obrony). integration_sha = 68dd4666ae1e1bd2739b36dcc59d36dd768d96ec.
`git merge-base --is-ancestor b160459c9 68dd4666a` = TAK. `git diff --stat b160459c9..68dd4666a`: 6 plików (units.json 18+/18-, nowy archers-health-dist-data-test.cjs, ranged-damage-mult-test.cjs, unit-card-ranged-mult-test.cjs, raporty 10 i 30) — wszystko w allowliście; nie dotknięto gra/src, WERSJE.md, manifestu, rust-port. Diff units.json przejrzany ręcznie: 6 pieszych łuczników `Health`/`health` = 20 oraz `fieldPower` (cache) przeliczony, egipski `Atak dystansowy` 5->6; koszt, pociski, zasięg, morale, próg dezercji, pancerz bez zmian.

TESTY (surowe wyjście, uruchomione samodzielnie na kandydacie, `npm ci` w gra/):
- `npx tsc --noEmit`: exit 0.
- archers-health-dist-data-test: 9 pass, 0 fail.
- logic-test: LOGIC OK (213/213).
- tech-tree-test: 20 pass, 0 fail.
- research-test: PASSED 33 / FAILED 0.
- unit-replace-test: 21/21.
- combat-test: 6/6 pass.
- ranged-damage-mult-test, unit-card-ranged-mult-test, unit-power-test, unit-power-sort-test, load-game-regression-test, battle-hp-display-test: exit 0 (zaktualizowane asercje mocy Łucznik 21 / egipski 20 / asyryjski tooltip 21 wynikają z zdrowia 20).
- Czerwone: city-defense-terrain-gate-test, structure-defense-bonus-test, fortify-pole-test, bitwa-auto-atak-wielojednostkowy-evaluation-test (exit 1). Po podmianie `gra/data/units.json` na bazowy b160459c9: te same 4 testy, te same liczby linii FAIL (2/2/3/6) i identyczna treść linii FAIL (diff pusty) => dług sprzed tematu, nie regresja.
- NIE ZMIERZONO: testy przeglądarkowe/live, vite build (temat danych, bez UI).

ROZSTRZYGNIĘCIE ZARZUTÓW:
1. missileAttack (silnik czyta `missileAttack`, nie `Atak dystansowy`): DO DECYZJI CZŁOWIEKA. Realna decyzja balansu (Łucznik 3->5 to +67% obrażeń dystansowych; nubijski 6->7). Dispatch zakazuje zmiany innych parametrów; Operator słusznie nie ruszył. Zmiana egipskiego 5->6 w polu `Atak dystansowy` jest zgodna z dosłowną decyzją właściciela, ale bez efektu w silniku. Nie NAPRAW.
2. Wiki/poradnik „Moc w polu” łuczników (17.5…): ODDAL. Dług sprzed tematu (wiki 17.5, baza 19, kandydat 21); generator bundle nie czyta units.json, więc nie jest regresją kandydata; ręczna edycja bez ustalonej formuły poza zakresem. Brak NAPRAW => brak FAIL.

BLOKADY: brak blokad technicznych.
RUNDY: 1/5 (Final Control po rundzie obrony).

UWAGI-DLA-ORKIESTRATORA:
- Pytanie ABC do właściciela: czy ustawić `missileAttack` (A: bez zmian, tylko pole wyświetlane; B: Łucznik 3->5, nubijski 6->7, egipski 6 bez zmian). Rekomendacja Obrony: B. Zmiana wpływa na balans bitew i Rust REPIN.
- Dług: wiki/poradnik 57-katalog-jednostek.md „Moc w polu” łuczników niezgodna z fieldPower (jak wyżej) oraz snapshoty historyczne (intrinsic-unit-power*.md, TW-v3-migracja-jednostek.md, dystans-*) ze starymi liczbami.
- Dług Rust: REPIN danych łuczników (zdrowie 20, egipski dyst. 6).
- Temat #449 (jedno pole zdrowia) może startować po wdrożeniu tego tematu.

NASTĘPNY KROK: integracja orkiestratora (merge/FF 68dd4666a), bramki, deploy ROBOCZA po osobnej autoryzacji.
DEPLOY/PUSH: NIE WYKONANO
