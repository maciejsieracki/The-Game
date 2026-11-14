# R-WEB-DISBAND-UNIT-MARK-DIRTY-Q1 — obrona Operatora (runda 1, odpowiedź na zarzuty Evaluatora 9e5a4b112)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DISBAND-UNIT-MARK-DIRTY-Q1
GOAL: po `disbandPlayerUnit` prognoza ekonomii przeliczona natychmiast (tooltip i bramka „Zakończ turę”). Bez zmiany logiki ekonomii.
ZMIANY/COMMIT: baza kandydata 3eb3678b7 (Operator), poprawki obrony w commicie tej obrony (SHA w polu sha raportu zwrotnym). Pliki: `gra/src/main.ts` (usunięty zduplikowany blok komentarza, -3 linie, wywołanie `markCityStateDirty()` bez zmian), `gra/tools/disband-unit-mark-dirty-test.cjs` (ignorowanie komentarzy liniowych + opis mutacji 2), `dyspozycje/autobot/runs/R-WEB-DISBAND-UNIT-MARK-DIRTY-Q1/30-obrona-claude.md`. Allowlista zachowana.

## ODPOWIEDZI NA ZARZUTY EVALUATORA

Z1 (test tylko statyczny; zakomentowana poprawka daje 6 passed = fałszywa zieleń) — PRZYJMUJĘ CZĘŚCIOWO
- Poprawka: test usuwa komentarze liniowe `//` z ciała `disbandPlayerUnit` przed asercjami (funkcja `stripLineComments`). Zakomentowane `// markCityStateDirty();` nie jest już liczone jako obecne.
- Dowód mutacji 2 (zakomentowanie wywołania, po poprawce testu): `disband-unit-mark-dirty-test: 3 passed, 3 failed`, EXIT 1 (FAIL: wołanie / PO splice / PRZED refreshD1bHud). Wcześniej: 6 passed.
- Dowód mutacji 1 (usunięcie linii wywołania w ciele funkcji, linia 7729): `3 passed, 3 failed`, EXIT 1.
- Dowód zielonej ścieżki: `disband-unit-mark-dirty-test: 6 passed, 0 failed`, EXIT 0.
- ODRZUCAM wymóg scenariusza WYKONAWCZEGO w Node (dispatch pkt 2: deficyt, realne `disbandPlayerUnit`, odczyt `nnsEndTurnTooltipText`/bramki, stary vs nowy deficyt) w tej rundzie. Powód: `disbandPlayerUnit` żyje wewnątrz zamknięcia `boot()` w `gra/src/main.ts` (DOM, brak eksportu), a `disbandPlayerUnits` jest hakiem testowym w przeglądarce. Jedyna ścieżka wykonawcza to Chromium na zbudowanym bundlu, a zakaz `npm run build` w `gra/` wyklucza zwykły build (dozwolony tylko `vite --outDir /tmp/...`, czego nie robiłem w tej rundzie). Pokrycie behawioralne = NIE_ZMIERZONO, patrz Z3. Test statyczny z odrzucaniem komentarzy jest świadomie wąski: wykrywa usunięcie i zakomentowanie wywołania oraz złą kolejność, nie wykrywa poprawności semantycznej prognozy.

Z2 (zduplikowany blok komentarza w main.ts, 7 linii zamiast ~4) — PRZYJMUJĘ
- Usunięto powtórzone 3 linie komentarza. Wynik: `git diff -- gra/src/main.ts` od 3eb3678b7 pokazuje wyłącznie `-` trzech linii duplikatu. Wywołanie `markCityStateDirty();` nietknięte.
- Zachowanie bez zmian (tylko komentarz).

Z3 (weryfikacja live w Chromium NIE_ZMIERZONO) — PRZYJMUJĘ jako ograniczenie, NIE_ZMIERZONO
- Nie wykonano. Powód: brak haka selekcji jednostki w UI oraz ograniczenie build/dev w `gra/` (patrz ODRZUCAM w Z1). Nie twierdzę, że zachowanie w UI jest zweryfikowane.
- Pokrycie: test statyczny (mutacje powyżej) + analiza przepływu: `nnsGateForPlayer` (main.ts ~39450) woła dirty-gated `refreshLiveEmpireRates`, więc ustawiony dirty przed `refreshD1bHud()` wystarcza do przeliczenia przy następnym odczycie tooltipu/bramki (zgodnie z ustaleniem Evaluatora).
- Zalecenie dla FC: jeśli wymagany jest dowód behawioralny przed deployem, osobny temat z hakiem selekcji jednostki i runnerem live (wzór `gra/tools/live-verify-wave-689-697-a1-title-tax.cjs`).

## TESTY (surowe wyjścia, worktree po poprawkach, gra/)
- `node_modules/.bin/tsc --noEmit`: EXIT 0, brak wyjścia. (Uwaga: `npx tsc` bez lokalnych zależności pobiera TS 6 i zgłasza TS5101 `baseUrl`; zależności zainstalowano `npm ci --ignore-scripts` w worktree, 71 pakietów.)
- `node tools/disband-unit-mark-dirty-test.cjs`: `6 passed, 0 failed`, EXIT 0.
- Mutacja 1 (usunięcie wywołania w `disbandPlayerUnit`): `3 passed, 3 failed`, EXIT 1.
- Mutacja 2 (zakomentowanie wywołania w `disbandPlayerUnit`): `3 passed, 3 failed`, EXIT 1.
- Po każdej mutacji `gra/src/main.ts` przywrócony z kopii (cmp OK).
- `node tools/logic-test.cjs`: `LOGIC OK (213/213)`, EXIT 0.
- `node tools/tech-tree-test.cjs`: `tech-tree-test: 20 pass, 0 fail`, EXIT 0.
- `node tools/research-test.cjs`: `PASSED: 33 / FAILED: 0 / TOTAL: 33`, EXIT 0.
- `node tools/unit-replace-test.cjs`: `WSZYSTKIE TESTY ZIELONE (21/21)`, EXIT 0.
- `node tools/combat-test.cjs`: `COMBAT TEST: 6/6 pass`, EXIT 0.
- `git diff --check`: czysty (brak wyjścia, EXIT 0).

## BLOKADY
- Wymóg behawioralny z dispatchu pkt 2 nie zrealizowany w tej rundzie (patrz Z1, ODRZUCAM z powodem).
- Weryfikacja live NIE_ZMIERZONO (patrz Z3).

## RUNDY
1/5 (obrona odpowiada na rundę 1 Evaluatora). Brak decyzji właściciela wymaganej przez ten temat.

## NASTĘPNY KROK
Evaluator: sprawdzić poprawkę komentarza (Z2) i wzmocnioną mutację (Z1, mutacja 2 teraz FAIL). Final Control: rozstrzygnąć, czy wymagany jest dowód behawioralny/live przed deployem (Z1/Z3). Brak decyzji ABC w tym temacie.

## UWAGI-DLA-ORKIESTRATORA
- Poza zakresem (nie badane w tej rundzie): czy kapitulacja miasta (main.ts ~18435, usuwa jednostki dawnego właściciela) woła dirty, jak zaznaczył Evaluator. Nie zmieniałem tej ścieżki.
- Nie tworzyłem sesji, zadań ani harmonogramów.

DEPLOY/PUSH: NIE WYKONANO
