# 03-final-control — R-RUSTPORT-P4-371-T0-BRIDGE-CONTRACT-ROOT (= #374), runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (kontrakt mostu i powłoki, testy engine)
TEMAT: R-RUSTPORT-P4-371-T0-BRIDGE-CONTRACT-ROOT
GOAL: root `tests/bridge_contract.rs` przeniesiony do `rust-port/engine/tests/bridge_contract.rs` (kompilowany przez CI engine), z `match` wyczerpującym po wszystkich wariantach `EngineCommand` i `BridgeResult`.

## Co oceniam
- Kod do integracji: `cdb012310` (Obrona r1, gałąź `op/P4-371-T0-obrona`) na `04e786472` (Operator r1). Rodzic: `38f5939e2` = parity-v2 w chwili startu.
- `02-evaluator.md` leży w osobnym commicie `71712e696` (rodzeństwo Obrony, nie przodek `cdb012310`). Przeniosłem go do commitu FC bez zmian (`git checkout 71712e696 -- …/02-evaluator.md`), żeby łańcuch raportów był kompletny w jednej linii.
- Baza dziś: `origin/rust-port/parity-v2` = `d21caf8f2`. `git merge-tree --write-tree d21caf8f2 cdb012310` daje czyste drzewo `3ba733d95`. Między `38f5939e2` a `d21caf8f2` zmieniły się w `rust-port/engine/tests` tylko komentarze w `p4_1q6_2_build_highlight.rs` i `view_overlays_build.rs`. `tests/`, `src-tauri/` i `bridge.rs` są nietknięte.

## Allowlista (sprawdzona samodzielnie)
`git diff -M --name-status 38f5939e2 cdb012310`:
- `R055 tests/bridge_contract.rs → rust-port/engine/tests/bridge_contract.rs`
- `A …/01-operator-r1.md`, `A …/02a-obrona.md`

W commicie FC dochodzą tylko `02-evaluator.md` (kopia) i ten raport. `bridge.rs`, `src-tauri/**`, `Cargo.*`, `.github/**`, `tests/*.cjs` i inne testy są nietknięte. `git diff --check 38f5939e2 cdb012310` jest czysty. Brak `#[ignore]` w pliku (0 trafień słowa `ignore`). Commity tematu nie mają linii Co-Authored-By.

## Zgodność z D-371-6 (sprawdzona na pliku)
- `#[path = "../src/bridge.rs"]` jest. `include_str!("../../../src-tauri/src/lib.rs")` wskazuje root `src-tauri/src/lib.rs`, który istnieje (katalogu `rust-port/src-tauri` NIE MA).
- Asercje powłoki są zachowane: `diff` sekcji `tauri_shell_wires_the_same_command_and_event_contract` stary/nowy = identyczna (SHELL_SAME).
- Pięć dotychczasowych testów jest 1:1 ze starym plikiem. Jedyna różnica: `players[0].id == 1` → `== civ_engine::PlayerId::new(1)`. Wymusza to typ, semantyka jest ta sama. Przyjmuję.
- Dopasowania bez `_ =>`: `state_from` (4 ramiona `BridgeResult`), `command_index` (11 ramion `EngineCommand`) i `result_kind` (4). Obejmuje to `GetRenderLayers`, `GetRenderMap`, `GetRenderFrame`, `RenderLayers`, `RenderMap` i `RenderFrame`.

## BRAMKI (FC, `rust-port/engine`, `CARGO_TARGET_DIR` = scratchpad `t0bridge-fc/tgt`, INCREMENTAL=0, DEBUG=0; target usunięty po bramkach)
| Bramka | EXIT | Wynik |
|---|---|---|
| `cargo fmt --all -- --check` | 0 | — |
| `cargo clippy --all-targets -- -D warnings` | 0 | Finished 1m17s |
| `cargo test --test bridge_contract` | 0 | 9 passed / 0 failed / 0 ignored (8 testów pliku + 1 unit `bridge::add_player_atomicity_tests` przez `#[path]`) |
| `cargo test --all-targets --no-fail-fast` (tło, `setsid nohup`, `EXIT=` w logu) | 0 | 532 binarki, 3997 passed / 0 failed / 1 ignored (dotychczasowy `e2e::dump_tick1_econ_for_web_generator`, spoza tematu) |
| `git diff --check` | 0 | czysty |

Dysk przed pełną bramką: 8,4 GB wolnego (próg dispatchu 8 GB). W trakcie: minimum 5,2 GB. Równolegle szedł jeden obcy pełny build engine (`wf_79ae731c-340-3`), żadnego builda renderera. Po usunięciu targetu: 9,9 GB.

