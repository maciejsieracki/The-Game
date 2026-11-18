# 02-evaluator — R-RUSTPORT-P4-371-T0-BRIDGE-CONTRACT-ROOT (= #374), runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (kontrakt mostu i powłoki, testy engine)
TEMAT: R-RUSTPORT-P4-371-T0-BRIDGE-CONTRACT-ROOT
GOAL: root `tests/bridge_contract.rs` przeniesiony do `rust-port/engine/tests/bridge_contract.rs` (kompilowany przez CI engine), z `match` wyczerpującym po wszystkich wariantach `EngineCommand` i `BridgeResult`.
OCENIANY COMMIT: `04e786472` (gałąź `rust-port-wip/P4-371-T0-bridge`), rodzic `38f5939e2` = parity-v2 w chwili startu Operatora.
BAZA DZIŚ: `origin/rust-port/parity-v2` = `d21caf8f2` (DOC-DEBTS-R2 dołożone w trakcie). `git merge-tree --write-tree d21caf8f2 04e786472` daje czyste drzewo `1614e42ea`, bez konfliktów. `git diff --stat 38f5939e2 d21caf8f2 -- tests rust-port/engine/src/bridge.rs src-tauri` jest pusty, więc baza nie rusza plików tematu.

## ZMIANY/COMMIT (allowlista)

`git diff -M --stat 38f5939e2 04e786472`:
- `tests/bridge_contract.rs` → `rust-port/engine/tests/bridge_contract.rs` (rename, podobieństwo 61%, +135/−3),
- `dyspozycje/.../01-operator-r1.md` (nowy).

Nic więcej. `bridge.rs`, `src-tauri/**`, `Cargo.toml`/`Cargo.lock` i inne testy są nietknięte. Allowlista dotrzymana. `git diff --check 38f5939e2 04e786472` jest czysty. Commit nie ma linii Co-Authored-By z nazwą modelu.

Plik spoza allowlisty, którego ten temat dotyka pośrednio (bez zmian, raport Operatora go NIE wymienia), opisuję w N2.

## Zgodność z dispatchem i D-371-6

| Wymóg | Wynik |
|---|---|
| Przeniesienie, nie skasowanie; `#[path = "../src/bridge.rs"]` | TAK (`:9`) |
| `include_str!("../../../src-tauri/src/lib.rs")` | TAK (`:19`). Ścieżka prowadzi z `rust-port/engine/tests/` do root `src-tauri/src/lib.rs`. CI engine robi pełny checkout (`actions/checkout@v4` bez sparse), więc plik jest dostępny |
| Asercje napisów powłoki zachowane | TAK. Diff nie ma żadnego hunka w `tauri_shell_wires_the_same_command_and_event_contract` |
| `state_from` z jawnymi ramionami `RenderLayers`/`RenderMap`/`RenderFrame` (panic z nazwą), bez `_ =>` | TAK (`:21-28`) |
| `match` wyczerpujący po `EngineCommand` (11 wariantów) i `BridgeResult` (4) | TAK. `command_kind` (`:32-46`) i `result_kind` (`:49-56`) bez `_ =>`. Lista wariantów zgadza się z `bridge.rs:28-87` i `:129-146` |
| Test `GetRenderMap`/`GetRenderFrame` przez `EngineBridge<CivEngineAdapter>` → `events.is_empty()` + właściwy wariant | TAK (`render_queries_through_real_adapter_answer_their_variant_without_events`, także `GetRenderLayers`) |
| Asercje dotychczasowe 1:1 | TAK, z jednym wyjątkiem: `players[0].id == 1` → `== civ_engine::PlayerId::new(1)`. Wymusza to typ (`EnginePlayer.id: PlayerId`), semantyka jest ta sama. Wyjątek przyjmuję |
| Brak `#[ignore]` | TAK (`grep '#\[ignore'` = 0 trafień) |
| CI | `.github/workflows/rust-engine.yml` uruchamia `cargo test --all-targets` i `cargo clippy --all-targets -- -D warnings` w `rust-port/engine` (Linux + Windows), więc nowy plik jest w CI |

