# R-WEB-AI-TRADE-ONESHOT-OVERPAY-LIMIT-Q1 — raport obrony Operatora (runda 1, odpowiedź na zarzuty Evaluatora)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-TRADE-ONESHOT-OVERPAY-LIMIT-Q1
GOAL: jednorazowa oferta handlowa AI -> gracz nie oddaje więcej PW, niż AI otrzymuje (givePn <= receivePn), jak oferta cykliczna (A1). Dar AI, kierunek gracz -> AI i podgląd „Przyjmij" gracza bez zmian.
BAZA: 6b20b266f (kandydat z zarzutów; potomek b4853c8e6 = origin/main FALA 664).

## ZMIANY / COMMIT (allowlista)

- SHA kodu obrony: `c842cd2df6badd0db9c40a75eaf5ac2a1316bd21` (parent 6b20b266f), pliki: `gra/src/game/diplomacy-proposals.ts`, `gra/src/main.ts`, `gra/tools/ai-trade-oneshot-overpay-limit-test.cjs`.
- SHA tego raportu: osobny commit na tej samej gałęzi (podany w polu sha wyniku).
- Nie wypchnięto, nie zintegrowano, nie deployowano.

## ODPOWIEDZI NA ZARZUTY EVALUATORA

**Zarzut 1 — brak dowodu mutacyjnego dla wywołania filtra w main.ts: PRZYJMUJĘ.**
Poprawka: predykat (actionId 'handel', typ różny od cyklicznej, !isGift, givePn > receivePn) przeniesiony do jednego helpera `aiOneshotHandelOverpaysPlayer(actionId, cmdType, payload, pnOpts)` w `diplomacy-proposals.ts`. Filtr w `main.ts` to teraz jedno wywołanie `if (aiOneshotHandelOverpaysPlayer(converted.actionId, workingCmd.type, balancedPayload, pnBalanceOpts)) { return; }`.
Dowody mutacyjne (surowe wyniki tej rundy, każda mutacja przywrócona po pomiarze):
- mutacja filtra w main.ts (`if (false && aiOneshotHandelOverpaysPlayer(...))`) -> `node tools/ai-trade-oneshot-overpay-limit-test.cjs` EXIT 1 (strażnik wiringu: asercja „main.ts enqueue filter calls aiOneshotHandelOverpaysPlayer(...)" pada),
- mutacja helpera (`if (true) return false;` na początku ciała) -> EXIT 1,
- po przywróceniu: `ai-trade-oneshot-overpay-limit-test: 10 assertions passed`, EXIT 0.
Uwaga uczciwości: strażnik wiringu jest testem źródłowym (regex na tekście main.ts), nie zachowaniem bootu. Boot main.ts nie jest izolowalny w teście jednostkowym; zachowanie w żywej grze mierzy `ai-trade-wiring-e2e-live-test` (patrz niżej), który NIE ma asercji na nadpłatę jednorazową.

**Zarzut 2 — próżne asercje `/nadpłacona/` i „direction is decided by caller": PRZYJMUJĘ.**
Dowód: `grep -c nadpłacona gra/src/game/diplomacy-proposals.ts` -> 0 (przed poprawką). Obie asercje usunięte. Nowe asercje są rozróżniające: każda ma wynik `=== true` lub `=== false` dla konkretnego kształtu payloadu i actionId/typu (patrz test, 10 asercji). Kierunek gracz -> AI nie jest już udawany asercją na helperze; helper nie ma kierunku, decyduje wywołujący (main.ts filtruje tylko enqueue proponenta AI).

**Zarzut 3 — rozbieżność z GOAL (evaluateProposal nie zmieniony; oferta tylko odrzucana, nie ograniczana; live e2e NIE_ZMIERZONO): CZĘŚCIOWO PRZYJMUJĘ, CZĘŚCIOWO ODRZUCAM z dowodem.**
- Brak zmiany w `evaluateProposal` — ODRZUCAM jako błąd, zostaje założenie Operatora z raportu `10-operator-claude.md`: wersja w evaluateProposal (responderIsPlayer) łamała istniejące asercje `dyplo-handel-oferta-ai-blokowana-test` (4 FAIL) i `diplomacy-proposal-test` (2 FAIL) — cytat z 10-operator-claude.md. Ta liczba NIE została ponownie zmierzona w tej rundzie (NIE_ZMIERZONO w tej rundzie); zapisuję jako cytat poprzedniego pomiaru. Obecna zielona bramka tych dwóch testów (poniżej) dowodzi tylko, że stan obecny jest zielony, nie że wariant z evaluateProposal byłby zielony.
- „Odrzucana, nie ograniczana" — ODRZUCAM: kryterium KRYTERIA tematu wprost dopuszcza „odrzucona/ograniczona"; oferta wycofywana zamiast przycinania to zgodne z kryterium.
- „Po trimie może wyciszać oferty jednorazowe" — NIE_ZMIERZONO: nie zmierzono częstości ofert jednorazowych przed/po zmianie; deklaruję jako otwarte ryzyko do pomiaru (zob. W35 w rejestrze: częstość ofert AI).
- Live e2e — PRZYJMUJĘ jako dowód do dodania: uruchomiony w tej rundzie, wynik poniżej.

**Zarzut 4 — dar bez `isGift` z niezerowym receivePn przechodzi jako handel, brak testu: PRZYJMUJĘ (test dodany).**
Dodane asercje:
- `giveItems:[drewno x2], givePn 0, receivePn 0` (dar bez flagi, brak PW wpływającego) -> `false` (zwolniony),
- `giveItems:[drewno x2], givePn 200, receivePn 100` (ten sam kształt z receivePn > 0 = handel, nie dar) -> `true` (nadpłata wykryta).
Heurystyka jest zgodna z definicją: dar to brak receivePn po stronie AI; receivePn > 0 oznacza handel.

## TESTY (surowe wyniki tej rundy, EXIT z pierwszego planu)

- `npm ci --ignore-scripts` w `gra/` -> EXIT 0. `npm run build/dev` NIE uruchamiane (zakaz).
- `npx tsc --noEmit` -> EXIT 0 (wynik po zmianach).
- `node tools/ai-trade-oneshot-overpay-limit-test.cjs` -> `10 assertions passed`, EXIT 0.
- `node tools/ai-trade-proposal-branch-test.cjs` -> `10 passed, 0 failed`, EXIT 0.
- `node tools/ai-trade-proposal-to-player-test.cjs` -> `25 assertions passed`, EXIT 0.
- `node tools/diplomacy-proposal-test.cjs` -> `200/200 PASS`, EXIT 0.
- `node tools/dyplo-handel-oferta-ai-blokowana-test.cjs` -> `20 OK, 0 FAIL`, EXIT 0.
- Bramki referencyjne (z dispatchu):
  - `node tools/logic-test.cjs` -> `LOGIC OK (213/213)`, EXIT 0.
  - `node tools/tech-tree-test.cjs` -> `tech-tree-test: 20 pass, 0 fail`, EXIT 0.
  - `node tools/research-test.cjs` -> `PASSED: 33 / FAILED: 0 / TOTAL: 33`, EXIT 0.
  - `node tools/unit-replace-test.cjs` -> `WSZYSTKIE TESTY ZIELONE (21/21)`, EXIT 0.
  - `node tools/combat-test.cjs` -> `COMBAT TEST: 6/6 pass`, EXIT 0.
- Live `node tools/ai-trade-wiring-e2e-live-test.cjs` (vite bundle poza repo, headless Chromium `/usr/bin/chromium`, `AITW_RESULT` w scratchpad) -> `ai-trade-wiring-e2e-live-test: 44 pass, 0 fail`, EXIT 0. UWAGA: ten test sprawdza przepływ cykliczny i akceptację; NIE zawiera scenariusza nadpłaty jednorazowej, więc nie jest dowodem na samą poprawkę.
- `git diff --check` -> czysto.

## BLOKADY

Brak blokad technicznych. NIE_ZMIERZONO w tej rundzie: ponowny pomiar wariantu evaluateProposal (cytat z 10-operator-claude.md); częstość ofert jednorazowych po trimie; scenariusz nadpłaty jednorazowej w żywej grze.

## RUNDY

1/5 (obrona). Brak nowych zarzutów poza czterema powyżej.

## NASTĘPNY KROK

Evaluator: przegląd dowodu mutacyjnego (filtr i helper) i nowych asercji gałęzi; ewentualnie pomiar wariantu evaluateProposal oraz częstości ofert, jeśli uzna, że są wymagane przez GOAL.

## DEPLOY / PUSH

NIE WYKONANO
