STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-WOJNA-NOWE-C-Q1
GOAL: REPIN krok 2a, część C: port `gra/src/game/ai-move-range.ts` (+112) i `gra/src/game/diplomacy-tick-war-brake.ts` (+216) z pinu 91dc998a do `rust-port/engine/src/domain/{ai_move_range,diplomacy_tick_war_brake}.rs`, z wektorami z uruchomionego weba i mutacjami.
ZMIANY-COMMIT:
- `d187d3aa` batch 1: ai_move_range (4 funkcje), testy, wektory `ai-move-range.json`, generator.
- `e978bdc4` batch 2: war brake flaga + advanceCrisisCounter + crisisStepForPair + crisisPairKey.
- `836b7132` batch 3: krokPktWymiany, tradeTrustBonusPerTura, parseCrisisCounters, sortCrisisQueue, `data/derived/diplomacy-tick-params.json`. Uwaga: wektor `diplomacy-tick-war-brake.json` trafil dopiero w batchu 4 (include_str w testach batchy 2-3 nie kompiluje sie na tych SHA).
- `d187d1c6` batch 4: pickWarDeclarer, dobraWolaTurnStep, isAiAiEligibleOwner, aiAiPairs, wektor war-brake, poprawka klippy (NaN-guardy jako `is_nan() || cmp`, ta sama tablica prawdy).
- Commit dokumentacji/logów: SHA w ostatniej linii tej odpowiedzi (`dyspozycje/rust-port/p6/P6-REPIN-WOJNA-NOWE-C.md`, ten raport, logi, `mutate-c.py`).
TESTY:
- `cargo fmt --all -- --check`: EXIT 0 (`fmt-c-r1.log`).
- `cargo clippy --all-targets -- -D warnings`: EXIT 0 (`clippy-c-r1.log`).
- `cargo test --no-fail-fast`: 1347 passed / 0 failed (baza 1313 + 12 move range + 22 war brake) (`test-c-r1.log`).
- Wektory z URUCHOMIONEGO weba 91dc998a (generator `gen-repin-wojna-c-web-vectors.mjs`): ai-move-range.json 1,38 MB, diplomacy-tick-war-brake.json 1,56 MB; 0 rozbieżności.
- Mutacje (`mutate-c.py`, logi `mut-c-*.log`): 30 zabitych (R01-R12, D01-D18); R13 przeżyła = mutant równoważny (dowód w dossier); brak osłabienia asercji.
BLOKADY: brak. Cargo.lock wygenerowany lokalnie, nie commitowany.
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora po Evaluator/Final Control; kolejna część (osobne ID): WOJNA-ZMIANY (`forced-war-*`, `armyMerge.ts`, `planned-march.ts`).
DEPLOY/PUSH: NIE WYKONANO

Założenia (pełna lista Z1-Z8 w dossier `dyspozycje/rust-port/p6/P6-REPIN-WOJNA-NOWE-C.md`): `hex_costs` zamiast `terrainMoveCost`; flaga override jako argument (brak stanu globalnego); liczby JS jako f64 z `js_max/js_min/js_pow`; tabela P7 jako `BTreeMap<i64,f64>`; remis w `pickWarDeclarer` = nizszy ownerId.
Pin w manifestach nie przesunięty. `gra/`, `renderer/`, `src-tauri/`, `Cargo.toml`, `WERSJE.md` nietknięte.