Pin `07d2fbd72`: nie dotyczy, bo temat nie zawiera gameplayu (kontrakt mostu). Nie ma wektorów do sprawdzenia.

## TESTY (odtworzone niezależnie; `CARGO_TARGET_DIR` w scratchpadzie `t0bridge-eval/tgt`, INCREMENTAL=0, DEBUG=0; target usunięty po bramkach)

| Bramka (w `rust-port/engine`) | EXIT | Wynik |
|---|---|---|
| `cargo fmt --all -- --check` | 0 | — |
| `cargo clippy --all-targets -- -D warnings` | 0 | Finished 1m27s |
| `cargo test --test bridge_contract` | 0 | 9 passed / 0 failed / 0 ignored: 8 testów pliku + 1 unit `bridge::add_player_atomicity_tests` przez `#[path]` |
| `cargo test --all-targets --no-fail-fast` (tło, `setsid nohup`, `EXIT=` w logu) | 0 | 532 binarki, 3997 passed / 0 failed / 1 ignored. Ignorowany jest dotychczasowy `e2e::dump_tick1_econ_for_web_generator`, spoza tematu |

Liczby są identyczne z raportem Operatora. Dysk przed pełną bramką: 12–13 GB wolnego. Równolegle szedł jeden obcy build engine (`wf_79ae731c-340-2`), żadnego builda renderera.

## Mutanty (wykonane przeze mnie, tymczasowe; po każdym przywrócone, `cmp`/porównanie z kopią = identyczne, `git status` czysty)

| # | Mutant | Oczekiwanie | Wynik |
|---|---|---|---|
| M1 | Nowy wariant `EngineCommand::MutantProbe` w `bridge.rs` **z** ramionami w obu adapterach `bridge.rs` (sam `bridge.rs` się kompiluje, co dowodzi `cargo test --test bridge_add_player --no-run` = EXIT 0) | błąd kompilacji TYLKO w teście kontraktu | **ZABITY**: `--no-run` EXIT 101, `error[E0004]: non-exhaustive patterns: &bridge::EngineCommand::MutantProbe not covered --> tests/bridge_contract.rs:33:11`. To mocniejszy dowód niż mutant Operatora, bo tam błąd dawały też adaptery `bridge.rs` |
| M2 | Nowy wariant `BridgeResult::MutantResult` (bridge.rs kompiluje się sam: `bridge_add_player --no-run` = 0) | błąd kompilacji testu | **ZABITY**: EXIT 101, dwa E0004 w `tests/bridge_contract.rs:22:11` (`state_from`) i `:50:11` (`result_kind`) |
| M3 | Usunięta próbka `DeclareWar` z `every_command()` | test „one sample per variant” powinien wykryć | **PRZEŻYŁ**: EXIT 0, 9 passed (patrz N1) |
| M4 | `#[serde(rename = "render_map")]` na `GetRenderMap` (zmiana wire `kind`) | FAIL | **ZABITY**: `every_command_serializes_with_its_wire_kind_and_round_trips` panic `:103` |
| M5a | Usunięty wczesny return `GetRenderMap` w `EngineBridge::handle` (odpowiedź `State` + `StateChanged`) | FAIL | **ZABITY**: `render_queries_…` panic `:139` (events niepuste) |
| M5b | to samo dla `GetRenderFrame` | FAIL | **ZABITY** (`:139`) |
| M5c | to samo dla `GetRenderLayers` | FAIL | **ZABITY** (`:139`) |

Główne kryterium D-371-6 (nowy wariant bez ramienia łamie kompilację testu) jest udowodnione niezależnie od wyczerpujących `match` w samym `bridge.rs`.

## UWAGI (nie blokują)

