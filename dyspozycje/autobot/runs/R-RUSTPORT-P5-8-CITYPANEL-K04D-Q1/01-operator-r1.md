STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K04D-Q1
GOAL: Port kart paska gornego TopBar `buildTopBar*DetailCard` (pin `gra/src/ui/cityPanel.ts` edb8fb56) do `src-tauri/frontend-v2/src/ui/cityPanel/k04d-*.ts`, bez lokalnych reguł gry (P5.13).
ZMIANY/COMMIT: allowlista — `src-tauri/frontend-v2/src/ui/cityPanel/k04d-{zycie,gospodarka,kultura}.ts` (nowe), `src-tauri/frontend-v2/src/viewmodel/types.ts` (dopisek `k04d`), `src-tauri/frontend-v2/tools/dom-harness/{run,mutate}-k04d-units.mjs` (nowe), `src-tauri/frontend-v2/PORTING-QUEUE.md` (dopisek), `dyspozycje/rust-port/p5/P5-8-K04D.md` (nowy), ten raport. Commit kodu: `7b27a5b1`. Commit harnessu/dokumentacji: patrz `git log -1` na gałęzi (SHA w odpowiedzi orkiestracji). Zero zmian w `gra/**`, rust-port, `WERSJE.md`, `package.json`. PUSH: NIE WYKONANO.
TESTY: `npm run typecheck` EXIT 0; `npm run check` EXIT 0 (self-test 33/15, 0 trafień importów logiki, pin copies 435/0); `node tools/dom-harness/run-k04d-units.mjs` 67/67 zielone, jsdomErrors 0; `node tools/dom-harness/mutate-k04d-units.mjs` 17/17 wykryte EXIT 0.
BLOKADY: brak techniczna. Luki DTO rozstrzygnięte założeniami K04D-Z1..Z6 (w P5-8-K04D.md): podział pracy z silnika zamiast niezintegrowanego K04B; `CityMoneySnapK04D` zamiast placeholdera `CityMoneySnapDto`.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (kontrola zgodności z pinem, zakres 7/8 — Rekruci w K03) → Final Control → integracja orkiestratora. Podpięcie `wireTopBarStatDetails` (pin :6056) i wypełnienie `panelInputs.k04d` w controllerze — K09, poza tematem.
DEPLOY/PUSH: NIE WYKONANO
