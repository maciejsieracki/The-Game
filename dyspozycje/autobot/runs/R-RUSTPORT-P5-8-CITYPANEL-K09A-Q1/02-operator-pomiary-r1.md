STATUS: FAIL (etap Operator-pomiary: pin-exec i mutacje behawioralne NIE wykonane; bramki statyczne i drift zielone)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K09A-Q1
GOAL: Pomiary 9 jednostek K09A (`src-tauri/frontend-v2/src/ui/cityPanel/k09a-*.ts`) po Operator-impl (`7bc809a2`): pin-exec, mutacje, dryf względem head.
ZMIANY/COMMIT: checkout --detach 7bc809a2 (baza impl). Zmiany tego etapu: `tools/dom-harness/measure-k09a-drift.mjs` (NOWY, w allowliście `tools/**`); `dyspozycje/rust-port/p5/P5-8-K09A.md` §6–§7 (wyniki dryfu i mutacji); `runs/R-RUSTPORT-P5-8-CITYPANEL-K09A-Q1/02-operator-pomiary-r1.md`; `runs/.../pomiary-logi/*`. Kod portu NIEZMIENIONY. Push NIE. Zero zmian w `gra/**`, rust-port, WERSJE.md, package.json.
TESTY (`npm ci` w `src-tauri/frontend-v2` wykonane, EXIT 0):
- `npx tsc --noEmit`: EXIT 0, 0 błędów (log `pomiary-logi/tsc.txt`).
- `npm run check`: EXIT 0; check-no-logic-imports trafień=0 (220 plików); verify-pin-copies pin=edb8fb56 plików=435 niezgodnych=0 (log `check.txt`).
- `verify-k09a-copies.mjs --pin-file <pin>`: EXIT 0; bloków=9 jednostek=9 hunków=42 problemów=0 (log `verify-k09a-copies-pin.txt`).
- `run-k09a-deps.mjs`: EXIT 0; 5/5 zgodnych (log `run-k09a-deps.txt`).
- `measure-k09a-drift.mjs --head-pin-dir <origin/main 9f6f7771 gra/src>`: EXIT 0; 9/9 jednostek SAME (LCS 0 różnych linii); zakresy przesunięte (log `measure-k09a-drift.txt`).
- Mutanty tekstowe (6 szt., `mutate-k09a-copies.mjs`): verify-k09a-copies EXIT 1 dla każdego (M1 kolejność setK07aUxSectionRefresh/setK07aActiveCity; M2 usunięcie setK06aActive; M3 map→null; M4 usunięcie ensureCityPanelStyles; M5 stała scalePx; M6 usunięcie clearGarrisonPanel). Logi `mutant-M*-verify-copies.txt`.
- Rust (fmt/clippy/test): NIE_DOTYCZY — w diffie f18a18c3..HEAD brak plików `.rs`/`src-tauri/src`.
- NIE_ZMIERZONO: pin-exec harness (`--pin-dir`, jsdom) dla 9 jednostek — NIE napisany w tej rundzie; mutacje behawioralne (wykonanie) — 0/6 wykrytych testem wykonania, bo taki test nie istnieje; test wykonania `k09aWiring.ts` (jsdom) — NIE zrobiony.
BLOKADY: brak blokad zewnętrznych. Brak pin-exec jest luką wykonania etapu (dispatch wymaga go w tym etapie), nie blokadą infrastruktury.
ZAŁOŻENIE (rozstrzygnięcie luki bez pytania ABC): pin-exec odłożony do rundy 2 jako pierwszy punkt NASTĘPNEGO KROKU; wynik tej rundy oceniany jako FAIL, bo kryterium „mutacje pól DTO wykrywane” nie jest spełnione behawioralnie.
RUNDY: 2/5 (ta runda Operator-pomiary; ostatni werdykt impl = PASS-WITH-NOTES, runda 1)
NASTĘPNY KROK: Operator (ten sam ID, runda 2): napisać `tools/dom-harness/run-k09a-pin.mjs` (pin-exec 9 jednostek z pinu z warstwą stanu pinu i porównaniem DOM z portem na tych samych scenariuszach), mutacje behawioralne kolejności `paintCityPanelSections` i stanu `activeCity`/`activeMap`/`activeOnClose`/`rootEl`, test wykonania `k09aWiring.ts` w jsdom; następnie Evaluator i Final Control.
DEPLOY/PUSH: NIE WYKONANO
