# R-WEB-UI-RESOURCE-SOURCE-LEDGER-SHOTS-DOCS-PERF-Q1 — obrona Operatora (runda 2/5, odpowiedź na zarzuty Evaluatora r2, 20-evaluator-claude.md, commit c9f475e1f)

STATUS: BLOCK (częściowy: zarzuty 2, 3, 4 i 5 obsłużone; zarzut 1 PRZYJĘTY, GOAL 1 NIEWYKONANY)
DOMAIN: GAME
TEMAT: R-WEB-UI-RESOURCE-SOURCE-LEDGER-SHOTS-DOCS-PERF-Q1
GOAL: (1) zrzuty soli i ceramiki z gry, 1280/1920 px — NIEWYKONANE; (2) dokumentacja + wikiBundle — zrobione w r1 (bez zmian w r2); (3) pomiar wydajności — dane z r2 bez zmian, ocena ograniczona; (4) diagnoza endTurn t57 — NIEODTWORZONA, bez rozstrzygnięcia; (5) stan `<details open>` — naprawa z r2 + test regresji dodany w tej rundzie.
BAZA: kandydat 372b98c33 (worktree wykonany na tym SHA; diff względem origin/main liczony od 807ecebdd).
ZMIANY/COMMIT: `1ae2778f2` — `gra/tools/resource-ledger-skad-dom-test.cjs` (test D6/D7 dla stanu details); plus ten raport `30-obrona-claude.md` (commit po teście). Kod gry nietknięty (`empireDetailPanel.ts` przywrócony do wersji 372b98c33 po mutacji — `git status` czysto poza testem).

## Odpowiedzi na zarzuty Evaluatora

1. **PRZYJMUJĘ — GOAL 1 nie jest wykonany, nie ma zrzutów soli i ceramiki z gry.** Sprawdzone w tej rundzie: w repo nie ma hooka pozwalającego postawić Warzelnię ani Garncarnię w trakcie gry. `__buildRequestTestDebug.applyBuildRequest` dotyczy ulepszeń terenu, `__aiBuildingsTestDebug` nie ma funkcji stawiającej budynki gracza, a `main.ts` (gdzie leżą haki) nie jest w allowliście tego tematu. Dodanie haka wymaga decyzji orkiestratora (zmiana allowlisty) albo osobnego tematu. Makieta DOM nie jest zrzutem z gry i nie jest tu przedstawiana jako zrzut. Status: NIE WYKONANO (powód: brak haka w allowliście).

2. **PRZYJMUJĘ i NAPRAWIONO — brak testu regresji dla stanu details.** Commit `1ae2778f2` w `gra/tools/resource-ledger-skad-dom-test.cjs`:
   - **D6 (Chromium, zachowanie):** funkcje `captureSkadDetailsOpen` / `restoreSkadDetailsOpen` są eksportowane z `empireDetailPanel.ts` i wstrzykiwane do strony przez `toString()` z bundla. Strona: gracz zwija blok „sól” i rozwija blok „ceramika”, następnie `innerHTML` z tym samym markupem, `restore`. Wynik odczytany z DOM: `sol=0;ceramika=1;keys=ceramika,sol`.
   - **D7 (kolejność w kodzie):** regex na `empireDetailPanel.ts`: `captureSkadDetailsOpen(bodyEl);` → `bodyEl.innerHTML = body;` → `restoreSkadDetailsOpen(bodyEl, skadOpenPrev);`.
   - **Mutacja (dowód):** w kopii `empireDetailPanel.ts` usunięto linię `restoreSkadDetailsOpen(bodyEl, skadOpenPrev);`. Surowy wynik: `FAIL D7 render(): capture PRZED innerHTML, restore PO innerHTML (kolejnosc w kodzie)` oraz `resource-ledger-skad-dom-test: 12 passed, 1 failed`. Plik przywrócony (`cp` z kopii), `git status` pokazuje tylko test.
   - **Granica:** D6 sprawdza helpery, nie samo wywołanie w `render()`. Wywołanie w `render()` pilnuje D7 (statyczne). Test live w przeglądarce (`__measureOpenPanel`) nadal nie jest w repo; nie twierdzę, że jest.
   - Wynik pełnego testu po zmianie: `resource-ledger-skad-dom-test: 13 passed, 0 failed` (D1–D7).

3. **PRZYJMUJĘ — wniosek „nie księga” z r2 był niepodparty; korygowany.** Poprawny stan: timeout endTurn przy turze 57 NIE został odtworzony w 100 turach (seed 4242, ON i OFF, 0 zawieszeń; tura 57: ON 8398 ms, OFF 9271 ms), przy konfiguracji r2 (preset podatku 60/30/10, równoległe przebiegi). Konfiguracja, w której wystąpił timeout w r3, nie jest znana. Dlatego:
   - **Przyczyna: NIEROZSTRZYGNIĘTA.** Nie stwierdzono związku z księgą w odtworzonej konfiguracji i nie wykluczono go dla konfiguracji r3.
   - Odblokowanie #415/#417 na podstawie „braku odtworzenia” jest ryzykowne. Rekomendacja: traktować #415 jako nadal zablokowany do czasu odtworzenia timeoutu w znanej konfiguracji, albo jako świadomie zaakceptowane ryzyko (decyzja orkiestratora).
   - Korekta jest tylko w tym raporcie. Raport `10-operator-claude.md` (r2) nie jest nadpisywany, bo to historia rundy.

