STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K09B-Q1
GOAL: Produkcyjny punkt instalacji panelu miasta (frontend-v2): jeden `installCityPanelWiring`, mapowanie id number<->string w jednym adapterze, rejestracja mostu `cityPanelUxBridge`, test wykonania showCityPanel -> paint -> hideCityPanel w jsdom z mutacjami, tabela długu.
ZMIANY/COMMIT: allowlista: `src-tauri/frontend-v2/src/controller/{cityPanelWiring,cityIdAdapter,cityPanelK06bDelegates}.ts` (nowe; ostatni był wygenerowany), `src-tauri/frontend-v2/tools/dom-harness/{gen-k09b-k06b-delegates,run-k09b-wiring,mutate-k09b}.mjs` (nowe), `src-tauri/frontend-v2/PORTING-QUEUE.md` (dopisek), `dyspozycje/rust-port/p5/P5-8-K09B.md` (nowy), `dyspozycje/autobot/runs/R-RUSTPORT-P5-8-CITYPANEL-K09B-Q1/**`. Baza `origin/rust-port/parity-v2` = fb55afe2. SHA commitu: patrz nota poniżej. Brak zmian w `gra/**`, `WERSJE.md`, `package.json`, istniejących wiringach.
TESTY:
- `npm ci` exit 0; `npm run typecheck` exit 0, 0 błędów (baseline 0).
- `npm run check` exit 0 (self-test 33/15; 223 plików bez trafień; verify-pin-copies pin edb8fb56, 435 plików, 0 niezgodnych).
- `run-k09b-wiring.mjs` 28/28 (adapter A1-A9; przed instalacją rzuca `brak setK09aDeps`; po instalacji showCityPanel->paint przez most->hideCityPanel bez wyjątku i bez `undefined`; sprzątanie K06A; nawigacja; delegaty K08D/K08E/K07B).
- `mutate-k09b.mjs` 20/20 zabitych (pominięcie każdego wiringu, rejestracji, delegatu ręcznego i adaptera; kolejność K08C/K09A).
- Regresja: `run-k09a-wiring` exit 0 (10/10), `run-k08d-wiring` exit 0. `run-k08c-wiring` wymaga `--pin-dir` (NIE_ZMIERZONO).
- Logi: `r1-logi/` (typecheck, check, harness, mutate, regresja).
BLOKADY: brak techniczna. Luki ZAŁOŻONE w dokumencie (nie pytania): K09B-Z1 (most bez `map`: mapa zapamiętywana przed ramką), K09B-Z2 (wybór kopii przy 7 nazwach z wieloma definicjami), K09B-Z3, K09B-Z4.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (i Final Control) — zweryfikować zwłaszcza: (a) K09B-Z1 i D3; (b) D6 — defekt id `pinnedGarrisonCityId` (string) vs `city.id` (number) w `k06b-garnizon.ts:68` i `k09a-paint.ts:45`, NIE objęty adapterem; (c) wybór kopii Z2 (zgodność treści z pinem NIE_ZMIERZONO); (d) 14 głośnych delegatów K06B (D4), 2 głośne K07A ext (D2), 44 atrapy K07B (D7). Zakres pinu i pin-exec względem `edb8fb56` NIE_ZMIERZONO w tej rundzie.
DEPLOY/PUSH: NIE WYKONANO

Nota: Operator nie integruje, nie pushuje (C-zakaz). Lista długu: `dyspozycje/rust-port/p5/P5-8-K09B.md` §5.
