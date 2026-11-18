# R-RUSTPORT-P4-371-T0-BRIDGE-CONTRACT-ROOT — kontrakt powłoki i mostu w testach engine (= #374)

STATUS: dispatch orkiestratora. Opus (3D/DTO), wszystkie etapy Opus. Podstawa: `dyspozycje/autobot/runs/R-RUSTPORT-P4-371-CLIENT-ROZP-Q1/00-rozpoznanie.md` §3 (T0), §4 (D-371-6). Czytaj je PIERWSZE.
BAZA: `origin/rust-port/parity-v2` w chwili startu (wpisz SHA w raporcie). Przed startem: `git fetch origin && git checkout -B <gałąź> origin/rust-port/parity-v2`.
## GOAL
Kontrakt powłoki (`src-tauri/src/lib.rs`) i mostu (`engine/src/bridge.rs`) z root `tests/bridge_contract.rs` — który dziś NIE jest kompilowany przez żaden manifest ani CI i ma niewyczerpujący `match` (`:15-19`) — przenieść do `rust-port/engine/tests/bridge_contract.rs` (kompilowany i uruchamiany przez CI engine), z `match` WYCZERPUJĄCYM po wszystkich wariantach `EngineCommand` i `BridgeResult` (w tym `GetRenderLayers`, `GetRenderMap`, `GetRenderFrame`, `RenderLayers`, `RenderMap`, `RenderFrame`).
## DECYZJA D-371-6
Przenieść (nie kasować): ścieżki `#[path = "../src/bridge.rs"]` i `include_str!("../../../src-tauri/src/lib.rs")`; asercje napisów powłoki zachować; nowy wariant w `bridge.rs` ma łamać kompilację testu (to cel wyczerpującego `match`).
## ALLOWLISTA
Usunięcie `tests/bridge_contract.rs` (root); nowy `rust-port/engine/tests/bridge_contract.rs`; raporty runu. NIE ruszaj `bridge.rs`, `src-tauri/**`, `Cargo.toml`/`Cargo.lock`, innych testów.
## KRYTERIA KOŃCA
Test kompiluje się i przechodzi w `cargo test --test bridge_contract` w engine; mutant „dodaj wariant do EngineCommand bez ramienia w teście” → błąd kompilacji (udokumentuj dowodem, np. tymczasowa zmiana przywrócona); `git diff --check` czysty.
## BRAMKI (EXIT 0)
`cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --test bridge_contract`; pełny `cargo test --all-targets --no-fail-fast` w tle (`setsid nohup`, EXIT w logu). Dysk >= 8 GB przed pełną bramką; unikalny podkatalog scratchpadu `t0bridge/…`, target usuń po bramkach. Brak `#[ignore]`, brak push/deploy, brak linii Co-Authored-By z nazwą modelu. Raporty: `01-operator-r1.md`, `02-evaluator.md`, `02a-obrona.md`, `03-final-control.md`; po FC integruje orkiestrator.