4. **PRZYJMUJĘ — pomiar nie rozstrzyga progu 10%.** Dane (surowe, `evidence/perf100/`): średnie z 99 tur ON 7735/7780/7116/8103/7350 ms, OFF 7806/7737/7190/7933/7414 ms. Rozstrzał ON 7116–8103 (~14%) jest większy niż próg 10%, więc ten design nie wykrywa regresji poniżej ~14%. Mediana ON 7735 vs OFF 7737 ms (−0,03%) jest zgodna z brakiem regresji, ale nie jest dowodem jej braku na poziomie 10%. Tura startowa jest szumna (2296–3764 ms). Mikropomiar `ownerResourceStockAll` — NIE_ZMIERZONO (brak w tej rundzie). Wniosek: wynik „brak regresji >10%” jest **niewiarygodny ze względu na szum**, nie „potwierdzony”.

5. **PRZYJMUJĘ — bramki referencyjne uruchomione w tej rundzie (surowe wyjścia, worktree 1ae2778f2 bez zmian kodu gry):**
   - `node ./node_modules/typescript/bin/tsc --noEmit` → rc=0 (bez wyjścia)
   - `node tools/logic-test.cjs` → `LOGIC OK (213/213)`
   - `node tools/tech-tree-test.cjs` → `tech-tree-test: 20 pass, 0 fail`
   - `node tools/research-test.cjs` → `PASSED: 33 / FAILED: 0 / TOTAL: 33`
   - `node tools/unit-replace-test.cjs` → `WSZYSTKIE TESTY ZIELONE (21/21)`
   - `node tools/combat-test.cjs` → `COMBAT TEST: 6/6 pass`
   - `node tools/resource-ledger-test.cjs` → `resource-ledger-test: 1030 passed, 0 failed`
   - `node tools/resource-ledger-skad-ui-test.cjs` → `resource-ledger-skad-ui-test: 18 passed, 0 failed`
   - `node tools/resource-ledger-skad-dom-test.cjs` → `13 passed, 0 failed`
   - `git diff --check` → rc=0, bez wyjścia
   - Uwaga: przy testach z `| tail` kod wyjścia pochodzi z `tail`; zielone wyniki są z treści wyjścia (linie podane wyżej), nie z rc.

## Pozostałe uwagi Evaluatora (bez zarzutu, zgodnie z jego ustaleniem)

- **Baza:** dispatch podawał `fc4e8dcb5`, który nie jest przodkiem kandydata; kandydat 372b98c33 jest bazą tej rundy zgodnie z poleceniem „startuj od 372b98c33”. Zgodne z zadaniem.
- **00-dispatch.md** nie istnieje w origin/main; czytano z gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (DODATEK 2). Zgodnie z r2.
- **Harness:** blokada bramki podatku w turze 1 (dług harnessu, bez zmian; w kopii pomiarowej obejście `setTaxSplit(60,30,10)`).

## BLOKADY

- GOAL 1: zrzuty soli i ceramiki z gry — brak haka stawiania budynków (main.ts poza allowlistą). Wymaga decyzji orkiestratora.
- GOAL 4: przyczyna timeoutu nierozstrzygnięta (nieodtworzony w znanej konfiguracji).
- GOAL 3: pomiar z szumem ponad próg 10%; mikropomiar NIE_ZMIERZONO.
- Test live stanu details w przeglądarce nie jest w repo (wymaga haka `__measureOpenPanel` spoza repo); pokryte testem statycznym i helperami.

## RUNDY

2/5 (ten sam ID; obrona r2). Ostatni werdykt Evaluatora: PASS-WITH-NOTES (c9f475e1f), z zarzutami 1–5 tu obsłużonymi.

## NASTĘPNY KROK

- Orkiestrator: (a) decyzja, czy dodać hak stawiania Warzelni/Garncarni (zmiana allowlisty `main.ts`) — wtedy osobny temat na zrzuty soli i ceramiki; (b) decyzja w sprawie #415/#417 wobec nierozstrzygniętej diagnozy endTurn; (c) osobny temat na mikropomiar `ownerResourceStockAll` z większą liczbą powtórzeń, jeśli wymagany jest próg 10%.

SHA końcowy testu: 1ae2778f2 (raport: commit po nim, pole sha w odpowiedzi).

DEPLOY/PUSH: NIE WYKONANO
