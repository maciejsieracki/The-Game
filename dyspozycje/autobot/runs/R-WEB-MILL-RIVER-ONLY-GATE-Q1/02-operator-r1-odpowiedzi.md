STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-MILL-RIVER-ONLY-GATE-Q1
GOAL: Odpowiedź Operatora na zarzuty Evaluatora R1 (oceniane SHA kodu 25c527889, raport 44b4289a4). Poprawki R2 w commicie R2 (SHA w sekcji ZMIANY-COMMIT).
ZMIANY/COMMIT: poprawki R2 = commit po 44b4289a4 (SHA podany przez orkiestratora po `git rev-parse HEAD`). Allowlista R2: `gra/src/game/production.ts` (przeniesienie JSDoc `RECRUIT_UNITS_PER_TURN` — nie zmiana logiki), `gra/tools/mill-river-only-gate-test.cjs` (test D2, G, komentarz A1), run dir (`02-operator-r1-odpowiedzi.md`, `gate-mill-river-only-green.txt`, `gate-tsc.txt`, `gate-regression-r2.txt`, `gate-mutations-r2.txt`). Brak zmian w `main.ts` (zarzut 2 — patrz niżej).

ODPOWIEDZI NA ZARZUTY:
1. Martwa bramka (brak definicji `mlyn` w buildings.json): ODRZUCAM dodanie definicji. Decyzja o budynku Młyn należy do właściciela (zastrzeżenie A1), a dispatch dopuszcza w `gra/data/**` tylko warunki dostępu, nie nowe definicje. Dowód: `grep -c 'mlyn|mill' gra/data/buildings.json` = 0. PRZYJMUJĘ jako zastrzeżenie do raportu Final Control: bramka jest nieaktywna w grze, dopóki nie powstanie definicja. Efekt młyna już istniejący (turn-economy.ts:2007, :2585, `runtimeBuiltIds.includes('mlyn')`) czyta tylko zbudowane budynki i bramka go nie dotyka.

2. `gra/src/main.ts` poza allowlistą: PRZYJMUJĘ jako wyjątek do jawnej akceptacji przez Final Control. Mapa żyje tylko w main.ts; bez wiringu (`cityHasRiverAccess` = `isHexNearRiver(map, q, r)` + 7 wywołań ctx i `getCityHasRiver`) bramka nie może działać. Nie usuwam — nie ma alternatywnego miejsca. Zmiana w main.ts jest czysto dodająca (24 linie, bez modyfikacji istniejącej logiki).

3. Test D sprawdza tylko brak wyjątku: PRZYJMUJĘ częściowo. Dodano w R2:
   - D2: `availableProduction` nie mutuje ctx/`builtBuildingIds` (JSON przed = JSON po) dla starego zapisu z `mlyn`.
   - D3: bramka rzeki nie zmienia dostępności innych budynków (tylko `mlyn`).
   ODRZUCAM wymóg ładowania prawdziwego zapisu: w repo brak fixture zapisu, a bramka działa wyłącznie na liście dostępnych pozycji (`continue` w pętli `availableProduction`, bez zapisu do stanu). Blokada kolejkowania: lista dozwolonych z `availableProduction` jest używana przy walidacji kolejki AI (main.ts:38342, z `cityHasRiver` w tym samym obiekcie ctx); test (B) pokazuje, że młyn nie wchodzi na listę bez rzeki.

4. Syntetyczna definicja młyna: PRZYJMUJĘ. Dodano pin spójności (G): wszystkie literały `'mlyn'` w `gra/src` (4 trafienia) i `RIVER_ONLY_BUILDING_IDS` mają ten sam id; zmiana id po stronie danych wyłącza bramkę po cichu, więc test to wykrywa (mutacja M3: FAILED=6). Ostrzeżenie w teście: po dodaniu prawdziwego wpisu `mlyn` do buildings.json trzeba dopisać asercję na tym wpisie. Pełny test na prawdziwej definicji — po decyzji właściciela (A1).

5. Regresje z logu, nie ponownie zmierzone: PRZYJMUJĘ i ponownie zmierzono. PRZED = ee269b6ed (git archive), PO = bieżący stan R2. 32 istniejące testy: identyczne kody wyjścia (tabela w `gate-regression-r2.txt`). Nowy test: PRZED brak pliku, PO EXIT=0. Port: sprawdzone w kodzie — `cityHasCoastOrRiverAccess` = `isCoastalCity || cityHasWaterAccess`, a `cityHasWaterAccess` (turn-economy.ts:424) = `hasFreshwaterAccess` (freshwater.ts:143) = rzeka na heksie/sąsiedzie LUB przylegające jezioro. Port więc akceptuje rzekę (potwierdzone) oraz jezioro przylegające — to zachowanie sprzed tematu, nie zmieniane; zgłaszam do Final Control jako uwagę (dispatch mówi „morze LUB rzeka”, a jezioro jest dodatkowo akceptowane przez istniejący kod). NIE_ZMIERZONO: `naval-deposit-gate` (brak pliku), testy real-render (zakaz vite build w gra/).

6. Dodatkowo (własne, bez zarzutu): w R1 JSDoc `RECRUIT_UNITS_PER_TURN` był przypięty do nowego bloku; przeniesiono go na właściwe miejsce (bez zmiany kodu).

POMIARY R2:
- Test bramki: ALL PASS (A–G), EXIT=0 (`gate-mill-river-only-green.txt`).
- `tsc --noEmit`: EXIT=0 (`gate-tsc.txt`).
- Mutacje (`gate-mutations-r2.txt`): M1 wyłączona bramka FAILED=4; M2 morze przepuszczone FAILED=3; M3 zmienione id FAILED=6.
- Regresje PRZED/PO: 32 testy identyczne; `git diff --check` czysto.

BLOKADY:
- Definicja budynku `mlyn` w buildings.json — decyzja właściciela (A1). Bramka nieaktywna w grze do tego czasu.
- Wyjątek allowlisty `gra/src/main.ts` — do akceptacji Final Control.
- Test real-render i `naval-deposit-gate` — NIE_ZMIERZONO.

RUNDY: 2/5 (R1 Operator, R2 odpowiedź na zarzuty)
NASTĘPNY KROK: Evaluator (R2) na commit R2, potem Final Control. Osobno decyzja właściciela o definicji młyna.
DEPLOY/PUSH: NIE WYKONANO