- **N1 (mutant M3 przeżywa, asercja mówi więcej, niż sprawdza):** w `every_command_serializes_with_its_wire_kind_and_round_trips` (`:94-100`) `assert_eq!(kinds.len(), commands.len(), "one sample per variant")` sprawdza tylko UNIKALNOŚĆ próbek, a nie ich KOMPLETNOŚĆ. Komentarz `every_command` (`:58`) „kept in sync by `command_kind`” jest nieprawdziwy. Gdy ktoś doda wariant i ramię w `command_kind`, ale nie doda próbki, test przejdzie, a nowy wariant nie będzie miał sprawdzonego wire `kind` ani round-tripu. To wykracza poza minimalny zakres dispatchu (test jest dodatkowy), ale naprawa jest jednolinijkowa i mieści się w allowliście. Proponuję jedno z dwóch: `assert_eq!(kinds.len(), 11)` ze stałą opisaną jako liczba wariantów `EngineCommand`, albo pomocniczą funkcję z wyczerpującym `match`, która każdemu wariantowi przypisuje indeks i wymaga pokrycia wszystkich indeksów. Do decyzji Obrony/FC: poprawka w r2 albo przyjęcie jako uwagi.
- **N2 (pośredni skutek poza allowlistą, przemilczany w raporcie Operatora):** `tests/bridge_contract.cjs:307` (root) nadal kompiluje `path.join(repository, 'tests', 'bridge_contract.rs')` przez `rustc --test`. Po przeniesieniu ten harness Node odwołuje się do nieistniejącego pliku. Żaden workflow CI ani `package.json` go nie uruchamia (`git grep bridge_contract` poza `dyspozycje/`). Już przed tematem był martwy, bo stary root-plik się nie kompilował: E0004 w `state_from` i E0308 dla `PlayerId`. Regresji w CI więc nie ma. Harness zawierał jednak behawioralne sondy powłoki Tauri (`createTauriProbe`/`runTauriProbe`, mutacje rejestracji komendy i zdarzenia), których nowy test engine NIE zastępuje: nowy test sprawdza tylko napisy `include_str!`. Rekomenduję mikrotemat orkiestratora: przepiąć `.cjs:307` na `rust-port/engine/tests/bridge_contract.rs` albo jawnie wycofać harness i zapisać to w REJESTR-RUST. Zgodnie z dispatchem w tym temacie tego nie zmieniam.
- **N3 (nieaktualne komentarze, poza allowlistą):** `rust-port/engine/src/bridge.rs:22-24` i `:123-125` nadal mówią o „root `tests/bridge_contract.rs`, outside this topic's allowlist”. Operator zgłosił tylko pierwsze miejsce. Wchodzi do tego samego mikrotematu dokumentacyjnego co N2.
- **N4 (zakres CI):** filtr `paths` w `rust-engine.yml` obejmuje tylko `rust-port/engine/**` i sam workflow. Zmiana wyłącznie w `src-tauri/src/lib.rs` (np. T3) NIE uruchomi tego testu w CI, mimo że test asertuje napisy z tego pliku przez `include_str!`. T3 ma w kryteriach „test engine `bridge_contract` zielony”, więc lokalnie jest to pokryte. Do rozważenia przez orkiestratora: dopisać `src-tauri/src/lib.rs` do `paths`, osobnym tematem, bo plik CI jest poza tą allowlistą.

## BLOKADY

Brak.

## WERDYKT

PASS-WITH-NOTES. Kryteria końca dispatchu są spełnione i odtworzone: kompilacja i test zielone, mutant „nowy wariant bez ramienia” daje błąd kompilacji testu, `git diff --check` jest czysty, pełny engine ma EXIT 0. N1 jest jedynym zarzutem do kodu tematu. Jest słaby, bo dotyczy dodatkowego testu, ale łatwo go naprawić w allowliście. N2–N4 wymagają mikrotematów poza allowlistą.

RUNDY: 1/5
NASTĘPNY KROK: Obrona Operatora (`02a-obrona.md`): odpowiedź na N1 (poprawka albo uzasadnienie). Potem Final Control. N2–N4 przekazuję orkiestratorowi jako kandydatów na mikrotemat.
DEPLOY/PUSH: NIE WYKONANO