## Mutanty FC (tymczasowe; po każdym plik przywrócony z kopii, `cmp` = identyczny, `git status` czysty)
| # | Mutant | Wynik |
|---|---|---|
| M1 | `EngineCommand::MutantProbe` w `bridge.rs` **z** ramionami w obu adapterach (`:431`, `:586`), więc sam `bridge.rs` kompiluje się: `cargo test --test bridge_add_player --no-run` = EXIT 0 | **ZABITY**: `--test bridge_contract --no-run` EXIT 101, `error[E0004]: non-exhaustive patterns: &bridge::EngineCommand::MutantProbe not covered --> tests/bridge_contract.rs:51:11` (`command_index`). To kryterium końca dispatchu. |
| M3 | Usunięta próbka `DeclareWar` z `every_command()` | **ZABITY**: panic `:137` `every_command misses samples: ["declare_war"]`, EXIT 101 |
| M3b | Próbka `DeclareWar` zastąpiona drugim `GetState` (duplikat) | **ZABITY**: panic `:125` `duplicate sample for get_state`, EXIT 101 |

M2, M4 i M5a–c Evaluatora (wariant `BridgeResult`, zmiana wire `kind`, usunięty wczesny return zapytań renderera) dotyczą kodu, którego Obrona nie zmieniła (`state_from`, `result_kind`, `render_queries_…`, pętla round-trip bez zmian). Nie powtarzałem ich.

## Orzeczenia zarzutów
| Zarzut | Orzeczenie | Uzasadnienie |
|---|---|---|
| N1: `every_command` nie był sprawdzany pod kątem kompletności (M3 przeżywał) | **ODDAL** (naprawione w Obronie) | `COMMAND_KINDS` + wyczerpujący `command_index` + asercje pokrycia/duplikatu/unikalności. M3 i M3b zabite przez FC. Ograniczenie wskazane przez Obronę (ramię `=> 11` bez wpisu w `COMMAND_KINDS`) daje dziś panic indeksu poza zakresem w `command_kind`, ale dopiero w czasie testu. Bez derive enumeracji wariantów (`Cargo.toml` poza allowlistą) nie da się tego zrobić lepiej. Akceptowalne. |
| N2: `tests/bridge_contract.cjs:307` wskazuje usunięty root `.rs` | **ODDAL** w tym temacie | Poza allowlistą (dispatch: tylko usunięcie root `.rs` + nowy test + raporty). Harness był martwy już przed tematem (stary plik się nie kompilował), żaden CI ani `package.json` go nie woła (`git grep bridge_contract` poza `dyspozycje/` = tylko `bridge.rs:23,124`, nowy test i `.cjs:307`). Regresji nie ma. Mikrotemat orkiestratora (przepięcie albo wycofanie harnessu, decyzja techniczna → REJESTR-RUST). |
| N3: nieaktualne komentarze `bridge.rs:23` i `:124` („root `tests/bridge_contract.rs`”) | **ODDAL** w tym temacie | Dispatch: „NIE ruszaj `bridge.rs`”. Mikrotemat dokumentacyjny. |
| N4: filtr `paths` w `rust-engine.yml` nie obejmuje powłoki Tauri | **ODDAL** w tym temacie | `.github/**` jest poza allowlistą. Fakt potwierdzony (`:5-11` tylko `rust-port/engine/**` i plik workflow). Korekta faktu w `02a-obrona.md`: powłoka to **root `src-tauri/src/lib.rs`**, nie `rust-port/src-tauri/...` (taki katalog nie istnieje). Mikrotemat CI musi dopisać `src-tauri/src/lib.rs` (albo `src-tauri/**`). |

Brak zarzutów NAPRAW. Nie ma też zarzutów DO DECYZJI CZŁOWIEKA, bo N2–N4 są technicznymi decyzjami orkiestratora, a nie gameplay ani odstępstwem od webu.

## Uwagi dla integracji
- Integrować `cdb012310` (albo commit FC na nim, który zawiera dodatkowo `02-evaluator.md` i ten raport). `git merge-base --is-ancestor 04e786472 cdb012310` jest prawdą, więc kod Operatora jest w środku.
- Merge na `d21caf8f2` jest bez konfliktów (drzewo `3ba733d95`).

## BLOKADY
Brak.

RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora na `rust-port/parity-v2`. Mikrotematy N2 (BRIDGE-CJS-HARNESS), N3 (BRIDGE-COMMENTS-STALE) i N4 (CI-ENGINE-PATHS-TAURI, ścieżka root `src-tauri/`) idą do kolejki/REJESTR-RUST.
DEPLOY/PUSH: NIE WYKONANO
