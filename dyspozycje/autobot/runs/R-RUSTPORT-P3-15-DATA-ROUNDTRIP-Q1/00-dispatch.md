STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P3-15-DATA-ROUNDTRIP-Q1
GOAL: Domknij lukę z P3.11 (patrz `04-orchestrator-disposition.md` tamtego tematu): test 1:1 „sparsowane struktury -> serde_json::Value == surowy JSON”
działa dziś tylko dla 7 plików cywilizacji (tylko `civilizations.rs` ma `Serialize`). Dodaj `Serialize` do struktur w pozostałych
modułach danych i test round-trip dla WSZYSTKICH 29 plików `rust-port/engine/data/*.json`; wykryj pola gubione cicho (brak
`deny_unknown_fields`) i zamknij je tam, gdzie to bezpieczne.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5 medium
  (wyjątek rust-port, R-PROC-AUTOBOT.md §5a — rozstrzygnięty, NIE pytaj o model). Przez agent() w Workflow, Operator w izolowanym worktree.

KONTEKST
Dwie gałęzie: `rust-port/parity-v2` (kod, TU pracujesz) i `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (dokumentacja; czytaj przez
`git fetch origin claude/sprawdzenie-funkcjonalnosci-ek4ra0 && git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:<ścieżka>`).
PIERWSZY KROK: `git fetch origin rust-port/parity-v2 && git checkout --detach origin/rust-port/parity-v2`; baza musi zawierać `aa7b225b`
(P3.14) lub nowszy. Baseline: `cargo test --offline` PRZED zmianami (oczekiwane 292 passed).
Przeczytaj: `dyspozycje/autobot/runs/R-RUSTPORT-P3-11-DATA-COMPLIANCE-Q1/04-orchestrator-disposition.md`, `dyspozycje/rust-port/p3/P3-11-DATA-COMPLIANCE.md`
(§6 = luka), `rust-port/engine/tests/data_compliance.rs`, moduły `src/data/*.rs`, `src/data/loader.rs`.
KOSZT DYSKU: `CARGO_INCREMENTAL=0 CARGO_TARGET_DIR=/home/user/cargo-target-shared CARGO_PROFILE_DEV_DEBUG=0 cargo test --offline`.
Nie twórz `target/` w worktree, nie commituj `Cargo.lock`.

ZADANIE
1. Dla struktur w `buildings_tech.rs`, `economy_society.rs`, `economy_society_part2.rs`, `terrain_map.rs`, `units_combat.rs` (i innych bez `Serialize`)
   dodaj `Serialize` do derive. Zero zmian nazw pól, typów ani zachowania deserializacji.
2. W `tests/data_compliance.rs` (TYLKO dopisując nowe testy; istniejących nie zmieniaj) dodaj round-trip: parse -> `serde_json::to_value` -> porównaj z
   `serde_json::from_str::<Value>(oryginał)` dla każdego z 29 plików (przez loader z P3.12 albo moduły `parse_*`).
3. Rozbieżności (pola gubione, liczby f64 vs całkowite, `Option` z `skip_serializing_if`, kolejność tablic) nie osłabiaj po cichu: napraw w strukturze
   (`#[serde(...)]`), albo jawnie wylistuj w dokumencie jako ustalenie z dowodem, z `#[ignore = "<powód>"]` TYLKO dla konkretnego pliku.
4. Nieznane klucze: wskaż moduły bez `deny_unknown_fields`; dodaj, gdzie test round-trip to potwierdza jako bezpieczne.

ANTY-HALUCYNACYJNA REGUŁA
Zakaz „testy przechodzą” bez surowego, pełnego logu `cargo test` z `echo "EXIT=$?"` wklejonego do dokumentu (nie wyciąg, nie streszczenie; Evaluatorzy
odrzucali to w P3.8b/P3.11/P3.12). Liczby podawaj tylko z własnego przebiegu; baseline zmierz, nie przepisuj.

BINARNE KRYTERIUM SUKCESU
Round-trip dla 29/29 plików przechodzi (lub każdy wyjątek jawnie `#[ignore]` z dowodem), `cargo test --offline` EXIT=0, liczba testów > baseline,
żaden istniejący test nie zniknął, `rustfmt --check` czysty na zmienionych plikach, surowy log w `dyspozycje/rust-port/p3/P3-15-DATA-ROUNDTRIP.md`.

ALLOWLISTA
Dokument: `dyspozycje/rust-port/p3/P3-15-DATA-ROUNDTRIP.md` (NOWY), `dyspozycje/autobot/runs/R-RUSTPORT-P3-15-DATA-ROUNDTRIP-Q1/**`.
Worktree: `rust-port/engine/src/data/{buildings_tech,economy_society,economy_society_part2,terrain_map,units_combat}.rs`, `rust-port/engine/tests/data_compliance.rs`.
Zero zmian w `domain/**`, `bridge.rs`, `loader.rs`, `mod.rs`, `Cargo.toml`, `lib.rs`, `gra/**`. (Równolegle: P3.16 `tests/data_{buildings_tech,civilizations,economy_society,units_combat}.rs`,
`loader.rs`-fmt, `bridge.rs` — nie dotykaj; P4.0 to dokument.)

IZOLACJA: `isolation: worktree`, baza `origin/rust-port/parity-v2`. Commit w worktree (jawne `git add`, NIGDY `-A`), PUSH NIE.
PROCEDURA NAPRAWCZA PRZY FAIL: ten sam ID; po 5 rundach LIMIT-5-EXCEEDED. Raport max ok. 400 słów.
FORMAT ODPOWIEDZI: STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
